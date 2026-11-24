/* Seasons for the Fowling Pond world, keyed to the real date for southeastern Massachusetts (Raynham / Taunton). ?season=YYYY-MM-DD previews any day
   (noon). Exposes W3D.season = {date, doy, leaf, fall, spring, dorm, melt, snow, ice, preview} and fires window 'season' events (detail = W3D.season)
   when the values change, so other code (boats) can react. Shaders read the shared uniforms in W3D.seasonKit.U, so nothing is rebuilt:
     deciduous trees: bare ~Nov 5 - Apr 20, leaf-out pale yellow-green Apr 20 - May 20, green to Sep 20, colour Sep 20 - Oct 25, drop Oct 15 - Nov 5
     grass: dormant tan Nov 10 - Apr 1, green-up to May 1, green, straw Sep 15 - Nov 10
     snow: dusting Dec 1, full Dec 15 - Feb 25, melting (mud) to Mar 15; pond ice forms Dec 15-25, solid to Mar 1, gone ~Mar 12. */
(function () {
  const W3D = window.W3D = window.W3D || {};
  const CUM = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  function pw(x, k) { if (x <= k[0][0]) return k[0][1]; for (let i = 1; i < k.length; i++) if (x <= k[i][0]) return k[i - 1][1] + (k[i][1] - k[i - 1][1]) * sm(k[i - 1][0], k[i][0], x); return k[k.length - 1][1]; }
  const U = {uLeaf: {value: 0}, uFall: {value: 0}, uSpring: {value: 0}, uDorm: {value: 1}, uMelt: {value: 0}, uSnow: {value: 0}, uIce: {value: 0}};
  const m = /[?&]season=(\d{4})-(\d{1,2})-(\d{1,2})/.exec(location.search);
  let override = m ? new Date(+m[1], +m[2] - 1, +m[3], 12) : null, lastKey = '';
  function compute(d) {
    const doy = CUM[d.getMonth()] + d.getDate() + (d.getHours() + d.getMinutes() / 60) / 24 - 0.5, u = doy >= 300 ? doy - 365 : doy;
    return {doy,
      leaf: pw(doy, [[110, 0], [140, 1], [288, 1], [309, 0]]),
      fall: pw(doy, [[263, 0], [298, 1], [309, 1], [330, 0]]),
      spring: pw(doy, [[108, 0], [112, 1], [132, 0.9], [155, 0]]),
      dorm: pw(doy, [[91, 1], [121, 0], [258, 0], [314, 1]]),
      melt: pw(u, [[45, 0], [62, 0.7], [78, 1], [95, 0]]),
      snow: pw(u, [[-30, 0], [-23, 0.3], [-16, 1], [56, 1], [74, 0]]),
      ice: pw(u, [[-16, 0], [-6, 1], [60, 1], [71, 0]])};
  }
  function update() {
    const d = override || new Date(), c = compute(d), S = W3D.season || (W3D.season = {});
    const p2 = n => ('0' + n).slice(-2); S.date = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); S.preview = !!override;
    for (const k in c) S[k] = +c[k].toFixed(4);
    U.uLeaf.value = S.leaf; U.uFall.value = S.fall; U.uSpring.value = S.spring; U.uDorm.value = S.dorm; U.uMelt.value = S.melt; U.uSnow.value = S.snow; U.uIce.value = S.ice;
    const key = [S.date, S.leaf, S.snow, S.ice].join();
    if (key !== lastKey) { lastKey = key; try { window.dispatchEvent(new CustomEvent('season', {detail: S})); } catch (e) {} }
  }
  W3D.setSeason = function (s) { const q = s && /(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s); override = q ? new Date(+q[1], +q[2] - 1, +q[3], 12) : null; update(); };
  update(); setInterval(update, 60000);

  /* ---------- shader patches (all read the shared uniforms; no per-frame work) ---------- */
  const HASH = 'float jsH(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }\nfloat jsH3(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }\n';
  function chain(mat, key, fn) { const ob = mat.onBeforeCompile; mat.onBeforeCompile = function (sh, r) { if (ob) ob.call(this, sh, r); for (const k in U) sh.uniforms[k] = U[k]; fn(sh); }; const oc = mat.customProgramCacheKey; mat.customProgramCacheKey = () => (oc ? oc.call(mat) : '') + key; mat.needsUpdate = true; return mat; }
  const VP = 'varying vec3 jsW;\n', VPI = '\n#ifdef USE_INSTANCING\n jsW = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;\n#else\n jsW = (modelMatrix * vec4(transformed, 1.0)).xyz;\n#endif\n';
  /* snow on upward-facing surfaces (roofs, conifer boughs, bare branches), patchy while it melts; evergreens go a little darker in winter */
  function snowTop(mat, o) {
    o = o || {}; const u0 = o.up0 != null ? o.up0 : 0.3, u1 = o.up1 != null ? o.up1 : 0.6, k = o.k != null ? o.k : 0.9, dark = o.dark || 0;
    return chain(mat, 'jsSnow' + [u0, u1, k, dark].join('_'), sh => {
      sh.vertexShader = VP + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>' + VPI);
      sh.fragmentShader = 'uniform float uSnow; uniform float uDorm; uniform float uMelt;\n' + VP + HASH + sh.fragmentShader.replace('#include <color_fragment>', [
        '#include <color_fragment>', '{',
        '  vec3 fdx = dFdx(vViewPosition), fdy = dFdy(vViewPosition); vec3 fn = normalize(cross(fdx, fdy));',
        '  float up = dot(fn, (viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz); up = max(up, 0.0);',
        '  float hh = jsH(floor(jsW.xz * 1.3 + jsW.y * 0.7)); float sv = uSnow * 1.45;',
        '  float cov = smoothstep(hh - 0.12, hh + 0.12, sv) * smoothstep(' + u0.toFixed(2) + ', ' + u1.toFixed(2) + ', up);',
        (dark ? '  diffuseColor.rgb *= 1.0 - ' + dark.toFixed(2) + ' * uDorm;' : ''),
        '  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.8, 0.84, 0.92) * (0.93 + 0.07 * hh), cov * ' + k.toFixed(2) + ');', '}'].join('\n'));
    });
  }
  /* deciduous crown: leaf scale/density by per-tree timing, colour by per-tree seed (position hash). o.pivot = crown centre height; o.keep = twig
     thicket that never fully vanishes (scrub oak). */
  function decid(mat, o) {
    o = o || {}; const pv = (o.pivot || 6.5).toFixed(2), keep = !!o.keep;
    return chain(mat, 'jsDec' + pv + keep, sh => {
      sh.vertexShader = 'uniform float uLeaf; varying float jsS; varying float jsT; varying vec3 jsL;\n' + sh.vertexShader.replace('#include <begin_vertex>', ['#include <begin_vertex>',
        'vec3 jsip = instanceMatrix[3].xyz; jsS = fract(sin(dot(jsip.xz, vec2(12.9898, 78.233))) * 43758.5453);',
        'jsT = clamp(uLeaf * 1.5 - jsS * 0.5, 0.0, 1.0); jsL = position;',
        keep ? '' : 'transformed = vec3(0.0, ' + pv + ', 0.0) + (transformed - vec3(0.0, ' + pv + ', 0.0)) * smoothstep(0.0, 0.7, jsT);'].join('\n'));
      sh.fragmentShader = 'uniform float uFall; uniform float uSpring; varying float jsS; varying float jsT; varying vec3 jsL;\n' + HASH + sh.fragmentShader.replace('#include <color_fragment>', [
        '#include <color_fragment>', '{',
        '  float nh = jsH3(floor(jsL * 1.7 + jsS * 40.0)); float thr = ' + (keep ? '0.3 + 0.7 * jsT' : 'jsT / 0.75') + '; if (nh > thr) discard;',
        '  float ft = clamp(uFall * 1.6 - jsS * 0.6, 0.0, 1.0);',
        '  vec3 fc = jsS < 0.3 ? vec3(0.50, 0.035, 0.02) : jsS < 0.55 ? vec3(0.62, 0.17, 0.02) : jsS < 0.8 ? vec3(0.60, 0.40, 0.03) : vec3(0.20, 0.085, 0.035);',   // maples red/orange/yellow, oaks russet
        '  diffuseColor.rgb = mix(diffuseColor.rgb, fc * (0.8 + 0.4 * fract(jsS * 7.0)), ft);',
        '  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.30, 0.40, 0.05) * (0.85 + 0.3 * jsS), uSpring * (1.0 - ft));',
        keep ? '  diffuseColor.rgb = mix(vec3(0.05, 0.035, 0.025) * (0.8 + 0.5 * jsS), diffuseColor.rgb, jsT);' : '', '}'].join('\n'));
    });
  }
  /* bark + bare branches: one merged geometry per tree (trunk + limbs + twigs), so bare trees read as trees with no extra draw call */
  function treeGeo(trunk, detail) { // detail 0 lite, 1 quest, 2 desktop
    const pos = [], put = (a, b, c) => pos.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    const tp = trunk.index ? trunk.toNonIndexed() : trunk; pos.push(...tp.attributes.position.array);
    function cone(p, dx, dy, dz, len, r) { const l = Math.hypot(dx, dy, dz); dx /= l; dy /= l; dz /= l; let ax = [0, 1, 0]; if (Math.abs(dy) > 0.9) ax = [1, 0, 0];
      const ux = [dy * ax[2] - dz * ax[1], dz * ax[0] - dx * ax[2], dx * ax[1] - dy * ax[0]], ul = Math.hypot(...ux); ux[0] /= ul; ux[1] /= ul; ux[2] /= ul;
      const vx = [dy * ux[2] - dz * ux[1], dz * ux[0] - dx * ux[2], dx * ux[1] - dy * ux[0]], tip = [p[0] + dx * len, p[1] + dy * len, p[2] + dz * len], ring = [];
      for (let i = 0; i < 3; i++) { const a = i * 2.094; ring.push([p[0] + (ux[0] * Math.cos(a) + vx[0] * Math.sin(a)) * r, p[1] + (ux[1] * Math.cos(a) + vx[1] * Math.sin(a)) * r, p[2] + (ux[2] * Math.cos(a) + vx[2] * Math.sin(a)) * r]); }
      put(ring[0], ring[1], tip); put(ring[1], ring[2], tip); put(ring[2], ring[0], tip); return tip; }
    const NL = [4, 5, 7][detail], TW = [1, 1, 2][detail];
    cone([0, 3.6, 0], 0.08, 1, 0.05, 5.6, 0.2);   // leader
    for (let i = 0; i < NL; i++) { const a = i / NL * 6.283 + 0.4, el = 0.9 + (i % 2) * 0.35, hs = 3.0 + (i % 3) * 0.5, c = Math.cos(a), s = Math.sin(a);
      const st = [c * 0.1, hs, s * 0.1], e = cone(st, c, el, s, 3.0 + (i % 2) * 0.8, 0.13);
      const mid = [(st[0] + e[0]) / 2, (st[1] + e[1]) / 2, (st[2] + e[2]) / 2];
      for (let t = 0; t < TW; t++) { const b = a + (t ? -0.7 : 0.7); cone(t ? e : mid, Math.cos(b), 1.1, Math.sin(b), 1.9, 0.07); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); return g;
  }
  const barkCache = {};
  function bark() { if (!barkCache.m) barkCache.m = snowTop(new THREE.MeshLambertMaterial({color: 0x5b4a3a, side: THREE.DoubleSide}), {up0: 0.35, up1: 0.7, k: 0.85}); return barkCache.m; }
  /* grass tufts + bluestem: dormant tan / copper, whiten and shrink under snow */
  function grass(mat, o) {
    o = o || {};
    return chain(mat, 'jsGrass' + (o.blue ? 'B' : 'T'), sh => {
      sh.vertexShader = 'uniform float uSnow;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed *= ' + (o.blue ? 'mix(1.0, 0.45, smoothstep(0.1, 0.9, uSnow))' : '1.0 - smoothstep(0.45, 0.95, uSnow * 1.1)') + ';');
      sh.fragmentShader = 'uniform float uSnow; uniform float uDorm; uniform float uMelt;\n' + sh.fragmentShader.replace('#include <color_fragment>', ['#include <color_fragment>', '{ vec3 c = diffuseColor.rgb; float l = dot(c, vec3(0.3, 0.59, 0.11));',
        o.blue ? '  c = mix(vec3(0.30, 0.38, 0.11) * (0.5 + l * 2.2), c, uDorm);' : '  c = mix(c, vec3(l) * vec3(1.45, 1.12, 0.72) + 0.006, uDorm);',
        '  c = mix(c, c * vec3(0.7, 0.62, 0.5), uMelt * 0.6);',
        '  c = mix(c, vec3(0.8, 0.84, 0.92), smoothstep(0.1, 0.6, uSnow) * ' + (o.blue ? '0.45' : '0.8') + '); diffuseColor.rgb = c; }'].join('\n'));
    });
  }
  /* terrain: winter / dormant / mud / snow blend, favouring flat ground (called with the terrain material's onBeforeCompile shader) */
  function terrain(sh) {
    for (const k in U) sh.uniforms[k] = U[k];
    sh.fragmentShader = 'uniform float uLeaf; uniform float uFall; uniform float uDorm; uniform float uMelt; uniform float uSnow;\n' + sh.fragmentShader.replace('#include <color_fragment>', ['#include <color_fragment>', '{',
      '  vec3 c = diffuseColor.rgb; float lum = dot(c, vec3(0.3, 0.59, 0.11));',
      '  float vegm = clamp(smoothstep(0.0, 0.04, c.g - c.b) * smoothstep(-0.03, 0.01, c.g - c.r) * 1.6, 0.0, 1.0);',
      '  float cano = (1.0 - smoothstep(0.04, 0.11, c.g)) * vegm;',
      '  c = mix(c, vec3(0.30, 0.12, 0.03) * (0.6 + lum * 4.0), uFall * (1.0 - uDorm) * cano * 0.55 * smoothstep(0.0, 0.3, 1.0 - uDorm));',
      '  c = mix(c, vec3(lum) * vec3(1.5, 1.16, 0.76) + 0.012, uDorm * vegm);',
      '  c = mix(c, vec3(0.085, 0.06, 0.04) * (0.7 + lum * 3.0), uMelt * vegm * 0.6);',
      '  vec3 sn = normalize(vNormal); float up = dot(sn, (viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);',
      '  float nz = texture2D(detMap, vWp.xz / 11.0).g * 0.6 + texture2D(detMap, vWp.xz / 3.1).r * 0.4;',
      '  float sv = uSnow * 1.45; float cov = smoothstep(nz - 0.12, nz + 0.12, sv) * smoothstep(0.5, 0.85, up) * smoothstep(16.4, 17.1, vWp.y);',
      '  c = mix(c, vec3(0.84, 0.88, 0.95) * (0.93 + 0.07 * nz), cov * 0.95);',
      '  diffuseColor.rgb = c; }'].join('\n'));
  }
  W3D.seasonKit = {U, compute, snowTop, decid, treeGeo, bark, grass, terrain};

  /* ---------- pond ice overlay (separate mesh over the water; the water material is not touched) ---------- */
  const LITE = !!window.JFVR_LITE;
  let ice = [], tries = 0;
  function makeIce(src, am) {
    const mat = new THREE.MeshStandardMaterial({color: 0xcfe3ee, roughness: 0.2, metalness: 0, transparent: true, depthWrite: false, alphaMap: am || null, alphaTest: am ? 0.5 : 0, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2});
    if (W3D.env) { mat.envMap = W3D.env; mat.envMapIntensity = 0.9; }
    mat.name = 'ice'; mat.customProgramCacheKey = () => 'jsIce' + (am ? 'A' : 'N');
    mat.onBeforeCompile = sh => { for (const k in U) sh.uniforms[k] = U[k];
      sh.vertexShader = 'varying vec3 jsW;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\njsW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = 'uniform float uIce; uniform float uSnow; varying vec3 jsW; varying float jsA;\n' + HASH +
        'float jsN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(jsH(i), jsH(i + vec2(1, 0)), f.x), mix(jsH(i + vec2(0, 1)), jsH(i + vec2(1, 1)), f.x), f.y); }\n' +
        sh.fragmentShader.replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(0.14, 0.9, jsA);').replace('#include <color_fragment>', ['#include <color_fragment>', '{',
        '  vec2 p = jsW.xz; float n1 = jsN(p * 0.021) * 0.6 + jsN(p * 0.07) * 0.4; float n2 = jsN(p * 0.045 + 7.0);',
        am ? '  float e = clamp((texture2D(alphaMap, vAlphaMapUv).g - 0.5) * 2.0, 0.0, 1.0);' : '  float e = 0.5;',
        '  float v = uIce * 1.3 - e * 0.7 - n1 * 0.3;',   // edges freeze first and melt first
        '  float cover = smoothstep(0.0, 0.08, v);',
        '  float c1 = jsN(p * 0.16), c2 = jsN(p * 0.55 + 3.0);',
        '  float w1 = fwidth(c1) * 1.5 + 0.004, w2 = fwidth(c2) * 1.5 + 0.004;',
        '  float crack = max(1.0 - smoothstep(0.0, w1, abs(c1 - 0.5)), 0.7 * (1.0 - smoothstep(0.0, w2, abs(c2 - 0.5)))) * smoothstep(0.25, 0.9, uIce);',
        '  float sn = smoothstep(0.2, 0.5, n2 + uSnow * 0.45 - 0.3) * smoothstep(0.1, 0.5, uSnow) * uIce; jsA = sn;',
        '  vec3 ic = mix(vec3(0.46, 0.64, 0.74), vec3(0.72, 0.85, 0.92), n1); ic = mix(ic, vec3(0.95, 0.98, 1.0), crack * 0.8);',
        '  vec3 col = mix(ic, vec3(0.86, 0.9, 0.97) * (0.94 + 0.06 * n1), sn);',
        '  diffuseColor.rgb = col; diffuseColor.a = cover * mix(0.62, 0.96, smoothstep(0.2, 0.9, uIce)); if (diffuseColor.a < 0.01) discard; }'].join('\n'));
      sh.fragmentShader = sh.fragmentShader.replace('varying float jsA;', 'float jsA = 0.0;'); };
    const m = new THREE.Mesh(src.geometry, mat); m.name = 'pond-ice'; m.renderOrder = 2; m.position.copy(src.position); m.position.y += 0.05; m.rotation.copy(src.rotation); m.scale.copy(src.scale); m.visible = false; m.receiveShadow = true;
    src.parent.add(m); ice.push(m);
  }
  function findWater() {
    if (!window.W3D_READY || !W3D.root) return false; let any = false;
    W3D.root.traverse(o => { if (o.isMesh && o.material && o.material.name === 'water' && (o.name === 'kings-pond' || (o.material.alphaMap && o.geometry.type === 'PlaneGeometry'))) { if (!o.userData.jsIce) { o.userData.jsIce = 1; makeIce(o, o.name === 'kings-pond' ? null : o.material.alphaMap); } any = true; } });
    return any;
  }
  function tick() { if (!ice.length && ++tries < 120 && !findWater()) return setTimeout(tick, 1000); for (const m of ice) m.visible = U.uIce.value > 0.002; setTimeout(tick, 2000); }
  setTimeout(tick, 1500);
  W3D.ice = {meshes: ice, walkable: true};   // groundAt already holds the pond surface at WATER-0.2 for walking, so the frozen pond is walkable as is
})();
