/* Bangkok (procedural impression, not a map): landing pad on the east-bank riverside plaza of the Chao Phraya,
   a Wat Arun-style temple of porcelain-studded prangs on the far bank, a golden stupa on a mound, pastel shophouses,
   moving long-tail boats and tuk-tuks, palms, and a warm hazy sunset in the west (-x). North = -z. */
(function () {
'use strict';
W3D.cityModules.bangkok = (grp, K) => {
  const L = K.LITE, r = K.rnd(33), WL = -1.8, T = K.tex, RX0 = -330, RX1 = -45;
  const mound = (x, z) => 18 * Math.max(0, 1 - Math.hypot(x - 200, z + 250) / 60);
  const land = (x, z) => (x > RX0 && x < RX1) ? -7 : 0.2 * Math.sin(x * 0.05) * Math.sin(z * 0.04) + mound(x, z) + (x <= RX0 ? 0.6 : 0);
  const out = {R: 3000, ground: land, fog: L ? [0xf0b487, 240, 1900] : [0xf0b487, 280, 2600], sky: 0xf0b487};
  K.heightMesh(grp, 900, L ? 18 : 10, land, K.lamb({vertexColors: true}), (x, z, y) => y < -1 ? [0.3, 0.26, 0.2] : (x > -40 && x < 40 && Math.abs(z) < 70) ? [0.6, 0.56, 0.5] : y > 3 ? [0.3, 0.4, 0.2] : (x < RX0 ? [0.33, 0.42, 0.24] : [0.46, 0.44, 0.4]));
  const riv = K.water(grp, (RX0 + RX1) / 2, 0, RX1 - RX0 + 20, 4000, WL, '#5c4c37', 'rgba(255,214,170,0.2)');
  K.pad(grp, 0, 15);
  // sunset sun and glow
  const sun = new THREE.Mesh(new THREE.CircleGeometry(70, 32), new THREE.MeshBasicMaterial({color: 0xffc27a, fog: false})); sun.position.set(-2600, 160, -300); sun.lookAt(0, 160, 0); grp.add(sun);
  const glow = new THREE.Mesh(new THREE.CircleGeometry(260, 32), new THREE.MeshBasicMaterial({color: 0xffa868, transparent: true, opacity: 0.35, fog: false, depthWrite: false})); glow.position.set(-2590, 160, -300); glow.lookAt(0, 160, 0); grp.add(glow);
  // Wat Arun-style temple on the west bank: terraces, a central prang and four satellite prangs
  const mosaic = K.ctex(256, 256, (g, w, h) => { const rr = K.rnd(9); g.fillStyle = '#e9e1d0'; g.fillRect(0, 0, w, h); const cs = ['#2f6fa8', '#c8433a', '#e7b93c', '#4b9a6c', '#f4f0e8', '#8a5aa6']; for (let i = 0; i < 1600; i++) { g.fillStyle = cs[Math.floor(rr() * cs.length)]; g.beginPath(); g.arc(rr() * w, rr() * h, 1.5 + rr() * 2.5, 0, 6.3); g.fill(); } });
  const pm = K.lamb({map: mosaic}), gold = K.std({color: 0xe2b443, metalness: 0.8, roughness: 0.3, emissive: 0x4a3008});
  const prang = (x, z, y, s) => { const g = []; let yy = y, rad = 16 * s;
    for (let i = 0; i < 7; i++) { const hh = (i < 3 ? 7 : 6) * s, r2 = rad * 0.8; g.push(K.xform(new THREE.CylinderGeometry(r2, rad, hh, 8), x, yy + hh / 2, z, Math.PI / 8)); yy += hh; g.push(K.xform(new THREE.CylinderGeometry(r2 * 1.12, r2 * 1.12, 0.6 * s, 8), x, yy, z, Math.PI / 8)); rad = r2 * 0.86; }
    g.push(K.xform(new THREE.SphereGeometry(rad * 1.25, 12, 8), x, yy + rad, z)); const sp = new THREE.ConeGeometry(rad * 0.7, 14 * s, 8); return {g, tip: K.xform(sp, x, yy + rad * 2 + 7 * s, z)}; };
  { const cx = -400, cz = -40, parts = [K.box(96, 4, 96, cx, 0, cz), K.box(70, 4, 70, cx, 4, cz)], tips = [];
    const c = prang(cx, cz, 8, 1.15); parts.push(...c.g); tips.push(c.tip);
    for (const [dx, dz] of [[-38, -38], [38, -38], [-38, 38], [38, 38]]) { const p = prang(cx + dx, cz + dz, 4, 0.45); parts.push(...p.g); tips.push(p.tip); }
    for (const [dx, dz] of [[0, -48], [0, 48], [-48, 0], [48, 0]]) parts.push(K.box(10, 9, 10, cx + dx, 4, cz + dz));
    grp.add(new THREE.Mesh(K.merge(parts), pm), new THREE.Mesh(K.merge(tips), gold));
    out.temple = [cx, cz]; }
  // golden stupa on the mound
  { const st = new THREE.LatheGeometry([[0.01, 0], [14, 0], [14, 2], [13, 3], [13.6, 6], [13.8, 9], [13, 13], [11.4, 17], [8.6, 20.5], [5, 23], [3.2, 25], [3.6, 27], [2.4, 29], [1.8, 34], [1.2, 39], [0.6, 43], [0.05, 47]].map(p => new THREE.Vector2(p[0], p[1])), 24);
    const m = new THREE.Mesh(st, gold); m.position.set(200, 21, -250); grp.add(m);
    grp.add(new THREE.Mesh(K.merge([K.box(34, 3, 34, 200, 16, -250), K.box(28, 2, 28, 200, 19, -250)]), K.lamb({color: 0xefe8da}))); }
  // pastel shophouses along the riverside road and inland streets
  const mats = {a: K.lamb({map: T.render('#e8c7a0')}), b: K.lamb({map: T.render('#cfe0d0')}), c: K.lamb({map: T.render('#efe0b8')}), d: K.lamb({map: T.render('#e5b9b0')}), roof: K.lamb({color: 0x6a5a4f})}, list = [], wl = [];
  for (const zz of [[-330, -80], [80, 330]]) for (let z = zz[0]; z < zz[1]; z += 8.5) for (const x of [70, 108]) { const lv = 3 + Math.floor(r() * 2), P = K.rect(x, z, 14, 8, 0), h = lv * 3.3; list.push({p: P, y0: -0.3, h, m: 'abcd'[Math.floor(r() * 4)], rm: 'roof'}); if (!L || r() < 0.5) for (const w of K.winList(P, 2.6, lv - 1, {step: 3.2, fh: 3.3})) wl.push(w); }
  for (let i = 0; i < 26; i++) { const x = 160 + r() * 500, z = -500 + r() * 1000; if (Math.hypot(x - 200, z + 250) < 80) continue; const lv = 4 + Math.floor(r() * 18), P = K.rect(x, z, 18 + r() * 14, 18 + r() * 14, 0); list.push({p: P, y0: -0.3, h: lv * 3.3, m: 'abcd'[i % 4], rm: 'roof'}); }
  const coll = K.blocks(grp, list, mats); K.wins(grp, wl, {lit: 0.25, litCol: 0xffd39a, frame: 0xf3efe6});
  const bIdx = K.polyIndex(coll, 30); out.blocked = (x, z, y) => land(x, z) < -1 || bIdx(x, z, y);
  // roads
  const rd = []; for (const x of [50, 89, 128]) { const pts = []; for (let z = -900; z <= 900; z += 15) pts.push([x, z]); rd.push(K.ribbon(pts, x === 89 ? 12 : 8, land, {y: 0.06, su: 6})); }
  grp.add(new THREE.Mesh(K.merge(rd), K.lamb({map: T.asphalt(), polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2})));
  // palms and trees
  const palms = [], tr = []; for (let z = -420; z <= 420; z += 14) if (Math.abs(z) > 30) palms.push([-30, 0, z, 0.9 + r() * 0.3]); for (let i = 0; i < (L ? 60 : 160); i++) { const x = RX0 - 10 - r() * 400, z = -600 + r() * 1200; if (Math.hypot(x + 400, z + 40) < 70) continue; tr.push([x, land(x, z), z, 1 + r() * 0.5]); }
  K.trees(grp, palms, {palm: true}); K.trees(grp, tr, {leaf: [0x3d6a2c, 0x4e7a34, 0x2f5a24]});
  // long-tail boats on the river, tuk-tuks on the road (instanced, moved each frame)
  const NB = L ? 4 : 7, NT = L ? 6 : 12, m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1), UP = new THREE.Vector3(0, 1, 0);
  const boatG = K.merge([K.xform(new THREE.CylinderGeometry(0.9, 0.4, 14, 8).rotateX(Math.PI / 2).scale(1, 0.45, 1), 0, 0.2, 0), K.xform(new THREE.BoxGeometry(1.6, 1.4, 5).translate(0, 0, 0), 0, 1.1, -1), K.xform(new THREE.CylinderGeometry(0.08, 0.08, 6, 5).rotateX(Math.PI / 2 - 0.15), 0, 0.9, -9.5)]);
  const boats = new THREE.InstancedMesh(boatG, K.lamb({color: 0xffffff}), NB), bc = new THREE.Color(); for (let i = 0; i < NB; i++) boats.setColorAt(i, bc.setHex([0x2f6fb0, 0xc2412f, 0x2e8a5a, 0xd9a52f, 0x7a3fa0, 0x2a9ab8, 0xb0442a][i % 7])); grp.add(boats);
  const tukG = K.merge([K.box(1.4, 0.9, 2.6, 0, 0.35, 0), K.box(1.45, 0.08, 2.4, 0, 1.85, -0.2), K.box(0.06, 0.6, 0.06, -0.65, 1.25, 0.9), K.box(0.06, 0.6, 0.06, 0.65, 1.25, 0.9), K.box(0.06, 0.6, 0.06, -0.65, 1.25, -1.3), K.box(0.06, 0.6, 0.06, 0.65, 1.25, -1.3)]);
  const tuks = new THREE.InstancedMesh(tukG, K.lamb({color: 0xffffff}), NT); for (let i = 0; i < NT; i++) tuks.setColorAt(i, bc.setHex([0x2b5fa8, 0x2f8a4a, 0xe0a91f, 0xc23b5a][i % 4])); grp.add(tuks);
  const bdat = []; for (let i = 0; i < NB; i++) bdat.push([RX0 + 40 + r() * (RX1 - RX0 - 80), r() * 1600 - 800, (r() < 0.5 ? -1 : 1) * (0.012 + r() * 0.01)]);
  const tdat = []; for (let i = 0; i < NT; i++) tdat.push([i % 2 ? 86 : 92, r() * 1600 - 800, (i % 2 ? -1 : 1) * (0.008 + r() * 0.004)]);
  K.sky(grp, {top: 0x6c6a9c, horizon: 0xf0b487, below: 0xc98c66, sun: [-1, 0.07, -0.12], sunCol: 0xffe0a8, glow: 1});
  K.lights(grp, {sky: 0xffd2b0, ground: 0x6a5240, hi: 1.05, si: 1.0, dx: -500, dy: 90, dz: -60, sun: 0xffb67a});
  out.tick = (t, dt) => { riv.userData.flow.offset.y += dt * 0.00003;
    bdat.forEach((b, i) => { b[1] += b[2] * dt; if (b[1] > 900) b[1] = -900; if (b[1] < -900) b[1] = 900; q.setFromAxisAngle(UP, b[2] > 0 ? 0 : Math.PI); m4.compose(v.set(b[0], WL + 0.15 + Math.sin(t * 0.004 + i) * 0.08, b[1]), q, one); boats.setMatrixAt(i, m4); }); boats.instanceMatrix.needsUpdate = true;
    tdat.forEach((b, i) => { b[1] += b[2] * dt; if (b[1] > 900) b[1] = -900; if (b[1] < -900) b[1] = 900; q.setFromAxisAngle(UP, b[2] > 0 ? 0 : Math.PI); m4.compose(v.set(b[0], land(b[0], b[1]) + 0.35, b[1]), q, one); tuks.setMatrixAt(i, m4); }); tuks.instanceMatrix.needsUpdate = true; };
  out.tick(0, 0);
  return out;
};
})();
