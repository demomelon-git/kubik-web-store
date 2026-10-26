(()=>{const box=document.getElementById('extras');if(!box)return;
 const ua=navigator.userAgent,br=((navigator.userAgentData&&navigator.userAgentData.brands)||[]).map(b=>b.brand).join(' ');
 const kind=/Firefox\//.test(ua)?'firefox':(/Chrome\/|Chromium\/|CriOS/.test(ua)||/Chromium|Google Chrome/.test(br))?'chrome':'';
 const NAME={firefox:'Firefox',chrome:'Chrome'},SITE='https://demomelon-git.github.io/kubik-web-store/';
 box.innerHTML=(kind?`<a class="xc" href="${SITE}?b=${kind}"><b>Дополнение для ${NAME[kind]}</b><span>demomelon-git / kubik-web-store</span></a>`:'')+
  '<div class="xc"><b id="xt"></b><span id="xd"></span></div><div class="xc"><b>Заметка</b><textarea id="xn" rows="2" placeholder="Быстрая заметка…"></textarea></div>';
 const tick=()=>{const d=new Date();document.getElementById('xt').textContent=d.toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'});document.getElementById('xd').textContent=d.toLocaleDateString('ru',{weekday:'long',day:'numeric',month:'long'})};tick();setInterval(tick,10000);
 const n=document.getElementById('xn');try{n.value=localStorage.getItem('kubikNote')||''}catch(e){}n.addEventListener('input',()=>{try{localStorage.setItem('kubikNote',n.value)}catch(e){}})})();
