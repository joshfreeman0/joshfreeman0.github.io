/* Menu v2 (Josh, Nov 27: "way too many tabs, organize it better"). One structure on the 2D menu (desktop / phone) and the in-headset
   menu (left stick or Y):  Go to | People | Read | Settings.
   Go to has six sections - Fowling Pond, Bank compound, Rooms, Earth places, Space, Exhibits - collapsible on 2D, a row of section
   buttons in VR; Versailles' 11 spots sit behind one "Versailles" entry (2D sub-list, VR sub-page). Duplicates are gone (the Bank tab's
   copies of hall/vault/terrace, "Board the rocket" = Launch pad, "Fly over the pond" = Pond view, the World rooms picker = the Rooms
   section). The old "Home: Fowling Pond" fly-over is "Pond view" (H key); "Home" is the family house (staging's w:home).
   Other modules keep adding their buttons the way they always did (2D: '#ui .tools' and the old group ids, now kept in a hidden
   inbox; VR: '#vrbar'). This file files each one by key: known keys into their place, anything new into Settings > More.
   Hidden VR buttons are made invisible; vrpointer.js makes the lasers ignore invisible buttons. */
(function () {
  'use strict';
  const go = w => () => { if (typeof window.goWorld === 'function') window.goWorld(w); };
  const room = k => () => { const R = window.FP_WORLDROOMS; if (R && R.go) R.go(k); };
  const roomHome = () => { const R = window.FP_WORLDROOMS; if (R && R.home) R.home(); };
  const mars = () => { if (window.W3D && W3D.goMars) W3D.goMars(); else location.assign('/vr/mars/?spot=pad&from=joshfreeman-vr'); };
  const dia = () => { if (window.JFVR_diaReader) window.JFVR_diaReader.open(); else if (window.JFVR && JFVR.hud) JFVR.hud('DIA Papers reader is still loading'); };
  const fpc = () => window.FPC || window.FP_COMPANION;
  const EXH = [['planet', 'Planet Labs'], ['phreaklab', 'Phreak lab'], ['foresight', 'Foresight'], ['starmind', 'Starmind'], ['terafab', 'Terafab'],
    ['tesla', 'Tesla'], ['boring', 'Boring Loop'], ['solarcity', 'SolarCity']];
  const VERS = [['gardens', 'Gardens'], ['canal', 'Grand Canal'], ['trianon', 'Trianon'], ['town', 'Town'], ['mirrors', 'Hall of Mirrors'], ['bedroom', "King's bedroom"],
    ['apartments', 'State Apartments'], ['chapel', 'Chapel'], ['opera', 'Opera'], ['jeudepaume', 'Jeu de Paume']];
  const BOS = window.FP_BOSAREA || [], LDN = window.FP_LDNAREA || [];   // London sub-list (londonarea.js)   // Boston & area sub-list (bostonarea.js, loaded first)
  const ROOMS = [['nz', 'New Zealand'], ['australia', 'Australia'], ['samoa', 'Samoa'], ['hawaii', 'Hawaii'], ['royal', 'Royal Family']];
  const TABS = [['go', 'Go to'], ['people', 'People'], ['read', 'Read'], ['set', 'Settings']];
  const SECS = [['pond', 'Fowling Pond'], ['bank', 'Bank compound'], ['rooms', 'Rooms'], ['earth', 'Earth places'], ['space', 'Space'], ['exh', 'Exhibits']];
  const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };

  /* ---------------- 2D menu ---------------- */
  // key -> [container, order, new label]. Containers: gs-<section> (Go to), gs-vers (Versailles sub-list), pp, rd, st-move, st-look, st-more
  const P2 = {
    homebtn2d: ['gs-pond', 0], 'w:home': ['gs-pond', 1, 'Pond view (H)'], 'w:pyramid': ['gs-pond', 2], 'w:houseboat': ['gs-pond', 3], pharosbtn: ['gs-pond', 4],
    'w:terrace': ['gs-bank', 0], 'w:hall': ['gs-bank', 1], 'w:vault': ['gs-bank', 2], 'w:showcase': ['gs-bank', 3], 'w:office': ['gs-bank', 4], 'w:residence': ['gs-bank', 5],
    'w:guest': ['gs-bank', 6], 'w:conservatory': ['gs-bank', 7], 'w:propulsion': ['gs-bank', 8], 'w:ufo': ['gs-bank', 9],
    tessroomlink: ['gs-space', 5, 'Tesseract room'], ballroomlink: ['gs-rooms', 0], 'room:nz': ['gs-rooms', 1], 'room:australia': ['gs-rooms', 2], 'room:samoa': ['gs-rooms', 3],
    'room:hawaii': ['gs-rooms', 4], 'room:royal': ['gs-rooms', 5], 'wr-home2d': ['gs-rooms', 9, 'Leave room'],
    'w:raynham': ['gs-earth', 0], 'w:dunkin': ['gs-earth', 1], 'w:bridgewater': ['gs-earth', 2], 'w:aldensquare': ['gs-earth', 3], 'w:walker': ['gs-earth', 4], placesbtn: ['gs-earth', 9, 'Places (Real Earth)'],
    'w:versailles': ['gs-vers', 0, 'Château (front court)'],
    rplgo: ['gs-space', 0, 'Red Planet Lounge (Mars)'], 'w:launchpad': ['gs-space', 1, 'Launch pad'], 'w:rockets': ['gs-space', 2], 'w:starfleet': ['gs-space', 3], 'w:saucer': ['gs-space', 4],
    'w:founders': ['gs-exh', 0], 'w:hangar': ['gs-exh', 1, 'Drone Hangar (H18)'],
    friendsbtn: ['pp', 0], mpvoice: ['pp', 1], mpcount: ['pp', 2], voicerange: ['pp', 3], invitebtn: ['pp', 4], fpabtn: ['pp', 5], 'jf-fpc-come': ['pp', 6], 'jf-fpc-talk': ['pp', 7],
    diabtn: ['rd', 0, 'DIA Papers (37 DIRDs)'], tesseractlink: ['rd', 1, 'Tesseract Program'], bankledgerlink: ['rd', 2],
    speed: ['st-move', 0], reload: ['st-move', 1],
    tiltbtn: ['st-look', 0], skybtn: ['st-look', 1], nsndbtn: ['st-look', 2], watersoundbtn: ['st-look', 3], realearthbtn: ['st-look', 4], buildbtn: ['st-more', 0], helpbtn: ['st-more', 1, 'Help and credits']
  };
  VERS.forEach(([k], i) => { P2['w:versailles-' + k] = ['gs-vers', i + 1]; });
  BOS.forEach(([k], i) => { P2['w:bos-' + k] = ['gs-bos', i]; });
  LDN.forEach(([k], i) => { P2['w:ldn-' + k] = ['gs-ldn', i]; });
  EXH.forEach(([k], i) => { P2['w:' + k] = ['gs-exh', i + 2]; });
  const DROP2 = {'w:pond': 1};   // same spot as Pond view
  function key2D(e) { const d = e.dataset || {};
    if (d.room) return 'room:' + d.room; if (d.w) return 'w:' + d.w; if (d.speed) return 'speed'; if (d.reload) return 'reload'; return e.id || ''; }
  const CSS2 = `#ui .jf-sec{margin:4px 0;border:1px solid rgba(201,162,74,.45);border-radius:10px;background:rgba(40,34,18,.55);text-align:left}
#ui .jf-sec>summary{list-style:none;cursor:pointer;padding:11px 14px;font-size:16px;font-weight:700;color:#ffe9a8;min-height:22px;-webkit-user-select:none;user-select:none}
#ui .jf-sec>summary::-webkit-details-marker{display:none}
#ui .jf-sec>summary::before{content:'\\25B8';display:inline-block;width:1.1em;transition:transform .15s}
#ui .jf-sec[open]>summary::before{transform:rotate(90deg)}
#ui .jf-sec>summary .n{opacity:.6;font-weight:400;font-size:13px;margin-left:6px}
#ui .jf-body{display:flex;flex-wrap:wrap;gap:2px;padding:0 6px 8px;justify-content:flex-start}
#ui .jf-sub{flex-basis:100%;background:rgba(0,0,0,.25)}
#ui .jf-body a{display:inline-block;font-size:15px;margin:3px;padding:8px 12px;border-radius:8px;background:#FFD700;color:#111;text-decoration:none}
#ui .jf-body>span:not(.sec){align-self:center;margin:3px 6px;color:#ffe9a8}
#ui .jf-grp{text-align:left;margin:4px 0}
#ui .jf-grp .jf-body{padding:0 0 4px}
#ui .pane{max-width:980px;margin-left:auto;margin-right:auto}
#jf-inbox{display:none!important}
#ui #tabbar button.mini{min-height:40px}
@media (pointer:coarse){#ui .pane button,#ui .jf-body a{min-height:42px;box-sizing:border-box;vertical-align:middle}#ui .jf-body a{display:inline-flex;align-items:center}}
@media (max-width:600px){#ui .jf-sec>summary{padding:12px 12px;font-size:16px}#ui .jf-body a{font-size:14px;padding:9px 11px}}`;
  function el(tag, attrs, html) { const e = document.createElement(tag); for (const k in attrs || {}) e.setAttribute(k, attrs[k]); if (html) e.innerHTML = html; return e; }
  function body(id) { const b = document.getElementById(id); return b && (b.classList.contains('jf-body') ? b : b.querySelector('.jf-body')); }
  function build2D(ui) {
    if (!document.getElementById('jf-menu-css')) document.head.appendChild(el('style', {id: 'jf-menu-css'}, CSS2));
    const inbox = el('div', {id: 'jf-inbox'}); ui.appendChild(inbox);
    // the old panes' groups (and their ids, which other modules look up) live on in the hidden inbox
    ui.querySelectorAll('.pane').forEach(p => { [...p.children].forEach(c => inbox.appendChild(c)); p.remove(); });
    const hb = document.getElementById('helpbtn'); if (hb) inbox.appendChild(hb);   // Help and credits now lives in Settings > More (tab row: 4 tabs + Hide)
    const tb = document.getElementById('tabbar'); tb.querySelectorAll('.tab').forEach(t => t.remove());
    const first = tb.firstChild; TABS.forEach(([k, l]) => { const b = el('button', {class: 'tab', 'data-tab': k, type: 'button'}); b.textContent = l; tb.insertBefore(b, first); });
    const note = document.getElementById('note'), mkPane = k => { const p = el('div', {class: 'pane', id: 'pane-' + k}); ui.insertBefore(p, note || inbox); return p; };
    const open = (lsGet('jfvr_sec2d') || (window.innerWidth >= 900 ? 'pond' : '')).split(',');
    const pg = mkPane('go');
    SECS.forEach(([k, l]) => { const d = el('details', {class: 'jf-sec', id: 'gs-' + k}); if (open.includes(k)) d.open = true;
      d.appendChild(el('summary', {}, l + '<span class="n"></span>')); d.appendChild(el('div', {class: 'jf-body'})); pg.appendChild(d);
      d.addEventListener('toggle', () => { if (d.open) SECS.forEach(([s2]) => { const x = document.getElementById('gs-' + s2); if (x && x !== d && x.open) x.open = false; });   // one section open at a time: short list, little scrolling
        const o = SECS.map(s => s[0]).filter(s => { const x = document.getElementById('gs-' + s); return x && x.open; }); lsSet('jfvr_sec2d', o.join(',')); }); });
    const vs = el('details', {class: 'jf-sec jf-sub', id: 'gs-vers'}); vs.appendChild(el('summary', {}, 'Versailles<span class="n"></span>')); vs.appendChild(el('div', {class: 'jf-body'}));
    vs.style.order = 6; body('gs-earth').appendChild(vs);
    if (BOS.length) { const bs = el('details', {class: 'jf-sec jf-sub', id: 'gs-bos'}); bs.appendChild(el('summary', {}, 'Boston &amp; area<span class="n"></span>')); bs.appendChild(el('div', {class: 'jf-body'}));
      bs.style.order = 7; body('gs-earth').appendChild(bs); }
    if (LDN.length) { const ls = el('details', {class: 'jf-sec jf-sub', id: 'gs-ldn'}); ls.appendChild(el('summary', {}, 'London<span class="n"></span>')); ls.appendChild(el('div', {class: 'jf-body'}));
      ls.style.order = 8; body('gs-earth').appendChild(ls); }
    const grp = (pane, id, l) => { const g = el('div', {class: 'jf-grp', id}); g.appendChild(el('span', {class: 'sec'}, l)); g.appendChild(el('div', {class: 'jf-body'})); pane.appendChild(g); };
    grp(mkPane('people'), 'pp', 'People, voice and account');
    grp(mkPane('read'), 'rd', 'Read in the world');
    const ps = mkPane('set'); grp(ps, 'st-move', 'Moving'); grp(ps, 'st-look', 'Sky, sound and view'); grp(ps, 'st-more', 'More');
    // entries that had no 2D button before
    const mk = (id, label, fn, w, box) => { if (document.getElementById(id)) return; const b = el('button', {id, type: 'button'}); if (w) b.dataset.w = w; b.textContent = label;
      b.addEventListener('click', ev => { ev.stopPropagation(); fn(); }); inbox.appendChild(b); };
    EXH.forEach(([k, l]) => mk('jf-x-' + k, l, go(k), k));
    BOS.forEach(([k, l]) => mk('jf-b-' + k, l, go('bos-' + k), 'bos-' + k));
    LDN.forEach(([k, l]) => mk('jf-l-' + k, l, go('ldn-' + k), 'ldn-' + k));
  }
  function companion2D() { const A = fpc(); const inbox = document.getElementById('jf-inbox'); if (!A || !inbox || document.getElementById('jf-fpc-come')) return;
    const mk = (id, label, fn) => { const b = el('button', {id, type: 'button'}); b.textContent = label; b.style.background = '#ffd9a0'; b.addEventListener('click', ev => { ev.stopPropagation(); fn(); }); inbox.appendChild(b); };
    mk('jf-fpc-come', 'Companion: come here', () => { const a = fpc(); a && a.comeHere && a.comeHere(); });
    mk('jf-fpc-talk', 'Talk to companion', () => { const a = fpc(); a && a.listen && a.listen(); }); }
  function sort2D() {
    const ui = document.getElementById('ui'), inbox = document.getElementById('jf-inbox'); if (!ui || !inbox) return;
    companion2D();
    // anything another module dropped straight into a pane (e.g. a whole new group) goes to the inbox to be filed
    ui.querySelectorAll('.pane').forEach(p => [...p.children].forEach(c => { if (!c.classList.contains('jf-sec') && !c.classList.contains('jf-grp')) inbox.appendChild(c); }));
    const seen = {};
    [...ui.querySelectorAll('button, a, span#mpcount')].forEach(e => {
      if (e.closest('#tabbar') || e.closest('summary')) return;
      const k = key2D(e); if (!k) return;
      const pl = P2[k];
      if (DROP2[k] || (seen[k] && seen[k] !== e)) { if (e.parentNode !== inbox) inbox.appendChild(e); return; }
      seen[k] = e;
      const box = body(pl ? pl[0] : 'st-more'); if (!box) return;
      if (e.parentNode !== box) box.appendChild(e);
      const o = String(pl ? pl[1] : 50); if (e.style.order !== o) e.style.order = o;
      if (pl && pl[2] && !e.dataset.jfl) { e.dataset.jfl = 1; e.textContent = pl[2]; }
    });
    ui.querySelectorAll('.jf-sec').forEach(d => { const n = d.querySelectorAll(':scope > .jf-body > button, :scope > .jf-body > a').length + (d.id === 'gs-earth' ? 1 + (BOS.length ? 1 : 0) + (LDN.length ? 1 : 0) : 0); const s = d.querySelector(':scope > summary .n'); if (s && s.textContent !== String(n)) s.textContent = String(n); });
    const more = document.getElementById('st-more'); if (more) more.style.display = body('st-more').children.length ? '' : 'none';
  }
  function setTab2D(t) { const ui = document.getElementById('ui'); if (!ui) return;
    if (!TABS.some(x => x[0] === t)) t = '';
    const cur = ui.dataset.tab === t ? '' : t; ui.dataset.tab = cur;   // clicking the open tab closes it again (clean screen)
    ui.querySelectorAll('#tabbar .tab').forEach(b => b.classList.toggle('cur', b.dataset.tab === cur));
    ui.querySelectorAll('.pane').forEach(p => p.classList.toggle('cur', p.id === 'pane-' + cur));
    lsSet('jfvr_tab2d', cur); }
  function init2D() {
    const ui = document.getElementById('ui'); if (!ui || ui._tabs) return; ui._tabs = 1;
    build2D(ui);
    ui.querySelectorAll('#tabbar .tab').forEach(b => b.addEventListener('click', ev => { ev.stopPropagation(); setTab2D(b.dataset.tab); }));
    const rg = document.getElementById('rplgo'); if (rg) rg.addEventListener('click', mars);
    let start = lsGet('jfvr_tab2d') || ''; if (!TABS.some(x => x[0] === start)) start = '';
    if (!start && window.innerWidth >= 900) start = 'go';   // desktop opens on Go to; phones start with only the tab row (more world on screen)
    sort2D(); if (start) setTab2D(start);
    new MutationObserver(() => { clearTimeout(ui._st); ui._st = setTimeout(sort2D, 60); }).observe(ui, {childList: true, subtree: true});
    setInterval(companion2D, 3000);
  }
  window.JFVR_setTab2D = setTab2D;
  window.JFVR_openSec2D = (s, on) => { const d = document.getElementById('gs-' + s); if (d) d.open = on !== false; };

  /* ---------------- VR menu ---------------- */
  const PV = {   // key -> [tab or go-section, order, short label]
    'w:home': ['pond', 0, 'Home'], 'w:pondview': ['pond', 1, 'Pond view'], 'w:pyramid': ['pond', 2, 'Pyramid park'], 'w:houseboat': ['pond', 3, 'Houseboat'], pharosvr: ['pond', 4],
    'w:terrace': ['bank', 0], 'w:hall': ['bank', 1], 'w:vault': ['bank', 2], 'w:showcase': ['bank', 3, 'Wampum showcase'], 'w:office': ['bank', 4], 'jfv-residence': ['bank', 5],
    'jfv-guest': ['bank', 6], 'w:conservatory': ['bank', 7], 'w:propulsion': ['bank', 8], 'w:ufo': ['bank', 9],
    'jfv-ballroom': ['rooms', 0], 'jfv-room-nz': ['rooms', 1], 'jfv-room-australia': ['rooms', 2], 'jfv-room-samoa': ['rooms', 3], 'jfv-room-hawaii': ['rooms', 4], 'jfv-room-royal': ['rooms', 5], 'jfv-room-back': ['rooms', 9],
    raynhamvr: ['earth', 0, 'Raynham Center'], dunkinvr: ['earth', 1, "Dunkin'"], 'w:bridgewater': ['earth', 2, 'Corporate Base'], 'w:aldensquare': ['earth', 3, 'Alden Square'], 'w:walker': ['earth', 4, 'Walker Memorial'],
    'jfv-vers-open': ['earth', 5], 'jfv-bos-open': ['earth', 6], 'jfv-ldn-open': ['earth', 7], placesvr: ['earth', 9], 'jfv-bos-back': ['bos', 0], 'jfv-ldn-back': ['ldn', 0],
    'jfv-vers-back': ['vers', 0], 'w:versailles': ['vers', 1, 'Château'], 'w:versailles-mirrors': ['vers', 6, 'Hall of Mirrors'],
    'jfv-rplgo': ['space', 0], 'w:launchpad': ['space', 1, 'Launch pad'], 'w:rockets': ['space', 2, 'Rocket yard'], 'w:starfleet': ['space', 3, 'Star Fleet base'], 'w:saucer': ['space', 4], 'jfv-tessroom': ['space', 5],
    'w:founders': ['exh', 0, 'Founders Hall'], 'w:hangar': ['exh', 1, 'Drone Hangar (H18)'],
    mpvrvoice: ['people', 0], mpvrcount: ['people', 1], invite: ['people', 2], 'jfv-fpc-come': ['people', 3], 'jfv-fpc-talk': ['people', 4],
    'jfv-dia': ['read', 0], tesseractvr: ['read', 1, 'Tesseract reader'], bankledgervr: ['read', 2, 'Bank Ledger'],
    speed: ['set', 0], fly: ['set', 1], reload: ['set', 2], skylabel: ['set', 3], nsndlabel: ['set', 4], realearthvr: ['set', 5], buildvrbtn: ['set', 6]
  };
  VERS.forEach(([k], i) => { if (k !== 'mirrors') PV['jfv-v-' + k] = ['vers', i + 2]; });
  EXH.forEach(([k], i) => { PV['jfv-x-' + k] = ['exh', i + 2]; });
  BOS.forEach(([k], i) => { PV['jfv-b-' + k] = ['bos', i + 1]; });
  LDN.forEach(([k], i) => { PV['jfv-l-' + k] = ['ldn', i + 1]; });
  const DROPV = {'w:pond': 1, 'jfv-worldrooms': 1, 'jfv-rplpad': 1, 'jfv-bhall': 1, 'jfv-bvault': 1, 'jfv-bterrace': 1};
  const SECV = SECS.map(s => s[0]).concat('vers', 'bos', 'ldn'), TABOF = k => SECV.includes(k) ? 'go' : k;
  const COLS = 4, BW = 1.3, BH = 0.26, DX = 1.4, DY = 0.31, TXW = 2.0;
  let tabVR = 'go', secVR = 'pond';
  function keyOf(e) { if (e.id) return e.id; const d = e.dataset || {};
    if (d.w) return d.w === 'home' ? 'w:pondview' : 'w:' + d.w; if (d.speed) return 'speed'; if (d.reload) return 'reload'; if (d.invite) return 'invite';
    if (e.hasAttribute && e.hasAttribute('fly-toggle')) return 'fly';
    const t = e.querySelector && e.querySelector('a-text[id]'); if (t) return t.id; return ''; }
  function plane(bar, id, label, color, fn, w, h) {
    const p = document.createElement('a-plane'); p.id = id; p.className = 'btn';
    p.setAttribute('width', w || BW); p.setAttribute('height', h || BH); p.setAttribute('material', 'shader:flat;color:' + color);
    const t = document.createElement('a-text'); t.setAttribute('value', label); t.setAttribute('align', 'center'); t.setAttribute('color', '#111'); t.setAttribute('width', TXW); t.setAttribute('position', '0 0 0.005');
    p.appendChild(t); p.addEventListener('click', fn); bar.appendChild(p); return p; }
  function mkBtn(bar, id, label, color, fn) { if (!document.getElementById(id)) plane(bar, id, label, color, fn); }
  function extras(bar) {
    mkBtn(bar, 'jfv-residence', "Josh's residence", '#FFD700', go('residence'));
    mkBtn(bar, 'jfv-guest', 'Guest apartment', '#FFD700', go('guest'));
    mkBtn(bar, 'jfv-rplgo', 'Red Planet Lounge', '#ff9a6b', mars);
    mkBtn(bar, 'jfv-tessroom', 'Tesseract room', '#b9a6ff', go('tesseract'));
    ROOMS.forEach(([k, l]) => mkBtn(bar, 'jfv-room-' + k, l, '#7fe0a8', room(k)));
    mkBtn(bar, 'jfv-room-back', 'Leave room', '#9ffcff', roomHome);
    mkBtn(bar, 'jfv-vers-open', 'Versailles  >', '#FFD700', () => { secVR = 'vers'; layoutVR(); });
    mkBtn(bar, 'jfv-vers-back', '<  Earth places', '#c9a24a', () => { secVR = 'earth'; layoutVR(); });
    VERS.forEach(([k, l]) => { if (k !== 'mirrors') mkBtn(bar, 'jfv-v-' + k, l, '#FFD700', go('versailles-' + k)); });
    if (BOS.length) { mkBtn(bar, 'jfv-bos-open', 'Boston & area  >', '#9fe3ff', () => { secVR = 'bos'; layoutVR(); });
      mkBtn(bar, 'jfv-bos-back', '<  Earth places', '#c9a24a', () => { secVR = 'earth'; layoutVR(); });
      BOS.forEach(([k, l]) => mkBtn(bar, 'jfv-b-' + k, l, '#9fe3ff', go('bos-' + k))); }
    if (LDN.length) { mkBtn(bar, 'jfv-ldn-open', 'London  >', '#ffc6a8', () => { secVR = 'ldn'; layoutVR(); });
      mkBtn(bar, 'jfv-ldn-back', '<  Earth places', '#c9a24a', () => { secVR = 'earth'; layoutVR(); });
      LDN.forEach(([k, l]) => mkBtn(bar, 'jfv-l-' + k, l, '#ffc6a8', go('ldn-' + k))); }
    EXH.forEach(([k, l]) => mkBtn(bar, 'jfv-x-' + k, l, '#FFD700', go(k)));
    mkBtn(bar, 'jfv-dia', 'DIA Papers (37)', '#FFD700', dia);
    if (fpc() && !document.getElementById('jfv-fpc-come')) {
      mkBtn(bar, 'jfv-fpc-come', 'Companion: come', '#ffd9a0', () => { const a = fpc(); a && a.comeHere && a.comeHere(); });
      mkBtn(bar, 'jfv-fpc-talk', 'Talk to companion', '#ffd9a0', () => { const a = fpc(); a && a.listen && a.listen(); }); }
    if (!document.getElementById('jfv-title')) { const t = document.createElement('a-text'); t.id = 'jfv-title'; t.setAttribute('value', 'FOWLING POND MENU'); t.setAttribute('align', 'center');
      t.setAttribute('color', '#FFD700'); t.setAttribute('width', 3); t.setAttribute('position', '0 1.25 0'); bar.appendChild(t); }
    if (!document.getElementById('jfv-hint')) { const t = document.createElement('a-text'); t.id = 'jfv-hint'; t.setAttribute('value', 'Left stick or Y hides the menu.'); t.setAttribute('align', 'center');
      t.setAttribute('color', '#ffe9a8'); t.setAttribute('width', 2.6); bar.appendChild(t); }
    TABS.forEach(([k, l], i) => { if (!document.getElementById('jfv-tab-' + k)) { const p = plane(bar, 'jfv-tab-' + k, l, '#c9a24a', () => { tabVR = k; layoutVR(); }, 1.3, 0.32); p.dataset.vtab = k;
      p.querySelector('a-text').setAttribute('width', 2.6); p.setAttribute('position', ((i - 1.5) * DX).toFixed(2) + ' 0.95 0'); } });
    SECS.forEach(([k, l], i) => { if (!document.getElementById('jfv-sec-' + k)) { const p = plane(bar, 'jfv-sec-' + k, l, '#8a7440', () => { secVR = k; layoutVR(); }, 0.88, 0.26);
      p.dataset.vsec = k; p.querySelector('a-text').setAttribute('width', 2.0); p.setAttribute('position', ((i - 2.5) * 0.93).toFixed(2) + ' 0.6 0'); } });
  }
  const STRUCT = /^jfv-(tab-|sec-|title|hint|bg)/;
  function layoutVR() {
    const bar = document.getElementById('vrbar'); if (!bar) return; extras(bar);
    const old = bar.querySelector(':scope > a-text:not([id])'); if (old && /3D WORLD/.test(old.getAttribute('value') || '')) old.setAttribute('visible', false);
    const items = [...bar.children].filter(e => !STRUCT.test(e.id || '') && e !== old);
    const want = tabVR === 'go' ? secVR : tabVR, list = [], seen = {};
    items.forEach(e => { const k = keyOf(e), r = PV[k], dest = DROPV[k] || seen[k] ? null : (r ? r[0] : 'set'); if (k) seen[k] = 1;
      const on = dest === want; e.setAttribute('visible', on); if (e.object3D) e.object3D.visible = on;
      if (on) list.push([r ? r[1] : 50, e, k]); });
    list.sort((a, b) => a[0] - b[0]);
    const y0 = tabVR === 'go' ? 0.27 : 0.55; let rows = 0;
    list.forEach(([, e, k], i) => { const col = i % COLS, row = Math.floor(i / COLS); rows = Math.max(rows, row + 1);
      e.setAttribute('position', ((col - (COLS - 1) / 2) * DX).toFixed(2) + ' ' + (y0 - row * DY).toFixed(2) + ' 0');
      if (e.tagName === 'A-PLANE') { e.setAttribute('width', BW); e.setAttribute('height', BH); const tx = e.querySelector('a-text'); if (tx) { tx.setAttribute('width', TXW); const r = PV[k]; if (r && r[2]) tx.setAttribute('value', r[2]); } }
      else if (e.tagName === 'A-TEXT') e.setAttribute('width', TXW); });
    TABS.forEach(([k]) => { const p = document.getElementById('jfv-tab-' + k); if (p) p.setAttribute('material', 'shader:flat;color:' + (k === tabVR ? '#ffffff' : '#c9a24a')); });
    const curSec = secVR === 'vers' || secVR === 'bos' || secVR === 'ldn' ? 'earth' : secVR;
    SECS.forEach(([k]) => { const p = document.getElementById('jfv-sec-' + k); if (!p) return; const on = tabVR === 'go'; p.setAttribute('visible', on); if (p.object3D) p.object3D.visible = on;
      p.setAttribute('material', 'shader:flat;color:' + (k === curSec ? '#ffe9a8' : '#8a7440')); });
    const h = document.getElementById('jfv-hint'); if (h) { h.setAttribute('value', !list.length ? 'Nothing here yet.  Left stick or Y hides the menu.' : 'Left stick or Y hides the menu.');
      h.setAttribute('position', '0 ' + (y0 - Math.max(rows, 1) * DY + 0.1).toFixed(2) + ' 0'); }
    const bg = ensureBg(bar), top = 1.4, bot = y0 - Math.max(rows, 1) * DY - 0.05; bg.setAttribute('height', (top - bot).toFixed(2)); bg.setAttribute('position', '0 ' + ((top + bot) / 2).toFixed(2) + ' -0.02');
    setTimeout(() => document.querySelectorAll('[raycaster]').forEach(r => r.components.raycaster && r.components.raycaster.refreshObjects()), 50);
  }
  function ensureBg(bar) { let b = document.getElementById('jfv-bg'); if (b) return b;
    b = document.createElement('a-plane'); b.id = 'jfv-bg'; b.className = 'btn'; b.dataset.blocker = '1';   // stops the laser (no click-through / teleport through the menu)
    b.setAttribute('width', COLS * DX + 0.3); b.setAttribute('material', 'shader:flat;color:#0b1d26;opacity:0.82;transparent:true'); bar.insertBefore(b, bar.firstChild); return b; }
  function initVR() {
    const bar = document.getElementById('vrbar'); if (!bar || bar._tabs) return; bar._tabs = 1;
    layoutVR(); new MutationObserver(() => { clearTimeout(bar._lt); bar._lt = setTimeout(layoutVR, 80); }).observe(bar, {childList: true});
    setInterval(() => { if (fpc() && !document.getElementById('jfv-fpc-come')) layoutVR(); }, 3000);
  }
  window.JFVR_setTabVR = (t, s) => { if (SECV.includes(t)) { s = t; t = 'go'; } tabVR = t; if (s) secVR = s; layoutVR(); };
  window.JFVR_openMenuVR = () => { const m = document.querySelector('[menu-toggle]'), c = m && m.components['menu-toggle'], bar = document.getElementById('vrbar');
    if (!c || !bar) return; if (!bar.object3D.visible) { c.last = 0; c.toggle(); } else if (window.JFVR && JFVR.placeInFront) JFVR.placeInFront(bar, 2.4, 0.4); };
  /* test/audit hook: where every menu item lives now */
  window.JFVR_menuInventory = () => { const bar = document.getElementById('vrbar'), vr = {};
    [...bar.children].forEach(e => { if (STRUCT.test(e.id || '')) return; const k = keyOf(e); if (!k) return; const r = PV[k], d = DROPV[k] ? 'dropped' : r ? r[0] : 'set';
      const t = TABOF(d); (vr[t === 'go' ? 'go/' + d : t] = vr[t === 'go' ? 'go/' + d : t] || []).push(k + ' = ' + (((e.querySelector && e.querySelector('a-text')) || e).getAttribute('value') || '')); });
    const d2 = {}; document.querySelectorAll('#ui .pane').forEach(p => { p.querySelectorAll('.jf-sec, .jf-grp').forEach(g => { const items = [...g.querySelector('.jf-body').children].filter(c => /^(BUTTON|A|SPAN)$/.test(c.tagName) && !c.classList.contains('sec'))
      .map(c => (key2D(c) || '?') + ' = ' + c.textContent.trim().replace(/\s+/g, ' ').slice(0, 50)); d2[p.id.replace('pane-', '') + '/' + g.id] = items; }); });
    d2.hidden = [...document.querySelectorAll('#jf-inbox button, #jf-inbox a')].map(c => (key2D(c) || '?') + ' = ' + c.textContent.trim().slice(0, 40));
    return {vr, d2}; };
  /* Nov 26: A-Frame's load-time "requires access to your device motion sensors" Deny/Allow prompt is off (a-scene
     device-orientation-permission-ui). Drag-look + joystick need no permission. Tilt-to-look is opt-in here, default OFF; permission
     is only ever requested from this tap (iOS needs a user gesture), the saved choice alone never triggers a prompt. */
  function initTilt() {
    const host = document.getElementById('set-look'); if (!host || document.getElementById('tiltbtn') || typeof window.DeviceOrientationEvent === 'undefined') return;
    const b = document.createElement('button'); b.id = 'tiltbtn'; host.appendChild(b);
    const lc = () => { const c = document.querySelector('[camera]'); return c && c.components['look-controls']; };
    let on = false;
    const apply = v => { on = v; const l = lc(); if (l) l.data.magicWindowTrackingEnabled = v; const c = document.querySelector('[camera]'); if (c) c.setAttribute('look-controls', 'magicWindowTrackingEnabled', v);
      if (!v && l && l.magicWindowDeltaEuler) l.magicWindowDeltaEuler.set(0, 0, 0); b.textContent = 'Tilt phone to look: ' + (v ? 'On' : 'Off'); };
    const save = v => { try { localStorage.setItem('jfvr_tilt', v ? '1' : '0'); } catch (e) {} };
    b.addEventListener('click', () => {
      if (on) { apply(false); save(false); return; }
      const D = window.DeviceOrientationEvent;
      if (D && typeof D.requestPermission === 'function') D.requestPermission().then(r => { const ok = r === 'granted'; apply(ok); save(ok); if (!ok) b.textContent = 'Tilt phone to look: blocked (Settings > Safari/Brave > Motion)'; }).catch(() => { apply(false); b.textContent = 'Tilt phone to look: not allowed'; });
      else { apply(true); save(true); } });
    // remembered ON: re-enable without asking where no permission is needed (Android); on iOS it stays off until tapped
    let saved = false; try { saved = localStorage.getItem('jfvr_tilt') === '1'; } catch (e) {}
    apply(saved && !(window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function'));
    if (saved && !on) b.textContent = 'Tilt phone to look: Off (tap to turn on)';
    const sc = document.querySelector('a-scene'); if (sc) { sc.addEventListener('enter-vr', () => { if (sc.is('vr-mode')) b.style.display = 'none'; }); sc.addEventListener('exit-vr', () => { b.style.display = ''; }); }
  }
  function boot() { initTilt(); init2D(); const sc = document.querySelector('a-scene'); if (!sc) return; if (sc.hasLoaded) initVR(); else sc.addEventListener('loaded', initVR); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
