/* Josh Freeman's VR World - walkable/flyable 3D world (concept rendering).
   Terrain: USGS 3DEP elevation (public domain). Imagery: USGS National Map orthoimagery (public domain).
   Fowling Pond Restoration Plan v6 features drawn approximately from the plan's concept maps.
   Buildings, plants and animals are procedural concept models. Not a survey or engineering design. */
(function () {
const W3D = window.W3D = {};
const BASE = '/vr/w3d/';
const N = 385, SIZE = 4096, HALF = 2048, WATER = 16.5;
const HQ = {x: 920, y: 34, z: -380};
let heights = null;
const floors = [];   // {x0,x1,z0,z1,y}
const walls = [];    // {x0,x1,z0,z1,y0,y1}
W3D.floors = floors; W3D.walls = walls;

function terrainH(x, z) {
  if (!heights) return 0;
  const fx = (x + HALF) / SIZE * (N - 1), fz = (z + HALF) / SIZE * (N - 1);
  const ix = Math.max(0, Math.min(N - 2, Math.floor(fx))), iz = Math.max(0, Math.min(N - 2, Math.floor(fz)));
  const tx = Math.min(1, Math.max(0, fx - ix)), tz = Math.min(1, Math.max(0, fz - iz));
  const a = heights[iz * N + ix], b = heights[iz * N + ix + 1], c = heights[(iz + 1) * N + ix], d = heights[(iz + 1) * N + ix + 1];
  // match the mesh triangulation (PlaneGeometry splits a-c-b / c-d-b)
  if (tx + tz <= 1) return a + (b - a) * tx + (c - a) * tz;
  return d + (c - d) * (1 - tx) + (b - d) * (1 - tz);
}
W3D.terrainH = terrainH;
function groundAt(x, z, y) {
  let g = terrainH(x, z);
  if (g < WATER - 0.2) g = WATER - 0.2; // walk on the pond surface rather than its bed
  const t0 = g; let u = null; // floors flagged under:true are below the terrain (bank vault) and only count when you are below ground
  for (const f of floors) if (x >= f.x0 && x <= f.x1 && z >= f.z0 && z <= f.z1 && f.y <= y + 0.65) { if (f.under) { if (y < t0 - 1 && (u === null || f.y > u)) u = f.y; } else if (f.y > g) g = f.y; }
  if (u !== null) g = u;
  return g;
}
W3D.groundAt = groundAt;
function blocked(x, z, y) {
  for (const w of walls) if (x > w.x0 - 0.3 && x < w.x1 + 0.3 && z > w.z0 - 0.3 && z < w.z1 + 0.3 && w.y1 > y + 0.35 && w.y0 < y + 1.7) return true;
  return false;
}
W3D.blocked = blocked;

/* ---------- procedural textures ---------- */
function hcanvas(S) { const c = canvas(S * 2, S * 2); c.getContext('2d').scale(2, 2); return c; } // 2048 px textures drawn in 1024 logical units
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function noiseFill(g, w, h, base, amp, n) {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let i = 0; i < n; i++) { const v = (Math.random() - 0.5) * amp; g.fillStyle = v > 0 ? 'rgba(255,255,255,' + v + ')' : 'rgba(0,0,0,' + (-v) + ')'; g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 3, 1 + Math.random() * 3); }
}
function tex(c, rep) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 16; if (rep) t.repeat.set(rep, rep); return t; }
function ashlarTex() { // freshly cut sandstone blocks, 4 m x 4 m tile
  const c = hcanvas(1024), g = c.getContext('2d'); noiseFill(g, 1024, 1024, '#e6cf9f', 0.05, 30000);
  g.strokeStyle = 'rgba(120,95,60,0.55)'; g.lineWidth = 2;
  for (let r = 0; r < 8; r++) { const y = r * 128; g.beginPath(); g.moveTo(0, y); g.lineTo(1024, y); g.stroke();
    const off = (r % 2) * 128; for (let x = off; x <= 1024; x += 256) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 128); g.stroke(); } }
  return tex(c);
}
function polishedTex(dark) { // honed granite / marble with gold inlay grid, 4 m tile
  const c = hcanvas(1024), g = c.getContext('2d');
  noiseFill(g, 1024, 1024, dark ? '#2b2a2e' : '#efe9de', dark ? 0.12 : 0.05, 60000);
  g.globalAlpha = 0.25; g.strokeStyle = dark ? '#77706a' : '#c9bfae'; g.lineWidth = 1.5;
  for (let i = 0; i < 40; i++) { g.beginPath(); let x = Math.random() * 1024, y = Math.random() * 1024; g.moveTo(x, y); for (let k = 0; k < 8; k++) { x += (Math.random() - 0.3) * 90; y += (Math.random() - 0.5) * 60; g.lineTo(x, y); } g.stroke(); }
  g.globalAlpha = 1; g.strokeStyle = '#c9a227'; g.lineWidth = 6; g.strokeRect(3, 3, 1018, 1018);
  g.lineWidth = 2; g.strokeRect(40, 40, 944, 944);
  return tex(c);
}
function officeFloorTex() { // single 20 m floor: white marble, gold-inlaid sun disk + lotus border
  const S = 2048, c = canvas(S, S), g = c.getContext('2d'); noiseFill(g, S, S, '#f2eee6', 0.04, 120000);
  g.globalAlpha = 0.18; g.strokeStyle = '#b9b0a2';
  for (let i = 0; i < 60; i++) { g.beginPath(); let x = Math.random() * S, y = Math.random() * S; g.moveTo(x, y); for (let k = 0; k < 10; k++) { x += (Math.random() - 0.3) * 150; y += (Math.random() - 0.5) * 100; g.lineTo(x, y); } g.stroke(); }
  g.globalAlpha = 1; g.strokeStyle = '#d4af37'; g.fillStyle = '#d4af37';
  g.lineWidth = 10; g.strokeRect(60, 60, S - 120, S - 120); g.lineWidth = 4; g.strokeRect(110, 110, S - 220, S - 220);
  for (let i = 0; i < 24; i++) for (const side of [0, 1, 2, 3]) { // lotus border
    const t = 160 + i * ((S - 320) / 23); let x, y; if (side === 0) { x = t; y = 85; } else if (side === 1) { x = t; y = S - 85; } else if (side === 2) { x = 85; y = t; } else { x = S - 85; y = t; }
    g.beginPath(); g.ellipse(x, y, 10, 10, 0, 0, Math.PI * 2); g.fill(); }
  const cx = S / 2; g.lineWidth = 8; g.beginPath(); g.arc(cx, cx, 300, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.arc(cx, cx, 120, 0, Math.PI * 2); g.fill();
  for (let i = 0; i < 32; i++) { const a = i / 32 * Math.PI * 2; g.beginPath(); g.moveTo(cx + Math.cos(a) * 140, cx + Math.sin(a) * 140); g.lineTo(cx + Math.cos(a) * 280, cx + Math.sin(a) * 280); g.lineWidth = i % 2 ? 3 : 7; g.stroke(); }
  g.fillStyle = '#1f4fa0'; g.beginPath(); g.arc(cx, cx, 60, 0, Math.PI * 2); g.fill();
  const t = tex(c); return t;
}
function starCeilingTex() {
  const S = 1024, c = hcanvas(S), g = c.getContext('2d'); g.fillStyle = '#14336e'; g.fillRect(0, 0, S, S);
  g.fillStyle = '#e8c255';
  for (let y = 32; y < S; y += 64) for (let x = 32 + ((y / 64) % 2) * 32; x < S; x += 64) star(g, x, y, 14);
  g.strokeStyle = '#d4af37'; g.lineWidth = 10; g.strokeRect(5, 5, S - 10, S - 10);
  return tex(c);
}
function star(g, x, y, r) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, rr = i % 2 ? r * 0.4 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill(); }
function reliefTex() { // crisp, freshly painted hieroglyph relief registers (stylised, not real text)
  const S = 1024, c = hcanvas(S), g = c.getContext('2d'); noiseFill(g, S, S, '#ecd8ab', 0.04, 20000);
  const col = ['#1f5fa8', '#b5342b', '#2e8b57', '#d9a520', '#222'];
  g.fillStyle = '#1f5fa8'; g.fillRect(0, 0, S, 26); g.fillStyle = '#d9a520'; g.fillRect(0, 26, S, 8); g.fillStyle = '#b5342b'; g.fillRect(0, S - 30, S, 30);
  for (let x = 0; x < S; x += 32) { g.fillStyle = ['#1f5fa8', '#2e8b57', '#b5342b'][(x / 32) % 3]; g.fillRect(x + 4, 36, 24, 14); }
  const glyphs = [ankh, eye, bird, sunG, water, reed, djed, scarab, feather];
  for (let colI = 0; colI < 16; colI++) {
    const x0 = colI * 64 + 8; g.strokeStyle = 'rgba(80,60,30,0.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(colI * 64, 60); g.lineTo(colI * 64, S - 34); g.stroke();
    for (let y = 70; y < S - 90; y += 62) { const f = glyphs[(colI * 7 + y) % glyphs.length]; g.save(); g.translate(x0 + 24, y + 26); f(g, col[(colI + y) % 5]); g.restore(); }
  }
  return tex(c);
}
function stroke(g, c) { g.strokeStyle = '#3a2a14'; g.lineWidth = 2; g.fillStyle = c; }
function ankh(g, c) { stroke(g, c); g.beginPath(); g.ellipse(0, -12, 7, 10, 0, 0, Math.PI * 2); g.lineWidth = 5; g.strokeStyle = c; g.stroke(); g.fillRect(-14, -2, 28, 5); g.fillRect(-3, -2, 6, 30); }
function eye(g, c) { stroke(g, '#fff'); g.beginPath(); g.ellipse(0, 0, 20, 9, 0, 0, Math.PI * 2); g.fill(); g.stroke(); g.fillStyle = '#111'; g.beginPath(); g.arc(0, 0, 6, 0, Math.PI * 2); g.fill(); g.strokeStyle = c; g.lineWidth = 3; g.beginPath(); g.moveTo(-6, 9); g.lineTo(-10, 22); g.moveTo(4, 9); g.quadraticCurveTo(16, 24, 22, 14); g.stroke(); }
function bird(g, c) { stroke(g, c); g.beginPath(); g.moveTo(-14, 18); g.quadraticCurveTo(-18, -4, 0, -10); g.lineTo(8, -20); g.lineTo(14, -14); g.lineTo(6, -6); g.quadraticCurveTo(16, 8, 4, 18); g.closePath(); g.fill(); g.stroke(); }
function sunG(g, c) { stroke(g, '#d9a520'); g.beginPath(); g.arc(0, 0, 14, 0, Math.PI * 2); g.fill(); g.stroke(); g.fillStyle = '#b5342b'; g.beginPath(); g.arc(0, 0, 6, 0, Math.PI * 2); g.fill(); }
function water(g, c) { g.strokeStyle = '#1f5fa8'; g.lineWidth = 3; for (let k = 0; k < 3; k++) { g.beginPath(); for (let i = -20; i <= 20; i += 5) g.lineTo(i, -10 + k * 10 + ((i / 5) % 2 ? -3 : 3)); g.stroke(); } }
function reed(g, c) { stroke(g, '#2e8b57'); g.beginPath(); g.moveTo(-3, 22); g.lineTo(-3, -8); g.quadraticCurveTo(10, -14, 3, -24); g.lineTo(3, 22); g.fill(); g.stroke(); }
function djed(g, c) { stroke(g, c); g.fillRect(-5, -20, 10, 42); g.strokeRect(-5, -20, 10, 42); for (let k = 0; k < 4; k++) g.fillRect(-12, -20 + k * 5, 24, 3); }
function scarab(g, c) { stroke(g, '#2e8b57'); g.beginPath(); g.ellipse(0, 4, 12, 15, 0, 0, Math.PI * 2); g.fill(); g.stroke(); g.beginPath(); g.arc(0, -14, 6, 0, Math.PI * 2); g.fill(); g.stroke(); }
function feather(g, c) { stroke(g, c); g.beginPath(); g.moveTo(0, 22); g.quadraticCurveTo(-10, -4, 0, -24); g.quadraticCurveTo(10, -4, 0, 22); g.fill(); g.stroke(); }
function detailTex() { // grass/soil micro-detail (grey around 0.5), tiles every few metres
  const S = 512, c = canvas(S, S), g = c.getContext('2d'), img = g.createImageData(S, S), A = new Float32Array(S * S), B = new Float32Array(S * S);
  for (let i = 0; i < S * S; i++) { A[i] = Math.random(); B[i] = Math.random(); }
  const blur = (a, r) => { const o = new Float32Array(S * S); for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { let s2 = 0; for (let k = -r; k <= r; k++) s2 += a[y * S + ((x + k + S) % S)]; o[y * S + x] = s2 / (2 * r + 1); }
    const o2 = new Float32Array(S * S); for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { let s2 = 0; for (let k = -r; k <= r; k++) s2 += o[((y + k + S) % S) * S + x]; o2[y * S + x] = s2 / (2 * r + 1); } return o2; };
  const A2 = blur(A, 1), B2 = blur(B, 6);
  for (let i = 0; i < S * S; i++) { const a = 0.5 + (A2[i] - 0.5) * 2.2 + (A[i] - 0.5) * 0.25, b = 0.5 + (B2[i] - 0.5) * 5.0; img.data[i * 4] = Math.max(0, Math.min(255, a * 255)); img.data[i * 4 + 1] = Math.max(0, Math.min(255, b * 255)); img.data[i * 4 + 2] = 128; img.data[i * 4 + 3] = 255; }
  g.putImageData(img, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 16; return t;
}
function grassTex() { // sharp repeating grass/soil: thousands of short blades over mottled soil, ~3 m tile
  const S = 1024, c = canvas(S, S), g = c.getContext('2d');
  g.fillStyle = '#6f7a45'; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 1400; i++) { const x = Math.random() * S, y = Math.random() * S, r = 6 + Math.random() * 30; g.fillStyle = Math.random() < 0.35 ? 'rgba(110,92,60,0.18)' : 'rgba(60,90,35,0.2)'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
  for (let i = 0; i < 26000; i++) {
    const x = Math.random() * S, y = Math.random() * S, l = 6 + Math.random() * 16, a = -Math.PI / 2 + (Math.random() - 0.5) * 1.3, h = 70 + Math.random() * 40, li = 22 + Math.random() * 30;
    g.strokeStyle = 'hsl(' + h + ',' + (35 + Math.random() * 30) + '%,' + li + '%)'; g.lineWidth = 1 + Math.random() * 1.6; g.beginPath();
    for (const dx of [0, -S, S]) for (const dy of [0, -S, S]) { g.moveTo(x + dx, y + dy); g.lineTo(x + dx + Math.cos(a) * l, y + dy + Math.sin(a) * l); }
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 16; t.colorSpace = THREE.SRGBColorSpace; return t;
}
function cofferTex() { // round coffered dome: rings of recessed coffers with gold rosettes, lapis star oculus at the crown
  const c = hcanvas(1024), g = c.getContext('2d'); noiseFill(g, 1024, 1024, '#e9d6ab', 0.04, 20000);
  g.fillStyle = '#163a7a'; g.fillRect(0, 0, 1024, 150); g.fillStyle = '#e8c255'; for (let x = 16; x < 1024; x += 42) star(g, x, 40 + (x % 84 ? 0 : 50), 10), star(g, x + 21, 105, 8);
  g.fillStyle = '#d4af37'; g.fillRect(0, 150, 1024, 14);
  const rows = 6, cols = 16, y0 = 170, rh = (1000 - y0) / rows;
  for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
    const w = 1024 / cols, x = k * w + w * 0.1, y = y0 + r * rh + rh * 0.1, cw = w * 0.8, ch = rh * 0.8;
    for (let st = 0; st < 3; st++) { const inset = st * Math.min(cw, ch) * 0.1; g.fillStyle = ['#bfa577', '#a88d60', '#8c7349'][st]; g.fillRect(x + inset, y + inset, cw - 2 * inset, ch - 2 * inset); }
    g.fillStyle = '#1f4fa0'; const ix = x + cw * 0.3, iy = y + ch * 0.3; g.fillRect(ix, iy, cw * 0.4, ch * 0.4);
    g.fillStyle = '#e2b53c'; g.beginPath(); for (let p = 0; p < 16; p++) { const a = p / 16 * Math.PI * 2, rr = p % 2 ? 4 : 10; g.lineTo(x + cw / 2 + Math.cos(a) * rr, y + ch / 2 + Math.sin(a) * rr * ch / cw); } g.closePath(); g.fill();
  }
  g.fillStyle = '#b5342b'; g.fillRect(0, 1000, 1024, 24);
  return tex(c);
}
function rippleNormal() { // tileable noise height field -> normal map (no stripes)
  const S = 256, c = canvas(S, S), g = c.getContext('2d'), img = g.createImageData(S, S), Hh = new Float32Array(S * S);
  const oct = (f, a, ph) => { for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const u = x / S * 6.2832, v = y / S * 6.2832; Hh[y * S + x] += a * Math.sin(u * f[0] + v * f[1] + ph); } };
  for (let k = 0; k < 28; k++) { const fx = Math.round((Math.random() - 0.5) * 2 * (2 + k * 0.6)), fy = Math.round((Math.random() - 0.5) * 2 * (2 + k * 0.6)); if (!fx && !fy) continue; oct([fx, fy], 1 / Math.sqrt(fx * fx + fy * fy), Math.random() * 6.28); }
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const dx = Hh[y * S + (x + 1) % S] - Hh[y * S + (x + S - 1) % S], dy = Hh[((y + 1) % S) * S + x] - Hh[((y + S - 1) % S) * S + x];
    const nx = -dx * 2.2, ny = -dy * 2.2, l = Math.hypot(nx, ny, 1), i = (y * S + x) * 4;
    img.data[i] = 128 + 127 * nx / l; img.data[i + 1] = 128 + 127 * ny / l; img.data[i + 2] = 128 + 127 / l; img.data[i + 3] = 255; }
  g.putImageData(img, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
}
/* one shared water look for Fowling Pond, King's Pond and the rivers: blue-green, two drifting ripple layers sampled in
   world space (so overlapping water meshes match exactly), sky reflection with Fresnel from the PBR env map. */
function waterMat(alphaMap) {
  const mat = new THREE.MeshStandardMaterial({color: 0x24605e, roughness: 0.07, metalness: 0.0, alphaMap: alphaMap || null, alphaTest: alphaMap ? 0.5 : 0,
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2});
  if (W3D.env) { mat.envMap = W3D.env; mat.envMapIntensity = 1.35; }
  if (!W3D.waterU) W3D.waterU = {wN: {value: rippleNormal()}, wT: {value: 0}};
  mat.onBeforeCompile = sh => {
    sh.uniforms.wN = W3D.waterU.wN; sh.uniforms.wT = W3D.waterU.wT;
    sh.vertexShader = 'varying vec3 vWw;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\nvWw = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = 'uniform sampler2D wN; uniform float wT; varying vec3 vWw;\n' + sh.fragmentShader.replace('#include <normal_fragment_maps>', [
      'vec2 wp = vWw.xz;',
      'vec3 n1 = texture2D(wN, wp / 21.0 + vec2(0.011, 0.007) * wT).xyz * 2.0 - 1.0;',
      'vec3 n2 = texture2D(wN, mat2(0.8, -0.6, 0.6, 0.8) * wp / 6.5 + vec2(-0.017, 0.012) * wT).xyz * 2.0 - 1.0;',
      'float wd = length(vWw - cameraPosition); vec2 sl = (n1.xy + n2.xy * 0.6 * (1.0 - smoothstep(40.0, 260.0, wd))) * 0.32 * mix(1.0, 0.3, smoothstep(120.0, 900.0, wd));',
      'normal = normalize((viewMatrix * vec4(normalize(vec3(sl.x, 1.0, sl.y)), 0.0)).xyz);'].join('\n'));
  };
  mat.customProgramCacheKey = () => 'jfwater' + (alphaMap ? 'a' : '');
  return mat;
}

/* ---------- geometry helpers ---------- */
function worldUV(geo, w, h, d, T) { // box UVs in metres/T so textures keep real scale
  const uv = geo.attributes.uv, sizes = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * sizes[f][0] / T, uv.getY(i) * sizes[f][1] / T); }
  uv.needsUpdate = true; return geo;
}
let root, M;
function box(w, h, d, x, y, z, mat, opt) { // x,z centre, y = bottom
  opt = opt || {};
  const geo = worldUV(new THREE.BoxGeometry(w, h, d), w, h, d, opt.T || 4);
  if (opt.batter) { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) > 0) { p.setX(i, p.getX(i) * (1 - opt.batter / w * 2)); p.setZ(i, p.getZ(i) * (1 - (opt.batterZ || 0) / d * 2)); } geo.computeVertexNormals(); }
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y + h / 2, z); m.castShadow = opt.shadow !== false; m.receiveShadow = true; (opt.parent || root).add(m);
  if (opt.collide !== false) walls.push({x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2, y0: y, y1: y + h});
  if (opt.floor) floors.push({x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2, y: y + h});
  return m;
}
function floorOnly(w, d, x, y, z) { floors.push({x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2, y: y}); }
function column(x, y, z, h, r, parent) { // papyrus column with open bell capital, painted bands
  const g = new THREE.Group(); g.position.set(x, y, z);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.92, r, h - 2.4, 20), M.column); shaft.position.y = (h - 2.4) / 2; shaft.castShadow = true; g.add(shaft);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.95, r * 0.95, 0.6, 20), M.band); band.position.y = h - 2.9; g.add(band);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.8, r * 0.92, 2.0, 20), M.capital); cap.position.y = h - 1.4; cap.castShadow = true; g.add(cap);
  const ab = new THREE.Mesh(new THREE.BoxGeometry(r * 2.2, 0.4, r * 2.2), M.stone); ab.position.y = h - 0.2; g.add(ab);
  (parent || root).add(g); walls.push({x0: x - r, x1: x + r, z0: z - r, z1: z + r, y0: y, y1: y + h});
}

/* ---------- build ---------- */
W3D.build = function (scene3, sceneEl) {
  root = new THREE.Group(); root.name = 'w3d'; scene3.add(root); W3D.root = root;
  const renderer = sceneEl.renderer;
  // sky + environment
  const skyMat = new THREE.ShaderMaterial({side: THREE.BackSide, depthWrite: false, fog: false, uniforms: {sun: {value: new THREE.Vector3(-0.45, 0.62, 0.35).normalize()}},
    vertexShader: 'varying vec3 vd; void main(){ vd = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} ',
    fragmentShader: 'uniform vec3 sun; varying vec3 vd; void main(){ float h = clamp(vd.y,0.0,1.0); vec3 zen = vec3(0.23,0.47,0.82); vec3 hor = vec3(0.80,0.88,0.95); vec3 c = mix(hor, zen, pow(h,0.55)); if(vd.y<0.0) c = mix(hor, vec3(0.55,0.6,0.55), clamp(-vd.y*3.0,0.0,1.0)); float s = max(dot(normalize(vd), sun),0.0); c += vec3(1.0,0.9,0.7)*pow(s,400.0)*2.0 + vec3(1.0,0.85,0.6)*pow(s,8.0)*0.25; gl_FragColor = vec4(c,1.0);\n#include <colorspace_fragment>\n}'});
  const sky = new THREE.Mesh(new THREE.SphereGeometry(7000, 48, 24), skyMat); sky.renderOrder = -10; root.add(sky); W3D.sky = sky;
  try { const pm = new THREE.PMREMGenerator(renderer); const es = new THREE.Scene(); es.add(new THREE.Mesh(new THREE.SphereGeometry(100, 32, 16), skyMat)); W3D.env = pm.fromScene(es).texture; } catch (e) {}
  W3D.fog = new THREE.Fog(0xcfdde8, 700, 5200); W3D.bg = new THREE.Color(0xcfdde8); // anything past the far plane shows haze, never black
  const hemi = new THREE.HemisphereLight(0xe3ecff, 0x5b6440, 0.85); root.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff0d8, 1.55); sun.position.set(HQ.x - 260, HQ.y + 360, HQ.z + 210); sun.target.position.set(HQ.x + 20, HQ.y, HQ.z - 10);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); const sc = sun.shadow.camera; sc.left = -130; sc.right = 130; sc.top = 130; sc.bottom = -130; sc.near = 50; sc.far = 900; sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.05;
  root.add(sun); root.add(sun.target);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap; renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true; // sun is fixed: redraw shadows ~6x/s, not every frame
  // materials
  const ash = ashlarTex();
  M = {
    stone: new THREE.MeshStandardMaterial({map: ash, roughness: 0.62, metalness: 0}),
    relief: new THREE.MeshStandardMaterial({map: reliefTex(), roughness: 0.55}),
    column: new THREE.MeshStandardMaterial({map: reliefTex(), roughness: 0.5}),
    band: new THREE.MeshStandardMaterial({color: 0x1f5fa8, roughness: 0.4}),
    capital: new THREE.MeshStandardMaterial({color: 0x3f8f5a, roughness: 0.45}),
    gold: new THREE.MeshStandardMaterial({color: 0xd9b23c, metalness: 1, roughness: 0.22}),
    granite: new THREE.MeshStandardMaterial({map: polishedTex(true), roughness: 0.12, metalness: 0.05}),
    marble: new THREE.MeshStandardMaterial({map: polishedTex(false), roughness: 0.1, metalness: 0.02}),
    officeFloor: new THREE.MeshStandardMaterial({map: officeFloorTex(), roughness: 0.08, metalness: 0.02}),
    ceiling: new THREE.MeshStandardMaterial({map: starCeilingTex(), roughness: 0.6}),
    glass: new THREE.MeshStandardMaterial({color: 0xd8f0f6, transparent: true, opacity: 0.16, roughness: 0.03, metalness: 0.1, depthWrite: false, side: THREE.DoubleSide}),
    leaf: new THREE.MeshLambertMaterial({color: 0x2f7d32, side: THREE.DoubleSide}),
    leaf2: new THREE.MeshLambertMaterial({color: 0x4a9c2f, side: THREE.DoubleSide}),
    trunk: new THREE.MeshLambertMaterial({color: 0x6b4f33}),
    palmTrunk: new THREE.MeshLambertMaterial({color: 0x8a7350}),
    waterIn: new THREE.MeshStandardMaterial({color: 0x2d6f86, roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.85})
  };
  if (W3D.env) for (const k in M) if (M[k].isMeshStandardMaterial) M[k].envMap = W3D.env, M[k].envMapIntensity = 0.55;
  M.officeFloor.envMapIntensity = M.granite.envMapIntensity = 0.8; M.marble.envMapIntensity = 0.45; M.marble.color.setHex(0xc9bfae); M.marble.roughness = 0.22; M.officeFloor.color.setHex(0xd6d0c4);
  W3D.M = M;
  W3D.lib = {box: box, floorOnly: floorOnly, canvas: canvas, tex: tex, starCeilingTex: starCeilingTex, HQ: HQ, walls: walls, floors: floors};
  return Promise.all([
    fetch(BASE + 'terrain_v2.u16').then(r => r.arrayBuffer()),
    fetch(BASE + 'trees_v2.f32').then(r => r.arrayBuffer()),
    fetch(BASE + 'water.json?v=1').then(r => r.json())
  ]).then(([hb, tb, wj]) => {
    const u = new Uint16Array(hb); heights = new Float32Array(u.length); for (let i = 0; i < u.length; i++) heights[i] = u[i] * 0.01 - 10;
    buildTerrain(); buildWater(); buildRivers(wj); buildTrees(new Float32Array(tb)); buildRailPortals();
    buildBank(); buildOffice(); buildConservatory(); buildSigns();
    if (W3D.buildRooms) try { W3D.buildRooms(root); } catch (e) { console.warn('exhibit rooms failed', e); }
    if (W3D.buildBankPlus) try { W3D.buildBankPlus(root); } catch (e) { console.warn('bank upgrade failed', e); }
    if (W3D.buildWildlife) W3D.buildWildlife(root);
    root.traverse(o => { if (o.isMesh && o.material && o.material.isMeshStandardMaterial) o.material.needsUpdate = true; });
  });
};
function buildTerrain() {
  const geo = new THREE.PlaneGeometry(SIZE, SIZE, N - 1, N - 1); geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, heights[i]);
  geo.computeVertexNormals();
  const t = new THREE.TextureLoader().load(BASE + 'ortho_v6_v2.jpg?v=1'); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16;
  // sharper ground near the compound and pond: 0.5 m/px USGS tile (x -324..1724, z -1249..799) + fine detail texture that fades in within ~200 m
  const hi = new THREE.TextureLoader().load(BASE + 'ortho_hi_v2.jpg?v=1'); hi.colorSpace = THREE.SRGBColorSpace; hi.anisotropy = 16;
  const det = detailTex(), grs = grassTex();
  const tm = new THREE.MeshLambertMaterial({map: t});
  tm.onBeforeCompile = sh => {
    sh.uniforms.hiMap = {value: hi}; sh.uniforms.detMap = {value: det}; sh.uniforms.grsMap = {value: grs}; sh.uniforms.hiRect = {value: new THREE.Vector4(-324, -1249, 2048, 2048)};
    sh.vertexShader = 'varying vec3 vWp;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\nvWp = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = 'uniform sampler2D hiMap; uniform sampler2D detMap; uniform sampler2D grsMap; uniform vec4 hiRect; varying vec3 vWp;\n' + sh.fragmentShader.replace('#include <map_fragment>', [
      'vec4 texelColor = texture2D(map, vMapUv);',
      'vec2 hu = (vWp.xz - hiRect.xy) / hiRect.zw;',
      'if (hu.x > 0.0 && hu.x < 1.0 && hu.y > 0.0 && hu.y < 1.0) { vec4 hc = texture2D(hiMap, vec2(hu.x, 1.0 - hu.y)); float e = min(min(hu.x, 1.0 - hu.x), min(hu.y, 1.0 - hu.y)); texelColor = mix(texelColor, hc, smoothstep(0.0, 0.03, e)); }',
      'float dd = length(vWp - cameraPosition); float df = 1.0 - smoothstep(60.0, 650.0, dd);',
      'float dtl = texture2D(detMap, vWp.xz / 2.5).r * 0.4 + texture2D(detMap, vWp.xz / 13.0).g * 0.35 + texture2D(detMap, vWp.xz / 0.7).r * 0.25;',
      'texelColor.rgb *= mix(1.0, 0.55 + dtl * 0.9, df);',
      'vec3 gt = mix(texture2D(grsMap, vWp.xz / 3.0).rgb, texture2D(grsMap, vWp.xz / 9.7).rgb, 0.35);',
      'vec3 tint = clamp(texelColor.rgb / vec3(0.16, 0.19, 0.08), 0.35, 2.2);',
      'float gn = 1.0 - smoothstep(25.0, 220.0, dd); float veg = smoothstep(0.0, 0.05, texelColor.g - texelColor.b);',
      'texelColor.rgb = mix(texelColor.rgb, gt * tint, gn * mix(0.35, 0.8, veg));',
      'diffuseColor *= texelColor;'].join('\n'));
  };
  const mesh = new THREE.Mesh(geo, tm); mesh.receiveShadow = true; mesh.name = 'terrain'; root.add(mesh);
  // skirt: wooded-green ground frame around the mapped square so there is never a void at the edge
  const gm = new THREE.MeshLambertMaterial({color: 0x46602f});
  for (const [w, d, x, z] of [[20000, 9000, 0, -HALF - 4500], [20000, 9000, 0, HALF + 4500], [9000, SIZE, -HALF - 4500, 0], [9000, SIZE, HALF + 4500, 0]]) {
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(w, d), gm); pl.rotation.x = -Math.PI / 2; pl.position.set(x, 12, z); root.add(pl); }
}
function buildWater() { // Fowling Pond: shoreline = where the reshaped terrain meets the 16.5 m surface; mask only keeps the lowlands dry
  const x0 = -1830, x1 = 600, z0 = -700, z1 = 650, w = x1 - x0, d = z1 - z0;
  const am = new THREE.TextureLoader().load(BASE + 'pondmask_v2.png?v=1'); am.repeat.set(w / SIZE, d / SIZE); am.offset.set((x0 + HALF) / SIZE, 1 - (z1 + HALF) / SIZE);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d, 8, 4), waterMat(am)); m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2, WATER, (z0 + z1) / 2); m.receiveShadow = true; root.add(m);
}
function buildRivers(J) { // King's Pond surface, the herring passage into Fowling Pond, the channel below King's dam, and the dam road
  const K = J.kings, kw = K.x1 - K.x0, kd = K.z1 - K.z0;
  const kp = new THREE.Mesh(new THREE.PlaneGeometry(kw, kd, 6, 4), waterMat()); kp.rotation.x = -Math.PI / 2; kp.position.set((K.x0 + K.x1) / 2, K.level, (K.z0 + K.z1) / 2); kp.receiveShadow = true; root.add(kp);
  const rm = waterMat();
  for (const R of J.rivers) { // ribbon 26 m wide; its edges tuck under the carved banks
    const P = R.pts, L = R.lev, pos = [], idx = []; let k = 0;
    for (let i = 0; i < P.length - 1; i++) {
      const [ax, az] = P[i], [bx, bz] = P[i + 1], len = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(len / 4));
      for (let j = (i ? 1 : 0); j <= n; j++) {
        const t = j / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t, y = L[i] + (L[i + 1] - L[i]) * t;
        const p0 = P[Math.max(0, i - (t === 0 ? 1 : 0))], p1 = P[Math.min(P.length - 1, i + 1 + (t === 1 ? 1 : 0))];
        let tx = p1[0] - p0[0], tz = p1[1] - p0[1]; const tl = Math.hypot(tx, tz); tx /= tl; tz /= tl;
        pos.push(x - tz * 13, y, z + tx * 13, x + tz * 13, y, z - tx * 13);
        if (k) idx.push(2 * k - 2, 2 * k - 1, 2 * k, 2 * k - 1, 2 * k + 1, 2 * k); k++;
      }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
    g.setAttribute('uv', new THREE.Float32BufferAttribute(new Array(pos.length / 3 * 2).fill(0), 2)); g.computeVertexNormals();
    // normals must face up regardless of winding
    const nr = g.attributes.normal; for (let i = 0; i < nr.count; i++) if (nr.getY(i) < 0) nr.setXYZ(i, -nr.getX(i), -nr.getY(i), -nr.getZ(i));
    const m = new THREE.Mesh(g, rm); m.material.side = THREE.DoubleSide; m.receiveShadow = true; root.add(m);
  }
  // dam road: asphalt deck with white edge lines, yellow centre dashes and stone kerbs, bridging the spillway
  const D = J.dam, len = D.x1 - D.x0;
  const c = canvas(2048, 128), gc = c.getContext('2d'); noiseFill(gc, 2048, 128, '#3a3b3d', 0.10, 40000);
  gc.fillStyle = '#e8e8e2'; gc.fillRect(0, 10, 2048, 5); gc.fillRect(0, 113, 2048, 5);
  gc.fillStyle = '#e2b52a'; for (let x = 0; x < 2048; x += 64) gc.fillRect(x, 60, 34, 4), gc.fillRect(x, 66, 34, 4);
  const at = tex(c); at.wrapS = THREE.ClampToEdgeWrapping; at.anisotropy = 16;
  const road = new THREE.Mesh(new THREE.BoxGeometry(len, 0.5, D.w), new THREE.MeshStandardMaterial({map: at, roughness: 0.85}));
  road.position.set((D.x0 + D.x1) / 2, D.y - 0.25, D.z); road.receiveShadow = true; road.castShadow = true; root.add(road);
  for (const sgn of [-1, 1]) { const kb = new THREE.Mesh(new THREE.BoxGeometry(len, 0.6, 0.45), M.stone); kb.position.set((D.x0 + D.x1) / 2, D.y + 0.3, D.z + sgn * (D.w / 2 - 0.22)); kb.castShadow = true; root.add(kb); }
  const face = new THREE.Mesh(new THREE.BoxGeometry(32, 3.2, 1.2), M.stone); face.position.set(1205, D.y - 1.9, D.z + D.w / 2 - 0.4); root.add(face); // spillway headwall under the bridge
  floors.push({x0: D.x0, x1: D.x1, z0: D.z - D.w / 2, z1: D.z + D.w / 2, y: D.y});
}
function buildTrees(a) {
  const n = a.length / 4; const con = [], dec = [];
  for (let i = 0; i < n; i++) { const x = a[i * 4], z = a[i * 4 + 1], s = a[i * 4 + 2], k = a[i * 4 + 3]; const y = terrainH(x, z); if (y < -5) continue; (k < 0.5 ? con : dec).push([x, y, z, s]); }
  const mk = (geo, mat, list, yOff, sy, colors) => {
    const im = new THREE.InstancedMesh(geo, mat, list.length); const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sv = new THREE.Vector3(), pv = new THREE.Vector3(), col = new THREE.Color();
    list.forEach((t, i) => { q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), (i * 2.39996) % 6.283); sv.set(t[3], t[3] * sy, t[3]); pv.set(t[0], t[1] + yOff * t[3], t[2]); m4.compose(pv, q, sv); im.setMatrixAt(i, m4);
      if (colors) { col.set(colors[i % colors.length]); col.offsetHSL(0, 0, ((i * 7919) % 100) / 1000 - 0.05); im.setColorAt(i, col); } });
    im.frustumCulled = false; root.add(im); return im;
  };
  const trunkG = new THREE.CylinderGeometry(0.25, 0.35, 4, 6); trunkG.translate(0, 2, 0);
  mk(trunkG, M.trunk, con, 0, 1); mk(trunkG, M.trunk, dec, 0, 1);
  const coneG = new THREE.ConeGeometry(2.6, 9, 8); coneG.translate(0, 7.5, 0);
  mk(coneG, new THREE.MeshLambertMaterial({color: 0xffffff}), con, 0, 1, ['#2f5a2c', '#2a4f2a', '#355f30']);
  const crownG = new THREE.DodecahedronGeometry(3.7, 0); crownG.scale(1, 0.85, 1); crownG.translate(0, 6.5, 0);
  mk(crownG, new THREE.MeshLambertMaterial({color: 0xffffff, flatShading: true}), dec, 0, 1, ['#4e7a2e', '#5d8a34', '#3f6b2a', '#6b8f3a']);
}
function buildRailPortals() { // v6: railroad runs in a 1.67 km tunnel; portals >= 274 m from shore (approx positions)
  for (const [z, dir] of [[-771, -1], [897, 1]]) {
    const x = -548, y = terrainH(x, z);
    box(14, 10, 3, x, y - 2, z, M.stone, {collide: false});
    const arch = new THREE.Mesh(new THREE.BoxGeometry(6, 6.5, 3.2), new THREE.MeshBasicMaterial({color: 0x111111})); arch.position.set(x, y + 1.25, z + dir * 0.05); root.add(arch);
  }
}
function buildBank() {
  const y0 = HQ.y, zc = HQ.z;
  // terrace / overlook over the pond (spawn)
  { // round domed pavilion with a coffered ceiling over the spawn point
    const R = 6.5, H = 7, dc = {x: 846, z: zc};
    for (let i = 0; i < 8; i++) { const a = (i + 0.5) / 8 * Math.PI * 2; column(dc.x + Math.cos(a) * R, y0 + 0.1, dc.z + Math.sin(a) * R, H, 0.55); }
    const ent = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.9, R + 0.9, 1.2, 96, 1, true), M.relief); ent.position.set(dc.x, y0 + 0.1 + H + 0.6, dc.z); ent.material = M.relief; root.add(ent);
    const entIn = new THREE.Mesh(new THREE.CylinderGeometry(R - 0.6, R - 0.6, 1.2, 96, 1, true), M.relief.clone()); entIn.material.side = THREE.BackSide; entIn.position.copy(ent.position); root.add(entIn);
    const soffit = new THREE.Mesh(new THREE.RingGeometry(R - 0.6, R + 0.9, 96, 1), M.stone.clone()); soffit.material.side = THREE.DoubleSide; soffit.rotation.x = Math.PI / 2; soffit.position.set(dc.x, y0 + 0.1 + H, dc.z); root.add(soffit);
    const lip = new THREE.Mesh(new THREE.RingGeometry(R - 0.6, R + 0.9, 96, 1), M.gold); lip.rotation.x = -Math.PI / 2; lip.position.set(dc.x, y0 + 0.1 + H + 1.2, dc.z); root.add(lip);
    const inner = new THREE.Mesh(new THREE.SphereGeometry(R - 0.6, 96, 32, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({map: cofferTex(), roughness: 0.55, side: THREE.BackSide, envMap: W3D.env || null, envMapIntensity: 0.4}));
    inner.position.set(dc.x, y0 + 0.1 + H + 1.2, dc.z); root.add(inner);
    const outer = new THREE.Mesh(new THREE.SphereGeometry(R + 0.9, 96, 32, 0, Math.PI * 2, 0, Math.PI / 2), M.stone); outer.position.copy(inner.position); outer.castShadow = true; root.add(outer);
    const fin = new THREE.Mesh(new THREE.SphereGeometry(0.6, 24, 16), M.gold); fin.position.set(dc.x, inner.position.y + R + 1.2, dc.z); root.add(fin);
    const lamp = new THREE.PointLight(0xffe2b0, 0.5, 14); lamp.position.set(dc.x, y0 + 5, dc.z); root.add(lamp);
  }
  box(16, 0.4, 56, 845, y0 - 0.1, zc, M.marble, {floor: true, collide: false, T: 4});
  box(0.8, 1.05, 56, 837.4, y0, zc, M.stone, {});            // parapet facing pond
  box(16, 1.05, 0.8, 845, y0, zc - 28, M.stone, {}); box(16, 1.05, 0.8, 845, y0, zc + 28, M.stone, {});
  // sphinx avenue
  box(38, 0.3, 10, 872, y0 - 0.1, zc, M.marble, {floor: true, collide: false});
  for (let i = 0; i < 6; i++) for (const s of [-1, 1]) sphinx(857 + i * 6, y0, zc + s * 7.5, s);
  // obelisks
  for (const s of [-1, 1]) obelisk(890, y0, zc + s * 12, 22);
  // pylon (two battered towers + gateway)
  for (const s of [-1, 1]) {
    const zt = zc + s * 17;
    box(7, 22, 26, 896, y0, zt, M.relief, {batter: 0.9, batterZ: 1.6, T: 6});
    box(8, 1.2, 27.5, 896, y0 + 22, zt, M.stone, {collide: false});     // cavetto cornice (simplified)
    box(0.3, 14, 1.5, 892.3, y0 + 0.5, zt - s * 3, M.gold, {collide: false}); // flagpole mast (gilded)
  }
  box(6.4, 3, 12, 896, y0 + 14, zc, M.relief, {collide: false});    // lintel over gate (12 deep so it beds into both battered towers - no gaps)
  const disk = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.3, 32), M.gold); disk.rotation.z = Math.PI / 2; disk.position.set(892.3, y0 + 15.5, zc); root.add(disk);
  for (const s of [-1, 1]) { const wing = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.7, 3.2), new THREE.MeshStandardMaterial({color: 0x1f5fa8, roughness: 0.4})); wing.position.set(892.35, y0 + 15.6, zc + s * 2.6); root.add(wing); }
  floorOnly(8, 9, 896, y0 + 0.2, zc);
  // forecourt with colonnades
  box(26, 0.2, 40, 912, y0, zc, M.granite, {floor: true, collide: false});
  for (const s of [-1, 1]) {
    for (let i = 0; i < 5; i++) column(902 + i * 5, y0 + 0.2, zc + s * 15, 9, 0.75);
    if (s < 0) box(26, 9.4, 1.2, 912, y0, zc + s * 19.4, M.relief, {T: 6});
    box(26, 0.8, 6, 912, y0 + 9.2, zc + s * 16.8, M.stone, {collide: false});
  }
  // south door through court wall towards the conservatory
  box(11, 9.4, 1.2, 904.5, y0, zc + 19.4, M.relief, {T: 6}); box(11, 9.4, 1.2, 919.5, y0, zc + 19.4, M.relief, {T: 6});
  box(4, 3.4, 1.2, 912, y0 + 6, zc + 19.4, M.relief, {collide: false});
  // hypostyle hall
  const hx0 = 925, hx1 = 965, hz = 20, H = 16;
  box(40, 0.3, 40, 945, y0, zc, M.granite, {floor: true, collide: false});
  // north wall has two 4 m doorways (x 931-935 and 955-959) into the exhibit rooms (see rooms.js)
  box(6, H, 1.5, 928, y0, zc - hz, M.relief, {T: 8}); box(20, H, 1.5, 945, y0, zc - hz, M.relief, {T: 8}); box(6, H, 1.5, 962, y0, zc - hz, M.relief, {T: 8});
  for (const dx of [933, 957]) box(4, H - 5, 1.5, dx, y0 + 5, zc - hz, M.relief, {collide: false, T: 8});
  box(40, H, 1.5, 945, y0, zc + hz, M.relief, {T: 8});
  box(1.5, H, 40, hx1, y0, zc, M.relief, {T: 8});
  box(1.5, H, 17, hx0, y0, zc - 11.5, M.relief, {T: 8}); box(1.5, H, 17, hx0, y0, zc + 11.5, M.relief, {T: 8}); // door gap 6 m
  box(1.5, H - 10, 6, hx0, y0 + 10, zc, M.relief, {collide: false});
  box(41.5, 1.2, 15, 945, y0 + H, zc - 13, M.stone, {collide: false}); box(41.5, 1.2, 15, 945, y0 + H, zc + 13, M.stone, {collide: false});
  for (const s of [-1, 1]) box(40, 4, 0.6, 945, y0 + H, zc + s * 5.6, M.stone, {collide: false}); // clerestory
  box(41.5, 1.2, 12, 945, y0 + H + 4, zc, M.stone, {collide: false});
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), M.ceiling); ceil.rotation.x = Math.PI / 2; ceil.position.set(945, y0 + H - 0.08, zc); M.ceiling.map.repeat.set(5, 5); root.add(ceil);
  for (let i = 0; i < 6; i++) { const x = 930 + i * 6; for (const dz of [-15, -9.5, 9.5, 15]) column(x, y0 + 0.3, zc + dz, H, 1.0); for (const dz of [-3.6, 3.6]) column(x, y0 + 0.3, zc + dz, H + 4, 1.25); }
  // hall lighting (warm)
  const pl = new THREE.PointLight(0xffd9a0, 1.2, 60); pl.position.set(945, y0 + 12, zc); root.add(pl);
  // office tower behind the hall
  box(18, 29.6, 18, 976, y0, zc, M.relief, {T: 6});
  W3D.liftHall = {x: 961.5, y: y0 + 0.3, z: zc};
}
function sphinx(x, y, z, s) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = s > 0 ? Math.PI / 2 * 0 : 0;
  const b = (w, h, d, px, py, pz, m) => { const mm = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m || M.stone); mm.position.set(px, py, pz); mm.castShadow = true; g.add(mm); return mm; };
  b(4.6, 1.1, 2.4, 0, 0.55, 0);               // plinth
  b(3.4, 1.2, 1.6, 0.2, 1.7, 0);              // lion body
  b(1.3, 0.5, 0.5, -1.7, 1.35, 0.45); b(1.3, 0.5, 0.5, -1.7, 1.35, -0.45); // paws (facing avenue toward pond: -x)
  b(0.9, 1.5, 1.1, -1.2, 2.6, 0);             // chest/head block
  b(1.0, 1.0, 1.5, -1.15, 3.05, 0, M.band);   // nemes headdress (blue)
  b(0.4, 0.7, 0.7, -1.7, 2.8, 0, M.stone);    // face
  root.add(g); walls.push({x0: x - 2.3, x1: x + 2.3, z0: z - 1.2, z1: z + 1.2, y0: y, y1: y + 3.5});
}
function obelisk(x, y, z, h) {
  const geo = new THREE.CylinderGeometry(0.85, 1.3, h, 4, 1); geo.rotateY(Math.PI / 4);
  const m = new THREE.Mesh(geo, M.relief); m.position.set(x, y + 1.2 + h / 2, z); m.castShadow = true; root.add(m);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(1.2, 2, 4), M.gold); tip.rotation.y = Math.PI / 4; tip.position.set(x, y + 1.2 + h + 1, z); root.add(tip);
  box(3.4, 1.2, 3.4, x, y, z, M.stone, {});
}
function buildOffice() { // top floor of the tower: polished modern-Egyptian, full star ceiling, 360 view through stone-framed windows
  const x = 976, z = HQ.z, fy = HQ.y + 30, S = 18, Hh = 6;
  const f = new THREE.Mesh(worldUV(new THREE.BoxGeometry(S, 0.4, S), S, 0.4, S, S), M.officeFloor); f.position.set(x, fy - 0.2, z); f.receiveShadow = true; root.add(f);
  floorOnly(S, S, x, fy, z);
  const ce = new THREE.Mesh(new THREE.PlaneGeometry(S, S), new THREE.MeshStandardMaterial({map: starCeilingTex(), roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2})); ce.rotation.x = Math.PI / 2; ce.position.set(x, fy + Hh - 0.08, z); /* below the roof slab: no flicker */ root.add(ce);
  box(S + 1, 0.8, S + 1, x, fy + Hh, z, M.stone, {collide: false});
  box(S + 2, 0.6, S + 2, x, fy + Hh + 0.8, z, M.stone, {collide: false});
  // walls: each side = 4 stone piers + sill + lintel, 5 windows 2.6 m wide
  for (const side of [0, 1, 2, 3]) for (let i = 0; i < 6; i++) {
    const t = -S / 2 + i * (S / 5); const px = side < 2 ? x + t : x + (side === 2 ? -S / 2 : S / 2), pz = side < 2 ? z + (side === 0 ? -S / 2 : S / 2) : z + t;
    box(1.0, Hh, 1.0, px, fy, pz, M.marble, {T: 2});
  }
  for (const side of [0, 1, 2, 3]) {
    const along = side < 2, cx = along ? x : x + (side === 2 ? -S / 2 : S / 2), cz = along ? z + (side === 0 ? -S / 2 : S / 2) : z;
    box(along ? S : 0.6, 0.85, along ? 0.6 : S, cx, fy, cz, M.marble, {T: 2});                 // sill (stops you falling)
    box(along ? S : 0.7, 1.3, along ? 0.7 : S, cx, fy + Hh - 1.3, cz, M.relief, {collide: false, T: 4}); // painted lintel band
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(S, Hh - 2.15), M.glass); gl.position.set(cx, fy + 0.85 + (Hh - 2.15) / 2, cz); if (!along) gl.rotation.y = Math.PI / 2; root.add(gl);
  }
  // desk, chair, small gilded obelisks
  box(3.2, 0.12, 1.4, x + 3, fy + 0.78, z, M.granite, {collide: false}); box(0.4, 0.78, 1.2, x + 1.6, fy, z, M.marble, {}); box(0.4, 0.78, 1.2, x + 4.4, fy, z, M.marble, {});
  box(0.7, 0.5, 0.7, x + 4.1, fy, z, M.marble, {collide: false}); box(0.7, 1.0, 0.12, x + 4.42, fy + 0.5, z, M.marble, {collide: false});
  for (const s of [-1, 1]) { const ob = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 2.2, 4), M.gold); ob.position.set(x + 6.5, fy + 1.1, z + s * 6.5); root.add(ob); }
  const l = new THREE.PointLight(0xfff1d0, 0.8, 30); l.position.set(x, fy + 4.5, z); root.add(l);
  W3D.liftOffice = {x: x - 5.5, y: fy, z: z + 5.5};
}
function buildConservatory() { // stone papyrus colonnade with glazing between, glass roof, tropical planting + lotus pool
  const x0 = 900, x1 = 952, z0 = HQ.z + 27, z1 = HQ.z + 55, y0 = HQ.y, Hc = 9;
  box(x1 - x0, 0.3, z1 - z0, (x0 + x1) / 2, y0, (z0 + z1) / 2, M.marble, {floor: true, collide: false});
  // path from court door
  box(5, 0.3, 8, 912, y0, HQ.z + 23, M.marble, {floor: true, collide: false});
  const cols = []; for (let x = x0; x <= x1; x += 4) { cols.push([x, z0]); cols.push([x, z1]); } for (let z = z0 + 4; z < z1; z += 4) { cols.push([x0, z]); cols.push([x1, z]); }
  for (const [cx, cz] of cols) column(cx, y0 + 0.3, cz, Hc, 0.5);
  // glazing + low stone base between columns (door gap on north side at x 910-914)
  const pane = (w, cx, cz, rot) => { const g = new THREE.Mesh(new THREE.PlaneGeometry(w, Hc - 1.4), M.glass); g.position.set(cx, y0 + 1.1 + (Hc - 1.4) / 2, cz); g.rotation.y = rot; root.add(g); };
  for (const zz of [z0, z1]) for (let x = x0; x < x1; x += 4) { if (zz === z0 && x === 908) continue; if (zz === z0 && x === 912) continue; box(4, 0.8, 0.5, x + 2, y0 + 0.3, zz, M.stone, {}); pane(3, x + 2, zz, 0); walls.push({x0: x, x1: x + 4, z0: zz - 0.2, z1: zz + 0.2, y0: y0, y1: y0 + Hc}); }
  for (const xx of [x0, x1]) for (let z = z0; z < z1; z += 4) { box(0.5, 0.8, 4, xx, y0 + 0.3, z + 2, M.stone, {}); pane(3, xx, z + 2, Math.PI / 2); walls.push({x0: xx - 0.2, x1: xx + 0.2, z0: z, z1: z + 4, y0: y0, y1: y0 + Hc}); }
  box(4, Hc - 3, 0.6, 910, y0 + 3.3 + 0, z0, M.relief, {collide: false});
  box(x1 - x0 + 1, 0.7, 1.0, (x0 + x1) / 2, y0 + Hc, z0, M.stone, {collide: false}); box(x1 - x0 + 1, 0.7, 1.0, (x0 + x1) / 2, y0 + Hc, z1, M.stone, {collide: false});
  box(1.0, 0.7, z1 - z0, x0, y0 + Hc, (z0 + z1) / 2, M.stone, {collide: false}); box(1.0, 0.7, z1 - z0, x1, y0 + Hc, (z0 + z1) / 2, M.stone, {collide: false});
  // gabled glass roof
  const half = (z1 - z0) / 2, rise = 5, len = Math.hypot(half, rise), ang = Math.atan2(rise, half);
  for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, len), M.glass); r.position.set((x0 + x1) / 2, y0 + Hc + 0.7 + rise / 2, (z0 + z1) / 2 + s * half / 2); r.rotation.x = -Math.PI / 2 + s * -ang * -1; r.rotation.x = s > 0 ? -Math.PI / 2 + ang : -Math.PI / 2 - ang; root.add(r); }
  box(x1 - x0, 0.4, 0.4, (x0 + x1) / 2, y0 + Hc + 0.7 + rise - 0.2, (z0 + z1) / 2, M.stone, {collide: false});
  // lotus pool
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  box(14, 0.5, 7, cx, y0 + 0.3, cz, M.granite, {collide: false});
  const pw = new THREE.Mesh(new THREE.PlaneGeometry(13, 6), M.waterIn); pw.rotation.x = -Math.PI / 2; pw.position.set(cx, y0 + 0.75, cz); root.add(pw);
  walls.push({x0: cx - 7, x1: cx + 7, z0: cz - 3.5, z1: cz + 3.5, y0: y0, y1: y0 + 0.8});
  for (let i = 0; i < 14; i++) { const pad = new THREE.Mesh(new THREE.CircleGeometry(0.35 + Math.random() * 0.2, 12), M.leaf2); pad.rotation.x = -Math.PI / 2; pad.position.set(cx - 6 + Math.random() * 12, y0 + 0.77, cz - 2.6 + Math.random() * 5.2); root.add(pad);
    if (i % 3 === 0) { const fl = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.3, 6, 1, true), new THREE.MeshLambertMaterial({color: 0xf2a6c8, side: THREE.DoubleSide})); fl.rotation.x = Math.PI; fl.position.set(pad.position.x, y0 + 0.92, pad.position.z); root.add(fl); } }
  // palms, bananas, papyrus
  const rnd = (a, b) => a + Math.random() * (b - a);
  for (let i = 0; i < 16; i++) { let px, pz; do { px = rnd(x0 + 2.5, x1 - 2.5); pz = rnd(z0 + 2.5, z1 - 2.5); } while ((Math.abs(px - cx) < 8.5 && Math.abs(pz - cz) < 5) || (Math.abs(px - 912) < 4 && pz < z0 + 9)); palm(px, y0 + 0.3, pz, rnd(5, 8)); }
  for (let i = 0; i < 14; i++) { let px, pz; do { px = rnd(x0 + 1.5, x1 - 1.5); pz = rnd(z0 + 1.5, z1 - 1.5); } while ((Math.abs(px - cx) < 8 && Math.abs(pz - cz) < 4.5) || (Math.abs(px - 912) < 3.5 && pz < z0 + 8)); banana(px, y0 + 0.3, pz); }
  for (let i = 0; i < 18; i++) papyrus(cx + (i % 2 ? -1 : 1) * rnd(6.2, 7.2), y0 + 0.8, cz + rnd(-3, 3));
  const l = new THREE.PointLight(0xfff4d6, 0.6, 50); l.position.set(cx, y0 + 7, cz); root.add(l);
  W3D.conservatory = {x: 912, y: y0 + 0.3, z: z0 + 3};
}
function palm(x, y, z, h) {
  const g = new THREE.Group(); g.position.set(x, y, z);
  const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.3, h, 8), M.palmTrunk); tr.position.y = h / 2; tr.rotation.z = (Math.random() - 0.5) * 0.15; g.add(tr);
  for (let i = 0; i < 9; i++) { const fr = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 3.6, 1, 4), i % 2 ? M.leaf : M.leaf2); const p = fr.geometry.attributes.position; for (let k = 0; k < p.count; k++) { const t = (p.getY(k) + 1.8) / 3.6; p.setZ(k, -t * t * 1.6); } fr.geometry.translate(0, 1.8, 0);
    fr.position.y = h; fr.rotation.set(-1.0, i / 9 * Math.PI * 2, 0, 'YXZ'); g.add(fr); }
  root.add(g); walls.push({x0: x - 0.3, x1: x + 0.3, z0: z - 0.3, z1: z + 0.3, y0: y, y1: y + h});
}
function banana(x, y, z) {
  const g = new THREE.Group(); g.position.set(x, y, z);
  for (let i = 0; i < 6; i++) { const lf = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 2.6), M.leaf2); lf.geometry.translate(0, 1.3, 0); lf.position.y = 0.6 + Math.random() * 0.6; lf.rotation.set(-0.5 - Math.random() * 0.4, i / 6 * Math.PI * 2, 0, 'YXZ'); g.add(lf); }
  const st = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.4, 6), M.leaf); st.position.y = 0.7; g.add(st); root.add(g);
}
function papyrus(x, y, z) {
  const g = new THREE.Group(); g.position.set(x, y, z);
  for (let i = 0; i < 5; i++) { const h = 1.6 + Math.random(); const s = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, h, 4), M.leaf); s.position.set((Math.random() - 0.5) * 0.4, h / 2, (Math.random() - 0.5) * 0.4); g.add(s); const u = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), M.leaf2); u.scale.y = 0.5; u.position.set(s.position.x, h, s.position.z); g.add(u); }
  root.add(g);
}
function buildSigns() {
  const c = canvas(1024, 512), g = c.getContext('2d'); g.fillStyle = '#1b1408'; g.fillRect(0, 0, 1024, 512); g.strokeStyle = '#d4af37'; g.lineWidth = 10; g.strokeRect(10, 10, 1004, 492);
  g.fillStyle = '#ffd700'; g.font = 'bold 44px Georgia'; g.textAlign = 'center'; g.fillText('Bank of the United States (3rd ed.)', 512, 80);
  g.font = '30px Georgia'; g.fillStyle = '#f3e6c0';
  ['Concept rendering only - not a survey, design or real institution.', 'Fowling Pond restored per Restoration Plan v6 (approximate):', 'pond ~506 acres, wetland fringe, herring passage to King\'s Pond,', 'rail in tunnel, quarry/yard regraded to forested hill, Thrasher St moved.', 'Elevation: USGS 3DEP. Imagery: USGS National Map (public domain).', 'Buildings, plants and animals: procedural concept models.'].forEach((s, i) => g.fillText(s, 512, 150 + i * 56));
  const m = new THREE.Mesh(new THREE.PlaneGeometry(4, 2), new THREE.MeshBasicMaterial({map: tex(c), toneMapped: false}));
  m.position.set(845, HQ.y + 1.9, HQ.z - 26.5); root.add(m);
}

/* ---------- movement glue: ground-follow, walls, gentle landing, teleport ---------- */
AFRAME.registerComponent('w3d-physics', {
  init: function () { this.prev = new THREE.Vector3(); this.vy = 0; this.el.object3D.getWorldPosition(this.prev); },
  tock: function (t, dt) {
    if (!W3D.active || !heights || !dt) return;
    const p = this.el.object3D.position, d = Math.min(dt, 50) / 1000;
    if (JFVR.fly) { const g = groundAt(p.x, p.z, p.y) + 0.3; if (p.y < g) p.y = g; this.vy = 0; this.prev.copy(p); return; }
    // walls (walking only): slide along, never pass through
    if (blocked(p.x, p.z, p.y)) {
      if (!blocked(p.x, this.prev.z, p.y)) p.z = this.prev.z; else if (!blocked(this.prev.x, p.z, p.y)) p.x = this.prev.x; else { p.x = this.prev.x; p.z = this.prev.z; }
    }
    const g = groundAt(p.x, p.z, p.y);
    if (p.y > g + 0.02) { this.vy = Math.min(this.vy + 9.8 * d * 0.6, 14); p.y = Math.max(g, p.y - this.vy * d); } // gentle fall / landing
    else { p.y = g; this.vy = 0; }
    this.prev.copy(p);
  }
});
AFRAME.registerComponent('w3d-teleport', { // hold right trigger to aim (gold ring), release to jump there
  init: function () {
    this.aim = false; this.hit = null;
    const ring = this.ring = document.createElement('a-ring'); ring.setAttribute('radius-inner', 0.35); ring.setAttribute('radius-outer', 0.55); ring.setAttribute('rotation', '-90 0 0'); ring.setAttribute('material', 'shader:flat;color:#FFD700;side:double'); ring.setAttribute('visible', false);
    this.el.sceneEl.appendChild(ring);
    this.el.addEventListener('triggerdown', () => { if (!W3D.active) return; const rc = this.el.components.raycaster; if (rc && rc.intersectedEls.length) return; this.aim = true; });
    this.el.addEventListener('triggerup', () => { if (this.aim && this.hit) W3D.teleportTo(this.hit.x, this.hit.y, this.hit.z); this.aim = false; this.ring.setAttribute('visible', false); });
  },
  tick: function () {
    if (!this.aim) return;
    const o = this.el.object3D, pos = o.getWorldPosition(new THREE.Vector3()), dir = new THREE.Vector3(0, 0, -1).applyQuaternion(o.getWorldQuaternion(new THREE.Quaternion()));
    this.hit = null; const p = pos.clone();
    for (let s = 0; s < 600; s++) { p.addScaledVector(dir, s < 50 ? 0.5 : 2); const g = groundAt(p.x, p.z, p.y); if (p.y <= g) { this.hit = new THREE.Vector3(p.x, g, p.z); break; } }
    if (this.hit) { this.ring.object3D.position.set(this.hit.x, this.hit.y + 0.05, this.hit.z); this.ring.setAttribute('visible', true); } else this.ring.setAttribute('visible', false);
  }
});
W3D.teleportTo = function (x, y, z, yawDeg) {
  const rig = document.querySelector('#rig'), cam = rig.querySelector('[camera]');
  const cw = cam.object3D.getWorldPosition(new THREE.Vector3()), rp = rig.object3D.position;
  rp.x += x - cw.x; rp.z += z - cw.z; rp.y = (y !== undefined ? y : groundAt(x, z, 999));
  if (yawDeg !== undefined) rig.object3D.rotation.y = THREE.MathUtils.degToRad(yawDeg);
  const ph = rig.components['w3d-physics']; if (ph) ph.prev.copy(rp);
};
W3D.spots = {
  terrace: () => W3D.teleportTo(846, HQ.y + 0.3, HQ.z, 90),
  hall: () => W3D.teleportTo(930, HQ.y + 0.3, HQ.z, -90),
  office: () => W3D.teleportTo(972, HQ.y + 30, HQ.z + 2, 90),
  conservatory: () => W3D.teleportTo(912, HQ.y + 0.3, HQ.z + 28.2, 180),
  pond: () => { JFVR.fly = true; JFVR.hud && JFVR.hud('Fly mode ON - over Fowling Pond'); const l = document.querySelector('#flylabel'); if (l) l.setAttribute('value', 'Fly: ON'); W3D.teleportTo(300, 140, -250, 90); }
};
// desktop: Space / Shift = up / down while flying
const keys = {};
document.addEventListener('keydown', e => { keys[e.code] = true; }); document.addEventListener('keyup', e => { keys[e.code] = false; });
AFRAME.registerComponent('w3d-keys', { tick: function (t, dt) { if (!W3D.active || !JFVR.fly || !dt) return; const p = this.el.object3D.position, s = 30 * dt / 1000; if (keys.Space) p.y += s; if (keys.ShiftLeft || keys.ShiftRight) p.y -= s; if (W3D.waterNormal) {} } });
const _cp = new THREE.Vector3(); let _sf = 0;
AFRAME.registerComponent('w3d-anim', { tick: function (t, dt) { if (W3D.waterU) W3D.waterU.wT.value = t / 1000; if (!W3D.active) return; if (W3D.tickWildlife) W3D.tickWildlife(t, dt); if (W3D.tickRooms) W3D.tickRooms(t, dt);
  const r = this.el.renderer; if (r && ++_sf % 12 === 0) r.shadowMap.needsUpdate = true;
  if (W3D.sky && this.el.camera) { this.el.camera.getWorldPosition(_cp); W3D.sky.position.copy(_cp); } } });
// lifts between hall and office
AFRAME.registerComponent('w3d-lift', { schema: {to: {type: 'string'}}, init: function () { this.el.addEventListener('click', () => { if (this.data.to === 'office') W3D.spots.office(); else W3D.teleportTo(958, HQ.y + 0.3, HQ.z, -90); JFVR.hud && JFVR.hud(this.data.to === 'office' ? "Josh's office - top floor" : 'Banking hall'); }); } });
})();
