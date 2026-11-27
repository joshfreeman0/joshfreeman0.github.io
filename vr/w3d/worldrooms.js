/* World rooms (T-29): New Zealand, Australia, Samoa, Hawaii and the Royal Family, each an FP_ROOMS guest room (vr/rooms/*.js)
   built inside this same page, loaded on enter and disposed on exit. Menu: one 'World rooms' button under Go to (VR) opens a small
   picker; on the 2D menu a 'World rooms' group under Go to. Links: ?room=nz | australia | samoa | hawaii | royal.
   Coming back returns you to the spot you left from. */
(function () {
  const V = '1';
  const ROOMS = [['nz', 'New Zealand'], ['australia', 'Australia'], ['samoa', 'Samoa'], ['hawaii', 'Hawaii'], ['royal', 'Royal Family']];
  const ALIAS = {nz: 'nz', 'new-zealand': 'nz', newzealand: 'nz', australia: 'australia', sydney: 'australia', samoa: 'samoa', hawaii: 'hawaii', royal: 'royal', 'royal-family': 'royal', buckingham: 'royal', london: 'royal'};
  let back = null, picker = null;
  function catalog() { if (!window.FP_ROOMS) return false; const C = FP_ROOMS.CATALOG;
    ROOMS.forEach(([k, t]) => { if (!C[k]) C[k] = {title: t, module: '/vr/rooms/' + k + '.js?v=' + V, fallbackUrl: null}; }); return true; }
  function closeMenu() { const bar = document.getElementById('vrbar'), mt = document.querySelector('[menu-toggle]');
    if (bar && bar.object3D.visible && mt && mt.components['menu-toggle']) mt.components['menu-toggle'].toggle(); }
  async function go(name) {
    if (!catalog() || FP_ROOMS.busy) return false; showPicker(false); closeMenu();
    if (FP_ROOMS.current === name) return true;
    if (FP_ROOMS.current) await FP_ROOMS.leave({});
    else { const cam = document.querySelector('[camera]'), rig = document.querySelector('#rig');
      if (cam && rig && window.W3D && W3D.root && W3D.root.visible) { const p = cam.object3D.getWorldPosition(new THREE.Vector3()); back = {x: p.x, y: rig.object3D.position.y, z: p.z, yaw: rig.object3D.rotation.y * 180 / Math.PI}; } }
    const ok = await FP_ROOMS.enter(name, {via: 'menu'});
    if (!ok && W3D.toast) W3D.toast('Could not open that room - try again', 3000);
    return ok;
  }
  async function home() { showPicker(false); closeMenu(); if (!window.FP_ROOMS || !FP_ROOMS.current) return;
    const b = back; await FP_ROOMS.leave({}); back = null;
    if (b) W3D.teleportTo(b.x, b.y, b.z, b.yaw); }
  window.FP_WORLDROOMS = {ROOMS, go, home};

  // VR picker: small panel in front of you with the five rooms (+ back home when in a room)
  function mk(parent, label, x, y, color, fn, w) { const p = document.createElement('a-plane'); p.className = 'btn'; p.setAttribute('width', w || 1.3); p.setAttribute('height', 0.26);
    p.setAttribute('position', x + ' ' + y + ' 0.01'); p.setAttribute('material', 'shader:flat;color:' + color);
    const t = document.createElement('a-text'); t.setAttribute('value', label); t.setAttribute('align', 'center'); t.setAttribute('color', '#111'); t.setAttribute('width', 2.0); t.setAttribute('position', '0 0 0.005');
    p.appendChild(t); p.addEventListener('click', fn); parent.appendChild(p); return p; }
  function buildPicker() { const sc = document.querySelector('a-scene'); if (!sc) return null;
    const e = document.createElement('a-entity'); e.id = 'wr-picker'; e.setAttribute('visible', false);
    const bg = document.createElement('a-plane'); bg.className = 'btn'; bg.dataset.blocker = '1'; bg.setAttribute('width', 3.0); bg.setAttribute('height', 1.55); bg.setAttribute('position', '0 0.05 -0.01');
    bg.setAttribute('material', 'shader:flat;color:#0b1d26;opacity:0.88;transparent:true'); e.appendChild(bg);
    const t = document.createElement('a-text'); t.setAttribute('value', 'WORLD ROOMS'); t.setAttribute('align', 'center'); t.setAttribute('color', '#FFD700'); t.setAttribute('width', 3); t.setAttribute('position', '0 0.66 0.01'); e.appendChild(t);
    ROOMS.forEach(([k, label], i) => mk(e, label, (i % 2 ? 0.7 : -0.7), 0.36 - Math.floor(i / 2) * 0.32, '#FFD700', () => go(k)));
    e._home = mk(e, 'Back to Fowling Pond', 0.7, 0.36 - 2 * 0.32, '#9ffcff', () => home());
    mk(e, 'Close', 0, -0.6, '#c9a24a', () => showPicker(false), 0.8);
    sc.appendChild(e); return e; }
  function showPicker(on) { if (!picker) { if (!on) return; picker = buildPicker(); if (!picker) return; }
    if (on) { JFVR.placeInFront && JFVR.placeInFront(picker, 1.9, 0.25); picker._home.setAttribute('visible', !!(window.FP_ROOMS && FP_ROOMS.current)); }
    picker.setAttribute('visible', on); picker.object3D.visible = on;
    setTimeout(() => document.querySelectorAll('[raycaster]').forEach(r => r.components.raycaster && r.components.raycaster.refreshObjects()), 30); }
  window.FP_WORLDROOMS.picker = showPicker;

  function menus() {
    const bar = document.getElementById('vrbar');
    if (bar && !document.getElementById('jfv-worldrooms')) { const p = document.createElement('a-plane'); p.id = 'jfv-worldrooms'; p.className = 'btn';
      p.setAttribute('width', 1.3); p.setAttribute('height', 0.26); p.setAttribute('material', 'shader:flat;color:#7fe0a8');
      const t = document.createElement('a-text'); t.setAttribute('value', 'World rooms'); t.setAttribute('align', 'center'); t.setAttribute('color', '#111'); t.setAttribute('width', 2.0); t.setAttribute('position', '0 0 0.005');
      p.appendChild(t); p.addEventListener('click', () => showPicker(true)); bar.appendChild(p); }
    const pane = document.getElementById('pane-go');
    if (pane && !document.getElementById('go-rooms')) { const g = document.createElement('div'); g.className = 'grp'; g.id = 'go-rooms';
      g.innerHTML = '<span class="sec">World rooms</span>';
      ROOMS.forEach(([k, label]) => { const b = document.createElement('button'); b.type = 'button'; b.dataset.room = k; b.textContent = label; b.addEventListener('click', () => go(k)); g.appendChild(b); });
      const hb = document.createElement('button'); hb.type = 'button'; hb.id = 'wr-home2d'; hb.textContent = 'Back to Fowling Pond'; hb.style.background = '#9ffcff'; hb.addEventListener('click', () => home()); g.appendChild(hb);
      pane.appendChild(g); }
  }
  // the Fowling Pond menu buttons (goWorld) also work from inside a room: leave the room first
  function wrapGoWorld() { const og = window.goWorld; if (typeof og !== 'function' || og._wr) return; const w = function (spot) {
      if (window.FP_ROOMS && FP_ROOMS.current) { back = null; FP_ROOMS.leave({}).then(() => og(spot)); return; } return og(spot); };
    w._wr = 1; window.goWorld = w; }
  function boot() { catalog(); menus(); wrapGoWorld();
    const q = (new URLSearchParams(location.search).get('room') || '').toLowerCase(), k = ALIAS[q];
    if (k) { const t = setInterval(() => { if (window.W3D_READY) { clearInterval(t); setTimeout(() => go(k), 400); } }, 300); } }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
