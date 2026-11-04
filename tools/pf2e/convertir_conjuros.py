"""4.2d: convierte los hechizos únicos de PF2e (filtro-pf2e.json) en conjuros de dnd5e 6 con actividades.

Lee, en la carpeta donde se ejecuta (Data/ecos-pf2e/ del PC del autor):
  hechizos-pf2e.json   la exportación de 4.2a
  filtro-pf2e.json     el filtro de 4.2b
y, si se le pasa la carpeta del compendio de hechizos de PF2e, toma de ahí el icono de cada uno.

Escribe conjuros-dnd5e.json: los conjuros listos para el compendio del mundo `world.ecos-conjuros-pf2e`
y las listas de clase. Ese archivo lleva texto de Paizo (ORC u OGL, citado en cada conjuro): queda en el PC
del autor y en su mundo, nunca en el repositorio.

Reglas: docs/CONVERSION_PF2E.md (4.2c). Uso: python convertir_conjuros.py [carpeta del pack de hechizos de PF2e]
"""
import json, math, re, sys, hashlib

VERSION = 1

# ---------- Tablas de 4.2c ----------
def nivel_de(h):
    if h.get('truco'): return 0
    r = int(h.get('rango') or 1)
    return {1: 1, 2: 1, 3: 2, 4: 2, 5: 3, 6: 3, 7: 4, 8: 4, 9: 5, 10: 6}.get(r, 6)

SALV = {'fortitude': 'con', 'reflex': 'dex', 'will': 'wis'}
SALV_ES = {'fortitude': 'Constitución', 'reflex': 'Destreza', 'will': 'Sabiduría'}
DANO = {'acid': 'acid', 'bludgeoning': 'bludgeoning', 'piercing': 'piercing', 'slashing': 'slashing', 'cold': 'cold',
        'fire': 'fire', 'electricity': 'lightning', 'sonic': 'thunder', 'vitality': 'radiant', 'positive': 'radiant',
        'void': 'necrotic', 'negative': 'necrotic', 'spirit': 'force', 'force': 'force', 'mental': 'psychic',
        'poison': 'poison', 'bleed': 'necrotic', 'untyped': 'force', 'precision': 'force', 'chaotic': 'force',
        'evil': 'necrotic', 'good': 'radiant', 'lawful': 'force'}
DANO_ES = {'acid': 'de ácido', 'bludgeoning': 'contundente', 'piercing': 'perforante', 'slashing': 'cortante', 'cold': 'de frío',
           'fire': 'de fuego', 'lightning': 'de relámpago', 'thunder': 'de trueno', 'radiant': 'radiante', 'necrotic': 'necrótico',
           'force': 'de fuerza', 'psychic': 'psíquico', 'poison': 'de veneno'}
# Tipos de daño de PF2e escritos en el texto, a los de dnd5e.
DANO_TEXTO = [(r'daño mental', 'daño psíquico'), (r'daño (?:de |por )?espíritu(?:al)?', 'daño de fuerza'), (r'daño (?:de |por )?vitalidad', 'daño radiante'),
              (r'daño (?:de |por )?vacío', 'daño necrótico'), (r'daño sónico', 'daño de trueno'), (r'daño (?:de |por )?electricidad', 'daño de relámpago'),
              (r'daño (?:de |por )?sangrado', 'daño necrótico')]
PERICIA = {'athletics': 'Atletismo', 'acrobatics': 'Acrobacias', 'stealth': 'Sigilo', 'perception': 'Percepción',
           'deception': 'Engaño', 'diplomacy': 'Persuasión', 'intimidation': 'Intimidación', 'medicine': 'Medicina',
           'nature': 'Naturaleza', 'occultism': 'Arcanos', 'arcana': 'Arcanos', 'religion': 'Religión', 'society': 'Historia',
           'survival': 'Supervivencia', 'thievery': 'Juego de manos', 'performance': 'Interpretación', 'crafting': 'herramientas de artesano'}
ACCION_ES = {'track': 'Rastrear', 'climb': 'Trepar', 'swim': 'Nadar', 'disarm': 'Desarmar', 'grapple': 'Presa',
             'reposition': 'Empujón: apartar', 'shove': 'Empujón: apartar', 'trip': 'Zancadilla', 'escape': 'Escapar',
             'seek': 'Buscar', 'hide': 'Esconderse', 'sneak': 'moverse con Sigilo', 'demoralize': 'Intimidar',
             'feint': 'Fintar', 'create-a-diversion': 'Distraer', 'recall-knowledge': 'Estudiar', 'high-jump': 'Saltar',
             'long-jump': 'Saltar', 'force-open': 'Escapar o forzar', 'treat-wounds': 'Medicina', 'administer-first-aid': 'Medicina',
             'sense-motive': 'Perspicacia', 'balance': 'Acrobacias', 'tumble-through': 'Voltereta', 'steal': 'Birlar'}
CLASES = {'arcane': ['wizard', 'sorcerer'], 'occult': ['bard', 'warlock'], 'divine': ['cleric', 'paladin'], 'primal': ['druid', 'ranger']}
# Escuelas: las tradiciones viejas de PF2e traen la escuela como rasgo; el Remaster no. Entonces se deduce de los rasgos.
ESCUELA_RASGO = {'abjuration': 'abj', 'conjuration': 'con', 'divination': 'div', 'enchantment': 'enc', 'evocation': 'evo',
                 'illusion': 'ill', 'necromancy': 'nec', 'transmutation': 'trs'}
ESCUELA_PISTA = [('ill', {'illusion', 'visual', 'shadow', 'auditory'}), ('enc', {'mental', 'emotion', 'incapacitation', 'fear', 'linguistic'}),
                 ('con', {'teleportation', 'summon', 'conjuration', 'extradimensional'}), ('trs', {'polymorph', 'morph', 'transmutation'}),
                 ('div', {'detection', 'revelation', 'scrying', 'prediction', 'divination'}), ('nec', {'death', 'void', 'curse'}),
                 ('abj', {'healing', 'vitality', 'abjuration'})]

def escuela(h, dano):
    r = set(h.get('rasgos') or [])
    for k, v in ESCUELA_RASGO.items():
        if k in r: return v
    for e, pistas in ESCUELA_PISTA:
        if r & pistas: return e
    return 'evo' if dano else 'trs'

def activacion(h):
    a = str(h.get('acciones') or '').strip()
    if a == '1': return {'type': 'bonus', 'value': None, 'condition': ''}
    if a in ('2', '3', '1 to 3', '2 or 3', '1 or 2', '2 to 3') or 'round' in a: return {'type': 'action', 'value': None, 'condition': ''}
    if a == 'reaction': return {'type': 'reaction', 'value': None, 'condition': desencadenante(h.get('textoEs') or '')}
    if a == 'free': return {'type': 'special', 'value': None, 'condition': ''}
    m = re.match(r'(\d+)\s*(minute|hour|day|week)s?', a)
    if m:
        n, u = int(m.group(1)), m.group(2)
        if u == 'week': n, u = n * 7, 'day'
        return {'type': u, 'value': n, 'condition': ''}
    return {'type': 'action', 'value': None, 'condition': ''}

def desencadenante(t):
    m = re.match(r'\s*Desencadenante\s+(.+?\.)(\s|$)', t)
    return m.group(1).strip() if m else ''

ESPECIAL = {'varies': 'varía', 'see text': 'ver la descripción', 'see description': 'ver la descripción', 'planetary': 'planetario',
            'interplanar': 'entre planos', 'unlimited': 'ilimitado', 'your speed': 'tu velocidad', 'centered on you': 'centrado en ti',
            'the triggering creature': 'la criatura que lo desencadena', 'your companion or eidolon': 'tu compañero', 'your companion': 'tu compañero',
            'your familiar': 'tu familiar', 'your eidolon': 'tu compañero', '1 animal': '1 animal', '1 corporeal creature': '1 criatura corpórea',
            'you and up to 5 willing creatures': 'tú y hasta 5 criaturas voluntarias', 'you and up to 6 willing creatures': 'tú y hasta 6 criaturas voluntarias',
            '1 dead creature': '1 criatura muerta', '1 or more creatures': '1 o más criaturas', 'self': 'tú', '1 or 2 creatures': '1 o 2 criaturas',
            'you and 1 willing creature': 'tú y 1 criatura voluntaria', '1 living or undead creature': '1 criatura viva o no muerta',
            '1 willing living creature': '1 criatura viva voluntaria', 'the triggering spell': 'el conjuro que lo desencadena', '1 dying creature': '1 criatura moribunda',
            'any number of creatures': 'cualquier número de criaturas', 'you or 1 ally': 'tú o 1 aliado', '1 weapon': '1 arma', '1 or 2 willing creatures': '1 o 2 criaturas voluntarias',
            'up to 1 minute': 'hasta 1 minuto', 'up to 10 minutes': 'hasta 10 minutos', 'up to 1 hour': 'hasta 1 hora', 'up to 8 hours': 'hasta 8 horas',
            'up to 24 hours': 'hasta 24 horas', 'until the end of your turn': 'hasta el final de tu turno', 'instantaneous': 'instantánea',
            '1 or more rounds': '1 o más asaltos', '1 or more rounds (see below)': '1 o más asaltos (ver la descripción)', 'you and all secondary casters': 'tú y los lanzadores secundarios',
            'yourself and the secondary casters': 'tú y los lanzadores secundarios', 'you and 1 other humanoid': 'tú y otro humanoide'}
def especial(t):
    t = str(t or '').strip()
    return ESPECIAL.get(t.lower(), 'ver la descripción') if t else ''

def alcance(h):
    a = str(h.get('alcance') or '').strip().lower().replace(',', '')
    if not a: return {'value': '', 'units': 'self' if h.get('area') else '', 'special': ''}
    if a == 'touch': return {'value': '', 'units': 'touch', 'special': ''}
    m = re.match(r'(\d+)\s*(feet|foot|ft|miles?)?$', a) or re.match(r'(\d+)\s*(feet|foot|miles?)', a)
    if m: return {'value': m.group(1), 'units': 'mi' if (m.group(2) or '').startswith('mile') else 'ft', 'special': ''}
    return {'value': '', 'units': 'spec', 'special': especial(h.get('alcance'))}

def duracion(h):
    d = str(h.get('duracion') or '').strip().lower()
    if not d: return {'value': '', 'units': 'inst'}
    m = re.match(r'(?:sustained up to )?(\d+)\s*(round|minute|hour|day|week|month|year)s?', d)
    if m:
        n, u = m.group(1), m.group(2)
        if u == 'week': n, u = str(int(n) * 7), 'day'
        return {'value': n, 'units': u}
    if 'end of your next turn' in d or 'start of your next turn' in d: return {'value': '1', 'units': 'turn'}
    if 'unlimited' in d or 'permanent' in d: return {'value': '', 'units': 'perm'}
    if 'daily preparations' in d: return {'value': '1', 'units': 'day'}
    if d == 'instantaneous': return {'value': '', 'units': 'inst'}
    return {'value': '', 'units': 'spec', 'special': especial(h.get('duracion'))}

AREA = {'burst': 'sphere', 'emanation': 'radius', 'cone': 'cone', 'line': 'line', 'cylinder': 'cylinder', 'square': 'square', 'cube': 'cube'}
def plantilla(h):
    a = h.get('area') or {}
    t = AREA.get(a.get('type'))
    if not t: return {'units': '', 'contiguous': False, 'type': ''}
    p = {'units': 'ft', 'contiguous': False, 'type': t, 'size': str(a.get('value') or 5), 'count': ''}
    if t == 'line': p['width'] = '5'
    if t == 'cylinder': p['height'] = str(a.get('value') or 5)
    return p

def objetivo(h):
    o = str(h.get('objetivo') or '').strip().lower()
    if not o: return {'choice': False, 'count': '', 'type': 'creature' if h.get('area') else '', 'special': ''}
    m = re.match(r'(?:up to )?(\d+|one|two|three|four|five)\s+(willing |living |)?(creatures?|objects?|allies|ally|enemies|enemy|corpses?)', o)
    nums = {'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5'}
    if m:
        tipo = 'object' if m.group(3).startswith('object') else 'ally' if m.group(3).startswith('all') else 'enemy' if m.group(3).startswith('enem') else 'creature'
        return {'choice': o.startswith('up to'), 'count': nums.get(m.group(1), m.group(1)), 'type': tipo, 'special': ''}
    if 'creature or object' in o: return {'choice': False, 'count': '1', 'type': 'creatureOrObject', 'special': ''}
    return {'choice': False, 'count': '', 'type': '', 'special': especial(h.get('objetivo'))}

# ---------- Daño, curación e intensificación ----------
def dados(formula):
    m = re.fullmatch(r'\s*(\d+)d(\d+)\s*(?:([+-])\s*(\d+))?\s*', formula or '')
    if not m: return None
    return int(m.group(1)), int(m.group(2)), (f"{m.group(3)}{m.group(4)}" if m.group(3) else '')

def escalado(h, clave):
    """Escalado por nivel de espacio (4.2c): 2 rangos de PF2e = 1 nivel. Intensificado (+1): el doble por nivel;
    (+2): el mismo; (+3) o (+4): cada dos niveles. En los trucos, igual por cada salto de nivel de dnd5e (5, 11 y 17)."""
    i = h.get('intensificar') or {}
    if i.get('type') != 'interval': return {'mode': '', 'number': None, 'formula': ''}
    inc = dados((i.get('damage') or {}).get(clave, ''))
    if not inc: return {'mode': '', 'number': None, 'formula': ''}
    n, paso = inc[0], int(i.get('interval') or 1)
    if paso == 1: return {'mode': 'whole', 'number': n * 2, 'formula': ''}
    if paso == 2: return {'mode': 'whole', 'number': n, 'formula': ''}
    return {'mode': 'half', 'number': n, 'formula': ''}

def partes(h):
    dano, cura = [], []
    for clave, d in (h.get('dano') or {}).items():
        if d.get('category') == 'persistent': continue  # va en el texto: no es un daño de un golpe
        f = str(d.get('formula') or '')
        tipo = DANO.get(d.get('type') or 'untyped', 'force')
        kinds = d.get('kinds') or ['damage']
        dd = dados(f)
        base = {'number': dd[0], 'denomination': dd[1], 'bonus': dd[2], 'custom': {'enabled': False, 'formula': ''}} if dd else \
               {'number': None, 'denomination': None, 'bonus': '', 'custom': {'enabled': True, 'formula': limpiar_formula(f, h)}}
        if not dd and base['custom']['formula'] in ('', '0'): continue
        parte = {**base, 'types': ['healing'] if 'healing' in kinds and 'damage' not in kinds else [tipo], 'scaling': escalado(h, clave)}
        (cura if 'healing' in kinds and 'damage' not in kinds else dano).append(parte)
    return dano, cura

def limpiar_formula(f, h):
    r = str(h.get('rango') or 1)
    f = f.replace('@item.rank', r).replace('@item.level', r).replace('@actor.level', '@details.level')
    return evaluar_numeros(f)

def evaluar_numeros(f):
    """Resuelve las partes puramente numéricas: «(ceil(3 / 2))d4» → «2d4»."""
    seguro = {'ceil': math.ceil, 'floor': math.floor, 'max': max, 'min': min, 'abs': abs}
    patron = re.compile(r'(ceil|floor|max|min|abs)?\(([^()d@]*)\)')
    def resolver(m):
        fn, dentro = m.group(1) or '', m.group(2)
        if not re.fullmatch(r'[\d\s+\-*/.,]*', dentro) or (',' in dentro and fn not in ('max', 'min')): return m.group(0)
        try: return str(int(eval(f"{fn}({dentro})", {'__builtins__': {}}, seguro)))
        except Exception: return m.group(0)
    for _ in range(10):
        nuevo = patron.sub(resolver, f)
        if nuevo == f: break
        f = nuevo
    return re.sub(r'\s+', ' ', f).strip()

# ---------- Texto ----------
def bloque(t, i):
    """Desde t[i] == '[', devuelve el índice tras el corchete que lo cierra."""
    prof = 0
    for j in range(i, len(t)):
        if t[j] == '[': prof += 1
        elif t[j] == ']':
            prof -= 1
            if prof == 0: return j + 1
    return len(t)

def etiqueta(t, j):
    if j < len(t) and t[j] == '{':
        k = t.find('}', j)
        if k > 0: return t[j + 1:k], k + 1
    return None, j

def pies(n):
    m = round(int(n) * 0.3, 1)
    return f"{n} pies ({str(m).rstrip('0').rstrip('.').replace('.', ',')} m)"

def texto_dano(inner, h):
    tipos = re.findall(r'\[([a-z,]+)\]', inner)
    formula = re.sub(r'\[[a-z,]+\]', '', inner)
    formula = limpiar_formula(formula, h).strip('() ')
    palabras = []
    for grupo in tipos:
        for t in grupo.split(','):
            if t == 'persistent': palabras.append('persistente')
            elif t in ('healing',): palabras.append('de curación')
            elif t in DANO: palabras.append(DANO_ES[DANO[t]])
    if 'de curación' in palabras: return f"{formula} PG de curación"
    return re.sub(r'\s+', ' ', f"{formula} de daño {' '.join(palabras)}").strip()

def texto_check(inner):
    partes_ = inner.split('|')
    tipo = partes_[0].replace('type:', '')
    dc = next((p.split(':')[1] for p in partes_ if p.startswith('dc:')), None)
    basica = any(p == 'basic' for p in partes_)
    if tipo in SALV_ES: s = f"salvación de {SALV_ES[tipo]}"
    elif tipo == 'flat': s = "prueba plana (un d20 sin bonos)"
    else: s = f"prueba de {PERICIA.get(tipo, tipo)}"
    if dc and dc.isdigit(): s += f" CD {dc}"
    if basica: s += " (la mitad si la supera)"
    return s

def texto_plantilla(inner):
    tipo = re.search(r'(?:type:)?(burst|emanation|cone|line|cylinder|square|cube)', inner)
    dist = re.search(r'distance:(\d+)', inner)
    nombre = {'burst': 'explosión', 'emanation': 'emanación', 'cone': 'cono', 'line': 'línea', 'cylinder': 'cilindro', 'square': 'cuadrado', 'cube': 'cubo'}
    if not tipo: return 'el área'
    return f"{nombre[tipo.group(1)]} de {pies(dist.group(1))}" if dist else nombre[tipo.group(1)]

def limpiar_texto(t, h):
    out, i = [], 0
    while i < len(t):
        m = re.compile(r'@(UUID|Damage|Check|Template|Embed|Localize)\[').match(t, i)
        if m:
            fin = bloque(t, m.end() - 1)
            inner = t[m.end():fin - 1]
            lab, fin2 = etiqueta(t, fin)
            tipo = m.group(1)
            if tipo == 'UUID': out.append(lab or inner.split('.')[-1])
            elif tipo == 'Damage':
                out.append(lab or texto_dano(inner, h))
                m2 = re.compile(r' de daño(?: por| de)?(?= [a-záéíóú]+\b)?').match(t, fin2)
                if not lab and m2: fin2 = m2.end()
            elif tipo == 'Check': out.append(texto_check(inner))
            elif tipo == 'Template': out.append(lab or texto_plantilla(inner))
            i = fin2
            continue
        m = re.compile(r'\[\[/(act|r|gmr|br)\s+([^\]]*)\]\]').match(t, i)
        if m:
            lab, fin2 = etiqueta(t, m.end())
            if m.group(1) == 'act':
                slug = m.group(2).split()[0]
                out.append(lab or ACCION_ES.get(slug, slug.replace('-', ' ')))
            else:
                out.append(f"[[/{'gmr' if m.group(1) == 'gmr' else 'r'} {m.group(2)}]]" + (f"{{{lab}}}" if lab else ''))
            i = fin2
            continue
        out.append(t[i]); i += 1
    s = ''.join(out)
    s = re.sub(r'\bsalvaci[oó]n b[aá]sica de Reflejos\b', 'salvación de Destreza (la mitad si la supera)', s)
    s = re.sub(r'\bsalvaci[oó]n b[aá]sica de Fortaleza\b', 'salvación de Constitución (la mitad si la supera)', s)
    s = re.sub(r'\bsalvaci[oó]n b[aá]sica de Voluntad\b', 'salvación de Sabiduría (la mitad si la supera)', s)
    s = re.sub(r'\b(salvaci[oó]n(?:es)?|tirada de salvación) de Reflejos\b', r'\1 de Destreza', s)
    s = re.sub(r'\b(salvaci[oó]n(?:es)?|tirada de salvación) de Fortaleza\b', r'\1 de Constitución', s)
    s = re.sub(r'\b(salvaci[oó]n(?:es)?|tirada de salvación) de Voluntad\b', r'\1 de Sabiduría', s)
    s = re.sub(r'\bCD de (Reflejos|Fortaleza|Voluntad)\b', lambda m: f"CD de {SALV_ES[{'Reflejos': 'reflex', 'Fortaleza': 'fortitude', 'Voluntad': 'will'}[m.group(1)]]} (10 + su bono de salvación)", s)
    for pf, dd in (('Reflejos', 'Destreza'), ('Fortaleza', 'Constitución'), ('Voluntad', 'Sabiduría')): s = re.sub(rf'\b{pf}\b', dd, s)
    for pf, dd in DANO_TEXTO: s = re.sub(pf, dd, s)
    return s

GRADOS = ['Éxito crítico', 'Fallo crítico', 'Éxito', 'Fallo']
def html(h, s):
    """Párrafos: el desencadenante, el cuerpo, los grados de éxito y lo potenciado, cada uno en su línea."""
    s = re.sub(r'^\s*Desencadenante\s+.+?\.(\s|$)', '', s)
    s = re.sub(r'\s+(Requisitos)\s+', r'\n<strong>\1</strong> ', s)
    s = re.sub(r'(?:(?<=[.!?:)])|^)\s*(Éxito crítico|Fallo crítico|Éxito|Fallo)\s+(?=[A-ZÁÉÍÓÚÑ¿0-9])', lambda m: f"\n<strong>{m.group(1)}.</strong> ", s)
    s = re.sub(r'(?:(?<=[.!?:)])|^)\s*((?:Potenciad[oa]|Intensificad[oa]) \([^)]*\))\s*', lambda m: f"\n<strong>{m.group(1)}.</strong> ", s)
    s = re.sub(r'(?:(?<=[.!?:)])|^)\s*(Amplificación)\s*', lambda m: f"\n<strong>{m.group(1)}.</strong> ", s)
    return ''.join(f"<p>{p.strip()}</p>" for p in s.split('\n') if p.strip())

def nota_ecos(h, nivel, salv, hay_grados, hay_potenciado, persistente):
    l = [f"Conjuro de PF2e convertido por Ecos: rango {h.get('rango')} de PF2e = nivel {nivel} de D&amp;D." if nivel else "Truco de PF2e convertido por Ecos."]
    if salv: l.append(f"{SALV_ES[salv]}: salvación de PF2e «{ {'fortitude': 'Fortaleza', 'reflex': 'Reflejos', 'will': 'Voluntad'}[salv] }».")
    if hay_grados: l.append("Grados de éxito: si supera la salvación, vale lo de <strong>Éxito</strong>; si falla, lo de <strong>Fallo</strong>. Con un 20 natural vale lo de <strong>Éxito crítico</strong>, y con un 1 natural, lo de <strong>Fallo crítico</strong>.")
    if hay_potenciado: l.append("Potenciado: cada nivel de espacio de D&amp;D equivale a dos rangos de PF2e. «Potenciado (+1)» se aplica dos veces por nivel de espacio por encima; «(+2)», una vez.")
    if persistente: l.append("Daño persistente: lo recibe al final de cada uno de sus turnos; termina cuando, al final de su turno, saca 15 o más en un d20 sin bonos, o cuando alguien usa una acción para cortarlo.")
    l.append("Estados de PF2e: ver «Cómo leer los conjuros de PF2e» en el compendio de listas.")
    return '<p class="ecos-pf2e-nota"><em>' + ' '.join(l) + '</em></p>'

def slug(s):
    s = s.lower()
    for a, b in zip('áéíóúüñ', 'aeiouun'): s = s.replace(a, b)
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')

def actividad(_id, tipo, **extra):
    base = {'_id': _id, 'type': tipo, 'sort': 0, 'name': '', 'activation': {'type': 'action', 'value': None, 'override': False},
            'consumption': {'targets': [], 'scaling': {'allowed': False, 'max': ''}, 'spellSlot': True},
            'description': {'chatFlavor': ''}, 'duration': {'units': 'inst', 'override': False}, 'effects': [],
            'range': {'override': False}, 'target': {'prompt': True, 'template': {'contiguous': False, 'units': 'ft'}, 'affects': {'choice': False}, 'override': False},
            'uses': {'spent': 0, 'recovery': [], 'max': ''}}
    base.update(extra)
    return base

def convertir(h, img=None):
    nivel = nivel_de(h)
    dano, cura = partes(h)
    salv = h.get('salvacion') if h.get('salvacion') in SALV else None
    if not salv and str(h.get('defensa') or '').endswith('-dc'): salv = str(h['defensa']).split('-')[0]
    ataque = 'attack' in (h.get('rasgos') or []) or h.get('defensa') == 'ac'
    texto = limpiar_texto(h.get('textoEs') or h.get('texto') or '', h)
    persistente = any((d.get('category') == 'persistent') for d in (h.get('dano') or {}).values())
    hay_grados = bool(re.search(r'Éxito crítico|Fallo crítico', texto))
    hay_pot = bool(re.search(r'Potenciad|Intensificad', texto))
    aid = (h['id'] + '0000000000000000')[:15] + 'a'
    acts = {}
    if ataque:
        acts[aid] = actividad(aid, 'attack', attack={'critical': {'threshold': None}, 'flat': False, 'type': {'value': 'melee' if alcance(h)['units'] == 'touch' else 'ranged', 'classification': 'spell'}, 'ability': '', 'bonus': ''},
                              damage={'critical': {'bonus': ''}, 'includeBase': True, 'parts': dano})
    elif salv:
        acts[aid] = actividad(aid, 'save', save={'ability': [SALV[salv]], 'dc': {'calculation': 'spellcasting', 'formula': ''}},
                              damage={'onSave': 'half' if h.get('basica') else 'none', 'parts': dano})
    elif dano:
        acts[aid] = actividad(aid, 'damage', damage={'critical': {'allow': False, 'bonus': ''}, 'parts': dano})
    if cura:
        cid = aid[:-1] + 'c'
        acts[cid] = actividad(cid, 'heal', healing=cura[0])
    if not acts:
        acts[aid] = actividad(aid, 'utility', roll={'formula': '', 'name': '', 'prompt': False, 'visible': False})
    rasgos = set(h.get('rasgos') or [])
    props = []
    if 'concentrate' in rasgos: props.append('vocal')
    if 'manipulate' in rasgos: props.append('somatic')
    if h.get('sostenido'): props.append('concentration')
    if 'ritual' in rasgos or h.get('ritual'): props.append('ritual')
    nombre_es = h.get('nombreEs') or h['nombre']
    nombre = nombre_es if nombre_es.lower() == h['nombre'].lower() else f"{nombre_es} ({h['nombre']})"
    fuente = h.get('fuente') or 'Pathfinder 2e'
    pie = f"<p class=\"ecos-pf2e-fuente\"><small>Fuente: {fuente} (Paizo, licencia {h.get('licencia') or 'OGL'}). Tradiciones de PF2e: {', '.join(h.get('tradiciones') or []) or '—'}. Rareza: {h.get('rareza') or 'common'}.</small></p>"
    return {
        '_id': h['id'], 'name': nombre, 'type': 'spell', 'img': img or 'icons/svg/book.svg',
        'system': {
            'description': {'value': nota_ecos(h, nivel, salv, hay_grados, hay_pot, persistente) + html(h, texto) + pie, 'chat': ''},
            'source': {'custom': 'PF2e (Ecos)', 'book': fuente, 'license': h.get('licencia') or 'OGL', 'rules': '2024'},
            'activation': activacion(h), 'duration': duracion(h), 'level': nivel, 'school': escuela(h, dano),
            'properties': props, 'materials': {'value': '', 'consumed': False, 'cost': 0, 'supply': 0},
            'range': alcance(h), 'target': {'affects': objetivo(h), 'template': plantilla(h)},
            'activities': acts, 'identifier': f"ecos-pf2e-{slug(h['nombre'])}", 'method': 'spell', 'prepared': 0
        },
        'flags': {'ecos-frontera': {'pf2e': {'id': h['id'], 'nombre': h['nombre'], 'rango': h.get('rango'), 'truco': bool(h.get('truco')),
                                             'rareza': h.get('rareza') or 'common', 'tradiciones': h.get('tradiciones') or [], 'licencia': h.get('licencia'), 'v': VERSION}}}
    }

def iconos(carpeta):
    try:
        sys.path.insert(0, __file__.rsplit('/', 1)[0] if '/' in __file__ else '.')
        from leveldb import leer_pack
    except Exception:
        return {}
    out = {}
    for _, v in leer_pack(carpeta).items():
        try: d = json.loads(v)
        except Exception: continue
        if isinstance(d, dict) and d.get('type') == 'spell': out[d['_id']] = d.get('img')
    return out

def main():
    H = {h['id']: h for h in json.load(open('hechizos-pf2e.json', encoding='utf-8'))['hechizos']}
    unicos = json.load(open('filtro-pf2e.json', encoding='utf-8'))['unicos']
    img = iconos(sys.argv[1]) if len(sys.argv) > 1 else {}
    conjuros = [convertir(H[u['id']], img.get(u['id'])) for u in unicos if u['id'] in H]
    listas = {}
    for c in conjuros:
        for t in c['flags']['ecos-frontera']['pf2e']['tradiciones']:
            for clase in CLASES.get(t, []): listas.setdefault(clase, []).append(c['_id'])
    huella = hashlib.sha256(json.dumps(conjuros, sort_keys=True, ensure_ascii=False).encode()).hexdigest()[:16]
    json.dump({'version': VERSION, 'huella': huella, 'total': len(conjuros), 'conjuros': conjuros, 'listas': listas},
              open('conjuros-dnd5e.json', 'w', encoding='utf-8'), ensure_ascii=False)
    por_nivel = {}
    for c in conjuros: por_nivel[c['system']['level']] = por_nivel.get(c['system']['level'], 0) + 1
    print(f"{len(conjuros)} conjuros · huella {huella} · por nivel {dict(sorted(por_nivel.items()))} · listas {{{', '.join(f'{k}: {len(v)}' for k, v in listas.items())}}}")

if __name__ == '__main__':
    main()
