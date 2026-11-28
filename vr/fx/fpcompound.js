/* Family compound (Nov 28 2026, v2): seven cottages around one continuous green
   on a graded flat terrace inland of the family-home lot (behind the house, away
   from the pond). Astrid and her kids stay in the main house (C's companion).
   Each other woman stands at her cottage with two generic unnamed kid figures
   (no name or address labels). Avatars load from the companion folder; this file
   does not edit companion code. Host: window.FP_HOME from fx/fphome.js. */
(function () {
  'use strict';
  if (window.FP_COMPOUND && FP_COMPOUND.version >= 2) return;
  const SITE = {x: -705, z: 680}, SHOW_D = 700, PAD = 5;
  const C = {siding: '#f3ead6', trim: '#fbfaf5', roof: '#5e5048', stone: '#a49a8c', deck: '#b08a62',
    door: '#9c2f25', shutter: '#5f7d68', glass: '#8aa0a8', grass: '#5a7a42', grass2: '#4e6e38',
    path: '#c4b292', bush: '#4a6b38', leaf: ['#4f7a38', '#5b8a40', '#3e6a30', '#6a9448'],
    trunk: '#6b5038', earth: '#8a7354'};
  const HW = 3.15, HD = 2.55, WH = 2.45, T = 0.16, FY = 0.42, PW = 3.2, PD = 1.55;
  /* Local metres from the house origin. Lot inland edge is z = +20. One radius so
     every porch has the same setback from the green. */
  const GREEN = {x: 0, z: 44};
  const RSET = 25, RING_R = 19.6;
  const TERR = {x0: -38, x1: 38, z0: 20.3, z1: 76};
  const COT = [
    {id: 'lila',      avatar: 'f01.glb',   th: 1.80, ang: 45},
    {id: 'freya',     avatar: 'freya.glb', th: 1.82, ang: 90},
    {id: 'maya',      avatar: 'f13.glb',   th: 1.81, ang: 135},
    {id: 'nina',      avatar: 'p01.glb',   th: 1.79, ang: 180},
    {id: 'giulia',    avatar: 'lila.glb',  th: 1.80, ang: 225},
    {id: 'siobhan',   avatar: 'f14.glb',   th: 1.80, ang: 270},
    {id: 'valentina', avatar: 'f03.glb',   th: 1.80, ang: 315}
  ];
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
  COT.forEach((c, i) => {
    const a = c.ang * Math.PI / 180;
    c.lx = +(RSET * Math.sin(a)).toFixed(2);
    c.lz = +(GREEN.z - RSET * Math.cos(a)).toFixed(2);
    c.yaw = Math.atan2(GREEN.x - c.lx, -(GREEN.z - c.lz));
    c.kids = KIDS[i];
  });

  const H = window.FP_COMPOUND = {version: 2, ready: false};
  let group = null, origin = null, keepOut = null, maskHook = null, gHook = null, hiddenTrees = [], added = {floors: [], walls: []};

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
    TEX.grass = tex(64, (g, n) => { g.fillStyle = '#888'; g.fillRect(0, 0, n, n); g.fillStyle = 'rgba(0,0,0,0.07)';
      for (let i = 0; i < 400; i++) g.fillRect(Math.random() * n, Math.random() * n, 1, 2 + Math.random() * 2); });
    TEX.ok = true; return TEX;
  }
  function mat(color, map, opts) {
    return new THREE.MeshLambertMaterial(Object.assign({color: color, map: map || null}, opts || {}));
  }
  const GEO = {body: new THREE.BoxGeometry(1, 1, 1), ball: new THREE.SphereGeometry(1, 8, 6)};
  function box(parent, material, x, y, z, sx, sy, sz, rotX, rotY) {
    const m = new THREE.Mesh(GEO.body, material);
    m.position.set(x, y, z); m.scale.set(sx, sy, sz);
    if (rotX) m.rotation.x = rotX; if (rotY) m.rotation.y = rotY;
    m.receiveShadow = true; parent.add(m); return m;
  }

  function cottageAt(parent, mats) {
    const g = new THREE.Group(), foot = 0.5;
    box(g, mats.stone, 0, FY - 0.06 - foot / 2, 0, HW * 2 + 0.3, foot, HD * 2 + 0.3);
    box(g, mats.trim, 0, FY - 0.02, 0, HW * 2 + 0.36, 0.08, HD * 2 + 0.36);
    box(g, mats.siding, 0, FY + WH / 2, 0, HW * 2, WH, HD * 2);
    for (const [x, z] of [[-HW, -HD], [HW, -HD], [-HW, HD], [HW, HD]])
      box(g, mats.trim, x, FY + WH / 2, z, 0.14, WH + 0.02, 0.14);
    const pitch = 0.48, rl = Math.hypot(HD + 0.28, (HD + 0.28) * pitch) + 0.05, rs = Math.atan(pitch);
    const ry = FY + WH + 0.08 + (HD + 0.2) * pitch / 2;
    for (const s of [-1, 1]) box(g, mats.roof, 0, ry, s * (HD + 0.15) / 2, HW * 2 + 0.55, 0.09, rl, s * rs, 0);
    box(g, mats.siding, -HW, FY + WH + 0.38, 0, 0.14, 0.8, HD * 0.55);
    box(g, mats.siding,  HW, FY + WH + 0.38, 0, 0.14, 0.8, HD * 0.55);
    box(g, mats.stone, HW * 0.45, FY + WH + 1.35, HD * 0.35, 0.42, 0.9, 0.42);
    box(g, mats.trim, HW * 0.45, FY + WH + 1.82, HD * 0.35, 0.48, 0.1, 0.48);
    const pz = -HD - PD / 2;
    box(g, mats.deck, 0, FY - 0.04, pz, PW, 0.08, PD);
    box(g, mats.stone, 0, FY / 2 - 0.08, pz, PW - 0.1, Math.max(0.12, FY - 0.08), PD - 0.1);
    for (const x of [-PW / 2 + 0.12, PW / 2 - 0.12]) {
      box(g, mats.trim, x, FY + 0.85, -HD - PD + 0.1, 0.1, 1.7, 0.1);
      box(g, mats.trim, x, FY + 0.45, pz, 0.08, 0.08, PD - 0.15);
    }
    box(g, mats.trim, 0, FY + 1.68, -HD - PD + 0.1, PW, 0.08, 0.1);
    box(g, mats.roof, 0, FY + 2.05, pz - 0.05, PW + 0.2, 0.08, PD + 0.35, -0.12, 0);
    box(g, mats.door, 0, FY + 1.05, -HD - 0.02, 0.92, 2.1, 0.08);
    box(g, mats.trim, 0, FY + 1.05, -HD - 0.05, 1.02, 2.2, 0.04);
    function win(x) {
      box(g, mats.glass, x, FY + 1.45, -HD - 0.02, 0.7, 0.85, 0.05);
      box(g, mats.trim, x, FY + 1.45, -HD - 0.05, 0.8, 0.95, 0.04);
      box(g, mats.shutter, x - 0.48, FY + 1.45, -HD - 0.03, 0.18, 0.9, 0.05);
      box(g, mats.shutter, x + 0.48, FY + 1.45, -HD - 0.03, 0.18, 0.9, 0.05);
    }
    win(-1.85); win(1.85);
    box(g, mats.glass, HW + 0.02, FY + 1.4, 0, 0.05, 0.8, 0.7);
    box(g, mats.glass, -HW - 0.02, FY + 1.4, 0, 0.05, 0.8, 0.7);
    parent.add(g); return g;
  }

  function tree(parent, mats, x, y, z, s) {
    box(parent, mats.trunk, x, y + 0.7 * s, z, 0.22 * s, 1.4 * s, 0.22 * s);
    for (let i = 0; i < 4; i++) {
      const b = new THREE.Mesh(GEO.ball, mats.leaf[i % mats.leaf.length]);
      const a = i * 1.7, r = 0.35 * s;
      b.position.set(x + Math.cos(a) * r, y + 1.55 * s + (i % 2) * 0.25 * s, z + Math.sin(a) * r);
      b.scale.set(0.85 * s, 0.75 * s, 0.85 * s); parent.add(b);
    }
  }
  function bush(parent, mats, x, y, z, s) {
    const b = new THREE.Mesh(GEO.ball, mats.bush);
    b.position.set(x, y + 0.32 * s, z); b.scale.set(0.5 * s, 0.38 * s, 0.5 * s); parent.add(b);
  }

  /* One continuous grass terrace, paths on the same plane, a few trees and bushes. */
  function terrace(root, mats, yLocal, yMinLocal) {
    const g = new THREE.Group(), tw = TERR.x1 - TERR.x0, td = TERR.z1 - TERR.z0;
    const cx = (TERR.x0 + TERR.x1) / 2, cz = (TERR.z0 + TERR.z1) / 2;
    const thick = Math.max(1.4, yLocal - yMinLocal + 0.9);
    box(g, mats.earth, cx, yLocal - thick / 2, cz, tw, thick, td);             /* fill down to the slope */
    box(g, mats.grass, cx, yLocal + 0.03, cz, tw - 0.2, 0.08, td - 0.2);       /* one continuous lawn */
    /* low stone curb on the three outer edges (not the house-side seam) */
    const ch = 0.22, cy = yLocal + 0.08;
    box(g, mats.stone, cx, cy, TERR.z1, tw, ch, 0.28);
    box(g, mats.stone, TERR.x0, cy, cz + 0.2, 0.28, ch, td - 0.4);
    box(g, mats.stone, TERR.x1, cy, cz + 0.2, 0.28, ch, td - 0.4);

    function path(x, z, sx, sz, yaw) {
      const m = new THREE.Mesh(GEO.body, mats.path);
      m.position.set(x, yLocal + 0.08, z); m.scale.set(sx, 0.06, sz); if (yaw) m.rotation.y = yaw; g.add(m);
    }
    /* stem from the back fence to the ring, then a horseshoe in front of the porches, then a short walk to each door */
    const stemZ0 = TERR.z0, stemZ1 = GREEN.z - RING_R + 0.4;
    path(0, (stemZ0 + stemZ1) / 2, 2.3, Math.abs(stemZ1 - stemZ0), 0);
    const segs = 20, a0 = 35 * Math.PI / 180, a1 = 325 * Math.PI / 180;
    for (let i = 0; i < segs; i++) {
      const t0 = i / segs, t1 = (i + 1) / segs, aA = a0 + (a1 - a0) * t0, aB = a0 + (a1 - a0) * t1;
      const x0 = GREEN.x + RING_R * Math.sin(aA), z0 = GREEN.z - RING_R * Math.cos(aA);
      const x1 = GREEN.x + RING_R * Math.sin(aB), z1 = GREEN.z - RING_R * Math.cos(aB);
      const dx = x1 - x0, dz = z1 - z0, len = Math.hypot(dx, dz);
      path((x0 + x1) / 2, (z0 + z1) / 2, 1.7, len + 0.08, Math.atan2(dx, dz));
    }
    COT.forEach(c => {
      const dx = c.lx - GREEN.x, dz = c.lz - GREEN.z, dist = Math.hypot(dx, dz), nx = dx / dist, nz = dz / dist;
      const r0 = RING_R - 0.2, r1 = dist - HD - PD - 0.15, mid = (r0 + r1) / 2, len = Math.max(0.6, r1 - r0);
      path(GREEN.x + nx * mid, GREEN.z + nz * mid, 1.55, len, Math.atan2(nx, nz));
    });

    /* trees in the gaps on the outer arc, plus two on the green; bushes along the ring */
    [67.5, 112.5, 157.5, 202.5, 247.5, 292.5].forEach((deg, i) => {
      const a = deg * Math.PI / 180, r = 32.5 + (i % 3) * 0.6;
      tree(g, mats, GREEN.x + r * Math.sin(a), yLocal, GREEN.z - r * Math.cos(a), 1.05 + (i % 3) * 0.12);
    });
    tree(g, mats, -5.5, yLocal, GREEN.z + 2.5, 0.95);
    tree(g, mats, 6.2, yLocal, GREEN.z - 1.8, 1.05);
    for (let i = 0; i < 10; i++) {
      const a = (40 + i * 28) * Math.PI / 180, r = 8.5 + (i % 3) * 1.1;
      bush(g, mats, GREEN.x + r * Math.sin(a), yLocal, GREEN.z - r * Math.cos(a) * 0.85, 0.85 + (i % 3) * 0.15);
    }
    root.add(g); return g;
  }

  /* Flatten the world terrain under the terrace so the slope does not poke through.
     Berm on the outer edges only — the house-side seam stays flush with the back fence. */
  function gradeTerrain(wx0, wx1, wz0, wz1, yTop, berm) {
    const mesh = W3D.root && W3D.root.getObjectByName('terrain');
    if (!mesh || !mesh.geometry || !mesh.geometry.attributes.position) return;
    const p = mesh.geometry.attributes.position;
    if (!mesh.userData._fpCompY) {
      const src = new Float32Array(p.count);
      for (let i = 0; i < p.count; i++) src[i] = p.getY(i);
      mesh.userData._fpCompY = src;
    }
    const orig = mesh.userData._fpCompY;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      if (z < wz0 - 0.2 || x < wx0 - berm || x > wx1 + berm || z > wz1 + berm) continue;
      const dx = x < wx0 ? wx0 - x : x > wx1 ? x - wx1 : 0;
      const dz = z > wz1 ? z - wz1 : 0;           /* no berm toward the house */
      const d = Math.hypot(dx, dz);
      if (d <= 0.01) p.setY(i, yTop);
      else if (d < berm) { const t = d / berm, s = t * t * (3 - 2 * t); p.setY(i, yTop + (orig[i] - yTop) * s); }
    }
    p.needsUpdate = true; mesh.geometry.computeVertexNormals();
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
    if (!(head && le && re)) { m.rotation.y += Math.PI; return; }
    const hp = head.getWorldPosition(new T.Vector3()), ep = le.getWorldPosition(new T.Vector3()).add(re.getWorldPosition(new T.Vector3())).multiplyScalar(0.5);
    const f = ep.sub(hp); f.y = 0; if (f.lengthSq() < 1e-8) return;
    const cur = Math.atan2(f.x, f.z); m.rotation.y += -cur + Math.PI; m.updateMatrixWorld(true);
  }
  function fit(m, targetH) {
    m.updateMatrixWorld(true);
    let box = new THREE.Box3().setFromObject(m), h = box.max.y - box.min.y;
    if (h < 0.2) return;
    if (targetH) m.scale.multiplyScalar(targetH / h);
    m.updateMatrixWorld(true);
    box = new THREE.Box3().setFromObject(m);
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
  function placePerson(parent, file, targetH, x, z, yaw) {
    return loadAvatar(file).then(scene => {
      if (!scene) return;
      const hold = new THREE.Group();
      hold.position.set(x, 0, z); hold.rotation.y = yaw;
      scene.traverse(o => { if (o.isMesh) { o.castShadow = false; o.frustumCulled = true; } });
      hold.add(scene); parent.add(hold); hold.updateMatrixWorld(true); fit(scene, targetH);
    }).catch(() => {});
  }
  function cottagePeople(c) {
    const porchZ = -HD - PD - 0.35;
    placePerson(c.group, c.avatar, c.th, 0.15, porchZ, 0);
    (c.kids || []).forEach((k, i) => {
      placePerson(c.group, k.file, KH[k.age] || 1.1, i === 0 ? -1.05 : 1.05, porchZ - 0.55 - i * 0.15, i ? -0.15 : 0.15);
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
      grass: mat(C.grass, X.grass), path: mat(C.path), bush: mat(C.bush), earth: mat(C.earth), trunk: mat(C.trunk),
      leaf: C.leaf.map(col => mat(col))
    };
    /* Terrace height matches the back-fence / home-lawn seam so the pad joins the yard. */
    const yFence = tH(origin.x, origin.z + TERR.z0);
    let yMin = yFence;
    for (let x = TERR.x0; x <= TERR.x1; x += 6) for (let z = TERR.z0; z <= TERR.z1; z += 6)
      yMin = Math.min(yMin, tH(origin.x + x, origin.z + z));
    const yTop = yFence, yLocal = yTop - origin.y, yMinLocal = yMin - origin.y;
    const berm = 8, wx0 = origin.x + TERR.x0, wx1 = origin.x + TERR.x1, wz0 = origin.z + TERR.z0, wz1 = origin.z + TERR.z1;
    gradeTerrain(wx0, wx1, wz0, wz1, yTop, berm);
    setTimeout(() => gradeTerrain(wx0, wx1, wz0, wz1, yTop, berm), 2500);

    group = new THREE.Group(); group.name = 'fp-compound'; group.position.set(origin.x, origin.y, origin.z);
    terrace(group, mats, yLocal, yMinLocal);

    COT.forEach(c => {
      const wrap = new THREE.Group();
      wrap.position.set(c.lx, yLocal, c.lz);
      wrap.rotation.y = c.yaw;
      wrap.rotation.x = 0; wrap.rotation.z = 0;
      wrap.name = 'fp-cottage';
      cottageAt(wrap, mats);
      group.add(wrap);
      c.group = wrap;
      cottagePeople(c);
      addColliders(origin.x + c.lx, origin.z + c.lz, yTop, c.yaw);
    });

    W3D.root.add(group);
    const pad = {x0: wx0 - berm, x1: wx1 + berm, z0: wz0, z1: wz1 + berm, y: yTop};
    if (W3D.floors) { W3D.floors.push(pad); added.floors.push(pad); }
    clearTrees({x0: pad.x0, x1: pad.x1, z0: pad.z0, z1: pad.z1});
    W3D.keepOut = W3D.keepOut || [];
    keepOut = {x: origin.x + GREEN.x, z: origin.z + GREEN.z, r: 52, name: 'the family compound'};
    W3D.keepOut.push(keepOut);
    maskHook = ({rect}) => rect(wx0, wz0, wx1, wz1, 14);
    W3D.maskHooks = W3D.maskHooks || []; W3D.maskHooks.push(maskHook);
    if (W3D.realEarth && W3D.realEarth.rebuildMask) W3D.realEarth.rebuildMask();
    gHook = (x, z) => (x < wx0 || x > wx1 || z < wz0 || z > wz1) ? null : yTop;
    W3D.gHooks = W3D.gHooks || []; W3D.gHooks.push(gHook);

    H.ready = true; H.origin = origin; H.yTop = yTop;
    H.cottages = COT.map(c => ({id: c.id, x: origin.x + c.lx, z: origin.z + c.lz}));
    console.log('fp-compound: terrace at', yTop.toFixed(2), '7 cottages');
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
