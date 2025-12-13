# IndexTTS2 Integrations

## ComfyUI Integration

Several ComfyUI custom nodes provide IndexTTS2 integration for AI workflows.

### ComfyUI-IndexTTS2 (snicolast)

Lightweight wrapper for voice cloning and emotion control.

**Installation:**
```bash
cd ComfyUI/custom_nodes
git clone https://github.com/snicolast/ComfyUI-IndexTTS2.git
cd ComfyUI-IndexTTS2
pip install wetext
pip install -r requirements.txt
```

**Setup:**
1. Create `checkpoints/` folder in the repo root
2. Copy IndexTTS-2 model files from HuggingFace

**Available Nodes:**

| Node | Description |
|------|-------------|
| IndexTTS2 Simple | Basic inference with speaker audio, text, optional emotion |
| IndexTTS2 Advanced | Full control including sampling, speed, pauses, CFG, seed |
| IndexTTS2 Emotion Vector | 8 sliders for emotion control |
| IndexTTS2 Emotion From Text | Converts text descriptions to emotion vectors |

**Emotion Vector Node:**
- 8 sliders (Happy, Angry, Sad, Fear, Hate, Love, Surprise, Neutral)
- Value range: 0.0-1.4
- Sum constraint: ≤ 1.5

---

### TTS-Audio-Suite (diodiogod)

Comprehensive multi-engine TTS integration.

**Repository:** https://github.com/diodiogod/TTS-Audio-Suite

**Supported Models:**
- IndexTTS-2
- RVC
- Chatterbox (23 languages)
- F5-TTS
- Higgs Audio 2
- Microsoft VibeVoice

**Features:**
- Unlimited text length
- SRT timing support
- Character voice support
- Audio analyzer
- Audio editing

**Emotion Control Tips:**
- Values above 1.0 create intense expression but may affect voice resemblance
- Combine emotions (e.g., 0.8 Happy + 0.3 Surprised = excited joy)

---

### ComfyUI_IndexTTS (billwuhao)

Supports two-person dialogue synthesis.

**Installation:**
```bash
cd ComfyUI/custom_nodes
git clone https://github.com/billwuhao/ComfyUI_IndexTTS.git
pip install -r requirements.txt
```

---

## Cloud API: fal.ai

fal.ai provides hosted IndexTTS-2 inference.

**Pricing:** $0.002 per generated audio second

### Endpoint

```
POST https://fal.run/fal-ai/index-tts-2/text-to-speech
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `audio_url` | string | Yes | Reference audio URL |
| `prompt` | string | Yes | Text to synthesize |
| `emotional_audio_url` | string | No | Emotion reference audio URL |
| `strength` | float | No | Emotion intensity (0-1) |
| `emotional_strengths` | object | No | Fine-grained emotion control |
| `should_use_prompt_for_emotion` | boolean | No | Derive emotion from prompt text |
| `emotion_prompt` | string | No | Separate emotion description |

### Emotional Strengths Object

```json
{
  "happy": 0.8,
  "angry": 0.0,
  "sad": 0.0,
  "afraid": 0.0,
  "disgusted": 0.0,
  "melancholic": 0.0,
  "surprised": 0.2,
  "calm": 0.0
}
```

### Response

```json
{
  "audio": {
    "url": "https://...",
    "content_type": "audio/wav",
    "file_name": "output.wav",
    "file_size": 123456
  }
}
```

### JavaScript Example

```javascript
import { fal } from "@fal-ai/client";

fal.config({
  credentials: "YOUR_FAL_KEY"
});

const result = await fal.subscribe("fal-ai/index-tts-2/text-to-speech", {
  input: {
    audio_url: "https://example.com/reference.mp3",
    prompt: "Hello, this is a test of the IndexTTS API!"
  }
});

console.log(result.audio.url);
```

### Python Example

```python
import fal_client

result = fal_client.subscribe(
    "fal-ai/index-tts-2/text-to-speech",
    arguments={
        "audio_url": "https://example.com/reference.mp3",
        "prompt": "Hello, this is a test!",
        "emotional_strengths": {
            "happy": 0.8,
            "surprised": 0.2
        }
    }
)

print(result["audio"]["url"])
```

---

## SiliconFlow Integration

SiliconFlow offers IndexTTS-2 as a hosted model.

**Documentation:** https://www.siliconflow.com/models/indextts-2

---

## Audiobook Creation: tts-audiobook-tool

Tool supporting multiple TTS models for audiobook creation.

**Repository:** https://github.com/zeropointnine/tts-audiobook-tool

**Supported Models:**
- IndexTTS2
- VibeVoice
- Higgs V2
- Fish S1-mini
- Chatterbox
- Oute TTS

**Features:**
- Zero-shot voice cloning
- Web-based player/reader app
- Multiple TTS engine support

---

## Integration Best Practices

### Reference Audio Requirements

For best results across all integrations:

| Requirement | Recommendation |
|-------------|----------------|
| Duration | 10-15 seconds |
| Format | WAV, MP3, or FLAC |
| Quality | Clear, no background noise |
| Content | Natural speech, varied tones |
| Sample Rate | 16kHz+ |

### Error Handling

```python
try:
    result = tts.infer(
        spk_audio_prompt="speaker.wav",
        text="Test text",
        output_path="output.wav"
    )
except Exception as e:
    print(f"TTS Error: {e}")
    # Handle: retry with different parameters,
    # use fallback voice, or notify user
```

### Batch Processing

```python
# Efficient batch processing with caching
tts = IndexTTS2(cfg_path="checkpoints/config.yaml", model_dir="checkpoints")

texts = load_texts_from_file("script.txt")

for i, text in enumerate(texts):
    output_path = f"audio/segment_{i:04d}.wav"
    tts.infer(
        spk_audio_prompt="narrator.wav",  # Cached after first call
        text=text,
        output_path=output_path
    )
```

### Multi-Voice Scripts

```python
characters = {
    "narrator": "voices/narrator.wav",
    "alice": "voices/alice.wav",
    "bob": "voices/bob.wav"
}

script = [
    ("narrator", "The story begins on a quiet morning."),
    ("alice", "Good morning, Bob! How are you today?"),
    ("bob", "I'm doing well, thank you for asking."),
]

for i, (character, line) in enumerate(script):
    tts.infer(
        spk_audio_prompt=characters[character],
        text=line,
        output_path=f"audio/{i:04d}_{character}.wav"
    )
```
