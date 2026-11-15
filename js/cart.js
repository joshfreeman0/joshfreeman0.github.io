/* joshfreeman.org cart — localStorage, priced in USD + X (XMoney). No external shop. */
(function(global){
var KEY='jf_cart_v1';
var SIZES={'8x10':{label:'8″×10″ canvas',usd:21},'16x20':{label:'16″×20″ canvas',usd:37.5}};
var BOOKS={'wampum-catalog':{title:'Wampum Catalog',label:'Paperback book',usd:10,image:'images/books/wampum-catalog.jpg'},'king-george':{title:'King George (the chicken)',label:'Paperback book',usd:9.99,image:'images/books/king-george.jpg'},'captain-fred':{title:'Captain Fred (the fish)',label:'Paperback book',usd:9.99,image:'images/books/captain-fred.jpg'}};
function addBook(sku,qty){var b=BOOKS[sku];if(!b)return null;qty=Math.max(1,qty|0||1);var id='book__'+sku,a=load(),f=a.filter(function(i){return i.id===id;})[0];
  if(f)f.qty=Math.min(99,f.qty+qty);else a.push({id:id,type:'book',sku:sku,title:b.title,image:b.image,size:'book',label:b.label,priceUsd:b.usd,qty:qty});
  save(a);toast('Added “'+b.title+'” (paperback)');return id;}
function load(){try{var a=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(a)?a:[];}catch(e){return [];}}
function save(a){try{localStorage.setItem(KEY,JSON.stringify(a));}catch(e){}emit();}
function emit(){var n=count();document.querySelectorAll('[data-cart-count]').forEach(function(el){el.textContent=n;el.hidden=!n;});
  document.dispatchEvent(new CustomEvent('cart-change',{detail:{items:load(),count:n}}));}
function base(img){return String(img||'').split('/').pop().replace(/\.[a-z0-9]+$/i,'');}
function count(){return load().reduce(function(s,i){return s+(i.qty|0);},0);}
function add(p,size,qty){size=SIZES[size]?size:'8x10';qty=Math.max(1,qty|0||1);
  var id=base(p.image)+'__'+size,a=load(),f=a.filter(function(i){return i.id===id;})[0];
  if(f)f.qty=Math.min(99,f.qty+qty);else a.push({id:id,title:p.title,image:p.image,size:size,priceUsd:SIZES[size].usd,qty:qty});
  save(a);toast('Added “'+p.title+'” ('+SIZES[size].label+')');return id;}
function update(id,qty){var a=load();qty=qty|0;a=a.map(function(i){if(i.id===id)i.qty=Math.min(99,qty);return i;}).filter(function(i){return i.qty>0;});save(a);}
function remove(id){save(load().filter(function(i){return i.id!==id;}));}
function clear(){save([]);}
function subtotal(){return Math.round(load().reduce(function(s,i){return s+i.priceUsd*i.qty;},0)*100)/100;}
function toast(msg){var t=document.getElementById('cart-toast');if(!t){t=document.createElement('div');t.id='cart-toast';t.className='cart-toast';t.setAttribute('role','status');document.body.appendChild(t);}
  t.innerHTML=msg+' · <a href="cart.html">View cart</a>';t.classList.add('is-on');clearTimeout(t._h);t._h=setTimeout(function(){t.classList.remove('is-on');},3500);}
function sizeSelect(cls){return '<select class="'+(cls||'cart-size')+'" aria-label="Canvas size">'+Object.keys(SIZES).map(function(k){return '<option value="'+k+'">'+SIZES[k].label+' — $'+SIZES[k].usd.toFixed(2).replace(/\.00$/,'')+'</option>';}).join('')+'</select>';}
function badge(){var nav=document.getElementById('site-nav');if(!nav||nav.querySelector('.cart-link'))return;
  var a=document.createElement('a');a.href='cart.html';a.className='cart-link';a.setAttribute('aria-label','Cart');
  if(/cart\.html$/.test(location.pathname))a.setAttribute('aria-current','page');
  a.innerHTML='Cart <span class="cart-badge" data-cart-count hidden>0</span>';nav.appendChild(a);}
global.JFCart={SIZES:SIZES,BOOKS:BOOKS,addBook:addBook,load:load,add:add,update:update,remove:remove,clear:clear,count:count,subtotal:subtotal,sizeSelect:sizeSelect};
window.addEventListener('storage',function(e){if(e.key===KEY)emit();});
function bindBooks(){document.querySelectorAll('[data-add-book]').forEach(function(b){if(b._jf)return;b._jf=1;b.addEventListener('click',function(){addBook(b.getAttribute('data-add-book'),1);});});}
function init(){badge();emit();bindBooks();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})(window);
