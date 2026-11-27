# Shared AI companion module (Earth + Mars)

One ES module that puts a talking, realistic AI companion into any A-Frame (or plain three.js) world. Fowling Pond (Earth) and Red Planet Lounge (Mars) use the same module, roster and proxy, and conversation history is keyed by player + character, so the same companion remembers you in both worlds.

- Module: `https://joshfreeman.org/vr-staging/companion/companion.js` (staging; will move to `/vr/companion/` when B merges)
- Default roster: `https://joshfreeman.org/vr-staging/companion/roster.json`
- Demo page: `https://joshfreeman.org/vr-staging/companion/demo.html`
- Proxy: `https://fp-companion.tesseractprogram.workers.dev/chat` (Cloudflare Worker `fp-companion`, source `/workspace/fp-upgrade/worker`)
- GitHub Pages serves everything with `Access-Control-Allow-Origin: *`, so redplanetlounge.pages.dev can `import()` the module and load its GLBs.

## Embed (A-Frame host)

```html
<a-entity id="companions"></a-entity>
<script type="module">
  import {mount} from 'https://joshfreeman.org/vr-staging/companion/companion.js';
  const scene = document.querySelector('a-scene'), root = document.querySelector('#companions');
  const start = async () => {
    window.FPC = await mount(scene, root, {
      playerId: 'josh', world: 'mars',                      // 'earth' | 'mars'
      spawn: {x: 0, y: 0, z: -2, yaw: 180},                 // world metres, yaw in degrees
      groundAt: (x, z) => 0,                                // optional: floor height under (x, z)
      onEvent: e => console.log('companion', e.type, e) });
  };
  scene.hasLoaded ? start() : scene.addEventListener('loaded', start);
</script>
```

Inside an FP_ROOMS guest module, call `mount(sceneEl, rootEl, {...})` from your `mount()` and `unmount()` from yours. Fowling Pond itself mounts the companion on its own entity (not under W3D.root), so she follows you into rooms. Plain three.js host: pass `{THREE, GLTFLoader, camera, renderer}` in opts, add `rootEl` = any `THREE.Object3D`, and either let it run its own `requestAnimationFrame` (desktop only) or set `autoTick: false` and call `api.update(dtSeconds)` from your render loop (needed in WebXR).

## API

`mount(sceneEl, rootEl, opts) -> Promise<api>`; `unmount()`; `current()`; constants `DEFAULT_PROXY`, `WORLDS`, `localStore`.

opts | meaning
---|---
`playerId` | stable id for the player (history key). Default `guest`.
`playerName` | optional, told to the character.
`world` | `'earth'` or `'mars'`; `worldDesc` overrides the built-in description that goes into the system prompt.
`roster` | array of characters, `{characters: [...]}`, or a URL (relative URLs resolve against the module). Default `roster.json` next to the module.
`pick` | character id. Default: the player's last pick, else roster `default`.
`proxyUrl` | chat proxy. Default `DEFAULT_PROXY`.
`onEvent` | callback; `e.type` is `ready`, `pick`, `listening`, `heard`, `reply` (`text`, `model`, `cost`), `speaking`, `moved`, `error`.
`spawn` | `{x, y, z, yaw}` world position. `groundAt(x, z)` floor height. `follow` (default true) + `followDist` (14 m): a `canTravel` companion reappears beside you when you are far away (teleports, rooms, rocket).
`storage` | adapter `{get(key), set(key, value)}` (sync or async). Default `localStore` (localStorage). Swap in B's shared accounts backend later; keys are `fpc:v1:<playerId>:<characterId>` and `fpc:v1:<playerId>:pick`.
`passphrase` | optional; otherwise the player enters it once in the 2D panel (stored in localStorage `fpc.pass`), or `?fppass=...` in the URL.
`onNeedPass(handle)` | optional (v1.1). Called instead of the built-in subtitle when the passphrase is missing (`reason: 'missing'`) or rejected (`reason: 'wrong'`). `handle = {reason, character: {id, name}, submit(pass, retryText?) -> bool, cancel()}`: show your own prompt / VR keyboard, then call `handle.submit(pass)` (stores it; with `retryText` it also sends that line). Each handle works once.
`passPromptText` | optional (v1.1) string that replaces the built-in passphrase subtitle (used when there is no `onNeedPass`). Earth default unchanged.
`ui` (true), `hideUiInXR` (true), `voice` (true), `talkRange` (6 m), `quest` | small 2D panel bottom-left; speech output; distance for the controller button.
`THREE`, `GLTFLoader`, `camera`, `renderer`, `autoTick` | for non-A-Frame hosts.

On mount the api is also published as `window.FP_COMPANION` (v1.1); `unmount()` removes it if it still points at that instance.

api: `list()`, `current()`, `pick(id)`, `talk(text?)` (no text = listen), `listen()`, `say(text)`, `setWorld(world, desc)`, `moveTo(x, y, z, yaw)`, `comeHere()`, `forget()`, `setPassphrase(p)`, `update(dt)`, `unmount()`, `object3D`.

Talking: click/tap her, or the "Talk to ..." button, or hold **B** (right controller) within 6 m, or hold/tap **T** on a keyboard; type in the panel as a fallback. Speech in: the browser's SpeechRecognition where it exists; otherwise (Quest Browser) a short 16 kHz WAV clip goes to the proxy, which transcribes it. Speech out: `speechSynthesis` with the character's voice hints; subtitles float above her head (also in VR).

## Roster schema

```json
{"version": 1, "default": "lila", "characters": [{
  "id": "lila", "name": "Lila", "gender": "female", "ageNote": "adult, 27",
  "avatar": "avatars/lila.glb", "rig": "rocketbox", "height": 1.68,
  "voice": {"lang": "en-US", "prefer": ["Samantha", "Google US English", "female"], "pitch": 1.05, "rate": 1.0},
  "canTravel": true, "role": "girlfriend",
  "persona": "You are Lila, 27, ..."}]}
```

- `avatar`: rigged GLB, relative to the roster file. `rig`: `rocketbox` (Bip01 bones), `mixamo` or `vrm` bone names; the module poses the arms down, breathes, looks at you, turns to face you and moves the jaw while speaking. Avatars from another rig still load and turn to face you.
- `ageNote`: every character is an adult (21+). `persona` is the character; the proxy always adds the safety rules (warm and friendly, flirty at most, never explicit; adults only; never claims to be human) plus the world name and description.
- `tint` (v1.1, optional): hex colour such as `"#a8323a"` that recolours the clothing on the main (body) material while skin-tone pixels keep their colour (shading kept). `tintStrength` 0..1 (default 0.75); `tintSkin: true` tints the whole material.
- `texture` (v1.1, optional): alternate texture URL (relative to the roster) for the main body/clothing material; must use the same UV layout as the avatar's own body texture. `tint` can be combined with it.
  Example: Mars-only `{"id": "tess", ..., "avatar": "avatars/freya.glb", "tint": "#2f5f9e"}` looks different from Freya. Keep every character adult and clothed.
  Preview: `demo.html?pick=freya&tint=%23a8323a`.
- `voice.prefer`: voice-name substrings tried in order; `female` / `male` match any voice with that word.

Default roster: Lila (girlfriend, default pick), Freya, Maya, Nina, Daniel, Marcus. Avatars: Microsoft Rocketbox (MIT License, (c) Microsoft Corporation), converted to GLB with 1024 px textures (~1 MB each, ~10k triangles).

## Friends and family (later)

Add a character per person to a roster (yours or a copy of `roster.json`): `role: "friend"` or `"family"`, a persona written with them, and an `avatar` GLB. Until a 3D likeness exists, reuse a stock avatar. Only add real people with their consent and Josh's photos; no family-tree data in the public world.

## Proxy

`POST /chat` with header `X-FP-Pass: <passphrase>` and JSON `{persona, world, worldDesc, playerName, messages: [{role, content}], audio?: base64 WAV}` -> `{reply, heard, model, cost}`. `?check=1` only checks the passphrase.
Model `anthropic/claude-haiku-5.5` (fallback `deepseek/deepseek-v4.1-flash`, speech-to-text `google/gemini-3.5-flash-lite`), 220 max tokens, last 16 messages, 8 requests/min and 200/day per IP, 1,500/day in total, CORS only for joshfreeman.org, www.joshfreeman.org, redplanetlounge.pages.dev and *.redplanetlounge.pages.dev. The OpenRouter key and the passphrase hash are Worker secrets.
