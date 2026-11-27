// Shared kit for the World rooms (nz, australia, samoa, hawaii, royal). Low-poly, vertex-coloured pieces merged into one mesh per kit
// (one draw call for a whole room's scenery), canvas-text panels, laser buttons, friendly stylized figures (not likenesses).
export function kit(T) {
  const parts = [], M = new T.Matrix4(), Q = new T.Quaternion(), E = new T.Euler(), P = new T.Vector3(), S = new T.Vector3(), C = new T.Color();
  const D = Math.PI / 180;
  function add(geo, color, p, r, s, frame) {
    E.set((r && r[0] || 0) * D, (r && r[1] || 0) * D, (r && r[2] || 0) * D, 'YXZ'); Q.setFromEuler(E);
    P.set(p ? p[0] : 0, p ? p[1] : 0, p ? p[2] : 0); S.set(s ? s[0] : 1, s ? s[1] : 1, s ? s[2] : 1);
    const m = new T.Matrix4().compose(P, Q, S); if (frame) m.premultiply(frame);
    parts.push([geo, color, m]); return K;
  }
  const K = {
    add,
    box: (w, h, d, c, p, r, f) => add(new T.BoxGeometry(w, h, d), c, p, r, null, f),
    cyl: (rt, rb, h, c, p, seg, r, f) => add(new T.CylinderGeometry(rt, rb, h, seg || 8, 1), c, p, r, null, f),
    cone: (rad, h, c, p, seg, r, f) => add(new T.ConeGeometry(rad, h, seg || 7, 1), c, p, r, null, f),
    sph: (rad, c, p, s, seg, r, f) => add(new T.SphereGeometry(rad, seg || 8, Math.max(4, (seg || 8) >> 1)), c, p, r, s, f),
    ico: (rad, c, p, s, r, f) => add(new T.IcosahedronGeometry(rad, 0), c, p, r, s, f),
    frame: (x, y, z, ry, sc) => new T.Matrix4().compose(new T.Vector3(x, y, z), new T.Quaternion().setFromEuler(new T.Euler(0, (ry || 0) * D, 0)), new T.Vector3(sc || 1, sc || 1, sc || 1)),
    // jitter: per-vertex colour noise for a hand-painted low-poly look
    build(opt) {
      opt = opt || {}; let n = 0; const list = parts.map(([g, c, m]) => { const q = g.index ? g.toNonIndexed() : g; if (q !== g) g.dispose(); q.applyMatrix4(m); n += q.attributes.position.count; return [q, c]; });
      const pos = new Float32Array(n * 3), col = new Float32Array(n * 3); let o = 0;
      for (const [q, c] of list) { const a = q.attributes.position.array; pos.set(a, o * 3); C.set(c);
        const j = opt.jitter || 0;
        for (let i = 0; i < q.attributes.position.count; i += 3) { const k = 1 + (Math.random() - 0.5) * j; for (let v = 0; v < 3; v++) { const w = (o + i + v) * 3; col[w] = C.r * k; col[w + 1] = C.g * k; col[w + 2] = C.b * k; } }
        o += q.attributes.position.count; q.dispose(); }
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('color', new T.BufferAttribute(col, 3)); g.computeVertexNormals();
      parts.length = 0;
      return new T.Mesh(g, new T.MeshLambertMaterial({vertexColors: true, side: opt.side || T.FrontSide}));
    }
  };
  return K;
}

// sky dome (gradient, no fog) + hemisphere + sun
export function skyAndLight(T, g, top, horizon, ground, sunDir, sunI) {
  const geo = new T.SphereGeometry(1500, 24, 12), c = [], a = new T.Color(top), b = new T.Color(horizon), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const t = Math.max(0, p.getY(i) / 1500), k = Math.pow(t, 0.55); const x = b.clone().lerp(a, k); c.push(x.r, x.g, x.b); }
  geo.setAttribute('color', new T.Float32BufferAttribute(c, 3));
  const sky = new T.Mesh(geo, new T.MeshBasicMaterial({vertexColors: true, side: T.BackSide, fog: false, depthWrite: false})); sky.renderOrder = -10; g.add(sky);
  g.add(new T.HemisphereLight(0xffffff, ground || 0x556644, 1.15));
  const s = new T.DirectionalLight(0xfff4e0, sunI || 1.4); s.position.set(...(sunDir || [40, 80, 30])); g.add(s);
  return sky;
}

export function flat(T, g, r, color, y, seg) {   // big flat disc (ground or water)
  const m = new T.Mesh(new T.CircleGeometry(r, seg || 40), new T.MeshLambertMaterial({color})); m.rotation.x = -Math.PI / 2; m.position.y = y || 0; g.add(m); return m;
}
export function water(T, g, w, d, x, z, color, y) {
  const m = new T.Mesh(new T.PlaneGeometry(w, d, 1, 1), new T.MeshPhongMaterial({color, shininess: 80, specular: 0x88aacc})); m.rotation.x = -Math.PI / 2; m.position.set(x, y || 0, z); g.add(m); return m;
}

// canvas text panel. lines: strings; first line is the title. Returns the mesh (already added to g).
export function panel(T, g, lines, o) {
  o = o || {}; const W = o.px || 1024, Hh = o.pxh || 640, cv = document.createElement('canvas'); cv.width = W; cv.height = Hh; const x = cv.getContext('2d');
  x.fillStyle = o.bg || '#132a33'; x.fillRect(0, 0, W, Hh); x.strokeStyle = o.edge || '#d4af37'; x.lineWidth = 10; x.strokeRect(5, 5, W - 10, Hh - 10);
  let y = 30; const pad = 44, fs = o.fs || 34;
  lines.forEach((l, i) => { const big = i === 0; x.font = (big ? 'bold ' + Math.round(fs * 1.45) : fs) + 'px Georgia, serif'; x.fillStyle = big ? (o.title || '#ffd700') : (o.fg || '#f4ecd8');
    const words = String(l).split(' '); let line = ''; const lh = (big ? fs * 1.45 : fs) * 1.28; if (!big && i > 0) y += fs * 0.25;
    for (const w of words) { const t = line ? line + ' ' + w : w; if (x.measureText(t).width > W - pad * 2 && line) { y += lh; x.fillText(line, pad, y); line = w; } else line = t; }
    y += lh; x.fillText(line, pad, y); });
  const tex = new T.CanvasTexture(cv); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 4;
  const w = o.w || 2.4, h = w * Hh / W, m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({map: tex, side: T.DoubleSide, fog: false}));
  m.position.set(...(o.p || [0, 1.6, 0])); m.rotation.y = (o.ry || 0) * Math.PI / 180; g.add(m);
  if (o.post !== false) { const ph = m.position.y - h / 2; if (ph > 0.05) { const pz = new T.Mesh(new T.BoxGeometry(0.08, ph, 0.08), new T.MeshLambertMaterial({color: o.postColor || 0x3a2a1a})); pz.position.set(0, -h / 2 - ph / 2, -0.03); m.add(pz); } }
  return m;
}
// floating name tag
export function tag(T, g, text, p, ry) {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 72; const x = cv.getContext('2d');
  x.fillStyle = 'rgba(10,20,30,0.75)'; x.beginPath(); x.roundRect ? x.roundRect(2, 2, 252, 68, 24) : x.rect(2, 2, 252, 68); x.fill();
  x.font = 'bold 44px system-ui, sans-serif'; x.textAlign = 'center'; x.fillStyle = '#ffe9a8'; x.fillText(text, 128, 52);
  const tex = new T.CanvasTexture(cv); tex.colorSpace = T.SRGBColorSpace;
  const m = new T.Mesh(new T.PlaneGeometry(0.6, 0.17), new T.MeshBasicMaterial({map: tex, transparent: true, side: T.DoubleSide, fog: false, depthWrite: false}));
  m.position.set(...p); m.rotation.y = (ry || 0) * Math.PI / 180; g.add(m); return m;
}

// laser / mouse button (A-Frame .btn entity under rootEl)
export function button(rootEl, label, p, ry, color, fn, w) {
  const b = document.createElement('a-plane'); b.className = 'btn'; b.setAttribute('width', w || 1.5); b.setAttribute('height', 0.3);
  b.setAttribute('position', p.join(' ')); b.setAttribute('rotation', '0 ' + (ry || 0) + ' 0'); b.setAttribute('material', 'shader:flat;side:double;color:' + (color || '#FFD700'));
  const t = document.createElement('a-text'); t.setAttribute('value', label); t.setAttribute('align', 'center'); t.setAttribute('color', '#111'); t.setAttribute('width', (w || 1.5) * 1.75); t.setAttribute('position', '0 0 0.01');
  b.appendChild(t); b.addEventListener('click', fn); rootEl.appendChild(b); return b;
}
// travel post: "Fowling Pond" + the other rooms
export function navPost(rootEl, here, p, ry) {
  const WR = window.FP_WORLDROOMS; if (!WR) return;
  const list = WR.ROOMS.filter(r => r[0] !== here), x0 = p[0], y0 = p[1], z0 = p[2], a = (ry || 0) * Math.PI / 180;
  const at = (dx, dy) => [x0 + Math.cos(a) * dx, y0 + dy, z0 - Math.sin(a) * dx];
  button(rootEl, 'Back to Fowling Pond', at(0, 0.42), ry, '#9ffcff', () => WR.home(), 1.9);
  list.forEach((r, i) => button(rootEl, r[1], at((i % 2 ? 0.82 : -0.82), -0.0 - Math.floor(i / 2) * 0.36), ry, '#FFD700', () => WR.go(r[0]), 1.55));
}

// ---------- friendly stylized figures (simple shapes, no faces copied from anyone) ----------
// o: {skin, hair, hairStyle:'bob'|'long'|'pony'|'short', top, bottom, dress, shoes, h (height m), male}
export function person(K, f, o) {
  const s = (o.h || 1.68) / 1.68, sk = o.skin;
  const legC = o.dress ? sk : o.bottom;
  // legs + shoes
  for (const sx of [-0.09, 0.09]) { K.cyl(0.055 * s, 0.05 * s, 0.78 * s, legC, [sx * s, 0.43 * s, 0], 6, null, f); K.box(0.1 * s, 0.07 * s, 0.2 * s, o.shoes || 0x3a2a22, [sx * s, 0.035 * s, 0.03 * s], null, f); }
  if (o.dress) K.cyl(0.17 * s, 0.3 * s, 0.55 * s, o.bottom, [0, 0.72 * s, 0], 9, null, f);
  else K.cyl(0.17 * s, 0.17 * s, 0.22 * s, o.bottom, [0, 0.86 * s, 0], 8, null, f);
  // torso
  K.cyl((o.male ? 0.21 : 0.17) * s, (o.male ? 0.18 : 0.15) * s, 0.5 * s, o.top, [0, 1.18 * s, 0], 8, null, f);
  K.sph(0.06 * s, sk, [0, 1.46 * s, 0], [1, 1.2, 1], 6, null, f);   // neck
  // arms (relaxed) unless armless (animated separately)
  const ax = (o.male ? 0.25 : 0.21) * s;
  if (!o.noRightArm) K.cyl(0.045 * s, 0.04 * s, 0.6 * s, sk, [ax, 1.1 * s, 0], 6, [0, 0, 6], f);
  if (!o.noLeftArm) K.cyl(0.045 * s, 0.04 * s, 0.6 * s, sk, [-ax, 1.1 * s, 0], 6, [0, 0, -6], f);
  K.sph(0.07 * s, o.top, [ax, 1.38 * s, 0], null, 6, null, f); K.sph(0.07 * s, o.top, [-ax, 1.38 * s, 0], null, 6, null, f);   // sleeves
  // head
  K.sph(0.115 * s, sk, [0, 1.6 * s, 0], [1, 1.12, 1], 10, null, f);
  K.sph(0.016 * s, 0x2a2a35, [-0.04 * s, 1.62 * s, 0.103 * s], null, 4, null, f); K.sph(0.016 * s, 0x2a2a35, [0.04 * s, 1.62 * s, 0.103 * s], null, 4, null, f);   // eyes
  K.box(0.05 * s, 0.012 * s, 0.01 * s, 0xb0574f, [0, 1.555 * s, 0.11 * s], null, f);   // smile
  const h = o.hair;
  K.sph(0.125 * s, h, [0, 1.65 * s, -0.012 * s], [1.02, 0.9, 1.04], 10, null, f);   // cap
  if (o.hairStyle === 'bob') { K.cyl(0.13 * s, 0.14 * s, 0.2 * s, h, [0, 1.52 * s, -0.035 * s], 10, null, f); }
  if (o.hairStyle === 'long') { K.box(0.25 * s, 0.4 * s, 0.09 * s, h, [0, 1.42 * s, -0.08 * s], null, f); }
  if (o.hairStyle === 'pony') { K.sph(0.06 * s, h, [0, 1.6 * s, -0.14 * s], null, 6, null, f); K.cone(0.05 * s, 0.3 * s, h, [0, 1.42 * s, -0.17 * s], 6, [180, 0, 0], f); }
}
export function dog(K, f, o) {   // stocky friendly dog, white by default
  const c = o.color || 0xf6f3ee, s = o.s || 1;
  K.sph(0.2 * s, c, [0, 0.42 * s, 0], [1, 0.95, 1.7], 8, null, f);        // body
  K.sph(0.15 * s, c, [0, 0.44 * s, 0.25 * s], [1.15, 1.05, 1], 8, null, f);  // chest
  for (const [x, z] of [[-0.1, 0.22], [0.1, 0.22], [-0.1, -0.22], [0.1, -0.22]]) K.cyl(0.045 * s, 0.04 * s, 0.32 * s, c, [x * s, 0.16 * s, z * s], 6, null, f);
  K.sph(0.13 * s, c, [0, 0.62 * s, 0.42 * s], [1.15, 1, 1.05], 8, null, f);  // broad head
  K.box(0.13 * s, 0.09 * s, 0.13 * s, c, [0, 0.58 * s, 0.53 * s], null, f);  // muzzle
  K.sph(0.03 * s, 0xd98c8c, [0, 0.6 * s, 0.6 * s], null, 5, null, f);       // pink nose
  K.sph(0.018 * s, 0x2a2420, [-0.055 * s, 0.67 * s, 0.53 * s], null, 4, null, f); K.sph(0.018 * s, 0x2a2420, [0.055 * s, 0.67 * s, 0.53 * s], null, 4, null, f);
  K.cone(0.05 * s, 0.09 * s, 0xf0d6d0, [-0.09 * s, 0.74 * s, 0.4 * s], 4, [0, 0, 20], f); K.cone(0.05 * s, 0.09 * s, 0xf0d6d0, [0.09 * s, 0.74 * s, 0.4 * s], 4, [0, 0, -20], f);   // ears
  K.box(0.2 * s, 0.035 * s, 0.05 * s, o.collar || 0x2a62c8, [0, 0.55 * s, 0.33 * s], [20, 0, 0], f);   // collar
}
// per-frame hook: an A-Frame entity under rootEl ticks fn(dtSeconds); it goes away with the room
export function animate(rootEl, fn) {
  if (!AFRAME.components['wr-tick']) AFRAME.registerComponent('wr-tick', {tick(t, dt) { if (this.el._fn) this.el._fn(Math.min(0.1, (dt || 16) / 1000)); }});
  const e = document.createElement('a-entity'); e._fn = fn; e.setAttribute('wr-tick', ''); rootEl.appendChild(e); return e;
}
