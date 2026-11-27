// World room: Hawaiʻi - Waikīkī beach with Lēʻahi (Diamond Head), palms and surf. Mana plays ukulele (positional music, uke.js).
// Stylized low-poly; Mana is a friendly figure from Josh's description, not a likeness.
import {kit, skyAndLight, flat, water, panel, tag, button, navPost, person, animate} from './common.js?v=1';
import {music} from './uke.js?v=1';
let mus = null, onTick = null;
const ROOM = {
  env: {background: 0x9fd3ea, fog: [0xbfe3f0, 150, 1300], far: 2500},
  spawn: {x: 0, y: 0, z: 5.5, yaw: 0},
  ground: () => 0,
  blocked: (x, z) => x > 14 || Math.hypot(x - 2.4, z + 1.6) < 0.45,   // the sea (east side), Mana
  async mount(sceneEl, rootEl, ctx) {
    const T = ctx.THREE, g = new T.Group(); rootEl.object3D.add(g);
    skyAndLight(T, g, 0x3f8fd6, 0xd8f0f6, 0x8a7a50, [60, 90, 40], 1.5);
    flat(T, g, 1400, 0x5f8f4a, -0.05);                      // inland
    const K = kit(T);
    K.box(40, 0.1, 400, 0xead9a8, [-2, 0, -100]);          // Waikīkī sand
    water(T, g, 1400, 2400, 714, -200, 0x2a9fc4, 0.02);     // ocean (east)
    K.box(1.2, 0.04, 400, 0xffffff, [14.4, 0.06, -100]);    // surf line
    for (let i = 0; i < 7; i++) K.box(8 + i * 3, 0.15, 0.6, 0xe6f6fa, [40 + i * 18, 0.08, -60 - i * 37], [0, 20, 0]);   // breaking waves
    // Lēʻahi (Diamond Head): broad tuff cone with a crater rim and ridges
    const dh = K.frame(140, 0, -520, 0);
    K.add(new T.CylinderGeometry(190, 290, 120, 18, 1, true), 0x8d8a5a, [0, 60, 0], null, null, dh);
    K.add(new T.CircleGeometry(190, 18), 0x6f7a45, [0, 105, 0], [-90, 0, 0], null, dh);   // crater floor (a little lower than the rim)
    for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; K.add(new T.ConeGeometry(34, 150, 4), i % 3 ? 0x9a8f60 : 0x7d8650, [Math.cos(a) * 235, 40, Math.sin(a) * 235], [0, -a * 57.3, (i % 2 ? 22 : 30)], [1.2, 0.75, 0.6], dh); }
    K.add(new T.ConeGeometry(90, 150, 5), 0xa29466, [-150, 85, 120], [0, 20, 0], [1, 1, 0.7], dh);   // the high point on the rim (Lēʻahi summit)
    for (let i = 0; i < 9; i++) K.ico(30 + (i % 3) * 12, 0x4f7a3a, [-260 - i * 70, 25 + (i % 4) * 14, -420 + (i % 3) * 60], [1.6, 0.8, 1.2]);   // Koʻolau foothills
    // palms
    const palm = (x, z, h, lean) => { const f = K.frame(x, 0, z, lean * 37); let px = 0, py = 0;
      for (let i = 0; i < 6; i++) { const a = (lean * 0.12) * i; K.cyl(0.16 - i * 0.012, 0.19 - i * 0.012, h / 6 + 0.05, 0x8a6a48, [px, py + h / 12, 0], 6, [0, 0, -a * 57.3], f); px += Math.sin(a) * h / 6; py += Math.cos(a) * h / 6; }
      for (let k = 0; k < 7; k++) { const a = k / 7 * 360; K.add(new T.ConeGeometry(0.35, 2.6, 3), k % 2 ? 0x3f8f3a : 0x2f7a30, [px, py, 0], [0, a, 70], [1, 1, 0.25], f); }
      K.sph(0.14, 0x6b4a2a, [px + 0.15, py - 0.2, 0.1], null, 5, null, f); K.sph(0.14, 0x6b4a2a, [px - 0.12, py - 0.22, -0.1], null, 5, null, f); };
    [[-6, -2, 7, 1], [5.5, 3, 8, -1.2], [-9, 10, 6.5, 0.8], [7, -14, 9, -1], [-5, -24, 7.5, 1.1], [6, -38, 8, -0.8], [-8, -52, 7, 1], [4, -70, 8.5, -1], [-7, 24, 7, 0.7]].forEach(p => palm(...p));
    // beach things: surfboards, tiki torches, a log, mats
    [[-3.2, 4.2, 0xf2643a], [-3.9, 4.6, 0x2f9fd8], [-4.6, 5.0, 0xf7d04a]].forEach(([x, z, c]) => K.add(new T.CapsuleGeometry(0.28, 1.7, 2, 8), c, [x, 1.05, z], [0, 20, 6], [1, 1, 0.18]));
    for (const [x, z] of [[-1.2, -4], [4.6, -4]]) { K.cyl(0.04, 0.05, 1.8, 0x6b4a2a, [x, 0.9, z], 5); K.cyl(0.08, 0.06, 0.2, 0x3a2a1a, [x, 1.85, z], 6); }
    K.cyl(0.25, 0.25, 2.2, 0x7a5a3a, [2.4, 0.25, -0.2], 8, [0, 0, 90]);            // driftwood log
    K.box(1.6, 0.02, 0.9, 0xf06a8a, [-1.8, 0.07, 1.5], [0, 15, 0]); K.box(1.6, 0.02, 0.9, 0x3ab0a8, [-0.6, 0.07, 2.4], [0, -10, 0]);
    // hotels far along the beach (Waikīkī skyline), behind the sand
    for (let i = 0; i < 14; i++) K.box(14 + (i % 3) * 5, 20 + (i * 7 % 26), 12, i % 2 ? 0xf2efe6 : 0xe9dcc8, [-38 - (i % 2) * 16, 10 + (i * 7 % 26) / 2, -120 - i * 22]);
    // Mana: standing on the sand facing you, ukulele in hand, plumeria lei
    const MX = 2.4, MZ = -1.6, mf = K.frame(MX, 0, MZ, -10);
    person(K, mf, {skin: 0x9a6440, hair: 0x18120e, hairStyle: 'short', top: 0xd8343a, bottom: 0xe8e2d0, shoes: 0x6b4a2a, h: 1.8, male: true, noRightArm: true, noLeftArm: true});
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; K.sph(0.035, i % 2 ? 0xfff3c0 : 0xffffff, [Math.cos(a) * 0.16, 1.5, Math.sin(a) * 0.11 + 0.02], null, 4, null, mf); }   // lei
    for (let i = 0; i < 6; i++) K.sph(0.03, 0xffffff, [-0.12 + i * 0.05, 1.15 + (i % 2) * 0.12, 0.2], null, 4, null, mf);   // hibiscus print dots
    // left arm holding the neck (static), ukulele body
    K.cyl(0.045, 0.04, 0.32, 0x9a6440, [-0.26, 1.27, 0.07], 6, [-40, 0, -20], mf); K.cyl(0.04, 0.036, 0.3, 0x9a6440, [-0.25, 1.17, 0.27], 6, [-80, 30, 0], mf);
    const uk = K.frame(MX, 0, MZ, -10);
    K.add(new T.CylinderGeometry(0.13, 0.13, 0.07, 12), 0xb5763a, [0.04, 1.1, 0.24], [90, 0, 0], null, uk);
    K.add(new T.CylinderGeometry(0.105, 0.105, 0.07, 12), 0xb5763a, [-0.1, 1.16, 0.24], [90, 0, 0], null, uk);
    K.sph(0.035, 0x2a1a10, [-0.02, 1.13, 0.28], null, 6, null, uk);
    K.box(0.32, 0.035, 0.03, 0x5a3a20, [-0.33, 1.23, 0.25], [0, 0, 18], uk);
    g.add(K.build({jitter: 0.08}));
    // strumming right arm (animated)
    const AK = kit(T), arm = new T.Group(); arm.position.set(0.25, 1.38, 0.02);
    AK.cyl(0.045, 0.04, 0.34, 0x9a6440, [0, -0.15, 0.06], 6, [-35, 0, 10]); AK.cyl(0.04, 0.035, 0.28, 0x9a6440, [-0.06, -0.3, 0.2], 6, [-95, -40, 0]); AK.sph(0.045, 0x9a6440, [-0.15, -0.32, 0.3]);
    AK.sph(0.07, 0xd8343a, [0, 0, 0], null, 6); arm.add(AK.build());
    const manaG = new T.Group(); manaG.position.set(MX, 0, MZ); manaG.rotation.y = -10 * Math.PI / 180; manaG.add(arm); g.add(manaG);
    tag(T, g, 'Mana', [MX, 2.05, MZ], 0);
    // music, positional from Mana's ukulele
    const anchor = new T.Object3D(); anchor.position.set(-0.05, 1.15, 0.3); manaG.add(anchor);
    mus = music(ctx, anchor); let next = 0; mus.onEnd = i => { next = 1 - i; mus.play(next); }; mus.play(0);
    const nameOf = i => i === 0 ? 'Aloha \u02bbOe' : 'Hawai\u02bbi Pono\u02bb\u012b';
    button(rootEl, "Mana: play Aloha 'Oe", [-0.9, 1.15, 1.6], 0, '#ffd27a', () => { mus.play(0); ctx.toast('Mana is playing Aloha \u02bbOe'); }, 1.7);
    button(rootEl, "Play Hawai'i Pono'i", [-0.9, 0.8, 1.6], 0, '#ffd27a', () => { mus.play(1); ctx.toast('Mana is playing Hawai\u02bbi Pono\u02bb\u012b'); }, 1.7);
    button(rootEl, 'Pause music', [-0.9, 0.45, 1.6], 0, '#e8e2d0', () => { mus.stop(); ctx.toast('Music paused'); }, 1.7);
    let t = 0; onTick = (dt) => { t += dt; arm.rotation.x = mus.song >= 0 ? Math.sin(t * 9) * 0.16 : 0; manaG.position.y = mus.song >= 0 ? Math.abs(Math.sin(t * 3.1)) * 0.012 : 0; };
    // panels
    panel(T, g, ['Hawai\u02bbi \u2014 Waik\u012bk\u012b and L\u0113\u02bbahi',
      'L\u0113\u02bbahi (Diamond Head) is a volcanic tuff cone at the east end of Waik\u012bk\u012b on O\u02bbahu. Its summit rises to 761 ft (232 m) above the sea.',
      'Hawai\u02bbi became the 50th U.S. state on August 21, 1959. Its capital, Honolulu, is on O\u02bbahu.',
      'Aloha \u02bbOe was written by Queen Lili\u02bbuokalani, the last monarch of the Hawaiian Kingdom, in 1878.',
      'Hawai\u02bbi Pono\u02bb\u012b: words by King Kal\u0101kaua and music by Henri Berger, bandmaster of the Royal Hawaiian Band (1874). It is the state song.'],
      {p: [4.2, 1.7, 3.2], ry: -50, w: 2.6, pxh: 760, fs: 32});
    panel(T, g, ['Music credits', 'Aloha \u02bbOe (Lili\u02bbuokalani, 1878): public domain; notes from a public-domain MIDI on Wikimedia Commons, played here on a synthesized ukulele.',
      'Hawai\u02bbi Pono\u02bb\u012b (Berger / Kal\u0101kaua, 1874): recording by nationalanthems.info via Wikimedia Commons, CC BY-SA 3.0.',
      'Mana is a friendly drawn figure, not a portrait.'], {p: [5.6, 0.9, 5.6], ry: -55, w: 1.4, pxh: 640, fs: 30, post: true});
    navPost(rootEl, 'hawaii', [-3.4, 1.3, 1.4], 60);
    animate(rootEl, dt => onTick && onTick(dt));
  },
  unmount() { if (mus) mus.dispose(); mus = null; onTick = null; }
};
window.FP_ROOMS.register(window.FP_ROOMS.pending || 'hawaii', ROOM);
