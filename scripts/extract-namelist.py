"""Read a vendor "Meal Plan Name List" PDF into rows of (name, class, dish).

The sheet is a two-column table — Breakfast on the left, Lunch on the right —
and the PDF draws the cells in an order that does not follow either column, so
emission order cannot be trusted. This walks the text with its coordinates and
rebuilds the table from the geometry instead: cluster by y to get table rows,
split by x to get the two halves.

Usage: python3 scripts/extract-namelist.py <file.pdf>
"""
import re, sys, zlib, json
from collections import defaultdict

PATH = sys.argv[1]
data = open(PATH, 'rb').read()

# ── objects, including those packed in object streams ──────────────────────
objs = {}
for m in re.finditer(rb'(\d+)\s+(\d+)\s+obj\b', data):
    objs[int(m.group(1))] = data[m.end():data.find(b'endobj', m.end())]

def stream_of(raw):
    m = re.search(rb'stream\r?\n', raw)
    if not m:
        return None
    blob = raw[m.end():raw.find(b'endstream', m.end())]
    if b'/FlateDecode' in raw:
        try:
            return zlib.decompress(blob)
        except Exception:
            return None
    return blob

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

# ── ToUnicode CMaps (Identity-H, two bytes per glyph) ──────────────────────
def parse_cmap(d):
    cm = {}
    for blk in re.findall(rb'beginbfchar(.*?)endbfchar', d, re.S):
        for s, t in re.findall(rb'<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>', blk):
            cm[int(s, 16)] = bytes.fromhex(t.decode()).decode('utf-16-be', 'replace')
    for blk in re.findall(rb'beginbfrange(.*?)endbfrange', d, re.S):
        for lo, hi, t in re.findall(rb'<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>', blk):
            lo, hi, base = int(lo, 16), int(hi, 16), int(t, 16)
            for k in range(lo, hi + 1):
                cm[k] = chr(base + (k - lo))
    return cm

cmaps = {}
for num, raw in objs.items():
    m = re.search(rb'/ToUnicode\s+(\d+)\s+0\s+R', raw)
    if m:
        d = stream_of(objs.get(int(m.group(1)), b''))
        if d:
            cmaps[num] = parse_cmap(d)

fontmap = {}
for num, raw in objs.items():
    for fm in re.finditer(rb'/Font\s*<<(.*?)>>', raw, re.S):
        for name, fo in re.findall(rb'/(\w+)\s+(\d+)\s+0\s+R', fm.group(1)):
            fontmap[name.decode()] = int(fo)

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

unhex = lambda t: bytes.fromhex(re.sub(rb'[^0-9A-Fa-f]', b'', t).decode())
dec = lambda b, cm: ''.join(cm.get((b[i] << 8) | b[i + 1], '') for i in range(0, len(b) - 1, 2))

# ── walk content streams, keeping x/y for every shown string ───────────────
NUM = r'-?[\d.]+'
TOK = re.compile(
    (rb'/(\w+)\s+[\d.]+\s+Tf'
     rb'|(' + NUM.encode() + rb')\s+(' + NUM.encode() + rb')\s+(' + NUM.encode() + rb')\s+('
     + NUM.encode() + rb')\s+(' + NUM.encode() + rb')\s+(' + NUM.encode() + rb')\s+Tm'
     rb'|(' + NUM.encode() + rb')\s+(' + NUM.encode() + rb')\s+(Td|TD)'
     rb'|(' + NUM.encode() + rb')\s+TL'
     rb'|(T\*)'
     rb'|\[((?:[^\[\]\\]|\\.)*)\]\s*TJ'
     rb'|\(((?:[^()\\]|\\.)*)\)\s*Tj'
     rb'|<([0-9A-Fa-f\s]+)>\s*Tj'
     rb'|(BT|ET)'), re.S)

items = []           # (page, y, x, text)
page = 0
for num, raw in objs.items():
    d = stream_of(raw)
    if not d or (b'TJ' not in d and b'Tj' not in d):
        continue
    page += 1
    cm = {}
    x = y = 0.0
    lx = ly = 0.0
    leading = 0.0
    for m in TOK.finditer(d):
        g = m.groups()
        if g[0]:
            cm = cmaps.get(fontmap.get(g[0].decode(), -1), {})
        elif g[5] is not None:                       # Tm
            x = lx = float(g[5]); y = ly = float(g[6])
        elif g[9] is not None:                       # Td / TD
            lx += float(g[7]); ly += float(g[8])
            x, y = lx, ly
            if g[9] == b'TD':
                leading = -float(g[8])
        elif g[10] is not None:                      # TL
            leading = float(g[10])
        elif g[11] is not None:                      # T*
            ly -= leading; x, y = lx, ly
        elif g[12] is not None:                      # TJ
            chunk = b''
            for p in re.finditer(rb'\(((?:[^()\\]|\\.)*)\)|<([0-9A-Fa-f\s]+)>', g[12], re.S):
                chunk += unescape(p.group(1)) if p.group(1) is not None else unhex(p.group(2))
            t = dec(chunk, cm)
            if t.strip():
                items.append((page, round(y, 1), round(x, 1), t))
        elif g[13] is not None:                      # Tj
            t = dec(unescape(g[13]), cm)
            if t.strip():
                items.append((page, round(y, 1), round(x, 1), t))
        elif g[14] is not None:                      # hex Tj
            t = dec(unhex(g[14]), cm)
            if t.strip():
                items.append((page, round(y, 1), round(x, 1), t))

print(f'text items: {len(items)}  pages: {page}', file=sys.stderr)
json.dump(items, open('/tmp/items.json', 'w'))

# ── group into visual lines, then into the two column halves ───────────────
xs = sorted(i[2] for i in items)
mid = xs[len(xs) // 2] if xs else 0
print(f'x range {xs[0] if xs else 0} .. {xs[-1] if xs else 0}, median {mid}', file=sys.stderr)

rows = defaultdict(list)
for pg, y, x, t in items:
    rows[(pg, y)].append((x, t))

for (pg, y) in sorted(rows, key=lambda k: (k[0], -k[1]))[:60]:
    cells = ' | '.join(f'{x:.0f}:{t}' for x, t in sorted(rows[(pg, y)]))
    print(f'p{pg} y{y:>7.1f}  {cells}')
