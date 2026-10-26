// Проверка новой версии в Kubik Web Store (не чаще раза в 6 часов)
(async()=>{try{
 const FF=/Firefox\//.test(navigator.userAgent),V=browser.runtime.getManifest().version,KEY='kubikUpd';
 const st=(await browser.storage.local.get(KEY))[KEY]||{};
 const cmp=(a,b)=>{const x=a.split('.').map(Number),y=b.split('.').map(Number);for(let i=0;i<Math.max(x.length,y.length);i++){const d=(x[i]||0)-(y[i]||0);if(d)return d}return 0};
 let top=st.top;
 if(!st.t||Date.now()-st.t>216e5){
  const r=await fetch('https://api.github.com/repos/demomelon-git/kubik-web-store/contents/addons/'+(FF?'adofire':'adocho'),{headers:{Accept:'application/vnd.github+json'}});
  if(r.ok){const re=new RegExp('^__CODE__-(\\d+(?:[._]\\d+)*)\\.'+(FF?'xpi':'crx')+'$');
   top=(await r.json()).map(f=>re.exec(f.name)).filter(Boolean).map(m=>m[1].replace(/_/g,'.')).sort(cmp).pop();
   await browser.storage.local.set({[KEY]:Object.assign({},st,{t:Date.now(),top})})}}
 if(top&&cmp(top,V)>0&&st.hide!==top){
  const b=document.createElement('div');b.className='updbar';
  b.innerHTML='Доступна новая версия Кубика: <b></b> (у тебя '+V+'). <a target="_blank" rel="noopener">Скачать в Kubik Web Store</a> <button title="Скрыть">✕</button>';
  b.querySelector('b').textContent=top;b.querySelector('a').href='https://demomelon-git.github.io/kubik-web-store/store/?b='+(FF?'firefox':'chrome');
  b.querySelector('button').onclick=async()=>{b.remove();await browser.storage.local.set({[KEY]:Object.assign({},st,{t:Date.now(),top,hide:top})})};
  document.body.prepend(b)}
}catch(e){}})();
