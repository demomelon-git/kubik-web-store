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
 const items=IDX.filter(a=>a.code==ad.code&&a.browser==cur).sort((a,b)=>cmp(a.version,b.version)),top=items[0],pend=ad.pending&&ad.pending[cur];
 let h=`<div class="card${ad.main?' main':''}"><div class="row"><img class="ico" src="${BASE}icon.svg" alt=""><div><h2>${esc(ad.name)}</h2><div class="meta">код <b>${esc(ad.code)}</b> · для ${NAMES[cur]}</div></div></div><p class="short">${esc(ad.short||'')}</p>`;
 h+=top?`<div class="meta">Версия ${esc(top.version)} · ${kb(top.size)} · ${esc(top.file)}</div><a class="btn" href="${esc(link(top))}" download>Скачать ${EXT[cur]}</a>`:`<span class="btn off">Файл пока не добавлен</span>`;
 if(pend&&(!top||cmp(top.version,pend)>0))h+=`<p class="note">Версия ${esc(pend)} для ${NAMES[cur]} готовится${cur=='firefox'?' и ждёт подписи Mozilla':''}.</p>`;
 if(cur=='chrome'&&top)h+=`<p class="note">Файл .crx ставится не везде: обычный Chrome на компьютере принимает дополнения только из магазина, а браузеры на Chromium (например, Titanium) могут установить файл напрямую.</p>`;
 if(top)h+=`<div class="hash">SHA-256: ${esc(top.sha256)}</div>`;
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
Promise.all([fetch(BASE+'addons/catalog.json',{cache:'no-cache'}).then(r=>r.json()),fetch(BASE+'addons/index.json',{cache:'no-cache'}).then(r=>r.json())])
 .then(([c,i])=>{CAT=c;IDX=i.addons||[];render()})
 .catch(()=>{$('#list').innerHTML='<div class="card">Не удалось загрузить список дополнений (<code>addons/catalog.json</code> и <code>addons/index.json</code>).</div>'});
