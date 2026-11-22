/* Street-name labels for the Fowling Pond world. Self-contained: loads streets.json, floats green street-sign labels
   above the real roads (within ~420 m of the viewer) and puts a two-blade corner sign at King Philip St / Thrasher St.
   Street names: (c) OpenStreetMap contributors (ODbL). Thrasher St follows the road the world itself draws (Plan v6 relocation). */
(function () {
const NEAR = 420, MAXL = 36;
let data = null, group = null, pool = [], texCache = new Map(), ready = false, acc = 0, loading = false, cornerGroup = null;

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
function gh(x, z) { return window.W3D && W3D.terrainH ? Math.max(W3D.terrainH(x, z), W3D.groundAt(x, z, 0) > 17 ? W3D.groundAt(x, z, 0) : 0) : 0; }

function buildCorner(c) {
  const g = new THREE.Group(), y = gh(c.x + 5, c.z), poleM = new THREE.MeshBasicMaterial({color: 0x555a60});
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 3.8, 8), poleM); pole.position.y = 1.9; g.add(pole);
  const mk = (name, yy, ry) => {
    const t = signTex(name, 1024, 192), m = new THREE.MeshBasicMaterial({map: t, side: THREE.DoubleSide, toneMapped: false, fog: false});
    const p = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 0.52), m); p.position.set(0, yy, 0); p.rotation.y = ry;
    const holder = new THREE.Group(); holder.rotation.y = ry; p.rotation.y = 0; p.position.set(1.45, yy, 0); holder.add(p); return holder;
  };
  g.add(mk(c.a, 3.35, 0.35)); g.add(mk(c.b, 2.75, 0.35 + Math.PI / 2));
  g.position.set(c.x + 5, y, c.z); g.userData.c = c; return g;
}

const RW = [5, 6.5, 8, 10]; // width by road class (service, residential, collector, arterial)
function roadTex() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 8; const g = c.getContext('2d');
  g.fillStyle = '#34373a'; g.fillRect(0, 0, 64, 8); g.fillStyle = '#d9d6c8'; g.fillRect(3, 0, 2, 8); g.fillRect(59, 0, 2, 8);
  g.fillStyle = '#3d4044'; g.fillRect(14, 0, 36, 8);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function buildRoads() {
  const pos = [], uv = [], idx = [], STEP = 9, LIFT = 0.3, lo = 9;
  for (const r of data.roads) {
    const w = RW[r[0]] / 2, pts = r[2], P = [];
    for (let i = 0; i < pts.length - 2; i += 2) {
      const ax = pts[i], az = pts[i + 1], bx = pts[i + 2], bz = pts[i + 3], L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(L / STEP));
      for (let k = (i ? 1 : 0); k <= n; k++) P.push([ax + (bx - ax) * k / n, az + (bz - az) * k / n]);
    }
    let run = 0, prev = -1;
    for (let k = 0; k < P.length; k++) {
      const a = P[Math.max(0, k - 1)], b = P[Math.min(P.length - 1, k + 1)];
      let dx = b[0] - a[0], dz = b[1] - a[1]; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
      const px = -dz * w, pz = dx * w, x = P[k][0], z = P[k][1];
      if (W3D.terrainH(x, z) < lo) { prev = -1; continue; }
      const i0 = pos.length / 3;
      pos.push(x + px, W3D.terrainH(x + px, z + pz) + LIFT, z + pz, x - px, W3D.terrainH(x - px, z - pz) + LIFT, z - pz);
      uv.push(0, 0, 1, 0);
      if (prev >= 0) idx.push(prev, prev + 1, i0, i0, prev + 1, i0 + 1);
      prev = i0;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  const m = new THREE.MeshBasicMaterial({map: roadTex(), side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4});
  const mesh = new THREE.Mesh(g, m); mesh.name = 'road-ribbons'; mesh.frustumCulled = false; mesh.renderOrder = 1; group.add(mesh);
  return idx.length / 3;
}
let poi = null;
function init(scene3) {
  group = new THREE.Group(); group.name = 'street-labels'; W3D.root.add(group);
  const geo = new THREE.PlaneGeometry(1, 96 / 512);
  for (let i = 0; i < MAXL; i++) {
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({transparent: true, toneMapped: false, fog: false, depthWrite: false, side: THREE.DoubleSide}));
    m.visible = false; m.renderOrder = 5; m.frustumCulled = true; group.add(m); pool.push(m);
  }
  for (const c of data.corners) { const cg = buildCorner(c); group.add(cg); cg.userData.corner = true; }
  // credit plaque on the main corner post
  const c0 = data.corners[0], cc = document.createElement('canvas'); cc.width = 512; cc.height = 64; const g = cc.getContext('2d');
  g.fillStyle = '#222'; g.fillRect(0, 0, 512, 64); g.fillStyle = '#ddd'; g.font = '26px Arial'; g.textAlign = 'center'; g.fillText('Street names: (c) OpenStreetMap contributors', 256, 40);
  const ct = new THREE.CanvasTexture(cc); ct.colorSpace = THREE.SRGBColorSpace;
  const cp = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.175), new THREE.MeshBasicMaterial({map: ct, side: THREE.DoubleSide, toneMapped: false})); cp.position.set(c0.x + 5, gh(c0.x + 5, c0.z) + 1.6, c0.z + 0.08); group.add(cp);
  W3D.roadTris = buildRoads();
  for (const p of data.pois || []) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(12, 12 * 192 / 1024), new THREE.MeshBasicMaterial({map: signTex(p.name, 1024, 192, '#12306b'), transparent: true, toneMapped: false, fog: false, depthWrite: false, side: THREE.DoubleSide}));
    m.position.set(p.x, gh(p.x, p.z) + 7, p.z); m.renderOrder = 5; group.add(m); poi = m;
    const m2 = new THREE.Mesh(new THREE.PlaneGeometry(8, 8 * 96 / 512), new THREE.MeshBasicMaterial({map: signTex(p.sub, 512, 96, '#12306b'), transparent: true, toneMapped: false, fog: false, depthWrite: false, side: THREE.DoubleSide}));
    m2.position.set(p.x, gh(p.x, p.z) + 4.6, p.z); m2.renderOrder = 5; m.userData.sub = m2; group.add(m2);
  }
  ready = true;
}

function update(cam) {
  const p = cam.getWorldPosition(new THREE.Vector3());
  const near = [];
  for (const l of data.labels) { const dx = l[1] - p.x, dz = l[2] - p.z, d2 = dx * dx + dz * dz; if (d2 < NEAR * NEAR) near.push([d2, l]); }
  near.sort((a, b) => a[0] - b[0]);
  for (let i = 0; i < MAXL; i++) {
    const m = pool[i];
    if (i >= near.length) { m.visible = false; m.userData.key = null; continue; }
    const [d2, l] = near[i], name = data.streets[l[0]], d = Math.sqrt(d2);
    const w = Math.min(26, Math.max(8, 4 + d * 0.06)), y = gh(l[1], l[2]) + 3.2 + d * 0.012;
    m.userData.w = w; m.position.set(l[1], y, l[2]); m.scale.set(w, w, 1);
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
  init() { this.t = 0; },
  tick(time, dt) {
    if (!window.W3D || !W3D.root || !window.W3D_READY) return;
    if (!data) { if (!loading) { loading = true; fetch('/vr/w3d/streets.json?v=2').then(r => r.json()).then(j => { data = j; }).catch(e => console.warn('street labels unavailable', e)); } return; }
    const cam = this.el.camera; if (!cam) return;
    if (!ready) { try { init(this.el.object3D); } catch (e) { console.warn('street labels failed', e); data = null; loading = true; } return; }
    group.visible = !!W3D.active;
    if (!W3D.active) return;
    acc += dt; if (acc > 400) { acc = 0; update(cam); }
    face(cam);
  }
});
})();
