'use client';

import { useParticleText } from '@/hooks/useParticleText';
import { AlertCircle } from 'lucide-react';

interface ParticleTextProps {
  text: string;
  className?: string;
  particleDensity?: number; // Lower = more particles (2-4 recommended)
  transitionDuration?: number; // milliseconds
}

export function ParticleText({
  text,
  className = '',
  particleDensity = 2,
  transitionDuration = 2000,
}: ParticleTextProps) {
  // Use a fixed size for the particle canvas
  const width = 800;
  const height = 200;

  const { canvasRef, isReady, error } = useParticleText({
    text,
    width,
    height,
    particleDensity,
    transitionDuration,
  });

  return (
    <div className={`relative w-full ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-auto"
        style={{
          maxWidth: '100%',
          height: 'auto',
          aspectRatio: `${width} / ${height}`,
        }}
      />

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-destructive/10">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        </div>
      )}

      {!isReady && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-sm text-muted-foreground">Loading particles...</div>
        </div>
      )}
    </div>
  );
}
