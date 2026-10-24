Kubik.make(document.getElementById('m'));
const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const BASE=document.body.dataset.base||'',MODE=document.body.dataset.mode||'store';
const NAMES={firefox:'Firefox',chrome:'Chrome / Chromium'},DIR={firefox:'addons/adofire/',chrome:'addons/adocho/'},EXT={firefox:'.xpi',chrome:'.crx'};
const ua=navigator.userAgent,brands=(navigator.userAgentData&&navigator.userAgentData.brands||[]).map(b=>b.brand).join(' ');
const detected=/Firefox\/|FxiOS/.test(ua)?'firefox':(/Chrome\/|Chromium\/|CriOS/.test(ua)||/Chromium|Google Chrome/.test(brands))?'chrome':'other';
let cur=new URLSearchParams(location.search).get('b')||(detected=='other'?'firefox':detected),CAT={addons:[]},IDX=[];
const cmp=(a,b)=>{const x=a.split('.').map(Number),y=b.split('.').map(Number);for(let i=0;i<Math.max(x.length,y.length);i++){const d=(y[i]||0)-(x[i]||0);if(d)return d}return 0};
const kb=n=>n>1048576?(n/1048576).toFixed(1)+' МБ':Math.max(1,Math.round(n/1024))+' КБ';
const link=a=>BASE+'addons/'+a.path;
function card(ad){
 const items=IDX.filter(a=>a.code==ad.code&&a.browser==cur).sort((a,b)=>cmp(a.version,b.version)),top=items[0],pend=ad.pending&&ad.pending[cur],isNew=top&&PREV&&cmp(PREV[ad.code+'|'+cur]||'0',top.version)>0;
 let h=`<div class="card${ad.main?' main':''}"><div class="row"><img class="ico" src="${BASE}icon.svg" alt=""><div><h2>${esc(ad.name)}</h2><div class="meta">код <b>${esc(ad.code)}</b> · для ${NAMES[cur]}</div></div></div><p class="short">${esc(ad.short||'')}</p>`;
 h+=top?`<div class="meta">Версия ${esc(top.version)}${isNew?' <span class="new">новая</span>':''} · ${kb(top.size)} · ${esc(top.file)}</div><a class="btn" href="${esc(link(top))}" download>Скачать ${EXT[cur]}</a>`:`<span class="btn off">Файл пока не добавлен</span>`;
 if(pend&&(!top||cmp(top.version,pend)>0))h+=`<p class="note">Версия ${esc(pend)} для ${NAMES[cur]} готовится${cur=='firefox'?' и ждёт подписи Mozilla':''}.</p>`;
 if(cur=='chrome'&&top)h+=`<p class="note">Файл .crx ставится не везде: обычный Chrome на компьютере принимает дополнения только из магазина, а браузеры на Chromium (например, Titanium) могут установить файл напрямую.</p>`;
 if(top&&top.sha256)h+=`<div class="hash">SHA-256: ${esc(top.sha256)}</div>`;
 if(items.length>1)h+=`<details><summary>Старые версии (${items.length-1})</summary>${items.slice(1).map(a=>`<div><a href="${esc(link(a))}" download>${esc(a.file)}</a> · ${kb(a.size)}</div>`).join('')}</details>`;
 return h+'</div>'}
function render(){
 $('#det').textContent=detected=='firefox'?'Твой браузер: Firefox':detected=='chrome'?'Твой браузер: Chrome / Chromium':'Браузер не распознан: выбери вручную';
 $('#tabs').innerHTML=['firefox','chrome'].map(b=>`<button class="tab${b==cur?' on':''}" data-b="${b}">${NAMES[b]}${b==detected?' ✓':''}</button>`).join('');
 document.querySelectorAll('.tab').forEach(t=>t.onclick=()=>{cur=t.dataset.b;render()});
 const main=CAT.addons.filter(a=>a.main),rest=CAT.addons.filter(a=>!a.main);
 let h=main.map(card).join('');
 if(MODE=='store'){
  h+='<h3>Другие расширения</h3>'+(rest.length?rest.map(card).join(''):'<div class="card"><p class="short">Пока здесь только Кубик Веб-поиск.</p></div>');
  const body=encodeURIComponent('Название расширения:\nКороткий код (например, dark rander → dr):\nБраузер (Firefox / Chrome):\nВерсия:\nСсылка на файл или репозиторий:\nКоротко, что делает:\n');
  h+=`<div class="card"><h2>Добавить своё расширение</h2><p class="short">Отправь письмо с названием, коротким кодом, версией и ссылкой на файл. Для Firefox нужен файл .xpi с подписью Mozilla, для Chrome — .crx.</p><a class="btn" href="mailto:${esc(CAT.email||'demoda228@gmail.com')}?subject=${encodeURIComponent('Добавить расширение в Кубик Web Store')}&body=${body}">Написать на ${esc(CAT.email||'demoda228@gmail.com')}</a></div>`}
 $('#list').innerHTML=h}
const PARSE=/^([a-z0-9]+)-(\d+(?:[._]\d+)*)\.(xpi|crx)$/;
const repoName=()=>{const h=location.hostname;if(h.endsWith('.github.io')){const r=location.pathname.split('/')[1];if(r)return h.split('.')[0]+'/'+r}return 'demomelon-git/kubik-web-store'};
// Список файлов берём прямо из репозитория (GitHub API), поэтому новая версия видна сразу после загрузки файла
async function liveList(){const repo=repoName(),res=[];
 for(const [folder,browser,ext] of [['adofire','firefox','.xpi'],['adocho','chrome','.crx']]){
  const r=await fetch(`https://api.github.com/repos/${repo}/contents/addons/${folder}`,{headers:{Accept:'application/vnd.github+json'},cache:'no-cache'});
  if(!r.ok)throw new Error('api '+r.status);
  (await r.json()).forEach(f=>{const m=PARSE.exec(f.name||'');if(!m||!f.name.endsWith(ext))return;res.push({code:m[1],browser,version:m[2].replace(/_/g,'.'),file:f.name,path:folder+'/'+f.name,size:f.size,sha256:null})})}
 return res}
const latestMap=l=>{const o={};l.forEach(a=>{const k=a.code+'|'+a.browser;if(!o[k]||cmp(o[k],a.version)>0)o[k]=a.version});return o};
const PREV=(()=>{try{return JSON.parse(localStorage.getItem('kubikSeen')||'null')}catch(e){return null}})();
let KNOWN=null;
async function load(first){
 const get=async u=>(await fetch(BASE+u,{cache:'no-cache'})).json();
 try{CAT=await get('addons/catalog.json')}catch(e){}
 let fileIdx=[];try{fileIdx=(await get('addons/index.json')).addons||[]}catch(e){}
 let live=null,mode='live';try{live=await liveList()}catch(e){mode='index'}
 if(!live||!live.length){live=fileIdx;mode=mode=='live'?'index':mode}
 IDX=live.map(a=>{const f=fileIdx.find(x=>x.file==a.file);return Object.assign({},a,f?{sha256:f.sha256,size:a.size||f.size}:{})});
 IDX.forEach(a=>{if(!(CAT.addons||[]).some(c=>c.code==a.code))(CAT.addons=CAT.addons||[]).push({code:a.code,name:a.code,short:'Без описания в catalog.json'})});
 const now=latestMap(IDX);
 if(!CAT.addons.length&&!IDX.length)throw new Error('empty');
 if(KNOWN){const ch=Object.keys(now).filter(k=>cmp(KNOWN[k]||'0',now[k])>0);
  if(ch.length){$('#upd').hidden=false;$('#upd').textContent='Найдена новая версия: '+ch.map(k=>{const [c,b]=k.split('|');return c+' '+now[k]+' ('+NAMES[b]+')'}).join(', ')+'. Список обновлён.'}}
 KNOWN=now;render();
 const t=new Date().toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'});
 $('#stat').innerHTML=`Список из репозитория (${mode=='live'?'GitHub, в реальном времени':'index.json'}) · проверено в ${t} · <a href="#" id="rf">обновить</a>`;
 $('#rf').onclick=e=>{e.preventDefault();load(false)};
 try{localStorage.setItem('kubikSeen',JSON.stringify(now))}catch(e){}}
load(true).catch(()=>{$('#list').innerHTML='<div class="card">Не удалось загрузить список дополнений (<code>addons/catalog.json</code>, <code>addons/index.json</code>).</div>'});
setInterval(()=>load(false).catch(()=>{}),300000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)load(false).catch(()=>{})});
