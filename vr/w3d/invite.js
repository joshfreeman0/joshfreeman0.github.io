/* Invite (Josh): share a link to Fowling Pond so people can join you.
   - Phones: the system share sheet (Web Share API). Desktop: copies the link and shows a toast.
   - Headset (WebXR): a big panel with the short URL joshfreeman.org/vr and a QR code drawn on the device (vendored MIT
     qrcode-generator, no external service), so someone nearby can scan it with a phone.
   - 'Invite here' adds ?spot=<id> for the named spot you are nearest to (pond, temple, bank, vesta, saucer, launchpad);
     index.html lands new arrivals there. */
(function () {
'use strict';
const W3D = window.W3D = window.W3D || {};
const BASE = 'https://joshfreeman.org/vr/', SHORT = 'joshfreeman.org/vr';
const SPOTS = [   // invite-here anchors: [id, x, z, radius m]
  ['pond', 447, -394, 420], ['temple', 866, -380, 30], ['bank', 935, -380, 60], ['vesta', 985, -318, 45], ['saucer', 1000, -447, 40], ['launchpad', 9617, -2977, 600]];
const camPos = () => { const c = document.querySelector('[camera]'); return c ? c.object3D.getWorldPosition(new THREE.Vector3()) : null; };
function hereId() {
  const p = camPos(); if (!p || (W3D.active === false)) return null; let best = null, bd = 1e9;
  for (const [id, x, z, r] of SPOTS) { const d = Math.hypot(p.x - x, p.z - z); if (d < r && d < bd) { bd = d; best = id; } }
  return best;
}
function link(here) { const id = here ? hereId() : null; return {url: BASE + (id ? '?spot=' + id : ''), short: SHORT + (id ? '/?spot=' + id : ''), id}; }
function toast(msg, ms) {
  let t = document.getElementById('jftoast');
  if (!t) { t = document.createElement('div'); t.id = 'jftoast'; t.style.cssText = 'position:fixed;left:50%;top:16px;transform:translateX(-50%);z-index:60;background:rgba(10,12,18,0.88);color:#ffe9a8;font:600 15px system-ui,sans-serif;padding:10px 16px;border-radius:10px;max-width:90vw;text-align:center;pointer-events:none;transition:opacity .3s'; document.body.appendChild(t); }
  t.textContent = msg; t.style.opacity = '1'; clearTimeout(t._h); t._h = setTimeout(() => { t.style.opacity = '0'; }, ms || 2600);
  if (window.JFVR && JFVR.hud) JFVR.hud(msg);
}
W3D.toast = toast;
const inXR = () => { const sc = document.querySelector('a-scene'); return !!(sc && sc.renderer && sc.renderer.xr && sc.renderer.xr.isPresenting); };
const touch = () => (navigator.maxTouchPoints || 0) > 0 && matchMedia && matchMedia('(pointer: coarse)').matches;
async function copy(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (e) {}
  try { const ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;top:-100px'; document.body.appendChild(ta); ta.select(); const ok = document.execCommand('copy'); ta.remove(); return ok; } catch (e) { return false; }
}
async function invite(here) {
  const L = link(here);
  if (inXR()) return showPanel(here);
  if (navigator.share && touch()) { try { await navigator.share({title: 'Fowling Pond', text: 'Come and explore Fowling Pond with me (VR, phone or computer):', url: L.url}); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
  const ok = await copy(L.url);
  toast(ok ? 'Invite link copied: ' + L.short : 'Share this link: ' + L.url, ok ? 2600 : 8000);
}
W3D.invite = invite;
/* ---------- QR (lazy: the encoder loads the first time the panel opens) ---------- */
let qrLib = null;
function loadQR() { if (window.qrcode) return Promise.resolve(window.qrcode); if (qrLib) return qrLib;
  return (qrLib = new Promise((res, rej) => { const s = document.createElement('script'); s.src = '/vr/w3d/qrcode.min.js?v=1'; s.onload = () => res(window.qrcode); s.onerror = rej; document.head.appendChild(s); })); }
function qrCanvas(text) {
  const q = window.qrcode(0, 'M'); q.addData(text); q.make(); const n = q.getModuleCount(), px = 8, m = 4, S = (n + 2 * m) * px;
  const c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, S, S); g.fillStyle = '#000';
  for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (q.isDark(r, k)) g.fillRect((k + m) * px, (r + m) * px, px, px);
  return c;
}
W3D.qrCanvas = qrCanvas;
let panel = null, panelHere = false;
function textTex(lines) { const c = document.createElement('canvas'); c.width = 1024; c.height = 256; const g = c.getContext('2d'); g.fillStyle = '#ffffff'; g.fillRect(0, 0, 1024, 256); g.fillStyle = '#111'; g.textAlign = 'center';
  g.font = 'bold 76px Arial, sans-serif'; g.fillText(lines[0], 512, 100); g.font = '44px Arial, sans-serif'; g.fillStyle = '#444'; g.fillText(lines[1] || '', 512, 190); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
async function showPanel(here) {
  panelHere = !!here; await loadQR().catch(() => null); const L = link(panelHere), sc = document.querySelector('a-scene');
  if (!panel) { panel = document.createElement('a-entity'); panel.id = 'invite-panel'; sc.appendChild(panel); await new Promise(r => setTimeout(r, 30));
    const bg = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.9), new THREE.MeshBasicMaterial({color: 0xffffff, toneMapped: false})); bg.position.set(0, 0.2, -0.01); panel.object3D.add(bg);
    const mk = (t, x, y, w, fn) => { const b = document.createElement('a-plane'); b.setAttribute('class', 'btn'); b.setAttribute('width', w); b.setAttribute('height', 0.2); b.setAttribute('position', x + ' ' + y + ' 0.01'); b.setAttribute('material', 'shader:flat;color:#FFD700');
      const tx = document.createElement('a-text'); tx.setAttribute('value', t); tx.setAttribute('align', 'center'); tx.setAttribute('color', '#111'); tx.setAttribute('width', 1.7); b.appendChild(tx); b.addEventListener('click', fn); panel.appendChild(b); return tx; };
    panel.userData = {tog: mk('Invite here', -0.3, -0.62, 0.55, () => showPanel(!panelHere)), close: mk('Close', 0.33, -0.62, 0.5, hidePanel)};
    setTimeout(() => document.querySelectorAll('[raycaster]').forEach(r => r.components.raycaster && r.components.raycaster.refreshObjects()), 300); }
  const U = panel.userData; for (const k of ['qr', 'tx']) if (U[k]) { panel.object3D.remove(U[k]); U[k].geometry.dispose(); U[k].material.map && U[k].material.map.dispose(); U[k].material.dispose(); }
  if (window.qrcode) { const qt = new THREE.CanvasTexture(qrCanvas(L.url)); qt.magFilter = THREE.NearestFilter; qt.minFilter = THREE.NearestFilter; qt.generateMipmaps = false; qt.colorSpace = THREE.SRGBColorSpace;
    U.qr = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 1.05), new THREE.MeshBasicMaterial({map: qt, toneMapped: false})); U.qr.position.set(0, 0.47, 0); panel.object3D.add(U.qr); }
  U.tx = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.3), new THREE.MeshBasicMaterial({map: textTex([SHORT, L.id ? '?spot=' + L.id : 'Scan to join Fowling Pond']), toneMapped: false})); U.tx.position.set(0, -0.28, 0); panel.object3D.add(U.tx);
  U.tog.setAttribute('value', panelHere ? 'Whole world' : 'Invite here');
  panel.object3D.visible = true; if (window.JFVR && JFVR.placeInFront) JFVR.placeInFront(panel, 1.5, 0); else { const p = camPos(); if (p) panel.object3D.position.set(p.x, p.y, p.z - 1.5); }
  W3D.invitePanel = {url: L.url, id: L.id, visible: true};
}
function hidePanel() { if (!panel) return; panel.object3D.visible = false; panel.object3D.position.y = -1e4; if (W3D.invitePanel) W3D.invitePanel.visible = false; }
W3D.showInvitePanel = showPanel; W3D.hideInvitePanel = hidePanel;
/* ---------- buttons: menu (#ui), the People area (next to the room count, added by mp.js), VR menu bar ---------- */
function chooser(anchor) {
  let c = document.getElementById('invitechoose'); if (c) { c.remove(); return; }
  c = document.createElement('div'); c.id = 'invitechoose'; const r = anchor.getBoundingClientRect();
  c.style.cssText = 'position:fixed;z-index:70;display:flex;gap:6px;padding:6px;border-radius:10px;background:rgba(11,29,38,0.92);left:' + Math.max(6, r.left) + 'px;top:' + (r.bottom + 6) + 'px';
  for (const [t, h] of [['Whole world', false], ['This spot', true]]) { const x = document.createElement('button'); x.type = 'button'; x.textContent = t; x.style.cssText = 'background:#9ffcff;color:#111;font-weight:600;border:0;border-radius:8px;padding:7px 11px'; x.onclick = ev => { ev.stopPropagation(); c.remove(); invite(h); }; c.appendChild(x); }
  document.body.appendChild(c); setTimeout(() => document.addEventListener('click', function off() { const e = document.getElementById('invitechoose'); if (e) e.remove(); document.removeEventListener('click', off); }), 0);
}
function wire() {
  const tools = document.querySelector('#ui .tools');
  // one Invite button (bug batch: there were three - 'Invite', 'Invite here' and 'Invite people' - doing the same two jobs): it opens a small
  // chooser with 'Whole world' and 'This spot'
  if (tools && !document.getElementById('invitebtn')) { const b = document.createElement('button'); b.id = 'invitebtn'; b.type = 'button'; b.textContent = 'Invite'; b.style.cssText = 'background:#9ffcff;color:#111;font-weight:600'; b.onclick = ev => { ev.stopPropagation(); chooser(b); }; tools.appendChild(b); }
  document.querySelectorAll('[data-invite]').forEach(el => { if (el._inv) return; el._inv = 1; el.addEventListener('click', () => { const h = el.dataset.invite === 'here'; if (inXR() || el.tagName === 'A-PLANE') showPanel(h); else invite(h); }); });
  ['invitehere', 'invitepeople'].forEach(id => { const e = document.getElementById(id); if (e) e.remove(); });
}
wire(); let n = 0; const iv = setInterval(() => { wire(); if (++n > 40) clearInterval(iv); }, 1500);
})();
