"""3.52 · Dotes, razas y objetos de PF2e nivelados a D&D 5e (pedido del autor, 12-nov-2026).

Lee del disco (sin abrir un mundo PF2e) los compendios del sistema PF2e instalado y la traducción de pf2e-es:
  dotes:    feats (generales, de habilidad, de ascendencia y de clase; sin arquetipos ni dedicaciones)
  razas:    ancestries + ancestry-features (rasgos) + heritages (herencias)
  objetos:  equipment (consumibles, venenos, alquímicos, armas, armaduras, escudos, equipo, tesoros)
Omite lo que D&D ya tiene (mismo nombre o mismo efecto) y lo que depende de clases sin equivalente en D&D.
Nivela el texto al vocabulario y las reglas de D&D (salvaciones, pericias, estados, acciones, frecuencias, resistencias)
y deja los datos estructurados (nivel, requisitos, clase, ascendencia, venenos por etapas) en flags.ecos-frontera.pf2e.

Escribe en la carpeta actual (Data/ecos-pf2e/ del PC del autor): dotes-dnd5e.json, razas-dnd5e.json, objetos-dnd5e.json.
Llevan texto de Paizo (ORC u OGL, citado en cada objeto): no se suben al repositorio.
Uso: python convertir_dotes.py <carpeta Data de Foundry>
"""
import json, os, re, sys, hashlib, unicodedata, collections, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from leveldb import leer_pack
import convertir_conjuros as CC

VERSION = 1
DATA = sys.argv[1] if len(sys.argv) > 1 else os.environ.get('FOUNDRY_DATA', os.path.expandvars(r'%LOCALAPPDATA%\FoundryVTT\Data'))
PF = os.path.join(DATA, 'systems', 'pf2e', 'packs')
ES = os.path.join(DATA, 'modules', 'pf2e-es', 'translation', 'es', 'compendium')
DND = os.path.join(DATA, 'systems', 'dnd5e', 'packs')

def norm(s):
    s = unicodedata.normalize('NFKD', s or '').encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', ' ', s).strip()
def id16(*partes): return hashlib.sha256('|'.join(partes).encode()).hexdigest()[:16]
def docs(pack):
    out = []
    for k, v in leer_pack(os.path.join(PF, pack)).items():
        if k.startswith(b'!items!'): out.append(json.loads(v))
    return out
def trad(nombre):
    try: return json.load(open(os.path.join(ES, nombre), encoding='utf-8')).get('entries', {})
    except FileNotFoundError: return {}

# ---------- Lo que D&D ya tiene ----------
DND_FEATS = {norm(n) for n in '''Alert;Magic Initiate;Savage Attacker;Skilled;Ability Score Improvement;Actor;Athlete;Charger;Chef;Crossbow Expert;Crusher;
Defensive Duelist;Dual Wielder;Durable;Elemental Adept;Fey Touched;Grappler;Great Weapon Master;Heavily Armored;Heavy Armor Master;Inspiring Leader;
Keen Mind;Lightly Armored;Mage Slayer;Martial Weapon Training;Medium Armor Master;Moderately Armored;Mounted Combatant;Observant;Piercer;Poisoner;
Polearm Master;Resilient;Ritual Caster;Sentinel;Shadow Touched;Sharpshooter;Shield Master;Skill Expert;Skulker;Slasher;Speedy;Spell Sniper;Telekinetic;
Telepathic;War Caster;Weapon Master;Crafter;Healer;Lucky;Musician;Tavern Brawler;Tough;Archery;Defense;Great Weapon Fighting;Two-Weapon Fighting'''.replace('\n', '').split(';')}
# Mismo efecto con otro nombre en PF2e.
SINONIMO_DOTE = {'toughness': 'tough', 'fleet': 'speedy', 'incredible initiative': 'alert', 'armor proficiency': 'lightly armored',
                 'weapon proficiency': 'martial weapon training', 'canny acumen': 'resilient', 'battle medicine': 'healer',
                 'skill training': 'skilled', 'diehard': 'durable', 'ride': 'mounted combatant', 'improved unarmed strike': 'tavern brawler'}
DND_RAZAS = {norm(n) for n in ['Aasimar', 'Dragonborn', 'Dwarf', 'Elf', 'Gnome', 'Goliath', 'Halfling', 'Human', 'Orc', 'Tiefling']}
# Clases de PF2e con equivalente en D&D (las demás dependen de mecánicas que D&D no tiene: se omiten).
CLASE_DND = {'barbarian': 'barbarian', 'bard': 'bard', 'champion': 'paladin', 'cleric': 'cleric', 'druid': 'druid', 'fighter': 'fighter',
             'monk': 'monk', 'ranger': 'ranger', 'rogue': 'rogue', 'sorcerer': 'sorcerer', 'wizard': 'wizard', 'witch': 'warlock'}
CLASE_ES = {'barbarian': 'Bárbaro', 'bard': 'Bardo', 'paladin': 'Paladín', 'cleric': 'Clérigo', 'druid': 'Druida', 'fighter': 'Guerrero', 'monk': 'Monje',
            'ranger': 'Explorador', 'rogue': 'Pícaro', 'sorcerer': 'Hechicero', 'wizard': 'Mago', 'warlock': 'Brujo'}
def nombres_dnd(packs, tipos=None):
    s = set()
    for p in packs:
        carpeta = os.path.join(DND, p)
        if not os.path.isdir(carpeta): continue
        for k, v in leer_pack(carpeta).items():
            if not k.startswith(b'!items!'): continue
            d = json.loads(v)
            if tipos and d.get('type') not in tipos: continue
            s.add(norm(d['name'])); s.add(norm(re.sub(r'\s*\(.*\)$', '', d['name'])))
    return s

# ---------- Nivelar el texto a D&D ----------
PERICIA_EN = {'acrobatics': 'acr', 'arcana': 'arc', 'athletics': 'ath', 'deception': 'dec', 'diplomacy': 'per', 'intimidation': 'itm',
              'medicine': 'med', 'nature': 'nat', 'occultism': 'arc', 'performance': 'prf', 'religion': 'rel', 'society': 'his',
              'stealth': 'ste', 'survival': 'sur', 'thievery': 'slt', 'perception': 'prc', 'lore': 'his', 'crafting': 'crafting'}
NOMBRE_PERICIA = {'acr': 'Acrobacias', 'arc': 'Arcanos', 'ath': 'Atletismo', 'dec': 'Engaño', 'per': 'Persuasión', 'itm': 'Intimidación', 'med': 'Medicina',
                  'nat': 'Naturaleza', 'prf': 'Interpretación', 'rel': 'Religión', 'his': 'Historia', 'ste': 'Sigilo', 'sur': 'Supervivencia', 'slt': 'Juego de manos',
                  'prc': 'Percepción', 'crafting': 'herramientas de artesano'}
CAR_EN = {'strength': 'str', 'dexterity': 'dex', 'constitution': 'con', 'intelligence': 'int', 'wisdom': 'wis', 'charisma': 'cha'}
CAR_ES = {'str': 'Fuerza', 'dex': 'Destreza', 'con': 'Constitución', 'int': 'Inteligencia', 'wis': 'Sabiduría', 'cha': 'Carisma'}
RANGO = {'trained': 1, 'expert': 2, 'master': 3, 'legendary': 4}
TEXTO = [
    (r'\bSociedad\b', 'Historia'), (r'\bOcultismo\b', 'Arcanos'), (r'\bDiplomacia\b', 'Persuasión'), (r'\bLatrocinio\b', 'Juego de manos'),
    (r'\bArtesan[ií]a\b', 'herramientas de artesano'), (r'\bInterpretaci[oó]n\b', 'Interpretación'),
    (r'\btienes el rango entrenado en\b', 'eres competente en'), (r'\btienes el rango experto en\b', 'tienes pericia en'),
    (r'\btienes el rango maestro en\b', 'tienes pericia (nivel 7 o más) en'), (r'\btienes el rango legendario en\b', 'tienes pericia (nivel 15 o más) en'),
    (r'\bel rango maestro\b', 'pericia y nivel 7 o más'), (r'\bel rango legendario\b', 'pericia y nivel 15 o más'), (r'\bel rango experto\b', 'pericia'),
    (r'\best[aá]s entrenad[oa] en\b', 'eres competente en'), (r'\best[aá]s entrenad[oa]\b', 'eres competente'),
    (r'\b(?:el rango |rango )?entrenado en\b', 'competente en'), (r'\b(?:el rango |rango )?experto en\b', 'con pericia en'),
    (r'\b(?:el rango |rango )?maestro en\b', 'con pericia (nivel 7 o más) en'), (r'\b(?:el rango |rango )?legendario en\b', 'con pericia (nivel 15 o más) en'),
    (r'\bentrenado\b', 'competente'), (r'\bexperto\b', 'con pericia'),
    (r'(bonificador(?: [+-]?\d+)?) (?:por |de )?(?:circunstancia|estatus|objeto)', r'\1'), (r'(penalizador(?: [+-]?\d+)?) (?:por |de )?(?:circunstancia|estatus|objeto)', r'\1'),
    (r'(?:la acción )?Alzar un escudo', 'levantar el escudo (+2 a la CA hasta el inicio de tu próximo turno, además del bono normal del escudo)'),
    (r'en lugar de Avanzar', 'en lugar de moverte'), (r'\bAvanza dos veces\b', 'Te mueves hasta el doble de tu velocidad'), (r'\bAvanza\b', 'Te mueves'),
    (r'\bun Golpe\b', 'un ataque con arma'), (r'(?<!Puntos de )\bGolpes\b', 'ataques con arma'), (r'(?<!Puntos de )\bGolpe\b(?! sin armas)', 'ataque con arma'),
    (r'\b[Aa]vanzas? dos veces\b', 'te mueves hasta el doble de tu velocidad'), (r'\b[Aa]vanza(?:s|r)?\b', 'te mueves'), (r'\bZancada\b', 'movimiento'),
    (r'\b(?:dar )?un Paso\b', 'moverte 1,5 m sin provocar ataques de oportunidad'),
    (r'prueba plana(?: CD| de CD)? (\d+)', r'tirada de 1d20 sin modificadores (con \1 o más)'), (r'prueba plana', 'tirada de 1d20 sin modificadores'),
    (r'rango de conjuro', 'nivel de conjuro'), (r'Puntos? de [Ff]oco', 'uso que se recupera con un Descanso Corto'),
    (r'conjuros? de foco', 'conjuro de clase (un uso por Descanso Corto)'), (r'\bReserva de foco\b', 'usos por Descanso Corto'),
    (r'una vez (?:al|por) día', 'una vez por Descanso Largo'), (r'una vez por hora', 'una vez por Descanso Corto'),
    (r'una vez cada 10 minutos', 'una vez por Descanso Corto'), (r'una vez cada (\d+) minutos', 'una vez por Descanso Corto'),
    (r'\bMantener (?:un conjuro|el conjuro)?\b', 'mantener (con tu Acción adicional, como la Concentración)'),
    (r'CD de clase', 'CD de clase (8 + tu bono de competencia + el modificador de tu característica principal)'),

    (r'(?i)\btorpe (\d+)\b', 'con desventaja en pruebas, ataques y salvaciones de Destreza'), (r'(?i)\bdebilitad[oa] (\d+)\b', 'con desventaja en pruebas y ataques de Fuerza'),
    (r'(?i)\b(?:anonadad|estupidizad|aturdid)[oa] mental (\d+)\b', 'con desventaja en pruebas de Inteligencia, Sabiduría y Carisma'), (r'(?i)\banonadad[oa] (\d+)\b', 'con desventaja en pruebas de Inteligencia, Sabiduría y Carisma'),
    (r'(?i)\bindispuest[oa] (\d+)\b', 'Envenenado'), (r'(?i)\basustad[oa] (\d+)\b', 'Asustado'), (r'(?i)\blentificad[oa] (\d+)\b', 'Lento (pierde su Acción adicional)'),
    (r'(?i)\bacelerad[oa]\b', 'con una acción extra limitada (como Prisa)'), (r'(?i)\bfatigad[oa]\b', 'con 1 nivel de Agotamiento'),
    (r'(?i)\bdeslumbrad[oa]\b', 'Deslumbrado (desventaja en ataques y en Percepción con la vista)'), (r'(?i)\binmovilizad[oa]\b', 'con velocidad 0'),
    (r'(?i)\bdrenad[oa] (\d+)\b', r'con sus PG máximos reducidos en \1 por nivel'), (r'(?i)\baturdid[oa] (\d+)\b', 'Aturdido'),
    (r'\bReflejos\b', 'Destreza'), (r'\bFortaleza\b', 'Constitución'), (r'\bVoluntad\b', 'Sabiduría'),
    (r'<span class="action-glyph">[^<]*</span>', ''), (r'\s+\.', '.'),
]
def nivelar(t, nivel=1):
    if not t: return ''
    t = CC.limpiar_texto(t, {'rango': max(1, int(nivel or 1))})
    t = re.sub(r'@(?:Localize|Embed)\[[^\]]*\](?:\{[^}]*\})?', '', t)
    for a, b in TEXTO: t = re.sub(a, b, t)
    return t
def nota(extra=None, texto=''):
    l = ['Adaptada de PF2e y nivelada a D&amp;D por Ecos.',
         '«Éxito crítico» = superar la CD por 10 o más (o un 20 natural); «Fallo crítico» = fallar por 10 o más (o un 1 natural).',
         'En D&amp;D no hay penalizador por ataque múltiple: ignóralo si aparece.']
    if re.search(r'resistencia \d', texto): l.append('Resistencia N (de PF2e): resta N a ese daño; no lo divide a la mitad como la resistencia de D&amp;D.')
    if re.search(r'debilidad \d', texto): l.append('Debilidad N: suma N a ese daño.')
    if re.search(r'especializaci[oó]n cr[ií]tica', texto): l.append('Especialización crítica: al hacer un crítico con esa arma, aplicas también su maestría de arma de D&amp;D.')
    if extra: l += extra
    return '<p class="ecos-pf2e-nota"><em>' + ' '.join(l) + '</em></p>'

# ---------- Activación, frecuencia y requisitos ----------
def activacion(s):
    t = (s.get('actionType') or {}).get('value'); n = (s.get('actions') or {}).get('value')
    if t == 'passive' or not t: return None
    if t == 'reaction': return {'type': 'reaction', 'value': None, 'override': False}
    if t == 'free': return {'type': 'special', 'value': None, 'override': False, 'condition': 'Sin acción (una vez por turno)'}
    return {'type': 'bonus' if str(n) == '1' else 'action', 'value': None, 'override': False}
COSTE_ES = {'reaction': 'Reacción', 'special': 'Sin acción', 'bonus': 'Acción adicional', 'action': 'Acción'}
def usos(s):
    f = s.get('frequency') or {}
    if not f.get('max'): return None, ''
    per = str(f.get('per') or '')
    if per in ('day', 'P1D'): rec, txt = 'lr', 'por Descanso Largo'
    elif per.startswith('PT') or per in ('hour',): rec, txt = 'sr', 'por Descanso Corto'
    elif per in ('round', 'turn'): rec, txt = 'turnStart', 'por turno'
    else: rec, txt = 'lr', 'por Descanso Largo'
    return {'max': str(f['max']), 'spent': 0, 'recovery': [{'period': rec, 'type': 'recoverAll'}]}, f"{f['max']} {txt}"
def requisitos(prereq_en, prereq_es):
    req = {'pericias': [], 'car': {}, 'dotes': [], 'otros': []}
    textos = []
    for i, p in enumerate(prereq_en or []):
        en = str(p.get('value') or '').strip(); es = (prereq_es[i] if prereq_es and i < len(prereq_es) else None) or en
        if isinstance(es, dict): es = str(es.get('value') or en)
        m = re.fullmatch(r'(trained|expert|master|legendary) in (?:the )?([A-Za-z ]+?)(?: skill)?', en, re.I)
        if m:
            sk = PERICIA_EN.get(m.group(2).lower().split()[-1]) or ('his' if 'lore' in m.group(2).lower() else None)
            r = RANGO[m.group(1).lower()]
            if sk:
                req['pericias'].append({'skill': sk, 'rango': r})
                textos.append(f"{'competente en' if r == 1 else 'pericia en'} {NOMBRE_PERICIA.get(sk, sk)}{' (nivel 7 o más)' if r == 3 else ' (nivel 15 o más)' if r == 4 else ''}")
                continue
        m = re.fullmatch(r'(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma) \+?(\d)', en, re.I)
        if m:
            c = CAR_EN[m.group(1).lower()]; valor = 10 + 2 * int(m.group(2))
            req['car'][c] = valor; textos.append(f"{CAR_ES[c]} {valor} o más"); continue
        textos.append(nivelar(es)); req['otros'].append(en)
    return req, textos

# ---------- Dotes ----------
def dote(d, es, ya_dnd):
    s = d['system']; nombre = d['name']; n = norm(nombre); rasgos = set((s.get('traits') or {}).get('value') or [])
    cat = s.get('category')
    if cat not in ('general', 'skill', 'ancestry', 'class') or {'archetype', 'dedication', 'mythic'} & rasgos: return None, 'categoría'
    if n in DND_FEATS or SINONIMO_DOTE.get(n) or n in ya_dnd: return None, 'ya en D&D'
    clase = None
    if cat == 'class':
        clases = sorted({CLASE_DND[c] for c in rasgos if c in CLASE_DND})
        if not clases: return None, 'clase sin equivalente en D&D'
        clase = clases
    nivel = int((s.get('level') or {}).get('value') or 1)
    t = es.get(nombre) or {}
    act = activacion(s); u, txt_usos = usos(s)
    req, req_txt = requisitos((s.get('prerequisites') or {}).get('value'), t.get('prerequisites'))
    asc = sorted(r for r in rasgos if cat == 'ancestry' and r not in {'concentrate', 'manipulate', 'mental', 'visual', 'auditory', 'emotion', 'primal', 'occult', 'divine', 'arcane', 'lineage', 'move', 'fortune', 'misfortune', 'healing', 'general', 'skill', 'flourish', 'magical', 'linguistic', 'polymorph', 'morph', 'attack', 'downtime', 'exploration', 'secret', 'stance', 'press', 'open', 'uncommon', 'rare', 'unique'})
    cabecera = [f"<strong>Dote menor de nivel {nivel}</strong> · {({'general': 'General', 'skill': 'De habilidad', 'ancestry': 'De ascendencia', 'class': 'De clase'})[cat]}"]
    if clase: cabecera.append(' / '.join(CLASE_ES[c] for c in clase))
    if act: cabecera.append(COSTE_ES[act['type']])
    if txt_usos: cabecera.append(txt_usos)
    extra = []
    if 'flourish' in rasgos: extra.append('Floritura: solo una por turno.')
    if 'press' in rasgos: extra.append('Presión: solo si ya atacaste en este turno.')
    if 'stance' in rasgos: extra.append('Postura: solo una a la vez; dura hasta que la cambies o caigas Incapacitado.')
    if 'open' in rasgos: extra.append('Apertura: solo si todavía no atacaste en este turno.')
    html = (f"<p>{' · '.join(cabecera)}</p>" + (f"<p><strong>Requisitos:</strong> {'; '.join(req_txt)}</p>" if req_txt else '')
            + (cuerpo := nivelar(t.get('description') or (s.get('description') or {}).get('value'), nivel)) + nota(extra, cuerpo))
    acts = {}
    if act:
        aid = id16(d['_id'], 'act')
        acts[aid] = CC.actividad(aid, 'utility', activation=act, roll={'formula': '', 'name': '', 'prompt': False, 'visible': False},
                                 consumption={'targets': ([{'type': 'itemUses', 'target': '', 'value': '1', 'scaling': {'mode': '', 'formula': ''}}] if u else []), 'scaling': {'allowed': False, 'max': ''}, 'spellSlot': False})
    pub = s.get('publication') or {}
    item = {'_id': id16(d['_id'], 'dote'), 'name': t.get('name') or nombre, 'type': 'feat', 'img': d.get('img') or 'icons/svg/book.svg',
            'system': {'description': {'value': html, 'chat': ''}, 'requirements': '; '.join(req_txt)[:250],
                       'type': {'value': 'feat', 'subtype': 'general' if cat in ('general', 'skill') else ''},
                       'prerequisites': {'level': nivel, 'repeatable': False}, 'activities': acts, **({'uses': u} if u else {}),
                       'source': {'custom': f"PF2e · {pub.get('title') or ''}", 'license': pub.get('license') or ''}},
            'flags': {'ecos-frontera': {'pf2e': {'id': d['_id'], 'nombre': nombre, 'tipo': 'dote', 'categoria': cat, 'nivel': nivel, 'clase': clase,
                                                 'ascendencia': asc, 'req': req, 'rasgos': sorted(rasgos), 'rareza': (s.get('traits') or {}).get('rarity') or 'common',
                                                 'licencia': pub.get('license') or ''}}}}
    return item, None

# ---------- Razas y herencias ----------
TAMANO = {'tiny': 'tiny', 'sm': 'sm', 'med': 'med', 'lg': 'lg'}
def raza(a, es, rasgos_af, es_af):
    s = a['system']; nombre = a['name']
    if norm(nombre) in DND_RAZAS: return None
    t = es.get(nombre) or {}
    feats = []
    for ref in (s.get('items') or {}).values():
        f = rasgos_af.get(ref.get('uuid', '').split('.')[-1]) or next((x for x in rasgos_af.values() if x['name'] == ref.get('name')), None)
        if f: feats.append(f)
    vision = 'darkvision' in json.dumps(s.get('vision') or '') or any('darkvision' in norm(f['name']) for f in feats)
    lista = ''.join(f"<li><strong>{(es_af.get(f['name']) or {}).get('name') or f['name']}.</strong> {nivelar((es_af.get(f['name']) or {}).get('description') or (f['system'].get('description') or {}).get('value'))}</li>" for f in feats)
    vel = int(s.get('speed') or 25); vel = 30 if vel >= 25 else vel
    tam = TAMANO.get(s.get('size') or 'med', 'med')
    html = (nivelar(t.get('description') or (s.get('description') or {}).get('value'))
            + f"<h3>Rasgos de especie</h3><ul><li><strong>Tamaño.</strong> {({'tiny': 'Diminuto', 'sm': 'Pequeño', 'med': 'Mediano', 'lg': 'Grande'})[tam]}.</li><li><strong>Velocidad.</strong> {vel} pies.</li>"
            + (f"<li><strong>Visión en la oscuridad.</strong> 60 pies.</li>" if vision else '') + lista + '</ul>'
            + '<p><strong>Herencia:</strong> al nivel 1 eliges una herencia de esta especie (o una herencia versátil).</p>'
            + nota(['Las mejoras de característica de PF2e no se usan: en D&amp;D 2024 vienen del trasfondo. Los PG de ascendencia tampoco.']))
    pub = s.get('publication') or {}
    nombre_es = (t.get('name') or nombre); nombre_es = nombre_es[:1].upper() + nombre_es[1:]
    return {'_id': id16(a['_id'], 'raza'), 'name': nombre_es, 'type': 'race', 'img': a.get('img') or 'icons/svg/mystery-man.svg',
            'system': {'description': {'value': html, 'chat': ''}, 'identifier': CC.slug(nombre), 'movement': {'walk': vel, 'units': 'ft'},
                       'senses': {'darkvision': 60 if vision else None, 'units': 'ft'}, 'type': {'value': 'humanoid', 'subtype': ''},
                       'advancement': [{'_id': id16(a['_id'], 'tam'), 'type': 'Size', 'configuration': {'sizes': [tam]}, 'value': {}, 'title': ''}],
                       'source': {'custom': f"PF2e · {pub.get('title') or ''}", 'license': pub.get('license') or ''}},
            'flags': {'ecos-frontera': {'pf2e': {'id': a['_id'], 'nombre': nombre, 'tipo': 'raza', 'slug': CC.slug(nombre), 'rasgos': sorted((s.get('traits') or {}).get('value') or []),
                                                 'rareza': (s.get('traits') or {}).get('rarity') or 'common', 'licencia': pub.get('license') or ''}}}}
def herencia(h, es, slugs_raza):
    s = h['system']; nombre = h['name']; t = es.get(nombre) or {}
    anc = (s.get('ancestry') or {}) or {}
    asc_slug = anc.get('slug') or (CC.slug(anc.get('name')) if anc.get('name') else None)
    if asc_slug and norm(anc.get('name') or asc_slug) in DND_RAZAS: asc_dnd = True
    else: asc_dnd = False
    html = (f"<p><strong>Herencia</strong> · {('de ' + (anc.get('name') or asc_slug)) if asc_slug else 'versátil (cualquier especie)'}</p>"
            + nivelar(t.get('description') or (s.get('description') or {}).get('value')) + nota())
    pub = s.get('publication') or {}
    return {'_id': id16(h['_id'], 'herencia'), 'name': t.get('name') or nombre, 'type': 'feat', 'img': h.get('img') or 'icons/svg/book.svg',
            'system': {'description': {'value': html, 'chat': ''}, 'type': {'value': 'race', 'subtype': ''}, 'requirements': (anc.get('name') or 'Cualquier especie'),
                       'source': {'custom': f"PF2e · {pub.get('title') or ''}", 'license': pub.get('license') or ''}},
            'flags': {'ecos-frontera': {'pf2e': {'id': h['_id'], 'nombre': nombre, 'tipo': 'herencia', 'ascendencia': asc_slug, 'ascendenciaDnd': asc_dnd,
                                                 'versatil': not asc_slug, 'licencia': pub.get('license') or ''}}}}

# ---------- Objetos ----------
def precio(s):
    p = (s.get('price') or {}).get('value') or {}
    gp = (p.get('pp', 0) * 10) + p.get('gp', 0) + p.get('sp', 0) / 10 + p.get('cp', 0) / 100
    return {'value': round(gp * 10, 2), 'denomination': 'gp'}  # PF2e usa el patrón de plata: ×10 para la economía de D&D
def peso(s):
    b = (s.get('bulk') or {}).get('value')
    try: b = float(b)
    except (TypeError, ValueError): b = 0
    return {'value': 1 if 0 < b < 1 else round(b * 5, 1), 'units': 'lb'}
def rareza_nivel(n):
    n = int(n or 0)
    return '' if n <= 0 else 'uncommon' if n <= 4 else 'rare' if n <= 10 else 'veryRare' if n <= 16 else 'legendary'
DANO_ARMA = {'b': 'bludgeoning', 'p': 'piercing', 's': 'slashing', 'bludgeoning': 'bludgeoning', 'piercing': 'piercing', 'slashing': 'slashing'}
COND_DND = {'unconscious': 'unconscious', 'paralyzed': 'paralyzed', 'blinded': 'blinded', 'deafened': 'deafened', 'frightened': 'frightened',
            'stunned': 'stunned', 'sickened': 'poisoned', 'restrained': 'restrained', 'grabbed': 'grappled', 'prone': 'prone', 'fatigued': 'exhaustion',
            'petrified': 'petrified', 'fleeing': 'frightened'}
TIPO_DANO = {'poison': 'poison', 'acid': 'acid', 'fire': 'fire', 'cold': 'cold', 'electricity': 'lightning', 'sonic': 'thunder', 'mental': 'psychic',
             'void': 'necrotic', 'negative': 'necrotic', 'vitality': 'radiant', 'positive': 'radiant', 'force': 'force', 'spirit': 'force',
             'bludgeoning': 'bludgeoning', 'piercing': 'piercing', 'slashing': 'slashing', 'bleed': ''}
def duracion(txt):
    """«1 round», «1d4 hours», «6 days» → {'n': '1', 'u': 'round'}."""
    m = re.search(r'(\d+d\d+|\d+)\s*(round|minute|hour|day|week)s?', txt or '', re.I)
    return {'n': m.group(1), 'u': m.group(2).lower()} if m else None
def escalar_dados(f):
    """Los PG de PF2e son ~1,5 veces los de D&D al mismo nivel: los dados de daño de un veneno bajan a ~2/3."""
    m = re.fullmatch(r'(\d+)d(\d+)(?:\+(\d+))?', (f or '').replace(' ', ''))
    if not m: return f
    n = max(1, math.ceil(int(m.group(1)) * 0.65)); b = math.ceil(int(m.group(3)) * 0.65) if m.group(3) else 0
    return f"{n}d{m.group(2)}" + (f"+{b}" if b else '')
def veneno(t_en, nivel=1, html_es=''):
    """Datos de un veneno de PF2e por etapas, ya en D&D: CD, inicio, duración máxima y, por etapa, texto en español, intervalo, daño (escalado) y estados de D&D."""
    t = re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', t_en or ''))
    cd = re.search(r'Saving Throw\s*(?:\[\[[^\]]*\]\]|@Check\[[^\]]*\])?[^D]*DC\s*(\d+)|DC\s*(\d+)\s*Fortitude|dc:(\d+)', t)
    cdv = next((int(g) for g in (cd.groups() if cd else []) if g), None)
    inicio = re.search(r'Onset\s*(.+?)(?=Maximum Duration|Stage \d|;|$)', t); maxd = re.search(r'Maximum Duration\s*(.+?)(?=Stage \d|;|$)', t)
    es = re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', html_es or ''))
    es_etapas = dict(re.findall(r'Etapa\s*(\d+)\s*(.+?)(?=Etapa\s*\d|Adaptada de PF2e|$)', es))
    etapas = []
    for n, x in re.findall(r'Stage\s*(\d+)\s*(.+?)(?=Stage\s*\d|$)', t):
        dano = [{'orig': f.replace(' ', ''), 'f': escalar_dados(f), 't': TIPO_DANO.get(tp.lower(), '')}
                for f, tp in re.findall(r'@Damage\[\(?([0-9d+ ]+?)\)?\[(?:persistent,)?(\w+)', x)]
        dano += [{'orig': f.replace(' ', ''), 'f': escalar_dados(f), 't': TIPO_DANO.get(tp.lower(), '')}
                 for f, tp in re.findall(r'(?<![\[\w])(\d+d\d+(?:\s*\+\s*\d+)?)\s+(?:persistent\s+)?(\w+)\s+damage', x) if tp.lower() in TIPO_DANO]
        nombres = re.findall(r'\{(\w+)(?:\s+\d+)?\}', x) + re.findall(r'\b(unconscious|paralyzed|blinded|deafened|frightened|stunned|sickened|restrained|grabbed|prone|fatigued|petrified|fleeing)\b', x, re.I)
        estados = sorted({COND_DND[c.lower()] for c in nombres if c.lower() in COND_DND})
        fin = re.search(r'\(([^()]*(?:\([^()]*\)[^()]*)*)\)\s*$', x.strip())
        texto = (es_etapas.get(n) or nivelar(x.strip(), nivel)).strip()
        for o in dano: texto = texto.replace(o['orig'], o['f'], 1)
        etapas.append({'n': int(n), 'texto': texto[:400], 'dur': duracion(fin.group(1)) if fin else None,
                       'dano': [{'f': o['f'], 't': o['t'], 'orig': o['orig']} for o in dano], 'estados': estados})
    return {'cdPf2e': cdv, 'cd': cd_dnd(nivel) if cdv else None, 'inicio': duracion(inicio.group(1)) if inicio else None,
            'duracionMax': duracion(maxd.group(1)) if maxd else None, 'etapas': etapas}
def cd_dnd(nivel):
    """CD de D&D para un objeto de PF2e de ese nivel: 11 + la mitad del nivel (12 a nivel 1-2, 15 a nivel 7, 21 a nivel 20)."""
    return 11 + -(-max(1, int(nivel or 1)) // 2)
def objeto(e, es, ya_dnd):
    s = e['system']; nombre = e['name']; n = norm(nombre); tipo = e['type']
    if n in ya_dnd or norm(re.sub(r'\s*\(.*\)$', '', nombre)) in ya_dnd: return None, 'ya en D&D'
    t = es.get(nombre) or {}
    rasgos = set((s.get('traits') or {}).get('value') or [])
    nivel = int((s.get('level') or {}).get('value') or 0)
    pub = s.get('publication') or {}
    desc_en = (s.get('description') or {}).get('value') or ''
    html = nivelar(t.get('description') or desc_en, max(1, nivel))
    if tipo == 'consumable': html = re.sub(r'\bCD (\d+)\b', lambda m: f"CD {cd_dnd(nivel)}", html)
    sist = {'description': {'value': '', 'chat': ''}, 'price': precio(s), 'weight': peso(s), 'quantity': int(s.get('quantity') or 1),
            'rarity': rareza_nivel(nivel) if ({'magical', 'alchemical', 'invested'} & rasgos) else '', 'source': {'custom': f"PF2e · {pub.get('title') or ''}", 'license': pub.get('license') or ''}}
    flags = {'id': e['_id'], 'nombre': nombre, 'tipo': 'objeto', 'nivel': nivel, 'rasgos': sorted(rasgos), 'licencia': pub.get('license') or ''}
    extra = []
    if tipo == 'weapon':
        dmg = s.get('damage') or {}
        den = int(str(dmg.get('die') or 'd6').lstrip('d') or 6)
        props = set()
        if 'agile' in rasgos: props.add('lgt')
        if 'finesse' in rasgos: props.add('fin')
        if 'reach' in rasgos: props.add('rch')
        if any(r.startswith('thrown') for r in rasgos): props.add('thr')
        if any(r.startswith('two-hand') for r in rasgos) or (s.get('usage') or {}).get('value') == 'held-in-two-hands': props.add('two')
        dos = next((r for r in rasgos if r.startswith('two-hand-d')), None)
        if dos and (s.get('usage') or {}).get('value') != 'held-in-two-hands': props.discard('two'); props.add('ver')
        rng = s.get('range') or None
        cat = (s.get('category') or 'simple')
        tipo_arma = ('simple' if cat == 'simple' else 'martial') + ('R' if rng else 'M')
        maestria = 'topple' if 'trip' in rasgos else 'push' if 'shove' in rasgos else 'cleave' if 'sweep' in rasgos else 'nick' if 'agile' in rasgos else 'vex' if any(r.startswith('deadly') or r.startswith('fatal') for r in rasgos) else ''
        sist.update({'type': {'value': tipo_arma, 'baseItem': ''}, 'properties': sorted(props), 'mastery': maestria,
                     'damage': {'base': {'number': int(dmg.get('dice') or 1), 'denomination': den, 'bonus': '', 'types': [DANO_ARMA.get(dmg.get('damageType'), 'bludgeoning')],
                                         'custom': {'enabled': False, 'formula': ''}, 'scaling': {'mode': '', 'number': None, 'formula': ''}}},
                     'range': {'value': int(rng) if rng else None, 'long': int(rng) * 4 if rng else None, 'reach': 10 if 'rch' in props else None, 'units': 'ft'}})
        if dos and 'ver' in props: sist['damage']['versatile'] = {'number': 1, 'denomination': int(dos.split('-d')[-1]), 'bonus': '', 'types': [], 'custom': {'enabled': False, 'formula': ''}, 'scaling': {'mode': '', 'number': None, 'formula': ''}}
        if cat == 'advanced': extra.append('Arma avanzada de PF2e: en D&amp;D es marcial y pide el permiso del DM.')
        item_tipo = 'weapon'
    elif tipo in ('armor', 'shield'):
        if tipo == 'shield':
            sist.update({'type': {'value': 'shield', 'baseItem': ''}, 'armor': {'value': 1 if 'buckler' in n else 2, 'dex': None}})
        else:
            catA = s.get('category') or 'light'; bono = int(s.get('acBonus') or 0); cap = s.get('dexCap')
            base = 10 + bono + (1 if catA == 'light' and bono == 0 else 0) if catA != 'heavy' else 12 + bono
            sist.update({'type': {'value': catA if catA in ('light', 'medium', 'heavy') else 'clothing', 'baseItem': ''},
                         'armor': {'value': base, 'dex': None if catA == 'light' else (0 if catA == 'heavy' else min(2, int(cap if cap is not None else 2)))},
                         'strength': (10 + 2 * int(s.get('strength'))) if s.get('strength') else None,
                         'properties': ['stealthDisadvantage'] if (int(s.get('checkPenalty') or 0) <= -2 or 'noisy' in rasgos) else []})
        item_tipo = 'equipment'
    elif tipo == 'consumable':
        sub = 'poison' if 'poison' in rasgos else 'potion' if ({'potion', 'elixir', 'oil', 'mutagen'} & rasgos) else 'scroll' if 'scroll' in rasgos else 'ammo' if 'ammunition' in rasgos else 'food' if 'drug' in rasgos else 'trinket'
        ven = None
        if sub == 'poison':
            ven = veneno(desc_en, nivel, html)
            for e_ in ven['etapas']:
                for o in e_['dano']: html = html.replace(o['orig'], o['f'], 1)
                for o in e_['dano']: o.pop('orig', None)
            via = 'contact' if 'contact' in rasgos else 'ingested' if 'ingested' in rasgos else 'inhaled' if 'inhaled' in rasgos else 'injury'
            sist['type'] = {'value': 'poison', 'subtype': via}
            flags['veneno'] = ven
            extra.append(f"Veneno por etapas (PF2e){f': salvación de Constitución CD {ven['cd']}' if ven and ven.get('cd') else ''}. Al final de cada intervalo se repite la salvación: si falla sube de etapa, si la supera baja (con 0 se cura). Los dados de daño ya están nivelados a D&amp;D. Ver «18 · Fabricación y venenos» en las reglas de la casa.")
        else:
            sist['type'] = {'value': sub, 'subtype': ''}
        sist['uses'] = {'max': '1', 'spent': 0, 'autoDestroy': True, 'recovery': []}
        # Curación: si el texto de PF2e trae una fórmula de curación, una actividad de curar que la tira.
        cura = re.search(r'@Damage\[\(?([0-9d+\- ]+?)\)?\[healing\]\]', desc_en)
        if cura:
            aid = id16(e['_id'], 'cura')
            sist['activities'] = {aid: CC.actividad(aid, 'heal', activation={'type': 'action', 'value': 1, 'override': False},
                consumption={'targets': [{'type': 'itemUses', 'target': '', 'value': '1', 'scaling': {'mode': '', 'formula': ''}}], 'scaling': {'allowed': False, 'max': ''}, 'spellSlot': False},
                healing={'number': None, 'denomination': None, 'bonus': '', 'types': ['healing'], 'custom': {'enabled': True, 'formula': cura.group(1).replace(' ', '')}, 'scaling': {'mode': '', 'number': None, 'formula': ''}})}
        item_tipo = 'consumable'
    elif tipo == 'treasure':
        sist['type'] = {'value': 'gem' if 'gem' in n else 'art'}; item_tipo = 'loot'
    elif tipo in ('backpack', 'kit'):
        item_tipo = 'container'; sist.pop('rarity', None)
    else:
        sist['type'] = {'value': 'trinket', 'baseItem': ''}
        if 'invested' in rasgos: sist['attunement'] = 'required'; extra.append('En PF2e se «invierte»: en D&amp;D requiere sintonía.')
        item_tipo = 'equipment'
    RAS = {'alchemical': 'alquímico', 'magical': 'mágico', 'poison': 'veneno', 'elixir': 'elixir', 'bomb': 'bomba', 'potion': 'poción', 'talisman': 'talismán', 'consumable': 'consumible', 'snare': 'trampa', 'mutagen': 'mutágeno', 'drug': 'droga', 'oil': 'aceite', 'scroll': 'pergamino', 'invested': 'sintonía'}
    etiquetas = ', '.join(RAS[r] for r in sorted(rasgos & set(RAS)))
    sist['description']['value'] = (f"<p><strong>Objeto de nivel {nivel}</strong>{' · ' + etiquetas if etiquetas else ''}</p>"
                                    + html + nota(extra, html))
    grupo = ('Venenos' if 'poison' in rasgos else 'Alquímicos' if 'alchemical' in rasgos else 'Pociones y elixires' if item_tipo == 'consumable' and sist.get('type', {}).get('value') == 'potion'
             else 'Consumibles' if item_tipo == 'consumable' else 'Armas' if item_tipo == 'weapon' else 'Armaduras y escudos' if tipo in ('armor', 'shield')
             else 'Tesoros' if item_tipo == 'loot' else 'Contenedores' if item_tipo == 'container' else 'Equipo y objetos mágicos')
    flags['grupo'] = grupo
    return {'_id': id16(e['_id'], 'objeto'), 'name': t.get('name') or nombre, 'type': item_tipo, 'img': e.get('img') or 'icons/svg/item-bag.svg',
            'system': sist, 'flags': {'ecos-frontera': {'pf2e': flags}}}, None

def main():
    motivos = collections.Counter()
    ya_dotes = nombres_dnd(['feats24', 'origins24', 'races', 'classfeatures', 'classes24'], {'feat'})
    ya_obj = nombres_dnd(['items', 'equipment24', 'tradegoods'])
    es_f = trad('pf2e.feats-srd.json'); es_e = trad('pf2e.equipment-srd.json'); es_a = trad('pf2e.ancestries.json')
    es_h = trad('pf2e.heritages.json'); es_af = trad('pf2e.ancestryfeatures.json')
    dotes = []
    for d in docs('feats'):
        it, m = dote(d, es_f, ya_dotes)
        if it: dotes.append(it)
        else: motivos['dote: ' + m] += 1
    af = {x['_id']: x for x in docs('ancestry-features')}
    razas = [r for r in (raza(a, es_a, af, es_af) for a in docs('ancestries')) if r]
    herencias = [herencia(h, es_h, set()) for h in docs('heritages')]
    objetos = []
    for e in docs('equipment'):
        it, m = objeto(e, es_e, ya_obj)
        if it: objetos.append(it)
        else: motivos['objeto: ' + m] += 1
    def guardar(nombre, clave, lista):
        h = hashlib.sha256(json.dumps(lista, sort_keys=True, ensure_ascii=False).encode()).hexdigest()[:16]
        json.dump({'version': VERSION, 'huella': h, 'total': len(lista), clave: lista}, open(nombre, 'w', encoding='utf-8'), ensure_ascii=False)
        return h
    guardar('dotes-dnd5e.json', 'dotes', dotes)
    guardar('razas-dnd5e.json', 'razas', razas + herencias)
    guardar('objetos-dnd5e.json', 'objetos', objetos)
    c = collections.Counter(x['flags']['ecos-frontera']['pf2e']['categoria'] for x in dotes)
    print(f"dotes {len(dotes)} {dict(c)} · razas {len(razas)} · herencias {len(herencias)} · objetos {len(objetos)} {dict(collections.Counter(x['flags']['ecos-frontera']['pf2e']['grupo'] for x in objetos))}")
    print('omitidos', dict(motivos))

if __name__ == '__main__':
    main()
