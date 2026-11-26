/* Tesseract Program link (Nov 25): a small sign on the bank terrace beside the default arrival spot, a button on the VR menu
   (row -2.4) and a plain HTML link in the 2D menu. Click with a Quest laser, the mouse or a phone tap. In a headset (immersive XR)
   it opens the site in this tab (the Quest browser leaves VR and loads it); on desktop/phone it opens a new tab, falling back to
   this tab if pop-ups are blocked. Text-only label, no Tesseract artwork.
   Nov 26: also a "Bank Ledger" button/link (Bank of the United States, Third Edition play-money ledger at vr/bank/) beside it.
   Nov 26 (menu clean-up): portal plaza - Red Planet Lounge and Bank Ledger doorways beside the unchanged Tesseract sign; 2D links go in the tabs. */
(function () {
  const URL_T = 'https://tesseractprogram.pages.dev/';
  function openT(ev) {
    /* Nov 26 (Josh): don't leave Fowling Pond - open the in-world Tesseract reader (tesseractreader.js); the full site is one click
       away inside the 2D reader. Only if the reader is missing do we fall back to opening the site. */
    if (ev && ev.preventDefault && ev.currentTarget && ev.currentTarget.tagName === 'A') ev.preventDefault();
    if (window.JFVR_tessReader) { window.JFVR_tessReader.open('home'); return; }
    const sc = document.querySelector('a-scene'), xr = sc && sc.renderer && sc.renderer.xr && sc.renderer.xr.isPresenting;
    if (window.JFVR && JFVR.hud) JFVR.hud('Opening the Tesseract Program website...');
    if (xr) { window.location.assign(URL_T); return; }
    const w = window.open(URL_T, '_blank', 'noopener'); if (!w) window.location.assign(URL_T);
  }
  window.JFVR_openTesseract = openT;
  const URL_B = new URL('/vr/bank/', location.href).href;
  function openB() {
    const sc = document.querySelector('a-scene'), xr = sc && sc.renderer && sc.renderer.xr && sc.renderer.xr.isPresenting;
    if (window.JFVR && JFVR.hud) JFVR.hud('Opening the Bank Ledger (play money)...');
    if (xr) { window.location.assign(URL_B); return; }
    const w = window.open(URL_B, '_blank', 'noopener'); if (!w) window.location.assign(URL_B);
  }
  window.JFVR_openBankLedger = openB;
  function txt(parent, value, y, width, color) { const t = document.createElement('a-text'); t.setAttribute('value', value); t.setAttribute('align', 'center');
    t.setAttribute('color', color); t.setAttribute('width', width); t.setAttribute('position', '0 ' + y + ' 0.012'); parent.appendChild(t); return t; }
  /* Portal plaza (Nov 26 menu clean-up): the Tesseract sign stays exactly where it was, unchanged; two matching doorways stand
     to its left (away from the arrival view), slightly smaller - Red Planet Lounge (takes you to the launch pad rocket), then the Bank Ledger.
     Room is left behind/above for a future multiverse map. */
  function panel(g, id, x, yaw, bg, frame, lines, onClick) {
    const e = document.createElement('a-entity'); if (id) e.id = id; e.setAttribute('position', x + ' -0.08 ' + (-Math.abs(x) * 0.12).toFixed(2)); e.setAttribute('rotation', '0 ' + yaw + ' 0'); e.setAttribute('scale', '0.82 0.82 0.82');
    const post = document.createElement('a-box'); post.setAttribute('width', 0.08); post.setAttribute('height', 1.6); post.setAttribute('depth', 0.08);
    post.setAttribute('position', '0 -0.93 -0.03'); post.setAttribute('height', 1.9); post.setAttribute('material', 'color:#6b5a2e;roughness:0.6;metalness:0.4'); e.appendChild(post);
    const p = document.createElement('a-plane'); p.setAttribute('class', 'btn'); p.setAttribute('width', 1.8); p.setAttribute('height', 0.85);
    p.setAttribute('material', 'shader:flat;color:' + bg + ';side:double'); p.addEventListener('click', onClick); e.appendChild(p);
    const f = document.createElement('a-plane'); f.setAttribute('width', 1.87); f.setAttribute('height', 0.92); f.setAttribute('position', '0 0 -0.006');
    f.setAttribute('material', 'shader:flat;color:' + frame + ';side:double'); e.appendChild(f);
    lines.forEach(l => txt(p, l[0], l[1], l[2], l[3])); g.appendChild(e); return e;
  }
  function sign() {
    const sc = document.querySelector('a-scene'); if (!sc || document.getElementById('tesseract-sign')) return;
    /* terrace arrival is (846, 34.3, -380) facing west (-X); sign stands 3.5 m ahead, a little to the left, turned to face the arrival */
    const g = document.createElement('a-entity'); g.id = 'tesseract-sign'; g.setAttribute('position', '842.8 35.95 -377.4'); g.setAttribute('rotation', '0 78 0');
    const post = document.createElement('a-box'); post.setAttribute('width', 0.08); post.setAttribute('height', 1.6); post.setAttribute('depth', 0.08);
    post.setAttribute('position', '0 -0.8 -0.03'); post.setAttribute('material', 'color:#6b5a2e;roughness:0.6;metalness:0.4'); g.appendChild(post);
    const p = document.createElement('a-plane'); p.setAttribute('class', 'btn'); p.setAttribute('width', 1.8); p.setAttribute('height', 0.85);
    p.setAttribute('material', 'shader:flat;color:#101820;side:double'); p.addEventListener('click', openT); g.appendChild(p);
    const f = document.createElement('a-plane'); f.setAttribute('width', 1.87); f.setAttribute('height', 0.92); f.setAttribute('position', '0 0 -0.006');
    f.setAttribute('material', 'shader:flat;color:#FFD700;side:double'); g.appendChild(f);
    txt(p, 'TESSERACT PROGRAM', 0.22, 3.3, '#FFD700');
    txt(p, 'Website: research, documents, sources', -0.03, 2.15, '#ffffff');
    txt(p, 'Click / tap to read it here  >', -0.25, 2.3, '#9ffcff');
    const hdr = document.createElement('a-text'); hdr.setAttribute('value', 'PORTALS - OTHER WORLDS'); hdr.setAttribute('align', 'center'); hdr.setAttribute('color', '#FFD700');
    hdr.setAttribute('width', 3.2); hdr.setAttribute('position', '-1.75 0.68 -0.2'); hdr.setAttribute('side', 'double'); g.appendChild(hdr);
    panel(g, 'rpl-sign', -1.75, 6, '#3a1208', '#ff7a45', [['RED PLANET LOUNGE', 0.22, 3.3, '#ffb08a'], ['The Mars lounge - ride the rocket', -0.03, 2.15, '#ffffff'], ['Click / tap: go to the launch pad  >', -0.25, 2.3, '#ffd27a']],
      () => { if (typeof window.goWorld === 'function') window.goWorld('launchpad'); else if (window.W3D && W3D.goMars) W3D.goMars(); });
    panel(g, 'ledger-sign', -3.5, 12, '#1d1a0c', '#FFD700', [['BANK LEDGER', 0.22, 3.3, '#FFD700'], ['Bank of the United States - play money', -0.03, 2.15, '#ffffff'], ['Click / tap to open  >', -0.25, 2.3, '#9ffcff']], openB);
    sc.appendChild(g);
  }
  function vrButton() {
    const bar = document.getElementById('vrbar'); if (!bar || document.getElementById('tesseractvr')) return;
    const p = document.createElement('a-plane'); p.id = 'tesseractvr'; p.className = 'btn'; p.setAttribute('position', '0 -2.4 0'); p.setAttribute('width', '1.6'); p.setAttribute('height', '0.26');
    p.setAttribute('material', 'shader:flat;color:#9ffcff'); const t = document.createElement('a-text'); t.setAttribute('value', 'Tesseract reader'); t.setAttribute('align', 'center');
    t.setAttribute('color', '#111'); t.setAttribute('width', '2.4'); p.appendChild(t); p.addEventListener('click', openT); bar.appendChild(p);
    if (!document.getElementById('bankledgervr')) { const q = document.createElement('a-plane'); q.id = 'bankledgervr'; q.className = 'btn'; q.setAttribute('position', '1.9 -2.4 0'); q.setAttribute('width', '1.6'); q.setAttribute('height', '0.26');
      q.setAttribute('material', 'shader:flat;color:#FFD700'); const u = document.createElement('a-text'); u.setAttribute('value', 'Bank Ledger (play money)'); u.setAttribute('align', 'center');
      u.setAttribute('color', '#111'); u.setAttribute('width', '2.4'); q.appendChild(u); q.addEventListener('click', openB); bar.appendChild(q); }
    setTimeout(() => document.querySelectorAll('[raycaster]').forEach(r => r.components.raycaster && r.components.raycaster.refreshObjects()), 500);
  }
  function htmlLink() {   /* 2D menu: the links live in the Other worlds and Bank tabs (falls back to a Links row) */
    const ui = document.getElementById('ui'); if (!ui || document.getElementById('tesseractlink')) return;
    const a = (id, href, bg, label) => '<a id="' + id + '" class="lnk" href="' + href + '" target="_blank" rel="noopener" style="background:' + bg + '">' + label + '</a>';
    const w = document.getElementById('worlds-links'), bk = document.getElementById('bank-links');
    if (w && bk) { w.insertAdjacentHTML('beforeend', a('tesseractlink', URL_T, '#9ffcff', 'Tesseract Program (read it here)')); const tl = document.getElementById('tesseractlink'); if (tl) tl.addEventListener('click', openT); bk.insertAdjacentHTML('beforeend', a('bankledgerlink', URL_B, '#FFD700', 'Bank Ledger (look up a bill)')); return; }
    const d = document.createElement('div'); d.className = 'grp'; d.innerHTML = '<span class="sec">Links:</span>' + a('tesseractlink', URL_T, '#9ffcff', 'Tesseract Program website') + a('bankledgerlink', URL_B, '#FFD700', 'Bank Ledger (play money)');
    ui.appendChild(d);
  }
  function init() { sign(); vrButton(); htmlLink(); }
  const sc = document.querySelector('a-scene');
  if (!sc) document.addEventListener('DOMContentLoaded', init); else if (sc.hasLoaded) init(); else sc.addEventListener('loaded', init);
})();
