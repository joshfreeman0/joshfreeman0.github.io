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
    if (Math.abs(x) < 0.15) x = 0; if (Math.abs(y) < 0.15) y = 0;
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
      const x = e.detail.x;
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
      const rig = document.querySelector('#rig'); if (!JFVR.fly && rig) rig.object3D.position.y = 0;
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
/* patch thumbstick-move to include pitch when flying */
(function () {
  const C = AFRAME.components['thumbstick-move'].Component.prototype, orig = C.tick;
  C.tick = function (t, dt) {
    if (!JFVR.fly) return orig.call(this, t, dt);
    const rig = this.data.rig, cam = rig && rig.querySelector('[camera]');
    if (!rig || !cam || !dt) return;
    let {x, y} = this.axes; if (Math.abs(x) < 0.15) x = 0; if (Math.abs(y) < 0.15) y = 0; if (!x && !y) return;
    const q = cam.object3D.getWorldQuaternion(new THREE.Quaternion());
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(q), right = new THREE.Vector3(1, 0, 0).applyQuaternion(q);
    const step = (6 + rig.object3D.position.y * 0.5) * dt / 1000;
    const p = rig.object3D.position; p.addScaledVector(fwd, -y * step).addScaledVector(right, x * step);
    p.y = Math.min(Math.max(p.y, 0), 500);
  };
})();
