#!/usr/bin/env python3
"""Собирает версии для Яндекс Браузера (Chromium): zip с manifest.json в корне, без .crx.
Яндекс Браузер на телефоне не принимает chrome_url_overrides и omnibox, поэтому их в этих сборках нет:
Кубик открывается по адресу https://127.0.0.1/ (правило перенаправления) и по кнопке расширения."""
import os, json, shutil, zipfile, tempfile
root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
OUT = os.path.join(root, 'addons', 'adoyan'); os.makedirs(OUT, exist_ok=True)
DROP = ('chrome_url_overrides', 'omnibox', 'update_url', 'key')
GUARD = [("chrome.omnibox.setDefaultSuggestion(", "chrome.omnibox&&chrome.omnibox.setDefaultSuggestion("),
         ("chrome.omnibox.onInputEntered.addListener(", "chrome.omnibox&&chrome.omnibox.onInputEntered.addListener(")]
def finish(d, m, code, page):
    for k in DROP: m.pop(k, None)
    m['action'] = {'default_title': m['name'].split(' — ')[0]}
    bg = open(os.path.join(d, 'background.js'), encoding='utf-8').read()
    for a, b in GUARD: bg = bg.replace(a, b)
    bg += "\n// Яндекс Браузер: подмены новой вкладки нет, поэтому открываем Кубик по кнопке расширения\nchrome.action&&chrome.action.onClicked.addListener(()=>chrome.tabs.create({url:chrome.runtime.getURL('%s')}));\n" % page
    open(os.path.join(d, 'background.js'), 'w', encoding='utf-8').write(bg)
    json.dump(m, open(os.path.join(d, 'manifest.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    out = os.path.join(OUT, '%s-%s.zip' % (code, m['version']))
    z = zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED)
    for r, _, fs in os.walk(d):
        for f in sorted(fs): z.write(os.path.join(r, f), os.path.relpath(os.path.join(r, f), d))
    z.close(); print('Готово:', os.path.relpath(out, root), m['version'])
def search(code, name, overlay):
    d = tempfile.mkdtemp(prefix='yan-' + code); src = os.path.join(root, 'src', 'chrome')
    for f in os.listdir(src): shutil.copy(os.path.join(src, f), d)
    u = open(os.path.join(d, 'update.js'), encoding='utf-8').read().replace('__CODE__', code)
    for a, b in [("(FF?'adofire':'adocho')", "'adoyan'"), ("(FF?'xpi':'crx')", "'zip'"), ("(FF?'firefox':'chrome')", "'yandex'")]:
        assert a in u, a; u = u.replace(a, b)
    open(os.path.join(d, 'update.js'), 'w', encoding='utf-8').write(u)
    e = open(os.path.join(d, 'extras.js'), encoding='utf-8').read()
    a = "const kind=/Firefox\\//.test(ua)?'firefox':"; assert a in e
    e = e.replace(a, "const kind=/YaBrowser\\//.test(ua)?'yandex':/Firefox\\//.test(ua)?'firefox':").replace("const NAME={firefox:'Firefox',chrome:'Chrome'}", "const NAME={firefox:'Firefox',chrome:'Chrome',yandex:'Яндекс Браузера'}")
    open(os.path.join(d, 'extras.js'), 'w', encoding='utf-8').write(e)
    m = json.load(open(os.path.join(src, 'manifest.json'), encoding='utf-8')); m['name'] = name
    if overlay:
        for f in ('skin.js', 'skin.css'): shutil.copy(os.path.join(root, 'src', 'style', f), d)
        for page in ('newtab.html', 'results.html'):
            p = os.path.join(d, page); h = open(p, encoding='utf-8').read()
            h = h.replace('</head>', '<link rel="stylesheet" href="skin.css"></head>', 1).replace('<script src="mascot.js"></script>', '<script src="mascot.js"></script><script src="skin.js"></script>', 1)
            assert 'skin.js' in h; open(p, 'w', encoding='utf-8').write(h)
    finish(d, m, code, 'newtab.html')
search('kubik', 'Кубик — главная и поиск', False)
search('kubikstyle', 'Кубик Стиль — главная и поиск', True)
# Кубик расширения (оболочка для .kubik)
host = os.path.join(root, 'src', 'host'); d = tempfile.mkdtemp(prefix='yan-host')
for f in os.listdir(host):
    if not f.startswith(('manifest.', 'background.')): shutil.copy(os.path.join(host, f), d)
shutil.copy(os.path.join(host, 'background.chrome.js'), os.path.join(d, 'background.js'))
finish(d, json.load(open(os.path.join(host, 'manifest.chrome.json'), encoding='utf-8')), 'kubikhost', 'app.html')
