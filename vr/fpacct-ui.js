/* Accounts panel (2D, HTML only, no scene) for Fowling Pond and Red Planet Lounge. Needs fpacct.js first.
   FPAUI.mount(toolsEl?) adds an "Account" button (into toolsEl, else a small fixed chip) and FPAUI.open(tab) shows the panel:
   Profile | Friends | People | Founders | Intros (Josh also sees intros waiting for his approval and reports). All text is set with
   textContent (never innerHTML from the server). */
(function () {
  'use strict';
  if (window.FPAUI) return;
  const UI = window.FPAUI = {tab: 'profile'};
  const $ = (t, css, txt) => { const e = document.createElement(t); if (css) e.style.cssText = css; if (txt != null) e.textContent = txt; return e; };
  const BTN = 'border:0;border-radius:7px;padding:6px 11px;font-weight:700;cursor:pointer;margin:2px;', GOLD = BTN + 'background:#FFD700;color:#111;', GREY = BTN + 'background:#bbb;color:#111;', RED = BTN + 'background:#c62828;color:#fff;';
  const btn = (txt, css, fn) => { const b = $('button', css || GOLD, txt); b.type = 'button'; b.onclick = async ev => { ev.stopPropagation(); b.disabled = true; try { await fn(); } catch (e) { toast('Error: ' + (e.message || e)); } b.disabled = false; }; return b; };
  const toast = t => { if (window.W3D && W3D.toast) W3D.toast(t, 3000); else if (window.JFVR && JFVR.hud) JFVR.hud(t); else { const d = $('div', 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#111;color:#ffe9a8;padding:8px 14px;border-radius:8px;z-index:99;font:14px system-ui', t); document.body.appendChild(d); setTimeout(() => d.remove(), 3000); } };
  UI.toast = toast;
  let panel, body, badge;
  UI.mount = tools => { if (document.getElementById('fpabtn')) return; const b = $('button', 'background:#9be37a;color:#111;font-weight:700;position:relative', 'Account'); b.id = 'fpabtn'; b.type = 'button';
    badge = $('span', 'display:none;position:absolute;top:-6px;right:-6px;background:#c62828;color:#fff;border-radius:9px;font-size:11px;padding:1px 5px'); b.appendChild(badge);
    b.onclick = ev => { ev.stopPropagation(); panel ? UI.close() : UI.open(); };
    if (tools) tools.appendChild(b); else { b.style.cssText += ';position:fixed;top:10px;left:10px;z-index:30;padding:8px 12px;border-radius:9px;border:0'; document.body.appendChild(b); } };
  window.addEventListener('fpa-inbox', e => { const d = e.detail || {}, n = (d.friend_requests || []).length + (d.invites || []).length + (d.intro_requests || []).length + (d.admin_pending_intros || 0);
    if (badge) { badge.style.display = n ? 'inline' : 'none'; badge.textContent = n; } });
  window.addEventListener('fpa-user', () => { if (panel) render(); });
  UI.close = () => { if (panel) panel.remove(); panel = null; };
  UI.open = tab => { if (tab) UI.tab = tab; if (!panel) { panel = $('div', 'position:fixed;left:50%;top:60px;transform:translateX(-50%);width:min(560px,94vw);max-height:80vh;overflow:auto;z-index:70;background:rgba(11,29,38,0.97);color:#fff;font:15px system-ui,sans-serif;padding:12px 14px;border-radius:12px;border:2px solid #d4af37;box-shadow:0 6px 30px #000a');
      panel.id = 'fpapanel'; ['keydown', 'keyup', 'keypress'].forEach(k => panel.addEventListener(k, e => e.stopPropagation())); document.body.appendChild(panel); } render(); };
  const field = (lbl, val, multi, ph) => { const w = $('label', 'display:block;margin:6px 0'), l = $('div', 'color:#9ffcff;font-size:13px', lbl), i = $(multi ? 'textarea' : 'input', 'width:100%;box-sizing:border-box;padding:6px;border-radius:6px;border:1px solid #567;background:#0e2630;color:#fff;font:14px system-ui' + (multi ? ';height:60px' : ''));
    i.value = val || ''; if (ph) i.placeholder = ph; w.append(l, i); return [w, i]; };
  const row = (kids, css) => { const r = $('div', 'display:flex;align-items:center;gap:8px;margin:5px 0;flex-wrap:wrap;' + (css || '')); kids.forEach(k => k && r.appendChild(k)); return r; };
  const av = (id, a, n) => { const s = n || 34, u = FPA.avatarUrl(id, a); if (u) { const im = $('img', `width:${s}px;height:${s}px;border-radius:50%;object-fit:cover;background:#234`); im.src = u; im.alt = ''; return im; } return $('span', `display:inline-block;width:${s}px;height:${s}px;border-radius:50%;background:#2b4a57`); };
  const who = p => { const d = $('div', 'flex:1;min-width:150px;line-height:1.35'); d.appendChild($('div', 'font-weight:700', p.name + (p.role ? ' · ' + p.role : ''))); const sub = [p.online ? '● online' + (p.world ? ' in ' + (p.world === 'mars' ? 'Mars' : p.world === 'tesseract' ? 'Tesseract' : 'Fowling Pond') : '') : null, p.building ? 'Building: ' + p.building : null, p.skills ? 'Skills: ' + p.skills : null, p.help_wanted ? 'Wants help with: ' + p.help_wanted : null].filter(Boolean).join(' · ');
    if (sub) d.appendChild($('div', 'font-size:12px;color:' + (p.online ? '#9be37a' : '#ffe9a8'), sub)); if (p.bio) d.appendChild($('div', 'font-size:12px;color:#ddd', p.bio)); return d; };
  async function render() { if (!panel) return; panel.innerHTML = '';
    const head = row([$('div', 'font-weight:800;color:#FFD700;font-size:17px;flex:1', 'Fowling Pond account'), btn('Close', GREY, async () => UI.close())]); panel.appendChild(head);
    if (!FPA.signedIn()) { await signInView(); return; }
    if (!FPA.me) await FPA.refresh(); const me = FPA.me; if (!me) { await signInView(); return; }
    const tabs = [['profile', 'Profile'], ['friends', 'Friends'], ['people', 'People'], ['founders', 'Founders Hall'], ['intros', me.admin ? 'Intros (Josh)' : 'Intros']];
    panel.appendChild(row(tabs.map(([k, t]) => btn(t, (UI.tab === k ? GOLD : GREY), async () => { UI.tab = k; render(); }))));
    body = $('div'); panel.appendChild(body);
    try { await ({profile, friends, people, founders, intros})[UI.tab](me); } catch (e) { body.appendChild($('div', 'color:#f88', 'Could not load: ' + e.message)); } }
  async function signInView() { const c = FPA.config || await FPA.loadConfig().catch(() => ({}));
    panel.appendChild($('div', 'margin:6px 0 10px;color:#ffe9a8', 'One account for Fowling Pond and Mars: a profile, friends, invites and the Founders Hall.'));
    const g = $('div', 'margin:6px 0'); panel.appendChild(g); if (!(await FPA.renderGoogle(g).catch(() => false))) g.appendChild($('div', 'font-size:12px;color:#aaa', 'Sign in with Google: coming soon.'));
    if (c.email_enabled) { const [w, i] = field('Or get a sign-in link by email', '', false, 'you@example.com'); panel.appendChild(w);
      panel.appendChild(btn('Email me a link', GOLD, async () => { await FPA.emailLink(i.value.trim()); toast('Check your email for the sign-in link'); })); }
    else panel.appendChild($('div', 'font-size:12px;color:#aaa', 'Email sign-in links: coming soon.'));
    panel.appendChild(row([btn('Continue as guest', GREY, async () => { await FPA.signInGuest(); UI.tab = 'profile'; render(); }), $('span', 'font-size:12px;color:#aaa', 'Keeps your profile on this device; link Google or email later.')], 'margin-top:12px')); }
  async function profile(me) { const p = me.profile;
    body.appendChild(row([av(me.id, p.avatar, 56), $('div', 'font-size:13px;color:#ccc', 'Signed in ' + (me.signed_in_with === 'guest' ? 'as a guest (this device only)' : 'with ' + me.signed_in_with + (me.email ? ' (' + me.email + ')' : '')) + (me.admin ? ' · admin' : ''))]));
    if (me.signed_in_with === 'guest') { const g = $('div'); body.appendChild(g); FPA.renderGoogle(g).catch(() => {}); }
    const F = {}; [['display_name', 'Display name'], ['bio', 'Short bio', 1], ['interests', 'Interests'], ['building', 'What I\u2019m building'], ['skills', 'Skills'], ['help_wanted', 'Help wanted']].forEach(([k, l, m]) => { const [w, i] = field(l, k === 'display_name' ? p.name : p[k], m); F[k] = i; body.appendChild(w); });
    const rs = $('select', 'padding:5px;border-radius:6px'); ['visitor', 'maker', 'backer'].forEach(r => { const o = $('option', null, r[0].toUpperCase() + r.slice(1)); o.value = r; if (p.role === r) o.selected = true; rs.appendChild(o); });
    const vis = $('input'); vis.type = 'checkbox'; vis.checked = !!p.visible; const file = $('input', 'max-width:200px'); file.type = 'file'; file.accept = 'image/*'; let avatar;
    file.onchange = async () => { if (file.files[0]) avatar = await FPA.shrinkImage(file.files[0], 256); };
    body.appendChild(row([$('span', 'color:#9ffcff;font-size:13px', 'Role'), rs, $('span', 'color:#9ffcff;font-size:13px', 'Photo'), file]));
    body.appendChild(row([vis, $('span', 'font-size:13px', 'Show my profile in People and the Founders Hall (off = only friends see it)')]));
    body.appendChild(row([btn('Save profile', GOLD, async () => { const o = {role: rs.value, visible: vis.checked}; for (const k in F) o[k] = F[k].value; if (avatar) o.avatar = avatar; await FPA.saveProfile(o); toast('Profile saved'); }),
      btn('Sign out', GREY, async () => { await FPA.signOut(); render(); }), btn('Delete account', RED, async () => { if (confirm('Delete your account, profile, friends and projects?')) { await FPA.deleteAccount(); render(); } })])); }
  async function friends(me) { const [d, ib] = await Promise.all([FPA.friends(), FPA.api('GET', '/inbox')]);
    if (ib.invites.length) { body.appendChild($('div', 'color:#FFD700;font-weight:700;margin-top:6px', 'Invites')); ib.invites.forEach(i => body.appendChild(row([$('div', 'flex:1', i.name + ' invites you to ' + (i.world === 'mars' ? 'Mars' : 'Fowling Pond') + (i.note ? ' - ' + i.note : '')),
      btn('Join', GOLD, async () => UI.join(await FPA.acceptInvite(i.id))), btn('No', GREY, async () => { await FPA.declineInvite(i.id); render(); })]))); }
    if (d.incoming.length) { body.appendChild($('div', 'color:#FFD700;font-weight:700;margin-top:6px', 'Friend requests')); d.incoming.forEach(p => body.appendChild(row([av(p.id, p.avatar), who(p), btn('Accept', GOLD, async () => { await FPA.acceptFriend(p.id); render(); }), btn('Decline', GREY, async () => { await FPA.declineFriend(p.id); render(); })]))); }
    body.appendChild($('div', 'color:#FFD700;font-weight:700;margin-top:6px', 'Friends (' + d.friends.length + ')'));
    if (!d.friends.length) body.appendChild($('div', 'color:#aaa', 'No friends yet. Find people in the People tab.'));
    d.friends.forEach(p => body.appendChild(row([av(p.id, p.avatar), who(p), btn('Invite here', GOLD, async () => { await FPA.invite(p.id); toast('Invite sent to ' + p.name); }), btn('Remove', GREY, async () => { await FPA.removeFriend(p.id); render(); })])));
    if (d.outgoing.length) body.appendChild($('div', 'color:#aaa;font-size:12px;margin-top:6px', 'Waiting for: ' + d.outgoing.map(p => p.name).join(', '))); }
  async function people(me) { const [w, q] = field('Search people (name, interests, skills, what they\u2019re building)', UI.q || ''); body.appendChild(w);
    const res = $('div'); body.appendChild(res); const go = async () => { UI.q = q.value; res.innerHTML = ''; const list = await FPA.people(q.value);
      if (!list.length) res.appendChild($('div', 'color:#aaa', 'Nobody found. Only people who chose to show their profile appear here.'));
      list.forEach(p => res.appendChild(row([av(p.id, p.avatar), who(p), btn('Add friend', GOLD, async () => { const r = await FPA.requestFriend(p.id); toast(r.status === 'accepted' ? 'You are now friends' : 'Friend request sent'); }),
        btn('Ask for intro', GOLD, async () => { const n = prompt('A short note for ' + p.name + ' (why you want to meet):', ''); if (n == null) return; await FPA.askIntro(p.id, n); toast('Intro requested: ' + p.name + ' says yes, then Josh approves'); }),
        btn('Block', GREY, async () => { if (confirm('Block ' + p.name + '?')) { await FPA.block(p.id); go(); } }), btn('Report', GREY, async () => { const r = prompt('What is wrong?'); if (r) { await FPA.report('user', p.id, r); toast('Reported. Thank you.'); } })], 'border-bottom:1px solid #234;padding-bottom:5px'))); };
    q.onkeydown = e => { if (e.key === 'Enter') go(); }; body.appendChild(btn('Search', GOLD, go)); go(); }
  async function founders(me) { const list = await FPA.projects();
    body.appendChild($('div', 'color:#ffe9a8;font-size:13px;margin:4px 0', 'Makers pitch projects here; anyone can follow, cheer or offer time and skills. No money changes hands.'));
    list.forEach(p => { const card = $('div', 'border:1px solid #d4af37;border-radius:9px;padding:8px;margin:6px 0'); const pu = FPA.posterUrl(p);
      if (pu) { const im = $('img', 'max-width:100%;max-height:140px;border-radius:6px'); im.src = pu; im.alt = ''; card.appendChild(im); }
      card.appendChild($('div', 'font-weight:800;color:#FFD700', p.title + (p.open_now ? '  · OPEN NOW' : ''))); card.appendChild($('div', 'font-size:12px;color:#9ffcff', 'by ' + p.maker_name + ' · ' + p.followers + ' following · ' + p.cheers + ' cheers' + (p.open_hours ? ' · Open hours: ' + p.open_hours : '')));
      if (p.description) card.appendChild($('div', 'font-size:13px;margin:4px 0', p.description));
      if (p.link) { const a = $('a', 'color:#9ffcff;font-size:13px', p.link); a.href = p.link; a.target = '_blank'; a.rel = 'noopener'; card.appendChild(a); }
      const acts = p.mine ? [btn('Open booth 1 h', GOLD, async () => { const r = await FPA.openBooth(p.id, 60); toast('Booth open; invited ' + r.invited + ' followers'); render(); }), btn('Close booth', GREY, async () => { await FPA.closeBooth(p.id); render(); }),
          btn('See support', GREY, async () => { const d = await FPA.project(p.id); alert(d.supports.map(s => (s.kind === 'offer' ? 'OFFER from ' : 'Cheer from ') + s.name + ': ' + s.text).join('\n') || 'Nothing yet'); }), btn('Delete', RED, async () => { if (confirm('Delete this project?')) { await FPA.deleteProject(p.id); render(); } })]
        : [btn(p.following ? 'Unfollow' : 'Follow', GOLD, async () => { await (p.following ? FPA.unfollow(p.id) : FPA.follow(p.id)); render(); }), btn('Cheer', GOLD, async () => { const t = prompt('A note of encouragement:', 'Cheering you on!'); if (t) { await FPA.encourage(p.id, t); toast('Sent'); render(); } }),
          btn('Offer time / skills', GOLD, async () => { const t = prompt('What can you offer? (time, skills)'); if (t) { await FPA.offer(p.id, t); toast('Offer sent to the maker'); } }),
          btn('Ask for intro', GREY, async () => { const n = prompt('A short note for ' + p.maker_name + ':', 'I would like to help with ' + p.title); if (n == null) return; await FPA.askIntro(p.maker, n, p.id); toast('Intro requested'); }), btn('Report', GREY, async () => { const r = prompt('What is wrong?'); if (r) { await FPA.report('project', p.id, r); toast('Reported'); } })];
      card.appendChild(row(acts)); body.appendChild(card); });
    if (!list.length) body.appendChild($('div', 'color:#aaa', 'No projects yet. Be the first.'));
    body.appendChild($('div', 'color:#FFD700;font-weight:700;margin-top:10px', 'Pitch a project'));
    const F = {}; [['title', 'Title'], ['description', 'Description', 1], ['link', 'Link (https://...)'], ['open_hours', 'Open hours (e.g. Sundays 8 pm ET)']].forEach(([k, l, m]) => { const [w, i] = field(l, '', m); F[k] = i; body.appendChild(w); });
    const file = $('input'); file.type = 'file'; file.accept = 'image/*'; let poster; file.onchange = async () => { if (file.files[0]) poster = await FPA.shrinkImage(file.files[0], 640); };
    body.appendChild(row([$('span', 'color:#9ffcff;font-size:13px', 'Poster'), file])); body.appendChild(btn('Add to the Founders Hall', GOLD, async () => { const o = {}; for (const k in F) o[k] = F[k].value; if (poster) o.poster = poster; await FPA.createProject(o); toast('Project added'); render(); })); }
  async function intros(me) { const list = await FPA.intros();
    body.appendChild($('div', 'color:#ffe9a8;font-size:13px;margin:4px 0', 'Intros: you ask, they say yes, then Josh approves. Approved intros become friends.'));
    if (me.admin) { const pend = await FPA.admin.intros(); body.appendChild($('div', 'color:#FFD700;font-weight:700', 'Waiting for your approval (' + pend.filter(n => n.to_yes).length + ')'));
      pend.forEach(n => body.appendChild(row([$('div', 'flex:1;font-size:13px', n.from_name + ' (' + n.from_role + ') \u2192 ' + n.to_name + ' (' + n.to_role + ')' + (n.note ? ': ' + n.note : '') + (n.to_yes ? '' : '  [waiting for ' + n.to_name + ']')),
        n.to_yes ? btn('Approve', GOLD, async () => { await FPA.admin.approve(n.id); render(); }) : null, btn('Decline', GREY, async () => { await FPA.admin.decline(n.id); render(); })])));
      const reps = await FPA.admin.reports(); if (reps.length) { body.appendChild($('div', 'color:#FFD700;font-weight:700;margin-top:8px', 'Reports (' + reps.length + ')'));
        reps.forEach(r => body.appendChild(row([$('div', 'flex:1;font-size:13px', r.target_type + ' ' + r.target_id + ': ' + (r.reason || '')), btn('Ban user', RED, async () => { if (r.target_type === 'user' && confirm('Ban this user?')) { await FPA.admin.ban(r.target_id); } }), btn('Done', GREY, async () => { await FPA.admin.resolve(r.id); render(); })]))); } }
    body.appendChild($('div', 'color:#FFD700;font-weight:700;margin-top:8px', 'Your intros'));
    if (!list.length) body.appendChild($('div', 'color:#aaa', 'None yet. Ask for one from People or a Founders Hall booth.'));
    list.forEach(n => { const toMe = n.to_id === me.id, st = n.status !== 'pending' ? n.status : !n.to_yes ? (toMe ? 'needs your answer' : 'waiting for ' + n.to_name) : 'waiting for Josh';
      body.appendChild(row([$('div', 'flex:1;font-size:13px', (toMe ? n.from_name + ' wants to meet you' : 'You \u2192 ' + n.to_name) + (n.note ? ': ' + n.note : '') + '  [' + st + ']'),
        toMe && n.status === 'pending' && !n.to_yes ? btn('Yes', GOLD, async () => { const r = await FPA.introYes(n.id); toast(r.status === 'approved' ? 'Intro approved' : 'Thanks - Josh will approve it'); render(); }) : null,
        n.status === 'pending' ? btn(toMe ? 'No' : 'Cancel', GREY, async () => { await FPA.introNo(n.id); render(); }) : null])); }); }
  /* accepted invite: in Fowling Pond on the same page, join in place (no reload, stays in VR); otherwise go to the invite link */
  UI.join = inv => { if (!inv || !inv.url) return; const u = new URL(inv.url), j = u.searchParams.get('join');
    if (u.origin === location.origin && u.pathname === location.pathname && j && window.FPJOIN) { UI.close(); window.FPJOIN(j); return; }
    location.assign(FPA.handoff(inv.url)); };
})();
