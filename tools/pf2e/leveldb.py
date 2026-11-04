"""Lector mínimo de LevelDB (log y tablas .ldb con Snappy) para packs de Foundry."""
import struct, sys, json, cramjam
def varint(b, i):
    r = s = 0
    while True:
        c = b[i]; i += 1; r |= (c & 0x7f) << s; s += 7
        if c < 0x80: return r, i
def log_records(path):
    data = open(path, 'rb').read(); out = []; buf = b''; i = 0; B = 32768
    while i + 7 <= len(data):
        bloque_rest = B - (i % B)
        if bloque_rest < 7: i += bloque_rest; continue
        crc, ln, t = struct.unpack('<IHB', data[i:i+7]); i += 7
        frag = data[i:i+ln]; i += ln
        if t == 0 and ln == 0: continue
        if t == 1: out.append(frag)
        elif t == 2: buf = frag
        elif t == 3: buf += frag
        elif t == 4: buf += frag; out.append(buf); buf = b''
    return out
def batch_entries(rec):
    seq, n = struct.unpack('<QI', rec[:12]); i = 12; res = []
    for _ in range(n):
        tipo = rec[i]; i += 1
        kl, i = varint(rec, i); k = rec[i:i+kl]; i += kl
        if tipo == 1:
            vl, i = varint(rec, i); v = rec[i:i+vl]; i += vl; res.append((k, v))
        else: res.append((k, None))
    return res
def leer_log(path):
    vals = {}
    for r in log_records(path):
        for k, v in batch_entries(r):
            if v is None: vals.pop(k, None)
            else: vals[k] = v
    return vals
if __name__ == '__main__':
    v = leer_log(sys.argv[1]); print(len(v)); ks = list(v)[:5]; print([k[:60] for k in ks])

def _bloque(data, off, size):
    raw = data[off:off+size]; tipo = data[off+size]
    if tipo == 1: raw = bytes(cramjam.snappy.decompress_raw(raw))
    return raw
def _entradas(b):
    nrest = struct.unpack('<I', b[-4:])[0]; fin = len(b) - 4 - 4*nrest; i = 0; k = b''; out = []
    while i < fin:
        sh, i = varint(b, i); ns, i = varint(b, i); vl, i = varint(b, i)
        k = k[:sh] + b[i:i+ns]; i += ns; v = b[i:i+vl]; i += vl; out.append((k, v))
    return out
def leer_ldb(path):
    data = open(path, 'rb').read(); pie = data[-48:]
    i = 0; _, i = varint(pie, i); _, i = varint(pie, i); io, i = varint(pie, i); isz, i = varint(pie, i)
    vals = {}
    for k, h in _entradas(_bloque(data, io, isz)):
        j = 0; off, j = varint(h, j); sz, j = varint(h, j)
        for kk, v in _entradas(_bloque(data, off, sz)):
            clave = kk[:-8]; tag = struct.unpack('<Q', kk[-8:])[0] & 0xff
            if tag == 1: vals[clave] = v
            else: vals.pop(clave, None)
    return vals

def leer_pack(carpeta):
    """Todas las entradas vigentes de una carpeta LevelDB (tablas .ldb y después el registro .log)."""
    import os
    vals = {}
    for n in sorted(f for f in os.listdir(carpeta) if f.endswith('.ldb')): vals.update(leer_ldb(os.path.join(carpeta, n)))
    for n in sorted(f for f in os.listdir(carpeta) if f.endswith('.log')): vals.update(leer_log(os.path.join(carpeta, n)))
    return vals
