# IndexTTS2 Python API Reference

## Class: IndexTTS2

The main class for IndexTTS2 inference.

### Import

```python
from indextts.infer_v2 import IndexTTS2
```

### Constructor

```python
tts = IndexTTS2(
    cfg_path="checkpoints/config.yaml",
    model_dir="checkpoints",
    use_fp16=False,
    device=None,
    use_cuda_kernel=None,
    use_deepspeed=False,
    use_accel=False,
    use_torch_compile=False
)
```

#### Initialization Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `cfg_path` | str | `"checkpoints/config.yaml"` | Path to configuration file |
| `model_dir` | str | `"checkpoints"` | Directory containing model weights |
| `use_fp16` | bool | `False` | Enable half-precision inference (reduces VRAM ~50%) |
| `device` | str/None | `None` | Target device (`"cuda:0"`, `"cpu"`). Auto-detected if None |
| `use_cuda_kernel` | bool/None | `None` | Enable BigVGAN CUDA kernels. Auto-enabled on CUDA if None |
| `use_deepspeed` | bool | `False` | Enable DeepSpeed acceleration for GPT |
| `use_accel` | bool | `False` | Enable CUDA graph acceleration for GPT2 |
| `use_torch_compile` | bool | `False` | JIT optimize S2Mel component (PyTorch 2.0+) |

---

## Core Method: infer()

Generate speech from text using a reference voice.

```python
result = tts.infer(
    spk_audio_prompt,
    text,
    output_path,
    emo_audio_prompt=None,
    emo_alpha=1.0,
    emo_vector=None,
    use_emo_text=False,
    emo_text=None,
    use_random=False,
    verbose=False,
    max_text_tokens_per_segment=120,
    interval_silence=200,
    do_sample=True,
    top_p=0.8,
    top_k=30,
    temperature=0.8,
    num_beams=3,
    repetition_penalty=10.0,
    max_mel_tokens=1500
)
```

### Required Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `spk_audio_prompt` | str | Path to speaker reference audio (max 15 seconds) |
| `text` | str | Text to synthesize |
| `output_path` | str/None | Output WAV file path. If None, returns audio array |

### Emotion Control Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `emo_audio_prompt` | str/None | `None` | Path to emotion reference audio |
| `emo_alpha` | float | `1.0` | Emotion intensity (0.0 = speaker only, 1.0 = full emotion) |
| `emo_vector` | list[float]/None | `None` | 8-dimensional emotion array |
| `use_emo_text` | bool | `False` | Enable text-based emotion extraction |
| `emo_text` | str/None | `None` | Emotion description text |
| `use_random` | bool | `False` | Add stochasticity to generation |

### Generation Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `do_sample` | bool | `True` | Enable sampling (False = greedy decoding) |
| `top_p` | float | `0.8` | Nucleus sampling threshold |
| `top_k` | int | `30` | Top-K sampling limit |
| `temperature` | float | `0.8` | Sampling temperature |
| `num_beams` | int | `3` | Beam search width |
| `repetition_penalty` | float | `10.0` | Token repetition penalty |
| `max_mel_tokens` | int | `1500` | Maximum output mel length |

### Processing Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `max_text_tokens_per_segment` | int | `120` | Max tokens per segment (range: 80-200) |
| `interval_silence` | int | `200` | Silence between segments (milliseconds) |
| `verbose` | bool | `False` | Enable debug output |

### Return Values

**With `output_path` specified:**
```python
file_path = tts.infer(..., output_path="output.wav")
# Returns: str (path to saved file)
```

**Without `output_path`:**
```python
sample_rate, audio_array = tts.infer(..., output_path=None)
# Returns: tuple[int, np.ndarray]
# sample_rate: 22050 Hz
# audio_array: int16 waveform
```

---

## Usage Examples

### Basic Voice Cloning

```python
from indextts.infer_v2 import IndexTTS2

tts = IndexTTS2(
    cfg_path="checkpoints/config.yaml",
    model_dir="checkpoints"
)

tts.infer(
    spk_audio_prompt="speaker.wav",
    text="Hello, this is a voice clone test.",
    output_path="output.wav"
)
```

### With Audio Emotion Reference

```python
tts.infer(
    spk_audio_prompt="speaker.wav",
    text="I can't believe this happened!",
    output_path="emotional.wav",
    emo_audio_prompt="surprised_reference.wav",
    emo_alpha=0.8
)
```

### With Emotion Vector

```python
# Emotion indices: [happy, angry, sad, afraid, disgusted, melancholic, surprised, calm]
happy_vector = [1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]

tts.infer(
    spk_audio_prompt="speaker.wav",
    text="This is wonderful news!",
    output_path="happy.wav",
    emo_vector=happy_vector,
    emo_alpha=0.7
)
```

### With Text-Based Emotion

```python
tts.infer(
    spk_audio_prompt="speaker.wav",
    text="I understand how you feel.",
    output_path="empathetic.wav",
    use_emo_text=True,
    emo_text="calm and understanding",
    emo_alpha=0.6
)
```

### Batch Processing with Caching

```python
tts = IndexTTS2(cfg_path="checkpoints/config.yaml", model_dir="checkpoints")

texts = [
    "First sentence to synthesize.",
    "Second sentence to synthesize.",
    "Third sentence to synthesize."
]

# Speaker audio is cached after first call
for i, text in enumerate(texts):
    tts.infer(
        spk_audio_prompt="speaker.wav",  # Cached
        text=text,
        output_path=f"output_{i}.wav"
    )
```

### FP16 Inference for Lower VRAM

```python
tts = IndexTTS2(
    cfg_path="checkpoints/config.yaml",
    model_dir="checkpoints",
    use_fp16=True  # ~50% VRAM reduction
)

tts.infer(
    spk_audio_prompt="speaker.wav",
    text="Lower memory usage with FP16.",
    output_path="output.wav"
)
```

### Custom Sampling Parameters

```python
tts.infer(
    spk_audio_prompt="speaker.wav",
    text="Custom generation settings.",
    output_path="output.wav",
    do_sample=True,
    top_p=0.9,
    top_k=50,
    temperature=0.7,
    repetition_penalty=8.0
)
```

### Long Text with Custom Segmentation

```python
long_text = """
This is a very long paragraph that will be automatically
segmented by the model. You can control how the text is
split using the max_text_tokens_per_segment parameter.
"""

tts.infer(
    spk_audio_prompt="speaker.wav",
    text=long_text,
    output_path="long_output.wav",
    max_text_tokens_per_segment=100,
    interval_silence=300  # 300ms pause between segments
)
```

---

## Caching System

IndexTTS2 automatically caches intermediate results to speed up repeated calls:

| Cache Variable | Content | Invalidation Trigger |
|----------------|---------|---------------------|
| `cache_spk_audio_prompt` | Speaker audio path | `spk_audio_prompt` changes |
| `cache_spk_cond` | Speaker conditioning | `spk_audio_prompt` changes |
| `cache_s2mel_style` | CAMPPlus style vector (192D) | `spk_audio_prompt` changes |
| `cache_s2mel_prompt` | S2Mel prompt conditioning | `spk_audio_prompt` changes |
| `cache_mel` | Reference mel-spectrogram | `spk_audio_prompt` changes |
| `cache_emo_audio_prompt` | Emotion audio path | `emo_audio_prompt` changes |
| `cache_emo_cond` | Emotion conditioning | `emo_audio_prompt` changes |

**Best Practice**: Reuse a single `IndexTTS2` instance for multiple calls with the same speaker.

---

## Error Handling

### Token Limit Warning
```
Warning: generation stopped due to exceeding `max_mel_tokens` (1500).
```
**Solution**: Reduce `max_text_tokens_per_segment` or increase `max_mel_tokens`.

### Unknown Characters Warning
```
Warning: input text contains N unknown tokens (id=2)
```
**Solution**: Use characters supported by the BPE model (12,000 vocabulary).

### Audio Length Limit
- Speaker audio is automatically truncated to 15 seconds
- Longer audio is silently trimmed

---

## Legacy API: IndexTTS (v1)

For IndexTTS v1.x compatibility:

```python
from indextts.infer import IndexTTS

tts = IndexTTS(
    model_dir="checkpoints",
    cfg_path="checkpoints/config.yaml"
)

tts.infer(
    voice="speaker.wav",
    text="Hello world",
    output_path="output.wav"
)
```

Note: IndexTTS v1 does not support emotion control features.
