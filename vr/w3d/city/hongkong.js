/* Hong Kong (procedural impression, not a map): the landing pad on the Kowloon-side promenade, Victoria Harbour at
   dusk, a dense lit island skyline with stylised IFC and Bank of China shapes, the Peak behind, neon on the Kowloon
   blocks, a red-sail junk and a green-and-white harbour ferry. Harbour to the south (+z). */
(function () {
'use strict';
W3D.cityModules.hongkong = (grp, K) => {
  const L = K.LITE, r = K.rnd(57), WL = -1.6, T = K.tex, S0 = 36, S1 = 930;   // Kowloon shore z=36, island shore z=930
  const peak = (x, z) => z < S1 ? 0 : Math.max(0, 560 * Math.exp(-((x + 150) * (x + 150)) / (2 * 900 * 900)) * Math.min(1, Math.max(0, (z - 1180) / 420)) + (z - S1) * 0.02 + 40 * Math.sin(x * 0.004) * Math.min(1, Math.max(0, (z - 1300) / 300)));
  const land = (x, z) => (z > S0 && z < S1) ? -9 : z >= S1 ? 1 + peak(x, z) : 0;
  const out = {R: 4000, ground: land, fog: L ? [0x56446c, 320, 2800] : [0x56446c, 400, 3600], sky: 0x56446c};
  K.heightMesh(grp, 2200, L ? 80 : 50, land, K.lamb({vertexColors: true}), (x, z, y) => y < -1 ? [0.12, 0.12, 0.15] : z > S1 + 300 ? [0.12 + y * 0.0001, 0.2, 0.14] : [0.3, 0.3, 0.33], 2600);
  const sea = K.water(grp, 0, (S0 + S1) / 2, 6000, S1 - S0 + 40, WL, '#1d2440', 'rgba(255,190,140,0.18)');
  K.pad(grp, 0, 15);
  // promenade railing
  const rails = []; for (let x = -600; x <= 600; x += 3) rails.push(K.box(0.08, 1.1, 0.08, x, 0, S0 - 1)); rails.push(K.box(1200, 0.07, 0.07, 0, 1.06, S0 - 1)); grp.add(new THREE.Mesh(K.merge(rails), K.lamb({color: 0x9aa3ad})));
  // towers: lit window textures as emissive maps
  const wt = [T.windows({nx: 4, ny: 6, wall: '#2a2f3a', glass: '#151b26', lit: 0.55, seed: 1}), T.windows({nx: 5, ny: 7, wall: '#3a3b44', glass: '#181c26', lit: 0.45, seed: 2}), T.windows({nx: 3, ny: 6, wall: '#6a6e78', glass: '#1b2230', lit: 0.6, seed: 3})];
  const mats = {}; wt.forEach((t, i) => { mats['t' + i] = new THREE.MeshLambertMaterial({map: t, emissiveMap: t, emissive: 0xffe2b0, emissiveIntensity: 0.6}); }); mats.roof = K.lamb({color: 0x24262d});
  const list = [];
  const NI = L ? 70 : 150; for (let i = 0; i < NI; i++) { const x = -1100 + r() * 2200, z = S1 + 30 + r() * (180 + 120 * Math.exp(-x * x / 4e5)), cx = Math.abs(x + 100) < 500 ? 1 : 0.6, h = (40 + r() * 150) * cx + (r() < 0.12 ? 100 : 0); if (Math.hypot(x + 250, z - S1 - 70) < 50 || Math.hypot(x - 150, z - S1 - 150) < 50) continue;
    list.push({p: K.rect(x, z, 18 + r() * 16, 18 + r() * 16, (r() - 0.5) * 0.4), y0: land(x, z) - 2, h, m: 't' + (i % 3), rm: 'roof', su: 10, sv: 16}); }
  const kStart = list.length, NK = L ? 40 : 90; for (let i = 0; i < NK; i++) { const x = -900 + r() * 1800, z = -60 - r() * 600; if (Math.abs(x) < 70 && z > -140) continue; list.push({p: K.rect(x, z, 16 + r() * 14, 16 + r() * 14, 0), y0: -1, h: 25 + r() * 80, m: 't' + ((i + 1) % 3), rm: 'roof', su: 10, sv: 16}); }
  const coll = K.blocks(grp, list, mats); const bIdx = K.polyIndex(coll, 40); out.blocked = (x, z, y) => land(x, z) < -1 || bIdx(x, z, y);
  // IFC-style tower: tapering setbacks and a crown of fins
  { const x = -250, z = S1 + 70, y = land(x, z), m = new THREE.MeshLambertMaterial({map: wt[2], emissiveMap: wt[2], emissive: 0xdfe8ff, emissiveIntensity: 0.8}), g = []; let yy = y;
    for (const [w, h] of [[56, 250], [52, 50], [48, 40], [44, 30], [40, 20]]) { const P = K.rect(x, z, w, w, 0).map((p, i) => p); const oc = []; for (let i = 0; i < 4; i++) { const a = P[i], b = P[(i + 1) % 4]; oc.push([a[0] + (b[0] - a[0]) * 0.12, a[1] + (b[1] - a[1]) * 0.12], [a[0] + (b[0] - a[0]) * 0.88, a[1] + (b[1] - a[1]) * 0.88]); } g.push(K.prism(oc, yy, h, {su: 10, sv: 16})); yy += h; }
    grp.add(new THREE.Mesh(K.merge(g), m)); const fins = []; for (const [dx, dz] of [[-16, -16], [16, -16], [-16, 16], [16, 16]]) fins.push(K.xform(new THREE.BoxGeometry(5, 34, 5), x + dx, yy + 17, z + dz, Math.PI / 4)); grp.add(new THREE.Mesh(K.merge(fins), K.lamb({color: 0xdfe3ea, emissive: 0x3a4152}))); }
  // Bank of China-style tower: four triangular shafts of different heights, X-bracing, twin masts
  { const x = 150, z = S1 + 150, y = land(x, z), s = 26, c = [[x - s, z - s], [x + s, z - s], [x + s, z + s], [x - s, z + s]], o = [x, z], gm = new THREE.MeshLambertMaterial({color: 0x56708c, emissive: 0x1a2a40}), g = [], lines = [];
    const hs = [300, 250, 190, 140]; for (let i = 0; i < 4; i++) { const tri = [c[i], c[(i + 1) % 4], o]; g.push(K.prism(tri, y, hs[i]), K.cap(tri, y + hs[i]));
      const a = c[i], b = c[(i + 1) % 4]; for (let k = 0; k < hs[i] - 40; k += 52) lines.push(a[0], y + k, a[1], b[0], y + k + 52, b[1], b[0], y + k, b[1], a[0], y + k + 52, a[1], a[0], y + k, a[1], b[0], y + k, b[1]); }
    grp.add(new THREE.Mesh(K.merge(g), gm)); for (const dx of [-6, 6]) grp.add(new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.9, 60, 6).translate(x + dx, y + 330, z - s / 2), K.lamb({color: 0xcfd6de})));
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3)); grp.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({color: 0xf1f5ff}))); }
  // neon signs on the Kowloon blocks behind the promenade (abstract glyph boards, no words)
  const neon = K.ctex(512, 512, (g, w, h) => { const rr = K.rnd(12), cs = ['#ff3b8d', '#33e6ff', '#ffe14a', '#7cff6b', '#ff7a2e', '#c46bff']; g.fillStyle = '#0d0b14'; g.fillRect(0, 0, w, h);
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { const x0 = i * 128 + 10, y0 = j * 128 + 10; g.strokeStyle = cs[Math.floor(rr() * cs.length)]; g.lineWidth = 6; g.shadowColor = g.strokeStyle; g.shadowBlur = 12; g.strokeRect(x0, y0, 108, 108);
      for (let k = 0; k < 5; k++) { g.beginPath(); const a = x0 + 18 + rr() * 70, b = y0 + 18 + rr() * 70; g.moveTo(a, b); g.lineTo(a + (rr() - 0.5) * 60, b + (rr() - 0.5) * 60); g.lineTo(a + (rr() - 0.5) * 60, b + (rr() - 0.5) * 60); g.stroke(); } } });
  neon.wrapS = neon.wrapT = THREE.ClampToEdgeWrapping; const NS = L ? 30 : 70, ng = [];
  for (let i = 0; i < NS; i++) { if (list.length <= kStart) break; const b = list[kStart + Math.floor(r() * (list.length - kStart))]; if (b.h < 24) continue; const P = b.p, cx = (P[0][0] + P[2][0]) / 2, zf = Math.max(P[0][1], P[2][1]) + 0.3, u = Math.floor(r() * 4), v = Math.floor(r() * 4), q = new THREE.PlaneGeometry(4 + r() * 4, 8 + r() * 10);
    const uv = q.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, (u + uv.getX(k)) / 4, (v + uv.getY(k)) / 4); q.translate(cx + (r() - 0.5) * 10, b.y0 + 8 + r() * Math.min(30, b.h - 20), zf); ng.push(q); }
  if (ng.length) grp.add(new THREE.Mesh(K.merge(ng), new THREE.MeshBasicMaterial({map: neon, side: THREE.DoubleSide, fog: true})));
  // red-sail junk and a harbour ferry, moving
  const junk = new THREE.Group(); junk.add(new THREE.Mesh(K.merge([K.xform(new THREE.CylinderGeometry(2.6, 1.6, 20, 8).rotateX(Math.PI / 2).scale(1, 0.45, 1), 0, 0.6, 0), K.box(4.6, 1.6, 5, 0, 1.2, -7.5)]), K.lamb({color: 0x5a3622})));
  const sailT = K.ctex(128, 256, (g, w, h) => { g.fillStyle = '#b8241f'; g.fillRect(0, 0, w, h); g.strokeStyle = '#3a1a10'; g.lineWidth = 4; for (let y = 16; y < h; y += 28) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y + 10); g.stroke(); } });
  const sm = new THREE.MeshLambertMaterial({map: sailT, side: THREE.DoubleSide, emissive: 0x401010}); for (const [z, hh, w] of [[5, 14, 8], [-1, 17, 10], [-6, 10, 6]]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, hh), sm); p.position.set(0, 2 + hh / 2, z); p.rotation.y = Math.PI / 2 - 0.35; junk.add(p); }
  grp.add(junk);
  const ferry = new THREE.Group(); ferry.add(new THREE.Mesh(K.box(8, 2.6, 34, 0, 0, 0), K.lamb({color: 0x23644a})), new THREE.Mesh(K.box(7.4, 2.4, 30, 0, 2.6, 0), K.lamb({color: 0xf0f0ea, emissive: 0x333022})), new THREE.Mesh(K.box(7.6, 0.3, 31, 0, 5, 0), K.lamb({color: 0x23644a}))); grp.add(ferry);
  K.sky(grp, {top: 0x17183a, horizon: 0x5e4870, below: 0x2a2440, sun: [-1, 0.03, 0.25], sunCol: 0xff9a6a, glow: 0.7});
  K.lights(grp, {sky: 0x8d86c4, ground: 0x2a2433, hi: 0.75, si: 0.45, dx: -600, dy: 120, dz: 300, sun: 0xffa772});
  out.tick = (t, dt) => { sea.userData.flow.offset.x += dt * 0.000005; const a = t * 0.00002; junk.position.set(Math.sin(a) * 500, WL - 0.2, 360 + Math.cos(a * 0.7) * 80); junk.rotation.y = Math.cos(a) > 0 ? Math.PI / 2 : -Math.PI / 2;
    const f = (Math.sin(t * 0.000025) + 1) / 2; ferry.position.set(300, WL - 0.4, S0 + 40 + f * (S1 - S0 - 80)); ferry.rotation.y = 0; };
  out.tick(0, 0);
  return out;
};
})();
