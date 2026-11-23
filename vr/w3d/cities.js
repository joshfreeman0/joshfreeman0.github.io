/* Saucer destination cities (item 20): one data-driven scene module per city in w3d/city/<id>.js, each far outside the 12 km
   fly limit so it can only be reached by saucer. A city is loaded only when the saucer is heading there with you aboard,
   only one is in memory at a time, and it is disposed when you leave (by saucer, by the menu, or by moving > 3 km away).
   Everything is procedural (canvas textures + primitives) or open data (OpenStreetMap, ODbL; EU-DEM elevation). */
(function () {
'use strict';
const W3D = window.W3D = window.W3D || {};
const LITE = !!window.JFVR_LITE;
const DEFS = {   // origin = landing pad centre (local 0,0,0); yaw = direction the saucer ramp faces (rad)
  london:    {name: 'London',        x: 60000,  z: 60000, yaw: Math.PI, v: 1},
  saintjohn: {name: 'Saint John NB', x: 80000,  z: 60000, yaw: 0, v: 1},
  boston:    {name: 'Boston',        x: 100000, z: 60000, yaw: 0, v: 1},
  bangkok:   {name: 'Bangkok',       x: 120000, z: 60000, yaw: 0, v: 1},
  hongkong:  {name: 'Hong Kong',     x: 140000, z: 60000, yaw: 0, v: 1}
};
W3D.cityModules = W3D.cityModules || {};
let cur = null;          // {id, grp, mod, ready, entered}
const loading = {};
function def(id) { const d = DEFS[id]; return d ? {pad: {x: d.x, y: 0, z: d.z, yaw: d.yaw}, name: d.name} : null; }
function script(id) { if (W3D.cityModules[id]) return Promise.resolve(); if (loading[id]) return loading[id];
  return (loading[id] = new Promise((res, rej) => { const s = document.createElement('script'); s.src = '/vr/w3d/city/' + id + '.js?v=' + DEFS[id].v; s.onload = () => res(); s.onerror = rej; document.head.appendChild(s); })); }
function dispose(o) { o.traverse(n => { if (n.geometry) n.geometry.dispose(); const ms = n.material ? (Array.isArray(n.material) ? n.material : [n.material]) : []; ms.forEach(m => { for (const k in m) if (m[k] && m[k].isTexture) m[k].dispose(); m.dispose(); }); }); }
function unload() {
  if (!cur) return; if (cur.entered) exitScene(); const s3 = document.querySelector('a-scene').object3D;
  if (cur.grp) { s3.remove(cur.grp); dispose(cur.grp); } W3D.cityH = null; W3D.cityBlocked = null; cur = null;
}
function load(id) {
  if (!DEFS[id]) return Promise.reject(new Error('no city ' + id));
  if (cur && cur.id === id) return cur.p;
  unload();
  const c = cur = {id, ready: false, entered: false};
  c.p = script(id).then(() => {
    if (cur !== c) return;
    const d = DEFS[id], grp = new THREE.Group(); grp.name = 'city-' + id; grp.position.set(d.x, 0, d.z);
    return Promise.resolve(W3D.cityModules[id](grp, Kit)).then(mod => {
      if (cur !== c) { dispose(grp); return; }
      c.grp = grp; c.mod = mod || {}; grp.visible = c.entered; document.querySelector('a-scene').object3D.add(grp);
      W3D.cityH = (x, z) => { const lx = x - d.x, lz = z - d.z; if (Math.abs(lx) > (c.mod.R || 600) || Math.abs(lz) > (c.mod.R || 600)) return null; return c.mod.ground ? c.mod.ground(lx, lz) : 0; };
      W3D.cityBlocked = c.mod.blocked ? (x, z, y) => c.mod.blocked(x - d.x, z - d.z, y) : null;
      c.ready = true; if (c.entered) enterScene();
    });
  }).catch(e => { console.warn('city load', id, e); });
  return c.p;
}
let saved = null;
const _cv = new THREE.Vector3();
function enterScene() {
  const s3 = document.querySelector('a-scene').object3D, m = cur.mod;
  if (!saved) saved = {fog: s3.fog, bg: s3.background, env: s3.environment, R: JFVR.flyRadius, Y: JFVR.flyMaxY}; s3.environment = null;
  if (W3D.root) W3D.root.visible = false;
  cur.fog = new THREE.Fog(m.fog ? m.fog[0] : 0xb9c2cc, m.fog ? m.fog[1] : 150, m.fog ? m.fog[2] : 900); cur.fog0 = [cur.fog.near, cur.fog.far];
  s3.fog = cur.fog; s3.background = new THREE.Color(m.sky || (m.fog ? m.fog[0] : 0xb9c2cc));
  JFVR.flyRadius = 1e7; JFVR.flyMaxY = 1e5; cur.grp.visible = true;
}
function exitScene() {
  const s3 = document.querySelector('a-scene').object3D;
  if (W3D.root) W3D.root.visible = true; if (saved) { s3.fog = W3D.fog || saved.fog; s3.background = W3D.bg || saved.bg; s3.environment = W3D.env || saved.env || null; JFVR.flyRadius = saved.R || 12000; JFVR.flyMaxY = saved.Y || 2500; saved = null; }
  if (cur) { cur.entered = false; if (cur.grp) cur.grp.visible = false; }
}
function enter(id) { if (!cur || cur.id !== id) load(id); cur.entered = true; if (cur.ready) enterScene(); }
function leave() { unload(); }
// moved far away from the city (menu teleport, etc.): dispose it
AFRAME.registerSystem('w3d-cities', { tick: function (t, dt) { if (cur && cur.entered && cur.ready && cur.mod.tick) cur.mod.tick(t, Math.min(dt || 16, 100));
  // London whiteout fix: the city fog (e.g. London 120..680 m) is a street-level haze. Seen from the saucer's descent (up to ~1.5 km up) or
  // flying, everything was further than the fog's far distance and the whole view was the flat fog colour. Open the fog with height.
  if (cur && cur.entered && cur.ready && cur.fog && cur.fog0) { const c = document.querySelector('[camera]'); if (c) { const p = c.object3D.getWorldPosition(_cv), d = DEFS[cur.id];
    const gy = cur.mod.ground ? (cur.mod.ground(p.x - d.x, p.z - d.z) || 0) : 0, alt = Math.max(0, p.y - gy - 25);
    cur.fog.near = cur.fog0[0] + alt * 1.2; cur.fog.far = cur.fog0[1] + alt * 3.2; } } if (!cur || !cur.entered || t - (this.lt || 0) < 1000) return; this.lt = t;
  const c = document.querySelector('[camera]'); if (!c) return; const p = c.object3D.getWorldPosition(new THREE.Vector3()), d = DEFS[cur.id];
  const dd = Math.hypot(p.x - d.x, p.z - d.z); if (dd < 2500) cur.near = true; else if (cur.near && dd > 3000 && !(W3D.saucer && W3D.saucer.seat() >= 0 && W3D.saucer.S.mode === 'fly')) unload(); } });

/* ---------- shared procedural kit ---------- */
const TS = LITE ? 256 : 512;
function ctex(w, h, draw, rep) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = LITE ? 2 : 8; if (rep) t.repeat.set(rep[0], rep[1]); return t; }
function rnd(seed) { let s = seed || 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
const tex = {
  brick(col, mortar) { return ctex(TS, TS, (g, w, h) => { const r = rnd(7); g.fillStyle = mortar || '#b7aa98'; g.fillRect(0, 0, w, h); const bh = h / 16, bw = w / 4;
    for (let j = 0; j < 16; j++) for (let i = -1; i < 5; i++) { const x = i * bw + (j % 2) * bw / 2, c = col || [150, 72, 52], k = 0.82 + r() * 0.3; g.fillStyle = 'rgb(' + (c[0] * k | 0) + ',' + (c[1] * k | 0) + ',' + (c[2] * k | 0) + ')'; g.fillRect(x + 1.5, j * bh + 1.5, bw - 3, bh - 3); } }); },   // one tile = 1 x 1 m
  render(col) { return ctex(TS, TS, (g, w, h) => { const r = rnd(3); g.fillStyle = col || '#e9e4d8'; g.fillRect(0, 0, w, h); for (let i = 0; i < 2600; i++) { g.fillStyle = 'rgba(0,0,0,' + r() * 0.05 + ')'; g.fillRect(r() * w, r() * h, 2, 2); } }); },
  tiles(col) { return ctex(TS, TS, (g, w, h) => { const r = rnd(5), c = col || [120, 62, 46]; for (let j = 0; j < 12; j++) for (let i = 0; i < 8; i++) { const k = 0.75 + r() * 0.35; g.fillStyle = 'rgb(' + (c[0] * k | 0) + ',' + (c[1] * k | 0) + ',' + (c[2] * k | 0) + ')'; g.fillRect(i * w / 8 + (j % 2) * w / 16, j * h / 12, w / 8 - 2, h / 12 - 2); } }); },
  asphalt() { return ctex(TS, TS, (g, w, h) => { const r = rnd(9); g.fillStyle = '#3d3f42'; g.fillRect(0, 0, w, h); for (let i = 0; i < 6000; i++) { const v = 40 + r() * 50 | 0; g.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')'; g.fillRect(r() * w, r() * h, 1.5, 1.5); } }); },
  paving(col) { return ctex(TS, TS, (g, w, h) => { const r = rnd(11); g.fillStyle = '#8f8b85'; g.fillRect(0, 0, w, h); const n = 4; for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const k = 0.9 + r() * 0.15, c = col || [196, 192, 184]; g.fillStyle = 'rgb(' + (c[0] * k | 0) + ',' + (c[1] * k | 0) + ',' + (c[2] * k | 0) + ')'; g.fillRect(i * w / n + 2, j * h / n + 2, w / n - 4, h / n - 4); } }); },
  grass() { return ctex(TS, TS, (g, w, h) => { const r = rnd(13); g.fillStyle = '#7f8f63'; g.fillRect(0, 0, w, h); for (let i = 0; i < 9000; i++) { const v = r(); g.fillStyle = 'rgba(' + (60 + v * 70 | 0) + ',' + (90 + v * 70 | 0) + ',' + (40 + v * 30 | 0) + ',0.5)'; g.fillRect(r() * w, r() * h, 1.5, 3); } }); },
  water(c1, c2) { return ctex(TS, TS, (g, w, h) => { const r = rnd(17); g.fillStyle = c1 || '#3b5566'; g.fillRect(0, 0, w, h); for (let i = 0; i < 500; i++) { g.strokeStyle = c2 || 'rgba(200,220,235,0.12)'; g.lineWidth = 1 + r() * 2; const x = r() * w, y = r() * h; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 10, y - 3, x + 20 + r() * 20, y); g.stroke(); } }); },
  windows(o) { o = o || {}; return ctex(256, 256, (g, w, h) => { const r = rnd(o.seed || 19); g.fillStyle = o.wall || '#59636e'; g.fillRect(0, 0, w, h); const nx = o.nx || 4, ny = o.ny || 4;
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const lit = r() < (o.lit || 0); g.fillStyle = lit ? (r() < 0.5 ? '#ffd89a' : '#fff2c8') : (o.glass || '#1f2c38'); g.fillRect(i * w / nx + w / nx * 0.15, j * h / ny + h / ny * 0.18, w / nx * 0.7, h / ny * 0.6); } }); }
};
// merge non-indexed copies of geometries (position, normal, uv, optional color)
function merge(list) {
  const geos = list.map(g => g.index ? g.toNonIndexed() : g); let n = 0; geos.forEach(g => n += g.attributes.position.count);
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2), hasC = geos.some(g => g.attributes.color), col = hasC ? new Float32Array(n * 3) : null; let o = 0;
  for (const g of geos) { const c = g.attributes.position.count; pos.set(g.attributes.position.array, o * 3); if (g.attributes.normal) nor.set(g.attributes.normal.array, o * 3); if (g.attributes.uv) uv.set(g.attributes.uv.array, o * 2); if (col) { if (g.attributes.color) col.set(g.attributes.color.array, o * 3); else col.fill(1, o * 3, (o + c) * 3); } o += c; }
  const m = new THREE.BufferGeometry(); m.setAttribute('position', new THREE.BufferAttribute(pos, 3)); m.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); m.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); if (col) m.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geos.forEach((g, i) => { if (g !== list[i]) g.dispose(); }); list.forEach(g => g.dispose()); return m;
}
function xform(g, x, y, z, ry, sx, sy, sz) { const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry || 0), new THREE.Vector3(sx || 1, sy || 1, sz || 1)); g.applyMatrix4(m); return g; }
function box(w, h, d, x, y, z, ry) { return xform(new THREE.BoxGeometry(w, h, d), x, y + h / 2, z, ry); }
// walls of a footprint polygon (local x,z pairs), u/v in metres; plus a flat roof
function prism(poly, y0, h, o) {
  o = o || {}; const pos = [], nor = [], uv = []; let u = 0; const P = ccw(poly);
  for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 0.01) continue; const nx = (b[1] - a[1]) / L, nz = -(b[0] - a[0]) / L;
    const q = [[a[0], y0, a[1], u, 0], [b[0], y0, b[1], u + L, 0], [b[0], y0 + h, b[1], u + L, h], [a[0], y0 + h, a[1], u, h]];
    for (const k of [0, 2, 1, 0, 3, 2]) { pos.push(q[k][0], q[k][1], q[k][2]); nor.push(nx, 0, nz); uv.push(q[k][3] / (o.su || 1), q[k][4] / (o.sv || 1)); } u += L; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); return g;
}
function cap(poly, y, su) { const P = ccw(poly), v2 = P.map(p => new THREE.Vector2(p[0], p[1])), tri = THREE.ShapeUtils.triangulateShape(v2, []), pos = [], nor = [], uv = [];
  for (const t of tri) for (const k of [t[0], t[2], t[1]]) { pos.push(P[k][0], y, P[k][1]); nor.push(0, 1, 0); uv.push(P[k][0] / (su || 4), P[k][1] / (su || 4)); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); return g; }
function area(P) { let a = 0; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; a += p[0] * q[1] - q[0] * p[1]; } return a / 2; }
function ccw(P) { return area(P) > 0 ? P : P.slice().reverse(); }   // positive shoelace in (x, z): outward wall normal = (dz, -dx)
// a strip along a polyline, draped by hy(x,z); returns geometry with uv.x along (m / su), uv.y across
function ribbon(pts, w, hy, o) { o = o || {}; const pos = [], uv = [], idx = []; let u = 0;
  for (let i = 0; i < pts.length; i++) { const p = pts[i], a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)]; let dx = b[0] - a[0], dz = b[1] - a[1]; const L = Math.hypot(dx, dz) || 1; dx /= L; dz /= L;
    if (i) u += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]); const off = o.off || 0;
    for (const s of [-1, 1]) { const x = p[0] - dz * (s * w / 2 + off), z = p[1] + dx * (s * w / 2 + off); pos.push(x, hy(x, z) + (o.y || 0.05), z); uv.push(u / (o.su || 4), s < 0 ? 0 : (o.sv || 1)); }
    if (i) { const k = i * 2; idx.push(k - 2, k - 1, k, k - 1, k + 1, k); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g.toNonIndexed(); }
function inPoly(x, z, P) { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
// grid index of polygons for walking collision
function polyIndex(polys, cell) { const C = cell || 20, M = new Map(); polys.forEach((p, i) => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const q of p.p) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); z0 = Math.min(z0, q[1]); z1 = Math.max(z1, q[1]); }
    for (let a = Math.floor(x0 / C); a <= Math.floor(x1 / C); a++) for (let b = Math.floor(z0 / C); b <= Math.floor(z1 / C); b++) { const k = a + ',' + b; if (!M.has(k)) M.set(k, []); M.get(k).push(i); } });
  return (x, z, y) => { const l = M.get(Math.floor(x / C) + ',' + Math.floor(z / C)); if (!l) return false; for (const i of l) { const p = polys[i]; if (y + 0.35 < p.top && y + 1.7 > p.y0 && inPoly(x, z, p.p)) return true; } return false; }; }
function trees(grp, list, o) {   // instanced low-poly trees: list of [x, y, z, scale]; o.leaf colours; no sprite cards
  o = o || {}; const n = list.length; if (!n) return;
  const trunkG = new THREE.CylinderGeometry(0.16, 0.26, 2.6, 6); trunkG.translate(0, 1.3, 0);
  const crownG = o.conifer ? new THREE.ConeGeometry(1.9, 5.5, 7) : new THREE.IcosahedronGeometry(2.4, LITE ? 0 : 1); crownG.translate(0, o.conifer ? 4.6 : 4.4, 0);
  if (o.palm) { crownG.dispose(); }
  const trunk = new THREE.InstancedMesh(trunkG, new THREE.MeshLambertMaterial({color: o.bark || 0x5a4634}), n);
  const crown = o.palm ? null : new THREE.InstancedMesh(crownG, new THREE.MeshLambertMaterial({color: 0xffffff, flatShading: true}), n);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), r = rnd(o.seed || 23), col = new THREE.Color(), leaf = o.leaf || [0x4d6b34, 0x3f5e2c, 0x5b7a3a, 0x6a7f3c];
  list.forEach((t, i) => { const s = t[3] || (0.8 + r() * 0.6); q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), r() * 6.28); m4.compose(new THREE.Vector3(t[0], t[1], t[2]), q, new THREE.Vector3(s, s * (0.9 + r() * 0.3), s)); trunk.setMatrixAt(i, m4);
    if (crown) { crown.setMatrixAt(i, m4); col.setHex(leaf[i % leaf.length]).multiplyScalar(0.85 + r() * 0.3); crown.setColorAt(i, col); } });
  grp.add(trunk); if (crown) grp.add(crown);
  if (o.palm) { const fr = new THREE.ConeGeometry(2.6, 1.2, 7, 1, true); fr.translate(0, 6.2, 0); trunkG.scale(0.7, 2.4, 0.7); const pm = new THREE.InstancedMesh(fr, new THREE.MeshLambertMaterial({color: 0x4f7d34, side: THREE.DoubleSide, flatShading: true}), n); list.forEach((t, i) => { trunk.getMatrixAt(i, m4); pm.setMatrixAt(i, m4); }); grp.add(pm); }
}
function lamb(o) { return new THREE.MeshLambertMaterial(o); }
function std(o) { return new THREE.MeshStandardMaterial(o); }
function water(grp, x, z, w, d, y, c1, c2) { const t = tex.water(c1, c2); t.repeat.set(w / 30, d / 30); const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d, Math.min(64, Math.ceil(w / 80)), Math.min(64, Math.ceil(d / 80))), std({map: t, color: 0xffffff, roughness: 0.45, metalness: 0.0, envMapIntensity: 0.3, transparent: true, opacity: 0.96}));
  m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); grp.add(m); m.userData.flow = t; return m; }
function pad(grp, y, r) {   // landing pad: concrete disc, yellow ring and 'H', edge lights
  const g = merge([xform(new THREE.CylinderGeometry(r, r + 0.3, 0.3, 32), 0, y + 0.15, 0)]);
  grp.add(new THREE.Mesh(g, lamb({color: 0x9a9892})));
  const ring = new THREE.Mesh(new THREE.RingGeometry(r - 2.2, r - 1.6, 48), new THREE.MeshBasicMaterial({color: 0xf2c230})); ring.rotation.x = -Math.PI / 2; ring.position.y = y + 0.31; grp.add(ring);
  const hm = new THREE.MeshBasicMaterial({color: 0xf4f4f0}); for (const [w, d, x] of [[0.7, 5, -1.6], [0.7, 5, 1.6], [3.2, 0.7, 0]]) { const b = new THREE.Mesh(new THREE.PlaneGeometry(w, d), hm); b.rotation.x = -Math.PI / 2; b.position.set(x, y + 0.32, 0); grp.add(b); }
  const lg = new THREE.SphereGeometry(0.16, 8, 6), li = new THREE.InstancedMesh(lg, new THREE.MeshBasicMaterial({color: 0x7ff3ff, toneMapped: false}), 16), m4 = new THREE.Matrix4();
  for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283; m4.makeTranslation(Math.sin(a) * (r - 0.4), y + 0.36, Math.cos(a) * (r - 0.4)); li.setMatrixAt(i, m4); } grp.add(li);
}
function lights(grp, o) { o = o || {}; const h = new THREE.HemisphereLight(o.sky || 0xdfe6ee, o.ground || 0x59604e, o.hi || 1.1); grp.add(h); const d = new THREE.DirectionalLight(o.sun || 0xffffff, o.si || 0.9); d.position.set(o.dx || 120, o.dy || 200, o.dz || 80); d.target.position.set(0, 0, 0); grp.add(d, d.target); return d; }
function label3d(grp, txt, x, y, z, ry, w, col, bg) { const t = ctex(1024, 160, (g, W, H) => { g.fillStyle = bg || 'rgba(0,0,0,0)'; g.fillRect(0, 0, W, H); g.fillStyle = col || '#ff3355'; g.font = 'bold 120px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, W / 2, H / 2 + 6); });
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 0.156), new THREE.MeshBasicMaterial({map: t, transparent: true, toneMapped: false, side: THREE.DoubleSide, fog: false})); m.position.set(x, y, z); m.rotation.y = ry || 0; grp.add(m); return m; }
// rectangle footprint centred at (cx, cz), w along the heading ang (radians, from +x toward +z)
function rect(cx, cz, w, d, ang) { const c = Math.cos(ang || 0), s = Math.sin(ang || 0), o = []; for (const [u, v] of [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]]) o.push([cx + u * c - v * s, cz + u * s + v * c]); return o; }
let WF = null; function winFrame() { if (!WF) { const sh = new THREE.Shape([new THREE.Vector2(-0.65, -0.05), new THREE.Vector2(0.65, -0.05), new THREE.Vector2(0.65, 1.55), new THREE.Vector2(-0.65, 1.55)]); sh.holes.push(new THREE.Path([new THREE.Vector2(-0.55, 0.05), new THREE.Vector2(-0.55, 1.45), new THREE.Vector2(0.55, 1.45), new THREE.Vector2(0.55, 0.05)])); WF = merge([new THREE.ExtrudeGeometry(sh, {depth: 0.12, bevelEnabled: false}), box(1.46, 0.07, 0.24, 0, -0.12, 0.12)]); } return WF.clone(); }
// modelled window units (frame, sill, glass) instanced: list of [x, y, z, faceAngle, widthScale, heightScale]; o.lit = fraction glowing
function wins(grp, list, o) { o = o || {}; if (!list.length) return; const fr = o.noFrame ? null : winFrame();
  const gl = new THREE.PlaneGeometry(1.12, 1.36); gl.translate(0, 0.7, 0.035); const r = rnd(o.seed || 31), lit = o.lit || 0, A = [], B = [];
  list.forEach(w => (r() < lit ? B : A).push(w));
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), v = new THREE.Vector3(), sc = new THREE.Vector3();
  const nearR = o.near || (LITE ? 110 : 170), FL = list.filter(w => Math.hypot(w[0], w[2]) < nearR);   // modelled frames near the pad only (LOD); glass everywhere
  if (fr && FL.length) { const fm = new THREE.InstancedMesh(fr, lamb({color: o.frame || 0xece9e2}), FL.length); 
  FL.forEach((w, i) => { q.setFromAxisAngle(up, w[3]); m4.compose(v.set(w[0], w[1], w[2]), q, sc.set(w[4] || 1, w[5] || 1, 1)); fm.setMatrixAt(i, m4); }); grp.add(fm); }
  for (const [L2, mat] of [[A, std({color: o.glass || 0x33414c, roughness: 0.12, metalness: 0.55})], [B, new THREE.MeshBasicMaterial({color: o.litCol || 0xffd99a})]]) { if (!L2.length) continue; const gm = new THREE.InstancedMesh(gl, mat, L2.length); L2.forEach((w, i) => { q.setFromAxisAngle(up, w[3]); m4.compose(v.set(w[0], w[1], w[2]), q, sc.set(w[4] || 1, w[5] || 1, 1)); gm.setMatrixAt(i, m4); }); grp.add(gm); } }
// window positions on a footprint's walls: every 'step' m, 'lv' floors of height fh from y0 + 1.1
function winList(P, y0, lv, o) { o = o || {}; const out = [], Q = ccw(P), step = o.step || 3.4, fh = o.fh || 3.2;
  for (let i = 0; i < Q.length; i++) { const a = Q[i], c = Q[(i + 1) % Q.length], l = Math.hypot(c[0] - a[0], c[1] - a[1]); if (l < 2.6) continue; const nx = (c[1] - a[1]) / l, nz = -(c[0] - a[0]) / l, k = Math.max(1, Math.floor(l / step)), ang = Math.atan2(nx, nz);
    for (let f = o.f0 || 0; f < lv; f++) for (let j = 0; j < k; j++) { const t = (j + 0.5) / k; out.push([a[0] + (c[0] - a[0]) * t + nx * 0.02, y0 + 1.1 + f * fh, a[1] + (c[1] - a[1]) * t + nz * 0.02, ang, o.sx || 1, o.sy || 1]); } } return out; }
// city blocks: list of {p, y0, h, m}; walls + flat roof merged per material key; returns collision polys
function blocks(grp, list, mats) { const g = {}, coll = []; list.forEach(b => { (g[b.m] = g[b.m] || []).push(prism(b.p, b.y0, b.h, {su: b.su || 1.2, sv: b.sv || 1.2})); (g[b.rm || b.m] = g[b.rm || b.m] || []).push(cap(b.p, b.y0 + b.h, 4)); coll.push({p: b.p, y0: b.y0, top: b.y0 + b.h + 2}); });
  for (const k in g) grp.add(new THREE.Mesh(merge(g[k]), mats[k])); return coll; }
// heightfield ground mesh over [-R, R]^2 with cell size s; col(x, z, y) -> [r, g, b] vertex colour (optional)
function heightMesh(grp, R, s, H, mat, col, R2) { const Rz = R2 || R, NX = Math.round(2 * R / s) + 1, NZ = Math.round(2 * Rz / s) + 1, p = new Float32Array(NX * NZ * 3), c = col ? new Float32Array(NX * NZ * 3) : null, uv = new Float32Array(NX * NZ * 2), ix = [];
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const x = -R + i * s, z = -Rz + j * s, k = j * NX + i, y = H(x, z); p.set([x, y, z], k * 3); uv.set([x / 8, z / 8], k * 2); if (c) { const cc = col(x, z, y); c[k * 3] = Math.pow(cc[0], 2.2); c[k * 3 + 1] = Math.pow(cc[1], 2.2); c[k * 3 + 2] = Math.pow(cc[2], 2.2); } if (i && j) ix.push(k - NX - 1, k - 1, k - NX, k - NX, k - 1, k); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); if (c) g.setAttribute('color', new THREE.BufferAttribute(c, 3)); g.setIndex(ix); g.computeVertexNormals(); const m = new THREE.Mesh(g, mat); grp.add(m); return m; }
// gradient sky dome (vertex colours, no texture): o = {top, horizon, below, sun: [x, y, z] direction, sunCol, glow}
function sky(grp, o) { const g = new THREE.SphereGeometry(20000, 32, 16), p = g.attributes.position, c = new Float32Array(p.count * 3), T = new THREE.Color(o.top), Hc = new THREE.Color(o.horizon), B = new THREE.Color(o.below || o.horizon), S = new THREE.Color(o.sunCol || 0xffffff), sd = o.sun ? new THREE.Vector3().fromArray(o.sun).normalize() : null, v = new THREE.Vector3(), col = new THREE.Color();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).normalize(); const e = v.y; if (e >= 0) col.copy(Hc).lerp(T, Math.pow(Math.min(1, e / 0.6), 0.7)); else col.copy(Hc).lerp(B, Math.min(1, -e * 6));
    if (sd) { const d = Math.max(0, v.dot(sd)); col.lerp(S, Math.min(1, Math.pow(d, 6) * (o.glow || 0.8))); } c[i * 3] = col.r; c[i * 3 + 1] = col.g; c[i * 3 + 2] = col.b; }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3)); const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false})); m.renderOrder = -10; m.frustumCulled = false; grp.add(m);
  m.onBeforeRender = (r, sc, cam) => { cam.getWorldPosition(v); m.position.copy(grp.worldToLocal(v)); m.updateMatrixWorld(); }; return m; }
const Kit = {LITE, sky, tex, ctex, rnd, merge, xform, box, prism, cap, area, ccw, ribbon, inPoly, polyIndex, trees, lamb, std, water, pad, lights, label3d, dispose, rect, wins, winList, blocks, heightMesh};
W3D.cities = {def, load, enter, leave, unload, isReady: id => !!(cur && cur.id === id && cur.ready), current: () => cur && cur.id, DEFS, Kit};
})();
