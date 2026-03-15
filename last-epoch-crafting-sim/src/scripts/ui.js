// Cleaned UI script: single IIFE, prefers window.ITEMS / window.AFFIXES,
// now requires tier selection for every chosen affix and shows tier ranges.
(async () => {
  // Elements
  const baseSel = document.getElementById('baseTypeSelect');
  const itemSel = document.getElementById('itemSelect');
  const details = document.getElementById('itemDetails');
  const detailsName = document.getElementById('detailsName');
  const detailsList = document.getElementById('detailsList');
  const resetBtn = document.getElementById('resetBtn');

  // Affix controls
  const forgingInput = document.getElementById('forgingPotential');
  const prefix1 = document.getElementById('prefix1');
  const prefix2 = document.getElementById('prefix2');
  const suffix1 = document.getElementById('suffix1');
  const suffix2 = document.getElementById('suffix2');
  const sealedSel = document.getElementById('sealedAffix');

  const prefix1Tier = document.getElementById('prefix1Tier');
  const prefix2Tier = document.getElementById('prefix2Tier');
  const suffix1Tier = document.getElementById('suffix1Tier');
  const suffix2Tier = document.getElementById('suffix2Tier');
  const sealedTier = document.getElementById('sealedTier');

  const prefix1Range = document.getElementById('prefix1Range');
  const prefix2Range = document.getElementById('prefix2Range');
  const suffix1Range = document.getElementById('suffix1Range');
  const suffix2Range = document.getElementById('suffix2Range');
  const sealedRange = document.getElementById('sealedRange');

  const saveBtn = document.getElementById('saveItem');
  const affixMsg = document.getElementById('affixMessage');

  // Data paths (used only as fallback if generated JS not present)
  const itemsPath = '../data/items.json';
  const affixesPath = '../data/affixes.json';

  // Load data: prefer inlined window variables (avoid CORS), fallback to fetch
  let items = window.ITEMS || null;
  let affixes = window.AFFIXES || null;

  if (!items) {
    try {
      const res = await fetch(itemsPath);
      items = await res.json();
    } catch (e) {
      baseSel.innerHTML = '<option value="">Failed to load items.json</option>';
      console.error('Failed loading items.json:', e);
      return;
    }
  }

  if (!affixes) {
    try {
      const res = await fetch(affixesPath);
      affixes = await res.json();
    } catch (e) {
      console.warn('Failed loading affixes.json via fetch; continuing with empty affix list', e);
      affixes = [];
    }
  }

  // small helpers
  const tierSelectMap = {
    prefix1: prefix1Tier, prefix2: prefix2Tier,
    suffix1: suffix1Tier, suffix2: suffix2Tier,
    sealedAffix: sealedTier
  };
  const rangeSpanMap = {
    prefix1: prefix1Range, prefix2: prefix2Range,
    suffix1: suffix1Range, suffix2: suffix2Range,
    sealedAffix: sealedRange
    };

    function onTierChange(ev) {
    const tierSel = ev.target;
    const slotKey = Object.keys(tierSelectMap).find(k => tierSelectMap[k] === tierSel);
    if (!slotKey) return;
    const affSelect = document.getElementById(slotKey);
    const aff = getAffixById(affSelect?.value);
    const tierObj = getSelectedTierObj(aff?.id, tierSel.value);
    setRangeForSlot(slotKey, tierObj);
    }

  function getTierBounds(tierObj) {
    if (!tierObj) return null;
    if (Number.isFinite(tierObj.min) && Number.isFinite(tierObj.max)) return { min: tierObj.min, max: tierObj.max };
    const raw = String(tierObj.raw || '').trim();
    const m = raw.match(/(-?\d+(?:\.\d+)?)[^\d\-]+(-?\d+(?:\.\d+)?)/);
    if (m) return { min: Number(m[1]), max: Number(m[2]) };
    const single = raw.match(/^(-?\d+(?:\.\d+)?)$/);
    if (single) return { min: Number(single[1]), max: Number(single[1]) };
    return null;
  }

  function setRangeForSlot(slotKey, tierObj) {
    const rangeEl = rangeSpanMap[slotKey];
    if (!rangeEl) return;
    const bounds = getTierBounds(tierObj);
    if (rangeEl.tagName === 'INPUT') {
      if (!bounds) {
        rangeEl.value = '';
        rangeEl.min = '';
        rangeEl.max = '';
        rangeEl.step = 'any';
        rangeEl.disabled = true;
        rangeEl.placeholder = 'Tier Range Unknown';
      } else {
        rangeEl.disabled = false;
        rangeEl.min = bounds.min;
        rangeEl.max = bounds.max;
        rangeEl.step = Number.isInteger(bounds.min) && Number.isInteger(bounds.max) ? '1' : '0.01';
        rangeEl.placeholder = `${bounds.min} to ${bounds.max}`;
        if (!rangeEl.value) rangeEl.value = bounds.min;
      }
    } else {
      rangeEl.textContent = bounds ? `${bounds.min} - ${bounds.max}` : '';
    }
  }

  function getSelectedTierObj(affixId, tierVal) {
    const aff = getAffixById(affixId);
    if (!aff || !tierVal) return null;
    const chosen = Number(tierVal) - 1;
    const tiers = getTiersForAffix(aff);
    return tiers[chosen] || null;
  }

  [prefix1Range, prefix2Range, suffix1Range, suffix2Range, sealedRange].forEach(r => {
    if (r && r.tagName === 'INPUT') {
      r.addEventListener('input', () => {
        const min = Number(r.min);
        const max = Number(r.max);
        const val = Number(r.value);
        if (!Number.isFinite(val) || (Number.isFinite(min) && val < min) || (Number.isFinite(max) && val > max)) {
          r.classList.add('invalid');
        } else {
          r.classList.remove('invalid');
        }
      });
    }
  });

  const allAffixSelects = () => [prefix1, prefix2, suffix1, suffix2, sealedSel].filter(Boolean);
  const selectedAffixIds = () => new Set(allAffixSelects().map(s => s.value).filter(Boolean));

  function getAffixById(id) {
    if (!id) return null;
    return (affixes || []).find(a => String(a.id) === String(id)) || null;
  }

  function getTiersForAffix(aff) {
    // prefer aff.tiers (array of parsed tier objects), otherwise try other fields
    if (!aff) return [];
    if (Array.isArray(aff.tiers) && aff.tiers.length) return aff.tiers;
    if (Array.isArray(aff.multiTiers) && aff.multiTiers.length) return aff.multiTiers;
    // try raw fields T1..T7 if present
    const t = [];
    for (let i = 1; i <= 7; i++) {
      const key = 'T' + i;
      if (aff[key]) t.push({ raw: aff[key] });
    }
    return t;
  }

  function renderTierLabel(tierObj, index) {
    if (!tierObj) return `Tier ${index}`;
    const raw = tierObj.raw || (tierObj.min !== undefined && tierObj.max !== undefined ? `${tierObj.min}-${tierObj.max}` : '');
    const exalted = index >= 6;
    return `Tier ${index}${exalted ? ' (Exalted)' : ''} — ${raw}`;
  }

  function populateTierSelectForAffixSlot(affixSelectEl) {
    const slotId = affixSelectEl.id; // e.g., prefix1
    const tierSel = tierSelectMap[slotId];
    const rangeSpan = rangeSpanMap[slotId];
    if (!tierSel) return;
    const affId = affixSelectEl.value;
    if (!affId) {
      tierSel.innerHTML = `<option value="">Tier</option>`;
      tierSel.disabled = true;
      if (rangeSpan) rangeSpan.textContent = '';
      return;
    }
    const aff = getAffixById(affId);
    const tiers = getTiersForAffix(aff) || [];
    // only allow tiers 1..tiers.length. Mark 6-7 as exalted when present.
    const opts = ['<option value="">Tier</option>'];
    for (let i = 0; i < tiers.length; i++) {
      const idx = i + 1;
      opts.push(`<option value="${idx}">${escapeHtml(renderTierLabel(tiers[i], idx))}</option>`);
    }
    // if no tier info, still present 1..5 by default to satisfy requirement (avoid empty)
    if (tiers.length === 0) {
      for (let i = 1; i <= 5; i++) opts.push(`<option value="${i}">${escapeHtml(`Tier ${i} — ?`)}</option>`);
    }
    tierSel.innerHTML = opts.join('');
    tierSel.disabled = false;
    // clear displayed range until tier is chosen
    if (rangeSpan) setRangeForSlot(slotId, null);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }

  function formatNumber(v, asPercent = false) {
    const n = Number(v);
    if (!Number.isFinite(n)) return '?';
    if (asPercent) {
      const x = n * 100;
      return `${x.toFixed(x % 1 === 0 ? 0 : 2)}%`;
    }
    if (Math.abs(n - Math.round(n)) < 1e-9) return String(Math.round(n));
    return Number(n.toFixed(2)).toString();
  }

  function humanizeToken(token) {
    if (!token) return '';
    const cleaned = token.replace(/_/g, ' ');
    // split camelcase
    const spaced = cleaned.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
    return spaced.trim().replace(/\b\w/g, c => c.toUpperCase());
  }

  function formatImplicitTarget(segments) {
    const parts = segments.filter(x => x && !/^(None|Any|All)$/i.test(x));
    if (parts.length === 0) return '';
    // check AilmentChance explicit case
    const chanceToken = parts.find(t => /AilmentChance$/i.test(t));
    if (chanceToken) return 'Chance to apply Ailment on Hit';
    const genericChance = parts.find(t => /Chance$/i.test(t));
    if (genericChance) {
      const base = genericChance.replace(/Chance$/i, '');
      const thing = humanizeToken(base || 'chance').toLowerCase();
      return `Chance to apply ${thing}${/(OnHit|Hit)$/i.test(genericChance) ? '' : ' on Hit'}`;
    }
    // popular pattern: Melee, Damage
    if (parts.length >= 2 && /Damage$/i.test(parts[parts.length - 1])) {
      return parts.map(humanizeToken).join(' ');
    }
    return parts.map(humanizeToken).join(' ');
  }

  function parseImplicitDescription(item) {
    const names = item.implicitNames || [];
    const mins = item.implicitsMin || [];
    const maxs = item.implicitsMax || [];
    const out = [];
    for (let i = 0; i < names.length; i++) {
      const raw = String(names[i] || '').trim();
      if (!raw) continue;
      const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
      const action = (parts[0] || '').toUpperCase();
      const target = formatImplicitTarget(parts.slice(1));
      const min = mins[i];
      const max = maxs[i];
      const isChance = /Chance$/i.test(raw) || /Chance$/i.test(target);
      const minVal = Number(min);
      const maxVal = Number(max);
      const same = Number.isFinite(minVal) && Number.isFinite(maxVal) && Math.abs(minVal - maxVal) < 1e-9;
      const plusOr = action === 'ADDED' || action === 'INCREASED' ? '+' : '';
      let values;
      if (isChance) {
        const minStr = formatNumber(minVal, true);
        const maxStr = formatNumber(maxVal, true);
        values = same ? minStr : `${minStr} to ${maxStr}`;
        out.push(`${plusOr}${same ? values : `(${values})`} ${target}`.replace(/\s+/g, ' ').trim());
      } else {
        if (Number.isFinite(minVal) && Number.isFinite(maxVal)) {
          if (same) values = formatNumber(minVal);
          else values = `${formatNumber(minVal)} to ${formatNumber(maxVal)}`;
        } else {
          values = '?';
        }
        out.push(`${plusOr}${values} ${target}`.replace(/\s+/g, ' ').trim());
      }
    }
    return out;
  }

  // Group items by baseTypeName
  const grouped = (items || []).reduce((m, it) => {
    const k = it.baseTypeName || 'Unknown';
    if (!m[k]) m[k] = [];
    m[k].push(it);
    return m;
  }, {});

  // Populate base type select
  const baseNames = Object.keys(grouped).sort();
  baseSel.innerHTML = `<option value="">Select Base Type</option>` + baseNames.map(n => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join('');
  baseSel.addEventListener('change', () => {
    const base = baseSel.value;
    details.classList.add('hidden');
    if (!base) {
      itemSel.innerHTML = '<option value="">Select Base Type first</option>';
      itemSel.disabled = true;
      return;
    }
    const list = grouped[base].slice().sort((a, b) => (a.levelReq || 0) - (b.levelReq || 0));
    itemSel.innerHTML = `<option value="">Choose Item</option>` + list.map(it => `<option value="${escapeHtml(it.id)}">${escapeHtml(it.name)}${it.levelReq ? ' (lvl ' + it.levelReq + ')' : ''}</option>`).join('');
    itemSel.disabled = false;
  });

  // Tokenize base/subtype names for canRollOn checks
  function tokensForBase(item) {
    const out = new Set();
    if (!item) return out;

    const baseRaw = (item.baseTypeName || '').trim().toUpperCase();
    const subtypeRaw = (item.name || '').trim().toUpperCase();
    const combined = (baseRaw + ' ' + subtypeRaw).trim();

    // Basic tokens from base and subtype (singular, underscored, plural)
    if (baseRaw) {
      out.add(baseRaw); // HELMETS
      if (baseRaw.endsWith('S')) out.add(baseRaw.slice(0, -1)); // HELMET
      out.add(baseRaw.replace(/\s+/g, '_')); // BODY_ARMOR
      if (baseRaw.replace(/\s+/g, '_').endsWith('S')) out.add(baseRaw.replace(/\s+/g, '_').slice(0, -1));
    }
    if (subtypeRaw) {
      out.add(subtypeRaw);
      out.add(subtypeRaw.replace(/\s+/g, '_'));
    }

    // Weapon handedness mapping: detect one/two handed and add token mappings
    const isOneHanded = /\b(1H|1 H|ONE[-\s]?HANDED|ONE_HANDED)\b/.test(combined);
    const isTwoHanded = /\b(2H|2 H|TWO[-\s]?HANDED|TWO_HANDED|2H_POLEARM|POLEARM|POLEARMS)\b/.test(combined);

    const addToken = (tok) => { out.add(tok); out.add(tok + 'S'); };

    if (isOneHanded) {
      if (/\bAXE|AXES\b/.test(combined)) addToken('ONE_HANDED_AXE');
      if (/\bDAGGER|DAGGERS\b/.test(combined)) addToken('ONE_HANDED_DAGGER');
      if (/\bSWORD|SWORDS\b/.test(combined)) addToken('ONE_HANDED_SWORD');
      if (/\bFIST|FISTS\b/.test(combined)) addToken('ONE_HANDED_FIST');
      if (/\bMACE|MACES\b/.test(combined)) addToken('ONE_HANDED_MACE');
      if (/\bSCEPTRE|SCEPTRES|SCEPTER|SCEPTERS\b/.test(combined)) addToken('ONE_HANDED_SCEPTRE');
      out.add('1H'); out.add('1H_AXE'); out.add('1H_SWORD'); out.add('1H_DAGGER'); out.add('1H_MACE');
    }

    if (isTwoHanded) {
      if (/\bAXE|AXES\b/.test(combined)) addToken('TWO_HANDED_AXE');
      if (/\bMACE|MACES\b/.test(combined)) addToken('TWO_HANDED_MACE');
      if (/\bSPEAR|SPEARS\b/.test(combined)) addToken('TWO_HANDED_SPEAR');
      if (/\bPOLEARM|POLEARMS\b/.test(combined)) addToken('TWO_HANDED_SPEAR'); // 2H Polearm -> TWO_HANDED_SPEAR
      if (/\bSWORD|SWORDS\b/.test(combined)) addToken('TWO_HANDED_SWORD');
      if (/\bSTAFF|STAVES\b/.test(combined)) addToken('TWO_HANDED_STAFF');
      out.add('2H'); out.add('2H_SWORD'); out.add('2H_AXE');
    }

    return out;
  }

  function affixCanApply(aff, item) {
    if (!aff || !aff.canRollOn) return false;
    const allowed = String(aff.canRollOn || '').split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    if (allowed.length === 0) return false;
    if (allowed.includes('NONE')) return false;
    const tokens = tokensForBase(item);
    for (const a of allowed) {
      if (a === 'X' || a === '') continue;
      if (tokens.has(a)) return true;
    }
    return false;
  }

  function buildPoolsForItem(it) {
    const prefixes = affixes.filter(a => String(a.type || '').toUpperCase() === 'PREFIX' && affixCanApply(a, it));
    const suffixes = affixes.filter(a => String(a.type || '').toUpperCase() === 'SUFFIX' && affixCanApply(a, it));
    return { prefixes, suffixes };
  }

  function populateSelect(selectEl, pool, includeBlank = true) {
    if (!selectEl) return;
    const blank = includeBlank ? `<option value="">N/A</option>` : '';
    selectEl.innerHTML = blank + pool.map(a => `<option value="${escapeHtml(a.id)}">${escapeHtml(a.name || '[no name]')}${a.title ? ' (' + escapeHtml(a.title) + ')' : ''}</option>`).join('');
  }

  function refreshDisabledOptions() {
    const selected = selectedAffixIds();
    allAffixSelects().forEach(sel => {
      const cur = sel.value;
      Array.from(sel.options).forEach(opt => {
        if (!opt.value) { opt.disabled = false; return; }
        const selectedElsewhere = selected.has(opt.value) && opt.value !== cur;
        opt.disabled = selectedElsewhere;
      });
    });
    // validation message
    const ids = Array.from(selected);
    affixMsg.textContent = (ids.length !== new Set(ids).size) ? 'Duplicate affix selected — each affix may only appear once.' : '';
  }

  // When affix select changes: populate its tier select & clear range text
  function onAffixSlotChange(ev) {
    const sel = ev.target;
    populateTierSelectForAffixSlot(sel);
    // ensure uniqueness enforcement updates options immediately
    refreshDisabledOptions();
  }

  // wire listeners
  [prefix1, prefix2, suffix1, suffix2, sealedSel].forEach(s => s && s.addEventListener('change', onAffixSlotChange));
  [prefix1Tier, prefix2Tier, suffix1Tier, suffix2Tier, sealedTier].forEach(t => t && t.addEventListener('change', onTierChange));

  // Update affix option pools when item selected
  itemSel.addEventListener('change', () => {
    const id = itemSel.value;
    if (!id) { details.classList.add('hidden'); return; }
    const it = (items || []).find(x => String(x.id) === String(id));
    if (!it) { details.classList.add('hidden'); return; }

    // show details
    detailsName.textContent = it.name;
    detailsList.innerHTML = '';

    const implicitStrings = parseImplicitDescription(it);
    if (implicitStrings.length > 0) {
      detailsList.appendChild(Object.assign(document.createElement('li'), { textContent: `Implicit(s): ${implicitStrings[0]}` }));
      for (let j = 1; j < implicitStrings.length; j++) {
        detailsList.appendChild(Object.assign(document.createElement('li'), { textContent: ` ${implicitStrings[j]}` }));
      }
    } else {
      detailsList.appendChild(Object.assign(document.createElement('li'), { textContent: 'Implicit(s): —' }));
    }

    details.classList.remove('hidden');

    // reset affix fields and populate pools
    if (forgingInput) forgingInput.value = 0;
    [prefix1, prefix2, suffix1, suffix2, sealedSel].forEach(s => { if (s) s.selectedIndex = 0; });
    [prefix1Tier, prefix2Tier, suffix1Tier, suffix2Tier, sealedTier].forEach(t => { if (t) { t.innerHTML = `<option value="">Tier</option>`; t.disabled = true; }});
    [prefix1Range, prefix2Range, suffix1Range, suffix2Range, sealedRange].forEach(r => {
      if (!r) return;
      if (r.tagName === 'INPUT') {
        r.value = '';
        r.min = '';
        r.max = '';
        r.disabled = true;
        r.classList.remove('invalid');
        r.textContent = '';
        r.placeholder = 'Tier Value';
      } else {
        r.textContent = '';
      }
    });

    const { prefixes, suffixes } = buildPoolsForItem(it);
    const sealedMap = {};
    prefixes.forEach(a => sealedMap[a.id] = a);
    suffixes.forEach(a => sealedMap[a.id] = a);
    const sealedPool = Object.values(sealedMap);

    populateSelect(prefix1, prefixes);
    populateSelect(prefix2, prefixes);
    populateSelect(suffix1, suffixes);
    populateSelect(suffix2, suffixes);
    populateSelect(sealedSel, sealedPool);

    refreshDisabledOptions();
  });

  resetBtn.addEventListener('click', () => {
    baseSel.value = '';
    itemSel.innerHTML = '<option value="">Select base type first</option>';
    itemSel.disabled = true;
    details.classList.add('hidden');
  });

  saveBtn && saveBtn.addEventListener('click', () => {
    const selItemId = itemSel.value;
    if (!selItemId) { affixMsg.textContent = 'No item selected.'; return; }

    // gather affix selections and required tiers
    const selections = [
      { slot:'prefix1', id: prefix1.value, tierSel: prefix1Tier, valueEl: prefix1Range },
      { slot:'prefix2', id: prefix2.value, tierSel: prefix2Tier, valueEl: prefix2Range },
      { slot:'suffix1', id: suffix1.value, tierSel: suffix1Tier, valueEl: suffix1Range },
      { slot:'suffix2', id: suffix2.value, tierSel: suffix2Tier, valueEl: suffix2Range },
      { slot:'sealedAffix', id: sealedSel.value, tierSel: sealedTier, valueEl: sealedRange }
    ];

    for (const s of selections) {
      if (!s.id) continue;
      if (!s.tierSel?.value) { affixMsg.textContent = `Please select a tier for ${s.slot}.`; return; }
      const v = Number(s.valueEl?.value);
      if (!Number.isFinite(v)) { affixMsg.textContent = `Enter a value for ${s.slot}.`; return; }
      const tierObj = getSelectedTierObj(s.id, s.tierSel.value);
      const bounds = getTierBounds(tierObj);
      if (bounds && (v < bounds.min || v > bounds.max)) {
        affixMsg.textContent = `${s.slot} value must be between ${bounds.min} and ${bounds.max}.`; return;
      }
    }

    const obj = {
      itemId: selItemId,
      forgingPotential: Number(forgingInput?.value) || 0,
      prefixes: [
        prefix1.value ? { id: prefix1.value, tier: Number(prefix1Tier.value), value: Number(prefix1Range.value) } : null,
        prefix2.value ? { id: prefix2.value, tier: Number(prefix2Tier.value), value: Number(prefix2Range.value) } : null
      ].filter(Boolean),
      suffixes: [
        suffix1.value ? { id: suffix1.value, tier: Number(suffix1Tier.value), value: Number(suffix1Range.value) } : null,
        suffix2.value ? { id: suffix2.value, tier: Number(suffix2Tier.value), value: Number(suffix2Range.value) } : null
      ].filter(Boolean),
      sealed: sealedSel.value ? { id: sealedSel.value, tier: Number(sealedTier.value), value: Number(sealedRange.value) } : null
    };

    // uniqueness guard
    const used = [
      ...obj.prefixes.map(p => p.id),
      ...obj.suffixes.map(s => s.id),
      obj.sealed?.id
    ].filter(Boolean);
    if (used.length !== new Set(used).size) {
      affixMsg.textContent = 'Each affix must be unique.';
      return;
    }

    const saved = JSON.parse(localStorage.getItem('lecraft_saved') || '[]');
    saved.push(obj);
    localStorage.setItem('lecraft_saved', JSON.stringify(saved));
    affixMsg.textContent = 'Saved locally.';
    setTimeout(() => affixMsg.textContent = '', 2000);
  });

  // Initial state
  itemSel.disabled = true;
  details.classList.add('hidden');
})();