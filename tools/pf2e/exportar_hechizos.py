"""4.2a: exporta los hechizos del sistema PF2e instalado a hechizos-pf2e.json, con nombre y texto en castellano de pf2e-es.
Se ejecuta en el PC del DM (python exportar_hechizos.py). El JSON trae texto de Paizo (ORC/OGL): no se sube al repositorio."""
import os
DATA = os.environ.get('FOUNDRY_DATA', os.path.expandvars(r'%LOCALAPPDATA%\FoundryVTT\Data'))
import json, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from leveldb import leer_pack
vals = leer_pack(os.path.join(DATA, 'systems', 'pf2e', 'packs', 'spells'))
es = json.load(open(os.path.join(DATA, 'modules', 'pf2e-es', 'translation', 'es', 'compendium', 'pf2e.spells-srd.json'), encoding='utf-8'))
ent = es.get('entries', es)
txt = lambda h: re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', str(h or ''))).strip()
filas = []
for k, v in vals.items():
    if not k.startswith(b'!items!'): continue
    d = json.loads(v); s = d.get('system', {})
    tr = s.get('traits', {}); pub = s.get('publication', {}) or {}
    trad = ent.get(d['name']) or {}
    filas.append({
        'id': d['_id'], 'nombre': d['name'], 'nombreEs': trad.get('name'), 'rango': (s.get('level') or {}).get('value'),
        'truco': 'cantrip' in (tr.get('value') or []), 'tradiciones': tr.get('traditions') or [], 'rasgos': tr.get('value') or [],
        'rareza': tr.get('rarity') or 'common', 'acciones': (s.get('time') or {}).get('value'), 'alcance': (s.get('range') or {}).get('value'),
        'area': s.get('area'), 'objetivo': (s.get('target') or {}).get('value'),
        'salvacion': ((s.get('defense') or {}).get('save') or {}).get('statistic'), 'basica': bool(((s.get('defense') or {}).get('save') or {}).get('basic')),
        'defensa': ((s.get('defense') or {}).get('passive') or {}).get('statistic'),
        'duracion': (s.get('duration') or {}).get('value'), 'sostenido': bool((s.get('duration') or {}).get('sustained')),
        'dano': s.get('damage'), 'intensificar': s.get('heightening'),
        'fuente': pub.get('title'), 'licencia': pub.get('license'), 'remaster': bool(pub.get('remaster')),
        'texto': txt((s.get('description') or {}).get('value')), 'textoEs': txt(trad.get('description')) or None,
    })
filas.sort(key=lambda f: (f['rango'] or 0, f['nombre']))
import collections
print(len(filas), collections.Counter(f['licencia'] for f in filas).most_common(), sum(1 for f in filas if f['nombreEs']), 'con traducción')
print(collections.Counter(tuple(sorted(f['tradiciones'])) for f in filas).most_common(6))
print(collections.Counter(f['rareza'] for f in filas))
print(sum(1 for f in filas if 'focus' in f['rasgos']), 'de foco', sum(1 for f in filas if 'ritual' in f['rasgos']), 'rituales', sum(1 for f in filas if f['truco']),'trucos')
json.dump({'version': 1, 'sistema': 'pf2e 8.6.1', 'origen': 'Data/systems/pf2e/packs/spells (leído del disco, sin abrir un mundo)', 'total': len(filas), 'hechizos': filas}, open('hechizos-pf2e.json', 'w', encoding='utf-8'), ensure_ascii=False)
