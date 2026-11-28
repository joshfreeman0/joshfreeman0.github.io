# Live family companions

Family-only mount for [Fowling Pond](https://joshfreeman.org/vr/): Astrid (wife), Linnea (8) and Oskar (6). They stand at `window.FP_HOME` when the house is on live, otherwise at the bank terrace placeholder.

Girlfriends and other companions are not on live; they stay on staging (`/vr-staging/companion/`).

- Module: `/vr/companion/companion.js` (v1.2.5, `residentsOnly` so the wife stays at home)
- Roster: `/vr/companion/roster.json` (these three only)
- Host: `/vr/companion/fphost.js` (mounted from `/vr/index.html`). `?companion=0` turns it off.
- Kid replies are filtered on the shared `fp-companion` Worker (allowlist: linnea, oskar only; G-rated).
