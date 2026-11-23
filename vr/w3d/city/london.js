/* London saucer landing (item 20): the open recreation-ground field beside a hospital campus in east London.
   All 3D and open data: building footprints, roads, paths, fences, hedges, trees and land use from OpenStreetMap
   (c) OpenStreetMap contributors, ODbL; ground elevation from EU-DEM 25 m (Copernicus, via OpenTopoData).
   Buildings are extruded footprints with modelled window frames, sills and roofs; terraced houses fill residential
   streets where OSM has no footprints. No names are shown anywhere in the scene. Local frame: pad centre = (0, 0, 0). */
(function () {
'use strict';
W3D.cityModules.london = (grp, K) => fetch('/vr/w3d/city/london.json?v=1').then(r => r.json()).then(D => build(grp, K, D));
function build(grp, K, D) {
  const L = K.LITE, R = 470, out = {R: 3000, fog: L ? [0xc3c9cf, 90, 560] : [0xc3c9cf, 120, 680], sky: 0xc6ccd2};
  const r = K.rnd(42), UP = new THREE.Vector3(0, 1, 0);
  // ---------- terrain (EU-DEM, relative to the pad) ----------
  const g = D.g, n = g.n;
  const raw = (x, z) => { const fx = Math.max(0, Math.min(n - 1.001, (x - g.x0) / g.s)), fz = Math.max(0, Math.min(n - 1.001, (z - g.z0) / g.s)), i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, h = (a, b) => g.h[b * n + a];
    return (h(i, j) * (1 - u) + h(i + 1, j) * u) * (1 - v) + (h(i, j + 1) * (1 - u) + h(i + 1, j + 1) * u) * v; };
  const H = (x, z) => { const d = Math.hypot(x, z), k = d < 20 ? 0 : d > 34 ? 1 : (d - 20) / 14; return raw(x, z) * (k * k * (3 - 2 * k)); };   // pad levelled
  out.ground = H;
  const GS = L ? 10 : 5, GN = Math.round(2 * R / GS) + 1, gp = new Float32Array(GN * GN * 3), guv = new Float32Array(GN * GN * 2), gi = [];
  for (let j = 0; j < GN; j++) for (let i = 0; i < GN; i++) { const x = -R + i * GS, z = -R + j * GS, k = j * GN + i; gp[k * 3] = x; gp[k * 3 + 1] = H(x, z); gp[k * 3 + 2] = z; guv[k * 2] = i / (GN - 1); guv[k * 2 + 1] = 1 - j / (GN - 1); if (i && j) gi.push(k - GN - 1, k - 1, k - GN, k - GN, k - 1, k); }
  const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.BufferAttribute(gp, 3)); gg.setAttribute('uv', new THREE.BufferAttribute(guv, 2)); gg.setIndex(gi); gg.computeVertexNormals();
  // land-use colour map (open data) x fine grass detail
  const TS = L ? 512 : 1024, P2 = p => [(p[0] + R) / (2 * R) * TS, (p[1] + R) / (2 * R) * TS];
  const COL = {grass: '#7f9a57', recreation_ground: '#7a9a52', pitch: '#6a9748', park: '#7f9a57', meadow: '#8c9c58', wood: '#4c6233', forest: '#4c6233', scrub: '#69763f', residential: '#8b9470', allotments: '#8a8c55', brownfield: '#9a8f75', parking: '#5b5e62', farmland: '#94965e', village_green: '#7f9a57', playground: '#a08f70', cemetery: '#7a8f57', garden: '#7c9452'};
  const ord = ['residential', 'brownfield', 'farmland', 'meadow', 'grass', 'park', 'village_green', 'cemetery', 'garden', 'recreation_ground', 'allotments', 'scrub', 'wood', 'forest', 'pitch', 'playground', 'parking'];
  const land = K.ctex(TS, TS, c => { c.fillStyle = '#86965f'; c.fillRect(0, 0, TS, TS);
    D.a.slice().sort((a, b) => ord.indexOf(a.k) - ord.indexOf(b.k)).forEach(a => { if (!COL[a.k]) return; c.fillStyle = COL[a.k]; c.beginPath(); a.p.forEach((p, i) => { const q = P2(p); i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); }); c.closePath(); c.fill();
      if (a.k === 'pitch') { c.strokeStyle = 'rgba(245,245,235,0.85)'; c.lineWidth = Math.max(1, TS / 940 * 0.15); c.stroke(); }
      if (a.k === 'allotments') { c.save(); c.clip(); c.strokeStyle = 'rgba(90,70,40,0.35)'; c.lineWidth = 2; for (let i = 0; i < TS; i += 6) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, TS); c.stroke(); } c.restore(); } });
    const rr = K.rnd(5); for (let i = 0; i < TS * 6; i++) { c.fillStyle = 'rgba(' + (rr() < 0.5 ? '40,50,20' : '160,170,110') + ',' + (rr() * 0.07) + ')'; c.fillRect(rr() * TS, rr() * TS, 3, 3); } });
  land.wrapS = land.wrapT = THREE.ClampToEdgeWrapping;
  const det = K.tex.grass(); det.colorSpace = THREE.NoColorSpace;
  const gm = K.lamb({map: land});
  gm.onBeforeCompile = sh => { sh.uniforms.uDet = {value: det}; sh.fragmentShader = 'uniform sampler2D uDet;\n' + sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n diffuseColor.rgb *= 0.55 + 0.9 * texture2D(uDet, vMapUv * ' + (2 * R / 1.6).toFixed(1) + ').g;'); };
  grp.add(new THREE.Mesh(gg, gm));
  const skirt = new THREE.Mesh(new THREE.RingGeometry(R - 5, 4000, 48, 16), K.lamb({color: 0x7f8f5e})); skirt.rotation.x = -Math.PI / 2; skirt.position.y = raw(R, 0) - 0.4; grp.add(skirt);
  // ---------- roads, pavements, kerbs, markings ----------
  const W = {trunk: 12, primary: 10, secondary: 9, tertiary: 8, unclassified: 6, residential: 6.5, service: 4, living_street: 5, track: 3, footway: 1.8, path: 1.6, cycleway: 2, pedestrian: 3, steps: 1.6};
  const roadG = [], paveG = [], kerbG = [], markG = [];
  const kerbWall = (pts, off, y0, y1) => { const pos = []; for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, nx = -dz / l * off, nz = dx / l * off;
      const A = [a[0] + nx, a[1] + nz], B = [b[0] + nx, b[1] + nz], ha = H(A[0], A[1]), hb = H(B[0], B[1]); pos.push(A[0], ha + y0, A[1], B[0], hb + y0, B[1], B[0], hb + y1, B[1], A[0], ha + y0, A[1], B[0], hb + y1, B[1], A[0], ha + y1, A[1]); }
    const k = new THREE.BufferGeometry(); k.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); k.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(pos.length / 3 * 2), 2)); k.computeVertexNormals(); return k; };
  const dens = pts => { const o = [pts[0]]; for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]), k = Math.ceil(l / 6); for (let s = 1; s <= k; s++) o.push([a[0] + (b[0] - a[0]) * s / k, a[1] + (b[1] - a[1]) * s / k]); } return o; };
  const lampPts = [], roads = D.r.filter(rd => W[rd.k]);
  roads.forEach(rd => { const w = W[rd.k], pts = dens(rd.p), foot = w < 2.5 && rd.k !== 'track';
    if (foot) { paveG.push(K.ribbon(pts, w, H, {y: 0.07, su: 2})); return; }
    const yr = rd.k === 'secondary' ? 0.06 : rd.k === 'service' ? 0.04 : 0.05;
    roadG.push(K.ribbon(pts, w, H, {y: yr, su: 6}));
    if (rd.k === 'service' || rd.k === 'track') return;
    for (const s of [-1, 1]) { paveG.push(K.ribbon(pts, 2.2, H, {y: 0.16, off: s * (w / 2 + 1.25), su: 2})); kerbG.push(K.ribbon(pts, 0.22, H, {y: 0.17, off: s * (w / 2 + 0.1), su: 2})); kerbG.push(kerbWall(pts, s * (w / 2), yr, 0.17)); }
    let acc = 0; for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]); acc += l; if (acc % 9 < 6 && l > 0.5) { const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], q = new THREE.PlaneGeometry(0.13, Math.min(3, l)); q.rotateX(-Math.PI / 2); q.rotateY(Math.atan2(b[0] - a[0], b[1] - a[1])); q.translate(m[0], H(m[0], m[1]) + yr + 0.015, m[1]); markG.push(q); } }
    if (rd.n) for (const s of [-1, 1]) markG.push(K.ribbon(pts, 0.1, H, {y: yr + 0.012, off: s * (w / 2 - 0.35)}));   // the main lane: edge lines too
    let la = 0; for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]); la += l; if (la > 34 && l > 0.1) { la = 0; const dx = (b[0] - a[0]) / l, dz = (b[1] - a[1]) / l, s = lampPts.length % 2 ? 1 : -1, o = w / 2 + 0.55; lampPts.push([b[0] - dz * o * s, b[1] + dx * o * s, Math.atan2(dz * s, -dx * s)]); } }
  });
  const path = dens(D.path); paveG.push(K.ribbon(path, 2.4, H, {y: 0.09, su: 2})); for (const s of [-1, 1]) kerbG.push(K.ribbon(path, 0.12, H, {y: 0.12, off: s * 1.26}));   // field footpath to the entrance
  const po = f => ({polygonOffset: true, polygonOffsetFactor: f, polygonOffsetUnits: f, side: THREE.DoubleSide});
  if (roadG.length) grp.add(new THREE.Mesh(K.merge(roadG), K.lamb(Object.assign({map: K.tex.asphalt()}, po(-2)))));
  if (paveG.length) grp.add(new THREE.Mesh(K.merge(paveG), K.lamb(Object.assign({map: K.tex.paving()}, po(-3)))));
  if (kerbG.length) grp.add(new THREE.Mesh(K.merge(kerbG), K.lamb({map: K.tex.paving([200, 198, 192]), side: THREE.DoubleSide})));
  if (markG.length) grp.add(new THREE.Mesh(K.merge(markG), new THREE.MeshBasicMaterial(Object.assign({color: 0xe9e9e2}, po(-4)))));
  // ---------- buildings ----------
  const bbox = P => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const q of P) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); z0 = Math.min(z0, q[1]); z1 = Math.max(z1, q[1]); } return [x0, x1, z0, z1]; };
  const nearRoad = (x, z, m) => { for (const rd of roads) { const w = W[rd.k]; if (w < 2.5) continue; for (let i = 1; i < rd.p.length; i++) { const a = rd.p[i - 1], b = rd.p[i], dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / l2)); if (Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t) < w / 2 + m) return true; } } return false; };
  // roof blink fix: 58 of the 100 OSM footprints overlap another one (building + building:part outlines, none height-tagged), so both
  // got the same default height and their roof caps / parapets were coplanar and z-fought (log depth makes polygonOffset useless).
  // Drop a footprint that lies mostly inside a bigger one with no height of its own, and give every building a tiny distinct
  // roof-height step so no two caps can ever share a plane.
  const ovl = (a, c) => Math.max(0, Math.min(a[1], c[1]) - Math.max(a[0], c[0])) * Math.max(0, Math.min(a[3], c[3]) - Math.max(a[2], c[2]));
  const bbs = D.b.map(b => bbox(b.p)), bar = bb => (bb[1] - bb[0]) * (bb[3] - bb[2]);
  const keep = D.b.map((b, i) => !(b.h || b.lv) ? !bbs.some((o, j) => j !== i && bar(o) > bar(bbs[i]) && ovl(o, bbs[i]) > 0.6 * bar(bbs[i]) && K.inPoly((bbs[i][0] + bbs[i][1]) / 2, (bbs[i][2] + bbs[i][3]) / 2, D.b[j].p)) : true);
  const blds = D.b.filter((b, i) => keep[i]).map((b, i) => ({p: b.p, k: b.k, lv: b.lv, h: b.h, eps: (i % 9) * 0.07})), occ = blds.map(b => bbox(b.p));
  const nOSM = blds.length; W3D.londonDeduped = D.b.length - nOSM;
  const free = P => { const bb = bbox(P), c = [(bb[0] + bb[1]) / 2, (bb[2] + bb[3]) / 2]; for (let i = 0; i < occ.length; i++) { const o = occ[i]; if (bb[0] < o[1] + 1 && bb[1] > o[0] - 1 && bb[2] < o[3] + 1 && bb[3] > o[2] - 1) { if (i >= nOSM) return false; if (K.inPoly(c[0], c[1], blds[i].p) || P.some(q => K.inPoly(q[0], q[1], blds[i].p))) return false; } } return true; };
  // terraced houses along residential streets where OSM has no footprints
  const resPolys = D.a.filter(a => a.k === 'residential').map(a => a.p); let nh = 0; const HMAX = L ? 170 : 380;
  roads.filter(rd => rd.k === 'residential' || rd.k === 'unclassified').forEach(rd => { for (let i = 1; i < rd.p.length && nh < HMAX; i++) { const a = rd.p[i - 1], b = rd.p[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l < 12) continue; const dx = (b[0] - a[0]) / l, dz = (b[1] - a[1]) / l;
      for (const s of [-1, 1]) for (let t = 6; t < l - 6 && nh < HMAX; t += 6.2) { const off = W[rd.k] / 2 + 9, cx = a[0] + dx * t - dz * off * s, cz = a[1] + dz * t + dx * off * s; if (Math.abs(cx) > R - 10 || Math.abs(cz) > R - 10 || Math.hypot(cx, cz) < 40) continue;
        if (!resPolys.some(P => K.inPoly(cx, cz, P))) continue; const P = [[-2.85, -4.8], [2.85, -4.8], [2.85, 4.8], [-2.85, 4.8]].map(([u, v]) => [cx + dx * u - dz * v * s, cz + dz * u + dx * v * s]);
        if (!free(P) || nearRoad(cx, cz, 4.4)) continue; blds.push({p: P, k: 'terrace', lv: 2, gen: 1, rang: Math.atan2(dz, dx)}); occ.push(bbox(P)); nh++; } } });
  const T = K.tex, mats = {red: K.lamb({map: T.brick([142, 64, 46]), side: THREE.DoubleSide}), buff: K.lamb({map: T.brick([190, 160, 112], '#c9bfae'), side: THREE.DoubleSide}), brown: K.lamb({map: T.brick([120, 74, 52]), side: THREE.DoubleSide}), render: K.lamb({map: T.render('#e6e1d6'), side: THREE.DoubleSide}), tiles: K.lamb({map: T.tiles([96, 52, 42]), side: THREE.DoubleSide}), slate: K.lamb({map: T.tiles([70, 74, 80]), side: THREE.DoubleSide}), flat: K.lamb({map: T.render('#4c4f52'), side: THREE.DoubleSide})};
  const geo = {red: [], buff: [], brown: [], render: [], tiles: [], slate: [], flat: []}, coll = [], win = [], ENT = D.ent;
  const winStep = L ? 4.6 : 3.4, winR = L ? 300 : 470;
  blds.forEach(b => {
    const P = K.ccw(b.p), A = Math.abs(K.area(P)); if (A < 6) return;
    let y0 = 1e9; for (const q of P) y0 = Math.min(y0, H(q[0], q[1])); y0 -= 0.3;
    const modern = !b.gen && A > 300 && P.some(q => Math.hypot(q[0] - ENT[0], q[1] - ENT[1]) < 60), old = !b.gen && !modern && (b.k === 'hospital' || A > 420);
    if (b.k === 'roof') { geo.flat.push(K.cap(P, y0 + 3.4, 4)); for (const q of [P[0], P[Math.floor(P.length / 2)]]) geo.render.push(K.box(0.25, 3.4, 0.25, q[0], y0, q[1])); return; }
    const lv = b.lv || (b.k === 'storage_tank' ? 0 : b.k === 'hospital' ? 3 : A > 420 && !modern ? 3 : 2), h = (b.h || (lv ? lv * 3.1 + 0.6 : 9)) + (b.eps || 0);
    const wm = b.gen ? 'brown' : modern ? 'buff' : old ? 'red' : 'brown';
    // ROOF BLINK FIX: the white rendered parapet band of the modern blocks used to overlap the top 0.5 m of the brick wall and the
    // brick parapet on the very same faces (coplanar), so the roof line flickered white / brick. The wall now stops where the band
    // starts, and modern blocks get no second parapet prism.
    geo[wm].push(K.prism(P, y0, modern ? h - 0.2 : h + 0.3, {su: 1.2, sv: 1.2}));
    if (modern) geo.render.push(K.prism(P, y0 + h - 0.2, 1.0, {su: 1, sv: 1}));   // rendered parapet band (cap sits 0.5 m below its top)
    coll.push({p: P, y0: y0, top: y0 + h + 2});
    const bb = bbox(P);
    if (b.gen || (A < 320 && P.length <= 6)) {   // pitched (gable) roof
      let best = 0, ang = 0; for (let i = 0; i < P.length; i++) { const a = P[i], c = P[(i + 1) % P.length], l = Math.hypot(c[0] - a[0], c[1] - a[1]); if (l > best) { best = l; ang = Math.atan2(c[1] - a[1], c[0] - a[0]); } } if (b.rang !== undefined) ang = b.rang;
      const ca = Math.cos(ang), sa = Math.sin(ang), cx = (bb[0] + bb[1]) / 2, cz = (bb[2] + bb[3]) / 2; let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
      for (const q of P) { const u = (q[0] - cx) * ca + (q[1] - cz) * sa, v = -(q[0] - cx) * sa + (q[1] - cz) * ca; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
      const len = u1 - u0 + 0.6, dep = v1 - v0 + 0.6, rh = Math.min(4, dep * 0.42), sh = new THREE.Shape([new THREE.Vector2(-dep / 2, 0), new THREE.Vector2(dep / 2, 0), new THREE.Vector2(0, rh)]);
      const rg = new THREE.ExtrudeGeometry(sh, {depth: len, bevelEnabled: false}); rg.translate(0, 0, -len / 2);
      const uvs = rg.attributes.uv; for (let i = 0; i < uvs.count; i++) uvs.setXY(i, uvs.getX(i) * 0.5, uvs.getY(i) * 0.5);
      const mu = (u0 + u1) / 2, mv = (v0 + v1) / 2; rg.rotateY(Math.PI / 2 - ang); rg.translate(cx + mu * ca - mv * sa, y0 + h + 0.3, cz + mu * sa + mv * ca);
      geo[old ? 'slate' : 'tiles'].push(rg);
    } else { geo.flat.push(K.cap(P, y0 + h + 0.3, 6)); if (!modern) geo[wm].push(K.prism(P, y0 + h + 0.3, 0.7, {su: 1.2, sv: 1.2})); }
    if (!lv || Math.min(...P.map(q => Math.hypot(q[0], q[1]))) > winR) return;
    for (const w of K.winList(P, y0 + 0.15, lv, {step: winStep, fh: 3.1, sx: modern ? 1.6 : 1})) win.push(w);
  });
  for (const k in geo) if (geo[k].length) grp.add(new THREE.Mesh(K.merge(geo[k]), mats[k]));
  K.wins(grp, win, {lit: 0.04, litCol: 0xf6e7c4, near: L ? 120 : 200});
  out.blocked = K.polyIndex(coll, 20);
  // entrance: canopy, posts and glazed doors, facing the footpath
  { const ex = ENT[0], ez = ENT[1], ey = H(ex, ez), prev = D.path[D.path.length - 2], ry = Math.atan2(prev[0] - ex, prev[1] - ez);
    const cm = new THREE.Mesh(K.merge([K.box(5.5, 0.25, 3.2, 0, 3.2, 1.4), K.box(0.2, 3.2, 0.2, -2.5, 0, 2.8), K.box(0.2, 3.2, 0.2, 2.5, 0, 2.8)]), K.lamb({color: 0xdedbd3})); cm.position.set(ex, ey, ez); cm.rotation.y = ry; grp.add(cm);
    const dr = new THREE.Mesh(K.merge([K.box(3.4, 2.7, 0.18, 0, 0, 0)]), K.std({color: 0x3d5563, roughness: 0.1, metalness: 0.5})); dr.position.set(ex, ey, ez); dr.rotation.y = ry; grp.add(dr); }
  // ---------- hedges, fences ----------
  const hg = []; D.h.forEach(P => { const pts = dens(P); for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l < 0.3) continue; const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; hg.push(K.xform(new THREE.BoxGeometry(0.95, 1.4, l + 0.4, 1, 2, 1), m[0], H(m[0], m[1]) + 0.65, m[1], Math.atan2(b[0] - a[0], b[1] - a[1]))); } });
  if (hg.length) grp.add(new THREE.Mesh(K.merge(hg), K.lamb({color: 0x3f5a2c, flatShading: true})));
  const posts = [], rails = []; D.fe.forEach(P => { const pts = dens(P); for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l < 0.3) continue; const ang = Math.atan2(b[0] - a[0], b[1] - a[1]), m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], y = H(m[0], m[1]);
      for (let t = 0; t < l; t += 2.5) posts.push([a[0] + (b[0] - a[0]) * t / l, a[1] + (b[1] - a[1]) * t / l]); for (const ry of [0.5, 1.4]) rails.push(K.xform(new THREE.BoxGeometry(0.05, 0.07, l), m[0], y + ry, m[1], ang)); } });
  const fenceM = K.lamb({color: 0x2c3a30});
  if (rails.length) grp.add(new THREE.Mesh(K.merge(rails), fenceM));
  if (posts.length) { const pm = new THREE.InstancedMesh(new THREE.BoxGeometry(0.08, 1.8, 0.08).translate(0, 0.9, 0), fenceM, posts.length), m4 = new THREE.Matrix4(); posts.forEach((p, i) => { m4.makeTranslation(p[0], H(p[0], p[1]), p[1]); pm.setMatrixAt(i, m4); }); grp.add(pm); }
  // ---------- trees: OSM trees and tree rows, woods / scrub fill (instanced low-poly) ----------
  const tl = [], TMAX = L ? 900 : 2600; D.t.forEach(p => tl.push([p[0], H(p[0], p[1]), p[1]]));
  D.tr.forEach(P => dens(P).forEach(p => tl.push([p[0], H(p[0], p[1]), p[1]])));
  D.a.filter(a => a.k === 'wood' || a.k === 'forest' || a.k === 'scrub').forEach(a => { const bb = bbox(a.p), cnt = Math.min(1200, Math.round(Math.abs(K.area(a.p)) / (a.k === 'scrub' ? 110 : 55)));
    for (let i = 0, tries = 0; i < cnt && tries < cnt * 4 && tl.length < TMAX; tries++) { const x = bb[0] + r() * (bb[1] - bb[0]), z = bb[2] + r() * (bb[3] - bb[2]); if (Math.abs(x) > R - 4 || Math.abs(z) > R - 4 || !K.inPoly(x, z, a.p) || Math.hypot(x, z) < 26) continue; tl.push([x, H(x, z), z, a.k === 'scrub' ? 0.55 + r() * 0.3 : 0.9 + r() * 0.7]); i++; } });
  const trees = tl.filter(t => Math.abs(t[0]) < R && Math.abs(t[2]) < R && !out.blocked(t[0], t[2], t[1]) && Math.hypot(t[0], t[2]) > 17).slice(0, TMAX);
  K.trees(grp, trees);
  // ---------- lamps, benches, parked cars ----------
  const inst = (geom, mat, list, y) => { const m = new THREE.InstancedMesh(geom, mat, list.length), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1); list.forEach((p, i) => { q.setFromAxisAngle(UP, p[2]); m4.compose(v.set(p[0], H(p[0], p[1]) + (y || 0), p[1]), q, one); m.setMatrixAt(i, m4); }); grp.add(m); return m; };
  const lamps = lampPts.slice(0, L ? 120 : 320);
  if (lamps.length) { inst(K.merge([K.box(0.14, 6, 0.14, 0, 0, 0), K.box(0.1, 0.1, 1.2, 0, 5.9, 0.55)]), K.lamb({color: 0x3b3f44}), lamps); inst(K.box(0.36, 0.14, 0.6, 0, 5.78, 1.1), new THREE.MeshBasicMaterial({color: 0xfff1cf}), lamps); }
  const bench = K.merge([K.box(1.8, 0.05, 0.14, 0, 0.45, -0.18), K.box(1.8, 0.05, 0.14, 0, 0.45, 0), K.box(1.8, 0.05, 0.14, 0, 0.45, 0.18), K.box(1.8, 0.12, 0.05, 0, 0.62, 0.27), K.box(1.8, 0.12, 0.05, 0, 0.8, 0.27), K.box(0.07, 0.45, 0.5, -0.8, 0, 0), K.box(0.07, 0.45, 0.5, 0.8, 0, 0), K.box(0.07, 0.4, 0.06, -0.8, 0.45, 0.27), K.box(0.07, 0.4, 0.06, 0.8, 0.45, 0.27)]);
  const bpos = []; for (let i = 2; i < path.length - 2; i += 5) { const p = path[i], q2 = path[i + 1], l = Math.hypot(q2[0] - p[0], q2[1] - p[1]) || 1, nx = (q2[1] - p[1]) / l, nz = -(q2[0] - p[0]) / l; bpos.push([p[0] + nx * 2.3, p[1] + nz * 2.3, Math.atan2(nx, nz) + Math.PI]); }
  for (let i = 0; i < 6; i++) { const a = Math.PI * 0.62 + i * 0.36; bpos.push([Math.sin(a) * 24, Math.cos(a) * 24, a + Math.PI]); }
  inst(bench, K.lamb({color: 0x7a5a3a}), bpos);
  const cars = [], CMAX = L ? 60 : 160;
  D.a.filter(a => a.k === 'parking').forEach(a => { const bb = bbox(a.p); let best = 0, ang = 0; for (let i = 0; i < a.p.length; i++) { const p = a.p[i], c = a.p[(i + 1) % a.p.length], l = Math.hypot(c[0] - p[0], c[1] - p[1]); if (l > best) { best = l; ang = Math.atan2(c[0] - p[0], c[1] - p[1]); } }
    const cx = (bb[0] + bb[1]) / 2, cz = (bb[2] + bb[3]) / 2, ext = Math.max(bb[1] - bb[0], bb[3] - bb[2]), ca = Math.cos(ang), sa = Math.sin(ang);
    for (let u = -ext / 2; u < ext / 2; u += 6.5) for (let v = -ext / 2; v < ext / 2; v += 2.6) { if (cars.length >= CMAX || r() < 0.35) continue; const x = cx + u * ca + v * sa, z = cz - u * sa + v * ca; if (!K.inPoly(x, z, a.p) || Math.abs(x) > R || Math.abs(z) > R) continue; cars.push([x, z, ang + Math.PI / 2]); } });
  if (cars.length) { const wh = []; for (const [x, z] of [[-0.82, 1.35], [0.82, 1.35], [-0.82, -1.35], [0.82, -1.35]]) wh.push(K.xform(new THREE.CylinderGeometry(0.33, 0.33, 0.22, 10).rotateZ(Math.PI / 2), x, 0.33, z));
    const bm = inst(K.merge([K.box(1.8, 0.62, 4.3, 0, 0.3, 0), K.box(1.62, 0.5, 2.3, 0, 0.92, -0.2)]), K.std({color: 0xffffff, roughness: 0.35, metalness: 0.6}), cars, 0.02);
    inst(K.box(1.66, 0.36, 2.0, 0, 0.98, -0.2), K.std({color: 0x22303a, roughness: 0.1, metalness: 0.7}), cars, 0.02); inst(K.merge(wh), K.lamb({color: 0x1b1b1b}), cars, 0.02);
    const c = new THREE.Color(), pal = [0xb8bcc2, 0x23262b, 0xf2f2f2, 0x2a3f6b, 0x7a1d22, 0x5a5f63, 0x9aa4ad, 0x2f4a3a]; cars.forEach((p, i) => bm.setColorAt(i, c.setHex(pal[i % pal.length]))); }
  // ---------- pad, light ----------
  K.pad(grp, 0, 15);
  K.sky(grp, {top: 0xa3aebb, horizon: 0xc6ccd2});
  K.lights(grp, {sky: 0xe3e8ee, ground: 0x5d6450, hi: 1.25, si: 0.55, dx: -60, dy: 200, dz: 120});
  W3D.londonInfo = out.info = {osmBuildings: D.b.length, terraces: nh, trees: trees.length, lamps: lamps.length, cars: cars.length, windows: win.length, walk: D.walk, lat: D.lat, lon: D.lon};
  return out;
}
})();
