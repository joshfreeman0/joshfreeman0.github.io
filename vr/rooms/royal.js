// World room: the Royal Family - Buckingham Palace (East Front, Victoria Memorial, railings and guards) seen from a portrait gallery.
// Portraits are stylized gilt frames with crowns, cyphers, names and dates (no photos or likenesses). Public facts only.
import {kit, skyAndLight, flat, panel, navPost} from './common.js?v=1';
const PEOPLE = [   // [name, line2, line3, cypher, robe colour]
  ['Queen Victoria', '1819\u20131901', 'Reigned 1837\u20131901', 'VR', '#5a1a4a'],
  ['King Edward VII', '1841\u20131910', 'Reigned 1901\u20131910', 'ER VII', '#23324f'],
  ['King George V', '1865\u20131936', 'Reigned 1910\u20131936', 'GR V', '#2c4a32'],
  ['King Edward VIII', '1894\u20131972', 'Reigned Jan\u2013Dec 1936', 'ER VIII', '#4a3a22'],
  ['King George VI', '1895\u20131952', 'Reigned 1936\u20131952', 'GR VI', '#23324f'],
  ['Queen Elizabeth II', '1926\u20132022', 'Reigned 1952\u20132022', 'ER II', '#5a1a4a'],
  ['King Charles III', 'Born 1948', 'King since 2022', 'CR III', '#6a1820'],
  ['Queen Camilla', 'Born 1947', 'Queen since 2022', 'C', '#2c4a5a'],
  ['William, Prince of Wales', 'Born 1982', 'Heir to the throne', 'W', '#23324f'],
  ['Catherine, Princess of Wales', 'Born 1982', 'Married 2011', 'C', '#2c4a32'],
  ['Prince George of Wales', 'Born 2013', '', 'G', '#4a3a22'],
  ['Princess Charlotte of Wales', 'Born 2015', '', 'C', '#5a1a4a'],
  ['Prince Louis of Wales', 'Born 2018', '', 'L', '#2c4a5a']];
const CW = 292, CH = 512;
function atlas(T) {
  const cv = document.createElement('canvas'); cv.width = CW * 7; cv.height = CH * 2; const x = cv.getContext('2d');
  PEOPLE.forEach(([n, a, b, cy, robe], i) => { const ox = (i % 7) * CW, oy = Math.floor(i / 7) * CH;
    const gr = x.createLinearGradient(0, oy, 0, oy + CH); gr.addColorStop(0, robe); gr.addColorStop(1, '#0d0a08'); x.fillStyle = gr; x.fillRect(ox, oy, CW, CH);
    // gilt oval medallion with a crown and the cypher
    x.strokeStyle = '#d4af37'; x.lineWidth = 7; x.beginPath(); x.ellipse(ox + CW / 2, oy + 170, 105, 135, 0, 0, Math.PI * 2); x.stroke();
    x.fillStyle = '#d4af37'; const cx = ox + CW / 2, cyy = oy + 110;
    x.beginPath(); x.moveTo(cx - 52, cyy + 36); x.lineTo(cx - 60, cyy - 14); x.lineTo(cx - 28, cyy + 10); x.lineTo(cx, cyy - 30); x.lineTo(cx + 28, cyy + 10); x.lineTo(cx + 60, cyy - 14); x.lineTo(cx + 52, cyy + 36); x.closePath(); x.fill();
    x.fillRect(cx - 54, cyy + 36, 108, 12); x.fillStyle = '#b2182b'; [-30, 0, 30].forEach(d => { x.beginPath(); x.arc(cx + d, cyy + 42, 5, 0, 7); x.fill(); });
    x.fillStyle = '#f3e3b0'; x.font = 'bold ' + (cy.length > 4 ? 44 : 56) + 'px Georgia, serif'; x.textAlign = 'center'; x.fillText(cy, cx, oy + 230);
    // brass name plate
    x.fillStyle = '#c9a646'; x.fillRect(ox + 14, oy + 340, CW - 28, 158); x.fillStyle = '#2a1e0c';
    const words = n.split(' '); let l1 = n, l2 = ''; x.font = 'bold 30px Georgia, serif'; if (x.measureText(n).width > CW - 40) { const k = Math.ceil(words.length / 2); l1 = words.slice(0, k).join(' '); l2 = words.slice(k).join(' '); }
    x.fillText(l1, cx, oy + 378); if (l2) x.fillText(l2, cx, oy + 410); x.font = '26px Georgia, serif'; x.fillText(a, cx, oy + (l2 ? 446 : 420)); if (b) x.fillText(b, cx, oy + (l2 ? 478 : 454)); });
  const t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return t;
}
function unionFlag(T) {
  const cv = document.createElement('canvas'); cv.width = 240; cv.height = 120; const x = cv.getContext('2d');
  x.fillStyle = '#012169'; x.fillRect(0, 0, 240, 120); x.strokeStyle = '#fff'; x.lineWidth = 24; x.beginPath(); x.moveTo(0, 0); x.lineTo(240, 120); x.moveTo(240, 0); x.lineTo(0, 120); x.stroke();
  x.strokeStyle = '#C8102E'; x.lineWidth = 8; x.beginPath(); x.moveTo(0, 0); x.lineTo(240, 120); x.moveTo(240, 0); x.lineTo(0, 120); x.stroke();
  x.fillStyle = '#fff'; x.fillRect(100, 0, 40, 120); x.fillRect(0, 40, 240, 40); x.fillStyle = '#C8102E'; x.fillRect(108, 0, 24, 120); x.fillRect(0, 48, 240, 24);
  const t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; return t;
}
const ROOM = {
  env: {background: 0xc9d6e0, fog: [0xd2dce4, 120, 1100], far: 2000},
  spawn: {x: 0, y: 0, z: 21, yaw: 0},
  ground: () => 0,
  blocked: (x, z) => (z > 0 && (Math.abs(x) > 4.6 || z > 25.6)) || z < -53 || Math.abs(x) > 58 || Math.hypot(x, z + 30) < 8.5,
  mount(sceneEl, rootEl, ctx) {
    const T = ctx.THREE, g = new T.Group(); rootEl.object3D.add(g);
    skyAndLight(T, g, 0x6f9ccc, 0xe2e8ec, 0x6a6a5a, [-40, 70, 50], 1.3);
    flat(T, g, 1400, 0x4f7a3f, -0.06);
    const K = kit(T), stone = 0xe4dccb, red = 0x8a1c24, gold = 0xd4af37;
    // ---- portrait gallery hall (spawn inside, open end looks onto the palace) ----
    K.box(10, 0.1, 26, 0x6b4a2e, [0, 0.0, 13]);                                    // oak floor
    K.box(3, 0.02, 24, red, [0, 0.06, 13]);                                         // runner carpet
    for (const sx of [-1, 1]) { K.box(0.3, 6, 26, red, [sx * 5, 3, 13]); K.box(0.32, 0.5, 26, gold, [sx * 4.98, 5.7, 13]); K.box(0.34, 0.9, 26, 0xf2ead8, [sx * 4.97, 0.45, 13]); }
    K.box(10.6, 6, 0.3, red, [0, 3, 26]);                                          // back wall
    for (let z = 1; z < 26; z += 3) K.box(10, 0.3, 0.4, 0xf2ead8, [0, 6, z]);       // ceiling beams (skylight between)
    K.box(10.6, 0.6, 0.6, 0xf2ead8, [0, 6.2, 0]); for (const sx of [-1, 1]) K.cyl(0.35, 0.4, 6, 0xf2ead8, [sx * 4.6, 3, 0.2], 10);   // entrance columns
    // ---- forecourt, railings, gates ----
    K.box(120, 0.08, 60, 0xd8cdb2, [0, 0, -25]);                                   // gravel
    for (let x = -56; x <= 56; x += 0.55) { const gate = Math.abs(x) < 4 || Math.abs(Math.abs(x) - 24) < 3; K.box(0.06, 2.8, 0.06, 0x18181a, [x, 1.4, -54]); if (gate || Math.round(x / 0.55) % 6 === 0) K.cone(0.06, 0.25, gold, [x, 2.9, -54], 4); }
    K.box(112, 0.1, 0.1, 0x18181a, [0, 2.5, -54]); K.box(112, 0.1, 0.1, 0x18181a, [0, 0.4, -54]);
    for (const gx of [0, -24, 24]) { for (const sx of [-1, 1]) { const px = gx + sx * (gx ? 3 : 4); K.box(1.0, 4.2, 1.0, stone, [px, 2.1, -54]); K.sph(0.4, gold, [px, 4.6, -54], null, 8); } K.box(gx ? 5.4 : 7.4, 0.5, 0.15, gold, [gx, 3.2, -54]); }
    // ---- the East Front of Buckingham Palace (refaced by Aston Webb, 1913) ----
    const P = K.frame(0, 0, -80, 0);
    K.box(108, 24, 20, stone, [0, 12, 0], null, P); K.box(110, 1.2, 21, 0xd6cdb9, [0, 24.4, 0], null, P);   // block + cornice
    K.box(110, 2.2, 0.6, 0xd6cdb9, [0, 3.2, 10.1], null, P); K.box(110, 0.5, 21, 0xd0c6b0, [0, 0.25, 0], null, P);
    for (let c = 0; c < 36; c++) { const x = -52.5 + c * 3; if (Math.abs(x) < 9) continue; for (let r = 0; r < 3; r++) K.box(1.3, r === 2 ? 1.6 : 2.6, 0.2, 0x2b3038, [x, 6 + r * 6, 10.05], null, P); }
    for (const wx of [-50, -46, 46, 50]) K.box(8, 26, 21, stone, [wx > 0 ? 50 : -50, 13, 0.5], null, P);   // end pavilions
    // central portico: paired columns, pediment, balcony with crimson drape
    for (const x of [-7.5, -5.5, -2, 2, 5.5, 7.5]) K.cyl(0.55, 0.6, 15, 0xece5d6, [x, 10.5, 11], 12, null, P);
    K.box(18, 1.6, 2.4, 0xece5d6, [0, 18.8, 11], null, P); K.add(new T.CylinderGeometry(3.2, 3.2, 2, 3), 0xece5d6, [0, 20.5, 11], [90, 0, 90], [1, 1, 3], P);
    K.box(16, 0.5, 2.8, 0xd6cdb9, [0, 6.2, 12], null, P); K.box(14, 1.1, 0.12, 0xa0141e, [0, 6.9, 13.3], null, P); K.box(14, 0.15, 0.2, gold, [0, 7.5, 13.3], null, P);   // balcony
    for (const x of [-4, 0, 4]) K.box(2, 3.5, 0.25, 0x2b3038, [x, 8.9, 10.1], null, P);
    K.cyl(0.12, 0.14, 10, 0xf2f2f2, [0, 30, 4], 6, null, P);                          // flagpole
    // ---- Victoria Memorial (Thomas Brock; unveiled 1911) ----
    const V = K.frame(0, 0, -30, 0);
    K.cyl(8, 8.5, 1.2, 0xf0ece2, [0, 0.6, 0], 24, null, V); K.cyl(6.4, 6.8, 1.2, 0xf0ece2, [0, 1.8, 0], 20, null, V);
    K.box(4.6, 7, 4.6, 0xf4f0e6, [0, 5.6, 0], null, V); K.box(3.4, 3, 3.4, 0xf4f0e6, [0, 10.6, 0], null, V);
    K.box(1.6, 2.2, 1.4, 0xf4f0e6, [0, 4.6, 2.8], null, V); K.sph(0.5, 0xf4f0e6, [0, 6.0, 2.9], null, 8, null, V);   // seated Victoria (facing The Mall)
    K.sph(0.7, gold, [0, 13.4, 0], [0.8, 1.6, 0.8], 8, null, V); K.sph(0.35, gold, [0, 14.8, 0], null, 8, null, V);   // gilded Winged Victory
    K.add(new T.ConeGeometry(0.6, 2.6, 4), gold, [-0.9, 14.2, -0.2], [0, 0, 55], [1, 1, 0.25], V); K.add(new T.ConeGeometry(0.6, 2.6, 4), gold, [0.9, 14.2, -0.2], [0, 0, -55], [1, 1, 0.25], V);
    // ---- two guardsmen in sentry boxes (generic figures) ----
    for (const sx of [-1, 1]) { const f = K.frame(sx * 12, 0, -51, 0);
      K.box(1.3, 2.8, 1.2, 0x2a2a2a, [0, 1.4, -0.4], null, f); K.add(new T.ConeGeometry(1.0, 0.9, 4), 0x2a2a2a, [0, 3.25, -0.4], [0, 45, 0], null, f);
      K.cyl(0.07, 0.06, 0.9, 0x111318, [-0.1, 0.45, 0.4], 6, null, f); K.cyl(0.07, 0.06, 0.9, 0x111318, [0.1, 0.45, 0.4], 6, null, f);
      K.cyl(0.2, 0.18, 0.6, 0xc0141e, [0, 1.2, 0.4], 8, null, f); K.box(0.42, 0.06, 0.3, 0xffffff, [0, 1.0, 0.4], null, f); K.sph(0.11, 0xf0c8a0, [0, 1.65, 0.4], null, 8, null, f);
      K.cyl(0.15, 0.14, 0.5, 0x0c0c0e, [0, 1.95, 0.4], 10, null, f); K.cyl(0.015, 0.015, 1.2, 0x9aa0a8, [0.25, 1.4, 0.45], 4, null, f); }
    // ---- trees of St James's and Green Park ----
    for (let i = 0; i < 14; i++) { const x = (i % 2 ? 1 : -1) * (66 + (i % 3) * 8), z = 20 - i * 9; K.cyl(0.4, 0.5, 6, 0x5a4636, [x, 3, z], 6); K.ico(5 + (i % 3), 0x4a7a3a, [x, 9, z], [1.1, 0.9, 1.1]); }
    g.add(K.build({jitter: 0.05}));
    // portraits: one atlas texture, 13 gilt frames
    const tex = atlas(T), pm = new T.MeshBasicMaterial({map: tex}), frameM = new T.MeshLambertMaterial({color: gold});
    const pg = new T.PlaneGeometry(1.25, 1.25 * CH / CW);
    const hang = (i, x, z, ry) => { const geo = pg.clone(), uv = geo.attributes.uv, u0 = (i % 7) / 7, u1 = u0 + 1 / 7, v1 = 1 - Math.floor(i / 7) / 2, v0 = v1 - 0.5;
      for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) ? u1 : u0, uv.getY(k) ? v1 : v0);
      const m = new T.Mesh(geo, pm); m.position.set(x, 2.55, z); m.rotation.y = ry; g.add(m);
      const fr = new T.Mesh(new T.BoxGeometry(1.45, 1.25 * CH / CW + 0.2, 0.08), frameM); fr.position.set(x - Math.sin(ry) * 0.05, 2.55, z - Math.cos(ry) * 0.05); fr.rotation.y = ry; g.add(fr); };
    for (let i = 0; i < 6; i++) hang(i, -4.82, 3 + i * 3.7, Math.PI / 2);          // left wall: Victoria to Elizabeth II (oldest nearest the palace)
    for (let i = 0; i < 6; i++) hang(6 + i, 4.82, 21.5 - i * 3.7, -Math.PI / 2);   // right wall: Charles III and family
    hang(12, -2.6, 25.82, Math.PI);                                                 // back wall: Prince Louis
    // flag on the palace (Union Flag)
    const fl = new T.Mesh(new T.PlaneGeometry(4.8, 2.4), new T.MeshLambertMaterial({map: unionFlag(T), side: T.DoubleSide})); fl.position.set(2.5, 33.6, -76); g.add(fl);
    // history panels
    panel(T, g, ['Buckingham Palace',
      'Built in 1703 as Buckingham House, a townhouse for the Duke of Buckingham. King George III bought it in 1761 for Queen Charlotte.',
      'From 1826 John Nash turned it into a palace for George IV. Queen Victoria was the first monarch to live here, from 1837.',
      'The East Front facing The Mall, with the famous balcony, was added in 1847\u201350 and refaced in Portland stone by Sir Aston Webb in 1913. The palace has 775 rooms.'],
      {p: [0, 1.7, 9.5], ry: 0, w: 2.4, pxh: 760, fs: 32, bg: '#3a0d12'});
    panel(T, g, ['The House of Windsor',
      'King George V renamed the royal house Windsor in 1917.',
      'Queen Elizabeth II reigned for 70 years (1952\u20132022), longer than any other British monarch.',
      'King Charles III was crowned at Westminster Abbey on 6 May 2023. His heir is William, Prince of Wales.',
      'The Victoria Memorial in front of the palace, by Sir Thomas Brock, was unveiled in 1911.'],
      {p: [0, 1.7, 9.45], ry: 180, w: 2.4, pxh: 760, fs: 32, bg: '#3a0d12', post: false});
    panel(T, g, ['Royal portrait gallery', 'Left wall: the monarchs from Queen Victoria to Queen Elizabeth II. Right wall: King Charles III, Queen Camilla and the family of the Prince of Wales.',
      'Frames show each person\u2019s royal cypher or initial, not a likeness. Public information only.'],
      {p: [1.6, 2.4, 25.8], ry: 180, w: 2.2, pxh: 560, fs: 32, bg: '#3a0d12', post: false});
    navPost(rootEl, 'royal', [1.6, 1.0, 25.4], 180);
  },
  unmount() {}
};
window.FP_ROOMS.register(window.FP_ROOMS.pending || 'royal', ROOM);
