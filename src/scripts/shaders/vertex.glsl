precision mediump float;

attribute float aTexIndex;

varying float vTexIndex;
varying vec2 vUv;

void main() {
  vUv = uv;
  vTexIndex = aTexIndex;

  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
}