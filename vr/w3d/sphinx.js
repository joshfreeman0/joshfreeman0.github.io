/* Sphinx (clip 19b): head and chest are a real museum scan - plaster cast KAS38 'Head and chest of a sphinx with the features of
   Amenemhat' (Royal Cast Collection, SMK - National Gallery of Denmark, open.smk.dk, Public Domain Mark 1.0), decimated to 8k / 2.4k
   triangles (sphinx_head_full.bin / sphinx_head_lite.bin). The recumbent lion body, paws, tail and stepped plinth are procedural. Built once from smooth (lathe / displaced-sphere / capsule) geometry and merged per
   material, so the whole avenue is a handful of instanced meshes. Local frame: faces -x, up +y, plinth top at y = 1.0. */
(function () {
  function merge(list) { // [geometry...] (already transformed) -> one non-indexed geometry with position/normal/uv
    const P = [], N = [], U = [];
    for (let g of list) { g = g.index ? g.toNonIndexed() : g; if (!g.attributes.normal) g.computeVertexNormals();
      const p = g.attributes.position, n = g.attributes.normal, u = g.attributes.uv;
      for (let i = 0; i < p.count; i++) { P.push(p.getX(i), p.getY(i), p.getZ(i)); N.push(n.getX(i), n.getY(i), n.getZ(i)); U.push(u ? u.getX(i) : 0, u ? u.getY(i) : 0); } }
    const o = new THREE.BufferGeometry(); o.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); o.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); o.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); return o;
  }
  const T = (g, x, y, z, rx, ry, rz, sx, sy, sz) => { const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx || 0, ry || 0, rz || 0)), new THREE.Vector3(sx || 1, sy || sx || 1, sz || sx || 1)); g.applyMatrix4(m); return g; };
  function lathe(prof, seg) { return new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), seg); }
  function capsule(r, len, q) { return new THREE.CapsuleGeometry(r, len, q ? 4 : 2, q ? 12 : 7); }
  // scanned bust: [nv u32, nf u32, nv*3 f32 positions (m, face -x, up +y, base at y 0), nf*3 u16 indices]
  window.sphinxHead = function (lite, base) {
    return fetch(base + 'sphinx_head_' + (lite ? 'lite' : 'full') + '.bin?v=2').then(r => r.arrayBuffer()).then(b => {
      const h = new Uint32Array(b, 0, 2), g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(b, 8, h[0] * 3), 3)); g.setIndex(new THREE.BufferAttribute(new Uint16Array(b, 8 + h[0] * 12, h[1] * 3), 1));
      const o = (8 + h[0] * 12 + h[1] * 6 + 3) & ~3, a = new Uint8Array(b, o, h[0]), c = new Uint8Array(h[0] * 3); // baked occlusion/cavity shade per vertex
      for (let i = 0; i < h[0]; i++) c[i * 3] = c[i * 3 + 1] = c[i * 3 + 2] = a[i]; g.setAttribute('color', new THREE.BufferAttribute(c, 3, true));
      T(g, -1.05, 1.14, 0, 0, 0, 0, 1.75); g.computeVertexNormals(); return g; });
  };
  window.sphinxParts = function (lite) {
    const q = !lite, sand = [], dark = [], nem = [], gold = [], blue = [], kohl = [];
    // plinth: base, die, cornice
    sand.length; dark.push(T(new THREE.BoxGeometry(5.0, 0.35, 2.5), 0, 0.175, 0), T(new THREE.BoxGeometry(4.7, 0.55, 2.2), 0, 0.625, 0), T(new THREE.BoxGeometry(4.95, 0.12, 2.45), 0, 0.96, 0));
    const top = 1.02;
    // lion body: lathe torso (ribcage to waist to haunch) laid along x
    const torso = lathe([[0.01, -1.9], [0.38, -1.75], [0.55, -1.3], [0.6, -0.7], [0.56, -0.1], [0.5, 0.4], [0.55, 0.9], [0.6, 1.3], [0.5, 1.65], [0.25, 1.85], [0.01, 1.9]], q ? 20 : 12);
    sand.push(T(torso, 0.35, top + 0.62, 0, 0, 0, -Math.PI / 2, 1, 1, 1.05));
    for (const s of [-1, 1]) {
      sand.push(T(new THREE.SphereGeometry(0.55, q ? 14 : 8, q ? 10 : 6), 1.45, top + 0.55, s * 0.38, 0, 0, 0, 0.95, 0.85, 0.5));   // haunch
      sand.push(T(capsule(0.17, 0.9, q), 1.5, top + 0.17, s * 0.62, 0, 0, Math.PI / 2));                                  // folded hind leg
      sand.push(T(capsule(0.2, 1.4, q), -1.55, top + 0.2, s * 0.4, 0, 0, Math.PI / 2));                                    // foreleg
      sand.push(T(new THREE.SphereGeometry(0.24, q ? 16 : 8, q ? 10 : 6), -2.28, top + 0.15, s * 0.4, 0, 0, 0, 1.15, 0.6, 1));   // paw
      for (let k = 0; k < 4; k++) sand.push(T(new THREE.SphereGeometry(0.075, 6, 4), -2.5, top + 0.1, s * 0.4 + (k - 1.5) * 0.1, 0, 0, 0, 1.3, 0.8, 1)); // toes
    }
    const tail = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(2.15, top + 0.35, 0), new THREE.Vector3(2.0, top + 0.12, 0.45), new THREE.Vector3(1.3, top + 0.08, 0.7), new THREE.Vector3(0.6, top + 0.1, 0.72)]), q ? 16 : 8, 0.06, 6);
    sand.push(tail, T(new THREE.SphereGeometry(0.1, 8, 6), 0.55, top + 0.12, 0.72));
    return {sand: merge(sand), dark: merge(dark)};
  };
})();
