/* Debutante Hotel + ballroom (staging only, Nov 27 2026). Lakeshore just east of the Pharos, north of St. Joseph Cemetery,
   not on the lighthouse lot. Buckingham-style pale stone facade and gated east forecourt, Windsor crenellations and a
   round tower at the west end, Versailles parterres stepping down to the lake. Ground-floor doors enter ?room=ballroom.
   Hotel floors are the upper storeys. Royal-guard sentries, guard house, cameras, iron fence, hedges and lamps.
   Public-history panel only. Lean merged meshes + one instanced guard. */
(function () {
  'use strict';
  const W3D = window.W3D = window.W3D || {};
  const LITE = !!window.JFVR_LITE;
  const CX = -800, CZ = 648;                         // ~140 m ESE of the Pharos (-933, 568); north of the cemetery (starts ~z 660 here)
  const WATER = 16.5;
  const STONE = 0xe8e0d0, STONE2 = 0xd4cbb8, GOLD = 0xc9a24a, IRON = 0x1c1c1e, HEDGE = 0x3a5a32, RED = 0x9a1e2c, GRAVEL = 0xb7a78a;
  let site = null, added = {floors: [], walls: []}, keepOut = null, GY = 18;

  function hud(m) { if (W3D.toast) W3D.toast(m, 3000); else if (window.JFVR && JFVR.hud) JFVR.hud(m); }
  function tH(x, z) { const y = W3D.terrainH ? W3D.terrainH(x, z) : 0; return isFinite(y) ? y : 0; }
  function tex(T, w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h);
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace || t.colorSpace; t.anisotropy = 4; t.wrapS = t.wrapT = T.RepeatWrapping; return t; }
  function kit(T) {
    const parts = [], m4 = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), v = new T.Vector3(), sc = new T.Vector3();
    function add(g, color, x, y, z, rx, ry, rz, sx, sy, sz) {
      e.set(rx || 0, ry || 0, rz || 0); q.setFromEuler(e); v.set(x || 0, y || 0, z || 0); sc.set(sx || 1, sy == null ? (sx || 1) : sy, sz == null ? (sx || 1) : sz);
      m4.compose(v, q, sc); const n = g.index ? g.toNonIndexed() : g; if (n !== g) g.dispose(); n.applyMatrix4(m4); parts.push([n, new T.Color(color)]); }
    function build() {
      let n = 0; parts.forEach(([g]) => { n += g.attributes.position.count; });
      const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3); let o = 0;
      parts.forEach(([g, c]) => { pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3);
        for (let i = 0; i < g.attributes.position.count; i++) { col[(o + i) * 3] = c.r; col[(o + i) * 3 + 1] = c.g; col[(o + i) * 3 + 2] = c.b; }
        o += g.attributes.position.count; g.dispose(); });
      parts.length = 0; const out = new T.BufferGeometry();
      out.setAttribute('position', new T.BufferAttribute(pos, 3)); out.setAttribute('normal', new T.BufferAttribute(nor, 3));
      out.setAttribute('color', new T.BufferAttribute(col, 3)); out.computeBoundingSphere(); return out;
    }
    return {add, build};
  }

  function guardGeo(T) {
    const K = kit(T);
    K.add(new T.CylinderGeometry(0.07, 0.06, 0.85, 6), 0x1a1a22, 0.1, 0.45, 0);
    K.add(new T.CylinderGeometry(0.07, 0.06, 0.85, 6), 0x1a1a22, -0.1, 0.45, 0);
    K.add(new T.BoxGeometry(0.1, 0.05, 0.22), 0x111111, 0.1, 0.03, -0.02);
    K.add(new T.BoxGeometry(0.1, 0.05, 0.22), 0x111111, -0.1, 0.03, -0.02);
    K.add(new T.CylinderGeometry(0.2, 0.17, 0.7, 8), RED, 0, 1.22, 0);                          // red tunic
    K.add(new T.BoxGeometry(0.12, 0.4, 0.02), 0xf4f0e6, 0, 1.28, -0.18);                        // white cross-belt
    K.add(new T.BoxGeometry(0.36, 0.06, 0.04), GOLD, 0, 1.52, 0);
    K.add(new T.CylinderGeometry(0.05, 0.045, 0.62, 5), RED, 0.24, 1.18, 0);
    K.add(new T.CylinderGeometry(0.05, 0.045, 0.62, 5), RED, -0.24, 1.18, 0);
    K.add(new T.SphereGeometry(0.045, 5, 4), 0xf1c9a5, 0.24, 0.86, 0);
    K.add(new T.SphereGeometry(0.045, 5, 4), 0xf1c9a5, -0.24, 0.86, 0);
    K.add(new T.SphereGeometry(0.11, 8, 6), 0xf1c9a5, 0, 1.66, 0);
    K.add(new T.SphereGeometry(0.16, 8, 6), 0x1a1612, 0, 1.86, 0, 0, 0, 0, 1, 1.25, 1);         // bearskin
    K.add(new T.CylinderGeometry(0.012, 0.01, 1.15, 4), GOLD, 0.32, 1.55, -0.05, 0.15, 0, 0.2);  // rifle / staff
    return K.build();
  }

  function merlons(K, T, x0, x1, z0, z1, y, alongX) {
    const step = 1.7;
    if (alongX) { for (let x = x0 + 0.4; x < x1 - 0.3; x += step) K.add(new T.BoxGeometry(0.9, 0.85, 0.7), STONE2, x, y + 0.42, (z0 + z1) / 2); }
    else { for (let z = z0 + 0.4; z < z1 - 0.3; z += step) K.add(new T.BoxGeometry(0.7, 0.85, 0.9), STONE2, (x0 + x1) / 2, y + 0.42, z); }
  }

  function windowRow(K, T, xs, y, z, w, h, ry) {
    xs.forEach(x => {
      K.add(new T.BoxGeometry(w + 0.16, h + 0.16, 0.16), STONE2, x, y, z, 0, ry || 0, 0);
      K.add(new T.BoxGeometry(w, h, 0.08), 0x6e8494, x, y, z + (ry ? 0 : 0.06), 0, ry || 0, 0);
      K.add(new T.BoxGeometry(0.04, h, 0.04), 0xf2ebe0, x, y, z + (ry ? 0 : 0.1));
    });
  }

  function build() {
    if (site || !W3D.root || typeof THREE === 'undefined') return;
    const T = THREE;
    // platform height: stay above the water; use the highest nearby ground so nothing sinks
    let yMax = WATER + 0.4;
    for (let x = CX - 22; x <= CX + 36; x += 8) for (let z = CZ - 22; z <= CZ + 12; z += 8) yMax = Math.max(yMax, tH(x, z));
    GY = Math.max(WATER + 0.45, yMax - 0.15);
    const g = new T.Group(); g.name = 'debhotel'; g.position.set(CX, GY, CZ);
    const K = kit(T), BW = 36, BD = 14, BH = 16.2;   // local: +x east, +z south, -z lake

    // plinth / terrace deck
    K.add(new T.BoxGeometry(BW + 4, 0.5, BD + 6), STONE2, 0, -0.15, 1);
    K.add(new T.BoxGeometry(BW + 2, 0.35, 18), STONE2, 0, -0.35, -14);                          // garden terraces sit on this

    // main hotel block
    K.add(new T.BoxGeometry(BW, 5.2, BD), STONE, 0, 2.6, 0);                                    // rusticated ground (ballroom)
    K.add(new T.BoxGeometry(BW + 0.3, 0.35, BD + 0.3), STONE2, 0, 5.25, 0);
    K.add(new T.BoxGeometry(BW, 10.4, BD - 0.4), STONE, 0, 10.5, 0);                             // piano nobile + two hotel floors
    K.add(new T.BoxGeometry(BW + 0.8, 0.55, BD + 0.8), STONE2, 0, 15.85, 0);                      // cornice
    K.add(new T.BoxGeometry(BW + 0.4, 0.45, BD + 0.4), STONE, 0, 16.3, 0);                        // battlement walk
    merlons(K, T, -BW / 2, BW / 2, -BD / 2 - 0.2, -BD / 2 + 0.2, 16.5, true);
    merlons(K, T, -BW / 2, BW / 2, BD / 2 - 0.2, BD / 2 + 0.2, 16.5, true);
    merlons(K, T, -BW / 2 - 0.2, -BW / 2 + 0.2, -BD / 2, BD / 2, 16.5, false);
    merlons(K, T, BW / 2 - 0.2, BW / 2 + 0.2, -BD / 2, BD / 2, 16.5, false);

    // square corner towers (Windsor), east end of the block
    for (const [tx, tz] of [[BW / 2 - 0.2, -BD / 2], [BW / 2 - 0.2, BD / 2]]) {
      K.add(new T.BoxGeometry(5.2, 18.5, 5.2), STONE2, tx, 9.25, tz);
      K.add(new T.BoxGeometry(5.8, 0.45, 5.8), STONE, tx, 18.7, tz);
      merlons(K, T, tx - 2.6, tx + 2.6, tz - 2.6, tz - 2.1, 18.9, true);
      merlons(K, T, tx - 2.6, tx + 2.6, tz + 2.1, tz + 2.6, 18.9, true);
    }

    // Windsor Round Tower at the west end
    K.add(new T.CylinderGeometry(5.4, 5.6, 20.5, LITE ? 12 : 20), STONE2, -BW / 2 - 2.2, 10.25, 0);
    K.add(new T.CylinderGeometry(5.9, 5.9, 0.5, LITE ? 12 : 20), STONE, -BW / 2 - 2.2, 20.6, 0);
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; if (i % 2) continue;
      K.add(new T.BoxGeometry(0.85, 0.95, 0.7), STONE2, -BW / 2 - 2.2 + Math.sin(a) * 5.6, 21.15, Math.cos(a) * 5.6, 0, a, 0); }
    K.add(new T.CylinderGeometry(1.1, 1.2, 2.4, 8), STONE, -BW / 2 - 2.2, 22.4, 0);              // flag staff base
    K.add(new T.CylinderGeometry(0.05, 0.05, 4.2, 4), IRON, -BW / 2 - 2.2, 25.4, 0);
    K.add(new T.BoxGeometry(1.5, 0.9, 0.04), 0x1d3a7a, -BW / 2 - 1.5, 26.6, 0);                  // a simple blue flag

    // Buckingham portico + balcony on the EAST (arrival) facade
    const EX = BW / 2 + 0.2;
    for (const z of [-3.2, -1.05, 1.05, 3.2]) {
      K.add(new T.CylinderGeometry(0.38, 0.42, 7.2, 8), STONE, EX + 2.1, 3.6, z);                // columns
      K.add(new T.BoxGeometry(0.7, 0.25, 0.7), STONE2, EX + 2.1, 0.12, z);
      K.add(new T.BoxGeometry(0.8, 0.3, 0.8), STONE2, EX + 2.1, 7.25, z);
    }
    K.add(new T.BoxGeometry(5.2, 0.45, 8.6), STONE, EX + 2.0, 7.55, 0);                           // balcony deck
    K.add(new T.BoxGeometry(5.2, 0.12, 0.12), GOLD, EX + 2.0, 8.15, -4.2);
    K.add(new T.BoxGeometry(5.2, 0.12, 0.12), GOLD, EX + 2.0, 8.15, 4.2);
    K.add(new T.BoxGeometry(0.12, 0.6, 8.6), GOLD, EX + 4.5, 7.9, 0);
    K.add(new T.BoxGeometry(6.2, 1.8, 9.2), STONE2, EX + 1.6, 10.6, 0);                           // pediment block
    K.add(new T.ConeGeometry(5.4, 2.4, 4), STONE, EX + 1.6, 12.5, 0, 0, Math.PI / 4, 0, 0.55, 1, 1);

    // grand door (into the lobby / ballroom)
    K.add(new T.BoxGeometry(2.6, 4.2, 0.2), 0x3a2a18, EX + 0.15, 2.2, 0);
    K.add(new T.BoxGeometry(2.9, 0.18, 0.25), GOLD, EX + 0.15, 4.4, 0);
    K.add(new T.BoxGeometry(0.12, 3.8, 0.08), GOLD, EX + 0.15, 2.2, -0.7);
    K.add(new T.BoxGeometry(0.12, 3.8, 0.08), GOLD, EX + 0.15, 2.2, 0.7);

    // windows: ground arched bays on the lake front, regular hotel windows above
    const nx = []; for (let i = -5; i <= 5; i++) if (Math.abs(i) > 0) nx.push(i * 2.9);
    nx.forEach(x => {                                                                             // north (lake) arched ground windows
      K.add(new T.BoxGeometry(2.0, 3.4, 0.12), 0x6e8494, x, 2.4, -BD / 2 - 0.08);
      K.add(new T.BoxGeometry(2.2, 0.14, 0.16), GOLD, x, 4.2, -BD / 2 - 0.1);
    });
    const floorsY = [6.8, 10.4, 13.8];
    floorsY.forEach(y => {
      windowRow(K, T, nx.concat(0), y, -BD / 2 - 0.05, 1.35, 2.1);
      windowRow(K, T, nx, y, BD / 2 + 0.05, 1.35, 2.1);
    });

    // lobby interior (shallow, open through the east door): check-in desk
    K.add(new T.BoxGeometry(4.2, 0.08, 8), 0xc4a574, EX - 2.2, 0.06, 0);                         // parquet floor
    K.add(new T.BoxGeometry(2.6, 1.15, 0.7), 0x5a3a22, EX - 2.6, 0.65, 2.2);                     // desk
    K.add(new T.BoxGeometry(2.6, 0.06, 0.7), GOLD, EX - 2.6, 1.24, 2.2);
    K.add(new T.BoxGeometry(0.5, 1.6, 0.4), 0x3a2a18, EX - 2.6, 0.8, 3.1);                       // chair

    // gravel east forecourt
    K.add(new T.BoxGeometry(16, 0.08, 16), GRAVEL, EX + 10, 0.02, 0);

    // black-and-gold gates + stone piers
    const GX = EX + 16.5;
    for (const z of [-4.2, 4.2]) {
      K.add(new T.BoxGeometry(1.1, 3.4, 1.1), STONE, GX, 1.7, z);
      K.add(new T.BoxGeometry(1.3, 0.25, 1.3), GOLD, GX, 3.45, z);
      K.add(new T.SphereGeometry(0.18, 6, 4), GOLD, GX, 3.7, z);
    }
    for (const z of [-1.5, 1.5]) {                                                                // open gate leaves
      K.add(new T.BoxGeometry(0.08, 2.8, 2.4), IRON, GX - 0.4, 1.5, z, 0, z > 0 ? 0.5 : -0.5, 0);
      K.add(new T.BoxGeometry(0.08, 0.08, 2.4), GOLD, GX - 0.4, 2.7, z, 0, z > 0 ? 0.5 : -0.5, 0);
    }
    // guard house, south of the gate
    K.add(new T.BoxGeometry(4.2, 3.4, 3.6), STONE2, GX - 2, 1.7, 8.2);
    K.add(new T.BoxGeometry(4.8, 0.3, 4.2), 0x4a3020, GX - 2, 3.55, 8.2);
    K.add(new T.BoxGeometry(0.9, 1.2, 0.08), 0x6e8494, GX - 2, 2.0, 6.4);
    K.add(new T.BoxGeometry(0.8, 2.2, 0.1), 0x3a2a18, GX - 0.4, 1.15, 6.4);

    // Versailles parterres stepping down to the lake (north, -z)
    for (let t = 0; t < 3; t++) {
      const zz = -BD / 2 - 3.2 - t * 4.4, yy = -0.15 - t * 0.28, ww = BW - t * 2;
      K.add(new T.BoxGeometry(ww, 0.2, 4.0), 0x6b8f4a, 0, yy, zz);                               // lawn bed
      K.add(new T.BoxGeometry(ww - 1.2, 0.45, 0.35), HEDGE, 0, yy + 0.3, zz - 1.5);
      K.add(new T.BoxGeometry(ww - 1.2, 0.45, 0.35), HEDGE, 0, yy + 0.3, zz + 1.5);
      K.add(new T.BoxGeometry(0.35, 0.45, 3.2), HEDGE, -ww / 2 + 1.2, yy + 0.3, zz);
      K.add(new T.BoxGeometry(0.35, 0.45, 3.2), HEDGE, ww / 2 - 1.2, yy + 0.3, zz);
      K.add(new T.BoxGeometry(1.4, 0.08, 3.6), GRAVEL, 0, yy + 0.12, zz);                         // centre path
      if (!LITE) { K.add(new T.CylinderGeometry(0.6, 0.7, 0.25, 8), 0x8a9aaa, -ww / 4, yy + 0.15, zz); K.add(new T.CylinderGeometry(0.6, 0.7, 0.25, 8), 0x8a9aaa, ww / 4, yy + 0.15, zz); }
    }
    K.add(new T.BoxGeometry(BW - 4, 0.25, 3.2), STONE2, 0, -0.95, -BD / 2 - 16.2);                // lakeside terrace

    // perimeter hedges (south and west buffers; stay north of the cemetery)
    K.add(new T.BoxGeometry(BW + 28, 1.3, 0.55), HEDGE, 4, 0.65, BD / 2 + 4.5);
    K.add(new T.BoxGeometry(0.55, 1.3, BD + 22), HEDGE, -BW / 2 - 8.5, 0.65, -4);
    K.add(new T.BoxGeometry(0.55, 1.3, BD + 10), HEDGE, EX + 18.5, 0.65, 2);

    // iron fence posts along the east approach and south hedge
    for (let z = -6; z <= 8; z += 2.2) K.add(new T.BoxGeometry(0.1, 1.8, 0.1), IRON, GX + 0.6, 0.9, z);
    K.add(new T.BoxGeometry(0.06, 0.06, 14), IRON, GX + 0.6, 1.6, 1);
    K.add(new T.BoxGeometry(0.06, 0.06, 14), GOLD, GX + 0.6, 1.15, 1);

    // lamp posts
    const lamps = [[GX - 3, -6], [GX - 3, 6], [-8, -BD / 2 - 2], [8, -BD / 2 - 2], [0, -BD / 2 - 16], [EX + 4, 0]];
    lamps.forEach(([x, z]) => {
      K.add(new T.CylinderGeometry(0.08, 0.1, 3.4, 6), IRON, x, 1.7, z);
      K.add(new T.SphereGeometry(0.22, 8, 6), 0xffe6b0, x, 3.55, z);
    });

    // security cameras on the four facade corners
    [[-BW / 2, -BD / 2], [BW / 2, -BD / 2], [-BW / 2, BD / 2], [BW / 2, BD / 2]].forEach(([x, z]) => {
      K.add(new T.BoxGeometry(0.18, 0.12, 0.28), IRON, x, 8.6, z);
      K.add(new T.SphereGeometry(0.07, 6, 4), 0x222222, x, 8.55, z + (z < 0 ? -0.18 : 0.18));
    });

    const arch = new T.Mesh(K.build(), new T.MeshLambertMaterial({vertexColors: true})); g.add(arch);

    // limestone overlay on the main north and east faces (one shared ashlar texture, two quads)
    const ash = tex(T, 256, 256, (x, w, h) => { x.fillStyle = '#efe8da'; x.fillRect(0, 0, w, h);
      for (let r = 0; r < 10; r++) { const off = (r % 2) * 16; for (let k = -1; k < 9; k++) {
        const v = 220 + ((r * 13 + k * 7) % 18); x.fillStyle = 'rgb(' + v + ',' + (v - 6) + ',' + (v - 16) + ')'; x.fillRect(k * 32 + off + 1, r * 25 + 1, 30, 23); } }
      x.fillStyle = 'rgba(110,95,75,0.28)'; for (let r = 0; r <= 10; r++) x.fillRect(0, r * 25 - 1, 256, 2); });
    ash.repeat.set(8, 4);
    const ns = new T.Mesh(new T.PlaneGeometry(BW - 1, 14), new T.MeshLambertMaterial({map: ash})); ns.position.set(0, 8, -BD / 2 - 0.21); g.add(ns);

    // royal guards (instanced)
    const gGeo = guardGeo(T), nG = LITE ? 6 : 10;
    const im = new T.InstancedMesh(gGeo, new T.MeshLambertMaterial({vertexColors: true}), nG);
    const m4 = new T.Matrix4(), q = new T.Quaternion(), eul = new T.Euler(), p = new T.Vector3(), s = new T.Vector3(1, 1, 1);
    // [x, z, yaw deg]  yaw 0 faces -z (north / lake); 90 faces +x (east)
    const posts = [
      [GX - 1.2, -3.2, 90], [GX - 1.2, 3.2, 90],          // gates
      [EX + 1.0, -2.0, 90], [EX + 1.0, 2.0, 90],          // ballroom / portico doors
      [EX - 2.0, 0.6, 90], [EX - 3.4, 2.2, -20],          // lobby (one at the desk)
      [ -6, -BD / 2 - 16.2, 180], [6, -BD / 2 - 16.2, 180] // lakeside terrace
    ];
    if (!LITE) { posts.push([GX - 2, 6.6, 0], [-BW / 2 - 2, -BD / 2 - 2, 180]); }
    posts.slice(0, nG).forEach((row, i) => { eul.set(0, row[2] * Math.PI / 180, 0); q.setFromEuler(eul); p.set(row[0], 0, row[1]); m4.compose(p, q, s); im.setMatrixAt(i, m4); });
    im.instanceMatrix.needsUpdate = true; g.add(im);

    // lamps that actually emit a little light (desktop only)
    if (!LITE) lamps.slice(0, 3).forEach(([x, z]) => { const l = new T.PointLight(0xffe0a8, 0.55, 14, 1.4); l.position.set(x, 3.5, z); g.add(l); });
    g.add(new T.HemisphereLight(0xfff4e0, 0x5a4a38, 0.15));

    // history panel (east of the portico, facing the forecourt)
    const panelTex = tex(T, 1024, 768, (x, w, h) => {
      x.fillStyle = '#1d1408'; x.fillRect(0, 0, w, h); x.strokeStyle = '#c9a24a'; x.lineWidth = 12; x.strokeRect(16, 16, w - 32, h - 32);
      const lines = [
        ['THE DEBUTANTE HOTEL', 42, '#f4d27a'],
        ['An artistic tribute, blending three palaces.', 26, '#f6ecd6'],
        ['', 16],
        ['The Hall of Mirrors at the Palace of Versailles was designed', 24],
        ['by Jules Hardouin-Mansart and built in 1678-1684. It is 73 m', 24],
        ['long, with 17 arched windows facing the gardens and 17', 24],
        ['arched mirrors on the opposite wall.', 24],
        ['', 14],
        ["Buckingham Palace's east front, in Portland stone, is by", 24],
        ['Sir Aston Webb (completed 1913). The central balcony is', 24],
        ['where the royal family appears.', 24],
        ['', 14],
        ['Windsor Castle has been a royal residence for more than', 24],
        ['900 years. Henry II began its Round Tower in the 12th century.', 24],
        ['', 14],
        ['The National Debutante Cotillion and Thanksgiving Ball was', 24],
        ['founded in 1949 by Mary-Stuart "Studie" Montague Price and', 24],
        ['is held in Washington, D.C., each Thanksgiving season. The', 24],
        ['Mayflower Hotel, opened 18 February 1925, has often hosted it.', 24]
      ];
      x.textAlign = 'center'; let y = 78;
      lines.forEach(([s, sz, c]) => { x.fillStyle = c || '#f6ecd6'; x.font = (sz > 36 ? 'bold ' : '') + sz + 'px Georgia, serif'; if (s) x.fillText(s, w / 2, y); y += sz * 1.4; });
    });
    panelTex.wrapS = panelTex.wrapT = T.ClampToEdgeWrapping;
    const panel = new T.Mesh(new T.PlaneGeometry(2.6, 2.0), new T.MeshBasicMaterial({map: panelTex})); panel.position.set(EX + 5.2, 1.7, 5.6); panel.rotation.y = -0.9; g.add(panel);
    const frame = new T.Mesh(new T.BoxGeometry(2.75, 2.15, 0.08), new T.MeshLambertMaterial({color: GOLD})); frame.position.copy(panel.position); frame.position.z += 0.06; frame.rotation.copy(panel.rotation); g.add(frame);

    W3D.root.add(g); site = g;

    // walkable floors + walls (world metres)
    const F = W3D.floors || (W3D.floors = []), WL = W3D.walls || (W3D.walls = []);
    const fl = (x0, x1, z0, z1, y) => { const o = {x0: CX + x0, x1: CX + x1, z0: CZ + z0, z1: CZ + z1, y: GY + y}; F.push(o); added.floors.push(o); };
    const wa = (x0, x1, z0, z1, y0, y1) => { const o = {x0: CX + x0, x1: CX + x1, z0: CZ + z0, z1: CZ + z1, y0: GY + y0, y1: GY + y1}; WL.push(o); added.walls.push(o); };
    fl(-BW / 2 + 0.4, BW / 2 - 0.4, -BD / 2 + 0.4, BD / 2 - 0.4, 0.08);                          // interior floor
    fl(EX, EX + 16, -8, 8, 0.06);                                                                 // forecourt
    fl(-BW / 2, BW / 2, -BD / 2 - 17, -BD / 2, 0.02);                                             // gardens / terrace
    wa(-BW / 2, BW / 2, -BD / 2 - 0.3, -BD / 2 + 0.15, 0, 5);                                     // north wall (open bays still block running through stone)
    wa(-BW / 2, BW / 2, BD / 2 - 0.15, BD / 2 + 0.3, 0, 16);
    wa(-BW / 2 - 0.3, -BW / 2 + 0.15, -BD / 2, BD / 2, 0, 16);
    wa(EX - 0.1, EX + 0.35, -BD / 2, -1.3, 0, 5); wa(EX - 0.1, EX + 0.35, 1.3, BD / 2, 0, 5);     // east wall, door gap in the middle

    W3D.keepOut = W3D.keepOut || [];
    keepOut = {x: CX + 4, z: CZ - 2, r: 36, name: 'the Debutante Hotel'}; W3D.keepOut.push(keepOut);

    // clickable door into the existing ballroom room
    const door = document.createElement('a-plane'); door.setAttribute('class', 'btn'); door.setAttribute('width', 2.5); door.setAttribute('height', 4.0);
    door.setAttribute('position', (CX + EX + 0.22) + ' ' + (GY + 2.2) + ' ' + CZ); door.setAttribute('rotation', '0 -90 0');
    door.setAttribute('material', 'shader:flat;color:#3a2a18;opacity:0.15;transparent:true');
    const tx = document.createElement('a-text'); tx.setAttribute('value', 'Grand Ballroom  >'); tx.setAttribute('align', 'center'); tx.setAttribute('color', '#f4d27a'); tx.setAttribute('width', 5); tx.setAttribute('position', '0 0 0.05');
    door.appendChild(tx); door.addEventListener('click', enterBallroom);
    const sc = document.querySelector('a-scene'); if (sc) sc.appendChild(door); g.userData.door = door;

    wireMenus(); wireSpot(); wrapBallroom();
    console.log('debhotel: built at', CX, GY.toFixed(1), CZ);
  }

  function enterBallroom() {
    const R = window.FP_ROOMS; if (!R || R.busy) return;
    hud('Entering the Grand Ballroom...');
    const go = () => R.enter('ballroom', {via: 'hotel'}).then(ok => { if (!ok) hud('The Grand Ballroom could not load'); });
    if (R.current === 'ballroom') return; if (R.current) R.leave({}).then(go); else go();
  }

  function wireSpot() {
    const go = () => { if (!site) return setTimeout(go, 300); W3D.teleportTo(CX + 22, undefined, CZ, 90); hud('Debutante Hotel - gated forecourt'); };
    W3D.spots = W3D.spots || {}; W3D.spots['debutante-hotel'] = go; W3D.spots.debutante = go; W3D.spots.debhotel = go;
  }

  function wireMenus() {
    const enter = ev => { if (ev) ev.preventDefault(); if (typeof window.goWorld === 'function') window.goWorld('debutante-hotel'); else if (W3D.spots && W3D.spots['debutante-hotel']) W3D.spots['debutante-hotel'](); };
    const pond = document.querySelector('#gs-pond .jf-body') || document.getElementById('go-far') || document.getElementById('ui');
    if (pond && !document.getElementById('debhotellink')) {
      const b = document.createElement('button'); b.id = 'debhotellink'; b.type = 'button'; b.textContent = 'Debutante Hotel';
      b.addEventListener('click', enter); pond.appendChild(b);
      // menutabs files unknown keys under Settings; keep this one in Fowling Pond
      const home = () => { const body = document.querySelector('#gs-pond .jf-body'); if (body && b.parentNode !== body) body.appendChild(b); };
      setTimeout(home, 800); setTimeout(home, 2500);
    }
    const bar = document.getElementById('vrbar');
    if (bar && !document.getElementById('jfv-debhotel')) {
      const p = document.createElement('a-plane'); p.id = 'jfv-debhotel'; p.className = 'btn';
      p.setAttribute('width', 1.3); p.setAttribute('height', 0.26); p.setAttribute('material', 'shader:flat;color:#FFD700');
      const t = document.createElement('a-text'); t.setAttribute('value', 'Debutante Hotel'); t.setAttribute('align', 'center'); t.setAttribute('color', '#111'); t.setAttribute('width', 2.0); t.setAttribute('position', '0 0 0.005');
      p.appendChild(t); p.addEventListener('click', enter); bar.appendChild(p);
    }
  }

  /* Staging-only Hall of Mirrors pass on the existing ballroom room: arched mirrors along the side walls, extra gilt frames. */
  function addMirrors(rootEl) {
    if (!rootEl || !rootEl.object3D || rootEl._mirrors) return; rootEl._mirrors = 1;
    const T = window.THREE, g = new T.Group(); g.name = 'hall-mirrors';
    const glass = new T.MeshPhongMaterial({color: 0xc5d0da, shininess: 120, specular: 0xbfd0e0, reflectivity: 0.6});
    const gilt = new T.MeshLambertMaterial({color: GOLD});
    for (const side of [-13.6, 13.6]) for (let i = 0; i < 8; i++) {
      const z = -16 + i * 3.15;
      const m = new T.Mesh(new T.PlaneGeometry(1.7, 3.6), glass); m.position.set(side, 2.6, z); m.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2; g.add(m);
      const fr = new T.Mesh(new T.BoxGeometry(1.9, 3.8, 0.08), gilt); fr.position.set(side + (side > 0 ? -0.04 : 0.04), 2.6, z); fr.rotation.y = m.rotation.y; g.add(fr);
    }
    rootEl.object3D.add(g);
  }
  function wrapBallroom() {
    const R = window.FP_ROOMS; if (!R || R._debWrap) { if (!R) setTimeout(wrapBallroom, 400); return; }
    R._debWrap = 1; const enter = R.enter.bind(R);
    R.enter = function (name, opts) { return enter(name, opts).then(ok => { if (ok && name === 'ballroom') setTimeout(() => addMirrors(document.getElementById('fproom-ballroom')), 200); return ok; }); };
  }

  function goSpot() { if (!site) return setTimeout(goSpot, 400); W3D.spots['debutante-hotel'](); }

  (function attach() {
    const sc = document.querySelector('a-scene'); if (!sc) return setTimeout(attach, 300);
    const start = () => { if (!W3D.root || !W3D.terrainH) return setTimeout(start, 400); try { build(); } catch (e) { console.error("debhotel build", e && e.stack || e); } };
    if (window.W3D_READY) start(); else { const iv = setInterval(() => { if (window.W3D_READY) { clearInterval(iv); start(); } }, 400); setTimeout(() => clearInterval(iv), 180000); }
    wireSpot();
  })();

  window.FP_DEBHOTEL = {enter: enterBallroom, go: goSpot, built: () => !!site, origin: {x: CX, z: CZ}};
})();
