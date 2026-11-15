(function(){
function esc(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function clean(h){return String(h||'').replace(/<(script|style|iframe)[\s\S]*?<\/\1>/gi,'').replace(/\son\w+="[^"]*"/gi,'').replace(/href="https?:\/\/(www\.)?wampumworld\.com[^"]*"/gi,'href="shop.html#jewelry"');}
var box=document.getElementById('product'),m=location.search.match(/[?&]handle=([^&]+)/),handle=m?decodeURIComponent(m[1]):'';
function nf(){document.title='Not found — Josh Freeman';box.innerHTML='<div class="pdp-nf"><h1>Product not found</h1><p><a class="btn" href="shop.html#jewelry">Back to Jewelry</a></p></div>';}
if(!handle)return nf();
fetch('js/wampum-catalog.json').then(function(r){return r.json();}).then(function(d){
 var p=(d.products||[]).filter(function(x){return x.handle===handle;})[0];if(!p)return nf();
 document.title=p.title+' — Josh Freeman';
 var imgs=p.images&&p.images.length?p.images:[p.image];
 var vs=p.variants||[];var single=vs.length<=1&&(!vs[0]||/default/i.test(vs[0].title));
 box.innerHTML='<p class="pdp-crumb"><a href="shop.html#jewelry">‹ Jewelry</a></p><div class="pdp">'+
  '<div class="pdp-gallery"><div class="pdp-main"><img id="pdp-img" src="'+esc(imgs[0])+'" alt="'+esc(p.title)+'"></div>'+
  (imgs.length>1?'<div class="pdp-thumbs">'+imgs.map(function(s,i){return '<button type="button" data-src="'+esc(s)+'"'+(i?'':' class="is-active"')+'><img loading="lazy" src="'+esc(s)+'" alt=""></button>';}).join('')+'</div>':'')+'</div>'+
  '<div class="pdp-info"><p class="pdp-vendor">'+esc(p.vendor||'Wampum World')+'</p><h1 class="pdp-title">'+esc(p.title)+'</h1>'+
  '<p class="pdp-price"><span id="pdp-usd"></span> <span id="pdp-x" class="card-x"></span></p>'+
  (single?'':'<label class="pdp-label">'+esc((p.options&&p.options[0])||'Option')+'<select id="pdp-var">'+vs.map(function(v){return '<option value="'+v.id+'"'+(v.available?'':' disabled')+'>'+esc(v.title)+(v.available?'':' — sold out')+'</option>';}).join('')+'</select></label>')+
  '<div class="pdp-buy"><div class="cart-qty"><button type="button" data-d="-1">−</button><input id="pdp-qty" type="number" min="1" max="99" value="1" aria-label="Quantity"><button type="button" data-d="1">+</button></div>'+
  '<button type="button" class="btn" id="pdp-add">Add to cart</button></div><p id="pdp-msg" class="cart-msg" role="status"></p>'+
  '<div class="pdp-desc">'+clean(p.body_html)+'</div></div></div>';
 var sel=document.getElementById('pdp-var');
 if(sel){var fa=vs.filter(function(v){return v.available;})[0];if(fa)sel.value=fa.id;}
 function cur(){var id=sel?sel.value:(vs[0]&&vs[0].id);return vs.filter(function(v){return String(v.id)===String(id);})[0];}
 function upd(){var v=cur();if(!v)return;var u=document.getElementById('pdp-usd');u.textContent='$'+v.price.toFixed(2);
  var x=document.getElementById('pdp-x');x.setAttribute('data-x-from-usd',v.price);x.setAttribute('data-x-show-usd','0');
  if(window.XMoney&&XMoney.getState().ready){var xv=XMoney.usdToX(v.price);x.textContent=xv==null?'':'· '+XMoney.formatX(xv);}
  var b=document.getElementById('pdp-add');b.disabled=!v.available;b.textContent=v.available?'Add to cart':'Sold out';}
 document.addEventListener('x-quote-ready',upd);if(sel)sel.addEventListener('change',upd);upd();
 box.addEventListener('click',function(e){var t=e.target.closest('[data-src]');if(t){document.getElementById('pdp-img').src=t.dataset.src;box.querySelectorAll('.pdp-thumbs button').forEach(function(b){b.classList.toggle('is-active',b===t);});return;}
  var d=e.target.closest('button[data-d]');if(d){var q=document.getElementById('pdp-qty');q.value=Math.max(1,Math.min(99,(+q.value||1)+ +d.dataset.d));return;}
  if(e.target.id==='pdp-add'){var v=cur();if(!v||!v.available)return;var q=Math.max(1,+document.getElementById('pdp-qty').value||1);
   ShopifyCart.add({variantId:v.id,productTitle:p.title,variantTitle:single?'':v.title,price:v.price,image:imgs[0],handle:p.handle},q);
   document.getElementById('pdp-msg').innerHTML='Added to cart. <a href="cart.html">View cart</a> · <a href="shop.html#jewelry">Keep shopping</a>';}});
}).catch(nf);
})();
