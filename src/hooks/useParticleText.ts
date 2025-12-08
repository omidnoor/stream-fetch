import { useEffect, useRef, useState } from 'react';
import { PARTICLE_VERTEX_SHADER, PARTICLE_FRAGMENT_SHADER } from '@/components/automation/shader/particleShader';
import { textToParticles, ParticleData } from '@/components/automation/shader/particleText';

interface UseParticleTextOptions {
  text: string;
  width: number;
  height: number;
  particleDensity?: number;
  transitionDuration?: number; // milliseconds
}

export function useParticleText(options: UseParticleTextOptions) {
  const { text, width, height, particleDensity = 2, transitionDuration = 2000 } = options;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const transitionStartRef = useRef<number>(Date.now());

  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [particleData, setParticleData] = useState<ParticleData | null>(null);

  // Convert text to particles when text changes
  useEffect(() => {
    if (width && height && text) {
      const data = textToParticles(text, width, height, particleDensity);
      setParticleData(data);
      transitionStartRef.current = Date.now();
    }
  }, [text, width, height, particleDensity]);

  // Initialize WebGL
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const gl = canvas.getContext('webgl', {
        alpha: true,
        antialias: true,
        premultipliedAlpha: true,
      });

      if (!gl) {
        throw new Error('WebGL not supported');
      }

      glRef.current = gl;

      // Enable blending for transparency
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      // Compile shaders
      const vertexShader = compileShader(gl, gl.VERTEX_SHADER, PARTICLE_VERTEX_SHADER);
      const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, PARTICLE_FRAGMENT_SHADER);

      if (!vertexShader || !fragmentShader) {
        throw new Error('Shader compilation failed');
      }

      // Create program
      const program = gl.createProgram();
      if (!program) {
        throw new Error('Failed to create WebGL program');
      }

      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const info = gl.getProgramInfoLog(program);
        throw new Error(`Program linking failed: ${info}`);
      }

      programRef.current = program;
      gl.useProgram(program);

      setIsReady(true);
      setError(null);
    } catch (err) {
      console.error('WebGL initialization error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsReady(false);
    }
  }, []);

  // Render loop
  useEffect(() => {
    if (!isReady || !glRef.current || !programRef.current || !canvasRef.current || !particleData) {
      return;
    }

    const gl = glRef.current;
    const canvas = canvasRef.current;
    const program = programRef.current;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, width, height);

    // Create buffers
    const targetBuffer = gl.createBuffer();
    const colorBuffer = gl.createBuffer();
    const randomBuffer = gl.createBuffer();

    // Generate random seeds for each particle
    const randomSeeds = new Float32Array(particleData.count * 2);
    for (let i = 0; i < particleData.count * 2; i++) {
      randomSeeds[i] = Math.random();
    }

    // Upload data
    gl.bindBuffer(gl.ARRAY_BUFFER, targetBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, particleData.positions, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, particleData.colors, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, randomBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, randomSeeds, gl.STATIC_DRAW);

    // Get attribute/uniform locations
    const aTargetPosition = gl.getAttribLocation(program, 'aTargetPosition');
    const aColor = gl.getAttribLocation(program, 'aColor');
    const aRandomSeed = gl.getAttribLocation(program, 'aRandomSeed');
    const uTime = gl.getUniformLocation(program, 'uTime');
    const uProgress = gl.getUniformLocation(program, 'uProgress');
    const uResolution = gl.getUniformLocation(program, 'uResolution');

    let animationId: number;

    const render = () => {
      const currentTime = (Date.now() - startTimeRef.current) / 1000;
      const transitionTime = Date.now() - transitionStartRef.current;
      const progress = Math.min(transitionTime / transitionDuration, 1);

      // Clear
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // Set uniforms
      if (uTime) gl.uniform1f(uTime, currentTime);
      if (uProgress) gl.uniform1f(uProgress, progress);
      if (uResolution) gl.uniform2f(uResolution, width, height);

      // Bind attributes
      gl.bindBuffer(gl.ARRAY_BUFFER, targetBuffer);
      gl.enableVertexAttribArray(aTargetPosition);
      gl.vertexAttribPointer(aTargetPosition, 2, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
      gl.enableVertexAttribArray(aColor);
      gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, randomBuffer);
      gl.enableVertexAttribArray(aRandomSeed);
      gl.vertexAttribPointer(aRandomSeed, 2, gl.FLOAT, false, 0, 0);

      // Draw particles
      gl.drawArrays(gl.POINTS, 0, particleData.count);

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      if (targetBuffer) gl.deleteBuffer(targetBuffer);
      if (colorBuffer) gl.deleteBuffer(colorBuffer);
      if (randomBuffer) gl.deleteBuffer(randomBuffer);
    };
  }, [isReady, particleData, width, height, transitionDuration]);

  // Cleanup WebGL
  useEffect(() => {
    return () => {
      const gl = glRef.current;
      const program = programRef.current;

      if (gl && program) {
        gl.deleteProgram(program);
      }

      if (gl) {
        const loseContext = gl.getExtension('WEBGL_lose_context');
        if (loseContext) {
          loseContext.loseContext();
        }
      }

      glRef.current = null;
      programRef.current = null;
    };
  }, []);

  return { canvasRef, isReady, error };
}

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    console.error('Shader compilation error:', info);
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}
