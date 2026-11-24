/* Street-level 3D houses around Fowling Pond: every Overture Maps building (2026-11-18.0; OSM + ML footprints, 4.5k with measured
   heights) within ~1.5 km of the pond, as solid walls with siding + windows and real roofs (gabled on house-sized rectangular
   footprints, ridge along the long side; flat on the rest). Standing on the terrain (base = lowest ground under the footprint).
   Nothing is built on the protected sites: skipped where something is already built (compound, temple/bank, pyramid park deck,
   pads, bridges), in the pond, on the rivers, or near the compound. 600 m tiles, merged to one mesh each (walls + roofs share one
   material), shown within 2.2 km (Quest 1 km; phones 300 m tiles within 0.4 km). Named houses-* so Real Earth shows them only inside its cutouts. */
(function () {
  const LITE = !!window.JFVR_LITE, QUEST = /OculusBrowser|Quest/i.test(navigator.userAgent) || /[?&]quest=1/.test(location.search);
  const VIS = LITE ? 400 : QUEST ? 1000 : 2200, TS = LITE ? 300 : 600, WATER = 16.5;
  const H = W3D.home3d = {tiles: [], tris: 0, n: 0, skipped: 0, occ: new Set()};
  function wallTex() {   // one 3.2 m x 3 m bay: lap siding + a trimmed window; top-left 16 px = plain (used by roofs)
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
    g.fillStyle = '#f2f0ea'; g.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 11) { g.fillStyle = 'rgba(0,0,0,0.07)'; g.fillRect(0, y, 256, 2); g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(0, y + 2, 256, 1); }
    g.fillStyle = '#f2f0ea'; g.fillRect(0, 0, 16, 16);
    g.fillStyle = '#fbfbf8'; g.fillRect(86, 70, 84, 104); g.fillStyle = '#2b3440'; g.fillRect(92, 76, 72, 92);
    const gr = g.createLinearGradient(92, 76, 164, 168); gr.addColorStop(0, 'rgba(150,175,200,0.55)'); gr.addColorStop(1, 'rgba(30,40,55,0)'); g.fillStyle = gr; g.fillRect(92, 76, 72, 92);
    g.fillStyle = '#fbfbf8'; g.fillRect(126, 76, 4, 92); g.fillRect(92, 120, 72, 4); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(84, 174, 88, 5);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
  }
  const WALL = [0xe9e5dc, 0xd9d2c2, 0xbfc3c0, 0xa9b7c2, 0xdccb92, 0xc9b49a, 0x9c6450, 0xe4dccb, 0x8f9a8a], ROOF = [0x47484d, 0x55504a, 0x3d4247, 0x5d4a40, 0x6a6560];
  function hash(i) { let h = Math.imul(i + 1, 2654435761); h ^= h >>> 15; return (h >>> 0) / 4294967296; }
  function build(D) {
    const tH = W3D.terrainH, GA = W3D.groundAt, HQ = (W3D.lib && W3D.lib.HQ) || {x: 920, z: -380}, wd = W3D.water || {};
    const riv = []; for (const R of wd.rivers || []) { const hw = (R.hw || 7) + 4; for (const [x, z] of R.pts) riv.push(x, z, hw); }
    const onRiver = (x, z) => { for (let k = 0; k < riv.length; k += 3) { const dx = riv[k] - x, dz = riv[k + 1] - z; if (dx * dx + dz * dz < riv[k + 2] * riv[k + 2]) return true; } return false; };
    const park = wd.park && wd.park.poly, inPark = park ? (x, z) => { let c = false; for (let i = 0, j = park.length - 1; i < park.length; j = i++) { const a = park[i], b = park[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; } : () => false;
    const tiles = new Map(), col = new THREE.Color();
    D.b.forEach((b, bi) => {
      let P = b.p; { let a0 = 0; for (let i = 0; i < P.length; i++) { const a = P[i], c2 = P[(i + 1) % P.length]; a0 += a[0] * c2[1] - c2[0] * a[1]; } if (a0 < 0) P = b.r ? [P[1], P[0], P[3], P[2]] : P.slice().reverse(); }   // one winding: walls face out
      let cx = 0, cz = 0, lo = 1e9, wet = false; for (const [x, z] of P) { cx += x; cz += z; const y = tH(x, z); lo = Math.min(lo, y); if (y < WATER + 0.15 && x > -1812 && x < 574 && z > -794 && z < 768) wet = true; } cx /= P.length; cz /= P.length;
      const tc = tH(cx, cz);
      if (wet || !isFinite(lo) || (W3D.keepOut || []).some(k => Math.hypot(cx - k.x, cz - k.z) < k.r) || Math.hypot(cx - HQ.x, cz - HQ.z) < 190 || (GA && GA(cx, cz, tc + 60) > tc + 1.0) || inPark(cx, cz) || onRiver(cx, cz)) { H.skipped++; return; }
      const key = Math.floor(cx / TS) + ',' + Math.floor(cz / TS); let T = tiles.get(key); if (!T) { T = {p: [], n: [], uv: [], c: [], cx: (Math.floor(cx / TS) + 0.5) * TS, cz: (Math.floor(cz / TS) + 0.5) * TS}; tiles.set(key, T); }
      const y0 = lo - 0.4, y1 = lo + b.h, wc = col.setHex(WALL[Math.floor(hash(bi) * (b.r ? WALL.length : 4))]).clone(), rc = new THREE.Color(b.r ? ROOF[Math.floor(hash(bi * 7) * ROOF.length)] : 0x8b8a86);
      const push = (x, y, z, nx, ny, nz, u, v, c) => { T.p.push(x, y, z); T.n.push(nx, ny, nz); T.uv.push(u, v); T.c.push(c.r, c.g, c.b); };
      const quad = (a, b2, c2, d, n, uvs, c) => { const q = [a, b2, c2, a, c2, d], U = [uvs[0], uvs[1], uvs[2], uvs[0], uvs[2], uvs[3]]; for (let i = 0; i < 6; i++) push(q[i][0], q[i][1], q[i][2], n[0], n[1], n[2], U[i][0], U[i][1], c); };
      const sg = 1;
      // walls (u: 3.2 m bays from a per-building offset so windows don't line up street-wide; v: 3 m storeys from the ground floor)
      let run = hash(bi * 3) * 3.2; const vb = (lo - y0) / 3;
      for (let i = 0; i < P.length; i++) { const a = P[i], c2 = P[(i + 1) % P.length], dx = c2[0] - a[0], dz = c2[1] - a[1], L = Math.hypot(dx, dz); if (L < 0.05) continue;
        const nx = -dz / L * sg, nz = dx / L * sg, u0 = run / 3.2, u1 = (run + L) / 3.2; run += L;
        quad([c2[0], y0, c2[1]], [a[0], y0, a[1]], [a[0], y1, a[1]], [c2[0], y1, c2[1]], [-nx, 0, -nz], [[u1, -vb], [u0, -vb], [u0, b.h / 3], [u1, b.h / 3]], wc); }
      const RU = [0.02, 0.98];   // roofs: the plain corner of the wall texture, coloured per vertex
      if (b.r) { // gable: p0-p1 long side; ridge from mid(p3,p0) to mid(p1,p2)
        const [p0, p1, p2, p3] = P, m0 = [(p3[0] + p0[0]) / 2, (p3[1] + p0[1]) / 2], m1 = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2], yr = y1 + b.r;
        const gab = (pa, pb, m) => { const dx = pb[0] - pa[0], dz = pb[1] - pa[1], L = Math.hypot(dx, dz) || 1, nx = -dz / L * sg, nz = dx / L * sg; const n = [-nx, 0, -nz];
          for (const q of [[pb[0], y1, pb[1], L / 3.2], [pa[0], y1, pa[1], 0], [m[0], yr, m[1], L / 6.4]]) push(q[0], q[1], q[2], n[0], n[1], n[2], q[3], b.h / 3 + (q[1] - y1) / 3, wc); };
        gab(p1, p2, m1); gab(p3, p0, m0);
        const plane = (a, c2, r1, r0) => { const A = [a[0], y1, a[1]], B = [c2[0], y1, c2[1]], R1 = [r1[0], yr, r1[1]], R0 = [r0[0], yr, r0[1]];
          const u = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], v = [R0[0] - A[0], R0[1] - A[1], R0[2] - A[2]]; let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]; const l = Math.hypot(...n) || 1; n = n.map(k => k / l); if (n[1] < 0) n = n.map(k => -k);
          const s = 0.9 + hash(bi * 11) * 0.2, cc = rc.clone().multiplyScalar(s); quad(A, B, R1, R0, n, [RU, RU, RU, RU], cc); quad(A, R0, R1, B, n, [RU, RU, RU, RU], cc); };   // both windings: always visible from above
        plane(p0, p1, m1, m0); plane(p2, p3, m0, m1);
      } else { // flat roof (with a slight parapet look from the darker colour)
        const tri = THREE.ShapeUtils.triangulateShape(P.map(q => new THREE.Vector2(q[0], q[1])), []);
        for (const t of tri) for (const k of t) push(P[k][0], y1, P[k][1], 0, 1, 0, RU[0], RU[1], rc);
        for (const t of tri) for (const k of [t[0], t[2], t[1]]) push(P[k][0], y1, P[k][1], 0, 1, 0, RU[0], RU[1], rc); }
      { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of P) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }   // occupancy (4 m cells + 3 m) so planting layers keep clear
        for (let gx = Math.floor((x0 - 3) / 4); gx <= Math.floor((x1 + 3) / 4); gx++) for (let gz = Math.floor((z0 - 3) / 4); gz <= Math.floor((z1 + 3) / 4); gz++) H.occ.add(gx + ',' + gz); }
      H.n++;
    });
    const mat = new THREE.MeshLambertMaterial({map: wallTex(), vertexColors: true}); mat.name = 'houses';
    if (W3D.seasonKit) W3D.seasonKit.snowTop(mat, {up0: 0.25, up1: 0.5, k: 0.95});   // snow on roofs
    for (const [k, T] of tiles) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(T.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(T.n, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(T.uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(T.c, 3)); g.computeBoundingSphere();
      const m = new THREE.Mesh(g, mat); m.name = 'houses-' + k; m.castShadow = !LITE && !QUEST; m.receiveShadow = !LITE; m.userData.c = [T.cx, T.cz]; m.visible = false; W3D.root.add(m); H.tiles.push(m); H.tris += T.p.length / 9; }
    if (W3D.realEarth && W3D.realEarth.clipOurs) W3D.realEarth.clipOurs(mat);
    H.mat = mat; H.ready = true;
  }
  const v = new THREE.Vector3(); let last = 0, started = false;
  AFRAME.registerComponent('w3d-home3d', { tick: function (t) {
    if (!window.W3D_READY || !W3D.root || !W3D.terrainH || t - last < 700) return; last = t;
    if (!started) { started = true; fetch('/vr/w3d/home_b.json?v=1').then(r => r.json()).then(build).catch(e => console.warn('home3d', e)); }
    if (!H.ready) return; const cam = this.el.camera; if (!cam) return; cam.getWorldPosition(v); let vt = 0, vtri = 0;
    for (const m of H.tiles) { const on = W3D.root.visible && Math.hypot(m.userData.c[0] - v.x, m.userData.c[1] - v.z) < VIS + TS * 0.71; m.visible = on; if (on) { vt++; vtri += m.geometry.attributes.position.count / 3; } }
    H.visTiles = vt; H.visTris = vtri;
  } });
  const attach = () => { const sc = document.querySelector('a-scene'); if (sc) sc.setAttribute('w3d-home3d', ''); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attach); else attach();
})();
