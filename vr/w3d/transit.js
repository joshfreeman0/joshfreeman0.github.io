/* Rocket transit, Earth halves (Josh, 3:26 AM). Red Planet Lounge plays the Mars halves; the page change happens in deep space with
   only stars showing.
   ARRIVAL (?from=redplanetlounge, ~15 s): you open in a star field standing in the rocket's cabin, pass close by the Moon, Earth grows
   ahead, atmosphere entry (glow), then the cabin descends over Raynham / Bridgewater onto the launch pad. It starts as soon as the scene
   can render (right after the sessiongranted auto-enter) and plays while the world loads; if the world is not ready by the descent it
   holds in cloud until it is. Skip: B / Escape / the Skip button. ?notransit=1 turns it off.
   Light for Quest: procedural canvas textures (Earth 512x256, Moon 256x128), ~1500 star points, a few low-poly meshes.
   Everything steps on the A-Frame tick (the XR frame loop), never window.requestAnimationFrame. */
(function () {
  const QS = new URLSearchParams(location.search), FROM = /^redplanet/i.test(QS.get('from') || '') && QS.get('notransit') !== '1';
  const PAD = {x: 9617.0, z: -2976.9}, LAND = {x: PAD.x - 12, z: PAD.z + 12};
  const LITE = !!window.JFVR_LITE;
  const sm = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
  const ctex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
  const rnd = seed => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
  function earthTex() { return ctex(512, 256, (c, w, h) => { const r = rnd(7); c.fillStyle = '#1c4c8a'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 80; i++) { const x = r() * w, y = h * (0.15 + r() * 0.7), rr = 10 + r() * 34; c.fillStyle = r() < 0.55 ? '#4c7a39' : '#8b7a4b'; c.beginPath(); c.ellipse(x, y, rr * 1.6, rr, r() * 3, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = '#eef3f6'; c.fillRect(0, 0, w, 14); c.fillRect(0, h - 14, w, 14);
    c.fillStyle = 'rgba(255,255,255,0.55)'; for (let i = 0; i < 110; i++) { c.beginPath(); c.ellipse(r() * w, r() * h, 8 + r() * 30, 3 + r() * 6, 0, 0, Math.PI * 2); c.fill(); } }); }
  function moonTex() { return ctex(256, 128, (c, w, h) => { const r = rnd(3); c.fillStyle = '#9c9a94'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 14; i++) { c.fillStyle = 'rgba(70,70,74,0.45)'; c.beginPath(); c.ellipse(r() * w, h * (0.2 + r() * 0.6), 8 + r() * 26, 6 + r() * 14, r() * 3, 0, Math.PI * 2); c.fill(); }   // maria
    for (let i = 0; i < 140; i++) { const x = r() * w, y = r() * h, rr = 1 + r() * 5; c.strokeStyle = 'rgba(40,40,40,0.35)'; c.lineWidth = 1; c.beginPath(); c.arc(x, y, rr, 0, Math.PI * 2); c.stroke();
      c.fillStyle = 'rgba(230,230,225,0.25)'; c.beginPath(); c.arc(x - rr * 0.3, y - rr * 0.3, rr * 0.6, 0, Math.PI * 2); c.fill(); } }); }
  function labelMesh() { const c = document.createElement('canvas'); c.width = 1024; c.height = 160; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.25), new THREE.MeshBasicMaterial({map: t, transparent: true, depthTest: false, depthWrite: false, toneMapped: false, fog: false})); m.renderOrder = 1e4;
    m.userData.set = s => { if (m.userData.s === s) return; m.userData.s = s; const g = c.getContext('2d'); g.clearRect(0, 0, 1024, 160); if (s) { g.fillStyle = 'rgba(10,12,18,0.7)'; g.fillRect(0, 0, 1024, 160);
      g.fillStyle = '#ffd27a'; g.font = 'bold 72px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, 512, 84); } t.needsUpdate = true; m.visible = !!s; }; return m; }
  function starField(n) { const g = new THREE.BufferGeometry(), v = []; const r = rnd(5);
    for (let i = 0; i < n; i++) { const u = r() * 2 - 1, a = r() * Math.PI * 2, q = Math.sqrt(1 - u * u); v.push(q * Math.cos(a) * 5000, u * 5000, q * Math.sin(a) * 5000); }
    g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    const p = new THREE.Points(g, new THREE.PointsMaterial({color: 0xffffff, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 1, fog: false, depthWrite: false})); p.renderOrder = -8; p.frustumCulled = false; return p; }
  // a simple rocket cabin around the rider: deck, low wall, four window posts, roof ring, console ahead
  function cabin() { const G = new THREE.Group(), steel = new THREE.MeshStandardMaterial({color: 0x9aa0a8, metalness: 0.5, roughness: 0.45}), dark = new THREE.MeshStandardMaterial({color: 0x30343a, roughness: 0.6});
    const deck = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.08, 24), dark); deck.position.y = -0.04; G.add(deck);
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.55, 0.95, 24, 1, true), steel); wall.material = steel.clone(); wall.material.side = THREE.DoubleSide; wall.position.y = 0.47; G.add(wall);
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.55, 0.18, 24, 1, true), wall.material); roof.position.y = 2.55; G.add(roof);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(1.6, 0.9, 24), steel); cap.position.y = 3.08; G.add(cap);
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + Math.PI / 6, p = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.7, 0.1), steel); p.position.set(Math.sin(a) * 1.52, 1.75, Math.cos(a) * 1.52); G.add(p); }
    const con = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 0.35), dark); con.position.set(0, 0.98, -1.25); con.rotation.x = 0.4; G.add(con);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.18), new THREE.MeshBasicMaterial({color: 0x56d8ff, toneMapped: false})); glow.position.set(0, 1.05, -1.18); glow.rotation.x = -1.17; G.add(glow);
    G.add(new THREE.PointLight(0xcfe6ff, 0.6, 5)); return G; }
  W3D.transitTex = {earth: earthTex, moon: moonTex, starField};
  W3D.arrivalCover = FROM;   // index.html xrCover() leaves the screen to the arrival flight
  if (!FROM) return;

  const T = {moon0: 0.6, moon1: 6.5, earth0: 2.5, entry: 9.5, descent: 12, land: 15.5};
  let A = null;
  function start() {
    const sc = document.querySelector('a-scene'), rig = document.querySelector('#rig');
    if (!sc || !sc.camera || !sc.renderer || !rig || !rig.object3D) return setTimeout(start, 50);
    const s3 = sc.object3D, G = new THREE.Group(); G.name = 'arrival'; s3.add(G);
    const stars = starField(LITE ? 900 : 1600); G.add(stars);
    const earth = new THREE.Mesh(new THREE.SphereGeometry(6000, 48, 24), new THREE.MeshLambertMaterial({map: earthTex(), fog: false})); earth.frustumCulled = false; G.add(earth);
    const halo = new THREE.Mesh(new THREE.SphereGeometry(6250, 48, 24), new THREE.MeshBasicMaterial({color: 0x6fb0ff, transparent: true, opacity: 0.22, side: THREE.BackSide, fog: false, depthWrite: false, blending: THREE.AdditiveBlending})); earth.add(halo);
    const moon = new THREE.Mesh(new THREE.SphereGeometry(1700, 32, 16), new THREE.MeshLambertMaterial({map: moonTex(), fog: false})); moon.frustumCulled = false; G.add(moon);
    const sun = new THREE.DirectionalLight(0xffffff, 1.7); G.add(sun); G.add(sun.target); G.add(new THREE.AmbientLight(0x30343c, 0.5));
    const cab = cabin(); s3.add(cab); const lbl = labelMesh(); s3.add(lbl);
    const fwd = new THREE.Vector3(-0.6, 0, -0.8).normalize(), side = new THREE.Vector3(0.8, 0, -0.6);   // you look roughly towards the pad (north-west)
    const saved = {fly: window.JFVR && JFVR.fly, maxY: window.JFVR && JFVR.flyMaxY, rad: window.JFVR && JFVR.flyRadius};
    if (window.JFVR) { JFVR.fly = true; JFVR.flyMaxY = 1e7; JFVR.flyRadius = 1e7; }
    const rp = rig.object3D.position; rp.set(LAND.x, 4000, LAND.z); rig.object3D.rotation.y = Math.atan2(-fwd.x, -fwd.z);
    const lc = document.querySelector('[camera]').components['look-controls']; if (lc && lc.yawObject) lc.yawObject.rotation.y = 0;
    const onSkip = () => { if (A && window.W3D_READY) A.skip = true; }, onKey = e => { if (e.key === 'Escape') onSkip(); };
    sc.addEventListener('bbuttondown', onSkip); window.addEventListener('keydown', onKey);
    const btn = document.createElement('button'); btn.textContent = 'Skip'; btn.style.cssText = 'position:fixed;right:18px;bottom:70px;z-index:60;font:600 15px sans-serif;padding:8px 14px;border-radius:8px;border:0;background:#ffd700;color:#111'; btn.onclick = onSkip; document.body.appendChild(btn);
    A = {ld: new THREE.Vector3(), t0: performance.now(), bgc: new THREE.Color(0x000004), sun, G, stars, earth, moon, cab, lbl, fwd, side, saved, rig, sc, s3, onSkip, onKey, btn, hold: 0, desc0: 0, cw: new THREE.Vector3(), skip: false};
    W3D.arrivalActive = true; console.log('transit: arrival started');
  }
  function finish() { if (!A) return; const a = A; A = null;
    a.s3.remove(a.G); a.s3.remove(a.cab); a.s3.remove(a.lbl); for (const o of [a.G, a.cab, a.lbl]) o.traverse(m => { if (m.geometry) m.geometry.dispose(); if (m.material) { if (m.material.map) m.material.map.dispose(); m.material.dispose(); } });
    a.sc.removeEventListener('bbuttondown', a.onSkip); window.removeEventListener('keydown', a.onKey); a.btn.remove();
    if (window.JFVR) JFVR.fly = a.saved.fly;   // fly limits are owned by goWorld() (set when the world is ready)
    if (W3D.root) W3D.root.visible = true; if (W3D.fog) a.s3.fog = W3D.fog; if (W3D.bg) a.s3.background = W3D.bg;
    W3D.arrivalActive = false; W3D.arrivalCover = false; W3D.spaceView = false;
    if (W3D.spots && W3D.spots.padland) W3D.spots.padland(); else if (W3D.teleportTo) W3D.teleportTo(LAND.x, undefined, LAND.z, -45);
    const msg = 'Welcome back from Mars'; if (W3D.toast) W3D.toast(msg, 4000); else if (window.JFVR && JFVR.hud) JFVR.hud(msg);
    console.log('transit: arrival landed'); }
  const black = new THREE.Color(0x000004), glowC = new THREE.Color(0xff8a3c), skyC = new THREE.Color(0xa9c6e2);
  AFRAME.registerSystem('w3d-arrival', { tick: function () {
    if (!A) return; const a = A, t = (performance.now() - a.t0) / 1000, cam = this.el.camera; if (!cam) return;
    const rig = a.rig.object3D, rp = rig.position, ph = a.rig.components && a.rig.components['w3d-physics'];
    { const y = rig.rotation.y; a.fwd.set(-Math.sin(y), 0, -Math.cos(y)); a.side.set(Math.cos(y), 0, -Math.sin(y)); }   // follow the rig heading (a teleport may turn it)
    const space = t < T.descent || (!window.W3D_READY && !a.desc0);
    if (a.skip) { finish(); return; }
    if (space) {   // ---- deep space, Moon pass, Earth approach, entry (and cloud hold until the world is ready) ----
      rp.set(LAND.x, 4000, LAND.z); if (ph && ph.prev) { ph.prev.copy(rp); ph.vy = 0; }
      if (W3D.root) W3D.root.visible = false; a.s3.fog = null; W3D.spaceView = true;
      rig.updateMatrixWorld(true); cam.updateMatrixWorld(true); const cw = a.cw.setFromMatrixPosition(cam.matrixWorld);
      a.G.position.set(0, 0, 0); a.stars.position.copy(cw);
      a.cab.position.set(rp.x, rp.y, rp.z); a.cab.rotation.y = rig.rotation.y;
      a.sun.position.copy(cw).addScaledVector(a.fwd, -800).addScaledVector(a.side, -300).add(new THREE.Vector3(0, 500, 0)); a.sun.target.position.copy(cw);   // sun over your shoulder
      // Moon: from far ahead-left, sweeping past ~4 km off your left shoulder, then behind
      const um = sm((t - T.moon0) / (T.moon1 - T.moon0)); a.moon.visible = t < T.moon1 + 1.5;
      a.moon.position.copy(cw).addScaledVector(a.fwd, 24000 - 30000 * um).addScaledVector(a.side, -4200).add(new THREE.Vector3(0, 900 - 1200 * um, 0)); a.moon.rotation.y = t * 0.05;
      // Earth: grows from a far disc ahead-below to filling the view; at entry you're ~500 m above its 'surface'
      // (camera far plane is 30 km, so 'far away' is a scaled-down globe inside 25 km rather than a huge distant one)
      const ue = sm((t - T.earth0) / (T.entry - T.earth0)), d = 25000 - (25000 - 6900) * ue, es = 0.12 + 0.88 * ue * ue;
      a.earth.visible = true; a.earth.scale.setScalar(es); const el = 0.42 + 0.56 * ue; a.earth.position.copy(cw).addScaledVector(a.fwd, d * Math.cos(el)).add(new THREE.Vector3(0, -d * Math.sin(el), 0)); a.earth.rotation.y = 1.2 + t * 0.01;
      let k = 0; if (t > T.entry) k = Math.min(1, (t - T.entry) / (T.descent - T.entry));
      const hold = t > T.descent;   // world still loading: sit in bright cloud
      a.bgc.copy(black).lerp(glowC, Math.sin(Math.min(1, k) * Math.PI) * 0.55).lerp(skyC, hold ? 1 : sm((k - 0.55) / 0.45)); a.s3.background = a.bgc; a.stars.material.opacity = 1 - sm(k * 1.6);
      a.earth.visible = k < 0.85;
      a.lbl.userData.set(t < T.earth0 ? 'Deep space - approaching the Moon' : t < T.entry ? 'Earth ahead' : hold ? 'Descending through cloud...' : 'Atmosphere entry');
    } else {       // ---- descent over Raynham / Bridgewater onto the launch pad ----
      if (!a.desc0) { a.desc0 = performance.now(); W3D.spaceView = false; if (W3D.root) W3D.root.visible = true; if (W3D.fog) a.s3.fog = W3D.fog; a.s3.background = W3D.bg || skyC; a.G.visible = false; }
      const u = Math.min(1, (performance.now() - a.desc0) / 1000 / (T.land - T.descent)), g = (W3D.groundAt ? W3D.groundAt(LAND.x, LAND.z, 1e4) : 12), y = g + 1500 * Math.pow(1 - u, 2.4);
      rp.set(LAND.x, y, LAND.z); if (ph && ph.prev) { ph.prev.copy(rp); ph.vy = 0; }
      a.cab.position.copy(rp); a.cab.rotation.y = rig.rotation.y; a.lbl.userData.set(u < 0.8 ? 'Descending to the launch pad' : 'Touchdown');
      if (u >= 1) { finish(); return; }
    }
    rig.updateMatrixWorld(true); cam.updateMatrixWorld(true); const cw = a.cw.setFromMatrixPosition(cam.matrixWorld);
    cam.getWorldDirection(a.ld); a.ld.y = 0; if (a.ld.lengthSq() < 1e-6) a.ld.copy(a.fwd); a.ld.normalize();   // caption ahead of where you look
    a.lbl.position.copy(cw).addScaledVector(a.ld, 2.2).add(new THREE.Vector3(0, -0.35, 0)); a.lbl.lookAt(cw.x, cw.y - 0.35, cw.z);
  } });
  W3D.arrival = {get active() { return !!A; }, skip: () => { if (A) A.skip = true; }, T};
  start();
})();
