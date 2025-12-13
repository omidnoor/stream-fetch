# IndexTTS2 Configuration & Optimization

## Configuration File

The main configuration is stored in `checkpoints/config.yaml`.

### Core Settings

```yaml
dataset:
  sample_rate: 24000          # Output audio sample rate
  n_mels: 100                 # Mel spectrogram bins

gpt:
  model_dim: 1280             # GPT hidden dimension
  layers: 24                  # Transformer depth
  heads: 20                   # Attention heads
  max_mel_tokens: 1500        # Maximum output length
  max_text_tokens: 600        # Maximum input tokens
  number_mel_codes: 8194      # Mel codebook size

semantic_codec:
  codebook_size: 8192         # Semantic codebook
  hidden_size: 1024           # Hidden dimension

s2mel:
  hidden_dim: 512             # S2Mel hidden dimension
  num_heads: 8                # Attention heads
  depth: 13                   # Model depth

vocoder:
  type: "bigvgan"
  model_name: "nvidia/bigvgan_v2_22khz_80band_256x"
```

---

## Performance Optimization

### FP16 Inference

Reduces VRAM usage by approximately 50% with minimal quality loss.

```python
tts = IndexTTS2(
    cfg_path="checkpoints/config.yaml",
    model_dir="checkpoints",
    use_fp16=True
)
```

**Notes:**
- Automatically disabled on CPU/MPS devices
- Recommended for most GPU inference

### CUDA Kernels

Accelerates the BigVGAN vocoder on CUDA devices.

```python
tts = IndexTTS2(
    cfg_path="checkpoints/config.yaml",
    model_dir="checkpoints",
    use_cuda_kernel=True
)
```

**Notes:**
- Requires CUDA-capable GPU
- Auto-enabled when device is CUDA and parameter is None

### DeepSpeed Acceleration

Accelerates GPT inference (hardware-dependent).

```python
tts = IndexTTS2(
    cfg_path="checkpoints/config.yaml",
    model_dir="checkpoints",
    use_deepspeed=True
)
```

**Notes:**
- Requires DeepSpeed installation: `pip install deepspeed`
- Benefits vary by hardware configuration

### CUDA Graph Acceleration

Enables CUDA graph optimization for GPT2.

```python
tts = IndexTTS2(
    cfg_path="checkpoints/config.yaml",
    model_dir="checkpoints",
    use_accel=True
)
```

### Torch Compile

JIT compiles the S2Mel component for improved speed.

```python
tts = IndexTTS2(
    cfg_path="checkpoints/config.yaml",
    model_dir="checkpoints",
    use_torch_compile=True
)
```

**Notes:**
- Requires PyTorch 2.0+
- First inference is slower (compilation), subsequent calls are faster

### Combined Optimizations

```python
# Maximum performance configuration
tts = IndexTTS2(
    cfg_path="checkpoints/config.yaml",
    model_dir="checkpoints",
    use_fp16=True,
    use_cuda_kernel=True,
    use_deepspeed=True,
    use_torch_compile=True
)
```

---

## Memory Optimization

### VRAM Usage by Configuration

| Configuration | Approximate VRAM |
|---------------|------------------|
| Default (FP32) | 8GB |
| FP16 enabled | 4GB |
| FP16 + DeepSpeed | 3.5GB |

### Reducing Memory Usage

1. **Enable FP16**:
   ```python
   tts = IndexTTS2(..., use_fp16=True)
   ```

2. **Limit output length**:
   ```python
   tts.infer(..., max_mel_tokens=1000)
   ```

3. **Process shorter segments**:
   ```python
   tts.infer(..., max_text_tokens_per_segment=80)
   ```

4. **Use shorter reference audio** (max 15 seconds auto-truncated)

---

## Text Processing Configuration

### Segmentation Settings

Control how long texts are split:

```python
tts.infer(
    spk_audio_prompt="speaker.wav",
    text=long_text,
    output_path="output.wav",
    max_text_tokens_per_segment=120,  # Range: 80-200
    interval_silence=200              # Milliseconds between segments
)
```

**Hierarchical Splitting Strategy:**
1. Punctuation (., !, ?, ;, :) - preserves sentence boundaries
2. Commas (,、) - splits clauses
3. Hyphens (-, —) - splits compounds
4. Force split - at exactly max_tokens

### Recommended Segment Sizes

| Use Case | max_text_tokens_per_segment |
|----------|----------------------------|
| Short phrases | 80 |
| Standard | 120 (default) |
| Long sentences | 150 |
| Maximum | 200 |

---

## Generation Parameters

### Sampling Configuration

```python
tts.infer(
    spk_audio_prompt="speaker.wav",
    text="Hello world",
    output_path="output.wav",
    do_sample=True,           # Enable sampling
    top_p=0.8,                # Nucleus sampling
    top_k=30,                 # Top-K sampling
    temperature=0.8,          # Randomness
    num_beams=3,              # Beam search
    repetition_penalty=10.0   # Prevent repetition
)
```

### Parameter Effects

| Parameter | Low Value | High Value |
|-----------|-----------|------------|
| `temperature` | More deterministic | More varied |
| `top_p` | More focused | More diverse |
| `top_k` | Fewer options | More options |
| `repetition_penalty` | May repeat | Avoids repetition |

### Presets

**Conservative (Consistent output):**
```python
do_sample=False  # Greedy decoding
```

**Balanced (Default):**
```python
do_sample=True
top_p=0.8
top_k=30
temperature=0.8
```

**Creative (More variation):**
```python
do_sample=True
top_p=0.95
top_k=50
temperature=1.0
```

---

## Caching Behavior

IndexTTS2 automatically caches intermediate results:

| Cache | Stored Data | Invalidation |
|-------|-------------|--------------|
| Speaker | Conditioning embeddings | spk_audio_prompt changes |
| Style | CAMPPlus 192D vector | spk_audio_prompt changes |
| Mel | Reference spectrogram | spk_audio_prompt changes |
| Emotion | Emotion conditioning | emo_audio_prompt changes |

### Cache Management

```python
# Caching works automatically
tts = IndexTTS2(...)

# First call: loads and caches speaker
tts.infer(spk_audio_prompt="speaker.wav", text="First", output_path="1.wav")

# Second call: uses cached speaker (faster)
tts.infer(spk_audio_prompt="speaker.wav", text="Second", output_path="2.wav")

# New speaker: cache invalidated and rebuilt
tts.infer(spk_audio_prompt="new_speaker.wav", text="Third", output_path="3.wav")
```

---

## Device Configuration

### Automatic Device Selection

```python
tts = IndexTTS2(..., device=None)  # Auto-selects best device
```

Selection priority:
1. CUDA (if available)
2. MPS (Apple Silicon)
3. CPU

### Manual Device Selection

```python
# Specific GPU
tts = IndexTTS2(..., device="cuda:0")

# CPU only
tts = IndexTTS2(..., device="cpu")

# Apple Silicon
tts = IndexTTS2(..., device="mps")
```

### Multi-GPU

```python
# Use second GPU
tts = IndexTTS2(..., device="cuda:1")
```

---

## Web UI Configuration

Launch with custom settings:

```bash
# Default
uv run webui.py

# Custom port
uv run webui.py --port 8080

# Share publicly
uv run webui.py --share
```

Access at: `http://127.0.0.1:7860` (default)
