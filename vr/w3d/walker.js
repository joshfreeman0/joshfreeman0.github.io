/* Walker Memorial (MIT Building 50, 142 Memorial Drive, Cambridge MA) - William Welles Bosworth, architect, 1916; murals by
   Edwin H. Blashfield, 1923-30. Shown fully restored, inside and out, at its real place in the Boston city scene.
   Layout follows Josh's restoration design concept (Drive: Buildings > Walker Memorial (MIT) > Walker Architecture Design: A-101 main
   floor, A-102 balcony, A-201 front elevation, A-301 section; proposal sections 04/08/16) on the real footprint (OSM way 24494050,
   37 m along Memorial Drive x 57 m deep), with the 1917 Architectural Forum plans/elevation (public domain) for the gym and basement:
   - basement (-1.83 m): radio studios (WMBR, east), games room with the original bowling lanes and billiards (west), plant, rear door;
   - main floor (+2.44 m, 16 risers up from the sidewalk): portico of six Tuscan columns, three carved oak portals, lobby with two
     stairs, the great hall (48 x 78 ft nave, side aisles, colonnade, coffered ceiling, terrazzo) with the five Blashfield panels on the
     north and south walls; servery (west), lounge + elevator (east), cafe and kitchen (north);
   - second floor (+7.9 m): the colonnaded balcony (the proposal's first priority, guards at 42 in), front lounge, side and north rooms;
   - third floor (+15.6 m): gymnasium above the hall under the lunette clerestory, attic rooms around it; new 1:12 ramp on the east side.
   Murals: north centre = the 1926 Technique plate (public domain), tinted; grove panels = painted approximations from Josh's rendering;
   south panels = painted approximations from the published descriptions. No people's names in labels.
   Everything lives in its own group: exterior within 4 km while the Boston scene is up, interior only within ~110 m. Collision and
   floors are in the building's rotated frame via world.js gHooks/bHooks; doors use doors.js. Google tiles are cut out around it
   (realearth jfRect slot 3). ?spot=walker / menu 'Walker Memorial' lands you at the foot of the front steps. */
(function () {
'use strict';
const W3D = window.W3D = window.W3D || {};
const LITE = !!window.JFVR_LITE, QUEST = /OculusBrowser|Quest/i.test(navigator.userAgent), HI = !LITE && !QUEST;
const GEO = {lat: 42.3593657, lon: -71.0883014};                 // footprint centre
const ROT = 0.4206, CR = Math.cos(ROT), SR = Math.sin(ROT);       // local +x = along the facade (ENE), local +z = out of the front (SSE)
const FALLBACK_PAD = {lat: 42.3594, lon: -71.0664};               // Boston pad geo if the scene doesn't publish one
const YB = -1.83, Y1 = 2.44, Y2 = 7.9, YC = 15.24, Y3 = 15.6, YP = 19.5, YG = 24.6, YT = 26.3;
const ZF = 23.9, ZH = 15.1, ZN = -9.0, XA = 7.3, XS = 11.9, XE = 17.98;   // entrance wall, lobby/hall wall, hall north wall, colonnade, aisle wall, inner face of side walls
const BASE = '/vr/w3d/walker/', AV = 1;
const P = {x: 0, z: 0, y: 0, ok: false, src: ''};
let ext = null, intr = null, K = null;
const S = [], WL = [];   // walkable surfaces / collision walls in the local frame (interior entries carry .i)

/* ---------- frame ---------- */
function kxy(lat) { const p = lat * Math.PI / 180; return {kx: 111412.84 * Math.cos(p) - 93.5 * Math.cos(3 * p), ky: 111132.954 - 559.822 * Math.cos(2 * p) + 1.175 * Math.cos(4 * p)}; }
function anchor() {
  const RE = W3D.realEarth, D = W3D.cities && W3D.cities.DEFS && W3D.cities.DEFS.boston; if (!D) return null; let a = null, src = 'fallback';
  if (RE && RE.anchors && RE.anchors.boston) { a = RE.anchors.boston; src = 'RE.anchors'; }
  else if (RE && RE.anchor === 'boston' && RE.A) { a = RE.A; src = 'RE.A'; }
  else if (D.lat !== undefined && D.lon !== undefined) { a = {lat: D.lat, lon: D.lon, x: D.x, z: D.z}; src = 'DEFS'; }
  else if (W3D.cityGeo && W3D.cityGeo.boston) { const g = W3D.cityGeo.boston; a = {lat: g.lat, lon: g.lon, x: D.x, z: D.z}; src = 'cityGeo'; }
  else a = {lat: FALLBACK_PAD.lat, lon: FALLBACK_PAD.lon, x: D.x, z: D.z};
  const k = kxy(a.lat); return {x: (a.x !== undefined ? a.x : D.x) + (GEO.lon - a.lon) * (a.kx || k.kx), z: (a.z !== undefined ? a.z : D.z) - (GEO.lat - a.lat) * (a.ky || k.ky), src};
}
const toW = (lx, lz) => [P.x + lx * CR + lz * SR, P.z - lx * SR + lz * CR];
const toL = (x, z) => { const dx = x - P.x, dz = z - P.z; return [dx * CR - dz * SR, dx * SR + dz * CR]; };

/* ---------- collision hooks (world.js) ---------- */
function gHook(x, z, y) {
  if (!ext) return null; const dx = x - P.x, dz = z - P.z; if (dx * dx + dz * dz > 8100) return null;
  const lx = dx * CR - dz * SR, lz = dx * SR + dz * CR, ly = y - P.y + 0.65; let best = -1e9, hit = false;
  for (const s of S) { if (lx < s.x0 || lx > s.x1 || lz < s.z0 || lz > s.z1) continue; let sy = s.y;
    if (s.ax) { const t = s.ax === 'z' ? (lz - s.z0) / (s.z1 - s.z0) : (lx - s.x0) / (s.x1 - s.x0); sy = s.ya + (s.yb - s.ya) * t; }
    if (sy <= ly && sy > best) { best = sy; hit = true; } }
  return hit ? best + P.y : null;
}
function bHook(x, z, y) {
  if (!ext) return false; const dx = x - P.x, dz = z - P.z; if (dx * dx + dz * dz > 8100) return false;
  const lx = dx * CR - dz * SR, lz = dx * SR + dz * CR, ly = y - P.y;
  for (const w of WL) { if (w.door && w.door.a >= 0.15) continue;
    if (lx > w.x0 - 0.3 && lx < w.x1 + 0.3 && lz > w.z0 - 0.3 && lz < w.z1 + 0.3 && w.y1 > ly + 0.35 && w.y0 < ly + 1.7) return true; }
  return false;
}

/* ---------- textures ---------- */
const TS = LITE ? 256 : 512;
function cv(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c; }
function T(c, tw, th) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = LITE ? 2 : 8; if (tw) t.repeat.set(1 / tw, 1 / (th || tw)); return t; }
function rnd(seed) { let s = seed || 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
function noise(g, w, h, n, a, seed) { const r = rnd(seed || 5); for (let i = 0; i < n; i++) { const v = r() - 0.5; g.fillStyle = v > 0 ? 'rgba(255,255,255,' + v * a + ')' : 'rgba(0,0,0,' + (-v * a) + ')'; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); } }
const TX = {};
function texes() {
  if (TX.stone) return TX;
  TX.stone = T(cv(TS, TS, (g, w, h) => { g.fillStyle = '#d9d1bf'; g.fillRect(0, 0, w, h); noise(g, w, h, w * 30, 0.08, 3); g.strokeStyle = 'rgba(120,108,88,0.45)'; g.lineWidth = Math.max(1, w / 256);
    for (let j = 0; j < 4; j++) { const y = j * h / 4; g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); for (let i = 0; i < 2; i++) { const x = i * w / 2 + (j % 2) * w / 4; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + h / 4); g.stroke(); } } }), 2.4, 2.4);
  TX.brick = T(cv(TS, TS, (g, w, h) => { const r = rnd(7); g.fillStyle = '#c9bea8'; g.fillRect(0, 0, w, h); const bw = w / 6, bh = h / 18;
    for (let j = 0; j < 18; j++) for (let i = -1; i < 7; i++) { const k = 0.86 + r() * 0.22, x = i * bw + (j % 2) * bw / 2; g.fillStyle = 'rgb(' + (208 * k | 0) + ',' + (184 * k | 0) + ',' + (140 * k | 0) + ')'; g.fillRect(x + 1, j * bh + 1, bw - 2, bh - 2); } }), 1.2, 1.2);
  TX.plaster = T(cv(TS, TS, (g, w, h) => { g.fillStyle = '#efe6d3'; g.fillRect(0, 0, w, h); noise(g, w, h, w * 20, 0.05, 9); }), 4, 4);
  TX.terrazzo = T(cv(TS, TS, (g, w, h) => { const r = rnd(11); g.fillStyle = '#e4dccb'; g.fillRect(0, 0, w, h); for (let i = 0; i < w * 14; i++) { const c = r(); g.fillStyle = c < 0.4 ? 'rgba(150,130,110,.55)' : c < 0.7 ? 'rgba(120,120,118,.5)' : c < 0.85 ? 'rgba(170,110,80,.45)' : 'rgba(255,255,250,.7)'; const s = 1 + r() * 2.5; g.fillRect(r() * w, r() * h, s, s); }
    g.strokeStyle = '#b08d4c'; g.lineWidth = Math.max(1, w / 200); g.strokeRect(0, 0, w, h); }), 3, 3);
  TX.marble = T(cv(TS, TS, (g, w, h) => { const r = rnd(13); for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { g.fillStyle = (i + j) % 2 ? '#e9e2d2' : '#9a958c'; g.fillRect(i * w / 4, j * h / 4, w / 4, h / 4); }
    g.strokeStyle = 'rgba(255,255,255,.25)'; for (let k = 0; k < 40; k++) { g.beginPath(); const x = r() * w, y = r() * h; g.moveTo(x, y); g.bezierCurveTo(x + 20, y + 10, x + 30, y - 10, x + 60 * r(), y + 30 * r()); g.stroke(); } }), 2.4, 2.4);
  TX.oak = T(cv(TS, TS, (g, w, h) => { const r = rnd(17); for (let j = 0; j < 16; j++) { const k = 0.85 + r() * 0.25; g.fillStyle = 'rgb(' + (150 * k | 0) + ',' + (104 * k | 0) + ',' + (64 * k | 0) + ')'; g.fillRect(0, j * h / 16, w, h / 16 - 1); g.fillStyle = 'rgba(60,35,15,.4)'; g.fillRect(r() * w, j * h / 16, 2, h / 16); } noise(g, w, h, w * 10, 0.08, 4); }), 2, 2);
  TX.coffer = T(cv(TS, TS, (g, w, h) => { g.fillStyle = '#d8ccb0'; g.fillRect(0, 0, w, h); const m = w * 0.12; g.fillStyle = '#f2ead6'; g.fillRect(m, m, w - 2 * m, h - 2 * m); g.fillStyle = '#e6dcc2'; g.fillRect(m * 1.6, m * 1.6, w - 3.2 * m, h - 3.2 * m);
    g.strokeStyle = '#b8964e'; g.lineWidth = Math.max(1, w / 120); g.strokeRect(m * 1.6, m * 1.6, w - 3.2 * m, h - 3.2 * m); g.fillStyle = '#c9a457'; g.beginPath(); g.arc(w / 2, h / 2, w * 0.07, 0, 7); g.fill(); }), 3, 3);
  TX.gym = T(cv(LITE ? 512 : 1024, LITE ? 512 : 1024, (g, w, h) => { const r = rnd(19); for (let j = 0; j < 64; j++) { const k = 0.9 + r() * 0.15; g.fillStyle = 'rgb(' + (222 * k | 0) + ',' + (186 * k | 0) + ',' + (128 * k | 0) + ')'; g.fillRect(0, j * h / 64, w, h / 64 - 1); }
    g.strokeStyle = '#7a1f1f'; g.lineWidth = w / 220; const sx = w / 23.8, sz = h / 24.1, X = v => (v + 11.9) * sx, Z = v => (v + 9) * sz;   // court along local z, 15 x 28 m scaled to 13 x 22
    g.strokeRect(X(-6.5), Z(-8), 13 * sx, 22 * sz); g.beginPath(); g.moveTo(X(-6.5), Z(3)); g.lineTo(X(6.5), Z(3)); g.stroke(); g.beginPath(); g.arc(X(0), Z(3), 1.8 * sx, 0, 7); g.stroke();
    for (const e of [-8, 14]) { const s = e < 0 ? 1 : -1; g.strokeRect(X(-2.45), Z(e) + (s < 0 ? -5.8 * sz : 0), 4.9 * sx, 5.8 * sz); g.beginPath(); g.arc(X(0), Z(e + s * 1.6), 6.0 * sx, s > 0 ? 0 : Math.PI, s > 0 ? Math.PI : 2 * Math.PI); g.stroke(); } }));
  TX.acoustic = T(cv(TS, TS, (g, w, h) => { g.fillStyle = '#4a4f57'; g.fillRect(0, 0, w, h); for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { g.fillStyle = (i + j) % 2 ? '#5a606a' : '#3f444b'; g.fillRect(i * w / 4 + 2, j * h / 4 + 2, w / 4 - 4, h / 4 - 4); } }), 1.2, 1.2);
  // trim atlas (4 x 4 cells): 0 ext sash, 1 ext arched, 2 ext lunette, 3 oak portal, 4 int sash, 5 int arched, 6 int lunette, 7 oak door,
  // 8-9 inscription, 10 entrance plaque, 11 hall plaque, 12 studio plaque, 13 gym plaque, 14 ON AIR, 15 balustrade
  const A = LITE ? 512 : 1024, c = A / 4;
  TX.atlas = T(cv(A, A, (g) => {
    const cell = (i, f) => { g.save(); g.translate((i % 4) * c, Math.floor(i / 4) * c); f(c); g.restore(); };
    const sash = (s, glass, frame, arch) => { g.fillStyle = frame; if (arch) { g.beginPath(); g.moveTo(s * 0.06, s); g.lineTo(s * 0.06, s * 0.45); g.arc(s / 2, s * 0.45, s * 0.44, Math.PI, 0); g.lineTo(s * 0.94, s); g.closePath(); g.fill(); } else g.fillRect(s * 0.06, s * 0.02, s * 0.88, s * 0.96);
      const gr = g.createLinearGradient(0, 0, s, s); glass.forEach((q, k) => gr.addColorStop(k / (glass.length - 1), q)); g.fillStyle = gr;
      if (arch) { g.beginPath(); g.moveTo(s * 0.12, s * 0.95); g.lineTo(s * 0.12, s * 0.45); g.arc(s / 2, s * 0.45, s * 0.38, Math.PI, 0); g.lineTo(s * 0.88, s * 0.95); g.closePath(); g.fill(); } else g.fillRect(s * 0.12, s * 0.07, s * 0.76, s * 0.86);
      g.strokeStyle = frame; g.lineWidth = s / 60; for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(s * (0.12 + 0.19 * k), s * 0.07); g.lineTo(s * (0.12 + 0.19 * k), s * 0.93); g.stroke(); }
      for (let k = 1; k < 6; k++) { g.beginPath(); g.moveTo(s * 0.12, s * (0.07 + 0.143 * k)); g.lineTo(s * 0.88, s * (0.07 + 0.143 * k)); g.stroke(); } g.lineWidth = s / 30; g.beginPath(); g.moveTo(s * 0.12, s * 0.5); g.lineTo(s * 0.88, s * 0.5); g.stroke(); };
    const lun = (s, glass, frame) => { g.fillStyle = frame; g.beginPath(); g.moveTo(0, s); g.arc(s / 2, s, s / 2, Math.PI, 0); g.closePath(); g.fill(); g.fillStyle = glass; g.beginPath(); g.moveTo(s * 0.07, s); g.arc(s / 2, s, s * 0.43, Math.PI, 0); g.closePath(); g.fill();
      g.strokeStyle = frame; g.lineWidth = s / 50; for (let k = 1; k < 8; k++) { const a = Math.PI + k * Math.PI / 8; g.beginPath(); g.moveTo(s / 2, s); g.lineTo(s / 2 + Math.cos(a) * s / 2, s + Math.sin(a) * s / 2); g.stroke(); } g.beginPath(); g.arc(s / 2, s, s * 0.2, Math.PI, 0); g.stroke(); };
    const door = (s, grille) => { g.fillStyle = '#5a3a1e'; g.fillRect(0, 0, s, s); for (const x0 of [0.04, 0.52]) { g.fillStyle = '#7a5230'; g.fillRect(s * x0, s * 0.04, s * 0.44, s * 0.92);
        g.strokeStyle = '#3e2712'; g.lineWidth = s / 80; for (const y0 of grille ? [0.42, 0.7] : [0.08, 0.5]) g.strokeRect(s * (x0 + 0.05), s * y0, s * 0.34, s * (grille ? 0.24 : 0.38)); }
      if (grille) { g.fillStyle = '#6f6a4e'; g.fillRect(s * 0.08, s * 0.06, s * 0.84, s * 0.3); g.strokeStyle = '#2f2b1c'; g.lineWidth = s / 90; for (let k = 0; k < 14; k++) { g.beginPath(); g.moveTo(s * (0.08 + k * 0.06), s * 0.06); g.lineTo(s * (0.08 + k * 0.06), s * 0.36); g.stroke(); } for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(s * 0.08, s * (0.06 + k * 0.075)); g.lineTo(s * 0.92, s * (0.06 + k * 0.075)); g.stroke(); } }
      g.fillStyle = '#c9a457'; g.fillRect(s * 0.46, s * 0.55, s * 0.02, s * 0.08); g.fillRect(s * 0.52, s * 0.55, s * 0.02, s * 0.08); };
    const text = (i, lines, bg, fg, w2) => cell(i, s => { const W = s * (w2 || 1); g.fillStyle = bg; g.fillRect(0, s * 0.18, W, s * 0.64); g.strokeStyle = fg; g.lineWidth = s / 70; g.strokeRect(s * 0.03, s * 0.21, W - s * 0.06, s * 0.58);
      g.fillStyle = fg; g.textAlign = 'center'; lines.forEach((L, k) => { g.font = (k ? '' : 'bold ') + Math.round(s * (L[1] || 0.07)) + 'px Georgia, serif'; g.fillText(L[0], W / 2, s * (0.32 + k * 0.1) + s * (L[2] || 0)); }); });
    cell(0, s => sash(s, ['#2c3c4c', '#59708a', '#23313f'], '#efeadf')); cell(1, s => sash(s, ['#2c3c4c', '#5d7690', '#23313f'], '#efeadf', true)); cell(2, s => lun(s, '#40566c', '#efeadf')); cell(3, s => door(s, true));
    cell(4, s => sash(s, ['#dfeefa', '#ffffff', '#cfe3f2'], '#f6f1e6')); cell(5, s => sash(s, ['#dfeefa', '#ffffff', '#cfe3f2'], '#f6f1e6', true)); cell(6, s => lun(s, '#eaf4fb', '#f6f1e6')); cell(7, s => door(s, false));
    g.save(); g.translate(0, 2 * c); g.fillStyle = '#d9d1bf'; g.fillRect(0, c * 0.2, 2 * c, c * 0.6); g.fillStyle = '#5d564a'; g.textAlign = 'center'; g.font = 'bold ' + Math.round(c * 0.2) + 'px Georgia, serif'; g.fillText('WALKER  MEMORIAL', c, c * 0.48);
    g.font = Math.round(c * 0.055) + 'px Georgia, serif'; g.fillText('GIFT OF THE ALVMNI OF THE MASSACHVSETTS INSTITVTE OF TECHNOLOGY', c, c * 0.66); g.restore();
    text(10, [['WALKER MEMORIAL', 0.085], ['MIT Building 50 · 1916'], ['W. Welles Bosworth, architect'], ['Restored · great hall, balcony,'], ['gymnasium, studios below']], '#1f2a24', '#d8c27a');
    text(11, [['THE GREAT HALL', 0.085], ['Murals by Edwin H. Blashfield'], ['1923-1930 · five panels'], ['South panels shown as'], ['painted approximations']], '#1f2a24', '#d8c27a');
    text(12, [['RADIO STUDIOS', 0.09], ['WMBR 88.1 FM'], ['Walker Memorial Basement'], ['Radio · since 1960']], '#1f2a24', '#d8c27a');
    text(13, [['GYMNASIUM', 0.1], ['Third floor'], ['under the lunette'], ['clerestory']], '#1f2a24', '#d8c27a');
    cell(14, s => { g.fillStyle = '#300'; g.fillRect(s * 0.05, s * 0.3, s * 0.9, s * 0.4); g.fillStyle = '#ff3b2f'; g.font = 'bold ' + Math.round(s * 0.22) + 'px Arial, sans-serif'; g.textAlign = 'center'; g.fillText('ON AIR', s / 2, s * 0.58); });
    cell(15, s => { g.fillStyle = '#efe8d8'; g.fillRect(0, 0, s, s * 0.1); g.fillRect(0, s * 0.9, s, s * 0.1); for (let k = 0; k < 6; k++) { const x = (k + 0.5) * s / 6; g.beginPath(); g.moveTo(x - s * 0.03, s * 0.1); g.quadraticCurveTo(x - s * 0.07, s * 0.55, x - s * 0.04, s * 0.9); g.lineTo(x + s * 0.04, s * 0.9); g.quadraticCurveTo(x + s * 0.07, s * 0.55, x + s * 0.03, s * 0.1); g.fill(); } });
  }));
  TX.atlas.wrapS = TX.atlas.wrapT = THREE.ClampToEdgeWrapping;
  return TX;
}
const CELL = i => { const u = (i % 4) / 4, v = 1 - (Math.floor(i / 4) + 1) / 4; return [u, v, u + 0.25, v + 0.25]; };

/* ---------- geometry helpers (non-indexed; uv in metres unless given) ---------- */
function gfrom(pos, nor, uv) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); return g; }
function quadPts(pos, nor, uv, a, b, c, d, n, ua, ub, uc, ud) { for (const [p, u] of [[a, ua], [b, ub], [c, uc], [a, ua], [c, uc], [d, ud]]) { pos.push(p[0], p[1], p[2]); nor.push(n[0], n[1], n[2]); uv.push(u[0], u[1]); } }
// axis box; skip = string of faces to omit among 'xXyYzZ' (lower = negative side)
function box(x0, x1, y0, y1, z0, z1, skip) { skip = skip || ''; const pos = [], nor = [], uv = [];
  if (skip.indexOf('X') < 0) quadPts(pos, nor, uv, [x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0], [-z1, y0], [-z0, y0], [-z0, y1], [-z1, y1]);
  if (skip.indexOf('x') < 0) quadPts(pos, nor, uv, [x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], [z0, y0], [z1, y0], [z1, y1], [z0, y1]);
  if (skip.indexOf('Y') < 0) quadPts(pos, nor, uv, [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0], [x0, -z1], [x1, -z1], [x1, -z0], [x0, -z0]);
  if (skip.indexOf('y') < 0) quadPts(pos, nor, uv, [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0], [x0, z0], [x1, z0], [x1, z1], [x0, z1]);
  if (skip.indexOf('Z') < 0) quadPts(pos, nor, uv, [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], [x0, y0], [x1, y0], [x1, y1], [x0, y1]);
  if (skip.indexOf('z') < 0) quadPts(pos, nor, uv, [x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1], [-x1, y0], [-x0, y0], [-x0, y1], [-x1, y1]);
  return gfrom(pos, nor, uv); }
// vertical quad facing n = 'x' | 'X' | 'z' | 'Z' (direction of the normal), centre c, size w x h, atlas uv rect r
function vq(cx, cy, cz, w, h, n, r) { const pos = [], nor = [], uv = [], hw = w / 2, y0 = cy - h / 2, y1 = cy + h / 2; r = r || [0, 0, 1, 1];
  const U = [[r[0], r[1]], [r[2], r[1]], [r[2], r[3]], [r[0], r[3]]];
  if (n === 'Z') quadPts(pos, nor, uv, [cx - hw, y0, cz], [cx + hw, y0, cz], [cx + hw, y1, cz], [cx - hw, y1, cz], [0, 0, 1], ...U);
  else if (n === 'z') quadPts(pos, nor, uv, [cx + hw, y0, cz], [cx - hw, y0, cz], [cx - hw, y1, cz], [cx + hw, y1, cz], [0, 0, -1], ...U);
  else if (n === 'X') quadPts(pos, nor, uv, [cx, y0, cz + hw], [cx, y0, cz - hw], [cx, y1, cz - hw], [cx, y1, cz + hw], [1, 0, 0], ...U);
  else quadPts(pos, nor, uv, [cx, y0, cz - hw], [cx, y0, cz + hw], [cx, y1, cz + hw], [cx, y1, cz - hw], [-1, 0, 0], ...U);
  return gfrom(pos, nor, uv); }
function hq(x0, x1, z0, z1, y, down, su) { const pos = [], nor = [], uv = []; su = su || 1;   // horizontal quad (up, or down-facing)
  if (!down) quadPts(pos, nor, uv, [x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], [0, 1, 0], [x0 / su, -z1 / su], [x1 / su, -z1 / su], [x1 / su, -z0 / su], [x0 / su, -z0 / su]);
  else quadPts(pos, nor, uv, [x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], [0, -1, 0], [x0 / su, z0 / su], [x1 / su, z0 / su], [x1 / su, z1 / su], [x0 / su, z1 / su]);
  return gfrom(pos, nor, uv); }
function cyl(r0, r1, h, seg, x, y, z, uvs) { const g = new THREE.CylinderGeometry(r1, r0, h, seg, 1, false).toNonIndexed(); g.translate(x, y + h / 2, z); if (uvs) { const a = g.attributes.uv; for (let i = 0; i < a.count; i++) a.setXY(i, a.getX(i) * uvs[0], a.getY(i) * uvs[1]); } return g; }
function tris(g) { return (g.index ? g.index.count : g.attributes.position.count) / 3; }

/* ---------- materials ---------- */
function mats() {
  const t = texes(), L = (o, e) => { const m = new THREE.MeshLambertMaterial(o); if (e) { m.emissive = new THREE.Color(o.color || 0xffffff).multiplyScalar(e); if (o.map) m.emissiveMap = o.map; } return m; };
  return {
    stone: L({map: t.stone}), brick: L({map: t.brick}), granite: L({color: 0xa29d93}), roof: L({color: 0x6d726f}), lead: L({color: 0x8c918d}),
    win: L({map: t.atlas, alphaTest: 0.5, side: THREE.DoubleSide}), glow: new THREE.MeshBasicMaterial({map: t.atlas, alphaTest: 0.5, side: THREE.DoubleSide}),
    plaster: L({map: t.plaster, color: 0xf4ecdc, side: THREE.DoubleSide}, 0.24), trim: L({color: 0xe6d9bf}, 0.24), terrazzo: L({map: t.terrazzo, color: 0xf0e8da}, 0.2), marble: L({map: t.marble, color: 0xf2ece2}, 0.2),
    oak: L({map: t.oak, color: 0xffffff}, 0.2), wood: L({color: 0x6b4526}, 0.25), gym: L({map: t.gym, color: 0xffffff}, 0.26), coffer: L({map: t.coffer, color: 0xf6efe0}, 0.3),
    gold: new THREE.MeshStandardMaterial({color: 0xc9a24a, metalness: 0.7, roughness: 0.35, emissive: 0x3a2a08}), iron: L({color: 0x2a2a2a}, 0.1), acoustic: L({map: t.acoustic, color: 0xffffff}, 0.3),
    cloth: L({color: 0xf3eee4}, 0.25), felt: L({color: 0x2f6b3c}, 0.3), dark: L({color: 0x30343a}, 0.2), lamp: new THREE.MeshBasicMaterial({color: 0xfff1cf}),
    glass: new THREE.MeshLambertMaterial({color: 0xbcd6e0, transparent: true, opacity: 0.25, depthWrite: false}), red: L({color: 0x8a2a2a}, 0.3), ground: L({map: null, color: 0xffffff})
  };
}

/* ---------- builders ---------- */
function Bag() { const b = {}; return {add(k, g) { (b[k] = b[k] || []).push(g); }, flush(grp, M, name) { let n = 0; for (const k in b) { if (!b[k].length) continue; const m = new THREE.Mesh(K.merge(b[k]), M[k]); m.name = name + '-' + k; m.matrixAutoUpdate = false; m.updateMatrix(); grp.add(m); n += tris(m.geometry); } return n; }}; }
// wall along x at z (or along z at x when axis 'z'), openings [{c, w, h, b (bottom), door, arch}] ; adds geometry + collision
function wall(bag, mat, axis, at, a0, a1, y0, y1, t, opens, I, extra) {
  opens = opens || []; const segs = [];
  const B = (u0, u1, v0, v1) => axis === 'x' ? box(u0, u1, v0, v1, at - t / 2, at + t / 2) : box(at - t / 2, at + t / 2, v0, v1, u0, u1);
  const C = (u0, u1, v0, v1, door) => { const w = axis === 'x' ? {x0: u0, x1: u1, z0: at - t / 2, z1: at + t / 2, y0: v0, y1: v1} : {x0: at - t / 2, x1: at + t / 2, z0: u0, z1: u1, y0: v0, y1: v1}; if (door) w.door = door; if (I) w.i = 1; WL.push(w); return w; };
  const xs = [a0, a1]; for (const o of opens) { xs.push(Math.max(a0, Math.min(a1, o.c - o.w / 2)), Math.max(a0, Math.min(a1, o.c + o.w / 2))); if (extra) extra(o, o.c - o.w / 2, o.c + o.w / 2, o.b !== undefined ? o.b : y0); }
  xs.sort((p, q) => p - q);
  for (let k = 0; k + 1 < xs.length; k++) { const l = xs[k], r = xs[k + 1]; if (r - l < 1e-4) continue; const m = (l + r) / 2;
    const holes = opens.filter(o => Math.abs(m - o.c) < o.w / 2).map(o => { const b = o.b !== undefined ? o.b : y0; return [Math.max(y0, b), Math.min(y1, b + o.h)]; }).filter(h => h[1] > h[0]).sort((p, q) => p[0] - q[0]);
    let cy = y0; for (const h of holes) { if (h[0] > cy) segs.push([l, r, cy, h[0]]); cy = Math.max(cy, h[1]); } if (cy < y1) segs.push([l, r, cy, y1]); }
  for (const s of segs) { bag.add(mat, B(s[0], s[1], s[2], s[3])); C(s[0], s[1], s[2], s[3]); }
  return C;
}
const doorList = [], elevEls = [];
function addDoor(grp, bag, axis, at, c, b, w, h, t, near) {   // double oak leaves in an opening
  const leaves = [], lw = w / 2;
  for (const s of [-1, 1]) { const piv = new THREE.Group(), hx = c + s * w / 2; if (axis === 'x') piv.position.set(hx, b, at); else piv.position.set(at, b, hx);
    const g = axis === 'x' ? K.merge([box(-lw / 2 - 0.0, lw / 2, 0, h, -0.04, 0.04)]) : K.merge([box(-0.04, 0.04, 0, h, -lw / 2, lw / 2)]);
    if (axis === 'x') g.translate(-s * lw / 2, 0, 0); else g.translate(0, 0, -s * lw / 2);
    // atlas door face on both sides: remap uv of the +/- faces to cell 3/7
    const uv = g.attributes.uv, pz = g.attributes.normal, r = CELL(h > 3.5 ? 3 : 7);
    for (let i = 0; i < uv.count; i++) { const nx = pz.getX(i), nz = pz.getZ(i), big = axis === 'x' ? Math.abs(nz) > 0.5 : Math.abs(nx) > 0.5;
      if (!big) { uv.setXY(i, r[0] + 0.001, r[1] + 0.001); continue; } const p = g.attributes.position, u = axis === 'x' ? (p.getX(i) + (s * lw / 2) + lw / 2) / lw : (p.getZ(i) + (s * lw / 2) + lw / 2) / lw, v = p.getY(i) / h;
      const uu = s < 0 ? u * 0.5 : 0.5 + u * 0.5; uv.setXY(i, r[0] + (r[2] - r[0]) * Math.min(1, Math.max(0, uu)), r[1] + (r[3] - r[1]) * v); }
    const m = new THREE.Mesh(g, grp.userData.M.win); piv.add(m); grp.add(piv); leaves.push({piv, closed: 0, open: (axis === 'x' ? -s : s) * 1.75}); }
  const wc = axis === 'x' ? toW(c, at) : toW(at, c), ry = ROT * 180 / Math.PI + (axis === 'x' ? 0 : 90);
  const d = W3D.addDoor ? W3D.addDoor({name: 'walker-door', leaves, at: {x: wc[0], y: P.y + b + 1, z: wc[1]}, near: near || 3.2, dy: 2.5, hit: {x: wc[0], y: P.y + b + h / 2, z: wc[1], w, h, d: 0.3, ry}}) : {a: 1};
  doorList.push(d); return d;
}
// switchback stair well: lanes A (outer, x0 side) / B, levels [y...], z0 (north) .. z1 (south), entry landings at the south end
function stairs(bag, x0, x1, z0, z1, lv, I) {
  const LL = 1.4, xm = (x0 + x1) / 2, za = z0 + LL, zb = z1 - LL, lanes = [[x0, xm - 0.06], [xm + 0.06, x1]], sx = x0 < 0 ? 1 : -1;
  const A = sx > 0 ? lanes[0] : [lanes[1][0], lanes[1][1]], Bn = sx > 0 ? lanes[1] : lanes[0];
  const Aa = x0 < 0 ? lanes[0] : lanes[1], Bb = x0 < 0 ? lanes[1] : lanes[0];   // A = outer lane (next to the side wall)
  const tread = (L, zs, ze, ys, ye) => { const n = Math.max(2, Math.ceil(Math.abs(ye - ys) / 0.185)), rise = (ye - ys) / n, run = (ze - zs) / n;
    for (let i = 0; i < n; i++) { const za2 = zs + run * i, zb2 = zs + run * (i + 1), y = ys + rise * (i + 1), lo = Math.min(za2, zb2), hi = Math.max(za2, zb2);
      bag.add('oak', hq(L[0], L[1], lo, hi, y, false, 1)); bag.add('trim', axisRiser(L, za2, y - rise, y, ze > zs)); }
    const so = new THREE.BufferGeometry(), pos = [], nor = [], uv = []; quadPts(pos, nor, uv, [L[0], ys - 0.25, zs], [L[1], ys - 0.25, zs], [L[1], ye - 0.25, ze], [L[0], ye - 0.25, ze], [0, -1, 0], [0, 0], [1, 0], [1, 1], [0, 1]); bag.add('plaster', gfrom(pos, nor, uv));
    S.push({x0: L[0], x1: L[1], z0: Math.min(zs, ze), z1: Math.max(zs, ze), ax: 'z', ya: zs < ze ? ys : ye, yb: zs < ze ? ye : ys, i: I}); };
  for (let k = 0; k + 1 < lv.length; k++) { const y0 = lv[k], y1 = lv[k + 1], ym = (y0 + y1) / 2;
    tread(Aa, zb, za, y0, ym); S.push({x0, x1, z0, z1: za, y: ym, i: I}); bag.add('marble', hq(x0, x1, z0, za, ym, false, 1)); bag.add('plaster', box(x0, x1, ym - 0.3, ym - 0.01, z0, za));
    tread(Bb, za, zb, ym, y1); S.push({x0, x1, z0: zb, z1, y: y1, i: I}); bag.add('marble', hq(x0, x1, zb, z1, y1, false, 1)); bag.add('plaster', box(x0, x1, y1 - 0.3, y1 - 0.01, zb, z1)); }
  S.push({x0, x1, z0, z1, y: lv[0], i: I}); bag.add('marble', hq(x0, x1, z0, z1, lv[0] + 0.005, false, 1));
  const top = lv[lv.length - 1]; S.push({x0: Aa[0], x1: Aa[1], z0: za, z1: zb, y: top, i: I}); bag.add('oak', hq(Aa[0], Aa[1], za, zb, top, false, 1)); bag.add('plaster', box(Aa[0], Aa[1], top - 0.3, top - 0.01, za, zb));
  S.push({x0, x1, z0, z1: za, y: top, i: I}); bag.add('marble', hq(x0, x1, z0, za, top, false, 1)); bag.add('plaster', box(x0, x1, top - 0.3, top - 0.01, z0, za));
  wall(bag, 'plaster', 'z', xm, za, zb, lv[0], top + 1.05, 0.12, null, I);                      // spine wall between the flights
  wall(bag, 'wood', 'x', za, Bb[0], Bb[1], top, top + 1.05, 0.08, null, I);                       // top-floor guard over the open flight
  wall(bag, 'wood', 'z', x0 < 0 ? x1 : x0, za, zb, top, top + 1.05, 0.08, null, I);
}
function axisRiser(L, z, ya, yb, flip) { const pos = [], nor = [], uv = []; if (flip) { quadPts(pos, nor, uv, [L[1], ya, z], [L[0], ya, z], [L[0], yb, z], [L[1], yb, z], [0, 0, -1], [L[1], ya], [L[0], ya], [L[0], yb], [L[1], yb]); return gfrom(pos, nor, uv); } quadPts(pos, nor, uv, [L[0], ya, z], [L[1], ya, z], [L[1], yb, z], [L[0], yb, z], [0, 0, 1], [L[0], ya], [L[1], ya], [L[1], yb], [L[0], yb]); return gfrom(pos, nor, uv); }

/* ---------- exterior (always while near Boston) ---------- */
function buildExt() {
  K = W3D.cities.Kit; const grp = new THREE.Group(); grp.name = 'walker-ext'; const M = grp.userData.M = mats(), bag = Bag();
  const t = 0.5, X0 = -18.5, X1 = 18.5, Z0 = -28.4;
  // shell: side + north walls (buff brick on a granite base), front block in limestone
  for (const s of [-1, 1]) { const x = s * 18.25; wall(bag, 'brick', 'z', x, Z0, ZF, 0.9, YP, t); wall(bag, 'granite', 'z', x, Z0, ZF + 0.01, YB, 0.9, t + 0.1);
    bag.add('stone', box(s < 0 ? X0 - 0.12 : X1 - 0.38, s < 0 ? X0 + 0.38 : X1 + 0.12, Y2 - 0.6, Y2 - 0.25, Z0 - 0.12, ZF)); }           // belt course
  wall(bag, 'brick', 'x', Z0 + 0.25, X0, X1, 0.9, YP, t, [{c: 0, w: 1.8, h: 0.01, b: YB}]); wall(bag, 'granite', 'x', Z0 + 0.25, X0, X1, YB, 0.9, t + 0.1, [{c: 0, w: 1.8, h: 2.7, b: YB}]);
  bag.add('stone', box(X0 - 0.4, X1 + 0.4, YP - 0.7, YP, Z0 - 0.4, ZF + 0.4)); bag.add('stone', box(X0 - 0.1, X1 + 0.1, YP, YP + 0.9, Z0 - 0.1, Z0 + 0.25));  // cornice + parapet
  for (const s of [-1, 1]) bag.add('stone', box(s < 0 ? X0 - 0.1 : X1 - 0.25, s < 0 ? X0 + 0.25 : X1 + 0.1, YP, YP + 0.9, Z0, 28.4));
  // antae blocks and the attic over the portico (limestone)
  for (const s of [-1, 1]) { const xa = s < 0 ? X0 : 15.2, xb = s < 0 ? -15.2 : X1; bag.add('stone', box(xa, xb, 0, YP, ZF, 28.4)); WL.push({x0: xa, x1: xb, z0: ZF, z1: 28.4, y0: -5, y1: YP});
    bag.add('granite', box(xa - 0.05, xb + 0.05, 0, Y1, ZF, 28.5)); }
  bag.add('stone', box(-15.2, 15.2, 12.84, YP, 26.2, 28.4)); bag.add('stone', box(X0 - 0.3, X1 + 0.3, 12.84, 13.9, 26.0, 28.75));   // attic + entablature band
  bag.add('stone', box(X0 - 0.45, X1 + 0.45, YP - 0.7, YP, 26.0, 28.9)); bag.add('stone', box(-15.2, 15.2, 12.84, 13.0, ZF, 26.2));  // cornice / portico soffit
  bag.add('win', vq(0, 16.3, 28.76, 22, 4.95, 'Z', [0, 0.3125, 0.5, 0.425]));                                     // inscription
  // entrance wall: three carved oak portals, windows above
  wall(bag, 'stone', 'x', ZF, -15.2, 15.2, Y1, 12.84, 0.6, [-4.34, 0, 4.34].map(c => ({c, w: 2.3, h: 4.5, b: Y1})));
  for (const c of [-4.34, 0, 4.34]) { bag.add('stone', box(c - 1.45, c + 1.45, Y1 + 4.5, Y1 + 4.9, ZF + 0.3, ZF + 0.5)); bag.add('win', vq(c, Y2 + 1.8, ZF + 0.31, 1.8, 2.6, 'Z', CELL(0)));
    bag.add('iron', box(c - 1.1, c + 1.1, Y2 + 0.45, Y2 + 0.5, ZF + 0.3, ZF + 0.8)); for (let k = -5; k <= 5; k++) bag.add('iron', box(c + k * 0.2 - 0.015, c + k * 0.2 + 0.015, Y2 - 0.2, Y2 + 0.5, ZF + 0.75, ZF + 0.79)); }
  for (const c of [-10.85, 10.85]) { bag.add('win', vq(c, Y1 + 2.6, ZF + 0.31, 1.9, 3.8, 'Z', CELL(0))); bag.add('win', vq(c, Y2 + 1.8, ZF + 0.31, 1.7, 2.4, 'Z', CELL(0))); }
  // portico floor + six Tuscan columns
  bag.add('granite', box(-15.2, 15.2, Y1 - 0.4, Y1, ZF, 28.4)); S.push({x0: -15.2, x1: 15.2, z0: ZF - 0.31, z1: 28.45, y: Y1});
  const seg = LITE ? 12 : HI ? 24 : 16, colH = 12.84 - Y1;
  for (let i = 0; i < 6; i++) { const x = -10.85 + i * 4.34, z = 27.3; bag.add('granite', box(x - 0.82, x + 0.82, Y1, Y1 + 0.32, z - 0.82, z + 0.82)); bag.add('stone', cyl(0.78, 0.74, 0.28, seg, x, Y1 + 0.32, z, [4.6, 0.3]));
    bag.add('stone', cyl(0.69, 0.58, colH - 1.35, seg, x, Y1 + 0.6, z, [4.3, colH])); bag.add('stone', cyl(0.62, 0.8, 0.38, seg, x, 12.84 - 0.75, z, [4.6, 0.4]));
    bag.add('stone', box(x - 0.88, x + 0.88, 12.84 - 0.37, 12.84, z - 0.88, z + 0.88)); WL.push({x0: x - 0.6, x1: x + 0.6, z0: z - 0.6, z1: z + 0.6, y0: Y1, y1: 12.8}); }
  // side + north windows (sash on L1/L2/attic; basement lights) and the raised gym clerestory with lunettes
  for (const s of [-1, 1]) { const xf = s * 18.51, n = s < 0 ? 'x' : 'X';
    for (let z = -25.5; z <= 21; z += 4.1) { bag.add('win', vq(xf, Y1 + 2.7, z, 1.9, 3.6, n, CELL(0))); bag.add('win', vq(xf, Y2 + 1.9, z, 1.6, 2.3, n, CELL(0))); bag.add('win', vq(xf, 17.2, z, 1.3, 1.5, n, CELL(0)));
      bag.add('stone', box(s < 0 ? xf - 0.12 : xf - 0.05, s < 0 ? xf + 0.05 : xf + 0.12, Y1 + 0.75, Y1 + 0.9, z - 1.1, z + 1.1)); } }
  for (let x = -14.4; x <= 14.5; x += 4.1) { if (Math.abs(x) < 1) continue; bag.add('win', vq(x, Y1 + 2.7, Z0 - 0.01, 1.9, 3.6, 'z', CELL(0))); bag.add('win', vq(x, Y2 + 1.9, Z0 - 0.01, 1.6, 2.3, 'z', CELL(0))); bag.add('win', vq(x, 17.2, Z0 - 0.01, 1.3, 1.5, 'z', CELL(0))); }
  bag.add('win', vq(0, YB + 1.3, Z0 - 0.02, 1.8, 2.6, 'z', CELL(3)));
  for (const s of [-1, 1]) { wall(bag, 'brick', 'z', s * XS, ZN, ZH, YP, YG, 0.4); bag.add('stone', box(s < 0 ? -XS - 0.45 : XS - 0.2, s < 0 ? -XS + 0.2 : XS + 0.45, YG - 0.4, YG, ZN - 0.45, ZH + 0.45));
    for (const z of [-4.3, 3.05, 10.4]) bag.add('win', vq(s * (XS + 0.21), YP + 2.4, z, 5.2, 2.6, s < 0 ? 'x' : 'X', [CELL(2)[0], CELL(2)[1], CELL(2)[2], CELL(2)[1] + 0.125])); }
  for (const z of [ZN, ZH]) wall(bag, 'brick', 'x', z, -XS, XS, YP, YG, 0.4);
  bag.add('win', vq(0, YP + 2.4, ZH + 0.21, 5.2, 2.6, 'Z', [CELL(2)[0], CELL(2)[1], CELL(2)[2], CELL(2)[1] + 0.125]));
  { const sh = new THREE.Shape([new THREE.Vector2(-XS - 0.5, 0), new THREE.Vector2(XS + 0.5, 0), new THREE.Vector2(0, YT - YG)]), rg = new THREE.ExtrudeGeometry(sh, {depth: ZH - ZN + 1, bevelEnabled: false}).toNonIndexed(); rg.translate(0, YG, ZN - 0.5); bag.add('lead', rg); }
  bag.add('roof', hq(X0, X1, Z0, ZF, YP - 0.02, false, 4)); bag.add('roof', hq(X0, X1, ZF, 26.2, YP + 0.01, false, 4));
  S.push({x0: X0, x1: X1, z0: Z0, z1: 28.4, y: YP}); S.push({x0: -XS, x1: XS, z0: ZN, z1: ZH, y: YG});
  // shell collision (whole height incl. basement), front steps (16 risers) with cheeks + lamps, east 1:12 ramp with landings
  for (const s of [-1, 1]) WL.push({x0: s < 0 ? X0 : 18.0, x1: s < 0 ? -18.0 : X1, z0: Z0, z1: ZF, y0: -5, y1: YP});
  for (const sx of [[X0, -0.9], [0.9, X1]]) WL.push({x0: sx[0], x1: sx[1], z0: Z0, z1: Z0 + 0.5, y0: -5, y1: YP}); WL.push({x0: -0.9, x1: 0.9, z0: Z0, z1: Z0 + 0.5, y0: YB + 2.7, y1: YP});
  const nS = 14, run = 0.35;
  for (let i = 0; i < nS; i++) { const y = Y1 - (i + 1) * Y1 / nS, z = 28.4 + i * run; bag.add('granite', box(-13, 13, -0.6, y + Y1 / nS, z, z + run, 'y')); }
  S.push({x0: -13, x1: 13, z0: 28.4, z1: 28.4 + nS * run, ax: 'z', ya: Y1, yb: 0});
  for (const s of [-1, 1]) { const x = s * 13.6; bag.add('stone', box(x - 0.6, x + 0.6, 0, Y1 + 0.9, 28.4, 28.4 + nS * run + 0.3)); WL.push({x0: x - 0.6, x1: x + 0.6, z0: 28.4, z1: 28.4 + nS * run + 0.3, y0: -2, y1: Y1 + 0.9});
    bag.add('iron', cyl(0.07, 0.06, 3.4, 8, x, Y1 + 0.9, 28.4 + nS * run - 0.2)); bag.add('lamp', new THREE.SphereGeometry(0.28, 12, 8).toNonIndexed().translate(x, Y1 + 4.5, 28.4 + nS * run - 0.2)); }
  { const xa = 18.7, xb = 20.3, zt = 28.4, zm = 13.5, zl = 11.9, zz = -1.8, h1 = Y1 * (zt - zm) / ((zt - zm) + (zl - zz));   // ramp: landing at the top, mid landing, bottom at grade
    S.push({x0: 13, x1: xb, z0: zt, z1: zt + 1.8, y: Y1}); bag.add('granite', box(13, xb, 0, Y1, zt, zt + 1.8, 'y'));
    S.push({x0: xa, x1: xb, z0: zm, z1: zt, ax: 'z', ya: Y1 - h1, yb: Y1}); S.push({x0: xa, x1: xb, z0: zl, z1: zm, y: Y1 - h1}); S.push({x0: xa, x1: xb, z0: zz, z1: zl, ax: 'z', ya: 0, yb: Y1 - h1});
    const rp = (z0, z1, y0, y1) => { const g = box(xa, xb, -0.5, 0, z0, z1, 'y'); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const tz = (p.getZ(i) - z0) / (z1 - z0); p.setY(i, p.getY(i) + y0 + (y1 - y0) * tz + 0.5 * (p.getY(i) >= -0.01 ? 1 : 0) - 0.5); } bag.add('granite', g); };
    rp(zm, zt, Y1 - h1, Y1); rp(zl, zm, Y1 - h1, Y1 - h1); rp(zz, zl, 0, Y1 - h1);
    bag.add('iron', box(xb, xb + 0.06, 0.9, 1.0, zz, zt + 1.8)); for (let z = zz; z <= zt; z += 1.5) bag.add('iron', box(xb, xb + 0.05, 0, Y1 + 1, z, z + 0.05)); WL.push({x0: xb, x1: xb + 0.1, z0: zz + 1, z1: zt + 1.8, y0: -1, y1: Y1 + 1.0}); }
  // rear areaway: steps down to the basement door
  { const z0 = Z0 - 6, z1 = Z0; S.push({x0: -1.2, x1: 1.2, z0: z0, z1: z1 - 1.2, ax: 'z', ya: 0, yb: YB}); S.push({x0: -1.2, x1: 1.2, z0: z1 - 1.2, z1: z1 + 0.3, y: YB});
    for (let i = 0; i < 10; i++) { const y = -(i + 1) * (-YB) / 10, z = z0 + i * (z1 - 1.2 - z0) / 10; bag.add('granite', box(-1.2, 1.2, YB - 0.2, y, z, z + (z1 - 1.2 - z0) / 10)); }
    bag.add('granite', box(-1.2, 1.2, YB - 0.2, YB, z1 - 1.2, z1)); for (const s of [-1, 1]) { bag.add('stone', box(s * 1.2 - 0.15, s * 1.2 + 0.15, YB, 0.9, z0, z1)); WL.push({x0: s * 1.2 - 0.2, x1: s * 1.2 + 0.2, z0, z1, y0: YB - 1, y1: 1}); } }
  // forecourt + lawns (OSM paths/roads drawn into the texture), clipped to the cutout when Google tiles show
  const gt = new THREE.TextureLoader().load(BASE + (LITE ? 'ground_near_lite.jpg' : 'ground_near.jpg') + '?v=' + AV); gt.colorSpace = THREE.SRGBColorSpace; gt.anisotropy = LITE ? 2 : 8;
  const gm = new THREE.MeshLambertMaterial({map: gt, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1}); if (W3D.clipMat) W3D.clipMat(gm, 2);
  const gp = new THREE.Mesh(new THREE.PlaneGeometry(160, 160).rotateX(-Math.PI / 2), gm); gp.position.y = 0.02; gp.name = 'walker-ground'; grp.add(gp);
  const ft = new THREE.TextureLoader().load(BASE + 'ground_far.jpg?v=' + AV); ft.colorSpace = THREE.SRGBColorSpace;
  const fp = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1600).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({map: ft})); fp.position.y = -0.12; fp.name = 'walker-far'; grp.add(fp); grp.userData.far = fp;
  // trees along the walks
  const tr = [], lf = []; for (const [x, z] of [[-24, 36], [24, 36], [-30, 12], [30, 4], [-30, -14], [-26, -36], [26, -38], [-8, 46], [10, 46], [34, 30], [-36, 32]]) { tr.push(cyl(0.25, 0.18, 4, 7, x, 0, z)); lf.push(new THREE.IcosahedronGeometry(3.2, LITE ? 0 : 1).toNonIndexed().scale(1, 1.15, 1).translate(x, 6.6, z)); }
  bag.add('wood', K.merge(tr)); M.leaf = new THREE.MeshLambertMaterial({color: 0x5f7f3c, flatShading: true}); bag.add('leaf', K.merge(lf));
  grp.userData.tris = bag.flush(grp, M, 'walker');
  return grp;
}

/* ---------- interior (near only) ---------- */
function buildInt() {
  const grp = new THREE.Group(); grp.name = 'walker-int'; const M = grp.userData.M = ext.userData.M, bag = Bag(), I = 1;
  const floor = (x0, x1, z0, z1, y, mat, ceil, noS) => { if (!noS) S.push({x0, x1, z0, z1, y, i: I}); bag.add(mat, hq(x0, x1, z0, z1, y, false, 1)); if (ceil !== false) bag.add(ceil || 'plaster', box(x0, x1, y - 0.35, y - 0.01, z0, z1, 'Y')); };
  const ceilQ = (x0, x1, z0, z1, y, mat) => bag.add(mat || 'plaster', hq(x0, x1, z0, z1, y, true, 1));
  const lamp = (x, z, y, w, d) => bag.add('lamp', hq(x - w / 2, x + w / 2, z - d / 2, z + d / 2, y - 0.02, true, 1));
  const ZW = 15.3;   // stairs: wells x +-[14.9, 18.1], z 15.3..23.5
  // ---- floors
  floor(-XE, XE, -27.88, ZW, YB, 'oak', false); floor(-14.9, 14.9, ZW, ZF - 0.3, YB, 'oak', false);
  floor(-XE, XE, -27.88, ZW, Y1, 'terrazzo'); floor(-14.9, 14.9, ZW - 0.2, ZF, Y1, 'marble');
  for (const s of [-1, 1]) { floor(s < 0 ? -XS : XA + 0.15, s < 0 ? -XA - 0.15 : XS, ZN, ZH, Y2, 'terrazzo'); floor(s < 0 ? -XE : XS, s < 0 ? -XS : XE, ZN, ZH, Y2, 'oak'); }
  floor(-XE, XE, -27.88, ZN, Y2, 'oak'); floor(-14.9, 14.9, ZH - 0.2, ZF, Y2, 'oak');
  floor(-XS, XS, ZN, ZH, Y3, 'gym', 'coffer'); for (const s of [-1, 1]) floor(s < 0 ? -XE : XS, s < 0 ? -XS : XE, ZN, ZH, Y3, 'oak'); floor(-XE, XE, -27.88, ZN, Y3, 'oak'); floor(-14.9, 14.9, ZH - 0.2, ZF, Y3, 'oak');
  ceilQ(-XE, XE, -27.88, ZF, YP - 0.75); ceilQ(-XS, XS, ZN, ZH, YG - 0.45);
  // great hall: coffered ceiling with beams, colonnade, balcony guards, murals, chandeliers
  bag.add('coffer', hq(-XS, XS, ZN, ZH, YC - 0.02, true, 1));
  if (!LITE) { for (let x = -XS; x <= XS + 0.01; x += 2.975) bag.add('trim', box(x - 0.18, x + 0.18, YC - 0.55, YC, ZN, ZH, 'Y')); for (let z = ZN; z <= ZH + 0.01; z += 3.01) bag.add('trim', box(-XS, XS, YC - 0.55, YC, z - 0.18, z + 0.18, 'Y')); }
  const cs = LITE ? 10 : HI ? 20 : 14;
  for (const s of [-1, 1]) for (let i = 0; i < 6; i++) { const x = s * XA, z = -7 + i * 4.0;
    bag.add('trim', box(x - 0.6, x + 0.6, Y1, Y1 + 0.35, z - 0.6, z + 0.6)); bag.add('trim', cyl(0.46, 0.4, YC - 0.9 - Y1 - 0.35, cs, x, Y1 + 0.35, z, [2.9, 12]));
    bag.add('trim', cyl(0.42, 0.62, 0.4, cs, x, YC - 0.95, z)); bag.add('gold', box(x - 0.66, x + 0.66, YC - 0.6, YC - 0.5, z - 0.66, z + 0.66)); WL.push({x0: x - 0.45, x1: x + 0.45, z0: z - 0.45, z1: z + 0.45, y0: Y1, y1: YC, i: I}); }
  for (const s of [-1, 1]) { const x = s * (XA + 0.15); bag.add('trim', box(x - 0.12, x + 0.12, Y2 - 0.6, Y2, ZN, ZH)); bag.add('trim', box(x - 0.1, x + 0.1, Y2 + 1.0, Y2 + 1.1, ZN, ZH));
    bag.add('win', vq(x, Y2 + 0.55, (ZN + ZH) / 2, ZH - ZN, 0.9, s < 0 ? 'X' : 'x', [CELL(15)[0], CELL(15)[1], CELL(15)[0] + 0.25 * 1, CELL(15)[3]]));
    WL.push({x0: x - 0.1, x1: x + 0.1, z0: ZN, z1: ZH, y0: Y2, y1: Y2 + 1.1, i: I}); bag.add('plaster', box(s < 0 ? -XS : XA + 0.15, s < 0 ? -XA - 0.15 : XS, Y2 - 0.6, Y2 - 0.36, ZN, ZH, 'Y')); }
  { const at = TX.murals || (TX.murals = (() => { const t = new THREE.TextureLoader().load(BASE + (LITE ? 'murals_lite.jpg' : 'murals.jpg') + '?v=' + AV); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = LITE ? 2 : 8; return t; })());
    M.mural = M.mural || new THREE.MeshLambertMaterial({map: at, emissive: 0xffffff, emissiveMap: at, emissiveIntensity: 0.38});
    const zn = ZN + 0.22, zs = ZH - 0.22, u = v => v / 2048, fr = (cx, cy, cz, w, h, n) => { const t2 = 0.16, d = n === 'Z' ? 1 : -1; for (const b of [[cx - w / 2 - t2, cx + w / 2 + t2, cy + h / 2, cy + h / 2 + t2], [cx - w / 2 - t2, cx + w / 2 + t2, cy - h / 2 - t2, cy - h / 2], [cx - w / 2 - t2, cx - w / 2, cy - h / 2, cy + h / 2], [cx + w / 2, cx + w / 2 + t2, cy - h / 2, cy + h / 2]]) bag.add('gold', box(b[0], b[1], b[2], b[3], Math.min(cz, cz + d * 0.1), Math.max(cz, cz + d * 0.1))); };
    const mq = (cx, cy, cz, w, h, n, r) => { bag.add('mural', vq(cx, cy, cz, w, h, n, r)); fr(cx, cy, cz, w, h, n); };
    mq(0, Y1 + 4.2 + 3.37, zn, 5.2, 6.74, 'Z', [0, 0.5, u(790), 1]); mq(-5.2, Y1 + 4.2 + 2.67, zn, 3.0, 5.33, 'Z', [u(790), 0.5, u(1366), 1]); mq(5.2, Y1 + 4.2 + 2.67, zn, 3.0, 5.33, 'Z', [u(1366), 0.5, u(1942), 1]);
    mq(5.6, Y1 + 3.8 + 2.67, zs, 3.0, 5.33, 'z', [0, 0, u(576), 0.5]); mq(-5.6, Y1 + 3.8 + 2.67, zs, 3.0, 5.33, 'z', [u(576), 0, u(1152), 0.5]);
    bag.add('glow', vq(-XS + 0.06 + 0.0, Y1 + 1.6, ZH - 2.2, 0.9, 0.9, 'X', CELL(11))); }
  for (let i = 0; i < (LITE ? 2 : 3); i++) { const z = ZN + (ZH - ZN) * (i + 0.5) / (LITE ? 2 : 3); bag.add('gold', cyl(0.03, 0.03, YC - 11.2, 6, 0, 11.2, z)); bag.add('gold', cyl(1.3, 1.0, 0.5, 16, 0, 10.7, z)); bag.add('lamp', cyl(1.1, 1.2, 0.35, 16, 0, 10.4, z));
    if (!LITE) for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; bag.add('lamp', new THREE.SphereGeometry(0.13, 8, 6).toNonIndexed().translate(Math.cos(a) * 1.25, 11.25, z + Math.sin(a) * 1.25)); } }
  for (const s of [-1, 1]) for (let z = ZN + 2; z < ZH; z += 4) lamp(s * (XA + 2.3), z, Y2 - 0.36, 0.7, 0.7);
  // hall side walls: openings to rooms + arched (borrowed-light) windows on the aisle faces and above the balcony
  for (const s of [-1, 1]) { const x = s * XS, n = s < 0 ? 'X' : 'x';
    wall(bag, 'plaster', 'z', x, ZN, ZH, Y1, YC, 0.3, [{c: 2, w: 1.6, h: 2.7, b: Y1}, {c: -6, w: 1.6, h: 2.7, b: Y1}, {c: 2, w: 1.6, h: 2.7, b: Y2}], I);
    for (const z of [-2.0, 6.0, 10.5]) bag.add('glow', vq(x - s * 0.16, Y1 + 2.9, z, 2.2, 3.6, n, CELL(5)));
    for (const z of [-5, 0, 5, 10]) bag.add('glow', vq(x - s * 0.16, Y2 + 3.4, z, 2.0, 3.6, n, CELL(5))); }
  // lobby / hall wall (south): 3 doors + 2 aisle arches; L2 openings to the balcony
  const dz = []; wall(bag, 'plaster', 'x', ZH, -XE, XE, Y1, Y3, 0.4, [{c: -3.2, w: 1.8, h: 3.2, b: Y1, d: 1}, {c: 0, w: 1.8, h: 3.2, b: Y1, d: 1}, {c: 3.2, w: 1.8, h: 3.2, b: Y1, d: 1}, {c: -9.6, w: 2.4, h: 4.0, b: Y1}, {c: 9.6, w: 2.4, h: 4.0, b: Y1}, {c: -9.6, w: 1.6, h: 2.7, b: Y2}, {c: 9.6, w: 1.6, h: 2.7, b: Y2}], I, (o, l, r, b) => { if (o.d) dz.push(o); });
  for (const o of dz) { const d = addDoor(grp, bag, 'x', ZH, o.c, Y1, o.w, o.h, 0.4); WL.push({x0: o.c - o.w / 2, x1: o.c + o.w / 2, z0: ZH - 0.2, z1: ZH + 0.2, y0: Y1, y1: Y1 + o.h, door: d, i: I}); }
  // north wall of the hall: 3 doors under the murals, aisle doorways, balcony doorways
  const dn = []; wall(bag, 'plaster', 'x', ZN, -XE, XE, Y1, Y3, 0.4, [{c: -3.2, w: 1.8, h: 3.2, b: Y1, d: 1}, {c: 0, w: 1.8, h: 3.2, b: Y1, d: 1}, {c: 3.2, w: 1.8, h: 3.2, b: Y1, d: 1}, {c: -9.6, w: 1.6, h: 2.7, b: Y1}, {c: 9.6, w: 1.6, h: 2.7, b: Y1}, {c: -9.6, w: 1.6, h: 2.7, b: Y2}, {c: 9.6, w: 1.6, h: 2.7, b: Y2}], I, (o) => { if (o.d) dn.push(o); });
  for (const o of dn) { const d = addDoor(grp, bag, 'x', ZN, o.c, Y1, o.w, o.h, 0.4); WL.push({x0: o.c - o.w / 2, x1: o.c + o.w / 2, z0: ZN - 0.2, z1: ZN + 0.2, y0: Y1, y1: Y1 + o.h, door: d, i: I}); }
  // entrance wall inner face + portal doors (the opening is in the exterior wall)
  bag.add('plaster', box(-14.9, 14.9, Y1, YP - 0.75, ZF - 0.32, ZF - 0.3)); for (const c of [-4.34, 0, 4.34]) { const d = addDoor(grp, bag, 'x', ZF, c, Y1, 2.3, 4.5, 0.6, 4); WL.push({x0: c - 1.15, x1: c + 1.15, z0: ZF - 0.3, z1: ZF + 0.3, y0: Y1, y1: Y1 + 4.5, door: d, i: I}); }
  for (const c of [-4.34, 0, 4.34]) bag.add('glow', vq(c, Y2 + 1.8, ZF - 0.34, 1.8, 2.6, 'z', CELL(4))); for (const c of [-10.85, 10.85]) { bag.add('glow', vq(c, Y1 + 2.6, ZF - 0.34, 1.9, 3.8, 'z', CELL(4))); bag.add('glow', vq(c, Y2 + 1.8, ZF - 0.34, 1.7, 2.4, 'z', CELL(4))); }
  bag.add('glow', vq(-6.6, Y1 + 1.7, ZF - 0.35, 0.9, 0.9, 'z', CELL(10)));
  // inner faces of the side + north walls with daylight windows; L3 attic + gym
  for (const s of [-1, 1]) { const x = s * XE, n = s < 0 ? 'X' : 'x'; bag.add('plaster', box(s < 0 ? x - 0.02 : x, s < 0 ? x : x + 0.02, YB, YP - 0.75, -27.88, ZF - 0.3));
    for (let z = -25.5; z <= 21; z += 4.1) { if (z > 14.5) continue; bag.add('glow', vq(x - s * 0.03, Y1 + 2.7, z, 1.9, 3.6, n, CELL(4))); bag.add('glow', vq(x - s * 0.03, Y2 + 1.9, z, 1.6, 2.3, n, CELL(4))); bag.add('glow', vq(x - s * 0.03, 17.2, z, 1.3, 1.5, n, CELL(4))); } }
  bag.add('plaster', box(-XE, XE, YB, YP - 0.75, -27.9, -27.88));
  for (let x = -14.4; x <= 14.5; x += 4.1) { if (Math.abs(x) < 1) continue; bag.add('glow', vq(x, Y1 + 2.7, -27.86, 1.9, 3.6, 'Z', CELL(4))); bag.add('glow', vq(x, Y2 + 1.9, -27.86, 1.6, 2.3, 'Z', CELL(4))); bag.add('glow', vq(x, 17.2, -27.86, 1.3, 1.5, 'Z', CELL(4))); }
  for (const s of [-1, 1]) { const x = s * (XS - 0.22); bag.add('plaster', box(s < 0 ? -XS : x - 0.02, s < 0 ? x + 0.02 : XS, Y3, YG - 0.45, ZN, ZH));
    for (const z of [-4.3, 3.05, 10.4]) bag.add('glow', vq(x + s * 0.0 - s * 0.03, YP + 2.4, z, 5.2, 2.6, s < 0 ? 'X' : 'x', [CELL(6)[0], CELL(6)[1], CELL(6)[2], CELL(6)[1] + 0.125])); }
  wall(bag, 'plaster', 'x', ZH, -XS, XS, Y3, YG - 0.45, 0.4, [{c: -4, w: 1.8, h: 2.7, b: Y3}, {c: 4, w: 1.8, h: 2.7, b: Y3}], I); bag.add('glow', vq(0, YP + 2.4, ZH - 0.22, 5.2, 2.6, 'z', [CELL(6)[0], CELL(6)[1], CELL(6)[2], CELL(6)[1] + 0.125]));
  wall(bag, 'plaster', 'x', ZN, -XS, XS, Y3, YG - 0.45, 0.4, null, I); for (const s of [-1, 1]) wall(bag, 'plaster', 'z', s * XS, ZN, ZH, YP - 0.75, YG - 0.45, 0.01, null, I);
  bag.add('glow', vq(-8, Y3 + 1.8, ZH - 0.22, 0.9, 0.9, 'z', CELL(13)));
  // gym: hoops, wall pads, a viewing bench row, lights
  for (const e of [ZN + 0.3, ZH - 0.3]) { const s = e < 0 ? 1 : -1; bag.add('iron', box(-0.06, 0.06, Y3 + 3.0, Y3 + 3.1, e, e + s * 1.2)); bag.add('cloth', box(-0.9, 0.9, Y3 + 2.9, Y3 + 3.95, e + s * 1.2, e + s * 1.24)); bag.add('red', K.xform(new THREE.TorusGeometry(0.23, 0.02, 4, 12).toNonIndexed().rotateX(Math.PI / 2), 0, Y3 + 3.05, e + s * 1.5));
    bag.add('acoustic', box(-6, 6, Y3, Y3 + 1.8, Math.min(e, e + s * 0.08), Math.max(e, e + s * 0.08))); }
  for (const s of [-1, 1]) for (let k = 0; k < 2; k++) bag.add('oak', box(s * (XS - 0.6 - k * 0.6) - 0.3, s * (XS - 0.6 - k * 0.6) + 0.3, Y3, Y3 + 0.45 + k * 0.45, ZN + 3, ZH - 3));
  for (let x = -8; x <= 8; x += 8) for (let z = ZN + 3; z < ZH; z += 6) lamp(x, z, YG - 0.45, 1.2, 1.2);
  // rooms: partitions with doorways (main / second / attic), elevator, stair wells
  for (const s of [-1, 1]) { const xa = s < 0 ? -XE : XS, xb = s < 0 ? -XS : XE, xc = s * 15;
    for (const [y0, y1] of [[Y1, Y2 - 0.35], [Y2, Y3 - 0.35], [Y3, YP - 0.75]]) { wall(bag, 'plaster', 'x', 4.5, xa, xb, y0, y1, 0.2, [{c: xc, w: 1.2, h: 2.4, b: y0}], I); for (let z = ZN + 2; z < ZH; z += 5) lamp(xc, z, y1, 1.0, 0.6); } }
  wall(bag, 'plaster', 'z', -1.4, -27.88, ZN, Y1, Y2 - 0.35, 0.2, [{c: -18, w: 1.6, h: 2.6, b: Y1}], I); wall(bag, 'plaster', 'z', 0, -27.88, ZN, Y2, Y3 - 0.35, 0.2, [{c: -18, w: 1.6, h: 2.6, b: Y2}], I); wall(bag, 'plaster', 'z', 0, -27.88, ZN, Y3, YP - 0.75, 0.2, [{c: -18, w: 1.6, h: 2.6, b: Y3}], I);
  for (let x = -14; x <= 14; x += 7) for (let z = -25; z < ZN; z += 6) { lamp(x, z, Y2 - 0.36, 1.0, 1.0); lamp(x, z, Y3 - 0.36, 1.0, 1.0); lamp(x, z, YP - 0.76, 1.0, 1.0); }
  for (let x = -10; x <= 10; x += 5) { lamp(x, 18.5, Y2 - 0.36, 1.0, 1.0); lamp(x, 18.5, Y3 - 0.36, 1.0, 1.0); lamp(x, 18.5, YP - 0.76, 1.0, 1.0); lamp(x, 20, Y1 - 0.36, 0.8, 0.8); }
  for (const s of [-1, 1]) { const x0 = s < 0 ? -XE : 14.9, x1 = s < 0 ? -14.9 : XE; stairs(bag, x0, x1, ZW, 23.5, [YB, Y1, Y2, Y3], I);
    wall(bag, 'plaster', 'z', s * 14.9, ZW, 22.1, YB, YP - 0.75, 0.2, null, I); }
  // elevator (east, by the hall): a lit cab with level buttons on every floor
  { const xa = 12.3, xb = 14.7, za = 11.9, zb = 14.7; for (const y of [YB, Y1, Y2, Y3]) { wall(bag, 'trim', 'x', za, xa, xb, y, y + 2.6, 0.12, [{c: (xa + xb) / 2, w: 1.3, h: 2.3, b: y}], I); bag.add('gold', box(xb - 0.1, xb - 0.06, y + 1.1, y + 1.5, za + 0.4, za + 0.7)); }
    wall(bag, 'trim', 'z', xa, za, zb, YB, YP - 0.75, 0.12, null, I); wall(bag, 'trim', 'z', xb, za, zb, YB, YP - 0.75, 0.12, null, I);
    const LV = [YB, Y1, Y2, Y3], NM = ['Basement', 'Main floor', 'Second floor / balcony', 'Third floor / gymnasium'];
    LV.forEach((y, k) => { const w = toW(xb - 0.12, za + 0.55), e = document.createElement('a-box'); e.setAttribute('class', 'btn'); e.setAttribute('position', `${w[0]} ${P.y + y + 1.3} ${w[1]}`);
      e.setAttribute('width', 0.4); e.setAttribute('height', 0.6); e.setAttribute('depth', 0.5); e.setAttribute('rotation', `0 ${ROT * 180 / Math.PI} 0`); e.setAttribute('material', 'shader: flat; opacity: 0; transparent: true; depthWrite: false');
      e.addEventListener('click', () => { const n = (k + 1) % LV.length, c = toW((xa + xb) / 2, (za + zb) / 2 - 0.3); W3D.teleportTo(c[0], P.y + LV[n] + 0.02, c[1], ROT * 180 / Math.PI); if (window.JFVR && JFVR.hud) JFVR.hud('Elevator: ' + NM[n]); });
      sc().appendChild(e); elevEls.push(e); }); }
  // furniture: lobby desk + benches, hall banquet rounds (instanced chairs), lounge sofas
  bag.add('oak', box(-8.5, -5.5, Y1, Y1 + 1.1, 20.6, 21.4)); for (const x of [-11, 11]) bag.add('wood', box(x - 1.2, x + 1.2, Y1, Y1 + 0.45, 16.2, 16.7));
  const nT = LITE ? 6 : QUEST ? 12 : 18, tables = []; for (let i = 0; i < nT; i++) { const cols = LITE ? 2 : 3, r = Math.floor(i / cols), c = i % cols, x = (c - (cols - 1) / 2) * (LITE ? 6 : 4.4), z = -5.5 + r * (LITE ? 6.5 : 3.6); if (z > 12) continue; tables.push([x, z]);
    bag.add('cloth', cyl(0.95, 0.85, 0.76, LITE ? 10 : 16, x, Y1, z)); bag.add('cloth', cyl(0.86, 0.86, 0.02, LITE ? 10 : 16, x, Y1 + 0.76, z)); bag.add('gold', cyl(0.06, 0.04, 0.3, 6, x, Y1 + 0.78, z)); }
  if (!LITE) { const cg = K.merge([box(-0.21, 0.21, 0.44, 0.48, -0.21, 0.21), box(-0.21, 0.21, 0.48, 0.95, 0.18, 0.22), box(-0.2, -0.17, 0, 0.44, -0.2, -0.17), box(0.17, 0.2, 0, 0.44, -0.2, -0.17)]), per = QUEST ? 6 : 8;
    const im = new THREE.InstancedMesh(cg, M.chair || (M.chair = new THREE.MeshLambertMaterial({color: 0x8a5a32, emissive: 0x24160b})), tables.length * per), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1); let n = 0;
    for (const [x, z] of tables) for (let k = 0; k < per; k++) { const a = k / per * Math.PI * 2; q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -a + Math.PI / 2 * 0 + Math.PI); v.set(x + Math.sin(a) * 1.25, Y1, z + Math.cos(a) * 1.25); m4.compose(v, q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), a + Math.PI), one); im.setMatrixAt(n++, m4); }
    im.name = 'walker-chairs'; grp.add(im); grp.userData.instTris = tris(cg) * n; }
  for (const x of [-8, 0, 8]) { bag.add('red', box(x - 1.3, x + 1.3, Y2, Y2 + 0.45, 19.5, 20.4)); bag.add('red', box(x - 1.3, x + 1.3, Y2 + 0.45, Y2 + 1.0, 20.2, 20.4)); bag.add('red', hq(x - 2, x + 2, 17.5, 19.3, Y2 + 0.01, false, 4)); }
  // basement: stair hall, corridor, games room (two bowling lanes, billiards), radio studios (glass, consoles, ON AIR), plant, rear door
  wall(bag, 'plaster', 'x', ZW, -XE, XE, YB, Y1 - 0.35, 0.3, [{c: 0, w: 2.4, h: 2.6, b: YB}], I);
  for (const s of [-1, 1]) { const opens = [{c: 4, w: 1.4, h: 2.4, b: YB}, {c: -18, w: 1.4, h: 2.4, b: YB}]; wall(bag, 'plaster', 'z', s * 2, -27.88, ZW, YB, Y1 - 0.35, 0.2, opens, I); }
  wall(bag, 'plaster', 'x', ZN, -XE, -2, YB, Y1 - 0.35, 0.2, [{c: -10, w: 1.4, h: 2.4, b: YB}], I); wall(bag, 'plaster', 'x', ZN, 2, XE, YB, Y1 - 0.35, 0.2, [{c: 10, w: 1.4, h: 2.4, b: YB}], I);
  { const d = addDoor(grp, bag, 'x', -28.0, 0, YB, 1.8, 2.7, 0.5, 2.6); WL.push({x0: -0.9, x1: 0.9, z0: -28.4, z1: -27.9, y0: YB, y1: YB + 2.7, door: d, i: I}); }
  for (let z = -26; z < ZW; z += 4) { lamp(0, z, Y1 - 0.36, 0.6, 1.4); } for (const x of [-12, -6, 8, 14]) for (let z = -6; z < ZW; z += 5) lamp(x, z, Y1 - 0.36, 1.0, 1.0);
  for (const x of [-15.5, -12.5]) { bag.add('oak', box(x - 0.55, x + 0.55, YB, YB + 0.12, -8.5, 13)); bag.add('wood', box(x - 0.75, x - 0.55, YB, YB + 0.25, -8.5, 13)); bag.add('wood', box(x + 0.55, x + 0.75, YB, YB + 0.25, -8.5, 13));
    for (let r = 0; r < 4; r++) for (let k = 0; k <= r; k++) bag.add('cloth', cyl(0.06, 0.05, 0.38, 6, x + (k - r / 2) * 0.3, YB + 0.12, -7.6 + r * 0.26)); }
  bag.add('wood', box(-8.4, -5.6, YB, YB + 0.8, 3.0, 4.6)); bag.add('felt', box(-8.25, -5.75, YB + 0.8, YB + 0.86, 3.15, 4.45));
  { wall(bag, 'glass', 'x', 3, 2, XE, YB, Y1 - 0.35, 0.06, [{c: 10, w: 1.2, h: 2.3, b: YB}], I); bag.add('acoustic', box(XE - 0.08, XE - 0.02, YB + 0.3, Y1 - 0.5, -8, 14)); bag.add('acoustic', box(2.12, 2.18, YB + 0.3, Y1 - 0.5, -8, 2.5));
    for (const z of [-4, 8]) { bag.add('dark', box(9, 13, YB, YB + 0.85, z - 0.6, z + 0.6)); bag.add('dark', box(10, 12, YB + 0.85, YB + 1.3, z + 0.3, z + 0.4)); bag.add('iron', cyl(0.02, 0.02, 0.5, 5, 11, YB + 0.85, z - 0.3)); }
    for (let z = -8; z < 2; z += 1.0) bag.add('wood', box(16.8, 17.9, YB, YB + 2.0, z, z + 0.9)); bag.add('glow', vq(10, YB + 2.75, 3.05, 1.0, 1.0, 'Z', CELL(14))); bag.add('glow', vq(6, YB + 1.7, 14.85, 0.9, 0.9, 'z', CELL(12))); }
  for (const [x, z] of [[-10, -18], [-14, -22], [10, -20]]) bag.add('dark', cyl(1.0, 1.0, 2.6, 12, x, YB, z));
  grp.userData.tris = bag.flush(grp, M, 'walker-int') + (grp.userData.instTris || 0);
  return grp;
}

/* ---------- lifecycle ---------- */
const sc = () => document.querySelector('a-scene');
function place() { const a = anchor(); if (!a) return false; const mv = Math.hypot(a.x - P.x, a.z - P.z) > 0.5 || !P.ok; if (!mv) return false;
  P.x = a.x; P.z = a.z; P.src = a.src; if (!P.ok) { const h = W3D.cityH ? W3D.cityH(P.x, P.z) : null; P.y = h !== null && h !== undefined ? h : 0; } P.ok = true; P.fit = 0; P.fitN = 0; return true; }
function pose(g) { g.position.set(P.x, P.y, P.z); g.rotation.set(0, ROT, 0); g.updateMatrixWorld(true); }
function setRect(on) { const U = W3D.clipU; if (!U) return; const R = U.jfRect.value[3]; if (on) R.set(P.x, P.z, 44, 10); else R.set(0, 0, -1, 0); }
function dropInt() { if (!intr) return; const s3 = sc().object3D; s3.remove(intr); intr.traverse(o => { if (o.geometry) o.geometry.dispose(); }); intr = null;
  for (let i = S.length - 1; i >= 0; i--) if (S[i].i) S.splice(i, 1); for (let i = WL.length - 1; i >= 0; i--) if (WL[i].i) WL.splice(i, 1);
  const D = W3D.doors || []; for (const d of doorList) { const k = D.indexOf(d); if (k >= 0) D.splice(k, 1); if (d.hitEl && d.hitEl.parentNode) d.hitEl.parentNode.removeChild(d.hitEl); } doorList.length = 0; for (const e of elevEls) if (e.parentNode) e.parentNode.removeChild(e); elevEls.length = 0; }
function dropAll() { dropInt(); if (!ext) return; sc().object3D.remove(ext); ext.traverse(o => { if (o.geometry) o.geometry.dispose(); const ms = o.material ? [].concat(o.material) : []; ms.forEach(m => { if (m.map && m.map !== TX.atlas && !Object.values(TX).includes(m.map)) m.map.dispose(); }); });
  ext = null; S.length = 0; WL.length = 0; setRect(false); }
function ensureExt() { if (ext) return; if (!W3D.cities || !W3D.cities.Kit) return; place(); ext = buildExt(); pose(ext); sc().object3D.add(ext); setRect(true); }
function ensureInt() { if (intr || !ext) return; intr = buildInt(); pose(intr); sc().object3D.add(intr); }
// fit our grade to the Google ground around the site (ring of downward rays outside the footprint), a few times while tiles refine
const _rc = new THREE.Raycaster(), _o = new THREE.Vector3(), _d = new THREE.Vector3(0, -1, 0);
function fitGrade(cam) {
  const RE = W3D.realEarth; if (!RE || !RE.tiles || !RE.tiles.group.visible || P.fitN >= 8) return; const hs = [];
  for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, w = toW(Math.cos(a) * 52, Math.sin(a) * 60); _rc.set(_o.set(w[0], P.y + 400, w[1]), _d); _rc.far = 800; const h = _rc.intersectObject(RE.tiles.group, true)[0]; if (h) hs.push(h.point.y); }
  if (hs.length < 8) return; hs.sort((a, b) => a - b); const g = hs[Math.floor(hs.length * 0.3)]; P.fitN++;
  const l = toL(cam.x, cam.z), inside = Math.abs(l[0]) < 26 && Math.abs(l[1]) < 40; if (inside || Math.abs(g - P.y) < 0.08) return;
  P.y = g; if (ext) pose(ext); if (intr) dropInt(); }
const _c = new THREE.Vector3();
AFRAME.registerSystem('w3d-walker', { tick: function (t) {
  if (t - (this.lt || 0) < 400) return; this.lt = t; const C = W3D.cities; if (!C || !this.el.camera) return;
  this.el.camera.getWorldPosition(_c); const city = C.current && C.current();
  if (city === 'boston' && place() && ext) { pose(ext); if (intr) dropInt(); setRect(true); }
  const d = Math.hypot(_c.x - P.x, _c.z - P.z), want = (city === 'boston' && C.isReady('boston')) || (ext && d < 400);
  if (!want || d > 4500) { if (ext) dropAll(); return; }
  ensureExt(); if (!ext) return;
  if (d < 110) ensureInt(); else if (d > 160 && intr) dropInt();
  const RE = W3D.realEarth, reOn = !!(RE && RE.tiles && RE.tiles.group.visible); if (ext.userData.far) ext.userData.far.visible = !reOn;
  if (reOn && d < 900 && t - (this.ft || 0) > 3000) { this.ft = t; fitGrade(_c); }
} });
function hooks() { W3D.gHooks = W3D.gHooks || []; W3D.bHooks = W3D.bHooks || []; if (W3D.gHooks.indexOf(gHook) < 0) W3D.gHooks.push(gHook); if (W3D.bHooks.indexOf(bHook) < 0) W3D.bHooks.push(bHook); }
hooks();
// spot: foot of the front steps, facing the portico (loads the Boston scene first)
function front() { const w = toW(0, 36.5); return {x: w[0], z: w[1], y: P.y + 0.02, yaw: ROT * 180 / Math.PI}; }
function go() { const C = W3D.cities; if (!C) return; C.enter('boston'); C.load('boston').then(() => { place(); ensureExt(); const f = front(); W3D.teleportTo(f.x, f.y, f.z, f.yaw); }); }
W3D.walker = {go, front, P, S, WL, toW, toL, stats: () => { let et = 0, it = 0, ed = 0, id = 0; if (ext) ext.traverse(o => { if (o.isMesh && o.visible) { et += tris(o.geometry); ed++; } }); if (intr) intr.traverse(o => { if (o.isMesh) { it += tris(o.geometry) * (o.isInstancedMesh ? o.count : 1); id++; } });
  return {ext: Math.round(et), int: Math.round(it), extDraws: ed, intDraws: id, built: !!ext, interior: !!intr, P: {x: +P.x.toFixed(1), y: +P.y.toFixed(2), z: +P.z.toFixed(1), src: P.src, fitN: P.fitN}, surfaces: S.length, walls: WL.length, doors: doorList.length}; }};
(function addSpot() { if (!W3D.spots) return setTimeout(addSpot, 50); W3D.spots.walker = go; })();
})();
