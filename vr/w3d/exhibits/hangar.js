/* Drone Hangar exhibit (T-30, Nov 27 2026; Josh via A): a small arched hangar, three unarmed quadcopters on gentle patrol loops,
   a flyable camera drone (FPX.drone) and an H18 Defense info panel (public facts from h18defense.eu, checked Nov 27 2026).
   No weapons, targeting or combat simulation. Self-contained: FPX.hangar.build(opts) -> instance; needs only THREE + kit.js.
   Local frame: origin = centre of the doorway at ground level, the door faces +z, the hangar runs back to z = -18, apron to z = +12.
   Lean: structure 1 merged mesh, drones 2 instanced meshes + parked drone, 5 canvas panels. */
(function () {
  'use strict';
  const FPX = window.FPX = window.FPX || {};
  const FY = 0.3, R = 7, L = 18;
  const FOOT = 'Curated through connections made at the Foresight Institute';
  function droneParts(P, x, y, z, s, ry) { const c = Math.cos(ry || 0), n = Math.sin(ry || 0), at = (dx, dz) => [x + (dx * c + dz * n) * s, z + (-dx * n + dz * c) * s];
    let q = at(0, 0); P.box(0.24 * s, 0.09 * s, 0.32 * s, q[0], y, q[1], 0x30343a, ry);
    P.box(0.16 * s, 0.03 * s, 0.2 * s, q[0], y + 0.06 * s, q[1], 0x6b7480, ry);
    for (const a of [Math.PI / 4, 3 * Math.PI / 4, 5 * Math.PI / 4, 7 * Math.PI / 4]) { const ex = Math.sin(a) * 0.32, ez = Math.cos(a) * 0.32; q = at(ex / 2, ez / 2);
      P.box(0.04 * s, 0.03 * s, 0.46 * s, q[0], y, q[1], 0x22252a, a + (ry || 0)); q = at(ex, ez); P.cyl(0.04 * s, 0.045 * s, 0.07 * s, 10, q[0], y + 0.04 * s, q[1], 0x111111); }
    q = at(0, 0.18); P.box(0.08 * s, 0.07 * s, 0.06 * s, q[0], y - 0.07 * s, q[1], 0x0d0d0d, ry);
    q = at(0, 0.215); P.box(0.04 * s, 0.04 * s, 0.01 * s, q[0], y - 0.07 * s, q[1], 0x2f6fff, ry);
    for (const sx of [-1, 1]) { q = at(sx * 0.1, 0); P.box(0.015 * s, 0.1 * s, 0.015 * s, q[0], y - 0.09 * s, q[1], 0x22252a, ry); P.box(0.02 * s, 0.015 * s, 0.3 * s, q[0], y - 0.14 * s, q[1], 0x22252a, ry); }
    return P; }
  FPX.droneParts = droneParts;
  function build(opts) { opts = opts || {}; const lite = !!opts.lite, seg = lite ? 14 : 24;
    const group = new THREE.Group(); group.name = 'fpx-hangar';
    const P = FPX.parts();
    P.box(2 * R + 2, 2.6, L + 13.5, 0, FY - 1.3, -L / 2 + 6.3, 0x8f8a80);
    P.box(2 * R - 0.4, 0.04, L - 0.4, 0, FY + 0.02, -L / 2, 0x9a9da2);
    P.box(14, 0.04, 11.5, 0, FY + 0.02, 6.2, 0x55585c);
    for (const sx of [-1, 1]) P.box(0.18, 0.05, L - 1, sx * 4.5, FY + 0.05, -L / 2, 0xe8c21a);
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; P.box(0.95, 0.05, 0.16, Math.sin(a) * 1.8, FY + 0.05, 5 + Math.cos(a) * 1.8, 0xe8c21a, a + Math.PI / 2); }
    P.box(0.18, 0.05, 1.4, -0.45, FY + 0.06, 5, 0xf2f2f2); P.box(0.18, 0.05, 1.4, 0.45, FY + 0.06, 5, 0xf2f2f2); P.box(0.9, 0.05, 0.18, 0, FY + 0.06, 5, 0xf2f2f2);
    P.add(new THREE.CylinderGeometry(R, R, L, seg, 1, true, Math.PI / 2, Math.PI), 0xa7adb3, 0, FY, -L / 2, Math.PI / 2, 0, 0);
    P.add(new THREE.CylinderGeometry(R + 0.18, R + 0.18, 0.5, seg, 1, true, Math.PI / 2, Math.PI), 0x6d7378, 0, FY, -0.25, Math.PI / 2, 0, 0);
    if (!lite) for (const z of [-4.5, -9, -13.5]) P.add(new THREE.CylinderGeometry(R + 0.08, R + 0.08, 0.25, seg, 1, true, Math.PI / 2, Math.PI), 0x7c8287, 0, FY, z, Math.PI / 2, 0, 0);
    P.add(new THREE.CircleGeometry(R, seg, 0, Math.PI), 0x8d9398, 0, FY, -L + 0.02, 0, 0, 0);
    P.box(6.4, 1.1, 0.2, 0, FY + 5.45, 0.05, 0x1a2a33);
    P.box(4, 0.08, 1, -4.4, FY + 0.95, -15.8, 0x7b5a3a); for (const sx of [-1, 1]) for (const sz of [-1, 1]) P.box(0.08, 0.95, 0.08, -4.4 + sx * 1.9, FY + 0.47, -15.8 + sz * 0.42, 0x333333);
    P.box(3.6, 0.06, 0.6, -4.4, FY + 1.9, -17.4, 0x555a60); P.box(3.6, 0.06, 0.6, -4.4, FY + 2.6, -17.4, 0x555a60);
    droneParts(P, -5.4, FY + 1.1, -15.8, 1.4, 0.4); droneParts(P, -3.4, FY + 1.1, -15.7, 1.4, -0.3); droneParts(P, -4.4, FY + 2.05, -17.4, 1.2, 0);
    P.box(1.2, 2.1, 0.6, 4.8, FY + 1.05, -17.3, 0xb2312b);
    P.box(0.12, 1.4, 0.12, 4.6, FY + 0.7, -2.6, 0x333333); P.box(0.12, 1.4, 0.12, -4.6, FY + 0.7, -6.2, 0x333333);
    const shell = P.mesh({double: true, rough: 0.6, metal: 0.25}); group.add(shell);
    const DP = FPX.parts(); droneParts(DP, 0, 0, 0, 1.6, 0); const parked = DP.mesh({metal: 0.3}); parked.position.set(0, FY + 0.32, 5); group.add(parked);
    const N = 3, BP = FPX.parts(); droneParts(BP, 0, 0, 0, 2.2, 0); const bodies = new THREE.InstancedMesh(BP.geometry(), new THREE.MeshStandardMaterial({vertexColors: true, roughness: 0.6, metalness: 0.3}), N);
    const blades = new THREE.InstancedMesh(new THREE.BoxGeometry(0.42, 0.008, 0.035), new THREE.MeshBasicMaterial({color: 0x222222}), N * 4);
    bodies.instanceMatrix.setUsage(THREE.DynamicDrawUsage); blades.instanceMatrix.setUsage(THREE.DynamicDrawUsage); bodies.frustumCulled = blades.frustumCulled = false; group.add(bodies, blades);
    const LOOPS = [{cx: 0, cz: 2, rx: 22, rz: 15, y: 13, w: 0.11, p: 0}, {cx: -6, cz: -8, rx: 16, rz: 20, y: 17, w: -0.08, p: 2}, {cx: 8, cz: 6, rx: 12, rz: 9, y: 10, w: 0.15, p: 4}];
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), qb = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3(1, 1, 1), tip = new THREE.Vector3();
    function update(t) { for (let i = 0; i < N; i++) { const Lp = LOOPS[i], a = Lp.p + t * Lp.w, x = Lp.cx + Math.sin(a) * Lp.rx, z = Lp.cz + Math.cos(a) * Lp.rz, y = FY + Lp.y + Math.sin(t * 0.7 + i) * 0.6;
        const dx = Math.cos(a) * Lp.rx * Lp.w, dz = -Math.sin(a) * Lp.rz * Lp.w, yaw = Math.atan2(dx, dz); e.set(0.12, yaw, 0.08 * Math.sign(Lp.w), 'YXZ'); q.setFromEuler(e); v.set(x, y, z); m4.compose(v, q, sc); bodies.setMatrixAt(i, m4);
        for (let k = 0; k < 4; k++) { const ang = Math.PI / 4 + k * Math.PI / 2; tip.set(Math.sin(ang) * 0.32 * 2.2, 0.13, Math.cos(ang) * 0.32 * 2.2).applyQuaternion(q).add(v);
          e.set(0.12, yaw + t * 40 * (k % 2 ? 1 : -1), 0, 'YXZ'); qb.setFromEuler(e); m4.compose(tip, qb, sc); blades.setMatrixAt(i * 4 + k, m4); } }
      bodies.instanceMatrix.needsUpdate = true; blades.instanceMatrix.needsUpdate = true; }
    update(0);
    const sign = FPX.panel(6, 1, [{t: 'DRONE HANGAR', s: 'title', fit: true}], {center: true}); sign.position.set(0, FY + 5.45, 0.17); group.add(sign);
    const h18 = FPX.panel(5.2, 3.6, [{t: 'H18 Defense', s: 'title'}, {t: 'Utrecht, the Netherlands  |  Rivne, Ukraine', s: 'sub'},
      {t: 'H18 Defense & Intelligence Products B.V. is a European defense-technology company founded in 2022. It develops unmanned aircraft (UAV) systems, counter-drone interceptors, and electronic-warfare (EW) and EW-hardened equipment.'},
      {t: 'Through its partner H18 Ukraine in Rivne, drones are produced for Ukrainian defense users. On its site the company also calls itself Hangar 18.'},
      {t: 'Source: h18defense.eu (home and About pages), checked November 2026.', s: 'small'},
      {t: 'The drones in this hangar are unarmed camera drones. Nothing here shows weapons, targeting or combat.', s: 'small', c: '#ffe9a8'}], {foot: FOOT});
    h18.position.set(1.6, FY + 2.55, -L + 0.06); group.add(h18);
    const how = FPX.panel(2.6, 2.4, [{t: 'How a quadcopter flies', s: 'title', k: 0.8}, {t: 'Two rotors spin clockwise and two counter-clockwise, so their twisting forces cancel and it holds its heading.'},
      {t: 'Climb: all four speed up together. Move: the rotors on one side spin faster, it leans away from them and travels that way.'},
      {t: 'Turn: one spinning pair speeds up and the other slows; the body turns the opposite way to the faster pair.'},
      {t: 'A flight controller reads gyros and accelerometers hundreds of times a second to keep it level.', s: 'small'}]);
    how.position.set(-4.6, FY + 2.15, -6.12); group.add(how);
    const fly = FPX.panel(2.4, 1.5, [{t: 'Fly the camera drone', s: 'big', k: 0.85}, {t: 'Quest: left stick move, right stick turn + climb, B returns you here. Keyboard: WASD, Q/E, Space/C, Esc. Phone: joystick + buttons.', s: 'small', c: '#2a2410'}],
      {bg: '#FFD700', frame: '#7a5c12', center: true}); fly.position.set(4.6, FY + 2.0, -2.52); group.add(fly);
    const web = FPX.panel(2.4, 0.42, [{t: 'Visit h18defense.eu', s: 'sub', fit: true, c: '#111'}], {bg: '#9ffcff', frame: '#2a5a66', center: true}); web.position.set(4.6, FY + 1.0, -2.52); group.add(web);
    let btns = null, flying = false;
    function startFly() { if (flying || !FPX.drone) return; group.updateMatrixWorld(true); const p = new THREE.Vector3(0, FY + 1.6, 5); group.localToWorld(p);
      const wq = new THREE.Quaternion(); group.getWorldQuaternion(wq); const gy = new THREE.Euler().setFromQuaternion(wq, 'YXZ').y; flying = true; parked.visible = false;
      const c = new THREE.Vector3(0, 0, 0); group.localToWorld(c);
      FPX.drone.enter({x: p.x, y: p.y, z: p.z, yaw: gy + Math.PI, center: {x: c.x, z: c.z}, radius: opts.radius || 320, maxAlt: 120, groundAt: opts.groundAt || (() => c.y), onExit: () => { flying = false; parked.visible = true; }}); }
    function mountButtons() { if (btns) return btns; btns = FPX.buttons(group, [{x: 4.6, y: FY + 2.0, z: -2.5, w: 2.4, h: 1.5, onClick: startFly}, {x: 4.6, y: FY + 1.0, z: -2.5, w: 2.4, h: 0.42, onClick: () => FPX.link('https://h18defense.eu', 'h18defense.eu')},
      {x: 0, y: FY + 0.8, z: 5, w: 1.6, h: 1.0, onClick: startFly}]); return btns; }
    return {group, update, mountButtons, fly: startFly, get buttons() { return btns; },
      footprint: {x0: -R - 1, x1: R + 1, z0: -L - 0.5, z1: 12.5}, floorY: FY,
      walls: [{x0: -R - 0.3, x1: R + 0.3, z0: -L - 0.3, z1: -L + 0.15}, {x0: -R - 0.3, x1: -R + 0.9, z0: -L, z1: 0}, {x0: R - 0.9, x1: R + 0.3, z0: -L, z1: 0}],
      spawn: {x: 0, z: 14, yawDeg: 0},
      dispose() { if (btns) btns.dispose(); group.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } }); if (group.parent) group.parent.remove(group); }};
  }
  FPX.hangar = {build};
})();
