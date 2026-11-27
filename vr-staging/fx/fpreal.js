/* Fowling Pond realism pass (staging, Nov 27 2026). Runtime layer on top of the live world: nothing in /vr is edited.
   1. Photo sky: Poly Haven "Kloofendal 48d Partly Cloudy (Pure Sky)" (CC0) on the sky dome, sun azimuth matched to the world's sun,
      horizon blended into the live fog colour (so day / night fog from daynight.js still matches).
   2. Pond / rivers reflect that photo sky (clouds in the water) instead of the flat analytic gradient.
   3. Trees: the cone + faceted-ball trees are replaced, instance for instance, by photo-real impostors baked from Poly Haven
      "Fir Sapling Medium" and "Tree Small 02" (CC0): two crossed alpha-tested cards per tree with baked albedo + normal maps,
      season-aware (leaf-out / autumn tint / bare winter limbs from W3D.seasonKit), gentle wind sway, alpha-tested shadows (desktop).
   4. Colour grading inside the tone-mapping step (ACES filmic + slight saturation / contrast / warmth): no extra render pass.
   Opt out with ?real=0. */
(function () {
  'use strict';
  const QS = new URLSearchParams(location.search); if (QS.get('real') === '0') return;
  const BASE = new URL('.', document.currentScript.src).href.replace(/fx\/$/, '');
  const QUEST = /OculusBrowser|Quest/i.test(navigator.userAgent) || QS.get('quest') === '1';
  const LITE = !!(window.JFVR_LITE || /lite=1/.test(location.search) || /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent) && !QUEST);
  const HI = !LITE && !QUEST;
  const FP = window.FPREAL = {on: true, quest: QUEST, lite: LITE};

  // ---------- 4. colour grade, set before the world's materials compile ----------
  THREE.ShaderChunk.tonemapping_pars_fragment = THREE.ShaderChunk.tonemapping_pars_fragment.replace(
    'vec3 CustomToneMapping( vec3 color ) { return color; }',
    `vec3 CustomToneMapping( vec3 color ) {
      color *= 1.04;
      vec3 c = ACESFilmicToneMapping( color );
      float l = dot( c, vec3( 0.2126, 0.7152, 0.0722 ) );
      c = mix( vec3( l ), c, 1.10 );                                  // saturation
      c = clamp( ( c - 0.5 ) * 1.05 + 0.5, 0.0, 1.0 );               // contrast
      c *= vec3( 1.015, 1.0, 0.975 );                                 // a touch warmer
      return clamp( c, 0.0, 1.0 ); }`);
  // ---------- 0. woodland placement fix ----------
  // live world.js buildTrees(): the `m4.compose(...); im.setMatrixAt(i, m4);` call sits inside a // comment (since 982a802, Nov 22),
  // so all ~18k woodland trees stand stacked at the origin. Until /vr is fixed, place them here, exactly as mk() meant to, the moment
  // each mesh is named 'trees' (before shore.js / vestahouse.js clear their paths). Skipped once the live code places them itself.
  (function treeFix() {
    let buf = null, lists = null, nth = 0;
    const of = window.fetch; window.fetch = function (u, o) { const url = String(u && u.url || u);
      if (!/trees_t5\.f32/.test(url)) return of.apply(this, arguments);
      return of.apply(this, arguments).then(r => r.ok ? r.arrayBuffer().then(b => { buf = b.slice(0); return new Response(b, {status: 200}); }) : r); };
    const build = () => { if (lists || !buf || !window.W3D || !W3D.terrainH) return lists; const a = new Float32Array(buf), n = a.length / 4, con = [], dec = [], HALF = 2048, LT = !!window.JFVR_LITE;
      const rv = new Map(), RC = 10; for (const R of (W3D.water && W3D.water.rivers) || []) { const hw = (R.hw || 7) + 3; for (const [x, z] of R.pts) { if (Math.abs(x) > HALF || Math.abs(z) > HALF) continue; const k = Math.floor(x / RC) + ',' + Math.floor(z / RC); if (!rv.has(k)) rv.set(k, []); rv.get(k).push(x, z, hw); } }
      const onRiver = (x, z) => { const cx = Math.floor(x / RC), cz = Math.floor(z / RC); for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const L = rv.get((cx + i) + ',' + (cz + j)); if (L) for (let k = 0; k < L.length; k += 3) { const dx = L[k] - x, dz = L[k + 1] - z; if (dx * dx + dz * dz < L[k + 2] * L[k + 2]) return true; } } return false; };
      for (let i = 0; i < n; i++) { if (LT && i % 5 > 1) continue; const x = a[i * 4], z = a[i * 4 + 1], s = a[i * 4 + 2], k = a[i * 4 + 3]; const y = W3D.terrainH(x, z); if (y < -5 || onRiver(x, z)) continue; (k < 0.5 ? con : dec).push([x, y, z, s]); }
      return (lists = {con, dec}); };
    const place = im => { const L = build(); if (!L) return; const list = [L.con, L.dec, L.con, L.dec][nth++]; if (!list || list.length !== im.count) return;
      const m4 = new THREE.Matrix4(); m4.fromArray(im.instanceMatrix.array, 0); if (im.count > 1) { const b = new THREE.Matrix4().fromArray(im.instanceMatrix.array, 16); if (!m4.equals(b)) return; }   // already placed
      const q = new THREE.Quaternion(), sv = new THREE.Vector3(), pv = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
      list.forEach((t, i) => { q.setFromAxisAngle(Y, (i * 2.39996) % 6.283); sv.set(t[3], t[3], t[3]); pv.set(t[0], t[1] - 0.35, t[2]); m4.compose(pv, q, sv); im.setMatrixAt(i, m4); });
      im.instanceMatrix.needsUpdate = true; FP.treeFix = (FP.treeFix || 0) + 1; };
    const P = THREE.InstancedMesh.prototype, NM = Symbol('name');
    Object.defineProperty(P, 'name', {configurable: true, get() { return this[NM] === undefined ? '' : this[NM]; },
      set(v) { this[NM] = v; if (v === 'trees') try { place(this); } catch (e) { console.warn('[fpreal] treefix', e); } }});
  })();

  function grade(sc) { const r = sc.renderer; if (!r || FP.graded) return; r.toneMapping = THREE.CustomToneMapping; r.toneMappingExposure = 1.0; FP.graded = true; }
  const whenScene = f => { const sc = document.querySelector('a-scene'); if (sc && sc.renderer) f(sc); else if (sc) sc.addEventListener('renderstart', () => f(sc), {once: true}); else document.addEventListener('DOMContentLoaded', () => whenScene(f), {once: true}); };
  whenScene(grade);

  // ---------- 1. photo sky ----------
  const tl = new THREE.TextureLoader();
  const skyTex = tl.load(BASE + 'assets/sky_' + (HI ? '4k' : '2k') + '.jpg?v=1');
  skyTex.colorSpace = THREE.SRGBColorSpace; skyTex.wrapS = THREE.RepeatWrapping; skyTex.wrapT = THREE.ClampToEdgeWrapping; skyTex.generateMipmaps = true; skyTex.minFilter = THREE.LinearMipmapLinearFilter;
  // sun in the photo sits at u = 0.597 (51 deg up); the world sun is (-0.45, 0.62, 0.35) -> rotate so they line up
  const SUN = new THREE.Vector3(-0.45, 0.62, 0.35).normalize(), U_OFF = 0.597 - (Math.atan2(SUN.z, SUN.x) / (2 * Math.PI) + 0.5);
  const SKY_GLSL = `
    uniform sampler2D fpSky; uniform float fpSkyOff;
    vec3 fpSkyCol( vec3 d ) { d = normalize( d ); float u = atan( d.z, d.x ) / 6.2831853 + 0.5 + fpSkyOff; float v = asin( clamp( d.y, 0.0, 1.0 ) ) / 1.5707963;
      return texture2D( fpSky, vec2( u, max( v, 0.004 ) ) ).rgb; }`;
  const skyU = {fpSky: {value: skyTex}, fpSkyOff: {value: U_OFF}, fogC: {value: new THREE.Color(0xcfdde8)}, night: {value: 0}};
  function photoSky() {
    if (!W3D.sky || FP.sky) return; FP.sky = true;
    const old = W3D.sky.material;
    const m = new THREE.ShaderMaterial({side: THREE.BackSide, depthWrite: false, fog: false, toneMapped: false, uniforms: skyU,
      vertexShader: 'varying vec3 vD;\n#include <common>\n#include <logdepthbuf_pars_vertex>\nvoid main(){ vD = (modelMatrix * vec4(position, 0.0)).xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n#include <logdepthbuf_vertex>\n}',
      fragmentShader: SKY_GLSL + '\nuniform vec3 fogC;\nvarying vec3 vD;\n#include <common>\n#include <logdepthbuf_pars_fragment>\nvoid main(){\n#include <logdepthbuf_fragment>\n vec3 d = normalize(vD); vec3 c = fpSkyCol(d);\n' +
        ' vec3 f = pow(fogC, vec3(1.0 / 2.2)); float h = 1.0 - smoothstep(-0.02, 0.16, d.y); c = mix(c, f, h * 0.85);\n gl_FragColor = vec4(c, 1.0);\n}'});
    W3D.sky.material = m; FP.oldSky = old;
  }

  // ---------- 2. water reflects the photo sky ----------
  function patchWater(root) {
    let n = 0; const seen = new Set();
    root.traverse(o => { const m = o.material; if (!m || m.name !== 'water' || seen.has(m) || !m.onBeforeCompile) return; seen.add(m);
      const prev = m.onBeforeCompile, key = m.customProgramCacheKey;
      m.onBeforeCompile = (sh, r) => { prev(sh, r); sh.uniforms.fpSky = skyU.fpSky; sh.uniforms.fpSkyOff = skyU.fpSkyOff;
        const f = sh.fragmentShader, a = 'vec3 sky = mix(vec3(0.62, 0.72, 0.80), vec3(0.27, 0.45, 0.70), clamp(rw.y * 1.6, 0.0, 1.0))';
        if (f.indexOf(a) < 0) return;
        sh.fragmentShader = SKY_GLSL + '\n' + f.replace(a, 'vec3 sky = mix(vec3(0.62, 0.72, 0.80), fpSkyCol(vec3(rw.x, max(rw.y, 0.02), rw.z)) * 1.08, 0.92)'); };
      m.customProgramCacheKey = () => (key ? key() : '') + 'fpsky'; m.needsUpdate = true; n++; });
    FP.water = n;
  }

  // ---------- 3. impostor trees ----------
  function treeGeo(cards, bare) {
    // cards: [{r: uvRect, aspect}] - card i is rotated i * 180/n deg about Y; base at y = 0, height 1, centred on the trunk
    const P = [], N = [], UV = [], UL = [], I = []; let v = 0;
    cards.forEach((c, i) => { const a = i * Math.PI / cards.length, ca = Math.cos(a), sa = Math.sin(a), hw = c.aspect / 2;
      const nx = -sa, nz = ca; // card normal
      for (const [s, t] of [[0, 0], [1, 0], [1, 1], [0, 1]]) {
        const x = (s - 0.5) * 2 * hw; P.push(x * ca, t, x * sa); N.push(nx * 0.4, 0.92, nz * 0.4);   // canopy normals lean up (lit like foliage from the sky, never black when backlit)
        UV.push(c.r.u0 + s * (c.r.u1 - c.r.u0), c.r.v0 + t * (c.r.v1 - c.r.v0));
        UL.push(bare ? 0.5 + (s - 0.5) * c.aspect / bare.aspect : s, t); }
      I.push(v, v + 1, v + 2, v, v + 2, v + 3); v += 4; });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setAttribute('uvL', new THREE.Float32BufferAttribute(UL, 2)); g.setIndex(I);
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.5, 0), 1e5); return g;
  }
  const VERT_HEAD = 'attribute vec2 uvL; varying vec2 vUL; varying float vRnd; uniform float fpT;\n';
  const VERT_BODY = `
    #ifdef USE_INSTANCING
      vec3 ip = instanceMatrix[3].xyz; vRnd = fract(sin(dot(ip.xz, vec2(12.9898, 78.233))) * 43758.5453);
      float sw = position.y * position.y * 0.012 * (0.6 + vRnd);
      transformed.x += sin(fpT * (0.9 + vRnd * 0.5) + ip.x * 0.05) * sw; transformed.z += cos(fpT * (0.7 + vRnd * 0.4) + ip.z * 0.05) * sw;
    #else
      vRnd = 0.5;
    #endif
    vUL = uvL;`;
  function patchTree(m, U, bareRect, depth) {
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = VERT_HEAD + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>' + VERT_BODY);
      const pick = bareRect ? `
        bool fpLeaf = vRnd < uLeaf * 1.02 + 0.001;
        vec2 fpUV = vMapUv; vec4 fpT4 = texture2D(map, fpUV);
        if (!fpLeaf) { if (vUL.x < 0.0 || vUL.x > 1.0) discard; fpUV = fpBare.xy + vUL * fpBare.zw; fpT4 = texture2D(map, fpUV); }` : `
        vec2 fpUV = vMapUv; vec4 fpT4 = texture2D(map, fpUV);`;
      sh.fragmentShader = 'varying vec2 vUL; varying float vRnd; uniform float uLeaf; uniform float uFall; uniform vec4 fpBare;\n' + sh.fragmentShader
        .replace('#include <map_fragment>', pick + `
        if (fpT4.a < 0.4) discard;
        ${depth ? '' : `vec3 fpC = fpT4.rgb;
        float fpG = clamp((fpC.g - max(fpC.r, fpC.b)) * 6.0, 0.0, 1.0);
        ${bareRect ? 'if (fpLeaf) { vec3 fall = mix(vec3(0.85, 0.32, 0.06), vec3(0.95, 0.62, 0.10), fract(vRnd * 7.3)); fpC = mix(fpC, fall * dot(fpC, vec3(0.5, 0.9, 0.2)) * 1.25, uFall * fpG * smoothstep(0.1, 0.9, fract(vRnd * 3.7) + 0.3)); }' : ''}
        fpC *= 0.85 + 0.3 * fract(vRnd * 13.1);
        ${bareRect ? '' : 'fpC = mix(vec3(dot(fpC, vec3(0.3, 0.59, 0.11))), fpC, 0.72) * vec3(0.7, 0.76, 0.72);'}
        diffuseColor.rgb *= fpC;`}`)
        .replace('#include <alphatest_fragment>', '')
        .replace('#include <normal_fragment_begin>', THREE.ShaderChunk.normal_fragment_begin.replace(/normal\s*\*=\s*faceDirection;/, ''))
        .replace('#include <normal_fragment_maps>', bareRect ? '#ifdef USE_NORMALMAP\n vec3 mapN = texture2D(normalMap, fpUV).xyz * 2.0 - 1.0; mapN.xy *= normalScale; normal = normalize(tbn * mapN);\n#endif' : '#include <normal_fragment_maps>');
    };
    m.customProgramCacheKey = () => 'fptree' + (bareRect ? 'd' : 'c') + (depth ? 'z' : '');
  }
  let J0 = null, COL = null; const MATS = {}, PAIRS = [];
  function buildTrees() {
    for (const f of PAIRS) f();
    // which instanced meshes become which impostor: [name, geometry type, kind, base-from-centre factor]; others with these names are hidden
    const MAP = [['trees', 'ConeGeometry', 'con', 0], ['trees', 'IcosahedronGeometry', 'dec', 0], ['shore-pine', 'ConeGeometry', 'con', 5], ['shore-crowns', 'IcosahedronGeometry', 'dec', 6.5], ['trees-pitchpine', 'BufferGeometry', 'con', 0]];   // coverup.js pitch pines (scrub-oak thickets stay)
    const HIDE = /^(trees|shore-pine|shore-pine2|shore-crowns|shore-trunks|trees-pitchpine|trees-pitchpine-trunk)$/;
    const found = [], hide = [], PT = W3D.parkInfo && W3D.parkInfo.trees;
    W3D.root.traverse(o => { if (!o.isInstancedMesh || o.userData.fpDone) return;
      if (HIDE.test(o.name)) { o.userData.fpDone = 1; hide.push(o); const m = MAP.find(e => e[0] === o.name && e[1] === o.geometry.type); if (m) found.push([o, m[2], m[3]]); return; }
      if (!o.name && PT && o.count === PT) { o.userData.fpDone = 1; hide.push(o); if (o.geometry.type === 'IcosahedronGeometry') found.push([o, 'dec', 0]); } });   // pyramid park groves (trunk + crown)
    if (!found.length) { for (const m of hide) m.visible = false; return false; }
    (J0 ? Promise.resolve(J0) : fetch(BASE + 'assets/trees.json?v=1').then(r => r.json())).then(J => { J0 = J;
      const S = HI ? '2k' : '1k';
      if (!COL) { COL = [tl.load(BASE + 'assets/trees_' + S + '.png?v=2'), tl.load(BASE + 'assets/trees_n_' + S + '.jpg?v=1')]; COL[0].colorSpace = THREE.SRGBColorSpace; COL[0].anisotropy = 4; COL[1].anisotropy = 4; }
      const [col, nor] = COL;
      const SK = W3D.seasonKit && W3D.seasonKit.U, U = {uLeaf: SK ? SK.uLeaf : {value: 1}, uFall: SK ? SK.uFall : {value: 0}, fpT: W3D.waterU ? W3D.waterU.wT : {value: 0},
        fpBare: {value: new THREE.Vector4(J.bare0.u0, J.bare0.v0, J.bare0.u1 - J.bare0.u0, J.bare0.v1 - J.bare0.v0)}};
      const KIND = {con: {cards: [{r: J.fir0, aspect: J.fir0.aspect}, {r: J.fir1, aspect: J.fir1.aspect}], bare: null, H: 13.5},
                    dec: {cards: [{r: J.dec0, aspect: J.dec0.aspect}, {r: J.dec1, aspect: J.dec1.aspect}], bare: {aspect: J.bare0.aspect}, H: 11.5}};
      const mats = MATS;
      const matFor = k => { if (mats[k]) return mats[k]; const K = KIND[k];
        const mat = new THREE.MeshLambertMaterial({map: col, normalMap: nor, side: THREE.DoubleSide, alphaTest: 0.5}); patchTree(mat, U, K.bare, false);
        if (QUEST) mat.alphaToCoverage = true;
        let dm = null; if (HI) { dm = new THREE.MeshDepthMaterial({depthPacking: THREE.RGBADepthPacking, map: col, alphaTest: 0.5}); patchTree(dm, U, K.bare, true); }
        return (mats[k] = {mat, dm, geo: treeGeo(K.cards, K.bare)}); };
      const m4 = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3(), q0 = new THREE.Quaternion(), Y = new THREE.Vector3(0, 1, 0);
      FP.trees = FP.trees || {};
      for (const [src, k, off] of found) {
        const M = matFor(k), im = new THREE.InstancedMesh(M.geo, M.mat, src.count);
        const sync = () => { for (let i = 0; i < src.count; i++) { src.getMatrixAt(i, m4); m4.decompose(p, q, s); const sc = off ? s.y : s.x;
          if (sc < 1e-3) s.set(0, 0, 0); else { if (off) p.y -= off * s.y + 0.3; const h = KIND[k].H * sc * (off ? 0.8 : 1) * (0.88 + 0.24 * ((i * 0.618034) % 1)); s.set(h, h, h); }
          q0.setFromAxisAngle(Y, (i * 2.39996) % 6.283); m4.compose(p, q0, s); im.setMatrixAt(i, m4); }
          im.instanceMatrix.needsUpdate = true; ver = src.instanceMatrix.version; };
        let ver = -1; sync(); PAIRS.push(() => { if (src.instanceMatrix.version !== ver) sync(); });   // later path clearing (shore.js etc.) carries over im.frustumCulled = false; im.name = 'trees-real'; im.receiveShadow = false;
        if (M.dm) { im.castShadow = true; im.customDepthMaterial = M.dm; }
        W3D.root.add(im); FP.trees[(src.name || 'park') + ':' + k] = src.count;
      }
      for (const m of hide) m.visible = false;   // the old cones, faceted balls and trunks stay in the scene, hidden
      const sc = document.querySelector('a-scene'); if (sc && sc.renderer) sc.renderer.shadowMap.needsUpdate = true;
    }).catch(e => console.warn('[fpreal] trees', e));
    return true;
  }

  // ---------- wiring ----------
  let tries = 0;
  (function wait() {
    if (!window.W3D_READY || !window.W3D || !W3D.root) { if (++tries < 3000) setTimeout(wait, 200); return; }
    try { photoSky(); } catch (e) { console.warn('[fpreal] sky', e); }
    try { patchWater(W3D.root); } catch (e) { console.warn('[fpreal] water', e); }
    const bt = () => { try { buildTrees(); } catch (e) { console.warn('[fpreal] trees', e); } }; bt(); setInterval(bt, 4000);   // shore.js / coverup.js etc. build later (some lazily, near the player); cheap scan
    AFRAME.registerComponent('fpreal-tick', {tick: function () {
      const f = this.el.sceneEl.object3D.fog || W3D.fog; if (f && f.color) skyU.fogC.value.copy(f.color);
    }});
    document.querySelector('a-scene').setAttribute('fpreal-tick', '');
    console.log('[fpreal] on', JSON.stringify({water: FP.water, quest: QUEST, lite: LITE}));
  })();
})();
