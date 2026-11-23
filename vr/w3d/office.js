/* Fowling Pond - round desk + revolving chair in the top-floor office (centred over the gold sun-disk inlay).
   Desk: solid round top 2.6 m across, polished dark wood with a gold edge, dark-marble apron and pedestal, gilded lamp in the middle.
   Chair: rides a gold ring track (r 1.95 m) all the way round the desk, always facing it.
     - click / tap / trigger the chair to sit: you snap onto the seat facing the desk (seated eye 1.2 m; VR uses your measured head height)
     - left stick left/right, Q / E, or the phone joystick left/right: glide round the desk (~30 deg/s)
     - A or B, click the chair again, push forward/back (stick, W/S, arrows) or physically walk off: stand up
   Local only (not synced in the p2p room). */
(function () {
const R_DESK = 1.3, R_TRACK = 1.95, EYE = 1.2, SPEED = Math.PI / 6;
let C = null, chair = null, prox = null, ang = Math.PI / 2, seated = false, headY = 1.6, camOff = null, keys = {}, sitT = 0;
const LITE = !!window.JFVR_LITE;
function build() {
  if (!window.W3D || !W3D.root || !W3D.liftOffice || !W3D.walls || !window.AFRAME) return setTimeout(build, 400);
  const L = W3D.liftOffice; C = {x: L.x + 5.5, y: L.y, z: L.z - 5.5};
  const g = new THREE.Group(); g.name = 'office-round-desk'; g.position.set(C.x, C.y, C.z); W3D.root.add(g);
  const wood = new THREE.MeshStandardMaterial({color: 0x4a2716, roughness: 0.28, metalness: 0.05});
  const marble = new THREE.MeshStandardMaterial({color: 0x23201d, roughness: 0.18, metalness: 0.1});
  const gold = (W3D.M && W3D.M.gold) || new THREE.MeshStandardMaterial({color: 0xd4af37, roughness: 0.3, metalness: 0.9});
  const leather = new THREE.MeshStandardMaterial({color: 0x3b2516, roughness: 0.55});
  const seg = LITE ? 40 : 72, add = (geo, m, y) => { const o = new THREE.Mesh(geo, m); o.position.y = y; o.castShadow = !LITE; o.receiveShadow = true; g.add(o); return o; };
  add(new THREE.CylinderGeometry(0.75, 0.9, 0.06, seg), marble, 0.03);                 // plinth
  add(new THREE.CylinderGeometry(0.55, 0.62, 0.52, seg), marble, 0.32);                // pedestal
  add(new THREE.CylinderGeometry(R_DESK - 0.08, R_DESK - 0.14, 0.18, seg), marble, 0.66); // apron
  add(new THREE.CylinderGeometry(R_DESK, R_DESK, 0.06, seg), wood, 0.78);               // top (surface at 0.81)
  const edge = new THREE.Mesh(new THREE.TorusGeometry(R_DESK, 0.03, 8, seg), gold); edge.rotation.x = Math.PI / 2; edge.position.y = 0.79; g.add(edge);
  const inlay = new THREE.Mesh(new THREE.RingGeometry(R_DESK - 0.16, R_DESK - 0.13, seg), gold); inlay.rotation.x = -Math.PI / 2; inlay.position.y = 0.812; g.add(inlay);
  // lamp in the middle: gilded stem, warm glowing shade
  add(new THREE.CylinderGeometry(0.11, 0.14, 0.04, 24), gold, 0.83);
  add(new THREE.CylinderGeometry(0.018, 0.018, 0.42, 10), gold, 1.04);
  const shade = add(new THREE.CylinderGeometry(0.1, 0.19, 0.18, 24, 1, true), new THREE.MeshStandardMaterial({color: 0xf3e2b8, emissive: 0xffc96b, emissiveIntensity: 0.9, side: THREE.DoubleSide, roughness: 0.7}), 1.28);
  shade.castShadow = false;
  if (!LITE) { const lt = new THREE.PointLight(0xffd9a0, 0.5, 4.5); lt.position.y = 1.22; g.add(lt); }
  // ring track on the floor
  const track = new THREE.Mesh(new THREE.TorusGeometry(R_TRACK, 0.035, 6, seg), gold); track.rotation.x = Math.PI / 2; track.position.y = 0.02; g.add(track);
  // revolving chair: carriage on the track, gold column, leather seat + back (back on the outside, you face the desk)
  chair = new THREE.Group(); g.add(chair);
  const ca = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = !LITE; chair.add(o); return o; };
  ca(new THREE.BoxGeometry(0.5, 0.06, 0.16), gold, 0, 0.04, 0);
  ca(new THREE.CylinderGeometry(0.035, 0.05, 0.38, 10), gold, 0, 0.26, 0);
  ca(new THREE.CylinderGeometry(0.27, 0.25, 0.09, 24), leather, 0, 0.48, 0);
  const back = ca(new THREE.BoxGeometry(0.5, 0.55, 0.07), leather, 0, 0.82, 0.26); back.rotation.x = 0.1;
  for (const s of [-1, 1]) ca(new THREE.BoxGeometry(0.05, 0.05, 0.36), gold, s * 0.27, 0.66, 0.05);
  // collision: an octagon of boxes for the desk (the chair rides outside it)
  const w = (hx, hz) => W3D.walls.push({x0: C.x - hx, x1: C.x + hx, z0: C.z - hz, z1: C.z + hz, y0: C.y - 0.1, y1: C.y + 0.85, officeDesk: true});
  w(R_DESK, R_DESK * 0.41); w(R_DESK * 0.41, R_DESK); w(R_DESK * 0.71, R_DESK * 0.71);
  // click target
  const sc = document.querySelector('a-scene');
  prox = document.createElement('a-entity'); prox.setAttribute('class', 'btn'); prox.id = 'office-chair';
  prox.setAttribute('geometry', 'primitive: box; width: 0.7; height: 1.15; depth: 0.75'); prox.setAttribute('material', 'shader: flat; transparent: true; opacity: 0; depthWrite: false');
  prox.addEventListener('click', () => { if (performance.now() - sitT < 500) return; seated ? stand('click') : sit(); });
  sc.appendChild(prox);
  place();
  sc.addEventListener('abuttondown', () => { if (seated) { stand('A'); undoFly(); } });
  sc.addEventListener('bbuttondown', () => { if (seated) stand('B'); });
  document.addEventListener('keydown', e => { keys[e.code] = true; if (seated && (e.code === 'Escape')) stand('key'); });
  document.addEventListener('keyup', e => { keys[e.code] = false; });
  W3D.officeChair = {sit, stand, get seated() { return seated; }, get angle() { return ang; }, set angle(a) { ang = a; place(); }, C, R_TRACK};
}
let flyAtSit = false;
function undoFly() { // the A button also toggles fly mode elsewhere; standing up from the chair should not switch fly on
  if (JFVR.fly && !flyAtSit) { JFVR.fly = false; const l = document.querySelector('#flylabel'); if (l) l.setAttribute('value', 'Fly: OFF'); } }
function seatPos(a) { return {x: C.x + Math.sin(a) * R_TRACK, z: C.z + Math.cos(a) * R_TRACK}; }
function place() { const p = seatPos(ang); chair.position.set(p.x - C.x, 0, p.z - C.z); chair.rotation.y = ang;
  if (prox) { prox.object3D.position.set(p.x, C.y + 0.58, p.z); prox.object3D.rotation.y = ang; } }
const rigEl = () => document.getElementById('rig'), cam3 = () => document.querySelector('a-scene').camera;
function sit() {
  const rig = rigEl(), cam = cam3(); if (!rig || !cam) return;
  if (JFVR.fly && JFVR.toggleFly) { JFVR.fly = false; const l = document.querySelector('#flylabel'); if (l) l.setAttribute('value', 'Fly: OFF'); }
  flyAtSit = false; rig.object3D.updateMatrixWorld(true);
  const cw = cam.getWorldPosition(new THREE.Vector3()); const h = cw.y - rig.object3D.position.y; headY = h > 0.5 && h < 2.3 ? h : 1.6;
  // face the desk: A-Frame looks down -z, so rig yaw = track angle; desktop drag-look reset
  rig.object3D.rotation.y = ang; const lc = document.querySelector('[camera]').components['look-controls']; if (lc && lc.yawObject) lc.yawObject.rotation.y = 0;
  rig.object3D.updateMatrixWorld(true); const cw2 = cam.getWorldPosition(new THREE.Vector3());
  camOff = new THREE.Vector3(cw2.x - rig.object3D.position.x, 0, cw2.z - rig.object3D.position.z).applyAxisAngle(new THREE.Vector3(0, 1, 0), -ang); // head offset in rig space
  const ph = rig.components['w3d-physics']; if (ph && ph.pause) ph.pause();
  seated = true; sitT = performance.now(); lock();
  JFVR.hud && JFVR.hud('Seated - left stick / Q E to glide round the desk; A or B to stand');
}
function lock() { const rig = rigEl(); if (!rig) return; const p = seatPos(ang), o = camOff.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), ang);
  rig.object3D.position.set(p.x - o.x, C.y + EYE - headY, p.z - o.z); rig.object3D.rotation.y = ang; }
function stand(why) {
  if (!seated) return; seated = false; sitT = performance.now(); const rig = rigEl(); if (!rig) return;
  const p = seatPos(ang), out = 0.75; rig.object3D.position.set(p.x + Math.sin(ang) * out - (camOff ? camOff.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), ang).x : 0), C.y, p.z + Math.cos(ang) * out - (camOff ? camOff.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), ang).z : 0));
  const ph = rig.components['w3d-physics']; if (ph) { if (ph.prev) ph.prev.copy(rig.object3D.position); ph.vy = 0; if (ph.play) ph.play(); }
  JFVR.hud && JFVR.hud('You stood up');
}
function axes() { // [x, y] from the left stick, phone joystick and keys
  let x = 0, y = 0; const lh = document.querySelector('[thumbstick-move]'), gp = JFVR.leftPad && lh && JFVR.leftPad(lh);
  if (gp && gp.axes && gp.axes.length >= 4) { x = gp.axes[2]; y = gp.axes[3]; }
  const tm = lh && lh.components['thumbstick-move']; if (tm && !x && !y) { x = tm.axes.x; y = tm.axes.y; }
  const ta = JFVR.touchAxes; if (ta && !x && !y) { x = ta.x; y = ta.y; }
  if (keys.KeyQ) x = -1; if (keys.KeyE) x = 1;
  if (keys.KeyW || keys.ArrowUp || keys.KeyS || keys.ArrowDown) y = keys.KeyW || keys.ArrowUp ? -1 : 1;
  if (keys.ArrowLeft) x = -1; if (keys.ArrowRight) x = 1;
  return [Math.abs(x) > 0.2 ? x : 0, Math.abs(y) > 0.2 ? y : 0];
}
AFRAME.registerSystem('w3d-office-chair', {
  init: function () { build(); },
  tock: function (t, dt) {
    if (!seated || !C || !dt) return;
    if (!window.W3D || !W3D.active) { seated = false; return; }
    const [x, y] = axes(); const ph = rigEl() && rigEl().components['w3d-physics']; if (ph && ph.isPlaying && ph.pause) ph.pause();
    if (Math.abs(y) > 0.75 && performance.now() - sitT > 600) { stand('walk'); return; }   // push forward/back = get up and walk
    // glide: stick right = clockwise seen from above (to your right while facing the desk)
    if (x) { ang += x * SPEED * Math.min(dt, 250) / 1000; place(); }
    // physically walking off the seat (VR) stands you up
    const cam = cam3(), rig = rigEl(); rig.object3D.updateMatrixWorld(true); const cw = cam.getWorldPosition(new THREE.Vector3()), p = seatPos(ang);
    lock();
    if (Math.hypot(cw.x - p.x, cw.z - p.z) > 0.9 && performance.now() - sitT > 800) { stand('walked'); return; }
  }
});
})();
