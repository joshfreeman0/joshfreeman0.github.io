/* Bank tower interiors, floors 2-6 (Bank of the United States (3rd ed.), Egyptian temple bank at Fowling Pond).
   Tower: 18 x 18 m solid box at world x 967..985, z -389..-371 (world.js buildBank), floors 5 m apart, L1 = y 34 (banking hall), L7 = office y 64.
   Local frame (matches Josh's floor layouts, /bank-concept tower_floors.json): u metres east from the SW corner, n metres north: X = 967 + u, Z = -371 - n.
   L2 private client suites | L3 operations + risk/compliance (glass) | L4 boardroom + staff hub | L5 four guest apartments + residents' lounge
   L6 Josh's residence (master bedroom with star ceiling, closet, spa, living, kitchen, dining, study, west loggia, spiral stair up to the L7 office).
   The tower's outside is untouched: the solid box is never seen from inside (back faces are culled), so the interior has its own wall skin with
   window openings that look straight out through it; from outside the tower looks exactly as before. Only its single collision box is swapped for
   per-floor walls, and the L7 floor gets a 2.4 m opening where the private stair arrives.
   Everything is merged into one mesh per material, built only when you are within 110 m, hidden past 160 m. No lights (emissive materials).
   Lift: floor selector panels (L1..L7) at every level. ?spot=residence (L6 by the bed), ?spot=guest (L5 apartment), W3D.towerGo(level). */
(function () {
'use strict';
const W3D = window.W3D = window.W3D || {};
const LITE = !!window.JFVR_LITE, QUEST = /OculusBrowser|Quest/i.test(navigator.userAgent), HI = !LITE;
const X0 = 967, Z0 = -371, Y1 = 34, FH = 5, CH = 4.6, S = 18;
const DATA={"2":{"r":[["Fire stair S1 (shared, secured re-entry)",0.5,6.0,0.5,3.0,"stair"],["Risers / janitor",6.0,7.5,0.5,3.0,"service"],["Bank lift LB (B2-L4, L7)",0.5,2.8,3.0,5.2,"lift"],["Residential / private lift LR (L1 residents, L5, L6, L7)",0.5,2.8,5.2,7.4,"lift"],["Fire stair S2",14.0,17.5,2.9,7.4,"stair"],["Lift lobby + client reception",2.8,7.5,3.0,7.4,"core"],["Accessible WC",0.5,2.8,7.4,9.4,"wet"],["Corridor",2.8,17.5,7.4,9.4,"corridor"],["Client lounge",7.5,14.0,0.5,7.4,"room"],["Pantry",14.0,17.5,0.5,2.9,"service"],["Client suite 1",0.5,4.75,9.4,17.5,"room"],["Client suite 2",4.75,9.0,9.4,17.5,"room"],["Client suite 3",9.0,13.25,9.4,17.5,"room"],["Client suite 4",13.25,17.5,9.4,17.5,"room"]],"d":[["h",3.0,3.2,4.4],["h",7.4,15.2,16.4],["h",7.4,4.0,6.5],["h",7.4,9.5,11.5],["v",14.0,1.0,2.2],["h",9.4,2.0,3.2],["h",9.4,6.3,7.5],["h",9.4,10.5,11.7],["h",9.4,14.8,16.0]]},"3":{"r":[["Fire stair S1 (shared, secured re-entry)",0.5,6.0,0.5,3.0,"stair"],["Risers / janitor",6.0,7.5,0.5,3.0,"service"],["Bank lift LB (B2-L4, L7)",0.5,2.8,3.0,5.2,"lift"],["Residential / private lift LR (L1 residents, L5, L6, L7)",0.5,2.8,5.2,7.4,"lift"],["Fire stair S2",14.0,17.5,2.9,7.4,"stair"],["Lift lobby + print / post",2.8,7.5,3.0,7.4,"core"],["Accessible WC",0.5,2.8,7.4,9.4,"wet"],["Corridor",2.8,17.5,7.4,9.4,"corridor"],["Risk, compliance & legal offices (RESTRICTED)",7.5,14.0,0.5,7.4,"restricted"],["Secure legal file room (RESTRICTED)",14.0,17.5,0.5,2.9,"restricted"],["Operations open-plan (24 desks)",0.5,13.0,9.4,17.5,"room"],["Meeting room (8)",13.0,17.5,9.4,13.5,"room"],["Focus / call rooms",13.0,17.5,13.5,17.5,"room"]],"d":[["h",3.0,3.2,4.4],["h",7.4,15.2,16.4],["h",7.4,4.0,6.5],["h",7.4,9.5,10.7],["v",14.0,1.0,2.2],["h",9.4,4.0,8.0],["h",9.4,14.5,15.7],["v",13.0,15.0,16.2]]},"4":{"r":[["Fire stair S1 (shared, secured re-entry)",0.5,6.0,0.5,3.0,"stair"],["Risers / janitor",6.0,7.5,0.5,3.0,"service"],["Bank lift LB (B2-L4, L7)",0.5,2.8,3.0,5.2,"lift"],["Residential / private lift LR (L1 residents, L5, L6, L7)",0.5,2.8,5.2,7.4,"lift"],["Fire stair S2",14.0,17.5,2.9,7.4,"stair"],["Lift lobby",2.8,7.5,3.0,7.4,"core"],["Accessible WC",0.5,2.8,7.4,9.4,"wet"],["Corridor",2.8,17.5,7.4,9.4,"corridor"],["Executive support (assistants)",7.5,11.0,0.5,7.4,"room"],["Quiet / nursing room",11.0,14.0,0.5,4.0,"room"],["Staff lockers",11.0,14.0,4.0,7.4,"service"],["Staff showers + WC",14.0,17.5,0.5,2.9,"wet"],["Staff kitchen + break room",0.5,6.5,9.4,17.5,"room"],["Boardroom (16)",6.5,17.5,9.4,17.5,"room"]],"d":[["h",3.0,3.2,4.4],["h",7.4,15.2,16.4],["h",7.4,4.0,6.5],["h",7.4,8.5,9.7],["h",7.4,12.0,13.2],["h",4.0,11.8,13.0],["v",14.0,1.0,2.2],["h",9.4,2.5,4.5],["h",9.4,10.0,12.0]]},"5":{"r":[["Fire stair S1 (shared, secured re-entry)",0.5,6.0,0.5,3.0,"stair"],["Risers / janitor",6.0,7.5,0.5,3.0,"service"],["Bank lift LB (B2-L4, L7)",0.5,2.8,3.0,5.2,"lift"],["Residential / private lift LR (L1 residents, L5, L6, L7)",0.5,2.8,5.2,7.4,"lift"],["Fire stair S2",14.0,17.5,2.9,7.4,"stair"],["Residents' lounge",2.8,7.5,3.0,7.4,"residence"],["Residents' vestibule (LR arrival)",0.5,2.8,7.4,9.4,"residence"],["Residents' corridor",2.8,17.5,7.4,9.4,"corridor"],["Guest apartment 1",0.5,6.17,9.4,17.5,"residence"],["Guest apartment 2",6.17,11.83,9.4,17.5,"residence"],["Guest apartment 3",11.83,17.5,9.4,17.5,"residence"],["Guest apartment 4",7.5,14.0,0.5,7.4,"residence"],["Guest apartment 4 (bed alcove)",14.0,17.5,0.5,2.9,"residence"]],"d":[["h",3.0,3.2,4.4],["h",7.4,15.2,16.4],["h",7.4,3.0,7.3],["v",2.8,7.6,9.2],["h",9.4,4.2,5.2],["h",9.4,7.0,8.0],["h",9.4,12.6,13.6],["h",7.4,8.5,9.5]]},"6":{"r":[["Fire stair S1 (shared, secured re-entry)",0.5,6.0,0.5,3.0,"stair"],["Risers / janitor",6.0,7.5,0.5,3.0,"service"],["Bank lift LB (B2-L4, L7)",0.5,2.8,3.0,5.2,"lift"],["Residential / private lift LR (L1 residents, L5, L6, L7)",0.5,2.8,5.2,7.4,"lift"],["Fire stair S2",14.0,17.5,2.9,7.4,"stair"],["Private entry foyer (LR arrival)",0.5,2.8,7.4,9.4,"residence"],["Gallery",2.8,17.5,7.4,9.4,"corridor"],["Guest powder room",2.8,4.8,3.0,5.2,"wet"],["Laundry / pantry",2.8,4.8,5.2,7.4,"service"],["Full kitchen",4.8,9.0,3.0,7.4,"residence"],["Butler's pantry",7.5,9.0,0.5,3.0,"service"],["Dining (8)",9.0,12.5,0.5,7.4,"residence"],["Study",12.5,17.5,0.5,2.9,"residence"],["Study (desk bay)",12.5,14.0,2.9,7.4,"residence"],["Private stair to L7 office (spiral, 2.3 m)",0.5,3.0,9.4,11.7,"private_stair"],["Recessed loggia / terrace (west, over Fowling Pond)",0.5,3.5,11.7,17.5,"terrace"],["Living room",3.5,10.0,9.4,17.5,"residence"],["Walk-in closet",10.0,13.0,9.4,12.5,"residence"],["Spa bath",13.0,17.5,9.4,12.5,"wet"],["Master bedroom (king bed, star ceiling)",10.0,17.5,12.5,17.5,"bed"]],"d":[["h",3.0,3.2,4.4],["h",7.4,15.2,16.4],["v",2.8,7.6,9.2],["h",9.4,0.8,2.4],["h",7.4,5.2,8.8],["h",5.2,3.2,4.2],["v",9.0,3.4,7.0],["v",12.5,4.0,5.2],["h",9.4,4.5,9.0],["v",3.5,12.2,17.0],["h",9.4,10.4,11.6],["h",12.5,11.0,12.2],["h",12.5,14.5,15.7],["v",13.0,10.4,11.6]]}};
const LNAME = {1: 'Banking hall', 2: 'Private client suites', 3: 'Operations + compliance', 4: 'Boardroom + staff hub', 5: 'Guest apartments', 6: "Josh's residence", 7: "Josh's office"};
const lvY = k => Y1 + FH * (k - 1);
const COL = [];            // colliders {x0,x1,z0,z1,ya,yb}
const FLO = [];            // extra floor patches (spiral stair treads)
const BIN = {};            // material key -> {p:[],n:[],u:[],i:[]}
const LAB = [];            // door labels
let Yc = 34, curLevel = 2, TRI = {};
const TS = {lime: 2.4, stone: 3, wood: 2.4, carpet: 2, walnut: 1.6};
const FZ = 3.6;            // frieze tile length
function bin(m) { return BIN[m] || (BIN[m] = {p: [], n: [], u: [], i: [], lv: {}}); }
function quad(m, a, b, c, d, nx, ny, nz, ua, va, ub, vb, uc, vc, ud, vd) {
  const B = bin(m), k = B.p.length / 3;
  B.p.push(...a, ...b, ...c, ...d); for (let j = 0; j < 4; j++) B.n.push(nx, ny, nz);
  B.u.push(ua, va, ub, vb, uc, vc, ud, vd); B.i.push(k, k + 1, k + 2, k, k + 2, k + 3);
  B.lv[curLevel] = (B.lv[curLevel] || 0) + 2;
}
function addBox(m, x0, x1, ya, yb, z0, z1, noBottom, noTop) {
  const T = TS[m] || 0, f = m === 'frieze', s = T ? 1 / T : 0, h = yb - ya;
  const U = (a, b) => f ? [a / FZ, b] : [a * s, b * s];
  // +x, -x, +z, -z, top, bottom
  let q;
  q = [[x1, ya, z1], [x1, ya, z0], [x1, yb, z0], [x1, yb, z1]];
  quad(m, ...q, 1, 0, 0, ...(f ? [z1 / FZ, 0, z0 / FZ, 0, z0 / FZ, 1, z1 / FZ, 1] : [z1 * s, ya * s, z0 * s, ya * s, z0 * s, yb * s, z1 * s, yb * s]));
  q = [[x0, ya, z0], [x0, ya, z1], [x0, yb, z1], [x0, yb, z0]];
  quad(m, ...q, -1, 0, 0, ...(f ? [z0 / FZ, 0, z1 / FZ, 0, z1 / FZ, 1, z0 / FZ, 1] : [z0 * s, ya * s, z1 * s, ya * s, z1 * s, yb * s, z0 * s, yb * s]));
  q = [[x0, ya, z1], [x1, ya, z1], [x1, yb, z1], [x0, yb, z1]];
  quad(m, ...q, 0, 0, 1, ...(f ? [x0 / FZ, 0, x1 / FZ, 0, x1 / FZ, 1, x0 / FZ, 1] : [x0 * s, ya * s, x1 * s, ya * s, x1 * s, yb * s, x0 * s, yb * s]));
  q = [[x1, ya, z0], [x0, ya, z0], [x0, yb, z0], [x1, yb, z0]];
  quad(m, ...q, 0, 0, -1, ...(f ? [x1 / FZ, 0, x0 / FZ, 0, x0 / FZ, 1, x1 / FZ, 1] : [x1 * s, ya * s, x0 * s, ya * s, x0 * s, yb * s, x1 * s, yb * s]));
  if (!noTop) { q = [[x0, yb, z1], [x1, yb, z1], [x1, yb, z0], [x0, yb, z0]];
  quad(m, ...q, 0, 1, 0, x0 * s, z1 * s, x1 * s, z1 * s, x1 * s, z0 * s, x0 * s, z0 * s); }
  if (!noBottom) { q = [[x0, ya, z0], [x1, ya, z0], [x1, ya, z1], [x0, ya, z1]]; quad(m, ...q, 0, -1, 0, x0 * s, z0 * s, x1 * s, z0 * s, x1 * s, z1 * s, x0 * s, z1 * s); }
}
// horizontal plane facing up (dir 1) or down (-1) at world y
function plane(m, x0, x1, z0, z1, y, dir, uvs) {
  const T = TS[m] || 0, s = T ? 1 / T : 0, a = uvs || [x0 * s, z0 * s, x1 * s, z1 * s];
  if (dir > 0) quad(m, [x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], 0, 1, 0, a[0], a[3], a[2], a[3], a[2], a[1], a[0], a[1]);
  else quad(m, [x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], 0, -1, 0, a[0], a[1], a[2], a[1], a[2], a[3], a[0], a[3]);
}
// vertical quad (glass etc.) in plane z = const or x = const
function vplane(m, x0, x1, z0, z1, ya, yb) {
  if (Math.abs(z1 - z0) < 1e-6) { quad(m, [x0, ya, z0], [x1, ya, z0], [x1, yb, z0], [x0, yb, z0], 0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1); quad(m, [x1, ya, z0], [x0, ya, z0], [x0, yb, z0], [x1, yb, z0], 0, 0, -1, 0, 0, 1, 0, 1, 1, 0, 1); }
  else { quad(m, [x0, ya, z1], [x0, ya, z0], [x0, yb, z0], [x0, yb, z1], 1, 0, 0, 0, 0, 1, 0, 1, 1, 0, 1); quad(m, [x0, ya, z0], [x0, ya, z1], [x0, yb, z1], [x0, yb, z0], -1, 0, 0, 0, 0, 1, 0, 1, 1, 0, 1); }
}
// rotated box (stair treads): centre (cx,cz), half sizes along the radial (hr) and tangent (ht) axes, angle a (world), y range
function rbox(m, cx, cz, hr, ht, a, ya, yb) {
  const rx = Math.cos(a), rz = Math.sin(a), tx = -rz, tz = rx, P = (sr, st) => [cx + rx * hr * sr + tx * ht * st, cz + rz * hr * sr + tz * ht * st];
  const c = [P(-1, -1), P(1, -1), P(1, 1), P(-1, 1)];
  const T = TS[m] || 0, s = T ? 1 / T : 0;
  for (let k = 0; k < 4; k++) { const A = c[k], B = c[(k + 1) % 4], nx = (B[1] - A[1]), nz = -(B[0] - A[0]), l = Math.hypot(nx, nz) || 1;
    quad(m, [B[0], ya, B[1]], [A[0], ya, A[1]], [A[0], yb, A[1]], [B[0], yb, B[1]], nx / l, 0, nz / l, 0, 0, 1, 0, 1, 1, 0, 1); }
  quad(m, [c[0][0], yb, c[0][1]], [c[3][0], yb, c[3][1]], [c[2][0], yb, c[2][1]], [c[1][0], yb, c[1][1]], 0, 1, 0, 0, 0, 1, 0, 1, 1, 0, 1);
}
function cyl(m, cx, cz, ya, yb, r, seg, capTop) {
  for (let k = 0; k < seg; k++) { const a0 = k / seg * 6.2832, a1 = (k + 1) / seg * 6.2832, am = (a0 + a1) / 2;
    quad(m, [cx + Math.cos(a1) * r, ya, cz + Math.sin(a1) * r], [cx + Math.cos(a0) * r, ya, cz + Math.sin(a0) * r], [cx + Math.cos(a0) * r, yb, cz + Math.sin(a0) * r], [cx + Math.cos(a1) * r, yb, cz + Math.sin(a1) * r], Math.cos(am), 0, Math.sin(am), 0, 0, 1, 0, 1, 1, 0, 1); }
  if (capTop !== false) { const B = bin(m), k0 = B.p.length / 3; B.p.push(cx, yb, cz); B.n.push(0, 1, 0); B.u.push(0.5, 0.5);
    for (let k = 0; k <= seg; k++) { const a = k / seg * 6.2832; B.p.push(cx + Math.cos(a) * r, yb, cz + Math.sin(a) * r); B.n.push(0, 1, 0); B.u.push(0.5, 0.5); }
    for (let k = 0; k < seg; k++) B.i.push(k0, k0 + 2 + k, k0 + 1 + k); B.lv[curLevel] = (B.lv[curLevel] || 0) + seg; }
}
function blob(m, cx, cy, cz, r, seg) { // low-poly ball (plants)
  const B = bin(m), k0 = B.p.length / 3, rows = 4;
  for (let j = 0; j <= rows; j++) for (let k = 0; k <= seg; k++) { const pa = j / rows * Math.PI, a = k / seg * 6.2832, nx = Math.sin(pa) * Math.cos(a), ny = Math.cos(pa), nz = Math.sin(pa) * Math.sin(a);
    B.p.push(cx + nx * r, cy + ny * r * 0.85, cz + nz * r); B.n.push(nx, ny, nz); B.u.push(0, 0); }
  for (let j = 0; j < rows; j++) for (let k = 0; k < seg; k++) { const a = k0 + j * (seg + 1) + k, b = a + seg + 1; B.i.push(a, a + 1, b, a + 1, b + 1, b); }
  B.lv[curLevel] = (B.lv[curLevel] || 0) + rows * seg * 2;
}
// local-frame box: extents in u/n, heights above the current floor; c = collide
function bx(m, u0, u1, n0, n1, y0, y1, c) {
  const x0 = X0 + Math.min(u0, u1), x1 = X0 + Math.max(u0, u1), z0 = Z0 - Math.max(n0, n1), z1 = Z0 - Math.min(n0, n1);
  if (m) addBox(m, x0, x1, Yc + y0, Yc + y1, z0, z1, y0 <= 0.001, y1 >= CH - 0.001 && Yc < 63);
  if (c) COL.push({x0, x1, z0, z1, ya: Yc + y0, yb: Yc + y1});
}
// oriented frame: a = lateral, f = forward (face = direction forward points: N,S,E,W)
function FR(cu, cn, face) {
  const D = {N: [0, 1], S: [0, -1], E: [1, 0], W: [-1, 0]}[face], L = [D[1], -D[0]];
  return (a0, a1, f0, f1, y0, y1, m, c) => bx(m, cu + L[0] * a0 + D[0] * f0, cu + L[0] * a1 + D[0] * f1, cn + L[1] * a0 + D[1] * f0, cn + L[1] * a1 + D[1] * f1, y0, y1, c);
}
function lamp(u, n, w) { w = w || 0.9; plane('lamp', X0 + u - w / 2, X0 + u + w / 2, Z0 - n - w / 2, Z0 - n + w / 2, Yc + CH - 0.03, -1, [0, 0, 1, 1]); }

/* ---------- shell: partitions from the room rectangles, floors, ceilings, windows, door plaques ---------- */
const roomAt = (k, u, n) => DATA[k].r.find(r => u > r[1] && u < r[2] && n > r[3] && n < r[4]);
const EX = {                      // extra doorways / glass beyond Josh's plan lists (open connections between halves of one room, service rooms)
  3: {glass: [['h', 7.4, 7.5, 14.0]]},
  5: {d: [['v', 14.0, 0.5, 2.9]]},
  6: {d: [['h', 2.9, 12.5, 14.0], ['h', 7.4, 3.2, 4.2], ['h', 3.0, 7.8, 8.7]]}
};
const kf = v => v.toFixed(2);
function shell(k) {
  const R = DATA[k].r, DD = DATA[k].d.concat((EX[k] && EX[k].d) || []), GL = (EX[k] && EX[k].glass) || [], H = {}, V = {};
  const add = (M, key, a, b) => { (M[kf(key)] = M[kf(key)] || []).push([a, b]); };
  for (const r of R) { const [, x0, x1, n0, n1] = r;
    if (n0 > 0.51) add(H, n0, x0, x1); if (n1 < 17.49) add(H, n1, x0, x1); if (x0 > 0.51) add(V, x0, n0, n1); if (x1 < 17.49) add(V, x1, n0, n1); }
  const doorsOn = (type, key) => DD.filter(d => d[0] === type && Math.abs(d[1] - key) < 0.02).map(d => [d[2], d[3]]);
  const glassOn = (type, key) => GL.filter(d => d[0] === type && Math.abs(d[1] - key) < 0.02).map(d => [d[2], d[3]]);
  const T = 0.07;
  const emit = (type, key, lo, hi) => { // one solid wall run lo..hi along the line
    if (hi - lo < 0.05) return;
    if (type === 'h') { bx('lime', lo - T, hi + T, key - T, key + T, 0, CH, true); } else { bx('lime', key - T, key + T, lo - T, hi + T, 0, CH, true); }
  };
  const lintel = (type, key, lo, hi) => { if (type === 'h') bx('lime', lo, hi, key - T, key + T, 2.3, CH); else bx('lime', key - T, key + T, lo, hi, 2.3, CH); };
  const glassRun = (type, key, lo, hi) => {
    if (type === 'h') { bx('brass', lo - 0.04, lo + 0.04, key - 0.05, key + 0.05, 0, 3.4); bx('brass', hi - 0.04, hi + 0.04, key - 0.05, key + 0.05, 0, 3.4); bx('brass', lo, hi, key - 0.05, key + 0.05, 3.4, 3.5); bx('lime', lo, hi, key - T, key + T, 3.5, CH); bx('lime', lo, hi, key - T, key + T, 0, 0.12);
      vplane('glass', X0 + lo, X0 + hi, Z0 - key, Z0 - key, 0.12 + Yc, 3.4 + Yc); COL.push({x0: X0 + lo, x1: X0 + hi, z0: Z0 - key - 0.05, z1: Z0 - key + 0.05, ya: Yc, yb: Yc + 3.4}); }
  };
  const run = (type, M) => {
    for (const key of Object.keys(M)) {
      const kn = parseFloat(key), segs = M[key].slice().sort((a, b) => a[0] - b[0]), un = [];
      for (const s of segs) { const l = un[un.length - 1]; if (l && s[0] <= l[1] + 0.001) l[1] = Math.max(l[1], s[1]); else un.push([s[0], s[1]]); }
      const gaps = doorsOn(type, kn).sort((a, b) => a[0] - b[0]), gl = glassOn(type, kn);
      for (const [a, b] of un) {
        let cuts = [[a, b]];
        for (const g of gaps) { cuts = cuts.flatMap(([c, d]) => { if (g[1] <= c || g[0] >= d) return [[c, d]]; const o = []; if (g[0] > c) o.push([c, g[0]]); if (g[1] < d) o.push([g[1], d]); return o; }); { const lo = Math.max(g[0], a), hi = Math.min(g[1], b); if (hi > lo + 0.05) lintel(type, kn, lo, hi); } }
        for (const g of gl) { cuts = cuts.flatMap(([c, d]) => { if (g[1] <= c || g[0] >= d) return [[c, d]]; const o = []; if (g[0] > c) o.push([c, g[0]]); if (g[1] < d) o.push([g[1], d]); return o; }); }
        for (const [c, d] of cuts) emit(type, kn, c, d);
        for (const g of gl) { // glass cut into pieces around door gaps
          let pcs = [[Math.max(g[0], a), Math.min(g[1], b)]]; for (const d of gaps) pcs = pcs.flatMap(([c, e]) => { if (d[1] <= c || d[0] >= e) return [[c, e]]; const o = []; if (d[0] > c) o.push([c, d[0]]); if (d[1] < e) o.push([d[1], e]); return o; });
          for (const [c, d] of pcs) if (d - c > 0.1) glassRun(type, kn, c, d); }
      }
    }
  };
  run('h', H); run('v', V);
  // door plaques: each doorway names the room it leads into (both sides)
  for (const d of DD) { if (!DATA[k].d.includes(d)) continue;
    const mid = (d[2] + d[3]) / 2;
    const A = d[0] === 'h' ? roomAt(k, mid, d[1] - 0.15) : roomAt(k, d[1] - 0.15, mid), B = d[0] === 'h' ? roomAt(k, mid, d[1] + 0.15) : roomAt(k, d[1] + 0.15, mid);
    if (!A || !B) continue;
    const w = d[3] - d[2];
    if (d[0] === 'h') { LAB.push({t: short(B[0]), x: X0 + mid, z: Z0 - (d[1] - T - 0.012), nx: 0, nz: 1, y: Yc + 2.62, w: Math.min(1.5, w + 0.2)}); LAB.push({t: short(A[0]), x: X0 + mid, z: Z0 - (d[1] + T + 0.012), nx: 0, nz: -1, y: Yc + 2.62, w: Math.min(1.5, w + 0.2)}); }
    else { LAB.push({t: short(B[0]), x: X0 + d[1] - T - 0.012, z: Z0 - mid, nx: -1, nz: 0, y: Yc + 2.62, w: Math.min(1.5, w + 0.2)}); LAB.push({t: short(A[0]), x: X0 + d[1] + T + 0.012, z: Z0 - mid, nx: 1, nz: 0, y: Yc + 2.62, w: Math.min(1.5, w + 0.2)}); }
  }
  // floors
  bx('stone', 0.5, 17.5, 0.5, 17.5, -0.01, 0);
  for (const r of R) { const nm = r[0], m = /Operations|Meeting|Focus|Boardroom|Risk|Secure|Executive/.test(nm) ? 'carpet' : /suite|Guest apartment|bedroom|Living|Study|Dining|closet|lounge|Quiet|Gallery/i.test(nm) && !/Client lounge/.test(nm) ? 'wood' : /Client lounge/.test(nm) ? 'carpet' : 'stone';
    plane(m, X0 + r[1], X0 + r[2], Z0 - r[4], Z0 - r[3], Yc + 0.012, 1); }
  // ceiling (L6 leaves the stair opening)
  const cr = [[0.5, 17.5, 0.5, 17.5]];
  const rects = k === 6 ? [[0.5, 0.55, 0.5, 17.5], [2.95, 17.5, 0.5, 17.5], [0.55, 2.95, 0.5, 9.4], [0.55, 2.95, 11.7, 17.5]] : cr;
  for (const [a, b, c, d] of rects) plane('ceil', X0 + a, X0 + b, Z0 - d, Z0 - c, Yc + CH - 0.01, -1, [a * 0.2, c * 0.2, b * 0.2, d * 0.2]);
  if (k === 6) plane('stars', X0 + 10, X0 + 17.5, Z0 - 17.5, Z0 - 12.5, Yc + CH - 0.012, -1, [0, 0, 1, 1]);
  windows(k);
}
function short(s) { return s.replace(/\(.*?\)/g, '').replace(/\s+/g, ' ').replace(/ \+ .*$/, '').trim().replace(/^Residential \/ private lift.*/, 'Private lift').replace(/^Bank lift.*/, 'Bank lift'); }
function windows(k) {
  const PW = 0.6, step = (17 - PW) / 5, piers = [0, 1, 2, 3, 4, 5].map(i => 0.5 + PW / 2 + i * step);
  for (const side of ['S', 'N', 'W', 'E']) {
    const along = (a, b, y0, y1, m, c, d) => { // box along the wall from a..b, thickness d, on the inside of the wall `side`
      const t0 = 0.5, t1 = 0.5 + d;
      if (side === 'S') bx(m, a, b, t0, t1, y0, y1, c); else if (side === 'N') bx(m, a, b, 17.5 - d, 17.5, y0, y1, c); else if (side === 'W') bx(m, t0, t1, a, b, y0, y1, c); else bx(m, 17.5 - d, 17.5, a, b, y0, y1, c); };
    let lo = 0.5, hi = 17.5, terrace = false;
    if (k === 6 && side === 'W') { hi = 11.7; terrace = true; }
    along(lo, hi, 0, 0.9, 'lime', false, 0.12); along(0.5, 17.5, 3.4, CH, 'frieze', false, 0.12);
    for (const c of piers) along(c - PW / 2, c + PW / 2, 0.9, 3.4, 'lime', false, 0.3);
    // glass
    const gx = side === 'S' ? [X0 + lo, X0 + hi, Z0 - 0.56, Z0 - 0.56] : side === 'N' ? [X0 + lo, X0 + hi, Z0 - 17.44, Z0 - 17.44] : side === 'W' ? [X0 + 0.56, X0 + 0.56, Z0 - hi, Z0 - lo] : [X0 + 17.44, X0 + 17.44, Z0 - hi, Z0 - lo];
    vplane('glass', gx[0], gx[1], gx[2], gx[3], Yc + 0.9, Yc + 3.4);
    if (terrace) { // loggia: low balustrade instead of sill + glass
      along(11.7, 17.5, 0, 1.05, 'lime', true, 0.2); along(11.7, 17.5, 1.05, 1.12, 'brass', false, 0.26); }
  }
}

/* ---------- furniture library (axis-aligned boxes; f = forward, a = lateral) ---------- */
function workstation(cu, cn, face) {
  const p = FR(cu, cn, face);
  p(-0.7, 0.7, -0.35, 0.35, 0.72, 0.76, 'walnut'); p(-0.68, -0.62, -0.32, 0.32, 0, 0.72, 'walnut'); p(0.62, 0.68, -0.32, 0.32, 0, 0.72, 'walnut'); p(-0.7, 0.7, -0.35, 0.35, 0, 0.76, null, true);
  p(-0.26, 0.26, 0.06, 0.1, 0.92, 1.26, 'screen'); if (HI) p(-0.03, 0.03, 0.06, 0.1, 0.76, 0.92, 'dark');
  chair(cu + FR.D(face)[0] * -0.7, cn + FR.D(face)[1] * -0.7, face);
}
FR.D = face => ({N: [0, 1], S: [0, -1], E: [1, 0], W: [-1, 0]}[face]);
function chair(cu, cn, face, m) { const p = FR(cu, cn, face); m = m || 'chair';
  p(-0.22, 0.22, -0.22, 0.22, 0.44, 0.5, m); p(-0.22, 0.22, -0.27, -0.22, 0.5, 0.95, m); if (HI) p(-0.03, 0.03, -0.03, 0.03, 0, 0.44, 'dark'); else p(-0.05, 0.05, -0.05, 0.05, 0, 0.44, 'dark'); }
function sofa(cu, cn, face, len, m) { const p = FR(cu, cn, face), h = len / 2; m = m || 'sofa';
  p(-h, h, -0.45, 0.42, 0.1, 0.45, m, true); p(-h, h, -0.5, -0.3, 0.45, 0.92, m); p(-h, -h + 0.16, -0.45, 0.42, 0.45, 0.68, m); p(h - 0.16, h, -0.45, 0.42, 0.45, 0.68, m);
  if (HI) { p(-h + 0.3, -h + 0.7, -0.28, 0.1, 0.45, 0.62, 'cush'); p(h - 0.7, h - 0.3, -0.28, 0.1, 0.45, 0.62, 'cush'); } }
function table(cu, cn, w, d, h, m, round) { h = h || 0.75; m = m || 'walnut'; const p = FR(cu, cn, 'N');
  p(-w / 2, w / 2, -d / 2, d / 2, h - 0.05, h, m, true);
  if (HI && w > 1.4) { p(-w / 2 + 0.1, -w / 2 + 0.16, -d / 2 + 0.1, d / 2 - 0.1, 0, h - 0.05, m); p(w / 2 - 0.16, w / 2 - 0.1, -d / 2 + 0.1, d / 2 - 0.1, 0, h - 0.05, m); } else p(-0.12, 0.12, -d / 2 + 0.15, d / 2 - 0.15, 0, h - 0.05, m); }
function rug(u0, u1, n0, n1, m) { bx(m || 'rug', u0, u1, n0, n1, 0.012, 0.024); if (HI) bx('brass', u0 + 0.12, u1 - 0.12, n0 + 0.12, n0 + 0.15, 0.024, 0.03), bx('brass', u0 + 0.12, u1 - 0.12, n1 - 0.15, n1 - 0.12, 0.024, 0.03); }
function counter(u0, u1, n0, n1) { bx('walnut', u0, u1, n0, n1, 0, 0.88, true); bx('stone2', u0 - 0.02, u1 + 0.02, n0 - 0.02, n1 + 0.02, 0.88, 0.92); }
function uppers(u0, u1, n0, n1) { bx('walnut', u0, u1, n0, n1, 1.5, 2.2); }
function fridge(u0, u1, n0, n1) { bx('steel', u0, u1, n0, n1, 0, 1.85, true); bx('dark', u0, u1, n0, n1, 0.9, 0.92); }
function hob(u, n) { bx('dark', u - 0.3, u + 0.3, n - 0.25, n + 0.25, 0.92, 0.935); }
function sink(u, n) { bx('steel', u - 0.35, u + 0.35, n - 0.22, n + 0.22, 0.92, 0.935); bx('brass', u - 0.02, u + 0.02, n - 0.02, n + 0.02, 0.93, 1.15); }
function stool(u, n) { bx('walnut', u - 0.17, u + 0.17, n - 0.17, n + 0.17, 0.6, 0.66); bx('dark', u - 0.03, u + 0.03, n - 0.03, n + 0.03, 0, 0.6); }
function bed(cu, cn, face, w, l) { const p = FR(cu, cn, face), hw = w / 2, hl = l / 2;
  p(-hw, hw, -hl, hl, 0.15, 0.42, 'walnut', true); p(-hw + 0.03, hw - 0.03, -hl + 0.05, hl - 0.04, 0.42, 0.6, 'linen');
  p(-hw + 0.1, -0.05, -hl + 0.08, -hl + 0.5, 0.6, 0.7, 'linen'); p(0.05, hw - 0.1, -hl + 0.08, -hl + 0.5, 0.6, 0.7, 'linen');
  p(-hw + 0.02, hw - 0.02, -0.2, hl - 0.03, 0.6, 0.64, 'lapis'); p(-hw - 0.06, hw + 0.06, -hl - 0.1, -hl, 0.15, 1.2, 'walnut');
  if (HI) { p(-hw - 0.12, hw + 0.12, -hl - 0.12, -hl - 0.1, 0.5, 1.1, 'lapis'); }
  for (const s of [-1, 1]) { const a0 = s * (hw + 0.28); p(a0 - 0.22, a0 + 0.22, -hl - 0.1, -hl + 0.34, 0, 0.5, 'walnut', true); if (HI) p(a0 - 0.05, a0 + 0.05, -hl + 0.05, -hl + 0.15, 0.5, 0.78, 'lamp'); } }
function wc(cu, cn, face) { const p = FR(cu, cn, face); p(-0.18, 0.18, -0.3, 0.2, 0, 0.4, 'white', true); p(-0.18, 0.18, -0.34, -0.2, 0.4, 0.85, 'white'); }
function basin(cu, cn, face) { const p = FR(cu, cn, face); p(-0.3, 0.3, -0.22, 0.22, 0.78, 0.88, 'white', true); p(-0.05, 0.05, -0.06, 0.06, 0, 0.78, 'white'); p(-0.02, 0.02, -0.2, -0.16, 0.88, 1.0, 'brass'); p(-0.3, 0.3, -0.26, -0.22, 1.1, 1.9, 'mirror'); }
function shower(u0, u1, n0, n1) { bx('white', u0, u1, n0, n1, 0, 0.06); vplane('glass', X0 + u0, X0 + u1, Z0 - n1, Z0 - n1, Yc + 0.06, Yc + 2.0); vplane('glass', X0 + u1, X0 + u1, Z0 - n1, Z0 - n0, Yc + 0.06, Yc + 2.0); COL.push({x0: X0 + u0, x1: X0 + u1, z0: Z0 - n1 - 0.03, z1: Z0 - n0, ya: Yc, yb: Yc + 2}); bx('brass', u0 + 0.1, u0 + 0.14, n0 + 0.02, n0 + 0.06, 1.6, 2.1); }
function tub(u0, u1, n0, n1) { bx('white', u0, u1, n0, n1, 0, 0.55, true); bx('water', u0 + 0.08, u1 - 0.08, n0 + 0.08, n1 - 0.08, 0.55, 0.56); }
function plant(u, n, s) { if (!HI) return; s = s || 1; cyl('clay', X0 + u, Z0 - n, Yc, Yc + 0.4 * s, 0.22 * s, 8); blob('green', X0 + u, Yc + 0.4 * s + 0.5 * s, Z0 - n, 0.5 * s, 6); }
function bookcase(u0, u1, n0, n1, h) { h = h || 2.2; bx('walnut', u0, u1, n0, n1, 0, h, true);
  if (HI) { const alongU = (u1 - u0) > (n1 - n0), len = alongU ? u1 - u0 : n1 - n0, fu = alongU ? (u0 + u1) / 2 : null; // book strips on the open face (the +u or +n side by default faces the room)
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { const a = 0.1 + (len - 0.2) * c / 4, b = a + (len - 0.2) / 4 - 0.04, y = 0.3 + r * 0.5, mm = (r + c) % 3 === 0 ? 'lapis' : (r + c) % 3 === 1 ? 'booka' : 'brass';
      if (alongU) bx(mm, u0 + a, u0 + b, n1, n1 + 0.02, y, y + 0.34); else bx(mm, u1, u1 + 0.02, n0 + a, n0 + b, y, y + 0.34); } } }
function lockers(u0, u1, n0, n1, alongU) { bx('lock', u0, u1, n0, n1, 0, 1.95, true); if (HI) { const len = alongU ? u1 - u0 : n1 - n0, cnt = Math.max(2, Math.round(len / 0.4));
  for (let i = 1; i < cnt; i++) { const t = i / cnt * len; if (alongU) bx('dark', u0 + t - 0.01, u0 + t + 0.01, n1, n1 + 0.015, 0, 1.95); else bx('dark', u1, u1 + 0.015, n0 + t - 0.01, n0 + t + 0.01, 0, 1.95); } } }
function art(u0, u1, n0, n1, y0, y1) { bx('frieze', u0, u1, n0, n1, y0, y1); }
function lampFloor(u, n) { if (!HI) return; bx('dark', u - 0.15, u + 0.15, n - 0.15, n + 0.15, 0, 0.04); bx('brass', u - 0.02, u + 0.02, n - 0.02, n + 0.02, 0.04, 1.5); bx('lamp', u - 0.14, u + 0.14, n - 0.14, n + 0.14, 1.5, 1.8); }
function liftDoorE(n0, n1) { bx('brass', 2.86, 2.9, n0, n1, 0, 2.3); bx('lapis', 2.86, 2.92, n0 - 0.12, n0, 0, 2.4); bx('lapis', 2.86, 2.92, n1, n1 + 0.12, 0, 2.4); bx('lapis', 2.86, 2.92, n0 - 0.12, n1 + 0.12, 2.3, 2.42); }
function liftDoorN(u0, u1) { bx('brass', u0, u1, 7.46, 7.5, 0, 2.3); bx('lapis', u0 - 0.12, u0, 7.46, 7.52, 0, 2.4); bx('lapis', u1, u1 + 0.12, 7.46, 7.52, 0, 2.4); bx('lapis', u0 - 0.12, u1 + 0.12, 7.46, 7.52, 2.3, 2.42); }
function fireStair(x0, x1, n0, n1) { for (let i = 0; i < (HI ? 8 : 4); i++) { const st = (HI ? 8 : 4); bx('stone2', x0 + 0.5 + i * 3.4 / st, x0 + 0.5 + (i + 1) * 3.4 / st, n0 + 0.5, n1 - 0.5, 0, 0.3 * (i + 1) * (8 / st)); } COL.push({x0: X0 + x0 + 0.4, x1: X0 + x0 + 4.0, z0: Z0 - n1 + 0.4, z1: Z0 - n0 - 0.4, ya: Yc, yb: Yc + 2.4}); }
function lamps(k) { for (const r of DATA[k].r) { const w = r[2] - r[1], d = r[4] - r[3]; if (w * d < 5 || /lift|stair|service|Risers|Butler/i.test(r[0] + r[5])) continue;
  const nu = Math.max(1, Math.round(w / 3.6)), nn = Math.max(1, Math.round(d / 3.6)); for (let i = 0; i < nu; i++) for (let j = 0; j < nn; j++) lamp(r[1] + w * (i + 0.5) / nu, r[3] + d * (j + 0.5) / nn, 0.8); } }

/* ---------- the five floors ---------- */
function L2() {
  // lift lobby + reception
  liftDoorE(3.5, 4.7); bx('walnut', 6.2, 7.3, 3.3, 5.0, 0, 1.05, true); bx('stone2', 6.15, 7.35, 3.25, 5.05, 1.05, 1.1); bx('brass', 6.12, 6.2, 3.3, 5.0, 0.6, 0.9);
  chair(6.7 - 1.05, 4.15, 'W', 'chair'); bx('screen', 6.6, 7.0, 3.6, 3.64, 1.15, 1.4); plant(3.3, 6.9); rug(3.2, 5.8, 3.6, 6.8, 'rug');
  art(7.395, 7.43, 3.5, 4.8, 1.4, 2.4);
  // client lounge
  const cl = [7.5, 14, 0.5, 7.4]; rug(8.5, 13.0, 1.0, 6.0, 'rug'); sofa(10.75, 5.35, 'S', 2.6); sofa(10.75, 1.55, 'N', 2.6); table(10.75, 3.45, 1.5, 0.75, 0.42, 'walnut'); sofa(8.5, 3.45, 'E', 1.0); sofa(13.0, 3.45, 'W', 1.0);
  plant(8.0, 6.9); plant(13.5, 6.9); plant(13.5, 1.0); lampFloor(8.0, 1.0); lampFloor(13.4, 5.6); art(13.9, 13.93, 2.0, 5.0, 1.3, 2.5); art(7.57, 7.6, 0.8, 3.0, 1.3, 2.4);
  bx('walnut', 9.2, 12.3, 6.7, 7.25, 0, 0.8, true); bx('stone2', 9.15, 12.35, 6.65, 7.3, 0.8, 0.85); // sideboard
  // pantry
  counter(16.9, 17.45, 0.7, 2.7); uppers(17.1, 17.45, 0.7, 2.7); fridge(16.2, 16.85, 0.55, 1.1); sink(17.2, 1.7); table(15.2, 1.7, 1.0, 0.8, 0.75); chair(15.2, 1.0, 'N'); chair(15.2, 2.4, 'S');
  // corridor decor
  plant(3.2, 8.4); plant(16.8, 8.4); art(12.0, 15.0, 7.47, 7.5, 1.4, 2.4);
  fireStair(0.5, 6.0, 0.5, 3.0); fireStair(14.0, 17.5, 2.9, 7.4);
  // four client suites
  for (let i = 0; i < 4; i++) { const x0 = [0.5, 4.75, 9, 13.25][i], x1 = x0 + 4.25, c = x0 + 2.1;
    bx('walnut', c - 1.0, c + 1.0, 15.2, 16.1, 0.72, 0.78, true); bx('walnut', c - 0.95, c - 0.85, 15.25, 16.05, 0, 0.72); bx('walnut', c + 0.85, c + 0.95, 15.25, 16.05, 0, 0.72); bx('stone2', c - 0.9, c + 0.9, 15.3, 15.9, 0.78, 0.79);
    bx('screen', c - 0.35, c + 0.35, 15.45, 15.5, 0.85, 1.3); chair(c, 16.75, 'S', 'chairb'); chair(c - 0.55, 14.2, 'N'); chair(c + 0.55, 14.2, 'N');
    sofa(x1 - 0.6, 12.2, 'W', 2.2); table(x1 - 1.75, 12.2, 0.55, 1.1, 0.42, 'walnut'); rug(x0 + 0.6, x1 - 0.3, 11.2, 13.4, 'rug');
    bookcase(x0 + 0.1, x0 + 0.5, 12.0, 14.6, 2.2); plant(x0 + 0.7, 10.2); lampFloor(x1 - 0.5, 10.3); art(x0 + 3.1, x0 + 4.0, 9.47, 9.5, 1.5, 2.4); }
}
function L3() {
  liftDoorE(3.5, 4.7); bx('walnut', 6.5, 7.35, 3.3, 4.6, 0, 0.9, true); bx('steel', 6.7, 7.2, 3.5, 4.4, 0.9, 1.15); plant(3.3, 6.9);
  // operations: 24 desks in 12 back-to-back pods
  for (const c of [11.2, 14.7]) for (let i = 0; i < 6; i++) { const u = 1.7 + 2 * i; workstation(u, c - 0.35, 'N'); workstation(u, c + 0.35, 'S'); if (HI) bx('dark', u - 0.7, u + 0.7, c - 0.02, c + 0.02, 0.76, 1.1); }
  plant(0.9, 17.0); plant(12.4, 17.0); art(8.6, 12.4, 9.47, 9.5, 1.5, 2.4);
  // meeting room (8)
  table(15.25, 11.45, 2.8, 1.1, 0.75, 'walnut'); for (let i = 0; i < 4; i++) { chair(14.0 + i * 0.85, 10.4, 'N'); chair(14.0 + i * 0.85, 12.5, 'S'); } bx('screen', 17.38, 17.44, 10.2, 12.7, 0.9, 2.1); rug(13.6, 17.1, 9.8, 13.1, 'rug');
  // focus rooms
  workstation(15.2, 14.2, 'N'); sofa(16.6, 16.4, 'W', 1.6); table(15.6, 16.4, 0.5, 0.5, 0.42); workstation(14.0, 16.9, 'S'); plant(17.0, 13.8);
  // risk, compliance & legal (behind the glass)
  for (let i = 0; i < 3; i++) workstation(8.4 + i * 1.8, 5.4, 'N');
  table(11.2, 2.4, 2.4, 1.0, 0.75, 'walnut'); for (let i = 0; i < 3; i++) { chair(10.4 + i * 0.8, 1.4, 'N'); chair(10.4 + i * 0.8, 3.4, 'S'); } chair(9.8, 2.4, 'E'); chair(12.6, 2.4, 'W');
  bx('lock', 7.6, 8.0, 0.7, 4.3, 0, 2.0, true); bx('lock', 13.5, 13.9, 3.0, 6.8, 0, 1.2, true); rug(9.4, 13.0, 0.9, 3.9, 'rug');
  bx('screen', 9.9, 12.5, 0.55, 0.6, 1.0, 2.0);
  // secure legal file room
  for (let i = 0; i < 3; i++) bx('lock', 14.4 + i * 1.0, 14.9 + i * 1.0, 0.8, 2.4, 0, 2.1, true); table(16.8, 2.0, 0.6, 1.2, 0.8);
  fireStair(0.5, 6.0, 0.5, 3.0); fireStair(14.0, 17.5, 2.9, 7.4);
  art(16.5, 17.4, 7.47, 7.5, 1.4, 2.4);
}
function L4() {
  liftDoorE(3.5, 4.7); plant(3.3, 6.9); art(7.395, 7.43, 3.5, 4.8, 1.4, 2.4);
  // executive support
  for (let i = 0; i < 3; i++) workstation(9.5, 1.8 + i * 1.7, 'E'); bx('walnut', 10.5, 10.95, 1.0, 6.4, 0, 0.8, true); bx('stone2', 10.45, 11.0, 0.95, 6.45, 0.8, 0.84); plant(8.1, 6.8);
  // quiet / nursing room
  rug(11.2, 13.8, 0.8, 3.8, 'rugs'); sofa(12.5, 1.2, 'N', 1.8, 'sofab'); sofa(11.5, 2.6, 'E', 0.9, 'sofab'); table(13.2, 2.8, 0.5, 0.5, 0.45); plant(13.6, 3.6); lampFloor(11.3, 3.6);
  // lockers
  lockers(11.1, 13.9, 7.2, 7.35, true); lockers(11.05, 11.2, 4.2, 7.1, false); bx('walnut', 12.0, 12.9, 5.0, 6.4, 0, 0.45, true);
  // showers + WC
  for (const u of [15.1, 16.3]) bx('white', u - 0.02, u + 0.02, 0.55, 2.0, 0, 1.9, true); shower(14.15, 15.05, 0.6, 1.5); shower(15.15, 16.25, 0.6, 1.5); wc(16.9, 1.2, 'W'); basin(16.9, 2.5, 'W');
  fireStair(0.5, 6.0, 0.5, 3.0); fireStair(14.0, 17.5, 2.9, 7.4);
  // staff kitchen + break room
  counter(0.8, 6.2, 16.85, 17.4); uppers(0.8, 6.2, 17.05, 17.4); hob(2.6, 17.1); sink(4.2, 17.1); fridge(5.4, 6.1, 16.2, 16.8);
  counter(1.8, 4.2, 14.9, 15.8); stool(2.4, 14.5); stool(3.0, 14.5); stool(3.6, 14.5);
  for (const u of [1.9, 4.9]) { table(u, 12.0, 1.3, 0.8, 0.75); chair(u - 0.35, 11.2, 'N'); chair(u + 0.35, 11.2, 'N'); chair(u - 0.35, 12.8, 'S'); chair(u + 0.35, 12.8, 'S'); }
  sofa(0.95, 14.5, 'E', 0.001 + 1.6, 'sofa'); plant(6.0, 10.1);
  // boardroom (16)
  rug(7.4, 16.6, 10.9, 16.0, 'rug'); table(12, 13.45, 7.6, 1.9, 0.76, 'walnut'); bx('stone2', 8.4, 15.6, 13.1, 13.8, 0.76, 0.78);
  for (let i = 0; i < 8; i++) { chair(8.6 + i * 0.9, 12.2, 'N', 'chairb'); chair(8.6 + i * 0.9, 14.7, 'S', 'chairb'); }
  bx('screen', 9.0, 15.0, 17.36, 17.44, 0.9, 3.1); bx('walnut', 8.6, 15.4, 16.6, 17.2, 0, 0.8, true); bx('stone2', 8.55, 15.45, 16.55, 17.25, 0.8, 0.84);
  plant(6.9, 17.0); plant(17.0, 10.0); lampFloor(7.0, 10.0);
}
function apt(x0, x1, n0, n1, mir) {
  const W = x1 - x0, bw = 2.4, bn = 2.6, bu0 = mir ? x1 - bw : x0, bu1 = bu0 + bw;
  // bathroom (3 walls + door)
  bx('lime', bu0 - 0.07, bu1 + 0.07, n0 + bn - 0.07, n0 + bn + 0.07, 0, CH, true);
  const wx = mir ? bu0 : bu1; bx('lime', wx - 0.07, wx + 0.07, n0, n0 + 0.5, 0, CH, true); bx('lime', wx - 0.07, wx + 0.07, n0 + 1.5, n0 + bn, 0, CH, true); bx('lime', wx - 0.07, wx + 0.07, n0 + 0.5, n0 + 1.5, 2.3, CH);
  const cu = mir ? bu1 - 0.5 : bu0 + 0.5; wc(cu, n0 + bn - 0.5, 'S'); basin(mir ? bu0 + 0.6 : bu1 - 0.6, n0 + 0.45, 'N'); shower(mir ? bu1 - 1.0 : bu0 + 0.02, mir ? bu1 - 0.02 : bu0 + 1.0, n0 + 0.08, n0 + 1.1);
  bx('white', bu0 + 0.03, bu1 - 0.03, n0 + 0.03, n0 + bn - 0.03, 0.005, 0.015);
  // kitchenette along the opposite wall
  const ku = mir ? x0 + 0.05 : x1 - 0.65; counter(ku, ku + 0.6, n0 + 0.6, n0 + 3.2); uppers(ku + (mir ? 0 : 0.25), ku + (mir ? 0.35 : 0.6), n0 + 0.6, n0 + 3.2); hob(ku + 0.3, n0 + 1.2); sink(ku + 0.3, n0 + 2.3); fridge(ku, ku + 0.65, n0 + 3.25, n0 + 3.85);
  stool(mir ? ku + 1.3 : ku - 0.7, n0 + 1.2); stool(mir ? ku + 1.3 : ku - 0.7, n0 + 2.0);
  // sitting
  const su = mir ? x0 + 0.6 : x0 + 0.6; sofa(su, n0 + 4.9, 'E', 2.0); table(su + 1.3, n0 + 4.9, 0.55, 1.0, 0.42); rug(su - 0.3, su + 2.1, n0 + 3.8, n0 + 6.0, 'rugs'); sofa(x1 - 0.9, n0 + 4.9, 'W', 0.9, 'sofab');
  // bed in the north half
  bed((x0 + x1) / 2, n1 - 1.3, 'S', 1.6, 2.0); rug((x0 + x1) / 2 - 1.2, (x0 + x1) / 2 + 1.2, n1 - 3.2, n1 - 0.4, 'rug'); bx('lapis', (x0 + x1) / 2 - 0.7, (x0 + x1) / 2 + 0.7, n1 - 2.6, n1 - 2.25, 0.15, 0.55);
  plant(mir ? x1 - 0.5 : x0 + 0.5, n1 - 0.6); if (x0 > 1) art(x0 + 0.07, x0 + 0.1, n0 + 4.0, n0 + 5.8, 1.4, 2.4);
}
function L5() {
  liftDoorN(1.0, 2.3); liftDoorE(3.5, 4.7);
  // vestibule + residents' lounge
  bx('walnut', 0.55, 1.0, 8.0, 9.2, 0, 0.85, true); bx('stone2', 0.5, 1.05, 7.95, 9.25, 0.85, 0.88); plant(2.4, 9.0);
  sofa(5.1, 6.75, 'S', 2.6); table(5.1, 5.5, 1.3, 0.7, 0.42); sofa(3.4, 4.5, 'E', 1.0); sofa(6.8, 4.5, 'W', 1.0); rug(3.6, 6.6, 4.0, 6.3, 'rug'); bookcase(7.05, 7.45, 3.5, 5.8, 2.2); plant(3.2, 3.4); lampFloor(7.1, 6.9);
  bx('screen', 3.0, 3.06, 4.0, 5.6, 1.0, 1.9);
  plant(16.8, 8.4); plant(8.0, 8.4);
  fireStair(0.5, 6.0, 0.5, 3.0); fireStair(14.0, 17.5, 2.9, 7.4);
  apt(0.5, 6.17, 9.4, 17.5, false); apt(6.17, 11.83, 9.4, 17.5, true); apt(11.83, 17.5, 9.4, 17.5, true);
  // apartment 4 + bed alcove
  const x0 = 7.5, n0 = 0.5;
  bx('lime', 7.43, 8.0, 3.03, 3.17, 0, CH, true); bx('lime', 8.9, 9.97, 3.03, 3.17, 0, CH, true); bx('lime', 8.0, 8.9, 3.03, 3.17, 2.3, CH);
  bx('lime', 9.83, 9.97, 0.5, 3.1, 0, CH, true);
  wc(9.4, 0.9, 'N'); basin(8.4, 0.75, 'N'); shower(8.0, 9.0, 1.5, 2.9);
  counter(7.55, 8.15, 4.0, 6.6); uppers(7.55, 7.9, 4.0, 6.6); hob(7.85, 4.9); sink(7.85, 5.9); fridge(7.55, 8.2, 6.65, 7.3); stool(8.9, 4.9); stool(8.9, 5.7);
  sofa(11.6, 6.7, 'S', 2.2); table(11.6, 5.45, 1.1, 0.55, 0.42); rug(10.2, 13.0, 4.7, 7.0, 'rugs'); sofa(13.3, 3.6, 'W', 1.0, 'sofab'); table(11.2, 2.4, 1.3, 0.8, 0.75); chair(10.6, 3.1, 'S'); chair(11.8, 3.1, 'S'); chair(11.2, 1.7, 'N'); plant(13.5, 6.9);
  bed(16.1, 1.7, 'W', 1.6, 2.0); rug(14.6, 16.9, 0.8, 2.6, 'rug'); plant(14.4, 0.9);
}
function L6() {
  liftDoorN(1.0, 2.3);
  // foyer + gallery
  bx('walnut', 0.55, 1.0, 8.0, 9.2, 0, 0.85, true); bx('stone2', 0.5, 1.05, 7.95, 9.25, 0.85, 0.88); bx('mirror', 0.5, 0.53, 8.1, 9.1, 1.2, 2.0); plant(2.4, 7.8);
  plant(17.0, 8.4); plant(3.4, 8.9); bx('lapis', 12.0, 14.0, 7.5, 7.9, 0, 0.45, true); art(9.4, 12.0, 7.47, 7.5, 1.4, 2.4); art(12.0, 12.9, 9.3, 9.33, 1.4, 2.4);
  // powder room + laundry
  wc(4.3, 3.5, 'S'); basin(3.3, 3.4, 'S'); bx('white', 3.0, 3.6, 5.4, 6.0, 0, 0.9, true); bx('white', 3.9, 4.5, 5.4, 6.0, 0, 0.9, true); counter(3.0, 4.6, 6.7, 7.3);
  // kitchen
  counter(4.85, 5.45, 3.1, 6.1); fridge(4.85, 5.5, 6.15, 6.85); hob(5.15, 4.3); sink(5.15, 5.4); counter(5.5, 7.4, 3.1, 3.65); uppers(5.5, 7.4, 3.1, 3.45);
  counter(6.0, 8.4, 4.7, 5.7); stool(6.5, 6.2); stool(7.2, 6.2); stool(7.9, 6.2); bx('brass', 5.9, 8.5, 4.65, 4.7, 0.5, 0.6);
  counter(7.55, 8.95, 0.6, 1.2); bx('walnut', 7.55, 8.95, 2.1, 2.8, 0, 1.8, true); // butler's pantry
  // dining (8)
  table(10.75, 3.9, 1.1, 3.4, 0.76, 'walnut'); for (let i = 0; i < 4; i++) { chair(9.9, 2.6 + i * 0.85, 'E'); chair(11.6, 2.6 + i * 0.85, 'W'); } chair(10.75, 1.9, 'N'); chair(10.75, 5.9, 'S'); rug(9.4, 12.1, 1.5, 6.3, 'rug');
  bx('walnut', 9.5, 12.0, 0.62, 1.1, 0, 0.85, true); bx('stone2', 9.45, 12.05, 0.58, 1.14, 0.85, 0.89); if (HI) bx('lamp', 10.2, 11.3, 3.2, 4.6, CH - 0.5, CH - 0.45);
  // study + desk bay
  bx('walnut', 14.0, 16.4, 0.9, 1.9, 0.72, 0.78, true); bx('walnut', 14.05, 14.15, 0.95, 1.85, 0, 0.72); bx('walnut', 16.25, 16.35, 0.95, 1.85, 0, 0.72); bx('screen', 14.9, 15.6, 1.4, 1.45, 0.85, 1.3); chair(15.2, 2.4, 'S', 'chairb');
  bookcase(17.0, 17.4, 0.6, 2.7, 2.2); bookcase(13.1, 13.5, 3.3, 5.0, 2.2); sofa(13.2, 6.3, 'N', 1.0, 'sofab'); lampFloor(12.8, 6.9); rug(13.5, 16.8, 0.8, 2.8, 'rug'); plant(17.0, 2.7);
  fireStair(14.0, 17.5, 2.9, 7.4);
  // living room
  rug(4.6, 9.4, 11.0, 15.6, 'rug'); sofa(7.0, 16.55, 'S', 3.0); sofa(7.0, 12.3, 'N', 2.4); table(7.0, 14.35, 1.7, 0.85, 0.42, 'walnut'); sofa(9.3, 14.3, 'W', 1.3, 'sofab'); sofa(4.7, 14.3, 'E', 1.3, 'sofab');
  bx('walnut', 9.6, 9.95, 12.6, 16.6, 0, 0.9, true); bx('screen', 9.9, 9.95, 13.2, 15.6, 1.1, 2.3); plant(4.0, 17.0); plant(9.4, 10.0); lampFloor(9.2, 17.0); lampFloor(4.0, 11.0);
  if (HI) { bx('lamp', 6.2, 7.8, 13.6, 15.1, CH - 0.5, CH - 0.45); }
  // loggia (west terrace)
  rug(0.9, 3.2, 12.4, 17.1, 'rugs'); const lg = FR(1.7, 13.3, 'E'); sofa(1.6, 13.0, 'W', 1.0); /* lounger pair */
  bx('brass', 0.65, 1.55, 14.2, 14.95, 0.0, 0.42, true); bx('linen', 0.65, 1.55, 14.2, 14.95, 0.42, 0.55); bx('brass', 0.65, 1.55, 15.5, 16.25, 0.0, 0.42, true); bx('linen', 0.65, 1.55, 15.5, 16.25, 0.42, 0.55);
  table(2.5, 15.1, 0.7, 0.7, 0.5, 'brass'); plant(3.1, 12.0, 1.2); plant(0.9, 17.2, 1.2); plant(3.1, 17.2, 1.2);
  // closet
  bx('walnut', 10.05, 10.5, 9.9, 12.4, 0, 2.3, true); bx('walnut', 12.5, 12.9, 9.5, 10.9, 0, 2.3, true); bx('walnut', 11.0, 12.2, 10.2, 11.2, 0, 0.95, true); bx('stone2', 10.95, 12.25, 10.15, 11.25, 0.95, 0.99); bx('mirror', 12.6, 12.64, 11.5, 12.4, 0.3, 2.0);
  // spa bath
  bx('white', 15.4, 17.2, 10.2, 11.2, 0, 0.6, true); bx('water', 15.5, 17.1, 10.3, 11.1, 0.6, 0.61); bx('brass', 15.2, 15.25, 10.6, 10.8, 0, 1.0); counter(13.4, 15.8, 9.5, 10.1); bx('mirror', 13.6, 15.6, 9.44, 9.48, 1.1, 2.1); shower(13.2, 14.3, 11.0, 12.4); wc(16.9, 12.0, 'S'); bx('lime', 16.4, 17.5, 11.7, 11.8, 0, 1.2, true);
  if (HI) { bx('lamp', 14.6, 15.8, 10.4, 11.0, CH - 0.2, CH - 0.17); }
  // master bedroom: king bed, star ceiling
  bed(13.9, 15.35, 'S', 1.9, 2.2); rug(11.6, 16.2, 13.0, 17.0, 'rug'); bx('lapis', 12.9, 14.9, 13.2, 13.65, 0.15, 0.5, true); sofa(10.9, 15.0, 'E', 1.0, 'sofab'); sofa(16.7, 14.0, 'W', 1.0, 'sofab'); table(16.8, 15.7, 0.5, 1.2, 0.8);
  bx('walnut', 17.0, 17.45, 13.0, 14.0, 0, 0.9, true); lampFloor(10.5, 13.0); plant(10.5, 17.0);
  spiral();
}
// private spiral stair L6 -> L7: 25 risers of 0.2 m round a column; the treads are small floors so you can walk it
const ST = {cu: 1.75, cn: 10.55, n: 25, rise: 0.2};
function spiral() {
  const cx = X0 + ST.cu, cz = Z0 - ST.cn, y0 = Yc, a0 = 270 * Math.PI / 180;
  cyl('brass', cx, cz, y0, y0 + 5.0, 0.15, 8, false);
  for (let i = 0; i < ST.n; i++) { const th = a0 + (i + 1) * 18 * Math.PI / 180, top = y0 + ST.rise * (i + 1), a = -th; // local CCW (u east, n north) -> world z flips
    const rr = 0.66, px = cx + Math.cos(th) * rr, pz = cz - Math.sin(th) * rr;
    rbox('walnut', cx + Math.cos(th) * 0.62, cz - Math.sin(th) * 0.62, 0.48, 0.2, a, top - 0.08, top);
    if (HI || i % 2 === 0) rbox('brass', cx + Math.cos(th) * 1.06, cz - Math.sin(th) * 1.06, 0.02, 0.19, a, top, top + 0.9 * 0 + 0.02);
    FLO.push({x0: px - 0.3, x1: px + 0.3, z0: pz - 0.3, z1: pz + 0.3, y: top, st: 1}); }
  COL.push({x0: cx - 0.2, x1: cx + 0.2, z0: cz - 0.2, z1: cz + 0.2, ya: y0, yb: y0 + 5});
  // outer handrail ring (visual) of low posts
  if (HI) for (let i = 0; i < 12; i++) { const a = i / 12 * 6.2832; cyl('brass', cx + Math.cos(a) * 1.12, cz + Math.sin(a) * 1.12, y0 + 5.0, y0 + 5.9, 0.02, 4, false); }
}

/* ---------- textures + materials (canvas, built only when the interiors are first needed) ---------- */
function cv(w, h, f) { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); return c; }
function rng(s) { let a = s | 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function TX(c, rep) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t; }
function mkTex() {
  const k = LITE ? 0.5 : 1, T = {};
  T.lime = TX(cv(512 * k, 512 * k, (g, w, h) => { const r = rng(3); g.fillStyle = '#e7dcc2'; g.fillRect(0, 0, w, h); for (let i = 0; i < 2600 * k; i++) { g.fillStyle = r() < 0.5 ? 'rgba(120,100,70,.06)' : 'rgba(255,250,235,.10)'; g.fillRect(r() * w, r() * h, 1 + r() * 4, 1 + r() * 2); }
    g.strokeStyle = 'rgba(130,110,80,.30)'; g.lineWidth = 2; for (let y = 0; y <= 4; y++) { g.beginPath(); g.moveTo(0, y * h / 4); g.lineTo(w, y * h / 4); g.stroke(); const off = (y % 2) * w / 4; for (let x = 0; x < 3; x++) { g.beginPath(); g.moveTo(off + x * w / 2, y * h / 4); g.lineTo(off + x * w / 2, (y + 1) * h / 4); g.stroke(); } } }));
  T.stone = TX(cv(512 * k, 512 * k, (g, w, h) => { const r = rng(7); for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) { const t = 218 + r() * 14; g.fillStyle = `rgb(${t},${t - 8},${t - 28})`; g.fillRect(a * w / 2, b * h / 2, w / 2, h / 2); }
    for (let i = 0; i < 2200 * k; i++) { g.fillStyle = r() < 0.5 ? 'rgba(110,90,60,.07)' : 'rgba(255,255,255,.12)'; g.fillRect(r() * w, r() * h, 1 + r() * 5, 1 + r() * 2); }
    g.strokeStyle = 'rgba(120,100,70,.55)'; g.lineWidth = 3; g.strokeRect(1, 1, w - 2, h - 2); g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke();
    g.strokeStyle = 'rgba(201,162,74,.65)'; g.lineWidth = 2; g.beginPath(); g.moveTo(w / 2 - 14, h / 2); g.lineTo(w / 2 + 14, h / 2); g.moveTo(w / 2, h / 2 - 14); g.lineTo(w / 2, h / 2 + 14); g.stroke(); }));
  T.wood = TX(cv(512 * k, 512 * k, (g, w, h) => { const r = rng(11), n = 12; for (let y = 0; y < n; y++) for (let x = 0; x < 3; x++) { const t = 0.8 + r() * 0.35; g.fillStyle = `rgb(${138 * t | 0},${98 * t | 0},${62 * t | 0})`; const off = (y % 2) * w / 6, px = ((x * w / 3 + off) % w); g.fillRect(px, y * h / n, w / 3 - 1, h / n - 1); if (px + w / 3 > w) g.fillRect(px - w, y * h / n, w / 3 - 1, h / n - 1); }
    for (let i = 0; i < 900 * k; i++) { g.fillStyle = 'rgba(60,35,15,.12)'; g.fillRect(r() * w, r() * h, 6 + r() * 20, 1); } }));
  T.walnut = TX(cv(256 * k + 64, 256 * k + 64, (g, w, h) => { const r = rng(5); g.fillStyle = '#5a3a22'; g.fillRect(0, 0, w, h); for (let i = 0; i < 160; i++) { g.strokeStyle = r() < 0.5 ? 'rgba(30,15,5,.25)' : 'rgba(150,100,60,.18)'; g.lineWidth = 1 + r() * 2; g.beginPath(); const y = r() * h; g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y + r() * 14 - 7, w * 0.6, y + r() * 14 - 7, w, y + r() * 8 - 4); g.stroke(); } }));
  T.carpet = TX(cv(128, 128, (g, w, h) => { const r = rng(9); g.fillStyle = '#46506a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 1400; i++) { const v = r() * 30 - 15; g.fillStyle = `rgba(${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${Math.abs(v) / 120})`; g.fillRect(r() * w, r() * h, 1, 1); } }));
  T.frieze = TX(cv(1024, 256, (g, w, h) => { g.fillStyle = '#1b3678'; g.fillRect(0, 0, w, h); g.fillStyle = '#c9a24a'; g.fillRect(0, 10, w, 8); g.fillRect(0, h - 18, w, 8); g.fillStyle = '#e8d9a8'; g.fillRect(0, 22, w, 3); g.fillRect(0, h - 25, w, 3);
    g.strokeStyle = '#e8c96a'; g.fillStyle = '#e8c96a'; g.lineWidth = 6; g.lineCap = 'round';
    const glyph = (i, x) => { const y = h / 2; g.beginPath(); switch (i % 6) {
      case 0: g.ellipse(x, y - 34, 18, 24, 0, 0, 6.3); g.moveTo(x, y - 10); g.lineTo(x, y + 52); g.moveTo(x - 24, y + 8); g.lineTo(x + 24, y + 8); break; // ankh
      case 1: g.ellipse(x, y, 40, 20, 0, 0, 6.3); g.moveTo(x - 40, y + 4); g.lineTo(x - 52, y + 36); g.moveTo(x, y + 20); g.lineTo(x + 20, y + 52); g.stroke(); g.beginPath(); g.arc(x, y, 9, 0, 6.3); g.fill(); break; // eye
      case 2: for (let j = -1; j <= 1; j++) { g.moveTo(x - 50, y + j * 26); g.quadraticCurveTo(x - 25, y + j * 26 - 16, x, y + j * 26); g.quadraticCurveTo(x + 25, y + j * 26 + 16, x + 50, y + j * 26); } break; // water
      case 3: g.moveTo(x, y + 50); g.lineTo(x, y - 40); g.moveTo(x, y - 10); g.quadraticCurveTo(x + 26, y - 30, x + 30, y - 52); g.moveTo(x, y + 6); g.quadraticCurveTo(x - 26, y - 14, x - 30, y - 36); break; // reed
      case 4: g.ellipse(x, y, 30, 38, 0, 0, 6.3); g.moveTo(x - 30, y - 8); g.lineTo(x - 52, y - 28); g.moveTo(x + 30, y - 8); g.lineTo(x + 52, y - 28); g.moveTo(x, y - 38); g.lineTo(x, y + 38); break; // scarab
      default: g.arc(x, y, 28, 0, 6.3); g.moveTo(x - 62, y + 2); g.lineTo(x - 28, y + 2); g.moveTo(x + 28, y + 2); g.lineTo(x + 62, y + 2); } g.stroke(); };
    for (let i = 0; i < 8; i++) glyph(i, 64 + i * 128); }));
  T.frieze.wrapT = THREE.ClampToEdgeWrapping;
  return T;
}
function mkMats(T) {
  const M = {}, C = THREE.Color;
  const L = (col, k, map, extra) => { const m = new THREE.MeshLambertMaterial(Object.assign({color: map ? 0xffffff : col}, extra || {})); if (map) { m.map = map; m.emissiveMap = map; m.emissive = new C(col).multiplyScalar(k); } else m.emissive = new C(col).multiplyScalar(k); return m; };
  M.lime = L(0xe7dcc2, 0.5, T.lime); M.stone = L(0xe0d6bc, 0.5, T.stone, {polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1}); M.wood = L(0xd8c4a8, 0.5, T.wood, {polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2});
  M.carpet = L(0xd0d6e6, 0.5, T.carpet, {polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2}); M.walnut = L(0xd0b090, 0.45, T.walnut);
  M.frieze = L(0xffffff, 0.55, T.frieze); M.stone2 = L(0xe8e2d2, 0.5); M.brass = L(0xc9a24a, 0.5); M.lapis = L(0x24418f, 0.5); M.linen = L(0xf2eadb, 0.5); M.sofa = L(0xc9b48a, 0.5); M.sofab = L(0x2d4a86, 0.5); M.cush = L(0xe9dfc6, 0.5);
  M.dark = L(0x2a2a2e, 0.4); M.screen = L(0x10151c, 0.5); M.screen.emissive = new C(0x1d3a5a); M.green = L(0x3f6b3a, 0.5); M.white = L(0xf4f2ea, 0.5); M.chair = L(0x3b3b44, 0.5); M.chairb = L(0x4a3426, 0.5);
  M.ceil = L(0xf1e8d2, 0.6, null, {side: THREE.DoubleSide}); M.lamp = new THREE.MeshBasicMaterial({color: 0xffe9bf, toneMapped: false}); M.mirror = L(0xcfe3ee, 0.8); M.steel = L(0xb9bec4, 0.45); M.lock = L(0x4a5a70, 0.5); M.clay = L(0xa05a3a, 0.5); M.booka = L(0x7a2f2a, 0.5);
  M.rug = L(0x1c2c58, 0.36, null, {polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4}); M.rugs = L(0xc8b48a, 0.5, null, {polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4}); M.water = L(0x6fb3c8, 0.7);
  M.glass = new THREE.MeshLambertMaterial({color: 0xb7d6e6, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide});
  let st = null; try { st = W3D.lib && W3D.lib.starCeilingTex ? W3D.lib.starCeilingTex() : null; } catch (e) { }
  M.stars = new THREE.MeshBasicMaterial({map: st, color: st ? 0xffffff : 0x0b1230, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3, toneMapped: false});
  return M;
}
function labelMesh() { // all door plaques in one mesh from a canvas atlas
  const names = [...new Set(LAB.map(l => l.t))], cols = 4, cw = 256, ch = 64, rows = Math.ceil(names.length / cols), c = cv(cw * cols, ch * Math.max(rows, 1), (g, w, h) => {
    g.fillStyle = '#17264f'; g.fillRect(0, 0, w, h); names.forEach((t, i) => { const x = (i % cols) * cw, y = Math.floor(i / cols) * ch; g.fillStyle = '#1b2f66'; g.fillRect(x + 2, y + 2, cw - 4, ch - 4); g.strokeStyle = '#c9a24a'; g.lineWidth = 3; g.strokeRect(x + 4, y + 4, cw - 8, ch - 8);
      let fs = 30; g.font = `bold ${fs}px Georgia`; while (g.measureText(t).width > cw - 24 && fs > 12) { fs -= 2; g.font = `bold ${fs}px Georgia`; } g.fillStyle = '#f3e6c0'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, x + cw / 2, y + ch / 2 + 2); }); });
  const tex = TX(c); tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; const P = [], N = [], U = [], I = [];
  for (const l of LAB) { const i = names.indexOf(l.t), u0 = (i % cols) / cols, u1 = u0 + 1 / cols, v1 = 1 - Math.floor(i / cols) / rows, v0 = v1 - 1 / rows, hw = l.w / 2, hh = hw * ch / cw * 0.5 + 0.0, k = P.length / 3;
    const ax = l.nz * hw, az = -l.nx * hw;
    P.push(l.x - ax, l.y - 0.15, l.z - az, l.x + ax, l.y - 0.15, l.z + az, l.x + ax, l.y + 0.15, l.z + az, l.x - ax, l.y + 0.15, l.z - az);
    for (let j = 0; j < 4; j++) N.push(l.nx, 0, l.nz); U.push(u0, v0, u1, v0, u1, v1, u0, v1); I.push(k, k + 1, k + 2, k, k + 2, k + 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setIndex(I);
  const m = new THREE.MeshBasicMaterial({map: tex, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4}); return new THREE.Mesh(g, m);
}

/* ---------- build, collision, panels, spots ---------- */
let grp = null, built = false, T0 = null, MT = null, genDone = false, panels = [], scene = null;
function generate() {
  if (genDone) return; genDone = true;
  const fns = {2: L2, 3: L3, 4: L4, 5: L5, 6: L6};
  for (let k = 2; k <= 6; k++) { curLevel = k; Yc = lvY(k); shell(k); fns[k](); lamps(k); }
  curLevel = 7; Yc = 64; // L7 link: guard rails round the stair opening in the office floor
  bx('brass', 0.55, 0.62, 9.4, 11.7, 0.95, 1.02); bx('brass', 0.55, 2.95, 11.62, 11.7, 0.95, 1.02); bx('brass', 0.55, 2.95, 9.4, 9.48, 0.95, 1.02);
  for (const [a, b, c, d] of [[0.55, 0.62, 9.4, 11.7], [0.55, 2.95, 11.62, 11.7], [0.55, 2.95, 9.4, 9.48]]) { bx('glass', a, b, c, d, 0.05, 0.95); COL.push({x0: X0 + a - 0.02, x1: X0 + b + 0.02, z0: Z0 - d - 0.02, z1: Z0 - c + 0.02, ya: 64, yb: 65}); }
  T0 = null;
}
function buildMeshes() {
  if (built) return; generate(); const T = mkTex(), M = mkMats(T); grp = new THREE.Group(); grp.name = 'bank-tower-interior';
  let tris = 0;
  for (const key of Object.keys(BIN)) { const B = bin(key), m = M[key]; if (!m || !B.i.length) continue;
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(B.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(B.n, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(B.u, 2)); g.setIndex(new THREE.Uint32BufferAttribute(B.i, 1));
    const me = new THREE.Mesh(g, m); me.name = 'bt-' + key; me.matrixAutoUpdate = false; me.frustumCulled = false; if (key === 'glass') me.renderOrder = 5; grp.add(me); tris += B.i.length / 3; }
  const lb = labelMesh(); lb.frustumCulled = false; grp.add(lb);
  W3D.root.add(grp); built = true; W3D.bankTower.tris = tris; MT = {T, M};
  addPanels();
}
function stats() { const per = {}; let t = 0; for (const k of Object.keys(BIN)) for (const l of Object.keys(BIN[k].lv)) { per[l] = (per[l] || 0) + BIN[k].lv[l]; t += BIN[k].lv[l]; } return {perLevel: per, total: t, lite: LITE, built, colliders: COL.length, labels: LAB.length}; }

// collision: per-floor walls and furniture + the tower's own outer walls (replaces the solid box's single collider)
function installCollision() {
  const W = W3D.lib.walls, i = W.findIndex(w => Math.abs(w.x0 - 967) < 0.01 && Math.abs(w.x1 - 985) < 0.01 && Math.abs(w.y1 - 63.6) < 0.06 && Math.abs(w.y0 - 34) < 0.06);
  if (i >= 0) W.splice(i, 1); else console.warn('banktower: solid tower collider not found');
  const PER = [{x0: 967, x1: 967.5, z0: -389, z1: -371}, {x0: 984.5, x1: 985, z0: -389, z1: -371}, {x0: 967, x1: 985, z0: -371.5, z1: -371}, {x0: 967, x1: 985, z0: -389, z1: -388.5}];
  generate();
  (W3D.bHooks = W3D.bHooks || []).push((x, z, y) => {
    if (x < 966.2 || x > 985.8 || z < -389.8 || z > -370.2 || y < 33.5 || y > 64.2) return false;
    const inside = x > 967.3 && x < 984.7 && z > -388.7 && z < -371.3;
    if (!inside) { for (const p of PER) if (x > p.x0 - 0.3 && x < p.x1 + 0.3 && z > p.z0 - 0.3 && z < p.z1 + 0.3 && 63.6 > y + 0.35) return true; return false; }
    for (const p of PER) if (x > p.x0 - 0.22 && x < p.x1 + 0.22 && z > p.z0 - 0.22 && z < p.z1 + 0.22) return true;
    for (const c of COL) if (x > c.x0 - 0.16 && x < c.x1 + 0.16 && z > c.z0 - 0.16 && z < c.z1 + 0.16 && c.yb > y + 0.35 && c.ya < y + 1.7) return true;
    return false; });
  const F = W3D.lib.floors; for (let k = 2; k <= 6; k++) F.push({x0: X0 + 0.5, x1: X0 + 17.5, z0: Z0 - 17.5, z1: Z0 - 0.5, y: lvY(k)});
  for (const f of FLO) F.push(f);
}
// the L7 office floor gets the stair opening (same marble, same inlay mapping)
function officeOpening() {
  const F = W3D.lib.floors, fi = F.findIndex(f => Math.abs(f.x0 - 967) < 0.01 && Math.abs(f.x1 - 985) < 0.01 && Math.abs(f.y - 64) < 0.01);
  if (fi >= 0) { F.splice(fi, 1); const H = {a: X0 + 0.55, b: X0 + 2.95, c: Z0 - 11.7, d: Z0 - 9.4};
    F.push({x0: 967, x1: 985, z0: -389, z1: H.c, y: 64}, {x0: 967, x1: 985, z0: H.d, z1: -371, y: 64}, {x0: 967, x1: H.a, z0: H.c, z1: H.d, y: 64}, {x0: H.b, x1: 985, z0: H.c, z1: H.d, y: 64}); }
  let mesh = null; W3D.root.traverse(o => { const p = o.geometry && o.geometry.parameters; if (!mesh && p && p.width === 18 && p.height === 0.4 && p.depth === 18 && Math.abs(o.position.x - 976) < 0.1 && Math.abs(o.position.y - 63.8) < 0.1) mesh = o; });
  if (!mesh) { console.warn('banktower: office floor mesh not found'); return; }
  // fit the top-face uv (u along x, v along z) from the original geometry
  const pos = mesh.geometry.attributes.position, uv = mesh.geometry.attributes.uv, nrm = mesh.geometry.attributes.normal, tp = [];
  for (let i = 0; i < pos.count; i++) if (nrm.getY(i) > 0.5) tp.push([pos.getX(i), pos.getZ(i), uv.getX(i), uv.getY(i)]);
  const lo = tp.reduce((a, b) => (b[0] + b[1] < a[0] + a[1] ? b : a)), hi = tp.reduce((a, b) => (b[0] + b[1] > a[0] + a[1] ? b : a));
  const su = (hi[2] - lo[2]) / (hi[0] - lo[0]), sv = (hi[3] - lo[3]) / (hi[1] - lo[1]), U = x => lo[2] + (x - lo[0]) * su, V = z => lo[3] + (z - lo[1]) * sv;
  const P = [], N = [], UU = [], I = []; const q = (a, b, c, d, n, ua) => { const k = P.length / 3; P.push(...a, ...b, ...c, ...d); for (let j = 0; j < 4; j++) N.push(...n); UU.push(...ua); I.push(k, k + 1, k + 2, k, k + 2, k + 3); };
  const slab = (x0, x1, z0, z1) => { const ya = 63.6, yb = 64, lx0 = x0 - 976, lx1 = x1 - 976, lz0 = z0 + 380, lz1 = z1 + 380;
    q([lx0, yb, lz1], [lx1, yb, lz1], [lx1, yb, lz0], [lx0, yb, lz0], [0, 1, 0], [U(x0), V(z1), U(x1), V(z1), U(x1), V(z0), U(x0), V(z0)]);
    q([lx1, ya, lz1], [lx1, ya, lz0], [lx1, yb, lz0], [lx1, yb, lz1], [1, 0, 0], [0, 0, 1, 0, 1, 1, 0, 1]); q([lx0, ya, lz0], [lx0, ya, lz1], [lx0, yb, lz1], [lx0, yb, lz0], [-1, 0, 0], [0, 0, 1, 0, 1, 1, 0, 1]);
    q([lx0, ya, lz1], [lx1, ya, lz1], [lx1, yb, lz1], [lx0, yb, lz1], [0, 0, 1], [0, 0, 1, 0, 1, 1, 0, 1]); q([lx1, ya, lz0], [lx0, ya, lz0], [lx0, yb, lz0], [lx1, yb, lz0], [0, 0, -1], [0, 0, 1, 0, 1, 1, 0, 1]); };
  const a = X0 + 0.55, b = X0 + 2.95, c = Z0 - 11.7, d = Z0 - 9.4; slab(967, 985, -389, c); slab(967, 985, d, -371); slab(967, a, c, d); slab(b, 985, c, d);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UU, 2)); g.setIndex(I);
  const nm = new THREE.Mesh(g, mesh.material); nm.position.set(976, 0, -380); nm.receiveShadow = true; nm.name = 'office-floor-with-stair-opening'; mesh.parent.add(nm); mesh.parent.remove(mesh);
}

/* lift floor selector: one canvas panel per level, clicks pick the row */
const ARR = {2: [4.4, 5.2, -90], 3: [4.4, 5.2, -90], 4: [4.4, 5.2, -90], 5: [1.8, 8.3, 90], 6: [1.8, 8.3, 90]};
const PPOS = {2: [7.36, 5.9, -90], 3: [7.36, 5.9, -90], 4: [7.36, 5.9, -90], 5: [0.64, 8.4, 90], 6: [0.64, 8.4, 90]};
function panelTex(cur) {
  const c = cv(256, 512, (g, w, h) => { g.fillStyle = '#12224a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#c9a24a'; g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8);
    g.fillStyle = '#e8c96a'; g.font = 'bold 34px Georgia'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('LIFT', w / 2, 34);
    for (let r = 0; r < 7; r++) { const lv = 7 - r, y = 64 + r * 64; if (lv === cur) { g.fillStyle = '#c9a24a'; g.fillRect(14, y + 4, w - 28, 56); } else { g.fillStyle = '#1d3370'; g.fillRect(14, y + 4, w - 28, 56); }
      g.fillStyle = lv === cur ? '#12224a' : '#f3e6c0'; g.font = 'bold 36px Georgia'; g.textAlign = 'left'; g.fillText('L' + lv, 28, y + 34); g.font = '21px Georgia'; g.fillText(LNAME[lv].replace(/^Josh's /, '').replace('Operations + compliance', 'Operations').replace('Boardroom + staff hub', 'Boardroom'), 92, y + 35); } });
  const t = TX(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
}
function makePanel(level, x, y, z, yaw) {
  const el = document.createElement('a-entity'); el.setAttribute('class', 'btn'); el.setAttribute('position', `${x} ${y} ${z}`); el.setAttribute('rotation', `0 ${yaw} 0`); el.dataset.btLevel = level;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.4), new THREE.MeshBasicMaterial({map: panelTex(level), toneMapped: false})); el.setObject3D('mesh', mesh);
  el.addEventListener('click', e => { const it = e.detail && e.detail.intersection; if (!it) return; const lp = mesh.worldToLocal(it.point.clone()), pix = (0.5 - lp.y / 1.4) * 512; if (pix < 64) return; const lv = 7 - Math.floor((pix - 64) / 64); if (lv >= 1 && lv <= 7) W3D.towerGo(lv); });
  scene.appendChild(el); return el;
}
function addPanels() { if (panels.some(p => p.dataset.btLevel > 1 && p.dataset.btLevel < 7)) return; for (let k = 2; k <= 6; k++) { const P = PPOS[k]; panels.push(makePanel(k, X0 + P[0], lvY(k) + 1.45, Z0 - P[1], P[2])); } }
function dropPanels() { panels = panels.filter(p => { const l = +p.dataset.btLevel; if (l > 1 && l < 7) { p.remove(); return false; } return true; }); }
W3D.towerGo = function (k) {
  k = Math.max(1, Math.min(7, k | 0)); if (!built) buildMeshes();
  if (k === 1) W3D.teleportTo(958, 34.3, -380, -90); else if (k === 7) W3D.teleportTo(972, 64, -378, 90);
  else { const a = ARR[k]; W3D.teleportTo(X0 + a[0], lvY(k) + 0.03, Z0 - a[1], a[2]); }
  window.JFVR && JFVR.hud && JFVR.hud('L' + k + ' - ' + LNAME[k]);
};
const SPOTS = {
  residence: () => { if (!built) buildMeshes(); W3D.teleportTo(X0 + 11.6, lvY(6) + 0.03, Z0 - 13.7, -50); window.JFVR && JFVR.hud && JFVR.hud("Josh's residence - master bedroom (L6)"); },
  guest: () => { if (!built) buildMeshes(); W3D.teleportTo(X0 + 3.8, lvY(5) + 0.03, Z0 - 12.6, 0); window.JFVR && JFVR.hud && JFVR.hud('Guest apartment 1 (L5)'); },
  tower: () => W3D.towerGo(2)
};
let tick = 0;
AFRAME.registerComponent('banktower-tick', { tick: function (t) {
  if (!W3D.active || t - tick < 400) return; tick = t; const cam = W3D._cam || (W3D._cam = document.querySelector('[camera]')); if (!cam) return;
  const p = cam.object3D.getWorldPosition(W3D._btv || (W3D._btv = new THREE.Vector3())), d = Math.hypot(p.x - 976, p.z + 380);
  if (d < 110) { if (!built) buildMeshes(); else if (!grp.visible) { grp.visible = true; addPanels(); } } else if (d > 160 && built && grp.visible) { grp.visible = false; dropPanels(); }
} });
function init() {
  if (!window.THREE || !window.AFRAME || !W3D.root || !W3D.lib || !W3D.liftOffice || !W3D.M || !document.querySelector('a-scene')) return setTimeout(init, 400);
  scene = document.querySelector('a-scene');
  W3D.bankTower = {go: W3D.towerGo, stats, tris: 0, LNAME};
  installCollision(); officeOpening();
  panels.push(makePanel(1, 964.18, 35.7, -377.0, -90), makePanel(7, 967.9, 65.45, -378.6, 90));
  const reg = () => { if (!W3D.spots) return setTimeout(reg, 50); Object.assign(W3D.spots, SPOTS); }; reg();
  scene.setAttribute('banktower-tick', '');
}
init();
})();
