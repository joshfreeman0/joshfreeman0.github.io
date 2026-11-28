/* American Legion Post 405, 291 Mill Street, Raynham, MA (staging only).
   Replaces the brick placeholder with a photo-accurate white vinyl lodge on the
   MassGIS roofprint (centroid 536.7, -718.3; ~4 m east of the old 533, -718.7
   stub, same ring-road clearing). Public sources: alpost405.org, Raynham
   assessor parcel 8-240A (FY2026, 1-story lodge, built 1979, 4.93 acres),
   MassGIS STRUCTURES_POLY, ESRI World Imagery. Josh's photos and the 2011
   post front photo were used as visual reference and are not republished.
   Generic unnamed figures only; named people go in legion405-people.json. */
(function () {
  'use strict';
  const W3D = window.W3D = window.W3D || {};
  const LITE = !!window.JFVR_LITE;
  const CX = 536.70, CZ = -718.26;          // MassGIS roofprint centroid
  const YAW = 19.14 * Math.PI / 180;        // long axis ~19° south of east, front faces the lot
  const HL = 19.74, HD = 10.60, WALL = 4.4, ROOF = 2.55, DOORX = 4.2;
  const WHITE = 0xf4f1ea, BLUE = 0x1c4b93, TRIM = 0xf7f4ee, SHINGLE = 0x4a4a4e;
  const BRICK = 0x8a4e3a, ASPHALT = 0x5a5a58, GRASS = 0x6a7a4a, CEMENT = 0xc5c0b4;
  const WOOD = 0x6b4a2e, BAR = 0x3d2a1a, SKIN = 0xe0b089;
  let site = null, added = {floors: [], walls: []}, GY = 20;

  function hud(m) { if (W3D.toast) W3D.toast(m, 3000); else if (window.JFVR && JFVR.hud) JFVR.hud(m); }
  function tH(x, z) { const y = W3D.terrainH ? W3D.terrainH(x, z) : 0; return isFinite(y) ? y : 0; }
  function kit(T) {
    const parts = [], m4 = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), v = new T.Vector3(), sc = new T.Vector3();
    function add(g, color, x, y, z, rx, ry, rz, sx, sy, sz) {
      e.set(rx || 0, ry || 0, rz || 0); q.setFromEuler(e); v.set(x || 0, y || 0, z || 0);
      sc.set(sx || 1, sy == null ? (sx || 1) : sy, sz == null ? (sx || 1) : sz);
      m4.compose(v, q, sc); const n = g.index ? g.toNonIndexed() : g; if (n !== g) g.dispose();
      n.applyMatrix4(m4); parts.push([n, new T.Color(color)]);
    }
    function build() {
      let n = 0; parts.forEach(([g]) => { n += g.attributes.position.count; });
      const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3); let o = 0;
      parts.forEach(([g, c]) => { pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3);
        for (let i = 0; i < g.attributes.position.count; i++) { col[(o + i) * 3] = c.r; col[(o + i) * 3 + 1] = c.g; col[(o + i) * 3 + 2] = c.b; }
        o += g.attributes.position.count; g.dispose(); });
      parts.length = 0; const out = new T.BufferGeometry();
      out.setAttribute('position', new T.BufferAttribute(pos, 3)); out.setAttribute('normal', new T.BufferAttribute(nor, 3));
      out.setAttribute('color', new T.BufferAttribute(col, 3)); out.computeBoundingSphere(); return out;
    }
    return {add, build};
  }
  function tex(T, w, h, fn, clamp) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h);
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace || t.colorSpace; t.anisotropy = 4;
    if (clamp) { t.wrapS = t.wrapT = T.ClampToEdgeWrapping; } else { t.wrapS = t.wrapT = T.RepeatWrapping; }
    return t;
  }
  function worldXZ(lx, lz) {
    const c = Math.cos(YAW), s = Math.sin(YAW);
    return {x: CX + lx * c + lz * s, z: CZ - lx * s + lz * c};
  }

  function clapboard(T) {
    return tex(T, 256, 256, (x, w, h) => {
      x.fillStyle = '#f3f0e8'; x.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 16) {
        x.fillStyle = y % 32 ? '#ece9e0' : '#f6f3ec';
        x.fillRect(0, y, w, 14);
        x.fillStyle = 'rgba(80,70,60,0.18)'; x.fillRect(0, y + 14, w, 2);
      }
    });
  }
  function shingles(T) {
    return tex(T, 256, 256, (x, w, h) => {
      x.fillStyle = '#3f3f44'; x.fillRect(0, 0, w, h);
      for (let y = 0, r = 0; y < h; y += 14, r++) {
        const off = (r % 2) * 10;
        for (let i = -1; i < 14; i++) {
          x.fillStyle = 'rgb(' + (58 + ((i * 7 + r * 3) % 18)) + ',' + (58 + ((i * 5) % 14)) + ',' + (62 + ((r * 2) % 10)) + ')';
          x.fillRect(i * 20 + off + 1, y + 1, 18, 12);
        }
      }
    });
  }
  function flagTex(T) {
    return tex(T, 640, 336, (g) => {
      const sh = 336 / 13;
      for (let i = 0; i < 13; i++) { g.fillStyle = i % 2 === 0 ? '#bf0a30' : '#fff'; g.fillRect(0, i * sh, 640, sh + 0.5); }
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
            (k ? g.lineTo : g.moveTo).call(g, x + Math.cos(a) * 7, y + Math.sin(a) * 7);
          }
          g.closePath(); g.fill();
        }
      }
    }, true);
  }
  function awningTex(T) {
    return tex(T, 512, 160, (x, w, h) => {
      x.fillStyle = '#1a4a96'; x.fillRect(0, 0, w, h);
      x.fillStyle = '#163e80'; for (let i = 0; i < w; i += 28) x.fillRect(i, 0, 10, h);
      x.fillStyle = '#fff'; x.font = 'bold 64px Helvetica, Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText('POST 405', w / 2, h / 2);
    }, true);
  }
  function signTex(T) {
    return tex(T, 1024, 512, (x, w, h) => {
      x.fillStyle = '#12315a'; x.fillRect(0, 0, w, h);
      x.strokeStyle = '#c9a227'; x.lineWidth = 14; x.strokeRect(16, 16, w - 32, h - 32);
      x.fillStyle = '#c9a227'; x.beginPath(); x.arc(140, 256, 90, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#12315a'; x.beginPath();
      for (let k = 0; k < 5; k++) {
        const a = -Math.PI / 2 + k * 4 * Math.PI / 5;
        (k ? x.lineTo : x.moveTo).call(x, 140 + Math.cos(a) * 58, 256 + Math.sin(a) * 58);
      }
      x.closePath(); x.fill();
      x.fillStyle = '#f4f0e6'; x.textAlign = 'left';
      x.font = 'bold 72px Helvetica, Arial, sans-serif'; x.fillText('AMERICAN LEGION', 260, 200);
      x.font = 'bold 96px Helvetica, Arial, sans-serif'; x.fillText('POST 405', 260, 310);
      x.font = '36px Helvetica, Arial, sans-serif'; x.fillText('Raynham, Massachusetts', 260, 390);
    }, true);
  }
  function panelTex(T) {
    return tex(T, 1024, 1400, (x, w, h) => {
      x.fillStyle = '#1a2740'; x.fillRect(0, 0, w, h);
      x.strokeStyle = '#c9a227'; x.lineWidth = 10; x.strokeRect(18, 18, w - 36, h - 36);
      const lines = [
        ['American Legion Post 405', 52, 70],
        ['291 Mill Street, Raynham, Massachusetts', 28, 130],
        ['', 16, 160],
        ['Post 405 stands on Raynham assessor parcel 8-240A,', 24, 200],
        ['a 4.93-acre lot. The town records the one-story lodge', 24, 236],
        ['as built in 1979, with about 10,760 square feet of', 24, 272],
        ['building area. An adjoining 1.26-acre lot at 0 Mill', 24, 308],
        ['Street (parcel 8-239A) is also held by the post.', 24, 344],
        ['', 16, 380],
        ['The American Legion was founded in 1919 for veterans', 24, 416],
        ['of the U.S. Armed Forces who served on active duty.', 24, 452],
        ['Post 405 is a non-smoking meeting place for members', 24, 488],
        ['and is also open to the public. Member meetings are', 24, 524],
        ['held on the first Thursday of each month. The kitchen', 24, 560],
        ['is open Wednesday through Sunday.', 24, 596],
        ['', 16, 632],
        ['The Sgt. 1st Class Jared C. Monti Function Room was', 24, 668],
        ['dedicated here on Veterans Day 2010. It honors Army', 24, 704],
        ['Sgt. 1st Class Jared C. Monti, a Medal of Honor', 24, 740],
        ['recipient. The hall has a dance floor and stage and', 24, 776],
        ['seats about 120 guests.', 24, 812],
        ['', 16, 848],
        ['Behind the post is the Carl T. Sherman Memorial', 24, 884],
        ['Athletic Field, published as a 300-by-200-foot field', 24, 920],
        ['for soccer, lacrosse and football. The grounds also', 24, 956],
        ['include a parking lot, pavilion and lawn.', 24, 992],
        ['', 16, 1028],
        ['People in this hall are generic, unnamed figures of', 24, 1064],
        ['members, guests and Sons of the American Legion.', 24, 1100],
        ['', 16, 1140],
        ['Sources: alpost405.org; Town of Raynham / MassGIS', 20, 1180],
        ['assessor parcels (FY2026); MassGIS Building Structures;', 20, 1210],
        ['Taunton Gazette, 2 November 2010.', 20, 1240]
      ];
      x.textAlign = 'center';
      lines.forEach(([s, sz, y]) => { x.fillStyle = sz >= 40 ? '#f4d27a' : '#f0ead8'; x.font = (sz >= 40 ? 'bold ' : '') + sz + 'px Georgia, serif'; if (s) x.fillText(s, w / 2, y); });
    }, true);
  }
  function fieldSignTex(T) {
    return tex(T, 1024, 256, (x, w, h) => {
      x.fillStyle = '#1a3a1a'; x.fillRect(0, 0, w, h);
      x.strokeStyle = '#d6c07a'; x.lineWidth = 10; x.strokeRect(12, 12, w - 24, h - 24);
      x.fillStyle = '#f4f0e0'; x.textAlign = 'center';
      x.font = 'bold 48px Helvetica, Arial, sans-serif'; x.fillText('CARL T. SHERMAN', w / 2, 110);
      x.font = 'bold 40px Helvetica, Arial, sans-serif'; x.fillText('MEMORIAL ATHLETIC FIELD', w / 2, 175);
    }, true);
  }

  function personGeo(T, outfit) {
    const K = kit(T);
    const shirt = outfit === 'legion-cap' ? 0x2a3a55 : outfit === 'sal-vest' || outfit === 'sal-cap' ? 0x1e3a6e : 0x5a6a58;
    const pants = outfit === 'casual' ? 0x3a3a40 : 0x2a2a30;
    K.add(new T.CylinderGeometry(0.07, 0.06, 0.85, 6), pants, 0.1, 0.45, 0);
    K.add(new T.CylinderGeometry(0.07, 0.06, 0.85, 6), pants, -0.1, 0.45, 0);
    K.add(new T.BoxGeometry(0.1, 0.05, 0.22), 0x111111, 0.1, 0.03, -0.02);
    K.add(new T.BoxGeometry(0.1, 0.05, 0.22), 0x111111, -0.1, 0.03, -0.02);
    K.add(new T.CylinderGeometry(0.2, 0.17, 0.7, 8), shirt, 0, 1.22, 0);
    K.add(new T.CylinderGeometry(0.05, 0.045, 0.62, 5), shirt, 0.24, 1.18, 0);
    K.add(new T.CylinderGeometry(0.05, 0.045, 0.62, 5), shirt, -0.24, 1.18, 0);
    K.add(new T.SphereGeometry(0.045, 5, 4), SKIN, 0.24, 0.86, 0);
    K.add(new T.SphereGeometry(0.045, 5, 4), SKIN, -0.24, 0.86, 0);
    K.add(new T.SphereGeometry(0.11, 8, 6), SKIN, 0, 1.66, 0);
    if (outfit === 'legion-cap' || outfit === 'sal-cap') {
      const cap = outfit === 'sal-cap' ? 0x163a7a : 0x1a1e2a;
      K.add(new T.CylinderGeometry(0.13, 0.14, 0.1, 8), cap, 0, 1.78, 0);
      K.add(new T.BoxGeometry(0.16, 0.03, 0.1), cap, 0, 1.74, 0.12);
      K.add(new T.SphereGeometry(0.025, 6, 4), 0xc9a227, 0, 1.80, 0.11);
    } else {
      K.add(new T.SphereGeometry(0.12, 8, 6), 0x3a2a1c, 0, 1.78, 0, 0, 0, 0, 1, 0.7, 1);
    }
    if (outfit === 'sal-vest') {
      K.add(new T.BoxGeometry(0.38, 0.5, 0.22), 0x152e62, 0, 1.28, 0);
      K.add(new T.BoxGeometry(0.4, 0.04, 0.24), 0xc9a227, 0, 1.52, 0);
    }
    return K.build();
  }

  function addPeople(T, g, list) {
    const mat = new T.MeshLambertMaterial({vertexColors: true});
    const geos = {};
    list.forEach(fig => {
      if (fig.photo || (fig.name && String(fig.name).trim())) {
        /* Named or photographed figures wait on a later, consented pass. Generic body still shows. */
      }
      const key = fig.outfit || 'casual';
      if (!geos[key]) geos[key] = personGeo(T, key);
      const m = new T.Mesh(geos[key], mat);
      m.position.set(fig.lx || 0, (fig.ly || 0) + 0.02, fig.lz || 0);
      m.rotation.y = ((fig.yaw || 0) * Math.PI) / 180;
      m.name = 'legion-figure-' + (fig.id || 'x');
      g.add(m);
    });
  }

  function defaultPeople() {
    return [
      {id: 'bar-1', outfit: 'legion-cap', lx: -16.2, lz: 1.6, yaw: 90},
      {id: 'bar-2', outfit: 'casual', lx: -16.2, lz: 3.4, yaw: 90},
      {id: 'table-1', outfit: 'legion-cap', lx: -4.2, lz: 3.2, yaw: 200},
      {id: 'table-2', outfit: 'casual', lx: -2.4, lz: 3.8, yaw: 20},
      {id: 'table-3', outfit: 'sal-cap', lx: 5.2, lz: -2.2, yaw: 160},
      {id: 'table-4', outfit: 'sal-vest', lx: 6.8, lz: -1.5, yaw: -20},
      {id: 'hall-1', outfit: 'casual', lx: 10.5, lz: 2.4, yaw: -90}
    ];
  }

  function build() {
    if (site || !W3D.root || typeof THREE === 'undefined') return;
    const T = THREE;
    let yMax = 16.5;
    for (let x = CX - 40; x <= CX + 30; x += 8) for (let z = CZ - 30; z <= CZ + 40; z += 8) yMax = Math.max(yMax, tH(x, z));
    GY = yMax + 0.02;
    const root = new T.Group(); root.name = 'post-405'; root.position.set(0, 0, 0);
    const g = new T.Group(); g.name = 'legion405-lodge'; g.position.set(CX, GY, CZ); g.rotation.y = YAW;
    const K = kit(T);

    // floor slab and walls
    K.add(new T.BoxGeometry(HL * 2 + 0.4, 0.22, HD * 2 + 0.4), CEMENT, 0, 0.05, 0);
    K.add(new T.BoxGeometry(HL * 2, WALL, 0.28), WHITE, 0, WALL / 2, HD);           // front (lot)
    K.add(new T.BoxGeometry(HL * 2, WALL, 0.28), WHITE, 0, WALL / 2, -HD);          // back
    K.add(new T.BoxGeometry(0.28, WALL, HD * 2), WHITE, HL, WALL / 2, 0);           // east (Mill St)
    K.add(new T.BoxGeometry(0.28, WALL, HD * 2), WHITE, -HL, WALL / 2, 0);          // west
    // door opening punched visually with a recessed blue door + transom
    K.add(new T.BoxGeometry(1.6, 2.5, 0.12), BLUE, DOORX, 1.35, HD + 0.12);
    K.add(new T.BoxGeometry(0.08, 2.5, 0.04), TRIM, DOORX - 0.4, 1.35, HD + 0.2);
    K.add(new T.BoxGeometry(0.08, 2.5, 0.04), TRIM, DOORX + 0.4, 1.35, HD + 0.2);
    // second (members') door toward the west front
    K.add(new T.BoxGeometry(1.2, 2.2, 0.1), BLUE, -12.5, 1.2, HD + 0.12);
    // windows + blue shutters along the front and sides
    const wxs = [-16, -8, -2, 10, 15];
    wxs.forEach(x => {
      if (Math.abs(x - DOORX) < 3) return;
      K.add(new T.BoxGeometry(1.2, 1.3, 0.08), 0x7a90a4, x, 2.15, HD + 0.14);
      K.add(new T.BoxGeometry(0.06, 1.3, 0.04), TRIM, x, 2.15, HD + 0.2);
      K.add(new T.BoxGeometry(0.38, 1.4, 0.08), BLUE, x - 0.85, 2.15, HD + 0.12);
      K.add(new T.BoxGeometry(0.38, 1.4, 0.08), BLUE, x + 0.85, 2.15, HD + 0.12);
    });
    [-6, 0, 6].forEach(z => {
      K.add(new T.BoxGeometry(0.08, 1.3, 1.1), 0x7a90a4, HL + 0.16, 2.15, z);
      K.add(new T.BoxGeometry(0.08, 1.4, 0.35), BLUE, HL + 0.14, 2.15, z - 0.8);
      K.add(new T.BoxGeometry(0.08, 1.4, 0.35), BLUE, HL + 0.14, 2.15, z + 0.8);
    });

    // gable roof along the long axis
    const ridge = WALL + ROOF;
    const roofA = new T.BufferGeometry();
    const rp = new Float32Array([
      -HL - 0.5, WALL - 0.05, -HD - 0.45,  HL + 0.5, WALL - 0.05, -HD - 0.45,  HL + 0.5, ridge, 0,
      -HL - 0.5, WALL - 0.05, -HD - 0.45,  HL + 0.5, ridge, 0,  -HL - 0.5, ridge, 0,
      -HL - 0.5, WALL - 0.05,  HD + 0.45,  -HL - 0.5, ridge, 0,  HL + 0.5, ridge, 0,
      -HL - 0.5, WALL - 0.05,  HD + 0.45,  HL + 0.5, ridge, 0,  HL + 0.5, WALL - 0.05, HD + 0.45
    ]);
    roofA.setAttribute('position', new T.BufferAttribute(rp, 3)); roofA.computeVertexNormals();
    K.add(roofA, SHINGLE, 0, 0, 0);
    // gable triangles (white)
    K.add(new T.BoxGeometry(0.2, ROOF + 0.2, HD * 2 + 0.2), WHITE, HL + 0.05, WALL + ROOF / 2 - 0.1, 0);
    K.add(new T.BoxGeometry(0.2, ROOF + 0.2, HD * 2 + 0.2), WHITE, -HL - 0.05, WALL + ROOF / 2 - 0.1, 0);
    // two brick chimneys on the ridge
    K.add(new T.BoxGeometry(0.7, 1.6, 0.55), BRICK, 6.5, ridge + 0.5, 0.15);
    K.add(new T.BoxGeometry(0.8, 0.12, 0.65), 0x5a5a58, 6.5, ridge + 1.3, 0.15);
    K.add(new T.BoxGeometry(0.7, 1.6, 0.55), BRICK, -7.2, ridge + 0.5, -0.15);
    K.add(new T.BoxGeometry(0.8, 0.12, 0.65), 0x5a5a58, -7.2, ridge + 1.3, -0.15);

    // concrete stoop + ADA ramp to the main door (front)
    K.add(new T.BoxGeometry(3.2, 0.22, 1.8), CEMENT, DOORX, 0.2, HD + 1.1);
    K.add(new T.BoxGeometry(1.4, 0.14, 5.2), CEMENT, DOORX + 2.2, 0.12, HD + 2.4, 0, 0, 0.18);
    K.add(new T.CylinderGeometry(0.03, 0.03, 5.0, 5), 0x1a1a1a, DOORX + 1.5, 0.55, HD + 2.4, 0, 0, 0.18);
    K.add(new T.CylinderGeometry(0.03, 0.03, 5.0, 5), 0x1a1a1a, DOORX + 2.9, 0.55, HD + 2.4, 0, 0, 0.18);
    // left-wing steps
    K.add(new T.BoxGeometry(1.6, 0.18, 1.1), CEMENT, -12.5, 0.16, HD + 0.9);
    K.add(new T.CylinderGeometry(0.03, 0.03, 1.0, 5), 0x1a1a1a, -13.15, 0.6, HD + 0.9);
    K.add(new T.CylinderGeometry(0.03, 0.03, 1.0, 5), 0x1a1a1a, -11.85, 0.6, HD + 0.9);

    // red-white-blue bunting along the front eave
    for (let i = 0; i < 11; i++) {
      const x = -HL + 2 + i * 3.5, col = i % 3 === 0 ? 0xbf0a30 : i % 3 === 1 ? 0xffffff : 0x1c4b93;
      K.add(new T.BoxGeometry(1.5, 0.55, 0.08), col, x, WALL - 0.15, HD + 0.28);
    }

    const built = new T.Mesh(K.build(), new T.MeshLambertMaterial({vertexColors: true}));
    g.add(built);

    // clapboard only on the side gables so it does not cover the front door, windows or sign
    const clap = clapboard(T); clap.repeat.set(3, 2.2);
    const sideMat = new T.MeshLambertMaterial({map: clap, color: 0xf2efe8});
    const eastClap = new T.Mesh(new T.PlaneGeometry(HD * 2 - 0.3, WALL - 0.3), sideMat);
    eastClap.position.set(HL + 0.17, WALL / 2, 0); eastClap.rotation.y = Math.PI / 2; g.add(eastClap);
    const westClap = eastClap.clone(); westClap.position.x = -HL - 0.17; westClap.rotation.y = -Math.PI / 2; g.add(westClap);

    const sh = shingles(T); sh.repeat.set(6, 3);
    // already colored the roof mesh; a second textured overlay on each pitch
    const pitch = new T.Mesh(new T.PlaneGeometry(HL * 2 + 1.2, Math.hypot(HD + 0.45, ROOF) + 0.2), new T.MeshLambertMaterial({map: sh, color: 0x9a9aa0}));
    const plen = Math.hypot(HD + 0.45, ROOF);
    const pang = Math.atan2(ROOF, HD + 0.45);
    pitch.position.set(0, WALL + ROOF / 2 - 0.05, (HD + 0.2) / 2); pitch.rotation.x = -pang; g.add(pitch);
    const pitch2 = pitch.clone(); pitch2.position.z = -(HD + 0.2) / 2; pitch2.rotation.x = pang; g.add(pitch2);

    // blue POST 405 awning
    const awn = new T.Mesh(new T.BoxGeometry(2.6, 0.08, 1.3), new T.MeshLambertMaterial({map: awningTex(T), color: 0xffffff}));
    awn.position.set(DOORX, 2.85, HD + 0.85); g.add(awn);
    const awnS = new T.Mesh(new T.BoxGeometry(0.06, 0.7, 0.06), new T.MeshLambertMaterial({color: 0x1a1a1a}));
    const s1 = awnS.clone(); s1.position.set(DOORX - 1.15, 2.5, HD + 1.4); g.add(s1);
    const s2 = awnS.clone(); s2.position.set(DOORX + 1.15, 2.5, HD + 1.4); g.add(s2);

    // wall sign on the east gable
    const sign = new T.Mesh(new T.PlaneGeometry(4.6, 2.3), new T.MeshBasicMaterial({map: signTex(T)}));
    sign.position.set(HL + 0.22, 3.3, 0); sign.rotation.y = Math.PI / 2; g.add(sign);

    // interior: floor, bar, tables, fireplace, history panel
    const floorMat = new T.MeshLambertMaterial({color: 0x8a6a45});
    const fl = new T.Mesh(new T.BoxGeometry(HL * 2 - 0.6, 0.08, HD * 2 - 0.6), floorMat);
    fl.position.set(0, 0.18, 0); g.add(fl);
    const barM = new T.MeshLambertMaterial({color: BAR});
    const bar = new T.Mesh(new T.BoxGeometry(1.2, 1.05, 8.5), barM);
    bar.position.set(-16.8, 0.75, 1.2); g.add(bar);
    const bartop = new T.Mesh(new T.BoxGeometry(1.35, 0.08, 8.7), new T.MeshLambertMaterial({color: 0x5a3a22}));
    bartop.position.set(-16.8, 1.28, 1.2); g.add(bartop);
    const stools = [[-15.6, 1.6], [-15.6, 3.4], [-15.6, 0.0], [-15.6, 5.0]];
    stools.forEach(([x, z]) => {
      const st = new T.Mesh(new T.CylinderGeometry(0.22, 0.25, 0.7, 8), new T.MeshLambertMaterial({color: 0x2a2a2a}));
      st.position.set(x, 0.5, z); g.add(st);
    });
    // tables
    [[-3.4, 3.5], [6.0, -1.8], [11.0, 3.0]].forEach(([x, z]) => {
      const ttop = new T.Mesh(new T.CylinderGeometry(0.9, 0.9, 0.08, 12), new T.MeshLambertMaterial({color: 0x7a5a38}));
      ttop.position.set(x, 0.76, z); g.add(ttop);
      const leg = new T.Mesh(new T.CylinderGeometry(0.07, 0.08, 0.72, 6), new T.MeshLambertMaterial({color: 0x2a2a2a}));
      leg.position.set(x, 0.4, z); g.add(leg);
    });
    // fireplace on the back wall
    const fp = new T.Mesh(new T.BoxGeometry(2.2, 2.1, 0.45), new T.MeshLambertMaterial({color: BRICK}));
    fp.position.set(0, 1.15, -HD + 0.45); g.add(fp);
    const open = new T.Mesh(new T.BoxGeometry(1.2, 0.9, 0.2), new T.MeshLambertMaterial({color: 0x141414, emissive: 0x331800, emissiveIntensity: 0.4}));
    open.position.set(0, 0.7, -HD + 0.7); g.add(open);
    // history panel just inside the door, on the east interior wall
    const pan = new T.Mesh(new T.PlaneGeometry(1.7, 2.3), new T.MeshBasicMaterial({map: panelTex(T)}));
    pan.position.set(HL - 0.4, 1.7, 5.2); pan.rotation.y = -Math.PI / 2; g.add(pan);
    const pfr = new T.Mesh(new T.BoxGeometry(0.08, 2.4, 1.8), new T.MeshLambertMaterial({color: 0xc9a227}));
    pfr.position.set(HL - 0.36, 1.7, 5.2); g.add(pfr);

    // warm interior fill
    const lamp = new T.PointLight(0xffe0b0, 0.7, 28, 2); lamp.position.set(0, 3.2, 0); g.add(lamp);

    root.add(g);

    // parking lot (clipped north of the ring road that runs along Mill St)
    const lotPts = [
      [556.0, -736.2], [552.5, -710.0], [548.0, -698.0], [534.0, -686.0],
      [512.0, -692.0], [497.3, -733.4], [519.6, -739.8]
    ];
    const shape = new T.Shape();
    lotPts.forEach(([x, z], i) => { if (i === 0) shape.moveTo(x - CX, -(z - CZ)); else shape.lineTo(x - CX, -(z - CZ)); });
    shape.closePath();
    const lotG = new T.ShapeGeometry(shape);
    const lot = new T.Mesh(lotG, new T.MeshLambertMaterial({color: ASPHALT}));
    lot.rotation.x = -Math.PI / 2; lot.position.set(CX, GY + 0.03, CZ); lot.name = 'legion-lot';
    root.add(lot);
    // stall lines (simple, in the south-central lot, local-ish)
    const lineM = new T.MeshBasicMaterial({color: 0xc8c4b0});
    for (let i = 0; i < 8; i++) {
      const p = worldXZ(-8 + i * 3.2, 22);
      const ln = new T.Mesh(new T.BoxGeometry(0.08, 0.02, 4.6), lineM);
      ln.position.set(p.x, GY + 0.05, p.z); ln.rotation.y = YAW; root.add(ln);
    }

    // flagpole island + memorial in front of the door
    const island = worldXZ(DOORX, HD + 14);
    const isY = Math.max(GY, tH(island.x, island.z)) + 0.04;
    const kerb = new T.Mesh(new T.CylinderGeometry(2.1, 2.2, 0.25, 16), new T.MeshLambertMaterial({color: CEMENT}));
    kerb.position.set(island.x, isY, island.z); root.add(kerb);
    const grassI = new T.Mesh(new T.CylinderGeometry(1.85, 1.85, 0.08, 16), new T.MeshLambertMaterial({color: GRASS}));
    grassI.position.set(island.x, isY + 0.14, island.z); root.add(grassI);
    const pole = new T.Mesh(new T.CylinderGeometry(0.06, 0.07, 9.5, 8), new T.MeshLambertMaterial({color: 0xd0d0d4}));
    pole.position.set(island.x, isY + 4.9, island.z); root.add(pole);
    const flag = new T.Mesh(new T.PlaneGeometry(2.4, 1.26), new T.MeshLambertMaterial({map: flagTex(T), side: T.DoubleSide}));
    flag.position.set(island.x + 1.2, isY + 8.6, island.z); flag.rotation.y = YAW; root.add(flag);
    const stone = new T.Mesh(new T.BoxGeometry(1.3, 0.85, 0.35), new T.MeshLambertMaterial({color: 0x6a6a68}));
    const stP = worldXZ(DOORX - 1.6, HD + 14);
    stone.position.set(stP.x, isY + 0.5, stP.z); stone.rotation.y = YAW; root.add(stone);
    const memT = tex(T, 512, 256, (x, w, h) => {
      x.fillStyle = '#6a6a68'; x.fillRect(0, 0, w, h);
      x.fillStyle = '#f0ead8'; x.textAlign = 'center';
      x.font = 'bold 32px Georgia, serif'; x.fillText('IN HONOR OF', w / 2, 80);
      x.font = 'bold 28px Georgia, serif'; x.fillText('ALL WHO SERVED', w / 2, 130);
      x.font = '24px Georgia, serif'; x.fillText('American Legion Post 405', w / 2, 185);
    }, true);
    const mem = new T.Mesh(new T.PlaneGeometry(1.2, 0.6), new T.MeshBasicMaterial({map: memT}));
    mem.position.set(stP.x, isY + 0.7, stP.z); mem.rotation.y = YAW; root.add(mem);

    // lamp posts around the lot
    [[18, 16], [8, 24], [-6, 22], [22, 8], [-14, 18]].forEach(([lx, lz]) => {
      const p = worldXZ(lx, lz);
      const y = Math.max(GY, tH(p.x, p.z));
      const post = new T.Mesh(new T.CylinderGeometry(0.06, 0.08, 5.2, 6), new T.MeshLambertMaterial({color: 0x2a2a2c}));
      post.position.set(p.x, y + 2.6, p.z); root.add(post);
      const head = new T.Mesh(new T.BoxGeometry(0.45, 0.12, 0.45), new T.MeshLambertMaterial({color: 0x333333, emissive: 0xffe8b0, emissiveIntensity: 0.25}));
      head.position.set(p.x, y + 5.25, p.z); root.add(head);
    });

    // north pavilion (MassGIS 765 sf roofprint, centroid ~522.5, -744.0)
    const pavY = Math.max(GY, tH(522.5, -744.0));
    const pav = new T.Group(); pav.position.set(522.5, pavY, -744.0); pav.rotation.y = YAW;
    pav.add(new T.Mesh(new T.BoxGeometry(8.0, 3.2, 11.8), new T.MeshLambertMaterial({color: WHITE})));
    pav.children[0].position.y = 1.6;
    const prav = new T.Mesh(new T.BoxGeometry(8.6, 0.2, 12.4), new T.MeshLambertMaterial({color: SHINGLE}));
    prav.position.y = 3.3; pav.add(prav);
    root.add(pav);
    // small shed (MassGIS 220 sf, ~550.3, -745.1)
    const shY = Math.max(GY, tH(550.3, -745.1));
    const shed = new T.Mesh(new T.BoxGeometry(6.0, 2.4, 5.2), new T.MeshLambertMaterial({color: 0xe8e4da}));
    shed.position.set(550.3, shY + 1.2, -745.1); shed.rotation.y = YAW; root.add(shed);

    // athletic field, north of the ring road (narrower than the real 300x200 ft
    // so the restored ring along Mill St stays clear)
    const fEN = {x: 497.0, z: -742.0}, fES = {x: 506.0, z: -706.0};
    const fWN = {x: 408.0, z: -726.0}, fWS = {x: 417.0, z: -700.0};
    const fShape = new T.Shape();
    fShape.moveTo(fEN.x, -fEN.z); fShape.lineTo(fES.x, -fES.z); fShape.lineTo(fWS.x, -fWS.z); fShape.lineTo(fWN.x, -fWN.z); fShape.closePath();
    const field = new T.Mesh(new T.ShapeGeometry(fShape), new T.MeshLambertMaterial({color: GRASS}));
    field.rotation.x = -Math.PI / 2; field.position.y = Math.max(GY - 0.4, tH(455, -720)) + 0.02;
    field.name = 'sherman-field'; root.add(field);
    // goals at the east and west ends
    function goal(x, z, ry) {
      const y = Math.max(GY, tH(x, z));
      const posts = new T.Mesh(new T.BoxGeometry(0.1, 2.2, 7.3), new T.MeshLambertMaterial({color: 0xf0f0f0}));
      const gx = new T.Group(); gx.position.set(x, y + 1.1, z); gx.rotation.y = ry;
      const L = new T.Mesh(new T.BoxGeometry(0.1, 2.2, 0.1), posts.material); L.position.set(0, 0, -3.6); gx.add(L);
      const R = L.clone(); R.position.z = 3.6; gx.add(R);
      const C = new T.Mesh(new T.BoxGeometry(0.1, 0.1, 7.3), posts.material); C.position.y = 1.1; gx.add(C);
      root.add(gx);
    }
    goal(494, -724, YAW); goal(414, -713, YAW);
    const fsP = {x: 490, z: -738};
    const fsY = Math.max(GY, tH(fsP.x, fsP.z));
    const fsign = new T.Mesh(new T.PlaneGeometry(3.6, 0.9), new T.MeshBasicMaterial({map: fieldSignTex(T)}));
    fsign.position.set(fsP.x, fsY + 1.6, fsP.z); fsign.rotation.y = YAW + Math.PI; root.add(fsign);
    const fpost = new T.Mesh(new T.BoxGeometry(0.1, 1.6, 0.1), new T.MeshLambertMaterial({color: 0x333333}));
    fpost.position.set(fsP.x, fsY + 0.8, fsP.z); root.add(fpost);

    W3D.root.add(root); site = root;

    // walkable floors + segmented AABB walls
    const F = W3D.floors || (W3D.floors = []), WL = W3D.walls || (W3D.walls = []);
    const flAdd = (x0, x1, z0, z1, y) => { const o = {x0, x1, z0, z1, y}; F.push(o); added.floors.push(o); };
    const waAdd = (x0, x1, z0, z1, y0, y1) => { const o = {x0, x1, z0, z1, y0, y1}; WL.push(o); added.walls.push(o); };
    flAdd(CX - 26, CX + 24, CZ - 22, CZ + 28, GY + 0.2);
    // wall segments around the rotated hull, leaving a front door gap
    const corners = [[HL, HD], [HL, -HD], [-HL, -HD], [-HL, HD]];
    function segWall(a, b, gap) {
      const n = 8;
      for (let i = 0; i < n; i++) {
        const t0 = i / n, t1 = (i + 1) / n, tm = (t0 + t1) / 2;
        if (gap && Math.abs(tm - gap) < 0.08) continue;
        const p0 = worldXZ(a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0);
        const p1 = worldXZ(a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1);
        waAdd(Math.min(p0.x, p1.x) - 0.2, Math.max(p0.x, p1.x) + 0.2, Math.min(p0.z, p1.z) - 0.2, Math.max(p0.z, p1.z) + 0.2, GY, GY + WALL);
      }
    }
    segWall(corners[3], corners[0], (DOORX + HL) / (2 * HL));  // front, gap at door
    segWall(corners[0], corners[1], null);
    segWall(corners[1], corners[2], null);
    segWall(corners[2], corners[3], null);

    W3D.keepOut = W3D.keepOut || [];
    W3D.keepOut.push({x: CX, z: CZ, r: 48, name: 'American Legion Post 405'});

    wireSpot(); wireMenus();
    const peopleDone = list => { try { addPeople(T, g, list); } catch (e) { console.error('legion405 people', e); } };
    fetch('/vr-staging/fx/legion405-people.json?v=1').then(r => r.ok ? r.json() : Promise.reject()).then(j => {
      peopleDone((j && j.figures) || defaultPeople());
    }).catch(() => peopleDone(defaultPeople()));
    console.log('legion405: Post 405 at', CX, GY.toFixed(1), CZ);
  }

  function goPost() {
    if (!W3D.teleportTo) return setTimeout(goPost, 250);
    const p = worldXZ(DOORX, HD + 16);
    const y = tH(p.x, p.z) + 1.6;
    W3D.teleportTo(p.x, y, p.z, -19.14);
    hud('American Legion Post 405 — 291 Mill Street, Raynham');
  }
  function wireSpot() {
    W3D.spots = W3D.spots || {};
    ['legion405', 'legion', 'post-405', 'post405', 'american-legion', 'legion-405'].forEach(k => { W3D.spots[k] = goPost; });
  }
  function wireMenus() {
    const enter = ev => { if (ev) ev.preventDefault(); if (typeof window.goWorld === 'function') window.goWorld('legion405'); else goPost(); };
    const pond = document.querySelector('#gs-pond .jf-body') || document.getElementById('go-pond') || document.getElementById('go-far') || document.getElementById('ui');
    if (pond && !document.getElementById('legion405link')) {
      const b = document.createElement('button'); b.id = 'legion405link'; b.type = 'button'; b.textContent = 'American Legion Post 405';
      b.setAttribute('data-w', 'legion405'); b.addEventListener('click', enter); pond.appendChild(b);
      const home = () => { const body = document.querySelector('#gs-pond .jf-body'); if (body && b.parentNode !== body) body.appendChild(b); };
      setTimeout(home, 800); setTimeout(home, 2500);
    }
    const old = document.getElementById('post405btn');
    if (old && !old.dataset.wired) { old.dataset.wired = '1'; old.addEventListener('click', enter); }
  }

  (function attach() {
    const sc = document.querySelector('a-scene'); if (!sc) return setTimeout(attach, 300);
    const start = () => { if (!W3D.root || !W3D.terrainH) return setTimeout(start, 400); try { build(); } catch (e) { console.error('legion405 build', e && e.stack || e); } };
    if (window.W3D_READY) start(); else { const iv = setInterval(() => { if (window.W3D_READY) { clearInterval(iv); start(); } }, 400); setTimeout(() => clearInterval(iv), 180000); }
    wireSpot();
  })();

  window.FP_LEGION405 = {go: goPost, built: () => !!site, origin: {x: CX, z: CZ}};
})();
