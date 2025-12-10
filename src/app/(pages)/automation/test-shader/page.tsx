'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShaderCanvas } from '@/components/automation/shader/ShaderCanvas';
import { ParticleText } from '@/components/automation/shader/ParticleText';
import { ParticleMorphText } from '@/components/automation/shader/ParticleMorphText';
import { Particle3DIcon } from '@/components/automation/shader/Particle3DIcon';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type ShaderType = 'grid' | 'dataStream' | 'energyFlow' | 'scanLine' | 'perlinNoise' | 'particleText' | 'particleMorph' | 'particle3DIcon';

export default function ShaderTestPage() {
  const [activeShader, setActiveShader] = useState<ShaderType>('particleMorph');
  const [progress, setProgress] = useState(0.5);
  const [activity, setActivity] = useState(1.0);
  const [particleText, setParticleText] = useState('DOWNLOADING...');
  const [inputText, setInputText] = useState('DOWNLOADING...');
  const [fontFamily, setFontFamily] = useState('-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif');
  const [selectedIcon, setSelectedIcon] = useState('⚡');
  const [iconDepth, setIconDepth] = useState(0.4);
  const [parallaxIntensity, setParallaxIntensity] = useState(0.3);
  const [enableParallax, setEnableParallax] = useState(true);

  const shaderOptions: { id: ShaderType; name: string; description: string }[] = [
    { id: 'particleMorph', name: '🌟 Entropy Morph', description: 'Test mode - auto-cycles status messages (production uses API text)' },
    { id: 'particle3DIcon', name: '🎲 3D Icon', description: 'Mouse-responsive 3D particle icons with parallax' },
    { id: 'particleText', name: '⭐ Particle Text', description: 'Colorful particles forming kinetic typography' },
    { id: 'grid', name: 'Holographic Grid', description: 'Animated perspective grid with glow' },
    { id: 'dataStream', name: 'Data Stream', description: 'Matrix-style vertical data flow' },
    { id: 'energyFlow', name: 'Energy Flow', description: 'Flowing particle progress bar' },
    { id: 'scanLine', name: 'Scan Line', description: 'CRT monitor scan effect' },
    { id: 'perlinNoise', name: 'Perlin Noise', description: 'Animated depth background' },
  ];

  const testIconsCycle = ['⚡', '🔥', '💎', '🚀', '⭐', '🎯', '💜', '🌟'];

  const iconOptions = [
    { emoji: '⚡', label: 'Lightning' },
    { emoji: '🔥', label: 'Fire' },
    { emoji: '💎', label: 'Diamond' },
    { emoji: '🚀', label: 'Rocket' },
    { emoji: '⭐', label: 'Star' },
    { emoji: '🎯', label: 'Target' },
    { emoji: '💜', label: 'Heart' },
    { emoji: '🌟', label: 'Sparkle' },
    { emoji: '🎮', label: 'Gaming' },
    { emoji: '🎵', label: 'Music' },
    { emoji: '📦', label: 'Package' },
    { emoji: '⚙️', label: 'Settings' },
  ];

  const statusMessages = [
    'DOWNLOADING...',
    'CHUNKING: 8/12',
    'DUBBING CHUNK 3',
    'MERGING FILES',
    'FINALIZING',
    'COMPLETE!',
  ];

  // Test mode: cycle through status messages for better visualization
  const testStatusCycle = [
    'INITIALIZING...',
    'DOWNLOADING',
    'PROCESSING',
    'CHUNKING',
    'DUBBING',
    'MERGING',
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

        {activeShader === 'particle3DIcon' ? (
          <>
            {/* 3D Icon Controls */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Select Icon</label>
              <div className="grid grid-cols-6 gap-2">
                {iconOptions.map((opt) => (
                  <button
                    key={opt.emoji}
                    onClick={() => setSelectedIcon(opt.emoji)}
                    className={`
                      p-3 text-2xl rounded-lg border transition-all
                      ${selectedIcon === opt.emoji
                        ? 'border-primary bg-primary/20 scale-110'
                        : 'border-border bg-surface-2 hover:border-muted-foreground'
                      }
                    `}
                    title={opt.label}
                  >
                    {opt.emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">3D Depth</label>
                <span className="text-sm font-semibold text-primary">{iconDepth.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={iconDepth}
                onChange={(e) => setIconDepth(parseFloat(e.target.value))}
                className="w-full accent-primary"
              />
              <p className="text-xs text-muted-foreground">
                0 = flat, 1 = maximum depth extrusion
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Parallax Intensity</label>
                <span className="text-sm font-semibold text-primary">{parallaxIntensity.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={parallaxIntensity}
                onChange={(e) => setParallaxIntensity(parseFloat(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="enableParallax"
                checked={enableParallax}
                onChange={(e) => setEnableParallax(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              <label htmlFor="enableParallax" className="text-sm font-medium">
                Enable Mouse Parallax
              </label>
            </div>

            <p className="text-xs text-muted-foreground">
              Move your mouse over the icon to see the 3D parallax effect
            </p>
          </>
        ) : activeShader === 'particleText' || activeShader === 'particleMorph' ? (
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
                  ? 'Test mode: auto-cycles for visualization. In production, text comes from API.'
                  : 'Type text and click Update to see particles rearrange'}
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Font Family</label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value='-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'>System Default</option>
                <option value='Arial, sans-serif'>Arial</option>
                <option value='Impact, fantasy'>Impact</option>
                <option value='"Courier New", monospace'>Courier New</option>
                <option value='Georgia, serif'>Georgia</option>
                <option value='"Times New Roman", serif'>Times New Roman</option>
                <option value='monospace'>Monospace</option>
                <option value='"Comic Sans MS", cursive'>Comic Sans MS</option>
                <option value='Verdana, sans-serif'>Verdana</option>
                <option value='Tahoma, sans-serif'>Tahoma</option>
              </select>
              <p className="text-xs text-muted-foreground">
                Change the font family of the particle text
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
        {activeShader === 'particle3DIcon' ? (
          <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-surface-1">
            <Particle3DIcon
              icon={selectedIcon}
              testIcons={testIconsCycle}
              testDuration={3}
              particleCount={65536}
              pointSize={2.0}
              scale={1.5}
              depth={iconDepth}
              enableParallax={enableParallax}
              parallaxIntensity={parallaxIntensity}
              settleTime={2.5}
              background={[0.02, 0.02, 0.035, 1.0]}
            />
          </div>
        ) : activeShader === 'particleMorph' ? (
          <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-surface-1">
            <ParticleMorphText
              text={particleText}
              testTexts={testStatusCycle}
              testDuration={4}
              particleCount={65536}
              pointSize={1.8}
              scale={2.0}
              fontFamily={fontFamily}
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
          {activeShader === 'particle3DIcon' && (
            <>
              <li className="text-primary">• 65,536 particles with 3D curl noise flow fields</li>
              <li className="text-primary">• Mouse-responsive parallax creates 3D illusion</li>
              <li className="text-primary">• Perspective projection with depth-based point sizing</li>
              <li className="text-primary">• Real-time lighting with diffuse, specular, and rim light</li>
              <li className="text-primary">• Depth extrusion based on brightness and distance from center</li>
              <li className="text-primary">• Auto-cycles through icons every 3s in test mode</li>
            </>
          )}
          {activeShader === 'particleMorph' && (
            <>
              <li className="text-primary">• 65,536 particles with curl noise flow fields</li>
              <li className="text-primary">• Entropy cooling: chaos → order over 3 seconds</li>
              <li className="text-primary">• GPGPU simulation using WebGL2 float textures</li>
              <li className="text-primary">• Test mode: auto-cycles every 4s (production uses API text)</li>
              <li className="text-primary">• Particles spread across 90% of window at highest entropy</li>
              <li className="text-primary">• Text scale: 2.0 (200% of window width - full screen), adjustable via scale prop</li>
              <li className="text-primary">• Square text canvas eliminates aspect ratio distortion</li>
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
