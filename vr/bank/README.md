# Bank of the United States - Third Edition - Public Ledger

**PLAY MONEY - NOT LEGAL TENDER - FOR FOWLING POND VR USE ONLY.** No real value, no token, no wallet, nothing for sale.

Live page: https://joshfreeman.org/vr/bank/ (serial lookup: `https://joshfreeman.org/vr/bank/?serial=FPA00000001C`)

## What it is
A small public blockchain for the Fowling Pond VR bank:

- **Supply:** block 0 (genesis) mints $150,000,000,000,000.00 (15,000,000,000,000,000 cents) to `TREASURY` (Treasury - Central Command Hall Vault). Nothing can mint again.
- **Bills:** each printed bill is an account named by its serial. Issuing a bill moves its face value from the Treasury to the serial. Treasury + all bills always equals the supply.
- **Blocks:** `header = {index, timestamp (UTC), prev_hash, merkle_root, entry_count, edition, memo}`; `hash = SHA-256(canonical JSON of header)`; `signature = Ed25519(bank key, hash bytes)`, base64.
- **Merkle root:** leaves are SHA-256(canonical JSON of each entry); pairs hashed as SHA-256(left || right); an odd last leaf is paired with itself.
- **Canonical JSON:** keys sorted, no spaces, ASCII only. Amounts are integer cents stored as strings (too big for JS numbers).
- **Serials:** `FP` + denomination letter + 8 digits + check letter, where check = A + (sum of the 8 digits + face value) mod 26. Face value is in dollars for dollar notes and in cents for fractional notes.
  Letters: A $1, B $2, C $5, D $10, G $20, E $50, F $100, H 1c, J 5c, K 10c, L 25c, M 50c.
- **Public key** (pinned in `bank.js`): see `bank-public-key.txt`. The private key never leaves the bank's machine.
- **Timestamp anchor:** every ledger update is a git commit in this public repo, so GitHub's history timestamps each block (table below).

## Files
- `ledger.json`: the chain.
- `index.html`, `bank.css`, `bank.js`: the explorer, serial lookup and in-browser verifier. It uses Web Crypto Ed25519 where available and falls back to `nacl-fast.min.js` (tweetnacl 1.0.3, public domain).
- `bank-public-key.txt`: the bank's Ed25519 public key.

## Entry types
`mint` (genesis only), `issue` (Treasury to serial), `transfer` (records a new holder; the value stays with the bill), `claim` (first claimer of a coded bill, after the bank checked the code), `redeem` (serial back to Treasury; the bill is retired).

## Secret codes (Run 2)
Run 2 bills (color 00000004-00000006, B&W 00000504-00000506, every denomination) carry a random 8-character code (alphabet `23456789ABCDEFGHJKMNPQRSTUVWXYZ`, shown as XXXX-XXXX) in a VERIFY CODE box sized for a removable sticky flag. The issue entry stores `code_kdf = pbkdf2-sha256`, `code_iter`, a random per-bill `code_salt` and `code_hash = PBKDF2-HMAC-SHA256(password = code without the dash, salt = "FPBANK3|" + serial + "|" + code_salt, code_iter, 32 bytes)`. Plaintext codes are never committed.

- **Check (anyone, in the browser):** enter serial + code on the page. It recomputes the PBKDF2 hash locally and shows "Code matches - genuine bill" or "Wrong code - likely a copy".
- **Claim (the bank, CLI):** `ledger.py claim SERIAL CODE --holder NAME` checks the code and appends a signed `claim` block. First claimer wins; a second claim is refused. After that the page shows "Already claimed by NAME on DATE - any other bill with this serial is a copy". A static page can't write to the ledger, so claims are recorded by the bank.
- Run 1 bills (00000001-00000003, 00000501-00000503) have no code and stay valid by serial only.

## Ledger updates (git anchors)
| Block(s) | What | Commit |
|---|---|---|
| 0 | Genesis - Third Edition - $150,000,000,000,000.00 minted to the Treasury - hash `a3eaaaf9036f2e66...` | [a5775da](https://github.com/joshfreeman0/joshfreeman0.github.io/commit/a5775da) (2026-11-26) |
| 1 | Issue printed color run (serials 00000001-00000003, 12 denominations) - hash `b32a8a3a5e3f153b...` | [a5775da](https://github.com/joshfreeman0/joshfreeman0.github.io/commit/a5775da) (2026-11-26) |
| 2 | Issue printed black-and-white run (serials 00000501-00000503, 12 denominations) - hash `2e5df3816460ea80...` | [a5775da](https://github.com/joshfreeman0/joshfreeman0.github.io/commit/a5775da) (2026-11-26) |
| 3 | Issue Run 2 (secret codes): color 4-6 and B&W 504-506, 12 denominations - hash `0dc18582bb678c0a...` | [97f606f](https://github.com/joshfreeman0/joshfreeman0.github.io/commit/97f606f) (2026-11-26) |

For each later ledger update, add a row with the block number(s) and the commit that published them.
