// Источники: Microsoft Bing, Google (через скрытый фрейм), Brave Search
const cut=(t,n=320)=>t.length>n?t.slice(0,n-3)+'…':t;
const isBing=h=>/(^|\.)bing\.com$/.test(h);
function real(h){try{const u=new URL(h,'https://www.bing.com');
 if(isBing(u.hostname)){if(u.pathname.startsWith('/ck/')){let p=u.searchParams.get('u');if(p&&p.startsWith('a1')){p=p.slice(2).replace(/-/g,'+').replace(/_/g,'/');while(p.length%4)p+='=';const x=atob(p);return /^https?:/.test(x)?x:null}}return null}
 return /^https?:/.test(u.protocol)?u.href:null}catch(e){return null}}
const T=e=>(e?(e.textContent||''):'').replace(/\s+/g,' ').trim();
async function bing(q,s){const r=await fetch('https://www.bing.com/search?q='+encodeURIComponent(q)+'&setlang=ru&mkt=ru-RU&cc=RU&first='+(s+1),{credentials:'omit'});
 const html=await r.text(),doc=new DOMParser().parseFromString(html,'text/html'),out=[],used=new Set();
 const abs=h=>{try{return new URL(h,'https://www.bing.com').href}catch(e){return null}};
 const take=(a,box)=>{if(!a)return;const title=T(a);if(!title||title.length<2)return;
  let url=real(a.getAttribute('href'));
  if(!url){const c=T(box.querySelector('cite'));if(c&&/\./.test(c))url='https://'+c.replace(/^https?:\/\//,'').split(/[\s›]/)[0]}
  if(!url)url=abs(a.getAttribute('href'));if(!url||used.has(url))return;
  const sn=box.querySelector('.b_caption p,.b_lineclamp2,.b_lineclamp3,.b_lineclamp4,.b_algoSlug,p');
  let t=T(sn);if(t===title)t='';if(t.length>320)t=t.slice(0,317)+'…';used.add(url);out.push({url,title,snippet:t})};
 doc.querySelectorAll('li.b_algo').forEach(li=>{
  const as=[...li.querySelectorAll('a[href]')];
  const a=li.querySelector('a.tilk')||li.querySelector('h2 a')||as.find(x=>real(x.getAttribute('href')))||as.find(x=>/\/ck\//.test(x.getAttribute('href')||''));
  if(!a)return;
  let title=T(li.querySelector('.tptt'))||T(li.querySelector('h2'))||T(a);
  const sn=li.querySelector('.b_caption p,.b_lineclamp2,.b_lineclamp3,.b_lineclamp4,.b_algoSlug,.tpcn p');
  let t=T(sn);
  if(!t){t=T(li).replace(title,'').trim()}
  if(t.length>320)t=t.slice(0,317)+'…';
  let url=real(a.getAttribute('href'));
  if(!url){const c=T(li.querySelector('cite'));if(c&&/\./.test(c))url='https://'+c.replace(/^https?:\/\//,'').split(/[\s›]/)[0]}
  if(!url)url=abs(a.getAttribute('href'));
  if(!title||!url||used.has(url))return;used.add(url);out.push({url,title,snippet:t})});
 if(!out.length)doc.querySelectorAll('#b_results > li').forEach(li=>take(li.querySelector('h2 a'),li));
 if(!out.length)doc.querySelectorAll('h2 a[href]').forEach(a=>take(a,a.closest('li')||a.parentElement.parentElement||doc.body));
 if(!out.length)doc.querySelectorAll('#b_results a[href]').forEach(a=>{const u=real(a.getAttribute('href'));if(!u||used.has(u))return;const t=T(a);if(t.length<4)return;const box=a.closest('li')||a.parentElement;take(a,box)});
 if(!out.length){doc.querySelectorAll('script,style').forEach(e=>e.remove());
  return{results:[],debug:{status:r.status,title:T(doc.querySelector('title')),size:html.length,b_algo:(html.match(/b_algo/g)||[]).length,h2:doc.querySelectorAll('h2').length,a:doc.querySelectorAll('a').length,b_results:[...doc.querySelectorAll('#b_results > *')].slice(0,8).map(e=>e.tagName+'.'+e.className).join(' | '),text:T(doc.body).slice(0,200)}}}
 return{results:out}}

async function brave(q,s){const r=await fetch('https://search.brave.com/search?q='+encodeURIComponent(q)+'&source=web&offset='+(s/10),{credentials:'omit'});
 if(!r.ok)return{results:[],error:'HTTP '+r.status};
 const html=await r.text(),doc=new DOMParser().parseFromString(html,'text/html'),out=[],used=new Set();
 const ext=h=>{try{const u=new URL(h,'https://search.brave.com');return /^https?:$/.test(u.protocol)&&!/(^|\.)brave\.com$/.test(u.hostname)?u.href:null}catch(e){return null}};
 const add=(a,box)=>{const url=ext(a.getAttribute('href'));if(!url||used.has(url))return;
  const title=T(box.querySelector('.title,.snippet-title,[class*="title"]'))||T(a);if(title.length<3)return;
  let t=T(box.querySelector('.snippet-description,.generic-snippet,.content,[class*="description"]'));if(t===title)t='';
  used.add(url);out.push({url,title:cut(title,140),snippet:cut(t)})};
 doc.querySelectorAll('.snippet[data-type="web"],#results .snippet').forEach(b=>{const a=b.querySelector('a[href]');if(a)add(a,b)});
 if(!out.length)doc.querySelectorAll('#results a[href]').forEach(a=>{if(T(a).length>12)add(a,a.closest('div')||a.parentElement)});
 if(!out.length){doc.querySelectorAll('script,style').forEach(e=>e.remove());return{results:[],debug:{status:r.status,title:T(doc.querySelector('title')),size:html.length,text:T(doc.body).slice(0,160)}}}
 return{results:out}}
function google(q,s){return new Promise(res=>{const id=Math.random().toString(36).slice(2,10);
 const f=document.createElement('iframe');f.style.cssText='position:fixed;left:-9999px;top:0;width:1000px;height:800px;border:0';
 const end=d=>{clearTimeout(t);browser.runtime.onMessage.removeListener(h);f.remove();res(d)};
 const h=m=>{if(m&&m.type==='results'&&m.id===id)end(m.blocked?{results:[],error:m.blocked==='captcha'?'капча Google':'окно согласия Google'}:m)};
 const t=setTimeout(()=>end({results:[],error:'таймаут'}),15000);
 browser.runtime.onMessage.addListener(h);
 f.src='https://www.google.com/search?hl=ru&q='+encodeURIComponent(q)+(s?'&start='+s:'')+'#kubik-'+id;document.body.append(f)})}
// DuckDuckGo: берём версию без JavaScript (html.duckduckgo.com), у обычной страницы результатов в HTML их нет
async function ddg(q,s){
 if(s>0)return{results:[]}; // дальше нужны одноразовые токены, поэтому только первая страница
 const r=await fetch('https://html.duckduckgo.com/html/?q='+encodeURIComponent(q)+'&kl=ru-ru',{credentials:'omit'});
 if(!r.ok)return{results:[],error:'HTTP '+r.status};
 const html=await r.text(),doc=new DOMParser().parseFromString(html,'text/html'),out=[],used=new Set();
 const real=h=>{try{const u=new URL(h,'https://duckduckgo.com');const t=u.searchParams.get('uddg');if(t)return t;return /^https?:$/.test(u.protocol)&&!/(^|\.)duckduckgo\.com$/.test(u.hostname)?u.href:null}catch(e){return null}};
 doc.querySelectorAll('.result:not(.result--ad)').forEach(b=>{const a=b.querySelector('a.result__a');if(!a)return;const url=real(a.getAttribute('href'));if(!url||used.has(url))return;
  used.add(url);out.push({url,title:cut(T(a),140),snippet:cut(T(b.querySelector('.result__snippet')))})});
 if(!out.length){if(/anomaly|captcha/i.test(html))return{results:[],error:'капча DuckDuckGo'};
  doc.querySelectorAll('script,style').forEach(e=>e.remove());return{results:[],debug:{status:r.status,title:T(doc.querySelector('title')),size:html.length,text:T(doc.body).slice(0,160)}}}
 return{results:out}}
// Startpage: адрес https://www.startpage.com/sp/search?query=...
async function startpage(q,s){
 const r=await fetch('https://www.startpage.com/sp/search?query='+encodeURIComponent(q)+(s?'&page='+(s/10+1):''),{credentials:'omit'});
 if(!r.ok)return{results:[],error:'HTTP '+r.status};
 const html=await r.text(),doc=new DOMParser().parseFromString(html,'text/html'),out=[],used=new Set();
 const ext=h=>{try{const u=new URL(h,'https://www.startpage.com');return /^https?:$/.test(u.protocol)&&!/(^|\.)startpage\.com$/.test(u.hostname)?u.href:null}catch(e){return null}};
 const add=(a,box)=>{const url=ext(a.getAttribute('href'));if(!url||used.has(url))return;
  const title=T(box.querySelector('.result-title,h2,h3,[class*="title"]'))||T(a);if(title.length<3)return;
  let t=T(box.querySelector('.description,[class*="description"],p'));if(t===title)t='';used.add(url);out.push({url,title:cut(title,140),snippet:cut(t)})};
 doc.querySelectorAll('a.result-title,a.result-link,a[class*="result-title"]').forEach(a=>add(a,a.closest('.result,.w-gl__result,article,li')||a.parentElement.parentElement||doc.body));
 if(!out.length)doc.querySelectorAll('#main a[href],main a[href]').forEach(a=>{if(T(a).length>14)add(a,a.closest('div')||a.parentElement)});
 if(!out.length){if(/captcha/i.test(html))return{results:[],error:'капча Startpage'};
  doc.querySelectorAll('script,style').forEach(e=>e.remove());return{results:[],debug:{status:r.status,title:T(doc.querySelector('title')),size:html.length,text:T(doc.body).slice(0,160)}}}
 return{results:out}}

// ---------- Картинки и видео ----------
const absB=h=>{try{return new URL(h,'https://www.bing.com').href}catch(e){return''}};
async function bingImages(q,s){const r=await fetch('https://www.bing.com/images/async?q='+encodeURIComponent(q)+'&first='+(s+1)+'&count=35&mmasync=1&setlang=ru&mkt=ru-RU&cc=RU',{credentials:'omit'});
 if(!r.ok)return{results:[],error:'HTTP '+r.status};
 const html=await r.text(),doc=new DOMParser().parseFromString(html,'text/html'),out=[],used=new Set();
 doc.querySelectorAll('a[m]').forEach(a=>{let j;try{j=JSON.parse(a.getAttribute('m'))}catch(e){return}
  const full=j&&j.murl;if(!full||used.has(full))return;used.add(full);out.push({img:full,thumb:j.turl||full,title:cut(j.t||'',120),page:j.purl||full})});
 if(!out.length)doc.querySelectorAll('img.mimg').forEach(i=>{const src=absB(i.getAttribute('src')||i.getAttribute('data-src')||'');if(!/^https?:/.test(src)||used.has(src))return;used.add(src);const a=i.closest('a');out.push({img:src,thumb:src,title:cut(i.getAttribute('alt')||'',120),page:a?absB(a.getAttribute('href')):src})});
 if(!out.length){doc.querySelectorAll('script,style').forEach(e=>e.remove());return{results:[],debug:{status:r.status,size:html.length,withM:doc.querySelectorAll('[m]').length,text:T(doc.body).slice(0,160)}}}
 return{results:out}}
async function bingVideos(q,s){const r=await fetch('https://www.bing.com/videos/search?q='+encodeURIComponent(q)+'&setlang=ru&mkt=ru-RU&cc=RU&first='+(s+1),{credentials:'omit'});
 if(!r.ok)return{results:[],error:'HTTP '+r.status};
 const html=await r.text(),doc=new DOMParser().parseFromString(html,'text/html'),out=[],used=new Set();
 doc.querySelectorAll('[vrhm]').forEach(e=>{let j;try{j=JSON.parse(e.getAttribute('vrhm'))}catch(x){return}
  const url=j&&(j.murl||j.pgurl||j.purl);if(!url||used.has(url))return;used.add(url);const im=e.querySelector('img');
  const th=j.turl||j.thumb||(im&&(im.getAttribute('src')||im.getAttribute('data-src')))||'';
  out.push({url,title:cut(j.vt||j.t||j.title||T(e.querySelector('.mc_vtvc_title'))||url,140),thumb:th?absB(th):'',dur:j.du||'',by:j.ch||j.pub||''})});
 if(!out.length){const HOSTS=/(youtube\.com\/watch|youtu\.be\/|vimeo\.com\/\d|rutube\.ru\/video|dailymotion\.com\/video|vk\.com\/video)/;
  doc.querySelectorAll('a[href]').forEach(a=>{const u=a.getAttribute('href')||'';if(!HOSTS.test(u)||used.has(u))return;const im=a.querySelector('img'),t=T(a);if(t.length<4&&!im)return;used.add(u);
   const th=im?(im.getAttribute('src')||im.getAttribute('data-src')||''):'';out.push({url:u,title:cut(t||(im&&im.getAttribute('alt'))||u,140),thumb:th?absB(th):'',dur:'',by:''})})}
 if(!out.length){doc.querySelectorAll('script,style').forEach(e=>e.remove());return{results:[],debug:{status:r.status,size:html.length,withVrhm:doc.querySelectorAll('[vrhm]').length,text:T(doc.body).slice(0,160)}}}
 return{results:out}}
function parseYT(html){const i=html.indexOf('ytInitialData');if(i<0)return null;const a=html.indexOf('{',i),b=html.indexOf(';</script>',a);if(a<0||b<0)return null;
 let d;try{d=JSON.parse(html.slice(a,b))}catch(e){return null}
 const found=[],walk=o=>{if(!o||typeof o!=='object')return;if(o.videoRenderer&&o.videoRenderer.videoId){found.push(o.videoRenderer);return}for(const k in o)walk(o[k])};walk(d);
 return found.map(v=>({url:'https://www.youtube.com/watch?v='+v.videoId,title:cut(((v.title&&v.title.runs)||[]).map(x=>x.text).join('')||'Видео',140),thumb:'https://i.ytimg.com/vi/'+v.videoId+'/mqdefault.jpg',
  dur:(v.lengthText&&v.lengthText.simpleText)||'',by:(v.ownerText&&v.ownerText.runs&&v.ownerText.runs[0]&&v.ownerText.runs[0].text)||'',views:(v.viewCountText&&v.viewCountText.simpleText)||''}))}
async function youtube(q,s){if(s)return{results:[]};const r=await fetch('https://www.youtube.com/results?search_query='+encodeURIComponent(q)+'&hl=ru&gl=RU',{credentials:'omit'});
 if(!r.ok)return{results:[],error:'HTTP '+r.status};const html=await r.text(),res=parseYT(html);
 if(!res)return{results:[],error:'YouTube не отдал список (возможно, окно согласия)',debug:{url:r.url,size:html.length}};return{results:res}}
const vkey=u=>{try{const x=new URL(u);if(/(^|\.)youtube\.com$/.test(x.hostname)&&x.searchParams.get('v'))return'yt:'+x.searchParams.get('v');if(x.hostname==='youtu.be')return'yt:'+x.pathname.slice(1);return x.hostname.replace(/^www\./,'')+x.pathname}catch(e){return u}};
function mergeVideos(lists){const m=new Map();lists.forEach(d=>((d&&d.results)||[]).forEach(v=>{const k=vkey(v.url);if(!m.has(k))m.set(k,Object.assign({},v));else{const o=m.get(k);for(const f of['thumb','dur','by','views'])if(!o[f]&&v[f])o[f]=v[f]}}));return[...m.values()]}
