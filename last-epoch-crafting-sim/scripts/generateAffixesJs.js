const fs = require('fs');
const path = require('path');

const inPath = path.join(__dirname, '..', 'src', 'data', 'affixes.json');
const outPath = path.join(__dirname, '..', 'src', 'data', 'affixes.js');

if (!fs.existsSync(inPath)) {
  console.error('affixes.json not found:', inPath);
  process.exit(1);
}

const json = fs.readFileSync(inPath, 'utf8');

let data;
try {
  data = JSON.parse(json);
} catch (e) {
  console.error('Error parsing affixes.json:', e);
  process.exit(1);
}

function isIdolAffix(aff) {
  if (!aff || typeof aff !== 'object') return false;
  const check = s => typeof s === 'string' && s.toLowerCase().includes('idol');
  if (check(aff.name) || check(aff.id) || check(aff.key) || check(aff.type)) return true;
  if (Array.isArray(aff.types) && aff.types.some(check)) return true;
  if (Array.isArray(aff.tags) && aff.tags.some(check)) return true;
  return false;
}

function processAffix(aff) {
  if (!aff) return;
  const tiers = aff.tiers || aff.tier || [];
  if (!Array.isArray(tiers)) return;
  tiers.forEach(tier => {
    if (tier == null) return;

    let changed = false;
    if (typeof tier.min === 'number' && Math.abs(tier.min) < 1) {
      tier.min = Math.round(tier.min * 100);
      changed = true;
    }
    if (typeof tier.max === 'number' && Math.abs(tier.max) < 1) {
      //console.log("Scaling max for affix", aff.id || aff.name, "tier", tier.raw || tier.max, "->", tier.max * 100);
      tier.max = Math.round(tier.max * 100);
      changed = true;
    }
    tier.raw = String(tier.min + "-" + tier.max);
    if(changed)
        tier.raw += '%';
//    if (typeof tier.raw === 'string') {
//      const rawTrim = tier.raw.trim();
//      const rawNum = Number(rawTrim.replace(/%/g, ''));
//      if (!tier.raw.endsWith('%') && !Number.isNaN(rawNum) && Math.abs(rawNum) < 1) {
//        tier.raw = (rawNum * 100) + '%';
//      } else if (changed && !tier.raw.endsWith('%')) {
//        tier.raw = tier.raw + '%';
//      }
//    } else if (changed && tier.raw == null) {
//      if (typeof tier.min === 'number') tier.raw = String(tier.min) + '%';
//    }
    if(aff.name === 'Void Penetration') {
        console.log("Current values of VPen: ", tier.min, " ", tier.max, " ", tier.raw);
      }
  });
}

function processDataRoot(root) {
  if (Array.isArray(root)) {
    // filter out idol affixes
    return root.filter(a => !isIdolAffix(a));
  } else if (root && typeof root === 'object') {
    if (Array.isArray(root.affixes)) {
      root.affixes = root.affixes.filter(a => !isIdolAffix(a));
    }
    return root;
  }
  return root;
}

data = processDataRoot(data);

if (Array.isArray(data.affixes)) {
  data.affixes.forEach(processAffix);
} else if (Array.isArray(data)) {
  data.forEach(processAffix);
} else {
  Object.values(data).forEach(v => {
    if (v && typeof v === 'object') {
      if (Array.isArray(v)) v.forEach(processAffix);
      else processAffix(v);
    }
  });
}

const content = `// Auto-generated from affixes.json\nwindow.AFFIXES = ${JSON.stringify(data, null, 2)};\n`;
fs.writeFileSync(outPath, content, 'utf8');
console.log('Wrote', outPath);