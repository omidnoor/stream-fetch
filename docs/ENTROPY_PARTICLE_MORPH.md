# Entropy-Based Particle Morphing System

## Concept

A WebGL2-powered particle system where **thousands of particles move in smooth chaotic motion**, and as their **entropy decreases**, they gradually **converge into specific coordinates** to form text.

> **"Chaos to Order"** - Particles flow smoothly in curl noise fields, then settle into formation as temperature cools.

## Physics Simulation

### Entropy Cooling Curve

```typescript
// Temperature starts at 1.0 (high chaos) and exponentially decays to 0.0 (ordered)
const temperatureFromT = (t: number) => {
  const k = 4.2 / settleTime;
  const raw = Math.exp(-k * t);
  return Math.pow(raw, 0.85); // Ease-out feel
};
```

### Forces Acting on Particles

```glsl
// High Temperature (Early) - Chaotic
vec2 flow = curl(pos);         // Curl noise flow field
vec2 jitter = rand2(pos);      // Random jitter
vec2 attraction = target - pos; // Weak attraction

// Low Temperature (Late) - Ordered
vec2 attraction = target - pos; // Strong attraction
vec2 flow = curl(pos) * 0.1;   // Dampened flow
vec2 jitter = 0.0;             // No jitter
```

### State Evolution

| Phase | Temperature | Behavior |
|-------|-------------|----------|
| **Initial** | 1.0 | Pure chaos - particles swirl in curl noise fields |
| **Settling** | 0.5 | Half chaos, half order - particles begin converging |
| **Forming** | 0.1 | Mostly ordered - particles snap to text positions |
| **Stable** | 0.0 | Fully settled - text is clear and readable |

## GPGPU Architecture

### Ping-Pong Framebuffers

```
Frame N:
  Read from stateTexA → Simulate physics → Write to stateTexB

Frame N+1:
  Read from stateTexB → Simulate physics → Write to stateTexA

(Swap textures each frame)
```

### State Texture (RGBA32F)

| Channel | Data |
|---------|------|
| R | Position X |
| G | Position Y |
| Z | Velocity X |
| W | Velocity Y |

### Target Textures

| Texture | Format | Purpose |
|---------|--------|---------|
| `targetPosTex` | RGBA32F | Target positions for each particle |
| `targetColTex` | RGBA8 | RGB colors sampled from text |

## Usage

### Basic Example

```tsx
import { ParticleMorphText } from '@/components/automation/shader';

function StatusDisplay() {
  const [status, setStatus] = useState('DOWNLOADING...');

  return (
    <ParticleMorphText
      text={status}
      particleCount={65536}
      pointSize={1.8}
      settleTime={3}
    />
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `text` | `string` | - | Text to morph into |
| `particleCount` | `number` | `65536` | Number of particles (should be perfect square) |
| `pointSize` | `number` | `1.8` | Particle render size |
| `settleTime` | `number` | `3` | Seconds for entropy to cool |
| `background` | `[number, number, number, number]` | `[0.02, 0.02, 0.035, 1.0]` | RGBA background color |

### In Progress Monitor

```tsx
function ProgressMonitor({ stage }) {
  const [statusText, setStatusText] = useState('INITIALIZING...');

  useEffect(() => {
    // Update status based on pipeline stage
    const messages = {
      download: 'DOWNLOADING...',
      chunk: 'CHUNKING: 8/12',
      dub: 'DUBBING CHUNK 3',
      merge: 'MERGING FILES',
      finalize: 'FINALIZING',
      complete: 'COMPLETE!',
    };
    setStatusText(messages[stage]);
  }, [stage]);

  return (
    <div className="relative aspect-video bg-surface-1 rounded-lg overflow-hidden">
      <ParticleMorphText
        text={statusText}
        particleCount={65536}
        settleTime={2}
      />
    </div>
  );
}
```

## How It Works

### 1. Text Rendering to Canvas

```typescript
// Render text to offscreen canvas
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
ctx.font = 'bold 100px sans-serif';
ctx.fillText(text, x, y);

// Sample pixels where text exists
const imageData = ctx.getImageData(0, 0, width, height);
// Extract positions and colors → upload to GPU textures
```

### 2. Physics Simulation (GPU)

```glsl
// Vertex shader computes new particle state
void main() {
  vec2 pos = texture(uState, vUv).xy;
  vec2 vel = texture(uState, vUv).zw;
  vec2 target = texture(uTargetPos, vUv).xy;

  // Temperature-dependent forces
  float cool = 1.0 - uTemperature;
  float attract = mix(0.08, 2.8, cool);
  float flowAmt = 0.9 * uTemperature;

  // Apply forces
  vec2 flow = curl(pos);
  vec2 accel = (target - pos) * attract + flow * flowAmt;

  vel += accel * dt;
  pos += vel * dt;

  outState = vec4(pos, vel);
}
```

### 3. Rendering (GPU)

```glsl
// Fragment shader renders circular particles with glow
void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(p, p);
  if (r2 > 1.0) discard;

  float alpha = smoothstep(1.0, 0.0, r2);
  float glow = vSpeed * 5.0; // Particles glow when moving

  vec3 color = mix(vCol * 0.7, vCol * 1.2, glow);
  outColor = vec4(color, alpha);
}
```

## Performance

### Optimization Strategies

✅ **WebGL2 Required** - Float textures for GPGPU
✅ **Ping-pong FBOs** - No buffer copies
✅ **No CPU readback** - All computation on GPU
✅ **Vertex shader physics** - Massively parallel
✅ **Instanced rendering** - Draw all particles in one call

### Typical Performance

| Metric | Value |
|--------|-------|
| Particles | 65,536 |
| FPS | 60 (locked) |
| Memory | ~15MB |
| GPU Usage | Moderate |

### Tuning

```tsx
// Lower particles = better performance
<ParticleMorphText particleCount={16384} />

// Smaller point size = better fillrate
<ParticleMorphText pointSize={1.0} />

// Longer settle time = smoother but slower
<ParticleMorphText settleTime={5} />
```

## Text Changing Behavior

When text changes:
1. **Entropy resets** to 1.0 (chaos)
2. Particles **abandon old positions**
3. **New target positions** calculated from new text
4. Particles **flow chaotically** toward new targets
5. **Entropy cools** and particles settle into new formation

This creates a **smooth morphing effect** between different status messages.

## Curl Noise Flow Fields

The chaotic motion uses **curl noise** - a divergence-free vector field that creates flowing, swirling motion:

```glsl
vec2 curl(vec2 p) {
  float e = 0.08;

  // Sample noise at 4 points around p
  float n1 = vnoise(p + vec2(0.0, e));
  float n2 = vnoise(p - vec2(0.0, e));
  float n3 = vnoise(p + vec2(e, 0.0));
  float n4 = vnoise(p - vec2(e, 0.0));

  // Compute gradient and rotate 90°
  float dy = (n1 - n2) / (2.0 * e);
  float dx = (n3 - n4) / (2.0 * e);

  return vec2(dy, -dx); // Perpendicular to gradient
}
```

This creates **smooth vortex-like motion** without particles clumping or diverging.

## Rainbow Colors

Particles are colored based on their horizontal position in the text:

```typescript
const hue = (x / width) * 360;
const rgb = hslToRgb(hue, 0.85, 0.65);
```

Result: **Rainbow gradient** across the text (left = red, center = green, right = blue)

## Integration with Brand System

While the particle colors use rainbow by default, you can override them:

```tsx
// Use brand primary color (coral)
<ParticleMorphText
  text="DOWNLOADING..."
  background={[
    0.02, // R - from --surface-0
    0.02, // G
    0.035, // B - slightly blue tint
    1.0   // A
  ]}
/>
```

## Try It Out

Navigate to `/automation/test-shader` and select **🌟 Entropy Morph** to see it in action!

Watch particles:
1. Start in **chaotic swirling motion**
2. Gradually **converge** into text
3. **Reset to chaos** when you change the message
4. **Morph** into the new text formation

---

**This is the effect we'll use in the progress monitor!** Status messages will appear through elegant particle morphing instead of boring text updates. 🌊✨
