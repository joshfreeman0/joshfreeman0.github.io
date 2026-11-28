/* Fowling Pond host for the shared companion module (staging). Mounts the companion under its own entity on the scene (not W3D.root),
   so she stays with you in guest rooms (FP_ROOMS) and after teleports. ?companion=0 turns it off; ?pick=<id> chooses a character. */
const QS = new URLSearchParams(location.search);
const MOD = new URL('../companion/companion.js?v=1.2.6', import.meta.url).href;
function playerId() { try { let id = localStorage.getItem('fpc.player'); if (!id) { id = 'p-' + Math.random().toString(36).slice(2, 10); localStorage.setItem('fpc.player', id); } return id; } catch (e) { return 'guest'; } }
async function go() {
  if (QS.get('companion') === '0') return;
  const sc = document.querySelector('a-scene');
  const root = document.createElement('a-entity'); root.id = 'fp-companions'; sc.appendChild(root);
  await new Promise(r => root.hasLoaded ? r() : root.addEventListener('loaded', r, {once: true}));
  const {mount} = await import(MOD);
  const HQ = {x: 920, y: 34, z: -380};
  const camY = () => { const c = sc.camera; return c ? c.getWorldPosition(new THREE.Vector3()).y : HQ.y + 1.6; };
  window.FPC = await mount(sc, root, {
    playerId: playerId(), world: 'earth', pick: QS.get('pick') || undefined,
    quest: /OculusBrowser|Quest/i.test(navigator.userAgent),
    spawn: {x: 842.6, y: HQ.y + 0.3, z: -379.0, yaw: 90},      // on the bank terrace, a few steps in front of the arrival spot
    groundAt: (x, z) => (window.W3D && W3D.groundAt && !W3D.spaceView) ? W3D.groundAt(x, z, camY() + 0.4) : NaN,
    onEvent: e => { if (e.type === 'error') console.warn('[fpc]', e.error); }
  });
}
(function wait(n) { if (window.W3D_READY && document.querySelector('a-scene') && document.querySelector('a-scene').hasLoaded) go().catch(e => console.warn('[fpc] mount failed', e)); else if (n < 3000) setTimeout(() => wait(n + 1), 200); })(0);
