/* Saint John, New Brunswick (procedural impression, not a map): Bay of Fundy harbour wharf with the landing pad,
   brick uptown on the hill, a steel-arch bridge over the Reversing Falls gorge with tidal rapids, a lighthouse
   on a harbour islet, fishing boats and cool sea fog. Local frame: pad = (0, 0, 0); north = -z. */
(function () {
'use strict';
W3D.cityModules.saintjohn = (grp, K) => {
  const L = K.LITE, r = K.rnd(77), WL = -2.4, GX0 = -330, GX1 = -250, BZ = -150;
  const noise = (x, z) => Math.sin(x * 0.031 + 1.3) * Math.cos(z * 0.027) * 2.2 + Math.sin(x * 0.011 - z * 0.017) * 3;
  const land = (x, z) => { if (z > 46 + Math.sin(x * 0.01) * 6 && !(x > 160 && x < 210 && z > 135 && z < 185)) return -12;   // harbour (islet at 185, 160)
    if (x > 160 && x < 210 && z > 135 && z < 185) return 1.5 - Math.hypot(x - 185, z - 160) * 0.08;
    if (x > GX0 && x < GX1) return -14;                                                            // the gorge
    const bank = Math.min(Math.abs(x - GX0), Math.abs(x - GX1)); let y = z < -40 ? Math.min(38, (-40 - z) * 0.12) : 0;
    if (Math.abs(x) > 110 || z < -40) y += noise(x, z) * Math.min(1, Math.max(0, (Math.abs(x) - 110) / 80, (-40 - z) / 120)) * (z < -40 ? 0.4 : 1);
    if (z < 40) y += 10 * Math.exp(-bank / 40) * Math.min(1, (40 - z) / 30); return y; };
  const DECK = Math.max(land(GX0 - 1, BZ), land(GX1 + 1, BZ)) + 0.4;
  const H = (x, z) => { const g = land(x, z); if (Math.abs(z - BZ) < 5.2 && x > GX0 - 40 && x < GX1 + 40) return Math.max(g, DECK); return g; };
  const T = K.tex, mats = {red: K.lamb({map: T.brick([140, 62, 44])}), brown: K.lamb({map: T.brick([112, 70, 50])}), buff: K.lamb({map: T.brick([176, 146, 104], '#c2b6a3')}), roof: K.lamb({color: 0x55585a}), stone: K.lamb({map: T.render('#a7a49c')})};
  const out = {R: 3000, ground: H, fog: L ? [0xbcc5ca, 60, 480] : [0xbcc5ca, 70, 650], sky: 0xbcc5ca};
  // ground: vertex-coloured (rock, grass, paving)
  K.heightMesh(grp, 700, L ? 14 : 8, land, K.lamb({vertexColors: true}), (x, z, y) => { if (y < -1) return [0.32, 0.3, 0.28]; if (Math.abs(x) < 95 && z > -42 && z < 50) return [0.62, 0.61, 0.58]; const g = 0.42 + 0.1 * Math.sin(x * 0.2 + z * 0.13); return y > 26 ? [0.36, 0.42, 0.3] : [g * 0.9, g * 1.05, g * 0.72]; });
  // harbour and gorge water (animated), rapids
  const sea = K.water(grp, 0, 1400, 6000, 2700, WL, '#3d525c', 'rgba(210,225,235,0.14)'), riv = K.water(grp, (GX0 + GX1) / 2, -300, GX1 - GX0 + 30, 1800, WL - 1.2, '#3a4b45');
  const foam = K.ctex(256, 256, (g, w, h) => { const rr = K.rnd(3); g.clearRect(0, 0, w, h); for (let i = 0; i < 260; i++) { g.strokeStyle = 'rgba(255,255,255,' + (0.3 + rr() * 0.5) + ')'; g.lineWidth = 2 + rr() * 5; const x = rr() * w, y = rr() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 20 + rr() * 30, y + rr() * 8); g.stroke(); } });
  foam.repeat.set(2, 12); const fm = new THREE.Mesh(new THREE.PlaneGeometry(GX1 - GX0 - 6, 260), new THREE.MeshBasicMaterial({map: foam, transparent: true, depthWrite: false})); fm.rotation.x = -Math.PI / 2; fm.position.set((GX0 + GX1) / 2, WL - 1.0, BZ + 40); grp.add(fm);
  // wharf: quay wall, bollards, lamps, the pad
  grp.add(new THREE.Mesh(K.merge([K.box(200, 14, 2, 0, -14, 47), K.box(2, 14, 92, -100, -14, 2), K.box(2, 14, 92, 100, -14, 2)]), mats.stone));
  const bol = []; for (let x = -90; x <= 90; x += 15) bol.push(K.xform(new THREE.CylinderGeometry(0.25, 0.3, 0.8, 8), x, 0.4, 44.5)); grp.add(new THREE.Mesh(K.merge(bol), K.lamb({color: 0x2a2c2e})));
  K.pad(grp, 0, 15);
  // streets (uptown grid) and brick blocks
  const roads = [], blist = [], wl = [];
  for (let x = -210; x <= 210; x += 60) { const pts = []; for (let z = -40; z >= -430; z -= 10) pts.push([x, z]); roads.push(K.ribbon(pts, 9, land, {y: 0.06, su: 6})); }
  for (let z = -40; z >= -430; z -= 65) { const pts = []; for (let x = -240; x <= 240; x += 10) pts.push([x, z]); roads.push(K.ribbon(pts, z === -40 ? 12 : 9, land, {y: 0.07, su: 6})); }
  { const pts = []; for (let x = -100; x <= 100; x += 10) pts.push([x, 49]); }
  grp.add(new THREE.Mesh(K.merge(roads), K.lamb({map: T.asphalt(), polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2})));
  const MK = ['red', 'brown', 'buff', 'red', 'brown'];
  for (let bx = -210; bx < 210; bx += 60) for (let bz = -40; bz > -430; bz -= 65) { const x0 = bx + 6, x1 = bx + 54, z0 = bz - 6, z1 = bz - 59;
    let x = x0; while (x < x1 - 8) { const w = Math.min(x1 - x, 10 + r() * 8), lv = 3 + Math.floor(r() * (bz > -200 ? 5 : 3)), d = 16 + r() * 4;
      for (const [cz, face] of [[z0 - d / 2, 0], [z1 + d / 2, 1]]) { if (r() < 0.12) continue; const P = K.rect(x + w / 2, cz, w - 0.4, d, 0); let y0 = 1e9; for (const q of P) y0 = Math.min(y0, land(q[0], q[1])); y0 -= 0.4; const h = lv * 3.4 + 1.2, m = MK[Math.floor(r() * MK.length)];
        blist.push({p: P, y0, h, m, rm: 'roof'}); blist.push({p: K.rect(x + w / 2, cz, w + 0.2, d + 0.6, 0), y0: y0 + h, h: 0.6, m: 'stone', rm: 'roof'});   // cornice
        if (!L || r() < 0.6) for (const wv of K.winList(P, y0 + 0.4, lv, {step: L ? 4.2 : 3.0, fh: 3.4})) wl.push(wv); }
      x += w; } }
  const coll = K.blocks(grp, blist, mats); K.wins(grp, wl, {lit: 0.12, litCol: 0xffe2a8, frame: 0xe6e0d4});
  const bIdx = K.polyIndex(coll, 20); out.blocked = (x, z, y) => land(x, z) < -1 && H(x, z) < 1 || bIdx(x, z, y);
  // Reversing Falls bridge: steel arch under the deck
  { const st = K.lamb({color: 0x41524a}), parts = [K.box(GX1 - GX0 + 80, 1.2, 9.6, (GX0 + GX1) / 2, DECK - 1.2, BZ)], span = GX1 - GX0 + 20, cx = (GX0 + GX1) / 2;
    for (const s of [-1, 1]) { parts.push(K.box(GX1 - GX0 + 80, 1.1, 0.12, cx, DECK, BZ + s * 4.7)); const pts = []; for (let i = 0; i <= 24; i++) { const t = i / 24, x = cx - span / 2 + span * t; pts.push(new THREE.Vector3(x, -9 + 23 * (1 - (2 * t - 1) * (2 * t - 1)), BZ + s * 3.6)); }
      parts.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.9, 6, false)); for (let i = 2; i <= 22; i += 2) { const p = pts[i]; if (p.y < DECK - 1.5) parts.push(K.box(0.5, DECK - 1.2 - p.y, 0.5, p.x, p.y, p.z)); } }
    grp.add(new THREE.Mesh(K.merge(parts), st));
    const rocks = []; for (let i = 0; i < (L ? 30 : 70); i++) { const s = r() < 0.5 ? -1 : 1, x = s < 0 ? GX0 + 2 - r() * 10 : GX1 - 2 + r() * 10, z = -500 + r() * 560; rocks.push(K.xform(new THREE.DodecahedronGeometry(3 + r() * 5, 0), x, -6 + r() * 10, z, r() * 6, 1, 0.7 + r() * 0.8, 1)); }
    grp.add(new THREE.Mesh(K.merge(rocks), K.lamb({color: 0x595650, flatShading: true}))); }
  // lighthouse on the islet, rotating beam
  const lh = new THREE.Group(); lh.position.set(185, 1.2, 160); grp.add(lh);
  lh.add(new THREE.Mesh(new THREE.CylinderGeometry(1.7, 2.3, 14, 16).translate(0, 7, 0), K.lamb({color: 0xf1efe9})), new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.8, 2.2, 16).translate(0, 10, 0), K.lamb({color: 0xb3262a})),
    new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 0.4, 16).translate(0, 14.2, 0), K.lamb({color: 0x333333})), new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 1.8, 12).translate(0, 15.3, 0), new THREE.MeshBasicMaterial({color: 0xfff6d8})),
    new THREE.Mesh(new THREE.ConeGeometry(1.7, 1.6, 12).translate(0, 17, 0), K.lamb({color: 0xb3262a})));
  const beam = new THREE.Mesh(new THREE.ConeGeometry(6, 70, 16, 1, true).rotateZ(Math.PI / 2).translate(35, 15.3, 0), new THREE.MeshBasicMaterial({color: 0xfff3cc, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide})); lh.add(beam);
  const isl = []; for (let i = 0; i < 14; i++) { const a = i / 14 * 6.28; isl.push(K.xform(new THREE.DodecahedronGeometry(4 + r() * 3, 0), 185 + Math.cos(a) * 16, -2, 160 + Math.sin(a) * 16, r() * 6, 1, 0.6, 1)); } grp.add(new THREE.Mesh(K.merge(isl), K.lamb({color: 0x55534e, flatShading: true})));
  // fishing boats at the wharf
  const boats = []; for (const [x, z, a] of [[-50, 58, 0.1], [35, 62, -0.15], [70, 120, 1.2]]) { boats.push(K.xform(new THREE.CylinderGeometry(3, 2.2, 15, 8, 1).rotateX(Math.PI / 2).scale(1, 0.45, 1), x, WL + 0.9, z, a), K.xform(new THREE.BoxGeometry(3.4, 2.6, 4.5), x, WL + 3.2, z, a)); }
  grp.add(new THREE.Mesh(K.merge(boats), K.lamb({color: 0x2e5874})));
  // conifers on the hills
  const tr = []; for (let i = 0; i < (L ? 260 : 700); i++) { const x = -650 + r() * 1300, z = -650 + r() * 700; if ((Math.abs(x) < 250 && z > -440) || (x > GX0 - 4 && x < GX1 + 4) || land(x, z) < 0.5) continue; tr.push([x, land(x, z), z, 0.8 + r() * 0.7]); }
  K.trees(grp, tr, {conifer: true, leaf: [0x2f4a33, 0x3a5638, 0x2b4430]});
  K.sky(grp, {top: 0x9fb0bd, horizon: 0xbcc5ca, sun: [0.5, 0.5, 0.8], sunCol: 0xe6e8e6, glow: 0.4});
  K.lights(grp, {sky: 0xdfe6ea, ground: 0x4d5448, hi: 1.2, si: 0.45, dx: 80, dy: 150, dz: 160});
  out.tick = (t, dt) => { sea.userData.flow.offset.x += dt * 0.000004; riv.userData.flow.offset.y += dt * 0.00006; foam.offset.y -= dt * 0.0004; beam.parent.rotation.y += dt * 0.0006; };
  return out;
};
})();
