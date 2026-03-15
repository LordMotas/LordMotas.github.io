const fs = require('fs');
const path = require('path');

const csvPath = 'c:\\Users\\lordm\\Desktop\\LECrafter\\LordMotas.github.io\\last-epoch-crafting-sim\\src\\data\\CSV\\FullItemData.csv';
const outPath = 'c:\\Users\\lordm\\Desktop\\LECrafter\\LordMotas.github.io\\last-epoch-crafting-sim\\src\\data\\items.json';

function parseBool(s) {
  if (!s) return false;
  s = s.trim().toLowerCase();
  return s === 'true' || s === '1';
}

function toNumberOrNull(v) {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

function splitAndParseNums(s) {
  if (!s) return [];
  return s.split(';').map(x => {
    const n = Number(x);
    return Number.isNaN(n) ? x.trim() : n;
  });
}

const raw = fs.readFileSync(csvPath, 'utf8');
const lines = raw.split(/\r?\n/).filter(l => l.trim().length > 0);
if (lines.length === 0) {
  console.error('CSV is empty');
  process.exit(1);
}

const header = lines.shift().split('|').map(h => h.trim());
const items = lines.map((line, idx) => {
  const cols = line.split('|');
  const row = {};
  header.forEach((h, i) => row[h] = (cols[i] !== undefined ? cols[i].trim() : ''));

  const item = {
    id: `${row.BaseTypeID}_${row.subTypeID}`,
    baseTypeID: toNumberOrNull(row.BaseTypeID),
    baseTypeName: row.BaseTypeName || null,
    subTypeID: toNumberOrNull(row.subTypeID),
    name: row.subTypeName || null,
    isWeapon: parseBool(row.isWeapon),
    levelReq: toNumberOrNull(row.levelReq),
    classReq: row.classReq || null,
    attackRate: toNumberOrNull(row.attackRate),
    cannotDrop: parseBool(row.cannotDrop),
    implicitNamesRaw: row.ImplicitNames || '',
    implicitNames: row.ImplicitNames ? row.ImplicitNames.split(';').map(s => s.trim()).filter(Boolean) : [],
    implicitsMin: splitAndParseNums(row.ImplicitsMin || ''),
    implicitsMax: splitAndParseNums(row.ImplicitsMax || '')
  };

  return item;
});

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(items, null, 2), 'utf8');
console.log(`Wrote ${items.length} items to ${outPath}`);