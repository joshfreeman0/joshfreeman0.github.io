/* The Pharos (Josh, 23 Nov 2026: "Put a tall lighthouse here. One that looks like the lighthouse of Alexandria Egypt."), on the
   pond's south-shore point (the leftover jut, x -968..-898, z 528..612). The point is kept as land and rebuilt as a stone mole:
   quay walls from below the waterline up to a paved deck at 23.2 m that hides the old flat aerial rooftops / car park.
   On it a walled square court (corner towers, south gate) and the three tapering tiers of the ancient lighthouse at ~0.9 scale:
   a tall square lower tier with windows and Tritons blowing conches at its four top corners, an octagonal middle tier and a round
   columned lantern with the fire, a dome and Poseidon with his trident on top. Pale limestone, ~90 m above the deck (~97 m above
   the water). At night (daynight.js) the fire glows and a beam slowly sweeps the pond. One merged stone mesh + fire + beam
   (3 draws); lite ~5k tris. Walkable deck, lower-tier terrace and lantern gallery; W3D.spots.pharos = the gallery viewpoint. */
(function () {
  const LITE = !!window.JFVR_LITE, K = 0.86, C = {x: -933, z: 568}, DECK = 23.2;
  const MOLE = [[-971, 618], [-971, 566], [-970, 546], [-964, 537], [-943, 533], [-935, 526], [-924, 525], [-916, 533], [-903, 535], [-896, 545], [-895, 600], [-891, 606], [-884, 609], [-870, 612], [-862, 618]];
  W3D.keepOut = (W3D.keepOut || []).concat([{x: -931, z: 570, r: 62, name: 'the Pharos'}]);   // no houses / grass / plants / builds on it
  const P = W3D.pharos = {height: 0, tris: 0};
  // ?spot=pharos is resolved before the tower is built (it builds on W3D_READY): wait for it, then go to the gallery
  if (W3D.spots) W3D.spots.pharos = () => { const iv = setInterval(() => { if (P.ready && P.go) { clearInterval(iv); P.go(); } }, 150); setTimeout(() => clearInterval(iv), 60000); };
  const parts = [];   // [geometry, colour]
  const col = (g, c, x, y, z, ry) => { if (ry) g.rotateY(ry); g.translate(x || 0, y || 0, z || 0); parts.push([g, c]); return g; };
  const STONE = 0xe6dcc6, STONE2 = 0xd8ccb2, DARK = 0x3a3630;
  function ashlar() { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); g.fillStyle = '#f4efe4'; g.fillRect(0, 0, 256, 256);
    for (let r = 0; r < 8; r++) { const off = (r % 2) * 32; for (let k = -1; k < 5; k++) { const v = 228 + Math.random() * 22 | 0; g.fillStyle = 'rgb(' + v + ',' + (v - 6) + ',' + (v - 16) + ')'; g.fillRect(k * 64 + off + 1, r * 32 + 1, 62, 30); } }
    g.fillStyle = 'rgba(120,105,85,0.35)'; for (let r = 0; r <= 8; r++) g.fillRect(0, r * 32 - 1, 256, 2); for (let r = 0; r < 8; r++) for (let k = 0; k < 5; k++) g.fillRect(k * 64 + (r % 2) * 32 - 1, r * 32, 2, 32);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
  function frustum(wb, wt, h, sides, c, y, open) { const g = new THREE.CylinderGeometry(wt, wb, h, sides, 1, !!open); g.rotateY(sides === 4 ? Math.PI / 4 : Math.PI / sides); return col(g, c, C.x, y + h / 2, C.z); }
  const sq = (w, x) => w * Math.SQRT2;   // half-width -> 4-sided cylinder radius
  function box(w, h, d, c, x, y, z, ry) { return col(new THREE.BoxGeometry(w, h, d), c, x, y + h / 2, z, ry); }
  function build() {
    const tH = W3D.terrainH;
    // ---- the mole: quay walls (from 15.6 m, below the water) + paved deck
    const sh = new THREE.Shape(MOLE.map(([x, z]) => new THREE.Vector2(x, -z)));
    const mg = new THREE.ExtrudeGeometry(sh, {depth: DECK - 15.6, bevelEnabled: false, curveSegments: 1}); mg.rotateX(-Math.PI / 2); mg.translate(0, 15.6, 0); parts.push([mg, 0xc9bda3]);
    for (let i = 0; i < MOLE.length - 1; i++) { const [ax, az] = MOLE[i], [bx, bz] = MOLE[i + 1], L = Math.hypot(bx - ax, bz - az); if (az > 612 && bz > 612) continue;   // coping stones along the quay edge
      box(L + 0.6, 0.5, 1.2, STONE2, (ax + bx) / 2, DECK, (az + bz) / 2, -Math.atan2(bz - az, bx - ax)); }
    // ---- walled square court with corner towers and a south gate
    const W = 27 * K * 2, hw = W / 2, wh = 6, wt = 2;
    for (const [dx, dz, ry] of [[0, -hw, 0], [0, hw, 0], [-hw, 0, Math.PI / 2], [hw, 0, Math.PI / 2]]) {
      if (dz > 0) { for (const s of [-1, 1]) box(hw - 4, wh, wt, STONE2, C.x + s * (hw / 2 + 2), DECK, C.z + dz); box(8, 1.6, wt, STONE2, C.x, DECK + wh - 1.6, C.z + dz); }   // gate
      else box(W, wh, wt, STONE2, C.x + dx, DECK, C.z + dz, ry);
      if (!LITE) for (let k = -hw + 1.5; k < hw - 1; k += 3) { if (dz > 0 && Math.abs(k) < 5) continue; box(1.4, 1.1, wt, STONE2, C.x + (ry ? dx : k), DECK + wh, C.z + (ry ? k : dz)); } }   // merlons
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { box(6, 9, 6, STONE2, C.x + sx * hw, DECK, C.z + sz * hw); box(7, 0.8, 7, STONE, C.x + sx * hw, DECK + 9, C.z + sz * hw); }
    // ---- plinth + lower square tier (with windows) + cornice + Tritons
    let y = DECK; box(36 * K, 3, 36 * K, STONE, C.x, y, C.z); y += 3;
    const b0 = 15 * K, b1 = 13 * K, h1 = 56 * K; frustum(sq(b0), sq(b1), h1, 4, STONE, y);
    const rows = LITE ? 5 : 9, cols = LITE ? 2 : 3;
    for (let r = 0; r < rows; r++) { const yy = y + 5 + r * (h1 - 9) / (rows - 1), hwid = b0 + (b1 - b0) * (yy - y) / h1 + 0.12;
      for (let c = 0; c < cols; c++) { const u = (c - (cols - 1) / 2) * (2 * hwid / (cols + 0.6));
        for (let f = 0; f < 4; f++) { const a = f * Math.PI / 2; box(1.3, 2.4, 0.4, DARK, C.x + Math.sin(a) * hwid + Math.cos(a) * u, yy, C.z + Math.cos(a) * hwid - Math.sin(a) * u, a); } } }
    box(2 * (b0 + 0.4), 0.5, 0.6, DARK, C.x, y, C.z + b0 + 0.1); box(4, 6, 0.6, DARK, C.x, y, C.z + b0 + 0.05);   // door on the gate side
    y += h1; box(2 * b1 + 2.4, 1.4, 2 * b1 + 2.4, STONE2, C.x, y, C.z); y += 1.4;
    P.terrace = y;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) triton(C.x + sx * (b1 - 0.4), y, C.z + sz * (b1 - 0.4), Math.atan2(sx, sz));
    // ---- octagonal middle tier
    const o0 = 9 * K, o1 = 8 * K, h2 = 27 * K; frustum(o0, o1, h2, 8, STONE, y); if (!LITE) for (let r = 0; r < 3; r++) for (let f = 0; f < 8; f++) { const a = f * Math.PI / 4 + Math.PI / 8, rr = (o0 + (o1 - o0) * (0.3 + r * 0.25)) * Math.cos(Math.PI / 8) + 0.1; box(1, 1.8, 0.3, DARK, C.x + Math.sin(a) * rr, y + h2 * (0.25 + r * 0.25), C.z + Math.cos(a) * rr, a); }
    y += h2; frustum(o1 + 1.6, o1 + 1.6, 1.0, 8, STONE2, y); y += 1.0; P.gallery = y;
    // ---- round lantern: columns around the fire, entablature, dome, Poseidon
    const lr = 6 * K, lh = 8 * K, nc = LITE ? 8 : 12; frustum(lr + 0.4, lr + 0.4, 1, LITE ? 12 : 24, STONE, y); y += 1;
    for (let i = 0; i < nc; i++) { const a = i / nc * Math.PI * 2; col(new THREE.CylinderGeometry(0.4, 0.45, lh, LITE ? 6 : 8), STONE, C.x + Math.sin(a) * lr, y + lh / 2, C.z + Math.cos(a) * lr); }
    P.fireY = y + lh * 0.45; y += lh; frustum(lr + 0.6, lr + 0.6, 1.2, LITE ? 12 : 24, STONE2, y); y += 1.2;
    const dm = new THREE.SphereGeometry(lr + 0.3, LITE ? 12 : 24, LITE ? 4 : 8, 0, Math.PI * 2, 0, Math.PI / 2); dm.scale(1, 0.55, 1); col(dm, STONE, C.x, y, C.z); y += (lr + 0.3) * 0.55;
    y = poseidon(C.x, y, C.z);
    P.height = +(y - DECK).toFixed(1); P.top = y;
    // ---- merge (box-projected UVs in metres for the ashlar texture; colour per vertex)
    let n = 0; for (const [g] of parts) n += (g.index ? g.index.count : g.attributes.position.count);
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2), cl = new Float32Array(n * 3), cc = new THREE.Color(); let o = 0;
    for (const [g0, c] of parts) { const g = g0.index ? g0.toNonIndexed() : g0; g.computeVertexNormals(); const p = g.attributes.position.array, nn = g.attributes.normal.array; cc.setHex(c);
      for (let i = 0; i < p.length / 3; i++) { const t = Math.floor(i / 3) * 9, ax = Math.abs(nn[i * 3]), ay = Math.abs(nn[i * 3 + 1]), az = Math.abs(nn[i * 3 + 2]);
        pos.set([p[i * 3], p[i * 3 + 1], p[i * 3 + 2]], o * 3); nor.set([nn[i * 3], nn[i * 3 + 1], nn[i * 3 + 2]], o * 3); cl.set([cc.r, cc.g, cc.b], o * 3);
        const X = p[i * 3], Y = p[i * 3 + 1], Z = p[i * 3 + 2]; uv.set(ay > ax && ay > az ? [X / 4, Z / 2] : ax > az ? [Z / 4, Y / 2] : [X / 4, Y / 2], o * 2); o++; } }
    const mg2 = new THREE.BufferGeometry(); mg2.setAttribute('position', new THREE.BufferAttribute(pos, 3)); mg2.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); mg2.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); mg2.setAttribute('color', new THREE.BufferAttribute(cl, 3)); mg2.computeBoundingSphere();
    const mat = new THREE.MeshStandardMaterial({map: ashlar(), vertexColors: true, roughness: 0.82, metalness: 0}); if (W3D.env) { mat.envMap = W3D.env; mat.envMapIntensity = 0.6; }
    const mesh = new THREE.Mesh(mg2, mat); mesh.name = 'pharos'; mesh.castShadow = !LITE; mesh.receiveShadow = true; W3D.root.add(mesh); P.mesh = mesh; P.tris = n / 3;
    // ---- the fire (glows at night) and the sweeping beam
    const fire = new THREE.Mesh(new THREE.SphereGeometry(lr * 0.55, 12, 8), new THREE.MeshBasicMaterial({color: 0x8a5a30, fog: false})); fire.position.set(C.x, P.fireY, C.z); fire.name = 'pharos-fire'; W3D.root.add(fire); P.fire = fire;
    const bg = new THREE.ConeGeometry(20, 320, 20, 8, true); bg.translate(0, -160, 0); bg.rotateZ(Math.PI / 2);
    // apex at the fire, pointing +x; vertex colours fade the beam out along its length (additive, so black = invisible)
    { const ps = bg.attributes.position, cs = new Float32Array(ps.count * 3); for (let i = 0; i < ps.count; i++) { const f = Math.pow(Math.max(0, 1 - ps.getX(i) / 320), 1.6); cs[i * 3] = cs[i * 3 + 1] = cs[i * 3 + 2] = f; } bg.setAttribute('color', new THREE.BufferAttribute(cs, 3)); }
    const bm = new THREE.MeshBasicMaterial({color: 0xffe2a0, vertexColors: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false});
    const beam = new THREE.Group(); for (const s of [0, Math.PI]) { const b = new THREE.Mesh(bg, bm); b.rotation.y = s; beam.add(b); } beam.position.copy(fire.position); beam.visible = false; beam.name = 'pharos-beam'; W3D.root.add(beam); P.beam = beam; P.beamMat = bm;
    // ---- walkable: deck, court, terrace, gallery; viewpoint
    const F = W3D.floors; F.push({x0: -966, x1: -900, z0: 538, z1: 612, y: DECK + 0.25}, {x0: C.x - 18 * K, x1: C.x + 18 * K, z0: C.z - 18 * K, z1: C.z + 18 * K, y: DECK + 3},
      {x0: C.x - b1 - 1.2, x1: C.x + b1 + 1.2, z0: C.z - b1 - 1.2, z1: C.z + b1 + 1.2, y: P.terrace}, {x0: C.x - o1 - 1.4, x1: C.x + o1 + 1.4, z0: C.z - o1 - 1.4, z1: C.z + o1 + 1.4, y: P.gallery});
    W3D.spots = W3D.spots || {}; W3D.spots.pharos = P.go = () => { W3D.teleportTo(C.x, P.gallery + 0.05, C.z - o1 - 0.6, -62); if (window.JFVR && JFVR.hud) JFVR.hud('Pharos lantern gallery - ' + Math.round(P.gallery - 16.5) + ' m above the pond'); };
    clearTrees(); P.ready = true; menu();
  }
  function triton(x, y, z, a) {   // merman blowing a conch: fish tail coiled on the cornice, torso, head, raised conch
    const g = []; const tail = new THREE.TorusGeometry(1.1, 0.42, LITE ? 4 : 6, LITE ? 6 : 10, Math.PI * 1.3); tail.rotateX(Math.PI / 2); tail.translate(0, 0.5, 0.4); g.push(tail);
    const fin = new THREE.ConeGeometry(0.5, 1.1, 4); fin.rotateZ(Math.PI / 2); fin.translate(-1.3, 0.5, 0.9); g.push(fin);
    const torso = new THREE.CylinderGeometry(0.45, 0.6, 2.2, LITE ? 6 : 8); torso.translate(0, 2.0, 0); g.push(torso);
    const head = new THREE.SphereGeometry(0.42, LITE ? 6 : 10, LITE ? 4 : 6); head.translate(0, 3.45, 0); g.push(head);
    const arm = new THREE.CylinderGeometry(0.14, 0.16, 1.4, 5); arm.rotateZ(-0.9); arm.translate(0.6, 2.9, 0.3); g.push(arm);
    const conch = new THREE.ConeGeometry(0.32, 1.5, LITE ? 5 : 8); conch.rotateX(-Math.PI / 2 + 0.5); conch.translate(0.15, 3.6, 0.95); g.push(conch);
    for (const q of g) { q.rotateY(a); q.translate(x, y, z); parts.push([q, 0xcfc4ac]); }
  }
  function poseidon(x, y, z) {   // on a drum: robed figure with a raised trident
    col(new THREE.CylinderGeometry(1.2, 1.4, 1.6, LITE ? 8 : 12), STONE2, x, y + 0.8, z); y += 1.6;
    col(new THREE.CylinderGeometry(0.55, 0.9, 3.4, LITE ? 6 : 10), 0xcfc4ac, x, y + 1.7, z); col(new THREE.SphereGeometry(0.45, LITE ? 6 : 10, LITE ? 4 : 6), 0xcfc4ac, x, y + 3.85, z);
    col(new THREE.CylinderGeometry(0.13, 0.15, 1.6, 5).rotateZ(0.5), 0xcfc4ac, x + 0.55, y + 3.4, z);
    col(new THREE.CylinderGeometry(0.07, 0.07, 6.4, 5), 0xb8ad94, x + 0.95, y + 3.0, z); for (const dx of [-0.35, 0, 0.35]) col(new THREE.ConeGeometry(0.09, 0.7, 4), 0xb8ad94, x + 0.95 + dx, y + 6.5, z);
    col(new THREE.BoxGeometry(0.9, 0.12, 0.12), 0xb8ad94, x + 0.95, y + 6.1, z); return y + 6.85;
  }
  function clearTrees() {   // no trees from the old tree list stand on the court / mole
    const m4 = new THREE.Matrix4(), v = new THREE.Vector3(), zero = new THREE.Matrix4().makeScale(0, 0, 0); let n = 0;
    W3D.root.traverse(o => { if (!o.isInstancedMesh || !/^trees$/.test(o.name)) return; let ch = false; for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m4); v.setFromMatrixPosition(m4); if (Math.hypot(v.x - C.x, v.z - (C.z + 2)) < 52 && v.z < 616) { o.setMatrixAt(i, zero); ch = true; n++; } } if (ch) o.instanceMatrix.needsUpdate = true; });
    P.treesCleared = n;
  }
  function menu() {
    const tools = document.querySelector('#ui .tools'); if (tools && !document.getElementById('pharosbtn')) { const b = document.createElement('button'); b.id = 'pharosbtn'; b.textContent = 'Pharos top'; b.onclick = e => { e.stopPropagation(); W3D.spots.pharos(); }; tools.appendChild(b); }
    const bar = document.getElementById('vrbar'); if (bar && !document.getElementById('pharosvr')) { const p = document.createElement('a-plane'); p.id = 'pharosvr'; p.setAttribute('class', 'btn'); p.setAttribute('position', '0 -1.6 0'); p.setAttribute('width', '1.2'); p.setAttribute('height', '0.26'); p.setAttribute('material', 'shader:flat;color:#FFD700');
      const t = document.createElement('a-text'); t.setAttribute('value', 'Pharos top'); t.setAttribute('align', 'center'); t.setAttribute('color', '#111'); t.setAttribute('width', '2'); p.appendChild(t); p.addEventListener('click', () => W3D.spots.pharos()); bar.appendChild(p);
      setTimeout(() => document.querySelectorAll('[raycaster]').forEach(r => r.components.raycaster && r.components.raycaster.refreshObjects()), 500); }
  }
  const dayFire = new THREE.Color(0x8a5a30), nightFire = new THREE.Color(0xffc060);
  AFRAME.registerComponent('w3d-pharos', { tick: function (t, dt) {
    if (!P.ready) { if (window.W3D_READY && W3D.root && W3D.terrainH && W3D.floors && !P.started) { P.started = true; build(); } return; }
    const n = window.JFVR_NIGHT ? +JFVR_NIGHT.n || 0 : 0, fl = 0.92 + 0.08 * Math.sin(t / 130) * Math.sin(t / 370);
    P.fire.material.color.copy(dayFire).lerp(nightFire, Math.min(1, 0.25 + n)).multiplyScalar(n > 0.05 ? fl * (1 + n * 0.6) : 1);
    P.beam.visible = n > 0.05 && W3D.root.visible; if (P.beam.visible) { P.beam.rotation.y = (t / 1000) * (Math.PI * 2 / 16); P.beamMat.opacity = 0.16 * n; }   // one turn every 16 s
  } });
  const attach = () => { const sc = document.querySelector('a-scene'); if (sc) sc.setAttribute('w3d-pharos', ''); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attach); else attach();
})();
