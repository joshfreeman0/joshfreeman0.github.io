/* Friend finder (Josh, Nov 23).
   - Quest: turn your LEFT palm up (wrist roll past ~55 deg, back below ~35 deg to hide: hysteresis) and a small panel appears on that
     wrist with one row per other person in the room: their colour + name, distance in metres (or the city they're in) and an arrow
     pointing their way. (Nov 26: always upright, laser stops on it, Voice ON / OFF switch - see the wrist panel section.)
   - Each row has a Go button (right laser trigger; click on desktop): a short fade, then you stand ~2 m beside them, facing them, on
     whatever floor they're on (ground/floor lookup + collision check, 8 directions tried). If they're in London or another saucer city,
     that city is loaded first (fade holds until it's ready); if they're home and you're in a city, the city is left first.
   - Desktop / phone: F key or the Friends button in the menu opens the same list as an HTML panel.
   - Voice range (mp.js applies it): Auto = everyone audible at any distance, full volume within 10 m, easing down to a 35% floor beyond
     30 m (direction still panned); Near only = the old fall-off. Menu toggle 'Voice: Auto / Near only', saved per browser (localStorage).
   Animation runs on the A-Frame tick (works inside immersive WebXR), with a timeout fallback. No navigation, no session changes. */
(function () {
  'use strict';
  const W3D = window.W3D = window.W3D || {};
  const KEY = 'jfvr.voiceRange';
  const FR = W3D.friends = {range: (localStorage.getItem(KEY) === 'near') ? 'near' : 'auto', open: false};
  FR.setRange = r => { FR.range = r === 'near' ? 'near' : 'auto'; try { localStorage.setItem(KEY, FR.range); } catch (e) {} renderBtns(); };
  FR.volume = d => FR.range === 'near' ? null : d <= 10 ? 1 : d >= 30 ? 0.35 : 1 - 0.65 * (d - 10) / 20;   // null = use the panner's own fall-off
  const COLS = ['#ffd700', '#7fd3e0', '#ff9a3c', '#9be37a', '#e88cff', '#ff6b6b', '#6fa8ff', '#f2f2f2'];
  const V = () => new THREE.Vector3();
  const hud = t => { if (W3D.toast) W3D.toast(t, 2500); else if (window.JFVR && JFVR.hud) JFVR.hud(t); };
  const camPos = () => { const c = document.querySelector('[camera]'); return c ? c.object3D.getWorldPosition(V()) : null; };
  function cityAt(x, z) { const C = W3D.cities; if (!C || !C.DEFS) return null; for (const id in C.DEFS) { const d = C.DEFS[id]; if (Math.hypot(x - d.x, z - d.z) < 3000) return id; } return null; }
  function people() {
    const MP = window.JFMP; if (!MP || !MP.peers) return []; const me = camPos(); if (!me) return []; const out = [];
    for (const id in MP.peers) { const p = MP.peers[id]; if (!p.tp || p.scene !== 'world') continue;
      const pos = p.hp && p.hp.lengthSq() ? p.hp : p.tp, c = cityAt(pos.x, pos.z), mc = cityAt(me.x, me.z);
      out.push({id, name: p.name || 'Guest', col: COLS[(parseInt(String(id).replace(/\W/g, '').slice(-6), 36) || 0) % COLS.length], pos: pos.clone(), d: Math.hypot(pos.x - me.x, pos.z - me.z), city: c, away: c !== mc}); }
    return out.sort((a, b) => a.d - b.d);
  }
  FR.people = people;
  function dirArrow(me, yaw, p) {   // arrow angle on the panel: 0 = straight ahead
    const a = Math.atan2(p.pos.x - me.x, p.pos.z - me.z), f = Math.atan2(-Math.sin(yaw), -Math.cos(yaw)); return a - f; }
  function label(p) { const C = W3D.cities; if (p.away) return p.city ? 'in ' + ((C.DEFS[p.city] && C.DEFS[p.city].name) || p.city) : 'at home'; return p.d < 1000 ? Math.round(p.d) + ' m' : (p.d / 1000).toFixed(1) + ' km'; }

  /* ---------- Go: fade, (load city), place 2 m beside them facing them ---------- */
  let go = null, fadeM = null;
  function ensureFade() { const cam = document.querySelector('a-scene').camera; if (fadeM || !cam) return fadeM;
    fadeM = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 8), new THREE.MeshBasicMaterial({color: 0, side: THREE.BackSide, transparent: true, opacity: 0, depthTest: false, depthWrite: false, fog: false}));
    fadeM.renderOrder = 1e4; fadeM.visible = false; cam.add(fadeM); return fadeM; }
  function spotBeside(p) {
    const me = camPos(), t = p.pos, fy = t.y - 1.6; let a0 = Math.atan2(me.x - t.x, me.z - t.z); if (p.away || !isFinite(a0)) a0 = 0;
    for (let k = 0; k < 8; k++) { const a = a0 + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * Math.PI / 4, x = t.x + Math.sin(a) * 2, z = t.z + Math.cos(a) * 2;
      const g = W3D.groundAt ? W3D.groundAt(x, z, fy + 1) : fy; if (Math.abs(g - fy) > 1.2) continue;          // same floor as them
      if (W3D.blocked && W3D.blocked(x, z, g)) continue; if (W3D.cityBlocked && W3D.cityBlocked(x, z, g)) continue;
      return {x, y: g, z, yaw: Math.atan2(-(t.x - x), -(t.z - z)) * 180 / Math.PI}; }
    const x = t.x + Math.sin(a0) * 2, z = t.z + Math.cos(a0) * 2; return {x, y: fy, z, yaw: Math.atan2(-(t.x - x), -(t.z - z)) * 180 / Math.PI}; }
  FR._state = () => go && {ph: go.ph, city: go.city};
  FR.go = function (id) {
    const p = people().find(q => q.id === id); if (!p) { hud('They have left'); return; }
    if (W3D.saucer && W3D.saucer.seat() >= 0) { if (W3D.saucer.S.mode === 'fly') { hud('The saucer is flying - wait for the landing'); return; } W3D.saucer.leave(true); }
    if (W3D.flight || (W3D.arrival && W3D.arrival.active)) { hud('Wait until the rocket lands'); return; }
    ensureFade(); go = {id, t0: performance.now(), ph: 'out', city: p.city, name: p.name}; showPanel(false); htmlPanel(false);
    clearTimeout(FR._fb); FR._fb = setTimeout(() => { if (go) step(performance.now() + 1e5); }, 8000);   // fallback if the tick stalls
  };
  function step(now) {
    if (!go || !fadeM) return; const t = (now - go.t0) / 1000;
    if (go.ph === 'out') { fadeM.visible = true; fadeM.material.opacity = Math.min(1, t / 0.25); if (t < 0.25) return;
      const C = W3D.cities, mine = C && C.current && C.current();
      if (go.city && C) { if (mine !== go.city || !C.isReady(go.city)) C.enter(go.city); go.ph = 'load'; go.tl = now; }
      else { if (C && mine) C.leave(); go.ph = 'place'; } }
    if (go.ph === 'load') { fadeM.material.opacity = 1; if (W3D.cities.isReady(go.city)) { W3D.cities.enter(go.city); go.ph = 'place'; } else if (now - go.tl > 60000) { hud('Could not load the city'); go.ph = 'in'; go.t1 = now; } else return; }
    if (go.ph === 'place') { const p = people().find(q => q.id === go.id); if (p) { const s = spotBeside(p); W3D.teleportTo(s.x, s.y, s.z, s.yaw); hud('Beside ' + go.name); }
      const lc = document.querySelector('[camera]').components['look-controls']; if (lc && lc.yawObject && !(document.querySelector('a-scene').is('vr-mode'))) lc.yawObject.rotation.y = 0;
      go.ph = 'in'; go.t1 = now; }
    if (go.ph === 'in') { const k = (now - go.t1) / 350; fadeM.material.opacity = Math.max(0, 1 - k); if (k >= 1) { fadeM.visible = false; go = null; clearTimeout(FR._fb); } }
  }

  /* ---------- wrist panel (left hand) ----------
     Nov 26 (Josh): the panel used to be glued to the controller, so turning the hand turned it upside down, and only the tiny Go
     buttons were raycastable, so the right laser went straight through it. Now it floats just above the left hand, always upright and
     turned to face your eyes (world-up roll lock), and the whole panel stops the laser (data-blocker backing) - vrpointer.js puts a dot
     where the ray lands and lights up the button under it; the right trigger presses that button. It shows whenever the palm is up,
     even with nobody else here, because it also carries the Voice ON / OFF switch (mutes / unmutes your mic in mp.js voice chat;
     same state as the menu Voice buttons). */
  let wrist = null, rows = [], pTex = null, pCtx = null, lastDraw = 0, palm = false, goBtns = [], vTex = null, vCtx = null, vSig = '';
  const ROWS = 6, PW = 0.22;
  const fromLeft = ev => { const ce = ev.detail && ev.detail.cursorEl, lc = ce && ce.getAttribute && ce.getAttribute('laser-controls'); return !!(lc && /left/.test(typeof lc === 'string' ? lc : lc.hand)); };
  function plane(parent, w, h, x, y, z, mat, cls) { const b = document.createElement('a-plane'); if (cls) b.setAttribute('class', cls); b.setAttribute('width', w); b.setAttribute('height', h);
    b.setAttribute('position', `${x} ${y.toFixed(4)} ${z}`); b.setAttribute('material', mat); parent.appendChild(b); return b; }
  function voiceState() { const MP = window.JFMP; if (!MP) return 'na'; return MP.voice || 'off'; }
  function drawVoice() { if (!vCtx) return; const st = voiceState(); if (st === vSig) return; vSig = st; const g = vCtx, W = 256, H = 80;
    const on = st === 'on', col = on ? '#1e9e3e' : st === 'wait' ? '#c98a12' : (st === 'nomic' || st === 'na') ? '#666' : '#c62828';
    const txt = on ? 'Voice ON' : st === 'wait' ? 'Mic...' : st === 'nomic' ? 'No mic' : st === 'na' ? 'Voice n/a' : 'Voice OFF';
    g.clearRect(0, 0, W, H); g.fillStyle = col; g.beginPath(); if (g.roundRect) g.roundRect(2, 2, W - 4, H - 4, 16); else g.rect(2, 2, W - 4, H - 4); g.fill();
    g.strokeStyle = '#fff'; g.lineWidth = 3; g.stroke();
    // microphone icon
    g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.lineWidth = 5; g.beginPath(); if (g.roundRect) g.roundRect(30, 14, 22, 34, 11); else g.rect(30, 14, 22, 34); g.fill();
    g.beginPath(); g.arc(41, 36, 18, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke(); g.beginPath(); g.moveTo(41, 54); g.lineTo(41, 66); g.moveTo(31, 66); g.lineTo(51, 66); g.stroke();
    if (!on) { g.strokeStyle = '#111'; g.lineWidth = 9; g.beginPath(); g.moveTo(18, 12); g.lineTo(64, 68); g.stroke(); g.strokeStyle = '#fff'; g.lineWidth = 4; g.beginPath(); g.moveTo(18, 12); g.lineTo(64, 68); g.stroke(); }
    g.fillStyle = '#fff'; g.font = 'bold 36px Arial, sans-serif'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(txt, 78, 42);
    vTex.needsUpdate = true; }
  function toggleVoice() { const MP = window.JFMP; if (MP && MP.toggleVoice) MP.toggleVoice(); else hud('Voice chat is not available here'); }
  function buildWrist() { const L = document.querySelector('[laser-controls*="left"]'), sc = document.querySelector('a-scene'); if (!L || !sc || wrist) return wrist;
    wrist = document.createElement('a-entity'); wrist.id = 'wristpanel'; sc.appendChild(wrist); wrist.object3D.visible = false;   // not the visible attribute: it applies late and would hide a panel just shown
    const c = document.createElement('canvas'); c.width = 512; c.height = 64 * ROWS + 48; pCtx = c.getContext('2d'); pTex = new THREE.CanvasTexture(c); pTex.colorSpace = THREE.SRGBColorSpace;
    const H = 0.035 * ROWS + 0.026, FH = 0.06, TOT = H + FH;
    const bg = new THREE.Mesh(new THREE.PlaneGeometry(PW, TOT + 0.008), new THREE.MeshBasicMaterial({color: 0x0b1d26, transparent: true, opacity: 0.92, depthTest: false, depthWrite: false, toneMapped: false}));
    bg.position.set(0, -FH / 2, -0.0005); bg.renderOrder = 2999; wrist.object3D.add(bg);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.2, H), new THREE.MeshBasicMaterial({map: pTex, transparent: true, depthTest: false, depthWrite: false, toneMapped: false}));
    m.renderOrder = 3000; wrist.object3D.add(m); wrist.userData = {H};
    // invisible backing over the whole panel: stops the laser (line ends on the panel, dot shows), clicks on it do nothing
    const blk = plane(wrist, PW, TOT + 0.008, 0, -FH / 2, 0.0005, 'shader:flat;transparent:true;opacity:0;depthTest:false;depthWrite:false', 'btn'); blk.dataset.blocker = '1';
    goBtns = [];
    for (let i = 0; i < ROWS; i++) { const b = plane(wrist, 0.045, 0.028, 0.07, H / 2 - 0.026 - 0.035 * i - 0.0175, 0.002, 'shader:flat;color:#ffd700;depthTest:false;depthWrite:false', 'btn');
      const t = document.createElement('a-text'); t.setAttribute('value', 'Go'); t.setAttribute('align', 'center'); t.setAttribute('color', '#111'); t.setAttribute('width', 0.4); t.setAttribute('position', '0 0 0.001'); b.appendChild(t);
      b.addEventListener('click', ev => { if (fromLeft(ev)) return; const r = rows[i]; if (r) FR.go(r.id); }); b.object3D.renderOrder = 3001; goBtns.push(b); }
    // Voice ON / OFF (big, left) and voice range (right) along the bottom
    const vy = -H / 2 - FH / 2;
    const vb = plane(wrist, 0.12, 0.04, -0.043, vy, 0.002, 'shader:flat;transparent:true;opacity:0;depthTest:false;depthWrite:false', 'btn'); vb.id = 'wristvoice';
    const vc = document.createElement('canvas'); vc.width = 256; vc.height = 80; vCtx = vc.getContext('2d'); vTex = new THREE.CanvasTexture(vc); vTex.colorSpace = THREE.SRGBColorSpace;
    const vm = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.0375), new THREE.MeshBasicMaterial({map: vTex, transparent: true, depthTest: false, depthWrite: false, toneMapped: false}));
    vm.position.z = 0.001; vm.renderOrder = 3002; vb.object3D.add(vm); vb.object3D.renderOrder = 3001;
    vb.addEventListener('click', ev => { if (fromLeft(ev)) return; toggleVoice(); vSig = ''; setTimeout(drawVoice, 50); });
    const vt = plane(wrist, 0.08, 0.04, 0.058, vy, 0.002, 'shader:flat;color:#9ffcff;depthTest:false;depthWrite:false', 'btn'); vt.object3D.renderOrder = 3001;
    const vtt = document.createElement('a-text'); vtt.setAttribute('align', 'center'); vtt.setAttribute('color', '#111'); vtt.setAttribute('width', 0.36); vtt.setAttribute('position', '0 0 0.001'); vt.appendChild(vtt);
    vt.addEventListener('click', ev => { if (fromLeft(ev)) return; FR.setRange(FR.range === 'auto' ? 'near' : 'auto'); }); wrist.userData.vt = vtt; renderBtns(); vSig = ''; drawVoice();
    window.addEventListener('jfmp-voice', () => { vSig = ''; drawVoice(); });
    setTimeout(() => document.querySelectorAll('[raycaster]').forEach(r => r.components.raycaster && r.components.raycaster.refreshObjects()), 300);
    [500, 1500, 4000].forEach(t => setTimeout(fixOrder, t));
    return wrist; }
  /* keep the panel upright: float it ~9 cm above the left controller, nudged toward the eyes, and face the eyes with world up */
  const lp = new THREE.Vector3(), ep = new THREE.Vector3(), tv = new THREE.Vector3();
  function placeWrist(L, cam) { if (!wrist || !wrist.object3D) return; L.object3D.getWorldPosition(lp); cam.getWorldPosition(ep);
    tv.copy(ep).sub(lp); tv.y = 0; const d = tv.length(); if (d > 1e-4) tv.multiplyScalar(0.05 / d);
    const o = wrist.object3D; o.position.copy(lp).add(tv); o.position.y += 0.09; o.up.set(0, 1, 0); o.lookAt(ep); }
  function drawWrist(list, me, yaw) { if (!pCtx) return; const g = pCtx, W = 512, Hh = pCtx.canvas.height; g.clearRect(0, 0, W, Hh);
    g.fillStyle = 'rgba(11,29,38,0.9)'; g.fillRect(0, 0, W, Hh); g.fillStyle = '#9ffcff'; g.font = 'bold 30px Arial, sans-serif'; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillText('Friends here', 18, 26);
    rows = list.slice(0, ROWS);
    if (!rows.length) { g.fillStyle = '#ffe9a8'; g.font = '26px Arial, sans-serif'; g.fillText('Nobody else is here yet', 18, 48 + 40); g.fillText('Invite people from the menu', 18, 48 + 80); }
    rows.forEach((p, i) => { const y = 48 + 64 * i + 32;
      g.fillStyle = p.col; g.beginPath(); g.arc(34, y, 18, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#fff'; g.font = 'bold 28px Arial, sans-serif'; g.fillText(p.name.slice(0, 14), 64, y - 12); g.fillStyle = '#ffe9a8'; g.font = '24px Arial, sans-serif'; g.fillText(label(p), 64, y + 16);
      if (!p.away) { const a = dirArrow(me, yaw, p); g.save(); g.translate(300, y); g.rotate(-a); g.fillStyle = '#ffd700'; g.beginPath(); g.moveTo(0, -20); g.lineTo(13, 12); g.lineTo(0, 5); g.lineTo(-13, 12); g.closePath(); g.fill(); g.restore(); } });
    pTex.needsUpdate = true;
    goBtns.forEach((b, i) => { if (b.object3D) b.object3D.visible = i < rows.length; }); drawVoice(); }
  /* the buttons and their labels are a-frame meshes created late with renderOrder 0, so they drew under the 92%-opaque backing and looked
     dim; lift every such mesh into the transparent pass above the backing (labels sit 1 mm nearer, so they still sort over their buttons) */
  function fixOrder() { if (!wrist) return; wrist.object3D.traverse(o => { if (!o.isMesh || o.renderOrder >= 2999) return; o.renderOrder = 3003;
    const m = o.material; if (m && !m.transparent) { m.transparent = true; m.needsUpdate = true; } }); }
  function showPanel(on) { if (!wrist) return; if (on) fixOrder(); if (wrist.object3D.visible === on) return; wrist.object3D.visible = on; FR.open = on;
    document.querySelectorAll('[raycaster]').forEach(r => r.components.raycaster && r.components.raycaster.refreshObjects()); }
  function renderBtns() { const t = 'Voice: ' + (FR.range === 'auto' ? 'Auto' : 'Near only'); if (wrist && wrist.userData.vt) wrist.userData.vt.setAttribute('value', FR.range === 'auto' ? 'Range: Auto' : 'Range: Near');
    const hb = document.getElementById('voicerange'); if (hb) hb.textContent = t; }
  FR.wrist = () => wrist;
  /* test hook (headless checks, no headset): FR.debugWrist(true) builds the panel and parks it 0.5 m in front of the camera */
  FR.debugWrist = on => { buildWrist(); const cam = document.querySelector('a-scene').camera; if (!wrist || !cam || !wrist.object3D) return false; FR._debug = !!on; if (!on) { showPanel(false); return true; }
    const f = new THREE.Vector3(0, -0.05, -0.45).applyQuaternion(cam.getWorldQuaternion(new THREE.Quaternion())), e = cam.getWorldPosition(new THREE.Vector3()); wrist.object3D.position.copy(e).add(f); wrist.object3D.lookAt(e); showPanel(true); drawWrist(people(), e, 0); return true; };

  /* ---------- desktop / phone HTML panel ---------- */
  function htmlPanel(on) { let el = document.getElementById('friendspanel');
    if (!on) { if (el) el.remove(); FR.htmlOpen = false; return; }
    const list = people(); if (!list.length) { hud('Nobody else is here right now'); return; }
    if (!el) { el = document.createElement('div'); el.id = 'friendspanel'; el.style.cssText = 'position:fixed;left:50%;top:70px;transform:translateX(-50%);z-index:65;background:rgba(11,29,38,0.94);color:#fff;font:15px system-ui,sans-serif;padding:10px 12px;border-radius:12px;min-width:260px'; document.body.appendChild(el); }
    FR.htmlOpen = true; const me = camPos(), yaw = document.querySelector('#rig').object3D.rotation.y;
    const sig = list.map(p => p.id + (p.away ? 'a' : '')).join(',');
    if (el.dataset.sig === sig) {   // same people: update the text / arrows in place so a Go press is never lost to a rebuild
      for (const p of list) { const r = el.querySelector('[data-row="' + CSS.escape(p.id) + '"]'); if (!r) continue; r.querySelector('.fn').textContent = p.name + ' - ' + label(p);
        const ar = r.querySelector('.fa'); if (ar) ar.style.transform = 'rotate(' + (-dirArrow(me, yaw, p) * 180 / Math.PI).toFixed(0) + 'deg)'; }
      return; }
    el.dataset.sig = sig; el.innerHTML = '';
    const h = document.createElement('div'); h.textContent = 'Friends here'; h.style.cssText = 'color:#9ffcff;font-weight:700;margin-bottom:6px'; el.appendChild(h);
    for (const p of list) { const r = document.createElement('div'); r.dataset.row = p.id; r.style.cssText = 'display:flex;align-items:center;gap:8px;margin:4px 0';
      const dot = document.createElement('span'); dot.style.cssText = 'width:14px;height:14px;border-radius:7px;background:' + p.col; r.appendChild(dot);
      const n = document.createElement('span'); n.className = 'fn'; n.style.flex = '1'; n.textContent = p.name + ' - ' + label(p); r.appendChild(n);
      if (!p.away) { const ar = document.createElement('span'); ar.className = 'fa'; ar.textContent = '\u2191'; ar.style.cssText = 'display:inline-block;color:#ffd700;font-weight:700;transform:rotate(' + (-dirArrow(me, yaw, p) * 180 / Math.PI).toFixed(0) + 'deg)'; r.appendChild(ar); }
      const b = document.createElement('button'); b.type = 'button'; b.textContent = 'Go'; b.dataset.friend = p.id; b.style.cssText = 'background:#ffd700;color:#111;font-weight:700;border:0;border-radius:7px;padding:5px 12px'; b.onclick = () => FR.go(p.id); r.appendChild(b); el.appendChild(r); }
    const f = document.createElement('div'); f.style.cssText = 'display:flex;gap:8px;margin-top:8px';
    const vr = document.createElement('button'); vr.type = 'button'; vr.id = 'voicerange2'; vr.textContent = 'Voice: ' + (FR.range === 'auto' ? 'Auto' : 'Near only'); vr.style.cssText = 'background:#9ffcff;color:#111;border:0;border-radius:7px;padding:5px 10px'; vr.onclick = () => { FR.setRange(FR.range === 'auto' ? 'near' : 'auto'); vr.textContent = 'Voice: ' + (FR.range === 'auto' ? 'Auto' : 'Near only'); }; f.appendChild(vr);
    const c = document.createElement('button'); c.type = 'button'; c.textContent = 'Close'; c.style.cssText = 'background:#bbb;color:#111;border:0;border-radius:7px;padding:5px 10px'; c.onclick = () => htmlPanel(false); f.appendChild(c); el.appendChild(f); }
  FR.toggleHtml = () => htmlPanel(!FR.htmlOpen);
  // F = friends. A-Frame's own keyboard shortcut also uses F (enter VR / fullscreen, which put the canvas over every HTML panel), so take
  // the key in the capture phase and keep it from A-Frame; the menu's VR button still enters VR.
  const isF = e => (e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.metaKey && !e.altKey && !/INPUT|TEXTAREA/.test((e.target && e.target.tagName) || '') && !(e.target && e.target.isContentEditable);
  window.addEventListener('keydown', e => { if (!isF(e)) return; e.stopImmediatePropagation(); if (!e.repeat) FR.toggleHtml(); }, true);
  window.addEventListener('keyup', e => { if (isF(e)) e.stopImmediatePropagation(); }, true);
  function wire() { const tools = document.querySelector('#ui .tools'); if (!tools) return setTimeout(wire, 500);
    if (!document.getElementById('friendsbtn')) { const b = document.createElement('button'); b.id = 'friendsbtn'; b.type = 'button'; b.textContent = 'Friends'; b.style.cssText = 'background:#ffd700;color:#111;font-weight:600'; b.onclick = ev => { ev.stopPropagation(); FR.toggleHtml(); }; tools.appendChild(b); }
    if (!document.getElementById('voicerange')) { const b = document.createElement('button'); b.id = 'voicerange'; b.type = 'button'; b.style.cssText = 'background:#9ffcff;color:#111'; b.onclick = () => FR.setRange(FR.range === 'auto' ? 'near' : 'auto'); tools.appendChild(b); renderBtns(); } }
  wire();

  /* ---------- per-frame: palm-up detection, wrist refresh, Go fade ---------- */
  const ax = V(), q = new THREE.Quaternion();
  AFRAME.registerSystem('w3d-friends', { tick: function () {
    const now = performance.now(); if (go) step(now);
    const sc = this.el; if (!sc.is('vr-mode')) { if (wrist && !FR._debug) showPanel(false); if (FR.htmlOpen && now - lastDraw > 1000) { lastDraw = now; htmlPanel(true); } return; }
    const L = document.querySelector('[laser-controls*="left"]'); if (!L || !L.object3D.visible) { if (wrist) showPanel(false); return; }
    L.object3D.getWorldQuaternion(q); ax.set(1, 0, 0).applyQuaternion(q);    // left controller: palm faces local +x; palm up = +x points up
    const up = ax.y; if (!palm && up > 0.82) palm = true; else if (palm && up < 0.34) palm = false;   // ~55 deg on, ~20 deg off (wider than before: the panel no longer turns with the hand, so it can stay up while you aim at it)
    const list = palm ? people() : []; buildWrist();
    if (!palm) { showPanel(false); return; }
    placeWrist(L, sc.camera); showPanel(true);
    if (now - lastDraw > 250) { lastDraw = now; const me = camPos(); drawWrist(list, me, sc.camera.parent ? new THREE.Euler().setFromQuaternion(sc.camera.getWorldQuaternion(new THREE.Quaternion()), 'YXZ').y : 0); }
  } });
})();
