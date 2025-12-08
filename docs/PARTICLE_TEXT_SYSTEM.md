# Particle Text System

## Overview

A WebGL-based kinetic typography system where colorful particles drop, swirl, and arrange themselves to form text. Perfect for showing dynamic status messages in the progress monitor.

## Features

✨ **Colorful Particles** - Rainbow gradient based on particle position
🎯 **Target Formation** - Particles snap into text shapes
💫 **Smooth Animation** - Bounce and settling physics
🌊 **Continuous Motion** - Subtle floating even when settled
🔄 **Dynamic Updates** - Text changes trigger particle rearrangement

## Usage

### Basic Example

```tsx
import { ParticleText } from '@/components/automation/shader';

function StatusDisplay() {
  const [status, setStatus] = useState('DOWNLOADING...');

  return (
    <ParticleText
      text={status}
      particleDensity={2}
      transitionDuration={2000}
    />
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `text` | `string` | - | Text to display (uppercase recommended) |
| `particleDensity` | `number` | `2` | Pixels between particles (2-4 recommended) |
| `transitionDuration` | `number` | `2000` | Animation duration in milliseconds |
| `className` | `string` | `''` | Additional CSS classes |

### In Progress Monitor

```tsx
function ProgressMonitor({ stage, progress }) {
  const statusText = {
    download: `DOWNLOADING: ${progress}%`,
    chunk: `CHUNKING: ${chunksDone}/${totalChunks}`,
    dub: `DUBBING CHUNK ${currentChunk}`,
    merge: `MERGING FILES`,
    finalize: `FINALIZING`,
  }[stage];

  return (
    <div className="relative rounded-lg bg-surface-1 p-8">
      <ParticleText
        text={statusText}
        particleDensity={2}
        transitionDuration={1500}
      />
    </div>
  );
}
```

## How It Works

### 1. Text to Particles Conversion

```typescript
// Render text to canvas
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
ctx.fillText(text, x, y);

// Sample pixels and create particles
const imageData = ctx.getImageData(0, 0, width, height);
// Extract non-transparent pixels → particle positions
```

### 2. Particle Animation (Vertex Shader)

```glsl
// Start position (random, above screen)
vec2 startPos = vec2(random.x * 2.0 - 1.0, 1.5);

// Add swirling motion during transition
float swirl = sin(time + random) * (1.0 - progress);

// Interpolate to target with bounce
vec2 position = mix(startPos, targetPosition, progress);
```

### 3. Rendering (Fragment Shader)

```glsl
// Circular particle with soft edges
float dist = length(gl_PointCoord - 0.5);
float alpha = smoothstep(0.5, 0.2, dist);

// Add glow
vec3 color = particleColor + glow;
```

## Animation Phases

### Phase 1: Entry (0-70%)
- Particles fall from above
- Swirl and move toward targets
- Larger particle size

### Phase 2: Bounce (70-100%)
- Particles bounce slightly when settling
- Size decreases to final
- Swirl motion dampens

### Phase 3: Settled (100%)
- Particles at target positions
- Subtle floating motion
- Final size and brightness

## Performance

### Optimizations
- ✅ Canvas created once, reused for text rendering
- ✅ WebGL buffers updated only when text changes
- ✅ Vertex shader handles all physics
- ✅ Particle count controlled by `particleDensity`

### Typical Performance
- **Particles**: 500-2000 (depending on text length)
- **FPS**: Solid 60fps on modern hardware
- **Memory**: ~5-10MB per instance

### Performance Tuning

```tsx
// Fewer particles = better performance
<ParticleText
  text="HELLO"
  particleDensity={3}  // 3-4 for lower-end devices
/>

// More particles = higher quality
<ParticleText
  text="HELLO"
  particleDensity={1}  // 1-2 for high-end devices
/>
```

## Color System

### Rainbow Mode (Default)
Particles get colors based on horizontal position:
```typescript
const hue = (x / width) * 360;
const rgb = hslToRgb(hue, 0.8, 0.6);
```

### Brand Colors (Optional)
Use brand colors for specific contexts:
```typescript
import { getBrandParticleColors } from '@/components/automation/shader';

const successColor = getBrandParticleColors('success');
// { r: 0.28, g: 0.87, b: 0.53 }
```

## Best Practices

### Text Content
- ✅ Use SHORT text (1-20 characters)
- ✅ UPPERCASE looks better
- ✅ Avoid special characters
- ✅ Numbers and letters work great
- ❌ Don't use very long text

### Transition Duration
- **Fast** (1000ms): Quick status updates
- **Medium** (2000ms): Normal transitions
- **Slow** (3000ms): Dramatic reveals

### Update Frequency
```tsx
// ✅ Good - Updates every 2-3 seconds
useEffect(() => {
  const interval = setInterval(() => {
    setStatus(getNewStatus());
  }, 2000);
  return () => clearInterval(interval);
}, []);

// ❌ Bad - Too frequent, particles never settle
useEffect(() => {
  const interval = setInterval(() => {
    setStatus(getNewStatus());
  }, 100); // TOO FAST
}, []);
```

## Integration with Progress Monitor

```tsx
// In the progress monitor window
<div className="relative rounded-lg overflow-hidden bg-gradient-to-br from-surface-1 to-surface-2">
  {/* Background shader (subtle) */}
  <ShaderCanvas
    shaderType="perlinNoise"
    className="absolute inset-0 -z-10 opacity-50"
  />

  {/* Particle text (main focus) */}
  <div className="relative z-10 p-8">
    <ParticleText
      text={currentStatus}
      transitionDuration={1500}
    />
  </div>

  {/* Other content below */}
  <div className="p-6">
    {/* Progress bars, stats, etc. */}
  </div>
</div>
```

## Files

```
src/
├── components/automation/shader/
│   ├── ParticleText.tsx          # React component
│   ├── particleText.ts           # Text-to-particles converter
│   └── particleShader.ts         # GLSL shaders
├── hooks/
│   └── useParticleText.ts        # WebGL particle hook
└── app/(pages)/automation/test-shader/
    └── page.tsx                  # Live demo
```

## Try It Out

Navigate to `/automation/test-shader` and select **⭐ Particle Text** to see it in action!

---

**Pro Tip**: Watch the particles as you click the quick status messages - they'll explode and reform into the new text! 🎉
