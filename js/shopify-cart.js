/* Wampum World jewelry cart kept on joshfreeman.org. Checkout: api/create-checkout.php -> Stripe Checkout (server-side prices). */
(function(g){
var K='jf_shopify_cart_v1',SHOP='https://wampumworld.com';
function load(){try{return JSON.parse(localStorage.getItem(K))||[];}catch(e){return [];}}
function save(a){localStorage.setItem(K,JSON.stringify(a));document.dispatchEvent(new CustomEvent('cart-change'));}
g.ShopifyCart={SHOP:SHOP,load:load,
 add:function(it,qty){var a=load(),id=String(it.variantId),f=a.filter(function(x){return String(x.variantId)===id;})[0];
  if(f)f.qty=Math.min(99,f.qty+(qty||1));else a.push({variantId:id,productTitle:it.productTitle,variantTitle:it.variantTitle||'',price:+it.price,image:it.image||'',handle:it.handle,qty:qty||1});save(a);},
 update:function(id,q){var a=load().map(function(x){if(String(x.variantId)===String(id))x.qty=Math.min(99,q);return x;}).filter(function(x){return x.qty>0;});save(a);},
 remove:function(id){save(load().filter(function(x){return String(x.variantId)!==String(id);}));},
 clear:function(){save([]);},
 count:function(){return load().reduce(function(s,x){return s+x.qty;},0);},
 subtotal:function(){return load().reduce(function(s,x){return s+x.price*x.qty;},0);},
 checkout:function(){var a=load();if(!a.length)return Promise.resolve(null);var X=(g.XMoney&&g.XMoney.getState&&g.XMoney.getState())||{};
  /* Stripe Checkout on joshfreeman.org; server sets prices from api/jewelry-prices.json */
  return fetch('api/create-checkout.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:a.map(function(x){return{type:'jewelry',variantId:x.variantId,handle:x.handle,productTitle:x.productTitle,qty:x.qty};}),usdPerX:X.usdPerX||null,kitcoAsk:X.ask||null,locale:(window.JFCurrency&&JFCurrency.locale)||null})})
  .then(function(r){return r.json().catch(function(){return{error:'Checkout error (HTTP '+r.status+')'};});}).then(function(d){if(d&&d.url)return d.url;throw new Error(d&&d.error||'Checkout failed');});},
 checkoutUrl:function(){var a=load();if(!a.length)return null;return SHOP+'/cart/'+a.map(function(x){return x.variantId+':'+x.qty;}).join(',');}
};
})(window);
