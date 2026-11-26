/* Houseboat on Fowling Pond (Josh's request): a livable floating home moored by nothing, adrift in the open middle of the lake (centre
   -520, 40: 613 m from the nearest shore by the pond mask; the other boats are 100+ m away). 16 x 8 m hull, walk-in cabin (door gap in the
   bow wall) with a bed (pillows, blanket), galley, table + bench, rug and a lamp; front deck with two chairs and a table; roof deck with a rail
   reached by a stair at the stern; warm window glow, lamp and lantern at night (follows JFVR_NIGHT). It is STATIC (no bob) so the walkable
   floors and walls stay exact and it is comfortable in VR. ?spot=houseboat / menu "Houseboat (sleep aboard)" drops you inside by the bed.
   Colliders use W3D.walls / W3D.floors. No point lights are added (they would recompile every material on phones): the cabin glows through
   an animated emissive on its interior mesh plus additive halos. Budget: ~2k triangles (lite and desktop alike). */
(function () {
const W3D = window.W3D = window.W3D || {};
const C = {x: -520, z: 40}, FY = 16.9, PI = Math.PI;
W3D.houseboat = {x: C.x, z: C.z, deckY: FY};
const CREAM = 0xe8e2d2, WOOD = 0x8a6a45, DWOOD = 0x5e4126, ROOF = 0x4a5a66, HULL = 0x2f4a62, WHITE = 0xf2f0ea, DARK = 0x2a2d30, STEEL = 0xb9c0c4;
let built = false, glassMat, lightMat, lampMat, intMat, halos = [];
/* bedroom light switch (Josh, Nov 26): on the wall left of the bed. Off = cabin glow, bedside lamp, its halo and the warm windows go
   dark (at night the cabin is genuinely dark: interior surfaces are dimmed too); the deck and roof lanterns outside stay as they are.
   Laser + trigger in the headset, click / tap on desktop and phone. Remembered on this device. */
let lightsOn = (function () { try { return localStorage.getItem('jfvr_hb_lights') !== 'off'; } catch (e) { return true; } })();
function wallAdd(x0, x1, z0, z1, y0, y1) { W3D.walls.push({x0: C.x + x0, x1: C.x + x1, z0: C.z + z0, z1: C.z + z1, y0, y1}); }
function floorAdd(x0, x1, z0, z1, y) { W3D.floors.push({x0: C.x + x0, x1: C.x + x1, z0: C.z + z0, z1: C.z + z1, y}); }
function halo(x, y, z, size, rgb) { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(' + rgb + ',0.9)'); r.addColorStop(0.35, 'rgba(' + rgb + ',0.28)'); r.addColorStop(1, 'rgba(' + rgb + ',0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({map: new THREE.CanvasTexture(c), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false}));
  s.position.set(x, y, z); s.scale.set(size, size, 1); s.visible = false; halos.push(s); return s; }

function build() {
  if (built || !W3D.root || !W3D.walls) return; built = true;
  const ext = new W3D.MB(), inn = new W3D.MB(), glass = new W3D.MB(), glow = new W3D.MB(), lamp = new W3D.MB();
  const hw = t => 4 * Math.min(1, 0.86 + t * 6, Math.pow(Math.max(0, (1 - t) / 0.2), 0.6) + 0.02);   // half beam: square stern, tapered bow (bow = +x)
  const fn = t => ({w: hw(t), ky: FY - 1.0 + 0.25 * (1 - t) * 0, gy: FY});
  ext.loft(16, fn, HULL, 12, null, 0x24384c); ext.lid(16, fn, WOOD, 12, 0.0, 1.0);                            // hull + plank deck
  ext.box(0.12, 1.0, 6.9, -8, FY - 0.5, 0, 0x24384c); ext.box(15.9, 0.07, 0.25, -0.05, FY - 0.02, 3.92, 0xd8d2c0); ext.box(15.9, 0.07, 0.25, -0.05, FY - 0.02, -3.92, 0xd8d2c0);   // transom + toe rails
  // cabin outer shell (x -5.5..3.5, z -3..3, 16.9..19.4), door gap z -0.65..0.65 in the bow wall
  const H = 2.5, WY = FY + H / 2;
  ext.box(0.2, H, 6.0, -5.4, WY, 0, CREAM); wallAdd(-5.5, -5.3, -3, 3, FY, FY + H);
  ext.box(9.0, H, 0.2, -1, WY, -2.9, CREAM); wallAdd(-5.5, 3.5, -3, -2.8, FY, FY + H);
  ext.box(9.0, H, 0.2, -1, WY, 2.9, CREAM); wallAdd(-5.5, 3.5, 2.8, 3, FY, FY + H);
  ext.box(0.2, H, 2.35, 3.4, WY, -1.825, CREAM); wallAdd(3.3, 3.5, -3, -0.65, FY, FY + H);
  ext.box(0.2, H, 2.35, 3.4, WY, 1.825, CREAM); wallAdd(3.3, 3.5, 0.65, 3, FY, FY + H);
  ext.box(0.2, 0.4, 1.3, 3.4, FY + 2.3, 0, CREAM);                                                              // door header
  ext.box(0.26, 2.1, 0.08, 3.4, FY + 1.05, 0.69, DWOOD); ext.box(0.26, 2.1, 0.08, 3.4, FY + 1.05, -0.69, DWOOD);   // door frame
  ext.box(10.0, 0.22, 6.8, -1, FY + H + 0.11, 0, ROOF); inn.box(8.6, 0.05, 5.6, -1, FY + H - 0.03, 0, 0xf1ead8);   // roof slab + ceiling
  floorAdd(-8, 4.5, -4, 4, FY); floorAdd(4.5, 8, -2.6, 2.6, FY); floorAdd(-5.9, 3.9, -3.4, 3.4, FY + H + 0.2);
  // windows (frame quad + glass quad, both faces), north / south walls and either side of the door
  const win = (cx, cz, face) => { // face: 'x' wall normal along x, 'z' normal along z
    for (const sd of [-1, 1]) { const off = 0.115 * sd;
      if (face === 'z') { const z = cz + off + 0.012 * sd, z2 = cz + off + 0.02 * sd; ext.quad([cx - 0.8, FY + 1.05, z], [cx + 0.8, FY + 1.05, z], [cx + 0.8, FY + 2.0, z], [cx - 0.8, FY + 2.0, z], DWOOD);
        glass.quad([cx - 0.68, FY + 1.15, z2], [cx + 0.68, FY + 1.15, z2], [cx + 0.68, FY + 1.9, z2], [cx - 0.68, FY + 1.9, z2], 0xffffff); }
      else { const x = cx + off + 0.012 * sd, x2 = cx + off + 0.02 * sd; ext.quad([x, FY + 1.05, cz - 0.7], [x, FY + 1.05, cz + 0.7], [x, FY + 2.0, cz + 0.7], [x, FY + 2.0, cz - 0.7], DWOOD);
        glass.quad([x2, FY + 1.15, cz - 0.58], [x2, FY + 1.15, cz + 0.58], [x2, FY + 1.9, cz + 0.58], [x2, FY + 1.9, cz - 0.58], 0xffffff); } } };
  for (const x of [-3.6, -0.4, 2.2]) { win(x, -2.9, 'z'); win(x, 2.9, 'z'); }
  win(3.4, -1.85, 'x'); win(3.4, 1.85, 'x');
  // interior (floor level FY): rug, bed, bedside tables + lamp, galley, table + bench, stool
  inn.box(3.4, 0.02, 2.2, -0.9, FY + 0.01, 0, 0x8b3a3a); inn.box(2.8, 0.025, 1.6, -0.9, FY + 0.012, 0, 0xc9a24a); inn.box(2.2, 0.03, 1.0, -0.9, FY + 0.014, 0, 0x8b3a3a);
  inn.box(2.1, 0.35, 1.7, -4.2, FY + 0.175, 0, DWOOD); inn.box(2.0, 0.22, 1.6, -4.2, FY + 0.46, 0, 0xf4f0e6);    // bed frame + mattress
  inn.box(0.1, 1.1, 1.8, -5.2, FY + 0.7, 0, DWOOD); wallAdd(-5.3, -3.15, -0.85, 0.85, FY, FY + 0.57);
  for (const sd of [-1, 1]) inn.box(0.5, 0.15, 0.7, -4.85, FY + 0.64, sd * 0.4, 0xfffaf0);                          // pillows
  inn.box(1.1, 0.08, 1.64, -3.7, FY + 0.61, 0, 0x2a5f7a); inn.box(1.05, 0.04, 0.5, -3.7, FY + 0.67, 0.5, 0xd8a62a); // blanket + throw stripe
  for (const sd of [-1, 1]) { inn.box(0.55, 0.5, 0.55, -4.95, FY + 0.25, sd * 1.4, WOOD); wallAdd(-5.25, -4.65, sd * 1.4 - 0.28, sd * 1.4 + 0.28, FY, FY + 0.5); }
  inn.cyl(0.07, 0.07, 0.25, 8, -4.95, FY + 0.62, -1.4, DARK); lamp.cyl(0.12, 0.2, 0.28, 10, -4.95, FY + 0.88, -1.4, 0xffffff);   // lamp base + glowing shade (own material: the light switch turns it off)
  inn.box(3.6, 0.9, 0.7, 0.1, FY + 0.45, -2.45, 0xd9d3c0); inn.box(3.7, 0.04, 0.75, 0.1, FY + 0.92, -2.45, DARK); wallAdd(-1.7, 1.9, -2.8, -2.1, FY, FY + 0.92);
  inn.box(0.7, 0.04, 0.5, -0.7, FY + 0.95, -2.45, STEEL); inn.cyl(0.14, 0.14, 0.03, 10, 1.0, FY + 0.95, -2.45, DARK); inn.cyl(0.14, 0.14, 0.03, 10, 1.5, FY + 0.95, -2.45, DARK);   // sink + burners
  inn.box(3.2, 0.6, 0.35, 0.1, FY + 1.85, -2.62, WOOD); inn.box(0.8, 1.25, 0.7, 2.7, FY + 0.625, -2.45, WHITE); wallAdd(2.3, 3.1, -2.8, -2.1, FY, FY + 1.25);
  inn.box(1.4, 0.06, 0.9, -1.4, FY + 0.72, 1.5, WOOD); inn.cyl(0.08, 0.1, 0.7, 8, -1.4, FY + 0.35, 1.5, DWOOD); wallAdd(-2.1, -0.7, 1.05, 1.95, FY, FY + 0.78);
  inn.box(1.9, 0.45, 0.5, -1.4, FY + 0.225, 2.5, 0x3b6a7a); inn.box(1.9, 0.5, 0.1, -1.4, FY + 0.7, 2.74, 0x3b6a7a); wallAdd(-2.35, -0.45, 2.25, 2.8, FY, FY + 0.45);
  inn.cyl(0.25, 0.22, 0.45, 10, -1.4, FY + 0.225, 0.7, WOOD);
  // front deck: two chairs + table, lantern post
  for (const sd of [-1, 1]) { const z = sd * 1.2; ext.box(0.6, 0.08, 0.62, 5.4, FY + 0.45, z, 0xb08a58); ext.box(0.08, 0.55, 0.62, 5.1, FY + 0.72, z, 0xb08a58, 0, 0, -0.18);
    ext.box(0.08, 0.45, 0.08, 5.65, FY + 0.22, z - 0.26, DWOOD); ext.box(0.08, 0.45, 0.08, 5.65, FY + 0.22, z + 0.26, DWOOD); ext.box(0.08, 0.45, 0.08, 5.15, FY + 0.22, z - 0.26, DWOOD); ext.box(0.08, 0.45, 0.08, 5.15, FY + 0.22, z + 0.26, DWOOD);
    wallAdd(5.05, 5.75, z - 0.33, z + 0.33, FY, FY + 0.5); }
  ext.cyl(0.4, 0.4, 0.05, 10, 6.4, FY + 0.55, 0, WOOD); ext.cyl(0.05, 0.05, 0.55, 6, 6.4, FY + 0.27, 0, DWOOD); wallAdd(6.0, 6.8, -0.4, 0.4, FY, FY + 0.58);
  ext.cyl(0.04, 0.04, 1.8, 6, 7.4, FY + 0.9, 0, DWOOD); glow.cyl(0.13, 0.13, 0.3, 8, 7.4, FY + 1.95, 0, 0xffffff); ext.cyl(0.02, 0.17, 0.12, 8, 7.4, FY + 2.16, 0, DARK);
  // deck rails (visual only; step off into the water if you like) and stern stair to the roof deck
  const rail = (pts) => { for (let i = 0; i < pts.length; i++) { const p = pts[i]; ext.box(0.05, 0.9, 0.05, p[0], FY + 0.45, p[1], 0xe6e2d6);
      if (i) { const a = pts[i - 1], dx = p[0] - a[0], dz = p[1] - a[1]; ext.box(Math.hypot(dx, dz), 0.05, 0.05, (a[0] + p[0]) / 2, FY + 0.9, (a[1] + p[1]) / 2, 0xe6e2d6, Math.atan2(-dz, dx)); } } };
  for (const sd of [-1, 1]) { const pts = []; for (let x = -7.8; x <= 7.2; x += 1.5) pts.push([x, sd * (hw((x + 8) / 16) - 0.14)]); pts.push([7.9, sd * 0.35]); if (sd > 0) { rail(pts.filter(p => p[0] > -4.5 || p[0] < -7.6)); } else rail(pts); }
  rail([[7.9, -0.35], [7.9, 0.35]]);
  const steps = [3.4, 2.85, 2.3, 1.75, 1.2]; steps.forEach((z, i) => { const top = FY + 0.54 * (i + 1); ext.box(1.2, top - FY, 0.55, -6.5, FY + (top - FY) / 2, z, WOOD); floorAdd(-7.1, -5.9, z - 0.275, z + 0.275, top); });
  // roof deck: posts + rails with a gap for the stair, perimeter collider so you cannot fall off by walking
  const RY = FY + H + 0.22, RH = 1.0, rx0 = -5.9, rx1 = 3.9, rz = 3.4;
  const rr = (x0, z0, x1, z1) => { const n = Math.max(1, Math.round(Math.hypot(x1 - x0, z1 - z0) / 1.6)); for (let i = 0; i <= n; i++) ext.box(0.06, RH, 0.06, x0 + (x1 - x0) * i / n, RY + RH / 2, z0 + (z1 - z0) * i / n, 0xe6e2d6);
    ext.box(Math.hypot(x1 - x0, z1 - z0), 0.06, 0.06, (x0 + x1) / 2, RY + RH, (z0 + z1) / 2, 0xe6e2d6, Math.atan2(-(z1 - z0), x1 - x0)); ext.box(Math.hypot(x1 - x0, z1 - z0), 0.04, 0.04, (x0 + x1) / 2, RY + RH * 0.5, (z0 + z1) / 2, 0xe6e2d6, Math.atan2(-(z1 - z0), x1 - x0)); };
  rr(rx0, -rz, rx1, -rz); rr(rx0, rz, rx1, rz); rr(rx1, -rz, rx1, rz); rr(rx0, -rz, rx0, 0.7); rr(rx0, 1.7, rx0, rz);
  wallAdd(rx0 - 0.05, rx1 + 0.05, -rz - 0.05, -rz + 0.05, RY, RY + RH); wallAdd(rx0 - 0.05, rx1 + 0.05, rz - 0.05, rz + 0.05, RY, RY + RH); wallAdd(rx1 - 0.05, rx1 + 0.05, -rz, rz, RY, RY + RH);
  wallAdd(rx0 - 0.05, rx0 + 0.05, -rz, 0.7, RY, RY + RH); wallAdd(rx0 - 0.05, rx0 + 0.05, 1.7, rz, RY, RY + RH);
  for (const z of [-1.4, 1.4]) { ext.box(0.9, 0.08, 0.5, -2.0, RY + 0.4, z, 0xb08a58); }                          // two roof loungers (visual)
  ext.cyl(0.03, 0.03, 1.3, 5, -4.9, RY + 0.65, -2.9, DARK); glow.cyl(0.11, 0.11, 0.24, 8, -4.9, RY + 1.4, -2.9, 0xffffff);   // stern lantern
  // meshes
  const g = new THREE.Group(); g.name = 'houseboat';
  const lam = new THREE.MeshLambertMaterial({vertexColors: true, side: THREE.DoubleSide});
  intMat = new THREE.MeshLambertMaterial({vertexColors: true, side: THREE.DoubleSide, emissive: new THREE.Color(0x000000)});
  glassMat = new THREE.MeshBasicMaterial({color: 0x9fbac4, side: THREE.DoubleSide, fog: true}); lightMat = new THREE.MeshBasicMaterial({color: 0xe8dcc0, fog: true}); lampMat = new THREE.MeshBasicMaterial({color: 0xe8dcc0, fog: true});
  const mk = (b, m, sh) => { const mesh = new THREE.Mesh(b.build(), m); mesh.castShadow = sh && !W3D.lite; mesh.receiveShadow = !W3D.lite; g.add(mesh); return mesh; };
  mk(ext, lam, true); mk(inn, intMat, false); mk(glass, glassMat); mk(glow, lightMat); mk(lamp, lampMat);
  g.position.set(C.x, 0, C.z);
  // floors/walls were registered in world coords; geometry is local to C, so the group sits at C
  g.add(halo(7.4, FY + 2.0, 0, 5, '255,200,120')); g.add(halo(-4.9, RY + 1.4, -2.9, 4, '255,200,120')); g.add(halo(-4.95, FY + 0.95, -1.4, 3.2, '255,205,130')); g.add(halo(-1, FY + 1.5, 0, 6, '255,190,110'));
  W3D.root.add(g); W3D.houseboat.group = g; W3D.houseboat.tris = ext.tris + inn.tris + glass.tris + glow.tris + lamp.tris;
  buildSwitch();
}
function buildSwitch() { const sc = document.querySelector('a-scene'); if (!sc || document.getElementById('hb-switch')) return;
  const e = document.createElement('a-entity'); e.id = 'hb-switch'; e.setAttribute('position', (C.x - 5.285) + ' ' + (FY + 1.3) + ' ' + (C.z - 2.2)); e.setAttribute('rotation', '0 90 0');
  const plate = document.createElement('a-plane'); plate.className = 'btn'; plate.setAttribute('width', 0.2); plate.setAttribute('height', 0.3); plate.setAttribute('material', 'shader:flat;color:#f4f0e6'); e.appendChild(plate);
  const rk = document.createElement('a-box'); rk.id = 'hb-rocker'; rk.setAttribute('width', 0.07); rk.setAttribute('height', 0.12); rk.setAttribute('depth', 0.03); rk.setAttribute('position', '0 0 0.015'); plate.appendChild(rk);
  const lb = document.createElement('a-text'); lb.id = 'hb-label'; lb.setAttribute('align', 'center'); lb.setAttribute('width', 1.1); lb.setAttribute('position', '0 0.25 0.005'); e.appendChild(lb);
  const hint = document.createElement('a-text'); hint.setAttribute('value', 'Bedroom lights - click'); hint.setAttribute('align', 'center'); hint.setAttribute('color', '#333'); hint.setAttribute('width', 0.7); hint.setAttribute('position', '0 -0.21 0.005'); e.appendChild(hint);
  plate.addEventListener('click', () => setLights(!lightsOn)); sc.appendChild(e); paintSwitch(); }
function paintSwitch() { const rk = document.getElementById('hb-rocker'), lb = document.getElementById('hb-label'); if (!rk || !lb) return;
  rk.setAttribute('material', 'shader:flat;color:' + (lightsOn ? '#2ecc71' : '#c62828')); rk.setAttribute('rotation', (lightsOn ? -18 : 18) + ' 0 0');
  lb.setAttribute('value', lightsOn ? 'LIGHTS ON' : 'LIGHTS OFF'); lb.setAttribute('color', lightsOn ? '#1e9e3e' : '#c62828'); }
function setLights(on) { lightsOn = !!on; try { localStorage.setItem('jfvr_hb_lights', lightsOn ? 'on' : 'off'); } catch (e) {} lastN = -1; paintSwitch();
  if (window.JFVR && JFVR.hud) JFVR.hud('Houseboat lights ' + (lightsOn ? 'on' : 'off')); }
W3D.houseboat.setLights = setLights; W3D.houseboat.lights = () => lightsOn;
const dayG = new THREE.Color(0x9fbac4), nightG = new THREE.Color(0xffc870), dayL = new THREE.Color(0xe8dcc0), nightL = new THREE.Color(0xffd890), darkG = new THREE.Color(0x1c2328), offL = new THREE.Color(0x4a4640);
let lastN = -1;
AFRAME.registerSystem('w3d-houseboat', { tick: function () {
  if (!built) { if (window.W3D_READY || (W3D.root && W3D.water)) build(); return; }
  const g = W3D.houseboat.group; if (!g || !W3D.root.visible || !W3D.active) return; if (!document.getElementById('hb-switch')) buildSwitch();
  const nt = window.JFVR_NIGHT, n = nt && nt.n > 0 ? nt.n : 0; if (Math.abs(n - lastN) < 0.004) return; lastN = n;
  lightMat.color.copy(dayL).lerp(nightL, n);   // outside lanterns: unchanged by the switch
  if (lightsOn) { glassMat.color.copy(dayG).lerp(nightG, n); lampMat.color.copy(dayL).lerp(nightL, n); intMat.emissive.setRGB(0.34 * n, 0.2 * n, 0.08 * n); intMat.color.setRGB(1, 1, 1); }
  else { const k = 1 - 0.85 * n; glassMat.color.copy(dayG).lerp(darkG, n); lampMat.color.copy(offL); intMat.emissive.setRGB(0, 0, 0); intMat.color.setRGB(k, k, k); }
  halos.forEach((h, i) => { const room = i >= 2, on = !room || lightsOn; h.material.opacity = on ? n * 0.85 : 0; h.visible = on && n > 0.05; }); } });
(function addSpot() { if (!W3D.spots) return setTimeout(addSpot, 50);
  W3D.spots.houseboat = () => { build(); if (window.JFVR && JFVR.fly) { JFVR.fly = false; const l = document.querySelector('#flylabel'); if (l) l.setAttribute('value', 'Fly: OFF'); }
    W3D.teleportTo(C.x - 1.9, FY, C.z - 0.3, 90); JFVR.hud && JFVR.hud('Houseboat on Fowling Pond - the bed is ahead of you'); }; })();
})();
