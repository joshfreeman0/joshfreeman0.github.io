/* PayPal as second payment option on cart.html. Hidden until api/paypal-config.php exists. */
(function(){var w=document.getElementById('paypal-wrap');if(!w||!window.JFCart)return;
fetch('api/paypal-client-id.php').then(function(r){return r.json();}).then(function(c){if(!c||!c.clientId)return;
  var s=document.createElement('script');s.src='https://www.paypal.com/sdk/js?client-id='+encodeURIComponent(c.clientId)+'&currency=USD&intent=capture&disable-funding=card';
  s.onload=function(){w.hidden=false;var msg=document.getElementById('cart-msg');
    paypal.Buttons({style:{layout:'horizontal',label:'paypal',tagline:false},
      createOrder:function(){var X=window.XMoney&&XMoney.getState()||{};return fetch('api/create-checkout.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({provider:'paypal',items:JFCart.load(),usdPerX:X.usdPerX||null,kitcoAsk:X.ask||null,locale:(window.JFCurrency&&JFCurrency.locale)||null})}).then(function(r){return r.json();}).then(function(d){if(!d.id)throw new Error(d.error||'PayPal unavailable');return d.id;});},
      onApprove:function(d){return fetch('api/paypal-capture.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({orderID:d.orderID})}).then(function(r){return r.json();}).then(function(r){if(r.status==='COMPLETED'){try{JFCart.clear?JFCart.clear():localStorage.removeItem('jf-cart');}catch(e){}location.href='cart-success.html?paypal='+encodeURIComponent(r.id);}else if(msg)msg.textContent=r.error||'PayPal payment not completed.';});},
      onError:function(e){if(msg)msg.textContent=(e&&e.message)||'PayPal error — try card checkout.';}}).render('#paypal-buttons');};
  document.head.appendChild(s);}).catch(function(){});})();
