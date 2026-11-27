/* Family home (staging, Nov 27 2026; v3 storybook pass): a fictional lakeside cottage with a yard and a play area, for the companion
   family (C's companion module places the wife and kids from window.FP_HOME). Shared exhibit module like w3d/exhibits/*: needs only
   global THREE, no scene / renderer / XR of its own. FPX.familyhome.build(opts) -> {group, spawns, floors, walls, update(t), dispose()};
   opts.ground(xLocal, zLocal) -> yLocal (default flat). See fx/fphome.js for the Fowling Pond host.
   Look: tiny shared procedural canvas textures (clapboard, shingles, brick, planks, stone, grass) tinted by vertex colours with baked
   ambient occlusion; one draw call per material (~14). No real-time lights, only the house shell casts a shadow.
   Local frame: house centred on the origin, front door facing -z, floor at y = FY. The only label is "Home" (fictional house). */
(function () {
  'use strict';
  const FPX = window.FPX = window.FPX || {};
  if (FPX.familyhome && FPX.familyhome.version >= 3) return;
  const FY = 0.6, WH = 2.9, T = 0.2, HW = 6, HD = 4.5;
  const LOT = {x0: -22, x1: 22, z0: -18, z1: 20};
  const PLAY = {x: 14, z: -6.5};
  const C = {siding: '#f3ead6', trim: '#fbfaf5', roof: '#5e5048', stone: '#a49a8c', deck: '#b08a62', door: '#9c2f25', brick: '#a65a44', shutter: '#5f7d68',
    floor: '#b4865a', rug: '#9a4a36', rug2: '#e6cf9f', sofa: '#b8664a', chair: '#d9a441', cream: '#efe4cc', counter: '#e9e4d8', cab: '#8faa94', steel: '#c9c6bd',
    dark: '#3b2f28', trunk: '#6b5038', leaf: ['#5e9440', '#6ba646', '#558a3a', '#78ad4c'], sand: '#e8d6a6', mulch: '#7b5a40', wood: '#c08a55',
    red: '#d2453a', yellow: '#f2c230', blue: '#7fb2d6', green: '#4f9a5a', curtain: '#c9614e', curtain2: '#7f9e88'};
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;

  /* ---------- tiny shared textures (near-white detail, coloured by vertex colours) ---------- */
  let TEX = null;
  function cv(n, draw) { const c = document.createElement('canvas'); c.width = c.height = n; const g = c.getContext('2d'); draw(g, n);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
  const noise = (g, n, k, a) => { for (let i = 0; i < k; i++) { const v = Math.random(); g.fillStyle = v > 0.5 ? 'rgba(255,255,255,' + a + ')' : 'rgba(0,0,0,' + a + ')'; g.fillRect(Math.random() * n, Math.random() * n, 1 + Math.random() * 2, 1 + Math.random() * 2); } };
  function textures() {
    if (TEX) return TEX;
    TEX = {
      plain: cv(64, (g, n) => { g.fillStyle = '#f4f4f4'; g.fillRect(0, 0, n, n); noise(g, n, 500, 0.04); }),
      clap: cv(128, (g, n) => { for (let i = 0; i < 4; i++) { const y = i * 32, gr = g.createLinearGradient(0, y, 0, y + 32); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.85, '#e9e9e9'); gr.addColorStop(1, '#a9a9a9');
        g.fillStyle = gr; g.fillRect(0, y, n, 32); } noise(g, n, 400, 0.03); }),
      shingle: cv(128, (g, n) => { g.fillStyle = '#6a6a6a'; g.fillRect(0, 0, n, n); for (let r = 0; r < 4; r++) { const y = r * 32, off = (r % 2) * 16;
        for (let x = -32; x < n + 32; x += 32) { const w = 26 + Math.random() * 10, v = 200 + Math.random() * 55 | 0; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x + off, y + 1, w - 2, 29);
          g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x + off, y + 26, w - 2, 4); } } noise(g, n, 600, 0.05); }),
      brick: cv(128, (g, n) => { g.fillStyle = '#d8d2c8'; g.fillRect(0, 0, n, n); for (let r = 0; r < 8; r++) { const off = (r % 2) * 16; for (let x = -32; x < n; x += 32) { const v = 175 + Math.random() * 80 | 0;
        g.fillStyle = `rgb(${v},${v * 0.97 | 0},${v * 0.95 | 0})`; g.fillRect(x + off + 1, r * 16 + 1, 30, 14); } } noise(g, n, 500, 0.06); }),
      plank: cv(128, (g, n) => { for (let i = 0; i < 6; i++) { const v = 205 + Math.random() * 50 | 0; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(0, i * n / 6, n, n / 6);
        g.strokeStyle = 'rgba(0,0,0,0.08)'; for (let k = 0; k < 5; k++) { g.beginPath(); const y = i * n / 6 + 3 + Math.random() * 15; g.moveTo(0, y); g.bezierCurveTo(40, y + 3, 80, y - 3, n, y); g.stroke(); }
        g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, (i + 1) * n / 6 - 1.5, n, 1.5); g.fillRect(((i * 53) % n), i * n / 6, 1.5, n / 6); } }),
      stone: cv(128, (g, n) => { g.fillStyle = '#8c8c8c'; g.fillRect(0, 0, n, n); for (let i = 0; i < 26; i++) { const x = Math.random() * n, y = Math.random() * n, r = 10 + Math.random() * 14, v = 190 + Math.random() * 60 | 0;
        g.fillStyle = `rgb(${v},${v},${v - 6})`; for (const [dx, dy] of [[0, 0], [n, 0], [-n, 0], [0, n], [0, -n]]) { g.beginPath(); g.ellipse(x + dx, y + dy, r, r * 0.75, Math.random(), 0, 7); g.fill(); } } noise(g, n, 600, 0.05); }),
      grass: cv(128, (g, n) => { g.fillStyle = '#e8e8e8'; g.fillRect(0, 0, n, n); for (let i = 0; i < 1600; i++) { const v = 180 + Math.random() * 75 | 0; g.fillStyle = `rgba(${v},${v},${v},0.8)`;
        const x = Math.random() * n, y = Math.random() * n; g.fillRect(x, y, 1, 2 + Math.random() * 3); } })
    };
    return TEX;
  }

  /* ---------- merged parts: vertex colours + baked AO + triplanar UVs ---------- */
  function Parts(tile) { const list = [], m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), col = new THREE.Color(); tile = tile || 1;
    const P = {
      add(geo, color, x, y, z, rx, ry, rz, sx, sy, sz, ao) { e.set(rx || 0, ry || 0, rz || 0, 'YXZ'); q.setFromEuler(e); m4.compose(new THREE.Vector3(x || 0, y || 0, z || 0), q, new THREE.Vector3(sx || 1, sy || 1, sz || 1));
        const g = geo.index ? geo.toNonIndexed() : geo.clone(); g.applyMatrix4(m4); g.deleteAttribute('uv'); if (!g.attributes.normal) g.computeVertexNormals(); list.push([g, color, ao]); geo.dispose(); return P; },
      box(w, h, d, x, y, z, color, ry, rx, rz, ao) { return P.add(new THREE.BoxGeometry(w, h, d), color, x, y, z, rx, ry, rz, 1, 1, 1, ao); },
      cyl(r0, r1, h, seg, x, y, z, color, rx, ry, rz, ao) { return P.add(new THREE.CylinderGeometry(r0, r1, h, seg || 8, 1, false), color, x, y, z, rx, ry, rz, 1, 1, 1, ao); },
      ball(r, det, x, y, z, color, sy, ao) { return P.add(new THREE.IcosahedronGeometry(r, det == null ? 1 : det), color, x, y, z, 0, rnd() * 6, 0, 1, sy || 1, 1, ao); },
      raw(pos, color, ao) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); list.push([g, color, ao]); return P; },
      count() { return list.length; },
      geometry(aoFn) { let n = 0; for (const [g] of list) n += g.attributes.position.count;
        const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), clr = new Float32Array(n * 3), uv = new Float32Array(n * 2); let o = 0;
        for (const [g, c, ao] of list) { const p = g.attributes.position, nn = g.attributes.normal; col.set(c); const f = ao || aoFn;
          for (let i = 0; i < p.count; i++, o++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), nx = nn.getX(i), ny = nn.getY(i), nz = nn.getZ(i);
            pos[o * 3] = x; pos[o * 3 + 1] = y; pos[o * 3 + 2] = z; nor[o * 3] = nx; nor[o * 3 + 1] = ny; nor[o * 3 + 2] = nz;
            const ax = Math.abs(nx), ay = Math.abs(ny), az = Math.abs(nz);
            if (ay >= ax && ay >= az) { uv[o * 2] = x / tile; uv[o * 2 + 1] = z / tile; } else if (ax >= az) { uv[o * 2] = z / tile; uv[o * 2 + 1] = y / tile; } else { uv[o * 2] = x / tile; uv[o * 2 + 1] = y / tile; }
            const k = f ? f(x, y, z, ny) : 1; clr[o * 3] = col.r * k; clr[o * 3 + 1] = col.g * k; clr[o * 3 + 2] = col.b * k; } g.dispose(); }
        const G = new THREE.BufferGeometry(); G.setAttribute('position', new THREE.BufferAttribute(pos, 3)); G.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); G.setAttribute('color', new THREE.BufferAttribute(clr, 3)); G.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
        G.computeBoundingSphere(); list.length = 0; return G; } };
    return P; }

  function label(text) { const c = document.createElement('canvas'); c.width = 512; c.height = 176; const g = c.getContext('2d');
    g.fillStyle = '#4f6b58'; g.beginPath(); g.roundRect ? g.roundRect(4, 4, 504, 168, 40) : g.rect(4, 4, 504, 168); g.fill(); g.strokeStyle = '#e9d9a8'; g.lineWidth = 8; g.stroke();
    g.fillStyle = '#fbf3d9'; g.font = 'italic bold 100px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 256, 92);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
  function picketTex() { const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d');
    for (let i = 0; i < 4; i++) { const x = i * 64 + 16; const gr = g.createLinearGradient(x, 0, x + 32, 0); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#dcdcd4'); g.fillStyle = gr;
      g.beginPath(); g.moveTo(x, 128); g.lineTo(x, 24); g.lineTo(x + 16, 6); g.lineTo(x + 32, 24); g.lineTo(x + 32, 128); g.fill(); }
    g.fillStyle = '#e6e6de'; g.fillRect(0, 38, 256, 10); g.fillRect(0, 98, 256, 10); g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, 48, 256, 2); g.fillRect(0, 108, 256, 2);
    const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
  /* generic landscape paintings (no people): 4 slots in a 512 x 128 atlas */
  function paintings() { const c = document.createElement('canvas'); c.width = 512; c.height = 128; const g = c.getContext('2d');
    const P = [['#f6c27a', '#f3e1b8', '#6f9a5b', '#3f6b4a', '#ffd27a'], ['#8fc0e8', '#d9ecf7', '#5a8fb0', '#2f5e7a', '#ffffff'], ['#e88f6a', '#f6d1a0', '#8a7a9a', '#4a4a6a', '#ffe6a0'], ['#b9d9a0', '#eef6d8', '#7aa860', '#4b7a3a', '#fff3c0']];
    P.forEach((p, i) => { const x0 = i * 128; const gr = g.createLinearGradient(0, 0, 0, 80); gr.addColorStop(0, p[0]); gr.addColorStop(1, p[1]); g.fillStyle = gr; g.fillRect(x0, 0, 128, 128);
      g.fillStyle = p[4]; g.beginPath(); g.arc(x0 + 30 + i * 14, 34, 11, 0, 7); g.fill();
      g.fillStyle = p[2]; g.beginPath(); g.moveTo(x0, 90); g.quadraticCurveTo(x0 + 40, 50, x0 + 80, 80); g.quadraticCurveTo(x0 + 105, 62, x0 + 128, 74); g.lineTo(x0 + 128, 128); g.lineTo(x0, 128); g.fill();
      g.fillStyle = p[3]; g.beginPath(); g.moveTo(x0, 108); g.quadraticCurveTo(x0 + 64, 84, x0 + 128, 104); g.lineTo(x0 + 128, 128); g.lineTo(x0, 128); g.fill();
      if (i === 1) { g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(x0 + 70, 96); g.lineTo(x0 + 70, 70); g.lineTo(x0 + 86, 96); g.fill(); }
      for (let k = 0; k < 4; k++) { g.fillStyle = p[3]; g.beginPath(); g.ellipse(x0 + 10 + k * 9 + (i * 23) % 60, 98 - k, 4, 9, 0, 0, 7); g.fill(); } });
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }

  function build(opts) {
    opts = opts || {}; seed = 11; const lite = !!opts.lite, gl = typeof opts.ground === 'function' ? (x, z) => { const v = opts.ground(x, z); return isFinite(v) ? v : 0; } : () => 0;
    const X = textures(), group = new THREE.Group(); group.name = 'family-home';
    const mats = [], geos = [], texs = [];
    const keep = m => { mats.push(m.material); geos.push(m.geometry); return m; };
    const lam = (map, o) => new THREE.MeshLambertMaterial(Object.assign({vertexColors: true, map}, o || {}));
    /* part sets */
    const P = {clap: Parts(0.6), shingle: Parts(1.0), brick: Parts(0.8), plank: Parts(1.2), stone: Parts(1.4), plain: Parts(1.5), glow: Parts(1),
      inPlain: Parts(1.5), inPlank: Parts(1.6), nature: Parts(2)};
    // baked AO: darker toward the ground (exterior) / floor (interior), a touch darker under the eaves
    const aoExt = (x, y, z) => { const g = gl(x, z); return (0.62 + 0.38 * clamp01((y - g) / 1.4)) * (1 - 0.12 * clamp01((y - (FY + WH - 0.5)) / 0.5) * (y < FY + WH + 0.05 ? 1 : 0)); };
    const aoIn = (x, y, z, ny) => (0.78 + 0.22 * clamp01((y - FY) / 1.1)) * (ny < -0.5 ? 0.85 : 1);
    const aoNat = (x, y, z, ny) => { const g = gl(x, z); return (0.74 + 0.26 * clamp01((y - g) / 2.5)) * (ny > 0.3 ? 1.12 : ny < -0.3 ? 0.84 : 1); };
    const aoLow = (x, y, z) => 0.7 + 0.3 * clamp01((y - gl(x, z)) / 1.0);

    /* ---------- house shell ---------- */
    const gMin = Math.min(gl(-HW, -HD - 3), gl(HW, -HD - 3), gl(-HW, HD), gl(HW, HD), gl(0, 0), gl(0, -HD - 3.5));
    const footD = Math.max(0.8, FY - gMin + 0.5);
    P.stone.box(HW * 2 + 0.4, footD, HD * 2 + 0.4, 0, FY - 0.08 - footD / 2, 0, C.stone);                         // stone foundation skirt into the ground
    P.plain.box(HW * 2 + 0.46, 0.1, HD * 2 + 0.46, 0, FY - 0.05, 0, C.trim);                                     // water table board
    const front = [{a: -0.55, b: 0.55, y0: 0, y1: 2.2}, {a: -4.3, b: -2.9, y0: 0.85, y1: 2.25}, {a: 2.9, b: 4.3, y0: 0.85, y1: 2.25}];
    const back = [{a: 0.7, b: 1.7, y0: 0, y1: 2.15}, {a: -4.3, b: -2.9, y0: 0.85, y1: 2.25}, {a: 2.8, b: 4.0, y0: 1.0, y1: 2.15}];
    const side = [{a: -2.6, b: -1.4, y0: 0.85, y1: 2.25}, {a: 1.3, b: 2.5, y0: 0.85, y1: 2.25}];
    const wall = (axis, at, a, b, holes) => { const seg = (s0, s1, y0, y1) => { if (s1 - s0 < 0.01 || y1 - y0 < 0.01) return; const L = s1 - s0, c = (s0 + s1) / 2, ym = FY + (y0 + y1) / 2;
        if (axis === 'x') P.clap.box(L, y1 - y0, T, c, ym, at, C.siding, 0, 0, 0, aoExt); else P.clap.box(T, y1 - y0, L, at, ym, c, C.siding, 0, 0, 0, aoExt); };
      let s = a; for (const h of holes.slice().sort((p, q) => p.a - q.a)) { seg(s, h.a, 0, WH); seg(h.a, h.b, 0, h.y0); seg(h.a, h.b, h.y1, WH); s = h.b; } seg(s, b, 0, WH); };
    wall('x', -HD, -HW - T / 2, HW + T / 2, front); wall('x', HD, -HW - T / 2, HW + T / 2, back); wall('z', -HW, -HD + T / 2, HD - T / 2, side); wall('z', HW, -HD + T / 2, HD - T / 2, side);
    const glowC = ['#ffd38a', '#ffcb7c', '#ffdc9c', '#ffd085'];
    let wi = 0;
    const windowAt = (axis, at, c, w, y0, y1, out, shut, box) => {   // trim frame, sill, muntins, warm glass, curtains inside; optional shutters + flower box
      const h = y1 - y0, ym = FY + (y0 + y1) / 2, o = out * (T / 2 + 0.03);
      const B = (set, W, Hh, D, x, yy, d, col, ao) => axis === 'x' ? set.box(W, Hh, D, x, yy, at + d, col, 0, 0, 0, ao) : set.box(D, Hh, W, at + d, yy, x, col, 0, 0, 0, ao);
      B(P.plain, w + 0.32, 0.16, 0.07, c, FY + y1 + 0.08, o, C.trim); B(P.plain, w + 0.4, 0.07, 0.2, c, FY + y0 - 0.035, out * (T / 2 + 0.07), C.trim);   // head + sill
      B(P.plain, 0.13, h, 0.07, c - w / 2 - 0.065, ym, o, C.trim); B(P.plain, 0.13, h, 0.07, c + w / 2 + 0.065, ym, o, C.trim);
      B(P.plain, 0.045, h, 0.04, c, ym, out * (T / 2 + 0.01), C.trim); B(P.plain, w, 0.045, 0.04, c, FY + y0 + h * 0.55, out * (T / 2 + 0.01), C.trim);   // muntins
      const gc = glowC[wi++ % 4]; for (const s of [1, -1]) B(P.glow, w, h, 0.01, c, ym, s * (T / 2 - 0.02) * (s === out ? 1 : 1), gc);
      if (shut) for (const s of [-1, 1]) { B(P.plain, 0.48, h + 0.1, 0.05, c + s * (w / 2 + 0.42), ym, out * (T / 2 + 0.04), C.shutter); for (let k = 0; k < 2; k++) B(P.plain, 0.36, 0.035, 0.03, c + s * (w / 2 + 0.42), ym - 0.3 + k * 0.6, out * (T / 2 + 0.07), '#4d6a56'); }
      if (box) { B(P.plank, w + 0.2, 0.24, 0.26, c, FY + y0 - 0.2, out * (T / 2 + 0.16), '#7f6043', aoLow);
        for (let k = 0; k < 7; k++) { const xx = c - w / 2 + 0.05 + k * (w - 0.1) / 6; const col = ['#e05a6a', '#f6d34a', '#ffffff', '#e98fb0'][k % 4];
          if (axis === 'x') { P.nature.ball(0.11, 0, xx, FY + y0 - 0.04, at + out * (T / 2 + 0.16), C.leaf[k % 4]); P.nature.ball(0.06, 0, xx + 0.04, FY + y0 + 0.04, at + out * (T / 2 + 0.2), col); } } }
      // curtains (inside)
      const ci = -out * (T / 2 + 0.04), cc = (wi % 2) ? C.curtain : C.curtain2;
      for (const s of [-1, 1]) B(P.inPlain, 0.32, h + 0.45, 0.05, c + s * (w / 2 + 0.12), ym + 0.12, ci, cc, aoIn);
      B(P.inPlain, w + 0.9, 0.035, 0.035, c, FY + y1 + 0.32, ci - out * 0.02, C.dark); };
    front.slice(1).forEach(h => windowAt('x', -HD, (h.a + h.b) / 2, h.b - h.a, h.y0, h.y1, -1, true, true));
    back.slice(1).forEach(h => windowAt('x', HD, (h.a + h.b) / 2, h.b - h.a, h.y0, h.y1, 1, true, false));
    for (const sx of [-1, 1]) side.forEach(h => windowAt('z', sx * HW, (h.a + h.b) / 2, h.b - h.a, h.y0, h.y1, sx, true, false));
    for (const [x, z] of [[-HW, -HD], [HW, -HD], [-HW, HD], [HW, HD]]) P.plain.box(0.28, WH + 0.02, 0.28, x, FY + WH / 2, z, C.trim);   // corner boards
    // front door: paneled, open into the hall; trim + transom glow; back door open
    { const a = 1.2, hx = -0.55, cx = hx + 0.53 * Math.cos(a), cz = -HD + 0.53 * Math.sin(a);
      P.plain.box(1.06, 2.16, 0.06, cx, FY + 1.08, cz, C.door, -a);
      for (const [u, v] of [[-0.22, 0.55], [0.22, 0.55], [-0.22, 1.5], [0.22, 1.5]]) P.plain.box(0.34, v < 1 ? 0.7 : 0.8, 0.02, cx + u * Math.cos(a) - 0.04 * Math.sin(a), FY + v, cz + u * Math.sin(a) + 0.04 * Math.cos(a), '#7e241c', -a);
      P.glow.ball(0.035, 0, cx + 0.42 * Math.cos(a), FY + 1.0, cz + 0.42 * Math.sin(a), '#e6c35a'); }
    P.plain.box(0.96, 2.1, 0.06, 0.7 + 0.48 * Math.cos(1.2), FY + 1.05, HD - 0.48 * Math.sin(1.2), C.shutter, 1.2);
    P.plain.box(1.5, 0.18, 0.09, 0, FY + 2.3, -HD - 0.12, C.trim); for (const s of [-1, 1]) P.plain.box(0.14, 2.24, 0.09, s * 0.62, FY + 1.1, -HD - 0.12, C.trim);
    for (const s of [-1, 1]) P.plain.box(0.14, 2.2, 0.09, 1.2 + s * 0.57, FY + 1.08, HD + 0.12, C.trim); P.plain.box(1.3, 0.16, 0.09, 1.2, FY + 2.23, HD + 0.12, C.trim);
    // roof: steeper storybook gable, ridge along x; fascia, rakes, soffits, ridge cap
    const top = FY + WH, rise = 3.0, run = HD + 0.65, slope = Math.atan2(rise, run), len = Math.hypot(rise, run) + 0.06, RW = HW * 2 + 1.1;
    for (const s of [-1, 1]) { P.shingle.box(RW, 0.16, len, 0, top + rise / 2 - 0.1, s * run / 2, C.roof, 0, s * slope);
      P.plain.box(RW + 0.04, 0.22, 0.06, 0, top - 0.22, s * (run + 0.02), C.trim);   // fascia
      P.plain.box(RW, 0.04, 0.62, 0, top - 0.27, s * (HD + 0.36), C.trim);         // soffit
      for (const x of [-RW / 2, RW / 2]) P.plain.box(0.07, 0.24, len - 0.1, x, top + rise / 2 - 0.2, s * run / 2, C.trim, 0, s * slope); }
    P.shingle.box(RW + 0.06, 0.14, 0.34, 0, top + rise - 0.03, 0, '#4e423b');
    const apex = top + rise - 0.22;
    for (const x of [-HW - T / 2, HW + T / 2]) { const a = [x, top, -HD - T / 2], b = [x, top, HD + T / 2], c = [x, apex, 0]; P.clap.raw(x < 0 ? [...a, ...b, ...c] : [...a, ...c, ...b], C.siding);
      // gable vent (round, louvered look) + a little attic window glow
      P.plain.cyl(0.36, 0.36, 0.06, 14, x + Math.sign(x) * 0.03, top + 1.3, 0, C.trim, 0, 0, Math.PI / 2); P.plain.cyl(0.28, 0.28, 0.07, 14, x + Math.sign(x) * 0.035, top + 1.3, 0, C.shutter, 0, 0, Math.PI / 2); }
    P.brick.box(0.95, 3.6, 0.95, 4.2, top + 1.4, 1.7, C.brick, 0, 0, 0, aoExt); P.stone.box(1.12, 0.16, 1.12, 4.2, top + 3.25, 1.7, '#8f877c'); P.plain.box(0.32, 0.3, 0.32, 4.05, top + 3.45, 1.6, '#6b4a3a');
    // porch: deck, stone base, steps with stone cheeks, turned posts, railing with cap, beadboard ceiling, shed roof + little front gable, sign, lantern
    const PZ0 = -HD - 2.7;
    P.stone.box(8.6, footD, 2.7, 0, FY - 0.08 - footD / 2, -HD - 1.35, C.stone, 0, 0, 0, aoLow);
    P.plank.box(8.8, 0.1, 2.85, 0, FY - 0.03, -HD - 1.4, C.deck);
    const gStep = gl(0, PZ0 - 1.3), nSt = Math.max(1, Math.ceil((FY - gStep) / 0.18)), stH = (FY - gStep) / nSt, steps = [];
    for (let i = 1; i <= nSt; i++) { const yTop = FY - i * stH, z = PZ0 - 0.32 * (i - 0.5); P.plank.box(2.3, 0.06, 0.36, 0, yTop - 0.03, z, C.deck); P.stone.box(2.2, Math.max(0.05, yTop - gStep + 0.35), 0.34, 0, (yTop - 0.06 + gStep - 0.35) / 2, z, C.stone, 0, 0, 0, aoLow);
      steps.push({x0: -1.15, x1: 1.15, z0: z - 0.17, z1: z + 0.17, y: yTop}); }
    for (const s of [-1, 1]) { const zc = PZ0 - 0.16 * nSt, L = 0.32 * nSt + 0.1, yb = gStep - 0.3, yt = FY + 0.05; P.stone.box(0.32, yt - yb, L, s * 1.3, (yt + yb) / 2, zc, C.stone, 0, 0, 0, aoLow); P.stone.box(0.4, 0.08, L + 0.06, s * 1.3, yt + 0.04, zc, '#bdb4a6'); }
    const PH = WH - 0.25;
    for (const x of [-4.15, -1.35, 1.35, 4.15]) { P.plain.cyl(0.08, 0.09, PH - 0.4, 10, x, FY + PH / 2, PZ0 + 0.15, C.trim); P.plain.box(0.24, 0.2, 0.24, x, FY + 0.1, PZ0 + 0.15, C.trim); P.plain.box(0.26, 0.16, 0.26, x, FY + PH - 0.08, PZ0 + 0.15, C.trim); }
    const rail = (ax, az, bx, bz) => { const L = Math.hypot(bx - ax, bz - az), cx = (ax + bx) / 2, cz = (az + bz) / 2, ry = Math.atan2(-(bz - az), bx - ax);
      P.plain.box(L, 0.07, 0.16, cx, FY + 0.92, cz, C.trim, ry); P.plain.box(L, 0.06, 0.09, cx, FY + 0.14, cz, C.trim, ry);
      const n = Math.floor(L / 0.16); for (let i = 1; i < n; i++) { const t = i / n; P.plain.box(0.045, 0.74, 0.045, ax + (bx - ax) * t, FY + 0.52, az + (bz - az) * t, C.trim); } };
    rail(-4.15, PZ0 + 0.15, -1.35, PZ0 + 0.15); rail(1.35, PZ0 + 0.15, 4.15, PZ0 + 0.15); rail(-4.15, PZ0 + 0.15, -4.15, -HD - 0.15); rail(4.15, PZ0 + 0.15, 4.15, -HD - 0.15);
    const prY = FY + PH + 0.08;
    P.shingle.box(9.2, 0.13, 3.35, 0, prY + 0.12, -HD - 1.45, C.roof, 0, -0.1); P.plain.box(9.22, 0.18, 0.06, 0, prY - 0.03, PZ0 - 0.18, C.trim);
    P.inPlank.box(8.6, 0.04, 2.6, 0, prY - 0.06, -HD - 1.35, '#e8e0cc');
    { const gw = 1.7, gb = prY + 0.04, gh = 1.15, z0 = PZ0 - 0.2, z1 = -HD - 0.4, gs = Math.atan2(gh, gw), gl2 = Math.hypot(gw, gh) + 0.08;
      P.clap.raw([-gw, gb, z0, 0, gb + gh, z0, gw, gb, z0], C.siding);
      for (const s of [-1, 1]) { P.shingle.box(gl2, 0.12, z1 - z0 + 0.25, s * gw / 2, gb + gh / 2 + 0.07, (z0 + z1) / 2 - 0.1, C.roof, 0, 0, -s * gs); P.plain.box(gl2, 0.16, 0.06, s * gw / 2, gb + gh / 2 - 0.02, z0 - 0.04, C.trim, 0, 0, -s * gs); } }
    const sign = keep(new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.34), new THREE.MeshBasicMaterial({map: label('Home'), toneMapped: false})));
    texs.push(sign.material.map); sign.position.set(0, prY + 0.48, PZ0 - 0.22); sign.rotation.y = Math.PI; sign.name = 'home-sign'; group.add(sign);
    P.glow.ball(0.12, 1, 1.0, FY + 1.85, -HD - 0.2, '#ffe2a0'); P.plain.cyl(0.13, 0.08, 0.06, 8, 1.0, FY + 2.0, -HD - 0.2, C.dark); P.plain.box(0.04, 0.2, 0.18, 1.0, FY + 1.9, -HD - 0.12, C.dark);
    P.plank.box(1.3, 0.06, 0.45, -3.0, FY + 0.45, -HD - 0.45, C.wood); P.plank.box(1.3, 0.45, 0.06, -3.0, FY + 0.7, -HD - 0.24, C.wood); for (const s of [-1, 1]) P.plain.box(0.06, 0.45, 0.45, -3.0 + s * 0.62, FY + 0.22, -HD - 0.45, C.dark);   // porch bench
    for (const [x, c] of [[-1.7, '#e05a6a'], [1.7, '#f6d34a']]) { P.plain.cyl(0.2, 0.15, 0.38, 10, x, FY + 0.19, PZ0 + 0.55, '#b0583a'); P.nature.ball(0.3, 1, x, FY + 0.55, PZ0 + 0.55, C.leaf[1]); for (let k = 0; k < 5; k++) P.nature.ball(0.06, 0, x + Math.cos(k * 1.3) * 0.2, FY + 0.7, PZ0 + 0.55 + Math.sin(k * 1.3) * 0.2, c); }   // porch planters

    /* ---------- interior: warm living room (west), kitchen + dining (east) ---------- */
    const I = P.inPlain, IW = P.inPlank;
    IW.box(HW * 2 - T, 0.04, HD * 2 - T, 0, FY + 0.02, 0, C.floor, 0, 0, 0, () => 1);
    P.glow.box(HW * 2 - T, 0.05, HD * 2 - T, 0, FY + WH - 0.03, 0, '#d9cbb0');                                                // ceiling (unlit soft cream)
    for (const [x, z, w, d] of [[0, -HD + 0.16, HW * 2 - 0.3, 0.06], [0, HD - 0.16, HW * 2 - 0.3, 0.06], [-HW + 0.16, 0, 0.06, HD * 2 - 0.3], [HW - 0.16, 0, 0.06, HD * 2 - 0.3]]) { I.box(w, 0.12, d, x, FY + 0.06, z, C.trim); I.box(w, 0.1, d, x, FY + WH - 0.1, z, C.trim); }   // baseboards + crown
    I.box(3.6, 0.02, 2.6, -3.0, FY + 0.05, 0.6, C.rug2); I.box(3.2, 0.025, 2.2, -3.0, FY + 0.055, 0.6, C.rug);
    I.box(2.5, 0.42, 0.95, -3.0, FY + 0.26, 2.85, C.sofa, 0, 0, 0, aoIn); I.box(2.5, 0.6, 0.24, -3.0, FY + 0.72, 3.25, C.sofa, 0, 0, 0, aoIn);
    for (const s of [-1, 1]) I.box(0.24, 0.62, 0.95, -3.0 + s * 1.22, FY + 0.33, 2.85, C.sofa, 0, 0, 0, aoIn);
    for (const [x, c] of [[-3.8, '#f2d27a'], [-3.3, '#7f9e88'], [-2.2, '#f2d27a']]) I.box(0.4, 0.36, 0.12, x, FY + 0.66, 3.05, c, 0, -0.2);
    IW.box(1.2, 0.07, 0.6, -3.0, FY + 0.43, 1.0, C.wood); for (const [x, z] of [[-3.5, 0.8], [-2.5, 0.8], [-3.5, 1.2], [-2.5, 1.2]]) I.cyl(0.03, 0.025, 0.4, 6, x, FY + 0.2, z, C.dark);
    P.glow.cyl(0.03, 0.03, 0.12, 8, -3.2, FY + 0.53, 1.0, '#fff1c8'); I.cyl(0.09, 0.07, 0.12, 8, -2.7, FY + 0.52, 1.0, '#5f8fb0');
    P.stone.box(0.55, 1.35, 2.1, -HW + 0.37, FY + 0.67, 0.4, '#b3a796');     IW.box(0.7, 0.1, 2.4, -HW + 0.42, FY + 1.38, 0.4, C.wood); P.glow.box(0.03, 0.42, 0.75, -HW + 0.66, FY + 0.38, 0.4, '#ff9a3a');
    for (const z of [-0.3, 1.1]) { I.cyl(0.04, 0.04, 0.18, 8, -HW + 0.45, FY + 1.52, z, '#f5efe0'); P.glow.ball(0.025, 0, -HW + 0.45, FY + 1.64, z, '#ffd27a'); }
    I.box(0.95, 0.42, 0.9, -4.6, FY + 0.25, -2.6, C.chair, 0.5, 0, 0, aoIn); I.box(0.95, 0.62, 0.22, -4.6 - 0.36 * Math.sin(0.5), FY + 0.72, -2.6 - 0.36 * Math.cos(0.5), C.chair, 0.5, 0, 0, aoIn);
    IW.box(1.6, 2.05, 0.38, -4.3, FY + 1.02, HD - 0.31, '#9a6a44'); for (let i = 0; i < 4; i++) for (let k = 0; k < 7; k++) I.box(0.16, 0.26 + (k % 3) * 0.03, 0.24, -4.95 + k * 0.2, FY + 0.33 + i * 0.48, HD - 0.33, ['#9a4a36', '#3f6a8a', '#d0a860', '#5a7a4a', '#7a5a8a'][(i + k) % 5]);
    I.cyl(0.03, 0.03, 1.5, 6, -1.35, FY + 0.75, 3.7, C.dark); P.glow.cyl(0.17, 0.24, 0.32, 10, -1.35, FY + 1.62, 3.7, '#ffe2a8');
    I.cyl(0.2, 0.15, 0.4, 10, -5.4, FY + 0.2, -3.9, '#b0583a'); P.nature.ball(0.45, 1, -5.4, FY + 0.75, -3.9, C.leaf[0]);   // potted plant
    I.box(0.12, 1.1, 2.6, -0.1, FY + 0.55, 2.6, C.siding); IW.box(0.3, 0.05, 2.7, -0.1, FY + 1.12, 2.6, C.wood);   // half wall
    // kitchen
    I.box(3.5, 0.88, 0.62, 3.75, FY + 0.44, HD - 0.42, C.cab, 0, 0, 0, aoIn); IW.box(3.6, 0.06, 0.68, 3.75, FY + 0.91, HD - 0.42, '#d8b88a');
    I.box(3.5, 0.6, 0.02, 3.75, FY + 1.24, HD - 0.13, '#f4f1ea'); I.box(0.6, 0.08, 0.45, 3.2, FY + 0.95, HD - 0.42, C.steel);
    for (let k = 0; k < 2; k++) IW.box(1.4, 0.05, 0.28, 4.6, FY + 1.75 + k * 0.45, HD - 0.26, C.wood);
    for (let k = 0; k < 6; k++) I.cyl(0.07, 0.07, 0.14, 8, 4.05 + k * 0.22, FY + 1.85, HD - 0.26, ['#f2d27a', '#e9e4d8', '#7f9e88'][k % 3]);
    I.box(0.62, 0.88, 3.0, HW - 0.42, FY + 0.44, 1.6, C.cab, 0, 0, 0, aoIn); IW.box(0.68, 0.06, 3.1, HW - 0.42, FY + 0.91, 1.6, '#d8b88a');
    I.box(0.6, 0.06, 0.6, HW - 0.42, FY + 0.95, 1.0, '#2e2a28');   // hob
    I.box(0.82, 1.85, 0.76, HW - 0.5, FY + 0.93, -0.6, '#efe7d2', 0, 0, 0, aoIn); I.box(0.04, 0.5, 0.04, HW - 0.92, FY + 1.3, -0.35, C.steel);
    I.box(2.0, 0.86, 0.9, 3.0, FY + 0.43, 1.4, C.cab, 0, 0, 0, aoIn); IW.box(2.12, 0.06, 1.02, 3.0, FY + 0.89, 1.4, '#d8b88a');
    for (const x of [2.4, 3.0, 3.6]) { I.cyl(0.17, 0.17, 0.05, 10, x, FY + 0.68, 0.7, C.wood); I.cyl(0.025, 0.025, 0.66, 5, x, FY + 0.33, 0.7, C.dark); }
    IW.box(1.6, 0.06, 0.95, 2.8, FY + 0.75, -2.4, C.wood); for (const [x, z] of [[2.15, -2.05], [3.45, -2.05], [2.15, -2.75], [3.45, -2.75]]) I.cyl(0.035, 0.03, 0.72, 6, x, FY + 0.36, z, '#7a5434');
    for (const [x, z] of [[2.3, -1.65], [3.3, -1.65], [2.3, -3.15], [3.3, -3.15]]) { IW.box(0.42, 0.05, 0.42, x, FY + 0.46, z, C.wood); IW.box(0.42, 0.48, 0.05, x, FY + 0.72, z + (z > -2.4 ? 0.2 : -0.2), C.wood);
      for (const [dx, dz] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) I.box(0.035, 0.45, 0.035, x + dx, FY + 0.22, z + dz, '#7a5434'); }
    I.cyl(0.18, 0.18, 0.02, 12, 2.8, FY + 0.79, -2.4, '#f5efe0'); I.cyl(0.07, 0.05, 0.14, 8, 2.8, FY + 0.86, -2.4, '#ffffff'); P.nature.ball(0.09, 0, 2.8, FY + 1.0, -2.4, '#f6d34a');   // vase
    I.cyl(0.006, 0.006, 0.75, 4, 2.8, FY + WH - 0.4, -2.4, C.dark); I.cyl(0.12, 0.34, 0.26, 14, 2.8, FY + WH - 0.86, -2.4, '#3f5a4a'); P.glow.cyl(0.3, 0.3, 0.01, 14, 2.8, FY + WH - 0.995, -2.4, '#ffe7b0');   // dining pendant
    for (const x of [2.4, 3.6]) { I.cyl(0.005, 0.005, 0.6, 4, x, FY + WH - 0.33, 1.4, C.dark); P.glow.ball(0.11, 1, x, FY + WH - 0.72, 1.4, '#ffe2a8'); }
    P.glow.cyl(0.32, 0.32, 0.04, 14, -3.0, FY + WH - 0.08, 0.6, '#fff0c8');   // living room ceiling light
    // pictures: generic landscapes in wooden frames
    const pics = [], frame = (x, y, z, w, h, nx, nz, slot) => { const ry = Math.atan2(nx, nz); IW.box(w + 0.1, h + 0.1, 0.04, x - nx * 0.0, y, z - nz * 0.0, '#7a5434', ry); pics.push([x + nx * 0.025, y, z + nz * 0.025, w, h, nx, nz, slot]); };
    frame(-3.0, FY + 1.75, HD - 0.12, 1.2, 0.7, 0, -1, 0); frame(-HW + 0.12, FY + 2.05, 0.4, 0.8, 0.55, 1, 0, 1); frame(1.8, FY + 1.6, -HD + 0.12, 0.6, 0.8, 0, 1, 2); frame(HW - 0.12, FY + 1.65, -2.5, 0.9, 0.6, -1, 0, 3);
    { const pos = [], uv = []; for (const [x, y, z, w, h, nx, nz, s] of pics) { const rx = nz, rz = -nx;   // right = up x normal, so the picture faces into the room
        const v = (a, b) => [x + rx * a * w / 2, y + b * h / 2, z + rz * a * w / 2], A = v(-1, -1), B = v(1, -1), Cc = v(1, 1), D = v(-1, 1), u0 = s / 4 + 0.004, u1 = (s + 1) / 4 - 0.004;
        pos.push(...A, ...B, ...Cc, ...A, ...Cc, ...D); uv.push(u0, 0, u1, 0, u1, 1, u0, 0, u1, 1, u0, 1); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.computeVertexNormals();
      const tx = paintings(); texs.push(tx); const m = keep(new THREE.Mesh(g, new THREE.MeshLambertMaterial({map: tx, emissive: 0x2a2018}))); m.name = 'home-pictures'; group.add(m); }

    /* ---------- yard: soft-edged lawn, picket fence with posts + gate, stone path, lamps, mailbox, beds, trees, bushes ---------- */
    { const M = 7, x0 = LOT.x0 - M, x1 = LOT.x1 + M, z0 = LOT.z0 - M, z1 = LOT.z1 + M, S = lite ? 3 : 2, nx = Math.round((x1 - x0) / S), nz = Math.round((z1 - z0) / S);
      const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0, nx, nz); g.rotateX(-Math.PI / 2); g.translate((x0 + x1) / 2, 0, (z0 + z1) / 2);
      const p = g.attributes.position, cl = [], uv = g.attributes.uv, c = new THREE.Color(), dry = new THREE.Color('#8f8a5c'), R = 10;
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, gl(x, z) + 0.05);
        const qx = Math.max(LOT.x0 + R - x, 0, x - (LOT.x1 - R)), qz = Math.max(LOT.z0 + R - z, 0, z - (LOT.z1 - R)), d = Math.hypot(qx, qz) - R;   // distance outside the rounded lot
        const n = Math.sin(x * 0.37 + z * 0.21) * Math.cos(z * 0.43 - x * 0.17) + 0.5 * Math.sin(x * 1.3 - z * 0.9), a = 1 - clamp01((d + 1.5) / 7.5);
        c.set('#4c7631').offsetHSL(0.015 * n, 0.05 * n, 0.04 * n); c.lerp(dry, clamp01((d + 2) / 7)); cl.push(c.r, c.g, c.b, a * a * (3 - 2 * a)); uv.setXY(i, x / 3, z / 3); }
      g.setAttribute('color', new THREE.Float32BufferAttribute(cl, 4)); g.computeVertexNormals();
      const lawn = keep(new THREE.Mesh(g, new THREE.MeshLambertMaterial({map: X.grass, vertexColors: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: 0, polygonOffsetUnits: -2})));   // units only: a slope factor pulls the lawn over low plants at grazing angles
      lawn.receiveShadow = true; lawn.renderOrder = -1; lawn.name = 'home-lawn'; group.add(lawn); }
    { const pos = [], uv = [], H = 1.0, tex = picketTex(); texs.push(tex);
      const run = (ax, az, bx, bz) => { const L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(L / 2.2));
        for (let i = 0; i < n; i++) { const t0 = i / n, t1 = (i + 1) / n, xa = ax + (bx - ax) * t0, za = az + (bz - az) * t0, xb = ax + (bx - ax) * t1, zb = az + (bz - az) * t1, g0 = gl(xa, za) - 0.06, g1 = gl(xb, zb) - 0.06, u0 = t0 * L, u1 = t1 * L;
          pos.push(xa, g0, za, xb, g1, zb, xb, g1 + H, zb, xa, g0, za, xb, g1 + H, zb, xa, g0 + H, za); uv.push(u0, 0, u1, 0, u1, 1, u0, 0, u1, 1, u0, 1);
          P.plain.box(0.11, 1.15, 0.11, xa, g0 + 0.55, za, C.trim, 0, 0, 0, aoLow); P.plain.box(0.15, 0.05, 0.15, xa, g0 + 1.15, za, C.trim); } };
      run(LOT.x0, LOT.z0, -1.4, LOT.z0); run(1.4, LOT.z0, LOT.x1, LOT.z0); run(LOT.x1, LOT.z0, LOT.x1, LOT.z1); run(LOT.x1, LOT.z1, LOT.x0, LOT.z1); run(LOT.x0, LOT.z1, LOT.x0, LOT.z0);
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.computeVertexNormals();
      const f = keep(new THREE.Mesh(g, new THREE.MeshLambertMaterial({map: tex, alphaTest: 0.5, side: THREE.DoubleSide}))); f.name = 'home-fence'; group.add(f);
      for (const x of [-1.45, 1.45]) { const g0 = gl(x, LOT.z0); P.plain.box(0.18, 1.45, 0.18, x, g0 + 0.62, LOT.z0, C.trim, 0, 0, 0, aoLow); P.plain.ball(0.11, 0, x, g0 + 1.42, LOT.z0, C.trim); }
      // arbor over the gate
      { const g0 = gl(0, LOT.z0); for (const x of [-1.25, 1.25]) for (const z of [-0.35, 0.35]) P.plain.box(0.1, 2.3, 0.1, x, g0 + 1.1, LOT.z0 + z, C.trim, 0, 0, 0, aoLow);
        for (const z of [-0.35, 0.35]) P.plain.box(2.8, 0.12, 0.08, 0, g0 + 2.28, LOT.z0 + z, C.trim); for (let k = -3; k <= 3; k++) P.plain.box(0.06, 0.06, 0.95, k * 0.38, g0 + 2.36, LOT.z0, C.trim);
        for (let k = 0; k < 14; k++) { const t = k / 13, x = -1.25 + 2.5 * t, y = g0 + 0.8 + Math.sin(t * Math.PI) * 1.5; P.nature.ball(0.18, 0, x, y + (k % 2) * 0.1, LOT.z0 + (k % 2 ? 0.38 : -0.38), C.leaf[k % 4]); if (k % 2) P.nature.ball(0.06, 0, x, y + 0.15, LOT.z0 - 0.45, '#f2a0b8'); } } }
    // flagstone path (irregular, slightly sunk), back path
    { let z = PZ0 - 0.32 * nSt - 0.55, k = 0; while (z > LOT.z0 + 0.4) { const w = 0.75 + rnd() * 0.25, d = 0.5 + rnd() * 0.2, x = Math.sin(z * 0.5) * 0.18 + (k % 2 ? 0.18 : -0.18);
        P.stone.add(new THREE.CylinderGeometry(w / 2, w / 2, 0.08, 7), '#b5ab9c', x, gl(x, z) + 0.06, z, 0, rnd() * 3, 0, 1, 1, d / w); z -= d + 0.18; k++; } }
    for (let z = HD + 1.0, k = 0; z < HD + 3.8; z += 0.75, k++) P.stone.add(new THREE.CylinderGeometry(0.33, 0.33, 0.08, 7), '#b5ab9c', 1.2 + (k % 2 ? 0.12 : -0.12), gl(1.2, z) + 0.06, z, 0, rnd() * 3, 0, 1, 1, 0.8);
    // path lamps (2) and mailbox (no number, no name)
    for (const [x, z] of [[1.0, -11.5], [-1.0, -16.6]]) { const g0 = gl(x, z); P.plain.cyl(0.05, 0.07, 1.25, 8, x, g0 + 0.62, z, '#2f2f2f'); P.plain.cyl(0.13, 0.13, 0.05, 8, x, g0 + 1.27, z, '#2f2f2f');
      P.glow.ball(0.12, 1, x, g0 + 1.42, z, '#ffe6b0'); P.plain.cyl(0.02, 0.16, 0.12, 8, x, g0 + 1.58, z, '#2f2f2f'); }
    { const x = -2.4, z = LOT.z0 - 0.7, g0 = gl(x, z); P.plank.box(0.1, 1.1, 0.1, x, g0 + 0.5, z, '#7a5434', 0, 0, 0, aoLow); P.plank.box(0.3, 0.04, 0.5, x, g0 + 1.06, z, '#7a5434');
      P.plain.box(0.24, 0.2, 0.46, x, g0 + 1.18, z, '#3f5a4a'); P.plain.add(new THREE.CylinderGeometry(0.12, 0.12, 0.46, 12, 1, false, Math.PI / 2, Math.PI), '#3f5a4a', x, g0 + 1.28, z, Math.PI / 2, 0, 0);
      P.plain.box(0.02, 0.2, 0.05, x + 0.13, g0 + 1.32, z + 0.12, C.red); P.plain.box(0.02, 0.06, 0.12, x + 0.13, g0 + 1.4, z + 0.17, C.red);
      P.nature.ball(0.3, 1, x - 0.1, g0 + 0.18, z + 0.15, C.leaf[2], 0.6); for (let k = 0; k < 5; k++) P.nature.ball(0.05, 0, x - 0.3 + k * 0.1, g0 + 0.32, z - 0.1 + (k % 2) * 0.1, '#b08ad8'); }
    // flower beds: along the porch front and both sides of the front walk inside the fence
    const bed = (x0, x1, z, depth) => { const n = Math.round((x1 - x0) / 0.35); for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, zz = z + (rnd() - 0.5) * depth, g0 = gl(x, zz);
        P.nature.ball(0.24 + rnd() * 0.1, 1, x, g0 + 0.2, zz, C.leaf[i % 4], 0.75); for (let k = 0; k < 3; k++) P.nature.ball(0.085, 0, x + (k - 1) * 0.12, g0 + 0.4 + (k % 2) * 0.05, zz - 0.1 + (k % 2) * 0.12, ['#ff5d73', '#ffd84a', '#ffffff', '#ff9ec4', '#c39bf0'][(i + k) % 5]); }
      P.stone.box(x1 - x0 + 0.6, 0.1, depth + 0.4, (x0 + x1) / 2, gl((x0 + x1) / 2, z) + 0.03, z, '#6a4c36'); };
    bed(-4.2, -1.6, PZ0 - 0.55, 0.5); bed(1.6, 4.2, PZ0 - 0.55, 0.5); bed(-6.5, -2.2, LOT.z0 + 1.0, 0.6); bed(2.2, 6.5, LOT.z0 + 1.0, 0.6);
    // trees: trunk + clustered round crowns, darker underneath
    const tree = (x, z, s, i, lift, back) => { lift = lift || 0; back = back || 0; const g0 = gl(x, z) + lift, gb = gl(x, z); P.nature.cyl(0.15 * s, 0.26 * s, 3.4 * s + lift, 7, x, gb + (3.4 * s + lift) / 2 - 0.1, z, C.trunk); P.nature.cyl(0.26 * s, 0.4 * s, 0.4 * s, 7, x, gb + 0.1, z, C.trunk);
      const L = [[0, 4.6, 0, 2.0], [1.2, 4.0, 0.4, 1.5], [-1.1, 4.1, -0.3, 1.5], [0.2, 4.0, -1.2, 1.4], [-0.3, 5.6, 0.3, 1.3]];
      L.forEach(([dx, dy, dz, r], k) => P.nature.ball(r * s, 1, x + dx * s, g0 + dy * s, z + dz * s + back, C.leaf[(i + k) % 4], 0.9)); };
    [[-17, -12, 1.15], [-18, 9, 1.0], [-9, 15.5, 0.95], [5, 16.5, 1.05], [17.5, 12, 1.1, 2.4, 0.8], [-19.5, -1, 0.85]].forEach(([x, z, s, lift, back], i) => tree(x, z, s, i, lift, back));   // the treehouse tree's crown sits above the hut
    // bushes: rounder clusters along the foundation and fence corners
    const bush = (x, z, s, i) => { const g0 = gl(x, z); P.nature.ball(0.55 * s, 1, x, g0 + 0.38 * s, z, C.leaf[i % 4], 0.8); P.nature.ball(0.42 * s, 1, x + 0.4 * s, g0 + 0.3 * s, z + 0.15 * s, C.leaf[(i + 1) % 4], 0.8); P.nature.ball(0.38 * s, 1, x - 0.35 * s, g0 + 0.28 * s, z - 0.1 * s, C.leaf[(i + 2) % 4], 0.8); };
    [[-5.4, -5.2, 1], [5.4, -5.2, 1], [-6.6, 2, 1.1], [6.6, -2.2, 1.1], [-6.6, -3.2, 0.9], [-4, 5.2, 1], [-20.5, -16.5, 1.4], [20.5, 18.5, 1.4], [-20.5, 18.5, 1.3], [8.5, 18.5, 1.2]].forEach(([x, z, s], i) => bush(x, z, s, i));
    // picnic table behind the house
    { const x = -6, z = 10, g0 = gl(x, z); P.plank.box(1.8, 0.06, 0.8, x, g0 + 0.76, z, C.wood); for (const s of [-1, 1]) { P.plank.box(1.8, 0.05, 0.28, x, g0 + 0.45, z + s * 0.62, C.wood); P.plank.box(0.08, 0.8, 1.6, x + s * 0.7, g0 + 0.38, z, '#9a6a44', 0, s * 0.0); } }

    /* ---------- play area (east side yard, in view from the porch) ---------- */
    { const cx = PLAY.x, cz = PLAY.z + 0.4, RX = 6.2, RZ = 6.8, NR = 5, NS = 28, pos = [], cl = [], c = new THREE.Color();
      const vtx = (r, a) => { const x = cx + Math.cos(a) * RX * r, z = cz + Math.sin(a) * RZ * r; c.set(r > 0.93 ? '#5e4430' : '#86634a').offsetHSL(0, 0, Math.sin(x * 3 + z * 2) * 0.03); return [x, gl(x, z) + 0.09, z, c.r, c.g, c.b]; };
      for (let i = 0; i < NR; i++) for (let j = 0; j < NS; j++) { const r0 = i / NR, r1 = (i + 1) / NR, a0 = j / NS * 6.2832, a1 = (j + 1) / NS * 6.2832, A = vtx(r0, a0), B = vtx(r1, a0), Cc = vtx(r1, a1), D = vtx(r0, a1);
        for (const V of (i ? [A, Cc, B, A, D, Cc] : [A, Cc, B])) { pos.push(V[0], V[1], V[2]); cl.push(V[3], V[4], V[5]); } }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3)); g.computeVertexNormals();
      const uv = new Float32Array(pos.length / 3 * 2); for (let i = 0; i < pos.length / 3; i++) { uv[i * 2] = pos[i * 3] / 1.5; uv[i * 2 + 1] = pos[i * 3 + 2] / 1.5; } g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      const m = keep(new THREE.Mesh(g, new THREE.MeshLambertMaterial({map: X.stone, vertexColors: true, polygonOffset: true, polygonOffsetFactor: 0, polygonOffsetUnits: -4}))); m.name = 'home-playpad'; group.add(m); }
    const W = '#c58d58';
    // swing set: rounded wooden A-frame, chains, rubber seats (animated)
    const sz = -11, sg = gl(14, sz), bar = sg + 2.45;
    P.plank.cyl(0.08, 0.08, 4.6, 10, 14, bar, sz, W, 0, 0, Math.PI / 2);
    for (const x of [11.85, 16.15]) { for (const s of [-1, 1]) P.plank.cyl(0.065, 0.075, 2.7, 10, x, sg + 1.22, sz + s * 0.31, W, -s * 0.24); P.plank.box(0.08, 0.08, 0.9, x, sg + 0.9, sz, W); }
    // slide tower with a little roof, ladder, yellow plastic half-pipe chute
    const lx = 18.2, lz = -4.0, lg = gl(lx, lz), ph = 1.5;
    P.plank.box(1.4, 0.1, 1.4, lx, lg + ph, lz, W); for (const [dx, dz] of [[-0.62, -0.62], [0.62, -0.62], [-0.62, 0.62], [0.62, 0.62]]) P.plank.cyl(0.06, 0.06, ph + 1.6, 10, lx + dx, lg + (ph + 1.6) / 2, lz + dz, W);
    for (const s of [-1, 1]) { P.plank.box(1.4, 0.07, 0.07, lx, lg + ph + 0.8, lz + s * 0.62, W); P.plain.box(1.25, 0.6, 0.03, lx, lg + ph + 0.42, lz + s * 0.63, s > 0 ? C.blue : C.green); }
    P.plain.box(0.03, 0.6, 1.25, lx + 0.63, lg + ph + 0.42, lz, C.blue);
    for (const s of [-1, 1]) P.shingle.box(1.15, 0.08, 1.75, lx + s * 0.42, lg + ph + 1.85, lz, C.red, 0, 0, -s * 0.75);
    for (const s of [-1, 1]) P.plank.cyl(0.035, 0.035, 1.95, 8, lx + 0.95, lg + 0.85, lz + s * 0.32, W, 0, 0, 0.32); for (let k = 1; k <= 4; k++) P.plank.cyl(0.025, 0.025, 0.64, 6, lx + 1.22 - 0.115 * k, lg + k * 0.34, lz, W, Math.PI / 2);
    { const ang = Math.atan2(ph - 0.15, 2.9), sl = Math.hypot(2.9, ph - 0.15) + 0.1, scx = lx - 0.7 - 1.45, scy = lg + 0.15 + (ph - 0.15) / 2 + 0.2;
      P.plain.add(new THREE.CylinderGeometry(0.34, 0.34, sl, 14, 1, true, Math.PI, Math.PI), C.yellow, scx, scy, lz, 0, 0, Math.PI / 2 + ang);
      P.plain.box(0.5, 0.05, 0.68, lx - 0.7 - 2.95, lg + 0.32, lz, C.yellow); P.plain.box(0.06, 0.3, 0.06, lx - 0.7 - 3.1, lg + 0.15, lz - 0.3, C.yellow); P.plain.box(0.06, 0.3, 0.06, lx - 0.7 - 3.1, lg + 0.15, lz + 0.3, C.yellow); }
    // sandbox with toys
    { const bx = 11, bz = -3, bg = gl(bx, bz); for (const [dx, dz, w, d] of [[0, -1.2, 2.6, 0.18], [0, 1.2, 2.6, 0.18], [-1.2, 0, 0.18, 2.6], [1.2, 0, 0.18, 2.6]]) P.plank.box(w, 0.32, d, bx + dx, bg + 0.14, bz + dz, W, 0, 0, 0, aoLow);
      for (const [dx, dz] of [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]]) P.plank.box(0.3, 0.06, 0.3, bx + dx, bg + 0.32, bz + dz, W);
      P.plain.box(2.26, 0.18, 2.26, bx, bg + 0.1, bz, C.sand); P.plain.ball(0.45, 1, bx - 0.5, bg + 0.1, bz + 0.4, C.sand, 0.45);
      P.plain.cyl(0.12, 0.09, 0.2, 10, bx + 0.5, bg + 0.29, bz - 0.4, C.blue); P.plain.box(0.08, 0.02, 0.3, bx + 0.75, bg + 0.2, bz - 0.1, C.yellow, 0.4); P.plain.ball(0.14, 1, bx + 1.6, gl(bx + 1.6, bz + 1.5) + 0.23, bz + 1.5, C.red); }
    // treehouse: posts, deck with railing, pastel cottage, white trim, red gable roof, round window, flag, rope ladder
    { const tx = 17.5, tz = 12, tg = gl(tx, tz), th = 2.7, hx = tx + 0.1, hz = tz + 0.25, hw = 1.0, hd = 0.9, hh = 1.35;
      P.plank.box(2.8, 0.12, 2.8, tx, tg + th, tz, W); for (const [dx, dz] of [[-1.25, -1.25], [1.25, -1.25], [-1.25, 1.25], [1.25, 1.25]]) P.plank.cyl(0.08, 0.09, th, 10, tx + dx, tg + th / 2, tz + dz, W);
      for (const [ax, az, bx2, bz2] of [[-1.35, -1.35, -0.35, -1.35], [0.35, -1.35, 1.35, -1.35], [-1.35, -1.35, -1.35, 1.35], [1.35, -1.35, 1.35, 1.35]]) {
        const L = Math.hypot(bx2 - ax, bz2 - az), ry = Math.atan2(-(bz2 - az), bx2 - ax); P.plain.box(L, 0.06, 0.08, tx + (ax + bx2) / 2, tg + th + 0.7, tz + (az + bz2) / 2, C.trim, ry); for (let i = 0; i <= Math.round(L / 0.2); i++) { const t = i / Math.round(L / 0.2); P.plain.box(0.04, 0.64, 0.04, tx + ax + (bx2 - ax) * t, tg + th + 0.38, tz + az + (bz2 - az) * t, C.trim); } }
      P.clap.box(hw * 2, hh, hd * 2, hx, tg + th + 0.06 + hh / 2, hz, '#a9d0e8'); for (const [dx, dz] of [[-hw, -hd], [hw, -hd], [-hw, hd], [hw, hd]]) P.plain.box(0.1, hh, 0.1, hx + dx, tg + th + 0.06 + hh / 2, hz + dz, C.trim);
      P.plain.box(0.62, 0.95, 0.03, hx - 0.35, tg + th + 0.56, hz - hd - 0.01, '#4a3a30'); P.plain.box(0.72, 0.07, 0.05, hx - 0.35, tg + th + 1.06, hz - hd - 0.02, C.trim);
      P.glow.cyl(0.18, 0.18, 0.02, 14, hx + 0.5, tg + th + 0.85, hz - hd - 0.015, '#ffe0a0', Math.PI / 2); P.plain.add(new THREE.TorusGeometry(0.2, 0.035, 6, 16), C.trim, hx + 0.5, tg + th + 0.85, hz - hd - 0.03);
      const ry0 = tg + th + 0.06 + hh, rr = 0.85, rrun = hd + 0.2, rs = Math.atan2(rr, rrun), rl = Math.hypot(rr, rrun) + 0.06;
      for (const s of [-1, 1]) P.shingle.box(hw * 2 + 0.4, 0.09, rl, hx, ry0 + rr / 2 - 0.02, hz + s * rrun / 2, C.red, 0, s * rs);
      for (const x of [hx - hw - 0.01, hx + hw + 0.01]) { const a = [x, ry0, hz - hd], b = [x, ry0, hz + hd], c = [x, ry0 + rr * hd / rrun - 0.03, hz]; P.clap.raw(x < hx ? [...a, ...b, ...c] : [...a, ...c, ...b], '#a9d0e8'); }
      P.plain.cyl(0.02, 0.02, 1.2, 5, hx + hw - 0.1, ry0 + 0.9, hz + hd - 0.1, C.dark); P.plain.raw([hx + hw - 0.1, ry0 + 1.45, hz + hd - 0.1, hx + hw - 0.1, ry0 + 1.2, hz + hd - 0.1, hx + hw - 0.1 - 0.4, ry0 + 1.33, hz + hd - 0.1], C.yellow);
      P.plain.raw([hx + hw - 0.1, ry0 + 1.45, hz + hd - 0.1, hx + hw - 0.1 - 0.4, ry0 + 1.33, hz + hd - 0.1, hx + hw - 0.1, ry0 + 1.2, hz + hd - 0.1], C.yellow);
      for (const s of [-1, 1]) P.plain.cyl(0.02, 0.02, th + 0.1, 5, tx + s * 0.25, tg + th / 2, tz - 1.45, '#c8a878', 0.12); for (let k = 1; k <= 7; k++) P.plank.cyl(0.03, 0.03, 0.56, 6, tx, tg + k * 0.36, tz - 1.45 - (th / 2 - k * 0.36) * 0.12, W, 0, 0, Math.PI / 2); }
    { const x = 9.0, z = -9, g0 = gl(x, z); P.plank.box(1.2, 0.06, 0.42, x, g0 + 0.45, z, C.wood); P.plank.box(1.2, 0.4, 0.06, x, g0 + 0.7, z + 0.2, C.wood); for (const s of [-1, 1]) P.plain.box(0.06, 0.45, 0.42, x + s * 0.55, g0 + 0.22, z, C.dark); }
    // swings (separate tiny meshes so they can sway): chains + rubber seats
    const swings = [];
    for (const [x, c] of [[13.1, '#2f6fa8'], [14.9, '#b23a30']]) { const sw = Parts(1); for (const s of [-1, 1]) sw.cyl(0.012, 0.012, 1.85, 4, s * 0.23, -0.93, 0, '#8a8a8a');
      sw.box(0.5, 0.025, 0.18, 0, -1.88, 0, c);
      const m = keep(new THREE.Mesh(sw.geometry(), lam(X.plain, {side: THREE.DoubleSide}))); m.position.set(x, bar, sz); group.add(m); swings.push(m); }

    /* ---------- meshes (one per material) ---------- */
    const mk = (set, map, name, o, cast, ao) => { if (!set.count()) return null; const m = keep(new THREE.Mesh(set.geometry(ao), lam(map, o))); m.name = name; m.castShadow = !!cast; m.receiveShadow = false; group.add(m); return m; };
    mk(P.clap, X.clap, 'home-siding', {}, true, aoExt); mk(P.shingle, X.shingle, 'home-roof', {}, true); mk(P.brick, X.brick, 'home-brick', {}, false, aoExt); mk(P.stone, X.stone, 'home-stone', {}, false);
    mk(P.plank, X.plank, 'home-wood', {}, false); mk(P.plain, X.plain, 'home-paint', {side: THREE.DoubleSide}, false);   // double-sided: the slide's half-pipe is seen from inside mk(P.nature, X.plain, 'home-plants', {}, false, aoNat);
    mk(P.inPlain, X.plain, 'home-interior', {emissive: 0x2a1d12}, false); mk(P.inPlank, X.plank, 'home-interior-wood', {emissive: 0x2a1d12}, false);
    if (P.glow.count()) { const m = keep(new THREE.Mesh(P.glow.geometry(), new THREE.MeshBasicMaterial({vertexColors: true, toneMapped: false}))); m.name = 'home-glow'; group.add(m); }

    let tris = 0; group.traverse(o => { if (o.isMesh) { const g = o.geometry; tris += (g.index ? g.index.count : g.attributes.position.count) / 3; } });
    let calls = 0; group.traverse(o => { if (o.isMesh) calls++; });
    /* walkable surfaces + walls (local frame; the host converts to world) */
    const floors = [{x0: -HW + T / 2, x1: HW - T / 2, z0: -HD + T / 2, z1: HD - T / 2, y: FY}, {x0: -4.3, x1: 4.3, z0: PZ0, z1: -HD, y: FY}, {x0: -0.55, x1: 0.55, z0: -HD - 0.15, z1: -HD + 0.15, y: FY},
      {x0: 0.7, x1: 1.7, z0: HD - 0.15, z1: HD + 0.6, y: FY}].concat(steps);
    const walls = []; const Wl = (axis, at, a, b, holes) => { let s = a; const push = (s0, s1) => { if (s1 - s0 < 0.05) return;
      walls.push(axis === 'x' ? {x0: s0, x1: s1, z0: at - T / 2, z1: at + T / 2, y0: FY, y1: FY + WH} : {x0: at - T / 2, x1: at + T / 2, z0: s0, z1: s1, y0: FY, y1: FY + WH}); };
      for (const h of holes.slice().sort((p, q) => p.a - q.a)) { if (h.y0 < 0.1) { push(s, h.a); s = h.b; } } push(s, b); };
    Wl('x', -HD, -HW, HW, front); Wl('x', HD, -HW, HW, back); Wl('z', -HW, -HD, HD, side); Wl('z', HW, -HD, HD, side);
    for (const [a, b] of [[-4.25, -1.35], [1.35, 4.25]]) walls.push({x0: a, x1: b, z0: PZ0 + 0.05, z1: PZ0 + 0.25, y0: FY, y1: FY + 1.0});
    walls.push({x0: -4.25, x1: -4.05, z0: PZ0, z1: -HD, y0: FY, y1: FY + 1.0}, {x0: 4.05, x1: 4.25, z0: PZ0, z1: -HD, y0: FY, y1: FY + 1.0});

    const face = (x, z, tx, tz) => Math.round(Math.atan2(-(tx - x), -(tz - z)) * 180 / Math.PI);
    const at = (x, z, y, r) => ({x, y: y != null ? y : gl(x, z), z, rotationY: r});
    const spawns = {
      porch: at(0, -6.4, FY, 0), wife: at(-1.3, -5.2, FY, 0),
      kids: [at(13.1, -9.4, null, face(13.1, -9.4, 0, -6.4)), at(11.0, -1.4, null, face(11.0, -1.4, 0, -6.4)), at(15.8, -4.6, null, face(15.8, -4.6, 0, -6.4))],
      yard: at(-9.5, -10, null, face(-9.5, -10, 0, -5)), play: at(PLAY.x, PLAY.z, null, face(PLAY.x, PLAY.z, 0, -6.4)),
      kitchen: at(2.0, 0.2, FY, 180), living: at(-3.0, -1.2, FY, 180)
    };
    return {group, spawns, floors, walls, tris: Math.round(tris), calls, lot: LOT, FY, bounds: {x0: -HW - 0.15, x1: HW + 0.15, z0: -HD - 0.15, z1: HD + 0.15}, porchBounds: {x0: -4.3, x1: 4.3, z0: PZ0 - 0.32 * nSt, z1: -HD - 0.15},
      update(t) { swings.forEach((m, i) => { m.rotation.x = Math.sin(t * (1.1 + i * 0.13) + i * 1.7) * (0.18 + 0.05 * i); }); },
      dispose() { if (group.parent) group.parent.remove(group); geos.forEach(g => g.dispose()); mats.forEach(m => m.dispose()); texs.forEach(t => t.dispose()); } };
  }
  FPX.familyhome = {build, version: 3};
})();
