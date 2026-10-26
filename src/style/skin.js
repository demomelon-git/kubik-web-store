// «Кубик Стиль»: меняет картинку (помощник, фон главной) и интерфейс (тема, цвет, вид). Настройки лежат в localStorage и читаются сразу, без мерцания.
(()=>{const KEY='kubikStyle',DEF={mascot:'gears',emoji:'🧊',custom:'',theme:'auto',accent:'#4285f4',bg:'none',bgImg:'',ui:'classic'};
let S=Object.assign({},DEF);try{S=Object.assign(S,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S));return true}catch(e){alert('Не удалось сохранить: файл слишком большой');return false}};
const GR={g1:'linear-gradient(135deg,#667eea,#764ba2)',g2:'linear-gradient(135deg,#f6d365,#fda085)',g3:'linear-gradient(135deg,#0f2027,#2c5364)'};
const CUBE='<svg viewBox="0 0 96 96" width="100%" height="100%"><g stroke-width="4" stroke-linejoin="round"><polygon points="48,10 82,29 48,48 14,29" fill="#fbbc05" stroke="#fbbc05"/><polygon points="14,29 48,48 48,86 14,67" fill="#ea4335" stroke="#ea4335"/><polygon points="82,29 82,67 48,86 48,48" fill="#4285f4" stroke="#4285f4"/></g></svg>';
function skin(el){const m=S.mascot;
 if(m==='gears'){if(el._svg&&el.firstChild!==el._svg)el.replaceChildren(el._svg);return}
 if(m==='cube'){el.innerHTML=CUBE;return}
 if(m==='emoji'){el.innerHTML='<svg viewBox="0 0 100 100" width="100%" height="100%"><text x="50" y="52" font-size="78" text-anchor="middle" dominant-baseline="central"></text></svg>';el.querySelector('text').textContent=S.emoji||'🧊';return}
 if(m==='custom'&&S.custom){const i=document.createElement('img');i.src=S.custom;i.alt='';i.style.cssText='width:100%;height:100%;object-fit:contain;border-radius:18%';el.replaceChildren(i);return}
 if(el._svg)el.replaceChildren(el._svg)}
const K=window.Kubik,orig=K.make;K.make=function(el){const r=orig(el);el._svg=el.firstChild;skin(el);return r};
function apply(){const b=document.body;b.dataset.theme=S.theme;b.dataset.ui=S.ui;b.dataset.bg=S.bg;document.documentElement.style.setProperty('--blue',S.accent);
 const img=S.bg==='custom'&&S.bgImg?'url("'+S.bgImg+'")':GR[S.bg]||'';
 if(document.querySelector('.home')){b.style.backgroundImage=img;b.style.backgroundSize='cover';b.style.backgroundPosition='center';b.style.backgroundAttachment='fixed'}
 document.querySelectorAll('.mascot').forEach(el=>{if(el._svg)skin(el)})}
function readImg(file,max,type){return new Promise((ok,no)=>{const fr=new FileReader();fr.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,max/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext('2d').drawImage(im,0,0,c.width,c.height);ok(c.toDataURL(type,.85))};im.onerror=()=>no(new Error('не картинка'));im.src=fr.result};fr.readAsDataURL(file)})}
function panel(){const p=document.createElement('div');p.id='skp';p.hidden=true;
 p.innerHTML='<div class="box"><h3>Кубик Стиль</h3>'+
 '<label>Картинка помощника</label><select id="s-m"><option value="gears">Шестерёнки</option><option value="cube">Кубик 3D</option><option value="emoji">Эмодзи</option><option value="custom">Моя картинка</option></select>'+
 '<div id="s-e"><label>Эмодзи</label><input type="text" id="s-ei" maxlength="4"></div><div id="s-c"><label>Своя картинка помощника</label><input type="file" id="s-cf" accept="image/*"></div>'+
 '<label>Тема</label><select id="s-t"><option value="auto">Как в системе</option><option value="light">Светлая</option><option value="dark">Тёмная</option><option value="neon">Неон</option><option value="sunset">Закат</option></select>'+
 '<label>Цвет акцента</label><input type="color" id="s-a">'+
 '<label>Фон главной страницы</label><select id="s-b"><option value="none">Без фона</option><option value="g1">Фиолетовый</option><option value="g2">Персиковый</option><option value="g3">Ночной</option><option value="custom">Моя картинка</option></select><div id="s-bf"><label>Своя картинка фона</label><input type="file" id="s-bff" accept="image/*"></div>'+
 '<label>Интерфейс</label><select id="s-u"><option value="classic">Классический</option><option value="compact">Компактный</option><option value="cards">Карточки</option></select>'+
 '<div class="row"><button id="s-r">Сбросить</button><button id="s-x" class="pri">Готово</button></div></div>';
 document.body.append(p);const $=s=>p.querySelector(s);
 const sync=()=>{$('#s-m').value=S.mascot;$('#s-ei').value=S.emoji;$('#s-t').value=S.theme;$('#s-a').value=S.accent;$('#s-b').value=S.bg;$('#s-u').value=S.ui;$('#s-e').hidden=S.mascot!=='emoji';$('#s-c').hidden=S.mascot!=='custom';$('#s-bf').hidden=S.bg!=='custom'};
 const set=(k,v)=>{S[k]=v;save();apply();sync()};
 $('#s-m').onchange=e=>set('mascot',e.target.value);$('#s-ei').oninput=e=>set('emoji',e.target.value);$('#s-t').onchange=e=>set('theme',e.target.value);$('#s-a').oninput=e=>set('accent',e.target.value);$('#s-b').onchange=e=>set('bg',e.target.value);$('#s-u').onchange=e=>set('ui',e.target.value);
 $('#s-cf').onchange=async e=>{const f=e.target.files[0];if(f)try{set('custom',await readImg(f,256,'image/png'))}catch(err){alert(err.message)}};
 $('#s-bff').onchange=async e=>{const f=e.target.files[0];if(f)try{set('bgImg',await readImg(f,1600,'image/jpeg'))}catch(err){alert(err.message)}};
 $('#s-r').onclick=()=>{S=Object.assign({},DEF);save();apply();sync()};$('#s-x').onclick=()=>{p.hidden=true};p.onclick=e=>{if(e.target===p)p.hidden=true};
 sync();return p}
let P=null;const btn=document.createElement('button');btn.id='skbtn';btn.title='Оформление';btn.textContent='🎨';btn.onclick=()=>{if(!P)P=panel();P.hidden=false};document.body.append(btn);
apply()})();
