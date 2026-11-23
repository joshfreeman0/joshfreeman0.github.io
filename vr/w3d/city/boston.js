/* Boston (procedural impression, not a map): Harbor waterfront plaza with the landing pad, downtown glass towers,
   a cable-stayed bridge with inverted-Y towers to the north, a brick bow-front row with mansard roofs, the gold-domed
   State House on the hill above a green Common with a pond, and a big roof sign in the west. North = -z, harbour east. */
(function () {
'use strict';
W3D.cityModules.boston = (grp, K) => {
  const L = K.LITE, r = K.rnd(91), WL = -1.6, T = K.tex;
  const hill = (x, z) => { const d = Math.hypot(x, z), k = d < 30 ? 0 : d > 90 ? 1 : (d - 30) / 60; return 24 * Math.exp(-((x + 330) * (x + 330) + (z + 70) * (z + 70)) / (2 * 130 * 130)) * k * k * (3 - 2 * k); };
  const land = (x, z) => { const shore = 62; return x > shore ? -9 : hill(x, z); };
  const H = land, out = {R: 3000, ground: H, fog: L ? [0xc4d4e2, 160, 1300] : [0xc4d4e2, 200, 1900], sky: 0xc4d4e2};
  K.heightMesh(grp, 900, L ? 18 : 10, land, K.lamb({vertexColors: true}), (x, z, y) => { if (y < -1) return [0.3, 0.32, 0.33];
    if (x > -560 && x < -300 && z > -130 && z < 110 && !(x > -360 && z < -10)) return [0.36, 0.52, 0.27];   // the Common
    return [0.5, 0.49, 0.47]; });
  const sea = K.water(grp, 1500, 0, 2900, 6000, WL, '#3a5465', 'rgba(220,235,245,0.13)');
  const pond = K.water(grp, -470, 30, 46, 30, hill(-470, 30) + 0.05, '#4c6670'); grp.add(new THREE.Mesh(new THREE.RingGeometry(15, 16.5, 32).rotateX(-Math.PI / 2).scale(1.55, 1, 1).translate(-470, hill(-470, 30) + 0.06, 30), K.lamb({color: 0x8f8a82})));
  K.pad(grp, 0, 15);
  // harbour walk: granite quay, railing posts, bollards
  const q = [K.box(1.2, 10, 1600, 66, -10, 0)], rails = []; for (let z = -400; z <= 400; z += 4) rails.push(K.box(0.08, 1.1, 0.08, 58, 0, z)); rails.push(K.box(0.08, 0.06, 800, 58, 1.05, 0));
  grp.add(new THREE.Mesh(K.merge(q), K.lamb({map: T.render('#9a968e')})), new THREE.Mesh(K.merge(rails), K.lamb({color: 0x2b2d30})));
  // streets
  const rd = []; for (let x = -620; x <= 20; x += 80) { const pts = []; for (let z = -420; z <= 420; z += 12) pts.push([x, z]); rd.push(K.ribbon(pts, 12, H, {y: 0.06, su: 6})); }
  for (let z = -420; z <= 420; z += 90) { const pts = []; for (let x = -700; x <= 40; x += 12) pts.push([x, z]); rd.push(K.ribbon(pts, 12, H, {y: 0.07, su: 6})); }
  grp.add(new THREE.Mesh(K.merge(rd), K.lamb({map: T.asphalt(), polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2})));
  // downtown towers (curtain-wall textures) between x -300 and -20
  const glassT = T.windows({nx: 4, ny: 4, wall: '#62707c', glass: '#2a3946', lit: 0.06, seed: 4}), glassB = T.windows({nx: 4, ny: 4, wall: '#8d8576', glass: '#2b3540', lit: 0.05, seed: 8});
  const mats = {g1: K.lamb({map: glassT}), g2: K.lamb({map: glassB}), roof: K.lamb({color: 0x5e6062}), brick: K.lamb({map: T.brick([150, 72, 52])}), brick2: K.lamb({map: T.brick([128, 60, 46])}), stone: K.lamb({map: T.render('#d9d3c6')})};
  const list = [], wl = [];
  for (let bx = -300; bx < 20; bx += 80) for (let bz = -420; bz < 420; bz += 90) { if (bx >= -140 && bz > -200 && bz < 160) continue;   // keep the plaza open
    const far = bx < -200 && bz > -160 && bz < 140; if (far) continue;   // Common / hill
    const n = 1 + Math.floor(r() * 2); for (let i = 0; i < n; i++) { const w = 22 + r() * 18, d = 22 + r() * 22, cx = bx + 40 + (n > 1 ? (i ? 14 : -14) : 0), cz = bz + 45 + (r() - 0.5) * 20, hgt = (bx > -120 ? 60 : 90) + r() * (bz > -100 && bz < 250 ? 160 : 80);
      list.push({p: K.rect(cx, cz, Math.min(w, 30), d, 0), y0: H(cx, cz) - 1, h: hgt, m: r() < 0.5 ? 'g1' : 'g2', rm: 'roof', su: 12, sv: 14}); } }
  // Back Bay: brick bow-front row with mansard roofs (south-west)
  const bows = [], mans = [];
  for (let i = 0; i < (L ? 14 : 24); i++) { const x = -660 + i * 7.2, z = 200, P = K.rect(x, z, 7, 15, 0), lv = 4, h = lv * 3.5; list.push({p: P, y0: H(x, z) - 0.5, h, m: i % 3 ? 'brick' : 'brick2', rm: 'roof'});
    bows.push(K.xform(new THREE.CylinderGeometry(2.4, 2.4, h - 1, 10, 1, false, Math.PI / 2, Math.PI), x, H(x, z) + (h - 1) / 2 - 0.5, z - 7.5, 0));
    const sh = new THREE.Shape([new THREE.Vector2(-7.8, 0), new THREE.Vector2(7.8, 0), new THREE.Vector2(6.4, 3.2), new THREE.Vector2(-6.4, 3.2)]), mg = new THREE.ExtrudeGeometry(sh, {depth: 7, bevelEnabled: false}); mg.translate(0, 0, -3.5); mg.rotateY(Math.PI / 2); mans.push(K.xform(mg, x, H(x, z) + h - 0.5, z));
    for (const wv of K.winList(P, H(x, z) - 0.5, lv, {step: 2.4, fh: 3.5})) wl.push(wv); }
  grp.add(new THREE.Mesh(K.merge(bows), mats.brick), new THREE.Mesh(K.merge(mans), K.lamb({map: T.tiles([60, 64, 70])})));
  // State House on the hill: brick block, white portico, gold dome
  { const x = -330, z = -110, y = hill(x, z) - 0.5; list.push({p: K.rect(x, z, 54, 30, 0), y0: y, h: 17, m: 'brick', rm: 'roof'}); for (const wv of K.winList(K.rect(x, z, 54, 30, 0), y, 3, {step: 3.6, fh: 4.8})) wl.push(wv);
    const port = [K.box(30, 1.2, 8, x, y + 6.5, z + 19), K.box(30, 1.4, 8, x, y + 14.5, z + 19)]; for (let i = 0; i < 8; i++) port.push(K.xform(new THREE.CylinderGeometry(0.55, 0.6, 7, 10), x - 13 + i * 26 / 7, y + 11, z + 22));
    const ped = new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-16, 0), new THREE.Vector2(16, 0), new THREE.Vector2(0, 5)]), {depth: 7.6, bevelEnabled: false}); port.push(K.xform(ped, x, y + 17, z + 15.2));
    port.push(K.xform(new THREE.CylinderGeometry(11, 11, 5, 24), x, y + 19.5, z), K.xform(new THREE.CylinderGeometry(1.8, 2.2, 4, 10), x, y + 33.5, z));
    grp.add(new THREE.Mesh(K.merge(port), K.lamb({color: 0xf2efe8})));
    const dome = new THREE.Mesh(new THREE.SphereGeometry(10.5, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), K.std({color: 0xe0b23a, metalness: 0.85, roughness: 0.28, emissive: 0x3a2a05})); dome.position.set(x, y + 22, z); grp.add(dome);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(1.2, 3.5, 10), dome.material); tip.position.set(x, y + 37, z); grp.add(tip); }
  const coll = K.blocks(grp, list, mats); K.wins(grp, wl, {lit: 0.05, frame: 0xe8e2d6});
  const bIdx = K.polyIndex(coll, 30); out.blocked = (x, z, y) => H(x, z) < -1 || bIdx(x, z, y);
  // the Common: trees, paths
  const tl = []; for (let i = 0; i < (L ? 90 : 220); i++) { const x = -560 + r() * 260, z = -130 + r() * 240; if (x > -360 && z < -10) continue; if (Math.hypot((x + 470) / 1.55, z - 30) < 20) continue; tl.push([x, H(x, z), z, 0.9 + r() * 0.6]); }
  for (let z = -400; z <= 400; z += 18) tl.push([45, 0, z, 0.8]); K.trees(grp, tl, {leaf: [0x557a35, 0x4a6e2f, 0x6a8a3a, 0xa0772e]});
  const paths = []; for (const [a, b] of [[[-560, -120], [-300, 100]], [[-560, 100], [-380, -40]], [[-440, -130], [-430, 110]]]) { const pts = []; for (let t = 0; t <= 1.0001; t += 0.05) pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); paths.push(K.ribbon(pts, 3, H, {y: 0.08, su: 2})); }
  grp.add(new THREE.Mesh(K.merge(paths), K.lamb({map: T.paving([180, 172, 160]), polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3})));
  // cable-stayed bridge to the north: inverted-Y towers, fanned cables
  { const z = -560, y = 24, xs = [-160, 60], st = K.lamb({color: 0xe9ecef}), parts = [K.box(560, 2, 26, -50, y - 2, z)], cab = [];
    for (const tx of xs) { const top = y + 82; for (const s of [-1, 1]) parts.push(K.xform(new THREE.CylinderGeometry(1.2, 1.8, 80, 8), tx, y + 38, z + s * 10, 0).rotateX(0)); parts.push(K.xform(new THREE.CylinderGeometry(1.1, 1.6, 34, 8), tx, top - 2, z)); parts.push(K.box(4, 4, 24, tx, y + 62, z));
      for (const tl2 of parts.slice(-4, -2)) tl2.rotateX(0);
      for (let i = 1; i <= 10; i++) for (const sd of [-1, 1]) for (const s of [-1, 1]) cab.push(tx, top - 2 - i * 2.2, z, tx + sd * i * 12, y, z + s * 12); }
    for (const tx of xs) for (const s of [-1, 1]) parts.push(K.box(2.6, y + 10, 2.6, tx, -10, z + s * 10));
    grp.add(new THREE.Mesh(K.merge(parts), st)); const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.Float32BufferAttribute(cab, 3)); grp.add(new THREE.LineSegments(cg, new THREE.LineBasicMaterial({color: 0xf4f6f8}))); }
  // big roof sign in the west (lit triangle mark + lettering)
  { const x = -760, z = 120, y = H(x, z); list.length = 0; const P = K.rect(x, z, 40, 30, 0); grp.add(new THREE.Mesh(K.merge([K.prism(P, y - 0.5, 22, {su: 1.2, sv: 1.2}), K.cap(P, y + 21.5)]), mats.brick2));
    const fr = []; for (const dx of [-8, 0, 8]) fr.push(K.box(0.4, 18, 0.4, x + dx, y + 21.5, z + 2)); grp.add(new THREE.Mesh(K.merge(fr), K.lamb({color: 0x2b2b2b})));
    const tx = K.ctex(512, 512, (g, w, h) => { g.fillStyle = '#f4f4f2'; g.fillRect(0, 0, w, h); g.fillStyle = '#20306e'; g.fillRect(0, 0, w, 8); g.fillRect(0, h - 8, w, 8);
      const tri = (s, c) => { g.fillStyle = c; g.beginPath(); g.moveTo(w / 2, 40 + (1 - s) * 140); g.lineTo(w / 2 - 170 * s, 40 + 300 * s * 0.98 + (1 - s) * 140); g.lineTo(w / 2 + 170 * s, 40 + 300 * s * 0.98 + (1 - s) * 140); g.closePath(); g.fill(); };
      tri(1, '#d8262c'); tri(0.72, '#f07c22'); tri(0.44, '#f4f4f2'); g.fillStyle = '#20306e'; g.font = 'bold 120px Arial, sans-serif'; g.textAlign = 'center'; g.fillText('CITGO', w / 2, 470); });
    tx.wrapS = tx.wrapT = THREE.ClampToEdgeWrapping; const sg = new THREE.Mesh(new THREE.PlaneGeometry(18, 18), new THREE.MeshBasicMaterial({map: tx, side: THREE.DoubleSide})); sg.position.set(x, y + 31, z + 2.3); sg.rotation.y = Math.PI / 2 * 0 + 0.6; grp.add(sg); }
  // a sailboat and a ferry in the harbour
  const sail = new THREE.Group(); sail.add(new THREE.Mesh(new THREE.CylinderGeometry(1.4, 0.6, 9, 8).rotateX(Math.PI / 2).scale(1, 0.5, 1), K.lamb({color: 0xf2f2f2})), new THREE.Mesh(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.5, -3), new THREE.Vector3(0, 11, 0), new THREE.Vector3(0, 0.5, 3)]).setIndex([0, 1, 2]), new THREE.MeshLambertMaterial({color: 0xfafafa, side: THREE.DoubleSide})));
  sail.position.set(240, WL + 0.5, -60); grp.add(sail);
  const ferry = new THREE.Mesh(K.merge([K.box(8, 3, 28, 0, 0, 0), K.box(7, 2.6, 18, 0, 3, -2)]), K.lamb({color: 0xf0f0ee})); ferry.position.set(420, WL - 0.6, 120); grp.add(ferry);
  K.sky(grp, {top: 0x4f86c2, horizon: 0xc4d4e2, sun: [-0.9, 0.45, 0.35], sunCol: 0xfff4dc, glow: 0.6});
  K.lights(grp, {sky: 0xeaf2fb, ground: 0x585e55, hi: 1.15, si: 0.9, dx: -200, dy: 160, dz: 90, sun: 0xfff1dd});
  out.tick = (t, dt) => { sea.userData.flow.offset.x += dt * 0.000004; const a = t * 0.00004; sail.position.set(260 + Math.cos(a) * 140, WL + 0.4, -40 + Math.sin(a) * 200); sail.rotation.y = -a; ferry.position.z = 120 + Math.sin(t * 0.00003) * 260; };
  return out;
};
})();
