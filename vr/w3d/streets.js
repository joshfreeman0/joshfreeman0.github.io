/* Street-name labels for the Fowling Pond world. Self-contained: loads streets.json, floats green street-sign labels
   above the real roads (within ~420 m of the viewer) and puts a two-blade corner sign at King Philip St / Thrasher St.
   Street names: (c) OpenStreetMap contributors (ODbL). Every road is projected from real OSM lat/lon with the world's geo.json frame (no photo fitting). */
(function () {
const NEAR = 420, MAXL = 36;
let data = null, geo = null, group = null, pool = [], texCache = new Map(), ready = false, acc = 0, loading = false, LAB = [], R = [];

function signTex(text, w, h, bg) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  const r = h * 0.18; g.fillStyle = bg || '#0b5d2e'; g.strokeStyle = '#ffffff'; g.lineWidth = h * 0.06;
  g.beginPath(); g.moveTo(r, 2); g.arcTo(w - 2, 2, w - 2, h - 2, r); g.arcTo(w - 2, h - 2, 2, h - 2, r); g.arcTo(2, h - 2, 2, 2, r); g.arcTo(2, 2, w - 2, 2, r); g.closePath(); g.fill();
  g.save(); g.clip(); g.stroke(); g.restore();
  let fs = h * 0.5; g.font = 'bold ' + fs + 'px Arial, Helvetica, sans-serif';
  while (g.measureText(text).width > w * 0.9 && fs > 10) { fs -= 2; g.font = 'bold ' + fs + 'px Arial, Helvetica, sans-serif'; }
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.lineWidth = fs * 0.12; g.strokeStyle = 'rgba(0,0,0,.55)'; g.strokeText(text, w / 2, h / 2 + 2);
  g.fillStyle = '#fff'; g.fillText(text, w / 2, h / 2 + 2);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; return t;
}
function tex(name) {
  let t = texCache.get(name);
  if (!t) { t = signTex(name, 512, 96); texCache.set(name, t); }
  return t;
}

const RW = [5, 6.5, 8, 10];
function toWorld(lat, lon) { return [(lon - geo.lon0) * geo.kx, (geo.lat0 - lat) * geo.ky]; } // geo.json frame: +x east, +z south
function gh(x, z) { return W3D.terrainH(x, z); }
function underPond(x, z) { const P = W3D.water && W3D.water.pond; return !!P && x > P.x0 && x < P.x1 && z > P.z0 && z < P.z1 && gh(x, z) < 13.5; }
const EXT = () => 6140;
function roadTex() { // bottom half (v 0.25): asphalt with white edge lines; top half (v 0.75): same asphalt, no lines (junction mouths)
  const c = document.createElement('canvas'); c.width = 64; c.height = 64; const g = c.getContext('2d');
  g.fillStyle = '#34373a'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#3d4044'; g.fillRect(14, 0, 36, 64);
  g.fillStyle = '#d9d6c8'; g.fillRect(3, 32, 2, 32); g.fillRect(59, 32, 2, 32);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function buildCorner(c) {
  const [cx, cz] = toWorld(c.ll[0], c.ll[1]);
  const g = new THREE.Group(), y = gh(cx + 5, cz), poleM = new THREE.MeshBasicMaterial({color: 0x555a60});
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 3.8, 8), poleM); pole.position.y = 1.9; g.add(pole);
  const mk = (name, yy, ry) => {
    const m = new THREE.MeshBasicMaterial({map: signTex(name, 1024, 192), side: THREE.DoubleSide, toneMapped: false, fog: false});
    const p = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 0.52), m); const h = new THREE.Group(); h.rotation.y = ry; p.position.set(1.45, yy, 0); h.add(p); return h;
  };
  g.add(mk(c.a, 3.35, 0.35)); g.add(mk(c.b, 2.75, 0.35 + Math.PI / 2));
  g.position.set(cx + 5, y, cz); return [g, cx, cz];
}
// project every road once; keep only the part inside the world, dense-sampled
function project() {
  const E = EXT(), STEP = 10; R = []; LAB = [];
  for (const r of data.roads) {
    const cls = r[0], nm = r[1], q = r[2], br = r[3] === 1, P = [];
    for (let i = 0; i < q.length; i += 2) P.push(toWorld(q[i] / 1e5, q[i + 1] / 1e5));
    const D = [];
    for (let i = 0; i < P.length - 1; i++) {
      const a = P[i], b = P[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = br ? 1 : Math.max(1, Math.ceil(L / STEP));
      for (let k = (i ? 1 : 0); k <= n; k++) D.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]);
    }
    // split where outside the world or under the restored pond (non-bridge). Low valley ground (the Forge / Taunton river towns sit at 4-9 m) is NOT water,
    // so roads there stay continuous (an old 'gh > 9' test cut them into dashes)
    let cur = [];
    const flush = () => { if (cur.length > 1) { // run each ribbon 1.2 m past its ends so joining streets overlap (no slit at junctions / bridge ends)
        const ext = (p, q) => { const dx = p[0] - q[0], dz = p[1] - q[1], l = Math.hypot(dx, dz) || 1; return [p[0] + dx / l * 1.2, p[1] + dz / l * 1.2]; };
        cur[0] = ext(cur[0], cur[1]); cur[cur.length - 1] = ext(cur[cur.length - 1], cur[cur.length - 2]); R.push({cls, nm, br, p: cur}); } cur = []; };
    for (const p of D) { if (Math.abs(p[0]) < E && Math.abs(p[1]) < E && (br || !underPond(p[0], p[1]))) cur.push(p); else flush(); }
    flush();
  }
  const BRG = (W3D.water && W3D.water.bridges) || [];
  for (const r of R) if (r.br && BRG.some(B => r.p.every(([x, z]) => Math.hypot(x - B.x, z - B.z) < B.len / 2 + 6))) r.br = false;
  junctions();
  // labels sit on the drawn ribbons only (not bridges), every ~200 m, one per street per 130 m
  const done = [];
  for (const r of R) {
    if (r.nm < 0 || r.br) continue; const p = r.p; let len = 0; for (let i = 1; i < p.length; i++) len += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
    if (len < 24) continue;
    const want = [len / 2]; for (let s = len / 2 - 200; s > 20; s -= 200) want.push(s); for (let s = len / 2 + 200; s < len - 20; s += 200) want.push(s);
    for (const s0 of want) {
      let s = s0, i = 1; for (; i < p.length; i++) { const d = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); if (s <= d) break; s -= d; }
      if (i >= p.length) continue; const a = p[i - 1], b = p[i], d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, x = a[0] + (b[0] - a[0]) * s / d, z = a[1] + (b[1] - a[1]) * s / d;
      if (done.some(l => l[0] === r.nm && Math.abs(l[1] - x) < 130 && Math.abs(l[2] - z) < 130 && Math.hypot(l[1] - x, l[2] - z) < 130)) continue;
      done.push([r.nm, x, z]);
    }
  }
  LAB = done;
}
/* T junctions (clip 21, Gardiner St / Cobb St): the through road's edge line ran straight across the side road's mouth and the side road's
   lines poked into the through road. Where a ribbon ends on another ribbon, the through road gets extra vertices either side of the mouth
   and those vertices (and the side road's last metres inside the through road) use the line-free half of the road texture. */
function junctions() {
  const len = p => { const L = [0]; for (let i = 1; i < p.length; i++) L.push(L[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1])); return L; };
  for (const r of R) { r.L = len(r.p); r.j = r.p.map(() => 0); r.cut = []; }
  const near = (r, x, z) => { let best = [1e9, 0]; const p = r.p;
    for (let i = 0; i < p.length - 1; i++) { const ax = p[i][0], az = p[i][1], dx = p[i + 1][0] - ax, dz = p[i + 1][1] - az, l2 = dx * dx + dz * dz || 1; let t = ((x - ax) * dx + (z - az) * dz) / l2; t = t < 0 ? 0 : t > 1 ? 1 : t;
      const d = Math.hypot(ax + dx * t - x, az + dz * t - z); if (d < best[0]) best = [d, r.L[i] + t * Math.sqrt(l2)]; }
    return best; };
  const CELL = 80, grid = new Map(), key = (x, z) => Math.floor(x / CELL) * 100003 + Math.floor(z / CELL);
  R.forEach((r, i) => { const seen = new Set(); for (const [x, z] of r.p) for (const k of [key(x, z)]) if (!seen.has(k)) { seen.add(k); (grid.get(k) || grid.set(k, []).get(k)).push(i); } });
  const sideCuts = [];
  R.forEach((s, si) => { if (s.br) return; const ws = RW[s.cls] / 2;
    for (const end of [0, 1]) { const e = end ? s.p[s.p.length - 1] : s.p[0];
      const cand = new Set(); for (let ox = -1; ox <= 1; ox++) for (let oz = -1; oz <= 1; oz++) for (const k of grid.get(key(e[0] + ox * CELL, e[1] + oz * CELL)) || []) cand.add(k);
      for (const ti of cand) { if (ti === si) continue; const t = R[ti]; if (t.br) continue; const wt = RW[t.cls] / 2, [d, sj] = near(t, e[0], e[1]), Lt = t.L[t.L.length - 1];
        if (d > wt + 1.0 || sj < wt + 3 || sj > Lt - wt - 3) continue;   // not on the through road, or an end-to-end joint
        t.cut.push([sj, ws + 1.2]); sideCuts.push([si, end, wt + 0.4]); } } });
  const insert = (r, sv) => { const L = r.L; if (!(sv > 0.05)) return; let i = 1; while (i < L.length && L[i] < sv) i++; if (i >= L.length || L[i] - L[i - 1] < 1e-6) return;
    if (Math.abs(L[i] - sv) < 0.05 || Math.abs(L[i - 1] - sv) < 0.05) return; const t = (sv - L[i - 1]) / (L[i] - L[i - 1]), a = r.p[i - 1], b = r.p[i];
    r.p.splice(i, 0, [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); L.splice(i, 0, sv); r.j.splice(i, 0, 0); };
  for (const r of R) { for (const [sj, he] of r.cut) for (const sv of [sj - he - 0.4, sj - he, sj, sj + he, sj + he + 0.4]) insert(r, sv);
    for (let i = 0; i < r.p.length; i++) if (r.cut.some(([sj, he]) => Math.abs(r.L[i] - sj) <= he + 0.01)) r.j[i] = 1; }
  for (const [si, end, dd] of sideCuts) { const r = R[si], Lr = r.L[r.L.length - 1], s0 = end ? Lr - dd : dd, s1 = end ? Lr - dd - 0.3 : dd + 0.3;
    insert(r, s0); insert(r, s1); for (let i = 0; i < r.p.length; i++) if (end ? r.L[i] >= s0 - 0.01 : r.L[i] <= s0 + 0.01) r.j[i] = 1; }
  W3D.roadJunctions = R.reduce((n, r) => n + r.cut.length, 0);
}
function buildRoads() {
  const G = []; for (let l = 0; l < 8; l++) G.push({pos: [], uv: [], idx: []});
  const BR = {pos: [], idx: []};   // bridge slab + rails (plain grey)
  const WJ = W3D.water || {}, CVL = (WJ.culverts || (WJ.culvert ? [WJ.culvert] : [])).filter(c => !c.br), BRG = WJ.bridges || [];
  R.forEach((r, ri) => {
    const lvl = Math.min(3, r.cls) * 2 + (ri & 1), g = G[lvl], pos = g.pos, uv = g.uv, idx = g.idx, LIFT = 0.15 + 0.03 * lvl, w = RW[r.cls] / 2, P = r.p;
    let y0 = 0, y1 = 0, tot = 0;
    // bridge deck ends meet the approach roads at exactly their height (same 'max over +-5 m' rule), then rise in a gentle arch - no 0.7 m step
    const endH = (i, j) => { const x = P[i][0], z = P[i][1], dx = P[j][0] - x, dz = P[j][1] - z, l = Math.hypot(dx, dz) || 1; return Math.max(gh(x, z), gh(x - dx / l * 5, z - dz / l * 5), gh(x + dx / l * 5, z + dz / l * 5), 0); };
    if (r.br) { y0 = endH(0, 1); y1 = endH(P.length - 1, P.length - 2); for (let k = 1; k < P.length; k++) tot += Math.hypot(P[k][0] - P[k - 1][0], P[k][1] - P[k - 1][1]); }
    let prev = -1, run = 0, bprev = -1;
    for (let k = 0; k < P.length; k++) {
      const a = P[Math.max(0, k - 1)], b = P[Math.min(P.length - 1, k + 1)];
      let dx = b[0] - a[0], dz = b[1] - a[1]; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
      const px = -dz * w, pz = dx * w, x = P[k][0], z = P[k][1];
      if (k) run += Math.hypot(x - P[k - 1][0], z - P[k - 1][1]);
      let yl, yr;
      if (r.br) { const t = tot ? run / tot : 0, y = y0 + (y1 - y0) * t + Math.min(1.2, tot * 0.02) * Math.sin(Math.PI * t) + LIFT; yl = yr = Math.max(y, gh(x, z) + 0.35 + LIFT); }
      else { // never below the ground anywhere across the carriageway or 5 m either way along it (a 10 m terrain grid otherwise pokes through and the road looks broken)
        const hs = (ox, oz) => Math.max(gh(x + ox, z + oz), gh(x + ox + dx * 5, z + oz + dz * 5), gh(x + ox - dx * 5, z + oz - dz * 5));
        const hc = hs(0, 0); yl = Math.max(hs(px, pz), hc - 0.3) + LIFT; yr = Math.max(hs(-px, -pz), hc - 0.3) + LIFT;
        // over a culvert the road keeps the embankment height, easing in/out over 18-32 m (no kink)
        for (const C of CVL) { const d = Math.hypot(x - C.x, z - C.z); if (d < 32) { const t = d < 18 ? 1 : 1 - (d - 18) / 14, w = t * t * (3 - 2 * t), Y = (C.road || 17.3) + LIFT; yl = Math.max(yl, yl + (Y - yl) * w); yr = Math.max(yr, yr + (Y - yr) * w); } }
        // Gardiner St bridge: the road keeps one level across the deck and eases into the approaches (water runs underneath)
        for (const B of BRG) { const ax = x - B.x, az = z - B.z, al = Math.abs(ax * B.tx + az * B.tz), ac = Math.abs(-ax * B.tz + az * B.tx), E = B.ease || 20;
          if (ac < B.w && al < B.len / 2 + E) { const t = al <= B.len / 2 ? 1 : 1 - (al - B.len / 2) / E, w = t * t * (3 - 2 * t), Y = B.road + LIFT; yl = Math.max(yl, yl + (Y - yl) * w); yr = Math.max(yr, yr + (Y - yr) * w); if (t === 1) { yl = yr = Y; } } } }
      const i0 = pos.length / 3, jv = r.j && r.j[k] ? 0.75 : 0.25; pos.push(x + px, yl, z + pz, x - px, yr, z - pz); uv.push(0, jv, 1, jv);
      if (prev >= 0) idx.push(prev, prev + 1, i0, i0, prev + 1, i0 + 1);
      prev = i0;
      if (r.br) {
        const y = yl, bi = BR.pos.length / 3, q = w + 0.5;
        BR.pos.push(x + px * q / w, y - 0.15, z + pz * q / w, x - px * q / w, y - 0.15, z - pz * q / w, x + px * q / w, y - 1.0, z + pz * q / w, x - px * q / w, y - 1.0, z - pz * q / w,
          x + px * q / w, y + 0.9, z + pz * q / w, x - px * q / w, y + 0.9, z - pz * q / w);
        if (bprev >= 0) { const p0 = bprev, p1 = bi; // slab bottom + sides + two rails
          BR.idx.push(p0 + 2, p0 + 3, p1 + 2, p1 + 2, p0 + 3, p1 + 3, p0, p0 + 2, p1, p1, p0 + 2, p1 + 2, p0 + 1, p0 + 3, p1 + 1, p1 + 1, p0 + 3, p1 + 3,
            p0, p0 + 4, p1, p1, p0 + 4, p1 + 4, p0 + 1, p0 + 5, p1 + 1, p1 + 1, p0 + 5, p1 + 5); }
        bprev = bi;
      }
    }
  });
  const tex = roadTex(); let tris = 0;
  G.forEach((g, lvl) => {
    if (!g.idx.length) return;
    const geo2 = new THREE.BufferGeometry();
    geo2.setAttribute('position', new THREE.Float32BufferAttribute(g.pos, 3)); geo2.setAttribute('uv', new THREE.Float32BufferAttribute(g.uv, 2)); geo2.setIndex(g.idx);
    const m = new THREE.MeshBasicMaterial({map: tex, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3 - lvl * 2, polygonOffsetUnits: -3 - lvl * 2});
    const mesh = new THREE.Mesh(geo2, m); mesh.name = 'road-ribbons'; mesh.frustumCulled = false; mesh.renderOrder = 1 + lvl * 0.01; group.add(mesh); tris += g.idx.length / 3;
  });
  if (BR.idx.length) {
    const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(BR.pos, 3)); bg.setIndex(BR.idx);
    const bm = new THREE.Mesh(bg, new THREE.MeshBasicMaterial({color: 0x8d8f91, side: THREE.DoubleSide})); bm.name = 'bridge-decks'; bm.frustumCulled = false; group.add(bm); tris += BR.idx.length / 3;
  }
  return tris;
}
// remove trees/bushes standing on a road ribbon (+ half width + 1.5 m), and trees standing in water
let WM = null; const WR = 6144, WN = 1536;
function buildWaterMask() {
  const c = document.createElement('canvas'); c.width = c.height = WN; const g = c.getContext('2d'); g.fillStyle = '#fff';
  for (const poly of data.water || []) {
    g.beginPath();
    for (const r of poly) for (let i = 0; i < r.length; i += 2) { const [x, z] = toWorld(r[i] / 1e5, r[i + 1] / 1e5), u = (x + WR) / (2 * WR) * WN, v = (z + WR) / (2 * WR) * WN; i ? g.lineTo(u, v) : g.moveTo(u, v); if (i === r.length - 2) g.closePath(); }
    g.fill('evenodd');
  }
  const d = g.getImageData(0, 0, WN, WN).data; WM = new Uint8Array(WN * WN); for (let i = 0; i < WM.length; i++) WM[i] = d[i * 4] > 127 ? 1 : 0;
}
function inWater(x, z) {
  { const P = W3D.water && W3D.water.pond; if (P && x > P.x0 && x < P.x1 && z > P.z0 && z < P.z1 && gh(x, z) < 16.3) return true; } // restored-pond bed (low valley ground elsewhere keeps its trees)
  if (!WM || Math.abs(x) >= WR || Math.abs(z) >= WR) return false;
  return WM[Math.floor((z + WR) / (2 * WR) * WN) * WN + Math.floor((x + WR) / (2 * WR) * WN)] === 1;
}
function cullTreesOnRoads() {
  buildWaterMask();
  const CELL = 64, grid = new Map();
  const add = (cx, cz, seg) => { const k = cx * 100003 + cz; let a = grid.get(k); if (!a) grid.set(k, a = []); a.push(seg); };
  for (const r of R) {
    const hw = RW[r.cls] / 2 + (r.br ? 3 : 1.5), p = r.p;
    for (let i = 0; i < p.length - 1; i++) {
      const seg = [p[i][0], p[i][1], p[i + 1][0], p[i + 1][1], hw];
      for (let cx = Math.floor((Math.min(seg[0], seg[2]) - hw) / CELL); cx <= Math.floor((Math.max(seg[0], seg[2]) + hw) / CELL); cx++)
        for (let cz = Math.floor((Math.min(seg[1], seg[3]) - hw) / CELL); cz <= Math.floor((Math.max(seg[1], seg[3]) + hw) / CELL); cz++) add(cx, cz, seg);
    }
  }
  const onRoad = (x, z) => {
    const a = grid.get(Math.floor(x / CELL) * 100003 + Math.floor(z / CELL)); if (!a) return false;
    for (const s of a) {
      const dx = s[2] - s[0], dz = s[3] - s[1], l2 = dx * dx + dz * dz || 1; let t = ((x - s[0]) * dx + (z - s[1]) * dz) / l2; t = t < 0 ? 0 : t > 1 ? 1 : t;
      const ex = s[0] + dx * t - x, ez = s[1] + dz * t - z; if (ex * ex + ez * ez < s[4] * s[4]) return true;
    }
    return false;
  };
  let removed = 0;
  for (const im of W3D.root.children) {
    if (!im.isInstancedMesh || im.count < 200) continue;
    const e = im.instanceMatrix.array; let ch = false;
    for (let i = 0; i < im.count; i++) {
      const o = i * 16, x = e[o + 12], y = e[o + 13], z = e[o + 14];
      if (e[o] === 0 && e[o + 5] === 0) continue;
      if (Math.abs(y - gh(x, z)) > 12) continue;
      if (onRoad(x, z) || inWater(x, z)) { e[o] = e[o + 1] = e[o + 2] = e[o + 4] = e[o + 5] = e[o + 6] = e[o + 8] = e[o + 9] = e[o + 10] = 0; ch = true; removed++; }
    }
    if (ch) im.instanceMatrix.needsUpdate = true;
  }
  return removed;
}
let poi = null;
function init() {
  group = new THREE.Group(); group.name = 'street-labels'; W3D.root.add(group);
  project();
  const geoL = new THREE.PlaneGeometry(1, 96 / 512);
  for (let i = 0; i < MAXL; i++) {
    const m = new THREE.Mesh(geoL, new THREE.MeshBasicMaterial({transparent: true, toneMapped: false, fog: false, depthWrite: false, side: THREE.DoubleSide}));
    m.visible = false; m.renderOrder = 5; group.add(m); pool.push(m);
  }
  let c0 = null;
  for (const c of data.corners) { const [cg, cx, cz] = buildCorner(c); group.add(cg); if (!c0) c0 = [cx, cz]; }
  if (c0) {
    const cc = document.createElement('canvas'); cc.width = 512; cc.height = 64; const g = cc.getContext('2d');
    g.fillStyle = '#222'; g.fillRect(0, 0, 512, 64); g.fillStyle = '#ddd'; g.font = '26px Arial'; g.textAlign = 'center'; g.fillText('Street names: (c) OpenStreetMap contributors', 256, 40);
    const ct = new THREE.CanvasTexture(cc); ct.colorSpace = THREE.SRGBColorSpace;
    const cp = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.175), new THREE.MeshBasicMaterial({map: ct, side: THREE.DoubleSide, toneMapped: false})); cp.position.set(c0[0] + 5, gh(c0[0] + 5, c0[1]) + 1.6, c0[1] + 0.08); group.add(cp);
  }
  W3D.roadTris = buildRoads(); W3D.treesCulledOnRoads = cullTreesOnRoads();
  for (const p of data.pois || []) {
    const [px, pz] = toWorld(p.ll[0], p.ll[1]), y = gh(px, pz);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 5.2, 8), new THREE.MeshBasicMaterial({color: 0x555a60})); pole.position.set(px, y + 2.6, pz); group.add(pole);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(6, 6 * 192 / 1024), new THREE.MeshBasicMaterial({map: signTex(p.name, 1024, 192, '#12306b'), toneMapped: false, side: THREE.DoubleSide}));
    m.position.set(px, y + 5.2, pz); poi = m; group.add(m);
    const m2 = new THREE.Mesh(new THREE.PlaneGeometry(4, 4 * 96 / 512), new THREE.MeshBasicMaterial({map: signTex(p.sub, 512, 96, '#12306b'), toneMapped: false, side: THREE.DoubleSide}));
    m2.position.set(px, y + 4.1, pz); m.userData.sub = m2; group.add(m2);
  }
  ready = true;
}
function update(cam) {
  const p = cam.getWorldPosition(new THREE.Vector3()), near = [];
  for (const l of LAB) { const dx = l[1] - p.x, dz = l[2] - p.z, d2 = dx * dx + dz * dz; if (d2 < NEAR * NEAR) near.push([d2, l]); }
  near.sort((a, b) => a[0] - b[0]);
  for (let i = 0; i < MAXL; i++) {
    const m = pool[i];
    if (i >= near.length) { m.visible = false; m.userData.key = null; continue; }
    const [d2, l] = near[i], name = data.names[l[0]], d = Math.sqrt(d2);
    const w = Math.min(26, Math.max(7, 4 + d * 0.06)), y = gh(l[1], l[2]) + 2.6 + d * 0.01;
    m.position.set(l[1], y, l[2]); m.scale.set(w, w, 1);
    if (m.userData.key !== name) { m.material.map = tex(name); m.material.needsUpdate = true; m.userData.key = name; }
    m.visible = true;
  }
  if (texCache.size > 70) { const used = new Set(pool.filter(m => m.visible).map(m => m.userData.key)); for (const [k, t] of texCache) { if (texCache.size <= 50) break; if (!used.has(k)) { t.dispose(); texCache.delete(k); } } }
}
function face(cam) {
  const p = cam.getWorldPosition(new THREE.Vector3());
  if (poi) { poi.rotation.y = Math.atan2(p.x - poi.position.x, p.z - poi.position.z); poi.userData.sub.rotation.y = poi.rotation.y; }
  for (const m of pool) if (m.visible) m.rotation.y = Math.atan2(p.x - m.position.x, p.z - m.position.z);
}
AFRAME.registerSystem('w3d-streets', {
  tick(time, dt) {
    if (!window.W3D || !W3D.root || !window.W3D_READY) return;
    if (!data) { if (!loading) { loading = true;
      Promise.all([fetch('/vr/w3d/streets.json?v=8').then(r => r.json()), fetch('/vr/w3d/geo.json?v=1').then(r => r.json())])
        .then(([j, g]) => { geo = g; data = j; }).catch(e => console.warn('street labels unavailable', e)); } return; }
    const cam = this.el.camera; if (!cam) return;
    if (!ready) { try { init(); } catch (e) { console.warn('street labels failed', e); data = null; loading = true; } return; }
    group.visible = !!W3D.active;
    if (!W3D.active) return;
    acc += dt; if (acc > 400) { acc = 0; update(cam); }
    face(cam);
  }
});
})();
