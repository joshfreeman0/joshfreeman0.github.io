/* American Legion Post 405, 291 Mill Street, Raynham, MA (staging only).
   Exterior + walkable hall at the public building footprint. Name and address only. */
(function () {
  'use strict';
  const W3D = window.W3D = window.W3D || {};
  const CX = 533.00, CZ = -718.65;
  const W = 36, D = 18, T = 0.38, H = 4.6, RH = 2.4, DOOR = 2.4;
  const WATER = 16.5;

  function hud(m) { if (window.JFVR && JFVR.hud) JFVR.hud(m); }

  function goPost() {
    if (!W3D.teleportTo) return setTimeout(goPost, 250);
    const y = (W3D.terrainH ? W3D.terrainH(CX, CZ + D / 2 + 4) : 20) + 1.6;
    W3D.teleportTo(CX, y, CZ + D / 2 + 4, 0);
    hud('American Legion Post 405 — 291 Mill Street, Raynham');
  }
  W3D.spots = W3D.spots || {};
  W3D.spots['post-405'] = goPost;
  W3D.spots.legion = goPost;
  W3D.spots.post405 = goPost;

  function wait(fn) {
    const t0 = Date.now();
    (function go() {
      if (window.W3D_READY && W3D.root && window.THREE) return fn();
      if (Date.now() - t0 > 120000) return;
      setTimeout(go, 200);
    })();
  }

  function brickTex() {
    const c = document.createElement('canvas'); c.width = 512; c.height = 512;
    const g = c.getContext('2d');
    g.fillStyle = '#6a3a32'; g.fillRect(0, 0, 512, 512);
    const cols = 8, rows = 16, bw = 512 / cols, bh = 512 / rows;
    for (let r = 0; r < rows; r++) {
      const off = (r % 2) * (bw / 2);
      for (let i = -1; i <= cols; i++) {
        const v = (Math.sin(r * 17 + i * 9) * 0.5 + 0.5);
        g.fillStyle = 'rgb(' + (98 + v * 36 | 0) + ',' + (50 + v * 18 | 0) + ',' + (42 + v * 12 | 0) + ')';
        g.fillRect(i * bw + off + 2, r * bh + 2, bw - 4, bh - 4);
      }
    }
    g.fillStyle = 'rgba(255,255,255,0.04)';
    for (let i = 0; i < 800; i++) g.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(W / 4, H / 2.2); t.anisotropy = 8;
    return t;
  }

  function flagTex() {
    const c = document.createElement('canvas'); c.width = 640; c.height = 336;
    const g = c.getContext('2d');
    const sh = 336 / 13;
    for (let i = 0; i < 13; i++) {
      g.fillStyle = i % 2 === 0 ? '#bf0a30' : '#fff';
      g.fillRect(0, i * sh, 640, sh + 0.5);
    }
    g.fillStyle = '#002868'; g.fillRect(0, 0, 256, sh * 7);
    g.fillStyle = '#fff';
    const rows = [6, 5, 6, 5, 6, 5, 6, 5, 6];
    for (let r = 0; r < 9; r++) {
      const n = rows[r], y = (r + 0.7) * (sh * 7) / 9;
      for (let s = 0; s < n; s++) {
        const x = ((s + 0.5) / n) * 248 + 4;
        g.beginPath();
        for (let k = 0; k < 5; k++) {
          const a = -Math.PI / 2 + k * 4 * Math.PI / 5;
          const fn = k ? g.lineTo.bind(g) : g.moveTo.bind(g);
          fn(x + Math.cos(a) * 7, y + Math.sin(a) * 7);
        }
        g.closePath(); g.fill();
      }
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }

  function emblemTex() {
    const c = document.createElement('canvas'); c.width = 512; c.height = 512;
    const g = c.getContext('2d');
    g.fillStyle = '#1a2744'; g.beginPath(); g.arc(256, 256, 240, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#c9a227'; g.lineWidth = 14; g.stroke();
    g.fillStyle = '#c9a227';
    g.beginPath();
    for (let k = 0; k < 5; k++) {
      const a = -Math.PI / 2 + k * 4 * Math.PI / 5;
      (k ? g.lineTo : g.moveTo).call(g, 256 + Math.cos(a) * 110, 230 + Math.sin(a) * 110);
    }
    g.closePath(); g.fill();
    g.fillStyle = '#fff';
    g.font = 'bold 36px Helvetica, Arial, sans-serif'; g.textAlign = 'center';
    g.fillText('AMERICAN LEGION', 256, 390);
    g.font = 'bold 42px Helvetica, Arial, sans-serif';
    g.fillText('POST 405', 256, 440);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }

  function hallSign() {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = '#1a2744'; g.fillRect(0, 0, 1024, 256);
    g.strokeStyle = '#c9a227'; g.lineWidth = 8; g.strokeRect(6, 6, 1012, 244);
    g.fillStyle = '#fff'; g.textAlign = 'center';
    g.font = 'bold 48px Helvetica, Arial, sans-serif';
    g.fillText('American Legion Post 405', 512, 110);
    g.font = '32px Helvetica, Arial, sans-serif';
    g.fillText('291 Mill Street, Raynham, Massachusetts', 512, 175);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }

  function box(w, h, d, x, y, z, mat, opt) {
    opt = opt || {};
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y + h / 2, z);
    m.castShadow = true; m.receiveShadow = true;
    (opt.parent || W3D.root).add(m);
    if (opt.collide !== false && W3D.lib && W3D.lib.walls) {
      W3D.lib.walls.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2, y0: y, y1: y + h });
    }
    if (opt.floor && W3D.lib && W3D.lib.floors) {
      W3D.lib.floors.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2, y: y + h });
    }
    return m;
  }

  function build() {
    const ground = W3D.terrainH ? W3D.terrainH(CX, CZ) : WATER + 4;
    const Y = Math.max(isFinite(ground) ? ground : WATER + 4, WATER + 1.2);
    const brick = new THREE.MeshLambertMaterial({ map: brickTex(), color: 0xffffff });
    const trim = new THREE.MeshLambertMaterial({ color: 0xe8e0d0 });
    const roofM = new THREE.MeshLambertMaterial({ color: 0x3a2a24 });
    const floorM = new THREE.MeshLambertMaterial({ color: 0x6b4a32 });
    const ceilM = new THREE.MeshLambertMaterial({ color: 0xeee8dc });
    const asphalt = new THREE.MeshLambertMaterial({ color: 0x2a2a2c });
    const glass = new THREE.MeshLambertMaterial({ color: 0x8aa8c0, transparent: true, opacity: 0.45, side: THREE.DoubleSide });
    const dark = new THREE.MeshLambertMaterial({ color: 0x2a2218 });
    const cream = new THREE.MeshLambertMaterial({ color: 0xd8c9a8 });
    const gold = new THREE.MeshLambertMaterial({ color: 0xc9a227 });

    const grp = new THREE.Group(); grp.name = 'post-405'; W3D.root.add(grp);
    const add = (m) => { grp.add(m); return m; };

    /* Pad and parking (south, toward Mill Street). */
    box(W + 8, 0.18, D + 28, CX, Y - 0.18, CZ + 8, asphalt, { collide: false, parent: grp });
    const stall = new THREE.MeshLambertMaterial({ color: 0xd8d0a8 });
    for (let i = -3; i <= 3; i++) {
      if (i === 0) continue;
      box(2.6, 0.04, 5.2, CX + i * 4.2, Y, CZ + D / 2 + 8, stall, { collide: false, parent: grp });
    }

    /* Walls — door gap on the south (Mill Street) facade. */
    const yW = Y + 0.15;
    box(W, H, T, CX, yW, CZ - D / 2 + T / 2, brick, { parent: grp });             // north
    box(T, H, D, CX - W / 2 + T / 2, yW, CZ, brick, { parent: grp });             // west
    box(T, H, D, CX + W / 2 - T / 2, yW, CZ, brick, { parent: grp });             // east
    const wing = (W - DOOR) / 2;
    box(wing, H, T, CX - (DOOR / 2 + wing / 2), yW, CZ + D / 2 - T / 2, brick, { parent: grp });
    box(wing, H, T, CX + (DOOR / 2 + wing / 2), yW, CZ + D / 2 - T / 2, brick, { parent: grp });
    box(DOOR + 0.2, 0.4, T, CX, yW + H - 0.4, CZ + D / 2 - T / 2, brick, { parent: grp }); // lintel

    /* Cornice and corner pilasters. */
    box(W + 0.3, 0.28, D + 0.3, CX, Y + H + 0.05, CZ, trim, { collide: false, parent: grp });
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      box(0.5, H + 0.2, 0.5, CX + sx * (W / 2 - 0.15), yW, CZ + sz * (D / 2 - 0.15), trim, { collide: false, parent: grp });
    }

    /* Windows along the long walls. */
    for (const z of [CZ - D / 2 + 0.05, CZ + D / 2 - 0.05]) {
      for (let i = -3; i <= 3; i++) {
        if (z > CZ && Math.abs(i) < 1) continue;
        const x = CX + i * 4.4;
        box(1.6, 1.8, 0.08, x, Y + 1.5, z, glass, { collide: false, parent: grp });
        box(1.75, 0.08, 0.12, x, Y + 1.5, z, trim, { collide: false, parent: grp });
        box(1.75, 0.08, 0.12, x, Y + 3.3, z, trim, { collide: false, parent: grp });
      }
    }

    /* Gable roof, ridge east–west. */
    const slope = Math.atan2(RH, D / 2);
    const slen = Math.hypot(D / 2, RH) + 0.4;
    const slab = (zd, tilt) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(W + 1.2, 0.16, slen), roofM);
      m.position.set(CX, Y + H + 0.2 + RH / 2, zd);
      m.rotation.x = tilt; m.castShadow = true; add(m);
    };
    slab(CZ - D / 4, slope);
    slab(CZ + D / 4, -slope);
    /* Gable end fills. */
    const gableShape = new THREE.Shape();
    gableShape.moveTo(-D / 2 - 0.1, 0); gableShape.lineTo(D / 2 + 0.1, 0); gableShape.lineTo(0, RH); gableShape.closePath();
    const gGeo = new THREE.ShapeGeometry(gableShape);
    for (const x of [CX - W / 2, CX + W / 2]) {
      const m = new THREE.Mesh(gGeo, brick);
      m.position.set(x, Y + H + 0.15, CZ);
      m.rotation.y = Math.PI / 2;
      add(m);
    }

    /* Front canopy over the door. */
    box(6, 0.16, 2.2, CX, Y + 3.15, CZ + D / 2 + 0.9, trim, { collide: false, parent: grp });
    box(0.16, 3.15, 0.16, CX - 2.7, Y, CZ + D / 2 + 1.7, trim, { collide: false, parent: grp });
    box(0.16, 3.15, 0.16, CX + 2.7, Y, CZ + D / 2 + 1.7, trim, { collide: false, parent: grp });

    /* Facade sign + emblem. */
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 1.8), new THREE.MeshBasicMaterial({ map: hallSign(), toneMapped: false }));
    sign.position.set(CX, Y + 4.0, CZ + D / 2 + 0.22); add(sign);
    const emb = new THREE.Mesh(new THREE.CircleGeometry(0.7, 32), new THREE.MeshBasicMaterial({ map: emblemTex(), toneMapped: false }));
    emb.position.set(CX, Y + 5.35, CZ + D / 2 + 0.22); add(emb);

    /* Interior floor and ceiling (walkable). */
    const fl = box(W - T * 2, 0.12, D - T * 2, CX, Y, CZ, floorM, { collide: false, floor: true, parent: grp });
    if (W3D.lib && W3D.lib.floors) W3D.lib.floors.push({ x0: CX - W / 2 + T, x1: CX + W / 2 - T, z0: CZ - D / 2 + T, z1: CZ + D / 2 - T, y: Y + 0.14 });
    box(W - T * 2, 0.08, D - T * 2, CX, Y + H - 0.2, CZ, ceilM, { collide: false, parent: grp });
    W3D.gHooks = W3D.gHooks || [];
    W3D.gHooks.push((x, z) => {
      if (Math.abs(x - CX) < W / 2 - T && Math.abs(z - CZ) < D / 2 - T) return Y + 0.14;
      return null;
    });

    /* Stage at the west end. */
    box(8, 0.45, D - 2, CX - W / 2 + 5.2, Y + 0.14, CZ, new THREE.MeshLambertMaterial({ color: 0x4a3424 }), { collide: false, floor: true, parent: grp });
    if (W3D.lib && W3D.lib.floors) W3D.lib.floors.push({ x0: CX - W / 2 + 1.2, x1: CX - W / 2 + 9.2, z0: CZ - D / 2 + 1, z1: CZ + D / 2 - 1, y: Y + 0.59 });
    const curtain = new THREE.MeshLambertMaterial({ color: 0x6b1c24 });
    box(0.12, 2.8, D - 3, CX - W / 2 + 1.3, Y + 0.59, CZ, curtain, { collide: false, parent: grp });

    /* Bar along the north wall. */
    box(16, 1.1, 0.7, CX + 4, Y + 0.14, CZ - D / 2 + 1.6, dark, { parent: grp });
    box(16, 0.08, 0.85, CX + 4, Y + 1.24, CZ - D / 2 + 1.6, cream, { collide: false, parent: grp });
    for (let i = -3; i <= 3; i++) {
      const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.7, 12), dark);
      stool.position.set(CX + 4 + i * 1.8, Y + 0.5, CZ - D / 2 + 2.5);
      add(stool);
    }

    /* Tables down the hall. */
    for (const [tx, tz] of [[4, 2], [4, -1], [9, 2], [9, -1], [14, 2], [14, -1]]) {
      box(1.6, 0.72, 1.6, CX + tx - 4, Y + 0.14, CZ + tz, cream, { collide: false, parent: grp });
      for (const [dx, dz] of [[-0.9, 0], [0.9, 0], [0, -0.9], [0, 0.9]]) {
        const ch = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.85, 0.4), dark);
        ch.position.set(CX + tx - 4 + dx, Y + 0.56, CZ + tz + dz); add(ch);
      }
    }

    /* Quiet POW/MIA remembrance table, east end, small and plainly set. */
    box(0.9, 0.74, 0.9, CX + W / 2 - 3.2, Y + 0.14, CZ + 5, cream, { collide: false, parent: grp });
    const cloth = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.02, 1.0), new THREE.MeshLambertMaterial({ color: 0xffffff }));
    cloth.position.set(CX + W / 2 - 3.2, Y + 0.90, CZ + 5); add(cloth);
    const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.18, 8), new THREE.MeshBasicMaterial({ color: 0xfff4d0 }));
    candle.position.set(CX + W / 2 - 3.2, Y + 1.02, CZ + 5); add(candle);

    /* Wall flags inside, south of the bar. */
    const us = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.85), new THREE.MeshBasicMaterial({ map: flagTex(), toneMapped: false, side: THREE.DoubleSide }));
    us.position.set(CX - 2, Y + 3.1, CZ - D / 2 + T + 0.05); add(us);

    /* Ceiling lights. */
    const lamp = new THREE.MeshLambertMaterial({ color: 0xfff3c8, emissive: 0xffe8a0, emissiveIntensity: 0.6 });
    for (let i = -2; i <= 2; i++) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.08, 16), lamp);
      p.position.set(CX + i * 6, Y + H - 0.28, CZ); add(p);
    }

    /* Flagpole in the front yard, east of the door. */
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 8, 10), new THREE.MeshLambertMaterial({ color: 0xccccd0 }));
    pole.position.set(CX + 8.5, Y + 4, CZ + D / 2 + 6); add(pole);
    const flg = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.15), new THREE.MeshBasicMaterial({ map: flagTex(), toneMapped: false, side: THREE.DoubleSide }));
    flg.position.set(CX + 7.4, Y + 7.3, CZ + D / 2 + 6); add(flg);

    /* Low dedication stone by the path. No phone number. */
    const stone = box(1.6, 0.9, 0.35, CX - 6, Y, CZ + D / 2 + 5.5, new THREE.MeshLambertMaterial({ color: 0x6a6a68 }), { collide: false, parent: grp });
    const sc = document.createElement('canvas'); sc.width = 512; sc.height = 256;
    const sg = sc.getContext('2d');
    sg.fillStyle = '#6a6a68'; sg.fillRect(0, 0, 512, 256);
    sg.fillStyle = '#eee'; sg.textAlign = 'center';
    sg.font = 'bold 28px Helvetica, Arial, sans-serif';
    sg.fillText('American Legion', 256, 80);
    sg.fillText('Post 405', 256, 120);
    sg.font = '22px Helvetica, Arial, sans-serif';
    sg.fillText('291 Mill Street, Raynham', 256, 170);
    const st = new THREE.CanvasTexture(sc); st.colorSpace = THREE.SRGBColorSpace;
    const face = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.75), new THREE.MeshBasicMaterial({ map: st, toneMapped: false }));
    face.position.set(CX - 6, Y + 0.55, CZ + D / 2 + 5.7); add(face);

    W3D.keepOut = (W3D.keepOut || []).concat([{ x: CX, z: CZ, r: 42, name: 'American Legion Post 405' }]);

    const grpBtn = document.getElementById('go-pond');
    if (grpBtn && !document.getElementById('post405btn')) {
      const b = document.createElement('button');
      b.id = 'post405btn'; b.setAttribute('data-w', 'post-405');
      b.textContent = 'American Legion Post 405';
      grpBtn.appendChild(b);
    }
    const tools = document.querySelector('#ui .tools');
    if (tools && !document.getElementById('post405tool')) {
      const b = document.createElement('button'); b.id = 'post405tool';
      b.textContent = 'Post 405'; b.onclick = e => { e.stopPropagation(); goPost(); };
      tools.appendChild(b);
    }
    console.log('legion405: Post 405 at', CX, CZ, 'floor', Y);
  }

  wait(build);
})();
