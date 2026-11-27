/* Raynham Center + the Raynham / Taunton routes (T-17, Josh, Nov 2026: "extend Fowling Pond to Raynham center and the Taunton routes").
   Where: real places in the world's geo.json frame (Raynham Center is ~1.7 km NE of the frame origin, inside the 3D-house core).
   - Raynham Center (N Main St / Center St / Mill St): the post-office plaza (U.S. Post Office, Raynham Mart, Choice Dental, dry cleaner)
     with its parking lot, St. Ann's Church + function hall, Colletti's Market. Footprints from OpenStreetMap. These hand-built blocks
     are named like our other houses and clip to the Real Earth cutouts, so with Real Earth on you see Google's real buildings and with
     it off (phones / ?realearth=0) you see these; home3d's generic boxes are kept off the footprints (W3D.keepOut).
   - Place boards (both modes): blue boards on poles over each place, route landmarks (Taunton Green, Middleborough Rotary, Bridgewater
     Central Square, East Taunton PO, Easton, ...) and river crossings (Forge River, Taunton River). Built lazily near you.
   - 13 routes from vr-wip/raynham-route/NOTES.txt, road-following driving lines from OSRM (OpenStreetMap). Gold arrows float over
     the road within ~700 m (one instanced draw). A route board in the post-office lot (click with the laser / mouse) starts a ride:
     a drone-height glide along the route (Real Earth tiles under you); move or teleport to take over. ?spot=raynham, st-anns,
     collettis, raynham-route-1 .. raynham-route-13. Business and place names only; no people, no private addresses. */
(function () {
'use strict';
const W3D = window.W3D = window.W3D || {};
const LITE = !!window.JFVR_LITE;
const CEN = {x: 1236, z: -1180}, BUILD_D = 1500, DROP_D = 2100;
const SPOT = {x: 1250, z: -1184, yaw: 110.6};
W3D.keepOut = (W3D.keepOut || []).concat([{x: 1224.5, z: -1174.5, r: 20, name: 'Raynham Center'}, {x: 1241.7, z: -1152.3, r: 9, name: 'Raynham Center'},
  {x: 1333.5, z: -1336.5, r: 24, name: "St. Ann's Church"}, {x: 1376, z: -1453, r: 28, name: "St. Ann's hall"}, {x: 1349, z: -751, r: 14, name: "Colletti's Market"}]);
let D = null, center = null, boards = [], arrows = null, samples = [], kiosk = null, ride = null, acc = 0, last = {x: 1e9, z: 1e9};
const R = W3D.raynham = {stats: () => ({loaded: !!D, center: !!center, centerTris: center ? center.userData.tris : 0, boards: boards.filter(b => b.mesh).length,
  arrows: arrows ? arrows.count : 0, kiosk: !!kiosk, riding: ride ? {n: ride.r.n, s: Math.round(ride.s), L: Math.round(ride.L)} : null}), ride: n => startRide(n), stop: () => stopRide('Ride stopped'), speed: 25};

function gh(x, z) { let y = W3D.groundAt ? W3D.groundAt(x, z, 999) : NaN; if (!isFinite(y)) y = W3D.terrainH ? W3D.terrainH(x, z) : 0; return isFinite(y) ? y : 0; }
function tH(x, z) { const y = W3D.terrainH ? W3D.terrainH(x, z) : gh(x, z); return isFinite(y) ? y : 0; }
function clip(m) { if (W3D.realEarth && W3D.realEarth.clipOurs) W3D.realEarth.clipOurs(m); return m; }

/* ---------- canvas helpers ---------- */
function boardTex(text, sub, bg, w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'), r = h * 0.12;
  g.fillStyle = bg; g.strokeStyle = '#fff'; g.lineWidth = h * 0.04;
  g.beginPath(); g.moveTo(r, 2); g.arcTo(w - 2, 2, w - 2, h - 2, r); g.arcTo(w - 2, h - 2, 2, h - 2, r); g.arcTo(2, h - 2, 2, 2, r); g.arcTo(2, 2, w - 2, 2, r); g.closePath(); g.fill(); g.stroke();
  const fit = (t, fs, maxW) => { g.font = 'bold ' + fs + 'px Arial, Helvetica, sans-serif'; while (g.measureText(t).width > maxW && fs > 10) { fs -= 2; g.font = 'bold ' + fs + 'px Arial, Helvetica, sans-serif'; } return fs; };
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff';
  fit(text, sub ? h * 0.42 : h * 0.55, w * 0.9); g.fillText(text, w / 2, sub ? h * 0.38 : h / 2);
  if (sub) { g.fillStyle = '#e6eefc'; fit(sub, h * 0.24, w * 0.9); g.font = g.font.replace('bold ', ''); g.fillText(sub, w / 2, h * 0.75); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; t.anisotropy = 4; return t;
}
const SIGNS = ['RAYNHAM MART', 'DRY CLEANER', 'U.S. POST OFFICE', 'CHOICE DENTAL', "COLLETTI'S MARKET", "ST. ANN'S", 'FUNCTION HALL', 'UNITED STATES POSTAL SERVICE'];
function signAtlas() {   // 8 rows x 64 px: shop fascia signs (white on dark / red), used by one MeshBasic mesh so they read at night
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const g = c.getContext('2d');
  SIGNS.forEach((s, i) => { const y = i * 64; g.fillStyle = i === 2 || i === 7 ? '#1d3f8f' : i === 4 ? '#8a1f1f' : i === 5 ? '#f4f1e8' : '#20262d'; g.fillRect(0, y, 1024, 64);
    g.fillStyle = i === 5 ? '#2a2a2a' : '#ffffff'; let fs = 44; g.font = 'bold ' + fs + 'px Arial, Helvetica, sans-serif'; while (g.measureText(s).width > 980) { fs -= 2; g.font = 'bold ' + fs + 'px Arial, sans-serif'; }
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, 512, y + 33); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(0, y, 1024, 3); });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

/* ---------- geometry builder: non-indexed tris with vertex colours ---------- */
function Geo() { this.p = []; this.c = []; this.uv = []; }
Geo.prototype.tri = function (a, b, c, col, ua, ub, uc) { this.p.push(...a, ...b, ...c); for (let i = 0; i < 3; i++) this.c.push(col.r, col.g, col.b); this.uv.push(...(ua || [0, 0]), ...(ub || [0, 0]), ...(uc || [0, 0])); };
Geo.prototype.quad = function (a, b, c, d, col, uv) { uv = uv || [[0, 0], [1, 0], [1, 1], [0, 1]]; this.tri(a, b, c, col, uv[0], uv[1], uv[2]); this.tri(a, c, d, col, uv[0], uv[2], uv[3]); };
Geo.prototype.mesh = function (mat, name) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2)); g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.name = name; m.castShadow = !LITE; m.receiveShadow = true; m.userData.tris = this.p.length / 9; return m; };
const C = h => new THREE.Color(h);
function ccw(P) { let a = 0; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; a += p[0] * q[1] - q[0] * p[1]; } return a; }
// walls + flat roof for a footprint; returns {y0, y1}
function extrude(G, P, h, wall, roof) {
  if (ccw(P) > 0) P = P.slice().reverse();   // x east / z south: negative signed area = outward normals with this winding
  let lo = 1e9, hi = -1e9; for (const [x, z] of P) { const y = tH(x, z); lo = Math.min(lo, y); hi = Math.max(hi, y); }
  const y0 = lo - 0.4, y1 = hi + h;
  for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; G.quad([a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], wall); }
  const tr = THREE.ShapeUtils.triangulateShape(P.map(p => new THREE.Vector2(p[0], p[1])), []);
  for (const [i, j, k] of tr) { const A = P[i], B = P[j], K = P[k]; G.tri([A[0], y1, A[1]], [K[0], y1, K[1]], [B[0], y1, B[1]], roof); }
  // parapet cap line
  return {y0, y1, P};
}
// the footprint edge facing a point (outward side), as [a, b] with a->b running left-to-right when you face the building
function faceEdge(P, tx, tz) {
  let best = null, bs = -1e9; const cx = P.reduce((s, p) => s + p[0], 0) / P.length, cz = P.reduce((s, p) => s + p[1], 0) / P.length;
  for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 4) continue;
    const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2; let nx = (b[1] - a[1]) / L, nz = -(b[0] - a[0]) / L; if (nx * (mx - cx) + nz * (mz - cz) < 0) { nx = -nx; nz = -nz; }
    const tl = Math.hypot(tx - mx, tz - mz), s = (nx * (tx - mx) + nz * (tz - mz)) / tl * 2 + L / 40; if (s > bs) { bs = s; best = {a, b, nx, nz, L}; } }
  // order so that, looking at the facade from outside, a is on the left
  const {a, b, nx, nz} = best; const rx = nz, rz = -nx;   // right-hand vector of a viewer facing the wall (looking along -n)
  return (b[0] - a[0]) * rx + (b[1] - a[1]) * rz > 0 ? best : {a: b, b: a, nx, nz, L: best.L};
}
// a sign / window band on a facade: from u0..u1 metres along the edge, v0..v1 above y0, offset off the wall
function band(G, E, y0, u0, u1, v0, v1, off, col, uv) {
  const dx = (E.b[0] - E.a[0]) / E.L, dz = (E.b[1] - E.a[1]) / E.L, ox = E.nx * off, oz = E.nz * off;
  const p = u => [E.a[0] + dx * u + ox, E.a[1] + dz * u + oz];
  const A = p(u0), B = p(u1); G.quad([A[0], y0 + v0, A[1]], [B[0], y0 + v0, B[1]], [B[0], y0 + v1, B[1]], [A[0], y0 + v1, A[1]], col, uv);
}
const row = i => [[0, 1 - (i + 1) / 8 + 0.004], [1, 1 - (i + 1) / 8 + 0.004], [1, 1 - i / 8 - 0.004], [0, 1 - i / 8 - 0.004]];

function buildCenter(sc) {
  const G = new Geo(), S = new Geo(), B = {}; D.b.forEach(b => { B[b.k] = b.p; });
  const glass = C(0x26313d), trim = C(0xe8e4da), door = C(0x3a2a20);
  // plaza strip: tan brick, three shop units facing North Main Street
  { const r = extrude(G, B.strip, 5.2, C(0xb89a78), C(0x4a4c50)); const yb = r.y0 + 0.4, E = faceEdge(r.P, 1258, -1180), n = 3, w = E.L / n;
    // units south -> north: dry cleaner, Raynham Mart, post office
    const order = (E.a[1] > E.b[1]) ? [1, 0, 2] : [2, 0, 1];
    for (let i = 0; i < n; i++) { const u0 = i * w + 0.5, u1 = (i + 1) * w - 0.5;
      band(G, E, yb, u0, u1, 0.3, 2.9, 0.04, glass); band(G, E, yb, u0 + w * 0.42, u0 + w * 0.58 - 0.2, 0, 2.6, 0.06, door);
      band(S, E, yb, u0 + 0.4, u1 - 0.4, 3.3, 4.4, 0.08, C(0xffffff), row(order[i])); }
    band(G, E, yb, 0, E.L, 3.1, 4.6, 0.03, trim);   // fascia
  }
  // post-office / dental building north of the strip: red brick, flag
  { const r = extrude(G, B.po, 4.8, C(0x9b4a3a), C(0x45464a)); const E = faceEdge(r.P, 1262, -1155), yb = r.y0 + 0.4;
    band(G, E, yb, 1, E.L - 1, 0.4, 2.8, 0.04, glass); band(S, E, yb, 1.2, E.L - 1.2, 3.2, 4.2, 0.08, C(0xffffff), row(3));
    const fx = 1251, fz = -1158, fy = tH(fx, fz);   // flagpole by the door
    const pole = new THREE.CylinderGeometry(0.06, 0.09, 10, 8).toNonIndexed(); pole.translate(fx, fy + 5, fz); pushGeo(G, pole, C(0xd8dadc));
  }
  // St. Ann's Church: oriented box nave + gable roof + bell tower and spire at the west (street) end
  { const P = B.church, ob = obb(P); const h = 8.5, rise = 6.5; let lo = 1e9; for (const [x, z] of P) lo = Math.min(lo, tH(x, z)); const y0 = lo - 0.4, y1 = lo + h;
    const wall = C(0xece8de), roof = C(0x3b3f46), {cx, cz, ux, uz, hl, hw} = ob, vx = -uz, vz = ux;
    const at = (u, v, y) => [cx + ux * u + vx * v, y, cz + uz * u + vz * v];
    const box = (u0, u1, v0, v1, ya, yb2, col) => { const c = [at(u0, v0, 0), at(u1, v0, 0), at(u1, v1, 0), at(u0, v1, 0)];
      for (let i = 0; i < 4; i++) { const a = c[i], b = c[(i + 1) % 4]; G.quad([a[0], ya, a[2]], [b[0], ya, b[2]], [b[0], yb2, b[2]], [a[0], yb2, a[2]], col); G.quad([a[0], yb2, a[2]], [b[0], yb2, b[2]], [b[0], ya, b[2]], [a[0], ya, a[2]], col); }
      G.quad([c[0][0], yb2, c[0][2]], [c[1][0], yb2, c[1][2]], [c[2][0], yb2, c[2][2]], [c[3][0], yb2, c[3][2]], col); G.quad([c[3][0], yb2, c[3][2]], [c[2][0], yb2, c[2][2]], [c[1][0], yb2, c[1][2]], [c[0][0], yb2, c[0][2]], col); };
    box(-hl, hl, -hw, hw, y0, y1, wall);
    // gable roof along u
    const r0 = at(-hl - 0.4, 0, 0), r1 = at(hl + 0.4, 0, 0), e = (u, v) => at(u, v, 0);
    const A = e(-hl - 0.4, -hw - 0.5), Bq = e(hl + 0.4, -hw - 0.5), Cq = e(hl + 0.4, hw + 0.5), Dq = e(-hl - 0.4, hw + 0.5);
    G.quad([A[0], y1 - 0.3, A[2]], [Bq[0], y1 - 0.3, Bq[2]], [r1[0], y1 + rise, r1[2]], [r0[0], y1 + rise, r0[2]], roof); G.quad([r0[0], y1 + rise, r0[2]], [r1[0], y1 + rise, r1[2]], [Bq[0], y1 - 0.3, Bq[2]], [A[0], y1 - 0.3, A[2]], roof);
    G.quad([Cq[0], y1 - 0.3, Cq[2]], [Dq[0], y1 - 0.3, Dq[2]], [r0[0], y1 + rise, r0[2]], [r1[0], y1 + rise, r1[2]], roof); G.quad([r1[0], y1 + rise, r1[2]], [r0[0], y1 + rise, r0[2]], [Dq[0], y1 - 0.3, Dq[2]], [Cq[0], y1 - 0.3, Cq[2]], roof);
    for (const s of [-1, 1]) { const g0 = e(s * hl, -hw), g1 = e(s * hl, hw), gt = at(s * hl, 0, 0); G.tri([g0[0], y1, g0[2]], [g1[0], y1, g1[2]], [gt[0], y1 + rise - 0.3, gt[2]], wall); G.tri([g1[0], y1, g1[2]], [g0[0], y1, g0[2]], [gt[0], y1 + rise - 0.3, gt[2]], wall); }
    // west end = the end nearer North Main Street (x ~1250)
    const west = (at(-hl, 0, 0)[0] < at(hl, 0, 0)[0]) ? -1 : 1, tu = west * (hl - 2.6);
    box(tu - 2.6, tu + 2.6, -2.6, 2.6, y0, y1 + rise + 6, wall); box(tu - 2.0, tu + 2.0, -2.0, 2.0, y1 + rise + 6, y1 + rise + 9.5, C(0xdcd6c8));
    const sp = new THREE.ConeGeometry(2.1, 10, 4, 1).toNonIndexed(); sp.rotateY(Math.atan2(ux, uz) + Math.PI / 4); const tp = at(tu, 0, 0); sp.translate(tp[0], y1 + rise + 9.5 + 5, tp[2]); pushGeo(G, sp, roof);
    const cr1 = new THREE.BoxGeometry(0.25, 2.2, 0.25).toNonIndexed(), cr2 = new THREE.BoxGeometry(1.2, 0.25, 0.25).toNonIndexed(); [cr1, cr2].forEach(g => { g.rotateY(Math.atan2(ux, uz)); g.translate(tp[0], y1 + rise + 9.5 + 10 + (g === cr2 ? 1.3 : 1.0), tp[2]); pushGeo(G, g, C(0xd6b34a)); });
    // door + sign on the west face of the tower
    const fu = west * (hl + 0.05), dA = at(fu, -0.9, 0), dB = at(fu, 0.9, 0); G.quad([dA[0], y0 + 0.4, dA[2]], [dB[0], y0 + 0.4, dB[2]], [dB[0], y0 + 3.6, dB[2]], [dA[0], y0 + 3.6, dA[2]], door); G.quad([dA[0], y0 + 3.6, dA[2]], [dB[0], y0 + 3.6, dB[2]], [dB[0], y0 + 0.4, dB[2]], [dA[0], y0 + 0.4, dA[2]], door);
    const sA = at(fu + west * 0.05, -2.3 * west, 0), sB = at(fu + west * 0.05, 2.3 * west, 0); S.quad([sA[0], y0 + 4.3, sA[2]], [sB[0], y0 + 4.3, sB[2]], [sB[0], y0 + 5.1, sB[2]], [sA[0], y0 + 5.1, sA[2]], C(0xffffff), row(5));
    S.quad([sB[0], y0 + 4.3, sB[2]], [sA[0], y0 + 4.3, sA[2]], [sA[0], y0 + 5.1, sA[2]], [sB[0], y0 + 5.1, sB[2]], C(0xffffff), row(5));
    // tall nave windows on both long sides
    for (let k = -3; k <= 3; k++) for (const s of [-1, 1]) { const u = k * hl / 4.2, wA = at(u - 0.6, s * (hw + 0.04), 0), wB = at(u + 0.6, s * (hw + 0.04), 0);
      const q = [[wA[0], y0 + 2.2, wA[2]], [wB[0], y0 + 2.2, wB[2]], [wB[0], y0 + 6.8, wB[2]], [wA[0], y0 + 6.8, wA[2]]]; if (s < 0) G.quad(q[1], q[0], q[3], q[2], C(0x3d4a66)); else G.quad(q[0], q[1], q[2], q[3], C(0x3d4a66)); }
  }
  // function hall + Colletti's Market
  { const r = extrude(G, B.hall, 5.5, C(0xd9cdb5), C(0x4b4c50)); const E = faceEdge(r.P, 1265, -1450); band(S, E, r.y0 + 0.4, E.L * 0.25, E.L * 0.75, 3.6, 4.6, 0.08, C(0xffffff), row(6)); }
  { const r = extrude(G, B.collettis, 5.0, C(0xe3dccb), C(0x46474b)); const E = faceEdge(r.P, 1300, -752), yb = r.y0 + 0.4;
    band(G, E, yb, 1, E.L - 1, 0.3, 2.7, 0.04, glass); band(S, E, yb, 1, E.L - 1, 3.1, 4.4, 0.08, C(0xffffff), row(4)); }
  // parking lot: asphalt on a 2 m grid draped on the terrain, stall lines in front of the shops
  { const L = D.lot, asph = C(0x2c2e31), line = C(0xe9e9e2); let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; L.forEach(([x, z]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); });
    const inside = (x, z) => { let c = false; for (let i = 0, j = L.length - 1; i < L.length; j = i++) { const a = L[i], b = L[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
    const st = 2, y = (x, z) => tH(x, z) + 0.12;
    for (let x = x0; x < x1; x += st) for (let z = z0; z < z1; z += st) if (inside(x + st / 2, z + st / 2)) G.quad([x, y(x, z + st), z + st], [x + st, y(x + st, z + st), z + st], [x + st, y(x + st, z), z], [x, y(x, z), z], asph);
    const E = faceEdge(D.b[0].p.slice().reverse(), 1258, -1180), dx = (E.b[0] - E.a[0]) / E.L, dz = (E.b[1] - E.a[1]) / E.L;
    for (let u = 1.5; u < E.L - 1; u += 2.75) { const ax = E.a[0] + dx * u + E.nx * 1.5, az = E.a[1] + dz * u + E.nz * 1.5, bx = ax + E.nx * 5.2, bz = az + E.nz * 5.2, w = 0.07;
      G.quad([ax - dx * w, y(ax, az) + 0.03, az - dz * w], [bx - dx * w, y(bx, bz) + 0.03, bz - dz * w], [bx + dx * w, y(bx, bz) + 0.03, bz + dz * w], [ax + dx * w, y(ax, az) + 0.03, az + dz * w], line); }
  }
  const grp = new THREE.Group(); grp.name = 'raynham-center';
  const mA = clip(new THREE.MeshLambertMaterial({vertexColors: true, side: THREE.DoubleSide})), mS = clip(new THREE.MeshBasicMaterial({map: signAtlas(), toneMapped: false, side: THREE.DoubleSide}));
  const m1 = G.mesh(mA, 'houses-raynham'), m2 = S.mesh(mS, 'houses-raynham-signs'); m2.castShadow = false; grp.add(m1, m2);
  // the flag: a small canvas flag (MeshBasic), near the pole top
  { const c = document.createElement('canvas'); c.width = 190; c.height = 100; const g = c.getContext('2d'); for (let i = 0; i < 13; i++) { g.fillStyle = i % 2 ? '#fff' : '#b22234'; g.fillRect(0, i * 100 / 13, 190, 100 / 13 + 0.5); }
    g.fillStyle = '#3c3b6e'; g.fillRect(0, 0, 76, 54); g.fillStyle = '#fff'; for (let r = 0; r < 5; r++) for (let k = 0; k < 6; k++) g.fillRect(5 + k * 12 + (r % 2) * 6, 5 + r * 10, 2.5, 2.5);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const f = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.0), clip(new THREE.MeshBasicMaterial({map: t, side: THREE.DoubleSide, toneMapped: false})));
    const fy = tH(1251, -1158); f.position.set(1251 + 0.95, fy + 9.3, -1158); f.rotation.y = Math.PI / 2 - 0.3; f.name = 'houses-raynham-flag'; grp.add(f); }
  grp.userData.tris = m1.userData.tris + m2.userData.tris; return grp;
}
function pushGeo(G, g, col) { const p = g.attributes.position.array; for (let i = 0; i < p.length; i += 9) G.tri([p[i], p[i + 1], p[i + 2]], [p[i + 3], p[i + 4], p[i + 5]], [p[i + 6], p[i + 7], p[i + 8]], col); g.dispose(); }
function obb(P) {   // min-area rectangle over the footprint's edge directions
  let best = null; const cx0 = P.reduce((s, p) => s + p[0], 0) / P.length, cz0 = P.reduce((s, p) => s + p[1], 0) / P.length;
  for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 2) continue; const ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L;
    let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9; for (const [x, z] of P) { const u = (x - cx0) * ux + (z - cz0) * uz, v = -(x - cx0) * uz + (z - cz0) * ux; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
    const A = (u1 - u0) * (v1 - v0); if (!best || A < best.A) best = {A, ux, uz, u0, u1, v0, v1}; }
  let {ux, uz, u0, u1, v0, v1} = best; if (u1 - u0 < v1 - v0) { const t = ux; ux = -uz; uz = t; const a = [v0, v1]; [u0, u1] = [a[0], a[1]]; [v0, v1] = [-best.u1, -best.u0]; }
  const uc = (u0 + u1) / 2, vc = (v0 + v1) / 2; return {cx: cx0 + ux * uc - uz * vc, cz: cz0 + uz * uc + ux * vc, ux, uz, hl: (u1 - u0) / 2, hw: (v1 - v0) / 2};
}

/* ---------- place boards (lazy, billboarded) ---------- */
function boardSpecs() {
  const out = [], cH = [7.0, 9.2, 11.4, 13.6, 7.6, 10.4]; let ci = 0;
  for (const p of D.pois) { const big = p.k === 'r', x = p.p[0], z = p.p[1];
    out.push({x, z, text: p.n, sub: p.s, bg: p.k === 'x' ? '#0b5d2e' : '#12306b', w: big ? 12 : p.k === 'x' ? 9 : 5.2, h: big ? 18 : p.k === 'x' ? 11.5 : cH[ci++ % cH.length], show: big ? 2600 : 650}); }
  for (const c of D.cross) out.push({x: c.p[0], z: c.p[1], text: c.n, sub: null, bg: '#1f6fa8', w: 7, h: 9, show: 1400});
  const starts = [];
  for (const r of D.routes) { const p = r.p[0]; let s = starts.find(q => Math.hypot(q.x - p[0], q.z - p[1]) < 60); if (!s) { s = {x: p[0], z: p[1], k: 0}; starts.push(s); }
    out.push({x: s.x + 3, z: s.z + 3, text: 'Route ' + r.n + ' start', sub: r.name + ' \u00b7 ' + r.km + ' km', bg: '#7a5a00', w: 8, h: 14 + 3.2 * s.k++, show: 1200}); }
  return out;
}
function boardMesh(b) {
  const grp = new THREE.Group(), y = gh(b.x, b.z), hh = b.w * 0.19;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, b.h, 6), new THREE.MeshLambertMaterial({color: 0x5a5f66})); pole.position.set(0, b.h / 2, 0); grp.add(pole);
  const tex = boardTex(b.text, b.sub, b.bg, 1024, 196), m = new THREE.Mesh(new THREE.PlaneGeometry(b.w, hh), new THREE.MeshBasicMaterial({map: tex, toneMapped: false, side: THREE.DoubleSide}));
  m.position.set(0, b.h + hh / 2, 0); grp.add(m); grp.position.set(b.x, y, b.z); grp.name = 'raynham-board'; grp.userData.face = m; return grp;
}
function dispose(o) { o.traverse(m => { if (m.geometry) m.geometry.dispose(); if (m.material) [].concat(m.material).forEach(t => { if (t.map) t.map.dispose(); t.dispose(); }); }); }

/* ---------- route arrows (one InstancedMesh) ---------- */
function arrowMesh() {
  const s = new THREE.Shape(); s.moveTo(2.2, 0); s.lineTo(-1.2, 1.6); s.lineTo(-0.4, 0); s.lineTo(-1.2, -1.6); s.closePath();
  const g = new THREE.ShapeGeometry(s); g.rotateX(-Math.PI / 2);   // lies flat, points +x
  const m = new THREE.InstancedMesh(g, new THREE.MeshBasicMaterial({color: 0xffc933, side: THREE.DoubleSide, toneMapped: false, transparent: true, opacity: 0.88, fog: true}), LITE ? 90 : 180);
  m.count = 0; m.frustumCulled = false; m.name = 'raynham-arrows'; return m;
}
function buildSamples() {
  samples = [];
  for (const r of D.routes) { const P = r.p; let carry = 0;
    for (let i = 1; i < P.length; i++) { const a = P[i - 1], b = P[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 0.01) continue; const yaw = Math.atan2(-(b[1] - a[1]), b[0] - a[0]);
      for (let s = carry; s < L; s += 32) { const x = a[0] + (b[0] - a[0]) * s / L, z = a[1] + (b[1] - a[1]) * s / L; samples.push({x, z, yaw, n: r.n, y: null}); }
      carry = (carry - L) % 32; if (carry < 0) carry += 32; } }
}
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3(1, 1, 1);
function updateArrows(cx, cz) {
  if (!arrows) return; const near = [], R2 = 700 * 700, only = ride ? ride.r.n : 0;
  for (const s of samples) { if (only && s.n !== only) continue; const dx = s.x - cx, dz = s.z - cz, d2 = dx * dx + dz * dz; if (d2 < R2) near.push([d2, s]); }
  near.sort((a, b) => a[0] - b[0]); const n = Math.min(near.length, arrows.instanceMatrix.count);
  for (let i = 0; i < n; i++) { const s = near[i][1]; if (s.y === null) s.y = gh(s.x, s.z) + 3.8; _e.set(0, s.yaw, 0); _q.setFromEuler(_e); _m.compose(_v.set(s.x, s.y, s.z), _q, _s); arrows.setMatrixAt(i, _m); }
  arrows.count = n; arrows.instanceMatrix.needsUpdate = true;
}

/* ---------- route board (clickable kiosk in the lot) ---------- */
function buildKiosk(sc) {
  const k = document.createElement('a-entity'), y = tH(1246.3, -1185.4); k.setAttribute('position', '1246.3 ' + (y + 0.05).toFixed(2) + ' -1185.4'); k.setAttribute('rotation', '0 69 0'); k.id = 'raynham-kiosk';
  const H = 0.2 * (D.routes.length + 2) + 0.3, top = 0.7 + H;
  const bg = document.createElement('a-plane'); bg.className = 'btn'; bg.dataset.blocker = '1'; bg.setAttribute('width', 3.3); bg.setAttribute('height', H); bg.setAttribute('position', '0 ' + (0.7 + H / 2).toFixed(2) + ' -0.01'); bg.setAttribute('material', 'shader:flat;color:#0b1d26;opacity:0.9;transparent:true'); k.appendChild(bg);
  const post = document.createElement('a-box'); post.setAttribute('width', 0.15); post.setAttribute('depth', 0.15); post.setAttribute('height', 0.72); post.setAttribute('position', '0 0.36 -0.05'); post.setAttribute('color', '#4a4f56'); k.appendChild(post);
  const t = document.createElement('a-text'); t.setAttribute('value', 'RAYNHAM ROUTES - pick one to ride'); t.setAttribute('align', 'center'); t.setAttribute('color', '#FFD700'); t.setAttribute('width', 3.2); t.setAttribute('wrap-count', 44); t.setAttribute('position', '0 ' + (top - 0.2).toFixed(2) + ' 0.01'); k.appendChild(t);
  D.routes.forEach((r, i) => { const p = document.createElement('a-plane'); p.className = 'btn'; p.setAttribute('width', 3.1); p.setAttribute('height', 0.17); p.setAttribute('position', '0 ' + (top - 0.45 - i * 0.2).toFixed(2) + ' 0.01');
    p.setAttribute('material', 'shader:flat;color:' + (i % 2 ? '#ffe08a' : '#FFD700'));
    const tx = document.createElement('a-text'); tx.setAttribute('value', r.n + '. ' + r.name + '  (' + r.km + ' km)'); tx.setAttribute('align', 'center'); tx.setAttribute('color', '#111'); tx.setAttribute('width', 3.0); tx.setAttribute('wrap-count', 66); tx.setAttribute('position', '-0.02 0 0.005'); p.appendChild(tx);
    p.addEventListener('click', () => startRide(r.n)); k.appendChild(p); });
  sc.appendChild(k); return k;
}

/* ---------- ride ---------- */
function rig() { return document.getElementById('rig'); }
function flyLabel(on) { const l = document.querySelector('#flylabel'); if (l) l.setAttribute('value', on ? 'Fly: ON' : 'Fly: OFF'); }
function startRide(n) {
  if (!D) return false; const r = D.routes.find(q => q.n === +n); if (!r) return false; const P = r.p, cum = [0];
  for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const L = cum[cum.length - 1], rg = rig(); if (!rg) return false;
  if (window.JFVR) JFVR.fly = true; flyLabel(true);
  const sc = document.querySelector('a-scene'), vr = sc && sc.is('vr-mode'), a = P[0], b = P[Math.min(3, P.length - 1)], yaw = Math.atan2(-(b[0] - a[0]), -(b[1] - a[1])) * 180 / Math.PI;
  W3D.teleportTo(a[0], gh(a[0], a[1]) + 35, a[1], yaw);
  const lc = document.querySelector('[camera]') && document.querySelector('[camera]').components['look-controls']; if (lc && !vr) { lc.pitchObject.rotation.x = -0.32; lc.yawObject.rotation.y = 0; }
  ride = {r, P, cum, L, s: 0, y: null, last: rg.object3D.position.clone(), vr}; updateArrows(a[0], a[1]);
  if (JFVR.hud) JFVR.hud('Route ' + r.n + ': ' + r.name + ' - ' + r.km + ' km. Move or teleport to take over.');
  return true;
}
function stopRide(msg) { if (!ride) return; ride = null; if (msg && window.JFVR && JFVR.hud) JFVR.hud(msg); }
function at(s) { const {P, cum} = ride; let i = 1; while (i < cum.length - 1 && cum[i] < s) i++; const a = P[i - 1], b = P[i], L = cum[i] - cum[i - 1] || 1, t = Math.min(1, Math.max(0, (s - cum[i - 1]) / L)); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
function tickRide(dt) {
  const rg = rig(); if (!rg) return; const P3 = rg.object3D.position;
  if (Math.hypot(P3.x - ride.last.x, P3.z - ride.last.z) > 2.5) { stopRide('You took over - ride stopped'); return; }   // the player moved / teleported
  const prev = at(ride.s); ride.s = Math.min(ride.L, ride.s + R.speed * dt); const p = at(ride.s);
  let g = -1e9; for (const d of [0, 40, 80, 120]) { const q = at(Math.min(ride.L, ride.s + d)); g = Math.max(g, gh(q[0], q[1])); }
  const ty = g + 35; ride.y = ride.y === null ? P3.y : ride.y + (ty - ride.y) * Math.min(1, dt * 0.8);
  P3.x += p[0] - prev[0]; P3.z += p[1] - prev[1]; P3.y = ride.y;
  if (!ride.vr) { const q = at(Math.min(ride.L, ride.s + 70)), want = Math.atan2(-(q[0] - p[0]), -(q[1] - p[1])); let d = want - rg.object3D.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); rg.object3D.rotation.y += d * Math.min(1, dt * 1.2); }
  const ph = rg.components['w3d-physics']; if (ph && ph.prev) ph.prev.copy(P3); ride.last.copy(P3);
  if (ride.s >= ride.L) { const r = ride.r, e = ride.P[ride.P.length - 1]; ride = null; if (window.JFVR) JFVR.fly = false; flyLabel(false); W3D.teleportTo(e[0], undefined, e[1]); if (JFVR.hud) JFVR.hud('End of route ' + r.n + ': ' + r.name); }
}

/* ---------- spots + menu ---------- */
const SP = {
  raynham: () => { W3D.teleportTo(SPOT.x, undefined, SPOT.z, SPOT.yaw); }, 'raynham-center': () => SP.raynham(), 'raynham-routes': () => SP.raynham(),
  'st-anns': () => { W3D.teleportTo(1296, undefined, -1352, -72); }, collettis: () => { W3D.teleportTo(1318, undefined, -748, -105); }
};
for (let i = 1; i <= 13; i++) SP['raynham-route-' + i] = () => { const go = () => D ? startRide(i) : setTimeout(go, 400); go(); };
(function reg() { if (!W3D.spots) return setTimeout(reg, 300); Object.assign(W3D.spots, SP); W3D.spots['st-ann'] = SP['st-anns']; })();
function menus() {
  const ref = document.querySelector('#ui button[data-w="walker"]');
  if (ref && !document.querySelector('#ui button[data-w="raynham"]')) { const b = document.createElement('button'); b.dataset.w = 'raynham'; b.textContent = 'Raynham Center & routes'; ref.parentNode.insertBefore(b, ref);
    b.addEventListener('click', () => { if (typeof window.goWorld === 'function') window.goWorld('raynham'); }); }
  const bar = document.getElementById('vrbar');
  if (bar && !document.getElementById('raynhamvr')) { const p = document.createElement('a-plane'); p.id = 'raynhamvr'; p.className = 'btn'; p.dataset.w = 'raynham'; p.setAttribute('width', 1.3); p.setAttribute('height', 0.26); p.setAttribute('material', 'shader:flat;color:#FFD700');
    const t = document.createElement('a-text'); t.setAttribute('value', 'Raynham Center'); t.setAttribute('align', 'center'); t.setAttribute('color', '#111'); t.setAttribute('width', 2.0); t.setAttribute('position', '0 0 0.005'); p.appendChild(t);
    p.addEventListener('click', () => { if (typeof window.goWorld === 'function') window.goWorld('raynham'); }); bar.appendChild(p); }
}
function arrival() {   // index.html's ?spot= list doesn't know these names yet: hop there once the world is up
  const sp = (new URLSearchParams(location.search).get('spot') || '').toLowerCase(); if (!SP[sp] && sp !== 'st-ann') return;
  const go = () => { if (!window.W3D_READY || typeof window.goWorld !== 'function') return setTimeout(go, 300); setTimeout(() => window.goWorld(sp), 250); }; go();
}

/* ---------- system ---------- */
AFRAME.registerSystem('w3d-raynham', {
  init() { const sc = this.el; const m = () => { menus(); }; if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', m); else m(); setTimeout(menus, 3000); arrival();
    sc.addEventListener('enter-vr', () => { if (ride) ride.vr = true; }); sc.addEventListener('exit-vr', () => { if (ride) ride.vr = false; }); },
  tick(t, dt) {
    if (!window.W3D_READY || !W3D.root || !dt) return;
    if (!D) { if (!this.loading) { this.loading = true; fetch('/vr/w3d/raynham.json?v=2').then(r => r.json()).then(j => { D = j; buildSamples(); }).catch(e => console.warn('raynham data unavailable', e)); } return; }
    const sec = Math.min(dt, 100) / 1000; if (ride) tickRide(sec);
    const sc = this.el, cam = sc.camera; if (!cam) return; cam.getWorldPosition(_v); const cx = _v.x, cz = _v.z;
    for (const b of boards) if (b.mesh && b.mesh.visible) b.mesh.rotation.y = Math.atan2(cx - b.x, cz - b.z);
    acc += dt; if (acc < 500) return; acc = 0;
    if (!W3D.active) { if (center) center.visible = false; return; }
    const dC = Math.hypot(cx - CEN.x, cz - CEN.z);
    if (!center && dC < BUILD_D) { center = buildCenter(sc); W3D.root.add(center); console.log('raynham: center built, ' + center.userData.tris + ' tris'); }
    else if (center && dC > DROP_D) { W3D.root.remove(center); dispose(center); center = null; }
    if (center) center.visible = true;
    if (!kiosk && dC < 400 && sc.hasLoaded) kiosk = buildKiosk(sc);
    if (kiosk && kiosk.object3D) kiosk.object3D.visible = dC < 120;
    if (!arrows) { arrows = arrowMesh(); W3D.root.add(arrows); boards = boardSpecs(); }
    if (ride || Math.hypot(cx - last.x, cz - last.z) > 25) { last.x = cx; last.z = cz; updateArrows(cx, cz);
      for (const b of boards) { const d = Math.hypot(cx - b.x, cz - b.z);
        if (!b.mesh && d < b.show) { b.mesh = boardMesh(b); W3D.root.add(b.mesh); } else if (b.mesh && d > b.show * 1.4) { W3D.root.remove(b.mesh); dispose(b.mesh); b.mesh = null; } } }
  }
});
})();
