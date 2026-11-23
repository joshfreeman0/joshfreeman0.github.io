/* Fowling Pond shore (Josh's request): a quiet, natural landscape between the domed pavilion's terrace and the pond.
   - A 3 m opening in the terrace's west parapet (on the pavilion axis) with one stone step down to a winding packed-earth / stone-dust
     walkway that runs ~390 m down through the woods, across the lakeside drive, to the sand; a second branch loops back up to the terrace.
   - The historical marker stands beside the walkway at its shore end, facing the walkway, with the pond behind it as you read.
   - Split-log benches with flat sitting stones, native plantings (highbush blueberry, sweet fern, inkberry, cattails, pickerelweed, reeds,
     grasses, asters, white pines, red maples, oaks), low warm lantern bollards, a wetu frame set back from the shore and a dugout canoe on the bank.
   Everything is instanced / merged and built once; nothing touches the pond water or the other custom sites. */
(function () {
const W3D = window.W3D = window.W3D || {};
const MARKER_TEXT = ['FOWLING POND',
  'For thousands of years before the English arrived, this pond and its shores were a principal gathering and resort place for the Wampanoag people and their ancestors, who fished, hunted waterfowl, and lived here.',
  'After English colonization, the pond and the surrounding land were destroyed.',
  'The pond has since been restored.'];
// waterline of Fowling Pond (from pondmask_t4, every 10 m of z): x of the water's edge
const EDGE = [[-500, 341.5], [-490, 347.5], [-480, 353.5], [-470, 359.5], [-460, 365.5], [-450, 373.5], [-440, 381.5], [-430, 393.5], [-420, 403.5], [-410, 413.5], [-400, 425.5], [-390, 435.5], [-380, 443.5], [-370, 453.5], [-360, 461.5], [-350, 469.5], [-340, 477.5], [-330, 485.5], [-320, 493.5], [-310, 501.5], [-300, 505.5]];
const edgeX = z => { if (z <= EDGE[0][0]) return EDGE[0][1]; for (let i = 1; i < EDGE.length; i++) if (z <= EDGE[i][0]) { const [z0, x0] = EDGE[i - 1], [z1, x1] = EDGE[i]; return x0 + (x1 - x0) * (z - z0) / (z1 - z0); } return EDGE[EDGE.length - 1][1]; };
// walkway: down branch (south of the axis) and return branch (north), both from the parapet opening at (836.6, -380)
const DOWN = [[836.6, -380], [828, -381], [818, -385], [808, -391], [798, -389], [789, -381], [779, -381], [768, -388], [752, -394], [732, -391], [710, -395], [686, -391], [660, -387], [632, -390], [604, -386], [576, -383], [548, -387], [520, -385], [494, -388], [474, -390], [458, -392], [452, -392.5]];
const BACK = [[458, -392], [470, -401], [492, -411], [520, -419], [552, -417], [584, -424], [616, -421], [648, -427], [680, -420], [708, -414], [734, -407], [756, -402], [772, -398], [786, -393], [798, -389]];
const MARK = {x: 447.2, z: -394.2};            // the marker post
const SEATS = [[771, -373, 'W'], [459, -371, 'pond'], [622, -431, 'W']];
const WETU = {x: 517, z: -360}, CANOE = {x: 451.5, z: -379};
let rnd = 12345; const R = () => (rnd = (rnd * 16807) % 2147483647) / 2147483647;
function tex(c, srgb) { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
function cnv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function pathTex() { const S = 256, c = cnv(S, S), g = c.getContext('2d'); g.fillStyle = '#9a8b70'; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 5000; i++) { const v = 110 + R() * 90 | 0; g.fillStyle = 'rgba(' + v + ',' + (v - 10) + ',' + (v - 28) + ',' + (0.25 + R() * 0.35) + ')'; g.fillRect(R() * S, R() * S, 1 + R() * 3, 1 + R() * 3); }
  for (let i = 0; i < 140; i++) { const v = 150 + R() * 60 | 0; g.fillStyle = 'rgba(' + v + ',' + v + ',' + (v - 8) + ',0.8)'; g.beginPath(); g.arc(R() * S, R() * S, 1 + R() * 2.2, 0, 7); g.fill(); }   // stone dust / grit
  const t = tex(c, true); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; }
function markerTex() { // dark cast-metal panel, raised cream lettering and rim (shadow + highlight give the cast relief)
  const W = 1024, H = 928, k = W3D.lite ? 0.75 : 1, c = cnv(W * k, H * k), g = c.getContext('2d'); g.scale(k, k); g.fillStyle = '#23272a';   // 768 px on phones / lite g.fillRect(0, 0, W, H);
  for (let i = 0; i < 9000; i++) { g.fillStyle = 'rgba(255,255,255,' + (R() * 0.035) + ')'; g.fillRect(R() * W, R() * H, 2, 2); }
  const raised = (fn) => { g.save(); g.translate(3, 3); g.fillStyle = g.strokeStyle = 'rgba(0,0,0,0.75)'; fn(); g.restore(); g.save(); g.translate(-1.5, -1.5); g.fillStyle = g.strokeStyle = 'rgba(255,250,230,0.35)'; fn(); g.restore(); g.fillStyle = g.strokeStyle = '#e9dfc2'; fn(); };
  raised(() => { g.lineWidth = 10; g.strokeRect(26, 26, W - 52, H - 52); g.lineWidth = 3; g.strokeRect(44, 44, W - 88, H - 88); });
  g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  raised(() => { g.font = 'bold 76px Georgia, "Times New Roman", serif'; g.fillText(MARKER_TEXT[0], W / 2, 150); });
  const wrap = (s, font, maxW) => { g.font = font; const out = []; let line = ''; for (const w of s.split(' ')) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t; } if (line) out.push(line); return out; };
  let size = 42, lines; for (;;) { const f = 'bold ' + size + 'px Georgia, "Times New Roman", serif'; lines = MARKER_TEXT.slice(1).map(p => wrap(p, f, W - 150)); const n = lines.reduce((a, l) => a + l.length, 0); if (n * size * 1.28 + 2 * size * 0.7 < H - 260 || size < 30) break; size -= 2; }
  let y = 225 + size; const f = 'bold ' + size + 'px Georgia, "Times New Roman", serif';
  for (const para of lines) { for (const l of para) { raised(() => { g.font = f; g.fillText(l, W / 2, y); }); y += size * 1.28; } y += size * 0.7; }
  return tex(c, true);
}
function ribbon(pts, w, mat, gAt) { // smooth walkway draped on the ground (3 vertices across so it follows cross-slope)
  const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], 0, p[1])), false, 'centripetal'); const L = curve.getLength(), n = Math.ceil(L / 1.2);
  const pos = [], uv = [], idx = [], samples = curve.getSpacedPoints(n);
  for (let i = 0; i <= n; i++) { const p = samples[i], q = samples[Math.min(n, i + 1)], o = samples[Math.max(0, i - 1)], dx = q.x - o.x, dz = q.z - o.z, l = Math.hypot(dx, dz) || 1, nx = -dz / l, nz = dx / l;
    const ww = w * (0.92 + 0.16 * Math.sin(i * 0.37) * Math.sin(i * 0.11));   // the edge wanders a little, like a trodden path
    for (const s of [-1, 0, 1]) { const x = p.x + nx * s * ww / 2, z = p.z + nz * s * ww / 2; pos.push(x, gAt(x, z) + 0.12, z); uv.push((s + 1) / 2, i * 1.2 / 2); } }
  for (let i = 0; i < n; i++) for (let k = 0; k < 2; k++) { const a = i * 3 + k, b = a + 1, c = a + 3, d = a + 4; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.receiveShadow = true; m.name = 'shore-path'; return {mesh: m, pts: samples};
}
function inst(geo, mat, list, root, name) { // list: [x, y, z, sx, sy, sz, yaw, colour?]
  const im = new THREE.InstancedMesh(geo, mat, list.length), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3(), col = new THREE.Color();
  list.forEach((t, i) => { e.set(0, t[6] || 0, 0); q.setFromEuler(e); p.set(t[0], t[1], t[2]); s.set(t[3], t[4], t[5]); m4.compose(p, q, s); im.setMatrixAt(i, m4); if (t[7] !== undefined) { col.set(t[7]); im.setColorAt(i, col); } });
  im.frustumCulled = false; im.castShadow = false; im.receiveShadow = true; im.name = name; root.add(im); return im;
}
function build() {
  const L = W3D.lib, gAt = (x, z) => W3D.groundAt(x, z, -1e4), lite = !!W3D.lite, root = new THREE.Group(); root.name = 'shore'; W3D.root.add(root); W3D.shore = root;
  const y0 = L.HQ.y, zc = L.HQ.z;
  // ---- 1. parapet opening on the pavilion axis + one stone step down onto the walkway ----
  let par = null; W3D.root.traverse(o => { const p = o.isMesh && o.geometry && o.geometry.parameters; if (p && o.geometry.type === 'BoxGeometry' && Math.abs(p.width - 0.8) < 1e-3 && Math.abs(p.height - 1.05) < 1e-3 && Math.abs(p.depth - 56) < 1e-3 && Math.abs(o.position.x - 837.4) < 0.05) par = o; });
  if (par) { par.visible = false; for (const w of L.walls) if (Math.abs(w.x0 - 837) < 0.01 && Math.abs(w.x1 - 837.8) < 0.01 && Math.abs(w.z0 - (zc - 28)) < 0.01) w.y1 = -1e6;
    for (const s of [-1, 1]) { L.box(0.8, 1.05, 26.4, 837.4, y0, zc + s * 14.8, par.material, {}); L.box(1.1, 1.35, 0.9, 837.4, y0, zc + s * 1.95, par.material, {}); } // two runs + gate piers
    const st = L.box(1.4, 0.18, 3.2, 836.1, gAt(836.1, zc) - 0.02, zc, par.material, {collide: false}); L.floors.push({x0: 835.4, x1: 836.8, z0: zc - 1.6, z1: zc + 1.6, y: gAt(836.1, zc) + 0.16}); }
  // ---- 2. the walkway (packed earth / stone dust), down branch + return branch ----
  const pm = new THREE.MeshLambertMaterial({map: pathTex(), side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4});
  const A = ribbon(DOWN, 1.9, pm, gAt), B = ribbon(BACK, 1.6, pm, gAt); root.add(A.mesh); root.add(B.mesh);
  const pathPts = A.pts.concat(B.pts);
  const nearPath = (x, z, r) => { for (let i = 0; i < pathPts.length; i += 2) { const p = pathPts[i]; if ((p.x - x) * (p.x - x) + (p.z - z) * (p.z - z) < r * r) return true; } return false; };
  const keep = [[MARK.x, MARK.z, 4], [WETU.x, WETU.z, 6], [CANOE.x, CANOE.z, 4]].concat(SEATS.map(s => [s[0], s[1], 4.5]));
  const nearKeep = (x, z, extra) => keep.some(k => Math.hypot(k[0] - x, k[1] - z) < k[2] + (extra || 0));
  const onSandOrRoad = (x, z) => x > edgeX(z) + 2.5 && x < edgeX(z) + 41;
  const onRoad = (x, z) => x > edgeX(z) + 29 && x < edgeX(z) + 41;          // sand strip + lakeside drive: keep clear
  // clear the existing 3D trees off the walkway and the small clearings
  W3D.root.traverse(o => { if (!o.isInstancedMesh || o.name !== 'trees') return; const m4 = new THREE.Matrix4(), p = new THREE.Vector3(), zero = new THREE.Matrix4().makeScale(0, 0, 0); let ch = 0;
    for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m4); p.setFromMatrixPosition(m4); if (p.x < 430 || p.x > 845 || p.z < -450 || p.z > -340) continue; if (nearPath(p.x, p.z, 4.2) || nearKeep(p.x, p.z, 2)) { o.setMatrixAt(i, zero); ch++; } }
    if (ch) o.instanceMatrix.needsUpdate = true; });
  // ---- 3. historical marker ----
  { const n = {x: 0.73, z: -0.68}, yaw = Math.atan2(n.x, n.z), gy = gAt(MARK.x, MARK.z);   // face looks along n (to the walkway); the pond lies behind
    const metal = new THREE.MeshStandardMaterial({color: 0x2a2e31, metalness: 0.55, roughness: 0.5});
    const face = new THREE.MeshStandardMaterial({map: markerTex(), metalness: 0.35, roughness: 0.55});
    const g = new THREE.Group(); g.position.set(MARK.x, gy, MARK.z); g.rotation.y = yaw; root.add(g);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 2.2, 12), metal); post.position.set(0, 1.08, -0.06); g.add(post);
    const panel = new THREE.Mesh(new THREE.BoxGeometry(1.12, 1.015, 0.06), [metal, metal, metal, metal, face, metal]); panel.position.set(0, 1.62, 0); panel.castShadow = true; g.add(panel);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.03, 0.1), metal); cap.position.set(0, 2.14, -0.01); g.add(cap);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.12, 12), new THREE.MeshLambertMaterial({color: 0x8d8678})); base.position.set(0, 0.04, -0.06); g.add(base);
    L.walls.push({x0: MARK.x - 0.35, x1: MARK.x + 0.35, z0: MARK.z - 0.35, z1: MARK.z + 0.35, y0: gy, y1: gy + 2.2});
    W3D.pondMarker = {x: MARK.x, z: MARK.z, y: gy, faceYawDeg: yaw * 180 / Math.PI}; }
  // ---- 4. seating: split-log benches with a flat stone beside each ----
  { const wood = new THREE.MeshLambertMaterial({color: 0x8a6a48}), bark = new THREE.MeshLambertMaterial({color: 0x5b4634}), stone = new THREE.MeshLambertMaterial({color: 0x9a968c, flatShading: true});
    const half = new THREE.CylinderGeometry(0.24, 0.24, 2.0, 12, 1, false, -Math.PI / 2, Math.PI); half.rotateX(Math.PI / 2); half.rotateY(Math.PI / 2);   // split log along local x, flat face up
    const stump = new THREE.CylinderGeometry(0.17, 0.2, 0.36, 9), rock = new THREE.IcosahedronGeometry(0.55, 1); rock.scale(1.25, 0.42, 0.95);
    const seats = [], legs = [], rocks = [];
    for (const [x, z, f] of SEATS) { const a = f === 'pond' ? Math.atan2(-0.73, 0.68) : -Math.PI / 2, gy = gAt(x, z);   // sitter faces the pond (local +z = front)
      const fx = Math.sin(a), fz = Math.cos(a), rx = Math.cos(a), rz = -Math.sin(a);
      seats.push([x, gy + 0.44, z, 1, 1, 1, a]);
      for (const s of [-0.7, 0.7]) legs.push([x + rx * s, gAt(x + rx * s, z + rz * s) + 0.17, z + rz * s, 1, 1, 1, a]);
      rocks.push([x + rx * 1.9 + fx * 0.3, gy + 0.12, z + rz * 1.9 + fz * 0.3, 1, 1, 1, a + 0.6]);
      L.walls.push({x0: x - 1.1, x1: x + 1.1, z0: z - 1.1, z1: z + 1.1, y0: gy, y1: gy + 0.45}); }
    inst(half, wood, seats, root, 'shore-bench'); inst(stump, bark, legs, root, 'shore-bench-legs'); inst(rock, stone, rocks, root, 'shore-stone'); }
  // ---- 5. native plantings ----
  { const shrubs = [], grass = [], asters = [], reeds = [], cattails = [], pick = [];
    const SH = ['#3f5a2e', '#4a6634', '#355228', '#5a6a3a', '#2f4a2c'];   // blueberry / inkberry (dark glossy) / sweet fern (yellow-green)
    const side = (p, q, d) => { const dx = q.x - p.x, dz = q.z - p.z, l = Math.hypot(dx, dz) || 1; return [p.x - dz / l * d, p.z + dx / l * d]; };
    for (let i = 1; i < pathPts.length - 1; i++) { const p = pathPts[i], q = pathPts[i + 1]; if (Math.hypot(q.x - p.x, q.z - p.z) > 3) continue;
      if (R() < (lite ? 0.35 : 0.6)) { const d = (R() < 0.5 ? -1 : 1) * (2.0 + R() * 6), [x, z] = side(p, q, d); if (!onSandOrRoad(x, z) && !nearPath(x, z, 1.6) && !nearKeep(x, z)) { const s = 0.6 + R() * 0.9; shrubs.push([x, gAt(x, z) + s * 0.35, z, s * (0.9 + R() * 0.4), s * (0.7 + R() * 0.4), s * (0.9 + R() * 0.4), R() * 6, SH[(R() * SH.length) | 0]]); } }
      if (R() < (lite ? 0.4 : 0.8)) { const d = (R() < 0.5 ? -1 : 1) * (1.3 + R() * 3.5), [x, z] = side(p, q, d); if (!onRoad(x, z) && !nearPath(x, z, 1.1) && !nearKeep(x, z, -1)) { const s = 0.5 + R() * 0.6; (R() < 0.22 ? asters : grass).push([x, gAt(x, z), z, s, s * (0.8 + R() * 0.6), s, R() * 6]); } } }
    // loose drifts of shrubs further from the walkway (clumps of 2-6, never in rows)
    for (let k = 0; k < (lite ? 30 : 60); k++) { const p = pathPts[(R() * pathPts.length) | 0], a = R() * 6.283, d = 8 + R() * 22, cx = p.x + Math.cos(a) * d, cz = p.z + Math.sin(a) * d, n = 2 + (R() * 5 | 0), col = SH[(R() * SH.length) | 0];
      for (let j = 0; j < n; j++) { const x = cx + (R() - 0.5) * 5, z = cz + (R() - 0.5) * 5; if (onSandOrRoad(x, z) || x < edgeX(z) || nearPath(x, z, 1.8) || nearKeep(x, z)) continue; const s = 0.5 + R() * 0.9; shrubs.push([x, gAt(x, z) + s * 0.3, z, s * (0.9 + R() * 0.4), s * (0.6 + R() * 0.5), s * (0.9 + R() * 0.4), R() * 6, col]); } }
    // water's edge: cattails, reeds and pickerelweed in drifts along the shore either side of the marker view
    for (let z = -446; z < -330; z += lite ? 1.6 : 0.9) { if (z > -399 && z < -374 && R() < 0.8) continue; const drift = Math.sin(z * 0.13) + Math.sin(z * 0.047 + 1); if (drift < -0.6) continue;
      const x = edgeX(z) + (R() - 0.3) * 3.2, zz = z + (R() - 0.5) * 0.8, gy = Math.max(16.2, gAt(x, zz)); const k = R();
      if (k < 0.4) cattails.push([x, gy, zz, 1, 0.8 + R() * 0.5, 1, R() * 6]); else if (k < 0.75) reeds.push([x, gy, zz, 1, 0.8 + R() * 0.6, 1, R() * 6]); else pick.push([x, gy, zz, 0.8 + R() * 0.5, 0.7 + R() * 0.4, 0.8 + R() * 0.5, R() * 6]); }
    const shrubG = new THREE.IcosahedronGeometry(0.8, 1); shrubG.translate(0, 0.2, 0);
    inst(shrubG, new THREE.MeshLambertMaterial({color: 0xffffff, flatShading: true}), shrubs, root, 'shore-shrubs');
    const blade = (h, w, n) => { const g = new THREE.BufferGeometry(), p = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + 0.3, r = 0.12, lx = Math.cos(a) * 0.15, lz = Math.sin(a) * 0.15, tx = lx + Math.cos(a) * r * 2, tz = lz + Math.sin(a) * r * 2;
        p.push(lx - Math.sin(a) * w, 0, lz + Math.cos(a) * w, lx + Math.sin(a) * w, 0, lz - Math.cos(a) * w, tx, h * (0.8 + 0.2 * Math.sin(i * 7.1)), tz); } g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.computeVertexNormals(); return g; };
    const dbl = c => new THREE.MeshLambertMaterial({color: c, side: THREE.DoubleSide});
    inst(blade(0.75, 0.05, 9), dbl(0x7d8a4a), grass, root, 'shore-grass');                    // little bluestem / switchgrass tufts
    const ast = blade(0.55, 0.05, 7); inst(ast, dbl(0x5f7a3a), asters, root, 'shore-asters');
    const flowers = asters.map(a => [a[0], a[1] + 0.5 * a[4], a[2], a[3] * 0.9, a[4] * 0.5, a[5] * 0.9, a[6]]); const fg = new THREE.IcosahedronGeometry(0.16, 0); inst(fg, new THREE.MeshLambertMaterial({color: 0x8f7ac8}), flowers, root, 'shore-aster-flowers');   // New England aster purple
    inst(blade(1.9, 0.03, 8), dbl(0x8c9a5a), reeds, root, 'shore-reeds');
    inst(blade(1.6, 0.035, 7), dbl(0x5d7a3c), cattails, root, 'shore-cattails');
    const heads = cattails.map(c => [c[0] + 0.05, c[1] + 1.55 * c[4], c[2], 1, c[4], 1, 0]); const hg = new THREE.CylinderGeometry(0.045, 0.045, 0.28, 6); inst(hg, new THREE.MeshLambertMaterial({color: 0x5a3a22}), heads, root, 'shore-cattail-heads');
    const pg = new THREE.IcosahedronGeometry(0.35, 0); pg.scale(1, 0.6, 1); pg.translate(0, 0.25, 0); inst(pg, new THREE.MeshLambertMaterial({color: 0x3f6a34, flatShading: true}), pick, root, 'shore-pickerelweed');
    const spikes = pick.map(c => [c[0], c[1] + 0.55, c[2], 1, c[4], 1, 0]); inst(new THREE.ConeGeometry(0.05, 0.22, 5), new THREE.MeshLambertMaterial({color: 0x6a62c4}), spikes, root, 'shore-pickerel-flowers');
    // a few shade trees near the shore end and the seats: white pine, red maple, oak (irregular, not a grid)
    const T = [[492, -366, 'pine'], [500, -404, 'maple'], [486, -424, 'oak'], [530, -372, 'oak'], [540, -398, 'pine'], [470, -350, 'maple'], [560, -430, 'pine'], [604, -437, 'oak'], [636, -440, 'maple'], [760, -366, 'pine'], [782, -366, 'oak'], [748, -380, 'maple']];
    const trunks = [], pines = [], pines2 = [], crowns = [];
    for (const [x, z, k] of T) { if (nearPath(x, z, 3)) continue; const gy = gAt(x, z), s = 0.85 + R() * 0.4; trunks.push([x, gy - 0.3, z, s, s * (k === 'pine' ? 1.6 : 1.2), s, R() * 6]);
      if (k === 'pine') { pines.push([x, gy + 5 * s, z, s, s, s, R() * 6, '#2c4a30']); pines2.push([x, gy + 9 * s, z, s * 0.75, s * 0.8, s * 0.75, R() * 6, '#33553a']); }
      else crowns.push([x, gy + 6.5 * s, z, s * (k === 'oak' ? 1.25 : 1), s * (k === 'oak' ? 0.9 : 1.05), s * (k === 'oak' ? 1.25 : 0.95), R() * 6, k === 'oak' ? '#3e5a2a' : '#6a5a2c']); }   // red maple: autumn bronze-red green
    const trG = new THREE.CylinderGeometry(0.22, 0.34, 6, 7, 1, true); trG.translate(0, 3, 0);
    inst(trG, new THREE.MeshLambertMaterial({color: 0x5a4a3a}), trunks, root, 'shore-trunks');
    const pineG = new THREE.ConeGeometry(2.8, 6, 8, 1, true); inst(pineG, new THREE.MeshLambertMaterial({color: 0xffffff, side: THREE.DoubleSide}), pines, root, 'shore-pine'); inst(pineG, new THREE.MeshLambertMaterial({color: 0xffffff, side: THREE.DoubleSide}), pines2, root, 'shore-pine2');
    const crG = new THREE.IcosahedronGeometry(3.6, 1); crG.scale(1, 0.8, 1); inst(crG, new THREE.MeshLambertMaterial({color: 0xffffff, flatShading: true}), crowns, root, 'shore-crowns'); }
  // ---- 6. low warm lantern bollards along the walkway ----
  { const posts = [], tops = []; let acc = 0, sd = 1;
    for (let i = 1; i < pathPts.length; i++) { const p = pathPts[i], o = pathPts[i - 1]; const seg = Math.hypot(p.x - o.x, p.z - o.z); if (seg > 3) continue; acc += seg; if (acc < 24) continue; acc = 0; sd = -sd;
      const dx = p.x - o.x, dz = p.z - o.z, l = seg || 1, x = p.x - dz / l * 1.35 * sd, z = p.z + dx / l * 1.35 * sd; if (onRoad(x, z)) continue; const gy = gAt(x, z);
      posts.push([x, gy + 0.32, z, 1, 1, 1, 0]); tops.push([x, gy + 0.7, z, 1, 1, 1, 0]); }
    inst(new THREE.CylinderGeometry(0.07, 0.09, 0.64, 8), new THREE.MeshLambertMaterial({color: 0x2e2a26}), posts, root, 'shore-bollards');
    inst(new THREE.CylinderGeometry(0.1, 0.1, 0.14, 8), new THREE.MeshBasicMaterial({color: 0xffc77a}), tops, root, 'shore-lanterns');   // warm glow without real lights (cheap)
    const capG = new THREE.ConeGeometry(0.14, 0.08, 8); capG.translate(0, 0.1, 0); inst(capG, new THREE.MeshLambertMaterial({color: 0x2e2a26}), tops, root, 'shore-lantern-caps'); }
  // ---- 7. wetu frame (bent saplings lashed in a dome, set back from the shore) and a dugout canoe on the bank ----
  { const sap = new THREE.MeshLambertMaterial({color: 0x7a6248}), gy = gAt(WETU.x, WETU.z), g = new THREE.Group(); g.position.set(WETU.x, gy, WETU.z); root.add(g);
    const Rw = 2.6, Hh = 2.5, Lw = 1.25;   // slightly oval: 5.2 m x 6.5 m, 2.5 m high
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI; const arch = new THREE.TorusGeometry(1, 0.045, 5, 18, Math.PI); const m = new THREE.Mesh(arch, sap); m.scale.set(Rw * (1 + (Lw - 1) * Math.abs(Math.cos(a))), Hh, 1); m.rotation.y = a; g.add(m); }
    for (const h of [0.7, 1.45, 2.05]) { const r = Math.sqrt(Math.max(0.05, 1 - (h / Hh) * (h / Hh))); const ring = new THREE.TorusGeometry(1, 0.04, 4, 28); ring.rotateX(Math.PI / 2); const m = new THREE.Mesh(ring, sap); m.scale.set(Rw * Lw * r, 1, Rw * r); m.position.y = h; g.add(m); }
    const mat = new THREE.MeshLambertMaterial({color: 0x8b7a5a, side: THREE.DoubleSide});   // a few bark / reed mats tied on one side
    for (let k = 0; k < 3; k++) { const pnl = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 6, 0.4 + k * 0.5, 0.45, 0.25, 1.05), mat); pnl.scale.set(Rw * Lw + 0.02, Hh + 0.02, Rw + 0.02); g.add(pnl); }
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 0.12, 10), new THREE.MeshLambertMaterial({color: 0x6e6a62, flatShading: true})); ring.position.y = 0.04; g.add(ring);   // hearth stones
    L.walls.push({x0: WETU.x - 3.3, x1: WETU.x - 2.9, z0: WETU.z - 2.6, z1: WETU.z + 2.6, y0: gy, y1: gy + 2}, {x0: WETU.x + 2.9, x1: WETU.x + 3.3, z0: WETU.z - 2.6, z1: WETU.z + 2.6, y0: gy, y1: gy + 2});
    // dugout canoe: one hollowed log, lying along the shore on the sand
    const c = new THREE.Group(), cy = gAt(CANOE.x, CANOE.z); c.position.set(CANOE.x, cy + 0.02, CANOE.z); c.rotation.y = Math.atan2(0.68, 0.73); root.add(c);
    const logM = new THREE.MeshLambertMaterial({color: 0x5e4630}), inM = new THREE.MeshLambertMaterial({color: 0x3a2a1c, side: THREE.BackSide});
    const hull = new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2); hull.scale(0.36, 0.34, 2.7); const hm = new THREE.Mesh(hull, logM); hm.position.y = 0.34; c.add(hm);
    const inner = new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2); inner.scale(0.3, 0.28, 2.55); const im = new THREE.Mesh(inner, inM); im.position.y = 0.34; c.add(im);
    const rim = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.36, 24), logM); rim.rotation.x = -Math.PI / 2; rim.scale.set(1, 7.6, 1); rim.position.y = 0.341; c.add(rim);
    const pad = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.03, 1.5), logM); pad.position.set(0.55, 0.03, 0.2); pad.rotation.y = 0.2; c.add(pad);   // a paddle beside it
    L.walls.push({x0: CANOE.x - 1.6, x1: CANOE.x + 1.6, z0: CANOE.z - 1.6, z1: CANOE.z + 1.6, y0: cy, y1: cy + 0.45}); }
  if (lite && W3D.liteTextures) W3D.liteTextures(root);
  W3D.spots = W3D.spots || {}; W3D.spots.marker = () => { const m = W3D.pondMarker; W3D.teleportTo(m.x + 0.73 * 2.2, undefined, m.z - 0.68 * 2.2, m.faceYawDeg); };   // stand 2.2 m in front, reading it, pond beyond
}
const iv = setInterval(() => { if (window.W3D_READY && W3D.root && W3D.lib && W3D.groundAt) { clearInterval(iv); try { build(); } catch (e) { console.warn('shore', e); } } }, 400);
})();
