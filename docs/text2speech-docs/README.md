# IndexTTS2 Documentation

IndexTTS2 is an industrial-level, controllable, and efficient zero-shot text-to-speech system developed by Bilibili. It represents a significant advancement in controllable speech synthesis with emotional expressiveness and precise duration control.

## Overview

IndexTTS2 is the first autoregressive zero-shot TTS model to combine precise duration control with natural duration generation. The method is scalable for any autoregressive large-scale TTS model.

**Official Release**: September 8, 2025

## Key Features

- **Zero-Shot Voice Cloning**: Clone any voice from a single reference audio (10-15 seconds)
- **Emotional Speech Synthesis**: Disentangled speaker-emotion control for independent manipulation
- **Multi-Modal Emotion Input**: Audio prompts, emotion vectors, or text descriptions
- **Duration Control**: Precise speech timing control (currently in development)
- **Multilingual Support**: Chinese, English, and Japanese (55,000 hours training data)

## Quick Start

```python
from indextts.infer_v2 import IndexTTS2

# Initialize
tts = IndexTTS2(
    cfg_path="checkpoints/config.yaml",
    model_dir="checkpoints"
)

# Basic voice cloning
tts.infer(
    spk_audio_prompt="reference_voice.wav",
    text="Hello, this is IndexTTS2 speaking!",
    output_path="output.wav"
)
```

## Documentation Structure

| Document | Description |
|----------|-------------|
| [Installation](./installation.md) | Setup and installation guide |
| [API Reference](./api-reference.md) | Complete Python API documentation |
| [Emotion Control](./emotion-control.md) | Emotion control system guide |
| [Configuration](./configuration.md) | Configuration and optimization |
| [Integrations](./integrations.md) | ComfyUI and cloud API integrations |
| [Troubleshooting](./troubleshooting.md) | Common issues and solutions |

## Resources

- **GitHub Repository**: https://github.com/index-tts/index-tts
- **Demo Page**: https://index-tts.github.io/index-tts2.github.io/
- **ArXiv Paper**: https://arxiv.org/abs/2506.21619
- **HuggingFace Model**: https://huggingface.co/IndexTeam/IndexTTS-2
- **Discord**: https://discord.gg/uT32E7KDmy
- **Contact**: indexspeech@bilibili.com

## Technical Innovations

1. **Duration Control Method**: Novel autoregressive-model-friendly approach for speech duration control
2. **Emotional-Timbre Disentanglement**: Independent control over speaker identity and emotional expression
3. **Stability Enhancements**: GPT latent representations and three-stage training for speech clarity
4. **Soft Instruction Mechanism**: Fine-tuned Qwen3 for text-based emotion guidance

## Model Versions

| Version | Description | License |
|---------|-------------|---------|
| IndexTTS-2 | Latest with emotion control | See repository |
| IndexTTS-1.5 | Improved English support | Apache 2.0 |
| IndexTTS-1.0 | Original release | Apache 2.0 |

## Hardware Requirements

- **Recommended**: CUDA-compatible GPU with 4GB+ VRAM
- **Supported**: Linux, Windows, macOS
- **CPU**: Supported but slower inference

## License

Previous versions (IndexTTS1 and IndexTTS1.5) were released under Apache 2.0 (fully open, commercial-allowed, modifications-allowed). Check the official repository for IndexTTS2 licensing details.
