/* Day / night switch for joshfreeman.org.
   Mode follows the sun at the visitor's location. Location is only used in
   memory to work out sunrise and sunset; it is never stored or sent anywhere.
   Manual choice (Auto / Day / Night) is remembered in localStorage as "jf-mode".
   Testing: ?mode=day | ?mode=night (this view only), ?mode=auto (clears choice),
   ?now=2026-11-18T22:00 (pretend time), ?geo=off (skip location, use fallback). */
(function () {
  "use strict";
  var KEY = "jf-mode", ASKED = "jf-geo-asked";
  var root = document.documentElement;
  var qs = new URLSearchParams(location.search);
  var qMode = qs.get("mode"), qNow = qs.get("now"), geoOff = qs.get("geo") === "off";
  var side = root.getAttribute("data-side") === "night" ? "night" : "day";
  var coords = null;          // {lat, lon} in memory only
  var source = "approx";      // "location" | "approx"
  var geoState = "unknown";   // granted | denied | prompt | unavailable | unknown
  var sun = null, mode = "day";

  function store(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  if (qMode === "auto") store(KEY, null);

  function now() {
    if (qNow) { var d = new Date(qNow); if (!isNaN(d)) return d; }
    return new Date();
  }

  /* Sunrise / sunset (public-domain solar equations, as used by SunCalc). */
  var PI = Math.PI, rad = PI / 180, J1970 = 2440588, J2000 = 2451545, dayMs = 864e5;
  function sunTimes(date, lat, lon) {
    var lw = rad * -lon, phi = rad * lat;
    var d = date.valueOf() / dayMs - 0.5 + J1970 - J2000;
    var n = Math.round(d - 0.0009 - lw / (2 * PI));
    var ds = 0.0009 + lw / (2 * PI) + n;
    var M = rad * (357.5291 + 0.98560028 * ds);
    var C = rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
    var L = M + C + rad * 102.9372 + PI;
    var dec = Math.asin(Math.sin(L) * Math.sin(rad * 23.4397));
    var Jnoon = J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
    var cosw = (Math.sin(rad * -0.833) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec));
    function toDate(j) { return new Date((j + 0.5 - J1970) * dayMs); }
    if (cosw > 1) return { polar: "night" };
    if (cosw < -1) return { polar: "day" };
    var w = Math.acos(cosw);
    var Jset = J2000 + 0.0009 + (w + lw) / (2 * PI) + n + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
    return { rise: toDate(Jnoon - (Jset - Jnoon)), set: toDate(Jset) };
  }

  /* Fallback position from the device time zone (no location needed). */
  function approxCoords() {
    var tz = "";
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) {}
    if (tz === "America/New_York") return { lat: 40.71, lon: -74.01 };
    var y = new Date().getFullYear();
    var std = Math.max(new Date(y, 0, 1).getTimezoneOffset(), new Date(y, 6, 1).getTimezoneOffset());
    var south = /^(Australia|Antarctica)|Auckland|Sao_Paulo|Buenos_Aires|Argentina|Johannesburg|Santiago|Montevideo|Lima|Jakarta/.test(tz);
    return { lat: south ? -30 : 40, lon: Math.max(-180, Math.min(180, -std / 4)) };
  }

  function autoMode() {
    var c = coords || approxCoords(), t = now();
    sun = sunTimes(t, c.lat, c.lon);
    if (sun.polar) return sun.polar;
    return t >= sun.rise && t < sun.set ? "day" : "night";
  }

  function choice() {
    if (qMode === "day" || qMode === "night") return qMode;
    var s = read(KEY);
    return s === "day" || s === "night" ? s : "auto";
  }

  function apply() {
    var c = choice();
    var m = c === "auto" ? autoMode() : c;
    if (c !== "auto") autoMode(); // still compute sun times for the status line
    mode = m;
    root.setAttribute("data-mode", m);
    root.classList.toggle("jf-night", m === "night");
    root.classList.toggle("jf-day", m === "day");
    tint();
    render();
    try { document.dispatchEvent(new CustomEvent("jfmodechange", { detail: { mode: m, choice: c, source: source, sun: sun } })); } catch (e) {}
  }

  /* Plain dark day pages get a navy, starry tint at night. */
  function tint() {
    if (!document.body || side === "night") return;
    root.classList.remove("jf-tint");
    if (mode !== "night") return;
    var bg = getComputedStyle(document.body).backgroundColor;
    if (bg === "rgb(17, 17, 17)" || root.hasAttribute("data-night-tint")) root.classList.add("jf-tint");
  }

  function useLocation(pos) {
    coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
    source = "location"; geoState = "granted"; apply();
  }
  function noLocation(err) {
    if (err && err.code === 1) geoState = "denied"; else if (geoState !== "denied") geoState = "unavailable";
    render();
  }
  function askLocation() {
    if (!navigator.geolocation || geoOff) { geoState = "unavailable"; render(); return; }
    store(ASKED, "1");
    navigator.geolocation.getCurrentPosition(useLocation, noLocation, { enableHighAccuracy: false, timeout: 15000, maximumAge: 36e5 });
  }
  function startLocation() {
    if (!navigator.geolocation || geoOff) { geoState = "unavailable"; return; }
    var askOnce = function () { if (!read(ASKED)) setTimeout(askLocation, 1500); };
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: "geolocation" }).then(function (p) {
        geoState = p.state;
        if (p.state === "granted") askLocation();
        else if (p.state === "prompt") askOnce();
        render();
      }, askOnce);
    } else askOnce();
  }

  /* ---------- Toggle UI ---------- */
  var ui, btn, menu, status, geoBtn, sideLink;
  var ICON_SUN = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="4.6" fill="currentColor"/><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 1.8v2.6M12 19.6v2.6M1.8 12h2.6M19.6 12h2.6M4.8 4.8l1.8 1.8M17.4 17.4l1.8 1.8M4.8 19.2l1.8-1.8M17.4 6.6l1.8-1.8"/></g></svg>';
  var ICON_MOON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M20.2 15.1A8.6 8.6 0 0 1 8.9 3.8a.6.6 0 0 0-.8-.7A9.6 9.6 0 1 0 20.9 15.9a.6.6 0 0 0-.7-.8z"/></svg>';
  function fmt(d) { try { return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }); } catch (e) { return ""; } }

  function css() {
    var s = document.createElement("style");
    s.id = "jf-dn-style";
    s.textContent =
      "#jf-dn{position:fixed;left:calc(12px + env(safe-area-inset-left));bottom:calc(12px + env(safe-area-inset-bottom));z-index:2147483000;font:14px/1.35 system-ui,-apple-system,sans-serif;display:flex;flex-direction:column-reverse;align-items:flex-start;gap:8px;max-width:calc(100vw - 24px)}" +
      "#jf-dn .jf-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}" +
      "#jf-dn button,#jf-dn a.jf-pill{font:inherit;border:1px solid rgba(255,255,255,.35);background:rgba(0,0,0,.62);color:#fff;border-radius:999px;padding:7px 13px;display:inline-flex;align-items:center;gap:7px;cursor:pointer;text-decoration:none;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);min-height:36px}" +
      "#jf-dn svg{width:18px;height:18px;display:block}" +
      "#jf-dn button:focus-visible,#jf-dn a:focus-visible{outline:3px solid #e8c77a;outline-offset:2px}" +
      "#jf-dn .jf-menu{background:#0d1426;color:#efe4cc;border:1px solid #2c3a5c;border-radius:12px;padding:12px;width:min(300px,calc(100vw - 24px));box-shadow:0 12px 30px rgba(0,0,0,.45)}" +
      "#jf-dn .jf-menu[hidden]{display:none}" +
      "#jf-dn .jf-menu p{margin:0 0 10px;color:#c9bfa8;font-size:13px}" +
      "#jf-dn .jf-opts{display:flex;gap:6px;margin-bottom:10px}" +
      "#jf-dn .jf-opts button{flex:1;justify-content:center;padding:7px 8px;border-radius:8px;background:#16203a;border-color:#2c3a5c}" +
      "#jf-dn .jf-opts button[aria-pressed=true]{background:#e8c77a;color:#1a1408;border-color:#e8c77a;font-weight:600}" +
      "#jf-dn .jf-geo{width:100%;justify-content:center;border-radius:8px!important;background:#16203a!important;border-color:#2c3a5c!important}" +
      "#jf-dn [hidden]{display:none!important}" +
      "html.jf-day #jf-dn .jf-toggle{background:rgba(255,255,255,.92);color:#2a241c;border-color:rgba(0,0,0,.2)}" +
      "html.jf-night #jf-dn .jf-toggle{background:rgba(13,20,38,.85);color:#f1dfa6;border-color:#3a4a72}" +
      "html.jf-tint,html.jf-tint body{background-color:#0a1022!important}" +
      "html.jf-tint body{background-image:radial-gradient(1px 1px at 20px 30px,rgba(255,255,255,.7),transparent),radial-gradient(1px 1px at 120px 80px,rgba(255,255,255,.5),transparent),radial-gradient(1.5px 1.5px at 200px 150px,rgba(255,240,200,.7),transparent),radial-gradient(1px 1px at 60px 190px,rgba(255,255,255,.45),transparent),radial-gradient(1px 1px at 260px 40px,rgba(255,255,255,.55),transparent),linear-gradient(#0a1022,#060914)!important;background-size:300px 220px,300px 220px,300px 220px,300px 220px,300px 220px,100% 100%!important;background-attachment:fixed!important}" +
      "html.jf-tint .art-item img{background:transparent!important}" +
      "@media print{#jf-dn{display:none}}";
    document.head.appendChild(s);
  }

  function build() {
    if (ui || !document.body) return;
    css();
    ui = document.createElement("div");
    ui.id = "jf-dn";
    ui.innerHTML =
      '<div class="jf-row"><button type="button" class="jf-toggle" aria-expanded="false" aria-controls="jf-dn-menu"></button><a class="jf-pill jf-side" href="/night/"></a></div>' +
      '<div class="jf-menu" id="jf-dn-menu" role="group" aria-label="Day and night" hidden>' +
      '<div class="jf-opts"><button type="button" data-c="auto">Auto</button><button type="button" data-c="day">Day</button><button type="button" data-c="night">Night</button></div>' +
      '<p class="jf-status" aria-live="polite"></p>' +
      '<button type="button" class="jf-geo" hidden>Use my location for sunrise and sunset</button>' +
      '<p style="margin:10px 0 0;font-size:12px;color:#9a92a8">Your location stays on your device. It is never saved or sent.</p></div>';
    document.body.appendChild(ui);
    btn = ui.querySelector(".jf-toggle"); menu = ui.querySelector(".jf-menu");
    status = ui.querySelector(".jf-status"); geoBtn = ui.querySelector(".jf-geo"); sideLink = ui.querySelector(".jf-side");
    btn.addEventListener("click", function () {
      var open = menu.hidden; menu.hidden = !open; btn.setAttribute("aria-expanded", String(open));
    });
    ui.querySelectorAll(".jf-opts button").forEach(function (b) {
      b.addEventListener("click", function () {
        var c = b.getAttribute("data-c");
        qMode = null;
        store(KEY, c === "auto" ? null : c);
        apply();
      });
    });
    geoBtn.addEventListener("click", function () { geoBtn.disabled = true; askLocation(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !menu.hidden) { menu.hidden = true; btn.setAttribute("aria-expanded", "false"); btn.focus(); } });
    document.addEventListener("click", function (e) { if (!menu.hidden && !ui.contains(e.target)) { menu.hidden = true; btn.setAttribute("aria-expanded", "false"); } });
    tint(); render();
  }

  function render() {
    if (!ui) return;
    var c = choice();
    btn.innerHTML = (mode === "night" ? ICON_MOON : ICON_SUN) + "<span>" + (mode === "night" ? "Night" : "Day") + (c === "auto" ? " · Auto" : "") + "</span>";
    btn.setAttribute("aria-label", "Day and night: " + mode + (c === "auto" ? ", automatic" : ", chosen by you") + ". Open options");
    ui.querySelectorAll(".jf-opts button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-c") === c)); });
    var where = source === "location" ? "at your location" : "estimated from your time zone";
    var txt;
    if (!sun) txt = "";
    else if (sun.polar) txt = sun.polar === "day" ? "The sun does not set here today." : "The sun does not rise here today.";
    else {
      var t = now();
      if (t < sun.rise) txt = "Sunrise " + fmt(sun.rise) + " (" + where + ").";
      else if (t < sun.set) txt = "Sunset " + fmt(sun.set) + " (" + where + ").";
      else txt = "Sun set at " + fmt(sun.set) + " (" + where + ").";
    }
    if (c !== "auto") txt = "You chose " + c + ". Pick Auto to follow the sun again. " + txt;
    if (geoState === "denied" && source !== "location") txt += " Location is off, so times are estimated.";
    status.textContent = txt;
    geoBtn.hidden = source === "location" || geoState === "denied" || geoState === "unavailable" || geoOff;
    geoBtn.disabled = false;
    // Night navigation shows night pages; day navigation shows day pages.
    if (root.hasAttribute("data-night-home")) sideLink.hidden = true;
    else if (mode === "night" && side === "day") { sideLink.hidden = false; sideLink.href = "/night/"; sideLink.textContent = "Night side →"; }
    else if (mode === "day" && side === "night") { sideLink.hidden = false; sideLink.href = "/day/"; sideLink.textContent = "← Day side"; }
    else sideLink.hidden = true;
  }

  apply();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build); else build();
  startLocation();
  setInterval(apply, 60000);
  document.addEventListener("visibilitychange", function () { if (!document.hidden) apply(); });
  window.JFDayNight = { sunTimes: sunTimes, sun: function () { return sun; }, now: now, mode: function () { return mode; }, source: function () { return source; } };
})();
