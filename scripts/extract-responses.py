"""Correct text extraction: decode Identity-H 2-byte codes through each font's
own ToUnicode CMap, instead of guessing a fixed glyph shift."""
import re, zlib, sys

PATH = '/Users/tommywong/Downloads/ZERA Meal Plan (Responses) September 26 - Form responses 27-3.pdf'
data = open(PATH, 'rb').read()

# ── objects ────────────────────────────────────────────────────────────────
objs = {}                                    # num -> raw bytes
for m in re.finditer(rb'(\d+)\s+(\d+)\s+obj\b', data):
    num = int(m.group(1))
    end = data.find(b'endobj', m.end())
    objs[num] = data[m.end():end]

def stream_of(raw):
    m = re.search(rb'stream\r?\n', raw)
    if not m:
        return None
    e = raw.find(b'endstream', m.end())
    blob = raw[m.end():e]
    if b'/FlateDecode' in raw:
        try:
            return zlib.decompress(blob)
        except Exception:
            return None
    return blob

# expand object streams (PDF 1.5+ packs objects inside /ObjStm)
for num, raw in list(objs.items()):
    if b'/ObjStm' not in raw:
        continue
    d = stream_of(raw)
    if not d:
        continue
    n = int(re.search(rb'/N\s+(\d+)', raw).group(1))
    first = int(re.search(rb'/First\s+(\d+)', raw).group(1))
    head = d[:first].split()
    for i in range(n):
        onum, off = int(head[2 * i]), int(head[2 * i + 1])
        nxt = int(head[2 * i + 3]) + first if i + 1 < n else len(d)
        objs.setdefault(onum, d[first + off:nxt])

# ── ToUnicode CMaps ────────────────────────────────────────────────────────
def parse_cmap(d):
    cmap = {}
    for blk in re.findall(rb'beginbfchar(.*?)endbfchar', d, re.S):
        for src, dst in re.findall(rb'<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>', blk):
            cmap[int(src, 16)] = bytes.fromhex(dst.decode()).decode('utf-16-be', 'replace')
    for blk in re.findall(rb'beginbfrange(.*?)endbfrange', d, re.S):
        for lo, hi, dst in re.findall(rb'<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>', blk):
            lo, hi = int(lo, 16), int(hi, 16)
            base = int(dst, 16)
            for k in range(lo, hi + 1):
                cmap[k] = chr(base + (k - lo))
    return cmap

cmaps = {}                                   # font obj num -> cmap
for num, raw in objs.items():
    if b'/ToUnicode' not in raw:
        continue
    m = re.search(rb'/ToUnicode\s+(\d+)\s+0\s+R', raw)
    if not m:
        continue
    tu = int(m.group(1))
    d = stream_of(objs.get(tu, b''))
    if d:
        cmaps[num] = parse_cmap(d)

# ── page resources: /F1 -> font object ─────────────────────────────────────
resmaps = []
for num, raw in objs.items():
    if b'/Font' not in raw:
        continue
    for fm in re.finditer(rb'/Font\s*<<(.*?)>>', raw, re.S):
        mp = {}
        for name, fo in re.findall(rb'/(\w+)\s+(\d+)\s+0\s+R', fm.group(1)):
            mp[name.decode()] = int(fo)
        if mp:
            resmaps.append(mp)

merged = {}
for mp in resmaps:
    merged.update(mp)

def unhex(tok):
    return bytes.fromhex(re.sub(rb'[^0-9A-Fa-f]', b'', tok).decode())

def unescape(s):
    out = bytearray(); i = 0
    while i < len(s):
        c = s[i]
        if c == 0x5c and i + 1 < len(s):
            n = s[i + 1]
            mp = {0x6e: 10, 0x72: 13, 0x74: 9, 0x62: 8, 0x66: 12}
            if n in mp:
                out.append(mp[n]); i += 2; continue
            if 0x30 <= n <= 0x37:
                j = i + 1; od = b''
                while j < len(s) and len(od) < 3 and 0x30 <= s[j] <= 0x37:
                    od += bytes([s[j]]); j += 1
                out.append(int(od, 8) & 0xFF); i = j; continue
            out.append(n); i += 2; continue
        out.append(c); i += 1
    return bytes(out)

def decode_run(raw_bytes, cmap):
    """Identity-H: two bytes per glyph."""
    out = []
    for i in range(0, len(raw_bytes) - 1, 2):
        code = (raw_bytes[i] << 8) | raw_bytes[i + 1]
        out.append(cmap.get(code, ''))
    return ''.join(out)

# ── walk content streams ───────────────────────────────────────────────────
TOKEN = re.compile(
    rb'/(\w+)\s+[\d.]+\s+Tf'                       # 1 font select
    rb'|\[((?:[^\[\]\\]|\\.)*)\]\s*TJ'             # 2 array show
    rb'|\(((?:[^()\\]|\\.)*)\)\s*Tj'               # 3 string show
    rb'|<([0-9A-Fa-f\s]+)>\s*Tj'                   # 4 hex show
    rb'|(Td|TD|T\*|ET|BT)',                        # 5 line break
    re.S)

lines = []
for num, raw in objs.items():
    if b'/Contents' in raw and b'stream' not in raw:
        continue
    d = stream_of(raw)
    if not d or (b'TJ' not in d and b'Tj' not in d):
        continue
    cur, cmap = [], {}
    for m in TOKEN.finditer(d):
        if m.group(1):
            cmap = cmaps.get(merged.get(m.group(1).decode(), -1), {})
            continue
        if m.group(5):
            if cur:
                lines.append(''.join(cur)); cur = []
            continue
        if m.group(2) is not None:
            chunk = b''
            for piece in re.finditer(rb'\(((?:[^()\\]|\\.)*)\)|<([0-9A-Fa-f\s]+)>', m.group(2), re.S):
                chunk += unescape(piece.group(1)) if piece.group(1) is not None else unhex(piece.group(2))
            cur.append(decode_run(chunk, cmap))
        elif m.group(3) is not None:
            cur.append(decode_run(unescape(m.group(3)), cmap))
        elif m.group(4) is not None:
            cur.append(decode_run(unhex(m.group(4)), cmap))
    if cur:
        lines.append(''.join(cur))

out = open('/tmp/p5.txt', 'w')
for ln in lines:
    ln = re.sub(r'\s+', ' ', ln).strip()
    if ln:
        out.write(ln + '\n')
out.close()
print('cmaps parsed:', len(cmaps), '| font names mapped:', len(merged))
print('lines written:', sum(1 for _ in open('/tmp/p5.txt')))
