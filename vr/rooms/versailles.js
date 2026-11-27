// Château de Versailles interiors (T-16 phase 2, Nov 27 2026) - FP_ROOMS rooms inside the Fowling Pond page (contract: vr/ROOMS.md).
// One module, four rooms: 'vers-palace' (Hall of Mirrors 73 x 10.5 x 12.3 m with 17 windows facing 17 mirrored arches, the War and Peace
// salons, the King's State Apartment Hercules -> Abundance -> Venus -> Diana -> Mars -> Mercury -> Apollo, the Queen's apartment, and
// Louis XIV's bedchamber behind the centre of the Hall with its gilded balustrade and bed alcove), 'vers-chapel', 'vers-opera', 'vers-jdp'
// (Jeu de Paume, the Tennis Court Oath hall). All procedural (canvas textures, merged walls, instanced chandeliers / columns), no downloads.
// Mirrors: one cube-camera snapshot of the hall at mount (phones: a painted gradient), so they read as mirrors at no per-frame cost.
const F = window.FP_ROOMS;
const T0 = window.THREE;
function tex(w, h, f, rep) { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); const t = new T0.CanvasTexture(c); t.colorSpace = T0.SRGBColorSpace;
  t.wrapS = t.wrapT = T0.RepeatWrapping; t.anisotropy = 4; return t; }
const TX = {};
function T(name) { if (TX[name]) return TX[name]; const mk = {
  parquet: () => tex(256, 256, (g, w, h) => { g.fillStyle = '#7a4a26'; g.fillRect(0, 0, w, h); g.strokeStyle = '#5a3418'; g.lineWidth = 3; g.strokeRect(4, 4, w - 8, h - 8);
    g.save(); g.translate(w / 2, h / 2); g.rotate(Math.PI / 4); for (let i = -200; i < 200; i += 22) { g.fillStyle = i % 44 ? '#8a5530' : '#6c3f1f'; g.fillRect(i, -200, 20, 400); } g.restore();
    g.strokeStyle = '#4a2a12'; g.lineWidth = 6; g.strokeRect(0, 0, w, h); }),
  marbleFloor: () => tex(128, 128, (g, w, h) => { for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { g.fillStyle = (x + y) % 2 ? '#3c2a2a' : '#e9e3d6'; g.fillRect(x * 64, y * 64, 64, 64); } g.strokeStyle = '#b0a080'; g.strokeRect(0, 0, w, h); }),
  // Hall of Mirrors garden wall: one bay (4.3 m x 12.3 m) - arched window between paired marble pilasters, gilt trophies above
  winBay: () => tex(128, 384, (g, w, h) => { const Y = m => h - m * h / 12.3; g.fillStyle = '#e8dcc3'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#b7a37e'; g.fillRect(0, 0, 14, h); g.fillRect(w - 14, 0, 14, h); g.fillStyle = '#d4af37'; g.fillRect(0, Y(9.2), w, 6); g.fillRect(2, Y(9.0), 10, Y(0.5) - Y(9.0)); g.fillRect(w - 12, Y(9.0), 10, Y(0.5) - Y(9.0));
    const gr = g.createLinearGradient(0, Y(8.2), 0, Y(0.6)); gr.addColorStop(0, '#dff0ff'); gr.addColorStop(1, '#b9d6ee'); g.fillStyle = gr; g.fillRect(28, Y(7.2), w - 56, Y(0.6) - Y(7.2)); g.beginPath(); g.arc(w / 2, Y(7.2), (w - 56) / 2, Math.PI, 0); g.fill();
    g.strokeStyle = '#f7f1e2'; g.lineWidth = 3; for (let y = 1.2; y < 7.2; y += 1.1) { g.beginPath(); g.moveTo(28, Y(y)); g.lineTo(w - 28, Y(y)); g.stroke(); } g.beginPath(); g.moveTo(w / 2, Y(8.2)); g.lineTo(w / 2, Y(0.6)); g.stroke();
    g.fillStyle = '#c9a43c'; g.beginPath(); g.arc(w / 2, Y(10.6), 16, 0, 7); g.fill(); g.fillStyle = '#7a8a5a'; g.fillRect(0, Y(0.6), w, Y(0) - Y(0.6)); }),
  // mirror wall bay: gilt frame round an arched field of 21 mirror panes (alpha = 0 on the panes: the mirror mesh shows through)
  mirBay: () => tex(128, 384, (g, w, h) => { const Y = m => h - m * h / 12.3; g.fillStyle = '#e8dcc3'; g.fillRect(0, 0, w, h); g.fillStyle = '#b7a37e'; g.fillRect(0, 0, 14, h); g.fillRect(w - 14, 0, 14, h);
    g.fillStyle = '#d4af37'; g.fillRect(0, Y(9.2), w, 6); g.fillRect(22, Y(7.5), w - 44, Y(0.5) - Y(7.5)); g.beginPath(); g.arc(w / 2, Y(7.5), (w - 44) / 2, Math.PI, 0); g.fill();
    g.globalCompositeOperation = 'destination-out'; for (let r = 0; r < 7; r++) for (let c = 0; c < 3; c++) g.fillRect(30 + c * 23.5, Y(0.9 + (r + 1) * 0.95) + 2, 21, Y(0) - Y(0.95) - 3);
    g.beginPath(); g.arc(w / 2, Y(7.6), (w - 62) / 2, Math.PI, 0); g.fill(); g.globalCompositeOperation = 'source-over';
    g.fillStyle = '#c9a43c'; g.beginPath(); g.arc(w / 2, Y(10.6), 16, 0, 7); g.fill(); g.fillStyle = '#7a8a5a'; g.fillRect(0, Y(0.6), w, Y(0) - Y(0.6)); }),
  // painted vault: gilt compartments with Le Brun-style sky scenes suggested by soft colour fields
  vault: () => tex(512, 256, (g, w, h) => { g.fillStyle = '#c9a54a'; g.fillRect(0, 0, w, h);
    const sc = (x, y, ww, hh) => { const gr = g.createRadialGradient(x + ww / 2, y + hh / 2, 4, x + ww / 2, y + hh / 2, ww / 1.6); gr.addColorStop(0, '#f3dcb0'); gr.addColorStop(0.5, '#8fb3d8'); gr.addColorStop(1, '#6c5a3a'); g.fillStyle = gr; g.fillRect(x, y, ww, hh);
      for (let i = 0; i < 9; i++) { g.fillStyle = ['#a33b2a', '#2f4f8a', '#d9c27a', '#e7c9a9', '#5b3c26'][i % 5]; g.beginPath(); g.ellipse(x + 12 + Math.random() * (ww - 24), y + 10 + Math.random() * (hh - 20), 5 + Math.random() * 7, 3 + Math.random() * 5, Math.random() * 3, 0, 7); g.fill(); } };
    sc(14, 60, 180, 136); sc(318, 60, 180, 136); sc(214, 20, 84, 216); g.strokeStyle = '#f1d27a'; g.lineWidth = 6; [[14, 60, 180, 136], [318, 60, 180, 136], [214, 20, 84, 216]].forEach(r => g.strokeRect(...r)); }),
  ceil: () => tex(256, 256, (g, w, h) => { g.fillStyle = '#c9a54a'; g.fillRect(0, 0, w, h); const gr = g.createRadialGradient(128, 128, 10, 128, 128, 110); gr.addColorStop(0, '#f5e3bd'); gr.addColorStop(0.6, '#86a9cf'); gr.addColorStop(1, '#5f4f33'); g.fillStyle = gr;
    g.beginPath(); g.ellipse(128, 128, 96, 80, 0, 0, 7); g.fill(); g.strokeStyle = '#f1d27a'; g.lineWidth = 8; g.stroke(); for (let i = 0; i < 6; i++) { g.fillStyle = ['#a33b2a', '#2f4f8a', '#e7c9a9'][i % 3]; g.beginPath(); g.ellipse(80 + Math.random() * 96, 90 + Math.random() * 76, 9, 6, Math.random() * 3, 0, 7); g.fill(); } }),
  // state salon wall: marble panels (vertex colour tints each salon), gilt frame, a painting
  salon: () => tex(256, 256, (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); g.fillStyle = '#d8d0c8'; g.fillRect(0, h - 30, w, 30); g.fillStyle = '#d4af37'; g.fillRect(0, 26, w, 6); g.fillRect(0, h - 34, w, 4);
    g.strokeStyle = '#d4af37'; g.lineWidth = 5; g.strokeRect(40, 60, w - 80, h - 120); g.fillStyle = '#4a3a2a'; g.fillRect(48, 68, w - 96, h - 136);
    const gr = g.createLinearGradient(0, 68, 0, h - 68); gr.addColorStop(0, '#9fb6cf'); gr.addColorStop(1, '#6b5a3a'); g.fillStyle = gr; g.fillRect(52, 72, w - 104, h - 144);
    for (let i = 0; i < 5; i++) { g.fillStyle = ['#b03a2e', '#e8cfa6', '#2f4f8a', '#d9c27a', '#3a2a1a'][i]; g.beginPath(); g.ellipse(80 + i * 22, 150 - (i % 2) * 18, 9, 22, 0, 0, 7); g.fill(); } }),
  brocade: () => tex(128, 128, (g, w, h) => { g.fillStyle = '#8c1c1c'; g.fillRect(0, 0, w, h); g.fillStyle = '#d4af37'; for (let y = 0; y < h; y += 32) for (let x = (y / 32 % 2) * 16; x < w; x += 32) { g.beginPath(); g.ellipse(x + 8, y + 8, 5, 9, 0, 0, 7); g.fill(); } }),
  stoneWall: () => tex(128, 128, (g, w, h) => { g.fillStyle = '#efe9dc'; g.fillRect(0, 0, w, h); g.strokeStyle = '#d6cdb9'; for (let y = 0; y < h; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); for (let x = (y / 32 % 2) * 32; x < w; x += 64) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 32); g.stroke(); } } }),
  plaster: () => tex(64, 64, (g, w, h) => { g.fillStyle = '#ece6d8'; g.fillRect(0, 0, w, h); for (let i = 0; i < 200; i++) { g.fillStyle = Math.random() < 0.5 ? '#e4ddcc' : '#f3eee2'; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); } }),
  opera: () => tex(128, 128, (g, w, h) => { g.fillStyle = '#2d4f8e'; g.fillRect(0, 0, w, h); g.fillStyle = '#d4af37'; g.fillRect(0, 0, w, 8); g.fillRect(0, h - 10, w, 10); for (let x = 0; x < w; x += 32) g.fillRect(x, 0, 4, h); g.fillStyle = '#e9dcc0'; g.fillRect(0, h - 26, w, 16); }),
  curtain: () => tex(128, 128, (g, w, h) => { for (let x = 0; x < w; x++) { const v = 0.6 + 0.4 * Math.sin(x / 6); g.fillStyle = 'rgb(' + (150 * v | 0) + ',' + (20 * v | 0) + ',' + (30 * v | 0) + ')'; g.fillRect(x, 0, 1, h); } g.fillStyle = '#d4af37'; g.fillRect(0, h - 10, w, 10); })
  }[name]; TX[name] = mk(); return TX[name]; }
function label(txt, sub) { return tex(512, sub ? 160 : 96, (g, w, h) => { g.fillStyle = 'rgba(25,18,8,0.88)'; g.fillRect(0, 0, w, h); g.strokeStyle = '#d4af37'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
  g.fillStyle = '#ffe9a8'; g.font = 'bold 40px Georgia, serif'; g.textAlign = 'center'; g.fillText(txt, w / 2, 58); if (sub) { g.font = '24px Georgia, serif'; g.fillStyle = '#f3e3bd'; sub.split('\n').forEach((l, i) => g.fillText(l, w / 2, 100 + i * 28)); } }); }

/* ---------- builder: inward-facing wall quads with door gaps, floors, ceilings; walls double as collision segments ---------- */
function Kit(THREE) {
  const B = {}, segs = [];
  const buf = k => B[k] = B[k] || {p: [], uv: [], c: [], i: []};
  function quad(k, a, b, c, d, u0, u1, v0, v1, col) { const Q = buf(k), n = Q.p.length / 3; Q.p.push(...a, ...b, ...c, ...d); Q.uv.push(u0, v0, u1, v0, u1, v1, u0, v1);
    const cc = new THREE.Color(col === undefined ? 0xffffff : col); for (let i = 0; i < 4; i++) Q.c.push(cc.r, cc.g, cc.b); Q.i.push(n, n + 1, n + 2, n, n + 2, n + 3); }
  // wall from (x0,z0) to (x1,z1), front face toward (-dz, +dx) of its direction; gaps: [[t0,t1,top]] along the wall (metres from start)
  function wall(k, x0, z0, x1, z1, h, bay, sty, gaps, col, noCollide) { const L = Math.hypot(x1 - x0, z1 - z0), ux = (x1 - x0) / L, uz = (z1 - z0) / L; gaps = (gaps || []).slice().sort((a, b) => a[0] - b[0]);
    const P = (t, y) => [x0 + ux * t, y, z0 + uz * t]; let t = 0; const piece = (ta, tb, ya, yb) => quad(k, P(ta, ya), P(tb, ya), P(tb, yb), P(ta, yb), ta / bay, tb / bay, ya / sty, yb / sty, col);
    for (const [g0, g1, top] of gaps) { if (g0 > t) piece(t, g0, 0, h); piece(g0, g1, top, h); if (!noCollide && g0 > t) segs.push([P(t, 0), P(g0, 0)]); t = g1; }
    if (t < L) { piece(t, L, 0, h); if (!noCollide) segs.push([P(t, 0), P(L, 0)]); } }
  function floor(k, x0, z0, x1, z1, y, tile, up, col) { const a = [x0, y, z1], b = [x1, y, z1], c = [x1, y, z0], d = [x0, y, z0];
    if (up) quad(k, a, b, c, d, x0 / tile, x1 / tile, z1 / tile, z0 / tile, col); else quad(k, d, c, b, a, x0 / tile, x1 / tile, z0 / tile, z1 / tile, col); }
  // a closed room, fronts facing in (S = z1 side, N = z0, E = x1, W = x0); doors: {N|S|E|W: [[t0,t1,top]]} in metres along each wall
  function room(k, x0, z0, x1, z1, h, bay, sty, doors, col) { doors = doors || {}; const D = s => (doors[s] || []).map(([a, b, top]) => [a, b, top || 4.6]);
    wall(k, x1, z1, x0, z1, h, bay, sty, D('S'), col); wall(k, x0, z1, x0, z0, h, bay, sty, D('W'), col); wall(k, x0, z0, x1, z0, h, bay, sty, D('N'), col); wall(k, x1, z0, x1, z1, h, bay, sty, D('E'), col); }
  function meshes(mats, parent) { for (const k in B) { const Q = B[k]; if (!Q.i.length || !mats[k]) continue; const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(Q.p, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(Q.uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(Q.c, 3)); g.setIndex(Q.i); g.computeVertexNormals(); const m = new THREE.Mesh(g, mats[k]); m.name = 'v-' + k; parent.add(m); } }
  function blocked(x, z) { for (const [a, b] of segs) { const dx = b[0] - a[0], dz = b[2] - a[2], L2 = dx * dx + dz * dz || 1; let t = ((x - a[0]) * dx + (z - a[2]) * dz) / L2; t = Math.max(0, Math.min(1, t));
      if (Math.hypot(x - a[0] - t * dx, z - a[2] - t * dz) < 0.35) return true; } return false; }
  return {quad, wall, floor, room, meshes, blocked, segs};
}
function lamb(THREE, map, o) { return new THREE.MeshLambertMaterial(Object.assign({map, vertexColors: true}, o || {})); }   // Kit meshes (they carry tint colours)
function plain(THREE, map) { return new THREE.MeshLambertMaterial({map}); }   // ordinary geometry (no colour attribute)
function chandeliers(THREE, parent, pts, scale) {   // crystal chandelier: gilt ring + crystal drops + glowing candles, instanced
  const g1 = new THREE.TorusGeometry(0.9, 0.08, 4, 12); g1.rotateX(Math.PI / 2); const g2 = new THREE.OctahedronGeometry(0.5, 0); g2.scale(1, 2.2, 1); g2.translate(0, -0.6, 0);
  const g3 = new THREE.ConeGeometry(0.75, 1.4, 8, 1, true); g3.translate(0, 0.4, 0);
  const add = (geo, mat) => { const im = new THREE.InstancedMesh(geo, mat, pts.length), m4 = new THREE.Matrix4(); pts.forEach((p, k) => { m4.makeScale(scale, scale, scale); m4.setPosition(p[0], p[1], p[2]); im.setMatrixAt(k, m4); }); parent.add(im); };
  add(g1, new THREE.MeshStandardMaterial({color: 0xd4af37, metalness: 0.8, roughness: 0.3, emissive: 0x2a1c00}));
  add(g2, new THREE.MeshBasicMaterial({color: 0xfff6dc, transparent: true, opacity: 0.85}));
  add(g3, new THREE.MeshBasicMaterial({color: 0xffe2a0, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false}));
}
function plaque(THREE, parent, txt, sub, x, y, z, ry, w) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w || 2.4, (w || 2.4) * (sub ? 160 : 96) / 512), new THREE.MeshBasicMaterial({map: label(txt, sub), transparent: true}));
  m.position.set(x, y, z); m.rotation.y = ry || 0; parent.add(m); return m; }
function exitBtn(THREE, rootEl, ctx, txt, x, y, z, ry, spot) { const b = document.createElement('a-plane'); b.setAttribute('class', 'btn'); b.setAttribute('width', 1.7); b.setAttribute('height', 0.34);
  b.setAttribute('position', x + ' ' + y + ' ' + z); b.setAttribute('rotation', '0 ' + (ry || 0) + ' 0'); b.setAttribute('material', 'shader:flat;color:#FFD700');
  const t = document.createElement('a-text'); t.setAttribute('value', txt); t.setAttribute('align', 'center'); t.setAttribute('color', '#111'); t.setAttribute('width', 2.6); t.setAttribute('position', '0 0 0.01'); b.appendChild(t);
  b.addEventListener('click', () => ctx.leave({spot})); rootEl.appendChild(b); return b; }
function lights(THREE, g, sky, ground, k) { g.add(new THREE.HemisphereLight(sky, ground, k || 1.25)); const d = new THREE.DirectionalLight(0xfff1d6, 0.7); d.position.set(10, 20, 6); g.add(d); }
function snapMirror(THREE, sceneEl, g, pos, lite) {   // one cube-camera snapshot as the mirrors' env map
  if (lite) { const t = tex(64, 64, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#d8b860'); gr.addColorStop(0.5, '#f3e7c8'); gr.addColorStop(1, '#6a4a2a'); c.fillStyle = gr; c.fillRect(0, 0, w, h); });
    t.mapping = THREE.EquirectangularReflectionMapping; return Promise.resolve(t); }
  const rt = new THREE.WebGLCubeRenderTarget(256, {generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter}); const cc = new THREE.CubeCamera(0.3, 200, rt); cc.position.copy(pos); g.add(cc);
  return new Promise(res => setTimeout(() => { try { g.updateMatrixWorld(true); cc.update(sceneEl.renderer, sceneEl.object3D); } catch (e) {} res(rt.texture); }, 600)); }

/* ================= vers-palace ================= */
// x: + toward the gardens (west); z: + north. Hall of Mirrors x 0..10.5, z -36.5..36.5. Salons north (z 36.5..47) and south (z -47..-36.5).
const HW = 10.5, HL = 36.5, HH = 12.3, SB = 10.5;
const PAL = {
  env: {background: 0x0b0906, fog: null, far: 600},
  spawn: {x: 5.25, y: 0, z: 0, yaw: 90},
  SPAWNS: {mirrors: [7.5, 0, 90], bedroom: [-1.6, 0, 90], hercules: [-65, 41.75, -90], queen: [-34, -41.75, -90]},
  kit: null,
  ground() { return 0; },
  blocked(x, z) { return PAL.kit ? PAL.kit.blocked(x, z) : false; },
  async mount(sceneEl, rootEl, ctx) {
    const THREE = ctx.THREE, g = new THREE.Group(); this.g = g; rootEl.object3D.add(g); const K = this.kit = Kit(THREE);
    const at = (ctx.opts && ctx.opts.at) || 'mirrors', sp = this.SPAWNS[at] || this.SPAWNS.mirrors; this.spawn = {x: sp[0], y: 0, z: sp[1], yaw: sp[2]};
    lights(THREE, g, 0xfff4e0, 0x6a5030, 1.3);
    /* Hall of Mirrors: 17 window bays on the garden wall (x = HW), 17 mirror bays opposite (x = 0); door in the centre mirror bay to the King's chamber */
    const bay = (2 * HL) / 17;
    K.wall('win', HW, -HL, HW, HL, HH, bay, HH, [], 0xffffff);
    K.wall('mir', 0, HL, 0, -HL, HH, bay, HH, [[HL - 1.3, HL + 1.3, 4.6]], 0xffffff);
    K.wall('salon', HW, HL, 0, HL, HH + 0.5, 10.5, HH, [[3.75, 6.75, 6]], 0xd9c6a0); K.wall('salon', 0, -HL, HW, -HL, HH + 0.5, 10.5, HH, [[3.75, 6.75, 6]], 0xd9c6a0);
    K.floor('parquet', 0, -HL, HW, HL, 0, 3.5, true);
    // barrel vault (12 segments) with the painted ceiling
    { const N = 12, R = HW / 2, y0 = HH - 2.2; for (let i = 0; i < N; i++) { const a0 = Math.PI * i / N, a1 = Math.PI * (i + 1) / N, P = (a, z) => [HW / 2 + Math.cos(a) * R, y0 + Math.sin(a) * 2.6, z];
      K.quad('vault', P(a0, HL), P(a1, HL), P(a1, -HL), P(a0, -HL), i / N, (i + 1) / N, 0, 6); } }
    // mirror panes behind the mirror-bay texture (alpha holes) - a metal plane with the snapshot env map
    const mirM = new THREE.MeshStandardMaterial({color: 0xe8e2d0, metalness: 1, roughness: 0.06});
    for (const sg of [-1, 1]) { const L = HL - 1.3, pm = new THREE.Mesh(new THREE.PlaneGeometry(L, 8.6), mirM); pm.rotation.y = Math.PI / 2; pm.position.set(-0.04, 4.3, sg * (1.3 + L / 2)); g.add(pm); }
    /* War Salon (north end) and Peace Salon (south end): 10.5 m squares, marble and gilt, painted domes */
    K.room('salon', 0, HL, HW, HL + SB, HH - 1, 10.5, HH - 1, {N: [[3.75, 6.75, 6]], W: [[3.75, 6.75]]}, 0xb7c7a0);   // War: green marble (W wall -> Apollo salon)
    K.room('salon', 0, -HL - SB, HW, -HL, HH - 1, 10.5, HH - 1, {S: [[3.75, 6.75, 6]], W: [[3.75, 6.75]]}, 0xb7c7a0);  // Peace
    K.floor('marble', 0, HL, HW, HL + SB, 0, 2, true); K.floor('marble', 0, -HL - SB, HW, -HL, 0, 2, true);
    K.floor('ceil', 0, HL, HW, HL + SB, HH - 1, 10.5, false); K.floor('ceil', 0, -HL - SB, HW, -HL, HH - 1, 10.5, false);
    /* King's State Apartment, west -> east from the War Salon: Apollo, Mercury, Mars, Diana, Venus, Abundance, Hercules (each 9.5 m) */
    const KS = [['Apollo Salon', 'The throne room. Louis XIV gave audiences here\nfrom a silver throne under a canopy.', 0xc7a8a0], ['Mercury Salon', 'The state bedchamber of the King\'s Grand Apartment;\nLouis XIV lay in state here in 1715.', 0xd9c3a0],
      ['Mars Salon', 'Guard room, later music and dancing\nduring the evening "apartments".', 0xc79a90], ['Diana Salon', 'Billiards room of the young Louis XIV.', 0xc0c8d8], ['Venus Salon', 'Refreshments on apartment evenings;\nstatue of Louis XIV as a Roman emperor.', 0xd6b8c8],
      ['Salon of Abundance', 'Coffee and drinks; it opened onto\nthe King\'s Cabinet of Curiosities.', 0xc8d0b0], ['Hercules Salon', 'Finished 1736; Veronese\'s "Meal at the House\nof Simon" and Lemoyne\'s Apotheosis of Hercules.', 0xe0d0b8]];
    const SW = 9.5; KS.forEach(([nm, sub, col], i) => { const x1 = -i * SW, x0 = x1 - SW, last = i === KS.length - 1;
      K.room('salon', x0, HL, x1, HL + SB, 9, 9.5, 9, {E: [[3.75, 6.75]], W: last ? [] : [[3.75, 6.75]]}, col);
      K.floor('parquet', x0, HL, x1, HL + SB, 0, 3.5, true); K.floor('ceil', x0, HL, x1, HL + SB, 9, 9.5, false, col);
      plaque(THREE, g, nm, sub, x0 + SW / 2, 2.6, HL + SB - 0.06, Math.PI, 2.6); });
    // Hercules: exit to the courtyard side, and the Apollo throne on a dais
    { const th = new THREE.Group(), gold = new THREE.MeshStandardMaterial({color: 0xd4af37, metalness: 0.85, roughness: 0.3}), red = plain(THREE, T('brocade'));
      const d = new THREE.Mesh(new THREE.BoxGeometry(3, 0.4, 3), red); d.position.y = 0.2; th.add(d); const c = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.4, 0.9), gold); c.position.set(0, 1.6, 0.6); th.add(c);
      const cn = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.3, 2.2), red); cn.position.set(0, 5.2, 0.8); th.add(cn); th.position.set(-SW / 2, 0, HL + SB - 2.2); g.add(th); }
    /* Queen's apartment, west -> east from the Peace Salon: bedchamber, Nobles salon, antechamber of the Grand Couvert, guard room */
    const QS = [["Queen's Bedchamber", 'Nineteen royal children were born here;\nMarie-Antoinette fled through its hidden door in 1789.', 0xe6c8c8], ['Salon of the Nobles', 'Where the Queen held her formal audiences.', 0xb8d0c0],
      ['Antechamber of the Grand Couvert', 'The King and Queen dined here in public.', 0xd8c0a0], ["Queen's Guard Room", 'The Queen\'s guards; marble walls by Le Brun.', 0xc8b8a8]];
    QS.forEach(([nm, sub, col], i) => { const x1 = -i * SW, x0 = x1 - SW; K.room('salon', x0, -HL - SB, x1, -HL, 9, 9.5, 9, {E: [[3.75, 6.75]], W: i === QS.length - 1 ? [] : [[3.75, 6.75]]}, col);
      K.floor('parquet', x0, -HL - SB, x1, -HL, 0, 3.5, true); K.floor('ceil', x0, -HL - SB, x1, -HL, 9, 9.5, false, col); plaque(THREE, g, nm, sub, x0 + SW / 2, 2.6, -HL - SB + 0.06, 0, 2.6); });
    { const bed = new THREE.Group(), red = plain(THREE, T('brocade')); const b = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.9, 2.4), red); b.position.y = 0.45; bed.add(b);
      const can = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.5, 2.8), red); can.position.y = 4.8; bed.add(can); bed.position.set(-SW / 2, 0, -HL - SB + 1.6); g.add(bed); }
    /* Louis XIV's bedchamber (behind the centre of the Hall, facing the Marble Court): gilded balustrade, bed alcove under a canopy */
    { const x0 = -10, x1 = 0, z0 = -4.75, z1 = 4.75; K.room('salon', x0, z0, x1, z1, 10, 9.5, 10, {E: [[3.45, 6.05, 4.6]]}, 0xf0dcc0);
      K.floor('parquet', x0, z0, x1, z1, 0, 3.5, true); K.floor('ceil', x0, z0, x1, z1, 10, 9.5, false, 0xf0e0c0);
      const gold = new THREE.MeshStandardMaterial({color: 0xd4af37, metalness: 0.85, roughness: 0.28}), red = plain(THREE, T('brocade'));
      // alcove on the west wall (x0): gilded columns, bed, crimson-and-gold canopy and hangings
      const alc = new THREE.Group(); alc.position.set(x0 + 0.1, 0, 0); g.add(alc);
      const bed = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.0, 2.0), red); bed.position.set(1.15, 0.5, 0); alc.add(bed);
      const can = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.6, 2.6), red); can.position.set(1.2, 4.6, 0); alc.add(can);
      for (const zz of [-1.2, 1.2]) { const cu = new THREE.Mesh(new THREE.BoxGeometry(0.15, 3.8, 0.9), red); cu.position.set(2.25, 2.6, zz * 1.1); alc.add(cu); }
      const plumes = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.7, 6), new THREE.MeshLambertMaterial({color: 0xffffff})); for (const [xx, zz] of [[0.2, -1.1], [0.2, 1.1], [2.2, -1.1], [2.2, 1.1]]) { const pl = plumes.clone(); pl.position.set(xx, 5.25, zz); alc.add(pl); }
      for (const zz of [-3.3, 3.3]) { const col = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 7.5, 10), gold); col.position.set(0.4, 3.75, zz); alc.add(col); }
      const gloire = new THREE.Mesh(new THREE.CircleGeometry(1.2, 16), gold); gloire.position.set(0.06, 7.6, 0); gloire.rotation.y = Math.PI / 2; alc.add(gloire);
      // the gilded balustrade separating the alcove from the room (instanced balusters + rail)
      const bx = x0 + 3.3, n = 22, im = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.05, 0.08, 0.95, 6), gold, n), m4 = new THREE.Matrix4();
      for (let i = 0; i < n; i++) { m4.makeTranslation(bx, 0.48, -3.6 + i * 7.2 / (n - 1)); im.setMatrixAt(i, m4); } g.add(im);
      for (const yy of [0.98, 0.04]) { const rail = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 7.4), gold); rail.position.set(bx, yy, 0); g.add(rail); }
      plaque(THREE, g, "The King's Bedchamber", 'Louis XIV\'s room from 1701, at the centre of the palace.\nThe lever and coucher ceremonies; he died here in 1715.', -5, 2.8, z1 - 0.06, Math.PI, 3);
      exitBtn(THREE, rootEl, ctx, 'Out to the Marble Court', -9.85, 1.5, z0 + 2, 90, 'versailles-ret-bedroom'); }
    // window wall emissive daylight + plaques, exits
    plaque(THREE, g, 'The Hall of Mirrors', '73 m long, 357 mirrors in 17 arches facing 17 windows.\nLe Brun\'s vault: the reign of Louis XIV. Treaty of Versailles, 1919.', 0.2, 2.6, 6.2, Math.PI / 2, 3.2);
    exitBtn(THREE, rootEl, ctx, 'Out to the gardens', HW - 0.25, 1.4, -2.2, -90, 'versailles-ret-mirrors');
    exitBtn(THREE, rootEl, ctx, 'Out to the courtyard', -6 * SW - SW + 0.25, 1.5, HL + SB / 2, 90, 'versailles-ret-hercules');
    exitBtn(THREE, rootEl, ctx, 'Out to the gardens', -3 * SW - SW + 0.25, 1.5, -HL - SB / 2, 90, 'versailles-ret-queen');
    /* chandeliers: 3 rows along the Hall (the real one has 17 large + 26 small), 1 per salon */
    const ch = []; for (let i = 0; i < 17; i++) { const z = -HL + bay * (i + 0.5); ch.push([HW / 2, 8.6, z]); if (i % 2 === 0) { ch.push([2.4, 7.4, z]); ch.push([HW - 2.4, 7.4, z]); } }
    ch.push([HW / 2, 8, HL + SB / 2], [HW / 2, 8, -HL - SB / 2], [-5, 7.2, 0]); KS.forEach((_, i) => ch.push([-i * SW - SW / 2, 6.6, HL + SB / 2])); QS.forEach((_, i) => ch.push([-i * SW - SW / 2, 6.6, -HL - SB / 2]));
    chandeliers(THREE, g, ch, 1.0);
    // gilt candelabra (girandoles) on the pier between the arches: instanced
    { const n = 16, im = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.12, 0.35, 2.4, 6), new THREE.MeshStandardMaterial({color: 0xd4af37, metalness: 0.85, roughness: 0.3}), n * 2), m4 = new THREE.Matrix4();
      for (let i = 0; i < n; i++) { const z = -HL + bay * (i + 1); m4.makeTranslation(0.6, 1.2, z); im.setMatrixAt(2 * i, m4); m4.makeTranslation(HW - 0.6, 1.2, z); im.setMatrixAt(2 * i + 1, m4); } g.add(im); }
    const mats = {win: new THREE.MeshLambertMaterial({map: T('winBay'), vertexColors: true, emissive: 0x2a2620}), mir: lamb(THREE, T('mirBay'), {transparent: false, alphaTest: 0.5}), salon: lamb(THREE, T('salon')),
      parquet: lamb(THREE, T('parquet')), marble: lamb(THREE, T('marbleFloor')), vault: lamb(THREE, T('vault'), {side: THREE.DoubleSide}), ceil: lamb(THREE, T('ceil'))};
    mats.win.emissiveMap = T('winBay');
    K.meshes(mats, g);
    const env = await snapMirror(THREE, sceneEl, g, new THREE.Vector3(HW / 2 + 0.5, 1.7, 0), ctx.lite);
    mirM.envMap = env; mirM.needsUpdate = true; this.env = env;
  },
  unmount() { if (this.env && this.env.dispose) this.env.dispose(); this.g = null; this.kit = null; }
};

/* ================= vers-chapel ================= */
const CHAP = {
  env: {background: 0x0b0906, fog: null, far: 300}, spawn: {x: 0, y: 0, z: 17, yaw: 0}, kit: null,
  ground() { return 0; }, blocked(x, z) { return (CHAP.kit && CHAP.kit.blocked(x, z)) || CHAP.cols.some(([a, b]) => Math.hypot(x - a, z - b) < 0.9); }, cols: [],
  async mount(sceneEl, rootEl, ctx) {
    const THREE = ctx.THREE, g = new THREE.Group(); this.g = g; rootEl.object3D.add(g); const K = this.kit = Kit(THREE); lights(THREE, g, 0xfffaf0, 0x8a7a60, 1.4);
    // nave 36 x 17 m (z -18..18, x -8.5..8.5), 25 m to the vault; apse at the altar end (z = -18); white stone, gilt, painted vault
    K.room('stone', -8.5, -18, 8.5, 18, 18, 4, 4, {S: [[7, 10, 4]]}); K.floor('marble', -8.5, -18, 8.5, 18, 0, 2, true);
    { const N = 10, R = 8.5; for (let i = 0; i < N; i++) { const a0 = Math.PI * i / N, a1 = Math.PI * (i + 1) / N, P = (a, z) => [Math.cos(a) * R, 18 + Math.sin(a) * 7, z]; K.quad('vault', P(a0, 18), P(a1, 18), P(a1, -18), P(a0, -18), i / N, (i + 1) / N, 0, 3); }
      for (const [z, s] of [[18, -1], [-18, 1]]) for (let i = 0; i < N; i++) { const a0 = Math.PI * i / N, a1 = Math.PI * (i + 1) / N; const P = a => [Math.cos(a) * R, 18 + Math.sin(a) * 7, z];
        if (s > 0) K.quad('stone', [P(a0)[0], 18, z], [P(a1)[0], 18, z], P(a1), P(a0), 0, 1, 0, 1); else K.quad('stone', [P(a1)[0], 18, z], [P(a0)[0], 18, z], P(a0), P(a1), 0, 1, 0, 1); } }
    // gallery floor (royal tribune level) along both sides and the west end at 7.5 m, on arcaded piers; Corinthian columns above
    const gal = new THREE.MeshLambertMaterial({color: 0xeee6d6}); for (const sx of [-1, 1]) { const f = new THREE.Mesh(new THREE.BoxGeometry(3, 0.6, 32), gal); f.position.set(sx * 7, 7.5, 1); g.add(f); }
    const piers = [], colsU = []; for (let z = -14; z <= 14; z += 4) for (const sx of [-1, 1]) { piers.push([sx * 5.5, z]); colsU.push([sx * 5.5, z]); } this.cols = piers;
    const pm = new THREE.InstancedMesh(new THREE.BoxGeometry(1.2, 7.2, 1.2), gal, piers.length), cm = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.42, 0.48, 10, 12), gal, colsU.length), m4 = new THREE.Matrix4();
    piers.forEach(([x, z], k) => { m4.makeTranslation(x, 3.6, z); pm.setMatrixAt(k, m4); }); colsU.forEach(([x, z], k) => { m4.makeTranslation(x, 12.9, z); cm.setMatrixAt(k, m4); }); g.add(pm, cm);
    const gold = new THREE.MeshStandardMaterial({color: 0xd4af37, metalness: 0.85, roughness: 0.3}); for (const sx of [-1, 1]) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1, 30), gold); r.position.set(sx * 5.6, 8.3, 1); g.add(r); }
    // altar with gilt glory, the organ above the altar end
    const alt = new THREE.Mesh(new THREE.BoxGeometry(4, 1.2, 1.6), new THREE.MeshLambertMaterial({color: 0x5a3a3a})); alt.position.set(0, 0.6, -16.5); g.add(alt);
    const glory = new THREE.Mesh(new THREE.CircleGeometry(2.4, 24), gold); glory.position.set(0, 4.6, -17.9); g.add(glory);
    const org = new THREE.Group(); for (let i = 0; i < 15; i++) { const h = 2.5 + 2 * Math.sin(i / 14 * Math.PI); const p = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, h, 8), gold); p.position.set(-3.5 + i * 0.5, 9 + h / 2, -17.6); org.add(p); } g.add(org);
    K.meshes({stone: lamb(THREE, T('stoneWall'), {side: THREE.DoubleSide}), marble: lamb(THREE, T('marbleFloor')), vault: lamb(THREE, T('vault'), {side: THREE.DoubleSide})}, g);
    chandeliers(THREE, g, [[0, 9, -8], [0, 9, 0], [0, 9, 8]], 1.1);
    plaque(THREE, g, 'The Royal Chapel', 'Consecrated 1710, by Mansart and de Cotte. The King heard mass\nfrom the royal tribune; Louis XVI married Marie-Antoinette here in 1770.', 0, 2.6, 17.9, Math.PI, 3.4);
    exitBtn(THREE, rootEl, ctx, 'Back outside', 3.5, 1.5, 17.8, 180, 'versailles-ret-chapel');
  },
  unmount() { this.g = null; this.kit = null; }
};

/* ================= vers-opera ================= */
const OPERA = {
  env: {background: 0x05060c, fog: null, far: 300}, spawn: {x: 0, y: 0, z: 9, yaw: 0}, kit: null,
  ground() { return 0; }, blocked(x, z) { return !!(OPERA.kit && OPERA.kit.blocked(x, z)) || (z < -4 && z > -7.2); },
  async mount(sceneEl, rootEl, ctx) {
    const THREE = ctx.THREE, g = new THREE.Group(); this.g = g; rootEl.object3D.add(g); const K = this.kit = Kit(THREE); lights(THREE, g, 0xfff0e0, 0x302030, 1.1);
    // auditorium: an oval (polygon) 22 x 20 m, 3 tiers of boxes in blue and gold; stage at z < -7 behind a crimson curtain
    const N = 20, A = 10, Bz = 9, cz = 2.5, ring = []; for (let i = 0; i <= N; i++) { const a = Math.PI * 0.05 + Math.PI * 0.9 * i / N; ring.push([Math.cos(a) * A, cz + Math.sin(a) * Bz]); }
    // walls of the oval (from stage left, round the back, to stage right), seen from inside
    for (let i = 0; i < N; i++) { const [x0, z0] = ring[i], [x1, z1] = ring[i + 1]; K.wall('blue', x0, z0, x1, z1, 16, 3, 5.3, []); }
    K.wall('blue', 7.5, -7, ring[0][0], ring[0][1], 16, 3, 5.3, []); K.wall('blue', ring[N][0], ring[N][1], -7.5, -7, 16, 3, 5.3, []);
    K.floor('parquet', -10, -7, 10, 12, 0, 3, true); K.floor('ceil', -10, -7, 10, 12, 16, 20, false);
    // box fronts: 3 gilded balustrade rings at 3.2, 6.6, 10 m, set 2.2 m in from the wall
    const gold = new THREE.MeshStandardMaterial({color: 0xd4af37, metalness: 0.8, roughness: 0.35});
    for (const y of [3.2, 6.6, 10]) for (let i = 0; i < N; i++) { const [x0, z0] = ring[i], [x1, z1] = ring[i + 1], s = 0.78, cx = (x0 + x1) / 2 * s, cz2 = cz + ((z0 + z1) / 2 - cz) * s;
      const L = Math.hypot(x1 - x0, z1 - z0) * s; const m = new THREE.Mesh(new THREE.BoxGeometry(L, 1.0, 0.12), gold); m.position.set(cx, y, cz2); m.rotation.y = -Math.atan2(z1 - z0, x1 - x0); g.add(m); }
    // proscenium, curtain, stage
    const cur = new THREE.Mesh(new THREE.PlaneGeometry(14, 11), new THREE.MeshLambertMaterial({map: T('curtain')})); T('curtain').repeat.set(5, 1); cur.position.set(0, 5.5, -7.4); g.add(cur);
    const pro = new THREE.Mesh(new THREE.BoxGeometry(16, 2, 0.6), gold); pro.position.set(0, 11.6, -7.2); g.add(pro); for (const sx of [-1, 1]) { const c = new THREE.Mesh(new THREE.BoxGeometry(1, 12, 0.8), gold); c.position.set(sx * 7.6, 6, -7.1); g.add(c); }
    const stg = new THREE.Mesh(new THREE.BoxGeometry(15, 1.2, 3), new THREE.MeshLambertMaterial({color: 0x4a3020})); stg.position.set(0, 0.6, -5.6); g.add(stg);
    // rows of seats (instanced)
    const seats = []; for (let r = 0; r < 7; r++) for (let c = -6; c <= 6; c++) seats.push([c * 1.0, 0.45, -1.5 + r * 1.3]);
    const sm = new THREE.InstancedMesh(new THREE.BoxGeometry(0.8, 0.9, 0.7), plain(THREE, T('brocade')), seats.length), m4 = new THREE.Matrix4(); seats.forEach((s, k) => { m4.makeTranslation(...s); sm.setMatrixAt(k, m4); }); g.add(sm);
    K.meshes({blue: lamb(THREE, T('opera')), parquet: lamb(THREE, T('parquet')), ceil: lamb(THREE, T('ceil'))}, g);
    chandeliers(THREE, g, [[0, 12.5, 2], [-5, 11.5, 0], [5, 11.5, 0], [-5, 11.5, 6], [5, 11.5, 6], [0, 11.5, 8]], 0.9);
    plaque(THREE, g, 'The Royal Opera', 'Ange-Jacques Gabriel, 1770, opened for the wedding of the future\nLouis XVI and Marie-Antoinette. All wood, painted as marble.', 0, 3.1, 11.2, Math.PI, 3.4);
    exitBtn(THREE, rootEl, ctx, 'Back outside', 0, 1.4, 11.2, 180, 'versailles-ret-opera');
  },
  unmount() { this.g = null; this.kit = null; }
};

/* ================= vers-jdp ================= */
const JDP = {
  env: {background: 0x0a0a0a, fog: null, far: 300}, spawn: {x: 0, y: 0, z: 13, yaw: 0}, kit: null,
  ground() { return 0; }, blocked(x, z) { return JDP.kit ? JDP.kit.blocked(x, z) : false; },
  async mount(sceneEl, rootEl, ctx) {
    const THREE = ctx.THREE, g = new THREE.Group(); this.g = g; rootEl.object3D.add(g); const K = this.kit = Kit(THREE); lights(THREE, g, 0xffffff, 0x777060, 1.5);
    // the real-tennis court: 30 x 11 m, tall plain walls (black lower band), high windows, open timber roof; spectators' gallery on one side
    K.room('plaster', -5.5, -15, 5.5, 15, 12, 4, 12, {S: [[4, 7, 3.5]]}); K.floor('floor', -5.5, -15, 5.5, 15, 0, 2, true);
    const win = new THREE.MeshBasicMaterial({color: 0xe8f2ff}); for (let z = -13; z <= 13; z += 3.2) for (const sx of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(2, 2.6), win); w.position.set(sx * 5.45, 9.8, z); w.rotation.y = -sx * Math.PI / 2; g.add(w); }
    const wood = new THREE.MeshLambertMaterial({color: 0x6b4a2e}); for (let z = -14; z <= 14; z += 3.5) { const b = new THREE.Mesh(new THREE.BoxGeometry(11, 0.4, 0.3), wood); b.position.set(0, 12, z); g.add(b); }
    for (const sx of [-1, 1]) { const r = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.3, 30), wood); r.position.set(sx * 2.8, 14.2, 0); r.rotation.z = sx * -0.5; g.add(r); }
    const net = new THREE.Mesh(new THREE.PlaneGeometry(11, 1.5), new THREE.MeshBasicMaterial({color: 0xffffff, transparent: true, opacity: 0.35, side: THREE.DoubleSide})); net.position.set(0, 0.75, 0); g.add(net);
    const gal = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.4, 28), wood); gal.position.set(-4.8, 1.2, 0); g.add(gal);
    // the Oath: a large painted panel (David's composition suggested) and the bust of Bailly
    const pan = tex(512, 320, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#d8d0c0'); gr.addColorStop(1, '#6a5a40'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 70; i++) { const x = 20 + Math.random() * (w - 40), y = 160 + Math.random() * 120; c.fillStyle = ['#2a2a2a', '#3a3530', '#5a4a3a', '#1a1a2a'][i % 4]; c.fillRect(x, y, 10, 60); c.fillStyle = '#e0c0a0'; c.beginPath(); c.arc(x + 5, y - 6, 6, 0, 7); c.fill();
        c.strokeStyle = '#2a2a2a'; c.lineWidth = 3; c.beginPath(); c.moveTo(x + 5, y + 6); c.lineTo(w / 2 + (x - w / 2) * 0.2, 130); c.stroke(); }
      c.fillStyle = '#2a2a2a'; c.fillRect(w / 2 - 8, 110, 16, 70); c.strokeStyle = '#d4af37'; c.lineWidth = 10; c.strokeRect(5, 5, w - 10, h - 10); });
    const p = new THREE.Mesh(new THREE.PlaneGeometry(8, 5), new THREE.MeshLambertMaterial({map: pan})); p.position.set(0, 5.2, -14.9); g.add(p);
    const bust = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 1.6, 10), new THREE.MeshLambertMaterial({color: 0xf4f0e8})); bust.position.set(0, 0.8, -11); g.add(bust);
    K.meshes({plaster: lamb(THREE, tex(64, 128, (c, w, h) => { c.fillStyle = '#ece6d8'; c.fillRect(0, 0, w, h); c.fillStyle = '#1c1c1c'; c.fillRect(0, h - 14, w, 14); })), floor: lamb(THREE, tex(64, 64, (c, w, h) => { c.fillStyle = '#8a7f72'; c.fillRect(0, 0, w, h); c.strokeStyle = '#6f665b'; c.strokeRect(0, 0, w, h); }))}, g);
    plaque(THREE, g, 'Jeu de Paume', '20 June 1789: locked out of their hall, the deputies of the Third Estate\nswore here never to separate until France had a constitution.', 0, 2.6, 14.9, Math.PI, 3.4);
    exitBtn(THREE, rootEl, ctx, 'Back to the street', 3.2, 1.5, 14.85, 180, 'versailles-ret-jdp');
  },
  unmount() { this.g = null; this.kit = null; }
};
F.register('vers-palace', PAL); F.register('vers-chapel', CHAP); F.register('vers-opera', OPERA); F.register('vers-jdp', JDP);
