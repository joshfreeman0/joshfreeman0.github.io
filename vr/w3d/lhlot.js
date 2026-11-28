/* Lighthouse lot surroundings, East Britannia St, Raynham (Josh's night photos, Nov 27 2026) - low-poly but real-looking.
   Towns (Census TIGER, checked Nov 27): the lot and the cemetery's East Britannia frontage are in Raynham; most of St. Joseph Cemetery
   and its Broadway side are in Taunton (the town line crosses the cemetery).
   St. Joseph Cemetery's front lawn across the street (OSM way 152807429) with rows of white / grey headstones (instanced, unnamed),
   the huge spreading bare tree by the road, the flagpole + US flag by a low stone wall, white roadside posts; on the lot: chain-link
   fence with a double gate at the drive (OSM 770100558), asphalt yard, a power pole with wires, bare trees and a pine.
   The lighthouse is untouched. The lot's garage-office (OSM 215785170) sits under the lighthouse deck in our world, so it isn't drawn.
   Everything clips like our other late builds: with Real Earth on, Google's real 3D tiles show instead outside the lighthouse
   cutout; with Real Earth off (phones / ?realearth=0) or while tiles load, this is what you see. Built < 600 m, dropped > 900 m. */
(function () {
'use strict';
const W3D = window.W3D = window.W3D || {};
const LITE = !!window.JFVR_LITE, C0 = {x: -930, z: 640};
const G = {"cem":[[-887.6,630.5],[-916.7,626.7],[-949.1,629.1],[-952.5,631.3],[-957.2,653.4],[-965.0,653.1],[-967.4,640.0],[-972.4,634.1],[-1034.7,650.3],[-1035.5,804.2],[-1034.7,854.2],[-1065.8,890.9],[-1143.2,894.2],[-1135.9,1042.5],[-1105.9,1043.3],[-1088.8,1050.3],[-1073.4,1059.0],[-1068.2,1072.4],[-1093.7,1111.8],[-1079.9,1120.2],[-1070.5,1124.4],[-957.2,1120.8],[-863.5,1138.8],[-860.2,1136.4],[-851.5,1136.2],[-840.5,1141.1],[-839.8,1144.7],[-789.0,1159.0],[-768.7,1158.0],[-778.2,1032.4],[-783.6,798.1],[-770.4,798.3],[-747.3,793.0],[-705.9,782.6],[-698.8,770.8],[-703.3,754.0],[-719.3,740.5],[-738.9,724.5],[-745.5,714.1],[-742.2,688.8],[-740.4,677.7],[-744.0,666.2],[-748.6,660.4],[-752.0,657.3],[-785.5,660.7],[-815.6,657.0],[-822.6,657.1],[-824.4,652.7],[-887.6,630.5]],"st":[[-962.7,626.2],[-951.0,625.1],[-944.8,624.6],[-922.5,623.6],[-911.6,623.5],[-903.1,624.2],[-886.0,626.6],[-858.4,636.2]]};
const tH = (x, z) => { const y = W3D.terrainH ? W3D.terrainH(x, z) : 0; return isFinite(y) ? y : 0; };
const clip = m => { if (W3D.realEarth && W3D.realEarth.clipOurs) W3D.realEarth.clipOurs(m); return m; };
const inPoly = (L, x, z) => { let c = false; for (let i = 0, j = L.length - 1; i < L.length; j = i++) { const a = L[i], b = L[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
const stZ = x => { const S = G.st; for (let i = 1; i < S.length; i++) if (x <= S[i][0]) { const a = S[i - 1], b = S[i], t = (x - a[0]) / (b[0] - a[0]); return a[1] + (b[1] - a[1]) * t; } return S[S.length - 1][1]; };
let rs = 1; const rnd = () => { rs = (rs * 16807) % 2147483647; return rs / 2147483647; };
function merge(list) { const p = [], c = []; list.forEach(([g, col]) => { g = g.index ? g.toNonIndexed() : g; const a = g.attributes.position.array; for (let i = 0; i < a.length; i += 3) { p.push(a[i], a[i + 1], a[i + 2]); c.push(col.r, col.g, col.b); } });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3)); g.computeVertexNormals(); return g; }
const col = h => new THREE.Color(h);
function cyl(r0, r1, h, x, y, z, rx, rz, seg) { const g = new THREE.CylinderGeometry(r1, r0, h, seg || 6, 1); g.translate(0, h / 2, 0); if (rx || rz) { g.rotateX(rx || 0); g.rotateZ(rz || 0); } g.translate(x, y, z); return g; }
function bareTree(L, x, z, H, spread, bark) { const y = tH(x, z); rs = Math.floor(Math.abs(x * 31 + z * 17)) + 7;
  const br = (px, py, pz, dx, dy, dz, len, r, d) => { const g = new THREE.CylinderGeometry(r * 0.62, r, len, d > 1 ? 5 : 3, 1, true); g.translate(0, len / 2, 0);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx, dy, dz).normalize()); g.applyQuaternion(q); g.translate(px, py, pz); L.push([g, bark]);
    if (d <= 0 || r < 0.025) return; const ex = px + dx * len, ey = py + dy * len, ez = pz + dz * len, n = d > 3 ? 4 : d > 1 ? 3 : 2;
    for (let k = 0; k < n; k++) { const a = rnd() * 6.283, s = spread * (0.5 + rnd() * 0.6); br(ex, ey, ez, dx * 0.5 + Math.cos(a) * s, dy * 0.55 + 0.25, dz * 0.5 + Math.sin(a) * s, len * (0.62 + rnd() * 0.18), r * 0.6, d - 1); } };
  br(x, y, z, 0, 1, 0, H * 0.24, H * 0.04, LITE ? 3 : H >= 20 ? 5 : 3); }
function build() { const L = [], wire = [], stone = col(0x8f8b84), bark = col(0x4a4440), barkL = col(0x6e6862);
  // cemetery lawn edge posts (white) along the street side
  for (let x = -948; x < -890; x += 5) { const z = stZ(x) + 5.5, y = tH(x, z); L.push([cyl(0.09, 0.09, 0.9, x, y, z, 0, 0, 4), col(0xf2f2ee)]); }
  // low stone wall + flagpole by the frontage
  { const x0 = -936, x1 = -918; for (let x = x0; x < x1; x += 1.5) { const z = stZ(x) + 8, y = tH(x, z); const g = new THREE.BoxGeometry(1.5, 0.75, 0.55); g.translate(x + 0.75, y + 0.37, z); L.push([g, stone]); }
    const fx = -927, fz = stZ(-927) + 10, fy = tH(fx, fz); L.push([cyl(0.09, 0.05, 11, fx, fy, fz, 0, 0, 6), col(0xd8d8d8)]); W3D._lhFlag = [fx, fy + 10.2, fz]; }
  // the huge spreading bare tree (beech-like) on the lawn + a few more bare trees and a pine on the lot side
  bareTree(L, -905, stZ(-905) + 22, 22, 1.25, barkL); bareTree(L, -975, 668, 15, 0.9, bark); bareTree(L, -960, 606, 13, 0.8, bark); bareTree(L, -912, 607, 12, 0.8, bark);
  { const px = -918, pz = 612, py = tH(px, pz); L.push([cyl(0.25, 0.15, 6, px, py, pz, 0, 0, 5), bark]); for (let k = 0; k < 4; k++) { const g = new THREE.ConeGeometry(3.2 - k * 0.6, 4, 7); g.translate(px, py + 5 + k * 2.4, pz); L.push([g, col(0x23402c)]); } }
  // Broadway entrance (Josh's ref-11; approx. on the cemetery's west edge by Broadway): tall flagpole, low fieldstone wall, white sign,
  // weeping willow, a statue on a plinth, wood bollards along the grass edge
  { const ex = -1031, ez = 722, ey = tH(ex, ez);
    for (let z = ez - 14; z < ez + 14; z += 1.2) { if (Math.abs(z - ez) < 4) continue; const g = new THREE.BoxGeometry(0.6, 0.65 + rnd() * 0.15, 1.2); g.translate(ex + 2, tH(ex + 2, z) + 0.33, z); L.push([g, rnd() < 0.5 ? col(0x7d756b) : col(0x958b7e)]); }
    for (let z = ez - 40; z < ez + 40; z += 3) { if (Math.abs(z - ez) < 5) continue; L.push([cyl(0.13, 0.13, 0.8, ex - 1, tH(ex - 1, z), z, 0, 0, 6), col(0x6b5038)]); }
    L.push([cyl(0.12, 0.06, 14, ex + 5, ey, ez + 7, 0, 0, 6), col(0xdedede)]); W3D._lhFlag2 = [ex + 5, ey + 13.2, ez + 7];
    { const g = new THREE.BoxGeometry(0.1, 1.0, 1.6); g.translate(ex + 4, ey + 1.1, ez + 4); L.push([g, col(0xf4f4f0)]); L.push([cyl(0.04, 0.04, 0.7, ex + 4, ey, ez + 3.4, 0, 0, 4), col(0xf4f4f0)]); L.push([cyl(0.04, 0.04, 0.7, ex + 4, ey, ez + 4.6, 0, 0, 4), col(0xf4f4f0)]); }
    { const g = new THREE.BoxGeometry(1.2, 1.4, 1.2); g.translate(ex + 6, ey + 0.7, ez - 9); L.push([g, col(0xa29a8e)]); L.push([cyl(0.35, 0.25, 1.9, ex + 6, ey + 1.4, ez - 9, 0, 0, 8), col(0xd8d4cc)]); const h = new THREE.SphereGeometry(0.22, 8, 6); h.translate(ex + 6, ey + 3.5, ez - 9); L.push([h, col(0xd8d4cc)]); }
    { const wx = ex + 12, wz = ez + 14, wy = tH(wx, wz); L.push([cyl(0.35, 0.22, 3.2, wx, wy, wz, 0, 0, 6), bark]);
      for (let k = 0; k < (LITE ? 14 : 30); k++) { const a = k / (LITE ? 14 : 30) * 6.283, r = 3.4 + rnd() * 1.2, g = new THREE.PlaneGeometry(1.3, 4.2 + rnd() * 1.5); g.translate(0, -2.1, 0); g.rotateY(-a); g.translate(wx + Math.cos(a) * r, wy + 6.4, wz + Math.sin(a) * r); L.push([g, rnd() < 0.5 ? col(0x9a9a3c) : col(0x7d8436)]); }
      const cap = new THREE.SphereGeometry(4.4, 10, 6, 0, 6.283, 0, 1.2); cap.translate(wx, wy + 3.2, wz); L.push([cap, col(0x868a3a)]); } }
  // power pole + wires along the lot frontage
  const poles = [[-985, stZ(-985) - 5], [-950, stZ(-950) - 5], [-912, stZ(-912) - 5], [-874, stZ(-874) - 6]];
  poles.forEach(([x, z]) => { const y = tH(x, z); L.push([cyl(0.16, 0.12, 11, x, y, z, 0, 0, 6), col(0x5b4a3a)]); const g = new THREE.BoxGeometry(2.2, 0.14, 0.14); g.translate(x, y + 10.2, z); L.push([g, col(0x4a3c30)]); });
  for (let i = 1; i < poles.length; i++) for (const o of [-0.9, 0, 0.9]) { const a = poles[i - 1], b = poles[i], ya = tH(a[0], a[1]) + 10.3, yb = tH(b[0], b[1]) + 10.3;
    for (let k = 0; k < 8; k++) { const t0 = k / 8, t1 = (k + 1) / 8, sag = t => -1.1 * 4 * t * (1 - t); wire.push(a[0] + o + (b[0] - a[0]) * t0, ya + (yb - ya) * t0 + sag(t0), a[1] + (b[1] - a[1]) * t0, a[0] + o + (b[0] - a[0]) * t1, ya + (yb - ya) * t1 + sag(t1), a[1] + (b[1] - a[1]) * t1); } }
  // chain-link fence along the lot frontage with a double gate at the drive (x ~ -951)
  const fence = []; { const zf = x => stZ(x) - 3.2; const posts = []; for (let x = -978; x <= -896; x += 3) posts.push(x);
    posts.forEach(x => { const z = zf(x), y = tH(x, z); L.push([cyl(0.04, 0.04, 1.9, x, y, z, 0, 0, 5), col(0x9aa0a4)]); });
    for (let i = 1; i < posts.length; i++) { const xa = posts[i - 1], xb = posts[i]; if (xa < -948 && xb > -955) continue; const za = zf(xa), zb = zf(xb), ya = tH(xa, za), yb = tH(xb, zb);
      fence.push(xa, ya + 0.05, za, xb, yb + 0.05, zb, xb, yb + 1.85, zb, xa, ya + 0.05, za, xb, yb + 1.85, zb, xa, ya + 1.85, za); }
    for (const s of [-1, 1]) { const xa = -951.5, xb = -951.5 + s * 3.3, za = zf(xa) + 0.4 + (s > 0 ? 1.5 : 0.2), zb = zf(xb) + 2.6, ya = tH(xa, za), yb = tH(xb, zb);   // gates standing open
      fence.push(xa, ya + 0.08, za, xb, yb + 0.08, zb, xb, yb + 1.75, zb, xa, ya + 0.08, za, xb, yb + 1.75, zb, xa, ya + 1.75, za); } }
  // asphalt yard inside the gate (draped 2 m grid), behind the fence
  const asp = []; for (let x = -956; x < -906; x += 2) for (let z = stZ(x) - 30; z < stZ(x) - 3.4; z += 2) { if (Math.abs(x + 933) < 23 && z < 594) continue; const y = (a, b) => tH(a, b) + 0.06; asp.push(x, y(x, z), z, x, y(x, z + 2), z + 2, x + 2, y(x + 2, z + 2), z + 2, x, y(x, z), z, x + 2, y(x + 2, z + 2), z + 2, x + 2, y(x + 2, z), z); }
  // cemetery lawn: mown green over the front of the cemetery (draped 4 m grid)
  const lawn = []; for (let x = -1036; x < -850; x += 4) for (let z = 640; z < 764; z += 4) { if (!inPoly(G.cem, x + 2, z + 2) || z < stZ(x) + 6) continue; const y = (a, b) => tH(a, b) + 0.07;
    lawn.push(x, y(x, z), z, x, y(x, z + 4), z + 4, x + 4, y(x + 4, z + 4), z + 4, x, y(x, z), z, x + 4, y(x + 4, z + 4), z + 4, x + 4, y(x + 4, z), z); }
  const grp = new THREE.Group(); grp.name = 'lhlot-surroundings';
  const m = new THREE.Mesh(merge(L), clip(new THREE.MeshStandardMaterial({vertexColors: true, roughness: 0.92, metalness: 0, side: THREE.DoubleSide}))); m.name = 'lhlot-props'; grp.add(m);
  { const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lawn, 3)); lg.computeVertexNormals(); grp.add(new THREE.Mesh(lg, clip(new THREE.MeshStandardMaterial({color: 0x4f6b35, roughness: 1})))); }
  const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(wire, 3)); grp.add(new THREE.LineSegments(wg, clip(new THREE.LineBasicMaterial({color: 0x222222}))));
  const ag = new THREE.BufferGeometry(); ag.setAttribute('position', new THREE.Float32BufferAttribute(asp, 3)); ag.computeVertexNormals(); grp.add(new THREE.Mesh(ag, clip(new THREE.MeshStandardMaterial({color: 0x3b3d40, roughness: 0.95}))));
  { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); g.strokeStyle = 'rgba(165,170,175,0.85)'; g.lineWidth = 2.5; for (let i = -64; i < 128; i += 16) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 64, 64); g.stroke(); g.beginPath(); g.moveTo(i + 64, 0); g.lineTo(i, 64); g.stroke(); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(fence, 3));
    const uv = []; for (let i = 0; i < fence.length; i += 18) { const L2 = Math.hypot(fence[i + 3] - fence[i], fence[i + 5] - fence[i + 2]) / 0.16; uv.push(0, 0, L2, 0, L2, 11, 0, 0, L2, 11, 0, 11); }
    fg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); grp.add(new THREE.Mesh(fg, clip(new THREE.MeshBasicMaterial({map: t, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide})))); }
  // headstones: unnamed rows on the front lawn, white and grey granite, slight lean
  { const pts = []; rs = 99; for (let z = 652; z < 730; z += 3.2) for (let x = -1028; x < -860; x += 1.9) { if (rnd() > (LITE ? 0.22 : 0.42)) continue; if (Math.abs(x + 962) < 5 || Math.hypot(x + 905, z - stZ(-905) - 22) < 14) continue;
      if (!inPoly(G.cem, x, z) || z < stZ(x) + 16) continue; pts.push([x + (rnd() - 0.5) * 0.3, z]); }
    const im = new THREE.InstancedMesh(new THREE.BoxGeometry(0.75, 0.85, 0.2), clip(new THREE.MeshStandardMaterial({roughness: 0.8})), pts.length); const o = new THREE.Object3D(), c = new THREE.Color();
    pts.forEach(([x, z], i) => { const s = 0.75 + rnd() * 0.6; o.position.set(x, tH(x, z) + 0.4 * s, z); o.rotation.set((rnd() - 0.5) * 0.06, 0.0 + (rnd() - 0.5) * 0.08, (rnd() - 0.5) * 0.05); o.scale.set(s * (0.8 + rnd() * 0.5), s, 1); o.updateMatrix(); im.setMatrixAt(i, o.matrix);
      im.setColorAt(i, c.setHex(rnd() < 0.55 ? 0xe9e7e1 : rnd() < 0.5 ? 0x8d8f92 : 0x5f6266)); });
    im.name = 'lhlot-headstones'; grp.add(im); grp.userData.stones = pts.length; }
  // the flag (canvas)
  for (const FL of [W3D._lhFlag, W3D._lhFlag2]) if (FL) { const c = document.createElement('canvas'); c.width = 190; c.height = 100; const g = c.getContext('2d'); for (let i = 0; i < 13; i++) { g.fillStyle = i % 2 ? '#fff' : '#b22234'; g.fillRect(0, i * 100 / 13, 190, 100 / 13 + 0.5); }
    g.fillStyle = '#3c3b6e'; g.fillRect(0, 0, 76, 54); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const f = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.0), clip(new THREE.MeshStandardMaterial({map: t, side: THREE.DoubleSide, roughness: 0.9})));
    const [fx, fy, fz] = FL; f.position.set(fx + 0.97, fy, fz); f.rotation.y = 0.4; grp.add(f); }
  let tris = 0; grp.traverse(o => { if (o.isMesh) tris += (o.geometry.attributes.position.count / 3) * (o.isInstancedMesh ? o.count * 0 + 4 : 1); }); grp.userData.tris = Math.round(tris); return grp; }
let site = null;
function dispose(g) { g.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } }); }
AFRAME.registerComponent('w3d-lhlot', { tick: function (t, dt) { this.acc = (this.acc || 0) + dt; if (this.acc < 700) return; this.acc = 0; const sc = this.el; if (!sc.camera || !W3D.root || !W3D.terrainH) return;
  if (!W3D.active) { if (site) site.visible = false; return; }
  const v = sc.camera.getWorldPosition(new THREE.Vector3()), d = Math.hypot(v.x - C0.x, v.z - C0.z);
  if (!site && d < 600) { site = build(); W3D.root.add(site); console.log('lhlot: built, ' + site.userData.stones + ' headstones'); }
  else if (site && d > 900) { W3D.root.remove(site); dispose(site); site = null; }
  if (site) site.visible = true; } });
(function attach() { const sc = document.querySelector('a-scene'); if (!sc) return setTimeout(attach, 300); sc.setAttribute('w3d-lhlot', ''); })();
W3D.lhlot = {stats: () => ({built: !!site, stones: site ? site.userData.stones : 0})};
})();
