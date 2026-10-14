"""Turn chosen rows of the Google Form CSV into import records.

    python3 -I form_to_records.py <form.csv> <records.json> "Sam Sample" "Riley Roe"

Names match the form's First Name + Last Name, ignoring case and extra spaces.
Keep the CSV and the JSON in the scratchpad: they hold family details.
Prints each record so it can be checked against the site before importing.
"""
import csv, datetime, json, re, sys

if len(sys.argv) < 4:
    sys.exit(__doc__)
src, out, wanted = sys.argv[1], sys.argv[2], sys.argv[3:]


def clean(v):
    return re.sub(r'\s+', ' ', (v or '')).strip()


def key(v):
    return clean(v).lower()


def phone(v):
    d = re.sub(r'\D', '', clean(v))
    if len(d) == 11 and d.startswith('1'):
        d = d[1:]
    return d if len(d) == 10 else (clean(v) or None)


def email(v):
    v = clean(v).lower()
    return v if re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', v) else None


RELATIONSHIPS = {'dad': 'Father', 'father': 'Father', 'mom': 'Mother', 'mother': 'Mother', 'parent': 'Parent'}
KNOWN_RELATIONSHIPS = ('mother', 'father', 'step father', 'stepfather', 'grandpa', 'grandma', 'guardian', 'aunt', 'uncle', 'parent', 'mom', 'dad')


def rel(v):
    v0 = clean(v)
    if not v0 or v0.lower() in ('n/a', 'na'):
        return None
    return RELATIONSHIPS.get(v0.lower(), v0)


def coach(v):
    l = key(v)
    return 'Yes' if l == 'yes' else 'No' if l == 'no' else None


def shirt(v):
    raw = clean(v)
    s = raw.upper().replace(' ', '').replace('-', '')
    tier = 'Youth' if s.startswith('Y') else 'Adult' if s.startswith('A') else None
    known = {'XS': 'XS', 'S': 'S', 'M': 'M', 'L': 'L', 'XL': 'XL', '2XL': '2XL', 'XXL': '2XL'}
    return f'{tier} {known[s[1:]]}' if tier and s[1:] in known else (raw or None)


def weight(v):
    try:
        n = float(re.sub(r'[^\d.]', '', clean(v)))
    except ValueError:
        return None
    return (str(int(n)) if n.is_integer() else str(n)) if n > 0 else None


def guardians(row, last):
    out = []
    for ordinal, start in ((1, 16), (2, 21)):
        name = clean(row[start])
        if not name or name.lower() in ('n/a', 'na', 'none'):
            continue
        relationship = clean(row[start + 1])
        # A last name typed into the relationship box ("Joe" / "Sample").
        if relationship and ' ' not in name and relationship.lower() not in KNOWN_RELATIONSHIPS:
            name = f'{name} {relationship}'
            relationship = 'Father' if relationship.lower() == last.lower() else ''
        junk = len(name) < 2 or name.lower().startswith('same as')
        dup = out and name.lower() == out[0]['name'].lower()
        if ordinal == 2 and (junk or dup):
            continue
        out.append(dict(ordinal=ordinal, name=name, relationship=rel(relationship), phone=phone(row[start + 2]),
                        email=email(row[start + 3]), coach=coach(row[start + 4])))
    return out


rows = list(csv.reader(open(src, encoding='utf-8')))
targets = {key(n) for n in wanted}
records, found = [], set()
for r in rows[1:]:
    full = key(f'{r[2]} {r[3]}')
    if full not in targets:
        continue
    found.add(full)
    first, last = clean(r[2]), clean(r[3])
    ts = datetime.datetime.strptime(clean(r[0]), '%m/%d/%Y %H:%M:%S')
    m, d, y = clean(r[7]).split('/')
    g = guardians(r, last)
    acct = email(r[1])
    owner = next((x for x in g if x['email'] == acct), g[0] if g else None)
    # Central time: CDT (-05:00) through early November, CST (-06:00) after.
    offset = '-05:00' if datetime.date(ts.year, 3, 8) <= ts.date() < datetime.date(ts.year, 11, 1) else '-06:00'
    records.append(dict(
        athlete_id=None, account_email=acct, first=first, last=last, dob=f'{y}-{int(m):02d}-{int(d):02d}',
        phone=phone(r[4]), street=clean(r[5]) or None, city=clean(r[6]) or None, grade=clean(r[9]) or None,
        school=clean(r[10]) or None, weight=weight(r[11]), shirt=shirt(r[12]), years=clean(r[13]) or None,
        commitment=clean(r[14]) or None, referral=clean(r[15]) or None,
        signed_at=ts.strftime('%Y-%m-%dT%H:%M:%S') + offset,
        signature=g[0]['name'] if g else None, parent_name=owner['name'] if owner else None, guardians=g))

missing = targets - found
if missing:
    print('NOT FOUND in the form:', ', '.join(sorted(missing)))
# A name can appear twice (a family re-submitting). Newest row last; keep only it.
latest = {}
for x in records:
    latest[key(f"{x['first']} {x['last']}")] = x
records = list(latest.values())
json.dump(records, open(out, 'w'), separators=(',', ':'), ensure_ascii=False)
for x in records:
    print(json.dumps({k: x[k] for k in ('first', 'last', 'dob', 'account_email', 'parent_name', 'grade', 'weight', 'shirt', 'signed_at')}),
          [(g['name'], g['relationship'], g['email']) for g in x['guardians']])
