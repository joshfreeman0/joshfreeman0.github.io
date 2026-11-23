/* Fowling Pond - Wampum World Showcase gallery (public), a wing under the forecourt next to the banking-hall vault.
   Reached by the "LIFT - Wampum World Showcase" pad in the banking hall, or "Wampum World showcase" in the menus.
   Products/texts/prices/links come from w3d/showcase/showcase.json (images are 512 px JPEG). Concept display; the shop is wampumworld.com. */
(function () {
const BASE = '/vr/w3d/showcase/', R = {x0: 880, x1: 924.5, z0: -394, z1: -366, y: 24, top: 33.6, zc: -380};
let L, M, root, G = null, items = null, loaded = false, frames = 0, gen = 0;
const SP = 2.95, SPINE = {x0: 884, x1: 913.5, z: -380, t: 0.5};

const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const ctex = c => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
function wrap(g, text, maxW, maxLines) {
  const out = []; let line = '';
  for (const w of text.split(' ')) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t; }
  out.push(line); if (out.length > maxLines) { out.length = maxLines; out[maxLines - 1] = out[maxLines - 1].replace(/\s*\S*$/, '') + '\u2026'; } return out;
}
const firstSentence = s => { const m = s.match(/^.*?\.(\s|$)/); return (m ? m[0] : s).trim(); };
const shortUrl = u => u.replace(/^https?:\/\/(www\.)?/, '');

function plaqueCanvas(it) {
  const W = 768, H = 288, c = cv(W, H), g = c.getContext('2d');
  g.fillStyle = '#f1e5c8'; g.fillRect(0, 0, W, H); g.strokeStyle = '#b8902c'; g.lineWidth = 8; g.strokeRect(5, 5, W - 10, H - 10); g.lineWidth = 2; g.strokeRect(17, 17, W - 34, H - 34);
  g.textBaseline = 'alphabetic'; g.fillStyle = '#2a1d08'; g.font = 'bold 40px Georgia, serif';
  const nm = wrap(g, it.title, W - 70, 2); nm.forEach((l, i) => g.fillText(l, 36, 62 + i * 44));
  let y = 62 + (nm.length - 1) * 44 + 36;
  g.font = '600 27px Georgia, serif'; g.fillStyle = '#8a6416'; g.fillText((it.category || '').toUpperCase(), 36, y);
  if (it.price) { g.textAlign = 'right'; g.font = 'bold 34px Georgia, serif'; g.fillStyle = '#6b1f16'; g.fillText(it.price, W - 36, y + 2); g.textAlign = 'left'; }
  g.fillStyle = '#3b2c14'; g.font = '26px Georgia, serif'; y += 34;
  wrap(g, firstSentence(it.description || ''), W - 72, 2).forEach((l, i) => g.fillText(l, 36, y + i * 30));
  if (it.url) { g.fillStyle = '#1f4f8a'; g.font = 'bold 21px system-ui, sans-serif'; g.fillText(shortUrl(it.url), 36, H - 30); }
  return c;
}
function signCanvas(title, sub, W, H) {
  const c = cv(W, H), g = c.getContext('2d'); g.fillStyle = '#1b1408'; g.fillRect(0, 0, W, H); g.strokeStyle = '#d4af37'; g.lineWidth = 10; g.strokeRect(8, 8, W - 16, H - 16); g.lineWidth = 2; g.strokeRect(26, 26, W - 52, H - 52);
  g.textAlign = 'center'; g.fillStyle = '#ffd700'; g.font = 'bold ' + Math.round(H * 0.36) + 'px Georgia, serif'; g.fillText(title, W / 2, H * 0.52);
  g.fillStyle = '#e8d9a8'; g.font = Math.round(H * 0.14) + 'px Georgia, serif'; g.fillText(sub, W / 2, H * 0.78); return c;
}

/* ---------- materials (self-lit so no extra scene lights are needed) ---------- */
function mats() {
  const tl = new THREE.TextureLoader(), t = tl.load('/vr/w3d/tex/ashlar_col.jpg?v=1'); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  const stone = new THREE.MeshStandardMaterial({map: t, emissiveMap: t, emissive: 0xffe6b8, emissiveIntensity: 0.22, roughness: 0.9, color: 0xb9a57e});
  const gold = new THREE.MeshStandardMaterial({color: 0xe0b23c, emissive: 0x6a4a10, emissiveIntensity: 0.45, metalness: 0.5, roughness: 0.35});
  const floor = new THREE.MeshStandardMaterial({color: 0x8a7556, emissive: 0x6b563a, emissiveIntensity: 0.35, roughness: 0.6});
  return {stone, gold, floor};
}
function wallBox(w, h, d, x, y, z, m, uvT) {
  const geo = new THREE.BoxGeometry(w, h, d), uv = geo.attributes.uv, sz = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * sz[f][0] / (uvT || 4), uv.getY(i) * sz[f][1] / (uvT || 4)); }
  const me = new THREE.Mesh(geo, m); me.position.set(x, y + h / 2, z); G.add(me);
  L.walls.push({x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2, y0: y, y1: y + h}); return me;
}

/* ---------- build ---------- */
const FRAME_GEO = new THREE.BoxGeometry(1.7, 1.7, 0.08), IMG_GEO = new THREE.PlaneGeometry(1.5, 1.5), PLQ_GEO = new THREE.PlaneGeometry(2.6, 0.975), PLQ_BACK = new THREE.BoxGeometry(2.7, 1.075, 0.05);
const slots = [];   // {mesh, item} so images/labels can be filled in when the player first enters
function slot(x, z, ry, nx, nz, m) {
  const y = R.y, g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; G.add(g);
  const fr = new THREE.Mesh(FRAME_GEO, m.gold); fr.position.set(0, y + 2.75, 0.04); g.add(fr);
  const img = new THREE.Mesh(IMG_GEO, new THREE.MeshBasicMaterial({color: 0xd9ccb0, toneMapped: false})); img.position.set(0, y + 2.75, 0.09); g.add(img);
  const pb = new THREE.Mesh(PLQ_BACK, m.gold); pb.position.set(0, y + 1.32, 0.025); g.add(pb);
  const pl = new THREE.Mesh(PLQ_GEO, new THREE.MeshBasicMaterial({color: 0xf1e5c8, toneMapped: false})); pl.position.set(0, y + 1.32, 0.06); g.add(pl);
  slots.push({img, pl});
}
function buildShell(m) {
  const {x0, x1, z0, z1, y, top} = R, w = x1 - x0, d = z1 - z0, zc = R.zc, xc = (x0 + x1) / 2, h = top - y, t = 0.6;
  L.floors.push({x0: x0 - 0.5, x1: x1 + 0.5, z0: z0 - 0.5, z1: z1 + 0.5, y: y, under: true});
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m.floor); fl.rotation.x = -Math.PI / 2; fl.position.set(xc, y + 0.01, zc); G.add(fl);
  const ce = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m.stone); ce.rotation.x = Math.PI / 2; ce.position.set(xc, top - 0.02, zc); G.add(ce);
  wallBox(w + 2 * t, h, t, xc, y, z0 - t / 2, m.stone); wallBox(w + 2 * t, h, t, xc, y, z1 + t / 2, m.stone);
  wallBox(t, h, d, x0 - t / 2, y, zc, m.stone); wallBox(t, h, d, x1 + t / 2, y, zc, m.stone);
  wallBox(SPINE.x1 - SPINE.x0, 6.2, SPINE.t, (SPINE.x0 + SPINE.x1) / 2, y, SPINE.z, m.stone);
  // gold cornice and skirting
  const gb = (bw, bh, bd, bx, by, bz) => { const me = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), m.gold); me.position.set(bx, by, bz); G.add(me); };
  for (const [zz, s] of [[z0, 1], [z1, -1]]) { gb(w, 0.35, 0.12, xc, top - 0.6, zz + s * 0.06); gb(w, 0.15, 0.1, xc, y + 0.12, zz + s * 0.05); }
  gb(0.12, 0.35, d, x0 + 0.06, top - 0.6, zc); gb(0.1, 0.15, d, x0 + 0.05, y + 0.12, zc);
  gb(SPINE.x1 - SPINE.x0, 0.2, 0.7, (SPINE.x0 + SPINE.x1) / 2, y + 6.2, SPINE.z);
  // title wall (west) and intro sign (east, above the lift)
  const sg = (c, sw, sh, sx, sy, sz, ry) => { const me = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), new THREE.MeshBasicMaterial({map: ctex(c), toneMapped: false})); me.position.set(sx, sy, sz); me.rotation.y = ry; G.add(me); };
  sg(signCanvas('WAMPUM WORLD SHOWCASE', 'Genuine quahog shell wampum jewelry \u00b7 wampumworld.com', 1536, 320), 11, 2.3, x0 + 0.08, y + 6.2, zc, Math.PI / 2);
  sg(signCanvas('Wampum World Showcase', 'Back to the banking hall: lift pad \u2192', 1024, 256), 5, 1.25, x1 - 0.08, y + 4.9, zc, -Math.PI / 2);
}
function buildGallery(rootIn) {
  L = W3D.lib; M = W3D.M; root = rootIn;
  G = new THREE.Group(); G.name = 'wampum-showcase'; G.visible = false; root.add(G);
  const m = mats(); buildShell(m);
  const N = 10, pitch = (R.x1 - R.x0) / N;
  for (let i = 0; i < N; i++) { const x = R.x0 + (i + 0.5) * pitch;
    slot(x, R.z0 + 0.04, 0, 0, 1, m);                        // north wall, faces south (+z)
    slot(x, R.z1 - 0.04, Math.PI, 0, -1, m); }               // south wall, faces north (-z)
  for (let i = 0; i < N; i++) { const x = SPINE.x0 + (i + 0.5) * SP;
    slot(x, SPINE.z - SPINE.t / 2 - 0.0, Math.PI, 0, -1, m); // spine north side, faces north (-z)
    slot(x, SPINE.z + SPINE.t / 2 + 0.0, 0, 0, 1, m); }      // spine south side, faces south (+z)
  W3D.showcaseSlots = slots.length;
  // lifts (made here so index.html needs no extra markup)
  const sc = document.querySelector('a-scene'), mk = (x, y, z, label, ry, fn) => { const e = document.createElement('a-entity'); e.setAttribute('position', x + ' ' + y + ' ' + z);
    e.innerHTML = '<a-circle class="btn" radius="1.1" rotation="-90 0 0" material="shader:flat;color:#FFD700;opacity:0.85;transparent:true"></a-circle><a-text value="' + label + '" align="center" position="0 1.9 0" rotation="0 ' + ry + ' 0" width="5" color="#FFD700"></a-text>';
    e.querySelector('.btn').addEventListener('click', fn); sc.appendChild(e); return e; };
  mk(939, (L.HQ.y + 0.33).toFixed(2), -380, 'LIFT - Wampum World Showcase (click)', -90, () => { W3D.spots.showcase(); JFVR.hud && JFVR.hud('Wampum World Showcase'); });
  mk(R.x1 - 3.5, R.y + 0.03, R.zc, 'LIFT - banking hall (click)', 90, () => { W3D.teleportTo(941.5, L.HQ.y + 0.3, -373.5, -90); JFVR.hud && JFVR.hud('Banking hall'); });
  sc.setAttribute('showcase-tick', '');
}
function load() {
  if (loaded) return; loaded = true;
  const my = gen;
  fetch(BASE + 'showcase.json?v=1').then(r => r.json()).then(j => {
    items = j.items; W3D.showcaseItems = items.length;
    items.slice(0, slots.length).forEach((it, i) => {
      if (my !== gen) return; const s = slots[i]; s.pl.material.map = ctex(plaqueCanvas(it)); s.pl.material.color.set(0xffffff); s.pl.material.needsUpdate = true;
      new THREE.TextureLoader().load(BASE + it.image + '?v=1', t => { if (my !== gen) { t.dispose(); return; } t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = W3D.lite ? 4 : 8; s.img.material.map = t; s.img.material.color.set(0xffffff); s.img.material.needsUpdate = true; });
    });
  }).catch(e => { loaded = false; console.warn('showcase load failed', e); });
}
/* Lite tier (phones): free the 40 photos + plaques from GPU and memory when you leave the gallery; they reload when you come back. */
function unload() {
  if (!loaded) return; loaded = false;
  for (const sl of slots) for (const m of [sl.img.material, sl.pl.material]) if (m.map) { m.map.dispose(); m.map = null; m.color.set(m === sl.img.material ? 0xd9ccb0 : 0xf1e5c8); m.needsUpdate = true; }
  gen++;
}
W3D.showcaseUnload = unload;
const inside = p => p.y < 33.5 && p.x > R.x0 - 2 && p.x < R.x1 + 2 && p.z > R.z0 - 2 && p.z < R.z1 + 2;
AFRAME.registerComponent('showcase-tick', { tick: function () {
  if (!W3D.active || !G || ++frames % 3) return;
  const cam = W3D._cam || (W3D._cam = document.querySelector('[camera]')); if (!cam) return;
  const ins = inside(cam.object3D.getWorldPosition(W3D._sv || (W3D._sv = new THREE.Vector3()))); if (ins) load(); if (G.visible !== ins) { G.visible = ins; if (!ins && W3D.lite) unload(); }
} });
const prev = W3D.buildBankPlus;
W3D.buildBankPlus = function (r) { if (prev) prev(r); try { buildGallery(r); } catch (e) { console.warn('showcase build failed', e); } };
const addSpots = () => { if (!W3D.spots) return setTimeout(addSpots, 50); W3D.spots.showcase = () => { load(); if (G) G.visible = true; W3D.teleportTo(R.x1 - 5.5, R.y, R.zc, 90); }; };
addSpots();
})();
