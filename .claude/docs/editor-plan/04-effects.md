# Phase 4: Effects & Filters

## Goal
Apply visual effects to clips.

## Backend

### Types
```ts
Effect {
  id, clipId, type: EffectType,
  params: Record<string, number>,
  enabled: boolean
}

EffectType = 'brightness'|'contrast'|'saturation'|'blur'|'sharpen'
           |'grayscale'|'sepia'|'vignette'|'colorBalance'
```

### Services
- `EffectService.apply(clipId, effect)` - Add effect
- `EffectService.update(effectId, params)` - Modify
- `EffectService.remove(effectId)` - Remove
- FFmpeg filter chain builder

### API Routes
- `POST /api/editor/project/[id]/clip/[clipId]/effect`
- `PUT /api/editor/project/[id]/effect/[effectId]`
- `DELETE /api/editor/project/[id]/effect/[effectId]`

## Frontend

### Components
| Component | Purpose |
|-----------|---------|
| `EffectsPanel` | Effect list & controls |
| `EffectSlider` | Parameter adjustment |
| `EffectPreview` | Real-time CSS preview |
| `EffectPresets` | Quick apply presets |

### CSS Preview Filters
```css
/* Real-time preview without FFmpeg */
filter: brightness(1.2) contrast(1.1) saturate(1.3);
```

### Hooks
- `useEffects(clipId)` - Effect state
- `useEffectPreview()` - CSS filter string

## FFmpeg Mapping
| Effect | FFmpeg Filter |
|--------|---------------|
| brightness | `eq=brightness=0.1` |
| contrast | `eq=contrast=1.2` |
| saturation | `eq=saturation=1.5` |
| blur | `boxblur=5:1` |
| grayscale | `colorchannelmixer=.3:.4:.3:0:.3:.4:.3:0:.3:.4:.3` |
| sepia | `colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131` |

## Presets
- Cinematic (contrast+saturation+vignette)
- Vintage (sepia+vignette+lower saturation)
- Black & White (grayscale+contrast)
