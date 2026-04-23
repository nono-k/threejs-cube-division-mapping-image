precision mediump float;

varying vec2 vUv;
varying float vTexIndex;

uniform sampler2D uTextures[6];
uniform float uActiveTex;

void main() {
  vec2 uv = vUv;
  int id = int(vTexIndex);

  vec4 color;

  if (id == 0) color = texture2D(uTextures[0], vUv);
  else if (id == 1) color = texture2D(uTextures[1], vUv);
  else if (id == 2) color = texture2D(uTextures[2], vUv);
  else if (id == 3) color = texture2D(uTextures[3], vUv);
  else if (id == 4) color = texture2D(uTextures[4], vUv);
  else color = texture2D(uTextures[5], vUv);

  if (uActiveTex >= 0.0 && abs(vTexIndex - uActiveTex) > 0.1) {
    discard;
  }

  gl_FragColor = color;
}