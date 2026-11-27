/* Tesseract room (T-21, Nov 27 2026; Josh: "open early all systems build"). A walk-in hall inside Fowling Pond, mounted by FP_ROOMS
   (vr/w3d/fprooms.js, contract vr/ROOMS.md), so the headset never leaves the page or the VR session.
   - West wall: the Tesseract Program website (DIRDs, AAWSAP, UnLAB, Roswell and the claims). Short summaries in our own words of the
     public pages at tesseractprogram.pages.dev; each "Read more" opens the existing in-world readers (tesseractreader.js / diareader.js).
     No Tesseract artwork or branding is copied; the site is only read and linked.
   - East wall: the walk-in propulsion lab corner (advanced propulsion, NASA BPP, Frontiers of Propulsion Science, robotics) with props.
   - Centre: the multiverse map hub - Fowling Pond, Red Planet Lounge, Tesseract, USE - glowing orbs you can point at to travel.
   - North wall: Bank of the United States USE Eagle exchange desk (1 Eagle = 10 Fowling Pond dollars), a play-money calculator.
   - South wall: doors back to the Star Fleet base or the bank terrace.
   Lean: ~70 meshes, Lambert/Basic materials, no shadows, canvas text; everything is disposed by FP_ROOMS on leave. */
const HX = 11, Z0 = -22, Z1 = 7, WALLH = 6.5;
const DESK = {x0: 2.4, x1: 7.6, z0: -20.2, z1: -18.9};
const PROPS = [[8.2, -5.5], [8.2, -10.5], [8.2, -15.5]];
let T = null, ctx = null, root = null, rootEl = null, spinEl = null, eagles = 1, disp = null, timers = [];

function wrap(g, text, maxW) { const words = String(text).split(' '), lines = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (g.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; } if (cur) lines.push(cur); return lines; }
/* canvas text: blocks [{t, s: title|sub|body|small|big|head, c}] */
function drawBlocks(c, blocks, opts) { const g = c.getContext('2d'); opts = opts || {};
  g.fillStyle = opts.bg || '#0b1d26'; g.fillRect(0, 0, c.width, c.height); g.strokeStyle = opts.frame || '#d4af37'; g.lineWidth = 12; g.strokeRect(6, 6, c.width - 12, c.height - 12);
  const F = {title: ['bold', 60, '#FFD700', 'Georgia, serif'], sub: ['bold', 40, '#9ffcff', 'Arial, sans-serif'], body: ['', 36, '#f2ead8', 'Arial, sans-serif'],
    small: ['', 28, '#c9c2b0', 'Arial, sans-serif'], big: ['bold', 66, '#111', 'Georgia, serif'], head: ['bold', 46, '#FFD700', 'Georgia, serif']};
  const M = 48; let y = opts.center && opts.vcenter ? null : 44; g.textBaseline = 'top'; g.textAlign = opts.center ? 'center' : 'left';
  const lay = []; let hh = 0;
  for (const b of blocks) { const f = F[b.s || 'body']; g.font = f[0] + ' ' + f[1] + 'px ' + f[3]; const ls = wrap(g, b.t, c.width - 2 * M); lay.push([b, f, ls]); hh += ls.length * f[1] * 1.27 + f[1] * 0.42; }
  if (y == null) y = Math.max(20, (c.height - hh) / 2 + 6);
  for (const [b, f, ls] of lay) { g.font = f[0] + ' ' + f[1] + 'px ' + f[3]; g.fillStyle = b.c || f[2]; for (const ln of ls) { g.fillText(ln, opts.center ? c.width / 2 : M, y); y += f[1] * 1.27; } y += f[1] * 0.42; } }
function canvasMesh(w, h, blocks, opts) { const c = document.createElement('canvas'); c.width = 1024; c.height = Math.round(1024 * h / w); drawBlocks(c, blocks, opts);
  const tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 4;
  const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({map: tex, toneMapped: false})); m.userData.canvas = c; return m; }
function place(m, x, y, z, ry) { m.position.set(x, y, z); m.rotation.y = ry || 0; root.add(m); return m; }
function box(w, h, d, x, y, z, mat) { const b = new T.Mesh(new T.BoxGeometry(w, h, d), mat); b.position.set(x, y, z); root.add(b); return b; }
/* a laser / mouse / tap button: an A-Frame plane with class btn (the lasers raycast .btn) carrying a canvas face */
function button(x, y, z, ryDeg, w, h, label, sub, onClick, colors) { colors = colors || {};
  const e = document.createElement('a-entity'); e.setAttribute('position', x + ' ' + y + ' ' + z); e.setAttribute('rotation', '0 ' + ryDeg + ' 0');
  const hit = document.createElement('a-plane'); hit.setAttribute('class', 'btn'); hit.setAttribute('width', w); hit.setAttribute('height', h); hit.setAttribute('material', 'shader:flat;transparent:true;opacity:0');
  hit.addEventListener('click', ev => { try { onClick(ev); } catch (er) { console.log('tesseract room: ' + er); } }); e.appendChild(hit);
  const face = canvasMesh(w, h, [{t: label, s: 'big', c: colors.fg || '#111'}].concat(sub ? [{t: sub, s: 'sub', c: colors.sub || '#2a2410'}] : []), {bg: colors.bg || '#FFD700', frame: colors.frame || '#7a5c12', center: true, vcenter: true});
  face.position.z = -0.005; e.addEventListener('loaded', () => e.object3D.add(face)); rootEl.appendChild(e); return e; }
const tess = sec => () => { if (window.JFVR_tessReader) window.JFVR_tessReader.open(sec); else ctx.toast('The Tesseract reader is still loading'); };
const dia = () => { if (window.JFVR_diaReader) window.JFVR_diaReader.open(); else ctx.toast('The DIA Papers reader is still loading'); };
const SRC = {t: 'Summary of tesseractprogram.pages.dev', s: 'small'};

/* ---------- content (summaries of the live public pages, Nov 27 2026) ---------- */
const WEST = [
  {z: -3, read: ['Open the DIA Papers', '37 DIRDs, DIRD 13 first'], fn: dia, blocks: [{t: 'The DIRDs', s: 'title'}, {t: 'Defense Intelligence Reference Documents', s: 'sub'},
    {t: 'Short technical papers written under the Defense Intelligence Agency\u2019s AAWSAP program, 2008\u20132010, on propulsion, energy, spacetime physics, materials and human factors.'},
    {t: 'The DIA released 37 of the 38 in 2022, answering a 2019 FOIA request. They are reference studies, not proof of any claim.'}, SRC]},
  {z: -8, read: ['Read more', 'AAWSAP in the Tesseract reader'], fn: tess('aawsap'), blocks: [{t: 'AAWSAP', s: 'title'}, {t: 'Advanced Aerospace Weapon System Applications Program', s: 'sub'},
    {t: 'A DIA contract (2008\u20132010) to study the physics and engineering of aerospace systems out to 2050.'},
    {t: 'Senators Daniel Inouye and Harry Reid sponsored it. Bigelow Aerospace Advanced Space Studies (BAASS) was the contractor. Budget: $10 million in FY2008, $12 million added in FY2010.'}, SRC]},
  {z: -13, read: ['Read more', 'Research in the Tesseract reader'], fn: tess('research'), blocks: [{t: 'UnLAB', s: 'title'}, {t: 'The lab behind MIT\u2019s Advanced Propulsion and Energy sessions', s: 'sub'},
    {t: 'UnLAB describes itself as a U.S. nonprofit research lab, now in Savannah, Georgia. Co-founder Charles Chase lists decades at Lockheed Martin Skunk Works.'},
    {t: 'It hosted \u201cAdvanced Propulsion and Energy\u201d sessions during MIT\u2019s Independent Activities Period in 2019 and 2020, then online.'}, SRC]},
  {z: -18, read: ['Read more', 'Claims in the Tesseract reader'], fn: tess('claims'), blocks: [{t: 'Roswell and the claims', s: 'title'}, {t: 'Attributed as claims, not endorsed', s: 'sub'},
    {t: 'Stanton T. Friedman (1934\u20132019), a nuclear physicist, argued the 1947 Roswell incident was the crash of an extraterrestrial craft and co-wrote Crash at Corona.'},
    {t: 'The site also covers Bob Lazar and Leonard Stringfield, with what has been checked or disputed, e.g. the FBI called the MJ-12 document \u201ccompletely bogus\u201d (1988).'}, SRC]}];
const EAST = [
  {z: -3, read: ['Read more', 'Research in the Tesseract reader'], fn: tess('research'), blocks: [{t: 'Advanced propulsion', s: 'title'}, {t: 'Past chemical rockets', s: 'sub'},
    {t: 'Antimatter, fusion, nuclear and electromagnetic drives, and the speculative idea of negative mass.'},
    {t: 'DIRDs 08 (positron), 09 (fusion), 11 (nuclear), 29 (negative mass), 30 and 37 (aneutronic fusion), 33 (MHD air-breathing).'}, SRC]},
  {z: -8, read: ['Read more', 'Research in the Tesseract reader'], fn: tess('research'), blocks: [{t: 'NASA Breakthrough Propulsion Physics', s: 'title'}, {t: '1996\u20132002, led by Marc G. Millis', s: 'sub'},
    {t: 'Three grand challenges: propulsion with no propellant, the fastest travel physics allows, and the energy to power it.'},
    {t: 'Of 16 research tasks, about a third were not viable, a quarter merited follow-up and the rest were unresolved.'}, SRC]},
  {z: -13, read: ['Read more', 'Research in the Tesseract reader'], fn: tess('research'), blocks: [{t: 'Frontiers of Propulsion Science', s: 'title'}, {t: 'Millis & Davis (eds.), AIAA, 2009', s: 'sub'},
    {t: 'Twenty-two chapters: gravity control, the quantum vacuum, faster-than-light ideas, energy and research strategy.'},
    {t: 'It assesses breakthroughs rather than announcing them, including chapters that report null results.'}, SRC]},
  {z: -18, read: ['Open the DIA Papers', 'Human interface and materials DIRDs'], fn: dia, blocks: [{t: 'Robotics', s: 'title'}, {t: 'Bench in progress', s: 'sub'},
    {t: 'The Tesseract site has no robotics page yet. This bay is ready for it, with a working lab arm.'},
    {t: 'Related now: AAWSAP\u2019s twelve technical areas include control, human interface and human effects.'}, {t: 'Fowling Pond lab display', s: 'small'}]}];
const MAP = [{t: 'The multiverse map', s: 'title'},
  {t: 'Fowling Pond', s: 'sub', c: '#7fffa0'}, {t: 'The home world. Every trip starts and ends here.'},
  {t: 'Red Planet Lounge (Mars)', s: 'sub', c: '#ff9a6a'}, {t: 'A Mars colony world. Ride the rocket from the Bridgewater launch pad.'},
  {t: 'Tesseract', s: 'sub', c: '#9ffcff'}, {t: 'This room, a neighbouring universe. Enter from the Star Fleet base gateway or the bank terrace portal.'},
  {t: 'USE: United States Eagle', s: 'sub', c: '#FFD700'}, {t: 'The foreign currency shared across the worlds. Change it at the Bank of the United States desk: 1 Eagle = 10 Fowling Pond dollars.'},
  {t: 'Point at a glowing orb to travel.', s: 'small'}];
const USE_INFO = [{t: 'USE Eagle exchange', s: 'title'}, {t: '1 Eagle (USE) = 10 Fowling Pond dollars', s: 'sub', c: '#FFD700'},
  {t: 'The United States Eagle is a proposed currency: 1 Eagle = US$10. Notes: 0.01 USE (dime), 0.025 (quarter), 0.05 (half dollar), 0.1 (dollar), 0.2 (two dollars), 0.5 (five dollars) and 1.00 USE (ten dollars).'},
  {t: 'Use the buttons on the counter to work out an exchange.'},
  {t: 'Play money inside Fowling Pond VR: no real value. Bank notes: joshfreeman.org/vr/bank', s: 'small'}];

/* ---------- builders ---------- */
function shell() {
  const fc = document.createElement('canvas'); fc.width = fc.height = 256; const g = fc.getContext('2d'); g.fillStyle = '#0d1a2b'; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = '#c9a43a'; g.lineWidth = 3; g.strokeRect(0, 0, 256, 256); g.strokeStyle = '#1f3a5a'; g.lineWidth = 1; g.beginPath(); g.moveTo(128, 0); g.lineTo(128, 256); g.moveTo(0, 128); g.lineTo(256, 128); g.stroke();
  const ft = new T.CanvasTexture(fc); ft.colorSpace = T.SRGBColorSpace; ft.wrapS = ft.wrapT = T.RepeatWrapping; ft.repeat.set(2 * HX / 2, (Z1 - Z0) / 2);
  const floor = new T.Mesh(new T.PlaneGeometry(2 * HX, Z1 - Z0), new T.MeshLambertMaterial({map: ft})); floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, (Z0 + Z1) / 2); root.add(floor);
  const lab = new T.Mesh(new T.PlaneGeometry(5, 19), new T.MeshLambertMaterial({color: 0x2a3440})); lab.rotation.x = -Math.PI / 2; lab.position.set(HX - 2.5, 0.01, -10.5); root.add(lab);   // lab floor plate
  const wall = new T.MeshLambertMaterial({color: 0x15253b}), gold = new T.MeshLambertMaterial({color: 0xc9a43a, emissive: 0x3a2a00}), ceil = new T.MeshBasicMaterial({color: 0x08101c});
  const L = Z1 - Z0, ZC = (Z0 + Z1) / 2;
  box(0.3, WALLH, L, -HX - 0.15, WALLH / 2, ZC, wall); box(0.3, WALLH, L, HX + 0.15, WALLH / 2, ZC, wall);
  box(2 * HX, WALLH, 0.3, 0, WALLH / 2, Z0 - 0.15, wall); box(2 * HX, WALLH, 0.3, 0, WALLH / 2, Z1 + 0.15, wall);
  box(2 * HX + 0.6, 0.2, L + 0.6, 0, WALLH + 0.1, ZC, ceil);
  for (const [w, d, x, z] of [[0.12, L, -HX + 0.06, ZC], [0.12, L, HX - 0.06, ZC], [2 * HX, 0.12, 0, Z0 + 0.06], [2 * HX, 0.12, 0, Z1 - 0.06]]) { box(w, 0.25, d, x, WALLH - 0.3, z, gold); box(w, 0.12, d, x, 0.06, z, gold); }
  for (let z = Z0 + 3; z < Z1 - 1; z += 6) { const l = new T.Mesh(new T.PlaneGeometry(1.6, 1.6), new T.MeshBasicMaterial({color: 0xcfe8ff})); l.rotation.x = Math.PI / 2; l.position.set(0, WALLH - 0.01, z); root.add(l); }
  root.add(new T.HemisphereLight(0xdfe9ff, 0x1a2230, 1.25)); const sun = new T.DirectionalLight(0xffffff, 0.8); sun.position.set(2, 10, 4); root.add(sun);
  place(canvasMesh(12, 1.0, [{t: 'THE TESSERACT ROOM', s: 'head'}], {center: true, vcenter: true, bg: '#0b1d26'}), 0, 5.75, Z0 + 0.02, 0);
  place(canvasMesh(6, 0.8, [{t: 'PROPULSION LAB', s: 'head'}], {center: true, vcenter: true}), HX - 0.02, 5.4, -10.5, -Math.PI / 2);
  place(canvasMesh(6, 0.8, [{t: 'TESSERACT PROGRAM', s: 'head'}], {center: true, vcenter: true}), -HX + 0.02, 5.4, -10.5, Math.PI / 2);
}
function bays() {
  for (const [list, x, ry, ryDeg] of [[WEST, -HX + 0.03, Math.PI / 2, 90], [EAST, HX - 0.03, -Math.PI / 2, -90]]) for (const b of list) {
    place(canvasMesh(3.8, 3.1, b.blocks), x, 2.75, b.z, ry);
    button(x + (x < 0 ? 0.02 : -0.02), 0.82, b.z, ryDeg, 2.6, 0.58, b.read[0], b.read[1], b.fn); }
}
function lab() {
  const steel = new T.MeshLambertMaterial({color: 0x8a96a3}), dark = new T.MeshLambertMaterial({color: 0x2b3038}), glow = new T.MeshBasicMaterial({color: 0x59e1ff}), amber = new T.MeshBasicMaterial({color: 0xffb347});
  for (const [x, z] of PROPS) { const p = new T.Mesh(new T.CylinderGeometry(0.75, 0.8, 0.6, 24), dark); p.position.set(x, 0.3, z); root.add(p); }
  const [ax, az] = PROPS[0]; const ring = new T.Mesh(new T.TorusGeometry(0.55, 0.09, 12, 40), glow); ring.position.set(ax, 1.45, az); ring.rotation.y = Math.PI / 2; root.add(ring);   // fusion ring
  const core = new T.Mesh(new T.SphereGeometry(0.16, 16, 10), amber); core.position.copy(ring.position); root.add(core);
  for (const s of [-1, 1]) { const c = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 0.9, 8), steel); c.position.set(ax, 1.05, az + s * 0.62); root.add(c); }
  const [bx, bz] = PROPS[1]; const glass = new T.Mesh(new T.CylinderGeometry(0.6, 0.6, 1.3, 24, 1, true), new T.MeshLambertMaterial({color: 0xaee8ff, transparent: true, opacity: 0.22, side: T.DoubleSide, depthWrite: false}));
  glass.position.set(bx, 1.25, bz); root.add(glass); box(1.3, 0.08, 1.3, bx, 1.94, bz, steel);
  const coil = new T.Mesh(new T.TorusGeometry(0.3, 0.05, 8, 28), new T.MeshLambertMaterial({color: 0xb87333})); coil.rotation.x = Math.PI / 2; coil.position.set(bx, 1.1, bz); root.add(coil);
  const coil2 = coil.clone(); coil2.position.y = 1.35; root.add(coil2); const rod = new T.Mesh(new T.CylinderGeometry(0.035, 0.035, 0.9, 8), glow); rod.position.set(bx, 1.25, bz); root.add(rod);
  const [cx, cz] = PROPS[2]; const arm = new T.Group(); arm.position.set(cx, 0.6, cz); root.add(arm);   // robot arm (spins slowly)
  const base = new T.Mesh(new T.CylinderGeometry(0.28, 0.32, 0.25, 16), steel); base.position.y = 0.12; arm.add(base);
  const up = new T.Mesh(new T.BoxGeometry(0.14, 0.8, 0.14), new T.MeshLambertMaterial({color: 0xe8b923})); up.position.y = 0.62; arm.add(up);
  const fore = new T.Group(); fore.position.y = 1.0; arm.add(fore); const f = new T.Mesh(new T.BoxGeometry(0.62, 0.11, 0.11), new T.MeshLambertMaterial({color: 0xe8b923})); f.position.x = -0.3; fore.add(f);
  const grip = new T.Mesh(new T.BoxGeometry(0.06, 0.16, 0.16), dark); grip.position.x = -0.62; fore.add(grip);
  const labels = [['Fusion ring', 'a model for the fusion DIRDs'], ['Vacuum chamber', 'coil test rig (model)'], ['Lab arm', 'robotics bench']];
  PROPS.forEach(([x, z], i) => place(canvasMesh(1.5, 0.42, [{t: labels[i][0], s: 'sub', c: '#FFD700'}, {t: labels[i][1], s: 'small'}], {center: true, vcenter: true}), x - 0.81, 0.4, z, -Math.PI / 2));
  return {ring, core, arm, fore};
}
function hub() {
  const dais = new T.Mesh(new T.CylinderGeometry(3, 3.1, 0.15, 48), new T.MeshLambertMaterial({color: 0x1d3150})); dais.position.set(0, 0.075, -9); root.add(dais);
  const ped = new T.Mesh(new T.CylinderGeometry(0.45, 0.6, 1.0, 24), new T.MeshLambertMaterial({color: 0xc9a43a, emissive: 0x2a1e00})); ped.position.set(0, 0.6, -9); root.add(ped);
  const W = [{k: 'fp', n: 'Fowling Pond', s: 'home world', c: 0x7fffa0, x: 0, z: -6.8}, {k: 'mars', n: 'Red Planet Lounge', s: 'Mars', c: 0xff7a45, x: 2.2, z: -9},
    {k: 'tess', n: 'Tesseract', s: 'you are here', c: 0x59e1ff, x: 0, z: -11.2}, {k: 'use', n: 'USE Eagle', s: 'currency', c: 0xFFD700, x: -2.2, z: -9}];
  const act = {fp: () => ctx.leave({spot: 'terrace'}), mars: () => { ctx.toast('To Mars: board the rocket at the launch pad'); ctx.leave({spot: 'launchpad'}); },
    tess: () => ctx.toast('You are in the Tesseract room'), use: () => ctx.teleport(5, 0, -16.6, 0)};
  const Y = 1.7, pts = [];
  for (const w of W) { const o = new T.Mesh(new T.SphereGeometry(0.32, 20, 14), new T.MeshBasicMaterial({color: w.c})); o.position.set(w.x, Y, w.z); root.add(o);
    const halo = new T.Mesh(new T.SphereGeometry(0.45, 16, 10), new T.MeshBasicMaterial({color: w.c, transparent: true, opacity: 0.18, depthWrite: false})); halo.position.copy(o.position); root.add(halo);
    const c = document.createElement('canvas'); c.width = 512; c.height = 160; drawBlocks(c, [{t: w.n, s: 'sub', c: '#' + w.c.toString(16).padStart(6, '0')}, {t: w.s, s: 'small', c: '#ffffff'}], {center: true, vcenter: true, bg: '#0b1d26', frame: '#' + w.c.toString(16).padStart(6, '0')});
    const tx = new T.CanvasTexture(c); tx.colorSpace = T.SRGBColorSpace; const sp = new T.Sprite(new T.SpriteMaterial({map: tx, toneMapped: false})); sp.scale.set(1.3, 0.41, 1); sp.position.set(w.x, Y + 0.68, w.z); root.add(sp);
    const e = document.createElement('a-sphere'); e.setAttribute('class', 'btn'); e.setAttribute('radius', 0.5); e.setAttribute('position', w.x + ' ' + Y + ' ' + w.z); e.setAttribute('material', 'transparent:true;opacity:0;depthWrite:false');
    e.addEventListener('click', act[w.k]); rootEl.appendChild(e); pts.push(new T.Vector3(w.x, Y, w.z)); }
  const seg = []; [[0, 1], [0, 2], [1, 2], [3, 0], [3, 1], [3, 2]].forEach(([a, b]) => seg.push(pts[a], pts[b]));
  const lines = new T.LineSegments(new T.BufferGeometry().setFromPoints(seg), new T.LineBasicMaterial({color: 0xd4af37, transparent: true, opacity: 0.8})); root.add(lines);
  for (const p of pts) { const st = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, Y - 0.15, 6), new T.MeshLambertMaterial({color: 0xc9a43a})); st.position.set(p.x, (Y + 0.15) / 2, p.z); root.add(st); }
  // a spinning 4D hypercube (tesseract) wireframe above the hub: 16 vertices, 32 edges, rotated in the XW and ZW planes
  const V4 = []; for (let i = 0; i < 16; i++) V4.push([i & 1 ? 1 : -1, i & 2 ? 1 : -1, i & 4 ? 1 : -1, i & 8 ? 1 : -1]);
  const E = []; for (let i = 0; i < 16; i++) for (let b = 0; b < 4; b++) { const j = i ^ (1 << b); if (j > i) E.push(i, j); }
  const pos = new Float32Array(E.length * 3), geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3));
  const cube = new T.LineSegments(geo, new T.LineBasicMaterial({color: 0x59e1ff})); cube.position.set(0, 4.1, -9); cube.frustumCulled = false; root.add(cube);
  const sign = place(canvasMesh(3.8, 4.2, MAP), -5.5, 2.75, Z0 + 0.03, 0);
  return {cube, pos, V4, E, sign};
}
function desk() {
  const wood = new T.MeshLambertMaterial({color: 0x5a3a1e}), gold = new T.MeshLambertMaterial({color: 0xd4af37, emissive: 0x3a2a00}), marble = new T.MeshLambertMaterial({color: 0xe8e2d4});
  const cx = (DESK.x0 + DESK.x1) / 2, cz = (DESK.z0 + DESK.z1) / 2, w = DESK.x1 - DESK.x0;
  box(w, 1.05, DESK.z1 - DESK.z0, cx, 0.525, cz, wood); box(w + 0.1, 0.06, DESK.z1 - DESK.z0 + 0.12, cx, 1.08, cz, marble); box(w, 0.08, 0.04, cx, 0.95, DESK.z1 + 0.01, gold);
  place(canvasMesh(6.4, 1.0, [{t: 'BANK OF THE UNITED STATES', s: 'head'}, {t: 'USE Eagle exchange desk', s: 'sub', c: '#ffe9a8'}], {center: true, vcenter: true, bg: '#1d1a0c'}), cx, 4.68, Z0 + 0.03, 0);
  place(canvasMesh(3.8, 2.6, USE_INFO), cx, 2.85, Z0 + 0.03, 0);
  const c = document.createElement('canvas'); c.width = 1024; c.height = 400; const tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace;
  const m = new T.Mesh(new T.PlaneGeometry(2.0, 0.78), new T.MeshBasicMaterial({map: tex, toneMapped: false})); m.position.set(cx, 1.5, cz + 0.15); m.rotation.x = -0.35; root.add(m);
  disp = {c, tex}; drawDisp();
  const steps = [['\u2212 1', -1], ['+ 1', 1], ['+ 10', 10], ['Reset', 0]];
  steps.forEach(([l, d], i) => button(cx - 1.5 + i * 1.0, 0.72, DESK.z1 + 0.04, 0, 0.86, 0.34, l, '', () => { eagles = d === 0 ? 1 : Math.max(0, Math.min(100000, eagles + d)); drawDisp(); }));
}
function drawDisp() { if (!disp) return; const fmt = n => n.toLocaleString('en-US');
  drawBlocks(disp.c, [{t: fmt(eagles) + (eagles === 1 ? ' Eagle' : ' Eagles') + ' (USE)', s: 'head'}, {t: '= ' + fmt(eagles * 10) + ' Fowling Pond dollars', s: 'sub', c: '#7fffa0'}, {t: 'Play money - no real value', s: 'small'}], {center: true, vcenter: true, bg: '#06121c'});
  disp.tex.needsUpdate = true; }
function exits() {
  place(canvasMesh(8, 0.8, [{t: 'Back to Fowling Pond', s: 'head'}], {center: true, vcenter: true}), 0, 3.0, Z1 - 0.03, Math.PI);
  button(-2.2, 1.65, Z1 - 0.05, 180, 3.4, 0.8, 'Star Fleet base', 'the gateway you came through', () => ctx.leave({spot: 'starfleet'}), {bg: '#9ffcff', frame: '#1a5a66'});
  button(2.2, 1.65, Z1 - 0.05, 180, 3.4, 0.8, 'Bank terrace', 'the Tesseract portal', () => ctx.leave({spot: 'terrace'}));
}

/* ---------- per-frame: the hypercube, the fusion ring and the lab arm ---------- */
let H = null, P = null;
function spin(t) { if (!H) return; const a = t * 0.00045, b = t * 0.0003, ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
  const proj = H.V4.map(([x, y, z, w]) => { const x1 = x * ca - w * sa, w1 = x * sa + w * ca, z1 = z * cb - w1 * sb, w2 = z * sb + w1 * cb, k = 0.75 / (2.6 - w2); return [x1 * k, y * k, z1 * k]; });
  for (let i = 0; i < H.E.length; i++) { const p = proj[H.E[i]]; H.pos[i * 3] = p[0]; H.pos[i * 3 + 1] = p[1]; H.pos[i * 3 + 2] = p[2]; }
  H.cube.geometry.attributes.position.needsUpdate = true; H.cube.rotation.y = t * 0.0002;
  if (P) { P.ring.rotation.x = t * 0.001; P.core.scale.setScalar(1 + 0.15 * Math.sin(t * 0.004)); P.arm.rotation.y = Math.sin(t * 0.0006) * 1.2; P.fore.rotation.z = 0.35 + Math.sin(t * 0.0011) * 0.3; } }

const ROOM = {
  env: {background: 0x070d18, fog: null, far: 2000},
  spawn: {x: 0, y: 0, z: 4.5, yaw: 0},
  ground: () => 0,
  blocked(x, z) {
    if (x < -HX + 0.4 || x > HX - 0.4 || z < Z0 + 0.4 || z > Z1 - 0.4) return true;
    if (Math.hypot(x, z + 9) < 0.8) return true;                                                   // hub pedestal
    if (x > DESK.x0 - 0.3 && x < DESK.x1 + 0.3 && z > DESK.z0 - 0.3 && z < DESK.z1 + 0.3) return true;   // exchange counter
    return PROPS.some(([px, pz]) => Math.hypot(x - px, z - pz) < 1.0);
  },
  mount(sceneEl, el, c) {
    T = c.THREE; ctx = c; rootEl = el; root = new T.Group(); root.name = 'tesseract-room'; el.object3D.add(root); eagles = 1;
    shell(); bays(); P = lab(); H = hub(); desk(); exits();
    if (!AFRAME.components['fp-tess-spin']) AFRAME.registerComponent('fp-tess-spin', {tick: function (t) { if (this.el.__spin) this.el.__spin(t); }});
    spinEl = document.createElement('a-entity'); spinEl.__spin = spin; spinEl.setAttribute('fp-tess-spin', ''); el.appendChild(spinEl);
    timers.push(setTimeout(() => document.querySelectorAll('[raycaster]').forEach(r => r.components.raycaster && r.components.raycaster.refreshObjects()), 400));
    window.FP_TESS_ROOM = {eagles: () => eagles, add: d => { eagles = Math.max(0, eagles + d); drawDisp(); }};
    c.toast('The Tesseract room - a neighbouring universe. Doors home are behind you.');
  },
  unmount() {
    timers.forEach(clearTimeout); timers = []; if (spinEl) spinEl.__spin = null;
    try { if (window.JFVR_tessReader) window.JFVR_tessReader.close(); } catch (e) {} try { if (window.JFVR_diaReader) window.JFVR_diaReader.close(); } catch (e) {}
    H = P = null; root = rootEl = spinEl = disp = null; delete window.FP_TESS_ROOM;
  }
};
window.FP_ROOMS.register(window.FP_ROOMS.pending || 'tesseract', ROOM);
