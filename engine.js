'use strict';

/* =========================================================
   ScrachMo v2 — personajes múltiples + bloques anidados
   ========================================================= */

/* ---------------- state ---------------- */
let lang = (() => {
  const saved = store.get('scrachmo_lang');
  if (saved && UI[saved]) return saved;
  const nav = (navigator.language || 'es').slice(0, 2).toLowerCase();
  return UI[nav] ? nav : 'es';
})();

let sprites = [];
let selectedSpriteId = null;
let variables = {};
let hiddenVars = {};
let stageBg = 0;
let showScore = false;
let score = 0;
let isRunning = false;
let multiOn = false;
let currentFilter = 'all';
let searchTerm = '';
let collapsed = {};
let varFormOpen = false;
let varsSig = '';
let uidCounter = 0;
let blockDrag = null;
let paletteDrag = null;
let palettePress = null;
let paletteTimer = null;
let spriteDrag = null;
let audioCtx = null;
let scoreFired = false;
let gameScrollY = 0;
let suppressStageClick = false;
let toastTimer = null;
let saveTimer = null;
const sayTimers = new Map();
const sayTexts = new Map();

const VAR_COLORS = [
  { v: '#4f46e5', t: '#eef2ff' },
  { v: '#059669', t: '#ecfdf5' },
  { v: '#d97706', t: '#fffbeb' },
  { v: '#db2777', t: '#fdf2f8' },
  { v: '#0284c7', t: '#eff6ff' }
];

const BG = [
  ['#dbeafe', '#f8fcff'],
  ['#dcfce7', '#f7fee7'],
  ['#fef9c3', '#fffbeb'],
  ['#fce7f3', '#fdf2f8'],
  ['#ede9fe', '#f5f3ff'],
  ['#1e293b', '#334155']
];

const SPRITE_CHOICES = ['🐱', '🐶', '🐸', '🐼', '🦊', '🐰', '🐵', '🐧', '🦄', '🐲', '🤖', '⭐', '🚀', '🍎', '⚽', '🎈'];

/* ---------------- helpers ---------------- */
function uid(prefix) {
  uidCounter++;
  return prefix + uidCounter.toString(36) + Math.random().toString(36).slice(2, 5);
}

function fmt(v) {
  return String(Math.round(Number(v) * 10) / 10);
}

function normDir(d) {
  const n = Number(d) || 0;
  return ((n + 180) % 360 + 360) % 360 - 180;
}

/* rotation style: 'all' (gira todo) | 'leftright' (voltea) | 'none' (fijo) */
function normRot(v) {
  return (v === 'leftright' || v === 'none') ? v : 'all';
}

function spriteTransform(s) {
  const size = (Number(s.size) || 100) / 100;
  const dir = Number(s.dir) || 0;
  const rot = normRot(s.rot);
  if (rot === 'none') return 'translate(-50%,-50%) scale(' + size + ')';
  if (rot === 'leftright') {
    const flip = dir < 0 ? -1 : 1;
    return 'translate(-50%,-50%) scale(' + (flip * size) + ',' + size + ')';
  }
  return 'translate(-50%,-50%) rotate(' + (dir - 90) + 'deg) scale(' + size + ')';
}

function fold(s) {
  return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function getSprite(id) {
  return sprites.find(s => s.id === id) || null;
}

function selectedSprite() {
  return getSprite(selectedSpriteId) || sprites[0] || null;
}

function spriteIndex(id) {
  return sprites.findIndex(s => s.id === id);
}

function findSpriteEl(id) {
  const layer = $('#spritesLayer');
  if (!layer) return null;
  return Array.from(layer.children).find(el => el.dataset.sprite === id) || null;
}

function posLeft(s) { return 50 + (s.x / 4.8); }
function posTop(s) { return 50 - (s.y / 3.6); }

/* ---------------- project ---------------- */
function decodeShare(s) {
  try { return JSON.parse(decodeURIComponent(escape(atob(s)))); } catch (e) { return null; }
}

function hiddenList() {
  return Object.keys(hiddenVars).filter(k => hiddenVars[k]);
}

function loadHidden(data) {
  hiddenVars = {};
  if (Array.isArray(data)) {
    data.forEach(k => { if (typeof k === 'string') hiddenVars[k] = true; });
  } else if (data && typeof data === 'object') {
    Object.keys(data).forEach(k => { if (data[k]) hiddenVars[k] = true; });
  }
}

function makeNode(type, val) {
  const def = BYID[type];
  if (!def) return null;
  const node = {
    id: uid('b'),
    type: type,
    val: val !== undefined ? val : (def.def !== undefined ? def.def : 0)
  };
  if (def.c) {
    node.body = [];
    if (def.else) node.elseBody = [];
  }
  return node;
}

function defaultCode() {
  return [makeNode('when_flag'), makeNode('move', 20), makeNode('say', '¡Hola!')].filter(Boolean);
}

function createSpriteData(emoji, name, code) {
  return {
    id: uid('s'),
    name: name,
    emoji: emoji || '🐱',
    x: 0, y: 0, dir: 90, size: 100, visible: true, rot: 'all',
    code: code || []
  };
}

function normalizeNodes(list, seen) {
  if (!Array.isArray(list)) return [];
  if (!seen) seen = new Set();
  const out = [];
  list.forEach(raw => {
    if (!raw || typeof raw !== 'object') return;
    const type = raw.type || raw.id;
    const def = BYID[type];
    if (!def) return;
    if (type === 'show2' || type === 'hide2' || type === 'move2') return;
    let id = (typeof raw.id === 'string' && raw.id && raw.id !== type) ? raw.id : uid('b');
    if (seen.has(id)) id = uid('b');
    seen.add(id);
    const node = {
      id: id,
      type: type,
      val: raw.val !== undefined ? raw.val : (def.def !== undefined ? def.def : 0)
    };
    if (def.c) {
      node.body = normalizeNodes(raw.body, seen);
      if (def.else || Array.isArray(raw.elseBody)) node.elseBody = normalizeNodes(raw.elseBody, seen);
    }
    out.push(node);
  });
  return out;
}

function migrateOldCode(flat) {
  if (!Array.isArray(flat)) return [];
  const list = flat.filter(b => b && BYID[b.id] && b.id !== 'show2' && b.id !== 'hide2' && b.id !== 'move2');
  const out = [];
  for (let i = 0; i < list.length; i++) {
    const b = list[i];
    if (b.id === 'sino') {
      const prev = out[out.length - 1];
      if (prev && (prev.type === 'if_cond' || prev.type === 'if_score' || prev.type === 'if_tilt') && !prev.elseBody) {
        const next = list[i + 1];
        if (next && next.id !== 'sino') {
          const n = makeNode(next.id, next.val);
          if (n) { prev.elseBody = [n]; prev.type = 'if_else'; i++; }
        }
      }
      continue;
    }
    const node = makeNode(b.id, b.val);
    if (!node) continue;
    const def = BYID[b.id];
    if (def.c) {
      if (b.id === 'forever') {
        const rest = list.slice(i + 1).filter(x => x.id !== 'sino');
        node.body = rest.map(x => makeNode(x.id, x.val)).filter(Boolean);
        out.push(node);
        break;
      }
      const next = list[i + 1];
      if (next && next.id !== 'sino') {
        const n = makeNode(next.id, next.val);
        if (n) { node.body = [n]; i++; }
      }
    }
    out.push(node);
  }
  return out;
}

function normalizeSprites(list) {
  const out = [];
  const used = new Set();
  if (Array.isArray(list)) {
    list.forEach((raw, i) => {
      if (!raw || typeof raw !== 'object') return;
      let id = (typeof raw.id === 'string' && raw.id) ? raw.id : uid('s');
      if (used.has(id)) id = uid('s');
      used.add(id);
      const name = (typeof raw.name === 'string' && raw.name.trim())
        ? raw.name.trim().slice(0, 20)
        : (UI[lang].spriteDefault + ' ' + (i + 1));
      const emoji = (typeof raw.emoji === 'string' && raw.emoji) ? raw.emoji : '🐱';
      out.push({
        id: id,
        name: name,
        emoji: emoji,
        x: clamp(num(raw.x, 0), -240, 240),
        y: clamp(num(raw.y, 0), -180, 180),
        dir: normDir(num(raw.dir, 90)),
        size: clamp(num(raw.size, 100), 20, 200),
        visible: raw.visible !== false,
        rot: normRot(raw.rot),
        code: normalizeNodes(raw.code, new Set())
      });
    });
  }
  return out.length ? out : [createSpriteData('🐱', 'Gato', defaultCode())];
}

function applyPayload(payload) {
  if (!payload) return false;

  if (payload && Array.isArray(payload.sprites)) {
    sprites = normalizeSprites(payload.sprites);
    variables = (payload.variables && typeof payload.variables === 'object' && !Array.isArray(payload.variables)) ? payload.variables : {};
    loadHidden(payload.hidden);
    stageBg = clamp(Math.floor(num(payload.stageBg, 0)), 0, BG.length - 1);
    showScore = !!payload.showScore;
    selectedSpriteId = (typeof payload.selected === 'string' && sprites.some(s => s.id === payload.selected))
      ? payload.selected
      : sprites[0].id;
    Object.keys(hiddenVars).forEach(k => { if (!(k in variables)) delete hiddenVars[k]; });
    return true;
  }

  let oldCode = null, oldVars = {}, oldHidden = null;
  if (Array.isArray(payload)) {
    oldCode = payload;
  } else if (payload && Array.isArray(payload.code)) {
    oldCode = payload.code;
    oldVars = payload.variables || {};
    oldHidden = payload.hidden;
  }
  if (!oldCode) return false;

  sprites = [createSpriteData('🐱', 'Gato', migrateOldCode(oldCode))];
  selectedSpriteId = sprites[0].id;
  variables = (oldVars && typeof oldVars === 'object' && !Array.isArray(oldVars)) ? oldVars : {};
  loadHidden(oldHidden);
  Object.keys(hiddenVars).forEach(k => { if (!(k in variables)) delete hiddenVars[k]; });
  stageBg = 0;
  showScore = false;
  return true;
}

function resetProjectData(withCode) {
  sprites = [createSpriteData('🐱', 'Gato', withCode ? defaultCode() : [])];
  selectedSpriteId = sprites[0].id;
  variables = {};
  hiddenVars = {};
  stageBg = 0;
  showScore = false;
  score = 0;
  scoreFired = false;
  isRunning = false;
  sayTexts.clear();
  sayTimers.forEach(t => clearTimeout(t));
  sayTimers.clear();
}

function loadProject() {
  let payload = null;
  try {
    const shared = new URLSearchParams(location.search).get('p');
    if (shared) payload = decodeShare(shared.replace(/ /g, '+'));
  } catch (e) { }

  if (!payload) {
    const keys = ['scrachmo_v8', 'scrachmo_v7', 'scrachmo_v6', 'scrachmo_v5'];
    for (let i = 0; i < keys.length && !payload; i++) {
      const raw = store.get(keys[i]);
      if (!raw) continue;
      try {
        const p = JSON.parse(raw);
        if (p) payload = p;
      } catch (e) { }
    }
  }

  if (!payload || !applyPayload(payload)) resetProjectData(true);

  try { collapsed = JSON.parse(store.get('scrachmo_ui') || '{}') || {}; } catch (e) { collapsed = {}; }
}

function serializeProject() {
  return {
    version: '2.0',
    sprites: sprites.map(s => ({
      id: s.id,
      name: s.name,
      emoji: s.emoji,
      x: Math.round(s.x * 10) / 10,
      y: Math.round(s.y * 10) / 10,
      dir: Math.round(s.dir * 10) / 10,
      size: Math.round(s.size * 10) / 10,
      visible: !!s.visible,
      rot: normRot(s.rot),
      code: s.code
    })),
    variables: variables,
    hidden: hiddenList(),
    stageBg: stageBg,
    showScore: showScore,
    selected: selectedSpriteId
  };
}

function saveProject() {
  store.set('scrachmo_v8', JSON.stringify(serializeProject()));
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveProject, 400);
}

/* ---------------- basic UI ---------------- */
function toast(msg) {
  const el = $('#toast');
  if (!el || !msg) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1900);
}

function updateStatus() {
  const t = UI[lang];
  const st = $('#statusText');
  if (st) st.textContent = isRunning ? t.running : t.ready;
  const pill = $('#status');
  if (pill) pill.classList.toggle('on', isRunning);
  const label = $('#playLabel');
  if (label) label.textContent = isRunning ? t.running : t.run;
  const pb = $('#playBtn');
  if (pb) pb.disabled = isRunning;
  const stage = $('#stage');
  if (stage) stage.classList.toggle('is-running', isRunning);
}

function updateHUD() {
  const scoreEl = $('#scoreVal');
  if (scoreEl) scoreEl.textContent = String(score);
  ensureVarsRendered();
  const entries = Object.entries(variables).filter(([k]) => !hiddenVars[k]);
  const scoreHud = $('#scoreHud');
  if (scoreHud) scoreHud.hidden = !showScore;
  const hudPill = $('.stage-hud');
  if (hudPill) hudPill.classList.toggle('is-empty', !showScore && !entries.length);
  const hud = $('#varsHud');
  if (hud) hud.textContent = entries.map(([k, v]) => k + ' ' + v).join(' · ');
  const panelVal = $('#scorePanelVal');
  if (panelVal && document.activeElement !== panelVal) panelVal.value = String(score);
  const eye = $('#scoreEye');
  if (eye) {
    eye.classList.toggle('on', !!showScore);
    eye.setAttribute('aria-pressed', String(!!showScore));
    const use = eye.querySelector('use');
    if (use) use.setAttribute('href', '#i-' + (showScore ? 'eye' : 'eye-off'));
    const label = showScore ? UI[lang].hideOnStage : UI[lang].showOnStage;
    eye.title = label;
    eye.setAttribute('aria-label', label);
  }
}

/* ---------------- variables panel ---------------- */
function ensureVarsRendered() {
  const sig = Object.keys(variables).join('\u0001');
  if (sig !== varsSig) renderVars();
  else syncVars();
}

function syncVars() {
  const list = $('#varsList');
  if (!list) return;
  list.querySelectorAll('input[data-var]').forEach(inp => {
    const name = inp.dataset.var;
    if (!(name in variables)) return;
    if (document.activeElement !== inp) inp.value = String(variables[name]);
    const numeric = typeof variables[name] === 'number';
    const card = inp.closest('.var-card');
    if (card) card.querySelectorAll('[data-step]').forEach(b => { b.disabled = !numeric; });
  });
}

function renderVars() {
  const list = $('#varsList');
  if (!list) return;
  const t = UI[lang];
  const names = Object.keys(variables);
  varsSig = names.join('\u0001');
  const count = $('#varsCount');
  if (count) count.textContent = String(names.length);

  if (!names.length) {
    list.innerHTML = '<div class="empty">' + icon('list') +
      '<b>' + esc(t.varsEmpty) + '</b><p>' + esc(t.varsEmptyDesc) + '</p></div>';
  } else {
    list.innerHTML = names.map((name, i) => {
      const c = VAR_COLORS[i % VAR_COLORS.length];
      const value = variables[name];
      const numeric = typeof value === 'number';
      const hidden = !!hiddenVars[name];
      const safe = esc(name);
      const toggleLabel = hidden ? t.showOnStage : t.hideOnStage;
      return '<div class="var-card" style="--v:' + c.v + ';--vt:' + c.t + '">' +
        '<div class="var-head">' +
          '<span class="var-dot"></span>' +
          '<span class="var-name" title="' + safe + '">' + safe + '</span>' +
          '<button type="button" class="var-mini' + (hidden ? '' : ' on') + '" data-eye="' + safe + '"' +
            ' aria-pressed="' + String(!hidden) + '" aria-label="' + esc(toggleLabel) + '" title="' + esc(toggleLabel) + '">' +
            icon(hidden ? 'eye-off' : 'eye') + '</button>' +
          '<button type="button" class="var-mini" data-del-var="' + safe + '"' +
            ' aria-label="' + esc(t.deleteVar) + '" title="' + esc(t.deleteVar) + '">' + icon('close') + '</button>' +
        '</div>' +
        '<div class="var-value-row">' +
          '<button type="button" class="var-step" data-var-step="' + safe + '" data-step="-1"' + (numeric ? '' : ' disabled') +
            ' aria-label="' + esc(t.minusOne) + '">−</button>' +
          '<input class="var-val" data-var="' + safe + '" value="' + esc(value) + '"' +
            ' inputmode="' + (numeric ? 'decimal' : 'text') + '" aria-label="' + safe + '"' +
            ' autocomplete="off" spellcheck="false">' +
          '<button type="button" class="var-step" data-var-step="' + safe + '" data-step="1"' + (numeric ? '' : ' disabled') +
            ' aria-label="' + esc(t.plusOne) + '">+</button>' +
        '</div></div>';
    }).join('');
  }

  const newBtn = $('#newVarBtn');
  if (varFormOpen) {
    list.insertAdjacentHTML('beforeend', varFormHTML(t));
    if (newBtn) newBtn.hidden = true;
  } else if (newBtn) {
    newBtn.hidden = false;
  }
}

function varFormHTML(t) {
  return '<form class="var-form" id="varForm" autocomplete="off">' +
    '<input id="newVarName" class="var-form-input" maxlength="16" placeholder="' + esc(t.varNamePlaceholder) + '"' +
      ' aria-label="' + esc(t.varNamePlaceholder) + '" autocomplete="off" spellcheck="false">' +
    '<button type="submit" class="var-form-ok">' + esc(t.create) + '</button>' +
    '<button type="button" class="var-form-cancel" id="cancelVar" aria-label="' + esc(t.cancel) + '" title="' + esc(t.cancel) + '">' +
      icon('close') + '</button>' +
    '<span class="var-form-hint" id="varFormHint">' + esc(t.varNameHint) + '</span>' +
  '</form>';
}

function parseVarValue(raw) {
  const s = String(raw).trim();
  if (s !== '' && /^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  return raw;
}

function openVarForm() {
  if (varFormOpen) return;
  varFormOpen = true;
  renderVars();
  const inp = $('#newVarName');
  if (inp) setTimeout(() => { try { inp.focus(); } catch (e) { } }, 60);
}

function closeVarForm() {
  varFormOpen = false;
  renderVars();
}

function createVariable() {
  const inp = $('#newVarName');
  const hint = $('#varFormHint');
  if (!inp) return;
  const t = UI[lang];
  const name = inp.value.trim();
  const valid = /^[A-Za-z_][A-Za-z0-9_]{0,15}$/.test(name) &&
    name !== '__proto__' && name !== 'constructor' && name !== 'prototype';
  if (!valid) {
    if (hint) { hint.textContent = t.varBadName; hint.classList.add('error'); }
    inp.focus();
    return;
  }
  if (name === 'score') {
    if (hint) { hint.textContent = t.varReserved; hint.classList.add('error'); }
    inp.focus();
    return;
  }
  if (name in variables) {
    if (hint) { hint.textContent = t.varExists; hint.classList.add('error'); }
    inp.focus();
    return;
  }
  variables[name] = 0;
  delete hiddenVars[name];
  varFormOpen = false;
  renderVars();
  updateHUD();
  saveProject();
  toast(t.varCreated);
}

function deleteVariable(name) {
  if (!(name in variables)) return;
  delete variables[name];
  delete hiddenVars[name];
  renderVars();
  updateHUD();
  saveProject();
  toast(UI[lang].varDeleted);
}

function toggleVarVisibility(name) {
  if (!(name in variables)) return;
  if (hiddenVars[name]) delete hiddenVars[name];
  else hiddenVars[name] = true;
  renderVars();
  updateHUD();
  saveProject();
}

function stepVariable(name, step) {
  if (!(name in variables)) return;
  const current = Number(variables[name]);
  variables[name] = (Number.isFinite(current) ? current : 0) + step;
  updateHUD();
  saveProject();
}

/* ---------------- sprite operations ---------------- */
function selectSprite(id) {
  if (!getSprite(id)) return;
  selectedSpriteId = id;
  updateStageSelection();
  renderTray();
  renderProps();
  renderCode();
}

function addSprite(emoji) {
  const t = UI[lang];
  const names = new Set(sprites.map(s => s.name));
  let n = sprites.length + 1;
  let name = t.spriteDefault + ' ' + n;
  while (names.has(name)) { n++; name = t.spriteDefault + ' ' + n; }
  const s = createSpriteData(emoji || '🐱', name, []);
  s.x = 0; s.y = 0;
  sprites.push(s);
  selectedSpriteId = s.id;
  closeSpriteModal();
  render();
  saveProject();
  toast(t.spriteAdded);
}

function deleteSelectedSprite() {
  const t = UI[lang];
  if (sprites.length <= 1) { toast(t.cantDeleteSprite); return; }
  const s = selectedSprite();
  if (!s) return;
  if (!confirm(t.confirmDeleteSprite)) return;
  const idx = spriteIndex(s.id);
  sprites.splice(idx, 1);
  selectedSpriteId = sprites[Math.max(0, idx - 1)].id;
  render();
  saveProject();
  toast(t.spriteDeleted);
}

function openSpriteModal() {
  const modal = $('#spriteModal');
  if (!modal) return;
  modal.hidden = false;
  updateModalLock();
}

function closeSpriteModal() {
  const modal = $('#spriteModal');
  if (!modal) return;
  modal.hidden = true;
  updateModalLock();
}

function updateModalLock() {
  const anyOpen = !$('#shareModal').hidden || !$('#spriteModal').hidden;
  document.body.classList.toggle('modal-open', anyOpen);
}

/* ---------------- stage and sprites ---------------- */
function applyStageBg() {
  const stage = $('#stage');
  if (!stage) return;
  if (stageBg <= 0) {
    stage.style.background = '';
    return;
  }
  const pair = BG[stageBg % BG.length];
  stage.style.background =
    'radial-gradient(150px 100px at 14% 16%, rgba(255,255,255,.6), rgba(255,255,255,0) 65%),' +
    'linear-gradient(180deg,' + pair[0] + ' 0%,' + pair[1] + ' 100%)';
}

function spriteHTML(s, index) {
  const bubble = sayTexts.get(s.id) || '';
  const sel = s.id === selectedSpriteId;
  return '<div class="sprite-wrap' + (sel ? ' selected' : '') + (s.visible ? '' : ' off') + '"' +
    ' data-sprite="' + esc(s.id) + '"' +
    ' style="left:' + posLeft(s) + '%;top:' + posTop(s) + '%;z-index:' + (sel ? 60 : index + 1) + '">' +
    '<div class="sprite-bubble' + (bubble ? ' show' : '') + '">' + esc(bubble) + '</div>' +
    '<div class="sprite-emoji" style="transform:' + spriteTransform(s) + '">' + esc(s.emoji) + '</div>' +
    '</div>';
}

function renderSprites() {
  const layer = $('#spritesLayer');
  if (!layer) return;
  layer.innerHTML = sprites.map((s, i) => spriteHTML(s, i)).join('');
  applyStageBg();
}

function updateStageSelection() {
  const layer = $('#spritesLayer');
  if (!layer) return;
  Array.from(layer.children).forEach((el, i) => {
    const isSel = el.dataset.sprite === selectedSpriteId;
    el.classList.toggle('selected', isSel);
    el.style.zIndex = isSel ? '60' : String(i + 1);
  });
}

function updateSpriteEl(s) {
  let el = findSpriteEl(s.id);
  if (!el) { renderSprites(); el = findSpriteEl(s.id); }
  if (!el) return;
  el.style.left = posLeft(s) + '%';
  el.style.top = posTop(s) + '%';
  el.classList.toggle('off', !s.visible);
  el.classList.toggle('selected', s.id === selectedSpriteId);
  el.style.zIndex = s.id === selectedSpriteId ? '60' : String(spriteIndex(s.id) + 1);

  const emoji = el.querySelector('.sprite-emoji');
  if (emoji) {
    emoji.style.transform = spriteTransform(s);
  }
  updateBubbleEl(s);
}

function updateBubbleEl(s) {
  const el = findSpriteEl(s.id);
  if (!el) return;
  const bub = el.querySelector('.sprite-bubble');
  if (!bub) return;
  const text = sayTexts.get(s.id) || '';
  bub.textContent = text;
  bub.classList.toggle('show', !!text);
}

function saySprite(s, text) {
  sayTexts.set(s.id, text);
  updateBubbleEl(s);
  clearTimeout(sayTimers.get(s.id));
  const timer = setTimeout(() => {
    sayTexts.delete(s.id);
    sayTimers.delete(s.id);
    updateBubbleEl(s);
  }, 2600);
  sayTimers.set(s.id, timer);
}

/* ---------------- sprite tray + properties ---------------- */
function renderTray() {
  const tray = $('#spriteTray');
  if (!tray) return;
  const t = UI[lang];
  const html = sprites.map(s => {
    const sel = s.id === selectedSpriteId;
    return '<button type="button" class="sprite-tile' + (sel ? ' selected' : '') + (s.visible ? '' : ' off') + '"' +
      ' data-sprite="' + esc(s.id) + '" title="' + esc(s.name) + '">' +
      '<span class="tile-emoji">' + esc(s.emoji) + '</span>' +
      '<span class="tile-name">' + esc(s.name) + '</span>' +
      (s.visible ? '' : icon('eye-off', 'tile-eye')) +
      '</button>';
  }).join('') +
    '<button type="button" class="sprite-tile add" data-add-sprite title="' + esc(t.addSprite) + '">' +
      icon('plus') + '<span class="tile-name">' + esc(t.addSprite.split(' ')[0]) + '</span></button>';
  tray.innerHTML = html;
  const count = $('#spritesCount');
  if (count) count.textContent = String(sprites.length);
}

function renderProps() {
  const s = selectedSprite();
  if (!s) return;
  const t = UI[lang];
  const avatar = $('#propAvatar');
  if (avatar) avatar.textContent = s.emoji;
  const name = $('#propName');
  if (name) name.value = s.name;
  const px = $('#propX'); if (px) px.value = fmt(s.x);
  const py = $('#propY'); if (py) py.value = fmt(s.y);
  const pd = $('#propDir'); if (pd) pd.value = fmt(s.dir);
  const ps = $('#propSize'); if (ps) ps.value = fmt(s.size);

  const vis = $('#propVisible');
  if (vis) {
    vis.classList.toggle('on', !!s.visible);
    vis.setAttribute('aria-pressed', String(!!s.visible));
    const use = vis.querySelector('use');
    if (use) use.setAttribute('href', '#i-' + (s.visible ? 'eye' : 'eye-off'));
    const label = vis.querySelector('span');
    if (label) label.textContent = s.visible ? t.spriteVisible : t.spriteHidden;
  }
  const del = $('#propDelete');
  if (del) {
    del.disabled = sprites.length <= 1;
    del.title = sprites.length <= 1 ? t.cantDeleteSprite : t.deleteSprite;
    del.setAttribute('aria-label', del.title);
  }

  const rot = normRot(s.rot);
  $$('#propRot button').forEach(b => {
    const on = b.dataset.rot === rot;
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', String(on));
  });
}

function updatePropPosition() {
  const s = selectedSprite();
  if (!s) return;
  const px = $('#propX'); if (px) px.value = fmt(s.x);
  const py = $('#propY'); if (py) py.value = fmt(s.y);
}

/* ---------------- code rendering ---------------- */
function countNodes(nodes) {
  if (!Array.isArray(nodes)) return 0;
  let n = 0;
  nodes.forEach(node => {
    n++;
    if (node.body) n += countNodes(node.body);
    if (node.elseBody) n += countNodes(node.elseBody);
  });
  return n;
}

function codeTitle() {
  const t = UI[lang];
  const s = selectedSprite();
  const el = $('#codeTitle');
  if (el) el.textContent = s ? (t.code + ' · ' + s.name) : t.code;
  const count = $('#codeCount');
  if (count) count.textContent = String(s ? countNodes(s.code) : 0);
}

function blockContent(node, def, t) {
  const content = document.createElement('span');
  content.className = 'sb-content';
  const label = def.n[lang] || def.n.es;
  const parts = label.split('{v}');
  if (parts.length > 1) {
    if (parts[0]) content.appendChild(document.createTextNode(parts[0]));
    if (t && t.preview) {
      const val = document.createElement('span');
      val.className = 'sb-value' + (def.bool ? ' bool' : '');
      val.textContent = String(node.val !== undefined ? node.val : (def.def !== undefined ? def.def : ''));
      content.appendChild(val);
    } else {
      const input = document.createElement('input');
      input.className = 'sb-input' + (def.bool ? ' bool' : '');
      input.type = 'text';
      input.value = String(node.val !== undefined ? node.val : '');
      input.style.width = (def.w || 58) + 'px';
      input.dataset.input = node.id;
      input.setAttribute('inputmode', def.num ? 'decimal' : 'text');
      input.setAttribute('aria-label', parts[0].replace(/\s+$/, '') || def.id);
      input.autocomplete = 'off';
      input.spellcheck = false;
      content.appendChild(input);
    }
    if (parts[1]) content.appendChild(document.createTextNode(parts[1]));
  } else {
    content.appendChild(document.createTextNode(label));
  }
  return content;
}

function makeSlot(node, slotName, cat, def) {
  const slot = document.createElement('div');
  slot.className = 'c-slot';
  slot.dataset.owner = node.id;
  slot.dataset.slot = slotName;
  slot.style.setProperty('--c', cat.color);
  const list = Array.isArray(node[slotName]) ? node[slotName] : [];
  list.forEach(child => {
    const el = blockEl(child);
    if (el) slot.appendChild(el);
  });
  if (!list.length) slot.classList.add('empty');
  return slot;
}

function blockEl(node, opts) {
  const t = UI[lang];
  const preview = !!(opts && opts.preview);
  const def = BYID[node.type];
  if (!def) return null;
  const cat = CATMAP[def.cat] || CATMAP.motion;

  const item = document.createElement('div');
  item.className = 'stack-item' + (def.c ? ' c-item' : '');
  item.dataset.id = node.id;
  item.style.setProperty('--c', cat.color);

  const head = document.createElement('div');
  head.className = 'sb' + (def.hat ? ' hat' : '') + (def.c ? ' c-head' : '');
  head.dataset.id = node.id;
  head.style.setProperty('--c', cat.color);

  if (!preview) {
    const grip = document.createElement('button');
    grip.type = 'button';
    grip.className = 'sb-grip';
    grip.dataset.grip = node.id;
    grip.title = t.dragBlock;
    grip.setAttribute('aria-label', t.dragBlock);
    grip.innerHTML = icon('grip');
    head.appendChild(grip);
  }

  const content = blockContent(node, def, { preview: preview });
  head.appendChild(content);

  if (!preview) {
    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'sb-del';
    del.dataset.del = node.id;
    del.setAttribute('aria-label', t.deleteBlock);
    del.title = t.deleteBlock;
    del.innerHTML = icon('close');
    head.appendChild(del);
  }

  item.appendChild(head);

  if (def.c) {
    item.appendChild(makeSlot(node, 'body', cat, def));
    const hasElse = !!(def.else || (node.elseBody && node.elseBody.length));
    if (hasElse) {
      const bar = document.createElement('div');
      bar.className = 'c-else';
      bar.style.setProperty('--c', cat.color);
      bar.textContent = t.elseWord;
      item.appendChild(bar);
      item.appendChild(makeSlot(node, 'elseBody', cat, def));
    }
    const foot = document.createElement('div');
    foot.className = 'c-foot';
    foot.style.setProperty('--c', cat.color);
    item.appendChild(foot);
  }

  return item;
}

function assignZ(container) {
  let z = 6000;
  const walk = parent => {
    Array.prototype.forEach.call(parent.children, child => {
      if (!child.classList || !child.classList.contains('stack-item')) return;
      child.style.zIndex = String(z--);
      Array.prototype.forEach.call(child.querySelectorAll(':scope > .c-slot'), slot => walk(slot));
    });
  };
  walk(container);
}

function renderCode() {
  const list = $('#codeList');
  if (!list) return;
  const s = selectedSprite();
  const t = UI[lang];
  list.innerHTML = '';

  if (!s || !s.code.length) {
    list.innerHTML = '<div class="code-empty"><b>' + esc(t.codeEmpty) + '</b><span>' + esc(t.codeEmptyDesc) + '</span></div>';
  } else {
    const frag = document.createDocumentFragment();
    s.code.forEach(node => {
      const el = blockEl(node);
      if (el) frag.appendChild(el);
    });
    list.appendChild(frag);
  }
  assignZ(list);
  codeTitle();
  updateStageHint();
}

function updateStageHint() {
  const hint = $('#stageHint');
  if (!hint) return;
  const t = UI[lang];
  hint.textContent = hasTopNode('when_tap') ? t.stageHint : t.stageHintRun;
}

/* ---------------- category chips ---------------- */
function renderCats(t) {
  const items = [{ id: 'all', label: t.all, color: '#6366f1', icon: 'blocks', count: PALETTE_BLOCKS.length }]
    .concat(CATS.map(c => ({
      id: c.id,
      label: c.name[lang] || c.name.es,
      color: c.color,
      icon: c.icon,
      count: PALETTE_BLOCKS.filter(b => b.cat === c.id).length
    })));

  $('#catChips').innerHTML = items.map(it =>
    '<button type="button" aria-pressed="' + (currentFilter === it.id) + '"' +
    ' class="chip' + (currentFilter === it.id ? ' active' : '') + '"' +
    ' style="--c:' + it.color + '" data-cat="' + it.id + '">' +
    icon(it.icon) + '<span>' + esc(it.label) + '</span><span class="count">' + it.count + '</span></button>'
  ).join('');
}

/* ---------------- palette ---------------- */
function previewNode(def) {
  const node = { id: 'preview_' + def.id, type: def.id, val: def.def !== undefined ? def.def : '' };
  if (def.c) {
    node.body = [];
    if (def.else) node.elseBody = [];
  }
  return node;
}

function renderPalette(t) {
  const pal = $('#palette');
  if (!pal) return;
  const q = fold(searchTerm.trim());
  let items = PALETTE_BLOCKS.filter(b => currentFilter === 'all' || b.cat === currentFilter);
  if (q) {
    items = items.filter(b => fold((b.n[lang] || b.n.es) + ' ' + (b.d[lang] || b.d.es)).indexOf(q) > -1);
  }

  if (!items.length) {
    pal.innerHTML = '<div class="empty small">' + icon('search') + '<b>' + esc(t.noResults) + '</b></div>';
    return;
  }

  const frag = document.createDocumentFragment();
  items.forEach(def => {
    const cat = CATMAP[def.cat];
    const name = (def.n[lang] || def.n.es).replace('{v}', def.def !== undefined ? String(def.def) : '');
    const desc = def.d[lang] || def.d.es;
    const wrap = document.createElement('div');
    wrap.className = 'p-block';
    wrap.dataset.add = def.id;
    wrap.setAttribute('role', 'button');
    wrap.tabIndex = 0;
    wrap.setAttribute('aria-label', name + '. ' + desc);
    const preview = blockEl(previewNode(def), { preview: true });
    if (preview) wrap.appendChild(preview);
    const caption = document.createElement('span');
    caption.className = 'p-desc';
    caption.textContent = desc;
    wrap.appendChild(caption);
    frag.appendChild(wrap);
  });
  pal.replaceChildren(frag);
}

/* ---------------- sprite chooser ---------------- */
function renderSpriteChoices() {
  const box = $('#spriteChoices');
  if (!box) return;
  const t = UI[lang];
  box.innerHTML = SPRITE_CHOICES.map(e =>
    '<button type="button" class="sprite-choice" data-emoji="' + esc(e) + '" aria-label="' + esc(t.addSprite + ' ' + e) + '">' + esc(e) + '</button>'
  ).join('');
}

/* ---------------- render all ---------------- */
function render() {
  const t = UI[lang];
  document.documentElement.lang = lang;

  $$('[data-t]').forEach(el => {
    const key = el.dataset.t;
    if (t[key] != null) el.textContent = t[key];
  });
  $$('.lang-switch button').forEach(b => {
    const on = b.dataset.lang === lang;
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', String(on));
  });

  $('#searchBlocks').placeholder = t.search;
  $('#blocksCount').textContent = String(PALETTE_BLOCKS.length);
  $('#multiSub').textContent = multiOn ? t.multiOn : t.multiOff;
  $('#multiBtn').classList.toggle('is-on', multiOn);

  renderSprites();
  renderTray();
  renderProps();
  renderCode();
  renderVars();
  renderCats(t);
  renderPalette(t);
  renderSpriteChoices();
  applyStageBg();
  codeTitle();

  const hint = $('#stageHint');
  if (hint) hint.textContent = hasTopNode('when_tap') ? t.stageHint : t.stageHintRun;

  updateHUD();
  updateStatus();
  applyCollapsed();
}

/* ---------------- collapsed sections ---------------- */
function applyCollapsed() {
  $$('[data-collapse]').forEach(btn => {
    const card = document.getElementById(btn.dataset.collapse);
    if (!card) return;
    const on = !!collapsed[btn.dataset.collapse];
    card.classList.toggle('is-collapsed', on);
    btn.setAttribute('aria-expanded', String(!on));
  });
}

/* ---------------- tree operations ---------------- */
function findNode(id, list, parent, parentSlot) {
  if (!list) {
    const s = selectedSprite();
    if (!s) return null;
    list = s.code;
  }
  for (let i = 0; i < list.length; i++) {
    const node = list[i];
    if (node.id === id) return { node: node, arr: list, index: i, parent: parent || null, parentSlot: parentSlot || null };
    if (node.body) {
      const r = findNode(id, node.body, node, 'body');
      if (r) return r;
    }
    if (node.elseBody) {
      const r = findNode(id, node.elseBody, node, 'elseBody');
      if (r) return r;
    }
  }
  return null;
}

function nodeContains(ancestor, id) {
  if (!ancestor) return false;
  if (ancestor.id === id) return true;
  if (ancestor.body && ancestor.body.some(n => nodeContains(n, id))) return true;
  if (ancestor.elseBody && ancestor.elseBody.some(n => nodeContains(n, id))) return true;
  return false;
}

function addBlock(type) {
  const def = BYID[type];
  const s = selectedSprite();
  if (!def || def.legacy || !s) return;
  const node = makeNode(type);
  if (!node) return;
  s.code.push(node);
  renderCode();
  saveProject();
  toast(UI[lang].added);
}

function deleteNode(id) {
  const info = findNode(id);
  if (!info) return;
  info.arr.splice(info.index, 1);
  renderCode();
  saveProject();
  toast(UI[lang].deleted);
}

function focusGrip(id) {
  const grip = $('#codeList').querySelector('[data-grip="' + id + '"]');
  if (grip) grip.focus();
}

function moveBlockKeyboard(id, key) {
  const info = findNode(id);
  if (!info) return;
  const node = info.node;
  const def = BYID[node.type];

  if (key === 'ArrowUp' || key === 'ArrowDown') {
    const to = info.index + (key === 'ArrowUp' ? -1 : 1);
    if (to < 0 || to >= info.arr.length) return;
    info.arr.splice(info.index, 1);
    info.arr.splice(to, 0, node);
    renderCode();
    saveProject();
    focusGrip(id);
    return;
  }

  if (key === 'ArrowRight') {
    if (def.hat || info.index === 0) return;
    const prev = info.arr[info.index - 1];
    if (!prev || !BYID[prev.type] || !BYID[prev.type].c) return;
    if (!prev.body) prev.body = [];
    info.arr.splice(info.index, 1);
    prev.body.push(node);
    renderCode();
    saveProject();
    focusGrip(id);
    return;
  }

  if (key === 'ArrowLeft') {
    if (!info.parent) return;
    const parentId = info.parent.id;
    const pInfo = findNode(parentId);
    if (!pInfo) return;
    info.arr.splice(info.index, 1);
    pInfo.arr.splice(pInfo.index + 1, 0, node);
    renderCode();
    saveProject();
    focusGrip(id);
  }
}

/* ---------------- block drag ---------------- */
function clearDrop() {
  $$('.drop-line').forEach(el => el.parentNode && el.parentNode.removeChild(el));
  $$('.c-slot.drag-over').forEach(el => el.classList.remove('drag-over'));
}

function calcDropTarget(container, draggedItem, clientY) {
  const children = Array.from(container.children).filter(el => el.classList.contains('stack-item') && el !== draggedItem);
  let index = 0;
  children.forEach(el => {
    const r = el.getBoundingClientRect();
    if (clientY > r.top + r.height / 2) index++;
  });
  return { container: container, index: index, children: children };
}

function drawDropLine(target) {
  clearDrop();
  if (!target) return;
  const container = target.container;
  if (container.classList.contains('c-slot')) container.classList.add('drag-over');
  const line = document.createElement('div');
  line.className = 'drop-line';
  const cr = container.getBoundingClientRect();
  let top = 5;
  if (target.children.length) {
    if (target.index < target.children.length) {
      const r = target.children[target.index].getBoundingClientRect();
      top = r.top - cr.top - 2;
    } else {
      const r = target.children[target.children.length - 1].getBoundingClientRect();
      top = r.bottom - cr.top + 2;
    }
  }
  line.style.top = top + 'px';
  container.appendChild(line);
}

function startBlockDrag(e, grip) {
  if (blockDrag || isRunning) return;
  if (e.button !== undefined && e.button !== 0) return;
  const id = grip.dataset.grip;
  const item = grip.closest('.stack-item');
  if (!id || !item) return;
  const rect = item.getBoundingClientRect();
  blockDrag = {
    id: id,
    item: item,
    grip: grip,
    pointerId: e.pointerId,
    startX: e.clientX,
    startY: e.clientY,
    offsetX: e.clientX - rect.left,
    offsetY: e.clientY - rect.top,
    moved: false,
    ghost: null,
    target: null
  };
  try { grip.setPointerCapture(e.pointerId); } catch (err) { }
  e.preventDefault();
  e.stopPropagation();

  const ghost = item.cloneNode(true);
  ghost.classList.add('drag-ghost');
  ghost.classList.remove('dragging');
  ghost.style.width = rect.width + 'px';
  ghost.style.height = rect.height + 'px';
  ghost.style.left = rect.left + 'px';
  ghost.style.top = rect.top + 'px';
  ghost.style.zIndex = '300';
  document.body.appendChild(ghost);
  blockDrag.ghost = ghost;
  item.classList.add('dragging');
  document.body.classList.add('is-dragging');
}

function moveBlockDrag(e) {
  if (!blockDrag || e.pointerId !== blockDrag.pointerId) return;
  e.preventDefault();
  const d = blockDrag;
  if (d.ghost) {
    d.ghost.style.left = (e.clientX - d.offsetX) + 'px';
    d.ghost.style.top = (e.clientY - d.offsetY) + 'px';
  }
  if (Math.abs(e.clientX - d.startX) > 3 || Math.abs(e.clientY - d.startY) > 3) d.moved = true;

  const margin = 90;
  if (e.clientY < margin) window.scrollBy(0, -10);
  else if (e.clientY > window.innerHeight - margin) window.scrollBy(0, 10);

  const el = document.elementFromPoint(e.clientX, e.clientY);
  let container = null;
  if (el) {
    const slot = el.closest('.c-slot');
    if (slot) container = slot;
    else if (el.closest('#codeList')) container = $('#codeList');
    else if (el.closest('.scratch-workspace')) container = $('#codeList');
  }

  const dragged = findNode(d.id);
  if (container && dragged) {
    if (container.classList.contains('c-slot')) {
      const ownerId = container.dataset.owner;
      if (nodeContains(dragged.node, ownerId)) container = null;
      if (container && BYID[dragged.node.type] && BYID[dragged.node.type].hat) container = null;
    }
  }

  d.target = container ? calcDropTarget(container, d.item, e.clientY) : null;
  drawDropLine(d.target);
}

function endBlockDrag(e, cancelled) {
  if (!blockDrag) return;
  if (e && e.pointerId !== undefined && e.pointerId !== blockDrag.pointerId) return;
  const d = blockDrag;
  blockDrag = null;
  clearDrop();
  document.body.classList.remove('is-dragging');
  if (d.ghost && d.ghost.parentNode) d.ghost.parentNode.removeChild(d.ghost);
  d.item.classList.remove('dragging');
  try { d.grip.releasePointerCapture(d.pointerId); } catch (err) { }

  if (cancelled || !d.moved || !d.target) return;

  const target = d.target;
  const dragged = findNode(d.id);
  if (!dragged) return;
  const def = BYID[dragged.node.type];
  if (!def) return;

  let arr = null;
  let owner = null;
  if (target.container.id === 'codeList') {
    const s = selectedSprite();
    if (!s) return;
    arr = s.code;
  } else {
    const ownerInfo = findNode(target.container.dataset.owner);
    if (!ownerInfo) return;
    owner = ownerInfo.node;
    const slot = target.container.dataset.slot;
    if (slot === 'elseBody') {
      if (!owner.elseBody) owner.elseBody = [];
      arr = owner.elseBody;
    } else {
      if (!owner.body) owner.body = [];
      arr = owner.body;
    }
    if (nodeContains(dragged.node, owner.id)) return;
    if (def.hat) return;
  }

  dragged.arr.splice(dragged.index, 1);
  const at = Math.max(0, Math.min(target.index, arr.length));
  arr.splice(at, 0, dragged.node);
  renderCode();
  saveProject();
  toast(UI[lang].reordered);
}

/* ---------------- sprite dragging ---------------- */
function startSpriteDrag(e, wrap) {
  if (document.body.classList.contains('game-mode')) return;
  const s = getSprite(wrap.dataset.sprite);
  if (!s) return;
  e.preventDefault();
  const rect = $('#stage').getBoundingClientRect();
  spriteDrag = {
    id: s.id,
    pointerId: e.pointerId,
    startX: e.clientX,
    startY: e.clientY,
    x: s.x,
    y: s.y,
    stageW: rect.width,
    stageH: rect.height,
    moved: false,
    wrap: wrap
  };
  try { wrap.setPointerCapture(e.pointerId); } catch (err) { }
  wrap.classList.add('dragging');
  selectSprite(s.id);
}

function moveSpriteDrag(e) {
  if (!spriteDrag || e.pointerId !== spriteDrag.pointerId) return;
  e.preventDefault();
  const s = getSprite(spriteDrag.id);
  if (!s) return;
  const dx = (e.clientX - spriteDrag.startX) / spriteDrag.stageW * 480;
  const dy = (e.clientY - spriteDrag.startY) / spriteDrag.stageH * 360;
  if (Math.abs(e.clientX - spriteDrag.startX) > 3 || Math.abs(e.clientY - spriteDrag.startY) > 3) spriteDrag.moved = true;
  s.x = clamp(spriteDrag.x + dx, -240, 240);
  s.y = clamp(spriteDrag.y - dy, -180, 180);
  updateSpriteEl(s);
  if (s.id === selectedSpriteId) updatePropPosition();
}

function endSpriteDrag(e, cancelled) {
  if (!spriteDrag) return;
  if (e && e.pointerId !== undefined && e.pointerId !== spriteDrag.pointerId) return;
  const d = spriteDrag;
  spriteDrag = null;
  d.wrap.classList.remove('dragging');
  try { d.wrap.releasePointerCapture(d.pointerId); } catch (err) { }
  const s = getSprite(d.id);
  if (s) {
    s.x = Math.round(s.x * 10) / 10;
    s.y = Math.round(s.y * 10) / 10;
    updateSpriteEl(s);
    if (s.id === selectedSpriteId) updatePropPosition();
    if (!cancelled && d.moved) {
      saveProject();
      suppressStageClick = true;
      setTimeout(() => { suppressStageClick = false; }, 350);
    }
  }
}

/* ---------------- expressions ---------------- */
function evalExpr(txt) {
  try {
    let s = String(txt).trim();
    if (s === '') return null;
    s = s.replace(/(?:aleatorio|random)\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/g, (m, a, b) => {
      const lo = Math.min(+a, +b), hi = Math.max(+a, +b);
      return String(Math.floor(Math.random() * (hi - lo + 1)) + lo);
    });
    s = s.replace(/[A-Za-z_][A-Za-z0-9_]*/g, w => {
      if (w === 'score') return String(score);
      if (w in variables) {
        const val = variables[w];
        return (typeof val === 'number') ? String(val) : '@';
      }
      return '0';
    });
    if (s.indexOf('@') > -1) return null;
    if (!/^[0-9+\-*/%().\s]+$/.test(s)) return null;
    const r = Function('"use strict";return(' + s + ')')();
    return (typeof r === 'number' && isFinite(r)) ? r : null;
  } catch (e) { return null; }
}

function condSide(txt) {
  const s = String(txt).trim().replace(/^["']+|["']+$/g, '');
  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(s)) {
    if (s === 'score') return score;
    return (s in variables) ? variables[s] : s;
  }
  const ev = evalExpr(s);
  return (ev === null) ? s : ev;
}

function evalCond(txt) {
  const s = String(txt).trim();
  if (s === '') return false;
  const m = s.match(/^(.+?)\s*(==|!=|>=|<=|>|<|=)\s*(.+)$/);
  if (!m) {
    const ev = evalExpr(s);
    return ev !== null && ev !== 0;
  }
  const op = m[2];
  const lv = condSide(m[1]);
  const rv = condSide(m[3]);
  const bothNum = (typeof lv === 'number' && typeof rv === 'number');
  const ln = Number(lv), rn = Number(rv);
  if (op === '>') return ln > rn;
  if (op === '<') return ln < rn;
  if (op === '>=') return ln >= rn;
  if (op === '<=') return ln <= rn;
  if (op === '==' || op === '=') {
    if (bothNum) return lv === rv;
    if (typeof lv === 'number' || typeof rv === 'number') return ln === rn;
    return String(lv) === String(rv);
  }
  if (op === '!=') {
    if (bothNum) return lv !== rv;
    if (typeof lv === 'number' || typeof rv === 'number') return ln !== rn;
    return String(lv) !== String(rv);
  }
  return false;
}

function resolveValue(raw) {
  if (raw === '') return '';
  if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);
  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(raw)) {
    if (raw === 'score') return score;
    if (raw in variables) return variables[raw];
    return raw;
  }
  const ev = evalExpr(raw);
  return (ev === null) ? raw : ev;
}

function applyVar(node) {
  const txt = String(node.val === undefined ? '' : node.val);
  const eq = txt.indexOf('=');
  if (eq < 0) return;
  const name = txt.slice(0, eq).trim();
  if (!name) return;
  const raw = txt.slice(eq + 1).trim();
  if (node.type === 'set_var') {
    variables[name] = resolveValue(raw);
    return;
  }
  const amount = Number(resolveValue(raw));
  if (!Number.isFinite(amount)) return;
  if (!(name in variables)) variables[name] = 0;
  variables[name] = Number(variables[name] || 0) + (node.type === 'add_var' ? amount : -amount);
}

/* ---------------- audio / stage bg ---------------- */
function beep(freq, dur, type, sweep) {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!audioCtx) audioCtx = new AC();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const t0 = audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (sweep) o.frequency.linearRampToValueAtTime(sweep, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.22, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  } catch (e) { }
}

function changeBg() {
  stageBg = (stageBg + 1) % BG.length;
  applyStageBg();
  scheduleSave();
}

/* ---------------- engine ---------------- */
function checkNodeCondition(node) {
  if (node.type === 'if_tilt') return Math.abs(window.lastTilt || 0) > 15;
  if (node.type === 'if_score') return score > num(node.val, 5);
  return evalCond(node.val);
}

async function execBlock(node, sprite) {
  const v = node.val;
  switch (node.type) {
    case 'when_flag': case 'when_tap': case 'when_key': case 'when_score':
    case 'when_shake': case 'when_msg':
      return;
    case 'move': {
      const steps = num(v, 10);
      const rad = sprite.dir * Math.PI / 180;
      sprite.x = clamp(sprite.x + steps * Math.sin(rad), -240, 240);
      sprite.y = clamp(sprite.y + steps * Math.cos(rad), -180, 180);
      updateSpriteEl(sprite);
      await sleep(180);
      return;
    }
    case 'turn':
      sprite.dir = normDir(sprite.dir + num(v, 15));
      updateSpriteEl(sprite);
      await sleep(180);
      return;
    case 'point_dir':
      sprite.dir = normDir(num(v, 90));
      updateSpriteEl(sprite);
      await sleep(150);
      return;
    case 'go_random':
      sprite.x = Math.round((Math.random() * 2 - 1) * 210);
      sprite.y = Math.round((Math.random() * 2 - 1) * 150);
      updateSpriteEl(sprite);
      await sleep(180);
      return;
    case 'bounce': {
      const rad = sprite.dir * Math.PI / 180;
      const dx = Math.sin(rad), dy = Math.cos(rad);
      // Paredes izquierda/derecha: reflejar en horizontal (dir -> -dir).
      if ((sprite.x >= 240 && dx > 0) || (sprite.x <= -240 && dx < 0)) sprite.dir = -sprite.dir;
      // Paredes arriba/abajo: reflejar en vertical (dir -> 180 - dir).
      if ((sprite.y >= 180 && dy > 0) || (sprite.y <= -180 && dy < 0)) sprite.dir = 180 - sprite.dir;
      sprite.dir = normDir(sprite.dir);
      updateSpriteEl(sprite);
      await sleep(160);
      return;
    }
    case 'wait':
      await sleep(Math.max(0, num(v, 1)) * 1000);
      return;
    case 'meow':
      beep(560, 0.3, 'sine', 760);
      await sleep(380);
      return;
    case 'pop':
      beep(1180, 0.07, 'triangle');
      await sleep(200);
      return;
    case 'vibrate':
      if (navigator.vibrate) navigator.vibrate(clamp(Math.round(num(v, 200)), 20, 2000));
      await sleep(150);
      return;
    case 'say':
      saySprite(sprite, String(v == null ? '' : v));
      await sleep(320);
      return;
    case 'size':
      sprite.size = clamp(sprite.size + num(v, 10), 20, 200);
      updateSpriteEl(sprite);
      await sleep(150);
      return;
    case 'hide':
      sprite.visible = false;
      updateSpriteEl(sprite);
      renderTray();
      await sleep(120);
      return;
    case 'show':
      sprite.visible = true;
      updateSpriteEl(sprite);
      renderTray();
      await sleep(120);
      return;
    case 'change_bg':
      changeBg();
      await sleep(180);
      return;
    case 'score_add':
      score += num(v, 1);
      updateHUD();
      await sleep(110);
      return;
    case 'score_set':
      score = num(v, 10);
      updateHUD();
      await sleep(110);
      return;
    case 'score_reset':
      score = 0;
      updateHUD();
      await sleep(110);
      return;
    case 'create_var': {
      const name = prompt(UI[lang].varName);
      if (name && name.trim()) {
        const clean = name.trim();
        if (!(clean in variables)) variables[clean] = 0;
      }
      updateHUD();
      await sleep(130);
      return;
    }
    case 'set_var': case 'add_var': case 'sub_var':
      applyVar(node);
      updateHUD();
      await sleep(130);
      return;
    case 'show_vars':
      toast(Object.keys(variables).length
        ? Object.entries(variables).map(([k, x]) => k + ': ' + x).join(' · ')
        : UI[lang].noVars);
      await sleep(130);
      return;
    case 'op_random': {
      const parts = String(v == null ? '1,10' : v).split(',');
      let lo = Math.floor(num(parts[0], 1));
      let hi = Math.floor(num(parts[1], 10));
      if (hi < lo) { const tmp = lo; lo = hi; hi = tmp; }
      variables.res = Math.floor(Math.random() * (hi - lo + 1)) + lo;
      updateHUD();
      await sleep(130);
      return;
    }
    case 'op_calc': {
      const r = evalExpr(v);
      if (r !== null) { variables.res = r; updateHUD(); }
      await sleep(130);
      return;
    }
    case 'send_msg':
      store.set('scrachmo_msg', JSON.stringify({ t: Date.now() }));
      toast(UI[lang].msgSent);
      await sleep(150);
      return;
    default:
      await sleep(30);
  }
}

let lastCond = false;

function glowOn(id) {
  const head = document.querySelector('#codeList .sb[data-id="' + id + '"]');
  if (head) head.classList.add('running');
}

function glowOff(id) {
  const head = document.querySelector('#codeList .sb[data-id="' + id + '"]');
  if (head) head.classList.remove('running');
}

function clearGlows() {
  $$('#codeList .sb.running').forEach(el => el.classList.remove('running'));
}

async function execNode(node, sprite) {
  const def = BYID[node.type];
  if (!def || def.hat) return;

  glowOn(node.id);
  try {
    if (node.type === 'repeat') {
      const times = Math.max(0, Math.min(2000, Math.floor(num(node.val, 4))));
      for (let i = 0; i < times && isRunning; i++) {
        await execStack(node.body || [], sprite);
      }
      return;
    }
    if (node.type === 'forever') {
      while (isRunning) {
        const body = node.body || [];
        if (body.length) await execStack(body, sprite);
        else await sleep(120);
        await sleep(16);
      }
      return;
    }
    if (node.type === 'if_tilt' || node.type === 'if_score' || node.type === 'if_cond' || node.type === 'if_else') {
      const ok = checkNodeCondition(node);
      lastCond = ok;
      if (ok) await execStack(node.body || [], sprite);
      else if (node.elseBody) await execStack(node.elseBody, sprite);
      return;
    }
    if (node.type === 'sino') {
      if (!lastCond) await execStack(node.body || [], sprite);
      return;
    }
    await execBlock(node, sprite);
  } finally {
    glowOff(node.id);
  }
}

async function execStack(nodes, sprite) {
  if (!Array.isArray(nodes)) return;
  for (const node of nodes) {
    if (!isRunning) return;
    await execNode(node, sprite);
  }
}

async function runAll() {
  if (isRunning) return;
  isRunning = true;
  updateStatus();
  try {
    await Promise.all(sprites.map(s => execStack(s.code || [], s)));
  } catch (err) {
    console.error(err);
  } finally {
    isRunning = false;
    clearGlows();
    updateStatus();
  }
}

function stopCode() {
  isRunning = false;
  clearGlows();
  updateStatus();
}

function findTopNode(type) {
  for (const s of sprites) {
    const n = (s.code || []).find(node => node.type === type);
    if (n) return n;
  }
  return null;
}

function hasTopNode(type) {
  return !!findTopNode(type);
}

/* ---------------- actions ---------------- */
function toggleMulti() {
  multiOn = !multiOn;
  const t = UI[lang];
  $('#multiSub').textContent = multiOn ? t.multiOn : t.multiOff;
  $('#multiBtn').classList.toggle('is-on', multiOn);
  toast(multiOn ? t.multiOnMsg : t.multiOffMsg);
}

function shareProject() {
  let encoded = '';
  try {
    encoded = btoa(unescape(encodeURIComponent(JSON.stringify(serializeProject()))));
  } catch (e) {
    toast(UI[lang].badFile);
    return;
  }
  const base = (location.origin && location.origin !== 'null')
    ? location.origin + location.pathname
    : location.href.split('?')[0];
  $('#shareLink').value = base + '?p=' + encodeURIComponent(encoded);
  $('#shareModal').hidden = false;
  updateModalLock();
}

function closeShare() {
  $('#shareModal').hidden = true;
  updateModalLock();
}

async function copyShare() {
  const input = $('#shareLink');
  const value = input.value;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
    } else {
      input.focus();
      input.select();
      input.setSelectionRange(0, 99999);
      document.execCommand('copy');
    }
    closeShare();
    toast(UI[lang].copied);
  } catch (e) {
    input.focus();
    input.select();
  }
}

function exportProject() {
  const name = prompt(UI[lang].projName, 'Mi Juego') || 'Mi Juego';
  const project = serializeProject();
  project.name = name;
  project.savedAt = new Date().toISOString();
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = (name.replace(/[^a-z0-9_\-áéíóúñü ]/gi, '').trim() || 'proyecto') + '.scmo';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function importProject() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.scmo,.json,application/json';
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const p = JSON.parse(reader.result);
        if (!applyPayload(p)) { toast(UI[lang].badFile); return; }
        varFormOpen = false;
        stopCode();
        render();
        saveProject();
        toast(UI[lang].saved);
      } catch (err) {
        toast(UI[lang].badFile);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function clearProject() {
  if (!confirm(UI[lang].confirmClear)) return;
  stopCode();
  resetProjectData(false);
  varFormOpen = false;
  render();
  saveProject();
  toast(UI[lang].cleared);
}

function enterGame() {
  gameScrollY = window.scrollY || 0;
  document.body.classList.add('game-mode');
  window.scrollTo(0, 0);
  if (hasTopNode('when_flag')) runAll();
}

function exitGame() {
  stopCode();
  document.body.classList.remove('game-mode');
  window.scrollTo(0, gameScrollY || 0);
}

/* ---------------- events ---------------- */
function bindEvents() {
  $$('.lang-switch button').forEach(btn => {
    btn.addEventListener('click', () => {
      lang = btn.dataset.lang;
      store.set('scrachmo_lang', lang);
      render();
    });
  });

  $('#playBtn').addEventListener('click', runAll);
  $('#stopBtn').addEventListener('click', stopCode);
  $('#gameBtn').addEventListener('click', enterGame);
  $('#exitGame').addEventListener('click', e => { e.stopPropagation(); exitGame(); });

  $('#stage').addEventListener('click', e => {
    if (suppressStageClick) { suppressStageClick = false; return; }
    if (e.target.closest('.sprite-wrap')) return;
    if (e.target.closest('#exitGame')) return;
    if (isRunning) return;
    if (hasTopNode('when_tap')) runAll();
  });

  $('#spritesLayer').addEventListener('pointerdown', e => {
    if (document.body.classList.contains('game-mode')) return;
    const wrap = e.target.closest('.sprite-wrap');
    if (!wrap) return;
    startSpriteDrag(e, wrap);
  });

  $('#spriteTray').addEventListener('click', e => {
    const tile = e.target.closest('[data-sprite]');
    if (tile) { selectSprite(tile.dataset.sprite); return; }
    if (e.target.closest('[data-add-sprite]')) openSpriteModal();
  });

  $('#spriteChoices').addEventListener('click', e => {
    const b = e.target.closest('[data-emoji]');
    if (!b) return;
    addSprite(b.dataset.emoji);
  });

  $('#closeSpriteModal').addEventListener('click', closeSpriteModal);
  $('#spriteModal').addEventListener('click', e => { if (e.target === e.currentTarget) closeSpriteModal(); });

  const nameInput = $('#propName');
  nameInput.addEventListener('input', () => {
    const s = selectedSprite();
    if (!s) return;
    s.name = nameInput.value.slice(0, 20);
    renderTray();
    codeTitle();
    scheduleSave();
  });
  nameInput.addEventListener('blur', () => {
    const s = selectedSprite();
    if (!s) return;
    if (!s.name.trim()) s.name = UI[lang].spriteDefault;
    s.name = s.name.trim().slice(0, 20);
    nameInput.value = s.name;
    renderTray();
    codeTitle();
    saveProject();
  });

  const px = $('#propX');
  const py = $('#propY');
  const pd = $('#propDir');
  const ps = $('#propSize');
  px.addEventListener('input', () => { const s = selectedSprite(); if (s && px.value !== '') { s.x = clamp(num(px.value, s.x), -240, 240); updateSpriteEl(s); scheduleSave(); } });
  py.addEventListener('input', () => { const s = selectedSprite(); if (s && py.value !== '') { s.y = clamp(num(py.value, s.y), -180, 180); updateSpriteEl(s); scheduleSave(); } });
  pd.addEventListener('input', () => { const s = selectedSprite(); if (s && pd.value !== '') { s.dir = clamp(num(pd.value, s.dir), -180, 180); updateSpriteEl(s); scheduleSave(); } });
  ps.addEventListener('input', () => { const s = selectedSprite(); if (s && ps.value !== '') { s.size = clamp(num(ps.value, s.size), 20, 200); updateSpriteEl(s); scheduleSave(); } });
  px.addEventListener('change', () => { const s = selectedSprite(); if (s) { px.value = fmt(s.x); saveProject(); } });
  py.addEventListener('change', () => { const s = selectedSprite(); if (s) { py.value = fmt(s.y); saveProject(); } });
  pd.addEventListener('change', () => { const s = selectedSprite(); if (s) { s.dir = normDir(s.dir); pd.value = fmt(s.dir); saveProject(); } });
  ps.addEventListener('change', () => { const s = selectedSprite(); if (s) { ps.value = fmt(s.size); saveProject(); } });

  $('#propVisible').addEventListener('click', () => {
    const s = selectedSprite();
    if (!s) return;
    s.visible = !s.visible;
    updateSpriteEl(s);
    renderTray();
    renderProps();
    saveProject();
  });
  $('#propDelete').addEventListener('click', deleteSelectedSprite);

  $('#propRot').addEventListener('click', e => {
    const b = e.target.closest('[data-rot]');
    if (!b) return;
    const s = selectedSprite();
    if (!s) return;
    s.rot = normRot(b.dataset.rot);
    updateSpriteEl(s);
    renderProps();
    saveProject();
  });

  $('#scoreEye').addEventListener('click', () => {
    showScore = !showScore;
    updateHUD();
    saveProject();
  });
  const scoreInput = $('#scorePanelVal');
  scoreInput.addEventListener('input', () => {
    if (scoreInput.value === '') return;
    score = num(scoreInput.value, score);
    updateHUD();
    scheduleSave();
  });
  scoreInput.addEventListener('change', () => {
    score = num(scoreInput.value, score);
    scoreInput.value = String(score);
    updateHUD();
    saveProject();
  });

  $('#codeList').addEventListener('input', e => {
    const input = e.target.closest('input[data-input]');
    if (!input) return;
    const info = findNode(input.dataset.input);
    if (info) {
      info.node.val = input.value;
      scheduleSave();
    }
  });
  $('#codeList').addEventListener('change', saveProject);
  $('#codeList').addEventListener('click', e => {
    const del = e.target.closest('.sb-del');
    if (!del) return;
    deleteNode(del.dataset.del);
  });
  $('#codeList').addEventListener('pointerdown', e => {
    const grip = e.target.closest('.sb-grip');
    if (!grip) return;
    startBlockDrag(e, grip);
  });
  $('#codeList').addEventListener('keydown', e => {
    const grip = e.target.closest('.sb-grip');
    if (!grip) return;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(e.key) < 0) return;
    e.preventDefault();
    e.stopPropagation();
    moveBlockKeyboard(grip.dataset.grip, e.key);
  });

  window.addEventListener('pointermove', e => {
    if (blockDrag) moveBlockDrag(e);
    if (spriteDrag) moveSpriteDrag(e);
  }, { passive: false });
  window.addEventListener('pointerup', e => {
    if (blockDrag) endBlockDrag(e, false);
    if (spriteDrag) endSpriteDrag(e, false);
  });
  window.addEventListener('pointercancel', e => {
    if (blockDrag) endBlockDrag(e, true);
    if (spriteDrag) endSpriteDrag(e, true);
  });

  $('#palette').addEventListener('click', e => {
    const item = e.target.closest('[data-add]');
    if (!item) return;
    addBlock(item.dataset.add);
  });
  $('#palette').addEventListener('keydown', e => {
    const item = e.target.closest('[data-add]');
    if (!item) return;
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    addBlock(item.dataset.add);
  });

  $('#searchBlocks').addEventListener('input', e => {
    searchTerm = e.target.value;
    renderPalette(UI[lang]);
  });

  $('#catChips').addEventListener('click', e => {
    const chip = e.target.closest('[data-cat]');
    if (!chip) return;
    currentFilter = chip.dataset.cat;
    searchTerm = '';
    $('#searchBlocks').value = '';
    renderCats(UI[lang]);
    renderPalette(UI[lang]);
  });

  $('#goBlocks').addEventListener('click', () => {
    const card = $('#blocksCard');
    collapsed.blocksCard = false;
    store.set('scrachmo_ui', JSON.stringify(collapsed));
    card.classList.remove('is-collapsed');
    const head = card.querySelector('[data-collapse]');
    if (head) head.setAttribute('aria-expanded', 'true');
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    card.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  });

  $('#newVarBtn').addEventListener('click', openVarForm);
  $('#varsList').addEventListener('click', e => {
    const del = e.target.closest('[data-del-var]');
    if (del) { deleteVariable(del.dataset.delVar); return; }
    const eye = e.target.closest('[data-eye]');
    if (eye) { toggleVarVisibility(eye.dataset.eye); return; }
    const step = e.target.closest('[data-var-step]');
    if (step) { stepVariable(step.dataset.varStep, Number(step.dataset.step)); return; }
    if (e.target.closest('#cancelVar')) closeVarForm();
  });
  $('#varsList').addEventListener('submit', e => {
    if (e.target && e.target.id === 'varForm') {
      e.preventDefault();
      createVariable();
    }
  });
  $('#varsList').addEventListener('input', e => {
    const inp = e.target.closest('input[data-var]');
    if (inp) {
      const name = inp.dataset.var;
      if (name in variables) {
        variables[name] = parseVarValue(inp.value);
        updateHUD();
        scheduleSave();
      }
      return;
    }
    if (e.target.id === 'newVarName') {
      const hint = $('#varFormHint');
      if (hint) { hint.textContent = UI[lang].varNameHint; hint.classList.remove('error'); }
    }
  });
  $('#varsList').addEventListener('focusout', e => {
    const inp = e.target.closest('input[data-var]');
    if (!inp) return;
    const name = inp.dataset.var;
    if (name in variables) inp.value = String(variables[name]);
  });

  $('#saveBtn').addEventListener('click', () => { saveProject(); toast(UI[lang].saved); });
  $('#shareBtn').addEventListener('click', shareProject);
  $('#exportBtn').addEventListener('click', exportProject);
  $('#importBtn').addEventListener('click', importProject);
  $('#multiBtn').addEventListener('click', toggleMulti);
  $('#clearBtn').addEventListener('click', clearProject);

  $('#closeShare').addEventListener('click', closeShare);
  $('#copyLink').addEventListener('click', copyShare);
  $('#shareModal').addEventListener('click', e => { if (e.target === e.currentTarget) closeShare(); });

  $$('[data-collapse]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.collapse;
      const card = document.getElementById(id);
      const on = !card.classList.contains('is-collapsed');
      card.classList.toggle('is-collapsed', on);
      btn.setAttribute('aria-expanded', String(!on));
      collapsed[id] = on;
      store.set('scrachmo_ui', JSON.stringify(collapsed));
    });
  });

  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (blockDrag) { endBlockDrag(null, true); return; }
      if (spriteDrag) { endSpriteDrag(null, true); return; }
      if (!$('#spriteModal').hidden) { closeSpriteModal(); return; }
      if (!$('#shareModal').hidden) { closeShare(); return; }
      if (document.body.classList.contains('game-mode')) exitGame();
      return;
    }
    if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    if (isRunning) return;
    const trigger = findTopNode('when_key');
    if (!trigger) return;
    const norm = k => {
      const s = String(k).trim().toLowerCase();
      const map = {
        espacio: ' ', space: ' ', enter: 'enter',
        arriba: 'arrowup', abajo: 'arrowdown', izquierda: 'arrowleft', derecha: 'arrowright'
      };
      return map[s] || s;
    };
    const key = e.key === ' ' ? ' ' : e.key.toLowerCase();
    if (norm(trigger.val || 'espacio') === key) {
      e.preventDefault();
      runAll();
    }
  });

  window.addEventListener('devicemotion', e => {
    const acc = e.accelerationIncludingGravity;
    if (!acc) return;
    window.lastTilt = acc.x || 0;
    const force = Math.sqrt(
      Math.pow(acc.x || 0, 2) + Math.pow(acc.y || 0, 2) + Math.pow(acc.z || 0, 2)
    );
    if (force > 25 && !isRunning && hasTopNode('when_shake')) runAll();
  });

  window.addEventListener('storage', e => {
    if (e.key === 'scrachmo_msg' && multiOn && !isRunning && hasTopNode('when_msg')) runAll();
  });

  setInterval(() => {
    const trigger = findTopNode('when_score');
    if (!trigger) { scoreFired = false; return; }
    const target = num(trigger.val, 10);
    if (score >= target) {
      if (!isRunning && !scoreFired) { scoreFired = true; runAll(); }
    } else {
      scoreFired = false;
    }
  }, 300);
}

/* ---------------- start ---------------- */
loadProject();
bindEvents();
render();
