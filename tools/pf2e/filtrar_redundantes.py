"""4.2b: separa los hechizos de PF2e ya cubiertos por dnd5e (mismo nombre, mismo efecto o hechizos de foco) de los únicos a convertir.
Lee hechizos-pf2e.json y los compendios dnd5e.spells y dnd5e.spells24 del disco; escribe filtro-pf2e.json."""
import os
DATA = os.environ.get('FOUNDRY_DATA', os.path.expandvars(r'%LOCALAPPDATA%\FoundryVTT\Data'))
import json, re, sys, unicodedata, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from leveldb import leer_pack
def norm(s): s = unicodedata.normalize('NFKD', s or '').encode('ascii','ignore').decode().lower(); return re.sub(r'[^a-z0-9]+', ' ', s).strip()
dnd = {}
for pack in ['spells', 'spells24']:
    for k, v in leer_pack(os.path.join(DATA, 'systems', 'dnd5e', 'packs', pack)).items():
        if not k.startswith(b'!items!'): continue
        d = json.loads(v)
        if d.get('type') != 'spell': continue
        dnd.setdefault(norm(d['name']), []).append(f"dnd5e.{pack}")
print('dnd5e', len(dnd))
P = json.load(open('hechizos-pf2e.json', encoding='utf-8'))
# Equivalencias de nombre conocidas entre PF2e y dnd5e (mismo efecto, distinto nombre o el nombre viejo del Remaster)
ALIAS = {'force barrage': 'magic missile', 'magic missile': 'magic missile', 'breathe fire': 'burning hands', 'ignition': 'fire bolt',
 'heal': 'cure wounds', 'harm': 'inflict wounds', 'vitality lash': 'chill touch', 'void warp': 'chill touch', 'sure strike': 'true strike',
 'illusory disguise': 'disguise self', 'cleanse affliction': 'lesser restoration', 'translocate': 'misty step', 'dimension door': 'dimension door',
 'cast into time': 'banishment', 'divine wrath': 'spirit guardians', 'rouse skeletons': 'animate dead', 'fly': 'fly', 'haste': 'haste', 'slow': 'slow',
 'mystic armor': 'mage armor', 'gale blast': 'gust', 'blazing bolt': 'scorching ray', 'frostbite': 'ray of frost', 'electric arc': 'shocking grasp',
 'command': 'command', 'sleep': 'sleep', 'fear': 'cause fear', 'shield': 'shield', 'light': 'light', 'message': 'message', 'prestidigitation': 'prestidigitation',
 'mage hand': 'mage hand', 'telekinetic hand': 'mage hand', 'figment': 'minor illusion', 'ghost sound': 'minor illusion', 'detect magic': 'detect magic',
 'read aura': 'identify', 'stabilize': 'spare the dying', 'shield other': 'warding bond', 'invisibility': 'invisibility', 'see the unseen': 'see invisibility',
 'fireball': 'fireball', 'lightning bolt': 'lightning bolt', 'cone of cold': 'cone of cold', 'chain lightning': 'chain lightning', 'wall of fire': 'wall of fire',
 'wall of stone': 'wall of stone', 'teleport': 'teleport', 'raise dead': 'raise dead', 'resurrect': 'resurrection', 'wish': 'wish', 'meteor swarm': 'meteor swarm'}
unicos, redundantes = [], []
for h in P['hechizos']:
    n = norm(h['nombre']); n2 = norm(re.sub(r'\s*\((?:[^)]*)\)\s*$', '', h['nombre']))
    if 'focus' in h['rasgos']: motivo = 'hechizo de foco (de clase, no de lista)'
    elif n in dnd or n2 in dnd: motivo = f"mismo nombre en {', '.join(sorted(set(dnd.get(n) or dnd.get(n2))))}"
    elif ALIAS.get(n) and norm(ALIAS[n]) in dnd: motivo = f"mismo efecto que «{ALIAS[n].title()}» de dnd5e"
    else: motivo = None
    fila = {'id': h['id'], 'nombre': h['nombre'], 'nombreEs': h['nombreEs'], 'rango': h['rango'], 'truco': h['truco'], 'rareza': h['rareza'], 'tradiciones': h['tradiciones'], 'licencia': h['licencia']}
    (redundantes if motivo else unicos).append({**fila, **({'motivo': motivo} if motivo else {})})
print('únicos', len(unicos), 'redundantes', len(redundantes))
print(collections.Counter(r['motivo'].split(' (')[0].split(' en ')[0].split('«')[0].strip() for r in redundantes).most_common())
print('únicos por rango', sorted(collections.Counter((u['rango'] if not u['truco'] else 0) for u in unicos).items()))
print('únicos por rareza', collections.Counter(u['rareza'] for u in unicos))
json.dump({'version': 1, 'unicos': unicos, 'redundantes': redundantes}, open('filtro-pf2e.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
