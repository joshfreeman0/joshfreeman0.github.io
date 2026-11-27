# FP_ROOMS: guest worlds inside the Fowling Pond page

Quest Browser drops out of VR when a page changes to another website, and even a same-site page change has to start drawing within about 5 seconds. FP_ROOMS avoids both by never changing page. A guest world (Red Planet Lounge, later the Tesseract room) is an ES module that Fowling Pond imports and builds inside its own `<a-scene>`, using the same renderer and the same XR session.

Loader: `vr/w3d/fprooms.js` (`window.FP_ROOMS`). Test room: `vr/rooms/stub.js`.

## What Fowling Pond does for you

`FP_ROOMS.enter(name)`:

1. Fades to black, hides the home world (`W3D.root`) and Real Earth (`W3D.spaceView = true`), unloads any saucer city, and trims Real Earth's tile cache to free memory. It never loads a new `root.json`.
2. Imports your module (if not registered yet) and waits for `register()` (20 s timeout).
3. Creates `<a-entity id="fproom-NAME">` at `FP_ROOMS.ROOM_ORIGIN` (`0 0 400000`, far from everything at home) and waits for it to load.
4. Applies `env`: background colour, fog, camera far plane.
5. Routes walking physics to your `ground` / `blocked` functions.
6. Calls `mount(sceneEl, rootEl, ctx)` (it may return a Promise), teleports the rig to `spawn`, and fades in.

If anything throws, it rolls back and returns `false`. The rocket then uses the old `/vr/mars/` hand-off.

`FP_ROOMS.leave({arrive: true})`:

1. Calls your `unmount()`, removes `rootEl`, and disposes every geometry, material and texture under it.
2. Restores sky, fog, physics, fly limits and the home world.
3. With `arrive: true`, plays the rocket ride home (deep space, Moon, Earth, landing on the Bridgewater pad). Without it, you land on the pad directly, or at `{spot: 'name'}`.

## The contract

```js
// your-room.js  (ES module, loaded with import(url) from joshfreeman.org/vr/)
const ROOM = {
  env:   { background: 0xc77a52, fog: [0xc77a52, 40, 400], far: 20000 },   // all optional; fog: null = no fog
  spawn: { x: 0, y: 0, z: 6, yaw: 0 },                                     // room-local metres, yaw in degrees
  ground(x, z, y) { return 0; },          // optional: floor height under (x, z), room-local (default 0)
  blocked(x, z, y) { return false; },     // optional: true = a wall here (walking only)
  async mount(sceneEl, rootEl, ctx) { /* build everything under rootEl (rootEl.object3D for raw three.js) */ },
  async unmount() { /* stop your timers, audio, network; FP disposes rootEl's meshes */ }
};
window.FP_ROOMS.register(window.FP_ROOMS.pending || 'mars', ROOM);
```

`ctx` gives you:

- `THREE`, `AFRAME`
- `origin`: world position of rootEl
- `lite`: phone tier
- `quest`
- `opts`: `{via: 'rocket'}`
- `leave(opts)`: e.g. `ctx.leave({arrive: true})` for the Return to Earth shuttle
- `toast(msg)`
- `teleport(x, y, z, yaw)`: room-local

Rules for a guest module:

- **No own scene or renderer.** Don't create an `<a-scene>`, a `WebGLRenderer`, a canvas, or call `renderer.setAnimationLoop`. Per-frame work goes in an A-Frame component/system `tick` on something under `rootEl`, or one `sceneEl.addEventListener` you remove in `unmount()`.
- **Don't touch the XR session.** Never call `navigator.xr.requestSession`, `session.end()` or `exitVR`. Don't change `renderer.xr` settings or the reference space.
- **Leave the player alone.** Don't move or replace the camera or `#rig`; use `ctx.teleport`. Controllers: listen on `sceneEl` for `triggerdown` / `abuttondown` and so on, or give clickable meshes an A-Frame entity with class `btn` (the lasers raycast `.btn`).
- **Lights live under `rootEl`.** Your lights, sky dome and stars go under `rootEl`; home lights are hidden with the home world.
- **Loading:** assets load relative to `import.meta.url`, and must be CORS-readable (`Access-Control-Allow-Origin: *`) if served from another site.
- **Memory:** keep it to about 150 MB GPU on Quest 3S, much less on lite (iPhone 12).
- **Clean up everything in `unmount()`:** audio, WebRTC (Trystero) rooms, intervals, DOM you added.

## Red Planet Lounge (Me)

Me exports `mountRPL(sceneEl, rootEntity)` / `unmountRPL()` after the Sat Nov 28 reset, once the RPL wrist menu / XR-exit work is done. Until Me sends the exact entry point, FP depends on nothing inside RPL.

**To wire it up (B):**

1. Set `CATALOG.mars.module` in `fprooms.js` to the module URL. A tiny adapter file in `vr/rooms/mars.js` can import Me's module and call `register('mars', {mount: (s, r, c) => mountRPL(s, r, c), unmount: unmountRPL, env, spawn, ground, blocked})`.
2. Bump `?v=`. From then on the rocket lands you in Mars with no page change.
3. The `/vr/mars/` page stays as the fallback, and for anyone who opens it directly.

**What RPL's module needs (Me):**

- Build into the `rootEntity` given (three.js objects under `rootEntity.object3D`), with no renderer, scene or `VRButton`.
- Its own Return-to-Earth shuttle calls `ctx.leave({arrive: true})`, or `window.FP_ROOMS.leave({arrive: true})`, instead of `location.href`.
- Its Mars arrival ride (journey) starts in `mount()`, since `opts.via === 'rocket'`. The Earth half has already played.
- Ground and walls go through `ground()` / `blocked()` (FP walks the rig), or tell B if RPL needs its own player controller.
- The standalone redplanetlounge.pages.dev site keeps working unchanged.

**Test:** `https://joshfreeman.org/vr/?room_mars=/vr/rooms/YOURFILE.js` uses any `/vr/rooms/*.js` file as the Mars room (only that path pattern is accepted). `?room_mars=/vr/rooms/stub.js` is the stub.

## Tesseract room (built Nov 27 2026, T-21)

`vr/rooms/tesseract.js`, entered from the walk-in gateway in the Star Fleet base, the "Tesseract room" portal on the bank terrace, the Other worlds tab, `W3D.spots.tesseract`, or `https://joshfreeman.org/vr/?room=tesseract` (also `?spot=tesseract`). Gateways: `vr/w3d/tesseractgate.js`. Inside: Tesseract website bays (DIRDs via the DIA Papers reader, AAWSAP, UnLAB, Roswell/claims via the Tesseract reader), the propulsion lab corner, the multiverse map hub, and the USE Eagle exchange desk (1 Eagle = 10 Fowling Pond dollars, play-money calculator; no ledger writes). Doors home lead to the Star Fleet base or the bank terrace.

### Original plan

The Tesseract site, repo, branding and artwork stay exactly as they are. The room only reads the live public pages (https://tesseractprogram.pages.dev/), the way the in-world reader already does.

1. **Room `tesseract`** in `vr/rooms/tesseract.js`, our own module, in Fowling Pond style: a walk-in hall with a central exhibit. Reach it from Other worlds, and from the Star Fleet base door (`?spot=starfleet`).
2. **Content:** fetch the live pages' HTML at mount, extract headings, paragraphs and images, and show them on in-world panels (canvas text). Same approach as the reader, so it always matches the site, and nothing from it is copied into our repo. Images are shown as published, not edited.
3. **Sections:** one panel bay per site section (Star Fleet, programs, history). A "read more" button opens the in-world reader on that page.
4. **Later (Saturday or after):** the walk-in propulsion-science lab and multiverse plan (T-21) as further bays, built from the same live content.
5. **Size:** about half a day for B. No change on the Tesseract side.

## Memory note (Quest 3S)

While away, the home world is hidden but its meshes stay in GPU memory. Real Earth's tile cache is trimmed. If a big room (RPL) runs out of memory on Quest, the next step is to dispose the heaviest home layers (street-level houses, grass, cover-up planting) on `enter()` and rebuild them on `leave()`.
