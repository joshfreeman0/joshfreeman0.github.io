/* Bridgewater launch site (items 14-16).
   - Detail patch: 2.4 x 2.4 km of USGS National Map orthoimagery (public domain, ~1.2 m/px full, ~2.3 m/px lite) draped on USGS 3DEP
     elevation (10 m grid), around the Bridgewater correctional complex, loaded only when the camera is within ~3 km and disposed past 4.2 km.
     Its edge is blended into the coarse far-ring terrain, and the far ring is clipped underneath it.
   - Launch pad (centre = Josh's map pin, 41.95546 N, -70.9520194 W = world 9617, -2976.9): octagonal concrete pad, painted landing
     circle / chevrons / name, flame trench + deflector, edge lights, service tower + umbilical arm and a full-size copy of the
     nuclear thermal rocket from the Propulsion hall.
   - Pulling the right trigger (or click / tap) on that rocket boards it and flies a ~38 s scripted Earth -> Mars trip, built on demand and
     disposed afterwards; on touchdown it fades out, ends the WebXR session and opens Red Planet Lounge at its landing pad.
   - Far-edge haze: radial fog closes in as you fly out east so the 16 km edge of the terrain never shows against the sky. */
(function () {
'use strict';
const W3D = window.W3D = window.W3D || {};
const LITE = !!window.JFVR_LITE;
const BASE = '/vr/w3d/bw/';
const MARS_URL = 'https://redplanetlounge.pages.dev/?spot=pad&from=joshfreeman-vr';
const PATCH = {cx: 9400, cz: -2350, S: 2400, n: 241};
const PAD = {x: 9617.0, z: -2976.9, g: 11.4, R: 18, top: 12.2};
PATCH.x0 = PATCH.cx - PATCH.S / 2; PATCH.z0 = PATCH.cz - PATCH.S / 2; PATCH.x1 = PATCH.x0 + PATCH.S; PATCH.z1 = PATCH.z0 + PATCH.S;
W3D.launchPad = PAD;
const SC = 12;                      // full-size = 12x the Propulsion-hall model (2.5 m -> 30 m tall, 5.3 m across)
const ROCKET_H = 2.5 * SC;
let scene3 = null, patch = null, flight = null, clipU = null, checkT = 0;
const v3 = new THREE.Vector3();
const camPos = () => { const c = document.querySelector('[camera]'); return c ? c.object3D.getWorldPosition(v3) : null; };
const smooth = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
const canvasTex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };

/* ---------- rocket (same parts as the room model 'ntr', scaled) ---------- */
function makeRocket(lite) {
  const g = new THREE.Group(), seg = lite ? 16 : 28;
  const metal = new THREE.MeshStandardMaterial({color: 0xb4bac2, metalness: 0.85, roughness: 0.32, envMap: W3D.env || null, envMapIntensity: 0.9});
  const grey = new THREE.MeshStandardMaterial({color: 0x8d939b, metalness: 0.7, roughness: 0.4, envMap: W3D.env || null});
  const dark = new THREE.MeshStandardMaterial({color: 0x2b2c30, metalness: 0.6, roughness: 0.45});
  const red = new THREE.MeshStandardMaterial({color: 0xff4a1a, emissive: 0xff3a10, emissiveIntensity: 0.9});
  const add = (geo, m, y) => { const o = new THREE.Mesh(geo, m); o.position.y = y; o.castShadow = true; g.add(o); return o; };
  add(new THREE.CylinderGeometry(0.22 * SC, 0.22 * SC, 1.7 * SC, seg), grey, 1.15 * SC);
  add(new THREE.CylinderGeometry(0.222 * SC, 0.222 * SC, 0.45 * SC, seg), metal, 1.8 * SC);      // silver upper stage
  add(new THREE.ConeGeometry(0.22 * SC, 0.5 * SC, seg), metal, 2.25 * SC);                       // silver nose
  add(new THREE.CylinderGeometry(0.26 * SC, 0.26 * SC, 0.4 * SC, seg), dark, 0.55 * SC);          // black reactor section
  const ring = add(new THREE.TorusGeometry(0.265 * SC, 0.025 * SC, 8, seg * 2), red, 0.55 * SC); ring.rotation.x = Math.PI / 2;
  add(new THREE.CylinderGeometry(0.12 * SC, 0.26 * SC, 0.35 * SC, seg, 1, true), dark, 0.12 * SC); // nozzle
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4, leg = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.36 * SC, 0.5), dark);
    leg.position.set(Math.cos(a) * 0.3 * SC, 0.18 * SC - 0.6, Math.sin(a) * 0.3 * SC); leg.rotation.z = Math.cos(a) * 0.35; leg.rotation.x = -Math.sin(a) * 0.35; g.add(leg); }
  g.userData.mats = [metal, grey, dark];
  return g;
}
function disposeTree(o) { o.traverse(c => { if (c.geometry) c.geometry.dispose(); const ms = c.material ? (Array.isArray(c.material) ? c.material : [c.material]) : []; for (const m of ms) { for (const k of ['map', 'alphaMap', 'emissiveMap']) if (m[k]) m[k].dispose(); m.dispose(); } }); }

/* ---------- pad ---------- */
function makePad(rocket) {
  const g = new THREE.Group(); g.position.set(PAD.x, PAD.g, PAD.z);
  const conc = new THREE.MeshStandardMaterial({color: 0xbab6ad, roughness: 0.92});
  const slab = new THREE.Mesh(new THREE.CylinderGeometry(PAD.R, PAD.R + 0.8, 1.6, 8), conc); slab.position.y = PAD.top - PAD.g - 0.8; slab.rotation.y = Math.PI / 8; slab.receiveShadow = true; g.add(slab);
  // painted markings: landing circle, chevrons toward the trench, cross-hair and the pad name
  const mk = canvasTex(1024, 1024, (c, w) => { c.clearRect(0, 0, w, w); const m = w / 2;
    c.strokeStyle = '#f2f2ee'; c.lineWidth = 18; c.beginPath(); c.arc(m, m, w * 0.40, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = '#e8b320'; c.lineWidth = 10; c.beginPath(); c.arc(m, m, w * 0.44, 0, Math.PI * 2); c.stroke();
    c.fillStyle = '#e8b320'; for (let i = 0; i < 4; i++) { c.save(); c.translate(m, m); c.rotate(i * Math.PI / 2); for (let k = 0; k < 2; k++) { c.beginPath(); c.moveTo(-60, -w * 0.30 + k * 52); c.lineTo(0, -w * 0.34 + k * 52); c.lineTo(60, -w * 0.30 + k * 52); c.lineTo(60, -w * 0.30 + k * 52 + 22); c.lineTo(0, -w * 0.34 + k * 52 + 22); c.lineTo(-60, -w * 0.30 + k * 52 + 22); c.closePath(); c.fill(); } c.restore(); }
    c.strokeStyle = '#f2f2ee'; c.lineWidth = 14; c.beginPath(); c.moveTo(m - 150, m - 150); c.lineTo(m + 150, m + 150); c.moveTo(m + 150, m - 150); c.lineTo(m - 150, m + 150); c.stroke();
    c.fillStyle = '#f2f2ee'; c.font = 'bold 54px Arial, sans-serif'; c.textAlign = 'center'; c.fillText('LC-1  BRIDGEWATER', m, w * 0.88); c.font = 'bold 34px Arial, sans-serif'; c.fillText('NTR MARS LAUNCH COMPLEX', m, w * 0.15); });
  const paint = new THREE.Mesh(new THREE.CircleGeometry(PAD.R - 0.4, 48), new THREE.MeshStandardMaterial({map: mk, transparent: true, roughness: 0.8, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2}));
  paint.rotation.x = -Math.PI / 2; paint.position.y = PAD.top - PAD.g + 0.02; g.add(paint);
  // flame trench (open to the south-east) + steel deflector wedge under the nozzle
  const dark = new THREE.MeshStandardMaterial({color: 0x2a2826, roughness: 1});
  const trench = new THREE.Mesh(new THREE.BoxGeometry(6, 0.1, PAD.R + 10), dark); trench.position.set(0, PAD.top - PAD.g + 0.03, (PAD.R + 10) / 2 - 2); g.add(trench);
  const wallM = new THREE.MeshStandardMaterial({color: 0x9c978e, roughness: 0.95});
  for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.4, PAD.R + 10), wallM); w.position.set(s * 3.3, PAD.top - PAD.g + 0.7, (PAD.R + 10) / 2 - 2); g.add(w); }
  const defl = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 3.2, 2.2, 4, 1), new THREE.MeshStandardMaterial({color: 0x5d5f63, metalness: 0.7, roughness: 0.5})); defl.position.set(0, PAD.top - PAD.g + 1.1, 0); defl.rotation.y = Math.PI / 4; g.add(defl);
  // edge lights (glow at night: emissive, no light sources)
  const n = 16, lm = new THREE.MeshBasicMaterial({color: 0xffc04a, toneMapped: false}), lights = new THREE.InstancedMesh(new THREE.SphereGeometry(0.28, 8, 6), lm, n);
  const m4 = new THREE.Matrix4(); for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; m4.makeTranslation(Math.cos(a) * (PAD.R - 0.5), PAD.top - PAD.g + 0.3, Math.sin(a) * (PAD.R - 0.5)); lights.setMatrixAt(i, m4); } g.add(lights);
  // service tower (lattice) with an umbilical arm to the upper stage
  const red = new THREE.MeshStandardMaterial({color: 0xb5402c, roughness: 0.7, metalness: 0.3}), TX = -9.5, TH = ROCKET_H + 6, tb = PAD.top - PAD.g;
  const tower = new THREE.Group(); tower.position.set(TX, tb, 0); g.add(tower);
  for (const [sx, sz] of [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.35, TH, 0.35), red); p.position.set(sx, TH / 2, sz); tower.add(p); }
  const bars = Math.round(TH / 3), barG = new THREE.BoxGeometry(3.4, 0.22, 0.22), bm = new THREE.InstancedMesh(barG, red, bars * 4);
  for (let k = 0; k < bars; k++) for (let s = 0; s < 4; s++) { const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), s * Math.PI / 2), off = new THREE.Vector3(0, 0, 1.6).applyQuaternion(q); m4.compose(new THREE.Vector3(off.x, k * 3 + 1.5, off.z), q, new THREE.Vector3(1, 1, 1)); bm.setMatrixAt(k * 4 + s, m4); } tower.add(bm);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(-TX - 2.6, 0.8, 1.2), red); arm.position.set((-TX - 2.6) / 2 + 1.6 - 1.6, 1.9 * SC, 0); arm.position.x = (TX * -1 - 2.6) / 2; tower.add(arm);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 6), new THREE.MeshBasicMaterial({color: 0xff2a2a, toneMapped: false})); beacon.position.y = TH + 0.5; tower.add(beacon);
  // rider gallery on the tower at boarding height (where the flight puts you)
  rocket.position.set(0, tb + 0.6, 0); g.add(rocket);
  g.userData.beacon = beacon;
  return g;
}

/* ---------- detail patch ---------- */
function installClip() {
  const far = W3D.rings && W3D.rings.far; if (!far || clipU) return;
  clipU = {value: new THREE.Vector4(1, 1, -1, -1)};
  const m = far.material; m.onBeforeCompile = sh => { sh.uniforms.uClip = clipU;
    sh.vertexShader = 'varying vec2 vWPc;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\nvWPc = (modelMatrix * vec4(transformed, 1.0)).xz;');
    sh.fragmentShader = 'uniform vec4 uClip; varying vec2 vWPc;\n' + sh.fragmentShader.replace('void main() {', 'void main() {\nif (vWPc.x > uClip.x && vWPc.x < uClip.z && vWPc.y > uClip.y && vWPc.y < uClip.w) discard;'); };
  m.customProgramCacheKey = () => 'ringclip'; m.needsUpdate = true;
}
function loadPatch() {
  if (patch) return; patch = {loading: true};
  installClip();
  fetch(BASE + 'bw_dem.u16?v=1').then(r => r.arrayBuffer()).then(buf => {
    if (!patch || !patch.loading) return;
    const N = PATCH.n, d16 = new Uint16Array(buf), step = LITE ? 2 : 1, n = Math.floor((N - 1) / step) + 1, sp = PATCH.S / (N - 1);
    const H = new Float32Array(N * N), rh = W3D.terrainH || (() => 0), B = 160;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const x = PATCH.x0 + i * sp, z = PATCH.z0 + j * sp; let h = d16[j * N + i] / 100 - 10;
      const e = Math.min(x - PATCH.x0, PATCH.x1 - x, z - PATCH.z0, PATCH.z1 - z), w = smooth(e / B); h = rh(x, z) + (h - rh(x, z)) * w;   // feather into the ring terrain
      const dp = Math.hypot(x - PAD.x, z - PAD.z); if (dp < 40) h = PAD.g + (h - PAD.g) * smooth((dp - 24) / 16);                         // level ground under the pad
      H[j * N + i] = h; }
    const pos = new Float32Array(n * n * 3), uv = new Float32Array(n * n * 2), idx = [];
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const I = i * step, J = j * step, k = j * n + i; pos.set([PATCH.x0 + I * sp, H[J * N + I], PATCH.z0 + J * sp], k * 3); uv.set([I / (N - 1), 1 - J / (N - 1)], k * 2); }
    for (let j = 0; j < n - 1; j++) for (let i = 0; i < n - 1; i++) { const a = j * n + i, b = a + 1, c = a + n, e = c + 1; idx.push(a, c, b, b, c, e); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
    const mat = new THREE.MeshLambertMaterial({color: 0x6d7a5a});
    const tex = new THREE.TextureLoader().load(BASE + (LITE ? 'bw_1024.jpg?v=1' : 'bw_2048.jpg?v=1'), () => { mat.map = tex; mat.color.set(0xffffff); mat.needsUpdate = true; });
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = LITE ? 4 : 8;
    const mesh = new THREE.Mesh(geo, mat); mesh.name = 'bridgewater-patch'; mesh.receiveShadow = true;
    const rocket = makeRocket(LITE), pad = makePad(rocket);
    const grp = new THREE.Group(); grp.name = 'bridgewater'; grp.add(mesh, pad); (W3D.root || scene3).add(grp);
    const floor = {x0: PAD.x - PAD.R * 0.92, x1: PAD.x + PAD.R * 0.92, z0: PAD.z - PAD.R * 0.92, z1: PAD.z + PAD.R * 0.92, y: PAD.top};
    W3D.floors && W3D.floors.push(floor);
    W3D.patchH = (x, z) => { if (x <= PATCH.x0 || x >= PATCH.x1 || z <= PATCH.z0 || z >= PATCH.z1) return null; const fx = (x - PATCH.x0) / sp, fz = (z - PATCH.z0) / sp, i = Math.min(N - 2, Math.floor(fx)), j = Math.min(N - 2, Math.floor(fz)), tx = fx - i, tz = fz - j;
      const a = H[j * N + i], b = H[j * N + i + 1], c = H[(j + 1) * N + i], e = H[(j + 1) * N + i + 1]; return tx + tz <= 1 ? a + (b - a) * tx + (c - a) * tz : e + (c - e) * (1 - tx) + (b - e) * (1 - tz); };
    clipU.value.set(PATCH.x0 + 20, PATCH.z0 + 20, PATCH.x1 - 20, PATCH.z1 - 20);
    patch = {grp, mesh, tex, rocket, pad, floor, el: null};
    patch.el = rocketProxy(rocket, pad);
  }).catch(() => { patch = null; });
}
function unloadPatch() {
  if (!patch || patch.loading) return; if (flight) return;
  clipU && clipU.value.set(1, 1, -1, -1); W3D.patchH = null;
  if (W3D.floors) { const i = W3D.floors.indexOf(patch.floor); if (i >= 0) W3D.floors.splice(i, 1); }
  if (patch.el) patch.el.parentNode && patch.el.parentNode.removeChild(patch.el);
  if (patch.hint) { patch.hint.geometry.dispose(); patch.hint.material.map.dispose(); patch.hint.material.dispose(); }
  patch.grp.parent && patch.grp.parent.remove(patch.grp); disposeTree(patch.grp); patch = null;
}

/* ---------- hover hint + raycastable proxy around the big rocket ---------- */
function rocketProxy(rocket, pad) {
  const hc = document.createElement('canvas'); hc.width = 512; hc.height = 96; const hg = hc.getContext('2d'), ht = new THREE.CanvasTexture(hc); ht.colorSpace = THREE.SRGBColorSpace;
  const draw = on => { hg.clearRect(0, 0, 512, 96); hg.fillStyle = on ? 'rgba(181,83,45,0.95)' : 'rgba(20,20,24,0.75)'; hg.beginPath(); hg.roundRect ? hg.roundRect(4, 4, 504, 88, 18) : hg.rect(4, 4, 504, 88); hg.fill();
    hg.fillStyle = '#fff'; hg.font = 'bold 36px Arial, sans-serif'; hg.textAlign = 'center'; hg.textBaseline = 'middle'; hg.fillText('Pull trigger to launch to Mars', 256, 50); ht.needsUpdate = true; };
  const hint = new THREE.Mesh(new THREE.PlaneGeometry(7, 1.31), new THREE.MeshBasicMaterial({map: ht, transparent: true, toneMapped: false, depthWrite: false}));
  hint.position.set(PAD.x, PAD.top + 9, PAD.z + 5.5); hint.renderOrder = 6; patch.grp.add(hint); patch.hint = hint; draw(false);
  const mats = rocket.userData.mats, base = mats.map(m => m.emissive.getHex());
  const hover = on => { mats.forEach((m, i) => m.emissive.setHex(on ? 0x553322 : base[i])); draw(on); };
  const e = document.createElement('a-entity'); e.setAttribute('class', 'btn'); e.setAttribute('id', 'launch-rocket');
  e.setAttribute('position', PAD.x + ' ' + (PAD.top + ROCKET_H / 2) + ' ' + PAD.z);
  e.setAttribute('geometry', 'primitive: cylinder; radius: ' + (0.3 * SC) + '; height: ' + ROCKET_H); e.setAttribute('material', 'shader: flat; transparent: true; opacity: 0; depthWrite: false');
  e.addEventListener('mouseenter', () => hover(true)); e.addEventListener('mouseleave', () => hover(false));
  e.addEventListener('click', ev => { const ce = ev.detail && ev.detail.cursorEl, lc = ce && ce.getAttribute && ce.getAttribute('laser-controls'); if (lc && /left/.test(typeof lc === 'string' ? lc : lc.hand)) return; hover(false); startFlight(); });
  document.querySelector('a-scene').appendChild(e);
  return e;
}

/* ---------- navigation (WebXR session ended cleanly first) ---------- */
let going = false;
function goMars() {
  if (going) return; going = true; const nav = () => { window.location.href = MARS_URL; };
  const sc = document.querySelector('a-scene'), ses = sc && sc.renderer && sc.renderer.xr && sc.renderer.xr.getSession && sc.renderer.xr.getSession();
  if (ses) { setTimeout(nav, 1500); ses.end().then(nav, nav); } else nav();
}
W3D.goMars = goMars;

/* ---------- the flight: built on demand, disposed afterwards ---------- */
const T = {count: 6, lift: 16, space: 22, cruise: 31, land: 41, end: 43};   // seconds
function earthTex() { return canvasTex(512, 256, (c, w, h) => { c.fillStyle = '#1d4f8f'; c.fillRect(0, 0, w, h); let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 70; i++) { const x = r() * w, y = h * (0.15 + r() * 0.7), rr = 10 + r() * 34; c.fillStyle = r() < 0.5 ? '#4f7a3a' : '#8a7a4c'; c.beginPath(); c.ellipse(x, y, rr * 1.6, rr, r() * 3, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = '#eef3f6'; c.fillRect(0, 0, w, 14); c.fillRect(0, h - 14, w, 14);
  c.fillStyle = 'rgba(255,255,255,0.55)'; for (let i = 0; i < 90; i++) { c.beginPath(); c.ellipse(r() * w, r() * h, 8 + r() * 30, 3 + r() * 6, 0, 0, Math.PI * 2); c.fill(); } }); }
function marsTex(ground) { return canvasTex(ground ? 1024 : 512, ground ? 1024 : 256, (c, w, h) => { c.fillStyle = '#b5532d'; c.fillRect(0, 0, w, h); let s = 11; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < (ground ? 900 : 160); i++) { const x = r() * w, y = r() * h, rr = (ground ? 2 : 3) + r() * (ground ? 26 : 22); c.fillStyle = ['#9c4426', '#c7693c', '#8a3a22', '#d0804f'][Math.floor(r() * 4)]; c.globalAlpha = 0.5; c.beginPath(); c.arc(x, y, rr, 0, Math.PI * 2); c.fill(); }
  c.globalAlpha = 1; if (!ground) { c.fillStyle = '#f1e6dc'; c.fillRect(0, 0, w, 8); c.fillRect(0, h - 8, w, 8); } }); }
function label(text) { const t = canvasTex(1024, 192, (c, w, h) => { c.fillStyle = 'rgba(10,12,18,0.72)'; c.fillRect(0, 0, w, h); c.fillStyle = '#ffd27a'; c.font = 'bold 84px Arial, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, w / 2, h / 2 + 4); });
  return new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.45), new THREE.MeshBasicMaterial({map: t, transparent: true, depthTest: false, toneMapped: false})); }
function startFlight() {
  if (flight || going) return;
  const sc = document.querySelector('a-scene'), rig = document.querySelector('#rig'), cam = sc.camera; if (!rig || !cam) return;
  const s3 = sc.object3D, F = new THREE.Group(); F.name = 'flight'; s3.add(F);
  const saved = {pos: rig.object3D.position.clone(), fly: JFVR.fly, maxY: JFVR.flyMaxY, rad: JFVR.flyRadius, fog: s3.fog, bg: s3.background, rootVis: W3D.root ? W3D.root.visible : true, fogCol: W3D.fog ? W3D.fog.color.getHex() : 0, fogNear: W3D.fog && W3D.fog.near, fogFar: W3D.fog && W3D.fog.far};
  JFVR.fly = true; JFVR.flyMaxY = 1e7; JFVR.flyRadius = 1e7;
  const yaw = new THREE.Euler().setFromQuaternion(cam.getWorldQuaternion(new THREE.Quaternion()), 'YXZ').y;
  const fwd = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw)), side = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
  // rider gallery: you stand 6.5 m beside the rocket at 14 m up; the rocket is on your right, the view ahead is open
  const DECK = 14, rocketOff = side.clone().multiplyScalar(6.5);
  const rocket = makeRocket(true); F.add(rocket);
  const deck = new THREE.Group(); F.add(deck);
  const steel = new THREE.MeshStandardMaterial({color: 0x6c7076, metalness: 0.6, roughness: 0.5});
  const plat = new THREE.Mesh(new THREE.BoxGeometry(3, 0.2, 3), steel); plat.position.y = -0.1; deck.add(plat);
  for (const [x, z, w, d] of [[0, -1.5, 3, 0.06], [0, 1.5, 3, 0.06], [-1.5, 0, 0.06, 3]]) { const r = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, d), steel); r.position.set(x, 1.05, z); deck.add(r); }
  const armM = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.3, 0.8), steel); armM.position.set(3.3, -0.1, 0); deck.add(armM); deck.rotation.y = yaw;
  // flame + smoke
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.16 * SC, 0.9 * SC, 16, 1, true), new THREE.MeshBasicMaterial({color: 0xffb04a, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false}));
  flame.rotation.x = Math.PI; flame.visible = false; rocket.add(flame); flame.position.y = -0.45 * SC;
  const puff = canvasTex(64, 64, (c) => { const gr = c.createRadialGradient(32, 32, 2, 32, 32, 31); gr.addColorStop(0, 'rgba(235,235,235,0.9)'); gr.addColorStop(1, 'rgba(235,235,235,0)'); c.fillStyle = gr; c.fillRect(0, 0, 64, 64); });
  const smoke = []; for (let i = 0; i < (LITE ? 14 : 26); i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({map: puff, transparent: true, opacity: 0, depthWrite: false})); sp.userData.a = i / (LITE ? 14 : 26) * Math.PI * 2; sp.userData.r = 0.6 + Math.random() * 0.8; F.add(sp); smoke.push(sp); }
  // space: star field + black sky shell (fades in), Earth, Mars, Mars ground; fade shell on the camera
  const starG = new THREE.BufferGeometry(), sv = []; for (let i = 0; i < (LITE ? 900 : 1800); i++) { const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, r = Math.sqrt(1 - u * u); sv.push(r * Math.cos(a) * 5000, u * 5000, r * Math.sin(a) * 5000); }
  starG.setAttribute('position', new THREE.Float32BufferAttribute(sv, 3));
  const stars = new THREE.Points(starG, new THREE.PointsMaterial({color: 0xffffff, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false})); stars.renderOrder = -8; F.add(stars);
  const shell = new THREE.Mesh(new THREE.SphereGeometry(6000, 24, 12), new THREE.MeshBasicMaterial({color: 0x000004, side: THREE.BackSide, transparent: true, opacity: 0, fog: false, depthWrite: false})); shell.renderOrder = -9; F.add(shell);
  const earth = new THREE.Mesh(new THREE.SphereGeometry(6000, 48, 24), new THREE.MeshLambertMaterial({map: earthTex()})); earth.visible = false; F.add(earth);
  const mars = new THREE.Mesh(new THREE.SphereGeometry(3000, 48, 24), new THREE.MeshLambertMaterial({map: marsTex(false)})); mars.visible = false; F.add(mars);
  const mg = new THREE.Group(); mg.visible = false; F.add(mg);
  const gt = marsTex(true); gt.wrapS = gt.wrapT = THREE.RepeatWrapping; gt.repeat.set(40, 40);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(9000, 48), new THREE.MeshLambertMaterial({map: gt})); ground.rotation.x = -Math.PI / 2; mg.add(ground);
  for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2 + 0.3, d = 900 + Math.random() * 1600, hill = new THREE.Mesh(new THREE.ConeGeometry(300 + Math.random() * 500, 120 + Math.random() * 260, 7), new THREE.MeshLambertMaterial({color: 0x9a4728, flatShading: true})); hill.position.set(Math.cos(a) * d, 40, Math.sin(a) * d); mg.add(hill); }
  const mpad = new THREE.Mesh(new THREE.CylinderGeometry(20, 21, 0.6, 8), new THREE.MeshStandardMaterial({color: 0x8f8a84, roughness: 0.9})); mpad.position.y = 0.3; mg.add(mpad);
  const mpm = new THREE.Mesh(new THREE.RingGeometry(14, 15.2, 48), new THREE.MeshBasicMaterial({color: 0xf2c230})); mpm.rotation.x = -Math.PI / 2; mpm.position.y = 0.62; mg.add(mpm);
  const sunL = new THREE.DirectionalLight(0xffffff, 1.6); sunL.position.set(1, 0.6, 0.4); F.add(sunL); F.add(new THREE.AmbientLight(0x404050, 0.6));
  const fade = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 8), new THREE.MeshBasicMaterial({color: 0x000000, side: THREE.BackSide, transparent: true, opacity: 1, depthTest: false, depthWrite: false, fog: false})); fade.renderOrder = 1e4; cam.add(fade);
  const txt = label('T-5'); txt.renderOrder = 1e4 - 1; F.add(txt);
  // in-world Skip / Cancel buttons (laser) + HTML ones (phone / desktop)
  const mkBtn = (t, x, fn) => { const b = document.createElement('a-plane'); b.setAttribute('class', 'btn'); b.setAttribute('width', 0.7); b.setAttribute('height', 0.22); b.setAttribute('material', 'shader:flat;color:#FFD700');
    const tx = document.createElement('a-text'); tx.setAttribute('value', t); tx.setAttribute('align', 'center'); tx.setAttribute('color', '#111'); tx.setAttribute('width', 1.8); b.appendChild(tx); b.addEventListener('click', fn); sc.appendChild(b); b.userData = {x}; return b; };
  const bSkip = mkBtn('Skip to Mars', -0.4, () => finish(true)), bCancel = mkBtn('Cancel', 0.4, () => finish(false));
  const ov = document.createElement('div'); ov.id = 'flightui'; ov.style.cssText = 'position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:50;display:flex;gap:10px';
  for (const [t, fn] of [['Skip to Mars', () => finish(true)], ['Cancel', () => finish(false)]]) { const b = document.createElement('button'); b.textContent = t; b.style.cssText = 'font:600 15px sans-serif;padding:8px 14px;border-radius:8px;border:0;background:#ffd700;color:#111'; b.onclick = fn; ov.appendChild(b); }
  document.body.appendChild(ov);
  const onB = () => finish(true), onKey = e => { if (e.key === 'Escape') finish(false); };
  sc.addEventListener('bbuttondown', onB); window.addEventListener('keydown', onKey);
  const P0 = new THREE.Vector3(PAD.x, PAD.top + 0.6, PAD.z).sub(rocketOff);   // rider spot (rocket at pad centre)
  let t0 = performance.now(), done = false;
  const place = (y) => { // rider at (P0.x, y, P0.z); rocket base at y - DECK
    const rp = rig.object3D.position, cw = cam.getWorldPosition(new THREE.Vector3()); rp.x += P0.x - cw.x; rp.z += P0.z - cw.z; rp.y = y;
    deck.position.set(P0.x, y, P0.z); rocket.position.set(P0.x + rocketOff.x, y - DECK, P0.z + rocketOff.z); };
  const world = (on) => { if (W3D.root) W3D.root.visible = on; s3.fog = on ? W3D.fog : null; };
  const yAt = t => { const base = PAD.top + 0.6 + DECK; if (t < T.count) return base; const u = t - T.count; return base + 0.5 * 9 * u * u + (u > 6 ? 0.5 * 40 * (u - 6) * (u - 6) : 0); }; // smooth, increasing acceleration
  if (patch && patch.rocket) patch.rocket.visible = false;
  function finish(toMars) {
    if (done) return; done = true; const tEnd = performance.now();
    const fadeOut = () => { const k = Math.min(1, (performance.now() - tEnd) / 700); fade.material.opacity = Math.max(fade.material.opacity, k); if (k < 1) return requestAnimationFrame(fadeOut); toMars ? goMars() : restore(); };
    fadeOut();
  }
  function restore() {
    rig.removeAttribute('w3d-ride'); sc.removeEventListener('bbuttondown', onB); window.removeEventListener('keydown', onKey);
    [bSkip, bCancel].forEach(b => b.parentNode && b.parentNode.removeChild(b)); ov.remove();
    cam.remove(fade); fade.geometry.dispose(); fade.material.dispose(); s3.remove(F); disposeTree(F);
    world(saved.rootVis); s3.background = saved.bg; if (W3D.fog) { W3D.fog.color.setHex(saved.fogCol); W3D.fog.near = saved.fogNear; W3D.fog.far = saved.fogFar; }
    JFVR.fly = saved.fly; JFVR.flyMaxY = saved.maxY; JFVR.flyRadius = saved.rad;
    if (patch && patch.rocket) patch.rocket.visible = true;
    W3D.teleportTo(PAD.x - 30, undefined, PAD.z + 30, -45); flight = null;
  }
  const black = new THREE.Color(0x000004), fogC = new THREE.Color(saved.fogCol), tan = new THREE.Color(0xc99a73);
  flight = {tick: () => {
    if (done) return;
    const t = (performance.now() - t0) / 1000, cw = cam.getWorldPosition(new THREE.Vector3());
    // fade in at start, a short fade at the space -> Mars-descent cut, fade out at touchdown
    let fo = t < 0.8 ? 1 - t / 0.8 : 0; if (t > T.cruise - 0.8 && t < T.cruise + 0.8) fo = 1 - Math.abs(t - T.cruise) / 0.8; fade.material.opacity = fo;
    stars.position.copy(cw); shell.position.copy(cw);
    // HUD text and buttons float ahead of the rider (along the boarding yaw, no head locking)
    const ahead = cw.clone().addScaledVector(fwd, 3); txt.position.set(ahead.x, cw.y + 0.55, ahead.z); txt.lookAt(cw.x, cw.y + 0.55, cw.z);
    [bSkip, bCancel].forEach(b => { const p = cw.clone().addScaledVector(fwd, 2.6).addScaledVector(side, b.userData.x); b.object3D.position.set(p.x, cw.y - 0.75, p.z); b.object3D.lookAt(cw.x, cw.y - 0.75, cw.z); });
    const setTxt = s => { if (txt.userData.s === s) return; txt.userData.s = s; txt.material.map.dispose(); const n = label(s); txt.material.map = n.material.map; n.geometry.dispose(); n.material.dispose(); txt.visible = !!s; };
    if (t < T.lift) {                                     // 1-2: countdown, ignition, lift-off and climb; sky goes from blue to black
      world(true); place(yAt(t));
      setTxt(t < 1 ? 'Boarding...' : t < T.count ? 'T-' + Math.max(1, Math.ceil(T.count - t)) : t < T.count + 2.5 ? 'Lift-off!' : '');
      const ign = t > T.count - 1.6; flame.visible = ign; if (ign) { const k = 0.9 + 0.1 * Math.sin(t * 40); flame.scale.set(k, 1 + 0.15 * Math.sin(t * 23), k); }
      smoke.forEach((sp, i) => { const age = Math.max(0, t - (T.count - 1.4)); const r = (4 + age * 7) * sp.userData.r, a = sp.userData.a; sp.position.set(PAD.x + Math.cos(a) * r, PAD.top + 1 + age * 1.5 * sp.userData.r, PAD.z + Math.sin(a) * r);
        const s = 6 + age * 5; sp.scale.set(s, s, 1); sp.material.opacity = age > 0 ? Math.min(0.7, age * 0.5) * Math.max(0, 1 - age / 12) : 0; });
      const k = smooth((t - T.count - 2) / (T.lift - T.count - 2)); shell.material.opacity = k * 0.97; stars.material.opacity = smooth((k - 0.5) * 2);
      if (W3D.fog) { W3D.fog.color.copy(fogC).lerp(black, k); W3D.fog.near = 2000 * (1 - k) + 300; W3D.fog.far = 8200 * (1 - k) + 2500; } s3.background = W3D.fog ? W3D.fog.color : black;
    } else if (t < T.cruise) {                            // 3-4: Earth falls away below, then a short cruise while Mars grows ahead
      world(false); s3.background = black; flame.visible = true; smoke.forEach(sp => sp.visible = false);
      const Y = yAt(T.lift); place(Y); shell.material.opacity = 1; stars.material.opacity = 1;
      const u = (t - T.lift) / (T.space - T.lift); earth.visible = true; const ed = 6000 + 400 + 22000 * smooth(Math.min(1, u * 0.5 + (t - T.lift) / (T.cruise - T.lift) * 0.5));
      earth.position.set(cw.x - fwd.x * 2000, cw.y - ed, cw.z - fwd.z * 2000); earth.rotation.y = t * 0.02;
      const m = smooth((t - T.space + 2) / (T.cruise - T.space + 2)); mars.visible = t > T.space - 2; const md = 26000 - 20500 * m;
      mars.position.set(cw.x + fwd.x * md * 0.82, cw.y + md * 0.57, cw.z + fwd.z * md * 0.82); mars.rotation.y = t * 0.03;
      setTxt(t < T.space ? 'Leaving Earth' : 'Cruise to Mars');
      flame.scale.setScalar(t < T.space ? 1 : 0.6);
    } else if (t < T.land) {                              // 5: descent with a retro-burn onto the Mars landing pad
      earth.visible = false; mars.visible = false; mg.visible = true; mg.position.set(PAD.x, PAD.g, PAD.z);
      shell.material.color.copy(tan); shell.material.opacity = 1; stars.material.opacity = 0.0; s3.background = tan;
      const u = (t - T.cruise) / (T.land - T.cruise), y = PAD.g + 0.6 + DECK + 1600 * Math.pow(1 - u, 2.2); place(y);
      flame.visible = true; flame.scale.set(0.8, 0.6 + 0.6 * (1 - u), 0.8); setTxt(u < 0.85 ? 'Retro-burn - descending' : 'Touchdown');
    } else {                                              // touchdown: fade to black, then Red Planet Lounge
      flame.visible = false; place(PAD.g + 0.6 + DECK); setTxt('Welcome to Mars'); if (t > T.end) finish(true);
    }
  }};
  if (!AFRAME.components['w3d-ride']) AFRAME.registerComponent('w3d-ride', {tick: function () { flight && flight.tick(); }});
  rig.setAttribute('w3d-ride', '');
  W3D.flight = {skip: () => finish(true), cancel: () => finish(false), T};
}
W3D.startFlight = startFlight;

/* ---------- per-frame: lazy patch, far-edge haze ---------- */
AFRAME.registerSystem('w3d-launch', {
  init: function () { scene3 = this.el.object3D; },
  tick: function (t) {
    if (patch && patch.hint && !flight) { const c = camPos(); if (c) { const h = patch.hint; h.rotation.y = Math.atan2(c.x - h.position.x, c.z - h.position.z); } }
    if (!W3D.root || !W3D.active || t - checkT < 500) return; checkT = t;
    const p = camPos(); if (!p) return;
    const d = Math.hypot(p.x - PATCH.cx, p.z - PATCH.cz);
    if (d < 3000 + PATCH.S / 2 * 0.6) loadPatch(); else if (d > 4200 + PATCH.S / 2) unloadPatch();
    if (W3D.fog && !flight && !W3D.roam) { const r = Math.max(Math.abs(p.x), Math.abs(p.z)), far = Math.max(3200, Math.min(8200, 16384 - r - 400)); W3D.fog.far = far; W3D.fog.near = Math.min(2000, far * 0.3); }
  }
});
// menu teleport spot 'Launch pad': on the ground south-west of the pad, looking at the rocket and the tower
const addSpots = () => { if (!W3D.spots) return setTimeout(addSpots, 50);
  W3D.spots.launchpad = () => { loadPatch(); W3D.teleportTo(PAD.x - 34, undefined, PAD.z + 34, -45); }; };
addSpots();
})();
