/* Boston & area (Josh, Nov 27: "build out Boston more, and surrounding areas"). Go to > Earth places > Boston & area: one entry with a
   sub-list (like Versailles). Each spot flies you over the real place on Google 3D tiles (Real Earth, RE.goLatLon) - Boston and Cambridge
   in the Boston city frame (anchor: Christopher Columbus Park), the road from Raynham toward Boston and the South Shore in the home frame -
   and puts up a public-history place board in front of you. Boards are fact-checked, public facts only. ?spot=bos-<id> lands there. */
(function () {
'use strict';
const B = 'boston', H = 'home';
const SP = [   // id, menu label, lat, lon, frame, metres back, metres up, board title, board lines
  ['faneuil', 'Faneuil Hall', 42.36003, -71.05623, B, 420, 170, 'Faneuil Hall & Quincy Market',
    ['Faneuil Hall opened in 1742, a gift of merchant Peter Faneuil; Charles Bulfinch enlarged it in 1806.',
     'Its protest meetings before the Revolution earned it the name "the Cradle of Liberty".',
     'Quincy Market behind it was built in 1824-26 under Mayor Josiah Quincy, designed by Alexander Parris.']],
  ['statehouse', 'State House', 42.35860, -71.06388, B, 420, 170, 'Massachusetts State House',
    ['Designed by Charles Bulfinch and finished in 1798, on Beacon Hill land that was once John Hancock\'s cow pasture.',
     'Paul Revere\'s company sheathed the dome in copper in 1802; it was first covered in gold leaf in 1874.']],
  ['common', 'Common & Public Garden', 42.35504, -71.06607, B, 520, 200, 'Boston Common & the Public Garden',
    ['Set aside in 1634, Boston Common is the oldest public park in the United States; cows grazed here until 1830.',
     'The Public Garden next door (1837) was the first public botanical garden in America. Its Swan Boats have run since 1877.',
     'The Freedom Trail starts here: a 2.5-mile red line past 16 historic sites, ending at Bunker Hill.']],
  ['oldnorth', 'Old North Church', 42.36632, -71.05445, B, 380, 150, 'Old North Church',
    ['Built in 1723, Christ Church in the North End is Boston\'s oldest standing church building.',
     'On the night of April 18, 1775, two lanterns hung in its steeple signalled that British troops were crossing by water:',
     '"one if by land, and two if by sea".']],
  ['bunkerhill', 'Bunker Hill', 42.37635, -71.06077, B, 420, 170, 'Bunker Hill Monument',
    ['The 221-foot granite obelisk, dedicated in 1843, marks the Battle of Bunker Hill on June 17, 1775.',
     'Most of the fighting was on Breed\'s Hill, where the monument stands. Its granite came by the Granite Railway from Quincy.']],
  ['constitution', 'USS Constitution', 42.37244, -71.05655, B, 380, 140, 'USS Constitution, "Old Ironsides"',
    ['Launched in Boston in 1797, she is the oldest commissioned warship still afloat in the world.',
     'She earned her nickname in 1812, beating HMS Guerriere, when British shot seemed to bounce off her oak sides.']],
  ['teaparty', 'Harbor & Seaport', 42.35220, -71.05130, B, 520, 190, 'Boston Harbor & the Tea Party',
    ['On December 16, 1773, colonists dumped 342 chests of East India Company tea into the harbor from Griffin\'s Wharf.',
     'The Tea Party Ships & Museum sits on Fort Point Channel, at the edge of today\'s Seaport district.']],
  ['backbay', 'Back Bay & Copley', 42.34998, -71.07654, B, 480, 190, 'Back Bay & Copley Square',
    ['Back Bay was tidal flats until it was filled in, from 1857 into the 1880s.',
     'Copley Square holds H. H. Richardson\'s Trinity Church (1877) and the Boston Public Library\'s McKim Building (1895).',
     'The Boston Marathon finishes close by, on Boylston Street.']],
  ['fenway', 'Fenway Park', 42.34646, -71.09710, B, 420, 170, 'Fenway Park',
    ['Home of the Red Sox since April 20, 1912: the oldest Major League ballpark still in use.',
     'The 37-foot left-field wall is the Green Monster.']],
  ['mit', 'MIT', 42.35970, -71.09210, B, 520, 200, 'MIT',
    ['The Massachusetts Institute of Technology was chartered in 1861, founded by William Barton Rogers.',
     'It moved from Back Bay across the Charles River to Cambridge in 1916. The Great Dome tops Building 10 above Killian Court.']],
  ['harvard', 'Harvard', 42.37409, -71.11672, B, 480, 190, 'Harvard Yard',
    ['Founded in 1636, Harvard is the oldest college in the United States.',
     'It was named in 1639 for John Harvard, a young minister who left it his library and half of his estate.']],
  ['quincy', 'Quincy', 42.25118, -71.00294, H, 520, 200, 'Quincy, "City of Presidents"',
    ['Birthplace of John Adams and John Quincy Adams. Both presidents and their wives, Abigail and Louisa,',
     'are buried in the United First Parish Church here.',
     'Quincy granite built the Bunker Hill Monument, carried on the Granite Railway (1826), one of America\'s first railroads.']],
  ['brockton', 'Brockton', 42.08256, -71.01846, H, 520, 200, 'Brockton, "City of Champions"',
    ['Once the biggest shoe-making city in America. In 1883 Thomas Edison\'s first three-wire underground',
     'electric system lit its downtown.',
     'Home of boxing champions Rocky Marciano and Marvin Hagler.']],
  ['easton', 'North Easton', 42.06675, -71.10509, H, 420, 170, 'North Easton',
    ['The village grew around the Ames Shovel Works, once the largest shovel maker in the world.',
     'The Ames family commissioned H. H. Richardson, whose Ames Free Library and Oakes Ames Memorial Hall',
     'are part of a National Historic Landmark district, with grounds by Frederick Law Olmsted.']],
  ['bridgewater', 'Bridgewater', 41.98992, -70.97541, H, 520, 200, 'Bridgewater',
    ['Myles Standish and others bought the land from Massasoit in 1649; the town was incorporated in 1656.',
     'Bridgewater State University began in 1840 as one of the first state teacher-training (normal) schools in America.']],
  ['plymouth', 'Plymouth', 41.95809, -70.66211, H, 480, 180, 'Plymouth Rock & Mayflower II',
    ['The Mayflower Pilgrims settled at Plymouth in December 1620.',
     'Plymouth Rock rests under a granite portico built in 1921. Mayflower II, a replica built in England, sailed here in 1957.']]
];
window.FP_BOSAREA = SP.map(s => [s[0], s[1]]);
let board = null, boardAt = null, foot = '';
function wrap(g, t, w) { const out = []; let line = ''; t.split(' ').forEach(wd => { const n = line ? line + ' ' + wd : wd; if (g.measureText(n).width > w && line) { out.push(line); line = wd; } else line = n; }); if (line) out.push(line); return out; }
function boardTex(title, lines) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const g = c.getContext('2d');
  g.fillStyle = 'rgba(12,30,40,0.92)'; g.fillRect(0, 0, 1024, 512); g.strokeStyle = '#c9a24a'; g.lineWidth = 8; g.strokeRect(10, 10, 1004, 492);
  g.fillStyle = '#ffe08a'; g.font = 'bold 56px system-ui, sans-serif'; g.fillText(title, 40, 88);
  g.fillStyle = '#eef4f6'; g.font = '33px system-ui, sans-serif'; let y = 146;
  lines.forEach(l => { wrap(g, l, 944).forEach(r => { if (y < 470) g.fillText(r, 40, y); y += 41; }); y += 6; });
  g.fillStyle = '#9fb4bd'; g.font = '22px system-ui, sans-serif'; g.fillText(foot + '  -  Google 3D tiles', 44, 488);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
function dropBoard() { if (!board) return; board.parent && board.parent.remove(board); board.geometry.dispose(); board.material.map.dispose(); board.material.dispose(); board = null; boardAt = null; }
function showBoard(s, p, f) { dropBoard(); foot = f; const sc = document.querySelector('a-scene'); if (!sc) return;
  board = new THREE.Mesh(new THREE.PlaneGeometry(18, 9), new THREE.MeshBasicMaterial({map: boardTex(s[7], s[8]), fog: false, toneMapped: false, side: THREE.DoubleSide}));
  board.name = 'bosarea-board'; board.position.set(p.x - 16, p.y + 1, p.z - 36); board.rotation.y = Math.atan2(16, 36); board.rotation.x = -0.06;   /* up and to the left: the place itself stays clear in the middle */ sc.object3D.add(board); boardAt = p; }
setInterval(() => { if (!board) return; const sc = document.querySelector('a-scene'); if (!sc || !sc.camera) return; const v = new THREE.Vector3(); sc.camera.getWorldPosition(v);
  if (Math.hypot(v.x - board.position.x, v.z - board.position.z) > 2500) dropBoard(); }, 2000);
/* frame: 'boston' = the Boston city frame, 'home' = home frame, {lat, lon, yOff} = a pinned free anchor out at 200 km (London: no city scene loaded) */
function go(s, f) { const W = window.W3D, RE = W && W.realEarth; if (!RE || !RE.goLatLon) return;
  const fly = () => { const p = RE.goLatLon(s[7], s[2], s[3], {back: s[5], up: s[6], pin: typeof s[4] === 'object' ? s[4] : null, ground: s[4].ground, done: q => showBoard(s, q, f)}); if (p) showBoard(s, p, f); };
  if (s[4] === B && W.cities) { W.cities.enter('boston'); Promise.resolve(W.cities.load('boston')).then(fly); } else { dropBoard(); fly(); } }
/* shared by londonarea.js: register a list of spots as ?spot=<prefix>-<id> */
window.FP_PLACESET = (prefix, list, f) => { (function addSpots() { const W = window.W3D; if (!W || !W.spots) return setTimeout(addSpots, 50); list.forEach(s => { W.spots[prefix + '-' + s[0]] = () => go(s, f); }); })(); return list.map(s => [s[0], s[1]]); };
window.FP_PLACESET('bos', SP, 'Boston & area');
window.FP_BOSAREA_stats = () => ({spots: SP.length, board: board ? board.name : null, at: boardAt});
})();
