/* Sculpted sphinx (clip 19b): recumbent lion body, human head with a carved face, striped gold/blue nemes with lappets and a back fold,
   uraeus cobra, false beard, on a stepped plinth. Built once from smooth (lathe / displaced-sphere / capsule) geometry and merged per
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
  const G = (d, s) => Math.exp(-(d * d) / (2 * s * s));
  const uvY = (g, k, x0) => { const p = g.attributes.position, u = g.attributes.uv; for (let i = 0; i < p.count; i++) u.setXY(i, (x0 || 0) + p.getZ(i) * 0.3, p.getY(i) * k); return g; }; // horizontal nemes stripes follow height
  let LM = [];
  function head(q) { // sculpted face on a displaced ellipsoid; unit head ~1 m chin-to-crown, centred at origin, face toward -x
    const g = new THREE.SphereGeometry(0.5, q ? 30 : 18, q ? 24 : 12); g.rotateY(Math.PI); const p = g.attributes.position, v = new THREE.Vector3();   // seam to the back
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i); let x = v.x * 1.02, y = v.y * 1.18, z = v.z * 0.86;
      const f = Math.max(0, -v.x / 0.5);                       // 1 on the face, 0 at the sides/back
      const u = v.z / 0.43, w = v.y / 0.5;                      // face coords across / up
      if (w < -0.1) { const t = Math.min(1, (-0.1 - w) / 0.9); z *= 1 - 0.32 * t; x *= 1 - 0.12 * t; }   // jaw narrows to the chin
      let d = 0;
      d += 0.035 * G(w - 0.26, 0.07) * G(u, 0.55);                                   // brow ridge
      d -= 0.07 * (G(u - 0.36, 0.13) + G(u + 0.36, 0.13)) * G(w - 0.1, 0.08);        // eye sockets
      d += 0.022 * (G(u - 0.36, 0.07) + G(u + 0.36, 0.07)) * G(w - 0.1, 0.035);      // eyeballs / lids
      const nt = Math.max(0, Math.min(1, (0.16 - w) / 0.36));                       // nose: ridge growing toward the tip
      d += (0.015 + 0.05 * nt) * G(u, 0.055 + 0.05 * nt) * (w < 0.18 && w > -0.24 ? 1 : G(w + 0.24, 0.03) + (w >= 0.18 ? G(w - 0.18, 0.05) : 0));
      d += 0.03 * (G(u - 0.09, 0.04) + G(u + 0.09, 0.04)) * G(w + 0.22, 0.03);       // nostril wings
      d += 0.045 * G(w + 0.36, 0.03) * G(u, 0.2);                                   // upper lip
      d -= 0.022 * G(w + 0.405, 0.012) * G(u, 0.22);                                 // mouth line
      d += 0.04 * G(w + 0.45, 0.032) * G(u, 0.17);                                   // lower lip
      d -= 0.018 * G(w + 0.51, 0.02) * G(u, 0.2);                                    // chin groove
      d += 0.05 * G(w + 0.62, 0.07) * G(u, 0.22);                                    // chin
      d += 0.02 * (G(u - 0.5, 0.12) + G(u + 0.5, 0.12)) * G(w + 0.05, 0.12);         // cheekbones
      x -= d * f * 1.7; p.setXYZ(i, x, y, z);
      for (const L of LM) { const e = (u - L.u) ** 2 + (w - L.w) ** 2; if (f > 0.5 && e < L.e) { L.e = e; L.p = [x, y, z]; } }
    }
    g.computeVertexNormals(); return g;
  }
  function lathe(prof, seg) { return new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), seg); }
  function capsule(r, len, q) { return new THREE.CapsuleGeometry(r, len, q ? 4 : 2, q ? 12 : 7); }
  function stripeTex() {
    const c = document.createElement('canvas'); c.width = 64; c.height = 256; const g = c.getContext('2d');
    for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? '#1d3f8a' : '#d8a93a'; g.fillRect(0, i * 16, 64, 16); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, i * 16 + 15, 64, 1); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  window.sphinxParts = function (lite) {
    const q = !lite, sand = [], dark = [], nem = [], gold = [], blue = [], kohl = [];
    // plinth: base, die, cornice
    sand.length; dark.push(T(new THREE.BoxGeometry(5.0, 0.35, 2.5), 0, 0.175, 0), T(new THREE.BoxGeometry(4.7, 0.55, 2.2), 0, 0.625, 0), T(new THREE.BoxGeometry(4.95, 0.12, 2.45), 0, 0.96, 0));
    const top = 1.02;
    // lion body: lathe torso (ribcage to waist to haunch) laid along x
    const torso = lathe([[0.01, -1.9], [0.38, -1.75], [0.55, -1.3], [0.6, -0.7], [0.56, -0.1], [0.5, 0.4], [0.55, 0.9], [0.6, 1.3], [0.5, 1.65], [0.25, 1.85], [0.01, 1.9]], q ? 20 : 12);
    sand.push(T(torso, 0.35, top + 0.62, 0, 0, 0, -Math.PI / 2, 1, 1, 1.05));
    sand.push(T(new THREE.SphereGeometry(0.6, q ? 16 : 10, q ? 12 : 7), -0.95, top + 0.95, 0, 0, 0, 0, 0.75, 1.15, 0.82));     // chest/shoulders
    for (const s of [-1, 1]) {
      sand.push(T(new THREE.SphereGeometry(0.55, q ? 14 : 8, q ? 10 : 6), 1.45, top + 0.55, s * 0.38, 0, 0, 0, 0.95, 0.85, 0.5));   // haunch
      sand.push(T(capsule(0.17, 0.9, q), 1.5, top + 0.17, s * 0.62, 0, 0, Math.PI / 2));                                  // folded hind leg
      sand.push(T(capsule(0.2, 1.4, q), -1.55, top + 0.2, s * 0.4, 0, 0, Math.PI / 2));                                    // foreleg
      sand.push(T(new THREE.SphereGeometry(0.24, q ? 16 : 8, q ? 10 : 6), -2.28, top + 0.15, s * 0.4, 0, 0, 0, 1.15, 0.6, 1));   // paw
      for (let k = 0; k < 4; k++) sand.push(T(new THREE.SphereGeometry(0.075, 6, 4), -2.5, top + 0.1, s * 0.4 + (k - 1.5) * 0.1, 0, 0, 0, 1.3, 0.8, 1)); // toes
    }
    const tail = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(2.15, top + 0.35, 0), new THREE.Vector3(2.0, top + 0.12, 0.45), new THREE.Vector3(1.3, top + 0.08, 0.7), new THREE.Vector3(0.6, top + 0.1, 0.72)]), q ? 16 : 8, 0.06, 6);
    sand.push(tail, T(new THREE.SphereGeometry(0.1, 8, 6), 0.55, top + 0.12, 0.72));
    // neck + head
    const hx = -1.2, hy = top + 1.95, S = 0.95;
    sand.push(T(lathe([[0.3, -0.4], [0.26, 0], [0.28, 0.35]], q ? 18 : 10), hx + 0.08, hy - 0.55, 0));
    LM = [{u: -0.36, w: 0.1, e: 9}, {u: 0.36, w: 0.1, e: 9}, {u: 0, w: -0.405, e: 9}, {u: -0.34, w: 0.24, e: 9}, {u: 0.34, w: 0.24, e: 9}];
    sand.push(T(head(q), hx, hy, 0, 0, 0, 0, S));
    const at = (L, dx) => [hx + L.p[0] * S + dx, hy + L.p[1] * S, L.p[2] * S];
    for (const k of [0, 1]) { const [ex, ey, ez] = at(LM[k], -0.018); kohl.push(T(new THREE.SphereGeometry(0.05, 10, 6), ex, ey, ez, 0, 0, 0, 0.35, 0.5, 1.5));   // kohl-lined almond eyes
      const [bx, by, bz] = at(LM[k + 3], -0.01); kohl.push(T(new THREE.CapsuleGeometry(0.012, 0.12, 2, 5), bx, by - 0.03, bz, Math.PI / 2 + (k ? 0.06 : -0.06), 0, 0)); }                // brow lines
    { const [mx, my, mz] = at(LM[2], -0.008); kohl.push(T(new THREE.CapsuleGeometry(0.009, 0.13, 2, 5), mx, my, mz, Math.PI / 2, 0, 0)); }                  // mouth line
    for (const s of [-1, 1]) sand.push(T(new THREE.SphereGeometry(0.11, 10, 6), hx + 0.08, hy + 0.02, s * 0.42 * S, 0, 0, 0, 0.5, 1.2, 0.35)); // ears in front of the lappets
    // nemes: striped cap over the skull (back 3/4 of a sphere), lappets falling to the chest, fold (queue) behind
    const cap = new THREE.SphereGeometry(0.535 * S, q ? 24 : 12, q ? 12 : 7, Math.PI * 0.28, Math.PI * 1.44, 0, Math.PI * 0.56);
    const capF = new THREE.SphereGeometry(0.535 * S, q ? 14 : 7, q ? 10 : 6, -Math.PI * 0.29, Math.PI * 0.58, 0, Math.PI * 0.39);
    nem.push(uvY(T(cap, hx + 0.03, hy + 0.04, 0, 0, 0, 0, 1.0, 1.22, 0.92), 1.3), uvY(T(capF, hx + 0.03, hy + 0.04, 0, 0, 0, 0, 1.0, 1.22, 0.92), 1.3));
    for (const s of [-1, 1]) {
      const sh = new THREE.Shape(); sh.moveTo(0.12, 0.15); sh.lineTo(0.4, 0.15); sh.lineTo(0.26, -0.95); sh.quadraticCurveTo(0.03, -1.03, -0.2, -0.95); sh.lineTo(0.12, 0.15);
      const lp = new THREE.ExtrudeGeometry(sh, {depth: 0.1, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 1, curveSegments: q ? 5 : 2});
      T(lp, 0, 0, -0.05, -s * 0.16, 0, 0); T(lp, hx - 0.02, hy - 0.05, s * 0.47 * S);
      nem.push(uvY(lp, 1.3));
      const wing = lathe([[0.3, -0.35], [0.36, 0.0], [0.3, 0.32]], q ? 12 : 6); nem.push(uvY(T(wing, hx + 0.12, hy + 0.0, s * 0.33 * S, 0, 0, 0, 0.6, 1, 0.45), 1.3));   // flare behind the ears
    }
    const queue = lathe([[0.04, -0.95], [0.1, -0.75], [0.15, -0.35], [0.2, 0.0], [0.24, 0.2], [0.1, 0.32]], q ? 12 : 7); nem.push(uvY(T(queue, hx + 0.42, hy - 0.2, 0, 0, 0, -0.35, 1, 1, 0.8), 1.3));
    { const band = new THREE.TorusGeometry(0.5 * S, 0.035, 5, q ? 24 : 12, Math.PI); T(band, 0, 0, 0, -Math.PI / 2); T(band, 0, 0, 0, 0, Math.PI / 2); gold.push(T(band, hx + 0.03, hy + 0.2, 0, 0, 0, 0, 1.0, 1.0, 0.9)); }   // gold brow band
    // uraeus: rearing cobra on the brow with a flared hood
    const cob = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(hx - 0.3, hy + 0.42, 0), new THREE.Vector3(hx - 0.44, hy + 0.3, 0), new THREE.Vector3(hx - 0.5, hy + 0.33, 0), new THREE.Vector3(hx - 0.51, hy + 0.41, 0)]), 10, 0.018, 6);
    gold.push(cob, T(new THREE.SphereGeometry(0.045, 10, 8), hx - 0.515, hy + 0.41, 0, 0, 0, 0, 0.4, 1.25, 1.15), T(new THREE.SphereGeometry(0.02, 8, 6), hx - 0.535, hy + 0.47, 0));
    // false beard: braided taper under the chin
    blue.push(uvY(T(lathe([[0.05, -0.32], [0.075, -0.15], [0.07, 0.0], [0.055, 0.06]], q ? 10 : 6), hx - 0.25, hy - 0.72, 0, 0, 0, 0.35), 2.5));
    return {sand: merge(sand), dark: merge(dark), nem: merge(nem), gold: merge(gold), blue: merge(blue), kohl: merge(kohl), stripe: stripeTex()};
  };
})();
