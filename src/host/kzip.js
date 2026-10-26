// Минимальное чтение ZIP (формат .kubik): методы 0 (без сжатия) и 8 (deflate)
async function kzipRead(buf){
 const u=new Uint8Array(buf),dv=new DataView(buf);
 let e=u.length-22;while(e>=0&&dv.getUint32(e,true)!==0x06054b50)e--;
 if(e<0)throw new Error('Это не архив .kubik (zip)');
 const n=dv.getUint16(e+10,true);let p=dv.getUint32(e+16,true);const out=new Map();let total=0;
 for(let i=0;i<n;i++){
  if(dv.getUint32(p,true)!==0x02014b50)throw new Error('Архив повреждён');
  const method=dv.getUint16(p+10,true),csize=dv.getUint32(p+20,true),usize=dv.getUint32(p+24,true),nl=dv.getUint16(p+28,true),el=dv.getUint16(p+30,true),cl=dv.getUint16(p+32,true),off=dv.getUint32(p+42,true);
  const name=new TextDecoder().decode(u.subarray(p+46,p+46+nl));p+=46+nl+el+cl;
  if(name.endsWith('/'))continue;
  total+=usize;if(total>30*1024*1024)throw new Error('Пакет слишком большой (больше 30 МБ)');
  const lnl=dv.getUint16(off+26,true),lel=dv.getUint16(off+28,true),ds=off+30+lnl+lel,raw=u.subarray(ds,ds+csize);
  let data;
  if(method===0)data=raw;
  else if(method===8)data=new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
  else throw new Error('Метод сжатия '+method+' не поддерживается');
  out.set(name,data)}
 return out}
