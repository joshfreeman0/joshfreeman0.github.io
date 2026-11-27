/* Family home (staging, Nov 27 2026): a fictional lakeside cottage with a yard and a play area, for the companion family (C's
   companion module places the wife and kids from window.FP_HOME). Shared exhibit module like w3d/exhibits/*: needs only global THREE,
   no scene / renderer / XR of its own. FPX.familyhome.build(opts) -> {group, spawns, update(t), dispose()}; mount with
   FPX.mount('familyhome', sceneEl, rootEl, {position, rotationY, ground(xLocal, zLocal) -> yLocal}) or see fx/fphome.js (Fowling host).
   Local frame: house centred on the origin, front door facing -z, floor at y = FY. The only label is "Home" (privacy: fictional house). */
(function () {
  'use strict';
  const FPX = window.FPX = window.FPX || {};
  if (FPX.familyhome) return;
  const FY = 0.6, WH = 2.9, T = 0.2, HW = 6, HD = 4.5;   // floor height, wall height, wall thickness, half width / depth
  const LOT = {x0: -22, x1: 22, z0: -18, z1: 20};
  const PLAY = {x: 14, z: -6.5};
  const COL = {siding: '#f1eadb', trim: '#ffffff', roof: '#4b3d37', stone: '#8d8378', deck: '#9b7653', door: '#8a2b22', brick: '#8a4b3a', shutter: '#2f4f3a',
    wood: '#8a6a4a', rug: '#7a3b2e', sofa: '#5b6e8c', cream: '#e8dcc0', counter: '#d9d4c7', cab: '#6f8a7a', steel: '#b8bcc0', dark: '#3a302a',
    trunk: '#5a4330', leaf: ['#3f6b2c', '#4a7a33', '#36602a', '#55813a'], sand: '#e3cf9a', mulch: '#7a5a3e', red: '#c0392b', yellow: '#f1c40f', blue: '#2e86c1', green: '#27ae60', rope: '#5b4a3a'};

  /* merged vertex-coloured geometry (one draw call per material); boxes / cylinders / custom, with non-uniform scale */
  function Parts() { const list = [], m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), col = new THREE.Color();
    const P = {
      add(geo, color, x, y, z, rx, ry, rz, sx, sy, sz) { e.set(rx || 0, ry || 0, rz || 0, 'YXZ'); q.setFromEuler(e); m4.compose(new THREE.Vector3(x || 0, y || 0, z || 0), q, new THREE.Vector3(sx || 1, sy || 1, sz || 1));
        const g = geo.index ? geo.toNonIndexed() : geo.clone(); g.applyMatrix4(m4); if (!g.attributes.normal) g.computeVertexNormals(); list.push([g, color]); geo.dispose(); return P; },
      box(w, h, d, x, y, z, color, ry, rx, rz) { return P.add(new THREE.BoxGeometry(w, h, d), color, x, y, z, rx, ry, rz); },
      cyl(r0, r1, h, seg, x, y, z, color, rx, ry, rz) { return P.add(new THREE.CylinderGeometry(r0, r1, h, seg || 8, 1, false), color, x, y, z, rx, ry, rz); },
      ico(r, det, x, y, z, color, sy) { return P.add(new THREE.IcosahedronGeometry(r, det || 0), color, x, y, z, 0, 0, 0, 1, sy || 1, 1); },
      raw(pos, color) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); list.push([g, color]); return P; },
      count() { return list.length; },
      geometry() { let n = 0; for (const [g] of list) n += g.attributes.position.count;
        const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), clr = new Float32Array(n * 3); let o = 0;
        for (const [g, c] of list) { const p = g.attributes.position, nn = g.attributes.normal; col.set(c);
          for (let i = 0; i < p.count; i++, o++) { pos.set([p.getX(i), p.getY(i), p.getZ(i)], o * 3); nor.set([nn.getX(i), nn.getY(i), nn.getZ(i)], o * 3); clr.set([col.r, col.g, col.b], o * 3); } g.dispose(); }
        const G = new THREE.BufferGeometry(); G.setAttribute('position', new THREE.BufferAttribute(pos, 3)); G.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); G.setAttribute('color', new THREE.BufferAttribute(clr, 3));
        G.computeBoundingSphere(); list.length = 0; return G; } };
    return P; }
  const lambert = o => new THREE.MeshLambertMaterial(Object.assign({vertexColors: true}, o || {}));

  /* a wall along x (at z) or along z (at x) from a to b, with openings [{a, b, y0, y1}] (y relative to the floor) */
  function wall(P, axis, at, a, b, holes, color) {
    const H = WH, y = h0 => FY + h0, seg = (s0, s1, y0, y1) => { if (s1 - s0 < 0.01 || y1 - y0 < 0.01) return; const L = s1 - s0, c = (s0 + s1) / 2, ym = (y(y0) + y(y1)) / 2;
      if (axis === 'x') P.box(L, y1 - y0, T, c, ym, at, color); else P.box(T, y1 - y0, L, at, ym, c, color); };
    holes = (holes || []).slice().sort((p, q) => p.a - q.a); let s = a;
    for (const h of holes) { seg(s, h.a, 0, H); seg(h.a, h.b, 0, h.y0); seg(h.a, h.b, h.y1, H); s = h.b; }
    seg(s, b, 0, H); }
  /* window: trim frame + muntins on the outside (trim parts) and warm glass both sides (glow parts) */
  function windowAt(trim, glow, axis, at, c, w, y0, y1, out) {   // out: +1 / -1 = which side is outside
    const h = y1 - y0, ym = FY + (y0 + y1) / 2, o = out * (T / 2 + 0.03), gi = out * (T / 2 + 0.006);
    const B = (W, Hh, x, yy, d) => axis === 'x' ? trim.box(W, Hh, 0.06, x, yy, at + d, COL.trim) : trim.box(0.06, Hh, W, at + d, yy, x, COL.trim);
    B(w + 0.24, 0.12, c, FY + y1 + 0.06, o); B(w + 0.3, 0.1, c, FY + y0 - 0.05, o); B(0.12, h, c - w / 2 - 0.06, ym, o); B(0.12, h, c + w / 2 + 0.06, ym, o);
    B(0.05, h, c, ym, o); B(w, 0.05, c, ym, o);
    for (const s of [1, -1]) { if (axis === 'x') glow.box(w, h, 0.01, c, ym, at + s * gi, '#ffd38a'); else glow.box(0.01, h, w, at + s * gi, ym, c, '#ffd38a'); } }
  function tree(P, x, z, g, s, i) { P.cyl(0.16 * s, 0.24 * s, 3.2 * s, 6, x, g + 1.5 * s, z, COL.trunk);
    P.ico(2.3 * s, 1, x, g + 4.4 * s, z, COL.leaf[i % 4], 0.9); P.ico(1.6 * s, 0, x + 0.9 * s, g + 3.6 * s, z - 0.5 * s, COL.leaf[(i + 1) % 4]); }
  function label(text) { const c = document.createElement('canvas'); c.width = 512; c.height = 176; const g = c.getContext('2d');
    g.fillStyle = '#2f4f3a'; g.fillRect(0, 0, 512, 176); g.strokeStyle = '#d4af37'; g.lineWidth = 10; g.strokeRect(8, 8, 496, 160);
    g.fillStyle = '#f6e7b8'; g.font = 'bold 104px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 256, 92);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
  function picketTex() { const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d'); g.clearRect(0, 0, 256, 128); g.fillStyle = '#f7f5ee';
    for (let i = 0; i < 4; i++) { const x = i * 64 + 14; g.beginPath(); g.moveTo(x, 128); g.lineTo(x, 22); g.lineTo(x + 18, 4); g.lineTo(x + 36, 22); g.lineTo(x + 36, 128); g.fill(); }
    g.fillRect(0, 36, 256, 12); g.fillRect(0, 96, 256, 12);
    const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }

  function build(opts) {
    opts = opts || {}; const lite = !!opts.lite, gl = typeof opts.ground === 'function' ? (x, z) => { const v = opts.ground(x, z); return isFinite(v) ? v : 0; } : () => 0;
    const group = new THREE.Group(); group.name = 'family-home';
    const ext = Parts(), trim = Parts(), glow = Parts(), inn = Parts(), yard = Parts(), mats = [], geos = [], texs = [];
    const keep = (m) => { mats.push(m.material); geos.push(m.geometry); return m; };

    /* ---------- house shell ---------- */
    const gMin = Math.min(gl(-HW, -HD - 3), gl(HW, -HD - 3), gl(-HW, HD), gl(HW, HD), gl(0, 0));
    const footD = Math.max(0.8, FY - gMin + 0.4);
    ext.box(HW * 2 + 0.3, footD, HD * 2 + 0.3, 0, FY - footD / 2, 0, COL.stone);                 // foundation down into the ground
    const front = [{a: -0.55, b: 0.55, y0: 0, y1: 2.2}, {a: -4.3, b: -2.9, y0: 0.9, y1: 2.2}, {a: 2.9, b: 4.3, y0: 0.9, y1: 2.2}];
    const back = [{a: 0.7, b: 1.7, y0: 0, y1: 2.15}, {a: -4.3, b: -2.9, y0: 0.9, y1: 2.2}, {a: 2.8, b: 4.0, y0: 1.0, y1: 2.1}];
    const side = [{a: -2.6, b: -1.4, y0: 0.9, y1: 2.2}, {a: 1.3, b: 2.5, y0: 0.9, y1: 2.2}];
    wall(ext, 'x', -HD, -HW - T / 2, HW + T / 2, front, COL.siding); wall(ext, 'x', HD, -HW - T / 2, HW + T / 2, back, COL.siding);
    wall(ext, 'z', -HW, -HD + T / 2, HD - T / 2, side, COL.siding); wall(ext, 'z', HW, -HD + T / 2, HD - T / 2, side, COL.siding);
    front.slice(1).forEach(h => { windowAt(trim, glow, 'x', -HD, (h.a + h.b) / 2, h.b - h.a, h.y0, h.y1, -1); for (const s of [-1, 1]) trim.box(0.45, h.y1 - h.y0 + 0.1, 0.05, (h.a + h.b) / 2 + s * ((h.b - h.a) / 2 + 0.42), FY + (h.y0 + h.y1) / 2, -HD - 0.13, COL.shutter); });
    back.slice(1).forEach(h => windowAt(trim, glow, 'x', HD, (h.a + h.b) / 2, h.b - h.a, h.y0, h.y1, 1));
    for (const sx of [-1, 1]) side.forEach(h => windowAt(trim, glow, 'z', sx * HW, (h.a + h.b) / 2, h.b - h.a, h.y0, h.y1, sx));
    for (const [x, z] of [[-HW, -HD], [HW, -HD], [-HW, HD], [HW, HD]]) trim.box(0.26, WH, 0.26, x, FY + WH / 2, z, COL.trim);   // corner boards
    // doors: front (open, swung in on its hinge) and back (open)
    ext.box(1.06, 2.16, 0.06, -0.55 + 0.53 * Math.cos(1.25), FY + 1.08, -HD + 0.53 * Math.sin(1.25), COL.door, -1.25);
    ext.box(0.96, 2.1, 0.06, 0.7 + 0.48 * Math.cos(1.2), FY + 1.05, HD - 0.48 * Math.sin(1.2), COL.cab, 1.2);
    trim.box(1.4, 0.14, 0.08, 0, FY + 2.27, -HD - 0.12, COL.trim); for (const s of [-1, 1]) trim.box(0.12, 2.2, 0.08, s * 0.64, FY + 1.1, -HD - 0.12, COL.trim);
    // roof: gable, ridge along x
    const top = FY + WH, rise = 2.3, run = HD + 0.6, slope = Math.atan2(rise, run), len = Math.hypot(rise, run) + 0.05;
    for (const s of [-1, 1]) ext.box(HW * 2 + 1.0, 0.16, len, 0, top + rise / 2 - 0.12, s * run / 2, COL.roof, 0, s * slope);
    const ry = top + rise - 0.2;
    for (const x of [-HW - T / 2, HW + T / 2]) { const a = [x, top, -HD - T / 2], b = [x, top, HD + T / 2], c = [x, ry, 0];
      ext.raw(x < 0 ? [...a, ...b, ...c] : [...a, ...c, ...b], COL.siding); }
    ext.box(0.9, 3.0, 0.9, 4.2, top + 1.2, 1.6, COL.brick); ext.box(1.05, 0.15, 1.05, 4.2, top + 2.75, 1.6, COL.stone);
    // porch: deck, steps down to the ground, posts, rails, roof; a "Home" sign over the door
    const PZ0 = -HD - 2.6;
    ext.box(8.4, footD, 2.6, 0, FY - footD / 2, -HD - 1.3, COL.stone); ext.box(8.6, 0.1, 2.75, 0, FY - 0.05, -HD - 1.35, COL.deck);
    const gStep = gl(0, PZ0 - 1.2), nSt = Math.max(1, Math.ceil((FY - gStep) / 0.19)), stH = (FY - gStep) / nSt, steps = [];
    for (let i = 1; i <= nSt; i++) { const yTop = FY - i * stH, z = PZ0 - 0.32 * (i - 0.5); ext.box(2.4, yTop - gStep + 0.4, 0.34, 0, (yTop + gStep - 0.4) / 2, z, COL.deck); steps.push({x0: -1.2, x1: 1.2, z0: z - 0.17, z1: z + 0.17, y: yTop}); }
    for (const x of [-4.1, -1.35, 1.35, 4.1]) trim.box(0.18, WH - 0.3, 0.18, x, FY + (WH - 0.3) / 2, PZ0 + 0.15, COL.trim);
    for (const [a, b] of [[-4.1, -1.35], [1.35, 4.1]]) { const c = (a + b) / 2, L = b - a; trim.box(L, 0.08, 0.1, c, FY + 0.92, PZ0 + 0.15, COL.trim); trim.box(L, 0.06, 0.08, c, FY + 0.12, PZ0 + 0.15, COL.trim);
      for (let x = a + 0.22; x < b - 0.1; x += 0.22) trim.box(0.05, 0.8, 0.05, x, FY + 0.52, PZ0 + 0.15, COL.trim); }
    for (const x of [-4.1, 4.1]) { trim.box(0.1, 0.08, 2.5, x, FY + 0.92, -HD - 1.25, COL.trim); for (let z = PZ0 + 0.4; z < -HD - 0.1; z += 0.22) trim.box(0.05, 0.8, 0.05, x, FY + 0.52, z, COL.trim); }
    ext.box(9.0, 0.14, 3.3, 0, FY + WH + 0.02, -HD - 1.45, COL.roof, 0, -0.12);
    glow.box(0.16, 0.26, 0.16, 1.05, FY + 1.85, -HD - 0.16, '#ffe2a0'); trim.box(0.2, 0.05, 0.2, 1.05, FY + 2.0, -HD - 0.16, COL.dark);   // porch lantern
    yard.box(1.2, 0.5, 0.5, -3.0, FY + 0.25, -HD - 0.5, COL.deck);   // porch bench
    const sign = keep(new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.38), new THREE.MeshBasicMaterial({map: label('Home'), toneMapped: false})));
    texs.push(sign.material.map); sign.position.set(0, FY + 2.6, -HD - 0.13); sign.rotation.y = Math.PI; sign.name = 'home-sign'; group.add(sign);   // plane faces +z by default; turned to face the porch (-z)

    /* ---------- interior: living room (west), kitchen + dining (east) ---------- */
    inn.box(HW * 2 - T, 0.04, HD * 2 - T, 0, FY + 0.02, 0, COL.wood);
    inn.box(HW * 2 - T, 0.06, HD * 2 - T, 0, FY + WH - 0.03, 0, COL.cream);
    inn.box(3.4, 0.02, 2.4, -3.0, FY + 0.05, 0.6, COL.rug);
    inn.box(2.5, 0.42, 0.9, -3.0, FY + 0.25, 2.8, COL.sofa); inn.box(2.5, 0.55, 0.22, -3.0, FY + 0.7, 3.15, COL.sofa); for (const s of [-1, 1]) inn.box(0.22, 0.6, 0.9, -3.0 + s * 1.2, FY + 0.32, 2.8, COL.sofa);
    inn.box(1.2, 0.08, 0.6, -3.0, FY + 0.42, 1.0, COL.wood); for (const [x, z] of [[-3.5, 0.8], [-2.5, 0.8], [-3.5, 1.2], [-2.5, 1.2]]) inn.box(0.05, 0.4, 0.05, x, FY + 0.2, z, COL.dark);
    inn.box(0.5, 1.3, 2.0, -HW + 0.35, FY + 0.65, 0.4, COL.stone); inn.box(0.6, 0.1, 2.3, -HW + 0.4, FY + 1.35, 0.4, COL.wood);   // fireplace + mantel
    glow.box(0.04, 0.55, 0.9, -HW + 0.61, FY + 0.4, 0.4, '#ff8a2a');
    inn.box(0.9, 0.8, 0.9, -4.6, FY + 0.4, -2.6, COL.sofa); inn.box(0.9, 0.5, 0.2, -4.6, FY + 0.95, -2.95, COL.sofa);   // armchair
    inn.box(1.6, 2.0, 0.35, -4.3, FY + 1.0, HD - 0.3, COL.wood); for (let i = 0; i < 4; i++) inn.box(1.4, 0.3, 0.25, -4.3, FY + 0.35 + i * 0.48, HD - 0.33, ['#7a3b2e', '#2e5a7a', '#c0a060', '#4a6b3a'][i]);
    inn.cyl(0.03, 0.03, 1.5, 6, -1.4, FY + 0.75, 3.6, COL.dark); glow.cyl(0.18, 0.25, 0.3, 8, -1.4, FY + 1.6, 3.6, '#ffe2a0');   // floor lamp
    inn.box(0.12, 1.6, 2.6, -0.1, FY + 0.8, 2.6, COL.siding);   // low divider between living and kitchen (keeps the front open)
    inn.box(3.5, 0.9, 0.62, 3.75, FY + 0.45, HD - 0.42, COL.cab); inn.box(3.6, 0.05, 0.66, 3.75, FY + 0.92, HD - 0.42, COL.counter);   // back counter
    inn.box(0.62, 0.9, 3.0, HW - 0.42, FY + 0.45, 1.6, COL.cab); inn.box(0.66, 0.05, 3.1, HW - 0.42, FY + 0.92, 1.6, COL.counter);
    inn.box(0.8, 1.9, 0.75, HW - 0.5, FY + 0.95, -0.6, COL.steel);   // fridge
    inn.box(2.0, 0.88, 0.9, 3.0, FY + 0.44, 1.4, COL.cab); inn.box(2.1, 0.05, 1.0, 3.0, FY + 0.9, 1.4, COL.counter);   // island
    inn.box(1.6, 0.06, 0.95, 2.8, FY + 0.75, -2.4, COL.wood); for (const [x, z] of [[2.15, -2.05], [3.45, -2.05], [2.15, -2.75], [3.45, -2.75]]) inn.box(0.06, 0.72, 0.06, x, FY + 0.36, z, COL.dark);
    for (const [x, z] of [[2.3, -1.65], [3.3, -1.65], [2.3, -3.15], [3.3, -3.15]]) { inn.box(0.42, 0.06, 0.42, x, FY + 0.45, z, COL.wood); inn.box(0.42, 0.45, 0.05, x, FY + 0.7, z + (z > -2.4 ? 0.2 : -0.2), COL.wood); }
    glow.cyl(0.25, 0.12, 0.2, 8, 2.8, FY + 2.2, -2.4, '#ffe2a0'); inn.cyl(0.01, 0.01, 0.6, 4, 2.8, FY + 2.6, -2.4, COL.dark);
    glow.cyl(0.2, 0.1, 0.18, 8, 3.0, FY + 2.25, 1.4, '#ffe2a0');

    /* ---------- yard: lawn, fence with a front gate, path, trees, shrubs ---------- */
    const lawnG = new THREE.PlaneGeometry(LOT.x1 - LOT.x0, LOT.z1 - LOT.z0, lite ? 11 : 22, lite ? 10 : 19); lawnG.rotateX(-Math.PI / 2); lawnG.translate((LOT.x0 + LOT.x1) / 2, 0, (LOT.z0 + LOT.z1) / 2);
    { const p = lawnG.attributes.position, cl = []; const c = new THREE.Color();
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, gl(x, z) + 0.06); const n = Math.sin(x * 0.7) * Math.cos(z * 0.9) * 0.04; c.set('#567a38').offsetHSL(0, 0, n); cl.push(c.r, c.g, c.b); }
      lawnG.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3)); lawnG.computeVertexNormals(); }
    const lawn = keep(new THREE.Mesh(lawnG, lambert({polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2}))); lawn.receiveShadow = true; lawn.name = 'home-lawn'; group.add(lawn);
    // picket fence: alpha-tested panels that follow the ground, 2 m segments, gate gap at the front path
    { const pos = [], uv = [], H = 1.0, tex = picketTex(); texs.push(tex);
      const run = (ax, az, bx, bz) => { const L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(L / 2));
        for (let i = 0; i < n; i++) { const t0 = i / n, t1 = (i + 1) / n, x0 = ax + (bx - ax) * t0, z0 = az + (bz - az) * t0, x1 = ax + (bx - ax) * t1, z1 = az + (bz - az) * t1, g0 = gl(x0, z0), g1 = gl(x1, z1), u0 = t0 * L / 1.0, u1 = t1 * L / 1.0;
          pos.push(x0, g0, z0, x1, g1, z1, x1, g1 + H, z1, x0, g0, z0, x1, g1 + H, z1, x0, g0 + H, z0); uv.push(u0, 0, u1, 0, u1, 1, u0, 0, u1, 1, u0, 1); } };
      run(LOT.x0, LOT.z0, -1.4, LOT.z0); run(1.4, LOT.z0, LOT.x1, LOT.z0); run(LOT.x1, LOT.z0, LOT.x1, LOT.z1); run(LOT.x1, LOT.z1, LOT.x0, LOT.z1); run(LOT.x0, LOT.z1, LOT.x0, LOT.z0);
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.computeVertexNormals();
      const f = keep(new THREE.Mesh(g, new THREE.MeshLambertMaterial({map: tex, alphaTest: 0.5, side: THREE.DoubleSide}))); f.name = 'home-fence'; group.add(f);
      for (const x of [-1.45, 1.45]) yard.box(0.16, 1.3, 0.16, x, gl(x, LOT.z0) + 0.6, LOT.z0, COL.trim); }
    for (let z = PZ0 - 0.32 * nSt - 0.6; z > LOT.z0 + 0.3; z -= 0.95) yard.box(0.95, 0.08, 0.62, Math.sin(z) * 0.12, gl(0, z) + 0.07, z, '#a79d8f', Math.sin(z * 3) * 0.15);   // flagstone path
    for (let z = HD + 1.2; z < HD + 3.6; z += 0.9) yard.box(0.8, 0.08, 0.6, 1.2, gl(1.2, z) + 0.07, z, '#a79d8f');                // back door path
    const trees = [[-17, -12, 1.15], [-18, 9, 1.0], [-9, 15.5, 0.95], [5, 16.5, 1.05], [17.5, 12, 1.25]];
    trees.forEach(([x, z, s], i) => tree(yard, x, z, gl(x, z), s, i));
    for (const [x, z] of [[-5.2, -5.0], [-4.6, -7.5], [4.6, -7.5], [5.2, -5.0], [-6.6, 2.0], [6.6, -2.0]]) yard.ico(0.55, 0, x, gl(x, z) + 0.4, z, COL.leaf[(x > 0) + 1], 0.8);   // foundation shrubs
    for (let i = 0; i < 14; i++) { const x = -3.9 + i * 0.28, z = -7.2 - (i % 2) * 0.15; if (Math.abs(x) < 1.4) continue; yard.ico(0.09, 0, x, gl(x, z) + 0.18, z, ['#e74c3c', '#f5b7b1', '#f4d03f', '#ffffff'][i % 4]); }   // flowers

    /* ---------- play area (east side yard, in view from the porch): swing set, slide, sandbox, treehouse ---------- */
    { const cx = PLAY.x, cz = PLAY.z, g0 = gl(cx, cz), pG = new THREE.PlaneGeometry(12, 13, 6, 6); pG.rotateX(-Math.PI / 2); pG.translate(cx, 0, cz + 0.5);
      const p = pG.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, gl(p.getX(i), p.getZ(i)) + 0.1); pG.computeVertexNormals();
      const mulch = keep(new THREE.Mesh(pG, new THREE.MeshLambertMaterial({color: COL.mulch, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4}))); mulch.receiveShadow = true; group.add(mulch);
      // swing set (bar along x at z = -11), legs as A-frames
      const sz = -11, sg = gl(14, sz), bar = sg + 2.4;
      yard.cyl(0.06, 0.06, 4.4, 8, 14, bar, sz, COL.green, 0, 0, Math.PI / 2);
      for (const x of [11.9, 16.1]) for (const s of [-1, 1]) yard.cyl(0.05, 0.05, 2.6, 6, x, sg + 1.2, sz + s * 0.3, COL.green, -s * 0.23);
      // slide: platform on posts + ladder, chute down toward -x
      const lx = 18.2, lz = -4.0, lg = gl(lx, lz), ph = 1.5;
      yard.box(1.3, 0.1, 1.3, lx, lg + ph, lz, COL.wood); for (const [dx, dz] of [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]]) yard.box(0.1, ph + 0.9, 0.1, lx + dx, lg + (ph + 0.9) / 2, lz + dz, COL.wood);
      for (const s of [-1, 1]) yard.box(1.3, 0.06, 0.06, lx, lg + ph + 0.8, lz + s * 0.6, COL.wood); yard.box(1.2, 0.8, 0.04, lx, lg + ph + 0.4, lz + 0.62, COL.yellow);
      for (const s of [-1, 1]) yard.box(0.06, 1.9, 0.06, lx + 0.9, lg + 0.85, lz + s * 0.35, COL.wood, 0, 0, 0.35); for (let k = 1; k <= 4; k++) yard.box(0.06, 0.04, 0.7, lx + 1.22 - 0.12 * k, lg + k * 0.34, lz, COL.wood);
      const sl = 3.4, ang = Math.atan2(ph, 2.9); yard.box(sl, 0.06, 0.62, lx - 0.65 - 1.45, lg + ph / 2 + 0.05, lz, COL.red, 0, 0, ang);
      for (const s of [-1, 1]) yard.box(sl, 0.2, 0.05, lx - 0.65 - 1.45, lg + ph / 2 + 0.15, lz + s * 0.31, COL.red, 0, 0, ang);
      // sandbox
      const bx = 11, bz = -3, bg = gl(bx, bz); for (const [dx, dz, w, d] of [[0, -1.2, 2.5, 0.14], [0, 1.2, 2.5, 0.14], [-1.2, 0, 0.14, 2.5], [1.2, 0, 0.14, 2.5]]) yard.box(w, 0.3, d, bx + dx, bg + 0.15, bz + dz, COL.wood);
      yard.box(2.26, 0.2, 2.26, bx, bg + 0.1, bz, COL.sand); yard.cyl(0.12, 0.09, 0.2, 8, bx + 0.5, bg + 0.3, bz - 0.4, COL.blue); yard.box(0.08, 0.02, 0.3, bx + 0.7, bg + 0.21, bz - 0.1, COL.yellow, 0.4);
      // treehouse on the big tree (17.5, 12): platform, little hut, roof, ladder
      const tx = 17.5, tz = 12, tg = gl(tx, tz), th = 2.7;
      yard.box(2.6, 0.12, 2.6, tx, tg + th, tz, COL.wood); for (const [dx, dz] of [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]]) yard.box(0.14, th, 0.14, tx + dx, tg + th / 2, tz + dz, COL.wood);
      yard.box(1.9, 1.3, 1.9, tx + 0.15, tg + th + 0.71, tz + 0.15, '#c98b52'); yard.box(0.6, 0.9, 0.02, tx - 0.2, tg + th + 0.55, tz - 0.81, COL.dark);
      for (const s of [-1, 1]) yard.box(2.3, 0.08, 1.4, tx + 0.15, tg + th + 1.68, tz + 0.15 + s * 0.6, COL.red, 0, s * 0.6);
      for (const s of [-1, 1]) yard.box(0.06, th + 0.2, 0.06, tx - 0.5 + s * 0.25, tg + th / 2, tz - 1.55, COL.wood, 0, 0.2); for (let k = 1; k <= 7; k++) yard.box(0.56, 0.04, 0.05, tx - 0.5, tg + k * 0.36, tz - 1.6 + k * 0.073, COL.wood);
      yard.box(1.0, 0.45, 0.45, 9.0, gl(9, -9) + 0.45, -9, COL.wood); }   // parents' bench by the swings
    // two swings: separate light meshes so they can sway
    const swings = [];
    { const sz = -11, sg = gl(14, sz), bar = sg + 2.4;
      for (const [x, c] of [[13.1, COL.blue], [14.9, COL.red]]) { const sw = Parts(); for (const s of [-1, 1]) sw.box(0.025, 1.85, 0.025, s * 0.22, -0.93, 0, COL.rope); sw.box(0.52, 0.05, 0.2, 0, -1.86, 0, c);
        const m = keep(new THREE.Mesh(sw.geometry(), lambert())); m.position.set(x, bar, sz); m.castShadow = true; group.add(m); swings.push(m); } }

    /* ---------- meshes ---------- */
    const mk = (P, mat, name, cast, recv) => { if (!P.count()) return null; const m = keep(new THREE.Mesh(P.geometry(), mat)); m.name = name; m.castShadow = cast; m.receiveShadow = recv; group.add(m); return m; };
    mk(ext, lambert(), 'home-shell', true, true); mk(trim, lambert(), 'home-trim', true, false); mk(inn, lambert({emissive: 0x2a241c}), 'home-interior', false, false);   // a little self-light: rooms read warm, not dark, with no extra lights
    mk(glow, new THREE.MeshBasicMaterial({vertexColors: true, toneMapped: false}), 'home-glow', false, false); mk(yard, lambert(), 'home-yard', true, true);

    let tris = 0; group.traverse(o => { if (o.isMesh) { const g = o.geometry; tris += (g.index ? g.index.count : g.attributes.position.count) / 3; } });
    /* walkable surfaces + walls (local frame; the host converts to world) */
    const floors = [{x0: -HW + T / 2, x1: HW - T / 2, z0: -HD + T / 2, z1: HD - T / 2, y: FY}, {x0: -4.2, x1: 4.2, z0: PZ0, z1: -HD, y: FY}, {x0: -0.55, x1: 0.55, z0: -HD - 0.15, z1: -HD + 0.15, y: FY},
      {x0: 0.7, x1: 1.7, z0: HD - 0.15, z1: HD + 0.6, y: FY}].concat(steps);
    const walls = []; const W = (axis, at, a, b, holes) => { holes = holes.slice().sort((p, q) => p.a - q.a); let s = a; const push = (s0, s1) => { if (s1 - s0 < 0.05) return;
      walls.push(axis === 'x' ? {x0: s0, x1: s1, z0: at - T / 2, z1: at + T / 2, y0: FY, y1: FY + WH} : {x0: at - T / 2, x1: at + T / 2, z0: s0, z1: s1, y0: FY, y1: FY + WH}); };
      for (const h of holes) { if (h.y0 < 0.1) { push(s, h.a); s = h.b; } } push(s, b); };
    W('x', -HD, -HW, HW, front); W('x', HD, -HW, HW, back); W('z', -HW, -HD, HD, side); W('z', HW, -HD, HD, side);
    for (const [a, b] of [[-4.2, -1.35], [1.35, 4.2]]) walls.push({x0: a, x1: b, z0: PZ0 + 0.05, z1: PZ0 + 0.25, y0: FY, y1: FY + 1.0});   // porch rails
    walls.push({x0: -4.2, x1: -4.0, z0: PZ0, z1: -HD, y0: FY, y1: FY + 1.0}, {x0: 4.0, x1: 4.2, z0: PZ0, z1: -HD, y0: FY, y1: FY + 1.0});

    /* spawn spots (local; rotationY in degrees, 0 = facing -z) */
    const face = (x, z, tx, tz) => Math.round(Math.atan2(-(tx - x), -(tz - z)) * 180 / Math.PI);
    const at = (x, z, y, r) => ({x, y: y != null ? y : gl(x, z), z, rotationY: r});
    const spawns = {
      porch: at(0, -6.4, FY, 0),
      wife: at(-1.3, -5.2, FY, 0),
      kids: [at(13.1, -9.4, null, face(13.1, -9.4, 0, -6.4)), at(11.0, -1.4, null, face(11.0, -1.4, 0, -6.4)), at(15.8, -4.6, null, face(15.8, -4.6, 0, -6.4))],
      yard: at(-9.5, -10, null, face(-9.5, -10, 0, -5)),
      play: at(PLAY.x, PLAY.z, null, face(PLAY.x, PLAY.z, 0, -6.4)),
      kitchen: at(2.0, 0.2, FY, 180), living: at(-3.0, -1.2, FY, 180)
    };
    return {group, spawns, floors, walls, tris: Math.round(tris), lot: LOT, FY,
      update(t) { swings.forEach((m, i) => { m.rotation.x = Math.sin(t * (1.1 + i * 0.13) + i * 1.7) * (0.18 + 0.05 * i); }); },
      dispose() { if (group.parent) group.parent.remove(group); geos.forEach(g => g.dispose()); mats.forEach(m => m.dispose()); texs.forEach(t => t.dispose()); } };
  }
  FPX.familyhome = {build, version: 1};
})();
