# IndexTTS2 Troubleshooting Guide

## Installation Issues

### "ModuleNotFoundError: No module named 'xxx'"

**Cause:** Dependencies not properly installed.

**Solution:**
```bash
# Using uv (recommended)
uv sync --all-extras

# Or reinstall all dependencies
pip install -r requirements.txt --force-reinstall
```

### Git LFS Files Not Downloaded

**Symptoms:** Model files are small text pointers instead of actual weights.

**Solution:**
```bash
# Install Git LFS
git lfs install

# Fetch and checkout LFS files
git lfs fetch --all
git lfs checkout

# Or re-clone with LFS
git clone https://github.com/index-tts/index-tts.git
cd index-tts
git lfs pull
```

### "Failed to load model" / "FileNotFoundError"

**Cause:** Checkpoint files missing or incomplete.

**Solution:**
1. Verify all files exist:
   ```
   checkpoints/
   ├── config.yaml
   ├── bigvgan_v2_22khz_80band_256x/
   ├── bpe.model
   ├── campplus_cn_common.bin
   ├── gpt.pth
   ├── s2mel.pth
   └── semantic_codec.pth
   ```

2. Re-download if needed:
   ```bash
   huggingface-cli download IndexTeam/IndexTTS-2 --local-dir=checkpoints
   ```

---

## Memory Errors

### "CUDA out of memory"

**Solutions:**

1. **Enable FP16 inference:**
   ```python
   tts = IndexTTS2(..., use_fp16=True)
   ```

2. **Use shorter reference audio** (max 15 seconds recommended)

3. **Reduce output length:**
   ```python
   tts.infer(..., max_mel_tokens=1000)
   ```

4. **Process shorter segments:**
   ```python
   tts.infer(..., max_text_tokens_per_segment=80)
   ```

5. **Close other GPU applications**

6. **Use CPU inference:**
   ```python
   tts = IndexTTS2(..., device="cpu")
   ```

### Memory Keeps Growing

**Cause:** Not reusing IndexTTS2 instance.

**Solution:**
```python
# Wrong: Creating new instance each time
for text in texts:
    tts = IndexTTS2(...)  # Memory leak!
    tts.infer(...)

# Correct: Reuse single instance
tts = IndexTTS2(...)
for text in texts:
    tts.infer(...)  # Uses caching
```

---

## Audio Quality Issues

### Generated Voice Doesn't Match Reference

**Causes & Solutions:**

1. **Reference audio too short**: Use 10-15 seconds of audio
2. **Noisy reference**: Clean background noise from reference
3. **Emotion too strong**: Reduce `emo_alpha`:
   ```python
   tts.infer(..., emo_alpha=0.5)  # Preserve more speaker identity
   ```

### Robotic or Unnatural Speech

**Solutions:**

1. **Adjust sampling parameters:**
   ```python
   tts.infer(
       ...,
       temperature=0.8,
       top_p=0.85,
       do_sample=True
   )
   ```

2. **Use emotion that matches text content**

3. **Try audio-based emotion instead of vectors**

### Audio Artifacts (Clicks, Pops, Distortion)

**Solutions:**

1. **Reduce emotion intensity:**
   ```python
   # Lower values in emotion vector
   emo_vector = [0.5, 0, 0, 0, 0, 0, 0, 0]  # Instead of [1.0, ...]
   ```

2. **Avoid high values on "surprised" dimension**

3. **Use cleaner reference audio**

4. **Increase segment boundaries:**
   ```python
   tts.infer(..., interval_silence=300)  # 300ms between segments
   ```

### Words Cut Off or Truncated

**Cause:** Output exceeds `max_mel_tokens`.

**Solution:**
```python
# Increase max tokens
tts.infer(..., max_mel_tokens=2000)

# Or reduce segment size
tts.infer(..., max_text_tokens_per_segment=80)
```

---

## Text Processing Issues

### "Warning: input text contains N unknown tokens"

**Cause:** Characters not in the BPE vocabulary (12,000 tokens).

**Solutions:**

1. **Remove unsupported characters:**
   ```python
   import re
   text = re.sub(r'[^\w\s.,!?;:\'"()-]', '', text)
   ```

2. **Replace special characters:**
   ```python
   text = text.replace('—', '-')
   text = text.replace('"', '"').replace('"', '"')
   ```

### Incorrect Pronunciation

**For Chinese text:**
Use pinyin annotations for ambiguous characters:
```python
# Pinyin format in text
text = "行(xing2)走"  # Specify pronunciation
```

**For English text:**
- Spell out acronyms: "NASA" → "nassa" or "N.A.S.A."
- Use phonetic spelling for unusual words

---

## Performance Issues

### Slow Inference

**Solutions:**

1. **Enable optimizations:**
   ```python
   tts = IndexTTS2(
       ...,
       use_fp16=True,
       use_cuda_kernel=True,
       use_deepspeed=True
   )
   ```

2. **Use GPU instead of CPU**

3. **Batch with same speaker (uses caching)**

### First Inference Very Slow

**Cause:** Model loading and optional compilation.

**Solution:** This is normal. Subsequent inferences will be faster due to caching.

If using `torch_compile`:
```python
# First call is slow (compilation)
tts.infer(...)  # ~30-60 seconds

# Subsequent calls are fast
tts.infer(...)  # ~2-5 seconds
```

---

## Environment Issues

### CUDA Not Detected

**Check CUDA availability:**
```python
import torch
print(f"CUDA available: {torch.cuda.is_available()}")
print(f"CUDA version: {torch.version.cuda}")
print(f"Device count: {torch.cuda.device_count()}")
```

**Solutions:**

1. **Install CUDA-enabled PyTorch:**
   ```bash
   pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
   ```

2. **Verify NVIDIA drivers are installed**

3. **Check CUDA_HOME environment variable**

### Conflicting Dependencies

**Cause:** Using pip/conda instead of uv.

**Solution:**
```bash
# Create fresh environment
uv venv
uv sync --all-extras
```

---

## Web UI Issues

### Web UI Won't Start

**Solutions:**

1. **Check port availability:**
   ```bash
   # Default port 7860
   lsof -i :7860  # macOS/Linux
   netstat -ano | findstr :7860  # Windows
   ```

2. **Use different port:**
   ```bash
   uv run webui.py --port 8080
   ```

3. **Check Gradio installation:**
   ```bash
   pip install gradio --upgrade
   ```

### Web UI Crashes During Inference

**Cause:** Usually memory-related.

**Solutions:**
1. Enable FP16 in web UI settings
2. Use shorter reference audio
3. Process shorter text segments

---

## Common Error Messages

### "generation stopped due to exceeding max_mel_tokens"

```python
# Increase limit
tts.infer(..., max_mel_tokens=2000)

# Or process shorter segments
tts.infer(..., max_text_tokens_per_segment=80)
```

### "Invalid audio file" / "Audio load failed"

**Causes:**
- Corrupted audio file
- Unsupported format
- File doesn't exist

**Solution:**
```python
import soundfile as sf

# Verify audio file
try:
    data, sr = sf.read("reference.wav")
    print(f"Duration: {len(data)/sr:.2f}s, Sample rate: {sr}")
except Exception as e:
    print(f"Audio error: {e}")
```

### "RuntimeError: Expected all tensors to be on the same device"

**Cause:** Mixed CPU/GPU tensors.

**Solution:**
```python
# Explicitly set device
tts = IndexTTS2(..., device="cuda:0")
```

---

## Getting Help

### Official Channels

- **GitHub Issues:** https://github.com/index-tts/index-tts/issues
- **Discord:** https://discord.gg/uT32E7KDmy
- **Email:** indexspeech@bilibili.com

### Before Reporting Issues

1. Include Python and PyTorch versions
2. Include CUDA version (if applicable)
3. Include the full error traceback
4. Describe steps to reproduce
5. Note any customizations to default settings
