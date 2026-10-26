#!/usr/bin/env python3
"""Собирает «Кубик расширения» (Firefox: zip на подпись, Chrome: .crx) и пакеты .kubik.
  python3 tools/build-host.py          всё
  python3 tools/build-host.py kubik    только пакеты .kubik
Ключ Chrome-версии: KUBIK_HOST_KEY (pem, не публиковать)."""
import os, sys, json, shutil, zipfile, base64, subprocess, tempfile
root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
host = os.path.join(root, 'src', 'host')
common = [f for f in os.listdir(host) if not f.startswith(('manifest.', 'background.'))]
ver = json.load(open(os.path.join(host, 'manifest.firefox.json'), encoding='utf-8'))['version']
def stage(kind):
    d = tempfile.mkdtemp(prefix='kx-' + kind)
    for f in common: shutil.copy(os.path.join(host, f), d)
    shutil.copy(os.path.join(host, 'background.%s.js' % kind), os.path.join(d, 'background.js'))
    return d, json.load(open(os.path.join(host, 'manifest.%s.json' % kind), encoding='utf-8'))
def zipdir(src, dst):
    z = zipfile.ZipFile(dst, 'w', zipfile.ZIP_DEFLATED)
    for r, _, fs in os.walk(src):
        for f in sorted(fs): z.write(os.path.join(r, f), os.path.relpath(os.path.join(r, f), src))
    z.close()
if 'kubik' not in sys.argv[1:]:
    d, m = stage('firefox'); json.dump(m, open(d + '/manifest.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    os.makedirs(os.path.join(root, 'dist'), exist_ok=True)
    zipdir(d, os.path.join(root, 'dist', 'kubikhost-firefox-%s-unsigned.zip' % ver))
    keyfile = os.environ.get('KUBIK_HOST_KEY')
    if keyfile:
        from cryptography.hazmat.primitives import serialization
        k = serialization.load_pem_private_key(open(keyfile, 'rb').read(), None)
        pub = k.public_key().public_bytes(serialization.Encoding.DER, serialization.PublicFormat.SubjectPublicKeyInfo)
        d, m = stage('chrome'); m['key'] = base64.b64encode(pub).decode()
        json.dump(m, open(d + '/manifest.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
        subprocess.check_call([sys.executable, os.path.join(root, 'tools', 'build-crx.py'), d, os.path.join(root, 'addons', 'adocho', 'kubikhost-%s.crx' % ver)], env=dict(os.environ, KUBIK_KEY=keyfile))
    else:
        print('KUBIK_HOST_KEY не задан: .crx не собран')
kd = os.path.join(root, 'src', 'kubik'); os.makedirs(os.path.join(root, 'addons', 'kubik'), exist_ok=True)
for name in sorted(os.listdir(kd)):
    p = os.path.join(kd, name)
    if not os.path.isfile(os.path.join(p, 'kubik.json')): continue
    man = json.load(open(os.path.join(p, 'kubik.json'), encoding='utf-8'))
    out = os.path.join(root, 'addons', 'kubik', '%s-%s.kubik' % (man['id'], man['version']))
    zipdir(p, out); print('Готово:', os.path.relpath(out, root))
