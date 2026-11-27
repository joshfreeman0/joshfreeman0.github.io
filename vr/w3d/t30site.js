/* T-30 exhibit site on the open ground north of the launch pad (Bridgewater patch), Nov 27 2026.
   Mounts the shared FPX modules (w3d/exhibits/*.js) - the same modules can be mounted on Mars or anywhere else with FPX.mount.
   Row 1 (z ~ -3060): planet, hangar, phreaklab, foresight.  Row 2 (z ~ -3112): boring, starmind, terafab, tesla, solarcity.
   All face +z (toward the pad, 65+ m away). Builds lazily within 700 m, hides beyond 950 m. */
(function () {
  'use strict';
  const SITES = [
    {n: 'planet', x: 9548, z: -3056}, {n: 'hangar', x: 9585, z: -3060}, {n: 'phreaklab', x: 9620, z: -3058}, {n: 'foresight', x: 9655, z: -3062},
    {n: 'boring', x: 9545, z: -3108, floor: {x0: -6, x1: 6, z0: -7, z1: 7}}, {n: 'starmind', x: 9585, z: -3112}, {n: 'terafab', x: 9615, z: -3112},
    {n: 'tesla', x: 9650, z: -3112}, {n: 'solarcity', x: 9685, z: -3112, walls: [{x0: -6.5, x1: 0.5, z0: -4, z1: 1}]}];
  const CX = 9615, CZ = -3085, LOAD = 700, DROP = 950, LITE = !!(window.JFVR_LITE || /[?&]lite=1/.test(location.search));
  let built = false, vis = false; const H = {};
  const ga = () => W3D.groundAt;
  function level(s, inst) { const GA = ga(); if (!GA) return null; const f = inst ? inst.footprint : {x0: -5, x1: 5, z0: -5, z1: 5}; let m = -1e9;
    const own = s.floorRec, F = W3D.floors, fi = F && own ? F.indexOf(own) : -1; if (fi >= 0) F.splice(fi, 1);
    for (const x of [f.x0, 0, f.x1]) for (const z of [f.z0, 0, f.z1]) { const h = GA(s.x + x, s.z + z, 80); if (isFinite(h)) m = Math.max(m, h); }
    if (fi >= 0) F.push(own); return m > -1e8 ? m : null; }
  function colliders(s, inst, y) { const W = W3D.walls, F = W3D.floors; if (!W || !F) return; (s.wallRecs || []).forEach(w => { const i = W.indexOf(w); if (i >= 0) W.splice(i, 1); }); if (s.floorRec) { const i = F.indexOf(s.floorRec); if (i >= 0) F.splice(i, 1); }
    const fy = y + (inst.floorY || 0.2), f = s.floor || inst.footprint;
    s.wallRecs = (inst.walls || []).concat(s.walls || []).map(w => ({x0: s.x + w.x0, x1: s.x + w.x1, z0: s.z + w.z0, z1: s.z + w.z1, y0: fy, y1: fy + 4.5}));
    s.wallRecs.forEach(w => W.push(w)); s.floorRec = {x0: s.x + f.x0, x1: s.x + f.x1, z0: s.z + f.z0, z1: s.z + f.z1, y: fy}; F.push(s.floorRec); steps(s, inst, fy, f); }
  // front steps when the pad stands proud of sloping ground (the walker only climbs 0.65 m at a time)
  function steps(s, inst, fy, f) { (s.stepRecs || []).forEach(r => { const i = W3D.floors.indexOf(r); if (i >= 0) W3D.floors.splice(i, 1); }); s.stepRecs = [];
    if (s.stepMesh) { inst.group.remove(s.stepMesh); s.stepMesh.geometry.dispose(); s.stepMesh = null; }
    const GA = ga(); if (!GA) return; const g = GA(s.x, s.z + f.z1 + 1.5, fy - 0.3); if (!isFinite(g)) return; const d = fy - g; if (d < 0.5) return;
    const n = Math.min(8, Math.ceil(d / 0.4)), P = FPX.parts(), gy = inst.group.position.y;
    for (let i = 1; i <= n; i++) { const top = fy - d * i / (n + 1), z0 = f.z1 + (i - 1) * 0.6, r = {x0: s.x - 2.5, x1: s.x + 2.5, z0: s.z + z0, z1: s.z + z0 + 0.6, y: top}; s.stepRecs.push(r); W3D.floors.push(r);
      P.box(5, top - g + 0.3, 0.6, 0, (top + g - 0.3) / 2 - gy, z0 + 0.3, 0x9a968c); }
    s.stepMesh = P.mesh({rough: 0.9}); inst.group.add(s.stepMesh); }
  function build() { if (!window.FPX || !FPX.mount) return; const sc = document.querySelector('a-scene');
    for (const s of SITES) { if (H[s.n] || !FPX[s.n]) continue; const y = level(s); if (y == null) return;
      const h = H[s.n] = FPX.mount(s.n, sc, W3D.root, {position: {x: s.x, y, z: s.z}, rotationY: 0, lite: LITE, groundAt: (x, z) => { const g = ga() ? ga()(x, z, 400) : y; return isFinite(g) ? g : y; }});
      s.y = y; const y2 = level(s, h.inst); if (y2 != null && Math.abs(y2 - y) > 0.05) { s.y = y2; h.group.position.y = y2; } colliders(s, h.inst, s.y); }
    built = true; vis = true; }
  function setVis(v) { vis = v; for (const s of SITES) { const h = H[s.n]; if (h) FPX.setVisible(h, v); } }
  const _c = new THREE.Vector3(); let relevel = 0;
  setInterval(() => {
    if (!window.W3D_READY || !W3D.root || !W3D.active) { if (vis) setVis(false); return; }
    const cam = document.querySelector('a-scene').camera; if (!cam) return; cam.getWorldPosition(_c); const d = Math.hypot(_c.x - CX, _c.z - CZ);
    if (d < LOAD) { if (!built) build(); else if (!vis) setVis(true);
      if (built && ++relevel % 4 === 0) for (const s of SITES) { const h = H[s.n]; if (!h) continue; const y = level(s, h.inst); if (y != null && Math.abs(y - s.y) > 0.15) { s.y = y; h.group.position.y = y; colliders(s, h.inst, y); } } }   // re-level once the ground patch has loaded
    else if (d > DROP && vis) setVis(false);
  }, 700);
  const LABEL = {planet: 'Planet - Dove CubeSats', hangar: 'Drone Hangar', phreaklab: 'Cap\u2019n Crunch Phreaking Lab', foresight: 'Foresight Institute court', boring: 'The Boring Company - Loop', starmind: 'SpaceX Starmind', terafab: 'Terafab', tesla: 'Tesla', solarcity: 'SolarCity'};
  function go(n) { return () => { const s = SITES.find(q => q.n === n); if (W3D.spots.launchpad) W3D.spots.launchpad(); const sp = (H[n] && H[n].inst.spawn) || {x: 0, z: 8, yawDeg: 0};
    const t = () => W3D.teleportTo(s.x + sp.x, undefined, s.z + sp.z, sp.yawDeg || 0); t(); setTimeout(t, 1500); setTimeout(() => { const sp2 = H[n] && H[n].inst.spawn; if (sp2) { sp.x = sp2.x; sp.z = sp2.z; } t(); if (window.JFVR && JFVR.hud) JFVR.hud(LABEL[n]); }, 4000); }; }
  (function reg() { if (!window.W3D || !W3D.spots) return setTimeout(reg, 300); for (const s of SITES) W3D.spots[s.n] = go(s.n); W3D.spots.campus = go('tesla'); W3D.spots.t30 = go('hangar'); })();
  window.T30SITE = {SITES, H};
})();
