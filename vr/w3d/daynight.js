/* Automatic day / night for Fowling Pond (runtime layer only; the day look is untouched: at night factor 0 every value is put back exactly).
   - Timing: real sunrise / sunset at Raynham, MA (41.948 N, 71.073 W), NOAA sunrise equation, no API. Night fades in from sunset to
     sunset + 20 min and day fades back in from sunrise - 20 min to sunrise. Rechecked every minute against the viewer's own clock.
   - Overrides: ?night=1 / ?day=1 (testing, this visit only) and a menu choice Sky: Auto / Day / Night saved in this browser
     (localStorage 'jfvr_sky'); never sent to the room.
   - Night: dark sky dome with stars, green / violet aurora curtains, a moon with its real phase and position (SunCalc ephemeris, ?moondate=YYYY-MM-DD&moonhour=H to preview; moonlight and ambient scale with illumination), cool moonlight, darker fog and ambient light, existing lamps
     brighter with soft glows (bank, pavilion, temple lamps, Vesta fire, shore lanterns).
   - Night sounds (WebAudio, synthesised, no files): crickets, frogs near the ponds, an occasional owl or loon. Start on the first tap /
     click / key / controller press; menu "Night sounds: On/Off" (localStorage 'jfvr_nsnd').
   - Lite / Quest: fewer stars and a simpler aurora. */
(function () {
  const LAT = 41.948, LON = -71.073, BLEND = 20 * 60e3;
  const QS = new URLSearchParams(location.search), FORCE = QS.get('night') === '1' ? 'night' : QS.get('day') === '1' ? 'day' : null;
  const LOW = !!(window.JFVR_LITE || /lite=1/.test(location.search) || /OculusBrowser|Quest|Mobile|Android|iPhone|iPad/i.test(navigator.userAgent));
  const ls = (k, d) => { try { return localStorage.getItem(k) || d; } catch (e) { return d; } }, lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
  let mode = FORCE || ls('jfvr_sky', 'auto'); if (!/^(auto|day|night)$/.test(mode)) mode = 'auto';
  let soundOn = ls('jfvr_nsnd', '1') === '1';

  // ---------- sun ----------
  function sunEvent(dayUTC, rise) {
    const R = Math.PI / 180, d = new Date(dayUTC), y0 = Date.UTC(d.getUTCFullYear(), 0, 0), N = Math.floor((dayUTC - y0) / 864e5);
    const lh = LON / 15, t = N + ((rise ? 6 : 18) - lh) / 24, M = 0.9856 * t - 3.289;
    const L = (M + 1.916 * Math.sin(M * R) + 0.020 * Math.sin(2 * M * R) + 282.634 + 720) % 360;
    let RA = (Math.atan(0.91764 * Math.tan(L * R)) / R + 720) % 360; RA += Math.floor(L / 90) * 90 - Math.floor(RA / 90) * 90; RA /= 15;
    const sd = 0.39782 * Math.sin(L * R), cd = Math.cos(Math.asin(sd)), ch = (Math.cos(90.833 * R) - sd * Math.sin(LAT * R)) / (cd * Math.cos(LAT * R));
    if (ch > 1 || ch < -1) return null;
    const H = (rise ? 360 - Math.acos(ch) / R : Math.acos(ch) / R) / 15, T = H + RA - 0.06571 * t - 6.622, UT = ((T - lh) % 24 + 24) % 24;
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) + UT * 3600e3;
  }
  function events(now) { const ev = []; for (let k = -2; k <= 2; k++) { const day = now + k * 864e5; for (const r of [1, 0]) { const t = sunEvent(day, r); if (t) ev.push([t, r]); } } return ev.sort((a, b) => a[0] - b[0]); }
  const sm = x => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
  function autoNight(now) {
    const ev = events(now); let last = null, next = null;
    for (const e of ev) { if (e[0] <= now) last = e; else if (!next) next = e; }
    let n = last && last[1] === 0 ? sm((now - last[0]) / BLEND) : 0;                    // after sunset: fade in over 20 min
    if (next && next[1] === 1 && now > next[0] - BLEND) n = Math.min(n, 1 - sm((now - (next[0] - BLEND)) / BLEND));   // day back over the 20 min before sunrise
    return n;
  }
  function target() { return mode === 'night' ? 1 : mode === 'day' ? 0 : autoNight(Date.now()); }
  const today = () => { const n = Date.now(), ev = events(n).filter(e => new Date(e[0]).toDateString() === new Date(n).toDateString()); return ev.map(e => (e[1] ? 'sunrise ' : 'sunset ') + new Date(e[0]).toLocaleTimeString()); };


  // ---------- moon ephemeris: SunCalc (c) 2011-2015 Vladimir Agafonkin, BSD-2-Clause, https://github.com/mourner/suncalc (Meeus-style low-precision sun and moon) ----------
  const RD = Math.PI / 180, EPS = RD * 23.4397, J1970 = 2440588, J2000 = 2451545;
  const toDays = ms => ms / 864e5 - 0.5 + J1970 - J2000;
  const ra_ = (l, b) => Math.atan2(Math.sin(l) * Math.cos(EPS) - Math.tan(b) * Math.sin(EPS), Math.cos(l)), dec_ = (l, b) => Math.asin(Math.sin(b) * Math.cos(EPS) + Math.cos(b) * Math.sin(EPS) * Math.sin(l));
  function sunCoords(d) { const M = RD * (357.5291 + 0.98560028 * d), C = RD * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M)), L = M + C + RD * 102.9372 + Math.PI; return {dec: dec_(L, 0), ra: ra_(L, 0)}; }
  function moonCoords(d) { const L = RD * (218.316 + 13.176396 * d), M = RD * (134.963 + 13.064993 * d), F = RD * (93.272 + 13.229350 * d), l = L + RD * 6.289 * Math.sin(M), b = RD * 5.128 * Math.sin(F);
    return {ra: ra_(l, b), dec: dec_(l, b), dist: 385001 - 20905 * Math.cos(M)}; }
  function moonIllum(ms) { const d = toDays(ms), s = sunCoords(d), m = moonCoords(d), sd = 149598000;
    const phi = Math.acos(Math.sin(s.dec) * Math.sin(m.dec) + Math.cos(s.dec) * Math.cos(m.dec) * Math.cos(s.ra - m.ra)), inc = Math.atan2(sd * Math.sin(phi), m.dist - sd * Math.cos(phi));
    const ang = Math.atan2(Math.cos(s.dec) * Math.sin(s.ra - m.ra), Math.sin(s.dec) * Math.cos(m.dec) - Math.cos(s.dec) * Math.sin(m.dec) * Math.cos(s.ra - m.ra));
    return {fraction: (1 + Math.cos(inc)) / 2, phase: 0.5 + 0.5 * inc * (ang < 0 ? -1 : 1) / Math.PI, inc}; }   // phase 0 new, .25 first quarter, .5 full, .75 last quarter
  // sky direction in the scene frame (x east, y up, -z north) of body c at time d (days since J2000)
  function skyDir(c, d, out) { const H = RD * (280.16 + 360.9856235 * d) + LON * RD - c.ra, ph = LAT * RD, alt = Math.asin(Math.sin(ph) * Math.sin(c.dec) + Math.cos(ph) * Math.cos(c.dec) * Math.cos(H)),
      az = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(ph) - Math.tan(c.dec) * Math.cos(ph)), ca = Math.cos(alt);
    out.set(-Math.sin(az) * ca, Math.sin(alt), Math.cos(az) * ca); return alt; }
  // ?moondate=YYYY-MM-DD[&moonhour=H] previews any date (hour = Raynham local time, default 22); the clock then runs on from there
  function easternOffsetH(y, mo, dd) { const nth = (n) => { const f = new Date(Date.UTC(y, mo, 1)).getUTCDay(); return 1 + (7 - f) % 7 + 7 * (n - 1); };
    const dstS = Date.UTC(y, 2, nth(2), 7), dstE = Date.UTC(y, 10, nth(1), 6), t = Date.UTC(y, mo, dd, 12); return t >= dstS && t < dstE ? -4 : -5; }
  const MD = QS.get('moondate'); let moonBase = null;
  if (MD && /^\d{4}-\d{2}-\d{2}$/.test(MD)) { const [y, mo, dd] = MD.split('-').map(Number), hr = parseFloat(QS.get('moonhour') || '22');
    moonBase = Date.UTC(y, mo - 1, dd, 0) + (hr - easternOffsetH(y, mo - 1, dd)) * 3600e3; }
  const t0 = Date.now(), moonNow = () => moonBase === null ? Date.now() : moonBase + (Date.now() - t0);
  const MS = {fraction: 1, phase: 0.5, alt: 0, time: 0}, _s = new THREE.Vector3(), _m = new THREE.Vector3(), _r = new THREE.Vector3(), _u = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
  function moonUpdate() {
    const ms = moonNow(), d = toDays(ms), il = moonIllum(ms); MS.fraction = il.fraction; MS.phase = il.phase; MS.time = ms;
    MS.alt = skyDir(moonCoords(d), d, _m) / RD; skyDir(sunCoords(d), d, _s); U.moon.value.copy(_m);
    _r.crossVectors(_m, UP); if (_r.lengthSq() < 1e-6) _r.set(1, 0, 0); _r.normalize(); _u.crossVectors(_r, _m).normalize(); U.mR.value.copy(_r); U.mU.value.copy(_u);
    const sx = _s.dot(_r), sy = _s.dot(_u), l = Math.hypot(sx, sy) || 1, sinI = Math.sin(il.inc), cosI = Math.cos(il.inc);   // inc = phase angle: 0 full, PI new
    U.mS.value.set(sinI * sx / l, sinI * sy / l, cosI);
    const k = il.fraction; U.mK.value = 0.06 + 0.94 * k; U.mE.value = 0.05 + 0.1 * (1 - k);
    MS.sunLvl = 0.07 + 0.13 * k; MS.hemiLvl = 0.17 + 0.13 * k;   // night light multipliers: full = the old 0.2 / 0.3, new moon keeps a playable minimum
  }
  MS.sunLvl = 0.2; MS.hemiLvl = 0.3;

  // ---------- night sky ----------
  const skyFS = `
    uniform float uN, uT, mK, mE; uniform vec3 moon, mR, mU, mS; varying vec3 vd;
    float h21(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
    float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
      return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }
    void main(){
      vec3 d = normalize(vd); float h = clamp(d.y, 0.0, 1.0);
      vec3 c = mix(vec3(0.060,0.080,0.130), vec3(0.008,0.014,0.040), pow(h, 0.45));
      if (d.y < 0.0) c = mix(vec3(0.060,0.080,0.130), vec3(0.030,0.040,0.050), clamp(-d.y*3.0, 0.0, 1.0));
      // stars
      vec2 uv = vec2(atan(d.z, d.x), asin(clamp(d.y,-1.0,1.0))) * STARSCALE; vec2 ci = floor(uv), cf = fract(uv) - 0.5;
      float r = h21(ci); if (r > STARCUT) { vec2 o = (vec2(h21(ci+7.1), h21(ci+3.7)) - 0.5) * 0.6; float s = 1.0 - smoothstep(0.0, 0.11 + 0.08*fract(r*91.0), length(cf - o));
        float tw = 0.75 + 0.25*sin(uT*(1.0 + 3.0*fract(r*37.0)) + r*80.0); c += vec3(0.85,0.9,1.0) * s * tw * smoothstep(0.02, 0.18, d.y) * (0.5 + 0.9*fract(r*13.0)); }
      // aurora: curtains over the northern sky (-z is north)
      if (d.y > 0.02) { vec3 a = vec3(0.0); float north = smoothstep(-0.25, 0.55, -d.z);
        for (int i = 0; i < ALAYERS; i++) { float fi = float(i), ht = 1.0 + fi * 0.09; vec2 p = d.xz / (d.y + 0.08) * ht;
          float w = vn(vec2(p.x*0.9 + uT*0.03, fi*1.7)) * 1.6 + uT*0.015;
          float band = vn(vec2(p.x*0.6 + w, p.y*0.35 - uT*0.02)); float k = 1.0 - abs(band - 0.5) * 2.0; k = pow(k, 6.0);
          float streak = 0.55 + 0.45 * vn(vec2(p.x*7.0 + uT*0.2, fi));
          vec3 col = mix(vec3(0.15,1.0,0.45), vec3(0.62,0.25,0.95), fi / float(ALAYERS)); a += col * k * streak * (1.0 - fi/float(ALAYERS+1)); }
        c += a * north * smoothstep(0.02, 0.25, d.y) * (1.0 - smoothstep(0.75, 1.0, d.y)) * AGAIN; }
      // moon: real phase. Disc coords q in the moon's own right/up frame; mS = sun direction in that frame (z toward viewer), so the lit side faces the real sun
      float mm = dot(d, moon); float hz = smoothstep(-0.04, 0.0, d.y);
      if (mm > 0.9) { vec2 q = vec2(dot(d, mR), dot(d, mU)) / 0.028; float rr = length(q);
        if (rr < 1.05) { vec3 nn = vec3(q, sqrt(max(0.0, 1.0 - rr*rr))); float lit = smoothstep(-0.05, 0.07, dot(nn, mS));
          float mar = vn(q*2.6 + 11.0)*0.55 + vn(q*7.0 + 3.0)*0.3; vec3 sf = vec3(0.93,0.93,0.86) * (0.62 + 0.38*(1.0 - mar)) * (0.78 + 0.22*nn.z);
          vec3 mc = sf * lit * (0.35 + 0.65*mK) + vec3(0.55,0.66,0.9) * sf * (1.0 - lit) * mE;
          c = mix(c, mc, (1.0 - smoothstep(0.93, 1.0, rr)) * hz); } }
      c += (vec3(0.55,0.6,0.75) * pow(max(mm, 0.0), 300.0) * 0.35 + vec3(0.2,0.24,0.35) * pow(max(mm,0.0), 12.0) * 0.08) * mK * hz;
      gl_FragColor = vec4(c, uN);
    }`;
  const MOON = new THREE.Vector3(0.32, 0.5, -0.8).normalize();     // start value only; moonUpdate() puts it at the real position
  let built = false, dome, glow, hemi, sun, D = {}, pls = [], envMats = null, cur = -1, want = 0, lastCalc = -1e9, lastMoon = -1e9, lastEnv = 0;
  const U = {uN: {value: 0}, uT: {value: 0}, mK: {value: 1}, mE: {value: 0.08}, moon: {value: MOON}, mR: {value: new THREE.Vector3(1, 0, 0)}, mU: {value: new THREE.Vector3(0, 1, 0)}, mS: {value: new THREE.Vector3(0, 0, 1)}};
  function glowTex() { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,220,160,1)'); gr.addColorStop(0.25, 'rgba(255,200,130,0.45)'); gr.addColorStop(1, 'rgba(255,180,100,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
  function build(sceneEl) {
    built = true; const root = W3D.root;
    const mat = new THREE.ShaderMaterial({uniforms: U, depthWrite: false, depthTest: false, fog: false, side: THREE.BackSide, transparent: false,
      blending: THREE.CustomBlending, blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
      defines: {STARSCALE: LOW ? '110.0' : '170.0', STARCUT: LOW ? '0.93' : '0.90', ALAYERS: LOW ? 3 : 6, AGAIN: LOW ? '0.85' : '0.6'},
      vertexShader: 'varying vec3 vd; void main(){ vd = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }', fragmentShader: skyFS});
    dome = new THREE.Mesh(new THREE.SphereGeometry(6900, 48, 24), mat); dome.renderOrder = -9; dome.frustumCulled = false; dome.visible = false; dome.name = 'night-sky'; root.add(dome);
    root.children.forEach(o => { if (o.isHemisphereLight && !hemi) hemi = o; if (o.isDirectionalLight && o.castShadow && !sun) sun = o; });
    if (hemi) D.hemi = {c: hemi.color.clone(), g: hemi.groundColor.clone()};
    if (sun) D.sun = {c: sun.color.clone()};
    D.fog = W3D.fog ? W3D.fog.color.clone() : null; D.bg = W3D.bg ? W3D.bg.clone() : null;
    const r = sceneEl.renderer; D.clear = r.getClearColor(new THREE.Color()).clone(); D.clearA = r.getClearAlpha();
    // lamps that already exist: brighter at night, with a soft glow sprite
    const pts = [], v = new THREE.Vector3(), m4 = new THREE.Matrix4();
    root.traverse(o => { if (o.isPointLight) { pls.push({l: o}); o.getWorldPosition(v); pts.push(v.x, v.y, v.z); }
      if (o.isInstancedMesh && /lantern/i.test(o.name || '') && o.material && o.material.isMeshBasicMaterial) { o.updateMatrixWorld(true);
        for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m4); v.setFromMatrixPosition(m4).applyMatrix4(o.matrixWorld); pts.push(v.x, v.y + 0.05, v.z); } } });
    if (pts.length) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      glow = new THREE.Points(g, new THREE.PointsMaterial({size: 2.2, map: glowTex(), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, sizeAttenuation: true}));
      glow.visible = false; glow.name = 'night-glows'; glow.frustumCulled = false; root.add(glow); }
    W3D.night = api;
  }
  function collectEnv() { envMats = []; const seen = new Set();
    W3D.root.traverse(o => { for (const m of o.material ? [].concat(o.material) : []) { if (!m || seen.has(m) || !m.envMap) continue; seen.add(m); envMats.push({m, base: m.envMapIntensity, set: null}); } }); }
  const lerpC = (dst, a, b, t) => dst.copy(a).lerp(b, t);
  const NC = {hemiS: new THREE.Color(0x56688f), hemiG: new THREE.Color(0x0c1010), sun: new THREE.Color(0x9fb6ff), fog: new THREE.Color(0x0f1421)};
  const own = (o, key, val, k) => { // multiply a value someone else may also set (realism.js sets hemi intensity per area): re-base when it changed under us
    if (o['_dn' + key] === undefined || o[key] !== o['_dnSet' + key]) o['_dn' + key] = o[key];
    o[key] = o['_dnSet' + key] = o['_dn' + key] * k; };
  function apply(n, sceneEl) {
    const day = n <= 0.0005; dome.visible = !day; U.uN.value = n;
    if (W3D.sky) W3D.sky.visible = n < 0.999;
    if (hemi) { own(hemi, 'intensity', 0, 1 - (1 - MS.hemiLvl) * n); lerpC(hemi.color, D.hemi.c, NC.hemiS, n); lerpC(hemi.groundColor, D.hemi.g, NC.hemiG, n); }
    if (sun) { own(sun, 'intensity', 0, 1 - (1 - MS.sunLvl) * n); lerpC(sun.color, D.sun.c, NC.sun, n); }
    if (D.fog && W3D.fog) lerpC(W3D.fog.color, D.fog, NC.fog, n);
    if (D.bg && W3D.bg) lerpC(W3D.bg, D.bg, NC.fog, n);
    const r = sceneEl.renderer; if (r && !(W3D.cities && W3D.cities.current && W3D.cities.current())) r.setClearColor(new THREE.Color().copy(D.clear).lerp(NC.fog, n), D.clearA);
    for (const p of pls) own(p.l, 'intensity', 0, 1 + 1.4 * n);
    if (glow) { glow.visible = !day; glow.material.opacity = 0.9 * n; }
    if (W3D.waterU && W3D.waterU.wNi) W3D.waterU.wNi.value = n;
    if (W3D.realEarth && W3D.realEarth.setNight) W3D.realEarth.setNight(n);   // Google tiles darken too
    if (!envMats) collectEnv();
    for (const e of envMats) own(e.m, 'envMapIntensity', 0, 1 - 0.85 * n);
    if (day) { // exact day values back (no float drift)
      if (hemi) { hemi.color.copy(D.hemi.c); hemi.groundColor.copy(D.hemi.g); } if (sun) sun.color.copy(D.sun.c);
      if (D.fog && W3D.fog) W3D.fog.color.copy(D.fog); if (D.bg && W3D.bg) W3D.bg.copy(D.bg); }
    if (sceneEl.renderer && sceneEl.renderer.shadowMap) sceneEl.renderer.shadowMap.needsUpdate = true;
  }

  // ---------- sounds ----------
  let ac = null, master = null, frogG = null, nextCall = 0;
  function loopBuf(sec, fill) { const sr = ac.sampleRate, b = ac.createBuffer(2, Math.floor(sec * sr), sr); for (let ch = 0; ch < 2; ch++) fill(b.getChannelData(ch), sr, ch); return b; }
  function startAudio() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; ac = new AC();
    master = ac.createGain(); master.gain.value = 0; master.connect(ac.destination);
    // crickets: several chirpers, 4.2-4.8 kHz carriers, 3-pulse chirps at their own rates
    const cr = loopBuf(6, (a, sr, ch) => { for (let k = 0; k < 5; k++) { const f = 4200 + k * 140 + ch * 30, rate = 0.55 + k * 0.17, pan = ((k + ch) % 2) ? 1 : 0.45, ph = k * 0.37;
      for (let t0 = ph; t0 < 6 - 0.2; t0 += 1 / rate) for (let p = 0; p < 3; p++) { const s0 = Math.floor((t0 + p * 0.045) * sr), len = Math.floor(0.028 * sr);
        for (let i = 0; i < len; i++) { const e = Math.sin(Math.PI * i / len); a[s0 + i] += Math.sin(2 * Math.PI * f * i / sr) * e * 0.05 * pan; } } } });
    // frogs: spring-peeper rising peeps + low green-frog "gunk"
    const fr = loopBuf(8, (a, sr, ch) => { let seed = 7 + ch * 13; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      for (let t0 = 0.1; t0 < 7.6; t0 += 0.35 + rnd() * 0.6) { const len = Math.floor(0.12 * sr), s0 = Math.floor(t0 * sr), f0 = 2600 + rnd() * 400;
        for (let i = 0; i < len; i++) { const x = i / len, e = Math.sin(Math.PI * x); a[s0 + i] += Math.sin(2 * Math.PI * (f0 + 500 * x) * i / sr) * e * e * 0.045; } }
      for (let t0 = 0.6 + ch; t0 < 7.5; t0 += 2.2 + rnd() * 1.8) { const len = Math.floor(0.16 * sr), s0 = Math.floor(t0 * sr);
        for (let i = 0; i < len; i++) { const x = i / len, e = Math.pow(Math.sin(Math.PI * x), 0.6); a[s0 + i] += (Math.sin(2 * Math.PI * 190 * i / sr) + 0.5 * Math.sin(2 * Math.PI * 380 * i / sr)) * e * 0.09 * (0.6 + 0.4 * Math.sin(2 * Math.PI * 28 * i / sr)); } } });
    const play = (b, g) => { const s = ac.createBufferSource(); s.buffer = b; s.loop = true; s.connect(g); s.start(); };
    const crG = ac.createGain(); crG.gain.value = 0.7; crG.connect(master); play(cr, crG);
    frogG = ac.createGain(); frogG.gain.value = 0; frogG.connect(master); play(fr, frogG);
    nextCall = ac.currentTime + 12 + Math.random() * 20;
  }
  function owl(t) { for (const [dt, f, d] of [[0, 400, 0.35], [0.55, 390, 0.18], [0.8, 385, 0.18], [1.05, 380, 0.5]]) { const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(f, t + dt); o.frequency.linearRampToValueAtTime(f * 0.93, t + dt + d); g.gain.setValueAtTime(0, t + dt);
    g.gain.linearRampToValueAtTime(0.16, t + dt + 0.06); g.gain.linearRampToValueAtTime(0, t + dt + d); o.connect(g); g.connect(master); o.start(t + dt); o.stop(t + dt + d + 0.05); } }
  function loon(t) { const o = ac.createOscillator(), v = ac.createOscillator(), vg = ac.createGain(), g = ac.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(560, t); o.frequency.linearRampToValueAtTime(880, t + 1.2); o.frequency.setValueAtTime(880, t + 2.2); o.frequency.linearRampToValueAtTime(660, t + 3.4);
    v.frequency.value = 5.5; vg.gain.value = 9; v.connect(vg); vg.connect(o.frequency);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.11, t + 0.4); g.gain.setValueAtTime(0.11, t + 3.0); g.gain.linearRampToValueAtTime(0, t + 3.6);
    o.connect(g); g.connect(master); o.start(t); v.start(t); o.stop(t + 3.7); v.stop(t + 3.7); }
  function pondDist(p) { const W = W3D.water || {}; let d = 1e9; const P = W.pond;
    if (P) d = Math.hypot(Math.max(P.x0 - p.x, 0, p.x - P.x1), Math.max(P.z0 - p.z, 0, p.z - P.z1));
    if (W.kings && W.kings.poly) { let cx = 0, cz = 0; for (const q of W.kings.poly) { cx += q[0]; cz += q[1]; } cx /= W.kings.poly.length; cz /= W.kings.poly.length; d = Math.min(d, Math.max(0, Math.hypot(p.x - cx, p.z - cz) - 60)); }
    return d; }
  ['pointerdown', 'keydown', 'touchstart'].forEach(e => window.addEventListener(e, () => { if (soundOn) startAudio(); }, {passive: true}));

  // ---------- menu ----------
  const label = () => 'Sky: ' + (mode === 'auto' ? 'Auto' : mode === 'day' ? 'Day' : 'Night'), slabel = () => 'Night sounds: ' + (soundOn ? 'On' : 'Off');
  function setMode(m) { mode = m; lsSet('jfvr_sky', m); refreshLabels(); lastCalc = -1e9; }
  function cycle() { setMode(mode === 'auto' ? 'day' : mode === 'day' ? 'night' : 'auto'); if (window.JFVR && JFVR.hud) JFVR.hud(label() + (mode === 'auto' ? ' (follows Raynham sunrise / sunset)' : '')); }
  function toggleSound() { soundOn = !soundOn; lsSet('jfvr_nsnd', soundOn ? '1' : '0'); if (soundOn) startAudio(); refreshLabels(); }
  function refreshLabels() { const b = document.getElementById('skybtn'), s = document.getElementById('nsndbtn'); if (b) b.textContent = label(); if (s) s.textContent = slabel();
    const xb = document.getElementById('skylabel'), xs = document.getElementById('nsndlabel'); if (xb) xb.setAttribute('value', label()); if (xs) xs.setAttribute('value', slabel()); }
  function addMenu() {
    const tools = document.querySelector('#ui .tools');
    if (tools && !document.getElementById('skybtn')) { for (const [id, fn] of [['skybtn', cycle], ['nsndbtn', toggleSound]]) { const b = document.createElement('button'); b.id = id; b.onclick = e => { e.stopPropagation(); fn(); }; tools.appendChild(b); } }
    const bar = document.getElementById('vrbar');
    if (bar && !document.getElementById('skylabel')) {
      for (const [x, id, fn] of [[-1.7, 'skylabel', cycle], [1.7, 'nsndlabel', toggleSound]]) { const p = document.createElement('a-plane'); p.setAttribute('class', 'btn'); p.setAttribute('position', x + ' -1.6 0');
        p.setAttribute('width', '1.2'); p.setAttribute('height', '0.26'); p.setAttribute('material', 'shader:flat;color:#b9c7ff'); const t = document.createElement('a-text'); t.id = id; t.setAttribute('align', 'center'); t.setAttribute('color', '#111'); t.setAttribute('width', '2.2');
        p.appendChild(t); p.addEventListener('click', () => { fn(); if (soundOn) startAudio(); }); bar.appendChild(p); }
      setTimeout(() => document.querySelectorAll('[raycaster]').forEach(r => r.components.raycaster && r.components.raycaster.refreshObjects()), 500); }
    refreshLabels();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addMenu); else addMenu();

  const api = {get mode() { return mode; }, set: setMode, get n() { return cur; }, target, today, sound: () => ({on: soundOn, ctx: ac && ac.state})};
  api.moon = () => ({dir: U.moon.value.toArray(), fraction: MS.fraction, phase: MS.phase, altDeg: MS.alt, time: new Date(MS.time).toISOString(), sunLvl: MS.sunLvl, hemiLvl: MS.hemiLvl});
  api.moonIllum = moonIllum; window.JFVR_NIGHT = api;

  // ---------- tick (A-Frame tick = XR frame loop, so it runs on Quest in immersive mode) ----------
  const cp = new THREE.Vector3();
  AFRAME.registerSystem('w3d-daynight', { tick: function (t, dt) {
    if (!window.W3D_READY || !W3D.root) return; if (!built) build(this.el);
    const now = performance.now(); if (now - lastMoon > 5000) { moonUpdate(); lastMoon = now; if (cur > 0) lastEnv = 0; }
    if (now - lastCalc > 60000) { want = target(); lastCalc = now; }
    const step = Math.min(1, (dt || 16) / 2500);   // ease to the target over ~2.5 s (manual switch) - the auto blend itself is 20 min
    const nn = Math.abs(want - cur) < 0.002 || cur < 0 ? want : cur + (want - cur) * Math.max(step * 3, 0.01);
    if (nn !== cur || (cur > 0 && now - lastEnv > 1500)) { cur = nn; apply(cur, this.el); lastEnv = now; }
    if (dome.visible) { U.uT.value = t / 1000; if (W3D.sky) { dome.position.copy(W3D.sky.position); dome.scale.copy(W3D.sky.scale); } }
    if (ac && master) { const cam = this.el.camera; let fg = 0; if (cam) { cam.getWorldPosition(cp); fg = Math.max(0, 1 - (pondDist(cp) - 40) / 360); }
      const inCity = W3D.cities && W3D.cities.current && W3D.cities.current(), gain = soundOn && !inCity ? 0.55 * cur : 0;
      master.gain.setTargetAtTime(gain, ac.currentTime, 0.4); frogG.gain.setTargetAtTime(fg, ac.currentTime, 0.6);
      if (cur > 0.5 && soundOn && ac.currentTime > nextCall) { (Math.random() < 0.5 || fg < 0.2) ? owl(ac.currentTime) : loon(ac.currentTime); nextCall = ac.currentTime + 35 + Math.random() * 60; } }
  } });
})();
