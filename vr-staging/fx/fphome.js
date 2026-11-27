/* Fowling Pond host for the family home (staging only, Nov 27 2026). Mounts FPX.familyhome (fx/familyhome.js) on the open south
   shore of the pond's west arm at world (-705, ~20.2, 680), front porch facing the pond (north, -z). Fictional house: no address,
   no street name; the only label is "Home".
   - window.FP_HOME = {ready, site, spawns: {porch, wife, kids: [3], yard, play, kitchen, living}, go(), mount(), unmount()}
     each spawn = {position: [x, y, z], rotationY} in world metres, rotationY in DEGREES (0 = facing -z / north, toward the pond;
     the same convention as W3D.teleportTo yaw). 'fp-home-ready' fires on the a-scene (detail = FP_HOME) when it is set.
   - FP_HOME.bounds = house shell footprint {x0, x1, z0, z1}, FP_HOME.porchBounds = porch + steps (world metres). If C's companion module is up with api.setHome, only the
     wife is pinned (porch); the kids are left to the module (spawns.kids[i], roaming inside `play`). Read-only otherwise; skipped quietly when not there.
   - Go to: ?spot=home (also family-home / familyhome / house), W3D.spots.familyhome, 2D menu Go to > "Home", VR menu Go to > "Home",
     left-wrist panel "Home" button. Lands on the porch facing the pond. The old "Home: Fowling Pond" button (fly over the pond) is unchanged. */
(function () {
  'use strict';
  const SITE = {x: -705, z: 680}, LOT_PAD = 4, SHOW_D = 700;
  const QS = new URLSearchParams(location.search), SP = (QS.get('spot') || QS.get('room') || '').toLowerCase();
  const WANT = /^(home|family-?home|house)$/.test(SP) && QS.get('home') !== '0';
  const H = window.FP_HOME = window.FP_HOME || {ready: false};
  let keepOut = null, handle = null, origin = null, added = {floors: [], walls: []}, hiddenTrees = [], maskHook = null, wired = false;
  const hud = m => { if (window.JFVR && JFVR.hud) JFVR.hud(m); };

  function clearTrees(L) {   // the woodland trees inside the lot (world rect) are scaled to zero; restored on unmount
    if (!W3D.root) return; const m4 = new THREE.Matrix4(), p = new THREE.Vector3(), zero = new THREE.Matrix4().makeScale(0, 0, 0);
    W3D.root.traverse(o => { if (!o.isInstancedMesh || !/^(trees|trees-pitchpine|trees-pitchpine-trunk)$/.test(o.name)) return; let ch = 0;
      for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m4); p.setFromMatrixPosition(m4); if (p.x > L.x0 && p.x < L.x1 && p.z > L.z0 && p.z < L.z1) { hiddenTrees.push([o, i, m4.clone()]); o.setMatrixAt(i, zero); ch++; } }
      if (ch) o.instanceMatrix.needsUpdate = true; }); }
  function restoreTrees() { const set = new Set(); for (const [o, i, m] of hiddenTrees) { o.setMatrixAt(i, m); set.add(o); } set.forEach(o => { o.instanceMatrix.needsUpdate = true; }); hiddenTrees = []; }

  function mount() {
    if (handle || !window.FPX || !FPX.familyhome || !W3D.root || !W3D.terrainH) return handle;
    const sc = document.querySelector('a-scene'), tH = W3D.terrainH;
    let gMax = -1e9; for (let x = -6; x <= 6; x += 2) for (let z = -7; z <= 4.5; z += 1.5) gMax = Math.max(gMax, tH(SITE.x + x, SITE.z + z));
    origin = {x: SITE.x, y: gMax - 0.1, z: SITE.z};
    const ground = (x, z) => tH(origin.x + x, origin.z + z) - origin.y;
    const inst = FPX.familyhome.build({ground, lite: !!window.JFVR_LITE});
    inst.group.position.set(origin.x, origin.y, origin.z); W3D.root.add(inst.group);
    const t0 = performance.now(); handle = {inst, unmount() {}}; 
    if (!AFRAME.components['fp-home-tick']) AFRAME.registerComponent('fp-home-tick', {tick() { if (handle && handle.inst.group.visible) handle.inst.update((performance.now() - t0) / 1000); }});
    sc.setAttribute('fp-home-tick', '');
    const wx = r => Object.assign({}, r, {x0: r.x0 + origin.x, x1: r.x1 + origin.x, z0: r.z0 + origin.z, z1: r.z1 + origin.z});
    for (const f of inst.floors) { const w = wx(f); w.y = f.y + origin.y; W3D.floors.push(w); added.floors.push(w); }
    for (const f of inst.walls) { const w = wx(f); w.y0 = f.y0 + origin.y; w.y1 = f.y1 + origin.y; W3D.walls.push(w); added.walls.push(w); }
    const L = inst.lot; W3D.keepOut = W3D.keepOut || []; keepOut = {x: origin.x + (L.x0 + L.x1) / 2, z: origin.z + (L.z0 + L.z1) / 2, r: 27, name: 'the family home'}; W3D.keepOut.push(keepOut);   // no grass tufts through the lawn; build mode leaves it alone
    clearTrees({x0: origin.x + L.x0 - LOT_PAD, x1: origin.x + L.x1 + LOT_PAD, z0: origin.z + L.z0 - LOT_PAD, z1: origin.z + L.z1 + LOT_PAD});
    maskHook = ({rect}) => rect(origin.x + L.x0, origin.z + L.z0, origin.x + L.x1, origin.z + L.z1, 15);   // Real Earth: keep our ground here (already inside the pond cutout; belt and braces)
    W3D.maskHooks = W3D.maskHooks || []; W3D.maskHooks.push(maskHook); if (W3D.realEarth && W3D.realEarth.rebuildMask) W3D.realEarth.rebuildMask();
    // world spawns
    const S = inst.spawns, w = s => ({position: [+(s.x + origin.x).toFixed(2), +(s.y + origin.y).toFixed(2), +(s.z + origin.z).toFixed(2)], rotationY: s.rotationY});
    H.spawns = {porch: w(S.porch), wife: w(S.wife), kids: S.kids.map(w), yard: w(S.yard), play: w(S.play), kitchen: w(S.kitchen), living: w(S.living)};
    H.site = {x: origin.x, y: +origin.y.toFixed(2), z: origin.z, floorY: +(origin.y + inst.FY).toFixed(2), side: 'south shore of the pond (west arm), porch facing north over the water', tris: inst.tris, meshes: inst.calls};
    const wb = B => ({x0: +(origin.x + B.x0).toFixed(2), x1: +(origin.x + B.x1).toFixed(2), z0: +(origin.z + B.z0).toFixed(2), z1: +(origin.z + B.z1).toFixed(2)});
    H.bounds = wb(inst.bounds); H.porchBounds = wb(inst.porchBounds);   // house shell footprint (walls) and the porch + steps, world metres
    H.ready = true; H.version = 2; H.mount = mount; H.unmount = unmount; H.go = go;
    console.log('fp-home: built at', origin.x, origin.y.toFixed(2), origin.z, inst.tris + ' tris', inst.calls + ' meshes');
    sc.emit('fp-home-ready', H, false); try { window.dispatchEvent(new CustomEvent('fp-home-ready', {detail: H})); } catch (e) {}
    placeFamily();
    return handle;
  }
  function unmount() {
    if (!handle) return; handle.inst.dispose(); handle = null;
    const rm = (arr, list) => list.forEach(x => { const i = arr.indexOf(x); if (i >= 0) arr.splice(i, 1); }); rm(W3D.floors, added.floors); rm(W3D.walls, added.walls); added = {floors: [], walls: []};
    restoreTrees(); if (keepOut && W3D.keepOut) { const i = W3D.keepOut.indexOf(keepOut); if (i >= 0) W3D.keepOut.splice(i, 1); keepOut = null; } if (maskHook && W3D.maskHooks) { const i = W3D.maskHooks.indexOf(maskHook); if (i >= 0) W3D.maskHooks.splice(i, 1); maskHook = null; if (W3D.realEarth && W3D.realEarth.rebuildMask) W3D.realEarth.rebuildMask(); }
    H.ready = false; const sc = document.querySelector('a-scene'); if (sc) sc.removeAttribute('fp-home-tick');
  }
  function go() {
    if (!handle) mount(); if (!H.spawns) return;
    if (window.JFVR && JFVR.fly) { JFVR.fly = false; const l = document.querySelector('#flylabel'); if (l) l.setAttribute('value', 'Fly: OFF'); }
    const p = H.spawns.porch; W3D.teleportTo(p.position[0], p.position[1], p.position[2], p.rotationY); hud('Home');
  }

  /* companions (C's module): wife on the porch, kids at the play area. Only api.list() and api.setHome() are used, if present. */
  let famDone = '';
  function placeFamily() {
    const api = window.FP_COMPANION || window.FPC; if (!api || typeof api.setHome !== 'function' || !H.spawns) return false;
    let list = []; try { list = (typeof api.list === 'function' ? api.list() : []) || []; } catch (e) {}
    const role = c => ((c.role || '') + ' ' + (c.id || '')).toLowerCase();
    const wife = list.filter(c => /wife|spouse/.test(role(c))), kids = list.filter(c => /kid|child|son|daughter/.test(role(c)));   // roster order = spawns.kids[0..2]
    const sig = wife.map(c => c.id).join(','); if (!sig || sig === famDone) return !!sig;
    const P = s => ({x: s.position[0], y: s.position[1], z: s.position[2], rotationY: s.rotationY});   // rotationY in degrees, as the companion module reads it
    try { wife.forEach(c => api.setHome(c.id, P(H.spawns.wife))); famDone = sig; } catch (e) {}   // kids: not pinned - the companion module places them at spawns.kids[i] and lets them roam inside `play`
    return true; }
  let famTries = 0; const famIv = setInterval(() => { if (++famTries > 120) return clearInterval(famIv); if (H.ready) placeFamily(); }, 2000);   // picks up the roster once C's module mounts (2 s x 4 min)

  /* menus: 2D Go to, VR menu (lands in Go to via the 'w:home' key menutabs.js already ranks there), left-wrist panel */
  function menus() {
    const ref = document.querySelector('#ui button[data-w="home"]');
    if (ref && !document.getElementById('homebtn2d')) { const b = document.createElement('button'); b.id = 'homebtn2d'; b.textContent = 'Home'; b.style.cssText = 'background:#ffd9a0';
      ref.parentNode.insertBefore(b, ref); b.addEventListener('click', ev => { ev.stopPropagation(); if (typeof window.goWorld === 'function') window.goWorld('familyhome'); }); }
    const bar = document.getElementById('vrbar');
    if (bar && !document.getElementById('w:home')) { const p = document.createElement('a-plane'); p.id = 'w:home'; p.className = 'btn'; p.setAttribute('width', 1.3); p.setAttribute('height', 0.26); p.setAttribute('material', 'shader:flat;color:#ffd9a0');
      const t = document.createElement('a-text'); t.setAttribute('value', 'Home'); t.setAttribute('align', 'center'); t.setAttribute('color', '#111'); t.setAttribute('width', 2.0); t.setAttribute('position', '0 0 0.005'); p.appendChild(t);
      p.addEventListener('click', () => { if (typeof window.goWorld === 'function') window.goWorld('familyhome'); }); bar.appendChild(p); }
    wrist();
  }
  const fromLeft = ev => { const ce = ev.detail && ev.detail.cursorEl, lc = ce && ce.getAttribute && ce.getAttribute('laser-controls'); return !!(lc && /left/.test(typeof lc === 'string' ? lc : lc.hand)); };
  function wrist() {
    const wr = document.getElementById('wristpanel'); if (!wr || document.getElementById('wristhome') || !wr.userData && !(wr.object3D && wr.object3D.userData)) return;
    const Hh = (wr.object3D.userData && wr.object3D.userData.H) || (wr.userData && wr.userData.H) || 0.2;
    const b = document.createElement('a-plane'); b.id = 'wristhome'; b.className = 'btn'; b.setAttribute('width', 0.2); b.setAttribute('height', 0.042); b.setAttribute('position', `0 ${(-Hh / 2 - 0.128).toFixed(4)} 0.002`);
    b.setAttribute('material', 'shader:flat;transparent:true;opacity:0;depthTest:false;depthWrite:false'); wr.appendChild(b);
    b.addEventListener('loaded', () => { const c = document.createElement('canvas'); c.width = 256; c.height = 54; const g = c.getContext('2d'); g.fillStyle = '#ffd9a0'; g.fillRect(0, 0, 256, 54); g.fillStyle = '#111'; g.font = 'bold 30px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('Home', 128, 28);
      const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; const m = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.04), new THREE.MeshBasicMaterial({map: tx, transparent: true, depthTest: false, depthWrite: false, toneMapped: false}));
      m.position.z = 0.001; m.renderOrder = 3002; b.object3D.add(m); b.object3D.renderOrder = 3001;
      setTimeout(() => document.querySelectorAll('[raycaster]').forEach(r => r.components.raycaster && r.components.raycaster.refreshObjects()), 300); });
    b.addEventListener('click', ev => { if (fromLeft(ev)) return; if (typeof window.goWorld === 'function') window.goWorld('familyhome'); });
  }

  /* visibility: hide beyond SHOW_D (draw calls), keep built (cheap) */
  const _v = {x: 0, z: 0};
  setInterval(() => { if (!handle) return; const c = document.querySelector('a-scene'); const cam = c && c.camera; if (!cam) return; const e = cam.matrixWorld.elements;
    const d = Math.hypot(e[12] - origin.x, e[14] - origin.z); handle.inst.group.visible = d < SHOW_D; if (!wired) menus(); else wrist(); }, 1000);

  (function boot(n) {
    if (!(window.W3D_READY && window.W3D && W3D.root && W3D.spots && W3D.terrainH && window.FPX && FPX.familyhome)) { if (n < 1500) setTimeout(() => boot(n + 1), 200); return; }
    Object.assign(W3D.spots, {familyhome: go, 'family-home': go, house: go});
    mount(); menus(); setTimeout(menus, 3000); setTimeout(() => { menus(); wired = true; }, 8000);
    if (WANT) (function arrive(k) { if (k > 300) return; if ((W3D.arrival && W3D.arrival.active) || typeof window.goWorld !== 'function') return setTimeout(() => arrive(k + 1), 300);
      setTimeout(() => window.goWorld('familyhome'), 400); })(0);
  })(0);
})();
