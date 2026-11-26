/* Tesseract reader (Josh, Nov 26): the Tesseract sign on the bank terrace and the menu's Tesseract button no longer take you out of
   Fowling Pond. They open a reading screen in the world instead.
   - In the headset: a large floating screen ~1.6 m in front of you, laser-clickable (section buttons, Prev / Next page, Close). The
     whole screen stops the laser (data-blocker backing; see vrpointer.js).
   - Desktop / phone: an in-page overlay with the same text, plus a small 'Open the full site' link (2D only).
   Text is read live from the public Tesseract site (CORS is open); if that fails a short built-in summary is shown. Plain text only -
   no Tesseract artwork or branding is copied or changed. The full Tesseract lab room is a separate (Saturday) build. */
(function () {
  'use strict';
  const SITE = 'https://tesseractprogram.pages.dev/';
  const SECTIONS = [['home', 'Home', ''], ['dirds', 'DIRDs', 'dirds/'], ['research', 'Research', 'research/'], ['aawsap', 'AAWSAP', 'aawsap/'],
    ['construction', 'Construction', 'construction/'], ['claims', 'Claims', 'claims/'], ['episodes', 'Episodes', 'episodes/'], ['host', 'Hosts', 'host/']];
  const FALLBACK = {
    home: ['Tesseract Program', 'A podcast and research site about UAP, advanced propulsion and the people who study them. Episodes, research notes, the DIRDs papers, AAWSAP history and claim reviews.'],
    dirds: ['The DIRDs', 'Defense Intelligence Reference Documents: 37 released papers written for AAWSAP on propulsion, power, materials, the far edge of physics and the human side of future flight.'],
    research: ['Research', 'Background notes and sources gathered for the show, grouped by topic.'],
    aawsap: ['AAWSAP', 'The Advanced Aerospace Weapon System Applications Program - the Pentagon-funded study that produced the DIRDs.'],
    construction: ['Construction', 'Notes on building and engineering topics discussed on the program.'],
    claims: ['Claims', 'Claims made in public about UAP and advanced technology, with what supports or undercuts each one.'],
    episodes: ['Episodes', 'All episodes of the Tesseract Program, with guests and short summaries.'],
    host: ['Hosts', 'The people behind the Tesseract Program.']
  };
  const cache = {};
  function textOf(el) { const BL = /^(DIV|P|H[1-6]|SMALL|TIME|SPAN|STRONG|EM|B)$/;
    let out = ''; el.childNodes.forEach(n => { if (n.nodeType === 3) out += n.textContent; else if (n.nodeType === 1) { const t = textOf(n); if (!t) return; out += (out && BL.test(n.tagName) && !/\s$/.test(out) ? ' - ' : ' ') + t; } });
    return out.replace(/\s+/g, ' ').replace(/ - - /g, ' - ').trim(); }
  async function load(id) {
    if (cache[id]) return cache[id]; const sec = SECTIONS.find(s => s[0] === id) || SECTIONS[0];
    try {
      const r = await fetch(SITE + sec[2], {mode: 'cors'}); if (!r.ok) throw new Error(r.status);
      const doc = new DOMParser().parseFromString(await r.text(), 'text/html');
      doc.querySelectorAll('script,style,nav,footer,header,noscript,svg,form').forEach(e => e.remove());
      const blocks = []; const seen = new Set();
      doc.body.querySelectorAll('h1,h2,h3,p,li').forEach(e => { if (e.tagName === 'LI' && e.querySelector('li,ul,ol')) return; if (e.closest('li') && e.tagName !== 'LI') return;
        let t = textOf(e); if (!t || t.length < 3 || seen.has(t)) return; seen.add(t); if (t.length > 700) t = t.slice(0, 700) + '...';
        blocks.push({h: /^H/.test(e.tagName) ? +e.tagName[1] : 0, li: e.tagName === 'LI', t}); });
      if (blocks.length < 2) throw new Error('empty');
      return (cache[id] = {title: sec[1], blocks, live: true});
    } catch (e) { const f = FALLBACK[id] || FALLBACK.home; return (cache[id] = {title: sec[1], blocks: [{h: 1, t: f[0]}, {h: 0, t: f[1]}, {h: 0, t: '(Built-in summary - the live site could not be reached.)'}], live: false}); }
  }
  /* ---------- paging onto a canvas ---------- */
  const CW = 1280, CH = 880, PAD = 44, BODY = '33px Arial, sans-serif', LH = 43;
  function wrap(g, t, w) { const words = t.split(' '), lines = []; let cur = ''; for (const wd of words) { const n = cur ? cur + ' ' + wd : wd; if (g.measureText(n).width > w && cur) { lines.push(cur); cur = wd; } else cur = n; } if (cur) lines.push(cur); return lines; }
  function paginate(g, data) { const pages = [[]]; let y = 0; const maxY = CH - 2 * PAD - 150;
    for (const b of data.blocks) { const font = b.h === 1 ? 'bold 44px Arial, sans-serif' : b.h ? 'bold 37px Arial, sans-serif' : BODY, lh = b.h === 1 ? 54 : b.h ? 48 : LH; g.font = font;
      const ls = wrap(g, (b.li ? '\u2022 ' : '') + b.t, CW - 2 * PAD - (b.li ? 20 : 0)); const gap = b.h ? 14 : 10;
      ls.forEach((l, i) => { if (y + lh > maxY) { pages.push([]); y = 0; } pages[pages.length - 1].push({l, font, lh, x: PAD + (b.li && i ? 26 : 0), y: y + lh, col: b.h ? '#FFD700' : '#f2f2f2'}); y += lh; }); y += gap; }
    return pages.length > 60 ? pages.slice(0, 60) : pages; }
  /* ---------- in-world panel (headset) ---------- */
  const S = {sec: 'home', page: 0, pages: [[]], data: null, el: null, tex: null, ctx: null, label: null};
  function draw() { const g = S.ctx; if (!g) return; g.fillStyle = '#0d141b'; g.fillRect(0, 0, CW, CH); g.strokeStyle = '#FFD700'; g.lineWidth = 6; g.strokeRect(3, 3, CW - 6, CH - 6);
    g.fillStyle = '#FFD700'; g.font = 'bold 30px Arial, sans-serif'; g.textBaseline = 'alphabetic'; g.textAlign = 'left'; g.fillText('TESSERACT PROGRAM  -  ' + (S.data ? S.data.title : 'Loading...'), PAD, 150 - 96);
    g.fillStyle = '#9ffcff'; g.font = '22px Arial, sans-serif'; g.textAlign = 'right'; g.fillText(S.data ? (S.data.live ? 'From tesseractprogram.pages.dev' : 'Built-in summary') : '', CW - PAD, 54); g.textAlign = 'left';
    const pg = S.pages[S.page] || []; for (const r of pg) { g.font = r.font; g.fillStyle = r.col; g.fillText(r.l, r.x, 96 + r.y); }
    S.tex.needsUpdate = true; if (S.label) S.label.setAttribute('value', 'Page ' + (S.page + 1) + ' / ' + S.pages.length); }
  async function show(sec) { S.sec = sec; S.page = 0; S.data = null; S.pages = [[]]; draw(); renderTabs();
    const d = await load(sec); if (S.sec !== sec) return; S.data = d; S.pages = paginate(S.ctx, d); draw(); render2D(); }
  function btn(parent, label, x, y, w, h, color, fn, tw) { const p = document.createElement('a-plane'); p.className = 'btn'; p.setAttribute('width', w); p.setAttribute('height', h); p.setAttribute('position', x + ' ' + y + ' 0.01');
    p.setAttribute('material', 'shader:flat;color:' + color); const t = document.createElement('a-text'); t.setAttribute('value', label); t.setAttribute('align', 'center'); t.setAttribute('color', '#111'); t.setAttribute('width', tw || 1.4); t.setAttribute('position', '0 0 0.004');
    p.appendChild(t); p.addEventListener('click', ev => { ev.stopPropagation && ev.stopPropagation(); fn(); }); parent.appendChild(p); return p; }
  function renderTabs() { if (!S.el) return; S.el.querySelectorAll('[data-sec]').forEach(p => p.setAttribute('material', 'color', p.dataset.sec === S.sec ? '#ffffff' : '#c9a24a')); }
  function build() { if (S.el) return S.el; const sc = document.querySelector('a-scene'); const e = S.el = document.createElement('a-entity'); e.id = 'tesseract-reader'; e.setAttribute('visible', false); sc.appendChild(e);
    const c = document.createElement('canvas'); c.width = CW; c.height = CH; S.ctx = c.getContext('2d'); S.tex = new THREE.CanvasTexture(c); S.tex.colorSpace = THREE.SRGBColorSpace; S.tex.anisotropy = 4;
    const W = 1.9, H = W * CH / CW; const m = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({map: S.tex, toneMapped: false, fog: false}));
    e.object3D.add(m);
    const back = document.createElement('a-plane'); back.className = 'btn'; back.dataset.blocker = '1'; back.setAttribute('width', W + 0.1); back.setAttribute('height', H + 0.42); back.setAttribute('position', '0 0.02 -0.01');
    back.setAttribute('material', 'shader:flat;color:#0b1d26;side:double'); e.appendChild(back);
    SECTIONS.forEach(([id, label], i) => { const p = btn(e, label, ((i - 3.5) * 0.235).toFixed(3), (H / 2 + 0.1).toFixed(3), 0.225, 0.12, '#c9a24a', () => show(id), 1.0); p.dataset.sec = id; });
    const by = -(H / 2 + 0.09);
    btn(e, '< Prev page', -0.62, by, 0.42, 0.12, '#FFD700', () => { if (S.page > 0) { S.page--; draw(); } }, 1.1);
    btn(e, 'Next page >', 0.12, by, 0.42, 0.12, '#FFD700', () => { if (S.page < S.pages.length - 1) { S.page++; draw(); } }, 1.1);
    btn(e, 'Close', 0.72, by, 0.3, 0.12, '#ff8a80', close, 1.1);
    const lb = S.label = document.createElement('a-text'); lb.setAttribute('align', 'center'); lb.setAttribute('color', '#ffe9a8'); lb.setAttribute('width', 1.1); lb.setAttribute('position', '-0.25 ' + by + ' 0.01'); e.appendChild(lb);
    return e; }
  function inXR() { const sc = document.querySelector('a-scene'); return !!(sc && sc.renderer && sc.renderer.xr && sc.renderer.xr.isPresenting); }
  function openVR(sec) { const e = build(); const place = () => { if (window.JFVR && JFVR.placeInFront) { JFVR.placeInFront(e, 1.5, -0.08); e.object3D.rotation.x = 0; } e.setAttribute('visible', true); e.object3D.visible = true;
      document.querySelectorAll('[raycaster]').forEach(r => r.components.raycaster && r.components.raycaster.refreshObjects()); };
    if (e.hasLoaded) place(); else e.addEventListener('loaded', place, {once: true}); show(sec || S.sec || 'home'); }
  function close() { if (S.el) { S.el.setAttribute('visible', false); S.el.object3D.visible = false; } const m = document.getElementById('tessmodal'); if (m) m.style.display = 'none'; S.open = false; }
  /* ---------- desktop / phone overlay ---------- */
  function render2D() { const m = document.getElementById('tessmodal'); if (!m || m.style.display === 'none' || !S.data) return; const body = m.querySelector('.tb');
    body.innerHTML = ''; for (const b of S.data.blocks) { const el = document.createElement(b.h ? 'h' + Math.min(4, b.h + 1) : b.li ? 'li' : 'p'); el.textContent = b.t; body.appendChild(el); }
    if (!S.data.live) { const n = document.createElement('p'); n.style.opacity = '.7'; n.textContent = '(Built-in summary - the live site could not be reached.)'; body.appendChild(n); }
    m.querySelectorAll('[data-sec]').forEach(b => b.classList.toggle('cur', b.dataset.sec === S.sec)); body.scrollTop = 0; }
  function open2D(sec) { let m = document.getElementById('tessmodal');
    if (!m) { m = document.createElement('div'); m.id = 'tessmodal';
      m.innerHTML = '<style>#tessmodal{position:fixed;inset:0;z-index:80;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif}' +
        '#tessmodal .tw{background:#0d141b;color:#f2f2f2;border:3px solid #FFD700;border-radius:14px;width:min(920px,94vw);max-height:88vh;display:flex;flex-direction:column}' +
        '#tessmodal .th{display:flex;align-items:center;gap:8px;padding:10px 14px;border-bottom:1px solid #3a3320;flex-wrap:wrap}#tessmodal .th b{color:#FFD700;font-size:18px;flex:1}' +
        '#tessmodal .ts{display:flex;flex-wrap:wrap;gap:4px;padding:8px 12px}#tessmodal button{font-size:15px;padding:8px 12px;border-radius:8px;border:0;background:#c9a24a;color:#111;cursor:pointer}' +
        '#tessmodal button.cur{background:#fff}#tessmodal .tb{overflow:auto;padding:4px 20px 18px;font-size:17px;line-height:1.5}#tessmodal h2,#tessmodal h3,#tessmodal h4{color:#FFD700;margin:14px 0 6px}' +
        '#tessmodal a.full{color:#9ffcff;font-size:14px}#tessmodal .x{background:#ff8a80}</style>' +
        '<div class="tw"><div class="th"><b>Tesseract Program - reader</b><a class="full" href="' + SITE + '" target="_blank" rel="noopener">Open the full site &#8599;</a><button class="x" type="button">Close</button></div>' +
        '<div class="ts">' + SECTIONS.map(s => '<button type="button" data-sec="' + s[0] + '">' + s[1] + '</button>').join('') + '</div><div class="tb">Loading...</div></div>';
      document.body.appendChild(m); m.addEventListener('click', ev => { if (ev.target === m) close(); }); m.querySelector('.x').onclick = close;
      m.querySelectorAll('[data-sec]').forEach(b => b.onclick = () => { m.querySelector('.tb').textContent = 'Loading...'; show(b.dataset.sec); }); }
    m.style.display = 'flex'; build(); show(sec || S.sec || 'home'); }
  function open(sec) { S.open = true; if (window.JFVR && JFVR.hud) JFVR.hud('Tesseract reader - you stay in Fowling Pond'); if (inXR()) openVR(sec); else open2D(sec); }
  window.JFVR_tessReader = {open, close, load, state: () => ({sec: S.sec, page: S.page, pages: S.pages.length, live: S.data && S.data.live, vrVisible: !!(S.el && S.el.object3D && S.el.object3D.visible)}), openVR, open2D};
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && S.open) close(); });
  const sc = document.querySelector('a-scene'); if (sc) sc.addEventListener('exit-vr', () => { if (S.el) { S.el.setAttribute('visible', false); S.el.object3D.visible = false; } });
})();
