"""Empaqueta solo archivos de ejecución; no incluye pruebas ni datos de desarrollo."""
from pathlib import Path
import json
import zipfile

ROOT = Path(__file__).resolve().parents[1]
version = json.loads((ROOT / 'module.json').read_text())['version']
destination = ROOT / 'releases' / f'ecos-frontera-{version}.zip'
destination.parent.mkdir(exist_ok=True)
with zipfile.ZipFile(destination, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    files = [ROOT / 'module.json', ROOT / 'README.md']
    for folder in ['data', 'icons', 'scripts', 'styles', 'templates']:
        files.extend(p for p in (ROOT / folder).rglob('*') if p.is_file())
    for file in sorted(files):
        info = zipfile.ZipInfo('ecos-frontera/' + file.relative_to(ROOT).as_posix(), date_time=(2026, 1, 1, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o100644 << 16
        archive.writestr(info, file.read_bytes(), compresslevel=9)
with zipfile.ZipFile(destination) as archive:
    if archive.testzip():
        raise RuntimeError('El paquete no superó la verificación CRC')
    manifest = json.loads(archive.read('ecos-frontera/module.json'))
    for name in manifest['esmodules'] + manifest['styles']:
        archive.getinfo('ecos-frontera/' + name)
print(destination.relative_to(ROOT))
