/* Department of the Star Fleet base (T-27, Nov 26 2026; Josh via Me): a small walk-in hall beside the Bridgewater launch pad, next to
   the Earth / Mars rockets and the flying saucers (the department's design models). Fowling Pond style - stone plinth and walls, marble
   floor, gold cornice, papyrus-free plain columns - open on the east side toward the pad. Inside: the mission, the 2005 Newport founding
   and its revival as a Tesseract department, and the four Raynham Ground Station phases, worded from the Tesseract Program Star Fleet page
   (tesseract-static/star_fleet.py). The gold "Read the Star Fleet page" panel opens that page in the in-world reader (2D: pop-up).
   No Star Trek imagery or insignia; "Star Fleet" is always two words. Lean: ~14 meshes, canvas text, built only within 700 m. */
(function () {
  'use strict';
  const PAD = {x: 9617.0, z: -2976.9};
  const X0 = PAD.x - 51, X1 = PAD.x - 41, ZC = PAD.z + 2, HW = 7, WH = 4.6, T = 0.4;   // back wall west, open front east (toward the pad)
  const LOAD = 700, DROP = 950;
  let grp = null, gy = null, walls = [], floor = null;
  const SF = window.JFVR_starfleet = {};
  function wrap(g, text, maxW) { const words = text.split(' '), lines = []; let cur = '';
    for (const w of words) { const t = cur ? cur + ' ' + w : w; if (g.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; } if (cur) lines.push(cur); return lines; }
  /* panel: blocks = [{t, s:'title'|'sub'|'body'|'quote'|'small'}] drawn on a canvas, dark navy with a gold frame like the Tesseract sign */
  function panel(w, h, blocks, opts) { opts = opts || {}; const PX = 1024, c = document.createElement('canvas'); c.width = PX; c.height = Math.round(PX * h / w); const g = c.getContext('2d');
    g.fillStyle = opts.bg || '#0b1d26'; g.fillRect(0, 0, c.width, c.height); g.strokeStyle = opts.frame || '#d4af37'; g.lineWidth = 14; g.strokeRect(7, 7, c.width - 14, c.height - 14);
    const F = {title: ['bold', 62, '#FFD700'], sub: ['bold', 40, '#9ffcff'], body: ['', 34, '#f2ead8'], quote: ['italic', 34, '#ffe9a8'], small: ['', 27, '#c9c2b0'], big: ['bold', 72, '#111']};
    let y = 56; const M = 52;
    for (const b of blocks) { const f = F[b.s || 'body']; g.font = f[0] + ' ' + f[1] + 'px Georgia, "Times New Roman", serif'; if (b.s === 'body' || b.s === 'small' || !b.s) g.font = f[0] + ' ' + f[1] + 'px Arial, sans-serif';
      if (b.fit) { let fs = f[1]; while (g.measureText(b.t).width > c.width - 2 * M && fs > 12) { fs -= 2; g.font = f[0] + ' ' + fs + 'px Georgia, "Times New Roman", serif'; } y = (c.height - fs) / 2; }   // one line, centred
      g.fillStyle = b.c || f[2]; g.textBaseline = 'top'; g.textAlign = opts.center ? 'center' : 'left';
      for (const ln of wrap(g, b.t, c.width - 2 * M)) { g.fillText(ln, opts.center ? c.width / 2 : M, y); y += f[1] * 1.28; } y += b.gap != null ? b.gap : f[1] * 0.45; }
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({map: tex, toneMapped: false, fog: true})); }
  function box(w, h, d, x, y, z, m) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = true; b.receiveShadow = true; grp.add(b); return b; }
  const MISSION = [{t: 'Department of the Star Fleet', s: 'title'}, {t: 'The mission', s: 'sub'},
    {t: 'The Department of the Star Fleet works on better ways for people to travel, on Earth and to Mars.'},
    {t: 'The Earth and Mars rockets and flying saucers in the Fowling Pond 3D world are the department\u2019s design models: ideas for how craft could look and work, shown in a place you can walk around.'},
    {t: 'Red Planet Lounge is a Mars colony world. It is a design model for what living and arriving on Mars could look like.'},
    {t: 'These are 3D design models, not working vehicles.', s: 'small'}];
  const HISTORY = [{t: 'Founded in Newport, 2005', s: 'title'}, {t: 'History', s: 'sub'},
    {t: 'Josh Freeman founded Department of the Star Fleet Inc. in Newport, Rhode Island on June 16, 2005. Its stated purpose was:'},
    {t: '\u201cMagnetic drive train units for molecular nanotechnology development of more advanced forms of transportation for humans on Earth.\u201d', s: 'quote'},
    {t: 'The state of Rhode Island revoked the corporation in 2006. The idea is now revived as a department of the Tesseract Program.'}];
  const PH12 = [{t: 'Raynham Ground Station', s: 'title'}, {t: 'The plan, in phases (1 and 2)', s: 'sub'},
    {t: 'Phase 1 - Satellite and weather receiving station', s: 'sub', c: '#FFD700', gap: 6}, {t: 'A small antenna and software radio to pick up NOAA weather-satellite images, and a station on the open SatNOGS ground-station network. No permits needed.'}, {t: 'Estimate: about $150 - $600', s: 'small'},
    {t: 'Phase 2 - Sky-watch camera', s: 'sub', c: '#FFD700', gap: 6}, {t: 'An all-sky camera that records the night sky and feeds the Night Division\u2019s records.'}, {t: 'Estimate: about $300 - $800', s: 'small'}];
  const PH34 = [{t: 'Raynham Ground Station', s: 'title'}, {t: 'The plan, in phases (3 and 4)', s: 'sub'},
    {t: 'Phase 3 - Model rocketry', s: 'sub', c: '#FFD700', gap: 6}, {t: 'Build and fly small model rockets under National Association of Rocketry (NAR) safety rules and the Massachusetts fire code, starting at club launches.'}, {t: 'Estimate: NAR membership about $50 - $70 a year, plus kits and motors', s: 'small'},
    {t: 'Phase 4 - Launch field', s: 'sub', c: '#FFD700', gap: 6}, {t: 'A local launch field, only after approval from the fire chief and the town. Public land, including at Fowling Pond, needs town approval.'}, {t: 'Estimate: depends on the site', s: 'small'},
    {t: 'All costs are rough estimates and have not been quoted.', s: 'small'}];
  function openPage() { if (window.JFVR_tessReader) window.JFVR_tessReader.open('starfleet'); else { const w = window.open('https://tesseractprogram.pages.dev/star-fleet/', '_blank', 'noopener'); if (!w) location.assign('https://tesseractprogram.pages.dev/star-fleet/'); } }
  SF.open = openPage;
  function ground() { const GA = W3D.groundAt; if (!GA) return null; let m = -1e9; const F = W3D.floors, fi = F && floor ? F.indexOf(floor) : -1; if (fi >= 0) F.splice(fi, 1);   // our own floor must not lift the ground reading
    for (const x of [X0, (X0 + X1) / 2, X1]) for (const z of [ZC - HW, ZC, ZC + HW]) { const h = GA(x, z, 80); if (isFinite(h)) m = Math.max(m, h); } if (fi >= 0) F.push(floor); return m > -1e8 ? m : null; }
  function colliders(y) { const W = W3D.walls, F = W3D.floors; if (!W || !F) return; walls.forEach(w => { const i = W.indexOf(w); if (i >= 0) W.splice(i, 1); }); if (floor) { const i = F.indexOf(floor); if (i >= 0) F.splice(i, 1); }
    const fy = y + 0.35; walls = [{x0: X0 - 0.3, x1: X0 + T, z0: ZC - HW, z1: ZC + HW, y0: fy, y1: fy + WH}, {x0: X0, x1: X1, z0: ZC - HW - 0.2, z1: ZC - HW + T, y0: fy, y1: fy + WH}, {x0: X0, x1: X1, z0: ZC + HW - T, z1: ZC + HW + 0.2, y0: fy, y1: fy + WH}];
    walls.forEach(w => W.push(w)); floor = {x0: X0, x1: X1 + 1.2, z0: ZC - HW, z1: ZC + HW, y: fy}; F.push(floor); }
  function build(y) {
    const M = W3D.M || {}, stone = M.stone || new THREE.MeshStandardMaterial({color: 0xd8c39a}), marble = M.marble || stone, gold = M.gold || new THREE.MeshStandardMaterial({color: 0xd4af37, metalness: 0.8, roughness: 0.3});
    grp = new THREE.Group(); grp.name = 'starfleet-base'; grp.position.set(0, y, 0); W3D.root.add(grp);
    const cx = (X0 + X1) / 2, D = X1 - X0, fy = 0.35;
    box(D + 1.2, 2.2, 2 * HW + 0.6, cx + 0.3, fy - 1.1 - 0.05, ZC, stone);            // plinth (goes 1.9 m into the ground so slopes never show a gap)
    box(D, 0.06, 2 * HW - 0.4, cx, fy - 0.02, ZC, marble);                           // marble floor
    box(1.2, 0.18, 6, X1 + 0.9, 0.09, ZC, stone);                                     // front step
    box(T, WH, 2 * HW, X0 + T / 2, fy + WH / 2, ZC, stone);                           // back wall (west)
    for (const s of [-1, 1]) box(D, WH, T, cx, fy + WH / 2, ZC + s * (HW - T / 2), stone);   // side walls
    box(D + 1.0, 0.45, 2 * HW + 1.0, cx + 0.2, fy + WH + 0.22, ZC, stone);            // roof slab
    box(0.25, 0.3, 2 * HW + 1.0, X1 + 0.72, fy + WH + 0.15, ZC, gold);                // gold cornice along the front
    for (const s of [-1, 1]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, WH, 20), stone); c.position.set(X1 - 0.5, fy + WH / 2, ZC + s * 3.6); c.castShadow = true; grp.add(c); }
    // signs and panels
    const sign = panel(8.4, 1.15, [{t: 'DEPARTMENT OF THE STAR FLEET', s: 'title', fit: true}], {center: true}); sign.position.set(X1 + 0.86, fy + WH + 1.05, ZC); sign.rotation.y = Math.PI / 2; grp.add(sign);
    const signB = box(0.12, 1.3, 8.6, X1 + 0.78, fy + WH + 1.05, ZC, gold); signB.castShadow = false;
    const pm = panel(3.7, 3.0, MISSION); pm.position.set(X0 + T + 0.02, fy + 2.2, ZC - 4.3); pm.rotation.y = Math.PI / 2; grp.add(pm);
    const ph = panel(3.7, 3.0, HISTORY); ph.position.set(X0 + T + 0.02, fy + 2.2, ZC); ph.rotation.y = Math.PI / 2; grp.add(ph);
    const p12 = panel(5.6, 3.3, PH12); p12.position.set(cx + 0.4, fy + 2.3, ZC - HW + T + 0.02); grp.add(p12);
    const p34 = panel(5.6, 3.3, PH34); p34.position.set(cx + 0.4, fy + 2.3, ZC + HW - T - 0.02); p34.rotation.y = Math.PI; grp.add(p34);
    // the button: an A-Frame plane (laser / mouse / tap via the .btn raycaster), gold, opens the page in the reader
    const pb = panel(3.7, 1.7, [{t: 'Read the Star Fleet page', s: 'big', c: '#111'}, {t: 'tesseractprogram.pages.dev/star-fleet  - click / tap / trigger', s: 'small', c: '#2a2410'}], {bg: '#FFD700', frame: '#7a5c12', center: true});
    const e = document.createElement('a-entity'); e.id = 'starfleet-btn'; e.setAttribute('position', (X0 + T + 0.03) + ' ' + (y + fy + 2.0) + ' ' + (ZC + 4.3)); e.setAttribute('rotation', '0 90 0');
    const hit = document.createElement('a-plane'); hit.setAttribute('class', 'btn'); hit.setAttribute('width', 3.7); hit.setAttribute('height', 1.7); hit.setAttribute('material', 'shader:flat;transparent:true;opacity:0');
    hit.addEventListener('click', openPage); e.appendChild(hit); e.addEventListener('loaded', () => { e.object3D.add(pb); });
    (document.querySelector('a-scene')).appendChild(e); SF.btn = e;
    const hint = panel(3.7, 0.5, [{t: 'Opens in the Tesseract reader - you stay in Fowling Pond', s: 'small'}], {center: true}); hint.position.set(X0 + T + 0.02, fy + 0.85, ZC + 4.3); hint.rotation.y = Math.PI / 2; grp.add(hint);
    colliders(y); setTimeout(() => document.querySelectorAll('[raycaster]').forEach(r => r.components.raycaster && r.components.raycaster.refreshObjects()), 300);
  }
  function setVis(v) { if (grp) grp.visible = v; if (SF.btn) { SF.btn.object3D.visible = v; const h = SF.btn.querySelector('a-plane'); if (h) { if (v) h.classList.add('btn'); else h.classList.remove('btn'); } } }
  const _c = new THREE.Vector3();
  setInterval(() => {
    if (!window.W3D_READY || !W3D.root || !W3D.active) { if (grp && grp.visible) setVis(false); return; }
    const cam = document.querySelector('a-scene').camera; if (!cam) return; cam.getWorldPosition(_c); const d = Math.hypot(_c.x - (X0 + X1) / 2, _c.z - ZC);
    if (d < LOAD) { const y = ground(); if (y == null) return; if (!grp) { gy = y; build(y); } else if (Math.abs(y - gy) > 0.15) { gy = y; grp.position.y = y; if (SF.btn) SF.btn.object3D.position.y = y + 2.35; colliders(y); }   // re-level once the Bridgewater ground patch has loaded
      if (!grp.visible) setVis(true); }
    else if (d > DROP && grp && grp.visible) setVis(false);
  }, 700);
  /* ?spot=starfleet and the Go to menu: stand on the front step looking in (west) */
  function go() { if (W3D.spots.launchpad) W3D.spots.launchpad(); const t = () => W3D.teleportTo(X1 + 7, undefined, ZC, 90); t(); setTimeout(t, 1500); setTimeout(() => { t(); if (window.JFVR && JFVR.hud) JFVR.hud('Department of the Star Fleet'); }, 4000); }
  (function reg() { if (!window.W3D || !W3D.spots) return setTimeout(reg, 300); W3D.spots.starfleet = go; })();
})();
