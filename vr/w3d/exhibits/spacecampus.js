/* Space + Musk-companies campus (T-30, Nov 27 2026): six small exhibit modules sharing kit.js, each FPX.<name>.build(opts).
   planet   - Planet Labs: NASA Blue Marble globe (public domain) + a Dove CubeSat orbiting overhead, history panel, public-domain NASA photo.
   starmind - SpaceX Starmind: a full-size low-poly AI1 satellite (30 m tall, 75 m wingspan) in a slow loop overhead + panel (spacex.com/spacexsi/starmind).
   terafab  - Terafab chip fab: a small concept model + panel (SpaceX / Tesla announcements Mar + Aug 2026, TechCrunch, Electrek, Reuters).
   tesla    - Cybertruck, Model Y, Megapack, Optimus figure (all low-poly, no logos) + history panel.
   boring   - The Boring Company: tunnel portal + 50 m Loop tunnel you can ride through in a car (FPX.ride) + panel.
   solarcity- SolarCity: house with a dark solar roof, ground array, history panel incl. the 2016 Tesla merger.
   Each: origin at ground, faces +z. Public facts only, checked Nov 27 2026. No logos (text names only). */
(function () {
  'use strict';
  const FPX = window.FPX = window.FPX || {};
  const FY = 0.2, FOOT = 'Curated through connections made at the Foresight Institute';
  const disposer = (group, getBtns) => () => { const b = getBtns(); if (b) b.dispose(); group.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } }); if (group.parent) group.parent.remove(group); };
  function board(group, P, blocks, w, h, x, z, ry, opts) { const m = FPX.panel(w, h, blocks, opts); m.position.set(x, FY + 0.6 + h / 2, z); m.rotation.y = ry || 0; group.add(m);
    const c = Math.cos(ry || 0), s = Math.sin(ry || 0); for (const k of [-1, 1]) P.box(0.1, 0.6 + h, 0.1, x + k * (w / 2 - 0.1) * c - 0.06 * s, FY + (0.6 + h) / 2, z - k * (w / 2 - 0.1) * s - 0.06 * c, 0x333333); return m; }
  function linkBtn(group, P, label, url, x, z, ry, specs) { const m = FPX.panel(1.8, 0.36, [{t: label, s: 'sub', fit: true, c: '#111'}], {bg: '#FFD700', frame: '#7a5c12', center: true}); m.position.set(x, FY + 0.35, z); m.rotation.y = ry || 0; group.add(m);
    specs.push({x: x + Math.sin(ry || 0) * 0.02, y: FY + 0.35, z: z + Math.cos(ry || 0) * 0.02, w: 1.8, h: 0.36, ry: ry || 0, onClick: () => FPX.link(url, label)}); }
  const pad = (P, w, d, col) => P.box(w, 1.6, d, 0, FY - 0.8, 0, col || 0x8f8a80);
  function finish(group, P, specs, extra) { group.add(P.mesh({rough: 0.75})); let btns = null;
    return Object.assign({group, mountButtons() { if (!btns) btns = FPX.buttons(group, specs); return btns; }, get buttons() { return btns; }, floorY: FY, walls: [], dispose: disposer(group, () => btns)}, extra || {}); }

  /* ---------------- Planet Labs ---------------- */
  function doveParts(P, s) { P.box(0.1 * s, 0.1 * s, 0.34 * s, 0, 0, 0, 0xcfd3d8); P.box(0.11 * s, 0.003 * s, 0.33 * s, 0.105 * s, 0.05 * s, 0, 0x1a2a5a); P.box(0.11 * s, 0.003 * s, 0.33 * s, -0.105 * s, 0.05 * s, 0, 0x1a2a5a);
    P.cyl(0.03 * s, 0.03 * s, 0.03 * s, 10, 0, -0.065 * s, 0.1 * s, 0x111111); return P; }
  FPX.planet = {build(opts) { opts = opts || {}; const group = new THREE.Group(); group.name = 'fpx-planet'; const P = FPX.parts(), specs = [];
    pad(P, 9, 8); P.cyl(0.5, 0.7, 1.0, 16, 0, FY + 0.5, 0, 0x6d7378);
    const globe = new THREE.Mesh(new THREE.SphereGeometry(1.4, opts.lite ? 24 : 40, opts.lite ? 16 : 28), new THREE.MeshBasicMaterial({map: FPX.tex('bluemarble.jpg'), toneMapped: false})); globe.position.set(0, FY + 2.5, 0); globe.rotation.z = 0.41; group.add(globe);
    const DP = FPX.parts(); doveParts(DP, 10); const dove = DP.mesh({metal: 0.4}); group.add(dove);   // shown 10x real size so you can see it
    const orbit = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.01, 4, 64), new THREE.MeshBasicMaterial({color: 0x9ffcff, transparent: true, opacity: 0.5})); orbit.position.copy(globe.position); orbit.rotation.x = Math.PI / 2 - 0.2; group.add(orbit);
    const mini = FPX.parts(); doveParts(mini, 1.4); const mdove = mini.mesh({metal: 0.4}); group.add(mdove);
    board(group, P, [{t: 'Planet', s: 'title'}, {t: 'Imaging all of Earth\u2019s land every day', s: 'sub'},
      {t: 'Founded on Dec 29, 2010 (first named Cosmogia) by former NASA scientists Will Marshall, Robbie Schingler and Chris Boshuizen, who built their first satellite in a Cupertino garage.'},
      {t: 'Doves: shoebox-sized 3U CubeSats (about 10 x 10 x 30 cm) with a telescope and camera, launched by the hundred. First Doves: April 2013.'},
      {t: 'Feb 15, 2017: 88 Doves on one Indian PSLV rocket, a record at the time; by July 2017 Planet could image Earth\u2019s whole landmass daily. April 2017: bought Terra Bella (SkySat, sub-metre imaging) from Google.'},
      {t: 'Pelican, the ~50 cm successor to SkySat: demo Pelican-1 launched Nov 2023, Pelican-2 Jan 2025.', s: 'small'},
      {t: 'Globe: NASA Blue Marble (public domain, NASA Goddard). Photo: Doves leaving the ISS, 2014 (NASA, public domain). No Planet imagery is shown here.', s: 'small', c: '#ffe9a8'}],
      3.4, 3.1, -2.6, -2.6, 0.5, {foot: FOOT});
    const ph = FPX.panel(1.9, 1.35, [], {frame: '#d4af37'}); const im = new Image(); im.onload = () => { const c = ph.userData.canvas, g = c.getContext('2d'); g.drawImage(im, 14, 14, c.width - 28, c.height - 28); ph.material.map.needsUpdate = true; }; im.src = FPX.base + 'img/p1.jpg';
    ph.position.set(2.7, FY + 1.6, -2.4); ph.rotation.y = -0.5; group.add(ph);
    linkBtn(group, P, 'Visit planet.com', 'https://www.planet.com', -2.6, -2.5, 0.5, specs);
    return finish(group, P, specs, {spawn: {x: 0, z: 7, yawDeg: 0}, footprint: {x0: -4.5, x1: 4.5, z0: -4, z1: 4},
      update(t) { globe.rotation.y = t * 0.08; const a = t * 0.35; mdove.position.set(globe.position.x + Math.cos(a) * 2.2, globe.position.y + Math.sin(a) * 2.2 * Math.sin(0.2), globe.position.z + Math.sin(a) * 2.2 * Math.cos(0.2)); mdove.rotation.y = -a;
        const b = t * 0.06; dove.position.set(Math.cos(b) * 26, FY + 28 + Math.sin(t * 0.2) * 1.5, Math.sin(b) * 26); dove.rotation.set(0, -b, 0.3); }}); }};

  /* ---------------- SpaceX Starmind (AI1) ---------------- */
  function ai1Parts(P, s) { const sol = 0x1b2c66, rad = 0xeef0f2, bus = 0x8d939b;
    P.box(2.2 * s, 30 * s, 2.2 * s, 0, 0, 0, bus);                                     // spine (deployed height 30 m)
    for (const k of [-1, 1]) { P.box(35 * s, 0.15 * s, 12 * s, k * 19.6 * s, 6 * s, 0, sol); P.box(1.5 * s, 0.3 * s, 0.3 * s, k * 1.8 * s, 6 * s, 0, bus); }   // solar wings: 75 m tip to tip
    for (const y of [-12, -6, 0]) P.box(0.12 * s, 5 * s, 14 * s, 0, y * s, 0, rad);   // radiators edge-on to the sun
    P.cyl(0.6 * s, 0.6 * s, 0.6 * s, 10, 0, 15.3 * s, 0, 0xd4af37); P.cyl(0.6 * s, 0.6 * s, 0.6 * s, 10, 0, -15.3 * s, 0, 0xd4af37);   // laser terminals
    return P; }
  FPX.starmind = {build(opts) { opts = opts || {}; const group = new THREE.Group(); group.name = 'fpx-starmind'; const P = FPX.parts(), specs = [];
    pad(P, 8, 6); P.box(1.2, 1.0, 1.2, 0, FY + 0.5, 0, 0x6d7378);
    const sat = FPX.parts(); ai1Parts(sat, 1); const big = sat.mesh({metal: 0.5, rough: 0.4}); group.add(big);
    const model = FPX.parts(); ai1Parts(model, 0.06); const mm = model.mesh({metal: 0.5, rough: 0.4}); mm.position.set(0, FY + 1.0 + 0.9, 0); group.add(mm);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1, 4, 1, true), new THREE.MeshBasicMaterial({color: 0x66ff99, transparent: true, opacity: 0.35, toneMapped: false})); group.add(beam);
    board(group, P, [{t: 'SpaceX Starmind - AI1', s: 'title', k: 0.9}, {t: 'AI compute in orbit, powered by the sun', s: 'sub'},
      {t: 'AI1 is a planned satellite carrying its own AI computers. Deployed height 30 m, wingspan 75 m, compute payload up to 250 kW peak / 175 kW average, 75 kW per ton.'},
      {t: 'Power: in a sun-synchronous orbit the solar wings see near-constant sunlight, with no weather or grid limits. Cooling: heat radiates into the vacuum, so no chillers or cooling towers - SpaceX says this cuts cooling overhead by an order of magnitude.'},
      {t: 'Links: laser links join the satellites and send results to Earth through Starlink. Built to be chip-vendor agnostic.'},
      {t: 'Gigasat Factory, Bastrop, Texas: planned to build thousands of AI satellites, starting as soon as late 2027. Starship carries the mass to orbit.', s: 'small'},
      {t: 'Source: spacex.com/spacexsi/starmind (Nov 2026). The full-size AI1 overhead is a low-poly model.', s: 'small', c: '#ffe9a8'}], 3.6, 3.3, -2.7, -1.8, 0.35, {foot: FOOT});
    linkBtn(group, P, 'Open the Starmind page', 'https://www.spacex.com/spacexsi/starmind', -2.7, -1.7, 0.35, specs);
    return finish(group, P, specs, {spawn: {x: 0, z: 9, yawDeg: 0}, footprint: {x0: -4, x1: 4, z0: -3, z1: 3},
      update(t) { const a = t * 0.012; big.position.set(Math.cos(a) * 160, FY + 210, Math.sin(a) * 160 - 40); big.rotation.set(0, -a, 0.15); mm.rotation.y = t * 0.2;
        beam.position.set(big.position.x / 2, (big.position.y + FY + 2) / 2, big.position.z / 2); beam.scale.y = big.position.length(); beam.lookAt(group.localToWorld(new THREE.Vector3(0, FY + 2, 0))); beam.rotateX(Math.PI / 2); beam.visible = (t % 20) < 3; }}); }};

  /* ---------------- Terafab ---------------- */
  FPX.terafab = {build(opts) { const group = new THREE.Group(); group.name = 'fpx-terafab'; const P = FPX.parts(), specs = [];
    pad(P, 10, 8); P.box(5, 0.9, 3.2, 0, FY + 0.45, 0.4, 0x555a60);                          // model table
    P.box(4.4, 0.35, 2.4, 0, FY + 1.08, 0.4, 0xdfe3e6); for (let i = 0; i < 6; i++) P.box(0.5, 0.12, 2.0, -1.8 + i * 0.72, FY + 1.31, 0.4, 0xaab0b6);   // fab halls + roof units
    P.box(1.0, 0.25, 0.6, 1.4, FY + 1.03, 1.9, 0xc8ccd0); P.box(0.8, 0.02, 1.4, -2.9 + 0.6, FY + 0.91, -0.9, 0x3a6fa0);   // packaging hall, reservoir
    board(group, P, [{t: 'Terafab', s: 'title'}, {t: 'A Tesla + SpaceX AI chip fab (planned)', s: 'sub'},
      {t: 'Announced by Elon Musk in March 2026. On Aug 6, 2026 Tesla and SpaceX said it will be built in Grimes County, Texas, on the former Gibbons Creek power-plant site, with an initial phase of about $16.8 billion and more than 100 million square feet planned.'},
      {t: 'Plan: make, package and test advanced logic and memory chips in one place - edge and inference chips for Optimus robots and Cybercabs, and high-power chips for SpaceX\u2019s space-based data centers such as Starmind. A research fab broke ground at Giga Texas in April 2026.'},
      {t: 'Plans and figures have changed since the first announcement and may change again. Model not to scale. Sources: spacex.com Starmind page; TechCrunch, Electrek (Aug 6, 2026); Reuters (Mar 22, 2026).', s: 'small', c: '#ffe9a8'}], 3.6, 3.0, 0, -3.0, 0, {foot: FOOT});
    return finish(group, P, specs, {spawn: {x: 0, z: 7, yawDeg: 0}, footprint: {x0: -5, x1: 5, z0: -4, z1: 4}}); }};

  /* ---------------- Tesla ---------------- */
  const prof = (pts, w) => { const s = new THREE.Shape(); pts.forEach(([x, y], i) => i ? s.lineTo(x, y) : s.moveTo(x, y)); const g = new THREE.ExtrudeGeometry(s, {depth: w, bevelEnabled: false}); g.translate(0, 0, -w / 2); return g; };
  function car(P, pts, w, col, x, z, ry, wr, wx) { P.add(prof(pts, w), col, x, FY, z, 0, ry, 0); const c = Math.cos(ry), s = Math.sin(ry);
    for (const ax of wx) for (const k of [-1, 1]) { const lx = ax, lz = k * (w / 2 - 0.05); P.cyl(wr, wr, 0.3, 14, x + lx * c + lz * s, FY + wr, z - lx * s + lz * c, 0x151515, 0, ry + Math.PI / 2, Math.PI / 2); } }
  FPX.carParts = car;
  FPX.tesla = {build(opts) { const group = new THREE.Group(); group.name = 'fpx-tesla'; const P = FPX.parts(), specs = [];
    pad(P, 22, 12, 0x5a5d61);
    car(P, [[-2.85, 0.45], [2.85, 0.45], [2.85, 1.05], [0.1, 1.9], [-2.85, 1.35]], 2.0, 0xb8bcc0, -6, 1, 0.3, 0.45, [-1.9, 1.9]);          // Cybertruck (stainless, wedge)
    car(P, [[-2.35, 0.32], [2.35, 0.32], [2.35, 0.8], [1.4, 1.0], [0.4, 1.6], [-1.3, 1.62], [-2.35, 1.05]], 1.9, 0xa3121c, -0.5, 1.5, 0.2, 0.38, [-1.45, 1.45]);   // Model Y
    P.box(7.2, 2.5, 1.6, 6.4, FY + 1.25, -1.6, 0xf2f2f2); for (let i = 0; i < 8; i++) P.box(0.04, 2.2, 0.02, 3.2 + i * 0.9, FY + 1.25, -0.79, 0x9aa0a6);   // Megapack
    // Optimus (about 1.73 m): white shell, black visor/joints
    const ox = 3.2, oz = 2.2, wh = 0xeeeeee, bk = 0x1c1c1c;
    for (const k of [-1, 1]) { P.box(0.13, 0.42, 0.14, ox + k * 0.11, FY + 0.21, oz, bk); P.box(0.14, 0.42, 0.15, ox + k * 0.11, FY + 0.63, oz, wh); P.box(0.1, 0.5, 0.11, ox + k * 0.29, FY + 1.17, oz, wh); P.box(0.09, 0.1, 0.1, ox + k * 0.29, FY + 0.86, oz, bk); }
    P.box(0.4, 0.55, 0.24, ox, FY + 1.17, oz, wh); P.box(0.34, 0.12, 0.2, ox, FY + 0.88, oz, bk); P.box(0.18, 0.22, 0.2, ox, FY + 1.6, oz, wh); P.box(0.16, 0.08, 0.02, ox, FY + 1.62, oz + 0.1, bk); P.box(0.07, 0.07, 0.07, ox, FY + 1.47, oz, bk);
    board(group, P, [{t: 'Tesla', s: 'title'}, {t: 'Cars, batteries, robots', s: 'sub'},
      {t: 'Tesla Motors was incorporated in 2003 by Martin Eberhard and Marc Tarpenning. Elon Musk led its 2004 funding round, became chairman and later CEO. It became Tesla, Inc. in 2017 and took over SolarCity in 2016.'},
      {t: 'Cars: Roadster 2008, Model S 2012, Model X 2015, Model 3 2017, Model Y 2020, Cybertruck deliveries from Nov 2023. In Jan 2026 Musk said Model S and X would end in 2026 to make room for Optimus production.'},
      {t: 'Energy: Powerwall home batteries (unveiled April 2015) and Megapack utility-scale batteries (2019). Robots: the Optimus humanoid was announced in 2021, with prototypes shown since 2022.'},
      {t: 'Models here are simple low-poly shapes, not to scale in detail. Text names only, no logos.', s: 'small', c: '#ffe9a8'}], 3.6, 3.0, -1.0, -4.0, 0, {foot: FOOT});
    linkBtn(group, P, 'Visit tesla.com', 'https://www.tesla.com', -1.0, -3.9, 0, specs);
    return finish(group, P, specs, {spawn: {x: 0, z: 10, yawDeg: 0}, footprint: {x0: -11, x1: 11, z0: -6, z1: 6}}); }};

  /* ---------------- The Boring Company: portal + Loop tunnel ride ---------------- */
  FPX.boring = {build(opts) { opts = opts || {}; const group = new THREE.Group(); group.name = 'fpx-boring'; const P = FPX.parts(), specs = [], TL = 50, TR = 1.9, seg = opts.lite ? 12 : 18;
    pad(P, 12, 14); P.box(5.5, 0.04, 10, 0, FY + 0.02, 2, 0x2f3236);                              // approach ramp / station floor
    const lining = new THREE.Mesh(new THREE.CylinderGeometry(TR, TR, TL, seg, 1, true), new THREE.MeshStandardMaterial({color: 0x8a8d91, roughness: 0.9, side: THREE.DoubleSide})); lining.rotation.x = Math.PI / 2; lining.position.set(0, FY + TR - 0.3, -TL / 2 - 3); group.add(lining);
    P.add(new THREE.CylinderGeometry(TR + 3, TR + 3.5, TL, seg, 1, true, Math.PI / 2, Math.PI), 0x5e7a3c, 0, FY - 0.3, -TL / 2 - 3, Math.PI / 2, 0, 0);   // grassy berm over it (half cylinder)
    for (const k of [-1, 1]) P.box(3.6, 5, 0.6, k * (TR + 1.8), FY + 2.5, -3, 0x9a9da2); P.box(2 * TR, 1.3, 0.6, 0, FY + 2 * TR - 0.3 + 0.65, -3, 0x9a9da2);   // portal headwall with opening
    P.box(3.0, 0.06, TL, 0, FY - 0.25, -TL / 2 - 3, 0x2a2a2a);                                   // roadway inside
    P.box(11, 5, 0.6, 0, FY + 2.5, -TL - 3.3, 0x9a9da2);                     // far end wall
    const LP = FPX.parts(); for (let i = 0; i < 10; i++) LP.box(0.12, 0.06, 2.2, TR * 0.78, FY + TR + 0.75, -5 - i * 5, 0xffffff); const lights = new THREE.Mesh(LP.geometry(), new THREE.MeshBasicMaterial({vertexColors: true, toneMapped: false})); group.add(lights);
    const CP = FPX.parts(); FPX.carParts(CP, [[-2.35, 0.32], [2.35, 0.32], [2.35, 0.8], [1.4, 1.0], [0.4, 1.6], [-1.3, 1.62], [-2.35, 1.05]], 1.9, 0xf2f2f2, 0, 0, Math.PI / 2, 0.38, [-1.45, 1.45]);
    const carM = CP.mesh({metal: 0.3}); carM.position.set(0, 0, 3.5); group.add(carM);
    board(group, P, [{t: 'The Boring Company', s: 'title', k: 0.9}, {t: 'Loop: electric cars in tunnels', s: 'sub'},
      {t: 'Elon Musk floated the idea in a December 2016 post about Los Angeles traffic. The company was registered in January 2017 as a SpaceX subsidiary and spun out as its own company in 2018.'},
      {t: 'Its first system, the Las Vegas Convention Center Loop (1.7 miles, three stations) opened in 2021, with Tesla cars carrying riders. The wider Vegas Loop now links resorts and stadium stops using Tesla Model Y cars; the company projects 68 miles of tunnels and 123 stations when complete.'},
      {t: 'Press "Ride the Loop" for a short trip through this 50 m tunnel; you come back here at the end.', s: 'small', c: '#ffe9a8'}], 3.4, 2.9, -4.6, 1.5, 0.6, {foot: FOOT});
    let riding = false; const ride = () => { if (riding || !FPX.ride) return; riding = true; carM.visible = false; group.updateMatrixWorld(true); const W = v => group.localToWorld(new THREE.Vector3(v[0], v[1], v[2]));
      const eye = FY + 1.15, pts = [[0, eye, 3.5], [0, eye, -2], [0, eye, -20], [0, eye, -40], [0, eye, -TL - 1]].map(W);
      FPX.ride({points: pts, dur: 14, label: 'Loop ride - back at the portal in 14 s', 
        onEnd() { riding = false; carM.visible = true; carM.position.set(0, 0, 3.5); }}); };
    const rb = FPX.panel(1.9, 0.6, [{t: 'Ride the Loop', s: 'big', k: 0.6, fit: true}], {bg: '#FFD700', frame: '#7a5c12', center: true}); rb.position.set(2.6, FY + 1.3, 3.6); rb.rotation.y = -0.6; group.add(rb);
    P.box(0.1, 1.0, 0.1, 2.6, FY + 0.5, 3.5, 0x333333);
    specs.push({x: 2.6 - 0.012, y: FY + 1.3, z: 3.6 + 0.016, w: 1.9, h: 0.6, ry: -0.6, onClick: ride});
    linkBtn(group, P, 'Visit boringcompany.com', 'https://www.boringcompany.com', -4.6, 1.6, 0.6, specs);
    return finish(group, P, specs, {spawn: {x: 0, z: 11, yawDeg: 0}, ride, footprint: {x0: -6, x1: 6, z0: -TL - 4, z1: 7}}); }};

  /* ---------------- SolarCity ---------------- */
  FPX.solarcity = {build(opts) { const group = new THREE.Group(); group.name = 'fpx-solarcity'; const P = FPX.parts(), specs = [];
    pad(P, 16, 12, 0x6f8a4a);
    P.box(7, 3, 5, -3, FY + 1.5, -1.5, 0xe9e1cf); P.box(1.0, 2.1, 0.06, -3, FY + 1.05, 1.03, 0x6b4a2e);
    const RP = FPX.parts(); for (const k of [-1, 1]) RP.add(new THREE.BoxGeometry(7.4, 0.1, 3.2), 0x141a2c, -3, FY + 3.86, -1.5 + k * 1.25, k * 0.583, 0, 0);
    const roof = new THREE.Mesh(RP.geometry(), new THREE.MeshStandardMaterial({vertexColors: true, roughness: 0.25, metalness: 0.4})); group.add(roof);
    const gable = new THREE.Mesh(prof([[-2.5, 0], [2.5, 0], [0, 1.65]], 7.0), new THREE.MeshStandardMaterial({color: 0xe9e1cf})); gable.rotation.y = Math.PI / 2; gable.position.set(-3, FY + 3, -1.5); group.add(gable);
    const arr = new THREE.InstancedMesh(new THREE.BoxGeometry(1.0, 0.05, 1.7), new THREE.MeshStandardMaterial({color: 0x1a2a5a, roughness: 0.25, metalness: 0.5}), 12); const m4 = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.55, 0, 0));
    for (let i = 0; i < 12; i++) { m4.compose(new THREE.Vector3(2.0 + (i % 6) * 1.1, FY + 0.9, -2.2 + Math.floor(i / 6) * 2.4), q, new THREE.Vector3(1, 1, 1)); arr.setMatrixAt(i, m4); P.box(0.06, 0.8, 0.06, 2.0 + (i % 6) * 1.1, FY + 0.4, -2.2 + Math.floor(i / 6) * 2.4, 0x777777); } group.add(arr);
    board(group, P, [{t: 'SolarCity', s: 'title'}, {t: 'Rooftop solar, 2006 - 2016', s: 'sub'},
      {t: 'Founded on July 4, 2006 by brothers Lyndon and Peter Rive, cousins of Elon Musk, who suggested the idea and was its chairman. It sold and installed solar systems for homes and businesses, and listed on Nasdaq in 2012.'},
      {t: 'On Aug 1, 2016 Tesla agreed to buy SolarCity in an all-stock deal worth about $2.6 billion; shareholders approved it and it closed on Nov 21, 2016. The business became part of Tesla Energy. Some investors criticised the deal.'},
      {t: 'The house roof here is a simple solar-roof look; the ground array is a generic panel rack. Text names only, no logos.', s: 'small', c: '#ffe9a8'}], 3.4, 2.9, 4.2, 2.8, -0.4, {foot: FOOT});
    return finish(group, P, specs, {spawn: {x: 0, z: 10, yawDeg: 0}, footprint: {x0: -8, x1: 8, z0: -6, z1: 6}}); }};
})();
