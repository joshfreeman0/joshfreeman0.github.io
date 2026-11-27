/* Château de Versailles, phase 1 (T-16, Nov 26 2026, Josh: "continue the Château Versailles construction", lean until Sat reset).
   Plot A of the junction plan (vr-wip/junction, /workspace/versailles-plan/plot.png): garden-front centre 41.93333,-70.93106, east of the
   Middleborough line, ~1 km ESE of the Nemasket-Taunton confluence, outside the FEMA flood zone. Axis measured from the real Grand Canal in
   OSM: entrance courts face 111.84 deg true, garden front and (future) canal 291.84 deg. True scale: garden front 670 m (UNESCO 1979 /
   Getty CONA), Cour de Marbre, Cour Royale and the Ministers' Cour d'Honneur to the east, Royal Chapel (42 x 24 m, 40 m high), Opera block
   at the north end, and the Parterre d'Eau terrace behind the garden front. NOT built yet (open with Josh): Grand Canal, Latona/Apollo,
   Trianons, river tie-ins, Jeu de Paume.
   Lean: everything is a handful of merged meshes (one per material) built from quads with UVs in metres, so a repeated window-bay canvas
   texture draws the 670 m of facades. Near detail (balustrade urns, gate bars) only within 900 m; whole site built within 4 km.
   Google tiles cut out under it (realearth jfRect slot 2). ?spot=versailles / Go to 'Versailles'. */
(function () {
'use strict';
const W3D = window.W3D = window.W3D || {};
const LITE = !!window.JFVR_LITE;
const LON0 = -71.06797286566898, LAT0 = 41.928658149882345, KX = 82938.7775, KY = 111071.9356;
const GEO = {lat: 41.93333, lon: -70.93106};
const GX = (GEO.lon - LON0) * KX, GZ = -(GEO.lat - LAT0) * KY;      // garden-front centre, local frame (~11355, -519)
const AZ = 291.84 * Math.PI / 180, UX = Math.sin(AZ), UZ = -Math.cos(AZ);   // u: from the palace toward the garden / canal (WNW)
const VX = -UZ, VZ = UX;                                               // v: across the axis, + = north side
const ROTY = Math.atan2(UZ, UX) * -1;                                  // group rotation so local +x = u, local +z = v
let Y0 = 14.6;                                                         // terrace level (3DEP: palace ground 5.5-12.6 m, parterre 4.4-12 m)
const S0 = -345, S1 = 268, P1 = 348;                                   // terrace extent: s (along u) and +-p
const LOAD = 4000, DROP = 4600, NEAR = 900;
const toW = (s, p) => [GX + s * UX + p * VX, GZ + s * UZ + p * VZ];
const toL = (x, z) => { const dx = x - GX, dz = z - GZ; return [dx * UX + dz * UZ, dx * VX + dz * VZ]; };
const V = window.JFVR_versailles = {GEO, GX, GZ, toW, toL};
let grp = null, near = null, built = false;

/* ---------- textures (canvas) ---------- */
function cv(w, h, f) { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = LITE ? 2 : 8; return t; }
// one window bay of the garden front, 6 m wide x 22 m: rusticated ground floor with arched windows, piano nobile with tall arched
// windows between Ionic pilasters, attic with square windows, balustrade on top
const bayTex = () => cv(128, 448, (g, w, h) => {
  const H = m => h - m * h / 22, stone = '#e2d3b2', shade = '#cdb994';
  g.fillStyle = stone; g.fillRect(0, 0, w, h);
  g.fillStyle = shade; for (let y = H(7); y < H(0); y += 9) g.fillRect(0, y, w, 2);                         // rustication grooves
  g.fillRect(0, H(7.3), w, 5); g.fillRect(0, H(15.4), w, 6); g.fillRect(0, H(19.6), w, 4);                  // string courses / cornice
  const win = (cx, y0, y1, ww, arch) => { g.fillStyle = '#2b3440'; g.fillRect(cx - ww / 2, H(y1), ww, H(y0) - H(y1)); if (arch) { g.beginPath(); g.arc(cx, H(y1), ww / 2, Math.PI, 0); g.fill(); }
    g.strokeStyle = '#f4ead2'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx, H(y1) - (arch ? ww / 2 : 0)); g.lineTo(cx, H(y0)); g.stroke(); for (let y = y0 + 1.2; y < y1; y += 1.3) { g.beginPath(); g.moveTo(cx - ww / 2, H(y)); g.lineTo(cx + ww / 2, H(y)); g.stroke(); } };
  win(w / 2, 1.0, 5.4, 34, true); win(w / 2, 8.4, 13.6, 36, true); win(w / 2, 16.3, 18.6, 30, false);
  g.fillStyle = '#d8c7a2'; g.fillRect(0, H(15.4), 10, H(7.3) - H(15.4)); g.fillRect(w - 10, H(15.4), 10, H(7.3) - H(15.4));   // pilasters
  g.fillStyle = '#ede2c6'; g.fillRect(0, H(22), w, H(20.6) - H(22)); g.fillStyle = '#c5b089';                // balustrade
  for (let x = 6; x < w; x += 12) g.fillRect(x, H(21.7), 6, H(20.8) - H(21.7));
});
// brick and stone (old Louis XIII court: Cour de Marbre, Cour Royale) 6 m bay x 16 m
const brickTex = () => cv(128, 352, (g, w, h) => {
  const H = m => h - m * h / 16; g.fillStyle = '#a5523c'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#8f4532'; for (let y = 0; y < h; y += 6) g.fillRect(0, y, w, 1);
  g.fillStyle = '#e8dcc0'; g.fillRect(0, 0, 14, h); g.fillRect(w - 14, 0, 14, h); g.fillRect(0, H(6.4), w, 7); g.fillRect(0, H(15.2), w, H(14.6) - H(16) + 4);
  const win = (y0, y1) => { g.fillStyle = '#e8dcc0'; g.fillRect(w / 2 - 24, H(y1) - 5, 48, H(y0) - H(y1) + 10); g.fillStyle = '#26303a'; g.fillRect(w / 2 - 18, H(y1), 36, H(y0) - H(y1)); };
  win(1.2, 5.6); win(7.6, 13.2);
});
const slateTex = () => cv(64, 64, (g, w, h) => { g.fillStyle = '#4c5866'; g.fillRect(0, 0, w, h); g.fillStyle = '#3d4753'; for (let y = 0; y < h; y += 8) g.fillRect(0, y, w, 2); for (let y = 0; y < h; y += 16) for (let x = (y / 16 % 2) * 8; x < w; x += 16) g.fillRect(x, y, 1, 8); });
const paveTex = () => cv(128, 128, (g, w, h) => { g.fillStyle = '#b9ad98'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 8) for (let x = (y / 8 % 2) * 4; x < w; x += 8) { g.fillStyle = (x * 7 + y * 13) % 5 ? '#ab9f8a' : '#c4b8a3'; g.fillRect(x, y, 7, 7); } });
const marbleTex = () => cv(64, 64, (g, w, h) => { for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { g.fillStyle = (x + y) % 2 ? '#1d1d1f' : '#efece6'; g.fillRect(x * 32, y * 32, 32, 32); } });
// parterre de broderie: lawn panel with clipped box scrolls and a gravel border, one 40 x 40 m tile
const parterreTex = () => cv(256, 256, (g, w, h) => { g.fillStyle = '#d8ccb0'; g.fillRect(0, 0, w, h); g.fillStyle = '#5f8a43'; g.fillRect(16, 16, w - 32, h - 32);
  g.strokeStyle = '#2f5226'; g.lineWidth = 7; g.strokeRect(26, 26, w - 52, h - 52);
  for (const [cx, cy] of [[w / 2, h / 2]]) { g.beginPath(); g.arc(cx, cy, 46, 0, 7); g.stroke(); g.beginPath(); g.arc(cx, cy, 20, 0, 7); g.stroke(); }
  for (const [x, y, a] of [[64, 64, 0], [192, 64, 1.57], [192, 192, 3.14], [64, 192, 4.71]]) { g.save(); g.translate(x, y); g.rotate(a); g.beginPath(); g.moveTo(-30, 30); g.bezierCurveTo(-30, -20, 20, -30, 30, -30); g.stroke(); g.beginPath(); g.arc(8, 8, 12, 0, 7); g.stroke(); g.restore(); }
  g.fillStyle = '#d8ccb0'; g.fillRect(w / 2 - 6, 16, 12, h - 32); g.fillRect(16, h / 2 - 6, w - 32, 12); });
const gravelTex = () => cv(64, 64, (g, w, h) => { g.fillStyle = '#d6c9ab'; g.fillRect(0, 0, w, h); for (let i = 0; i < 260; i++) { g.fillStyle = Math.random() < .5 ? '#c9bb9b' : '#e2d7bd'; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); } });
const gateTex = () => cv(256, 128, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = '#d4af37'; g.fillRect(0, h - 10, w, 10); g.fillRect(0, 18, w, 6);
  for (let x = 4; x < w; x += 10) { g.fillRect(x, 14, 3, h - 18); g.beginPath(); g.moveTo(x - 3, 16); g.lineTo(x + 1.5, 2); g.lineTo(x + 6, 16); g.fill(); } });

/* ---------- quad builder: one buffer per material, coordinates in the palace frame (x = s, z = p, y up from the terrace) ---------- */
function Buf() { return {p: [], uv: [], i: []}; }
function quad(B, a, b, c, d, uw, vh) {   // a-b bottom edge, c-d top edge (d above a), uw/vh: texture repeats
  const n = B.p.length / 3; B.p.push(...a, ...b, ...c, ...d); B.uv.push(0, 0, uw, 0, uw, vh, 0, vh); B.i.push(n, n + 1, n + 2, n, n + 2, n + 3); }
function mesh(B, mat, name) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(B.p, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(B.uv, 2));
  g.setIndex(B.i); g.computeVertexNormals(); const m = new THREE.Mesh(g, mat); m.name = name; m.receiveShadow = true; m.castShadow = !LITE; return m; }
const BLDG = [];   // collision boxes {s0,s1,p0,p1,h}
// walls of a box (s0..s1, p0..p1) from y0 to y1, texture bay width bw (m), roof: 'flat' | 'mansard' | 'chapel'
function block(F, R, T, s0, s1, p0, p1, y0, y1, bw, roof, collide) {
  const L = [[s0, p0], [s1, p0], [s1, p1], [s0, p1]];
  for (let k = 0; k < 4; k++) { const [as, ap] = L[k], [bs, bp] = L[(k + 1) % 4], len = Math.hypot(bs - as, bp - ap);
    // outward winding: walk the rectangle so the face points out
    quad(F, [bs, y0, bp], [as, y0, ap], [as, y1, ap], [bs, y1, bp], len / bw, 1); }
  if (roof === 'flat') quad(T, [s0, y1 - 0.6, p1], [s1, y1 - 0.6, p1], [s1, y1 - 0.6, p0], [s0, y1 - 0.6, p0], (s1 - s0) / 8, (p1 - p0) / 8);
  else { const rh = roof === 'chapel' ? 14 : 7, ins = roof === 'chapel' ? Math.min(s1 - s0, p1 - p0) / 2 - 0.5 : Math.min(4.5, Math.min(s1 - s0, p1 - p0) / 2 - 0.5);
    const I = [[s0 + ins, p0 + ins], [s1 - ins, p0 + ins], [s1 - ins, p1 - ins], [s0 + ins, p1 - ins]];
    for (let k = 0; k < 4; k++) { const a = L[k], b = L[(k + 1) % 4], c = I[(k + 1) % 4], d = I[k], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      quad(R, [b[0], y1, b[1]], [a[0], y1, a[1]], [d[0], y1 + rh, d[1]], [c[0], y1 + rh, c[1]], len / 6, rh / 6); }
    quad(R, [I[0][0], y1 + rh, I[3][1]], [I[1][0], y1 + rh, I[2][1]], [I[1][0], y1 + rh, I[1][1]], [I[0][0], y1 + rh, I[0][1]], 1, 1); }
  if (collide !== false) BLDG.push({s0, s1, p0, p1, h: y1});
}
function flat(B, s0, s1, p0, p1, y, tile) { quad(B, [s0, y, p1], [s1, y, p1], [s1, y, p0], [s0, y, p0], (s1 - s0) / tile, (p1 - p0) / tile); }
function vwall(B, s0, p0, s1, p1, y0, y1, tile) { const len = Math.hypot(s1 - s0, p1 - p0); quad(B, [s1, y0, p1], [s0, y0, p0], [s0, y1, p0], [s1, y1, p1], len / tile, (y1 - y0) / tile); }

function build() {
  const std = (map, o) => LITE ? new THREE.MeshLambertMaterial(Object.assign({map}, o || {})) : new THREE.MeshStandardMaterial(Object.assign({map, roughness: 0.85, metalness: 0}, o || {}));
  const mFac = std(bayTex()), mBrick = std(brickTex()), mSlate = std(slateTex(), {roughness: 0.6}), mLead = new THREE.MeshLambertMaterial({color: 0x8d8f8c}),
    mPave = std(paveTex()), mMarble = std(marbleTex(), {roughness: 0.35}), mPar = std(parterreTex()), mGrav = std(gravelTex()), mStone = new THREE.MeshLambertMaterial({color: 0xcfbe9a}),
    mWater = new THREE.MeshStandardMaterial({color: 0x2f5d73, roughness: 0.08, metalness: 0.2, envMapIntensity: 1.2}),
    mGold = new THREE.MeshStandardMaterial({color: 0xd4af37, metalness: 0.85, roughness: 0.3});
  const F = Buf(), Br = Buf(), R = Buf(), T = Buf(), Pv = Buf(), Mb = Buf(), Pa = Buf(), Gr = Buf(), St = Buf(), Wa = Buf(), Go = Buf();
  const H = 22, h2 = 16;
  /* garden front (s = 0 is the face of the central avant-corps, the Hall of Mirrors) */
  block(F, R, T, -20, 0, -38, 38, 0, H, 6, 'flat');                    // avant-corps with the Hall of Mirrors (73 m) behind
  block(F, R, T, -88, -20, -62, 62, 0, H, 6, 'flat');                  // Le Vau's envelope, king's and queen's apartments
  for (const sg of [1, -1]) {                                          // south wing (Aile du Midi, -p) and north wing (Aile du Nord, +p)
    block(F, R, T, -78, -38, sg > 0 ? 62 : -100, sg > 0 ? 100 : -62, 0, H, 6, 'flat');          // link
    block(F, R, T, -80, -40, sg > 0 ? 100 : -335, sg > 0 ? 335 : -100, 0, H, 6, 'flat');       // wing, garden face at s = -40, ends at p = +-335 (670 m front)
    block(F, R, T, -150, -80, sg > 0 ? 100 : -132, sg > 0 ? 132 : -100, 0, H, 6, 'flat');      // return wings toward the town
    if (sg < 0) block(F, R, T, -150, -80, -335, -300, 0, H, 6, 'flat');                          // south end pavilion (the Opera closes the north end)
  }
  /* Marble Court: the brick-and-stone Louis XIII lodge wrapped around a 30 x 25 m court, black-and-white marble paving */
  block(Br, R, T, -98, -88, -30, 30, 0, h2, 6, 'mansard');             // king's chamber range (west side of the court)
  for (const sg of [1, -1]) block(Br, R, T, -128, -98, sg > 0 ? 15 : -30, sg > 0 ? 30 : -15, 0, h2, 6, 'mansard');
  flat(Mb, -128, -98, -15, 15, 0.5, 2.0);
  /* Cour Royale (~90 x 90) between the brick wings, then the Ministers' wings round the Cour d'Honneur */
  for (const sg of [1, -1]) {
    block(Br, R, T, -215, -128, sg > 0 ? 45 : -62, sg > 0 ? 62 : -45, 0, h2, 6, 'mansard');
    block(F, R, T, -225, -208, sg > 0 ? 62 : -98, sg > 0 ? 98 : -62, 0, h2 + 2, 6, 'mansard');   // Dufour / Gabriel pavilions
    block(F, R, T, -335, -225, sg > 0 ? 78 : -96, sg > 0 ? 96 : -78, 0, h2, 6, 'mansard');        // Ministers' wings
  }
  block(F, R, T, -140, -96, 70, 94, 0, 26, 6, 'chapel');                // Royal Chapel (42 x 24 m, roof ridge ~40 m)
  block(F, R, T, -140, -82, 300, 335, 0, H + 3, 6, 'mansard');          // Opera block, north end
  flat(Pv, -215, -128, -45, 45, 0.35, 3);                                // Cour Royale paving
  flat(Pv, -345, -215, -78, 78, 0.35, 3);                               // Cour d'Honneur
  flat(Gr, S0, S1, -P1, P1, 0.0, 6);                                    // one gravel base under the whole terrace
  /* garden terrace: Parterre d'Eau (two pools on the axis), Parterre du Nord and du Midi, gravel walks */
  for (const sg of [1, -1]) {
    const p0 = sg > 0 ? 10 : -110, p1 = sg > 0 ? 110 : -10;
    vwall(St, 52, p0, 102, p0, 0, 0.7, 2); vwall(St, 102, p1, 52, p1, 0, 0.7, 2); vwall(St, 52, p1, 52, p0, 0, 0.7, 2); vwall(St, 102, p0, 102, p1, 0, 0.7, 2);   // basin kerbs
    flat(St, 51, 103, sg > 0 ? 9 : -111, sg > 0 ? 9.6 : -110.4, 0.7, 2); flat(St, 51, 103, sg > 0 ? 110.4 : -10.6, sg > 0 ? 111 : -10, 0.7, 2);
    flat(Wa, 52, 102, p0, p1, 0.45, 20);
    for (let s = 20; s + 40 <= 250; s += 46) for (let k = 0; k < 4; k++) { const pa = 130 + k * 52; flat(Pa, s, s + 40, sg > 0 ? pa : -pa - 40, sg > 0 ? pa + 40 : -pa, 0.25, 40); }
  }
  /* terrace edge: balustraded stone retaining walls down to the ground (terrain is 4-20 m) */
  const D = -16, Lp = [[S0, -P1], [S1, -P1], [S1, P1], [S0, P1]];
  for (let k = 0; k < 4; k++) { const a = Lp[k], b = Lp[(k + 1) % 4]; vwall(St, a[0], a[1], b[0], b[1], D, 0.0, 3); vwall(St, a[0], a[1], b[0], b[1], 0.0, 1.0, 1); }
  /* gilded Royal Gate between the Cour d'Honneur and the Cour Royale, outer gate at the Place d'Armes */
  grp = new THREE.Group(); grp.name = 'versailles'; grp.position.set(GX, Y0, GZ); grp.rotation.y = ROTY;
  for (const [B, m, n] of [[F, mFac, 'facade'], [Br, mBrick, 'brick'], [R, mSlate, 'slate'], [T, mLead, 'roofs-flat'], [Pv, mPave, 'paving'], [Mb, mMarble, 'marble-court'], [Pa, mPar, 'parterre'], [Gr, mGrav, 'gravel'], [St, mStone, 'stone'], [Wa, mWater, 'pools']])
    if (B.i.length) { const me = mesh(B, m, 'versailles-' + n); if (m === mStone) me.material.side = THREE.DoubleSide; if (m === mPave || m === mMarble || m === mPar || m === mWater) Object.assign(me.material, {polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2}); grp.add(me); }
  // near detail: gold gates (alpha canvas), roof urns along the garden front (instanced), gilded chapel ridge
  near = new THREE.Group(); near.name = 'versailles-near';
  const gm = new THREE.MeshBasicMaterial({map: gateTex(), transparent: true, alphaTest: 0.4, side: THREE.DoubleSide, toneMapped: false});
  const gate = (s, pw, h) => { const t = gm.map.clone(); t.needsUpdate = true; t.repeat.set(pw * 2 / 6, 1); const m = new THREE.Mesh(new THREE.PlaneGeometry(pw * 2, h), gm.clone()); m.material.map = t; m.position.set(s, h / 2, 0); m.rotation.y = Math.PI / 2; near.add(m); };
  gate(-215, 45, 4.2); gate(-345, 78, 3.6);
  if (!LITE) {
    const ug = new THREE.CylinderGeometry(0.35, 0.55, 1.6, 6), urns = [];
    for (let p = -334; p <= 334; p += 6) { const sg = Math.abs(p) < 38 ? 0 : Math.abs(p) < 62 ? -20 : -40; urns.push([sg, H + 0.8, p]); }
    const im = new THREE.InstancedMesh(ug, mStone, urns.length), m4 = new THREE.Matrix4(); urns.forEach((u, k) => { m4.makeTranslation(u[0], u[1], u[2]); im.setMatrixAt(k, m4); }); near.add(im);
    const ridge = new THREE.Mesh(new THREE.BoxGeometry(21, 0.5, 0.6), mGold); ridge.position.set(-118, 40.2, 82); near.add(ridge);
    const statue = new THREE.Mesh(new THREE.BoxGeometry(3, 4, 1.4), mGold); statue.position.set(-235, 4.6, 0); near.add(statue);   // equestrian Louis XIV (simple gilt block on a plinth)
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(6, 2.6, 3), mStone); plinth.position.set(-235, 1.3, 0); near.add(plinth);
  }
  grp.add(near); (W3D.root || document.querySelector('a-scene').object3D).add(grp); built = true;
}
/* ---------- walking: the terrace is one rotated floor; buildings block ---------- */
function gHook(x, z, y) { if (!built || !grp.visible) return null; const [s, p] = toL(x, z); if (s < S0 || s > S1 || Math.abs(p) > P1) return null; return Y0 + 0.12; }
function bHook(x, z, y) { if (!built || !grp.visible) return false; const [s, p] = toL(x, z); if (s < S0 - 2 || s > S1 + 2 || Math.abs(p) > P1 + 2) return false;
  if (y < Y0 + 30) for (const b of BLDG) if (s > b.s0 - 0.4 && s < b.s1 + 0.4 && p > b.p0 - 0.4 && p < b.p1 + 0.4) return true; return false; }
function setClip(on) { const U = W3D.clipU; if (!U) return; const R = U.jfRect.value[2]; if (on) { const c = toW((S0 + S1) / 2, 0); R.set(c[0], c[1], 395, 20); } else R.set(0, 0, -1, 0); }
const _c = new THREE.Vector3();
setInterval(() => {
  if (!window.W3D_READY || !W3D.root) return;
  const sc = document.querySelector('a-scene'), cam = sc && sc.camera; if (!cam) return; cam.getWorldPosition(_c);
  const d = Math.hypot(_c.x - GX, _c.z - GZ), on = W3D.active !== false && d < LOAD;
  if (on && !built) { build(); W3D.gHooks = W3D.gHooks || []; W3D.bHooks = W3D.bHooks || []; W3D.gHooks.push(gHook); W3D.bHooks.push(bHook); }
  if (!built) return;
  const vis = on || (grp.visible && d < DROP && W3D.active !== false);
  if (grp.visible !== vis) { grp.visible = vis; setClip(vis); } else if (vis) setClip(true);
  near.visible = vis && d < NEAR;
}, 800);
/* ?spot=versailles / Go to: on the Parterre d'Eau between the pools, facing the garden front (ESE, 111.84 deg) */
function go() { const [x, z] = toW(150, 0); const yaw = Math.atan2(-(-UX), -(-UZ)) * 180 / Math.PI; const t = () => W3D.teleportTo(x, Y0 + 0.12, z, yaw); t(); setTimeout(t, 1500);
  setTimeout(() => { t(); if (window.JFVR && JFVR.hud) JFVR.hud('Ch\u00e2teau de Versailles - garden front (phase 1)'); }, 4000); }
function goCourt() { const [x, z] = toW(-330, 0); const yaw = Math.atan2(-UX, -UZ) * 180 / Math.PI; W3D.teleportTo(x, Y0 + 0.12, z, yaw); setTimeout(() => W3D.teleportTo(x, Y0 + 0.12, z, yaw), 1500); }
V.go = go; V.goCourt = goCourt; V.stats = () => ({built, visible: grp && grp.visible, Y0, tris: grp ? (() => { let t = 0; grp.traverse(o => { if (o.isMesh && o.geometry.index) t += o.geometry.index.count / 3 * (o.isInstancedMesh ? o.count : 1); }); return t; })() : 0});
(function reg() { if (!window.W3D || !W3D.spots) return setTimeout(reg, 300); W3D.spots.versailles = go; W3D.spots['versailles-court'] = goCourt; })();
})();
