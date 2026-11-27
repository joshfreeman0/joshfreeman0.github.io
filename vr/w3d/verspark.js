/* Versailles phase 2 (T-16, Nov 27 2026, Josh: "build out all the formal gardens, buildings and waterways, including the main road grid").
   The estate around the phase-1 palace (versailles.js) in the same s,p frame (s from the garden front toward the canal, p north):
   Grand Canal cross (with the Trianon and Ménagerie arms) JOINED into the real Nemasket / Taunton rivers at its east head (Josh's choice:
   the rivers keep their real course and level, 4.15 m, the canal water is at that level and opens into them), Latona, Apollo, Neptune,
   Dragon, Encelade, Obelisk, Miroir and the other basins, the Tapis Vert, the bosquets as hedged blocks, the Orangerie and the Pièce
   d'eau des Suisses, the Grand and Petit Trianon and the Hameau, and the town: Place d'Armes, the Grande and Petite Écuries, the three
   avenues and the street grid, the Jeu de Paume. Layout: OSM (c) OpenStreetMap contributors (ODbL), heights USGS 3DEP; data in
   vers_park.json (built by /workspace/versailles-plan/p2/build_park.py).
   Lean: one painted ground texture (canvas, built once) on one heightfield mesh, a handful of merged meshes (walls / bands / roofs per
   style), instanced trees and bridges; near detail only within NEAR. Google tiles are cut out under the region (realearth mask hook).
   Interiors are FP_ROOMS rooms (vr/rooms/versailles.js), entered at gold door markers. */
(function () {
'use strict';
const W3D = window.W3D = window.W3D || {};
const LITE = !!window.JFVR_LITE;
const LOAD = 6500, DROP = 7200, NEAR = 2600, Y0 = 14.6;
let V = null, J = null, grp = null, near = null, built = false, loading = false, G = null, doors = [];
const S0 = -345, S1 = 268, P1 = 348;
function cv(w, h, f) { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = LITE ? 2 : 8; return t; }
/* ---------- heightfield ---------- */
function hAt(s, p) {
  if (!G) return null; const fi = (s - G.s0) / G.st, fj = (p - G.p0) / G.st; if (fi < 0 || fj < 0 || fi >= G.ns - 1 || fj >= G.np - 1) return null;
  const i = Math.floor(fi), j = Math.floor(fj), a = fi - i, b = fj - j, H = G.h, n = G.ns;
  const v00 = H[j * n + i], v10 = H[j * n + i + 1], v01 = H[(j + 1) * n + i], v11 = H[(j + 1) * n + i + 1];
  if (v00 < -30000 || v10 < -30000 || v01 < -30000 || v11 < -30000) return null;
  return (v00 * (1 - a) * (1 - b) + v10 * a * (1 - b) + v01 * (1 - a) * b + v11 * a * b) / 10;
}
const hOr = (s, p, d) => { const h = hAt(s, p); return h === null ? d : h; };
/* ---------- textures ---------- */
const storeyTex = (wall, win, bay, sty, kind) => cv(128, 96, (g, w, h) => {
  g.fillStyle = wall; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,0.08)'; g.fillRect(0, h - 6, w, 6);
  if (kind === 'arch') { g.fillStyle = win; g.fillRect(w / 2 - 20, 20, 40, 62); g.beginPath(); g.arc(w / 2, 20, 20, Math.PI, 0); g.fill(); g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(0, 0, 8, h); g.fillRect(w - 8, 0, 8, h); }
  else if (kind === 'cottage') { g.fillStyle = '#6b4a2e'; for (let x = 0; x < w; x += 32) g.fillRect(x, 0, 5, h); g.fillRect(0, 44, w, 5); g.fillStyle = win; g.fillRect(44, 22, 36, 30); }
  else { for (const cx of [w * 0.28, w * 0.72]) { g.fillStyle = '#e9e2d0'; g.fillRect(cx - 15, 14, 30, 64); g.fillStyle = win; g.fillRect(cx - 11, 18, 22, 56); g.fillStyle = '#5b6b5a'; g.fillRect(cx - 21, 18, 6, 56); g.fillRect(cx + 15, 18, 6, 56); } }
});
const bandTex = (roof, dormer) => cv(128, 64, (g, w, h) => { g.fillStyle = roof; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,0.18)'; for (let y = 0; y < h; y += 6) g.fillRect(0, y, w, 1);
  g.fillStyle = '#e4dccb'; g.fillRect(0, h - 7, w, 7); if (dormer) for (const cx of [w * 0.28, w * 0.72]) { g.fillStyle = '#ddd5c2'; g.fillRect(cx - 10, 16, 20, 30); g.fillStyle = '#2c3540'; g.fillRect(cx - 6, 21, 12, 22); } });
const hedgeTex = () => cv(64, 64, (g, w, h) => { g.fillStyle = '#2f5a2a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 500; i++) { g.fillStyle = Math.random() < 0.5 ? '#264d22' : '#3d6e33'; g.fillRect(Math.random() * w, Math.random() * h, 3, 3); } });
const canopyTex = () => cv(64, 64, (g, w, h) => { g.fillStyle = '#2a5226'; g.fillRect(0, 0, w, h); for (let i = 0; i < 60; i++) { g.fillStyle = Math.random() < 0.5 ? '#1f421c' : '#3b6a31'; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, 4 + Math.random() * 6, 0, 7); g.fill(); } });
/* one painted ground map over the whole region: lawns, parterres, bosquet floors, gravel allées, roads, plazas, water beds */
function groundTex(bx) {
  const W = LITE ? 1024 : 2048, Hh = Math.round(W * (bx.p1 - bx.p0) / (bx.s1 - bx.s0)), k = W / (bx.s1 - bx.s0);
  const c = document.createElement('canvas'); c.width = W; c.height = Hh; const g = c.getContext('2d');
  const X = s => (s - bx.s0) * k, Y = p => (p - bx.p0) * k;
  const poly = (r, fill) => { g.beginPath(); for (let i = 0; i < r.length; i += 2) i ? g.lineTo(X(r[i]), Y(r[i + 1])) : g.moveTo(X(r[i]), Y(r[i + 1])); g.closePath(); g.fillStyle = fill; g.fill(); };
  const line = (r, wd, col) => { g.beginPath(); for (let i = 0; i < r.length; i += 2) i ? g.lineTo(X(r[i]), Y(r[i + 1])) : g.moveTo(X(r[i]), Y(r[i + 1])); g.lineWidth = Math.max(1, wd * k); g.strokeStyle = col; g.lineCap = g.lineJoin = 'round'; g.stroke(); };
  g.fillStyle = '#6f8f4a'; g.fillRect(0, 0, W, Hh);
  g.fillStyle = '#a49c8c'; g.fillRect(X(-1300), Y(-950), X(-330) - X(-1300), Y(950) - Y(-950));        // town ground (stone / paving)
  g.fillStyle = '#d3c5a2'; g.fillRect(X(-130), Y(-520), X(900) - X(-130), Y(600) - Y(-520));          // Petit Parc: gravel between the groves
  J.paint.lawn.forEach(r => poly(r, '#6f9a45')); J.paint.wood.forEach(r => poly(r, '#3d5a2c'));
  J.paint.garden.forEach(r => poly(r, '#5f8a3f')); J.paint.plaza.forEach(r => poly(r, '#c2b49a'));
  // the Tapis Vert and the lawns along the Grand Canal
  poly([350, -13, 690, -13, 690, 13, 350, 13], '#78a64c');
  J.allee.forEach(([w, ...r]) => line(r, w, '#d8cba8'));
  J.roads.forEach(([w, ...r]) => line(r, w + 4, '#9a9284')); J.roads.forEach(([w, ...r]) => line(r, w, '#55575a'));
  J.canal.forEach(r => poly(r, '#2c4a52')); J.basins.forEach(b => b.r.forEach(r => poly(r, '#2c4a52')));
  J.rivers.forEach(R => line(R.p, R.hw * 2 + 6, '#4a5a3c')); J.rivers.forEach(R => line(R.p, R.hw * 2, '#2c4a52'));
  // broderie scrolls on the garden polygons: one small repeating pattern tile, filled once per polygon
  { const pc = document.createElement('canvas'), n = Math.max(4, Math.round(9 * k)); pc.width = pc.height = n; const q = pc.getContext('2d'); q.fillStyle = '#5f8a3f'; q.fillRect(0, 0, n, n);
    q.strokeStyle = '#2f5226'; q.lineWidth = Math.max(1, 1.2 * k); q.beginPath(); q.arc(n / 2, n / 2, n / 3, 0, 4.5); q.stroke(); const pat = g.createPattern(pc, 'repeat'); J.paint.garden.forEach(r => poly(r, pat)); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = LITE ? 2 : 8; return t;
}
/* ---------- geometry helpers (local frame: x = s, z = p, y = height) ---------- */
function Buf() { return {p: [], uv: [], i: []}; }
function quad(B, a, b, c, d, u0, u1, v0, v1) { const n = B.p.length / 3; B.p.push(...a, ...b, ...c, ...d); B.uv.push(u0, v0, u1, v0, u1, v1, u0, v1); B.i.push(n, n + 1, n + 2, n, n + 2, n + 3); }
function mesh(B, mat, name) { if (!B.i.length) return null; const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(B.p, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(B.uv, 2));
  g.setIndex(B.i); g.computeVertexNormals(); g.computeBoundingSphere(); const m = new THREE.Mesh(g, mat); m.name = name; m.receiveShadow = true; return m; }
const area = r => { let a = 0; for (let i = 0; i < r.length; i += 2) { const j = (i + 2) % r.length; a += r[i] * r[j + 1] - r[j] * r[i + 1]; } return a / 2; };
const cw = r => { if (area(r) > 0) { const o = []; for (let i = r.length - 2; i >= 0; i -= 2) o.push(r[i], r[i + 1]); return o; } return r; };   // walls face out for clockwise (s,p) rings
function walls(B, r, y0, y1, bay, sty, uOff) { r = cw(r); let u = uOff || 0;
  for (let i = 0; i < r.length; i += 2) { const j = (i + 2) % r.length, as = r[i], ap = r[i + 1], bs = r[j], bp = r[j + 1], L = Math.hypot(bs - as, bp - ap);
    quad(B, [as, y0, ap], [bs, y0, bp], [bs, y1, bp], [as, y1, ap], u / bay, (u + L) / bay, 0, (y1 - y0) / sty); u += L; } }
function cap(B, r, y, tile) { const v = []; for (let i = 0; i < r.length; i += 2) v.push(new THREE.Vector2(r[i], r[i + 1]));
  let tri; try { tri = THREE.ShapeUtils.triangulateShape(v, []); } catch (e) { return; } const n = B.p.length / 3;
  v.forEach(q => { B.p.push(q.x, y, q.y); B.uv.push(q.x / tile, q.y / tile); });
  const up = area(r) > 0;   // ccw in (s,p) = clockwise seen from above (+y): flip to face up
  tri.forEach(t => up ? B.i.push(n + t[0], n + t[2], n + t[1]) : B.i.push(n + t[0], n + t[1], n + t[2])); }
function flatPoly(r, y, mat, name) { const sh = new THREE.Shape(); for (let i = 0; i < r.length; i += 2) i ? sh.lineTo(r[i], -r[i + 1]) : sh.moveTo(r[i], -r[i + 1]);
  const g = new THREE.ShapeGeometry(sh); g.rotateX(-Math.PI / 2); g.translate(0, y, 0); const m = new THREE.Mesh(g, mat); m.name = name; m.receiveShadow = true; return m; }
function ribbon(pts, lev, hw) { const p = [], ix = []; const n = pts.length / 2;
  for (let k = 0; k < n; k++) { const a = Math.max(0, k - 1), b = Math.min(n - 1, k + 1); let ts = pts[2 * b] - pts[2 * a], tp = pts[2 * b + 1] - pts[2 * a + 1]; const l = Math.hypot(ts, tp) || 1; ts /= l; tp /= l;
    const s = pts[2 * k], q = pts[2 * k + 1], y = lev[k]; p.push(s - tp * hw, y, q + ts * hw, s + tp * hw, y, q - ts * hw); if (k) ix.push(2 * k - 2, 2 * k - 1, 2 * k, 2 * k - 1, 2 * k + 1, 2 * k); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(p.filter((_, i) => i % 3 !== 1).map(v => v / 30), 2)); g.setIndex(ix); g.computeVertexNormals();
  const nr = g.attributes.normal; for (let i = 0; i < nr.count; i++) if (nr.getY(i) < 0) nr.setXYZ(i, -nr.getX(i), -nr.getY(i), -nr.getZ(i)); return g; }

function build() {
  const std = (o) => LITE ? new THREE.MeshLambertMaterial(o) : new THREE.MeshStandardMaterial(Object.assign({roughness: 0.88, metalness: 0}, o));
  grp = new THREE.Group(); grp.name = 'versailles-park'; grp.position.set(V.GX, 0, V.GZ); grp.rotation.y = -Math.atan2(V.UZ, V.UX);
  near = new THREE.Group(); near.name = 'versailles-park-near'; grp.add(near);
  /* ground heightfield */
  G = J.grid; G.h = Int16Array.from(G.h);
  const bx = {s0: G.s0, p0: G.p0, s1: G.s0 + (G.ns - 1) * G.st, p1: G.p0 + (G.np - 1) * G.st};
  { const pos = new Float32Array(G.ns * G.np * 3), uv = new Float32Array(G.ns * G.np * 2), idx = [];
    for (let j = 0; j < G.np; j++) for (let i = 0; i < G.ns; i++) { const k = j * G.ns + i, s = G.s0 + i * G.st, p = G.p0 + j * G.st, h = G.h[k];
      pos.set([s, h < -30000 ? 0 : h / 10, p], k * 3); uv.set([(s - bx.s0) / (bx.s1 - bx.s0), (p - bx.p0) / (bx.p1 - bx.p0)], k * 2); }
    for (let j = 0; j < G.np - 1; j++) for (let i = 0; i < G.ns - 1; i++) { const a = j * G.ns + i, b = a + 1, c = a + G.ns, d = c + 1;
      if (G.h[a] < -30000 || G.h[b] < -30000 || G.h[c] < -30000 || G.h[d] < -30000) continue; idx.push(a, c, b, b, c, d); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const nr = g.attributes.normal; for (let i = 0; i < nr.count; i++) if (nr.getY(i) < 0) nr.setXYZ(i, -nr.getX(i), -nr.getY(i), -nr.getZ(i));
    const tex = groundTex(bx); tex.flipY = false;
    const m = std({map: tex}); m.name = 'versailles-ground';
    if (!LITE) m.onBeforeCompile = sh => { sh.vertexShader = 'varying vec2 vVp;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvVp = position.xz;');
      sh.fragmentShader = 'varying vec2 vVp;\n' + sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n{ vec2 c = floor(vVp * 1.4); float n = fract(sin(dot(c, vec2(12.9898, 78.233))) * 43758.5453); diffuseColor.rgb *= 0.9 + 0.2 * n; }'); };
    if (W3D.realEarth && W3D.realEarth.clipOurs) W3D.realEarth.clipOurs(m);
    const me = new THREE.Mesh(g, m); me.name = 'versailles-ground'; me.receiveShadow = true; grp.add(me); }
  /* water: Grand Canal + basins + the rivers (same look; the canal opens into the rivers at 4.15 m) */
  const wm = new THREE.MeshStandardMaterial({color: 0x24474a, roughness: 0.1, metalness: 0, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1});
  if (W3D.env) { wm.envMap = W3D.env; wm.envMapIntensity = 0.75; }
  if (W3D.waterU && W3D.waterU.wN && W3D.waterU.wN.value) { const n = W3D.waterU.wN.value.clone(); n.needsUpdate = true; n.wrapS = n.wrapT = THREE.RepeatWrapping; n.repeat.set(1 / 9, 1 / 9); wm.normalMap = n; wm.normalScale.set(0.35, 0.35); }
  wm.name = 'versailles-water';
  const WG = []; J.canal.forEach(r => WG.push(flatPoly(r, J.WL, wm, 'grand-canal').geometry));
  J.basins.forEach(b => b.r.forEach(r => WG.push(flatPoly(r, b.y + (b.f ? 0.35 : -0.25), wm, 'basin').geometry)));
  const rm = wm.clone(); rm.polygonOffsetFactor = 0; rm.polygonOffsetUnits = 0; if (wm.normalMap) rm.normalMap = wm.normalMap; if (W3D.realEarth && W3D.realEarth.clipOurs) W3D.realEarth.clipOurs(rm);
  const RG = J.rivers.map(R => ribbon(R.p, R.l, R.hw));
  const merge = gs => { const ps = [], us = [], ix = []; let o = 0; for (const g of gs) { const gi = g.index ? g : g; const P = g.attributes.position.array, U = g.attributes.uv ? g.attributes.uv.array : new Float32Array(P.length / 3 * 2);
      for (let i = 0; i < P.length; i += 3) { ps.push(P[i], P[i + 1], P[i + 2]); } for (let i = 0; i < P.length / 3; i++) us.push(P[i * 3] / 30, P[i * 3 + 2] / 30);
      const I = g.index ? g.index.array : [...Array(P.length / 3).keys()]; for (const v of I) ix.push(v + o); o += P.length / 3; g.dispose(); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(ps, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(us, 2)); g.setIndex(ix); g.computeVertexNormals();
    const nr = g.attributes.normal; for (let i = 0; i < nr.count; i++) if (nr.getY(i) < 0) nr.setXYZ(i, -nr.getX(i), -nr.getY(i), -nr.getZ(i)); return g; };
  { const m = new THREE.Mesh(merge(WG), wm); m.name = 'versailles-water'; grp.add(m); const r = new THREE.Mesh(merge(RG), rm); r.name = 'versailles-rivers'; grp.add(r); }
  /* stone kerbs: formal basins and the canal (left open where the rivers flow in) */
  const St = Buf(), rpts = [];
  J.rivers.forEach(R => { for (let i = 0; i < R.p.length; i += 2) rpts.push([R.p[i], R.p[i + 1], R.hw + 4]); });
  const nearRiver = (s, p) => rpts.some(([a, b, w]) => Math.abs(a - s) < w && Math.abs(b - p) < w && Math.hypot(a - s, b - p) < w);
  const kerb = (r, y, skipRiver) => { r = cw(r); for (let i = 0; i < r.length; i += 2) { const j = (i + 2) % r.length, as = r[i], ap = r[i + 1], bs = r[j], bp = r[j + 1], L = Math.hypot(bs - as, bp - ap);
      if (skipRiver && nearRiver((as + bs) / 2, (ap + bp) / 2)) continue; quad(St, [as, y - 1.6, ap], [bs, y - 1.6, bp], [bs, y + 0.55, bp], [as, y + 0.55, ap], 0, L / 3, 0, 0.7); } };
  J.canal.forEach(r => kerb(r, J.WL + 0.5, true)); J.basins.forEach(b => { if (b.f) b.r.forEach(r => kerb(r, b.y, false)); });
  const mStone = new THREE.MeshLambertMaterial({color: 0xcfc2a2, side: THREE.DoubleSide}); { const m = mesh(St, mStone, 'versailles-kerbs'); if (m) grp.add(m); }
  /* buildings: walls (style texture) + top band (mansard / thatch) + flat roof */
  const ST = {town: {wall: storeyTex('#e3d8bf', '#38424c', 7, 3.4, 'town'), bay: 7, sty: 3.4, band: 'slate'}, royal: {wall: storeyTex('#e6d9b8', '#2f3944', 6, 5, 'arch'), bay: 6, sty: 5, band: 'slate'},
    trianon: {wall: storeyTex('#d79a8c', '#3a3238', 5, 10, 'arch'), bay: 5, sty: 10, band: null}, cottage: {wall: storeyTex('#e8dfc8', '#3b3a33', 6, 3.5, 'cottage'), bay: 6, sty: 3.5, band: 'thatch'}};
  const BW = {}, BB = {slate: Buf(), thatch: Buf()}, RF = Buf();
  for (const b of J.bld) { const [cls, h, base] = b, r = b.slice(3), S = ST[cls] || ST.town, bandH = S.band ? Math.min(3.2, h * 0.3) : 0;
    const B = BW[cls] = BW[cls] || Buf(); walls(B, r, base, base + h - bandH, S.bay, S.sty);
    if (bandH) walls(BB[S.band], r, base + h - bandH, base + h, S.bay, bandH);
    cap(RF, r, base + h, 8); }
  for (const k in BW) { const m = mesh(BW[k], std({map: ST[k].wall}), 'versailles-bld-' + k); if (m) { m.castShadow = !LITE; grp.add(m); } }
  { const m = mesh(BB.slate, std({map: bandTex('#4c5866', true)}), 'versailles-mansards'); if (m) grp.add(m); const t = mesh(BB.thatch, std({map: bandTex('#8a6d3e', false)}), 'versailles-thatch'); if (t) grp.add(t);
    const rf = mesh(RF, new THREE.MeshLambertMaterial({color: 0x5a636c}), 'versailles-roofs'); if (rf) grp.add(rf); }
  /* bosquets: clipped palissade hedges round each grove, the canopy as a level top */
  { const Hd = Buf(), Cp = Buf(), HH = 8;
    for (const b of J.bos) { const base = b[0] - 0.5, r = b.slice(1); walls(Hd, r, base, base + HH, 5, 5); cap(Cp, r, base + HH, 12); }
    const hm = mesh(Hd, std({map: hedgeTex()}), 'versailles-hedges'), cm = mesh(Cp, std({map: canopyTex()}), 'versailles-groves'); if (hm) grp.add(hm); if (cm) grp.add(cm); }
  /* the Orangerie: arcaded gallery built into the south terrace wall + two side galleries, facing its parterre */
  { const O = Buf(), arc = storeyTex('#e2d4b0', '#2b2f33', 7, 8, 'arch'), g0 = hOr(0, -420, 8);
    const box = (s0, s1, p0, p1, y0, y1) => walls(O, [s0, p0, s0, p1, s1, p1, s1, p0], y0, y1, 7, (y1 - y0));
    box(-105, 115, -362, -348, g0 - 1, Y0 + 0.9); box(-135, -105, -470, -348, g0 - 1, Y0 + 0.9); box(115, 145, -470, -348, g0 - 1, Y0 + 0.9);
    const m = mesh(O, std({map: arc}), 'versailles-orangerie'); if (m) grp.add(m);
    const cp = Buf(); cap(cp, [-135, -470, -135, -348, -105, -348, -105, -470], Y0 + 0.9, 6); cap(cp, [115, -470, 115, -348, 145, -348, 145, -470], Y0 + 0.9, 6);
    const c = mesh(cp, mStone, 'versailles-orangerie-top'); if (c) grp.add(c);
    const ob = new THREE.Mesh(new THREE.CylinderGeometry(22, 22, 0.8, 32, 1, true), mStone); ob.position.set(5, g0 + 0.2, -420); grp.add(ob);
    const ow = new THREE.Mesh(new THREE.CircleGeometry(22, 32), wm); ow.rotation.x = -Math.PI / 2; ow.position.set(5, g0 + 0.45, -420); grp.add(ow); }
  /* bridges where roads, allées and the main axis cross the rivers (instanced stone decks) */
  { const n = J.bridges.length, im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({color: 0xbfb39a}), n), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    J.bridges.forEach(([s, p, a, L, w, y], k) => { e.set(0, -a, 0); q.setFromEuler(e); m4.compose(new THREE.Vector3(s, y - 0.5, p), q, new THREE.Vector3(L, 1.2, w)); im.setMatrixAt(k, m4); });
    im.name = 'versailles-bridges'; grp.add(im); }
  /* trees: avenue rows in the town, the Tapis Vert, the Grand Canal banks (instanced: trunk + clipped canopy, vertex colours) */
  { const tr = new THREE.CylinderGeometry(0.35, 0.45, 3, 5, 1, true); tr.translate(0, 1.5, 0); const ca = new THREE.IcosahedronGeometry(1, 0); ca.scale(3.4, 4.4, 3.4); ca.translate(0, 6.6, 0);
    const col = (g, c) => { const a = new Float32Array(g.attributes.position.count * 3), cc = new THREE.Color(c); for (let i = 0; i < a.length; i += 3) a.set([cc.r, cc.g, cc.b], i); g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g.toNonIndexed(); };
    const g1 = col(tr, 0x5a4632), g2 = col(ca, 0x3f6a32), pos = [...g1.attributes.position.array, ...g2.attributes.position.array], cl = [...g1.attributes.color.array, ...g2.attributes.color.array];
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3)); g.computeVertexNormals();
    const T = J.trees, step = LITE ? 2 : 1, n = Math.floor(T.length / 2 / step), im = new THREE.InstancedMesh(g, new THREE.MeshLambertMaterial({vertexColors: true}), n), m4 = new THREE.Matrix4();
    for (let k = 0; k < n; k++) { const s = T[2 * k * step], p = T[2 * k * step + 1], sc = 0.85 + ((k * 7919) % 100) / 300; m4.makeScale(sc, sc, sc); m4.setPosition(s, hOr(s, p, 6) - 0.2, p); im.setMatrixAt(k, m4); }
    im.name = 'versailles-trees'; near.add(im); }
  /* fountains: Latona (tiered marble, gilt figure), Apollo (gilt chariot), Neptune / Dragon / Encelade jets */
  { const N = J.named, gold = new THREE.MeshStandardMaterial({color: 0xd4af37, metalness: 0.85, roughness: 0.3}), marble = new THREE.MeshLambertMaterial({color: 0xe8e2d6});
    const jetM = new THREE.MeshBasicMaterial({color: 0xeaf6ff, transparent: true, opacity: 0.55, depthWrite: false});
    const jet = (s, p, y, h, r) => { const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 8, 1, true), jetM); m.position.set(s, y + h / 2, p); near.add(m); };
    const bY = nm => { const b = J.basins.find(x => x.n === nm); return b ? b.y + 0.35 : null; };
    { const [s, p] = N.latona, y = Y0; for (const [r, h, k] of [[9, 0.9, 0], [6.5, 1.0, 1], [4.2, 1.0, 2], [2.4, 1.2, 3]]) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.05, h, 24), marble); m.position.set(s, y + 0.45 + k * 1.0 + h / 2, p); near.add(m); }
      const lw = new THREE.Mesh(new THREE.CylinderGeometry(18, 18, 0.9, 32, 1, true), marble); lw.position.set(s, y + 0.45, p); near.add(lw);
      const lp = new THREE.Mesh(new THREE.CircleGeometry(18, 32), wm); lp.rotation.x = -Math.PI / 2; lp.position.set(s, y + 0.6, p); near.add(lp);
      const f = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 2.4, 8), gold); f.position.set(s, y + 6.2, p); near.add(f); jet(s, p, y + 7.2, 5, 0.25);
      for (let a = 0; a < 12; a++) jet(s + Math.cos(a / 12 * 6.283) * 12, p + Math.sin(a / 12 * 6.283) * 12, y + 0.6, 3.5, 0.15); }
    { const [s, p] = N.apollo, y = bY("Bassin d'Apollon") || hOr(s, p, 5); const ch = new THREE.Group(); ch.position.set(s, y, p); ch.rotation.y = Math.PI;   // chariot rising from the water toward the palace
      const bx_ = (w, h, d, x, yy, z, m) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m || gold); o.position.set(x, yy, z); ch.add(o); };
      bx_(3, 1.6, 2.6, 2, 1.2, 0); bx_(0.8, 2.2, 0.8, 2, 2.6, 0); for (let i = 0; i < 4; i++) { bx_(2.6, 1.3, 0.7, -1.4, 1.5, -1.6 + i * 1.07); bx_(0.6, 0.9, 0.5, -2.9, 2.3, -1.6 + i * 1.07); }
      near.add(ch); jet(s, p, y, 9, 0.35); jet(s - 6, p, y, 4, 0.2); jet(s + 6, p, y, 4, 0.2); }
    for (const [k, nm, h] of [['neptune', 'Bassin de Neptune', 6], ['dragon', 'Bassin du Dragon', 14], ['encelade', "Bassin d'Encelade", 10], ['obelisque', "La Fontaine de l'Obélisque", 8]]) {
      const [s, p] = N[k], y = bY(nm) || hOr(s, p, 6); jet(s, p, y, h, 0.3); if (k !== 'obelisque') { const f = new THREE.Mesh(new THREE.DodecahedronGeometry(1.4, 0), gold); f.position.set(s, y + 0.8, p); near.add(f); } } }
  (W3D.root || document.querySelector('a-scene').object3D).add(grp);
  sinkRing();
  addDoors();
  built = true;
}
/* Real Earth off (phones): the coarse far ring (256 m grid) would poke through our ground - sink its vertices inside the region under it */
function sinkRing() { const R = W3D.rings && W3D.rings.far; if (!R) return; const P = R.geometry.attributes.position; let n = 0;
  for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = P.getZ(i); if (Math.abs(x - V.GX) > 4500 || Math.abs(z - V.GZ) > 4500) continue; const [s, p] = V.toL(x, z);
    let h = null; for (let a = -260; a <= 260; a += 65) for (let b = -260; b <= 260; b += 65) { const v = hAt(s + a, p + b); if (v !== null && (h === null || v < h)) h = v; }   // the 256 m ring cells span narrow parts (canal arms)
    if (h === null && s >= S0 - 300 && s <= S1 + 300 && Math.abs(p) <= P1 + 300) h = 5; if (h === null) continue; const y = Math.min(P.getY(i), h - 2); if (y !== P.getY(i)) { P.setY(i, y); n++; } }
  if (n) { P.needsUpdate = true; R.geometry.computeVertexNormals(); } }
/* ---------- tile cutout: the region polygons go into Real Earth's mask (Google tiles dropped inside, our ground dropped outside) ---------- */
function maskHook(api) { if (!J) return; for (const r of J.region) { const pts = []; for (let i = 0; i < r.length; i += 2) pts.push(V.toW(r[i], r[i + 1])); api.poly(pts); } }
/* ---------- interiors: gold door markers at the palace and the Jeu de Paume (laser click or walk into them) ---------- */
const ROOMS_URL = '/vr/rooms/versailles.js?v=1';
function regRooms() { const F = window.FP_ROOMS; if (!F) return false;
  for (const [k, t] of [['vers-palace', 'Château de Versailles (inside)'], ['vers-chapel', 'Royal Chapel'], ['vers-opera', 'Royal Opera'], ['vers-jdp', 'Jeu de Paume']]) if (!F.CATALOG[k]) F.CATALOG[k] = {title: t, module: ROOMS_URL, fallbackUrl: null};
  return true; }
function enter(room, at) { if (!regRooms()) return; if (window.JFVR && JFVR.hud) JFVR.hud('Entering...'); window.FP_ROOMS.enter(room, {at, via: 'door'}); }
const DOORS = [   // [room, at, s, p, y (null = ground), label, facing (+1 garden / -1 town)]
  ['vers-palace', 'mirrors', 1.6, 0, Y0, 'Hall of Mirrors', 1], ['vers-palace', 'bedroom', -99.6, 0, Y0, "Louis XIV's bedroom", -1], ['vers-palace', 'hercules', -151.6, 116, Y0, 'State Apartments', -1],
  ['vers-chapel', 'chapel', -141.6, 82, Y0, 'Royal Chapel', -1], ['vers-opera', 'opera', -141.6, 318, Y0, 'Royal Opera', -1], ['vers-palace', 'queen', -36.4, -80, Y0, "Queen's apartment", 1], ['vers-jdp', 'jdp', null, null, null, 'Jeu de Paume', 1]];
function label(txt) { return cv(512, 96, (g, w, h) => { g.fillStyle = 'rgba(20,16,8,0.82)'; g.fillRect(0, 0, w, h); g.strokeStyle = '#d4af37'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
  g.fillStyle = '#ffe9a8'; g.font = 'bold 40px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, w / 2, h / 2 + 2); }); }
function addDoors() {
  const sc = document.querySelector('a-scene'); if (!sc) return; const N = J.named;
  for (const [room, at, s0, p0, y0, txt, fc] of DOORS) {
    let s = s0, p = p0, y = y0, face = 0;
    if (room === 'vers-jdp') { const q = J.named.jdp_poly; let mx = -1e9; for (let i = 0; i < q.length; i += 2) mx = Math.max(mx, q[i]); s = mx + 1.6; p = N.jdp[1]; y = hOr(s, p, 8); }   // east door on the street
    const [x, z] = V.toW(s, p); const e = document.createElement('a-entity'); e.setAttribute('position', x + ' ' + y + ' ' + z); e.setAttribute('class', 'versdoor');
    const o = new THREE.Group(); const fr = new THREE.Mesh(new THREE.BoxGeometry(0.25, 3.4, 2.2), new THREE.MeshStandardMaterial({color: 0xd4af37, metalness: 0.8, roughness: 0.3, emissive: 0x3a2a00}));
    fr.position.y = 1.7; o.add(fr); o.rotation.y = -Math.atan2(V.UZ, V.UX);
    const lb = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.49), new THREE.MeshBasicMaterial({map: label(txt), transparent: true, side: THREE.DoubleSide})); lb.position.set(0, 3.9, 0); lb.rotation.y = fc * Math.PI / 2; o.add(lb);
    e.setObject3D('mesh', o);
    const b = document.createElement('a-plane'); b.setAttribute('class', 'btn'); b.setAttribute('width', 2.2); b.setAttribute('height', 3.2); b.setAttribute('position', '0 1.7 0');
    b.setAttribute('rotation', '0 ' + THREE.MathUtils.radToDeg(Math.atan2(V.UX, V.UZ)) + ' 0'); b.setAttribute('material', 'shader:flat;color:#ffd700;opacity:0.18;transparent:true;side:double');
    b.addEventListener('click', () => enter(room, at)); e.appendChild(b); sc.appendChild(e);
    doors.push({room, at, x, z, y, el: e, armed: true});
  }
}
/* ---------- walking ---------- */
function gHook(x, z, y) { if (!built || !grp.visible) return null; const [s, p] = V.toL(x, z); if (s >= S0 && s <= S1 && Math.abs(p) <= P1) return null;
  for (const [bs, bp, a, L, w, by] of J.bridges) { const ds = s - bs, dp = p - bp, ca = Math.cos(a), sa = Math.sin(a), u = ds * ca + dp * sa, v = -ds * sa + dp * ca; if (Math.abs(u) < L / 2 && Math.abs(v) < w / 2) return by + 0.1; }
  const h = hAt(s, p); if (h === null) return null; return Math.max(h, J.WL - 0.3); }
/* ---------- far culling: at Versailles the home world (10-12 km west) is entirely past the fog (~4.9 km) but was still drawn - about
   1.5M triangles and ~2,000 draw calls looking west. While you are within 4.5 km of the palace, home-world groups whose nearest point is
   beyond the fog are hidden; they come back as soon as you leave (or a room takes over). ---------- */
const hidden = new Set(), BX = new Map(), _b = new THREE.Box3(), _bc = new THREE.Vector3(), _bs = new THREE.Vector3();
function farCull(cam, active) {
  const sc = document.querySelector('a-scene'), fog = sc && sc.object3D.fog;
  if (!active || !fog || !fog.far || !W3D.root) { if (hidden.size) { hidden.forEach(o => { o.visible = true; }); hidden.clear(); } return; }
  for (const o of W3D.root.children) { if (o === grp || /ring|versailles|sky/i.test(o.name || '')) continue;
    let r = BX.get(o); if (!r) { _b.setFromObject(o); if (_b.isEmpty()) { BX.set(o, {skip: true}); continue; } _b.getCenter(_bc); _b.getSize(_bs); let inst = false; o.traverse(m => { if (m.isInstancedMesh) inst = true; });   // instance spreads aren't in the box: assume the whole 8 km home core
      r = {x: _bc.x, z: _bc.z, h: Math.max(Math.hypot(_bs.x, _bs.z) / 2, inst ? 4100 : 0), skip: _bs.x > 20000}; BX.set(o, r); }
    if (r.skip) continue; const far = Math.hypot(cam.x - r.x, cam.z - r.z) - r.h > fog.far + 300;
    if (far && o.visible) { o.visible = false; hidden.add(o); } else if (!far && hidden.has(o)) { o.visible = true; hidden.delete(o); } }
}
/* ---------- lifecycle ---------- */
const _c = new THREE.Vector3();
function tick() {
  if (!window.W3D_READY || !W3D.root || !getV() || !V.toW) return;
  const sc = document.querySelector('a-scene'), cam = sc && sc.camera; if (!cam) return; cam.getWorldPosition(_c);
  const d = Math.hypot(_c.x - V.GX, _c.z - V.GZ), on = W3D.active !== false && !W3D.inRoom && d < LOAD;
  if (on && !J && !loading) { loading = true; fetch('w3d/vers_park.json?v=1').then(r => r.json()).then(j => { J = j; build(); W3D.gHooks = W3D.gHooks || []; W3D.gHooks.push(gHook);
      W3D.maskHooks = W3D.maskHooks || []; W3D.maskHooks.push(maskHook); if (W3D.realEarth && W3D.realEarth.rebuildMask) W3D.realEarth.rebuildMask(); }).catch(e => { console.warn('verspark', e); }); }
  farCull(_c, built && W3D.active !== false && !W3D.inRoom && d < 4500);
  if (!built) return;
  const vis = W3D.active !== false && !W3D.inRoom && (on || (grp.visible && d < DROP));
  if (grp.visible !== vis) { grp.visible = vis; doors.forEach(o => { o.el.object3D.visible = vis; }); }
  near.visible = vis && d < NEAR;
  // walk into a door marker to go inside (re-arms once you step 4 m away)
  if (vis && !W3D.inRoom && !(window.FP_ROOMS && FP_ROOMS.busy)) for (const o of doors) { const dd = Math.hypot(_c.x - o.x, _c.z - o.z), dy = Math.abs(_c.y - 1.6 - o.y);
    if (dd < 1.3 && dy < 2.5 && o.armed) { o.armed = false; enter(o.room, o.at); } else if (dd > 4) o.armed = true; }
}
setInterval(tick, 700);
/* ---------- spots ---------- */
function spotAt(s, p, yawToS, yawToP, y) { getV(); const [x, z] = V.toW(s, p);
  const dx = yawToS * V.UX + yawToP * (-V.UZ), dz = yawToS * V.UZ + yawToP * V.UX, yaw = Math.atan2(-dx, -dz) * 180 / Math.PI;
  const t = () => !W3D.inRoom && W3D.teleportTo(x, y !== undefined ? y : (W3D.groundAt ? W3D.groundAt(x, z, 999) : 8) + 0.05, z, yaw); t(); setTimeout(t, 1500); setTimeout(t, 4000); return {x, z}; }
const SP = {
  'versailles-canal': () => { spotAt(800, -6, 1, 0); hud('Grand Canal from the Apollo basin - the rivers join it at its head'); },
  'versailles-gardens': () => { spotAt(262, 0, 1, 0, Y0 + 0.12); hud('Latona and the Tapis Vert from the terrace'); },
  'versailles-trianon': () => { spotAt(1466, 470, 0, 1); hud('Grand Trianon'); },
  'versailles-town': () => { spotAt(-420, 0, -1, 0); hud("Place d'Armes - Avenue de Paris ahead, Saint-Cloud left, Sceaux right"); },
  'versailles-mirrors': () => enter('vers-palace', 'mirrors'), 'versailles-bedroom': () => enter('vers-palace', 'bedroom'), 'versailles-apartments': () => enter('vers-palace', 'hercules'),
  'versailles-queen': () => enter('vers-palace', 'queen'), 'versailles-chapel': () => enter('vers-chapel', 'chapel'), 'versailles-opera': () => enter('vers-opera', 'opera'), 'versailles-jeudepaume': () => enter('vers-jdp', 'jdp')
};
function hud(m) { setTimeout(() => { if (window.JFVR && JFVR.hud) JFVR.hud(m); }, 4200); }
// room exits land you at the matching door outside
function getV() { V = window.JFVR_versailles; if (V && !V.UX) { const AZ = 291.84 * Math.PI / 180; V.UX = Math.sin(AZ); V.UZ = -Math.cos(AZ); } return V; }
window.JFVR_versailles_return = at => { getV(); const N = J && J.named; const R = {mirrors: [6, 0, 1, 0, Y0 + 0.12], bedroom: [-120, 0, -1, 0, Y0 + 0.12], hercules: [-156, 70, -1, 0, Y0 + 0.12], queen: [-36, -80, 1, 0, Y0 + 0.12],
  chapel: [-148, 82, -1, 0, Y0 + 0.12], opera: [-148, 318, -1, 0, Y0 + 0.12]}[at];
  if (R) return spotAt(...R); if (N) { const q = N.jdp_poly; let mx = -1e9; for (let i = 0; i < q.length; i += 2) mx = Math.max(mx, q[i]); spotAt(mx + 6, N.jdp[1], -1, 0); } else spotAt(-390, -296, -1, 0); };
for (const k of ['mirrors', 'bedroom', 'hercules', 'queen', 'chapel', 'opera', 'jdp']) SP['versailles-ret-' + k] = () => window.JFVR_versailles_return(k);
(function reg() { if (!window.W3D || !W3D.spots || !window.JFVR_versailles) return setTimeout(reg, 300); Object.assign(W3D.spots, SP); regRooms(); })();
window.JFVR_verspark = {hiddenFar: () => hidden.size, stats: () => { let t = 0, m = 0; if (grp) grp.traverse(o => { if (o.isMesh && o.visible) { m++; const c = o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count; t += c / 3 * (o.isInstancedMesh ? o.count : 1); } }); return {built, visible: grp && grp.visible, tris: t, meshes: m}; }, hAt, enter};
})();
