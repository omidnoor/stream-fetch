import { useEffect, useRef, useState } from 'react';

interface ShaderUniforms {
  time: number;
  resolution: [number, number];
  progress?: number;
  activity?: number;
  [key: string]: any;
}

interface UseWebGLShaderOptions {
  fragmentShader: string;
  uniforms: Omit<ShaderUniforms, 'time' | 'resolution'>;
  pixelRatio?: number; // For performance optimization
}

/**
 * Custom hook for managing WebGL shaders with proper cleanup
 * - Creates canvas once and reuses it
 * - Properly cleans up RAF and WebGL context
 * - Optimized for performance
 */
export function useWebGLShader(options: UseWebGLShaderOptions) {
  const { fragmentShader, uniforms, pixelRatio = 1 } = options;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const uniformLocationsRef = useRef<Map<string, WebGLUniformLocation | null>>(new Map());

  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize WebGL
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      // Get WebGL context
      const gl = canvas.getContext('webgl', {
        alpha: true,
        antialias: false, // Disable for better performance
        depth: false,
        stencil: false,
        premultipliedAlpha: true,
        preserveDrawingBuffer: false,
      });

      if (!gl) {
        throw new Error('WebGL not supported');
      }

      glRef.current = gl;

      // Vertex shader (simple passthrough)
      const vertexShaderSource = `
        attribute vec2 position;
        void main() {
          gl_Position = vec4(position, 0.0, 1.0);
        }
      `;

      // Compile shaders
      const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
      const fragmentShaderCompiled = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShader);

      if (!vertexShader || !fragmentShaderCompiled) {
        throw new Error('Shader compilation failed');
      }

      // Create program
      const program = gl.createProgram();
      if (!program) {
        throw new Error('Failed to create WebGL program');
      }

      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShaderCompiled);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const info = gl.getProgramInfoLog(program);
        throw new Error(`Program linking failed: ${info}`);
      }

      programRef.current = program;
      gl.useProgram(program);

      // Set up geometry (full-screen quad)
      const positions = new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
         1,  1,
      ]);

      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

      const positionLocation = gl.getAttribLocation(program, 'position');
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      // Cache uniform locations
      uniformLocationsRef.current.set('time', gl.getUniformLocation(program, 'time'));
      uniformLocationsRef.current.set('resolution', gl.getUniformLocation(program, 'resolution'));
      uniformLocationsRef.current.set('progress', gl.getUniformLocation(program, 'progress'));
      uniformLocationsRef.current.set('activity', gl.getUniformLocation(program, 'activity'));

      setIsReady(true);
      setError(null);
    } catch (err) {
      console.error('WebGL initialization error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsReady(false);
    }
  }, [fragmentShader]);

  // Render loop
  useEffect(() => {
    if (!isReady || !glRef.current || !programRef.current || !canvasRef.current) return;

    const gl = glRef.current;
    const canvas = canvasRef.current;
    let animationId: number;

    const render = () => {
      // Update canvas size if needed
      const displayWidth = Math.floor(canvas.clientWidth * pixelRatio);
      const displayHeight = Math.floor(canvas.clientHeight * pixelRatio);

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, displayWidth, displayHeight);
      }

      // Clear
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // Update uniforms
      const timeLocation = uniformLocationsRef.current.get('time');
      const resolutionLocation = uniformLocationsRef.current.get('resolution');
      const progressLocation = uniformLocationsRef.current.get('progress');
      const activityLocation = uniformLocationsRef.current.get('activity');

      const currentTime = (Date.now() - startTimeRef.current) / 1000;

      if (timeLocation) {
        gl.uniform1f(timeLocation, currentTime);
      }

      if (resolutionLocation) {
        gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      }

      if (progressLocation && uniforms.progress !== undefined) {
        gl.uniform1f(progressLocation, uniforms.progress);
      }

      if (activityLocation && uniforms.activity !== undefined) {
        gl.uniform1f(activityLocation, uniforms.activity);
      }

      // Draw
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // Continue loop
      animationId = requestAnimationFrame(render);
    };

    render();

    // Cleanup
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isReady, uniforms, pixelRatio]);

  // Cleanup WebGL context on unmount
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
      uniformLocationsRef.current.clear();
    };
  }, []);

  return { canvasRef, isReady, error };
}

/**
 * Compile a WebGL shader
 */
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
    console.error('Shader source:', source);
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}
