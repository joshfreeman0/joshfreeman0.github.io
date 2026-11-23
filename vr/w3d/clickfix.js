/* Desktop mouse clicks (bug batch, Nov 23): A-Frame's mouse cursor only re-casts its ray on the raycaster's tick, so on a slow frame a
   click lands on whatever was under the pointer one or more frames ago (often nothing) and is dropped - Enter worked, clicks didn't.
   Here, in the capture phase of every mousedown / mouseup (before the cursor's own listeners run), the ray is re-aimed at the real
   pointer position and intersections are checked right away, so the cursor always sees the button under the pointer.
   Does nothing in immersive XR (lasers have their own raycasters). */
(function () {
  function sync(evt) {
    const sc = document.querySelector('a-scene'); if (!sc || !sc.canvas || (sc.renderer && sc.renderer.xr && sc.renderer.xr.isPresenting)) return;
    if (evt.target !== sc.canvas) return;
    const ce = document.querySelector('[cursor]'), cur = ce && ce.components.cursor, rc = ce && ce.components.raycaster;
    if (!cur || !rc || cur.data.rayOrigin !== 'mouse') return;
    try { cur.onMouseMove(evt); if (rc.dirty || !rc.objects || !rc.objects.length) rc.refreshObjects(); rc.checkIntersections(); } catch (e) { /* never block the click */ }
  }
  window.addEventListener('mousedown', sync, true); window.addEventListener('mouseup', sync, true);
})();
