/* Cap'n Crunch Phreaking Lab (T-30, Nov 27 2026). A small brick lab: a pressable blue box replica that plays the historical MF tone
   pairs (WebAudio), a toy-whistle stand that plays 2600 Hz, panels on John Draper / phone phreaking and on Wozniak, Jobs and Apple,
   and a ham-radio skywave corner (radio desk, mast + dipole, ionosphere diagram, Morse button). Facts checked Nov 27 2026 against
   Wikipedia (John Draper, Blue box, Skywave), woz.org/blue-box, The Atlantic (2013) and johndraper.us.
   FPX.phreaklab.build(opts). Local frame: origin = doorway centre at ground, door faces +z, room x -5..5, z -9..0. */
(function () {
  'use strict';
  const FPX = window.FPX = window.FPX || {};
  const FY = 0.25, W = 10, D = 9, H = 3.6, FOOT = 'Curated through connections made at the Foresight Institute';
  const DRAPER = [{t: 'John Draper - "Captain Crunch"', s: 'title', k: 0.85}, {t: 'Phone phreaking, 1960s - 1970s', s: 'sub'},
    {t: 'A toy bosun\u2019s whistle given away in Cap\u2019n Crunch cereal could blow 2600 Hz - the tone AT&T\u2019s long-distance network used to mark an idle trunk line. Another phreak made that discovery; Draper took his nickname from it.'},
    {t: 'An Air Force veteran and radio hobbyist, Draper joined the phone phreaks around 1969 and built "blue boxes": tone generators for 2600 Hz plus the multi-frequency (MF) digits the network used for routing.'},
    {t: 'A 1971 Esquire article made him famous. Using the tones for free calls was illegal, and he was convicted of toll fraud more than once in the 1970s.'},
    {t: 'He became a programmer: EasyWriter for the Apple II (1979), later work at Autodesk and in security. His memoir with C. Wilson Fraser, Beyond the Little Blue Box, came out in 2018.', s: 'small'},
    {t: 'johndraper.us', s: 'sub', c: '#FFD700'}];
  const WOZ = [{t: 'Wozniak, Jobs and the blue box', s: 'title', k: 0.85},
    {t: 'In 1971 Steve Wozniak read "Secrets of the Little Blue Box" in Esquire, which featured Captain Crunch. He and Steve Jobs found the tone frequencies in a technical library at SLAC.'},
    {t: 'Wozniak designed a digital blue box; the two built and sold blue boxes before they founded Apple. Wozniak got in touch with Draper and they compared techniques (accounts of the first meeting differ).'},
    {t: 'In 1977 Draper worked for Apple as an independent contractor: Wozniak asked him to build a board that connected the Apple II to phone lines (the "Charley Board"). It never became a product.'},
    {t: 'Sources: woz.org/blue-box; The Atlantic, Feb 2013; Wikipedia: John Draper.', s: 'small'}];
  const SKY = [{t: 'Ham radio: skywave', s: 'title', k: 0.85}, {t: 'Bouncing signals off the sky', s: 'sub'},
    {t: 'The ionosphere (about 80-1,000 km up) is air ionised by sunlight. Shortwave (HF, 3-30 MHz) signals sent up at a low angle bend back to Earth, so they can "skip" far past the horizon - sometimes several hops around the world on a few watts.'},
    {t: 'By night the lower layers fade, so bands below about 10 MHz reach farther; higher bands work best by day. Above about 30 MHz signals usually pass straight through.'},
    {t: 'Amateurs are credited with discovering shortwave skywave; by 1924 they made two-way contacts across the Atlantic and Pacific. Anyone may listen; transmitting needs an amateur licence (FCC in the U.S.).', s: 'small'}];
  const BOX = [{t: 'Blue box (replica)', s: 'sub', c: '#FFD700'}, {t: 'Press a key to hear its MF tone pair. KP starts a number, ST ends it. "2600" is the whistle tone.', s: 'small'},
    {t: 'These tones no longer control any phone network: today\u2019s networks signal on separate digital channels (SS7 and successors).', s: 'small', c: '#ffe9a8'}];
  const KEYS = [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['KP', '0', 'ST']];
  function build(opts) { opts = opts || {}; const group = new THREE.Group(); group.name = 'fpx-phreaklab';
    const P = FPX.parts(), brick = 0x8a4b36, trim = 0xd8cdb4;
    P.box(W + 1.2, 2.4, D + 3, 0, FY - 1.2, -D / 2 + 1, 0x8f8a80);                         // plinth into the ground
    P.box(W - 0.3, 0.04, D - 0.3, 0, FY + 0.02, -D / 2, 0x3a3f46);                         // floor
    P.box(W, H, 0.3, 0, FY + H / 2, -D, brick); for (const s of [-1, 1]) P.box(0.3, H, D, s * (W / 2 - 0.15), FY + H / 2, -D / 2, brick);
    for (const s of [-1, 1]) P.box(W / 2 - 1.6, H, 0.3, s * (W / 4 + 0.8), FY + H / 2, -0.15, brick);
    P.box(3.2, H - 2.6, 0.3, 0, FY + 2.6 + (H - 2.6) / 2, -0.15, brick);                       // lintel over the door (2.6 m clear)
    P.box(W + 0.6, 0.3, D + 0.6, 0, FY + H + 0.15, -D / 2, trim);                             // roof slab
    P.box(1.8, 0.85, 0.9, 0, FY + 0.42, -4.6, 0x5b4636); P.box(1.9, 0.05, 1.0, 0, FY + 0.87, -4.6, 0x2b2b2b);   // blue-box table
    P.box(0.62, 0.14, 0.44, 0, FY + 0.96, -4.6, 0x1f55c8);                                      // the blue box itself
    P.box(0.12, 1.1, 0.12, 2.6, FY + 0.55, -1.8, 0x333333); P.box(0.4, 0.05, 0.4, 2.6, FY + 1.12, -1.8, 0x333333);
    P.cyl(0.018, 0.022, 0.1, 10, 2.6, FY + 1.2, -1.8, 0xf0c020, 0, 0, Math.PI / 2);             // toy whistle
    // ham corner: desk + radio + mast and dipole on the roof
    P.box(2.2, 0.06, 0.8, -3.6, FY + 0.78, -7.9, 0x7b5a3a); for (const sx of [-1, 1]) P.box(0.06, 0.78, 0.7, -3.6 + sx * 1.05, FY + 0.39, -7.9, 0x333333);
    P.box(0.7, 0.28, 0.4, -3.9, FY + 0.95, -8.0, 0x26292e); P.box(0.4, 0.2, 0.3, -3.1, FY + 0.91, -8.0, 0x3c3f44); P.cyl(0.05, 0.05, 0.03, 12, -3.9, FY + 0.97, -7.79, 0xb0b0b0, Math.PI / 2);
    P.cyl(0.05, 0.07, 7, 8, -3.6, FY + H + 3.5, -7.5, 0x9aa0a6);
    P.cyl(0.012, 0.012, 9, 4, -3.6, FY + H + 6.6, -7.5, 0x333333, 0, 0, Math.PI / 2 - 0.35);     // dipole (inverted-V halves)
    // payphone on the east wall
    P.box(0.12, 0.8, 0.45, W / 2 - 0.36, FY + 1.5, -6.2, 0x6d7378); P.box(0.08, 0.35, 0.12, W / 2 - 0.48, FY + 1.55, -6.0, 0x111111);
    group.add(P.mesh({rough: 0.85}));
    const sign = FPX.panel(3.4, 0.5, [{t: "CAP'N CRUNCH PHREAKING LAB", s: 'title', fit: true}], {center: true}); sign.position.set(0, FY + 3.1, 0.02); group.add(sign);
    const pd = FPX.panel(3.4, 3.0, DRAPER, {foot: FOOT}); pd.position.set(-2.1, FY + 1.95, -D + 0.16); group.add(pd);
    const pw = FPX.panel(3.0, 2.6, WOZ); pw.position.set(2.2, FY + 1.95, -D + 0.16); group.add(pw);
    const ps = FPX.panel(3.2, 2.6, SKY, {draw(g, w, h) {   // ionosphere sketch at the bottom
      const y0 = h - 40, R = w * 2.2, cx = w / 2; g.strokeStyle = '#5fa8ff'; g.lineWidth = 6; g.beginPath(); g.arc(cx, y0 + R, R, -Math.PI / 2 - 0.22, -Math.PI / 2 + 0.22); g.stroke();
      g.strokeStyle = '#d4af37'; g.setLineDash([10, 8]); g.beginPath(); g.arc(cx, y0 + R + 160, R + 260, -Math.PI / 2 - 0.2, -Math.PI / 2 + 0.2); g.stroke(); g.setLineDash([]);
      g.strokeStyle = '#ffe9a8'; g.lineWidth = 4; g.beginPath(); const xs = [120, 330, 540, 750, 930]; g.moveTo(xs[0], y0 - 6); for (let i = 1; i < xs.length; i++) g.lineTo(xs[i], i % 2 ? y0 - 150 : y0 - 6); g.stroke();
      g.fillStyle = '#9ffcff'; g.font = '22px Arial'; g.fillText('ionosphere', 40, y0 - 186); g.fillText('Earth', 40, y0 - 28); }});
    ps.position.set(-W / 2 + 0.16, FY + 1.95, -5.4); ps.rotation.y = Math.PI / 2; group.add(ps);
    // blue box top: canvas keypad, laid flat and tilted toward the visitor
    const kp = FPX.panel(0.56, 0.4, [], {bg: '#1f55c8', frame: '#0e2a66', draw(g, w, h) { g.font = 'bold 42px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle';
      for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { const x = 140 + c * 190, y = 70 + r * 140; g.fillStyle = '#e8e8e8'; g.fillRect(x - 70, y - 50, 140, 100); g.fillStyle = '#111'; g.fillText(KEYS[r][c], x, y); }
      g.fillStyle = '#f0c020'; g.fillRect(w - 230, 20, 200, h - 40); g.fillStyle = '#111'; g.fillText('2600', w - 130, h / 2); }, px: 1024});
    kp.rotation.x = -Math.PI / 2 + 0.35; kp.position.set(0, FY + 1.04, -4.6); group.add(kp);
    const pb = FPX.panel(1.8, 0.95, BOX, {center: true}); pb.position.set(0, FY + 1.6, -5.5); group.add(pb);
    const pwh = FPX.panel(1.2, 0.6, [{t: 'Blow the whistle', s: 'sub', c: '#111'}, {t: '2600 Hz', s: 'small', c: '#2a2410'}], {bg: '#FFD700', frame: '#7a5c12', center: true}); pwh.position.set(2.6, FY + 1.7, -1.78); group.add(pwh);
    const pm = FPX.panel(1.3, 0.5, [{t: 'Listen: Morse "CQ"', s: 'sub', c: '#111', fit: true}], {bg: '#9ffcff', frame: '#2a5a66', center: true}); pm.position.set(-3.6, FY + 1.55, -8.82); group.add(pm);
    const pl = FPX.panel(1.6, 0.36, [{t: 'Visit johndraper.us', s: 'sub', c: '#111', fit: true}], {bg: '#9ffcff', frame: '#2a5a66', center: true}); pl.position.set(-2.1, FY + 0.25 + 0.06, -D + 0.17); pl.position.y = FY + 0.3; group.add(pl);
    const hl = new THREE.Mesh(new THREE.PlaneGeometry(0.075, 0.05), new THREE.MeshBasicMaterial({color: 0xffff66, transparent: true, opacity: 0.6, toneMapped: false})); hl.visible = false; group.add(hl);
    // key geometry on the tilted keypad: local (u, v) on the 0.56 x 0.4 plane -> group coordinates
    const kq = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2 + 0.35, 0, 0));
    const onPad = (u, v) => new THREE.Vector3(u, v, 0.004).applyQuaternion(kq).add(new THREE.Vector3(0, FY + 1.04, -4.6));
    let btns = null, hlT = 0;
    function press(k, pos) { if (k === '2600') FPX.audio.whistle(1.0); else FPX.audio.mf(k); hl.position.copy(pos); hl.quaternion.copy(kq); hl.visible = true; clearTimeout(hlT); hlT = setTimeout(() => { hl.visible = false; }, 180); }
    function mountButtons() { if (btns) return btns; const specs = [], e = new THREE.Euler().setFromQuaternion(kq);
      for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { const u = -0.28 + (140 + c * 190) / 1024 * 0.56, v = 0.2 - (70 + r * 140) / 731 * 0.4, p = onPad(u, v), k = KEYS[r][c];
        specs.push({x: p.x, y: p.y, z: p.z, w: 0.075, h: 0.055, rx: e.x, onClick: () => press(k, p)}); }
      { const p = onPad(0.28 - 130 / 1024 * 0.56, 0); specs.push({x: p.x, y: p.y, z: p.z, w: 0.11, h: 0.36, rx: e.x, onClick: () => press('2600', p)}); }
      specs.push({x: 2.6, y: FY + 1.7, z: -1.76, w: 1.2, h: 0.6, onClick: () => FPX.audio.whistle(1.2)});
      specs.push({x: -3.6, y: FY + 1.55, z: -8.8, w: 1.3, h: 0.5, onClick: () => FPX.audio.morse('CQ CQ DE FP')});
      specs.push({x: -2.1, y: FY + 0.3, z: -D + 0.18, w: 1.6, h: 0.36, onClick: () => FPX.link('https://johndraper.us', 'johndraper.us')});
      btns = FPX.buttons(group, specs); return btns; }
    return {group, mountButtons, get buttons() { return btns; }, press,
      footprint: {x0: -W / 2 - 0.6, x1: W / 2 + 0.6, z0: -D - 0.5, z1: 2}, floorY: FY,
      walls: [{x0: -W / 2, x1: W / 2, z0: -D - 0.15, z1: -D + 0.15}, {x0: -W / 2 - 0.15, x1: -W / 2 + 0.3, z0: -D, z1: 0}, {x0: W / 2 - 0.3, x1: W / 2 + 0.15, z0: -D, z1: 0},
        {x0: -W / 2, x1: -1.6, z0: -0.3, z1: 0}, {x0: 1.6, x1: W / 2, z0: -0.3, z1: 0}],
      spawn: {x: 0, z: 4, yawDeg: 0},
      dispose() { if (btns) btns.dispose(); group.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } }); if (group.parent) group.parent.remove(group); }};
  }
  FPX.phreaklab = {build};
})();
