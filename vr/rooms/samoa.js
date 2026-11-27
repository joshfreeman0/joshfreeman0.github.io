// World room: Samoa - a traditional open-sided fale on a white-sand beach on Upolu, lagoon, reef, palms, a va'a (outrigger canoe)
// and green volcanic hills.
import {kit, skyAndLight, flat, water, panel, navPost, animate} from './common.js?v=1';
const FX = 0, FZ = -9, FR = 5.2;
const ROOM = {
  env: {background: 0xa6dcef, fog: [0xc2e8f2, 160, 1400], far: 2500},
  spawn: {x: 0, y: 0, z: 7, yaw: 0},
  ground: (x, z) => Math.hypot((x - FX) / 1.35, z - FZ) < FR ? 0.45 : 0,   // fale floor platform
  blocked: (x, z) => x > 16 || Math.abs(x) > 70 || Math.abs(z) > 70,       // lagoon on the east
  mount(sceneEl, rootEl, ctx) {
    const T = ctx.THREE, g = new T.Group(); rootEl.object3D.add(g);
    skyAndLight(T, g, 0x2c8fd8, 0xdaf2f8, 0x6a8a50, [70, 90, -10], 1.5);
    flat(T, g, 1600, 0x3f7a3a, -0.06);
    water(T, g, 1400, 1600, 716, 0, 0x37c3c9, 0.0);   // lagoon
    water(T, g, 1400, 1600, 1100, 0, 0x1d6ea8, 0.03); // open ocean beyond the reef
    const K = kit(T);
    K.box(46, 0.1, 160, 0xf3ead2, [-7, 0, 0]);                              // white sand
    K.box(3, 0.2, 400, 0xffffff, [384, 0.1, 0]);                            // surf on the reef
    // the fale: oval raised floor, posts, domed thatched roof
    const f = K.frame(FX, 0, FZ, 0);
    K.add(new T.CylinderGeometry(FR, FR + 0.2, 0.45, 20), 0xa89a86, [0, 0.22, 0], null, [1.35, 1, 1], f);   // stone/pebble platform
    K.add(new T.CylinderGeometry(FR - 0.2, FR - 0.2, 0.05, 20), 0xd9c9a0, [0, 0.46, 0], null, [1.35, 1, 1], f);   // fine mats
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; K.cyl(0.14, 0.16, 3.0, 0x6b4a2e, [Math.cos(a) * (FR - 0.4) * 1.35, 1.95, Math.sin(a) * (FR - 0.4)], 6, null, f); }
    K.cyl(0.25, 0.28, 5.4, 0x5a3e26, [0, 3.1, 0], 8, null, f); K.cyl(0.25, 0.28, 5.4, 0x5a3e26, [2.2, 3.1, 0], 8, null, f); K.cyl(0.25, 0.28, 5.4, 0x5a3e26, [-2.2, 3.1, 0], 8, null, f);   // centre posts
    K.add(new T.SphereGeometry(FR + 0.7, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0xb89a5a, [0, 3.3, 0], null, [1.38, 0.62, 1], f);   // thatch dome
    K.add(new T.CylinderGeometry(FR + 0.75, FR + 0.95, 0.35, 18, 1, true), 0x9a7a40, [0, 3.35, 0], null, [1.38, 1, 1], f);         // eave
    K.box(1.6, 0.06, 1.0, 0xe0c890, [0.5, 0.5, 0.8], [0, 20, 0], f); K.cyl(0.35, 0.3, 0.25, 0x7a5030, [-1.2, 0.6, 0.6], 10, null, f);   // mat + kava bowl (tanoa)
    // palms
    const palm = (x, z, h, lean, ry) => { const fr = K.frame(x, 0, z, ry || 0); let px = 0, py = 0;
      for (let i = 0; i < 6; i++) { const a = lean * 0.12 * i; K.cyl(0.17 - i * 0.012, 0.2 - i * 0.012, h / 6 + 0.05, 0x8a6a48, [px, py + h / 12, 0], 6, [0, 0, -a * 57.3], fr); px += Math.sin(a) * h / 6; py += Math.cos(a) * h / 6; }
      for (let k = 0; k < 7; k++) K.add(new T.ConeGeometry(0.35, 2.8, 3), k % 2 ? 0x3f8f3a : 0x2f7a30, [px, py, 0], [0, k / 7 * 360, 70], [1, 1, 0.25], fr);
      K.sph(0.15, 0x5a7a2a, [px + 0.15, py - 0.2, 0.1], null, 5, null, fr); };
    [[9, -2, 8, 1, 0], [10, 10, 7, 1.2, 20], [-12, -16, 9, -0.6, 180], [-14, 2, 7.5, 0.8, 40], [8, -22, 8.5, 1, -20], [-8, 18, 7, -0.8, 150], [-20, -30, 9, 0.5, 90], [12, 26, 8, 1, 10]].forEach(p => palm(...p));
    // va'a (outrigger canoe) on the sand by the water
    const v = K.frame(11, 0, 3, 75); K.add(new T.CapsuleGeometry(0.35, 5.2, 2, 8), 0x7a4a26, [0, 0.3, 0], [0, 0, 90], [1, 1, 0.75], v);
    K.add(new T.CapsuleGeometry(0.12, 3.6, 2, 6), 0x9a7a50, [0, 0.2, 1.6], [0, 0, 90], null, v); K.box(0.08, 0.08, 1.8, 0x5a3a20, [-1, 0.4, 0.8], null, v); K.box(0.08, 0.08, 1.8, 0x5a3a20, [1, 0.4, 0.8], null, v);
    K.box(0.08, 0.03, 1.4, 0x8a6a40, [0.6, 0.65, -0.25], [0, 30, 0], v);   // paddle
    // volcanic hills of Upolu behind
    for (let i = 0; i < 10; i++) K.ico(80 + (i % 3) * 40, i % 2 ? 0x2f6a30 : 0x3a7a38, [-260 - (i % 3) * 90, 0, -500 + i * 110], [1.6, 0.85, 1.2]);
    K.ico(160, 0x2a5f2c, [-420, 20, -120], [1.5, 1.2, 1.3]);
    // hibiscus bushes
    for (const [x, z] of [[-5, -2], [5, -3], [-6, -15], [6, -16]]) { K.ico(0.8, 0x2f6a2c, [x, 0.7, z], [1.2, 0.9, 1]); for (let k = 0; k < 5; k++) K.sph(0.12, 0xe8344a, [x + Math.cos(k * 1.3) * 0.75, 0.8 + (k % 2) * 0.3, z + Math.sin(k * 1.3) * 0.6], null, 5); }
    g.add(K.build({jitter: 0.08}));
    // a frigatebird circling
    const BK = kit(T); BK.box(1.8, 0.05, 0.35, 0x2a2a30, [0, 0, 0], [0, 0, 0]); BK.sph(0.12, 0x2a2a30, [0, 0, 0.1], [1, 1, 2]); const bird = BK.build(); g.add(bird);
    let t = 0; animate(rootEl, dt => { t += dt; bird.position.set(20 + Math.cos(t * 0.2) * 40, 35 + Math.sin(t * 0.5) * 3, -20 + Math.sin(t * 0.2) * 40); bird.rotation.y = -t * 0.2; bird.rotation.z = Math.sin(t * 0.7) * 0.15; });
    panel(T, g, ['Samoa \u2014 a fale on Upolu',
      'The fale is the traditional Samoan house: a domed thatched roof on wooden posts, open on all sides to the sea breeze, on a raised floor of stones and mats.',
      'Samoa\u2019s capital, Apia, is on Upolu. Samoa (then Western Samoa) became independent from New Zealand on 1 January 1962.',
      'Fa\u02bba S\u0101moa, "the Samoan way", centres on family (\u02bbaiga), respect and the chiefs (matai).'],
      {p: [4.2, 1.7, 4.2], ry: -50, w: 2.6, pxh: 720, fs: 32});
    navPost(rootEl, 'samoa', [-3.8, 1.3, 4.8], 50);
  },
  unmount() {}
};
window.FP_ROOMS.register(window.FP_ROOMS.pending || 'samoa', ROOM);
