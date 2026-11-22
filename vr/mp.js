/* Multiplayer for Josh Freeman's VR World (joshfreeman.org/vr).
   Free, serverless: peer-to-peer WebRTC (Trystero, bundled in mp-p2p.js) with
   public Nostr relays for matchmaking only. Anyone who opens the page joins one
   shared room, appears as a gold avatar (head + hands + guest name), and can
   talk by voice once they tap "Join voice". No accounts, no text chat.
   Click/point at someone's head to mute or unmute them for yourself. */
(function () {
  'use strict';
  const APP = 'joshfreeman.org', ROOM = 'joshfreeman-vr-world', CAP = 8, HZ = 15;
  const NAMES = ['Ibis', 'Falcon', 'Scarab', 'Lotus', 'Jackal', 'Heron', 'Oryx', 'Lion', 'Crane', 'Papyrus', 'Cobra', 'Sphinx', 'Ankh', 'Kestrel', 'Lynx', 'Gazelle', 'Hawk', 'Palm', 'Sunbird', 'Owl'];
  const MP = window.JFMP = { peers: {}, voice: 'off', name: 'Guest ' + NAMES[Math.floor(Math.random() * NAMES.length)], room: null, status: 'connecting' };
  const V3 = () => new THREE.Vector3(), Q = () => new THREE.Quaternion();
  let scn, cam, hands = {}, listener, ui = {}, micStream = null;

  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function hud(t) { if (window.JFVR && JFVR.hud) JFVR.hud(t); }
  function sceneId() {
    if (window.W3D && W3D.active) return 'world';
    const sky = document.querySelector('#sky'), hs = sky && sky.getAttribute('hd-sky');
    const src = (hs && (hs.src || hs)) || '';
    const m = String(src).match(/pano_([a-z0-9]+)/i);
    return 'pano:' + (m ? m[1] : '?');
  }
  /* In 360 photo scenes everyone stands at the same spot, so give each person a seat on a ring. */
  function seat(id) { const a = (hash(id) % 12) / 12 * Math.PI * 2; return new THREE.Vector3(Math.sin(a) * 1.8, 0, -Math.cos(a) * 1.8); }
  function r3(v) { return [+v.x.toFixed(3), +v.y.toFixed(3), +v.z.toFixed(3)]; }
  function r4(q) { return [+q.x.toFixed(4), +q.y.toFixed(4), +q.z.toFixed(4), +q.w.toFixed(4)]; }

  /* ---------- 2D overlay ---------- */
  function buildUI() {
    const tools = document.querySelector('#ui .tools');
    const cnt = document.createElement('span'); cnt.id = 'mpcount';
    cnt.style.cssText = 'font-size:13px;color:#ffe9a8;margin:0 6px;white-space:nowrap';
    cnt.textContent = 'Connecting...';
    const vb = document.createElement('button'); vb.id = 'mpvoice'; vb.type = 'button'; vb.textContent = 'Join voice';
    vb.style.cssText = 'background:#FFD700;color:#111;font-weight:600';
    if (tools) { tools.appendChild(vb); tools.appendChild(cnt); }
    else { /* fallback if the page layout changes: small fixed chip top-left */
      const box = document.createElement('div'); box.id = 'mpbox';
      box.style.cssText = 'position:fixed;top:10px;left:10px;z-index:20;font-family:system-ui,sans-serif;display:flex;gap:8px;align-items:center;background:rgba(0,0,0,.6);padding:6px 8px;border-radius:10px';
      vb.style.cssText += ';padding:8px 12px;border-radius:8px;border:0;cursor:pointer'; box.appendChild(vb); box.appendChild(cnt); document.body.appendChild(box);
    }
    ui.count = cnt; ui.btn = vb;
    ui.btn.addEventListener('click', toggleVoice);
    /* VR menu: a gold Voice button + people count under the existing buttons */
    const bar = document.querySelector('#vrbar');
    if (bar) {
      let minY = 0;
      bar.querySelectorAll('a-plane').forEach(p => { const y = p.object3D ? p.object3D.position.y : 0; if (y < minY) minY = y; });
      const y = (minY - 0.35).toFixed(2);
      const b = document.createElement('a-plane');
      b.setAttribute('class', 'btn'); b.id = 'mpvrvoice';
      b.setAttribute('position', '0 ' + y + ' 0'); b.setAttribute('width', '1.4'); b.setAttribute('height', '0.26');
      b.setAttribute('material', 'shader:flat;color:#FFD700');
      b.innerHTML = '<a-text value="Voice: join" align="center" color="#111" width="2.4"></a-text>';
      b.addEventListener('click', toggleVoice);
      bar.appendChild(b);
      const t = document.createElement('a-text');
      t.id = 'mpvrcount'; t.setAttribute('value', 'Connecting...'); t.setAttribute('align', 'center');
      t.setAttribute('color', '#FFD700'); t.setAttribute('width', '2'); t.setAttribute('position', '0 ' + (minY - 0.6).toFixed(2) + ' 0');
      bar.appendChild(t);
      ui.vrbtn = b; ui.vrcount = t;
      setTimeout(() => document.querySelectorAll('[raycaster]').forEach(r => r.components.raycaster && r.components.raycaster.refreshObjects()), 500);
    }
    renderUI();
  }
  function renderUI() {
    const n = 1 + Object.keys(MP.peers).length;
    const c = MP.status === 'full' ? 'World is full (' + CAP + ')' : MP.status === 'error' ? 'Multiplayer offline' : n + (n === 1 ? ' person here' : ' people here');
    const v = MP.voice === 'off' ? 'Join voice' : MP.voice === 'on' ? 'Mic on - tap to mute' : MP.voice === 'muted' ? 'Mic muted - tap to talk' : MP.voice === 'wait' ? 'Allow microphone...' : 'No microphone';
    if (ui.count) ui.count.textContent = c + ' (you: ' + MP.name + ')';
    if (ui.btn) { ui.btn.textContent = v; ui.btn.style.background = MP.voice === 'on' ? '#fff' : '#FFD700'; }
    if (ui.vrcount) ui.vrcount.setAttribute('value', c);
    if (ui.vrbtn) { const tx = ui.vrbtn.querySelector('a-text'); tx && tx.setAttribute('value', 'Voice: ' + (MP.voice === 'off' ? 'join' : MP.voice === 'on' ? 'ON (tap to mute)' : MP.voice === 'muted' ? 'muted' : MP.voice === 'wait' ? '...' : 'no mic')); ui.vrbtn.setAttribute('material', 'color', MP.voice === 'on' ? '#ffffff' : '#FFD700'); }
  }

  /* ---------- audio ---------- */
  function ensureListener() {
    if (!listener) { listener = new THREE.AudioListener(); cam.object3D.add(listener); }
    if (listener.context.state !== 'running') listener.context.resume().catch(() => {});
    return listener;
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach(ev => window.addEventListener(ev, () => cam && ensureListener(), { passive: true }));

  async function toggleVoice() {
    ensureListener();
    if (!MP.room) return;
    if (MP.voice === 'off' || MP.voice === 'nomic') {
      MP.voice = 'wait'; renderUI();
      try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false });
        MP.room.addStream(micStream);
        MP.voice = 'on'; hud('Voice on - others can hear you');
      } catch (e) { MP.voice = 'nomic'; hud('Microphone blocked: ' + (e && e.name || e)); }
    } else if (micStream) {
      const on = MP.voice !== 'on';
      micStream.getAudioTracks().forEach(t => t.enabled = on);
      MP.voice = on ? 'on' : 'muted'; hud(on ? 'Mic on' : 'Mic muted');
    }
    renderUI();
  }
  function attachStream(p, stream) {
    if (!stream.getAudioTracks().length) return;
    p.stream = stream;
    /* Chrome only feeds remote WebRTC audio into WebAudio while a media element plays it */
    const a = document.createElement('audio'); a.muted = true; a.autoplay = true; a.playsInline = true; a.srcObject = stream; a.style.display = 'none';
    document.body.appendChild(a); a.play().catch(() => {}); p.audioEl = a;
    const L = ensureListener();
    if (p.sound) { try { p.sound.disconnect(); } catch (e) {} p.head.object3D.remove(p.sound); }
    const s = new THREE.PositionalAudio(L);
    s.setMediaStreamSource(stream);
    s.setRefDistance(2); s.setRolloffFactor(1.2); s.setDistanceModel('inverse');
    s.setVolume(p.localMute ? 0 : 1);
    p.headMesh.add(s); p.sound = s;
    p.el.setAttribute('data-audio', 'connected');
    updateTag(p);
  }

  /* ---------- avatars ---------- */
  function makeAvatar(id) {
    const root = document.createElement('a-entity');
    root.id = 'mp-' + id; root.className = 'mp-avatar'; root.setAttribute('visible', false);
    root.innerHTML =
      '<a-entity class="mp-head">' +
        '<a-sphere class="btn mp-click" radius="0.14" segments-width="24" segments-height="16" scale="0.9 1.05 1" material="color:#d4af37;metalness:0.55;roughness:0.35;emissive:#6b5115;emissiveIntensity:0.6"></a-sphere>' +
        '<a-box position="0 0.075 0.01" width="0.27" height="0.05" depth="0.25" material="color:#1d3f8a;emissive:#0d2050;emissiveIntensity:0.6"></a-box>' +
        '<a-sphere position="-0.045 0.02 -0.118" radius="0.02" material="color:#111;shader:flat"></a-sphere>' +
        '<a-sphere position="0.045 0.02 -0.118" radius="0.02" material="color:#111;shader:flat"></a-sphere>' +
        '<a-cone position="0 -0.02 -0.14" rotation="-90 0 0" radius-bottom="0.02" radius-top="0" height="0.05" material="color:#b8902c;emissive:#4a3810"></a-cone>' +
        '<a-entity class="mp-tag" position="0 0.3 0"><a-plane width="0.62" height="0.13" material="shader:flat;color:#000;opacity:0.55;transparent:true"></a-plane><a-text class="mp-name" value="Guest" align="center" color="#FFD700" width="1.25" position="0 0 0.002"></a-text></a-entity>' +
      '</a-entity>' +
      '<a-sphere class="mp-hl" radius="0.045" visible="false" material="color:#d4af37;metalness:0.5;roughness:0.4;emissive:#6b5115;emissiveIntensity:0.6"></a-sphere>' +
      '<a-sphere class="mp-hr" radius="0.045" visible="false" material="color:#d4af37;metalness:0.5;roughness:0.4;emissive:#6b5115;emissiveIntensity:0.6"></a-sphere>';
    scn.appendChild(root);
    const p = { id, el: root, head: root.querySelector('.mp-head'), name: 'Guest', localMute: false, scene: null,
      hp: V3(), hq: Q(), tp: null, tq: Q(), lp: V3(), rp: V3(), tl: null, tr: null, seen: 0 };
    p.headMesh = p.head.object3D;
    p.tag = root.querySelector('.mp-name'); p.tagEnt = root.querySelector('.mp-tag');
    p.hl = root.querySelector('.mp-hl'); p.hr = root.querySelector('.mp-hr');
    root.querySelector('.mp-click').addEventListener('click', e => {
      p.localMute = !p.localMute; if (p.sound) p.sound.setVolume(p.localMute ? 0 : 1);
      updateTag(p); hud(p.name + (p.localMute ? ' muted for you' : ' unmuted'));
      e.stopPropagation && e.stopPropagation();
    });
    setTimeout(() => document.querySelectorAll('[raycaster]').forEach(r => r.components.raycaster && r.components.raycaster.refreshObjects()), 300);
    return p;
  }
  function updateTag(p) { p.tag.setAttribute('value', p.name + (p.localMute ? ' (muted)' : '')); }
  function removePeer(id) {
    const p = MP.peers[id]; if (!p) return;
    if (p.sound) { try { p.sound.disconnect(); } catch (e) {} }
    if (p.audioEl) { p.audioEl.srcObject = null; p.audioEl.remove(); }
    p.el.parentNode && p.el.parentNode.removeChild(p.el);
    delete MP.peers[id]; hud(p.name + ' left'); renderUI();
  }

  /* ---------- local pose ---------- */
  function handPos(el) {
    if (!el || !el.object3D.visible) return 0;
    const tc = el.components && el.components['tracked-controls'];
    if (!tc || !tc.controller) return 0;
    return r3(el.object3D.getWorldPosition(V3()));
  }
  function myPose() {
    const o = cam.object3D;
    return { n: MP.name, s: sceneId(), h: r3(o.getWorldPosition(V3())).concat(r4(o.getWorldQuaternion(Q()))), l: handPos(hands.l), r: handPos(hands.r), v: MP.voice === 'on' ? 1 : 0 };
  }

  function onPose(d, peerId) {
    const p = MP.peers[peerId]; if (!p || !d || !d.h) return;
    if (d.n && d.n !== p.name) { p.name = String(d.n).slice(0, 24); updateTag(p); if (!p.announced) { p.announced = 1; hud(p.name + ' is here'); } }
    p.scene = d.s;
    const tp = new THREE.Vector3(d.h[0], d.h[1], d.h[2]);
    if (String(d.s).startsWith('pano:') && MP.selfId) tp.add(seat(peerId)).sub(seat(MP.selfId));
    const off = tp.clone().sub(new THREE.Vector3(d.h[0], d.h[1], d.h[2]));
    p.tq.set(d.h[3], d.h[4], d.h[5], d.h[6]);
    if (!p.tp) { p.hp.copy(tp); p.hq.copy(p.tq); }
    p.tp = tp;
    p.tl = d.l ? new THREE.Vector3(d.l[0], d.l[1], d.l[2]).add(off) : null;
    p.tr = d.r ? new THREE.Vector3(d.r[0], d.r[1], d.r[2]).add(off) : null;
    p.seen = performance.now();
  }

  /* ---------- per-frame interpolation ---------- */
  AFRAME.registerComponent('mp-sync', {
    tick: function (t, dt) {
      if (!dt) return;
      const k = 1 - Math.exp(-dt / 1000 * 14), me = sceneId(), camPos = cam.object3D.getWorldPosition(V3());
      for (const id in MP.peers) {
        const p = MP.peers[id]; if (!p.tp) continue;
        const show = p.scene === me;
        p.el.object3D.visible = show;
        if (p.sound) p.sound.setVolume(show && !p.localMute ? 1 : 0);
        if (!show) continue;
        p.hp.lerp(p.tp, k); p.hq.slerp(p.tq, k);
        p.head.object3D.position.copy(p.hp); p.head.object3D.quaternion.copy(p.hq);
        [['tl', 'lp', p.hl], ['tr', 'rp', p.hr]].forEach(([tk, ck, el]) => {
          const tgt = p[tk]; el.object3D.visible = !!tgt;
          if (tgt) { if (!el._init) { p[ck].copy(tgt); el._init = 1; } p[ck].lerp(tgt, k); el.object3D.position.copy(p[ck]); } else el._init = 0;
        });
        /* name tag faces me, upright */
        const tag = p.tagEnt.object3D, wp = tag.getWorldPosition(V3());
        const yaw = Math.atan2(camPos.x - wp.x, camPos.z - wp.z);
        tag.quaternion.copy(p.hq).invert().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw));
        tag.position.set(0, 0.3, 0).applyQuaternion(p.hq.clone().invert());
      }
    }
  });

  /* ---------- connect ---------- */
  async function start() {
    cam = document.querySelector('[camera]');
    hands.l = document.querySelector('[laser-controls*="left"]');
    hands.r = document.querySelector('[laser-controls*="right"]');
    buildUI();
    scn.setAttribute('mp-sync', '');
    let lib;
    try { lib = await import('/vr/mp-p2p.js?v=1'); }
    catch (e) { MP.status = 'error'; renderUI(); console.warn('multiplayer load failed', e); return; }
    const room = MP.room = lib.joinRoom({ appId: APP, identity: 'none', maxUsers: CAP }, ROOM);
    room.onError && room.onError(err => { console.warn('mp error', err); if (err && err.code === 'room-full') { MP.status = 'full'; renderUI(); } });
    try { const me = await room.getSelf(); MP.selfId = me.peerId; } catch (e) {}
    MP.status = 'ok'; renderUI();
    const pose = room.makeAction('pose');
    pose.onMessage((d, ctx) => onPose(d, ctx.peerId));
    room.onPeerJoin(({ peerId }) => {
      if (MP.peers[peerId]) return;
      if (Object.keys(MP.peers).length >= CAP - 1) return;
      MP.peers[peerId] = makeAvatar(peerId); renderUI();
      if (micStream) room.addStream(micStream, { target: peerId });
      pose.send(myPose(), { target: peerId }).catch(() => {});
    });
    room.onPeerLeave(({ peerId }) => removePeer(peerId));
    room.onPeerStream((stream, ctx) => { const p = MP.peers[ctx.peerId]; if (p) attachStream(p, stream); });
    setInterval(() => {
      if (!Object.keys(MP.peers).length) return;
      pose.send(myPose()).catch(() => {});
      const now = performance.now();
      for (const id in MP.peers) { const p = MP.peers[id]; if (p.seen && now - p.seen > 20000) removePeer(id); }
    }, 1000 / HZ);
    window.addEventListener('pagehide', () => { try { room.leave(); } catch (e) {} });
  }
  /* debug/test hooks (used by automated tests; harmless) */
  MP._t = { addPeer: id => (MP.peers[id] = MP.peers[id] || makeAvatar(id), renderUI(), MP.peers[id]), onPose, attachStream: (id, st) => attachStream(MP.peers[id], st), removePeer, sceneId };
  function boot() {
    scn = document.querySelector('a-scene');
    if (!scn) return setTimeout(boot, 200);
    if (scn.hasLoaded) start(); else scn.addEventListener('loaded', start, { once: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
