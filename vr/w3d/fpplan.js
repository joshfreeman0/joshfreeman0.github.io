/* Fowling Pond structure + master plan exhibit, "Show my design" overlay and Street View (Josh, Nov 27 2026).
   - Exhibit: five big readable panels in a half-ring near the bank compound (placed on clear dry ground, picked at run time):
     org chart, budget + money flow (PLAY MONEY), Church vs Fowling Pond, timeline wall (Gantt), progress bars. Data comes from
     /vr/structure/data.json, /vr/structure/progress.json and /vr/plan/plan.json - the same files the web pages and PDFs use.
     ?spot=structure faces the chart, ?spot=plan the timeline. One canvas texture per panel, built on first visit (~0 tris to speak of).
   - Show my design: semi-transparent ghosts of the plan over the real Google 3D tiles - restored lake outline, ring road, beaches,
     lighthouse (East Britannia St lot) and the bank compound - from /vr/plan/design.json. Toggle in Go to > Exhibits (2D + headset).
   - Street View: a "Street View" button whenever Real Earth is on opens Google Street View for the spot you're looking at. Embedded
     panel when the Maps Embed API is enabled on the site key (SV_EMBED), otherwise a Google Maps link. WebXR can't show Street View,
     so in the headset it waits until you exit VR. */
(function () {
'use strict';
const W3D = window.W3D = window.W3D || {};
const LITE = !!window.JFVR_LITE, SV_EMBED = !!window.JFVR_SV_EMBED;   // set JFVR_SV_EMBED = true (gk.js) once Maps Embed API is enabled on the key
const LON0 = -71.06797286566898, LAT0 = 41.928658149882345, KX = 82938.7775, KY = 111071.9356;
const J = u => fetch(u + '?v=' + Date.now().toString(36).slice(0, -3)).then(r => r.json());
let DATA = null, PROG = null, PLAN = null, DES = null, ex = null, EXP = null, ghosts = null;
const load = () => Promise.all([J('structure/data.json'), J('structure/progress.json'), J('plan/plan.json'), J('plan/design.json')]).then(a => { [DATA, PROG, PLAN, DES] = a; });
const tH = (x, z) => { let y = W3D.terrainH ? W3D.terrainH(x, z) : 0; return isFinite(y) ? y : 0; };
const hud = t => { if (window.JFVR && JFVR.hud) JFVR.hud(t); };
const M = n => '$' + (n >= 1e9 ? (n / 1e9).toFixed(2) + 'B' : (n / 1e6).toFixed(1) + 'M');
/* ---------- exhibit site: first clear, dry spot near the bank compound ---------- */
function pickSite() {
  const C = [[905, -228, 180], [760, -300, 135], [1050, -230, 200], [700, -380, 90], [1060, -470, 270], [905, -180, 180]], W = W3D.water ? W3D.water.water || 16.5 : 16.5;
  for (const [x, z, yaw] of C) { const r = 14; let ok = true;
    for (const k of (W3D.keepOut || [])) if (Math.hypot(k.x - x, k.z - z) < (k.r || 0) + r) { ok = false; break; }
    for (let a = 0; ok && a < 8; a++) { const px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r; if (tH(px, pz) < W + 0.6) ok = false; }
    if (ok) return {x, z, yaw}; }
  return {x: C[0][0], z: C[0][1], yaw: C[0][2]}; }
/* ---------- canvas panels ---------- */
function cv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.fillStyle = '#0d1f29'; g.fillRect(0, 0, w, h); g.strokeStyle = '#c9a24a'; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10); return [c, g]; }
function wrap(g, t, w) { const o = []; let l = ''; String(t).split(' ').forEach(wd => { const n = l ? l + ' ' + wd : wd; if (g.measureText(n).width > w && l) { o.push(l); l = wd; } else l = n; }); if (l) o.push(l); return o; }
function text(g, t, x, y, w, size, col, bold, lh) { g.font = (bold ? 'bold ' : '') + size + 'px system-ui, sans-serif'; g.fillStyle = col || '#eef4f6'; const L = wrap(g, t, w); L.forEach((s, i) => g.fillText(s, x, y + i * (lh || size * 1.22))); return y + L.length * (lh || size * 1.22); }
function title(g, t, sub, w) { text(g, t, 40, 78, w - 80, 56, '#ffe08a', true); if (sub) text(g, sub, 40, 120, w - 80, 26, '#9fb4bd'); }
function box(g, x, y, w, h, fill, t, size) { g.fillStyle = fill; g.fillRect(x, y, w, h); g.strokeStyle = '#c9a24a'; g.lineWidth = 3; g.strokeRect(x, y, w, h); g.textAlign = 'center'; text(g, t, x + w / 2, y + h / 2 - size * 0.25 * (wrap(g, t, w - 16).length - 1) + size * 0.35, w - 16, size, '#fff', true); g.textAlign = 'left'; }
const W = 1600, H = 900;
function pOrg() { const [c, g] = cv(W, H); title(g, 'How Fowling Pond is organized', 'Founder > Realms > Regions > Districts > Rooms  -  every role has a written job, a term and a public budget line', W);
  const L = DATA.levels, cols = ['#5a3d0c', '#123e57', '#17485e', '#1d5468', '#24607a'];
  L.forEach((lv, i) => { const y = 160 + i * 128; box(g, 40, y, 300, 100, cols[i], lv[0], 34); text(g, lv[1], 370, y + 34, 780, 25, '#ffe9a8', true); text(g, lv[2], 370, y + 68, 780, 23); text(g, lv[3], 1180, y + 40, 380, 23, '#a8e0b0'); });
  text(g, 'Councils advise (they do not command): ' + DATA.councils.map(x => x[0]).join(' - ') + '.  Appeals: Room > District > Region > Appeals Panel > Founder.', 40, 820, W - 80, 24, '#cfe3ea');
  return c; }
function pBudget() { const [c, g] = cv(W, H), B = DATA.budget; title(g, 'Budget & money flow', B.label, W);
  g.fillStyle = '#7a1f1f'; g.fillRect(40, 140, W - 80, 46); g.textAlign = 'center'; text(g, 'PLAY MONEY - NOT LEGAL TENDER - Bank of the United States (3rd ed.) ledger, joshfreeman.org/vr/bank', W / 2, 172, W - 120, 26, '#fff', true); g.textAlign = 'left';
  text(g, B.appropriation, 40, 236, W - 80, 27);
  let x = 40; const tot = 15e9; B.split.forEach(([n, p], i) => { const w = (W - 80) * p / 100; g.fillStyle = ['#3d6b4a', '#1d5468', '#6a4c93', '#8a6a1d'][i]; g.fillRect(x, 300, w - 4, 90); text(g, n + ' ' + p + '%', x + 12, 338, w - 24, 26, '#fff', true); text(g, M(tot * p / 100) + ' (play)', x + 12, 372, w - 24, 22, '#e8eef0'); x += w; });
  let y = text(g, B.realm_formula, 40, 440, W - 80, 25);
  y = text(g, B.upward, 40, y + 14, W - 80, 25, '#ffe9a8');
  y = text(g, B.pence, 40, y + 14, W - 80, 25);
  text(g, 'Every allocation and transfer is a signed public ledger entry. Treasury Audit Council checks it every quarter.', 40, y + 24, W - 80, 25, '#a8e0b0', true);
  return c; }
function pCompare() { const [c, g] = cv(W, H); title(g, 'Catholic Church vs Fowling Pond', 'What we kept (a clear chain, money that flows to the centre) and what we fixed', W);
  g.fillStyle = '#1d3a48'; g.fillRect(40, 140, W - 80, 40); text(g, '', 0, 0, 1, 1); g.font = 'bold 24px system-ui'; g.fillStyle = '#ffe08a'; g.fillText('Topic', 52, 168); g.fillText('Catholic Church', 300, 168); g.fillText('Fowling Pond', 960, 168);
  let y = 200; DATA.compare.forEach((r, i) => { if (y > 860) return; const h0 = y; g.font = '20px system-ui'; const a = wrap(g, r[1], 630).length, b = wrap(g, r[2], 590).length, rh = Math.max(a, b) * 24 + 12;
    if (i % 2) { g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(40, y - 4, W - 80, rh); }
    text(g, r[0], 52, y + 18, 230, 21, '#ffe9a8', true); text(g, r[1], 300, y + 18, 630, 20, '#e3d6c8', false, 24); text(g, r[2], 960, y + 18, 590, 20, '#c8f0d0', false, 24); y = h0 + rh; });
  return c; }
function pTimeline() { const [c, g] = cv(W, H); title(g, 'Master plan timeline: Nov 2026 > ' + PLAN.end, 'Estimated - range ' + PLAN.end_range + '. Phase 1 is the lighthouse deal with the Diocese of Fall River.', W);
  const y0 = 2026, y1 = 2038, X0 = 560, X1 = W - 50, xo = s => { const [yy, mm] = s.split('-').map(Number); return X0 + (yy + (mm - 1) / 12 - y0) / (y1 - y0) * (X1 - X0); };
  g.font = '20px system-ui'; for (let yr = y0; yr <= y1; yr++) { const x = xo(yr + '-01'); g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(x, 150, 2, 680); g.fillStyle = '#9fb4bd'; g.fillText(String(yr), x + 4, 172); }
  const now = xo('2026-11'); g.fillStyle = '#ff6b6b'; g.fillRect(now, 150, 4, 680); g.fillText('now', now + 6, 845);
  PLAN.phases.forEach((p, i) => { const y = 190 + i * 70; text(g, p[1], 40, y + 30, 500, 22, '#eef4f6', false, 24); const a = xo(p[2]), b = xo(p[3]);
    g.fillStyle = p[4] === 'done' ? '#3d9b5a' : p[4] === 'underway' ? '#d9a93a' : '#3a7ca5'; g.fillRect(a, y + 8, Math.max(8, b - a), 40); });
  text(g, 'Blue = planned, gold = underway, green = done', 40, 868, 900, 20, '#9fb4bd');
  return c; }
function pProgress() { const [c, g] = cv(W, H), B = PLAN.budget; title(g, 'Progress & budget', 'Live from /vr/structure/progress.json  -  VR builds done; real-world work is at the concept stage', W);
  const ms = PROG.milestones; let y = 160; ms.slice(0, 19).forEach((m, i) => { const col = i < 10 ? 0 : 1, x = 40 + col * 780, yy = 160 + (i % 10) * 54;
    text(g, m[1], x, yy + 20, 470, 19, '#eef4f6', false, 22); g.fillStyle = '#23343c'; g.fillRect(x + 490, yy + 2, 240, 26); g.fillStyle = m[3] === 'done' ? '#3d9b5a' : m[3] === 'underway' ? '#d9a93a' : '#3a7ca5'; g.fillRect(x + 490, yy + 2, 240 * Math.max(0.02, m[4] / 100), 26);
    g.font = 'bold 18px system-ui'; g.fillStyle = '#fff'; g.fillText(m[3] + ' ' + m[4] + '%', x + 498, yy + 22); });
  y = 720; text(g, 'Integrated budget (2026 $, planning-level estimate, real money - not the play-money budget):', 40, y, W - 80, 24, '#ffe08a', true);
  text(g, 'Low ' + M(B.total[0]) + '   -   Mid ' + M(B.total[1]) + '   -   High ' + M(B.total[2]), 40, y + 50, W - 80, 40, '#fff', true);
  text(g, 'Includes 10% design/permits + 20% contingency. Excludes land purchase, tunnels, escalation. Sources in the PDF.', 40, y + 96, W - 80, 21, '#9fb4bd');
  return c; }
function panelMesh(cnv, w) { const t = new THREE.CanvasTexture(cnv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, w * cnv.height / cnv.width), new THREE.MeshBasicMaterial({map: t, side: THREE.DoubleSide, fog: false, toneMapped: false})); }
function buildExhibit() {
  EXP = pickSite(); const grp = new THREE.Group(); grp.name = 'fp-structure-exhibit'; const R = 6.6, y = tH(EXP.x, EXP.z), yaw = EXP.yaw * Math.PI / 180;
  const fx = -Math.sin(yaw), fz = -Math.cos(yaw);   // facing direction of a visitor at the centre
  const P = [pOrg, pBudget, pCompare, pTimeline, pProgress], post = new THREE.MeshLambertMaterial({color: 0x3a3d42});
  P.forEach((fn, i) => { const a = yaw + (i - 2) * 0.62, dx = -Math.sin(a), dz = -Math.cos(a), m = panelMesh(fn(), 4.1);
    const px = EXP.x + dx * R, pz = EXP.z + dz * R, gy = tH(px, pz); m.position.set(px, Math.max(gy, y) + 2.45, pz); m.lookAt(EXP.x, Math.max(gy, y) + 2.0, EXP.z); m.name = 'fp-panel-' + i; grp.add(m);
    for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.4, 0.1), post); p.position.copy(m.position); p.position.y = Math.max(gy, y) + 0.6; p.position.x += Math.cos(a) * s * 1.95; p.position.z -= Math.sin(a) * s * 1.95; grp.add(p); } });
  { const pad = new THREE.Mesh(new THREE.CircleGeometry(10, 32), new THREE.MeshStandardMaterial({color: 0x9b9384, roughness: 1})); pad.rotation.x = -Math.PI / 2; pad.position.set(EXP.x, y + 0.08, EXP.z); pad.name = 'fp-exhibit-pad'; grp.add(pad); }
  grp.userData.fx = fx; grp.userData.fz = fz; return grp; }
function clearTrees(cx, cz, r) { let n = 0; for (const im of (W3D.root ? W3D.root.children : [])) { if (!im.isInstancedMesh || im.count < 200) continue; const e = im.instanceMatrix.array; let ch = false;
    for (let i = 0; i < im.count; i++) { const o = i * 16; if (Math.hypot(e[o + 12] - cx, e[o + 14] - cz) > r || (e[o] === 0 && e[o + 5] === 0)) continue; e[o] = e[o + 1] = e[o + 2] = e[o + 4] = e[o + 5] = e[o + 6] = e[o + 8] = e[o + 9] = e[o + 10] = 0; ch = true; n++; }
    if (ch) im.instanceMatrix.needsUpdate = true; } return n; }
function ensureExhibit(cb) { if (ex) return cb && cb(); (DATA ? Promise.resolve() : load()).then(() => { if (!ex) { ex = buildExhibit(); clearTrees(EXP.x, EXP.z, 13); W3D.keepOut = (W3D.keepOut || []).concat([{x: EXP.x, z: EXP.z, r: 12, name: 'structure exhibit'}]); (W3D.root || document.querySelector('a-scene').object3D).add(ex); console.log('fpplan: exhibit at ' + EXP.x + ',' + EXP.z); } cb && cb(); }).catch(e => { console.error('fpplan', e); hud('Exhibit data did not load'); }); }
function face(yawDeg, step) { const y = tH(EXP.x, EXP.z) + 0.1; W3D.teleportTo(EXP.x, y, EXP.z, yawDeg); const lc = document.querySelector('[camera]') && document.querySelector('[camera]').components['look-controls']; if (lc) lc.pitchObject.rotation.x = 0.12; }
const SP = {structure: () => ensureExhibit(() => { face(EXP.yaw - 36); hud('Fowling Pond structure & budget - turn to see all five panels'); }),
  plan: () => ensureExhibit(() => { face(EXP.yaw + 53); hud('Master plan timeline + progress'); })};
SP['fp-structure'] = SP.structure; SP['master-plan'] = SP.plan; SP.timeline = SP.plan;
(function reg() { if (!W3D.spots) return setTimeout(reg, 300); Object.assign(W3D.spots, SP); })();
/* ---------- Show my design: ghosts over the real tiles ---------- */
function ghostMat(col, op) { return new THREE.MeshBasicMaterial({color: col, transparent: true, opacity: op, depthWrite: false, side: THREE.DoubleSide, fog: false}); }
function label(t, x, y, z) { const c = document.createElement('canvas'); c.width = 1024; c.height = 160; const g = c.getContext('2d'); g.fillStyle = 'rgba(8,24,32,0.85)'; g.fillRect(0, 0, 1024, 160); g.strokeStyle = '#7fe3ff'; g.lineWidth = 6; g.strokeRect(3, 3, 1018, 154);
  g.fillStyle = '#e8fbff'; g.font = 'bold 54px system-ui, sans-serif'; g.textAlign = 'center'; g.fillText(t, 512, 100); const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({map: tx, depthTest: false, fog: false, toneMapped: false})); s.scale.set(360, 56, 1); s.position.set(x, y, z); s.renderOrder = 10; return s; }
function buildGhosts() { const g = new THREE.Group(); g.name = 'fp-design-ghosts'; const W = (W3D.water && W3D.water.water) || 16.5;
  const sh = new THREE.Shape(DES.lake.xz.map(([x, z]) => new THREE.Vector2(x, -z))); const lg = new THREE.ShapeGeometry(sh); lg.rotateX(-Math.PI / 2);
  const lake = new THREE.Mesh(lg, ghostMat(0x6fe0ff, 0.38)); lake.position.y = W + 0.9; lake.renderOrder = 5; g.add(lake);
  const edge = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(DES.lake.xz.map(([x, z]) => new THREE.Vector3(x, W + 1.2, z))), new THREE.LineBasicMaterial({color: 0x9ff0ff, fog: false})); g.add(edge);
  // ring road: 12 m ribbon draped every ~20 m
  const R = DES.ring.xz, pos = []; for (let i = 0; i < R.length; i++) { const a = R[i], b = R[(i + 1) % R.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(L / 20)), nx = -(b[1] - a[1]) / L * 11, nz = (b[0] - a[0]) / L * 11;
    for (let k = 0; k < n; k++) { const t0 = k / n, t1 = (k + 1) / n, x0 = a[0] + (b[0] - a[0]) * t0, z0 = a[1] + (b[1] - a[1]) * t0, x1 = a[0] + (b[0] - a[0]) * t1, z1 = a[1] + (b[1] - a[1]) * t1, y0 = Math.max(tH(x0, z0), W) + 2.2, y1 = Math.max(tH(x1, z1), W) + 2.2;
      pos.push(x0 - nx, y0, z0 - nz, x0 + nx, y0, z0 + nz, x1 + nx, y1, z1 + nz, x0 - nx, y0, z0 - nz, x1 + nx, y1, z1 + nz, x1 - nx, y1, z1 - nz); } }
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); const ring = new THREE.Mesh(rg, ghostMat(0xff9a2e, 0.78)); ring.renderOrder = 6; g.add(ring);
  DES.beaches.forEach(b => { const m = new THREE.Mesh(new THREE.CircleGeometry(34, 20), ghostMat(0xffe7a3, 0.8)); m.rotation.x = -Math.PI / 2; m.position.set(b.x, Math.max(tH(b.x, b.z), W) + 1.6, b.z); g.add(m); });
  const L = DES.lighthouse, ly = tH(L.x, L.z); const lh = new THREE.Mesh(new THREE.CylinderGeometry(5, 7, 44, 16, 1, true), ghostMat(0xffffff, 0.22)); lh.position.set(L.x, ly + 22, L.z); g.add(lh);
  const lw = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(5, 7, 44, 16)), new THREE.LineBasicMaterial({color: 0x7fe3ff, fog: false})); lw.position.copy(lh.position); g.add(lw);
  const B = DES.bank, by = tH(B.x, B.z); [[0, 0, 190, 14, 160], [40, 0, 32, 30, 32]].forEach(([dx, dy, sx, sy, sz]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), ghostMat(0xffd76a, 0.2)); m.position.set(B.x + dx, by + sy / 2 + (dx ? 14 : 0), B.z); g.add(m);
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), new THREE.LineBasicMaterial({color: 0xffd76a, fog: false})); e.position.copy(m.position); g.add(e); });
  g.add(label('Restored lake (~' + DES.lake.acres + ' acres)', -600, W + 160, 0), label('Ring road (~' + DES.ring.miles + ' mi concept)', DES.ring.xz[0][0], W + 90, DES.ring.xz[0][1]),
    label('Lighthouse - phase 1', L.x, ly + 110, L.z), label('Bank compound (concept)', B.x, by + 130, B.z));
  return g; }
function setDesign(on) { const b = document.getElementById('designbtn'); if (b) b.textContent = on ? 'Hide my design' : 'Show my design';
  const t = document.querySelector('#designvr a-text'); if (t) t.setAttribute('value', on ? 'Hide my design' : 'Show my design');
  if (!on) { if (ghosts) ghosts.visible = false; return; }
  (DES ? Promise.resolve() : load()).then(() => { if (!ghosts) { ghosts = buildGhosts(); (W3D.root || document.querySelector('a-scene').object3D).add(ghosts); } ghosts.visible = true;
    hud('Design overlay on - fly up (Fly mode) for the whole lake; cyan = lake, orange = ring road, gold = bank, white = lighthouse'); }); }
W3D.design = {toggle: () => setDesign(!(ghosts && ghosts.visible)), set: setDesign, stats: () => ({ghosts: !!(ghosts && ghosts.visible), exhibit: ex ? EXP : null})};
/* ---------- Street View ---------- */
function here() { const sc = document.querySelector('a-scene'), c = sc.camera.getWorldPosition(new THREE.Vector3()), f = new THREE.Vector3(); sc.camera.getWorldDirection(f);
  const RE = W3D.realEarth; let g = RE && RE.geoOf && RE.A ? RE.geoOf(c.x + f.x * 15, c.z + f.z * 15) : null; if (!g || !isFinite(g.lat)) g = {lat: LAT0 - (c.z + f.z * 15) / KY, lon: LON0 + (c.x + f.x * 15) / KX};
  const hd = (Math.atan2(f.x, -f.z) * 180 / Math.PI + 360) % 360; return {lat: +g.lat.toFixed(6), lon: +g.lon.toFixed(6), heading: Math.round(hd)}; }
const svLink = p => 'https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=' + p.lat + ',' + p.lon + '&heading=' + p.heading;
let pendingSV = null;
function openSV(p) { let d = document.getElementById('jf-sv'); if (d) d.remove(); d = document.createElement('div'); d.id = 'jf-sv';
  d.style.cssText = 'position:fixed;z-index:40;right:10px;top:10px;width:min(560px,94vw);height:min(440px,62vh);background:#0d1f29;border:2px solid #c9a24a;border-radius:12px;font-family:system-ui,sans-serif;color:#eef4f6;display:flex;flex-direction:column;overflow:hidden';
  const bar = document.createElement('div'); bar.style.cssText = 'display:flex;gap:8px;align-items:center;padding:8px 10px;background:#13303d;font-size:15px';
  bar.innerHTML = '<b style="flex:1">Google Street View</b>'; const a = document.createElement('a'); a.href = svLink(p); a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'Open in Google Maps'; a.style.cssText = 'color:#111;background:#FFD700;padding:6px 10px;border-radius:8px;text-decoration:none';
  const x = document.createElement('button'); x.textContent = 'Close'; x.style.cssText = 'padding:6px 10px;border-radius:8px;border:0'; x.onclick = () => d.remove(); bar.append(a, x); d.appendChild(bar);
  if (SV_EMBED && window.JFVR_GK) { const f = document.createElement('iframe'); f.style.cssText = 'flex:1;border:0'; f.loading = 'lazy'; f.allowFullscreen = true; f.referrerPolicy = 'no-referrer-when-downgrade';
    f.src = 'https://www.google.com/maps/embed/v1/streetview?key=' + window.JFVR_GK + '&location=' + p.lat + ',' + p.lon + '&heading=' + p.heading + '&fov=90'; d.appendChild(f); }
  else { const m = document.createElement('div'); m.style.cssText = 'flex:1;padding:16px;font-size:16px;line-height:1.45';
    m.innerHTML = 'Street View for the spot you are looking at (' + p.lat + ', ' + p.lon + ', heading ' + p.heading + '&deg;).<br><br>Tap <b>Open in Google Maps</b> to walk the real street, or use the <a style="color:#7fe3ff" href="/vr/plan/overlay/?lat=' + p.lat + '&lon=' + p.lon + '" target="_blank">design overlay page</a> to compare it with the plan.<br><br><span style="opacity:.7;font-size:14px">Street View opens in the browser - it cannot run inside the VR headset.</span>'; d.appendChild(m); }
  document.body.appendChild(d); }
function sv() { const sc = document.querySelector('a-scene'), p = here(); if (sc && sc.is('vr-mode')) { pendingSV = p; hud('Street View opens when you exit VR (it cannot run inside the headset)'); return; } openSV(p); }
document.addEventListener('DOMContentLoaded', () => {}); (function hook() { const sc = document.querySelector('a-scene'); if (!sc) return setTimeout(hook, 400); sc.addEventListener('exit-vr', () => { if (pendingSV) { const p = pendingSV; pendingSV = null; setTimeout(() => openSV(p), 600); } }); })();
W3D.streetView = {open: sv, here, link: () => svLink(here())};
/* ---------- menu buttons (menutabs.js files them under Go to > Exhibits / Earth places / Read) ---------- */
function menus() { const ui = document.getElementById('jf-inbox') || document.querySelector('#ui .tools'), bar = document.getElementById('vrbar');
  const b2 = (id, label, fn, w) => { if (!ui || document.getElementById(id)) return; const b = document.createElement('button'); b.id = id; if (w) b.dataset.w = w; b.textContent = label; b.addEventListener('click', e => { e.stopPropagation(); fn(); }); ui.appendChild(b); };
  const a2 = (id, label, href) => { if (!ui || document.getElementById(id)) return; const a = document.createElement('a'); a.id = id; a.href = href; a.target = '_blank'; a.rel = 'noopener'; a.textContent = label; ui.appendChild(a); };
  const bv = (id, label, fn) => { if (!bar || document.getElementById(id)) return; const p = document.createElement('a-plane'); p.id = id; p.className = 'btn'; p.setAttribute('width', 1.3); p.setAttribute('height', 0.26); p.setAttribute('material', 'shader:flat;color:#FFD700');
    const t = document.createElement('a-text'); t.setAttribute('value', label); t.setAttribute('align', 'center'); t.setAttribute('color', '#111'); t.setAttribute('width', 2.0); t.setAttribute('position', '0 0 0.005'); p.appendChild(t); p.addEventListener('click', fn); bar.appendChild(p); };
  const go = w => () => { if (window.goWorld) window.goWorld(w); };
  b2('structurebtn', 'Structure & budget exhibit', go('structure'), 'structure'); b2('planbtn', 'Lake plan, timeline & progress', go('plan'), 'plan'); b2('designbtn', 'Show my design', () => W3D.design.toggle()); b2('svbtn', 'Street View here', sv);
  a2('structlink', 'Fowling Pond structure & budget', '/vr/structure/'); a2('planlink', 'Master plan & live progress', '/vr/plan/'); a2('overlaylink', 'Design overlay (satellite + Street View)', '/vr/plan/overlay/');
  bv('structurevr', 'Structure exhibit', go('structure')); bv('planvr', 'Plan & timeline', go('plan')); bv('designvr', 'Show my design', () => W3D.design.toggle()); bv('svvr', 'Street View here', sv);
  bv('structreadvr', 'Structure & budget', go('structure')); bv('planreadvr', 'Master plan', go('plan')); }
const iv = setInterval(() => { if (document.getElementById('jf-inbox') && document.getElementById('vrbar')) { menus(); clearInterval(iv); } }, 700); setTimeout(() => clearInterval(iv), 120000);
/* floating Street View button on Real Earth (desktop / phone) */
setInterval(() => { const RE = W3D.realEarth, sc = document.querySelector('a-scene'); let b = document.getElementById('jf-svfloat'); const show = !!(RE && RE.on && W3D.active && sc && !sc.is('vr-mode'));
  if (!b && show) { b = document.createElement('button'); b.id = 'jf-svfloat'; b.textContent = 'Street View'; b.title = 'Google Street View of the spot you are looking at';
    b.style.cssText = 'position:fixed;z-index:21;left:10px;bottom:64px;padding:9px 13px;border-radius:10px;border:1px solid #c9a24a;background:rgba(20,30,36,.85);color:#ffe9a8;font:600 14px system-ui,sans-serif';
    b.onclick = sv; document.body.appendChild(b); }
  if (b) b.style.display = show ? '' : 'none'; }, 1500);
})();
