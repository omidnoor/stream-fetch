'use client';

import React, { useEffect, useRef } from 'react';

type Props = {
  /**
   * Icon to render - can be an emoji or text character
   */
  icon?: string;
  /**
   * Array of icons to cycle through automatically (for testing)
   */
  testIcons?: string[];
  /**
   * How long to display each icon before morphing to next (seconds)
   */
  testDuration?: number;
  /**
   * Number of particles (should be a perfect square)
   */
  particleCount?: number;
  /**
   * Base point size for particles
   */
  pointSize?: number;
  /**
   * Scale factor for icon size
   */
  scale?: number;
  /**
   * Depth extrusion amount (0 = flat, 1 = full depth)
   */
  depth?: number;
  /**
   * Background color [r, g, b, a] in 0-1 range
   */
  background?: [number, number, number, number];
  /**
   * Time for particles to settle into shape (seconds)
   */
  settleTime?: number;
  /**
   * Enable mouse-responsive parallax
   */
  enableParallax?: boolean;
  /**
   * Parallax intensity (how much the icon tilts)
   */
  parallaxIntensity?: number;
  className?: string;
};

export function Particle3DIcon({
  icon = '⚡',
  testIcons,
  testDuration = 4,
  particleCount = 65536,
  pointSize = 2.0,
  scale = 1.5,
  depth = 0.4,
  background = [0.02, 0.02, 0.035, 1.0],
  settleTime = 2.5,
  enableParallax = true,
  parallaxIntensity = 0.3,
  className = '',
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const iconRef = useRef<string>(icon);
  const iconIndexRef = useRef<number>(0);
  const lastIconChangeRef = useRef<number>(0);
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0.5, y: 0.5 });

  // All dynamic props as refs to avoid WebGL context recreation
  const depthRef = useRef<number>(depth);
  const enableParallaxRef = useRef<boolean>(enableParallax);
  const parallaxIntensityRef = useRef<number>(parallaxIntensity);
  const pointSizeRef = useRef<number>(pointSize);
  const scaleRef = useRef<number>(scale);
  const backgroundRef = useRef<[number, number, number, number]>(background);
  const settleTimeRef = useRef<number>(settleTime);
  const testIconsRef = useRef<string[] | undefined>(testIcons);
  const testDurationRef = useRef<number>(testDuration);

  // Update all refs when props change (without recreating WebGL context)
  useEffect(() => {
    depthRef.current = depth;
    enableParallaxRef.current = enableParallax;
    parallaxIntensityRef.current = parallaxIntensity;
    pointSizeRef.current = pointSize;
    scaleRef.current = scale;
    backgroundRef.current = background;
    settleTimeRef.current = settleTime;
    testIconsRef.current = testIcons;
    testDurationRef.current = testDuration;
    iconRef.current = icon;
  }, [depth, enableParallax, parallaxIntensity, pointSize, scale, background, settleTime, testIcons, testDuration, icon]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2', {
      antialias: false,
      alpha: true,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
    });
    if (!gl) {
      console.warn('WebGL2 not supported.');
      return;
    }

    const extFloat = gl.getExtension('EXT_color_buffer_float');
    if (!extFloat) {
      console.warn('EXT_color_buffer_float not supported.');
      return;
    }

    // Mouse tracking for parallax (always listen, check enableParallax in render)
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      };
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    // ---------- Helpers ----------
    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(s);
        gl.deleteShader(s);
        throw new Error(info || 'Shader compile error');
      }
      return s;
    };

    const link = (vsSrc: string, fsSrc: string) => {
      const p = gl.createProgram()!;
      const vs = compile(gl.VERTEX_SHADER, vsSrc);
      const fs = compile(gl.FRAGMENT_SHADER, fsSrc);
      gl.attachShader(p, vs);
      gl.attachShader(p, fs);
      gl.linkProgram(p);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        const info = gl.getProgramInfoLog(p);
        gl.deleteProgram(p);
        throw new Error(info || 'Program link error');
      }
      return p;
    };

    const createFloatTexture = (w: number, h: number, data?: Float32Array) => {
      const tex = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA32F,
        w,
        h,
        0,
        gl.RGBA,
        gl.FLOAT,
        data ?? null
      );
      gl.bindTexture(gl.TEXTURE_2D, null);
      return tex;
    };

    const createColorTexture = (w: number, h: number, data?: Uint8Array) => {
      const tex = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        w,
        h,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        data ?? null
      );
      gl.bindTexture(gl.TEXTURE_2D, null);
      return tex;
    };

    const createFBO = (tex: WebGLTexture) => {
      const fbo = gl.createFramebuffer()!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        tex,
        0
      );
      const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      if (status !== gl.FRAMEBUFFER_COMPLETE) {
        throw new Error('Framebuffer incomplete');
      }
      return fbo;
    };

    const setCanvasSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.floor(canvas.clientWidth * dpr);
      const h = Math.floor(canvas.clientHeight * dpr);
      canvas.width = Math.max(1, w);
      canvas.height = Math.max(1, h);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    // ---------- Particle grid size ----------
    const side = Math.ceil(Math.sqrt(particleCount));
    const simW = side;
    const simH = side;
    const actualCount = simW * simH;

    const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    if (simW > maxTex || simH > maxTex) {
      console.warn('Particle grid exceeds MAX_TEXTURE_SIZE.');
      return;
    }

    // ---------- Initial state ----------
    // State RGBA: pos.xy, vel.xy
    const stateInit = new Float32Array(actualCount * 4);
    for (let i = 0; i < actualCount; i++) {
      const px = (Math.random() * 2 - 1) * 1.5;
      const py = (Math.random() * 2 - 1) * 1.5;
      const vx = (Math.random() * 2 - 1) * 0.03;
      const vy = (Math.random() * 2 - 1) * 0.03;
      stateInit[i * 4 + 0] = px;
      stateInit[i * 4 + 1] = py;
      stateInit[i * 4 + 2] = vx;
      stateInit[i * 4 + 3] = vy;
    }

    const stateTexA = createFloatTexture(simW, simH, stateInit);
    const stateTexB = createFloatTexture(simW, simH, stateInit);
    const fboA = createFBO(stateTexA);
    const fboB = createFBO(stateTexB);

    const targetPosTex = createFloatTexture(simW, simH);
    const targetColTex = createColorTexture(simW, simH);

    // ---------- VAO ----------
    const emptyVao = gl.createVertexArray()!;
    gl.bindVertexArray(emptyVao);
    gl.bindVertexArray(null);

    // ---------- Shaders ----------
    const SIM_VS = `#version 300 es
      precision highp float;
      const vec2 P[3] = vec2[3](
        vec2(-1.0, -1.0),
        vec2( 3.0, -1.0),
        vec2(-1.0,  3.0)
      );
      out vec2 vUv;
      void main() {
        gl_Position = vec4(P[gl_VertexID], 0.0, 1.0);
        vUv = gl_Position.xy * 0.5 + 0.5;
      }
    `;

    const SIM_FS = `#version 300 es
      precision highp float;

      uniform sampler2D uState;
      uniform sampler2D uTargetPos;

      uniform float uDT;
      uniform float uTime;
      uniform float uTemperature;
      uniform float uAttractBase;
      uniform float uAttractMax;
      uniform float uDamping;
      uniform float uFlowStrength;
      uniform float uNoiseStrength;
      uniform vec2 uAspect;

      in vec2 vUv;
      out vec4 outState;

      float hash(vec3 p) {
        p = fract(p * vec3(123.34, 456.21, 789.92));
        p += dot(p, p.yzx + 45.32);
        return fract(p.x * p.y * p.z);
      }

      float vnoise(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        vec3 u = f * f * (3.0 - 2.0 * f);

        float a = hash(i);
        float b = hash(i + vec3(1.0, 0.0, 0.0));
        float c = hash(i + vec3(0.0, 1.0, 0.0));
        float d = hash(i + vec3(1.0, 1.0, 0.0));
        float e = hash(i + vec3(0.0, 0.0, 1.0));
        float f1 = hash(i + vec3(1.0, 0.0, 1.0));
        float g = hash(i + vec3(0.0, 1.0, 1.0));
        float h = hash(i + vec3(1.0, 1.0, 1.0));

        return mix(
          mix(mix(a, b, u.x), mix(c, d, u.x), u.y),
          mix(mix(e, f1, u.x), mix(g, h, u.x), u.y),
          u.z
        );
      }

      vec3 curl3D(vec3 p) {
        float e = 0.1;
        vec3 dx = vec3(e, 0.0, 0.0);
        vec3 dy = vec3(0.0, e, 0.0);
        vec3 dz = vec3(0.0, 0.0, e);

        float n1 = vnoise(p + dy) - vnoise(p - dy);
        float n2 = vnoise(p + dz) - vnoise(p - dz);
        float n3 = vnoise(p + dz) - vnoise(p - dz);
        float n4 = vnoise(p + dx) - vnoise(p - dx);
        float n5 = vnoise(p + dx) - vnoise(p - dx);
        float n6 = vnoise(p + dy) - vnoise(p - dy);

        return vec3(n1 - n2, n3 - n4, n5 - n6) / (2.0 * e);
      }

      vec3 rand3(vec3 p) {
        float n1 = hash(p + uTime * 0.01);
        float n2 = hash(p + 13.7 + uTime * 0.01);
        float n3 = hash(p + 27.3 + uTime * 0.01);
        return vec3(n1, n2, n3) * 2.0 - 1.0;
      }

      void main() {
        vec4 s = texture(uState, vUv);
        vec2 pos2d = s.xy;
        vec2 vel2d = s.zw;

        vec4 target4 = texture(uTargetPos, vUv);
        vec3 target3d = target4.xyz;
        target3d.x *= uAspect.y;
        vec2 target = target3d.xy; // Only use XY for now

        float cool = 1.0 - uTemperature;
        float attract = mix(uAttractBase, uAttractMax, smoothstep(0.0, 1.0, cool));
        float flowAmt = uFlowStrength * uTemperature;
        float noiseAmt = uNoiseStrength * uTemperature;

        // Use 2D curl for now (XY plane)
        vec3 flow3d = curl3D(vec3(pos2d * 2.0, target3d.z) + vec3(uTime * 0.05));
        vec2 flow = flow3d.xy;
        vec2 jitter = rand3(vec3(pos2d * 5.0, target3d.z) + uTime).xy;
        vec2 toT = target - pos2d;

        vec2 accel = toT * attract + flow * flowAmt + jitter * noiseAmt;

        vel2d += accel * uDT;
        vel2d *= uDamping;
        pos2d += vel2d * uDT;

        float bound = 2.0;
        if (abs(pos2d.x) > bound) { vel2d.x *= -0.5; pos2d.x = clamp(pos2d.x, -bound, bound); }
        if (abs(pos2d.y) > bound) { vel2d.y *= -0.5; pos2d.y = clamp(pos2d.y, -bound, bound); }

        outState = vec4(pos2d, vel2d);
      }
    `;

    const RENDER_VS = `#version 300 es
      precision highp float;

      uniform sampler2D uState;
      uniform sampler2D uTargetCol;
      uniform vec2 uTexSize;
      uniform float uPointSize;
      uniform vec2 uAspect;
      uniform vec2 uMouse;
      uniform float uParallaxIntensity;
      uniform vec3 uLightDir;

      out vec3 vCol;
      out float vDepth;
      out vec3 vNormal;

      vec2 idToUv(float id, vec2 size) {
        float x = mod(id, size.x);
        float y = floor(id / size.x);
        return (vec2(x, y) + 0.5) / size;
      }

      mat3 rotateX(float a) {
        float c = cos(a), s = sin(a);
        return mat3(1.0, 0.0, 0.0, 0.0, c, -s, 0.0, s, c);
      }

      mat3 rotateY(float a) {
        float c = cos(a), s = sin(a);
        return mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c);
      }

      void main() {
        float id = float(gl_VertexID);
        vec2 uv = idToUv(id, uTexSize);

        vec4 s = texture(uState, uv);
        vec2 pos2d = s.xy;

        vec4 targetData = texture(uTargetCol, uv);
        vCol = targetData.rgb;

        // Get Z depth from target position
        vec3 targetPos = texture(uTargetCol, uv).rgb; // Placeholder - we'll store depth differently
        float depthZ = 0.0; // Simplified for now - no depth

        vec3 pos = vec3(pos2d, depthZ);

        // Apply parallax rotation based on mouse position
        vec2 mouseOffset = (uMouse - 0.5) * 2.0;
        float rotX = -mouseOffset.y * uParallaxIntensity * 0.5;
        float rotY = mouseOffset.x * uParallaxIntensity * 0.5;

        mat3 rotation = rotateY(rotY) * rotateX(rotX);
        pos = rotation * pos;

        // Perspective projection
        float fov = 2.0;
        float z = pos.z + 2.0; // Move back
        float perspective = fov / z;

        vec2 p = pos.xy * perspective;
        p.x *= uAspect.y;

        gl_Position = vec4(p, pos.z * 0.1, 1.0);

        // Depth-based point size (closer = bigger)
        gl_PointSize = uPointSize * perspective * 0.8;

        vDepth = pos.z;
        vNormal = normalize(vec3(0.0, 0.0, 1.0)); // Simplified normal
      }
    `;

    const RENDER_FS = `#version 300 es
      precision highp float;

      in vec3 vCol;
      in float vDepth;
      in vec3 vNormal;

      uniform vec3 uLightDir;

      out vec4 outColor;

      void main() {
        vec2 p = gl_PointCoord * 2.0 - 1.0;
        float r2 = dot(p, p);
        if (r2 > 1.0) discard;

        float alpha = smoothstep(1.0, 0.0, r2);

        // 3D lighting effect
        vec3 normal = normalize(vec3(p * 0.5, sqrt(1.0 - r2 * 0.5)));
        float diffuse = max(dot(normal, uLightDir), 0.0);
        float ambient = 0.3;
        float specular = pow(max(dot(reflect(-uLightDir, normal), vec3(0.0, 0.0, 1.0)), 0.0), 16.0) * 0.5;

        // Depth-based shading (closer = brighter)
        float depthShade = 1.0 - (vDepth + 0.5) * 0.3;

        vec3 lighting = vec3(ambient + diffuse * 0.7 + specular) * depthShade;
        vec3 color = vCol * lighting;

        // Add rim light for 3D pop
        float rim = 1.0 - max(dot(normal, vec3(0.0, 0.0, 1.0)), 0.0);
        rim = pow(rim, 3.0) * 0.4;
        color += vec3(0.3, 0.5, 1.0) * rim;

        outColor = vec4(color, alpha * 0.95);
      }
    `;

    let simProgram: WebGLProgram;
    let renderProgram: WebGLProgram;

    try {
      simProgram = link(SIM_VS, SIM_FS);
      renderProgram = link(RENDER_VS, RENDER_FS);
    } catch (e) {
      console.error(e);
      return;
    }

    const simLoc = {
      uState: gl.getUniformLocation(simProgram, 'uState'),
      uTargetPos: gl.getUniformLocation(simProgram, 'uTargetPos'),
      uDT: gl.getUniformLocation(simProgram, 'uDT'),
      uTime: gl.getUniformLocation(simProgram, 'uTime'),
      uTemperature: gl.getUniformLocation(simProgram, 'uTemperature'),
      uAttractBase: gl.getUniformLocation(simProgram, 'uAttractBase'),
      uAttractMax: gl.getUniformLocation(simProgram, 'uAttractMax'),
      uDamping: gl.getUniformLocation(simProgram, 'uDamping'),
      uFlowStrength: gl.getUniformLocation(simProgram, 'uFlowStrength'),
      uNoiseStrength: gl.getUniformLocation(simProgram, 'uNoiseStrength'),
      uAspect: gl.getUniformLocation(simProgram, 'uAspect'),
    };

    const renderLoc = {
      uState: gl.getUniformLocation(renderProgram, 'uState'),
      uTargetCol: gl.getUniformLocation(renderProgram, 'uTargetCol'),
      uTexSize: gl.getUniformLocation(renderProgram, 'uTexSize'),
      uPointSize: gl.getUniformLocation(renderProgram, 'uPointSize'),
      uAspect: gl.getUniformLocation(renderProgram, 'uAspect'),
      uMouse: gl.getUniformLocation(renderProgram, 'uMouse'),
      uParallaxIntensity: gl.getUniformLocation(renderProgram, 'uParallaxIntensity'),
      uLightDir: gl.getUniformLocation(renderProgram, 'uLightDir'),
    };

    // ---------- Build targets from icon ----------
    const buildTargetsFromIcon = (iconContent: string) => {
      const oc = document.createElement('canvas');
      const ctx = oc.getContext('2d', { willReadFrequently: true })!;

      const canvasSize = 400;
      oc.width = canvasSize;
      oc.height = canvasSize;

      ctx.clearRect(0, 0, oc.width, oc.height);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const fontSize = canvasSize * 0.7;
      ctx.font = `${fontSize}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;

      ctx.fillText(iconContent, oc.width / 2, oc.height / 2);

      const imgData = ctx.getImageData(0, 0, oc.width, oc.height);
      const d = imgData.data;

      const candidates: Array<{
        x: number; y: number; z: number;
        r: number; g: number; b: number;
      }> = [];

      // Sample pixels and assign depth based on brightness/position
      for (let y = 0; y < oc.height; y++) {
        for (let x = 0; x < oc.width; x++) {
          const idx = (y * oc.width + x) * 4;
          const r = d[idx] / 255;
          const g = d[idx + 1] / 255;
          const b = d[idx + 2] / 255;
          const a = d[idx + 3] / 255;

          if (a > 0.3) {
            // Calculate depth based on distance from center and brightness
            const cx = oc.width / 2;
            const cy = oc.height / 2;
            const dx = (x - cx) / cx;
            const dy = (y - cy) / cy;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Brightness affects depth - brighter parts come forward
            const brightness = (r + g + b) / 3;
            const currentDepth = depthRef.current;
            const baseZ = (1 - dist) * currentDepth; // Center is forward
            const brightnessZ = brightness * currentDepth * 0.5;
            const z = baseZ + brightnessZ;

            candidates.push({
              x, y, z,
              r: r > 0.1 ? r : 0.8,
              g: g > 0.1 ? g : 0.6,
              b: b > 0.1 ? b : 0.3,
            });
          }
        }
      }

      // Shuffle
      for (let i = candidates.length - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
      }

      const targetPos = new Float32Array(actualCount * 4);
      const targetCol = new Uint8Array(actualCount * 4);

      const cx = oc.width * 0.5;
      const cy = oc.height * 0.5;
      const scaleToClip = (2.0 / oc.width) * scaleRef.current;

      for (let i = 0; i < actualCount; i++) {
        const c = candidates[i % candidates.length];

        const nx = (c.x - cx) * scaleToClip;
        const ny = (cy - c.y) * scaleToClip;
        const nz = c.z;

        targetPos[i * 4 + 0] = nx;
        targetPos[i * 4 + 1] = ny;
        targetPos[i * 4 + 2] = nz;
        targetPos[i * 4 + 3] = 1;

        targetCol[i * 4 + 0] = Math.min(255, c.r * 255);
        targetCol[i * 4 + 1] = Math.min(255, c.g * 255);
        targetCol[i * 4 + 2] = Math.min(255, c.b * 255);
        targetCol[i * 4 + 3] = 255;
      }

      gl.bindTexture(gl.TEXTURE_2D, targetPosTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, simW, simH, 0, gl.RGBA, gl.FLOAT, targetPos);

      gl.bindTexture(gl.TEXTURE_2D, targetColTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, simW, simH, 0, gl.RGBA, gl.UNSIGNED_BYTE, targetCol);

      gl.bindTexture(gl.TEXTURE_2D, null);
    };

    let targetsReady = false;
    let startTime = performance.now();
    let lastKnownDepth = depthRef.current;

    // Initialize with first icon
    const initialTestIcons = testIconsRef.current;
    const initialIcon = initialTestIcons && initialTestIcons.length > 0 ? initialTestIcons[0] : iconRef.current;
    iconRef.current = initialIcon;
    lastIconChangeRef.current = startTime;

    buildTargetsFromIcon(initialIcon);
    targetsReady = true;

    // ---------- Ping-pong ----------
    let readTex = stateTexA;
    let writeTex = stateTexB;
    let readFbo = fboA;
    let writeFbo = fboB;

    // ---------- Entropy curve ----------
    const temperatureFromT = (t: number) => {
      const k = 4.0 / Math.max(1e-3, settleTimeRef.current);
      const raw = Math.exp(-k * t);
      return Math.max(0, Math.min(1, Math.pow(raw, 0.8)));
    };

    // ---------- ResizeObserver ----------
    setCanvasSize();
    const ro = new ResizeObserver(() => setCanvasSize());
    ro.observe(canvas);

    // ---------- Render loop ----------
    let running = true;
    let last = performance.now();

    const tick = () => {
      if (!running) return;

      const now = performance.now();
      const dtSec = Math.min(0.033, Math.max(0.001, (now - last) / 1000));
      last = now;

      const tSec = (now - startTime) / 1000;
      const temperature = temperatureFromT(tSec);

      // Check for depth changes and rebuild targets if needed
      if (depthRef.current !== lastKnownDepth) {
        lastKnownDepth = depthRef.current;
        buildTargetsFromIcon(iconRef.current);
        startTime = now; // Reset entropy for smooth transition
      }

      // Test mode: cycle through icons automatically
      const currentTestIcons = testIconsRef.current;
      const currentTestDuration = testDurationRef.current;
      const currentSettleTime = settleTimeRef.current;

      if (currentTestIcons && currentTestIcons.length > 1) {
        const timeSinceLastChange = (now - lastIconChangeRef.current) / 1000;
        if (timeSinceLastChange >= currentTestDuration + currentSettleTime) {
          iconIndexRef.current = (iconIndexRef.current + 1) % currentTestIcons.length;
          const newIcon = currentTestIcons[iconIndexRef.current];
          iconRef.current = newIcon;
          buildTargetsFromIcon(newIcon);
          startTime = now;
          lastIconChangeRef.current = now;
        }
      }

      const aspectY = canvas.height / Math.max(1, canvas.width);

      // 1) SIM PASS
      gl.useProgram(simProgram);
      gl.bindVertexArray(emptyVao);
      gl.bindFramebuffer(gl.FRAMEBUFFER, writeFbo);
      gl.viewport(0, 0, simW, simH);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, readTex);
      gl.uniform1i(simLoc.uState, 0);

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, targetPosTex);
      gl.uniform1i(simLoc.uTargetPos, 1);

      gl.uniform1f(simLoc.uDT, dtSec);
      gl.uniform1f(simLoc.uTime, tSec);
      gl.uniform1f(simLoc.uTemperature, temperature);
      gl.uniform1f(simLoc.uAttractBase, 0.1);
      gl.uniform1f(simLoc.uAttractMax, targetsReady ? 3.0 : 0.2);
      gl.uniform1f(simLoc.uDamping, 0.96);
      gl.uniform1f(simLoc.uFlowStrength, 0.8);
      gl.uniform1f(simLoc.uNoiseStrength, 0.4);
      if (simLoc.uAspect) gl.uniform2f(simLoc.uAspect, 1.0, aspectY);

      gl.drawArrays(gl.TRIANGLES, 0, 3);

      // 2) RENDER PASS
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      setCanvasSize();

      const bg = backgroundRef.current;
      gl.clearColor(bg[0], bg[1], bg[2], bg[3]);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

      gl.useProgram(renderProgram);
      gl.bindVertexArray(emptyVao);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, writeTex);
      gl.uniform1i(renderLoc.uState, 0);

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, targetColTex);
      gl.uniform1i(renderLoc.uTargetCol, 1);

      gl.uniform2f(renderLoc.uTexSize, simW, simH);

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      gl.uniform1f(renderLoc.uPointSize, pointSizeRef.current * dpr);

      gl.uniform2f(renderLoc.uAspect, 1.0, aspectY);
      gl.uniform2f(renderLoc.uMouse, mouseRef.current.x, mouseRef.current.y);
      gl.uniform1f(renderLoc.uParallaxIntensity, enableParallaxRef.current ? parallaxIntensityRef.current : 0.0);

      // Light direction (top-right-front)
      const lightDir = [0.5, 0.5, 1.0];
      const len = Math.sqrt(lightDir[0] ** 2 + lightDir[1] ** 2 + lightDir[2] ** 2);
      gl.uniform3f(renderLoc.uLightDir, lightDir[0] / len, lightDir[1] / len, lightDir[2] / len);

      gl.drawArrays(gl.POINTS, 0, actualCount);

      gl.disable(gl.BLEND);

      // 3) Swap
      [readTex, writeTex] = [writeTex, readTex];
      [readFbo, writeFbo] = [writeFbo, readFbo];

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    // ---------- Cleanup ----------
    return () => {
      running = false;
      ro.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      canvas.removeEventListener('mousemove', handleMouseMove);

      gl.deleteProgram(simProgram);
      gl.deleteProgram(renderProgram);
      gl.deleteTexture(stateTexA);
      gl.deleteTexture(stateTexB);
      gl.deleteTexture(targetPosTex);
      gl.deleteTexture(targetColTex);
      gl.deleteFramebuffer(fboA);
      gl.deleteFramebuffer(fboB);
      gl.deleteVertexArray(emptyVao);

      const loseContext = gl.getExtension('WEBGL_lose_context');
      if (loseContext) loseContext.loseContext();
    };
    // Only recreate WebGL context when particle count changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [particleCount]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        style={{ display: 'block' }}
      />
    </div>
  );
}
