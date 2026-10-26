Kubik.make(document.getElementById('m'));
const repoName=()=>{const h=location.hostname;if(h.endsWith('.github.io')){const r=location.pathname.split('/')[1];if(r)return h.split('.')[0]+'/'+r}return 'demomelon-git/kubik-web-store'};
const cmp=(a,b)=>{const x=a.split('.').map(Number),y=b.split('.').map(Number);for(let i=0;i<Math.max(x.length,y.length);i++){const d=(y[i]||0)-(x[i]||0);if(d)return d}return 0};
const PARSE=/^([a-z0-9]+)-(\d+(?:[._]\d+)*)\.(xpi|crx|kubik|zip)$/;
async function files(folder){try{const r=await fetch('https://api.github.com/repos/'+repoName()+'/contents/addons/'+folder,{headers:{Accept:'application/vnd.github+json'}});if(r.ok)return(await r.json()).map(f=>f.name)}catch(e){}
 try{const j=await (await fetch('addons/index.json')).json();return j.addons.filter(a=>a.path.startsWith(folder+'/')).map(a=>a.file)}catch(e){return[]}}
const top=(names,code)=>names.map(n=>PARSE.exec(n)).filter(m=>m&&m[1]==code).map(m=>m[2].replace(/_/g,'.')).sort(cmp)[0];
(async()=>{
 const [ff,ch,kb,ya]=await Promise.all([files('adofire'),files('adocho'),files('kubik'),files('adoyan')]);
 const set=(id,t)=>document.getElementById(id).textContent=t;
 const f=top(ff,'kubik'),c=top(ch,'kubik'),h=top(ch,'kubikhost')||top(ff,'kubikhost');
 const fs=top(ff,'kubikstyle'),cs=top(ch,'kubikstyle'),show=(a,b)=>a||b?'Обычная: '+(a||'скоро')+' · Стиль: '+(b||'скоро'):'Файл пока не добавлен';
 set('v-firefox',show(f,fs));set('v-chrome',show(c,cs));set('v-yandex',show(top(ya,'kubik'),top(ya,'kubikstyle')));
 set('v-kubik','Предварительная версия'+(h?' '+h:'')+' · внутренних расширений: '+kb.length);
})();

const bq=new URLSearchParams(location.search).get('b'),bc=bq&&document.getElementById('card-'+bq);if(bc){bc.classList.add('hl');setTimeout(()=>bc.scrollIntoView({block:'center',behavior:'smooth'}),400)}
