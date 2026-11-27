/* Real Earth: Google Photorealistic 3D Tiles around the hand-built world (3DTilesRendererJS 0.3.46, vendored as tiles3d.min.js).
   - One root.json per browser session (cached with its session token for 2.5 h and reused); hard client cap 32 root requests a day
     (localStorage 'jfvr.gtiles', logged with times). Google attribution on screen whenever tiles show.
   - Frame: ECEF -> ENU at an anchor (home = lon0/lat0, London = its pad), mapped to our axes (x east, y up, z south) with a
     geoid offset so the Google ground meets our terrain; the anchor re-bases every 15 km when flying far (floating origin).
   - Cutouts: a feathered mask (pond, temple/bank/Vesta/office, pyramid park, rivers, launch pad, ...) - Google tiles are dropped inside,
     our ground / roads / trees are dropped outside, with the same dither so the seam has no gap. Our rings are hidden while on;
     when off, the old world (fog past 16 km) is untouched.
   - Toggle: menu "Real Earth" On/Off, saved per user ('jfvr.realEarth'); default On on desktop and Quest, Off on ?lite=1.
     ?realearth=0/1 overrides. LRU ~120 MB lite, 300 MB Quest, 500 MB desktop. */
(function () {
'use strict';
const W3D = window.W3D = window.W3D || {};
const LITE = !!window.JFVR_LITE, QUEST = /OculusBrowser|Quest/i.test(navigator.userAgent);
const LON0 = -71.06797286566898, LAT0 = 41.928658149882345, KX = 82938.7775, KY = 111071.9356, D2R = Math.PI / 180;
const ANCH = {
  home:   {lat: LAT0, lon: LON0, x: 0, z: 0, yOff: 28.8, kx: KX, ky: KY},                       // geoid ~ -28.8 m at Raynham
  london: {lat: 51.575359, lon: 0.111801, x: 60000, z: 60000, yOff: -(45.4 + 20.75)},           // geoid ~ +45.4 m, pad at 20.75 m
  dubai: {lat: 25.19515, lon: 55.27315, x: 160000, z: 60000, yOff: -(-33.5 + 6)},               // geoid ~ -33.5 m, pad ~6 m
  // the stylised saucer cities sit on their real places too (pad = a real open waterfront spot); calibration levels the ground to the pad
  boston: {lat: 42.36055, lon: -71.05035, x: 100000, z: 60000, yOff: -(-28.4 + 3), flat: 1},     // Christopher Columbus Park, harbour
  saintjohn: {lat: 45.27255, lon: -66.06395, x: 80000, z: 60000, yOff: -(-21 + 4), flat: 1},     // Market Slip, uptown waterfront
  bangkok: {lat: 13.74420, lon: 100.49260, x: 120000, z: 60000, yOff: -(-31 + 2), flat: 1},     // east bank opposite Wat Arun
  hongkong: {lat: 22.29350, lon: 114.17190, x: 140000, z: 60000, yOff: -(-2 + 4), flat: 1}       // Tsim Sha Tsui promenade
};
const CAP = 32, LS = 'jfvr.gtiles', LSR = 'jfvr.gtiles.root', PREF = 'jfvr.realEarth';
const q = location.search, forced = /[?&]realearth=1/.test(q) ? true : /[?&]realearth=0/.test(q) ? false : null;
function pref() { if (forced !== null) return forced; const v = localStorage.getItem(PREF); return v ? v === 'on' : !LITE; }
const RE = W3D.realEarth = {on: pref(), ready: false, tiles: null, anchor: 'home', count: dayCount, setOn, toggle: () => setOn(!RE.on), stats: () => stats()};
RE.clipOurs = m => clipMat(m, 2);   // late-built layers of ours (home3d houses) clip to the cutouts too
RE.rebuildMask = () => { if (clipU.jfMask.value && W3D.water) { const o = clipU.jfMask.value; buildMask(); if (o !== clipU.jfMask.value) o.dispose(); } };   // after a late site adds a W3D.maskHooks entry

function today() { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
function dayLog() { let o = null; try { o = JSON.parse(localStorage.getItem(LS) || 'null'); } catch (e) {} if (!o || o.day !== today()) o = {day: today(), n: 0, log: []}; return o; }
function dayCount() { return dayLog().n; }
function bump() { const o = dayLog(); o.n++; o.log.push(new Date().toTimeString().slice(0, 8)); localStorage.setItem(LS, JSON.stringify(o)); return o.n; }

/* ---------- cutout mask (local frame, +-13312 m; was 12288 until Nov 27 - Versailles town reaches x ~12.9 km) ---------- */
const MR = 13312, MN = LITE ? 1024 : 2048;
const clipU = W3D.clipU = {jfNi: {value: 0}, jfOn: {value: 0}, jfMask: {value: null}, jfMR: {value: MR}, jfRect: {value: [new THREE.Vector4(0, 0, -1, 0), new THREE.Vector4(0, 0, -1, 0), new THREE.Vector4(0, 0, -1, 0), new THREE.Vector4(0, 0, -1, 0)]}};
function buildMask() {
  const c = document.createElement('canvas'); c.width = c.height = MN; const g = c.getContext('2d'), s = MN / (2 * MR);
  const P = (x, z) => [(x + MR) * s, (z + MR) * s];
  g.fillStyle = '#000'; g.fillRect(0, 0, MN, MN); g.fillStyle = g.strokeStyle = '#fff'; g.lineCap = g.lineJoin = 'round';
  const rect = (x0, z0, x1, z1, m) => { m = m || 0; const a = P(x0 - m, z0 - m), b = P(x1 + m, z1 + m); g.fillRect(a[0], a[1], b[0] - a[0], b[1] - a[1]); };
  const line = (pts, w) => { if (!pts || pts.length < 2) return; g.lineWidth = w * s; g.beginPath(); pts.forEach((p, i) => { const q2 = P(p[0], p[1]); i ? g.lineTo(q2[0], q2[1]) : g.moveTo(q2[0], q2[1]); }); g.stroke(); };
  const poly = pts => { if (!pts || pts.length < 3) return; g.beginPath(); pts.forEach((p, i) => { const q2 = P(p[0], p[1]); i ? g.lineTo(q2[0], q2[1]) : g.moveTo(q2[0], q2[1]); }); g.closePath(); g.fill(); g.lineWidth = 30 * s; g.stroke(); };
  const wj = W3D.water || {};
  if (wj.pond) rect(wj.pond.x0, wj.pond.z0, wj.pond.x1, wj.pond.z1, 40);                         // restored pond + its basin
  if (wj.kings) poly(wj.kings.poly);
  (wj.rivers || []).forEach(r => line(r.pts, 70)); (wj.taunton || []).forEach(p => line(p, 90));    // rivers + banks
  if (wj.dam) rect(wj.dam.x0, wj.dam.z - 30, wj.dam.x1, wj.dam.z + 30, 20);
  if (wj.park) { const k = wj.park, a = P(k.cx, k.cz); g.beginPath(); g.ellipse(a[0], a[1], (k.ax + 80) * s, (k.az + 80) * s, 0, 0, 7); g.fill(); }  // pyramid park
  if (wj.zoo) { const a = P(wj.zoo.x, wj.zoo.z); g.beginPath(); g.arc(a[0], a[1], (wj.zoo.r + 40) * s, 0, 7); g.fill(); }
  if (wj.footbridge) line([wj.footbridge.a, wj.footbridge.b], 40);
  rect(820, -440, 1010, -280, 15);                                                                 // temple / bank / Vesta court / office
  (W3D.maskHooks || []).forEach(f => { try { f({rect, line, poly}); } catch (e) {} });                 // late sites (verspark.js: Versailles gardens + town)
  // every named hand-built site group in the world root (its bounding box + margin)
  const SITE = /pharos|bank|temple|vesta|sphinx|pyramid|office|showcase|zoo|lift|footbridge|weir|bridge-|kings|beach|shore|saucer|bridgewater|launch|campus|pad/i, bx = new THREE.Box3();
  (W3D.root ? W3D.root.children : []).forEach(o => { if (!SITE.test(o.name || '') || /patch/.test(o.name)) return; bx.setFromObject(o); if (bx.isEmpty()) return;
    const sx = bx.max.x - bx.min.x, sz = bx.max.z - bx.min.z; if (sx > 3000 || sz > 3000) return; rect(bx.min.x, bx.min.z, bx.max.x, bx.max.z, 25); });
  { const a = P(9617, -2976.9); g.beginPath(); g.arc(a[0], a[1], 260 * s, 0, 7); g.fill(); }        // launch pad + tower
  // feather ~3 px (36 m full / 24 m lite)
  const c2 = document.createElement('canvas'); c2.width = c2.height = MN; const g2 = c2.getContext('2d'); g2.filter = 'blur(2px)'; g2.drawImage(c, 0, 0);
  const t = new THREE.CanvasTexture(c2); t.generateMipmaps = false; t.minFilter = t.magFilter = THREE.LinearFilter; t.flipY = false; clipU.jfMask.value = t; RE.maskCanvas = c2; maskPx = null;
}
// mode 1: drop inside the cutouts (Google tiles); mode 2: drop outside (our ground / roads / trees)
function clipMat(mat, mode) {
  if (!mat || mat.userData.jfClip) return; mat.userData.jfClip = mode;
  const prev = mat.onBeforeCompile, prevKey = mat.customProgramCacheKey ? mat.customProgramCacheKey.bind(mat) : () => '';
  mat.onBeforeCompile = (sh, r) => { if (prev) prev.call(mat, sh, r);
    Object.assign(sh.uniforms, clipU);
    sh.vertexShader = 'varying vec2 vJfW;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n{ vec4 jw = vec4(transformed, 1.0);\n#ifdef USE_INSTANCING\n jw = instanceMatrix * jw;\n#endif\n jw = modelMatrix * jw; vJfW = jw.xz; }');
    sh.fragmentShader = 'uniform float jfNi; uniform float jfOn; uniform sampler2D jfMask; uniform float jfMR; uniform vec4 jfRect[4]; varying vec2 vJfW;\n' +
      'float jfM() { vec2 u = (vJfW + jfMR) / (2.0 * jfMR); float m = 0.0; if (u.x > 0.0 && u.x < 1.0 && u.y > 0.0 && u.y < 1.0) m = texture2D(jfMask, u).r;\n' +
      ' for (int i = 0; i < 4; i++) { vec4 R = jfRect[i]; if (R.z > 0.0) { vec2 d = abs(vJfW - R.xy) - vec2(R.z); m = max(m, clamp(1.0 - max(d.x, d.y) / R.w, 0.0, 1.0)); } } return m; }\n' +
      // Nov 26: the seam dither is keyed to the ground position (0.67 m cells), not the screen pixel - a screen-space pattern crawled over
      // the seam whenever the head moved and differed between the two eyes, which read as shimmer in the headset
      'float jfD() { vec2 jc = floor(vJfW * 1.5); return fract(52.9829189 * fract(dot(jc, vec2(0.06711056, 0.00583715)))); }\n' +
      (function (fs) { fs = fs.replace(/void\s+main\s*\(\s*\)\s*\{/, 'void main() {\n float jm = 0.0; if (jfOn > 0.5) { jm = jfM(); float jd = 0.5 + (jfD() - 0.5) * 0.08; ' + (mode === 1 ? 'if (jm > jd) discard;' : 'if (jm < jd) discard;') + ' }\n');
        // our ground just inside a cutout edge eases toward the Google ground's colour, so a lawn doesn't read as a pasted-on square
        // night (daynight.js): Google tiles are unlit photos, so darken them toward moonlight
        if (mode === 1) { const nt = '\n if (jfNi > 0.0) gl_FragColor.rgb *= mix(vec3(1.0), vec3(0.075, 0.09, 0.14), jfNi);\n';
          fs = fs.indexOf('#include <fog_fragment>') >= 0 ? fs.replace('#include <fog_fragment>', nt + '#include <fog_fragment>') : fs.replace(/\}\s*$/, nt + '}'); }
        if (mode === 2) { const tint = '\n if (jfOn > 0.5) { float je = smoothstep(0.5, 0.9, jm); gl_FragColor.rgb = mix(gl_FragColor.rgb * vec3(0.8, 0.84, 0.72) + vec3(0.015, 0.02, 0.0), gl_FragColor.rgb, je); }\n';
          fs = fs.indexOf('#include <fog_fragment>') >= 0 ? fs.replace('#include <fog_fragment>', tint + '#include <fog_fragment>') : fs.replace(/\}\s*$/, tint + '}'); }
        return fs; })(sh.fragmentShader);
  };
  mat.customProgramCacheKey = () => prevKey() + '|jfclip' + mode; mat.needsUpdate = true;
}
W3D.clipMat = clipMat;
const OURS = /^(terrain|road-ribbons|bridge-decks|trees|bridgewater-patch|buildings?.*|street.*|roofs?.*|houses?.*|ortho.*)$/i;
let hidden = [], clipped = false;
function applyOurs(on) {
  const root = W3D.root; if (!root) return;
  if (on && !clipped) { clipped = true;
    root.traverse(o => { if (o.isMesh && OURS.test(o.name || '') || o.isMesh && o.parent && /^(bridgewater|streets?)$/i.test(o.parent.name || '') && !/pad|rocket|tower/i.test(o.name || '')) [].concat(o.material).forEach(m => clipMat(m, 2)); }); }
  if (on) { hidden = [];
    const R = W3D.rings || {}; [R.mid, R.far].forEach(m => { if (m) [].concat(m.material).forEach(mt => clipMat(mt, 2)); });   // rings stay under the cutouts out past the core (pyramid park, rivers, launch pad)
    root.children.forEach(o => { if (!o.isMesh || !o.visible) return; const p = o.geometry && o.geometry.parameters, col = o.material && o.material.color && o.material.color.getHex();
      if (p && p.width === 400000 || col === 0x56643c) { o.visible = false; hidden.push(o); } });   // flat far plane + ring curtains
  } else { hidden.forEach(m => { m.visible = true; }); hidden = []; }
  clipU.jfOn.value = on ? 1 : 0;
}

/* ---------- tiles ---------- */
function cachedRoot() { try { const o = JSON.parse(localStorage.getItem(LSR) || 'null'); if (o && Date.now() - o.t < 2.5 * 3600e3) return o.j; } catch (e) {} return null; }
function start() {
  if (RE.tiles || RE.failed) return; const K = window.JF3DTiles, key = window.JFVR_GK;
  if (!K || !key) { RE.failed = 'library or key missing'; return; }
  const cached = cachedRoot();
  if (!cached && dayCount() >= CAP) { RE.failed = 'daily limit'; toast('Real Earth: daily limit reached (' + CAP + ' loads) - showing the classic world'); return; }
  const T = new K.TilesRenderer();
  const auth = new K.GoogleCloudAuthPlugin({apiToken: key, autoRefreshToken: false});
  const origFetch = auth.fetchData.bind(auth);
  auth.fetchData = (uri, opt) => {
    if (/\/v1\/3dtiles\/root\.json/.test(uri)) {
      const c = cachedRoot(); if (c) return Promise.resolve(new Response(c, {status: 200, headers: {'Content-Type': 'application/json'}}));
      if (dayCount() >= CAP) return Promise.reject(new Error('daily cap'));
      bump(); console.log('realearth: root.json request ' + dayCount() + '/' + CAP + ' today');
      return origFetch(uri, opt).then(r => r.ok ? r.text().then(tx => { try { localStorage.setItem(LSR, JSON.stringify({t: Date.now(), j: tx})); } catch (e) {} return new Response(tx, {status: 200, headers: {'Content-Type': 'application/json'}}); }) : r);
    }
    return origFetch(uri, opt);
  };
  T.registerPlugin(auth);
  const draco = new THREE.DRACOLoader(); draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
  T.registerPlugin(new K.GLTFExtensionsPlugin({dracoLoader: draco}));
  T.registerPlugin(new K.TileCompressionPlugin());
  T.errorTarget = LITE ? 72 : QUEST ? 40 : 24;   /* Nov 26 pm: Quest back to 40 - 32 cost frame rate (dropped frames = reprojection wobble) */   // sharper than v1 (80/48/32 looked blurry from flying height); Nov 26: Quest 40 -> 32 (distant scenery east of the pond looked blurry in the headset)
  const C = T.lruCache, MB = 1048576; if (C) { C.maxBytesSize = (LITE ? 120 : QUEST ? 400 : 500) * MB;   /* Quest 300 -> 400 MB with the sharper target, so tiles aren't evicted and re-fetched as you turn (popping) */ C.minBytesSize = C.maxBytesSize * 0.7; C.maxSize = LITE ? 1500 : 4000; C.minSize = C.maxSize * 0.75; }
  T.addEventListener('load-model', ({scene}) => { scene.traverse(o => { if (o.isMesh) { [].concat(o.material).forEach(m => { m.fog = true; clipMat(m, 1); }); o.receiveShadow = o.castShadow = false; } }); });
  T.addEventListener('load-tile-set', () => { RE.ready = true; });
  T.group.name = 'realearth'; T.group.matrixAutoUpdate = false;
  RE.tiles = T; const sc = document.querySelector('a-scene'); sc.object3D.add(T.group); setAnchor('home');
}
/* ECEF -> our local frame for anchor A: local = T(A.x, yOff, A.z) * P * ENU(lat, lon)^-1 */
const _m = new THREE.Matrix4(), _p = new THREE.Matrix4().set(1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1);
function kxy(lat) { const p = lat * D2R; return {kx: 111412.84 * Math.cos(p) - 93.5 * Math.cos(3 * p), ky: 111132.954 - 559.822 * Math.cos(2 * p) + 1.175 * Math.cos(4 * p)}; }
// half-size of the hand-built square kept over the Google tiles in each saucer city (London = the Goodmayes area labelled "London";
// Dubai and the stylised cities keep only the landing lawn / pad plaza - Google's real city is the main look there)
const REAL_CITY = {london: 480, dubai: 45, boston: 45, saintjohn: 45, bangkok: 45, hongkong: 45};
// extra cutouts (slots 1-2) for hand-built buildings at real places: RE.addCut({lat, lon, half, need: /name/})
const CUTS = [];   // (walker.js keeps its own cutout in slot 3, placed from RE.anchors.boston)
RE.addCut = c => { CUTS.push(c); };
// Google's Photorealistic 3D Tiles have no 3D surface data in the UAE (flat imagery + terrain only, Google Maps Platform coverage: Maps 3D
// unavailable in AE), so in Dubai our Overture buildings, Burj spire, palms and fountain stay standing on Google's ground and imagery.
const KEEP3D = {dubai: 1};
RE.anchors = ANCH;   // the real place under each saucer city (walker.js places Walker Memorial from RE.anchors.boston)
RE.geoToLocal = (lat, lon) => { const A = RE.A; return A ? {x: A.x + (lon - A.lon) * A.kx, z: A.z - (lat - A.lat) * A.ky} : null; };
function setAnchor(name, A) {
  A = A || ANCH[name]; if (!A.kx) Object.assign(A, kxy(A.lat)); RE.anchor = name; RE.A = A; const T = RE.tiles; if (!T) return;
  const cal = +localStorage.getItem('jfvr.gtiles.cal.' + name) || 0; A.cal = A.cal != null ? A.cal : cal;
  window.JF3DTiles.WGS84_ELLIPSOID.getEastNorthUpFrame(A.lat * D2R, A.lon * D2R, _m); _m.invert();
  const M = new THREE.Matrix4().makeTranslation(A.x, A.yOff + (A.cal || 0), A.z).multiply(_p).multiply(_m);
  T.group.matrix.copy(M); T.group.matrixWorldNeedsUpdate = true; T.group.updateMatrixWorld(true);
}

function geoOf(x, z) { const A = RE.A; return {lat: A.lat - (z - A.z) / A.ky, lon: A.lon + (x - A.x) / A.kx}; }
RE.geoOf = geoOf;
RE.goGeo = (lat, lon, alt) => { // test / future menu hook: jump to any place on Earth (free anchor at a spot 200 km out so home stays clean)
  const x = 200000, z = -200000; setAnchor('free', {lat, lon, x, z, yOff: 0}); W3D.teleportTo(x, alt, z, 0); RE.pin = true; };

/* ---------- calibration: match the Google ground to ours near the anchor (25th percentile of tile - ours, outside cutouts) ---------- */
function calibrate() {
  const T = RE.tiles; if (!T || RE.anchor === 'free') return false; const A = RE.A, rc = new THREE.Raycaster(), d = [];
  const hf = RE.anchor === 'home' ? (x, z) => W3D.terrainH(x, z) : A.flat ? () => 0 : (x, z) => W3D.groundAt(x, z, 999);
  const pts = A.flat ? [[A.x + 60, A.z], [A.x - 60, A.z], [A.x, A.z + 60], [A.x, A.z - 60], [A.x + 45, A.z + 45], [A.x - 45, A.z - 45]] : RE.anchor === 'home' ? [[1500, 0], [-1500, 1300], [0, 1700], [-600, -1500], [1600, 1400], [2600, -900], [-2600, 1800], [3000, 2600], [-3200, -2400], [200, -3000], [-1800, 2600], [2200, 2900]]
    : [[A.x + 700, A.z], [A.x - 700, A.z + 300], [A.x, A.z + 800], [A.x + 500, A.z - 700], [A.x - 600, A.z - 600], [A.x + 900, A.z + 800]];
  for (const [x, z] of pts) { rc.set(new THREE.Vector3(x, 3000, z), new THREE.Vector3(0, -1, 0)); rc.far = 6000;
    const h = rc.intersectObject(T.group, true)[0]; const o = hf(x, z); if (h && isFinite(o)) d.push(h.point.y - o); }
  if (d.length < 4) return false; d.sort((a, b) => a - b); const off = d[Math.floor(d.length * 0.25)];
  if (Math.abs(off) > 80) { console.warn('realearth: calibration off by ' + off.toFixed(1) + ' m - ignored'); return true; }
  A.cal = (A.cal || 0) - off; localStorage.setItem('jfvr.gtiles.cal.' + RE.anchor, A.cal.toFixed(2)); setAnchor(RE.anchor, A);
  console.log('realearth: ground aligned (' + RE.anchor + ', ' + d.length + ' samples, shift ' + (-off).toFixed(1) + ' m)'); RE.calDone = {anchor: RE.anchor, shift: -off, n: d.length}; return true;
}

/* ---------- attribution ---------- */
let attrEl = null, vrAttr = null, attrT = 0;
function attribution(show) {
  const vis = !!(show && RE.tiles && RE.tiles.group.visible && RE.tiles.visibleTiles && RE.tiles.visibleTiles.size > 0);   // only while Google tiles actually render
  if (!attrEl) { attrEl = document.createElement('div'); attrEl.id = 'gattr';
    attrEl.style.cssText = 'position:fixed;left:8px;bottom:3px;z-index:12;font:10px/1.2 system-ui,sans-serif;color:#fff;opacity:.55;background:none;padding:0;text-shadow:0 0 2px #000,0 0 3px #000;pointer-events:none;max-width:60vw;display:none';
    document.body.appendChild(attrEl); }
  attrEl.style.display = vis ? '' : 'none'; if (!vis) { if (vrAttr) vrAttr.visible = false; return; }
  const a = RE.tiles.getAttributions([]).filter(x => x.type === 'string').map(x => x.value).join('; ');
  const txt = !a ? 'Google' : /^google/i.test(a) ? a.replace(/;\s*/g, ' \u00b7 ') : 'Google \u00b7 ' + a; if (attrEl.textContent !== txt) attrEl.textContent = txt;
  const sc = document.querySelector('a-scene'), xr = sc && sc.is('vr-mode');
  if (xr) { if (!vrAttr) { const c = document.createElement('canvas'); c.width = 1024; c.height = 64; const t = new THREE.CanvasTexture(c);
      vrAttr = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.031), new THREE.MeshBasicMaterial({map: t, transparent: true, opacity: .55, depthTest: false}));
      vrAttr.renderOrder = 3000; vrAttr.position.set(0, -1.1, -0.35); vrAttr.rotation.x = -1.0; vrAttr.userData.c = c; sc.camera.el.object3D.add(vrAttr); }   // low, by the feet, off the sight line
    if (vrAttr.userData.txt !== txt) { const c = vrAttr.userData.c, g = c.getContext('2d'); g.clearRect(0, 0, 1024, 64);
      g.font = '30px sans-serif'; g.lineWidth = 4; g.strokeStyle = 'rgba(0,0,0,.8)'; g.strokeText(txt.slice(0, 80), 12, 42);
      g.fillStyle = '#fff'; g.fillText(txt.slice(0, 80), 12, 42); vrAttr.material.map.needsUpdate = true; vrAttr.userData.txt = txt; }
    vrAttr.visible = true; } else if (vrAttr) vrAttr.visible = false;
}
function toast(s) { console.log(s); if (W3D.toast) W3D.toast(s); }

/* ---------- toggle ---------- */
function setOn(v) { RE.on = !!v; localStorage.setItem(PREF, RE.on ? 'on' : 'off'); if (RE.on) start(); label(); toast('Real Earth ' + (RE.on ? 'on' : 'off')); }
function label() { const t = 'Real Earth: ' + (RE.on ? 'On' : 'Off'); const b = document.getElementById('realearthbtn'); if (b) { b.textContent = t; b.classList.toggle('on', RE.on); }
  const v = document.getElementById('realearthvr'); if (v) { const tx = v.querySelector('a-text'); tx && tx.setAttribute('value', t); } }
function addButtons() {
  const tools = document.querySelector('#ui .tools') || document.querySelector('#ui .grp') || document.getElementById('ui');
  if (tools && !document.getElementById('realearthbtn')) { const b = document.createElement('button'); b.id = 'realearthbtn'; b.onclick = () => RE.toggle(); tools.appendChild(b); }
  const fly = document.querySelector('[fly-toggle]'); if (fly && !document.getElementById('realearthvr')) {
    const p = document.createElement('a-plane'); p.id = 'realearthvr'; p.className = 'btn'; p.setAttribute('position', '1.7 -1.2 0'); p.setAttribute('width', '0.8'); p.setAttribute('height', '0.26'); p.setAttribute('material', 'shader:flat;color:#9ffcff');
    const tx = document.createElement('a-text'); tx.setAttribute('align', 'center'); tx.setAttribute('color', '#111'); tx.setAttribute('width', '1.9'); p.appendChild(tx);
    p.addEventListener('click', () => RE.toggle()); fly.parentNode.appendChild(p); }
  label();
}

/* ---------- places: jump to a real landmark near where you are (menu "Places" / VR "Next place") ---------- */
const HOME_P = [['Bridgewater', 41.9904, -70.9751], ['Brockton', 42.0834, -71.0184], ['Randolph', 42.1626, -71.0412], ['Blue Hills, Milton', 42.2120, -71.0730],
  ['Quincy', 42.2529, -71.0023], ['Boston Common', 42.3550, -71.0656], ['MIT / Walker Memorial', 42.3594, -71.0883], ['Harvard Square', 42.3736, -71.1190], ['Fenway Park', 42.3467, -71.0972]];
const PLACES = {
  home: HOME_P, boston: HOME_P.slice(5).concat([['Boston Harbor', 42.3601, -71.0420]]),
  london: [['London (landing)', 51.575359, 0.111801], ['Thames at Dagenham', 51.5130, 0.1390], ['Tower of London', 51.5081, -0.0759], ['London Eye', 51.5033, -0.1196],
    ['Buckingham Palace', 51.5014, -0.1419], ['British Museum', 51.5194, -0.1270], ["Regent's Park", 51.5313, -0.1570], ['Wembley Stadium', 51.5560, -0.2795],
    ['Emirates Stadium', 51.5549, -0.1084], ['Tottenham Hotspur Stadium', 51.6043, -0.0664], ['Stamford Bridge', 51.4817, -0.1910], ['London Stadium', 51.5386, -0.0166],
    ['Twickenham', 51.4560, -0.3415], ["Lord's", 51.5294, -0.1727], ['The Oval', 51.4837, -0.1150]],
  dubai: [['Burj Khalifa', 25.19515, 55.27315], ['The World islands', 25.2230, 55.1700], ['Burj Al Arab', 25.1412, 55.1853], ['Palm Jumeirah', 25.1124, 55.1390],
    ['Dubai Marina', 25.0805, 55.1403], ['Palm Jebel Ali', 25.0030, 54.9890], ['Abu Dhabi: Sheikh Zayed Mosque', 24.4128, 54.4750]],
  saintjohn: [['Saint John harbour', 45.27255, -66.06395], ['Reversing Falls', 45.2626, -66.0896]],
  bangkok: [['Wat Arun', 13.7437, 100.4889], ['Grand Palace', 13.7500, 100.4913]],
  hongkong: [['Victoria Harbour', 22.2935, 114.1719], ['Central', 22.2820, 114.1588], ['Victoria Peak', 22.2759, 114.1455]]
};
function placesHere() { const c = W3D.cities && W3D.cities.current && W3D.cities.current(); return PLACES[c] || PLACES.home; }
RE.places = () => placesHere().map(p => p[0]);
/* Nov 27: fly to any lat/lon in the current frame (Boston & area spots, bostonarea.js). City frame when a saucer city is loaded, else home.
   o.back = metres south of the target, o.up = height over the Google ground; returns the arrival point (camera faces north, at the target). */
RE.goLatLon = (name, lat, lon, o) => { o = o || {}; if (!RE.on) setOn(true);
  const c = W3D.cities && W3D.cities.current && W3D.cities.current(); if (c && ANCH[c] && RE.anchor !== c && RE.tiles) { setAnchor(c); calTries = 0; RE.calDone = null; }
  const A = c && ANCH[c] ? ANCH[c] : ANCH.home; if (!A.kx) Object.assign(A, kxy(A.lat));
  const qx = A.x + (lon - A.lon) * A.kx, qz = A.z - (lat - A.lat) * A.ky, back = o.back || 900, zz = qz + back, dt = Math.hypot(qx - A.x, zz - A.z);
  const gy = o.ground || 0, y = gy - dt * dt / 12742000 + (o.up || 320);   // the Google ground drops with distance from the anchor (stays so after a 'free' re-anchor)
  if (window.JFVR) JFVR.fly = true; W3D.teleportTo(qx, y, zz, 0); if (window.JFVR) JFVR.fly = true;
  const fl = document.querySelector('#flylabel'); if (fl) fl.setAttribute('value', 'Fly: ON');
  const sc = document.querySelector('a-scene'), lc = document.querySelector('[camera]') && document.querySelector('[camera]').components['look-controls'];
  if (lc && sc && !sc.is('vr-mode')) { lc.pitchObject.rotation.x = -Math.atan2(o.up || 320, back); lc.yawObject.rotation.y = 0; }
  toast(name); return {x: qx, y, z: zz, tx: qx, tz: qz}; };
RE.goPlace = i => { const L = placesHere(), p = L[i]; if (!p || !RE.A) return false; if (!RE.on) setOn(true);
  const c = W3D.cities && W3D.cities.current && W3D.cities.current(); if (c && ANCH[c] && RE.anchor !== c && RE.anchor !== 'free' && RE.tiles) { setAnchor(c); calTries = 0; RE.calDone = null; }
  if (c && ANCH[c] && !ANCH[c].kx) Object.assign(ANCH[c], kxy(ANCH[c].lat));
  const A = c && ANCH[c] && RE.anchor !== 'free' ? ANCH[c] : RE.A, q2 = {x: A.x + (p[2] - A.lon) * A.kx, z: A.z - (p[1] - A.lat) * A.ky}, sc = document.querySelector('a-scene'); sc.camera.getWorldPosition(_c);
  const zz = q2.z + 900, dc = Math.hypot(_c.x - A.x, _c.z - A.z), dt = Math.hypot(q2.x - A.x, zz - A.z);
  const y = (RE.gY != null ? RE.gY : 0) + (dc * dc - dt * dt) / 12742000 + (/Abu Dhabi|Palm|World|Marina/.test(p[0]) ? 700 : 320);
  if (window.JFVR) JFVR.fly = true; W3D.teleportTo(q2.x, y, zz, 0); if (window.JFVR) JFVR.fly = true;
  const lc = document.querySelector('[camera]') && document.querySelector('[camera]').components['look-controls']; if (lc && !sc.is('vr-mode')) { lc.pitchObject.rotation.x = -0.3; lc.yawObject.rotation.y = 0; }
  RE.placeI = i; toast(p[0]); return true; };
function placesUI() {
  const tools = document.querySelector('#ui .tools') || document.querySelector('#ui .grp') || document.getElementById('ui');
  if (tools && !document.getElementById('placesbtn')) { const b = document.createElement('button'); b.id = 'placesbtn'; b.textContent = 'Places';
    const box = document.createElement('div'); box.id = 'placesbox'; box.style.cssText = 'display:none;position:fixed;right:12px;bottom:70px;z-index:20;max-height:60vh;overflow:auto;background:rgba(20,24,30,.92);border-radius:10px;padding:6px;font:14px system-ui,sans-serif';
    document.body.appendChild(box);
    b.onclick = () => { if (box.style.display !== 'none') { box.style.display = 'none'; return; } box.innerHTML = '';
      RE.places().forEach((n, i) => { const e = document.createElement('div'); e.textContent = n; e.style.cssText = 'color:#fff;padding:7px 12px;cursor:pointer;border-radius:6px';
        e.onmouseenter = () => { e.style.background = '#2d6a8a'; }; e.onmouseleave = () => { e.style.background = ''; }; e.onclick = () => { box.style.display = 'none'; RE.goPlace(i); }; box.appendChild(e); });
      box.style.display = ''; };
    tools.appendChild(b); }
  const fly = document.querySelector('[fly-toggle]'); if (fly && !document.getElementById('placesvr')) {
    const p = document.createElement('a-plane'); p.id = 'placesvr'; p.className = 'btn'; p.setAttribute('position', '1.7 -1.5 0'); p.setAttribute('width', '0.8'); p.setAttribute('height', '0.26'); p.setAttribute('material', 'shader:flat;color:#ffe08a');
    const tx = document.createElement('a-text'); tx.setAttribute('align', 'center'); tx.setAttribute('color', '#111'); tx.setAttribute('width', '1.9'); tx.setAttribute('value', 'Next place'); p.appendChild(tx);
    p.addEventListener('click', () => { const n = placesHere().length; RE.goPlace(((RE.placeI == null ? -1 : RE.placeI) + 1) % n); }); fly.parentNode.appendChild(p); }
}


/* ---------- simple collision with Google buildings (outside the cutouts): low-frequency raycasts against the loaded tile meshes ----------
   ~8 Hz, below 400 m: a downward ray under you and 2 m ahead fills a 2 m height cache; walking treats a tile surface > 2.5 m above our
   ground and above your knees as a wall (via W3D.cityBlocked, which the world's walk collision already consults); flying, a forward ray
   along your motion stops you at a facade and a downward ray keeps you on top of a roof. */
const HC = new Map(), _rc = new THREE.Raycaster(), _o = new THREE.Vector3(), _d = new THREE.Vector3(), _pr = new THREE.Vector3(); let colT = 0, havePrev = false, maskPx = null;
function maskAt(x, z) { const c = RE.maskCanvas; if (!c) return 0; if (!maskPx) maskPx = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  const u = (x + MR) / (2 * MR), v = (z + MR) / (2 * MR); let m = 0; if (u > 0 && u < 1 && v > 0 && v < 1) m = maskPx[(Math.floor(v * c.height) * c.width + Math.floor(u * c.width)) * 4] / 255;
  for (const R of clipU.jfRect.value) if (R.z > 0 && Math.abs(x - R.x) < R.z && Math.abs(z - R.y) < R.z) m = 1; return m; }
const key = (x, z) => Math.round(x / 2) + ',' + Math.round(z / 2);
function topAt(x, z, now) { const T = RE.tiles; _rc.set(_o.set(x, 3000, z), _d.set(0, -1, 0)); _rc.far = 6000; const h = _rc.intersectObject(T.group, true)[0]; const y = h ? h.point.y : null;
  HC.set(key(x, z), {y, t: now}); if (HC.size > 4000) { const it = HC.keys(); for (let i = 0; i < 1000; i++) HC.delete(it.next().value); } return y; }
function tileBlocked(x, z, y) {
  if (!oursOn || !RE.tiles) return false; const c = HC.get(key(x, z)); if (!c || c.y === null) return false;
  const g = W3D.terrainH ? W3D.terrainH(x, z) : 0; return c.y > y + 0.6 && c.y - g > 2.5 && maskAt(x, z) < 0.5; }
RE.tileBlocked = tileBlocked; RE.setNight = n => { clipU.jfNi.value = n; };
(function hookCity() { let cb = W3D.cityBlocked || null; const comb = (x, z, y) => (cb && (!oursOn || KEEP3D[W3D.cities && W3D.cities.current && W3D.cities.current()] || maskAt(x, z) >= 0.5) ? cb(x, z, y) : false) || tileBlocked(x, z, y);   // hidden city blocks outside the kept square don't block
  try { Object.defineProperty(W3D, 'cityBlocked', {configurable: true, get: () => comb, set: v => { cb = v; }}); } catch (e) {} })();
function collide(t, sc) {
  if (t - colT < 120) return; colT = t; const T = RE.tiles; if (!T || !oursOn) return;
  const rig = document.getElementById('rig'); if (!rig) return; const P = rig.object3D.position; sc.camera.getWorldPosition(_c);
  const gnd = W3D.groundAt ? W3D.groundAt(_c.x, _c.z, -1e4) : 0; if (_c.y - gnd > 400 || maskAt(_c.x, _c.z) >= 0.5) { havePrev = false; return; }
  const yaw = rig.object3D.rotation.y, fx = -Math.sin(yaw), fz = -Math.cos(yaw);
  topAt(_c.x, _c.z, t); topAt(_c.x + fx * 2, _c.z + fz * 2, t);
  if (window.JFVR && JFVR.fly) {
    if (havePrev) { _d.subVectors(P, _pr); const L = _d.length();
      if (L > 0.05 && L < 200) { _d.normalize(); const eye = _c.y - P.y; _rc.set(_o.set(_pr.x, _pr.y + eye, _pr.z), _d); _rc.far = L + 1.5;
        const h = _rc.intersectObject(T.group, true)[0]; if (h && h.point.y - (W3D.terrainH ? W3D.terrainH(h.point.x, h.point.z) : 0) > 2.5) { P.copy(_pr); RE.bumps = (RE.bumps || 0) + 1; } } }
    const top = HC.get(key(_c.x, _c.z)); if (top && top.y !== null && _c.y < top.y + 1.6 && top.y - gnd > 2.5) P.y += top.y + 1.6 - _c.y;   // stand on the roof
    _pr.copy(P); havePrev = true;
  } else havePrev = false;
}

/* ---------- fallback ground: never empty space under you ----------
   A plain earth-coloured disc (radius ~ the view distance) that follows the camera a little below the lowest Google ground sampled
   around you, bent down with the Earth's curvature so it stays under far tiles. Wherever tiles haven't loaded yet (fast flight, high up,
   slow network) you see this ground fading into the haze instead of sky; where tiles are loaded they cover it. */
let FB = null, fbT = 0, fbI = 0, rootHid = false; const fbS = [];
function fallback(t, sc, show) {
  if (!FB) { const g = new THREE.CircleGeometry(1, 96, 0, Math.PI * 2), P = g.attributes.position;   // unit disc, rings added below
    const rings = [], N = 48; for (let i = 0; i <= N; i++) rings.push(Math.pow(i / N, 2.2));
    const pos = [], idx = []; const S = 48;
    for (let i = 0; i <= N; i++) for (let j = 0; j < S; j++) { const r = rings[i], a = j / S * Math.PI * 2; pos.push(Math.cos(a) * r, 0, Math.sin(a) * r); }
    for (let i = 0; i < N; i++) for (let j = 0; j < S; j++) { const a = i * S + j, b = i * S + (j + 1) % S, c = a + S, d = b + S; idx.push(a, c, b, b, c, d); }
    g.dispose(); const G = new THREE.BufferGeometry(); G.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); G.setIndex(idx);
    FB = new THREE.Mesh(G, new THREE.MeshBasicMaterial({color: 0x66705a, fog: true})); FB.name = 'realearth-fallback'; FB.frustumCulled = false; FB.renderOrder = -5;
    FB.userData.R = 0; sc.object3D.add(FB); RE.fallback = FB; }
  // one downward ray per ~110 ms around you (centre, 1.5 km, 4 km rings); keep the lowest of the last 9
  if (t - fbT > 110) { fbT = t; const k = fbI++ % 9, r = k === 0 ? 0 : k < 5 ? 1500 : 4000, a = k * 1.7;
    const T = RE.tiles; _rc.set(_o.set(_c.x + Math.cos(a) * r, _c.y + 3000, _c.z + Math.sin(a) * r), _d.set(0, -1, 0)); _rc.far = 20000;
    const h = _rc.intersectObject(T.group, true)[0]; fbS[k] = h ? h.point.y : null; if (k === 0 && h && (RE.gY == null || Math.abs(h.point.y - RE.gY) < 400 || fbS.filter(x => x != null && Math.abs(x - h.point.y) < 250).length > 2)) RE.gY = h.point.y; }
  const v = fbS.filter(x => x != null); if (!v.length) { const g0 = W3D.groundAt ? W3D.groundAt(_c.x, _c.z, -1e4) : 0; v.push(isFinite(g0) ? g0 : 0); }
  const sv = v.slice().sort((a, b) => a - b), med = sv[sv.length >> 1], lo = Math.min.apply(null, v.filter(x => Math.abs(x - med) < 250)), R = Math.max(30000, sc.camera.far * 0.95);
  if (Math.abs(FB.userData.R - R) > 1000) { FB.userData.R = R; const P = FB.geometry.attributes.position, n = P.count;   // curvature drop + a slope margin
    for (let i = 0; i < n; i++) { const x = P.getX(i), z = P.getZ(i), rr = Math.hypot(x, z) || 0, d = rr * R; P.setY(i, -(d * d / 12742000 + d * 0.012) / R); } P.needsUpdate = true; }
  FB.scale.set(R, R, R); FB.position.set(_c.x, lo - 12, _c.z); FB.visible = show;
  const city = W3D.cities && W3D.cities.current && W3D.cities.current(); FB.material.color.setHex(city === 'dubai' ? 0xb5a686 : city === 'bangkok' || city === 'hongkong' ? 0x5f6a55 : 0x66705a);
  if (clipU.jfNi.value > 0) FB.material.color.multiplyScalar(1 - 0.85 * clipU.jfNi.value);
}
// stylised cities have a themed (sunset / dusk) fog colour; over the real city use a neutral daylight haze while tiles show
let tinted = null;
function skyTint(sc, on) { const s3 = sc.object3D, f = s3.fog;
  if (on && f && !tinted) { tinted = {f, c: f.color.getHex(), b: s3.background && s3.background.isColor ? s3.background.getHex() : null}; f.color.setHex(0xc9d6e2); if (tinted.b != null) s3.background.setHex(0xc9d6e2); }
  else if (!on && tinted) { if (tinted.f === f) { f.color.setHex(tinted.c); if (tinted.b != null && s3.background && s3.background.isColor) s3.background.setHex(tinted.b); } tinted = null; } }

/* ---------- per frame ---------- */
const _c = new THREE.Vector3(); let calT = 0, calTries = 0, cutT = -1e9, cutsLive = [];
function hasNamed(sc, re) { let f = false; sc.object3D.traverse(o => { if (!f && o.name && re.test(o.name) && o.visible !== false) f = true; }); return f; }
AFRAME.registerSystem('w3d-realearth', {
  init: function () { const go = () => { addButtons(); placesUI(); if (RE.on) { start(); } };
    if (window.W3D_READY) go(); else window.addEventListener('w3d-ready', go), (function w() { if (window.W3D_READY) { if (!RE._go) { RE._go = 1; go(); } } else setTimeout(w, 500); })(); },
  tick: function (t, dt) {
    const T = RE.tiles, sc = this.el; if (!T || !sc.camera) return;
    const city = W3D.cities && W3D.cities.current && W3D.cities.current(), D = W3D.cities && W3D.cities.DEFS;
    if ((!clipU.jfMask.value || !RE.mask2 && t > 20000) && W3D.water) { if (clipU.jfMask.value) RE.mask2 = true; buildMask(); }
    if (REAL_CITY[city] && show0() && RE.everReady) { const cg = sc.object3D.getObjectByName('city-' + city); if (cg && !cg.userData.jfClip) { cg.userData.jfClip = 1; const off = [], bb = new THREE.Box3(), h = REAL_CITY[city] + 60, P = cg.position;
        cg.updateMatrixWorld(true); cg.traverse(o => { if (!o.isMesh || /saucer|fountain|beacon/i.test(o.name || '')) return;
          if (!o.geometry) return; if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); bb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
          if (KEEP3D[city] && o.geometry.boundingBox.max.y - o.geometry.boundingBox.min.y > 3) return;   // Google has no 3D there: keep our buildings / trees, swap only the flat ground
          [].concat(o.material).forEach(m => clipMat(m, 2)); if (o.isInstancedMesh) return;
          if (bb.max.x < P.x - h || bb.min.x > P.x + h || bb.max.z < P.z - h || bb.min.z > P.z + h) off.push(o); });   // wholly outside the kept square: don't draw at all
        cg.userData.jfOff = off; }
      const cg2 = sc.object3D.getObjectByName('city-' + city);
      if (cg2 && D && D[city]) { const far = Math.hypot(_c.x - D[city].x, _c.z - D[city].z) > (KEEP3D[city] ? 60000 : 4500); if (far && cg2.visible) { cg2.visible = false; cg2.userData.jfFarHid = true; } else if (!far && cg2.userData.jfFarHid) { cg2.visible = true; cg2.userData.jfFarHid = false; } } if (cg2 && cg2.userData.jfOff && cg2.userData.jfOffOn !== true) { cg2.userData.jfOffOn = true; cg2.userData.jfOff.forEach(o => { o.userData.jfVis = o.visible; o.visible = false; }); } }
    else if (city) { const cg = sc.object3D.getObjectByName('city-' + city); if (cg && cg.userData.jfFarHid) { cg.visible = true; cg.userData.jfFarHid = false; } if (cg && cg.userData.jfOffOn) { cg.userData.jfOffOn = false; cg.userData.jfOff.forEach(o => { o.visible = o.userData.jfVis !== false; }); } }
    const xr = sc.renderer.xr && sc.renderer.xr.isPresenting, cam = xr ? sc.renderer.xr.getCamera() : sc.camera;
    sc.camera.getWorldPosition(_c);
    let want = 'home', show = RE.on && !!W3D.active && !W3D.spaceView && !(W3D.arrival && W3D.arrival.active) && !W3D.launchFlight;
    const nearCity = D && Object.keys(D).find(k => Math.hypot(_c.x - D[k].x, _c.z - D[k].z) < 3500);
    const cityA = city && ANCH[city] ? city : nearCity && ANCH[nearCity] ? nearCity : null;
    if (cityA) {   // every saucer city sits on its real place: fly anywhere from it (anchor = the city within ~12 km, then a floating origin)
      const dc = Math.hypot(_c.x - D[cityA].x, _c.z - D[cityA].z); want = dc < (RE.anchor === cityA ? 13000 : 11000) ? cityA : 'free'; }
    else if (Math.hypot(_c.x, _c.z) > 30000 || RE.anchor === 'free' && RE.pin) want = 'free';
    if (RE.pin && !cityA && Math.hypot(_c.x, _c.z) < 30000) RE.pin = false;
    if (want !== 'free' && RE.anchor !== want) { setAnchor(want); calTries = 0; RE.calDone = null; }
    else if (want === 'free') { const A = RE.A, dA = Math.hypot(_c.x - A.x, _c.z - A.z);
      // re-base under the camera; the new tangent frame is lowered by the Earth's curvature drop at that distance so the ground doesn't jump
      if (RE.anchor !== 'free' || dA > 15000) { const g = geoOf(_c.x, _c.z); setAnchor('free', {lat: g.lat, lon: g.lon, x: _c.x, z: _c.z, yOff: A.yOff + (A.cal || 0) - dA * dA / 12742000, cal: 0}); } }
    // cutouts that follow the loaded city (slot 0) and hand-built places at real coordinates (slots 1-3)
    { const R = clipU.jfRect.value, rc = city && REAL_CITY[city] && D[city]; if (rc) R[0].set(D[city].x, D[city].z, REAL_CITY[city], 40); else R[0].set(0, 0, -1, 0);
      if (t - cutT > 3000) { cutT = t; cutsLive = CUTS.filter(c => !c.need || hasNamed(sc, c.need)); }
      let k = 1; for (const c of cutsLive) { if (k > 2) break; const q2 = RE.geoToLocal(c.lat, c.lon); if (q2 && Math.hypot(q2.x - _c.x, q2.z - _c.z) < 40000) R[k++].set(q2.x, q2.z, c.half, 30); }
      for (; k < 3; k++) R[k].set(0, 0, -1, 0); }   // slot 3 belongs to walker.js
    if (!RE.on && city && LITE && !RE._liteTip) { RE._liteTip = 1; toast('Real Earth is off on this phone to save memory - turn it on in the menu to see the whole city around you'); }
    // our classic ground stays until Google's first tiles around you have arrived (no pale empty world while the first load runs)
    if (!RE.everReady && T.visibleTiles && (T.visibleTiles.size > 25 && !T.stats.downloading && !T.stats.parsing || T.visibleTiles.size > 12 && t - (RE.t0 || (RE.t0 = t)) > 20000)) RE.everReady = true;
    if (!RE.t0) RE.t0 = t;
    const vis = show && !!RE.everReady;
    T.group.visible = vis; applyOursState(vis); if (!vis && FB) FB.visible = false;
    // far from home (past the cutout mask) the home world is entirely clipped away anyway: stop drawing it
    { const far = vis && !city && Math.hypot(_c.x, _c.z) > (rootHid ? 13000 : 14000), R0 = W3D.root;
      if (R0 && far !== rootHid) { if (far && R0.visible) { R0.visible = false; rootHid = true; } else if (!far) { if (rootHid && !city) R0.visible = true; rootHid = false; } } }
    skyTint(sc, show && cityA && ANCH[cityA].flat);
    if (show) {
      T.setCamera(cam); T.setResolutionFromRenderer(cam, sc.renderer); cam.updateMatrixWorld(); T.update();
      fallback(t, sc, show);
      const gnd0 = W3D.groundAt ? W3D.groundAt(_c.x, _c.z, -1e4) : 0, gnd = RE.gY != null && (RE.anchor !== 'home' || !isFinite(gnd0)) ? RE.gY : gnd0, alt = Math.max(0, _c.y - (isFinite(gnd) ? gnd : 0));
      const f = sc.object3D.fog; if (f && f.far !== undefined) { f.near = Math.max(f.near, (LITE ? 6000 : 14000) + alt * 4); f.far = Math.max(f.far, (LITE ? 20000 : 45000) + alt * 16); }
      const cf = Math.min(4e6, Math.max(60000, 60000 + alt * 40)); if (Math.abs(sc.camera.far - cf) > 2000) { sc.camera.far = cf; sc.camera.updateProjectionMatrix(); }
      const gg = sc.object3D.getObjectByName('globalGround'); if (gg) gg.visible = false;
      collide(t, sc);
      if (!RE.calDone && RE.anchor !== 'free' && t - calT > 4000 && calTries < 8 && T.visibleTiles && T.visibleTiles.size > 20) { calT = t; calTries++; calibrate(); }
    }
    if (t - attrT > 1500 || !show) { attrT = t; attribution(show); }
  }
});
function show0() { return RE.on && !!RE.tiles; }
let oursOn = false; function applyOursState(v) { if (v !== oursOn) { oursOn = v; applyOurs(v); } }
function stats() { const T = RE.tiles; return T ? {anchor: RE.anchor, visible: T.group.visible, tiles: T.visibleTiles ? T.visibleTiles.size : null, downloading: T.stats && T.stats.downloading, parsing: T.stats && T.stats.parsing,
  bytes: T.lruCache && T.lruCache.cachedBytes, cal: RE.A && RE.A.cal, roots: dayCount(), failed: RE.failed || null} : {failed: RE.failed || 'not started', roots: dayCount()}; }
})();
