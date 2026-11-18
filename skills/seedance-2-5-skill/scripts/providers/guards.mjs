// Limits on what a job config may point the runner at. A config file is often
// copied from a repository or written by an agent, so it must not be able to
// send the user's credentials, or files, anywhere other than Atlas Cloud.
import { readFileSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";

export const DEFAULT_API_BASE = "https://api.atlascloud.ai";

// Only the Atlas API itself. A different host (for example a staging gateway)
// can be set by the user in the environment, never by the job config.
export function apiBase(config = {}, log = console.log) {
  const configured = config.execution?.base || config.base;
  if (configured && configured.replace(/\/+$/, "") !== DEFAULT_API_BASE) {
    log(`[executor] ignoring execution.base ${JSON.stringify(configured)}: a job config cannot change the API host. Set ATLASCLOUD_API_BASE in the environment instead.`);
  }
  const fromEnv = process.env.ATLASCLOUD_API_BASE;
  if (fromEnv) {
    if (!/^https:\/\/[^/]+$/.test(fromEnv.replace(/\/+$/, ""))) throw new Error("ATLASCLOUD_API_BASE must be an https origin such as https://api.atlascloud.ai");
    return fromEnv.replace(/\/+$/, "");
  }
  return DEFAULT_API_BASE;
}

// The key is read only from an Atlas-named variable, so a config cannot turn
// another secret (AWS_SECRET_ACCESS_KEY, GITHUB_TOKEN, ...) into the bearer.
export function apiKeyEnvName(config = {}) {
  const name = config.execution?.apiKeyEnv || config.apiKeyEnv || "ATLASCLOUD_API_KEY";
  if (!/^ATLAS_?CLOUD_[A-Z0-9_]*$/.test(name)) {
    throw new Error(`execution.apiKeyEnv must name an ATLASCLOUD_* variable, got ${JSON.stringify(name)}`);
  }
  return name;
}

export function insideRoot(root, path) {
  const rel = relative(resolve(root), resolve(path));
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

// A local file the runner uploads must sit under the job directory.
export function localFileUnderRoot(root, source, what) {
  const path = resolve(root, source);
  if (!insideRoot(root, path)) throw new Error(`${what} must be a file inside the job directory ${resolve(root)}, got ${path}`);
  return path;
}

// Recognise the audio containers Seedance accepts by their first bytes, so a
// renamed private file (an SSH key, a .env) is never uploaded as "audio".
export function audioMimeFromBytes(buffer) {
  const ascii = (start, end) => buffer.subarray(start, end).toString("ascii");
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WAVE") return "audio/wav";
  if (ascii(0, 3) === "ID3") return "audio/mpeg";
  if (ascii(0, 4) === "OggS") return "audio/ogg";
  if (ascii(0, 4) === "fLaC") return "audio/flac";
  if (ascii(4, 8) === "ftyp") return "audio/mp4";
  if (buffer.length > 1 && buffer[0] === 0xff && (buffer[1] & 0xf6) === 0xf0) return "audio/aac";   // ADTS
  if (buffer.length > 1 && buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) return "audio/mpeg";  // MPEG frame sync
  return undefined;
}

export function readAudioFile(root, source, what) {
  const path = localFileUnderRoot(root, source, what);
  const buffer = readFileSync(path);
  const mime = audioMimeFromBytes(buffer);
  if (!mime) throw new Error(`${what} is not a recognised audio file (WAV, MP3, AAC, M4A, OGG or FLAC): ${path}`);
  return { path, buffer, mime };
}
