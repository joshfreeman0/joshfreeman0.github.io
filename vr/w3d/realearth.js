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
  london: {lat: 51.575359, lon: 0.111801, x: 60000, z: 60000, yOff: -(45.4 + 20.75)},
  dubai: {lat: 25.19515, lon: 55.27315, x: 160000, z: 60000, yOff: -(-33.5 + 6)}                // geoid ~ -33.5 m, pad ~6 m             // geoid ~ +45.4 m, pad at 20.75 m
};
const CAP = 32, LS = 'jfvr.gtiles', LSR = 'jfvr.gtiles.root', PREF = 'jfvr.realEarth';
const q = location.search, forced = /[?&]realearth=1/.test(q) ? true : /[?&]realearth=0/.test(q) ? false : null;
function pref() { if (forced !== null) return forced; const v = localStorage.getItem(PREF); return v ? v === 'on' : !LITE; }
const RE = W3D.realEarth = {on: pref(), ready: false, tiles: null, anchor: 'home', count: dayCount, setOn, toggle: () => setOn(!RE.on), stats: () => stats()};

function today() { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
function dayLog() { let o = null; try { o = JSON.parse(localStorage.getItem(LS) || 'null'); } catch (e) {} if (!o || o.day !== today()) o = {day: today(), n: 0, log: []}; return o; }
function dayCount() { return dayLog().n; }
function bump() { const o = dayLog(); o.n++; o.log.push(new Date().toTimeString().slice(0, 8)); localStorage.setItem(LS, JSON.stringify(o)); return o.n; }

/* ---------- cutout mask (local frame, +-12288 m) ---------- */
const MR = 12288, MN = LITE ? 1024 : 2048;
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
  // every named hand-built site group in the world root (its bounding box + margin)
  const SITE = /bank|temple|vesta|sphinx|pyramid|office|showcase|zoo|lift|footbridge|weir|bridge-|kings|beach|shore|saucer|bridgewater|launch|campus|pad/i, bx = new THREE.Box3();
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
      'float jfD() { return fract(52.9829189 * fract(dot(floor(gl_FragCoord.xy), vec2(0.06711056, 0.00583715)))); }\n' +
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
  T.errorTarget = LITE ? 80 : QUEST ? 48 : 32;
  const C = T.lruCache, MB = 1048576; if (C) { C.maxBytesSize = (LITE ? 120 : QUEST ? 300 : 500) * MB; C.minBytesSize = C.maxBytesSize * 0.7; C.maxSize = LITE ? 1500 : 4000; C.minSize = C.maxSize * 0.75; }
  T.addEventListener('load-model', ({scene}) => { scene.traverse(o => { if (o.isMesh) { [].concat(o.material).forEach(m => { m.fog = true; clipMat(m, 1); }); o.receiveShadow = o.castShadow = false; } }); });
  T.addEventListener('load-tile-set', () => { RE.ready = true; });
  T.group.name = 'realearth'; T.group.matrixAutoUpdate = false;
  RE.tiles = T; const sc = document.querySelector('a-scene'); sc.object3D.add(T.group); setAnchor('home');
}
/* ECEF -> our local frame for anchor A: local = T(A.x, yOff, A.z) * P * ENU(lat, lon)^-1 */
const _m = new THREE.Matrix4(), _p = new THREE.Matrix4().set(1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1);
function kxy(lat) { const p = lat * D2R; return {kx: 111412.84 * Math.cos(p) - 93.5 * Math.cos(3 * p), ky: 111132.954 - 559.822 * Math.cos(2 * p) + 1.175 * Math.cos(4 * p)}; }
const REAL_CITY = {london: 480, dubai: 1650};   // hand-built square half-size kept over the Google tiles
function setAnchor(name, A) {
  A = A || ANCH[name]; if (!A.kx) Object.assign(A, kxy(A.lat)); RE.anchor = name; RE.A = A; const T = RE.tiles; if (!T) return;
  const cal = +localStorage.getItem('jfvr.gtiles.cal.' + name) || 0; A.cal = A.cal != null ? A.cal : cal;
  window.JF3DTiles.WGS84_ELLIPSOID.getEastNorthUpFrame(A.lat * D2R, A.lon * D2R, _m); _m.invert();
  const M = new THREE.Matrix4().makeTranslation(A.x, A.yOff + (A.cal || 0), A.z).multiply(_p).multiply(_m);
  T.group.matrix.copy(M); T.group.matrixWorldNeedsUpdate = true; T.group.updateMatrixWorld(true);
  const RC = REAL_CITY[name]; clipU.jfRect.value[0].set(A.x, A.z, RC ? RC : -1, 40);
}
function geoOf(x, z) { const A = RE.A; return {lat: A.lat - (z - A.z) / A.ky, lon: A.lon + (x - A.x) / A.kx}; }
RE.geoOf = geoOf;
RE.goGeo = (lat, lon, alt) => { // test / future menu hook: jump to any place on Earth (free anchor at a spot 200 km out so home stays clean)
  const x = 200000, z = -200000; setAnchor('free', {lat, lon, x, z, yOff: 0}); W3D.teleportTo(x, alt, z, 0); RE.pin = true; };

/* ---------- calibration: match the Google ground to ours near the anchor (25th percentile of tile - ours, outside cutouts) ---------- */
function calibrate() {
  const T = RE.tiles; if (!T || RE.anchor === 'free') return false; const A = RE.A, rc = new THREE.Raycaster(), d = [];
  const hf = RE.anchor === 'home' ? (x, z) => W3D.terrainH(x, z) : (x, z) => W3D.groundAt(x, z, 999);
  const pts = RE.anchor === 'home' ? [[1500, 0], [-1500, 1300], [0, 1700], [-600, -1500], [1600, 1400], [2600, -900], [-2600, 1800], [3000, 2600], [-3200, -2400], [200, -3000], [-1800, 2600], [2200, 2900]]
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
  if (!attrEl) { attrEl = document.createElement('div'); attrEl.id = 'gattr';
    attrEl.style.cssText = 'position:fixed;left:8px;top:8px;z-index:12;font:11px system-ui,sans-serif;color:#fff;background:rgba(0,0,0,.45);padding:3px 7px;border-radius:6px;pointer-events:none;max-width:60vw';
    document.body.appendChild(attrEl); }
  attrEl.style.display = show ? '' : 'none'; if (!show) { if (vrAttr) vrAttr.visible = false; return; }
  const a = RE.tiles ? RE.tiles.getAttributions([]).filter(x => x.type === 'string').map(x => x.value).join('; ') : '';
  const txt = 'Google' + (a ? ' \u00b7 ' + a : ''); if (attrEl.textContent !== txt) attrEl.textContent = txt;
  const sc = document.querySelector('a-scene'), xr = sc && sc.is('vr-mode');
  if (xr) { if (!vrAttr) { const c = document.createElement('canvas'); c.width = 1024; c.height = 64; const t = new THREE.CanvasTexture(c);
      vrAttr = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.031), new THREE.MeshBasicMaterial({map: t, transparent: true, depthTest: false}));
      vrAttr.renderOrder = 3000; vrAttr.position.set(0, -0.3, -0.8); vrAttr.userData.c = c; sc.camera.el.object3D.add(vrAttr); }
    if (vrAttr.userData.txt !== txt) { const c = vrAttr.userData.c, g = c.getContext('2d'); g.clearRect(0, 0, 1024, 64); g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(0, 0, 1024, 64);
      g.fillStyle = '#fff'; g.font = '30px sans-serif'; g.fillText(txt.slice(0, 80), 12, 42); vrAttr.material.map.needsUpdate = true; vrAttr.userData.txt = txt; }
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


/* ---------- simple collision with Google buildings (outside the cutouts): low-frequency raycasts against the loaded tile meshes ----------
   ~8 Hz, below 400 m: a downward ray under you and 2 m ahead fills a 2 m height cache; walking treats a tile surface > 2.5 m above our
   ground and above your knees as a wall (via W3D.cityBlocked, which the world's walk collision already consults); flying, a forward ray
   along your motion stops you at a facade and a downward ray keeps you on top of a roof. */
const HC = new Map(), _rc = new THREE.Raycaster(), _o = new THREE.Vector3(), _d = new THREE.Vector3(), _pr = new THREE.Vector3(); let colT = 0, havePrev = false, maskPx = null;
function maskAt(x, z) { const c = RE.maskCanvas; if (!c) return 0; if (!maskPx) maskPx = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  const u = (x + MR) / (2 * MR), v = (z + MR) / (2 * MR); let m = 0; if (u > 0 && u < 1 && v > 0 && v < 1) m = maskPx[(Math.floor(v * c.height) * c.width + Math.floor(u * c.width)) * 4] / 255;
  const R = clipU.jfRect.value[0]; if (R.z > 0 && Math.abs(x - R.x) < R.z && Math.abs(z - R.y) < R.z) m = 1; return m; }
const key = (x, z) => Math.round(x / 2) + ',' + Math.round(z / 2);
function topAt(x, z, now) { const T = RE.tiles; _rc.set(_o.set(x, 3000, z), _d.set(0, -1, 0)); _rc.far = 6000; const h = _rc.intersectObject(T.group, true)[0]; const y = h ? h.point.y : null;
  HC.set(key(x, z), {y, t: now}); if (HC.size > 4000) { const it = HC.keys(); for (let i = 0; i < 1000; i++) HC.delete(it.next().value); } return y; }
function tileBlocked(x, z, y) {
  if (!oursOn || !RE.tiles) return false; const c = HC.get(key(x, z)); if (!c || c.y === null) return false;
  const g = W3D.terrainH ? W3D.terrainH(x, z) : 0; return c.y > y + 0.6 && c.y - g > 2.5 && maskAt(x, z) < 0.5; }
RE.tileBlocked = tileBlocked; RE.setNight = n => { clipU.jfNi.value = n; };
(function hookCity() { let cb = W3D.cityBlocked || null; const comb = (x, z, y) => (cb ? cb(x, z, y) : false) || tileBlocked(x, z, y);
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

/* ---------- per frame ---------- */
const _c = new THREE.Vector3(); let calT = 0, calTries = 0;
AFRAME.registerSystem('w3d-realearth', {
  init: function () { const go = () => { addButtons(); if (RE.on) { start(); } };
    if (window.W3D_READY) go(); else window.addEventListener('w3d-ready', go), (function w() { if (window.W3D_READY) { if (!RE._go) { RE._go = 1; go(); } } else setTimeout(w, 500); })(); },
  tick: function (t, dt) {
    const T = RE.tiles, sc = this.el; if (!T || !sc.camera) return;
    const city = W3D.cities && W3D.cities.current && W3D.cities.current(), D = W3D.cities && W3D.cities.DEFS;
    if ((!clipU.jfMask.value || !RE.mask2 && t > 20000) && W3D.water) { if (clipU.jfMask.value) RE.mask2 = true; buildMask(); }
    if (REAL_CITY[city] && show0()) { const cg = sc.object3D.getObjectByName('city-' + city); if (cg && !cg.userData.jfClip) { cg.userData.jfClip = 1; cg.traverse(o => { if (o.isMesh && !/saucer/i.test(o.name || '')) [].concat(o.material).forEach(m => clipMat(m, 2)); }); } }
    const xr = sc.renderer.xr && sc.renderer.xr.isPresenting, cam = xr ? sc.renderer.xr.getCamera() : sc.camera;
    sc.camera.getWorldPosition(_c);
    let want = 'home', show = RE.on && !!W3D.active && !W3D.spaceView && !(W3D.arrival && W3D.arrival.active) && !W3D.launchFlight;
    const nearCity = D && Object.keys(D).find(k => Math.hypot(_c.x - D[k].x, _c.z - D[k].z) < 3500);
    if (REAL_CITY[city] || REAL_CITY[nearCity]) want = REAL_CITY[city] ? city : nearCity;
    else if (nearCity || city) show = false;                                      // stylised cities have no real place under them
    else if (Math.hypot(_c.x, _c.z) > 30000 || RE.anchor === 'free' && RE.pin) want = 'free';
    if (RE.pin && Math.hypot(_c.x, _c.z) < 30000) RE.pin = false;
    if (want !== 'free' && RE.anchor !== want) { setAnchor(want); calTries = 0; RE.calDone = null; }
    else if (want === 'free') { const A = RE.A; if (RE.anchor !== 'free') { const g = geoOf(_c.x, _c.z); setAnchor('free', {lat: g.lat, lon: g.lon, x: _c.x, z: _c.z, yOff: A.yOff}); }
      else if (Math.hypot(_c.x - A.x, _c.z - A.z) > 15000) { const g = geoOf(_c.x, _c.z); setAnchor('free', {lat: g.lat, lon: g.lon, x: _c.x, z: _c.z, yOff: A.yOff}); } }
    T.group.visible = show; applyOursState(show);
    if (show) {
      T.setCamera(cam); T.setResolutionFromRenderer(cam, sc.renderer); cam.updateMatrixWorld(); T.update();
      const gnd = W3D.groundAt ? W3D.groundAt(_c.x, _c.z, -1e4) : 0, alt = Math.max(0, _c.y - (isFinite(gnd) ? gnd : 0));
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
