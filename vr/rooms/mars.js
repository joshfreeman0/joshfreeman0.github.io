/* Mars room (T-2, Nov 27 2026): Red Planet Lounge mounted INSIDE the Fowling Pond page by FP_ROOMS (fprooms.js, contract vr/ROOMS.md),
   so on Quest the rocket lands you on Mars with no page change and the same XR session.
   RPL is Me's code, loaded live from https://redplanetlounge.pages.dev/rpl-module.js (mountRPL / unmountRPL, docs README-mount.md);
   this file is only the Fowling Pond side of the hand-shake and never changes anything in RPL.
   - RPL drives the rig itself (walk, snap turn, fly, its own laser and wrist menu), so FP_ROOMS skips its spawn teleport (ownRig) and
     this adapter pauses Fowling Pond's controls while mounted: w3d-physics / w3d-keys on #rig, both laser-controls entities (snap-turn,
     w3d-teleport, thumbstick-move, menu-toggle, jf-pointer and their raycasters) and the desktop cursor; the VR menu bar is closed.
   - RPL holds rootEl at identity (absolute 1 m coordinates, pad about (-24, 0, 146)); the home world and Real Earth tiles are hidden by
     FP_ROOMS (W3D.spaceView, no new root.json) and RPL hides the other top-level scene children (hideHost) and restores them.
   - rpl-exit-request (ARES-7 shuttle / Return to Earth) -> FP_ROOMS.leave({arrive: true}): rocket ride home onto the launch pad.
   - The rig's position / rotation are saved here and put back on unmount (RPL also restores them).
   If the module can't load (offline, RPL down), mount throws, FP_ROOMS rolls back and the rocket uses the old /vr/mars/ page. */
const RPL_URL = 'https://redplanetlounge.pages.dev/rpl-module.js';
const MOUNT_TIMEOUT = 60000;
let mod = null, host = null, exitH = null, btn2d = null;
// RPL (deploy cb078b33) uses its own LoadingManager and rpl- prefixed DOM ids, and shows its own touch controls when mounted on
// touch devices (hidden in XR), so no loader / id / touch workarounds are needed here.

function pauseHost(sceneEl) {
  const rig = document.querySelector('#rig'), S = {rig, comps: [], els: [], bar: null, rigP: null, rigQ: null};
  if (rig) { S.rigP = rig.object3D.position.clone(); S.rigQ = rig.object3D.quaternion.clone();
    for (const c of ['w3d-physics', 'w3d-keys']) { const k = rig.components[c]; if (k && k.isPlaying) { k.pause(); S.comps.push(k); } } }
  // close the Fowling Pond VR menu if it is open (menu-toggle is paused below, so it stays closed)
  const bar = document.getElementById('vrbar'), mt = document.querySelector('[menu-toggle]');
  if (bar && bar.object3D.visible && mt && mt.components['menu-toggle']) try { mt.components['menu-toggle'].toggle(); } catch (e) {}
  if (bar) { S.bar = bar.object3D.visible; bar.object3D.visible = false; }
  // FP's controller entities (lasers, teleport, snap turn, stick walking, menu toggle) and the desktop mouse cursor: paused + hidden
  document.querySelectorAll('[laser-controls], #rig [cursor]').forEach(el => { S.els.push([el, el.object3D.visible, el.isPlaying]); if (el.isPlaying) el.pause(); el.object3D.visible = false; });
  if (window.JFVR) { S.fly = JFVR.fly; JFVR.fly = false; }
  // FP's phone joystick / fly buttons (locomotion.js) would sit on top of RPL's own touch controls: hide them while on Mars
  S.dom = [...document.querySelectorAll('#tjoy, #tfly')].map(el => [el, el.style.display]); S.dom.forEach(([el]) => { el.style.display = 'none'; });
  return S;
}
function restoreHost(S) {
  if (!S) return;
  if (S.rig && S.rigP) { S.rig.object3D.position.copy(S.rigP); S.rig.object3D.quaternion.copy(S.rigQ); const ph = S.rig.components['w3d-physics']; if (ph && ph.prev) ph.prev.copy(S.rigP); }
  S.comps.forEach(k => { try { k.play(); } catch (e) {} });
  S.els.forEach(([el, vis, playing]) => { el.object3D.visible = vis; if (playing && !el.isPlaying) try { el.play(); } catch (e) {} });
  (S.dom || []).forEach(([el, d]) => { el.style.display = d; });
  const bar = document.getElementById('vrbar'); if (bar && S.bar != null) bar.object3D.visible = false;   // menu comes back closed
}
function addBackButton(ctx) {   // 2D (desktop / phone): RPL's own 2D menus are not shown when mounted, so offer a plain way home
  btn2d = document.createElement('button'); btn2d.id = 'mars-back2d'; btn2d.type = 'button'; btn2d.textContent = 'Return to Earth';
  btn2d.style.cssText = 'position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:30;padding:10px 16px;border:0;border-radius:10px;background:#ff9a6b;color:#111;font:600 15px system-ui,sans-serif';
  btn2d.addEventListener('click', () => ctx.leave({arrive: true})); document.body.appendChild(btn2d);
  // phones: RPL's touch stick / Fly / Jump sit along the bottom (body.rpl-touch), so FP's bottom bar (#ui) steps aside and the button goes up top
  if (document.body.classList.contains('rpl-touch')) { btn2d.style.bottom = 'auto'; btn2d.style.top = '12px';
    const tb = document.getElementById('ui'); if (tb && host) { host.dom.push([tb, tb.style.display]); tb.style.display = 'none'; } }
}

const ROOM = {
  ownRig: true,                    // RPL places and moves the rig; FP_ROOMS must not teleport it to a spawn point
  env: {background: 0x000000, fog: null, far: 30000},
  async mount(sceneEl, rootEl, ctx) {
    if (!mod) mod = await import(RPL_URL);
    if (mod.isMounted && mod.isMounted()) mod.unmountRPL();
    host = pauseHost(sceneEl);
    exitH = () => setTimeout(() => { if (window.FP_ROOMS && FP_ROOMS.current === 'mars' && !FP_ROOMS.busy) ctx.leave({arrive: true}); }, 0);
    rootEl.addEventListener('rpl-exit-request', exitH);
    const spot = (ctx.opts && ctx.opts.spot) || 'pad';
    let to = 0;
    try {
      const h = await Promise.race([
        mod.mountRPL(sceneEl, rootEl, {spot, rig: document.querySelector('#rig') || undefined, hideHost: true}),
        new Promise((_, rej) => { to = setTimeout(() => rej(new Error('Red Planet Lounge took too long to load')), MOUNT_TIMEOUT); })]);
      clearTimeout(to);
      window.FP_MARS = {rpl: h.rpl, ready: h.ready, requestExit: h.requestExit, leave: () => ctx.leave({arrive: true})};
      h.ready.then(() => console.log('rooms: mars ready')).catch(() => {});
    } catch (e) {
      clearTimeout(to); try { mod.unmountRPL(); } catch (e2) {}
      rootEl.removeEventListener('rpl-exit-request', exitH); exitH = null; restoreHost(host); host = null; throw e;
    }
    addBackButton(ctx);
  },
  unmount() {
    let stats = null; try { stats = mod && mod.unmountRPL(); } catch (e) { console.warn('rooms: unmountRPL', e); }
    const root = document.getElementById('fproom-mars'); if (root && exitH) root.removeEventListener('rpl-exit-request', exitH); exitH = null;
    if (btn2d) { btn2d.remove(); btn2d = null; }
    restoreHost(host); host = null; delete window.FP_MARS;
    if (stats) console.log('rooms: mars unmounted ' + JSON.stringify(stats));
  }
};
export default ROOM;
if (window.FP_ROOMS && window.FP_ROOMS.register) window.FP_ROOMS.register(window.FP_ROOMS.pending || 'mars', ROOM);
