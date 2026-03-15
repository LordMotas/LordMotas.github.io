const fs = require('fs');
const path = require('path');

const inPath = path.join(__dirname, '..', 'src', 'data', 'items.json');
const outPath = path.join(__dirname, '..', 'src', 'data', 'items.js');

const json = fs.readFileSync(inPath, 'utf8');

let items;
try {
  items = JSON.parse(json);
} catch (e) {
  // fallback: write raw if parse fails
  const content = `// Auto-generated from items.json\nwindow.ITEMS = ${json};\n`;
  fs.writeFileSync(outPath, content, 'utf8');
  console.log('Wrote', outPath);
  process.exit(0);
}

function isIdolItem(it) {
  if (!it || typeof it !== 'object') return false;
  const check = s => typeof s === 'string' && s.toLowerCase().includes('idol');
  if (check(it.name) || check(it.id) || check(it.key) || check(it.type)) return true;
  if (Array.isArray(it.types) && it.types.some(check)) return true;
  if (Array.isArray(it.tags) && it.tags.some(check)) return true;
  return false;
}

function isBlessingItem(it) {
    if (!it || typeof it !== 'object') return false;
    const check = s => typeof s === 'string' && s.toLowerCase().includes('blessing');
    if (check(it.baseTypeName) || check(it.id) || check(it.key) || check(it.type)) return true;
    if (Array.isArray(it.types) && it.types.some(check)) return true;
    if (Array.isArray(it.tags) && it.tags.some(check)) return true;
    return false;
}

let filtered = items;
if (Array.isArray(items)) {
  filtered = items.filter(i => !isIdolItem(i) && !isBlessingItem(i));
} else if (items && typeof items === 'object') {
  // if root object contains an items array, filter it
  if (Array.isArray(items.items)) {
    items.items = items.items.filter(i => !isIdolItem(i) && !isBlessingItem(i));
    filtered = items;
  }
}

const outJson = JSON.stringify(filtered, null, 2);
const content = `// Auto-generated from items.json\nwindow.ITEMS = ${outJson};\n`;
fs.writeFileSync(outPath, content, 'utf8');
console.log('Wrote', outPath);