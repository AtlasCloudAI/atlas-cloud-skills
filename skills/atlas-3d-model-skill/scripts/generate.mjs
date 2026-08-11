#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  createWriteStream,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { pathToFileURL } from "node:url";

const DEFAULT_BASE_URL = "https://api.atlascloud.ai";
const DEFAULT_TEXT_MODEL = "tencent/hunyuan3d-rapid/text-to-3d";
const DEFAULT_IMAGE_MODEL = "bytedance/seed3d-v2.0/image-to-3d";
const DEFAULT_MAX_COST_USD = 1;
const DEFAULT_MAX_WAIT_SECONDS = 1_200;
const DEFAULT_POLL_INTERVAL_SECONDS = 3;
const DEFAULT_REQUEST_TIMEOUT_MS = 45_000;
const MAX_LOCAL_IMAGE_BYTES = 10 * 1024 * 1024;
const TERMINAL_SUCCESS = new Set(["completed", "succeeded"]);
const TERMINAL_FAILURE = new Set(["failed", "timeout", "canceled", "cancelled"]);
const FORMAT_EXTENSIONS = new Map([
  ["GLB", "glb"],
  ["OBJ", "obj"],
  ["USD", "usd"],
  ["USDZ", "usdz"],
  ["FBX", "fbx"],
  ["STL", "stl"],
  ["MP4", "mp4"],
]);

class HttpError extends Error {
  constructor(message, status, body = "") {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.body = body;
  }
}

function usage() {
  return `Atlas Cloud 3D model generator

Usage:
  node generate.mjs --prompt TEXT [options]
  node generate.mjs --image FILE [options]
  node generate.mjs --image-url URL [options]
  node generate.mjs --resume PREDICTION_ID [options]

Input (choose one):
  --prompt TEXT            Text-to-3D input
  --image FILE             Local image-to-3D input (PNG/JPEG/WebP/BMP)
  --image-url URL          Remote image-to-3D input
  --resume ID              Resume an existing prediction without resubmitting

Output and model options:
  --output-dir DIR         Output directory (default: timestamped directory)
  --output FILE            Exact model output path
  --format FORMAT          GLB/OBJ/USDZ/FBX/STL/MP4 for text; glb/obj/usd/usdz for image
  --model ID               Compatible Atlas 3D model override
  --pbr                    Enable PBR when the live schema supports enable_pbr
  --geometry               Request geometry-only output when supported
  --subdivision LEVEL      Seed3D low/medium/high subdivision

Safety and recovery:
  --dry-run                Verify live catalog/schema/price without upload or submission
  --max-cost USD           Refuse a request above this live price (default: 1)
  --allow-unknown-cost     Permit a model whose live catalog has no numeric price
  --max-wait SECONDS       Local polling window (default: 1200)
  --poll-interval SECONDS  Poll interval (default: 3)
  --json                   Print the final plan/manifest as JSON
  --help                   Show this help

Environment:
  ATLASCLOUD_API_KEY       Atlas Cloud API key (preferred)
  ATLAS_CLOUD_API_KEY      Compatibility alias
`;
}

function timestampSlug(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\..+/, "").replace("T", "-");
}

function parseNumber(value, flag, { minimum = 0, exclusiveMinimum = false } = {}) {
  const parsed = Number(value);
  const invalidMinimum = exclusiveMinimum ? parsed <= minimum : parsed < minimum;
  if (!Number.isFinite(parsed) || invalidMinimum) {
    const comparison = exclusiveMinimum ? ">" : ">=";
    throw new Error(`${flag} must be a finite number ${comparison} ${minimum}`);
  }
  return parsed;
}

export function parseArgs(argv, cwd = process.cwd()) {
  const values = new Map([
    ["--prompt", "prompt"],
    ["--image", "image"],
    ["--image-url", "imageUrl"],
    ["--resume", "resume"],
    ["--prediction-id", "resume"],
    ["--output-dir", "outputDir"],
    ["--output", "output"],
    ["--format", "format"],
    ["--model", "model"],
    ["--subdivision", "subdivision"],
    ["--max-cost", "maxCost"],
    ["--max-wait", "maxWait"],
    ["--poll-interval", "pollInterval"],
    ["--base-url", "baseUrl"],
  ]);
  const booleans = new Map([
    ["--pbr", "pbr"],
    ["--geometry", "geometry"],
    ["--dry-run", "dryRun"],
    ["--allow-unknown-cost", "allowUnknownCost"],
    ["--json", "json"],
    ["--help", "help"],
    ["-h", "help"],
  ]);
  const parsed = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const equalIndex = token.startsWith("--") ? token.indexOf("=") : -1;
    const flag = equalIndex > 0 ? token.slice(0, equalIndex) : token;
    const inlineValue = equalIndex > 0 ? token.slice(equalIndex + 1) : undefined;

    if (booleans.has(flag)) {
      if (inlineValue !== undefined) throw new Error(`${flag} does not accept a value`);
      parsed[booleans.get(flag)] = true;
      continue;
    }
    if (!values.has(flag)) throw new Error(`unknown argument: ${token}`);
    const value = inlineValue ?? argv[index + 1];
    if (value === undefined || (!inlineValue && value.startsWith("--"))) {
      throw new Error(`${flag} requires a value`);
    }
    parsed[values.get(flag)] = value;
    if (inlineValue === undefined) index += 1;
  }

  if (parsed.help) return { help: true };

  const inputCount = [parsed.prompt, parsed.image, parsed.imageUrl].filter(Boolean).length;
  if (parsed.resume) {
    if (inputCount) throw new Error("--resume cannot be combined with --prompt, --image, or --image-url");
  } else if (inputCount !== 1) {
    throw new Error("choose exactly one of --prompt, --image, or --image-url");
  }

  if (parsed.prompt !== undefined && !parsed.prompt.trim()) throw new Error("--prompt cannot be empty");
  if (parsed.imageUrl !== undefined && !/^https?:\/\//i.test(parsed.imageUrl)) {
    throw new Error("--image-url must be an http(s) URL");
  }
  if (parsed.resume !== undefined && !parsed.resume.trim()) throw new Error("--resume cannot be empty");

  const outputDir = parsed.output
    ? dirname(resolve(cwd, parsed.output))
    : resolve(cwd, parsed.outputDir || `atlas-3d-output-${timestampSlug()}`);
  const output = parsed.output ? resolve(cwd, parsed.output) : undefined;
  const image = parsed.image ? resolve(cwd, parsed.image) : undefined;
  const baseUrl = String(parsed.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(baseUrl)) throw new Error("--base-url must be an http(s) URL");

  return {
    ...parsed,
    prompt: parsed.prompt?.trim(),
    resume: parsed.resume?.trim(),
    image,
    output,
    outputDir,
    baseUrl,
    maxCost: parseNumber(parsed.maxCost ?? DEFAULT_MAX_COST_USD, "--max-cost"),
    maxWait: parseNumber(parsed.maxWait ?? DEFAULT_MAX_WAIT_SECONDS, "--max-wait", { exclusiveMinimum: true }),
    pollInterval: parseNumber(
      parsed.pollInterval ?? DEFAULT_POLL_INTERVAL_SECONDS,
      "--poll-interval",
      { exclusiveMinimum: true },
    ),
  };
}

function unwrap(payload) {
  return payload && typeof payload === "object" && "data" in payload && "code" in payload
    ? payload.data
    : payload;
}

function sleep(milliseconds) {
  return new Promise(resolveDelay => setTimeout(resolveDelay, milliseconds));
}

async function fetchResponse(fetchImpl, url, options = {}) {
  const method = options.method || "GET";
  const attempts = method === "GET" ? 3 : 1;
  const timeoutMs = options.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
  const { paid: _paid, timeoutMs: _timeoutMs, ...requestOptions } = options;
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let response;
    try {
      response = await fetchImpl(url, { ...requestOptions, method, signal: controller.signal });
    } catch (error) {
      const detail = error?.name === "AbortError"
        ? `timed out after ${timeoutMs}ms`
        : error?.message || String(error);
      lastError = new Error(`${method} ${new URL(url).pathname} failed: ${detail}`);
      if (method !== "GET" || attempt === attempts) break;
      await sleep(250 * 2 ** (attempt - 1));
      continue;
    } finally {
      clearTimeout(timer);
    }

    if (response.ok) return response;
    const body = (await response.text()).slice(0, 500);
    lastError = new HttpError(
      `${method} ${new URL(url).pathname} HTTP ${response.status}: ${body}`,
      response.status,
      body,
    );
    const retryableGet = method === "GET" && (response.status === 429 || response.status >= 500);
    if (!retryableGet || attempt === attempts) break;
    await sleep(250 * 2 ** (attempt - 1));
  }

  if (method === "POST" && options.paid) {
    lastError.message += " The billable POST was not retried. Its outcome may be unknown; check Atlas request history before submitting again.";
  }
  throw lastError;
}

async function requestJson(fetchImpl, url, options = {}) {
  const response = await fetchResponse(fetchImpl, url, options);
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${options.method || "GET"} ${new URL(url).pathname} returned non-JSON: ${text.slice(0, 300)}`);
  }
}

function inputSchema(schemaDocument) {
  const schema = schemaDocument?.components?.schemas?.Input;
  if (!schema || schema.type !== "object" || !schema.properties) {
    throw new Error("live model schema does not contain components.schemas.Input.properties");
  }
  return schema;
}

function catalogEntries(payload) {
  const data = unwrap(payload);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.models)) return data.models;
  throw new Error("live Atlas model catalog has an unexpected shape");
}

function currentPrice(model) {
  const raw = model?.price?.actual?.base_price ?? model?.price?.actual?.price ?? model?.price?.base_price;
  if (raw === undefined || raw === null || raw === "") return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function enumValue(specification, requested, label) {
  const values = specification?.enum;
  const candidate = requested ?? specification?.default;
  if (candidate === undefined) return undefined;
  if (!Array.isArray(values) || values.length === 0) return candidate;
  const matched = values.find(value => String(value).toLowerCase() === String(candidate).toLowerCase());
  if (matched === undefined) throw new Error(`${label} must be one of: ${values.join(", ")}`);
  return matched;
}

function assertLocalImage(path) {
  if (!existsSync(path)) throw new Error(`local image does not exist: ${path}`);
  const stats = statSync(path);
  if (!stats.isFile()) throw new Error(`local image is not a file: ${path}`);
  if (stats.size === 0) throw new Error(`local image is empty: ${path}`);
  if (stats.size > MAX_LOCAL_IMAGE_BYTES) {
    throw new Error(`local image is ${(stats.size / 1024 / 1024).toFixed(2)} MB; the default Seed3D limit is 10 MB`);
  }
  imageMime(path);
}

function imageMime(path) {
  const buffer = readFileSync(path);
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return "image/png";
  }
  if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return "image/jpeg";
  if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") {
    return "image/webp";
  }
  if (buffer.subarray(0, 2).toString("ascii") === "BM") return "image/bmp";
  throw new Error(`unsupported local image: ${path} (use PNG, JPEG, WebP, or BMP)`);
}

function selectRoute(options) {
  if (options.image || options.imageUrl) return "image-to-3d";
  return "text-to-3d";
}

function buildRequestBody({ options, route, model, schema, image }) {
  const properties = schema.properties;
  const body = { model: model.model };

  if (route === "text-to-3d") {
    if (!properties.prompt) throw new Error(`${model.model} does not expose a prompt input`);
    if (properties.prompt.maxLength && [...options.prompt].length > properties.prompt.maxLength) {
      throw new Error(`prompt exceeds the live schema limit of ${properties.prompt.maxLength} characters`);
    }
    body.prompt = options.prompt;
  } else {
    if (!properties.image) throw new Error(`${model.model} does not expose an image input`);
    body.image = image;
  }

  const formatKey = properties.file_format ? "file_format" : properties.format ? "format" : undefined;
  if (!formatKey && options.format) throw new Error(`${model.model} does not expose an output format parameter`);
  if (formatKey) body[formatKey] = enumValue(properties[formatKey], options.format, `--format`);

  if (options.pbr) {
    if (!properties.enable_pbr) throw new Error(`${model.model} does not support --pbr`);
    body.enable_pbr = true;
  }
  if (options.geometry) {
    if (!properties.enable_geometry) throw new Error(`${model.model} does not support --geometry`);
    body.enable_geometry = true;
  }
  if (options.subdivision) {
    if (!properties.subdivision_level) throw new Error(`${model.model} does not support --subdivision`);
    body.subdivision_level = enumValue(properties.subdivision_level, options.subdivision, "--subdivision");
  } else if (properties.subdivision_level?.default !== undefined) {
    body.subdivision_level = enumValue(properties.subdivision_level, undefined, "--subdivision");
  }
  if (properties.enable_base64_output) body.enable_base64_output = false;

  for (const required of schema.required || []) {
    if (body[required] === undefined || body[required] === "") {
      throw new Error(`request is missing live-schema required parameter: ${required}`);
    }
  }
  return body;
}

function formatFromBody(body, schema, requested) {
  return String(body.file_format ?? body.format ?? requested ?? schema.properties.file_format?.default
    ?? schema.properties.format?.default ?? "GLB");
}

function formatExtension(format) {
  const extension = FORMAT_EXTENSIONS.get(String(format).toUpperCase());
  if (!extension) throw new Error(`cannot map output format to a file extension: ${format}`);
  return extension;
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  renameSync(temporary, path);
}

async function uploadImage({ fetchImpl, baseUrl, key, path }) {
  const form = new FormData();
  const buffer = readFileSync(path);
  form.append("file", new Blob([buffer], { type: imageMime(path) }), basename(path));
  const payload = await requestJson(fetchImpl, `${baseUrl}/api/v1/model/uploadMedia`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });
  const data = unwrap(payload);
  const url = data?.download_url || data?.url;
  if (!url || !/^https?:\/\//i.test(url)) throw new Error("Atlas upload completed without an http(s) download URL");
  return url;
}

async function submitGeneration({ fetchImpl, baseUrl, key, path, body }) {
  const payload = await requestJson(fetchImpl, `${baseUrl}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    paid: true,
  });
  const data = unwrap(payload);
  const id = data?.id || data?.prediction_id || data?.request_id;
  if (!id || typeof id !== "string") throw new Error("Atlas generation response did not include a prediction ID");
  return { id, response: data };
}

async function readPrediction({ fetchImpl, baseUrl, key, id, resultPath }) {
  const paths = [
    `/api/v1/model/prediction/${encodeURIComponent(id)}`,
    resultPath?.replace("{request_id}", encodeURIComponent(id)).replace("{id}", encodeURIComponent(id)),
    `/api/v1/model/result/${encodeURIComponent(id)}`,
  ].filter((value, index, values) => value && values.indexOf(value) === index);
  let lastError;
  for (const path of paths) {
    try {
      return unwrap(await requestJson(fetchImpl, `${baseUrl}${path}`, {
        headers: { Authorization: `Bearer ${key}` },
      }));
    } catch (error) {
      lastError = error;
      if (!(error instanceof HttpError) || error.status !== 404) throw error;
    }
  }
  throw lastError;
}

async function pollPrediction({ fetchImpl, baseUrl, key, id, resultPath, options, log }) {
  const startedAt = Date.now();
  let lastLoggedStatus;
  let lastLogAt = 0;
  while (true) {
    const elapsed = (Date.now() - startedAt) / 1_000;
    if (elapsed > options.maxWait) {
      throw new Error(
        `local polling window ended after ${options.maxWait}s for ${id}. Resume this prediction ID; do not resubmit it.`,
      );
    }
    let prediction;
    try {
      prediction = await readPrediction({ fetchImpl, baseUrl, key, id, resultPath });
    } catch (error) {
      if (error instanceof HttpError && error.status === 404 && elapsed < 15) {
        await sleep(options.pollInterval * 1_000);
        continue;
      }
      throw error;
    }
    const status = String(prediction?.status || "unknown").toLowerCase();
    if (status !== lastLoggedStatus || elapsed - lastLogAt >= 15) {
      log(`[poll] ${id} ${status} (${Math.floor(elapsed)}s)`);
      lastLoggedStatus = status;
      lastLogAt = elapsed;
    }
    if (TERMINAL_SUCCESS.has(status)) return prediction;
    if (TERMINAL_FAILURE.has(status)) {
      const detail = prediction?.error ?? prediction?.meta_info ?? prediction?.message ?? "";
      throw new Error(`prediction ${id} ${status}: ${JSON.stringify(detail).slice(0, 500)}`);
    }
    await sleep(options.pollInterval * 1_000);
  }
}

function outputUrl(value) {
  if (typeof value === "string" && /^https?:\/\//i.test(value)) return value;
  if (!value || typeof value !== "object") return undefined;
  for (const key of ["url", "download_url", "output_url", "file_url"]) {
    if (typeof value[key] === "string" && /^https?:\/\//i.test(value[key])) return value[key];
  }
  return undefined;
}

function collectOutputUrls(prediction) {
  const values = [...(prediction?.outputs || []), ...(prediction?.files || [])];
  const urls = values.map(outputUrl).filter(Boolean);
  return [...new Set(urls)];
}

async function download({ fetchImpl, url, destination }) {
  const response = await fetchResponse(fetchImpl, url);
  if (!response.body) throw new Error(`download returned no body: ${new URL(url).pathname}`);
  mkdirSync(dirname(destination), { recursive: true });
  await pipeline(Readable.fromWeb(response.body), createWriteStream(destination, { mode: 0o600 }));
}

function fileKind(path) {
  const buffer = readFileSync(path).subarray(0, 512);
  if (buffer.subarray(0, 4).toString("ascii") === "glTF") return "glb";
  if (buffer.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]))) return "zip";
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return "jpeg";
  if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") return "webp";
  if (buffer.subarray(0, 18).toString("ascii").startsWith("Kaydara FBX Binary")) return "fbx";
  if (buffer.length >= 12 && buffer.subarray(4, 8).toString("ascii") === "ftyp") return "mp4";
  return "unknown";
}

function zipCommand(args, label) {
  const result = spawnSync("unzip", args, { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  if (result.error?.code === "ENOENT") throw new Error(`${label} requires the unzip command`);
  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || "").trim().split("\n").slice(-8).join("\n");
    throw new Error(`${label} failed: ${detail}`);
  }
  return result.stdout;
}

function safeArchiveEntries(archive) {
  const entries = zipCommand(["-Z1", archive], "list 3D archive")
    .split(/\r?\n/)
    .map(value => value.trim())
    .filter(Boolean);
  if (entries.length === 0) throw new Error("3D ZIP archive is empty");
  for (const entry of entries) {
    const normalized = entry.replace(/\\/g, "/");
    const parts = normalized.split("/");
    if (normalized.startsWith("/") || /^[A-Za-z]:\//.test(normalized) || parts.includes("..")) {
      throw new Error(`unsafe path in 3D ZIP archive: ${entry}`);
    }
  }
  return entries;
}

function walkFiles(root) {
  const files = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(path));
    else if (entry.isFile() && !lstatSync(path).isSymbolicLink()) files.push(path);
  }
  return files;
}

function extractArchive(archive, destination, extension) {
  safeArchiveEntries(archive);
  if (existsSync(destination)) throw new Error(`archive extraction destination already exists: ${destination}`);
  mkdirSync(destination, { recursive: true });
  zipCommand(["-qq", "-o", archive, "-d", destination], "extract 3D archive");
  const candidates = walkFiles(destination).filter(path => extname(path).toLowerCase() === `.${extension}`);
  if (candidates.length === 0) {
    const found = walkFiles(destination).map(path => extname(path).toLowerCase()).filter(Boolean);
    throw new Error(`3D archive contains no .${extension} file (found: ${[...new Set(found)].join(", ") || "none"})`);
  }
  return candidates[0];
}

function validateModel(path, format) {
  const buffer = readFileSync(path);
  const sizeBytes = buffer.length;
  if (sizeBytes === 0) throw new Error(`downloaded ${format} file is empty`);
  const normalized = String(format).toUpperCase();

  if (normalized === "GLB") {
    if (sizeBytes < 12 || buffer.subarray(0, 4).toString("ascii") !== "glTF") {
      throw new Error("GLB validation failed: missing glTF magic");
    }
    const version = buffer.readUInt32LE(4);
    const declaredLength = buffer.readUInt32LE(8);
    if (version < 2) throw new Error(`GLB validation failed: unsupported version ${version}`);
    if (declaredLength !== sizeBytes) {
      throw new Error(`GLB validation failed: header declares ${declaredLength} bytes, file has ${sizeBytes}`);
    }
    return { valid: true, check: "glTF magic, version, and declared length", version, size_bytes: sizeBytes };
  }

  if (normalized === "OBJ") {
    const text = buffer.subarray(0, Math.min(buffer.length, 2 * 1024 * 1024)).toString("utf8");
    if (!/^v\s+[-+\d.]/m.test(text) || !/^f\s+\S+/m.test(text)) {
      throw new Error("OBJ validation failed: no vertex/face records found");
    }
    return { valid: true, check: "OBJ vertex and face records", size_bytes: sizeBytes };
  }

  if (normalized === "USDZ") {
    if (fileKind(path) !== "zip") throw new Error("USDZ validation failed: missing ZIP container signature");
    zipCommand(["-tqq", path], "validate USDZ archive");
    return { valid: true, check: "USDZ ZIP integrity", size_bytes: sizeBytes };
  }

  if (normalized === "USD") {
    const prefix = buffer.subarray(0, 64).toString("ascii");
    if (!prefix.startsWith("#usda") && !prefix.includes("PXR-USDC")) {
      throw new Error("USD validation failed: unrecognized USDA/USDC signature");
    }
    return { valid: true, check: "USDA/USDC signature", size_bytes: sizeBytes };
  }

  if (normalized === "FBX") {
    const prefix = buffer.subarray(0, 512).toString("ascii");
    if (!prefix.startsWith("Kaydara FBX Binary") && !prefix.includes("FBXHeaderExtension")) {
      throw new Error("FBX validation failed: unrecognized header");
    }
    return { valid: true, check: "FBX header", size_bytes: sizeBytes };
  }

  if (normalized === "STL") {
    const asciiPrefix = buffer.subarray(0, 80).toString("ascii").trimStart();
    const binaryPlausible = sizeBytes >= 84 && 84 + buffer.readUInt32LE(80) * 50 === sizeBytes;
    if (!asciiPrefix.startsWith("solid") && !binaryPlausible) {
      throw new Error("STL validation failed: unrecognized ASCII/binary structure");
    }
    return { valid: true, check: binaryPlausible ? "binary STL triangle length" : "ASCII STL header", size_bytes: sizeBytes };
  }

  if (normalized === "MP4") {
    if (sizeBytes < 12 || buffer.subarray(4, 8).toString("ascii") !== "ftyp") {
      throw new Error("MP4 validation failed: missing ftyp box");
    }
    return { valid: true, check: "MP4 ftyp box", size_bytes: sizeBytes };
  }

  throw new Error(`no validator for output format: ${format}`);
}

function outputPathFor(options, extension) {
  return options.output || join(options.outputDir, `model.${extension}`);
}

async function saveModel({ fetchImpl, prediction, id, route, format, options }) {
  const urls = collectOutputUrls(prediction);
  if (urls.length === 0) throw new Error(`prediction ${id} completed without a downloadable 3D output`);
  const extension = formatExtension(format);
  const finalPath = outputPathFor(options, extension);
  if (existsSync(finalPath)) {
    throw new Error(`model output already exists: ${finalPath}. Use a new output path; the paid task was not resubmitted.`);
  }
  mkdirSync(dirname(finalPath), { recursive: true });
  const rawPath = join(options.outputDir, `atlas-result-${id}.download`);
  if (existsSync(rawPath)) throw new Error(`temporary download already exists: ${rawPath}`);
  await download({ fetchImpl, url: urls[0], destination: rawPath });

  let modelSource = rawPath;
  let archivePath;
  const archiveResult = fileKind(rawPath) === "zip"
    && (route === "image-to-3d" || String(format).toUpperCase() !== "USDZ");
  if (archiveResult) {
    archivePath = join(options.outputDir, `atlas-result-${id}.zip`);
    if (existsSync(archivePath)) throw new Error(`archive already exists: ${archivePath}`);
    renameSync(rawPath, archivePath);
    const extractDirectory = join(options.outputDir, `extracted-${id}`);
    modelSource = extractArchive(archivePath, extractDirectory, extension);
  }

  if (modelSource === rawPath) renameSync(rawPath, finalPath);
  else copyFileSync(modelSource, finalPath);
  const validation = validateModel(finalPath, format);
  return { modelPath: finalPath, archivePath, validation, outputUrlCount: urls.length };
}

async function saveThumbnail({ fetchImpl, prediction, id, outputDir, warn }) {
  const url = outputUrl(prediction?.thumbnail);
  if (!url) return undefined;
  const temporary = join(outputDir, `thumbnail-${id}.download`);
  try {
    await download({ fetchImpl, url, destination: temporary });
    const kind = fileKind(temporary);
    const extension = kind === "jpeg" ? "jpg" : kind;
    if (!new Set(["jpg", "png", "webp"]).has(extension)) throw new Error(`unexpected thumbnail format: ${kind}`);
    const destination = join(outputDir, `thumbnail.${extension}`);
    if (existsSync(destination)) throw new Error(`thumbnail already exists: ${destination}`);
    renameSync(temporary, destination);
    return destination;
  } catch (error) {
    warn(`[thumbnail] ${error.message}`);
    return undefined;
  }
}

function resultPathFromSchema(schemaDocument) {
  return Object.keys(schemaDocument?.paths || {}).find(path => path.includes("/result/") && path.includes("{"));
}

function generationPathFromSchema(schemaDocument) {
  const path = Object.keys(schemaDocument?.paths || {}).find(value => value.includes("/generateImage"));
  if (!path) throw new Error("live model schema does not declare a generateImage endpoint");
  return path;
}

function inferResumeRoute(model, format) {
  if (String(model).includes("image-to-3d")) return "image-to-3d";
  if (String(format).toUpperCase() === "USD") return "image-to-3d";
  return "text-to-3d";
}

function publicRequestBody(body) {
  if (typeof body.image === "string" && body.image.startsWith("data:")) return { ...body, image: "[local image data omitted]" };
  return body;
}

export async function run(argv, dependencies = {}) {
  const options = parseArgs(argv, dependencies.cwd || process.cwd());
  if (options.help) return { help: true, text: usage() };
  const fetchImpl = dependencies.fetchImpl || globalThis.fetch;
  if (typeof fetchImpl !== "function") throw new Error("Node.js 18 or newer is required (global fetch is unavailable)");
  const log = dependencies.log || console.log;
  const warn = dependencies.warn || console.warn;
  const key = dependencies.apiKey || process.env.ATLASCLOUD_API_KEY || process.env.ATLAS_CLOUD_API_KEY;

  if (options.image) assertLocalImage(options.image);

  if (options.resume) {
    if (!key) throw new Error("ATLASCLOUD_API_KEY is not available; configure it outside chat and restart the execution session");
    mkdirSync(options.outputDir, { recursive: true });
    log(`[resume] polling ${options.resume}; no generation POST will be sent`);
    const prediction = await pollPrediction({
      fetchImpl,
      baseUrl: options.baseUrl,
      key,
      id: options.resume,
      resultPath: undefined,
      options,
      log,
    });
    const format = options.format || "GLB";
    const model = prediction.model || "unknown";
    const route = inferResumeRoute(model, format);
    const saved = await saveModel({ fetchImpl, prediction, id: options.resume, route, format, options });
    const thumbnailPath = await saveThumbnail({
      fetchImpl,
      prediction,
      id: options.resume,
      outputDir: options.outputDir,
      warn,
    });
    const manifest = {
      schema_version: 1,
      prediction_id: options.resume,
      model,
      route,
      status: String(prediction.status),
      requested_format: format,
      resumed: true,
      catalog_price_usd: null,
      incurred_by_this_run_usd: 0,
      model_path: saved.modelPath,
      archive_path: saved.archivePath || null,
      thumbnail_path: thumbnailPath || null,
      output_size_bytes: saved.validation.size_bytes,
      validation: saved.validation,
      completed_at: new Date().toISOString(),
    };
    writeJson(join(options.outputDir, "generation.json"), manifest);
    log(`[done] ${saved.modelPath} (${saved.validation.size_bytes} bytes; ${saved.validation.check})`);
    return manifest;
  }

  const route = selectRoute(options);
  const requestedModel = options.model || (route === "text-to-3d" ? DEFAULT_TEXT_MODEL : DEFAULT_IMAGE_MODEL);
  const catalogPayload = await requestJson(fetchImpl, `${options.baseUrl}/api/v1/models`);
  const model = catalogEntries(catalogPayload).find(entry => entry?.model === requestedModel);
  if (!model) throw new Error(`model is not present in Atlas Cloud's live catalog: ${requestedModel}`);
  if (model.display_console !== true) throw new Error(`model is not available in the Atlas console: ${requestedModel}`);
  if (String(model.type).toLowerCase() !== "image") {
    throw new Error(`Atlas 3D generation must use an Image-type model; ${requestedModel} is ${model.type}`);
  }
  if (!model.schema || !/^https?:\/\//i.test(model.schema)) throw new Error(`${requestedModel} has no valid live schema URL`);
  const schemaDocument = await requestJson(fetchImpl, model.schema);
  const schema = inputSchema(schemaDocument);
  const price = currentPrice(model);
  if (price === undefined && !options.allowUnknownCost) {
    throw new Error("live catalog has no numeric price; use --allow-unknown-cost only after establishing a conservative budget")
  }
  if (price !== undefined && price > options.maxCost) {
    throw new Error(`live model price $${price} exceeds --max-cost $${options.maxCost}; no paid request was sent`);
  }

  const deferredImage = options.image ? `[upload deferred: ${basename(options.image)}]` : options.imageUrl;
  let body = buildRequestBody({ options, route, model, schema, image: deferredImage });
  const format = formatFromBody(body, schema, options.format);
  const extension = formatExtension(format);
  const finalPath = outputPathFor(options, extension);
  if (existsSync(finalPath)) throw new Error(`model output already exists: ${finalPath}; choose a new path before submission`);
  const plan = {
    route,
    model: model.model,
    format,
    live_price_usd: price ?? null,
    max_cost_usd: options.maxCost,
    schema_url: model.schema,
    output_path: finalPath,
    request: publicRequestBody(body),
    billable_post_will_retry: false,
  };
  log(`[plan] ${route} via ${model.model}; ${format}; live price ${price === undefined ? "unknown" : `$${price}`}`);
  if (options.dryRun) return { dry_run: true, ...plan };

  if (!key) throw new Error("ATLASCLOUD_API_KEY is not available; configure it outside chat and restart the execution session");
  mkdirSync(options.outputDir, { recursive: true });
  if (options.image) {
    log(`[upload] ${options.image}`);
    const uploadedUrl = await uploadImage({ fetchImpl, baseUrl: options.baseUrl, key, path: options.image });
    body = buildRequestBody({ options, route, model, schema, image: uploadedUrl });
  }

  log(`[submit] sending one billable generation POST; automatic retry is disabled`);
  const submitted = await submitGeneration({
    fetchImpl,
    baseUrl: options.baseUrl,
    key,
    path: generationPathFromSchema(schemaDocument),
    body,
  });
  const job = {
    schema_version: 1,
    prediction_id: submitted.id,
    model: model.model,
    route,
    requested_format: format,
    live_price_usd: price ?? null,
    submitted_at: new Date().toISOString(),
    output_directory: options.outputDir,
    resume_with: `--resume ${submitted.id} --format ${format} --output-dir ${options.outputDir}`,
  };
  writeJson(join(options.outputDir, "job.json"), job);
  log(`[submitted] ${submitted.id}; recovery metadata saved to ${join(options.outputDir, "job.json")}`);

  const prediction = await pollPrediction({
    fetchImpl,
    baseUrl: options.baseUrl,
    key,
    id: submitted.id,
    resultPath: resultPathFromSchema(schemaDocument),
    options,
    log,
  });
  const saved = await saveModel({ fetchImpl, prediction, id: submitted.id, route, format, options });
  const thumbnailPath = await saveThumbnail({
    fetchImpl,
    prediction,
    id: submitted.id,
    outputDir: options.outputDir,
    warn,
  });
  const manifest = {
    schema_version: 1,
    prediction_id: submitted.id,
    model: prediction.model || model.model,
    route,
    status: String(prediction.status),
    requested_format: format,
    resumed: false,
    catalog_price_usd: price ?? null,
    incurred_by_this_run_usd: price ?? null,
    credits_consumed: prediction.credits_consumed ?? null,
    model_path: saved.modelPath,
    archive_path: saved.archivePath || null,
    thumbnail_path: thumbnailPath || null,
    output_size_bytes: saved.validation.size_bytes,
    output_url_count: saved.outputUrlCount,
    validation: saved.validation,
    completed_at: new Date().toISOString(),
  };
  writeJson(join(options.outputDir, "generation.json"), manifest);
  log(`[done] ${saved.modelPath} (${saved.validation.size_bytes} bytes; ${saved.validation.check})`);
  return manifest;
}

async function main() {
  try {
    const jsonRequested = process.argv.includes("--json");
    const result = await run(process.argv.slice(2), {
      log: jsonRequested ? message => console.error(message) : console.log,
      warn: message => console.error(message),
    });
    if (result.help) {
      console.log(result.text);
      return;
    }
    if (jsonRequested || result.dry_run) console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(`Error: ${error?.message || String(error)}`);
    process.exitCode = 1;
  }
}

const directInvocation = process.argv[1]
  && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (directInvocation) await main();
