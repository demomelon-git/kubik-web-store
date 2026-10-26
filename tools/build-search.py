#!/usr/bin/env python3
"""Собирает обычный «Кубик» и «Кубик Стиль» для Firefox (zip на подпись) и Chrome (.crx).
Ключи Chrome: KUBIK_KEY (обычный) и KUBIK_STYLE_KEY (Стиль). Не публиковать!"""
import os, sys, json, shutil, zipfile, base64, subprocess, tempfile
root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
VARIANTS = [
    {'code': 'kubik', 'name': 'Кубик — главная и поиск', 'ff_id': None, 'key_env': 'KUBIK_KEY', 'overlay': False},
    {'code': 'kubikstyle', 'name': 'Кубик Стиль — главная и поиск', 'ff_id': 'kubik-style@demomelon-git.github.io', 'key_env': 'KUBIK_STYLE_KEY', 'overlay': True},
]
def zipdir(src, dst):
    z = zipfile.ZipFile(dst, 'w', zipfile.ZIP_DEFLATED)
    for r, _, fs in os.walk(src):
        for f in sorted(fs): z.write(os.path.join(r, f), os.path.relpath(os.path.join(r, f), src))
    z.close()
def stage(kind, v):
    d = tempfile.mkdtemp(prefix='ks-%s-%s' % (v['code'], kind))
    src = os.path.join(root, 'src', kind)
    for f in os.listdir(src): shutil.copy(os.path.join(src, f), d)
    u = open(os.path.join(d, 'update.js'), encoding='utf-8').read().replace('__CODE__', v['code'])
    open(os.path.join(d, 'update.js'), 'w', encoding='utf-8').write(u)
    m = json.load(open(os.path.join(src, 'manifest.json'), encoding='utf-8')); m['name'] = v['name']
    if v['overlay']:
        for f in ('skin.js', 'skin.css'): shutil.copy(os.path.join(root, 'src', 'style', f), d)
        for page in ('newtab.html', 'results.html'):
            p = os.path.join(d, page); h = open(p, encoding='utf-8').read()
            h = h.replace('</head>', '<link rel="stylesheet" href="skin.css"></head>', 1)
            h = h.replace('<script src="mascot.js"></script>', '<script src="mascot.js"></script><script src="skin.js"></script>', 1)
            assert 'skin.js' in h and 'skin.css' in h
            open(p, 'w', encoding='utf-8').write(h)
        if kind == 'firefox': m['web_accessible_resources'] = sorted(set(m['web_accessible_resources'] + ['skin.js', 'skin.css']))
        if v['ff_id'] and kind == 'firefox': m['browser_specific_settings']['gecko']['id'] = v['ff_id']
    return d, m
os.makedirs(os.path.join(root, 'dist'), exist_ok=True)
for v in VARIANTS:
    d, m = stage('firefox', v); json.dump(m, open(d + '/manifest.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    out = os.path.join(root, 'dist', '%s-firefox-%s-unsigned.zip' % (v['code'], m['version'])); zipdir(d, out); print('Firefox:', os.path.relpath(out, root))
    kf = os.environ.get(v['key_env'])
    if not kf: print('Нет %s — .crx для %s не собран' % (v['key_env'], v['code'])); continue
    from cryptography.hazmat.primitives import serialization
    k = serialization.load_pem_private_key(open(kf, 'rb').read(), None)
    pub = k.public_key().public_bytes(serialization.Encoding.DER, serialization.PublicFormat.SubjectPublicKeyInfo)
    d, m = stage('chrome', v); m['key'] = base64.b64encode(pub).decode()
    json.dump(m, open(d + '/manifest.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    crx = os.path.join(root, 'addons', 'adocho', '%s-%s.crx' % (v['code'], m['version']))
    subprocess.check_call([sys.executable, os.path.join(root, 'tools', 'build-crx.py'), d, crx], env=dict(os.environ, KUBIK_KEY=kf))
