/* Temple of Vesta (aedes Vestae) on the south lawn, after the last rebuilding of the Forum temple by Julia Domna (after the fire of AD 191):
   a round white-marble tholos on a high circular podium ~15 m across (15.05 m foundation), stairs on the east, 20 fluted Corinthian
   columns on plinths with bronze grilles between them, an entablature whose frieze carries sacrificial implements (patera, culter,
   aspergillum, urceus, dolabra, urna, laurel, bucranium with fillets), a cella (inner diameter 8.6 m, wall 0.6 m) with one door facing
   east and engaged columns inside, a conical bronze-tile roof with an opening at the apex under a flower-like bronze chimney, the round
   hearth with an ever-burning fire (animated flame, one warm light, smoke rising out of the roof opening) and the penus, a small recess
   screened off with mats. Beside it, the garden of the House of the Vestals: three water pools, hedged beds,
   14 generic robed statues (procedural, no names) and warm weathered paving; the intact house around it is vestahouse.js.
   Everything is built once; the fire animates only when you are within ~150 m. */
(function () {
const W3D = window.W3D = window.W3D || {};
const C = {x: 985, z: -318};                 // centre of the temple (south lawn, east of the conservatory)
const COURT = {x0: 903, x1: 949, z0: -306.3, z1: -288.3};   // the garden inside the House of the Vestals (vestahouse.js builds the house around it)
const PR = 7.5, PH = 3.0, NCOL = 20, CR = 5.9, CD = 0.56, CH = 5.9, WR_IN = 4.3, WR_OUT = 4.9;
let fire = null;
function cnv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function tex(c, rep) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } return t; }
function friezeCanvas() { // white marble frieze, sunk-relief sacrificial implements in a repeating sequence (one repeat per intercolumniation)
  const W = 1024, H = 128, c = cnv(W, H), g = c.getContext('2d'); g.fillStyle = '#ece8df'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 1500; i++) { g.fillStyle = 'rgba(160,150,135,' + Math.random() * 0.12 + ')'; g.fillRect(Math.random() * W, Math.random() * H, 2, 1); }
  g.fillStyle = '#d9d3c6'; g.fillRect(0, 0, W, 8); g.fillRect(0, H - 8, W, 8);
  const sh = (fn) => { g.save(); g.translate(2, 2); g.fillStyle = g.strokeStyle = 'rgba(90,80,65,0.55)'; fn(); g.restore(); g.fillStyle = g.strokeStyle = '#f7f4ee'; fn(); };
  const items = [
    x => { g.beginPath(); g.ellipse(x, 64, 30, 12, 0, 0, 7); g.fill(); g.beginPath(); g.arc(x, 60, 7, 0, 7); g.fill(); },                                                     // patera
    x => { g.beginPath(); g.moveTo(x - 30, 70); g.quadraticCurveTo(x + 10, 40, x + 30, 60); g.lineTo(x - 30, 76); g.fill(); g.fillRect(x - 46, 68, 18, 8); },             // culter (knife)
    x => { g.fillRect(x - 3, 40, 6, 56); g.beginPath(); g.arc(x, 36, 12, 0, 7); g.fill(); for (let k = 0; k < 6; k++) g.fillRect(x - 12 + k * 4, 24, 2, 10); },               // aspergillum
    x => { g.beginPath(); g.moveTo(x - 14, 98); g.quadraticCurveTo(x - 28, 60, x - 8, 40); g.lineTo(x + 8, 40); g.quadraticCurveTo(x + 28, 60, x + 14, 98); g.fill(); g.fillRect(x - 10, 32, 20, 8); g.lineWidth = 5; g.beginPath(); g.arc(x + 20, 56, 12, -1.4, 1.4); g.stroke(); }, // urceus (jug)
    x => { g.fillRect(x - 3, 30, 6, 70); g.beginPath(); g.moveTo(x - 3, 34); g.lineTo(x - 30, 26); g.lineTo(x - 30, 54); g.lineTo(x - 3, 48); g.fill(); g.fillRect(x + 3, 36, 14, 8); }, // dolabra (axe)
    x => { g.beginPath(); g.ellipse(x, 70, 22, 26, 0, 0, 7); g.fill(); g.fillRect(x - 6, 36, 12, 12); g.beginPath(); g.ellipse(x, 34, 14, 6, 0, 0, 7); g.fill(); },          // urna
    x => { g.lineWidth = 4; g.beginPath(); g.moveTo(x - 34, 92); g.quadraticCurveTo(x, 50, x + 34, 30); g.stroke(); for (let k = 0; k < 7; k++) { const t = k / 7, px = x - 30 + t * 60, py = 88 - t * 54; g.beginPath(); g.ellipse(px, py - 8, 4, 10, 0.6, 0, 7); g.fill(); g.beginPath(); g.ellipse(px + 6, py + 4, 4, 10, -0.9, 0, 7); g.fill(); } }, // laurel
    x => { g.beginPath(); g.ellipse(x, 62, 18, 26, 0, 0, 7); g.fill(); g.lineWidth = 7; g.beginPath(); g.arc(x - 26, 40, 16, 0.2, 1.8); g.stroke(); g.beginPath(); g.arc(x + 26, 40, 16, 1.34, 2.94); g.stroke(); g.lineWidth = 3; g.beginPath(); g.moveTo(x - 30, 60); g.quadraticCurveTo(x - 46, 90, x - 40, 110); g.moveTo(x + 30, 60); g.quadraticCurveTo(x + 46, 90, x + 40, 110); g.stroke(); }]; // bucranium with fillets
  items.forEach((f, i) => sh(() => f(64 + i * 128)));
  return c;
}
function tileCanvas() { // bronze roof tiles: overlapping rows of scales, greened in the joints
  const W = 256, H = 256, c = cnv(W, H), g = c.getContext('2d'); g.fillStyle = '#5c4a2c'; g.fillRect(0, 0, W, H);
  for (let r = 0; r < 8; r++) for (let k = 0; k < 9; k++) { const x = k * 32 + (r % 2 ? 16 : 0), y = r * 32 + 32; const gr = g.createLinearGradient(0, y - 32, 0, y);
    gr.addColorStop(0, '#8a6c3c'); gr.addColorStop(0.7, '#a7854a'); gr.addColorStop(1, '#4c5a44'); g.fillStyle = gr; g.beginPath(); g.moveTo(x - 16, y - 34); g.lineTo(x - 16, y - 10); g.quadraticCurveTo(x, y + 4, x + 16, y - 10); g.lineTo(x + 16, y - 34); g.fill(); }
  return c;
}
function soft() { const c = cnv(64, 64), g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 2, 32, 32, 31); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); }
function fluted(r, h, n, seg) { const geo = new THREE.CylinderGeometry(r * 0.88, r, h, seg, 1, true); const p = geo.attributes.position; // 24 concave flutes
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), a = Math.atan2(z, x), rr = Math.hypot(x, z), k = 1 - 0.045 * Math.max(0, Math.cos(a * n)); p.setX(i, x / rr * rr * k); p.setZ(i, z / rr * rr * k); }
  geo.computeVertexNormals(); geo.translate(0, h / 2, 0); return geo; }
function lathe(pts, seg) { return new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), seg); }
function instRing(geo, mat, n, r, y, root, rotOff, skip) { const im = new THREE.InstancedMesh(geo, mat, n), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3(1, 1, 1); let k = 0;
  for (let i = 0; i < n; i++) { const a = (i + 0.5) / n * Math.PI * 2; if (skip && skip(a)) continue; e.set(0, -a + (rotOff || 0), 0); q.setFromEuler(e); p.set(C.x + Math.cos(a) * r, y, C.z + Math.sin(a) * r); m4.compose(p, q, s); im.setMatrixAt(k++, m4); }
  im.count = k; im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false; root.add(im); return im; }
function build() {
  const L = W3D.lib, M = W3D.M, lite = !!W3D.lite, seg = lite ? 32 : 64, root = new THREE.Group(); root.name = 'vesta'; W3D.root.add(root); W3D.vesta = root;
  const gy = W3D.groundAt(C.x, C.z, -1e4), top = gy + PH;
  const marble = M.marble || new THREE.MeshStandardMaterial({color: 0xf1ede4, roughness: 0.4});
  const white = new THREE.MeshStandardMaterial({color: 0xe6e0d3, roughness: 0.5, metalness: 0, envMap: W3D.env || null, envMapIntensity: 0.5});
  const bronze = new THREE.MeshStandardMaterial({color: 0x9a7a45, roughness: 0.38, metalness: 0.85, envMap: W3D.env || null});
  // ---- podium: moulded base, plain drum, crown moulding; floor ----
  const pod = lathe([[0, 0], [PR + 0.35, 0], [PR + 0.35, 0.3], [PR + 0.15, 0.45], [PR, 0.55], [PR, PH - 0.35], [PR + 0.18, PH - 0.2], [PR + 0.22, PH], [0, PH]], seg);
  const pm = new THREE.Mesh(pod, marble); pm.position.set(C.x, gy - 0.05, C.z); pm.castShadow = pm.receiveShadow = true; root.add(pm);
  for (let r = 0; r < PR; r += 1.5) { const w = Math.sqrt(Math.max(0, PR * PR - r * r)) * 0.98; L.floors.push({x0: C.x - w, x1: C.x + w, z0: C.z + r, z1: C.z + r + 1.5, y: top - 0.05}, {x0: C.x - w, x1: C.x + w, z0: C.z - r - 1.5, z1: C.z - r, y: top - 0.05}); }
  // the drum of the podium is solid: ring of wall boxes (except the stair on the east)
  for (let i = 0; i < 24; i++) { const a = (i + 0.5) / 24 * Math.PI * 2; if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < 0.22) continue; const x = C.x + Math.cos(a) * PR, z = C.z + Math.sin(a) * PR;
    L.walls.push({x0: x - 1, x1: x + 1, z0: z - 1, z1: z + 1, y0: gy - 1, y1: top - 0.4}); }
  // ---- east stair (12 risers of 0.25 m), with low side walls ----
  { const n = 12, rise = PH / n, run = 0.34, w = 3.4; for (let i = 0; i < n; i++) { const yT = gy + rise * (i + 1), x1 = C.x + PR + 0.2 + (n - i) * run, x0 = x1 - run - (i === n - 1 ? 1.6 : 0);
      const st = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0 + 0.02, yT - gy + 0.05, w), marble); st.position.set((x0 + x1) / 2, (yT + gy - 0.05) / 2, C.z); st.receiveShadow = true; root.add(st);
      L.floors.push({x0: x0, x1: x1, z0: C.z - w / 2, z1: C.z + w / 2, y: yT}); }
    for (const s of [-1, 1]) { const len = n * run + 0.6; const sw = new THREE.Mesh(new THREE.BoxGeometry(len, PH * 0.55, 0.45), white); sw.position.set(C.x + PR + 0.2 + len / 2 - 0.3, gy + PH * 0.275, C.z + s * (w / 2 + 0.22)); sw.castShadow = true; root.add(sw);
      L.walls.push({x0: C.x + PR - 0.2, x1: C.x + PR + len, z0: C.z + s * (w / 2 + 0.22) - 0.22, z1: C.z + s * (w / 2 + 0.22) + 0.22, y0: gy, y1: gy + PH}); } }
  // ---- peristyle: 20 columns on plinths jutting from the podium edge, Attic bases, fluted shafts, Corinthian capitals ----
  const isDoor = a => Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < Math.PI / NCOL + 0.01 && false;
  const plinth = new THREE.BoxGeometry(CD * 1.5, 0.35, CD * 1.5); plinth.translate(0, 0.175, 0);
  const base = lathe([[0, 0], [CD * 0.72, 0], [CD * 0.72, 0.1], [CD * 0.62, 0.16], [CD * 0.56, 0.2], [CD * 0.6, 0.26], [CD * 0.52, 0.3], [0, 0.3]], 20);
  const shaftH = CH - 0.3 - 0.75, shaft = fluted(CD / 2, shaftH, 24, lite ? 32 : 48);
  // capital: acanthus bell (two leaf tiers + volute flare) + concave-sided abacus, as one lathe + a box
  const cap = lathe([[CD * 0.44, 0], [CD * 0.5, 0.04], [CD * 0.56, 0.2], [CD * 0.5, 0.26], [CD * 0.62, 0.44], [CD * 0.56, 0.5], [CD * 0.74, 0.66], [CD * 0.8, 0.7], [0, 0.7]], 16);
  for (let i = 0, p = cap.attributes.position; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), y = p.getY(i), a = Math.atan2(z, x), lobe = 1 + 0.12 * Math.max(0, Math.cos(a * 8)) * Math.min(1, y / 0.2); p.setX(i, x * lobe); p.setZ(i, z * lobe); } cap.computeVertexNormals();
  const abacus = new THREE.BoxGeometry(CD * 1.75, 0.12, CD * 1.75); abacus.translate(0, 0.76, 0);
  const yb = top - 0.05;
  instRing(plinth, white, NCOL, CR, yb, root, 0); instRing(base, white, NCOL, CR, yb + 0.35, root, 0); instRing(shaft, white, NCOL, CR, yb + 0.65, root, 0);
  instRing(cap, white, NCOL, CR, yb + 0.65 + shaftH, root, 0); instRing(abacus, white, NCOL, CR, yb + 0.65 + shaftH, root, Math.PI / 4);
  for (let i = 0; i < NCOL; i++) { const a = (i + 0.5) / NCOL * Math.PI * 2, x = C.x + Math.cos(a) * CR, z = C.z + Math.sin(a) * CR; L.walls.push({x0: x - 0.4, x1: x + 0.4, z0: z - 0.4, z1: z + 0.4, y0: yb, y1: yb + CH}); }
  // bronze grilles in the intercolumniations (not in the east bay, which is the entrance)
  { const gw = 2 * CR * Math.sin(Math.PI / NCOL) - CD * 1.1, gh = 1.5, gc = cnv(128, 64), g = gc.getContext('2d'); g.strokeStyle = '#fff'; g.lineWidth = 4;
    for (let x = 4; x < 128; x += 16) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 64); g.stroke(); } g.strokeRect(2, 2, 124, 60); g.beginPath(); g.moveTo(0, 32); g.lineTo(128, 32); g.stroke();
    for (let x = 12; x < 128; x += 16) { g.beginPath(); g.arc(x, 32, 6, 0, 7); g.stroke(); }
    const gm = new THREE.MeshStandardMaterial({color: 0x7a5f36, metalness: 0.8, roughness: 0.45, alphaMap: new THREE.CanvasTexture(gc), alphaTest: 0.5, side: THREE.DoubleSide, envMap: W3D.env || null});
    const geo = new THREE.PlaneGeometry(gw, gh); geo.translate(0, gh / 2, 0);
    for (let i = 0; i < NCOL; i++) { const a = i / NCOL * Math.PI * 2; if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < 0.05) continue;   // a = 0: east bay = entrance
      const r = CR * Math.cos(Math.PI / NCOL), x = C.x + Math.cos(a) * r, z = C.z + Math.sin(a) * r, m = new THREE.Mesh(geo, gm); m.position.set(x, yb, z); m.rotation.y = -a + Math.PI / 2; root.add(m);
      L.walls.push({x0: x - 0.6, x1: x + 0.6, z0: z - 0.6, z1: z + 0.6, y0: yb, y1: yb + gh}); } }
  // ---- entablature: architrave (three fasciae), frieze with sacrificial implements, cornice ----
  const ey = yb + CH + 0.1;
  { const arch = lathe([[CR - 0.38, 0], [CR + 0.36, 0], [CR + 0.36, 0.17], [CR + 0.39, 0.18], [CR + 0.39, 0.34], [CR + 0.42, 0.35], [CR + 0.42, 0.52], [CR - 0.38, 0.52]], seg); const m = new THREE.Mesh(arch, white); m.position.set(C.x, ey, C.z); m.castShadow = true; root.add(m);
    const fr = new THREE.CylinderGeometry(CR + 0.4, CR + 0.4, 0.6, seg * 2, 1, true); const ft = tex(friezeCanvas(), [NCOL, 1]); const fm = new THREE.MeshStandardMaterial({map: ft, roughness: 0.45, envMap: W3D.env || null, envMapIntensity: 0.4});
    const f = new THREE.Mesh(fr, fm); f.position.set(C.x, ey + 0.52 + 0.3, C.z); root.add(f);
    const corn = lathe([[CR - 0.38, 0], [CR + 0.42, 0], [CR + 0.48, 0.08], [CR + 0.62, 0.16], [CR + 0.8, 0.24], [CR + 0.84, 0.36], [CR + 0.86, 0.44], [CR - 0.38, 0.44]], seg); const cm = new THREE.Mesh(corn, white); cm.position.set(C.x, ey + 1.12, C.z); cm.castShadow = true; root.add(cm);
    const soffit = new THREE.Mesh(new THREE.RingGeometry(WR_OUT, CR + 0.4, seg, 1), white.clone()); soffit.material.side = THREE.DoubleSide; soffit.rotation.x = Math.PI / 2; soffit.position.set(C.x, ey, C.z); root.add(soffit); }   // coffered ceiling of the narrow portico (plain)
  // ---- cella: round wall with one east door, engaged columns inside ----
  { const wallH = CH + 1.6, door = 0.2;   // door half-angle (rad): ~1.9 m wide at the outer face
    const wo = new THREE.CylinderGeometry(WR_OUT, WR_OUT, wallH, seg * 2, 1, true, door + Math.PI / 2, Math.PI * 2 - 2 * door); const wi = new THREE.CylinderGeometry(WR_IN, WR_IN, wallH, seg * 2, 1, true, door + Math.PI / 2, Math.PI * 2 - 2 * door);
    const mo = new THREE.Mesh(wo, white), mi = new THREE.Mesh(wi, white.clone()); mi.material.side = THREE.BackSide; for (const m of [mo, mi]) { m.position.set(C.x, yb + wallH / 2, C.z); m.castShadow = m.receiveShadow = true; root.add(m); }
    for (let i = 0; i < 40; i++) { const a = (i + 0.5) / 40 * Math.PI * 2; if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < door + 0.04) continue; const r = (WR_IN + WR_OUT) / 2, x = C.x + Math.cos(a) * r, z = C.z + Math.sin(a) * r; L.walls.push({x0: x - 0.38, x1: x + 0.38, z0: z - 0.38, z1: z + 0.38, y0: yb, y1: yb + wallH}); }
    const dw = 2 * WR_IN * Math.sin(door), dh = 4.4; let vLeaves = null;   // door jambs + lintel + two bronze leaves standing open
    for (const s of [-1, 1]) { const j = new THREE.Mesh(new THREE.BoxGeometry(WR_OUT - WR_IN + 0.1, wallH, 0.3), white); j.position.set(C.x + (WR_IN + WR_OUT) / 2 * Math.cos(door), yb + wallH / 2, C.z + s * (dw / 2 + 0.1)); root.add(j);
      // door audit: the leaves now hang on hinges at the inner reveals and swing shut across the doorway (open = against the reveal)
      const piv = new THREE.Group(); piv.position.set(C.x + WR_IN - 0.05, yb, C.z + s * (dw / 2 - 0.06)); root.add(piv);
      const lf = new THREE.Mesh(new THREE.BoxGeometry(dw / 2, dh, 0.08), bronze); lf.position.set(-dw / 4, dh / 2, 0); piv.add(lf); (vLeaves = vLeaves || []).push({piv, closed: -s * Math.PI / 2, open: 0}); }
    if (W3D.addDoor && vLeaves) W3D.addDoor({name: 'vesta', leaves: vLeaves, at: {x: C.x + WR_OUT, y: yb + 1.6, z: C.z}, near: 11, start: 1,
      hit: {x: C.x + WR_IN - 0.1, y: yb + dh / 2, z: C.z, w: 0.4, h: dh, d: dw}, shut: {x0: C.x + WR_IN - 0.15, x1: C.x + WR_IN + 0.05, z0: C.z - dw / 2, z1: C.z + dw / 2, y0: yb, y1: yb + dh}});
    const lt = new THREE.Mesh(new THREE.BoxGeometry(WR_OUT - WR_IN + 0.15, wallH - dh, dw + 0.6), white); lt.position.set(C.x + (WR_IN + WR_OUT) / 2, yb + dh + (wallH - dh) / 2, C.z); root.add(lt);
    const pil = new THREE.CylinderGeometry(0.2, 0.22, CH - 0.4, 10); pil.translate(0, (CH - 0.4) / 2, 0);   // engaged half-columns inside
    instRing(pil, white, 20, WR_IN - 0.06, yb, root, 0, a => Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < door + 0.1);
    const fl = new THREE.Mesh(new THREE.CircleGeometry(WR_IN, seg), new THREE.MeshStandardMaterial({color: 0xd8d0c2, roughness: 0.6})); fl.rotation.x = -Math.PI / 2; fl.position.set(C.x, yb + 0.005, C.z); fl.receiveShadow = true; root.add(fl); }
  // ---- roof: conical bronze tiles over the whole tholos, opening at the apex, flower-like bronze chimney ----
  const ry = ey + 1.5, rr = CR + 0.86, rise = 3.6, hole = 0.55;
  { const tm = new THREE.MeshStandardMaterial({map: tex(tileCanvas(), [24, 6]), metalness: 0.75, roughness: 0.45, envMap: W3D.env || null, side: THREE.DoubleSide});
    const cone = lathe([[rr, 0], [hole, rise]], seg * 2); const m = new THREE.Mesh(cone, tm); m.position.set(C.x, ry - 0.06, C.z); m.castShadow = true; root.add(m);
    const inner = new THREE.Mesh(lathe([[WR_IN, -1.5], [WR_IN, 0], [hole, rise - 0.15]], seg), new THREE.MeshStandardMaterial({color: 0x4a4038, roughness: 0.9, side: THREE.BackSide})); inner.position.set(C.x, ry - 0.06, C.z); root.add(inner);   // smoke-darkened inside
    const ch = lathe([[hole + 0.02, 0], [hole + 0.08, 0.3], [hole + 0.3, 0.55], [hole + 0.45, 0.62], [hole + 0.4, 0.66], [hole + 0.1, 0.5], [hole - 0.02, 0.2]], 16); for (let i = 0, p = ch.attributes.position; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), a = Math.atan2(z, x), k = 1 + 0.18 * Math.max(0, Math.cos(a * 6)) * (p.getY(i) / 0.66); p.setX(i, x * k); p.setZ(i, z * k); } ch.computeVertexNormals();
    const chm = new THREE.Mesh(ch, bronze); chm.material = bronze.clone(); chm.material.side = THREE.DoubleSide; chm.position.set(C.x, ry - 0.06 + rise - 0.05, C.z); root.add(chm); }
  // ---- hearth: round stone focus, ever-burning fire, one warm light, smoke out through the roof opening ----
  { const fy = yb, hearth = lathe([[0, 0.42], [0.62, 0.42], [0.7, 0.36], [0.72, 0.06], [0.8, 0], [0, 0]], 24); const hm = new THREE.Mesh(hearth, new THREE.MeshStandardMaterial({color: 0xb9b2a4, roughness: 0.7})); hm.position.set(C.x, fy, C.z); root.add(hm);
    L.walls.push({x0: C.x - 0.8, x1: C.x + 0.8, z0: C.z - 0.8, z1: C.z + 0.8, y0: fy, y1: fy + 0.45});
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.04, 20), new THREE.MeshBasicMaterial({color: 0x2a1408})); bowl.position.set(C.x, fy + 0.43, C.z); root.add(bowl);
    const ember = new THREE.Mesh(new THREE.CircleGeometry(0.42, 16), new THREE.MeshBasicMaterial({color: 0xff6a20})); ember.rotation.x = -Math.PI / 2; ember.position.set(C.x, fy + 0.455, C.z); root.add(ember);
    const st = soft(), flames = [];
    for (let i = 0; i < 6; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({map: st, color: i < 2 ? 0xffd27a : 0xff7a24, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.85})); sp.position.set(C.x + (Math.random() - 0.5) * 0.4, fy + 0.7, C.z + (Math.random() - 0.5) * 0.4); sp.scale.set(0.5, 0.9, 1); root.add(sp); flames.push({s: sp, ph: Math.random() * 6, x: sp.position.x, z: sp.position.z}); }
    const light = new THREE.PointLight(0xff9a4a, 2.2, 14, 1.6); light.position.set(C.x, fy + 1.1, C.z); root.add(light);
    const NS = lite ? 18 : 36, sg = new THREE.BufferGeometry(), sp = new Float32Array(NS * 3), life = new Float32Array(NS); for (let i = 0; i < NS; i++) { life[i] = Math.random(); }
    sg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); const smoke = new THREE.Points(sg, new THREE.PointsMaterial({map: st, color: 0xbab4ac, size: 1.6, transparent: true, opacity: 0.32, depthWrite: false, sizeAttenuation: true})); smoke.frustumCulled = false; root.add(smoke);
    const H = ry - 0.06 + rise + 6 - (fy + 0.6);   // from the fire up through the opening and ~6 m above the roof
    fire = {flames, light, smoke, sp, life, NS, H, fy, t: 0}; }
  // ---- penus: small recess on the west side screened off with mats (tegetibus saeptus) ----
  { const mc = cnv(64, 64), g = mc.getContext('2d'); g.fillStyle = '#9c8358'; g.fillRect(0, 0, 64, 64); g.strokeStyle = '#6f5a38'; g.lineWidth = 3; for (let i = 0; i < 64; i += 6) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 64); g.stroke(); } for (let j = 0; j < 64; j += 16) { g.strokeStyle = '#5a4628'; g.beginPath(); g.moveTo(0, j); g.lineTo(64, j); g.stroke(); }
    const mat = new THREE.MeshLambertMaterial({map: tex(mc, [3, 2]), side: THREE.DoubleSide}), a0 = Math.PI - 0.42, a1 = Math.PI + 0.42, rs = WR_IN - 1.3;
    const scr = new THREE.Mesh(new THREE.CylinderGeometry(rs, rs, 2.1, 16, 1, true, 0, a1 - a0), mat); scr.rotation.y = Math.PI / 2 - a1;   // curved screen of mats scr.position.set(C.x, yb + 1.05, C.z); root.add(scr);
    for (const a of [a0, a1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.2, 0.1), new THREE.MeshLambertMaterial({color: 0x5e4630})); p.position.set(C.x + Math.cos(a) * rs, yb + 1.1, C.z + Math.sin(a) * rs); root.add(p); }
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.9, 1.6), new THREE.MeshLambertMaterial({color: 0x6e5638})); shelf.position.set(C.x - WR_IN + 0.5, yb + 0.45, C.z); root.add(shelf);
    const jar = new THREE.Mesh(lathe([[0, 0], [0.14, 0.02], [0.2, 0.18], [0.12, 0.36], [0.08, 0.42], [0, 0.42]], 12), new THREE.MeshLambertMaterial({color: 0x9a5a36})); jar.position.set(C.x - WR_IN + 0.5, yb + 0.9, C.z + 0.3); root.add(jar);
    for (let i = 0; i < 6; i++) { const a = a0 + (a1 - a0) * (i + 0.5) / 6, x = C.x + Math.cos(a) * rs, z = C.z + Math.sin(a) * rs; L.walls.push({x0: x - 0.3, x1: x + 0.3, z0: z - 0.3, z1: z + 0.3, y0: yb, y1: yb + 2.1}); } }
  // ---- House of the Vestals: garden court with three water pools, hedged beds, 14 generic robed statues (procedural, no names) on plinths
  //      and warm weathered paving, raised to the house's court level (its colonnades are in vestahouse.js). Merged into a handful of meshes (one per material). ----
  { const cy = W3D.groundAt((COURT.x0 + COURT.x1) / 2, (COURT.z0 + COURT.z1) / 2, -1e4), cx = (COURT.x0 + COURT.x1) / 2, cz = (COURT.z0 + COURT.z1) / 2, w = COURT.x1 - COURT.x0, d = COURT.z1 - COURT.z0, fy = cy + 0.30;
    let sd = 7; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    const bins = {};   // material key -> list of non-indexed geometries already in world space
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3();
    const put = (k, g, x, y, z, ry, rx, rz, s) => { g = g.index ? g.toNonIndexed() : g; for (const n of Object.keys(g.attributes)) if (n !== 'position' && n !== 'normal') g.deleteAttribute(n);
      e.set(rx || 0, ry || 0, rz || 0); q.setFromEuler(e); sc.set(s || 1, s || 1, s || 1); m4.compose(v.set(x, y, z), q, sc); g.applyMatrix4(m4); (bins[k] = bins[k] || []).push(g); };
    const flush = (k, mat, shadow) => { const L2 = bins[k]; if (!L2) return; let n = 0; for (const g of L2) n += g.attributes.position.count; const P = new Float32Array(n * 3), N = new Float32Array(n * 3); let o = 0;
      for (const g of L2) { P.set(g.attributes.position.array, o * 3); N.set(g.attributes.normal.array, o * 3); o += g.attributes.position.count; g.dispose(); }
      const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.BufferAttribute(P, 3)); bg.setAttribute('normal', new THREE.BufferAttribute(N, 3));
      const me = new THREE.Mesh(bg, mat); me.name = 'vestals-' + k; me.castShadow = !!shadow; me.receiveShadow = true; root.add(me); return me; };
    // warm, weathered travertine paving (flagstones with worn joints and stains)
    const pc = cnv(512, 512), pg = pc.getContext('2d'); pg.fillStyle = '#a8977a'; pg.fillRect(0, 0, 512, 512);
    for (let r = 0, y = 0; y < 512; r++) { const hh = 48 + Math.floor(rnd() * 40); for (let x = -Math.floor(rnd() * 60); x < 512;) { const ww = 60 + Math.floor(rnd() * 70), t = rnd();
        pg.fillStyle = 'rgb(' + Math.round(214 + t * 22) + ',' + Math.round(196 + t * 18) + ',' + Math.round(160 + t * 14) + ')'; pg.fillRect(x + 2, y + 2, ww - 4, hh - 4);
        for (let i = 0; i < 26; i++) { pg.fillStyle = 'rgba(' + (rnd() < 0.5 ? '120,100,70' : '250,240,220') + ',' + rnd() * 0.16 + ')'; pg.fillRect(x + rnd() * ww, y + rnd() * hh, 2 + rnd() * 8, 1 + rnd() * 3); }
        if (rnd() < 0.25) { const gr = pg.createRadialGradient(x + ww / 2, y + hh / 2, 2, x + ww / 2, y + hh / 2, ww / 2); gr.addColorStop(0, 'rgba(110,95,60,0.22)'); gr.addColorStop(1, 'rgba(110,95,60,0)'); pg.fillStyle = gr; pg.fillRect(x, y, ww, hh); }
        x += ww; } y += hh; }
    const pave = new THREE.Mesh(new THREE.BoxGeometry(w, 0.3, d), new THREE.MeshStandardMaterial({map: tex(pc, [w / 7, d / 7]), color: 0xd9bf98, roughness: 0.85}));
    pave.position.set(cx, cy + 0.15, cz); pave.receiveShadow = true; root.add(pave); L.floors.push({x0: COURT.x0, x1: COURT.x1, z0: COURT.z0, z1: COURT.z1, y: fy});
    for (const [kw, kd, kx, kz] of [[w, 0.4, cx, COURT.z0], [w, 0.4, cx, COURT.z1], [0.4, d, COURT.x0, cz], [0.4, d, COURT.x1, cz]]) put('stone', new THREE.BoxGeometry(kw, 0.22, kd), kx, fy + 0.11, kz);
    // three pools: low rims around sunken water
    const pools = [[cx - 15, 8], [cx, 13], [cx + 15, 8]], PD = 5;
    for (const [px, pw] of pools) { for (const [bw, bd, bx, bz] of [[pw + 0.6, 0.3, px, cz - PD / 2 - 0.15], [pw + 0.6, 0.3, px, cz + PD / 2 + 0.15], [0.3, PD, px - pw / 2 - 0.15, cz], [0.3, PD, px + pw / 2 + 0.15, cz]]) put('stone', new THREE.BoxGeometry(bw, 0.34, bd), bx, fy + 0.17, bz);
      put('basin', new THREE.BoxGeometry(pw, 0.05, PD), px, fy - 0.02, cz);
      L.walls.push({x0: px - pw / 2 - 0.3, x1: px + pw / 2 + 0.3, z0: cz - PD / 2 - 0.3, z1: cz + PD / 2 + 0.3, y0: cy, y1: cy + 0.4}); }
    const wc = cnv(128, 128), wg2 = wc.getContext('2d'); wg2.fillStyle = '#3c625f'; wg2.fillRect(0, 0, 128, 128); for (let i = 0; i < 160; i++) { wg2.fillStyle = 'rgba(' + (rnd() < 0.5 ? '200,225,220' : '20,40,40') + ',' + rnd() * 0.18 + ')'; wg2.fillRect(rnd() * 128, rnd() * 128, 6 + rnd() * 16, 1); }
    const wt = tex(wc, [3, 1]), wmat = new THREE.MeshStandardMaterial({map: wt, color: 0xffffff, roughness: 0.08, metalness: 0.15, envMap: W3D.env || null, envMapIntensity: 1.0, transparent: true, opacity: 0.9});
    for (const [px, pw] of pools) { const wtm = new THREE.Mesh(new THREE.PlaneGeometry(pw, PD), wmat); wtm.rotation.x = -Math.PI / 2; wtm.position.set(px, fy + 0.22, cz); root.add(wtm); }
    W3D.vestalsWater = wt;
    // hedged garden beds between the pools and the statue rows
    for (const s of [-1, 1]) for (const [px, pw] of pools) { const bz = cz + s * 4.6, bw = pw - 0.4;
      put('soil', new THREE.BoxGeometry(bw, 0.18, 2.0), px, fy + 0.09, bz);
      for (const [hw, hd, hx, hz] of [[bw + 0.5, 0.5, px, bz - 1.25], [bw + 0.5, 0.5, px, bz + 1.25], [0.5, 2.0, px - bw / 2 - 0.0, bz], [0.5, 2.0, px + bw / 2, bz]]) put('hedge', new THREE.BoxGeometry(hw, 0.62, hd), hx, fy + 0.31, hz);
      const n = Math.round(bw * (lite ? 1.1 : 2.2)); for (let i = 0; i < n; i++) put(rnd() < 0.5 ? 'flowerA' : 'flowerB', new THREE.IcosahedronGeometry(0.11 + rnd() * 0.07, lite ? 0 : 1), px - bw / 2 + 0.3 + rnd() * (bw - 0.6), fy + 0.3, bz - 0.7 + rnd() * 1.4, rnd() * 3);
      L.walls.push({x0: px - bw / 2 - 0.3, x1: px + bw / 2 + 0.3, z0: bz - 1.5, z1: bz + 1.5, y0: cy, y1: cy + 0.7}); }
    // 14 plinths with generic robed (veiled) figures: a lathe body with drapery folds, folded arms, a head; slight variety, a few weathered/damaged
    const plist = []; for (let i = 0; i < 7; i++) for (const s of [-1, 1]) plist.push([COURT.x0 + 3 + i * (w - 6) / 6, cz + s * (d / 2 - 1.6), s]);
    const prof = [[0, 0], [0.30, 0], [0.31, 0.06], [0.27, 0.35], [0.22, 0.75], [0.2, 0.95], [0.23, 1.15], [0.25, 1.3], [0.22, 1.38], [0.1, 1.44], [0.08, 1.48], [0, 1.5]];
    const body = new THREE.LatheGeometry(prof.map(p => new THREE.Vector2(p[0], p[1])), lite ? 10 : 16), bp = body.attributes.position;
    for (let i = 0; i < bp.count; i++) { const x = bp.getX(i), y = bp.getY(i), z = bp.getZ(i), a = Math.atan2(z, x), k = y < 1.1 ? 1 + 0.07 * Math.sin(a * 9) * (1.1 - y) : 1; bp.setX(i, x * k); bp.setZ(i, z * k); }
    body.computeVertexNormals();
    const head = new THREE.SphereGeometry(0.115, lite ? 8 : 12, lite ? 6 : 8); head.scale(1, 1.15, 1.05);
    const veil = new THREE.SphereGeometry(0.14, lite ? 8 : 12, lite ? 5 : 7, 0, Math.PI * 2, 0, Math.PI * 0.62); veil.scale(1, 1.25, 1.1);
    const arms = new THREE.CapsuleGeometry(0.075, 0.38, 2, lite ? 6 : 8);
    plist.forEach(([x, z, s], i) => { const ry = (s < 0 ? 0 : Math.PI) + (rnd() - 0.5) * 0.5, sc2 = 1.08 + rnd() * 0.12, y0 = fy + 1.3, dmg = i % 5 === 3;
      put('plinth', new THREE.BoxGeometry(0.9, 1.3, 0.9), x, fy + 0.65, z); put('plinth', new THREE.BoxGeometry(1.04, 0.12, 1.04), x, fy + 1.24, z);
      put('statue', body.clone(), x, y0, z, ry, 0, 0, sc2);
      if (!dmg) { put('statue', head.clone(), x, y0 + 1.6 * sc2, z, ry, 0, 0, sc2); put('statue', veil.clone(), x, y0 + 1.6 * sc2, z - 0.0, ry, 0, 0, sc2); }
      const fx = Math.sin(ry) * 0.2 * sc2, fz = Math.cos(ry) * 0.2 * sc2; put('statue', arms.clone(), x + fx, y0 + 1.05 * sc2, z + fz, ry, 0, Math.PI / 2, sc2);
      L.walls.push({x0: x - 0.5, x1: x + 0.5, z0: z - 0.5, z1: z + 0.5, y0: cy, y1: cy + 3.2}); });
    const tone = c => new THREE.MeshStandardMaterial({color: c, roughness: 0.78, metalness: 0, envMap: W3D.env || null, envMapIntensity: 0.35});
    flush('stone', tone(0xc4ae8a), true); flush('plinth', tone(0xcdbb9c), true); flush('statue', tone(0xd6cab4), true); flush('basin', tone(0x2b3f3d));
    flush('soil', new THREE.MeshLambertMaterial({color: 0x5a4430})); flush('hedge', new THREE.MeshLambertMaterial({color: 0x3f5a2c}), true);
    flush('flowerA', new THREE.MeshLambertMaterial({color: 0xc2475a})); flush('flowerB', new THREE.MeshLambertMaterial({color: 0xe8d36a})); }
  if (lite && W3D.liteTextures) W3D.liteTextures(root);
  W3D.spots = W3D.spots || {}; W3D.spots.vesta = () => W3D.teleportTo(C.x + PR + 9, undefined, C.z, 90);   // in front of the stair, looking west at the door
  document.querySelector('a-scene').setAttribute('vesta-fire', '');
}
AFRAME.registerComponent('vesta-fire', { tick: function (t, dt) { if (!fire || !W3D.active) return; const cam = this.el.camera; if (!cam) return; const p = cam.getWorldPosition(this._v || (this._v = new THREE.Vector3())); const d = Math.hypot(p.x - C.x, p.z - C.z);
  const on = d < 150; fire.light.visible = d < 70; fire.smoke.visible = on; if (!on) return; const s = Math.min(dt || 16, 50) / 1000; fire.t += s;
  for (const f of fire.flames) { const k = 0.75 + 0.25 * Math.sin(fire.t * 9 + f.ph) * Math.sin(fire.t * 5.3 + f.ph * 2); f.s.scale.set(0.45 * k + 0.1, 0.95 * k + 0.2, 1); f.s.position.set(f.x + Math.sin(fire.t * 3 + f.ph) * 0.05, fire.fy + 0.55 + 0.4 * k, f.z); }
  fire.light.intensity = 1.9 + 0.5 * Math.sin(fire.t * 11) * Math.sin(fire.t * 7.1);
  for (let i = 0; i < fire.NS; i++) { fire.life[i] += s / 9; if (fire.life[i] > 1) fire.life[i] -= 1; const l = fire.life[i], r = 0.15 + l * 0.35 + (l > 0.75 ? (l - 0.75) * 6 : 0);
    fire.sp[i * 3] = C.x + Math.sin(i * 2.4 + fire.t * 0.6) * r; fire.sp[i * 3 + 1] = fire.fy + 0.8 + l * fire.H; fire.sp[i * 3 + 2] = C.z + Math.cos(i * 2.4 + fire.t * 0.5) * r; }
  fire.smoke.geometry.attributes.position.needsUpdate = true; } });
const iv = setInterval(() => { if (window.W3D_READY && W3D.root && W3D.lib && W3D.groundAt && W3D.M) { clearInterval(iv); try { build(); } catch (e) { console.warn('vesta', e); } } }, 400);
})();
