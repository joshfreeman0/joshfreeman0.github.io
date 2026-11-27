# Fowling Pond accounts (shared by Fowling Pond and Mars / Red Planet Lounge)

Backend: Cloudflare Worker `fp-accounts` + D1 database `fp-accounts` (free tier), https://fp-accounts.tesseractprogram.workers.dev
Source of the Worker is kept off this public repo. CORS allows joshfreeman.org, joshfreeman0.github.io, *.redplanetlounge.pages.dev,
*.tesseractprogram.pages.dev and localhost. Auth is a bearer token (no cookies). Admin = the account with verified email josh@joshfreeman.org.

## Client (no scene, no DOM)
```html
<script src="https://joshfreeman.org/vr/fpacct.js"></script>      <!-- API: window.FPA -->
<script src="https://joshfreeman.org/vr/fpacct-ui.js"></script>   <!-- optional 2D panel: window.FPAUI -->
<script>FPA.init({world: 'mars'}); FPAUI.mount(/* optional toolbar element */);</script>
```
Events on `window`: `fpa-user` (detail = me or null), `fpa-inbox` (detail = inbox, polled every 30 s).
Same login in both worlds: the token lives in localStorage per site; `FPA.handoff(url)` adds `#fpa=<token>` for the other site, which `fpacct.js` reads and strips on load.

| Area | Calls |
|---|---|
| Session | `init({world, spot})`, `signedIn()`, `me`, `refresh()`, `ensure()` (guest if needed), `signInGuest()`, `renderGoogle(el)`, `googleCredential(jwt)`, `emailLink(email, returnUrl)`, `signOut()`, `deleteAccount()`, `loadConfig()`, `handoff(url)` |
| Profile | `saveProfile({display_name, avatar, bio, interests, role: visitor/maker/backer, building, skills, help_wanted, visible})`, `avatarUrl(id, avatar)`, `shrinkImage(file, maxPx)` |
| People | `people(q, role)`, `person(id)`, `block(id)`, `unblock(id)`, `blocks()`, `report(type, id, reason)` |
| Friends | `friends()` -> `{friends:[{id,name,online,world,spot}], incoming, outgoing}`, `requestFriend`, `acceptFriend`, `declineFriend`, `removeFriend` |
| Presence | `setPresence(world, spot)` (heartbeat every 60 s; online = seen in the last 150 s) |
| Invites | `invite(friendId, {world, url, note})` (default url `https://joshfreeman.org/vr/?join=<my id>`), `acceptInvite(id)` -> `{url, world, from_id}`, `declineInvite(id)`, `inbox`, `pollInbox()` |
| Founders Hall | `projects()`, `project(id)`, `createProject({title, description, link, poster, open_hours})`, `updateProject`, `deleteProject`, `posterUrl(p)`, `follow`, `unfollow`, `encourage(id, text)`, `offer(id, text)`, `openBooth(id, minutes, url)` (invites followers), `closeBooth(id)` |
| Intros | `intros()`, `askIntro(to, note, projectId)`, `introYes(id)`, `introNo(id)`; admin: `FPA.admin.intros()`, `.approve(id)`, `.decline(id)`, `.reports()`, `.resolve(id)`, `.ban(id, unban)`, `.stats()` |

Intro flow: A asks -> B says yes -> Josh approves (wrist panel or Account > Intros) -> A and B become friends. Set the Worker var
`INTRO_ADMIN_APPROVAL=off` to skip Josh's step later. No money handling anywhere.

Joining: in Fowling Pond, `?join=<account id>` (or Join on an invite) finds that person in the shared multiplayer room (mp.js sends the
account id as `a`) and puts you beside them, on the same page, so a Quest stays in VR. Mars can handle `?join=` the same way with its own peers.
