/* Fowling Pond - exhibit rooms north of the banking hall.
   Two rooms, entered through the doorways in the hall's north wall:
     Propulsion & Energy hall  (x 924-945, z -401..-428)
     UFO / UAP history room     (x 945-966, z -401..-428)
   ALL TEXT LIVES IN THE `EXHIBITS` OBJECT BELOW - edit titles/text there; slots fill in order.
   `tag` is a small badge (e.g. FACT, REPORTED, ALLEGED, THEORETICAL). `model` picks the 3D model on the pedestal.
   Models and panel art are procedural (no external images). Not an official or endorsed exhibit. */
(function () {
const EXHIBITS = {
  propulsion: {
    title: 'PROPULSION & ENERGY',
    subtitle: 'From chemical rockets to theoretical warp concepts',
    plaque: { title: 'In appreciation', text: 'In January 2019 Josh Freeman took the MIT IAP class "Propulsion and Energy", run by Charles Chase at UnLAB, where he met Hal Puthoff and Eric Davis.' },
    panels: [ // west wall (3), east wall (3), north wall left, north wall right
      { title: 'Chemical rockets', tag: 'IN USE', model: 'rocket', text: 'Burn fuel with an oxidizer and push hot gas out of a nozzle (Newton\'s third law). Robert Goddard flew the first liquid-fuel rocket in 1926. The Saturn V made about 7.5 million pounds of thrust at liftoff. Best efficiency (specific impulse) is about 450 s with hydrogen and oxygen.' },
      { title: 'Gridded ion thrusters', tag: 'IN USE', model: 'ion', text: 'Ionize a gas such as xenon and accelerate the ions through charged grids. Thrust is tiny (millinewtons) but efficiency is very high, around 3,000 s. Flown on NASA\'s Deep Space 1 (1998) and Dawn (2007-2018) missions.' },
      { title: 'Hall-effect thrusters', tag: 'IN USE', model: 'hall', text: 'A radial magnetic field traps electrons, and their electric field accelerates ions out of a ring-shaped channel. Developed mainly in the USSR from the 1970s; now common on satellites, including large constellations. Typical efficiency 1,500-2,000 s.' },
      { title: 'Nuclear thermal rockets', tag: 'GROUND-TESTED', model: 'ntr', text: 'A fission reactor heats hydrogen propellant instead of burning it, giving roughly twice the efficiency of the best chemical rockets (about 850-900 s). Reactors were ground-tested in the US Rover/NERVA program (1955-1973). None has flown yet.' },
      { title: 'Solar sails', tag: 'DEMONSTRATED', model: 'sail', text: 'Large, very thin mirrors pushed by the pressure of sunlight - no propellant at all. Japan\'s IKAROS (2010) first showed it in interplanetary space, and The Planetary Society\'s LightSail 2 (2019) raised its orbit using sunlight alone.' },
      { title: 'Vacuum energy & the Casimir effect', tag: 'MEASURED / OPEN QUESTION', model: 'casimir', text: 'Quantum theory says empty space has a zero-point energy. In 1948 Hendrik Casimir predicted two close, uncharged metal plates would be pushed together; the force was measured accurately in 1997. Whether vacuum energy can be used for power or propulsion is unproven.' },
      { title: 'Alcubierre warp concept', tag: 'THEORETICAL', model: 'warp', text: 'In 1994 physicist Miguel Alcubierre described a solution of general relativity where space contracts ahead of a "bubble" and expands behind it. It would need negative energy density ("exotic matter"), and no one knows how to make one.' },
      { title: 'Milestones', tag: 'TIMELINE', model: null, text: '1926 Goddard liquid-fuel rocket | 1957 Sputnik 1 | 1964 SERT-1 ion engine test in space | 1969 Apollo 11 | 1971 first Hall thruster in orbit | 1998 Deep Space 1 | 2010 IKAROS solar sail | 2019 LightSail 2' }
    ]
  },
  ufo: {
    title: 'UFO / UAP ROOM',
    subtitle: 'A timeline of public UAP history',
    intro: { title: 'About this room', tag: 'READ ME', text: 'UAP = unidentified anomalous phenomena (formerly UFOs). These panels summarize public reports and official documents. "Reported" and "alleged" mean exactly that - not proven. The hovering saucer is an illustrative model in the style of the 1947 Roswell-era "flying saucer" reports, not a depiction of any real object.' },
    panels: [ // west wall (4), east wall (4), north wall left, north wall right
      { title: '1947 - Roswell, New Mexico', tag: 'REPORTED', icon: 'news', text: 'In July 1947 Roswell Army Air Field announced it had recovered a "flying disc"; the Army quickly said it was a weather balloon. A 1994 US Air Force report attributed the debris to Project Mogul, a classified balloon program. Claims of a crashed craft remain alleged.' },
      { title: '1952-1969 - Project Blue Book', tag: 'OFFICIAL', icon: 'doc', text: 'US Air Force study of UFO reports, following Projects Sign and Grudge. It logged 12,618 reports, of which 701 stayed "unidentified". It closed in 1969 after the University of Colorado (Condon) report.' },
      { title: '2004 - Nimitz "Tic Tac"', tag: 'REPORTED', icon: 'tictac', text: 'Off southern California, radar on USS Princeton tracked unknown objects. Navy F/A-18F crews, including Cdr. David Fravor, reported a white, oblong object with no visible wings or exhaust. An infrared (FLIR) video was later released.' },
      { title: 'Dec 2017 - The AATIP story', tag: 'REPORTED', icon: 'news', text: 'The New York Times reported on the Pentagon\'s Advanced Aerospace Threat Identification Program (about $22 million, 2007-2012) and published Navy cockpit videos. The story revived mainstream interest in the subject.' },
      { title: 'Apr 2020 - Navy videos released', tag: 'OFFICIAL', icon: 'radar', text: 'The Department of Defense formally released three Navy videos known as FLIR, GIMBAL and GOFAST, calling the objects "unidentified aerial phenomena". In August 2020 it set up the UAP Task Force.' },
      { title: 'Jun 2021 - ODNI assessment', tag: 'OFFICIAL', icon: 'doc', text: 'The Office of the Director of National Intelligence reviewed 144 government reports from 2004-2021. One was explained with high confidence (a deflating balloon); most lacked enough data to explain. Some appeared to show unusual movement.' },
      { title: 'Jul 2022 - AARO established', tag: 'OFFICIAL', icon: 'radar', text: 'The Department of Defense created the All-domain Anomaly Resolution Office (AARO) to collect and analyze UAP reports from air, sea, space and undersea, and to publish findings.' },
      { title: 'Jul 2023 - Congressional hearing', tag: 'ALLEGED', icon: 'capitol', text: 'A House Oversight subcommittee heard from David Grusch, David Fravor and Ryan Graves. Grusch alleged a long-running crash-retrieval program. The Pentagon said it had found no verifiable information to support those claims.' },
      { title: 'Mar 2024 - AARO historical report', tag: 'OFFICIAL', icon: 'doc', text: 'AARO\'s Volume 1 review of US government UAP investigations since 1945 reported no evidence that any sighting represented extraterrestrial technology. Investigations of new reports continue.' },
      { title: 'Your display here', tag: 'PLACEHOLDER', icon: 'saucer', text: 'Space reserved for another display - for example a personal story, a book, a photo or an event. Edit EXHIBITS in vr/w3d/rooms.js to change any panel.' }
    ]
  }
};
window.JF_EXHIBITS = EXHIBITS;

const ROOMS = { propulsion: {x0: 924.5, x1: 944.5}, ufo: {x0: 945.5, x1: 965.5} };
const Z0 = -400.75, Z1 = -428.25, HR = 8;   // interior: south face of the hall wall to the north wall
const anim = [];
let L, M, root, y0, fy;

function wrap(g, text, maxW) {
  const out = []; text.split('\n').forEach(par => { let line = ''; par.split(' ').forEach(w => { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t; }); out.push(line); }); return out;
}
function frameBorder(g, W, H, gold) { g.strokeStyle = gold || '#d4af37'; g.lineWidth = 10; g.strokeRect(8, 8, W - 16, H - 16); g.lineWidth = 2; g.strokeRect(24, 24, W - 48, H - 48); }
function badge(g, tag, x, y) {
  if (!tag) return; g.font = 'bold 22px system-ui, sans-serif'; const w = g.measureText(tag).width + 26;
  const col = {ALLEGED: '#b5342b', REPORTED: '#c77d1a', THEORETICAL: '#6a4fb3', PLACEHOLDER: '#555'}[tag] || '#2e6f8e';
  g.fillStyle = col; g.fillRect(x - w, y - 24, w, 34); g.fillStyle = '#fff'; g.textAlign = 'right'; g.fillText(tag, x - 13, y); g.textAlign = 'left';
}
function icon(g, kind, cx, cy) { // tiny procedural illustrations (no photos)
  g.save(); g.translate(cx, cy);
  g.fillStyle = '#0b1622'; g.fillRect(-100, -80, 200, 160); g.strokeStyle = '#d4af37'; g.lineWidth = 3; g.strokeRect(-100, -80, 200, 160);
  if (kind === 'tictac') { g.fillStyle = '#20262a'; g.fillRect(-98, -78, 196, 156); g.strokeStyle = '#9fb'; g.lineWidth = 1; g.beginPath(); g.moveTo(-20, 0); g.lineTo(20, 0); g.moveTo(0, -20); g.lineTo(0, 20); g.stroke(); g.fillStyle = '#f2f2f2'; g.beginPath(); g.ellipse(0, 0, 34, 13, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#9fb'; g.font = '14px monospace'; g.fillText('IR  (illustration)', -92, 70); }
  else if (kind === 'radar') { g.strokeStyle = '#3c9'; g.lineWidth = 2; for (let r = 20; r <= 70; r += 25) { g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke(); } g.beginPath(); g.moveTo(0, 0); g.lineTo(60, -35); g.stroke(); g.fillStyle = '#ff6'; g.beginPath(); g.arc(38, -18, 5, 0, Math.PI * 2); g.fill(); }
  else if (kind === 'doc') { g.fillStyle = '#efe6cf'; g.fillRect(-45, -62, 90, 124); g.fillStyle = '#888'; for (let i = 0; i < 9; i++) g.fillRect(-35, -48 + i * 12, i % 3 === 2 ? 45 : 70, 4); g.fillStyle = '#b5342b'; g.fillRect(-35, 52, 40, 6); }
  else if (kind === 'news') { g.fillStyle = '#e8e2d2'; g.fillRect(-70, -62, 140, 124); g.fillStyle = '#222'; g.fillRect(-60, -52, 120, 14); g.fillStyle = '#777'; for (let i = 0; i < 7; i++) { g.fillRect(-60, -28 + i * 12, 55, 4); g.fillRect(5, -28 + i * 12, 55, 4); } }
  else if (kind === 'capitol') { g.fillStyle = '#e8e8e8'; g.fillRect(-70, 20, 140, 30); g.beginPath(); g.arc(0, 10, 32, Math.PI, 0); g.fill(); g.fillRect(-4, -36, 8, 16); for (let i = -60; i <= 60; i += 15) { g.fillStyle = '#9aa'; g.fillRect(i - 2, 24, 4, 24); } }
  else if (kind === 'saucer') { g.fillStyle = '#c8ced4'; g.beginPath(); g.ellipse(0, 10, 70, 16, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#7fd8e8'; g.beginPath(); g.ellipse(0, 0, 26, 22, 0, Math.PI, 0); g.fill(); }
  g.restore();
}
function panelCanvas(p, opt) {
  opt = opt || {}; const W = 1024, H = 512, c = L.canvas(W, H), g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, H); grd.addColorStop(0, opt.bg0 || '#1b1408'); grd.addColorStop(1, opt.bg1 || '#2a1f0e'); g.fillStyle = grd; g.fillRect(0, 0, W, H);
  frameBorder(g, W, H);
  badge(g, p.tag, W - 44, 76);
  g.fillStyle = '#ffd700'; g.font = 'bold 44px Georgia, serif'; g.textAlign = 'left';
  g.font = 'bold 22px system-ui, sans-serif'; const bw = p.tag ? g.measureText(p.tag).width + 60 : 0;
  g.fillStyle = '#ffd700'; g.font = 'bold 48px Georgia, serif'; const tw = W - 110 - bw;
  wrap(g, p.title, tw).slice(0, 2).forEach((s, i) => g.fillText(s, 50, 86 + i * 52));
  const hasIcon = !!p.icon, bodyW = hasIcon ? W - 330 : W - 100, top = g.measureText(p.title).width > tw ? 196 : 150;
  g.fillStyle = '#f3e6c0';
  if (p.tag === 'TIMELINE') { const items = p.text.split(' | '), rows = Math.ceil(items.length / 2); let fs = 34; do { g.font = fs + 'px Georgia, serif'; fs -= 2; } while (items.some(t => g.measureText(t).width > 440) && fs > 18); items.forEach((s, i) => g.fillText(s, 50 + Math.floor(i / rows) * 475, top + 20 + (i % rows) * Math.min(72, (H - top - 50) / rows))); }
  else { let fs = 40, lines; do { g.font = fs + 'px Georgia, serif'; lines = wrap(g, p.text, bodyW); fs -= 2; } while (lines.length * (fs + 10) > H - top - 40 && fs > 18); lines.forEach((s, i) => g.fillText(s, 50, top + i * (fs + 12))); }
  if (hasIcon) icon(g, p.icon, W - 160, 300);
  return c;
}
function titleCanvas(t, sub) {
  const W = 1024, H = 256, c = L.canvas(W, H), g = c.getContext('2d'); g.fillStyle = '#120d05'; g.fillRect(0, 0, W, H); frameBorder(g, W, H);
  g.textAlign = 'center'; g.fillStyle = '#ffd700'; let fs = 76; do { g.font = 'bold ' + fs + 'px Georgia, serif'; fs -= 4; } while (g.measureText(t).width > W - 90); g.fillText(t, W / 2, 120); g.fillStyle = '#f3e6c0'; g.font = 'italic 34px Georgia, serif'; g.fillText(sub, W / 2, 190); return c;
}
function plaqueCanvas(p) {
  const W = 1024, H = 512, c = L.canvas(W, H), g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, W, H); grd.addColorStop(0, '#b8902c'); grd.addColorStop(0.5, '#e6c45c'); grd.addColorStop(1, '#9c7622'); g.fillStyle = grd; g.fillRect(0, 0, W, H);
  frameBorder(g, W, H, '#5a4210'); g.textAlign = 'center'; g.fillStyle = '#2b1e06'; g.font = 'bold 50px Georgia, serif'; g.fillText(p.title, W / 2, 110);
  g.font = '40px Georgia, serif'; wrap(g, p.text, W - 140).forEach((s, i) => g.fillText(s, W / 2, 190 + i * 56)); return c;
}
function panel(cv, w, h, x, y, z, ry) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({map: L.tex(cv), toneMapped: false}));
  m.material.map.anisotropy = 8; m.position.set(x, y, z); m.rotation.y = ry; root.add(m);
  const f = new THREE.Mesh(new THREE.BoxGeometry(w + 0.16, h + 0.16, 0.05), M.gold); f.position.set(x, y, z); f.rotation.y = ry; f.translateZ(-0.03); root.add(f);
  return m;
}
const std = (o) => { const m = new THREE.MeshStandardMaterial(o); if (W3D.env) { m.envMap = W3D.env; m.envMapIntensity = 0.7; } return m; };
const glow = (c, op) => new THREE.MeshBasicMaterial({color: c, transparent: op !== undefined, opacity: op === undefined ? 1 : op, blending: op !== undefined ? THREE.AdditiveBlending : THREE.NormalBlending, depthWrite: op === undefined, side: THREE.DoubleSide, toneMapped: false});
const add = (g, geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); g.add(m); return m; };

/* ---------- pedestal models (all procedural, low-poly) ---------- */
function model(kind) {
  const g = new THREE.Group(); let spin = 0;
  const white = std({color: 0xeeeeee, roughness: 0.4}), metal = std({color: 0xa9b0b8, metalness: 0.9, roughness: 0.3}), dark = std({color: 0x333438, metalness: 0.6, roughness: 0.4});
  if (kind === 'rocket' || kind === 'ntr') {
    add(g, new THREE.CylinderGeometry(0.22, 0.22, 1.7, 20), kind === 'ntr' ? metal : white, 0, 1.15, 0);
    add(g, new THREE.ConeGeometry(0.22, 0.5, 20), kind === 'ntr' ? metal : white, 0, 2.25, 0);
    add(g, new THREE.CylinderGeometry(0.12, 0.26, 0.35, 20, 1, true), dark, 0, 0.12, 0);
    if (kind === 'rocket') { for (let i = 0; i < 4; i++) { const f = add(g, new THREE.BoxGeometry(0.03, 0.4, 0.28), std({color: 0xb5342b}), 0, 0.5, 0); f.rotation.y = i * Math.PI / 2; f.translateZ(0.3); } add(g, new THREE.ConeGeometry(0.11, 0.5, 12, 1, true), glow(0xff9a3c, 0.6), 0, -0.3, 0).rotation.x = Math.PI; }
    else { add(g, new THREE.CylinderGeometry(0.26, 0.26, 0.4, 20), dark, 0, 0.55, 0); add(g, new THREE.TorusGeometry(0.265, 0.025, 8, 32), glow(0xff5a1f), 0, 0.55, 0).rotation.x = Math.PI / 2; add(g, new THREE.ConeGeometry(0.1, 0.6, 12, 1, true), glow(0x8fd0ff, 0.45), 0, -0.3, 0).rotation.x = Math.PI; }
    spin = 0.15;
  } else if (kind === 'ion' || kind === 'hall') {
    const body = add(g, new THREE.CylinderGeometry(0.45, 0.5, 0.6, 32), metal, 0, 1.0, 0);
    if (kind === 'ion') { add(g, new THREE.CircleGeometry(0.42, 32), glow(0x5ab4ff), 0, 1.0, 0.301).rotation.set(0, 0, 0); body.rotation.x = Math.PI / 2; const grid = add(g, new THREE.RingGeometry(0.1, 0.42, 32, 3), std({color: 0x222222, wireframe: true}), 0, 1.0, 0.31); grid.rotation.z = 0.2; }
    else { body.rotation.x = Math.PI / 2; add(g, new THREE.RingGeometry(0.22, 0.38, 48), glow(0x9a6bff), 0, 1.0, 0.302); add(g, new THREE.CircleGeometry(0.16, 24), dark, 0, 1.0, 0.303); }
    const plume = add(g, new THREE.ConeGeometry(0.4, 1.6, 24, 1, true), glow(kind === 'ion' ? 0x3a8cff : 0x8a5cff, 0.35), 0, 1.0, 1.1); plume.rotation.x = -Math.PI / 2;
  } else if (kind === 'sail') {
    const sail = new THREE.Group(); sail.position.y = 1.3; g.add(sail);
    const s = add(sail, new THREE.PlaneGeometry(1.6, 1.6), std({color: 0xf0d48a, metalness: 1, roughness: 0.15, side: THREE.DoubleSide})); s.rotation.z = Math.PI / 4;
    for (let i = 0; i < 2; i++) add(sail, new THREE.BoxGeometry(2.3, 0.025, 0.025), dark).rotation.z = Math.PI / 2 * i;
    add(sail, new THREE.BoxGeometry(0.18, 0.18, 0.18), metal);
    add(g, new THREE.CylinderGeometry(0.02, 0.02, 1.3, 6), dark, 0, 0.65, 0);
    anim.push((t) => { sail.rotation.y = Math.sin(t * 0.0004) * 0.7; sail.rotation.x = 0.3; });
  } else if (kind === 'casimir') {
    for (const dy of [-0.09, 0.09]) add(g, new THREE.BoxGeometry(0.8, 0.03, 0.8), metal, 0, 1.0 + dy, 0);
    add(g, new THREE.BoxGeometry(0.76, 0.12, 0.76), glow(0x6fd0ff, 0.25), 0, 1.0, 0);
    for (let i = 0; i < 6; i++) { const a = add(g, new THREE.ConeGeometry(0.04, 0.14, 8), glow(0xffd700), -0.3 + (i % 3) * 0.3, i < 3 ? 1.24 : 0.76, (i % 2) * 0.2 - 0.1); a.rotation.x = i < 3 ? Math.PI : 0; }
    add(g, new THREE.BoxGeometry(1.1, 0.9, 1.1), std({color: 0xd8f0f6, transparent: true, opacity: 0.12, roughness: 0.05, depthWrite: false}), 0, 1.0, 0);
    spin = 0.1;
  } else if (kind === 'warp') {
    const ship = add(g, new THREE.SphereGeometry(0.22, 24, 12), metal, 0, 1.4, 0); ship.scale.set(1, 0.45, 2.4);
    const ring = add(g, new THREE.TorusGeometry(0.85, 0.05, 12, 64), glow(0x6fe0ff), 0, 1.4, 0); ring.rotation.x = Math.PI / 2;
    const bubble = add(g, new THREE.SphereGeometry(1.0, 32, 16), glow(0x3a6cff, 0.12), 0, 1.4, 0);
    const front = add(g, new THREE.TorusGeometry(0.45, 0.02, 8, 48), glow(0xff8a5a, 0.7), 0, 1.4, -1.0);
    const back = add(g, new THREE.TorusGeometry(0.45, 0.02, 8, 48), glow(0x5affb0, 0.7), 0, 1.4, 1.0);
    anim.push((t) => { const k = 1 + Math.sin(t * 0.002) * 0.06; bubble.scale.set(k, k, 1.25 - (k - 1)); front.scale.setScalar(1 - (k - 1) * 3); back.scale.setScalar(1 + (k - 1) * 3); ring.rotation.z = t * 0.0006; });
  }
  if (spin) anim.push((t, dt) => { g.rotation.y += spin * dt / 1000; });
  return g;
}
function pedestal(x, z, kind, ry) {
  L.box(1.2, 1.0, 1.2, x, fy, z, M.granite, {floor: false, T: 2});
  const cap = L.box(1.3, 0.06, 1.3, x, fy + 1.0, z, M.gold, {collide: false});
  const g = model(kind); g.position.set(x, fy + 1.06, z); g.rotation.y = ry || 0; root.add(g); return g;
}

/* ---------- room shells ---------- */
function shell(r, wallMat, ceilMat) {
  const cx = (r.x0 + r.x1) / 2, w = r.x1 - r.x0, cz = (Z0 + Z1) / 2, d = Z0 - Z1;
  L.box(w, 0.3, d, cx, y0, cz, M.granite, {floor: true, collide: false, T: 4});
  const ce = new THREE.Mesh(new THREE.PlaneGeometry(w, d), ceilMat); ce.rotation.x = Math.PI / 2; ce.position.set(cx, fy + HR - 0.4, cz); ce.receiveShadow = true; root.add(ce);
  if (wallMat) { // interior lining on the three exhibit walls
    const lin = (W, x, z, ry) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(W, HR - 0.3), wallMat); p.position.set(x, fy + (HR - 0.3) / 2, z); p.rotation.y = ry; p.receiveShadow = true; root.add(p); };
    lin(d, r.x0 + 0.01, cz, Math.PI / 2); lin(d, r.x1 - 0.01, cz, -Math.PI / 2); lin(w, cx, Z1 + 0.01, 0);
  }
  return {cx: cx, cz: cz};
}
W3D.buildRooms = function (rootIn) {
  L = W3D.lib; M = W3D.M; root = rootIn; y0 = L.HQ.y; fy = y0 + 0.3;
  // outer walls (shared wall at x 945), roof
  L.box(1, HR, 28, 924, y0, -414.75, M.stone, {T: 4}); L.box(1, HR, 28, 945, y0, -414.75, M.stone, {T: 4}); L.box(1, HR, 28, 966, y0, -414.75, M.stone, {T: 4});
  L.box(43, HR, 1, 945, y0, -428.75, M.relief, {T: 6});
  L.box(43, 0.6, 29, 945, y0 + HR, -414.75, M.stone, {collide: false}); L.box(44, 0.5, 30, 945, y0 + HR + 0.6, -414.75, M.stone, {collide: false});

  /* Propulsion & Energy hall */
  const P = EXHIBITS.propulsion, pr = ROOMS.propulsion;
  const pc = shell(pr, std({color: 0xe3d6bd, roughness: 0.8}), new THREE.MeshBasicMaterial({color: 0xcfc6b2, toneMapped: false}));
  const pSlots = [[pr.x0, -406, 1], [pr.x0, -413.5, 1], [pr.x0, -421, 1], [pr.x1, -406, -1], [pr.x1, -413.5, -1], [pr.x1, -421, -1], ['N', pc.cx - 6.2], ['N', pc.cx + 6.2]];
  P.panels.forEach((p, i) => { const s = pSlots[i]; if (!s) return; const cv = panelCanvas(p);
    if (s[0] === 'N') panel(cv, 3.6, 1.8, s[1], fy + 2.0, Z1 + 0.06, 0);
    else { panel(cv, 3.6, 1.8, s[0] + s[2] * 0.06, fy + 2.0, s[1], s[2] * Math.PI / 2); if (p.model) { const pg = pedestal(s[0] + s[2] * 1.5, s[1] + 3.75, p.model, s[2] * Math.PI / 2); if (p.model === 'ntr') padLink(pg, s[2] * Math.PI / 2); } /* beside the panel, in the gap, so the text stays readable */ } });
  panel(titleCanvas(P.title, P.subtitle), 7, 1.75, pc.cx, fy + 6.5, Z1 + 0.06, 0);
  panel(plaqueCanvas(P.plaque), 3.0, 1.5, pc.cx, fy + 1.8, Z1 + 0.06, 0);
  // centre piece: the model of any north-wall exhibit (the warp concept) at 1.6x on a round plinth
  { const c = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.4, 0.6, 48), M.granite); c.position.set(pc.cx, fy + 0.3, pc.cz); root.add(c);
    const lip = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.04, 8, 64), M.gold); lip.rotation.x = Math.PI / 2; lip.position.set(pc.cx, fy + 0.6, pc.cz); root.add(lip);
    L.walls.push({x0: pc.cx - 1.3, x1: pc.cx + 1.3, z0: pc.cz - 1.3, z1: pc.cz + 1.3, y0: fy, y1: fy + 0.6});
    const cm = P.panels.slice(6).find(p => p.model); if (cm) { const g = model(cm.model); g.scale.setScalar(1.6); g.position.set(pc.cx, fy + 0.26, pc.cz); root.add(g); } }
  hallSign(933, 'Propulsion & Energy hall');

  /* UFO / UAP room */
  const U = EXHIBITS.ufo, ur = ROOMS.ufo;
  const uc = shell(ur, std({color: 0x10182a, roughness: 0.85}), new THREE.MeshStandardMaterial({map: L.starCeilingTex(), roughness: 0.6}));
  const uSlots = []; for (const [x, sgn] of [[ur.x0, 1], [ur.x1, -1]]) for (const z of [-404.6, -410.6, -416.6, -422.6]) uSlots.push([x, z, sgn]); uSlots.push(['N', uc.cx - 6.2], ['N', uc.cx + 6.2]);
  const ubg = {bg0: '#0c1424', bg1: '#16223a'};
  U.panels.forEach((p, i) => { const s = uSlots[i]; if (!s) return; const cv = panelCanvas(p, ubg);
    if (s[0] === 'N') panel(cv, 3.4, 1.7, s[1], fy + 1.9, Z1 + 0.06, 0); else panel(cv, 3.4, 1.7, s[0] + s[2] * 0.06, fy + 1.9, s[1], s[2] * Math.PI / 2); });
  panel(titleCanvas(U.title, U.subtitle), 7, 1.75, uc.cx, fy + 6.5, Z1 + 0.06, 0);
  panel(panelCanvas(U.intro, ubg), 3.0, 1.5, uc.cx, fy + 1.9, Z1 + 0.06, 0);
  saucer(uc.cx, uc.cz);
  hallSign(957, 'UFO / UAP room');
};
function hallSign(x, text) { // gold sign over each doorway, facing into the banking hall
  const c = L.canvas(1024, 192), g = c.getContext('2d'); g.fillStyle = '#1b1408'; g.fillRect(0, 0, 1024, 192); frameBorder(g, 1024, 192);
  g.fillStyle = '#ffd700'; g.font = 'bold 72px Georgia, serif'; g.textAlign = 'center'; g.fillText(text, 512, 122);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 0.8), new THREE.MeshBasicMaterial({map: L.tex(c), toneMapped: false})); m.position.set(x, fy + 5.6, -399.2); root.add(m);
}
function saucer(x, z) {
  L.box(7, 0.25, 7, x, fy, z, M.granite, {floor: true, collide: false, T: 2});
  const ring = new THREE.Mesh(new THREE.RingGeometry(3.0, 3.25, 64), glow(0x6fe0ff)); ring.rotation.x = -Math.PI / 2; ring.position.set(x, fy + 0.27, z); root.add(ring);
  const g = new THREE.Group(); g.position.set(x, fy + 2.9, z); root.add(g);
  const pts = [[0, -0.32], [0.7, -0.36], [1.6, -0.2], [2.1, -0.02], [2.12, 0.02], [1.6, 0.16], [0.9, 0.3], [0, 0.34]].map(p => new THREE.Vector2(p[0], p[1]));
  add(g, new THREE.LatheGeometry(pts, 64), std({color: 0xb9c2cc, metalness: 0.95, roughness: 0.22})).castShadow = false;
  add(g, new THREE.SphereGeometry(0.75, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), std({color: 0x9fe8f4, emissive: 0x2a8fa0, emissiveIntensity: 0.6, transparent: true, opacity: 0.75, roughness: 0.05}), 0, 0.28, 0);
  add(g, new THREE.TorusGeometry(2.1, 0.035, 8, 96), glow(0xffd36a), 0, 0, 0).rotation.x = Math.PI / 2;
  const lights = []; for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; lights.push(add(g, new THREE.SphereGeometry(0.09, 10, 8), glow(0x7ff0ff), Math.cos(a) * 1.3, -0.3, Math.sin(a) * 1.3)); }
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 2.2, 2.5, 48, 1, true), glow(0x6fe0ff, 0.09)); beam.position.set(x, fy + 1.4, z); root.add(beam);
  anim.push((t) => { g.rotation.y = t * 0.0003; g.position.y = fy + 2.9 + Math.sin(t * 0.0011) * 0.15; g.rotation.z = Math.sin(t * 0.0007) * 0.04;
    lights.forEach((l, i) => l.material.color.setHSL(0.5, 1, 0.45 + 0.35 * Math.max(0, Math.sin(t * 0.004 - i * 0.63)))); });
  lights.forEach(l => l.material = l.material.clone());
  // small label on the dais
  const c = L.canvas(512, 128), gg = c.getContext('2d'); gg.fillStyle = '#0c1424'; gg.fillRect(0, 0, 512, 128); gg.strokeStyle = '#d4af37'; gg.lineWidth = 5; gg.strokeRect(4, 4, 504, 120);
  gg.fillStyle = '#f3e6c0'; gg.font = '26px Georgia, serif'; gg.textAlign = 'center'; gg.fillText('Roswell-era (1947) "flying saucer"', 256, 52); gg.fillText('illustrative model - not a real object', 256, 92);
  const lab = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.35), new THREE.MeshBasicMaterial({map: L.tex(c), toneMapped: false})); lab.position.set(x, fy + 0.6, z + 3.4); lab.rotation.x = -0.5; root.add(lab);
  L.box(1.5, 0.45, 0.2, x, fy, z + 3.5, M.granite, {collide: false});
}
/* Clip 23 + calls: the Propulsion-hall rocket is a pointer to the real one. Pointing at it and pulling the RIGHT trigger (or click / tap)
   takes you to the Bridgewater launch pad (launch.js), where the full-size rocket flies you to Mars; no direct jump to another site here.
   An invisible .btn proxy around the model makes it raycastable; hovering lights the rocket and the hint. */
function padLink(g, ry) {
  const hc = document.createElement('canvas'); hc.width = 512; hc.height = 96; const hg = hc.getContext('2d');
  const draw = on => { hg.clearRect(0, 0, 512, 96); hg.fillStyle = on ? 'rgba(181,83,45,0.95)' : 'rgba(20,20,24,0.72)'; hg.beginPath(); hg.roundRect ? hg.roundRect(4, 4, 504, 88, 18) : hg.rect(4, 4, 504, 88); hg.fill();
    hg.fillStyle = '#fff'; hg.font = 'bold 30px Arial, sans-serif'; hg.textAlign = 'center'; hg.textBaseline = 'middle'; hg.fillText('Pull trigger: go to the launch pad', 256, 50); ht.needsUpdate = true; };
  const ht = new THREE.CanvasTexture(hc); ht.colorSpace = THREE.SRGBColorSpace;
  const hint = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 0.234), new THREE.MeshBasicMaterial({map: ht, transparent: true, toneMapped: false, depthWrite: false}));
  hint.position.set(g.position.x, g.position.y + 2.95, g.position.z); hint.rotation.y = ry; hint.renderOrder = 6; root.add(hint); draw(false);
  const mats = []; g.traverse(o => { if (o.isMesh && o.material && o.material.emissive) mats.push([o.material, o.material.emissive.getHex()]); });
  const hover = on => { for (const [m, e] of mats) m.emissive.setHex(on ? 0x553322 : e); draw(on); };
  anim.push(() => { const c = W3D._cam && W3D._cam.object3D; if (c) { const p = c.getWorldPosition(W3D._v2 || (W3D._v2 = new THREE.Vector3())); hint.rotation.y = Math.atan2(p.x - hint.position.x, p.z - hint.position.z); } });
  const go = () => { if (W3D.spots && W3D.spots.launchpad) { if (window.goWorld) window.goWorld('launchpad'); else W3D.spots.launchpad(); JFVR.hud && JFVR.hud('Launch pad near Bridgewater - point at the rocket and pull the trigger to launch'); } };
  const make = () => { const sc = document.querySelector('a-scene'); if (!sc || !sc.hasLoaded) return setTimeout(make, 200);
    const wp = g.getWorldPosition(new THREE.Vector3()), e = document.createElement('a-entity');
    e.setAttribute('class', 'btn'); e.setAttribute('id', 'mars-rocket'); e.setAttribute('position', wp.x + ' ' + (wp.y + 1.25) + ' ' + wp.z);
    e.setAttribute('geometry', 'primitive: cylinder; radius: 0.42; height: 2.7'); e.setAttribute('material', 'shader: flat; transparent: true; opacity: 0; depthWrite: false');
    e.addEventListener('mouseenter', () => hover(true)); e.addEventListener('mouseleave', () => hover(false));
    e.addEventListener('click', ev => { const ce = ev.detail && ev.detail.cursorEl, lc = ce && ce.getAttribute && ce.getAttribute('laser-controls'); if (lc && /left/.test(typeof lc === 'string' ? lc : lc.hand)) return; go(); });   // right trigger, mouse or tap; the left hand keeps the menu
    sc.appendChild(e); W3D.padLink = {el: e, go}; };
  make();
}
W3D.tickRooms = function (t, dt) {
  const cam = W3D._cam || (W3D._cam = document.querySelector('[camera]'));
  if (cam) { const p = cam.object3D.getWorldPosition(W3D._v || (W3D._v = new THREE.Vector3())); if (p.x < 900 || p.x > 990 || p.z > -380 || p.z < -450) return; } // only animate when nearby
  for (const f of anim) f(t, dt || 16);
};
// teleport spots used by the #vrbar / #ui menu entries (data-w="propulsion" / "ufo")
const addSpots = () => { if (!W3D.spots) return setTimeout(addSpots, 50);
  W3D.spots.propulsion = () => W3D.teleportTo(933, L ? fy : 34.3, -403.5, 0);
  W3D.spots.ufo = () => W3D.teleportTo(957, L ? fy : 34.3, -403.5, 0); };
addSpots();
})();
