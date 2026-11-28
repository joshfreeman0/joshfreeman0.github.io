/* Family compound (Nov 28 2026): seven small cottages just outside the family-home
   lot, around a shared green south of the gate. Astrid and her kids stay in the
   main house (C's companion). Each other woman stands at her cottage with two
   generic unnamed kid figures (no name or address labels). Avatars are loaded
   from the companion folder; this file does not edit companion code.
   Host: window.FP_HOME from fx/fphome.js. */
(function () {
  'use strict';
  if (window.FP_COMPOUND && FP_COMPOUND.version >= 1) return;
  const SITE = {x: -705, z: 680}, SHOW_D = 700, PAD = 4;
  const C = {siding: '#f3ead6', trim: '#fbfaf5', roof: '#5e5048', stone: '#a49a8c', deck: '#b08a62',
    door: '#9c2f25', shutter: '#5f7d68', glass: '#8aa0a8', grass: '#5d7a45', path: '#c4b292', bush: '#4a6b38'};
  const HW = 3.15, HD = 2.55, WH = 2.45, T = 0.16, FY = 0.42, PW = 3.2, PD = 1.55;
  /* Local metres from the house origin. Green sits inland of the lot (lot z1 = +20),
     behind the house, away from the pond. Cottages on a horseshoe; the north gap
     is the path up to the back fence. */
  const GREEN = {x: 0, z: 40, rx: 11, rz: 9};
  const COT = [
    {id: 'lila',      avatar: 'f01.glb',   th: 1.80, ang: 45},
    {id: 'freya',     avatar: 'freya.glb', th: 1.82, ang: 90},
    {id: 'maya',      avatar: 'f13.glb',   th: 1.81, ang: 135},
    {id: 'nina',      avatar: 'p01.glb',   th: 1.79, ang: 180},
    {id: 'giulia',    avatar: 'lila.glb',  th: 1.80, ang: 225},
    {id: 'siobhan',   avatar: 'f14.glb',   th: 1.80, ang: 270},
    {id: 'valentina', avatar: 'f03.glb',   th: 1.80, ang: 315}
  ];
  /* Kid heights by age (metres). Girl/boy models alternate; nothing here is drawn as a label. */
  const KH = {2: 0.86, 3: 0.95, 4: 1.03, 5: 1.10, 6: 1.16, 7: 1.22, 8: 1.28, 9: 1.34};
  const KIDS = [
    [{file: 'cf01.glb', age: 5}, {file: 'cm01.glb', age: 3}],
    [{file: 'cf02.glb', age: 4}, {file: 'cm02.glb', age: 2}],
    [{file: 'cf01.glb', age: 7}, {file: 'cm01.glb', age: 5}],
    [{file: 'cf02.glb', age: 9}, {file: 'cm02.glb', age: 6}],
    [{file: 'cf01.glb', age: 6}, {file: 'cm01.glb', age: 4}],
    [{file: 'cf02.glb', age: 5}, {file: 'cm02.glb', age: 3}],
    [{file: 'cf01.glb', age: 7}, {file: 'cm01.glb', age: 4}]
  ];
  const RX = 28, RZ = 22;
  COT.forEach((c, i) => {
    const a = c.ang * Math.PI / 180;
    c.lx = +(RX * Math.sin(a)).toFixed(2);
    c.lz = +(GREEN.z - RZ * Math.cos(a)).toFixed(2);
    const dx = GREEN.x - c.lx, dz = GREEN.z - c.lz;
    c.yaw = Math.atan2(dx, -dz);   /* cottage front (-z) faces the green */
    c.kids = KIDS[i];
  });

  const H = window.FP_COMPOUND = {version: 1, ready: false};
  let group = null, origin = null, keepOut = null, maskHook = null, hiddenTrees = [], added = {floors: [], walls: []}, peopleLeft = 0;

  function tH(x, z) {
    const v = window.W3D && W3D.terrainH && W3D.terrainH(x, z);
    if (isFinite(v) && Math.abs(v) > 1) return v;
    return (window.FP_HOME && FP_HOME.site && FP_HOME.site.y) || 20;
  }
  function avBases() {
    const st = '/vr-staging/companion/avatars/', lv = '/vr/companion/avatars/';
    return /\/vr-staging/.test(location.pathname) ? [st, lv] : [lv, st];
  }
  function tex(n, draw) {
    const c = document.createElement('canvas'); c.width = c.height = n; draw(c.getContext('2d'), n);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 2; return t;
  }
  const TEX = {};
  function materials() {
    if (TEX.ok) return TEX;
    TEX.clap = tex(64, (g, n) => { g.fillStyle = '#f0f0f0'; g.fillRect(0, 0, n, n); g.fillStyle = 'rgba(0,0,0,0.08)';
      for (let y = 0; y < n; y += 8) { g.fillRect(0, y, n, 1); for (let x = (y / 8) % 2 ? 0 : 16; x < n; x += 32) g.fillRect(x, y, 1, 8); } });
    TEX.shingle = tex(64, (g, n) => { g.fillStyle = '#777'; g.fillRect(0, 0, n, n); g.fillStyle = 'rgba(0,0,0,0.15)';
      for (let r = 0; r < 8; r++) { const y = r * 8, off = (r % 2) * 8; for (let x = off; x < n; x += 16) g.strokeRect(x, y, 16, 8); } });
    TEX.ok = true; return TEX;
  }
  function mat(color, map, opts) {
    const o = opts || {};
    return new THREE.MeshLambertMaterial(Object.assign({color: color, map: map || null}, o));
  }

  function box(parent, geo, material, x, y, z, sx, sy, sz, rotX, rotY) {
    const m = new THREE.Mesh(geo, material);
    m.position.set(x, y, z); if (sx !== 1 || sy !== 1 || sz !== 1) m.scale.set(sx, sy, sz);
    if (rotX) m.rotation.x = rotX; if (rotY) m.rotation.y = rotY;
    m.castShadow = false; m.receiveShadow = true; parent.add(m); return m;
  }
  /* Shared geometries (one each, instanced across cottages by mesh.clone). */
  const GEO = {};
  function geos() {
    if (GEO.ok) return GEO;
    GEO.body = new THREE.BoxGeometry(1, 1, 1);
    GEO.ok = true; return GEO;
  }

  function cottageAt(parent, mats, gnd) {
    const G = geos(), B = GEO.body, g = new THREE.Group();
    const foot = Math.max(0.45, FY - gnd + 0.35);
    box(g, B, mats.stone, 0, FY - 0.06 - foot / 2, 0, HW * 2 + 0.3, foot, HD * 2 + 0.3);
    box(g, B, mats.trim, 0, FY - 0.02, 0, HW * 2 + 0.36, 0.08, HD * 2 + 0.36);
    box(g, B, mats.siding, 0, FY + WH / 2, 0, HW * 2, WH, HD * 2);
    /* corner boards */
    for (const [x, z] of [[-HW, -HD], [HW, -HD], [-HW, HD], [HW, HD]])
      box(g, B, mats.trim, x, FY + WH / 2, z, 0.14, WH + 0.02, 0.14);
    /* gable roof */
    const pitch = 0.48, rl = Math.hypot(HD + 0.28, (HD + 0.28) * pitch) + 0.05, rs = Math.atan(pitch);
    const ry = FY + WH + 0.08 + (HD + 0.2) * pitch / 2;
    for (const s of [-1, 1]) box(g, B, mats.roof, 0, ry, s * (HD + 0.15) / 2, HW * 2 + 0.55, 0.09, rl, s * rs, 0);
    /* gable end fill (short walls under the ridge at ±X) + chimney */
    box(g, B, mats.siding, -HW, FY + WH + 0.38, 0, 0.14, 0.8, HD * 0.55);
    box(g, B, mats.siding,  HW, FY + WH + 0.38, 0, 0.14, 0.8, HD * 0.55);
    box(g, B, mats.stone, HW * 0.45, FY + WH + 1.35, HD * 0.35, 0.42, 0.9, 0.42);
    box(g, B, mats.trim, HW * 0.45, FY + WH + 1.82, HD * 0.35, 0.48, 0.1, 0.48);
    /* porch */
    const pz = -HD - PD / 2;
    box(g, B, mats.deck, 0, FY - 0.04, pz, PW, 0.08, PD);
    box(g, B, mats.stone, 0, (FY - 0.08 + gnd) / 2, pz, PW - 0.1, Math.max(0.1, FY - 0.08 - gnd), PD - 0.1);
    for (const x of [-PW / 2 + 0.12, PW / 2 - 0.12]) {
      box(g, B, mats.trim, x, FY + 0.85, -HD - PD + 0.1, 0.1, 1.7, 0.1);
      box(g, B, mats.trim, x, FY + 0.45, pz, 0.08, 0.08, PD - 0.15);
    }
    box(g, B, mats.trim, 0, FY + 1.68, -HD - PD + 0.1, PW, 0.08, 0.1);
    box(g, B, mats.roof, 0, FY + 2.05, pz - 0.05, PW + 0.2, 0.08, PD + 0.35, -0.12, 0);
    /* door and windows on the front (-z) */
    box(g, B, mats.door, 0, FY + 1.05, -HD - 0.02, 0.92, 2.1, 0.08);
    box(g, B, mats.trim, 0, FY + 1.05, -HD - 0.05, 1.02, 2.2, 0.04);
    function win(x) {
      box(g, B, mats.glass, x, FY + 1.45, -HD - 0.02, 0.7, 0.85, 0.05);
      box(g, B, mats.trim, x, FY + 1.45, -HD - 0.05, 0.8, 0.95, 0.04);
      box(g, B, mats.shutter, x - 0.48, FY + 1.45, -HD - 0.03, 0.18, 0.9, 0.05);
      box(g, B, mats.shutter, x + 0.48, FY + 1.45, -HD - 0.03, 0.18, 0.9, 0.05);
    }
    win(-1.85); win(1.85);
    /* side windows */
    box(g, B, mats.glass, HW + 0.02, FY + 1.4, 0, 0.05, 0.8, 0.7);
    box(g, B, mats.glass, -HW - 0.02, FY + 1.4, 0, 0.05, 0.8, 0.7);
    parent.add(g); return g;
  }

  function lawnAndPaths(root, mats, originY) {
    const g = new THREE.Group();
    /* shared green */
    const eg = new THREE.CircleGeometry(1, 28); eg.rotateX(-Math.PI / 2);
    const green = new THREE.Mesh(eg, mats.grass);
    green.scale.set(GREEN.rx, 1, GREEN.rz); green.position.set(GREEN.x, 0.03, GREEN.z); g.add(green);
    /* path from the south gate (0, -18) to the green, then a ring toward each cottage */
    const pg = new THREE.BoxGeometry(1, 1, 1);
    const gateZ = 20; /* back fence, inland */
    box(g, pg, mats.path, 0, 0.025, (gateZ + (GREEN.z - GREEN.rz * 0.2)) / 2, 2.2, 0.05, Math.abs(gateZ - (GREEN.z - GREEN.rz * 0.2)));
    COT.forEach(c => {
      const dx = c.lx - GREEN.x, dz = c.lz - GREEN.z, len = Math.hypot(dx, dz) - HD - PD - 1.2;
      if (len < 2) return;
      const mx = GREEN.x + dx * 0.52, mz = GREEN.z + dz * 0.52;
      const m = new THREE.Mesh(pg, mats.path);
      m.scale.set(1.5, 0.05, len * 0.55); m.position.set(mx, 0.025, mz); m.rotation.y = Math.atan2(dx, dz); g.add(m);
    });
    /* a few bushes on the green, no labels */
    const ball = new THREE.SphereGeometry(1, 8, 6);
    for (let i = 0; i < 8; i++) {
      const a = i * 0.85 + 0.3, r = 6.5 + (i % 3) * 0.8;
      const b = new THREE.Mesh(ball, mats.bush);
      b.scale.set(0.45 + (i % 3) * 0.08, 0.4, 0.45); b.position.set(Math.sin(a) * r, 0.35, GREEN.z + Math.cos(a) * r * 0.75); g.add(b);
    }
    root.add(g); return g;
  }

  function clearTrees(L) {
    if (!W3D.root) return; const m4 = new THREE.Matrix4(), p = new THREE.Vector3(), zero = new THREE.Matrix4().makeScale(0, 0, 0);
    W3D.root.traverse(o => { if (!o.isInstancedMesh || !/^(trees|trees-pitchpine|trees-pitchpine-trunk)$/.test(o.name)) return; let ch = 0;
      for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m4); p.setFromMatrixPosition(m4); if (p.x > L.x0 && p.x < L.x1 && p.z > L.z0 && p.z < L.z1) { hiddenTrees.push([o, i, m4.clone()]); o.setMatrixAt(i, zero); ch++; } }
      if (ch) o.instanceMatrix.needsUpdate = true; });
  }

  function norm(n) { return String(n || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }
  function armsDown(root) {
    const T = THREE, all = {};
    root.updateMatrixWorld(true);
    root.traverse(o => { if (o.isBone) all[norm(o.name).replace(/^bip0\d/, 'bip01')] = o; });
    const chest = all.bip01spine2 || all.bip01spine1 || all.bip01pelvis;
    const aim = (bone, child, dir) => {
      if (!bone || !child || !bone.parent) return;
      const P = bone.getWorldPosition(new T.Vector3()), C = child.getWorldPosition(new T.Vector3());
      const cur = C.sub(P).normalize(); if (cur.lengthSq() < 1e-8) return;
      const q = new T.Quaternion().setFromUnitVectors(cur, dir);
      const wq = bone.getWorldQuaternion(new T.Quaternion());
      const pq = bone.parent.getWorldQuaternion(new T.Quaternion()).invert();
      bone.quaternion.copy(pq.multiply(q.multiply(wq))); bone.updateMatrixWorld(true);
    };
    const hipX = chest ? chest.getWorldPosition(new T.Vector3()).x : 0;
    const L = {up: all.bip01lupperarm, fo: all.bip01lforearm, ha: all.bip01lhand};
    const R = {up: all.bip01rupperarm, fo: all.bip01rforearm, ha: all.bip01rhand};
    for (const s of [{b: L, side: 1}, {b: R, side: -1}]) {
      if (!s.b.up || !s.b.fo) continue;
      const side = Math.sign(s.b.up.getWorldPosition(new T.Vector3()).x - hipX) || s.side;
      aim(s.b.up, s.b.fo, new T.Vector3(side * 0.2, -1, 0.04).normalize());
      if (s.b.ha) aim(s.b.fo, s.b.ha, new T.Vector3(side * 0.08, -1, 0.32).normalize());
    }
  }
  function faceMinusZ(m) {
    const T = THREE, find = n => { let f = null; m.traverse(o => { if (!f && o.isBone && norm(o.name).replace(/^bip0\d/, 'bip01') === n) f = o; }); return f; };
    const head = find('bip01head'), le = find('bip01leye'), re = find('bip01reye');
    if (!(head && le && re)) { m.rotation.y += Math.PI; return; }   /* rocketbox often faces +Z; yaw 0 should face -Z / north */
    const hp = head.getWorldPosition(new T.Vector3()), ep = le.getWorldPosition(new T.Vector3()).add(re.getWorldPosition(new T.Vector3())).multiplyScalar(0.5);
    const f = ep.sub(hp); f.y = 0; if (f.lengthSq() < 1e-8) return;
    /* want face along holder -Z */
    const cur = Math.atan2(f.x, f.z); m.rotation.y += -cur + Math.PI; m.updateMatrixWorld(true);
  }
  function fit(m, targetH) {
    m.updateMatrixWorld(true);
    let box = new THREE.Box3().setFromObject(m), h = box.max.y - box.min.y;
    if (h < 0.2) return;
    if (targetH) m.scale.multiplyScalar(targetH / h);
    m.updateMatrixWorld(true);
    box = new THREE.Box3().setFromObject(m);
    /* setFromObject is world-space; shift local Y so feet sit on the holder origin. */
    const holdY = m.parent ? m.parent.getWorldPosition(new THREE.Vector3()).y : 0;
    m.position.y += holdY - box.min.y;
    m.updateMatrixWorld(true);
    faceMinusZ(m);
    armsDown(m);
  }

  function loadAvatar(file) {
    const bases = avBases();
    const Loader = THREE.GLTFLoader;
    if (!Loader) return Promise.reject(new Error('no GLTFLoader'));
    const tryAt = i => new Loader().loadAsync(bases[i] + file).then(g => g.scene)
      .catch(() => i + 1 < bases.length ? tryAt(i + 1) : null);
    return tryAt(0);
  }

  function placePerson(parent, file, targetH, x, z, yaw, gY) {
    peopleLeft++;
    return loadAvatar(file).then(scene => {
      peopleLeft--;
      if (!scene) return;
      const hold = new THREE.Group();
      hold.position.set(x, gY, z);
      hold.rotation.y = yaw;
      scene.traverse(o => { if (o.isMesh) { o.castShadow = false; o.frustumCulled = true; } });
      hold.add(scene);
      parent.add(hold);
      hold.updateMatrixWorld(true);
      fit(scene, targetH);
    }).catch(() => { peopleLeft--; });
  }

  function cottagePeople(root, c, worldYaw, originY, tH0) {
    /* People in cottage-local space: front porch faces local -z. World yaw already on cottage group. */
    const porchZ = -HD - PD - 0.35;
    const gY = 0; /* cottage group already sits on ground */
    placePerson(c.group, c.avatar, c.th, 0.15, porchZ, 0, 0);
    (c.kids || []).forEach((k, i) => {
      const side = i === 0 ? -1.05 : 1.05;
      const z = porchZ - 0.55 - i * 0.15;
      placePerson(c.group, k.file, KH[k.age] || 1.1, side, z, (i ? -0.15 : 0.15), 0);
    });
  }

  function addColliders(wx, wz, wy, yaw) {
    const ca = Math.cos(yaw), sa = Math.sin(yaw);
    const corners = (x0, x1, z0, z1) => {
      const pts = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]].map(([x, z]) => [wx + x * ca + z * sa, wz + -x * sa + z * ca]);
      const xs = pts.map(p => p[0]), zs = pts.map(p => p[1]);
      return {x0: Math.min.apply(null, xs), x1: Math.max.apply(null, xs), z0: Math.min.apply(null, zs), z1: Math.max.apply(null, zs)};
    };
    const fl = corners(-HW, HW, -HD - PD, HD); fl.y = wy + FY;
    if (W3D.floors) { W3D.floors.push(fl); added.floors.push(fl); }
    const wall = (x0, x1, z0, z1) => { const w = corners(x0, x1, z0, z1); w.y0 = wy + FY; w.y1 = wy + FY + WH; if (W3D.walls) { W3D.walls.push(w); added.walls.push(w); } };
    wall(-HW, HW, -HD, -HD + T); wall(-HW, HW, HD - T, HD); wall(-HW, -HW + T, -HD, HD); wall(HW - T, HW, -HD, HD);
  }

  function mount() {
    if (group || !window.W3D || !W3D.root || typeof THREE === 'undefined') return;
    const site = (window.FP_HOME && FP_HOME.site) || {x: SITE.x, y: tH(SITE.x, SITE.z), z: SITE.z};
    origin = {x: site.x, y: site.y, z: site.z};
    const X = materials();
    const mats = {
      siding: mat(C.siding, X.clap), trim: mat(C.trim), roof: mat(C.roof, X.shingle), stone: mat(C.stone),
      deck: mat(C.deck), door: mat(C.door), shutter: mat(C.shutter), glass: mat(C.glass),
      grass: mat(C.grass), path: mat(C.path), bush: mat(C.bush)
    };
    group = new THREE.Group(); group.name = 'fp-compound'; group.position.set(origin.x, origin.y, origin.z);
    /* sample local ground so the green and cottages sit on the land, not at house origin.y */
    const groundLocal = (x, z) => tH(origin.x + x, origin.z + z) - origin.y;
    lawnAndPaths(group, mats, origin.y);
    /* lift the green/paths to mean ground under the green */
    const gY = groundLocal(GREEN.x, GREEN.z);
    const landscaping = group.children[0]; if (landscaping) landscaping.position.y = gY;

    COT.forEach(c => {
      const gy = groundLocal(c.lx, c.lz);
      const wrap = new THREE.Group();
      wrap.position.set(c.lx, gy, c.lz);
      wrap.rotation.y = c.yaw;
      wrap.name = 'fp-cottage';
      const built = cottageAt(wrap, mats, 0);
      group.add(wrap);
      c.group = wrap;
      cottagePeople(group, c, c.yaw, origin.y, gy);
      addColliders(origin.x + c.lx, origin.z + c.lz, origin.y + gy, c.yaw);
    });

    W3D.root.add(group);
    const xs = COT.map(c => c.lx), zs = COT.map(c => c.lz);
    const x0 = origin.x + Math.min.apply(null, xs) - HW - PAD, x1 = origin.x + Math.max.apply(null, xs) + HW + PAD;
    const z0 = origin.z + 20.2, z1 = origin.z + Math.max.apply(null, zs) + HD + PD + PAD;  /* inland of the lot only */
    clearTrees({x0: x0, x1: x1, z0: z0, z1: z1});
    W3D.keepOut = W3D.keepOut || [];
    keepOut = {x: origin.x + GREEN.x, z: origin.z + GREEN.z, r: 48, name: 'the family compound'};
    W3D.keepOut.push(keepOut);
    maskHook = ({rect}) => rect(x0, z0, x1, z1, 12);
    W3D.maskHooks = W3D.maskHooks || []; W3D.maskHooks.push(maskHook);
    if (W3D.realEarth && W3D.realEarth.rebuildMask) W3D.realEarth.rebuildMask();

    H.ready = true; H.origin = origin; H.cottages = COT.map(c => ({id: c.id, x: origin.x + c.lx, z: origin.z + c.lz}));
    console.log('fp-compound: 7 cottages south of the home lot');
    const sc = document.querySelector('a-scene'); if (sc) sc.emit('fp-compound-ready', H, false);
  }

  setInterval(() => {
    if (!group || !origin) return;
    const c = document.querySelector('a-scene'), cam = c && c.camera; if (!cam) return;
    const e = cam.matrixWorld.elements;
    group.visible = Math.hypot(e[12] - origin.x, e[14] - origin.z) < SHOW_D;
  }, 1000);

  function boot(n) {
    if (!(window.W3D_READY && window.W3D && W3D.root && W3D.terrainH && window.FP_HOME && FP_HOME.ready && FP_HOME.site)) {
      if (n < 2000) setTimeout(() => boot(n + 1), 200);
      return;
    }
    mount();
  }
  window.addEventListener('fp-home-ready', () => boot(0));
  boot(0);
})();
