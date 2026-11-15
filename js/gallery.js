(function(){var P=window.PAINTINGS||[],g=document.getElementById('grid'),lb=document.getElementById('lb'),i=0;
function $(id){return document.getElementById(id)}
function cartUi(p){var w=document.querySelector('.lb-shop');if(!w)return;
  if(p.priceUsd>0&&window.JFCart){w.className='lb-shop cart-add';w.innerHTML=JFCart.sizeSelect()+'<button type="button" class="btn">Add to cart</button> <a class="btn ghost" href="cart.html">Cart</a>';
    w.querySelector('button').onclick=function(){JFCart.add(p,w.querySelector('select').value,1);};}
  else{w.className='lb-shop';w.innerHTML='<a class="btn" href="mailto:josh@joshfreeman.org?subject='+encodeURIComponent('Art inquiry: '+p.title)+'">Inquire about this piece</a>';}}
function priceHtml(p){
  var el=$('lb-price');
  if(!el)return;
  if(p.priceUsd!=null&&window.XMoney){
    var line=window.XMoney.priceLine(p.priceUsd);
    var note=p.priceNote?('<span class="x-price-note">'+p.priceNote+'</span>'):'';
    el.innerHTML='<span class="x-price-label">Price in X</span> '+line+(note?' · '+note:'');
    el.hidden=false;
  }else if(p.priceUsd!=null){
    el.innerHTML='<span class="x-price-label">Price</span> $'+Number(p.priceUsd).toFixed(2).replace(/\.00$/,'')+' USD <span class="x-price-note">(X rate loading…)</span>';
    el.hidden=false;
  }else{
    el.innerHTML='<span class="x-price-label">Price in X</span> <span class="x-price-note">Inquire for USD · X shown when priced</span>';
    el.hidden=false;
  }
}
P.forEach(function(p,n){var c=document.createElement('div');c.className='card';c.tabIndex=0;
c.innerHTML='<div class="card__img"><img loading="lazy"></div><div class="cap card__body"></div>';c.querySelector('img').src=String(p.image).replace(/^images\/painting-/,'images/thumbs/painting-');c.querySelector('img').alt=p.title;
c.querySelector('.cap').textContent=p.title;var s=document.createElement('span');
var bits=[p.artist,p.year].filter(Boolean);
if(p.priceUsd!=null) bits.push('from $'+Number(p.priceUsd).toFixed(0));
s.textContent=bits.join(', ');c.querySelector('.cap').appendChild(s);
if(p.priceUsd!=null){var x=document.createElement('span');x.className='card-x';x.setAttribute('data-x-from-usd',String(p.priceUsd));x.setAttribute('data-x-label','');c.querySelector('.cap').appendChild(x);}
c.onclick=function(){open(n)};c.onkeydown=function(e){if(e.key==='Enter')open(n)};g.appendChild(c)});
function show(){var p=P[i];$('lb-img').src=p.image;$('lb-img').alt=p.title;$('lb-title').textContent=p.title;
$('lb-meta').textContent=[p.artist,p.year,p.medium].filter(Boolean).join(' · ');$('lb-desc').textContent=p.description||'';priceHtml(p);cartUi(p);}
function open(n){i=n;show();lb.hidden=false}function close(){lb.hidden=true}
function step(d){i=(i+d+P.length)%P.length;show()}
lb.querySelector('.close').onclick=close;lb.querySelector('.prev').onclick=function(){step(-1)};lb.querySelector('.next').onclick=function(){step(1)};
lb.onclick=function(e){if(e.target===lb)close()};
document.addEventListener('keydown',function(e){if(lb.hidden)return;if(e.key==='Escape')close();if(e.key==='ArrowLeft')step(-1);if(e.key==='ArrowRight')step(1)});
document.addEventListener('x-quote-ready',function(){if(!lb.hidden)priceHtml(P[i]);});
})();
