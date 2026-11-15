/* X currency display — Kitco live spot silver ASK → USD per X.
   1 X = 300/77 g Ag; USD/X = (300/77 / 31.1034768) × ask (keep full precision / 4dp from API).
   Publish as xN.NN (2 decimals only); keep .NNNN in state for calculations. */
(function (global) {
  var GRAMS_PER_X = 300 / 77;
  var TROY_OZ_G = 31.1034768;
  var state = { usdPerX: null, ask: null, goldAsk: null, copperAsk: null, asOf: null, ready: false };

  function usdPerXFromAsk(ask) {
    return (GRAMS_PER_X / TROY_OZ_G) * ask;
  }

  function formatX(n) {
    return "x" + Number(n).toFixed(2);
  }

  function usdToX(usd) {
    if (!state.usdPerX || !(usd > 0)) return null;
    return usd / state.usdPerX;
  }

  function xToUsd(x) {
    if (!state.usdPerX || !(x >= 0)) return null;
    return x * state.usdPerX;
  }

  function applyQuote(q) {
    if (!q) return;
    if (typeof q.kitcoAskUsdPerTroyOz === "number") {
      state.ask = q.kitcoAskUsdPerTroyOz;
      // Prefer ask-derived rate (full precision); fall back to API's 4dp usdPerX
      state.usdPerX = usdPerXFromAsk(q.kitcoAskUsdPerTroyOz);
      if (!(state.usdPerX > 0) && typeof q.usdPerX === "number") state.usdPerX = q.usdPerX;
    } else if (typeof q.usdPerX === "number") {
      state.usdPerX = q.usdPerX;
    }
    if (typeof q.kitcoGoldAskUsdPerTroyOz === "number") state.goldAsk = q.kitcoGoldAskUsdPerTroyOz;
    if (typeof q.kitcoCopperAskUsdPerLb === "number") state.copperAsk = q.kitcoCopperAskUsdPerLb;
    state.asOf = q.asOf || null;
    state.ready = !!state.usdPerX || state.goldAsk != null || state.copperAsk != null;
    document.dispatchEvent(new CustomEvent("x-quote-ready", { detail: state }));
  }


  function formatAsOfEt(iso) {
    if (!iso) return "";
    try {
      var d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      // e.g. 9:36 PM 10/27/2026 (America/New_York)
      return new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        hour: "numeric",
        minute: "2-digit",
        month: "numeric",
        day: "numeric",
        year: "numeric"
      }).format(d).replace(",", "");
    } catch (e) {
      return iso;
    }
  }

  /* Spot metals follow page locale: EUR/GBP via JFCurrency (gbp.js), else USD. */
  function moneyFx() {
    var j = global.JFCurrency;
    if (j && j.rate > 0 && (j.code === "EUR" || j.code === "GBP")) {
      return { code: j.code, rate: j.rate, sym: j.code === "GBP" ? "£" : "€" };
    }
    return { code: "USD", rate: 1, sym: "$" };
  }
  function fmtSpot(usd) {
    var fx = moneyFx();
    var v = usd * fx.rate;
    return fx.sym + v.toFixed(2);
  }

  function fillBars() {
    if (!state.ready && state.ask == null && state.goldAsk == null && state.copperAsk == null) return;
    document.querySelectorAll("[data-kitco-gold-ask]").forEach(function (el) {
      el.setAttribute("data-no-locale", "");
      el.textContent = state.goldAsk == null ? "Gold …" : ("Gold " + fmtSpot(state.goldAsk));
    });
    document.querySelectorAll("[data-kitco-copper-ask]").forEach(function (el) {
      el.setAttribute("data-no-locale", "");
      el.textContent = state.copperAsk == null ? "Copper …" : ("Copper " + fmtSpot(state.copperAsk));
    });
    document.querySelectorAll("[data-kitco-silver-ask]").forEach(function (el) {
      el.setAttribute("data-no-locale", "");
      if (state.ask == null) {
        el.textContent = "Silver …";
        return;
      }
      var when = formatAsOfEt(state.asOf || null);
      el.textContent =
        "Silver " +
        fmtSpot(state.ask) +
        (when ? " · " + when : "");
    });
    document.querySelectorAll("[data-x-rate]").forEach(function (el) {
      el.textContent =
        "Live rate: 1 X = $" +
        state.usdPerX.toFixed(4) +
        " USD · $1 = " + formatX(1 / state.usdPerX) + " · Kitco silver spot ask $" +
        (state.ask != null ? state.ask.toFixed(2) : "—") +
        "/troy oz" +
        (state.asOf ? " · updated " + state.asOf.replace("T", " ").replace(/\.\d+Z$/, " UTC") : "");
    });
    document.querySelectorAll("[data-x-from-usd]").forEach(function (el) {
      var usd = parseFloat(el.getAttribute("data-x-from-usd"));
      var x = usdToX(usd);
      var label = el.getAttribute("data-x-label") || "";
      if (x == null) {
        el.textContent = "";
        return;
      }
      var showUsd = el.getAttribute("data-x-show-usd") === "1";
      el.textContent = (label ? label + " " : "") + formatX(x) + (showUsd ? " ($" + usd.toFixed(2).replace(/\.00$/, "") + ")" : "");
    });
  }

  document.addEventListener("x-quote-ready", fillBars);

  function load() {
    var tries = ["/api/x-quote.php?refresh=1", "/api/x-quote.php", "js/x-quote.json"];
    function next(i) {
      if (i >= tries.length) return;
      fetch(tries[i], { cache: "no-store" })
        .then(function (r) {
          if (!r.ok) throw new Error(String(r.status));
          return r.json();
        })
        .then(function (q) {
          applyQuote(q);
          fillBars();
        })
        .catch(function () {
          next(i + 1);
        });
    }
    next(0);
  }

  global.XMoney = {
    formatX: formatX,
    usdToX: usdToX,
    xToUsd: xToUsd,
    getState: function () {
      return state;
    },
    priceLine: function (usd) {
      var x = usdToX(usd);
      if (x == null) return "";
      return "$" + Number(usd).toFixed(2).replace(/\.00$/, "") + " · " + formatX(x);
    },
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", load);
  else load();
  // Re-pull Kitco live spot ask about once a minute while the page is open
  setInterval(load, 60 * 1000);
  // gbp.js sets JFCurrency.rate async — refresh metal bars when EUR/GBP lands
  (function waitFx(n) {
    if (n <= 0) return;
    var j = global.JFCurrency;
    if (j && j.rate > 0 && (j.code === "EUR" || j.code === "GBP")) { fillBars(); return; }
    setTimeout(function () { waitFx(n - 1); }, 400);
  })(40);
  var lastCode = "USD";
  setInterval(function () {
    var j = global.JFCurrency;
    var code = (j && j.rate > 0 && j.code) || "USD";
    if (code !== lastCode) { lastCode = code; fillBars(); }
  }, 1000);
})(window);
