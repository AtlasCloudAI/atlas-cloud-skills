import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { parseArgs, run } from "./generate.mjs";

const TEXT_MODEL = "tencent/hunyuan3d-rapid/text-to-3d";
const IMAGE_MODEL = "bytedance/seed3d-v2.0/image-to-3d";
const silent = () => {};

function glbBuffer() {
  const json = Buffer.from('{"asset":{"version":"2.0"}} ');
  assert.equal(json.length % 4, 0);
  const buffer = Buffer.alloc(12 + 8 + json.length);
  buffer.write("glTF", 0, "ascii");
  buffer.writeUInt32LE(2, 4);
  buffer.writeUInt32LE(buffer.length, 8);
  buffer.writeUInt32LE(json.length, 12);
  buffer.writeUInt32LE(0x4e4f534a, 16);
  json.copy(buffer, 20);
  return buffer;
}

function pngBuffer() {
  return Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  );
}

function inputSchema(properties, required) {
  return {
    openapi: "3.1.0",
    paths: {
      "/api/v1/model/generateImage": { post: {} },
      "/api/v1/model/result/{request_id}": { get: {} },
    },
    components: { schemas: { Input: { type: "object", properties, required } } },
  };
}

function textSchema() {
  return inputSchema(
    {
      model: { type: "string", default: TEXT_MODEL },
      prompt: { type: "string", maxLength: 1024 },
      enable_pbr: { type: "boolean", default: false },
      enable_geometry: { type: "boolean", default: false },
      format: { type: "string", enum: ["GLB", "OBJ", "USDZ", "FBX", "STL", "MP4"], default: "GLB" },
    },
    ["model", "prompt"],
  );
}

function imageSchema() {
  return inputSchema(
    {
      model: { type: "string", default: IMAGE_MODEL },
      image: { type: "string" },
      subdivision_level: { type: "string", enum: ["high", "medium", "low"], default: "medium" },
      file_format: { type: "string", enum: ["glb", "obj", "usd", "usdz"], default: "glb" },
      enable_base64_output: { type: "boolean", default: false },
    },
    ["model", "image"],
  );
}

async function readRequestBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return Buffer.concat(chunks);
}

function json(response, status, value) {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(value));
}

async function startServer(handler) {
  let baseUrl;
  const server = createServer((request, response) => handler({ request, response, baseUrl }));
  await new Promise((resolveListen, rejectListen) => {
    server.once("error", rejectListen);
    server.listen(0, "127.0.0.1", resolveListen);
  });
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
  return {
    baseUrl,
    close: () => new Promise((resolveClose, rejectClose) => {
      server.close(error => error ? rejectClose(error) : resolveClose());
    }),
  };
}

function modelEntry({ model, schema, price = "0.02" }) {
  return {
    model,
    type: "Image",
    display_console: true,
    schema,
    price: { actual: { base_price: price } },
  };
}

test("parseArgs rejects ambiguous inputs before network or billing", () => {
  assert.throws(
    () => parseArgs(["--prompt", "robot", "--image-url", "https://example.com/robot.png"]),
    /choose exactly one/,
  );
  assert.throws(() => parseArgs(["--resume", "pred-1", "--prompt", "robot"]), /cannot be combined/);
});

test("text-to-3D verifies live contract, submits once, resumes polling, and validates GLB", async () => {
  const directory = mkdtempSync(join(tmpdir(), "atlas-3d-text-test-"));
  let submitCount = 0;
  let pollCount = 0;
  let submittedBody;
  const server = await startServer(async ({ request, response, baseUrl }) => {
    const url = new URL(request.url, baseUrl);
    if (request.method === "GET" && url.pathname === "/api/v1/models") {
      json(response, 200, { code: "200", data: [modelEntry({ model: TEXT_MODEL, schema: `${baseUrl}/schema/text` })] });
      return;
    }
    if (request.method === "GET" && url.pathname === "/schema/text") {
      json(response, 200, textSchema());
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/v1/model/generateImage") {
      submitCount += 1;
      submittedBody = JSON.parse((await readRequestBody(request)).toString("utf8"));
      json(response, 200, { code: 200, data: { id: "text-prediction", status: "created" } });
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/v1/model/prediction/text-prediction") {
      pollCount += 1;
      const data = pollCount === 1
        ? { id: "text-prediction", model: TEXT_MODEL, status: "processing", outputs: [] }
        : { id: "text-prediction", model: TEXT_MODEL, status: "completed", outputs: [`${baseUrl}/asset.glb`] };
      json(response, 200, { code: 200, data });
      return;
    }
    if (request.method === "GET" && url.pathname === "/asset.glb") {
      response.writeHead(200, { "content-type": "model/gltf-binary" });
      response.end(glbBuffer());
      return;
    }
    json(response, 404, { error: "not found" });
  });

  try {
    const result = await run([
      "--prompt", "A single rounded desk robot",
      "--format", "glb",
      "--pbr",
      "--output-dir", directory,
      "--base-url", server.baseUrl,
      "--poll-interval", "0.01",
      "--max-wait", "2",
    ], { apiKey: "test-key", log: silent, warn: silent });

    assert.equal(submitCount, 1);
    assert.ok(pollCount >= 2);
    assert.deepEqual(submittedBody, {
      model: TEXT_MODEL,
      prompt: "A single rounded desk robot",
      format: "GLB",
      enable_pbr: true,
    });
    assert.equal(result.validation.valid, true);
    assert.equal(result.validation.version, 2);
    assert.equal(readFileSync(result.model_path).subarray(0, 4).toString("ascii"), "glTF");
    assert.equal(JSON.parse(readFileSync(join(directory, "job.json"), "utf8")).prediction_id, "text-prediction");
    assert.equal(JSON.parse(readFileSync(join(directory, "generation.json"), "utf8")).catalog_price_usd, 0.02);
  } finally {
    await server.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("image-to-3D uploads one image, extracts the Seed3D ZIP, and validates GLB", async t => {
  const zipAvailable = spawnSync("zip", ["-v"], { encoding: "utf8" }).status === 0
    && spawnSync("unzip", ["-v"], { encoding: "utf8" }).status === 0;
  if (!zipAvailable) {
    t.skip("zip and unzip commands are required for the Seed3D archive test");
    return;
  }

  const directory = mkdtempSync(join(tmpdir(), "atlas-3d-image-test-"));
  const imagePath = join(directory, "input.png");
  const fixtureGlb = join(directory, "fixture.glb");
  const fixtureZip = join(directory, "fixture.zip");
  writeFileSync(imagePath, pngBuffer());
  writeFileSync(fixtureGlb, glbBuffer());
  const zipped = spawnSync("zip", ["-q", "-j", fixtureZip, fixtureGlb], { encoding: "utf8" });
  assert.equal(zipped.status, 0, zipped.stderr);
  const zipBytes = readFileSync(fixtureZip);
  let uploadCount = 0;
  let submitCount = 0;
  let submittedBody;

  const server = await startServer(async ({ request, response, baseUrl }) => {
    const url = new URL(request.url, baseUrl);
    if (request.method === "GET" && url.pathname === "/api/v1/models") {
      json(response, 200, { code: "200", data: [modelEntry({ model: IMAGE_MODEL, schema: `${baseUrl}/schema/image`, price: "0.353" })] });
      return;
    }
    if (request.method === "GET" && url.pathname === "/schema/image") {
      json(response, 200, imageSchema());
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/v1/model/uploadMedia") {
      uploadCount += 1;
      await readRequestBody(request);
      json(response, 200, { code: 200, data: { download_url: `${baseUrl}/uploaded/input.png` } });
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/v1/model/generateImage") {
      submitCount += 1;
      submittedBody = JSON.parse((await readRequestBody(request)).toString("utf8"));
      json(response, 200, { code: 200, data: { id: "image-prediction", status: "created" } });
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/v1/model/prediction/image-prediction") {
      json(response, 200, {
        code: 200,
        data: {
          id: "image-prediction",
          model: IMAGE_MODEL,
          status: "completed",
          outputs: [`${baseUrl}/seed3d.zip`],
        },
      });
      return;
    }
    if (request.method === "GET" && url.pathname === "/seed3d.zip") {
      response.writeHead(200, { "content-type": "application/zip" });
      response.end(zipBytes);
      return;
    }
    json(response, 404, { error: "not found" });
  });

  try {
    const outputDirectory = join(directory, "result");
    const result = await run([
      "--image", imagePath,
      "--format", "GLB",
      "--subdivision", "medium",
      "--output-dir", outputDirectory,
      "--base-url", server.baseUrl,
      "--poll-interval", "0.01",
      "--max-wait", "2",
    ], { apiKey: "test-key", log: silent, warn: silent });

    assert.equal(uploadCount, 1);
    assert.equal(submitCount, 1);
    assert.deepEqual(submittedBody, {
      model: IMAGE_MODEL,
      image: `${server.baseUrl}/uploaded/input.png`,
      file_format: "glb",
      subdivision_level: "medium",
      enable_base64_output: false,
    });
    assert.equal(result.validation.valid, true);
    assert.ok(result.archive_path.endsWith(".zip"));
    assert.equal(existsSync(result.archive_path), true);
    assert.equal(readFileSync(result.model_path).subarray(0, 4).toString("ascii"), "glTF");
  } finally {
    await server.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("live price ceiling blocks the paid POST", async () => {
  const directory = mkdtempSync(join(tmpdir(), "atlas-3d-price-test-"));
  let submitCount = 0;
  const server = await startServer(async ({ request, response, baseUrl }) => {
    const url = new URL(request.url, baseUrl);
    if (request.method === "GET" && url.pathname === "/api/v1/models") {
      json(response, 200, { code: "200", data: [modelEntry({ model: TEXT_MODEL, schema: `${baseUrl}/schema/text`, price: "2.50" })] });
      return;
    }
    if (request.method === "GET" && url.pathname === "/schema/text") {
      json(response, 200, textSchema());
      return;
    }
    if (request.method === "POST") submitCount += 1;
    json(response, 500, { error: "unexpected POST" });
  });

  try {
    await assert.rejects(
      run([
        "--prompt", "A robot",
        "--base-url", server.baseUrl,
        "--output-dir", directory,
      ], { apiKey: "test-key", log: silent, warn: silent }),
      /exceeds --max-cost/,
    );
    assert.equal(submitCount, 0);
  } finally {
    await server.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("a failed billable POST is never retried", async () => {
  const directory = mkdtempSync(join(tmpdir(), "atlas-3d-post-test-"));
  let submitCount = 0;
  const server = await startServer(async ({ request, response, baseUrl }) => {
    const url = new URL(request.url, baseUrl);
    if (request.method === "GET" && url.pathname === "/api/v1/models") {
      json(response, 200, { code: "200", data: [modelEntry({ model: TEXT_MODEL, schema: `${baseUrl}/schema/text` })] });
      return;
    }
    if (request.method === "GET" && url.pathname === "/schema/text") {
      json(response, 200, textSchema());
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/v1/model/generateImage") {
      submitCount += 1;
      await readRequestBody(request);
      json(response, 503, { error: "temporary upstream failure" });
      return;
    }
    json(response, 404, { error: "not found" });
  });

  try {
    await assert.rejects(
      run([
        "--prompt", "A robot",
        "--base-url", server.baseUrl,
        "--output-dir", directory,
      ], { apiKey: "test-key", log: silent, warn: silent }),
      /billable POST was not retried/,
    );
    assert.equal(submitCount, 1);
  } finally {
    await server.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("resume falls back to the result endpoint and never sends a POST", async () => {
  const directory = mkdtempSync(join(tmpdir(), "atlas-3d-resume-test-"));
  let postCount = 0;
  const server = await startServer(async ({ request, response, baseUrl }) => {
    const url = new URL(request.url, baseUrl);
    if (request.method === "POST") {
      postCount += 1;
      json(response, 500, { error: "resume must not POST" });
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/v1/model/prediction/resume-prediction") {
      json(response, 404, { error: "use result endpoint" });
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/v1/model/result/resume-prediction") {
      json(response, 200, {
        code: 200,
        data: {
          id: "resume-prediction",
          model: TEXT_MODEL,
          status: "completed",
          outputs: [`${baseUrl}/resumed.glb`],
        },
      });
      return;
    }
    if (request.method === "GET" && url.pathname === "/resumed.glb") {
      response.writeHead(200, { "content-type": "model/gltf-binary" });
      response.end(glbBuffer());
      return;
    }
    json(response, 404, { error: "not found" });
  });

  try {
    const result = await run([
      "--resume", "resume-prediction",
      "--format", "GLB",
      "--output-dir", directory,
      "--base-url", server.baseUrl,
      "--poll-interval", "0.01",
      "--max-wait", "2",
    ], { apiKey: "test-key", log: silent, warn: silent });

    assert.equal(postCount, 0);
    assert.equal(result.resumed, true);
    assert.equal(result.incurred_by_this_run_usd, 0);
    assert.equal(result.validation.valid, true);
  } finally {
    await server.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
