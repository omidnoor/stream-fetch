/**
 * GLSL Fragment Shaders for Progress Monitor
 * All shaders use brand colors from design system
 */

export const GRID_SHADER = `
precision mediump float;

uniform float time;
uniform vec2 resolution;
uniform float progress;

void main() {
    vec2 uv = gl_FragCoord.xy / resolution;

    // Create perspective effect
    float perspective = 1.0 - uv.y * 0.5;

    // Animated grid lines
    float gridSize = 20.0 * perspective;
    vec2 grid = fract(uv * gridSize + vec2(time * 0.1, -time * 0.1));

    float lineWidth = 0.05;
    float gridLines = step(1.0 - lineWidth, grid.x) + step(1.0 - lineWidth, grid.y);
    gridLines = min(gridLines, 1.0);

    // Color gradient (coral to amber from brand system)
    vec3 color1 = vec3(1.0, 0.44, 0.27);  // --primary (coral)
    vec3 color2 = vec3(1.0, 0.65, 0.0);   // --accent (amber)
    vec3 baseColor = mix(color1, color2, progress);

    // Add glow and fade based on distance
    float distFromCenter = length(uv - 0.5);
    float glow = smoothstep(0.6, 0.0, distFromCenter);

    // Final color
    vec3 finalColor = baseColor * gridLines * (0.5 + glow * 0.5);
    float alpha = gridLines * (0.2 + glow * 0.3);

    gl_FragColor = vec4(finalColor, alpha);
}
`;

export const DATA_STREAM_SHADER = `
precision mediump float;

uniform float time;
uniform vec2 resolution;
uniform float activity;

// Random function
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
    vec2 uv = gl_FragCoord.xy / resolution;

    // Create columns
    float columns = 40.0;
    float col = floor(uv.x * columns);

    // Each column has different speed
    float speed = random(vec2(col, 0.0)) * 1.5 + 0.5;
    float yOffset = fract(time * speed * activity);

    // Create stream effect
    float stream = fract(uv.y + yOffset);

    // Digital characters (random blocks)
    float charRow = floor((uv.y + yOffset) * 30.0);
    float char = step(0.85, random(vec2(col, charRow)));

    // Fade at ends
    float fade = smoothstep(0.0, 0.2, stream) * smoothstep(1.0, 0.8, stream);

    // Success green color (from design system)
    vec3 color = vec3(0.28, 0.87, 0.53) * char * fade;

    // Add bright head
    float head = smoothstep(0.05, 0.0, stream);
    color += vec3(0.8, 1.0, 0.9) * head;

    float alpha = (char * fade + head) * 0.7;

    gl_FragColor = vec4(color, alpha);
}
`;

export const ENERGY_FLOW_SHADER = `
precision mediump float;

uniform float time;
uniform vec2 resolution;
uniform float progress;

// Simple noise
float noise(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
    vec2 uv = gl_FragCoord.xy / resolution;

    float particles = 0.0;
    float particleCount = 8.0;

    // Create flowing particles
    for(float i = 0.0; i < 8.0; i++) {
        if(i >= particleCount) break;

        float offset = fract(time * 0.4 + i / particleCount);
        float yJitter = (noise(vec2(i, time * 0.5)) - 0.5) * 0.1;

        vec2 particlePos = vec2(offset, 0.5 + yJitter);
        float dist = length(uv - particlePos);

        // Particle glow
        float particle = smoothstep(0.03, 0.0, dist);
        particles += particle;
    }

    // Only show in filled area
    float filled = step(uv.x, progress);
    particles *= filled;

    // Gradient color (coral to amber)
    vec3 color1 = vec3(1.0, 0.44, 0.27);
    vec3 color2 = vec3(1.0, 0.65, 0.0);
    vec3 baseColor = mix(color1, color2, uv.x);

    // Base bar color
    float bar = step(uv.y, 0.7) * step(0.3, uv.y) * filled;

    // Combine
    vec3 finalColor = baseColor * (bar * 0.4 + particles);
    float alpha = bar * 0.3 + particles * 0.8;

    gl_FragColor = vec4(finalColor, alpha);
}
`;

export const SCAN_LINE_SHADER = `
precision mediump float;

uniform float time;
uniform vec2 resolution;

void main() {
    vec2 uv = gl_FragCoord.xy / resolution;

    // Moving scan line
    float scanLine = fract(uv.y * 5.0 + time * 0.5);
    scanLine = smoothstep(0.4, 0.5, scanLine) * smoothstep(0.6, 0.5, scanLine);
    scanLine = pow(scanLine, 3.0);

    // Static horizontal lines
    float staticLines = sin(uv.y * resolution.y * 0.5) * 0.5 + 0.5;
    staticLines = pow(staticLines, 20.0) * 0.15;

    // Info blue color (from design system)
    vec3 color = vec3(0.13, 0.66, 0.87) * scanLine;

    float alpha = scanLine * 0.6 + staticLines;

    gl_FragColor = vec4(color, alpha);
}
`;

export const PERLIN_NOISE_SHADER = `
precision mediump float;

uniform float time;
uniform vec2 resolution;

// Simple 2D noise
float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    float a = fract(sin(dot(i, vec2(12.9898, 78.233))) * 43758.5453);
    float b = fract(sin(dot(i + vec2(1.0, 0.0), vec2(12.9898, 78.233))) * 43758.5453);
    float c = fract(sin(dot(i + vec2(0.0, 1.0), vec2(12.9898, 78.233))) * 43758.5453);
    float d = fract(sin(dot(i + vec2(1.0, 1.0), vec2(12.9898, 78.233))) * 43758.5453);

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main() {
    vec2 uv = gl_FragCoord.xy / resolution;

    // Layered noise with different frequencies
    float n = 0.0;
    n += noise(uv * 4.0 + time * 0.05) * 0.5;
    n += noise(uv * 8.0 - time * 0.08) * 0.25;
    n += noise(uv * 16.0 + time * 0.03) * 0.125;

    // Map to dark color range
    vec3 color1 = vec3(0.02, 0.02, 0.04);  // Very dark
    vec3 color2 = vec3(0.07, 0.07, 0.11);  // Slightly lighter

    vec3 color = mix(color1, color2, n);

    gl_FragColor = vec4(color, 1.0);
}
`;

export const SHADERS = {
  grid: GRID_SHADER,
  dataStream: DATA_STREAM_SHADER,
  energyFlow: ENERGY_FLOW_SHADER,
  scanLine: SCAN_LINE_SHADER,
  perlinNoise: PERLIN_NOISE_SHADER,
} as const;

export type ShaderType = keyof typeof SHADERS;
