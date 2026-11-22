/* Wildlife for Josh's VR World: deer, wild turkeys, skunks, opossums (wandering on the ground),
   red-tailed hawks (circling overhead) and owls (perched in trees near the compound).
   Simple procedural animated models (concept), no external assets. */
(function () {
const W3D = window.W3D;
const animals = W3D.animals = [];
const lam = c => new THREE.MeshLambertMaterial({color: c});
function part(g, geo, mat, x, y, z, sx, sy, sz) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); if (sx) m.scale.set(sx, sy, sz); m.castShadow = true; g.add(m); return m; }
const SPH = new THREE.SphereGeometry(1, 12, 8), CYL = new THREE.CylinderGeometry(1, 1, 1, 8), CONE = new THREE.ConeGeometry(1, 1, 8);
function legs(g, mat, pts, len, r) { return pts.map(([x, z]) => { const pivot = new THREE.Group(); pivot.position.set(x, len, z); const l = new THREE.Mesh(CYL, mat); l.scale.set(r, len, r); l.position.y = -len / 2; pivot.add(l); g.add(pivot); return pivot; }); }
function deer(buck) {
  const g = new THREE.Group(), fur = lam(0x8b5a2b), belly = lam(0xd9c3a0), dark = lam(0x2a1a10);
  part(g, SPH, fur, 0, 1.05, 0, 0.75, 0.42, 0.33);
  part(g, SPH, belly, 0.05, 0.92, 0, 0.6, 0.25, 0.28);
  const neck = part(g, CYL, fur, 0.62, 1.38, 0, 0.12, 0.55, 0.12); neck.rotation.z = -0.6;
  const head = new THREE.Group(); head.position.set(0.85, 1.65, 0); g.add(head);
  part(head, SPH, fur, 0.12, 0, 0, 0.24, 0.12, 0.11); part(head, SPH, dark, 0.34, -0.02, 0, 0.04, 0.04, 0.04);
  part(head, CONE, fur, -0.02, 0.14, 0.09, 0.05, 0.16, 0.03).rotation.x = 0.5; part(head, CONE, fur, -0.02, 0.14, -0.09, 0.05, 0.16, 0.03).rotation.x = -0.5;
  if (buck) for (const s of [-1, 1]) { const a = part(head, CYL, lam(0xcbb894), -0.02, 0.32, s * 0.12, 0.02, 0.4, 0.02); a.rotation.x = s * 0.4; const b = part(head, CYL, lam(0xcbb894), 0.08, 0.45, s * 0.2, 0.015, 0.25, 0.015); b.rotation.z = -0.7; }
  part(g, SPH, lam(0xf5f0e6), -0.74, 1.15, 0, 0.08, 0.12, 0.08);
  const L = legs(g, fur, [[0.45, 0.13], [0.45, -0.13], [-0.45, 0.13], [-0.45, -0.13]], 0.85, 0.05);
  return {g, legs: L, head, speed: 1.3, stride: 6, kind: 'deer'};
}
function turkey() {
  const g = new THREE.Group(), bronze = lam(0x3b2a1e), red = lam(0xb3261e), blue = lam(0x6f8fbf), legM = lam(0xa36d4a);
  part(g, SPH, bronze, 0, 0.5, 0, 0.32, 0.28, 0.24);
  const fan = new THREE.Mesh(new THREE.CircleGeometry(0.45, 14, Math.PI * 0.05, Math.PI * 0.9), new THREE.MeshLambertMaterial({color: 0x4a3324, side: THREE.DoubleSide}));
  fan.position.set(-0.3, 0.62, 0); fan.rotation.y = Math.PI / 2; fan.rotation.x = 0; g.add(fan);
  const neck = part(g, CYL, blue, 0.25, 0.75, 0, 0.04, 0.3, 0.04); neck.rotation.z = -0.3;
  const head = new THREE.Group(); head.position.set(0.32, 0.92, 0); g.add(head); part(head, SPH, blue, 0, 0, 0, 0.06, 0.06, 0.06); part(head, SPH, red, 0.03, -0.07, 0, 0.03, 0.06, 0.03); part(head, CONE, lam(0xd9c38f), 0.08, 0, 0, 0.02, 0.06, 0.02).rotation.z = -Math.PI / 2;
  const L = legs(g, legM, [[0.02, 0.08], [0.02, -0.08]], 0.32, 0.02);
  return {g, legs: L, head, speed: 0.7, stride: 9, kind: 'turkey', peck: true};
}
function skunk() {
  const g = new THREE.Group(), blk = lam(0x111111), wht = lam(0xf2f2f2);
  part(g, SPH, blk, 0, 0.2, 0, 0.3, 0.15, 0.14); part(g, SPH, wht, 0, 0.3, 0, 0.28, 0.05, 0.04);
  const head = new THREE.Group(); head.position.set(0.3, 0.22, 0); g.add(head); part(head, SPH, blk, 0.05, 0, 0, 0.1, 0.08, 0.08); part(head, SPH, wht, 0.08, 0.06, 0, 0.06, 0.015, 0.015);
  const tail = part(g, SPH, blk, -0.35, 0.45, 0, 0.12, 0.25, 0.12); part(g, SPH, wht, -0.36, 0.55, 0, 0.06, 0.18, 0.06);
  const L = legs(g, blk, [[0.15, 0.08], [0.15, -0.08], [-0.15, 0.08], [-0.15, -0.08]], 0.12, 0.03);
  return {g, legs: L, head, tail, speed: 0.45, stride: 12, kind: 'skunk'};
}
function opossum() {
  const g = new THREE.Group(), grey = lam(0x8d8d88), wht = lam(0xeeeeea), pink = lam(0xe2b3a8);
  part(g, SPH, grey, 0, 0.18, 0, 0.3, 0.14, 0.13);
  const head = new THREE.Group(); head.position.set(0.3, 0.2, 0); g.add(head); part(head, CONE, wht, 0.1, 0, 0, 0.07, 0.24, 0.07).rotation.z = -Math.PI / 2; part(head, SPH, lam(0x222222), 0.2, 0.01, 0, 0.02, 0.02, 0.02);
  part(head, SPH, lam(0x333333), 0, 0.07, 0.05, 0.03, 0.04, 0.01); part(head, SPH, lam(0x333333), 0, 0.07, -0.05, 0.03, 0.04, 0.01);
  const tail = part(g, CYL, pink, -0.5, 0.15, 0, 0.02, 0.45, 0.02); tail.rotation.z = Math.PI / 2 - 0.2;
  const L = legs(g, lam(0x333333), [[0.15, 0.08], [0.15, -0.08], [-0.15, 0.08], [-0.15, -0.08]], 0.1, 0.025);
  return {g, legs: L, head, speed: 0.4, stride: 12, kind: 'opossum'};
}
function hawk() {
  const g = new THREE.Group(), br = lam(0x6b4a2f), lt = lam(0xe9dcc6), rust = lam(0xa4532a);
  part(g, SPH, lt, 0, 0, 0, 0.35, 0.12, 0.12); part(g, SPH, br, 0.32, 0.03, 0, 0.1, 0.09, 0.09);
  const tail = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.25), new THREE.MeshLambertMaterial({color: 0xa4532a, side: THREE.DoubleSide})); tail.rotation.x = -Math.PI / 2; tail.position.set(-0.45, 0, 0); g.add(tail);
  const wings = [-1, 1].map(s => { const piv = new THREE.Group(); g.add(piv); const w = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.9), new THREE.MeshLambertMaterial({color: 0x6b4a2f, side: THREE.DoubleSide})); w.rotation.x = -Math.PI / 2; w.position.z = s * 0.5; piv.add(w); piv.userData.s = s; return piv; });
  g.scale.setScalar(1.6); return {g, wings, kind: 'hawk'};
}
function owl() {
  const g = new THREE.Group(), br = lam(0x6e5a44), lt = lam(0xcdb79a);
  part(g, SPH, br, 0, 0.3, 0, 0.2, 0.3, 0.18); part(g, SPH, lt, 0.08, 0.25, 0, 0.12, 0.22, 0.12);
  const head = new THREE.Group(); head.position.set(0, 0.68, 0); g.add(head); part(head, SPH, br, 0, 0, 0, 0.17, 0.15, 0.17);
  const eyeM = new THREE.MeshBasicMaterial({color: 0xffc400}); for (const s of [-1, 1]) { part(head, SPH, lt, 0.12, 0.02, s * 0.065, 0.05, 0.06, 0.06); const e = new THREE.Mesh(SPH, eyeM); e.scale.setScalar(0.028); e.position.set(0.165, 0.02, s * 0.065); head.add(e); part(head, CONE, br, 0, 0.17, s * 0.09, 0.035, 0.09, 0.035); }
  g.scale.setScalar(1.3); return {g, head, kind: 'owl'};
}
function okGround(x, z) { const h = W3D.terrainH(x, z); if (h < 17.2) return false; for (const w of W3D.walls) if (x > w.x0 - 1 && x < w.x1 + 1 && z > w.z0 - 1 && z < w.z1 + 1) return false; return true; }
function randomNear(cx, cz, r) { for (let i = 0; i < 30; i++) { const a = Math.random() * 6.283, d = Math.sqrt(Math.random()) * r, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d; if (okGround(x, z)) return [x, z]; } return [cx, cz]; }
W3D.buildWildlife = function (root) {
  const C = {x: 920, z: -380};
  const spawn = (fn, n, r, rmin) => { for (let i = 0; i < n; i++) { const a = fn(i); let p; do { p = randomNear(C.x, C.z, r); } while (Math.hypot(p[0] - C.x, p[1] - C.z) < (rmin || 0) && Math.random() < 0.95);
    a.g.position.set(p[0], W3D.terrainH(p[0], p[1]), p[1]); a.home = {x: p[0], z: p[1]}; a.target = randomNear(p[0], p[1], 40); a.wait = Math.random() * 4; a.phase = Math.random() * 10; root.add(a.g); animals.push(a); } };
  spawn(i => deer(i % 3 === 0), 12, 260, 95);
  spawn(() => turkey(), 14, 220, 95);
  spawn(() => skunk(), 4, 200, 100);
  spawn(() => opossum(), 4, 200, 100);
  for (let i = 0; i < 3; i++) { const h = hawk(); h.c = {x: C.x - 120 + i * 90, z: C.z + (i - 1) * 80}; h.r = 60 + i * 25; h.alt = 70 + i * 18; h.w = 0.12 + i * 0.03; h.phase = i * 2; root.add(h.g); animals.push(h); }
  // owls perched on tree crowns near the compound (top of the nearest instanced crowns isn't tracked, so perch on posts of oak-like height)
  for (let i = 0; i < 5; i++) { const o = owl(); const p = randomNear(C.x, C.z, 200); const y = W3D.terrainH(p[0], p[1]);
    const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.4, 6), new THREE.MeshLambertMaterial({color: 0x5a4330})); branch.rotation.z = Math.PI / 2; branch.position.set(p[0], y + 6.4, p[1]);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.4, 9, 7), new THREE.MeshLambertMaterial({color: 0x5a4330})); trunk.position.set(p[0] + 0.7, y + 4.5, p[1]);
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(3.2, 1), new THREE.MeshLambertMaterial({color: 0x4b6f2c, flatShading: true})); crown.position.set(p[0] + 0.7, y + 11.5, p[1]);
    root.add(branch); root.add(trunk); root.add(crown); o.g.position.set(p[0] - 0.2, y + 6.45, p[1]); o.phase = Math.random() * 10; root.add(o.g); animals.push(o); }
};
W3D.tickWildlife = function (t, dt) {
  const d = Math.min(dt, 60) / 1000, ts = t / 1000;
  for (const a of animals) {
    if (a.kind === 'hawk') { const ang = ts * a.w + a.phase; a.g.position.set(a.c.x + Math.cos(ang) * a.r, W3D.terrainH(a.c.x, a.c.z) + a.alt + Math.sin(ts * 0.3 + a.phase) * 6, a.c.z + Math.sin(ang) * a.r); a.g.rotation.set(0.25, -ang - Math.PI / 2 * 0 + Math.PI, 0.35); a.g.rotation.y = -ang - Math.PI; const flap = Math.sin(ts * 7 + a.phase) * (Math.sin(ts * 0.5 + a.phase) > 0.6 ? 0.6 : 0.05); a.wings.forEach(w => w.rotation.x = w.userData.s * flap); continue; }
    if (a.kind === 'owl') { a.head.rotation.y = Math.sin(ts * 0.4 + a.phase) * 1.4 * (Math.sin(ts * 0.13 + a.phase) > 0 ? 1 : 0.2); continue; }
    const p = a.g.position;
    if (a.wait > 0) { a.wait -= d; a.legs.forEach(l => l.rotation.z *= 0.9); if (a.head) a.head.rotation.z = a.peck ? Math.max(0, Math.sin(ts * 6 + a.phase)) * -0.9 : Math.sin(ts * 1.5 + a.phase) * -0.4 - 0.2; continue; }
    const dx = a.target[0] - p.x, dz = a.target[1] - p.z, dist = Math.hypot(dx, dz);
    if (dist < 0.5) { a.wait = 2 + Math.random() * 6; a.target = randomNear(a.home.x, a.home.z, 60); continue; }
    const step = Math.min(dist, a.speed * d), nx = p.x + dx / dist * step, nz = p.z + dz / dist * step;
    if (!okGround(nx, nz)) { a.target = randomNear(a.home.x, a.home.z, 60); continue; }
    p.x = nx; p.z = nz; p.y = W3D.terrainH(nx, nz);
    const yaw = Math.atan2(-dz, dx); a.g.rotation.y += ((yaw - a.g.rotation.y + Math.PI * 3) % (Math.PI * 2) - Math.PI) * Math.min(1, d * 4);
    const sw = Math.sin(ts * a.stride + a.phase) * 0.5; a.legs.forEach((l, i) => l.rotation.z = (i % 2 === (i < 2 ? 0 : 1) ? sw : -sw));
    if (a.head) a.head.rotation.z = 0; if (a.tail) a.tail.rotation.x = Math.sin(ts * 3) * 0.1;
  }
};
})();
