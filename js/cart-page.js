(function(){
var C=window.JFCart,box=document.getElementById('cart-items'),tot=document.getElementById('cart-total'),btn=document.getElementById('cart-checkout'),msg=document.getElementById('cart-msg');
function esc(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function money(u){return '$'+Number(u).toFixed(2);}
function xs(u){var X=window.XMoney;if(!X)return '';var x=X.usdToX(u);return x==null?'x…':X.formatX(x);}
function render(){var a=C.load();
  if(!a.length){box.innerHTML='<p class="cart-empty">Your cart is empty. <a href="index.html">Browse the gallery</a> or <a href="shop.html#paintings">shop paintings</a>.</p>';tot.innerHTML='';btn.disabled=true;return;}
  box.innerHTML=a.map(function(i){var line=i.priceUsd*i.qty;var s=C.SIZES[i.size];return '<div class="cart-row" data-id="'+esc(i.id)+'"><img src="'+esc(i.image)+'" alt=""><div class="cart-row__info"><strong>'+esc(i.title)+'</strong><small class="muted">'+esc(s?s.label:(i.label||i.size))+' · '+money(i.priceUsd)+' · '+xs(i.priceUsd)+' each</small>'+
  '<div class="cart-qty"><button type="button" data-d="-1" aria-label="Less">−</button><input type="number" min="1" max="99" value="'+i.qty+'" aria-label="Quantity"><button type="button" data-d="1" aria-label="More">+</button><button type="button" class="linkish cart-rm">Remove</button></div></div>'+
  '<div class="cart-row__price"><span class="cart-x">'+xs(line)+'</span><small>'+money(line)+'</small></div></div>';}).join('');
  var st=C.subtotal(),X=window.XMoney&&XMoney.getState();
  tot.innerHTML='<div class="cart-sum"><span>Subtotal</span><span class="cart-x">'+xs(st)+'</span><small>'+money(st)+' USD</small></div>'+
   '<p class="x-rate-note">'+(X&&X.usdPerX?'1 X = $'+X.usdPerX.toFixed(4)+' (Kitco silver ask $'+(X.ask||0).toFixed(2)+'/oz). ':'Loading live X rate… ')+'UK/EU cards pay in local currency (£/€) at checkout; your order is recorded in X at this rate. Shipping entered at checkout.</p>';
  btn.disabled=false;}
box.addEventListener('click',function(e){var r=e.target.closest('.cart-row');if(!r)return;var id=r.dataset.id;
  if(e.target.closest('.cart-rm'))return C.remove(id);var b=e.target.closest('button[data-d]');if(b){var q=+r.querySelector('input').value+ +b.dataset.d;C.update(id,Math.max(1,q));}});
box.addEventListener('change',function(e){var r=e.target.closest('.cart-row');if(r&&e.target.tagName==='INPUT')C.update(r.dataset.id,Math.max(0,+e.target.value||0));});
btn.addEventListener('click',function(){var X=window.XMoney&&XMoney.getState()||{};btn.disabled=true;msg.textContent='Opening secure checkout…';
  fetch('api/create-checkout.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:C.load(),usdPerX:X.usdPerX||null,kitcoAsk:X.ask||null,locale:(window.JFCurrency&&JFCurrency.locale)||null})})
  .then(function(r){return r.json().catch(function(){return {error:'Checkout server error ('+r.status+')'};});})
  .then(function(d){if(d&&d.url){location.href=d.url;return;}msg.textContent=(d&&d.error)||'Checkout unavailable.';btn.disabled=false;})
  .catch(function(){msg.textContent='Checkout unavailable — try again or email josh@joshfreeman.org.';btn.disabled=false;});});
document.addEventListener('cart-change',render);document.addEventListener('x-quote-ready',render);
if(/[?&]canceled=1/.test(location.search))msg.textContent='Checkout canceled — your cart is saved.';
render();
})();
