/* Fowling Pond Corporate Base at the Bridgewater complex (Josh, 23 Nov 2026: rebuild the prison as a big, polished corporate base for
   Fowling Pond; prisoners are the workforce of the whole system; 15+ rockets; Alden Square made nice with a raised viewpoint).
   Where: the real Bridgewater, MA complex inside the Bridgewater detail patch (launch.js; ortho + 3DEP), ~950 m south of the launch pad.
   Basis: Josh's Drive > Buildings > Bridgewater Correctional Complex (concept plan, Nov 2026; photos of the old courtyard building):
   the old pre-1974 hospital building (a big courtyard block, red brick, cupola) is shown restored as Heritage Hall; the former
   Treatment Center site becomes the Residence Quarter (six worker halls round a garden), the Old Colony site the Training Campus
   (training centre, dining hall); shuttle depot; launch yard with 18 rockets; Alden Square with an overlook terrace.
   Generic signage only (no names of people / patients / staff). Work crews (instanced, matching uniforms, tools, no chains or cages)
   stand on the ground beside the pad, the pond shore, the bank / temple grounds and around the base.
   Load rule: base within 650 m of its centre (dropped past 900 m), crew sites within ~450-700 m of their own site. Everything is merged /
   instanced (a handful of draw calls). Google 3D tiles are cut out under the base (realearth jfRect slot 1). */
(function () {
'use strict';
const W3D = window.W3D = window.W3D || {};
const LITE = !!window.JFVR_LITE;
const SEG = LITE ? 8 : 14;
const CEN = {x: 9450, z: -2000}, LOAD = 650, DROP = 900;
const PADC = {x: 9617.0, z: -2976.9};
const Q = {x0: 9585, x1: 9685, z0: -2120, z1: -2035};      // Heritage Hall outer block
const QB = {x0: 9468, x1: 9558, z0: -2112, z1: -2046};     // Chapel court block (west)
const PLAZA = {x0: 9610, x1: 9660, z0: -2031, z1: -1992};  // entrance plaza
const ALD = {x0: 9555, x1: 9615, z0: -1930, z1: -1865};    // Alden Square
const TER = {x0: 9556, x1: 9614, z0: -1964, z1: -1936, h: 7.6};   // overlook terrace (north edge of the square)
const FIELD = {x0: 9650, x1: 9792, z0: -2312, z1: -2214};  // rocket yard
const RES = {x: 9170, z: -2050};                            // residence quarter centre
const TRN = {x: 9318, z: -1780};                            // training campus centre
const DEP = {x: 9402, z: -2012};                            // shuttle depot
const SPOTS = {bridgewater: {x: 9635, z: -1958, yaw: 0}, rockets: {x: 9718, z: -2188, yaw: 0}};
const gh = (x, z) => { const h = W3D.patchH ? W3D.patchH(x, z) : null; return h !== null && h !== undefined ? h : (W3D.terrainH ? W3D.terrainH(x, z) : 0); };
const rnd = (() => { let s = 20261123; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; })();
let grp = null, built = false, building = false;
const walls = [], floors = [];
const stats = {base: 0, rockets: 0};
let HY = 0, RY = 0, TY = 0, DY = 0, AY = 0, RYL = 0;

/* ---------- merged-geometry batch ---------- */
const UNIT = () => UNIT.g || (UNIT.g = new THREE.BoxGeometry(1, 1, 1));
function Batch() { this.p = []; this.n = []; this.c = []; this.u = []; this.i = []; this.v = 0; }
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _v = new THREE.Vector3(), _e = new THREE.Euler();
const _nm = new THREE.Matrix3(), _col = new THREE.Color();
Batch.prototype.geo = function (g, m, col, uvf) {
  const pa = g.attributes.position, na = g.attributes.normal, ua = g.attributes.uv; _nm.getNormalMatrix(m); _col.set(col);
  for (let i = 0; i < pa.count; i++) {
    _v.fromBufferAttribute(pa, i).applyMatrix4(m); this.p.push(_v.x, _v.y, _v.z);
    _v.fromBufferAttribute(na, i).applyMatrix3(_nm).normalize(); this.n.push(_v.x, _v.y, _v.z); this.c.push(_col.r, _col.g, _col.b);
    let u = ua.getX(i), v = ua.getY(i); if (uvf) { const f = uvf[Math.floor(i / 4)] || [1, 1]; u *= f[0]; v *= f[1]; } this.u.push(u, v); }
  const ix = g.index; if (ix) for (let k = 0; k < ix.count; k++) this.i.push(this.v + ix.getX(k)); else for (let k = 0; k < pa.count; k++) this.i.push(this.v + k); this.v += pa.count; };
Batch.prototype.tri = function (a, b, c, col) {
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
  let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l; _col.set(col);
  [a, b, c].forEach(p => { this.p.push(p[0], p[1], p[2]); this.n.push(nx, ny, nz); this.c.push(_col.r, _col.g, _col.b); this.u.push(p[0] * 0.25, p[2] * 0.25); });
  this.i.push(this.v, this.v + 1, this.v + 2); this.v += 3; };
Batch.prototype.quad = function (a, b, c, d, col) { this.tri(a, b, c, col); this.tri(a, c, d, col); };
Batch.prototype.build = function (mat, name) {
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(this.u, 2)); g.setIndex(this.i);
  const m = new THREE.Mesh(g, mat); m.name = name || 'bw-batch'; m.frustumCulled = false; m.userData.tris = this.i.length / 3; return m; };
Batch.prototype.empty = function () { return !this.i.length; };
const wallUV = (w, h, d) => [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]].map(a => [Math.max(1, Math.round(a[0] / 4)), Math.max(1, Math.round(a[1] / 3.6))]);
Batch.prototype.box = function (x, y0, z, w, h, d, col, ry, wall) {
  _q.setFromEuler(_e.set(0, ry || 0, 0)); _m.compose(_v.set(x, y0 + h / 2, z), _q, _s.set(w, h, d)); this.geo(UNIT(), _m, col, wall ? wallUV(w, h, d) : null); };
Batch.prototype.cyl = function (x, y0, z, r0, r1, h, col, seg, ry) { const g = new THREE.CylinderGeometry(r1, r0, h, seg || SEG, 1); _q.setFromEuler(_e.set(0, ry || 0, 0)); _m.compose(_v.set(x, y0 + h / 2, z), _q, _s.set(1, 1, 1)); this.geo(g, _m, col); g.dispose(); };
Batch.prototype.ico = function (x, y, z, r, col, sy, det) { const g = new THREE.IcosahedronGeometry(r, det === undefined ? 1 : det); _q.identity(); _m.compose(_v.set(x, y, z), _q, _s.set(1, sy || 1, 1)); this.geo(g, _m, col); g.dispose(); };
Batch.prototype.gable = function (cx, y0, cz, w, d, rise, col, axis, oh, gcol) {
  oh = oh === undefined ? 0.6 : oh; const y1 = y0 + rise;
  if (axis === 'x') { const x0 = cx - w / 2 - oh, x1 = cx + w / 2 + oh, z0 = cz - d / 2 - oh, z1 = cz + d / 2 + oh;
    this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, cz], [x0, y1, cz], col); this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, cz], [x1, y1, cz], col);
    this.tri([x0, y0, z0], [x0, y0, z1], [x0, y1, cz], gcol || col); this.tri([x1, y0, z1], [x1, y0, z0], [x1, y1, cz], gcol || col);
  } else { const z0 = cz - d / 2 - oh, z1 = cz + d / 2 + oh, x0 = cx - w / 2 - oh, x1 = cx + w / 2 + oh;
    this.quad([x1, y0, z0], [x1, y0, z1], [cx, y1, z1], [cx, y1, z0], col); this.quad([x0, y0, z1], [x0, y0, z0], [cx, y1, z0], [cx, y1, z1], col);
    this.tri([x0, y0, z0], [x1, y0, z0], [cx, y1, z0], gcol || col); this.tri([x1, y0, z1], [x0, y0, z1], [cx, y1, z1], gcol || col); } };
Batch.prototype.hip = function (cx, y0, cz, w, d, rise, col, oh) {
  oh = oh === undefined ? 0.5 : oh; const x0 = cx - w / 2 - oh, x1 = cx + w / 2 + oh, z0 = cz - d / 2 - oh, z1 = cz + d / 2 + oh, y1 = y0 + rise, k = Math.max(0, (w - d) / 2);
  const a = [cx - k, y1, cz], b = [cx + k, y1, cz];
  this.quad([x0, y0, z1], [x1, y0, z1], b, a, col); this.quad([x1, y0, z0], [x0, y0, z0], a, b, col);
  this.tri([x0, y0, z0], [x0, y0, z1], a, col); this.tri([x1, y0, z1], [x1, y0, z0], b, col); };
Batch.prototype.spire = function (x, y0, z, r, h, col, seg) { this.cyl(x, y0, z, r, 0.001, h, col, seg || 4, Math.PI / 4); };
function rotInto(dst, src, x, y, z, ry) { const c = Math.cos(ry), s = Math.sin(ry), base = dst.v;
  for (let i = 0; i < src.p.length; i += 3) { const px = src.p[i], py = src.p[i + 1], pz = src.p[i + 2]; dst.p.push(x + px * c + pz * s, y + py, z - px * s + pz * c);
    const nx = src.n[i], nz = src.n[i + 2]; dst.n.push(nx * c + nz * s, src.n[i + 1], -nx * s + nz * c); dst.c.push(src.c[i], src.c[i + 1], src.c[i + 2]); }
  for (let i = 0; i < src.u.length; i++) dst.u.push(src.u[i]); for (const k of src.i) dst.i.push(base + k); dst.v += src.v; }

/* ---------- textures ---------- */
const TXC = {};
function cvs(n) { const c = document.createElement('canvas'); c.width = c.height = n; return c; }
function texFrom(c) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = LITE ? 2 : 8; return t; }
function wallTex(kind) {
  if (TXC[kind]) return TXC[kind]; const N = LITE ? 128 : 256, c = cvs(N), g = c.getContext('2d'), s = N / 256; g.scale(s, s);
  const win = (x, y, w, h, arch, glass) => { g.fillStyle = '#f1ead9'; g.fillRect(x - 6, y - 6, w + 12, h + 12); if (arch) { g.beginPath(); g.arc(x + w / 2, y, w / 2 + 6, Math.PI, 0); g.fill(); }
    const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, glass[0]); gr.addColorStop(1, glass[1]); g.fillStyle = gr; g.fillRect(x, y, w, h); if (arch) { g.beginPath(); g.arc(x + w / 2, y, w / 2, Math.PI, 0); g.fill(); }
    g.strokeStyle = '#f1ead9'; g.lineWidth = 3; g.beginPath(); g.moveTo(x + w / 2, y - (arch ? w / 2 : 0)); g.lineTo(x + w / 2, y + h); g.moveTo(x, y + h * 0.45); g.lineTo(x + w, y + h * 0.45); g.stroke(); g.fillStyle = '#cfc6b0'; g.fillRect(x - 9, y + h + 4, w + 18, 7); };
  if (kind === 'brick' || kind === 'brick2') { g.fillStyle = kind === 'brick' ? '#a4513c' : '#b9684a'; g.fillRect(0, 0, 256, 256);
    for (let r = 0; r < 32; r++) { const y = r * 8; g.fillStyle = 'rgba(235,220,200,0.55)'; g.fillRect(0, y, 256, 1.4); for (let x = (r % 2) * 16; x < 256; x += 32) g.fillRect(x, y, 1.4, 8); }
    for (let i = 0; i < 700; i++) { g.fillStyle = 'rgba(' + (rnd() < 0.5 ? '60,20,10' : '230,170,140') + ',' + (0.05 + rnd() * 0.1) + ')'; g.fillRect(rnd() * 256, rnd() * 256, 10 + rnd() * 20, 7); }
    g.fillStyle = '#d8cdb4'; g.fillRect(0, 238, 256, 18); win(88, 70, 80, 120, true, ['#35505e', '#1b2f3a']); }
  else if (kind === 'cream') { g.fillStyle = '#eee3c8'; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 500; i++) { g.fillStyle = 'rgba(120,100,70,' + rnd() * 0.06 + ')'; g.fillRect(rnd() * 256, rnd() * 256, 12, 2); }
    g.fillStyle = '#e1d4b3'; g.fillRect(0, 240, 256, 16); win(92, 76, 72, 112, false, ['#3e6074', '#223c4a']); g.fillStyle = '#35564a'; g.fillRect(76, 76, 10, 112); g.fillRect(170, 76, 10, 112); }
  else if (kind === 'res') { g.fillStyle = '#d9c9a6'; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 500; i++) { g.fillStyle = 'rgba(110,80,50,' + rnd() * 0.07 + ')'; g.fillRect(rnd() * 256, rnd() * 256, 14, 2); }
    g.fillStyle = '#8b5e3c'; g.fillRect(0, 214, 256, 10); g.fillStyle = '#6e4a2e'; for (let x = 4; x < 256; x += 14) g.fillRect(x, 190, 4, 24);
    win(34, 56, 70, 134, false, ['#3b6678', '#1e3a48']); win(152, 56, 70, 134, false, ['#3b6678', '#1e3a48']); }
  else { g.fillStyle = '#b7b09f'; g.fillRect(0, 0, 256, 256); const gr = g.createLinearGradient(0, 0, 256, 256); gr.addColorStop(0, '#a9d6e6'); gr.addColorStop(1, '#4f8aa0'); g.fillStyle = gr; g.fillRect(18, 14, 220, 226);
    g.strokeStyle = '#e9e6dd'; g.lineWidth = 4; for (let x = 18; x <= 238; x += 55) { g.beginPath(); g.moveTo(x, 14); g.lineTo(x, 240); g.stroke(); } g.beginPath(); g.moveTo(18, 120); g.lineTo(238, 120); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.18)'; g.beginPath(); g.moveTo(40, 14); g.lineTo(120, 14); g.lineTo(40, 140); g.fill(); }
  const t = texFrom(c); TXC[kind] = t; return t; }
function labelTex(lines, o) {
  o = o || {}; const W = o.w || 768, H = o.h || 192, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  g.fillStyle = o.bg || '#1d3a33'; g.fillRect(0, 0, W, H); g.strokeStyle = '#e8d9a0'; g.lineWidth = 6; g.strokeRect(5, 5, W - 10, H - 10); g.fillStyle = '#e8d9a0'; g.textAlign = 'center';
  const n = lines.length; lines.forEach((t, i) => { g.font = (i === 0 ? 'bold ' : '') + Math.round(H / (n + 0.9) * (i === 0 ? 0.95 : 0.7)) + 'px Georgia, serif'; g.fillText(t, W / 2, H * (i + 0.95) / (n + 0.5)); });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }

/* ---------- materials ---------- */
let MAT = null;
function mats() {
  if (MAT) return MAT; const L = o => new THREE.MeshLambertMaterial(Object.assign({vertexColors: true}, o));
  MAT = {brick: L({map: wallTex('brick')}), brick2: L({map: wallTex('brick2')}), cream: L({map: wallTex('cream')}), res: L({map: wallTex('res')}), mod: L({map: wallTex('mod')}),
    plain: L({}), glass: L({transparent: true, opacity: 0.42, side: THREE.DoubleSide, depthWrite: false}), emis: new THREE.MeshBasicMaterial({vertexColors: true}),
    water: new THREE.MeshBasicMaterial({vertexColors: true, transparent: true, opacity: 0.8})}; return MAT; }
function newB() { return {brick: new Batch(), brick2: new Batch(), cream: new Batch(), res: new Batch(), mod: new Batch(), plain: new Batch(), glass: new Batch(), emis: new Batch(), water: new Batch()}; }
function flush(B, g, tag) { const M = mats(); let t = 0; for (const k in B) if (!B[k].empty()) { const m = B[k].build(M[k], 'bw-' + tag + '-' + k); g.add(m); t += m.userData.tris; } return t; }
function inst(geoBatch, mat, items, name) {
  const m = geoBatch.build(mat, name), I = new THREE.InstancedMesh(m.geometry, mat, items.length); I.name = name; I.frustumCulled = false;
  const mm = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(), e = new THREE.Euler(), cc = new THREE.Color();
  items.forEach((it, i) => { q.setFromEuler(e.set(0, it.ry || 0, 0)); mm.compose(p.set(it.x, it.y, it.z), q, s.set(it.sx || it.s || 1, it.sy || it.s || 1, it.sz || it.sx || it.s || 1)); I.setMatrixAt(i, mm); if (it.c !== undefined) I.setColorAt(i, cc.set(it.c)); });
  I.instanceMatrix.needsUpdate = true; if (I.instanceColor) I.instanceColor.needsUpdate = true; I.userData.tris = m.userData.tris * items.length; return I; }

/* ---------- collision / floors registered with world.js while the base is up ---------- */
const wall = (x0, x1, z0, z1, y0, y1) => { walls.push({x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1), y0, y1}); };
const wallRot = (px, pz, w, d, ry, y0, y1) => { const c = Math.abs(Math.cos(ry)), s = Math.abs(Math.sin(ry)), hx = (w * c + d * s) / 2, hz = (w * s + d * c) / 2; wall(px - hx, px + hx, pz - hz, pz + hz, y0, y1); };
const floor = (x0, x1, z0, z1, y) => { floors.push({x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1), y}); };
function register() { const L = W3D.lib; if (!L) return; for (const w of walls) if (L.walls.indexOf(w) < 0) L.walls.push(w); for (const f of floors) if (L.floors.indexOf(f) < 0) L.floors.push(f); }
function unregister() { const L = W3D.lib; if (!L) return; for (const w of walls) { const i = L.walls.indexOf(w); if (i >= 0) L.walls.splice(i, 1); } for (const f of floors) { const i = L.floors.indexOf(f); if (i >= 0) L.floors.splice(i, 1); } }

const COL = {slate: 0x4f5c66, slate2: 0x5d6b75, copper: 0x5fa597, granite: 0xb4ada0, granite2: 0x8f897d, lime: 0xe6dcc3, white: 0xf4f1e8, lawn: 0x6d9a4e, lawn2: 0x7aa85a, paving: 0xcdbf9e, paving2: 0xb9ab8c, path: 0xd8c9a2,
  gold: 0xd9b24a, dark: 0x2b3a35, teal: 0x1f6f6a, trunk: 0x6b4a2f, leaf: 0x4f8a3f, leaf2: 0x3d7a46, flower: 0xd65a7a, flower2: 0xf2c14e, asphalt: 0x4a4d50, wood: 0x8a6240};

/* ---------- scatter lists (instanced props) ---------- */
function Props() { this.trees = []; this.pines = []; this.lamps = []; this.benches = []; this.beds = []; this.bollards = []; }
function tree(P, x, z, s) { const y = gh(x, z); (rnd() < 0.8 ? P.trees : P.pines).push({x, y, z, s: s || 0.8 + rnd() * 0.6, ry: rnd() * 6, c: [0xffffff, 0xe8f2d8, 0xf6e9c8, 0xd9ecc2][Math.floor(rnd() * 4)]}); }
function lamp(P, x, z, y) { P.lamps.push({x, y: y === undefined ? gh(x, z) : y, z}); }
function bench(P, x, z, ry, y) { P.benches.push({x, y: y === undefined ? gh(x, z) : y, z, ry}); }
function bed(P, x, z, w, d, y, c) { P.beds.push({x, y: y === undefined ? gh(x, z) : y, z, sx: w, sz: d, c}); }

/* ---------- reusable pieces ---------- */
function plinthed(B, x, y0, z, w, d, h, kind, tint, ry) { B.plain.box(x, y0 - 3, z, w + 0.5, 3.0 + 1.1, d + 0.5, COL.granite2, ry); B[kind].box(x, y0 + 1.1, z, w, h, d, tint === undefined ? 0xffffff : tint, ry, true); }
function colonnade(B, x0, z, n, step, y0, h, col) { for (let k = 0; k < n; k++) { B.plain.cyl(x0 + k * step, y0, z, 0.55, 0.45, h, col || COL.white, SEG); B.plain.box(x0 + k * step, y0, z, 1.5, 0.35, 1.5, COL.granite); B.plain.box(x0 + k * step, y0 + h, z, 1.5, 0.35, 1.5, COL.granite); } }
function dormers(B, cx, y0, cz, w, d, n) { for (let k = 0; k < n; k++) { const t = (k + 0.5) / n - 0.5, px = cx + t * w, pz = cz + d * 0.16;
  B.cream.box(px, y0, pz, 2.2, 2.2, 1.8, 0xffffff, 0, true); B.plain.gable(px, y0 + 2.2, pz, 2.2, 1.8, 1.3, COL.slate2, 'z', 0.25); } }
function tower(B, x, y0, z, s, h, kind) {
  B.plain.box(x, y0 - 3, z, s + 1, 4.1, s + 1, COL.granite2); B[kind].box(x, y0 + 1.1, z, s, h, s, 0xffffff, 0, true);
  const yb = y0 + 1.1 + h; B.plain.box(x, yb, z, s + 1.0, 0.7, s + 1.0, COL.granite); B.cream.box(x, yb + 0.7, z, s - 1.0, 4.2, s - 1.0, 0xffffff, 0, true);
  for (const [dx, dz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) B.plain.box(x + dx * (s / 2 - 0.35), yb + 0.7, z + dz * (s / 2 - 0.35), 0.9, 4.2, 0.9, COL.granite);
  B.plain.box(x, yb + 4.9, z, s + 1.2, 0.5, s + 1.2, COL.granite);
  const fy = yb - 2.6, r = 1.7; for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2, nx = Math.sin(a), nz = Math.cos(a), cx = x + nx * (s / 2 + 0.06), cz = z + nz * (s / 2 + 0.06);
    const g = new THREE.CylinderGeometry(r, r, 0.12, 20); _q.setFromEuler(new THREE.Euler(Math.PI / 2, a, 0, 'YXZ')); _m.compose(_v.set(cx, fy, cz), _q, _s.set(1, 1, 1)); B.emis.geo(g, _m, 0xfff1c9); g.dispose();
    const hg = new THREE.BoxGeometry(0.14, 1.3, 0.05); _q.setFromEuler(new THREE.Euler(0, a, 0.5, 'YXZ')); _m.compose(_v.set(cx + nx * 0.1, fy + 0.4, cz + nz * 0.1), _q, _s.set(1, 1, 1)); B.plain.geo(hg, _m, 0x222222); hg.dispose(); }
  const yc = yb + 5.4; B.plain.cyl(x, yc, z, s * 0.62, s * 0.5, 1.0, COL.granite, 8); B.plain.cyl(x, yc + 1.0, z, s * 0.46, s * 0.46, 2.4, COL.lime, 8);
  B.plain.cyl(x, yc + 3.4, z, s * 0.62, 0.3, 4.2, COL.copper, 8); B.plain.cyl(x, yc + 7.6, z, 0.12, 0.05, 2.2, COL.gold, 6); B.emis.ico(x, yc + 9.9, z, 0.38, 0xffe08a, 1, 0); return yc + 10; }
function fountain(B, x, y, z, r) { B.plain.cyl(x, y, z, r, r, 0.7, COL.granite, SEG * 2); B.plain.cyl(x, y + 0.7, z, r * 0.92, r * 0.92, 0.12, COL.granite2, SEG * 2);
  B.water.cyl(x, y + 0.45, z, r * 0.9, r * 0.9, 0.4, 0x4aa3c8, SEG * 2); B.plain.cyl(x, y + 0.5, z, r * 0.22, r * 0.15, 1.8, COL.granite, SEG); B.plain.cyl(x, y + 2.3, z, r * 0.55, r * 0.25, 0.25, COL.granite, SEG);
  B.water.cyl(x, y + 2.5, z, r * 0.5, r * 0.5, 0.15, 0x7cc5e4, SEG); B.plain.cyl(x, y + 2.5, z, r * 0.08, r * 0.08, 1.2, COL.granite, 6); B.emis.cyl(x, y + 3.5, z, r * 0.1, 0.02, 2.0, 0xcdeffa, 6); }

/* ---------- Heritage Hall: the old courtyard building, restored ---------- */
function buildHeritage(B, P, W) {
  const cx = (Q.x0 + Q.x1) / 2, cz = (Q.z0 + Q.z1) / 2, Wd = Q.x1 - Q.x0, Dp = Q.z1 - Q.z0, dep = 14, hS = 3 * 3.6, yl = HY;
  B.plain.box(cx, yl - 3, cz, Wd + 6, 3.0 + 0.05, Dp + 6, COL.granite2);
  const cw = Wd - 2 * dep, cd = Dp - 2 * dep;
  B.plain.box(cx, yl - 0.6, cz, cw + 1, 0.7, cd + 1, COL.lawn);
  B.plain.box(cx, yl + 0.08, cz, cw, 0.1, 3, COL.path); B.plain.box(cx, yl + 0.08, cz, 3, 0.1, cd, COL.path);
  B.plain.cyl(cx, yl + 0.0, cz, 9, 9, 0.18, COL.paving, 20); fountain(B, cx, yl + 0.1, cz, 5);
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const px = cx + dx * 18, pz = cz + dz * 14;
    B.plain.box(px, yl + 0.05, pz, 22, 0.5, 0.7, COL.leaf2); B.plain.box(px, yl + 0.05, pz + dz * 9, 22, 0.5, 0.7, COL.leaf2); B.plain.box(px + dx * 11, yl + 0.05, pz + dz * 4.5, 0.7, 0.5, 9.7, COL.leaf2); B.plain.box(px - dx * 11, yl + 0.05, pz + dz * 4.5, 0.7, 0.5, 9.7, COL.leaf2);
    bed(P, px, pz + dz * 4.5, 18, 6, yl + 0.1, dx * dz > 0 ? COL.flower : COL.flower2); bed(P, px, pz + dz * 1.2, 18, 2.2, yl + 0.1, COL.flower2);
    tree(P, px - dx * 6, pz + dz * 4, 1.0); tree(P, px + dx * 6, pz + dz * 4, 0.9); bench(P, px + dx * 3, pz - dz * 3.5, dz > 0 ? 0 : Math.PI, yl + 0.1); }
  for (const s of [-1, 1]) for (let k = 0; k < 12; k++) B.plain.box(cx - 33 + k * 6, yl + 0.1, cz + s * (cd / 2 - 1.2), 0.7, 3.4, 0.7, COL.lime);
  B.plain.box(cx, yl + 3.5, cz - (cd / 2 - 1.2), 70, 0.3, 2.6, COL.slate2); B.plain.box(cx, yl + 3.5, cz + (cd / 2 - 1.2), 70, 0.3, 2.6, COL.slate2);
  const pass = 3.2, wing = (x, z, w, d, axis, kind) => { plinthed(B, x, yl, z, w, d, hS, kind); B.plain.gable(x, yl + 1.1 + hS, z, w, d, 4.6, COL.slate, axis, 0.7, 0xd8cdb4); };
  wing(cx, Q.z0 + dep / 2, Wd, dep, 'x', 'brick'); wing(Q.x0 + dep / 2, cz, dep, Dp - 2 * dep, 'z', 'brick'); wing(Q.x1 - dep / 2, cz, dep, Dp - 2 * dep, 'z', 'brick');
  const sx0 = Q.x0, sx1 = cx - pass, sx2 = cx + pass, sx3 = Q.x1, sz = Q.z1 - dep / 2;
  wing((sx0 + sx1) / 2, sz, sx1 - sx0, dep, 'x', 'brick'); wing((sx2 + sx3) / 2, sz, sx3 - sx2, dep, 'x', 'brick');
  B.brick.box(cx, yl + 1.1 + 4.6, sz, pass * 2, hS - 4.6, dep, 0xffffff, 0, true); B.plain.box(cx, yl + 0.02, sz, pass * 2 - 0.4, 0.1, dep, COL.paving2);
  for (const [px, pz] of [[Q.x0 + dep / 2, Q.z0 + dep / 2], [Q.x1 - dep / 2, Q.z0 + dep / 2], [Q.x0 + dep / 2, Q.z1 - dep / 2], [Q.x1 - dep / 2, Q.z1 - dep / 2]]) {
    plinthed(B, px, yl, pz, dep + 1.5, dep + 1.5, hS + 3.6, 'brick2'); B.plain.box(px, yl + 1.1 + hS + 3.6 - 0.4, pz, dep + 2.9, 0.8, dep + 2.9, COL.granite); B.plain.hip(px, yl + 1.1 + hS + 3.6 + 0.4, pz, dep + 1.5, dep + 1.5, 6.5, COL.copper, 0.9); B.plain.cyl(px + 3, yl + 1.1 + hS + 3.6, pz - 3, 0.5, 0.5, 9, 0x8c4a38, 6); }
  dormers(B, cx, yl + 1.1 + hS + 1.2, Q.z0 + dep / 2, Wd - 40, dep, 7); dormers(B, (sx0 + sx1) / 2, yl + 1.1 + hS + 1.2, sz, sx1 - sx0 - 28, dep, 3); dormers(B, (sx2 + sx3) / 2, yl + 1.1 + hS + 1.2, sz, sx3 - sx2 - 28, dep, 3);
  stats.towerTop = tower(B, cx, yl, sz, 11, hS + 7, 'brick') - yl;
  B.plain.box(cx, yl - 0.2, Q.z1 + 4, 24, 0.5, 8, COL.granite);
  colonnade(B, cx - 9, Q.z1 + 3.2, 4, 6, yl + 0.3, 8.2, COL.white); B.plain.box(cx, yl + 8.5, Q.z1 + 3.2, 24, 1.2, 3.4, COL.lime); B.plain.gable(cx, yl + 9.7, Q.z1 + 3.2, 24, 3.4, 2.4, COL.slate, 'x', 0.4, COL.lime);
  for (let k = 0; k < 6; k++) B.plain.box(cx - 40 + k * 16, yl + 1.1 + hS + 1.5, Q.z0 + dep / 2 - 1.8, 1.4, 4.5, 1.4, 0x8c4a38);
  for (let k = 0; k < 5; k++) lamp(P, cx - 30 + k * 15, Q.z1 + 11);
  floor(cx - cw / 2, cx + cw / 2, cz - cd / 2, cz + cd / 2, yl + 0.1); floor(cx - 12, cx + 12, Q.z1 - 0.1, Q.z1 + 8, yl + 0.3);
  const hh = yl + 1.1 + hS + 4; wall(Q.x0, Q.x1, Q.z0, Q.z0 + dep, yl - 3, hh); wall(Q.x0, Q.x0 + dep, Q.z0, Q.z1, yl - 3, hh); wall(Q.x1 - dep, Q.x1, Q.z0, Q.z1, yl - 3, hh);
  wall(sx0, sx1, Q.z1 - dep, Q.z1, yl - 3, hh); wall(sx2, sx3, Q.z1 - dep, Q.z1, yl - 3, hh); wall(sx1, sx2, Q.z1 - dep, Q.z1, yl + 4.5, hh);
  wall(cx - 13, cx - 9, Q.z1 + 1.5, Q.z1 + 5, yl, yl + 9); wall(cx + 9, cx + 13, Q.z1 + 1.5, Q.z1 + 5, yl, yl + 9);
  W.signs.push({x: cx, y: yl + 9.1, z: Q.z1 + 4.95, ry: 0, w: 12, h: 1.0, lines: ['HERITAGE HALL'], bg: '#1d3a33'}); }

/* ---------- chapel court + glazed link ---------- */
function buildChapel(B, P, W) {
  const yl = HY, cx = (QB.x0 + QB.x1) / 2, cz = (QB.z0 + QB.z1) / 2, dep = 11;
  B.plain.box(cx, yl - 3, cz, QB.x1 - QB.x0 + 4, 3.05, QB.z1 - QB.z0 + 4, COL.granite2); B.plain.box(cx, yl - 0.2, cz, QB.x1 - QB.x0 - 2 * dep, 0.25, QB.z1 - QB.z0 - 2 * dep, COL.lawn2);
  const h2 = 2 * 3.6, wing = (x, z, w, d, axis) => { plinthed(B, x, yl, z, w, d, h2, 'brick2'); B.plain.gable(x, yl + 1.1 + h2, z, w, d, 3.8, COL.slate, axis, 0.6, 0xd8cdb4); };
  wing(cx, QB.z0 + dep / 2, QB.x1 - QB.x0, dep, 'x'); wing(cx + 8, QB.z1 - dep / 2, QB.x1 - QB.x0 - 16, dep, 'x'); wing(QB.x1 - dep / 2, cz, dep, QB.z1 - QB.z0 - 2 * dep, 'z');
  const chx = QB.x0 + 8, chz = cz; plinthed(B, chx, yl, chz, 15, 34, 9.2, 'cream'); B.plain.gable(chx, yl + 1.1 + 9.2, chz, 15, 34, 6.5, COL.slate, 'z', 0.7, COL.lime);
  B.plain.box(chx, yl + 1.1, chz + 17.2, 5, 10, 1.0, COL.lime); B.emis.box(chx, yl + 7.6, chz + 17.75, 1.6, 2.6, 0.1, 0xffd77a);
  const bx = chx, bz = chz - 17 - 2.5; plinthed(B, bx, yl, bz, 6, 6, 14, 'brick'); B.plain.box(bx, yl + 15.1, bz, 7, 0.5, 7, COL.granite); B.plain.cyl(bx, yl + 15.6, bz, 2.6, 2.6, 3.2, COL.lime, 8); B.plain.spire(bx, yl + 18.8, bz, 3.4, 11, COL.copper, 8); B.plain.cyl(bx, yl + 29.6, bz, 0.12, 0.05, 2.4, COL.gold, 6);
  const lx0 = QB.x1, lx1 = Q.x0, lm = (lx0 + lx1) / 2; B.glass.box(lm, yl + 0.1, cz, lx1 - lx0 + 0.6, 6.2, 8, 0x9fd4e4); B.plain.box(lm, yl + 6.3, cz, lx1 - lx0 + 1.4, 0.4, 9.2, COL.granite); B.plain.box(lm, yl - 0.1, cz, lx1 - lx0, 0.2, 8, COL.paving);
  for (let k = 0; k <= 4; k++) { const px = lx0 + 0.3 + k * (lx1 - lx0 - 0.6) / 4; B.plain.box(px, yl + 0.1, cz - 4.1, 0.3, 6.2, 0.3, COL.white); B.plain.box(px, yl + 0.1, cz + 4.1, 0.3, 6.2, 0.3, COL.white); }
  for (let k = 0; k < 6; k++) tree(P, cx - 12 + (k % 3) * 10, cz - 8 + Math.floor(k / 3) * 14, 0.9); fountain(B, cx + 4, yl + 0.1, cz, 3.2); bed(P, cx + 4, cz + 8, 14, 4, yl + 0.1, COL.flower); bed(P, cx + 4, cz - 8, 14, 4, yl + 0.1, COL.flower2);
  for (let k = 0; k < 3; k++) bench(P, cx - 9 + k * 9, cz + 5.5, 0, yl + 0.1);
  floor(QB.x0 + dep, QB.x1 - dep, QB.z0 + dep, QB.z1 - dep, yl);
  wall(QB.x0, QB.x1, QB.z0, QB.z0 + dep, yl - 3, yl + 12); wall(QB.x0 + 16, QB.x1, QB.z1 - dep, QB.z1, yl - 3, yl + 12); wall(QB.x1 - dep, QB.x1, QB.z0, QB.z1, yl - 3, yl + 12); wall(chx - 7.5, chx + 7.5, chz - 17, chz + 17, yl - 3, yl + 14); wall(bx - 3, bx + 3, bz - 3, bz + 3, yl - 3, yl + 20);
  W.signs.push({x: cx + 10, y: yl + 5, z: QB.z1 + 0.5, ry: 0, w: 8, h: 1.5, lines: ['CHAPEL COURT', 'Quiet garden'], bg: '#2c3d52'}); }

/* ---------- entrance plaza + gate ---------- */
function buildPlaza(B, P, W) {
  const yl = HY, cx = (PLAZA.x0 + PLAZA.x1) / 2, cz = (PLAZA.z0 + PLAZA.z1) / 2, w = PLAZA.x1 - PLAZA.x0, d = PLAZA.z1 - PLAZA.z0;
  B.plain.box(cx, yl - 1.2, cz, w, 1.35, d, COL.paving); for (let i = 0; i < 6; i++) B.plain.box(cx, yl + 0.14, PLAZA.z0 + 4 + i * 6.5, w - 6, 0.02, 0.35, COL.paving2);
  B.plain.box(cx, yl + 0.16, cz, 3, 0.04, d - 2, COL.gold);
  for (const s of [-1, 1]) { B.plain.box(cx + s * 12, yl + 0.1, cz + 1, 5, 0.6, 24, COL.granite); B.water.box(cx + s * 12, yl + 0.35, cz + 1, 4.2, 0.5, 23, 0x4aa3c8); for (let k = 0; k < 4; k++) B.emis.cyl(cx + s * 12, yl + 0.8, PLAZA.z0 + 5 + k * 6, 0.12, 0.02, 1.8, 0xcdeffa, 6); }
  for (let k = 0; k < 3; k++) { const px = cx - 18 + k * 18; B.plain.cyl(px, yl + 0.1, PLAZA.z1 - 3, 0.18, 0.12, 15, COL.white, 8); B.emis.ico(px, yl + 15.4, PLAZA.z1 - 3, 0.3, 0xfff2b0, 1, 0); B.plain.box(px + 1.4, yl + 12.5, PLAZA.z1 - 3, 2.8, 1.8, 0.05, [0x1f6f6a, 0xe8d9a0, 0x9a3b2f][k]); }
  const gz = PLAZA.z1 + 3.5;
  for (const s of [-1, 1]) { B.plain.box(cx + s * 11, yl - 1, gz, 3.2, 8.2, 3.2, COL.granite); B.plain.box(cx + s * 11, yl + 7.2, gz, 3.8, 0.5, 3.8, COL.granite2); B.plain.spire(cx + s * 11, yl + 7.7, gz, 2.3, 2.0, COL.copper, 4); B.emis.ico(cx + s * 11, yl + 10, gz, 0.35, 0xfff2b0, 1, 0); }
  B.plain.box(cx, yl + 6.6, gz, 22, 0.7, 0.7, COL.dark); B.plain.box(cx, yl + 8.0, gz, 22, 0.5, 0.5, COL.gold);
  for (const s of [-1, 1]) { for (let k = 0; k < 10; k++) B.plain.box(cx + s * (14 + k * 2.2), yl + 0.0, gz, 0.2, 2.2, 0.2, COL.dark); B.plain.box(cx + s * 25, yl + 2.0, gz, 22, 0.15, 0.15, COL.dark); B.plain.box(cx + s * 25, yl + 0.4, gz, 22, 0.15, 0.15, COL.dark); }
  for (let k = 0; k < 8; k++) lamp(P, PLAZA.x0 + 3 + k * 6.3, PLAZA.z0 + 2); for (let k = 0; k < 4; k++) bench(P, PLAZA.x0 + 8 + k * 11, PLAZA.z0 + 1, Math.PI, yl + 0.1);
  for (const s of [-1, 1]) for (let k = 0; k < 4; k++) tree(P, cx + s * (19 + k * 4), PLAZA.z0 + 3, 0.8);
  floor(PLAZA.x0, PLAZA.x1, PLAZA.z0, PLAZA.z1, yl + 0.14);
  wall(cx - 12.6, cx - 9.4, gz - 1.6, gz + 1.6, yl, yl + 8); wall(cx + 9.4, cx + 12.6, gz - 1.6, gz + 1.6, yl, yl + 8);
  W.signs.push({x: cx, y: yl + 7.3, z: gz + 0.5, ry: 0, w: 16, h: 1.55, lines: ['FOWLING POND', 'CORPORATE BASE'], bg: '#1d3a33', big: true}); W.signs.push({x: cx, y: yl + 7.3, z: gz - 0.5, ry: Math.PI, w: 16, h: 1.55, lines: ['FOWLING POND', 'CORPORATE BASE'], bg: '#1d3a33', big: true}); }

/* ---------- Residence Quarter (six worker halls round a garden) + dining hall ---------- */
function buildResidence(B, P, W) {
  const yl = RY, R = 58, hh = 4 * 3.6;
  B.plain.box(RES.x, yl - 0.9, RES.z, R * 2 + 36, 1.0, R * 2 + 36, COL.lawn);
  B.plain.cyl(RES.x, yl + 0.0, RES.z, 22, 22, 0.14, COL.paving, 24); fountain(B, RES.x, yl + 0.1, RES.z, 7);
  for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3 + Math.PI / 6, px = RES.x + Math.cos(a) * R, pz = RES.z + Math.sin(a) * R, ry = -a + Math.PI / 2;
    plinthed(B, px, yl, pz, 40, 13, hh, 'res', 0xffffff, ry);
    const r = new Batch(); r.gable(0, 0, 0, 40, 13, 4.2, COL.copper, 'x', 0.7, COL.lime); rotInto(B.plain, r, px, yl + 1.1 + hh, pz, ry);
    for (const lev of [2, 3]) { const bl = new Batch(); for (let j = 0; j < 4; j++) bl.box(-15 + j * 10, 0, 6.9, 7, 0.25, 1.6, COL.wood); rotInto(B.plain, bl, px, yl + 1.1 + 3.6 * lev, pz, ry); }
    wallRot(px, pz, 41, 14, ry, yl - 3, yl + hh + 3);
    B.plain.box(RES.x + Math.cos(a) * (R * 0.55), yl + 0.02, RES.z + Math.sin(a) * (R * 0.55), 3, 0.1, R * 0.5, COL.path, ry + Math.PI / 2 * 0 - Math.PI / 2 + Math.PI / 2);
    W.signs.push({x: px - Math.cos(a) * 7.0, y: yl + 4.6, z: pz - Math.sin(a) * 7.0, ry: -a + Math.PI / 2 + Math.PI, w: 4.8, h: 1.1, lines: ['RESIDENCE HALL ' + 'ABCDEF'[k]], bg: '#6e4a2e'}); }
  for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2; tree(P, RES.x + Math.cos(a) * 30, RES.z + Math.sin(a) * 30, 0.9); lamp(P, RES.x + Math.cos(a + 0.2) * 25, RES.z + Math.sin(a + 0.2) * 25, yl + 0.1); }
  for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; bench(P, RES.x + Math.cos(a) * 14, RES.z + Math.sin(a) * 14, -a, yl + 0.1); bed(P, RES.x + Math.cos(a + 0.4) * 18, RES.z + Math.sin(a + 0.4) * 18, 5, 2.4, yl + 0.1, k % 2 ? COL.flower : COL.flower2); }
  const dx = RES.x + 100, dz = RES.z + 62; plinthed(B, dx, yl, dz, 52, 24, 9.6, 'cream'); B.plain.gable(dx, yl + 1.1 + 9.6, dz, 52, 24, 7.5, COL.copper, 'x', 1.0, COL.lime);
  B.glass.box(dx - 26.5, yl + 1.1, dz, 0.5, 9.6, 18, 0x9fd4e4); for (let k = 0; k < 7; k++) B.plain.box(dx - 26.6, yl + 1.1, dz - 9 + k * 3, 0.3, 9.6, 0.25, COL.white);
  for (let k = 0; k < 6; k++) B.plain.box(dx - 22 + k * 8.5, yl + 1.1 + 9.6, dz + 11, 2.6, 2.0, 1.6, COL.lime); B.plain.cyl(dx + 14, yl + 1.1 + 9.6, dz - 7, 0.7, 0.7, 7, 0x8c4a38, 6);
  B.plain.box(dx - 34, yl + 0.0, dz, 16, 0.15, 30, COL.paving);
  for (let k = 0; k < 4; k++) { const tx = dx - 38 + (k % 2) * 6, tz = dz - 6 + Math.floor(k / 2) * 12; B.plain.cyl(tx, yl + 0.1, tz, 1.6, 1.6, 0.1, COL.wood, 8); B.plain.cyl(tx, yl + 0.2, tz, 0.08, 0.08, 2.6, COL.dark, 5); B.plain.cyl(tx, yl + 2.8, tz, 2.4, 0.2, 0.4, [0x1f6f6a, 0xe8d9a0, 0x9a3b2f, 0x2c3d52][k], 8); }
  wall(dx - 26, dx + 26, dz - 12, dz + 12, yl - 3, yl + 11);
  W.signs.push({x: dx - 27.1, y: yl + 11.7, z: dz, ry: -Math.PI / 2, w: 9, h: 1.6, lines: ['DINING HALL', 'Breakfast · lunch · supper'], bg: '#6e3b2a'});
  B.plain.box((RES.x + dx) / 2 + 20, yl + 0.02, RES.z + 31, 90, 0.1, 3.2, COL.path); floor(RES.x - R - 10, RES.x + R + 10, RES.z - R - 10, RES.z + R + 10, yl + 0.0); }

/* ---------- training campus + shuttle depot ---------- */
function buildTraining(B, P, W) {
  const yl = TY, cx = TRN.x, cz = TRN.z;
  B.plain.box(cx, yl - 0.9, cz, 130, 1.0, 80, COL.lawn2); B.plain.box(cx, yl - 0.05, cz, 62, 0.14, 40, COL.paving);
  plinthed(B, cx, yl, cz - 6, 44, 20, 8.0, 'mod'); B.plain.box(cx, yl + 9.1, cz - 6, 46.5, 0.7, 22.5, COL.granite); B.plain.box(cx, yl + 9.8, cz - 6, 44, 0.6, 20, COL.lawn);
  for (let k = 0; k < 8; k++) B.plain.cyl(cx - 19 + k * 5.4, yl + 9.8, cz - 6 + 11.2, 0.3, 0.3, 1.1, COL.white, 6);
  B.plain.box(cx, yl + 6.9, cz + 8.6, 28, 0.5, 8.4, COL.granite); for (let k = 0; k < 5; k++) B.plain.cyl(cx - 12 + k * 6, yl + 0.1, cz + 11.5, 0.35, 0.35, 6.8, COL.white, 8);
  B.glass.box(cx, yl + 10.4, cz - 6, 20, 3.4, 10, 0xa8dcea); B.plain.box(cx, yl + 13.9, cz - 6, 21, 0.4, 11, COL.granite2);
  wall(cx - 22, cx + 22, cz - 16, cz - 2, yl - 3, yl + 12);
  W.signs.push({x: cx, y: yl + 5.2, z: cz + 12.9, ry: 0, w: 14, h: 1.6, lines: ['TRAINING CENTER', 'Skills · safety · certification'], bg: '#1d3a33'});
  for (let k = 0; k < 3; k++) { const px = cx + 70, pz = cz - 22 + k * 22; plinthed(B, px, yl, pz, 26, 14, 5.6, 'cream'); for (let j = 0; j < 4; j++) B.plain.gable(px - 9.75 + j * 6.5, yl + 1.1 + 5.6, pz, 6.5, 14, 2.0, COL.copper, 'z', 0.0, COL.lime); wall(px - 13, px + 13, pz - 7, pz + 7, yl - 3, yl + 7); }
  for (let k = 0; k < 10; k++) tree(P, cx - 60 + k * 12, cz + 34 + rnd() * 3, 0.9); for (let k = 0; k < 6; k++) lamp(P, cx - 25 + k * 10, cz + 16, yl + 0.1); for (let k = 0; k < 4; k++) bench(P, cx - 15 + k * 10, cz + 20, 0, yl + 0.1);
  for (let k = 0; k < 4; k++) bed(P, cx - 24 + k * 16, cz + 27, 10, 3, yl + 0.1, k % 2 ? COL.flower : COL.flower2);
  floor(cx - 31, cx + 31, cz - 20, cz + 20, yl + 0.09);
  const dy = DY, dx = DEP.x, dz = DEP.z; B.plain.box(dx, dy - 0.9, dz, 50, 1.0, 20, COL.asphalt); B.plain.box(dx, dy - 0.05, dz + 12, 52, 0.14, 5, COL.paving); B.plain.box(dx, dy + 5.4, dz, 46, 0.5, 14, COL.white); B.plain.box(dx, dy + 5.9, dz, 46, 0.25, 14, COL.teal);
  for (let k = 0; k < 6; k++) for (const s of [-1, 1]) B.plain.cyl(dx - 22 + k * 8.8, dy + 0.0, dz + s * 6, 0.22, 0.22, 5.4, COL.white, 6);
  for (let k = 0; k < 6; k++) B.emis.box(dx - 22 + k * 8.8, dy + 5.3, dz, 1.2, 0.08, 6, 0xfff6d0);
  for (let k = 0; k < 3; k++) { const bx = dx - 15 + k * 15; B.plain.box(bx, dy + 0.5, dz - 2, 3.0, 2.6, 11, [COL.teal, COL.teal, 0xe9e6dc][k]); B.plain.box(bx, dy + 1.4, dz - 2, 3.06, 1.0, 9.6, 0x274b57); B.plain.box(bx, dy + 3.1, dz - 2, 2.9, 0.18, 10.8, COL.white);
    for (const s of [-1, 1]) for (const t of [-3.4, 3.6]) B.plain.cyl(bx + s * 1.5, dy, dz - 2 + t, 0.5, 0.5, 0.3, 0x111111, 8); B.emis.box(bx, dy + 0.9, dz - 7.55, 2.2, 0.35, 0.06, 0xfff3c0); }
  wall(dx - 23, dx + 23, dz - 7.5, dz + 7.5, dy - 3, dy + 6);
  W.signs.push({x: dx, y: dy + 7.6, z: dz + 7.4, ry: 0, w: 12, h: 1.9, lines: ['SHUTTLE DEPOT', 'Route 1 Launch Pad · Route 2 Pond & Temple', 'Route 3 Bank grounds'], bg: '#0f4a46', h2: 1, big: true});
  for (let k = 0; k < 6; k++) lamp(P, dx - 24 + k * 9.6, dz + 13, dy + 0.1); }

/* ---------- Alden Square + overlook terrace ---------- */
function buildAlden(B, P, W) {
  const yl = AY, cx = (ALD.x0 + ALD.x1) / 2, cz = (ALD.z0 + ALD.z1) / 2, w = ALD.x1 - ALD.x0, d = ALD.z1 - ALD.z0;
  B.plain.box(cx, yl - 1.2, cz, w, 1.35, d, COL.paving); B.plain.box(cx, yl + 0.14, cz, w - 6, 0.02, d - 6, COL.paving2); B.plain.box(cx, yl + 0.16, cz, w - 8, 0.02, d - 8, COL.paving);
  for (let k = 0; k < 7; k++) { B.plain.box(cx, yl + 0.18, ALD.z0 + 5 + k * 9, w - 8, 0.02, 0.3, COL.paving2); B.plain.box(ALD.x0 + 6 + k * 8.2, yl + 0.18, cz, 0.3, 0.02, d - 8, COL.paving2); }
  B.plain.cyl(cx, yl + 0.2, cz, 13, 13, 0.06, COL.gold, 24); B.plain.cyl(cx, yl + 0.22, cz, 12.4, 12.4, 0.06, COL.paving, 24); fountain(B, cx, yl + 0.25, cz, 6.2);
  for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; bed(P, cx + Math.cos(a) * 17, cz + Math.sin(a) * 17, 8, 8, yl + 0.2, k % 2 ? COL.flower : COL.flower2); }
  for (let k = 0; k < 14; k++) { const t = k / 14; tree(P, ALD.x0 + 3 + t * (w - 6), ALD.z1 - 2.5, 0.75); if (k % 2 === 0) tree(P, ALD.x1 - 3, ALD.z0 + 8 + t * (d - 16), 0.75); }
  for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; bench(P, cx + Math.cos(a) * 22, cz + Math.sin(a) * 22, -a + Math.PI / 2, yl + 0.2); lamp(P, cx + Math.cos(a + Math.PI / 8) * 24, cz + Math.sin(a + Math.PI / 8) * 24, yl + 0.2); }
  const house = (x, z, bw, bd, ry) => { plinthed(B, x, yl, z, bw, bd, 7.2, 'cream', [0xffffff, 0xf3ead2, 0xe9efe3, 0xf4e3d6][Math.floor(rnd() * 4)], ry);
    const r = new Batch(); r.gable(0, 0, 0, bw, bd, 4.2, [COL.slate, 0x6a4a3c, 0x5a6a5c][Math.floor(rnd() * 3)], 'x', 0.5, COL.lime); rotInto(B.plain, r, x, yl + 1.1 + 7.2, z, ry);
    const c = new Batch(); c.box(bw * 0.28, 0, 0, 1.3, 7, 1.3, 0x8c4a38); rotInto(B.plain, c, x, yl + 1.1 + 7.2, z, ry); wallRot(x, z, bw + 0.5, bd + 0.5, ry, yl - 3, yl + 12); };
  for (let k = 0; k < 4; k++) house(ALD.x0 + 8 + k * 15, ALD.z1 + 11, 13, 11, 0);
  for (let k = 0; k < 3; k++) house(ALD.x1 + 11, ALD.z0 + 14 + k * 17, 13, 11, Math.PI / 2);
  const bx = cx + 24, bz = cz - 6; B.plain.cyl(bx, yl, bz, 4.2, 4.2, 0.9, COL.granite, 10); for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; B.plain.cyl(bx + Math.cos(a) * 3.5, yl + 0.9, bz + Math.sin(a) * 3.5, 0.14, 0.14, 3.1, COL.white, 5); }
  B.plain.cyl(bx, yl + 4.0, bz, 4.4, 0.3, 1.8, COL.copper, 10); B.plain.cyl(bx, yl + 5.8, bz, 0.1, 0.05, 1.0, COL.gold, 5);
  const th = TER.h, tx = (TER.x0 + TER.x1) / 2, tz = (TER.z0 + TER.z1) / 2, tw = TER.x1 - TER.x0, td = TER.z1 - TER.z0;
  B.plain.box(tx, yl - 3, tz, tw, th + 3 - 0.2, td, COL.granite2); B.plain.box(tx, yl + th - 0.3, tz, tw + 1.2, 0.45, td + 1.2, COL.granite); B.plain.box(tx, yl + th - 0.1, tz, tw - 1, 0.15, td - 1, COL.paving);
  for (let k = 0; k < 9; k++) B.plain.box(tx - tw / 2 + 4 + k * 6.3, yl + 1.2, TER.z1 + 0.2, 0.7, th - 1.8, 0.4, COL.lime);
  for (let k = 0; k < 8; k++) B.plain.cyl(tx - tw / 2 + 4 + k * 6.3 + 3.15, yl + th - 4.2, TER.z1 + 0.4, 1.6, 1.6, 2.9, COL.granite2, 8);
  const rail = (x0, z0, x1, z1) => { const n = Math.max(2, Math.round(Math.hypot(x1 - x0, z1 - z0) / 1.8)); for (let k = 0; k <= n; k++) B.plain.cyl(x0 + (x1 - x0) * k / n, yl + th - 0.1, z0 + (z1 - z0) * k / n, 0.12, 0.1, 1.0, COL.white, 5); const L = Math.hypot(x1 - x0, z1 - z0), hz = Math.abs(x1 - x0) > Math.abs(z1 - z0); B.plain.box((x0 + x1) / 2, yl + th + 0.9, (z0 + z1) / 2, hz ? L : 0.3, 0.2, hz ? 0.3 : L, COL.granite); };
  rail(TER.x0 + 0.3, TER.z1 - 0.3, TER.x1 - 0.3, TER.z1 - 0.3); rail(TER.x0 + 0.3, TER.z0 + 0.3, TER.x1 - 0.3, TER.z0 + 0.3); rail(TER.x1 - 0.3, TER.z0 + 0.3, TER.x1 - 0.3, TER.z1 - 0.3); rail(TER.x0 + 0.3, TER.z0 + 0.3, TER.x0 + 0.3, TER.z1 - 0.3);
  const vx = tx, vz = tz - 4; B.plain.cyl(vx, yl + th - 0.1, vz, 5.4, 5.4, 0.6, COL.granite, 12); for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; B.plain.cyl(vx + Math.cos(a) * 4.5, yl + th + 0.5, vz + Math.sin(a) * 4.5, 0.22, 0.2, 4.6, COL.white, 6); }
  B.plain.cyl(vx, yl + th + 5.1, vz, 5.0, 4.8, 0.5, COL.granite, 12); B.plain.cyl(vx, yl + th + 5.6, vz, 4.9, 0.4, 3.2, COL.copper, 12); B.plain.cyl(vx, yl + th + 8.8, vz, 0.15, 0.06, 1.8, COL.gold, 5);
  for (let k = 0; k < 4; k++) { bench(P, TER.x0 + 6 + k * 14, TER.z1 - 2.5, Math.PI, yl + th); lamp(P, TER.x0 + 4 + k * 16.6, TER.z1 - 1.2, yl + th); }
  for (let k = 0; k < 6; k++) tree(P, TER.x0 + 5 + k * 9, TER.z0 + 4, 0.7); for (const [ox, c] of [[-14, COL.flower], [12, COL.flower2]]) bed(P, tx + ox, tz + 3, 7, 3, yl + th, c);
  P.trees.forEach(t => { if (t.x > TER.x0 && t.x < TER.x1 && t.z > TER.z0 && t.z < TER.z1) t.y = yl + th; });
  const rx0 = TER.x0 - 7.5, rx1 = TER.x0 - 3.5, rz0 = ALD.z0 + 2, rz1 = TER.z0 + 1, n = 26;
  for (let k = 0; k < n; k++) { const z0a = rz0 + (rz1 - rz0) * k / n, z1a = rz0 + (rz1 - rz0) * (k + 1) / n, hy = th * (k + 1) / n; floor(rx0, rx1, z0a, z1a, yl + hy);
    B.plain.box((rx0 + rx1) / 2, yl - 3, (z0a + z1a) / 2, rx1 - rx0 + 1, 3 + hy, Math.abs(z1a - z0a) + 0.05, k % 2 ? COL.granite : COL.paving2); }
  floor(rx0, TER.x0 + 0.5, TER.z0 + 0.3, TER.z0 + 4, yl + th); floor(TER.x0, TER.x1, TER.z0, TER.z1, yl + th);
  for (let k = 0; k <= n; k += 2) { const zz = rz0 + (rz1 - rz0) * k / n, hy = th * Math.min(k, n) / n; for (const xx of [rx0 - 0.2, rx1 + 0.2]) B.plain.cyl(xx, yl + hy, zz, 0.1, 0.09, 1.0, COL.white, 5); }
  wall(TER.x0, TER.x1, TER.z0, TER.z1, yl - 3, yl + th - 0.6); wall(rx0 - 0.6, rx0 - 0.2, rz0, rz1, yl - 3, yl + th + 1.0); wall(rx1 + 0.2, rx1 + 0.6, rz0, rz1, yl - 3, yl + th + 1.0);
  wall(TER.x0, TER.x1, TER.z1 - 0.7, TER.z1 - 0.2, yl + th - 0.8, yl + th + 1.2); wall(TER.x1 - 0.7, TER.x1 - 0.2, TER.z0, TER.z1, yl + th - 0.8, yl + th + 1.2); wall(TER.x0, TER.x1, TER.z0, TER.z0 + 0.5, yl + th - 0.8, yl + th + 1.2);
  floor(ALD.x0, ALD.x1, ALD.z0, ALD.z1, yl + 0.14);
  W.signs.push({x: cx, y: yl + 5.2, z: ALD.z1 - 0.5, ry: 0, w: 8, h: 1.5, lines: ['ALDEN SQUARE', 'Overlook terrace to the north'], bg: '#2c3d52', post: true, gy: yl});
  W.signs.push({x: rx0 - 1.2, y: yl + 3.4, z: ALD.z0 + 1, ry: 0, w: 4.4, h: 1.1, lines: ['OVERLOOK', 'Ramp to the terrace'], bg: '#2c3d52', post: true, gy: yl}); }

/* ---------- launch yard: 18 rockets (4 designs), instanced; beacons and glows are emissive, not real lights ---------- */
function rocketGeo(type) { const b = new Batch(); const W = 0xf1efe8, R = 0xc23b2e, K = 0x2b2f35, S = 0xb7bcc2, G = 0xd9b24a, T = 0x1f6f6a;
  if (type === 0) { b.cyl(0, 2, 0, 1.7, 1.55, 20, W, SEG); b.cyl(0, 12, 0, 1.75, 1.75, 2, R, SEG); b.cyl(0, 22, 0, 1.55, 0.05, 7, R, SEG); b.cyl(0, 0.5, 0, 1.0, 1.5, 2.0, K, SEG); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; b.box(Math.cos(a) * 2.2, 1.6, Math.sin(a) * 2.2, 0.25, 3.4, 2.6, R, -a); } }
  else if (type === 1) { b.cyl(0, 1.6, 0, 3.2, 3.0, 8, S, SEG); b.cyl(0, 9.6, 0, 3.0, 2.2, 7, W, SEG); b.cyl(0, 16.6, 0, 2.2, 1.0, 3.5, T, SEG); b.cyl(0, 20.1, 0, 1.0, 0.05, 3.5, G, SEG); for (let k = 0; k < 3; k++) { const a = k * Math.PI * 2 / 3; b.box(Math.cos(a) * 3.3, 0, Math.sin(a) * 3.3, 0.35, 2.6, 0.35, K, 0); b.cyl(Math.cos(a) * 4.0, 0.0, Math.sin(a) * 4.0, 0.4, 0.4, 0.3, K, 6); } }
  else if (type === 2) { b.cyl(0, 2, 0, 2.2, 2.2, 26, W, SEG); b.cyl(0, 28, 0, 2.2, 0.05, 7.5, K, SEG); b.cyl(0, 14, 0, 2.25, 2.25, 1.6, G, SEG); for (const s of [-1, 1]) { b.cyl(s * 3.5, 1.2, 0, 1.2, 1.2, 15, R, SEG); b.cyl(s * 3.5, 16.2, 0, 1.2, 0.05, 4.5, W, SEG); b.box(s * 2.7, 8, 0, 1.4, 0.5, 0.5, K); } b.cyl(0, 0.6, 0, 1.4, 1.8, 2.0, K, SEG); }
  else { b.cyl(0, 3, 0, 4.2, 3.8, 9, W, SEG); b.ico(0, 12, 0, 4.2, S, 0.62, 1); b.cyl(0, 3, 0, 4.25, 4.25, 1.2, T, SEG); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; b.box(Math.cos(a) * 4.6, 0, Math.sin(a) * 4.6, 0.4, 5.2, 1.6, K, -a); } b.cyl(0, 14.4, 0, 0.1, 0.05, 3, G, 5); }
  return b; }
function buildRockets(g) {
  const cols = 6, rows = 3, sx = (FIELD.x1 - FIELD.x0) / cols, sz = (FIELD.z1 - FIELD.z0) / rows, per = [[], [], [], []], pads = [], lights = [], flames = [], yl = RYL; let n = 0;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const t = (r + c * 2) % 4, x = FIELD.x0 + sx * (c + 0.5), z = FIELD.z0 + sz * (r + 0.5), s = [1.0, 1.1, 0.95, 1.05][t] * (0.9 + rnd() * 0.25); n++;
    per[t].push({x, y: yl + 0.6, z, s, ry: rnd() * 6.28}); pads.push({x, y: yl, z}); lights.push({x, y: yl + 0.6 + [29, 21, 34, 18][t] * s + 0.6, z}); flames.push({x, y: yl + 0.9, z, s}); }
  for (let t = 0; t < 4; t++) if (per[t].length) g.add(inst(rocketGeo(t), mats().plain, per[t], 'bw-rocket-' + t));
  const pb = new Batch(); pb.cyl(0, 0, 0, 8.5, 8.8, 0.6, COL.granite, LITE ? 10 : 18); pb.cyl(0, 0.6, 0, 7.2, 7.2, 0.06, 0x3a3f45, LITE ? 10 : 18); for (let k = 0; k < (LITE ? 4 : 12); k++) { const a = k / (LITE ? 4 : 12) * Math.PI * 2; pb.box(Math.cos(a) * 7.9, 0.6, Math.sin(a) * 7.9, 0.5, 0.06, 0.5, 0xf4f1e8); }
  g.add(inst(pb, mats().plain, pads, 'bw-rocket-pads'));
  const lb = new Batch(); lb.ico(0, 0, 0, 0.45, 0xff5a4a, 1, 0); g.add(inst(lb, mats().emis, lights, 'bw-rocket-lights'));
  const fb = new Batch(); fb.cyl(0, 0, 0, 0.9, 0.5, 0.35, 0xffb347, 8); g.add(inst(fb, mats().emis, flames, 'bw-rocket-glow'));
  const B = newB(), cx = (FIELD.x0 + FIELD.x1) / 2, cz = FIELD.z1 + 14;
  plinthed(B, cx - 40, yl, cz + 6, 22, 11, 7.2, 'mod'); B.plain.box(cx - 40, yl + 8.4, cz + 6, 24, 0.6, 13, COL.granite); B.emis.box(cx - 40, yl + 9.0, cz + 6, 6, 0.4, 0.2, 0x9ffcff);
  for (const gx of [FIELD.x0 - 8, FIELD.x1 + 8]) { for (const [dx, dz] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) B.plain.box(gx + dx, yl, FIELD.z0 + 18 + dz, 0.5, 30, 0.5, 0xc23b2e); for (let k = 1; k < 6; k++) B.plain.box(gx, yl + k * 5, FIELD.z0 + 18, 4.6, 0.3, 4.6, 0xc23b2e); B.plain.box(gx + (gx < cx ? 4 : -4), yl + 24, FIELD.z0 + 18, 8, 0.4, 0.4, 0xc23b2e); B.emis.ico(gx, yl + 30.6, FIELD.z0 + 18, 0.4, 0xff5a4a, 1, 0); }
  for (let k = 0; k < 4; k++) B.plain.box(FIELD.x0 + 10 + k * 36, yl, FIELD.z1 + 5, 22, 2.4, 1.0, COL.granite2);
  for (let k = 0; k < 6; k++) { const px = FIELD.x0 + k * 29, pz = FIELD.z0 - 6; B.plain.cyl(px, yl, pz, 0.22, 0.16, 14, COL.white, 6); B.emis.box(px, yl + 13.8, pz, 2.2, 0.5, 0.9, 0xfff6d0); }
  B.plain.box(cx, yl - 0.9, (FIELD.z0 + FIELD.z1) / 2 + 6, FIELD.x1 - FIELD.x0 + 40, 1.0, FIELD.z1 - FIELD.z0 + 30, 0x7e8a6a);
  stats.yardTris = flush(B, g, 'yard'); wall(cx - 51, cx - 29, cz + 0.5, cz + 11.5, yl - 3, yl + 9); return n; }

/* ---------- levels, props, signs, route ---------- */
function levels() {
  const lv = (x0, x1, z0, z1) => { let m = -1e9, a = 0, k = 0; for (let i = 0; i <= 6; i++) for (let j = 0; j <= 6; j++) { const h = gh(x0 + (x1 - x0) * i / 6, z0 + (z1 - z0) * j / 6); m = Math.max(m, h); a += h; k++; } return {max: Math.round(m * 10) / 10, avg: a / k}; };
  const h = lv(Q.x0 - 10, Q.x1 + 10, Q.z0 - 5, Q.z1 + 45); HY = h.max; RY = lv(RES.x - 80, RES.x + 140, RES.z - 80, RES.z + 100).max; TY = lv(TRN.x - 62, TRN.x + 85, TRN.z - 30, TRN.z + 30).max;
  DY = lv(DEP.x - 25, DEP.x + 25, DEP.z - 10, DEP.z + 15).max; AY = lv(ALD.x0 - 12, ALD.x1 + 25, ALD.z0 - 2, ALD.z1 + 16).max; RYL = lv(FIELD.x0 - 10, FIELD.x1 + 10, FIELD.z0 - 10, FIELD.z1 + 45).max;
  stats.levels = {HY, RY, TY, DY, AY, RYL}; stats.spread = +(h.max - h.avg).toFixed(2); }
function buildProps(g, P) {
  const mp = mats();
  if (P.trees.length) { const b = new Batch(); b.cyl(0, 0, 0, 0.28, 0.2, 2.6, COL.trunk, 5); b.ico(0, 4.2, 0, 2.1, COL.leaf, 1.25, LITE ? 0 : 1); if (!LITE) b.ico(0.4, 5.6, 0.2, 1.4, 0x5f9a45, 1.1, 0); g.add(inst(b, mp.plain, P.trees, 'bw-trees')); }
  if (P.pines.length) { const b = new Batch(); b.cyl(0, 0, 0, 0.26, 0.2, 2.0, COL.trunk, 5); b.cyl(0, 1.6, 0, 2.2, 0.1, 4.6, COL.leaf2, 7); b.cyl(0, 4.2, 0, 1.7, 0.1, 3.8, 0x3b7a4c, 7); b.cyl(0, 6.4, 0, 1.1, 0.05, 3.0, 0x44854f, 7); g.add(inst(b, mp.plain, P.pines.map(t => Object.assign({}, t, {s: t.s * 1.2})), 'bw-pines')); }
  if (P.lamps.length) { const b = new Batch(); b.cyl(0, 0, 0, 0.14, 0.1, 4.4, COL.dark, 5); if (!LITE) { b.cyl(0, 0, 0, 0.3, 0.3, 0.4, COL.dark, 6); b.cyl(0, 4.4, 0, 0.3, 0.2, 0.3, COL.dark, 6); } g.add(inst(b, mp.plain, P.lamps, 'bw-lamps'));
    const e = new Batch(); e.ico(0, 4.85, 0, 0.32, 0xfff1c0, 1, 0); g.add(inst(e, mp.emis, P.lamps, 'bw-lamp-heads')); }
  if (P.benches.length) { const b = new Batch(); b.box(0, 0.45, 0, 1.8, 0.1, 0.5, COL.wood); b.box(0, 0.8, -0.24, 1.8, 0.4, 0.08, COL.wood); if (!LITE) { b.box(-0.8, 0, 0, 0.1, 0.45, 0.45, COL.dark); b.box(0.8, 0, 0, 0.1, 0.45, 0.45, COL.dark); } g.add(inst(b, mp.plain, P.benches, 'bw-benches')); }
  if (P.beds.length) { const b = new Batch(); b.box(0, 0, 0, 1, 0.28, 1, 0xffffff); g.add(inst(b, mp.plain, P.beds.map(x => ({x: x.x, y: x.y, z: x.z, sx: x.sx, sy: 1, sz: x.sz, c: x.c})), 'bw-beds')); }
  if (P.bollards.length) { const b = new Batch(); b.cyl(0, 0, 0, 0.12, 0.12, 1.1, COL.dark, 4); g.add(inst(b, mp.plain, P.bollards, 'bw-bollards')); const e = new Batch(); e.cyl(0, 1.1, 0, 0.14, 0.14, 0.18, 0x7ff2e4, 4); g.add(inst(e, mp.emis, P.bollards, 'bw-bollard-lights')); } }
function buildSigns(g, list) {
  for (const s of list) { const t = labelTex(s.lines, {bg: s.bg, w: s.big ? 1024 : 768, h: s.lines.length > 2 ? 256 : 192}); const m = new THREE.Mesh(new THREE.PlaneGeometry(s.w, s.h), new THREE.MeshBasicMaterial({map: t, side: THREE.DoubleSide})); m.position.set(s.x, s.y, s.z); m.rotation.y = s.ry || 0; m.name = 'bw-sign'; g.add(m);
    if (s.post) { const top = s.y - s.h / 2, hgt = Math.max(0.5, top - s.gy), p = new THREE.Mesh(new THREE.BoxGeometry(0.25, hgt, 0.25), new THREE.MeshLambertMaterial({color: 0x2b3a35})); p.position.set(s.x - s.w / 2 + 0.4, s.gy + hgt / 2, s.z); g.add(p); const p2 = p.clone(); p2.position.x = s.x + s.w / 2 - 0.4; g.add(p2); } } }
const ROUTE = [[9420, -2018], [9440, -2100], [9460, -2230], [9540, -2380], [9600, -2560], [9617, -2760], [9640, -2930]];
function routeMarkers(P) { for (let s = 0; s < ROUTE.length - 1; s++) { const a = ROUTE[s], b = ROUTE[s + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.floor(L / 26); for (let k = 0; k < n; k++) { const t = k / n, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t; P.bollards.push({x, y: gh(x, z), z}); } } }

/* ---------- build / drop the base ---------- */
function buildBase() {
  if (built || building || !W3D.patchH) return; building = true; levels(); walls.length = 0; floors.length = 0;
  const g = new THREE.Group(); g.name = 'fowling-pond-corporate-base'; const P = new Props(), B = newB(), W = {signs: []};
  buildHeritage(B, P, W); buildChapel(B, P, W); buildPlaza(B, P, W); buildResidence(B, P, W); buildTraining(B, P, W); buildAlden(B, P, W); routeMarkers(P);
  for (let k = 0; k < 40; k++) { const x = 9300 + rnd() * 450, z = -2150 + rnd() * 330; if (Math.abs(z + 2000) < 12) continue; if (x > Q.x0 - 6 && x < Q.x1 + 6 && z > Q.z0 - 6 && z < Q.z1 + 46) continue; if (x > QB.x0 - 6 && x < QB.x1 + 6 && z > QB.z0 - 6 && z < QB.z1 + 6) continue; if (x > ALD.x0 - 14 && x < ALD.x1 + 30 && z > ALD.z0 - 40 && z < ALD.z1 + 22) continue; if (Math.hypot(x - RES.x, z - RES.z) < 150 || Math.hypot(x - TRN.x, z - TRN.z) < 90) continue; tree(P, x, z, 0.9); }
  stats.baseMerged = flush(B, g, 'base'); buildProps(g, P); buildSigns(g, W.signs); stats.rockets = buildRockets(g);
  let tris = 0; g.traverse(o => { if (o.userData && o.userData.tris) tris += o.userData.tris; }); stats.base = Math.round(tris);
  (W3D.root || document.querySelector('a-scene').object3D).add(g); grp = g; built = true; building = false; register(); setClip(true); }
function dropBase() { if (!grp) return; unregister(); const par = grp.parent; par && par.remove(grp); grp.traverse(o => { if (o.geometry) o.geometry.dispose(); }); grp = null; built = false; setClip(false); }
function setClip(on) { const U = W3D.clipU; if (!U) return; const R = U.jfRect.value[1]; if (on) R.set(9500, -2030, 330, 30); else R.set(0, 0, -1, 0); }

/* ---------- work crews: instanced, matching navy coveralls + orange hi-vis vests + white hard hats, with tools ---------- */
function figureGeo(variant) { const b = new Batch(), NAVY = 0x23364d, VEST = 0xf08a1e, SKIN = [0xd9a27a, 0xb87a56, 0x8a5a3c, 0xe8c19a][variant % 4], HAT = 0xf4f1e8, BOOT = 0x2a2523;
  b.box(-0.11, 0, 0, 0.17, 0.85, 0.2, NAVY); b.box(0.11, 0, 0, 0.17, 0.85, 0.2, NAVY); if (!LITE) { b.box(-0.11, 0, 0.03, 0.18, 0.12, 0.3, BOOT); b.box(0.11, 0, 0.03, 0.18, 0.12, 0.3, BOOT); }
  b.box(0, 0.85, 0, 0.46, 0.62, 0.26, NAVY); b.box(0, 0.9, 0, 0.5, 0.5, 0.3, VEST); b.box(0, 1.15, 0.0, 0.52, 0.06, 0.32, 0xdfe8ee);
  b.ico(0, 1.62, 0, 0.14, SKIN, 1, 0); const hg = new THREE.SphereGeometry(0.17, 7, 3, 0, Math.PI * 2, 0, Math.PI / 2); _q.identity(); _m.compose(_v.set(0, 1.64, 0), _q, _s.set(1, 1, 1)); b.geo(hg, _m, HAT); hg.dispose(); b.box(0, 1.64, 0.14, 0.3, 0.03, 0.14, HAT);
  const arm = (x, z, rx) => { const g = new THREE.BoxGeometry(0.12, 0.5, 0.12); _q.setFromEuler(new THREE.Euler(rx, 0, 0)); _m.compose(_v.set(x, 1.12, z), _q, _s.set(1, 1, 1)); b.geo(g, _m, NAVY); g.dispose(); };
  if (variant === 2) { arm(-0.3, 0.2, -1.1); arm(0.3, 0.2, -1.1); b.box(0, 0.95, 0.45, 0.46, 0.3, 0.34, 0xc79a52); b.box(0, 1.2, 0.45, 0.4, 0.04, 0.28, 0xa97c3a); }
  else { arm(-0.3, 0.1, -0.55); arm(0.3, 0.1, -0.25); const hx = 0.3; b.box(hx, 0, 0.32, 0.05, 1.5, 0.05, 0x8a6240);
    if (variant === 0) b.box(hx, 0, 0.36, 0.26, 0.04, 0.34, 0xb7bcc2); else if (variant === 1) { b.box(hx, 0, 0.36, 0.5, 0.05, 0.06, 0xb7bcc2); for (let k = 0; k < 5; k++) b.box(hx - 0.2 + k * 0.1, 0, 0.4, 0.02, 0.1, 0.02, 0xb7bcc2); } else b.box(hx, 0, 0.36, 0.32, 0.18, 0.05, 0xc9b27a); }
  return b; }
function crewSite(name, cx, cz, groups, radius) { return {name, cx, cz, groups, radius, grp: null, meshes: [], n: 0}; }
function buildCrews(S) {
  if (S.grp) return; const g = new THREE.Group(); g.name = 'bw-crews-' + S.name; const per = [[], [], [], []], props = [], all = [];
  const cone = new Batch(); cone.cyl(0, 0, 0, 0.2, 0.06, 0.6, 0xf26a1b, 6); cone.cyl(0, 0, 0, 0.26, 0.26, 0.05, 0x333333, 6);
  for (const G of S.groups) { for (let k = 0; k < G.n; k++) { const a = rnd() * 6.283, r = Math.sqrt(rnd()) * (G.r || 3), x = G.x + Math.cos(a) * r, z = G.z + Math.sin(a) * r;
      const f = {x, y: G.y !== undefined ? G.y : gh(x, z), z, ry: G.face !== undefined ? G.face + (rnd() - 0.5) * 0.9 : rnd() * 6.28, s: 0.97 + rnd() * 0.1, ph: rnd() * 6.28, v: (k + (G.v || 0)) % 4}; per[f.v].push(f); all.push(f); }
    for (let k = 0; k < (G.cones || 0); k++) { const a = k / G.cones * 6.283, x = G.x + Math.cos(a) * ((G.r || 3) + 2.5), z = G.z + Math.sin(a) * ((G.r || 3) + 2.5); props.push({x, y: gh(x, z), z}); } }
  S.meshes = []; for (let v = 0; v < 4; v++) if (per[v].length) { const I = inst(figureGeo(v), mats().plain, per[v], 'bw-crew-' + S.name + '-' + v); I.userData.items = per[v]; g.add(I); S.meshes.push(I); }
  if (props.length) g.add(inst(cone, mats().plain, props, 'bw-cones-' + S.name));
  S.n = all.length; S.grp = g; (W3D.root || document.querySelector('a-scene').object3D).add(g); }
function dropCrews(S) { if (!S.grp) return; S.grp.parent && S.grp.parent.remove(S.grp); S.grp.traverse(o => { if (o.geometry) o.geometry.dispose(); }); S.grp = null; S.meshes = []; }
const _mm = new THREE.Matrix4(), _qq = new THREE.Quaternion(), _pp = new THREE.Vector3(), _ss = new THREE.Vector3(), _ee = new THREE.Euler();
function animCrews(S, t) { for (const I of S.meshes) { const it = I.userData.items; for (let i = 0; i < it.length; i++) { const f = it[i], w = Math.sin(t * 0.0021 + f.ph); _qq.setFromEuler(_ee.set(0.08 + 0.1 * w, f.ry + 0.12 * Math.sin(t * 0.0009 + f.ph), 0)); _mm.compose(_pp.set(f.x, f.y + 0.02 * Math.abs(w), f.z), _qq, _ss.set(f.s, f.s, f.s)); I.setMatrixAt(i, _mm); } I.instanceMatrix.needsUpdate = true; } }
const CREWS = {
  pad: crewSite('pad', PADC.x, PADC.z, [{x: PADC.x - 36, z: PADC.z + 4, n: 4, r: 3, cones: 4, face: Math.PI / 2}, {x: PADC.x + 36, z: PADC.z - 6, n: 4, r: 3, face: -Math.PI / 2, v: 1}, {x: PADC.x + 4, z: PADC.z + 38, n: 3, r: 3, face: Math.PI, v: 2}, {x: PADC.x - 6, z: PADC.z - 38, n: 3, r: 3, face: 0, v: 3}], 500),
  grounds: crewSite('grounds', 9450, -2040, [{x: 9628, z: -1975, n: 4, r: 4, cones: 3, face: 0}, {x: 9540, z: -2000, n: 3, r: 3, face: 1.2, v: 1}, {x: 9330, z: -1990, n: 3, r: 3, face: 0, v: 2}, {x: 9205, z: -2010, n: 4, r: 8, face: 0.8, v: 3}, {x: 9572, z: -1914, n: 3, r: 5, face: 0, v: 1}, {x: 9720, z: -2200, n: 4, r: 5, face: Math.PI, v: 2}, {x: 9318, z: -1752, n: 3, r: 4, face: 0, v: 0}], 650),
  pond: crewSite('pond', 0, 0, [], 700),
  bank: crewSite('bank', 880, -380, [{x: 806, z: -330, n: 4, r: 4, cones: 3, face: 1.5}, {x: 806, z: -430, n: 3, r: 3, face: 1.5, v: 1}], 450)};
function pondGroups() { const Pd = W3D.water && W3D.water.pond; if (!Pd) return null; const mx = (Pd.x0 + Pd.x1) / 2;
  return {cx: mx, cz: (Pd.z0 + Pd.z1) / 2, groups: [{x: Pd.x0 - 9, z: Pd.z0 + (Pd.z1 - Pd.z0) * 0.42, n: 5, r: 4, cones: 3, face: Math.PI / 2}, {x: Pd.x0 - 10, z: Pd.z0 + (Pd.z1 - Pd.z0) * 0.58, n: 4, r: 3.5, face: Math.PI / 2, v: 1}, {x: mx, z: Pd.z0 - 9, n: 5, r: 4, cones: 2, face: 0, v: 2}]}; }

/* ---------- system: proximity loading + animation ---------- */
const _c = new THREE.Vector3();
AFRAME.registerSystem('w3d-prison', { tick: function (t) {
  if (!this.el.camera) return; this.el.camera.getWorldPosition(_c);
  if (t - (this.lt || 0) > 500) { this.lt = t; const d = Math.hypot(_c.x - CEN.x, _c.z - CEN.z);
    if (d < LOAD && !built && !building && W3D.patchH) { try { buildBase(); } catch (e) { building = false; console.error('bw base build ' + (e && e.stack)); } } else if (d > DROP && built) dropBase();
    if (!CREWS.pond.groups.length) { const pg = pondGroups(); if (pg) { CREWS.pond.cx = pg.cx; CREWS.pond.cz = pg.cz; CREWS.pond.groups = pg.groups; } }
    for (const k in CREWS) { const S = CREWS[k]; if (!S.groups.length) continue; const dd = Math.hypot(_c.x - S.cx, _c.z - S.cz), need = (k === 'pad' || k === 'grounds') ? !!W3D.patchH : true;
      if (dd < S.radius && !S.grp && need) { try { buildCrews(S); } catch (e) { console.error('bw crews ' + (e && e.stack)); } } else if (dd > S.radius * 1.4 && S.grp) dropCrews(S); } }
  if (t - (this.la || 0) > 60) { this.la = t; for (const k in CREWS) if (CREWS[k].grp) animCrews(CREWS[k], t); }
} });

/* ---------- spots ---------- */
function goSpot(p, yFn) {
  if (!W3D.patchH && W3D.spots.launchpad) W3D.spots.launchpad();     // brings the Bridgewater patch in (launch.js), then we move on
  let n = 0; const iv = setInterval(() => { if (++n > 300) return clearInterval(iv); if (!W3D.patchH) return; clearInterval(iv);
    W3D.teleportTo(p.x, undefined, p.z, p.yaw); setTimeout(() => { try { buildBase(); } catch (e) { console.error(e); } W3D.teleportTo(p.x, yFn(), p.z, p.yaw); }, 500); }, 200); }
(function addSpots() { if (!W3D.spots) return setTimeout(addSpots, 50);
  W3D.spots.bridgewater = () => goSpot(SPOTS.bridgewater, () => W3D.groundAt(SPOTS.bridgewater.x, SPOTS.bridgewater.z, HY + 3));
  W3D.spots.rockets = () => goSpot(SPOTS.rockets, () => W3D.groundAt(SPOTS.rockets.x, SPOTS.rockets.z, RYL + 3));
  W3D.spots.aldensquare = () => goSpot({x: (TER.x0 + TER.x1) / 2 - 2, z: TER.z1 - 3.4, yaw: 180}, () => AY + TER.h + 0.2); })();

W3D.prison = {stats: () => { const r = {built, building, st: stats, crews: {}}; for (const k in CREWS) r.crews[k] = {n: CREWS[k].n, loaded: !!CREWS[k].grp}; let t = 0, d = 0; const add = o => o.traverse(x => { if (x.isMesh) { d++; t += (x.userData.tris || 0); } }); if (grp) add(grp); for (const k in CREWS) if (CREWS[k].grp) add(CREWS[k].grp); r.tris = Math.round(t); r.draws = d; return r; },
  build: buildBase, drop: dropBase, CREWS, ALD, TER, Q, FIELD, SPOTS, get levels() { return {HY, RY, TY, DY, AY, RYL}; }};
})();
