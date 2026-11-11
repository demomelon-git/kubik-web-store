# Кубик Веб-поиск для Kopi (.KD)

Пакет ZIP с расширением .kd.

- `kd.json` — манифест, новая вкладка и список разрешений.
- `newtab.html` — HTML-файл, который извлекает текущий KD-парсер.
- `main.js` — регистрация `kubik://new_tab` и установка новой вкладки.

## Реальный API текущего Kopi

Используются `window.kopi.register_site(url, html)` и `window.kopi.set_new_tab(url)`, которые в исходниках Kopi связаны с `KopiBrowserBridge.registerCustomScheme` и `KopiBrowserBridge.setNewTab`.

В просмотренном коде `kopi.request_permission()` не имеет соответствующего метода в Android bridge. Поэтому расширение не вызывает его: список доменов объявлен в `kd.json` для штатного диалога разрешений. `kopi.get_data_kopi()` не вызывается, так как личные данные для поиска не нужны.
