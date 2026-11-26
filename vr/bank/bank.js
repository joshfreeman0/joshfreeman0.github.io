/* Bank of the United States - Third Edition - public play-money ledger viewer and verifier.
   PLAY MONEY - NOT LEGAL TENDER - FOR FOWLING POND VR USE ONLY.
   Recomputes every SHA-256 hash, Merkle root and Ed25519 signature in the browser (Web Crypto, with tweetnacl as fallback). */
(function () {
  'use strict';
  const PINNED_KEY = 'f57853e9d9442fea1557fa15a1ea6dade97a3ed529648dea81c11b9ad46a4452';
  const SUPPLY = 15000000000000000n, TREASURY = 'TREASURY';
  const DENOMS = { A: [1, 100n, '$1'], B: [2, 200n, '$2'], C: [5, 500n, '$5'], D: [10, 1000n, '$10'], G: [20, 2000n, '$20'], E: [50, 5000n, '$50'], F: [100, 10000n, '$100'],
    H: [1, 1n, '1 cent'], J: [5, 5n, '5 cents'], K: [10, 10n, '10 cents'], L: [25, 25n, '25 cents'], M: [50, 50n, '50 cents'] };
  const ORDER = 'ABCDGEFHJKLM';
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = c => { c = BigInt(c); const d = (c / 100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); return '$' + d + '.' + (c % 100n).toString().padStart(2, '0'); };
  const short = h => h.slice(0, 10) + '...' + h.slice(-6);
  const enc = new TextEncoder();
  const hex = b => Array.from(new Uint8Array(b), x => x.toString(16).padStart(2, '0')).join('');
  const unhex = h => new Uint8Array(h.match(/../g).map(x => parseInt(x, 16)));
  const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  function canon(v) {
    if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
    if (v && typeof v === 'object') return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
    return JSON.stringify(v);
  }
  const sha = async bytes => new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  async function merkle(entries) {
    let level = []; for (const e of entries) level.push(await sha(enc.encode(canon(e))));
    if (!level.length) return hex(await sha(new Uint8Array(0)));
    while (level.length > 1) {
      if (level.length % 2) level.push(level[level.length - 1]);
      const nx = []; for (let i = 0; i < level.length; i += 2) { const j = new Uint8Array(64); j.set(level[i]); j.set(level[i + 1], 32); nx.push(await sha(j)); }
      level = nx;
    }
    return hex(level[0]);
  }
  let engine = null, wcKey = null;
  async function sigOK(msgHex, sigB64) {
    const msg = unhex(msgHex), sig = unb64(sigB64);
    if (engine === null) {
      try { wcKey = await crypto.subtle.importKey('raw', unhex(PINNED_KEY), { name: 'Ed25519' }, false, ['verify']); engine = 'Web Crypto Ed25519'; }
      catch (e) { engine = 'tweetnacl Ed25519 (fallback)'; }
    }
    if (wcKey) { try { return await crypto.subtle.verify({ name: 'Ed25519' }, wcKey, sig, msg); } catch (e) { wcKey = null; engine = 'tweetnacl Ed25519 (fallback)'; } }
    return window.nacl.sign.detached.verify(msg, sig, unhex(PINNED_KEY));
  }
  function parseSerial(raw) {
    const s = String(raw || '').replace(/[\s\-]/g, '').toUpperCase();
    const m = /^FP([A-Z])(\d{8})([A-Z])$/.exec(s);
    if (!m) return { s, err: 'That is not a valid serial format. A serial is FP + a letter + 8 digits + a check letter, e.g. FPA 00000001 C.' };
    const [, L, digits, chk] = m;
    if (!DENOMS[L]) return { s, err: 'Unknown denomination letter "' + L + '".' };
    const want = String.fromCharCode(65 + ([...digits].reduce((a, d) => a + +d, 0) + DENOMS[L][0]) % 26);
    if (chk !== want) return { s, err: 'The check letter is wrong (a genuine ' + DENOMS[L][2] + ' note with these digits ends in "' + want + '"). This serial is not genuine - it may be a typo or a counterfeit.' };
    return { s, L, digits };
  }
  function replay(L) {
    const bal = new Map(), bills = new Map(), hist = new Map();
    const add = (a, c) => bal.set(a, (bal.get(a) || 0n) + c);
    for (const b of L.blocks) {
      const i = b.header.index;
      b.entries.forEach((e, n) => {
        const amt = BigInt(e.amount_cents || '0'), where = 'block ' + i + ' entry ' + n;
        if (e.type === 'mint') { if (i !== 0) throw new Error(where + ': mint outside genesis'); add(TREASURY, amt); }
        else if (e.type === 'issue') {
          const p = parseSerial(e.serial); if (p.err || p.s !== e.serial) throw new Error(where + ': bad serial ' + e.serial);
          if (bills.has(p.s)) throw new Error(where + ': duplicate serial ' + p.s);
          if (amt !== DENOMS[p.L][1]) throw new Error(where + ': amount does not match face value');
          if ((bal.get(TREASURY) || 0n) < amt) throw new Error(where + ': Treasury overspend');
          add(TREASURY, -amt); add(p.s, amt);
          bills.set(p.s, { serial: p.s, denomination: DENOMS[p.L][2], face: amt, letter: p.L, edition: e.edition, run: e.print_run, status: 'in circulation', holder: e.holder });
        } else if (e.type === 'transfer') {
          const x = bills.get(e.serial); if (!x || x.status !== 'in circulation') throw new Error(where + ': not in circulation');
          if (e.holder_from !== x.holder) throw new Error(where + ': holder mismatch'); x.holder = e.holder_to;
        } else if (e.type === 'redeem') {
          const x = bills.get(e.serial); if (!x || x.status !== 'in circulation') throw new Error(where + ': not in circulation');
          if (amt !== (bal.get(e.serial) || 0n)) throw new Error(where + ': redeem amount mismatch');
          add(e.serial, -amt); add(TREASURY, amt); x.status = 'redeemed'; x.holder = 'Treasury - Central Command Hall Vault';
        } else throw new Error(where + ': unknown entry type');
        if (e.serial) { if (!hist.has(e.serial)) hist.set(e.serial, []); hist.get(e.serial).push({ block: i, type: e.type, ts: b.header.timestamp, e }); }
      });
      for (const v of bal.values()) if (v < 0n) throw new Error('block ' + i + ': negative balance');
    }
    let total = 0n; for (const v of bal.values()) total += v;
    if (total !== SUPPLY) throw new Error('total supply is ' + money(total) + ', expected ' + money(SUPPLY));
    return { bal, bills, hist };
  }
  async function verifyAll(L, log) {
    if (L.public_key !== PINNED_KEY) throw new Error('ledger.json public key does not match the key pinned in this page');
    let prev = '0'.repeat(64);
    for (let k = 0; k < L.blocks.length; k++) {
      const b = L.blocks[k], h = b.header;
      if (h.index !== k) throw new Error('block ' + k + ': wrong index');
      if (h.prev_hash !== prev) throw new Error('block ' + k + ': does not link to the block before it');
      if (h.entry_count !== b.entries.length) throw new Error('block ' + k + ': entry count mismatch (an entry was added or removed)');
      if (await merkle(b.entries) !== h.merkle_root) throw new Error('block ' + k + ': Merkle root mismatch (an entry was changed)');
      const hh = hex(await sha(enc.encode(canon(h))));
      if (hh !== b.hash) throw new Error('block ' + k + ': hash mismatch (the header was changed)');
      if (!await sigOK(hh, b.signature)) throw new Error('block ' + k + ': bad bank signature');
      log && log('block ' + k + '  ok  hash ' + short(hh) + '  ' + b.entries.length + ' entr' + (b.entries.length === 1 ? 'y' : 'ies'));
      prev = hh;
    }
    const st = replay(L);
    log && log('balances ok: Treasury + all bills = ' + money(SUPPLY));
    return st;
  }
  let LEDGER = null, STATE = null;
  function render() {
    const L = LEDGER, st = STATE, live = [...st.bills.values()].filter(b => b.status === 'in circulation');
    const circ = live.reduce((a, b) => a + b.face, 0n), last = L.blocks[L.blocks.length - 1];
    $('c-supply').textContent = money(SUPPLY); $('c-treasury').textContent = money(st.bal.get(TREASURY) || 0n);
    $('c-circ').textContent = money(circ); $('c-bills').textContent = live.length + ' bills in circulation' + (st.bills.size > live.length ? ', ' + (st.bills.size - live.length) + ' redeemed' : '');
    $('c-blocks').textContent = L.blocks.length; $('c-hash').textContent = 'latest ' + short(last.hash); $('c-hash').title = last.hash;
    $('pk').textContent = PINNED_KEY;
    const tb = $('dtab').querySelector('tbody'); let rows = '', tn = 0, tv = 0n;
    for (const l of ORDER) { const bs = live.filter(b => b.letter === l); if (!bs.length) continue; const v = bs.reduce((a, b) => a + b.face, 0n); tn += bs.length; tv += v;
      rows += '<tr><td>' + DENOMS[l][2] + '</td><td class="mono">FP' + l + '</td><td>' + bs.length + '</td><td>' + money(v) + '</td></tr>'; }
    tb.innerHTML = rows + '<tr><th>Total</th><th></th><th>' + tn + '</th><th>' + money(tv) + '</th></tr>';
    $('blocks').innerHTML = L.blocks.slice().reverse().map(b => {
      const h = b.header;
      const ents = b.entries.map(e => '<tr><td>' + esc(e.type) + '</td><td class="mono">' + (e.serial ? '<a href="?serial=' + esc(e.serial) + '#lookup">' + esc(e.serial) + '</a>' : esc(e.to)) + '</td><td>' +
        (e.amount_cents ? money(e.amount_cents) : '') + '</td><td>' + esc(e.denomination || '') + (e.print_run ? ' · ' + esc(e.print_run === 'bw' ? 'B&W' : 'color') : '') +
        (e.type === 'transfer' ? esc(e.holder_from) + ' &rarr; ' + esc(e.holder_to) : '') + '</td></tr>').join('');
      return '<details id="block-' + h.index + '"' + (h.index === 0 ? ' open' : '') + '><summary><b>Block ' + h.index + '</b> · ' + esc(h.timestamp.replace('T', ' ').replace('Z', ' UTC')) + ' · ' + esc(h.memo) + '</summary><div class="in">' +
        '<div class="kv small"><div>Hash</div><div class="mono brk">' + b.hash + '</div><div>Previous</div><div class="mono brk">' + h.prev_hash + '</div><div>Merkle root</div><div class="mono brk">' + h.merkle_root +
        '</div><div>Signature</div><div class="mono brk">' + esc(b.signature) + '</div><div>Entries</div><div>' + h.entry_count + '</div></div>' +
        '<table><thead><tr><th>Type</th><th>Serial / account</th><th>Amount</th><th>Details</th></tr></thead><tbody>' + ents + '</tbody></table></div></details>';
    }).join('');
  }
  function lookup(raw) {
    const out = $('lres'), p = parseSerial(raw); $('serial').value = p.s || '';
    if (!p.s) { out.innerHTML = ''; return; }
    if (p.err) { out.innerHTML = '<div class="res bad"><h3>Not genuine: ' + esc(p.s) + '</h3>' + esc(p.err) + '</div>'; return; }
    if (!STATE) { out.innerHTML = '<div class="res warnr">Ledger still loading...</div>'; return; }
    const b = STATE.bills.get(p.s);
    if (!b) { out.innerHTML = '<div class="res warnr"><h3>' + esc(p.s) + ': not on the ledger</h3>The format and check letter are valid for a ' + DENOMS[p.L][2] + ' note, but this serial has never been issued by the bank, so the bill is not real money in Fowling Pond.</div>'; return; }
    const h = STATE.hist.get(p.s).map(x => '<li><a href="#block-' + x.block + '">Block ' + x.block + '</a> · ' + esc(x.ts.replace('T', ' ').replace('Z', ' UTC')) + ' · ' + esc(x.type) +
      (x.type === 'transfer' ? ' to ' + esc(x.e.holder_to) : '') + '</li>').join('');
    out.innerHTML = '<div class="res ok"><h3>Genuine: ' + esc(p.s) + ' <span class="tag ' + (b.status === 'redeemed' ? 'r' : 'c') + '">' + esc(b.status) + '</span></h3><div class="kv">' +
      '<div>Denomination</div><div>' + esc(b.denomination) + ' (' + money(b.face) + ')</div><div>Bank</div><div>Bank of the United States</div><div>Edition</div><div>' + esc(b.edition) + '</div>' +
      '<div>Print run</div><div>' + (b.run === 'bw' ? 'Black-and-white' : 'Color') + '</div><div>Current holder</div><div>' + esc(b.holder) + '</div></div><p class="small">History:</p><ul>' + h + '</ul>' +
      '<p class="small">Play money - not legal tender - for Fowling Pond VR use only.</p></div>';
  }
  $('lf').addEventListener('submit', e => { e.preventDefault(); const u = new URL(location.href); u.searchParams.set('serial', $('serial').value.replace(/\s/g, '').toUpperCase()); history.replaceState(null, '', u.pathname + u.search + '#lookup'); lookup($('serial').value); });
  $('vbtn').addEventListener('click', async () => {
    const out = $('vres'); out.innerHTML = '<div class="res warnr">Checking...</div>'; const lines = [];
    try {
      const L = await (await fetch('ledger.json?t=' + Date.now(), { cache: 'no-store' })).json();
      const t0 = performance.now(); await verifyAll(L, s => lines.push(s));
      out.innerHTML = '<div class="res ok"><h3>Chain verified</h3>All ' + L.blocks.length + ' blocks are linked, unchanged and signed by the bank. Supply is exactly ' + money(SUPPLY) + '.<div class="log">' + esc(lines.join('\n')) +
        '\nsignature check: ' + esc(engine) + ' · ' + Math.round(performance.now() - t0) + ' ms</div></div>';
    } catch (e) { out.innerHTML = '<div class="res bad"><h3>Verification FAILED</h3>' + esc(e.message) + '<div class="log">' + esc(lines.join('\n')) + '</div></div>'; }
  });
  window.BANK3 = { canon, merkle, verifyAll, parseSerial, replay, get ledger() { return LEDGER; }, get engine() { return engine; } };
  (async () => {
    try {
      LEDGER = await (await fetch('ledger.json?t=' + Date.now(), { cache: 'no-store' })).json();
      STATE = await verifyAll(LEDGER); render();
    } catch (e) { $('cards').insertAdjacentHTML('afterend', '<div class="res bad"><h3>Ledger failed to verify</h3>' + esc(e.message) + '</div>'); }
    const s = new URLSearchParams(location.search).get('serial'); if (s) { lookup(s); $('lookup').scrollIntoView(); }
  })();
})();
