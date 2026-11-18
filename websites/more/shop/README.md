# Shop

A simple sales section of joshfreeman.org, at `/websites/more/shop/`.

## Adding items

Edit `items.json`. Each item needs:

- `name` — the listing title
- `price` — a number, in US dollars
- `description` — a short description
- `image` — a path relative to this folder (for example `img/my-item.jpg`)
- `status` — `available` or `sold`
- `buyUrl` — optional. A Stripe Payment Link or Shopify checkout URL. If it is set, the item shows a Buy button that opens that link. If it is left out, the item shows an Order request form instead.

Add the image file under `img/`, then commit and push. Put real products and prices in only when they are real.

The three current listings are examples. Replace or remove them before selling.

## Connecting checkout

1. Change `ORDER_EMAIL` at the top of `shop.js` from the placeholder `orders@example.com` to the address that should receive order requests. Until that is changed, the shop shows “Ordering not yet connected” and does not send mail.
2. To take payment on an item, add a `buyUrl` for that item (a Stripe Payment Link or a Shopify checkout link). Do not put card numbers or secret keys in these files.

This folder is only a front end. It does not create payment accounts and does not talk to Shopify by itself.
