"""Work out which date each meal column of the responses sheet belongs to.

The sheet has no printed column headers, so the mapping has to be established
rather than assumed. Two independent constraints do it:

  1. "Chef's Choice (Brunch)" can only appear on a Friday, and September 2026
     has exactly four (4, 11, 18, 25).
  2. 14 September is already known from the vendor name list — 62 people, 41
     breakfast, 50 lunch, by name. Any proposed mapping must reproduce it.

Constraint 2 is the real test: it is falsifiable, and a mapping that fails it
is wrong no matter how plausible it looks.

Run after scripts/extract-namelist.py has written /tmp/items.json for the
responses PDF.
"""
import json, re, unicodedata
from collections import defaultdict

items = json.load(open('/tmp/items.json'))

MEAL = re.compile(r"^(RM\d+|Chef's Choice|- None -|gg |o salad|Tafoo|Not applicable)")
CLASS = re.compile(r'^(CAMBRIDGE|HOMESCHOOL|PLUS|STAFF)\b', re.I)
TS = re.compile(r'^\d{2}/\d{2}/\d{4} \d{2}:\d{2}:\d{2}$')

# ── rows: one per response, keyed by y ──────────────────────────────────────
rows_by_y = defaultdict(dict)
for pg, y, x, t in items:
    t = t.strip()
    if not t:
        continue
    rows_by_y[round(y)][round(x)] = t

# A response row is one carrying a timestamp in the first column.
resp_ys = sorted(y for y, cells in rows_by_y.items()
                 if any(TS.match(v) for k, v in cells.items() if k < 100))
print(f'response rows: {len(resp_ys)}')

# ── columns that hold meal answers ──────────────────────────────────────────
col_vals = defaultdict(list)
for y in resp_ys:
    for x, t in rows_by_y[y].items():
        if MEAL.match(t):
            col_vals[x].append(t)
meal_cols = sorted(c for c in col_vals if len(col_vals[c]) >= 20)
print(f'meal columns: {len(meal_cols)}')

brunch_cols = [c for c in meal_cols if any('Brunch' in v for v in col_vals[c])]
print(f'brunch (Friday) columns at positions: '
      f'{[meal_cols.index(c) for c in brunch_cols]} of {len(meal_cols)}')

# ── the known answer for 14 September ───────────────────────────────────────
sheet = json.load(open('/tmp/namelist14.json'))
norm = lambda s: re.sub(r'[^a-z]', '', unicodedata.normalize('NFKD', s).lower())
sheet_bf = {norm(r['name']) for r in sheet if r['side'] == 'breakfast'}
sheet_ln = {norm(r['name']) for r in sheet if r['side'] == 'lunch'}
print(f'\nname list for 14 Sep: {len(sheet_bf)} breakfast, {len(sheet_ln)} lunch')

# Name of each response row.
def name_of(y):
    cells = rows_by_y[y]
    parts = [t for x, t in sorted(cells.items()) if 100 < x < 330]
    return ' '.join(parts).strip()

names = {y: name_of(y) for y in resp_ys}

# ── test every plausible column -> date mapping ─────────────────────────────
# Try each pair of adjacent columns as (breakfast, lunch) for 14 September and
# see which, if any, reproduces the name list.
def picked(val):
    return val and val != '- None -' and not val.startswith('Not applicable')

best = []
for i in range(len(meal_cols) - 1):
    cb, cl = meal_cols[i], meal_cols[i + 1]
    bf, ln = set(), set()
    for y in resp_ys:
        n = norm(names[y])
        if not n:
            continue
        vb, vl = rows_by_y[y].get(cb), rows_by_y[y].get(cl)
        if picked(vb): bf.add(n)
        if picked(vl): ln.add(n)
    score = len(bf & sheet_bf) + len(ln & sheet_ln)
    best.append((score, i, len(bf), len(ln), len(bf & sheet_bf), len(ln & sheet_ln)))

best.sort(reverse=True)
print('\nbest matches against the 14 Sep name list (breakfast+lunch overlap):')
for score, i, nb, nl, ob, ol in best[:6]:
    print(f'  cols {i}/{i+1}: {nb} bf, {nl} ln  ->  overlap {ob}/{len(sheet_bf)} bf, '
          f'{ol}/{len(sheet_ln)} ln   score {score}')

top = best[0]
print(f'\nbest possible score would be {len(sheet_bf) + len(sheet_ln)}; best found is {top[0]}')
