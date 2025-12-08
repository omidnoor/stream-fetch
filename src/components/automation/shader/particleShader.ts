/**
 * Particle Text WebGL Shader
 * Renders colorful particles that form text with physics-based animation
 */

export const PARTICLE_VERTEX_SHADER = `
attribute vec2 aTargetPosition;  // Where particle should be
attribute vec3 aColor;             // Particle color
attribute vec2 aRandomSeed;        // Random values for each particle

uniform float uTime;
uniform float uProgress;           // 0-1, transition progress to target
uniform vec2 uResolution;

varying vec3 vColor;
varying float vAlpha;

// Simple random function
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

void main() {
    // Starting position (random, above screen)
    vec2 startPos = vec2(
        aRandomSeed.x * 2.0 - 1.0,
        1.5 + aRandomSeed.y * 0.5
    );

    // Add swirling motion during transition
    float swirl = sin(uTime * 2.0 + aRandomSeed.x * 6.28) * (1.0 - uProgress) * 0.3;
    float swirlX = cos(uTime * 1.5 + aRandomSeed.y * 6.28) * swirl;
    float swirlY = sin(uTime * 1.5 + aRandomSeed.y * 6.28) * swirl * 0.5;

    // Bounce easing
    float bounce = uProgress;
    if (uProgress > 0.7) {
        float t = (uProgress - 0.7) / 0.3;
        bounce = 0.7 + 0.3 * (1.0 - abs(sin(t * 3.14159 * 2.0)) * 0.2);
    }

    // Interpolate from start to target
    vec2 position = mix(startPos, aTargetPosition, bounce);
    position.x += swirlX;
    position.y += swirlY;

    // Add subtle continuous float
    position.y += sin(uTime * 0.5 + aRandomSeed.x * 10.0) * 0.01 * uProgress;
    position.x += cos(uTime * 0.7 + aRandomSeed.y * 10.0) * 0.01 * uProgress;

    gl_Position = vec4(position, 0.0, 1.0);

    // Point size (larger when settling)
    float size = mix(8.0, 3.0, uProgress);
    gl_PointSize = size;

    // Color with glow when moving
    vColor = aColor;
    vAlpha = mix(0.8, 1.0, uProgress);
}
`;

export const PARTICLE_FRAGMENT_SHADER = `
precision mediump float;

varying vec3 vColor;
varying float vAlpha;

void main() {
    // Circular particle shape
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);

    if (dist > 0.5) {
        discard;
    }

    // Soft edges with glow
    float alpha = smoothstep(0.5, 0.2, dist) * vAlpha;

    // Add glow
    float glow = smoothstep(0.5, 0.0, dist);

    vec3 color = vColor + vec3(glow * 0.3);

    gl_FragColor = vec4(color, alpha);
}
`;
