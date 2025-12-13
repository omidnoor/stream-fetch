# IndexTTS2 Installation Guide

## Prerequisites

- Python 3.10+
- Git with Git LFS
- CUDA-compatible GPU (recommended) or CPU
- 4GB+ VRAM for GPU inference

## Official Installation (Recommended)

The official method uses the `uv` package manager. This is the only officially supported installation method.

### Step 1: Install Git LFS

```bash
# Ubuntu/Debian
sudo apt install git-lfs

# macOS
brew install git-lfs

# Windows (with Chocolatey)
choco install git-lfs

# Initialize Git LFS
git lfs install
```

### Step 2: Clone the Repository

```bash
git clone https://github.com/index-tts/index-tts.git
cd index-tts
git lfs pull  # Download large files
```

### Step 3: Install uv Package Manager

```bash
# Using pip
pip install -U uv

# Or using curl (Unix)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Or using PowerShell (Windows)
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### Step 4: Install Dependencies

```bash
uv sync --all-extras
```

### Step 5: Download Model Checkpoints

**From HuggingFace:**
```bash
# Using huggingface-cli
huggingface-cli download IndexTeam/IndexTTS-2 --local-dir=checkpoints

# Or using uv
uv run huggingface-cli download IndexTeam/IndexTTS-2 --local-dir=checkpoints
```

**From ModelScope (China):**
```bash
modelscope download IndexTeam/IndexTTS-2 --local_dir=checkpoints
```

### Step 6: Launch Web UI (Optional)

```bash
uv run webui.py
# Access at http://127.0.0.1:7860
```

## Alternative Installation (Conda/Pip)

> **Warning**: This method is NOT officially supported and may cause dependency issues.

```bash
# Create conda environment
conda create -n indextts2 python=3.10
conda activate indextts2

# Install PyTorch with CUDA
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# Clone and install requirements
git clone https://github.com/index-tts/index-tts.git
cd index-tts
pip install -r requirements.txt

# Download models
huggingface-cli download IndexTeam/IndexTTS-2 --local-dir=checkpoints
```

## pip Package Installation

For simple use cases, you can install the pip package:

```bash
pip install indextts
```

Then initialize with:
```python
from indextts.infer import IndexTTS

tts = IndexTTS(
    model_dir="checkpoints",
    cfg_path="checkpoints/config.yaml"
)
```

## Model Directory Structure

After downloading, your `checkpoints` folder should contain:

```
checkpoints/
├── config.yaml           # Model configuration
├── bigvgan_v2_22khz_80band_256x/  # Vocoder
├── bpe.model             # BPE tokenizer
├── campplus_cn_common.bin        # Speaker encoder
├── gpt.pth               # GPT model weights
├── s2mel.pth             # S2Mel model weights
├── semantic_codec.pth    # Semantic codec
└── qwen_emotion/         # Emotion model (optional)
    ├── config.json
    └── model.safetensors
```

## Verifying Installation

```python
from indextts.infer_v2 import IndexTTS2

# Initialize (will load models)
tts = IndexTTS2(
    cfg_path="checkpoints/config.yaml",
    model_dir="checkpoints"
)

# Test inference
tts.infer(
    spk_audio_prompt="examples/voice_01.wav",
    text="Installation successful!",
    output_path="test_output.wav"
)

print("Installation verified successfully!")
```

## Troubleshooting Installation

### Common Issues

**"ModuleNotFoundError: No module named 'xxx'"**
- Use `uv sync --all-extras` to ensure all dependencies are installed
- If using pip, ensure you're in the correct environment

**"CUDA out of memory"**
- Enable FP16 mode: `IndexTTS2(..., use_fp16=True)`
- Use a smaller reference audio (max 15 seconds)
- Close other GPU applications

**"Failed to load model"**
- Verify all checkpoint files are downloaded: `git lfs pull`
- Check file integrity and re-download if needed

**Git LFS Issues**
```bash
# If files show as pointers, run:
git lfs fetch --all
git lfs checkout
```

## System Requirements Summary

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| RAM | 8GB | 16GB+ |
| VRAM | 4GB | 8GB+ |
| Storage | 10GB | 20GB+ |
| Python | 3.10 | 3.10-3.11 |
| CUDA | 11.8 | 12.x |

## Next Steps

- [API Reference](./api-reference.md) - Learn the Python API
- [Emotion Control](./emotion-control.md) - Add emotions to speech
- [Configuration](./configuration.md) - Optimize performance
