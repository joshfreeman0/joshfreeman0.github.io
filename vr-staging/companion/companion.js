/* Shared AI companion module for Josh Freeman's worlds (Earth: Fowling Pond, Mars: Red Planet Lounge).
   ES module. mount(sceneEl, rootEl, opts) / unmount(). Attaches to the host's scene: no a-scene, renderer or XR session of its own.
   Replies come from an LLM through a server-side proxy (Cloudflare Worker; the OpenRouter key never reaches the browser).
   See README.md next to this file. */
const HERE = new URL('./', import.meta.url).href;
export const VERSION = '1.2.10';
export const DEFAULT_PROXY = 'https://fp-companion.tesseractprogram.workers.dev/chat';
export const WORLDS = {
  earth: 'Earth, Fowling Pond: a restored pond in Raynham, Massachusetts, on real terrain. Above it stands an Egyptian-style concept bank compound (terrace pavilion, banking hall, vault, Josh\'s office, conservatory, sphinxes and temple gate). Around it: a pyramid park at Route 24 and I-495, a houseboat, the Pharos lighthouse, King\'s Pond and the Forge River, Vesta\'s house, a zoo, and a launch pad in Bridgewater with a rocket to Mars. Flying saucers visit other cities.',
  mars: 'Mars, Red Planet Lounge: a colony on the red planet with a domed club and lounge, music and dancing, an orbital station with a cantina and a glass floor, and an ice mine. The rocket and shuttle link it to Fowling Pond on Earth.'
};
const MAX_KEEP = 40, SEND = 16;
const FAMILY = r => r === 'wife' || r === 'child';
// family placeholder near the Fowling Pond terrace, used only when neither roster `home`, api.setHome() nor window.FP_HOME gives a spot
export const FAMILY_PLACEHOLDER = {wife: {x: 844.5, z: -381.5, yaw: 200}, kids: [{x: 840.5, z: -382.5, yaw: 150}, {x: 841.5, z: -376.5, yaw: 120}], play: {x: 842.0, z: -379.5, r: 2.5}};

/* storage adapter: anything with async-or-sync get(key) / set(key, value). Swap for a shared accounts backend later. */
export const localStore = {
  get(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};

let inst = null;
export async function mount(sceneEl, rootEl, opts) { if (inst) unmount(); const me = inst = new Companion(sceneEl, rootEl, opts || {}); try { await me.init(); } catch (e) { if (inst === me) inst = null; me.destroy(); throw e; }
  if (inst !== me) return me.api; try { window.FP_COMPANION = me.api; } catch (e) {} return me.api; }   // hosts (e.g. Mars) look for window.FP_COMPANION
export function unmount() { if (inst) { const i = inst; inst = null; try { if (window.FP_COMPANION && window.FP_COMPANION === i.api) delete window.FP_COMPANION; } catch (e) { window.FP_COMPANION = undefined; } i.destroy(); } }
export function current() { return inst ? inst.api : null; }

/* preview(sceneEl, rootEl, characters, {spacing, z, THREE, GLTFLoader, rosterBase}) -> Promise<api[]>: static line-up of roster characters (no talking, no UI); for comparison shots */
const previews = [];
export async function preview(sceneEl, rootEl, chars, o) { o = o || {}; clearPreview(); const sp = o.spacing || 0.9, n = chars.length;
  const list = chars.map((c, i) => { const r = new Companion(sceneEl, rootEl, Object.assign({}, o, {resident: true, noInput: true, character: c, ui: false, follow: false, voice: false, rosterBase: o.rosterBase || HERE})); previews.push(r);
    return r.init().then(() => { r.placeWorld((i - (n - 1) / 2) * sp, 0, o.z || 0, 0); r.previewOnly = true; return {id: c.id, name: c.name, height: r.modelH, object3D: r.holder}; }); });
  return Promise.all(list); }
export function clearPreview() { while (previews.length) previews.pop().destroy(); }

const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
// Rocketbox adults use 'Bip01 …' bones, children 'Bip02 …': match either
const bone = (n, o) => { const k = norm(o.name); return k === n || (/^bip01/.test(n) && /^bip0\d/.test(k) && k.slice(5) === n.slice(5)); };
const RIGS = {
  rocketbox: {hips: 'bip01pelvis', spine: 'bip01spine1', chest: 'bip01spine2', neck: 'bip01neck', head: 'bip01head', lUp: 'bip01lupperarm', lFore: 'bip01lforearm', lHand: 'bip01lhand',
    rUp: 'bip01rupperarm', rFore: 'bip01rforearm', rHand: 'bip01rhand', jaw: 'bip01mjaw', lip: 'bip01mbottomlip', lEye: 'bip01leye', rEye: 'bip01reye'},
  mixamo: {hips: 'mixamorighips', spine: 'mixamorigspine1', chest: 'mixamorigspine2', neck: 'mixamorigneck', head: 'mixamorighead', lUp: 'mixamorigleftarm', lFore: 'mixamorigleftforearm', lHand: 'mixamoriglefthand',
    rUp: 'mixamorigrightarm', rFore: 'mixamorigrightforearm', rHand: 'mixamorigrighthand', jaw: 'mixamorigjaw', lip: '', lEye: 'mixamoriglefteye', rEye: 'mixamorigrighteye'},
  vrm: {hips: 'hips', spine: 'spine', chest: 'chest', neck: 'neck', head: 'head', lUp: 'leftupperarm', lFore: 'leftlowerarm', lHand: 'lefthand', rUp: 'rightupperarm', rFore: 'rightlowerarm', rHand: 'righthand', jaw: 'jaw', lip: '', lEye: 'lefteye', rEye: 'righteye'}
};

class Companion {
  constructor(sceneEl, rootEl, o) {
    this.sceneEl = sceneEl; this.rootEl = rootEl; this.o = o;
    this.T = o.THREE || window.THREE || (window.AFRAME && window.AFRAME.THREE);
    if (!this.T) throw new Error('companion: THREE not found (pass opts.THREE)');
    this.store = o.storage || localStore; this.world = o.world || 'earth'; this.worldDesc = o.worldDesc || WORLDS[this.world] || '';
    this.playerId = String(o.playerId || 'guest'); this.playerName = o.playerName || '';
    this.proxy = o.proxyUrl || DEFAULT_PROXY; this.ttsUrl = o.ttsUrl || this.proxy.replace(/\/chat\/?$/, '/tts'); this.emit = (type, d) => { try { o.onEvent && o.onEvent(Object.assign({type, character: this.ch && this.ch.id}, d || {})); } catch (e) {} };
    this.resident = !!o.resident; this.homes = o.homes || {}; this.family = new Map(); this.state = 'idle'; this.t = 0; this.hist = []; this.cleanup = []; this.dead = false; this.jaw = 0; this.look = {yaw: 0, pitch: 0}; this.talkUntil = 0; this.lastTap = 0;
    Companion.alls = Companion.alls || new Set(); Companion.alls.add(this); if (!this.resident) Companion.host = this;
  }
  get root3d() { const r = this.rootEl; return r && r.object3D ? r.object3D : r; }
  get camera() { const s = this.sceneEl; return this.o.camera || (s && s.camera) || null; }
  get renderer() { const s = this.sceneEl; return this.o.renderer || (s && s.renderer) || null; }
  get inXR() { const r = this.renderer; return !!(r && r.xr && r.xr.isPresenting); }

  async init() {
    if (this.resident) return this.initResident();
    const T = this.T; let ro = this.o.roster || 'roster.json';
    if (typeof ro === 'string') ro = await fetch(new URL(ro, HERE).href).then(r => r.json());
    if (Array.isArray(ro)) ro = {characters: ro};
    this.rosterBase = typeof this.o.roster === 'string' ? new URL(this.o.roster, HERE).href : HERE;
    this.roster = (ro.characters || []).filter(c => c && c.id && c.avatar);
    if (!this.roster.length) throw new Error('companion: empty roster');
    this.holder = new T.Group(); this.holder.name = 'fp-companion'; this.holder.visible = false; this.root3d.add(this.holder);   // v1.2.2: hidden until placed (never shown at the origin)
    this.sub = this.makeSubtitle(); this.holder.add(this.sub.sprite);
    this.handsFree = this.o.handsFree !== false && !this.resident && !this.o.residentsOnly;
    this.hookTick(); this.hookInput(); if (this.o.ui !== false) this.makeUI();
    if (!this.o.residentsOnly) {
      let pick = this.o.pick || this.store.get && (await this.store.get('fpc:v1:' + this.playerId + ':pick')) || ro.default || this.roster[0].id;
      { const pc = this.roster.find(r => r.id === pick); if (!pc || pc.role === 'child' || !this.inWorld(pc)) pick = this.firstAdult(ro.default); }   // a child is never the default slot
      await this.pick(pick, true);
    }
    this.api = {
      version: VERSION, list: () => this.roster.map(c => ({id: c.id, name: c.name, gender: c.gender, role: c.role, canTravel: !!c.canTravel})),
      current: () => { const c = (this.ch && !this.o.residentsOnly) ? this.ch : (this.talkTarget() && this.talkTarget().ch); return c && {id: c.id, name: c.name}; }, pick: id => this.o.residentsOnly ? this.setTalkTarget(id) : this.pick(id),
      talk: text => text ? this.send(text) : this.listen(), listen: () => this.listen(), say: text => this.speak(text),
      voiceOn: () => this.voiceOn(), setVoiceOn: on => this.setVoiceOn(on), unlockAudio: () => this.unlockAudio(), startTalk: () => this.beginTalk(), setHandsFree: on => { this.handsFree = !!on; if (!on) { clearTimeout(this._listenArm); if (this.rec) this.stopListen(); } else this.armListen(200); },
      setWorld: (w, d) => { this.world = w; this.worldDesc = d || WORLDS[w] || ''; }, moveTo: (x, y, z, yaw) => this.placeWorld(x, y, z, yaw),
      comeHere: () => this.comeHere(), forget: () => { this.hist = []; this.save(); }, setPassphrase: p => this.setPass(p),
      update: dt => this.update(dt), unmount: () => unmount(), object3D: this.holder,
      setHome: (id, pos) => this.setHome(id, pos), family: () => [...this.family.values()].map(r => ({id: r.ch.id, name: r.ch.name, role: r.ch.role, object3D: r.holder})),
      talkTo: (id, text) => { const r = this.family.get(id); if (r) { this.setTalkTarget(id); r.claimTalk(); return text ? r.send(text) : r.listen(); } if (this.ch && this.ch.id === id) { this._talkId = id; this.claimTalk(); return text ? this.send(text) : this.listen(); } }
    };
    if (this.o.family !== false) { this.homeWaitOver = false; const hw = setTimeout(() => { this.homeWaitOver = true; if (!this.dead) this.placeFamily(); }, this.o.homeWaitMs === undefined ? 6000 : +this.o.homeWaitMs); this.cleanup.push(() => clearTimeout(hw));
      this.syncFamily(); const onHome = () => this.placeFamily();
      for (const t of [this.sceneEl, window]) if (t && t.addEventListener) { t.addEventListener('fp-home-ready', onHome); this.cleanup.push(() => t.removeEventListener('fp-home-ready', onHome)); } }
    this.emit('ready', {roster: this.api.list()});
    if (!this.o.residentsOnly && this.handsFree && (this.o.tapToStart !== undefined ? this.o.tapToStart : this.world !== 'mars') && this.o.ui !== false) this.showStartGate();
    if (this.o.residentsOnly) this.relabelTalk();
    this.hookWrist();
    return this.api;
  }

  inWorld(c) { return !Array.isArray(c.worlds) || !c.worlds.length || c.worlds.includes(this.world); }
  firstAdult(def) { const ok = c => c && c.role !== 'child' && this.inWorld(c); const d = this.roster.find(c => c.id === def); return ok(d) ? d.id : (this.roster.find(ok) || this.roster[0]).id; }
  talkTarget() { if (this.resident) return this; if (this._talkId && this.family.get(this._talkId)) return this.family.get(this._talkId); if (this.o.residentsOnly) return this.family.get('astrid') || [...this.family.values()].find(r => r.ch && r.ch.role === 'wife') || [...this.family.values()][0] || null; return this; }
  setTalkTarget(id) { if (this.roster.some(c => c.id === id)) this._talkId = id; this.relabelTalk(); }
  relabelTalk() {
    const t = (Companion.talker && !Companion.talker.dead && Companion.talker.ch) || (this.talkTarget() && this.talkTarget().ch) || this.ch;
    const n = (t && t.name) || 'Lila';
    if (this.ui && this.ui.btn) this.ui.btn.textContent = 'Talk to ' + n;
    if (this.ui && this.ui.sel && t) try { this.ui.sel.value = t.id; } catch (e) {}
    this.relabelStrip(n);
  }
  relabelStrip(n) { n = n || ((Companion.talker && Companion.talker.ch && Companion.talker.ch.name) || (this.ch && this.ch.name) || 'Lila'); if (this._talkUi && this._talkUi.inp) this._talkUi.inp.placeholder = 'Type to ' + n; }
  hookWrist() {
    if (this.resident || this.o.wrist === false) return;
    const paint = (b) => {
      const dismissed = !!(Companion.host || this)._dismissed, label = dismissed ? 'Call Lila' : 'Lila leave';
      const c = document.createElement('canvas'); c.width = 256; c.height = 54; const g = c.getContext('2d');
      g.fillStyle = '#ffd9a0'; g.fillRect(0, 0, 256, 54); g.fillStyle = '#111'; g.font = 'bold 26px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(label, 128, 28);
      const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace;
      const mesh = b._fpcLabel; if (mesh) { const old = mesh.material.map; mesh.material.map = tx; mesh.material.needsUpdate = true; if (old) old.dispose(); }
      else { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.04), new THREE.MeshBasicMaterial({map: tx, transparent: true, depthTest: false, depthWrite: false, toneMapped: false}));
        m.position.z = 0.001; m.renderOrder = 3002; b.object3D.add(m); b.object3D.renderOrder = 3001; b._fpcLabel = m; }
    };
    const place = () => {
      const wr = document.getElementById('wristpanel'); if (!wr || document.getElementById('fpc-wrist-lila')) return !!document.getElementById('fpc-wrist-lila');
      const Hh = (wr.object3D && wr.object3D.userData && wr.object3D.userData.H) || (wr.userData && wr.userData.H) || 0.2;
      const b = document.createElement('a-plane'); b.id = 'fpc-wrist-lila'; b.className = 'btn';
      b.setAttribute('width', 0.2); b.setAttribute('height', 0.042); b.setAttribute('position', '0 ' + (-Hh / 2 - 0.176).toFixed(4) + ' 0.002');
      b.setAttribute('material', 'shader:flat;transparent:true;opacity:0;depthTest:false;depthWrite:false'); wr.appendChild(b);
      b.addEventListener('loaded', () => { paint(b); setTimeout(() => document.querySelectorAll('[raycaster]').forEach(r => r.components.raycaster && r.components.raycaster.refreshObjects()), 300); });
      b.addEventListener('click', () => { const h = Companion.host || this; if (h._dismissed) h.recall(); else if (h.isGuest && h.isGuest()) h.dismiss(); else { const g = h.guestHere && h.guestHere(); if (g && !g._dismissed) g.dismiss(); else h.recall(); } this.relabelWrist(); });
      this._wristEl = b; this._wristPaint = () => { if (b.object3D) paint(b); };
      this.cleanup.push(() => { try { b.remove(); } catch (e) {} this._wristEl = null; });
      return true;
    };
    if (!place()) { let n = 0; const t = setInterval(() => { if (place() || ++n > 60) clearInterval(t); }, 500); this.cleanup.push(() => clearInterval(t)); }
  }
  relabelWrist() { try { this._wristPaint && this._wristPaint(); } catch (e) {} }

  hostOf() { return this.resident ? (Companion.host || this) : this; }
  isFamily() { return !!(this.ch && FAMILY(this.ch.role)); }
  isGuest() { return !!(this.ch && !FAMILY(this.ch.role)); }
  claimTalk() {
    if (Companion.talker && Companion.talker !== this && !Companion.talker.dead) Companion.talker.yieldTalk();
    Companion.talker = this; const h = this.hostOf(); if (h) { if (this.ch) h._talkId = this.ch.id; h.relabelTalk(); }
  }
  yieldTalk() {
    clearTimeout(this._listenArm); this.abortListen(); this.stopSpeaking(); this.state = 'idle';
    if (Companion.talker === this) Companion.talker = null;
  }
  abortListen() {
    const r = this.rec; if (!r) return;
    if (r.kind === 'sr') { try { r.r.onresult = r.r.onend = r.r.onerror = null; r.r.abort ? r.r.abort() : r.r.stop(); } catch (e) {} this.rec = null; this.state = 'idle'; return; }
    this.rec = null; try { r.stop(); } catch (e) {} this.state = 'idle';
  }
  homeZone() {
    const H = window.FP_HOME; if (!H || this.world !== 'earth' || this.o.houseAware === false) return null;
    const pad = 25, rects = [], circs = [];
    const addR = r => { if (r && isFinite(r.x0) && isFinite(r.z1)) rects.push({x0: r.x0 - pad, x1: r.x1 + pad, z0: r.z0 - pad, z1: r.z1 + pad}); };
    addR(H.bounds || H.house); addR(H.porchBounds);
    const P = v => !v ? null : Array.isArray(v) ? v : Array.isArray(v.position) ? v.position : isFinite(v.x) ? [v.x, v.y, v.z] : null;
    const addC = (v, r) => { const p = P(v); if (p) circs.push({x: p[0], z: p[2], r: r + pad}); };
    if (H.spawns) { addC(H.spawns.yard, 12); addC(H.spawns.play, 12); addC(H.spawns.porch, 8); addC(H.spawns.wife, 8); (H.spawns.kids || []).forEach(k => addC(k, 8)); }
    if (!rects.length && !circs.length && H.site && isFinite(H.site.x) && isFinite(H.site.z)) addR({x0: H.site.x - 22, x1: H.site.x + 22, z0: H.site.z - 20, z1: H.site.z + 20});
    if (!rects.length && !circs.length) return null;
    const contains = (x, z) => rects.some(r => x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1) || circs.some(c => Math.hypot(x - c.x, z - c.z) < c.r);
    const cx = (H.site && isFinite(H.site.x)) ? H.site.x : (rects[0] ? (rects[0].x0 + rects[0].x1) / 2 : circs[0].x);
    const cz = (H.site && isFinite(H.site.z)) ? H.site.z : (rects[0] ? (rects[0].z0 + rects[0].z1) / 2 : circs[0].z);
    const away = (dist) => {
      dist = dist == null ? 30 : dist; let dx = 0, dz = 1, x = cx, z = cz;
      for (let i = 0; i < 80; i++) { x += dx * 2; z += dz * 2; if (!contains(x, z)) break; }
      x += dx * dist; z += dz * dist;
      return [x, null, z, Math.atan2(dx, dz) * 180 / Math.PI];
    };
    return {contains, center: [cx, cz], away};
  }
  namedGuest(t) {
    const host = this.hostOf(), roster = (host && host.roster) || this.roster || [], insts = [...(Companion.alls || [])];
    if (/\blaila\b/.test(t)) t = t.replace(/\blaila\b/g, 'lila');
    for (const c of roster) {
      if (!c || FAMILY(c.role)) continue;
      const names = [c.id, c.name].filter(Boolean).map(n => String(n).toLowerCase().replace(/[^a-z0-9]+/g, ''));
      if (names.some(n => n && new RegExp('\\b' + n + '\\b').test(t))) return insts.find(i => !i.dead && i.ch && i.ch.id === c.id) || null;
    }
    return null;
  }
  guestHere() {
    const insts = [...(Companion.alls || [])].filter(i => !i.dead && i.isGuest() && !i._dismissed);
    if (!insts.length) return null;
    const z = this.homeZone();
    if (z) { const hit = insts.filter(i => { const p = i.holder && i.holder.getWorldPosition(new this.T.Vector3()); return p && z.contains(p.x, p.z); }); if (hit.length) return hit[0]; }
    return insts[0];
  }
  leaveIntent(text) {
    const t = String(text || '').toLowerCase().replace(/['\u2018\u2019]/g, "'").replace(/[^a-z0-9\s']/g, ' ').replace(/\s+/g, ' ').trim();
    if (!t) return null;
    if (/\b(don'?t|do not|never|not)\b.{0,24}\b(leave|go away)\b/.test(t)) return null;
    const strong = /\b(leave us|go away|you can go|please leave|get out|head out|wait outside|you should go|would you leave|can you leave|leave me|leave now|just leave|go on then|give us (some )?space|take a walk)\b/;
    const named = this.namedGuest(t);
    if (named && (strong.test(t) || /\b(leave|go|away|out)\b/.test(t))) return named;
    if (!strong.test(t)) return null;
    if (this.isGuest() && !this._dismissed) return this;
    return this.guestHere();
  }
  recall() { this._dismissed = false; this._stayOut = null; this._leaving = false; Companion._banterLeft = 2; Companion._banterStarted = false; this.comeHere(); this.relabelWrist(); }
  dismiss() {
    if (this.dead || this.isFamily() || this._leaving || this._dismissed) return;
    this._leaving = true; Companion._banterBusy = false; Companion._banterLeft = 0; clearTimeout(this._banterT);
    this.claimTalk(); this._afterGoodbye = () => {
      this._dismissed = true; this._leaving = false; this.handsFree = false;
      const z = this.homeZone(); this._stayOut = z ? z.away(30) : null;
      if (this._stayOut) this.placeWorld(this._stayOut[0], this._stayOut[1], this._stayOut[2], this._stayOut[3]);
      this.yieldTalk();
      const h = this.hostOf();
      if (h && h !== this) {
        const prefer = (h._talkId && h._talkId !== (this.ch && this.ch.id)) ? h._talkId : 'astrid';
        const r = h.family.get(prefer) || [...h.family.values()].find(x => x.ch && x.ch.role === 'wife') || [...h.family.values()][0];
        if (r) { h.setTalkTarget(r.ch.id); r.claimTalk(); r.handsFree = true; r.armListen(400); }
      }
      this.emit('left', {reason: 'dismissed'}); this.relabelWrist();
    };
    this.speak("Of course. I'll leave you with your family.");
  }
  maybeBanter() { return; // v1.2.10: no woman-to-woman exchanges
    if (this._dismissed || this._leaving || this._fromBanter || (this.ch && this.ch.role === 'child')) return;
    if (Companion._banterBusy || Companion._banterStarted || this._afterGoodbye) return;
    const z = this.homeZone(); if (!z) return;
    const insts = [...(Companion.alls || [])].filter(i => !i.dead);
    const wife = insts.find(i => i.ch && i.ch.role === 'wife'), guest = insts.find(i => i.isGuest() && !i._dismissed && !i._leaving);
    if (!wife || !guest) return;
    const pos = i => i.holder && i.holder.getWorldPosition(new this.T.Vector3()), wp = pos(wife), gp = pos(guest);
    if (!wp || !gp || !z.contains(wp.x, wp.z) || !z.contains(gp.x, gp.z)) return;
    const other = this === wife ? guest : this === guest ? wife : null; if (!other) return;
    Companion._banterStarted = true; Companion._banterBusy = true; Companion._banterLeft = 1;
    this.runBanter(other, this);
  }
  async runBanter(speaker, back) {
    const stop = () => { Companion._banterBusy = false; if (back && !back.dead && !back._dismissed) { back.claimTalk(); if (back.handsFree) back.armListen(400); } };
    if (this._dismissed || speaker._dismissed || speaker._leaving || back._leaving) return stop();
    const line = await this.requestBanter(speaker, back.ch && back.ch.name, back._lastSpoken);
    if (!line || speaker._dismissed || speaker._leaving || back._dismissed) return stop();
    speaker._fromBanter = true; speaker.claimTalk();
    await new Promise(res => { speaker._afterBanter = res; speaker.speak(line); });
    speaker._fromBanter = false;
    if (speaker._dismissed || back._dismissed || back._leaving || !Companion._banterLeft) return stop();
    Companion._banterLeft = 0;
    const line2 = await this.requestBanter(back, speaker.ch && speaker.ch.name, speaker._lastSpoken);
    if (!line2 || speaker._dismissed || back._dismissed || back._leaving) return stop();
    back._fromBanter = true; back.claimTalk();
    await new Promise(res => { back._afterBanter = res; back.speak(line2); });
    back._fromBanter = false; stop();
  }
  async requestBanter(speaker, otherName, lastLine) {
    if (!this.pass() || !speaker || !speaker.ch) return '';
    try {
      const c = speaker.ch;
      const r = await fetch(this.proxy, {method: 'POST', headers: {'Content-Type': 'application/json', 'X-FP-Pass': this.pass()}, body: JSON.stringify({
        characterId: c.id, role: c.role || 'companion', persona: (c.persona || '') + (c.name ? '\nYour name is ' + c.name + '.' : ''), world: this.world, worldDesc: this.worldDesc, playerName: this.playerName,
        messages: [{role: 'user', content: 'You are at the family home with ' + (otherName || 'someone') + ' and Josh. ' + (otherName || 'They') + ' just said: "' + String(lastLine || '').slice(0, 240) + '". Reply with ONE short, polite spoken sentence to ' + (otherName || 'them') + '. Do not involve the children. Do not ask Josh a question.'}]})});
      const res = await r.json().catch(() => ({})); return String(res.reply || '').trim().slice(0, 220);
    } catch (e) { return ''; }
  }


  // ---------- family residents (wife / children stand at home while another companion is active) ----------
  async initResident() {
    const c = this.o.character; this.roster = [c]; this.rosterBase = this.o.rosterBase || HERE;
    this.holder = new this.T.Group(); this.holder.name = 'fp-resident-' + c.id; this.holder.visible = false; this.root3d.add(this.holder);
    this.sub = this.makeSubtitle(); this.holder.add(this.sub.sprite); this.hookTick(); if (!this.o.noInput) this.hookInput();
    await this.pick(c.id, true); return null;
  }
  syncFamily() {   // one resident per family member in this world, except the one that is the active companion
    if (this.resident || this.dead) return;
    for (const c of this.roster) { if (!FAMILY(c.role)) continue; const want = this.inWorld(c) && !(this.ch && this.ch.id === c.id), have = this.family.get(c.id);
      if (want && !have) { const r = new Companion(this.sceneEl, this.rootEl, Object.assign({}, this.o, {resident: true, character: c, rosterBase: this.rosterBase, ui: false, follow: false, spawn: null}));
        this.family.set(c.id, r); r.init().then(() => { if (r.dead) return; this.placeFamily(); }).catch(e => { console.warn('[fpc] resident', c.id, e); this.family.delete(c.id); r.destroy(); }); }
      else if (!want && have) { this.family.delete(c.id); have.destroy(); } }
  }
  setHome(id, pos) { this.homes[id] = pos; this.placeFamily(); }
  homeFor(c) {   // priority: api.setHome > roster home > window.FP_HOME.spawns > placeholder near the terrace
    const P = (v, src) => { if (!v) return null; const a = Array.isArray(v) ? v : Array.isArray(v.position) ? v.position : null;
      const o = a ? {x: a[0], y: a[1], z: a[2]} : {x: v.x, y: v.y, z: v.z}; const yaw = v.rotationY !== undefined ? v.rotationY : v.yaw; if (!isFinite(o.x) || !isFinite(o.z)) return null;
      return {x: +o.x, y: o.y !== undefined && o.y !== null && isFinite(o.y) ? +o.y : null, z: +o.z, yaw: isFinite(yaw) ? +yaw : undefined, src}; };
    const own = P(this.homes[c.id], 'setHome') || P(c.home, 'roster'); if (own) return own;
    const kids = this.roster.filter(r => r.role === 'child' && this.inWorld(r)), ki = kids.indexOf(c), H = window.FP_HOME && window.FP_HOME.spawns;
    if (H && this.world === 'earth') { if (c.role === 'wife') { const w = P(H.wife, 'FP_HOME'); if (w) return w; }
      if (c.role === 'child') { const k = H.kids && P(H.kids[ki], 'FP_HOME'); if (k) return k; const y = P(H.yard, 'FP_HOME') || P(H.play, 'FP_HOME');
        if (y) { const a = ki * 2.1; return {x: y.x + Math.cos(a) * 2.2, y: null, z: y.z + Math.sin(a) * 2.2, yaw: undefined, src: 'FP_HOME-yard'}; } } }
    if (this.world !== 'earth') return null;   // no placeholder outside Fowling Pond: residents then stand near the player
    const F = this.o.familyPlaceholder || FAMILY_PLACEHOLDER, K = F.kids || [], q = c.role === 'wife' ? F.wife : K[ki] || K[0];
    return q ? {x: q.x + (c.role === 'child' && ki >= K.length ? (ki - K.length + 1) * 0.9 : 0), y: null, z: q.z, yaw: q.yaw, src: 'placeholder'} : null;
  }
  wanderArea(c) { const H = window.FP_HOME && window.FP_HOME.spawns, P = v => !v ? null : Array.isArray(v) ? {x: v[0], z: v[2]} : Array.isArray(v.position) ? {x: v.position[0], z: v.position[2], r: v.radius} : isFinite(v.x) ? {x: v.x, z: v.z, r: v.r || v.radius} : null;
    if (c.role !== 'child' || c.wander === false || this.homes[c.id]) return null;
    const a = P(c.wanderArea) || (H && this.world === 'earth' ? (P(H.play) || P(H.yard)) : null) || (this.world === 'earth' && !c.home && !H ? P((this.o.familyPlaceholder || FAMILY_PLACEHOLDER).play) : null);
    return a ? {x: a.x, z: a.z, r: a.r || 4} : null; }
  placeFamily() { if (this.dead) return; for (const r of this.family.values()) { if (!r.model) continue; const h = this.homeFor(r.ch);
      if (h && h.src === 'placeholder' && !this.homeWaitOver) continue;   // v1.2.2: stay hidden while FP_HOME may still arrive (homeWaitMs)
      if (h) { r.placeWorld(h.x, h.y, h.z, h.yaw); r.homeSrc = h.src; } else if (!r.placed) r.comeHere();
      r.wander = this.wanderArea(r.ch); r.wTarget = null; r.wWait = 2 + Math.random() * 4; } if (this.o.residentsOnly) this.relabelTalk(); }

  // ---------- characters ----------
  async pick(id, first) {
    const T = this.T, c = this.roster.find(r => r.id === id) || this.roster[0];
    if (this.ch && this.ch.id === c.id && this.model) return;
    const prevPos = this.model ? this.holder.position.clone() : null;
    this.stopSpeaking();
    if (this.model) { this.holder.remove(this.model); dispose(this.model); this.model = null; }
    this.ch = c; this.bones = {};
    const Loader = this.o.GLTFLoader || T.GLTFLoader; if (!Loader) throw new Error('companion: GLTFLoader not found (pass opts.GLTFLoader)');
    const g = await new Loader().loadAsync(new URL(c.avatar, this.rosterBase).href);
    if (this.dead) return; const m = g.scene; m.name = 'fpc-' + c.id;
    m.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = false; o.frustumCulled = false;
      for (const mt of [].concat(o.material)) { if (mt.map) mt.map.anisotropy = 4; if (mt.alphaTest > 0) mt.alphaToCoverage = !!(this.o.quest); mt.envMapIntensity = 0.6; } } });
    await this.applyLook(m, c); if (this.dead) return;
    this.fit(m, c); this.holder.add(m); this.model = m; this.rig(c);
    this.hist = (await (this.store.get && this.store.get(this.key()))) || [];
    if (this.store.set && !this.resident && c.role !== 'child') this.store.set('fpc:v1:' + this.playerId + ':pick', c.id);
    if (prevPos) this.holder.position.copy(prevPos); else if (this.o.spawn) { const s = this.o.spawn; this.placeWorld(s.x, s.y, s.z, s.yaw); } else if (!this.resident) this.comeHere();
    this.sub.sprite.position.set(0, (this.modelH || c.height || 1.7) + 0.32, 0); this.fitHit();
    if (this.ui) this.ui.sel.value = c.id, this.ui.btn.textContent = 'Talk to ' + c.name;
    if (!this.resident) { this.emit('pick', {name: c.name, role: c.role}); if (this.o.family !== false) this.syncFamily(); }
    if (!first && !this.hist.length) this.subtitle(c.name);
  }
  // per-character look: roster `texture` (replaces the main body/clothing texture) and `tint` (recolours clothing, skin kept)
  async applyLook(m, c) {
    if (!c.tint && !c.texture && !c.hairTint && !c.eyeTint) return; const T = this.T, mats = [];
    m.traverse(o => { if (o.isMesh) for (const mt of [].concat(o.material)) if (!mats.includes(mt)) mats.push(mt); });
    const main = mats.find(mt => /body/i.test(mt.name || '')) || mats.filter(mt => mt.map && !(mt.alphaTest > 0) && mt.transparent !== true)[0] || mats[0]; if (!main) return;
    if (c.texture) { try { const old = main.map, tx = await new T.TextureLoader().loadAsync(new URL(c.texture, this.rosterBase).href);
      tx.flipY = old ? old.flipY : false; tx.colorSpace = T.SRGBColorSpace || tx.colorSpace; if (old) { tx.wrapS = old.wrapS; tx.wrapT = old.wrapT; tx.channel = old.channel; } tx.anisotropy = 4;
      main.map = tx; main.needsUpdate = true; if (old) old.dispose(); } catch (e) { console.warn('[fpc] texture', c.texture, e); } }
    if (c.tint) { const col = new T.Color(c.tint), k = Math.max(0, Math.min(1, c.tintStrength === undefined ? 0.75 : +c.tintStrength));
      const sep = !!main.map && c.tintSkin !== true;   // skin-tone pixels keep their colour (hands, arms, neck on the body texture)
      main.onBeforeCompile = sh => { sh.uniforms.fpcTint = {value: col}; sh.uniforms.fpcTintK = {value: k};
        sh.fragmentShader = 'uniform vec3 fpcTint; uniform float fpcTintK;\n' + sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
        { vec3 c0 = diffuseColor.rgb; float l = dot(c0, vec3(0.299, 0.587, 0.114));
          float skin = ${sep ? 'smoothstep(0.02, 0.10, c0.r - c0.g) * smoothstep(0.0, 0.05, c0.g - c0.b) * smoothstep(0.03, 0.12, l) * (1.0 - smoothstep(0.55, 0.8, (c0.r - c0.b) / max(c0.r, 1e-3) - 0.25))' : '0.0'};
          vec3 rc = clamp(fpcTint * (l * 1.8 + 0.04), 0.0, 1.0);
          diffuseColor.rgb = mix(c0, rc, fpcTintK * (1.0 - skin)); }`); };
      main.customProgramCacheKey = () => 'fpctint' + (sep ? 's' : '') + col.getHexString() + k; main.needsUpdate = true; }
    // v1.2 hairTint: recolours the hair cards (the alpha-tested *_opacity material)
    if (c.hairTint) { const col = new T.Color(c.hairTint), k = Math.max(0, Math.min(1, c.hairTintStrength === undefined ? 0.85 : +c.hairTintStrength));
      const hair = mats.filter(mt => mt !== main && (/opacity|hair/i.test(mt.name || '') || mt.alphaTest > 0));
      for (const mt of hair) { mt.onBeforeCompile = sh => { sh.uniforms.fpcHair = {value: col}; sh.uniforms.fpcHairK = {value: k};
          sh.fragmentShader = 'uniform vec3 fpcHair; uniform float fpcHairK;\n' + sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
          { vec3 c0 = diffuseColor.rgb; float l = dot(c0, vec3(0.299, 0.587, 0.114)); float lum = max(dot(fpcHair, vec3(0.299, 0.587, 0.114)), 0.05);
            vec3 rc = clamp(fpcHair * (0.45 + 0.9 * l / lum * 0.45), 0.0, 1.0); diffuseColor.rgb = mix(c0, rc, fpcHairK); }`); };
        mt.customProgramCacheKey = () => 'fpchair' + col.getHexString() + k; mt.needsUpdate = true; } }
    // v1.2 eyeTint: recolours the iris on the head texture (Rocketbox layout: eyeball at uv 0.2645, 0.923; override with eyeUV [u, v, r]).
    // hairTint also recolours hair painted on the head texture (golden/brown pixels outside the eye/mouth atlas); hairTintHead: false turns that off.
    const head = mats.find(mt => mt !== main && /head/i.test(mt.name || '')), hh = c.hairTint && c.hairTintHead !== false;
    if (head && head.map && (c.eyeTint || hh)) { const E = Array.isArray(c.eyeUV) ? c.eyeUV : [0.2645, 0.923, 0.034];
      const eye = new T.Color(c.eyeTint || '#000'), hc = new T.Color(c.hairTint || '#000'), hk = hh ? Math.max(0, Math.min(1, c.hairTintStrength === undefined ? 0.85 : +c.hairTintStrength)) : 0, ek = c.eyeTint ? 0.92 : 0;
      head.onBeforeCompile = sh => { Object.assign(sh.uniforms, {fpcEye: {value: eye}, fpcEyeK: {value: ek}, fpcEyeUV: {value: new T.Vector3(E[0], E[1], E[2])}, fpcHair: {value: hc}, fpcHairK: {value: hk}});
        sh.fragmentShader = 'uniform vec3 fpcEye; uniform float fpcEyeK; uniform vec3 fpcEyeUV; uniform vec3 fpcHair; uniform float fpcHairK;\n' + sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
        { vec3 c0 = diffuseColor.rgb; float l = dot(c0, vec3(0.299, 0.587, 0.114));
          vec3 sc = sqrt(max(c0, 0.0)); float zone = max(1.0 - smoothstep(0.26, 0.34, vMapUv.y), smoothstep(0.58, 0.64, vMapUv.y) * smoothstep(0.53, 0.57, vMapUv.x));
          float hair = zone * smoothstep(-0.01, 0.03, (sc.g - sc.b) - (sc.r - sc.g) * 0.7) * smoothstep(0.02, 0.06, l);
          float lum = max(dot(fpcHair, vec3(0.299, 0.587, 0.114)), 0.05);
          diffuseColor.rgb = mix(c0, clamp(fpcHair * (0.45 + 0.9 * l / lum * 0.45), 0.0, 1.0), hair * fpcHairK);
          float d = distance(vMapUv, fpcEyeUV.xy) / fpcEyeUV.z;
          float iris = (1.0 - smoothstep(0.85, 1.05, d)) * smoothstep(0.03, 0.10, l) * (1.0 - smoothstep(0.42, 0.62, l));
          diffuseColor.rgb = mix(diffuseColor.rgb, fpcEye * (0.45 + l * 1.6), iris * fpcEyeK); }`); };
      head.customProgramCacheKey = () => 'fpchead' + eye.getHexString() + ek + hc.getHexString() + hk + E.join(','); head.needsUpdate = true; }
  }
  key() { return 'fpc:v1:' + this.playerId + ':' + this.ch.id; }
  save() { if (this.store.set) this.store.set(this.key(), this.hist.slice(-MAX_KEEP)); }

  fit(m, c) { // face +Z, feet on y = 0, height ~ c.height
    const T = this.T; m.updateMatrixWorld(true); const box = new T.Box3().setFromObject(m), h = box.max.y - box.min.y;
    if (h > 3 || h < 0.5) { const k = (c.height || 1.7) / h; m.scale.multiplyScalar(k); }
    { m.updateMatrixWorld(true); const h0 = new T.Box3().setFromObject(m), hh = h0.max.y - h0.min.y; let k = 1; if (+c.targetHeight > 0.5 && +c.targetHeight < 2.6) k = +c.targetHeight / hh; if (+c.scale > 0.3 && +c.scale < 2) k *= +c.scale;   // v1.2: per-character size
      if (k !== 1) { m.scale.multiplyScalar(k); m.updateMatrixWorld(true); } this.modelH = hh * k; }
    m.updateMatrixWorld(true); const b2 = new T.Box3().setFromObject(m); m.position.y -= b2.min.y;
    m.updateMatrixWorld(true);
    const find = n => { let f = null; if (n) m.traverse(o => { if (!f && o.isBone && bone(n, o)) f = o; }); return f; };
    const R = RIGS[c.rig] || RIGS.rocketbox, head = find(R.head), le = find(R.lEye), re = find(R.rEye);
    if (head && le && re) { const hp = head.getWorldPosition(new T.Vector3()), ep = le.getWorldPosition(new T.Vector3()).add(re.getWorldPosition(new T.Vector3())).multiplyScalar(0.5);
      const f = ep.sub(hp); f.y = 0; if (f.lengthSq() > 1e-8) { m.rotation.y = -Math.atan2(f.x, f.z); m.updateMatrixWorld(true); } }
  }
  rig(c) {
    const T = this.T, m = this.model, R = RIGS[c.rig] || RIGS.rocketbox, B = this.bones = {};
    const all = {}; m.traverse(o => { if (o.isBone) all[norm(o.name).replace(/^bip0\d/, 'bip01')] = o; });
    for (const k in R) B[k] = R[k] ? all[R[k]] || null : null;
    this.holder.updateMatrixWorld(true);
    const hq = this.holder.getWorldQuaternion(new T.Quaternion()), toW = v => v.applyQuaternion(hq).normalize();
    const aim = (bone, child, dir) => { if (!bone || !child) return; const P = bone.getWorldPosition(new T.Vector3()), C = child.getWorldPosition(new T.Vector3());
      const cur = C.sub(P).normalize(), q = new T.Quaternion().setFromUnitVectors(cur, dir), wq = bone.getWorldQuaternion(new T.Quaternion());
      const pq = bone.parent.getWorldQuaternion(new T.Quaternion()).invert(); bone.quaternion.copy(pq.multiply(q.multiply(wq))); bone.updateMatrixWorld(true); };
    const hipX = B.chest ? this.holder.worldToLocal(B.chest.getWorldPosition(new T.Vector3())).x : 0;
    for (const s of ['l', 'r']) { const up = B[s + 'Up'], fo = B[s + 'Fore'], ha = B[s + 'Hand']; if (!up || !fo) continue;
      const side = Math.sign(this.holder.worldToLocal(up.getWorldPosition(new T.Vector3())).x - hipX) || (s === 'l' ? 1 : -1);
      aim(up, fo, toW(new T.Vector3(side * 0.2, -1, 0.04)));
      if (ha) aim(fo, ha, toW(new T.Vector3(side * 0.08, -1, 0.32))); }
    this.base = {}; for (const k in B) if (B[k]) this.base[k] = B[k].quaternion.clone();
    // jaw: which way of turning opens the mouth (moves the lower lip down)
    this.jawSign = 1; if (B.jaw && B.lip) { const y0 = B.lip.getWorldPosition(new T.Vector3()).y; this.rotW(B.jaw, this.lateral(), 0.2); B.jaw.updateMatrixWorld(true);
      const y1 = B.lip.getWorldPosition(new T.Vector3()).y; this.jawSign = y1 < y0 ? 1 : -1; B.jaw.quaternion.copy(this.base.jaw); B.jaw.updateMatrixWorld(true); }
  }
  lateral() { return new this.T.Vector3(1, 0, 0).applyQuaternion(this.holder.getWorldQuaternion(new this.T.Quaternion())); }
  rotW(bone, axisW, ang) { if (!bone || !ang) return; const T = this.T, q = new T.Quaternion().setFromAxisAngle(axisW, ang), wq = bone.getWorldQuaternion(new T.Quaternion());
    const pq = bone.parent.getWorldQuaternion(new T.Quaternion()).invert(); bone.quaternion.copy(pq.multiply(q.multiply(wq))); bone.updateMatrixWorld(true); }

  // ---------- placement ----------
  placeWorld(x, y, z, yaw) { const T = this.T, p = new T.Vector3(x, y === undefined || y === null ? this.ground(x, z) : y, z); this.root3d.updateMatrixWorld(true); this.root3d.worldToLocal(p);
    this.holder.position.copy(p); if (yaw !== undefined) this.holder.rotation.y = yaw * Math.PI / 180; this.holder.visible = true; this.placed = true; }
  ground(x, z) { try { if (this.o.groundAt) { const g = this.o.groundAt(x, z); if (isFinite(g)) return g; } } catch (e) {} const c = this.playerPos(); return c ? c.y - 1.6 : 0; }
  playerPos() { const c = this.camera; return c ? c.getWorldPosition(new this.T.Vector3()) : null; }
  comeHere() { if (this.o.residentsOnly && !this.resident) { this.subtitle("They're at home.", ' ', 2500); return; } if (this._dismissed) { this._dismissed = false; this._stayOut = null; this._leaving = false; Companion._banterLeft = 2; Companion._banterStarted = false; } const T = this.T, c = this.camera; if (!c) return; const p = c.getWorldPosition(new T.Vector3()), f = c.getWorldDirection(new T.Vector3()); f.y = 0; if (f.lengthSq() < 1e-6) f.set(0, 0, -1); f.normalize();
    const hi = this.resident ? null : this.houseInfo();
    if (hi && hi.inside(p.x, p.z)) { if (hi.spot) { this.placeWorld(hi.spot[0], hi.spot[1], hi.spot[2]); this.faceW(p, true); this.atPorch = true; this.emit('moved', {reason: 'porch'}); } return; }   // player indoors: wait on the porch
    const r = new T.Vector3(-f.z, 0, f.x);
    for (const [a, b] of [[1.7, 0.5], [0.4, 1.6], [0.4, -1.6], [-1.6, 0.4]]) { const x = p.x + f.x * a + r.x * b, z = p.z + f.z * a + r.z * b;   // front, right, left, behind: first spot outside the house walls
      if (hi && hi.inside(x, z, 0.4)) continue; this.placeWorld(x, null, z); this.faceW(p, true); this.emit('moved'); return; }
    if (hi && hi.spot) { this.placeWorld(hi.spot[0], hi.spot[1], hi.spot[2]); this.faceW(p, true); this.emit('moved', {reason: 'porch'}); } }
  /* v1.2.2/1.2.3: B's family home (window.FP_HOME). House footprint from FP_HOME.bounds / .house {x0, x1, z0, z1} (world), else FP_HOME.site centre +- 6.4 x 4.9 m,
     else a 6 m circle round the porch. FP_HOME.porchBounds is treated as not-inside (the player on the porch is outdoors). Waiting spot: 1.6 m beside spawns.porch, away from the wife. */
  houseInfo() { const H = window.FP_HOME; if (!H || !H.spawns || H.ready === false || this.world !== 'earth' || this.o.houseAware === false) return null;
    const P = v => !v ? null : Array.isArray(v) ? v : Array.isArray(v.position) ? v.position : isFinite(v.x) ? [v.x, v.y, v.z] : null, inRect = (r, x, z, m) => !!(r && isFinite(r.x0) && x > r.x0 - m && x < r.x1 + m && z > r.z0 - m && z < r.z1 + m);
    const porch = P(H.spawns.porch), wife = P(H.spawns.wife), b = H.bounds || H.house, pb = H.porchBounds; let rect = null, circ = null;
    if (b && isFinite(b.x0) && isFinite(b.z1)) rect = b; else if (H.site && isFinite(H.site.x) && isFinite(H.site.z)) rect = {x0: H.site.x - 6.4, x1: H.site.x + 6.4, z0: H.site.z - 4.9, z1: H.site.z + 4.9};
    else if (porch || wife) { const c0 = porch || wife; circ = {x: c0[0], z: c0[2], r: 6}; }
    if (!rect && !circ && !pb) return null;
    const inside = (x, z, m) => { m = m || 0; if (inRect(pb, x, z, 0)) return false; return rect ? inRect(rect, x, z, m) : !!(circ && Math.hypot(x - circ.x, z - circ.z) < circ.r + m); };
    let spot = null; if (porch) { const cx = rect ? (rect.x0 + rect.x1) / 2 : porch[0], cz = rect ? (rect.z0 + rect.z1) / 2 : porch[2] + 1; let dx = porch[0] - cx, dz = porch[2] - cz; const L = Math.hypot(dx, dz) || 1; dx /= L; dz /= L;
      let px = -dz, pz = dx; if (wife && Math.hypot(porch[0] + px - wife[0], porch[2] + pz - wife[2]) < Math.hypot(porch[0] - px - wife[0], porch[2] - pz - wife[2])) { px = -px; pz = -pz; }
      spot = [porch[0] + px * 1.6, porch[1] === undefined ? null : porch[1], porch[2] + pz * 1.6]; }
    return {inside, spot, rect, circ}; }
  faceW(p, snap) { const T = this.T, h = this.holder.getWorldPosition(new T.Vector3()), want = Math.atan2(p.x - h.x, p.z - h.z) - this.parentYaw();
    if (snap) this.holder.rotation.y = want; return want; }
  parentYaw() { const e = new this.T.Euler().setFromQuaternion(this.root3d.getWorldQuaternion(new this.T.Quaternion()), 'YXZ'); return e.y; }

  // ---------- per frame ----------
  hookTick() {
    const A = window.AFRAME, s = this.sceneEl;
    if (A && s && s.isScene && this.rootEl && this.rootEl.appendChild) {
      if (!A.components['fpc-tick']) A.registerComponent('fpc-tick', {tick(t, dt) { const i = this.el.__fpc; if (i && !i.dead) i.update(Math.min(dt || 16, 100) / 1000); }});
      const e = document.createElement('a-entity'); e.__fpc = this; e.setAttribute('fpc-tick', ''); e.setAttribute('class', 'fpc-tickel'); this.rootEl.appendChild(e); this.tickEl = e;
      this.cleanup.push(() => e.parentNode && e.parentNode.removeChild(e));
    } else if (this.o.autoTick !== false) { let last = performance.now(); const loop = () => { if (this.dead) return; const n = performance.now(); this.update(Math.min(n - last, 100) / 1000); last = n; this.raf = requestAnimationFrame(loop); }; this.raf = requestAnimationFrame(loop); }
  }
  update(dt) {
    if (this.dead || !this.model) return; const T = this.T; this.t += dt; const t = this.t, B = this.bones, base = this.base;
    const cam = this.camera, pp = cam ? cam.getWorldPosition(new T.Vector3()) : null, hp = this.holder.getWorldPosition(new T.Vector3());
    // follow: a travelling companion stays near the player (also after teleports, rooms, rocket rides)
    if (this.resident && this.wander) this.doWander(dt, pp, hp);
    if (pp && !this.resident && !this.placed) this.comeHere();   // no spawn given: appear beside the player once there is a camera
    if (pp && !this.resident && this._dismissed) {
      const dest = this._stayOut; if (dest && Math.hypot(hp.x - dest[0], hp.z - dest[2]) > 1.5) { this.placeWorld(dest[0], dest[1], dest[2], dest[3]); }
    } else if (pp && !this.resident && this.ch.canTravel !== false && this.o.follow !== false && this.state === 'idle') { const d = Math.hypot(pp.x - hp.x, pp.z - hp.z), dy = Math.abs(pp.y - 1.6 - hp.y);
      const hi = this.houseInfo();
      if (hi && hi.inside(pp.x, pp.z)) {   // v1.2.2: player inside the family home: wait on the porch instead of following through the walls
        if (hi.spot && !this.atPorch && Math.hypot(hp.x - hi.spot[0], hp.z - hi.spot[2]) > 1) { this.placeWorld(hi.spot[0], hi.spot[1], hi.spot[2]); this.faceW(pp, true); this.emit('moved', {reason: 'porch'}); }
        this.atPorch = true; }
      else { this.atPorch = false; if (d > (this.o.followDist || 14) || dy > 6) this.comeHere(); } }
    // turn the body toward the player when close or talking
    if (pp && !this.walking) { const d = Math.hypot(pp.x - hp.x, pp.z - hp.z); if (d < 8 || this.state !== 'idle') { const want = Math.atan2(pp.x - hp.x, pp.z - hp.z) - this.parentYaw();
      let dy = ((want - this.holder.rotation.y + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; const thr = this.state !== 'idle' ? 0.05 : 0.7;
      if (Math.abs(dy) > thr || this.turning) { this.turning = Math.abs(dy) > 0.03; this.holder.rotation.y += Math.sign(dy) * Math.min(Math.abs(dy), 1.6 * dt); } } }
    this.holder.updateMatrixWorld(true);
    for (const k in base) B[k].quaternion.copy(base[k]);
    const up = new T.Vector3(0, 1, 0), lat = this.lateral(); const talk = this.speaking ? 1 : 0;
    const ord = ['hips', 'spine', 'chest', 'neck', 'head', 'lUp', 'rUp', 'lFore', 'rFore', 'jaw'];
    const apply = (k, axis, a) => { if (B[k]) this.rotW(B[k], axis, a); };
    if (B.hips) B.hips.updateMatrixWorld(true);
    apply('hips', up, Math.sin(t * 0.37) * 0.035);
    apply('spine', up, -Math.sin(t * 0.37) * 0.02);
    apply('chest', lat, Math.sin(t * 1.5) * 0.012 + 0.01);
    // look at the player's head (clamped), shared between neck and head
    if (pp && B.head) { const h = B.head.getWorldPosition(new T.Vector3()), v = pp.clone().sub(h), loc = v.clone().applyQuaternion(this.holder.getWorldQuaternion(new T.Quaternion()).invert());
      const near = loc.length() < 12; let yw = near ? Math.atan2(loc.x, loc.z) : 0, pt = near ? Math.atan2(loc.y, Math.hypot(loc.x, loc.z)) : 0;
      yw = Math.max(-1.0, Math.min(1.0, yw)); pt = Math.max(-0.45, Math.min(0.35, pt));
      const k = 1 - Math.exp(-dt * 4); this.look.yaw += (yw - this.look.yaw) * k; this.look.pitch += (pt - this.look.pitch) * k;
      const n = this.look; apply('neck', up, n.yaw * 0.4); apply('neck', lat, -n.pitch * 0.4); apply('head', up, n.yaw * 0.6 + Math.sin(t * 0.6) * 0.03); apply('head', lat, -n.pitch * 0.6 + Math.sin(t * 0.9) * 0.02 + (talk ? Math.sin(t * 5.1) * 0.02 : 0)); }
    // arms: a soft sway, small gestures while talking
    apply('lUp', lat, Math.sin(t * 0.8) * 0.02 + talk * Math.sin(t * 2.3) * 0.05); apply('rUp', lat, Math.sin(t * 0.8 + 1) * 0.02 + talk * Math.sin(t * 1.9 + 2) * 0.05);
    apply('lFore', lat, -talk * (0.15 + Math.sin(t * 3.1) * 0.12)); apply('rFore', lat, -talk * (0.1 + Math.sin(t * 2.7 + 1) * 0.12));
    // mouth
    const target = this.speaking ? (0.06 + 0.11 * Math.abs(Math.sin(t * 11.0)) * (0.6 + 0.4 * Math.sin(t * 3.3)) + (this.pulse || 0)) : 0;
    this.pulse = Math.max(0, (this.pulse || 0) - dt * 1.5); this.jaw += (target - this.jaw) * Math.min(1, dt * 18);
    apply('jaw', lat, this.jaw * this.jawSign);
    // subtitle fades
    if (this.sub.until && performance.now() > this.sub.until && this.state === 'idle') { this.sub.sprite.material.opacity = Math.max(0, this.sub.sprite.material.opacity - dt * 1.5); if (this.sub.sprite.material.opacity <= 0) { this.sub.sprite.visible = false; this.sub.until = 0; } }
  }

  doWander(dt, pp, hp) {   // kids drift around the yard / play area at an easy walk; they stop to chat
    const W = this.wander, busy = this.state !== 'idle' || this.speaking || (pp && Math.hypot(pp.x - hp.x, pp.z - hp.z) < 2.5);
    if (busy) { this.walking = false; return; }
    if (!this.wTarget) { this.wWait -= dt; if (this.wWait > 0) { this.walking = false; return; } const a = Math.random() * 6.283, r = W.r * Math.sqrt(Math.random()); this.wTarget = {x: W.x + Math.cos(a) * r, z: W.z + Math.sin(a) * r}; }
    const dx = this.wTarget.x - hp.x, dz = this.wTarget.z - hp.z, d = Math.hypot(dx, dz);
    if (d < 0.15) { this.wTarget = null; this.wWait = 4 + Math.random() * 7; this.walking = false; return; }
    const st = Math.min(d, 0.75 * dt), nx = hp.x + dx / d * st, nz = hp.z + dz / d * st; this.walking = true;
    const want = Math.atan2(dx, dz) - this.parentYaw(); let dy = ((want - this.holder.rotation.y + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
    this.holder.rotation.y += Math.sign(dy) * Math.min(Math.abs(dy), 3 * dt); const T = this.T, p = new T.Vector3(nx, this.ground(nx, nz), nz); this.root3d.updateMatrixWorld(true); this.root3d.worldToLocal(p); this.holder.position.copy(p);
  }
  fitHit() { const o = this.hitEl && this.hitEl.object3D, h = this.modelH || 1.7; if (o) { o.scale.set(1, h / 1.8, 1); o.position.set(0, h / 2, 0); } }

  // ---------- subtitles (canvas sprite, works in VR) ----------
  makeSubtitle() {
    const T = this.T, cv = document.createElement('canvas'); cv.width = 1024; cv.height = 320; const tex = new T.CanvasTexture(cv); tex.colorSpace = T.SRGBColorSpace;
    const sprite = new T.Sprite(new T.SpriteMaterial({map: tex, transparent: true, depthTest: true, toneMapped: false})); sprite.scale.set(1.5, 0.47, 1); sprite.visible = false; sprite.renderOrder = 10;
    return {cv, tex, sprite, until: 0};
  }
  subtitle(text, who, ms) {
    const s = this.sub, g = s.cv.getContext('2d'); g.clearRect(0, 0, 1024, 320);
    g.fillStyle = 'rgba(12,14,20,0.72)'; round(g, 8, 8, 1008, 304, 36); g.fill();
    g.fillStyle = '#ffd98a'; g.font = '600 40px system-ui, sans-serif'; g.fillText(who || (this.ch && this.ch.name) || '', 40, 66);
    g.fillStyle = '#ffffff'; g.font = '38px system-ui, sans-serif'; const lines = wrap(g, String(text || ''), 944).slice(0, 5); lines.forEach((l, i) => g.fillText(l, 40, 120 + i * 44));
    s.tex.needsUpdate = true; s.sprite.visible = true; s.sprite.material.opacity = 1; s.until = performance.now() + (ms || 4000 + String(text || '').length * 60);
    if (this.ui) this.ui.log.textContent = (who || (this.ch && this.ch.name)) + ': ' + text;
  }

  // ---------- input ----------
  hookInput() {
    const T = this.T, s = this.sceneEl, on = (el, ev, f, o) => { if (!el) return; el.addEventListener(ev, f, o); this.cleanup.push(() => el.removeEventListener(ev, f, o)); };
    const near = () => { const p = this.playerPos(), h = this.holder.getWorldPosition(new T.Vector3()); return p && Math.hypot(p.x - h.x, p.z - h.z) < (this.o.talkRange || 6); };
    // A-Frame: a clickable hitbox (Fowling Pond's lasers raycast .btn)
    if (window.AFRAME && this.rootEl && this.rootEl.appendChild) {
      const hb = document.createElement('a-entity'); hb.setAttribute('class', 'btn fpc-hit'); hb.setAttribute('geometry', 'primitive: box; width: 0.7; height: 1.8; depth: 0.5');
      hb.setAttribute('material', 'transparent: true; opacity: 0; depthWrite: false'); this.rootEl.appendChild(hb); this.hitEl = hb;
      hb.addEventListener('loaded', () => { this.holder.add(hb.object3D); hb.object3D.position.set(0, 0.9, 0); this.fitHit(); });
      hb.addEventListener('click', () => this.tap()); this.cleanup.push(() => hb.parentNode && hb.parentNode.removeChild(hb));
    }
    // canvas click / tap on the avatar (any host)
    const canvas = (this.renderer && this.renderer.domElement) || (s && s.canvas);
    on(canvas, 'pointerup', e => { if (this.inXR || !this.model || !this.camera) return; const r = canvas.getBoundingClientRect();
      const v = new T.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), rc = new T.Raycaster(); rc.setFromCamera(v, this.camera);
      const box = new T.Box3().setFromObject(this.model); if (rc.ray.intersectsBox(box)) this.tap(); });
    // controller: hold B (right) near the companion to talk, release to send
    if (this.resident) return;   // family residents: tap / click them to talk
    on(s, 'bbuttondown', () => { this.unlockAudio(); if (near()) this.listen(true); });
    on(s, 'bbuttonup', () => { if (this.rec && this.rec.hold) this.stopListen(); });
    // desktop: T = talk (hold, or tap to toggle); Enter in the text box
    on(window, 'keydown', e => { if (e.repeat || /input|textarea/i.test((e.target && e.target.tagName) || '')) return; if (e.code === 'KeyT') { this.unlockAudio(); if (this.rec) this.stopListen(); else this.listen(true); } });
    on(window, 'keyup', e => { if (e.code === 'KeyT' && this.rec && this.rec.hold && performance.now() - this.rec.t0 > 600) this.stopListen(); });
  }
  tap() { this.unlockAudio(); const n = performance.now(); if (n - this.lastTap < 500) return; this.lastTap = n; if (this.rec) this.stopListen(); else if (this.speaking) { this.stopSpeaking(); if (this.handsFree) this.armListen(200); } else this.listen(false); }

  makeUI() {
    const d = document.createElement('div'); d.className = 'fpc-ui';
    d.innerHTML = '<style>.fpc-ui{position:fixed;left:12px;bottom:12px;z-index:30;font:14px system-ui,sans-serif;color:#fff;max-width:min(420px,92vw);transition:opacity .2s ease,bottom .2s ease}.fpc-ui.fpc-raised{bottom:calc(var(--fpc-menu-h, 56px) + env(safe-area-inset-bottom, 0px))}.fpc-ui.fpc-menu-open{opacity:0;pointer-events:none}.fpc-ui .row{display:flex;gap:6px;margin-top:6px}.fpc-ui button,.fpc-ui select,.fpc-ui input{font:inherit;border-radius:8px;border:1px solid #c9a24a;background:rgba(20,20,26,.85);color:#fff;padding:7px 10px}.fpc-ui button.main{background:#c9a24a;color:#1a1408;font-weight:600}.fpc-ui button.mute{min-width:3.6em}.fpc-ui button.mic{min-width:3.2em}.fpc-gate{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(8,10,16,.72);color:#fff;font:20px/1.35 system-ui,sans-serif;text-align:center;padding:24px;cursor:pointer;-webkit-tap-highlight-color:transparent}.fpc-gate b{display:block;font-size:26px;margin-bottom:8px;color:#ffe9a8}.fpc-ui input{flex:1;min-width:0}.fpc-ui .log{background:rgba(10,12,18,.72);border-radius:8px;padding:7px 10px;margin-top:6px;display:none}.fpc-ui.open .log{display:block}.fpc-ui .more{display:none}.fpc-ui.open .more{display:flex}</style>' +
      '<div class="row"><button class="main" type="button"></button><button class="mute" type="button" title="Voice on"></button><button class="mic" type="button" title="Microphone"></button><button class="tog" type="button" title="Type, choose a companion">...</button></div>' +
      '<div class="row more"><input class="txt" placeholder="Type to talk" maxlength="400"><button class="snd" type="button">Send</button></div>' +
      '<div class="row more"><select class="sel"></select><button class="come" type="button">Come here</button><button class="fgt" type="button" title="Forget this conversation">Forget</button></div>' +
      '<div class="row more"><input class="pw" type="password" placeholder="Passphrase" autocomplete="off"><button class="pws" type="button">Save</button></div>' +
      '<div class="log"></div>';
    document.body.appendChild(d); const q = c => d.querySelector(c);
    const ui = this.ui = {el: d, btn: q('.main'), sel: q('.sel'), log: q('.log'), txt: q('.txt')};
    { const G = {girlfriend: 'Girlfriends', companion: 'Companions', wife: 'Family', child: 'Family'}, groups = {};   // kids only ever in the Family group
      for (const c of this.roster) { if (!this.inWorld(c)) continue; const gn = G[c.role] || 'Companions'; let g = groups[gn];
        if (!g) { g = groups[gn] = document.createElement('optgroup'); g.label = gn; }
        const o = document.createElement('option'); o.value = c.id; o.textContent = c.name + (c.role === 'wife' ? ' (wife)' : c.role === 'child' ? ' (' + (c.relation || 'kid') + ')' : ''); g.appendChild(o); }
      for (const gn of ['Girlfriends', 'Companions', 'Family']) if (groups[gn]) ui.sel.appendChild(groups[gn]); }
    ui.btn.onclick = () => { const t = this.talkTarget(); if (t && t !== this) t.tap(); else this.tap(); }; ui.mute = q('.mute'); this.syncMuteBtn(); ui.mute.onclick = () => { this.setVoiceOn(!this.voiceOn()); };
    ui.mic = q('.mic'); this.syncMicBtn(); ui.mic.onclick = () => { this.handsFree = !this.handsFree; this.syncMicBtn(); if (this.handsFree) { this.unlockAudio(); this.armListen(100); } else { clearTimeout(this._listenArm); if (this.rec) this.stopListen(); this.state = 'idle'; } };
    q('.tog').onclick = () => d.classList.toggle('open'); d.addEventListener('pointerdown', () => this.unlockAudio(), {passive: true});
    const dest = () => this.talkTarget() || this;
    const sendTxt = () => { const v = ui.txt.value.trim(); if (v) { ui.txt.value = ''; dest().send(v); } };
    q('.snd').onclick = sendTxt; ui.txt.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter') sendTxt(); };
    ui.sel.onchange = () => { const id = ui.sel.value, c = this.roster.find(x => x.id === id);
      if (c && FAMILY(c.role)) { this.setTalkTarget(id); const r = this.family.get(id); if (r) r.tap(); return; }
      if (this._dismissed) this.recall(); if (this.ch && this.ch.id !== id) this.pick(id); this._talkId = id; this.claimTalk(); this.tap(); };
    q('.come').onclick = () => { if (this._dismissed) this.recall(); else this.comeHere(); }; q('.fgt').onclick = () => { this.hist = []; this.save(); this.subtitle('(conversation cleared)'); };
    q('.pws').onclick = () => { this.setPass(q('.pw').value); q('.pw').value = ''; this.subtitle('Passphrase saved.', ' '); };
    q('.pw').onkeydown = e => e.stopPropagation();
    if (this.o.hideUiInXR !== false && this.sceneEl && this.sceneEl.addEventListener) { const f = () => { d.style.display = this.inXR ? 'none' : ''; }; this.sceneEl.addEventListener('enter-vr', f); this.sceneEl.addEventListener('exit-vr', f); }
    this.hookMenuUI(d);
    this.cleanup.push(() => d.remove());
  }
  /* v1.2.3: the 2D world menu (#ui, menutabs) sits at the bottom and the companion bar (z-index 30) used to cover it on phones.
     Open = #ui is visible and a pane is showing (ui.dataset.tab, .pane.cur, or #ui.help) or the Hide control has not hidden it.
     While a pane is open the bar fades out; on narrow screens it also lifts above #ui whenever the menu strip is visible. */
  hookMenuUI(d) {
    const apply = () => { const ui = document.getElementById('ui'), vis = !!(ui && getComputedStyle(ui).display !== 'none' && ui.getClientRects().length), pane = !!(vis && (ui.dataset.tab || ui.querySelector('.pane.cur') || ui.classList.contains('help'))), narrow = window.matchMedia('(max-width: 700px)').matches;
      d.classList.toggle('fpc-menu-open', vis && pane); const raise = vis && narrow; d.classList.toggle('fpc-raised', raise);
      if (raise) d.style.setProperty('--fpc-menu-h', Math.ceil(ui.getBoundingClientRect().height + 10) + 'px'); else d.style.removeProperty('--fpc-menu-h'); };
    const mo = new MutationObserver(apply); const watch = el => { if (el) mo.observe(el, {attributes: true, attributeFilter: ['style', 'class', 'data-tab', 'hidden'], childList: true, subtree: true}); };
    watch(document.getElementById('ui')); watch(document.getElementById('uitog'));
    window.addEventListener('resize', apply); const ro = window.ResizeObserver && document.getElementById('ui') ? new ResizeObserver(apply) : null; if (ro) ro.observe(document.getElementById('ui'));
    apply(); this.syncMenuUI = apply;
    this.cleanup.push(() => { mo.disconnect(); if (ro) ro.disconnect(); window.removeEventListener('resize', apply); });
  }

  // ---------- passphrase ----------
  pass() { if (this.o.passphrase) return this.normPass(this.o.passphrase); try { const u = new URLSearchParams(location.search).get('fppass'); if (u) this.setPass(u); return this.normPass(localStorage.getItem('fpc.pass') || ''); } catch (e) { return ''; } }
  normPass(s) { return String(s || '').replace(/[\u2018\u2019\u201A\u201B]/g, "'").replace(/[\u201C\u201D\u201E]/g, '"').replace(/[\u00A0\u202F\u2007\u2009\u200A\s]+/g, ' ').trim().toLowerCase(); }
  setPass(p) { try { localStorage.setItem('fpc.pass', this.normPass(p)); } catch (e) {} }
  showPassPrompt(reason) {
    const name = (this.ch && this.ch.name) || 'Lila';
    const hint = reason === 'wrong' ? 'That passphrase was not right. Try again.' : 'Enter the companion passphrase, then you can talk.';
    if (this._passUi) { this._passUi.hint.textContent = hint; try { this._passUi.inp.focus(); this._passUi.inp.click(); } catch (e) {} return; }
    const wrap = document.createElement('div'); wrap.className = 'fpc-pass'; wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-label', 'Companion passphrase');
    wrap.innerHTML = '<style>.fpc-pass{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;background:rgba(8,10,16,.8);font:18px/1.35 system-ui,sans-serif;color:#fff;padding:24px;-webkit-tap-highlight-color:transparent}.fpc-pass .box{background:rgba(20,20,26,.97);border:1px solid #c9a24a;border-radius:14px;padding:22px;width:min(440px,94vw);text-align:center}.fpc-pass h2{margin:0 0 8px;font-size:22px;color:#ffe9a8}.fpc-pass p{margin:0 0 14px}.fpc-pass input{width:100%;box-sizing:border-box;font:20px/1.3 system-ui,sans-serif;padding:14px 12px;border-radius:8px;border:1px solid #c9a24a;background:#111;color:#fff}.fpc-pass button{margin-top:12px;width:100%;font:20px/1.3 system-ui,sans-serif;padding:14px 12px;border-radius:8px;border:1px solid #c9a24a;background:#c9a24a;color:#1a1408;font-weight:700}</style>' +
      '<div class="box"><h2>Talk to ' + name + '</h2><p class="hint">' + hint + '</p><input class="pw" type="text" inputmode="text" enterkeyhint="done" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"><button type="button" class="ok">OK</button></div>';
    const inp = wrap.querySelector('.pw'), go = () => { const v = this.normPass(inp.value); if (!v) { try { inp.focus(); } catch (e) {} return; } this.unlockAudio(); this.setPass(v); this.hidePassPrompt(); this.showTalkStrip(); const next = this._afterPass; this._afterPass = null; if (this._wantStart || !this._greeted) { this._wantStart = false; this.beginTalk(); } else if (typeof next === 'function') next(); else this.subtitle('Passphrase saved. You can talk or type to me now.', ' ', 4000); };
    wrap.querySelector('.ok').onclick = go; inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); go(); } });
    (document.body || document.documentElement).appendChild(wrap); this._passUi = {el: wrap, inp, hint: wrap.querySelector('.hint')}; this.cleanup.push(() => this.hidePassPrompt());
    setTimeout(() => { try { inp.focus(); inp.click(); } catch (e) {} }, 50);
  }
  hidePassPrompt() { if (!this._passUi) return; try { this._passUi.el.remove(); } catch (e) {} this._passUi = null; }
  needPass(reason) { reason = reason || 'missing'; this.emit('error', {error: 'passphrase', reason});
    if (typeof this.o.onNeedPass === 'function') {   // host shows its own prompt (Mars: in-world VR keyboard)
      const self = this; let used = false;
      try { this.o.onNeedPass({reason, character: this.ch && {id: this.ch.id, name: this.ch.name},
        submit(pass, retryText) { if (used || self.dead) return false; used = true; pass = String(pass || '').trim(); if (!pass) return false; self.setPass(pass); self.hidePassPrompt(); if (retryText) self.send(String(retryText)); return true; },
        cancel() { used = true; self.hidePassPrompt(); }}); } catch (e) { console.warn('[fpc] onNeedPass', e); }
      return; }
    this.showPassPrompt(reason);
    this.subtitle(reason === 'wrong' ? 'That passphrase was not right. Enter it in the box in the middle of the screen.' : 'Enter the companion passphrase in the box in the middle of the screen, then talk to me again.', ' ', 7000); }

  // ---------- listening (v1.2.5: hands-free turn-taking) ----------
  armListen(ms) { clearTimeout(this._listenArm); if (!this.handsFree || this.dead || this._dismissed || (Companion.talker && Companion.talker !== this)) return;
    this._listenArm = setTimeout(() => { if (!this.dead && this.handsFree && !this.rec && !this.speaking && this.state !== 'thinking' && !this._dismissed && (!Companion.talker || Companion.talker === this)) this.listen(false, true); }, ms == null ? 400 : ms); }
  afterSpeak(gen) {
    if (gen != null && gen !== this._speakGen) return; this.speaking = false; if (this.sub) this.sub.until = performance.now() + 2500;
    if (this._afterGoodbye) { const f = this._afterGoodbye; this._afterGoodbye = null; f(); return; }
    if (this._afterBanter) { const f = this._afterBanter; this._afterBanter = null; f(); return; }
    if (this._dismissed || this._leaving) return;
    if (Companion.talker && Companion.talker !== this) return;
    if (this.handsFree) this.armListen(400);
  }
  isEcho(t) { const n = s => String(s || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim(); const a = n(t), b = n(this._lastSpoken); return !!(a && b && (b.includes(a) || a.includes(b) || (a.length > 12 && b.length > 12 && a.slice(0, 24) === b.slice(0, 24)))); }
  showStartGate() {
    if (this.resident || this._gate || this.dead) return;
    const n = (this.ch && this.ch.name) || 'Lila', d = document.createElement('div'); d.className = 'fpc-gate';
    d.innerHTML = '<div><b>Tap to talk with ' + n + '</b>Then just speak — she will listen and answer.</div>';
    d.addEventListener('pointerdown', ev => { ev.preventDefault(); ev.stopPropagation(); this.unlockAudio(); this.beginTalk(); }, {once: true});
    (document.body || document.documentElement).appendChild(d); this._gate = d; this.cleanup.push(() => d.remove());
  }
  isQuest() { return !!(this.o.quest || /OculusBrowser|Quest/i.test(navigator.userAgent || '')); }
  needsTypeFallback() { return this.isQuest() || this._micFailed || Companion.srBroken || !(window.SpeechRecognition || window.webkitSpeechRecognition); }
  showTalkStrip() {
    if (this.dead || this.resident || this._talkUi) return;
    const name = (Companion.talker && Companion.talker.ch && Companion.talker.ch.name) || (this.talkTarget() && this.talkTarget().ch && this.talkTarget().ch.name) || (this.ch && this.ch.name) || 'Lila';
    const d = document.createElement('div'); d.className = 'fpc-type';
    d.innerHTML = '<style>.fpc-type{position:fixed;left:50%;bottom:calc(18px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:9998;width:min(520px,94vw);font:18px/1.3 system-ui,sans-serif;color:#fff;-webkit-tap-highlight-color:transparent}.fpc-type .row{display:flex;gap:8px}.fpc-type input,.fpc-type button{font:inherit;padding:14px 12px;border-radius:10px;border:1px solid #c9a24a}.fpc-type input{flex:1;min-width:0;background:rgba(16,16,22,.96);color:#fff}.fpc-type button{background:#c9a24a;color:#1a1408;font-weight:700;min-width:5em}</style>' +
      '<div class="row"><input class="txt" type="text" enterkeyhint="send" placeholder="Type to ' + name + '" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"><button type="button" class="snd">Send</button></div>';
    const inp = d.querySelector('.txt'), send = () => { const v = (inp.value || '').trim(); if (!v) { try { inp.focus(); } catch (e) {} return; } inp.value = ''; this.unlockAudio(); const t = this.talkTarget() || this; t.send(v); };
    d.querySelector('.snd').onclick = send; inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); send(); } });
    d.addEventListener('pointerdown', () => this.unlockAudio(), {passive: true});
    (document.body || document.documentElement).appendChild(d); this._talkUi = {el: d, inp}; this.relabelStrip(name); this.cleanup.push(() => { try { d.remove(); } catch (e) {} this._talkUi = null; });
  }
  hideTalkStrip() { if (!this._talkUi) return; try { this._talkUi.el.remove(); } catch (e) {} this._talkUi = null; }
  async beginTalk() {
    if (this._gate) { try { this._gate.remove(); } catch (e) {} this._gate = null; }
    this.unlockAudio(); this.handsFree = true; this.syncMicBtn();
    // Do not await the mic here: on Quest the mic is often already held by voice chat, and waiting would block her greeting (no bubble, no voice).
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({audio: true}).then(st => st.getTracks().forEach(t => t.stop())).catch(() => { this._micFailed = true; this.showTalkStrip(); });
    }
    if (!this.pass()) { this._wantStart = true; this.showTalkStrip(); return this.needPass(); }
    this.showTalkStrip();
    if (!this._greeted) { this._greeted = true; const n = (this.ch && this.ch.name) || 'Lila'; this.speak('Hi, it\'s ' + n + '. I\'m here with you — go ahead and talk or type to me.'); }
    else this.armListen(200);
  }
  syncMicBtn() { const b = this.ui && this.ui.mic; if (!b) return; b.textContent = this.handsFree ? 'Mic' : 'Mic off'; b.title = this.handsFree ? 'Listening automatically — tap to pause' : 'Microphone paused — tap to listen'; }

  async listen(hold, auto) {
    if (this.o.residentsOnly && !this.resident) { const r = this.talkTarget(); return r ? r.listen(hold, auto) : undefined; }
    this.unlockAudio();
    if (this._dismissed && !auto) this.recall();
    if (auto && (this._dismissed || (Companion.talker && Companion.talker !== this))) return;
    if (!auto) this.handsFree = true;   // a click or Talk tap starts continuous turn-taking (needed for family residents, whose handsFree starts off)
    if (!auto) this.claimTalk();
    if (this.dead || this.rec || this.state === 'thinking' || this.speaking) return; if (!this.pass()) { this._afterPass = () => this.listen(); return this.needPass(); }
    if (!auto) this.stopSpeaking();
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.state = 'listening'; this.subtitle('Listening...', ' ', 20000); this.emit('listening'); this.syncMicBtn();
    if (SR && !Companion.srBroken) {
      const r = new SR(); r.lang = (this.ch.voice && this.ch.voice.lang) || 'en-US'; r.interimResults = true; r.continuous = !hold; r.maxAlternatives = 1;
      let final = '', interim = '', sil = 0;
      const take = () => { if (sil) { clearTimeout(sil); sil = 0; } const t = (final || interim).trim();
        if (this.rec && this.rec.r === r) { try { r.onresult = r.onerror = r.onend = null; r.stop(); } catch (e) {} this.rec = null; }
        if (t && !this.isEcho(t)) this.send(t);
        else if (this.handsFree && !this.dead && !this.speaking) { this.state = 'idle'; this.armListen(280); }
        else { this.state = 'idle'; if (!this.handsFree) this.subtitle('I didn\'t catch that.', ' ', 2500); } };
      this.rec = {kind: 'sr', r, hold, t0: performance.now(), take};
      r.onresult = e => { if (this.speaking) return; let f = '', i = ''; for (let k = 0; k < e.results.length; k++) { const x = e.results[k]; if (x.isFinal) f += x[0].transcript; else i += x[0].transcript; }
        final = f; interim = i; this.subtitle((f || i).trim(), 'You', 15000); if (sil) clearTimeout(sil);
        if (!hold && (f.trim() || i.trim())) sil = setTimeout(take, f.trim() ? 550 : 1500); };
      r.onerror = e => { if (e.error === 'no-speech' || e.error === 'aborted') return; if (/not-allowed|service-not-allowed/.test(e.error)) { Companion.srBroken = true; this.rec = null; this.state = 'idle'; this.subtitle('I can\'t hear the microphone. You can type to me instead.', ' ', 5000); return; } if (/network|language/.test(e.error)) Companion.srBroken = !final && !interim; };
      r.onend = () => { if (!(this.rec && this.rec.r === r)) return; if (sil) { clearTimeout(sil); sil = 0; } const t = (final || interim).trim(); this.rec = null;
        if (t && !this.isEcho(t)) this.send(t);
        else if (this.handsFree && !this.speaking && this.state !== 'thinking' && !this.dead) { this.state = 'idle'; this.armListen(250); }
        else { this.state = 'idle'; if (!this.handsFree) this.subtitle('I didn\'t catch that.', ' ', 2500); } };
      try { r.start(); } catch (e) { this.rec = null; Companion.srBroken = true; return this.listenWav(hold); }
      return;
    }
    return this.listenWav(hold);
  }
  async listenWav(hold) {
    // no browser speech recognition (Quest Browser, Firefox): VAD clip, then the proxy transcribes it; keep the mic stream for the next turn
    try {
      let stream; try { stream = await this.micStream(); } catch (e) { if (Companion._micStream && Companion._micStream.getTracks().some(t => t.readyState === 'live')) stream = Companion._micStream; else throw e; }
      const AC = window.AudioContext || window.webkitAudioContext;
      const ac = (this._micAc && this._micAc.state !== 'closed') ? this._micAc : new AC(); this._micAc = ac;
      if (ac.state === 'suspended') await ac.resume();
      const src = ac.createMediaStreamSource(stream), pr = ac.createScriptProcessor(4096, 1, 1), mute = ac.createGain(), bufs = [];
      mute.gain.value = 0;
      let voiced = 0, quiet = 0, started = false; const t0 = performance.now(), SIL = 0.9, MAX = 12, MINV = 0.2;
      pr.onaudioprocess = e => { if (this.speaking || this.dead) return; const d = e.inputBuffer.getChannelData(0); let s = 0; for (let i = 0; i < d.length; i += 4) s += d[i] * d[i]; const rms = Math.sqrt(s / (d.length / 4));
        const dt = d.length / ac.sampleRate; if (rms > 0.015) { if (!started) started = true; voiced += dt; quiet = 0; bufs.push(new Float32Array(d)); } else if (started) { quiet += dt; bufs.push(new Float32Array(d)); }
        const el = (performance.now() - t0) / 1000; if ((started && voiced > MINV && quiet > SIL) || el > MAX) this.stopListen(); };
      src.connect(pr); pr.connect(mute); mute.connect(ac.destination);
      this.rec = {kind: 'wav', hold, t0, stop: () => { try { pr.disconnect(); src.disconnect(); mute.disconnect(); } catch (e) {} return voiced > 0.15 ? wav16k(bufs, ac.sampleRate) : null; }};
    } catch (e) { this.state = 'idle'; this.rec = null; this._micFailed = true; this.showTalkStrip(); this.subtitle('I can\'t hear the microphone. Type to me in the box at the bottom of the screen.', ' ', 8000); this.emit('error', {error: 'mic'}); if (this.handsFree && !this.dead) this.armListen(2000); }
  }
  stopListen() { const r = this.rec; if (!r) return; if (r.kind === 'sr') { try { r.r.stop(); } catch (e) {} return; }
    this.rec = null; const b64 = r.stop(); if (!b64) { this.state = 'idle'; this._emptyListen = (this._emptyListen || 0) + 1; if (this._emptyListen >= 2) this.showTalkStrip(); if (this.handsFree && !this.dead && !this.speaking) { this.armListen(400); return; } this.showTalkStrip(); this.subtitle('I didn\'t catch that. Type to me in the box at the bottom of the screen.', ' ', 8000); return; } this._emptyListen = 0; this.send(null, b64); }

  // ---------- talking to the proxy ----------
  async send(text, audio) { if (this.o.residentsOnly && !this.resident) { const r = this.talkTarget(); return r ? r.send(text, audio) : undefined; }
    this.unlockAudio();
    if (!this.pass()) { this._afterPass = () => this.send(text, audio); return this.needPass(); }
    if (text) { const who = this.leaveIntent(text); if (who) return who.dismiss(); } this.claimTalk(); const c = this.ch; this.state = 'thinking'; this.subtitle(text ? text : '...', text ? 'You' : ' ', 20000);
    if (text) this.hist.push({role: 'user', content: String(text).slice(0, 800)});
    let res; try {
      const r = await fetch(this.proxy, {method: 'POST', headers: {'Content-Type': 'application/json', 'X-FP-Pass': this.pass()}, body: JSON.stringify({
        characterId: c.id, role: c.role || 'companion', persona: c.role === 'child' ? '' : (c.persona || '') + (c.name ? '\nYour name is ' + c.name + '.' : ''), world: this.world, worldDesc: this.worldDesc, playerName: this.playerName,
        messages: this.hist.slice(-SEND), audio: audio || undefined})});
      res = await r.json().catch(() => ({})); res.status = r.status;
    } catch (e) { res = {status: 0, reply: ''}; }
    if (this.dead || this.ch !== c) return;
    this.state = 'idle';
    if (res.status === 401) { if (text) this.hist.pop(); try { localStorage.removeItem('fpc.pass'); } catch (e) {} this._afterPass = () => this.send(text, audio); return this.needPass('wrong'); }
    if (res.heard) { this.hist.push({role: 'user', content: res.heard}); this.emit('heard', {text: res.heard}); const who = this.leaveIntent(res.heard); if (who) { this.state = 'idle'; return who.dismiss(); } }
    if (!res.reply) { if (text) this.hist.pop(); this.subtitle(res.error === 'no speech' ? 'I didn\'t catch that.' : 'I can\'t reach my thoughts right now. Try again in a moment.', ' ', 4000); this.emit('error', {error: res.error || res.status}); return; }
    if (res.limited) { this.subtitle(res.reply, ' ', 5000); return; }
    this.hist.push({role: 'assistant', content: res.reply}); this.save();
    this.emit('reply', {text: res.reply, model: res.model, cost: res.cost}); this.speak(res.reply);
  }

  // ---------- voice (v1.2.4) ----------
  // iPhone Safari and Quest Browser often swallow speechSynthesis unless audio has been unlocked by a user gesture,
  // and they may have no usable voices at all. Unlock on the first tap, play Worker TTS (Aura) through an HTML audio
  // element, and fall back to speechSynthesis if the Worker request fails.
  voiceOn() { if (this.o.voice === false) return false; try { const v = localStorage.getItem('fpc.voiceOn'); if (v === '0') return false; } catch (e) {} return this.o.voiceOn !== false; }
  setVoiceOn(on) { try { localStorage.setItem('fpc.voiceOn', on ? '1' : '0'); } catch (e) {} if (!on) this.stopSpeaking(); this.syncMuteBtn(); this.emit('voice', {on: !!on}); }
  syncMuteBtn() { const b = this.ui && this.ui.mute; if (!b) return; const on = this.voiceOn(); b.textContent = on ? 'Voice' : 'Muted'; b.title = on ? 'Voice on — tap to mute' : 'Muted — tap to turn voice on'; b.setAttribute('aria-pressed', on ? 'true' : 'false'); }
  unlockAudio() {
    if (this.audioUnlocked) { try { this.ac && this.ac.state === 'suspended' && this.ac.resume(); } catch (e) {} return; }
    this.audioUnlocked = true;
    try { const AC = window.AudioContext || window.webkitAudioContext; if (AC) { this.ac = this.ac || new AC(); this.ac.resume(); const buf = this.ac.createBuffer(1, 1, 22050), src = this.ac.createBufferSource(); src.buffer = buf; src.connect(this.ac.destination); src.start(0); } } catch (e) {}
    try {
      const a = this.player = this.player || new Audio(); a.preload = 'auto';
      a.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
      a.muted = true; const p = a.play(); if (p && p.then) p.then(() => { a.pause(); a.muted = false; a.removeAttribute('src'); a.load && a.load(); }).catch(() => { a.muted = false; });
      else { a.muted = false; }
    } catch (e) {}
    try { const ss = window.speechSynthesis; if (ss) { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; ss.speak(u); ss.cancel(); ss.getVoices(); ss.addEventListener && ss.addEventListener('voiceschanged', () => ss.getVoices()); } } catch (e) {}
  }
  voice() { const ss = window.speechSynthesis; if (!ss) return null; const vs = ss.getVoices(); if (!vs.length) return null; const V = this.ch.voice || {}, lang = (V.lang || 'en-US').toLowerCase();
    const sameLang = vs.filter(v => (v.lang || '').toLowerCase().replace('_', '-').startsWith(lang.slice(0, 2)));
    const pool = sameLang.length ? sameLang : vs, gender = this.ch.gender === 'male' ? 'male' : (this.ch.role === 'child' && this.ch.gender === 'male' ? 'male' : 'female');
    for (const p of V.prefer || []) { if (p === 'female' || p === 'male') { const g = pool.find(v => new RegExp('\\b' + p + '\\b', 'i').test(v.name)); if (g) return g; continue; }
      const v = pool.find(v => v.name.toLowerCase().includes(p.toLowerCase()) && (v.lang || '').toLowerCase().replace('_', '-').startsWith(lang)) || pool.find(v => v.name.toLowerCase().includes(p.toLowerCase())); if (v) return v; }
    const nat = pool.filter(v => /natural|neural|online|premium|enhanced/i.test(v.name)); const g2 = (nat.length ? nat : pool).find(v => new RegExp(gender === 'male' ? '\\bmale\\b|guy|david|mark|daniel|alex|fred' : 'female|samantha|zira|aria|jenny|ava|victoria|karen|moira|serena|samantha|karen', 'i').test(v.name));
    return g2 || nat[0] || pool[0]; }
  firstUtterance(text) { const t = String(text || '').trim(); if (!t) return ['', ''];
    const m = t.match(/^([\s\S]{1,180}?[.!?])(?:\s+|$)/); if (m && m[1].length < t.length - 4) return [m[1].trim(), t.slice(m[0].length).trim()];
    if (t.length > 160) { const i = t.lastIndexOf(' ', 140); if (i > 40) return [t.slice(0, i).trim(), t.slice(i).trim()]; }
    return [t, '']; }
  async micStream() {
    const live = s => !!(s && s.getTracks && s.getTracks().some(t => t.kind === 'audio' && t.readyState === 'live'));
    if (live(Companion._micStream)) return Companion._micStream;
    if (this._micWait) return this._micWait;
    this._micWait = Promise.race([
      navigator.mediaDevices.getUserMedia({audio: {channelCount: 1, echoCancellation: true, noiseSuppression: true}}),
      new Promise((_, rej) => setTimeout(() => rej(new Error('mic-timeout')), 4000))
    ]).then(s => { Companion._micStream = s; this._micWait = null; this._micFailed = false; return s; })
      .catch(e => { this._micWait = null; throw e; });
    return this._micWait;
  }

  speak(text) {
    if (this.o.residentsOnly && !this.resident) { const r = this.talkTarget(); return r ? r.speak(text) : undefined; }
    if (!text) return; this._lastSpoken = String(text);
    if (!this.pass()) { this._afterPass = () => this.speak(text); return this.needPass(); }
    if (!this.voiceOn()) { this.subtitle(text); this.speaking = true; this._speakGen = (this._speakGen || 0) + 1; const gen = this._speakGen; clearTimeout(this.spT); this.spT = setTimeout(() => this.afterSpeak(gen), 600 + text.length * 55); return; }
    this.stopSpeaking(true); this.claimTalk(); this.speaking = true; this.emit('speaking'); this._speakGen = (this._speakGen || 0) + 1; const gen = this._speakGen;
    const [head, rest] = this.firstUtterance(text), t0 = performance.now();
    const headP = this.fetchTts(head), restP = rest ? this.fetchTts(rest) : null;
    const finish = () => { if (gen === this._speakGen && this.speaking) this.afterSpeak(gen); };
    headP.then(async blob => {
      if (this.dead || gen !== this._speakGen) return;
      if (blob && blob._noauth) { this.speaking = false; return; }
      if (!blob) { this.subtitle(text); return this.speakBrowser(text, gen); }
      this._ttsWaitMs = Math.round(performance.now() - t0);
      await this.playAudio(blob, gen, {subtitle: text, last: !rest, t0});
      if (rest && restP && gen === this._speakGen && !this.dead) {
        const b2 = await restP; if (this.dead || gen !== this._speakGen) return;
        if (b2 && !b2._noauth) await this.playAudio(b2, gen, {subtitle: text, last: true}); else finish();
      }
    }).catch(e => { console.warn('[fpc] tts', e); if (!this.dead && gen === this._speakGen) { this.subtitle(text); this.speakBrowser(text, gen); } });
    clearTimeout(this.spT); this.spT = setTimeout(() => { if (gen !== this._speakGen) return; const a = this.player; if (a && !a.paused && !a.ended) return; if (this.speaking) this.afterSpeak(gen); }, 8000 + text.length * 80);
  }
  ttsEndpoint() { return this.ttsUrl || (this.proxy || DEFAULT_PROXY).replace(/\/chat\/?$/, '/tts'); }
  async fetchTts(text) {
    const pass = this.pass(); if (!pass) return null;
    const res = await fetch(this.ttsEndpoint(), { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-FP-Pass': pass }, body: JSON.stringify({ text, characterId: this.ch && this.ch.id, role: this.ch && this.ch.role, gender: this.ch && this.ch.gender }) });
    if (res.status === 401) { try { localStorage.removeItem('fpc.pass'); } catch (e) {} this.needPass('wrong'); return {_noauth: true}; } if (!res.ok) throw new Error('tts ' + res.status);
    const blob = await res.blob(); if (!blob || blob.size < 200) return null; this.lastTts = { model: res.headers.get('X-FP-Tts-Model'), voice: res.headers.get('X-FP-Tts-Voice'), cost: res.headers.get('X-FP-Tts-Cost-Est'), bytes: blob.size }; return blob;
  }
  playAudio(blob, gen, opts) {
    opts = opts || {};
    return new Promise(resolve => {
      try {
        const a = this.player = this.player || new Audio(); if (this._ttsUrl) { try { URL.revokeObjectURL(this._ttsUrl); } catch (e) {} }
        const url = this._ttsUrl = URL.createObjectURL(blob); a.muted = false; a.volume = 1; a.src = url;
        const show = () => { if (opts.subtitle && gen === this._speakGen) this.subtitle(opts.subtitle); };
        const done = () => { a.onended = a.onerror = a.onplay = null; if (this._ttsUrl === url) { try { URL.revokeObjectURL(url); } catch (e) {} this._ttsUrl = null; } if (opts.last !== false) this.afterSpeak(gen); resolve(); };
        a.onplay = show; a.onended = done; a.onerror = () => { if (this.ac) this.playViaContext(blob, gen, done); else done(); };
        a.ontimeupdate = () => { this.pulse = 0.08; };
        const p = a.play(); if (p && p.then) p.then(show); if (p && p.catch) p.catch(() => { if (this.ac) this.playViaContext(blob, gen, done); else { show(); this.speakBrowser(opts.subtitle || (this.sub && this.sub.text) || '', gen); resolve(); } });
      } catch (e) { if (opts.subtitle) this.subtitle(opts.subtitle); this.speakBrowser(opts.subtitle || (this.sub && this.sub.text) || '', gen); resolve(); }
    });
  }
  playViaContext(blob, gen, done) {
    const ac = this.ac; if (!ac) return done(); ac.resume(); blob.arrayBuffer().then(b => ac.decodeAudioData(b)).then(buf => {
      if (gen !== this._speakGen) return done(); const src = ac.createBufferSource(); src.buffer = buf; src.connect(ac.destination); src.onended = done; src.start(0); this._ttsSrc = src;
    }).catch(done);
  }
  speakBrowser(text, gen) {
    const ss = window.speechSynthesis; if (!ss || !text) { if (gen === this._speakGen) { this.speaking = true; clearTimeout(this.spT); this.spT = setTimeout(() => this.afterSpeak(gen), 600 + (text && text.length || 0) * 55); } return; }
    const go = () => { if (this.dead || gen !== this._speakGen) return; try { ss.cancel(); ss.resume && ss.resume(); } catch (e) {}
      const u = new SpeechSynthesisUtterance(text), V = (this.ch && this.ch.voice) || {}; const v = this.voice(); if (v) u.voice = v; u.lang = (v && v.lang) || V.lang || 'en-US';
      u.pitch = V.pitch || 1; u.rate = V.rate || 1; u.volume = 1;
      u.onstart = () => { if (gen === this._speakGen) { this.speaking = true; this.emit('speaking'); } }; u.onboundary = () => { this.pulse = 0.08; };
      u.onend = u.onerror = () => { this.afterSpeak(gen); };
      this._utt = u; ss.speak(u); setTimeout(() => { try { if (ss.paused) ss.resume(); } catch (e) {} }, 250);
      if (!this._voicesTried && !v) { this._voicesTried = true; ss.addEventListener && ss.addEventListener('voiceschanged', () => { if (this._utt === u && gen === this._speakGen) { const v2 = this.voice(); if (v2) { try { ss.cancel(); u.voice = v2; ss.speak(u); } catch (e) {} } } }); }
    };
    if (ss.getVoices && !ss.getVoices().length) { ss.getVoices(); setTimeout(go, 250); } else go();
  }
  stopSpeaking(keepGen) { if (!keepGen) this._speakGen = (this._speakGen || 0) + 1; try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) {}
    try { if (this.player) { this.player.onended = this.player.onerror = this.player.ontimeupdate = null; this.player.pause(); this.player.removeAttribute('src'); } } catch (e) {}
    try { if (this._ttsSrc) { this._ttsSrc.stop(); this._ttsSrc = null; } } catch (e) {}
    this.speaking = false; }

  destroy() {
    for (const r of this.family.values()) { try { r.destroy(); } catch (e) {} } this.family.clear();
    this.dead = true; clearTimeout(this._listenArm); this.hidePassPrompt && this.hidePassPrompt(); this.hideTalkStrip && this.hideTalkStrip(); this.stopSpeaking(); if (this._gate) { try { this._gate.remove(); } catch (e) {} this._gate = null; } if (this.rec) { try { this.rec.kind === 'sr' ? this.rec.r.abort() : this.rec.stop(); } catch (e) {} this.rec = null; }
    if (this.raf) cancelAnimationFrame(this.raf); for (const f of this.cleanup) { try { f(); } catch (e) {} } this.cleanup = [];
    if (this.holder) { if (this.holder.parent) this.holder.parent.remove(this.holder); dispose(this.holder); }
    if (Companion.alls) Companion.alls.delete(this); if (Companion.host === this) Companion.host = null; if (Companion.talker === this) Companion.talker = null;
  }
}
Companion.alls = Companion.alls || new Set();


function dispose(o) { o.traverse(n => { if (n.geometry) n.geometry.dispose(); for (const m of n.material ? [].concat(n.material) : []) { for (const k in m) { const v = m[k]; if (v && v.isTexture) v.dispose(); } m.dispose(); } }); }
function round(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function wrap(g, s, w) { const out = []; let line = ''; for (const word of s.split(/\s+/)) { const t = line ? line + ' ' + word : word; if (g.measureText(t).width > w && line) { out.push(line); line = word; } else line = t; } if (line) out.push(line); return out; }
function wav16k(bufs, rate) { // Float32 chunks at the context rate -> 16 kHz mono 16-bit WAV, base64
  let n = 0; for (const b of bufs) n += b.length; const all = new Float32Array(n); let o = 0; for (const b of bufs) { all.set(b, o); o += b.length; }
  const ratio = rate / 16000, m = Math.floor(n / ratio), pcm = new Int16Array(m); for (let i = 0; i < m; i++) { const s = Math.max(-1, Math.min(1, all[Math.floor(i * ratio)])); pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff; }
  const buf = new ArrayBuffer(44 + pcm.length * 2), v = new DataView(buf), W = (p, s) => { for (let i = 0; i < s.length; i++) v.setUint8(p + i, s.charCodeAt(i)); };
  W(0, 'RIFF'); v.setUint32(4, 36 + pcm.length * 2, true); W(8, 'WAVE'); W(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, 16000, true); v.setUint32(28, 32000, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); W(36, 'data'); v.setUint32(40, pcm.length * 2, true);
  new Int16Array(buf, 44).set(pcm); let bin = ''; const u8 = new Uint8Array(buf); for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(bin);
}
