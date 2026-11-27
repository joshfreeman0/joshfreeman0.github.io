/* Cover-up rebuild (item 4): the old sand pits and dumps by the pond - the quarry/dump east of King Philip St, the graded dump slope
   down to the east shore (c3fcd7b), the sand-pit hill and the planted square north of it - now read as natural Southeastern
   Massachusetts pine barrens instead of a pasted-on forest photo:
   - soil: sandy-loam patches and pine-needle duff blended into the ground under the trees (terrain shader, these zones only)
   - native plants (instanced): pitch pine (tall, open, clumped crowns), scrub oak thickets (multi-stem, russet November leaves),
     little bluestem bunches (copper in autumn) on the open slope and clearings
   - drainage: two shallow vegetated swales across the graded dump slope with stone check dams, rushes along them
   Lite: fewer plants, no swale rushes. ?classic=1: off. Nothing on roads, water, rivers or anything built. */
(function () {
  if (/[?&]classic=1/.test(location.search)) return;
  const LITE = !!window.JFVR_LITE, QUEST = /OculusBrowser|Quest/i.test(navigator.userAgent) || /[?&]quest=1/.test(location.search), K = LITE ? 0.35 : QUEST ? 0.6 : 1;
  const Q2 = [[440, -345], [600, -318], [700, -268], [795, -225], [840, -140], [830, -30], [770, 40], [710, 115], [660, 200], [600, 222], [520, 205], [470, 195], [436, 40], [426, -200]];
  const DZ = [[400, -215], [572, -215], [597, -90], [602, 40], [585, 170], [560, 228], [400, 228]];   // c3fcd7b's graded dump slope (road edge -> waterline)
  const Q1 = [[922, -690], [945, -720], [985, -762], [1050, -778], [1112, -742], [1132, -680], [1117, -620], [1060, -598], [990, -606], [950, -630], [925, -640]];
  const SQ = [[530, 232], [655, 232], [655, 332], [530, 332]];
  const ZONES = [{p: Q2, k: 'forest'}, {p: SQ, k: 'forest'}, {p: DZ, k: 'slope'}, {p: Q1, k: 'meadow'}];
  const BX = [380, -800, 1160, 360];   // mask box x0,z0,x1,z1 (2 m px)
  const SWALES = [[[510, -200], [504, -120], [512, -40], [506, 40], [514, 120], [508, 205]], [[552, -205], [560, -130], [556, -50], [564, 30], [556, 110], [548, 200]]];
  const inPoly = (x, z, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
  const zoneAt = (x, z) => { for (const Z of ZONES) if (inPoly(x, z, Z.p)) return Z.k; return null; };
  let rnd = 20261123; const r = () => (rnd = (rnd * 1664525 + 1013904223) >>> 0) / 4294967296;
  const C = W3D.coverup = {done: false};
  function maskTex() {
    const W = (BX[2] - BX[0]) / 2, Hh = (BX[3] - BX[1]) / 2, c = document.createElement('canvas'); c.width = W; c.height = Hh; const g = c.getContext('2d');
    g.filter = 'blur(6px)'; g.fillStyle = '#000'; g.fillRect(0, 0, W, Hh);
    for (const Z of ZONES) { g.fillStyle = Z.k === 'meadow' ? '#ff0000' : Z.k === 'slope' ? '#ff00ff' : '#ffff00'; g.beginPath(); Z.p.forEach(([x, z], i) => { const u = (x - BX[0]) / 2, v = (z - BX[1]) / 2; i ? g.lineTo(u, v) : g.moveTo(u, v); }); g.closePath(); g.fill(); }
    const t = new THREE.CanvasTexture(c); t.flipY = false; t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; return t;
  }
  function soil() {   // R: zone, G: forest floor (duff), B: open slope
    const tm = W3D._terrainMat; if (!tm) return; const mt = maskTex(), ob = tm.onBeforeCompile;
    tm.onBeforeCompile = function (sh, rr) { if (ob) ob.call(this, sh, rr); sh.uniforms.cvMask = {value: mt}; sh.uniforms.cvBox = {value: new THREE.Vector4(BX[0], BX[1], BX[2] - BX[0], BX[3] - BX[1])};
      sh.fragmentShader = 'uniform sampler2D cvMask; uniform vec4 cvBox;\n' + sh.fragmentShader.replace('diffuseColor *= texelColor;', [
        '{ vec2 cu = (vWp.xz - cvBox.xy) / cvBox.zw; if (cu.x > 0.0 && cu.x < 1.0 && cu.y > 0.0 && cu.y < 1.0) { vec4 cm = texture2D(cvMask, cu);',
        '  float n1 = texture2D(detMap, vWp.xz / 23.0).g, n2 = texture2D(detMap, vWp.xz / 3.1).r;',
        '  vec3 duff = vec3(0.105, 0.072, 0.040) * (0.8 + 0.5 * n2), sand = vec3(0.30, 0.22, 0.13) * (0.85 + 0.3 * n2), blue = vec3(0.26, 0.13, 0.05) * (0.8 + 0.4 * n2);',
        '  texelColor.rgb = mix(texelColor.rgb, duff, cm.g * (1.0 - cm.b) * 0.35 * smoothstep(0.35, 0.7, n1));',      // needle litter under the pines
        '  texelColor.rgb = mix(texelColor.rgb, sand, cm.r * 0.5 * smoothstep(0.62, 0.8, n1));',                         // bare sandy-loam patches
        '  texelColor.rgb = mix(texelColor.rgb, blue, cm.b * 0.3 * smoothstep(0.4, 0.75, n1));',                         // copper bluestem swards on the open slope
        '  texelColor.rgb *= mix(vec3(1.0), vec3(1.04, 0.98, 0.9), cm.r); } }',
        'diffuseColor *= texelColor;'].join('\n')); };
    tm.needsUpdate = true;
  }
  function inst(geo, mat, list, name, shadow) {
    const im = new THREE.InstancedMesh(geo, mat, list.length), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), col = new THREE.Color();
    list.forEach((t, i) => { e.set((r() - 0.5) * t.tilt, r() * 6.283, (r() - 0.5) * t.tilt); q.setFromEuler(e); m4.compose(new THREE.Vector3(t.x, t.y, t.z), q, new THREE.Vector3(t.s * (t.sx || 1), t.s * (t.sy || 1), t.s * (t.sx || 1))); im.setMatrixAt(i, m4);
      if (t.c) { col.setHex(t.c).offsetHSL((r() - 0.5) * 0.03, (r() - 0.5) * 0.1, (r() - 0.5) * 0.08); im.setColorAt(i, col); } });
    im.name = name; im.castShadow = !!shadow && !LITE; im.receiveShadow = !LITE; im.frustumCulled = false; W3D.root.add(im); return im;
  }
  function lobes(n, rad, h, seed) {   // clumped crown: n squashed icosahedra around a top
    const gs = []; for (let i = 0; i < n; i++) { const a = i / n * 6.283 + seed, g = new THREE.IcosahedronGeometry(rad * (0.7 + 0.3 * ((i * 37) % 5) / 4), 0); g.scale(1, 0.85, 1); g.translate(Math.cos(a) * rad * 0.9, h - (i % 2) * rad * 1.3 + ((i * 53) % 7) / 7 * rad * 0.8, Math.sin(a) * rad * 0.9); gs.push(g); }
    const top = new THREE.IcosahedronGeometry(rad * 0.85, 0); top.scale(1, 0.7, 1); top.translate(0, h + rad * 0.9, 0); gs.push(top); return merge(gs);
  }
  function merge(gs) { const pos = [], nor = []; for (const g0 of gs) { const g = g0.index ? g0.toNonIndexed() : g0; g.computeVertexNormals(); pos.push(...g.attributes.position.array); nor.push(...g.attributes.normal.array); }
    const o = new THREE.BufferGeometry(); o.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); o.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); return o; }
  function build(roadsOk) {
    const tH = W3D.terrainH, GA = W3D.groundAt, WATER = 16.5, riv = [];
    for (const R of (W3D.water && W3D.water.rivers) || []) for (const [x, z] of R.pts) riv.push(x, z, (R.hw || 7) + 3);
    const occ = (W3D.home3d && W3D.home3d.occ) || new Set();
    const free = (x, z, clear) => { if ((W3D.keepOut || []).some(k => Math.hypot(x - k.x, z - k.z) < k.r)) return null; const y = tH(x, z); if (!(y > WATER + clear)) return null; if (occ.has(Math.floor(x / 4) + ',' + Math.floor(z / 4))) return null; if (GA && GA(x, z, y + 40) > y + 0.6) return null; if (roadsOk(x, z)) return null;
      for (let k = 0; k < riv.length; k += 3) { const dx = riv[k] - x, dz = riv[k + 1] - z; if (dx * dx + dz * dz < riv[k + 2] * riv[k + 2]) return null; } return y; };
    const pines = [], oaks = [], blue = [], rush = [], stones = [];
    const scat = (step, f) => { for (let x = BX[0]; x < BX[2]; x += step) for (let z = BX[1]; z < BX[3]; z += step) { const px = x + r() * step, pz = z + r() * step, k = zoneAt(px, pz); if (k) f(px, pz, k); } };
    scat(7 / Math.sqrt(K), (x, z, k) => { const p = r();
      if (k === 'forest' && p < 0.42) { const y = free(x, z, 0.6); if (y !== null) pines.push({x, y: y - 0.3, z, s: 0.8 + r() * 0.5, sy: 0.9 + r() * 0.3, tilt: 0.08}); }
      else if (k === 'slope' && p < 0.04) { const y = free(x, z, 1.2); if (y !== null && y > WATER + 3.0) pines.push({x, y: y - 0.3, z, s: 0.6 + r() * 0.4, tilt: 0.1}); }
      else if (k === 'meadow' && p < 0.06) { const y = free(x, z, 0.6); if (y !== null) pines.push({x, y: y - 0.3, z, s: 0.7 + r() * 0.4, tilt: 0.1}); } });
    scat(5 / Math.sqrt(K), (x, z, k) => { const p = r(), y = free(x, z, 0.4); if (y === null) return;
      if ((k === 'forest' && p < 0.3) || (k !== 'forest' && p < 0.07)) oaks.push({x, y: y - 0.1, z, s: 0.6 + r() * 0.6, sy: 0.7 + r() * 0.4, tilt: 0.1, c: [0x6e5236, 0x5f5634, 0x74583a, 0x55553a, 0x664a30][Math.floor(r() * 5)]}); });
    scat(2.2 / Math.sqrt(K), (x, z, k) => { const p = r(); if (k === 'forest' && p > 0.12) return; if (k !== 'forest' && p > 0.75) return; const y = free(x, z, 0.3); if (y === null) return;
      blue.push({x, y: y - 0.05, z, s: 0.7 + r() * 0.6, tilt: 0.2, c: [0xa8774a, 0x9a6e48, 0xb08658, 0x8a7a52][Math.floor(r() * 4)]}); });
    for (const S of SWALES) for (let i = 0; i < S.length - 1; i++) { const [ax, az] = S[i], [bx, bz] = S[i + 1], L = Math.hypot(bx - ax, bz - az);
      for (let d = 0; d < L; d += LITE ? 3 : 1.4) { const t = d / L, x = ax + (bx - ax) * t, z = az + (bz - az) * t; for (const sd of [-1.9, 1.9]) { const px = x + sd + (r() - 0.5), pz = z + (r() - 0.5) * 1.4, y = free(px, pz, 0.2); if (y !== null && !LITE) rush.push({x: px, y: y - 0.05, z: pz, s: 0.8 + r() * 0.5, tilt: 0.25, c: [0x5f6e34, 0x6e7a3a, 0x7d7440][Math.floor(r() * 3)]}); } }
      if (i % 2 === 1) for (let k = -2; k <= 2; k++) { const y = free(ax + k * 0.8, az, 0.1); if (y !== null) stones.push({x: ax + k * 0.8, y: y + 0.05, z: az + (r() - 0.5) * 0.4, s: 0.35 + r() * 0.25, sy: 0.6, tilt: 0.6, c: 0x8d8677}); } }
    // pitch pine: tall bare lower trunk, clumped open crown; scrub oak: 3 stems + rounded thicket; bluestem: narrow bunch of cards
    const pineTrunk = new THREE.CylinderGeometry(0.16, 0.3, 11, 5, 1, true); pineTrunk.translate(0, 5.5, 0);
    const pineCrown = lobes(LITE ? 3 : 5, 1.7, 8.5, 0.4);
    const oakG = merge([0, 1, 2, 3].map(i => { const g = new THREE.IcosahedronGeometry(i === 3 ? 0.9 : 1.0, 0); g.scale(1.15, 0.75, 1.15); g.translate(i === 3 ? 0 : Math.cos(i * 2.1) * 0.75, i === 3 ? 1.6 : 0.85 + i * 0.12, i === 3 ? 0 : Math.sin(i * 2.1) * 0.75); return g; }));   // ground-hugging thicket
    const bl = merge([0, 1, 2].map(i => { const g = new THREE.PlaneGeometry(0.35, 0.75, 1, 1); g.translate(0, 0.37, 0); g.rotateY(i * 1.047); return g; }));
    const bark = new THREE.MeshLambertMaterial({color: 0x4d3f33}), ndl = new THREE.MeshLambertMaterial({color: 0x3f5a2a, flatShading: true}), leaf = new THREE.MeshLambertMaterial({color: 0xffffff, flatShading: true});
    const SK = W3D.seasonKit; if (SK) { SK.snowTop(ndl, {up0: 0.12, up1: 0.4, k: 0.8, dark: 0.18}); SK.decid(leaf, {pivot: 0.9, keep: true}); SK.snowTop(bark, {up0: 0.4, up1: 0.8, k: 0.7}); }   // seasons.js
    const bt = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); for (let i = 0; i < 16; i++) { const x = 6 + Math.random() * 52, h = 34 + Math.random() * 30, l = (Math.random() - 0.5) * 14; g.strokeStyle = 'rgba(' + (200 + Math.random() * 40 | 0) + ',' + (190 + Math.random() * 40 | 0) + ',' + (170 + Math.random() * 30 | 0) + ',1)'; g.lineWidth = 1.6 + Math.random(); g.beginPath(); g.moveTo(x, 64); g.quadraticCurveTo(x + l * 0.3, 64 - h * 0.6, x + l, 64 - h); g.stroke(); }
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();   // thin wiry stems
    const grassM = new THREE.MeshLambertMaterial({color: 0xffffff, side: THREE.DoubleSide, map: bt, alphaTest: 0.4});
    grassM.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>\nnormal = normalize( vNormal );'); };   // both faces lit like the ground
    if (SK) SK.grass(grassM, {blue: true});
    bl.setAttribute('normal', new THREE.Float32BufferAttribute(new Array(bl.attributes.position.count).fill(0).flatMap(() => [0, 1, 0]), 3));
    const stoneG = new THREE.DodecahedronGeometry(0.6, 0), stoneM = new THREE.MeshLambertMaterial({color: 0xffffff, flatShading: true});
    inst(pineTrunk, bark, pines, 'trees-pitchpine-trunk', true); inst(pineCrown, ndl, pines, 'trees-pitchpine', true); inst(oakG, leaf, oaks, 'trees-scruboak', true);
    inst(bl, grassM, blue, 'trees-bluestem'); if (rush.length) inst(bl, grassM, rush, 'trees-swale-rush'); inst(stoneG, stoneM, stones, 'trees-checkdam');
    // the swale beds: damp, darker ribbons 3 m wide laid on the ground
    const pos = []; for (const S of SWALES) for (let i = 0; i < S.length - 1; i++) { const [ax, az] = S[i], [bx, bz] = S[i + 1], L = Math.hypot(bx - ax, bz - az), nx = -(bz - az) / L * 1.5, nz = (bx - ax) / L * 1.5;
      for (let d = 0; d < L; d += 4) { const t0 = d / L, t1 = Math.min(1, (d + 4) / L), P = t => [ax + (bx - ax) * t, az + (bz - az) * t], [x0, z0] = P(t0), [x1, z1] = P(t1), h = (x, z) => tH(x, z) + 0.1;
        const a = [x0 - nx, h(x0 - nx, z0 - nz), z0 - nz], b = [x0 + nx, h(x0 + nx, z0 + nz), z0 + nz], c = [x1 + nx, h(x1 + nx, z1 + nz), z1 + nz], e = [x1 - nx, h(x1 - nx, z1 - nz), z1 - nz];
        pos.push(...a, ...e, ...c, ...a, ...c, ...b); } }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); sg.computeVertexNormals();
    const sw = new THREE.Mesh(sg, new THREE.MeshLambertMaterial({color: 0x3c4a26, side: THREE.DoubleSide})); sw.name = 'road-ribbons-swales'; sw.receiveShadow = !LITE; W3D.root.add(sw);
    Object.assign(C, {done: true, pines: pines.length, oaks: oaks.length, bluestem: blue.length, rush: rush.length, stones: stones.length});
  }
  function roadTest(S, geo) {   // coarse 8 m hash of the OSM road centrelines near the zones
    const map = new Map(), RC = 8; const add = (x, z, hw) => { const k = Math.floor(x / RC) + ',' + Math.floor(z / RC); if (!map.has(k)) map.set(k, []); map.get(k).push(x, z, hw); };
    for (const rd of S.roads || []) { const hw = Math.max(4, (rd[1] > 100 ? rd[1] / 100 : rd[1] || 6) / 2 + 2), c = rd[2] || []; let px = null, pz = null;
      for (let i = 0; i + 1 < c.length; i += 2) { const x = (c[i + 1] / 1e5 - geo.lon0) * geo.kx, z = (geo.lat0 - c[i] / 1e5) * geo.ky;
        if (px !== null) { const L = Math.hypot(x - px, z - pz); for (let d = 0; d <= L; d += 3) add(px + (x - px) * d / L, pz + (z - pz) * d / L, Math.min(hw, 9)); } px = x; pz = z; } }
    return (x, z) => { const cx = Math.floor(x / RC), cz = Math.floor(z / RC); for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const L = map.get((cx + i) + ',' + (cz + j)); if (L) for (let k = 0; k < L.length; k += 3) { const dx = L[k] - x, dz = L[k + 1] - z; if (dx * dx + dz * dz < L[k + 2] * L[k + 2]) return true; } } return false; };
  }
  let started = false;
  AFRAME.registerComponent('w3d-coverup', { tick: function () {
    if (started || !window.W3D_READY || !W3D.root || !W3D.terrainH || !W3D._terrainMat) return;
    if (!(W3D.home3d && W3D.home3d.ready) && (this._w = (this._w || 0) + 1) < 1200) return;   // houses first, so plants keep clear of them
    started = true;
    soil();
    Promise.all([fetch('/vr/w3d/streets.json?v=9').then(r => r.json()), fetch('/vr/w3d/geo.json?v=1').then(r => r.json())]).then(([S, G]) => build(roadTest(S, G))).catch(e => { console.warn('coverup', e); build(() => false); });
  } });
  const attach = () => { const sc = document.querySelector('a-scene'); if (sc) sc.setAttribute('w3d-coverup', ''); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attach); else attach();
})();
