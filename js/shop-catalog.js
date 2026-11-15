/* Shop storefront: Jewelry catalog + Paintings + Photographs. */
(function(){
function slug(t){return String(t).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
function esc(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function refreshX(){if(window.XMoney&&XMoney.getState().ready)document.dispatchEvent(new CustomEvent('x-quote-ready',{detail:XMoney.getState()}));}
function sortBy(list,mode,price,title){var a=list.slice();
  if(mode==='price-asc')a.sort(function(x,y){return (price(x)||1e9)-(price(y)||1e9);});
  else if(mode==='price-desc')a.sort(function(x,y){return (price(y)||0)-(price(x)||0);});
  else if(mode==='title')a.sort(function(x,y){return title(x).localeCompare(title(y));});
  return a;}
function isPhoto(p){return /photo/i.test(p.medium||'');}

function jewelryCard(p){
  var price=p.price_min>0?'<p class="merch__price"><span class="card-x" data-x-from-usd="'+p.price_min+'" data-x-show-usd="1" data-x-label=""></span></p>':'';
  var range=(p.price_max>p.price_min)?'<p class="merch__note">$'+p.price_min+'–$'+p.price_max+'</p>':'';
  return '<a class="merch merch--product" href="product.html?handle='+encodeURIComponent(p.handle)+'">'+
    '<div class="merch__media"><img loading="lazy" src="'+esc(p.image||'')+'" alt="'+esc(p.title)+'"></div>'+
    '<div class="merch__body"><h3 class="merch__title">'+esc(p.title)+'</h3><p class="merch__meta">'+esc(p.product_type||'Jewelry')+'</p>'+price+range+
    '<span class="merch__cta">'+(p.variants&&p.variants.length>1?'View options':'View · Add to cart')+'</span></div></a>';
}

function artCard(p,i,kind){
  var idPrefix=kind==='photo'?'photo-':'painting-';
  var id=idPrefix+slug(p.title);
  if(!(p.priceUsd>0)){
    return '<a class="merch merch--product" id="'+id+'" href="mailto:josh@joshfreeman.org?subject='+encodeURIComponent('Art inquiry: '+p.title)+'">'+
      '<div class="merch__media"><img loading="lazy" src="'+esc(String(p.image).replace(/^images\/painting-/,'images/thumbs/painting-'))+'" decoding="async" alt="'+esc(p.title)+'"></div>'+
      '<div class="merch__body"><h3 class="merch__title">'+esc(p.title)+'</h3><p class="merch__note">Inquire</p><span class="merch__cta">Email</span></div></a>';
  }
  return '<div class="merch merch--product merch--buyable" id="'+id+'">'+
    '<div class="merch__media"><img loading="lazy" src="'+esc(String(p.image).replace(/^images\/painting-/,'images/thumbs/painting-'))+'" decoding="async" alt="'+esc(p.title)+'"></div>'+
    '<div class="merch__body"><h3 class="merch__title">'+esc(p.title)+'</h3>'+
    '<p class="merch__price"><span class="card-x" data-x-from-usd="'+p.priceUsd+'" data-x-show-usd="1" data-x-label="from"></span></p>'+
    '<p class="merch__meta">'+esc(p.medium||(kind==='photo'?'Photograph':'Painting'))+' · Canvas print</p>'+
    '<div class="merch-buy">'+(window.JFCart?JFCart.sizeSelect():'')+
    '<button type="button" class="btn" data-add-cart="'+i+'">Add to cart</button></div></div></div>';
}

var P=window.PAINTINGS||[];
var paints=P.map(function(p,i){return {p:p,i:i};}).filter(function(x){return !isPhoto(x.p);});
var photos=P.map(function(p,i){return {p:p,i:i};}).filter(function(x){return isPhoto(x.p);});

function bindArt(gridId,qId,countId,list,kind){
  var pg=document.getElementById(gridId),pq=document.getElementById(qId),pc=document.getElementById(countId);
  if(!pg)return;var ps=document.getElementById(qId.replace('-q','-sort'));
  function render(){var q=(pq&&pq.value||'').toLowerCase();
    var shown=list.filter(function(x){var p=x.p;return !q||(p.title+' '+(p.description||'')+' '+(p.medium||'')).toLowerCase().indexOf(q)>=0;});
    shown=sortBy(shown,ps&&ps.value,function(x){return x.p.priceUsd;},function(x){return x.p.title;});
    pg.innerHTML=shown.map(function(x){return artCard(x.p,x.i,kind);}).join('');
    if(pc)pc.textContent=shown.length+' products';
    refreshX();}
  pg.addEventListener('click',function(e){var b=e.target.closest('[data-add-cart]');if(!b||!window.JFCart)return;var s=b.parentNode.querySelector('select');JFCart.add(P[+b.dataset.addCart],s?s.value:'8x10',1);});
  if(pq)pq.addEventListener('input',render);if(ps)ps.addEventListener('change',render);render();
}
bindArt('paint-grid','paint-q','paint-count',paints,'painting');
bindArt('photo-grid','photo-q','photo-count',photos,'photo');

if(location.hash){var t=document.getElementById(location.hash.slice(1));if(t)setTimeout(function(){t.scrollIntoView({behavior:'smooth'});},80);}

// Sticky tab active state
(function(){
  var tabs=document.querySelectorAll('.shop-tabs a');
  if(!tabs.length)return;
  var ids=['jewelry','paintings','photographs'];
  function setActive(){
    var y=window.scrollY+120,cur=ids[0];
    ids.forEach(function(id){var el=document.getElementById(id);if(el&&el.offsetTop<=y)cur=id;});
    tabs.forEach(function(a){a.classList.toggle('is-active',a.getAttribute('href')==='#'+cur);});
  }
  window.addEventListener('scroll',setActive,{passive:true});setActive();
})();

var CATS=[['all','All'],['earrings','Earrings',/earring/],['pendants','Pendants',/pendant|necklace/],['rings','Rings',/\bring\b|rings/],['bracelets','Bracelets & cuffs',/bracelet|cuff|bangle/],['cabs','Cabs & beads',/\bcab|cabochon|bead/],['bolo','Bolos, pins & ties',/bolo|pin\b|tie |tie-|money clip|cuff link/],['tide-mark','Coast',/tide.?mark|coastal-fine/],['silver','Silver bullion',/troy ounce|bullion|\.999/]];
var cg=document.getElementById('cat-grid');if(!cg)return;
var cq=document.getElementById('cat-q'),cf=document.getElementById('cat-filter'),cpg=document.getElementById('cat-pages'),cc=document.getElementById('cat-count');
CATS.forEach(function(c){var o=document.createElement('option');o.value=c[0];o.textContent=c[1];cf.appendChild(o);});
var ALL=[],page=0,PER=48;
function hay(p){return (p.title+' '+(p.tags||[]).join(' ')+' '+p.product_type+' '+p.handle).toLowerCase();}
function filt(){var q=(cq.value||'').toLowerCase().trim(),c=CATS.filter(function(x){return x[0]===cf.value;})[0];
  var cs=document.getElementById('cat-sort');return sortBy(ALL.filter(function(p){var h=p._h;if(c&&c[2]&&!c[2].test(h))return false;return !q||q.split(/\s+/).every(function(w){return h.indexOf(w)>=0;});}),cs&&cs.value,function(p){return p.price_min;},function(p){return p.title;});}
function renderC(){var list=filt(),n=Math.max(1,Math.ceil(list.length/PER));if(page>=n)page=n-1;
  cg.innerHTML=list.slice(page*PER,page*PER+PER).map(jewelryCard).join('')||'<p class="muted">No matches.</p>';
  cc.textContent=list.length+' products';
  var h='';if(n>1){h+='<button '+(page?'':'disabled')+' data-p="'+(page-1)+'">‹ Prev</button><span>Page '+(page+1)+' / '+n+'</span><button '+(page<n-1?'':'disabled')+' data-p="'+(page+1)+'">Next ›</button>';}
  cpg.innerHTML=h;refreshX();}
cpg.addEventListener('click',function(e){var b=e.target.closest('button');if(!b||b.disabled)return;page=+b.dataset.p;renderC();document.getElementById('jewelry').scrollIntoView();});
var chips=document.getElementById('cat-chips');if(chips)chips.addEventListener('click',function(e){var b=e.target.closest('[data-cat]');if(!b)return;cf.value=b.dataset.cat;page=0;chips.querySelectorAll('[data-cat]').forEach(function(x){x.classList.toggle('is-active',x===b);});renderC();});
cf.addEventListener('change',function(){if(chips)chips.querySelectorAll('[data-cat]').forEach(function(x){x.classList.toggle('is-active',x.dataset.cat===cf.value);});});
cq.addEventListener('input',function(){page=0;renderC();});cf.addEventListener('change',function(){page=0;renderC();});
var csel=document.getElementById('cat-sort');if(csel)csel.addEventListener('change',function(){page=0;renderC();});
function chipCounts(){if(!chips)return;chips.querySelectorAll('[data-cat]').forEach(function(b){var c=CATS.filter(function(x){return x[0]===b.dataset.cat;})[0];var n=c&&c[2]?ALL.filter(function(p){return c[2].test(p._h);}).length:ALL.length;if(!b.dataset.label)b.dataset.label=b.textContent;b.innerHTML=esc(b.dataset.label)+' <span class="chip__n">'+n+'</span>';});}
function isHiddenDropship(p){var h=String(p.handle||''),s=String(p.variants||'')+' '+String(p.tags||'');if(/WW-DS-[ACD]-|partner-?[acd]\b|silver[\s-]?unicorn|either[\s-]?ore|d\.?e\.?l\.?s\b/i.test(s+' '+String(p.vendor||'')))return true;return false;}
function isJewelryProduct(p){if(isHiddenDropship(p))return false;var t=String(p.product_type||'').toUpperCase(),h=p._h||hay(p);if(t==='CANVAS')return false;if(/canvas\s*print|canvas-print/.test(h))return false;if(/\bmug\b|hoodie|t-shirt|\btshirt\b/.test(h))return false;return true;}fetch('js/wampum-catalog.json').then(function(r){return r.json();}).then(function(d){ALL=(d.products||d).map(function(p){p._h=hay(p);return p;}).filter(isJewelryProduct);renderC();chipCounts();}).catch(function(){cc.textContent='Catalog unavailable — please refresh.';});
})();
