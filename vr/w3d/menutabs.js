/* Menu clean-up (Josh, Nov 26): one menu with four tabs - Go to / Other worlds / Bank / Settings - on the 2D (desktop / phone)
   menu and on the in-headset menu (left stick or Y). Everything that used to be on the menu is still there, at most two clicks away
   (tab, then item). Other modules keep adding their buttons the way they always did (2D: '#ui .tools', VR: '#vrbar'); this file
   moves each one into its tab - known ids by name, anything new lands in Settings > More - and lays the VR menu out as a tidy grid.
   Hidden tabs' VR buttons are made invisible; vrpointer.js makes the lasers ignore invisible buttons. */
(function () {
  'use strict';
  /* ---------------- 2D menu ---------------- */
  const HOME2D = {   // id -> container id
    placesbtn: 'go-far', pharosbtn: 'go-pond',
    mpvoice: 'set-people', mpcount: 'set-people', friendsbtn: 'set-people', voicerange: 'set-people', invitebtn: 'set-people',
    skybtn: 'set-look', nsndbtn: 'set-look', watersoundbtn: 'set-look', realearthbtn: 'set-look', buildbtn: 'set-more'
  };
  function sort2D() {
    for (const id in HOME2D) { const e = document.getElementById(id), box = document.getElementById(HOME2D[id]); if (e && box && e.parentNode !== box) box.appendChild(e); }
    const more = document.getElementById('set-more'), tools = more && more.querySelector('.tools');
    if (more) more.style.display = (more.querySelectorAll('button, a').length ? '' : 'none');
    if (tools && tools.parentNode !== more) more.appendChild(tools);
  }
  function setTab2D(t) { const ui = document.getElementById('ui'); if (!ui) return;
    const cur = ui.dataset.tab === t ? '' : t; ui.dataset.tab = cur;   // clicking the open tab closes it again (clean screen)
    ui.querySelectorAll('#tabbar .tab').forEach(b => b.classList.toggle('cur', b.dataset.tab === cur));
    ui.querySelectorAll('.pane').forEach(p => p.classList.toggle('cur', p.id === 'pane-' + cur));
    try { localStorage.setItem('jfvr_tab2d', cur); } catch (e) {} }
  function init2D() {
    const ui = document.getElementById('ui'); if (!ui || ui._tabs) return; ui._tabs = 1;
    ui.querySelectorAll('#tabbar .tab').forEach(b => b.addEventListener('click', ev => { ev.stopPropagation(); setTab2D(b.dataset.tab); }));
    const rg = document.getElementById('rplgo'); if (rg) rg.addEventListener('click', () => { if (window.W3D && W3D.goMars) W3D.goMars(); else location.assign('/vr/mars/?spot=pad&from=joshfreeman-vr'); });
    let start = ''; try { start = localStorage.getItem('jfvr_tab2d') || ''; } catch (e) {}
    if (!start && window.innerWidth >= 900) start = 'go';   // desktop opens on Go to; phones start with only the tab row (more world on screen)
    if (start) setTab2D(start);
    sort2D(); new MutationObserver(() => { clearTimeout(ui._st); ui._st = setTimeout(sort2D, 60); }).observe(ui, {childList: true, subtree: true});
  }
  window.JFVR_setTab2D = setTab2D;

  /* ---------------- VR menu ---------------- */
  const TABS = [['go', 'Go to'], ['worlds', 'Other worlds'], ['bank', 'Bank'], ['set', 'Settings']];
  const ORDER = {
    go: ['w:terrace', 'w:hall', 'w:vault', 'w:showcase', 'w:office', 'jfv-residence', 'jfv-guest', 'w:conservatory', 'w:propulsion', 'w:ufo',
      'w:pond', 'w:pyramid', 'w:houseboat', 'pharosvr', 'w:launchpad', 'w:starfleet', 'w:saucer', 'w:bridgewater', 'w:aldensquare', 'w:rockets', 'w:walker', 'placesvr', 'w:home'],
    worlds: ['jfv-rplpad', 'jfv-rplgo', 'tesseractvr'],
    bank: ['bankledgervr', 'jfv-bhall', 'jfv-bvault', 'jfv-bterrace'],
    set: ['speed', 'fly', 'reload', 'mpvrvoice', 'mpvrcount', 'invite', 'skylabel', 'nsndlabel', 'realearthvr', 'buildvrbtn']
  };
  const SHORT = {'w:showcase': 'Wampum showcase', 'w:pond': 'Fly over pond', 'w:pyramid': 'Pyramid park', 'w:houseboat': 'Houseboat', 'w:bridgewater': 'Corporate Base',
    'w:aldensquare': 'Alden Square', 'w:rockets': 'Rocket yard', 'w:starfleet': 'Star Fleet base', 'w:walker': 'Walker Memorial', 'tesseractvr': 'Tesseract reader', 'bankledgervr': 'Bank Ledger'};
  const COLS = 4, BW = 1.3, BH = 0.26, DX = 1.4, DY = 0.31, TXW = 2.0, Y0 = 0.55;   // raised + tighter rows: the 6-row Go to tab sank into the floor
  let tabVR = 'go';
  function keyOf(e) { if (e.id) return e.id; const d = e.dataset || {};
    if (d.w) return 'w:' + d.w; if (d.speed) return 'speed'; if (d.reload) return 'reload'; if (d.invite) return 'invite';
    if (e.hasAttribute && e.hasAttribute('fly-toggle')) return 'fly';
    const t = e.querySelector && e.querySelector('a-text[id]'); if (t) return t.id; return ''; }
  function mkBtn(bar, id, label, color, fn, data) {
    if (document.getElementById(id)) return; const p = document.createElement('a-plane'); p.id = id; p.className = 'btn';
    p.setAttribute('width', BW); p.setAttribute('height', BH); p.setAttribute('material', 'shader:flat;color:' + color);
    if (data) p.dataset.w = data;
    const t = document.createElement('a-text'); t.setAttribute('value', label); t.setAttribute('align', 'center'); t.setAttribute('color', '#111'); t.setAttribute('width', TXW); t.setAttribute('position', '0 0 0.005');
    p.appendChild(t); p.addEventListener('click', fn); bar.appendChild(p); }
  const go = w => () => { if (typeof window.goWorld === 'function') window.goWorld(w); };
  function extras(bar) {
    mkBtn(bar, 'jfv-residence', "Josh's residence", '#FFD700', go('residence'), 'residence');
    mkBtn(bar, 'jfv-guest', 'Guest apartment', '#FFD700', go('guest'), 'guest');
    mkBtn(bar, 'jfv-rplpad', 'Red Planet: rocket', '#ff9a6b', go('launchpad'));
    mkBtn(bar, 'jfv-rplgo', 'Red Planet: go now', '#ff9a6b', () => { if (window.W3D && W3D.goMars) W3D.goMars(); });
    mkBtn(bar, 'jfv-bhall', 'Banking hall', '#FFD700', go('hall'));
    mkBtn(bar, 'jfv-bvault', 'Bank vault', '#FFD700', go('vault'));
    mkBtn(bar, 'jfv-bterrace', 'Bank terrace', '#FFD700', go('terrace'));
    if (!document.getElementById('jfv-title')) { const t = document.createElement('a-text'); t.id = 'jfv-title'; t.setAttribute('value', 'FOWLING POND MENU'); t.setAttribute('align', 'center');
      t.setAttribute('color', '#FFD700'); t.setAttribute('width', 3); t.setAttribute('position', '0 1.25 0'); bar.appendChild(t); }
    if (!document.getElementById('jfv-hint')) { const t = document.createElement('a-text'); t.id = 'jfv-hint'; t.setAttribute('value', 'Pick a tab, then a button. Left stick or Y hides the menu.'); t.setAttribute('align', 'center');
      t.setAttribute('color', '#ffe9a8'); t.setAttribute('width', 2.6); bar.appendChild(t); }
    TABS.forEach(([k, label], i) => { const id = 'jfv-tab-' + k; if (document.getElementById(id)) return;
      const p = document.createElement('a-plane'); p.id = id; p.className = 'btn'; p.dataset.vtab = k; p.setAttribute('width', 1.3); p.setAttribute('height', 0.32);
      p.setAttribute('position', ((i - 1.5) * DX).toFixed(2) + ' 0.95 0');
      const t = document.createElement('a-text'); t.setAttribute('value', label); t.setAttribute('align', 'center'); t.setAttribute('color', '#111'); t.setAttribute('width', 2.6); t.setAttribute('position', '0 0 0.005'); p.appendChild(t);
      p.addEventListener('click', () => { tabVR = k; layoutVR(); }); bar.appendChild(p); });
  }
  function layoutVR() {
    const bar = document.getElementById('vrbar'); if (!bar) return; extras(bar);
    const old = bar.querySelector(':scope > a-text:not([id])'); if (old && /3D WORLD/.test(old.getAttribute('value') || '')) old.setAttribute('visible', false);
    const items = [...bar.children].filter(e => !/^jfv-(tab-|title|hint|bg)/.test(e.id || '') && !(e === old));
    const buckets = {go: [], worlds: [], bank: [], set: []}, rank = {};
    for (const t in ORDER) ORDER[t].forEach((k, i) => { rank[k] = [t, i]; });
    items.forEach(e => { const k = keyOf(e), r = rank[k]; (r ? buckets[r[0]] : buckets.set).push([r ? r[1] : 999, e, k]); });
    let rows = 0;
    for (const t in buckets) { const list = buckets[t].sort((a, b) => a[0] - b[0]); const on = t === tabVR;
      list.forEach(([, e, k], i) => {
        const vis = on; e.setAttribute('visible', vis); if (e.object3D) e.object3D.visible = vis;
        if (!on) return; const col = i % COLS, row = Math.floor(i / COLS); rows = Math.max(rows, row + 1);
        e.setAttribute('position', ((col - (COLS - 1) / 2) * DX).toFixed(2) + ' ' + (Y0 - row * DY).toFixed(2) + ' 0');
        if (e.tagName === 'A-PLANE') { e.setAttribute('width', BW); e.setAttribute('height', BH); const tx = e.querySelector('a-text'); if (tx) { tx.setAttribute('width', TXW); if (SHORT[k]) tx.setAttribute('value', SHORT[k]); } }
        else if (e.tagName === 'A-TEXT') e.setAttribute('width', TXW);
      }); }
    TABS.forEach(([k]) => { const p = document.getElementById('jfv-tab-' + k); if (p) p.setAttribute('material', 'shader:flat;color:' + (k === tabVR ? '#ffffff' : '#c9a24a')); });
    const h = document.getElementById('jfv-hint'); if (h) h.setAttribute('position', '0 ' + (Y0 - rows * DY + 0.1).toFixed(2) + ' 0');
    const bg = ensureBg(bar), top = 1.4, bot = Y0 - rows * DY - 0.05; bg.setAttribute('height', (top - bot).toFixed(2)); bg.setAttribute('position', '0 ' + ((top + bot) / 2).toFixed(2) + ' -0.02');
    setTimeout(() => document.querySelectorAll('[raycaster]').forEach(r => r.components.raycaster && r.components.raycaster.refreshObjects()), 50);
  }
  function ensureBg(bar) { let b = document.getElementById('jfv-bg'); if (b) return b;
    b = document.createElement('a-plane'); b.id = 'jfv-bg'; b.className = 'btn'; b.dataset.blocker = '1';   // stops the laser (no click-through / teleport through the menu)
    b.setAttribute('width', COLS * DX + 0.3); b.setAttribute('material', 'shader:flat;color:#0b1d26;opacity:0.82;transparent:true'); bar.insertBefore(b, bar.firstChild); return b; }
  function initVR() {
    const bar = document.getElementById('vrbar'); if (!bar || bar._tabs) return; bar._tabs = 1;
    layoutVR(); new MutationObserver(() => { clearTimeout(bar._lt); bar._lt = setTimeout(layoutVR, 80); }).observe(bar, {childList: true});
  }
  window.JFVR_setTabVR = t => { tabVR = t; layoutVR(); };
  window.JFVR_menuInventory = () => ({ vr: Object.fromEntries(TABS.map(([k]) => [k, []])), ...(() => { const out = {}; const bar = document.getElementById('vrbar');
    [...bar.children].forEach(e => { if (/^jfv-(tab-|title|hint|bg)/.test(e.id || '')) return; const k = keyOf(e); const r = Object.keys(ORDER).find(t => ORDER[t].includes(k)) || 'set';
      (out[r] = out[r] || []).push(k + ' = ' + (((e.querySelector && e.querySelector('a-text')) || e).getAttribute('value') || '')); }); return {vrTabs: out}; })() });
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
