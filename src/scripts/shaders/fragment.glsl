precision mediump float;

varying vec2 vUv;
varying float vTexIndex;

uniform sampler2D uTextures[6];
uniform float uActiveTex;
uniform float uProgress;

vec4 getTex(int id, vec2 uv) {
  if (id == 0) return texture2D(uTextures[0], uv);
  if (id == 1) return texture2D(uTextures[1], uv);
  if (id == 2) return texture2D(uTextures[2], uv);
  if (id == 3) return texture2D(uTextures[3], uv);
  if (id == 4) return texture2D(uTextures[4], uv);
  return texture2D(uTextures[5], uv);
}

void main() {
  vec2 uv = vUv;
  int id = int(vTexIndex);
  vec4 base = getTex(id, uv);

  float isActive = step(0.1, 1.0 - abs(vTexIndex - uActiveTex));

  // 非アクティブ側の強さ（progressに応じて強まる）
  float dim = (1.0 - isActive) * uProgress;

  // 黒を被せる（0.0〜0.8くらいで調整）
  float overlayStrength = 0.85 * dim;
  vec3 color = mix(base.rgb, vec3(0.0), overlayStrength);

  // 透明度も少し落とす（0.4〜0.8くらいで調整）
  float alpha = mix(base.a, base.a * 0.4, dim);

  gl_FragColor = vec4(color, alpha);
}