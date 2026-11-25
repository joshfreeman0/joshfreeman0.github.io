/* Tesseract Program link (Nov 25): a small sign on the bank terrace beside the default arrival spot, a button on the VR menu
   (row -2.4) and a plain HTML link in the 2D menu. Click with a Quest laser, the mouse or a phone tap. In a headset (immersive XR)
   it opens the site in this tab (the Quest browser leaves VR and loads it); on desktop/phone it opens a new tab, falling back to
   this tab if pop-ups are blocked. Text-only label, no Tesseract artwork. */
(function () {
  const URL_T = 'https://tesseractprogram.pages.dev/';
  function openT() {
    const sc = document.querySelector('a-scene'), xr = sc && sc.renderer && sc.renderer.xr && sc.renderer.xr.isPresenting;
    if (window.JFVR && JFVR.hud) JFVR.hud('Opening the Tesseract Program website...');
    if (xr) { window.location.assign(URL_T); return; }
    const w = window.open(URL_T, '_blank', 'noopener'); if (!w) window.location.assign(URL_T);
  }
  window.JFVR_openTesseract = openT;
  function txt(parent, value, y, width, color) { const t = document.createElement('a-text'); t.setAttribute('value', value); t.setAttribute('align', 'center');
    t.setAttribute('color', color); t.setAttribute('width', width); t.setAttribute('position', '0 ' + y + ' 0.012'); parent.appendChild(t); return t; }
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
    txt(p, 'Click / tap to open  >', -0.25, 2.3, '#9ffcff');
    sc.appendChild(g);
  }
  function vrButton() {
    const bar = document.getElementById('vrbar'); if (!bar || document.getElementById('tesseractvr')) return;
    const p = document.createElement('a-plane'); p.id = 'tesseractvr'; p.className = 'btn'; p.setAttribute('position', '0 -2.4 0'); p.setAttribute('width', '1.6'); p.setAttribute('height', '0.26');
    p.setAttribute('material', 'shader:flat;color:#9ffcff'); const t = document.createElement('a-text'); t.setAttribute('value', 'Tesseract Program website'); t.setAttribute('align', 'center');
    t.setAttribute('color', '#111'); t.setAttribute('width', '2.4'); p.appendChild(t); p.addEventListener('click', openT); bar.appendChild(p);
  }
  function htmlLink() {
    const ui = document.getElementById('ui'); if (!ui || document.getElementById('tesseractlink')) return;
    const d = document.createElement('div'); d.className = 'grp'; d.innerHTML = '<span class="sec">Links:</span><a id="tesseractlink" href="' + URL_T + '" target="_blank" rel="noopener" ' +
      'style="display:inline-block;font-size:15px;margin:3px;padding:8px 12px;border-radius:8px;background:#9ffcff;color:#111;text-decoration:none">Tesseract Program website</a>';
    const g = ui.querySelectorAll('.grp'); const last = g[g.length - 1]; if (last && last.nextSibling) ui.insertBefore(d, last.nextSibling); else ui.appendChild(d);
  }
  function init() { sign(); vrButton(); htmlLink(); }
  const sc = document.querySelector('a-scene');
  if (!sc) document.addEventListener('DOMContentLoaded', init); else if (sc.hasLoaded) init(); else sc.addEventListener('loaded', init);
})();
