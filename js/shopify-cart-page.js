(function(){
var C=window.ShopifyCart,box=document.getElementById('sc-items'),tot=document.getElementById('sc-total'),btn=document.getElementById('sc-checkout');if(!box)return;
function esc(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function money(u){return '$'+Number(u).toFixed(2);}
function xs(u){var X=window.XMoney;if(!X)return '';var x=X.usdToX(u);return x==null?'x…':X.formatX(x);}
function render(){var a=C.load();
 if(!a.length){box.innerHTML='<p class="cart-empty">No jewelry in your cart. <a href="shop.html#jewelry">Shop jewelry</a>.</p>';tot.innerHTML='';btn.disabled=true;return;}
 box.innerHTML=a.map(function(i){var line=i.price*i.qty;return '<div class="cart-row cart-row--shopify" data-vid="'+esc(i.variantId)+'"><a href="product.html?handle='+encodeURIComponent(i.handle)+'"><img src="'+esc(i.image)+'" alt=""></a><div class="cart-row__info"><strong><a href="product.html?handle='+encodeURIComponent(i.handle)+'">'+esc(i.productTitle)+'</a></strong><small class="muted">'+(i.variantTitle?esc(i.variantTitle)+' · ':'')+money(i.price)+' · '+xs(i.price)+' each</small>'+
 '<div class="cart-qty"><button type="button" data-d="-1">−</button><input type="number" min="1" max="99" value="'+i.qty+'" aria-label="Quantity"><button type="button" data-d="1">+</button><button type="button" class="linkish cart-rm">Remove</button></div></div>'+
 '<div class="cart-row__price"><span class="cart-x">'+xs(line)+'</span><small>'+money(line)+'</small></div></div>';}).join('');
 var st=C.subtotal();tot.innerHTML='<div class="cart-sum"><span>Jewelry subtotal</span><span class="cart-x">'+xs(st)+'</span><small>'+money(st)+' USD</small></div>';btn.disabled=false;}
box.addEventListener('click',function(e){var r=e.target.closest('.cart-row');if(!r)return;var id=r.dataset.vid;if(e.target.closest('.cart-rm'))return C.remove(id);var b=e.target.closest('button[data-d]');if(b)C.update(id,Math.max(1,+r.querySelector('input').value+ +b.dataset.d));});
box.addEventListener('change',function(e){var r=e.target.closest('.cart-row');if(r&&e.target.tagName==='INPUT')C.update(r.dataset.vid,Math.max(0,+e.target.value||0));});
btn.addEventListener('click',function(){btn.disabled=true;var t=btn.textContent;btn.textContent='Opening secure checkout…';C.checkout().then(function(u){if(u)location.href=u;else{btn.disabled=false;btn.textContent=t;}}).catch(function(e){alert(e.message||'Checkout failed');btn.disabled=false;btn.textContent=t;});});
document.addEventListener('cart-change',render);document.addEventListener('x-quote-ready',render);render();
})();
