# Кубик Web Store

Страница-хаб с дополнениями для Firefox и Chrome. Сайт сам определяет браузер (можно переключить вручную) и берёт файлы из папки `addons/`.

## Структура
```
index.html, store.js, store.css   главная страница магазина
kubikwebs/                        страница главного расширения «Кубик Веб-поиск»
addons/
  adofire/   Firefox: файлы .xpi с подписью Mozilla (не zip)
  adocho/    Chrome: файлы .crx (не zip)
  catalog.json   названия, описания, главное ли расширение
  index.json     список файлов (создаётся скриптом)
src/firefox, src/chrome           исходники Кубика
tools/                            build-crx.py, make-index.py
```

## Имена файлов
`<код>-<версия>.<xpi|crx>`: `kubik-1.3.0.xpi`, `kubik-2.1.0.crx`, `dr-1.0.0.crx` (у каждого расширения свой короткий код, например Dark Rander → `dr`). Версию и название сайт читает из `manifest.json` внутри файла. Старые версии оставляй в папках, они покажутся в «Старые версии».

## Новая версия Кубика
**Chrome:** поменяй `version` в `src/chrome/manifest.json`, затем  
`KUBIK_KEY=путь/к/kubik.pem python3 tools/build-crx.py src/chrome addons/adocho/kubik-<версия>.crx` (нужен `pip install cryptography`).  
Ключ нельзя публиковать и терять: пока он тот же, ID расширения не меняется. Он в `.gitignore`.

**Firefox:** поменяй `version` в `src/firefox/manifest.json`, упакуй содержимое папки в zip, загрузи на addons.mozilla.org (самостоятельное распространение), скачай подписанный `.xpi` и положи в `addons/adofire/` под именем `kubik-<версия>.xpi`. Потом убери запись `pending` у Кубика в `addons/catalog.json`.

После добавления файла запусти `python3 tools/make-index.py` (на GitHub это делает workflow «Обновить список дополнений»).

## Добавить чужое расширение
Автор расширения пишет на **demoda228@gmail.com**: название, короткий код, браузер, версия, ссылка на файл. Добавление: положить файл в нужную папку, дописать расширение в `addons/catalog.json`, запустить `make-index.py`.

## GitHub Pages
Settings → Pages → Branch `main`, папка `/ (root)`.
