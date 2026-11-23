/* Fowling Pond Zoo (clip 21, first pass) on the flat hilltop in the King's Pond bend, plus Cobb Brook's footbridge.
   Gate with sign, gravel paths (gate -> plaza -> ring -> each enclosure, and down to the footbridge and Cobb St), five fenced
   enclosures (the zebras behind a water moat), shelters, benches and trees. Animals: low-poly glTF by Quaternius (CC0, via Poly Pizza),
   loaded only when you come within ~400 m; phones get one animal per enclosure. Layout data: water_t.json 'zoo'. */
(function () {
const W3D = window.W3D;
let built = false, loading = false, C = null; const mixers = [], LITE = () => !!W3D.lite;
const gh = (x, z) => W3D.terrainH(x, z);
const lam = c => new THREE.MeshLambertMaterial({color: c});
const ENC = [   // angle (deg, atan2(z, x) around the plaza), animal, count full / lite, target height (m), label
  {a: 150, file: 'llama', n: 3, h: 1.8, name: 'Llamas'},
  {a: 210, file: 'alpaca', n: 3, h: 1.5, name: 'Alpacas'},
  {a: 270, file: 'zebra', n: 3, h: 1.45, name: 'Zebras', moat: true},
  {a: 330, file: 'deer', n: 2, h: 1.35, name: 'Deer', extra: {file: 'stag', n: 1, h: 1.9}},
  {a: 30, file: 'horse', n: 2, h: 1.65, name: 'Wild horses'}
];
function ribbon(pts, w, mat, lift, parent) { const pos = [], idx = []; let k = 0;
  const P = []; for (let i = 0; i < pts.length - 1; i++) { const [ax, az] = pts[i], [bx, bz] = pts[i + 1], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 2)); for (let j = (i ? 1 : 0); j <= n; j++) P.push([ax + (bx - ax) * j / n, az + (bz - az) * j / n]); }
  for (let i = 0; i < P.length; i++) { const [x, z] = P[i], a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)]; let tx = b[0] - a[0], tz = b[1] - a[1]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
    for (const sd of [-1, 1]) { const qx = x - tz * w / 2 * sd, qz = z + tx * w / 2 * sd; pos.push(qx, gh(qx, qz) + lift, qz); } if (k) idx.push(2 * k - 2, 2 * k - 1, 2 * k, 2 * k - 1, 2 * k + 1, 2 * k); k++; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const nr = g.attributes.normal; for (let i = 0; i < nr.count; i++) if (nr.getY(i) < 0) nr.setXYZ(i, -nr.getX(i), -nr.getY(i), -nr.getZ(i));
  const m = new THREE.Mesh(g, mat); m.receiveShadow = true; parent.add(m); return m; }
function signTex(text, sub, w, h, bg) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, w, h); g.strokeStyle = '#d4a640'; g.lineWidth = h * 0.06; g.strokeRect(h * 0.05, h * 0.05, w - h * 0.1, h - h * 0.1);
  g.fillStyle = '#f6eed8'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold ' + (h * (sub ? 0.42 : 0.55)) + 'px Georgia, serif'; g.fillText(text, w / 2, h * (sub ? 0.4 : 0.52));
  if (sub) { g.font = (h * 0.2) + 'px Georgia, serif'; g.fillText(sub, w / 2, h * 0.76); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
function encPoly(e) { // rounded rectangle 30 x 22 m facing the plaza
  const a = e.a * Math.PI / 180, cx = C.x + Math.cos(a) * 50, cz = C.z + Math.sin(a) * 50, ux = -Math.cos(a), uz = -Math.sin(a), vx = -uz, vz = ux, L = 11, Wd = 15, r = 4, P = [];
  for (let i = 0; i < 4; i++) { const q0 = i * Math.PI / 2; const ccx = (i === 0 || i === 3 ? 1 : -1) * (L - r), ccy = (i < 2 ? 1 : -1) * (Wd - r);
    for (let k = 0; k <= 6; k++) { const q = q0 + k / 6 * Math.PI / 2, lx = ccx + Math.cos(q) * r, ly = ccy + Math.sin(q) * r; P.push([cx + ux * lx + vx * ly, cz + uz * lx + vz * ly]); } }
  P.push(P[0]); return {P, cx, cz, ux, uz, vx, vz, front: [cx + ux * (L + 1.5), cz + uz * (L + 1.5)]}; }
function build() {
  const Z = W3D.water.zoo; C = {x: Z.x, z: Z.z}; const root = new THREE.Group(); root.name = 'zoo'; W3D.root.add(root); W3D.zoo = {root, C, animals: 0};
  const gravel = new THREE.MeshLambertMaterial({color: 0xcbbd98}), stone = new THREE.MeshStandardMaterial({color: 0xcdb48a, roughness: 0.85}), wood = lam(0x7a5636), dark = lam(0x4a3a2a);
  // paths: gate -> plaza, plaza ring, spurs to each enclosure front, gate -> footbridge -> Cobb St
  const ring = []; for (let i = 0; i <= 72; i++) { const q = i / 72 * Math.PI * 2; ring.push([C.x + Math.cos(q) * 30, C.z + Math.sin(q) * 30]); }
  ribbon(ring, 4, gravel, 0.2, root);
  ribbon([[Z.gate[0], Z.gate[1]], [C.x + 4, C.z + 30]], 5, gravel, 0.21, root);
  const plaza = []; for (let i = 0; i <= 48; i++) { const q = i / 48 * Math.PI * 2; plaza.push([C.x + Math.cos(q) * 9, C.z + Math.sin(q) * 9]); }
  ribbon(plaza, 6, gravel, 0.2, root);
  for (let k = 0; k < 4; k++) { const q = k * Math.PI / 2 + Math.PI / 4; ribbon([[C.x + Math.cos(q) * 12, C.z + Math.sin(q) * 12], [C.x + Math.cos(q) * 28.5, C.z + Math.sin(q) * 28.5]], 3, gravel, 0.2, root); }
  ribbon(Z.path, 3, gravel, 0.22, root);
  // centre: a small obelisk on a round plinth, flower bed
  { const y = gh(C.x, C.z); const pl = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 5.8, 0.6, 32), stone); pl.position.set(C.x, y + 0.3, C.z); root.add(pl);
    const bed = new THREE.Mesh(new THREE.CylinderGeometry(5.0, 5.0, 0.2, 32), lam(0x5d7a32)); bed.position.set(C.x, y + 0.65, C.z); root.add(bed);
    const ob = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.7, 6, 4), stone); ob.rotation.y = Math.PI / 4; ob.position.set(C.x, y + 3.7, C.z); ob.castShadow = true; root.add(ob); }
  // gate: two battered stone pylons, a lintel and the sign (both faces)
  { const [gx, gz] = Z.gate, [nx, nz] = [C.x + 4 - gx, C.z + 30 - gz], l = Math.hypot(nx, nz), dx = nx / l, dz = nz / l, ry = Math.atan2(dx, dz), y = gh(gx, gz) - 0.3;
    const g = new THREE.Group(); g.position.set(gx, y, gz); g.rotation.y = ry; root.add(g);
    for (const s of [-1, 1]) { const pg = new THREE.BoxGeometry(2.6, 7, 2.6); const p = pg.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) > 0) { p.setX(i, p.getX(i) * 0.78); p.setZ(i, p.getZ(i) * 0.78); } pg.computeVertexNormals();
      const py = new THREE.Mesh(pg, stone); py.position.set(s * 4.4, 3.5, 0); py.castShadow = true; g.add(py);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.5, 2.6), stone); cap.position.set(s * 4.4, 7.2, 0); g.add(cap); }
    const lin = new THREE.Mesh(new THREE.BoxGeometry(11.4, 1.0, 1.6), stone); lin.position.set(0, 6.4, 0); lin.castShadow = true; g.add(lin);
    const st = signTex('FOWLING POND ZOO', 'Llamas \u00b7 Alpacas \u00b7 Zebras \u00b7 Deer \u00b7 Wild horses', 1024, 192, '#1f4f9a');
    for (const s of [-1, 1]) { const sg = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 1.575), new THREE.MeshBasicMaterial({map: st, toneMapped: false})); sg.position.set(0, 6.4, s * 0.82); if (s < 0) sg.rotation.y = Math.PI; g.add(sg); } }
  // enclosures: fence posts + two rails (instanced), shelter, rocks, sign, zebra moat
  const posts = [], rails = [], E = [];
  for (const e of ENC) { const p = encPoly(e); E.push(p); e.poly = p;
    for (let i = 0; i < p.P.length - 1; i++) { const [ax, az] = p.P[i], [bx, bz] = p.P[i + 1], L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(L / 3));
      for (let k = 0; k < n; k++) { const t0 = k / n, t1 = (k + 1) / n, x0 = ax + (bx - ax) * t0, z0 = az + (bz - az) * t0, x1 = ax + (bx - ax) * t1, z1 = az + (bz - az) * t1;
        const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2, fr = (mx - p.cx) * p.ux + (mz - p.cz) * p.uz;   // front side faces the plaza
        if (e.moat && fr > 9) continue; posts.push([x0, gh(x0, z0), z0]); rails.push([x0, z0, x1, z1]); } }
    if (e.moat) { // water moat + low stone wall along the front instead of the fence
      const fpts = []; for (let k = -12; k <= 12; k += 2) fpts.push([p.cx + p.ux * 12.5 + p.vx * k, p.cz + p.uz * 12.5 + p.vz * k]);
      ribbon(fpts, 3.2, new THREE.MeshStandardMaterial({color: 0x2b4f52, roughness: 0.12, envMap: W3D.env || null, envMapIntensity: 0.7}), 0.06, root);
      const wpts = []; for (let k = -13; k <= 13; k += 2) wpts.push([p.cx + p.ux * 14.6 + p.vx * k, p.cz + p.uz * 14.6 + p.vz * k]);
      for (let i = 0; i < wpts.length - 1; i++) { const [ax, az] = wpts[i], [bx, bz] = wpts[i + 1], w = new THREE.Mesh(new THREE.BoxGeometry(Math.hypot(bx - ax, bz - az) + 0.05, 0.9, 0.5), stone); w.position.set((ax + bx) / 2, gh((ax + bx) / 2, (az + bz) / 2) + 0.35, (az + bz) / 2); w.rotation.y = -Math.atan2(bz - az, bx - ax); root.add(w); } }
    // shelter at the back
    { const bx = p.cx - p.ux * 7, bz = p.cz - p.uz * 7, y = gh(bx, bz), g = new THREE.Group(); g.position.set(bx, y, bz); g.rotation.y = -Math.atan2(p.vz, p.vx); root.add(g);
      for (const [x, z] of [[-3, -1.8], [3, -1.8], [-3, 1.8], [3, 1.8]]) { const po = new THREE.Mesh(new THREE.BoxGeometry(0.25, 2.6, 0.25), wood); po.position.set(x, 1.3, z); g.add(po); }
      const back = new THREE.Mesh(new THREE.BoxGeometry(6.2, 2.4, 0.15), wood); back.position.set(0, 1.2, 1.8); g.add(back);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(7, 0.2, 4.6), dark); roof.position.set(0, 2.7, 0); roof.rotation.x = 0.12; roof.castShadow = true; g.add(roof);
      const tr = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.5, 0.7), wood); tr.position.set(4.2, 0.4, -0.4); g.add(tr); }
    // sign by the front path
    { const [fx, fz] = p.front, y = gh(fx, fz), po = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.2, 6), wood); po.position.set(fx + p.vx * 3, y + 1.1, fz + p.vz * 3); root.add(po);
      const sg = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.55), new THREE.MeshBasicMaterial({map: signTex(e.name, null, 512, 128, '#2f5d34'), toneMapped: false, side: THREE.DoubleSide}));
      sg.position.set(fx + p.vx * 3, y + 2.0, fz + p.vz * 3); sg.rotation.y = Math.atan2(p.ux, p.uz); root.add(sg);
      ribbon([[fx, fz], [C.x + Math.cos(e.a * Math.PI / 180) * 31, C.z + Math.sin(e.a * Math.PI / 180) * 31]], 3, gravel, 0.21, root); } }
  const im = (geo, mat, n) => { const m = new THREE.InstancedMesh(geo, mat, n); m.frustumCulled = false; m.castShadow = true; root.add(m); return m; };
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sv = new THREE.Vector3(), pv = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
  { const pg = new THREE.CylinderGeometry(0.09, 0.11, 1.6, 6); pg.translate(0, 0.8, 0); const pm = im(pg, wood, posts.length); posts.forEach(([x, y, z], i) => { m4.makeTranslation(x, y - 0.1, z); pm.setMatrixAt(i, m4); });
    const rg = new THREE.BoxGeometry(1, 0.1, 0.06), rm = im(rg, wood, rails.length * 2); let k = 0;
    for (const [x0, z0, x1, z1] of rails) for (const hy of [0.65, 1.3]) { const L = Math.hypot(x1 - x0, z1 - z0), y = (gh(x0, z0) + gh(x1, z1)) / 2 - 0.1 + hy; q.setFromAxisAngle(Y, -Math.atan2(z1 - z0, x1 - x0)); sv.set(L, 1, 1); pv.set((x0 + x1) / 2, y, (z0 + z1) / 2); m4.compose(pv, q, sv); rm.setMatrixAt(k++, m4); } }
  // benches round the ring, trees round the plaza and between the enclosures, rocks in the enclosures
  const benches = []; for (let k = 0; k < 10; k++) { const a = (k + 0.5) / 10 * Math.PI * 2; if (Math.abs(Math.sin(a) - 1) < 0.05) continue; benches.push([C.x + Math.cos(a) * 33, C.z + Math.sin(a) * 33, a]); }
  { const sg = new THREE.BoxGeometry(1.8, 0.08, 0.45); sg.translate(0, 0.45, 0); const bg = new THREE.BoxGeometry(1.8, 0.4, 0.06); bg.translate(0, 0.75, -0.22); const lg = new THREE.BoxGeometry(1.6, 0.45, 0.36); lg.translate(0, 0.22, 0);
    for (const [geo, mat] of [[sg, wood], [bg, wood], [lg, stone]]) { const m = im(geo, mat, benches.length); benches.forEach(([x, z, a], i) => { q.setFromAxisAngle(Y, -a - Math.PI / 2); pv.set(x, gh(x, z), z); sv.set(1, 1, 1); m4.compose(pv, q, sv); m.setMatrixAt(i, m4); }); } }
  const trees = []; let sd = 11; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 400 && trees.length < (LITE() ? 30 : 60); i++) { const a = rnd() * Math.PI * 2, r = 14 + rnd() * 56, x = C.x + Math.cos(a) * r, z = C.z + Math.sin(a) * r;
    if (Math.abs(r - 30) < 4.5 || E.some(p => Math.hypot(x - p.cx, z - p.cz) < 18) || Math.hypot(x - Z.gate[0], z - Z.gate[1]) < 9) continue;
    const ga = Math.atan2(Z.gate[1] - C.z, Z.gate[0] - C.x); if (r < 70 && Math.abs(Math.atan2(Math.sin(a - ga), Math.cos(a - ga))) < 0.12) continue; trees.push([x, gh(x, z), z, 0.8 + rnd() * 0.5]); }
  for (const p of E) for (let k = 0; k < 2; k++) { const x = p.cx - p.ux * (2 + k * 4) + p.vx * (k ? 9 : -9), z = p.cz - p.uz * (2 + k * 4) + p.vz * (k ? 9 : -9); trees.push([x, gh(x, z), z, 0.9]); }
  { const tg = new THREE.CylinderGeometry(0.25, 0.35, 4, 5, 1, true); tg.translate(0, 2, 0); const cg = new THREE.IcosahedronGeometry(3.4, 1); cg.scale(1, 0.9, 1); cg.translate(0, 6.2, 0);
    for (const [geo, mat] of [[tg, lam(0x5a4632)], [cg, new THREE.MeshLambertMaterial({color: 0x4c6a32, flatShading: true})]]) { const m = im(geo, mat, trees.length); trees.forEach((t, i) => { q.setFromAxisAngle(Y, i * 2.4); sv.set(t[3], t[3], t[3]); pv.set(t[0], t[1] - 0.3, t[2]); m4.compose(pv, q, sv); m.setMatrixAt(i, m4); }); } }
  { const rk = []; for (const p of E) for (let k = 0; k < 4; k++) { const x = p.cx + p.vx * (rnd() * 20 - 10) - p.ux * (rnd() * 8), z = p.cz + p.vz * (rnd() * 20 - 10) - p.uz * (rnd() * 8); rk.push([x, gh(x, z), z, 0.6 + rnd() * 0.9]); }
    const m = im(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshStandardMaterial({color: 0x8e8778, roughness: 0.95, flatShading: true}), rk.length);
    rk.forEach((t, i) => { q.setFromAxisAngle(Y, i * 1.7); sv.set(t[3] * 1.3, t[3] * 0.7, t[3]); pv.set(t[0], t[1], t[2]); m4.compose(pv, q, sv); m.setMatrixAt(i, m4); }); }
  // Cobb Brook footbridge: timber deck, gentle arch, two handrails
  { const B = Z.bridge, [ax, az] = B.a, [bx, bz] = B.b, L = Math.hypot(bx - ax, bz - az), ya = gh(ax, az), yb = gh(bx, bz), N = 10, g = new THREE.Group(); root.add(g);
    const deckG = new THREE.BoxGeometry(L / N + 0.05, 0.16, 2.2), dx = (bx - ax) / L, dz = (bz - az) / L, ry = -Math.atan2(dz, dx);
    for (let i = 0; i < N; i++) { const t = (i + 0.5) / N, x = ax + (bx - ax) * t, z = az + (bz - az) * t, y = ya + (yb - ya) * t + Math.sin(Math.PI * t) * 0.9 + 0.25;
      const d = new THREE.Mesh(deckG, wood); d.position.set(x, y, z); d.rotation.set(0, ry, 0); d.rotateZ(Math.cos(Math.PI * t) * 0.18); d.castShadow = true; g.add(d);
      for (const s of [-1, 1]) { const ox = -dz * 1.05 * s, oz = dx * 1.05 * s, po = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.0, 0.1), wood); po.position.set(x + ox, y + 0.55, z + oz); g.add(po);
        const hr = new THREE.Mesh(new THREE.BoxGeometry(L / N + 0.08, 0.08, 0.1), wood); hr.position.set(x + ox, y + 1.05, z + oz); hr.rotation.set(0, ry, 0); hr.rotateZ(Math.cos(Math.PI * t) * 0.18); g.add(hr); } }
    g.name = 'cobb-footbridge'; }
  built = true;
}
function loadAnimals() {
  if (loading || !THREE.GLTFLoader) return; loading = true; const loader = new THREE.GLTFLoader(), cache = {};
  const get = f => cache[f] || (cache[f] = fetch('/vr/w3d/zoo/' + f + '.glb?v=1').then(r => r.arrayBuffer()));
  const place = (e, file, n, h) => get(file).then(buf => { for (let i = 0; i < n; i++) loader.parse(buf.slice(0), '', gl => {
    // size from the skinned pose: these rigs (Quaternius AnimalArmature / Armature) keep ~3 cm bind-space meshes under a x100 armature, so
    // the bounding box has to come from the posed vertices after the bones' world matrices exist (the old un-updated, non-precise box
    // was ~400x too big, which shrank every animal to ~1 cm). Then ground the posed feet on the terrain.
    const o = gl.scene; o.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(o, true), sz = box.getSize(new THREE.Vector3());
    let s = sz.y > 1e-4 ? h / sz.y : 1; if (!(s > 0.02 && s < 50)) s = 1;
    o.scale.setScalar(s);
    const p = e.poly, u = (Math.random() * 2 - 1) * 6 - 1, v = (Math.random() * 2 - 1) * 10, x = p.cx + p.ux * u + p.vx * v, z = p.cz + p.uz * u + p.vz * v;
    o.rotation.y = Math.random() * Math.PI * 2; o.position.set(x, 0, z); o.updateMatrixWorld(true);
    const b2 = new THREE.Box3().setFromObject(o, true); o.position.y = gh(x, z) - b2.min.y + 0.02; o.userData.zooH = +(b2.max.y - b2.min.y).toFixed(2);
    o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.frustumCulled = false; } });
    W3D.zoo.root.add(o); W3D.zoo.animals++;
    const clips = gl.animations || [], pick = clips.find(c => /Eating/.test(c.name) && Math.random() < 0.4) || clips.find(c => /(^|\|)Idle$/.test(c.name)) || clips.find(c => /Idle/.test(c.name)) || clips[0];
    if (pick) { const mx = new THREE.AnimationMixer(o); const ac = mx.clipAction(pick); ac.time = Math.random() * pick.duration; ac.play(); mixers.push(mx); }
  }, err => console.warn('zoo animal failed', file, err)); });
  for (const e of ENC) { place(e, e.file, LITE() ? 1 : e.n, e.h); if (e.extra && !LITE()) place(e, e.extra.file, e.extra.n, e.extra.h); }
}
let acc = 0, near = false;
AFRAME.registerSystem('w3d-zoo', {
  tick(t, dt) {
    if (!window.W3D_READY || !W3D.root || !W3D.water || !W3D.water.zoo || !W3D.terrainH) return;
    if (!built) { try { build(); } catch (e) { console.warn('zoo failed', e); built = true; } return; }
    const cam = this.el.camera; if (!cam || !W3D.active) return;
    acc += dt; if (acc > 500) { acc = 0; const p = cam.getWorldPosition(new THREE.Vector3()); const d = Math.hypot(p.x - C.x, p.z - C.z); near = d < 260; if (d < 420) loadAnimals(); }
    if (near && mixers.length) { const s = Math.min(0.1, dt / 1000); for (const m of mixers) m.update(s); }
  }
});
})();
