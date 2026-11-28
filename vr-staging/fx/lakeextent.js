/* Restored Fowling Pond extent + ring road (staging only, Nov 27 2026).
   Water follows the pre-drainage outline (USGS 3DEP ≤58 ft ∪ NRCS muck/peat soils,
   ~660 acres / 1.9 mi, moderate confidence; Fobes 1793 “2 miles”) with MassDEP
   solid-waste landfills removed so the waterline is the restored shore, not later fill.
   A 4-lane ring road (two lanes each way) sits 30–60 m back (nominal 45 m) with a
   sand-to-grass shore strip. Streets that crossed the new water are clipped at the ring.
   Does not edit live /vr/ files, RPL, the companion module, or protected sites:
   temple, pyramid, launch pad, rivers, bank exterior, gold sun disc, lighthouse, boats.
   Those stay dry on a small island or shore if the new water would reach them. */
(function () {
  'use strict';
  const W3D = window.W3D = window.W3D || {};
  const SRC = '/vr-staging/fx/lakeextent.json?v=2';
  const WATER = 16.5, ROAD_W = 16, BUFFER = 45;
  let J = null, mask = null, lakeTex = null, mw = 0, mh = 0, inLake = () => false;

  /* Register the spot immediately so ?spot=lake-extent works even if this file's
     assets finish after W3D.build() calls goWorld(arrivalSpot()). */
  function goOverview() {
    if (!J || !W3D.teleportTo) return setTimeout(goOverview, 250);
    const s = J.spot || { x: 0, y: 560, z: 400, yaw: 0 };
    if (window.JFVR) JFVR.fly = true;
    const lab = document.querySelector('#flylabel'); if (lab) lab.setAttribute('value', 'Fly: ON');
    W3D.teleportTo(s.x, s.y, s.z, s.yaw == null ? 0 : s.yaw);
    hud('Restored Fowling Pond — about ' + J.acres + ' acres after landfill removal');
  }
  W3D.spots = W3D.spots || {};
  W3D.spots['lake-extent'] = goOverview;
  W3D.spots['historic-lake'] = goOverview;
  W3D.spots['restored-lake'] = goOverview;


  function hud(m) { if (window.JFVR && JFVR.hud) JFVR.hud(m); }

  function wait(fn) {
    const t0 = Date.now();
    (function go() {
      if (window.W3D_READY && W3D.root && W3D.water) return fn();
      if (Date.now() - t0 > 120000) return;
      setTimeout(go, 200);
    })();
  }

  fetch(SRC).then(r => r.json()).then(data => { J = data; wait(build); })
    .catch(e => console.warn('lakeextent: failed to load', e));

  /* ---- raster mask: G = water alpha, R = distance-to-shore / 80 m ---- */
  function buildMask() {
    const P = J.pond, w = P.x1 - P.x0, d = P.z1 - P.z0;
    const maxD = 1200;
    const sc = maxD / Math.max(w, d);
    mw = Math.max(64, Math.round(w * sc));
    mh = Math.max(64, Math.round(d * sc));
    const c = document.createElement('canvas'); c.width = mw; c.height = mh;
    const g = c.getContext('2d');
    g.fillStyle = '#000'; g.fillRect(0, 0, mw, mh);
    const X = x => (x - P.x0) / w * mw;
    const Z = z => (z - P.z0) / d * mh;   // z0 (north) at canvas top; flipY = false, uv.y = (z-z0)/d
    function path(rings) {
      g.beginPath();
      rings.forEach(ring => {
        ring.forEach((p, i) => { const x = X(p[0]), y = Z(p[1]); i ? g.lineTo(x, y) : g.moveTo(x, y); });
        g.closePath();
      });
    }
    g.fillStyle = '#fff';
    path(J.shore); g.fill('evenodd');
    if (J.holes && J.holes.length) {
      g.globalCompositeOperation = 'destination-out';
      path(J.holes); g.fill('evenodd');
      g.globalCompositeOperation = 'source-over';
    }
    const img = g.getImageData(0, 0, mw, mh), px = img.data;
    const inside = new Uint8Array(mw * mh);
    for (let i = 0, p = 0; i < inside.length; i++, p += 4) inside[i] = px[p] > 128 ? 1 : 0;
    /* 2-pass chamfer distance in pixels, then scale to metres / 80 */
    const dist = new Float32Array(mw * mh);
    const INF = 1e9, mpp = w / mw;
    for (let i = 0; i < dist.length; i++) dist[i] = inside[i] ? INF : 0;
    for (let y = 0; y < mh; y++) for (let x = 0; x < mw; x++) {
      const i = y * mw + x; if (!inside[i]) continue;
      let v = dist[i];
      if (x) v = Math.min(v, dist[i - 1] + 1);
      if (y) v = Math.min(v, dist[i - mw] + 1);
      if (x && y) v = Math.min(v, dist[i - mw - 1] + 1.414);
      if (x < mw - 1 && y) v = Math.min(v, dist[i - mw + 1] + 1.414);
      dist[i] = v;
    }
    for (let y = mh - 1; y >= 0; y--) for (let x = mw - 1; x >= 0; x--) {
      const i = y * mw + x; if (!inside[i]) continue;
      let v = dist[i];
      if (x < mw - 1) v = Math.min(v, dist[i + 1] + 1);
      if (y < mh - 1) v = Math.min(v, dist[i + mw] + 1);
      if (x < mw - 1 && y < mh - 1) v = Math.min(v, dist[i + mw + 1] + 1.414);
      if (x && y < mh - 1) v = Math.min(v, dist[i + mw - 1] + 1.414);
      dist[i] = v;
    }
    const FEATHER = 8; /* metres of soft shoreline */
    for (let i = 0, p = 0; i < inside.length; i++, p += 4) {
      if (!inside[i]) { px[p] = px[p + 1] = px[p + 2] = px[p + 3] = 0; continue; }
      const dm = dist[i] * mpp;
      const r = Math.max(0, Math.min(255, Math.round(dm / 80 * 255)));
      const a = dm >= FEATHER ? 255 : Math.round(255 * (dm / FEATHER));
      px[p] = r; px[p + 1] = a; px[p + 2] = r; px[p + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    mask = px;
    const sx = mw / w, sz = mh / d;
    inLake = (x, z) => {
      const c = Math.floor((x - P.x0) * sx), r = Math.floor((z - P.z0) * sz);
      if (c < 0 || r < 0 || c >= mw || r >= mh) return false;
      return mask[(r * mw + c) * 4 + 1] > 128;
    };
    const tex = new THREE.CanvasTexture(c);
    tex.flipY = false; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.generateMipmaps = false; tex.minFilter = tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true; lakeTex = tex; return tex;
  }

  function findPondMesh() {
    let found = null;
    W3D.root.traverse(o => {
      if (found || !o.isMesh || !o.material) return;
      const n = o.material.name || '';
      if (n !== 'water') return;
      if (o.name && /kings|river/i.test(o.name)) return;
      if (Math.abs((o.position.y || 0) - WATER) > 1) return;
      const box = new THREE.Box3().setFromObject(o);
      if (box.max.x - box.min.x > 800 && box.max.z - box.min.z > 500) found = o;
    });
    return found;
  }

  function addWater(am) {
    const P = J.pond, w = P.x1 - P.x0, d = P.z1 - P.z0;
    const geo = new THREE.PlaneGeometry(w, d, 12, 8);
    const uv = geo.attributes.uv, pos = geo.attributes.position;
    /* PlaneGeometry lies in XY; after rot -90 X, +Y becomes -Z. UVs in world xz; flipY = false. */
    for (let i = 0; i < pos.count; i++) {
      const lx = pos.getX(i), ly = pos.getY(i);
      const x = (P.x0 + P.x1) / 2 + lx;
      const z = (P.z0 + P.z1) / 2 - ly;
      uv.setXY(i, (x - P.x0) / w, (z - P.z0) / d);
    }
    uv.needsUpdate = true;
    const old = findPondMesh();
    let mesh;
    if (old) {
      /* Reuse the original pond mesh and its water shader (clone() dropped onBeforeCompile
         and broke fpreal.js photo-sky wrapping). */
      if (old.geometry && old.geometry !== geo) old.geometry.dispose();
      old.geometry = geo;
      old.rotation.set(-Math.PI / 2, 0, 0);
      old.position.set((P.x0 + P.x1) / 2, WATER, (P.z0 + P.z1) / 2);
      old.scale.set(1, 1, 1);
      old.visible = true;
      const mat = old.material;
      if (mat) {
        if (mat.alphaMap && mat.alphaMap.dispose) try { /* keep env / shader; only swap the mask */ } catch (e) {}
        mat.alphaMap = am;
        if (mat.alphaTest == null || mat.alphaTest < 0.1) mat.alphaTest = 0.5;
        mat.needsUpdate = true;
      }
      old.name = 'fowling-pond-restored';
      old.receiveShadow = true;
      mesh = old;
    } else {
      const mat = new THREE.MeshStandardMaterial({
        color: 0x24474a, roughness: 0.1, metalness: 0, alphaMap: am, alphaTest: 0.5, depthWrite: true
      });
      mat.name = 'water';
      if (W3D.env) { mat.envMap = W3D.env; mat.envMapIntensity = 0.75; }
      mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set((P.x0 + P.x1) / 2, WATER, (P.z0 + P.z1) / 2);
      mesh.receiveShadow = true;
      mesh.name = 'fowling-pond-restored';
      W3D.root.add(mesh);
    }
    W3D.water = W3D.water || {};
    W3D.water.restoredPond = P;
    W3D.lakeExtent = { inLake: inLake, data: J, acres: J.acres };
  }

  function flattenTerrain() {
    const _th = W3D.terrainH;
    if (typeof _th === 'function') {
      W3D.terrainH = (x, z) => {
        const y = _th(x, z);
        return inLake(x, z) && isFinite(y) ? Math.min(y, WATER - 0.35) : y;
      };
    }
    W3D.gHooks = W3D.gHooks || [];
    W3D.gHooks.push((x, z, y, g) => inLake(x, z) ? WATER - 0.2 : null);

    W3D.root.traverse(o => {
      if (!o.isMesh || !o.geometry || !/^(terrain|ring-mid|ring-far)$/i.test(o.name || '')) return;
      const pos = o.geometry.attributes.position;
      if (!pos) return;
      const wr = o.matrixWorld;
      const v = new THREE.Vector3();
      let ch = false;
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i).applyMatrix4(wr);
        if (!inLake(v.x, v.z)) continue;
        if (v.y > WATER - 0.8) { pos.setY(i, pos.getY(i) - (v.y - (WATER - 0.8))); ch = true; }
      }
      if (ch) { pos.needsUpdate = true; o.geometry.computeBoundingBox(); o.geometry.computeBoundingSphere(); }
    });
  }

  function clipTiles(n) {
    W3D.maskHooks = W3D.maskHooks || [];
    if (!W3D.maskHooks._lakeExtent) {
      W3D.maskHooks.push(({ poly }) => { (J.shore || []).forEach(ring => poly(ring)); });
      W3D.maskHooks._lakeExtent = 1;
    }
    if (!(window.RE && RE.rebuildMask)) {
      if ((n || 0) < 40) setTimeout(() => clipTiles((n || 0) + 1), 250);
      return;
    }
    /* Don't expand W3D.water.pond's AABB (that would punch a huge rectangle out of Google tiles).
       Temporarily clear it so rebuildMask skips the rect, then restore the original bounds. */
    const prev = W3D.water && W3D.water.pond;
    if (W3D.water) W3D.water.pond = null;
    try { RE.rebuildMask(); }
    finally { if (W3D.water && prev) W3D.water.pond = prev; }
  }

  function cullTrees() {
    let removed = 0;
    W3D.root.traverse(o => {
      if (!o.isInstancedMesh) return;
      if (o.count < 20 && !/grass|cover|plant|tree/i.test(o.name || '')) return;
      const e = o.instanceMatrix.array; let ch = false;
      for (let i = 0; i < o.count; i++) {
        const off = i * 16, x = e[off + 12], z = e[off + 14];
        if (e[off] === 0 && e[off + 5] === 0) continue;
        if (!inLake(x, z)) continue;
        e[off] = e[off + 1] = e[off + 2] = e[off + 4] = e[off + 5] = e[off + 6] = e[off + 8] = e[off + 9] = e[off + 10] = 0;
        ch = true; removed++;
      }
      if (ch) o.instanceMatrix.needsUpdate = true;
    });
    return removed;
  }

  function roadTex() {
    const c = document.createElement('canvas'); c.width = 256; c.height = 64;
    const g = c.getContext('2d');
    g.fillStyle = '#3a3a3c'; g.fillRect(0, 0, 256, 64);
    /* v=0..1 across 16 m width: edge, 2 lanes, yellow median, 2 lanes, edge */
    const y = v => v * 64;
    g.fillStyle = '#d8d8d4';
    g.fillRect(0, y(0.02), 256, 2);
    g.fillRect(0, y(0.97), 256, 2);
    g.strokeStyle = '#d8d8d4'; g.lineWidth = 1.4; g.setLineDash([14, 12]);
    g.beginPath(); g.moveTo(0, y(0.26)); g.lineTo(256, y(0.26)); g.stroke();
    g.beginPath(); g.moveTo(0, y(0.74)); g.lineTo(256, y(0.74)); g.stroke();
    g.setLineDash([]);
    g.strokeStyle = '#e6c84a'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(0, y(0.485)); g.lineTo(256, y(0.485)); g.stroke();
    g.beginPath(); g.moveTo(0, y(0.515)); g.lineTo(256, y(0.515)); g.stroke();
    const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping;
    t.anisotropy = 8; t.colorSpace = THREE.SRGBColorSpace; return t;
  }

  function shoreTex() {
    const c = document.createElement('canvas'); c.width = 256; c.height = 64;
    const g = c.getContext('2d');
    const grd = g.createLinearGradient(0, 0, 0, 64);
    grd.addColorStop(0, '#cbb890');   /* sand at the water */
    grd.addColorStop(0.35, '#b8a878');
    grd.addColorStop(0.7, '#6a8a4a');
    grd.addColorStop(1, '#4d6e38');   /* grass toward the road */
    g.fillStyle = grd; g.fillRect(0, 0, 256, 64);
    const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.anisotropy = 4;
    t.colorSpace = THREE.SRGBColorSpace; return t;
  }

  function ribbon(pts, halfW, yFn, tex, name, v0, v1) {
    if (!pts || pts.length < 2) return null;
    const pos = [], uv = [], idx = [];
    let dist = 0;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[i === pts.length - 1 ? i - 1 : i + 1];
      let dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1;
      if (i === pts.length - 1) { dx = a[0] - b[0]; dz = a[1] - b[1]; L = Math.hypot(dx, dz) || 1; }
      const nx = -dz / L, nz = dx / L;
      const y = yFn(a[0], a[1]);
      const i0 = pos.length / 3;
      pos.push(a[0] + nx * halfW, y, a[1] + nz * halfW, a[0] - nx * halfW, y, a[1] - nz * halfW);
      uv.push(dist / 12, v1 == null ? 0 : v0, dist / 12, v1 == null ? 1 : v1);
      if (i) {
        const p = i0 - 2;
        idx.push(p, p + 1, i0, i0, p + 1, i0 + 1);
      }
      if (i < pts.length - 1) dist += Math.hypot(pts[i + 1][0] - a[0], pts[i + 1][1] - a[1]);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx); geo.computeVertexNormals();
    const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
    const mesh = new THREE.Mesh(geo, mat); mesh.name = name; mesh.frustumCulled = false; mesh.renderOrder = 2;
    return mesh;
  }

  function clipRoads(tries) {
    /* Discard existing road-ribbon fragments that fall inside the ring's inner edge.
       streets.js builds road-ribbons after W3D_READY (async json), so retry until they exist. */
    let found = 0;
    W3D.root.traverse(o => { if (o.isMesh && /road-ribbons/i.test(o.name || '')) found++; });
    if (!found && (tries || 0) < 50) return setTimeout(() => clipRoads((tries || 0) + 1), 250);
    if (!found) return;
    const P = J.pond, w = P.x1 - P.x0, d = P.z1 - P.z0;
    const c = document.createElement('canvas'); c.width = mw; c.height = mh;
    const g = c.getContext('2d');
    g.fillStyle = '#000'; g.fillRect(0, 0, mw, mh);
    g.fillStyle = '#fff';
    const X = x => (x - P.x0) / w * mw, Z = z => (z - P.z0) / d * mh;
    const dilatePx = ((BUFFER - ROAD_W * 0.5 - 1) * mw / w);
    g.lineJoin = 'round'; g.lineCap = 'round';
    g.lineWidth = Math.max(2, dilatePx * 2);
    g.beginPath();
    (J.shore || []).forEach(ring => {
      ring.forEach((p, i) => { const x = X(p[0]), y = Z(p[1]); i ? g.lineTo(x, y) : g.moveTo(x, y); });
      g.closePath();
    });
    g.fill(); g.stroke();
    if (J.holes && J.holes.length) {
      g.globalCompositeOperation = 'destination-out';
      g.lineWidth = 0;
      g.beginPath();
      J.holes.forEach(ring => {
        ring.forEach((p, i) => { const x = X(p[0]), y = Z(p[1]); i ? g.lineTo(x, y) : g.moveTo(x, y); });
        g.closePath();
      });
      g.fill();
      g.globalCompositeOperation = 'source-over';
    }
    const tex = new THREE.CanvasTexture(c);
    tex.flipY = false; tex.minFilter = tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false; tex.needsUpdate = true;
    const uClip = { value: tex }, uRect = { value: new THREE.Vector4(P.x0, P.z0, w, d) };
    W3D.root.traverse(o => {
      if (!o.isMesh || !o.material) return;
      if (!/road-ribbons|street/i.test(o.name || '') && !(o.parent && /street-labels/i.test(o.parent.name || '') && o.name === 'road-ribbons')) return;
      const mats = [].concat(o.material);
      mats.forEach(mat => {
        if (!mat || mat.userData.lakeClip) return;
        mat.userData.lakeClip = 1;
        const prev = mat.onBeforeCompile, prevKey = mat.customProgramCacheKey ? mat.customProgramCacheKey.bind(mat) : () => '';
        mat.onBeforeCompile = (sh, r) => {
          if (prev) prev.call(mat, sh, r);
          sh.uniforms.lakeClip = uClip; sh.uniforms.lakeRect = uRect;
          sh.vertexShader = 'varying vec2 vLakeW;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n{ vec4 lw = modelMatrix * vec4(transformed, 1.0); vLakeW = lw.xz; }');
          sh.fragmentShader = 'uniform sampler2D lakeClip; uniform vec4 lakeRect; varying vec2 vLakeW;\n' +
            sh.fragmentShader.replace(/void\s+main\s*\(\s*\)\s*\{/,
              'void main() {\n  vec2 lu = (vLakeW - lakeRect.xy) / lakeRect.zw;\n  if (lu.x > 0.0 && lu.x < 1.0 && lu.y > 0.0 && lu.y < 1.0 && texture2D(lakeClip, lu).r > 0.5) discard;\n');
        };
        mat.customProgramCacheKey = () => prevKey() + '|lakeclip';
        mat.needsUpdate = true;
      });
    });
  }

  function buildRing() {
    const g = new THREE.Group(); g.name = 'lake-ring-road';
    const yFn = (x, z) => {
      const t = W3D.terrainH ? W3D.terrainH(x, z) : WATER + 1;
      return (isFinite(t) ? t : WATER + 1) + 0.16;
    };
    const ring = ribbon(J.ring.xz, ROAD_W / 2, yFn, roadTex(), 'lake-ring', 0, 1);
    if (ring) g.add(ring);
    /* Shore strip between the water (~4 m out) and the inner edge of the ring (~37 m). */
    const mid = [];
    const inner = BUFFER - ROAD_W * 0.5;
    const shoreW = Math.max(8, inner - 6);
    /* Offset the shoreline outward by ~4 + shoreW/2 metres for the strip centreline. */
    const shoreLine = offsetOut(J.shore[0], 4 + shoreW / 2);
    const strip = ribbon(shoreLine, shoreW / 2, (x, z) => {
      const t = W3D.terrainH ? W3D.terrainH(x, z) : WATER + 0.05;
      return Math.max(WATER + 0.04, (isFinite(t) ? t : WATER) + 0.04);
    }, shoreTex(), 'lake-shore-strip', 0, 1);
    if (strip) { strip.renderOrder = 1; g.add(strip); }
    W3D.root.add(g);
    return J.ring.miles;
  }

  function offsetOut(ring, dist) {
    /* Outward offset of a closed ring (positive = away from water, assuming CCW or CW). */
    if (!ring || ring.length < 4) return ring;
    const pts = ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1] ? ring.slice(0, -1) : ring.slice();
    let area = 0;
    for (let i = 0; i < pts.length; i++) {
      const b = pts[(i + 1) % pts.length];
      area += pts[i][0] * b[1] - b[0] * pts[i][1];
    }
    const sign = area > 0 ? 1 : -1; /* CCW in (x, z) with z south: positive area → left is outward? */
    /* In world x-east z-south, a lake drawn CCW has interior to the left if we use standard. We want outward = away from interior. */
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[(i - 1 + pts.length) % pts.length], b = pts[i], c = pts[(i + 1) % pts.length];
      let dx1 = b[0] - a[0], dz1 = b[1] - a[1], l1 = Math.hypot(dx1, dz1) || 1;
      let dx2 = c[0] - b[0], dz2 = c[1] - b[1], l2 = Math.hypot(dx2, dz2) || 1;
      let nx = sign * (-dz1 / l1 - dz2 / l2), nz = sign * (dx1 / l1 + dx2 / l2);
      const nl = Math.hypot(nx, nz) || 1;
      nx /= nl; nz /= nl;
      /* If this lands in the lake, flip. */
      let x = b[0] + nx * dist, z = b[1] + nz * dist;
      if (inLake(x, z)) { x = b[0] - nx * dist; z = b[1] - nz * dist; }
      out.push([x, z]);
    }
    out.push(out[0]);
    return out;
  }

  function addPlaque() {
    const T = J.plaque; if (!T) return;
    const m = W3D.pondMarker;
    const yaw = m ? m.faceYawDeg * Math.PI / 180 : 0;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 768;
    const g = c.getContext('2d');
    g.fillStyle = '#1a1610'; g.fillRect(0, 0, 1024, 768);
    g.strokeStyle = '#c9a24a'; g.lineWidth = 14; g.strokeRect(18, 18, 988, 732);
    g.fillStyle = '#e8d9b0';
    g.font = 'bold 48px Georgia, serif'; g.textAlign = 'center';
    g.fillText(T.title, 512, 90);
    g.font = '32px Georgia, serif';
    const wrap = (text, maxW) => {
      const words = text.split(' '), lines = []; let cur = '';
      words.forEach(w => {
        const t = cur ? cur + ' ' + w : w;
        if (g.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
      });
      if (cur) lines.push(cur); return lines;
    };
    let y = 160;
    T.lines.forEach(para => {
      wrap(para, 900).forEach(line => { g.fillText(line, 512, y); y += 44; });
      y += 18;
    });
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const gh = W3D.terrainH ? W3D.terrainH(T.x, T.z) : WATER + 1.5;
    const y0 = Math.max(isFinite(gh) ? gh : WATER + 1.5, WATER + 0.4) + 1.15;
    const board = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.27), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
    board.position.set(T.x, y0, T.z);
    board.rotation.y = yaw;
    board.name = 'lake-extent-plaque';
    W3D.root.add(board);
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.2, 0.08), new THREE.MeshBasicMaterial({ color: 0x2a2418 }));
    post.position.set(T.x, y0 - 0.85, T.z);
    W3D.root.add(post);
  }

  function hookDiscard(mat, tex, P) {
    if (!mat || mat.userData.lakeGroundClip) return;
    mat.userData.lakeGroundClip = 1;
    const prev = mat.onBeforeCompile, prevKey = mat.customProgramCacheKey ? mat.customProgramCacheKey.bind(mat) : () => '';
    const uClip = { value: tex }, uRect = { value: new THREE.Vector4(P.x0, P.z0, P.x1 - P.x0, P.z1 - P.z0) };
    mat.onBeforeCompile = (sh, r) => {
      if (prev) prev.call(mat, sh, r);
      sh.uniforms.lakeClip = uClip; sh.uniforms.lakeRect = uRect;
      sh.vertexShader = 'varying vec2 vLakeW;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n{ vec4 lw = modelMatrix * vec4(transformed, 1.0); vLakeW = lw.xz; }');
      sh.fragmentShader = 'uniform sampler2D lakeClip; uniform vec4 lakeRect; varying vec2 vLakeW;\n' +
        sh.fragmentShader.replace(/void\s+main\s*\(\s*\)\s*\{/,
          'void main() {\n  vec2 lu = (vLakeW - lakeRect.xy) / lakeRect.zw;\n  if (lu.x > 0.0 && lu.x < 1.0 && lu.y > 0.0 && lu.y < 1.0 && texture2D(lakeClip, lu).g > 0.5) discard;\n');
    };
    mat.customProgramCacheKey = () => prevKey() + '|lakegnd';
    mat.needsUpdate = true;
  }

  function clipGround() {
    /* Hide leftover landfill berms, dark pits and stepped ground that still poked through the water. */
    const P = J.pond, tex = lakeTex; if (!P || !tex) return;
    W3D.root.traverse(o => {
      if (!o.isMesh || !o.material) return;
      const n = o.name || '';
      if (/fowling-pond|lake-ring|lake-shore|water|kings-pond|river/i.test(n)) return;
      if (!/^(terrain|ring-mid|ring-far|grass-tufts|riverbank)$/i.test(n) && !/grass|cover|swale/i.test(n)) return;
      [].concat(o.material).forEach(m => hookDiscard(m, tex, P));
    });
  }

  function addContractor() {
    const C = J.contractor; if (!C || !C.sign) return;
    const x = C.sign[0], z = C.sign[1];
    const gh = W3D.terrainH ? W3D.terrainH(x, z) : WATER + 1.5;
    const y0 = Math.max(isFinite(gh) ? gh : WATER + 1.5, WATER + 0.4);
    const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
    const g = c.getContext('2d');
    g.fillStyle = '#f3efe4'; g.fillRect(0, 0, 1024, 512);
    g.strokeStyle = '#1a3a6b'; g.lineWidth = 16; g.strokeRect(14, 14, 996, 484);
    g.fillStyle = '#1a3a6b'; g.textAlign = 'center';
    g.font = 'bold 48px Helvetica, Arial, sans-serif';
    g.fillText('Pond construction:', 512, 160);
    g.font = 'bold 40px Helvetica, Arial, sans-serif';
    g.fillText('Extreme Pool & Construction Services LLC', 512, 240);
    g.font = '36px Helvetica, Arial, sans-serif';
    g.fillText(C.website, 512, 360);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const grp = new THREE.Group(); grp.name = 'pond-contractor-sign';
    const board = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.7), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, side: THREE.DoubleSide }));
    board.position.set(0, 2.15, 0);
    grp.add(board);
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.2, 0.12), new THREE.MeshBasicMaterial({ color: 0x4a3a28 }));
    post.position.set(-1.5, 1.1, 0); grp.add(post.clone());
    const post2 = post.clone(); post2.position.set(1.5, 1.1, 0); grp.add(post2);
    grp.position.set(x, y0, z);
    grp.rotation.y = Math.PI;   // face north, toward the lake
    W3D.root.add(grp);
    W3D.keepOut = (W3D.keepOut || []).concat([{ x: x, z: z, r: 6, name: 'pond contractor sign' }]);
  }

  function addContractorPanel() {
    const C = J.contractor; if (!C) return true;
    if (W3D.root.getObjectByName('fp-contractor-panel')) return true;
    const ex = W3D.root.getObjectByName('fp-structure-exhibit');
    if (!ex) return false;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 320;
    const g = c.getContext('2d');
    g.fillStyle = 'rgba(8,24,32,0.9)'; g.fillRect(0, 0, 1024, 320);
    g.strokeStyle = '#7fe3ff'; g.lineWidth = 6; g.strokeRect(3, 3, 1018, 314);
    g.fillStyle = '#e8f7ff'; g.textAlign = 'center';
    g.font = 'bold 40px Helvetica, Arial, sans-serif';
    g.fillText('Pond contractor', 512, 80);
    g.font = '32px Helvetica, Arial, sans-serif';
    g.fillText('Pond construction:', 512, 145);
    g.fillText('Extreme Pool & Construction Services LLC', 512, 200);
    g.font = '30px Helvetica, Arial, sans-serif';
    g.fillText(C.website, 512, 260);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const board = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.15), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, transparent: true }));
    board.name = 'fp-contractor-panel';
    const box = new THREE.Box3().setFromObject(ex);
    const cx = (box.min.x + box.max.x) / 2, cz = box.max.z + 2.2;
    const y = (W3D.terrainH ? W3D.terrainH(cx, cz) : box.min.y) + 1.7;
    board.position.set(cx, y, cz);
    W3D.root.add(board);
    return true;
  }

  function hookPlan() {
    /* Exhibit is built lazily on first visit to ?spot=structure or ?spot=plan. Wrap those spots and keep trying. */
    const wrap = fn => {
      const w = function () {
        const r = fn.apply(this, arguments);
        setTimeout(addContractorPanel, 400);
        setTimeout(addContractorPanel, 2000);
        return r;
      };
      w._cHook = 1;
      return w;
    };
    (function tick(n) {
      if (addContractorPanel()) return;
      ['structure', 'plan', 'fp-structure', 'master-plan', 'timeline'].forEach(k => {
        const fn = W3D.spots && W3D.spots[k];
        if (typeof fn === 'function' && !fn._cHook) W3D.spots[k] = wrap(fn);
      });
      if ((n || 0) < 60) setTimeout(() => tick((n || 0) + 1), 500);
    })(0);
  }

  function addSpot() {
    const s = J.spot || { x: 0, y: 520, z: 400, yaw: 0 };
    const go = () => {
      if (window.JFVR) JFVR.fly = true;
      const l = document.querySelector('#flylabel'); if (l) l.setAttribute('value', 'Fly: ON');
      W3D.teleportTo(s.x, s.y, s.z, s.yaw == null ? 0 : s.yaw);
      hud('Restored Fowling Pond — about ' + J.acres + ' acres after landfill removal');
    };
    W3D.spots = W3D.spots || {};
    W3D.spots['lake-extent'] = go;
    W3D.spots['historic-lake'] = go;
    W3D.spots['restored-lake'] = go;
    const grp = document.getElementById('go-pond');
    if (grp && !document.getElementById('lakeextentbtn')) {
      const b = document.createElement('button');
      b.id = 'lakeextentbtn'; b.setAttribute('data-w', 'lake-extent');
      b.textContent = 'Restored lake overview';
      grp.appendChild(b);
    }
    const tools = document.querySelector('#ui .tools');
    if (tools && !document.getElementById('lakeextenttool')) {
      const b = document.createElement('button'); b.id = 'lakeextenttool';
      b.textContent = 'Restored lake'; b.onclick = e => { e.stopPropagation(); go(); };
      tools.appendChild(b);
    }
  }

  function build() {
    if (!J || !window.THREE) return;
    const am = buildMask();
    addWater(am);
    flattenTerrain();
    clipTiles();
    cullTrees();
    clipRoads();
    buildRing();
    addPlaque();
    addContractor();
    hookPlan();
    clipGround();
    addSpot();
    console.log('lakeextent: ' + J.acres + ' ac, ring ' + J.ring.miles + ' mi, landfills removed: ' +
      (J.landfills_removed || []).map(l => l.name).join(', '));
  }
})();
