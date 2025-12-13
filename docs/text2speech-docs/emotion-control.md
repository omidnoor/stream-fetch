# IndexTTS2 Emotion Control Guide

IndexTTS2 achieves disentanglement between emotional expression and speaker identity, enabling independent control over timbre and emotion. This allows you to apply emotions from different sources while maintaining a consistent speaker voice.

## Emotion Control Modes

IndexTTS2 provides four distinct methods for controlling emotional expression:

### Mode 0: Speaker Voice Only (Default)

Uses the speaker reference audio for both identity and emotion. No additional parameters needed.

```python
tts.infer(
    spk_audio_prompt="speaker.wav",
    text="Hello, how are you today?",
    output_path="output.wav"
)
```

### Mode 1: Audio Emotion Reference

Provides a separate audio file to control emotional expression while maintaining the speaker's voice characteristics.

```python
tts.infer(
    spk_audio_prompt="speaker.wav",       # Voice timbre
    text="I can't believe this happened!",
    output_path="output.wav",
    emo_audio_prompt="surprised.wav",     # Emotion source
    emo_alpha=0.8                          # Blend strength
)
```

**Parameters:**
- `emo_audio_prompt`: Path to emotion reference audio
- `emo_alpha`: Blending weight (0.0 = speaker only, 1.0 = full emotion reference)
  - Recommended value: 0.6-0.8 for natural results

### Mode 2: Emotion Vector

Fine-grained control using an 8-dimensional emotion vector. Allows precise mixing of multiple emotions.

```python
# Vector format: [happy, angry, sad, afraid, disgusted, melancholic, surprised, calm]
emotion = [0.8, 0.0, 0.0, 0.0, 0.0, 0.0, 0.2, 0.0]  # Mostly happy with slight surprise

tts.infer(
    spk_audio_prompt="speaker.wav",
    text="This is amazing news!",
    output_path="output.wav",
    emo_vector=emotion,
    emo_alpha=0.7
)
```

### Mode 3: Text-Based Emotion

Uses the fine-tuned Qwen3 model to convert natural language descriptions into emotion vectors.

```python
tts.infer(
    spk_audio_prompt="speaker.wav",
    text="I understand how difficult this must be for you.",
    output_path="output.wav",
    use_emo_text=True,
    emo_text="sympathetic and caring",
    emo_alpha=0.6
)
```

---

## Emotion Vector Details

### Vector Dimensions

| Index | Emotion | Chinese | Description |
|-------|---------|---------|-------------|
| 0 | Happy | 高兴 | Joy, excitement, positive energy |
| 1 | Angry | 愤怒 | Anger, frustration, intensity |
| 2 | Sad | 悲伤 | Sadness, sorrow, grief |
| 3 | Afraid | 恐惧 | Fear, anxiety, nervousness |
| 4 | Disgusted | 反感 | Disgust, contempt, disapproval |
| 5 | Melancholic | 低落 | Low mood, depression, wistfulness |
| 6 | Surprised | 惊讶 | Surprise, shock, astonishment |
| 7 | Calm | 自然 | Calm, natural, neutral |

### Vector Constraints

- **Value Range**: 0.0 to 1.0 (values up to 1.4 accepted but may cause artifacts)
- **Normalization**: System normalizes vectors internally, ensuring sum ≤ 0.8
- **Emotion Bias**: Surprised and calm are de-emphasized to prevent artifacts

### Preset Emotion Vectors

```python
# Single emotion presets
EMOTIONS = {
    "happy":       [1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    "angry":       [0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    "sad":         [0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    "afraid":      [0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0],
    "disgusted":   [0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0],
    "melancholic": [0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0],
    "surprised":   [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0],
    "calm":        [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0],
}

# Mixed emotion examples
MIXED_EMOTIONS = {
    "excited_joy":    [0.8, 0.0, 0.0, 0.0, 0.0, 0.0, 0.3, 0.0],  # Happy + Surprised
    "nervous":        [0.0, 0.0, 0.0, 0.6, 0.0, 0.3, 0.0, 0.0],  # Afraid + Melancholic
    "frustrated":     [0.0, 0.6, 0.2, 0.0, 0.3, 0.0, 0.0, 0.0],  # Angry + Sad + Disgusted
    "relieved":       [0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.2, 0.5],  # Happy + Surprised + Calm
    "bittersweet":    [0.3, 0.0, 0.5, 0.0, 0.0, 0.3, 0.0, 0.0],  # Happy + Sad + Melancholic
}
```

---

## The emo_alpha Parameter

The `emo_alpha` parameter controls how much the emotion reference influences the output:

```
Final Emotion = emo_alpha * emotion_reference + (1 - emo_alpha) * speaker_emotion
```

| emo_alpha | Effect |
|-----------|--------|
| 0.0 | Speaker's natural emotion only |
| 0.3 | Subtle emotion influence |
| 0.6 | Balanced blend (recommended) |
| 0.8 | Strong emotion influence |
| 1.0 | Full emotion reference |

**Recommendations:**
- Start with `emo_alpha=0.6` for natural results
- Use higher values (0.8-1.0) for dramatic expressions
- Use lower values (0.3-0.5) for subtle emotional coloring

---

## Text-to-Emotion Model

The text-based emotion mode uses a fine-tuned Qwen 0.6B model to interpret emotion descriptions.

### Setup

Ensure the Qwen emotion model is downloaded:
```
checkpoints/
└── qwen_emotion/
    ├── config.json
    └── model.safetensors
```

### Usage

```python
# Simple emotion description
tts.infer(
    spk_audio_prompt="speaker.wav",
    text="Welcome to our show!",
    output_path="output.wav",
    use_emo_text=True,
    emo_text="enthusiastic and welcoming",
    emo_alpha=0.6
)

# Complex emotion description
tts.infer(
    spk_audio_prompt="speaker.wav",
    text="I'm not sure about this decision.",
    output_path="output.wav",
    use_emo_text=True,
    emo_text="hesitant, thoughtful, slightly worried",
    emo_alpha=0.5
)
```

### Effective Emotion Descriptions

| Description | Resulting Emotion |
|-------------|-------------------|
| "happy and excited" | High happiness + surprise |
| "calm and professional" | High calm |
| "sad but accepting" | Moderate sad + calm |
| "angry and frustrated" | High angry + disgusted |
| "scared and nervous" | High afraid + melancholic |

---

## Best Practices

### Voice Cloning Quality

1. **Use clear reference audio**: 10-15 seconds of clear speech
2. **Match emotion context**: Use reference audio with appropriate emotion baseline
3. **Clean audio**: Remove background noise from reference

### Emotion Control

1. **Start subtle**: Begin with `emo_alpha=0.5` and adjust
2. **Single emotions first**: Master single emotions before mixing
3. **Test combinations**: Some emotion combinations work better than others
4. **Watch for artifacts**: High emotion values may cause voice distortion

### Performance

1. **Cache speaker audio**: Reuse the same `IndexTTS2` instance
2. **Batch similar emotions**: Group requests with same emotion settings
3. **Use FP16**: Reduces memory with minimal quality impact

---

## Common Issues

### Voice Identity Loss

**Problem**: Generated voice doesn't match reference speaker
**Solution**: Reduce `emo_alpha` to preserve more speaker characteristics

### Unnatural Prosody

**Problem**: Speech sounds robotic or unnatural
**Solution**:
- Use emotion vectors with moderate values (0.5-0.7)
- Ensure emotion matches text content
- Try audio-based emotion reference instead of vectors

### Artifacts in Emotional Speech

**Problem**: Clicking, distortion, or glitches
**Solution**:
- Reduce emotion intensity values
- Avoid very high values on "surprised" dimension
- Use cleaner reference audio
