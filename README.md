# Кубик Web Store

Главный сайт Кубика и магазин дополнений для Firefox, Chrome и «Кубик расширения».

## Структура
```
index.html             главный сайт: ссылка на магазин, информация о версиях Chrome, Firefox и Кубик
store/                 Kubik Web Store: определяет браузер, три раздела (Firefox, Chrome, Кубик)
kubikwebs/             страница главного расширения «Кубик Веб-поиск»
addons/
  adofire/             Firefox: .xpi с подписью Mozilla (не zip)
  adocho/              Chrome: .crx (не zip)
  adoyan/              Яндекс Браузер: zip (он не принимает .crx), собирается tools/build-yandex.py
  kubik/               внутренние расширения .kubik
  catalog.json         названия, описания, ID, ожидающие версии
  index.json           список файлов (создаётся скриптом)
  updates-firefox.json, updates-chrome.xml   файлы автообновления (создаются скриптом)
src/firefox, src/chrome   простой «Кубик Веб-поиск»; src/style — надстройка «Кубик Стиль» (картинка помощника, фон, темы, вид интерфейса)
src/host               «Кубик расширения» (оболочка для .kubik)
src/kubik/*            исходники внутренних расширений
tools/                 build-yandex.py (версии для Яндекс Браузера), build-search.py (обычный Кубик и Кубик Стиль), build-crx.py, build-host.py, make-index.py
FORMAT.md              формат .kubik и API
```

## Что где
- **Простой Кубик** (`src/firefox`, `src/chrome`) работает сам по себе. Он раз в 6 часов проверяет магазин и показывает баннер о новой версии. Кроме того, в манифестах стоит `update_url` для автообновления (Firefox работает с подписанными `.xpi`, в Chrome автообновление вне магазина работает не везде).
- **Кубик расширения** (`src/host`) — оболочка, в которую ставятся пакеты `.kubik`. Главный поиск запускается по его ID: `…/app.html?q=%s`.
- **Кубик Веб-поиск** (`src/kubik/kubikweb`) — главная страница и метапоиск как внутреннее расширение. **Кубик для GitHub** (`src/kubik/kubikgh`) — обзор репозиториев и установка `.kubik`; он обращается к «Кубик Веб-поиск» через `KX.send`.

## Имена файлов
`<код>-<версия>.<xpi|crx|kubik>`: `kubik-1.3.0.xpi`, `kubik-2.2.0.crx`, `kubikhost-0.1.0.crx`, `kubikweb-1.0.0.kubik`. У каждого расширения свой короткий код (например, Dark Rander → `dr`).

## Выпуск новой версии
1. Поменяй `version` в манифесте (`src/firefox|chrome|host`) или в `kubik.json`.
2. **Обычный Кубик и Кубик Стиль:** `KUBIK_KEY=… KUBIK_STYLE_KEY=… python3 tools/build-search.py` — соберёт zip для Firefox в `dist/` и `.crx` в `addons/adocho/`.
   **Chrome отдельно:** `KUBIK_KEY=путь/kubik.pem python3 tools/build-crx.py src/chrome addons/adocho/kubik-<версия>.crx` (для «Кубик расширения»: `KUBIK_HOST_KEY=путь/kubik-host.pem python3 tools/build-host.py`).
3. **Firefox:** упакуй папку в zip (manifest.json в корне), загрузи на addons.mozilla.org как неопубликованное, скачай подписанный `.xpi`, положи в `addons/adofire/` как `<код>-<версия>.xpi` и убери запись `pending` в `catalog.json`.
4. **.kubik:** `python3 tools/build-host.py` собирает пакеты из `src/kubik/*` в `addons/kubik/`.
5. `python3 tools/make-index.py` (на GitHub это делает workflow). Сайт сам увидит новые файлы через GitHub API.

Ключи `.pem` нельзя публиковать и терять: от них зависит ID Chrome-расширений. Они в `.gitignore`.

## Добавить чужое расширение
Автор пишет на **demoda228@gmail.com**: название, короткий код, браузер, версия, ссылка на файл. Дальше: положить файл в нужную папку, дописать запись в `addons/catalog.json`, запустить `make-index.py`.

## GitHub Pages
Settings → Pages → ветка `main`, папка `/ (root)`. Адрес: https://demomelon-git.github.io/kubik-web-store/

## catalog.json: описания
Каждая запись: `code`, `name`, `short` (одна строка для карточки). Для страницы `kubikwebs/` добавь `"showcase": true`, `"order"` (порядок), `"about"` (абзац), `"features"` (список) и `"tags"` (значки). Страница сама подхватит правку, ничего пересобирать не нужно.
