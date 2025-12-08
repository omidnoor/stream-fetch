'use client';

import { useWebGLShader } from '@/hooks/useWebGLShader';
import { SHADERS, ShaderType } from './shaders';
import { AlertCircle } from 'lucide-react';

interface ShaderCanvasProps {
  shaderType: ShaderType;
  progress?: number;
  activity?: number;
  className?: string;
  pixelRatio?: number; // Lower = better performance, default 1
}

export function ShaderCanvas({
  shaderType,
  progress = 0.5,
  activity = 1.0,
  className = '',
  pixelRatio = 1,
}: ShaderCanvasProps) {
  const { canvasRef, isReady, error } = useWebGLShader({
    fragmentShader: SHADERS[shaderType],
    uniforms: { progress, activity },
    pixelRatio,
  });

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Canvas - positioned absolutely to fill container */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ imageRendering: 'crisp-edges' }}
      />

      {/* Error Display */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-destructive/10 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Loading State */}
      {!isReady && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-1">
          <div className="text-sm text-muted-foreground">Loading shader...</div>
        </div>
      )}
    </div>
  );
}
