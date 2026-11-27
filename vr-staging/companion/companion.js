/* Shared AI companion module for Josh Freeman's worlds (Earth: Fowling Pond, Mars: Red Planet Lounge).
   ES module. mount(sceneEl, rootEl, opts) / unmount(). Attaches to the host's scene: no a-scene, renderer or XR session of its own.
   Replies come from an LLM through a server-side proxy (Cloudflare Worker; the OpenRouter key never reaches the browser).
   See README.md next to this file. */
const HERE = new URL('./', import.meta.url).href;
export const VERSION = '1.2.1';
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
    this.proxy = o.proxyUrl || DEFAULT_PROXY; this.emit = (type, d) => { try { o.onEvent && o.onEvent(Object.assign({type, character: this.ch && this.ch.id}, d || {})); } catch (e) {} };
    this.resident = !!o.resident; this.homes = o.homes || {}; this.family = new Map(); this.state = 'idle'; this.t = 0; this.hist = []; this.cleanup = []; this.dead = false; this.jaw = 0; this.look = {yaw: 0, pitch: 0}; this.talkUntil = 0; this.lastTap = 0;
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
    this.holder = new T.Group(); this.holder.name = 'fp-companion'; this.root3d.add(this.holder);
    this.sub = this.makeSubtitle(); this.holder.add(this.sub.sprite);
    this.hookTick(); this.hookInput(); if (this.o.ui !== false) this.makeUI();
    let pick = this.o.pick || this.store.get && (await this.store.get('fpc:v1:' + this.playerId + ':pick')) || ro.default || this.roster[0].id;
    { const pc = this.roster.find(r => r.id === pick); if (!pc || pc.role === 'child' || !this.inWorld(pc)) pick = this.firstAdult(ro.default); }   // a child is never the default slot
    await this.pick(pick, true);
    this.api = {
      version: VERSION, list: () => this.roster.map(c => ({id: c.id, name: c.name, gender: c.gender, role: c.role, canTravel: !!c.canTravel})),
      current: () => this.ch && {id: this.ch.id, name: this.ch.name}, pick: id => this.pick(id),
      talk: text => text ? this.send(text) : this.listen(), listen: () => this.listen(), say: text => this.speak(text),
      setWorld: (w, d) => { this.world = w; this.worldDesc = d || WORLDS[w] || ''; }, moveTo: (x, y, z, yaw) => this.placeWorld(x, y, z, yaw),
      comeHere: () => this.comeHere(), forget: () => { this.hist = []; this.save(); }, setPassphrase: p => this.setPass(p),
      update: dt => this.update(dt), unmount: () => unmount(), object3D: this.holder,
      setHome: (id, pos) => this.setHome(id, pos), family: () => [...this.family.values()].map(r => ({id: r.ch.id, name: r.ch.name, role: r.ch.role, object3D: r.holder})),
      talkTo: (id, text) => { const r = this.family.get(id); if (r) return text ? r.send(text) : r.listen(); if (this.ch && this.ch.id === id) return text ? this.send(text) : this.listen(); }
    };
    if (this.o.family !== false) { this.syncFamily(); const onHome = () => this.placeFamily();
      for (const t of [this.sceneEl, window]) if (t && t.addEventListener) { t.addEventListener('fp-home-ready', onHome); this.cleanup.push(() => t.removeEventListener('fp-home-ready', onHome)); } }
    this.emit('ready', {roster: this.api.list()});
    return this.api;
  }

  inWorld(c) { return !Array.isArray(c.worlds) || !c.worlds.length || c.worlds.includes(this.world); }
  firstAdult(def) { const ok = c => c && c.role !== 'child' && this.inWorld(c); const d = this.roster.find(c => c.id === def); return ok(d) ? d.id : (this.roster.find(ok) || this.roster[0]).id; }

  // ---------- family residents (wife / children stand at home while another companion is active) ----------
  async initResident() {
    const c = this.o.character; this.roster = [c]; this.rosterBase = this.o.rosterBase || HERE;
    this.holder = new this.T.Group(); this.holder.name = 'fp-resident-' + c.id; this.root3d.add(this.holder);
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
  placeFamily() { for (const r of this.family.values()) { if (!r.model) continue; const h = this.homeFor(r.ch);
      if (h) { r.placeWorld(h.x, h.y, h.z, h.yaw); r.homeSrc = h.src; } else if (!r.placed) r.comeHere();
      r.placed = true; r.wander = this.wanderArea(r.ch); r.wTarget = null; r.wWait = 2 + Math.random() * 4; } }

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
    if (prevPos) this.holder.position.copy(prevPos); else if (this.o.spawn) { const s = this.o.spawn; this.placeWorld(s.x, s.y, s.z, s.yaw); }
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
    this.holder.position.copy(p); if (yaw !== undefined) this.holder.rotation.y = yaw * Math.PI / 180; }
  ground(x, z) { try { if (this.o.groundAt) { const g = this.o.groundAt(x, z); if (isFinite(g)) return g; } } catch (e) {} const c = this.playerPos(); return c ? c.y - 1.6 : 0; }
  playerPos() { const c = this.camera; return c ? c.getWorldPosition(new this.T.Vector3()) : null; }
  comeHere() { const T = this.T, c = this.camera; if (!c) return; const p = c.getWorldPosition(new T.Vector3()), f = c.getWorldDirection(new T.Vector3()); f.y = 0; if (f.lengthSq() < 1e-6) f.set(0, 0, -1); f.normalize();
    const r = new T.Vector3(-f.z, 0, f.x), x = p.x + f.x * 1.7 + r.x * 0.5, z = p.z + f.z * 1.7 + r.z * 0.5; this.placeWorld(x, null, z);
    this.faceW(p, true); this.emit('moved'); }
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
    if (pp && !this.resident && this.ch.canTravel !== false && this.o.follow !== false && this.state === 'idle') { const d = Math.hypot(pp.x - hp.x, pp.z - hp.z), dy = Math.abs(pp.y - 1.6 - hp.y);
      if (d > (this.o.followDist || 14) || dy > 6) this.comeHere(); }
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
    on(s, 'bbuttondown', () => { if (near()) this.listen(true); });
    on(s, 'bbuttonup', () => { if (this.rec && this.rec.hold) this.stopListen(); });
    // desktop: T = talk (hold, or tap to toggle); Enter in the text box
    on(window, 'keydown', e => { if (e.repeat || /input|textarea/i.test((e.target && e.target.tagName) || '')) return; if (e.code === 'KeyT') { if (this.rec) this.stopListen(); else this.listen(true); } });
    on(window, 'keyup', e => { if (e.code === 'KeyT' && this.rec && this.rec.hold && performance.now() - this.rec.t0 > 600) this.stopListen(); });
  }
  tap() { const n = performance.now(); if (n - this.lastTap < 500) return; this.lastTap = n; if (this.rec) this.stopListen(); else if (this.speaking) this.stopSpeaking(); else this.listen(false); }

  makeUI() {
    const d = document.createElement('div'); d.className = 'fpc-ui';
    d.innerHTML = '<style>.fpc-ui{position:fixed;left:12px;bottom:12px;z-index:30;font:14px system-ui,sans-serif;color:#fff;max-width:min(420px,92vw)}.fpc-ui .row{display:flex;gap:6px;margin-top:6px}.fpc-ui button,.fpc-ui select,.fpc-ui input{font:inherit;border-radius:8px;border:1px solid #c9a24a;background:rgba(20,20,26,.85);color:#fff;padding:7px 10px}.fpc-ui button.main{background:#c9a24a;color:#1a1408;font-weight:600}.fpc-ui input{flex:1;min-width:0}.fpc-ui .log{background:rgba(10,12,18,.72);border-radius:8px;padding:7px 10px;margin-top:6px;display:none}.fpc-ui.open .log{display:block}.fpc-ui .more{display:none}.fpc-ui.open .more{display:flex}</style>' +
      '<div class="row"><button class="main" type="button"></button><button class="tog" type="button" title="Type, choose a companion">...</button></div>' +
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
    ui.btn.onclick = () => this.tap(); q('.tog').onclick = () => d.classList.toggle('open');
    const sendTxt = () => { const v = ui.txt.value.trim(); if (v) { ui.txt.value = ''; this.send(v); } };
    q('.snd').onclick = sendTxt; ui.txt.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter') sendTxt(); };
    ui.sel.onchange = () => this.pick(ui.sel.value); q('.come').onclick = () => this.comeHere(); q('.fgt').onclick = () => { this.hist = []; this.save(); this.subtitle('(conversation cleared)'); };
    q('.pws').onclick = () => { this.setPass(q('.pw').value); q('.pw').value = ''; this.subtitle('Passphrase saved.', ' '); };
    q('.pw').onkeydown = e => e.stopPropagation();
    if (this.o.hideUiInXR !== false && this.sceneEl && this.sceneEl.addEventListener) { const f = () => { d.style.display = this.inXR ? 'none' : ''; }; this.sceneEl.addEventListener('enter-vr', f); this.sceneEl.addEventListener('exit-vr', f); }
    this.cleanup.push(() => d.remove());
  }

  // ---------- passphrase ----------
  pass() { if (this.o.passphrase) return this.o.passphrase; try { const u = new URLSearchParams(location.search).get('fppass'); if (u) this.setPass(u); return localStorage.getItem('fpc.pass') || ''; } catch (e) { return ''; } }
  setPass(p) { try { localStorage.setItem('fpc.pass', String(p || '').trim().toLowerCase()); } catch (e) {} }
  needPass(reason) { reason = reason || 'missing'; this.emit('error', {error: 'passphrase', reason});
    if (typeof this.o.onNeedPass === 'function') {   // host shows its own prompt (Mars: in-world VR keyboard)
      const self = this; let used = false;
      try { this.o.onNeedPass({reason, character: this.ch && {id: this.ch.id, name: this.ch.name},
        submit(pass, retryText) { if (used || self.dead) return false; used = true; pass = String(pass || '').trim(); if (!pass) return false; self.setPass(pass); if (retryText) self.send(String(retryText)); return true; },
        cancel() { used = true; }}); } catch (e) { console.warn('[fpc] onNeedPass', e); }
      return; }
    const txt = this.o.passPromptText;
    if (!this.inXR && this.ui) { this.ui.el.classList.add('open'); this.subtitle(txt || 'Enter the companion passphrase in the box (bottom left), then talk to me again.', ' ', 7000); }
    else this.subtitle(txt || 'I need the passphrase first. Take off the headset and enter it on the page (bottom left).', ' ', 7000); }

  // ---------- listening ----------
  async listen(hold) {
    if (this.rec || this.state === 'thinking') return; if (!this.pass()) return this.needPass();
    this.stopSpeaking(); const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.state = 'listening'; this.subtitle('Listening...', ' ', 15000); this.emit('listening');
    if (SR && !Companion.srBroken) {
      const r = new SR(); r.lang = (this.ch.voice && this.ch.voice.lang) || 'en-US'; r.interimResults = true; r.maxAlternatives = 1; let final = '', got = false;
      this.rec = {kind: 'sr', r, hold, t0: performance.now()};
      r.onresult = e => { let s = ''; for (let i = 0; i < e.results.length; i++) s += e.results[i][0].transcript; final = s; got = true; this.subtitle(s, 'You', 15000); };
      r.onerror = e => { if (/not-allowed|service-not-allowed|network|language/.test(e.error)) { Companion.srBroken = !got; } };
      r.onend = () => { const was = this.rec; this.rec = null; if (final.trim()) this.send(final.trim()); else if (Companion.srBroken && was) { this.state = 'idle'; this.listen(hold); } else { this.state = 'idle'; this.subtitle('I didn\'t catch that.', ' ', 2500); } };
      try { r.start(); } catch (e) { this.rec = null; Companion.srBroken = true; this.state = 'idle'; return this.listen(hold); }
      return;
    }
    // no browser speech recognition (Quest Browser, Firefox): record a short clip, the proxy transcribes it
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio: {channelCount: 1, echoCancellation: true, noiseSuppression: true}});
      const ac = new (window.AudioContext || window.webkitAudioContext)(), src = ac.createMediaStreamSource(stream), pr = ac.createScriptProcessor(4096, 1, 1), bufs = [];
      let voiced = 0, quiet = 0; const t0 = performance.now();
      pr.onaudioprocess = e => { const d = e.inputBuffer.getChannelData(0); bufs.push(new Float32Array(d)); let s = 0; for (let i = 0; i < d.length; i += 4) s += d[i] * d[i]; const rms = Math.sqrt(s / (d.length / 4));
        const dt = d.length / ac.sampleRate; if (rms > 0.02) { voiced += dt; quiet = 0; } else quiet += dt;
        const el = (performance.now() - t0) / 1000; if (el > 9 || (!hold && voiced > 0.3 && quiet > 1.1) || (!hold && el > 6 && voiced < 0.1)) this.stopListen(); };
      src.connect(pr); pr.connect(ac.destination);
      this.rec = {kind: 'wav', hold, t0, stop: () => { pr.disconnect(); src.disconnect(); stream.getTracks().forEach(t => t.stop()); const rate = ac.sampleRate; ac.close(); return voiced > 0.15 ? wav16k(bufs, rate) : null; }};
    } catch (e) { this.state = 'idle'; this.rec = null; this.subtitle('I can\'t hear you: microphone not available. You can type to me on the page instead.', ' ', 6000); this.emit('error', {error: 'mic'}); }
  }
  stopListen() { const r = this.rec; if (!r) return; if (r.kind === 'sr') { try { r.r.stop(); } catch (e) {} return; }
    this.rec = null; const b64 = r.stop(); if (!b64) { this.state = 'idle'; this.subtitle('I didn\'t catch that.', ' ', 2500); return; } this.send(null, b64); }

  // ---------- talking to the proxy ----------
  async send(text, audio) {
    if (!this.pass()) return this.needPass(); const c = this.ch; this.state = 'thinking'; this.subtitle(text ? text : '...', text ? 'You' : ' ', 20000);
    if (text) this.hist.push({role: 'user', content: String(text).slice(0, 800)});
    let res; try {
      const r = await fetch(this.proxy, {method: 'POST', headers: {'Content-Type': 'application/json', 'X-FP-Pass': this.pass()}, body: JSON.stringify({
        characterId: c.id, role: c.role || 'companion', persona: c.role === 'child' ? '' : (c.persona || '') + (c.name ? '\nYour name is ' + c.name + '.' : ''), world: this.world, worldDesc: this.worldDesc, playerName: this.playerName,
        messages: this.hist.slice(-SEND), audio: audio || undefined})});
      res = await r.json().catch(() => ({})); res.status = r.status;
    } catch (e) { res = {status: 0, reply: ''}; }
    if (this.dead || this.ch !== c) return;
    this.state = 'idle';
    if (res.status === 401) { if (text) this.hist.pop(); try { localStorage.removeItem('fpc.pass'); } catch (e) {} return this.needPass('wrong'); }
    if (res.heard) { this.hist.push({role: 'user', content: res.heard}); this.emit('heard', {text: res.heard}); }
    if (!res.reply) { if (text) this.hist.pop(); this.subtitle(res.error === 'no speech' ? 'I didn\'t catch that.' : 'I can\'t reach my thoughts right now. Try again in a moment.', ' ', 4000); this.emit('error', {error: res.error || res.status}); return; }
    if (res.limited) { this.subtitle(res.reply, ' ', 5000); return; }
    this.hist.push({role: 'assistant', content: res.reply}); this.save();
    this.emit('reply', {text: res.reply, model: res.model, cost: res.cost}); this.speak(res.reply);
  }

  // ---------- voice ----------
  voice() { const ss = window.speechSynthesis; if (!ss) return null; const vs = ss.getVoices(); if (!vs.length) return null; const V = this.ch.voice || {}, lang = (V.lang || 'en-US').toLowerCase();
    const sameLang = vs.filter(v => (v.lang || '').toLowerCase().replace('_', '-').startsWith(lang.slice(0, 2)));
    const pool = sameLang.length ? sameLang : vs, gender = this.ch.gender === 'male' ? 'male' : 'female';
    for (const p of V.prefer || []) { if (p === 'female' || p === 'male') { const g = pool.find(v => new RegExp('\\b' + p + '\\b', 'i').test(v.name)); if (g) return g; continue; }
      const v = pool.find(v => v.name.toLowerCase().includes(p.toLowerCase()) && (v.lang || '').toLowerCase().replace('_', '-').startsWith(lang)) || pool.find(v => v.name.toLowerCase().includes(p.toLowerCase())); if (v) return v; }
    const nat = pool.filter(v => /natural|neural|online|premium|enhanced/i.test(v.name)); const g2 = (nat.length ? nat : pool).find(v => new RegExp(gender === 'male' ? '\\bmale\\b|guy|david|mark|daniel|alex|fred' : 'female|samantha|zira|aria|jenny|ava|victoria|karen|moira|serena', 'i').test(v.name));
    return g2 || nat[0] || pool[0]; }
  speak(text) {
    this.subtitle(text); const ss = window.speechSynthesis; if (!ss || this.o.voice === false) { this.speaking = true; clearTimeout(this.spT); this.spT = setTimeout(() => { this.speaking = false; }, 600 + text.length * 55); return; }
    ss.cancel(); const u = new SpeechSynthesisUtterance(text), V = this.ch.voice || {}; const v = this.voice(); if (v) u.voice = v; u.lang = (v && v.lang) || V.lang || 'en-US';
    u.pitch = V.pitch || 1; u.rate = V.rate || 1; u.volume = 1;
    u.onstart = () => { this.speaking = true; this.emit('speaking'); }; u.onboundary = () => { this.pulse = 0.08; };
    u.onend = u.onerror = () => { this.speaking = false; if (this.sub) this.sub.until = performance.now() + 2500; };
    this.speaking = true; clearTimeout(this.spT); this.spT = setTimeout(() => { if (!ss.speaking) this.speaking = false; }, 1500 + text.length * 90); ss.speak(u);
  }
  stopSpeaking() { try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) {} this.speaking = false; }

  destroy() {
    for (const r of this.family.values()) { try { r.destroy(); } catch (e) {} } this.family.clear();
    this.dead = true; this.stopSpeaking(); if (this.rec) { try { this.rec.kind === 'sr' ? this.rec.r.abort() : this.rec.stop(); } catch (e) {} this.rec = null; }
    if (this.raf) cancelAnimationFrame(this.raf); for (const f of this.cleanup) { try { f(); } catch (e) {} } this.cleanup = [];
    if (this.holder) { if (this.holder.parent) this.holder.parent.remove(this.holder); dispose(this.holder); }
  }
}

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
