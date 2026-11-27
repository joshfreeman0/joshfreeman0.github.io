// Stub guest room for testing FP_ROOMS (not linked anywhere). Red ground, a few rocks, a light, and a "Return to Earth" button.
const ROOM = {
  env: {background: 0xc77a52, fog: [0xc77a52, 40, 400]},
  spawn: {x: 0, y: 0, z: 6, yaw: 0},
  ground: () => 0,
  blocked: (x, z) => Math.hypot(x, z + 8) < 1.6,        // the rock ahead is solid
  mount(sceneEl, rootEl, ctx) {
    const T = ctx.THREE, g = new T.Group(); this.g = g;
    const ground = new T.Mesh(new T.CircleGeometry(300, 48), new T.MeshLambertMaterial({color: 0xa4552f})); ground.rotation.x = -Math.PI / 2; g.add(ground);
    const rock = new T.Mesh(new T.DodecahedronGeometry(1.5), new T.MeshLambertMaterial({color: 0x6b3b24})); rock.position.set(0, 1, -8); g.add(rock);
    g.add(new T.HemisphereLight(0xffd9b8, 0x5a2a18, 1.1)); const sun = new T.DirectionalLight(0xffffff, 1.2); sun.position.set(3, 10, 4); g.add(sun);
    rootEl.object3D.add(g);
    const b = document.createElement('a-plane'); b.setAttribute('class', 'btn'); b.setAttribute('width', 1.4); b.setAttribute('height', 0.35); b.setAttribute('position', '0 1.4 3');
    b.setAttribute('material', 'shader:flat;color:#FFD700'); const tx = document.createElement('a-text'); tx.setAttribute('value', 'Return to Earth'); tx.setAttribute('align', 'center'); tx.setAttribute('color', '#111'); tx.setAttribute('width', 3); b.appendChild(tx);
    b.addEventListener('click', () => ctx.leave({arrive: true})); rootEl.appendChild(b);
    window.FP_STUB = {leave: () => ctx.leave({arrive: true})};
  },
  unmount() { this.g = null; delete window.FP_STUB; }
};
window.FP_ROOMS.register(window.FP_ROOMS.pending || 'stub', ROOM);   // registers under whichever room name loaded it (?room_mars= test)
