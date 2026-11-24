/* Fowling Pond shore ambience: a soft bed of gentle lapping water and a light breeze, synthesised with WebAudio
   (filtered noise + slow LFOs; no audio files, so nothing to license). Fades in within ~40 m of the pond's edge (lapping) and ~70 m (breeze),
   from either side of the waterline, at a low level. The AudioContext is only created after the first user gesture (autoplay rules).
   Distance comes from pondmask_w1.png: R = metres inside the shore / 80, B = metres outside / 80, G = the water mask (2 m per pixel).
   Menu button 'Water sound: On / Off' (saved per browser). */
(function () {
  const W3D = window.W3D; if (!W3D) return;
  const KEY = 'jfvr-watersound', SIZE = 4096, HALF = 2048;
  const WS = W3D.waterSound = {on: localStorage.getItem(KEY) !== 'off'};
  let ctx = null, lap = null, brz = null, px = null, started = false, last = 0;
  const img = new Image(); img.onload = () => { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.drawImage(img, 0, 0); px = {d: g.getImageData(0, 0, c.width, c.height).data, w: c.width, h: c.height}; };
  img.src = '/vr/w3d/' + 'pondmask_w1.png?v=1';
  function noise(c, secs) { const b = c.createBuffer(1, c.sampleRate * secs, c.sampleRate), d = b.getChannelData(0); let l = 0; for (let i = 0; i < d.length; i++) { l = l * 0.4 + (Math.random() * 2 - 1) * 0.6; d[i] = l; } const s = c.createBufferSource(); s.buffer = b; s.loop = true; return s; }
  function lfo(c, f, depth, target) { const o = c.createOscillator(), g = c.createGain(); o.frequency.value = f; g.gain.value = depth; o.connect(g); g.connect(target); o.start(); }
  function build() {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; ctx = new AC();
    // lapping: band-passed noise whose level swells like small waves (two slow LFOs of different rates)
    const n1 = noise(ctx, 4), bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 650; bp.Q.value = 0.7;
    const sw = ctx.createGain(); sw.gain.value = 0.5; lfo(ctx, 0.21, 0.35, sw.gain); lfo(ctx, 0.087, 0.15, sw.gain);
    lap = ctx.createGain(); lap.gain.value = 0; n1.connect(bp); bp.connect(sw); sw.connect(lap); lap.connect(ctx.destination); n1.start();
    // breeze: low-passed noise with a slow gust LFO
    const n2 = noise(ctx, 5), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380; lp.Q.value = 0.4; lfo(ctx, 0.05, 90, lp.frequency);
    const gu = ctx.createGain(); gu.gain.value = 0.55; lfo(ctx, 0.07, 0.3, gu.gain);
    brz = ctx.createGain(); brz.gain.value = 0; n2.connect(lp); lp.connect(gu); gu.connect(brz); brz.connect(ctx.destination); n2.start();
  }
  function start() { if (started) return; started = true; try { build(); } catch (e) { ctx = null; } }
  ['pointerdown', 'keydown', 'touchstart'].forEach(ev => window.addEventListener(ev, () => { start(); if (ctx && ctx.state === 'suspended') ctx.resume(); }, {passive: true}));
  window.addEventListener('beforexrselect', () => {});
  function shoreDist(x, z) { // metres to the waterline (0 when unknown / far away)
    if (!px) return 999; const u = (x + HALF) / SIZE, v = (z + HALF) / SIZE; if (u < 0 || u >= 1 || v < 0 || v >= 1) return 999;
    const i = ((v * px.h | 0) * px.w + (u * px.w | 0)) * 4; return (px.d[i + 1] > 127 ? px.d[i] : px.d[i + 2]) / 255 * 80;
  }
  const cam = new THREE.Vector3(); const sm = smooth => smooth * smooth * (3 - 2 * smooth);
  let cur = 0, curB = 0;
  const tick = () => { // called from the animation loop
    if (!ctx || !lap) return; const now = performance.now(); if (now - last < 100) return; const dt = Math.min(1, (now - last) / 1000); last = now;
    const c = document.querySelector('[camera]'); if (!c || !c.object3D) return; c.object3D.getWorldPosition(cam);
    let d = shoreDist(cam.x, cam.z); if (cam.y > 80) d += (cam.y - 80); // high up = further away
    const tl = WS.on && W3D.active !== false ? 0.075 * (1 - sm(Math.min(1, Math.max(0, d / 40)))) : 0, tb = WS.on ? 0.05 * (1 - sm(Math.min(1, Math.max(0, d / 70)))) : 0;
    cur += (tl - cur) * Math.min(1, dt * 1.5); curB += (tb - curB) * Math.min(1, dt * 1.5);
    lap.gain.value = cur; brz.gain.value = curB;
  };
  AFRAME.registerComponent('w3d-watersound', {tick});
  const hook = () => { const sc = document.querySelector('a-scene'); if (!sc) return setTimeout(hook, 300); sc.setAttribute('w3d-watersound', ''); };
  hook();
  WS.set = on => { WS.on = !!on; try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (e) {} paint(); };
  function paint() { const b = document.getElementById('watersoundbtn'); if (b) b.textContent = 'Water sound: ' + (WS.on ? 'On' : 'Off'); }
  function wire() { const tools = document.querySelector('#ui .tools'); if (!tools) return setTimeout(wire, 500);
    if (!document.getElementById('watersoundbtn')) { const b = document.createElement('button'); b.id = 'watersoundbtn'; b.type = 'button'; b.style.cssText = 'background:#9ffcff;color:#111'; b.onclick = ev => { ev.stopPropagation(); WS.set(!WS.on); }; tools.appendChild(b); paint(); } }
  wire();
})();
