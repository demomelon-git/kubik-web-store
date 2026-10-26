// Служба: отвечает другим внутренним расширениям на сообщение {type:'search', q}
KX.onMessage(async m=>{
 if(!m||m.type!=='search')throw new Error('неизвестный тип сообщения');
 const q=String(m.q||'').trim();if(!q)throw new Error('пустой запрос');
 const engines=[bing,brave,ddg,startpage].concat(m.google?[google]:[]);
 const got=await Promise.all(engines.map(f=>f(q,0).catch(e=>({results:[],error:String(e&&e.message||e)}))));
 const map=new Map();
 got.forEach(d=>(d.results||[]).forEach((r,i)=>{let k=r.url;try{const x=new URL(r.url);k=x.hostname.replace(/^www\./,'')+x.pathname.replace(/\/$/,'')}catch(e){}
  const o=map.get(k)||Object.assign({score:0},r);o.score+=1/(60+i);map.set(k,o)}));
 return[...map.values()].sort((a,b)=>b.score-a.score).slice(0,Math.min(m.limit||10,20)).map(({url,title,snippet})=>({url,title,snippet}))});
