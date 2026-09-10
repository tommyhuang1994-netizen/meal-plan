"""Turn /tmp/items.json (from extract-namelist.py) into one row per person per
meal: (side, name, class group, year, dish).

Geometry of the sheet, in text-space units:
    left  half  x <  500   -> Breakfast    name x~3    class/year x~179   dish x~305
    right half  x >= 500   -> Lunch        name x~602  class/year x~778   dish x~904

Entries are anchored on the dish cell, which occurs exactly once per entry.
Fixed y-buckets do not work: they cut wrapped names apart and glue neighbours
together, which silently merges two people into one ("Wallce Lian Cheng
Anthony Lee Yu Kai"). Everything belonging to an entry sits within about half
the ~50-unit row pitch of its dish.
"""
import json, re, sys
from collections import defaultdict

items = json.load(open('/tmp/items.json'))

CLASSG = re.compile(r'^(CAMBRIDGE|HOMESCHOOL|PLUS|STAFF)\s*$', re.I)
YEAR = re.compile(r'^(Year\s+\d+|PLUS|Cambridge\s+Plus)\s*$', re.I)
DISH = re.compile(r"^(RM\d+\s*-|Chef's Choice|- None -)")
CJK = re.compile(r'[　-鿿＀-￯]')

WINDOW = 24.0            # half the row pitch

SIDES = {
    'breakfast': dict(lo=-1e9, hi=500, name=3, meta=179, dish=305),
    'lunch':     dict(lo=500, hi=1e9, name=602, meta=778, dish=904),
}

clean = []
for pg, y, x, t in items:
    t = t.strip()
    if t and not CJK.search(t):
        clean.append((pg, y, x, t))

rows = []
for side, geo in SIDES.items():
    mine = [(pg, y, x, t) for pg, y, x, t in clean if geo['lo'] <= x < geo['hi']]
    near = lambda x, target: abs(x - target) < 90

    anchors = [(pg, y, t) for pg, y, x, t in mine if near(x, geo['dish']) and DISH.match(t)]
    for pg, dy, dish in anchors:
        names, metas = [], []
        for p2, y2, x2, t2 in mine:
            if p2 != pg or abs(y2 - dy) > WINDOW:
                continue
            if near(x2, geo['name']):
                names.append((y2, t2))
            elif near(x2, geo['meta']):
                metas.append((y2, t2))

        # A wrapped name occupies two lines. This document's text space runs
        # downwards, so the continuation line carries the LARGER y — sorting
        # the other way reverses names ("Dian Wallce Lian Cheng").
        name = ' '.join(t.strip() for y, t in sorted(names, key=lambda p: p[0])).strip()
        name = re.sub(r'\s+', ' ', name)
        group = next((t.strip() for y, t in metas if CLASSG.match(t)), '')
        year = next((t.strip() for y, t in metas if YEAR.match(t) and not CLASSG.match(t)), '')
        rows.append(dict(page=pg, y=dy, side=side, name=name,
                         group=group.title() if group else '', year=year, dish=dish))

rows = [r for r in rows if r['name'] and r['name'].lower() != 'name']
rows.sort(key=lambda r: (r["side"], r["page"], r["y"]))

bf = [r for r in rows if r['side'] == 'breakfast']
ln = [r for r in rows if r['side'] == 'lunch']
print(f'breakfast rows: {len(bf)}   lunch rows: {len(ln)}   total: {len(rows)}')

dupes = [n for n, c in defaultdict(int, {}).items()]
for side, grp in (('breakfast', bf), ('lunch', ln)):
    seen = defaultdict(int)
    for r in grp:
        seen[r['name']] += 1
    rep = {n: c for n, c in seen.items() if c > 1}
    print(f'  {side}: {len(seen)} distinct names' + (f'  REPEATED: {rep}' if rep else ''))

print('\n--- dish tallies ---')
for side, grp in (('breakfast', bf), ('lunch', ln)):
    tally = defaultdict(int)
    for r in grp:
        tally[r['dish']] += 1
    print(f'  {side}:')
    for d, c in sorted(tally.items(), key=lambda p: -p[1]):
        print(f'     {c:>3}  {d}')

json.dump(rows, open('/tmp/namelist14.json', 'w'), indent=1)
print('\nwrote /tmp/namelist14.json')

if '-v' in sys.argv:
    for r in rows:
        print(f"  {r['side'][:2]}  {r['name']:<34} {r['group']:<11} {r['year']:<9} {r['dish']}")
