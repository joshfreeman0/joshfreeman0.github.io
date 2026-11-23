/* Image-based lighting from the site's own 360 concept panoramas (vr/pano): the panorama of the area you are in becomes the
   environment map (reflections + soft ambient light, PMREM) of the stone, marble, gold and wood around you.
   Hall -> pano_hall, office -> pano_office, conservatory -> pano_greenhouse, terrace pavilion / forecourt -> pano_terrace,
   everywhere else outdoors -> pano_grounds. The vault keeps its own lamp-lit map. Panoramas are 1024 x 512 copies
   (512 x 256 on phones, where only the current area's map is kept in memory). */
(function () {
  const PANO = '/vr/pano/env_';
  function zoneAt(p, HQ) {
    if (p.y < HQ.y - 1.5) return null;                                                            // vault / showcase: leave as built
    if (p.x > 966 && p.x < 986 && p.z > HQ.z - 10 && p.z < HQ.z + 10 && p.y > HQ.y + 25) return 'office';
    if (p.x > 924 && p.x < 966 && p.z > HQ.z - 21 && p.z < HQ.z + 21 && p.y < HQ.y + 18) return 'hall';
    if (p.x > 898 && p.x < 954 && p.z > HQ.z + 25 && p.z < HQ.z + 57 && p.y < HQ.y + 14) return 'greenhouse';
    if (p.x > 834 && p.x < 925 && p.z > HQ.z - 30 && p.z < HQ.z + 30 && p.y < HQ.y + 20) return 'terrace';
    return 'grounds';
  }
  // how strongly each area's panorama lights the room (indoor panos are the main light there; outdoors the sun still leads)
  const GAIN = {hall: 1.0, office: 1.0, greenhouse: 1.0, terrace: 1.0, grounds: 0.9};
  const HEMI = {hall: 0.35, office: 0.45, greenhouse: 0.6, terrace: 0.7, grounds: 0.75};
  let mats = null, hemi = null, cur = '', loading = '', pm = null;
  const cache = {}, order = [];
  function collect() {
    mats = []; const seen = new Set(), base = [W3D.env, W3D.envOut].filter(Boolean), skip = W3D.envIn;
    W3D.root.traverse(o => {
      if (o.isHemisphereLight && !hemi) hemi = o;
      if (/water|pond|river|lake/i.test(o.name || '')) return;
      for (const m of o.material ? [].concat(o.material) : []) {
        if (!m || seen.has(m) || !m.isMeshStandardMaterial || m.transparent) continue; seen.add(m);
        if (m.envMap && m.envMap === skip) continue;
        if (m.envMap && base.indexOf(m.envMap) < 0) continue;   // custom maps (e.g. pyramid cap) stay
        if (!m.envMap) continue;
        mats.push([m, m.envMapIntensity, m.envMap]);
      }
    });
  }
  function apply(zone) {
    const t = cache[zone]; if (!t) return; cur = zone;
    for (const [m, i0] of mats) { m.envMap = t; m.envMapIntensity = i0 * GAIN[zone]; }
    if (hemi) hemi.intensity = HEMI[zone];
  }
  function load(zone, R) {
    if (loading) return; loading = zone;
    new THREE.TextureLoader().load(PANO + zone + (W3D.lite ? '_512' : '') + '.jpg?v=1', tex => {
      tex.mapping = THREE.EquirectangularReflectionMapping; tex.colorSpace = THREE.SRGBColorSpace;
      if (!pm) pm = new THREE.PMREMGenerator(R);
      const rt = pm.fromEquirectangular(tex); tex.dispose();
      cache[zone] = rt.texture; order.push(zone);
      const keep = W3D.lite ? 1 : 5;   // phones: only the current area's map in GPU memory
      while (order.length > keep) { const z = order.shift(); if (z === zone) { order.push(z); break; } const old = cache[z]; delete cache[z];
        for (const e of mats) if (e[0].envMap === old) e[0].envMap = e[2]; old.dispose(); }
      loading = ''; if (W3D.ibl && W3D.ibl.want === zone) apply(zone);
    }, undefined, () => { loading = ''; });
  }
  const v = new THREE.Vector3(); let last = -1e9;
  AFRAME.registerComponent('w3d-ibl', { tick: function (t) {
    if (!window.W3D_READY || !W3D.active || !W3D.root || t - last < 400) return; last = t;
    if (!mats) collect();
    const cam = this.el.camera; if (!cam) return; cam.getWorldPosition(v);
    const z = zoneAt(v, W3D.lib.HQ); W3D.ibl = {want: z, cur: cur, mats: mats.length};
    if (!z || z === cur) return;
    if (cache[z]) apply(z); else load(z, this.el.renderer);
  } });
  const attach = () => { const sc = document.querySelector('a-scene'); if (sc) sc.setAttribute('w3d-ibl', ''); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attach); else attach();
})();
