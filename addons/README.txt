Папка addons — отсюда сайт берёт дополнения.

  adofire/   Firefox: файлы .xpi (подписаны Mozilla, не zip)
  adocho/    Chrome:  файлы .crx (не zip)
  catalog.json  названия и описания (код, имя, главное ли расширение)
  index.json    список файлов, создаётся скриптом tools/make-index.py

Имя файла: <код>-<версия>.<xpi|crx>
  kubik-1.3.0.xpi, kubik-2.1.0.crx, dr-1.0.0.crx (dr — короткий код, например, для Dark Rander)

Старые версии оставляй в папках: они покажутся в списке «Старые версии».
После добавления файла запусти python3 tools/make-index.py (на GitHub это делает workflow).
