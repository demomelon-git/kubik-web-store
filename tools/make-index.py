#!/usr/bin/env python3
"""Просматривает addons/adofire (*.xpi) и addons/adocho (*.crx) и пишет addons/index.json для сайта.
Имя файла: <код>-<версия>.<xpi|crx>, например kubik-1.3.0.xpi или dr-1.0.0.crx.
Версия и название читаются из manifest.json внутри файла (имя файла нужно только для кода)."""
import os, re, json, zipfile, hashlib, datetime
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'addons')
DIRS = {'adofire': ('firefox', '.xpi'), 'adocho': ('chrome', '.crx'), 'kubik': ('kubik', '.kubik'), 'adoyan': ('yandex', '.zip')}
pat = re.compile(r'^(?P<code>[a-z0-9]+)-(?P<ver>\d+(?:[._]\d+)*)\.(xpi|crx|kubik|zip)$')
items = []
for folder, (browser, ext) in DIRS.items():
    d = os.path.join(root, folder)
    if not os.path.isdir(d): continue
    for f in sorted(os.listdir(d)):
        if not f.endswith(ext): continue
        m = pat.match(f)
        if not m:
            print('Пропускаю (имя должно быть <код>-<версия>%s):' % ext, f); continue
        p = os.path.join(d, f); ver = m['ver'].replace('_', '.'); title = m['code']
        try:  # zipfile открывает и .crx: пропускает заголовок перед архивом
            with zipfile.ZipFile(p) as z:
                mf = json.loads(z.read('kubik.json' if ext == '.kubik' else 'manifest.json').decode('utf-8-sig'))
                ver = mf.get('version', ver); title = mf.get('name', title)
        except Exception as e:
            print('Не удалось прочитать manifest в', f, e)
        items.append({'code': m['code'], 'title': title, 'browser': browser, 'version': ver, 'file': f,
                      'path': '%s/%s' % (folder, f), 'size': os.path.getsize(p),
                      'sha256': hashlib.sha256(open(p, 'rb').read()).hexdigest()})
out = {'generated': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'addons': items}
json.dump(out, open(os.path.join(root, 'index.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print('Найдено файлов:', len(items))

# --- файлы автообновления для Firefox (update_url) и Chrome (update_url)
BASE = 'https://demomelon-git.github.io/kubik-web-store/addons/'
try:
    cat = json.load(open(os.path.join(root, 'catalog.json'), encoding='utf-8'))
except Exception:
    cat = {'addons': []}
def vkey(v): return [int(x) for x in v.split('.')]
ff = {'addons': {}}; xml = []
for ad in cat['addons']:
    ids = ad.get('ids') or {}
    for br, fid in ids.items():
        mine = sorted([a for a in items if a['code'] == ad['code'] and a['browser'] == br], key=lambda a: vkey(a['version']))
        if not mine: continue
        if br == 'firefox':
            ff['addons'][fid] = {'updates': [{'version': a['version'], 'update_link': BASE + a['path'], 'update_hash': 'sha256:' + a['sha256']} for a in mine]}
        else:
            top = mine[-1]
            xml.append("  <app appid='%s'><updatecheck codebase='%s' version='%s' hash_sha256='%s'/></app>" % (fid, BASE + top['path'], top['version'], top['sha256']))
json.dump(ff, open(os.path.join(root, 'updates-firefox.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
open(os.path.join(root, 'updates-chrome.xml'), 'w', encoding='utf-8').write("<?xml version='1.0' encoding='UTF-8'?>\n<gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>\n" + '\n'.join(xml) + "\n</gupdate>\n")
print('Файлы обновлений: updates-firefox.json, updates-chrome.xml')
