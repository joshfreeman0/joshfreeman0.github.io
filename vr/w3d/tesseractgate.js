/* Tesseract room gateways (T-21, Nov 27 2026). The room itself is vr/rooms/tesseract.js, mounted in this page by FP_ROOMS (fprooms.js),
   so Quest never leaves VR. Ways in:
   - the walk-in gateway inside the Star Fleet base (starfleet.js calls JFVR_enterTesseract; walk through it or point and click),
   - a "Tesseract room" portal beside the unchanged Tesseract sign on the bank terrace (added to the portal plaza row),
   - Other worlds tab (2D) link, W3D.spots.tesseract, and the URLs ?room=tesseract or ?spot=tesseract (enter once the world is ready).
   If the room fails to load, FP_ROOMS rolls back and the Tesseract reader opens instead. */
(function () {
  'use strict';
  const hud = m => { if (window.W3D && W3D.toast) W3D.toast(m, 3000); else if (window.JFVR && JFVR.hud) JFVR.hud(m); };
  function enter() {
    const R = window.FP_ROOMS; if (!R || R.current || R.busy || !window.W3D || !W3D.root) return;
    hud('Entering the Tesseract room...');
    R.enter('tesseract', {via: 'gate'}).then(ok => { if (!ok) { hud('The Tesseract room could not load - opening the reader'); if (window.JFVR_tessReader) window.JFVR_tessReader.open('home'); } });
  }
  window.JFVR_enterTesseract = enter;
  (function reg() { if (!window.W3D || !W3D.spots) return setTimeout(reg, 300); W3D.spots.tesseract = enter; })();
  // ?room=tesseract / ?spot=tesseract: land at the terrace as usual, then step through once the world (and any arrival ride) is done
  const QS = new URLSearchParams(location.search);
  if ((QS.get('room') || QS.get('spot') || '').toLowerCase() === 'tesseract') (function wait(n) {
    if (n > 240) return; const ready = window.W3D_READY && window.W3D && W3D.root && W3D.spots && W3D.spots.terrace && window.FP_ROOMS && !(W3D.arrival && W3D.arrival.active);
    if (!ready) return setTimeout(() => wait(n + 1), 500); setTimeout(enter, 2500); })(0);
  // bank terrace: one more doorway in the portal plaza row, left of the Bank Ledger door (the Tesseract sign itself is unchanged)
  function txt(p, v, y, w, c) { const t = document.createElement('a-text'); t.setAttribute('value', v); t.setAttribute('align', 'center'); t.setAttribute('color', c); t.setAttribute('width', w); t.setAttribute('position', '0 ' + y + ' 0.012'); p.appendChild(t); }
  function plaza() {
    const g = document.getElementById('tesseract-sign'); if (!g) return setTimeout(plaza, 1000); if (document.getElementById('tessroom-sign')) return;
    const e = document.createElement('a-entity'); e.id = 'tessroom-sign'; e.setAttribute('position', '-5.25 -0.08 -0.63'); e.setAttribute('rotation', '0 18 0'); e.setAttribute('scale', '0.82 0.82 0.82');
    const post = document.createElement('a-box'); post.setAttribute('width', 0.08); post.setAttribute('depth', 0.08); post.setAttribute('height', 1.9); post.setAttribute('position', '0 -0.93 -0.03'); post.setAttribute('material', 'color:#6b5a2e;roughness:0.6;metalness:0.4'); e.appendChild(post);
    const p = document.createElement('a-plane'); p.setAttribute('class', 'btn'); p.setAttribute('width', 1.8); p.setAttribute('height', 0.85); p.setAttribute('material', 'shader:flat;color:#06222b;side:double'); p.addEventListener('click', enter); e.appendChild(p);
    const f = document.createElement('a-plane'); f.setAttribute('width', 1.87); f.setAttribute('height', 0.92); f.setAttribute('position', '0 0 -0.006'); f.setAttribute('material', 'shader:flat;color:#59e1ff;side:double'); e.appendChild(f);
    txt(p, 'TESSERACT ROOM', 0.22, 3.3, '#9ffcff'); txt(p, 'Walk-in hall: DIRDs, lab, multiverse map', -0.03, 2.15, '#ffffff'); txt(p, 'Click / tap to step inside  >', -0.25, 2.3, '#FFD700');
    g.appendChild(e); setTimeout(() => document.querySelectorAll('[raycaster]').forEach(r => r.components.raycaster && r.components.raycaster.refreshObjects()), 500);
  }
  function link2D() { const w = document.getElementById('worlds-links'); if (!w) return; if (document.getElementById('tessroomlink')) return;
    w.insertAdjacentHTML('beforeend', '<a id="tessroomlink" class="lnk" href="?room=tesseract" style="background:#59e1ff">Tesseract room (walk in)</a>');
    document.getElementById('tessroomlink').addEventListener('click', ev => { ev.preventDefault(); enter(); }); }
  function init() { plaza(); link2D(); }
  const sc = document.querySelector('a-scene');
  if (!sc) document.addEventListener('DOMContentLoaded', init); else if (sc.hasLoaded) init(); else sc.addEventListener('loaded', init);
})();
