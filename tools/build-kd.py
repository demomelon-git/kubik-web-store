#!/usr/bin/env python3
"""Build Kopi .kd ZIP packages from src/kopi/*."""
import json
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "src" / "kopi"
OUTPUT = ROOT / "addons" / "kopi"
OUTPUT.mkdir(parents=True, exist_ok=True)

for extension in sorted(p for p in SOURCE.iterdir() if p.is_dir()):
    manifest = extension / "kd.json"
    if not manifest.is_file():
        continue
    data = json.loads(manifest.read_text(encoding="utf-8"))
    filename = f"{data['id']}-{data['version']}.kd"
    target = OUTPUT / filename
    with ZipFile(target, "w", ZIP_DEFLATED) as archive:
        for item in sorted(extension.rglob("*")):
            if item.is_file():
                archive.write(item, item.relative_to(extension).as_posix())
    print(f"Built {target.relative_to(ROOT)}")
