const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const DEF='demomelon-git/kubik-web-store',out=h=>{$('#out').innerHTML=h};
const api=async p=>{const r=await KX.fetch('https://api.github.com'+p);if(!r.ok)throw new Error('GitHub API '+r.status);return r.json()};
async function show(repo){repo=repo.trim().replace(/^https?:\/\/github\.com\//,'').replace(/\/+$/,'');
 if(!/^[\w.-]+\/[\w.-]+$/.test(repo))return out('<div class="card">Введи адрес в виде <code>владелец/репозиторий</code>.</div>');
 out('<p class="mut">Загрузка…</p>');KX.storage.set('repo',repo);KX.setTitle(repo+' — Кубик для GitHub');
 try{const info=await api('/repos/'+repo);let rel=null,files=[];
  try{rel=await api('/repos/'+repo+'/releases/latest')}catch(e){}
  try{(await api('/repos/'+repo+'/contents/addons/kubik')).filter(f=>/\.kubik$/.test(f.name)).forEach(f=>files.push({name:f.name,url:f.download_url,size:f.size}))}catch(e){}
  if(rel)(rel.assets||[]).filter(a=>/\.kubik$/.test(a.name)).forEach(a=>files.push({name:a.name,url:a.browser_download_url,size:a.size,tag:rel.tag_name}));
  out(`<div class="card"><h2><a href="${esc(info.html_url)}">${esc(info.full_name)}</a></h2><div class="mut">${esc(info.description||'Без описания')}</div>
   <div class="mut">★ ${info.stargazers_count} · форков ${info.forks_count} · обновлён ${esc((info.pushed_at||'').slice(0,10))}${rel?' · релиз '+esc(rel.tag_name):''}</div>
   <div class="row"><span>Найти этот проект в «Кубик Веб-поиск»</span><button id="srch">Найти</button></div><div id="sr"></div></div>
   <div class="card"><h2>Пакеты .kubik</h2>${files.length?files.map((f,i)=>`<div class="row"><span>${esc(f.name)}${f.tag?' <span class="mut">'+esc(f.tag)+'</span>':''} <span class="mut">${Math.max(1,Math.round(f.size/1024))} КБ</span></span><button class="pri" data-i="${i}">Установить</button></div>`).join(''):'<div class="mut">В этом репозитории нет файлов .kubik (папка <code>addons/kubik</code> или файлы релиза).</div>'}<div id="msg" class="mut"></div></div>`);
  document.querySelectorAll('[data-i]').forEach(b=>b.onclick=async()=>{const f=files[b.dataset.i];$('#msg').textContent='Установка '+f.name+'…';
   try{const r=await KX.install(f.url);$('#msg').textContent=r?'Установлено: '+r.id+' '+r.version:'Установка отменена'}catch(e){$('#msg').textContent='Ошибка: '+e.message}});
  $('#srch').onclick=async()=>{$('#sr').innerHTML='<div class="mut">Спрашиваю у «Кубик Веб-поиск»…</div>';
   try{const r=await KX.send('kubikweb',{type:'search',q:repo.split('/')[1],limit:6});$('#sr').innerHTML=r.map(x=>`<div class="res"><a href="${esc(x.url)}">${esc(x.title)}</a><span class="mut">${esc(x.snippet||'')}</span></div>`).join('')||'<div class="mut">Ничего не найдено</div>'}
   catch(e){$('#sr').innerHTML='<div class="mut">Не получилось: '+esc(e.message)+'. Установи и включи «Кубик Веб-поиск».</div>'}}}
 catch(e){out('<div class="card">Не удалось загрузить: '+esc(e.message)+'</div>')}}
$('#load').onclick=()=>show($('#repo').value);$('#repo').addEventListener('keydown',e=>{if(e.key==='Enter')show($('#repo').value)});
KX.storage.get('repo').then(r=>{$('#repo').value=r||DEF;show($('#repo').value)});
