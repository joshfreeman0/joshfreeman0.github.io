// Mana's ukulele: positional music that gets louder as you walk up to him.
// 1) "Aloha ʻOe" (Queen Liliʻuokalani, 1878; public domain). Notes from the public-domain MIDI on Wikimedia Commons
//    (File:Aloha_oe_song_midi.mid, piano part), played live with a synthesized plucked-string (Karplus-Strong) ukulele voice.
// 2) "Hawaiʻi Ponoʻī" (music Henri Berger, words King Kalākaua, 1874; composition public domain). Recording: nationalanthems.info via
//    Wikimedia Commons (File:Hawaiʻi_ponoʻī.ogg), CC BY-SA 3.0, converted to a 48 kbps mono mp3 (audio/hawaii-ponoi.mp3, 260 KB).
// [beat*4, midi note, length*4, melody?]  (bass notes raised into ukulele range)
const ALOHA = [0,62,2,1,2,67,2,1,4,55,1,0,4,71,6,1,6,62,2,0,8,55,2,0,8,59,2,0,10,62,2,0,10,69,2,1,12,60,1,0,12,67,2,1,14,64,2,0,14,66,2,1,16,55,2,0,16,60,2,0,16,67,2,1,18,64,2,0,20,55,1,0,20,62,8,1,22,62,2,0,24,55,2,0,24,59,2,0,26,62,2,0,28,55,1,0,30,62,2,0,32,55,2,0,32,59,2,0,32,62,4,1,34,62,2,0,36,60,1,0,36,64,4,1,38,64,2,0,40,57,2,0,40,60,2,0,40,69,2,1,42,64,2,0,42,67,2,1,44,62,1,0,44,66,4,1,46,66,2,0,48,57,2,0,48,60,2,0,48,71,2,1,50,66,2,0,50,69,2,1,52,55,1,0,52,67,12,1,54,62,2,0,56,55,2,0,56,59,2,0,58,62,2,0,58,64,2,0,60,55,4,0,60,59,4,0,68,55,4,0,70,62,2,1,72,59,2,0,72,67,2,1,74,62,2,1,76,60,4,0,78,60,2,1,80,64,2,0,80,67,2,1,82,60,2,1,84,55,4,0,86,62,2,1,88,59,2,0,88,67,2,1,90,62,2,1,92,55,4,0,94,62,2,1,96,59,2,0,96,67,2,1,98,62,2,1,100,62,4,0,102,62,2,1,104,57,2,0,104,66,2,1,106,62,2,1,108,62,4,0,110,62,2,1,112,57,2,0,112,66,2,1,114,62,2,1,116,62,4,0,118,62,2,1,120,60,2,0,120,66,2,1,122,62,2,1,124,62,4,0,124,60,4,0,124,66,4,1,132,55,4,0,134,62,2,1,136,59,2,0,136,67,2,1,138,62,2,1,140,55,4,0,142,60,2,1,144,64,2,0,144,67,2,1,146,60,2,1,148,55,4,0,150,62,2,1,152,59,2,0,152,67,2,1,154,62,2,1,156,55,4,0,158,62,2,1,160,59,2,0,160,67,2,1,162,62,2,1,164,60,4,0,166,64,2,1,168,60,2,0,168,69,2,1,170,64,2,1,172,62,4,0,174,62,2,1,176,60,2,0,176,66,2,1,178,62,2,1,180,55,10,0,182,62,2,1,184,59,2,0,184,71,2,1,186,62,2,1,188,59,2,0,188,67,2,1,196,60,4,0,196,64,4,1,196,55,4,0,200,64,4,0,200,67,4,1,200,60,4,0,204,64,2,0,204,67,2,0,204,72,2,1,206,60,2,0,206,55,2,0,206,64,2,1,208,60,2,0,208,55,2,0,208,64,2,1,210,60,2,0,210,55,2,0,210,64,2,1,212,62,4,1,212,55,4,0,216,59,1,0,216,62,4,0,216,67,4,1,220,62,4,0,220,67,4,0,220,71,4,1,220,55,4,0,224,59,2,0,224,67,2,1,224,55,4,0,226,62,2,1,228,57,2,0,228,62,2,0,228,66,2,1,230,57,2,0,230,62,2,0,230,66,2,1,232,57,2,0,232,62,2,0,232,66,2,1,234,59,2,0,234,62,2,0,234,67,2,1,236,60,2,0,236,62,2,0,236,69,2,1,238,59,2,0,238,62,2,0,238,68,2,1,240,60,2,0,240,66,2,0,240,69,2,1,242,64,2,0,242,66,2,0,242,72,2,1,244,55,8,0,246,71,2,1,248,67,2,1,250,62,2,1,252,55,2,0,252,59,2,0,252,67,2,1,254,59,2,0,256,62,2,0,258,55,2,0,260,55,4,0,260,64,4,1,260,60,10,0,264,60,4,0,264,64,4,0,264,67,4,1,268,64,2,0,268,67,2,0,268,72,2,1,270,64,2,1,272,60,2,0,272,67,2,1,274,64,2,1,274,60,2,0,276,62,4,1,276,55,4,0,280,59,1,0,280,62,4,0,280,67,4,1,284,62,2,0,284,67,2,0,284,71,2,1,284,55,4,0,286,62,2,1,288,59,2,0,288,67,2,1,290,62,2,1,292,62,4,0,294,62,2,1,296,57,2,0,296,66,2,1,298,59,2,0,298,67,2,1,300,62,2,0,300,71,2,1,302,60,2,0,302,69,2,1,304,62,2,1,306,60,2,0,306,66,2,1,306,62,2,0,308,55,12,0,310,62,2,1,312,59,2,0,312,67,2,1,314,62,2,1,316,59,4,0,316,67,4,1];
const SPB = 0.588235;   // seconds per beat (MIDI tempo 588235 us)
export function music(ctx, anchor) {
  const T = ctx.THREE, cam = document.querySelector('[camera]').object3D;
  let listener = cam.children.find(c => c.type === 'AudioListener'), mine = false;
  if (!listener) { listener = new T.AudioListener(); cam.add(listener); mine = true; }
  const ac = listener.context, pa = new T.PositionalAudio(listener);
  pa.setDistanceModel('inverse'); pa.setRefDistance(1.6); pa.setRolloffFactor(1.5); pa.setMaxDistance(200); pa.setVolume(1); anchor.add(pa);
  const out = ac.createGain(); out.gain.value = 0.9; out.connect(pa.panner);
  const bufs = {}, buf = m => bufs[m] || (bufs[m] = pluck(ac, 440 * Math.pow(2, (m - 69) / 12)));
  let song = -1, timer = null, t0 = 0, idx = 0, el = null, src = null, onEnd = null;
  function stopAll() { if (timer) clearInterval(timer); timer = null; if (el) { el.pause(); } }
  function playAloha() { song = 0; idx = 0; t0 = ac.currentTime + 0.25;
    timer = setInterval(() => { const until = ac.currentTime + 0.5;
      while (idx < ALOHA.length / 4) { const b = ALOHA[idx * 4], when = t0 + b / 4 * SPB; if (when > until) break;
        const m = ALOHA[idx * 4 + 1], len = ALOHA[idx * 4 + 2] / 4 * SPB, mel = ALOHA[idx * 4 + 3];
        if (when >= ac.currentTime - 0.05) { const s = ac.createBufferSource(), g = ac.createGain(); s.buffer = buf(m); g.gain.setValueAtTime(mel ? 0.55 : 0.22, when);
          g.gain.setTargetAtTime(0, when + Math.max(0.25, len), 0.12); s.connect(g); g.connect(out); s.start(when); s.stop(when + Math.max(0.25, len) + 0.6); }
        idx++; }
      if (idx >= ALOHA.length / 4 && ac.currentTime > t0 + (ALOHA[ALOHA.length - 4] / 4 + 4) * SPB) { stopAll(); if (onEnd) onEnd(0); } }, 120); }
  function playPonoi() { song = 1;
    if (!el) { el = new Audio(new URL('audio/hawaii-ponoi.mp3', import.meta.url).href); el.crossOrigin = 'anonymous'; el.preload = 'auto';
      src = ac.createMediaElementSource(el); const g = ac.createGain(); g.gain.value = 0.8; src.connect(g); g.connect(out); el.addEventListener('ended', () => { if (song === 1 && onEnd) onEnd(1); }); }
    el.currentTime = 0; const p = el.play(); if (p && p.catch) p.catch(() => {}); }
  function play(i) { stopAll(); if (ac.state !== 'running') ac.resume().catch(() => {}); if (i === 0) playAloha(); else playPonoi(); }
  const wake = () => { if (ac.state !== 'running') ac.resume().catch(() => {}); if (song === 1 && el && el.paused) el.play().catch(() => {}); };
  document.addEventListener('pointerdown', wake); const sc = document.querySelector('a-scene'); sc.addEventListener('triggerdown', wake);
  return {
    play, get song() { return song; }, set onEnd(f) { onEnd = f; },
    stop() { stopAll(); song = -1; },
    dispose() { stopAll(); song = -1; document.removeEventListener('pointerdown', wake); sc.removeEventListener('triggerdown', wake);
      try { out.disconnect(); if (src) src.disconnect(); } catch (e) {} if (el) { el.removeAttribute('src'); el.load(); }
      anchor.remove(pa); try { pa.disconnect && pa.panner.disconnect(); } catch (e) {} if (mine) cam.remove(listener); }
  };
}
function pluck(ac, f) {   // Karplus-Strong string, 1.3 s
  const sr = ac.sampleRate, n = Math.floor(sr * 1.3), b = ac.createBuffer(1, n, sr), d = b.getChannelData(0), N = Math.max(2, Math.round(sr / f)), r = new Float32Array(N);
  for (let i = 0; i < N; i++) r[i] = Math.random() * 2 - 1;
  let p = 0, lp = 0; for (let i = 0; i < n; i++) { const a = r[p], nx = r[(p + 1) % N]; r[p] = 0.4985 * (a + nx); p = (p + 1) % N; lp += (a - lp) * 0.5; d[i] = lp * (i < 40 ? i / 40 : 1) * (i > n - 2000 ? (n - i) / 2000 : 1); }
  return b;
}
