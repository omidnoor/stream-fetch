'use client';

import React, { useEffect, useRef } from 'react';

type Props = {
  text: string;
  /**
   * Should be a perfect square ideally (e.g., 65536, 131072).
   * We will round up to the nearest square grid internally.
   */
  particleCount?: number;
  pointSize?: number;
  background?: [number, number, number, number];
  /**
   * How long until it's mostly formed (seconds).
   * The curve is exponential-ish; this sets the feel.
   */
  settleTime?: number;
  className?: string;
};

export function ParticleMorphText({
  text,
  particleCount = 65536, // 256 * 256
  pointSize = 1.8,
  background = [0.02, 0.02, 0.035, 1.0],
  settleTime = 3,
  className = '',
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const textRef = useRef<string>(text);

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

    // Float render targets for GPGPU state
    const extFloat = gl.getExtension('EXT_color_buffer_float');
    if (!extFloat) {
      console.warn('EXT_color_buffer_float not supported.');
      return;
    }

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
      console.warn('Particle grid exceeds MAX_TEXTURE_SIZE. Reduce particleCount.');
      return;
    }

    // ---------- Initial state ----------
    // State RGBA: pos.xy, vel.xy
    const stateInit = new Float32Array(actualCount * 4);
    for (let i = 0; i < actualCount; i++) {
      const px = (Math.random() * 2 - 1) * 1.2;
      const py = (Math.random() * 2 - 1) * 1.2;
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

      in vec2 vUv;
      out vec4 outState;

      float hash(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      float vnoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
      }

      vec2 curl(vec2 p) {
        float e = 0.08;
        float n1 = vnoise(p + vec2(0.0, e));
        float n2 = vnoise(p - vec2(0.0, e));
        float n3 = vnoise(p + vec2(e, 0.0));
        float n4 = vnoise(p - vec2(e, 0.0));
        float dy = (n1 - n2) / (2.0 * e);
        float dx = (n3 - n4) / (2.0 * e);
        return vec2(dy, -dx);
      }

      vec2 rand2(vec2 p) {
        float n = hash(p + uTime * 0.01);
        float m = hash(p + 13.7 + uTime * 0.01);
        return vec2(n, m) * 2.0 - 1.0;
      }

      void main() {
        vec4 s = texture(uState, vUv);
        vec2 pos = s.xy;
        vec2 vel = s.zw;

        vec2 target = texture(uTargetPos, vUv).xy;

        float cool = 1.0 - uTemperature;
        float attract = mix(uAttractBase, uAttractMax, smoothstep(0.0, 1.0, cool));
        float flowAmt = uFlowStrength * uTemperature;
        float noiseAmt = uNoiseStrength * uTemperature;

        vec2 flow = curl(pos * 2.2 + vec2(uTime * 0.08, -uTime * 0.06));
        vec2 jitter = rand2(pos * 7.0 + uTime);
        vec2 toT = target - pos;

        vec2 accel = toT * attract + flow * flowAmt + jitter * noiseAmt;

        vel += accel * uDT;
        vel *= uDamping;
        pos += vel * uDT;

        float bound = 1.2;
        if (abs(pos.x) > bound) { vel.x *= -0.6; pos.x = clamp(pos.x, -bound, bound); }
        if (abs(pos.y) > bound) { vel.y *= -0.6; pos.y = clamp(pos.y, -bound, bound); }

        outState = vec4(pos, vel);
      }
    `;

    const RENDER_VS = `#version 300 es
      precision highp float;

      uniform sampler2D uState;
      uniform sampler2D uTargetCol;
      uniform vec2 uTexSize;
      uniform float uPointSize;
      uniform vec2 uAspect;

      out vec3 vCol;
      out float vSpeed;

      vec2 idToUv(float id, vec2 size) {
        float x = mod(id, size.x);
        float y = floor(id / size.x);
        return (vec2(x, y) + 0.5) / size;
      }

      void main() {
        float id = float(gl_VertexID);
        vec2 uv = idToUv(id, uTexSize);

        vec4 s = texture(uState, uv);
        vec2 pos = s.xy;
        vec2 vel = s.zw;

        vCol = texture(uTargetCol, uv).rgb;

        vec2 p = pos;
        p.y *= uAspect.y;

        gl_Position = vec4(p, 0.0, 1.0);
        gl_PointSize = uPointSize;

        vSpeed = length(vel);
      }
    `;

    const RENDER_FS = `#version 300 es
      precision highp float;

      in vec3 vCol;
      in float vSpeed;
      out vec4 outColor;

      void main() {
        vec2 p = gl_PointCoord * 2.0 - 1.0;
        float r2 = dot(p, p);
        if (r2 > 1.0) discard;

        float alpha = smoothstep(1.0, 0.0, r2);
        float glow = clamp(vSpeed * 5.0, 0.0, 1.0);

        vec3 color = mix(vCol * 0.7, vCol * 1.2, glow);

        outColor = vec4(color, alpha * 0.9);
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
    };

    const renderLoc = {
      uState: gl.getUniformLocation(renderProgram, 'uState'),
      uTargetCol: gl.getUniformLocation(renderProgram, 'uTargetCol'),
      uTexSize: gl.getUniformLocation(renderProgram, 'uTexSize'),
      uPointSize: gl.getUniformLocation(renderProgram, 'uPointSize'),
      uAspect: gl.getUniformLocation(renderProgram, 'uAspect'),
    };

    // ---------- Build targets from text ----------
    const buildTargetsFromText = (textContent: string) => {
      const oc = document.createElement('canvas');
      const ctx = oc.getContext('2d', { willReadFrequently: true })!;

      oc.width = 800;
      oc.height = 200;

      ctx.clearRect(0, 0, oc.width, oc.height);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const maxFontSize = Math.min(oc.width / textContent.length * 1.8, oc.height * 0.6);
      ctx.font = `bold ${maxFontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;

      ctx.fillText(textContent, oc.width / 2, oc.height / 2);

      const imgData = ctx.getImageData(0, 0, oc.width, oc.height);
      const d = imgData.data;

      const candidates: Array<{
        x: number; y: number;
        r: number; g: number; b: number;
      }> = [];

      for (let y = 0; y < oc.height; y += 2) {
        for (let x = 0; x < oc.width; x += 2) {
          const idx = (y * oc.width + x) * 4;
          const a = d[idx + 3] / 255;

          if (a > 0.3) {
            // Rainbow color based on position
            const hue = (x / oc.width) * 360;
            const rgb = hslToRgb(hue, 0.85, 0.65);
            candidates.push({ x, y, r: rgb.r, g: rgb.g, b: rgb.b });
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
      const longest = Math.max(oc.width, oc.height);
      const scaleToClip = 2.0 / longest;

      for (let i = 0; i < actualCount; i++) {
        const c = candidates[i % candidates.length];

        const nx = (c.x - cx) * scaleToClip;
        const ny = (cy - c.y) * scaleToClip;

        targetPos[i * 4 + 0] = nx;
        targetPos[i * 4 + 1] = ny;
        targetPos[i * 4 + 2] = 0;
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

    function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
      h = h / 360;
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      const hueToRgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      return {
        r: hueToRgb(p, q, h + 1/3),
        g: hueToRgb(p, q, h),
        b: hueToRgb(p, q, h - 1/3),
      };
    }

    let targetsReady = false;
    let startTime = performance.now();

    buildTargetsFromText(text);
    targetsReady = true;

    // ---------- Ping-pong ----------
    let readTex = stateTexA;
    let writeTex = stateTexB;
    let readFbo = fboA;
    let writeFbo = fboB;

    // ---------- Entropy curve ----------
    const temperatureFromT = (t: number) => {
      const k = 4.2 / Math.max(1e-3, settleTime);
      const raw = Math.exp(-k * t);
      return Math.max(0, Math.min(1, Math.pow(raw, 0.85)));
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

      // Check if text changed
      if (textRef.current !== text) {
        textRef.current = text;
        buildTargetsFromText(text);
        startTime = now; // Reset entropy
      }

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
      gl.uniform1f(simLoc.uAttractBase, 0.08);
      gl.uniform1f(simLoc.uAttractMax, targetsReady ? 2.8 : 0.2);
      gl.uniform1f(simLoc.uDamping, 0.968);
      gl.uniform1f(simLoc.uFlowStrength, 0.9);
      gl.uniform1f(simLoc.uNoiseStrength, 0.45);

      gl.drawArrays(gl.TRIANGLES, 0, 3);

      // 2) RENDER PASS
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      setCanvasSize();

      gl.clearColor(background[0], background[1], background[2], background[3]);
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
      gl.uniform1f(renderLoc.uPointSize, pointSize * dpr);

      const aspectY = canvas.height / Math.max(1, canvas.width);
      gl.uniform2f(renderLoc.uAspect, 1.0, aspectY);

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
  }, [text, particleCount, pointSize, background, settleTime]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: 'block' }}
      />
    </div>
  );
}
