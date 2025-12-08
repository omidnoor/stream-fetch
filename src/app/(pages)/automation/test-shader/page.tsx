'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShaderCanvas } from '@/components/automation/shader/ShaderCanvas';
import { ParticleText } from '@/components/automation/shader/ParticleText';
import { ParticleMorphText } from '@/components/automation/shader/ParticleMorphText';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type ShaderType = 'grid' | 'dataStream' | 'energyFlow' | 'scanLine' | 'perlinNoise' | 'particleText' | 'particleMorph';

export default function ShaderTestPage() {
  const [activeShader, setActiveShader] = useState<ShaderType>('particleMorph');
  const [progress, setProgress] = useState(0.5);
  const [activity, setActivity] = useState(1.0);
  const [particleText, setParticleText] = useState('DOWNLOADING...');
  const [inputText, setInputText] = useState('DOWNLOADING...');

  const shaderOptions: { id: ShaderType; name: string; description: string }[] = [
    { id: 'particleMorph', name: '🌟 Entropy Morph', description: 'Chaos to order - particles morph into text' },
    { id: 'particleText', name: '⭐ Particle Text', description: 'Colorful particles forming kinetic typography' },
    { id: 'grid', name: 'Holographic Grid', description: 'Animated perspective grid with glow' },
    { id: 'dataStream', name: 'Data Stream', description: 'Matrix-style vertical data flow' },
    { id: 'energyFlow', name: 'Energy Flow', description: 'Flowing particle progress bar' },
    { id: 'scanLine', name: 'Scan Line', description: 'CRT monitor scan effect' },
    { id: 'perlinNoise', name: 'Perlin Noise', description: 'Animated depth background' },
  ];

  const statusMessages = [
    'DOWNLOADING...',
    'CHUNKING: 8/12',
    'DUBBING CHUNK 3',
    'MERGING FILES',
    'FINALIZING',
    'COMPLETE!',
  ];

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <Link href="/automation">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">WebGL Shader Test</h1>
        </div>
        <p className="text-muted-foreground">
          Test and preview GLSL shader effects for the progress monitor
        </p>
      </div>

      {/* Shader Selector */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <h2 className="text-xl font-semibold">Select Shader Effect</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {shaderOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setActiveShader(option.id)}
              className={`
                rounded-lg border p-4 text-left transition-all
                ${
                  activeShader === option.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-surface-2 hover:border-muted-foreground'
                }
              `}
            >
              <h3 className="font-semibold mb-1">{option.name}</h3>
              <p className="text-xs text-muted-foreground">{option.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <h2 className="text-xl font-semibold">Shader Controls</h2>

        {activeShader === 'particleText' || activeShader === 'particleMorph' ? (
          <>
            {/* Particle Text Controls */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Text Content</label>
              <div className="flex gap-2">
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value.toUpperCase())}
                  placeholder="Enter text..."
                  className="flex-1"
                  maxLength={20}
                />
                <Button onClick={() => setParticleText(inputText)}>
                  Update
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {activeShader === 'particleMorph'
                  ? 'Watch chaos transform into order - entropy decreases as particles settle'
                  : 'Type text and click Update to see particles rearrange'}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Quick Status Messages</label>
              <div className="grid grid-cols-2 gap-2">
                {statusMessages.map((msg) => (
                  <Button
                    key={msg}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setInputText(msg);
                      setParticleText(msg);
                    }}
                    className="text-xs"
                  >
                    {msg}
                  </Button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Standard Shader Controls */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Progress</label>
                <span className="text-sm font-semibold text-primary">{Math.round(progress * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={progress}
                onChange={(e) => setProgress(parseFloat(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Activity Level</label>
                <span className="text-sm font-semibold text-primary">{activity.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={2}
                step={0.1}
                value={activity}
                onChange={(e) => setActivity(parseFloat(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          </>
        )}
      </div>

      {/* Shader Preview */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Shader Preview</h2>
          <div className="text-xs text-muted-foreground font-mono">
            {activeShader === 'particleText' ? 'particleText.glsl' : `${activeShader}.frag`}
          </div>
        </div>

        {/* Canvas Container */}
        {activeShader === 'particleMorph' ? (
          <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-surface-1">
            <ParticleMorphText
              text={particleText}
              particleCount={65536}
              pointSize={1.8}
              settleTime={3}
              background={[0.02, 0.02, 0.035, 1.0]}
            />
          </div>
        ) : activeShader === 'particleText' ? (
          <div className="relative w-full rounded-lg overflow-hidden bg-surface-1 p-8">
            <ParticleText
              text={particleText}
              particleDensity={2}
              transitionDuration={2000}
            />
          </div>
        ) : (
          <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-surface-1">
            <ShaderCanvas
              shaderType={activeShader as any}
              progress={progress}
              activity={activity}
            />
          </div>
        )}
      </div>

      {/* Performance Info */}
      <div className="rounded-lg border border-info/50 bg-info/10 p-4">
        <h3 className="text-sm font-semibold text-info mb-2">Performance Notes</h3>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>• Canvas is created once and reused</li>
          <li>• requestAnimationFrame is properly cleaned up on unmount</li>
          <li>• WebGL context is disposed when component unmounts</li>
          <li>• Shaders are compiled once and cached</li>
          {activeShader === 'particleMorph' && (
            <>
              <li className="text-primary">• 65,536 particles with curl noise flow fields</li>
              <li className="text-primary">• Entropy cooling: chaos → order over 3 seconds</li>
              <li className="text-primary">• GPGPU simulation using WebGL2 float textures</li>
              <li className="text-primary">• When text changes, entropy resets and particles morph</li>
            </>
          )}
          {activeShader === 'particleText' && (
            <>
              <li className="text-primary">• Particle positions calculated from text pixels</li>
              <li className="text-primary">• Smooth transition animation with bounce effect</li>
              <li className="text-primary">• Rainbow colors based on particle position</li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
}
