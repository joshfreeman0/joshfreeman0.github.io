/* Quality pass: instanced grass tufts around you at home (desktop 9000 within ~46 m, Quest 3200 within ~30 m; none on phones or with
   ?classic=1). Placed only where the USGS aerial photo is vegetation (not water, roads, sand or anything built), re-scattered as you
   move, drawn as three crossed alpha-tested cards that sway gently, with up-facing normals so they light like the ground they grow on. */
(function () {
  if (window.JFVR_LITE || /[?&]classic=1/.test(location.search)) return;
  const QUEST = /OculusBrowser|Quest/i.test(navigator.userAgent) || /[?&]quest=1/.test(location.search);
  const COUNT = QUEST ? 3200 : 9000, RAD = QUEST ? 30 : 46, HALF = 2048, SIZE = 4096, WATER = 16.5;
  let mesh = null, mask = null, MW = 0, MH = 0, cx = 1e9, cz = 1e9, last = 0, U = {wT: {value: 0}};
  function bladeTex() {
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    for (let i = 0; i < 22; i++) { const x = 8 + Math.random() * 112, h = 70 + Math.random() * 56, lean = (Math.random() - 0.5) * 30, w = 3 + Math.random() * 3;
      const gr = g.createLinearGradient(0, 128, 0, 128 - h); gr.addColorStop(0, '#5a6650'); gr.addColorStop(0.6, '#9aa58a'); gr.addColorStop(1, '#c9cfae');
      g.fillStyle = gr; g.beginPath(); g.moveTo(x - w, 128); g.quadraticCurveTo(x + lean * 0.3, 128 - h * 0.6, x + lean, 128 - h); g.quadraticCurveTo(x + lean * 0.3 + w * 0.5, 128 - h * 0.6, x + w, 128); g.fill(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  function tuftGeo() {
    const gs = []; for (let k = 0; k < 3; k++) { const p = new THREE.PlaneGeometry(0.62, 0.5); p.translate(0, 0.25, 0); p.rotateY(k * Math.PI / 3); gs.push(p); }
    let n = 0; const pos = [], uv = [], idx = []; for (const p of gs) { const P = p.attributes.position, V = p.attributes.uv; for (let i = 0; i < P.count; i++) { pos.push(P.getX(i), P.getY(i), P.getZ(i)); uv.push(V.getX(i), V.getY(i)); } for (const i of p.index.array) idx.push(i + n); n += P.count; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(new Array(n).fill(0).flatMap(() => [0, 1, 0]), 3)); g.setIndex(idx); return g;
  }
  function buildMask() {
    const im = W3D._terrainMat && W3D._terrainMat.map && W3D._terrainMat.map.image; if (!im || !(im.naturalWidth || im.width)) return false;
    MW = MH = 1024; const c = document.createElement('canvas'); c.width = MW; c.height = MH; const g = c.getContext('2d'); g.drawImage(im, 0, 0, MW, MH);
    try { mask = g.getImageData(0, 0, MW, MH).data; } catch (e) { mask = null; return false; } return true;
  }
  function veg(x, z) { // -> null or [r,g,b] 0..1 of the photo there
    if (Math.abs(x) >= HALF || Math.abs(z) >= HALF) return null;
    const i = (Math.floor((z + HALF) / SIZE * MH) * MW + Math.floor((x + HALF) / SIZE * MW)) * 4, r = mask[i], g = mask[i + 1], b = mask[i + 2];
    if (!(g > b + 8 && g >= r - 2 && g < 150 && r + g + b > 60)) return null; return [r / 255, g / 255, b / 255];
  }
  function hash(a, b) { let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sv = new THREE.Vector3(), pv = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), col = new THREE.Color(), base = new THREE.Color(0x4f6a2c);
  function scatter(px, pz) {
    const st = RAD * 2 / Math.sqrt(COUNT * 1.6); let n = 0;
    for (let gx = Math.floor((px - RAD) / st); gx <= Math.ceil((px + RAD) / st) && n < COUNT; gx++) for (let gz = Math.floor((pz - RAD) / st); gz <= Math.ceil((pz + RAD) / st) && n < COUNT; gz++) {
      const x = (gx + hash(gx, gz)) * st, z = (gz + hash(gz + 7, gx - 3)) * st, dx = x - px, dz = z - pz; if (dx * dx + dz * dz > RAD * RAD) continue;
      const c = veg(x, z); if (!c) continue; const y = W3D.terrainH(x, z); if (!(y > WATER + 0.35)) continue;
      const gy = W3D.groundAt ? W3D.groundAt(x, z, y + 4) : y; if (gy > y + 0.25) continue;   // something built here
      const e = Math.sqrt(dx * dx + dz * dz) / RAD, s = (0.7 + hash(gx * 3, gz * 5) * 0.75) * (e < 0.7 ? 1 : Math.max(0.05, (1 - e) / 0.3));   // shrink toward the edge: no visible rim
      q.setFromAxisAngle(up, hash(gx, gz * 11) * 6.283); sv.set(s, s * (0.8 + hash(gz, gx * 13) * 0.6), s); pv.set(x, y - 0.04, z);
      m4.compose(pv, q, sv); mesh.setMatrixAt(n, m4);
      col.setRGB(c[0], c[1], c[2]).convertSRGBToLinear().multiplyScalar(2.8 * (0.85 + hash(gx * 7, gz) * 0.3)).lerp(base, 0.25); mesh.setColorAt(n, col); n++; }
    mesh.count = n; mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true; W3D.grass = {n: n, cx: px, cz: pz};
  }
  function make() {
    const mat = new THREE.MeshLambertMaterial({map: bladeTex(), alphaTest: 0.45, side: THREE.DoubleSide});
    mat.onBeforeCompile = sh => { sh.uniforms.wT = U.wT; sh.vertexShader = 'uniform float wT;\n' + sh.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nvec3 ip = instanceMatrix[3].xyz; float sw = sin(wT * 1.6 + ip.x * 0.35 + ip.z * 0.22) + 0.5 * sin(wT * 2.7 + ip.z * 0.9); transformed.x += sw * 0.05 * uv.y; transformed.z += sw * 0.03 * uv.y;'); };
    mat.onBeforeCompile = ((ob) => sh => { ob(sh); sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>\nnormal = normalize( vNormal );'); })(mat.onBeforeCompile);   // both faces lit like the ground (no dark backs)
    mat.customProgramCacheKey = () => 'jfgrass2';
    mesh = new THREE.InstancedMesh(tuftGeo(), mat, COUNT); mesh.count = 0; mesh.frustumCulled = false; mesh.receiveShadow = !QUEST; mesh.name = 'grass-tufts';
    mesh.setColorAt(0, base); W3D.root.add(mesh);
  }
  const v = new THREE.Vector3();
  AFRAME.registerComponent('w3d-grass', { tick: function (t) {
    if (!window.W3D_READY || !W3D.root || !W3D.terrainH) return; U.wT.value = t / 1000;
    if (t - last < 500) return; last = t;
    if (!mask && !buildMask()) return; if (!mesh) make();
    const cam = this.el.camera; if (!cam) return; cam.getWorldPosition(v);
    const h = v.y - W3D.terrainH(v.x, v.z), show = W3D.root.visible && h < 60 && Math.abs(v.x) < HALF && Math.abs(v.z) < HALF; mesh.visible = show && !W3D.grassOff; if (!mesh.visible) return;
    if (Math.hypot(v.x - cx, v.z - cz) > RAD * 0.3) { cx = v.x; cz = v.z; scatter(cx, cz); }
  } });
  const attach = () => { const sc = document.querySelector('a-scene'); if (sc) sc.setAttribute('w3d-grass', ''); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attach); else attach();
})();
