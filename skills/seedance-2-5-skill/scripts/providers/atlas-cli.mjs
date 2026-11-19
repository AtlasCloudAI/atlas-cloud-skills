import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { apiKeyEnvName } from "./guards.mjs";

const POLL_INTERVAL_SECONDS = 2;
const POLL_INTERVAL_MS = POLL_INTERVAL_SECONDS * 1000;

// The executable comes from the environment only: a job config must not be
// able to choose which program the runner starts.
export function resolveAtlasCliCommand(config = {}, log = console.log) {
  const configured = config.execution?.cliCommand || config.cliCommand;
  if (configured) log(`[executor] ignoring cliCommand ${JSON.stringify(configured)} from the job config; set ATLAS_CLI_COMMAND in the environment instead.`);
  const explicit = process.env.ATLAS_CLI_COMMAND;
  if (explicit) return explicit;
  const userLocal = join(homedir(), ".local", "bin", "atlas");
  return existsSync(userLocal) ? userLocal : "atlas";
}

function parseJson(text, label) {
  const source = (text || "").trim();
  if (!source) throw new Error(`${label} returned no JSON output`);
  try { return JSON.parse(source); }
  catch { throw new Error(`${label} returned invalid JSON: ${source.slice(0, 300)}`); }
}

// Read a prediction from `atlas ... --json`. Current CLI versions answer with a
// result envelope { schema_version, outcome, data: { submission_state,
// prediction: { id, status, outputs: [{ url }] } } }; older ones with the bare
// prediction, sometimes wrapped in { data }. A top-level id or status wins over
// a nested data field (a prediction can carry a data field of its own).
function prediction(value) {
  const envelope = value?.schema_version !== undefined && value?.data && typeof value.data === "object" ? value.data : undefined;
  const view = envelope?.prediction && typeof envelope.prediction === "object" ? envelope.prediction : undefined;
  const wrapped = !envelope && value?.data && typeof value.data === "object" && !Array.isArray(value.data)
    && value.id === undefined && value.prediction_id === undefined && value.status === undefined;
  const data = view ?? (wrapped ? value.data : envelope ?? value);
  const raw = data?.outputs ?? data?.output_urls ?? data?.urls ?? data?.output;
  const list = Array.isArray(raw) ? raw : (raw ? [raw] : []);
  const outputs = list.map(item => (typeof item === "string" ? item : item?.url ?? item?.remote_url)).filter(Boolean);
  return {
    ...data,
    id: data?.id ?? data?.prediction_id,
    outputs: outputs.length ? outputs : undefined,
  };
}

function valueArg(key, value) {
  const encoded = typeof value === "string" ? value : JSON.stringify(value);
  return `${key}=${encoded}`;
}

function toCliMedia(value, root) {
  if (typeof value !== "string") throw new Error("CLI media input must be a string");
  if (/^(https?:|data:|@)/.test(value)) return value;
  const path = resolve(root, value);
  if (!existsSync(path)) throw new Error(`CLI media file not found: ${path}`);
  return `@${path}`;
}

export function atlasCliIsAuthenticated(command = "atlas") {
  const version = spawnSync(command, ["version", "--json"], { encoding: "utf8" });
  if (version.error || version.status !== 0) return false;
  const auth = spawnSync(command, ["auth", "status", "--json"], { encoding: "utf8" });
  return !auth.error && auth.status === 0;
}

export function atlasCliIsAvailable(command = "atlas") {
  const version = spawnSync(command, ["version", "--json"], { encoding: "utf8" });
  return !version.error && version.status === 0;
}

function atlasApiKey(config) {
  const apiKeyEnv = apiKeyEnvName(config);
  return process.env[apiKeyEnv] || process.env.ATLASCLOUD_API_KEY || process.env.ATLAS_CLOUD_API_KEY;
}

export function atlasCliCanRun(config = {}) {
  const command = resolveAtlasCliCommand(config);
  return atlasCliIsAvailable(command) && (atlasCliIsAuthenticated(command) || Boolean(atlasApiKey(config)));
}

export function createAtlasCliExecutor({ config, root, log = console.log }) {
  const command = resolveAtlasCliCommand(config, log);

  if (!atlasCliIsAvailable(command)) {
    throw new Error(`atlas-cli is unavailable (${command}). Install it, then run \`${command} auth login\`, or use execution.adapter: \"atlas-rest\".`);
  }
  if (!atlasCliIsAuthenticated(command)) {
    const key = atlasApiKey(config);
    if (!key) throw new Error(`atlas-cli is not logged in and no Atlas API key is available. Run \`${command} auth login\`, or use execution.adapter: \"atlas-rest\".`);
    // A key passed as a command-line argument is visible to every other process
    // on the host (ps / procfs), so non-interactive login is opt-in only.
    if (process.env.ATLAS_CLI_ALLOW_ARGV_TOKEN !== "1") {
      throw new Error(
        `atlas-cli is not logged in. Non-interactive login would pass the Atlas API key as a command-line argument, which other processes on this host can read. `
        + `Pick one: (1) run \`${command} auth login\` once interactively, (2) set execution.adapter: \"atlas-rest\" to call the HTTPS API directly, `
        + `or (3) set ATLAS_CLI_ALLOW_ARGV_TOKEN=1 to accept that exposure on a single-user machine.`
      );
    }
    log("[executor] WARNING: ATLAS_CLI_ALLOW_ARGV_TOKEN=1 - the Atlas API key is passed via argv and is readable by other processes on this host");
    const login = spawnSync(command, ["auth", "login", "--token", key, "--json"], { encoding: "utf8", env: process.env });
    if (login.error || login.status !== 0) {
      const detail = (login.stderr || login.stdout || "").trim().slice(0, 300);
      throw new Error(`atlas-cli non-interactive login failed${detail ? `: ${detail}` : ""}`);
    }
    if (!atlasCliIsAuthenticated(command)) throw new Error("atlas-cli login did not establish an authenticated session");
    log("[executor] atlas-cli authenticated with the configured API key");
  }

  function run(args, label) {
    const result = spawnSync(command, [...args, "--json"], {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      env: process.env,
    });
    // A generate command that failed or printed something unreadable may still have submitted the job.
    const unsure = args[0] === "generate" && args[1] !== "get"
      ? " The job may already have been submitted and billed: check `atlas generate history` (or the generations list in Atlas) before running it again, and ask the user before resubmitting."
      : "";
    if (result.error) throw new Error(`${label} failed: ${result.error.message}${unsure}`);
    // The CLI stopped at its own spend confirmation (exit 10, outcome confirmation_required): nothing was submitted.
    const answered = (() => { try { return JSON.parse(result.stdout || ""); } catch { return undefined; } })();
    if (result.status === 10 || answered?.outcome === "confirmation_required") {
      throw new Error(`${label} stopped at the Atlas CLI's own spend confirmation, so nothing was submitted. This Atlas CLI does not accept --spend-confirm off; update it or use the atlas-rest adapter.`);
    }
    if (result.status !== 0) {
      const detail = (result.stderr || result.stdout || "").trim().slice(0, 500);
      throw new Error(`${label} failed${detail ? `: ${detail}` : ""}${unsure}`);
    }
    try {
      return parseJson(result.stdout, label);
    } catch (error) {
      throw new Error(`${error instanceof Error ? error.message : String(error)}${unsure}`);
    }
  }

  function buildGenerateArgs(kind, body) {
    if (!body?.model || !body?.prompt) throw new Error(`atlas-cli ${kind} generation requires model and prompt`);
    // The runner's own spend plan already has the user's approval for this job, so the CLI must not stop to ask again.
    const args = ["generate", kind, body.model, "-p", body.prompt, "--no-wait", "--no-download", "--spend-confirm", "off"];
    if (body.duration !== undefined) args.push("--duration", String(body.duration));
    if (body.resolution) args.push("--resolution", body.resolution);
    if (body.ratio) args.push("--aspect-ratio", body.ratio);
    if (body.size) args.push("--size", String(body.size).replace("*", "x"));
    if (body.image) args.push("--image", toCliMedia(body.image, root));
    if (body.last_image) args.push("--end-image", toCliMedia(body.last_image, root));
    for (const image of body.reference_images || []) args.push("--images", toCliMedia(image, root));
    if (body.reference_audios?.length === 1) args.push("--audio", toCliMedia(body.reference_audios[0], root));

    const consumed = new Set([
      "model", "prompt", "duration", "resolution", "ratio", "size", "image",
      "last_image", "reference_images", "reference_audios",
    ]);
    for (const [key, value] of Object.entries(body)) {
      if (consumed.has(key) || value === undefined) continue;
      args.push("--param", valueArg(key, value));
    }
    if (body.reference_audios?.length > 1) {
      args.push("--param", valueArg("reference_audios", body.reference_audios.map(value => toCliMedia(value, root))));
    }
    return args;
  }

  async function poll(id, label, maxPollSeconds = 900) {
    for (let elapsed = 0; ; elapsed += POLL_INTERVAL_SECONDS) {
      if (elapsed > maxPollSeconds) {
        throw new Error(`[${label}] local polling window ended after ${maxPollSeconds}s for task ${id}; task status is not a terminal failure, so resume this ID instead of resubmitting`);
      }
      const result = prediction(run(["generate", "get", id, "--no-download"], `atlas generate get ${id}`));
      const status = String(result.status || "unknown").toLowerCase();
      if (elapsed % 32 === 0) log(`[${label}] ${status} … ${elapsed}s`);
      if (status === "completed" || status === "succeeded") return result;
      if (status === "failed" || status === "timeout" || status === "canceled") {
        throw new Error(`[${label}] ${status}: ${JSON.stringify(result.error ?? result.meta_info ?? "").slice(0, 300)}`);
      }
      await new Promise(resolveDelay => setTimeout(resolveDelay, POLL_INTERVAL_MS));
    }
  }

  async function download(url, destination) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`download HTTP ${response.status}`);
    const { writeFileSync } = await import("node:fs");
    writeFileSync(destination, Buffer.from(await response.arrayBuffer()));
  }

  async function uploadMedia(source) {
    return /^https?:\/\//.test(source) ? source : toCliMedia(source, root);
  }

  async function verifyModels(modelIds) {
    for (const model of modelIds) run(["models", "get", model], `atlas models get ${model}`);
    log(`[executor] atlas-cli verified ${modelIds.join(", ")}`);
  }

  return {
    id: "atlas-cli",
    maxReferenceAspectRatio: 2.5,
    submitImage: body => prediction(run(buildGenerateArgs("image", body), "atlas generate image")),
    submitVideo: body => prediction(run(buildGenerateArgs("video", body), "atlas generate video")),
    poll,
    download,
    uploadMedia,
    verifyModels,
  };
}
