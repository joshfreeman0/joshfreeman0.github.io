/* Thumbstick locomotion for Josh's VR World.
   Left stick: move forward/back/strafe relative to where you look.
   Right stick: snap turn 30 degrees. Also WASD/arrow keys on desktop. */
AFRAME.registerComponent('thumbstick-move', {
  schema: { speed: {default: 2.5}, rig: {type: 'selector', default: '#rig'} },
  init: function () {
    this.axes = {x: 0, y: 0};
    this.el.addEventListener('thumbstickmoved', e => { this.axes.x = e.detail.x; this.axes.y = e.detail.y; });
    this.el.addEventListener('axismove', e => { const a = e.detail.axis || []; if (a.length >= 4) { this.axes.x = a[2]; this.axes.y = a[3]; } });
  },
  tick: function (t, dt) {
    const rig = this.data.rig, cam = rig && rig.querySelector('[camera]');
    if (!rig || !cam || !dt) return;
    let {x, y} = this.axes;
    const gp = JFVR.leftPad && JFVR.leftPad(this.el);
    if (gp && gp.axes && gp.axes.length >= 4 && (Math.abs(gp.axes[2]) > 0.15 || Math.abs(gp.axes[3]) > 0.15)) { x = gp.axes[2]; y = gp.axes[3]; }
    if (Math.abs(x) < 0.15) x = 0; if (Math.abs(y) < 0.15) y = 0;
    const fly = window.JFVR && JFVR.fly, up = (window.JFVR && JFVR.upAxis) || 0;
    const boost = gp && ((gp.buttons[0] && gp.buttons[0].value > 0.5) || (gp.buttons[1] && gp.buttons[1].value > 0.5));
    if (fly) {
      if (!x && !y && Math.abs(up) < 0.2) return;
      const q = cam.object3D.getWorldQuaternion(new THREE.Quaternion());
      const f = new THREE.Vector3(0, 0, -1).applyQuaternion(q), r = new THREE.Vector3(1, 0, 0).applyQuaternion(q);
      const mag = Math.min(1, Math.hypot(x, y) || Math.abs(up));
      const p = rig.object3D.position, s = (40 + Math.max(p.y, 0) * 1.0) * (boost ? 15 : 1) * (0.3 + 0.7 * mag) * dt / 1000;
      p.addScaledVector(f, -y * s).addScaledVector(r, x * s);
      if (Math.abs(up) >= 0.2) p.y += -up * s;
      p.y = Math.min(Math.max(p.y, JFVR.groundAt ? JFVR.groundAt(p.x, p.z, p.y) + 0.3 : 0), JFVR.flyMaxY || 400);
      const R = JFVR.flyRadius || 400, hr = Math.hypot(p.x, p.z); if (hr > R) { p.x *= R / hr; p.z *= R / hr; }
      JFVR._alt = (JFVR._alt || 0) + dt;
      if (JFVR._alt > 500) { JFVR._alt = 0; JFVR.hud((boost ? 'BOOST - ' : 'Flying - ') + 'height ' + Math.round(p.y) + ' m'); }
      return;
    }
    if (!x && !y) return;
    const yaw = new THREE.Euler().setFromQuaternion(cam.object3D.getWorldQuaternion(new THREE.Quaternion()), 'YXZ').y;
    const fwd = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    const step = this.data.speed * dt / 1000;
    rig.object3D.position.addScaledVector(fwd, -y * step).addScaledVector(right, x * step);
  }
});
AFRAME.registerComponent('snap-turn', {
  schema: { rig: {type: 'selector', default: '#rig'}, angle: {default: 30} },
  init: function () {
    this.ready = true;
    this.el.addEventListener('thumbstickmoved', e => {
      const x = e.detail.x; if (window.JFVR) JFVR.upAxis = e.detail.y;
      if (this.ready && Math.abs(x) > 0.7) { this.data.rig.object3D.rotation.y -= Math.sign(x) * THREE.MathUtils.degToRad(this.data.angle); this.ready = false; }
      if (Math.abs(x) < 0.3) this.ready = true;
    });
  }
});

/* Fly mode: look up, point at the gold sun disk, pull trigger (or click) to toggle. */
window.JFVR = window.JFVR || {fly: false};
AFRAME.registerComponent('fly-toggle', {
  init: function () {
    const el = this.el; let last = 0;
    const toggle = () => {
      const now = performance.now(); if (now - last < 400) return; last = now;
      JFVR.fly = !JFVR.fly;
      const l = document.querySelector('#flylabel'); if (l) l.setAttribute('value', 'Fly: ' + (JFVR.fly ? 'ON' : 'OFF'));
      JFVR.hud('Fly mode ' + (JFVR.fly ? 'ON - push left stick to fly' : 'OFF'));
      const rig = document.querySelector('#rig'); if (!JFVR.fly && rig && !JFVR.groundAt) rig.object3D.position.y = 0;
    };
    JFVR.toggleFly = toggle;
    el.addEventListener('click', toggle);
    /* fallback: trigger/grip on a controller whose laser is pointing at the disk */
    const hook = hand => ['triggerdown', 'gripdown', 'abuttondown', 'xbuttondown'].forEach(ev => hand.addEventListener(ev, () => {
      const rc = hand.components.raycaster; if (!rc) return;
      if (rc.intersectedEls.indexOf(el) !== -1 || ev === 'abuttondown' || ev === 'xbuttondown') toggle();
    }));
    el.sceneEl.addEventListener('loaded', () => document.querySelectorAll('[laser-controls]').forEach(hook));
    if (el.sceneEl.hasLoaded) document.querySelectorAll('[laser-controls]').forEach(hook);
  }
});
JFVR.hud = function (msg) {
  const cam = document.querySelector('[camera]'); if (!cam) return;
  let t = document.querySelector('#jfhud');
  if (!t) { t = document.createElement('a-text'); t.id = 'jfhud'; t.setAttribute('position', '0 -0.25 -1'); t.setAttribute('align', 'center'); t.setAttribute('width', '1.2'); t.setAttribute('color', '#ffe9a8'); cam.appendChild(t); }
  t.setAttribute('value', msg); t.setAttribute('visible', true);
  clearTimeout(JFVR._h); JFVR._h = setTimeout(() => t.setAttribute('visible', false), 2500);
};
document.addEventListener('keydown', e => { if (e.key === 'f' || e.key === 'F') { JFVR.toggleFly && JFVR.toggleFly(); } });
/* Press the LEFT thumbstick in to hide/show the menu rectangles.
   Listens for the controller event AND reads the gamepad button directly every frame. */
AFRAME.registerComponent('menu-toggle', {
  init: function () {
    this.last = 0; this.wasDown = false;
    const t = () => this.toggle();
    ['thumbstickdown', 'thumbstickclick'].forEach(ev => this.el.addEventListener(ev, t));
  },
  pad: function () { return JFVR.leftPad(this.el); },
  _unused: function () {
    const tc = this.el.components['tracked-controls'];
    if (tc && tc.controller && tc.controller.gamepad) return tc.controller.gamepad;
    const s = this.el.sceneEl.renderer && this.el.sceneEl.renderer.xr && this.el.sceneEl.renderer.xr.getSession && this.el.sceneEl.renderer.xr.getSession();
    if (s) for (const src of s.inputSources) if (src.handedness === 'left' && src.gamepad) return src.gamepad;
    return null;
  },
  tick: function () {
    const g = this.pad(); if (!g || !g.buttons[3]) return;
    const down = g.buttons[3].pressed;
    if (down && !this.wasDown) this.toggle();
    this.wasDown = down;
  },
  toggle: function () {
    const now = performance.now(); if (now - this.last < 350) return; this.last = now;
    const els = document.querySelectorAll('#vrbar, .vr-menu');
    if (!els.length) return;
    let show = !els[0].object3D.visible;
    const bar = document.querySelector('#vrbar'), cam = document.querySelector('[camera]');
    if (!show && bar && cam) {
      /* menu is on but maybe far away or behind you: bring it to you instead of hiding */
      const cp = cam.object3D.getWorldPosition(new THREE.Vector3()), bp = bar.object3D.getWorldPosition(new THREE.Vector3());
      const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.object3D.getWorldQuaternion(new THREE.Quaternion()));
      const to = bp.clone().sub(cp); const far = to.length() > 4 || to.normalize().dot(dir) < 0.5;
      if (far) { JFVR.placeInFront(bar, 2.2, -1.0); JFVR.hud('Menu moved to you'); return; }
    }
    els.forEach(m => {
      m.setAttribute('visible', show); m.object3D.visible = show;
      if (show && m.id === 'vrbar') JFVR.placeInFront(m, 2.2, -1.0);
      [m, ...m.querySelectorAll('*')].forEach(c => {
        if (show) { if (c.dataset.cls) { c.classList.add(c.dataset.cls); delete c.dataset.cls; } }
        else ['btn', 'world'].forEach(k => { if (c.classList && c.classList.contains(k)) { c.dataset.cls = k; c.classList.remove(k); } });
      });
    });
    document.querySelectorAll('[raycaster]').forEach(r => r.components.raycaster && r.components.raycaster.refreshObjects());
    JFVR.hud && JFVR.hud(show ? 'Menu shown' : 'Menu hidden - press left stick to show');
  }
});

JFVR.leftPad = function (el) {
  const tc = el && el.components && el.components['tracked-controls'];
  if (tc && tc.controller && tc.controller.gamepad && (!tc.controller.handedness || tc.controller.handedness === 'left')) return tc.controller.gamepad;
  const sc = document.querySelector('a-scene'), xr = sc && sc.renderer && sc.renderer.xr, ses = xr && xr.getSession && xr.getSession();
  if (ses) for (const src of ses.inputSources) if (src.handedness === 'left' && src.gamepad) return src.gamepad;
  return null;
};
/* Put an entity in front of where the user is now looking (dist m ahead, dy m relative to eye height). */
JFVR.placeInFront = function (m, dist, dy) {
  const cam = document.querySelector('[camera]'); if (!cam) return;
  const pos = cam.object3D.getWorldPosition(new THREE.Vector3());
  const yaw = new THREE.Euler().setFromQuaternion(cam.object3D.getWorldQuaternion(new THREE.Quaternion()), 'YXZ').y;
  m.object3D.position.set(pos.x - Math.sin(yaw) * dist, pos.y + dy, pos.z - Math.cos(yaw) * dist);
  m.object3D.rotation.set(THREE.MathUtils.degToRad(-25), yaw, 0, 'YXZ');
};
