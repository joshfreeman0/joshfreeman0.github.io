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
`mint` (genesis only), `issue` (Treasury to serial), `transfer` (records a new holder; the value stays with the bill), `redeem` (serial back to Treasury; the bill is retired).

## Ledger updates (git anchors)
| Block(s) | What | Commit |
|---|---|---|
| 0 | Genesis - Third Edition - $150,000,000,000,000.00 minted to the Treasury - hash `a3eaaaf9036f2e66...` | [a5775da](https://github.com/joshfreeman0/joshfreeman0.github.io/commit/a5775da) (2026-11-26) |
| 1 | Issue printed color run (serials 00000001-00000003, 12 denominations) - hash `b32a8a3a5e3f153b...` | [a5775da](https://github.com/joshfreeman0/joshfreeman0.github.io/commit/a5775da) (2026-11-26) |
| 2 | Issue printed black-and-white run (serials 00000501-00000503, 12 denominations) - hash `2e5df3816460ea80...` | [a5775da](https://github.com/joshfreeman0/joshfreeman0.github.io/commit/a5775da) (2026-11-26) |

For each later ledger update, add a row with the block number(s) and the commit that published them.
