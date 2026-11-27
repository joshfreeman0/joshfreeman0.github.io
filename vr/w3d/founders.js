/* Accounts + people layer in Fowling Pond (T-25 / T-30, Nov 27 2026).
   - Wires fpacct.js (API) and fpacct-ui.js (2D panel) into the world: Account button in the menu, presence (world 'fowling'),
     your profile name on your multiplayer avatar, and your account id in the pose so friends' invites can find you (mp.js 'a').
   - Invites: ?join=<account id> (or Join from the panels) finds that person in the shared multiplayer room and puts you beside them
     with the friends Go fade - same page, so a Quest stays in VR.
   - Left-wrist People panel (beside the Friends panel): invites (Join), friend requests (Accept), intros waiting for Josh
     (Approve / No, admin only), and friends online with the world they're in (Invite).
   - Founders Hall: an open stone hall north of the Star Fleet base by the launch pad (not on any protected site). The back wall is the
     project board (up to 8 cards); four pitch booths show a project each (poster, description, link, maker) with Follow / Cheer /
     Offer help / Intro buttons. Open booths glow. No money handling anywhere. Lean: ~20 meshes, canvas text, built only within 600 m. */
(function () {
  'use strict';
  const W3D = window.W3D = window.W3D || {};
  const hud = t => { if (W3D.toast) W3D.toast(t, 3000); else if (window.JFVR && JFVR.hud) JFVR.hud(t); };
  const FPA = window.FPA, UI = window.FPAUI; if (!FPA || !UI) return;
  FPA.init({world: 'fowling'});
  (function mountBtn() { const t = document.querySelector('#ui .tools'); if (!t) return setTimeout(mountBtn, 500); UI.mount(t); })();
  function syncMP() { const MP = window.JFMP; if (!MP) return; if (FPA.me) { MP.acct = FPA.me.id; if (FPA.me.profile && FPA.me.profile.name) MP.name = FPA.me.profile.name.slice(0, 24); } else MP.acct = null; }
  window.addEventListener('fpa-user', syncMP); setTimeout(syncMP, 3000);

  /* ---------- join a friend (invites) ---------- */
  let joinT = null;
  // also called by Red Planet Lounge in host mode (a Fowling Pond invite accepted on Mars): leave the Mars room first, cleanly via
  // FP_ROOMS (deferred a tick so RPL is not unmounted inside its own handler), then find the friend on Earth
  window.FPJOIN = async acct => { clearInterval(joinT);
    if (window.FP_ROOMS && FP_ROOMS.current) { await new Promise(r => setTimeout(r, 0)); if (FP_ROOMS.current) await FP_ROOMS.leave({arrive: false}); }
    const t0 = Date.now(); let told = false;
    joinT = setInterval(() => { const MP = window.JFMP, FR = W3D.friends; if (!window.W3D_READY || !MP || !FR) return;
      const id = Object.keys(MP.peers || {}).find(k => MP.peers[k].acct === acct);
      if (id && MP.peers[id].tp) { clearInterval(joinT); FR.go(id); return; }
      if (!told) { told = true; hud('Finding your friend...'); }
      if (Date.now() - t0 > 45000) { clearInterval(joinT); hud('Your friend is not in Fowling Pond right now'); } }, 700); };
  const QJ = new URLSearchParams(location.search), jq = QJ.get('join'); if (jq && /^u[a-z0-9]{6,20}$/.test(jq) && !/^(mars|rpl|red-planet)/i.test(QJ.get('room') || QJ.get('spot') || '')) window.FPJOIN(jq);   // ?room=mars&join=: a Mars invite, not an Earth join
  async function acceptAndJoin(inv) { const r = await FPA.acceptInvite(inv.id); UI.join(r); FPA.pollInbox(); }

  /* ---------- left-wrist People panel ---------- */
  const fromLeft = ev => { const ce = ev.detail && ev.detail.cursorEl, lc = ce && ce.getAttribute && ce.getAttribute('laser-controls'); return !!(lc && /left/.test(typeof lc === 'string' ? lc : lc.hand)); };
  const PW = 0.2, ROWS = 5, RH = 0.032, PH = RH * ROWS + 0.04;
  let pp = null, pCtx, pTex, pBtns = [], pRows = [], friendsCache = {friends: []}, adminCache = [], lastF = 0, sig = '';
  function canvasLabel(el, w, h, bg) { const c = document.createElement('canvas'); c.width = 192; c.height = Math.round(192 * h / w); const g = c.getContext('2d'); const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({map: tex, transparent: true, depthTest: false, depthWrite: false, toneMapped: false})); m.position.z = 0.001; m.renderOrder = 3004; el.object3D.add(m);
    return t => { g.clearRect(0, 0, c.width, c.height); g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height); g.fillStyle = '#111'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold ' + Math.round(c.height * 0.5) + 'px Arial'; g.fillText(t, c.width / 2, c.height / 2 + 1); tex.needsUpdate = true; }; }
  function hitPlane(parent, w, h, x, y) { const b = document.createElement('a-plane'); b.setAttribute('class', 'btn'); b.setAttribute('width', w); b.setAttribute('height', h); b.setAttribute('position', `${x} ${y.toFixed(4)} 0.002`);
    b.setAttribute('material', 'shader:flat;transparent:true;opacity:0;depthTest:false;depthWrite:false'); parent.appendChild(b); return b; }
  function buildPeople() { const FR = W3D.friends, wr = FR && FR.wrist && FR.wrist(); if (!wr || pp) return pp;
    pp = document.createElement('a-entity'); pp.setAttribute('position', (PW + 0.025) + ' 0 0'); wr.appendChild(pp);
    pp.addEventListener('loaded', () => {
      const c = document.createElement('canvas'); c.width = 512; c.height = Math.round(512 * PH / PW); pCtx = c.getContext('2d'); pTex = new THREE.CanvasTexture(c); pTex.colorSpace = THREE.SRGBColorSpace;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), new THREE.MeshBasicMaterial({map: pTex, transparent: true, depthTest: false, depthWrite: false, toneMapped: false})); m.position.y = -PH / 2 + 0.035 * 3; m.renderOrder = 3000; pp.object3D.add(m); pp._top = m.position.y + PH / 2;
      const blk = hitPlane(pp, PW, PH, 0, m.position.y); blk.dataset.blocker = '1'; blk.object3D.position.z = 0.0005;
      for (let i = 0; i < ROWS; i++) { const y = pp._top - 0.04 - RH * i - RH / 2; const row = [];
        for (const [x, w] of [[0.072, 0.05], [0.02, 0.05]]) { const b = hitPlane(pp, w, 0.024, x, y); b.object3D.renderOrder = 3001; const set = canvasLabel(b, w, 0.024, '#ffd700');
          const k = row.length; b.addEventListener('click', ev => { if (fromLeft(ev)) return; const r = pRows[i]; const a = r && r.acts[k]; if (a) a.fn().catch(e => hud('Error: ' + e.message)).then(() => { sig = ''; lastF = 0; }); }); row.push({b, set}); }
        pBtns.push(row); }
      drawPeople(); setTimeout(() => document.querySelectorAll('[raycaster]').forEach(r => r.components.raycaster && r.components.raycaster.refreshObjects()), 300); });
    return pp; }
  function rowsNow() { const out = [], ib = FPA.inbox || {};
    (ib.invites || []).forEach(i => out.push({t: i.name + ' invites you', s: i.world === 'mars' ? 'to Mars' : 'to Fowling Pond', acts: [{l: 'Join', fn: () => acceptAndJoin(i)}, {l: 'No', fn: () => FPA.declineInvite(i.id).then(FPA.pollInbox)}]}));
    (ib.friend_requests || []).forEach(f => out.push({t: f.name, s: 'wants to be friends', acts: [{l: 'Accept', fn: () => FPA.acceptFriend(f.id).then(FPA.pollInbox)}, {l: 'No', fn: () => FPA.declineFriend(f.id).then(FPA.pollInbox)}]}));
    (ib.intro_requests || []).forEach(n => out.push({t: n.name, s: 'asks for an intro', acts: [{l: 'Yes', fn: () => FPA.introYes(n.id).then(FPA.pollInbox)}, {l: 'No', fn: () => FPA.introNo(n.id).then(FPA.pollInbox)}]}));
    adminCache.filter(n => n.to_yes).forEach(n => out.push({t: n.from_name + ' > ' + n.to_name, s: 'intro: approve?', acts: [{l: 'Approve', fn: () => FPA.admin.approve(n.id)}, {l: 'No', fn: () => FPA.admin.decline(n.id)}]}));
    friendsCache.friends.filter(f => f.online).forEach(f => out.push({t: f.name, s: f.world === 'mars' ? 'on Mars' : f.world === 'tesseract' ? 'in Tesseract' : 'in Fowling Pond', on: 1, acts: [{l: 'Invite', fn: () => FPA.invite(f.id).then(() => hud('Invite sent to ' + f.name))}]}));
    friendsCache.friends.filter(f => !f.online).forEach(f => out.push({t: f.name, s: 'offline', acts: []}));
    return out.slice(0, ROWS); }
  function drawPeople() { if (!pCtx) return; pRows = rowsNow(); const s = JSON.stringify(pRows.map(r => [r.t, r.s, r.acts.map(a => a.l)])) + (FPA.me ? FPA.me.id : ''); if (s === sig) return; sig = s;
    const g = pCtx, W = 512, H = pCtx.canvas.height, k = H / PH; g.clearRect(0, 0, W, H); g.fillStyle = 'rgba(11,29,38,0.92)'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#9be37a'; g.font = 'bold 30px Arial'; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillText(FPA.me ? 'People - ' + FPA.me.profile.name.slice(0, 16) : 'People', 16, 0.02 * k);
    if (!FPA.me) { g.fillStyle = '#ffe9a8'; g.font = '24px Arial'; ['Sign in from the menu:', 'Account (on the 2D screen)', 'to see friends here'].forEach((t, i) => g.fillText(t, 16, (0.05 + i * 0.03) * k)); }
    else if (!pRows.length) { g.fillStyle = '#ffe9a8'; g.font = '24px Arial'; g.fillText('No friends online yet', 16, 0.06 * k); g.fillText('Add friends: Account > People', 16, 0.09 * k); }
    pRows.forEach((r, i) => { const y = (0.04 + RH * i + RH / 2) * k; g.fillStyle = r.on ? '#9be37a' : '#ffd700'; g.beginPath(); g.arc(22, y, 8, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.font = 'bold 24px Arial'; g.fillText(r.t.slice(0, 18), 40, y - 11); g.fillStyle = '#ffe9a8'; g.font = '20px Arial'; g.fillText(r.s, 40, y + 13); });
    pTex.needsUpdate = true;
    pBtns.forEach((row, i) => { const acts = (pRows[i] && pRows[i].acts) || []; row.forEach((b, j) => { const a = acts[j]; b.b.object3D.visible = !!a; if (a) b.set(a.l); if (a) b.b.classList.add('btn'); else b.b.classList.remove('btn'); }); }); }
  async function refreshFriends() { if (!FPA.me) return; lastF = performance.now(); try { friendsCache = await FPA.friends(); if (FPA.me.admin) adminCache = await FPA.admin.intros(); } catch (e) {} drawPeople(); }
  window.addEventListener('fpa-inbox', () => drawPeople()); window.addEventListener('fpa-user', () => { sig = ''; refreshFriends(); });
  setInterval(() => { const FR = W3D.friends; if (!FR || !FR.wrist || !FR.wrist()) return; buildPeople(); const vis = FR.wrist().object3D.visible;
    if (vis && performance.now() - lastF > 20000) refreshFriends(); else if (vis) drawPeople(); }, 1000);

  /* ---------- Founders Hall ---------- */
  const PAD = {x: 9617.0, z: -2976.9};
  const X0 = PAD.x - 52, X1 = PAD.x - 36, ZC = PAD.z - 44, HW = 8, WH = 4.8, T = 0.4, LOAD = 600, DROP = 850, BOOTHS = 4;
  let grp = null, gy = null, walls = [], floor = null, board = null, booths = [], projects = [], lastP = 0;
  function canvasMesh(w, h, px) { const c = document.createElement('canvas'); c.width = px; c.height = Math.round(px * h / w); const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({map: tex, toneMapped: false})); m.userData = {c, g: c.getContext('2d'), tex}; return m; }
  function wrap(g, text, maxW, maxL) { const words = String(text || '').split(/\s+/), lines = []; let cur = ''; for (const w of words) { const t = cur ? cur + ' ' + w : w; if (g.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; if (lines.length >= maxL) break; } else cur = t; } if (cur && lines.length < maxL) lines.push(cur); return lines; }
  function frame(g, W, H, bg) { g.fillStyle = bg || '#0b1d26'; g.fillRect(0, 0, W, H); g.strokeStyle = '#d4af37'; g.lineWidth = 12; g.strokeRect(6, 6, W - 12, H - 12); }
  function drawBoard() { if (!board) return; const {g, c, tex} = board.userData, W = c.width, H = c.height; frame(g, W, H);
    g.fillStyle = '#FFD700'; g.font = 'bold 80px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'top'; g.fillText('FOUNDERS HALL', W / 2, 30);
    g.fillStyle = '#9ffcff'; g.font = '36px Arial'; g.fillText('Makers pitch. Visitors and backers follow, cheer and offer time and skills. People first, for the long run.', W / 2, 122);
    const list = projects.slice(0, 8), cw = (W - 120) / 4, ch = (H - 260) / 2;
    if (!list.length) { g.fillStyle = '#ffe9a8'; g.font = '44px Arial'; g.fillText('No projects yet - pitch yours from Account > Founders Hall', W / 2, H / 2); }
    list.forEach((p, i) => { const x = 40 + (i % 4) * (cw + 13), y = 190 + Math.floor(i / 4) * (ch + 20); g.fillStyle = p.open_now ? '#1f3d1f' : '#132e3a'; g.fillRect(x, y, cw, ch); g.strokeStyle = p.open_now ? '#9be37a' : '#d4af37'; g.lineWidth = 5; g.strokeRect(x, y, cw, ch);
      g.textAlign = 'left'; g.fillStyle = '#FFD700'; g.font = 'bold 40px Arial'; wrap(g, p.title, cw - 30, 2).forEach((l, k) => g.fillText(l, x + 15, y + 14 + k * 46));
      g.fillStyle = '#9ffcff'; g.font = '28px Arial'; g.fillText('by ' + p.maker_name, x + 15, y + 112); g.fillStyle = '#f2ead8'; g.font = '26px Arial'; wrap(g, p.description, cw - 30, 4).forEach((l, k) => g.fillText(l, x + 15, y + 152 + k * 32));
      g.fillStyle = p.open_now ? '#9be37a' : '#ffe9a8'; g.font = 'bold 26px Arial'; g.fillText((p.open_now ? 'OPEN NOW  ' : '') + p.followers + ' following  ' + p.cheers + ' cheers', x + 15, y + ch - 40); });
    g.textAlign = 'center'; g.fillStyle = '#c9c2b0'; g.font = '28px Arial'; g.fillText('Intros need both people to say yes. No money changes hands here.', W / 2, H - 52); tex.needsUpdate = true; }
  function drawBooth(b) { const p = b.p, {g, c, tex} = b.m.userData, W = c.width, H = c.height; frame(g, W, H, p && p.open_now ? '#12301a' : '#0b1d26'); g.textAlign = 'left'; g.textBaseline = 'top';
    if (!p) { g.fillStyle = '#ffe9a8'; g.font = 'bold 48px Arial'; g.fillText('Open booth', 50, 50); g.font = '34px Arial'; wrap(g, 'Pitch a project from Account > Founders Hall on the 2D screen and it appears here.', W - 100, 6).forEach((l, k) => g.fillText(l, 50, 130 + k * 44)); tex.needsUpdate = true; return; }
    let y = 40; if (b.img && b.img.complete && b.img.naturalWidth) { const s = Math.min((W - 100) / b.img.naturalWidth, 300 / b.img.naturalHeight); g.drawImage(b.img, 50, y, b.img.naturalWidth * s, b.img.naturalHeight * s); y += b.img.naturalHeight * s + 20; }
    g.fillStyle = '#FFD700'; g.font = 'bold 54px Georgia, serif'; wrap(g, p.title, W - 100, 2).forEach(l => { g.fillText(l, 50, y); y += 62; });
    g.fillStyle = '#9ffcff'; g.font = '32px Arial'; g.fillText('Maker: ' + p.maker_name + (p.open_now ? '   - OPEN NOW' : ''), 50, y + 4); y += 52;
    g.fillStyle = '#f2ead8'; g.font = '30px Arial'; wrap(g, p.description, W - 100, Math.max(2, Math.floor((H - y - 140) / 38))).forEach(l => { g.fillText(l, 50, y); y += 38; });
    g.fillStyle = '#c9c2b0'; g.font = '26px Arial'; if (p.open_hours) g.fillText('Open hours: ' + p.open_hours, 50, H - 110); if (p.link) g.fillText(p.link.slice(0, 60), 50, H - 72); tex.needsUpdate = true; }
  async function loadProjects() { lastP = performance.now(); try { projects = await FPA.projects(); } catch (e) {}
    drawBoard(); booths.forEach((b, i) => { const p = projects[i] || null; if ((b.p && b.p.id) !== (p && p.id) && p) { b.img = null; const u = FPA.posterUrl(p); if (u) { b.img = new Image(); b.img.crossOrigin = 'anonymous'; b.img.onload = () => drawBooth(b); b.img.src = u; } }
      b.p = p; drawBooth(b); b.btns.forEach(x => { x.e.object3D.visible = !!p; if (p) x.e.querySelector('a-plane').classList.add('btn'); else x.e.querySelector('a-plane').classList.remove('btn'); }); b.btns[0].set(p && p.following ? 'Unfollow' : 'Follow'); }); }
  async function act(b, kind) { const p = b.p; if (!p) return; try { await FPA.ensure(); if (p.mine) { hud('This is your booth'); return; }
      if (kind === 'follow') { await (p.following ? FPA.unfollow(p.id) : FPA.follow(p.id)); hud(p.following ? 'Unfollowed' : 'Following ' + p.title); }
      if (kind === 'cheer') { await FPA.encourage(p.id, 'Cheering you on! (from the booth)'); hud('Cheer sent to ' + p.maker_name); }
      if (kind === 'offer') { await FPA.offer(p.id, 'I can offer time and skills - see my profile. (from the booth)'); hud('Offer sent - ' + p.maker_name + ' can see your profile'); }
      if (kind === 'intro') { await FPA.askIntro(p.maker, 'Met your booth: ' + p.title, p.id); hud('Intro asked: ' + p.maker_name + ' says yes, then Josh approves'); }
      loadProjects(); } catch (e) { hud(e.message === 'not_found' ? 'Make your profile visible first (Account > Profile)' : e.message === 'already_pending' ? 'An intro is already waiting' : 'Error: ' + e.message); } }
  function ground() { const GA = W3D.groundAt; if (!GA) return null; let m = -1e9; const F = W3D.floors, fi = F && floor ? F.indexOf(floor) : -1; if (fi >= 0) F.splice(fi, 1);
    for (const x of [X0, (X0 + X1) / 2, X1]) for (const z of [ZC - HW, ZC, ZC + HW]) { const h = GA(x, z, 80); if (isFinite(h)) m = Math.max(m, h); } if (fi >= 0) F.push(floor); return m > -1e8 ? m : null; }
  function colliders(y) { const W = W3D.walls, F = W3D.floors; if (!W || !F) return; walls.forEach(w => { const i = W.indexOf(w); if (i >= 0) W.splice(i, 1); }); if (floor) { const i = F.indexOf(floor); if (i >= 0) F.splice(i, 1); }
    const fy = y + 0.35; walls = [{x0: X0 - 0.3, x1: X0 + T, z0: ZC - HW, z1: ZC + HW, y0: fy, y1: fy + WH}, {x0: X0, x1: X1, z0: ZC - HW - 0.2, z1: ZC - HW + T, y0: fy, y1: fy + WH}, {x0: X0, x1: X1, z0: ZC + HW - T, z1: ZC + HW + 0.2, y0: fy, y1: fy + WH}];
    walls.forEach(w => W.push(w)); floor = {x0: X0, x1: X1 + 1.2, z0: ZC - HW, z1: ZC + HW, y: fy}; F.push(floor); }
  function btnEnt(label, x, y, z, ry, w, fn) { const e = document.createElement('a-entity'); e.setAttribute('position', `${x} ${y} ${z}`); e.setAttribute('rotation', `0 ${ry} 0`);
    const hit = document.createElement('a-plane'); hit.setAttribute('class', 'btn'); hit.setAttribute('width', w); hit.setAttribute('height', 0.42); hit.setAttribute('material', 'shader:flat;transparent:true;opacity:0'); hit.addEventListener('click', fn); e.appendChild(hit);
    const m = canvasMesh(w, 0.42, 256); m.position.z = 0.005; let txt = label; const set = t => { txt = t; const {g, c, tex} = m.userData; g.fillStyle = '#FFD700'; g.fillRect(0, 0, c.width, c.height); g.strokeStyle = '#7a5c12'; g.lineWidth = 8; g.strokeRect(4, 4, c.width - 8, c.height - 8);
      g.fillStyle = '#111'; g.font = 'bold 34px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, c.width / 2, c.height / 2 + 2); tex.needsUpdate = true; }; set(label);
    e.addEventListener('loaded', () => e.object3D.add(m)); document.querySelector('a-scene').appendChild(e); return {e, set}; }
  function build(y) { const M = W3D.M || {}, stone = M.stone || new THREE.MeshStandardMaterial({color: 0xd8c39a}), marble = M.marble || stone, gold = M.gold || new THREE.MeshStandardMaterial({color: 0xd4af37, metalness: 0.8, roughness: 0.3});
    grp = new THREE.Group(); grp.name = 'founders-hall'; grp.position.set(0, y, 0); W3D.root.add(grp);
    const box = (w, h, d, x, yy, z, m) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, yy, z); b.castShadow = true; b.receiveShadow = true; grp.add(b); return b; };
    const cx = (X0 + X1) / 2, D = X1 - X0, fy = 0.35;
    box(D + 1.2, 2.2, 2 * HW + 0.6, cx + 0.3, fy - 1.15, ZC, stone); box(D, 0.06, 2 * HW - 0.4, cx, fy - 0.02, ZC, marble); box(1.2, 0.18, 7, X1 + 0.9, 0.09, ZC, stone);
    box(T, WH, 2 * HW, X0 + T / 2, fy + WH / 2, ZC, stone); for (const s of [-1, 1]) box(D, WH, T, cx, fy + WH / 2, ZC + s * (HW - T / 2), stone);
    box(D + 1.0, 0.45, 2 * HW + 1.0, cx + 0.2, fy + WH + 0.22, ZC, stone); box(0.25, 0.3, 2 * HW + 1.0, X1 + 0.72, fy + WH + 0.15, ZC, gold);
    const sign = canvasMesh(8.4, 1.1, 1024); { const {g, c, tex} = sign.userData; frame(g, c.width, c.height); g.fillStyle = '#FFD700'; g.font = 'bold 84px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('FOUNDERS HALL', c.width / 2, c.height / 2 + 4); tex.needsUpdate = true; }
    sign.position.set(X1 + 0.86, fy + WH + 1.0, ZC); sign.rotation.y = Math.PI / 2; grp.add(sign);
    board = canvasMesh(2 * HW - 2, 4.0, 2048); board.position.set(X0 + T + 0.02, fy + 2.4, ZC); board.rotation.y = Math.PI / 2; grp.add(board);
    booths = []; for (let i = 0; i < BOOTHS; i++) { const side = i < 2 ? -1 : 1, bx = X0 + 4.2 + (i % 2) * 6.2, bz = ZC + side * (HW - T - 0.03);
      box(5.2, 0.9, 0.9, bx, fy + 0.45, ZC + side * (HW - T - 1.1), marble);                         // booth counter
      const m = canvasMesh(4.6, 3.0, 1024); m.position.set(bx, fy + 2.75, bz); m.rotation.y = side < 0 ? 0 : Math.PI; grp.add(m);
      const b = {m, p: null, btns: []}, ry = side < 0 ? 0 : 180, bzz = ZC + side * (HW - T - 1.1 - 0.46), by = y + fy + 1.28, dir = side < 0 ? 1 : -1;
      [['Follow', 'follow'], ['Cheer', 'cheer'], ['Offer help', 'offer'], ['Intro', 'intro']].forEach(([l, k], j) => b.btns.push(btnEnt(l, bx + dir * (-1.8 + j * 1.2), by, bzz, ry, 1.1, () => act(b, k))));
      booths.push(b); }
    colliders(y); loadProjects(); }
  function setVis(v) { if (grp) grp.visible = v; booths.forEach(b => b.btns.forEach(x => { const on = v && !!b.p; x.e.object3D.visible = on; const h = x.e.querySelector('a-plane'); if (h) { if (on) h.classList.add('btn'); else h.classList.remove('btn'); } })); }
  function relevel(y) { gy = y; grp.position.y = y; booths.forEach(b => b.btns.forEach(x => { x.e.object3D.position.y = y + 0.35 + 1.28; })); colliders(y); }
  const _c = new THREE.Vector3();
  setInterval(() => { if (!window.W3D_READY || !W3D.root || !W3D.active) { if (grp && grp.visible) setVis(false); return; }
    const cam = document.querySelector('a-scene').camera; if (!cam) return; cam.getWorldPosition(_c); const d = Math.hypot(_c.x - (X0 + X1) / 2, _c.z - ZC);
    if (d < LOAD) { const y = ground(); if (y == null) return; if (!grp) { gy = y; build(y); } else if (Math.abs(y - gy) > 0.15) relevel(y); if (!grp.visible) setVis(true); if (d < 120 && performance.now() - lastP > 60000) loadProjects(); }
    else if (d > DROP && grp && grp.visible) setVis(false); }, 700);
  window.addEventListener('fpa-user', () => { if (grp) loadProjects(); });
  function go() { if (W3D.spots.launchpad) W3D.spots.launchpad(); const t = () => W3D.teleportTo(X1 + 7, undefined, ZC, 90); t(); setTimeout(t, 1500); setTimeout(() => { t(); hud('Founders Hall'); }, 4000); }
  (function reg() { if (!W3D.spots) return setTimeout(reg, 300); W3D.spots.founders = go; })();
  W3D.founders = {reload: loadProjects, X0, X1, ZC};
})();
