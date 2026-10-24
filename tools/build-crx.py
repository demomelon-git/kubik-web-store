#!/usr/bin/env python3
"""Собирает подписанный .crx (CRX3) из папки расширения для Chrome.
Использование: python3 tools/build-crx.py src/chrome addons/adocho/kubik-2.1.0.crx
Ключ tools/keys/kubik.pem создаётся при первом запуске. Храни его и не публикуй:
пока ключ тот же, ID расширения не меняется между версиями.
pip install cryptography
"""
import sys, os, io, zipfile, struct, hashlib
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding

src, out = sys.argv[1], sys.argv[2]
keyfile = os.environ.get('KUBIK_KEY') or os.path.join(os.path.dirname(__file__), 'keys', 'kubik.pem')
if os.path.exists(keyfile):
    key = serialization.load_pem_private_key(open(keyfile, 'rb').read(), None)
else:
    key = rsa.generate_private_key(65537, 2048)
    os.makedirs(os.path.dirname(keyfile), exist_ok=True)
    open(keyfile, 'wb').write(key.private_bytes(serialization.Encoding.PEM,
        serialization.PrivateFormat.PKCS8, serialization.NoEncryption()))
    print('Создан новый ключ:', keyfile)

pub = key.public_key().public_bytes(serialization.Encoding.DER, serialization.PublicFormat.SubjectPublicKeyInfo)
crx_id = hashlib.sha256(pub).digest()[:16]

buf = io.BytesIO()
with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as z:
    for root, _, files in os.walk(src):
        for f in sorted(files):
            p = os.path.join(root, f)
            z.write(p, os.path.relpath(p, src).replace(os.sep, '/'))
zipped = buf.getvalue()

def varint(n):
    b = bytearray()
    while True:
        c = n & 0x7f; n >>= 7
        b.append(c | (0x80 if n else 0))
        if not n: return bytes(b)
def ld(field, data): return varint(field << 3 | 2) + varint(len(data)) + data

signed_header = ld(1, crx_id)                        # SignedData { crx_id }
to_sign = b'CRX3 SignedData\x00' + struct.pack('<I', len(signed_header)) + signed_header + zipped
sig = key.sign(to_sign, padding.PKCS1v15(), hashes.SHA256())
proof = ld(1, pub) + ld(2, sig)                      # AsymmetricKeyProof
header = ld(2, proof) + ld(10000, signed_header)     # CrxFileHeader
open(out, 'wb').write(b'Cr24' + struct.pack('<II', 3, len(header)) + header + zipped)
ext_id = ''.join(chr(ord('a') + int(h, 16)) for h in crx_id.hex())
print('Готово:', out, '| ID расширения:', ext_id)
