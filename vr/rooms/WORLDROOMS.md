# World rooms (T-29)

Five FP_ROOMS guest rooms, built inside the Fowling Pond page (same scene and XR session), loaded when you enter and disposed when you leave.
Open them from the menu: **Go to > World rooms** (VR: a picker panel; 2D: the "World rooms" group), or by link:
`/vr/?room=nz`, `?room=australia`, `?room=samoa`, `?room=hawaii`, `?room=royal`. Each room has a sign post with
"Back to Fowling Pond" (returns you to where you were) and buttons for the other rooms.

| Room | File | Landmark and scenery | People |
|---|---|---|---|
| New Zealand | `nz.js` | Milford Sound / Piopiotahi, Mitre Peak, Stirling Falls, jetty, tree ferns, a kiwi | Anna, her white pit bull Ben (trots and wags), Lisa |
| Australia | `australia.js` | Sydney Opera House, Harbour Bridge, city skyline, gum trees, a kangaroo, a ferry | - |
| Samoa | `samoa.js` | Fale on a white-sand beach on Upolu, lagoon and reef, va'a, palms, hibiscus, volcanic hills | - |
| Hawaii | `hawaii.js` + `uke.js` | Waikiki beach and Le'ahi (Diamond Head), palms, surfboards, hotels | Mana playing ukulele, positional music |
| Royal Family | `royal.js` | Portrait gallery hall opening onto the East Front of Buckingham Palace, Victoria Memorial, railings, gates, guardsmen | 13 portrait frames (cyphers, names, dates; no likenesses) |

Shared code: `common.js` (merged vertex-coloured low-poly kit, panels, buttons, figures, dog). Menu/loader glue: `vr/w3d/worldrooms.js`.

All people are friendly stylized figures made from simple shapes, drawn from Josh's descriptions, not likenesses or photos.

## Audio sources and licences

- **Aloha 'Oe**: Queen Lili'uokalani, 1878, public domain. Notes from the public-domain MIDI on Wikimedia Commons,
  https://commons.wikimedia.org/wiki/File:Aloha_oe_song_midi.mid (piano part), embedded in `uke.js` and played with a
  synthesized Karplus-Strong plucked-string "ukulele" in WebAudio. No audio file.
- **Hawai'i Pono'i**: music Henri Berger, words King Kalakaua, 1874 (composition public domain). Recording by
  nationalanthems.info via Wikimedia Commons, https://commons.wikimedia.org/wiki/File:Hawai%CA%BBi_pono%CA%BB%C4%AB.ogg,
  **CC BY-SA 3.0**, converted unchanged to 48 kbps mono mp3 (`audio/hawaii-ponoi.mp3`, 260 KB). Credited on the in-room
  "Music credits" sign.

Music plays from Mana through a THREE.PositionalAudio (inverse distance, ref 1.6 m, rolloff 1.5), so it gets louder as you walk up.
The two songs alternate; buttons in front of Mana pick a song or pause.

## Facts on the panels

Checked against Wikipedia / official sources (Nov 27, 2026): Buckingham House 1703, George III 1761, Nash from 1826, Victoria 1837,
East Front 1847-50 and Aston Webb refacing 1913, 775 rooms; Victoria Memorial by Thomas Brock, unveiled 1911; Windsor 1917;
Charles III crowned 6 May 2023; Diamond Head summit 761 ft (232 m); Hawaii statehood 21 Aug 1959; Sydney Opera House by Jorn Utzon,
opened 1973, World Heritage 2007; Harbour Bridge 1932; Milford Sound about 15 km long, Mitre Peak about 1,690 m, Te Wahipounamu 1990;
Samoa independent 1 Jan 1962.
