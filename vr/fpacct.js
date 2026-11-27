/* Fowling Pond accounts client (T-25/T-30). No scene, no DOM: just the API, shared by Fowling Pond (joshfreeman.org/vr) and
   Red Planet Lounge (Mars). Include with <script src="https://joshfreeman.org/vr/fpacct.js"></script>, then FPA.init({world:'mars'}).
   One login works in both worlds: the token is kept in localStorage per site, and FPA.handoff(url) carries it to the other site
   in the URL hash (#fpa=...), which FPA picks up and removes on load. Events on window: 'fpa-user' (detail = me or null),
   'fpa-inbox' (detail = inbox). Backend: Cloudflare Worker + D1 at FPA.base. */
(function () {
  'use strict';
  if (window.FPA) return;
  const BASE = 'https://fp-accounts.tesseractprogram.workers.dev', KEY = 'fpa.token';
  const FPA = window.FPA = {base: BASE, me: null, inbox: null, config: null, world: 'fowling', spot: null};
  let token = null, hbT = null, ibT = null;
  try { token = localStorage.getItem(KEY); } catch (e) {}
  const m = location.hash.match(/[#&]fpa=([A-Za-z0-9_-]{20,100})/);
  if (m) { token = m[1]; try { localStorage.setItem(KEY, token); } catch (e) {} history.replaceState(null, '', location.href.replace(/[#&]fpa=[A-Za-z0-9_-]+/, '').replace(/#$/, '')); }
  const emit = (n, d) => window.dispatchEvent(new CustomEvent(n, {detail: d}));
  async function api(method, path, body, noAuth) {
    const h = {'Content-Type': 'application/json'}; if (token && !noAuth) h.Authorization = 'Bearer ' + token;
    const r = await fetch(BASE + path, {method, headers: h, body: body === undefined ? undefined : JSON.stringify(body)});
    const d = await r.json().catch(() => ({}));
    if (r.status === 401 && token && !noAuth) setToken(null);
    if (!r.ok) { const e = new Error(d.error || ('http_' + r.status)); e.status = r.status; throw e; } return d; }
  FPA.api = api;
  function setToken(t) { token = t; try { t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY); } catch (e) {} if (!t) { FPA.me = null; FPA.inbox = null; emit('fpa-user', null); } }
  FPA.signedIn = () => !!token;
  FPA.token = () => token;
  FPA.refresh = async () => { if (!token) return null; try { FPA.me = await api('GET', '/me'); emit('fpa-user', FPA.me); beat(); pollInbox(); } catch (e) { if (e.status !== 401) console.warn('FPA', e); } return FPA.me; };
  async function took(d) { setToken(d.token); return FPA.refresh(); }
  /* ---- sign in ---- */
  FPA.signInGuest = async () => took(await api('POST', '/auth/guest', {}, true));
  FPA.ensure = async () => { if (FPA.me) return FPA.me; if (token && await FPA.refresh()) return FPA.me; return FPA.signInGuest(); };   // a guest account until they add Google / email
  FPA.emailLink = (email, ret) => api('POST', '/auth/email', {email, return: ret || location.href.split('#')[0]});
  FPA.googleCredential = async cred => took(await api('POST', '/auth/google', {credential: cred}));   // keeps a guest's profile when linking
  /* renders Google's own button into el (needs GOOGLE_CLIENT_ID on the Worker); resolves false when Google isn't set up yet */
  FPA.renderGoogle = async el => { const c = FPA.config || await FPA.loadConfig(); if (!c.google_client_id) return false;
    if (!window.google || !google.accounts) await new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
    google.accounts.id.initialize({client_id: c.google_client_id, callback: r => FPA.googleCredential(r.credential).catch(e => emit('fpa-error', e))});
    google.accounts.id.renderButton(el, {theme: 'filled_black', size: 'large', text: 'signin_with'}); return true; };
  FPA.signOut = async () => { try { await api('POST', '/auth/logout'); } catch (e) {} setToken(null); };
  FPA.deleteAccount = async () => { await api('DELETE', '/me'); setToken(null); };
  FPA.loadConfig = async () => (FPA.config = await api('GET', '/config', undefined, true));
  FPA.handoff = url => { if (!token) return url; const u = new URL(url, location.href); if (u.origin === location.origin) return u.href; u.hash = 'fpa=' + token; return u.href; };
  /* ---- profile / people ---- */
  FPA.saveProfile = async p => { await api('PUT', '/me', p); return FPA.refresh(); };   // {display_name, avatar, bio, interests, role, building, skills, help_wanted, visible}
  FPA.avatarUrl = (id, av) => !av ? null : av === 'avatar' || /^data:/.test(av) ? BASE + '/avatar/' + id : av;
  FPA.people = (q, role) => api('GET', '/people?q=' + encodeURIComponent(q || '') + (role ? '&role=' + role : '')).then(d => d.people);
  FPA.person = id => api('GET', '/people/' + id);
  FPA.block = id => api('POST', '/block/' + id); FPA.unblock = id => api('DELETE', '/block/' + id); FPA.blocks = () => api('GET', '/blocks').then(d => d.blocks);
  FPA.report = (type, id, reason) => api('POST', '/report', {type, id, reason});
  /* ---- friends / presence / invites ---- */
  FPA.friends = () => api('GET', '/friends');            // {friends:[{id,name,online,world,spot,...}], incoming, outgoing}
  FPA.requestFriend = id => api('POST', '/friends/request/' + id); FPA.acceptFriend = id => api('POST', '/friends/accept/' + id);
  FPA.declineFriend = id => api('POST', '/friends/decline/' + id); FPA.removeFriend = id => api('POST', '/friends/remove/' + id);
  FPA.invite = (to, o) => api('POST', '/invites', {to, world: (o && o.world) || FPA.world, url: (o && o.url) || FPA.joinUrl(), note: o && o.note});
  FPA.joinUrl = () => FPA.me ? (FPA.world === 'mars' && !/joshfreeman\.org/.test(location.host) ? location.origin + location.pathname + '?join=' + FPA.me.id : 'https://joshfreeman.org/vr/?join=' + FPA.me.id) : null;
  FPA.acceptInvite = id => api('POST', '/invites/' + id + '/accept'); FPA.declineInvite = id => api('POST', '/invites/' + id + '/decline');
  FPA.setPresence = (world, spot) => { if (world) FPA.world = world; if (spot !== undefined) FPA.spot = spot; beat(true); };
  async function beat(now) { clearTimeout(hbT); if (!token) return; if (now !== false) try { await api('POST', '/presence', {world: FPA.world, spot: FPA.spot}); } catch (e) {}
    hbT = setTimeout(beat, document.hidden ? 120e3 : 60e3); }
  async function pollInbox() { clearTimeout(ibT); if (!token) return; try { FPA.inbox = await api('GET', '/inbox'); emit('fpa-inbox', FPA.inbox); } catch (e) {} ibT = setTimeout(pollInbox, document.hidden ? 90e3 : 30e3); }
  FPA.pollInbox = pollInbox;
  /* ---- Founders Hall ---- */
  FPA.projects = () => api('GET', '/projects').then(d => d.projects); FPA.project = id => api('GET', '/projects/' + id);
  FPA.createProject = p => api('POST', '/projects', p); FPA.updateProject = (id, p) => api('PUT', '/projects/' + id, p); FPA.deleteProject = id => api('DELETE', '/projects/' + id);
  FPA.posterUrl = (p) => !p.poster ? null : p.poster === 'poster' ? BASE + '/projects/' + p.id + '/poster' : p.poster;
  FPA.follow = id => api('POST', '/projects/' + id + '/follow'); FPA.unfollow = id => api('DELETE', '/projects/' + id + '/follow');
  FPA.encourage = (id, text) => api('POST', '/projects/' + id + '/encourage', {text}); FPA.offer = (id, text) => api('POST', '/projects/' + id + '/offer', {text});
  FPA.openBooth = (id, minutes, url) => api('POST', '/projects/' + id + '/open', {minutes, world: FPA.world, url: url || FPA.joinUrl()}); FPA.closeBooth = id => api('POST', '/projects/' + id + '/close');
  /* ---- intros: both say yes, then Josh approves; approved = friends ---- */
  FPA.intros = () => api('GET', '/intros').then(d => d.intros);
  FPA.askIntro = (to, note, projectId) => api('POST', '/intros', {to, note, project_id: projectId});
  FPA.introYes = id => api('POST', '/intros/' + id + '/yes'); FPA.introNo = id => api('POST', '/intros/' + id + '/no');
  FPA.admin = {intros: () => api('GET', '/admin/intros').then(d => d.intros), approve: id => api('POST', '/admin/intros/' + id + '/approve'), decline: id => api('POST', '/admin/intros/' + id + '/decline'),
    reports: () => api('GET', '/admin/reports').then(d => d.reports), resolve: id => api('POST', '/admin/reports/' + id), ban: (id, unban) => api('POST', '/admin/ban/' + id, {unban: !!unban}), stats: () => api('GET', '/admin/stats')};
  /* image file -> small JPEG data URL (avatars / posters stay under the Worker's 160 KB cap) */
  FPA.shrinkImage = (file, max) => new Promise((ok, no) => { const im = new Image(); im.onload = () => { const s = Math.min(1, (max || 256) / Math.max(im.width, im.height)), c = document.createElement('canvas');
    c.width = Math.round(im.width * s); c.height = Math.round(im.height * s); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(im.src); ok(c.toDataURL('image/jpeg', 0.82)); }; im.onerror = no; im.src = URL.createObjectURL(file); });
  FPA.init = o => { o = o || {}; if (o.world) FPA.world = o.world; if (o.spot) FPA.spot = o.spot; FPA.ready = FPA.refresh(); return FPA.ready; };
  document.addEventListener('visibilitychange', () => { if (!document.hidden && token) { beat(); pollInbox(); } });
})();
