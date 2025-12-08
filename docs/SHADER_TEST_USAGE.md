# WebGL Shader Test Page

## Access
Navigate to: `/automation/test-shader`

## Purpose
Test and preview WebGL/GLSL shader effects before integrating them into the progress monitor.

## Features

### Available Shaders
1. **Holographic Grid** - Animated perspective grid with glow effect
2. **Data Stream** - Matrix-style vertical data flow
3. **Energy Flow** - Flowing particle progress bar animation
4. **Scan Line** - CRT monitor scan effect
5. **Perlin Noise** - Animated depth background

### Controls
- **Progress Slider**: Controls the progress value (0-100%) for shaders that use it
- **Activity Level**: Controls animation intensity (0-2x speed)

## Memory Leak Prevention

### ✅ Canvas Creation
- Canvas element created **once** via `useRef`
- Reused across shader switches
- No DOM thrashing

### ✅ WebGL Context Management
```typescript
// Proper cleanup on unmount
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
  };
}, []);
```

### ✅ Animation Frame Cleanup
```typescript
// RAF properly cancelled
useEffect(() => {
  let animationId: number;

  const render = () => {
    // ... render code
    animationId = requestAnimationFrame(render);
  };

  render();

  return () => {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
  };
}, []);
```

### ✅ Uniform Location Caching
- Uniform locations cached in `Map` on initialization
- Prevents repeated `getUniformLocation` calls
- Improves performance

### ✅ Optimized Rendering
- `antialias: false` for better performance
- `depth: false`, `stencil: false` - unnecessary features disabled
- `preserveDrawingBuffer: false` - saves memory
- Configurable `pixelRatio` for performance tuning

## Performance Tips

### Browser DevTools
1. Open Chrome DevTools → Performance tab
2. Start recording
3. Switch between shaders
4. Stop recording
5. Check for:
   - Memory usage stays constant
   - No memory leaks in heap snapshots
   - FPS stays consistent

### Memory Profiling
1. DevTools → Memory tab
2. Take heap snapshot before shader load
3. Switch shaders multiple times
4. Take another heap snapshot
5. Compare - should show minimal retention

### Expected Performance
- **FPS**: Solid 60fps on modern hardware
- **Memory**: Stable, no growth over time
- **CPU**: Low usage when tab not focused (RAF auto-throttles)

## Layer Management

### CSS Z-Index Strategy
```tsx
<div className="relative">
  {/* Background shader - lowest layer */}
  <canvas className="absolute inset-0 -z-10" />

  {/* Content - above shader */}
  <div className="relative z-10">
    {/* Your content here */}
  </div>
</div>
```

### Proper Layering
- Shader canvas: `absolute inset-0` (fills container)
- Parent container: `relative` (establishes positioning context)
- Content overlay: `relative z-10` (sits above shader)

## Integration Example

```tsx
import { ShaderCanvas } from '@/components/automation/shader';

function ProgressMonitor() {
  const [progress, setProgress] = useState(0.5);

  return (
    <div className="relative rounded-lg overflow-hidden">
      {/* Background shader */}
      <ShaderCanvas
        shaderType="perlinNoise"
        className="absolute inset-0 -z-10"
      />

      {/* Content */}
      <div className="relative z-10 p-6">
        <h2>Pipeline Progress</h2>

        {/* Progress bar with shader */}
        <div className="relative h-8 rounded-lg overflow-hidden">
          <ShaderCanvas
            shaderType="energyFlow"
            progress={progress}
            className="absolute inset-0"
          />
        </div>
      </div>
    </div>
  );
}
```

## Files Created

```
src/
├── app/(pages)/automation/test-shader/
│   └── page.tsx                     # Test page
├── hooks/
│   └── useWebGLShader.ts            # WebGL hook with cleanup
├── components/automation/shader/
│   ├── ShaderCanvas.tsx             # Canvas component
│   ├── shaders.ts                   # GLSL fragment shaders
│   └── index.ts                     # Exports
└── app/globals.css                  # Added animations
```

## Troubleshooting

### Shader Not Rendering
- Check browser WebGL support: `chrome://gpu`
- Check console for shader compilation errors
- Verify GLSL syntax (precision qualifiers required)

### Performance Issues
- Lower `pixelRatio` to 0.5 or 0.75
- Simplify fragment shader (reduce loops)
- Disable complex effects on lower-end devices

### Memory Growing
- Ensure component unmounts properly
- Check DevTools Performance → Memory
- Verify RAF is cancelled in cleanup

## Next Steps

1. Test each shader thoroughly
2. Measure performance on target devices
3. Choose shaders for different monitor sections
4. Integrate into actual progress monitor
5. Add device-based quality settings
