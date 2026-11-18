// Seedance video workflow — provider-adapted Atlas executor + ffmpeg draft stitcher.
// Modes:
//   "grid"       (default): crop a storyboard; one independent I2V clip per panel.
//   "shot-pairs": independent I2V clips from start/end keyframe pairs; ideal for planned cuts.
//   "reference": role-specific R2V reference images (generated or local files).
//   "chain": one continuous action, with the previous generated tail as the next start image.
//
// Usage:
//   node generate.mjs <config.json>
//   GRID_ONLY=1 node generate.mjs <config.json>   # Generate grid and crop frames only; display grid.png and inspect it before video work.
//   CLIPS_MAX=1 node generate.mjs <config.json>   # In grid mode, run only the first N clips as a quality gate.
//   CONFIRM_SPEND_IMAGES=1 CONFIRM_SPEND_SECONDS=40 node generate.mjs <config.json>   # Approve 1 new image and up to 40 billed video seconds for this run.
//
// Every run (GRID_ONLY and REFS_ONLY included) prints a [spend-plan] line with
// the new image jobs and billed video seconds before it submits anything, and
// stops there unless CONFIRM_SPEND_IMAGES and CONFIRM_SPEND_SECONDS cover the
// plan. Nothing is approved by default: set them only after the user has
// approved that plan and its cost.
// A video task is never resubmitted automatically: a failed or silent result
// stops the run and leaves the retry decision to the user.
// Requires Node 18+, ffmpeg, and ffprobe. Execution adapters live in scripts/providers/.
import { readFileSync, mkdirSync, existsSync, copyFileSync, renameSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { createExecutor, resolveModelProfile } from "./providers/index.mjs";
import { insideRoot, readAudioFile } from "./providers/guards.mjs";

const CFG_PATH = resolve(process.argv[2] || "./config.json");
const CFG = JSON.parse(readFileSync(CFG_PATH, "utf8"));
const ROOT = dirname(CFG_PATH);
const DIR = resolve(ROOT, CFG.outDir || "build");
if (!insideRoot(ROOT, DIR)) throw new Error(`outDir must stay inside the job directory ${ROOT}, got ${DIR}`);
// Executables come from PATH or the environment, never from the job config.
for (const field of ["ffmpeg", "ffprobe"]) {
  if (CFG[field] && CFG[field] !== field) console.warn(`[config] ignoring ${field}: ${JSON.stringify(CFG[field])}; set ${field.toUpperCase()}_PATH in the environment instead.`);
}
const FFMPEG = process.env.FFMPEG_PATH || "ffmpeg";
const FFPROBE = process.env.FFPROBE_PATH || "ffprobe";
const MODE = CFG.mode || "grid";
const PROFILE = resolveModelProfile(CFG.modelProfile);
const EXECUTOR = createExecutor({ config: CFG, root: ROOT, log: console.log });
const IMG_MODEL = CFG.grid?.model || PROFILE.image;
const VID_MODEL = CFG.video?.model || PROFILE.video.i2v;
const V = { resolution: "1080p", ratio: "9:16", duration: 5, generate_audio: true, watermark: false, ...CFG.video };
const AUDIO = CFG.audio || {};
if (AUDIO.outputRetries) console.warn("[config] audio.outputRetries is no longer supported: a video without native audio has already been billed, so the runner stops instead of resubmitting it.");
// What a run may bill without explicit approval: nothing. Every new image and
// every billed video second needs CONFIRM_SPEND_IMAGES / CONFIRM_SPEND_SECONDS.
const UNCONFIRMED_SPEND_IMAGES = 0;
const UNCONFIRMED_SPEND_SECONDS = 0;
const MAX_POLL_SECONDS = CFG.maxPollSeconds ?? 900;
const RES = { "9:16": [1080, 1920], "16:9": [1920, 1080], "1:1": [1080, 1080], "3:4": [1080, 1440], "4:3": [1440, 1080], "21:9": [2520, 1080] };
const [OW, OH] = RES[V.ratio] || [1080, 1920];
const pad = i => String(i).padStart(2, "0");

const sleep = ms => new Promise(r => setTimeout(r, ms));
function imageMime(buffer, path) {
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return "image/jpeg";
  if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  throw new Error(`unsupported image format: ${path} (use PNG, JPEG, or WebP)`);
}
function dataUrl(path) {
  const buffer = readFileSync(path);
  return `data:${imageMime(buffer, path)};base64,${buffer.toString("base64")}`;
}
function ff(args, label) { const r = spawnSync(FFMPEG, args, { encoding: "utf8", maxBuffer: 64e6 }); if (r.status !== 0) throw new Error(`${label} ffmpeg:\n${(r.stderr || "").split("\n").slice(-12).join("\n")}`); }
function probeWH(f) { const r = spawnSync(FFPROBE, ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", f], { encoding: "utf8" }); const [w, h] = (r.stdout || "").trim().split(",").map(Number); if (!w || !h) throw new Error("ffprobe failed on " + f); return [w, h]; }
function hasAudio(f) { const r = spawnSync(FFPROBE, ["-v", "error", "-select_streams", "a:0", "-show_entries", "stream=index", "-of", "csv=p=0", f], { encoding: "utf8" }); return r.status === 0 && Boolean((r.stdout || "").trim()); }
function assertReferenceAspect(path) {
  if (!EXECUTOR.maxReferenceAspectRatio) return;
  const [width, height] = probeWH(path);
  const aspect = width / height;
  const maximum = EXECUTOR.maxReferenceAspectRatio;
  if (aspect > maximum || aspect < 1 / maximum) {
    throw new Error(`reference image aspect ratio ${aspect.toFixed(2)} is outside Atlas Seedance R2V's supported range 0.40–${maximum}. Re-layout the storyboard while preserving reading order before submitting it.`);
  }
}

function announceStoryboardPreview(path) {
  const previewPath = resolve(path);
  console.log(`\n[storyboard-preview] ${previewPath}`);
  console.log("[storyboard-preview] Display this image in the host UI as an intermediate state; inspect it before submitting video.");
}

async function uploadAudioReference(ref, index) {
  if (typeof ref === "string" && /^https?:\/\//.test(ref)) return ref;
  const source = typeof ref === "string" ? ref : ref?.file || ref?.url;
  if (!source) throw new Error(`input audio reference ${index} needs file or url`);
  if (/^https?:\/\//.test(source)) return source;
  const what = `input audio reference ${index}`;
  if (!existsSync(resolve(ROOT, source))) throw new Error(`${what} file does not exist: ${resolve(ROOT, source)}`);
  const { path } = readAudioFile(ROOT, source, what);   // inside the job directory and really audio
  try {
    return await EXECUTOR.uploadMedia(path);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`input audio reference ${index} upload failed: ${message}`);
  }
}

async function loadAudioReferences() {
  const refs = AUDIO.references || [];
  if (!Array.isArray(refs)) throw new Error("audio.references must be an array");
  return Promise.all(refs.map((ref, i) => uploadAudioReference(ref, i + 1)));
}

function selectedAudioReferences(segment, uploaded) {
  if (!uploaded.length) return [];
  const selected = segment?.audioRefs;
  if (selected === undefined) return uploaded;
  if (!Array.isArray(selected)) throw new Error("segment.audioRefs must be an array of audio-reference indexes");
  return selected.map(index => {
    if (!Number.isInteger(index) || !uploaded[index - 1]) throw new Error(`invalid audio-reference index: ${index}`);
    return uploaded[index - 1];
  });
}

function isInputAudioFailure(message) {
  return /(reference_audios?|input audio|audio (input|reference|upload|url|format|decode)|(?:invalid|unsupported|malformed).{0,40}audio)/i.test(message);
}

function resumePredictionIdFor(label, explicitId) {
  const id = explicitId || CFG.execution?.resumePredictionIds?.[label];
  if (id !== undefined && (typeof id !== "string" || !id.trim())) {
    throw new Error(`execution.resumePredictionIds.${label} must be a non-empty prediction ID`);
  }
  return id;
}

function taskRecoveryError(label, id, error) {
  const message = error instanceof Error ? error.message : String(error);
  return new Error(
    `${message} Preserve prediction ${id}; resume it with execution.resumePredictionIds.${label}. `
    + "Do not submit a replacement unless the task reaches a terminal failure and an explicit retry decision is made.",
  );
}

async function generateImage(body, label, explicitResumeId) {
  const resumeId = resumePredictionIdFor(label, explicitResumeId);
  let id;
  try {
    id = resumeId || (await EXECUTOR.submitImage(body)).id;
    console.log(resumeId ? `[${label}] resuming ${id}` : `[${label}] submitted ${id}`);
    const result = await EXECUTOR.poll(id, label, MAX_POLL_SECONDS);
    if (!result.outputs?.[0]) throw new Error(`[${label}] completed without an image output`);
    return result;
  } catch (error) {
    if (!id) throw error;
    throw taskRecoveryError(label, id, error);
  }
}

async function generateVideo(body, label, out, last, resumePredictionId) {
  const hasReferenceAudio = Array.isArray(body.reference_audios) && body.reference_audios.length > 0;
  const resumeId = resumePredictionIdFor(label, resumePredictionId);
  let id;
  try {
    id = resumeId || (await EXECUTOR.submitVideo(body)).id;
    console.log(resumeId ? `[${label}] resuming ${id}` : `[${label}] submitted ${id}`);
    const d = await EXECUTOR.poll(id, label, MAX_POLL_SECONDS);
    if (!d.outputs?.[0]) throw new Error(`[${label}] model returned no video output`);
    await EXECUTOR.download(d.outputs[0], out);
    if (V.generate_audio && !hasAudio(out)) {
      // The task completed, so it has been billed. Keep the file aside (a later
      // run must not treat it as a finished segment) and stop rather than resubmit.
      const kept = out.replace(/\.mp4$/, "") + ".no-audio.mp4";
      renameSync(out, kept);
      throw new Error(
        `[${label}] prediction ${id} completed and was billed, but its video has no native audio track (saved as ${kept}). `
        + "Nothing was resubmitted. Tell the user, and run again only if they decide to pay for a new attempt.",
      );
    }
    if (last && d.outputs[1]) await EXECUTOR.download(d.outputs[1], last);
    return d;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (hasReferenceAudio && isInputAudioFailure(message)) {
      throw new Error(`[${label}] input audio reference failed; check audio.references file, format, accessibility, or segment audioRefs. Original error: ${message}`);
    }
    if (!id || message.includes(`prediction ${id} completed and was billed`)) throw error;
    throw taskRecoveryError(label, id, error);
  }
}

// Seedance 2.5 image-to-video takes its frame from the input image: its ratio
// accepts only "adaptive". Other models get the configured ratio.
function i2vRatio(model) {
  return /^bytedance\/seedance-2\.5\//.test(model) ? "adaptive" : V.ratio;
}

// The image jobs this run would submit (storyboard grid, generated references).
function plannedImageJobs() {
  const jobs = [];
  const add = (label, out, explicitResumeId) => {
    if (existsSync(out)) return;   // cached images are not regenerated
    jobs.push({ label, resumed: Boolean(resumePredictionIdFor(label, explicitResumeId)) });
  };
  if (CFG.grid) add("grid", `${DIR}/grid.png`, CFG.grid.resumePredictionId);
  if (process.env.GRID_ONLY) return jobs;   // a grid-only run stops after the grid
  if (Array.isArray(CFG.refs)) {
    CFG.refs.forEach((ref, i) => {
      if (!ref?.file) add(`ref${i + 1}`, `${DIR}/ref_${pad(i + 1)}.png`, ref?.resumePredictionId);   // local files are copied, not generated
    });
  }
  return jobs;
}

// The video jobs this run would submit, before anything is submitted.
function plannedVideoJobs() {
  const jobs = [];
  if (process.env.GRID_ONLY || process.env.REFS_ONLY) return jobs;   // these runs stop before any video
  const add = (label, out, seconds, explicitResumeId) => {
    if (existsSync(out)) return;   // cached segments are not resubmitted
    const resumed = Boolean(resumePredictionIdFor(label, explicitResumeId));
    jobs.push({ label, seconds: Number(seconds) || 0, resumed });
  };
  const limit = (envName, total) => Math.min(total, process.env[envName] ? Math.max(0, +process.env[envName]) : total);
  if (MODE === "grid") {
    const total = (CFG.grid?.rows || 0) * (CFG.grid?.cols || 0);
    for (let i = 0; i < limit("CLIPS_MAX", total); i++) add(`clip${i + 1}`, `${DIR}/clip${i + 1}.mp4`, V.duration);
  } else {
    const segs = Array.isArray(CFG.segments) ? CFG.segments : [];
    const prefix = MODE === "shot-pairs" ? "shot" : "seg";
    for (let i = 0; i < limit("SEGS_MAX", segs.length); i++) {
      const s = segs[i] || {};
      add(`${prefix}${i + 1}`, `${DIR}/${prefix}${i + 1}.mp4`, s.duration || V.duration, MODE === "reference" ? s.resumePredictionId : undefined);   // only reference mode reads segment.resumePredictionId
    }
  }
  return jobs;
}

function approvedAmount(envName, fallback) {
  if (process.env[envName] === undefined) return fallback;
  const value = Number(process.env[envName]);
  if (!Number.isFinite(value) || value < 0) throw new Error(`${envName} must be a non-negative number`);
  return value;
}

function enforceSpendPlan() {
  const imageJobs = plannedImageJobs();
  const freshImages = imageJobs.filter(job => !job.resumed);
  const jobs = plannedVideoJobs();
  const fresh = jobs.filter(job => !job.resumed);
  const seconds = fresh.reduce((sum, job) => sum + job.seconds, 0);
  const resumed = imageJobs.length - freshImages.length + jobs.length - fresh.length;
  console.log(
    `[spend-plan] ${freshImages.length} new image job(s) with ${IMG_MODEL}: ${freshImages.map(job => job.label).join(", ") || "none"}; `
    + `${fresh.length} new video job(s), ${seconds}s total at ${V.resolution}: ${fresh.map(job => `${job.label}=${job.seconds}s`).join(", ") || "none"}`
    + `${resumed ? `; ${resumed} resumed (already billed)` : ""}`,
  );
  const approvedImages = approvedAmount("CONFIRM_SPEND_IMAGES", UNCONFIRMED_SPEND_IMAGES);
  const approvedSeconds = approvedAmount("CONFIRM_SPEND_SECONDS", UNCONFIRMED_SPEND_SECONDS);
  if (freshImages.length > approvedImages || seconds > approvedSeconds) {
    throw new Error(
      `[spend-plan] this run would submit ${freshImages.length} new image job(s) and ${seconds} billed video seconds; approved: ${approvedImages} image(s), ${approvedSeconds}s. Nothing was submitted. `
      + `Show the user the plan above and its estimated cost; after they approve it, run again with CONFIRM_SPEND_IMAGES=${freshImages.length} CONFIRM_SPEND_SECONDS=${seconds}.`,
    );
  }
}

async function genGridAndSplit(b) {
  const { rows, cols } = CFG.grid;
  const N = rows * cols;
  if (!existsSync(`${b}/grid.png`)) {
    const d = await generateImage(
      { model: IMG_MODEL, prompt: CFG.grid.prompt, size: CFG.grid.size || "1728*2304" },
      "grid",
      CFG.grid.resumePredictionId,
    );
    await EXECUTOR.download(d.outputs[0], `${b}/grid.png`);
    console.log(`[grid] saved`);
  } else console.log("[grid] cached — skip");
  announceStoryboardPreview(`${b}/grid.png`);
  const [gw, gh] = probeWH(`${b}/grid.png`);
  const cw = Math.floor(gw / cols), ch = Math.floor(gh / rows);
  for (let i = 0; i < N; i++) {
    const f = `${b}/frame_${pad(i + 1)}.png`;
    if (existsSync(f)) continue;
    const x = (i % cols) * cw, y = Math.floor(i / cols) * ch;
    ff(["-y", "-i", `${b}/grid.png`, "-vf", `crop=${cw}:${ch}:${x}:${y}`, f], `crop${i + 1}`);
    console.log(`[crop] frame_${pad(i + 1)} (${cw}x${ch} @ ${x},${y})`);
  }
  return N;
}

async function genRefs(b) {
  // Generate or copy each local reference image to ref_01..N.png with cache protection.
  for (let i = 0; i < CFG.refs.length; i++) {
    const f = `${b}/ref_${pad(i + 1)}.png`;
    if (existsSync(f)) { console.log(`[ref${i + 1}] cached — skip`); continue; }
    if (CFG.refs[i].file) {
      const source = resolve(ROOT, CFG.refs[i].file);
      if (!existsSync(source)) throw new Error(`ref${i + 1} file not found: ${source}`);
      copyFileSync(source, f);
      console.log(`[ref${i + 1}] copied local file`);
      continue;
    }
    const label = `ref${i + 1}`;
    const d = await generateImage(
      { model: IMG_MODEL, prompt: CFG.refs[i].prompt, size: CFG.refs[i].size || "1328*1776" },
      label,
      CFG.refs[i].resumePredictionId,
    );
    await EXECUTOR.download(d.outputs[0], f);
    console.log(`[${label}] saved`);
  }
}

function stitch(b, clips, trimFirst) {
  // trimFirst[i] is the number of opening frames removed to avoid a duplicated seam; zero keeps all frames.
  const keepAudio = V.generate_audio;
  if (keepAudio && !clips.every(hasAudio)) {
    throw new Error("[stitch] a segment has no native audio track; stitching stopped rather than silently downgrading to a silent output. Regenerate that segment.");
  }
  const parts = clips.map((c, i) => {
    const tr = trimFirst[i] ? `,trim=start_frame=${trimFirst[i]},setpts=PTS-STARTPTS` : "";
    return `[${i}:v]scale=${OW}:${OH},fps=30,setsar=1${tr}[v${i}]`;
  }).join(";");
  const audioParts = keepAudio ? clips.map((_, i) => {
    const tr = trimFirst[i] ? `atrim=start=${trimFirst[i] / 30},` : "";
    return `[${i}:a]${tr}aformat=sample_rates=48000:channel_layouts=stereo,asetpts=PTS-STARTPTS[a${i}]`;
  }).join(";") : "";
  const cat = keepAudio
    ? clips.map((_, i) => `[v${i}][a${i}]`).join("") + `concat=n=${clips.length}:v=1:a=1[v][a]`
    : clips.map((_, i) => `[v${i}]`).join("") + `concat=n=${clips.length}:v=1:a=0[v]`;
  const args = ["-y"];
  for (const c of clips) args.push("-i", c);
  args.push("-filter_complex", [parts, audioParts, cat].filter(Boolean).join(";"), "-map", "[v]");
  if (keepAudio) args.push("-map", "[a]", "-c:a", "aac", "-b:a", "192k");
  args.push("-c:v", "libx264", "-crf", "18", "-preset", "medium", "-movflags", "+faststart", `${b}/final.mp4`);
  ff(args, "stitch");
}

function overlayFilter() {
  const legacy = CFG.delogo;
  const filter = CFG.cleanupOverlay?.filter || (typeof legacy === "string" ? legacy : undefined);
  // Only delogo's own options, so the config cannot splice other ffmpeg filters in.
  if (filter && !/^x=\d+:y=\d+:w=\d+:h=\d+(:show=[01])?$/.test(filter)) {
    throw new Error(`cleanupOverlay.filter must look like x=10:y=10:w=200:h=80, got ${JSON.stringify(filter)}`);
  }
  return filter;
}

function cleanupAccidentalOverlay(b) {
  const filter = overlayFilter();
  if (!filter) return `${b}/final.mp4`;
  ff(["-y", "-i", `${b}/final.mp4`, "-vf", `delogo=${filter}`, "-c:v", "libx264", "-crf", "20", "-preset", "veryfast", "-c:a", "copy", "-movflags", "+faststart", `${b}/final_clean.mp4`], "cleanup-overlay");
  return `${b}/final_clean.mp4`;
}

async function main() {
  mkdirSync(DIR, { recursive: true });
  const b = DIR;
  const requiredModels = [IMG_MODEL];
  if (MODE === "reference") requiredModels.push(CFG.video?.refModel || PROFILE.video.r2v);
  else if (MODE === "chain") requiredModels.push(VID_MODEL, CFG.video?.t2vModel || PROFILE.video.t2v);
  else requiredModels.push(VID_MODEL);
  if (CFG.execution?.verifyModels !== false) await EXECUTOR.verifyModels([...new Set(requiredModels)]);
  console.log(`[executor] ${EXECUTOR.id}; model profile ${CFG.modelProfile || "seedance-default"}`);
  if (AUDIO.references !== undefined && !Array.isArray(AUDIO.references)) throw new Error("audio.references must be an array");
  if (AUDIO.references?.length && MODE !== "reference") throw new Error("audio.references is supported only in reference-to-video mode; use native-audio prompt markers for other modes.");
  overlayFilter();   // reject a bad filter before anything is billed
  enforceSpendPlan();   // before any submission, images included, in every run mode
  const N = CFG.grid ? await genGridAndSplit(b) : 0;   // Grid is optional: a text-to-video chain needs none.
  if (process.env.GRID_ONLY) {
    console.log(CFG.grid
      ? "[grid-only] Grid and frame crops complete. Display the storyboard-preview image above; inspect it before running video generation separately."
      : "[grid-only] This job has no grid; nothing to generate.");
    return;
  }
  if (CFG.refs) await genRefs(b);                      // Reference mode generates the role-specific images first.
  if (process.env.REFS_ONLY) { console.log("[refs-only] References generated; inspect them before video work."); return; }
  if (MODE === "reference") CFG.refs.forEach((_, index) => assertReferenceAspect(`${b}/ref_${pad(index + 1)}.png`));
  const audioRefs = MODE === "reference" ? await loadAudioReferences() : [];

  if (MODE === "reference") {
    // ── Multi-reference video: hand, setting, style, finished state, and opening frame may be combined. ──
    const segs = CFG.segments;
    if (!Array.isArray(segs) || !segs.length) throw new Error("reference mode needs segments[]");
    const REFMODEL = CFG.video.refModel || PROFILE.video.r2v;
    const nSeg = process.env.SEGS_MAX ? +process.env.SEGS_MAX : segs.length;
    for (let i = 0; i < nSeg; i++) {
      const s = segs[i];
      const out = `${b}/seg${i + 1}.mp4`, last = `${b}/seg${i + 1}_last.png`;
      if (existsSync(out)) { console.log(`[seg${i + 1}] cached — skip`); continue; }
      const refImgs = (s.refs || CFG.refs.map((_, k) => k + 1)).map(idx => dataUrl(`${b}/ref_${pad(idx)}.png`));
      if (s.chainPrevAsRef && i > 0 && existsSync(`${b}/seg${i}_last.png`)) refImgs.push(dataUrl(`${b}/seg${i}_last.png`)); // Prior tail frame is an extra reference for a deliberate continuation.
      const body = { model: REFMODEL, prompt: s.prompt + (CFG.styleSuffix || ""), reference_images: refImgs, duration: s.duration || V.duration, resolution: V.resolution, ratio: V.ratio, generate_audio: V.generate_audio, watermark: V.watermark, return_last_frame: true };
      const segmentAudioRefs = selectedAudioReferences(s, audioRefs);
      if (segmentAudioRefs.length) body.reference_audios = segmentAudioRefs;
      const d = await generateVideo(body, `seg${i + 1}`, out, last, s.resumePredictionId);
      console.log(`[seg${i + 1}] saved (tokens ${d.completion_tokens})`);
    }
    if (!segs.every((_, i) => existsSync(`${b}/seg${i + 1}.mp4`))) { console.log("[stitch] Not all segments are present; skipping."); return; }
    stitch(b, segs.map((_, i) => `${b}/seg${i + 1}.mp4`), segs.map(() => 0)); // Independent segments use hard cuts.
  } else if (MODE === "shot-pairs") {
    // ── Start/end-frame I2V: every segment is independent for hard or match cuts. ──
    if (!CFG.grid) throw new Error("shot-pairs mode needs grid as the keyframe source");
    const segs = CFG.segments;
    if (!Array.isArray(segs) || !segs.length) throw new Error("shot-pairs mode needs segments[]");
    const nSeg = process.env.SEGS_MAX ? +process.env.SEGS_MAX : segs.length;
    for (let i = 0; i < nSeg; i++) {
      const s = segs[i];
      if (!Number.isInteger(s.first)) throw new Error(`shot-pairs segment ${i + 1} needs a first keyframe index`);
      const out = `${b}/shot${i + 1}.mp4`;
      if (existsSync(out)) { console.log(`[shot${i + 1}] cached — skip`); continue; }
      const body = { model: VID_MODEL, prompt: s.prompt + (CFG.styleSuffix || ""), image: dataUrl(`${b}/frame_${pad(s.first)}.png`), duration: s.duration || V.duration, resolution: V.resolution, ratio: i2vRatio(VID_MODEL), generate_audio: V.generate_audio, watermark: V.watermark };
      if (Number.isInteger(s.last)) body.last_image = dataUrl(`${b}/frame_${pad(s.last)}.png`);
      const d = await generateVideo(body, `shot${i + 1}`, out);
      console.log(`[shot${i + 1}] saved (tokens ${d.completion_tokens})`);
    }
    if (!segs.every((_, i) => existsSync(`${b}/shot${i + 1}.mp4`))) { console.log("[stitch] Not all segments are present; skipping."); return; }
    stitch(b, segs.map((_, i) => `${b}/shot${i + 1}.mp4`), segs.map(() => 0));
  } else if (MODE === "chain") {
    // ── Chained segments: use the prior real tail only for one uninterrupted action. ──
    // Segment source: t2v (no image), i2v-from-grid (keyframe), or i2v-chain (prior real tail).
    const segs = CFG.segments;
    if (!Array.isArray(segs) || !segs.length) throw new Error("chain mode needs segments[]");
    const T2V = CFG.video.t2vModel || PROFILE.video.t2v;
    const nSeg = process.env.SEGS_MAX ? +process.env.SEGS_MAX : segs.length;
    const trim = segs.map((_, i) => (i === 0 ? 0 : (CFG.seamTrimFrames ?? 1))); // Remove duplicate opening frames from later segments.
    for (let i = 0; i < nSeg; i++) {
      const s = segs[i];
      const out = `${b}/seg${i + 1}.mp4`, last = `${b}/seg${i + 1}_last.png`;
      if (existsSync(out)) { console.log(`[seg${i + 1}] cached — skip`); continue; }
      const isT2V = s.t2v || (i === 0 && !s.first && !CFG.grid); // A first segment without grid or first keyframe is text-to-video.
      const body = { prompt: s.prompt + (CFG.styleSuffix || ""), duration: s.duration || V.duration, resolution: V.resolution, ratio: V.ratio, generate_audio: V.generate_audio, watermark: V.watermark, return_last_frame: true };
      if (isT2V) {
        body.model = T2V;
      } else {
        body.model = VID_MODEL;
        body.ratio = i2vRatio(VID_MODEL);
        // Start frame: use prior real tail for a continuous action; otherwise use the independent s.first keyframe.
        body.image = dataUrl((i > 0 && s.chain !== false) ? `${b}/seg${i}_last.png` : `${b}/frame_${pad(s.first)}.png`);
        if (s.last && CFG.grid) body.last_image = dataUrl(`${b}/frame_${pad(s.last)}.png`); // Anchor the segment endpoint to a grid keyframe.
      }
      const d = await generateVideo(body, `seg${i + 1}`, out, last);
      if (!d.outputs[1]) throw new Error(`segment ${i + 1} has no tail frame (outputs[1]); cannot chain`);
      console.log(`[seg${i + 1}] saved (tokens ${d.completion_tokens})`);
    }
    if (!segs.every((_, i) => existsSync(`${b}/seg${i + 1}.mp4`))) { console.log("[stitch] Not all segments are present; skipping."); return; }
    stitch(b, segs.map((_, i) => `${b}/seg${i + 1}.mp4`), trim);
  } else {
    // ── Grid-to-clips: one short clip per panel, assembled as a hard-cut montage. ──
    if (!Array.isArray(CFG.shots) || CFG.shots.length !== N) throw new Error(`grid mode needs shots.length to equal rows*cols (${N})`);
    const nClips = process.env.CLIPS_MAX ? +process.env.CLIPS_MAX : N;
    for (let i = 0; i < nClips; i++) {
      const out = `${b}/clip${i + 1}.mp4`;
      if (existsSync(out)) { console.log(`[clip${i + 1}] cached — skip`); continue; }
      const d = await generateVideo({ model: VID_MODEL, prompt: CFG.shots[i] + (CFG.styleSuffix || ""), image: dataUrl(`${b}/frame_${pad(i + 1)}.png`), resolution: V.resolution, ratio: i2vRatio(VID_MODEL), duration: V.duration, generate_audio: V.generate_audio, watermark: V.watermark }, `clip${i + 1}`, out);
      console.log(`[clip${i + 1}] saved (tokens ${d.completion_tokens})`);
    }
    if (!Array.from({ length: N }, (_, i) => existsSync(`${b}/clip${i + 1}.mp4`)).every(Boolean)) { console.log("[stitch] Not all clips are present; skipping."); return; }
    stitch(b, Array.from({ length: N }, (_, i) => `${b}/clip${i + 1}.mp4`), Array(N).fill(0));
  }

  const finalPath = cleanupAccidentalOverlay(b);
  console.log(`\nDONE → ${finalPath}`);
}
main().catch(e => { console.error("FAILED:", e.message); process.exit(1); });
