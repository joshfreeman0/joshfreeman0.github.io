/* FP_ROOMS - guest worlds mounted INSIDE the Fowling Pond page (no navigation, so Quest never leaves VR). Contract: vr/ROOMS.md.
   A room is an ES module that calls window.FP_ROOMS.register(name, {mount(sceneEl, rootEl, ctx), unmount(), env, spawn, ground, blocked}).
   enter(name): the home world is hidden (W3D.root, Real Earth tiles via W3D.spaceView, saucer city), Real Earth's tile cache is
   trimmed to free memory, sky/fog/camera far are swapped, the room is built under its own <a-entity> at ROOM_ORIGIN (far from
   everything at home; three computes model-view in doubles, so large offsets don't wobble), physics uses the room's ground/walls.
   leave(): unmount, dispose, restore everything; {arrive:true} replays the rocket arrival (transit.js) onto the launch pad.
   Mars uses its module only once one is listed in CATALOG (Me's mountRPL, after Sat); until then the rocket keeps the
   same-origin /vr/mars/ hand-off. Test: ?room_mars=/vr/rooms/stub.js swaps in the stub room (only /vr/rooms/*.js accepted). */
(function () {
  const QS = new URLSearchParams(location.search);
  const ROOM_ORIGIN = {x: 0, y: 0, z: 400000};
  const okUrl = u => typeof u === 'string' && /^\/vr\/rooms\/[\w-]+\.js$/.test(u);
  const CATALOG = {
    mars: {title: 'Red Planet Lounge', module: null, fallbackUrl: '/vr/mars/?spot=pad&from=joshfreeman-vr'},   // module: set when Me ships mountRPL
    tesseract: {title: 'Tesseract room', module: '/vr/rooms/tesseract.js?v=1', fallbackUrl: null},                     // T-21, entered via tesseractgate.js
    stub: {title: 'Test room', module: '/vr/rooms/stub.js?v=1', fallbackUrl: null}
  };
  for (const k of Object.keys(CATALOG)) { const u = QS.get('room_' + k); if (okUrl(u)) CATALOG[k].module = u; }
  const REG = {}, waiters = {};
  let cur = null, busy = false, fade = null, fadeK = 0, fadeDir = 0;
  const sc = () => document.querySelector('a-scene');
  const log = m => { try { console.log('rooms: ' + m); } catch (e) {} };

  function register(name, room) {
    if (!name || !room || typeof room.mount !== 'function') throw new Error('FP_ROOMS.register: need a name and mount()');
    REG[name] = room; log('registered ' + name); (waiters[name] || []).splice(0).forEach(f => f());
  }
  function load(name) {
    if (REG[name]) return Promise.resolve(REG[name]);
    const c = CATALOG[name]; if (!c || !c.module) return Promise.reject(new Error('no module for ' + name));
    return new Promise((res, rej) => {
      const to = setTimeout(() => rej(new Error('room ' + name + ' did not register')), 20000);
      (waiters[name] = waiters[name] || []).push(() => { clearTimeout(to); res(REG[name]); });
      window.FP_ROOMS.pending = name; import(c.module).catch(e => { clearTimeout(to); rej(e); });
    });
  }
  // black fade on the camera, stepped on the A-Frame tick (XR-safe)
  function setFade(on) { const s = sc(); if (!s || !s.camera) return;
    if (!fade) { fade = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 8), new THREE.MeshBasicMaterial({color: 0, side: THREE.BackSide, transparent: true, opacity: 1, depthTest: false, depthWrite: false, fog: false})); fade.renderOrder = 1e4 + 5; }
    if (fade.parent !== s.camera) s.camera.add(fade);
    if (on) { fadeK = 1; fadeDir = 0; fade.material.opacity = 1; fade.visible = true; } else fadeDir = -1; }
  AFRAME.registerSystem('fp-rooms', { tick: function (t, dt) {
    if (fadeDir < 0 && fade) { fadeK = Math.max(0, fadeK - (dt || 16) / 800); fade.material.opacity = fadeK; if (!fadeK) { fadeDir = 0; fade.visible = false; } }
  } });
  function trimEarth() {   // let Real Earth's tile cache drop what it holds while we're away (it reloads near you on return; no new root.json)
    const T = W3D.realEarth && W3D.realEarth.tiles, C = T && T.lruCache; if (!C) return;
    try { const mx = C.maxBytesSize, mn = C.minBytesSize; if (C.markAllUnused) C.markAllUnused(); C.minBytesSize = 0; C.maxBytesSize = 1;
      if (C.unloadUnusedContent) C.unloadUnusedContent(); C.maxBytesSize = mx; C.minBytesSize = mn; } catch (e) { log('trim: ' + e); }
  }
  function disposeTree(o) { o.traverse(m => { if (m.geometry) m.geometry.dispose(); [].concat(m.material || []).forEach(x => { for (const k in x) if (x[k] && x[k].isTexture) x[k].dispose(); x.dispose(); }); }); }

  async function enter(name, opts) {
    opts = opts || {}; if (busy || cur) return false; const s = sc(); if (!s || !W3D.root) return false;
    busy = true; const s3 = s.object3D, rig = document.querySelector('#rig');
    // 1) synchronously hide home behind a black fade (same task as the rocket teardown, so no home frame flashes)
    const saved = {rootVis: W3D.root.visible, fog: s3.fog, bg: s3.background, env: s3.environment, far: s.camera.far, fly: JFVR.fly, rad: JFVR.flyRadius, maxY: JFVR.flyMaxY, gAt: JFVR.groundAt, spaceView: !!W3D.spaceView};
    setFade(true); W3D.root.visible = false; W3D.spaceView = true; s3.fog = null; s3.background = new THREE.Color(0); W3D.inRoom = name;
    if (W3D.cities && W3D.cities.leave) try { W3D.cities.leave(); } catch (e) {}
    let room, el;
    try {
      room = await load(name);
      trimEarth();
      el = document.createElement('a-entity'); el.id = 'fproom-' + name; el.setAttribute('position', ROOM_ORIGIN.x + ' ' + ROOM_ORIGIN.y + ' ' + ROOM_ORIGIN.z); s.appendChild(el);
      if (!el.hasLoaded) await new Promise(r => el.addEventListener('loaded', r, {once: true}));
      const env = room.env || {};
      s3.background = new THREE.Color(env.background != null ? env.background : 0x000000);
      s3.fog = env.fog ? new THREE.Fog(env.fog[0], env.fog[1], env.fog[2]) : null; s3.environment = null;
      if (env.far) { s.camera.far = env.far; s.camera.updateProjectionMatrix(); }
      const O = ROOM_ORIGIN, gr = room.ground, bl = room.blocked;
      W3D.roomPhys = {ground: (x, z, y) => { const v = gr ? gr(x - O.x, z - O.z, y - O.y) : 0; return (v == null ? 0 : v) + O.y; }, blocked: (x, z, y) => !!(bl && bl(x - O.x, z - O.z, y - O.y))};
      JFVR.fly = false; JFVR.flyRadius = 1e7; JFVR.flyMaxY = 1e5; JFVR.groundAt = W3D.groundAt;
      cur = {name, room, el, saved, opts};
      const ctx = {THREE, AFRAME, origin: O, lite: !!window.JFVR_LITE, quest: /OculusBrowser|Quest/i.test(navigator.userAgent), opts,
        leave: o => leave(o), toast: m => (W3D.toast ? W3D.toast(m, 3500) : JFVR.hud && JFVR.hud(m)),
        teleport: (x, y, z, yaw) => W3D.teleportTo(O.x + x, O.y + (y || 0), O.z + z, yaw)};
      cur.ctx = ctx;
      await room.mount(s, el, ctx);
      const sp = room.spawn || {x: 0, y: 0, z: 0, yaw: 0}; ctx.teleport(sp.x, sp.y || 0, sp.z, sp.yaw || 0);
      if (rig && rig.components['w3d-physics']) rig.components['w3d-physics'].vy = 0;
      setFade(false); busy = false; log('entered ' + name); return true;
    } catch (e) {
      log('enter ' + name + ' failed: ' + (e && e.message || e)); busy = false;
      if (cur) await leave({arrive: false, quiet: true}); else restore(saved, el);
      return false;
    }
  }
  function restore(saved, el) {
    const s = sc(), s3 = s.object3D;
    if (el && el.parentNode) { disposeTree(el.object3D); el.parentNode.removeChild(el); }
    W3D.roomPhys = null; W3D.inRoom = null;
    W3D.root.visible = saved.rootVis; W3D.spaceView = saved.spaceView; s3.fog = saved.fog; s3.background = saved.bg; s3.environment = saved.env;
    if (s.camera.far !== saved.far) { s.camera.far = saved.far; s.camera.updateProjectionMatrix(); }
    JFVR.fly = saved.fly; JFVR.flyRadius = saved.rad; JFVR.flyMaxY = saved.maxY; JFVR.groundAt = saved.gAt;
    if (fade) { fadeK = 1; fadeDir = -1; }
  }
  async function leave(opts) {
    opts = opts || {}; if (!cur) return false; const c = cur; cur = null; busy = true;
    setFade(true);
    try { if (c.room.unmount) await c.room.unmount(); } catch (e) { log('unmount: ' + e); }
    restore(c.saved, c.el); busy = false; log('left ' + c.name);
    if (opts.arrive && W3D.arrivalStart) W3D.arrivalStart();                     // rocket ride back: deep space, Moon, Earth, onto the pad
    else if (opts.spot && W3D.spots && W3D.spots[opts.spot]) W3D.spots[opts.spot]();
    else if (W3D.spots && W3D.spots.padland) W3D.spots.padland();
    return true;
  }
  window.FP_ROOMS = {register, enter, leave, load, CATALOG, ROOM_ORIGIN,
    has: name => !!(REG[name] || (CATALOG[name] && CATALOG[name].module)),
    get current() { return cur && cur.name; }, get busy() { return busy; }};
})();
