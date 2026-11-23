/* London saucer landing (item 20): the open recreation-ground field beside a hospital campus in east London.
   All 3D and open data: building footprints and heights from Overture Maps Foundation (buildings theme, release 2026-11-18, ODbL),
   which combines OpenStreetMap footprints and Microsoft Global ML Building Footprints (ODbL); roads, paths, fences, hedges, trees and
   land use from OpenStreetMap (c) OpenStreetMap contributors, ODbL; ground elevation from EU-DEM 25 m (Copernicus, via OpenTopoData).
   Buildings are extruded footprints with modelled window frames, sills and roofs; terraced houses fill residential
   streets where OSM has no footprints. No names are shown anywhere in the scene. Local frame: pad centre = (0, 0, 0). */
(function () {
'use strict';
W3D.cityModules.london = (grp, K) => Promise.all([fetch('/vr/w3d/city/london.json?v=2').then(r => r.json()), fetch('/vr/w3d/city/london_out.json?v=1').then(r => r.ok ? r.json() : null).catch(() => null)])
  .then(([D, O]) => { const out = build(grp, K, D); if (O) { try { buildOuter(grp, K, O, out, out.ground); } catch (e) { console.warn('london outer', e); } } return out; });
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
  const blds = D.b.filter((b, i) => keep[i]).map((b, i) => ({p: b.p, k: b.k, lv: b.lv, h: b.h, hl: b.hl, mh: b.mh, eps: (i % 9) * 0.07})), occ = blds.map(b => bbox(b.p));
  const nOSM = blds.length; W3D.londonDeduped = D.b.length - nOSM;
  const free = P => { const bb = bbox(P), c = [(bb[0] + bb[1]) / 2, (bb[2] + bb[3]) / 2]; for (let i = 0; i < occ.length; i++) { const o = occ[i]; if (bb[0] < o[1] + 1 && bb[1] > o[0] - 1 && bb[2] < o[3] + 1 && bb[3] > o[2] - 1) { if (i >= nOSM) return false; if (K.inPoly(c[0], c[1], blds[i].p) || P.some(q => K.inPoly(q[0], q[1], blds[i].p))) return false; } } return true; };
  // terraced houses along residential streets where OSM has no footprints
  const resPolys = D.a.filter(a => a.k === 'residential').map(a => a.p); let nh = 0; const HMAX = D.b.some(b => b.src === 'ml') ? 0 : L ? 170 : 380;   // no invented terraces once real (OSM + ML) footprints cover the streets
  roads.filter(rd => rd.k === 'residential' || rd.k === 'unclassified').forEach(rd => { for (let i = 1; i < rd.p.length && nh < HMAX; i++) { const a = rd.p[i - 1], b = rd.p[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l < 12) continue; const dx = (b[0] - a[0]) / l, dz = (b[1] - a[1]) / l;
      for (const s of [-1, 1]) for (let t = 6; t < l - 6 && nh < HMAX; t += 6.2) { const off = W[rd.k] / 2 + 9, cx = a[0] + dx * t - dz * off * s, cz = a[1] + dz * t + dx * off * s; if (Math.abs(cx) > R - 10 || Math.abs(cz) > R - 10 || Math.hypot(cx, cz) < 40) continue;
        if (!resPolys.some(P => K.inPoly(cx, cz, P))) continue; const P = [[-2.85, -4.8], [2.85, -4.8], [2.85, 4.8], [-2.85, 4.8]].map(([u, v]) => [cx + dx * u - dz * v * s, cz + dz * u + dx * v * s]);
        if (!free(P) || nearRoad(cx, cz, 4.4)) continue; blds.push({p: P, k: 'terrace', lv: 2, gen: 1, rang: Math.atan2(dz, dx)}); occ.push(bbox(P)); nh++; } } });
  const T = K.tex, mats = {red: K.lamb({map: T.brick([142, 64, 46]), side: THREE.DoubleSide}), buff: K.lamb({map: T.brick([190, 160, 112], '#c9bfae'), side: THREE.DoubleSide}), brown: K.lamb({map: T.brick([120, 74, 52]), side: THREE.DoubleSide}), render: K.lamb({map: T.render('#e6e1d6'), side: THREE.DoubleSide}), tiles: K.lamb({map: T.tiles([96, 52, 42]), side: THREE.DoubleSide}), slate: K.lamb({map: T.tiles([70, 74, 80]), side: THREE.DoubleSide}), flat: K.lamb({map: T.render('#4c4f52'), side: THREE.DoubleSide})};
  const geo = {red: [], buff: [], brown: [], render: [], tiles: [], slate: [], flat: []}, coll = [], holes = [], win = [], ENT = D.ent;
  // courtyards (multipolygon inner rings): walls facing into the yard, roof cap with the hole cut out, walkable inside
  const flipN = g => { const n = g.attributes.normal; for (let i = 0; i < n.count; i++) n.setXYZ(i, -n.getX(i), -n.getY(i), -n.getZ(i)); return g; };
  const capH = (P, HL, y, su) => { const sh = new THREE.Shape(P.map(p => new THREE.Vector2(p[0], p[1]))); for (const h of HL) sh.holes.push(new THREE.Path(h.map(p => new THREE.Vector2(p[0], p[1]))));
    const g = new THREE.ShapeGeometry(sh); g.rotateX(Math.PI / 2); const pa = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < pa.count; i++) { pa.setY(i, y); uv.setXY(i, pa.getX(i) / (su || 4), pa.getZ(i) / (su || 4)); }
    const n = g.attributes.normal; for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0); const ix = g.index; if (ix) { const a = ix.array; for (let i = 0; i < a.length; i += 3) { const t = a[i + 1]; a[i + 1] = a[i + 2]; a[i + 2] = t; } } return g.index ? g.toNonIndexed() : g; };
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
    const HL = (b.hl || []).filter(q => q.length >= 3).map(q => K.ccw(q));
    for (const q of HL) { geo[wm].push(flipN(K.prism(q, y0, h + 1.0, {su: 1.2, sv: 1.2}))); holes.push({p: q, y0: y0, top: y0 + h + 2}); }
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
    } else { geo.flat.push(HL.length ? capH(P, HL, y0 + h + 0.3, 6) : K.cap(P, y0 + h + 0.3, 6)); if (!modern) geo[wm].push(K.prism(P, y0 + h + 0.3, 0.7, {su: 1.2, sv: 1.2})); }
    if (!lv || Math.min(...P.map(q => Math.hypot(q[0], q[1]))) > winR) return;
    for (const w of K.winList(P, y0 + 0.15, lv, {step: winStep, fh: 3.1, sx: modern ? 1.6 : 1})) win.push(w);
  });
  for (const k in geo) if (geo[k].length) grp.add(new THREE.Mesh(K.merge(geo[k]), mats[k]));
  K.wins(grp, win, {lit: 0.04, litCol: 0xf6e7c4, near: L ? 120 : 200});
  { const inB = K.polyIndex(coll, 20), inH = holes.length ? K.polyIndex(holes, 20) : null; out.blocked = inH ? (x, z, y) => inB(x, z, y) && !inH(x, z, y) : inB; }
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
  W3D.londonInfo = out.info = {buildings: D.b.length, fromOSM: D.b.filter(b => b.src === 'osm').length, fromML: D.b.filter(b => b.src === 'ml').length, heightTagged: D.b.filter(b => b.h).length, courtyards: holes.length, terraces: nh, trees: trees.length, lamps: lamps.length, cars: cars.length, windows: win.length, walk: D.walk, lat: D.lat, lon: D.lon};
  return out;
}
/* Outer London around the hospital field (Goodmayes plan, Nov 23): ground 470 m - 2.4 km from EU-DEM 25 m (Copernicus, via OpenTopoData)
   with a land-use tint (OpenStreetMap, ODbL) - never Google imagery; Tier 2 buildings 470 m - 1.2 km (Overture Maps 2026-11-18, ODbL:
   footprints, heights, hipped roofs on terraces, unlabelled shopfront bands along the High Road); Tier 3 1.2 - 2 km as blocks (desktop,
   fewer on Quest, none on lite); the main line ~1 km south (4 tracks, ballast, overhead line portals and wires, platforms and canopies,
   a station footbridge, two looping 9-car white/purple trains); parks with trees, lakes; unlabelled landmarks (a water tower, spires,
   domes and minarets at places of worship from OSM). Nothing is named. Merged by material: ~14 draw calls. */
function buildOuter(grp, K, O, out, Hin) {
  const L = K.LITE, QUEST = /OculusBrowser|Quest/i.test(navigator.userAgent) || /[?&]quest=1/.test(location.search), RIN = 470, GE = 2400, UP = new THREE.Vector3(0, 1, 0), r = K.rnd(77);
  const g = O.g, n = g.n, cheb = (x, z) => Math.max(Math.abs(x), Math.abs(z));
  const rawO = (x, z) => { const fx = Math.max(0, Math.min(n - 1.001, (x - g.x0) / g.s)), fz = Math.max(0, Math.min(n - 1.001, (z - g.z0) / g.s)), i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, h = (a, b) => g.h[b * n + a];
    return (h(i, j) * (1 - u) + h(i + 1, j) * u) * (1 - v) + (h(i, j + 1) * (1 - u) + h(i + 1, j + 1) * u) * v; };
  const H = (x, z) => { const c = cheb(x, z); if (c <= RIN - 40) return Hin(x, z); if (c >= RIN + 40) return rawO(x, z); const k = (c - RIN + 40) / 80, s = k * k * (3 - 2 * k), xi = Math.max(-RIN, Math.min(RIN, x)), zi = Math.max(-RIN, Math.min(RIN, z)); return Hin(xi, zi) * (1 - s) + rawO(x, z) * s; };
  out.ground = H;
  // remove the old flat skirt
  grp.children.slice().forEach(o => { if (o.geometry && o.geometry.type === 'RingGeometry') { grp.remove(o); o.geometry.dispose(); } });
  const waters = (O.w || []).filter(w => w.p.length >= 3).map(w => { let y = 1e9; w.p.forEach(p => { y = Math.min(y, rawO(p[0], p[1])); }); return {p: w.p, y: y + 0.1}; });
  const inWater = (x, z) => { for (const w of waters) if (K.inPoly(x, z, w.p)) return w; return null; };
  // ---------- ground ring + tint ----------
  const GS = L ? 80 : 40, GN = Math.round(2 * GE / GS) + 1, gp = [], guv = [], gi = [], vid = new Int32Array(GN * GN).fill(-1);
  for (let j = 0; j < GN; j++) for (let i = 0; i < GN; i++) { const x = -GE + i * GS, z = -GE + j * GS; if (cheb(x, z) < RIN - GS - 1) continue; const w = inWater(x, z);
    vid[j * GN + i] = gp.length / 3; gp.push(x, w ? w.y - 0.8 : cheb(x, z) <= RIN + 1 ? Math.min(H(x, z), Hin(Math.max(-RIN, Math.min(RIN, x)), Math.max(-RIN, Math.min(RIN, z)))) - 0.15 : H(x, z), z); guv.push((x + GE) / (2 * GE), 1 - (z + GE) / (2 * GE)); }
  for (let j = 1; j < GN; j++) for (let i = 1; i < GN; i++) { const a = vid[(j - 1) * GN + i - 1], b = vid[(j - 1) * GN + i], c = vid[j * GN + i - 1], d = vid[j * GN + i]; if (a < 0 || b < 0 || c < 0 || d < 0) continue;
    const cx = -GE + (i - 0.5) * GS, cz = -GE + (j - 0.5) * GS; if (cheb(cx, cz) < RIN - 2) continue; gi.push(a, c, b, b, c, d); }
  const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(gp, 3)); gg.setAttribute('uv', new THREE.Float32BufferAttribute(guv, 2)); gg.setIndex(gi); gg.computeVertexNormals();
  const TS = L ? 1024 : 2048, P2 = p => [(p[0] + GE) / (2 * GE) * TS, (p[1] + GE) / (2 * GE) * TS], px = TS / (2 * GE);
  const COL = {park: '#7d9955', grass: '#83995a', pitch: '#6c9a49', wood: '#4d6334', scrub: '#6a7640', cemetery: '#76885a', allotments: '#8a8c55', retail: '#8d8a84', railway: '#7b7466'};
  const ord = ['retail', 'railway', 'grass', 'park', 'cemetery', 'allotments', 'scrub', 'wood', 'pitch'];
  const land = K.ctex(TS, TS, c => { c.fillStyle = '#8b9270'; c.fillRect(0, 0, TS, TS);
    const poly = (p) => { c.beginPath(); p.forEach((q, i) => { const s = P2(q); i ? c.lineTo(s[0], s[1]) : c.moveTo(s[0], s[1]); }); c.closePath(); };
    O.a.slice().sort((a, b) => ord.indexOf(a.k) - ord.indexOf(b.k)).forEach(a => { if (!COL[a.k]) return; c.fillStyle = COL[a.k]; poly(a.p); c.fill(); });
    c.strokeStyle = '#5c5f61'; c.lineCap = c.lineJoin = 'round';
    for (const rd of O.r) { c.lineWidth = Math.max(1, ({trunk: 13, primary: 11, secondary: 9, tertiary: 8, residential: 6.5, service: 4}[rd.k] || 5.5) * px); c.beginPath(); rd.p.forEach((q, i) => { const s = P2(q); i ? c.lineTo(s[0], s[1]) : c.moveTo(s[0], s[1]); }); c.stroke(); }
    c.strokeStyle = '#6d665c'; c.lineWidth = Math.max(1, 4 * px); for (const t of O.rail) { c.beginPath(); t.p.forEach((q, i) => { const s = P2(q); i ? c.lineTo(s[0], s[1]) : c.moveTo(s[0], s[1]); }); c.stroke(); }
    c.fillStyle = '#4b6470'; waters.forEach(w => { poly(w.p); c.fill(); });
    const rr = K.rnd(9); for (let i = 0; i < TS * 4; i++) { c.fillStyle = 'rgba(' + (rr() < 0.5 ? '40,50,20' : '170,170,140') + ',' + (rr() * 0.06) + ')'; c.fillRect(rr() * TS, rr() * TS, 2, 2); } });
  land.wrapS = land.wrapT = THREE.ClampToEdgeWrapping; land.anisotropy = 8;
  const ground = new THREE.Mesh(gg, K.lamb({map: land})); ground.name = 'london-outer-ground'; grp.add(ground);
  const far = new THREE.Mesh(new THREE.RingGeometry(GE * 1.414 - 60, 9000, L ? 64 : 128, L ? 10 : 24), K.lamb({color: 0x7f8f5e})); far.rotation.x = -Math.PI / 2; far.position.y = rawO(0, -GE) - 1.5; grp.add(far);
  let gmin = 1e9; for (let i = 1; i < gp.length; i += 3) gmin = Math.min(gmin, gp[i]);   // fill plane under the grid; subdivided (huge triangles fog to a flat colour with the log depth buffer)
  const sq = new THREE.Mesh(new THREE.PlaneGeometry(2 * GE + 200, 2 * GE + 200, L ? 16 : 40, L ? 16 : 40), K.lamb({color: 0x7f8f5e})); sq.rotation.x = -Math.PI / 2; sq.position.y = gmin - 2; grp.add(sq);
  // water
  if (waters.length) { const wv = []; for (const w of waters) { const P = K.ccw(w.p), tr = THREE.ShapeUtils.triangulateShape(P.map(p => new THREE.Vector2(p[0], p[1])), []); for (const t of tr) for (const k of [t[0], t[2], t[1]]) wv.push(P[k][0], w.y, P[k][1]); }
    const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(wv, 3)); wg.computeVertexNormals(); const wm = new THREE.Mesh(wg, K.std({color: 0x4f6b74, roughness: 0.35, metalness: 0.0})); wm.name = 'london-lakes'; grp.add(wm); }
  // ---------- buildings ----------
  const wp = [], wn = [], wu = [], wc = [], rp = [], rn = [], rc = [], col = new THREE.Color(), coll = [];
  const PAL = {h: ['#b39a70', '#a05a43', '#d2c8b2', '#e4ded0', '#8a6048', '#c4a27a', '#9b6a4e'], o: ['#bdb4a4', '#9c8f80', '#c9c2b5', '#a7765c'], c: ['#a9adb0', '#c3c0b8', '#8f969c'], m: ['#d9d2c4', '#c8b8a0'], w: ['#c9b79a'], s: ['#8d8f91']};
  const RPAL = {pitch: ['#575c63', '#8a4a36', '#6b4a3e', '#4e5257'], flat: ['#76797c', '#8a8c8e', '#6a6e70']};
  const pick = a => a[Math.floor(r() * a.length)];
  const pushC = (arr, hex, k) => { col.set(hex); for (let i = 0; i < k; i++) arr.push(col.r, col.g, col.b); };
  function walls(P, y0, h, hex, tex) { P = K.ccw(P); let u = 0; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], Lw = Math.hypot(b[0] - a[0], b[1] - a[1]); if (Lw < 0.3) continue; const nx = (b[1] - a[1]) / Lw, nz = -(b[0] - a[0]) / Lw;
      const q = [[a[0], y0, a[1], u, 0], [b[0], y0, b[1], u + Lw, 0], [b[0], y0 + h, b[1], u + Lw, h], [a[0], y0 + h, a[1], u, h]];
      for (const k of [0, 2, 1, 0, 3, 2]) { wp.push(q[k][0], q[k][1], q[k][2]); wn.push(nx, 0, nz); wu.push(tex ? q[k][3] / 3.2 : 0.02, tex ? q[k][4] / 3 : 0.02); } u += Lw; pushC(wc, hex, 6); } }
  function flat(P, y, hex) { P = K.ccw(P); const tri = THREE.ShapeUtils.triangulateShape(P.map(p => new THREE.Vector2(p[0], p[1])), []); for (const t of tri) for (const k of [t[0], t[2], t[1]]) { rp.push(P[k][0], y, P[k][1]); rn.push(0, 1, 0); } pushC(rc, hex, tri.length * 3); }
  const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3();
  function tri(A, B, C, hex) { _a.set(B[0] - A[0], B[1] - A[1], B[2] - A[2]); _b.set(C[0] - A[0], C[1] - A[1], C[2] - A[2]); _c.crossVectors(_a, _b).normalize(); if (_c.y < 0) { const t = B; B = C; C = t; _c.negate(); }
    rp.push(...A, ...B, ...C); for (let i = 0; i < 3; i++) rn.push(_c.x, _c.y, _c.z); pushC(rc, hex, 3); }
  function hip(o, y, hex) { let [cx, cz, e1, e2, ang] = o; if (e2 > e1) { const t = e1; e1 = e2; e2 = t; ang += Math.PI / 2; } const a = e1 / 2 + 0.3, b = e2 / 2 + 0.3, rr2 = Math.max(0, a - b), hh = b * 0.72, su = Math.sin(ang), cu = Math.cos(ang);
    const W = (l, s, yy) => [cx + l * su + s * cu, y + yy, cz + l * cu - s * su]; const c1 = W(-a, -b, 0), c2 = W(a, -b, 0), c3 = W(a, b, 0), c4 = W(-a, b, 0), R1 = W(-rr2, 0, hh), R2 = W(rr2, 0, hh);
    tri(c1, c2, R2, hex); tri(c1, R2, R1, hex); tri(c3, c4, R1, hex); tri(c3, R1, R2, hex); tri(c2, c3, R2, hex); tri(c4, c1, R1, hex); }
  const sfp = [], sfn = [], sfc = [];
  function band(P, y0, y1, off, hexf) { P = K.ccw(P); for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], Lw = Math.hypot(b[0] - a[0], b[1] - a[1]); if (Lw < 3) continue; const nx = (b[1] - a[1]) / Lw, nz = -(b[0] - a[0]) / Lw, ox = nx * off, oz = nz * off;
      const q = [[a[0] + ox, y0, a[1] + oz], [b[0] + ox, y0, b[1] + oz], [b[0] + ox, y1, b[1] + oz], [a[0] + ox, y1, a[1] + oz]]; for (const k of [0, 2, 1, 0, 3, 2]) { sfp.push(...q[k]); sfn.push(nx, 0, nz); } pushC(sfc, hexf(), 6); } }
  const SHOP = ['#c0392b', '#1f5f99', '#2e7d4f', '#d9a520', '#6c3483', '#222831', '#e67e22', '#117a8b'];
  let b2 = O.b2; if (L) b2 = b2.filter(b => cheb(b.p[0][0], b.p[0][1]) < 850 && Math.abs(K.area(b.p)) > 40); else if (QUEST) b2 = b2.filter(b => cheb(b.p[0][0], b.p[0][1]) < 1000 && Math.abs(K.area(b.p)) > 30);
  for (const b of b2) { let cx = 0, cz = 0; b.p.forEach(p => { cx += p[0]; cz += p[1]; }); cx /= b.p.length; cz /= b.p.length; const y0 = H(cx, cz);
    const hex = pick(PAL[b.k] || PAL.o); walls(b.p, y0 - 0.6, b.h + 0.6, hex, true);
    if (b.o && !L && !(QUEST && cheb(b.p[0][0], b.p[0][1]) > 700)) hip(b.o, y0 + b.h, pick(RPAL.pitch)); else flat(b.p, y0 + b.h, b.k === 'h' ? pick(RPAL.pitch) : pick(RPAL.flat));
    if (b.sf) { band(b.p, y0 + 0.2, y0 + 2.9, 0.06, () => '#1d2328'); const sh = pick(SHOP); band(b.p, y0 + 2.9, y0 + 3.6, 0.1, () => sh); }
    coll.push({p: b.p, y0: y0 - 0.6, top: y0 + b.h}); }
  let b3 = L ? [] : O.b3; if (QUEST) b3 = b3.filter(b => b[2] * b[3] > 140 || b[5] >= 10).slice(0, 1200);
  for (const b of b3) { const [cx, cz, e1, e2, ang, h, , res] = b, su = Math.sin(ang), cu = Math.cos(ang), a = e1 / 2, bb = e2 / 2, y0 = H(cx, cz);
    const P = [[-a, -bb], [a, -bb], [a, bb], [-a, bb]].map(([l, s]) => [cx + l * su + s * cu, cz + l * cu - s * su]);
    walls(P, y0 - 0.6, h + 0.6, pick(res ? PAL.h : PAL.o), true); if (res && h < 12) hip([cx, cz, e1, e2, ang], y0 + h, pick(RPAL.pitch)); else flat(P, y0 + h, pick(RPAL.flat)); }
  const winT = K.ctex(64, 64, c => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, 64, 64); c.fillStyle = '#2b3238'; c.fillRect(17, 16, 30, 30); c.fillStyle = '#e8e4dc'; c.fillRect(17, 46, 30, 3); c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(0, 62, 64, 2); });
  winT.wrapS = winT.wrapT = THREE.RepeatWrapping; winT.anisotropy = 4;
  const mk = (p, n2, c, uv) => { const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(n2, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(c, 3)); if (uv) geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.computeBoundingSphere(); return geo; };
  const wallM = new THREE.Mesh(mk(wp, wn, wc, wu), K.lamb({map: winT, vertexColors: true})); wallM.name = 'london-outer-walls'; grp.add(wallM);
  const roofM = new THREE.Mesh(mk(rp, rn, rc), K.lamb({vertexColors: true, side: THREE.DoubleSide})); roofM.name = 'london-outer-roofs'; grp.add(roofM);
  if (sfp.length) { const s = new THREE.Mesh(mk(sfp, sfn, sfc), K.lamb({vertexColors: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2})); grp.add(s); }
  // ---------- roads (ribbons for the main roads; the rest are painted into the ground tint) ----------
  const RW = {trunk: 13, primary: 11, secondary: 9, tertiary: 8, residential: 6.5, unclassified: 6, living_street: 5};
  const roads = O.r.filter(rd => RW[rd.k] && (!L || rd.k !== 'residential' && rd.k !== 'unclassified') && rd.p.some(p => cheb(p[0], p[1]) < (L ? 1300 : 2100)));
  if (roads.length) { const rg = K.merge(roads.map(rd => K.ribbon(rd.p, RW[rd.k], (x, z) => H(x, z), {y: 0.12, su: 6}))); const rm = new THREE.Mesh(rg, K.lamb({color: 0x55585b, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1})); rm.name = 'london-outer-roads'; grp.add(rm); }
  // ---------- railway ----------
  const SP = (O.spine || []).filter(p => cheb(p[0], p[1]) < GE + 200);
  const mains = O.rail.filter(t => t.p.some(p => cheb(p[0], p[1]) < GE));
  if (mains.length) {
    const bal = K.merge(mains.map(t => K.ribbon(t.p, 3.6, (x, z) => H(x, z), {y: 0.22, su: 4}))); grp.add(new THREE.Mesh(bal, K.lamb({color: 0x77706a, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2})));
    if (!L) { const rails = []; mains.forEach(t => { rails.push(K.ribbon(t.p, 0.14, (x, z) => H(x, z), {y: 0.42, off: -0.72}), K.ribbon(t.p, 0.14, (x, z) => H(x, z), {y: 0.42, off: 0.72})); });
      grp.add(new THREE.Mesh(K.merge(rails), K.std({color: 0x8a8d90, metalness: 0.8, roughness: 0.35, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3}))); }
  }
  // spine helpers (arc length), OLE portals + wires, trains
  const S = []; let tot = 0; for (let i = 0; i < SP.length; i++) { if (i) tot += Math.hypot(SP[i][0] - SP[i - 1][0], SP[i][1] - SP[i - 1][1]); S.push(tot); }
  const at = (s, off) => { s = Math.max(0, Math.min(tot - 0.01, s)); let i = 1; while (i < S.length - 1 && S[i] < s) i++; const a = SP[i - 1], b = SP[i], k = (s - S[i - 1]) / ((S[i] - S[i - 1]) || 1), dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1;
    const x = a[0] + dx * k - dz / l * off, z = a[1] + dz * k + dx / l * off; return {x, z, y: H(x, z), yaw: Math.atan2(dx, dz)}; };
  if (SP.length > 2) {
    const ole = [], wires = []; let prev = null;
    for (let s = 20; s < tot - 20; s += 60) { const c = at(s, 0); const parts = [K.box(0.35, 7.6, 0.35, -9.5, 0, 0), K.box(0.35, 7.6, 0.35, 9.5, 0, 0), K.box(19.4, 0.4, 0.3, 0, 7.2, 0)];
      const pg = K.merge(parts); pg.rotateY(c.yaw + Math.PI / 2); pg.translate(c.x, c.y, c.z); ole.push(pg);
      const now = [-6, -2, 2, 6].map(o => at(s, o)); if (prev) for (let k = 0; k < 4; k++) wires.push(prev[k].x, prev[k].y + 5.6, prev[k].z, now[k].x, now[k].y + 5.6, now[k].z); prev = now; }
    if (ole.length && !L) grp.add(new THREE.Mesh(K.merge(ole), K.lamb({color: 0x6f7378})));
    if (wires.length) { const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(wires, 3)); grp.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({color: 0x2a2d30}))); }
  }
  // platforms + canopies (near station nodes), footbridge at the station due south of the field
  const sts = O.lm.filter(m => m.k === 'st'), plats = [], cans = [];
  for (const p of O.plat) { const closed = p.length > 3 && Math.hypot(p[0][0] - p[p.length - 1][0], p[0][1] - p[p.length - 1][1]) < 1; let cx = 0, cz = 0; p.forEach(q => { cx += q[0]; cz += q[1]; }); cx /= p.length; cz /= p.length; if (cheb(cx, cz) > GE) continue; const y = H(cx, cz);
    if (closed) { const P = p.slice(0, -1); plats.push(K.cap(P, y + 1.0, 4)); const wg = K.prism(P, y - 0.3, 1.3, {}); plats.push(wg); if (sts.some(s => Math.hypot(s.x - cx, s.z - cz) < 220)) cans.push(K.cap(P, y + 4.3, 4)); }
    else plats.push(K.ribbon(p, 4, () => y + 1.0, {y: 0})); }
  if (plats.length) grp.add(new THREE.Mesh(K.merge(plats), K.lamb({color: 0xa29e96})));
  if (cans.length) grp.add(new THREE.Mesh(K.merge(cans), K.lamb({color: 0x9aa3ab, side: THREE.DoubleSide})));
  if (SP.length > 2 && sts.length) { const st = sts.reduce((a, b) => Math.hypot(a.x, a.z) < Math.hypot(b.x, b.z) ? a : b); let bs = 0, bd = 1e9; for (let s = 0; s < tot; s += 10) { const c = at(s, 0), d = Math.hypot(c.x - st.x, c.z - st.z); if (d < bd) { bd = d; bs = s; } }
    const c = at(bs, 0), fb = K.merge([K.box(3, 0.5, 34, 0, 7, 0), K.box(3, 1.2, 0.12, 0, 7.5, 0).translate(1.45, 0, 0), K.box(3.4, 8, 3.4, 0, 0, -17), K.box(3.4, 8, 3.4, 0, 0, 17)]); fb.rotateY(c.yaw + Math.PI / 2); fb.translate(c.x, c.y, c.z);
    grp.add(new THREE.Mesh(fb, K.lamb({color: 0x5d6a74}))); }
  // trains: 2 x 9 cars, instanced, looping (one each way)
  let trains = null;
  if (SP.length > 2) { const cg = (() => { const parts = []; const add = (w, h, d, x, y, z, hex) => { const b = K.box(w, h, d, x, y, z).toNonIndexed(); const cc = new THREE.Color(hex), a = new Float32Array(b.attributes.position.count * 3); for (let i = 0; i < a.length; i += 3) { a[i] = cc.r; a[i + 1] = cc.g; a[i + 2] = cc.b; } b.setAttribute('color', new THREE.BufferAttribute(a, 3)); parts.push(b); };
      add(2.8, 3.1, 22.4, 0, 0.9, 0, 0xe9eaec); add(2.84, 0.9, 21.6, 0, 2.15, 0, 0x22282e); add(2.86, 0.18, 22.4, 0, 1.3, 0, 0x6950a1); add(2.86, 2.0, 1.3, 0, 1.0, -5.5, 0x6950a1); add(2.86, 2.0, 1.3, 0, 1.0, 5.5, 0x6950a1); add(2.2, 0.6, 20, 0, 0.3, 0, 0x2a2a2a); return K.merge(parts); })();
    const NC = 9, im = new THREE.InstancedMesh(cg, K.lamb({vertexColors: true}), NC * 2); im.frustumCulled = false; im.name = 'london-trains'; grp.add(im);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
    trains = {im, place(t) { const V = 24, cyc = tot + 900; for (let k = 0; k < 2; k++) { const s0 = ((t / 1000 * V + k * cyc * 0.45) % cyc) - 300;
        for (let i = 0; i < NC; i++) { const s = k ? tot - (s0 - i * 23.4) : s0 - i * 23.4, inside = s > 0 && s < tot; const c = at(s, k ? -2 : 2), c2 = at(s + 3, k ? -2 : 2);
          q.setFromAxisAngle(UP, Math.atan2(c2.x - c.x, c2.z - c.z) || c.yaw); m4.compose(v.set(c.x, (c.y + c2.y) / 2 + 0.45, c.z), q, inside ? one : v.clone().set(0.0001, 0.0001, 0.0001)); im.setMatrixAt(k * NC + i, m4); } }
      im.instanceMatrix.needsUpdate = true; }}; trains.place(0); }
  // ---------- parks: trees ----------
  const TMAX = L ? 250 : QUEST ? 600 : 1500, tl = [];
  const tps = O.a.filter(a => a.k === 'park' || a.k === 'wood' || a.k === 'scrub' || a.k === 'cemetery');
  for (const a of tps) { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; a.p.forEach(p => { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); });
    const st2 = a.k === 'wood' ? 14 : 30; for (let x = x0; x < x1; x += st2) for (let z = z0; z < z1; z += st2) { if (tl.length >= TMAX * 3) break; const xx = x + (r() - 0.5) * st2, zz = z + (r() - 0.5) * st2; if (cheb(xx, zz) < RIN + 5 || !K.inPoly(xx, zz, a.p) || inWater(xx, zz) || r() < (a.k === 'wood' ? 0.1 : 0.45)) continue; tl.push([xx, H(xx, zz), zz, 0.8 + r() * 0.6]); } }
  for (let i = tl.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = tl[i]; tl[i] = tl[j]; tl[j] = t; }
  const TL = tl.slice(0, TMAX);
  if (TL.length) { const crown = new THREE.IcosahedronGeometry(3.4, 0); crown.translate(0, 6.2, 0); const trunk = new THREE.CylinderGeometry(0.25, 0.35, 3.6, 5); trunk.translate(0, 1.8, 0);
    const ci = new THREE.InstancedMesh(crown, K.lamb({color: 0x4f6e35, flatShading: true}), TL.length), ti = new THREE.InstancedMesh(trunk, K.lamb({color: 0x5a4632}), TL.length), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), s3 = new THREE.Vector3(), cc = new THREE.Color();
    TL.forEach((t, i) => { q.setFromAxisAngle(UP, r() * 6.28); m4.compose(v.set(t[0], t[1], t[2]), q, s3.set(t[3], t[3] * (0.85 + r() * 0.4), t[3])); ci.setMatrixAt(i, m4); ti.setMatrixAt(i, m4); ci.setColorAt(i, cc.setHSL(0.24 + r() * 0.06, 0.35 + r() * 0.15, 0.25 + r() * 0.1)); });
    grp.add(ci, ti); }
  // ---------- landmarks (unlabelled) ----------
  const lmk = [], gold = [];
  for (const m of O.lm) { if (cheb(m.x, m.z) < RIN) continue; const y = H(m.x, m.z);
    if (m.k === 'wt') { lmk.push(K.xform(new THREE.CylinderGeometry(2.4, 3, 26, 10), m.x, y + 13, m.z), K.xform(new THREE.CylinderGeometry(7.5, 6, 8, 16), m.x, y + 30, m.z), K.xform(new THREE.CylinderGeometry(7.8, 7.8, 0.6, 16), m.x, y + 34.3, m.z)); }
    else if (m.k === 'w') {
      if (m.rel === 'c') lmk.push(K.box(4.5, 16, 4.5, m.x, y, m.z), K.xform(new THREE.ConeGeometry(3, 14, 8), m.x, y + 23, m.z));
      else if (m.rel === 'm') { gold.push(K.xform(new THREE.SphereGeometry(5.5, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), m.x, y + 9, m.z)); lmk.push(K.xform(new THREE.CylinderGeometry(0.9, 1.1, 26, 8), m.x + 8, y + 13, m.z), K.xform(new THREE.ConeGeometry(1.2, 3.5, 8), m.x + 8, y + 27.7, m.z)); }
      else if (m.rel === 's') gold.push(K.xform(new THREE.SphereGeometry(4.5, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), m.x, y + 9, m.z));
      else if (m.rel === 'h') lmk.push(K.xform(new THREE.ConeGeometry(4, 13, 6), m.x, y + 14, m.z)); } }
  if (lmk.length) grp.add(new THREE.Mesh(K.merge(lmk), K.lamb({color: 0xb7ab98})));
  if (gold.length) grp.add(new THREE.Mesh(K.merge(gold), K.std({color: 0xd9cfae, roughness: 0.45, metalness: 0.25})));
  // ---------- collision, fog, tick ----------
  const ob = K.polyIndex(coll, 25), inner = out.blocked; out.blocked = inner ? (x, z, y) => inner(x, z, y) || (cheb(x, z) > RIN - 30 && ob(x, z, y)) : ob;
  out.fog = L ? [0xc3c9cf, 250, 1500] : QUEST ? [0xc3c9cf, 350, 2300] : [0xc3c9cf, 450, 2900];
  const prevTick = out.tick; out.tick = (t, dt) => { if (prevTick) prevTick(t, dt); if (trains) trains.place(t); };
  out.outer = {b2: b2.length, b3: b3.length, roads: roads.length, trees: TL.length, lakes: waters.length, landmarks: O.lm.length};
}
})();
