(function(){if(document.querySelector('.jf-scroll'))return;
var w=document.createElement('div');w.className='jf-scroll';
w.innerHTML='<button type="button" aria-label="Jump to top" class="jf-up">&#8593;</button><button type="button" aria-label="Jump to bottom" class="jf-dn">&#8595;</button>';
document.body.appendChild(w);var u=w.children[0],d=w.children[1];
function bottom(){return Math.max(document.documentElement.scrollHeight,document.body.scrollHeight);}
u.onclick=function(){window.scrollTo({top:0,behavior:'auto'})};
d.onclick=function(){window.scrollTo({top:bottom(),behavior:'auto'})};
function upd(){var y=window.scrollY,m=bottom()-window.innerHeight;u.hidden=y<40;d.hidden=y>m-40;}
window.addEventListener('scroll',upd,{passive:true});window.addEventListener('resize',upd);upd();})();
/* art-only 2026-10-29 */
(function(){var H=/books\.html|shop\.html|marketplaces\.html|featured-x\.html|history\.html|islands\.html|construction\.html|\/coast\/|#jewelry|#photographs|wampum|amoris\.html|logins\.html|#gallery$/i;
function run(){if(!document.querySelector('link[href*="art-only.css"]')){var l=document.createElement('link');l.rel='stylesheet';l.href='/css/art-only.css?v=20261029art8';document.head.appendChild(l);}
document.querySelectorAll('a[href]').forEach(function(a){if(H.test(a.getAttribute('href'))){var li=a.closest('li');(li&&li.children.length===1?li:a).remove();}});
document.querySelectorAll('[data-kitco-silver-ask],[data-kitco-gold-ask],[data-kitco-copper-ask]').forEach(function(e){var b=e.closest('aside,header>div:not(.wh-header__inner),.announce,[class*=bar],[class*=ticker],p');(b&&!b.querySelector('.jfm-btn,.wh-mark')?b:e).remove()});document.querySelectorAll('.wh-book,#jewelry,#photographs').forEach(function(e){e.remove()});
var w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT),n;while(n=w.nextNode()){if(/Paintings?/.test(n.nodeValue)&&!n.parentNode.closest('script,style'))n.nodeValue=n.nodeValue.replace(/Paintings/g,'Art').replace(/\bPainting\b(?= by)/g,'Art');}
document.querySelectorAll('a').forEach(function(a){if(/^\s*(Jewelry|Wampum World)\s*$/i.test(a.textContent)){var li=a.closest('li');(li&&li.children.length===1?li:a).remove();}});document.querySelectorAll('.jf-fx-note,[data-kitco-silver-ask],[data-kitco-gold-ask],[data-kitco-copper-ask],[class*=kitco]').forEach(function(e){e.remove()});document.querySelectorAll('body *').forEach(function(e){if(e.children.length<6&&/Live rate|Kitco/i.test(e.textContent)&&!e.closest('script,style')&&!e.querySelector('.jfm-btn,.wh-mark,main,#grid'))e.style.display='none'});var w2=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT),m;while(m=w2.nextNode()){if(/Wampum World|jewelry/i.test(m.nodeValue)&&!m.parentNode.closest('script,style'))m.nodeValue=m.nodeValue.replace(/,?\s*alongside Wampum World handmade jewelry[^.]*/i,'').replace(/Wampum World|jewelry/gi,'');}
document.title=document.title.replace(/Paintings/g,'Art');}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();})();

/* universal language bar art2 */
(function(){var L=[['','Language'],['en','English'],['es','Español'],['fr','Français'],['de','Deutsch'],['it','Italiano'],['pt','Português'],['nl','Nederlands'],['pl','Polski'],['ru','Русский'],['uk','Українська'],['tr','Türkçe'],['ar','العربية'],['he','עברית'],['hi','हिन्दी'],['zh-CN','中文(简体)'],['zh-TW','中文(繁體)'],['ja','日本語'],['ko','한국어'],['vi','Tiếng Việt'],['th','ไทย'],['id','Bahasa Indonesia'],['sv','Svenska'],['no','Norsk'],['da','Dansk'],['fi','Suomi'],['el','Ελληνικά'],['cs','Čeština'],['ro','Română'],['hu','Magyar'],['ga','Gaeilge'],['sw','Kiswahili']];
function go(){if(document.getElementById('jf-ulang'))return;var s=document.createElement('select');s.id='jf-ulang';s.setAttribute('aria-label','Language');s.className='notranslate';
var cur=(document.cookie.match(/googtrans=\/[^\/]+\/([^;]+)/)||[])[1]||'';L.forEach(function(x){var o=document.createElement('option');o.value=x[0];o.textContent=x[1];if(x[0]&&x[0]===cur)o.selected=true;s.appendChild(o);});
s.onchange=function(){var v=s.value,h=location.hostname;if(!v||v==='en'){document.cookie='googtrans=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT';document.cookie='googtrans=;path=/;domain=.'+h+';expires=Thu, 01 Jan 1970 00:00:00 GMT';}else{document.cookie='googtrans=/en/'+v+';path=/';document.cookie='googtrans=/en/'+v+';path=/;domain=.'+h;}location.reload();};
document.body.appendChild(s);if(cur&&cur!=='en'){var d=document.createElement('div');d.id='google_translate_element';d.style.display='none';document.body.appendChild(d);window.jfGT=function(){new google.translate.TranslateElement({pageLanguage:'en',autoDisplay:false},'google_translate_element');};var g=document.createElement('script');g.src='https://translate.google.com/translate_a/element.js?cb=jfGT';document.body.appendChild(g);}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',go);else go();})();

/* art3: no music UI/autoplay; hide Amoris/Logins/Account/Gallery/Music nav */
(function(){window.JF_NO_MUSIC=true;
function k(){document.querySelectorAll('audio').forEach(function(a){try{a.pause();a.autoplay=false;a.muted=true;}catch(e){}});
document.querySelectorAll('.bg-music-btn,.bg-music-controls,.bg-music-player,.jfm-bar,[class*=bg-music],[id*=music],[class*=music-tab],[data-music]').forEach(function(e){e.remove()});
document.querySelectorAll('header a,nav a,footer a,.menu a,[class*=nav] a,[class*=menu] a').forEach(function(a){if(/^\s*(Amoris|Logins?|Account|Music|Songs?|Playlist)\s*$/i.test(a.textContent)){var li=a.closest('li');(li&&li.children.length===1?li:a).remove();}});}
k();document.addEventListener('DOMContentLoaded',k);window.addEventListener('load',k);[300,1000,2500,5000].forEach(function(t){setTimeout(k,t)});
document.addEventListener('play',function(e){if(e.target&&e.target.tagName==='AUDIO'){e.target.pause();}},true);})();

/* art5 hide shop */
(function(){function k(){document.querySelectorAll('a[href]').forEach(function(a){var h=a.getAttribute('href')||'';if(/shop\.html/i.test(h)||/^\s*(Shop|Search\s*\/?\s*Shop)\s*$/i.test(a.textContent)){var li=a.closest('li');(li&&li.children.length===1?li:a).remove();}});}
k();document.addEventListener('DOMContentLoaded',k);})();

/* art6 hide cart */
(function(){function k(){document.querySelectorAll('a[href*="cart"],.jfm-cart,.cart-add').forEach(function(e){var li=e.closest('li');(li&&li.children.length===1?li:e).remove();});}k();document.addEventListener('DOMContentLoaded',k);})();
