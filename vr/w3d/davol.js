/* Davol Park pickleball, Taunton + the lighthouse lot, Raynham (Josh, Nov 27).
   - Davol Park (OSM way 1498833377, Oak St at Oak Ave, Taunton): the two court blocks (recreation_ground 1498833379 / 1498833386), six
     pickleball courts (pitch 1498833380-85, blue on a light surface, white lines, kitchen lines, nets), chain-link fence, the shelter
     (1498833378, dark roof) and the four small shuffleboard / bocce courts. One draw call + fence + net, ~1.5k tris, built < 700 m, dropped > 1100 m.
     Real Earth: cutout over the park while it's built. ?spot=davol-park = courtside.
   - ?spot=raynham-lighthouse: the Fowling Pond lighthouse (pharos.js, untouched) stands on the real cemetery office lot on East Britannia
     Street, Raynham (OSM building 215785164 is ~3 m from the tower's centre); lands you on the gallery and shows a board. */
(function () {
'use strict';
const W3D = window.W3D = window.W3D || {};
const DP = {x: -3425, z: 3620, lat: 41.896066, lon: -71.109269};
const BLOCKS = [[[-3462.8,3615.1],[-3460.0,3635.3],[-3429.4,3631.1],[-3432.1,3611.0]],[[-3422.5,3609.7],[-3419.8,3629.9],[-3389.2,3625.7],[-3391.9,3605.6]]];
const COURTS = [[[-3459.5,3618.6],[-3453.7,3618.0],[-3452.2,3630.5],[-3457.9,3631.2]],[[-3449.1,3617.2],[-3443.3,3616.5],[-3441.8,3629.1],[-3447.6,3629.8]],[[-3439.1,3615.6],[-3433.4,3614.9],[-3431.9,3627.5],[-3437.6,3628.2]],
  [[-3398.9,3610.2],[-3393.2,3609.5],[-3391.7,3622.1],[-3397.4,3622.8]],[[-3408.9,3611.8],[-3403.1,3611.1],[-3401.6,3623.7],[-3407.3,3624.4]],[[-3419.2,3613.3],[-3413.5,3612.6],[-3412.0,3625.2],[-3417.7,3625.8]]];
const SHELTER = [[-3435.5,3600.2],[-3434.4,3607.5],[-3428.2,3606.5],[-3421.4,3605.6],[-3422.4,3598.4]];
const SMALL = [[[-3418.1,3633.5],[-3414.0,3632.8],[-3411.0,3651.0],[-3415.1,3651.6]],[[-3412.3,3632.7],[-3408.2,3632.0],[-3405.3,3650.1],[-3409.4,3650.8]],[[-3428.8,3652.4],[-3425.5,3652.0],[-3427.8,3636.2],[-3431.1,3636.7]],[[-3433.6,3653.1],[-3430.3,3652.6],[-3432.6,3636.8],[-3435.9,3637.3]]];
W3D.keepOut = (W3D.keepOut || []).concat([{x: -3446, z: 3623, r: 22, name: 'Davol Park courts'}, {x: -3406, z: 3618, r: 22, name: 'Davol Park courts'}, {x: -3428, z: 3603, r: 9, name: 'Davol Park shelter'}, {x: -3421, z: 3643, r: 14, name: 'Davol Park small courts'}]);
const tH = (x, z) => { const y = W3D.terrainH ? W3D.terrainH(x, z) : (W3D.groundAt ? W3D.groundAt(x, z, 0) : 0); return isFinite(y) ? y : 0; };
const clip = m => { if (W3D.realEarth && W3D.realEarth.clipOurs) W3D.realEarth.clipOurs(m); return m; };
const L = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
function Geo() { this.p = []; this.c = []; }
Geo.prototype.tri = function (a, b, c, col) { this.p.push(...a, ...b, ...c); for (let i = 0; i < 3; i++) this.c.push(col.r, col.g, col.b); };
Geo.prototype.quad = function (a, b, c, d, col) { this.tri(a, b, c, col); this.tri(a, c, d, col); };
Geo.prototype.mesh = function (mat, name) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3)); g.computeVertexNormals(); const m = new THREE.Mesh(g, mat); m.name = name; return m; };
const C = h => new THREE.Color(h);
let site = null, cutAdded = false, Y0 = 0;
function flat(G, P, y, col) { const p = P.map(q => [q[0], y, q[1]]); for (let i = 1; i < p.length - 1; i++) G.tri(p[0], p[i + 1], p[i], col); }   // CCW from above in our frame (z south)
function strip(G, a, b, w, y, col) { const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, nx = -dz / l * w / 2, nz = dx / l * w / 2;
  G.quad([a[0] - nx, y, a[1] - nz], [a[0] + nx, y, a[1] + nz], [b[0] + nx, y, b[1] + nz], [b[0] - nx, y, b[1] - nz], col); }
function box(G, x, z, w, d, y0, h, col) { const a = [x - w, z - d], b = [x + w, z - d], c = [x + w, z + d], e = [x - w, z + d], P = [a, b, c, e];
  for (let i = 0; i < 4; i++) { const p = P[i], q = P[(i + 1) % 4]; G.quad([p[0], y0, p[1]], [q[0], y0, q[1]], [q[0], y0 + h, q[1]], [p[0], y0 + h, p[1]], col); } flat(G, P, y0 + h, col); }
function fenceTex() { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); g.strokeStyle = 'rgba(70,74,78,0.9)'; g.lineWidth = 2;
  for (let i = -64; i < 128; i += 16) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 64, 64); g.stroke(); g.beginPath(); g.moveTo(i + 64, 0); g.lineTo(i, 64); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; }
function build() {
  const all = BLOCKS.flat().concat(SHELTER, SMALL.flat()); Y0 = Math.max(...all.map(p => tH(p[0], p[1])));   // one level pad (never under the terrain)
  const G = new Geo(), Fp = [], Fu = [], Ni = [], Np = [];
  const base = C(0xc9ccc4), blue = C(0x2f6db3), green = C(0x3f8f5a), white = C(0xf4f4f0), post = C(0x2b2e31), tan = C(0xb8a58a), roof = C(0x2c3036), conc = C(0xbdb9ae);
  BLOCKS.forEach(B => { flat(G, B, Y0 + 0.06, base);   // light court surface + a low curb down to the ground
    B.forEach((p, i) => { const q = B[(i + 1) % 4]; G.quad([p[0], Y0 - 1.2, p[1]], [q[0], Y0 - 1.2, q[1]], [q[0], Y0 + 0.06, q[1]], [p[0], Y0 + 0.06, p[1]], conc);
      // fence: 3 m chain-link panel, posts every ~3 m, top rail
      const len = Math.hypot(q[0] - p[0], q[1] - p[1]), n = Math.max(1, Math.round(len / 3)); Fp.push(p[0], Y0 + 0.06, p[1], q[0], Y0 + 0.06, q[1], q[0], Y0 + 3.06, q[1], p[0], Y0 + 0.06, p[1], q[0], Y0 + 3.06, q[1], p[0], Y0 + 3.06, p[1]);
      Fu.push(0, 0, len / 1.2, 0, len / 1.2, 2.5, 0, 0, len / 1.2, 2.5, 0, 2.5);
      for (let k = 0; k <= n; k++) { const s = L(p, q, k / n); box(G, s[0], s[1], 0.04, 0.04, Y0 + 0.06, 3.0, post); }
      strip(G, p, q, 0.06, Y0 + 3.05, post); }); });
  COURTS.forEach(Q => { const [a, b, c, d] = Q; flat(G, Q, Y0 + 0.08, blue);   // a-b, c-d = baselines (short); b-c, d-a = sidelines
    const y = Y0 + 0.1, lw = 0.05; [[a, b], [b, c], [c, d], [d, a]].forEach(([p, q]) => strip(G, p, q, lw, y, white));
    const len = Math.hypot(c[0] - b[0], c[1] - b[1]), k = 2.13 / len;   // non-volley ("kitchen") lines 2.13 m each side of the net, centre lines baseline to kitchen
    const m1 = L(b, c, 0.5), m2 = L(a, d, 0.5);
    strip(G, L(b, c, 0.5 - k), L(a, d, 0.5 - k), lw, y, white); strip(G, L(b, c, 0.5 + k), L(a, d, 0.5 + k), lw, y, white);
    strip(G, L(a, b, 0.5), L(L(a, b, 0.5), L(d, c, 0.5), 0.5 - k), lw, y, white); strip(G, L(d, c, 0.5), L(L(a, b, 0.5), L(d, c, 0.5), 0.5 + k), lw, y, white);
    // net: posts just outside the sidelines, 0.91 m at the posts
    const ux = (m1[0] - m2[0]), uz = (m1[1] - m2[1]), ul = Math.hypot(ux, uz), ex = ux / ul * 0.3, ez = uz / ul * 0.3, P1 = [m1[0] + ex, m1[1] + ez], P2 = [m2[0] - ex, m2[1] - ez];
    box(G, P1[0], P1[1], 0.04, 0.04, Y0 + 0.08, 0.92, post); box(G, P2[0], P2[1], 0.04, 0.04, Y0 + 0.08, 0.92, post);
    Np.push(P1[0], Y0 + 0.12, P1[1], P2[0], Y0 + 0.12, P2[1], P2[0], Y0 + 0.92, P2[1], P1[0], Y0 + 0.12, P1[1], P2[0], Y0 + 0.92, P2[1], P1[0], Y0 + 0.92, P1[1]);
    strip(G, P1, P2, 0.05, Y0 + 0.93, white); });
  SMALL.forEach((Q, i) => { flat(G, Q, Y0 + 0.05, i < 2 ? green : C(0xc9b48a)); Q.forEach((p, j) => strip(G, p, Q[(j + 1) % 4], 0.08, Y0 + 0.07, i < 2 ? white : C(0x7a5c3a))); });
  // shelter: walls 2.8 m, dark low hip roof with overhang
  { const S = SHELTER, cx = S.reduce((s, p) => s + p[0], 0) / S.length, cz = S.reduce((s, p) => s + p[1], 0) / S.length, h = 2.8;
    flat(G, S, Y0 + 0.04, conc);
    S.forEach((p, i) => { const q = S[(i + 1) % S.length]; G.quad([p[0], Y0 - 1, p[1]], [q[0], Y0 - 1, q[1]], [q[0], Y0 + h, q[1]], [p[0], Y0 + h, p[1]], tan); });
    const O = S.map(p => [cx + (p[0] - cx) * 1.12, cz + (p[1] - cz) * 1.12]), top = [cx, Y0 + h + 1.4, cz];
    O.forEach((p, i) => { const q = O[(i + 1) % O.length]; G.tri([p[0], Y0 + h, p[1]], top, [q[0], Y0 + h, q[1]], roof); G.tri([p[0], Y0 + h, p[1]], [q[0], Y0 + h, q[1]], top, roof); }); }
  const grp = new THREE.Group(); grp.name = 'davol-courts';
  grp.add(G.mesh(clip(new THREE.MeshLambertMaterial({vertexColors: true, side: THREE.DoubleSide})), 'houses-davol-courts'));
  const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(Fp, 3)); fg.setAttribute('uv', new THREE.Float32BufferAttribute(Fu, 2)); fg.computeVertexNormals();
  const fm = new THREE.Mesh(fg, clip(new THREE.MeshLambertMaterial({map: fenceTex(), transparent: true, alphaTest: 0.3, side: THREE.DoubleSide}))); fm.name = 'houses-davol-fence'; grp.add(fm);
  const ng = new THREE.BufferGeometry(); ng.setAttribute('position', new THREE.Float32BufferAttribute(Np, 3)); ng.computeVertexNormals();
  const nm = new THREE.Mesh(ng, clip(new THREE.MeshBasicMaterial({color: 0x15181b, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false}))); nm.name = 'houses-davol-nets'; grp.add(nm);
  let tris = 0; grp.traverse(o => { if (o.isMesh) tris += o.geometry.attributes.position.count / 3; }); grp.userData.tris = tris;
  grp.userData.cleared = clearTrees(); return grp; }
function clearTrees() { let n = 0; const areas = BLOCKS.concat([SHELTER], SMALL);
  const near = (x, z) => areas.some(P => { const cx = P.reduce((s, p) => s + p[0], 0) / P.length, cz = P.reduce((s, p) => s + p[1], 0) / P.length, r = Math.max(...P.map(p => Math.hypot(p[0] - cx, p[1] - cz))) + 3; return Math.hypot(x - cx, z - cz) < r; });
  for (const im of (W3D.root ? W3D.root.children : [])) { if (!im.isInstancedMesh || im.count < 200) continue; const e = im.instanceMatrix.array; let ch = false;
    for (let i = 0; i < im.count; i++) { const o = i * 16, x = e[o + 12], z = e[o + 14]; if (Math.abs(x - DP.x) > 70 || Math.abs(z - DP.z) > 70 || (e[o] === 0 && e[o + 5] === 0)) continue;
      if (near(x, z)) { e[o] = e[o + 1] = e[o + 2] = e[o + 4] = e[o + 5] = e[o + 6] = e[o + 8] = e[o + 9] = e[o + 10] = 0; ch = true; n++; } }
    if (ch) im.instanceMatrix.needsUpdate = true; }
  return n; }
function dispose(g) { g.traverse(o => { if (o.isMesh) { o.geometry.dispose(); if (o.material.map) o.material.map.dispose(); o.material.dispose(); } }); }
// ---------- boards (canvas, in front of you on arrival) ----------
let board = null;
function wrap(g, t, w) { const out = []; let line = ''; t.split(' ').forEach(wd => { const n = line ? line + ' ' + wd : wd; if (g.measureText(n).width > w && line) { out.push(line); line = wd; } else line = n; }); if (line) out.push(line); return out; }
function showBoard(title, lines, foot, dist, dy, left) { left = left || 0; if (board) { board.parent && board.parent.remove(board); dispose(board); board = null; }
  const sc = document.querySelector('a-scene'); if (!sc || !sc.camera) return;
  const c = document.createElement('canvas'); c.width = 1024; c.height = 640; const g = c.getContext('2d');
  g.fillStyle = 'rgba(12,30,40,0.92)'; g.fillRect(0, 0, 1024, 640); g.strokeStyle = '#c9a24a'; g.lineWidth = 8; g.strokeRect(10, 10, 1004, 620);
  g.fillStyle = '#ffe08a'; g.font = 'bold 42px system-ui, sans-serif'; g.fillText(title, 40, 70); g.fillStyle = '#eef4f6'; g.font = '26px system-ui, sans-serif'; let y = 116;
  lines.forEach(l => { wrap(g, l, 944).forEach(r => { if (y < 590) g.fillText(r, 40, y); y += 32; }); y += 8; }); g.fillStyle = '#9fb4bd'; g.font = '20px system-ui, sans-serif'; g.fillText(foot, 40, 616);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  board = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.12), new THREE.MeshBasicMaterial({map: t, fog: false, toneMapped: false, side: THREE.DoubleSide})); board.name = 'davol-board';
  const cam = sc.camera, p = cam.getWorldPosition(new THREE.Vector3()), f = new THREE.Vector3(); cam.getWorldDirection(f); f.y = 0; if (f.lengthSq() < 1e-6) f.set(0, 0, -1); f.normalize();
  board.position.set(p.x + f.x * dist + f.z * left, p.y + dy, p.z + f.z * dist - f.x * left); board.lookAt(p.x, p.y + dy, p.z); sc.object3D.add(board); }
setInterval(() => { if (!board) return; const sc = document.querySelector('a-scene'); if (!sc || !sc.camera) return; const v = sc.camera.getWorldPosition(new THREE.Vector3());
  if (v.distanceTo(board.position) > 120) { board.parent && board.parent.remove(board); dispose(board); board = null; } }, 2000);
const level = () => { const sc = document.querySelector('a-scene'), lc = document.querySelector('[camera]') && document.querySelector('[camera]').components['look-controls']; if (lc && sc && !sc.is('vr-mode')) { lc.pitchObject.rotation.x = -0.05; lc.yawObject.rotation.y = 0; } };
const SP = {
  'davol-park': () => { const go = () => { W3D.teleportTo(-3422, (site ? Y0 + 0.1 : undefined), 3642, 0); level(); setTimeout(() => { level(); showBoard('Davol Park, Taunton', ['A neighborhood park at Oak Street and Oak Avenue: six pickleball courts in two fenced blocks of three,',
      'shuffleboard and bocce courts, outdoor fitness stations, gardens, a dog park and a small shelter.'], 'Davol Park pickleball  -  built from OpenStreetMap', 4.5, -0.45, 2.3); }, 900); };
    go(); setTimeout(() => { if (site) W3D.teleportTo(-3422, Y0 + 0.1, 3642, 0); }, 1500); },
  'raynham-lighthouse': () => { if (W3D.spots.pharos) W3D.spots.pharos(); setTimeout(() => showBoard('The lighthouse, Raynham', [
      'In the real world the Fowling Pond lighthouse stands on Raynham parcel 10A-16-0 (0 East Britannia St), about 60 m on the Raynham side of the town line (U.S. Census TIGER 2024). St. Joseph Cemetery across the street straddles the line: its East Britannia frontage is in Raynham; the office at 475 East Britannia St and most of the grounds are in Taunton.',
      "Raynham side: St. Ann's Parish, 675 North Main St, pastor Fr. Matthew Laird. Taunton side (nearest parish; territory not published): Taunton Catholic North — St. Jude the Apostle (249 Whittenton St) and St. Anthony (126 School St), pastor Fr. Bill Rodrigues.",
      'The lot is owned by the Roman Catholic Bishop of Fall River, a corporation sole, not by a parish. St. Joseph Cemetery is run by Diocese of Fall River Catholic Cemeteries (director David Raposa). Parishes can offer pastoral support; they cannot sell or lease the lot.'
    ], 'On the Raynham–Taunton line, Bristol County, Massachusetts', 4.6, -0.15, 1.15), 1800); }
};
SP.davol = SP['davol-park']; SP['davol-pickleball'] = SP['davol-park']; SP.lighthouse = SP['raynham-lighthouse'];
(function reg() { if (!W3D.spots) return setTimeout(reg, 300); Object.assign(W3D.spots, SP); })();
function menus() { const ui = document.getElementById('jf-inbox') || document.querySelector('#ui .tools'), bar = document.getElementById('vrbar');
  const b2 = (w, label) => { if (!ui || document.querySelector('#ui button[data-w="' + w + '"]')) return; const b = document.createElement('button'); b.dataset.w = w; b.textContent = label; b.addEventListener('click', e => { e.stopPropagation(); if (window.goWorld) window.goWorld(w); }); ui.appendChild(b); };
  const bv = (id, w, label) => { if (!bar || document.getElementById(id)) return; const p = document.createElement('a-plane'); p.id = id; p.className = 'btn'; p.dataset.w = w; p.setAttribute('width', 1.3); p.setAttribute('height', 0.26); p.setAttribute('material', 'shader:flat;color:#FFD700');
    const t = document.createElement('a-text'); t.setAttribute('value', label); t.setAttribute('align', 'center'); t.setAttribute('color', '#111'); t.setAttribute('width', 2.0); t.setAttribute('position', '0 0 0.005'); p.appendChild(t);
    p.addEventListener('click', () => { if (window.goWorld) window.goWorld(w); }); bar.appendChild(p); };
  b2('raynham-lighthouse', 'Lighthouse (Raynham)'); b2('davol-park', 'Davol Park pickleball (Taunton)');
  bv('lighthousevr', 'raynham-lighthouse', 'Lighthouse (Raynham)'); bv('davolvr', 'davol-park', 'Davol Park pickleball'); }
const iv = setInterval(() => { if (document.getElementById('jf-inbox') && document.getElementById('vrbar')) { menus(); clearInterval(iv); } }, 700); setTimeout(() => clearInterval(iv), 120000);
// ---------- lazy build ----------
AFRAME.registerComponent('w3d-davol', { tick: function (t) { if ((this.t || 0) > t - 500) return; this.t = t; const sc = this.el; if (!sc.camera || !W3D.root) return;
  if (!W3D.active) { if (site) site.visible = false; return; }
  const v = sc.camera.getWorldPosition(new THREE.Vector3()), d = Math.hypot(v.x - DP.x, v.z - DP.z);
  if (!site && d < 700) { if (!cutAdded && W3D.realEarth && W3D.realEarth.addCut) { cutAdded = true; W3D.realEarth.addCut({lat: DP.lat, lon: DP.lon, half: 48, need: /^davol-courts$/}); }
    site = build(); W3D.root.add(site); console.log('davol: courts built, ' + site.userData.tris + ' tris, ' + site.userData.cleared + ' trees cleared'); }
  else if (site && d > 1100) { W3D.root.remove(site); dispose(site); site = null; }
  if (site) site.visible = true; } });
(function attach() { const sc = document.querySelector('a-scene'); if (!sc) return setTimeout(attach, 300); sc.setAttribute('w3d-davol', ''); })();
W3D.davol = {stats: () => ({built: !!site, tris: site ? site.userData.tris : 0, cleared: site ? site.userData.cleared : 0, y0: Y0, board: board ? board.name : null})};
})();
