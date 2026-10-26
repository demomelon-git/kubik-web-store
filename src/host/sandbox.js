// Изолированное окно внутреннего расширения. Здесь нет доступа к API браузера, только к KX (мост к «Кубик расширения»)
(()=>{let rid=1,handler=null,ctx={};const pend=new Map();
const post=m=>parent.postMessage(Object.assign({kx:1},m),'*');
const call=(op,args)=>new Promise((ok,no)=>{const id=rid++;pend.set(id,{ok,no});post({op,id,args})});
window.KX={
 get id(){return ctx.id},get params(){return ctx.params||{}},
 fetch:async(url,opts)=>{const r=await call('fetch',{url,opts});return{ok:r.ok,status:r.status,url:r.url,text:async()=>r.text,json:async()=>JSON.parse(r.text)}},
 google:(q,s)=>call('google',{q,s}),
 send:(to,data)=>call('send',{to,data}),
 onMessage:fn=>{handler=fn},
 storage:{get:k=>call('sget',{k}),set:(k,v)=>call('sset',{k,v})},
 list:()=>call('list'),
 open:(ext,page,params)=>call('open',{ext,page,params}),
 openUrl:(url,o)=>call('openUrl',Object.assign({url},o||{})),
 install:url=>call('install',{url}),
 setTitle:t=>call('title',{t})};
addEventListener('message',async e=>{const m=e.data;if(!m||m.kx!==1||e.source!==parent)return;
 if(m.run){run(m.run);return}
 if(m.reply){const p=pend.get(m.reply);if(p){pend.delete(m.reply);m.ok?p.ok(m.result):p.no(new Error(m.error))}return}
 if(m.req){try{if(!handler)throw new Error('расширение не принимает сообщения');const r=await handler(m.data,{from:m.from});post({res:m.req,ok:true,result:r===undefined?null:r})}
  catch(err){post({res:m.req,ok:false,error:String(err&&err.message||err)})}}});
function run(r){ctx=r;document.title=r.title||r.name||'';
 const st=document.createElement('style');st.textContent=r.css||'';document.head.append(st);document.body.innerHTML=r.body||'';
 document.addEventListener('click',ev=>{const a=ev.target.closest&&ev.target.closest('a[href]');if(!a)return;const h=a.getAttribute('href');
  if(/^https?:\/\//i.test(h)){ev.preventDefault();window.KX.openUrl(a.href,{newTab:a.target==='_blank'||ev.ctrlKey||ev.metaKey})}else if(h==='#'||h==='')ev.preventDefault()});
 try{(0,eval)(r.js||'')}catch(err){const d=document.createElement('pre');d.style.cssText='color:#c62828;white-space:pre-wrap;padding:12px;font:13px monospace';d.textContent='Ошибка внутреннего расширения «'+(r.name||r.id)+'»:\n'+(err&&err.stack||err);document.body.append(d)}}
})();
