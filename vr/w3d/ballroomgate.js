/* Grand Ballroom gateway (Nov 27 2026). The room is vr/rooms/ballroom.js, mounted in this page by FP_ROOMS (fprooms.js), so Quest
   never leaves VR. This file adds it to the FP_ROOMS catalog at runtime (fprooms.js is unchanged), plus the ways in:
   'Grand Ballroom' under Go to (2D and VR menus), W3D.spots.ballroom, and the URLs ?room=ballroom or ?spot=ballroom.
   While you are in the ballroom, any other Go to button first leaves the room, then goes there. */
(function () {
  'use strict';
  const MOD = '/vr/rooms/ballroom.js?v=1';
  const hud = m => { if (window.W3D && W3D.toast) W3D.toast(m, 3000); else if (window.JFVR && JFVR.hud) JFVR.hud(m); };
  (function cat() { if (!window.FP_ROOMS) return setTimeout(cat, 300); if (!FP_ROOMS.CATALOG.ballroom) FP_ROOMS.CATALOG.ballroom = {title: 'Grand Ballroom', module: MOD, fallbackUrl: null}; })();
  async function enter() {
    const R = window.FP_ROOMS; if (!R || R.busy || !window.W3D || !W3D.root) return;
    if (R.current === 'ballroom') return; if (R.current) await R.leave({});
    hud('Entering the Grand Ballroom...');
    R.enter('ballroom', {via: 'menu'}).then(ok => { if (!ok) hud('The Grand Ballroom could not load - try again'); });
  }
  window.JFVR_enterBallroom = enter;
  (function reg() { if (!window.W3D || !W3D.spots) return setTimeout(reg, 300); W3D.spots.ballroom = enter;
    const gw = window.goWorld;   // leave the ballroom before travelling anywhere else
    if (typeof gw === 'function' && !gw._ballroom) { const w = function (spot) { const R = window.FP_ROOMS;
        if (R && R.current === 'ballroom' && spot !== 'ballroom') { R.leave({spot}); return; } return gw.apply(this, arguments); }; w._ballroom = 1; window.goWorld = w; } })();
  const QS = new URLSearchParams(location.search);
  if (/^(ballroom|grand-ballroom)$/.test((QS.get('room') || QS.get('spot') || '').toLowerCase())) (function wait(n) {
    if (n > 240) return; const ready = window.W3D_READY && window.W3D && W3D.root && W3D.spots && window.FP_ROOMS && !(W3D.arrival && W3D.arrival.active);
    if (!ready) return setTimeout(() => wait(n + 1), 500); setTimeout(enter, 2500); })(0);
  function menus() {
    const far = document.getElementById('go-far');
    if (far && !document.getElementById('ballroomlink')) { const b = document.createElement('button'); b.id = 'ballroomlink'; b.type = 'button'; b.textContent = 'Grand Ballroom';
      b.addEventListener('click', ev => { ev.preventDefault(); enter(); }); far.appendChild(b); }
    const bar = document.getElementById('vrbar');
    if (bar && !document.getElementById('jfv-ballroom')) { const p = document.createElement('a-plane'); p.id = 'jfv-ballroom'; p.className = 'btn';
      p.setAttribute('width', 1.3); p.setAttribute('height', 0.26); p.setAttribute('material', 'shader:flat;color:#FFD700');
      const t = document.createElement('a-text'); t.setAttribute('value', 'Grand Ballroom'); t.setAttribute('align', 'center'); t.setAttribute('color', '#111'); t.setAttribute('width', 2.0); t.setAttribute('position', '0 0 0.005');
      p.appendChild(t); p.addEventListener('click', enter); bar.appendChild(p); }
  }
  const sc = document.querySelector('a-scene');
  if (!sc) document.addEventListener('DOMContentLoaded', menus); else if (sc.hasLoaded) menus(); else sc.addEventListener('loaded', menus);
  setTimeout(menus, 4000);
})();
