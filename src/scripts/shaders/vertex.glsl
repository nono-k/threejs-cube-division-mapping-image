precision mediump float;

attribute float aTexIndex;

varying float vTexIndex;
varying vec2 vUv;

uniform float uActiveTex;
uniform float uProgress;

void main() {
  vUv = uv;
  vTexIndex = aTexIndex;

  vec3 pos = position;

  float isActive = step(0.1, 1.0 - abs(aTexIndex - uActiveTex));
  pos += normal * isActive * uProgress * 0.15;

  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
}