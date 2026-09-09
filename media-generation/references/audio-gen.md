# Audio — TTS, Music Generation & Speech-to-Text

All three audio tasks share one endpoint (`POST /api/v1/model/generateAudio`) and the same
submit → poll flow. What changes is the model and its input fields:

| Task | Example models | Main input fields |
|------|----------------|-------------------|
| Text-to-speech (TTS) | `bytedance/seed-audio-1.0`, `xai/tts-v1`, ElevenLabs | `text` (+ voice/format/sample_rate) |
| Music / songs | `suno/chirp-v5`, `minimax/music-2.6` | `prompt` and/or `lyrics` |
| Speech-to-text (ASR) | `bytedance/seed-asr-2.0`, `xai/stt-v1` | `audio_url` (+ language/format) |

> Discover audio models at runtime with `GET /api/v1/models` filtered to `type == "Audio"`,
> then fetch the model's schema before building the request — field names vary by model.
> For local audio files, upload first (see `references/upload.md`) to get a URL.

## Table of Contents
- [Python](#python)
- [Node.js / TypeScript](#nodejs--typescript)
- [cURL](#curl)

---

## Python

```python
import requests
import time
import os

ATLAS_API_KEY = os.environ.get("ATLASCLOUD_API_KEY")
BASE_URL = "https://api.atlascloud.ai/api/v1"

HEADERS = {
    "Authorization": f"Bearer {ATLAS_API_KEY}",
    "Content-Type": "application/json",
}


def run_audio_task(model: str, **params) -> list[str]:
    """
    Submit an audio task (TTS, music, or speech-to-text) and return its outputs.

    Returns:
        List of outputs — audio file URLs for TTS/music, transcribed text for ASR.
    """
    # Step 1: Submit task
    payload = {"model": model, **params}
    resp = requests.post(f"{BASE_URL}/model/generateAudio", json=payload, headers=HEADERS, timeout=50)
    resp.raise_for_status()
    prediction_id = resp.json()["data"]["id"]
    print(f"Task submitted. Prediction ID: {prediction_id}")

    # Step 2: Poll for result (TTS/ASR: ~10-60s; music can take a few minutes)
    for _ in range(120):
        time.sleep(3)
        result = requests.get(f"{BASE_URL}/model/prediction/{prediction_id}", headers=HEADERS, timeout=30)
        result.raise_for_status()
        data = result.json()["data"]
        status = data.get("status")
        if status in ("completed", "succeeded"):
            return data["outputs"]
        if status == "failed":
            raise RuntimeError(f"Audio task failed: {data.get('error')}")
    raise TimeoutError("Audio task timed out")


# --- Text-to-speech ---
urls = run_audio_task("bytedance/seed-audio-1.0", text="Welcome to Atlas Cloud.")
print("audio url:", urls[0])

# --- Music generation ---
urls = run_audio_task("suno/chirp-v5", prompt="upbeat synthwave song about coding at night")
print("song url:", urls[0])

# --- Speech-to-text ---
texts = run_audio_task(
    "bytedance/seed-asr-2.0",
    audio_url="https://example.com/meeting.mp3",
    enable_punc=True,
)
print("transcript:", texts[0])
```

---

## Node.js / TypeScript

```typescript
const BASE_URL = "https://api.atlascloud.ai/api/v1";
const HEADERS = {
  Authorization: `Bearer ${process.env.ATLASCLOUD_API_KEY}`,
  "Content-Type": "application/json",
};

/** Submit an audio task (TTS, music, or ASR) and return its outputs. */
async function runAudioTask(model: string, params: Record<string, unknown>): Promise<string[]> {
  // Step 1: Submit task
  const submit = await fetch(`${BASE_URL}/model/generateAudio`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ model, ...params }),
  });
  if (!submit.ok) throw new Error(`submit failed: HTTP ${submit.status}`);
  const { data } = await submit.json();
  console.log(`Task submitted. Prediction ID: ${data.id}`);

  // Step 2: Poll for result (TTS/ASR: ~10-60s; music can take a few minutes)
  for (let i = 0; i < 120; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const poll = await fetch(`${BASE_URL}/model/prediction/${data.id}`, { headers: HEADERS });
    const { data: result } = await poll.json();
    if (["completed", "succeeded"].includes(result.status)) return result.outputs;
    if (result.status === "failed") throw new Error(`Audio task failed: ${result.error}`);
  }
  throw new Error("Audio task timed out");
}

// TTS
console.log(await runAudioTask("bytedance/seed-audio-1.0", { text: "Welcome to Atlas Cloud." }));
// Music
console.log(await runAudioTask("suno/chirp-v5", { prompt: "gentle acoustic morning jingle" }));
// Speech-to-text
console.log(await runAudioTask("bytedance/seed-asr-2.0", { audio_url: "https://example.com/interview.mp3" }));
```

---

## cURL

```bash
# --- Text-to-speech: submit ---
curl -s -X POST "https://api.atlascloud.ai/api/v1/model/generateAudio" \
  -H "Authorization: Bearer $ATLASCLOUD_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "bytedance/seed-audio-1.0", "text": "Welcome to Atlas Cloud."}'

# --- Music: submit ---
curl -s -X POST "https://api.atlascloud.ai/api/v1/model/generateAudio" \
  -H "Authorization: Bearer $ATLASCLOUD_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "suno/chirp-v5", "prompt": "upbeat synthwave song about coding at night"}'

# --- Speech-to-text: submit ---
curl -s -X POST "https://api.atlascloud.ai/api/v1/model/generateAudio" \
  -H "Authorization: Bearer $ATLASCLOUD_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "bytedance/seed-asr-2.0", "audio_url": "https://example.com/meeting.mp3", "enable_punc": true}'

# --- Poll result (same for all three) ---
curl -s "https://api.atlascloud.ai/api/v1/model/prediction/PREDICTION_ID" \
  -H "Authorization: Bearer $ATLASCLOUD_API_KEY"
```

## Notes

- **Model schemas differ** — always fetch the model schema (`references/models.md` explains how) before hardcoding fields. E.g. some TTS models take `references` for voice cloning; Suno accepts `lyrics`/style tags; seed-asr supports `enable_speaker_info`, `show_utterances`.
- **ASR output is text**, not a URL: `outputs[0]` is the transcript itself.
- **Content moderation**: TTS/music inputs go through moderation — medical/violent wording can be blocked.
- **POST is not retried** (billable); GETs can retry with backoff. Same policy as image/video.
