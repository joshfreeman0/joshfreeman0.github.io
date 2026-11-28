# Shared AI companion module (Earth + Mars)

One ES module that puts a talking, realistic AI companion into any A-Frame (or plain three.js) world. Fowling Pond (Earth) and Red Planet Lounge (Mars) use the same module, roster and proxy, and conversation history is keyed by player + character, so the same companion remembers you in both worlds.

- Module: `https://joshfreeman.org/vr-staging/companion/companion.js` (staging; will move to `/vr/companion/` when B merges)
- Default roster: `https://joshfreeman.org/vr-staging/companion/roster.json`
- Demo page: `https://joshfreeman.org/vr-staging/companion/demo.html` (`?family=1` also shows the wife and kids)
- Line-up page: `https://joshfreeman.org/vr-staging/companion/lineup.html?ids=lila,freya,maya,nina` (static side-by-side comparison, no talking)
- Version: `1.2.9` (`api.version`)
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
`pick` | character id. Default: the player's last pick, else roster `default`. A `child` character, or one not allowed in this `world`, is never used as the starting pick (falls back to `default`, then the first adult).
`family` | default `true` (v1.2.1: `false` is respected by later `pick()` calls too). Mounts the roster's `wife` and `child` characters that belong in this `world` as **residents** (they stand at their homes, do not follow, can be clicked/tapped to talk). `false` turns that off.
`familyPlaceholder` | override for the built-in placeholder spots (see Family).
`homeWaitMs` | v1.2.2, default `6000`. How long wife/kid residents stay hidden waiting for `setHome` / roster `home` / `FP_HOME` before falling back to the terrace placeholder.
`houseAware` | v1.2.2, default `true`. `false` turns off the family-home follow rule below.
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

api: `version`, `list()`, `current()`, `pick(id)`, `talk(text?)` (no text = listen), `listen()`, `say(text)`, `setWorld(world, desc)`, `moveTo(x, y, z, yaw)`, `comeHere()`, `forget()`, `setPassphrase(p)`, `update(dt)`, `unmount()`, `object3D`.
v1.2.4: `voiceOn()`, `setVoiceOn(on)`, `unlockAudio()`.
v1.2.5: `startTalk()`, `setHandsFree(on)`. `handsFree` (default true, except residents and Mars unless you pass `tapToStart: true`). `tapToStart` (default true on Earth) shows a one-tap "Tap to talk with …" overlay that unlocks audio, asks for the mic, greets, and starts listening.
v1.2: `setHome(id, {x, y?, z, yaw?})` (pins a wife/kid resident there; overrides roster `home` and `FP_HOME`), `family()` -> `[{id, name, role, object3D}]` (residents currently mounted), `talkTo(id, text?)`.
Also exported: `preview(sceneEl, rootEl, characters, {spacing, z})` / `clearPreview()` for static line-ups (used by `lineup.html`), `FAMILY_PLACEHOLDER`, `VERSION`.

Talking (v1.2.5, hands-free on Earth): on load, a full-screen **Tap to talk with Lila** overlay is the only required tap (iOS Safari needs that one gesture to unlock audio and the microphone). After you tap, she greets you out loud and then listens continuously: when you finish a sentence she replies, and when she finishes speaking she starts listening again. You do not have to press Talk for each turn. A **Mic** / **Mic off** button pauses or resumes the loop; **Voice** / **Muted** still turns her speech off (default on, stored as `fpc.voiceOn`). Click/tap her, the Talk button, hold **B** (right controller) within 6 m, or **T** on a keyboard still work, and you can type in the panel. Speech in: the browser's SpeechRecognition where it exists (iPhone Safari included); otherwise (Quest Browser, Firefox) a short 16 kHz WAV clip goes to the proxy, which transcribes it, then the same listen-after-she-speaks loop is used. Speech out: replies are spoken with a natural voice from the proxy `POST /tts` (Cloudflare Workers AI Deepgram Aura-2, falling back to Aura-1: female voices for the women, male for Daniel and Marcus, gentle voices for Linnea and Oskar). The browser's `speechSynthesis` is a last-resort fallback only. Subtitles still float above her head. On an iPhone, turn off the silent switch and raise the volume to hear her. Mars does not show the overlay unless the host sets `tapToStart: true`.

## Roster schema

```json
{"version": 1, "default": "lila", "characters": [{
  "id": "lila", "name": "Lila", "gender": "female", "ageNote": "adult, 27",
  "avatar": "avatars/f01.glb", "rig": "rocketbox", "targetHeight": 1.80,
  "look": "tall Nordic blonde, honey-blond ponytail, blue eyes",
  "eyeTint": "#5b8fd6", "tint": "#7fa6d9", "tintStrength": 0.6,
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

New optional fields in v1.2 (generic: any roster, Earth or Mars, can use them; characters without them look and behave exactly as in v1.1):

field | meaning
---|---
`targetHeight` | standing height in metres (0.5 to 2.6), feet on the ground. The model is scaled to it. The old `height` is only a fallback for badly scaled models.
`scale` | extra multiplier (0.3 to 2) applied after `targetHeight`.
`hairTint`, `hairTintStrength` | recolours the hair: the hair cards (the alpha-tested `*_opacity` material) plus golden/brown hair painted on the head texture (scalp and bun areas of the Rocketbox layout). Strength 0..1 (default 0.85). `hairTintHead: false` limits it to the hair cards. Works best on light or mid-brown source hair; near-black hair barely changes.
`eyeTint`, `eyeUV` | recolours the iris on the head texture. Rocketbox avatars share one layout (eyeball at uv 0.2645, 0.923, radius 0.034); `eyeUV: [u, v, r]` for other avatars.
`role` | `girlfriend` (picker group "Girlfriends"), `companion` / `friend` ("Companions"), `wife` or `child` ("Family"). `wife` and `child` are mounted as residents (see Family). The proxy gets `role` and `characterId`.
`worlds` | e.g. `["earth"]` or `["earth", "mars"]`. Missing = every world. Characters outside the current world are hidden from the picker and never mounted.
`relation` | label for kids in the picker, e.g. `daughter`.
`home` | `{x, y?, z, yaw?}` world spot for a wife/kid resident (overrides `FP_HOME`; `api.setHome` overrides this).
`wanderArea` | `{x, z, r}` idle area for a kid (default: `FP_HOME` play/yard, else the placeholder play area).
`look` | short description for people editing the roster (not sent anywhere).

Rocketbox children use `Bip02` bones; `rig: "rocketbox"` handles both `Bip01` and `Bip02`.

Default roster (v1.2.1, 12 characters; `default: "lila"`):

group | id | name | age | avatar file (source) | look
---|---|---|---|---|---
Girlfriends | lila | Lila | 27 | f01.glb (Female_Adult_01) | Nordic (Bergen), honey-blond ponytail, blue eyes, 1.80 m
Girlfriends | freya | Freya | 25 | freya.glb (Female_Adult_17, file unchanged) | Nordic (Gothenburg), platinum top-knot, blue eyes, 1.82 m
Girlfriends | maya | Maya | 29 | f13.glb (Female_Adult_13) | Nordic (Copenhagen), short ash-blond, blue-grey eyes, 1.81 m
Girlfriends | nina | Nina | 31 | p01.glb (Female_Party_01) | Nordic (Reykjavik), curly strawberry-blond, blue eyes, 1.79 m
Companions | giulia | Giulia | 28 | lila.glb (Female_Adult_15) | Italian (Florence) brunette
Companions | siobhan | Siobhan | 26 | f14.glb (Female_Adult_14) | Irish (Galway) redhead, green eyes
Companions | valentina | Valentina | 29 | f03.glb (Female_Adult_03) | Latina (Medellín)
Companions | daniel | Daniel | | daniel.glb | unchanged since v1.0
Companions | marcus | Marcus | | marcus.glb | unchanged since v1.0
Family | astrid | Astrid (wife) | 30 | f04.glb (Female_Adult_04) | Nordic (Stavanger), blonde, blue eyes, 1.80 m; `worlds: ["earth", "mars"]`
Family | linnea | Linnea (daughter) | 8 | cf01.glb (Female_Child_01) | `worlds: ["earth"]`, 1.28 m
Family | oskar | Oskar (son) | 6 | cm01.glb (Male_Child_01) | `worlds: ["earth"]`, 1.16 m

All adult characters are 25 to 32, clothed, friendly and flirty at most, never explicit. All characters are fictional AI characters. `nina.glb` (Female_Party_02), `f12.glb`, `cf02.glb` (Female_Child_02) and `cm02.glb` (Male_Child_02) are in `avatars/` but unused by this roster (free for Mars). Avatars: Microsoft Rocketbox (MIT License, (c) Microsoft Corporation), converted to GLB with 1024 px textures (~0.7 to 1.4 MB each, ~10k triangles).

**What Mars inherits.** Mars passes its own roster, so it gets only the generic code: the optional fields above, the picker groups, residents for any `wife`/`child` in its roster, and `characterId`/`role` in proxy requests. Characters in a Mars roster that use none of the new fields (Tess, Iris, Rafael) look exactly as before: no avatar file was modified (Earth's new looks use new files or per-character fields). If Mars ever loads this default `roster.json` it gets the Earth set above, with Lila, Freya, Maya, Nina, Giulia, Siobhan, Valentina, Daniel, Marcus and Astrid (kids are Earth-only).

## Family (v1.2)

The wife and kids are separate from the picker's "default" slot. On mount (unless `family: false`) every `wife`/`child` character allowed in this world is placed as a resident; the one you are talking to in the panel can still be any of them (pick it under "Family").

- **Astrid (wife)** calls Josh her husband, remembers him by `playerId` (same history keys as everyone else) and has `worlds: ["earth", "mars"]`, so on Mars she is a resident too.
- **Kids (Linnea 8, Oskar 6)** are Earth-only, never the default pick, never follow you, and wander slowly in the yard/play area (they stop when you are within 2.5 m or talking).

Where they stand (first match wins):
1. `api.setHome(id, pos)`
2. roster `home`
3. `window.FP_HOME.spawns` from B's family-home module: `{wife: {position: [x, y, z], rotationY}, kids: [{position, rotationY}, ...], yard, play, porch}`. Read on mount, and again whenever `fp-home-ready` fires on the scene element (or window). The wife goes to `spawns.wife`; kids go to `spawns.kids[i]` in roster order (Linnea -> `kids[0]`, Oskar -> `kids[1]`); extra slots stay empty; extra kids stand in a ring near `yard`. Kids wander in `play` (else `yard`). `rotationY` / `yaw` are degrees.
4. Placeholder near the Fowling Pond terrace (Earth only, used only if nothing above has given a spot within `homeWaitMs`, default 6 s), `FAMILY_PLACEHOLDER`:
   wife (844.5, -381.5) yaw 200; kids: Linnea (840.5, -382.5) yaw 150, Oskar (841.5, -376.5) yaw 120; play area centre (842.0, -379.5), radius 2.5. y = ground height.

**Visibility (v1.2.2).** Every companion and resident is created hidden and only becomes visible once it has been placed (`spawn`, `setHome`, roster `home`, `FP_HOME`, the placeholder after `homeWaitMs`, or beside the player). Nothing is ever drawn at the world origin while assets or the home load. A primary companion mounted without `spawn` appears beside the player as soon as there is a camera.

**Following around the family home (v1.2.2).** While the player is inside the house, the active (travelling) companion does not follow indoors: she waits on the porch, 1.6 m beside `spawns.porch` on the side away from the wife, facing the player, and normal following resumes when the player leaves the house (followDist 14 m as before). "Come here" while indoors also sends her to the porch, and outdoors "Come here" / follow never puts her inside the walls (front, right, left, then behind the player, first spot clear of the house). House footprint: `FP_HOME.bounds` (or `.house`) `{x0, x1, z0, z1}` in world metres (familyhome v3 / fphome v2 provides this), else `FP_HOME.site` centre +- 6.4 m (x) by +- 4.9 m (z), else a 6 m circle round the porch. `FP_HOME.porchBounds` is treated as not-inside, so standing on the porch does not count as being in the house. Kids are not pinned by B's `setHome` (wife only); they stand at `spawns.kids[i]` in roster order (Linnea, Oskar; a third slot is unused) and wander in `play`. Other worlds and places are unaffected.

**Hands-free (v1.2.7).** After the one-tap overlay, listening automatically restarts when she finishes speaking. iOS `webkitSpeechRecognition` ending after one result, empty `onend`, or capturing her own voice no longer kills the loop: audio is ignored while she talks, a final (or briefly-silent interim) result is sent, and a failed or empty listen restarts instead of dying on "I didn't catch that."

**2D menu (v1.2.3).** The companion control bar hides (fades, no pointer events) while B's bottom menu (`#ui`, menutabs) has a pane open (`#ui[data-tab]`, `.pane.cur`, or Help). On narrow screens (max-width 700px) the bar also lifts above the menu whenever `#ui` is visible, so it does not cover the tab row; it returns to the bottom-left when the menu is hidden (Hide / Show menu). Detected with a MutationObserver on `#ui`.

B's `?spot=home` URL lands the player on the porch (`spawns.porch`); the module does not move the player.

**Kids' content rules are enforced by the proxy, not the client.** The Worker has a server-side allowlist of child ids (`linnea`, `oskar`) with their own short personas; for those ids it ignores any persona the client sends and adds a child rule block: strictly wholesome and G-rated; no romance, flirting, dating, kissing, crushes, sexual or body talk, bathing/undressing, secrets with adults, or adult themes; deflect innocently or say they are going off to play; never claim to be older; 1 to 2 sentences about school, games, the pond, the chickens, or asking Dad to play. An input filter answers obviously inappropriate messages with a canned deflection (no model call) and an output filter replaces any reply that trips it. `role: "child"` with an unlisted id is rejected (400), and an adult persona that claims to be under 18 is rejected (400). The client sends an empty persona for kids. The wife/girlfriend persona is never used for a kid.

## Friends

Add a character per person to a roster (yours or a copy of `roster.json`): `role: "friend"`, a persona written with them, and an `avatar` GLB. Until a 3D likeness exists, reuse a stock avatar. Only add real people with their consent and Josh's photos; no family-tree data in the public world.

## Proxy

`POST /chat` with header `X-FP-Pass: <passphrase>` and JSON `{characterId, role, persona, world, worldDesc, playerName, messages: [{role, content}], audio?: base64 WAV}` -> `{reply, heard, model, cost}`. `?check=1` only checks the passphrase.
`POST /tts` (v1.2.7) with the same passphrase and JSON `{text, characterId, role, gender?}` -> an `audio/mpeg` clip (Aura-2, then Aura-1). Kid lines are run through the same server-side kid filter before any audio is produced. Length is capped at 500 characters; replies are cached; TTS has its own rate limits (12/min and 250/day per IP, 2,000/day globally) so it does not eat the chat cap. About $0.03 per 1,000 characters on Aura-2, $0.015 on Aura-1 (a short reply is typically well under a tenth of a cent). The OpenRouter key stays on the Worker; if Aura is down the Worker may fall back to OpenRouter speech, then MeloTTS, and the client uses `speechSynthesis` only as a last resort.
Model `anthropic/claude-haiku-5.5` (fallback `deepseek/deepseek-v4.1-flash`, speech-to-text `google/gemini-3.5-flash-lite`), 220 max tokens, last 16 messages, 8 requests/min and 200/day per IP, 1,500/day in total, kids: last 6 messages, 120 max tokens. CORS only for joshfreeman.org, www.joshfreeman.org, redplanetlounge.pages.dev and *.redplanetlounge.pages.dev. The OpenRouter key and the passphrase hash are Worker secrets.

If a passphrase is needed (v1.2.7), a centered on-screen box appears (not the hidden bottom-left field), so it is visible on Quest. Once saved it is kept in the browser (`fpc.pass`); `?fppass=` still works.
On Quest (v1.2.7), after the passphrase she greets immediately (the mic is no longer waited on, which could hang and leave her silent). A Type-to-Lila box stays on screen in VR so you can type if the headset mic is already in use.
On Quest (v1.2.9), clicking a companion (including Astrid at the house) starts a continuous talk loop: after her voice finishes she listens again, using voice-activity detection and the Worker to transcribe (Quest has no SpeechRecognition). Her reply text is shown when her voice starts, and the first sentence is spoken first so the delay is shorter. The microphone stream is kept for the next turn if another feature is already using it.

On v1.2.9, only one companion talks at a time. Lila may come to the house with you; she and Astrid can trade a short line or two, then if you say "Lila, leave" (or "leave us" / "go away") she says one goodbye and walks away, and stays gone until you pick Talk to Lila or Come here. After she leaves she stays quiet, and you can talk to Astrid, Linnea, or Oskar (click them, or pick them in the Talk list). The kids stay G-rated.


