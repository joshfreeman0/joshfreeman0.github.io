// World room: Australia - Sydney Harbour with the Opera House and the Harbour Bridge, seen from the foreshore by the Botanic Garden.
import {kit, skyAndLight, flat, water, panel, navPost, animate} from './common.js?v=1';
const ROOM = {
  env: {background: 0xa8d0ec, fog: [0xc4def0, 200, 1700], far: 2500},
  spawn: {x: 0, y: 0, z: 6, yaw: 0},
  ground: () => 0,
  blocked: (x, z) => z < -4 || Math.abs(x) > 80 || z > 70,                 // harbour
  mount(sceneEl, rootEl, ctx) {
    const T = ctx.THREE, g = new T.Group(); rootEl.object3D.add(g);
    skyAndLight(T, g, 0x2f7fd0, 0xd6ecf7, 0x6a7a50, [80, 90, 20], 1.5);
    flat(T, g, 1600, 0x557a45, -0.06);
    water(T, g, 2400, 1400, 0, -704, 0x1d6f9a, 0.0);
    const K = kit(T);
    K.box(160, 0.12, 74, 0x6f9a4f, [0, 0, 33]);                           // lawn
    K.box(160, 0.5, 3, 0xcfc4a8, [0, 0.1, -2.5]); K.box(160, 0.1, 3, 0xb8ad94, [0, 0.12, 0.5]);   // sea wall + promenade
    // Opera House on Bennelong Point (stylized, about half size): podium + white shells
    const oh = K.frame(-30, 0, -150, -25);
    K.box(70, 7, 130, 0xc9a07a, [0, 3.5, 0], null, oh); K.box(40, 0.4, 20, 0xc9a07a, [0, 7.2, 72], null, oh);   // podium, steps
    for (let i = 0; i < 12; i++) K.box(40 - i * 1.5, 0.5, 1.2, 0xbf9670, [0, 0.25 + i * 0.6, 70 - i * 1.2], null, oh);
    const shell = (x, z, r, h, tilt, flip) => K.add(new T.SphereGeometry(1, 14, 8, 0, Math.PI, 0, Math.PI / 2), 0xf4f1e6, [x, 7, z], [0, flip ? 180 : 0, 0].map((v, i) => i === 0 ? tilt : v), [r * 0.55, h, r], oh);
    [[-15, 40, 18, 30, -8], [-15, 18, 16, 24, -10], [-15, 0, 13, 18, -12], [-15, -14, 10, 13, -12]].forEach(([x, z, r, h, tl]) => { shell(x, z, r, h, tl, false); shell(x, z - r * 0.55, r * 0.9, h * 0.8, -tl, true); });
    [[15, 34, 15, 25, -8], [15, 15, 13, 20, -10], [15, -1, 11, 15, -12], [15, -14, 8, 11, -12]].forEach(([x, z, r, h, tl]) => { shell(x, z, r, h, tl, false); shell(x, z - r * 0.55, r * 0.9, h * 0.8, -tl, true); });
    shell(0, -50, 9, 12, -10, false); shell(0, -54, 8, 9, 10, true);      // the restaurant shells
    // Harbour Bridge: steel arch, deck and four granite pylons (about half size)
    const hb = K.frame(-330, 0, -330, 35), span = 250, rise = 70, deckY = 30;
    for (let i = 0; i < 40; i++) { const u0 = i / 40, u1 = (i + 1) / 40, x0 = (u0 - 0.5) * span, x1 = (u1 - 0.5) * span, y0 = deckY - 22 + rise * 4 * u0 * (1 - u0), y1 = deckY - 22 + rise * 4 * u1 * (1 - u1);
      const L = Math.hypot(x1 - x0, y1 - y0), a = Math.atan2(y1 - y0, x1 - x0) * 57.3;
      for (const zz of [-7, 7]) { K.box(L + 0.3, 3.2, 1.6, 0x7d8790, [(x0 + x1) / 2, (y0 + y1) / 2, zz], [0, 0, a], hb); K.box(L + 0.3, 1.6, 1.4, 0x7d8790, [(x0 + x1) / 2, (y0 + y1) / 2 - 9 + 9 * Math.abs(u0 - 0.5) * 2, zz], [0, 0, a * 0.8], hb); }
      if (i % 3 === 0 && Math.abs(u0 - 0.5) < 0.42) { const yy = deckY - 22 + rise * 4 * u0 * (1 - u0); if (yy > deckY) K.box(0.8, yy - deckY, 0.8, 0x6d7780, [x0, deckY + (yy - deckY) / 2, -7], null, hb), K.box(0.8, yy - deckY, 0.8, 0x6d7780, [x0, deckY + (yy - deckY) / 2, 7], null, hb); } }
    K.box(span + 120, 2.5, 18, 0x6d7780, [0, deckY, 0], null, hb);
    for (const sx of [-1, 1]) for (const dx of [0, 22]) K.box(14, 52, 24, 0xd8cdb0, [sx * (span / 2 + 6 + dx), 26, 0], null, hb);
    // north shore + city skyline across the water
    for (let i = 0; i < 26; i++) { const x = -700 + i * 50, h = 20 + (i * 37 % 70); K.box(30, h, 26, i % 3 ? 0xe2e0da : 0xb9c6cf, [x, h / 2, -620 - (i % 2) * 40]); }
    for (let i = 0; i < 12; i++) K.ico(40 + (i % 3) * 15, 0x4f7a42, [-700 + i * 120, 10, -760], [1.8, 0.5, 1.2]);
    // gum trees and a kangaroo on the lawn
    const gum = (x, z, h) => { K.cyl(0.25, 0.4, h * 0.6, 0xd9cfc0, [x, h * 0.3, z], 6, [0, 0, 4]); K.ico(h * 0.25, 0x6f8a63, [x + 0.6, h * 0.7, z], [1.3, 0.7, 1.1]); K.ico(h * 0.2, 0x7a9a6a, [x - 1, h * 0.85, z + 0.5], [1.2, 0.7, 1]); };
    [[-12, 6, 11], [13, 8, 12], [-22, 20, 13], [24, 18, 10], [-6, 30, 12], [8, 40, 14]].forEach(p => gum(...p));
    const kf = K.frame(3.4, 0, 2.2, -30), kc = 0xb07a4a;
    K.sph(0.3, kc, [0, 0.7, 0], [0.85, 1.35, 0.95], 8, [-15, 0, 0], kf); K.sph(0.25, kc, [0, 0.34, -0.05], [1.2, 1, 1.3], 8, null, kf); K.sph(0.13, kc, [0, 1.12, 0.1], [0.9, 1, 1.3], 8, null, kf); K.sph(0.08, 0xd8b088, [0, 0.72, 0.22], [1, 1.6, 0.6], 6, null, kf);
    K.cone(0.04, 0.17, kc, [-0.06, 1.28, 0.08], 4, null, kf); K.cone(0.04, 0.17, kc, [0.06, 1.28, 0.08], 4, null, kf);
    K.cyl(0.03, 0.09, 0.8, kc, [0, 0.3, -0.45], 6, [-65, 0, 0], kf); K.box(0.1, 0.07, 0.4, kc, [-0.12, 0.04, 0.12], null, kf); K.box(0.1, 0.07, 0.4, kc, [0.12, 0.04, 0.12], null, kf);
    K.sph(0.016, 0x221a14, [-0.05, 1.15, 0.27], null, 4, null, kf); K.sph(0.016, 0x221a14, [0.05, 1.15, 0.27], null, 4, null, kf);
    g.add(K.build({jitter: 0.07}));
    // a ferry crossing the harbour
    const FK = kit(T); FK.box(22, 3, 6, 0x2f7a3a, [0, 1.5, 0]); FK.box(16, 3, 5, 0xf2e9c8, [0, 4.5, 0]); FK.box(3, 3, 1, 0xf2e9c8, [0, 7, 0]); const ferry = FK.build(); g.add(ferry);
    let t = 0; animate(rootEl, dt => { t += dt; const u = (t * 0.012) % 1; ferry.position.set(-400 + u * 800, 0, -260); });
    panel(T, g, ['Australia \u2014 Sydney Harbour',
      'The Sydney Opera House on Bennelong Point was designed by Danish architect J\u00f8rn Utzon and opened by Queen Elizabeth II in 1973. It became a UNESCO World Heritage Site in 2007.',
      'The Sydney Harbour Bridge, the steel arch locals call "the Coathanger", opened in 1932.',
      'Canberra is the capital; Sydney is the largest city.'],
      {p: [4.2, 1.7, 3.6], ry: -50, w: 2.6, pxh: 700, fs: 32});
    navPost(rootEl, 'australia', [-3.8, 1.3, 4.2], 50);
  },
  unmount() {}
};
window.FP_ROOMS.register(window.FP_ROOMS.pending || 'australia', ROOM);
