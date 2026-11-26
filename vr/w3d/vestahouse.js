/* House of the Vestal Virgins (Atrium Vestae), built intact around the Vestals court beside the Temple of Vesta. After the last
   rebuilding (Septimius Severus / Julia Domna, after the fire of AD 191): a brick-faced house about 115 x 53 m, two storeys around a
   long open court with three pools, a two-storey portico (cipollino columns below, smaller breccia-corallina columns on the upper
   gallery), marble trim and tiled roofs. Ground floor: the barrel-vaulted hall ("tablinum") raised three steps and fronted by two
   columns, with three small rooms on each side; storerooms, a kitchen, the oven and the mill with its millstones on the south side,
   after the stair; a dining room and the household shrine behind the hall. Upper floor: the Vestals' bedrooms (furnished, with doors),
   baths and service rooms, reached by two stairs. In Rome the temple stands at the west end and the hall at the east; here the temple
   is east of the court, so the plan is mirrored: the entrance faces the temple (with the little shrine on its right) and the hall is at
   the far end. Everything is merged per material (one mesh each), columns are instanced; ~10k tris on phones. */
(function () {
const W3D = window.W3D = window.W3D || {};
const X0 = 853, X1 = 968, Z0 = -323.8, Z1 = -270.8, WT = 0.8;                 // outer footprint 115 x 53 m
const IX0 = X0 + WT, IX1 = X1 - WT, IZ0 = Z0 + WT, IZ1 = Z1 - WT;            // inside faces of the outer walls
const O = {x0: 895, x1: 957, z0: -308.3, z1: -286.3};                         // open court (columns stand on this line), centre 926, -297.3
const PX0 = 890.8, PX1 = 961.2, PZ0 = -312.5, PZ1 = -282.1;                   // portico back walls (centre lines)
const ENT = -307.5;                                                           // entrance axis (faces the temple at 985, -318)
function cnv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function tex(c) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; }
let sd = 11; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
function brickC() { const c = cnv(512, 512), g = c.getContext('2d'); g.fillStyle = '#b9ab92'; g.fillRect(0, 0, 512, 512);   // 2 m: thin Roman bricks in grey-buff mortar
  for (let r = 0; r < 40; r++) { const y = r * 12.8, off = (r % 2) * 40; for (let x = -off; x < 512; x += 80) { const t = rnd(), s = 0.85 + rnd() * 0.25;
    g.fillStyle = 'rgb(' + Math.round((150 + t * 40) * s) + ',' + Math.round((78 + t * 26) * s) + ',' + Math.round((52 + t * 16) * s) + ')'; g.fillRect(x + 2, y + 2, 76, 9.6); } }
  for (let i = 0; i < 900; i++) { g.fillStyle = 'rgba(' + (rnd() < 0.5 ? '60,40,30' : '230,210,180') + ',' + rnd() * 0.12 + ')'; g.fillRect(rnd() * 512, rnd() * 512, 3 + rnd() * 10, 1 + rnd() * 2); }
  return c; }
function paintC() { const c = cnv(512, 512), g = c.getContext('2d');   // one storey high, 3 m wide: dark-red dado, black band, red panels framed in ochre, cream frieze
  g.fillStyle = '#e9dcc0'; g.fillRect(0, 0, 512, 512);
  g.fillStyle = '#6e2018'; g.fillRect(0, 400, 512, 112); for (let i = 0; i < 300; i++) { g.fillStyle = 'rgba(' + (rnd() < 0.5 ? '30,10,8' : '170,90,70') + ',' + rnd() * 0.3 + ')'; g.fillRect(rnd() * 512, 400 + rnd() * 112, 4 + rnd() * 18, 1 + rnd() * 4); }
  g.fillStyle = '#1c1612'; g.fillRect(0, 388, 512, 12); g.fillStyle = '#a3321f'; g.fillRect(24, 120, 464, 256);
  g.strokeStyle = '#d9a83c'; g.lineWidth = 6; g.strokeRect(36, 132, 440, 232); g.strokeStyle = '#efe4c8'; g.lineWidth = 2; g.strokeRect(50, 146, 412, 204);
  g.fillStyle = '#d9a83c'; g.beginPath(); g.arc(256, 248, 26, 0, 7); g.fill(); g.fillStyle = '#a3321f'; g.beginPath(); g.arc(256, 248, 18, 0, 7); g.fill();
  g.fillStyle = '#c9b48c'; g.fillRect(0, 70, 512, 6); g.strokeStyle = '#5d7a46'; g.lineWidth = 4; g.beginPath(); for (let x = 0; x <= 512; x += 8) g.lineTo(x, 40 + Math.sin(x / 512 * Math.PI * 6) * 14); g.stroke();
  g.fillStyle = '#a3321f'; for (let x = 32; x < 512; x += 85) { g.beginPath(); g.arc(x, 40 + Math.sin(x / 512 * Math.PI * 6) * 14, 5, 0, 7); g.fill(); }
  return c; }
function mosaicC() { const c = cnv(512, 512), g = c.getContext('2d'); g.fillStyle = '#e8e0d0'; g.fillRect(0, 0, 512, 512);   // 4 m: black-and-white geometric mosaic
  for (let i = 0; i < 5000; i++) { g.fillStyle = 'rgba(120,110,95,' + rnd() * 0.18 + ')'; g.fillRect(rnd() * 512, rnd() * 512, 3, 3); }
  g.fillStyle = '#26221e'; g.fillRect(0, 0, 512, 14); g.fillRect(0, 0, 14, 512); g.fillRect(0, 248, 512, 8); g.fillRect(248, 0, 8, 512);
  for (const [cx, cy] of [[128, 128], [384, 128], [128, 384], [384, 384]]) { g.save(); g.translate(cx, cy); g.rotate(Math.PI / 4); g.strokeStyle = '#26221e'; g.lineWidth = 10; g.strokeRect(-60, -60, 120, 120); g.fillStyle = '#8a3a26'; g.fillRect(-18, -18, 36, 36); g.restore(); }
  return c; }
function tileC() { const c = cnv(256, 256), g = c.getContext('2d'); g.fillStyle = '#8e4a2c'; g.fillRect(0, 0, 256, 256);   // 2 m: tegulae + imbrex ridges running down-slope (v)
  for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) { const t = rnd(); g.fillStyle = 'rgb(' + Math.round(165 + t * 35) + ',' + Math.round(82 + t * 25) + ',' + Math.round(50 + t * 15) + ')'; g.fillRect(k * 64 + 8, r * 64 + 3, 48, 58); g.fillStyle = 'rgba(40,20,10,0.35)'; g.fillRect(k * 64 + 8, r * 64 + 56, 48, 6); }
  for (let k = 0; k < 4; k++) { const gr = g.createLinearGradient(k * 64 - 10, 0, k * 64 + 10, 0); gr.addColorStop(0, '#5a2a18'); gr.addColorStop(0.5, '#c27a4e'); gr.addColorStop(1, '#5a2a18'); g.fillStyle = gr; g.fillRect(k * 64 - 10, 0, 20, 256); }
  return c; }
function ceilC() { const c = cnv(256, 256), g = c.getContext('2d'); g.fillStyle = '#6a4a30'; g.fillRect(0, 0, 256, 256);   // 2 m: timber beams and boards
  for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? '#7a5638' : '#714f33'; g.fillRect(0, i * 16, 256, 15); } g.fillStyle = '#4a3020'; g.fillRect(0, 0, 256, 34); g.fillRect(0, 128, 256, 34);
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 34, 256, 4); g.fillRect(0, 162, 256, 4); return c; }
function build() {
  const L = W3D.lib, lite = !!W3D.lite;
  const root = new THREE.Group(); root.name = 'vesta-house'; W3D.vesta.add(root); W3D.vestaHouse = root;
  const gy = W3D.groundAt(926, -297.3, -1e4), F = gy + 0.45, U = F + 5.0, T = U + 4.4, CF = gy + 0.30;   // floors: house, upper, wall top; court paving
  let lo = 1e9; for (let x = X0; x <= X1; x += 5) for (let z = Z0; z <= Z1; z += 5) lo = Math.min(lo, W3D.groundAt(x, z, -1e4)); const YB = lo - 0.4;   // foundations reach the slope
  // ---- merge bins: world-space geometry per material, UVs box-mapped from world position (metres / scale) ----
  const bins = {}, m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3(1, 1, 1);
  const put = (k, g, x, y, z, ry, rx, rz, o) => { g = g.index ? g.toNonIndexed() : g; e.set(rx || 0, ry || 0, rz || 0); q.setFromEuler(e); m4.compose(v.set(x, y, z), q, sc); g.applyMatrix4(m4); g.userData.o = o || null; (bins[k] = bins[k] || []).push(g); };
  const box = (k, x0, x1, y0, y1, z0, z1, o) => put(k, new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, 0, 0, 0, o);
  const UVS = {brick: 2, paint: 3, floor: 4, tile: 2, ceil: 2, marble: 1.5, stone: 2};
  const flush = (k, mat, shadow) => { const L2 = bins[k]; if (!L2) return null; let n = 0; for (const g of L2) n += g.attributes.position.count;
    const P = new Float32Array(n * 3), N = new Float32Array(n * 3), UV = new Float32Array(n * 2), s = UVS[k] || 2; let o = 0;
    for (const g of L2) { const p = g.attributes.position, nn = g.attributes.normal, op = g.userData.o || {};
      for (let i = 0; i < p.count; i++, o++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), ax = Math.abs(nn.getX(i)), ay = Math.abs(nn.getY(i)), az = Math.abs(nn.getZ(i));
        P[o * 3] = x; P[o * 3 + 1] = y; P[o * 3 + 2] = z; N[o * 3] = nn.getX(i); N[o * 3 + 1] = nn.getY(i); N[o * 3 + 2] = nn.getZ(i);
        let u, w; if (ay >= ax && ay >= az) { u = op.swap ? z : x; w = op.swap ? x : z; } else if (ax >= az) { u = z; w = y; } else { u = x; w = y; }
        if (op.h && ay < 0.7) { UV[o * 2] = u / s; UV[o * 2 + 1] = (y - op.base) / op.h; } else { UV[o * 2] = u / s; UV[o * 2 + 1] = w / s; } }
      g.dispose(); }
    const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.BufferAttribute(P, 3)); bg.setAttribute('normal', new THREE.BufferAttribute(N, 3)); bg.setAttribute('uv', new THREE.BufferAttribute(UV, 2));
    const me = new THREE.Mesh(bg, mat); me.name = 'vh-' + k; me.castShadow = !!shadow; me.receiveShadow = true; root.add(me); return me; };
  const wall = (y0, y1) => (x0, x1, z0, z1) => L.walls.push({x0, x1, z0, z1, y0, y1});
  // a straight wall along x (at z) or along z (at x) with door/arch openings [a, b, top]; lintels fill above the openings
  const wallX = (k, z, a, b, y0, y1, th, gaps, o, col) => { let c = a; for (const [g0, g1, top] of (gaps || []).slice().sort((p, r) => p[0] - r[0])) {
      if (g0 > c) { box(k, c, g0, y0, y1, z - th / 2, z + th / 2, o); if (col !== false) L.walls.push({x0: c, x1: g0, z0: z - th / 2, z1: z + th / 2, y0, y1}); }
      if (top < y1) box(k, g0, g1, top, y1, z - th / 2, z + th / 2, o); c = g1; }
    if (b > c) { box(k, c, b, y0, y1, z - th / 2, z + th / 2, o); if (col !== false) L.walls.push({x0: c, x1: b, z0: z - th / 2, z1: z + th / 2, y0, y1}); } };
  const wallZ = (k, x, a, b, y0, y1, th, gaps, o, col) => { let c = a; for (const [g0, g1, top] of (gaps || []).slice().sort((p, r) => p[0] - r[0])) {
      if (g0 > c) { box(k, x - th / 2, x + th / 2, y0, y1, c, g0, o); if (col !== false) L.walls.push({x0: x - th / 2, x1: x + th / 2, z0: c, z1: g0, y0, y1}); }
      if (top < y1) box(k, x - th / 2, x + th / 2, top, y1, g0, g1, o); c = g1; }
    if (b > c) { box(k, x - th / 2, x + th / 2, y0, y1, c, b, o); if (col !== false) L.walls.push({x0: x - th / 2, x1: x + th / 2, z0: c, z1: b, y0, y1}); } };
  const P1 = {base: F, h: U - F}, P2 = {base: U, h: T - U}, PT = 0.6;   // painted plaster per storey; partition thickness
  const D1 = F + 2.8, D2 = U + 2.5, dg = (c, w, top) => [c - w / 2, c + w / 2, top];
  // ---- rectangles: interior minus the open court (and the stair wells upstairs) ----
  const sub = (rs, h) => { const out = []; for (const r of rs) { if (h.x0 >= r.x1 || h.x1 <= r.x0 || h.z0 >= r.z1 || h.z1 <= r.z0) { out.push(r); continue; }
      if (h.x0 > r.x0) out.push({x0: r.x0, x1: h.x0, z0: r.z0, z1: r.z1}); if (h.x1 < r.x1) out.push({x0: h.x1, x1: r.x1, z0: r.z0, z1: r.z1});
      const a = Math.max(r.x0, h.x0), b = Math.min(r.x1, h.x1); if (h.z0 > r.z0) out.push({x0: a, x1: b, z0: r.z0, z1: h.z0}); if (h.z1 < r.z1) out.push({x0: a, x1: b, z0: h.z1, z1: r.z1}); } return out; };
  const INT = [{x0: IX0, x1: IX1, z0: IZ0, z1: IZ1}];
  const HN = {x0: 949.6, x1: 959.6, z0: IZ0, z1: IZ0 + 2.0}, HS = {x0: 949.6, x1: 959.6, z0: IZ1 - 2.0, z1: IZ1};   // stair wells (north, south)
  const ground = sub(INT, O), upper = sub(sub(ground, HN), HS);
  const plane = (k, r, y, down) => { const g = new THREE.PlaneGeometry(r.x1 - r.x0, r.z1 - r.z0); g.rotateX(down ? Math.PI / 2 : -Math.PI / 2); put(k, g, (r.x0 + r.x1) / 2, y, (r.z0 + r.z1) / 2); };
  for (const r of ground) { plane('floor', r, F, false); L.floors.push({x0: r.x0, x1: r.x1, z0: r.z0, z1: r.z1, y: F}); }
  for (const r of upper) { plane('floor', r, U, false); plane('ceil', r, U - 0.03, true); L.floors.push({x0: r.x0, x1: r.x1, z0: r.z0, z1: r.z1, y: U}); }
  for (const r of sub(INT, {x0: PX0, x1: PX1, z0: PZ0, z1: PZ1})) plane('ceil', r, T - 0.03, true);          // flat ceilings of the upper rooms
  // open court: paving ring around the garden paving of vesta.js (same level), stylobate under the columns
  { const C = {x0: 903, x1: 949, z0: -306.3, z1: -288.3}; for (const r of sub([O], C)) { box('stone', r.x0, r.x1, gy, CF, r.z0, r.z1); L.floors.push({x0: r.x0, x1: r.x1, z0: r.z0, z1: r.z1, y: CF}); }
    for (const [a, b, c0, c1] of [[O.x0 - 0.5, O.x1 + 0.5, O.z0 - 0.5, O.z0 + 0.5], [O.x0 - 0.5, O.x1 + 0.5, O.z1 - 0.5, O.z1 + 0.5], [O.x0 - 0.5, O.x0 + 0.5, O.z0 + 0.5, O.z1 - 0.5], [O.x1 - 0.5, O.x1 + 0.5, O.z0 + 0.5, O.z1 - 0.5]]) box('marble', a, b, gy, F + 0.01, c0, c1); }
  // ---- outer shell: brick from the foundations to the wall top; marble plinth, floor band and cornice; plaster lining inside ----
  wallX('brick', Z0 + WT / 2, X0, X1, YB, T, WT, null, null); wallX('brick', Z1 - WT / 2, X0, X1, YB, T, WT, null, null);
  wallZ('brick', X0 + WT / 2, Z0 + WT, Z1 - WT, YB, T, WT, null, null); wallZ('brick', X1 - WT / 2, Z0 + WT, Z1 - WT, YB, T, WT, [dg(ENT, 2.6, F + 3.6)], null);
  for (const [y0, y1, p] of [[F - 0.1, F + 0.25, 0.06], [U - 0.15, U + 0.2, 0.08], [T - 0.3, T + 0.08, 0.22]]) {
    box('marble', X0 - p, X1 + p, y0, y1, Z0 - p, Z0); box('marble', X0 - p, X1 + p, y0, y1, Z1, Z1 + p); box('marble', X0 - p, X0, y0, y1, Z0, Z1);
    if (y0 > F + 1) box('marble', X1, X1 + p, y0, y1, Z0, Z1); else { box('marble', X1, X1 + p, y0, y1, Z0, ENT - 1.3); box('marble', X1, X1 + p, y0, y1, ENT + 1.3, Z1); } }
  for (const [y0, y1, P] of [[F, U, P1], [U, T, P2]]) { const t = 0.04;
    box('paint', IX0, IX1, y0, y1, IZ0, IZ0 + t, P); box('paint', IX0, IX1, y0, y1, IZ1 - t, IZ1, P); box('paint', IX0, IX0 + t, y0, y1, IZ0, IZ1, P);
    if (y0 === F) { box('paint', IX1 - t, IX1, y0, y1, IZ0, ENT - 1.3, P); box('paint', IX1 - t, IX1, y0, y1, ENT + 1.3, IZ1, P); box('paint', IX1 - t, IX1, F + 3.6, U, ENT - 1.3, ENT + 1.3, P); } else box('paint', IX1 - t, IX1, y0, y1, IZ0, IZ1, P); }
  // upper-floor windows on all four sides (dark openings with marble sills)
  { const step = lite ? 9 : 6, win = (x, z, nx, nz) => { const w = 0.9, y0 = U + 1.5, y1 = U + 2.8, ox = x + nx * 0.03, oz = z + nz * 0.03;
      if (nx) { box('dark', ox - 0.04, ox + 0.04, y0, y1, z - w / 2, z + w / 2); box('marble', ox - 0.1, ox + 0.1, y0 - 0.12, y0, z - w / 2 - 0.1, z + w / 2 + 0.1); }
      else { box('dark', x - w / 2, x + w / 2, y0, y1, oz - 0.04, oz + 0.04); box('marble', x - w / 2 - 0.1, x + w / 2 + 0.1, y0 - 0.12, y0, oz - 0.1, oz + 0.1); } };
    for (let x = X0 + 4; x < X1 - 2; x += step) { win(x, Z0, 0, -1); win(x, Z1, 0, 1); }
    for (let z = Z0 + 5; z < Z1 - 3; z += step) { win(X0, z, -1, 0); if (Math.abs(z - ENT) > 4) win(X1, z, 1, 0); } }
  // ---- portico back walls and room partitions, ground floor (painted both faces) ----
  const W1 = (k, ...a) => k === 'x' ? wallX('paint', a[0], a[1], a[2], F, U, PT, a[3], P1) : wallZ('paint', a[0], a[1], a[2], F, U, PT, a[3], P1);
  const W2 = (k, ...a) => k === 'x' ? wallX('paint', a[0], a[1], a[2], U, T, PT, a[3], P2) : wallZ('paint', a[0], a[1], a[2], U, T, PT, a[3], P2);
  W1('x', PZ0, IX0, IX1, [dg(898, 1.6, D1), dg(913.5, 1.6, D1), dg(928.5, 1.6, D1), dg(941, 1.4, D1), dg(952, 1.6, D1)]);
  W1('x', PZ1, IX0, IX1, [dg(898, 1.6, D1), dg(913.5, 1.6, D1), dg(928.5, 1.6, D1), dg(941, 1.4, D1), dg(952, 1.6, D1)]);
  W1('z', PX0, PZ0, PZ1, [[-302.3, -292.3, F + 4.3]]);                                           // the hall opens on the portico (two columns in front)
  W1('z', PX1, PZ0, PZ1, [dg(ENT, 3.0, F + 3.6), dg(-294, 1.4, D1)]);
  for (const x of [878, 906, 921, 936, 946]) { W1('z', x, IZ0, PZ0, x === 878 ? [dg(-317.75, 1.2, D1)] : null); W1('z', x, PZ1, IZ1, x === 878 ? [dg(-276.85, 1.2, D1)] : null); }
  W1('z', 878, PZ0, PZ1, [dg(-299.8, 1.2, D1), dg(-294.8, 1.2, D1)]); W1('x', -297.3, IX0, 878, null);   // dining room (N) and shrine (S) behind the hall
  W1('x', -302.3, 878, PX0, [dg(880.13, 1.0, D1), dg(884.4, 1.0, D1), dg(888.67, 1.0, D1)]); W1('x', -292.3, 878, PX0, [dg(880.13, 1.0, D1), dg(884.4, 1.0, D1), dg(888.67, 1.0, D1)]);
  for (const x of [882.27, 886.53]) { W1('z', x, PZ0, -302.3, null); W1('z', x, -292.3, PZ1, null); }   // the six small rooms beside the hall
  W1('x', ENT - 1.8, PX1, IX1, null); W1('x', ENT + 1.8, PX1, IX1, null);                        // vestibule
  // ---- upper floor ----
  const cub = []; for (let i = 0; i < 6; i++) cub.push(890.8 + (i + 0.5) * 45.2 / 6);
  W2('x', PZ0, IX0, IX1, cub.map(c => dg(c, 1.1, D2)).concat([dg(884.4, 1.1, D2), dg(941, 1.1, D2), dg(948.4, 1.6, D2)]));
  W2('x', PZ1, IX0, IX1, [dg(898, 1.1, D2), dg(913.5, 1.1, D2), dg(928.5, 1.1, D2), dg(941, 1.1, D2), dg(948.4, 1.6, D2)]);
  W2('z', PX0, PZ0, PZ1, [dg(-307.4, 1.1, D2), dg(-297.3, 1.1, D2), dg(-287.2, 1.1, D2)]); W2('z', PX1, PZ0, PZ1, [dg(-304.9, 1.1, D2), dg(-289.7, 1.1, D2)]);
  for (let i = 1; i < 6; i++) W2('z', 890.8 + i * 45.2 / 6, IZ0, PZ0, null);
  for (const x of [890.8, 936, 946]) W2('z', x, IZ0, PZ0, null);
  for (const x of [878, 906, 921, 936, 946]) W2('z', x, PZ1, IZ1, x === 878 ? [dg(-276.85, 1.1, D2)] : null);
  W2('z', 878, PZ0, PZ1, [dg(-304.9, 1.1, D2), dg(-289.7, 1.1, D2)]); W2('x', -297.3, IX0, 878, null); W2('x', -302.3, 878, PX0, null); W2('x', -292.3, 878, PX0, null); W2('x', -297.3, PX1, IX1, null);
  // ---- stairs (south one after the Roman plan, before the mill; a second in the north wing): 20 risers of 0.25 m, rising west ----
  for (const zs of [[IZ0, IZ0 + 1.8], [IZ1 - 1.8, IZ1]]) { for (let i = 1; i <= 20; i++) { const xa = 959.6 - i * 0.5, ya = F + i * 0.25;
      box('stone', xa, xa + 0.5, F, ya, zs[0], zs[1]); L.floors.push({x0: xa, x1: xa + 0.5, z0: zs[0], z1: zs[1], y: ya}); }
    const zr = zs[0] === IZ0 ? IZ0 + 2.0 : IZ1 - 2.0; box('marble', 950.2, 959.6, U, U + 1.0, zr - 0.08, zr + 0.08); L.walls.push({x0: 950.2, x1: 959.6, z0: zr - 0.1, z1: zr + 0.1, y0: U, y1: U + 1.0});
    box('marble', 959.5, 959.7, U, U + 1.0, Math.min(zr, zs[0]), Math.max(zr, zs[1])); L.walls.push({x0: 959.5, x1: 959.8, z0: Math.min(zr, zs[0]), z1: Math.max(zr, zs[1]), y0: U, y1: U + 1.0}); }
  // ---- the hall: raised three steps, barrel vault, two columns at the entry, marble table ----
  { const hz0 = -302.3 + PT / 2, hz1 = -292.3 - PT / 2, H = F + 0.45; box('floor', 878 + PT / 2, PX0 + 0.3, F, H, hz0, hz1); L.floors.push({x0: 878.3, x1: PX0 + 0.3, z0: hz0, z1: hz1, y: H});
    for (let s = 1; s <= 3; s++) { const xa = PX0 + 0.3 + (3 - s) * 0.45; box('marble', xa, xa + 0.45, F, F + s * 0.15, hz0, hz1); L.floors.push({x0: xa, x1: xa + 0.45, z0: hz0, z1: hz1, y: F + s * 0.15}); }
    const vg = new THREE.CylinderGeometry(1, 1, PX0 - 878 - PT, lite ? 10 : 16, 1, true, 0, Math.PI); vg.scale(1, 1, 1); vg.rotateZ(Math.PI / 2); vg.scale(1, 1.6, (hz1 - hz0) / 2);
    put('plaster', vg, (878 + PX0) / 2, F + 3.2, (hz0 + hz1) / 2, Math.PI / 2 * 0, 0, 0);
    box('marble', 882, 885, H, H + 0.85, -298.4, -296.2); L.walls.push({x0: 881.9, x1: 885.1, z0: -298.5, z1: -296.1, y0: H, y1: H + 0.85}); }
  // ---- colonnades: cipollino below (with white bases/capitals), breccia corallina on the gallery; entablatures, parapet, gallery roof ----
  const colPts = []; for (let i = 0; i <= 20; i++) { const x = O.x0 + i * (O.x1 - O.x0) / 20; colPts.push([x, O.z0], [x, O.z1]); }
  for (let j = 1; j < 7; j++) { const z = O.z0 + j * (O.z1 - O.z0) / 7; colPts.push([O.x0, z], [O.x1, z]); }
  const colGeo = (pts, seg, c1, c2, cap) => { const g = new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), seg), p = g.attributes.position, col = new Float32Array(p.count * 3), a = new THREE.Color(c1), b = new THREE.Color(c2);
    for (let i = 0; i < p.count; i++) { const y = p.getY(i), c = (y < cap[0] || y > cap[1]) ? b : a; col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; } g.setAttribute('color', new THREE.BufferAttribute(col, 3)); return g; };
  const cseg = lite ? 8 : 14, H1 = U - 0.6 - F, H2 = 3.2;
  const g1 = colGeo(lite ? [[0.42, 0], [0.31, 0.3], [0.27, H1 - 0.4], [0.42, H1]] : [[0.42, 0], [0.42, 0.22], [0.31, 0.32], [0.27, H1 - 0.45], [0.30, H1 - 0.35], [0.42, H1 - 0.15], [0.42, H1]], cseg, 0xaebba6, 0xece6da, [0.28, H1 - 0.42]);   // phones: 3-band profile
  const g2 = colGeo(lite ? [[0.32, 0], [0.24, 0.24], [0.21, H2 - 0.2], [0.32, H2]] : [[0.32, 0], [0.32, 0.18], [0.24, 0.26], [0.21, H2 - 0.25], [0.23, H2 - 0.18], [0.32, H2 - 0.05], [0.32, H2]], lite ? 6 : 12, 0xc98a78, 0xece6da, [0.22, H2 - 0.22]);
  const cm = new THREE.MeshStandardMaterial({vertexColors: true, roughness: 0.35, metalness: 0, envMap: W3D.env || null, envMapIntensity: 0.6});
  const inst = (g, pts, y, name) => { const im = new THREE.InstancedMesh(g, cm, pts.length), M4 = new THREE.Matrix4(); pts.forEach((p, i) => im.setMatrixAt(i, M4.makeTranslation(p[0], p[2] !== undefined ? p[2] : y, p[1])));
    im.castShadow = true; im.receiveShadow = true; im.name = name; im.frustumCulled = false; root.add(im); return im; };
  inst(g1, colPts.concat([[PX0 + 0.1, -301.4], [PX0 + 0.1, -293.2]]), F, 'vh-columns'); inst(g2, colPts, U, 'vh-columns-upper');
  for (const [x, z] of colPts) L.walls.push({x0: x - 0.32, x1: x + 0.32, z0: z - 0.32, z1: z + 0.32, y0: F - 0.2, y1: U});
  L.walls.push({x0: PX0 - 0.2, x1: PX0 + 0.4, z0: -301.7, z1: -301.1, y0: F, y1: U}, {x0: PX0 - 0.2, x1: PX0 + 0.4, z0: -293.5, z1: -292.9, y0: F, y1: U});
  const ring = (k, w, y0, y1, o) => { box(k, O.x0 - w, O.x1 + w, y0, y1, O.z0 - w, O.z0 + w, o); box(k, O.x0 - w, O.x1 + w, y0, y1, O.z1 - w, O.z1 + w, o); box(k, O.x0 - w, O.x0 + w, y0, y1, O.z0 + w, O.z1 - w, o); box(k, O.x1 - w, O.x1 + w, y0, y1, O.z0 + w, O.z1 - w, o); };
  ring('marble', 0.45, U - 0.6, U - 0.02); ring('marble', 0.52, U - 0.16, U - 0.04); ring('marble', 0.12, U, U + 0.95); ring('marble', 0.18, U + 0.95, U + 1.05); ring('marble', 0.36, U + H2, U + H2 + 0.4);
  for (const [a, b, c, d] of [[O.x0, O.x1, O.z0 - 0.15, O.z0 + 0.15], [O.x0, O.x1, O.z1 - 0.15, O.z1 + 0.15], [O.x0 - 0.15, O.x0 + 0.15, O.z0, O.z1], [O.x1 - 0.15, O.x1 + 0.15, O.z0, O.z1]]) L.walls.push({x0: a, x1: b, z0: c, z1: d, y0: U, y1: U + 1.0});
  { const yL = U + H2 + 0.4, lean = (a, b, s, len, along) => { const ang = Math.atan2(T - yL, len), hyp = Math.hypot(T - yL, len) + 0.7, g = new THREE.BoxGeometry(along ? b - a : hyp, 0.12, along ? hyp : b - a);
      if (along) g.rotateX(s * ang); else g.rotateZ(-s * ang); return g; };
    const mid = (T + yL) / 2;   // each slope runs 4.2 m from the back wall down to the column line
    put('tile', lean(PX0, PX1, 1, 4.2, true), (PX0 + PX1) / 2, mid + 0.06, (PZ0 + O.z0) / 2 + 0.3); put('tile', lean(PX0, PX1, -1, 4.2, true), (PX0 + PX1) / 2, mid + 0.06, (PZ1 + O.z1) / 2 - 0.3);
    put('tile', lean(PZ0, PZ1, 1, 4.2, false), (PX0 + O.x0) / 2 + 0.3, mid + 0.06, (PZ0 + PZ1) / 2, 0, 0, 0, {swap: true}); put('tile', lean(PZ0, PZ1, -1, 4.2, false), (PX1 + O.x1) / 2 - 0.3, mid + 0.06, (PZ0 + PZ1) / 2, 0, 0, 0, {swap: true}); }
  // ---- wing roofs: gables (20 deg; the west hall block is lower-pitched so it meets the side wings cleanly), brick gable ends ----
  { const tri = (span, rise, th) => { const s = new THREE.Shape(); s.moveTo(-span / 2, 0); s.lineTo(span / 2, 0); s.lineTo(0, rise); s.closePath(); return new THREE.ExtrudeGeometry(s, {depth: th, bevelEnabled: false}); };
    const gable = (along, a0, a1, c0, c1, tn, ends) => { const span = c1 - c0, rise = span / 2 * tn, ang = Math.atan(tn), hyp = span / 2 / Math.cos(ang) + 0.45, cm2 = (c0 + c1) / 2, o = along ? null : {swap: true};
      for (const s of [-1, 1]) { const g = new THREE.BoxGeometry(along ? a1 - a0 : hyp, 0.16, along ? hyp : a1 - a0); if (along) g.rotateX(s * ang); else g.rotateZ(-s * ang);
        const off = (span / 4 + 0.22) * s, y = T + rise / 2 - 0.22 * tn + 0.1; put('tile', g, along ? (a0 + a1) / 2 : cm2 + off, y, along ? cm2 + off : (a0 + a1) / 2, 0, 0, 0, o); }
      put('tile', new THREE.BoxGeometry(along ? a1 - a0 : 0.36, 0.22, along ? 0.36 : a1 - a0), along ? (a0 + a1) / 2 : cm2, T + rise + 0.14, along ? cm2 : (a0 + a1) / 2, 0, 0, 0, o);   // ridge capping
      for (const at of ends || []) { const g = tri(span, rise, WT); if (along) { g.rotateY(Math.PI / 2); put('brick', g, at, T, cm2); } else put('brick', g, cm2, T, at); } };
    gable(true, 860, X1 + 0.4, Z0, PZ0, 0.364, [X1 - WT]); gable(true, 860, X1 + 0.4, PZ1, Z1, 0.364, [X1 - WT]);
    gable(false, Z0 - 0.4, Z1 + 0.4, X0, 878, 0.364, [Z0, Z1 - WT]); gable(false, -317.7, -276.9, 878, PX0, 0.297, null); gable(false, -316.0, -278.6, PX1, X1, 0.364, null); }
  // ---- entrance: marble door frame, threshold, the double door; the little shrine on its right; paving toward the temple ----
  { const zA = ENT - 1.3, zB = ENT + 1.3; box('marble', X1 - 0.05, X1 + 0.25, F - 0.3, F + 3.9, zA - 0.35, zA); box('marble', X1 - 0.05, X1 + 0.25, F - 0.3, F + 3.9, zB, zB + 0.35); box('marble', X1 - 0.05, X1 + 0.3, F + 3.6, F + 4.15, zA - 0.5, zB + 0.5);
    box('marble', X1 - 0.6, X1 + 1.4, gy - 0.2, F - 0.02, zA - 0.4, zB + 0.4); L.floors.push({x0: X1 - 0.6, x1: X1 + 1.4, z0: zA, z1: zB, y: F - 0.02});
    box('stone', X1 + 1.4, 977, gy - 0.2, gy + 0.08, ENT - 1.6, ENT + 1.6);
    const ax = X1 + 2.6, az = ENT - 4.2; box('marble', ax - 1.1, ax + 1.1, gy, gy + 1.8, az - 1.0, az + 1.0); box('brick', ax - 0.9, ax + 0.7, gy + 1.8, gy + 4.2, az - 0.85, az + 0.85);   // aedicula: high base, two Ionic columns, pediment
    const ic = new THREE.CylinderGeometry(0.13, 0.15, 2.2, lite ? 8 : 12); for (const s of [-1, 1]) { put('marble', ic.clone(), ax + 0.85, gy + 2.95, az + s * 0.65); box('marble', ax + 0.62, ax + 1.08, gy + 4.05, gy + 4.25, az + s * 0.65 - 0.25, az + s * 0.65 + 0.25); }
    box('marble', ax - 1.0, ax + 1.15, gy + 4.25, gy + 4.55, az - 1.0, az + 1.0); { const s = new THREE.Shape(); s.moveTo(-1.0, 0); s.lineTo(1.0, 0); s.lineTo(0, 0.55); s.closePath(); const pg = new THREE.ExtrudeGeometry(s, {depth: 2.1, bevelEnabled: false}); pg.rotateY(Math.PI / 2); put('marble', pg, ax - 1.0, gy + 4.55, az); }
    L.walls.push({x0: ax - 1.1, x1: ax + 1.1, z0: az - 1.0, z1: az + 1.0, y0: gy, y1: gy + 4.6});
    // the double door (doors.js): leaves hinge at the jambs and swing in
    const leafG = new THREE.BoxGeometry(1.3, 3.55, 0.1); leafG.translate(0.65, 1.775, 0); const wood = new THREE.MeshStandardMaterial({color: 0x5a3b22, roughness: 0.7, metalness: 0.1});
    const studs = new THREE.MeshStandardMaterial({color: 0x9a7a45, roughness: 0.4, metalness: 0.8}); const leaves = [];
    for (const [z, cl, op] of [[zA, -Math.PI / 2, -2.85], [zB, Math.PI / 2, 2.85]]) { const piv = new THREE.Group(); piv.position.set(X1 - 0.4, F, z); const m = new THREE.Mesh(leafG, wood); m.castShadow = true; piv.add(m);
      const band = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.14), studs); band.position.set(0.65, 1.1, 0); piv.add(band); const b2 = band.clone(); b2.position.y = 2.6; piv.add(b2); root.add(piv); leaves.push({piv, closed: cl, open: op}); }
    const shut = {x0: X1 - 0.6, x1: X1 - 0.2, z0: zA, z1: zB, y0: F, y1: F + 3.6};
    if (W3D.addDoor) W3D.addDoor({name: 'vestals-entrance', leaves, at: {x: X1, y: F + 1.6, z: ENT}, near: 7, dy: 4, hit: {x: X1 - 0.4, y: F + 1.8, z: ENT, w: 0.3, h: 3.5, d: 2.6}, shut}); }
  // ---- furnishing ----
  const leafS = new THREE.BoxGeometry(1.0, 2.4, 0.07); leafS.translate(0.5, 1.2, 0); const woodM = new THREE.MeshStandardMaterial({color: 0x6b4428, roughness: 0.72, metalness: 0, emissive: 0x120a05});
  const bed = (x, z, ry, k2) => { const c = Math.cos(ry), s = Math.sin(ry), P = (dx, dz) => [x + dx * c + dz * s, z - dx * s + dz * c];
    const b = (k, dx, dz, w, h, d, y) => { const [px, pz] = P(dx, dz); put(k, new THREE.BoxGeometry(w, h, d), px, y + h / 2, pz, ry); };
    b('wood', 0, 0, 2.0, 0.14, 0.9, U + 0.32); for (const [dx, dz] of [[-0.92, -0.38], [0.92, -0.38], [-0.92, 0.38], [0.92, 0.38]]) b('wood', dx, dz, 0.08, 0.32, 0.08, U);   // frame and legs
    b('wood', -0.98, 0, 0.06, 0.5, 0.9, U + 0.4); b('wood', 0, -0.42, 2.0, 0.32, 0.06, U + 0.46);                                                                     // headboard (fulcrum) and back rail
    b('linen', 0.05, 0, 1.9, 0.14, 0.82, U + 0.46); b('linen', -0.72, 0, 0.38, 0.12, 0.6, U + 0.6); b(k2 || 'wool', 0.3, 0.02, 1.3, 0.05, 0.86, U + 0.58);
    const [qx, qz] = P(0, 0); L.walls.push({x0: qx - 1.1, x1: qx + 1.1, z0: qz - 1.1, z1: qz + 1.1, y0: U, y1: U + 0.8}); };
  // the six Vestals' bedrooms (upper north wing): bed, chest, stool, lamp stand; a door onto the gallery
  cub.forEach((cx, i) => { bed(cx - 1.4, IZ0 + 0.55, 0, i % 2 ? 'wool' : 'wool2');
    box('wood', cx + 1.6, cx + 2.6, U, U + 0.55, IZ0 + 0.1, IZ0 + 0.7); box('bronze', cx + 1.58, cx + 2.62, U + 0.25, U + 0.3, IZ0 + 0.08, IZ0 + 0.72); L.walls.push({x0: cx + 1.5, x1: cx + 2.7, z0: IZ0, z1: IZ0 + 0.8, y0: U, y1: U + 0.6});
    box('wood', cx + 0.3, cx + 0.7, U, U + 0.45, IZ0 + 2.2, IZ0 + 2.6);
    put('bronze', new THREE.CylinderGeometry(0.025, 0.05, 1.3, 6), cx - 2.9, U + 0.65, PZ0 - 1.2); put('bronze', new THREE.CylinderGeometry(0.16, 0.04, 0.06, 8), cx - 2.9, U + 1.33, PZ0 - 1.2);
    box('wool2', cx - 1.8, cx + 0.6, U + 0.005, U + 0.02, IZ0 + 1.6, IZ0 + 3.2);   // a woven rug
    const piv = new THREE.Group(); piv.position.set(cx - 0.55, U, PZ0); const m = new THREE.Mesh(leafS, woodM); m.castShadow = true; piv.add(m); root.add(piv);
    if (W3D.addDoor) W3D.addDoor({name: 'vestal-room-' + (i + 1), leaves: [{piv, closed: 0, open: 1.45}], at: {x: cx, y: U + 1.6, z: PZ0}, near: 3.2, dy: 2.2,
      hit: {x: cx, y: U + 1.2, z: PZ0, w: 1.1, h: 2.4, d: 0.4}, shut: {x0: cx - 0.55, x1: cx + 0.55, z0: PZ0 - 0.3, z1: PZ0 + 0.3, y0: U, y1: U + 2.5}}); });
  // servants' rooms upstairs (south): two plain beds in two rooms
  for (const cx of [898, 913.5]) { bed(cx - 1.6, IZ1 - 0.55, Math.PI, 'linen'); bed(cx + 1.8, IZ1 - 0.55, Math.PI, 'linen'); }
  // baths upstairs (north-west): plunge pool with marble rim and a bench; a tub in the small bath beside the bedrooms
  const wbox = []; { const bx0 = 858, bx1 = 872, bz0 = -321, bz1 = -315.5; box('marble', bx0 - 0.4, bx1 + 0.4, U, U + 0.5, bz0 - 0.4, bz1 + 0.4); wbox.push([bx0, bx1, bz0, bz1, U + 0.46]);
    L.walls.push({x0: bx0 - 0.4, x1: bx1 + 0.4, z0: bz0 - 0.4, z1: bz1 + 0.4, y0: U, y1: U + 0.6}); box('marble', 875, 888, U, U + 0.45, IZ0 + 0.1, IZ0 + 0.6);
    box('marble', 939, 943.5, U, U + 0.7, IZ0 + 0.2, IZ0 + 2.0); wbox.push([939.2, 943.3, IZ0 + 0.4, IZ0 + 1.8, U + 0.62]); L.walls.push({x0: 939, x1: 943.5, z0: IZ0, z1: IZ0 + 2.1, y0: U, y1: U + 0.8}); }
  // kitchen (hearth bench, pots), the oven (domed), the mill (two hourglass millstones), storerooms (amphorae), dining room (three couches), shrine niche
  { box('brick', 880, 886, F, F + 0.95, IZ1 - 1.0, IZ1); for (let i = 0; i < 4; i++) put('tile', new THREE.SphereGeometry(0.22, 7, 5), 881 + i * 1.3, F + 1.15, IZ1 - 0.5);
    box('wood', 890, 894, F, F + 0.85, -278, -277); L.walls.push({x0: 879.9, x1: 886.1, z0: IZ1 - 1.1, z1: IZ1, y0: F, y1: F + 1.0}, {x0: 889.9, x1: 894.1, z0: -278.1, z1: -276.9, y0: F, y1: F + 0.9});
    box('brick', 909, 918, F, F + 0.7, IZ1 - 4.2, IZ1); put('brick', new THREE.SphereGeometry(2.0, lite ? 10 : 16, 6, 0, Math.PI * 2, 0, Math.PI / 2), 913.5, F + 0.7, IZ1 - 2.2); box('dark', 912.9, 914.1, F + 0.75, F + 1.6, IZ1 - 4.25, IZ1 - 4.1);
    L.walls.push({x0: 909, x1: 918, z0: IZ1 - 4.3, z1: IZ1, y0: F, y1: F + 2.8});
    const meta = new THREE.LatheGeometry([[0.75, 0], [0.75, 0.5], [0.55, 0.6], [0.1, 1.45], [0, 1.5]].map(p => new THREE.Vector2(p[0], p[1])), lite ? 8 : 12);
    const cat = new THREE.LatheGeometry([[0.62, 0], [0.32, 0.45], [0.62, 0.95], [0.6, 1.0]].map(p => new THREE.Vector2(p[0], p[1])), lite ? 8 : 12);
    for (const x of [925.5, 931.5]) { put('lava', meta.clone(), x, F, -277); put('lava', cat.clone(), x, F + 0.8, -277); put('wood', new THREE.BoxGeometry(2.2, 0.12, 0.12), x, F + 1.35, -277); L.walls.push({x0: x - 1.0, x1: x + 1.0, z0: -278, z1: -276, y0: F, y1: F + 1.8}); }
    if (!lite) { const amph = new THREE.LatheGeometry([[0, 0], [0.06, 0.05], [0.24, 0.35], [0.26, 0.6], [0.15, 0.85], [0.07, 0.95], [0.08, 1.1]].map(p => new THREE.Vector2(p[0], p[1])), 8);
      for (let i = 0; i < 10; i++) for (const zc of [IZ0 + 0.5, IZ1 - 0.5]) put('tile', amph.clone(), 856 + i * 0.6 + (zc > -300 ? 0 : 1.5), F, zc + (i % 2) * 0.15, rnd() * 6); }
    for (const [x0, x1, z0, z1] of [[856.5, 864.5, -311.2, -310.2], [856.5, 857.5, -310.2, -302.5], [863.5, 864.5, -310.2, -302.5]]) { box('wood', x0, x1, F, F + 0.55, z0, z1); box('linen', x0 + 0.05, x1 - 0.05, F + 0.55, F + 0.7, z0 + 0.05, z1 - 0.05); L.walls.push({x0, x1, z0, z1, y0: F, y1: F + 0.7}); }
    box('marble', 859.5, 861.5, F, F + 0.7, -308.5, -305.5); L.walls.push({x0: 859.4, x1: 861.6, z0: -308.6, z1: -305.4, y0: F, y1: F + 0.7});
    box('marble', IX0 + 0.04, IX0 + 1.0, F, F + 1.3, -292.0, -289.0); box('dark', IX0 + 0.9, IX0 + 1.02, F + 1.5, F + 2.7, -291.2, -289.8); box('marble', IX0 + 0.04, IX0 + 1.1, F + 2.7, F + 3.0, -292.2, -288.8); }
  // ---- materials, merge ----
  const T2 = c => tex(c), em = 0x16110b;
  const mats = {
    brick: new THREE.MeshStandardMaterial({map: T2(brickC()), roughness: 0.92, metalness: 0}),
    paint: new THREE.MeshStandardMaterial({map: T2(paintC()), roughness: 0.85, metalness: 0, emissive: em}),
    floor: new THREE.MeshStandardMaterial({map: T2(mosaicC()), roughness: 0.6, metalness: 0, emissive: em}),
    ceil: new THREE.MeshStandardMaterial({map: T2(ceilC()), roughness: 0.9, metalness: 0, emissive: em}),
    tile: new THREE.MeshStandardMaterial({map: T2(tileC()), roughness: 0.85, metalness: 0}),
    marble: new THREE.MeshStandardMaterial({color: 0xeee8dc, roughness: 0.4, metalness: 0, envMap: W3D.env || null, envMapIntensity: 0.5}),
    stone: new THREE.MeshStandardMaterial({color: 0xd2bf9c, roughness: 0.85, metalness: 0}),
    plaster: new THREE.MeshStandardMaterial({color: 0xe8dcc4, roughness: 0.9, side: THREE.DoubleSide, emissive: em}),
    dark: new THREE.MeshLambertMaterial({color: 0x2e2118}),
    wood: woodM, linen: new THREE.MeshLambertMaterial({color: 0xe9e2d0, emissive: em}), wool: new THREE.MeshLambertMaterial({color: 0x8a2a22, emissive: em}), wool2: new THREE.MeshLambertMaterial({color: 0x9a7d4a, emissive: em}),
    bronze: new THREE.MeshStandardMaterial({color: 0x9a7a45, roughness: 0.4, metalness: 0.8}), lava: new THREE.MeshStandardMaterial({color: 0x5b5752, roughness: 0.95})};
  for (const k of ['brick', 'tile', 'marble', 'stone', 'paint']) flush(k, mats[k], true);
  for (const k of ['floor', 'ceil', 'plaster', 'dark', 'wood', 'linen', 'wool', 'wool2', 'bronze', 'lava']) flush(k, mats[k], k === 'wood' || k === 'lava');
  { const wm = new THREE.MeshStandardMaterial({color: 0x5f8f8a, roughness: 0.08, metalness: 0.1, envMap: W3D.env || null, envMapIntensity: 1, transparent: true, opacity: 0.85, map: W3D.vestalsWater || null});
    for (const [a, b, c, d, y] of wbox) { const m = new THREE.Mesh(new THREE.PlaneGeometry(b - a, d - c), wm); m.rotation.x = -Math.PI / 2; m.position.set((a + b) / 2, y, (c + d) / 2); root.add(m); } }
  // clear the old woods off the footprint (the south wing runs past the lawn plate onto the slope)
  W3D.root.traverse(o => { if (!o.isInstancedMesh || o.name !== 'trees') return; const M4 = new THREE.Matrix4(), p = new THREE.Vector3(), zero = new THREE.Matrix4().makeScale(0, 0, 0); let ch = 0;
    for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, M4); p.setFromMatrixPosition(M4); if (p.x > X0 - 4 && p.x < X1 + 4 && p.z > Z0 - 4 && p.z < Z1 + 5) { o.setMatrixAt(i, zero); ch++; } }
    if (ch) o.instanceMatrix.needsUpdate = true; });
  if (lite && W3D.liteTextures) W3D.liteTextures(root);
  W3D.spots = W3D.spots || {}; W3D.spots.atrium = () => W3D.teleportTo(X1 + 5, undefined, ENT, 90);   // outside the entrance, looking in (west)
  let tris = 0; root.traverse(o => { if (o.isMesh && o.geometry) tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3 * (o.isInstancedMesh ? o.count : 1); });
  W3D.vestaHouseStats = {tris: Math.round(tris), F, U, T};
}
/* Conservatory view (Josh, Nov 26): the conservatory (x 900-952, z -353..-325) sits right against the house's north wall, so looking
   south from it you saw only brick. While you stand in the conservatory (or the gap between it and the house) the house is not drawn,
   so the scenery to the south is clear; step out of that zone - and certainly inside the House of the Vestals - and it is solid again.
   Walls still block walking (collision is separate from drawing). Checked 5x a second from the camera position; works in the headset. */
const CONS = {x0: 898, x1: 954, z0: -356, z1: Z0};
function inCons(p) { return p.x > CONS.x0 && p.x < CONS.x1 && p.z > CONS.z0 && p.z < CONS.z1 && W3D.active !== false; }
const vp = new THREE.Vector3();
setInterval(() => { const h = W3D.vestaHouse, sc = document.querySelector('a-scene'), cam = sc && sc.camera; if (!h || !cam) return;
  cam.getWorldPosition(vp); const show = !(inCons(vp) && vp.y < (W3D.conservatory ? W3D.conservatory.y + 14 : 1e9)); if (h.visible !== show) h.visible = show; W3D.vestaHouseClear = !show; }, 200);
const iv = setInterval(() => { if (W3D.vesta && W3D.lib && W3D.groundAt) { clearInterval(iv); try { build(); } catch (e) { console.warn('vestahouse', e); } } }, 500);
})();
