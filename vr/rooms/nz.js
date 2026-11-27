// World room: New Zealand - Milford Sound / Piopiotahi with Mitre Peak, a jetty, tree ferns and a kiwi.
// Anna with her white pit bull Ben, and Lisa: friendly stylized figures from Josh's description, not likenesses.
import {kit, skyAndLight, flat, water, panel, tag, navPost, person, dog, animate} from './common.js?v=1';
const ROOM = {
  env: {background: 0xb9d3e2, fog: [0xc6dbe6, 160, 1500], far: 2500},
  spawn: {x: 0, y: 0, z: 8, yaw: 0},
  ground: (x, z) => (z < -3 && Math.abs(x) < 1.6) ? 0.35 : 0,            // jetty deck
  blocked: (x, z) => (z < -3 && !(Math.abs(x) < 1.6 && z > -21)) || Math.abs(x) > 60 || z > 60,   // fiord water
  mount(sceneEl, rootEl, ctx) {
    const T = ctx.THREE, g = new T.Group(); rootEl.object3D.add(g);
    skyAndLight(T, g, 0x4f86c0, 0xdbe8ee, 0x4a6a40, [-50, 70, 60], 1.3);
    flat(T, g, 1600, 0x3f6b3a, -0.05);
    water(T, g, 280, 1400, 0, -700, 0x1f4f5e, 0.0);                       // the fiord
    const K = kit(T);
    K.box(120, 0.12, 64, 0x7a8a5a, [0, 0, 28]);                          // grassy shore
    K.box(120, 0.14, 4, 0x9a9488, [0, 0, -2]);                           // pebble beach
    // jetty
    K.box(3.2, 0.12, 18, 0x8a6a48, [0, 0.3, -12]); for (let z = -4; z > -22; z -= 3) for (const x of [-1.5, 1.5]) K.cyl(0.12, 0.12, 1.4, 0x5a4430, [x, -0.3, z], 6);
    // fiord walls: steep forested peaks both sides, snow on the tops; Mitre Peak on the left
    const peak = (x, z, r, h, snow) => { K.add(new T.ConeGeometry(r, h, 6, 1), 0x2f5a34, [x, h / 2 - 2, z], [0, x * 7, 0], [1, 1, 0.75]);
      if (snow) K.add(new T.ConeGeometry(r * 0.22, h * 0.22, 6, 1), 0xf4f7fa, [x, h * 0.89 - 2, z], [0, x * 7, 0], [1, 1, 0.75]); };
    for (let i = 0; i < 9; i++) { peak(-190 - (i % 2) * 60, -120 - i * 130, 130 + (i % 3) * 30, 260 + (i % 4) * 60, i % 2 === 0); peak(190 + (i % 2) * 60, -90 - i * 130, 120 + (i % 3) * 30, 240 + (i % 3) * 70, i % 3 === 1); }
    peak(-155, -380, 95, 560, true);                                       // Mitre Peak (stylized, not to scale)
    peak(0, -1500, 300, 520, true);                                        // far end, toward the Tasman Sea
    // Stirling Falls on the right cliff
    K.box(6, 150, 2, 0xeef6fa, [128, 75, -300], [0, -20, 8]); K.ico(12, 0xffffff, [124, 2, -296], [1.3, 0.4, 1]);
    // shore bush: tree ferns and beech
    const fern = (x, z, h) => { K.cyl(0.12, 0.16, h, 0x4a3a2a, [x, h / 2, z], 6); for (let k = 0; k < 8; k++) K.add(new T.ConeGeometry(0.25, 2.2, 3), 0x3e7a3a, [x, h, z], [0, k * 45, 72], [1, 1, 0.25]); };
    const beech = (x, z, h) => { K.cyl(0.18, 0.25, h * 0.5, 0x5a4636, [x, h * 0.25, z], 6); K.ico(h * 0.32, 0x2f5f30, [x, h * 0.65, z], [1.2, 0.9, 1.2]); K.ico(h * 0.22, 0x376a35, [x + h * 0.2, h * 0.8, z], null); };
    [[-6, 2, 3], [-9, 9, 3.5], [7, 1, 2.8], [10, 7, 3.4], [-14, 14, 3], [15, 15, 3.2]].forEach(p => fern(...p));
    [[-18, 4, 9], [20, 3, 10], [-26, 18, 11], [27, 20, 9], [-34, 6, 12], [36, 9, 10], [0, 40, 12]].forEach(p => beech(...p));
    // a kiwi poking about in the grass
    const kf = K.frame(-3.4, 0, 4.6, 40); K.sph(0.16, 0x6a4f35, [0, 0.2, 0], [1, 0.9, 1.25], 8, null, kf); K.sph(0.07, 0x6a4f35, [0, 0.27, 0.17], null, 6, null, kf);
    K.cyl(0.008, 0.012, 0.18, 0xd8c8a0, [0, 0.22, 0.3], 4, [70, 0, 0], kf); K.cyl(0.015, 0.015, 0.12, 0xd8c8a0, [-0.05, 0.05, 0], 4, null, kf); K.cyl(0.015, 0.015, 0.12, 0xd8c8a0, [0.05, 0.05, 0], 4, null, kf);
    // Anna (left) and Lisa (right), on the shore facing you
    person(K, K.frame(-1.4, 0, 1.6, 15), {skin: 0xf1cba8, hair: 0xf2d27a, hairStyle: 'bob', top: 0x4d7fc6, bottom: 0x4d7fc6, dress: true, shoes: 0xf4f0e8, h: 1.66});
    person(K, K.frame(1.5, 0, 1.4, -15), {skin: 0xf3cfb0, hair: 0xeccb70, hairStyle: 'pony', top: 0xc8343a, bottom: 0x3a5a8a, shoes: 0xffffff, h: 1.7});
    g.add(K.build({jitter: 0.08}));
    tag(T, g, 'Anna', [-1.4, 1.95, 1.6], 0); tag(T, g, 'Lisa', [1.5, 1.98, 1.4], 0);
    // Ben: trots in a little loop beside Anna, tail wagging
    const DK = kit(T); dog(DK, null, {s: 1.05}); const ben = new T.Group(); ben.add(DK.build({jitter: 0.04}));
    const TK = kit(T); TK.cyl(0.018, 0.03, 0.22, 0xf6f3ee, [0, 0.11, 0], 5); const tail = TK.build(); tail.position.set(0, 0.5, -0.33); tail.rotation.x = -0.9; ben.add(tail); g.add(ben);
    const btag = tag(T, g, 'Ben', [0, 0, 0], 0);
    let t = 0; animate(rootEl, dt => { t += dt; const a = t * 0.45, cx = -0.6, cz = 3.0, r = 0.9;
      ben.position.set(cx + Math.cos(a) * r * 1.4, Math.abs(Math.sin(t * 8)) * 0.02, cz + Math.sin(a) * r); ben.rotation.y = -a;   // heading along the loop
      tail.rotation.z = Math.sin(t * 14) * 0.6; btag.position.set(ben.position.x, 1.05, ben.position.z); });
    panel(T, g, ['Aotearoa New Zealand \u2014 Milford Sound / Piopiotahi',
      'Milford Sound runs about 15 km in from the Tasman Sea in Fiordland National Park, on the South Island. Carved by glaciers, it is really a fiord, not a sound.',
      'Mitre Peak rises about 1,690 m almost straight out of the water. Fiordland is part of the Te W\u0101hipounamu World Heritage Area (1990).',
      'The kiwi, a flightless bird found only in New Zealand, is the national emblem.',
      'Here: Anna and her white pit bull Ben, and Lisa (friendly figures, not portraits).'],
      {p: [4.2, 1.7, 4.6], ry: -50, w: 2.6, pxh: 760, fs: 32});
    navPost(rootEl, 'nz', [-3.8, 1.3, 5.2], 50);
  },
  unmount() {}
};
window.FP_ROOMS.register(window.FP_ROOMS.pending || 'nz', ROOM);
