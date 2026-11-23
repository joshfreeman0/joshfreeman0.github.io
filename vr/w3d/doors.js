/* Working doors (Josh, 3:25 AM): one small registry for the swinging doors that were static. Each door opens when you come near and
   closes when you leave; a click (desktop mouse, phone tap, or the trigger on either Quest laser - every hit box has class .btn) toggles
   it and overrides proximity for 20 s. Collision follows the leaves: the closed-door wall is solid only while the leaves are (nearly)
   shut, and an optional open-position wall only while they stand open. Driven from the A-Frame tick (works inside immersive WebXR).
   No door navigates, opens a tab or touches the XR session.
   W3D.addDoor({name, leaves: [{piv, closed, open}], at: {x, y, z}, near: m, hit: {x, y, z, w, h, d}, shut: wall, opened: wall, start: 0|1}) */
(function () {
  const doors = []; W3D.doors = doors;
  const sm = x => x * x * (3 - 2 * x);
  W3D.addDoor = function (o) {
    const d = Object.assign({a: o.start || 0, manual: null, manualT: 0, openNow: !!o.start, near: o.near || 8}, o);
    for (const w of [d.shut, d.opened]) if (w) { w.Y1 = w.y1; if (W3D.lib && W3D.lib.walls && W3D.lib.walls.indexOf(w) < 0) W3D.lib.walls.push(w); }
    if (o.hit) { const h = o.hit, e = document.createElement('a-box'); e.setAttribute('class', 'btn'); e.setAttribute('position', `${h.x} ${h.y} ${h.z}`);
      e.setAttribute('width', h.w); e.setAttribute('height', h.h); e.setAttribute('depth', h.d); if (h.ry) e.setAttribute('rotation', `0 ${h.ry} 0`);
      e.setAttribute('material', 'shader: flat; opacity: 0; transparent: true; depthWrite: false');
      e.addEventListener('click', () => { d.manual = !d.openNow; d.manualT = performance.now(); });
      document.querySelector('a-scene').appendChild(e); d.hitEl = e; }
    apply(d); doors.push(d); return d; };
  function apply(d) { const k = sm(Math.min(1, Math.max(0, d.a)));
    for (const l of d.leaves) l.piv.rotation.y = l.closed + (l.open - l.closed) * k;
    if (d.shut) d.shut.y1 = d.a < 0.15 ? d.shut.Y1 : -1e6;          // shut leaves block; swung open = passable
    if (d.opened) d.opened.y1 = d.a > 0.85 ? d.opened.Y1 : -1e6; }   // the open leaf's own footprint only while it stands open
  const cp = new THREE.Vector3();
  AFRAME.registerSystem('w3d-doors', { tick: function (t, dt) {
    if (!doors.length || !W3D.active) return; const cam = this.el.camera; if (!cam) return; cp.setFromMatrixPosition(cam.matrixWorld);
    const now = performance.now(), step = Math.min(0.1, (dt || 16) / 1000) * 0.7;   // ~1.4 s full swing
    for (const d of doors) { let open = Math.hypot(cp.x - d.at.x, cp.z - d.at.z) < d.near && Math.abs(cp.y - d.at.y) < (d.dy || 8);
      if (d.manualT && now - d.manualT < 20000) open = d.manual; d.openNow = open;
      const tg = open ? 1 : 0; if (d.a !== tg) { d.a += Math.max(-step, Math.min(step, tg - d.a)); apply(d); } }
  } });
})();
