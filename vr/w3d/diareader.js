/* DIA Papers reader (T-28, Nov 27 2026; Josh: yes). The 37 DIRDs (Defense Intelligence Reference Documents, AAWSAP) in an in-world
   reader that never leaves Fowling Pond or the VR session: no links, no navigation. Same pattern as the Tesseract reader
   (tesseractreader.js): a canvas panel with laser-clickable buttons and a backing that stops the laser.
   Content: Red Planet Lounge's cleaned OCR (index.json + d01..d37.json, copied unchanged into vr/dia/ - same origin, no CORS):
   title, metadata, 'In plain words' guide (DIRD 13), full text with 'PDF page' markers.
   Headset: opens ~1 m in front of you at the contents list (DIRD 13 first). Text 64 px on a 2048 px panel (A- / A+ 48..104 px,
   remembered), page buttons, Sections (headings in the paper), Closer / Farther, and grab-to-move (point at the panel, hold grip).
   Desktop / phone: an overlay with the same contents, text size and sections. Open: wrist panel 'DIA Papers', 2D Other worlds tab. */
(function () {
  'use strict';
  const BASE = '/vr/dia/', CW = 2048, CH = 1400, PADX = 90, TOP = 190, BOT = 1300, ROWS = 9, RH = 122, W = 1.5, H = W * CH / CW;
  const S = {mode: 'contents', idx: null, doc: null, n: 0, lines: [], pages: [[]], page: 0, list: 0, secs: [], font: +(localStorage.getItem('jfvr_dia_font') || 64), el: null, ctx: null, tex: null, rows: [], open: false};
  const cache = {};
  const getJSON = u => fetch(BASE + u).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); });
  async function index() { if (!S.idx) { const j = await getJSON('index.json'); S.idx = (j.dirds || []).slice(); } return S.idx; }   // index.json already lists DIRD 13 first
  async function paper(n) { const id = 'd' + String(n).padStart(2, '0'); if (!cache[id]) cache[id] = await getJSON(id + '.json'); return cache[id]; }
  /* paper -> blocks {k: h1|h2|meta|p|pg|note, t} */
  function blocks(d) { const B = [{k: 'h1', t: 'DIRD ' + d.n + ': ' + d.title}];
    for (const [k, v] of Object.entries(d.meta || {})) B.push({k: 'meta', t: k + ': ' + v});
    if (d.synopsis && d.synopsis.length) { B.push({k: 'h2', t: 'Synopsis'}); d.synopsis.forEach(t => B.push({k: 'p', t: String(t)})); }
    if (d.points && d.points.length) { B.push({k: 'h2', t: 'Key points'}); d.points.forEach(t => B.push({k: 'p', t: '\u2022 ' + t})); }
    if (d.plain && d.plain.length) { B.push({k: 'h2', t: 'In plain words'}); d.plain.forEach(t => B.push({k: 'p', t: String(t)})); }
    B.push({k: 'h2', t: 'Full text'});
    for (const x of d.body || []) { if (typeof x === 'string') { if (x.trim()) B.push({k: 'p', t: x.trim()}); } else if (x && x.pg != null) B.push({k: 'pg', t: '\u2014 PDF page ' + x.pg + ' \u2014'}); else if (x && x.h) B.push({k: 'h2', t: String(x.h)}); }
    return B; }
  /* ---------- canvas layout ---------- */
  function fontFor(k) { const f = S.font; return k === 'h1' ? ['bold ' + Math.round(f * 1.22) + 'px Georgia, serif', '#FFD700', 1.25] : k === 'h2' ? ['bold ' + Math.round(f * 1.08) + 'px Georgia, serif', '#FFD700', 1.3]
    : k === 'meta' ? [Math.round(f * 0.86) + 'px Arial, sans-serif', '#9ffcff', 1.3] : k === 'pg' ? ['italic ' + Math.round(f * 0.78) + 'px Arial, sans-serif', '#c9b37a', 1.6] : [f + 'px Arial, sans-serif', '#f2f2f2', 1.32]; }
  function wrap(g, t, w) { const words = t.split(/\s+/), out = []; let cur = ''; for (const wd of words) { const n = cur ? cur + ' ' + wd : wd; if (g.measureText(n).width > w && cur) { out.push(cur); cur = wd; } else cur = n; } if (cur) out.push(cur); return out; }
  function paginate() { const g = S.ctx, pages = [[]], secs = []; let y = 0; const maxH = BOT - TOP;
    for (const b of S.doc) { const [font, col, lhK] = fontFor(b.k); g.font = font; const px = parseInt(font.match(/(\d+)px/)[1], 10), lh = Math.round(px * lhK);
      if ((b.k === 'h2' || b.k === 'h1') && y > 0 && y + lh * 3 > maxH) { pages.push([]); y = 0; }   // no heading orphaned at the foot of a page
      if (b.k === 'h2') secs.push({t: b.t, page: pages.length - 1 + (y + lh > maxH ? 1 : 0)});
      for (const l of wrap(g, b.t, CW - 2 * PADX)) { if (y + lh > maxH) { pages.push([]); y = 0; } pages[pages.length - 1].push({l, font, col, y: y + px}); y += lh; }
      y += b.k === 'p' ? Math.round(px * 0.45) : Math.round(px * 0.3); }
    S.pages = pages; S.secs = secs; if (S.page >= pages.length) S.page = pages.length - 1; }
  function header(g, t, right) { g.fillStyle = '#0d141b'; g.fillRect(0, 0, CW, CH); g.strokeStyle = '#FFD700'; g.lineWidth = 10; g.strokeRect(5, 5, CW - 10, CH - 10);
    g.fillStyle = '#FFD700'; g.font = 'bold 56px Arial, sans-serif'; g.textBaseline = 'alphabetic'; g.textAlign = 'left';
    let tt = t; while (g.measureText(tt).width > CW - 2 * PADX - 520 && tt.length > 8) tt = tt.slice(0, -2); if (tt !== t) tt = tt.replace(/\s*\S*$/, '') + '...'; g.fillText(tt, PADX, 110);
    g.fillStyle = '#9ffcff'; g.font = '44px Arial, sans-serif'; g.textAlign = 'right'; g.fillText(right || '', CW - PADX, 110); g.textAlign = 'left';
    g.fillStyle = '#3a3320'; g.fillRect(PADX, 140, CW - 2 * PADX, 4); }
  function footer(g, t) { g.fillStyle = '#ffe9a8'; g.font = '46px Arial, sans-serif'; g.textAlign = 'center'; g.fillText(t, CW / 2, CH - 40); g.textAlign = 'left'; }
  function listItems() { return S.mode === 'contents' ? (S.idx || []).map(d => ({t: 'DIRD ' + d.n + '  \u2013  ' + d.title, sub: d.date + '  \u00b7  ' + d.pages + ' pages', go: () => openPaper(d.n)}))
    : S.secs.map(s => ({t: s.t, sub: 'page ' + (s.page + 1), go: () => { S.mode = 'paper'; S.page = s.page; draw(); }})); }
  function draw() { const g = S.ctx; if (!g) return;
    if (S.mode === 'paper') { header(g, S.doc ? 'DIRD ' + S.n : 'Loading...', 'DIA Papers'); const pg = S.pages[S.page] || [];
      for (const r of pg) { g.font = r.font; g.fillStyle = r.col; g.fillText(r.l, PADX, TOP + r.y); } footer(g, 'Page ' + (S.page + 1) + ' of ' + S.pages.length + '   \u00b7   text ' + S.font + ' px'); }
    else { const items = listItems(), np = Math.max(1, Math.ceil(items.length / ROWS)); if (S.list >= np) S.list = np - 1;
      header(g, S.mode === 'contents' ? 'DIA Papers \u2013 the 37 DIRDs' : 'Sections \u2013 DIRD ' + S.n, S.mode === 'contents' ? 'Pick a paper' : 'Pick a section');
      items.slice(S.list * ROWS, S.list * ROWS + ROWS).forEach((it, i) => { const y = TOP + i * RH; g.fillStyle = i % 2 ? '#132430' : '#0f1d27'; g.fillRect(PADX - 20, y, CW - 2 * PADX + 40, RH - 8);
        g.font = '44px Arial, sans-serif'; const sw = g.measureText(it.sub).width; g.fillStyle = '#f2f2f2'; g.font = 'bold 60px Arial, sans-serif'; let t = it.t; while (g.measureText(t + '...').width > CW - 2 * PADX - sw - 50 && t.length > 6) t = t.slice(0, -2); if (t !== it.t) t += '...'; g.fillText(t, PADX, y + 74);
        g.fillStyle = '#9ffcff'; g.font = '44px Arial, sans-serif'; g.textAlign = 'right'; g.fillText(it.sub, CW - PADX, y + 74); g.textAlign = 'left'; });
      footer(g, (S.mode === 'contents' ? 'Contents' : 'Sections') + '  \u00b7  page ' + (S.list + 1) + ' of ' + np + '  \u00b7  point and pull the trigger'); }
    S.tex.needsUpdate = true; rowState(); render2D(); }
  function rowState() { const on = S.mode !== 'paper', n = listItems().length; S.rows.forEach((r, i) => { const live = on && S.list * ROWS + i < n; r.object3D.visible = live; if (live) r.classList.add('btn'); else r.classList.remove('btn'); });
    document.querySelectorAll('[raycaster]').forEach(r => r.components.raycaster && r.components.raycaster.refreshObjects()); }
  async function openPaper(n) { S.mode = 'paper'; S.n = n; S.doc = null; S.pages = [[]]; S.page = 0; draw();
    try { const d = await paper(n); if (S.n !== n) return; S.doc = blocks(d); } catch (e) { S.doc = [{k: 'h1', t: 'DIRD ' + n}, {k: 'p', t: 'This paper could not be loaded (' + e.message + '). Try again in a moment.'}]; }
    paginate(); draw(); }
  async function contents() { S.mode = 'contents'; draw(); try { await index(); } catch (e) { S.idx = []; } draw(); }
  function step(d) { if (S.mode === 'paper') { S.page = Math.max(0, Math.min(S.pages.length - 1, S.page + d)); } else { const np = Math.ceil(listItems().length / ROWS) || 1; S.list = Math.max(0, Math.min(np - 1, S.list + d)); } draw(); }
  function size(d) { S.font = Math.max(48, Math.min(104, S.font + d)); localStorage.setItem('jfvr_dia_font', S.font); if (S.doc) { const frac = S.pages.length ? S.page / S.pages.length : 0; paginate(); S.page = Math.round(frac * S.pages.length); } draw(); }
  /* ---------- headset panel ---------- */
  function btn(parent, label, x, y, w, color, fn) { const p = document.createElement('a-plane'); p.className = 'btn'; p.setAttribute('width', w); p.setAttribute('height', 0.085); p.setAttribute('position', x + ' ' + y + ' 0.01');
    p.setAttribute('material', 'shader:flat;color:' + color); const t = document.createElement('a-text'); t.setAttribute('value', label); t.setAttribute('align', 'center'); t.setAttribute('color', '#111'); t.setAttribute('width', 1.25); t.setAttribute('position', '0 0 0.002');
    p.appendChild(t); p.addEventListener('click', ev => { ev.stopPropagation && ev.stopPropagation(); fn(); }); parent.appendChild(p); return p; }
  function cam() { return document.querySelector('a-scene').camera; }
  function face(o) { const c = cam().getWorldPosition(new THREE.Vector3()); o.up.set(0, 1, 0); o.lookAt(c.x, o.position.y, c.z); }
  function build() { if (S.el) return S.el; const sc = document.querySelector('a-scene'); const e = S.el = document.createElement('a-entity'); e.id = 'dia-reader'; sc.appendChild(e); e.object3D.visible = false;
    const c = document.createElement('canvas'); c.width = CW; c.height = CH; S.ctx = c.getContext('2d'); S.tex = new THREE.CanvasTexture(c); S.tex.colorSpace = THREE.SRGBColorSpace; S.tex.anisotropy = 8;
    e.object3D.add(new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({map: S.tex, toneMapped: false, fog: false})));
    const back = document.createElement('a-plane'); back.className = 'btn'; back.dataset.blocker = '1'; back.setAttribute('width', W + 0.08); back.setAttribute('height', H + 0.3); back.setAttribute('position', '0 -0.11 -0.01');
    back.setAttribute('material', 'shader:flat;color:#0b1d26;side:double'); e.appendChild(back);
    for (let i = 0; i < ROWS; i++) { const r = document.createElement('a-plane'); r.className = 'btn'; const cy = TOP + i * RH + (RH - 8) / 2; r.setAttribute('width', W * 0.92); r.setAttribute('height', ((RH - 12) / CH * H).toFixed(4));
      r.setAttribute('position', '0 ' + (H / 2 - cy / CH * H).toFixed(4) + ' 0.004'); r.setAttribute('material', 'shader:flat;transparent:true;opacity:0'); r.addEventListener('click', () => { const it = listItems()[S.list * ROWS + i]; if (it) it.go(); }); e.appendChild(r); S.rows.push(r); }
    const y1 = -H / 2 - 0.065, y2 = y1 - 0.105, X = [-0.6, -0.3, 0, 0.3, 0.6];
    btn(e, 'Contents', X[0], y1, 0.27, '#c9a24a', contents); btn(e, 'Sections', X[1], y1, 0.27, '#c9a24a', () => { if (!S.doc) return; S.mode = 'sections'; const cur = S.secs.filter(x => x.page <= S.page).length - 1; S.list = Math.max(0, Math.floor(cur / ROWS)); draw(); });
    btn(e, '< Page', X[2], y1, 0.27, '#FFD700', () => step(-1)); btn(e, 'Page >', X[3], y1, 0.27, '#FFD700', () => step(1)); btn(e, 'Close', X[4], y1, 0.27, '#ff8a80', close);
    btn(e, 'A-', X[0], y2, 0.27, '#9ffcff', () => size(-8)); btn(e, 'A+', X[1], y2, 0.27, '#9ffcff', () => size(8));
    btn(e, 'Closer', X[2], y2, 0.27, '#9ffcff', () => dist(-0.2)); btn(e, 'Farther', X[3], y2, 0.27, '#9ffcff', () => dist(0.2));
    const hint = document.createElement('a-text'); hint.setAttribute('value', 'Grip = move'); hint.setAttribute('align', 'center'); hint.setAttribute('color', '#ffe9a8'); hint.setAttribute('width', 1.2); hint.setAttribute('position', X[4] + ' ' + y2 + ' 0.01'); e.appendChild(hint);
    rowState(); return e; }
  function dist(d) { const o = S.el.object3D, c = cam().getWorldPosition(new THREE.Vector3()), v = o.position.clone().sub(c); const L = Math.max(0.5, Math.min(3, v.length() + d)); o.position.copy(c).add(v.setLength(L)); face(o); }
  function inXR() { const sc = document.querySelector('a-scene'); return !!(sc && sc.renderer && sc.renderer.xr && sc.renderer.xr.isPresenting); }
  function openVR() { const e = build(); const place = () => { const c = cam(), p = c.getWorldPosition(new THREE.Vector3()), q = c.getWorldQuaternion(new THREE.Quaternion());
      const f = new THREE.Vector3(0, 0, -1).applyQuaternion(q); f.y = 0; if (f.lengthSq() < 1e-4) f.set(0, 0, -1); f.normalize();
      e.object3D.position.copy(p).addScaledVector(f, 1.0); e.object3D.position.y = p.y - 0.12; face(e.object3D); e.object3D.visible = true; rowState(); };
    if (e.hasLoaded) place(); else e.addEventListener('loaded', place, {once: true}); if (!S.doc || S.mode !== 'paper') contents(); else draw(); }
  /* grab to move: point the right laser at the panel and hold grip; it follows the controller at the same distance and keeps facing you */
  let grab = null; const _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _f = new THREE.Vector3();
  function hookGrip() { const R = document.querySelector('[laser-controls*="right"]'); if (!R || R._diaGrip) return; R._diaGrip = 1;
    R.addEventListener('gripdown', () => { if (!S.el || !S.el.object3D.visible) return; const rc = R.components.raycaster; const hit = rc && rc.intersectedEls.find(el => el.closest && el.closest('#dia-reader'));
      if (!hit) return; R.object3D.getWorldPosition(_p); grab = {R, d: Math.max(0.4, _p.distanceTo(S.el.object3D.position))}; });
    R.addEventListener('gripup', () => { grab = null; }); }
  AFRAME.registerSystem('jf-diareader', { tick: function () { if (!grab || !S.el) return; const o = S.el.object3D; grab.R.object3D.getWorldPosition(_p); grab.R.object3D.getWorldQuaternion(_q);
    _f.set(0, 0, -1).applyQuaternion(_q); o.position.copy(_p).addScaledVector(_f, grab.d); face(o); } });
  function close() { if (S.el) S.el.object3D.visible = false; S.rows.forEach(r => r.classList.remove('btn')); const m = document.getElementById('diamodal'); if (m) m.style.display = 'none'; S.open = false; grab = null;
    document.querySelectorAll('[raycaster]').forEach(r => r.components.raycaster && r.components.raycaster.refreshObjects()); }
  /* ---------- desktop / phone overlay ---------- */
  function render2D() { const m = document.getElementById('diamodal'); if (!m || m.style.display === 'none') return; const body = m.querySelector('.db'), sel = m.querySelector('select');
    body.style.fontSize = Math.round(S.font * 0.3) + 'px'; m.querySelector('.fs').textContent = Math.round(S.font * 0.3) + ' px';
    if (S.mode !== 'paper' || !S.doc) { if (S.mode === 'paper') { body.textContent = 'Loading DIRD ' + S.n + '...'; return; } body.innerHTML = ''; sel.style.display = 'none';
      (S.idx || []).forEach(d => { const b = document.createElement('button'); b.type = 'button'; b.className = 'it'; b.innerHTML = '<b>DIRD ' + d.n + '</b> \u2013 '; b.appendChild(document.createTextNode(d.title + '  (' + d.date + ', ' + d.pages + ' pages)')); b.onclick = () => openPaper(d.n); body.appendChild(b); }); return; }
    if (body.dataset.n === String(S.n) && body.dataset.f === String(S.font)) return; body.dataset.n = S.n; body.dataset.f = S.font; body.innerHTML = ''; sel.innerHTML = '<option value="">Sections...</option>'; sel.style.display = '';
    let h = 0; for (const b of S.doc) { const el = document.createElement(b.k === 'h1' ? 'h2' : b.k === 'h2' ? 'h3' : 'p'); el.textContent = b.t; if (b.k === 'meta') el.className = 'mt'; if (b.k === 'pg') el.className = 'pg';
      if (b.k === 'h2') { el.id = 'dsec' + h; const o = document.createElement('option'); o.value = el.id; o.textContent = b.t.slice(0, 60); sel.appendChild(o); h++; } body.appendChild(el); }
    body.scrollTop = 0; }
  function open2D() { let m = document.getElementById('diamodal');
    if (!m) { m = document.createElement('div'); m.id = 'diamodal';
      m.innerHTML = '<style>#diamodal{position:fixed;inset:0;z-index:81;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif}' +
        '#diamodal .dw{background:#0d141b;color:#f2f2f2;border:3px solid #FFD700;border-radius:14px;width:min(960px,96vw);height:90vh;display:flex;flex-direction:column}' +
        '#diamodal .dh{display:flex;align-items:center;gap:6px;padding:10px 12px;border-bottom:1px solid #3a3320;flex-wrap:wrap}#diamodal .dh b{color:#FFD700;font-size:19px;flex:1;min-width:140px}' +
        '#diamodal button{font-size:16px;padding:8px 12px;border-radius:8px;border:0;background:#c9a24a;color:#111;cursor:pointer}#diamodal .x{background:#ff8a80}#diamodal select{font-size:16px;padding:7px;border-radius:8px;max-width:46vw}' +
        '#diamodal .fs{color:#9ffcff;font-size:14px}#diamodal .db{overflow:auto;padding:6px 20px 24px;line-height:1.5}#diamodal h2,#diamodal h3{color:#FFD700;margin:16px 0 6px}#diamodal .mt{color:#9ffcff;margin:2px 0}' +
        '#diamodal .pg{color:#c9b37a;font-style:italic;text-align:center}#diamodal .it{display:block;width:100%;text-align:left;margin:6px 0;background:#132430;color:#f2f2f2;font-size:1em}#diamodal .it b{color:#FFD700}</style>' +
        '<div class="dw"><div class="dh"><b>DIA Papers \u2013 the 37 DIRDs</b><button type="button" class="ct">Contents</button><select></select><button type="button" class="am">A-</button><span class="fs"></span><button type="button" class="ap">A+</button><button type="button" class="x">Close</button></div><div class="db">Loading...</div></div>';
      document.body.appendChild(m); m.addEventListener('click', ev => { if (ev.target === m) close(); }); m.querySelector('.x').onclick = close; m.querySelector('.ct').onclick = () => { m.querySelector('.db').dataset.n = ''; contents(); };
      m.querySelector('.am').onclick = () => size(-8); m.querySelector('.ap').onclick = () => size(8);
      m.querySelector('select').onchange = ev => { const t = ev.target.value && document.getElementById(ev.target.value); if (t) t.scrollIntoView({block: 'start'}); ev.target.value = ''; }; }
    m.style.display = 'flex'; build(); m.querySelector('.db').dataset.n = ''; if (S.mode === 'paper' && S.doc) render2D(); else contents(); }
  function open() { S.open = true; hookGrip(); if (window.JFVR && JFVR.hud) JFVR.hud('DIA Papers - you stay in Fowling Pond'); if (inXR()) openVR(); else open2D(); }
  window.JFVR_diaReader = {open, close, openVR, open2D, openPaper, state: () => ({mode: S.mode, n: S.n, page: S.page, pages: S.pages.length, font: S.font, items: (S.idx || []).length, first: S.idx && S.idx[0] && S.idx[0].n, secs: S.secs.length, vr: !!(S.el && S.el.object3D.visible)})};
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && S.open) close(); });
  const sc = document.querySelector('a-scene'); if (sc) sc.addEventListener('exit-vr', () => { if (S.el) S.el.object3D.visible = false; grab = null; });
  // 2D menu: Other worlds tab (and Settings > More as a second home)
  function menu() { const host = document.getElementById('worlds-links'); if (!host || document.getElementById('diabtn')) return; const b = document.createElement('button'); b.id = 'diabtn'; b.type = 'button'; b.textContent = 'DIA Papers (37 DIRDs reader)'; b.onclick = open; host.appendChild(b); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', menu); else menu();
})();
