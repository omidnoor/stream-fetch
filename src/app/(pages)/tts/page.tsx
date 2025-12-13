"use client";

import { AudioWaveform, Mic2, Sparkles, Zap } from "lucide-react";
import { TTSGenerator } from "@/components/tts/tts-generator";

export default function TTSPage() {
  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">AI Text-to-Speech</h1>
        <p className="text-muted-foreground">
          Clone any voice and generate natural speech with emotional control using IndexTTS2
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-feature-1/10">
              <Mic2 className="h-5 w-5 text-feature-1" />
            </div>
            <h3 className="font-semibold">Voice Cloning</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Clone any voice from just 10-15 seconds of reference audio with high fidelity
          </p>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-feature-2/10">
              <Sparkles className="h-5 w-5 text-feature-2" />
            </div>
            <h3 className="font-semibold">8D Emotion Control</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Fine-tune 8 emotion dimensions: happy, angry, sad, afraid, and more
          </p>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-feature-3/10">
              <Zap className="h-5 w-5 text-feature-3" />
            </div>
            <h3 className="font-semibold">Fast Generation</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Generate high-quality speech in seconds with state-of-the-art AI
          </p>
        </div>
      </div>

      {/* Main Generator */}
      <TTSGenerator />

      {/* Info Box */}
      <div className="rounded-lg border border-info/50 bg-info/10 p-6">
        <h3 className="text-sm font-semibold text-info mb-2">About IndexTTS2</h3>
        <p className="text-sm text-muted-foreground">
          IndexTTS2 is a breakthrough in emotionally expressive text-to-speech. It's the first
          autoregressive zero-shot TTS model to combine precise duration control with natural
          generation. Developed by Bilibili and powered by fal.ai for cloud inference.
        </p>
      </div>

      {/* How It Works */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">How It Works</h3>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              1
            </div>
            <div>
              <h4 className="font-semibold mb-1">Upload Voice Reference</h4>
              <p className="text-sm text-muted-foreground">
                Provide 10-15 seconds of clear speech to clone the voice characteristics.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              2
            </div>
            <div>
              <h4 className="font-semibold mb-1">Enter Your Text</h4>
              <p className="text-sm text-muted-foreground">
                Type or paste the text you want to convert to speech (up to 5,000 characters).
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              3
            </div>
            <div>
              <h4 className="font-semibold mb-1">Choose Emotion</h4>
              <p className="text-sm text-muted-foreground">
                Select a preset or fine-tune the 8-dimensional emotion vector for expressive speech.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              4
            </div>
            <div>
              <h4 className="font-semibold mb-1">Generate & Download</h4>
              <p className="text-sm text-muted-foreground">
                Click generate and download your AI-synthesized speech in WAV format.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
