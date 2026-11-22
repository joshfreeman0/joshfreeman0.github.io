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
