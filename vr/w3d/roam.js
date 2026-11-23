/* Free roaming + XR comfort for Fowling Pond.
   - Solo flying has no wall (index.html worldLimits: radius 10,000 km, height 100 km). Past the 16 km USGS terrain a cheap
     procedural "global ground" disk (land tones, ocean to the east/south-east, no downloads, ~1 MB) fills the view so there is never a void.
   - Fog, sky and the camera far plane stretch with height so the ground stays visible from high up; desktop flying speed grows with height.
   - Home: Fowling Pond (menu button, VR menu button, key H on desktop) always brings you back.
   - XR: fixed foveation + slightly smaller headset framebuffer on Quest (hd.js), shadow refresh every 90 frames in the headset and none
     when frames run late, sky-coloured clear colour, optional frame-time readout with ?fps=1. */
(function () {
const W3D = window.W3D = window.W3D || {}; W3D.roam = true;
const HOME_FOG = {near: 2000, far: 8200}, BASE_FAR = 30000;
let ground = null;
function buildGround(sc) {
  // rings spaced geometrically from 15 km to 1,500 km, 96 segments: no huge triangles (they fog to a flat colour with the log depth buffer)
  const R0 = 15000, R1 = 1.5e6, NR = 40, NS = 96, pos = [], col = [], idx = [];
  const lin = c => Math.pow(c / 255, 2.2), land = [lin(70), lin(92), lin(56)], land2 = [lin(92), lin(100), lin(66)], sea = [lin(40), lin(70), lin(96)];
  const n2 = (x, z) => Math.sin(x * 0.00011 + Math.sin(z * 0.00007) * 2) * Math.cos(z * 0.00009 - Math.sin(x * 0.00005) * 1.7);
  for (let i = 0; i <= NR; i++) { const r = R0 * Math.pow(R1 / R0, i / NR);
    for (let j = 0; j < NS; j++) { const a = j / NS * Math.PI * 2, x = Math.cos(a) * r, z = Math.sin(a) * r; pos.push(x, -3 - i * 0.5, z);
      // rough coast: Massachusetts/Cape Cod Bay to the east (~40 km), Buzzards Bay / Narragansett Bay to the south (~40 km); procedural, not a map
      const isSea = x > 40000 + 9000 * n2(x, z) || (z > 42000 + 8000 * n2(z, x) && x > -60000) || r > 900000 && x > -200000;
      const k = 0.5 + 0.5 * n2(x * 3, z * 3), c = isSea ? sea : [land[0] + (land2[0] - land[0]) * k, land[1] + (land2[1] - land[1]) * k, land[2] + (land2[2] - land[2]) * k];
      col.push(c[0], c[1], c[2]); } }
  for (let i = 0; i < NR; i++) for (let j = 0; j < NS; j++) { const a = i * NS + j, b = i * NS + (j + 1) % NS, c = a + NS, d = b + NS; idx.push(a, b, c, b, d, c); }  // wound counter-clockwise seen from above
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
  ground = new THREE.Mesh(g, new THREE.MeshLambertMaterial({vertexColors: true}));
  ground.name = 'globalGround'; ground.frustumCulled = false; ground.visible = false; sc.object3D.add(ground);
}
const _cp = new THREE.Vector3(); let lastAlt = -1;
AFRAME.registerSystem('w3d-roam', {
  init: function () { const sc = this.el; buildGround(sc);
    W3D.spots = W3D.spots || {};
    const home = () => { if (W3D.spots.pond) W3D.spots.pond(); };
    const tryHome = () => { if (W3D.spots && W3D.spots.pond && !W3D.spots.home) W3D.spots.home = home; else if (!W3D.spots.home) setTimeout(tryHome, 300); }; tryHome();
    document.addEventListener('keydown', e => { if (e.code !== 'KeyH' || e.ctrlKey || e.metaKey || e.altKey) return; const t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (sc.is('vr-mode')) return; if (window.goWorld) window.goWorld('home'); });
    const r = () => { const rr = sc.renderer; if (rr) rr.setClearColor(0xcfdde8, 1); }; if (sc.renderer) r(); else sc.addEventListener('renderstart', r);
    if (/[?&]fps=1/.test(location.search)) this.fpsHud();
  },
  fpsHud: function () { const cam = document.querySelector('[camera]'); if (!cam) return setTimeout(() => this.fpsHud(), 500);
    const t = document.createElement('a-text'); t.setAttribute('position', '0.32 0.22 -0.8'); t.setAttribute('width', '0.6'); t.setAttribute('color', '#ffef9a'); t.setAttribute('value', 'fps'); cam.appendChild(t); this.fpsT = t; this.fN = 0; this.fT = 0; this.fMax = 0; },
  tick: function (t, dt) {
    if (!dt) return; const sc = this.el, r = sc.renderer, xr = r && r.xr && r.xr.isPresenting;
    // frame timing: in the headset, drop shadow refreshes when frames run late (black edges = late frames being reprojected)
    this.fN = (this.fN || 0) + 1; this.fT = (this.fT || 0) + dt; this.fMax = Math.max(this.fMax || 0, dt);
    if (this.fT > 1000) { const avg = this.fT / this.fN; W3D.xrSlow = xr && avg > 15; if (this.fpsT) this.fpsT.setAttribute('value', Math.round(1000 / avg) + ' fps  ' + avg.toFixed(1) + ' ms (max ' + this.fMax.toFixed(0) + ')' + (xr ? ' XR' : '') + (W3D.xrSlow ? ' SLOW' : '')); this.fN = 0; this.fT = 0; this.fMax = 0; }
    // desktop / phone: fold mouse- or drag-look yaw into the rig so WASD walks where you look (wasd-controls only reads the rig heading)
    if (!xr) { const lc = this.lc || (this.lc = (document.querySelector('[camera]') || {}).components); const l = lc && lc['look-controls'];
      if (l && l.yawObject && l.yawObject.rotation.y !== 0) { const rg = document.getElementById('rig'); if (rg) { rg.object3D.rotation.y += l.yawObject.rotation.y; l.yawObject.rotation.y = 0; } } }
    if (!W3D.active || !sc.camera) { if (ground) ground.visible = false; return; }
    sc.camera.getWorldPosition(_cp);
    const gnd = W3D.groundAt ? W3D.groundAt(_cp.x, _cp.z, -1e4) : 0, alt = Math.max(0, _cp.y - (isFinite(gnd) ? gnd : 0)), far = Math.hypot(_cp.x, _cp.z);
    if (ground) ground.visible = !W3D.spaceView && (alt > 400 || far > 9000);   // spaceView: rocket trip in deep space (launch.js / transit.js)
    // fog / far plane stretch with height (only touch them when the height changed noticeably)
    if (sc.object3D.fog === W3D.fog && W3D.fog && !W3D.launchFlight && (Math.abs(alt - lastAlt) > 20 || t - (this.fogT || 0) > 500)) { lastAlt = alt; this.fogT = t;
      // near the edge of the 16 km terrain at low height keep the old edge haze; higher up the fog opens out with height
      const r = Math.max(Math.abs(_cp.x), Math.abs(_cp.z)), edge = alt < 300 ? Math.max(3200, Math.min(HOME_FOG.far, 16384 - r - 400)) : HOME_FOG.far;
      const k = Math.max(0, alt - 300); W3D.fog.near = Math.min(HOME_FOG.near, edge * 0.3) + k * 3; W3D.fog.far = edge + k * 12;
      const cf = Math.max(BASE_FAR, W3D.fog.far * 1.4); if (Math.abs(sc.camera.far - cf) > 500) { sc.camera.far = cf; sc.camera.updateProjectionMatrix(); }
      // the 7 km sky sphere follows the camera and is drawn with depth test: grow it with the far plane or it hides everything beyond 7 km
      if (W3D.sky) W3D.sky.scale.setScalar(Math.max(1, cf * 0.9 / 7000)); }
    // desktop flying speed grows with height (thumbsticks already scale in locomotion.js)
    const rig = document.getElementById('rig'), w = rig && rig.components['wasd-controls'];
    if (w) { const a = JFVR.fly ? 25 * (1 + Math.max(0, alt) / 40) : 25; if (Math.abs(w.data.acceleration - a) > 2) w.data.acceleration = Math.min(a, 25000); }
    W3D.flyVSpeed = JFVR.fly ? 30 * (1 + alt / 40) : 30;
  }
});
})();
