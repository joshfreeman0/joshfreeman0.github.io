/* Fowling Pond live host: Lila (travelling, hands-free) plus family residents at the house
   (Astrid, Linnea, Oskar). Other girlfriends stay on staging. family:true with pick lila
   leaves the wife and kids at FP_HOME (terrace placeholder if the house is not ready).
   One "Tap to talk with Lila" overlay unlocks audio and the mic. ?companion=0 turns it off; ?pick= chooses a character. */
const QS = new URLSearchParams(location.search);
const MOD = new URL('./companion.js?v=1.2.5l', import.meta.url).href;
function playerId() { try { let id = localStorage.getItem('fpc.player'); if (!id) { id = 'p-' + Math.random().toString(36).slice(2, 10); localStorage.setItem('fpc.player', id); } return id; } catch (e) { return 'guest'; } }
async function go() {
  if (QS.get('companion') === '0') return;
  const sc = document.querySelector('a-scene');
  if (!sc) return;
  const root = document.createElement('a-entity'); root.id = 'fp-companions'; sc.appendChild(root);
  await new Promise(r => root.hasLoaded ? r() : root.addEventListener('loaded', r, {once: true}));
  const {mount} = await import(MOD);
  const HQ = {x: 920, y: 34, z: -380};
  const camY = () => { const c = sc.camera; return c ? c.getWorldPosition(new THREE.Vector3()).y : HQ.y + 1.6; };
  window.FPC = await mount(sc, root, {
    playerId: playerId(), world: 'earth',
    roster: new URL('./roster.json', import.meta.url).href,
    pick: QS.get('pick') || 'lila',
    family: true, follow: true,
    handsFree: true, tapToStart: true,
    quest: /OculusBrowser|Quest/i.test(navigator.userAgent),
    groundAt: (x, z) => (window.W3D && W3D.groundAt && !W3D.spaceView) ? W3D.groundAt(x, z, camY() + 0.4) : NaN,
    onEvent: e => { if (e.type === 'error') console.warn('[fpc]', e.error); }
  });
}
(function wait(n) { if (window.W3D_READY && document.querySelector('a-scene') && document.querySelector('a-scene').hasLoaded) go().catch(e => console.warn('[fpc] mount failed', e)); else if (n < 3000) setTimeout(() => wait(n + 1), 200); })(0);
