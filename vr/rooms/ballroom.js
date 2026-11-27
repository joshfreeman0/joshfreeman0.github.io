/* Grand Ballroom (Nov 27 2026): a Mayflower-Hotel-style grand ballroom, in the spirit of the National Debutante Cotillion and
   Thanksgiving Ball in Washington, D.C. Gilded balconies, crystal chandeliers, a polished parquet floor, an orchestra on a
   proscenium stage, a U.S. Coast Guard dress-blues honor guard with a sword arch at the entrance, and waltzing couples.
   Music: "On the Beautiful Blue Danube" (Johann Strauss II, 1866-67, public domain), synthesized live with WebAudio from our own
   note list - no recording, no downloaded asset. Everything else is procedural (no files fetched).
   Shared FP_ROOMS module (contract: vr/ROOMS.md): mount(sceneEl, rootEl, ctx) / unmount(), no scene, renderer or XR session of its
   own, so Fowling Pond loads it with ?room=ballroom and other worlds (Red Planet Lounge) can mount the same file.
   Budget: ~25 draw calls, ~40k triangles, three 512 px canvas textures; lite (iPhone 12) drops the point lights and half the dancers. */
const W = 14, ZS = -22, ZE = 12, H = 12, BAL_Y = 5, STAGE_Z = -17.5, STAGE_H = 0.9;   // half-width, stage end, entrance end, ceiling
const FLOOR_C = -4;                                                                       // dance-floor centre (z)
let S = null;                                                                             // live state while mounted

function geoKit(T) {
  // tiny merge helper: collect primitives (each with its own colour) into one vertex-coloured BufferGeometry
  const parts = [];
  const m4 = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), v = new T.Vector3(), sc = new T.Vector3();
  function add(g, color, x, y, z, rx, ry, rz, sx, sy, sz) {
    e.set(rx || 0, ry || 0, rz || 0); q.setFromEuler(e); v.set(x || 0, y || 0, z || 0); sc.set(sx || 1, sy || sx || 1, sz || sx || 1);
    m4.compose(v, q, sc); const n = g.index ? g.toNonIndexed() : g; if (n !== g) g.dispose(); n.applyMatrix4(m4); parts.push([n, new T.Color(color)]);
  }
  function addM(g, color, mat) { const n = g.index ? g.toNonIndexed() : g; if (n !== g) g.dispose(); n.applyMatrix4(mat); parts.push([n, new T.Color(color)]); }
  function build() {
    let cnt = 0; parts.forEach(([g]) => { cnt += g.attributes.position.count; });
    const pos = new Float32Array(cnt * 3), nor = new Float32Array(cnt * 3), col = new Float32Array(cnt * 3); let o = 0;
    parts.forEach(([g, c]) => { const p = g.attributes.position.array, nn = g.attributes.normal.array; pos.set(p, o * 3); nor.set(nn, o * 3);
      for (let i = 0; i < g.attributes.position.count; i++) { col[(o + i) * 3] = c.r; col[(o + i) * 3 + 1] = c.g; col[(o + i) * 3 + 2] = c.b; }
      o += g.attributes.position.count; g.dispose(); });
    parts.length = 0; const out = new T.BufferGeometry();
    out.setAttribute('position', new T.BufferAttribute(pos, 3)); out.setAttribute('normal', new T.BufferAttribute(nor, 3)); out.setAttribute('color', new T.BufferAttribute(col, 3));
    out.computeBoundingSphere(); return out;
  }
  return {add, addM, build, get n() { return parts.length; }};
}

function canvasTex(T, w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace || t.colorSpace; t.anisotropy = 4; return t; }

const GOLD = 0xd4a93c, GOLD_D = 0xa47a22, CREAM = 0xf3e6cc, IVORY = 0xfaf3e3, MARBLE = 0xc9b48e, VELVET = 0x7a1020, NAVY_CG = 0x223864,
  WHITE = 0xffffff, BLACK = 0x14141a, SKIN = [0xf1c9a5, 0xd9a47a, 0xa86f45, 0x7a4a2c, 0xe8b894];

/* ---------------- people (low-poly, vertex-coloured, built facing -z at the origin) ---------------- */
function person(T, K, kind, skin, ox, oz, ry, extra, oy) {
  // kind: 'guard' (USCG dress blues, white cap, white gloves, sword), 'escortCG', 'escortTails', 'deb' (white gown), 'musician', 'conductor'
  const M = new T.Matrix4().makeRotationY(ry || 0).setPosition(ox, oy || 0, oz), L = new T.Matrix4();
  const put = (g, c, x, y, z, rx, ryy, rz, sx, sy, sz) => { L.compose(new T.Vector3(x, y, z), new T.Quaternion().setFromEuler(new T.Euler(rx || 0, ryy || 0, rz || 0)), new T.Vector3(sx || 1, sy || sx || 1, sz || sx || 1)); K.addM(g, c, M.clone().multiply(L)); };
  const deb = kind === 'deb', seated = kind === 'musician';
  const coat = kind === 'escortTails' || kind === 'musician' || kind === 'conductor' ? BLACK : NAVY_CG;
  const by = seated ? -0.42 : 0;
  if (deb) {
    put(new T.ConeGeometry(0.55, 1.05, 10, 1, true), IVORY, 0, 0.52, 0);                    // ball gown skirt
    put(new T.CylinderGeometry(0.55, 0.55, 0.02, 10), IVORY, 0, 0.01, 0);
    put(new T.CylinderGeometry(0.13, 0.17, 0.42, 8), IVORY, 0, 1.22, 0);                     // bodice
    put(new T.SphereGeometry(0.075, 6, 4), skin, 0, 1.47, 0, 0, 0, 0, 1, 1.4, 1);              // neck/shoulders
    put(new T.CylinderGeometry(0.035, 0.03, 0.55, 5), IVORY, 0.19, 1.2, -0.12, -0.9, 0, 0.35);   // long white gloves
    put(new T.CylinderGeometry(0.035, 0.03, 0.55, 5), IVORY, -0.2, 1.28, -0.1, -0.4, 0, -1.1);
    put(new T.SphereGeometry(0.11, 8, 6), skin, 0, 1.62, 0);                                  // head
    put(new T.SphereGeometry(0.12, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.6), extra || 0x4a2c18, 0, 1.64, 0.015);   // hair
    put(new T.SphereGeometry(0.06, 6, 4), extra || 0x4a2c18, 0, 1.68, 0.11);                  // chignon
    return;
  }
  // legs / trousers
  if (seated) { put(new T.BoxGeometry(0.34, 0.14, 0.45), coat, 0, 0.5, -0.12); put(new T.BoxGeometry(0.3, 0.45, 0.12), coat, 0, 0.24, -0.32); }
  else { put(new T.CylinderGeometry(0.07, 0.06, 0.88, 6), coat, 0.1, 0.46, 0); put(new T.CylinderGeometry(0.07, 0.06, 0.88, 6), coat, -0.1, 0.46, 0);
    put(new T.BoxGeometry(0.1, 0.06, 0.24), BLACK, 0.1, 0.03, -0.05); put(new T.BoxGeometry(0.1, 0.06, 0.24), BLACK, -0.1, 0.03, -0.05); }
  // tunic / tailcoat
  put(new T.CylinderGeometry(0.2, 0.16, 0.62, 8), coat, 0, 1.2 + by, 0);
  put(new T.BoxGeometry(0.1, 0.34, 0.02), WHITE, 0, 1.28 + by, -0.17);                         // white shirt front
  if (kind === 'escortTails' || kind === 'conductor') put(new T.BoxGeometry(0.3, 0.5, 0.04), BLACK, 0, 0.8, 0.13, 0.15);   // tails
  if (coat === NAVY_CG) {                                                                     // dress-blue touches: gold buttons, sleeve lace, shoulder boards
    for (let i = 0; i < 4; i++) put(new T.SphereGeometry(0.018, 4, 3), GOLD, 0.06, 1.05 + i * 0.1 + by, -0.18);
    put(new T.BoxGeometry(0.12, 0.03, 0.2), GOLD, 0.19, 1.5 + by, 0); put(new T.BoxGeometry(0.12, 0.03, 0.2), GOLD, -0.19, 1.5 + by, 0);
  }
  // arms
  const armUp = kind === 'escortCG' || kind === 'escortTails';
  if (kind === 'guard') {
    put(new T.CylinderGeometry(0.05, 0.045, 0.6, 5), coat, -0.24, 1.18, 0);                       // left arm at side
    put(new T.CylinderGeometry(0.05, 0.045, 0.6, 5), coat, 0.22, 1.42, -0.18, -1.15, 0, 0.25);     // right arm raised forward (sword arch)
    put(new T.SphereGeometry(0.045, 5, 4), WHITE, -0.24, 0.86, 0); put(new T.SphereGeometry(0.045, 5, 4), WHITE, 0.26, 1.62, -0.42);   // white gloves
    put(new T.BoxGeometry(0.1, 0.02, 0.03), GOLD, 0.26, 1.66, -0.44);                               // hilt guard
    put(new T.BoxGeometry(0.018, 0.86, 0.035), 0xdfe6ee, 0.26, 2.02, -0.86, -0.85, 0, 0);           // blade, angled up and in
  } else if (armUp) {
    put(new T.CylinderGeometry(0.05, 0.045, 0.55, 5), coat, 0.24, 1.25, -0.15, -0.9, 0, -0.3);      // right arm round the partner
    put(new T.CylinderGeometry(0.05, 0.045, 0.55, 5), coat, -0.27, 1.38, -0.12, -0.3, 0, 1.1);      // left arm out, holding her hand
    put(new T.SphereGeometry(0.045, 5, 4), kind === 'escortCG' ? WHITE : skin, -0.5, 1.5, -0.2);
  } else if (seated) {
    put(new T.CylinderGeometry(0.05, 0.045, 0.5, 5), coat, 0.2, 0.95, -0.2, -1.1); put(new T.CylinderGeometry(0.05, 0.045, 0.5, 5), coat, -0.2, 0.95, -0.2, -1.1);
  } else {   // conductor, baton raised
    put(new T.CylinderGeometry(0.05, 0.045, 0.55, 5), coat, 0.25, 1.5, -0.12, -0.6, 0, 0.7); put(new T.CylinderGeometry(0.05, 0.045, 0.55, 5), coat, -0.25, 1.45, -0.12, -0.5, 0, -0.6);
    put(new T.CylinderGeometry(0.006, 0.006, 0.4, 3), WHITE, 0.4, 1.85, -0.3, -0.5, 0, 0.5);
  }
  put(new T.CylinderGeometry(0.06, 0.07, 0.1, 6), skin, 0, 1.55 + by, 0);                     // neck
  put(new T.SphereGeometry(0.11, 8, 6), skin, 0, 1.68 + by, 0);                               // head
  if (coat === NAVY_CG) {                                                                     // white combination cap, black visor, gold chin strap
    put(new T.CylinderGeometry(0.15, 0.12, 0.08, 10), WHITE, 0, 1.82 + by, 0); put(new T.CylinderGeometry(0.12, 0.12, 0.03, 10), BLACK, 0, 1.77 + by, 0);
    put(new T.BoxGeometry(0.14, 0.015, 0.08), BLACK, 0, 1.76 + by, -0.11, 0.3); put(new T.BoxGeometry(0.06, 0.04, 0.01), GOLD, 0, 1.8 + by, -0.15);
  } else put(new T.SphereGeometry(0.115, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.5), extra || 0x2a1a10, 0, 1.7 + by, 0.01);   // hair
}

/* ---------------- music: synthesized Blue Danube (public domain composition) ---------------- */
// one bar per string, 3 beats per bar; '.' rest, '-' hold the previous note. Chord per bar for the oom-pah-pah accompaniment.
const MEL = ['D4 D4 F#4', 'A4 - -', '. A5 A5', '. F#5 F#5', 'D4 D4 F#4', 'A4 - -', '. A5 A5', '. G5 G5',
  'C#4 C#4 E4', 'B4 - -', '. B5 B5', '. G5 G5', 'C#4 C#4 E4', 'B4 - -', '. B5 B5', '. F#5 F#5',
  'D4 D4 F#4', 'A4 D5 -', '. D6 D6', '. A5 A5', 'D4 D4 F#4', 'A4 D5 -', '. D6 D6', '. B5 B5',
  'E4 E4 G4', 'B4 - -', '- G#4 A4', 'F#5 - -', '- D5 F#4', 'F#4 - E4', 'B4 - A4', 'D4 - -'];
const HAR = ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'A7', 'A7', 'A7', 'A7', 'A7', 'A7', 'A7', 'A7',
  'D', 'D', 'D', 'D', 'D', 'D', 'G', 'G', 'Em', 'Em', 'E7', 'D', 'D', 'A7', 'A7', 'D'];
const CH = {D: ['D2', 'F#3', 'A3', 'D4'], A7: ['A1', 'G3', 'C#4', 'E4'], G: ['G2', 'G3', 'B3', 'D4'], Em: ['E2', 'G3', 'B3', 'E4'], E7: ['E2', 'G#3', 'B3', 'D4']};
const midi = n => { const m = /^([A-G])(#?)(\d)$/.exec(n); return 12 * (+m[3] + 1) + {C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11}[m[1]] + (m[2] ? 1 : 0); };
const hz = n => 440 * Math.pow(2, (midi(n) - 69) / 12);

function startMusic() {
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
  const ac = new AC(), out = ac.createGain(); out.gain.value = 0.0; out.connect(ac.destination);
  out.gain.setTargetAtTime(0.32, ac.currentTime + 0.3, 1.2);                                  // soft fade in
  // small synthetic hall reverb (generated impulse, no file)
  const rev = ac.createConvolver(), len = Math.floor(ac.sampleRate * 2.2), ir = ac.createBuffer(2, len, ac.sampleRate);
  for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
  rev.buffer = ir; const wet = ac.createGain(); wet.gain.value = 0.35; rev.connect(wet); wet.connect(out);
  const dry = ac.createGain(); dry.gain.value = 0.7; dry.connect(out);
  const BEAT = 0.37;
  function note(f, t, dur, type, g, attack) {
    const o = ac.createOscillator(), a = ac.createGain(), lp = ac.createBiquadFilter(); o.type = type; o.frequency.value = f;
    lp.type = 'lowpass'; lp.frequency.value = Math.min(4200, f * 5);
    a.gain.setValueAtTime(0, t); a.gain.linearRampToValueAtTime(g, t + (attack || 0.03)); a.gain.setTargetAtTime(0, t + dur * 0.8, dur * 0.35);
    o.connect(lp); lp.connect(a); a.connect(dry); a.connect(rev); o.start(t); o.stop(t + dur + 1.5);
  }
  let bar = 0, tNext = ac.currentTime + 0.6;
  function scheduleBar() {
    const m = MEL[bar % MEL.length].split(' '), ch = CH[HAR[bar % HAR.length]];
    let i = 0; while (i < 3) { const n = m[i]; let len = 1; while (i + len < 3 && m[i + len] === '-') len++;
      if (n !== '.' && n !== '-') { const t = tNext + i * BEAT, d = len * BEAT; note(hz(n), t, d, 'triangle', 0.16, 0.04); note(hz(n) * 2, t, d, 'sine', 0.035, 0.06); }
      i += len; }
    note(hz(ch[0]), tNext, BEAT * 0.9, 'sine', 0.22, 0.01);                                         // oom
    for (let b = 1; b < 3; b++) for (let k = 1; k < 4; k++) note(hz(ch[k]), tNext + b * BEAT, BEAT * 0.45, 'triangle', 0.035, 0.01);   // pah pah
    tNext += 3 * BEAT; bar++; if (bar % MEL.length === 0) tNext += BEAT * 3;                         // a breath between repeats
  }
  const iv = setInterval(() => { while (tNext < ac.currentTime + 1.2) scheduleBar(); }, 200);
  const resume = () => { if (ac.state !== 'running') ac.resume().catch(() => {}); };
  resume(); ['pointerdown', 'touchend', 'keydown', 'click'].forEach(ev => window.addEventListener(ev, resume, {passive: true}));
  return {ac, out, stop() { clearInterval(iv); ['pointerdown', 'touchend', 'keydown', 'click'].forEach(ev => window.removeEventListener(ev, resume));
      try { out.gain.setTargetAtTime(0, ac.currentTime, 0.15); } catch (e) {} setTimeout(() => ac.close().catch(() => {}), 500); },
    set on(v) { out.gain.setTargetAtTime(v ? 0.32 : 0, ac.currentTime, 0.2); resume(); }};
}

/* ---------------- the room ---------------- */
const PANEL = [
  ['THE GRAND BALLROOM TRADITION', 50, '#f4d27a'],
  ['The Mayflower Hotel opened in Washington, D.C. on February 18, 1925.', 30],
  ['Two weeks later it hosted the inaugural ball for President Calvin', 30],
  ['Coolidge, and it hosted an inaugural ball every four years until 1981.', 30],
  ['Its Grand Ballroom had colonnades of square piers, gilt plaster', 30],
  ['decoration, a stage with a proscenium arch, mirrored French doors,', 30],
  ['a small curved balcony and a wooden dance floor bordered in marble.', 30],
  ['', 16],
  ['The National Debutante Cotillion and Thanksgiving Ball was founded', 30],
  ['in 1949 by Mary-Stuart "Studie" Montague Price and is held in', 30],
  ['Washington each Thanksgiving season. Debutantes wear white;', 30],
  ['returning post-debutantes wear black, then red. Escorts and floor', 30],
  ['committee members have long included cadets and midshipmen from the', 30],
  ['U.S. service academies.', 30],
  ['', 16],
  ['Music: "On the Beautiful Blue Danube", Johann Strauss II (1866-67),', 26, '#d9c79a'],
  ['public domain, played here by a simple built-in synthesizer.', 26, '#d9c79a'],
  ['This room is an artistic tribute, not a model of the actual hotel.', 26, '#d9c79a']];

function btn(rootEl, label, pos, rot, w, color, fn) {
  const b = document.createElement('a-plane'); b.setAttribute('class', 'btn'); b.setAttribute('width', w); b.setAttribute('height', 0.32);
  b.setAttribute('position', pos); b.setAttribute('rotation', rot || '0 0 0'); b.setAttribute('material', 'shader:flat;color:' + color + ';side:double');
  const t = document.createElement('a-text'); t.setAttribute('value', label); t.setAttribute('align', 'center'); t.setAttribute('color', '#111'); t.setAttribute('width', w * 1.7); t.setAttribute('position', '0 0 0.01');
  b.appendChild(t); b.addEventListener('click', fn); rootEl.appendChild(b); return {b, t};
}

const ROOM = {
  env: {background: 0x1a1208, fog: null, far: 300},
  spawn: {x: 0, y: 0, z: 11, yaw: 0},
  ground(x, z) { if (z < STAGE_Z && Math.abs(x) < 10) return STAGE_H; if (z < STAGE_Z + 1.4 && Math.abs(x) < 3) return STAGE_H * (STAGE_Z + 1.4 - z) / 1.4; return 0; },   // stage + centre steps
  blocked(x, z) {
    if (Math.abs(x) > W - 0.5 || z > ZE - 0.5 || z < ZS + 0.8) return true;
    if (z < STAGE_Z && z > STAGE_Z - 0.3 && Math.abs(x) >= 3 && Math.abs(x) < 10) return true;      // stage front, except the steps
    for (let i = 0; i < PIERS.length; i++) { const p = PIERS[i]; if (Math.abs(x - p[0]) < 0.6 && Math.abs(z - p[1]) < 0.6) return true; }
    return false;
  },
  async mount(sceneEl, rootEl, ctx) {
    const T = ctx.THREE, AFRAME = ctx.AFRAME || window.AFRAME, lite = !!ctx.lite, g = new T.Group(); g.name = 'ballroom';
    S = {g, ctx, music: null, dancers: [], t0: performance.now(), lights: []};
    const vmat = new T.MeshLambertMaterial({vertexColors: true});
    const K = geoKit(T);
    // --- architecture: walls, wainscot, piers, cornice, balconies, coffered ceiling, stage, proscenium ---
    const L = ZE - ZS, ZC = (ZE + ZS) / 2;
    K.add(new T.BoxGeometry(0.3, H, L), CREAM, W + 0.15, H / 2, ZC); K.add(new T.BoxGeometry(0.3, H, L), CREAM, -W - 0.15, H / 2, ZC);
    K.add(new T.BoxGeometry(2 * W + 0.6, H, 0.3), CREAM, 0, H / 2, ZE + 0.15); K.add(new T.BoxGeometry(2 * W + 0.6, H, 0.3), 0x5a0c18, 0, H / 2, ZS - 0.15);
    K.add(new T.BoxGeometry(0.06, 1.0, L), MARBLE, W - 0.02, 0.5, ZC); K.add(new T.BoxGeometry(0.06, 1.0, L), MARBLE, -W + 0.02, 0.5, ZC);   // St. Genevieve-tan wainscot
    K.add(new T.BoxGeometry(2 * W, 1.0, 0.06), MARBLE, 0, 0.5, ZE - 0.02);
    K.add(new T.BoxGeometry(2 * W, 0.05, L), 0xe6d4ac, 0, H, ZC);                                                       // ceiling
    for (const sx of [-1, 1]) {
      K.add(new T.BoxGeometry(0.5, 0.45, L), GOLD, sx * (W - 0.25), H - 0.25, ZC);                                      // cornice
      K.add(new T.BoxGeometry(2.4, 0.25, L - 6), CREAM, sx * (W - 1.2), BAL_Y, ZC + 1);                                 // balcony deck
      K.add(new T.BoxGeometry(0.12, 0.35, L - 6), GOLD, sx * (W - 2.4), BAL_Y - 0.25, ZC + 1);                          // gilded fascia
      K.add(new T.BoxGeometry(0.08, 0.08, L - 6), GOLD, sx * (W - 2.42), BAL_Y + 1.0, ZC + 1);                          // handrail
      for (let z = ZS + 3.4; z < ZE - 2.6; z += 0.45) K.add(new T.CylinderGeometry(0.035, 0.05, 0.85, 5), GOLD, sx * (W - 2.42), BAL_Y + 0.55, z);   // balusters
      for (let z = ZS + 4; z < ZE - 3; z += 4) K.add(new T.BoxGeometry(0.06, 2.6, 2.6), 0xd8c9a4, sx * (W - 0.03), BAL_Y + 3.4, z);  // gilt-framed wall panels
    }
    for (let x = -W + 2; x <= W - 2; x += 4) K.add(new T.BoxGeometry(0.18, 0.3, L), GOLD_D, x, H - 0.15, ZC);           // ceiling coffers
    for (let z = ZS + 2; z <= ZE - 1; z += 4) K.add(new T.BoxGeometry(2 * W, 0.3, 0.18), GOLD_D, 0, H - 0.15, z);
    PIERS.forEach(([x, z]) => { K.add(new T.BoxGeometry(0.8, H - 0.5, 0.8), IVORY, x, (H - 0.5) / 2, z);                 // square piers with gilt Ionic caps and bases
      K.add(new T.BoxGeometry(1.0, 0.4, 1.0), GOLD, x, H - 0.7, z); K.add(new T.BoxGeometry(0.95, 0.35, 0.95), MARBLE, x, 0.18, z);
      K.add(new T.BoxGeometry(0.84, 0.12, 0.84), GOLD, x, BAL_Y + 0.15, z); });
    // entrance wall: mirrored French doors and the small curved balcony above them
    for (let x = -10; x <= 10; x += 4) { K.add(new T.BoxGeometry(2.6, 4.2, 0.05), 0xb8c4cc, x, 2.3, ZE - 0.05); K.add(new T.BoxGeometry(2.9, 0.15, 0.08), GOLD, x, 4.45, ZE - 0.06);
      K.add(new T.BoxGeometry(0.08, 4.2, 0.08), GOLD, x, 2.3, ZE - 0.08); }
    for (let i = 0; i <= 12; i++) { const a = Math.PI * (i / 12); K.add(new T.CylinderGeometry(0.035, 0.05, 0.85, 5), GOLD, Math.cos(a) * 4, 7.0, ZE - Math.sin(a) * 1.6); }
    K.add(new T.CylinderGeometry(4, 4, 0.25, 20, 1, false, -Math.PI / 2, Math.PI), CREAM, 0, 6.5, ZE, 0, 0, 0, 1, 1, 0.4);
    K.add(new T.TorusGeometry(4, 0.05, 4, 20, Math.PI), GOLD, 0, 7.45, ZE, Math.PI / 2, 0, 0, 1, 0.4, 1);
    // stage with proscenium arch and velvet curtain
    K.add(new T.BoxGeometry(20, STAGE_H, ZS * -1 + STAGE_Z), 0x5c3a1e, 0, STAGE_H / 2, (STAGE_Z + ZS) / 2);
    K.add(new T.BoxGeometry(20.1, 0.12, 0.12), GOLD, 0, STAGE_H, STAGE_Z);
    for (let i = 0; i < 3; i++) K.add(new T.BoxGeometry(6, STAGE_H * (1 - i / 3), 0.47), 0x6a4426, 0, STAGE_H * (1 - i / 3) / 2, STAGE_Z + 0.23 + i * 0.47);
    K.add(new T.BoxGeometry(1.4, 9, 0.6), GOLD, -10.7, 4.5, STAGE_Z - 0.2); K.add(new T.BoxGeometry(1.4, 9, 0.6), GOLD, 10.7, 4.5, STAGE_Z - 0.2);
    K.add(new T.TorusGeometry(10.7, 0.45, 5, 28, Math.PI), GOLD, 0, 8.6, STAGE_Z - 0.2, 0, 0, 0, 1, 0.22, 1);
    K.add(new T.BoxGeometry(23, 0.9, 0.6), GOLD, 0, 10.5, STAGE_Z - 0.2);
    K.add(new T.BoxGeometry(20, 3.4, 0.6), 0xf0e3c4, 0, 10.3, STAGE_Z - 0.5);
    for (let i = 0; i < 26; i++) { const x = -9.6 + i * 0.77; K.add(new T.CylinderGeometry(0.42, 0.42, 9.2, 6, 1, true), i % 2 ? VELVET : 0x8e1626, x, 4.6, ZS + 0.4, 0, 0, 0, 1, 1, 0.5); }  // curtain folds
    K.add(new T.BoxGeometry(20, 1.0, 0.4), VELVET, 0, 8.8, STAGE_Z - 0.6);                                              // valance
    // orchestra: chairs, music stands, seated players, conductor's podium
    const SEATS = [];
    for (let r = 0; r < (lite ? 2 : 3); r++) for (let i = 0; i < 7; i++) { const a = -0.95 + i * (1.9 / 6), rad = 3.2 + r * 1.6;
      const x = Math.sin(a) * rad, z = STAGE_Z - 0.4 - Math.cos(a) * rad * 0.5; if (z < ZS + 1.2) continue; SEATS.push([x, z, Math.PI - a]); }
    SEATS.forEach(([x, z, ry], i) => {
      K.add(new T.BoxGeometry(0.42, 0.05, 0.42), 0x3a2414, x, STAGE_H + 0.45, z, 0, ry); K.add(new T.BoxGeometry(0.06, 0.45, 0.06), 0x3a2414, x, STAGE_H + 0.22, z, 0, ry);
      const fx = x + Math.sin(ry) * -0.7, fz = z + Math.cos(ry) * -0.7;
      K.add(new T.CylinderGeometry(0.012, 0.012, 1.1, 4), BLACK, fx, STAGE_H + 0.55, fz); K.add(new T.BoxGeometry(0.42, 0.3, 0.02), 0x222222, fx, STAGE_H + 1.15, fz, -0.4, ry);
      person(T, K, 'musician', SKIN[i % SKIN.length], x, z, ry, null, STAGE_H);
      if (i % 5 === 2) K.add(new T.SphereGeometry(0.22, 7, 5), 0x7a3e16, x + Math.sin(ry) * -0.3, STAGE_H + 0.75, z + Math.cos(ry) * -0.3, 0, 0, 0, 1, 1.8, 0.5);   // cello
    });
    K.add(new T.CylinderGeometry(0.6, 0.6, 0.25, 10), 0x5c3a1e, 0, STAGE_H + 0.12, STAGE_Z - 0.5);
    person(T, K, 'conductor', SKIN[0], 0, STAGE_Z - 0.5, 0, null, STAGE_H + 0.25);
    // round tables with white cloths and gold chairs under the balconies
    for (const sx of [-1, 1]) for (let z = -14; z <= 6; z += 4) { const x = sx * 9.6;
      K.add(new T.CylinderGeometry(0.85, 0.95, 0.78, 12), WHITE, x, 0.39, z); K.add(new T.CylinderGeometry(0.08, 0.1, 0.3, 6), GOLD, x, 0.93, z);
      K.add(new T.SphereGeometry(0.1, 6, 4), 0xff9fb0, x, 1.1, z);
      for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; K.add(new T.BoxGeometry(0.4, 0.9, 0.4), GOLD_D, x + Math.cos(a) * 1.25, 0.45, z + Math.sin(a) * 1.25, 0, -a, 0, 1, 1, 0.25); } }
    // U.S. Coast Guard honor guard in dress blues lining the entrance, swords raised in an arch
    for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) person(T, K, 'guard', SKIN[(i + (sx > 0 ? 2 : 0)) % SKIN.length], sx * 1.35, 7.6 - i * 1.5, sx > 0 ? Math.PI / 2 : -Math.PI / 2);
    const arch = new T.Mesh(K.build(), vmat); g.add(arch);
    // --- polished parquet dance floor with a marble border (one canvas texture) ---
    const parquet = canvasTex(T, 512, 512, (x, w, h) => { const n = 8, s = w / n;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const cx = i * s, cy = j * s, hor = (i + j) % 2;
        for (let k = 0; k < 4; k++) { const sh = 120 + ((i * 7 + j * 13 + k * 5) % 9) * 9; x.fillStyle = 'rgb(' + (sh + 10) + ',' + (sh - 40) + ',' + (sh - 85) + ')';
          if (hor) x.fillRect(cx, cy + k * s / 4, s, s / 4 - 1); else x.fillRect(cx + k * s / 4, cy, s / 4 - 1, s); } }
      x.strokeStyle = 'rgba(40,20,5,0.5)'; x.lineWidth = 2; for (let i = 0; i <= n; i++) { x.beginPath(); x.moveTo(i * s, 0); x.lineTo(i * s, h); x.moveTo(0, i * s); x.lineTo(w, i * s); x.stroke(); } });
    parquet.wrapS = parquet.wrapT = T.RepeatWrapping; parquet.repeat.set(8, 9);
    const floor = new T.Mesh(new T.PlaneGeometry(2 * W - 4, ZE - STAGE_Z - 3), new T.MeshPhongMaterial({map: parquet, shininess: 90, specular: 0x6a5a40}));
    floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0.012, (ZE - 1.5 + STAGE_Z + 1.5) / 2); g.add(floor);
    const border = new T.Mesh(new T.PlaneGeometry(2 * W, ZE - STAGE_Z), new T.MeshPhongMaterial({color: 0xe8dcc4, shininess: 60, specular: 0x444444}));
    border.rotation.x = -Math.PI / 2; border.position.set(0, 0, (ZE + STAGE_Z) / 2); g.add(border);
    // --- crystal chandeliers (merged, emissive) with soft glow sprites ---
    const CK = geoKit(T), CHAND = [[0, -11], [0, -2], [0, 6], [-8, -6], [8, -6]];
    CHAND.forEach(([cx, cz], ci) => { const big = ci < 3, s = big ? 1 : 0.6, y0 = H - (big ? 3.2 : 2.6);
      CK.add(new T.CylinderGeometry(0.02, 0.02, H - y0 - 1.4, 4), GOLD, cx, (H + y0 + 1.4) / 2, cz);
      CK.add(new T.TorusGeometry(1.3 * s, 0.05, 4, 16), GOLD, cx, y0 + 0.4 * s, cz, Math.PI / 2); CK.add(new T.TorusGeometry(0.8 * s, 0.04, 4, 14), GOLD, cx, y0 + 0.9 * s, cz, Math.PI / 2);
      for (const [r, y, nn, len] of [[1.3, 0.4, 18, 0.5], [0.8, 0.9, 12, 0.45], [0.4, 1.3, 8, 0.4]]) for (let k = 0; k < nn; k++) { const a = k / nn * Math.PI * 2;
        CK.add(new T.OctahedronGeometry(0.07 * s), 0xfff6dc, cx + Math.cos(a) * r * s, y0 + (y - len * 0.6) * s, cz + Math.sin(a) * r * s, 0, 0, 0, 1, 2.2, 1);
        CK.add(new T.CylinderGeometry(0.006, 0.006, len * s, 3), 0xfff2d0, cx + Math.cos(a) * r * s, y0 + (y - len * 0.25) * s, cz + Math.sin(a) * r * s);
        if (r > 1) CK.add(new T.CylinderGeometry(0.03, 0.03, 0.16, 5), 0xffffff, cx + Math.cos(a) * r * s, y0 + (y + 0.12) * s, cz + Math.sin(a) * r * s); }
      CK.add(new T.OctahedronGeometry(0.28 * s), 0xfff6dc, cx, y0 - 0.5 * s, cz, 0, 0, 0, 1, 2.0, 1); });
    const crystal = new T.Mesh(CK.build(), new T.MeshBasicMaterial({vertexColors: true})); g.add(crystal);
    const glowTex = canvasTex(T, 128, 128, (x, w) => { const gr = x.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); gr.addColorStop(0, 'rgba(255,236,190,0.9)'); gr.addColorStop(0.3, 'rgba(255,214,150,0.35)'); gr.addColorStop(1, 'rgba(255,200,120,0)'); x.fillStyle = gr; x.fillRect(0, 0, w, w); });
    const sheenGeo = new T.PlaneGeometry(1, 1), sheenMat = new T.MeshBasicMaterial({map: glowTex, transparent: true, opacity: 0.45, depthWrite: false, blending: T.AdditiveBlending});
    const glowMat = new T.SpriteMaterial({map: glowTex, transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false});
    CHAND.forEach(([cx, cz], ci) => { const sp = new T.Sprite(glowMat); const s = ci < 3 ? 5 : 3; sp.scale.set(s, s, 1); sp.position.set(cx, H - (ci < 3 ? 2.5 : 2.1), cz); g.add(sp);
      const refl = new T.Mesh(sheenGeo, sheenMat); refl.scale.set(s * 0.9, s * 0.9, 1); refl.rotation.x = -Math.PI / 2; refl.position.set(cx, 0.03, cz); g.add(refl); });   // floor sheen under each chandelier
    // --- lights (all under rootEl) ---
    g.add(new T.HemisphereLight(0xfff1d6, 0x6b4a2a, 0.75)); g.add(new T.AmbientLight(0xffe8c0, 0.25));
    const key = new T.DirectionalLight(0xfff0d0, 0.7); key.position.set(4, 14, 8); g.add(key);
    if (!lite) [[0, -11], [0, 6]].forEach(([x, z]) => { const p = new T.PointLight(0xffd9a0, 1.3, 26, 1); p.position.set(x, H - 3.6, z); g.add(p); });
    const stageL = new T.SpotLight(0xffe2b0, lite ? 0 : 1.4, 30, 0.7, 0.6, 1); stageL.position.set(0, 9, -6); stageL.target.position.set(0, 1, STAGE_Z - 2); g.add(stageL, stageL.target);
    // --- waltzing couples: one shared geometry per couple style, each couple spins as it travels round the floor ---
    const styles = ['escortCG', 'escortTails'].map((esc, si) => { const PK = geoKit(T);
      person(T, PK, esc, SKIN[si * 2], 0.16, 0.2, 0, si ? 0x1c120a : 0x2a1a10); person(T, PK, 'deb', SKIN[(si * 2 + 1) % SKIN.length], -0.12, -0.24, Math.PI, si ? 0xb08040 : 0x3a2414);
      return PK.build(); });
    const NC = lite ? 4 : 8;
    for (let i = 0; i < NC; i++) { const m = new T.Mesh(styles[i % 2], vmat); m.userData = {a: i / NC * Math.PI * 2, r: i % 2 ? 6.2 : 4.4}; g.add(m); S.dancers.push(m); }
    // --- history panel on a gilt easel, Return / Music buttons ---
    const panelTex = canvasTex(T, 1024, 900, (x, w, h) => { x.fillStyle = '#1d1408'; x.fillRect(0, 0, w, h); x.strokeStyle = '#d4a93c'; x.lineWidth = 14; x.strokeRect(14, 14, w - 28, h - 28);
      x.lineWidth = 3; x.strokeRect(36, 36, w - 72, h - 72); let y = 120; x.textAlign = 'center';
      PANEL.forEach(([s, sz, c]) => { x.fillStyle = c || '#f6ecd6'; x.font = (sz > 40 ? 'bold ' : '') + sz + 'px Georgia, serif'; if (s) x.fillText(s, w / 2, y); y += sz * (sz > 40 ? 1.5 : 1.45); }); });
    const panel = new T.Mesh(new T.PlaneGeometry(2.4, 2.1), new T.MeshBasicMaterial({map: panelTex})); panel.position.set(4.0, 1.75, 7.0); panel.rotation.y = -0.93; g.add(panel);
    const easel = new T.Mesh(new T.BoxGeometry(2.6, 2.3, 0.08), new T.MeshLambertMaterial({color: GOLD})); easel.position.set(4.03, 1.75, 6.97); easel.rotation.y = -0.93; g.add(easel);
    const leg = new T.Mesh(new T.BoxGeometry(0.1, 0.7, 0.1), easel.material); leg.position.set(4.03, 0.35, 6.97); g.add(leg);
    rootEl.object3D.add(g);
    btn(rootEl, 'Return to Fowling Pond', '-3.0 1.45 7.4', '0 49 0', 1.8, '#FFD700', () => ctx.leave({spot: 'terrace'}));
    const mb = btn(rootEl, 'Music: ON', '-3.0 1.05 7.4', '0 49 0', 1.8, '#f4e2b8', () => { if (!S || !S.music) return; S.musicOn = !S.musicOn; S.music.on = S.musicOn; mb.t.setAttribute('value', 'Music: ' + (S.musicOn ? 'ON' : 'OFF')); });
    S.musicBtn = mb;
    // --- animation: one tick listener, removed in unmount ---
    S.tick = () => { if (!S) return; const t = (performance.now() - S.t0) / 1000;
      S.dancers.forEach((m, i) => { const u = m.userData, a = u.a + t * 0.07 * (i % 2 ? 1 : 1.25), r = u.r + Math.sin(t * 0.3 + i) * 0.4;
        m.position.set(Math.cos(a) * r, Math.abs(Math.sin(t * Math.PI / (3 * 0.37))) * 0.04, FLOOR_C + Math.sin(a) * r * 0.85);
        m.rotation.y = -t * Math.PI / (3 * 0.37 * 2) - i; }); };   // a half turn every bar
    if (!AFRAME.components['fp-ballroom-tick']) AFRAME.registerComponent('fp-ballroom-tick', {tick() { if (S && S.tick) S.tick(); }});
    const tk = document.createElement('a-entity'); tk.setAttribute('fp-ballroom-tick', ''); rootEl.appendChild(tk);
    try { S.music = startMusic(); S.musicOn = true; } catch (e) { S.music = null; }
    window.FP_BALLROOM = {leave: () => ctx.leave({spot: 'terrace'}), music: () => S && S.music && S.music.ac.state, dancers: () => S ? S.dancers.length : 0};
    ctx.toast && ctx.toast('The Grand Ballroom - the orchestra plays the Blue Danube');
  },
  unmount() {
    if (!S) return;
    if (S.music) S.music.stop(); S = null; delete window.FP_BALLROOM;
  }
};
const PIERS = []; for (const sx of [-1, 1]) for (let z = ZS + 6; z <= ZE - 2; z += 4) PIERS.push([sx * (W - 2.4), z]);
export default ROOM;
if (window.FP_ROOMS && window.FP_ROOMS.register) window.FP_ROOMS.register(window.FP_ROOMS.pending || 'ballroom', ROOM);
