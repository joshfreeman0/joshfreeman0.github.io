/* Build mode v1 (Josh, private for now): menu "Build" (or B on a keyboard) turns it on.
   Palette: wall, floor, column, roof, stairs, tree, lamp, bench, sign. Point (mouse / right controller laser) and click / pull the
   trigger to place; the ghost shows where, snapped to a 0.5 m grid (green = ok, red = protected). Tools: Rotate (R, 15 deg),
   Bigger / Smaller ([ ] keys), Move (pick a piece, then place it again), Delete (pick a piece; Del key deletes the last selected),
   Undo (Ctrl+Z / U). Pieces save automatically in this browser (localStorage 'jfvr_build_v1'); nobody else sees them.
   No building on protected sites: the pond and King's Pond water, rivers, the bank/temple compound, the pyramid park, the launch
   pad. Publish is a stub for later (nothing is uploaded). Home world only. */
(function () {
  const KEY = 'jfvr_build_v1', GRID = 0.5;
  const B = W3D.builder = {on: false, tool: 'place', kind: 'wall', rot: 0, scale: 1, items: [], undo: [], published: false};
  const KINDS = [['wall', 'Wall'], ['floor', 'Floor'], ['column', 'Column'], ['roof', 'Roof'], ['stairs', 'Stairs'], ['tree', 'Tree'], ['lamp', 'Lamp'], ['bench', 'Bench'], ['sign', 'Sign']];
  const TOOLS = [['place', 'Place'], ['move', 'Move'], ['delete', 'Delete']];
  let grp = null, ghost = null, ghostKind = '', moving = null, M = null, lastHit = null, vrPanel = null;
  const HQ = {x: 920, z: -380};
  function protectedAt(x, z) {
    const tH = W3D.terrainH, y = tH ? tH(x, z) : 99, wd = W3D.water || {};
    if (x > -1812 && x < 574 && z > -794 && z < 768 && y < 16.75) return 'the pond';
    const k = wd.kings; if (k && x > k.x0 && x < k.x1 && z > k.z0 && z < k.z1 && y < (k.level || 12.2) + 0.5) return "King's Pond";
    for (const R of wd.rivers || []) { const hw = (R.hw || 7) + 2; for (const [px, pz] of R.pts) if ((px - x) * (px - x) + (pz - z) * (pz - z) < hw * hw) return 'a river'; }
    if (x > 800 && x < 1060 && z > -720 && z < -260) return 'the bank and temple';
    const P = wd.park; if (P && Math.pow((x - P.cx) / (P.ax + 60), 2) + Math.pow((z - P.cz) / (P.az + 60), 2) < 1) return 'the pyramid park';
    if (Math.hypot(x - 9617, z + 2976.9) < 120) return 'the launch pad';
    return null;
  }
  function mats() {
    if (M) return M; const L = (c, o) => new THREE.MeshLambertMaterial(Object.assign({color: c}, o || {}));
    M = {stone: L(0xd8ccb4), wood: L(0x8a6240), dark: L(0x4a4a4e), roof: L(0x7a3e2e), leaf: L(0x4f7a34, {flatShading: true}), bark: L(0x5a4030), lamp: new THREE.MeshBasicMaterial({color: 0xfff1c4}), sign: L(0xf4efe2), ok: new THREE.MeshBasicMaterial({color: 0x46ff7a, transparent: true, opacity: 0.45, depthWrite: false}), bad: new THREE.MeshBasicMaterial({color: 0xff4040, transparent: true, opacity: 0.45, depthWrite: false})};
    return M;
  }
  function piece(kind) {   // origin at the base centre; sizes in metres at scale 1
    const g = new THREE.Group(), m = mats(), add = (geo, mat, x, y, z) => { const o = new THREE.Mesh(geo, mat); o.position.set(x || 0, y || 0, z || 0); o.castShadow = o.receiveShadow = true; g.add(o); return o; };
    if (kind === 'wall') add(new THREE.BoxGeometry(4, 3, 0.25), m.stone, 0, 1.5, 0);
    else if (kind === 'floor') add(new THREE.BoxGeometry(4, 0.2, 4), m.stone, 0, 0.1, 0);
    else if (kind === 'column') { add(new THREE.CylinderGeometry(0.25, 0.3, 3, 12), m.stone, 0, 1.5, 0); add(new THREE.BoxGeometry(0.75, 0.15, 0.75), m.stone, 0, 3.05, 0); add(new THREE.BoxGeometry(0.75, 0.15, 0.75), m.stone, 0, 0.075, 0); }
    else if (kind === 'roof') { const s = new THREE.Shape([new THREE.Vector2(-2.2, 0), new THREE.Vector2(2.2, 0), new THREE.Vector2(0, 1.6)]); const geo = new THREE.ExtrudeGeometry(s, {depth: 4.4, bevelEnabled: false}); geo.translate(0, 0, -2.2); add(geo, m.roof); }
    else if (kind === 'stairs') { for (let i = 0; i < 6; i++) add(new THREE.BoxGeometry(1.2, 0.25, 0.3), m.stone, 0, 0.125 + i * 0.25, -i * 0.3 + 0.75); add(new THREE.BoxGeometry(1.2, 0.1, 0.1), m.stone, 0, 0.05, 0.9); }
    else if (kind === 'tree') { add(new THREE.CylinderGeometry(0.15, 0.25, 2.4, 6), m.bark, 0, 1.2, 0); add(new THREE.IcosahedronGeometry(1.4, 1), m.leaf, 0, 3.2, 0); add(new THREE.IcosahedronGeometry(0.9, 0), m.leaf, 0.7, 2.6, 0.3); }
    else if (kind === 'lamp') { add(new THREE.CylinderGeometry(0.06, 0.09, 3.2, 8), m.dark, 0, 1.6, 0); add(new THREE.SphereGeometry(0.22, 12, 8), m.lamp, 0, 3.35, 0); }
    else if (kind === 'bench') { add(new THREE.BoxGeometry(1.8, 0.08, 0.45), m.wood, 0, 0.45, 0); add(new THREE.BoxGeometry(1.8, 0.4, 0.06), m.wood, 0, 0.75, -0.2); for (const sx of [-0.8, 0.8]) add(new THREE.BoxGeometry(0.08, 0.45, 0.45), m.dark, sx, 0.225, 0); }
    else if (kind === 'sign') { add(new THREE.CylinderGeometry(0.05, 0.05, 2, 8), m.wood, 0, 1, 0); add(new THREE.BoxGeometry(1.2, 0.6, 0.06), m.sign, 0, 1.9, 0.04); }
    g.userData.kind = kind; return g;
  }
  const snap = v => Math.round(v / GRID) * GRID;
  function place(it) { const o = piece(it.k); o.position.set(it.x, it.y, it.z); o.rotation.y = it.r * Math.PI / 180; o.scale.setScalar(it.s); o.userData.id = it.id; o.name = 'build-' + it.k; grp.add(o); it.o = o; return it; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(B.items.map(({k, x, y, z, r, s, id}) => ({k, x, y, z, r, s, id})))); } catch (e) {} }
  function load() { try { const L = JSON.parse(localStorage.getItem(KEY) || '[]'); L.forEach(it => B.items.push(place(it))); } catch (e) {} }
  function ensure() { if (grp) return; grp = new THREE.Group(); grp.name = 'build'; W3D.root.add(grp); load(); }
  function hud(t) { if (window.JFVR && JFVR.hud) JFVR.hud(t); const d = document.getElementById('buildmsg'); if (d) d.textContent = t; }
  // ---- picking: a ray marched against the ground / floors (W3D.groundAt), plus a real raycast against placed pieces
  const rc = new THREE.Raycaster();
  function hitFrom(origin, dir) {
    rc.set(origin, dir); rc.far = 80; const hp = grp ? rc.intersectObjects(grp.children, true)[0] : null;
    let gh = null; const GA = W3D.groundAt; if (GA) { const p = origin.clone(); for (let d = 0; d < 80; d += 0.5) { p.copy(origin).addScaledVector(dir, d); const g = GA(p.x, p.z, p.y + 0.5); if (p.y <= g) { p.y = g; gh = {point: p.clone(), d}; break; } } }
    if (hp && (!gh || hp.distance < gh.d)) { let o = hp.object; while (o.parent && o.parent !== grp) o = o.parent; return {point: hp.point, piece: o}; }
    return gh ? {point: gh.point, piece: null} : null;
  }
  function ghostUpdate(h) {
    lastHit = h; if (!ghost || ghostKind !== (moving ? moving.k : B.kind)) { if (ghost) grp.remove(ghost); ghostKind = moving ? moving.k : B.kind; ghost = piece(ghostKind); ghost.traverse(o => { if (o.isMesh) { o.material = mats().ok; o.castShadow = false; } }); grp.add(ghost); }
    const show = B.on && h && B.tool !== 'delete' && (B.tool === 'place' || moving); ghost.visible = !!show; if (!show) return;
    const p = h.point, bad = protectedAt(p.x, p.z); ghost.position.set(snap(p.x), snap(p.y * 2) / 2, snap(p.z)); ghost.rotation.y = (moving ? moving.r : B.rot) * Math.PI / 180; ghost.scale.setScalar(moving ? moving.s : B.scale);
    ghost.traverse(o => { if (o.isMesh) o.material = bad ? mats().bad : mats().ok; }); ghost.userData.bad = bad;
  }
  let nid = Date.now();
  function act(h) {   // click / trigger
    if (!B.on || !h) return;
    if (B.tool === 'delete') { if (!h.piece) return hud('Point at a piece to delete it'); const it = B.items.find(i => i.o === h.piece); if (!it) return; grp.remove(it.o); B.items.splice(B.items.indexOf(it), 1); B.undo.push({a: 'del', it}); save(); return hud('Deleted ' + it.k); }
    if (B.tool === 'move' && !moving) { if (!h.piece) return hud('Point at a piece to move it'); moving = B.items.find(i => i.o === h.piece); if (moving) { moving.o.visible = false; hud('Moving ' + moving.k + ' - place it'); } return; }
    const p = h.point, bad = protectedAt(p.x, p.z); if (bad) return hud("Can't build on " + bad + ' (protected)');
    const pos = {x: snap(p.x), y: snap(p.y * 2) / 2, z: snap(p.z)};
    if (moving) { const before = {x: moving.x, y: moving.y, z: moving.z, r: moving.r, s: moving.s}; Object.assign(moving, pos); moving.o.position.set(pos.x, pos.y, pos.z); moving.o.rotation.y = moving.r * Math.PI / 180; moving.o.scale.setScalar(moving.s); moving.o.visible = true; B.undo.push({a: 'mod', it: moving, before}); moving = null; save(); return hud('Moved'); }
    const it = place(Object.assign({k: B.kind, r: B.rot, s: B.scale, id: nid++}, pos)); B.items.push(it); B.undo.push({a: 'add', it}); save(); hud('Placed ' + it.k + ' (' + B.items.length + ')');
  }
  function undo() { const u = B.undo.pop(); if (!u) return hud('Nothing to undo');
    if (u.a === 'add') { grp.remove(u.it.o); B.items.splice(B.items.indexOf(u.it), 1); }
    else if (u.a === 'del') { B.items.push(place(u.it)); }
    else if (u.a === 'mod') { Object.assign(u.it, u.before); u.it.o.position.set(u.it.x, u.it.y, u.it.z); u.it.o.rotation.y = u.it.r * Math.PI / 180; u.it.o.scale.setScalar(u.it.s); }
    save(); hud('Undone'); }
  function rotate(d) { if (moving) moving.r = (moving.r + d + 360) % 360; else B.rot = (B.rot + d + 360) % 360; hud('Rotation ' + (moving ? moving.r : B.rot) + ' deg'); }
  function resize(f) { const t = moving || B; t.s = Math.max(0.25, Math.min(4, Math.round(t.s * f * 4) / 4)); hud('Size x' + t.s); }
  function publish() { B.published = false; hud('Publish is coming later - your build stays private on this device for now'); }
  B.api = {act, undo, rotate, resize, publish, protectedAt};
  // ---- UI: DOM bar (desktop / phone) and a 3D palette in the headset
  function bar() {
    let d = document.getElementById('buildbar'); if (d) return d; d = document.createElement('div'); d.id = 'buildbar';
    d.style.cssText = 'position:fixed;left:50%;top:8px;transform:translateX(-50%);z-index:30;background:rgba(20,22,26,.86);color:#fff;padding:6px 8px;border-radius:10px;font:13px Arial,sans-serif;display:none;max-width:96vw;text-align:center';
    const btn = (t, f, cls) => { const b = document.createElement('button'); b.textContent = t; b.className = cls || ''; b.style.cssText = 'margin:2px;padding:5px 8px;border-radius:7px;border:0;background:#ffd700;color:#111;cursor:pointer'; b.onclick = e => { e.stopPropagation(); f(b); }; d.appendChild(b); return b; };
    KINDS.forEach(([k, t]) => btn(t, () => { B.kind = k; B.tool = 'place'; moving = null; refresh(); }, 'bk bk-' + k));
    d.appendChild(document.createElement('br'));
    TOOLS.forEach(([k, t]) => btn(t, () => { B.tool = k; if (k !== 'move' && moving) { moving.o.visible = true; moving = null; } refresh(); }, 'bt bt-' + k));
    btn('Rotate', () => rotate(15)); btn('Bigger', () => resize(1.25)); btn('Smaller', () => resize(0.8)); btn('Undo', undo); btn('Publish (later)', publish); btn('Done', () => toggle(false));
    const m = document.createElement('div'); m.id = 'buildmsg'; m.style.cssText = 'margin-top:3px;color:#cde'; m.textContent = 'Build: pick a piece, then click where it goes (0.5 m grid)'; d.appendChild(m);
    document.body.appendChild(d); return d;
  }
  function refresh() { const d = bar(); d.querySelectorAll('.bk').forEach(b => b.style.background = b.classList.contains('bk-' + B.kind) && B.tool === 'place' ? '#9ffcff' : '#ffd700'); d.querySelectorAll('.bt').forEach(b => b.style.background = b.classList.contains('bt-' + B.tool) ? '#9ffcff' : '#ffd700');
    const mb = document.getElementById('buildbtn'); if (mb) { mb.textContent = 'Build: ' + (B.on ? 'On' : 'Off'); mb.classList.toggle('on', B.on); }
    if (vrPanel) vrPanel.querySelectorAll('[data-bk],[data-bt]').forEach(p => { const k = p.getAttribute('data-bk'), t = p.getAttribute('data-bt'); p.setAttribute('material', 'shader:flat;color:' + ((k && k === B.kind && B.tool === 'place') || (t && t === B.tool) ? '#9ffcff' : '#FFD700')); }); }
  function vr() {   // 3D palette: in front of you when Build turns on in the headset; laser-click like the menu
    if (vrPanel) return vrPanel; const sc = document.querySelector('a-scene'); const e = document.createElement('a-entity'); e.id = 'buildpanel';
    const all = KINDS.map(([k, t]) => ['bk', k, t]).concat(TOOLS.map(([k, t]) => ['bt', k, t])).concat([['fn', 'rot', 'Rotate'], ['fn', 'big', 'Bigger'], ['fn', 'small', 'Smaller'], ['fn', 'undo', 'Undo'], ['fn', 'done', 'Done']]);
    all.forEach(([ty, k, t], i) => { const p = document.createElement('a-plane'); p.className = 'btn'; p.setAttribute('data-' + ty, k); p.setAttribute('width', 0.5); p.setAttribute('height', 0.2); p.setAttribute('position', ((i % 9) - 4) * 0.54 + ' ' + (-Math.floor(i / 9) * 0.24) + ' 0'); p.setAttribute('material', 'shader:flat;color:#FFD700');
      const tx = document.createElement('a-text'); tx.setAttribute('value', t); tx.setAttribute('align', 'center'); tx.setAttribute('color', '#111'); tx.setAttribute('width', 1.4); p.appendChild(tx);
      p.addEventListener('click', ev => { ev.stopPropagation && ev.stopPropagation(); B.clickT = performance.now(); if (ty === 'bk') { B.kind = k; B.tool = 'place'; } else if (ty === 'bt') B.tool = k; else if (k === 'rot') rotate(15); else if (k === 'big') resize(1.25); else if (k === 'small') resize(0.8); else if (k === 'undo') undo(); else if (k === 'done') toggle(false); refresh(); });
      e.appendChild(p); });
    sc.appendChild(e); vrPanel = e; return e;
  }
  function inXR() { const sc = document.querySelector('a-scene'); return !!(sc && sc.renderer && sc.renderer.xr && sc.renderer.xr.isPresenting); }
  function toggle(v) {
    B.on = v === undefined ? !B.on : v; if (B.on && (!W3D.root || !W3D.root.visible)) { B.on = false; hud('Build works in the home world'); }
    if (B.on) ensure(); bar().style.display = B.on && !inXR() ? 'block' : 'none';
    if (inXR() || vrPanel) { const p = vr(); p.setAttribute('visible', B.on && inXR()); if (B.on && inXR()) { const cam = document.querySelector('[camera]').object3D, q = new THREE.Vector3(), f = new THREE.Vector3(0, 0, -1); cam.getWorldPosition(q); f.applyQuaternion(cam.getWorldQuaternion(new THREE.Quaternion())); f.y = 0; f.normalize();
      p.object3D.position.copy(q).addScaledVector(f, 1.6).add(new THREE.Vector3(0, -0.45, 0)); p.object3D.lookAt(q.x, p.object3D.position.y, q.z); } p.querySelectorAll('.btn').forEach(b => b.classList.toggle('btn', true)); }
    if (!B.on && ghost) ghost.visible = false; if (!B.on && moving) { moving.o.visible = true; moving = null; }
    refresh(); hud(B.on ? 'Build mode ON - pick a piece, point and click / pull the trigger' : 'Build mode off (saved: ' + B.items.length + ' pieces)');
  }
  B.toggle = toggle;
  // ---- input
  const ndc = new THREE.Vector2(), tmpO = new THREE.Vector3(), tmpD = new THREE.Vector3();
  function mouseRay(ev) { const sc = document.querySelector('a-scene'), cv = sc && sc.canvas, cam = sc && sc.camera; if (!cv || !cam) return null; const r = cv.getBoundingClientRect(); ndc.set((ev.clientX - r.left) / r.width * 2 - 1, -(ev.clientY - r.top) / r.height * 2 + 1); rc.setFromCamera(ndc, cam); return [rc.ray.origin.clone(), rc.ray.direction.clone()]; }
  document.addEventListener('mousemove', ev => { if (!B.on || inXR()) return; const r = mouseRay(ev); if (r) ghostUpdate(hitFrom(r[0], r[1])); });
  document.addEventListener('mouseup', ev => { if (!B.on || inXR() || ev.button !== 0) return; if (ev.target && ev.target.tagName !== 'CANVAS') return; if (B.dragged) return; const r = mouseRay(ev); if (r) act(hitFrom(r[0], r[1])); });
  let md = null; document.addEventListener('mousedown', ev => { md = [ev.clientX, ev.clientY]; B.dragged = false; }); document.addEventListener('mousemove', ev => { if (md && Math.hypot(ev.clientX - md[0], ev.clientY - md[1]) > 6) B.dragged = true; }); document.addEventListener('mouseup', () => { md = null; setTimeout(() => { B.dragged = false; }, 0); }, true);
  document.addEventListener('keydown', ev => { const t = ev.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (ev.code === 'KeyB' && !ev.ctrlKey && !ev.metaKey) { toggle(); return; } if (!B.on) return;
    if (ev.code === 'KeyR') rotate(ev.shiftKey ? -15 : 15); else if (ev.code === 'BracketRight') resize(1.25); else if (ev.code === 'BracketLeft') resize(0.8);
    else if ((ev.code === 'KeyZ' && (ev.ctrlKey || ev.metaKey)) || ev.code === 'KeyU') { ev.preventDefault(); undo(); } else if (ev.code === 'Delete' || ev.code === 'Backspace') { B.tool = 'delete'; refresh(); hud('Delete: point at a piece and click'); } else if (ev.code === 'Escape') toggle(false); });
  // headset: right controller ray drives the ghost; trigger places (unless the laser is on a palette / menu button)
  AFRAME.registerComponent('w3d-build', { init: function () { const hook = () => { const h = document.querySelector('[laser-controls][laser-controls*="right"], [laser-controls="hand:right"]'); if (!h || h._jfb) return; h._jfb = 1;
      h.addEventListener('triggerup', () => { if (!B.on || !inXR()) return; if (performance.now() - (B.clickT || 0) < 300) return; const ray = h.components.raycaster; if (ray && ray.intersectedEls && ray.intersectedEls.length) return; act(lastHit); }); };
      this.el.addEventListener('loaded', hook); setTimeout(hook, 3000);
      this.el.addEventListener('exit-vr', () => { if (vrPanel) vrPanel.setAttribute('visible', false); if (B.on) bar().style.display = 'block'; }); this.el.addEventListener('enter-vr', () => { if (B.on) toggle(true); }); },
    tick: function (t) { if (!B.on || !inXR() || t - (this._t || 0) < 60) return; this._t = t; const h = document.querySelector('[laser-controls="hand:right"]'); if (!h) return; h.object3D.getWorldPosition(tmpO); tmpD.set(0, 0, -1).applyQuaternion(h.object3D.getWorldQuaternion(new THREE.Quaternion())); ghostUpdate(hitFrom(tmpO, tmpD)); } });
  function menuBtn() { const tools = document.querySelector('#ui .tools'); if (tools && !document.getElementById('buildbtn')) { const b = document.createElement('button'); b.id = 'buildbtn'; b.textContent = 'Build: Off'; b.onclick = () => toggle(); tools.appendChild(b); }
    const vm = document.querySelector('a-plane[data-w="home"]'), par = vm && vm.parentNode; if (par && !document.getElementById('buildvrbtn')) { const p = document.createElement('a-plane'); p.id = 'buildvrbtn'; p.className = 'btn'; p.setAttribute('position', '1.7 -1.2 0'); p.setAttribute('width', 0.8); p.setAttribute('height', 0.26); p.setAttribute('material', 'shader:flat;color:#FFD700');
      const tx = document.createElement('a-text'); tx.setAttribute('value', 'Build'); tx.setAttribute('align', 'center'); tx.setAttribute('color', '#111'); tx.setAttribute('width', 1.9); p.appendChild(tx); p.addEventListener('click', () => { B.clickT = performance.now(); toggle(); }); par.appendChild(p); } }
  const attach = () => { const sc = document.querySelector('a-scene'); if (sc) sc.setAttribute('w3d-build', ''); const iv = setInterval(() => { if (window.W3D_READY && W3D.root) { clearInterval(iv); ensure(); menuBtn(); } }, 1000); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attach); else attach();
})();
