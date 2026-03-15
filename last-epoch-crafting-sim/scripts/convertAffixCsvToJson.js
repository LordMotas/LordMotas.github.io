const fs = require('fs');
const path = require('path');

const inDir = 'c:\\Users\\lordm\\Desktop\\LECrafter\\LordMotas.github.io\\last-epoch-crafting-sim\\src\\data\\CSV';
const files = [
  path.join(inDir, 'AffixData_1.csv'),
  path.join(inDir, 'AffixData_2.csv'),
  path.join(inDir, 'AffixData_3.csv')
];
const outPath = 'c:\\Users\\lordm\\Desktop\\LECrafter\\LordMotas.github.io\\last-epoch-crafting-sim\\src\\data\\affixes.json';

function readCsv(p) {
  const raw = fs.readFileSync(p, 'utf8');
  const lines = raw.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return [];
  const hdr = lines.shift().split('|').map(h => h.trim());
  return lines.map(line => {
    const cols = line.split('|');
    const row = {};
    hdr.forEach((h, i) => row[h] = cols[i] !== undefined ? cols[i].trim() : '');
    return row;
  });
}

function parseRangeCell(s) {
  if (!s) return null;
  if (s.toLowerCase() === 'x') return null;
  // try match "num-num" where numbers may be negative/float
  const m = s.match(/^(-?\d+(\.\d+)?)[\s]*-[\s]*(-?\d+(\.\d+)?)/);
  if (m) return { min: parseFloat(m[1]), max: parseFloat(m[3]), raw: s };
  // single number?
  const n = Number(s);
  if (!Number.isNaN(n)) return { min: n, max: n, raw: s };
  return s;
}

function collectTiers(row) {
  const tiers = [];
  Object.keys(row).forEach(k => {
    if (/^T\d+$/i.test(k) && row[k] !== undefined) tiers.push(parseRangeCell(row[k]));
  });
  return tiers.length ? tiers : undefined;
}

function collectMultiTiers(row, prefix) {
  const tiers = [];
  Object.keys(row).forEach(k => {
    if (new RegExp('^' + prefix + '\\d+$','i').test(k)) tiers.push(parseRangeCell(row[k]));
  });
  return tiers.length ? tiers : undefined;
}

const datasets = files.map(readCsv);
const map = new Map();

datasets.forEach(rows => {
  rows.forEach(row => {
    const idKey = row.AffixID || row.AffixId || row.affixID || row.affixId;
    if (!idKey) return;
    const id = String(Number(idKey) || idKey);
    const existing = map.get(id) || { id };
    // generic merge
    Object.keys(row).forEach(k => {
      if (k === '' || k == null) return;
      const val = row[k];
      if (val === '') return;
      // prefer parsed numeric for common numeric fields
      if (/^LevelReq$/i.test(k) || /^LevelReq$/i.test(k) || /^Weight$/i.test(k) || /^rerollChance$/i.test(k)) {
        const num = Number(val);
        existing[k] = Number.isNaN(num) ? val : num;
        return;
      }
      // text fields
      existing[k] = existing[k] || val;
    });
    // collect tiers and MT tiers if present in this row
    const t = collectTiers(row);
    if (t) existing.tiers = existing.tiers || t;
    const mt = collectMultiTiers(row, 'MT');
    if (mt) existing.multiTiers = existing.multiTiers || mt;
    // collect explicit fields from AffixData_3 style
    if (row.Type1) existing.type1 = existing.type1 || row.Type1;
    if (row.Property1) existing.property1 = existing.property1 || row.Property1;
    if (row.Type2) existing.type2 = existing.type2 || row.Type2;
    if (row.Property2) existing.property2 = existing.property2 || row.Property2;
    // store canonical name/title
    if (row.AffixName) existing.name = existing.name || row.AffixName;
    if (row.AffixTitle) existing.title = existing.title || row.AffixTitle;
    map.set(id, existing);
  });
});

// Normalize/parse some known fields and build final array
const affixes = Array.from(map.values()).map(a => {
  const out = {
    id: a.id,
    name: a.AffixName || a.name || null,
    title: a.AffixTitle || a.title || null,
    canRollOn: a.canRollOn || null,
    rerollChance: (a.rerollChance !== undefined ? Number(a.rerollChance) : (a.rerollChance === '' ? null : null)),
    levelReq: (a.LevelReq !== undefined ? Number(a.LevelReq) : (a.LevelReq === '' ? null : null)),
    weight: (a.Weight !== undefined ? Number(a.Weight) : (a.Weight === '' ? null : null)),
    type: a.Type || a.type || null,
    hueShift: a.HueShift !== undefined ? Number(a.HueShift) : (a.hueShift !== undefined ? Number(a.hueShift) : null),
    saturation: a.Saturation !== undefined ? Number(a.Saturation) : (a.saturation !== undefined ? Number(a.saturation) : null),
    group: a.Group || a.group || null,
    type1: a.type1 || null,
    property1: a.property1 || null,
    type2: a.type2 || null,
    property2: a.property2 || null,
    tiers: a.tiers || a.Tiers || undefined,
    multiTiers: a.multiTiers || undefined,
    raw: a
  };
  // remove undefined raw heavy fields to keep file small
  if (out.raw && out.raw.id) delete out.raw.id;
  return out;
});

// sort by numeric id where possible
affixes.sort((x,y)=> {
  const xi = Number(x.id), yi = Number(y.id);
  if (!Number.isNaN(xi) && !Number.isNaN(yi)) return xi - yi;
  return String(x.id).localeCompare(String(y.id));
});

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(affixes, null, 2), 'utf8');
console.log(`Wrote ${affixes.length} affixes to ${outPath}`);