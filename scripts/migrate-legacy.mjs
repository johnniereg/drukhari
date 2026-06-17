// One-shot migration: parse legacy/index.html into data/catalog.json.
// Legacy data is weapon-keyed (weapon -> list of units); we invert it to
// datasheet-keyed (unit -> weapon ids) and capture abilities/pain rules text.
import { readFileSync, writeFileSync } from 'node:fs';

const html = readFileSync('legacy/index.html', 'utf8');

const slug = (s) =>
  s.toLowerCase().trim()
    .replace(/[’']/g, '')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

// Strip HTML tags / entities to plain text (for ability descriptions).
const text = (s) =>
  s.replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&rsquo;/g, '’').replace(/&ldquo;/g, '“').replace(/&rdquo;/g, '”')
    .replace(/&mdash;/g, '—').replace(/&ndash;/g, '–').replace(/&amp;/g, '&')
    .replace(/&bull;/g, '•').replace(/\s+/g, ' ').trim();

// Slice out one card by id, up to the next card or </body>.
function card(id) {
  const start = html.indexOf(`id="${id}"`);
  if (start < 0) throw new Error(`card ${id} not found`);
  const after = html.indexOf('type="card"', start + 5);
  const end = after < 0 ? html.length : html.lastIndexOf('<div', after);
  return html.slice(start, end);
}

// Parse <tr class="removable"> blocks; return profile-name + ordered markdown cells.
function rows(section) {
  const out = [];
  const re = /<tr class="removable">([\s\S]*?)<\/tr>/g;
  let m;
  while ((m = re.exec(section))) {
    const blk = m[1];
    const name = (blk.match(/profile-name">([\s\S]*?)<\/span>/) || [])[1];
    const cells = [...blk.matchAll(/<td[^>]*type="markdown">([\s\S]*?)<\/td>/g)].map((x) => x[1]);
    // ability/pain tables put the description in a <span data> inside td.name
    const descSpan = blk.match(/profile-name">[\s\S]*?<\/span>\s*<span[^>]*type="markdown">([\s\S]*?)<\/span>\s*<\/td>/);
    out.push({ name: text(name || ''), cells: cells.map((c) => c.trim()), desc: descSpan ? text(descSpan[1]) : '' });
  }
  return out;
}

// --- Units (datasheets) ---
const unitRows = rows(card('units-card'));
const datasheets = [];
const roleByKeyword = (kw) =>
  kw.includes('TRANSPORT') ? 'Transport' : kw.includes('CHARACTER') ? 'Character'
  : kw.includes('VEHICLE') ? 'Vehicle' : kw.includes('MOUNTED') ? 'Mounted' : 'Infantry';

for (const r of unitRows) {
  const c = r.cells.map((x) => text(x));
  // full datasheet row = 8 stat/notes cells; 6 = a sub-profile (stats only) of the previous unit
  if (c.length >= 8) {
    const abilities = c[6] ? c[6].split(',').map((s) => s.trim()).filter(Boolean) : [];
    datasheets.push({
      id: slug(r.name), name: r.name,
      stats: { m: c[0], t: Number(c[1]) || c[1], sv: c[2], w: Number(c[3]) || c[3], ld: c[4], oc: Number(c[5]) || c[5] },
      abilities, pain: c[7] || undefined, weapons: [], modelProfiles: []
    });
  } else if (c.length >= 6 && datasheets.length) {
    datasheets[datasheets.length - 1].modelProfiles.push({
      name: r.name, m: c[0], t: c[1], sv: c[2], w: c[3], ld: c[4], oc: c[5]
    });
  }
}
const dsById = new Map(datasheets.map((d) => [d.id, d]));

// --- Weapons (ranged + melee), with variant ids, inverted onto units ---
const weapons = [];
const seen = new Map(); // name -> count to disambiguate variants

function parseWeapons(section, kind) {
  for (const r of rows(section)) {
    if (!r.name) continue;
    const c = r.cells.map((x) => text(x));
    // ranged: [Units, R, A, BS, S, AP, D, Keywords] ; melee: [Units, A, WS, S, AP, D, Keywords]
    const units = (c[0] || '').split(',').map((s) => slug(s)).filter(Boolean);
    let prof;
    if (kind === 'ranged') prof = { range: c[1], a: c[2], skill: c[3], s: c[4], ap: c[5], d: c[6], kw: c[7] };
    else prof = { a: c[1], skill: c[2], s: c[3], ap: c[4], d: c[5], kw: c[6] };

    const base = slug(r.name);
    const n = (seen.get(base) || 0);
    // Stable, meaningful id: bare slug for the first profile, suffix by first owning unit for variants.
    const id = n === 0 ? base : `${base}__${units[0] || 'v' + n}`;
    seen.set(base, n + 1);

    weapons.push({
      id, name: r.name, kind,
      ...(kind === 'ranged' ? { range: prof.range } : {}),
      a: prof.a, skill: prof.skill, s: prof.s, ap: prof.ap, d: prof.d,
      keywords: prof.kw && prof.kw !== '-' ? prof.kw.split(',').map((x) => x.trim()) : []
    });
    for (const u of units) { const d = dsById.get(u); if (d && !d.weapons.includes(id)) d.weapons.push(id); }
  }
}
parseWeapons(card('ranged-card'), 'ranged');
parseWeapons(card('melee-card'), 'melee');

// --- Abilities + Pain rules text ---
const abilities = [];
const addAbility = (name, desc) => {
  const id = slug(name.replace(/\s*\(pain\)\s*$/i, ''));
  if (!id || abilities.find((a) => a.id === id)) return;
  abilities.push({ id, name: name.replace(/\s*\(Pain\)\s*$/i, ''), text: desc });
};
for (const r of rows(card('abilities-card'))) if (r.name && r.desc) addAbility(r.name, r.desc);
for (const r of rows(card('pain-card'))) if (r.name && r.desc) addAbility(r.name, r.desc);

// --- Manual enrichments (not present in legacy HTML) ---
const enrich = {
  archon: { points: [{ models: 1, pts: 75, verified: false }], canLead: ['kabalite_warriors', 'incubi'] },
  incubi: { points: [{ models: 3, pts: 75, verified: false }, { models: 6, pts: 150, verified: false }, { models: 9, pts: 225, verified: false }] },
  kabalite_warriors: { points: [{ models: 5, pts: 100, verified: false }, { models: 10, pts: 200, verified: false }], splittable: true },
  venom: { points: [{ models: 1, pts: 70, verified: false }], transport: { capacity: 5, splitGroupSize: 5, notes: 'Can carry one DRUKHARI INFANTRY unit; a unit may embark split into groups of 5.' } },
  raider: { points: [{ models: 1, pts: 85, verified: false }], transport: { capacity: 11, notes: 'Can carry one DRUKHARI INFANTRY unit of up to 11 models.' } }
};
// Roles aren't in the legacy data; infer from a small known map (cosmetic grouping).
const VEHICLES = new Set(['cronos', 'raider', 'ravager', 'talos', 'venom']);
const CHARACTERS = new Set(['archon', 'drazhar', 'haemonculus', 'lady_malys', 'lelith_hesperax', 'succubus']);
for (const d of datasheets) {
  d.role = VEHICLES.has(d.id) ? (enrich[d.id]?.transport ? 'Transport' : 'Vehicle')
    : CHARACTERS.has(d.id) ? 'Character' : 'Infantry';
  d.points = d.points || [];
  Object.assign(d, enrich[d.id] || {});
  if (!d.modelProfiles.length) delete d.modelProfiles;
}

const catalog = {
  meta: { pointsVersion: 'PLACEHOLDER — confirm against current MFM', updated: '2026-06-17', edition: '11th' },
  weapons, abilities, datasheets
};
writeFileSync('data/catalog.json', JSON.stringify(catalog, null, 2) + '\n');
console.log(`datasheets=${datasheets.length} weapons=${weapons.length} abilities=${abilities.length}`);
console.log('sub-profiles:', datasheets.filter((d) => d.modelProfiles).length);
console.log('units with 0 weapons:', datasheets.filter((d) => !d.weapons.length).map((d) => d.name).join(', '));
