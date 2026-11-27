/* Foresight Institute exhibit (T-30, Nov 27 2026): an open round court with a slowly turning "molecular gear" sculpture and a ring of
   boards - Foresight history, the Foresight Tech Tree wall (focus areas, fellowships, grants, prizes, Existential Hope; Allison Duettmann),
   Gigafund / Luke Nosek, Steve Jurvetson (3 CC BY 2.0 photos from his Flickr via Wikimedia Commons, credited), and two MIRI panels
   (Singularity Institute history, AI alignment). Public history only, checked Nov 27 2026: foresight.org/about, foresight.org/impact2026,
   Wikipedia (Foresight Institute, Luke Nosek, Steve Jurvetson, MIRI), gigafund.com, space.com (Aug 2008), SpaceX press release
   (Aug 4 2008), intelligence.org/about, intelligence.org 2013 rename post, future.ventures/team, existentialhope.com, Flickr /jurvetson.
   FPX.foresight.build(opts). Local frame: origin = centre of the court at ground, entrance faces +z. Court radius 9. */
(function () {
  'use strict';
  const FPX = window.FPX = window.FPX || {};
  const FY = 0.3, RC = 9, RB = 7.2, FOOT = 'Curated through connections made at the Foresight Institute';
  const HIST = [{t: 'Foresight Institute', s: 'title'}, {t: 'Since 1986', s: 'sub'},
    {t: 'Founded in 1986 by Christine Peterson and Eric Drexler, inspired by Drexler\u2019s book Engines of Creation, to advance nanotechnology and other emerging technologies for the benefit of life.'},
    {t: '1989: first comprehensive conference on nanotechnology.  1993: the Feynman Prizes in Nanotechnology begin (winners David Baker and Sir Fraser Stoddart later won Nobel Prizes).  1998: Christine Peterson coins the term "open source software".', s: 'small'},
    {t: 'Today: grants, fellowships, prizes and workshops in molecular nanotechnology, longevity biotech, neurotech, secure AI and space.'},
    {t: 'foresight.org', s: 'sub', c: '#FFD700'}];
  const TREE = [{t: 'The Foresight Tech Tree', s: 'title', k: 0.9},
    {t: 'Like the tech tree in a strategy game: each field is mapped from today\u2019s capabilities to long-term goals, with who is working on what and which open challenges are still waiting for people and funders.'},
    {t: 'Allison Duettmann joined Foresight in 2015, led it as President and CEO until October 2026 and now serves on its board. She led its tech trees, fellowships, grants and prizes, and founded existentialhope.com - a hub for picturing good futures and working toward them.', s: 'small'}];
  const AREAS = [['Molecular nanotech', 'atomically precise manufacturing'], ['Longevity biotech', 'health extension'], ['Neurotech', 'brain-computer, whole-brain'], ['Secure AI', 'intelligent cooperation'], ['Space', 'settlement and industry']];
  const NOSEK = [{t: 'Gigafund - Luke Nosek', s: 'title', k: 0.85},
    {t: 'Luke Nosek co-founded PayPal (started in 1998 as Confinity with Max Levchin, Peter Thiel, Yu Pan and Ken Howery). eBay bought PayPal for $1.5 billion in 2002.'},
    {t: 'In 2005 he co-founded Founders Fund with Thiel and Howery. In August 2008 Founders Fund invested $20 million in SpaceX and Nosek joined SpaceX\u2019s board; Gigafund describes him as the first venture-capital investor to back SpaceX.'},
    {t: 'In 2017 he co-founded Gigafund, which says it has invested over $1 billion in SpaceX and backs ambitious, long-horizon founders.', s: 'small'}];
  const JURV = [{t: 'Steve Jurvetson', s: 'title', k: 0.85}, {t: 'Frontier-tech investor and photographer', s: 'sub'},
    {t: 'Co-founder of the venture firm Draper Fisher Jurvetson (DFJ) and, since 2018, Future Ventures. Early investor and board member at SpaceX (on its board today) and Tesla (board 2006-2020); early investments also include Planet, D-Wave and Hotmail.'},
    {t: 'His Flickr archive holds thousands of photos of rockets, chips and labs, all free to reuse with the credit "photo by Jurvetson (flickr)".', s: 'small'}];
  const MIRI1 = [{t: 'Singularity Institute \u2192 MIRI', s: 'title', k: 0.8},
    {t: '2000: Eliezer Yudkowsky, with Brian and Sabine Atkins, founds the Singularity Institute for Artificial Intelligence.'},
    {t: '2006: it starts the Singularity Summit (first held at Stanford) on AI, robotics, brain-computer interfaces and regenerative medicine; Yudkowsky\u2019s essays seed the LessWrong community.'},
    {t: 'Dec 2012: the Summit and name go to Singularity University; Jan 2013 it becomes the Machine Intelligence Research Institute (MIRI), Berkeley.', s: 'small'}];
  const MIRI2 = [{t: 'The alignment problem', s: 'title', k: 0.85},
    {t: 'How do you make a system much smarter than us reliably do what we actually want? MIRI was among the first to treat AI alignment as a technical research problem.'},
    {t: 'Since 2013 it has worked on foundational maths for alignment and run research workshops; today it focuses on research and public outreach to prevent catastrophe from artificial superintelligence.'},
    {t: 'intelligence.org', s: 'sub', c: '#FFD700'}];
  const CREDIT = 'Photos: Steve Jurvetson (flickr), CC BY 2.0, via Wikimedia Commons - Falcon Heavy at Pad 39A; Falcon 9 Octaweb; D-Wave 2000-qubit processor';
  function build(opts) { opts = opts || {}; const lite = !!opts.lite, group = new THREE.Group(); group.name = 'fpx-foresight';
    const P = FPX.parts();
    P.cyl(RC, RC + 0.3, 2.2, lite ? 20 : 32, 0, FY - 1.1, 0, 0xd8cdb4);                       // round court (plinth into the ground)
    P.cyl(1.6, 1.8, 0.7, 20, 0, FY + 0.35, 0, 0xbfb39a);                                       // sculpture base
    const angs = [-150, -112, -75, -38, 0, 38, 75, 112, 150].map(a => a * Math.PI / 180);        // boards around the ring (gap at +z)
    for (const a of angs) { const x = Math.sin(a + Math.PI) * RB, z = Math.cos(a + Math.PI) * RB; P.box(2.9, 0.12, 0.14, x, FY + 0.12, z, 0x333333, a); }
    group.add(P.mesh({rough: 0.8}));
    // molecular gear: atoms on two interlocking rings, one instanced mesh
    const atoms = [], ring = (n, r, cy, tilt, ox) => { for (let i = 0; i < n; i++) { const t = i / n * Math.PI * 2; const v = new THREE.Vector3(Math.cos(t) * r, Math.sin(t) * r * Math.cos(tilt), Math.sin(t) * r * Math.sin(tilt)); v.x += ox; v.y += cy; atoms.push([v, i % 3 === 0 ? 0xd94a3a : (i % 3 === 1 ? 0x3a6fd9 : 0xe8e8e8)]); } };
    ring(lite ? 18 : 26, 1.1, FY + 2.2, 0, -0.7); ring(lite ? 18 : 26, 1.1, FY + 2.2, Math.PI / 2, 0.7);
    const im = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.16, lite ? 0 : 1), new THREE.MeshStandardMaterial({roughness: 0.35, metalness: 0.2}), atoms.length);
    const gear = new THREE.Group(); gear.position.set(0, 0, 0); const m4 = new THREE.Matrix4(), c = new THREE.Color();
    atoms.forEach(([v, col], i) => { m4.makeTranslation(v.x, v.y - FY - 2.2, v.z); im.setMatrixAt(i, m4); im.setColorAt(i, c.set(col)); }); im.position.y = FY + 2.2; gear.add(im); group.add(gear);
    // boards: [blocks, opts]
    const boards = [[HIST, {foot: FOOT}], [TREE, {draw(g, w, h, y) { const top = y + 10, bw = (w - 92) / 5;   // five focus-area branches
        g.strokeStyle = '#d4af37'; g.lineWidth = 5; g.beginPath(); g.moveTo(w / 2, h - 30); g.lineTo(w / 2, top + 190); g.stroke();
        AREAS.forEach(([n, s], i) => { const x = 46 + bw * i + bw / 2; g.beginPath(); g.moveTo(w / 2, top + 190); g.lineTo(x, top + 120); g.stroke(); g.fillStyle = '#123544'; g.fillRect(x - bw / 2 + 6, top, bw - 12, 118);
          g.fillStyle = '#9ffcff'; g.font = 'bold 23px Arial'; g.textAlign = 'center'; g.fillText(n, x, top + 14); g.fillStyle = '#f2ead8'; g.font = '19px Arial'; g.fillText(s, x, top + 50); g.fillText('fellows \u00b7 grants \u00b7 prizes', x, top + 80); });
        g.textAlign = 'left'; }}],
      [NOSEK, {}], [JURV, {}], [[], {img: true}], [MIRI1, {}], [MIRI2, {}],
      [[{t: 'Links', s: 'title'}, {t: 'foresight.org', s: 'sub'}, {t: 'existentialhope.com', s: 'sub'}, {t: 'gigafund.com', s: 'sub'}, {t: 'flickr.com/photos/jurvetson', s: 'sub'}, {t: 'intelligence.org', s: 'sub'},
        {t: 'Point and press a gold button to open a site (in VR it opens when you leave VR).', s: 'small'}], {}], [[], {buttons: true}]];
    const BW = 2.8, BH = 2.6, links = [['https://foresight.org', 'foresight.org'], ['https://www.existentialhope.com', 'existentialhope.com'], ['https://www.gigafund.com', 'gigafund.com'], ['https://www.flickr.com/photos/jurvetson/', 'Jurvetson on Flickr'], ['https://intelligence.org', 'intelligence.org'], ['https://foresight.org/tech-tree', 'Foresight Tech Tree']];
    const specs = [];
    boards.forEach(([blocks, o], i) => { const a = angs[i], x = Math.sin(a + Math.PI) * RB, z = Math.cos(a + Math.PI) * RB; let m;
      if (o.img) { m = FPX.panel(BW, BH, [{t: 'From the Jurvetson archive', s: 'sub'}], {}); const mat = m.material; const cv = m.userData.canvas, g = cv.getContext('2d');
        const files = ['j1.jpg', 'j2.jpg', 'j3.jpg'], slots = [[46, 110, 460, 300], [520, 110, 460, 300], [46, 430, 460, 300]]; let n = 0;
        files.forEach((f, k) => { const im2 = new Image(); im2.crossOrigin = 'anonymous'; im2.onload = () => { const [sx, sy, sw, sh] = slots[k], r = Math.min(sw / im2.width, sh / im2.height), dw = im2.width * r, dh = im2.height * r; g.drawImage(im2, sx + (sw - dw) / 2, sy + (sh - dh) / 2, dw, dh); if (++n === 3) mat.map.needsUpdate = true; else mat.map.needsUpdate = true; }; im2.src = FPX.base + 'img/' + f; });
        g.fillStyle = '#c9c2b0'; g.font = '21px Arial'; const words = CREDIT.split(' '); let line = '', yy = 450; for (const wd of words) { if (g.measureText(line + wd).width > 440) { g.fillText(line, 530, yy); line = ''; yy += 28; } line += wd + ' '; } g.fillText(line, 530, yy); mat.map.needsUpdate = true; }
      else if (o.buttons) { m = FPX.panel(BW, BH, [{t: 'Visit', s: 'title'}], {draw(g, w) { links.forEach(([u, l], k) => { const y = 120 + k * 118; g.fillStyle = '#FFD700'; g.fillRect(60, y, w - 120, 96); g.fillStyle = '#111'; g.font = 'bold 40px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(l, w / 2, y + 48); }); }});
        links.forEach(([u, l], k) => { const ly = BH / 2 - (120 + k * 118 + 48) / 1024 * BW; const off = new THREE.Vector3((0) , FY + 1.45 + ly, 0); specs.push({a, x, z, ly, w: BW * 0.88, h: 96 / 1024 * BW, onClick: () => FPX.link(u, l)}); }); }
      else m = FPX.panel(BW, BH, blocks, o);
      m.position.set(x, FY + 1.45, z); m.rotation.y = a; group.add(m); });
    let t0 = 0; function update(t) { gear.rotation.y = t * 0.15; im.rotation.x = Math.sin(t * 0.3) * 0.25; }
    let btns = null; function mountButtons() { if (btns) return btns;
      btns = FPX.buttons(group, specs.map(s => { const n = new THREE.Vector3(Math.sin(s.a), 0, Math.cos(s.a)).multiplyScalar(0.02); return {x: s.x + n.x, y: FY + 1.45 + s.ly, z: s.z + n.z, w: s.w, h: s.h, ry: s.a, onClick: s.onClick}; })); return btns; }
    return {group, update, mountButtons, get buttons() { return btns; }, footprint: {x0: -RC, x1: RC, z0: -RC, z1: RC}, floorY: FY, walls: [], spawn: {x: 0, z: RC + 3, yawDeg: 0},
      dispose() { if (btns) btns.dispose(); group.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } }); if (group.parent) group.parent.remove(group); }};
  }
  FPX.foresight = {build};
})();
