/* Background music: Music 1 (Kasia, default) / Music 2 (Joshua) buttons in header.
   Continuous soft-nav; players outside <body>; one tab plays.
   Click Music N: switch to that track and play; click the active one again to mute/unmute. */
(function () {
  if (window.__jfBgMusic) return;
  window.__jfBgMusic = true;

  // Swap / reorder this list to change the playlist.
  var PLAYLIST = [
    // Kasia on YouTube (public, embeddable). SoundCloud 2297717444 kept as reference only.
    { type: 'youtube', label: 'Music 1', id: '-j4bGijGFwI', title: 'KASIA — Ultra Miami 2026 (Resistance Cove)' },
    { type: 'youtube', label: 'Music 2', id: 'BmyAxmhLkMM', title: 'Joshua Corallini' },
    { type: 'stream', label: 'Music 3', slug: 'trance', title: 'Радио Anima Amoris [Trance]' },
    { type: 'stream', label: 'Music 4', slug: null, title: 'Anima Amoris station (pick on Amoris page)' }
  ];
  var AMORIS_BASE = 'https://amoris.sknt.ru/';
  var AMORIS = {
    trance: 'Trance', dubtechno: 'Dub Techno', electronic: 'Electronic Styles', goa: 'Goa Psy Trance',
    dubstep: 'Dub Step', dnb: 'Drum and Bass', minimal: 'Minimal Deep Techno', deeptech: 'Deep Tech House',
    ambient: 'Ambient', idm: 'IDM', newage: 'New Age', triphop: 'Trip Hop Lounge', techno: 'Techno',
    dubtechnomix: 'Dub Techno Mix', electro: 'Electro', breakcore: 'IDM Break Core', dub: 'Dub',
    reggae: 'Reggae', bible: 'Bible', psalm: 'Christian Psalm'
  };
  window.JF_AMORIS = AMORIS;
  var K_STATION = 'jf-bg-music-station-v4';
  var station = null;
  try { station = sessionStorage.getItem(K_STATION) || localStorage.getItem(K_STATION); } catch (e) {}
  if (!AMORIS[station]) station = 'ambient';
  function setStation(slug) {
    station = slug;
    PLAYLIST[3].slug = slug;
    PLAYLIST[3].title = 'Anima Amoris [' + AMORIS[slug] + ']';
    try { sessionStorage.setItem(K_STATION, slug); localStorage.setItem(K_STATION, slug); } catch (e) {}
  }
  setStation(station);
  var audio = null, audioSrc = null;
  function getAudio() {
    if (!audio) {
      audio = document.getElementById('bg-music-audio');
      if (!audio) {
        audio = document.createElement('audio');
        audio.id = 'bg-music-audio';
        audio.preload = 'none';
        audio.className = 'bg-music-player';
        musicRoot().appendChild(audio);
      }
      audio.volume = 0.7;
      audio.addEventListener('playing', function () { started = true; });
    }
    return audio;
  }
  function pauseAudio() {
    if (audio && !audio.paused) { try { audio.pause(); } catch (e) {} }
  }
  var T_SC = 0, T_YT = 1;
  var loadedId = null; // videoId currently cued in the single YT player
  var SC_TRACK_URL = PLAYLIST[T_SC].url;
  var SC_TRACK_API = PLAYLIST[T_SC].api;
  var K_WANTED = 'jf-bg-music-wanted-v4';
  var K_TIME = 'jf-bg-music-time-v4';
  var K_SAVED = 'jf-bg-music-saved-at';
  var K_TRACK = 'jf-bg-music-track-v4'; // 0 Kasia YT, 1 Joshua YT, 2 Amoris Trance, 3 Amoris pick
  var K_LEADER = 'jf-bg-music-leader';
  var K_BEAT = 'jf-bg-music-leader-beat';
  var TAB_ID = 'jf-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  var LEADER_TTL = 4000;

  var yt = null;
  var ytReady = false;
  var scWidget = null;
  var scReady = false;
  var track = T_SC; // default Music 1 (Kasia)
  var started = false;
  var wanted = true; // autoplay Music 1 (Kasia) on load; Music 2 optional
  var isLeader = false;
  var bc = null;
  var softNavActive = false;

  function ss(fn) { try { return fn(window.sessionStorage); } catch (e) { return null; } }
  function ls(fn) { try { return fn(window.localStorage); } catch (e) { return null; } }

  var w = ss(function (s) { return s.getItem(K_WANTED); });
  wanted = (w !== '0'); // autoplay unless user stopped it this session
  var tr = parseInt(ss(function (s) { return s.getItem(K_TRACK); }) || '0', 10);
  if (tr >= 0 && tr < PLAYLIST.length) track = tr;

  function tKey(id) { return K_TIME + ':' + id; }
  function getSavedTime(id) {
    var t = parseFloat(ss(function (s) { return s.getItem(tKey(id)); }) || '');
    return isFinite(t) && t > 1 ? t : 0;
  }
  function saveYtPos() {
    if (!isLeader || !ytReady || !yt || !loadedId || typeof yt.getCurrentTime !== 'function') return;
    try {
      var t = yt.getCurrentTime();
      if (typeof t === 'number' && isFinite(t) && t > 0) ss(function (s) { s.setItem(tKey(loadedId), String(t)); });
    } catch (e) {}
  }
  function saveState() {
    ss(function (s) {
      s.setItem(K_WANTED, wanted ? '1' : '0');
      s.setItem(K_TRACK, String(track));
      if (!isLeader) return;
      if (PLAYLIST[track].type === 'youtube' && ytReady && yt && typeof yt.getCurrentTime === 'function') {
        var t = yt.getCurrentTime();
        if (typeof t === 'number' && isFinite(t) && loadedId === PLAYLIST[track].id) {
          s.setItem(tKey(loadedId), String(t));
          s.setItem(K_SAVED, String(Date.now()));
        }
      }
    });
  }

  function musicRoot() {
    var root = document.getElementById('bg-music-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'bg-music-root';
      root.setAttribute('aria-hidden', 'true');
      (document.documentElement || document.body).appendChild(root);
    } else if (root.parentNode === document.body) {
      document.documentElement.appendChild(root);
    }
    return root;
  }

  function buildGroup(id, extra) {
    var group = document.createElement('div');
    group.id = id;
    group.className = 'bg-music-controls' + (extra ? ' ' + extra : '');
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', 'Background music');
    PLAYLIST.forEach(function (item, i) {
      var btn = document.createElement('button');
      if (!extra) btn.id = 'bg-music-' + (i + 1);
      btn.type = 'button';
      btn.className = 'bg-music-btn';
      btn.setAttribute('data-track', String(i));
      btn.textContent = item.label;
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        chooseTrack(i);
      });
      group.appendChild(btn);
    });
    return group;
  }

  // Music controls appear twice: in the top header bar AND at the bottom of the page.
  function ensureUI() {
    musicRoot();
    var group = document.getElementById('bg-music-controls');
    var host = document.querySelector('.jfm-bar') || document.querySelector('.site-header__inner') || document.querySelector('.wh-header__inner') || document.body;
    if (!group) group = buildGroup('bg-music-controls', '');
    if (group.parentNode !== host) host.appendChild(group);
    group.style.cssText = '';
    if (document.body) {
      var bottom = document.getElementById('bg-music-controls-bottom');
      if (!bottom) bottom = buildGroup('bg-music-controls-bottom', 'bg-music-controls--bottom');
      var foot = document.querySelector('body > footer, body > .site-footer');
      if (foot) { if (bottom.nextSibling !== foot || bottom.parentNode !== document.body) document.body.insertBefore(bottom, foot); }
      else if (bottom.parentNode !== document.body) document.body.appendChild(bottom);
    }
    sync();
  }

  function chooseTrack(n) {
    if (n === track) {
      wanted = !wanted;
    } else {
      saveYtPos(); // remember where this track was
      pauseAll();
      track = n;
      wanted = true;
    }
    saveState();
    broadcast({ type: 'wanted', wanted: wanted, track: track, station: station });
    sync();
  }

  // During soft-nav the body is swapped; keep the buttons visible in the exact same
  // spot (fixed, outside <body>) until ensureUI puts them back in the sticky header.
  function parkToggle() {
    var group = document.getElementById('bg-music-controls');
    if (!group) return;
    var r = group.getBoundingClientRect();
    group.style.cssText = 'position:fixed;top:' + r.top + 'px;left:' + r.left + 'px;margin:0;z-index:1000;';
    document.documentElement.appendChild(group);
  }

  function pauseAll() {
    try { if (ytReady && yt) yt.pauseVideo(); } catch (e) {}
    try { if (scReady && scWidget) scWidget.pause(); } catch (e) {}
    pauseAudio();
  }

  function setYtVol(v) {
    try { if (ytReady && yt) yt.setVolume(Math.max(0, Math.min(100, v))); } catch (e) {}
  }
  function setScVol(v) {
    try { if (scReady && scWidget) scWidget.setVolume(Math.max(0, Math.min(100, v))); } catch (e) {}
  }

  function sync() {
    PLAYLIST.forEach(function (item, i) {
      Array.prototype.forEach.call(document.querySelectorAll('.bg-music-btn[data-track="' + i + '"]'), function (btn) {
      var active = i === track;
      var playing = active && wanted;
      btn.classList.toggle('is-active', active);
      btn.classList.toggle('is-paused', active && !wanted);
      btn.classList.toggle('is-follower', !isLeader);
      btn.setAttribute('aria-pressed', playing ? 'true' : 'false');
      btn.title = playing ? 'Mute ' + item.label + ' (' + item.title + ')' : 'Play ' + item.label + ' (' + item.title + ')';
      btn.setAttribute('aria-label', btn.title);
      });
    });
    if (!isLeader) {
      pauseAll();
      return;
    }
    if (!wanted) {
      pauseAll();
      return;
    }
    startPlayback();
  }

  function startPlayback() {
    if (!wanted || !isLeader) return;
    var item = PLAYLIST[track];
    if (item.type === 'stream') {
      try { if (ytReady && yt) yt.pauseVideo(); } catch (e) {}
      var a = getAudio();
      var src = AMORIS_BASE + item.slug;
      if (audioSrc !== src) { audioSrc = src; a.src = src; }
      if (a.paused) { var p = a.play(); if (p && p.catch) p.catch(function () {}); }
      started = !a.paused;
      return;
    }
    pauseAudio();
    if (!ytReady || !yt) return;
    var want = PLAYLIST[track].id;
    try {
      yt.unMute();
      yt.setVolume(70);
      if (loadedId !== want) {
        saveYtPos();
        loadedId = want;
        var from = getSavedTime(want);
        yt.loadVideoById({ videoId: want, startSeconds: from }); // resume where it left off
        started = true;
        return;
      }
      var st = null;
      try { st = yt.getPlayerState(); } catch (e2) {}
      if (window.YT && (st === YT.PlayerState.PLAYING || st === YT.PlayerState.BUFFERING)) { started = true; return; }
      yt.playVideo();
      started = true;
    } catch (e) {}
  }

  function stopAsFollower() { pauseAll(); }

  function restoreYtTime() {
    var t = getSavedTime(PLAYLIST[track].id);
    var at = parseFloat(ss(function (s) { return s.getItem(K_SAVED); }) || '');
    if (!isFinite(t) || t <= 1) return;
    if (isFinite(at) && wanted) t += Math.min(30, Math.max(0, (Date.now() - at) / 1000));
    try {
      var d = yt.getDuration();
      if (d && t >= d - 1) {
        return; // near end; start from beginning rather than seek past end
      }
      if (t > 0) yt.seekTo(t, true);
    } catch (e) {}
  }

  function ensureSoundCloud(cb) {
    if (scReady && scWidget) { cb && cb(); return; }
    var iframe = document.getElementById('bg-music-sc');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'bg-music-sc';
      iframe.className = 'bg-music-player';
      iframe.setAttribute('aria-hidden', 'true');
      iframe.setAttribute('allow', 'autoplay');
      iframe.width = '1';
      iframe.height = '1';
      iframe.style.cssText = 'position:fixed;width:1px;height:1px;left:-9999px;top:0;opacity:0;pointer-events:none;';
      iframe.src = 'https://w.soundcloud.com/player/?url=' + encodeURIComponent(SC_TRACK_API) +
        '&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&visual=false';
      musicRoot().appendChild(iframe);
    }
    function bind() {
      if (!window.SC || !window.SC.Widget) return false;
      scWidget = window.SC.Widget(iframe);
      scWidget.bind(window.SC.Widget.Events.READY, function () {
        scReady = true;
        scWidget.bind(window.SC.Widget.Events.FINISH, function () {
          // Track ended: stop (user picks next with Music 1/2).
          started = false;
          wanted = false;
          saveState();
          sync();
        });
        cb && cb();
      });
      return true;
    }
    if (bind()) return;
    if (!document.getElementById('soundcloud-api')) {
      var tag = document.createElement('script');
      tag.id = 'soundcloud-api';
      tag.src = 'https://w.soundcloud.com/player/api.js';
      tag.onload = function () {
        var n = 0;
        (function wait() {
          if (bind() || n++ > 40) return;
          setTimeout(wait, 100);
        })();
      };
      document.head.appendChild(tag);
    } else {
      var n = 0;
      (function wait() {
        if (bind() || n++ > 40) return;
        setTimeout(wait, 100);
      })();
    }
  }

  function onYouTubeIframeAPIReady() {
    ensureUI();
    if (document.getElementById('bg-music-player')) return;
    var host = document.createElement('div');
    host.id = 'bg-music-player';
    host.className = 'bg-music-player';
    host.setAttribute('aria-hidden', 'true');
    musicRoot().appendChild(host);
    yt = new YT.Player('bg-music-player', {
      videoId: PLAYLIST[track].id || PLAYLIST[0].id,
      width: 1,
      height: 1,
      playerVars: {
        autoplay: 0, controls: 0, disablekb: 1, fs: 0,
        modestbranding: 1, playsinline: 1, rel: 0,
        loop: 0, origin: location.origin
      },
      events: {
        onReady: function () {
          ytReady = true;
          loadedId = PLAYLIST[track].id || PLAYLIST[0].id;
          if (PLAYLIST[track].type === 'youtube') restoreYtTime();
          if (isLeader) startPlayback();
          else stopAsFollower();
          sync();
        },
        onStateChange: function (ev) {
          if (!isLeader) {
            if (ev.data === YT.PlayerState.PLAYING) stopAsFollower();
            return;
          }
          if (ev.data === YT.PlayerState.PLAYING) started = true;
          // Track ended: stop (no auto-advance / loop)
          if (ev.data === YT.PlayerState.ENDED) {
            started = false;
            wanted = false;
            saveState();
            sync();
          }
          if ((ev.data === YT.PlayerState.BUFFERING || ev.data === YT.PlayerState.PAUSED) &&
              wanted && softNavActive) {
            try { yt.playVideo(); } catch (e) {}
          }
        }
      }
    });
  }

  function unlock() {
    if (!isLeader) return;
    startPlayback();
    if (started) {
      document.removeEventListener('pointerdown', unlock, true);
      document.removeEventListener('keydown', unlock, true);
      document.removeEventListener('touchstart', unlock, true);
    }
  }

  function readLeader() {
    return {
      id: ls(function (s) { return s.getItem(K_LEADER); }) || '',
      beat: parseInt(ls(function (s) { return s.getItem(K_BEAT); }) || '0', 10) || 0
    };
  }
  function writeLeader() {
    ls(function (s) {
      s.setItem(K_LEADER, TAB_ID);
      s.setItem(K_BEAT, String(Date.now()));
    });
  }
  function clearLeaderIfMine() {
    var cur = readLeader();
    if (cur.id === TAB_ID) {
      ls(function (s) {
        s.removeItem(K_LEADER);
        s.removeItem(K_BEAT);
      });
      broadcast({ type: 'leader-left', id: TAB_ID });
    }
  }
  function claimLeadership() {
    var cur = readLeader();
    var stale = !cur.id || (Date.now() - cur.beat) > LEADER_TTL;
    if (stale || cur.id === TAB_ID) {
      writeLeader();
      becomeLeader(true);
      return;
    }
    becomeLeader(false);
  }
  function becomeLeader(yes) {
    if (yes === isLeader) {
      if (yes) writeLeader();
      sync();
      return;
    }
    isLeader = yes;
    if (yes) {
      writeLeader();
      broadcast({ type: 'i-am-leader', id: TAB_ID });
      startPlayback();
    } else {
      stopAsFollower();
    }
    sync();
  }
  function broadcast(msg) {
    try { if (bc) bc.postMessage(msg); } catch (e) {}
  }
  try {
    bc = new BroadcastChannel('jf-bg-music');
    bc.onmessage = function (ev) {
      var msg = ev.data || {};
      if (msg.type === 'wanted' && typeof msg.wanted === 'boolean') {
        wanted = msg.wanted;
        if (typeof msg.station === 'string' && AMORIS[msg.station]) setStation(msg.station);
        if (msg.track >= 0 && msg.track < PLAYLIST.length) {
          if (msg.track !== track) pauseAll();
          track = msg.track;
        }
        saveState();
        sync();
        if (wanted && isLeader) startPlayback();
      } else if (msg.type === 'i-am-leader' && msg.id && msg.id !== TAB_ID) {
        becomeLeader(false);
      } else if (msg.type === 'leader-left') {
        claimLeadership();
      } else if (msg.type === 'ping' && isLeader) {
        writeLeader();
        broadcast({ type: 'i-am-leader', id: TAB_ID });
      }
    };
  } catch (e) { bc = null; }

  claimLeadership();
  setInterval(function () {
    if (isLeader) writeLeader();
    else {
      var cur = readLeader();
      if (!cur.id || (Date.now() - cur.beat) > LEADER_TTL) claimLeadership();
    }
  }, 1500);
  window.addEventListener('storage', function (e) {
    if (e.key === K_LEADER || e.key === K_BEAT) {
      var cur = readLeader();
      if (cur.id && cur.id !== TAB_ID && (Date.now() - cur.beat) <= LEADER_TTL) becomeLeader(false);
      else if (!cur.id || (Date.now() - cur.beat) > LEADER_TTL) claimLeadership();
    }
  });
  window.addEventListener('pagehide', function () {
    saveState();
    if (!softNavActive) clearLeaderIfMine();
  });
  window.addEventListener('beforeunload', function () {
    if (!softNavActive) clearLeaderIfMine();
  });

  function isSiteLink(a, e) {
    if (!a || e.defaultPrevented || e.button !== 0) return false;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
    if (a.hasAttribute('download')) return false;
    var tgt = a.getAttribute('target');
    if (tgt && tgt !== '_self') return false;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#') return false;
    if (/^(mailto|tel|javascript):/i.test(href)) return false;
    var url;
    try { url = new URL(a.href, location.href); } catch (err) { return false; }
    if (url.origin !== location.origin) return false;
    if (url.pathname === location.pathname && url.search === location.search && url.hash) return false;
    if (/\.(?!html?$)[a-z0-9]+$/i.test(url.pathname)) return false;
    return url;
  }

  function runScripts(doc) {
    var list = Array.prototype.slice.call(doc.body.querySelectorAll('script'));
    var chain = Promise.resolve();
    list.forEach(function (old) {
      var src = old.getAttribute('src');
      if (src && /bg-music\.js|youtube\.com\/iframe_api/.test(src)) return;
      chain = chain.then(function () {
        return new Promise(function (resolve) {
          var s = document.createElement('script');
          for (var i = 0; i < old.attributes.length; i++) s.setAttribute(old.attributes[i].name, old.attributes[i].value);
          if (src) {
            s.onload = s.onerror = function () { resolve(); };
            s.src = new URL(src, location.href).href;
          } else {
            s.textContent = old.textContent;
          }
          document.body.appendChild(s);
          if (!src) resolve();
        });
      });
    });
    return chain;
  }

  var navToken = 0;
  var prefetchCache = Object.create(null);
  function prefetch(url) {
    try {
      var key = url.href;
      if (prefetchCache[key]) return prefetchCache[key];
      prefetchCache[key] = fetch(url.href, { credentials: 'same-origin' })
        .then(function (r) {
          if (!r.ok || !/text\/html/i.test(r.headers.get('content-type') || '')) throw new Error('bad');
          return r.text();
        })
        .catch(function () { delete prefetchCache[key]; return null; });
      return prefetchCache[key];
    } catch (e) { return Promise.resolve(null); }
  }

  function softNavigate(url, push) {
    var token = ++navToken;
    softNavActive = true;
    saveState();
    if (!document.querySelector('body > .site-header')) parkToggle();
    var key = url.href;
    var htmlPromise = prefetchCache[key] || fetch(url.href, { credentials: 'same-origin' }).then(function (r) {
      if (!r.ok || !/text\/html/i.test(r.headers.get('content-type') || '')) throw new Error('bad');
      return r.text();
    });
    return htmlPromise.then(function (html) {
      if (!html) throw new Error('empty');
      if (token !== navToken) return;
      delete prefetchCache[key];
      var doc = new DOMParser().parseFromString(html, 'text/html');
      if (push) history.pushState({ jfSoft: true }, '', url.href);
      document.title = doc.title;
      Array.prototype.forEach.call(doc.head.querySelectorAll('link[rel="stylesheet"]'), function (l) {
        var h = l.getAttribute('href');
        if (!document.head.querySelector('link[rel="stylesheet"][href="' + h + '"]')) document.head.appendChild(l.cloneNode(true));
      });
      // Keep the existing sticky header node in place (static across pages); swap the rest.
      var keepHeader = document.querySelector('body > .site-header');
      Array.prototype.slice.call(document.body.childNodes).forEach(function (n) {
        if (n !== keepHeader) document.body.removeChild(n);
      });
      document.body.className = doc.body.className;
      var newHeader = doc.body.querySelector(':scope > .site-header');
      if (keepHeader) {
        var path = url.pathname.split('/').pop() || 'index.html';
        Array.prototype.forEach.call(keepHeader.querySelectorAll('.site-nav a'), function (a) {
          var h = (a.getAttribute('href') || '').split('#')[0];
          if (h === path) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
        });
        var nav = keepHeader.querySelector('.site-nav'); if (nav) nav.classList.remove('is-open');
        var tg = keepHeader.querySelector('.nav-toggle'); if (tg) tg.setAttribute('aria-expanded', 'false');
      }
      Array.prototype.slice.call(doc.body.childNodes).forEach(function (n) {
        if (n.nodeType === 1 && n.tagName === 'SCRIPT') return;
        if (keepHeader && n === newHeader) return;
        document.body.appendChild(document.importNode(n, true));
      });
      if (url.hash) {
        var t = document.getElementById(url.hash.slice(1));
        if (t) t.scrollIntoView(); else window.scrollTo(0, 0);
      } else if (push) window.scrollTo(0, 0);
      ensureUI();
      return runScripts(doc).then(function () {
        try { document.dispatchEvent(new Event('DOMContentLoaded')); } catch (e) {}
        ensureUI();
        if (wanted && isLeader) startPlayback();
        softNavActive = false;
      });
    }).catch(function () {
      softNavActive = false;
      if (token === navToken) location.href = url.href;
    });
  }

  document.addEventListener('pointerover', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var fake = { defaultPrevented: false, button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false };
    var url = isSiteLink(a, fake);
    if (url) prefetch(url);
  }, true);

  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    var url = isSiteLink(a, e);
    if (!url) return;
    e.preventDefault();
    softNavigate(url, true);
  });

  if (!history.state) { try { history.replaceState({ jfSoft: true }, '', location.href); } catch (e) {} }
  window.addEventListener('popstate', function (e) {
    if (!e.state || !e.state.jfSoft) return;
    softNavigate(new URL(location.href), false);
  });

  setInterval(saveState, 2000);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') saveState();
  });

  function playAmoris(slug) {
    if (!AMORIS[slug]) return;
    var n = slug === 'trance' ? 2 : 3;
    if (n === 3) setStation(slug);
    if (track !== n || audioSrc !== AMORIS_BASE + slug) {
      pauseAll(); track = n; wanted = true;
      saveState(); broadcast({ type: 'wanted', wanted: wanted, track: track, station: station }); sync();
    } else chooseTrack(n);
    markStations();
  }
  window.jfPlayAmoris = playAmoris;
  function markStations() {
    var cur = !wanted ? null : (track === 2 ? 'trance' : (track === 3 ? station : null));
    Array.prototype.forEach.call(document.querySelectorAll('[data-amoris]'), function (b) {
      var on = b.getAttribute('data-amoris') === cur;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('[data-amoris]') : null;
    if (!b) return;
    e.preventDefault();
    playAmoris(b.getAttribute('data-amoris'));
  });
  setInterval(markStations, 1000);

  ensureUI();

  window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
  if (window.YT && window.YT.Player) {
    onYouTubeIframeAPIReady();
  } else if (!document.getElementById('youtube-iframe-api')) {
    var tag = document.createElement('script');
    tag.id = 'youtube-iframe-api';
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  }

  document.addEventListener('pointerdown', unlock, true);
  document.addEventListener('keydown', unlock, true);
  document.addEventListener('touchstart', unlock, true);

  broadcast({ type: 'ping' });
})();
