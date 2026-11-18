// WebGL2 post-processing over the Canvas 2D scene: a slowly living neural
// background, real bloom from a dual-filter blur chain, and a gentle tone map.
// The 2D renderer keeps drawing exactly what it draws today; this only takes
// its frame as a texture. If WebGL2 is missing or the context is lost, the
// board shows the 2D canvas as before.

const VERT = `#version 300 es
out vec2 vUv;
void main() {
  // One triangle that covers the screen
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

// Keeps only what glows: soft knee above the threshold
const PREFILTER = `#version 300 es
precision mediump float;
in vec2 vUv;
uniform sampler2D uSrc;
uniform float uThreshold;
out vec4 o;
void main() {
  vec3 c = texture(uSrc, vUv).rgb;
  float b = max(c.r, max(c.g, c.b));
  float knee = uThreshold * 0.5;
  float soft = clamp(b - uThreshold + knee, 0.0, 2.0 * knee);
  soft = soft * soft / (4.0 * knee + 1e-4);
  float w = max(soft, b - uThreshold) / max(b, 1e-4);
  o = vec4(c * w, 1.0);
}`;

// Dual-filter (Kawase) down and up samples: wide, smooth blur in few taps
const DOWN = `#version 300 es
precision mediump float;
in vec2 vUv;
uniform sampler2D uSrc;
uniform vec2 uTexel;
out vec4 o;
void main() {
  vec2 h = uTexel * 0.5;
  vec3 s = texture(uSrc, vUv).rgb * 4.0;
  s += texture(uSrc, vUv - h).rgb;
  s += texture(uSrc, vUv + h).rgb;
  s += texture(uSrc, vUv + vec2(h.x, -h.y)).rgb;
  s += texture(uSrc, vUv - vec2(h.x, -h.y)).rgb;
  o = vec4(s / 8.0, 1.0);
}`;

const UP = `#version 300 es
precision mediump float;
in vec2 vUv;
uniform sampler2D uSrc;
uniform vec2 uTexel;
out vec4 o;
void main() {
  vec2 h = uTexel * 0.5;
  vec3 s = texture(uSrc, vUv + vec2(-h.x * 2.0, 0.0)).rgb;
  s += texture(uSrc, vUv + vec2(-h.x, h.y)).rgb * 2.0;
  s += texture(uSrc, vUv + vec2(0.0, h.y * 2.0)).rgb;
  s += texture(uSrc, vUv + vec2(h.x, h.y)).rgb * 2.0;
  s += texture(uSrc, vUv + vec2(h.x * 2.0, 0.0)).rgb;
  s += texture(uSrc, vUv + vec2(h.x, -h.y)).rgb * 2.0;
  s += texture(uSrc, vUv + vec2(0.0, -h.y * 2.0)).rgb;
  s += texture(uSrc, vUv + vec2(-h.x, -h.y)).rgb * 2.0;
  o = vec4(s / 12.0, 1.0);
}`;

// Background (faint drifting filaments, like neural tissue far behind the
// mind), the scene over it, then the bloom added on top
const COMPOSITE = `#version 300 es
precision mediump float;
in vec2 vUv;
uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform float uTime;
uniform float uBloomStrength;
uniform float uAspect;
uniform float uLife; // 0..1, how full the mind is: the background wakes with it
out vec4 o;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + 17.0; a *= 0.5; }
  return v;
}
// Thin bright lines where the noise field crosses its middle
float filaments(vec2 p, float width) {
  float n = fbm(p);
  return smoothstep(width, 0.0, abs(n - 0.5));
}

void main() {
  vec2 p = vec2(vUv.x * uAspect, vUv.y);
  float t = uTime * 0.001;
  // Two layers drifting at different speeds give a little depth
  float far = filaments(p * 2.2 + vec2(t * 0.006, t * 0.004), 0.025);
  float near = filaments(p * 4.0 - vec2(t * 0.011, -t * 0.007) + 9.0, 0.018);
  float haze = fbm(p * 1.3 + t * 0.003);
  vec2 c = vUv - 0.5;
  float vignette = smoothstep(0.85, 0.15, dot(c, c) * 2.2);
  vec3 tint = mix(vec3(0.09, 0.16, 0.22), vec3(0.18, 0.10, 0.24), haze);
  float glow = (0.35 + 0.65 * uLife) * vignette;
  vec3 bg = vec3(0.0196) + tint * (far * 0.22 + near * 0.13 + haze * 0.05) * glow;

  vec4 scene = texture(uScene, vUv); // premultiplied
  vec3 bloom = texture(uBloom, vUv).rgb * uBloomStrength;
  vec3 col = bg * (1.0 - scene.a) + scene.rgb + bloom;
  // Soft shoulder on brightness only, so stacked glow rolls off without
  // washing the archetype colours out to white
  float l = max(col.r, max(col.g, col.b));
  float shoulder = l > 0.8 ? 0.8 + (l - 0.8) / (1.0 + (l - 0.8) * 2.5) : l;
  col *= shoulder / max(l, 1e-4);
  o = vec4(col, 1.0);
}`;

export interface GlowOptions {
  time: number; // ms
  life: number; // 0..1
  strength?: number;
}

export interface GlowRenderer {
  render: (source: HTMLCanvasElement, options: GlowOptions) => void;
  resize: (width: number, height: number) => void;
  dispose: () => void;
}

const LEVELS = 5;

export const createGlow = (canvas: HTMLCanvasElement): GlowRenderer | null => {
  const gl = canvas.getContext('webgl2', {
    alpha: false,
    antialias: false,
    depth: false,
    premultipliedAlpha: true,
    // A copy for the PNG portrait export
    preserveDrawingBuffer: false,
  });
  if (!gl) return null;
  const halfFloat = !!gl.getExtension('EXT_color_buffer_float');

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? '');
    return s;
  };
  const program = (frag: string) => {
    const p = gl.createProgram()!;
    gl.attachShader(p, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, frag));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? '');
    const uniforms = new Map<string, WebGLUniformLocation | null>();
    return {
      p,
      u: (name: string) => {
        if (!uniforms.has(name)) uniforms.set(name, gl.getUniformLocation(p, name));
        return uniforms.get(name)!;
      },
    };
  };

  let programs: Record<'pre' | 'down' | 'up' | 'comp', ReturnType<typeof program>>;
  try {
    programs = {
      pre: program(PREFILTER),
      down: program(DOWN),
      up: program(UP),
      comp: program(COMPOSITE),
    };
  } catch {
    return null;
  }

  const vao = gl.createVertexArray();
  const texture = () => {
    const t = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  };
  const scene = texture();
  interface Target {
    tex: WebGLTexture;
    fbo: WebGLFramebuffer;
    w: number;
    h: number;
  }
  let chain: Target[] = [];

  const makeTarget = (w: number, h: number): Target => {
    const tex = texture();
    if (halfFloat)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    const fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return { tex, fbo, w, h };
  };

  const resize = (width: number, height: number) => {
    canvas.width = width;
    canvas.height = height;
    for (const t of chain) {
      gl.deleteTexture(t.tex);
      gl.deleteFramebuffer(t.fbo);
    }
    // Bloom starts at half resolution and halves at every level
    chain = [];
    let w = Math.max(1, width >> 1);
    let h = Math.max(1, height >> 1);
    for (let i = 0; i < LEVELS; i++) {
      chain.push(makeTarget(w, h));
      w = Math.max(1, w >> 1);
      h = Math.max(1, h >> 1);
    }
  };

  const draw = (target: Target | null, prog: ReturnType<typeof program>) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.fbo : null);
    gl.viewport(0, 0, target ? target.w : canvas.width, target ? target.h : canvas.height);
    gl.useProgram(prog.p);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  const bind = (unit: number, tex: WebGLTexture) => {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
  };

  const render = (source: HTMLCanvasElement, { time, life, strength = 0.6 }: GlowOptions) => {
    if (gl.isContextLost() || chain.length === 0) return;
    gl.bindVertexArray(vao);
    gl.disable(gl.BLEND);

    // The 2D canvas is transparent over the page background: keep it premultiplied
    bind(0, scene);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);

    // Bright parts, down the chain, then back up adding each level
    const { pre, down, up, comp } = programs;
    gl.useProgram(pre.p);
    gl.uniform1i(pre.u('uSrc'), 0);
    gl.uniform1f(pre.u('uThreshold'), 0.45);
    draw(chain[0], pre);
    for (let i = 1; i < chain.length; i++) {
      bind(0, chain[i - 1].tex);
      gl.useProgram(down.p);
      gl.uniform1i(down.u('uSrc'), 0);
      gl.uniform2f(down.u('uTexel'), 1 / chain[i - 1].w, 1 / chain[i - 1].h);
      draw(chain[i], down);
    }
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    for (let i = chain.length - 1; i > 0; i--) {
      bind(0, chain[i].tex);
      gl.useProgram(up.p);
      gl.uniform1i(up.u('uSrc'), 0);
      gl.uniform2f(up.u('uTexel'), 1 / chain[i].w, 1 / chain[i].h);
      draw(chain[i - 1], up);
    }
    gl.disable(gl.BLEND);

    bind(0, scene);
    bind(1, chain[0].tex);
    gl.useProgram(comp.p);
    gl.uniform1i(comp.u('uScene'), 0);
    gl.uniform1i(comp.u('uBloom'), 1);
    gl.uniform1f(comp.u('uTime'), time);
    gl.uniform1f(comp.u('uBloomStrength'), strength);
    gl.uniform1f(comp.u('uAspect'), canvas.width / Math.max(1, canvas.height));
    gl.uniform1f(comp.u('uLife'), Math.max(0, Math.min(1, life)));
    draw(null, comp);
  };

  const dispose = () => {
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  };

  return { render, resize, dispose };
};
