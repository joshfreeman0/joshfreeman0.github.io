/* Family compound (Nov 28 2026, v4): 16 cottages around one continuous green
   on a graded flat terrace inland of the family-home lot (behind the house, away
   from the pond). Eight Earth women and eight Mars women, one cottage each.
   Earth kids (except Astrid's, who stay in the main house via C's companion)
   stand at the door as generic unnamed figures. Mars kids are an empty slot
   (FP_COMPOUND.setKids) until C sends names. No name or address labels.
   Avatars load from the companion folder or, for the Mars women, from the
   public Red Planet Lounge assets; this file does not edit companion code.
   Host: window.FP_HOME from fx/fphome.js.
   A shallow feeder brook runs east of the green, draining north into the
   east cove of the pond; a timber footbridge carries a path over it.
   The rail stays in tunnel under the grounds; grass covers the old surface cut.
   Privacy: window.FP_PRIVATE_ZONES, window.FP_PRIVATE.isPrivate(x,z) and
   window.FP_PRIVATE.isOwner(). Non-owners cannot enter the main house, its
   porch, any cottage, or the wooded compound grounds. Owner: FPA.me admin /
   josh@joshfreeman.org, or the explicit flag window.FP_OWNER === true, or
   ?fpowner=1. */
(function () {
  'use strict';
  if (window.FP_COMPOUND && FP_COMPOUND.version >= 4) return;
  const SITE = {x: -705, z: 680}, SHOW_D = 800, PAD = 5;
  const C = {siding: '#f3ead6', trim: '#fbfaf5', roof: '#5e5048', stone: '#a49a8c', deck: '#b08a62',
    door: '#9c2f25', shutter: '#5f7d68', glass: '#8aa0a8', grass: '#5a7a42', grass2: '#4e6e38',
    path: '#c4b292', bush: '#4a6b38', leaf: ['#4f7a38', '#5b8a40', '#3e6a30', '#6a9448'],
    trunk: '#6b5038', earth: '#8a7354'};
  const HW = 3.15, HD = 2.55, WH = 2.45, T = 0.16, FY = 0.42, PW = 3.2, PD = 1.55;
  /* Local metres from the house origin. Lot inland edge is z = +20. Horseshoe
     opens toward the house so every cottage stays outside the fence. Radius and
     terrace stay inside the ring-road clearance inland of the lot. */
  const GREEN = {x: 0, z: 52};
  const RSET = 32, RING_R = 25.5, GAP0 = 40, GAP1 = 320;
  const TERR = {x0: -44, x1: 44, z0: 20.3, z1: 90};
  /* Feeder brook, world metres, downstream first (east cove of the pond) then
     south and southeast through the east side of the grounds. Half-width 2 m.
     Cottages and the terrace stay more than 8 m west of the banks. */
  const BROOK_HW = 2.6, BROOK_SETBACK = 8;
  const BROOK = [
    [-620, 676], [-612, 690], [-614, 720], [-610, 740],
    [-610, 780], [-610, 840], [-610, 910], [-605, 990], [-595, 1065]
  ];
  /* Rail alignment through the grounds, used only to hide the old surface cut. */
  const RAIL_COVER = [
    [-587.9, 657.2], [-595.2, 713.0], [-604.2, 766.0],
    [-634.5, 892.2], [-676.0, 1040.8], [-710.3, 1167.9]
  ];
  /* Wooded compound grounds, inset from the bounding roads and the west tree line. */
  const GROUNDS = [
    [-850, 675], [-740, 662], [-700, 662], [-670, 675], [-640, 700],
    [-616, 718], [-540, 758], [-500, 785], [-470, 800], [-545, 1008],
    [-560, 1040], [-640, 1140], [-700, 1155], [-800, 1154], [-850, 1150]
  ];
  const RPL = 'https://redplanetlounge.pages.dev/assets/companions/';
  const KH = {2: 0.86, 3: 0.95, 4: 1.03, 5: 1.10, 6: 1.16, 7: 1.22, 8: 1.28, 9: 1.34};
  const EARTH_KIDS = {
    lila:      [{file: 'cf01.glb', age: 5}, {file: 'cm01.glb', age: 3}],
    freya:     [{file: 'cf02.glb', age: 4}, {file: 'cm02.glb', age: 2}],
    maya:      [{file: 'cf01.glb', age: 7}, {file: 'cm01.glb', age: 5}],
    nina:      [{file: 'cf02.glb', age: 9}, {file: 'cm02.glb', age: 6}],
    giulia:    [{file: 'cf01.glb', age: 6}, {file: 'cm01.glb', age: 4}],
    siobhan:   [{file: 'cf02.glb', age: 5}, {file: 'cm02.glb', age: 3}],
    valentina: [{file: 'cf01.glb', age: 7}, {file: 'cm01.glb', age: 4}]
  };
  /* 16 cottages, even steps around the horseshoe (40° .. 320°). */
  const COT = [
    {id: 'astrid',    avatar: 'f04.glb',   th: 1.80},
    {id: 'lila',      avatar: 'f01.glb',   th: 1.80},
    {id: 'freya',     avatar: 'freya.glb', th: 1.82},
    {id: 'maya',      avatar: 'f13.glb',   th: 1.81},
    {id: 'nina',      avatar: 'p01.glb',   th: 1.79},
    {id: 'giulia',    avatar: 'lila.glb',  th: 1.80},
    {id: 'siobhan',   avatar: 'f14.glb',   th: 1.80},
    {id: 'valentina', avatar: 'f03.glb',   th: 1.80},
    {id: 'tess',      avatar: 'f12.glb',   th: 1.78, url: RPL + 'gtess.glb'},
    {id: 'iris',      avatar: 'f01.glb',   th: 1.76, url: RPL + 'giris.glb'},
    {id: 'sofia',     avatar: 'f03.glb',   th: 1.66, url: RPL + 'vsofia.glb'},
    {id: 'camila',    avatar: 'lila.glb',  th: 1.65, url: RPL + 'vcamila.glb'},
    {id: 'lucia',     avatar: 'f14.glb',   th: 1.70, url: RPL + 'vlucia.glb'},
    {id: 'chiara',    avatar: 'f13.glb',   th: 1.68, url: RPL + 'vchiara.glb'},
    {id: 'hana',      avatar: 'p01.glb',   th: 1.66, url: RPL + 'vhana.glb'},
    {id: 'scarlett',  avatar: 'freya.glb', th: 1.68, url: RPL + 'vscarlett.glb'}
  ];
  const step = (GAP1 - GAP0) / (COT.length - 1);
  COT.forEach((c, i) => {
    c.ang = GAP0 + step * i;
    const a = c.ang * Math.PI / 180;
    c.lx = +(RSET * Math.sin(a)).toFixed(2);
    c.lz = +(GREEN.z - RSET * Math.cos(a)).toFixed(2);
    c.yaw = Math.atan2(GREEN.x - c.lx, -(GREEN.z - c.lz));
    c.kids = EARTH_KIDS[c.id] ? EARTH_KIDS[c.id].slice() : [];
  });

  const H = window.FP_COMPOUND = {version: 4, ready: false};
  let group = null, origin = null, keepOut = null, maskHook = null, gHook = null, hiddenTrees = [], added = {floors: [], walls: []};

  /* ---------- no-entry: house + every cottage. C can read these too. ---------- */
  const PRIV = window.FP_PRIVATE = window.FP_PRIVATE || {};
  const ZONES = PRIV.zones = window.FP_PRIVATE_ZONES = window.FP_PRIVATE_ZONES || [];
  const OWNER_EMAILS = ['josh@joshfreeman.org'];
  function flagOwner() {
    if (window.FP_OWNER === true) return true;
    try { if (/[?&]fpowner=1(?:&|$)/.test(location.search)) return true; } catch (e) {}
    return false;
  }
  function accountOwner() {
    const me = window.FPA && FPA.me; if (!me) return false;
    if (me.admin === true || me.is_admin === true || me.owner === true) return true;
    const role = String(me.role || '').toLowerCase();
    if (role === 'admin' || role === 'owner') return true;
    const email = String(me.email || me.verified_email || me.mail || '').trim().toLowerCase();
    return OWNER_EMAILS.indexOf(email) >= 0;
  }
  function isOwner() { return flagOwner() || accountOwner(); }
  function inBox(z, x, zz) { return x >= z.x0 && x <= z.x1 && zz >= z.z0 && zz <= z.z1; }
  function inPoly(pts, x, z) {
    let n = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const xi = pts[i][0], zi = pts[i][1], xj = pts[j][0], zj = pts[j][1];
      if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / ((zj - zi) || 1e-12) + xi) n = !n;
    }
    return n;
  }
  function inZone(z, x, zz) { return z.poly ? inPoly(z.poly, x, zz) : inBox(z, x, zz); }
  function isPrivate(x, z) { for (let i = 0; i < ZONES.length; i++) if (inZone(ZONES[i], x, z)) return ZONES[i]; return null; }
  function addZone(z) {
    for (let i = 0; i < ZONES.length; i++) if (ZONES[i].id && z.id && ZONES[i].id === z.id) { ZONES[i] = z; return z; }
    ZONES.push(z); return z;
  }
  function nearestOut(x, z, box) {
    if (box.poly && box.poly.length > 2) {
      const pts = box.poly;
      let bestD = 1e9, px = x, pz = z, nx = 0, nz = 1;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const ax = pts[j][0], az = pts[j][1], bx = pts[i][0], bz = pts[i][1];
        const ex = bx - ax, ez = bz - az, L2 = ex * ex + ez * ez || 1;
        const t = Math.max(0, Math.min(1, ((x - ax) * ex + (z - az) * ez) / L2));
        const qx = ax + ex * t, qz = az + ez * t, d = Math.hypot(x - qx, z - qz), L = Math.sqrt(L2);
        if (d < bestD) { bestD = d; px = qx; pz = qz; nx = ez / L; nz = -ex / L; }
      }
      if (inPoly(pts, px + nx * 2, pz + nz * 2)) { nx = -nx; nz = -nz; }
      return {x: px + nx * 1.2, z: pz + nz * 1.2};
    }
    const dl = x - box.x0, dr = box.x1 - x, dt = z - box.z0, db = box.z1 - z, m = Math.min(dl, dr, dt, db), pad = 0.8;
    if (m === dl) return {x: box.x0 - pad, z: z};
    if (m === dr) return {x: box.x1 + pad, z: z};
    if (m === dt) return {x: x, z: box.z0 - pad};
    return {x: x, z: box.z1 + pad};
  }
  function ejectIfNeeded() {
    if (isOwner() || !window.W3D || !W3D.teleportTo) return;
    const rig = document.querySelector('#rig'); if (!rig || !rig.object3D) return;
    const p = rig.object3D.position, hit = isPrivate(p.x, p.z); if (!hit) return;
    const o = nearestOut(p.x, p.z, hit);
    const y = (W3D.groundAt && W3D.groundAt(o.x, o.z, p.y)) || p.y;
    W3D._fpPrivSkip = true; W3D.teleportTo(o.x, y, o.z); W3D._fpPrivSkip = false;
  }
  function wireMovement() {
    if (!window.W3D) return;
    W3D.bHooks = W3D.bHooks || [];
    if (!W3D.bHooks._fpPriv) {
      const hook = (x, z) => (!isOwner() && !!isPrivate(x, z));
      hook._fpPriv = true; W3D.bHooks._fpPriv = true; W3D.bHooks.push(hook);
    }
    if (W3D.teleportTo && !W3D.teleportTo._fpPriv) {
      const prev = W3D.teleportTo;
      W3D.teleportTo = function (x, y, z, yaw) {
        if (!W3D._fpPrivSkip && !isOwner()) {
          const hit = isPrivate(x, z);
          if (hit) { const o = nearestOut(x, z, hit); x = o.x; z = o.z; y = undefined; }
        }
        return prev.call(this, x, y, z, yaw);
      };
      W3D.teleportTo._fpPriv = true;
    }
  }
  PRIV.isPrivate = isPrivate; PRIV.isOwner = isOwner; PRIV.zones = ZONES;
  window.FP_PRIVATE_ZONES = ZONES;
  function houseZone() {
    const Hm = window.FP_HOME; if (!Hm || !Hm.bounds) return;
    const b = Hm.bounds, p = Hm.porchBounds || b, pad = 0.35;
    addZone({
      id: 'house', kind: 'house',
      x0: Math.min(b.x0, p.x0) - pad, x1: Math.max(b.x1, p.x1) + pad,
      z0: Math.min(b.z0, p.z0) - pad, z1: Math.max(b.z1, p.z1) + pad
    });
  }
  function groundsZone() {
    const xs = GROUNDS.map(p => p[0]), zs = GROUNDS.map(p => p[1]);
    addZone({
      id: 'grounds', kind: 'grounds', poly: GROUNDS,
      x0: Math.min.apply(null, xs), x1: Math.max.apply(null, xs),
      z0: Math.min.apply(null, zs), z1: Math.max.apply(null, zs)
    });
  }
  wireMovement();
  window.addEventListener('fp-home-ready', () => { houseZone(); groundsZone(); wireMovement(); });
  window.addEventListener('fpa-user', () => {});
  setInterval(() => { wireMovement(); ejectIfNeeded(); }, 200);

  function tH(x, z) {
    const v = window.W3D && W3D.terrainH && W3D.terrainH(x, z);
    if (isFinite(v) && Math.abs(v) > 1) return v;
    return (window.FP_HOME && FP_HOME.site && FP_HOME.site.y) || 20;
  }
  function avBases() {
    const st = '/vr-staging/companion/avatars/', lv = '/vr/companion/avatars/';
    return /\/vr-staging/.test(location.pathname) ? [st, lv] : [lv, st];
  }
  function tex(n, draw) {
    const c = document.createElement('canvas'); c.width = c.height = n; draw(c.getContext('2d'), n);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 2; return t;
  }
  const TEX = {};
  function materials() {
    if (TEX.ok) return TEX;
    TEX.clap = tex(64, (g, n) => { g.fillStyle = '#f0f0f0'; g.fillRect(0, 0, n, n); g.fillStyle = 'rgba(0,0,0,0.08)';
      for (let y = 0; y < n; y += 8) { g.fillRect(0, y, n, 1); for (let x = (y / 8) % 2 ? 0 : 16; x < n; x += 32) g.fillRect(x, y, 1, 8); } });
    TEX.shingle = tex(64, (g, n) => { g.fillStyle = '#777'; g.fillRect(0, 0, n, n); g.fillStyle = 'rgba(0,0,0,0.15)';
      for (let r = 0; r < 8; r++) { const y = r * 8, off = (r % 2) * 8; for (let x = off; x < n; x += 16) g.strokeRect(x, y, 16, 8); } });
    TEX.grass = tex(64, (g, n) => { g.fillStyle = '#888'; g.fillRect(0, 0, n, n); g.fillStyle = 'rgba(0,0,0,0.07)';
      for (let i = 0; i < 400; i++) g.fillRect(Math.random() * n, Math.random() * n, 1, 2 + Math.random() * 2); });
    TEX.ok = true; return TEX;
  }
  function mat(color, map, opts) {
    return new THREE.MeshLambertMaterial(Object.assign({color: color, map: map || null}, opts || {}));
  }
  const GEO = {body: new THREE.BoxGeometry(1, 1, 1), ball: new THREE.SphereGeometry(1, 8, 6)};
  function box(parent, material, x, y, z, sx, sy, sz, rotX, rotY) {
    const m = new THREE.Mesh(GEO.body, material);
    m.position.set(x, y, z); m.scale.set(sx, sy, sz);
    if (rotX) m.rotation.x = rotX; if (rotY) m.rotation.y = rotY;
    m.receiveShadow = true; parent.add(m); return m;
  }

  function cottageAt(parent, mats) {
    const g = new THREE.Group(), foot = 0.5;
    box(g, mats.stone, 0, FY - 0.06 - foot / 2, 0, HW * 2 + 0.3, foot, HD * 2 + 0.3);
    box(g, mats.trim, 0, FY - 0.02, 0, HW * 2 + 0.36, 0.08, HD * 2 + 0.36);
    box(g, mats.siding, 0, FY + WH / 2, 0, HW * 2, WH, HD * 2);
    for (const [x, z] of [[-HW, -HD], [HW, -HD], [-HW, HD], [HW, HD]])
      box(g, mats.trim, x, FY + WH / 2, z, 0.14, WH + 0.02, 0.14);
    const pitch = 0.48, rl = Math.hypot(HD + 0.28, (HD + 0.28) * pitch) + 0.05, rs = Math.atan(pitch);
    const ry = FY + WH + 0.08 + (HD + 0.2) * pitch / 2;
    for (const s of [-1, 1]) box(g, mats.roof, 0, ry, s * (HD + 0.15) / 2, HW * 2 + 0.55, 0.09, rl, s * rs, 0);
    box(g, mats.siding, -HW, FY + WH + 0.38, 0, 0.14, 0.8, HD * 0.55);
    box(g, mats.siding,  HW, FY + WH + 0.38, 0, 0.14, 0.8, HD * 0.55);
    box(g, mats.stone, HW * 0.45, FY + WH + 1.35, HD * 0.35, 0.42, 0.9, 0.42);
    box(g, mats.trim, HW * 0.45, FY + WH + 1.82, HD * 0.35, 0.48, 0.1, 0.48);
    const pz = -HD - PD / 2;
    box(g, mats.deck, 0, FY - 0.04, pz, PW, 0.08, PD);
    box(g, mats.stone, 0, FY / 2 - 0.08, pz, PW - 0.1, Math.max(0.12, FY - 0.08), PD - 0.1);
    for (const x of [-PW / 2 + 0.12, PW / 2 - 0.12]) {
      box(g, mats.trim, x, FY + 0.85, -HD - PD + 0.1, 0.1, 1.7, 0.1);
      box(g, mats.trim, x, FY + 0.45, pz, 0.08, 0.08, PD - 0.15);
    }
    box(g, mats.trim, 0, FY + 1.68, -HD - PD + 0.1, PW, 0.08, 0.1);
    box(g, mats.roof, 0, FY + 2.05, pz - 0.05, PW + 0.2, 0.08, PD + 0.35, -0.12, 0);
    box(g, mats.door, 0, FY + 1.05, -HD - 0.02, 0.92, 2.1, 0.08);
    box(g, mats.trim, 0, FY + 1.05, -HD - 0.05, 1.02, 2.2, 0.04);
    function win(x) {
      box(g, mats.glass, x, FY + 1.45, -HD - 0.02, 0.7, 0.85, 0.05);
      box(g, mats.trim, x, FY + 1.45, -HD - 0.05, 0.8, 0.95, 0.04);
      box(g, mats.shutter, x - 0.48, FY + 1.45, -HD - 0.03, 0.18, 0.9, 0.05);
      box(g, mats.shutter, x + 0.48, FY + 1.45, -HD - 0.03, 0.18, 0.9, 0.05);
    }
    win(-1.85); win(1.85);
    box(g, mats.glass, HW + 0.02, FY + 1.4, 0, 0.05, 0.8, 0.7);
    box(g, mats.glass, -HW - 0.02, FY + 1.4, 0, 0.05, 0.8, 0.7);
    parent.add(g); return g;
  }

  function tree(parent, mats, x, y, z, s) {
    box(parent, mats.trunk, x, y + 0.7 * s, z, 0.22 * s, 1.4 * s, 0.22 * s);
    for (let i = 0; i < 4; i++) {
      const b = new THREE.Mesh(GEO.ball, mats.leaf[i % mats.leaf.length]);
      const a = i * 1.7, r = 0.35 * s;
      b.position.set(x + Math.cos(a) * r, y + 1.55 * s + (i % 2) * 0.25 * s, z + Math.sin(a) * r);
      b.scale.set(0.85 * s, 0.75 * s, 0.85 * s); parent.add(b);
    }
  }
  function bush(parent, mats, x, y, z, s) {
    const b = new THREE.Mesh(GEO.ball, mats.bush);
    b.position.set(x, y + 0.32 * s, z); b.scale.set(0.5 * s, 0.38 * s, 0.5 * s); parent.add(b);
  }

  function terrace(root, mats, yLocal, yMinLocal) {
    const g = new THREE.Group(), tw = TERR.x1 - TERR.x0, td = TERR.z1 - TERR.z0;
    const cx = (TERR.x0 + TERR.x1) / 2, cz = (TERR.z0 + TERR.z1) / 2;
    const thick = Math.max(1.4, yLocal - yMinLocal + 0.9);
    box(g, mats.earth, cx, yLocal - thick / 2, cz, tw, thick, td);
    box(g, mats.grass, cx, yLocal + 0.03, cz, tw - 0.2, 0.08, td - 0.2);
    const ch = 0.22, cy = yLocal + 0.08;
    box(g, mats.stone, cx, cy, TERR.z1, tw, ch, 0.28);
    box(g, mats.stone, TERR.x0, cy, cz + 0.2, 0.28, ch, td - 0.4);
    box(g, mats.stone, TERR.x1, cy, cz + 0.2, 0.28, ch, td - 0.4);

    function path(x, z, sx, sz, yaw) {
      const m = new THREE.Mesh(GEO.body, mats.path);
      m.position.set(x, yLocal + 0.08, z); m.scale.set(sx, 0.06, sz); if (yaw) m.rotation.y = yaw; g.add(m);
    }
    const stemZ0 = TERR.z0, stemZ1 = GREEN.z - RING_R + 0.4;
    path(0, (stemZ0 + stemZ1) / 2, 2.3, Math.abs(stemZ1 - stemZ0), 0);
    const segs = 28, a0 = GAP0 * Math.PI / 180, a1 = GAP1 * Math.PI / 180;
    for (let i = 0; i < segs; i++) {
      const t0 = i / segs, t1 = (i + 1) / segs, aA = a0 + (a1 - a0) * t0, aB = a0 + (a1 - a0) * t1;
      const x0 = GREEN.x + RING_R * Math.sin(aA), z0 = GREEN.z - RING_R * Math.cos(aA);
      const x1 = GREEN.x + RING_R * Math.sin(aB), z1 = GREEN.z - RING_R * Math.cos(aB);
      const dx = x1 - x0, dz = z1 - z0, len = Math.hypot(dx, dz);
      path((x0 + x1) / 2, (z0 + z1) / 2, 1.7, len + 0.08, Math.atan2(dx, dz));
    }
    COT.forEach(c => {
      const dx = c.lx - GREEN.x, dz = c.lz - GREEN.z, dist = Math.hypot(dx, dz), nx = dx / dist, nz = dz / dist;
      const r0 = RING_R - 0.2, r1 = dist - HD - PD - 0.15, mid = (r0 + r1) / 2, len = Math.max(0.6, r1 - r0);
      path(GREEN.x + nx * mid, GREEN.z + nz * mid, 1.55, len, Math.atan2(nx, nz));
    });

    const mid = [];
    for (let i = 0; i < COT.length - 1; i++) mid.push((COT[i].ang + COT[i + 1].ang) / 2);
    mid.forEach((deg, i) => {
      const a = deg * Math.PI / 180, r = 39 + (i % 3) * 0.7;
      tree(g, mats, GREEN.x + r * Math.sin(a), yLocal, GREEN.z - r * Math.cos(a), 1.0 + (i % 3) * 0.12);
    });
    tree(g, mats, -6.5, yLocal, GREEN.z + 3, 1.05);
    tree(g, mats, 7.2, yLocal, GREEN.z - 2.2, 0.95);
    tree(g, mats, 0.5, yLocal, GREEN.z + 8, 1.1);
    for (let i = 0; i < 14; i++) {
      const a = (GAP0 + 8 + i * ((GAP1 - GAP0 - 16) / 13)) * Math.PI / 180, r = 10 + (i % 3) * 1.2;
      bush(g, mats, GREEN.x + r * Math.sin(a), yLocal, GREEN.z - r * Math.cos(a) * 0.9, 0.85 + (i % 3) * 0.15);
    }
    root.add(g); return g;
  }

  function gradeTerrain(wx0, wx1, wz0, wz1, yTop, berm) {
    const mesh = W3D.root && W3D.root.getObjectByName('terrain');
    if (!mesh || !mesh.geometry || !mesh.geometry.attributes.position) return;
    const p = mesh.geometry.attributes.position;
    if (!mesh.userData._fpCompY) {
      const src = new Float32Array(p.count);
      for (let i = 0; i < p.count; i++) src[i] = p.getY(i);
      mesh.userData._fpCompY = src;
    }
    const orig = mesh.userData._fpCompY;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      if (z < wz0 - 0.2 || x < wx0 - berm || x > wx1 + berm || z > wz1 + berm) continue;
      const dx = x < wx0 ? wx0 - x : x > wx1 ? x - wx1 : 0;
      const dz = z > wz1 ? z - wz1 : 0;
      const d = Math.hypot(dx, dz);
      if (d <= 0.01) p.setY(i, yTop);
      else if (d < berm) { const t = d / berm, s = t * t * (3 - 2 * t); p.setY(i, yTop + (orig[i] - yTop) * s); }
    }
    p.needsUpdate = true; mesh.geometry.computeVertexNormals();
  }

  function clearTrees(L) {
    if (!W3D.root) return; const m4 = new THREE.Matrix4(), p = new THREE.Vector3(), zero = new THREE.Matrix4().makeScale(0, 0, 0);
    W3D.root.traverse(o => { if (!o.isInstancedMesh || !/^(trees|trees-pitchpine|trees-pitchpine-trunk)$/.test(o.name)) return; let ch = 0;
      for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m4); p.setFromMatrixPosition(m4); if (p.x > L.x0 && p.x < L.x1 && p.z > L.z0 && p.z < L.z1) { hiddenTrees.push([o, i, m4.clone()]); o.setMatrixAt(i, zero); ch++; } }
      if (ch) o.instanceMatrix.needsUpdate = true; });
  }

  function norm(n) { return String(n || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }
  function armsDown(root) {
    const T = THREE, all = {};
    root.updateMatrixWorld(true);
    root.traverse(o => { if (o.isBone) all[norm(o.name).replace(/^bip0\d/, 'bip01')] = o; });
    const chest = all.bip01spine2 || all.bip01spine1 || all.bip01pelvis;
    const aim = (bone, child, dir) => {
      if (!bone || !child || !bone.parent) return;
      const P = bone.getWorldPosition(new T.Vector3()), C = child.getWorldPosition(new T.Vector3());
      const cur = C.sub(P).normalize(); if (cur.lengthSq() < 1e-8) return;
      const q = new T.Quaternion().setFromUnitVectors(cur, dir);
      const wq = bone.getWorldQuaternion(new T.Quaternion());
      const pq = bone.parent.getWorldQuaternion(new T.Quaternion()).invert();
      bone.quaternion.copy(pq.multiply(q.multiply(wq))); bone.updateMatrixWorld(true);
    };
    const hipX = chest ? chest.getWorldPosition(new T.Vector3()).x : 0;
    const L = {up: all.bip01lupperarm, fo: all.bip01lforearm, ha: all.bip01lhand};
    const R = {up: all.bip01rupperarm, fo: all.bip01rforearm, ha: all.bip01rhand};
    for (const s of [{b: L, side: 1}, {b: R, side: -1}]) {
      if (!s.b.up || !s.b.fo) continue;
      const side = Math.sign(s.b.up.getWorldPosition(new T.Vector3()).x - hipX) || s.side;
      aim(s.b.up, s.b.fo, new T.Vector3(side * 0.2, -1, 0.04).normalize());
      if (s.b.ha) aim(s.b.fo, s.b.ha, new T.Vector3(side * 0.08, -1, 0.32).normalize());
    }
  }
  function faceMinusZ(m) {
    const T = THREE, find = n => { let f = null; m.traverse(o => { if (!f && o.isBone && norm(o.name).replace(/^bip0\d/, 'bip01') === n) f = o; }); return f; };
    const head = find('bip01head'), le = find('bip01leye'), re = find('bip01reye');
    if (!(head && le && re)) { m.rotation.y += Math.PI; return; }
    const hp = head.getWorldPosition(new T.Vector3()), ep = le.getWorldPosition(new T.Vector3()).add(re.getWorldPosition(new T.Vector3())).multiplyScalar(0.5);
    const f = ep.sub(hp); f.y = 0; if (f.lengthSq() < 1e-8) return;
    const cur = Math.atan2(f.x, f.z); m.rotation.y += -cur + Math.PI; m.updateMatrixWorld(true);
  }
  function fit(m, targetH) {
    m.updateMatrixWorld(true);
    let box = new THREE.Box3().setFromObject(m), h = box.max.y - box.min.y;
    if (h < 0.2) return;
    if (targetH) m.scale.multiplyScalar(targetH / h);
    m.updateMatrixWorld(true);
    box = new THREE.Box3().setFromObject(m);
    const holdY = m.parent ? m.parent.getWorldPosition(new THREE.Vector3()).y : 0;
    m.position.y += holdY - box.min.y;
    m.updateMatrixWorld(true);
    faceMinusZ(m);
    armsDown(m);
  }
  function loadAvatar(spec) {
    const Loader = THREE.GLTFLoader;
    if (!Loader) return Promise.reject(new Error('no GLTFLoader'));
    const urls = [];
    if (spec && spec.url) urls.push(spec.url);
    const file = (spec && spec.avatar) || (typeof spec === 'string' ? spec : '');
    if (file) avBases().forEach(b => urls.push(b + file));
    const tryAt = i => i >= urls.length ? Promise.resolve(null)
      : new Loader().loadAsync(urls[i]).then(g => g.scene).catch(() => tryAt(i + 1));
    return tryAt(0);
  }
  function placePerson(parent, spec, targetH, x, z, yaw) {
    return loadAvatar(spec).then(scene => {
      if (!scene) return;
      const hold = new THREE.Group();
      hold.position.set(x, 0, z); hold.rotation.y = yaw;
      scene.traverse(o => { if (o.isMesh) { o.castShadow = false; o.frustumCulled = true; } });
      hold.add(scene); parent.add(hold); hold.updateMatrixWorld(true); fit(scene, targetH);
    }).catch(() => {});
  }
  function fillKids(c) {
    if (!c.group) return;
    if (c.kidGroup) { c.group.remove(c.kidGroup); }
    c.kidGroup = new THREE.Group(); c.group.add(c.kidGroup);
    const porchZ = -HD - PD - 0.35;
    (c.kids || []).forEach((k, i) => {
      placePerson(c.kidGroup, k.file, KH[k.age] || 1.1, i === 0 ? -1.05 : 1.05, porchZ - 0.55 - i * 0.15, i ? -0.15 : 0.15);
    });
  }
  function cottagePeople(c) {
    const porchZ = -HD - PD - 0.35;
    placePerson(c.group, c, c.th, 0.15, porchZ, 0);
    fillKids(c);
  }
  H.setKids = function (id, kids) {
    const c = COT.find(x => x.id === id); if (!c) return false;
    c.kids = (kids || []).slice(); fillKids(c); return true;
  };
  function addColliders(c, wx, wz, wy, yaw) {
    const ca = Math.cos(yaw), sa = Math.sin(yaw);
    const corners = (x0, x1, z0, z1) => {
      const pts = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]].map(([x, z]) => [wx + x * ca + z * sa, wz + -x * sa + z * ca]);
      const xs = pts.map(p => p[0]), zs = pts.map(p => p[1]);
      return {x0: Math.min.apply(null, xs), x1: Math.max.apply(null, xs), z0: Math.min.apply(null, zs), z1: Math.max.apply(null, zs)};
    };
    const fl = corners(-HW, HW, -HD - PD, HD); fl.y = wy + FY;
    if (W3D.floors) { W3D.floors.push(fl); added.floors.push(fl); }
    const wall = (x0, x1, z0, z1) => { const w = corners(x0, x1, z0, z1); w.y0 = wy + FY; w.y1 = wy + FY + WH; if (W3D.walls) { W3D.walls.push(w); added.walls.push(w); } };
    wall(-HW, HW, -HD, -HD + T); wall(-HW, HW, HD - T, HD); wall(-HW, -HW + T, -HD, HD); wall(HW - T, HW, -HD, HD);
    const zone = corners(-HW - 0.3, HW + 0.3, -HD - PD - 0.4, HD + 0.3);
    addZone({id: 'cottage-' + c.id, kind: 'cottage', x0: zone.x0, x1: zone.x1, z0: zone.z0, z1: zone.z1});
  }

  function distToLine(pts, x, z) {
    let best = null;
    for (let i = 0; i < pts.length - 1; i++) {
      const ax = pts[i][0], az = pts[i][1], bx = pts[i + 1][0], bz = pts[i + 1][1];
      const ex = bx - ax, ez = bz - az, L2 = ex * ex + ez * ez || 1;
      const t = Math.max(0, Math.min(1, ((x - ax) * ex + (z - az) * ez) / L2));
      const qx = ax + ex * t, qz = az + ez * t, d = Math.hypot(x - qx, z - qz), L = Math.sqrt(L2);
      const nx = -ez / L, nz = ex / L;
      if (!best || d < best.d) best = {d: d, x: qx, z: qz, nx: nx, nz: nz, t: t, i: i};
    }
    return best;
  }
  function railFillH(x, z) {
    const r = distToLine(RAIL_COVER, x, z), g = tH(x, z);
    if (!r || r.d > 16) return g;
    const bl = tH(x + r.nx * 14, z + r.nz * 14), br = tH(x - r.nx * 14, z - r.nz * 14);
    const bank = Math.max(bl, br, g);
    if (r.d <= 7.5) return bank;
    const u = (r.d - 7.5) / 8.5, sm = u * u * (3 - 2 * u);
    return bank + (g - bank) * sm;
  }
  function reshapeTerrain() {
    const mesh = W3D.root && W3D.root.getObjectByName('terrain');
    if (!mesh || !mesh.geometry || !mesh.geometry.attributes.position) return;
    const p = mesh.geometry.attributes.position;
    const half = 7.5, berm = 8.5, bCut = 0.58, bFeather = 3.2;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      let y = p.getY(i);
      const r = distToLine(RAIL_COVER, x, z);
      if (r && r.d < half + berm) {
        const filled = railFillH(x, z);
        if (filled > y) y = filled;
      }
      const b = distToLine(BROOK, x, z);
      if (b && b.d < BROOK_HW + bFeather) {
        const u = b.d <= BROOK_HW ? 1 : Math.max(0, 1 - (b.d - BROOK_HW) / bFeather);
        const sm = u * u * (3 - 2 * u);
        y -= bCut * sm;
      }
      p.setY(i, y);
    }
    p.needsUpdate = true; mesh.geometry.computeVertexNormals();
  }

  function brookAt(pts, s) {
    let acc = 0, target = s;
    for (let i = 0; i < pts.length - 1; i++) {
      const ax = pts[i][0], az = pts[i][1], bx = pts[i + 1][0], bz = pts[i + 1][1];
      const L = Math.hypot(bx - ax, bz - az);
      if (acc + L >= target) {
        const t = (target - acc) / (L || 1), tx = (bx - ax) / (L || 1), tz = (bz - az) / (L || 1);
        return {x: ax + (bx - ax) * t, z: az + (bz - az) * t, tx: tx, tz: tz};
      }
      acc += L;
    }
    const n = pts.length, a = pts[n - 2], b = pts[n - 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return {x: b[0], z: b[1], tx: (b[0] - a[0]) / L, tz: (b[1] - a[1]) / L};
  }
  function brookLen(pts) {
    let n = 0; for (let i = 0; i < pts.length - 1; i++) n += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    return n;
  }
  function addBrook(root, mats) {
    const WATER = (window.W3D && W3D.water && (W3D.water.water || (W3D.water.pond && W3D.water.pond.level))) || 16.5;
    const pts = BROOK, hw = BROOK_HW, lev = [];
    for (let i = 0; i < pts.length; i++) {
      const g = tH(pts[i][0], pts[i][1]);
      const y = Math.min(g - 0.16, WATER - 0.08);
      lev.push(y);
    }
    const pos = [], idx = []; let k = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const ax = pts[i][0], az = pts[i][1], bx = pts[i + 1][0], bz = pts[i + 1][1], L = Math.hypot(bx - ax, bz - az);
      const n = Math.max(1, Math.ceil(L / 4)); if (L < 1e-6) continue;
      for (let j = (i ? 1 : 0); j <= n; j++) {
        const t = j / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t, y = lev[i] + (lev[i + 1] - lev[i]) * t;
        const p0 = pts[Math.max(0, i - (t === 0 ? 1 : 0))], p1 = pts[Math.min(pts.length - 1, i + 1 + (t === 1 ? 1 : 0))];
        let tx = p1[0] - p0[0], tz = p1[1] - p0[1], tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
        pos.push(x - tz * hw, y, z + tx * hw, x + tz * hw, y, z - tx * hw);
        if (k) idx.push(2 * k - 2, 2 * k - 1, 2 * k, 2 * k - 1, 2 * k + 1, 2 * k); k++;
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx);
    geo.computeVertexNormals();
    const nr = geo.attributes.normal; for (let i = 0; i < nr.count; i++) if (nr.getY(i) < 0) nr.setXYZ(i, -nr.getX(i), -nr.getY(i), -nr.getZ(i));
    const water = new THREE.MeshLambertMaterial({color: 0x3e8aa0, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false});
    const mesh = new THREE.Mesh(geo, water); mesh.name = 'fp-brook'; mesh.receiveShadow = true; root.add(mesh);
    /* low grassy lips along the banks */
    const bankPos = [], bankIdx = []; let bk = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const ax = pts[i][0], az = pts[i][1], bx = pts[i + 1][0], bz = pts[i + 1][1], L = Math.hypot(bx - ax, bz - az);
      const n = Math.max(1, Math.ceil(L / 5)); if (L < 1e-6) continue;
      for (let j = (i ? 1 : 0); j <= n; j++) {
        const t = j / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t, y = lev[i] + (lev[i + 1] - lev[i]) * t;
        const p0 = pts[Math.max(0, i - (t === 0 ? 1 : 0))], p1 = pts[Math.min(pts.length - 1, i + 1 + (t === 1 ? 1 : 0))];
        let tx = p1[0] - p0[0], tz = p1[1] - p0[1], tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
        for (const sd of [-1, 1]) {
          const ix = x + (-tz) * sd * (hw - 0.1), iz = z + tx * sd * (hw - 0.1);
          const ox = x + (-tz) * sd * (hw + 1.6), oz = z + tx * sd * (hw + 1.6);
          bankPos.push(ix, y + 0.04, iz, ox, tH(ox, oz) + 0.06, oz);
        }
        if (bk) {
          const a = (bk - 1) * 4, b = bk * 4;
          bankIdx.push(a, a + 1, b, a + 1, b + 1, b, a + 2, b + 2, a + 3, a + 3, b + 2, b + 3);
        }
        bk++;
      }
    }
    const bg = new THREE.BufferGeometry();
    bg.setAttribute('position', new THREE.Float32BufferAttribute(bankPos, 3)); bg.setIndex(bankIdx);
    bg.computeVertexNormals();
    const banks = new THREE.Mesh(bg, mats.grass.clone()); banks.name = 'fp-brook-bank'; banks.receiveShadow = true; root.add(banks);
    H.brook = {pts: pts, lev: lev, hw: hw, mouth: {x: pts[0][0], z: pts[0][1]}, drainsTo: 'east cove of the pond'};
    return {pts, lev, hw};
  }
  function addFootbridge(root, mats, ox, oz) {
    /* Path crosses the brook on the green's east line (world z = origin.z + GREEN.z). */
    const zCross = oz + GREEN.z;
    let hit = null, acc = 0;
    for (let i = 0; i < BROOK.length - 1; i++) {
      const ax = BROOK[i][0], az = BROOK[i][1], bx = BROOK[i + 1][0], bz = BROOK[i + 1][1];
      if ((az - zCross) * (bz - zCross) <= 0 && az !== bz) {
        const t = (zCross - az) / (bz - az), x = ax + (bx - ax) * t, z = zCross;
        const L = Math.hypot(bx - ax, bz - az) || 1;
        hit = {x: x, z: z, tx: (bx - ax) / L, tz: (bz - az) / L, s: acc + t * L};
        break;
      }
      acc += Math.hypot(bx - ax, bz - az);
    }
    if (!hit) return null;
    const span = BROOK_HW * 2 + 3.2, w = 2.2, rise = 0.7;
    const y0 = tH(hit.x, hit.z) + 0.08;
    const g = new THREE.Group(); g.name = 'fp-brook-bridge'; g.position.set(hit.x, y0, hit.z);
    g.rotation.y = Math.atan2(hit.tx, hit.tz);
    const plank = new THREE.MeshLambertMaterial({color: 0x9a7a52});
    const railM = new THREE.MeshLambertMaterial({color: 0x6e5538});
    box(g, plank, 0, 0.12, 0, w, 0.16, span);
    for (let i = -3; i <= 3; i++) box(g, plank, 0, 0.15, i * (span / 7), w + 0.04, 0.05, 0.22);
    for (const sd of [-1, 1]) {
      box(g, railM, sd * (w / 2 - 0.07), 0.7, 0, 0.1, 0.9, span + 0.15);
      for (const end of [-1, 1]) box(g, railM, sd * (w / 2 - 0.06), 0.4, end * (span / 2), 0.1, 0.8, 0.1);
    }
    for (const end of [-1, 1]) box(g, mats.stone, 0, -0.15, end * (span / 2 + 0.15), w + 0.4, 0.45, 0.55);
    root.add(g);
    /* Draped path from the ring out to the west abutment. */
    /* The green is west of the brook; run a path along +x at z = zCross. */
    const x0 = ox + GREEN.x + RING_R + 0.2, x1 = hit.x - (BROOK_HW + 1.4), z = zCross, pw = 1.55;
    if (x1 > x0 + 1) {
      const segs = Math.max(2, Math.ceil((x1 - x0) / 4)), ppos = [], pidx = []; let pk = 0;
      for (let i = 0; i <= segs; i++) {
        const x = x0 + (x1 - x0) * i / segs, y = tH(x, z) + 0.07;
        ppos.push(x, y, z - pw / 2, x, y, z + pw / 2);
        if (pk) pidx.push(2 * pk - 2, 2 * pk, 2 * pk - 1, 2 * pk - 1, 2 * pk, 2 * pk + 1); pk++;
      }
      const pg = new THREE.BufferGeometry();
      pg.setAttribute('position', new THREE.Float32BufferAttribute(ppos, 3)); pg.setIndex(pidx);
      pg.computeVertexNormals();
      const path = new THREE.Mesh(pg, mats.path); path.name = 'fp-brook-path'; path.receiveShadow = true; root.add(path);
      if (W3D.floors) {
        const fl = {x0: x0, x1: x1, z0: z - pw / 2, z1: z + pw / 2, y: y0};
        W3D.floors.push(fl); added.floors.push(fl);
      }
    }
    H.bridge = {x: hit.x, z: hit.z};
    return hit;
  }
  function addRailCover(root, mats) {
    const pts = RAIL_COVER, half = 12, pos = [], idx = []; let k = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const ax = pts[i][0], az = pts[i][1], bx = pts[i + 1][0], bz = pts[i + 1][1], L = Math.hypot(bx - ax, bz - az);
      const n = Math.max(2, Math.ceil(L / 3)); if (L < 1e-6) continue;
      for (let j = (i ? 1 : 0); j <= n; j++) {
        const t = j / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t;
        const p0 = pts[Math.max(0, i - (t === 0 ? 1 : 0))], p1 = pts[Math.min(pts.length - 1, i + 1 + (t === 1 ? 1 : 0))];
        let tx = p1[0] - p0[0], tz = p1[1] - p0[1], tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
        const y = railFillH(x, z) + 0.06;
        pos.push(x - tz * half, y, z + tx * half, x + tz * half, y, z - tx * half);
        if (k) idx.push(2 * k - 2, 2 * k, 2 * k - 1, 2 * k - 1, 2 * k, 2 * k + 1); k++;
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx);
    geo.computeVertexNormals();
    const nr = geo.attributes.normal; for (let i = 0; i < nr.count; i++) if (nr.getY(i) < 0) nr.setXYZ(i, -nr.getX(i), -nr.getY(i), -nr.getZ(i));
    const coverM = mats.earth.clone(); coverM.color.set('#6a6848');
    const mesh = new THREE.Mesh(geo, coverM); mesh.name = 'fp-rail-cover'; mesh.receiveShadow = true; root.add(mesh);
    const xs = pts.map(p => p[0]), zs = pts.map(p => p[1]);
    clearTrees({x0: Math.min.apply(null, xs) - half, x1: Math.max.apply(null, xs) + half,
      z0: Math.min.apply(null, zs) - 2, z1: Math.max.apply(null, zs) + 2});
  }

  function mount() {
    if (group || !window.W3D || !W3D.root || typeof THREE === 'undefined') return;
    const site = (window.FP_HOME && FP_HOME.site) || {x: SITE.x, y: tH(SITE.x, SITE.z), z: SITE.z};
    origin = {x: site.x, y: site.y, z: site.z};
    const X = materials();
    const mats = {
      siding: mat(C.siding, X.clap), trim: mat(C.trim), roof: mat(C.roof, X.shingle), stone: mat(C.stone),
      deck: mat(C.deck), door: mat(C.door), shutter: mat(C.shutter), glass: mat(C.glass),
      grass: mat(C.grass, X.grass), path: mat(C.path), bush: mat(C.bush), earth: mat(C.earth), trunk: mat(C.trunk),
      leaf: C.leaf.map(col => mat(col))
    };
    const yFence = tH(origin.x, origin.z + TERR.z0);
    let yMin = yFence;
    for (let x = TERR.x0; x <= TERR.x1; x += 6) for (let z = TERR.z0; z <= TERR.z1; z += 6)
      yMin = Math.min(yMin, tH(origin.x + x, origin.z + z));
    const yTop = yFence, yLocal = yTop - origin.y, yMinLocal = yMin - origin.y;
    const berm = 8, wx0 = origin.x + TERR.x0, wx1 = origin.x + TERR.x1, wz0 = origin.z + TERR.z0, wz1 = origin.z + TERR.z1;
    gradeTerrain(wx0, wx1, wz0, wz1, yTop, berm);
    reshapeTerrain();
    setTimeout(() => { gradeTerrain(wx0, wx1, wz0, wz1, yTop, berm); reshapeTerrain(); }, 2500);

    group = new THREE.Group(); group.name = 'fp-compound'; group.position.set(origin.x, origin.y, origin.z);
    terrace(group, mats, yLocal, yMinLocal);

    COT.forEach(c => {
      const wrap = new THREE.Group();
      wrap.position.set(c.lx, yLocal, c.lz);
      wrap.rotation.y = c.yaw;
      wrap.rotation.x = 0; wrap.rotation.z = 0;
      wrap.name = 'fp-cottage';
      cottageAt(wrap, mats);
      group.add(wrap);
      c.group = wrap;
      cottagePeople(c);
      addColliders(c, origin.x + c.lx, origin.z + c.lz, yTop, c.yaw);
    });

    W3D.root.add(group);
    const pad = {x0: wx0 - berm, x1: wx1 + berm, z0: wz0, z1: wz1 + berm, y: yTop};
    if (W3D.floors) { W3D.floors.push(pad); added.floors.push(pad); }
    clearTrees({x0: pad.x0, x1: pad.x1, z0: pad.z0, z1: pad.z1});
    addBrook(W3D.root, mats);
    addFootbridge(W3D.root, mats, origin.x, origin.z);
    addRailCover(W3D.root, mats);
    W3D.keepOut = W3D.keepOut || [];
    keepOut = {x: origin.x + GREEN.x, z: origin.z + GREEN.z, r: 54, name: 'the family compound'};
    W3D.keepOut.push(keepOut);
    maskHook = ({rect, line}) => {
      rect(wx0, wz0, wx1, wz1, 14);
      if (line) { line(RAIL_COVER, 18); line(BROOK, 10); }
    };
    W3D.maskHooks = W3D.maskHooks || []; W3D.maskHooks.push(maskHook);
    if (W3D.realEarth && W3D.realEarth.rebuildMask) W3D.realEarth.rebuildMask();
    gHook = (x, z) => {
      if (x >= wx0 && x <= wx1 && z >= wz0 && z <= wz1) return yTop;
      const r = distToLine(RAIL_COVER, x, z);
      if (r && r.d <= 8) return railFillH(x, z);
      return null;
    };
    W3D.gHooks = W3D.gHooks || []; W3D.gHooks.push(gHook);
    houseZone(); groundsZone(); wireMovement();

    H.ready = true; H.origin = origin; H.yTop = yTop;
    H.cottages = COT.map(c => ({id: c.id, x: origin.x + c.lx, z: origin.z + c.lz, kids: (c.kids || []).length}));
    console.log('fp-compound: terrace at', yTop.toFixed(2), COT.length + ' cottages');
    const sc = document.querySelector('a-scene'); if (sc) sc.emit('fp-compound-ready', H, false);
  }

  setInterval(() => {
    if (!group || !origin) return;
    const c = document.querySelector('a-scene'), cam = c && c.camera; if (!cam) return;
    const e = cam.matrixWorld.elements;
    group.visible = Math.hypot(e[12] - origin.x, e[14] - origin.z) < SHOW_D;
  }, 1000);

  function boot(n) {
    if (!(window.W3D_READY && window.W3D && W3D.root && W3D.terrainH && window.FP_HOME && FP_HOME.ready && FP_HOME.site)) {
      if (n < 2000) setTimeout(() => boot(n + 1), 200);
      return;
    }
    mount();
  }
  window.addEventListener('fp-home-ready', () => boot(0));
  boot(0);
})();
