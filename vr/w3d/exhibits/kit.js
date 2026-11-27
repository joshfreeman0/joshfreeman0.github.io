/* FPX exhibit kit (T-30, Nov 27 2026): shared helpers for self-contained exhibit modules (Drone Hangar, Phreaking Lab, Foresight).
   Modules only need global THREE (+ A-Frame for buttons and drone mode), never W3D, so the same build() can be mounted in
   Fowling Pond (w3d/t30site.js), inside an FP_ROOMS room (Tesseract) or in Red Planet Lounge.
   - FPX.panel(w, h, blocks, opts): canvas text panel (one mesh).
   - FPX.parts(): merge many boxes / cylinders into ONE vertex-coloured mesh (one draw call).
   - FPX.buttons(group, specs): invisible A-Frame hit planes (class .btn, laser / mouse / tap) parented to a module group.
   - FPX.audio: WebAudio tones (2600 Hz whistle, MF blue-box pairs, Morse).
   - FPX.link(url): opens a site in 2D; inside VR it keeps the link and offers it when you leave VR (no kick-out).
   - FPX.drone: flyable camera-drone mode (Quest sticks, keyboard, touch), returns you to where you were. */
(function () {
  'use strict';
  if (window.FPX && window.FPX.kit) return;
  const FPX = window.FPX = window.FPX || {}; FPX.kit = 1;
  /* assets resolve next to this file, so the same modules work from joshfreeman.org/vr/ or when Red Planet Lounge loads them by absolute URL */
  FPX.base = (function () { const s = document.currentScript && document.currentScript.src; return s ? s.replace(/[^/]*$/, '') : '/vr/w3d/exhibits/'; })();
  FPX.tex = function (file) { const t = new THREE.TextureLoader().load(FPX.base + 'img/' + file); t.colorSpace = THREE.SRGBColorSpace; return t; };
  const hud = m => { if (window.JFVR && JFVR.hud) JFVR.hud(m); };
  const scene = () => document.querySelector('a-scene');
  const inXR = () => { const s = scene(); return !!(s && s.renderer && s.renderer.xr && s.renderer.xr.isPresenting); };
  FPX.inXR = inXR; FPX.hud = hud;

  /* ---------- canvas text panel ---------- */
  function wrap(g, text, maxW) { const words = String(text).split(' '), lines = []; let cur = '';
    for (const w of words) { const t = cur ? cur + ' ' + w : w; if (g.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; } if (cur) lines.push(cur); return lines; }
  const F = {title: ['bold', 58, '#FFD700', 1], sub: ['bold', 38, '#9ffcff', 1], body: ['', 31, '#f2ead8', 0], quote: ['italic', 31, '#ffe9a8', 1], small: ['', 25, '#c9c2b0', 0], big: ['bold', 66, '#111', 1]};
  FPX.panel = function (w, h, blocks, opts) { opts = opts || {}; const PX = opts.px || 1024, c = document.createElement('canvas'); c.width = PX; c.height = Math.round(PX * h / w); const g = c.getContext('2d');
    g.fillStyle = opts.bg || '#0b1d26'; g.fillRect(0, 0, c.width, c.height); if (opts.frame !== false) { g.strokeStyle = opts.frame || '#d4af37'; g.lineWidth = 12; g.strokeRect(6, 6, c.width - 12, c.height - 12); }
    let y = opts.top != null ? opts.top : 48; const M = 46, sc = PX / 1024;
    for (const b of blocks || []) { const f = F[b.s || 'body'], fs = Math.round(f[1] * sc * (b.k || 1)); const face = f[3] ? 'Georgia, "Times New Roman", serif' : 'Arial, sans-serif'; g.font = f[0] + ' ' + fs + 'px ' + face;
      if (b.fit) { let s2 = fs; while (g.measureText(b.t).width > c.width - 2 * M && s2 > 12) { s2 -= 2; g.font = f[0] + ' ' + s2 + 'px ' + face; } y = (c.height - s2) / 2; }
      g.fillStyle = b.c || f[2]; g.textBaseline = 'top'; g.textAlign = opts.center ? 'center' : 'left';
      for (const ln of wrap(g, b.t, c.width - 2 * M)) { g.fillText(ln, opts.center ? c.width / 2 : M, y); y += fs * 1.25; } y += b.gap != null ? b.gap : fs * 0.4; }
    if (opts.foot) { g.font = 'italic ' + Math.round(22 * sc) + 'px Georgia, serif'; g.fillStyle = '#b9a874'; g.textAlign = 'center'; g.textBaseline = 'bottom'; g.fillText(opts.foot, c.width / 2, c.height - 22 * sc); }
    if (opts.draw) opts.draw(g, c.width, c.height, y);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({map: tex, toneMapped: false, side: opts.double ? THREE.DoubleSide : THREE.FrontSide}));
    m.userData.canvas = c; return m; };

  /* ---------- merged vertex-coloured parts (one draw call per builder) ---------- */
  FPX.parts = function () { const list = []; const col = new THREE.Color(), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), one = new THREE.Vector3(1, 1, 1);
    const P = {
      add(geo, color, x, y, z, rx, ry, rz, s) { e.set(rx || 0, ry || 0, rz || 0); q.setFromEuler(e); m4.compose(new THREE.Vector3(x || 0, y || 0, z || 0), q, s ? new THREE.Vector3(s, s, s) : one);
        const g = (geo.index ? geo.toNonIndexed() : geo.clone()); g.applyMatrix4(m4); list.push([g, color]); return P; },
      box(w, h, d, x, y, z, color, ry) { return P.add(new THREE.BoxGeometry(w, h, d), color, x, y, z, 0, ry || 0, 0); },
      cyl(rt, rb, h, seg, x, y, z, color, rx, ry, rz, open, t0, tl) { return P.add(new THREE.CylinderGeometry(rt, rb, h, seg || 12, 1, !!open, t0 || 0, tl == null ? Math.PI * 2 : tl), color, x, y, z, rx, ry, rz); },
      geometry() { let n = 0; for (const [g] of list) n += g.attributes.position.count;
        const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), clr = new Float32Array(n * 3); let o = 0;
        for (const [g, c] of list) { const p = g.attributes.position, nn = g.attributes.normal; col.set(c); for (let i = 0; i < p.count; i++, o++) {
          pos[o * 3] = p.getX(i); pos[o * 3 + 1] = p.getY(i); pos[o * 3 + 2] = p.getZ(i); nor[o * 3] = nn.getX(i); nor[o * 3 + 1] = nn.getY(i); nor[o * 3 + 2] = nn.getZ(i); clr[o * 3] = col.r; clr[o * 3 + 1] = col.g; clr[o * 3 + 2] = col.b; } g.dispose(); }
        const G = new THREE.BufferGeometry(); G.setAttribute('position', new THREE.BufferAttribute(pos, 3)); G.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); G.setAttribute('color', new THREE.BufferAttribute(clr, 3)); G.computeBoundingSphere(); list.length = 0; return G; },
      mesh(opts) { opts = opts || {}; const m = new THREE.Mesh(P.geometry(), new THREE.MeshStandardMaterial({vertexColors: true, roughness: opts.rough != null ? opts.rough : 0.75, metalness: opts.metal || 0.1, side: opts.double ? THREE.DoubleSide : THREE.FrontSide, emissive: opts.emissive || 0x000000}));
        m.castShadow = opts.shadow !== false; m.receiveShadow = true; return m; } };
    return P; };

  /* ---------- buttons: invisible hit planes parented to the exhibit group ---------- */
  FPX.buttons = function (group, specs) { const s = scene(), els = [];
    for (const b of specs) { const e = document.createElement('a-plane'); e.setAttribute('class', 'btn'); e.setAttribute('width', b.w); e.setAttribute('height', b.h);
      e.setAttribute('material', 'shader:flat;visible:false'); if (b.id) e.id = b.id; let last = 0;
      e.addEventListener('click', () => { const t = performance.now(); if (t - last < 250) return; last = t; try { b.onClick(); } catch (err) { console.warn('[FPX] button', err); } });
      e.addEventListener('loaded', () => { group.add(e.object3D); e.object3D.position.set(b.x, b.y, b.z); e.object3D.rotation.set(b.rx || 0, b.ry || 0, 0); });
      s.appendChild(e); els.push(e); }
    const api = {els, enable(on) { els.forEach(e => { if (on) e.classList.add('btn'); else e.classList.remove('btn'); }); FPX.refreshRays(); },
      dispose() { els.forEach(e => { if (e.object3D.parent) e.object3D.parent.remove(e.object3D); e.parentNode && e.parentNode.removeChild(e); }); els.length = 0; FPX.refreshRays(); }};
    setTimeout(FPX.refreshRays, 300); return api; };
  FPX.refreshRays = () => document.querySelectorAll('[raycaster]').forEach(r => r.components.raycaster && r.components.raycaster.refreshObjects());

  /* ---------- audio ---------- */
  let AC = null, master = null;
  function ctx() { if (!AC) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; AC = new C(); master = AC.createGain(); master.gain.value = 0.9; master.connect(AC.destination); }
    if (AC.state === 'suspended') AC.resume(); return AC; }
  function tone(freqs, t0, dur, gain) { const a = ctx(); if (!a) return; const g = a.createGain(); g.connect(master); const T = a.currentTime + (t0 || 0);
    g.gain.setValueAtTime(0, T); g.gain.linearRampToValueAtTime(gain, T + 0.008); g.gain.setValueAtTime(gain, T + dur - 0.012); g.gain.linearRampToValueAtTime(0, T + dur);
    for (const f of freqs) { const o = a.createOscillator(); o.type = 'sine'; o.frequency.value = f; o.connect(g); o.start(T); o.stop(T + dur + 0.02); } }
  /* R1 / Bell "MF" signalling pairs (Hz) - historical; no modern network responds to them */
  const MF = {'1': [700, 900], '2': [700, 1100], '3': [900, 1100], '4': [700, 1300], '5': [900, 1300], '6': [1100, 1300], '7': [700, 1500], '8': [900, 1500], '9': [1100, 1500], '0': [1300, 1500], KP: [1100, 1700], ST: [1500, 1700]};
  FPX.audio = {ctx, tone, MF,
    whistle(dur) { const a = ctx(); if (!a) return; dur = dur || 1.1; const T = a.currentTime, g = a.createGain(), o = a.createOscillator(), lfo = a.createOscillator(), lg = a.createGain();
      o.type = 'sine'; o.frequency.value = 2600; lfo.frequency.value = 5.5; lg.gain.value = 6; lfo.connect(lg); lg.connect(o.frequency);   // a toy whistle wavers a little
      g.gain.setValueAtTime(0, T); g.gain.linearRampToValueAtTime(0.09, T + 0.05); g.gain.setValueAtTime(0.09, T + dur - 0.08); g.gain.linearRampToValueAtTime(0, T + dur);
      o.connect(g); g.connect(master); o.start(T); lfo.start(T); o.stop(T + dur + 0.05); lfo.stop(T + dur + 0.05); },
    mf(key, t0) { const f = MF[key]; if (f) tone(f, t0 || 0, key === 'KP' ? 0.1 : 0.068, 0.12); },
    sequence(keys) { let t = 0; for (const k of keys) { if (k === '2600') { tone([2600], t, 1.0, 0.08); t += 1.6; } else { FPX.audio.mf(k, t); t += (k === 'KP' ? 0.1 : 0.068) + 0.068; } } return t; },
    morse(text, hz) { const C = {A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..', '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.'};
      const u = 0.075; let t = 0; for (const ch of text.toUpperCase()) { if (ch === ' ') { t += u * 4; continue; } const c = C[ch]; if (!c) continue; for (const s of c) { const d = s === '.' ? u : u * 3; tone([hz || 700], t, d, 0.1); t += d + u; } t += u * 2; } return t; }};

  /* ---------- links: never drop out of VR ---------- */
  let pending = null, bar = null;
  function banner(url, label) { if (!bar) { bar = document.createElement('div'); bar.style.cssText = 'position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:9999;background:#0b1d26;color:#f2ead8;border:2px solid #d4af37;border-radius:10px;padding:10px 14px;font:15px Arial,sans-serif;max-width:92vw';
      document.body.appendChild(bar); }
    bar.innerHTML = ''; const t = document.createElement('span'); t.textContent = 'From VR: '; const a = document.createElement('a'); a.href = url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = label || url; a.style.color = '#FFD700';
    const x = document.createElement('button'); x.textContent = 'x'; x.style.cssText = 'margin-left:12px;background:#333;color:#fff;border:0;border-radius:6px;padding:2px 8px'; x.onclick = () => { bar.style.display = 'none'; };
    bar.append(t, a, x); bar.style.display = 'block'; }
  FPX.link = function (url, label) { if (inXR()) { pending = [url, label]; hud('Saved ' + (label || url) + ' - it opens when you leave VR'); return; }
    const w = window.open(url, '_blank', 'noopener'); if (!w) banner(url, label); };
  (function hook() { const s = scene(); if (!s) return setTimeout(hook, 500); s.addEventListener('exit-vr', () => { if (pending) { banner(pending[0], pending[1]); pending = null; } if (FPX.drone.active) FPX.drone.exit(); }); })();

  /* ---------- drone mode ---------- */
  const D = FPX.drone = {active: false};
  const PAUSE = ['thumbstick-move', 'wasd-controls', 'w3d-physics', 'w3d-keys'];
  const keys = {}; let saved = null, opt = null, st = null, ov = null, camHud = null, hudT = 0, paused = [];
  const typing = t => t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
  document.addEventListener('keydown', e => { if (!D.active || typing(e.target)) return; keys[e.code] = true; if (e.code === 'Escape') D.exit(); if (/^(Space|Arrow)/.test(e.code)) e.preventDefault(); });
  document.addEventListener('keyup', e => { keys[e.code] = false; });
  function pads() { const s = scene(), ses = s && s.renderer && s.renderer.xr && s.renderer.xr.getSession && s.renderer.xr.getSession(), r = {};
    if (ses) for (const src of ses.inputSources) if (src.gamepad && src.handedness) r[src.handedness] = src.gamepad; return r; }
  const ax = (g, i) => g && g.axes && g.axes.length > i && Math.abs(g.axes[i]) > 0.15 ? g.axes[i] : 0;
  function overlay(on) { if (on && !ov) { ov = document.createElement('div'); ov.id = 'fpx-drone-ui'; ov.style.cssText = 'position:fixed;right:12px;bottom:90px;z-index:9998;display:grid;grid-template-columns:repeat(3,56px);gap:6px;font:bold 15px Arial,sans-serif';
      const mk = (lbl, code, col) => { const b = document.createElement('button'); b.textContent = lbl; b.style.cssText = 'height:48px;border-radius:10px;border:2px solid #d4af37;background:' + (col || '#0b1d26cc') + ';color:#ffe9a8;touch-action:none';
        if (code === 'exit') b.onclick = () => D.exit(); else { const dn = e => { e.preventDefault(); keys[code] = true; }, up = () => { keys[code] = false; };
          b.addEventListener('pointerdown', dn); b.addEventListener('pointerup', up); b.addEventListener('pointerleave', up); b.addEventListener('pointercancel', up); } return b; };
      ov.append(mk('\u21b6', 'KeyQ'), mk('Up', 'Space'), mk('\u21b7', 'KeyE'), mk('Fwd', 'KeyW'), mk('Down', 'KeyC'), mk('Back', 'KeyS'));
      const x = mk('Exit drone', 'exit', '#8a1c1c'); x.style.gridColumn = 'span 3'; ov.append(x);
      const tip = document.createElement('div'); tip.style.cssText = 'grid-column:span 3;color:#ffe9a8;background:#0008;padding:4px 6px;border-radius:6px;font:12px Arial'; tip.textContent = 'WASD move, Q/E turn, Space up, C down, Esc exit'; ov.append(tip);
      document.body.appendChild(ov); }
    if (ov) ov.style.display = on && !inXR() ? 'grid' : 'none'; }
  function camOverlay(on) { const cam = document.querySelector('[camera]'); if (!cam) return;
    if (on && !camHud) { const c = document.createElement('canvas'); c.width = 512; c.height = 64; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
      camHud = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.0625), new THREE.MeshBasicMaterial({map: t, transparent: true, depthTest: false, toneMapped: false})); camHud.renderOrder = 999; camHud.position.set(0, -0.2, -0.7); camHud.userData.c = c; }
    if (camHud) { if (on) cam.object3D.add(camHud); else if (camHud.parent) camHud.parent.remove(camHud); } }
  // the drone-cam HUD (1 plane + 1 canvas texture) is shared by every exhibit; freed when the last exhibit unmounts (refcount = MOUNTS)
  D.freeHud = function () { if (!camHud || D.active) return; if (camHud.parent) camHud.parent.remove(camHud); camHud.geometry.dispose(); camHud.material.map.dispose(); camHud.material.dispose(); camHud = null; };
  function drawHud(alt) { if (!camHud) return; const c = camHud.userData.c, g = c.getContext('2d'); g.clearRect(0, 0, 512, 64); g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(0, 0, 512, 64);
    g.fillStyle = (performance.now() % 1000) < 500 ? '#ff3030' : '#601010'; g.beginPath(); g.arc(24, 32, 9, 0, 7); g.fill(); g.fillStyle = '#ffe9a8'; g.font = 'bold 22px Arial'; g.textBaseline = 'middle';
    g.fillText('DRONE CAM  ' + Math.round(alt) + ' m   ' + (inXR() ? 'B = return' : 'Esc = return'), 44, 32); camHud.material.map.needsUpdate = true; }
  /* opts: {x, y, z, yaw (rad), center: {x, z}, radius, maxAlt, groundAt(x, z, y) -> y, onExit()} */
  D.enter = function (o) { if (D.active) return; const s = scene(), rig = document.querySelector('#rig'); if (!s || !rig) return; opt = o; D.active = true;
    saved = {p: rig.object3D.position.clone(), ry: rig.object3D.rotation.y, fly: window.JFVR ? JFVR.fly : false};
    paused = []; rig.querySelectorAll('*').forEach(el => PAUSE.forEach(n => { const c = el.components && el.components[n]; if (c && c.isPlaying) { c.pause(); paused.push(c); } }));
    PAUSE.forEach(n => { const c = rig.components[n]; if (c && c.isPlaying) { c.pause(); paused.push(c); } });
    st = {x: o.x, y: o.y, z: o.z, yaw: o.yaw || 0, vx: 0, vy: 0, vz: 0, vyaw: 0, bExit: false};
    if (!AFRAME.components['fpx-drone-tick']) AFRAME.registerComponent('fpx-drone-tick', {tock(t, dt) { if (D.active && dt) step(Math.min(dt, 60) / 1000); }});
    s.setAttribute('fpx-drone-tick', ''); overlay(true); camOverlay(true); hud(inXR() ? 'Drone mode: left stick move, right stick turn / climb, B to return' : 'Drone mode: WASD / arrows, Q E turn, Space up, C down, Esc to return'); };
  D.exit = function () { if (!D.active) return; D.active = false; const rig = document.querySelector('#rig');
    if (rig && saved) { rig.object3D.position.copy(saved.p); rig.object3D.rotation.y = saved.ry; }
    paused.forEach(c => { try { c.play(); } catch (e) {} }); paused = [];
    const ph = rig && rig.components['w3d-physics']; if (ph && ph.prev) { ph.prev.copy(rig.object3D.position); ph.vy = 0; }
    overlay(false); camOverlay(false); for (const k in keys) keys[k] = false; hud('Back on the ground'); const cb = opt && opt.onExit; opt = null; if (cb) cb(); if (!MOUNTS.size) D.freeHud(); };
  const _cw = new THREE.Vector3();
  function step(dt) { const rig = document.querySelector('#rig'), cam = document.querySelector('[camera]'); if (!rig || !cam || !st) return;
    const P = pads(), L = P.left, R = P.right; const ta = (window.JFVR && JFVR.touchAxes) || {x: 0, y: 0};
    let mx = ax(L, 2) || (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0) || (Math.abs(ta.x) > 0.1 ? ta.x : 0);
    let mz = ax(L, 3) || (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0) || (Math.abs(ta.y) > 0.1 ? ta.y : 0);
    const turn = ax(R, 2) || (keys.KeyE ? 1 : 0) - (keys.KeyQ ? 1 : 0), climb = -ax(R, 3) || (keys.Space || keys.KeyR ? 1 : 0) - (keys.KeyC || keys.ShiftLeft || keys.ShiftRight ? 1 : 0);
    const bPressed = R && R.buttons && R.buttons[5] && R.buttons[5].pressed; if (bPressed && !st.bExit) { st.bExit = true; D.exit(); return; } if (!bPressed) st.bExit = false;
    const fast = (L && L.buttons && L.buttons[1] && L.buttons[1].value > 0.5) ? 2.2 : 1, SP = 7 * fast, VS = 3.5, YS = 1.1, k = Math.min(1, dt * 3);
    const s = Math.sin(st.yaw), c = Math.cos(st.yaw); const tvx = (mx * c + mz * s) * SP, tvz = (-mx * s + mz * c) * SP;
    st.vx += (tvx - st.vx) * k; st.vz += (tvz - st.vz) * k; st.vy += (climb * VS - st.vy) * k; st.vyaw += (-turn * YS - st.vyaw) * Math.min(1, dt * 6);
    st.x += st.vx * dt; st.z += st.vz * dt; st.y += st.vy * dt; st.yaw += st.vyaw * dt;
    const o = opt || {}; if (o.center) { const dx = st.x - o.center.x, dz = st.z - o.center.z, d = Math.hypot(dx, dz), R0 = o.radius || 300; if (d > R0) { st.x = o.center.x + dx * R0 / d; st.z = o.center.z + dz * R0 / d; if (performance.now() - hudT > 2500) { hudT = performance.now(); hud('Drone range limit'); } } }
    const g = o.groundAt ? o.groundAt(st.x, st.z, st.y) : 0, gg = isFinite(g) ? g : 0; if (st.y < gg + 0.6) { st.y = gg + 0.6; if (st.vy < 0) st.vy = 0; } if (st.y > gg + (o.maxAlt || 120)) st.y = gg + (o.maxAlt || 120);
    const rp = rig.object3D.position; rig.object3D.rotation.y = st.yaw; rig.object3D.updateMatrixWorld(true); cam.object3D.getWorldPosition(_cw);
    rp.x += st.x - _cw.x; rp.y += st.y - _cw.y; rp.z += st.z - _cw.z;
    if (performance.now() - (D._h || 0) > 250) { D._h = performance.now(); drawHud(st.y - gg); } }
  D.state = () => st;
  /* scripted ride (Loop tunnel etc.): FPX.ride({points: [THREE.Vector3 world], dur: s, yawFollow: true, onEnd}) - same pause / restore as the drone */
  const RIDE = FPX.ride = function (o) { if (D.active || RIDE.active) return; const rig = document.querySelector('#rig'), s = scene(); if (!rig || !o.points || o.points.length < 2) return;
    RIDE.active = true; const sv = {p: rig.object3D.position.clone(), ry: rig.object3D.rotation.y}, pz = [];
    rig.querySelectorAll('*').forEach(el => PAUSE.forEach(n => { const c = el.components && el.components[n]; if (c && c.isPlaying) { c.pause(); pz.push(c); } }));
    PAUSE.forEach(n => { const c = rig.components[n]; if (c && c.isPlaying) { c.pause(); pz.push(c); } });
    const curve = new THREE.CatmullRomCurve3(o.points), t0 = performance.now(), dur = (o.dur || 12) * 1000, tmp = new THREE.Vector3(), nx = new THREE.Vector3(), cw = new THREE.Vector3();
    function end() { RIDE.active = false; s.removeEventListener('fpx-ride-tick', tick); rig.object3D.position.copy(sv.p); rig.object3D.rotation.y = sv.ry; pz.forEach(c => { try { c.play(); } catch (e) {} });
      const ph = rig.components['w3d-physics']; if (ph && ph.prev) { ph.prev.copy(rig.object3D.position); ph.vy = 0; } if (o.onEnd) o.onEnd(); }
    RIDE.stop = end;
    function tick() { const u = Math.min(1, (performance.now() - t0) / dur), e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; curve.getPointAt(e, tmp); curve.getPointAt(Math.min(1, e + 0.01), nx);
      if (o.yawFollow !== false && nx.distanceTo(tmp) > 1e-4) rig.object3D.rotation.y = Math.atan2(-(nx.x - tmp.x), -(nx.z - tmp.z));
      rig.object3D.updateMatrixWorld(true); document.querySelector('[camera]').object3D.getWorldPosition(cw); const rp = rig.object3D.position; rp.x += tmp.x - cw.x; rp.y += tmp.y - cw.y; rp.z += tmp.z - cw.z;
      if (o.onTick) o.onTick(tmp, rig.object3D.rotation.y, u); if (u >= 1) end(); }
    if (!AFRAME.components['fpx-ride-tick']) AFRAME.registerComponent('fpx-ride-tick', {tock() { this.el.emit('fpx-ride-tick', null, false); }});
    if (!s.hasAttribute('fpx-ride-tick')) s.setAttribute('fpx-ride-tick', ''); s.addEventListener('fpx-ride-tick', tick); hud(o.label || 'Enjoy the ride'); };

  /* ---------- world-agnostic mount: FPX.mount(name, sceneEl, rootEl, opts) -> {inst, group, unmount()} ----------
     name: 'hangar' | 'phreaklab' | 'foresight' | 'planet' | 'starmind' | 'terafab' | 'tesla' | 'boring' | 'solarcity'. rootEl: an A-Frame entity or any THREE.Object3D (default: scene).
     opts: {position: {x, y, z}, rotationY (rad), lite, groundAt(x, z, y) (drone floor; defaults to the mount height), radius}.
     No a-scene, renderer or XR session of its own: everything joins the host scene. */
  const MOUNTS = new Set();
  FPX.mount = function (name, sceneEl, rootEl, opts) { opts = opts || {}; const M = FPX[name]; if (!M || !M.build) throw new Error('FPX: unknown exhibit ' + name);
    const inst = M.build(opts), root = rootEl && rootEl.object3D ? rootEl.object3D : (rootEl && rootEl.isObject3D ? rootEl : (sceneEl || scene()).object3D);
    const p = opts.position || {x: 0, y: 0, z: 0}; inst.group.position.set(p.x, p.y, p.z); inst.group.rotation.y = opts.rotationY || 0; root.add(inst.group);
    if (inst.mountButtons) inst.mountButtons(); const h = {name, inst, group: inst.group, t0: performance.now(), unmount() { if (!MOUNTS.delete(h)) return; inst.dispose(); if (!MOUNTS.size) D.freeHud(); }}; MOUNTS.add(h);
    const s = sceneEl || scene(); if (!AFRAME.components['fpx-exhibits-tick']) AFRAME.registerComponent('fpx-exhibits-tick', {tick() { const t = performance.now(); MOUNTS.forEach(m => { if (m.inst.update && m.group.visible) m.inst.update((t - m.t0) / 1000); }); }});
    if (!s.hasAttribute('fpx-exhibits-tick')) s.setAttribute('fpx-exhibits-tick', '');
    return h; };
  FPX.setVisible = function (h, v) { h.group.visible = v; if (h.inst.buttons) h.inst.buttons.enable(v); };
})();
