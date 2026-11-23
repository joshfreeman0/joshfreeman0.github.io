/* Fowling Pond - walkable/flyable 3D world (concept rendering).
   Terrain: USGS 3DEP elevation (public domain). Imagery: USGS National Map orthoimagery (public domain).
   Fowling Pond Restoration Plan v6 features drawn approximately from the plan's concept maps.
   Buildings, plants and animals are procedural concept models. Not a survey or engineering design. */
(function () {
const W3D = window.W3D = {};
const BASE = '/vr/w3d/';
/* Lite tier (phones/tablets, <=4 GB devices; never the Quest): see JFVR_LITE in index.html. Smaller photos, no 0.5 m tile,
   40% of the trees, 1024 px cap on every texture, smaller shadow map - keeps iPhone Safari under its WebGL memory limit. */
const LITE = W3D.lite = !!window.JFVR_LITE;
/* Quality pass (Nov 2026, toward a Quest 'Iceland'-home look; content and layout unchanged): a gentle colour grade after ACES,
   height-based haze (low ground hazier than hill tops and towers), warmer sun + cooler sky/warm-earth hemisphere, shadows that follow
   the player, slow swells + stronger fresnel on the water, fine relief on the ground up close (desktop) and grass tufts near you.
   ?classic=1 keeps the previous look. */
const CLASSIC = W3D.classic = /[?&]classic=1/.test(location.search);
const QUEST = W3D.quest = /OculusBrowser|Quest/i.test(navigator.userAgent) || /[?&]quest=1/.test(location.search);
function qualityChunks() {
  const C = THREE.ShaderChunk, tp = C.tonemapping_pars_fragment, i = tp.indexOf('vec3 ACESFilmicToneMapping'), R = 'return saturate( color );', j = i < 0 ? -1 : tp.indexOf(R, i);
  if (j > 0) C.tonemapping_pars_fragment = tp.slice(0, i) +
    'vec3 jfGrade( vec3 c ) { float l = dot( c, vec3( 0.2126, 0.7152, 0.0722 ) ); c = max( mix( vec3( l ), c, 1.07 ), 0.0 );\n' +
    '  c *= mix( vec3( 0.975, 0.99, 1.035 ), vec3( 1.025, 1.0, 0.96 ), smoothstep( 0.04, 0.5, l ) ); return mix( c, c * c * ( 3.0 - 2.0 * c ), 0.16 ); }\n' +
    tp.slice(i, j) + 'return jfGrade( saturate( color ) );' + tp.slice(j + R.length);
  C.fog_pars_vertex = C.fog_pars_vertex.replace('varying float vFogDepth;', 'varying float vFogDepth; varying float vFogH;');
  C.fog_vertex = C.fog_vertex.replace('#ifdef USE_FOG', '#ifdef USE_FOG\n\tvFogH = cameraPosition.y + dot( viewMatrix[ 1 ].xyz, mvPosition.xyz );');
  C.fog_pars_fragment = C.fog_pars_fragment.replace('varying float vFogDepth;', 'varying float vFogDepth; varying float vFogH;');
  C.fog_fragment = C.fog_fragment.replace('gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );',
    'float jfH = exp( - max( vFogH - 20.0, 0.0 ) / 220.0 );\n\tfogFactor = max( fogFactor * mix( 0.8, 1.0, jfH ), ( 1.0 - exp( - vFogDepth / 2400.0 ) ) * jfH * 0.3 );\n\tgl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );');
}
if (!CLASSIC) qualityChunks();
const N = 385, SIZE = 4096, HALF = 2048, WATER = 16.5;
const HQ = {x: 920, y: 34, z: -380};
let heights = null;
const floors = [];   // {x0,x1,z0,z1,y}
const walls = [];    // {x0,x1,z0,z1,y0,y1}
W3D.floors = floors; W3D.walls = walls;

const RINGS = {mid: {n: 193, R: 6144, img: LITE ? 'ring_mid_lite.jpg?v=3' : 'ring_mid.jpg?v=2', name: 'ring-mid', h: null}, far: {n: 129, R: 16384, img: LITE ? 'ring_far_lite.jpg?v=2' : 'ring_far.jpg?v=2', name: 'ring-far', h: null}};
function ringH(x, z) {
  for (const L of [RINGS.mid, RINGS.far]) {
    if (!L.h || Math.abs(x) > L.R || Math.abs(z) > L.R) continue;
    const S = 2 * L.R / (L.n - 1), fx = (x + L.R) / S, fz = (z + L.R) / S, ix = Math.min(L.n - 2, Math.floor(fx)), iz = Math.min(L.n - 2, Math.floor(fz)), tx = fx - ix, tz = fz - iz, h = L.h, n = L.n;
    const a = h[iz * n + ix], b = h[iz * n + ix + 1], c = h[(iz + 1) * n + ix], d = h[(iz + 1) * n + ix + 1];
    return (tx + tz <= 1 ? a + (b - a) * tx + (c - a) * tz : d + (c - d) * (1 - tx) + (b - d) * (1 - tz)) / 10;
  }
  return 0;
}
function terrainH(x, z) {
  if (!heights) return 0;
  if (Math.abs(x) > HALF || Math.abs(z) > HALF) return ringH(x, z);
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
  const P = W3D.water && W3D.water.pond; if (P && g < WATER - 0.2 && x > P.x0 && x < P.x1 && z > P.z0 && z < P.z1) g = WATER - 0.2; // walk on the pond surface rather than its bed
  if (W3D.patchH) { const ph = W3D.patchH(x, z); if (ph !== null) g = ph; }   // Bridgewater detail patch (launch.js), when loaded
  if (W3D.cityH) { const ch = W3D.cityH(x, z); if (ch !== null) g = ch; }     // saucer destination city (cities.js), when loaded
  const t0 = g; let u = null; // floors flagged under:true are below the terrain (bank vault) and only count when you are below ground
  if (PARK && Math.abs(x - PARK.P.cx) < PARK.P.ax + 60 && Math.abs(z - PARK.P.cz) < PARK.P.az + 60) { const s = PARK.surf(x, z); if (s !== null && s > g) g = s; }
  for (const f of floors) if (x >= f.x0 && x <= f.x1 && z >= f.z0 && z <= f.z1 && f.y <= y + 0.65) { if (f.under) { if (y < t0 - 1 && (u === null || f.y > u)) u = f.y; } else if (f.y > g) g = f.y; }
  if (u !== null) g = u;
  return g;
}
W3D.groundAt = groundAt;
function blocked(x, z, y) {
  if (W3D.cityBlocked && W3D.cityBlocked(x, z, y)) return true;
  for (const w of walls) if (x > w.x0 - 0.3 && x < w.x1 + 0.3 && z > w.z0 - 0.3 && z < w.z1 + 0.3 && w.y1 > y + 0.35 && w.y0 < y + 1.7) return true;
  return false;
}
W3D.blocked = blocked;

/* ---------- procedural textures ---------- */
function hcanvas(S) { const k = LITE ? 1 : 2; const c = canvas(S * k, S * k); c.getContext('2d').scale(k, k); return c; } // 2048 px textures drawn in 1024 logical units
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
  const S = 2048, c = LITE ? canvas(1024, 1024) : canvas(S, S), g = c.getContext('2d'); if (LITE) g.scale(0.5, 0.5); noiseFill(g, S, S, '#f2eee6', 0.04, LITE ? 60000 : 120000);
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
// photo PBR textures (CC0, ambientCG: Grass004, Marble014, Tiles143, WoodFloor051) - 1k on full, 512 px files on phones
function pbr(name, srgb, rep) { const t = new THREE.TextureLoader().load(BASE + 'tex/pbr/' + name + (LITE ? '_512' : '') + '.jpg?v=1'); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = LITE ? 4 : 16; if (rep) t.repeat.set(rep, rep); return t; }
W3D.pbr = pbr;
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
  g.putImageData(img, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; return t;
}
/* one shared water look for Fowling Pond, King's Pond and the rivers: blue-green, two drifting ripple layers sampled in
   world space (so overlapping water meshes match exactly), sky reflection with Fresnel from the PBR env map. */
function waterMat(alphaMap, river) {
  // clip 21: the pond read as a flat opaque dark-green plane. Now natural blue-green water: two drifting normal-mapped ripple layers
  // (one on phones), a sky reflection from the scene env map plus an analytic sky gradient weighted by a Schlick fresnel term, so the
  // water is darker looking straight down and reflects the sky toward the horizon. Pond, King's Pond and the rivers share it.
  const mat = new THREE.MeshStandardMaterial({color: 0x24474a, roughness: 0.1, metalness: 0.0, alphaMap: alphaMap || null, alphaTest: alphaMap ? 0.5 : 0,
    transparent: !!river, opacity: river ? 0.84 : 1, depthWrite: !river});
  if (W3D.env) { mat.envMap = W3D.env; mat.envMapIntensity = 0.75; }
  mat.name = 'water';
  if (!W3D.waterU) W3D.waterU = {wN: {value: rippleNormal()}, wT: {value: 0}, wNi: {value: 0}};
  mat.onBeforeCompile = sh => {
    sh.uniforms.wN = W3D.waterU.wN; sh.uniforms.wT = W3D.waterU.wT; sh.uniforms.wNi = W3D.waterU.wNi;
    sh.vertexShader = 'varying vec3 vWw;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\nvWw = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = 'uniform sampler2D wN; uniform float wT; uniform float wNi; varying vec3 vWw;\n' + sh.fragmentShader.replace('#include <normal_fragment_maps>', [
      'vec2 wp = vWw.xz;',
      'vec3 n1 = texture2D(wN, wp / 30.0 + vec2(0.011, 0.007) * wT).xyz * 2.0 - 1.0;',
      CLASSIC ? '' : 'vec3 n0 = texture2D(wN, mat2(0.6, 0.8, -0.8, 0.6) * wp / 140.0 + vec2(0.004, -0.003) * wT).xyz * 2.0 - 1.0; n1.xy += n0.xy * 0.7;',   // quality: slow broad swells
      'float wd = length(vWw - cameraPosition);',
      LITE ? 'vec2 sl = n1.xy * 0.26 * mix(1.0, 0.1, smoothstep(60.0, 450.0, wd));'
        : 'vec3 n2 = texture2D(wN, mat2(0.8, -0.6, 0.6, 0.8) * wp / 7.5 + vec2(-0.017, 0.012) * wT).xyz * 2.0 - 1.0;\n' +
          'vec2 sl = (n1.xy + n2.xy * 0.55 * (1.0 - smoothstep(25.0, 160.0, wd))) * 0.26 * mix(1.0, 0.1, smoothstep(60.0, 450.0, wd));',
      'normal = normalize((viewMatrix * vec4(normalize(vec3(sl.x, 1.0, sl.y)), 0.0)).xyz);'].join('\n'))
      .replace('#include <opaque_fragment>', [
      '{ vec3 vd = normalize(vViewPosition); float cth = clamp(dot(normal, vd), 0.0, 1.0);',
      '  float fr = 0.02 + 0.98 * pow(1.0 - cth, 5.0);',
      '  vec3 rw = inverseTransformDirection(reflect(-vd, normal), viewMatrix);',
      '  vec3 sky = mix(vec3(0.62, 0.72, 0.80), vec3(0.27, 0.45, 0.70), clamp(rw.y * 1.6, 0.0, 1.0)) * mix(1.0, 0.07, wNi);',  // night layer (daynight.js); 1.0 by day
      CLASSIC ? '  outgoingLight = mix(outgoingLight, sky, clamp(fr, 0.0, 0.55)); }' : '  outgoingLight = mix(outgoingLight * mix(1.0, 0.8, fr), sky, clamp(fr * 1.15, 0.0, 0.7)); }',
      '#include <opaque_fragment>'].join('\n'));
  };
  mat.customProgramCacheKey = () => 'jfwater2' + (CLASSIC ? 'c' : 'q') + (alphaMap ? 'a' : '') + (river ? 'r' : '') + (LITE ? 'l' : '');
  return mat;
}

/* Coplanar faces from different meshes (a trim flush with a wall, a floor slab on a floor, duplicate boxes) z-fight at any depth
   precision, and polygonOffset does nothing once logarithmic depth is on. This finds every pair of same-facing, axis-aligned,
   overlapping faces from two meshes near the buildings and nudges the smaller mesh 1.2 cm outwards so it wins cleanly. */
function deFight(root, cx, cz, rad) {
  const T = THREE, v = [new T.Vector3(), new T.Vector3(), new T.Vector3()], n = new T.Vector3(), e1 = new T.Vector3(), e2 = new T.Vector3(), buckets = new Map(), list = [];
  root.updateMatrixWorld(true);
  root.traverse(o => {
    if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh) return; const g = o.geometry; if (!g || !g.attributes.position) return;
    const pos = g.attributes.position, idx = g.index, nt = idx ? idx.count / 3 : pos.count / 3; if (nt > 6000) return;
    if (!g.boundingSphere) g.computeBoundingSphere(); const c = g.boundingSphere.center.clone().applyMatrix4(o.matrixWorld);
    if (Math.hypot(c.x - cx, c.z - cz) > rad || g.boundingSphere.radius > 150) return;
    const id = list.length; list.push({o: o, r: g.boundingSphere.radius * o.matrixWorld.getMaxScaleOnAxis(), mv: null});
    for (let t = 0; t < nt; t++) {
      for (let k = 0; k < 3; k++) v[k].fromBufferAttribute(pos, idx ? idx.getX(t * 3 + k) : t * 3 + k).applyMatrix4(o.matrixWorld);
      e1.subVectors(v[1], v[0]); e2.subVectors(v[2], v[0]); n.crossVectors(e1, e2); if (n.length() < 0.02) continue; n.normalize();
      const ax = Math.abs(n.x) > 0.999 ? 'x' : Math.abs(n.y) > 0.999 ? 'y' : Math.abs(n.z) > 0.999 ? 'z' : null; if (!ax) continue;
      const o2 = ax === 'x' ? ['y', 'z'] : ax === 'y' ? ['x', 'z'] : ['x', 'y'], sg = Math.sign(n[ax]), key = ax + sg + ':' + Math.round(v[0][ax] * 100);
      const bb = [Math.min(v[0][o2[0]], v[1][o2[0]], v[2][o2[0]]), Math.max(v[0][o2[0]], v[1][o2[0]], v[2][o2[0]]), Math.min(v[0][o2[1]], v[1][o2[1]], v[2][o2[1]]), Math.max(v[0][o2[1]], v[1][o2[1]], v[2][o2[1]])];
      let L = buckets.get(key); if (!L) buckets.set(key, L = []); L.push([id, bb, ax, sg]);
    }
  });
  let moved = 0;
  for (const L of buckets.values()) {
    if (L.length < 2 || L.length > 4000) continue;
    for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
      const A = L[i], B = L[j]; if (A[0] === B[0]) continue;
      if (Math.min(A[1][1], B[1][1]) - Math.max(A[1][0], B[1][0]) < 0.02 || Math.min(A[1][3], B[1][3]) - Math.max(A[1][2], B[1][2]) < 0.02) continue;
      const a = list[A[0]], b = list[B[0]], s = a.r <= b.r ? a : b; if (s.mv && s.mv[A[2]]) continue;
      s.mv = s.mv || {}; s.mv[A[2]] = A[3]; moved++;
    }
  }
  const d = new T.Vector3();
  for (const it of list) if (it.mv) { d.set((it.mv.x || 0) * 0.012, (it.mv.y || 0) * 0.012, (it.mv.z || 0) * 0.012);
    const par = it.o.parent; if (par) { const inv = new T.Matrix4().copy(par.matrixWorld).invert(); const p0 = new T.Vector3().setFromMatrixPosition(it.o.matrixWorld); const p1 = p0.clone().add(d); p0.applyMatrix4(inv); p1.applyMatrix4(inv); it.o.position.add(p1.sub(p0)); } }
  W3D.deFightMoved = moved; return moved;
}

/* ---------- geometry helpers ---------- */
function planarUV(m, T) { // UVs from world position (per face's dominant axis) so carved registers run continuously across neighbouring boxes
  const g = m.geometry, p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv, o = m.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i) + o.x, y = p.getY(i) + o.y, z = p.getZ(i) + o.z, ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    if (ay >= ax && ay >= az) uv.setXY(i, x / T, z / T); else if (ax >= az) uv.setXY(i, (n.getX(i) > 0 ? -z : z) / T, y / T); else uv.setXY(i, (n.getZ(i) > 0 ? x : -x) / T, y / T); }
  uv.needsUpdate = true; return m;
}
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
W3D.status = msg => { const d = document.querySelector('#load'); if (d && !d.dataset.failed) d.firstChild ? (d.firstChild.textContent = msg) : (d.textContent = msg); };
/* Image loading progress ("Loading imagery 3/7...") and failures, for every TextureLoader image (THREE.DefaultLoadingManager). */
window.W3D_LOADING = true;
THREE.DefaultLoadingManager.onProgress = (url, done, total) => { window.W3D_LOADING = done < total; if (!window.W3D_READY) W3D.status('Loading imagery ' + done + '/' + total + '...'); else if (W3D.onImagery) W3D.onImagery(done, total); };
THREE.DefaultLoadingManager.onLoad = () => { window.W3D_LOADING = false; if (W3D.onImagery) W3D.onImagery(1, 1); };
THREE.DefaultLoadingManager.onError = url => { console.error('image failed: ' + url); if (/ortho|ring_|tex\//.test(url) && window.JFVR_fail) window.JFVR_fail('An image did not load (' + url.replace(/^.*\//, '').replace(/\?.*/, '') + ').'); };
/* Lite tier: cap every texture at 1024 px (canvas art and photos; the aerial photos already come as lite files) and anisotropy 4. */
function liteShrink(img, cap) { const w = img && (img.naturalWidth || img.width), h = img && (img.naturalHeight || img.height), m = Math.max(w || 0, h || 0); if (!m || m <= cap) return null;
  const k = cap / m, c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k)); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); return c; }
W3D.liteShrink = liteShrink;
function liteTex(t, cap) { cap = cap || 1024; if (!t || !t.isTexture || t.userData.lite) return; t.userData.lite = 1; t.anisotropy = Math.min(t.anisotropy || 1, 4);
  const im = t.image; if (!im || t.isCubeTexture || t.isDataTexture || t.isRenderTargetTexture || Array.isArray(im)) return;
  if (im.src && /ortho_|ring_/.test(im.src)) return;
  let c = _shrunk.get(im); if (!c) { c = liteShrink(im, cap); if (c) { _shrunk.set(im, c); if (im.tagName === 'CANVAS') { im.width = 1; im.height = 1; } } }   // free the big canvas (iOS caps total canvas memory)
  if (c) { t.image = c; t.needsUpdate = true; } }
const _shrunk = new WeakMap();
W3D.liteTex = liteTex;
function liteTextures(obj) { obj.traverse(o => { for (const m of o.material ? [].concat(o.material) : []) for (const k in m) if (m[k] && m[k].isTexture) liteTex(m[k], (k === 'map' || k === 'emissiveMap') && m[k].wrapS !== THREE.RepeatWrapping ? 1024 : 512); }); }   // signs/text 1024 px, tiling art and normal/roughness maps 512 px   // colour 1024 px, normal/roughness 512 px
W3D.liteTextures = liteTextures;
/* Item 15 (lite): once a texture is on the GPU and has stayed unchanged for 20 s, drop its CPU-side source (canvas backing store,
   ImageBitmap, decoded <img>) and keep a 1x1 stand-in. Dynamic textures (uploaded more than once, or flagged userData.keep) and small
   canvases (< 256x256, e.g. labels that redraw) are left alone. */
const _fr = {seen: new Map(), freed: 0, bytes: 0, last: 0}; W3D.freeStats = _fr;
function freeSources(renderer, scene3, now) {
  if (now - _fr.last < 4000) return; _fr.last = now; const P = renderer.properties, one = document.createElement('canvas'); one.width = one.height = 1;
  scene3.traverse(o => { for (const m of o.material ? [].concat(o.material) : []) for (const k in m) { const t = m[k]; if (!t || !t.isTexture || t.userData.keep || t.userData.freed || t.isCubeTexture || t.isDataTexture || t.isVideoTexture || t.isRenderTargetTexture) continue;
    const im = t.image; if (!im || Array.isArray(im)) continue; const isBmp = typeof ImageBitmap !== 'undefined' && im instanceof ImageBitmap, isCan = im.tagName === 'CANVAS', isImg = im.tagName === 'IMG';
    if (!isBmp && !isCan && !isImg) continue; const w = im.width || 0, h = im.height || 0; if (isCan && w * h < 256 * 256) continue;
    const pr = P.get(t); if (!pr || !pr.__webglTexture || pr.__version !== t.version) continue;
    if (t.version > 1 && !isImg && !isBmp) { t.userData.keep = 1; continue; }   // redrawn canvas: keep
    const s0 = _fr.seen.get(t.uuid); if (!s0 || s0.v !== t.version) { _fr.seen.set(t.uuid, {v: t.version, t: now}); continue; } if (now - s0.t < 20000) continue;
    t.userData.freed = {w, h}; _fr.freed++; _fr.bytes += w * h * 4; _fr.seen.delete(t.uuid);
    if (isBmp && im.close) im.close(); if (isCan) { im.width = 1; im.height = 1; } t.image = one; } }); }
W3D.freeSources = freeSources;
/* quality: the sun's 260 m shadow box follows you (snapped to 8 m so shadows don't crawl), so trees, people and buildings near you cast
   soft shadows anywhere at home, not only around the compound. Near the compound it stays on its original centre. */
const _sv = new THREE.Vector3();
function followSun(sceneEl) {
  const R = W3D.sunRig, cam = sceneEl.camera; if (!cam || !W3D.root || !W3D.root.visible) return; cam.getWorldPosition(_sv);
  let cx = Math.round(_sv.x / 8) * 8, cz = Math.round(_sv.z / 8) * 8, cy = W3D.terrainH ? W3D.terrainH(cx, cz) : R.home.y;
  if (Math.hypot(_sv.x - R.home.x, _sv.z - R.home.z) < 70 || !isFinite(cy)) { cx = R.home.x; cz = R.home.z; cy = R.home.y; }
  if (Math.abs(cx - R.c.x) + Math.abs(cz - R.c.z) < 20) return;
  R.c.set(cx, cy, cz); R.sun.target.position.copy(R.c); R.sun.position.copy(R.c).add(R.off); R.sun.target.updateMatrixWorld(); R.sun.updateMatrixWorld();
  if (sceneEl.renderer) sceneEl.renderer.shadowMap.needsUpdate = true;
}
if (LITE) { const ld = THREE.TextureLoader.prototype.load; THREE.TextureLoader.prototype.load = function (url, onLoad, onProgress, onError) {
  return ld.call(this, url, t => { if (!/ortho_|ring_/.test(url)) { const c = liteShrink(t.image, /_nrm|_rgh/.test(url) ? 512 : 1024); if (c) { t.image = c; t.needsUpdate = true; } } t.anisotropy = Math.min(t.anisotropy || 1, 4); t.userData.lite = 1; if (onLoad) onLoad(t); }, onProgress, onError); }; }
W3D.build = function (scene3, sceneEl) {
  root = new THREE.Group(); root.name = 'w3d'; scene3.add(root); W3D.root = root;
  const renderer = sceneEl.renderer;
  // sky + environment
  const skyMat = new THREE.ShaderMaterial({side: THREE.BackSide, depthWrite: false, fog: false, uniforms: {sun: {value: new THREE.Vector3(-0.45, 0.62, 0.35).normalize()}},
    vertexShader: 'varying vec3 vd; void main(){ vd = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} ',
    fragmentShader: 'uniform vec3 sun; varying vec3 vd; void main(){ float h = clamp(vd.y,0.0,1.0); vec3 zen = vec3(0.23,0.47,0.82); vec3 hor = vec3(0.80,0.88,0.95); vec3 c = mix(hor, zen, pow(h,0.55)); if(vd.y<0.0) c = mix(hor, vec3(0.55,0.6,0.55), clamp(-vd.y*3.0,0.0,1.0)); float s = max(dot(normalize(vd), sun),0.0); c += vec3(1.0,0.9,0.7)*pow(s,400.0)*2.0 + vec3(1.0,0.85,0.6)*pow(s,8.0)*0.25; gl_FragColor = vec4(c,1.0);\n#include <colorspace_fragment>\n}'});
  const sky = new THREE.Mesh(new THREE.SphereGeometry(7000, 48, 24), skyMat); sky.renderOrder = -10; root.add(sky); W3D.sky = sky;
  try { const pm = new THREE.PMREMGenerator(renderer); const es = new THREE.Scene(); es.add(new THREE.Mesh(new THREE.SphereGeometry(100, 32, 16), skyMat)); W3D.env = pm.fromScene(es).texture; } catch (e) {}
  // radial (not view-depth) fog so the 16 km edge is fully hazed in every direction, even at the corners of the view
  THREE.ShaderChunk.fog_vertex = THREE.ShaderChunk.fog_vertex.replace('vFogDepth = - mvPosition.z;', 'vFogDepth = length( mvPosition.xyz );');
  W3D.fog = new THREE.Fog(0xcfdde8, 2000, 8200); W3D.bg = new THREE.Color(0xcfdde8); // anything past the far plane shows haze, never black
  const hemi = new THREE.HemisphereLight(CLASSIC ? 0xe3ecff : 0xd3e2ff, CLASSIC ? 0x5b6440 : 0x6b6243, 0.85); root.add(hemi);
  const sun = new THREE.DirectionalLight(CLASSIC ? 0xfff0d8 : 0xffe2b8, CLASSIC ? 1.55 : 1.68); sun.position.set(HQ.x - 260, HQ.y + 360, HQ.z + 210); sun.target.position.set(HQ.x + 20, HQ.y, HQ.z - 10);
  sun.castShadow = true; sun.shadow.mapSize.set(LITE ? 1024 : 2048, LITE ? 1024 : 2048); const sc = sun.shadow.camera; sc.left = -130; sc.right = 130; sc.top = 130; sc.bottom = -130; sc.near = 50; sc.far = 900; sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.05;
  root.add(sun); root.add(sun.target); W3D.sunRig = {sun: sun, off: sun.position.clone().sub(sun.target.position), home: sun.target.position.clone(), c: sun.target.position.clone()};
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = LITE ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap; renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true; // sun is fixed: redraw shadows ~6x/s, not every frame
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
  { // photo marble (CC0 ambientCG Marble014) for the terrace, avenue, forecourt and hall floors: one shared set of maps, 4 m tile like before
    const mc = pbr('marble_col', true), mr = pbr('marble_rgh'), mn = LITE ? null : pbr('marble_nrm');
    for (const [m, c, r] of [[M.marble, 0xf2ece2, 0.9], [M.granite, 0xcfc4b2, 0.75]]) { if (m.map) m.map.dispose(); m.map = mc; m.roughnessMap = mr; m.roughness = r; m.normalMap = mn; m.color.setHex(c); m.needsUpdate = true; } }
  W3D.M = M;
  W3D.lib = {box: box, floorOnly: floorOnly, canvas: canvas, tex: tex, starCeilingTex: starCeilingTex, HQ: HQ, walls: walls, floors: floors};
  let nd = 0; const step = x => { W3D.status('Loading terrain data ' + (++nd) + '/5...'); return x; };
  const need = r => { if (!r.ok) throw new Error(r.url.replace(/^.*\//, '').replace(/\?.*/, '') + ' HTTP ' + r.status); return r; };
  W3D.status('Loading terrain data 0/5...');
  return Promise.all([
    fetch(BASE + 'terrain_t4.u16?v=4').then(need).then(r => r.arrayBuffer()).then(step),
    fetch(BASE + 'trees_t5.f32?v=4').then(need).then(r => r.arrayBuffer()).then(step),
    fetch(BASE + 'water_t.json?v=8').then(need).then(r => r.json()).then(step),
    fetch(BASE + 'ring_mid.i16?v=1').then(r => r.ok ? r.arrayBuffer() : null).catch(() => null).then(step),
    fetch(BASE + 'ring_far.i16?v=1').then(r => r.ok ? r.arrayBuffer() : null).catch(() => null).then(step)
  ]).then(([hb, tb, wj, rmid, rfar]) => {
    W3D.status('Building the world (terrain, bank, rooms)...');
    if (rmid) RINGS.mid.h = new Int16Array(rmid); if (rfar) RINGS.far.h = new Int16Array(rfar);
    const u = new Uint16Array(hb); heights = new Float32Array(u.length); for (let i = 0; i < u.length; i++) heights[i] = u[i] * 0.01 - 10;
    W3D.water = wj; carveRail(wj.rail); parkSetup(wj.park); buildTerrain(); buildWater(wj); buildRivers(wj); buildFootbridge(wj.footbridge); buildBeach(wj.beach); buildTrees(new Float32Array(tb)); buildRail(wj.rail); buildPark(wj.park);
    buildBank(); buildOffice(); buildConservatory(); buildSigns();
    if (W3D.buildRooms) try { W3D.buildRooms(root); } catch (e) { console.warn('exhibit rooms failed', e); }
    if (W3D.buildBankPlus) try { W3D.buildBankPlus(root); } catch (e) { console.warn('bank upgrade failed', e); }
    if (W3D.buildWildlife) W3D.buildWildlife(root);
    try { deFight(root, HQ.x, HQ.z, 320); deFight(root, HQ.x, HQ.z, 320); } catch (e) { console.warn('deFight failed', e); }
    root.traverse(o => { if (o.isMesh && o.material && o.material.isMeshStandardMaterial) o.material.needsUpdate = true; });
    if (LITE) liteTextures(root);
  });
};
function buildTerrain() {
  const geo = new THREE.PlaneGeometry(SIZE, SIZE, N - 1, N - 1); geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, heights[i]);
  geo.computeVertexNormals();
  const t = new THREE.TextureLoader().load(BASE + (LITE ? 'ortho_t_lite.jpg?v=7' : 'ortho_t.jpg?v=6')); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = LITE ? 4 : 16;
  if (LITE) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; }   // item 15: no mip chain on the big lite photo (-25% of its GPU memory)
  // sharper ground near the compound and pond: 0.5 m/px USGS tile (x -324..1724, z -1249..799) + fine detail texture that fades in within ~200 m
  const hi = LITE ? t : new THREE.TextureLoader().load(BASE + 'ortho_hi_t.jpg?v=6'); hi.colorSpace = THREE.SRGBColorSpace; if (!LITE) hi.anisotropy = 16;   // lite: no 0.5 m tile (hiRect moved off the map)
  const det = detailTex(), grs = pbr('grass_col', true), grn = LITE ? null : pbr('grass_nrm');   // photo lawn (CC0) instead of the drawn blades
  const tm = new THREE.MeshLambertMaterial({map: t});
  tm.onBeforeCompile = sh => {
    sh.uniforms.hiMap = {value: hi}; sh.uniforms.detMap = {value: det}; sh.uniforms.grsMap = {value: grs}; sh.uniforms.grsN = {value: grn}; sh.uniforms.hiRect = {value: LITE ? new THREE.Vector4(1e7, 1e7, 1, 1) : new THREE.Vector4(-324, -1249, 2048, 2048)};
    sh.vertexShader = 'varying vec3 vWp;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\nvWp = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = 'uniform sampler2D hiMap; uniform sampler2D detMap; uniform sampler2D grsMap; uniform sampler2D grsN; uniform vec4 hiRect; varying vec3 vWp; float gNear = 0.0;\n' + sh.fragmentShader.replace('#include <map_fragment>', [
      'vec4 texelColor = texture2D(map, vMapUv);',
      'vec2 hu = (vWp.xz - hiRect.xy) / hiRect.zw;',
      'if (hu.x > 0.0 && hu.x < 1.0 && hu.y > 0.0 && hu.y < 1.0) { vec4 hc = texture2D(hiMap, vec2(hu.x, 1.0 - hu.y)); float e = min(min(hu.x, 1.0 - hu.x), min(hu.y, 1.0 - hu.y)); texelColor = mix(texelColor, hc, smoothstep(0.0, 0.03, e)); }',
      'float dd = length(vWp - cameraPosition); float df = 1.0 - smoothstep(60.0, 650.0, dd);',
      'float dtl = texture2D(detMap, vWp.xz / 2.5).r * 0.4 + texture2D(detMap, vWp.xz / 13.0).g * 0.35 + texture2D(detMap, vWp.xz / 0.7).r * 0.25;',
      'texelColor.rgb *= mix(1.0, 0.55 + dtl * 0.9, df);',
      'float sandy = smoothstep(0.012, 0.045, texelColor.r - texelColor.g) * smoothstep(0.22, 0.36, texelColor.r) * (1.0 - smoothstep(15.0, 320.0, dd));',   // beach sand: grain + faint wind ripples up close
      'float rip = sin(dot(vWp.xz, vec2(2.3, 1.1)) + texture2D(detMap, vWp.xz / 6.0).g * 6.0) * 0.5 + 0.5;',
      'texelColor.rgb *= mix(1.0, (0.8 + 0.4 * (texture2D(detMap, vWp.xz / 0.4).r * 0.55 + texture2D(detMap, vWp.xz / 2.6).g * 0.45)) * (0.965 + 0.05 * rip), sandy);',
      'float cano = (1.0 - smoothstep(0.05, 0.12, texelColor.g)) * smoothstep(0.0, 0.01, texelColor.g - texelColor.b) * (1.0 - smoothstep(90.0, 1500.0, dd));',   // blurry tree canopy: leaf-clump detail
      'texelColor.rgb *= mix(1.0, 0.62 + 0.75 * (texture2D(detMap, vWp.xz / 5.5).r * 0.6 + texture2D(detMap, vWp.xz / 1.7).r * 0.4), cano * 0.7);',
      'vec2 gq = mat2(0.8, 0.6, -0.6, 0.8) * vWp.xz;',   // second scale rotated so the photo tile never lines up
      'float gv = texture2D(detMap, vWp.xz / 41.0).g;',   // macro patches: lusher / drier lawn
      'vec3 gt = mix(texture2D(grsMap, vWp.xz / 2.2).rgb, texture2D(grsMap, gq / 7.3).rgb, 0.3 + 0.4 * gv) * mix(vec3(1.12, 1.04, 0.78), vec3(0.86, 1.0, 0.92), gv) * vec3(1.6, 1.5, 2.4);',
      'vec3 tint = clamp(texelColor.rgb / vec3(0.16, 0.19, 0.08), 0.35, 2.2);',
      'float gn = 1.0 - smoothstep(25.0, 220.0, dd); float veg = smoothstep(0.0, 0.05, texelColor.g - texelColor.b) * smoothstep(-0.005, 0.02, texelColor.g - texelColor.r);   // not on beach sand (red > green)',
      'vec3 gg = gt * tint; gg = mix(vec3(dot(gg, vec3(0.3, 0.59, 0.11))), gg, 0.72) * vec3(0.97, 0.9, 0.8);',   // real lawn in sun: yellower, less saturated than the photo tile
      'texelColor.rgb = mix(texelColor.rgb, gg, gn * mix(0.35, 0.8, veg)); gNear = gn * veg;',
      'diffuseColor *= texelColor;'].join('\n'));
    if (!CLASSIC && !LITE && !QUEST) sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n' +   // quality: fine ground relief within ~90 m
      '{ float bn = (1.0 - smoothstep(6.0, 90.0, dd)) * (1.0 - 0.6 * gNear); vec2 bq = vWp.xz / 1.7; float h0 = texture2D(detMap, bq).r, h1 = texture2D(detMap, bq + vec2(0.004, 0.0)).r, h2 = texture2D(detMap, bq + vec2(0.0, 0.004)).r;\n' +
      '  normal = normalize(normal + (viewMatrix * vec4((h0 - h1) * 7.0, 0.0, (h0 - h2) * 7.0, 0.0)).xyz * bn); }');
    if (grn) { sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n{ vec3 gN = texture2D(grsN, vWp.xz / 2.2).xyz * 2.0 - 1.0; normal = normalize(normal + (viewMatrix * vec4(gN.x, 0.0, -gN.y, 0.0)).xyz * 0.9 * gNear); }'); }
  };
  const mesh = new THREE.Mesh(geo, tm); mesh.receiveShadow = true; mesh.name = 'terrain'; root.add(mesh);
  W3D._terrainMat = tm; W3D._extraTex = [hi, det, grs].concat(grn ? [grn] : []);
  buildRings();
}
/* Surroundings in the same true frame (geo.json): a mid ring to +-6.1 km (64 m grid, ~3 m photo) and a far ring to +-16.4 km
   (256 m grid, ~16 m photo), both USGS 3DEP heights + USGS orthoimagery, so there is no square edge and you can fly out along Pleasant St.
   Each layer skips the cells the finer layer covers; curtains under every inner edge hide T-junction cracks. Replaceable: W3D.rings. */
function ringLayer(L, inner) {
  const n = L.n, R = L.R, S = 2 * R / (n - 1), hq = L.h; if (!hq || hq.length !== n * n) return null;
  const pos = new Float32Array(n * n * 3), uv = new Float32Array(n * n * 2), idx = [];
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const k = j * n + i, x = -R + i * S, z = -R + j * S; pos.set([x, hq[k] / 10, z], k * 3); uv.set([(x + R) / (2 * R), 1 - (z + R) / (2 * R)], k * 2); }
  for (let j = 0; j < n - 1; j++) for (let i = 0; i < n - 1; i++) {
    const x0 = -R + i * S, z0 = -R + j * S; if (x0 >= -inner - 0.1 && x0 + S <= inner + 0.1 && z0 >= -inner - 0.1 && z0 + S <= inner + 0.1) continue;
    const a = j * n + i, b = a + 1, c = a + n, d = c + 1; idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  // clip 22: until its photo has loaded (a 4096 px JPEG takes a while to decode on the Quest) a ring tile drew with an empty texture,
  // i.e. black / dark purple slabs in the distance. It now shows a neutral land colour and switches to the photo once it is ready.
  const mat = new THREE.MeshLambertMaterial({color: 0x6d7a5a}); mat.name = 'ring-placeholder';
  const t = new THREE.TextureLoader().load(BASE + L.img, tx => { if (LITE && L.name === 'ring-mid') { tx.generateMipmaps = false; tx.minFilter = THREE.LinearFilter; } mat.map = tx; mat.color.set(0xffffff); mat.name = ''; mat.needsUpdate = true; });
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const m = new THREE.Mesh(g, mat); m.name = L.name; m.userData.photo = t; root.add(m); return m;
}
function curtain(pts, drop, color) {
  const pos = [], idx = []; let k = 0;
  for (const [x, y, z] of pts) { pos.push(x, y, z, x, y - drop, z); if (k) idx.push(2 * k - 2, 2 * k - 1, 2 * k, 2 * k - 1, 2 * k + 1, 2 * k); k++; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  root.add(new THREE.Mesh(g, new THREE.MeshLambertMaterial({color: color, side: THREE.DoubleSide})));
}
function squareEdge(R, step, hf) { const p = []; for (let x = -R; x < R; x += step) p.push([x, hf(x, -R), -R]); for (let z = -R; z < R; z += step) p.push([R, hf(R, z), z]); for (let x = R; x > -R; x -= step) p.push([x, hf(x, R), R]); for (let z = R; z >= -R; z -= step) p.push([-R, hf(-R, z), z]); return p; }
function buildRings() {
  const far = new THREE.Mesh(new THREE.PlaneGeometry(400000, 400000), new THREE.MeshBasicMaterial({color: 0x9fb39a})); far.rotation.x = -Math.PI / 2; far.position.y = -30; root.add(far);
  curtain(squareEdge(HALF, SIZE / (N - 1), terrainH), 40, 0x56643c);
  W3D.rings = {mid: ringLayer(RINGS.mid, HALF), far: ringLayer(RINGS.far, RINGS.mid.R)};
  if (RINGS.mid.h) curtain(squareEdge(RINGS.mid.R, 64, ringH), 60, 0x56643c);
}
function buildWater(J) { // Fowling Pond (restored) inside the real pond bed (OSM Pine Swamp); the soft mask gives a smooth natural shoreline
  const P = J.pond, x0 = P.x0, x1 = P.x1, z0 = P.z0, z1 = P.z1, w = x1 - x0, d = z1 - z0;
  const am = new THREE.TextureLoader().load(BASE + 'pondmask_t4.png?v=3'); am.repeat.set(w / SIZE, d / SIZE); am.offset.set((x0 + HALF) / SIZE, 1 - (z1 + HALF) / SIZE);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d, 8, 4), waterMat(am)); m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2, WATER, (z0 + z1) / 2); m.receiveShadow = true; root.add(m);
}
/* Smooth river banks: the 10.7 m terrain grid makes the waterline stair-step, so each side gets a thin ground-textured strip that
   follows the (smoothed) river line: just under water at the ribbon edge, a low lip just above it, then easing into the real ground. */
function riverBanks(R, hw) {
  const tm0 = W3D._terrainMat; if (!tm0) return;
  const bm = new THREE.MeshLambertMaterial({map: tm0.map}); bm.onBeforeCompile = tm0.onBeforeCompile;
  const P = R.pts, L = R.lev, OFF = [hw - 2.5, hw + 1.5, hw + 6, hw + 15], NR = OFF.length, CV = W3D.water && W3D.water.culvert, CVL = (W3D.water && W3D.water.culverts || []).filter(c => !c.br);
  for (const sd of [-1, 1]) {
    const pos = [], uv = [], idx = []; let k = 0;
    for (let i = 0; i < P.length - 1; i++) {
      const [ax, az] = P[i], [bx, bz] = P[i + 1], len = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(len / 4)); if (len < 1e-6) continue;
      for (let j = (i ? 1 : 0); j <= n; j++) {
        const t = j / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t, w = L[i] + (L[i + 1] - L[i]) * t;
        const p0 = P[Math.max(0, i - (t === 0 ? 1 : 0))], p1 = P[Math.min(P.length - 1, i + 1 + (t === 1 ? 1 : 0))];
        let tx = p1[0] - p0[0], tz = p1[1] - p0[1]; const tl = Math.hypot(tx, tz); tx /= tl; tz /= tl;
        const nx = -tz * sd, nz = tx * sd, outer = terrainH(x + nx * OFF[NR - 1], z + nz * OFF[NR - 1]), lift = outer > w + 0.3; // no lip where the river opens into a pond or marsh
        for (let r = 0; r < NR; r++) {
          const px = x + nx * OFF[r], pz = z + nz * OFF[r], g = terrainH(px, pz);
          let y = r === 0 ? Math.min(g, w - 0.4) : r === NR - 1 ? g + 0.3 : lift ? Math.max(g + 0.3, w + (r === 1 ? 0.3 : 0.25 + (outer - w) * 0.35)) : g + 0.3; // 30 cm clear of the ground mesh: no depth fight
          if ((CVL.length ? CVL : CV ? [CV] : []).some(c => Math.hypot(px - c.x, pz - c.z) < 24)) y = Math.min(y, g - 0.4);   // the shore road crosses here on the culvert: no bank strip over the road
          pos.push(px, y, pz); uv.push((px + HALF) / SIZE, 1 - (pz + HALF) / SIZE);
        }
        if (k) for (let r = 0; r < NR - 1; r++) { const a = (k - 1) * NR + r, b = k * NR + r; if (sd < 0) idx.push(a, b, a + 1, a + 1, b, b + 1); else idx.push(a, a + 1, b, a + 1, b + 1, b); } // counter-clockwise from above on both sides
        k++;
      }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const nr = g.attributes.normal; for (let i = 0; i < nr.count; i++) if (nr.getY(i) < 0) nr.setXYZ(i, -nr.getX(i), -nr.getY(i), -nr.getZ(i));
    const m = new THREE.Mesh(g, bm); bm.side = THREE.FrontSide; // folded slivers on tight bends get culled instead of rendering black
    m.receiveShadow = true; m.name = 'riverbank'; root.add(m);
  }
}
function ribbon(P, L, hw, mat, name) { // water ribbon along a centre line; y follows the per-point water level
  const pos = [], idx = []; let k = 0;
  for (let i = 0; i < P.length - 1; i++) {
    const [ax, az] = P[i], [bx, bz] = P[i + 1], len = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(len / (hw > 10 ? 16 : 4))); if (len < 1e-6) continue;
    for (let j = (i ? 1 : 0); j <= n; j++) {
      const t = j / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t, y = L[i] + (L[i + 1] - L[i]) * t;
      const p0 = P[Math.max(0, i - (t === 0 ? 1 : 0))], p1 = P[Math.min(P.length - 1, i + 1 + (t === 1 ? 1 : 0))];
      let tx = p1[0] - p0[0], tz = p1[1] - p0[1]; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
      pos.push(x - tz * hw, y, z + tx * hw, x + tz * hw, y, z - tx * hw);
      if (k) idx.push(2 * k - 2, 2 * k - 1, 2 * k, 2 * k - 1, 2 * k + 1, 2 * k); k++;
    }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  g.setAttribute('uv', new THREE.Float32BufferAttribute(new Array(pos.length / 3 * 2).fill(0), 2)); g.computeVertexNormals();
  const nr = g.attributes.normal; for (let i = 0; i < nr.count; i++) if (nr.getY(i) < 0) nr.setXYZ(i, -nr.getX(i), -nr.getY(i), -nr.getZ(i)); // normals up regardless of winding
  const m = new THREE.Mesh(g, mat); m.receiveShadow = true; m.name = name; root.add(m); return m;
}
/* Real water only (OpenStreetMap, true frame): King's Pond outline, the Forge River from King's dam on its real course to the
   Taunton River, Pine Swamp Brook, and the Taunton River itself out in the mid ring. */
function buildRivers(J) {
  const K = J.kings, sh = new THREE.Shape(K.poly.map(([x, z]) => new THREE.Vector2(x, -z)));
  const kg = new THREE.ShapeGeometry(sh); kg.rotateX(-Math.PI / 2);
  const kp = new THREE.Mesh(kg, waterMat()); kp.position.y = K.level; kp.receiveShadow = true; kp.name = 'kings-pond'; root.add(kp);
  const rm = waterMat(null, true); rm.side = THREE.DoubleSide;
  const P0 = J.pond, inPond = (x, z) => P0 && x > P0.x0 && x < P0.x1 && z > P0.z0 && z < P0.z1;
  for (const R of J.rivers) { // ribbon edges tuck under the smoothed banks
    // where a river reaches the pond at pond level, sink it 15 cm under the (opaque) pond surface so the two never z-fight (blink)
    R.lev = R.lev.map((l, i) => inPond(R.pts[i][0], R.pts[i][1]) && l < WATER + 0.3 ? Math.min(l, WATER - 0.15) : l);
    ribbon(R.pts, R.lev, R.hw || 7, rm, R.name);
    const inCore = R.pts.filter(([x, z]) => Math.abs(x) < HALF - 30 && Math.abs(z) < HALF - 30);
    if (inCore.length > 1) { const keep = R.pts.map(([x, z]) => Math.abs(x) < HALF - 30 && Math.abs(z) < HALF - 30), P = [], L = [];
      R.pts.forEach((p, i) => { if (keep[i]) { P.push(p); L.push(R.lev[i]); } }); riverBanks({pts: P, lev: L}, R.hw || 7); }
  }
  (J.taunton || []).forEach((P, i) => ribbon(P, J.taunton_lev[i], 30, rm, 'taunton-river'));
  // Pine Swamp Brook passes under each road it crosses through a culvert: a low dark-stone headwall at each road edge, its top
  // just under the road surface (nothing stands on the carriageway), with a dark pipe mouth at the water line
  const CVS = (J.culverts || (J.culvert ? [Object.assign({w: 6.5, lev: 15.9}, J.culvert)] : [])).filter(c => !c.br);
  const hwM = new THREE.MeshStandardMaterial({color: 0x5b5850, roughness: 0.95}), moM = new THREE.MeshBasicMaterial({color: 0x0b0c0a});
  for (const C of CVS) { const ry = Math.atan2(C.nx, C.nz), top = (C.road || 17.3) - 0.3, bot = (C.lev || 15.9) - 0.6, off = (C.w || 6.5) / 2 + 1.4;
    for (const sd of [-1, 1]) { const g = new THREE.Group(); g.position.set(C.x + C.nx * off * sd, 0, C.z + C.nz * off * sd); g.rotation.y = ry + (sd > 0 ? 0 : Math.PI);
      const w = new THREE.Mesh(new THREE.BoxGeometry(7, top - bot, 0.6), hwM); w.position.y = (top + bot) / 2; g.add(w);
      const mo = new THREE.Mesh(new THREE.CircleGeometry(0.85, 14, 0, Math.PI), moM); mo.position.set(0, bot + 0.55, 0.32); g.add(mo); root.add(g); } }
  // King's dam spillway headwall (the real road over it comes from the streets layer)
  // clip 21: the dam was one floating tan plank. Now a low stone weir across the river mouth: crest flush with King's Pond, a sloping
  // apron with white water down to the river, and wing walls into both banks
  const D = J.dam; if (D) { const fr = J.rivers && J.rivers[0], rl = fr ? fr.lev[3] : K.level - 0.6, W = 20, dmM = new THREE.MeshStandardMaterial({color: 0x8a8273, roughness: 0.9});
    const crest = new THREE.Mesh(new THREE.BoxGeometry(W, K.level + 0.06 - (rl - 2.2), 1.6), dmM); crest.position.set(D.x, (K.level + 0.06 + rl - 2.2) / 2, D.z + 1.2); crest.castShadow = true; root.add(crest);
    const ap = new THREE.PlaneGeometry(W - 0.4, 3.6, 1, 6), pa = ap.attributes.position;
    for (let i = 0; i < pa.count; i++) { const t = (pa.getY(i) + 1.8) / 3.6; pa.setXYZ(i, pa.getX(i), rl + 0.05 + (K.level + 0.02 - rl) * t * t, D.z + 2.0 + (1 - t) * 3.4); }
    ap.computeVertexNormals(); const foam = new THREE.Mesh(ap, new THREE.MeshStandardMaterial({color: 0xdfe8e6, roughness: 0.55, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false}));
    foam.name = 'weir-foam'; root.add(foam);
    for (const sd of [-1, 1]) { const ww = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3.4, 7), dmM); ww.position.set(D.x + sd * (W / 2 + 0.4), rl + 0.4, D.z + 3.4); ww.castShadow = true; root.add(ww); } }
  buildBridges(J.bridges);
}
/* clip 21: Gardiner St over the Forge River below King's dam was a short grey OSM 'bridge' block with jagged road pieces either side.
   One stone bridge now carries the road (streets.js keeps the road at B.road across it): deck slab, parapets with a coping, abutments
   into both banks and two piers standing on the banks, so the river runs freely underneath. */
function buildBridges(L) {
  // Gardiner St (Josh, 1:58 AM): the road now runs straight along the deck axis (streets.js eases Gardiner St onto it over 'align' m
  // either side), and the deck is built to a real two-lane bridge: thick slab, asphalt between 17 cm granite curbs, a raised sidewalk
  // each side, parapets with a coping, and earth embankments carrying the road ramps down to the ground at both ends.
  for (const B of L || []) {
    const g = new THREE.Group(), ry = Math.atan2(-B.tz, B.tx); g.position.set(B.x, 0, B.z); g.rotation.y = ry; root.add(g);
    const sM = new THREE.MeshStandardMaterial({color: 0x9c9384, roughness: 0.88}), cM = new THREE.MeshStandardMaterial({color: 0xb7ae9c, roughness: 0.8});
    const aM = new THREE.MeshStandardMaterial({color: 0x2f3134, roughness: 0.95}), kM = new THREE.MeshStandardMaterial({color: 0x8e8a84, roughness: 0.7});
    const add = (w, h, d, x, y, z, m) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; g.add(o); return o; };
    const top = B.road, half = B.len / 2, Ld = B.len + 2, PW = 0.45, SW = B.walk || 1.6, CW = B.w / 2 - PW - SW;   // CW = half carriageway
    add(Ld, 1.2, B.w, 0, top - 0.6, 0, sM);                                   // deck slab, 1.2 m thick (top at road level)
    add(Ld, 0.14, CW * 2, 0, top + 0.07, 0, aM);                              // asphalt wearing course (top + 0.14; the road ribbon lies just above)
    for (const sd of [-1, 1]) {
      add(Ld, 0.31, 0.2, 0, top + 0.155, sd * (CW + 0.1), kM);              // curb (17 cm above the asphalt)
      add(Ld, 0.31, SW - 0.2, 0, top + 0.155, sd * (CW + 0.2 + (SW - 0.2) / 2), cM);   // sidewalk
      add(Ld, 1.0, PW, 0, top + 0.31 + 0.5, sd * (B.w / 2 - PW / 2), sM);   // parapet
      add(Ld + 0.2, 0.14, PW + 0.15, 0, top + 1.31 + 0.07, sd * (B.w / 2 - PW / 2), cM);   // coping
      add(0.25, 1.2, B.w + 0.4, 0, top - 0.6, 0, cM).position.x = sd * (half + 1.0); }
    const yb = Math.min(terrainH(B.x - half * B.tx, B.z - half * B.tz), terrainH(B.x + half * B.tx, B.z + half * B.tz)) - 2.5;
    for (const sd of [-1, 1]) { const ax = sd * (half - 0.5); add(3.0, top - 1.2 - yb, B.w + 1.2, ax, (top - 1.2 + yb) / 2, 0, sM);   // abutments
      const px = sd * (half * 0.42); add(1.6, top - 1.2 - yb, B.w - 1.0, px, (top - 1.2 + yb) / 2, 0, sM); }   // piers on the banks, clear of the channel
    // approach embankments: same smoothstep ease as the road ribbon (streets.js), top a little under the ribbon, 1:1.5 side slopes
    const E = B.ease || 20, N = 24, eM = new THREE.MeshStandardMaterial({color: 0x4a5330, roughness: 1});
    for (const sd of [-1, 1]) { const pos = [], idx = [];
      for (let i = 0; i <= N; i++) { const al = half + 1 + (E - 1) * i / N, t = 1 - (al - half) / E, w = t * t * (3 - 2 * t);
        const wx = B.x + sd * al * B.tx, wz = B.z + sd * al * B.tz, gnd = terrainH(wx, wz), ytop = Math.max(gnd, gnd + (top - gnd) * w) - 0.04, hgt = Math.max(0, ytop - gnd);
        const hw = B.w / 2, bw = hw + 1.5 * hgt + 0.5, yb2 = gnd - 1.2;
        pos.push(sd * al, ytop, -hw, sd * al, ytop, hw, sd * al, yb2, -bw, sd * al, yb2, bw);
        if (i) { const a = (i - 1) * 4, b = i * 4; idx.push(a, b, a + 1, a + 1, b, b + 1, a + 2, b + 2, a, a, b + 2, b, a + 1, b + 1, a + 3, a + 3, b + 1, b + 3); } }
      const ge = new THREE.BufferGeometry(); ge.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); ge.setIndex(idx); ge.computeVertexNormals();
      const em = new THREE.Mesh(ge, eM); em.material.side = THREE.DoubleSide; em.receiveShadow = true; g.add(em); }
    g.name = 'bridge-' + (B.name || '');
  }
}
function buildTrees(a) {
  const n = a.length / 4; const con = [], dec = [];
  // clip 26: keep the brooks and rivers open - no tree stands on a river ribbon (coarse 10 m hash of every river point, core area only)
  const rv = new Map(), RC = 10; for (const R of (W3D.water && W3D.water.rivers) || []) { const hw = (R.hw || 7) + 3; for (const [x, z] of R.pts) { if (Math.abs(x) > HALF || Math.abs(z) > HALF) continue; const k = Math.floor(x / RC) + ',' + Math.floor(z / RC); if (!rv.has(k)) rv.set(k, []); rv.get(k).push(x, z, hw); } }
  const onRiver = (x, z) => { const cx = Math.floor(x / RC), cz = Math.floor(z / RC); for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const L = rv.get((cx + i) + ',' + (cz + j)); if (L) for (let k = 0; k < L.length; k += 3) { const dx = L[k] - x, dz = L[k + 1] - z; if (dx * dx + dz * dz < L[k + 2] * L[k + 2]) return true; } } return false; };
  for (let i = 0; i < n; i++) { if (LITE && i % 5 > 1) continue; const x = a[i * 4], z = a[i * 4 + 1], s = a[i * 4 + 2], k = a[i * 4 + 3]; const y = terrainH(x, z); if (y < -5 || onRiver(x, z)) continue; (k < 0.5 ? con : dec).push([x, y, z, s]); }
  const mk = (geo, mat, list, yOff, sy, colors) => {
    const im = new THREE.InstancedMesh(geo, mat, list.length); const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sv = new THREE.Vector3(), pv = new THREE.Vector3(), col = new THREE.Color();
    list.forEach((t, i) => { q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), (i * 2.39996) % 6.283); sv.set(t[3], t[3] * sy, t[3]); pv.set(t[0], t[1] - 0.35 + yOff * t[3], t[2]);   // sunk slightly so no tree base ever hovers on slopes m4.compose(pv, q, sv); im.setMatrixAt(i, m4);
      if (colors) { col.set(colors[i % colors.length]); col.offsetHSL(0, 0, ((i * 7919) % 100) / 1000 - 0.05); im.setColorAt(i, col); } });
    im.frustumCulled = false; im.name = 'trees'; root.add(im); return im;   // named so shore.js can clear trees off its path
  };
  const trunkG = new THREE.CylinderGeometry(0.25, 0.35, 4, 5, 1, true); trunkG.translate(0, 2, 0);   // lean geometry: Quest 3S triangle budget
  mk(trunkG, M.trunk, con, 0, 1); mk(trunkG, M.trunk, dec, 0, 1);
  const coneG = new THREE.ConeGeometry(2.6, 9, 7, 1, true); coneG.translate(0, 7.5, 0);
  mk(coneG, new THREE.MeshLambertMaterial({color: 0xffffff, side: THREE.DoubleSide}), con, 0, 1, ['#26402a', '#2c472d', '#22392a', '#2f4a2f']);
  const crownG = new THREE.IcosahedronGeometry(3.8, 0); crownG.scale(1, 0.85, 1); crownG.translate(0, 6.5, 0);
  mk(crownG, new THREE.MeshLambertMaterial({color: 0xffffff, flatShading: true}), dec, 0, 1, ['#3d5a2a', '#46632e', '#3a5530', '#52683a', '#4a5e34']);
}
/* The real line passes under King Philip St (north) and E Britannia St (south) about 300 m back from the pond; it runs in a cutting
   down to a tunnel portal just short of each road, then in tunnel under the road and the restored pond. Carves the core height grid. */
function carveRail(R) {
  if (!R || !R.portals || !heights) return; R.h0 = [];
  const Lc = R.cutLen || 150, D = R.cutDepth || 7.5;
  for (const [px, pz, a] of R.portals) {
    const h0 = terrainH(px, pz); R.h0.push(h0);
    const ux = -Math.sin(a), uz = -Math.cos(a);   // away from the pond, up the approach
    for (let iz = 0; iz < N; iz++) for (let ix = 0; ix < N; ix++) {
      const x = -HALF + ix * SIZE / (N - 1), z = -HALF + iz * SIZE / (N - 1), dx = x - px, dz = z - pz, t = dx * ux + dz * uz, d = Math.abs(dx * uz - dz * ux);
      if (t < -6 || t > Lc || d > 30) continue;
      const floor = h0 - D * (1 - Math.max(0, t) / Lc), k = iz * N + ix; heights[k] = Math.min(heights[k], floor + Math.max(0, d - 5) * 0.9);
    }
  }
}
/* Concept: the Route 24 / I-495 interchange (real OSM position) dug under a park, with a great pyramid at its centre.
   The park lawn drapes over the ground (hiding the highway ribbons), each carriageway enters a cut-and-cover portal at the park edge. */
/* Pyramid park at Route 24 / I-495 (clip 17): one lawn deck ~8 m above the land on a gentle best-fit plane, a 40 m grass berm down to the
   ground all round, and the highways run UNDER it (cut-and-cover) - each carriageway leaves through a portal in a notch in the berm.
   The footprint (fp: deck edge per angle) is pulled back off the local roads and the real pond west of the interchange.
   The mid-ring heights are cut below the deck/berm before the ring mesh is built, so no ground pokes through the lawn. */
let PARK = null;
function parkSetup(P) {
  if (!P || !P.fp || !RINGS.mid.h) return;
  const L = RINGS.mid, n = L.n, S = 2 * L.R / (n - 1), h0 = L.h.slice(), TAU = Math.PI * 2, NA = P.fp.length, BERM = P.berm || 40;
  const fAt = a => { const t = (((a % TAU) + TAU) % TAU) / TAU * NA, i = Math.floor(t) % NA, j = (i + 1) % NA, fr = t - Math.floor(t); return P.fp[i] * (1 - fr) + P.fp[j] * fr; };
  const polar = (x, z) => { const u = (x - P.cx) / P.ax, v = (z - P.cz) / P.az; return [Math.atan2(v, u), Math.hypot(u, v)]; };
  const g0 = (x, z) => { const fx = (x + L.R) / S, fz = (z + L.R) / S, ix = Math.min(n - 2, Math.floor(fx)), iz = Math.min(n - 2, Math.floor(fz)), tx = fx - ix, tz = fz - iz;
    const a = h0[iz * n + ix], b = h0[iz * n + ix + 1], c = h0[(iz + 1) * n + ix], d = h0[(iz + 1) * n + ix + 1]; return (tx + tz <= 1 ? a + (b - a) * tx + (c - a) * tz : d + (c - d) * (1 - tx) + (b - d) * (1 - tz)) / 10; };
  // least-squares plane over the ring vertices inside the deck
  let s = [0, 0, 0, 0, 0, 0, 0, 0, 0], cnt = 0; const A = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], bv = [0, 0, 0];
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const x = -L.R + i * S, z = -L.R + j * S, [a, r] = polar(x, z); if (r >= fAt(a)) continue;
    const row = [1, x - P.cx, z - P.cz], y = h0[j * n + i] / 10; for (let p = 0; p < 3; p++) { bv[p] += row[p] * y; for (let q = 0; q < 3; q++) A[p][q] += row[p] * row[q]; } cnt++; }
  const det3 = m => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
  const D0 = det3(A), C = [0, 1, 2].map(k => det3(A.map((r, p) => r.map((v, q) => q === k ? bv[p] : v))) / D0);
  const deckY = (x, z) => C[0] + C[1] * (x - P.cx) + C[2] * (z - P.cz) + 8;
  const re = a => Math.hypot(Math.cos(a) * P.ax, Math.sin(a) * P.az);
  const notch = (x, z) => { for (const [px, pz, yaw] of P.portals) { const dx = -Math.sin(yaw), dz = -Math.cos(yaw), rx = x - px, rz = z - pz, along = -(rx * dx + rz * dz), lat = Math.abs(rx * dz - rz * dx);
    if (along > -2 && along < BERM + 30 && lat < 11) return true; } return false; };
  const edge = a => { const f = fAt(a); return [P.cx + Math.cos(a) * P.ax * f, P.cz + Math.sin(a) * P.az * f]; };
  const out = a => { const e = edge(a), dx = e[0] - P.cx, dz = e[1] - P.cz, l = Math.hypot(dx, dz) || 1; return [dx / l, dz / l]; };
  // surface height (deck or berm) or null when outside / in a highway notch
  const surf = (x, z, raw) => { const [a, r] = polar(x, z), fe = fAt(a); if (r <= fe) return deckY(x, z);
    const d = (r - fe) * re(a); if (d >= BERM || (!raw && notch(x, z))) return null;
    const e = edge(a), o = out(a), D = deckY(e[0], e[1]), G = g0(e[0] + o[0] * BERM, e[1] + o[1] * BERM), t = d / BERM; return G + (D - G) * (0.5 + 0.5 * Math.cos(Math.PI * t)); };
  const inDeck = (x, z, m) => { const [a, r] = polar(x, z); return r < fAt(a) - (m || 0) / re(a); };
  let cut = 0;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const x = -L.R + i * S, z = -L.R + j * S; if (Math.abs(x - P.cx) > P.ax + BERM + 70 || Math.abs(z - P.cz) > P.az + BERM + 70) continue;
    const sy = surf(x, z); if (sy === null) continue; const lim = Math.round((sy - (inDeck(x, z) ? 1.5 : 0.8)) * 10); if (L.h[j * n + i] > lim) { L.h[j * n + i] = lim; cut++; } }
  PARK = {P, fAt, polar, deckY, surf, inDeck, notch, edge, out, re, BERM, cut, plane: C};
}
function buildPark(P) {
  if (!P || !PARK) return;
  const K = PARK, TAU = Math.PI * 2, NB = 384, NR = 18, BS = 6;
  // clip 22: the deck was one flat lime-green canvas colour. Now the CC0 photo lawn (same texture as the terrain lawn, no extra GPU copy)
  // at two scales with macro patches, tinted to the aerial photo's grass. The edge/boundary is unchanged (the blend hook stays off).
  const grs = (W3D._extraTex && W3D._extraTex[2]) || pbr('grass_col', true), ringT = null;   // Josh: keep the park's boundary as it was - only the grass changes (no edge blend into the aerial photo)
  const lawnM = new THREE.MeshLambertMaterial({map: grs});
  lawnM.onBeforeCompile = sh => {
    sh.uniforms.ringMap = {value: ringT || grs}; sh.uniforms.hasRing = {value: ringT ? 1 : 0};
    sh.vertexShader = 'attribute float edgeF; varying float vEdge; varying vec3 vWp;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\nvWp = (modelMatrix * vec4(transformed, 1.0)).xyz; vEdge = edgeF;');
    sh.fragmentShader = 'uniform sampler2D ringMap; uniform float hasRing; varying float vEdge; varying vec3 vWp;\n' + sh.fragmentShader.replace('#include <map_fragment>', [
      'vec2 q2 = mat2(0.8, 0.6, -0.6, 0.8) * vWp.xz;',
      'float mac = texture2D(map, vWp.xz / 157.0).g * 0.6 + texture2D(map, q2 / 61.0).g * 0.4;',
      'vec3 gt = mix(texture2D(map, vWp.xz / 2.3).rgb, texture2D(map, q2 / 8.1).rgb, 0.35) * mix(vec3(1.0, 1.0, 0.88), vec3(0.84, 0.97, 0.92), smoothstep(0.25, 0.6, mac)) * vec3(0.6, 1.25, 2.6);',
      'gt = mix(vec3(dot(gt, vec3(0.3, 0.59, 0.11))), gt, 0.75);',
      'vec3 ph = texture2D(ringMap, vec2((vWp.x + 6144.0) / 12288.0, 1.0 - (vWp.z + 6144.0) / 12288.0)).rgb;',
      'float nz = texture2D(map, vWp.xz / 47.0).g * 0.6 + texture2D(map, q2 / 19.0).r * 0.4;',
      'float f = hasRing * smoothstep(0.32, 0.78, vEdge + (nz - 0.45) * 0.7);',
      'diffuseColor.rgb *= mix(gt, ph, f);'].join('\n'));
  };
  lawnM.customProgramCacheKey = () => 'parklawn';
  const mesh = (pos, uv, idx, name, mat, ef) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('edgeF', new THREE.Float32BufferAttribute(ef, 1)); g.setIndex(idx); g.computeVertexNormals();
    const nr = g.attributes.normal; for (let i = 0; i < nr.count; i++) if (nr.getY(i) < 0) nr.setXYZ(i, -nr.getX(i), -nr.getY(i), -nr.getZ(i)); const m = new THREE.Mesh(g, mat); m.name = name; m.receiveShadow = true; root.add(m); return m; };
  { // deck: polar grid out to the footprint edge (a plane, so every triangle is flat - no blobs)
    const pos = [], uv = [], idx = [], ef = [];
    for (let r = 0; r <= NR; r++) for (let i = 0; i < NB; i++) { const a = i / NB * TAU, f = r / NR, e = K.edge(a), x = P.cx + (e[0] - P.cx) * f, z = P.cz + (e[1] - P.cz) * f; pos.push(x, K.deckY(x, z), z); uv.push(x / 12, z / 12); ef.push(Math.max(0, (f - 0.78) / 0.22) * 0.42); }
    for (let r = 0; r < NR; r++) for (let i = 0; i < NB; i++) { const a = r * NB + i, b = r * NB + (i + 1) % NB, c = a + NB, d = b + NB; idx.push(a, b, c, b, d, c); }
    const m = mesh(pos, uv, idx, 'pyramid-park', lawnM, ef); m.material.side = THREE.DoubleSide; }
  { // berm: deck edge down to the ground; in a highway notch it drops under the ground so the cutting is open
    const pos = [], uv = [], idx = [], ef = [];
    for (let i = 0; i < NB; i++) { const a = i / NB * TAU, e = K.edge(a), o = K.out(a);
      for (let k = 0; k <= BS; k++) { const d = k / BS * K.BERM, x = e[0] + o[0] * d, z = e[1] + o[1] * d; let y = K.surf(x, z, true); if (k && K.notch(x, z)) y = terrainH(x, z) - 1.5; if (k === BS) y = Math.min(y, terrainH(x, z) - 0.4); pos.push(x, y, z); uv.push(x / 12, z / 12); ef.push(0.42 + 0.58 * k / BS); } }
    for (let i = 0; i < NB; i++) for (let k = 0; k < BS; k++) { const a = i * (BS + 1) + k, b = ((i + 1) % NB) * (BS + 1) + k; idx.push(a, b, a + 1, b, b + 1, a + 1); }   // wound to face up
    const bm = mesh(pos, uv, idx, 'park-berm', lawnM, ef); }
  // cut-and-cover portals in the deck edge, one per carriageway, with retaining walls along the open cutting
  const dark = new THREE.MeshBasicMaterial({color: 0x0a0a0a, side: THREE.DoubleSide});
  for (const [x, z, a] of P.portals) { const gy = terrainH(x, z), D = K.deckY(x, z), hh = Math.max(4, D - gy + 1.2), g2 = new THREE.Group(); g2.position.set(x, gy, z); g2.rotation.y = a;
    const wall = new THREE.Mesh(new THREE.BoxGeometry(22, hh, 2.5), M.stone); wall.position.set(0, hh / 2 - 1, 1.25); wall.castShadow = true; g2.add(wall);
    const mouth = new THREE.Mesh(new THREE.PlaneGeometry(15, Math.min(6.6, hh - 1.8)), dark); mouth.position.set(0, Math.min(6.6, hh - 1.8) / 2, 2.6); g2.add(mouth);
    for (const sx of [-1, 1]) { const wg = new THREE.BufferGeometry(), Lw = K.BERM + 4, w = 0.6, top0 = hh - 1, pts = [];
      for (const [zz, yy] of [[2.5, top0], [2.5 + Lw, -0.5]]) for (const xx of [-w, w]) pts.push([sx * 11 + xx, yy, zz], [sx * 11 + xx, -1.5, zz]);
      const v = [], I = [0, 1, 4, 1, 5, 4, 2, 6, 3, 3, 6, 7, 0, 4, 2, 2, 4, 6, 1, 3, 5, 3, 7, 5, 0, 2, 1, 1, 2, 3, 4, 5, 6, 5, 7, 6]; pts.forEach(p => v.push(...p));
      wg.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); wg.setIndex(I); wg.computeVertexNormals(); const wm = new THREE.Mesh(wg, M.stone); wm.material.side = THREE.DoubleSide; g2.add(wm); }
    root.add(g2); }
  // gravel promenade rings + two crossing walks, on the deck
  const path = new THREE.MeshLambertMaterial({color: 0xbfb08a, side: THREE.DoubleSide});
  const ribbonOn = (pts, w) => { const pp = [], ii = []; let k = 0; for (let i = 0; i < pts.length; i++) { const [x, z] = pts[i], [nx, nz] = pts[Math.min(pts.length - 1, i + 1)], [px, pz] = pts[Math.max(0, i - 1)]; let tx = nx - px, tz = nz - pz; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
      for (const sd of [-1, 1]) { const qx = x - tz * w / 2 * sd, qz = z + tx * w / 2 * sd; pp.push(qx, K.deckY(qx, qz) + 0.3, qz); } if (k) ii.push(2 * k - 2, 2 * k - 1, 2 * k, 2 * k - 1, 2 * k + 1, 2 * k); k++; }
    const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(pp, 3)); rg.setIndex(ii); rg.computeVertexNormals(); root.add(new THREE.Mesh(rg, path)); };
  for (const f of [0.42, 0.8]) { const ring = []; for (let i = 0; i <= 192; i++) { const a = i / 192 * TAU, e = K.edge(a); ring.push([P.cx + (e[0] - P.cx) * f, P.cz + (e[1] - P.cz) * f]); } ribbonOn(ring, 6); }
  for (const a of [0.6, 2.2]) { const line = []; const e1 = K.edge(a), e2 = K.edge(a + Math.PI); for (let i = 0; i <= 80; i++) { const t = 0.03 + 0.94 * i / 80; line.push([e2[0] + (e1[0] - e2[0]) * t, e2[1] + (e1[1] - e2[1]) * t]); } ribbonOn(line, 5); }
  // the pyramid: 230 m base, 146 m tall like Khufu's, white limestone casing, gold capstone that continues the faces to the apex
  const [px, pz] = P.pyr, B = 115, Ht = 146, cap = 9; let y0 = 1e9; for (const [dx, dz] of [[-B, -B], [B, -B], [-B, B], [B, B]]) y0 = Math.min(y0, K.deckY(px + dx, pz + dz)); y0 -= 0.3;
  const c = canvas(512, 512), gc = c.getContext('2d'); noiseFill(gc, 512, 512, '#cdbb94', 0.07, 30000); gc.strokeStyle = 'rgba(150,130,95,0.25)'; for (let y = 0; y < 512; y += 16) { gc.beginPath(); gc.moveTo(0, y); gc.lineTo(512, y); gc.stroke(); }
  const lt = tex(c); lt.repeat.set(10, 10);
  const capB = B * cap / Ht, pg = new THREE.CylinderGeometry(capB * Math.SQRT2, B * Math.SQRT2, Ht - cap, 4, 1, true); pg.rotateY(Math.PI / 4); pg.translate(0, (Ht - cap) / 2, 0);
  const pyr = new THREE.Mesh(pg, new THREE.MeshStandardMaterial({map: lt, roughness: 0.85, flatShading: true, envMapIntensity: 0.4})); pyr.position.set(px, y0, pz); pyr.castShadow = true; pyr.receiveShadow = true; pyr.name = 'pyramid'; root.add(pyr);
  const cg = new THREE.ConeGeometry(capB * Math.SQRT2, cap, 4, 1, false); cg.rotateY(Math.PI / 4); cg.translate(0, cap / 2, 0);   // square pyramidion, same slope as the faces
  const capM = new THREE.Mesh(cg, new THREE.MeshStandardMaterial({color: 0xd4a640, metalness: 1, roughness: 0.25, envMap: W3D.env || null, flatShading: true})); capM.position.set(px, y0 + Ht - cap, pz); capM.name = 'pyramid-cap'; root.add(capM);
  walls.push({x0: px - B * 0.8, x1: px + B * 0.8, z0: pz - B * 0.8, z1: pz + B * 0.8, y0: y0, y1: y0 + Ht * 0.2});
  // park trees: groves on the deck (shared lean tree geometry)
  const pts = []; let sd = 7; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 620; i++) { const a = rnd() * TAU, f = 0.2 + 0.74 * Math.sqrt(rnd()), e = K.edge(a), x = P.cx + (e[0] - P.cx) * f, z = P.cz + (e[1] - P.cz) * f;
    if (Math.max(Math.abs(x - px), Math.abs(z - pz)) < B + 25) continue; if (Math.abs(f - 0.42) < 0.02 || Math.abs(f - 0.8) < 0.02) continue; pts.push([x, K.deckY(x, z), z, 0.9 + rnd() * 0.5]); }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sv = new THREE.Vector3(), pv = new THREE.Vector3();
  const tg = new THREE.CylinderGeometry(0.25, 0.35, 4, 5, 1, true); tg.translate(0, 2, 0); const crg = new THREE.IcosahedronGeometry(3.8, 0); crg.scale(1, 0.85, 1); crg.translate(0, 6.5, 0);
  for (const [geo, mat] of [[tg, M.trunk], [crg, new THREE.MeshLambertMaterial({color: 0x4a6534, flatShading: true})]]) { const im = new THREE.InstancedMesh(geo, mat, pts.length);
    pts.forEach((t, i) => { q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), i * 2.4); sv.set(t[3], t[3], t[3]); pv.set(t[0], t[1] - 0.3, t[2]); m4.compose(pv, q, sv); im.setMatrixAt(i, m4); }); root.add(im); }
  W3D.parkInfo = {x: px, z: pz, y: y0, trees: pts.length, cut: K.cut, plane: K.plane.map(v => +v.toFixed(4))};
}
W3D.parkSurf = (x, z) => PARK ? PARK.surf(x, z) : null;
/* The highways are underground in the park: once the streets layer has built its ribbons / bridge decks / labels, drop the pieces over the deck. */
function clipStreetsToPark() {
  if (!PARK || !W3D.root) return false;
  const inside = (x, z) => PARK.inDeck(x, z, 2); let found = false;
  W3D.root.traverse(o => {
    if (o.isMesh && (o.name === 'road-ribbons' || o.name === 'bridge-decks') && !o.userData.parkClipped) { found = true; o.userData.parkClipped = 1;
      const g = o.geometry, p = g.attributes.position, ix = g.index; if (!ix) return; const a = ix.array, keep = [];
      for (let i = 0; i < a.length; i += 3) { const cx = (p.getX(a[i]) + p.getX(a[i + 1]) + p.getX(a[i + 2])) / 3, cz = (p.getZ(a[i]) + p.getZ(a[i + 1]) + p.getZ(a[i + 2])) / 3; if (!inside(cx, cz)) keep.push(a[i], a[i + 1], a[i + 2]); }
      if (keep.length < a.length) g.setIndex(keep);
    }
    if (o.parent && o.parent.name === 'street-labels' && inside(o.position.x, o.position.z)) o.visible = false;
  });
  return found;
}
W3D.clipStreetsToPark = clipStreetsToPark;
{ let tries = 0; const iv = setInterval(() => { if (window.W3D_READY && (clipStreetsToPark() || ++tries > 120)) { if (tries <= 120) setTimeout(clipStreetsToPark, 3000); clearInterval(iv); } }, 1000); }
/* Lake 3: viewing pull-offs on the lakeside drive, each with two timber benches on the beach facing the water */
function buildBeach(B) {
  if (!B || !B.benches || !B.benches.length) return;
  const n = B.benches.length, wood = new THREE.MeshLambertMaterial({color: 0x8d6b48}), stone = new THREE.MeshLambertMaterial({color: 0xb9ae9a}), pave = new THREE.MeshLambertMaterial({color: 0x8a8478});
  const seat = new THREE.InstancedMesh(new THREE.BoxGeometry(1.9, 0.08, 0.48), wood, n * 2), back = new THREE.InstancedMesh(new THREE.BoxGeometry(1.9, 0.42, 0.07), wood, n * 2), leg = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 0.44, 0.44), stone, n * 4), pad = new THREE.InstancedMesh(new THREE.BoxGeometry(14, 0.1, 4.5), pave, n);   // gravel pull-off beside the drive
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  B.benches.forEach(([x, z, a], i) => {   // a: yaw facing the water
    const fx = Math.sin(a), fz = Math.cos(a), rx = Math.cos(a), rz = -Math.sin(a); q.setFromAxisAngle(up, a);
    const px = x - fx * 7, pz = z - fz * 7, py = terrainH(px, pz); p.set(px, py + 0.02, pz); m4.compose(p, q, one); pad.setMatrixAt(i, m4);
    floors.push({x0: px - 4, x1: px + 4, z0: pz - 4, z1: pz + 4, y: py + 0.08});
    for (let k = 0; k < 2; k++) { const s = k ? 1.6 : -1.6, bx = x + rx * s, bz = z + rz * s, by = terrainH(bx, bz);
      p.set(bx, by + 0.46, bz); m4.compose(p, q, one); seat.setMatrixAt(i * 2 + k, m4);
      p.set(bx - fx * 0.22, by + 0.74, bz - fz * 0.22); m4.compose(p, q, one); back.setMatrixAt(i * 2 + k, m4);
      for (let l = 0; l < 2; l++) { const t = l ? 0.75 : -0.75; p.set(bx + rx * t, by + 0.22, bz + rz * t); m4.compose(p, q, one); leg.setMatrixAt(i * 4 + k * 2 + l, m4); }
      walls.push({x0: bx - 1, x1: bx + 1, z0: bz - 1, z1: bz + 1, y0: by, y1: by + 0.5}); }
  });
  for (const im of [seat, back, leg, pad]) { im.castShadow = im !== pad; im.receiveShadow = true; im.frustumCulled = false; root.add(im); }
}
/* Timber footbridge from behind Town Hall (558 South Main St) across the river to the field: gentle arch, railings, walkable deck */
function buildFootbridge(F) {
  if (!F) return;
  const [ax, az] = F.a, [bx, bz] = F.b, L = Math.hypot(bx - ax, bz - az), tx = (bx - ax) / L, tz = (bz - az) / L, W = F.w || 3, NS = Math.ceil(L / 2), yaw = Math.atan2(tx, tz);
  const yA = terrainH(ax, az) + 0.25, yB = terrainH(bx, bz) + 0.25, rise = F.rise || 1.8, yAt = t => yA + (yB - yA) * t + rise * Math.sin(Math.PI * t);
  const wood = new THREE.MeshStandardMaterial({map: pbr('wood_col', true), roughnessMap: pbr('wood_rgh'), normalMap: LITE ? null : pbr('wood_nrm'), color: 0xc9b8a0, roughness: 1}), dark = new THREE.MeshLambertMaterial({color: 0x5e4630});
  const deck = new THREE.InstancedMesh(new THREE.BoxGeometry(W, 0.22, L / NS + 0.05), wood, NS), rail = new THREE.InstancedMesh(new THREE.BoxGeometry(0.12, 0.12, L / NS + 0.05), dark, NS * 2), post = new THREE.InstancedMesh(new THREE.BoxGeometry(0.14, 1.1, 0.14), dark, (NS + 1) * 2);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), one = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
  let y0 = 1e9, y1 = -1e9;
  for (let i = 0; i < NS; i++) { const t0 = i / NS, t1 = (i + 1) / NS, tm = (t0 + t1) / 2, ya = yAt(t0), yb = yAt(t1), ym = (ya + yb) / 2, x = ax + tx * L * tm, z = az + tz * L * tm;
    e.set(-Math.atan2(yb - ya, L / NS), yaw, 0, 'YXZ'); q.setFromEuler(e); p.set(x, ym - 0.11, z); m4.compose(p, q, one); deck.setMatrixAt(i, m4);
    for (const sd of [0, 1]) { const ox = -tz * (W / 2 - 0.1) * (sd ? 1 : -1), oz = tx * (W / 2 - 0.1) * (sd ? 1 : -1); p.set(x + ox, ym + 1.0, z + oz); m4.compose(p, q, one); rail.setMatrixAt(i * 2 + sd, m4); }
    const xa = ax + tx * L * t0, za = az + tz * L * t0, xb = ax + tx * L * t1, zb = az + tz * L * t1, hw = W / 2;
    floors.push({x0: Math.min(xa, xb) - Math.abs(tz) * hw - 0.05, x1: Math.max(xa, xb) + Math.abs(tz) * hw + 0.05, z0: Math.min(za, zb) - Math.abs(tx) * hw - 0.05, z1: Math.max(za, zb) + Math.abs(tx) * hw + 0.05, y: Math.max(ya, yb)});
    y0 = Math.min(y0, ya); y1 = Math.max(y1, yb, ya); }
  for (let i = 0; i <= NS; i++) { const t = i / NS, x = ax + tx * L * t, z = az + tz * L * t, y = yAt(t);
    for (const sd of [0, 1]) { const ox = -tz * (W / 2 - 0.1) * (sd ? 1 : -1), oz = tx * (W / 2 - 0.1) * (sd ? 1 : -1); p.set(x + ox, y + 0.5, z + oz); m4.compose(p, new THREE.Quaternion(), one); post.setMatrixAt(i * 2 + sd, m4); } }
  [deck, rail, post].forEach(m => { m.castShadow = true; m.receiveShadow = true; root.add(m); }); deck.name = 'footbridge';
  // railings block walking off the sides (thin walls along each edge, the full length)
  for (const sd of [-1, 1]) { const ox = -tz * (W / 2 + 0.05) * sd, oz = tx * (W / 2 + 0.05) * sd;
    walls.push({x0: Math.min(ax, bx) + ox - (Math.abs(tz) > 0.5 ? 0.1 : 0) + (Math.abs(tx) > 0.5 ? 1.5 : 0), x1: Math.max(ax, bx) + ox + (Math.abs(tz) > 0.5 ? 0.1 : 0) - (Math.abs(tx) > 0.5 ? 1.5 : 0),
      z0: Math.min(az, bz) + oz - (Math.abs(tx) > 0.5 ? 0.1 : 0) + (Math.abs(tz) > 0.5 ? 1.5 : 0), z1: Math.max(az, bz) + oz + (Math.abs(tx) > 0.5 ? 0.1 : 0) - (Math.abs(tz) > 0.5 ? 1.5 : 0), y0: y0 - 0.3, y1: y1 + 1.2}); }
  // stone abutments at each end
  for (const [x, z, y] of [[ax, az, yA], [bx, bz, yB]]) { const s = new THREE.Mesh(new THREE.BoxGeometry(W + 1.2, 1.2, 2.2), M.stone); s.position.set(x, y - 0.7, z); s.rotation.y = yaw; root.add(s); }
  W3D.footbridge = {a: F.a, b: F.b, yA, yB, top: yAt(0.5)};
}
function buildRail(R) { // real alignment (OSM: old rail line / South Coast Rail route); it passes under the restored pond in a tunnel with a portal at each shore
  if (!R) return;
  const [pN, pS] = R.portals;
  R.portals.forEach(([x, z, a], i) => { // a = heading from the portal toward the pond; the portal sits in a cutting just short of the road above it
    const yF = terrainH(x, z), yT = Math.max(yF + 7, (R.h0 && R.h0[i]) || yF + 7.5) + 0.6, hh = yT - yF + 1.2, g = new THREE.Group(); g.position.set(x, yF, z); g.rotation.y = a;
    const wall = new THREE.Mesh(new THREE.BoxGeometry(16, hh, 3), M.stone); wall.position.set(0, yT - yF - hh / 2 + 0.2, 1.5); wall.castShadow = true; wall.receiveShadow = true; g.add(wall);
    const arch = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 6), new THREE.MeshBasicMaterial({color: 0x0b0b0b})); arch.position.set(0, 3.0, -0.03); arch.rotation.y = Math.PI; g.add(arch);
    for (const sx of [-1, 1]) { const wing = new THREE.Mesh(new THREE.BoxGeometry(1.2, hh, 22), M.stone); wing.position.set(sx * 7.4, yT - yF - hh / 2 + 0.2, -10); g.add(wing); } // retaining walls along the cutting
    root.add(g);
  });
  // ballast bed + two rails following the ground, outside the tunnel only
  const P = R.pts, segs = [[]];
  for (const p of P) { const inT = p[1] > pN[1] + 2 && p[1] < pS[1] - 2; if (inT) { if (segs[segs.length - 1].length) segs.push([]); } else segs[segs.length - 1].push(p); }
  const bal = new THREE.MeshLambertMaterial({color: 0x7a7066}), steel = new THREE.MeshStandardMaterial({color: 0x5b5048, metalness: 0.6, roughness: 0.5});
  const strip = (pts, off, w, dy, mat) => {
    const pos = [], idx = []; let k = 0;
    for (let i = 0; i < pts.length - 1; i++) { const [ax, az] = pts[i], [bx, bz] = pts[i + 1], L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(L / 6)), tx = (bx - ax) / L, tz = (bz - az) / L;
      for (let j = (i ? 1 : 0); j <= n; j++) { const x = ax + (bx - ax) * j / n, z = az + (bz - az) * j / n, cx = x - tz * off, cz = z + tx * off, y = terrainH(cx, cz) + dy;
        pos.push(cx - tz * w / 2, y, cz + tx * w / 2, cx + tz * w / 2, y, cz - tx * w / 2); if (k) idx.push(2 * k - 2, 2 * k, 2 * k - 1, 2 * k - 1, 2 * k, 2 * k + 1); k++; } }
    if (k < 2) return; const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    const nr = g.attributes.normal; for (let i = 0; i < nr.count; i++) if (nr.getY(i) < 0) nr.setXYZ(i, -nr.getX(i), -nr.getY(i), -nr.getZ(i));
    const m = new THREE.Mesh(g, mat); m.material.side = THREE.DoubleSide; m.receiveShadow = true; root.add(m);
  };
  for (const sg of segs) if (sg.length > 1) { strip(sg, 0, 3.4, 0.25, bal); strip(sg, -0.72, 0.12, 0.42, steel); strip(sg, 0.72, 0.12, 0.42, steel); }
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
    const domeM = M.stone.clone(); (W3D.stoneClones = W3D.stoneClones || []).push([domeM, 14, 4]);   // smaller courses on the curved shell; bank.js gives it the photo stone maps (shared image, no extra GPU copy)
    const outer = new THREE.Mesh(new THREE.SphereGeometry(R + 0.9, 96, 32, 0, Math.PI * 2, 0, Math.PI / 2), domeM); outer.position.copy(inner.position); outer.castShadow = true; root.add(outer);
    { const rib = new THREE.TorusGeometry(R + 0.98, 0.13, 6, 40, Math.PI / 2 - 0.12); const ribs = new THREE.InstancedMesh(rib, M.stone, 16), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
      for (let i = 0; i < 16; i++) { e.set(0, i / 16 * Math.PI * 2, 0, 'YXZ'); q.setFromEuler(e); m4.compose(inner.position, q, new THREE.Vector3(1, 1, 1)); ribs.setMatrixAt(i, m4); }   // 16 meridian ribs
      ribs.castShadow = true; ribs.frustumCulled = false; root.add(ribs);
      const drum = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.25, 1.1, 24), M.stone); drum.position.set(dc.x, inner.position.y + R + 0.55, dc.z); root.add(drum); }   // lantern drum under the finial
    const fin = new THREE.Mesh(new THREE.SphereGeometry(0.6, 24, 16), M.gold); fin.position.set(dc.x, inner.position.y + R + 1.6, dc.z); root.add(fin);
    const lamp = new THREE.PointLight(0xffe2b0, 0.5, 14); lamp.position.set(dc.x, y0 + 5, dc.z); root.add(lamp);
  }
  box(16, 0.4, 56, 845, y0 - 0.1, zc, M.marble, {floor: true, collide: false, T: 4});
  box(0.8, 1.05, 56, 837.4, y0, zc, M.stone, {});            // parapet facing pond
  box(16, 1.05, 0.8, 845, y0, zc - 28, M.stone, {}); box(16, 1.05, 0.8, 845, y0, zc + 28, M.stone, {});
  // sphinx avenue
  box(38, 0.3, 10, 872, y0 - 0.1, zc, M.marble, {floor: true, collide: false});
  { const sp = []; for (let i = 0; i < 6; i++) for (const s of [-1, 1]) sp.push([857 + i * 6, y0, zc + s * 7.5]); sphinxes(sp); }
  // obelisks
  for (const s of [-1, 1]) obelisk(890, y0, zc + s * 12, 22);
  // pylon (two battered towers + gateway)
  for (const s of [-1, 1]) {
    const zt = zc + s * 17;
    planarUV(box(7, 22, 26, 896, y0, zt, M.relief, {batter: 0.9, batterZ: 1.6, T: 6}), 6);
    box(8, 1.2, 27.5, 896, y0 + 22, zt, M.stone, {collide: false});     // cavetto cornice (simplified)
    box(0.3, 14, 1.5, 892.3, y0 + 0.5, zt - s * 3, M.gold, {collide: false}); // flagpole mast (gilded)
  }
  planarUV(box(6.4, 3, 12, 896, y0 + 14, zc, M.relief, {collide: false}), 6);    // lintel over gate (12 deep so it beds into both battered towers - no gaps); same world-aligned carving as the towers
  const disk = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.3, 32), M.gold); disk.rotation.z = Math.PI / 2; disk.position.set(892.3, y0 + 15.5, zc); root.add(disk);   // the gold sun disc (Josh: keep exactly); the winged sun, cornice and jamb framing around it are in bank.js gateFrame()
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
function sphinxes(list) { // w3d/sphinx.js: scanned museum head + procedural lion body, one instanced mesh per part for the whole avenue, lighter on phones
  const P = sphinxParts(LITE), m4 = new THREE.Matrix4();
  const sand = new THREE.MeshStandardMaterial({color: 0xcda774, roughness: 0.82}), stone = new THREE.MeshStandardMaterial({color: 0xb38e5f, roughness: 0.9});
  const inst = (geo, mat) => { const im = new THREE.InstancedMesh(geo, mat, list.length); im.castShadow = !LITE; im.receiveShadow = true; im.frustumCulled = false;
    list.forEach(([x, y, z], i) => { m4.makeTranslation(x, y, z); im.setMatrixAt(i, m4); }); root.add(im); };
  inst(P.sand, sand); inst(P.dark, stone);
  sphinxHead(LITE, BASE).then(g => inst(g, new THREE.MeshStandardMaterial({color: 0xcda774, roughness: 0.82, vertexColors: true}))).catch(e => console.warn('sphinx head', e));
  for (const [x, y, z] of list) walls.push({x0: x - 2.5, x1: x + 2.5, z0: z - 1.25, z1: z + 1.25, y0: y, y1: y + 3.4});
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
  floorOnly(S + 2, S + 2, x, fy + Hh + 1.4, z);   // roof top: a slab for fly mode (no flying up through the office ceiling)
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
  // rectangular desk + chair moved intact from the centre to the east side wall (centre now holds the round desk, w3d/office.js);
  // same pieces turned 90 deg: desk along the wall, chair between desk and window, you sit facing into the room
  const dx = x + 6.3; box(1.4, 0.12, 3.2, dx, fy + 0.78, z, M.granite, {collide: false}); box(1.2, 0.78, 0.4, dx, fy, z - 1.4, M.marble, {}); box(1.2, 0.78, 0.4, dx, fy, z + 1.4, M.marble, {});
  box(0.7, 0.5, 0.7, dx + 1.1, fy, z, M.marble, {collide: false}); box(0.12, 1.0, 0.7, dx + 1.42, fy + 0.5, z, M.marble, {collide: false});
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
  const cgM = new THREE.MeshStandardMaterial({color: 0xcfe6ec, transparent: true, opacity: 0.28, roughness: 0.05, metalness: 0.2, depthWrite: false, side: THREE.DoubleSide});
  const pane = (w, cx, cz, rot) => { const g = new THREE.Mesh(new THREE.PlaneGeometry(w, Hc - 1.4), cgM); g.position.set(cx, y0 + 1.1 + (Hc - 1.4) / 2, cz); g.rotation.y = rot; root.add(g); };
  for (const zz of [z0, z1]) for (let x = x0; x < x1; x += 4) { if (zz === z0 && x === 908) continue; if (zz === z0 && x === 912) continue; box(4, 0.8, 0.5, x + 2, y0 + 0.3, zz, M.stone, {}); pane(3, x + 2, zz, 0); walls.push({x0: x, x1: x + 4, z0: zz - 0.2, z1: zz + 0.2, y0: y0, y1: y0 + Hc}); }
  for (const xx of [x0, x1]) for (let z = z0; z < z1; z += 4) { box(0.5, 0.8, 4, xx, y0 + 0.3, z + 2, M.stone, {}); pane(3, xx, z + 2, Math.PI / 2); walls.push({x0: xx - 0.2, x1: xx + 0.2, z0: z, z1: z + 4, y0: y0, y1: y0 + Hc}); }
  box(4, Hc - 3, 0.6, 910, y0 + 3.3 + 0, z0, M.relief, {collide: false});
  box(x1 - x0 + 1, 0.7, 1.0, (x0 + x1) / 2, y0 + Hc, z0, M.stone, {collide: false}); box(x1 - x0 + 1, 0.7, 1.0, (x0 + x1) / 2, y0 + Hc, z1, M.stone, {collide: false});
  box(1.0, 0.7, z1 - z0, x0, y0 + Hc, (z0 + z1) / 2, M.stone, {collide: false}); box(1.0, 0.7, z1 - z0, x1, y0 + Hc, (z0 + z1) / 2, M.stone, {collide: false});
  // glazed roof: a low gable of glass resting directly on the entablature (no gap), bronze rafters every 4 m, ridge, eaves and glass gable ends
  { const ye = y0 + Hc + 0.7, rise = 4.2, zm = (z0 + z1) / 2, xa = x0 - 0.5, xb = x1 + 0.5;
    const gM = new THREE.MeshStandardMaterial({color: 0xcfe6ec, transparent: true, opacity: 0.3, roughness: 0.05, metalness: 0.2, depthWrite: false, side: THREE.DoubleSide});
    const fM = new THREE.MeshStandardMaterial({color: 0x3b3428, roughness: 0.5, metalness: 0.4});
    const tri = (pts) => { const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts.flat(), 3)); geo.setIndex(pts.length === 4 ? [0, 1, 2, 0, 2, 3] : [0, 1, 2]); geo.computeVertexNormals(); const m = new THREE.Mesh(geo, gM); m.renderOrder = 3; root.add(m); };
    for (const ze of [z0, z1]) tri([[xa, ye, ze], [xb, ye, ze], [xb, ye + rise, zm], [xa, ye + rise, zm]]);
    for (const xe of [x0, x1]) tri([[xe, ye, z0], [xe, ye, z1], [xe, ye + rise, zm]]);
    const bar = (a, b, r) => { const d = new THREE.Vector3().subVectors(b, a), m = new THREE.Mesh(new THREE.BoxGeometry(r, d.length(), r), fM); m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); root.add(m); };
    const V = (a, b, c) => new THREE.Vector3(a, b, c);
    for (let x = x0; x <= x1 + 0.01; x += 4) for (const ze of [z0, z1]) bar(V(x, ye, ze), V(x, ye + rise, zm), 0.16);
    bar(V(xa, ye + rise, zm), V(xb, ye + rise, zm), 0.3);
    for (const ze of [z0, z1]) bar(V(xa, ye + rise / 2, (ze + zm) / 2), V(xb, ye + rise / 2, (ze + zm) / 2), 0.1);
    for (const xe of [x0, x1]) for (const f of [0.33, 0.67]) bar(V(xe, ye, z0 + (z1 - z0) * f), V(xe, ye + rise * (1 - Math.abs(f - 0.5) * 2), z0 + (z1 - z0) * f), 0.12);
    // horizontal glazing bars in the wall panes
    for (const zz of [z0, z1]) bar(V(x0, y0 + 1.1 + (Hc - 1.4) / 2, zz), V(x1, y0 + 1.1 + (Hc - 1.4) / 2, zz), 0.1);
    for (const xx of [x0, x1]) bar(V(xx, y0 + 1.1 + (Hc - 1.4) / 2, z0), V(xx, y0 + 1.1 + (Hc - 1.4) / 2, z1), 0.1);
  }
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
  ['Concept rendering only - not a survey, design or real institution.', 'Fowling Pond restored per Restoration Plan v6 (approximate):', 'pond refilled in its real basin (Pine Swamp), Forge River to the Taunton,', 'rail in tunnel, quarry/yard regraded to forested hill, Thrasher St moved.', 'Elevation: USGS 3DEP. Imagery: USGS National Map (public domain).', 'Buildings, plants and animals: procedural concept models.'].forEach((s, i) => g.fillText(s, 512, 150 + i * 56));
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
  pyramid: () => { const P = W3D.water && W3D.water.park; if (!P) return; JFVR.fly = true; const l = document.querySelector('#flylabel'); if (l) l.setAttribute('value', 'Fly: ON'); JFVR.hud && JFVR.hud('Pyramid park - Route 24 / I-495 (concept)'); W3D.teleportTo(P.pyr[0] - 520, terrainH(P.pyr[0] - 520, P.pyr[1]) + 90, P.pyr[1] + 40, -90); },
  pond: () => { JFVR.fly = true; JFVR.hud && JFVR.hud('Fly mode ON - over Fowling Pond'); const l = document.querySelector('#flylabel'); if (l) l.setAttribute('value', 'Fly: ON'); W3D.teleportTo(300, 140, -250, 90); }
};
// desktop: Space / Shift = up / down while flying
const keys = {};
document.addEventListener('keydown', e => { keys[e.code] = true; }); document.addEventListener('keyup', e => { keys[e.code] = false; });
AFRAME.registerComponent('w3d-keys', { tick: function (t, dt) { if (!W3D.active || !JFVR.fly || !dt) return; const p = this.el.object3D.position, s = (W3D.flyVSpeed || 30) * dt / 1000; if (keys.Space) p.y += s; if (keys.ShiftLeft || keys.ShiftRight) p.y -= s; if (W3D.waterNormal) {} } });
const _cp = new THREE.Vector3(); let _sf = 0;
AFRAME.registerComponent('w3d-anim', { tick: function (t, dt) { if (W3D.waterU) W3D.waterU.wT.value = t / 1000; if (LITE && this.el.sceneEl.renderer) freeSources(this.el.sceneEl.renderer, this.el.sceneEl.object3D, t); if (!W3D.active) return; if (W3D.tickWildlife) W3D.tickWildlife(t, dt); if (W3D.tickRooms) W3D.tickRooms(t, dt);
  if (!CLASSIC && W3D.sunRig && _sf % 30 === 0) followSun(this.el.sceneEl);
  const r = this.el.renderer, N = r && r.xr && r.xr.isPresenting ? (W3D.xrSlow ? 0 : 90) : 12; if (r && N && ++_sf % N === 0) r.shadowMap.needsUpdate = true; /* headset: rare shadow refreshes, none while frames run late */
  if (W3D.sky && this.el.camera) { this.el.camera.getWorldPosition(_cp); W3D.sky.position.copy(_cp); } } });
// lifts between hall and office
AFRAME.registerComponent('w3d-lift', { schema: {to: {type: 'string'}}, init: function () { this.el.addEventListener('click', () => { if (this.data.to === 'office') W3D.spots.office(); else W3D.teleportTo(958, HQ.y + 0.3, HQ.z, -90); JFVR.hud && JFVR.hud(this.data.to === 'office' ? "Josh's office - top floor" : 'Banking hall'); }); } });
})();
