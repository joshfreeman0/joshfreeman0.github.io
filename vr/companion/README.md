# Live companions

On [Fowling Pond](https://joshfreeman.org/vr/): Lila is the travelling companion (hands-free, one-tap "Tap to talk with Lila" overlay). Astrid, Linnea (8) and Oskar (6) stand at `window.FP_HOME` when the house is on live, otherwise at the bank terrace placeholder.

Other girlfriends and companions stay on staging (`/vr-staging/companion/`).

- Module: `/vr/companion/companion.js` (v1.2.7)
- Roster: `/vr/companion/roster.json` (lila, astrid, linnea, oskar)
- Host: `/vr/companion/fphost.js` (`?companion=0` turns it off; `?pick=` chooses a character)
- Kid replies are filtered on the shared `fp-companion` Worker (allowlist: linnea, oskar only; G-rated).

If a passphrase is needed (v1.2.7), a centered on-screen box appears (not the hidden bottom-left field), so it is visible on Quest. Once saved it is kept in the browser (`fpc.pass`); `?fppass=` still works.
On Quest (v1.2.7), after the passphrase she greets immediately (the mic is no longer waited on, which could hang and leave her silent). A Type-to-Lila box stays on screen in VR so you can type if the headset mic is already in use.
