/**
 * Particle Text System
 * Converts text to particle positions for kinetic typography effects
 */

export interface ParticleData {
  positions: Float32Array;  // x, y for each particle
  colors: Float32Array;     // r, g, b for each particle
  count: number;
}

/**
 * Convert text to particle positions using canvas rendering
 */
export function textToParticles(
  text: string,
  width: number,
  height: number,
  particleDensity: number = 2 // pixels between particles
): ParticleData {
  // Create offscreen canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    return { positions: new Float32Array(0), colors: new Float32Array(0), count: 0 };
  }

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Set text style
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Calculate font size to fit
  const maxFontSize = Math.min(width / text.length * 1.5, height * 0.5);
  ctx.font = `bold ${maxFontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;

  // Draw text
  ctx.fillText(text, width / 2, height / 2);

  // Get pixel data
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;

  // Extract particle positions from non-transparent pixels
  const positions: number[] = [];
  const colors: number[] = [];

  for (let y = 0; y < height; y += particleDensity) {
    for (let x = 0; x < width; x += particleDensity) {
      const i = (y * width + x) * 4;
      const alpha = pixels[i + 3];

      if (alpha > 128) { // If pixel is visible
        // Normalize to -1 to 1 range
        const nx = (x / width) * 2 - 1;
        const ny = -(y / height) * 2 + 1; // Flip Y

        positions.push(nx, ny);

        // Generate color based on position (rainbow effect)
        const hue = (x / width) * 360;
        const rgb = hslToRgb(hue, 0.8, 0.6);
        colors.push(rgb.r, rgb.g, rgb.b);
      }
    }
  }

  return {
    positions: new Float32Array(positions),
    colors: new Float32Array(colors),
    count: positions.length / 2,
  };
}

/**
 * HSL to RGB conversion for colorful particles
 */
function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h = h / 360;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  const r = hueToRgb(p, q, h + 1/3);
  const g = hueToRgb(p, q, h);
  const b = hueToRgb(p, q, h - 1/3);

  return { r, g, b };
}

function hueToRgb(p: number, q: number, t: number): number {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1/6) return p + (q - p) * 6 * t;
  if (t < 1/2) return q;
  if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
  return p;
}

/**
 * Get brand color for particle based on context
 */
export function getBrandParticleColors(type: 'primary' | 'success' | 'warning' | 'info'): { r: number; g: number; b: number } {
  switch (type) {
    case 'primary':
      return { r: 1.0, g: 0.44, b: 0.27 }; // Coral
    case 'success':
      return { r: 0.28, g: 0.87, b: 0.53 }; // Green
    case 'warning':
      return { r: 1.0, g: 0.65, b: 0.0 }; // Amber
    case 'info':
      return { r: 0.13, g: 0.66, b: 0.87 }; // Blue
    default:
      return { r: 1.0, g: 1.0, b: 1.0 }; // White
  }
}
