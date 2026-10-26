// Кубик расширения: оболочка, которая устанавливает и запускает внутренние расширения (.kubik)
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const REPO='demomelon-git/kubik-web-store',STORE='https://demomelon-git.github.io/kubik-web-store/';
const KIND=/Firefox\//.test(navigator.userAgent)?'firefox':'chrome';
const HOSTVER=browser.runtime.getManifest().version;
const CAPNAME={google:'поиск Google через скрытое окно',install:'устанавливать другие .kubik'};
const get=async k=>(await browser.storage.local.get(k))[k],set=(k,v)=>browser.storage.local.set({[k]:v});
const getList=async()=>(await get('kx:list'))||[];
const cmpv=(a,b)=>{const x=String(a).split('.').map(Number),y=String(b).split('.').map(Number);for(let i=0;i<Math.max(x.length,y.length);i++){const d=(x[i]||0)-(y[i]||0);if(d)return d}return 0};
const TEXT=/\.(html?|css|js|json|svg|txt|md)$/i,MIME={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',webp:'image/webp',svg:'image/svg+xml',ico:'image/x-icon'};
const toB64=u=>{let s='';for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return btoa(s)};
function toast(t){const e=$('#toast');e.textContent=t;e.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>e.hidden=true,4000)}

/* ---------- Установка пакетов .kubik ---------- */
async function readPackage(buf){const m=await kzipRead(buf);const raw=m.get('kubik.json');if(!raw)throw new Error('В архиве нет kubik.json');
 let man;try{man=JSON.parse(new TextDecoder().decode(raw))}catch(e){throw new Error('kubik.json повреждён')}
 if(!/^[a-z0-9]{3,24}$/.test(man.id||''))throw new Error('Неверный id (только a–z и 0–9, от 3 до 24 символов)');
 if(!/^\d+(\.\d+){0,3}$/.test(man.version||''))throw new Error('Неверная версия');
 if(!man.name)throw new Error('Не указано название');
 const hosts=(man.permissions&&man.permissions.hosts)||[];
 if(hosts.some(h=>h==='*'||!/^(\*\.)?[a-z0-9.-]+$/i.test(h)))throw new Error('Недопустимый хост в permissions.hosts');
 for(const k of m.keys())if(k.startsWith('/')||k.includes('..'))throw new Error('Небезопасный путь в архиве: '+k);
 return{man,m}}
function ask(man,old){return new Promise(res=>{const hosts=(man.permissions&&man.permissions.hosts)||[],caps=(man.permissions&&man.permissions.capabilities)||[],word=old?'Обновить':'Установить';
 const d=document.createElement('div');d.className='modal';
 d.innerHTML=`<div class="box"><h3>${word} «${esc(man.name)}» ${esc(man.version)}</h3><p class="mut">${esc(man.description||'')}</p><p>Автор: ${esc(man.author||'не указан')}</p>`+
  (hosts.length?`<p><b>Доступ к сайтам:</b></p><ul>${hosts.map(h=>`<li>${esc(h)}</li>`).join('')}</ul>`:'<p>Доступ к сайтам не нужен.</p>')+
  (caps.length?`<p><b>Возможности:</b> ${caps.map(c=>esc(CAPNAME[c]||c)).join(', ')}</p>`:'')+
  `<p class="mut">Внутреннее расширение работает в изолированном окне и может обмениваться сообщениями с другими внутренними расширениями. Ставь только то, чему доверяешь.</p><div class="row"><button id="no">Отмена</button><button id="ok" class="pri">${word}</button></div></div>`;
 document.body.append(d);
 d.querySelector('#no').onclick=()=>{d.remove();res(false)};
 d.querySelector('#ok').onclick=async()=>{try{if(hosts.length){const ok=await browser.permissions.request({origins:hosts.map(h=>'https://'+h+'/*')});if(!ok){d.remove();toast('Доступ к сайтам не разрешён');return res(false)}}d.remove();res(true)}catch(e){d.remove();toast('Разрешение: '+e.message);res(false)}}})}
async function installBuffer(buf){const {man,m}=await readPackage(buf);const list=await getList(),old=list.find(x=>x.id==man.id);
 if(man.requires&&man.requires.host&&cmpv(HOSTVER,man.requires.host)<0)throw new Error('Нужен Кубик расширения '+man.requires.host+' или новее (сейчас '+HOSTVER+')');
 if(!(await ask(man,!!old)))return null;
 const files={};for(const [n,data] of m){if(n==='kubik.json')continue;files[n]=TEXT.test(n)?{t:'text',d:new TextDecoder().decode(data)}:{t:'b64',d:toB64(data)}}
 await set('kx:files:'+man.id,files);
 const p=man.permissions||{},rec={id:man.id,name:man.name,version:man.version,author:man.author||'',description:man.description||'',enabled:old?old.enabled:true,hosts:p.hosts||[],caps:p.capabilities||[],entries:man.entries||{},service:man.service||null,provides:man.provides||[]};
 await set('kx:list',list.filter(x=>x.id!=man.id).concat(rec));
 if(!(await get('kx:home'))&&rec.entries.newtab)await set('kx:home',rec.id);
 if(!(await get('kx:search'))&&rec.entries.search)await set('kx:search',rec.id);
 return rec}
async function removeExt(id){await set('kx:list',(await getList()).filter(x=>x.id!=id));await browser.storage.local.remove(['kx:files:'+id,'kx:data:'+id]);
 for(const k of['kx:home','kx:search'])if((await get(k))===id)await browser.storage.local.remove(k)}
const fetchBuf=async url=>{const r=await fetch(url,{credentials:'omit',cache:'no-cache'});if(!r.ok)throw new Error('HTTP '+r.status);return r.arrayBuffer()};

/* ---------- Запуск внутренних расширений ---------- */
const insts=new Set(),pendingReq=new Map();let reqId=1;
const resolvePath=(base,rel)=>{const out=[];for(const p of base.split('/').slice(0,-1).concat(rel.split('/'))){if(p===''||p==='.')continue;if(p==='..')out.pop();else out.push(p)}return out.join('/')};
const fileText=(f,p)=>f[p]&&f[p].t==='text'?f[p].d:null;
function fileData(f,p){const x=f[p];if(!x)return null;const e=p.split('.').pop().toLowerCase();return x.t==='b64'?'data:'+(MIME[e]||'application/octet-stream')+';base64,'+x.d:'data:'+(MIME[e]||'text/plain')+';charset=utf-8,'+encodeURIComponent(x.d)}
function buildPage(f,path){const htm=fileText(f,path);if(htm==null)throw new Error('В пакете нет файла '+path);
 const doc=new DOMParser().parseFromString(htm,'text/html'),css=[],js=[];
 doc.querySelectorAll('link[rel~=stylesheet][href]').forEach(l=>{const c=fileText(f,resolvePath(path,l.getAttribute('href')));if(c!=null)css.push(c);l.remove()});
 doc.querySelectorAll('style').forEach(s=>{css.push(s.textContent);s.remove()});
 doc.querySelectorAll('script').forEach(s=>{const src=s.getAttribute('src'),c=src?fileText(f,resolvePath(path,src)):s.textContent;if(c)js.push(c);s.remove()});
 doc.querySelectorAll('img[src],source[src]').forEach(i=>{const s=i.getAttribute('src');if(!/^(https?:|data:)/.test(s)){const d=fileData(f,resolvePath(path,s));if(d)i.setAttribute('src',d)}});
 return{title:doc.title||'',body:doc.body.innerHTML,css:css.join('\n'),js:js.join(';\n')}}
const entryPath=(ext,e)=>{const m=ext.entries||{};return m[e]||(/\.html?$/.test(e||'')?e:null)||m.main||m.newtab};
async function startFrame(ext,o){const f=(await get('kx:files:'+ext.id))||{};let page;
 if(o.service)page={title:'',body:'',css:'',js:((ext.service&&ext.service.scripts)||[]).map(p=>fileText(f,p)).filter(x=>x!=null).join(';\n')};
 else{const p=entryPath(ext,o.entry);if(!p)throw new Error('У расширения нет страницы «'+o.entry+'»');page=buildPage(f,p)}
 const el=document.createElement('iframe');el.setAttribute('sandbox','allow-scripts allow-forms allow-popups');el.className=o.service?'svc':'view';el.src=browser.runtime.getURL('sandbox.html');
 const inst={ext,el,service:!!o.service};insts.add(inst);$('#stage').append(el);
 el.addEventListener('load',()=>el.contentWindow.postMessage({kx:1,run:Object.assign({id:ext.id,name:ext.name,params:o.params||{}},page)},'*'));return inst}
function clearViews(){for(const i of [...insts])if(!i.service){i.el.remove();insts.delete(i)}}
const hostOk=(ext,h)=>ext.hosts.some(p=>p.startsWith('*.')?(h===p.slice(2)||h.endsWith(p.slice(1))):h===p);
async function googleSearch(q,s){return new Promise(res=>{const id=Math.random().toString(36).slice(2,10),f=document.createElement('iframe');f.style.cssText='position:fixed;left:-9999px;top:0;width:1000px;height:800px;border:0';
 const end=d=>{clearTimeout(t);browser.runtime.onMessage.removeListener(h);f.remove();res(d)};
 const h=m=>{if(m&&m.type==='results'&&m.id===id)end(m.blocked?{results:[],error:m.blocked==='captcha'?'капча Google':'окно согласия Google'}:m)};
 const t=setTimeout(()=>end({results:[],error:'таймаут'}),15000);browser.runtime.onMessage.addListener(h);
 f.src='https://www.google.com/search?hl=ru&q='+encodeURIComponent(q)+(s?'&start='+s:'')+'#kubik-'+id;document.body.append(f)})}
async function handleOp(inst,m){const ext=inst.ext,a=m.args||{};
 switch(m.op){
 case 'fetch':{const u=new URL(a.url);if(u.protocol!=='https:')throw new Error('Разрешён только https');if(!hostOk(ext,u.hostname))throw new Error('Нет разрешения на '+u.hostname);
  const o=a.opts||{},r=await fetch(a.url,{method:o.method||'GET',headers:o.headers,body:o.body,credentials:'omit'});return{ok:r.ok,status:r.status,url:r.url,text:(await r.text()).slice(0,6e6)}}
 case 'google':if(!ext.caps.includes('google'))throw new Error('Нет возможности «google»');return googleSearch(String(a.q),a.s|0);
 case 'send':{const list=await getList(),t=list.find(x=>x.id==a.to&&x.enabled);if(!t)throw new Error('Расширение «'+a.to+'» не установлено или выключено');
  const tg=[...insts].filter(i=>i.ext.id==a.to).sort((x,y)=>(y.service?1:0)-(x.service?1:0))[0];if(!tg)throw new Error('Расширение «'+t.name+'» не запущено');
  return new Promise((ok,no)=>{const id=reqId++,timer=setTimeout(()=>{pendingReq.delete(id);no(new Error('нет ответа от «'+t.name+'»'))},15000);pendingReq.set(id,{ok,no,timer});tg.el.contentWindow.postMessage({kx:1,req:id,from:ext.id,data:a.data},'*')})}
 case 'sget':return ((await get('kx:data:'+ext.id))||{})[a.k]??null;
 case 'sset':{const d=(await get('kx:data:'+ext.id))||{};d[a.k]=a.v;await set('kx:data:'+ext.id,d);return true}
 case 'list':return (await getList()).map(x=>({id:x.id,name:x.name,version:x.version,enabled:x.enabled,provides:x.provides}));
 case 'open':{const q=new URLSearchParams(a.params||{}).toString();location.hash='#/run/'+a.ext+'/'+encodeURIComponent(a.page||'main')+(q?'?'+q:'');return true}
 case 'openUrl':{if(!/^https?:\/\//i.test(a.url))throw new Error('Только http(s)');if(a.newTab)window.open(a.url,'_blank','noopener');else location.href=a.url;return true}
 case 'title':document.title=String(a.t).slice(0,200);return true;
 case 'install':{if(!ext.caps.includes('install'))throw new Error('Нет возможности «install»');const u=new URL(a.url);if(!hostOk(ext,u.hostname))throw new Error('Нет разрешения на '+u.hostname);
  const r=await installBuffer(await fetchBuf(a.url));if(r){await startServices();renderMgrIfOpen()}return r?{id:r.id,version:r.version}:null}
 default:throw new Error('Неизвестная операция '+m.op)}}
addEventListener('message',async e=>{const m=e.data;if(!m||m.kx!==1)return;const inst=[...insts].find(i=>i.el.contentWindow===e.source);if(!inst)return;
 if(m.res){const p=pendingReq.get(m.res);if(p){pendingReq.delete(m.res);clearTimeout(p.timer);m.ok?p.ok(m.result):p.no(new Error(m.error||'ошибка'))}return}
 if(m.op){let r;try{r={kx:1,reply:m.id,ok:true,result:await handleOp(inst,m)}}catch(err){r={kx:1,reply:m.id,ok:false,error:String(err&&err.message||err)}}inst.el.contentWindow.postMessage(r,'*')}});
async function startServices(){const list=await getList();for(const ext of list)if(ext.enabled&&ext.service&&![...insts].some(i=>i.service&&i.ext.id==ext.id&&i.ext.version==ext.version))await startFrame(ext,{service:true}).catch(e=>console.error(ext.id,e))}

/* ---------- Менеджер ---------- */
let mgrOpen=false;const renderMgrIfOpen=()=>{if(mgrOpen)renderMgr()};
async function renderMgr(msg){mgrOpen=true;const m=$('#mgr'),list=await getList(),home=await get('kx:home'),srch=await get('kx:search');
 const opt=(sel,key)=>list.filter(x=>x.entries[key]).map(x=>`<option value="${x.id}"${x.id==sel?' selected':''}>${esc(x.name)}</option>`).join('')||'<option value="">нет подходящих</option>';
 m.hidden=false;
 m.innerHTML=`<div class="w"><div class="row" style="justify-content:space-between"><h1>Кубик расширения</h1><button id="cl">Закрыть</button></div>
 <div class="mut">Версия ${esc(HOSTVER)} · ${KIND=='firefox'?'Firefox':'Chrome'} · ID <code>${esc(browser.runtime.id)}</code></div>${msg?`<div class="note">${esc(msg)}</div>`:''}<div id="upd"></div>
 <h2>Установленные</h2>${list.length?list.map(x=>`<div class="card"><h3>${esc(x.name)} <span class="mut">${esc(x.version)} · ${esc(x.id)}</span></h3><div class="mut">${esc(x.description)}${x.hosts.length?'<br>Сайты: '+esc(x.hosts.join(', ')):''}${x.caps.length?'<br>Возможности: '+esc(x.caps.join(', ')):''}</div>
  <div class="row">${x.entries.main||x.entries.newtab?`<button data-run="${x.id}">Открыть</button>`:''}<button data-tg="${x.id}">${x.enabled?'Выключить':'Включить'}</button><button class="dng" data-rm="${x.id}">Удалить</button></div></div>`).join(''):'<div class="card mut">Пока ничего не установлено. Выбери файл .kubik ниже или открой каталог.</div>'}
 <h2>Установить</h2><div class="card"><input type="file" id="file" accept=".kubik,.zip"><div class="row"><input type="text" id="url" placeholder="Ссылка на файл .kubik (https://…)"><button id="gourl">Установить по ссылке</button></div></div>
 <h2>Каталог Kubik Web Store</h2><div class="card"><button id="cat">Показать доступные .kubik</button><div id="catl"></div></div>
 <h2>Настройки</h2><div class="card"><div class="mut">Главная страница (новая вкладка)</div><select id="sh">${opt(home,'newtab')}</select><div class="mut" style="margin-top:10px">Главный поиск</div><select id="ss">${opt(srch,'search')}</select></div>
 <h2>Адрес поиска по ID</h2><div class="card"><div class="mut">Главный поиск запускается по ID этого расширения. Вставь любой адрес как поисковую систему браузера:</div>
  <p><code>${esc(browser.runtime.getURL('app.html'))}?q=%s</code></p><p><code>https://127.0.0.1/?q=%s</code> <span class="mut">(короткий адрес, работает и на Android)</span></p></div></div>`;
 m.querySelector('#cl').onclick=()=>{mgrOpen=false;m.hidden=true;if(!$('#stage').querySelector('.view'))route()};
 m.querySelectorAll('[data-run]').forEach(b=>b.onclick=()=>{mgrOpen=false;m.hidden=true;location.hash='#/run/'+b.dataset.run+'/main'});
 m.querySelectorAll('[data-tg]').forEach(b=>b.onclick=async()=>{const l=await getList();const x=l.find(y=>y.id==b.dataset.tg);x.enabled=!x.enabled;await set('kx:list',l);if(x.enabled)await startServices();else for(const i of [...insts])if(i.ext.id==x.id){i.el.remove();insts.delete(i)}renderMgr()});
 m.querySelectorAll('[data-rm]').forEach(b=>b.onclick=async()=>{if(confirm('Удалить «'+b.dataset.rm+'» вместе с её данными?')){for(const i of [...insts])if(i.ext.id==b.dataset.rm){i.el.remove();insts.delete(i)}await removeExt(b.dataset.rm);renderMgr()}});
 m.querySelector('#file').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const r=await installBuffer(await f.arrayBuffer());if(r){toast('Установлено: '+r.name+' '+r.version);await startServices()}}catch(err){toast(err.message)}renderMgr()};
 m.querySelector('#gourl').onclick=async()=>{const u=m.querySelector('#url').value.trim();if(!/^https:\/\//.test(u))return toast('Нужна ссылка https://…');
  try{try{await browser.permissions.request({origins:[new URL(u).origin+'/*']})}catch(e){}const r=await installBuffer(await fetchBuf(u));if(r){toast('Установлено: '+r.name+' '+r.version);await startServices()}}catch(err){toast(err.message)}renderMgr()};
 m.querySelector('#sh').onchange=e=>set('kx:home',e.target.value);m.querySelector('#ss').onchange=e=>set('kx:search',e.target.value);
 m.querySelector('#cat').onclick=loadCatalog;checkHostUpdate()}
async function loadCatalog(){const box=$('#catl');box.innerHTML='<p class="mut">Загрузка…</p>';
 try{const r=await fetch('https://api.github.com/repos/'+REPO+'/contents/addons/kubik',{headers:{Accept:'application/vnd.github+json'}});if(!r.ok)throw new Error('GitHub API '+r.status);
  const inst=await getList(),items=(await r.json()).map(f=>/^([a-z0-9]+)-(\d+(?:[._]\d+)*)\.kubik$/.exec(f.name)).filter(Boolean).map(x=>({id:x[1],ver:x[2].replace(/_/g,'.'),file:x[0]}));
  box.innerHTML=items.length?items.map(it=>{const cur=inst.find(x=>x.id==it.id),st=!cur?'':cmpv(it.ver,cur.version)>0?`обновление (сейчас ${esc(cur.version)})`:'установлено';
   return`<div class="row"><b>${esc(it.id)}</b> <span class="mut">${esc(it.ver)} ${st}</span> <button data-f="${esc(it.file)}">${cur?(cmpv(it.ver,cur.version)>0?'Обновить':'Переустановить'):'Установить'}</button></div>`}).join(''):'<p class="mut">В каталоге пока пусто.</p>';
  box.querySelectorAll('[data-f]').forEach(b=>b.onclick=async()=>{try{const r=await installBuffer(await fetchBuf(STORE+'addons/kubik/'+b.dataset.f));if(r){toast('Установлено: '+r.name+' '+r.version);await startServices()}}catch(err){toast(err.message)}renderMgr()})}
 catch(err){box.innerHTML='<p class="mut">Не удалось загрузить каталог: '+esc(err.message)+'</p>'}}
async function checkHostUpdate(){try{const dir=KIND=='firefox'?'adofire':'adocho',ext=KIND=='firefox'?'xpi':'crx',r=await fetch('https://api.github.com/repos/'+REPO+'/contents/addons/'+dir,{headers:{Accept:'application/vnd.github+json'}});if(!r.ok)return;
  const vs=(await r.json()).map(f=>new RegExp('^kubikhost-(\\d+(?:[._]\\d+)*)\\.'+ext+'$').exec(f.name)).filter(Boolean).map(x=>x[1].replace(/_/g,'.')).sort(cmpv);const top=vs[vs.length-1];
  if(top&&cmpv(top,HOSTVER)>0&&$('#upd'))$('#upd').innerHTML=`<div class="note">Доступна новая версия Кубик расширения: ${esc(top)}. <a href="${STORE}store/?b=${KIND}" target="_blank" rel="noopener">Скачать в Kubik Web Store</a></div>`}catch(e){}}

/* ---------- Маршрутизация ---------- */
async function route(){clearViews();const list=await getList(),url=new URL(location.href),q=url.searchParams.get('q');
 if(q&&!location.hash){const sid=await get('kx:search');history.replaceState(null,'',location.pathname+'#/run/'+(sid||'none')+'/search?q='+encodeURIComponent(q))}
 const h=location.hash.replace(/^#/,'');
 if(h.startsWith('/manager'))return renderMgr();
 const mm=/^\/run\/([a-z0-9]*)\/([^?]*)(?:\?(.*))?$/.exec(h);
 if(mm){const ext=list.find(x=>x.id==mm[1]&&x.enabled);if(!ext)return renderMgr('Не найдено или выключено: '+mm[1]+'. Установи «Кубик Веб-поиск» и выбери главный поиск в настройках.');
  try{await startFrame(ext,{entry:decodeURIComponent(mm[2]),params:Object.fromEntries(new URLSearchParams(mm[3]||'')),visible:true});$('#mgr').hidden=true;mgrOpen=false}catch(e){renderMgr(e.message)}return}
 const hid=await get('kx:home'),ext=list.find(x=>x.id==hid&&x.enabled&&x.entries.newtab);
 if(ext){try{await startFrame(ext,{entry:'newtab'});$('#mgr').hidden=true;mgrOpen=false}catch(e){renderMgr(e.message)}return}
 renderMgr(list.length?'':'Установленных расширений пока нет. Установи «Кубик Веб-поиск» (.kubik) — он даст главную страницу и поиск.')}
$('#fab').onclick=()=>{mgrOpen?(mgrOpen=false,$('#mgr').hidden=true):renderMgr()};
addEventListener('hashchange',route);
startServices().then(route);
