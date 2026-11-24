/* Boats on Fowling Pond (Josh's request): 12 canoes, 4 ancient Egyptian boats, 4 modern boats and 2 pontoon boats, all on real water.
   Positions are baked from pondmask_t4.png (the same alpha mask the water plane uses; >=128 = water) with a distance-to-shore check:
   drifting boats are 60+ m from any shore, the "pulled up" ones sit 7-11 m inside the waterline. Kept clear of the Pharos jut (-936, 565),
   the dugout canoe + marker on the east bank, and the houseboat (houseboat.js). Each type is ONE merged vertex-coloured geometry drawn as an
   InstancedMesh (no textures); bob / roll / slow yaw are driven from the A-Frame tick, never window requestAnimationFrame.
   The pond water is not touched. W3D.MB is the tiny merged-geometry builder that houseboat.js reuses. */
(function () {
const W3D = window.W3D = window.W3D || {};
const WATER = 16.5, PI = Math.PI;
const col = h => new THREE.Color(h);

class MB { // merged, flat-shaded, vertex-coloured geometry builder
  constructor() { this.p = []; this.c = []; this.tris = 0; }
  tri(a, b, c, h) { const k = col(h); for (const v of [a, b, c]) { this.p.push(v[0], v[1], v[2]); this.c.push(k.r, k.g, k.b); } this.tris++; }
  quad(a, b, c, d, h) { this.tri(a, b, c, h); this.tri(a, c, d, h); }
  geo(g, m, h) { g = g.index ? g.toNonIndexed() : g; g.applyMatrix4(m); const P = g.attributes.position, k = col(h), v = new THREE.Vector3();
    for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i); this.p.push(v.x, v.y, v.z); this.c.push(k.r, k.g, k.b); } this.tris += P.count / 3; g.dispose(); return this; }
  _m(x, y, z, rx, ry, rz) { return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx || 0, ry || 0, rz || 0, 'YXZ')), new THREE.Vector3(1, 1, 1)); }
  box(w, h, d, x, y, z, h0, ry, rx, rz) { return this.geo(new THREE.BoxGeometry(w, h, d), this._m(x, y, z, rx, ry, rz), h0); }
  cyl(rt, rb, h, seg, x, y, z, h0, rx, ry, rz) { return this.geo(new THREE.CylinderGeometry(rt, rb, h, seg), this._m(x, y, z, rx, ry, rz), h0); }
  cylX(rt, rb, len, seg, x, y, z, h0) { return this.cyl(rt, rb, len, seg, x, y, z, h0, 0, 0, PI / 2); }   // lies along the boat (x)
  sph(r, x, y, z, h0, ws, hs) { return this.geo(new THREE.SphereGeometry(r, ws || 8, hs || 6), this._m(x, y, z), h0); }
  // lofted hull along x: fn(t) -> {w: half beam, ky: keel y, gy: gunwale y}; open top
  loft(L, fn, h0, N, S, hullB) { N = N || 9; S = S || [-1, -0.55, 0, 0.55, 1]; const rows = [];
    for (let i = 0; i < N; i++) { const t = i / (N - 1), f = fn(t), x = (t - 0.5) * L; rows.push(S.map(s => [x, f.ky + (f.gy - f.ky) * s * s, s * f.w])); }
    for (let i = 0; i < N - 1; i++) for (let j = 0; j < S.length - 1; j++) this.quad(rows[i][j], rows[i + 1][j], rows[i + 1][j + 1], rows[i][j + 1], (hullB && (j === 0 || j === S.length - 2)) ? hullB : h0);
    return this; }
  lid(L, fn, h0, N, yoff, inset) { N = N || 9; for (let i = 0; i < N - 1; i++) { const a = fn(i / (N - 1)), b = fn((i + 1) / (N - 1)), xa = (i / (N - 1) - 0.5) * L, xb = ((i + 1) / (N - 1) - 0.5) * L, k = inset || 1;
      this.quad([xa, a.gy + (yoff || 0), -a.w * k], [xb, b.gy + (yoff || 0), -b.w * k], [xb, b.gy + (yoff || 0), b.w * k], [xa, a.gy + (yoff || 0), a.w * k], h0); } return this; }
  build() { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3)); g.computeVertexNormals(); g.computeBoundingSphere(); g.userData.tris = this.tris; return g; }
}
W3D.MB = MB;
const shape = (p, a) => t => Math.pow(Math.max(0, Math.sin(PI * ((a || 0.03) + (1 - 2 * (a || 0.03)) * t))), p);
const e = t => Math.abs(2 * t - 1);

const WOOD = 0x9a6a3a, DWOOD = 0x6e4524, RED = 0xb02a22, GREEN = 0x2f6b3a, STRAW = 0xc9b25e, DSTRAW = 0x9c8a42, CREAM = 0xe9dfc2, GOLD = 0xd8a62a, BLUE = 0x2b5aa8, WHITE = 0xf1f1ee, DARK = 0x2a2d30, TEAL = 0x2a8a8a;

function canoe(hull, paddle) { const b = new MB(), s = shape(0.55);
  b.loft(4.8, t => ({w: 0.44 * s(t), ky: -0.13 + 0.07 * e(t) * e(t), gy: 0.3 + 0.3 * Math.pow(e(t), 3)}), hull, 9, null, DWOOD);
  b.box(0.06, 0.05, 0.92, 0.9, 0.3, 0, WOOD); b.box(0.06, 0.05, 0.9, -0.9, 0.3, 0, WOOD);         // thwarts
  b.box(0.3, 0.04, 0.5, 0.0, 0.0, 0, WOOD);                                                         // floor board
  if (paddle) { b.box(1.5, 0.03, 0.045, 0.1, 0.36, 0.1, DWOOD, 0.1); b.box(0.12, 0.03, 0.2, -0.35, 0.36, 0.1, DWOOD, 0.1, 0, 0); }     // paddle laid across
  return b.build(); }
function reed() { const b = new MB(), s = shape(0.7, 0.02);
  const fn = t => ({w: 0.62 * s(t), ky: -0.04 + 1.2 * Math.pow(e(t), 3.2), gy: 0.16 + 1.5 * Math.pow(e(t), 3.2)});
  b.loft(5.4, fn, STRAW, 11, [-1, -0.5, 0, 0.5, 1], DSTRAW);
  for (const x of [-1.5, 0, 1.5]) b.box(0.09, 0.3, 1.35 * (1 - 0.0), x, 0.17, 0, DSTRAW);          // lashings
  b.cylX(0.075, 0.04, 2.3, 6, -2.2, 0.55, 0.0, DSTRAW); b.cylX(0.04, 0.075, 2.3, 6, 2.2, 0.55, 0.0, DSTRAW);
  b.box(0.7, 0.06, 0.06, 0.3, 0.25, 0.5, WOOD, 0.4); return b.build(); }
function nile() { const b = new MB(), s = shape(0.5);
  const fn = t => ({w: 0.95 * s(t), ky: -0.25 + 0.15 * e(t), gy: 0.6 + 0.65 * Math.pow(e(t), 3)});
  b.loft(8.5, fn, WOOD, 11, null, DWOOD); b.lid(8.5, fn, 0xb98a50, 11, -0.12, 0.96);
  b.box(2.4, 0.9, 1.0, -2.4, 0.9, 0, 0xa87e48); b.box(2.6, 0.08, 1.2, -2.4, 1.38, 0, RED);          // stern cabin + awning
  b.cyl(0.075, 0.1, 6.0, 8, 0.8, 3.5, 0, DWOOD);                                                    // mast
  b.cyl(0.05, 0.05, 4.6, 6, 0.8, 5.4, 0, DWOOD, PI / 2);                                           // yard (across)
  b.box(0.04, 3.1, 4.4, 0.8, 4.0, 0, CREAM); b.box(0.045, 0.5, 4.4, 0.8, 5.0, 0, RED); b.box(0.045, 0.3, 4.4, 0.8, 2.6, 0, BLUE);   // square sail with bands
  for (const sd of [-1, 1]) for (const x of [1.7, 2.5, 3.3]) b.box(0.05, 0.05, 2.3, x, 0.62, sd * 1.3, DWOOD, 0, 0.0, 0.0);   // oars
  b.box(0.09, 0.09, 3.0, -4.3, 0.9, 0.85, DWOOD, 0.3); b.box(0.09, 0.09, 3.0, -4.3, 0.9, -0.85, DWOOD, -0.3);       // steering oars
  return b.build(); }
function barque() { const b = new MB(), s = shape(0.5, 0.02);
  const fn = t => ({w: 1.0 * s(t), ky: -0.25 + 0.2 * e(t), gy: 0.55 + 2.3 * Math.pow(e(t), 3.4)});
  b.loft(10, fn, GOLD, 13, null, 0xb8841c); b.lid(10, fn, 0xe7c25a, 13, -0.15, 0.97);
  b.sph(0.34, 5.0, 3.4, 0, GOLD); b.sph(0.34, -5.0, 3.2, 0, GOLD);                                  // lotus-bud prow and stern
  b.box(3.4, 1.9, 1.5, 0, 1.45, 0, BLUE); b.box(3.8, 0.18, 1.9, 0, 2.5, 0, GOLD);                   // shrine with gilded roof
  b.box(0.15, 1.3, 0.15, 1.6, 1.3, 0.9, GOLD); b.box(0.15, 1.3, 0.15, -1.6, 1.3, 0.9, GOLD); b.box(0.15, 1.3, 0.15, 1.6, 1.3, -0.9, GOLD); b.box(0.15, 1.3, 0.15, -1.6, 1.3, -0.9, GOLD);
  for (const sd of [-1, 1]) for (const x of [-3, -1.8, 1.8, 3]) b.box(0.05, 0.05, 2.4, x, 0.55, sd * 1.5, DWOOD);
  b.cyl(0.05, 0.05, 3, 6, 0.0, 3.6, 0, DWOOD); return b.build(); }
function sailboat() { const b = new MB(), s = shape(0.5);
  const fn = t => ({w: 0.9 * s(t) * (1 - 0.25 * t), ky: -0.4, gy: 0.55 - 0.15 * Math.sin(PI * t) + 0.12 * t});
  b.loft(6.5, fn, WHITE, 9, null, BLUE); b.lid(6.5, fn, 0xc9a56a, 9, -0.02, 0.97);
  b.box(2.2, 0.6, 1.3, -0.4, 0.8, 0, WHITE); b.box(2.0, 0.1, 1.5, -0.4, 1.15, 0, 0x8a96a0);          // cabin + roof
  b.cyl(0.05, 0.07, 8.4, 6, 0.9, 4.6, 0, 0xcfd3d6);                                                  // mast
  b.tri([0.82, 8.5, 0], [0.82, 1.4, 0], [-3.2, 1.45, 0], WHITE); b.tri([1.0, 8.2, 0], [1.0, 1.0, 0], [3.2, 0.7, 0], 0xe8e2d0); // main + jib
  b.cyl(0.04, 0.04, 4.2, 5, -1.2, 1.4, 0, 0xcfd3d6, 0, 0, PI / 2); b.box(0.9, 0.04, 0.04, -2.9, 0.1, 0, DARK, 0, 0, 0.0); return b.build(); }
function runabout() { const b = new MB(), s = shape(0.45);
  const fn = t => ({w: 0.95 * s(t) * (1 - 0.22 * t), ky: -0.3 + 0.1 * t, gy: 0.5 + 0.2 * t - 0.12 * Math.sin(PI * t)});
  b.loft(5.6, fn, WHITE, 9, null, TEAL); b.lid(5.6, fn, 0xe4dcc8, 9, -0.1, 0.96);
  b.box(0.08, 0.6, 1.5, 0.25, 0.9, 0, 0x2a3a46, 0, 0, -0.5);                                          // raked windscreen
  b.box(0.6, 0.45, 0.8, -0.5, 0.55, 0.0, 0xd8d2c0); b.box(0.5, 0.45, 0.9, -1.5, 0.55, 0, 0xd8d2c0);   // seats
  b.box(0.35, 0.8, 0.22, -2.9, 0.4, 0, DARK); b.box(0.2, 0.3, 0.25, -3.0, -0.2, 0, DARK);             // outboard
  return b.build(); }
function kayak(hullC) { const b = new MB(), s = shape(0.6, 0.015);
  b.loft(4.2, t => ({w: 0.28 * s(t), ky: -0.07, gy: 0.14 + 0.1 * Math.pow(e(t), 3)}), hullC, 9, [-1, -0.5, 0, 0.5, 1]); b.lid(4.2, t => ({w: 0.28 * s(t), gy: 0.14 + 0.1 * Math.pow(e(t), 3)}), 0xe8e8e0, 9, 0.0, 0.98);
  b.cyl(0.24, 0.24, 0.08, 8, -0.1, 0.2, 0, DARK);                                                      // cockpit coaming
  b.cyl(0.018, 0.018, 2.3, 5, -0.1, 0.45, 0, DARK, PI / 2 * 0, 0, PI / 2 + 0.0);                      // double paddle (laid across the deck)
  b.box(0.45, 0.025, 0.14, -0.1 + 0.0, 0.46, 1.1, DARK, 0.0); b.box(0.45, 0.025, 0.14, -0.1, 0.46, -1.1, DARK); return b.build(); }
function pontoon(canopy) { const b = new MB();
  for (const sd of [-1, 1]) { b.cylX(0.36, 0.36, 7.4, 10, 0, -0.05, sd * 1.15, 0xb9c0c4); b.sph(0.36, 3.7, -0.05, sd * 1.15, 0xb9c0c4, 8, 5); b.sph(0.36, -3.7, -0.05, sd * 1.15, 0xb9c0c4, 8, 5); }
  b.box(7.4, 0.14, 3.0, 0, 0.42, 0, 0xb59565);                                                         // deck
  for (const sd of [-1, 1]) b.box(7.4, 0.06, 0.05, 0, 0.95, sd * 1.47, 0xdfe3e6);                      // top rails
  for (const sd of [-1, 1]) for (const x of [-3.5, -1.75, 0, 1.75, 3.5]) b.box(0.05, 0.5, 0.05, x, 0.72, sd * 1.47, 0xdfe3e6);
  b.box(0.05, 0.06, 3.0, -3.65, 0.95, 0, 0xdfe3e6); b.box(0.5, 0.5, 0.6, 1.9, 0.75, -0.9, WHITE); b.box(0.45, 0.45, 0.3, 1.9, 0.5, -0.4, DARK);   // console + wheel
  b.box(1.4, 0.35, 0.5, -1.3, 0.69, 1.0, 0x3b5f8a); b.box(1.4, 0.35, 0.5, -1.3, 0.69, -1.0, 0x3b5f8a); b.box(0.4, 0.35, 1.5, -2.2, 0.69, 0, 0x3b5f8a);   // benches
  b.box(0.35, 0.8, 0.22, -3.8, 0.35, 0, DARK);                                                         // outboard
  if (canopy) { for (const x of [-3.2, 3.2]) for (const sd of [-1, 1]) b.box(0.07, 1.9, 0.07, x, 1.55, sd * 1.4, 0xdfe3e6);
    b.box(7.0, 0.1, 3.2, 0, 2.55, 0, canopy); b.box(7.0, 0.12, 0.1, 0, 2.5, 1.62, 0xf2efe6); b.box(7.0, 0.12, 0.1, 0, 2.5, -1.62, 0xf2efe6); }
  return b.build(); }

/* ---- baked placements (x, z, extra) from the pond mask; see header ---- */
const P = {
  canoeDrift: [[168.8, -129.3], [233.5, -451.9], [29.1, -140.7], [-697.9, 210.6], [-578.8, -60.8]],
  pairs: [[9.6, -346.4], [-298.2, -23.3]],
  canoeShore: [[456.7, -145.7, -109.3], [339.9, -483.6, -62.9], [394.8, -419.9, -45.0]],      // x, z, bank-parallel yaw (deg)
  reed: [[-53.3, -170.7], [245.9, -290.2]], nile: [[-40.8, -299.9]], barque: [[396.9, -375.7]], sail: [[119.7, -505.2]],
  runabout: [[142.3, -192.1]], kayak: [[138.8, -397.2], [295.1, -212.0]], pontoonOut: [[82.2, -360.8]], pontoonMoor: [[358.6, -452.9, -54.1]]
};
let rs = 7; const rnd = () => (rs = (rs * 16807) % 2147483647) / 2147483647;
const list = {};   // type -> [{x,z,yaw,amp,ph,drift}]
const add = (k, x, z, yawDeg, o) => (list[k] = list[k] || []).push(Object.assign({x, z, yaw: yawDeg * PI / 180, amp: 0.05, ph: rnd() * 6.28, drift: 1.6}, o));
P.canoeDrift.forEach((p, i) => add(['cW', 'cR', 'cG', 'cR', 'cW'][i], p[0], p[1], rnd() * 360));
add('cG', P.pairs[0][0], P.pairs[0][1], 20, {drift: 0.3}); add('cW', P.pairs[0][0] + 3.1, P.pairs[0][1] + 2.2, 28, {drift: 0.3});
add('cR', P.pairs[1][0], P.pairs[1][1], 200, {drift: 0.3}); add('cG', P.pairs[1][0] - 2.4, P.pairs[1][1] + 2.8, 185, {drift: 0.3});
P.canoeShore.forEach((p, i) => add(['cW', 'cR', 'cW'][i], p[0], p[1], p[2], {drift: 0, amp: 0.02}));
P.reed.forEach(p => add('reed', p[0], p[1], rnd() * 360)); P.nile.forEach(p => add('nile', p[0], p[1], 250, {amp: 0.07}));
P.barque.forEach(p => add('barque', p[0], p[1], 280, {amp: 0.05, drift: 0.5})); P.sail.forEach(p => add('sail', p[0], p[1], 130, {amp: 0.09}));
P.runabout.forEach(p => add('run', p[0], p[1], 70, {amp: 0.06})); P.kayak.forEach((p, i) => add(i ? 'kO' : 'kY', p[0], p[1], rnd() * 360));
P.pontoonOut.forEach(p => add('pnA', p[0], p[1], 200, {amp: 0.05})); P.pontoonMoor.forEach(p => add('pnB', p[0], p[1], p[2], {drift: 0, amp: 0.025}));

const makers = {cW: () => canoe(WOOD, true), cR: () => canoe(RED, false), cG: () => canoe(GREEN, true), reed, nile, barque, sail: sailboat, run: runabout,
  kY: () => kayak(0xe8c21a), kO: () => kayak(0xd9541e), pnA: () => pontoon(0x2f7d6b), pnB: () => pontoon(0xb23a2c)};
const LIFT = {reed: -0.06, kY: -0.04, kO: -0.04};   // y offset from the waterline for the flat-bottomed types
const STORED = {cW: 1, cR: 1, cG: 1, kY: 1, kO: 1, reed: 1, run: 1, sail: 1};   // put away while the pond is frozen (W3D.season.ice > 0.5)
const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), eu = new THREE.Euler(0, 0, 0, 'YZX'), v3 = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
const meshes = [], items = []; let upMesh = null, iceOn = false;
let built = false;
function build() {
  if (built || !W3D.root) return; built = true;
  const mat = new THREE.MeshLambertMaterial({vertexColors: true, side: THREE.DoubleSide}); let tris = 0; const per = {};
  const g = new THREE.Group(); g.name = 'pond-boats';
  for (const k in list) { const geo = makers[k](), a = list[k], im = new THREE.InstancedMesh(geo, mat, a.length); im.frustumCulled = false; im.name = 'boats-' + k; im.castShadow = !W3D.lite;
    tris += geo.userData.tris * a.length; per[k] = geo.userData.tris; a.forEach((o, i) => items.push({im, i, o, k})); meshes.push(im); g.add(im); }
    // winter storage: 3 canoes upside-down on the bank, visible only while the pond is frozen
  const up = canoe(RED, false); up.applyMatrix4(new THREE.Matrix4().makeRotationX(PI).setPosition(0, 0.3, 0));
  const th = W3D.terrainH || (() => 17); upMesh = new THREE.InstancedMesh(up, mat, P.canoeShore.length); upMesh.frustumCulled = false; upMesh.name = 'boats-stored'; upMesh.visible = false;
  P.canoeShore.forEach((c, i) => { const hd = c[2] * PI / 180, nx = Math.sin(hd), nz = Math.cos(hd), x = c[0] - nx * 22, z = c[1] - nz * 22;
    // yaw from the bank-parallel heading; sits on the ground (bank height read from the terrain)
    q.setFromEuler(new THREE.Euler(0, hd, 0)); v3.set(x, th(x, z) + 0.02, z); m4.compose(v3, q, one); upMesh.setMatrixAt(i, m4); });
  g.add(upMesh);
  W3D.root.add(g); W3D.boats = {list, tris, per, group: g}; update(0);
}

function update(t) { const s = t / 1000;
  for (const it of items) { const o = it.o, ph = o.ph;
    const x = o.x + o.drift * Math.sin(s * 0.05 + ph) , z = o.z + o.drift * Math.cos(s * 0.043 + ph * 1.7);
    eu.set(0.03 * Math.sin(s * 0.7 + ph * 2) * (o.amp / 0.05), o.yaw + 0.05 * Math.sin(s * 0.11 + ph) * (o.drift ? 1 : 0.2), 0.02 * Math.sin(s * 0.55 + ph * 3) * (o.amp / 0.05));
    q.setFromEuler(eu); v3.set(x, WATER + (LIFT[it.k] || 0) + o.amp * Math.sin(s * 0.9 + ph), z);
    m4.compose(v3, q, one); it.im.setMatrixAt(it.i, m4); }
  for (const im of meshes) im.instanceMatrix.needsUpdate = true; }
let frame = 0;
AFRAME.registerSystem('w3d-boats', { tick: function (t) {
  if (!built) { if (window.W3D_READY || (W3D.root && W3D.water)) build(); return; }
  const ice = !!(W3D.season && +W3D.season.ice > 0.5);
  if (ice !== iceOn) { iceOn = ice; for (const im of meshes) im.visible = !(iceOn && STORED[im.name.slice(6)]); if (upMesh) upMesh.visible = iceOn; if (!iceOn) update(t); }
  if (!W3D.active || !W3D.root.visible) return; if (W3D.root.getObjectByName('pond-boats').visible === false) return;
  if (++frame % (window.JFVR_LITE ? 3 : 2)) return; if (iceOn) return; update(t);   // frozen in: no bob while iced
 } });
})();
