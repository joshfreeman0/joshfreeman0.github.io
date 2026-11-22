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
const FB = {lat0: 41.928836, lon0: -71.074334, ox: -516, oz: -112}; // fallback frame until geo.json exists
function toWorld(lat, lon) {
  const f = geo && geo.toWorld ? geo : null; if (f) return f.toWorld(lat, lon);
  const kx = 111320 * Math.cos(FB.lat0 * Math.PI / 180); return [(lon - FB.lon0) * kx + FB.ox, -(lat - FB.lat0) * 110574 + FB.oz];
}
function gh(x, z) { return W3D.terrainH(x, z); }
const EXT = () => (geo && geo.extent) || 2040;
function roadTex() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 8; const g = c.getContext('2d');
  g.fillStyle = '#34373a'; g.fillRect(0, 0, 64, 8); g.fillStyle = '#d9d6c8'; g.fillRect(3, 0, 2, 8); g.fillRect(59, 0, 2, 8);
  g.fillStyle = '#3d4044'; g.fillRect(14, 0, 36, 8);
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
    // split where outside the world or deep underwater (non-bridge)
    let cur = [];
    const flush = () => { if (cur.length > 1) R.push({cls, nm, br, p: cur}); cur = []; };
    for (const p of D) { if (Math.abs(p[0]) < E && Math.abs(p[1]) < E && (br || gh(p[0], p[1]) > 9)) cur.push(p); else flush(); }
    flush();
  }
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
function buildRoads() {
  const G = []; for (let l = 0; l < 8; l++) G.push({pos: [], uv: [], idx: []});
  const BR = {pos: [], idx: []};   // bridge slab + rails (plain grey)
  R.forEach((r, ri) => {
    const lvl = Math.min(3, r.cls) * 2 + (ri & 1), g = G[lvl], pos = g.pos, uv = g.uv, idx = g.idx, LIFT = 0.25 + 0.035 * lvl, w = RW[r.cls] / 2, P = r.p;
    let y0 = 0, y1 = 0, tot = 0;
    if (r.br) { y0 = gh(P[0][0], P[0][1]); y1 = gh(P[P.length - 1][0], P[P.length - 1][1]); for (let k = 1; k < P.length; k++) tot += Math.hypot(P[k][0] - P[k - 1][0], P[k][1] - P[k - 1][1]); }
    let prev = -1, run = 0, bprev = -1;
    for (let k = 0; k < P.length; k++) {
      const a = P[Math.max(0, k - 1)], b = P[Math.min(P.length - 1, k + 1)];
      let dx = b[0] - a[0], dz = b[1] - a[1]; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
      const px = -dz * w, pz = dx * w, x = P[k][0], z = P[k][1];
      if (k) run += Math.hypot(x - P[k - 1][0], z - P[k - 1][1]);
      let yl, yr;
      if (r.br) { const y = Math.max(y0 + (y1 - y0) * (tot ? run / tot : 0), 0) + 0.7 + LIFT; yl = yr = y; }
      else { yl = gh(x + px, z + pz) + LIFT; yr = gh(x - px, z - pz) + LIFT; }
      const i0 = pos.length / 3; pos.push(x + px, yl, z + pz, x - px, yr, z - pz); uv.push(0, 0, 1, 0);
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
function cullTreesOnRoads() {
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
      if (onRoad(x, z)) { e[o] = e[o + 1] = e[o + 2] = e[o + 4] = e[o + 5] = e[o + 6] = e[o + 8] = e[o + 9] = e[o + 10] = 0; ch = true; removed++; }
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
      Promise.all([fetch('/vr/w3d/streets.json?v=5').then(r => r.json()), fetch('/vr/w3d/geo.json?v=1').then(r => r.ok ? r.json() : null).catch(() => null)])
        .then(([j, g]) => { geo = g && g.lat0 !== undefined ? makeGeo(g) : null; data = j; }).catch(e => console.warn('street labels unavailable', e)); } return; }
    const cam = this.el.camera; if (!cam) return;
    if (!ready) { try { init(); } catch (e) { console.warn('street labels failed', e); data = null; loading = true; } return; }
    group.visible = !!W3D.active;
    if (!W3D.active) return;
    acc += dt; if (acc > 400) { acc = 0; update(cam); }
    face(cam);
  }
});
function makeGeo(g) { return null; } // set when geo.json format is known
})();
