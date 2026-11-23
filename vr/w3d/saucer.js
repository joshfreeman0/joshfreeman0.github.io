/* Flying saucer (item 20) - parked on the lawn just north of the Bank (behind the exhibit rooms), approved flow:
   1 approach: rim lights brighten, a 'Board saucer' sign shows above the ramp
   2 board: walk up the ramp, or point at the saucer and pull the right trigger (click / tap on desktop and phone)
   3 six seats in a ring around a glowing console under the glass dome
   4 point at the console: destination menu with tabs Space (Mars) / Earth (cities) / Here (world spots); pick one, then Launch
   5 ten-second countdown (hop on / off still allowed)   6 at zero the ramp folds up and the door seals
   7 slow lift-off, gentle tilt, smooth cruise - free look, no steering   8 soft landing, ramp down; walk out or 'Leave saucer'
   9 Mars: straight up, fade out, everyone aboard opens Red Planet Lounge at its pad.
   Multiplayer: seats, destination, countdown and flight ride on the existing p2p room (action 'ufo'): every client
   animates the same deterministic flight from the shared start time. Solo / ?nomp=1 works the same. */
(function () {
'use strict';
const W3D = window.W3D = window.W3D || {};
const LITE = !!window.JFVR_LITE;
const MARS_URL = 'https://redplanetlounge.pages.dev/?spot=pad&from=joshfreeman-vr';
const HOME = {x: 1000, z: -447, yaw: 0};      // bank lawn north of the exhibit rooms (x 924-967, z -401..-428); flat terrain at y 34
const RAD = 9, FLOOR = 2.02, NSEAT = 6, SEAT_R = 3.4, COUNT = 3000;
const v3 = new THREE.Vector3(), q4 = new THREE.Quaternion();
const smooth = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
const now = () => performance.now();
const hud = m => window.JFVR && JFVR.hud && JFVR.hud(m);
const canvasTex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.userData = {c}; return t; };
const camEl = () => document.querySelector('[camera]');
const camPos = () => { const c = camEl(); return c ? c.object3D.getWorldPosition(new THREE.Vector3()) : null; };
const rigEl = () => document.querySelector('#rig');

/* ---------- destinations ---------- */
const DEST = [
  {id: 'mars', tab: 'space', name: 'Mars', kind: 'mars'},
  {id: 'london', tab: 'earth', name: 'London', kind: 'city'},
  {id: 'saintjohn', tab: 'earth', name: 'Saint John NB', kind: 'city'},
  {id: 'boston', tab: 'earth', name: 'Boston', kind: 'city'},
  {id: 'bangkok', tab: 'earth', name: 'Bangkok', kind: 'city'},
  {id: 'hongkong', tab: 'earth', name: 'Hong Kong', kind: 'city'},
  {id: 'launchpad', tab: 'here', name: 'Launch pad', kind: 'here'},
  {id: 'home', tab: 'here', name: 'Bank', kind: 'here'},
  {id: 'pyramid', tab: 'here', name: 'Pyramid park', kind: 'here'},
  {id: 'lake', tab: 'here', name: 'Lake', kind: 'here'}
];
const D = id => DEST.find(d => d.id === id) || DEST[7];
const spotCache = {};
// a flat, open landing spot near (cx, cz): ground varies < 0.7 m over the saucer + ramp, no walls / floors, dry
function findFlat(cx, cz, maxR, dry) {
  const G = (x, z) => W3D.groundAt(x, z, -1e4);
  const ok = (x, z) => { const g0 = G(x, z); if (!isFinite(g0)) return null; let lo = g0, hi = g0;
    for (let a = 0; a < 12; a++) for (const r of [5, 9.5, 13]) { const g = G(x + Math.sin(a / 12 * 6.283) * r, z + Math.cos(a / 12 * 6.283) * r); lo = Math.min(lo, g); hi = Math.max(hi, g); }
    for (let j = 0; j < 8; j++) { const g = G(x, z + 9 + j * 0.8); lo = Math.min(lo, g); hi = Math.max(hi, g); }
    if (hi - lo > 0.7) return null; if (dry && dry(x, z)) return null;
    if (W3D.blocked) for (let a = 0; a < 8; a++) if (W3D.blocked(x + Math.sin(a) * 8, z + Math.cos(a) * 8, g0 + 1)) return null;
    for (const f of (W3D.floors || [])) if (!f.ufo && x + 14 > f.x0 && x - 14 < f.x1 && z + 16 > f.z0 && z - 14 < f.z1) return null;
    return hi; };
  for (let r = 0; r <= maxR; r += 8) for (let a = 0, n = Math.max(1, Math.round(r / 8) * 6); a < n; a++) {
    const x = cx + Math.sin(a / n * 6.283) * r, z = cz + Math.cos(a / n * 6.283) * r, y = ok(x, z); if (y !== null) return {x: +x.toFixed(1), z: +z.toFixed(1), y}; }
  return {x: cx, z: cz, y: G(cx, cz)};
}
function beachC(B) { try { const pts = Array.isArray(B) ? B : (B && (B.pts || B.poly || B.line)); if (!pts || !pts.length) return null; let x = 0, z = 0; for (const p of pts) { x += p[0]; z += p[1]; } return [x / pts.length, z / pts.length]; } catch (e) { return null; } }
function spot(id) {   // {x, y, z, yaw} where the saucer parks (y = ground under the leg pads)
  const d = D(id);
  if (d.kind === 'city') { const c = W3D.cities && W3D.cities.def(id); return c ? {x: c.pad.x, y: c.pad.y, z: c.pad.z, yaw: c.pad.yaw || 0} : spot('home'); }
  if (spotCache[id]) return spotCache[id];
  let s = null;
  if (id === 'home') s = {x: HOME.x, z: HOME.z, y: W3D.groundAt(HOME.x, HOME.z, -1e4), yaw: HOME.yaw};
  else if (id === 'launchpad') { const P = W3D.launchPad || {x: 9617, z: -2976.9}; s = {x: P.x - 64, z: P.z - 6, y: W3D.groundAt(P.x - 64, P.z - 6, -1e4), yaw: Math.PI / 2}; }
  else if (id === 'pyramid') { const P = W3D.water && W3D.water.park; const c = P ? [P.pyr[0] - 150, P.pyr[1] + 20] : [0, 0]; const f = findFlat(c[0], c[1], 160); s = {x: f.x, z: f.z, y: f.y, yaw: Math.PI / 2}; }
  else if (id === 'lake') { const WL = 16.5, B = W3D.water && W3D.water.beach, bc = beachC(B) || [300, -250]; const f = findFlat(bc[0], bc[1], 900, (x, z) => W3D.terrainH(x, z) < WL + 0.8 || W3D.groundAt(x, z, -1e4) < WL + 0.8); s = {x: f.x, z: f.z, y: f.y, yaw: 0}; }
  if (!s || !isFinite(s.y)) s = {x: HOME.x, z: HOME.z, y: 34, yaw: 0};
  if (id !== 'launchpad' || W3D.patchH) spotCache[id] = s;   // the pad's ground is exact once its detail patch is loaded
  return s;
}

/* ---------- model ---------- */
let ent = null, G = null, M = {}, ramp = null, door = null, lightsA = null, lightsB = null, glow = null, consoleTop = null, cdBand = null, sign = null, seatTags = [];
function makeModel() {
  const seg = LITE ? 40 : 96;
  const env = W3D.env || null;
  M.hull = new THREE.MeshStandardMaterial({color: 0xc9ced6, metalness: 0.92, roughness: 0.2, envMap: env, envMapIntensity: 1.2, side: THREE.DoubleSide});
  M.dark = new THREE.MeshStandardMaterial({color: 0x3a3f48, metalness: 0.8, roughness: 0.35, envMap: env});
  M.glass = new THREE.MeshStandardMaterial({color: 0x9fd4ff, metalness: 0.2, roughness: 0.05, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide, envMap: env, envMapIntensity: 1.5});
  M.floor = new THREE.MeshStandardMaterial({color: 0x56606c, metalness: 0.6, roughness: 0.55});
  M.seat = new THREE.MeshStandardMaterial({color: 0xe8e2d6, roughness: 0.6, metalness: 0.1});
  M.glowA = new THREE.MeshBasicMaterial({color: 0x7ff3ff, toneMapped: false});
  M.glowB = new THREE.MeshBasicMaterial({color: 0xffc46a, toneMapped: false});
  M.console = new THREE.MeshBasicMaterial({color: 0x6ff7d0, toneMapped: false, transparent: true, opacity: 0.9});
  G = new THREE.Group(); G.name = 'saucer';
  // hull: one lathe profile, underside -> rim -> upper wing -> cabin lip -> cabin floor
  const prof = [[0.01, 0.95], [2, 1.0], [4, 1.14], [6, 1.38], [7.8, 1.68], [8.8, 1.88], [9.05, 1.96], [9.05, 2.02], [8.6, 2.14], [7.5, 2.36], [6.3, 2.55], [6.0, 2.6], [5.86, 2.58], [5.86, 2.0], [0.01, 2.0]].map(p => new THREE.Vector2(p[0], p[1]));
  const hull = new THREE.Mesh(new THREE.LatheGeometry(prof, seg), M.hull); hull.castShadow = !LITE; G.add(hull);
  const fl = new THREE.Mesh(new THREE.CircleGeometry(5.86, seg), M.floor); fl.rotation.x = -Math.PI / 2; fl.position.y = FLOOR; G.add(fl);
  const band = new THREE.Mesh(new THREE.TorusGeometry(9.0, 0.09, 8, seg), M.dark); band.rotation.x = Math.PI / 2; band.position.y = 1.99; G.add(band);
  // rim lights: two interleaved sets that pulse in alternation
  const lg = new THREE.SphereGeometry(0.17, 10, 6), N = LITE ? 12 : 18, m4 = new THREE.Matrix4();
  lightsA = new THREE.InstancedMesh(lg, M.glowA, N); lightsB = new THREE.InstancedMesh(lg, M.glowB, N);
  for (let i = 0; i < N * 2; i++) { const a = i / (N * 2) * Math.PI * 2; m4.makeTranslation(Math.sin(a) * 9.1, 1.99, Math.cos(a) * 9.1); (i % 2 ? lightsB : lightsA).setMatrixAt(i >> 1, m4); }
  G.add(lightsA, lightsB);
  // hover glow under the hull (additive radial gradient)
  const gt = canvasTex(128, 128, (c) => { const g = c.createRadialGradient(64, 64, 4, 64, 64, 63); g.addColorStop(0, 'rgba(170,255,250,0.95)'); g.addColorStop(0.5, 'rgba(90,220,255,0.35)'); g.addColorStop(1, 'rgba(60,160,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 128, 128); });
  glow = new THREE.Mesh(new THREE.CircleGeometry(6.5, 32), new THREE.MeshBasicMaterial({map: gt, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide}));
  glow.rotation.x = -Math.PI / 2; glow.position.y = 0.93; G.add(glow);
  const core = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.7, 0.22, 32), M.glowA); core.position.y = 0.88; G.add(core);
  // glass dome with a door gap facing +z; the door is a matching slice that rises to seal it
  const GAP = 0.62;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(5.95, seg, LITE ? 12 : 24, Math.PI / 2 + GAP / 2, Math.PI * 2 - GAP, 0, Math.PI / 2), M.glass); dome.position.y = 2.58; dome.renderOrder = 5; G.add(dome);
  door = new THREE.Mesh(new THREE.SphereGeometry(5.95, 12, LITE ? 12 : 24, Math.PI / 2 - GAP / 2, GAP, 0, Math.PI / 2), M.glass.clone()); door.material.color.setHex(0xbfe6ff); door.position.y = 2.58; door.renderOrder = 5; door.scale.y = 0.02; G.add(door);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 8), M.hull); cap.position.y = 2.58 + 5.95; G.add(cap);
  // landing legs
  for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2, x = Math.sin(a) * 5.4, z = Math.cos(a) * 5.4;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.45, 8), M.dark); leg.position.set(x * 1.04, 0.72, z * 1.04); leg.rotation.set(Math.cos(a) * 0.2, 0, -Math.sin(a) * 0.2); G.add(leg);
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.62, 0.12, 16), M.dark); pad.position.set(x * 1.1, 0.06, z * 1.1); G.add(pad); }
  // ramp (hinged at the rim; folds up and retracts at launch) + walkway over the wing through the door gap
  const walk = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.08, 3.9), M.dark); walk.position.set(0, 2.6, 7.35); G.add(walk);
  const step = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.31, 0.7), M.dark); step.position.set(0, 2.17, 5.15); G.add(step);
  ramp = new THREE.Group(); ramp.position.set(0, 2.64, 9.3); G.add(ramp);
  const RL = Math.hypot(5.4, 2.64); ramp.userData = {L: RL, down: Math.atan2(2.64, 5.4)};
  const deck = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, RL), M.hull); deck.position.set(0, -0.04, RL / 2); ramp.add(deck);
  for (const s of [-1, 1]) { const rail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, RL), M.glowA); rail.position.set(s * 0.82, 0.03, RL / 2); ramp.add(rail); }
  ramp.rotation.x = ramp.userData.down;
  // seats around the console (facing it)
  const seatG = new THREE.BoxGeometry(0.62, 0.1, 0.58), backG = new THREE.BoxGeometry(0.62, 0.75, 0.08), postG = new THREE.CylinderGeometry(0.07, 0.11, 0.42, 8);
  for (let i = 0; i < NSEAT; i++) { const a = seatAng(i), sg = new THREE.Group(); sg.position.set(Math.sin(a) * SEAT_R, FLOOR, Math.cos(a) * SEAT_R); sg.rotation.y = a + Math.PI;
    const s1 = new THREE.Mesh(seatG, M.seat); s1.position.y = 0.46; const s2 = new THREE.Mesh(backG, M.seat); s2.position.set(0, 0.86, 0.27); s2.rotation.x = -0.12; const s3 = new THREE.Mesh(postG, M.dark); s3.position.y = 0.21; sg.add(s1, s2, s3);
    const tg = tagMesh(); tg.position.set(0, 1.42, 0.3); tg.rotation.y = Math.PI; tg.visible = false; sg.add(tg); seatTags.push(tg); G.add(sg); }
  // console: pedestal, glowing top ring, holographic ring, countdown band visible from every seat
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.85, 1.0, 24), M.dark); ped.position.y = FLOOR + 0.5; G.add(ped);
  consoleTop = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.75, 0.12, 32), M.console); consoleTop.position.y = FLOOR + 1.06; G.add(consoleTop);
  const holo = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.02, 6, 48), M.glowA); holo.rotation.x = Math.PI / 2; holo.position.y = FLOOR + 1.45; G.add(holo); G.userData.holo = holo;
  const ct = canvasTex(1024, 96, () => {}); ct.wrapS = THREE.RepeatWrapping; ct.repeat.set(3, 1);
  cdBand = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.42, 48, 1, true), new THREE.MeshBasicMaterial({map: ct, transparent: true, side: THREE.DoubleSide, toneMapped: false, depthWrite: false}));
  cdBand.position.y = FLOOR + 1.5; cdBand.visible = false; G.add(cdBand);
  // 'Board saucer' sign above the ramp
  const st = canvasTex(512, 128, (c, w, h) => { c.fillStyle = 'rgba(8,30,40,0.82)'; c.beginPath(); c.roundRect ? c.roundRect(4, 4, w - 8, h - 8, 26) : c.rect(4, 4, w - 8, h - 8); c.fill(); c.strokeStyle = '#7ff3ff'; c.lineWidth = 6; c.stroke();
    c.fillStyle = '#e9ffff'; c.font = 'bold 60px Arial, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('Board saucer', w / 2, h / 2 + 2); });
  sign = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.8), new THREE.MeshBasicMaterial({map: st, transparent: true, toneMapped: false, depthWrite: false, side: THREE.DoubleSide}));
  sign.position.set(0, 5.2, 11.2); sign.renderOrder = 6; G.add(sign);
  return G;
}
function seatAng(i) { return (30 + 60 * i) * Math.PI / 180; }
function tagMesh() { const t = canvasTex(256, 64, () => {}); return new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.2), new THREE.MeshBasicMaterial({map: t, transparent: true, toneMapped: false, depthWrite: false, side: THREE.DoubleSide})); }
function drawTag(m, txt, mine) { const t = m.material.map, c = t.userData.c, g = c.getContext('2d'); g.clearRect(0, 0, 256, 64); if (!txt) { m.visible = false; return; }
  g.fillStyle = mine ? 'rgba(255,215,0,0.9)' : 'rgba(10,20,30,0.78)'; g.fillRect(0, 0, 256, 64); g.fillStyle = mine ? '#111' : '#eaffff'; g.font = 'bold 34px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt.slice(0, 14), 128, 34); t.needsUpdate = true; m.visible = true; }
function drawBand(txt) { const t = cdBand.material.map, c = t.userData.c, g = c.getContext('2d'); g.clearRect(0, 0, 1024, 96); if (!txt) { cdBand.visible = false; return; }
  g.fillStyle = 'rgba(0,25,30,0.7)'; g.fillRect(0, 0, 1024, 96); g.fillStyle = '#9ffcff'; g.font = 'bold 56px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 512, 50); t.needsUpdate = true; cdBand.visible = true; }

/* ---------- shared state ---------- */
const S = {s: 0, mode: 'parked', at: 'home', dest: 'mars', t0: 0, from: 'home', to: 'home', tab: 'space'};
let mySeat = -1, myId = '', act = null, lastSend = 0;
const peerSeat = {};    // peerId -> {seat, n, t}
function myName() { return (window.JFMP && JFMP.name) || 'You'; }
function stateMsg() { return {k: 'st', s: S.s, mode: S.mode, at: S.at, dest: S.dest, from: S.from, to: S.to, ph: now() - S.t0, seat: mySeat, n: myName()}; }
function send() { lastSend = now(); if (act) act.send(stateMsg()).catch(() => {}); }
function bump(ch) { Object.assign(S, ch); S.s++; send(); }
function onMsg(m, peerId) {
  if (!m || m.k !== 'st') return;
  peerSeat[peerId] = {seat: m.seat | 0, n: String(m.n || 'Guest').slice(0, 24), t: now()};
  const mine = myId || (window.JFMP && JFMP.selfId) || '';
  if (m.s > S.s || (m.s === S.s && peerId < mine && (m.mode !== S.mode || m.dest !== S.dest || m.at !== S.at))) {
    const was = S.mode; Object.assign(S, {s: m.s, mode: m.mode, at: m.at, dest: m.dest, from: m.from, to: m.to, t0: now() - (+m.ph || 0)});
  }
  // seat clash: the lower id keeps the seat
  if (mySeat >= 0 && m.seat === mySeat && peerId < mine && S.mode !== 'fly') { const f = freeSeat(); if (f >= 0) { mySeat = f; placeInSeat(); send(); } }
}
function hookMP() {
  const MP = window.JFMP; if (!MP || !MP.room || !MP.room.makeAction) return false;
  try { act = MP.room.makeAction('ufo'); act.onMessage((d, ctx) => onMsg(d, ctx && ctx.peerId)); myId = MP.selfId || ''; if (MP.room.onPeerJoin) MP.room.onPeerJoin(() => setTimeout(send, 800)); } catch (e) { console.warn('saucer mp', e); act = null; }
  return true;
}
function occupied() { const o = {}; const t = now(); for (const id in peerSeat) { const p = peerSeat[id]; if (t - p.t < 6000 && p.seat >= 0 && window.JFMP && JFMP.peers && JFMP.peers[id]) o[p.seat] = p.n; } return o; }
function freeSeat() { const o = occupied(); for (let i = 0; i < NSEAT; i++) if (!(i in o)) return i; return -1; }

/* ---------- flight plans (deterministic: same inputs -> same path on every client) ---------- */
function plan(fromId, toId) {
  const A = spot(fromId), B = spot(toId), dk = D(toId).kind, fk = D(fromId).kind;
  if (dk === 'mars') return {kind: 'mars', dur: 19000, A, B,
    at(t) { const s = t / 1000; let y = A.y; if (s > 3) y += 40 * smooth((s - 3) / 4); if (s > 7) y += 4000 * Math.pow((s - 7) / 12, 2.2);
      return {x: A.x, y, z: A.z, yaw: A.yaw, tilt: 0, ax: 0, az: 1, ramp: s < 2 ? 1 - s / 2 : 0, door: smooth((s - 1.2) / 1.6), fade: smooth((s - 16.5) / 2.3), fadeCol: 0x000000, dark: smooth((s - 9) / 8), cut: false}; } };
  if (dk === 'city' || fk === 'city') {
    // 15 s city flights (Josh, 1:26 AM): ramp up 0-1 s, climb 1.5-3 s, rise + run out 3-7 s (white cloud fade 6.2-7 s), cut, descent 7-12.6 s,
    // settle 12.6-13.3 s, ramp down 13.3-15 s
    const hd = Math.atan2(B.x - A.x, B.z - A.z), dx = Math.sin(hd), dz = Math.cos(hd), H = 1400, run = 900;
    return {kind: 'city', dur: 15000, A, B,
      at(t) { const s = t / 1000; let x, y, z, yaw, tilt = 0, cut = s >= 7, fade = 0;
        if (!cut) { const c = smooth((s - 3) / 4); x = A.x + dx * run * c; z = A.z + dz * run * c; y = A.y + (s > 1.5 ? 50 * smooth((s - 1.5) / 1.5) : 0) + (H - 50) * Math.pow(Math.max(0, (s - 3) / 4), 1.6); yaw = A.yaw; tilt = 0.12 * Math.sin(Math.PI * Math.min(1, Math.max(0, (s - 2.5) / 4.5))); fade = smooth((s - 6.2) / 0.8); }
        else { const c = smooth((s - 7) / 5); x = B.x - dx * run * (1 - c); z = B.z - dz * run * (1 - c); y = B.y + 2 + (H - 2) * Math.pow(1 - smooth((s - 7) / 5.6), 1.3); yaw = B.yaw; tilt = 0.1 * Math.max(0, 1 - (s - 7) / 4); fade = 1 - smooth((s - 7) / 0.9); if (s > 12.6) y = B.y + 2 * (1 - smooth((s - 12.6) / 0.7)); }
        return {x, y, z, yaw, tilt, ax: dz, az: -dx, ramp: s < 1 ? 1 - s : s > 13.3 ? Math.min(1, (s - 13.3) / 1.7) : 0, door: s < 13.3 ? smooth((s - 0.5) / 1.0) : 1 - smooth((s - 13.3) / 1.0), fade, fadeCol: 0xf2f4f7, cloud: true, cut}; } };
  }
  const dist = Math.hypot(B.x - A.x, B.z - A.z), Tc = Math.min(30, Math.max(6, dist / 110)), hd = Math.atan2(B.x - A.x, B.z - A.z), dx = Math.sin(hd), dz = Math.cos(hd);
  const T1 = 3, T2 = T1 + 5, T3 = T2 + Tc, T4 = T3 + 6, dur = (T4 + 2.2) * 1000, hop = Math.min(220, 30 + dist * 0.12);
  return {kind: 'local', dur, A, B,
    at(t) { const s = t / 1000; let x = A.x, z = A.z, y = A.y, yaw = A.yaw, tilt = 0;
      if (s >= T1 && s < T2) y = A.y + 40 * smooth((s - T1) / 5);
      else if (s >= T2 && s < T3) { const u = (s - T2) / Tc, c = smooth(u); x = lerp(A.x, B.x, c); z = lerp(A.z, B.z, c); y = lerp(A.y + 40, B.y + 40, c) + Math.sin(Math.PI * u) * hop; yaw = lerp(A.yaw, B.yaw, c); tilt = 0.14 * Math.sin(Math.PI * u); }
      else if (s >= T3) { x = B.x; z = B.z; yaw = B.yaw; y = B.y + 40 * (1 - smooth((s - T3) / 6)); }
      return {x, y, z, yaw, tilt, ax: dz, az: -dx, ramp: s < 2 ? 1 - s / 2 : s > T4 ? Math.min(1, (s - T4) / 2) : 0, door: s < T4 ? smooth((s - 1.2) / 1.6) : 1 - smooth((s - T4) / 1.2), fade: 0, cut: s >= T2 + Tc / 2}; } };
}

/* ---------- floors for walking (ramp steps, walkway, cabin) ---------- */
let floors = [];
function setFloors(on, P) {
  const F = W3D.floors; if (!F) return;
  for (const f of floors) { const i = F.indexOf(f); if (i >= 0) F.splice(i, 1); } floors = [];
  if (!on) return;
  const rects = [[-5.5, 5.5, -2.4, 2.4, FLOOR], [-2.4, 2.4, -5.5, 5.5, FLOOR], [-4.1, 4.1, -4.1, 4.1, FLOOR], [-0.85, 0.85, 4.8, 5.5, 2.33], [-0.85, 0.85, 5.5, 9.3, 2.64]];
  for (let j = 0; j < 8; j++) rects.push([-0.8, 0.8, 9.3 + j * 0.675, 9.3 + (j + 1) * 0.675, 2.64 * (1 - (j + 0.5) / 8)]);
  const c = Math.round(Math.cos(P.yaw)), s = Math.round(Math.sin(P.yaw));
  for (const [x0, x1, z0, z1, y] of rects) { const xs = [], zs = []; for (const [lx, lz] of [[x0, z0], [x1, z1]]) { xs.push(P.x + lx * c + lz * s); zs.push(P.z - lx * s + lz * c); }
    const f = {x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs), y: P.y + y, ufo: true}; F.push(f); floors.push(f); }
}

/* ---------- riding ---------- */
let cutWait = 0, parkNR = 0; let pose = {x: HOME.x, y: 34, z: HOME.z, yaw: 0, tilt: 0, ax: 0, az: 1, ramp: 1, door: 0, fade: 0}, parkedAt = null, fadeM = null, clouds = null, savedFly = null, inCity = null, lastCut = false, navDone = false;
const seatLocal = i => { const a = seatAng(i); return new THREE.Vector3(Math.sin(a) * (SEAT_R - 0.5), FLOOR, Math.cos(a) * (SEAT_R - 0.5)); };
function seatWorld(i) { return seatLocal(i).applyMatrix4(ent.object3D.matrixWorld); }
function lockTo(p) { const rig = rigEl(), c = camEl(); if (!rig || !c) return; const rp = rig.object3D.position, cw = c.object3D.getWorldPosition(v3); rp.x += p.x - cw.x; rp.z += p.z - cw.z; rp.y = p.y;
  const ph = rig.components['w3d-physics']; if (ph) { ph.prev.copy(rp); ph.vy = 0; } }
function placeInSeat() { if (mySeat < 0 || !ent) return; ent.object3D.updateMatrixWorld(true); const p = seatWorld(mySeat); lockTo(p);
  const a = seatAng(mySeat), yaw = pose.yaw + a; /* face the console (A-Frame looks down -z) */ const rig = rigEl(); if (rig) rig.object3D.rotation.y = yaw; const lc = camEl() && camEl().components['look-controls']; if (lc && lc.yawObject) lc.yawObject.rotation.y = 0; }
function board() {
  if (mySeat >= 0) { openMenu(); return; }
  if (S.mode === 'fly' || S.mode === 'away') { hud('The saucer is in flight'); return; }
  const f = freeSeat(); if (f < 0) { hud('The saucer is full (6 seats)'); return; }
  mySeat = f; if (JFVR.fly && JFVR.toggleFly) JFVR.toggleFly(); JFVR.fly = false; placeInSeat(); send();
  hud('Aboard the saucer - point at the console to choose a destination'); showOverlay();
}
function leave(walk) {
  if (mySeat < 0) return; if (S.mode === 'fly') { hud('Wait for the landing'); return; }
  mySeat = -1; send(); hideOverlay(); closeMenu();
  if (!walk) { const P = parkedAt || spot(S.at), c = Math.cos(P.yaw), s = Math.sin(P.yaw); W3D.teleportTo(P.x + 16.5 * s, undefined, P.z + 16.5 * c, P.yaw * 180 / Math.PI); }
  hud('You left the saucer');
}
function beginRide() { // I'm aboard and the flight starts: seat lock, no steering
  savedFly = {fly: JFVR.fly, R: JFVR.flyRadius, Y: JFVR.flyMaxY}; JFVR.fly = false; closeMenu();
  const cam = document.querySelector('a-scene').camera;
  fadeM = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 8), new THREE.MeshBasicMaterial({color: 0x000000, side: THREE.BackSide, transparent: true, opacity: 0, depthTest: false, depthWrite: false, fog: false})); fadeM.renderOrder = 1e4; cam.add(fadeM);
  lastCut = false; navDone = false;
  const pl = curPlan; if (pl && pl.kind === 'city' && D(S.to).kind === 'city' && W3D.cities) W3D.cities.load(S.to);   // start loading the destination city now
  if (pl && pl.kind === 'city') buildClouds();
}
function endRide() {
  if (fadeM) { fadeM.parent && fadeM.parent.remove(fadeM); fadeM.geometry.dispose(); fadeM.material.dispose(); fadeM = null; }
  disposeClouds(); restoreSky();
  if (savedFly) { JFVR.fly = false; savedFly = null; }
}
let skySaved = null;
function darkSky(k) { const s3 = document.querySelector('a-scene').object3D, f = s3.fog; if (!f) return; if (!skySaved) skySaved = {c: f.color.getHex(), n: f.near, f: f.far}; f.color.setHex(skySaved.c).lerp(new THREE.Color(0x02030a), k); }
function restoreSky() { if (!skySaved) return; const f = document.querySelector('a-scene').object3D.fog; if (f) { f.color.setHex(skySaved.c); } skySaved = null; }
function buildClouds() {
  if (clouds) return; const tex = canvasTex(128, 128, (c) => { for (let i = 0; i < 7; i++) { const x = 30 + Math.random() * 68, y = 40 + Math.random() * 48, r = 18 + Math.random() * 26, g = c.createRadialGradient(x, y, 2, x, y, r); g.addColorStop(0, 'rgba(255,255,255,0.85)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 128, 128); } });
  clouds = new THREE.Group(); const mat = new THREE.SpriteMaterial({map: tex, transparent: true, depthWrite: false, fog: false, opacity: 0.9});
  for (let i = 0; i < (LITE ? 18 : 40); i++) { const sp = new THREE.Sprite(mat); const a = Math.random() * 6.283, r = 80 + Math.random() * 1400; sp.position.set(Math.sin(a) * r, (Math.random() - 0.5) * 160, Math.cos(a) * r); const sc = 160 + Math.random() * 260; sp.scale.set(sc, sc * 0.45, 1); clouds.add(sp); }
  clouds.userData = {tex, mat}; clouds.visible = false; document.querySelector('a-scene').object3D.add(clouds);
}
function disposeClouds() { if (!clouds) return; clouds.parent && clouds.parent.remove(clouds); clouds.userData.tex.dispose(); clouds.userData.mat.dispose(); clouds = null; }
function goMars() { if (navDone) return; navDone = true; const nav = () => { window.location.href = MARS_URL; }; if (W3D.goMars) return W3D.goMars();
  const sc = document.querySelector('a-scene'), ses = sc && sc.renderer && sc.renderer.xr && sc.renderer.xr.getSession && sc.renderer.xr.getSession(); if (ses) { setTimeout(nav, 1500); ses.end().then(nav, nav); } else nav(); }
W3D.saucerNav = goMars;

/* ---------- menu (tabs Space / Earth / Here, destinations, Launch, Leave) ---------- */
let menu = null, menuOpen = false;
function btn(parent, label, w, h, x, y, col, fn, tw) {
  const b = document.createElement('a-plane'); b.setAttribute('class', 'btn'); b.setAttribute('width', w); b.setAttribute('height', h); b.setAttribute('position', x + ' ' + y + ' 0'); b.setAttribute('material', 'shader:flat;color:' + col);
  const t = document.createElement('a-text'); t.setAttribute('value', label); t.setAttribute('align', 'center'); t.setAttribute('color', '#111'); t.setAttribute('width', tw || 2.2); t.setAttribute('position', '0 0 0.005'); b.appendChild(t);
  b.addEventListener('click', ev => { const ce = ev.detail && ev.detail.cursorEl, lc = ce && ce.getAttribute && ce.getAttribute('laser-controls'); if (lc && /left/.test(typeof lc === 'string' ? lc : lc.hand)) return; ev.stopPropagation && ev.stopPropagation(); fn(); });
  parent.appendChild(b); b.userData = {t}; return b;
}
function buildMenu() {
  menu = document.createElement('a-entity'); menu.setAttribute('scale', '0.6 0.6 0.6'); menu.setAttribute('visible', false); ent.appendChild(menu);
  const bg = document.createElement('a-plane'); bg.setAttribute('width', 1.5); bg.setAttribute('height', 1.62); bg.setAttribute('material', 'shader:flat;color:#0b1d26;opacity:0.86;transparent:true'); bg.setAttribute('position', '0 0 -0.01'); menu.appendChild(bg);
  const title = document.createElement('a-text'); title.setAttribute('value', 'Choose a destination'); title.setAttribute('align', 'center'); title.setAttribute('color', '#9ffcff'); title.setAttribute('width', 2.6); title.setAttribute('position', '0 0.7 0'); menu.appendChild(title);
  menu.userData = {tabs: {}, items: [], title};
  [['space', 'Space', -0.47], ['earth', 'Earth', 0], ['here', 'Here', 0.47]].forEach(([id, l, x]) => { menu.userData.tabs[id] = btn(menu, l, 0.44, 0.16, x, 0.5, '#7fd3e0', () => { S.tab = id; renderMenu(); }); });
  for (let i = 0; i < 5; i++) menu.userData.items.push(btn(menu, '', 1.3, 0.15, 0, 0.29 - i * 0.18, '#d8f6ff', () => { const d = menu.userData.list[i]; if (!d || S.mode !== 'parked') return; if (d.id === S.at && d.kind !== 'mars') { hud('The saucer is already here'); return; } bump({dest: d.id}); renderMenu(); }));
  menu.userData.launch = btn(menu, 'LAUNCH', 1.3, 0.22, 0, -0.66, '#ff9a3c', () => { if (mySeat < 0 && S.mode !== 'fly' && S.mode !== 'away') { board(); if (mySeat < 0) return; }
    console.log('UFO launch press', S.mode, S.at, '->', S.dest, 'seat', mySeat);
    if (S.mode === 'parked') { if (S.dest === S.at && D(S.dest).kind !== 'mars') { hud('Pick a destination first'); return; } bump({mode: 'count', t0: now()}); closeMenu(); return; } else if (S.mode === 'count') bump({mode: 'parked'}); renderMenu(); }, 3.0);
  menu.userData.leave = btn(menu, 'Leave saucer', 0.62, 0.13, -0.34, -0.9, '#ffd700', () => leave(false), 1.8);
  menu.userData.close = btn(menu, 'Close', 0.62, 0.13, 0.34, -0.9, '#bbbbbb', closeMenu, 1.8);
}
function renderMenu() {
  if (!menu) return; const U = menu.userData;
  for (const id in U.tabs) U.tabs[id].setAttribute('material', 'color', id === S.tab ? '#ffd700' : '#6fb7c4');
  U.list = DEST.filter(d => d.tab === S.tab);
  U.items.forEach((b, i) => { const d = U.list[i]; b.object3D.visible = !!d; b.object3D.position.z = d ? 0 : -500;
    if (d) { b.userData.t.setAttribute('value', (d.id === S.dest ? '> ' : '') + d.name + (d.id === S.at && d.kind !== 'mars' ? '  (here)' : '')); b.setAttribute('material', 'color', d.id === S.dest ? '#ffd700' : '#d8f6ff'); } });
  const L = U.launch; if (S.mode === 'count') { L.userData.t.setAttribute('value', 'CANCEL LAUNCH (' + Math.ceil((COUNT - (now() - S.t0)) / 1000) + ')'); L.setAttribute('material', 'color', '#ff6060'); }
  else { L.userData.t.setAttribute('value', 'LAUNCH: ' + D(S.dest).name.toUpperCase()); L.setAttribute('material', 'color', '#ff9a3c'); }
  U.title.setAttribute('value', S.mode === 'count' ? 'Launching - hop on or off now' : 'Choose a destination');
}
function openMenu() {
  if (!ent) return; if (!menu) buildMenu(); if (S.mode === 'fly' || S.mode === 'away') return;
  const d = D(S.dest); S.tab = d.tab; renderMenu();
  // small panel ~1.3 m in front of the viewer, lower and to the right so the forward view stays clear
  ent.object3D.updateMatrixWorld(true); const cp = camPos(), lp = ent.object3D.worldToLocal(cp.clone()), cam = document.querySelector('a-scene').camera;
  const f = new THREE.Vector3(); cam.getWorldDirection(f); f.y = 0; if (f.lengthSq() < 1e-6) f.set(0, 0, -1); f.normalize();
  const iq = ent.object3D.getWorldQuaternion(new THREE.Quaternion()).invert(); f.applyQuaternion(iq); f.y = 0; f.normalize();
  const r = new THREE.Vector3(-f.z, 0, f.x), P = lp.clone().addScaledVector(f, 1.3).addScaledVector(r, 0.42); P.y = lp.y - 0.45;
  const a = Math.atan2(-f.x, -f.z);
  menu.setAttribute('position', P.x + ' ' + P.y + ' ' + P.z); menu.setAttribute('rotation', '-12 ' + (a * 180 / Math.PI - 14) + ' 0'); menu.setAttribute('visible', true); menuOpen = true;
  setProx(false);
}
function closeMenu() { if (!menu) return; menu.setAttribute('visible', false); menu.setAttribute('position', '0 -1000 0'); menuOpen = false; setProx(true); }
// the invisible console / hull click targets must not sit in front of the menu buttons while the menu is open
function setProx(on) { ['ufo-console', 'ufo-hull'].forEach(id => { const e = document.getElementById(id); if (e) { if (on) e.classList.add('btn'); else e.classList.remove('btn'); } });
  document.querySelectorAll('[raycaster]').forEach(r => r.components.raycaster && r.components.raycaster.refreshObjects()); }
/* head-locked countdown (big number ~1.5 m ahead, a little below eye level) + a soft beep each second, for everyone aboard */
let cdHead = null, actx = null;
function headCount(n) { const cam = document.querySelector('a-scene') && document.querySelector('a-scene').camera; if (!cam) return;
  if (!cdHead) { const t = canvasTex(512, 256, () => {}); cdHead = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.31), new THREE.MeshBasicMaterial({map: t, transparent: true, toneMapped: false, depthTest: false, depthWrite: false}));
    cdHead.position.set(0, -0.18, -1.5); cdHead.renderOrder = 999; cdHead.frustumCulled = false; cam.add(cdHead); }
  if (n == null) { cdHead.visible = false; return; }
  const t = cdHead.material.map, c = t.userData.c, g = c.getContext('2d'); g.clearRect(0, 0, 512, 256);
  g.fillStyle = 'rgba(5,22,30,0.8)'; g.beginPath(); g.roundRect ? g.roundRect(4, 4, 504, 248, 30) : g.rect(4, 4, 504, 248); g.fill(); g.strokeStyle = '#ff9a3c'; g.lineWidth = 6; g.stroke();
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ffd27a'; g.font = 'bold 150px Arial, sans-serif'; g.fillText(String(n), 256, 112);
  g.fillStyle = '#e9ffff'; g.font = 'bold 34px Arial, sans-serif'; g.fillText('Launch to ' + D(S.dest).name + ' in ' + n, 256, 214); t.needsUpdate = true; cdHead.visible = true; }
function beep(hi) { try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume();
  const o = actx.createOscillator(), gn = actx.createGain(), t = actx.currentTime; o.type = 'sine'; o.frequency.value = hi ? 1320 : 880; gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(0.18, t + 0.02); gn.gain.exponentialRampToValueAtTime(0.0001, t + (hi ? 0.5 : 0.18));
  o.connect(gn); gn.connect(actx.destination); o.start(t); o.stop(t + 0.55); } catch (e) {} }


/* ---------- HTML overlay for phone / desktop while aboard ---------- */
let ov = null;
function showOverlay() { if (ov) return; ov = document.createElement('div'); ov.id = 'ufoui'; ov.style.cssText = 'position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:50;display:flex;gap:8px;align-items:center;font:600 14px system-ui,sans-serif';
  const mk = (t, fn, bg) => { const b = document.createElement('button'); b.textContent = t; b.style.cssText = 'font:600 15px sans-serif;padding:8px 12px;border-radius:8px;border:0;background:' + bg + ';color:#111'; b.onclick = fn; ov.appendChild(b); return b; };
  mk('Destinations', openMenu, '#9ffcff'); ov.leave = mk('Leave saucer', () => leave(false), '#ffd700'); ov.info = document.createElement('span'); ov.info.style.cssText = 'color:#fff;text-shadow:0 1px 3px #000'; ov.appendChild(ov.info); document.body.appendChild(ov); }
function hideOverlay() { if (ov) { ov.remove(); ov = null; } }

/* ---------- per-frame ---------- */
let curPlan = null, curPlanKey = '', lastSeatDraw = 0, lastCount = -1, home = true;
function applyPose(P) {
  const o = ent.object3D; o.position.set(P.x, P.y, P.z);
  q4.setFromAxisAngle(v3.set(P.ax || 0, 0, P.az || 1).normalize(), P.tilt || 0); o.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), P.yaw).premultiply(q4);
  const r = ramp.userData, k = Math.max(0, Math.min(1, P.ramp)); ramp.rotation.x = lerp(-1.25, r.down, smooth(k)); ramp.scale.z = Math.max(0.02, smooth(Math.min(1, k * 1.6)));
  door.scale.y = Math.max(0.02, P.door);
}
function tick(t, dt) {
  if (!ent || !W3D.active) { if (ent) ent.object3D.visible = !!W3D.active; return; }
  ent.object3D.visible = true;
  const T = now();
  // automatic transitions (identical on every client)
  if (S.mode === 'count' && T - S.t0 >= COUNT) { S.s++; S.mode = 'fly'; S.from = S.at; S.to = S.dest; S.t0 += COUNT; }
  if (S.mode === 'fly') { const key = S.from + '>' + S.to; if (key !== curPlanKey) { curPlan = plan(S.from, S.to); curPlanKey = key; if (mySeat >= 0 && !fadeM) beginRide(); }
    if (T - S.t0 >= curPlan.dur) { const k = curPlan.kind; S.s++; S.t0 += curPlan.dur;
      if (k === 'mars') { S.mode = 'away'; S.at = 'home'; } else { S.mode = 'parked'; S.at = S.to; }
      if (mySeat >= 0) { endRide(); if (k === 'mars') { mySeat = -1; hideOverlay(); } else { placeInSeat(); hud('Landed - ' + D(S.at).name + '. Walk down the ramp or choose Leave saucer'); } }
      curPlanKey = ''; S.dest = S.at === 'home' ? 'mars' : 'home'; } }
  if (S.mode === 'away' && T - S.t0 > 20000) { S.s++; S.mode = 'parked'; S.at = 'home'; S.t0 = T; }
  // pose
  if (S.mode === 'fly' && curPlan) { pose = curPlan.at(T - S.t0); setFloors(false); parkedAt = null; }
  else { const P = spot(S.at); if (!parkedAt || parkedAt.x !== P.x || parkedAt.z !== P.z || parkedAt.y !== P.y) { parkedAt = P; setFloors(true, P); }
    pose = {x: P.x, y: P.y, z: P.z, yaw: P.yaw, tilt: 0, ramp: 1, door: 0, fade: 0}; }
  ent.object3D.visible = S.mode !== 'away';
  applyPose(pose);
  // passenger: seat lock, fades, clouds, city hand-over, Mars
  if (mySeat >= 0 && S.mode === 'fly' && curPlan) {
    ent.object3D.updateMatrixWorld(true); lockTo(seatWorld(mySeat));
    if (fadeM) { let f = pose.fade || 0; if (pose.cut && curPlan.kind === 'city' && D(S.to).kind === 'city' && !W3D.cities.isReady(S.to)) { if (!cutWait) cutWait = performance.now(); f = performance.now() - cutWait < 5000 ? 1 : 0; if (f === 0) hud('Still loading ' + D(S.to).name + '...'); } else cutWait = 0; fadeM.material.color.setHex(pose.fadeCol || 0); fadeM.material.opacity = f; }
    if (pose.dark) darkSky(pose.dark);
    if (clouds) { const ref = pose.cut ? curPlan.B : curPlan.A; clouds.position.set(pose.x, ref.y + 1250, pose.z); clouds.visible = pose.y - ref.y > 700; }
    if (curPlan.kind === 'city' && pose.cut !== lastCut) { lastCut = pose.cut; if (pose.cut) { if (D(S.to).kind === 'city') W3D.cities.enter(S.to); else if (W3D.cities) W3D.cities.leave(); } }
    if (curPlan.kind === 'mars' && T - S.t0 > curPlan.dur - 150) goMars();
  }
  // safety nets: no white fade or cloud deck outside a flight, and a city that never finished loading sends the saucer home
  if (!(mySeat >= 0 && S.mode === 'fly')) { if (fadeM) fadeM.material.opacity = 0; if (clouds) clouds.visible = false; }
  if (S.mode === 'parked' && D(S.at) && D(S.at).kind === 'city' && mySeat >= 0 && W3D.cities && !W3D.cities.isReady(S.at)) {
    if (!parkNR) parkNR = performance.now(); else if (performance.now() - parkNR > 10000) { parkNR = 0; console.warn('saucer: city', S.at, 'not ready 10 s after landing - flying home');
      hud(D(S.at).name + " didn't load - flying you home"); if (W3D.cities.leave) W3D.cities.leave(); try { bump({dest: 'home', mode: 'count', t0: now()}); } catch (e) { console.warn(e); } } }
  else parkNR = 0;
  // seated but parked / counting: hop off by walking away, hop on by walking in
  const rp = rigEl() && rigEl().object3D.position;
  if (rp && S.mode !== 'fly' && S.mode !== 'away' && parkedAt) { const d = Math.hypot(rp.x - parkedAt.x, rp.z - parkedAt.z);
    if (mySeat >= 0 && (d > 13 || (d > 6.2 && rp.y < parkedAt.y + 1.2))) leave(true);
    else if (mySeat < 0 && d < 5.7 && rp.y > parkedAt.y + 1.8 && rp.y < parkedAt.y + 3) { const f = freeSeat(); if (f >= 0) { mySeat = f; send(); hud('Aboard the saucer - point at the console to choose a destination'); showOverlay(); } } }
  // lights: soft pulse, brighter when someone approaches; sign only for people outside
  const cp = camPos(), dist = cp ? Math.hypot(cp.x - pose.x, cp.z - pose.z) : 999, near = S.mode !== 'fly' && dist < 30 ? 1 : 0;
  const ph = T / 1000, k = 0.55 + 0.45 * Math.sin(ph * 2.2), boost = near ? 1.6 : 1;
  M.glowA.color.setRGB(0.5 * k * boost, 0.95 * k * boost, 1.0 * k * boost); M.glowB.color.setRGB(1.0 * (1.1 - k) * boost, 0.75 * (1.1 - k) * boost, 0.4 * (1.1 - k) * boost);
  glow.material.opacity = S.mode === 'fly' ? 1 : 0.55 + 0.2 * k; M.console.opacity = 0.7 + 0.3 * Math.sin(ph * 3.1);
  G.userData.holo.rotation.z = ph * 0.8; G.userData.holo.position.y = FLOOR + 1.45 + 0.05 * Math.sin(ph * 1.7);
  sign.visible = mySeat < 0 && (S.mode === 'parked' || S.mode === 'count') && dist < 40 && dist > 5; if (sign.visible && cp) { const lp = ent.object3D.worldToLocal(cp.clone()); sign.rotation.y = Math.atan2(lp.x - sign.position.x, lp.z - sign.position.z); }
  // countdown + seat names
  if (S.mode === 'count') { const n = Math.max(0, Math.ceil((COUNT - (T - S.t0)) / 1000)); if (n !== lastCount) { lastCount = n; drawBand('LAUNCH TO ' + D(S.dest).name.toUpperCase() + ' IN ' + n + '   '); if (mySeat >= 0) { headCount(n); beep(n === 0); if (menuOpen) closeMenu(); } if (menuOpen) renderMenu(); if (ov) ov.info.textContent = 'Launch in ' + n + ' s'; } }
  else if (lastCount !== -1) { lastCount = -1; headCount(null); if (mySeat >= 0 && S.mode === 'fly') beep(true); drawBand(S.mode === 'fly' ? 'EN ROUTE: ' + D(S.to).name.toUpperCase() + '   ' : ''); if (ov) ov.info.textContent = S.mode === 'fly' ? 'Flying to ' + D(S.to).name : ''; if (menuOpen) renderMenu(); }
  if (ov) ov.leave.style.display = S.mode === 'fly' ? 'none' : '';
  if (T - lastSeatDraw > 700) { lastSeatDraw = T; const o = occupied(); for (let i = 0; i < NSEAT; i++) drawTag(seatTags[i], i === mySeat ? '' : o[i] || '', false); }
  if (!act && window.JFMP && JFMP.room) hookMP();
  if (act && T - lastSend > 1500 && window.JFMP && Object.keys(JFMP.peers || {}).length) send();
  // a saucer left in a city with nobody near it for a minute flies itself home
  if (S.mode === 'parked' && D(S.at).kind === 'city') { const P = parkedAt; let anyone = cp && Math.hypot(cp.x - P.x, cp.z - P.z) < 3000;
    for (const id in (window.JFMP && JFMP.peers) || {}) { const p = JFMP.peers[id]; if (p.tp && Math.hypot(p.tp.x - P.x, p.tp.z - P.z) < 3000) anyone = true; }
    if (anyone) S.idle = T; else if (T - (S.idle || T) > 60000) { S.s++; S.at = 'home'; S.dest = 'mars'; S.idle = T; } else if (!S.idle) S.idle = T; }
}
function tock() { if (ent && mySeat >= 0 && S.mode === 'fly' && W3D.active) { ent.object3D.updateMatrixWorld(true); lockTo(seatWorld(mySeat)); } }

/* ---------- build ---------- */
function build() {
  const sc = document.querySelector('a-scene'); if (!sc || !W3D.groundAt || !W3D.floors) return setTimeout(build, 300);
  ent = document.createElement('a-entity'); ent.id = 'ufo'; sc.appendChild(ent);
  ent.object3D.add(makeModel());
  const prox = (id, geo, y, fn) => { const e = document.createElement('a-entity'); e.setAttribute('class', 'btn'); e.id = id; e.setAttribute('geometry', geo); e.setAttribute('position', '0 ' + y + ' 0');
    e.setAttribute('material', 'shader: flat; transparent: true; opacity: 0; depthWrite: false'); e.addEventListener('click', ev => { const ce = ev.detail && ev.detail.cursorEl, lc = ce && ce.getAttribute && ce.getAttribute('laser-controls'); if (lc && /left/.test(typeof lc === 'string' ? lc : lc.hand)) return; fn(); }); ent.appendChild(e); return e; };
  prox('ufo-hull', 'primitive: cylinder; radius: 9.1; height: 1.9', 1.65, board);
  prox('ufo-console', 'primitive: cylinder; radius: 1.0; height: 1.15', FLOOR + 0.575, () => { if (mySeat < 0) board(); else openMenu(); });
  const sg = prox('ufo-sign', 'primitive: plane; width: 3.2; height: 0.8', 5.2, board); sg.object3D.position.z = 11.2;
  sc.addEventListener('bbuttondown', () => { if (menuOpen) closeMenu(); });
}
AFRAME.registerSystem('w3d-saucer', { init: function () { build(); }, tick: function (t, dt) { try { tick(t, dt); } catch (e) { console.warn('saucer', e); } }, tock: tock });

const addSpots = () => { if (!W3D.spots) return setTimeout(addSpots, 50);
  W3D.spots.saucer = () => { if (S.mode === 'parked') { const go = () => { const P = spot(S.at), c = Math.cos(P.yaw), s = Math.sin(P.yaw); W3D.teleportTo(P.x + 19 * s, undefined, P.z + 19 * c, P.yaw * 180 / Math.PI); hud('Flying saucer - walk up the ramp or point at it and pull the trigger'); };
      if (D(S.at).kind === 'city') { W3D.cities.enter(S.at); W3D.cities.load(S.at).then(go); } else go(); }
    else { W3D.teleportTo(HOME.x, undefined, HOME.z + 19, 0); hud(S.mode === 'fly' ? 'The saucer is in flight' : 'The saucer is away (' + D(S.at === 'home' ? 'mars' : S.at).name + ') - it comes back here when nobody is near it'); } }; };
addSpots();
W3D.saucer = {S, spot, plan, board, leave, openMenu, closeMenu, DEST, seat: () => mySeat, occupied, _find: findFlat, _onMsg: onMsg, select: id => bump({dest: id}), launch: () => bump({mode: 'count', t0: now()})};
})();
