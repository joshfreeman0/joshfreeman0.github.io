/* Fowling Pond - the gold Egyptian bank ("central command"): quality pass, vault hall and account board.
   Concept rendering only: not a real bank, account, balance or engineering design.
   Textures: procedural art (w3d/tex/*.jpg made with numpy, or drawn on canvas) plus CC0 photo PBR sets from ambientCG in w3d/tex/pbr. */
(function () {
/* ===== Josh's account (concept display) - change the balance here ===== */
const ACCOUNT = {
  holder: 'Josh Freeman',
  balance: 5000000000000,               // US dollars (five trillion)
  purpose: 'Fowling Pond Restoration Plan v6 fund (estimate ~$3.19B)',
  planEstimate: 3.19e9
};
window.JF_ACCOUNT = ACCOUNT;

const TEX = '/vr/w3d/tex/', TV = '?v=1';
const V = {x0: 927, x1: 963, z0: -398, z1: -362, y: 24, top: 33.6, zc: -380};   // vault hall interior (under the banking hall)
const C = {x0: 963.9, x1: 977, z0: -388, z1: -372, y: 24.4};                      // inner gold chamber behind the round door
const DOOR = {x: 963, y: 27.7, z: -380, r: 3.3};
let L, M, root, R, envOut, envIn, P = null, vaultG = null, frames = 0;
const anim = [];

/* ---------- small helpers ---------- */
const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
function ctex(c, srgb, rx, ry) { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 16; if (rx) t.repeat.set(rx, ry || rx); return t; }
function ltex(name, srgb) { const t = new THREE.TextureLoader().load(TEX + name + TV); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 16; return t; }
function std(o, env) { const m = new THREE.MeshStandardMaterial(o); m.envMap = env || envOut; m.envMapIntensity = o.envMapIntensity || 1; return m; }
function mesh(geo, mat, x, y, z, parent, opt) { const m = new THREE.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); opt = opt || {}; m.castShadow = !!opt.cast; m.receiveShadow = opt.receive !== false; (parent || P || root).add(m); return m; }
function scaleUV(geo, sx, sy) { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * sx, uv.getY(i) * (sy === undefined ? sx : sy)); uv.needsUpdate = true; return geo; }
function vbox(w, h, d, x, y, z, mat, opt) { opt = Object.assign({shadow: false, collide: true, parent: P || root}, opt || {}); const m = L.box(w, h, d, x, y, z, mat, opt); if (opt.collide !== false) L.walls[L.walls.length - 1].y0 = y; return m; }
function underFloor(x0, x1, z0, z1, y) { L.floors.push({x0: x0, x1: x1, z0: z0, z1: z1, y: y, under: true}); }
// tangent-space normal map from a height field drawn on a canvas (wraps, so tiling textures stay seamless)
function normalFromHeight(hf, S, strength) {
  const c = cv(S, S), g = c.getContext('2d'), img = g.createImageData(S, S), d = img.data;
  for (let y = 0; y < S; y++) { const ym = ((y - 1 + S) % S) * S, yp = ((y + 1) % S) * S, yr = y * S;
    for (let x = 0; x < S; x++) { const xm = (x - 1 + S) % S, xp = (x + 1) % S;
      const dx = (hf[yr + xp] - hf[yr + xm]) * strength, dy = (hf[yp + x] - hf[ym + x]) * strength, l = 1 / Math.sqrt(dx * dx + dy * dy + 1), i = (yr + x) * 4;
      d[i] = (-dx * l * 0.5 + 0.5) * 255; d[i + 1] = (dy * l * 0.5 + 0.5) * 255; d[i + 2] = (l * 0.5 + 0.5) * 255; d[i + 3] = 255; } }
  g.putImageData(img, 0, 0); return ctex(c, false);
}
function blur3(h, S) { const o = new Float32Array(S * S); for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { let s = 0; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) s += h[((y + j + S) % S) * S + ((x + i + S) % S)]; o[y * S + x] = s / 9; } return o; }
// height from "how different is this pixel from the plain background colour" -> carved (sunk) motifs
function carvedNormal(src, S, bg, strength, raised) {
  const c = cv(S, S), g = c.getContext('2d'); g.drawImage(src, 0, 0, S, S); const d = g.getImageData(0, 0, S, S).data, h = new Float32Array(S * S);
  for (let i = 0; i < S * S; i++) { const dr = d[i * 4] - bg[0], dg = d[i * 4 + 1] - bg[1], db = d[i * 4 + 2] - bg[2]; const m = Math.min(1, Math.sqrt(dr * dr + dg * dg + db * db) / 70); h[i] = raised ? m : 1 - m; }
  return normalFromHeight(blur3(blur3(h, S), S), S, strength);
}

let _fr = null;
function friezeTex() { if (!_fr) { const c = friezeCanvas(); _fr = {map: ctex(c, true), nrm: carvedNormal(c, 1024, [230, 207, 159], 5, false)}; } return _fr; }
function lumNormal(img, W, H, strength) { // photo of a carved relief -> height from luminance (light = raised)
  const c = cv(W, H), g = c.getContext('2d'); g.drawImage(img, 0, 0, W, H); const d = g.getImageData(0, 0, W, H).data, h = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) h[i] = (d[i * 4] * 0.3 + d[i * 4 + 1] * 0.55 + d[i * 4 + 2] * 0.15) / 255;
  const b = new Float32Array(W * H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let s = 0, n = 0; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const yy = y + j, xx = x + i; if (yy >= 0 && yy < H && xx >= 0 && xx < W) { s += h[yy * W + xx]; n++; } } b[y * W + x] = s / n; }
  return rectNormal(b, W, H, strength);
}
/* ---------- environment maps (reflections) ---------- */
function makeEnvs() {
  const pm = new THREE.PMREMGenerator(R);
  // outdoor: sky dome, warm sun, hazy horizon and sunlit fields below (so gold reflects a real landscape, not only blue)
  const sm = new THREE.ShaderMaterial({side: THREE.BackSide, depthWrite: false,
    uniforms: {sun: {value: new THREE.Vector3(-0.53, 0.62, 0.43).normalize()}},
    vertexShader: 'varying vec3 vd; void main(){ vd = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} ',
    fragmentShader: 'uniform vec3 sun; varying vec3 vd; void main(){ vec3 d = normalize(vd); float h = d.y; vec3 zen = vec3(0.10,0.27,0.65), hor = vec3(0.72,0.80,0.88), gnd = vec3(0.16,0.19,0.08), soil = vec3(0.32,0.26,0.16);' +
      'vec3 c = h > 0.0 ? mix(hor, zen, pow(h, 0.5)) : mix(mix(hor*0.8, soil, clamp(-h*6.0,0.0,1.0)), gnd, clamp(-h*2.0,0.0,1.0)); float s = max(dot(d, sun), 0.0);' +
      'c += vec3(1.0,0.9,0.75)*pow(s, 600.0)*60.0 + vec3(1.0,0.85,0.6)*pow(s, 12.0)*0.6; float tree = step(0.0, h) * step(h, 0.035 + 0.02*sin(d.x*40.0)*sin(d.z*33.0)); c = mix(c, vec3(0.13,0.2,0.1), tree*0.8); gl_FragColor = vec4(c, 1.0); }'});
  const es = new THREE.Scene(); es.add(new THREE.Mesh(new THREE.SphereGeometry(100, 64, 32), sm));
  envOut = pm.fromScene(es, 0.02).texture;
  // vault: warm dark stone room with bright lamp panels and gold glints
  const vs = new THREE.Scene(), b = (w, h, d, x, y, z, r, gg, bb) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({side: THREE.BackSide})); m.material.color.setRGB(r, gg, bb); m.position.set(x, y, z); vs.add(m); return m; };
  b(40, 12, 40, 0, 4, 0, 0.22, 0.17, 0.11);
  const lamp = (x, z) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), new THREE.MeshBasicMaterial({side: THREE.DoubleSide})); m.material.color.setRGB(9, 7, 4.5); m.rotation.x = Math.PI / 2; m.position.set(x, 9.9, z); vs.add(m); };
  for (const x of [-12, 0, 12]) for (const z of [-10, 10]) lamp(x, z);
  for (const s of [-1, 1]) { const g = new THREE.Mesh(new THREE.BoxGeometry(36, 3, 1), new THREE.MeshBasicMaterial()); g.material.color.setRGB(0.9, 0.6, 0.18); g.position.set(0, 0, s * 19); vs.add(g); }
  const wall = new THREE.Mesh(new THREE.BoxGeometry(1, 5, 30), new THREE.MeshBasicMaterial()); wall.material.color.setRGB(0.5, 0.42, 0.3); wall.position.set(19, 3, 0); vs.add(wall);
  envIn = pm.fromScene(vs, 0.03).texture; W3D.envOut = envOut; W3D.envIn = envIn;
  pm.dispose();
}

/* ---------- procedural canvas textures ---------- */
function capitalCanvas() { // papyrus/lotus bell capital: 16 sepal petals, gold edged, painted green / lapis
  const W = 1024, H = 512, c = cv(W, H), g = c.getContext('2d'), n = 16, pw = W / n; g.fillStyle = '#d9c190'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < n; i++) { const x = i * pw;
    g.fillStyle = i % 2 ? '#2d7a52' : '#1f5fa8'; g.beginPath(); g.moveTo(x + pw * 0.5, 30); g.quadraticCurveTo(x + pw * 1.02, H * 0.55, x + pw * 0.5, H - 4); g.quadraticCurveTo(x - pw * 0.02, H * 0.55, x + pw * 0.5, 30); g.fill();
    g.strokeStyle = '#e8bf45'; g.lineWidth = 6; g.stroke(); g.strokeStyle = 'rgba(255,240,200,0.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x + pw * 0.5, 60); g.lineTo(x + pw * 0.5, H - 40); g.stroke(); }
  g.fillStyle = '#e8bf45'; g.fillRect(0, 0, W, 26); g.fillStyle = '#b5342b'; g.fillRect(0, H - 30, W, 30); g.fillStyle = '#e8bf45'; g.fillRect(0, H - 36, W, 6);
  return c;
}
function capitalNormal() { const W = 512, n = 16, pw = W / n, h = new Float32Array(W * W);
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) { const t = (x % pw) / pw, v = y / W; const half = 0.5 * Math.sin(Math.PI * Math.min(1, v * 1.1)) + 0.02; const dd = Math.abs(t - 0.5); h[y * W + x] = dd < half ? Math.cos(dd / half * Math.PI / 2) : 0; }
  return normalFromHeight(blur3(h, W), W, 6);
}
function bandCanvas() { const c = cv(64, 256), g = c.getContext('2d'); const cols = ['#e8bf45', '#1f5fa8', '#e8bf45', '#b5342b', '#e8bf45', '#2d7a52'];
  cols.forEach((k, i) => { g.fillStyle = k; g.fillRect(0, i * 256 / 6, 64, 256 / 6); }); g.fillStyle = 'rgba(0,0,0,0.25)'; for (let i = 0; i < 6; i++) g.fillRect(0, i * 256 / 6, 64, 2); return c; }
function corniceCanvas() { // cavetto gorge: tall painted leaves (repeat along the cornice), gold fillets
  const c = cv(256, 512), g = c.getContext('2d'); const cols = ['#1f5fa8', '#e8bf45', '#b5342b', '#e8bf45', '#2d7a52', '#e8bf45'];
  for (let i = 0; i < 6; i++) { const y = i * 512 / 6; g.fillStyle = cols[i]; g.fillRect(0, y, 256, 512 / 6); const gr = g.createLinearGradient(0, 0, 256, 0); gr.addColorStop(0, 'rgba(0,0,0,0.25)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.08)'); gr.addColorStop(1, 'rgba(0,0,0,0.3)'); g.fillStyle = gr; g.fillRect(0, y, 256, 512 / 6); g.fillStyle = '#3a2a14'; g.fillRect(0, y, 256, 3); }
  return c;
}
function friezeCanvas() { // carved & painted band: lapis/gold borders, khekher crest, cartouche register (stylised, not real text)
  const W = 2048, H = 512, c = cv(W, H), g = c.getContext('2d'); g.fillStyle = '#e6cf9f'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#1f5fa8'; g.fillRect(0, 0, W, 34); g.fillStyle = '#e8bf45'; g.fillRect(0, 34, W, 12);
  for (let x = 0; x < W; x += 64) { g.fillStyle = ['#1f5fa8', '#b5342b', '#2d7a52'][(x / 64) % 3]; g.beginPath(); g.moveTo(x + 10, 150); g.lineTo(x + 10, 80); g.arc(x + 32, 80, 22, Math.PI, 0); g.lineTo(x + 54, 150); g.closePath(); g.fill(); g.fillStyle = '#e8bf45'; g.beginPath(); g.arc(x + 32, 74, 9, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = '#e8bf45'; g.fillRect(0, 156, W, 10);
  const glyph = (k, x, y, col) => { g.save(); g.translate(x, y); g.fillStyle = col; g.strokeStyle = col; g.lineWidth = 7; g.lineCap = 'round';
    if (k === 0) { g.beginPath(); g.ellipse(0, -30, 14, 20, 0, 0, Math.PI * 2); g.stroke(); g.fillRect(-28, -8, 56, 9); g.fillRect(-5, -8, 10, 64); }                // ankh
    else if (k === 1) { g.fillRect(-9, -50, 18, 104); for (let i = 0; i < 4; i++) g.fillRect(-26, -50 + i * 11, 52, 6); }                                      // djed
    else if (k === 2) { g.beginPath(); g.moveTo(-6, 56); g.lineTo(-6, -40); g.lineTo(-22, -52); g.moveTo(-6, -40); g.lineTo(14, -48); g.stroke(); g.beginPath(); g.moveTo(-6, 56); g.lineTo(6, 46); g.stroke(); } // was sceptre
    else if (k === 3) { g.beginPath(); g.ellipse(0, -10, 34, 15, 0, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.arc(0, -10, 9, 0, Math.PI * 2); g.fill(); g.beginPath(); g.moveTo(-8, 6); g.lineTo(-14, 40); g.moveTo(8, 6); g.quadraticCurveTo(30, 36, 38, 18); g.stroke(); } // eye
    else { g.beginPath(); g.arc(0, 0, 26, 0, Math.PI * 2); g.fill(); g.fillStyle = '#b5342b'; g.beginPath(); g.arc(0, 0, 12, 0, Math.PI * 2); g.fill(); }        // sun disk
    g.restore(); };
  const cols = ['#1f5fa8', '#b5342b', '#2d7a52', '#c79a1e', '#22324a'];
  for (let i = 0; i < 16; i++) { const x = i * 128 + 64;
    if (i % 4 === 0) { g.strokeStyle = '#8a6a2a'; g.lineWidth = 6; g.beginPath(); g.ellipse(x, 330, 50, 130, 0, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.moveTo(x - 50, 470); g.lineTo(x + 50, 470); g.stroke(); glyph(4, x, 260, '#d9a520'); glyph(0, x, 390, cols[i % 5]); }
    else { glyph(i % 4, x, 270, cols[i % 5]); glyph((i + 2) % 4, x, 400, cols[(i + 2) % 5]); } }
  g.fillStyle = '#e8bf45'; g.fillRect(0, H - 40, W, 10); g.fillStyle = '#b5342b'; g.fillRect(0, H - 30, W, 30);
  return c;
}
function doorCanvas() { // gilded bronze door leaf: 2 x 5 recessed panels with rosettes and an ankh boss
  const W = 512, H = 1536, c = cv(W, H), g = c.getContext('2d'); g.fillStyle = '#b38a3e'; g.fillRect(0, 0, W, H);
  const h = new Float32Array(256 * 768);
  for (let r = 0; r < 5; r++) for (let k = 0; k < 2; k++) { const x = 40 + k * 226, y = 40 + r * 296, w = 206, hh = 276;
    g.fillStyle = '#8f6a2c'; g.fillRect(x, y, w, hh); g.fillStyle = '#c99b45'; g.fillRect(x + 18, y + 18, w - 36, hh - 36);
    g.fillStyle = '#e3bb5e'; g.beginPath(); for (let p = 0; p < 16; p++) { const a = p / 16 * Math.PI * 2, rr = p % 2 ? 22 : 46; g.lineTo(x + w / 2 + Math.cos(a) * rr, y + hh / 2 + Math.sin(a) * rr); } g.closePath(); g.fill(); }
  for (let y = 0; y < 768; y++) for (let x = 0; x < 256; x++) { const X = x * 2, Y = y * 2; let v = 1; for (let r = 0; r < 5; r++) for (let k = 0; k < 2; k++) { const px = 40 + k * 226, py = 40 + r * 296; if (X > px && X < px + 206 && Y > py && Y < py + 276) { const e = Math.min(X - px, px + 206 - X, Y - py, py + 276 - Y); v = e < 18 ? 1 - e / 18 * 0.7 : 0.3; const dx = X - px - 103, dy = Y - py - 138, rr = Math.sqrt(dx * dx + dy * dy); if (rr < 46) v = 0.3 + (1 - rr / 46) * 0.9; } } h[y * 256 + x] = v; }
  return {map: c, h: h};
}
function rectNormal(h, W, H, strength) { // non-square height field -> normal map (no wrap needed)
  const c = cv(W, H), g = c.getContext('2d'), img = g.createImageData(W, H), d = img.data;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const xm = Math.max(0, x - 1), xp = Math.min(W - 1, x + 1), ym = Math.max(0, y - 1), yp = Math.min(H - 1, y + 1);
    const dx = (h[y * W + xp] - h[y * W + xm]) * strength, dy = (h[yp * W + x] - h[ym * W + x]) * strength, l = 1 / Math.sqrt(dx * dx + dy * dy + 1), i = (y * W + x) * 4;
    d[i] = (-dx * l * 0.5 + 0.5) * 255; d[i + 1] = (dy * l * 0.5 + 0.5) * 255; d[i + 2] = (l * 0.5 + 0.5) * 255; d[i + 3] = 255; }
  g.putImageData(img, 0, 0); return ctex(c, false);
}

/* ---------- 1. materials: sandstone ashlar, carved reliefs, gold leaf, painted capitals ---------- */
function upgradeMaterials() {
  const set = (m, o) => { Object.assign(m, o); if (o.color !== undefined) m.color = o.color; m.envMap = envOut; m.needsUpdate = true; };
  set(M.stone, {map: W3D.pbr('lime_col', true), normalMap: W3D.pbr('lime_nrm'), roughnessMap: W3D.pbr('lime_rgh'), roughness: 1, metalness: 0, envMapIntensity: 0.5});   // photo limestone blocks (CC0 ambientCG Tiles143), was drawn ashlar
  M.stone.color.setHex(0xffffff); M.stone.normalScale.set(1.1, 1.1);
  for (const [m, rx, ry] of W3D.stoneClones || []) { for (const k of ['map', 'normalMap', 'roughnessMap']) { m[k] = M.stone[k].clone(); m[k].repeat.set(rx, ry); } m.color.setHex(0xffffff); m.roughness = 1; m.normalScale.copy(M.stone.normalScale); m.needsUpdate = true; }
  for (const k of ['relief', 'column']) { const m = M[k]; if (!m.map || !m.map.image) continue; m.normalMap = carvedNormal(m.map.image, 1024, [236, 216, 171], 5, false); m.normalScale.set(1, 1); m.roughness = 0.62; m.envMap = envOut; m.envMapIntensity = 0.45; m.needsUpdate = true; }
  set(M.gold, {map: ltex('gold_col.jpg', true), normalMap: ltex('gold_nrm.jpg'), roughnessMap: ltex('gold_rgh.jpg'), roughness: 1, metalness: 1, envMapIntensity: 1.25});
  M.gold.color.setHex(0xffffff); M.gold.normalScale.set(0.35, 0.35);
  set(M.capital, {map: ctex(capitalCanvas(), true), normalMap: capitalNormal(), roughness: 0.5, envMapIntensity: 0.5}); M.capital.color.setHex(0xffffff);
  set(M.band, {map: ctex(bandCanvas(), true), roughness: 0.4, envMapIntensity: 0.6}); M.band.color.setHex(0xffffff);
  for (const k of ['granite', 'marble']) { M[k].envMap = envOut; M[k].envMapIntensity = 1.0; M[k].needsUpdate = true; }
  M.relief.color.setHex(0xffffff); M.relief.map.repeat.set(0.5, 0.5); if (M.relief.normalMap) M.relief.normalMap.repeat.set(0.5, 0.5); // larger, more legible carved registers on walls and pylons
}

/* ---------- 1b. exterior architecture: cavetto cornices, torus rolls, frieze bands, gilded doors, steps, carved winged sun ---------- */
function cavettoGeo(len, h, flare) { // concave gorge profile (out, up), extruded along +z for len metres
  const s = new THREE.Shape(); s.moveTo(-0.4, 0); s.lineTo(0, 0);
  for (let i = 1; i <= 16; i++) { const a = i / 16 * Math.PI / 2; s.lineTo(flare * (1 - Math.cos(a)), h * Math.sin(a)); }
  s.lineTo(flare, h + 0.28); s.lineTo(-0.4, h + 0.28); s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, {depth: len, bevelEnabled: false, curveSegments: 16}); geo.translate(0, 0, -len / 2); return geo;
}
function cornice(x0, x1, z0, z1, y, h, flare, mat) { // ring of 4 cavetto runs around a rectangle (outer faces of the wall at y)
  const g = new THREE.Group(); root.add(g); const lx = x1 - x0 + 2 * flare, lz = z1 - z0 + 2 * flare;
  const add = (len, px, pz, ry) => { const m = new THREE.Mesh(cavettoGeo(len, h, flare), mat); m.rotation.y = ry; m.position.set(px, y, pz); m.castShadow = true; m.receiveShadow = true; g.add(m); };
  add(lz, x1, (z0 + z1) / 2, 0); add(lz, x0, (z0 + z1) / 2, Math.PI); add(lx, (x0 + x1) / 2, z0, Math.PI / 2); add(lx, (x0 + x1) / 2, z1, -Math.PI / 2);
  return g;
}
function rod(a, b, r, mat, parent, rep) { // cylinder between two points
  const d = new THREE.Vector3().subVectors(b, a), len = d.length(); const geo = new THREE.CylinderGeometry(r, r, len, 16, 1, true); if (rep) scaleUV(geo, 1, len / rep);
  const m = new THREE.Mesh(geo, mat); m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); m.castShadow = true; (parent || root).add(m); return m;
}
function friezeStrip(len, h, x, y, z, ry, mat) { const geo = new THREE.PlaneGeometry(len, h); scaleUV(geo, len / 8, 1); const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.y = ry; m.receiveShadow = true; (P || root).add(m); return m; }
function wingedSun(w, x, y, z, ry, env) { // the carved winged sun disk (vr/winged-sun-stone.jpg) as a stone plaque with a relief normal map
  const t = new THREE.TextureLoader().load('/vr/winged-sun-sym.jpg?v=1', tx => { const nm = lumNormal(tx.image, 1024, 256, 6); nm.repeat.copy(tx.repeat); nm.offset.copy(tx.offset); mat.normalMap = nm; mat.needsUpdate = true; });
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16; // symmetric about the disk: the photo's left half (disk, cobra, wing) mirrored, so disk, cobras and wings sit evenly over the door axis
  const mat = new THREE.MeshStandardMaterial({map: t, roughness: 0.78, envMap: env || envOut, envMapIntensity: 0.4});
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 209 / 1213), mat); m.position.set(x, y, z); m.rotation.y = ry; m.receiveShadow = true; (P || root).add(m); return m;
}
function fixStoneUVs() { // boxes built without metric UVs (sphinx parts) showed squeezed tiny blocks: rescale to metres / 4
  root.traverse(o => { if (!o.isMesh || o.material !== M.stone || o.geometry.type !== 'BoxGeometry' || o.geometry.userData.bankUV) return; const uv = o.geometry.attributes.uv; let mx = 0; for (let i = 0; i < uv.count; i++) mx = Math.max(mx, uv.getX(i), uv.getY(i)); if (mx > 1.0001) return;
    const p = o.geometry.parameters, sizes = [[p.depth, p.height], [p.depth, p.height], [p.width, p.depth], [p.width, p.depth], [p.width, p.height], [p.width, p.height]];
    for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * sizes[f][0] / 4, uv.getY(i) * sizes[f][1] / 4); } uv.needsUpdate = true; o.geometry.userData.bankUV = 1; });
}
function buildExterior() {
  const y0 = L.HQ.y, zc = L.HQ.z;
  fixStoneUVs();
  const corn = std({map: ctex(corniceCanvas(), true), roughness: 0.55, envMapIntensity: 0.4});
  const roll = std({map: ctex(bandCanvas(), true), roughness: 0.45, envMapIntensity: 0.5});
  const fr = friezeTex();
  const frieze = std({map: fr.map, normalMap: fr.nrm, roughness: 0.6, envMapIntensity: 0.45, polygonOffset: true, polygonOffsetFactor: -2});
  // hide the simplified pylon cornice boxes and replace them with true cavetto cornices + torus rolls
  root.traverse(o => { const p = o.isMesh && o.geometry && o.geometry.parameters; if (p && o.geometry.type === 'BoxGeometry' && p.width === 8 && p.height === 1.2 && Math.abs(p.depth - 27.5) < 0.01) o.visible = false; });
  for (const s of [-1, 1]) {
    const zt = zc + s * 17, top = y0 + 22;
    cornice(893.4, 898.6, zt - 11.4, zt + 11.4, top - 1.6, 1.55, 1.05, corn);
    const tz = [[-3.5, -13, -2.6, -11.4], [3.5, -13, 2.6, -11.4], [-3.5, 13, -2.6, 11.4], [3.5, 13, 2.6, 11.4]];
    for (const [ax, az, bx, bz] of tz) rod(new THREE.Vector3(896 + ax, y0, zt + az), new THREE.Vector3(896 + bx, top - 1.6, zt + bz * 0.995), 0.24, roll, null, 0.6);
    for (const [ax, az, bx, bz] of [[-2.6, -11.4, 2.6, -11.4], [-2.6, 11.4, 2.6, 11.4], [-2.6, -11.4, -2.6, 11.4], [2.6, -11.4, 2.6, 11.4]])
      rod(new THREE.Vector3(896 + ax, top - 1.6, zt + az), new THREE.Vector3(896 + bx, top - 1.6, zt + bz), 0.24, roll, null, 0.6);
    // frieze band on the pylon front (pond side) faces, just below the cornice
    friezeStrip(20, 1.4, 893.36 - 0.02, top - 2.5, zt, -Math.PI / 2, frieze);
  }
  // gilded bronze gate leaves standing open in the pylon passage
  const dc = doorCanvas(); const dmat = std({map: ctex(dc.map, true), normalMap: rectNormal(dc.h, 256, 768, 3), metalness: 1, roughness: 0.32, envMapIntensity: 1.1});
  const leaf = (w, h, x, y, z) => { const g = new THREE.BoxGeometry(w, h, 0.2); const m = mesh(g, dmat, x, y + h / 2, z, null, {cast: true}); return m; };
  // working gate: two leaves hung on stone jamb posts in the pylon passage; they swing open when you come near (or click them)
  W3D.gateDoors = [];
  for (const s of [-1, 1]) {
    vbox(1.2, 14, 1.3, 893.6, y0, zc + s * 4.45, M.stone, {collide: false, shadow: true, T: 2});   // jamb post: fills the battered towers' gap
    const piv = new THREE.Group(); piv.position.set(893.6, y0 + 0.25, zc + s * 3.8); (P || root).add(piv);
    const lf = new THREE.Mesh(new THREE.BoxGeometry(0.32, 13.4, 3.78), dmat); lf.position.set(0, 6.7, -s * 1.89); lf.castShadow = true; lf.receiveShadow = true; piv.add(lf);
    for (const hy of [1.5, 6.7, 11.9]) { const hb = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.8, 10), M.gold); hb.position.set(0, hy, 0); piv.add(hb); } // hinge barrels
    W3D.gateDoors.push({piv: piv, s: s, a: 0});
  }
  { const hit = document.createElement('a-box'); hit.setAttribute('class', 'btn'); hit.setAttribute('position', `893.6 ${y0 + 7} ${zc}`); hit.setAttribute('width', 0.6); hit.setAttribute('height', 13.4); hit.setAttribute('depth', 7.6);
    hit.setAttribute('material', 'shader: flat; opacity: 0; transparent: true; depthWrite: false');
    hit.addEventListener('click', () => { W3D.gateManual = !W3D.gateOpenNow; W3D.gateManualT = performance.now(); });
    document.querySelector('a-scene').appendChild(hit); }
  // banking hall: cornice + torus rolls + carved frieze + base course + steps and open gilded doors at the west door
  const hx0 = 924.25, hx1 = 965.75, hz0 = zc - 20.75, hz1 = zc + 20.75, ht = y0 + 16;
  cornice(hx0, hx1, hz0, hz1, ht - 1.3, 2.2, 1.0, corn);
  for (const [x, z] of [[hx0, hz0], [hx0, hz1], [hx1, hz0], [hx1, hz1]]) rod(new THREE.Vector3(x, y0, z), new THREE.Vector3(x, ht - 1.3, z), 0.26, roll, null, 0.6);
  for (const [ax, az, bx, bz] of [[hx0, hz0, hx1, hz0], [hx0, hz1, hx1, hz1], [hx0, hz0, hx0, hz1], [hx1, hz0, hx1, hz1]]) rod(new THREE.Vector3(ax, ht - 1.3, az), new THREE.Vector3(bx, ht - 1.3, bz), 0.26, roll, null, 0.6);
  const fy = ht - 2.6;
  friezeStrip(41.5, 1.6, hx0 - 0.02, fy, zc, -Math.PI / 2, frieze); friezeStrip(41.5, 1.6, (hx0 + hx1) / 2, fy, hz1 + 0.02, 0, frieze);
  friezeStrip(41.5, 1.6, (hx0 + hx1) / 2, fy, hz0 - 0.02, Math.PI, frieze); friezeStrip(41.5, 1.6, hx1 + 0.02, fy, zc, Math.PI / 2, frieze);
  // carved winged sun over the hall door (kept image: vr/winged-sun-stone.jpg)
  wingedSun(8, hx0 - 0.05, y0 + 11.4, zc, -Math.PI / 2);
  // base course (granite plinth) on the west facade and south side
  for (const [w, d, x, z] of [[0.5, 17, hx0 - 0.2, zc - 11.5], [0.5, 17, hx0 - 0.2, zc + 11.5], [41.5, 0.5, (hx0 + hx1) / 2, hz1 + 0.2]]) vbox(w, 0.7, d, x, y0 + 0.2, z, M.granite, {collide: false, shadow: true, T: 2});
  // three granite steps up to a landing at the hall door, gold nosings
  const steps = [[920.4, 921.75, y0 + 0.35], [921.75, 923.1, y0 + 0.5], [923.1, 925.75, y0 + 0.65]];
  for (const [xa, xb, top] of steps) { const b = vbox(xb - xa, top - (y0 + 0.2), 8, (xa + xb) / 2, y0 + 0.2, zc, M.granite, {collide: false, shadow: true, T: 2}); L.floors.push({x0: xa, x1: xb, z0: zc - 4, z1: zc + 4, y: top});
    vbox(0.06, 0.04, 8, xa + 0.03, top - 0.03, zc, M.gold, {collide: false}); }
  for (const s of [-1, 1]) { const m = leaf(3.0, 9.6, 927.3, y0 + 0.3, zc + s * 2.85); }
  // column bases + gilded neck rings for every papyrus column (one InstancedMesh each)
  const cols = []; root.traverse(o => { if (o.isMesh && o.material === M.column && o.parent && o.parent.isGroup) cols.push({p: o.parent.position, r: o.geometry.parameters.radiusBottom, h: o.geometry.parameters.height}); });
  if (cols.length) {
    const baseG = new THREE.CylinderGeometry(1.22, 1.32, 0.34, 24), ringG = new THREE.TorusGeometry(0.95, 0.07, 6, 28); ringG.rotateX(Math.PI / 2);
    const ib = new THREE.InstancedMesh(baseG, M.granite, cols.length), ir = new THREE.InstancedMesh(ringG, M.gold, cols.length), mm = new THREE.Matrix4(), q = new THREE.Quaternion();
    cols.forEach((c, i) => { mm.compose(new THREE.Vector3(c.p.x, c.p.y + 0.17, c.p.z), q, new THREE.Vector3(c.r, 1, c.r)); ib.setMatrixAt(i, mm); mm.compose(new THREE.Vector3(c.p.x, c.p.y + c.h - 0.05, c.p.z), q, new THREE.Vector3(c.r, c.r, c.r)); ir.setMatrixAt(i, mm); });
    ib.receiveShadow = ir.receiveShadow = true; ib.castShadow = true; ib.computeBoundingSphere(); ir.computeBoundingSphere(); root.add(ib); root.add(ir);
  }
  W3D.bankColumns = cols.length;
}

/* ---------- 2. vault hall under the banking hall ---------- */
function goldBarGeo() { // trapezoid 400-oz style bar: base 0.26 x 0.09, top 0.235 x 0.072, 0.055 high (flat-shaded)
  const a = 0.13, b = 0.045, c = 0.1175, d = 0.036, h = 0.055;
  const P = [[-a, 0, -b], [a, 0, -b], [a, 0, b], [-a, 0, b], [-c, h, -d], [c, h, -d], [c, h, d], [-c, h, d]];
  const F = [[4, 7, 6, 5], [3, 2, 6, 7], [1, 0, 4, 5], [2, 1, 5, 6], [0, 3, 7, 4]], pos = [];
  for (const f of F) for (const k of [0, 1, 2, 0, 2, 3]) pos.push(...P[f[k]]);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); return g;
}
function cashCanvases() { // stylised banded bricks of notes (not a reproduction of real currency)
  const side = cv(512, 512), g = side.getContext('2d'); g.fillStyle = '#7f8f72'; g.fillRect(0, 0, 512, 512);
  for (let r = 0; r < 9; r++) for (let k = 0; k < 8; k++) { const x = k * 64, y = r * 56.9;
    g.fillStyle = '#b9c6a6'; g.fillRect(x + 1.5, y + 1.5, 61, 54); g.fillStyle = 'rgba(70,90,60,0.45)'; for (let l = 3; l < 54; l += 5.3) g.fillRect(x + 1.5, y + 1.5 + l, 61, 1.2);
    g.fillStyle = '#d8b44c'; g.fillRect(x + 25, y + 1.5, 14, 54); g.fillStyle = 'rgba(120,90,20,0.6)'; g.fillRect(x + 25, y + 1.5, 1.5, 54); g.fillRect(x + 37.5, y + 1.5, 1.5, 54); }
  const top = cv(512, 512), t = top.getContext('2d'); t.fillStyle = '#7f8f72'; t.fillRect(0, 0, 512, 512);
  for (let r = 0; r < 8; r++) for (let k = 0; k < 4; k++) { const x = k * 128, y = r * 64;
    t.fillStyle = '#a9b996'; t.fillRect(x + 2, y + 2, 124, 60); t.strokeStyle = '#4f6a4a'; t.lineWidth = 2; t.strokeRect(x + 8, y + 8, 112, 48);
    t.fillStyle = '#5f7a58'; t.beginPath(); t.ellipse(x + 40, y + 32, 13, 17, 0, 0, Math.PI * 2); t.fill(); t.fillStyle = '#34502f'; t.font = 'bold 15px Georgia'; t.fillText('100', x + 12, y + 24); t.fillText('100', x + 88, y + 52);
    t.fillStyle = '#d8b44c'; t.fillRect(x + 70, y + 2, 18, 60); t.fillStyle = '#6a5216'; t.font = 'bold 9px Georgia'; t.save(); t.translate(x + 82, y + 58); t.rotate(-Math.PI / 2); t.fillText('$10,000', 0, 0); t.restore(); }
  const pal = cv(256, 256), p = pal.getContext('2d'); p.fillStyle = '#8a6a44'; p.fillRect(0, 0, 256, 256); for (let i = 0; i < 5; i++) { p.fillStyle = i % 2 ? '#9c7a50' : '#7d5f3c'; p.fillRect(0, i * 51, 256, 44); }
  return {side: side, top: top, pallet: pal};
}
function instanced(geo, mat, list, opt) { // list of [x, y, z, ry, sx, sy, sz]
  const im = new THREE.InstancedMesh(geo, mat, list.length), mm = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3();
  list.forEach((a, i) => { e.set(a[7] || 0, a[3] || 0, a[8] || 0); q.setFromEuler(e); s.set(a[4] || 1, a[5] || 1, a[6] || 1); p.set(a[0], a[1], a[2]); mm.compose(p, q, s); im.setMatrixAt(i, mm); });
  im.castShadow = false; im.receiveShadow = true; im.computeBoundingSphere(); (P || root).add(im); return im;
}
function goldPallet(list, palList, x, z, y, ry) { // pyramid of bars on a pallet, crosswise layers
  palList.push([x, y, z, ry]); const yb = y + 0.15;
  for (let k = 0; k < 8; k++) { const along = k % 2 === 0, inset = k * 0.07, W = 1.12 - inset * 2, D = 0.96 - inset * 2; if (W < 0.3 || D < 0.3) break;
    const lx = along ? 0.27 : 0.095, lz = along ? 0.095 : 0.27, nx = Math.floor(W / lx), nz = Math.floor(D / lz);
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) { const ox = (i - (nx - 1) / 2) * lx, oz = (j - (nz - 1) / 2) * lz, c = Math.cos(ry), s = Math.sin(ry);
      list.push([x + ox * c + oz * s, yb + k * 0.056, z - ox * s + oz * c, ry + (along ? 0 : Math.PI / 2) + (Math.random() - 0.5) * 0.02]); } }
}
function goldBlock(list, palList, cores, x, z, y, rows) { // solid block of bars on a pallet: bars on the 4 faces + top, gold core inside (cheap)
  palList.push([x, y, z, 0]); const yb = y + 0.15, W = 1.06, D = 0.9;
  const nx = Math.floor(W / 0.265), nz = Math.floor(D / 0.265);
  for (let r = 0; r < rows; r++) { const yy = yb + r * 0.056, o = (r % 2) * 0.06;
    for (let i = 0; i < nx; i++) for (const s of [-1, 1]) list.push([x + (i - (nx - 1) / 2) * 0.265 + o * s, yy, z + s * (D / 2 - 0.045), 0]);
    for (let j = 0; j < nz; j++) for (const s of [-1, 1]) list.push([x + s * (W / 2 - 0.045), yy, z + (j - (nz - 1) / 2) * 0.265 - o * s, Math.PI / 2]); }
  for (let i = 0; i < nx; i++) for (let j = 0; j < 9; j++) list.push([x + (i - (nx - 1) / 2) * 0.265, yb + rows * 0.056, z + (j - 4) * 0.095, 0]);
  cores.push([x, yb + rows * 0.028, z, 0, W - 0.12, rows * 0.056, D - 0.12]);
}
function balanceWords(v) {
  const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'], tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const w3 = n => { let s = ''; if (n >= 100) { s += ones[Math.floor(n / 100)] + ' hundred'; n %= 100; if (n) s += ' '; } if (n >= 20) { s += tens[Math.floor(n / 10)]; if (n % 10) s += '-' + ones[n % 10]; } else if (n) s += ones[n]; return s; };
  const units = [[1e12, 'trillion'], [1e9, 'billion'], [1e6, 'million'], [1e3, 'thousand'], [1, '']]; const out = []; let r = Math.round(v);
  for (const [u, name] of units) { const n = Math.floor(r / u); r -= n * u; if (n) out.push(w3(n) + (name ? ' ' + name : '')); }
  return (out.join(' ') || 'zero') + ' US dollars';
}
function boardCanvas() {
  const W = 2048, H = 1152, c = cv(W, H), g = c.getContext('2d');
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#16120a'); bg.addColorStop(1, '#070604'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.strokeStyle = '#d4af37'; g.lineWidth = 14; g.strokeRect(18, 18, W - 36, H - 36); g.lineWidth = 3; g.strokeRect(48, 48, W - 96, H - 96);
  g.textAlign = 'center'; g.fillStyle = '#d4af37'; g.font = '600 46px Georgia, serif'; g.fillText('BANK OF THE UNITED STATES (3RD ED.)  \u00b7  CENTRAL COMMAND VAULT', W / 2, 128);
  g.fillStyle = '#bfa66a'; g.font = '34px Georgia, serif'; g.fillText('Private client ledger', W / 2, 180);
  g.fillStyle = '#8a7340'; g.fillRect(200, 214, W - 400, 3);
  g.textAlign = 'left'; g.fillStyle = '#bfa66a'; g.font = '44px Georgia, serif'; g.fillText('Account holder', 170, 320);
  g.fillStyle = '#fff3cf'; g.font = 'bold 92px Georgia, serif'; g.fillText(ACCOUNT.holder, 170, 418);
  g.fillStyle = '#bfa66a'; g.font = '44px Georgia, serif'; g.fillText('Balance', 170, 534);
  const gr = g.createLinearGradient(0, 560, 0, 700); gr.addColorStop(0, '#fff1a8'); gr.addColorStop(0.5, '#ffd34d'); gr.addColorStop(1, '#c9921c'); g.fillStyle = gr; g.font = 'bold 150px Georgia, serif';
  g.fillText('$' + ACCOUNT.balance.toLocaleString('en-US'), 160, 690);
  g.fillStyle = '#e8d9a8'; g.font = 'italic 44px Georgia, serif'; g.fillText('(' + balanceWords(ACCOUNT.balance) + ')', 170, 760);
  g.fillStyle = '#8a7340'; g.fillRect(170, 800, W - 340, 3);
  g.fillStyle = '#bfa66a'; g.font = '40px Georgia, serif'; g.fillText('Purpose', 170, 870);
  g.fillStyle = '#fff3cf'; g.font = '52px Georgia, serif'; g.fillText(ACCOUNT.purpose, 170, 936);
  const cover = ACCOUNT.planEstimate ? Math.floor(ACCOUNT.balance / ACCOUNT.planEstimate) : 0;
  if (cover > 1) { g.fillStyle = '#c9b27a'; g.font = '38px Georgia, serif'; g.fillText('Covers the plan v6 estimate about ' + cover.toLocaleString('en-US') + ' times over', 170, 996); }
  g.textAlign = 'center'; g.fillStyle = '#9b8a62'; g.font = '30px system-ui, sans-serif'; g.fillText('Concept display only - not a real account, bank, balance or financial statement.', W / 2, H - 78);
  return c;
}
function placard(text, sub, w, x, y, z, ry) {
  const c = cv(1024, 256), g = c.getContext('2d'); g.fillStyle = '#120e07'; g.fillRect(0, 0, 1024, 256); g.strokeStyle = '#d4af37'; g.lineWidth = 8; g.strokeRect(8, 8, 1008, 240);
  g.textAlign = 'center'; g.fillStyle = '#ffd700'; g.font = 'bold 72px Georgia, serif'; g.fillText(text, 512, 120); g.fillStyle = '#d8c48e'; g.font = '34px Georgia, serif'; g.fillText(sub, 512, 192);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w / 4), new THREE.MeshBasicMaterial({map: ctex(c, true), toneMapped: false})); m.position.set(x, y, z); m.rotation.y = ry; (P || root).add(m); return m;
}
function buildVault() {
  vaultG = new THREE.Group(); vaultG.name = 'bank-vault'; root.add(vaultG); P = vaultG; W3D.bankVault = vaultG;
  const y = V.y, H = V.top - V.y, zc = V.zc;
  const stoneV = M.stone.clone(); stoneV.envMap = envIn; stoneV.envMapIntensity = 0.6;
  const granV = M.granite.clone(); granV.envMap = envIn; granV.envMapIntensity = 1.1;
  const goldV = M.gold.clone(); goldV.envMap = envIn; goldV.envMapIntensity = 1.6;
  const steel = std({color: 0xc4c8ce, metalness: 1, roughness: 1, roughnessMap: ltex('steel_rgh.jpg'), normalMap: ltex('steel_nrm.jpg'), envMapIntensity: 1.5}, envIn); steel.normalScale.set(0.6, 0.6);
  const steelSide = std({color: 0xa9aeb5, metalness: 1, roughness: 0.38, envMapIntensity: 1.4}, envIn);
  const fr = friezeTex();
  const frieze = std({map: fr.map, normalMap: fr.nrm, roughness: 0.6, envMapIntensity: 0.5, polygonOffset: true, polygonOffsetFactor: -2}, envIn);
  // shell: polished granite floor, ashlar walls with granite dado + gold band, painted frieze, star ceiling
  vbox(V.x1 - V.x0 + 1.2, 0.4, V.z1 - V.z0 + 1.2, (V.x0 + V.x1) / 2, y - 0.4, zc, granV, {collide: false, T: 4});
  underFloor(V.x0, V.x1, V.z0, V.z1, y);
  vbox(V.x1 - V.x0 + 1.2, H, 0.6, (V.x0 + V.x1) / 2, y, V.z0 - 0.3, stoneV, {T: 4}); vbox(V.x1 - V.x0 + 1.2, H, 0.6, (V.x0 + V.x1) / 2, y, V.z1 + 0.3, stoneV, {T: 4});
  vbox(0.6, H, V.z1 - V.z0, V.x0 - 0.3, y, zc, stoneV, {T: 4});
  for (const [w, d, x, z] of [[V.x1 - V.x0, 0.12, (V.x0 + V.x1) / 2, V.z0 + 0.06], [V.x1 - V.x0, 0.12, (V.x0 + V.x1) / 2, V.z1 - 0.06], [0.12, V.z1 - V.z0, V.x0 + 0.06, zc]]) { vbox(w, 1.3, d, x, y, z, granV, {collide: false, T: 2}); vbox(w + 0.02, 0.1, d + 0.02, x, y + 1.3, z, goldV, {collide: false}); }
  friezeStrip(V.x1 - V.x0, 1.4, (V.x0 + V.x1) / 2, V.top - 1.3, V.z0 + 0.01, 0, frieze); friezeStrip(V.x1 - V.x0, 1.4, (V.x0 + V.x1) / 2, V.top - 1.3, V.z1 - 0.01, Math.PI, frieze);
  friezeStrip(V.z1 - V.z0, 1.4, V.x0 + 0.01, V.top - 1.3, zc, Math.PI / 2, frieze);
  const ceilM = M.ceiling;
  const ceil = mesh(new THREE.PlaneGeometry(V.x1 - V.x0 + 1, V.z1 - V.z0 + 1), ceilM, (V.x0 + V.x1) / 2, V.top, zc); ceil.rotation.x = Math.PI / 2; ceil.castShadow = true;
  // east wall with the round vault opening (extruded shape, ashlar UVs in metres / 4)
  const sh = new THREE.Shape(); sh.moveTo(-18.6, 0); sh.lineTo(18.6, 0); sh.lineTo(18.6, H); sh.lineTo(-18.6, H); sh.closePath();
  const hole = new THREE.Path(); hole.absarc(0, DOOR.y - y, DOOR.r, 0, Math.PI * 2, true); sh.holes.push(hole);
  const wg = new THREE.ExtrudeGeometry(sh, {depth: 0.9, bevelEnabled: false, curveSegments: 64}); scaleUV(wg, 0.25); wg.rotateY(Math.PI / 2);
  const ew = mesh(wg, stoneV, DOOR.x, y, zc); ew.castShadow = true;
  L.walls.push({x0: DOOR.x, x1: DOOR.x + 0.9, z0: V.z0, z1: zc - 1.5, y0: y, y1: V.top}, {x0: DOOR.x, x1: DOOR.x + 0.9, z0: zc + 1.5, z1: V.z1, y0: y, y1: V.top});
  // opening sleeve, gold frame rings and a step up to the chamber floor
  const sleeve = new THREE.CylinderGeometry(DOOR.r, DOOR.r, 0.9, 64, 1, true); sleeve.rotateZ(Math.PI / 2); const sm = mesh(sleeve, steelSide, DOOR.x + 0.45, DOOR.y, zc); sm.material = steelSide.clone(); sm.material.side = THREE.BackSide;
  for (const dx of [-0.02, 0.92]) { const ring = new THREE.TorusGeometry(DOOR.r + 0.12, 0.16, 16, 96); ring.rotateY(Math.PI / 2); mesh(ring, goldV, DOOR.x + dx, DOOR.y, zc); }
  vbox(1.2, 0.2, 3.6, DOOR.x - 0.6, y, zc, granV, {collide: false, T: 2}); underFloor(DOOR.x - 1.2, DOOR.x, zc - 1.8, zc + 1.8, y + 0.2);
  underFloor(DOOR.x, DOOR.x + 0.95, zc - 1.6, zc + 1.6, C.y);
  wingedSun(6.2, DOOR.x - 0.04, V.top - 2.25, zc, -Math.PI / 2, envIn);
  // the round vault door, swung open 80 degrees on its hinge
  const hinge = new THREE.Group(); hinge.position.set(DOOR.x - 0.75, DOOR.y, zc + DOOR.r + 0.35); hinge.rotation.y = THREE.MathUtils.degToRad(80); P.add(hinge);
  const door = new THREE.Group(); door.position.set(0, 0, -(DOOR.r + 0.35)); hinge.add(door);
  const T = 1.1, Rd = DOOR.r - 0.05;
  const body = new THREE.CylinderGeometry(Rd, Rd, T, 96); body.rotateZ(Math.PI / 2); mesh(body, [steelSide, steel, steel], 0, 0, 0, door, {cast: false});
  const step = new THREE.CylinderGeometry(Rd - 0.35, Rd - 0.35, T + 0.24, 96); step.rotateZ(Math.PI / 2); mesh(step, [steelSide, steel, steel], 0, 0, 0, door);
  const hub = new THREE.CylinderGeometry(0.95, 0.95, T + 0.5, 48); hub.rotateZ(Math.PI / 2); mesh(hub, [steelSide, steel, steel], 0, 0, 0, door);
  for (const sx of [-1, 1]) { const r1 = new THREE.TorusGeometry(Rd - 0.18, 0.05, 10, 96); r1.rotateY(Math.PI / 2); mesh(r1, goldV, sx * (T / 2 + 0.01), 0, 0, door); const r2 = new THREE.TorusGeometry(0.95, 0.06, 10, 64); r2.rotateY(Math.PI / 2); mesh(r2, goldV, sx * (T / 2 + 0.25), 0, 0, door); }
  // outer face (hall side when closed): 3-spoke handwheel
  const wheel = new THREE.Group(); wheel.position.set(-(T / 2 + 0.75), 0, 0); door.add(wheel);
  { const tg = new THREE.TorusGeometry(1.0, 0.07, 14, 64); tg.rotateY(Math.PI / 2); mesh(tg, goldV, 0, 0, 0, wheel);
    for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2, sp = new THREE.CylinderGeometry(0.05, 0.05, 1.0, 12); const m = mesh(sp, steelSide, 0, Math.cos(a) * 0.5, Math.sin(a) * 0.5, wheel); m.rotation.x = -a; }
    const sp = new THREE.CylinderGeometry(0.12, 0.12, 0.6, 20); sp.rotateZ(Math.PI / 2); mesh(sp, steelSide, 0.3, 0, 0, wheel); anim.push(t => { wheel.rotation.x = Math.sin(t * 0.0004) * 0.25; }); }
  // bolt heads on both faces + radial locking bolts out of the rim (instanced)
  const bolts = [], locks = [];
  for (let i = 0; i < 36; i++) { const a = i / 36 * Math.PI * 2; for (const sx of [-1, 1]) bolts.push([sx * (T / 2 + 0.12), Math.cos(a) * (Rd - 0.62), Math.sin(a) * (Rd - 0.62)]); }
  for (let i = 0; i < 18; i++) { const a = (i + 0.5) / 18 * Math.PI * 2; locks.push([0.15, Math.cos(a) * (Rd + 0.12), Math.sin(a) * (Rd + 0.12), 0, 1, 1, 1, a, 0]); }
  const bg = new THREE.CylinderGeometry(0.07, 0.07, 0.08, 12); bg.rotateZ(Math.PI / 2);
  const ib = new THREE.InstancedMesh(bg, goldV, bolts.length), mm = new THREE.Matrix4(); bolts.forEach((b, i) => { mm.makeTranslation(b[0], b[1], b[2]); ib.setMatrixAt(i, mm); }); door.add(ib);
  const lg = new THREE.CylinderGeometry(0.12, 0.12, 0.55, 16);
  const il = new THREE.InstancedMesh(lg, steelSide, locks.length); locks.forEach((b, i) => { mm.makeRotationX(b[7]); mm.setPosition(b[0], b[1], b[2]); il.setMatrixAt(i, mm); }); door.add(il);
  // inner face time-lock box with a gold dial
  mesh(new THREE.BoxGeometry(0.25, 0.9, 1.4), steelSide, T / 2 + 0.37, 1.55, 0, door); const dial = new THREE.CylinderGeometry(0.25, 0.25, 0.06, 32); dial.rotateZ(Math.PI / 2); mesh(dial, goldV, T / 2 + 0.52, 1.55, 0, door);
  // big hinge: arm + barrel
  mesh(new THREE.BoxGeometry(0.45, 2.4, DOOR.r * 0.9), steelSide, -(T / 2 + 0.1), 0, DOOR.r * 0.65, door);
  mesh(new THREE.CylinderGeometry(0.35, 0.35, 3.2, 24), steelSide, 0, 0, 0, hinge); mesh(new THREE.BoxGeometry(0.4, 3.0, 0.6), steelSide, 0.5, 0, 0.25, null).position.set(DOOR.x - 0.3, DOOR.y, zc + DOOR.r + 0.35);
  L.walls.push({x0: 955.4, x1: 962.6, z0: zc + 1.9, z1: zc + 4.2, y0: y, y1: V.top}); // the open door itself

  // pillars along the aisle, ceiling lamps, warm lights
  for (const x of [940, 948, 956]) for (const s of [-1, 1]) { const z = zc + s * 4.8; vbox(1.2, H - 0.6, 1.2, x, y, z, granV, {T: 2}); vbox(1.5, 0.35, 1.5, x, y, z, goldV, {collide: false}); vbox(1.6, 0.6, 1.6, x, V.top - 0.6, z, goldV, {collide: false}); }
  const lampG = new THREE.CylinderGeometry(0.9, 0.9, 0.08, 32), lampM = new THREE.MeshBasicMaterial({color: 0xfff0c8, toneMapped: false});
  const lamps = []; for (const x of [932, 942, 950, 958]) for (const z of [zc - 10, zc, zc + 10]) lamps.push([x, V.top - 0.05, z]);
  instanced(lampG, lampM, lamps).receiveShadow = false;
  const pl1 = new THREE.PointLight(0xffdcae, 1.5, 34, 1.2); pl1.position.set(940, V.top - 1.6, zc); root.add(pl1);
  const pl2 = new THREE.PointLight(0xffd090, 1.4, 22, 1.2); pl2.position.set(970, V.top - 1.4, zc); root.add(pl2);

  // ---- cash: pallets of banded $100 bundles, stacked 1-3 high (InstancedMesh) ----
  const cc = cashCanvases(); const cashSide = std({map: ctex(cc.side, true), roughness: 0.85, envMapIntensity: 0.25}, envIn), cashTop = std({map: ctex(cc.top, true), roughness: 0.8, envMapIntensity: 0.25}, envIn);
  const palM = std({map: ctex(cc.pallet, true), roughness: 0.85, envMapIntensity: 0.2}, envIn);
  const cashG = new THREE.BoxGeometry(1.2, 0.95, 1.0), palG = new THREE.BoxGeometry(1.22, 0.14, 1.02);
  const cash = [], pals = [], rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  const rowsN = [-387.4, -388.6, -389.8, -392.2, -393.4, -394.6, -396.8], rowsS = rowsN.map(z => 2 * zc - z);
  for (const z of rowsN.concat(rowsS)) for (let i = 0; i < 12; i++) { const x = 940.2 + i * 1.32; const tiers = 1 + Math.floor(rnd() * 3 * (Math.abs(z - zc) > 9 ? 1 : 0.75)) ;
    pals.push([x, y + 0.07, z]); for (let k = 0; k < tiers; k++) cash.push([x + (rnd() - 0.5) * 0.04, y + 0.14 + 0.475 + k * 0.97, z + (rnd() - 0.5) * 0.04, (rnd() - 0.5) * 0.03]); }
  for (const z of [-363.6, -364.8, -366.0, -396.4, -395.2, -394.0]) for (let i = 0; i < 7; i++) { const x = 928.6 + i * 1.32, tiers = 2 + Math.floor(rnd() * 2);
    pals.push([x, y + 0.07, z]); for (let k = 0; k < tiers; k++) cash.push([x + (rnd() - 0.5) * 0.04, y + 0.14 + 0.475 + k * 0.97, z + (rnd() - 0.5) * 0.04, (rnd() - 0.5) * 0.03]); }
  L.walls.push({x0: 927.9, x1: 937.2, z0: -366.6, z1: -362.9, y0: y, y1: y + 3}, {x0: 927.9, x1: 937.2, z0: -397.1, z1: -393.4, y0: y, y1: y + 3});
  instanced(cashG, [cashSide, cashSide, cashTop, cashTop, cashSide, cashSide], cash); instanced(palG, palM, pals);
  for (const [z0, z1] of [[-397.4, -386.8], [-373.2, -362.6]]) L.walls.push({x0: 939.5, x1: 955.4, z0: z0, z1: z1, y0: y, y1: y + 3});
  placard('CASH RESERVE', 'about $100 million per pallet (concept)', 3.2, 947.3, y + 3.9, -386.2, 0);

  // ---- gold: pyramids on pallets by the door, and floor-to-wall stacks in the chamber ----
  const bars = [], gpals = [];
  const cores = [];
  for (const x of [958.2, 960.6]) for (const z of [-387.6, -389.4, -391.2, -370.8, -372.6, -374.4]) goldBlock(bars, gpals, cores, x, z, y, 15);
  for (const x of [930.5, 932.5]) for (const z of [-372.4, -370.2]) goldBlock(bars, gpals, cores, x, z, y, 9);
  L.walls.push({x0: 956.6, x1: 962.2, z0: -392, z1: -386.8, y0: y, y1: y + 1}, {x0: 956.6, x1: 962.2, z0: -375.2, z1: -370, y0: y, y1: y + 1}, {x0: 929.7, x1: 933.3, z0: -373, z1: -369.6, y0: y, y1: y + 1});
  // chamber shell
  const cy = C.y;
  vbox(C.x1 - C.x0, 0.4, C.z1 - C.z0, (C.x0 + C.x1) / 2, cy - 0.4, zc, granV, {collide: false, T: 4}); underFloor(C.x0, C.x1, C.z0, C.z1, cy);
  vbox(C.x1 - C.x0 + 0.6, V.top - cy, 0.6, (C.x0 + C.x1) / 2 + 0.3, cy, C.z0 - 0.3, stoneV, {T: 4}); vbox(C.x1 - C.x0 + 0.6, V.top - cy, 0.6, (C.x0 + C.x1) / 2 + 0.3, cy, C.z1 + 0.3, stoneV, {T: 4});
  vbox(0.6, V.top - cy, C.z1 - C.z0 + 1.2, C.x1 + 0.3, cy, zc, stoneV, {T: 4});
  const cc2 = mesh(new THREE.PlaneGeometry(C.x1 - C.x0 + 1, C.z1 - C.z0 + 1), ceilM, (C.x0 + C.x1) / 2, V.top - 0.02, zc); cc2.rotation.x = Math.PI / 2; cc2.castShadow = true;
  // walls of bars: front face long-side out, half-bond, 3.1 m high; a dark-gold core fills behind
  const SH = 2.6, rowsH = Math.floor(SH / 0.056), core = std({color: 0x8a6418, metalness: 1, roughness: 0.4, envMapIntensity: 1.0}, envIn);
  const wallRun = (ax, az, bx, bz, nx, nz) => { // run along a->b, bars face the room along normal (nx, nz)
    const len = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / len, uz = (bz - az) / len, ry = Math.atan2(-uz, ux), n = Math.floor(len / 0.265);
    for (let r = 0; r < rowsH; r++) { const off = (r % 2) * 0.1325; for (let i = 0; i < n - (r % 2); i++) { const t = 0.1325 + off + i * 0.265;
      bars.push([ax + ux * t + nx * 0.05 + (rnd() - 0.5) * 0.006, cy + r * 0.056, az + uz * t + nz * 0.05 + (rnd() - 0.5) * 0.006, ry + (rnd() - 0.5) * 0.012]); } }
    for (let i = 0; i < n; i++) { const t = 0.1325 + i * 0.265; bars.push([ax + ux * t + nx * 0.15, cy + rowsH * 0.056, az + uz * t + nz * 0.15, ry]); } // capping row
    const m = mesh(new THREE.BoxGeometry(len, SH, 0.5), core, (ax + bx) / 2 - nx * 0.25, cy + SH / 2, (az + bz) / 2 - nz * 0.25); m.rotation.y = ry; };
  wallRun(C.x0 + 1.0, C.z0 + 0.6, C.x1 - 0.6, C.z0 + 0.6, 0, 1); wallRun(C.x1 - 0.6, C.z1 - 0.6, C.x0 + 1.0, C.z1 - 0.6, 0, -1); wallRun(C.x1 - 0.6, C.z0 + 1.2, C.x1 - 0.6, C.z1 - 1.2, -1, 0);
  for (const x of [968.5, 971.5]) for (const z of [-383.2, -376.8]) goldBlock(bars, gpals, cores, x, z, cy, 20);
  L.walls.push({x0: 967.7, x1: 972.3, z0: -384, z1: -376, y0: cy, y1: cy + 1}, {x0: C.x0, x1: C.x1, z0: C.z0, z1: C.z0 + 1.1, y0: cy, y1: cy + 3}, {x0: C.x0, x1: C.x1, z0: C.z1 - 1.1, z1: C.z1, y0: cy, y1: cy + 3}, {x0: C.x1 - 1.1, x1: C.x1, z0: C.z0, z1: C.z1, y0: cy, y1: cy + 3});
  const barM = std({color: 0xffc94a, metalness: 1, roughness: 0.24, envMapIntensity: 2.4}, envIn);
  const barMesh = instanced(goldBarGeo(), barM, bars); instanced(new THREE.BoxGeometry(1, 1, 1), core, cores); instanced(palG, palM, gpals.map(p => [p[0], p[1] + 0.07, p[2], p[3]]));
  W3D.bankBars = bars.length; W3D.bankCash = cash.length;
  placard('GOLD RESERVE', bars.length.toLocaleString('en-US') + ' bars on display (concept)', 3.4, 975.9, cy + 4.0, zc, -Math.PI / 2);

  // ---- 3. Josh's account board: brass-framed teller screen on a granite counter ----
  const bx = 935.6, bz = -386.6, g = new THREE.Group(); g.position.set(bx, y, bz); g.rotation.y = Math.atan2(931.5 - bx, zc - bz); P.add(g);
  const brass = std({color: 0xe2b860, metalness: 1, roughness: 0.25, map: M.gold.map, envMapIntensity: 1.5}, envIn);
  mesh(new THREE.BoxGeometry(4.4, 1.05, 0.8), granV, 0, 0.525, 0.35, g); mesh(new THREE.BoxGeometry(4.5, 0.06, 0.9), brass, 0, 1.08, 0.35, g);
  for (const sx of [-1.95, 1.95]) mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.6, 16), brass, sx, 1.85, -0.02, g);
  mesh(new THREE.BoxGeometry(4.3, 2.55, 0.12), brass, 0, 2.95, -0.08, g);
  const scr = mesh(new THREE.PlaneGeometry(4.0, 2.25), new THREE.MeshBasicMaterial({map: ctex(boardCanvas(), true), toneMapped: false}), 0, 2.95, -0.015, g); scr.name = 'bank-balance-board';
  for (const sy of [1.66, 4.24]) mesh(new THREE.CylinderGeometry(0.05, 0.05, 4.3, 12), brass, 0, sy, -0.02, g).rotation.z = Math.PI / 2;
  for (let i = 0; i < 6; i++) { const st = mesh(new THREE.BoxGeometry(0.16, 0.05 + i * 0.012, 0.07), cashTop, -1.6 + i * 0.22, 1.12 + (0.05 + i * 0.012) / 2, 0.45, g); st.rotation.y = (rnd() - 0.5) * 0.2; }
  L.walls.push({x0: bx - 2.4, x1: bx + 2.4, z0: bz - 1.0, z1: bz + 1.0, y0: y, y1: y + 1.1});
  W3D.bankBoard = scr; P = null;
}

/* ---------- hook, lift and menu spot ---------- */
W3D.buildBankPlus = function (rootIn) {
  L = W3D.lib; M = W3D.M; root = rootIn; R = document.querySelector('a-scene').renderer;
  const t0 = performance.now(); makeEnvs();
  try { upgradeMaterials(); } catch (e) { console.warn('bank materials', e); }
  try { buildExterior(); } catch (e) { console.warn('bank exterior', e); }
  buildVault();
  document.querySelector('a-scene').setAttribute('bank-tick', '');
  W3D.bankBuildMs = Math.round(performance.now() - t0);
};
W3D.tickBank = function (t) { // the vault is only drawn when you are below ground near it (saves ~120k triangles everywhere else)
  const cam = W3D._cam || (W3D._cam = document.querySelector('[camera]')); if (!cam) return; const p = cam.object3D.getWorldPosition(W3D._bv || (W3D._bv = new THREE.Vector3()));
  if (W3D.gateDoors) { // gate leaves: open when you are within ~14 m of the gate, close when you leave; a click overrides for 20 s
    const near = Math.hypot(p.x - 894, p.z - L.HQ.z) < 14 && p.y < L.HQ.y + 16; let open = near;
    if (W3D.gateManualT && performance.now() - W3D.gateManualT < 20000) open = W3D.gateManual; W3D.gateOpenNow = open;
    for (const d of W3D.gateDoors) { const tgt = open ? -d.s * 1.5 : 0; d.a += Math.max(-0.035, Math.min(0.035, tgt - d.a)); d.piv.rotation.y = d.a; }
  }
  if (!vaultG) return;
  const inside = p.y < 33.5 && p.x > 920 && p.x < 985 && p.z > -405 && p.z < -355; if (++frames > 3) vaultG.visible = inside; if (inside) for (const f of anim) f(t);
};
AFRAME.registerComponent('bank-lift', { schema: {to: {type: 'string'}}, init: function () { this.el.addEventListener('click', () => { if (this.data.to === 'vault') { W3D.spots.vault(); JFVR.hud && JFVR.hud("Bank vault - Josh's account"); } else { W3D.teleportTo(942.6, L ? L.HQ.y + 0.3 : 34.3, -380, -90); JFVR.hud && JFVR.hud('Banking hall'); } }); } });
AFRAME.registerComponent('bank-tick', { tick: function (t) { if (W3D.active && W3D.tickBank) W3D.tickBank(t); } });
const addSpots = () => { if (!W3D.spots) return setTimeout(addSpots, 50); W3D.spots.vault = () => W3D.teleportTo(931.5, V.y, V.zc, -65); };
addSpots();
})();
