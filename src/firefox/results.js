const P=new URLSearchParams(location.search),Q=P.get('q')||'',TAB=['img','vid'].includes(P.get('t'))?P.get('t'):'all',enc=encodeURIComponent(Q);
Kubik.make($('#m1'));Kubik.make($('#m2'));attachSearch($('#q'),$('#sug'),$('#go'));$('#q').value=Q;document.title=Q+' — Кубик';
[['all',''],['img','&t=img'],['vid','&t=vid']].forEach(([id,x])=>{const a=$('#t-'+id);a.href='results.html?q='+enc+x;if(id===TAB)a.className='on'});
$('#n-news').href='https://www.bing.com/news/search?q='+enc;$('#n-map').href='https://www.bing.com/maps?q='+enc;$('#n-g').href='https://www.google.com/search?q='+enc;
$('#n-ddg').href='https://duckduckgo.com/?q='+enc;$('#n-sp').href='https://www.startpage.com/sp/search?query='+enc;
$('#m2').addEventListener('poke',()=>openChat());
const ENG=[{id:'google',name:'Google',fn:google,c:'#4285f4'},{id:'bing',name:'Bing',fn:bing,c:'#00897b'},{id:'brave',name:'Brave',fn:brave,c:'#fb542b'},{id:'ddg',name:'DuckDuckGo',fn:ddg,c:'#de5833'},{id:'startpage',name:'Startpage',fn:startpage,c:'#6573ff'}];
const seen=new Set(),CTX=[];let page=0,busy=false;
window.kubikCtx=()=>'Пользователь на странице поиска по запросу «'+Q+'». Найдено:\n'+CTX.slice(0,8).map((r,i)=>(i+1)+'. '+r.title+' — '+r.url+' — '+r.snippet).join('\n');
const norm=u=>{try{const x=new URL(u);return x.hostname.replace(/^www\./,'')+x.pathname.replace(/\/$/,'')+x.search}catch(e){return u}};
function merge(got){const map=new Map();
 ENG.forEach(e=>{const d=got[e.id];if(!d||!d.results)return;d.results.forEach((r,i)=>{const k=norm(r.url);if(seen.has(k))return;
  let m=map.get(k);if(!m){m={url:r.url,title:r.title,snippet:r.snippet||'',src:[],score:0,k};map.set(k,m)}
  if(!m.src.includes(e.id))m.src.push(e.id);m.score+=1/(60+i);if((r.snippet||'').length>m.snippet.length)m.snippet=r.snippet})});
 return[...map.values()].sort((a,b)=>b.score-a.score)}
// Закреплённый результат: по запросу про магазины расширений, про мой репозиторий или когда среди результатов больше трёх ссылок на Chrome Web Store
const SITE_URL='https://demomelon-git.github.io/kubik-web-store/';
const isCWS=u=>{try{const x=new URL(u);return x.hostname==='chromewebstore.google.com'||(x.hostname==='chrome.google.com'&&x.pathname.startsWith('/webstore'))}catch(e){return false}};
const PIN_Q=/demomelon|kubik[\s-]*web[\s-]*store|кубик\s*(web|веб)\s*-?\s*(store|стор)|chrome\s*web\s*-?\s*store|интернет[- ]магазин\s+chrome|магазин\s+(расширений|дополнений)|chrome\s*(extensions|расширени|дополнени)/i;
function pinHtml(list,first){if(!first)return'';
 if(!(PIN_Q.test(Q)||list.filter(r=>isCWS(r.url)).length>3))return'';
 return`<div class="r pin"><div class="site">demomelon-git.github.io <i class="src" style="background:#4285f4">Закреплено</i></div><a class="t" href="${SITE_URL}">demomelon-git / kubik-web-store</a><p>Сайт Кубика: дополнения для Firefox и Chrome, их версии и обновления.</p></div>`}
// ---------- картинки и видео ----------
const MEDIA={img:null,vid:null};let P0=null;
const imgCell=r=>`<a class="im" href="${esc(r.page||r.img)}" data-full="${esc(r.img)}" data-page="${esc(r.page||r.img)}"><img src="${esc(r.thumb)}" referrerpolicy="no-referrer" loading="lazy" alt="${esc(r.title||'')}"></a>`;
const vidCard=r=>`<a class="vd" href="${esc(r.url)}"><span class="th">${r.thumb?`<img src="${esc(r.thumb)}" referrerpolicy="no-referrer" loading="lazy" alt="">`:''}${r.dur?`<i class="du">${esc(r.dur)}</i>`:''}</span><span class="vi"><b>${esc(r.title)}</b><span>${esc([hostOf(r.url),r.by,r.views].filter(Boolean).join(' · '))}</span></span></a>`;
function mediaBlocks(first){const b={};if(!first)return b;
 const im=(MEDIA.img&&MEDIA.img.results)||[],vd=(MEDIA.vid&&MEDIA.vid.results)||[];
 if(im.length)b.img=`<div class="blk"><h4>Картинки</h4><div class="strip">${im.slice(0,12).map(imgCell).join('')}</div><a class="more-l" href="results.html?q=${enc}&t=img">Все картинки →</a></div>`;
 if(vd.length)b.vid=`<div class="blk"><h4>Видео</h4>${vd.slice(0,3).map(vidCard).join('')}<a class="more-l" href="results.html?q=${enc}&t=vid">Все видео →</a></div>`;
 return b}
const hostOf=u=>{try{return new URL(u).hostname.replace(/^www\./,'')}catch(e){return''}};
const guard=f=>f().catch(er=>({results:[],error:String(er&&er.message||er)}));
function lightbox(){const lb=document.createElement('div');lb.id='lb';lb.hidden=true;document.body.append(lb);
 lb.onclick=e=>{if(e.target===lb||e.target.id==='lbx')lb.hidden=true};
 document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('a.im');if(!a)return;e.preventDefault();
  lb.innerHTML=`<button id="lbx">✕</button><img referrerpolicy="no-referrer" src="${esc(a.dataset.full)}" alt=""><div class="lbi"><a target="_blank" rel="noopener" href="${esc(a.dataset.page)}">Открыть страницу</a> · <a target="_blank" rel="noopener" href="${esc(a.dataset.full)}">Открыть картинку</a></div>`;lb.hidden=false})}
function draw(sec,got,done,first){const list=merge(got);
 const chips=ENG.map(e=>{const d=got[e.id];const s=!d?'⏳':d.error?'✗':'✓ '+d.results.length;return`<span class="chip" style="border-color:${e.c};color:${e.c}" title="${esc(d&&d.error||'')}">${e.name} ${s}</span>`}).join('');
 const errs=ENG.filter(e=>got[e.id]&&got[e.id].error).map(e=>esc(e.name+': '+got[e.id].error)).join(' · ');
 const rows=list.map(r=>{const host=hostOf(r.url)||r.url;
  const b=r.src.map(id=>{const e=ENG.find(x=>x.id==id);return`<i class="src" style="background:${e.c}">${e.name}</i>`}).join('');
  return`<div class="r"><div class="site">${esc(host)} ${b}</div><a class="t" href="${esc(r.url)}">${esc(r.title)}</a>${r.snippet?`<p>${esc(r.snippet)}</p>`:''}</div>`});
 const mb=mediaBlocks(first);
 let h=`<div class="chips">${chips}</div>${errs?`<div class="errs">${errs}</div>`:''}`+pinHtml(list,first)+rows.slice(0,3).join('')+(mb.img||'')+rows.slice(3,6).join('')+(mb.vid||'')+rows.slice(6).join('');
 if(done&&!list.length)h+='<div class="msg">Ничего не найдено.'+ENG.map(e=>got[e.id]&&got[e.id].debug?`<details style="margin-top:8px"><summary>${e.name}: подробности</summary><pre style="white-space:pre-wrap;font-size:12px">${esc(JSON.stringify(got[e.id].debug,null,1))}</pre></details>`:'').join('')+'<br><a class="btn" target="_blank" rel="noopener" href="'+$('#n-g').href+'">Искать в Google</a></div>';
 sec.innerHTML=h;return list}
const redraw=()=>{if(P0)draw(P0.sec,P0.got,P0.done,true)};
function fetchMedia(){guard(()=>bingImages(Q,0)).then(d=>{MEDIA.img=d;redraw()});
 Promise.all([guard(()=>youtube(Q,0)),guard(()=>bingVideos(Q,0))]).then(l=>{MEDIA.vid={results:mergeVideos(l)};redraw()})}
async function loadPage(){if(busy||!Q)return;busy=true;Kubik.setSpeed(9);$('#more')?.remove();
 const s=page*10,first=page===0,sec=document.createElement('div'),got={};$('#res').append(sec);
 if(first){P0={sec,got,done:false};fetchMedia()}
 draw(sec,got,false,first);
 await Promise.all(ENG.map(e=>e.fn(Q,s).catch(er=>({results:[],error:String(er&&er.message||er)})).then(d=>{got[e.id]=d;draw(sec,got,false,first)})));
 const list=draw(sec,got,true,first);if(first)P0.done=true;list.forEach(r=>{seen.add(r.k);CTX.push(r)});
 Kubik.setSpeed(1);busy=false;
 if(list.length){const b=document.createElement('button');b.id='more';b.className='btn';b.textContent='Ещё результаты';b.onclick=()=>{page++;loadPage()};$('#res').append(b)}}
// вкладки «Картинки» и «Видео»
async function mediaTab(kind){$('#res').classList.add('wide');lightbox();
 const box=document.createElement('div');box.className=kind==='img'?'grid':'vlist';$('#res').append(box);const used=new Set();let pg=0;
 async function more(){if(busy)return;busy=true;Kubik.setSpeed(9);$('#more')?.remove();const s=pg*(kind==='img'?35:20);
  const got=kind==='img'?[await guard(()=>bingImages(Q,s))]:await Promise.all([guard(()=>youtube(Q,s)),guard(()=>bingVideos(Q,s))]);
  const raw=kind==='img'?got[0].results:mergeVideos(got),items=raw.filter(r=>{const k=kind==='img'?r.img:vkey(r.url);if(used.has(k))return false;used.add(k);return true});
  box.insertAdjacentHTML('beforeend',items.map(kind==='img'?imgCell:vidCard).join(''));
  const errs=got.filter(g=>g.error).map(g=>esc(g.error)).join(' · ');
  if(errs&&pg===0)box.insertAdjacentHTML('beforebegin','<div class="errs">'+errs+'</div>');
  if(!items.length&&pg===0)$('#res').insertAdjacentHTML('beforeend','<div class="msg">'+(kind==='img'?'Картинок не найдено.':'Видео не найдено.')+got.map(g=>g.debug?`<details style="margin-top:8px"><summary>подробности</summary><pre style="white-space:pre-wrap;font-size:12px">${esc(JSON.stringify(g.debug,null,1))}</pre></details>`:'').join('')+'<br><a class="btn" target="_blank" rel="noopener" href="'+(kind==='img'?'https://www.bing.com/images/search?q=':'https://www.bing.com/videos/search?q=')+enc+'">Открыть в Bing</a></div>');
  Kubik.setSpeed(1);busy=false;
  if(items.length&&!(kind==='vid'&&pg>=0&&false)){const b=document.createElement('button');b.id='more';b.className='btn';b.textContent='Ещё';b.onclick=()=>{pg++;more()};$('#res').append(b)}}
 more()}
if(TAB==='all')loadPage();else if(Q)mediaTab(TAB);
