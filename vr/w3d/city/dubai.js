/* Dubai saucer landing: Downtown Dubai around the Burj Khalifa and the fountain lake. Landing pad on the open lawn just south-west
   of the tower, beside the lake. Building footprints and heights (and the Burj's stepped building parts) from Overture Maps
   Foundation (buildings theme, release 2026-11-18, ODbL; OpenStreetMap + Microsoft footprints); roads, water and land use from
   Overture transportation/base themes (OpenStreetMap contributors, ODbL). The Burj spire above 760 m (to 828 m) is modelled.
   The fountain plays jets in the lake. No names are shown. Local frame: pad centre = (0, 0, 0), north = -z. */
(function () {
'use strict';
W3D.cityModules.dubai = (grp, K) => fetch('/vr/w3d/city/dubai.json?v=2').then(r => r.json()).then(D => build(grp, K, D));
function build(grp, K, D) {
  const L = K.LITE, R = D.R, r = K.rnd(31), T = K.tex;
  const out = {R: R + 300, ground: () => 0, fog: L ? [0xd6cdbb, 350, 2800] : [0xd6cdbb, 500, 4600], sky: 0xd6cdbb};
  K.sky(grp, {top: 0x6f9bc8, horizon: 0xe2d6bd, below: 0xd6cdbb, sun: [0.5, 0.55, 0.35], sunCol: 0xfff1d0});
  K.lights(grp, {sky: 0xe9eef3, ground: 0x8a7a5e, hi: 1.05, sun: 0xfff0d6, si: 1.0, dx: 160, dy: 220, dz: 90});
  // ground: one land-tint texture (paving/sand, asphalt roads, gardens, construction sites), water drawn as meshes
  const TS = L ? 1024 : 2048, P2 = p => [(p[0] + R) / (2 * R) * TS, (p[1] + R) / (2 * R) * TS], px = TS / (2 * R);
  const RW = {motorway: 24, trunk: 20, primary: 16, secondary: 12, tertiary: 9, residential: 7, unclassified: 7, service: 5, footway: 2.5, steps: 2.5, cycleway: 2.5, unknown: 5};
  const land = K.ctex(TS, TS, c => { c.fillStyle = '#cbbd9f'; c.fillRect(0, 0, TS, TS);
    const poly = p => { c.beginPath(); p.forEach((q, i) => { const s = P2(q); i ? c.lineTo(s[0], s[1]) : c.moveTo(s[0], s[1]); }); c.closePath(); };
    for (const a of D.a) { c.fillStyle = a.k === 'green' ? '#6f8f4a' : '#b9a684'; poly(a.p); c.fill(); }
    c.lineCap = c.lineJoin = 'round';
    for (const pass of [0, 1]) for (const rd of D.r) { const w = RW[rd.k] || 5, foot = w < 3; if (pass === 0 && foot) continue; if (pass === 1 && !foot) continue;
      c.strokeStyle = foot ? '#e2d8c4' : w > 14 ? '#4e5052' : '#5d5f61'; c.lineWidth = Math.max(1, w * px); c.beginPath(); rd.p.forEach((q, i) => { const s = P2(q); i ? c.lineTo(s[0], s[1]) : c.moveTo(s[0], s[1]); }); c.stroke(); }
    const rr = K.rnd(4); for (let i = 0; i < TS * 4; i++) { c.fillStyle = 'rgba(' + (rr() < 0.5 ? '120,105,80' : '240,230,210') + ',' + rr() * 0.06 + ')'; c.fillRect(rr() * TS, rr() * TS, 2, 2); } });
  land.wrapS = land.wrapT = THREE.ClampToEdgeWrapping;
  const gseg = L ? 24 : 48;   // subdivided: huge triangles fog to a flat colour with the log depth buffer
  const gnd = new THREE.Mesh(new THREE.PlaneGeometry(2 * R, 2 * R, gseg, gseg), K.lamb({map: land})); gnd.rotation.x = -Math.PI / 2; gnd.name = 'dubai-ground'; grp.add(gnd);
  const far = new THREE.Mesh(new THREE.RingGeometry(R - 20, 14000, L ? 48 : 96, L ? 8 : 16), K.lamb({color: 0xcdbf9f})); far.rotation.x = -Math.PI / 2; far.position.y = -0.9; grp.add(far);
  const sq = new THREE.Mesh(new THREE.PlaneGeometry(2 * R + 200, 2 * R + 200, 16, 16), K.lamb({color: 0xcdbf9f})); sq.rotation.x = -Math.PI / 2; sq.position.y = -0.6; grp.add(sq);
  // water: lake, canal, pools (own triangulation, not merged caps)
  const wv = []; for (const w of D.w) { const Hs = (w.h || []).map(h => K.ccw(h).slice().reverse()), P0 = K.ccw(w.p), P = P0.concat(...Hs), v2 = a => a.map(p => new THREE.Vector2(p[0], p[1])), tr = THREE.ShapeUtils.triangulateShape(v2(P0), Hs.map(v2)), y = w.k === 'swimming_pool' ? 0.25 : 0.06;
    for (const t of tr) for (const k of [t[0], t[2], t[1]]) wv.push(P[k][0], y, P[k][1]); }
  const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(wv, 3)); wg.computeVertexNormals();
  const wt = T.water ? T.water('#3f6f80', 'rgba(220,240,245,0.14)') : null; if (wt) wt.repeat.set(1, 1);
  const uvw = new Float32Array(wv.length / 3 * 2); for (let i = 0, j = 0; i < wv.length; i += 3, j += 2) { uvw[j] = wv[i] / 30; uvw[j + 1] = wv[i + 2] / 30; } wg.setAttribute('uv', new THREE.BufferAttribute(uvw, 2));
  const wm = new THREE.Mesh(wg, K.std({map: wt, color: wt ? 0xffffff : 0x3f6f80, roughness: 0.18, metalness: 0.05, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2})); wm.name = 'dubai-water'; grp.add(wm);
  // buildings: glass towers (>= 45 m) and low-rise blocks, walls + roofs merged per material
  let B = D.b; if (L) B = B.filter(b => b.t || b.h >= 8 || Math.abs(K.area(b.p)) > 150);
  const glassA = T.windows({nx: 4, ny: 6, wall: '#7f8c96', glass: '#35505f', lit: 0.04, seed: 11}), glassB = T.windows({nx: 5, ny: 6, wall: '#a9a397', glass: '#3d4d58', lit: 0.04, seed: 23});
  const lowT = T.windows({nx: 3, ny: 3, wall: '#d8ccb4', glass: '#4a545a', lit: 0.02, seed: 5});
  const mats = {ga: K.lamb({map: glassA}), gb: K.lamb({map: glassB}), lo: K.lamb({map: lowT}), roof: K.lamb({color: 0xb8b1a3}), burj: K.std({map: T.windows({nx: 6, ny: 8, wall: '#c9ced3', glass: '#5d7686', lit: 0.02, seed: 3}), roughness: 0.35, metalness: 0.4})};
  const list = [];
  for (const b of B) { const burj = b.t && b.h > 300 && Math.hypot(b.p[0][0] - 100, b.p[0][1] + 229) < 80;
    const m = burj ? 'burj' : b.k === 'g' ? (r() < 0.55 ? 'ga' : 'gb') : 'lo'; list.push({p: b.p, y0: b.y, h: Math.max(3, b.h - b.y), m, rm: burj ? 'burj' : 'roof', su: m === 'lo' ? 3.4 : 3.2, sv: 3.6}); }
  const coll = K.blocks(grp, list, mats);
  // Burj Khalifa spire (760 -> 828 m) and its crown
  { const sp = new THREE.Mesh(K.merge([K.xform(new THREE.CylinderGeometry(0.6, 3.2, 68, 10), 100, 760 + 34, -229), K.xform(new THREE.CylinderGeometry(3.4, 4.2, 6, 12), 100, 757, -229)]), mats.burj); sp.name = 'dubai-spire'; grp.add(sp);
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.9, 8, 6), new THREE.MeshBasicMaterial({color: 0xff4030})); beacon.position.set(100, 828.5, -229); grp.add(beacon); out.beacon = beacon; }
  // fountain: rows of jets in the lake that pulse in sequence
  const jets = []; const lake = D.lake; if (lake) { let cx = 0, cz = 0; lake.forEach(p => { cx += p[0]; cz += p[1]; }); cx /= lake.length; cz /= lake.length;
    for (let i = 0; i < (L ? 24 : 60); i++) { const a = i / (L ? 24 : 60), x = cx - 120 + a * 240, z = cz + Math.sin(a * Math.PI * 3) * 22; if (!K.inPoly(x, z, lake)) continue; jets.push([x, z, a]); } }
  let jetM = null; if (jets.length) { const jg = new THREE.ConeGeometry(1.1, 1, 8, 1, true); jg.translate(0, 0.5, 0);
    jetM = new THREE.InstancedMesh(jg, new THREE.MeshBasicMaterial({color: 0xf4f8fa, transparent: true, opacity: 0.72, depthWrite: false}), jets.length); jetM.frustumCulled = false; jetM.name = 'dubai-fountain'; grp.add(jetM); }
  // palms along the lake promenade and in gardens
  const tl = []; if (lake) { for (let i = 0; i < lake.length; i += 2) { const p = lake[i]; tl.push([p[0] + (r() - 0.5) * 6, 0, p[1] + (r() - 0.5) * 6, 0.8 + r() * 0.3]); } }
  for (const a of D.a) { if (a.k !== 'green' || tl.length > (L ? 200 : 700)) continue; let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const q of a.p) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); z0 = Math.min(z0, q[1]); z1 = Math.max(z1, q[1]); }
    const n = Math.min(30, Math.floor((x1 - x0) * (z1 - z0) / 900)); for (let i = 0; i < n; i++) { const x = x0 + r() * (x1 - x0), z = z0 + r() * (z1 - z0); if (K.inPoly(x, z, a.p)) tl.push([x, 0, z, 0.7 + r() * 0.4]); } }
  const ti = K.polyIndex(coll, 25); const trees = tl.filter(t => Math.hypot(t[0], t[2]) > 20 && !ti(t[0], t[2], 0.5));
  if (trees.length && K.trees) K.trees(grp, trees, {leaf: [0x5d7a3a, 0x6b8744]});
  K.pad(grp, 0, 15);
  out.blocked = (x, z, y) => ti(x, z, y);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), s = new THREE.Vector3();
  out.tick = (t) => { if (out.beacon) out.beacon.visible = Math.floor(t / 900) % 2 === 0;
    if (!jetM) return; const T0 = t / 1000; for (let i = 0; i < jets.length; i++) { const [x, z, a] = jets[i], ph = (T0 * 0.35 + a * 1.5) % 1, h = 4 + 46 * Math.pow(Math.sin(Math.PI * Math.min(1, ph * 1.6)), 2) * (0.6 + 0.4 * Math.sin(T0 * 0.7 + a * 9));
      m4.compose(v.set(x, 0.1, z), q, s.set(1, h, 1)); jetM.setMatrixAt(i, m4); } jetM.instanceMatrix.needsUpdate = true; };
  out.info = {buildings: B.length, trees: trees.length, jets: jets.length};
  return out;
}
})();
