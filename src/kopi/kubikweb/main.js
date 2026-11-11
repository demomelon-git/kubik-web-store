/* Кубик Веб-поиск для Kopi — .kd */
(function () {
  'use strict';
  if (!window.kopi) {
    console.error('[Кубик для Kopi] Не найден API window.kopi. Нужна версия Kopi с поддержкой .kd и custom commands.');
    return;
  }

  const htmlContent = `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Кубик — поиск</title>
<style>
:root{color-scheme:light dark;--bg:#f7f8fc;--fg:#202124;--muted:#687080;--card:#fff;--line:#dce1eb;--accent:#536dfe}
@media(prefers-color-scheme:dark){:root{--bg:#17191f;--fg:#f1f3f8;--muted:#a5adbd;--card:#242832;--line:#3a4150;--accent:#9aa8ff}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:16px system-ui,Roboto,Arial,sans-serif;min-height:100vh}
main{width:min(760px,calc(100% - 32px));margin:0 auto;padding:12vh 0 80px;text-align:center}
.logo{font-size:clamp(48px,12vw,76px);font-weight:750;letter-spacing:-4px;margin:0 0 8px}
.logo span:nth-child(1){color:#ea4335}.logo span:nth-child(2){color:#fbbc05}.logo span:nth-child(3){color:#4285f4}.logo span:nth-child(4){color:#34a853}.logo span:nth-child(5){color:#ea4335}
.sub{color:var(--muted);margin:0 0 30px}
form{display:flex;gap:8px;padding:8px;border:1px solid var(--line);border-radius:28px;background:var(--card);box-shadow:0 4px 22px #0000000c}
input{min-width:0;flex:1;border:0;outline:0;background:transparent;color:var(--fg);font:inherit;padding:10px 14px}
button,.link{border:0;border-radius:22px;background:var(--accent);color:white;padding:11px 20px;font:inherit;text-decoration:none;cursor:pointer}
.quick{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:26px 0}
.quick a,.tiles a{color:var(--fg);text-decoration:none;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:10px 14px}
.tiles{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:34px}
.note{color:var(--muted);font-size:13px;margin-top:36px}
@media(max-width:480px){main{padding-top:9vh}form{gap:4px}button{padding:10px 14px}}
</style>
</head>
<body><main>
<h1 class="logo"><span>К</span><span>у</span><span>б</span><span>и</span><span>к</span></h1>
<p class="sub">Поиск в интернете — главная страница для Kopi</p>
<form id="search"><input id="q" type="search" placeholder="Введите запрос или адрес сайта" autocomplete="off" autofocus><button type="submit">Найти</button></form>
<div class="quick">
<a href="https://www.google.com/">Google</a><a href="https://www.bing.com/">Bing</a><a href="https://search.brave.com/">Brave</a><a href="https://duckduckgo.com/">DuckDuckGo</a><a href="https://www.startpage.com/">Startpage</a>
</div>
<div class="tiles"><a href="https://127.0.0.1/">Открыть 127.0.0.1</a><a href="https://demomelon-git.github.io/kubik-web-store/">Kubik Web Store</a></div>
<p class="note">Кубик Веб-поиск · специальная версия для браузера Kopi</p>
</main>
<script>
(function(){
 const form=document.getElementById('search'),input=document.getElementById('q');
 form.addEventListener('submit',function(e){
  e.preventDefault();const q=input.value.trim();if(!q)return;
  if(/^https?:\\/\\//i.test(q)){location.href=q;return}
  if(/^[^\\s]+\\.[a-zа-я]{2,}([/\\?#].*)?$/i.test(q)){location.href='https://'+q;return}
  location.href='https://www.google.com/search?q='+encodeURIComponent(q);
 });
})();
</script></body></html>`;

  const domains = [
    'www.google.com',
    'www.bing.com',
    'search.brave.com',
    'duckduckgo.com',
    'www.startpage.com',
    '127.0.0.1',
    'demomelon-git.github.io'
  ];

  async function install() {
    // Запрашиваем только домены, используемые кнопками поиска, локальным адресом и магазином.
    for (const domain of domains) {
      try { await kopi.request_permission(domain); }
      catch (error) { console.warn('[Кубик для Kopi] Доступ не выдан:', domain, error); }
    }
    try {
      await kopi.register_site('kubik://new_tab', htmlContent);
      await kopi.set_new_tab('kubik://new_tab');
      console.info('[Кубик для Kopi] Главная страница kubik://new_tab зарегистрирована.');
    } catch (error) {
      console.error('[Кубик для Kopi] Не удалось зарегистрировать главную страницу:', error);
    }
  }

  install();
})();
