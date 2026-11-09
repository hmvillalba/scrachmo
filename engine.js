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
let stageBgImg = '';
let showScore = false;
let score = 0;
/* Cronómetro: corre desde que se abre el proyecto y se reinicia con el bloque
   correspondiente. No se toca al dar Ejecutar, igual que en Scratch. */
let timerStart = Date.now();
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
let spriteDrag = null;
let lastPaletteDragAt = 0;
let audioCtx = null;
/* Volumen del proyecto, 0 a 100. Lo cambian los bloques de sonido y se guarda
   con el proyecto, así un juego puede venir ya con la música más baja. */
let volume = 100;
/* Música en bucle: guardamos el temporizador y la melodía para poder cortarla
   desde «detener los sonidos», desde Detener y al cambiar de melodía. */
let musicTimer = null;
let musicId = '';
const liveNodes = new Set();
let gameScrollY = 0;
let suppressStageClick = false;
let toastTimer = null;
let saveTimer = null;
const sayTimers = new Map();
const sayTexts = new Map();

/* runtime: un hilo por guion, con su propio estado de condición */
const runThreads = new Set();
const glowCounts = new Map();
const firedScoreHats = new Set();
let runActive = false;
let runtimeSnapshot = null;
let threadSeq = 0;
let lastShakeAt = 0;
let lastMsgAt = 0;
let motionRequested = false;
let spriteSearchTerm = '';

/* disfraces: límites pensados para no reventar el guardado local (5 MB)
   ni los links compartidos. Un dataURL de ~300 KB por disfraz como tope. */
const MAX_COSTUMES = 12;
const MAX_IMG_CHARS = 400000;
const COSTUME_MAX_PX = 256;
const IMG_DATA_RE = /^data:image\/(webp|png|jpeg|gif);base64,[A-Za-z0-9+/=]+$/;
const COSTUME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/bmp'];
let storageWarned = false;

/* Fondo propio: permitimos más resolución que en un disfraz, pero con tope
   propio para no reventar localStorage ni los links compartidos. */
const BG_MAX_PX = 1280;
const MAX_BG_CHARS = 900000;

/* Topes al abrir un proyecto ageno (link ?p=, .scmo o guardado viejo).
   Un árbol muy profundo desbordaría la pila de normalizeNodes() y un JSON
   gigante congelaría el hilo principal al descomprimirlo. */
const MAX_CODE_DEPTH = 40;
const MAX_CODE_NODES = 2000;
const MAX_PAYLOAD_CHARS = 8000000;
let importNodeCount = 0;
let importTruncated = false;
const payloadTooBig = text => String(text).length > MAX_PAYLOAD_CHARS;

/* Dos zooms independientes: el del área de código y el del escenario
   (éste escala la altura de la escena y el tamaño de los personajes).
   Ninguno de los dos forma parte del proyecto: son preferencias de UI. */
const ZOOM_MIN = 0.7;
const ZOOM_MAX = 1.6;
const ZOOM_STEP = 0.1;
const HISTORY_MAX = 60;
let codeZoom = 1;
let stageZoom = 1;
const undoStack = [];
const redoStack = [];
let lastHistoryState = null;
let historyMuted = false;

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

/* SPRITE_GROUPS y SPRITE_CHOICES viven en data.js */

/* Sólo aceptamos imágenes raster embebidas: ni SVG ni URLs externas. */
function validBackdrop(src) {
  return (typeof src === 'string' && src.length <= MAX_BG_CHARS && IMG_DATA_RE.test(src)) ? src : '';
}

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
/* Links compartidos:
     'g1.' + gzip(JSON) en base64url  (nuevo, comprimido)
     'j1.' + JSON en base64url        (fallback sin CompressionStream)
     base64 plano                     (links viejos, se siguen leyendo)
   Prefijo de 3 caracteres con un punto: un base64 plano jamás lo tiene,
   así que no hay ambigüedad al distinguir formatos. base64url evita el
   '+' que los query strings convierten en espacio. */
function bytesToB64Url(bytes) {
  let bin = '';
  const CH = 0x8000;
  for (let i = 0; i < bytes.length; i += CH) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64UrlToBytes(s) {
  const b = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) out[i] = b.charCodeAt(i);
  return out;
}

function decodeShare(s) {
  if (payloadTooBig(s)) return null;
  try {
    const text = decodeURIComponent(escape(atob(s)));
    if (payloadTooBig(text)) return null;
    return JSON.parse(text);
  } catch (e) { return null; }
}

async function encodeSharePayload(payload) {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  if (typeof CompressionStream === 'function') {
    try {
      const gz = new Uint8Array(await new Response(
        new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'))
      ).arrayBuffer());
      return 'g1.' + bytesToB64Url(gz);
    } catch (e) { }
  }
  return 'j1.' + bytesToB64Url(bytes);
}

async function decodeShareAsync(code) {
  if (!code) return null;
  const kind = code.slice(0, 3);
  if (kind !== 'g1.' && kind !== 'j1.') return decodeShare(code);
  /* Freno antes de atob()/descomprimir: un link hostil no debe congelar la UI. */
  if (payloadTooBig(code)) return null;
  try {
    let bytes = b64UrlToBytes(code.slice(3));
    if (kind === 'g1.') {
      if (typeof DecompressionStream !== 'function') return null;
      bytes = new Uint8Array(await new Response(
        new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))
      ).arrayBuffer());
    }
    const text = new TextDecoder().decode(bytes);
    if (payloadTooBig(text)) return null;
    return JSON.parse(text);
  } catch (e) { return null; }
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
  const s = {
    id: uid('s'),
    name: name,
    x: 0, y: 0, dir: 90, size: 100, visible: true, rot: 'all',
    costumes: normalizeCostumes(null, emoji || '🐱'),
    costumeIndex: 0,
    code: code || []
  };
  syncCostume(s);
  return s;
}

/* ---------------- disfraces ----------------
   Cada sprite tiene 1..12 disfraces {id, name, kind, src}.
   kind 'emoji' guarda el emoji; kind 'img' guarda un dataURL raster
   validado. s.emoji y s.img son campos DERIVADOS: se mantienen para
   que el render y los proyectos viejos sigan funcionando. */
function makeCostume(kind, src, name) {
  return { id: uid('c'), kind: kind === 'img' ? 'img' : 'emoji', src: src, name: name };
}

function currentCostume(s) {
  if (!s || !Array.isArray(s.costumes) || !s.costumes.length) return null;
  return s.costumes[clamp(Math.floor(num(s.costumeIndex, 0)), 0, s.costumes.length - 1)] || s.costumes[0];
}

function syncCostume(s) {
  const c = currentCostume(s);
  s.emoji = c && c.kind === 'emoji' ? c.src : '';
  s.img = c && c.kind === 'img' ? c.src : '';
}

function costumeHTML(c) {
  if (!c) return '';
  if (c.kind === 'img') return '<img class="costume-img" alt="" draggable="false" src="' + esc(c.src) + '">';
  return '<span class="costume-emoji">' + esc(c.src) + '</span>';
}

function costumeFaceHTML(s) {
  return costumeHTML(currentCostume(s));
}

function normalizeCostume(raw, i, used) {
  if (!raw || typeof raw !== 'object') return null;
  const kind = raw.kind === 'img' ? 'img' : 'emoji';
  let src = typeof raw.src === 'string' ? raw.src : '';
  if (kind === 'img') {
    /* Ni SVG, ni URLs externas, ni esquemas raros: sólo raster embebido.
       Los links ?p= son datos que vienen de afuera. */
    if (!IMG_DATA_RE.test(src) || src.length > MAX_IMG_CHARS) return null;
  } else {
    src = src.slice(0, 8) || '🐱';
  }
  let id = (typeof raw.id === 'string' && raw.id) ? raw.id : uid('c');
  if (used.has(id)) id = uid('c');
  used.add(id);
  const name = (typeof raw.name === 'string' && raw.name.trim())
    ? raw.name.trim().slice(0, 24)
    : (UI[lang].costumeDefault + ' ' + (i + 1));
  return { id: id, kind: kind, src: src, name: name };
}

function normalizeCostumes(raw, fallbackEmoji) {
  const used = new Set();
  let list = [];
  if (Array.isArray(raw)) {
    raw.slice(0, MAX_COSTUMES).forEach((c, i) => {
      const n = normalizeCostume(c, i, used);
      if (n) list.push(n);
    });
  }
  if (!list.length) list = [makeCostume('emoji', fallbackEmoji || '🐱', UI[lang].costumeDefault + ' 1')];
  return list;
}

function updateCostumeEl(s) {
  const el = findSpriteEl(s.id);
  const face = el && el.querySelector('.sprite-emoji');
  if (!face) { renderSprites(); return; }
  face.innerHTML = costumeFaceHTML(s);
  face.style.transform = spriteTransform(s);
}

function setCostume(s, index) {
  if (!s || !Array.isArray(s.costumes) || !s.costumes.length) return;
  const n = s.costumes.length;
  const i = ((Math.floor(num(index, 0)) % n) + n) % n;
  if (i === s.costumeIndex) return;
  s.costumeIndex = i;
  syncCostume(s);
  updateCostumeEl(s);
  renderTray();
  renderProps();
}

/* Los bloques guardan el nombre (estable si se borra o reordena la tira).
   El índice 1-based se acepta sólo por compatibilidad con proyectos viejos. */
function findCostumeIndex(s, value) {
  if (!s || !Array.isArray(s.costumes) || !s.costumes.length) return -1;
  const str = String(value == null ? '' : value).trim();
  const byName = s.costumes.findIndex(c => c.name === str);
  if (byName >= 0) return byName;
  const n = Math.floor(num(str, NaN));
  if (Number.isFinite(n)) return clamp(n - 1, 0, s.costumes.length - 1);
  return -1;
}

/* Un reportero es un nodo que devuelve un valor y vive en node.reps[i],
   dentro de una casilla de otro bloque. node.val sigue siendo el escalar de
   siempre: los proyectos viejos no tienen reps y no cambian de formato.
   Los ids de los reporteros también son únicos en todo el árbol. */
function normalizeOneNode(raw, seen, depth, wantRep) {
  if (!raw || typeof raw !== 'object') return null;
  if (importNodeCount >= MAX_CODE_NODES) { importTruncated = true; return null; }
  const type = raw.type || raw.id;
  const def = BYID[type];
  if (!def) return null;
  /* Los reporteros no son enunciados y los enunciados no son reporteros. */
  if (wantRep ? !def.rep : def.rep) return null;
  if (type === 'show2' || type === 'hide2' || type === 'move2') return null;
  let id = (typeof raw.id === 'string' && raw.id && raw.id !== type) ? raw.id : uid('b');
  if (seen.has(id)) id = uid('b');
  seen.add(id);
  importNodeCount++;
  const node = {
    id: id,
    type: type,
    val: raw.val !== undefined ? raw.val : (def.def !== undefined ? def.def : 0)
  };
  /* Sólo los bloques declarados como anfitriones (y los propios reporteros,
     para poder anidar) aceptan casillas con reportero. Ignorar reps en
     sombreros o en bloques de texto evita estados imposibles al importar. */
  if ((def.repOk || def.rep) && !def.repName) {
    const label = def.n[lang] || def.n.es || '';
    const count = (label.match(/\{(?:v|x|y)\}/g) || []).length;
    const reps = normalizeReps(raw.reps, seen, depth + 1, count);
    if (reps) node.reps = reps;
  }
  if (def.c) {
    node.body = normalizeNodes(raw.body, seen, depth + 1);
    if (def.else || Array.isArray(raw.elseBody)) node.elseBody = normalizeNodes(raw.elseBody, seen, depth + 1);
  }
  return node;
}

function normalizeReps(raw, seen, depth, count) {
  if (!Array.isArray(raw)) return null;
  if (depth >= MAX_CODE_DEPTH) {
    if (raw.length) importTruncated = true;
    return null;
  }
  /* Una casilla por hueco: los reps de más se descartan en silencio
     (son datos inválidos, no un proyecto grande). */
  const limit = Math.min(raw.length, count === undefined ? raw.length : count);
  const out = [];
  let any = false;
  for (let i = 0; i < limit; i++) {
    const n = raw[i] ? normalizeOneNode(raw[i], seen, depth, true) : null;
    out[i] = n;
    if (n) any = true;
  }
  return any ? out : null;
}

function normalizeNodes(list, seen, depth) {
  if (!Array.isArray(list)) return [];
  if (!seen) seen = new Set();
  if (depth === undefined) depth = 0;
  const out = [];
  if (depth >= MAX_CODE_DEPTH) {
    if (list.length) importTruncated = true;
    return out;
  }
  list.forEach(raw => {
    const node = normalizeOneNode(raw, seen, depth, false);
    if (node) out.push(node);
  });
  return out;
}

function migrateOldCode(flat) {
  if (!Array.isArray(flat)) return [];
  const list = flat.filter(b => b && BYID[b.id] && !BYID[b.id].rep &&
    b.id !== 'show2' && b.id !== 'hide2' && b.id !== 'move2');
  if (list.length > MAX_CODE_NODES) { importTruncated = true; list.length = MAX_CODE_NODES; }
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
        const rest = list.slice(i + 1).filter(x => x.id !== 'sino' && !BYID[x.id].rep);
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
      const costumes = normalizeCostumes(raw.costumes, emoji);
      const s = {
        id: id,
        name: name,
        x: clamp(num(raw.x, 0), -240, 240),
        y: clamp(num(raw.y, 0), -180, 180),
        dir: normDir(num(raw.dir, 90)),
        size: clamp(num(raw.size, 100), 20, 200),
        visible: raw.visible !== false,
        rot: normRot(raw.rot),
        costumes: costumes,
        costumeIndex: clamp(Math.floor(num(raw.costumeIndex, 0)), 0, costumes.length - 1),
        code: normalizeNodes(raw.code, new Set())
      };
      syncCostume(s);
      out.push(s);
    });
  }
  return out.length ? out : [createSpriteData('🐱', 'Gato', defaultCode())];
}

function applyPayload(payload) {
  const ok = applyPayloadInner(payload);
  /* Diferimos el aviso: applyPayload() también corre durante el arranque,
     antes de que bindEvents() y render() dejen el DOM listo. */
  if (ok && importTruncated) setTimeout(() => toast(UI[lang].projectTooBig), 0);
  return ok;
}

function applyPayloadInner(payload) {
  if (!payload) return false;
  /* Cada proyecto importado arranca con presupuesto limpio de nodos. */
  importNodeCount = 0;
  importTruncated = false;
  /* Un proyecto nuevo (guardado, link, importación o deshacer) no arrastra
     la posición inicial de una corrida anterior. */
  runtimeSnapshot = null;
  updateResetButton();
  /* Tampoco arrastra la música del proyecto anterior. */
  stopAllSounds();
  score = clamp(num(payload.score, 0), -1000000, 1000000);
  multiOn = !!payload.multiOn;
  volume = clamp(Math.round(num(payload.volume, 100)), 0, 100);
  applyVolume();

  if (payload && Array.isArray(payload.sprites)) {
    sprites = normalizeSprites(payload.sprites);
    variables = (payload.variables && typeof payload.variables === 'object' && !Array.isArray(payload.variables)) ? payload.variables : {};
    loadHidden(payload.hidden);
    stageBg = clamp(Math.floor(num(payload.stageBg, 0)), 0, BG.length - 1);
    stageBgImg = validBackdrop(payload.stageBgImg);
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
  stageBgImg = '';
  showScore = false;
  return true;
}

function resetProjectData(withCode) {
  sprites = [createSpriteData('🐱', 'Gato', withCode ? defaultCode() : [])];
  selectedSpriteId = sprites[0].id;
  variables = {};
  hiddenVars = {};
  stageBg = 0;
  stageBgImg = '';
  showScore = false;
  score = 0;
  multiOn = false;
  volume = 100;
  applyVolume();
  stopAllSounds();
  isRunning = false;
  runActive = false;
  runtimeSnapshot = null;
  runThreads.forEach(t => { t.cancelled = true; });
  runThreads.clear();
  firedScoreHats.clear();
  glowCounts.clear();
  sayTexts.clear();
  sayTimers.forEach(t => clearTimeout(t));
  sayTimers.clear();
}

function loadProject() {
  let payload = null;
  let pendingShare = null;
  try {
    const shared = new URLSearchParams(location.search).get('p');
    if (shared) {
      const code = shared.replace(/ /g, '+');
      const kind = code.slice(0, 3);
      /* La descompresión es asíncrona: devolvemos el código y lo aplicamos
         apenas termina el arranque, sin bloquear el primer render. */
      if (kind === 'g1.' || kind === 'j1.') pendingShare = code;
      else payload = decodeShare(code);
    }
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

  /* scrachmo_ui antes guardaba sólo `collapsed`; aceptamos las dos formas. */
  try {
    const ui = JSON.parse(store.get('scrachmo_ui') || '{}') || {};
    collapsed = (ui.collapsed && typeof ui.collapsed === 'object') ? ui.collapsed : ui;
    codeZoom = clamp(num(ui.codeZoom, 1), ZOOM_MIN, ZOOM_MAX);
    stageZoom = clamp(num(ui.stageZoom, 1), ZOOM_MIN, ZOOM_MAX);
  } catch (e) { collapsed = {}; codeZoom = 1; stageZoom = 1; }
  return pendingShare;
}

async function hydrateShared(code) {
  const payload = await decodeShareAsync(code);
  const t = UI[lang];
  if (!payload) { toast(t.badFile); return; }
  stopCode();
  if (!applyPayload(payload)) { toast(t.badFile); return; }
  varFormOpen = false;
  render();
  resetHistory();
  toast(t.sharedLoaded);
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
      costumes: s.costumes,
      costumeIndex: s.costumeIndex,
      code: s.code
    })),
    variables: variables,
    hidden: hiddenList(),
    stageBg: stageBg,
    stageBgImg: stageBgImg,
    showScore: showScore,
    score: score,
    multiOn: multiOn,
    volume: volume,
    selected: selectedSpriteId
  };
}

/* ---------------- historial de deshacer / rehacer ----------------
   Guardamos instantáneas del proyecto de diseño. Engancharlo a saveProject()
   cubre todas las mutaciones (agregar, borrar, arrastrar, escribir valores,
   disfraces, fondo, variables) sin tener que tocar cada función por separado. */
function resetHistory() {
  undoStack.length = 0;
  redoStack.length = 0;
  lastHistoryState = JSON.stringify(serializeProject());
  undoStack.push(lastHistoryState);
  updateHistoryButtons();
}

function recordHistory() {
  if (historyMuted) return;
  const snap = JSON.stringify(serializeProject());
  if (snap === lastHistoryState) return;
  undoStack.push(snap);
  if (undoStack.length > HISTORY_MAX) undoStack.shift();
  redoStack.length = 0;
  lastHistoryState = snap;
  updateHistoryButtons();
}

function updateHistoryButtons() {
  const u = $('#undoBtn');
  const r = $('#redoBtn');
  if (u) u.disabled = undoStack.length < 2;
  if (r) r.disabled = redoStack.length === 0;
}

function applyHistorySnapshot(snap) {
  historyMuted = true;
  try {
    if (applyPayload(JSON.parse(snap))) {
      varFormOpen = false;
      render();
      saveProject();
    }
  } catch (e) { }
  historyMuted = false;
  lastHistoryState = snap;
  updateHistoryButtons();
}

function undo() {
  if (undoStack.length < 2) { toast(UI[lang].undoNone); return; }
  redoStack.push(undoStack.pop());
  applyHistorySnapshot(undoStack[undoStack.length - 1]);
}

function redo() {
  if (!redoStack.length) return;
  const snap = redoStack.pop();
  undoStack.push(snap);
  applyHistorySnapshot(snap);
}

function saveUI() {
  store.set('scrachmo_ui', JSON.stringify({
    collapsed: collapsed, codeZoom: codeZoom, stageZoom: stageZoom
  }));
}

/* Escribir sin tocar el historial: lo usa el final de una corrida, que no
   es una edición del usuario y no debe aparecer como paso de «Deshacer». */
function persistProject() {
  /* Con imágenes embebidas el dispositivo puede quedarse sin cupo:
     avisar una sola vez en vez de fallar en silencio. */
  const ok = store.set('scrachmo_v8', JSON.stringify(serializeProject()));
  if (!ok && !storageWarned) { storageWarned = true; toast(UI[lang].storageFull); }
  if (ok) storageWarned = false;
  /* El payload no se copia acá: el proyecto activo vive en `scrachmo_v8` y sólo
     se respalda en su propio slot al cambiar de proyecto. Duplicarlo en cada
     guardado dejaría la mitad del cupo libre para las imágenes. */
  if (ok && activeProjectId) {
    const p = activeProject();
    if (p) { p.updatedAt = Date.now(); writeProjects(); }
  }
  return ok;
}

function saveProject() {
  persistProject();
  recordHistory();
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveProject, 400);
}

/* ---------------- biblioteca de proyectos ----------------
   El proyecto activo sigue viviendo en `scrachmo_v8`: el arranque, los links
   y todo lo ya probado no cambian. Encima va un índice liviano con el nombre
   de cada proyecto y una copia de cada uno en su propia clave. Así abrir otro
   proyecto no pisa el anterior. */

const PROJECTS_KEY = 'scrachmo_projects';
const ACTIVE_KEY = 'scrachmo_active';
const PROJECT_PREFIX = 'scrachmo_proj_';
const MAX_PROJECTS = 24;

let projects = [];
let activeProjectId = '';

function projectKey(id) { return PROJECT_PREFIX + id; }

function readProjects() {
  try {
    const list = JSON.parse(store.get(PROJECTS_KEY) || '[]');
    if (!Array.isArray(list)) return [];
    return list
      .filter(p => p && typeof p.id === 'string' && p.id)
      .map(p => ({
        id: p.id,
        name: String(p.name || '').slice(0, 40),
        updatedAt: Number(p.updatedAt) || 0
      }));
  } catch (e) { return []; }
}

function writeProjects() {
  store.set(PROJECTS_KEY, JSON.stringify(projects));
  store.set(ACTIVE_KEY, activeProjectId);
}

function activeProject() {
  return projects.find(p => p.id === activeProjectId) || null;
}

/* Al arrancar: si no hay índice, el proyecto que ya estaba guardado pasa a ser
   el primero, así no se pierde nada de lo que el usuario tenía. */
function initProjects() {
  projects = readProjects();
  activeProjectId = store.get(ACTIVE_KEY) || '';
  if (!projects.length) {
    activeProjectId = uid('p');
    projects = [{ id: activeProjectId, name: UI[lang].untitledProject, updatedAt: Date.now() }];
    writeProjects();
    persistProject();
    return;
  }
  if (!projects.some(p => p.id === activeProjectId)) activeProjectId = projects[0].id;
  writeProjects();
  /* Caso borde: si alguien limpió la clave compartida pero el slot del activo
     sigue ahí, se recupera en vez de arrancar con un proyecto vacío. */
  if (!store.get('scrachmo_v8') && store.get(projectKey(activeProjectId))) {
    const raw = store.get(projectKey(activeProjectId));
    try {
      if (applyPayload(JSON.parse(raw))) store.set('scrachmo_v8', raw);
    } catch (e) { }
  }
  /* Si el slot del activo quedó vacío, se repone con lo que hay en memoria. */
  if (!store.get(projectKey(activeProjectId))) persistProject();
}

function projectLabel(p) {
  if (!p.updatedAt) return '';
  try {
    const d = new Date(p.updatedAt);
    return d.toLocaleDateString(lang, { day: '2-digit', month: 'short' }) + ' · ' +
      d.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' });
  } catch (e) { return ''; }
}

function updateProjectName() {
  const el = $('#projName');
  if (!el) return;
  const p = activeProject();
  el.textContent = p ? p.name : '';
}

function renderProjects() {
  const box = $('#projList');
  if (!box) return;
  const t = UI[lang];
  box.textContent = '';
  if (!projects.length) {
    const empty = document.createElement('p');
    empty.className = 'proj-empty';
    empty.textContent = t.projectsEmpty;
    box.appendChild(empty);
    return;
  }

  const action = (kind, label, icon, id) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'proj-act';
    b.dataset.projAct = kind;
    b.dataset.projId = id;
    b.title = label;
    b.setAttribute('aria-label', label);
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'ic');
    svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', icon);
    svg.appendChild(use);
    b.appendChild(svg);
    return b;
  };

  projects.slice().sort((a, b) => b.updatedAt - a.updatedAt).forEach(p => {
    const row = document.createElement('div');
    row.className = 'proj-item' + (p.id === activeProjectId ? ' active' : '');

    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'proj-open';
    open.dataset.projOpen = p.id;
    const name = document.createElement('b');
    name.textContent = p.name;
    const meta = document.createElement('small');
    meta.textContent = projectLabel(p) +
      (p.id === activeProjectId ? ' · ' + t.currentProject : '');
    open.appendChild(name);
    open.appendChild(meta);

    const acts = document.createElement('div');
    acts.className = 'proj-acts';
    acts.appendChild(action('rename', t.renameProject, '#i-edit', p.id));
    acts.appendChild(action('duplicate', t.duplicateProject, '#i-copy', p.id));
    acts.appendChild(action('delete', t.deleteProject, '#i-trash', p.id));

    row.appendChild(open);
    row.appendChild(acts);
    box.appendChild(row);
  });
}

function openProjects() {
  const modal = $('#projModal');
  if (!modal) return;
  renderProjects();
  modal.hidden = false;
  updateModalLock();
}

function closeProjects() {
  const modal = $('#projModal');
  if (!modal || modal.hidden) return;
  modal.hidden = true;
  updateModalLock();
}

function newProject() {
  const t = UI[lang];
  if (projects.length >= MAX_PROJECTS) { toast(t.projectLimit); return; }
  /* Se respalda el actual antes de soltar la referencia. */
  if (!persistProject()) return;
  if (!stashActiveProject()) return;
  const id = uid('p');
  projects.unshift({
    id: id,
    name: t.untitledProject + ' ' + (projects.length + 1),
    updatedAt: Date.now()
  });
  activeProjectId = id;
  writeProjects();
  stopCode();
  resetProjectData(true);
  resetHistory();
  render();
  persistProject();
  updateProjectName();
  renderProjects();
  toast(t.projectCreated);
}

/* Respalda el proyecto activo en su propio slot antes de pisar la clave
   compartida. Devuelve false si el dispositivo se quedó sin cupo. */
function stashActiveProject() {
  if (!activeProjectId) return true;
  const raw = store.get('scrachmo_v8');
  if (!raw) return true;
  if (store.set(projectKey(activeProjectId), raw)) return true;
  if (!storageWarned) { storageWarned = true; toast(UI[lang].storageFull); }
  return false;
}

function openProject(id) {
  const t = UI[lang];
  if (!id || id === activeProjectId) { closeProjects(); return; }
  const target = projects.find(p => p.id === id);
  if (!target) return;
  if (!persistProject()) return;
  const raw = store.get(projectKey(id));
  let payload = null;
  try { payload = JSON.parse(raw || 'null'); } catch (e) { payload = null; }
  if (!payload) { toast(t.badFile); return; }
  if (!stashActiveProject()) return;
  stopCode();
  if (!applyPayload(payload)) { toast(t.badFile); return; }
  activeProjectId = id;
  writeProjects();
  /* El nuevo activo pasa a vivir en la clave de siempre. */
  store.set('scrachmo_v8', raw);
  store.del(projectKey(id));
  varFormOpen = false;
  resetHistory();
  render();
  updateProjectName();
  closeProjects();
  toast(t.projectOpened);
}

async function renameProject(id) {
  const t = UI[lang];
  const p = projects.find(x => x.id === id);
  if (!p) return;
  const name = await askText(t.projectName, p.name, t.projectNameHint);
  if (name === null) return;
  const clean = String(name).replace(/\s+/g, ' ').trim().slice(0, 40);
  if (!clean) return;
  p.name = clean;
  p.updatedAt = Date.now();
  writeProjects();
  updateProjectName();
  renderProjects();
  toast(t.projectRenamed);
}

function duplicateProject(id) {
  const t = UI[lang];
  if (projects.length >= MAX_PROJECTS) { toast(t.projectLimit); return; }
  const src = projects.find(p => p.id === id);
  if (!src) return;
  if (id === activeProjectId && !persistProject()) return;
  /* El activo vive en `scrachmo_v8`; los demás, en su propio slot. */
  const raw = (id === activeProjectId) ? store.get('scrachmo_v8') : store.get(projectKey(id));
  if (!raw) { toast(t.badFile); return; }
  const nid = uid('p');
  projects.unshift({
    id: nid,
    name: (src.name.slice(0, 34) + ' (2)'),
    updatedAt: Date.now()
  });
  store.set(projectKey(nid), raw);
  writeProjects();
  renderProjects();
  toast(t.projectDuplicated);
}

async function deleteProject(id) {
  const t = UI[lang];
  if (projects.length <= 1) { toast(t.onlyOneProject); return; }
  const p = projects.find(x => x.id === id);
  if (!p) return;
  const sure = await askConfirm(t.deleteProject + ': «' + p.name + '»?');
  if (!sure) return;

  const wasActive = id === activeProjectId;
  projects = projects.filter(x => x.id !== id);

  if (wasActive) {
    const next = projects[0];
    const raw = store.get(projectKey(next.id));
    let payload = null;
    try { payload = JSON.parse(raw || 'null'); } catch (e) { payload = null; }
    stopCode();
    activeProjectId = next.id;
    if (payload && applyPayload(payload)) {
      store.set('scrachmo_v8', raw);
      store.del(projectKey(next.id));
      resetHistory();
      render();
    } else {
      resetProjectData(true);
      persistProject();
    }
    updateProjectName();
  }
  writeProjects();
  store.del(projectKey(id));
  renderProjects();
  toast(t.projectDeleted);
}

function bindProjects() {
  const btn = $('#projectsBtn');
  if (btn) btn.addEventListener('click', openProjects);
  const close = $('#projClose');
  if (close) close.addEventListener('click', closeProjects);
  const fresh = $('#projNew');
  if (fresh) fresh.addEventListener('click', newProject);

  const modal = $('#projModal');
  if (!modal) return;
  modal.addEventListener('click', e => {
    if (e.target === modal) { closeProjects(); return; }
    const open = e.target.closest('[data-proj-open]');
    if (open) { openProject(open.dataset.projOpen); return; }
    const act = e.target.closest('[data-proj-act]');
    if (!act) return;
    if (act.dataset.projAct === 'rename') renameProject(act.dataset.projId);
    else if (act.dataset.projAct === 'duplicate') duplicateProject(act.dataset.projId);
    else if (act.dataset.projAct === 'delete') deleteProject(act.dataset.projId);
  });
  document.addEventListener('keydown', e => {
    if (!modal.hidden && e.key === 'Escape') { e.preventDefault(); closeProjects(); }
  });
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

async function deleteSelectedSprite() {
  const t = UI[lang];
  if (sprites.length <= 1) { toast(t.cantDeleteSprite); return; }
  const s = selectedSprite();
  if (!s) return;
  if (!(await askConfirm(t.confirmDeleteSprite, t.deleteSprite))) return;
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
  spriteSearchTerm = '';
  const search = $('#spriteSearch');
  if (search) search.value = '';
  renderSpriteChoices();
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
  const ask = $('#askModal');
  const rep = $('#repPicker');
  const proj = $('#projModal');
  const anyOpen = !$('#shareModal').hidden || !$('#spriteModal').hidden ||
    !!(ask && !ask.hidden) || !!(rep && !rep.hidden) || !!(proj && !proj.hidden);
  document.body.classList.toggle('modal-open', anyOpen);
}

/* ---------------- diálogos propios ----------------
   Reemplazan prompt()/confirm(): mismos flujos, con el estilo de la app,
   traducibles y sin bloquear el hilo de UI. askConfirm() devuelve boolean;
   askText() devuelve el texto o null si se cancela. */
let askResolver = null;
let askMode = 'confirm';

function askUser(opts) {
  const modal = $('#askModal');
  const o = opts || {};
  const wantsText = o.value !== undefined;
  if (!modal) return Promise.resolve(wantsText ? null : false);
  /* Si otro diálogo quedó abierto, lo cancelamos antes de mostrar éste. */
  if (askResolver) {
    const prev = askResolver;
    askResolver = null;
    prev(wantsText ? null : false);
  }
  const t = UI[lang];
  askMode = wantsText ? 'input' : 'confirm';
  $('#askTitle').textContent = o.title || t.confirmTitle;
  $('#askMessage').textContent = o.message || '';
  const inp = $('#askInput');
  inp.hidden = !wantsText;
  inp.value = wantsText ? (o.value || '') : '';
  inp.placeholder = o.placeholder || '';
  inp.maxLength = o.maxLength || 60;
  modal.hidden = false;
  updateModalLock();
  setTimeout(() => {
    try {
      if (askMode === 'input') { inp.focus(); inp.select(); }
      else $('#askOk').focus();
    } catch (e) { }
  }, 60);
  return new Promise(resolve => { askResolver = resolve; });
}

function closeAsk(value) {
  const modal = $('#askModal');
  if (modal) modal.hidden = true;
  updateModalLock();
  const resolve = askResolver;
  askResolver = null;
  if (resolve) resolve(value);
}

function askConfirm(message, title) {
  return askUser({ message: message, title: title || UI[lang].confirmTitle })
    .then(v => v === true);
}

function askText(title, value, message) {
  return askUser({ title: title, value: value === undefined ? '' : value, message: message || '' })
    .then(v => (typeof v === 'string' ? v : null));
}

function bindAskModal() {
  const modal = $('#askModal');
  if (!modal) return;
  const inp = $('#askInput');
  $('#askOk').addEventListener('click', () => closeAsk(askMode === 'input' ? inp.value : true));
  $('#askCancel').addEventListener('click', () => closeAsk(null));
  modal.addEventListener('click', e => { if (e.target === modal) closeAsk(null); });
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); closeAsk(inp.value); }
  });
  document.addEventListener('keydown', e => {
    if (!modal.hidden && e.key === 'Escape') { e.preventDefault(); closeAsk(null); }
  });
}

/* ---------------- selector de reporteros ----------------
   El reportero vive en node.reps[slot] del bloque anfitrión. Se elige desde
   ƒ porque no es un enunciado: nunca se agrega suelto a la pila. */
let repTarget = null;

function setReporter(hostId, slot, type) {
  const info = findNode(hostId);
  const def = BYID[type];
  if (!info || !def || !def.rep) return;
  const hostDef = BYID[info.node.type];
  if (!hostDef || !(hostDef.repOk || hostDef.rep) || hostDef.repName) return;
  const count = ((hostDef.n[lang] || hostDef.n.es || '').match(/\{(?:v|x|y)\}/g) || []).length;
  if (!(slot >= 0 && slot < count)) return;
  if (!Array.isArray(info.node.reps)) info.node.reps = [];
  info.node.reps[slot] = makeNode(type);
  renderCode();
  saveProject();
}

function removeReporter(hostId, slot) {
  const info = findNode(hostId);
  if (!info || !Array.isArray(info.node.reps)) return;
  info.node.reps[slot] = null;
  /* Si no queda ninguno, se borra el campo: el JSON guardado vuelve a ser
     idéntico al de un proyecto sin reporteros. */
  if (!info.node.reps.some(Boolean)) delete info.node.reps;
  renderCode();
  saveProject();
}

function renderRepChoices() {
  const box = $('#repChoices');
  if (!box) return;
  const frag = document.createDocumentFragment();
  REPORTER_BLOCKS.forEach(def => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'rep-choice';
    b.dataset.repPick = def.id;
    const name = document.createElement('b');
    name.textContent = blockPlainName(def);
    const desc = document.createElement('small');
    desc.textContent = def.d[lang] || def.d.es;
    b.appendChild(name);
    b.appendChild(desc);
    frag.appendChild(b);
  });
  box.replaceChildren(frag);
}

function openRepPicker(hostId, slot) {
  repTarget = { host: hostId, slot: slot };
  renderRepChoices();
  const modal = $('#repPicker');
  if (!modal) return;
  modal.hidden = false;
  updateModalLock();
}

function closeRepPicker() {
  repTarget = null;
  const modal = $('#repPicker');
  if (!modal) return;
  modal.hidden = true;
  updateModalLock();
}

function bindRepPicker() {
  const modal = $('#repPicker');
  if (!modal) return;
  const close = $('#repPickerClose');
  if (close) close.addEventListener('click', closeRepPicker);
  modal.addEventListener('click', e => { if (e.target === modal) closeRepPicker(); });
  const box = $('#repChoices');
  if (box) box.addEventListener('click', e => {
    const b = e.target.closest('[data-rep-pick]');
    if (!b || !repTarget) return;
    const target = repTarget;
    setReporter(target.host, target.slot, b.dataset.repPick);
    closeRepPicker();
  });
  document.addEventListener('keydown', e => {
    if (!modal.hidden && e.key === 'Escape') { e.preventDefault(); closeRepPicker(); }
  });
}

/* ---------------- stage and sprites ---------------- */
function applyStageBg() {
  const stage = $('#stage');
  if (!stage) return;
  const clearBtn = $('#bgClearBtn');
  if (clearBtn) clearBtn.hidden = !stageBgImg;
  if (stageBgImg) {
    /* El dataURL ya pasó por IMG_DATA_RE: sólo caracteres seguros para CSS. */
    stage.style.background = 'url("' + stageBgImg + '") center / cover no-repeat';
    return;
  }
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
    '<div class="sprite-emoji" style="transform:' + spriteTransform(s) + '">' + costumeFaceHTML(s) + '</div>' +
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
  if (s.id === selectedSpriteId) updatePropLive(s);
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
      '<span class="tile-emoji">' + costumeFaceHTML(s) + '</span>' +
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
  if (avatar) avatar.innerHTML = costumeFaceHTML(s);
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
  renderCostumeStrip();
}

/* ---------------- tira de disfraces ---------------- */
function renderCostumeStrip() {
  const box = $('#costumeStrip');
  if (!box) return;
  const s = selectedSprite();
  if (!s) return;
  const t = UI[lang];
  const list = Array.isArray(s.costumes) ? s.costumes : [];
  box.innerHTML = list.map((c, i) => {
    const active = i === s.costumeIndex;
    return '<button type="button" class="costume-thumb' + (active ? ' active' : '') + '"' +
      ' data-costume="' + i + '" title="' + esc(c.name) + '"' +
      ' aria-label="' + esc(c.name) + '" aria-pressed="' + active + '">' +
      costumeHTML(c) +
      '<span class="costume-name">' + esc(c.name) + '</span>' +
      '<span class="costume-del" data-del-costume="' + i + '" role="button" tabindex="-1" aria-label="' + esc(t.costumeDelete) + '">' + icon('close') + '</span>' +
      '</button>';
  }).join('') + (list.length < MAX_COSTUMES
    ? '<button type="button" class="costume-add" data-add-costume aria-label="' + esc(t.costumeAdd) +
      '" title="' + esc(t.costumeAdd) + '">+</button>'
    : '');
  const count = $('#costumeCount');
  if (count) count.textContent = list.length + '/' + MAX_COSTUMES;
  const add = $('#addCostumeBtn');
  if (add) add.disabled = list.length >= MAX_COSTUMES;
}

async function deleteCostume(index) {
  const s = selectedSprite();
  const t = UI[lang];
  if (!s || !s.costumes || s.costumes.length <= 1) { toast(t.cantDeleteCostume); return; }
  if (!(await askConfirm(t.confirmDeleteCostume, t.costumeDelete))) return;
  const keep = currentCostume(s);
  const keepId = keep ? keep.id : null;
  s.costumes.splice(index, 1);
  let next = s.costumes.findIndex(c => c.id === keepId);
  if (next < 0) next = clamp(index, 0, s.costumes.length - 1);
  s.costumeIndex = next;
  syncCostume(s);
  renderSprites();
  renderTray();
  renderProps();
  renderCode();
  saveProject();
}

function isAllowedImage(file) {
  const name = String(file.name || '').toLowerCase();
  if (/\.svgz?$/.test(name)) return false;
  const type = String(file.type || '').toLowerCase();
  if (type && COSTUME_TYPES.indexOf(type) < 0) return false;
  if (!type && !/\.(png|jpe?g|webp|gif|bmp)$/.test(name)) return false;
  return true;
}

/* createImageBitmap es más rápido, pero en algunos navegadores puede
   quedarse colgado con un archivo concreto. Si tarda demasiado o falla,
   caemos a <img> para que la importación nunca congele la interfaz. */
function loadBitmap(file) {
  if (typeof createImageBitmap !== 'function') return loadBitmapViaImg(file);
  return new Promise((resolve, reject) => {
    let settled = false;
    const fallback = () => {
      if (settled) return;
      settled = true;
      loadBitmapViaImg(file).then(resolve, reject);
    };
    const timer = setTimeout(fallback, 3000);
    createImageBitmap(file).then(bmp => {
      if (settled) { if (typeof bmp.close === 'function') bmp.close(); return; }
      settled = true;
      clearTimeout(timer);
      resolve(bmp);
    }).catch(() => { clearTimeout(timer); fallback(); });
  });
}

function loadBitmapViaImg(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('imagen ilegible')); };
    img.src = url;
  });
}

/* Re-encode a WebP y achica la imagen. Nunca se guarda el archivo original:
   así controlamos el peso y descartamos cualquier SVG. */
async function encodeImage(file, maxPx, maxChars, qBase, qStep) {
  const bitmap = await loadBitmap(file);
  try {
    const max = Math.max(bitmap.width, bitmap.height) || 1;
    const scale = Math.min(1, maxPx / max);
    let w = Math.max(1, Math.round(bitmap.width * scale));
    let h = Math.max(1, Math.round(bitmap.height * scale));
    for (let attempt = 0; attempt < 3; attempt++) {
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(bitmap, 0, 0, w, h);
      let out = canvas.toDataURL('image/webp', qBase - attempt * qStep);
      if (!/^data:image\/webp;base64,/.test(out)) out = canvas.toDataURL('image/png');
      if (out.length <= maxChars && IMG_DATA_RE.test(out)) return out;
      w = Math.max(1, Math.round(w * 0.7));
      h = Math.max(1, Math.round(h * 0.7));
    }
    return null;
  } finally {
    if (typeof bitmap.close === 'function') bitmap.close();
  }
}

function imageToCostume(file) {
  return encodeImage(file, COSTUME_MAX_PX, MAX_IMG_CHARS, 0.82, 0.12);
}

function imageToBackdrop(file) {
  return encodeImage(file, BG_MAX_PX, MAX_BG_CHARS, 0.88, 0.10);
}

function pickBackdropFile() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = COSTUME_TYPES.join(',');
  input.onchange = () => {
    const f = (input.files || [])[0];
    if (f) importBackdropFile(f);
  };
  input.click();
}

async function importBackdropFile(file) {
  const t = UI[lang];
  if (!isAllowedImage(file)) { toast(t.bgBadType); return; }
  let src = null;
  try { src = await imageToBackdrop(file); } catch (e) { }
  if (!src) { toast(t.bgTooBig); return; }
  stageBgImg = validBackdrop(src);
  applyStageBg();
  saveProject();
  toast(t.bgAdded);
}

function clearBackdrop() {
  if (!stageBgImg) return;
  stageBgImg = '';
  applyStageBg();
  saveProject();
  toast(UI[lang].bgRemoved);
}

function pickCostumeFiles(asNewSprite) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = COSTUME_TYPES.join(',');
  input.multiple = true;
  input.onchange = () => importCostumeFiles(Array.from(input.files || []), !!asNewSprite);
  input.click();
}

async function importCostumeFiles(files, asNewSprite) {
  const t = UI[lang];
  if (!files || !files.length) return;
  closeSpriteModal();
  const base = selectedSprite();
  const room = asNewSprite ? MAX_COSTUMES : Math.max(0, MAX_COSTUMES - (base && base.costumes ? base.costumes.length : 0));
  if (room <= 0) { toast(t.costumeLimit); return; }
  if (files.length > room) toast(t.costumeLimit);
  const picked = files.slice(0, room);
  const added = [];
  for (const file of picked) {
    if (!isAllowedImage(file)) { toast(t.costumeBadType); continue; }
    try {
      const src = await imageToCostume(file);
      if (!src) { toast(t.costumeTooBig); continue; }
      let label = String(file.name || '').replace(/\.[^.]+$/, '')
        .replace(/[^\p{L}\p{N} _-]/gu, '').trim().slice(0, 24);
      if (!label) label = t.costumeDefault + ' ' + (added.length + 1);
      /* Sin nombres repetidos: el bloque «cambiar disfraz a» apunta por nombre. */
      const used = (asNewSprite ? [] : (base && base.costumes ? base.costumes : []))
        .concat(added).map(c => c.name);
      const baseLabel = label;
      let suffix = 2;
      while (used.indexOf(label) >= 0) {
        const tail = ' ' + (suffix++);
        label = baseLabel.slice(0, Math.max(1, 24 - tail.length)) + tail;
      }
      added.push(makeCostume('img', src, label));
    } catch (err) { toast(t.costumeEmpty); }
  }
  if (!added.length) return;

  if (asNewSprite) {
    const s = createSpriteData('🐱', t.spriteDefault + ' ' + (sprites.length + 1), []);
    s.costumes = added;
    s.costumeIndex = 0;
    syncCostume(s);
    sprites.push(s);
    selectedSpriteId = s.id;
  } else {
    if (!base) return;
    const firstNew = base.costumes.length;
    base.costumes = base.costumes.concat(added);
    base.costumeIndex = firstNew;
    syncCostume(base);
  }
  render();
  saveProject();
  toast(t.costumeAdded);
}

function updatePropPosition() {
  const s = selectedSprite();
  if (!s) return;
  const px = $('#propX'); if (px) px.value = fmt(s.x);
  const py = $('#propY'); if (py) py.value = fmt(s.y);
}

/* Refleja en vivo lo que el programa le hace al personaje,
   sin pisar el campo que el usuario esté editando. */
function updatePropLive(s) {
  if (!s) return;
  const put = (sel, v) => {
    const el = $(sel);
    if (el && document.activeElement !== el) el.value = fmt(v);
  };
  put('#propX', s.x);
  put('#propY', s.y);
  put('#propDir', s.dir);
  put('#propSize', s.size);
}

/* ---------------- code rendering ---------------- */
function countReporters(reps) {
  if (!Array.isArray(reps)) return 0;
  let n = 0;
  reps.forEach(r => {
    if (!r) return;
    n++;
    n += countReporters(r.reps);
  });
  return n;
}

function countNodes(nodes) {
  if (!Array.isArray(nodes)) return 0;
  let n = 0;
  nodes.forEach(node => {
    n++;
    if (node.reps) n += countReporters(node.reps);
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

/* Un bloque puede tener uno o varios huecos ({v}, {x}, {y}). El valor del
   nodo sigue siendo un único escalar: con varios huecos se guarda como
   "x,y". Así los proyectos viejos, el historial y los links no cambian. */
function blockValues(node, def, count) {
  const raw = String(node.val !== undefined ? node.val : (def.def !== undefined ? def.def : ''));
  if (count < 2) return [raw];
  const defs = String(def.def !== undefined ? def.def : '').split(',');
  const parts = raw.split(',');
  const out = [];
  for (let i = 0; i < count; i++) {
    out.push(parts[i] !== undefined ? parts[i] : (defs[i] !== undefined ? defs[i] : '0'));
  }
  return out;
}

function blockContent(node, def, t) {
  const opts = t || {};
  const tr = UI[lang];
  const content = document.createElement('span');
  content.className = 'sb-content';
  const label = def.n[lang] || def.n.es;
  const slots = label.match(/\{(?:v|x|y)\}/g) || [];
  if (!slots.length) {
    content.appendChild(document.createTextNode(label));
    return content;
  }
  const parts = label.split(/\{(?:v|x|y)\}/);
  const vals = blockValues(node, def, slots.length);
  const plain = label.replace(/\{(?:v|x|y)\}/g, '').replace(/\s+/g, ' ').trim();
  /* Los reporteros también admiten reporteros dentro: así se anidan. El
     tope de 10 sólo protege el dibujado, no la ejecución. */
  /* repName marca casillas que guardan un nombre (p. ej. «variable {v}»):
     ahí no tiene sentido anidar un valor. */
  const canRep = !!(def.repOk || def.rep) && !def.repName && !opts.preview && (opts.depth || 0) < 10;
  slots.forEach((slot, i) => {
    if (parts[i]) content.appendChild(document.createTextNode(parts[i]));
    const cur = vals[i];
    const slotName = slot === '{x}' ? 'x' : (slot === '{y}' ? 'y' : (parts[i].replace(/\s+$/, '') || def.id));
    const aria = slots.length > 1 ? (plain + ' · ' + slotName) : slotName;
    let field;
    if (opts.preview) {
      const val = document.createElement('span');
      val.className = 'sb-value' + (def.bool ? ' bool' : '');
      let shown = cur;
      if (def.costume) {
        const s = selectedSprite();
        const list = s && s.costumes ? s.costumes : [];
        const c = list[findCostumeIndex(s, cur)];
        shown = c ? c.name : (UI[lang].costumeDefault + ' 1');
      }
      if (def.pick) shown = pickLabel(def.pick, cur);
      val.textContent = shown;
      field = val;
    } else if (def.pick) {
      const sel = document.createElement('select');
      sel.className = 'sb-input sb-select';
      sel.dataset.input = node.id;
      sel.style.maxWidth = (def.w || 104) + 'px';
      sel.setAttribute('aria-label', aria);
      let found = false;
      pickList(def.pick).forEach(item => {
        const opt = document.createElement('option');
        opt.value = item.id;
        opt.textContent = item.name[lang] || item.name.es;
        if (item.id === cur) { opt.selected = true; found = true; }
        sel.appendChild(opt);
      });
      /* Un id que ya no existe (proyecto viejo o editado a mano) no rompe el
         bloque: se muestra como opción suelta y el guion no hace nada. */
      if (!found) {
        const opt = document.createElement('option');
        opt.value = cur;
        opt.textContent = UI[lang].soundMissing;
        opt.selected = true;
        sel.appendChild(opt);
      }
      field = sel;
    } else if (def.costume) {
      const sel = document.createElement('select');
      sel.className = 'sb-input sb-select';
      sel.dataset.input = node.id;
      sel.style.maxWidth = (def.w || 110) + 'px';
      sel.setAttribute('aria-label', aria);
      const s = selectedSprite();
      const list = s && Array.isArray(s.costumes) ? s.costumes : [];
      let found = false;
      list.forEach((c, j) => {
        const opt = document.createElement('option');
        opt.value = c.name;
        opt.textContent = c.name;
        /* Un valor numérico viejo se resuelve por su posición original. */
        if (c.name === cur || String(j + 1) === cur) { opt.selected = true; found = true; }
        sel.appendChild(opt);
      });
      if (!found) {
        const opt = document.createElement('option');
        opt.value = cur;
        opt.textContent = UI[lang].costumeMissing;
        opt.selected = true;
        sel.appendChild(opt);
      }
      field = sel;
    } else {
      const input = document.createElement('input');
      input.className = 'sb-input' + (def.bool ? ' bool' : '');
      input.type = 'text';
      input.value = cur;
      input.style.width = (def.w || 58) + 'px';
      input.dataset.input = node.id;
      /* data-xy permite recomponer el par "x,y" al editar cualquiera de los dos. */
      if (slots.length > 1) input.dataset.xy = String(i);
      input.setAttribute('inputmode', def.num ? 'decimal' : 'text');
      input.setAttribute('aria-label', aria);
      input.autocomplete = 'off';
      input.spellcheck = false;
      field = input;
    }
    if (!canRep) { content.appendChild(field); return; }
    /* Casilla con reportero: ƒ abre el selector y, si ya hay uno, el chip
       reemplaza al input. El texto escrito se conserva en node.val por si
       después se quita el reportero. */
    const wrap = document.createElement('span');
    wrap.className = 'sb-slot';
    const fx = document.createElement('button');
    fx.type = 'button';
    fx.className = 'rep-fx';
    fx.dataset.repHost = node.id;
    fx.dataset.repSlot = String(i);
    fx.textContent = 'ƒ';
    fx.title = tr.repInsert;
    fx.setAttribute('aria-label', tr.repInsert);
    wrap.appendChild(fx);
    const rep = node.reps && node.reps[i];
    if (rep && BYID[rep.type] && BYID[rep.type].rep) {
      wrap.appendChild(reporterChip(rep, node.id, i, (opts.depth || 0) + 1));
    } else {
      wrap.appendChild(field);
    }
    content.appendChild(wrap);
  });
  if (parts[parts.length - 1]) content.appendChild(document.createTextNode(parts[parts.length - 1]));
  return content;
}

/* Chip de un reportero dentro de una casilla: su etiqueta con casillas
   anidadas y la × para volver al texto libre. */
function reporterChip(rep, hostId, slot, depth) {
  const tr = UI[lang];
  const def = BYID[rep.type];
  const chip = document.createElement('span');
  chip.className = 'rep-chip';
  chip.dataset.rep = rep.id;
  const inner = blockContent(rep, def, { depth: depth });
  if (!(def.n[lang] || def.n.es).match(/\{(?:v|x|y)\}/g)) inner.classList.add('rep-name');
  chip.appendChild(inner);
  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'rep-del';
  del.dataset.repDel = rep.id;
  del.dataset.repHost = hostId;
  del.dataset.repSlot = String(slot);
  del.textContent = '×';
  del.title = tr.repRemove;
  del.setAttribute('aria-label', tr.repRemove);
  chip.appendChild(del);
  return chip;
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

  if (preview) {
    /* En la paleta la empuñadura es el punto de agarre táctil: el resto
       del bloque sigue permitiendo desplazar la página con el dedo. */
    const pgrip = document.createElement('button');
    pgrip.type = 'button';
    pgrip.className = 'sb-grip p-grip';
    pgrip.tabIndex = -1;
    pgrip.title = t.dragBlock;
    pgrip.setAttribute('aria-label', t.dragBlock);
    pgrip.innerHTML = icon('grip');
    head.appendChild(pgrip);
  } else {
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
    const dup = document.createElement('button');
    dup.type = 'button';
    dup.className = 'sb-dup';
    dup.dataset.dup = node.id;
    dup.setAttribute('aria-label', t.duplicateBlock);
    dup.title = t.duplicateBlock;
    dup.innerHTML = icon('copy');
    head.appendChild(dup);
  }

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

/* ---------------- zoom del área de código ---------------- */
function applyCodeZoom() {
  const list = $('#codeList');
  if (list) list.style.zoom = String(codeZoom);
  const val = $('#zoomVal');
  if (val) val.textContent = Math.round(codeZoom * 100) + '%';
  const out = $('#zoomOutBtn');
  const inn = $('#zoomInBtn');
  if (out) out.disabled = codeZoom <= ZOOM_MIN + 0.001;
  if (inn) inn.disabled = codeZoom >= ZOOM_MAX - 0.001;
}

function changeZoom(delta) {
  const z = clamp(Math.round((codeZoom + delta) * 100) / 100, ZOOM_MIN, ZOOM_MAX);
  if (z === codeZoom) return;
  codeZoom = z;
  applyCodeZoom();
  saveUI();
}

function resetZoom() {
  if (codeZoom === 1) return;
  codeZoom = 1;
  applyCodeZoom();
  saveUI();
}

/* ---------------- zoom del escenario y los personajes ----------------
   Una variable CSS escala la altura de la escena, el emoji/imagen de cada
   sprite, el globo y el aro de selección. Las posiciones siguen siendo
   porcentuales, así que arrastrar y los bloques de movimiento no cambian. */
function applyStageZoom() {
  const stage = $('#stage');
  if (stage) stage.style.setProperty('--stage-zoom', String(stageZoom));
  const val = $('#stageZoomVal');
  if (val) val.textContent = Math.round(stageZoom * 100) + '%';
  const out = $('#stageZoomOutBtn');
  const inn = $('#stageZoomInBtn');
  if (out) out.disabled = stageZoom <= ZOOM_MIN + 0.001;
  if (inn) inn.disabled = stageZoom >= ZOOM_MAX - 0.001;
}

function changeStageZoom(delta) {
  const z = clamp(Math.round((stageZoom + delta) * 100) / 100, ZOOM_MIN, ZOOM_MAX);
  if (z === stageZoom) return;
  stageZoom = z;
  applyStageZoom();
  saveUI();
}

function resetStageZoom() {
  if (stageZoom === 1) return;
  stageZoom = 1;
  applyStageZoom();
  saveUI();
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

/* Nombre accesible de la paleta: rellena todos los huecos con los valores
   por defecto (un bloque de dos campos usa def "x,y"). */
/* Listas de nombres que se eligen con un <select>: sonidos y melodías.
   El bloque guarda el id (estable) y se muestra el nombre del idioma. */
function pickList(kind) {
  return kind === 'melodies' ? MELODY_LIB : SOUND_LIB;
}

function pickLabel(kind, id) {
  const item = pickList(kind).find(x => x.id === id);
  if (item) return item.name[lang] || item.name.es;
  return UI[lang].soundMissing || String(id);
}

function blockPlainName(def) {
  const label = def.n[lang] || def.n.es;
  const defs = String(def.def !== undefined ? def.def : '').split(',');
  let i = 0;
  return label.replace(/\{(?:v|x|y)\}/g, () => {
    const value = defs.length > 1 ? defs[i] : defs[0];
    i++;
    if (value === undefined) return '';
    /* En un bloque de sonido el valor guardado es un id: se lee el nombre. */
    return def.pick ? pickLabel(def.pick, value) : value;
  });
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
    const name = blockPlainName(def);
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
  const q = fold(spriteSearchTerm.trim());
  let shown = 0;
  const html = SPRITE_GROUPS.map(g => {
    const label = g.name[lang] || g.name.es;
    const groupHit = q && (fold(label).indexOf(q) > -1 || fold(g.name.es).indexOf(q) > -1);
    const items = g.items.filter(raw => {
      if (!q || groupHit) return true;
      const parts = raw.split('|');
      return fold(parts[1] || '').indexOf(q) > -1 || fold(parts[0]).indexOf(q) > -1;
    });
    if (!items.length) return '';
    shown += items.length;
    return '<div class="sprite-group">' +
      '<div class="sprite-group-title">' + esc(label) + '</div>' +
      '<div class="sprite-choices">' + items.map(raw => {
        const e = raw.split('|')[0];
        return '<button type="button" class="sprite-choice" data-emoji="' + esc(e) +
          '" aria-label="' + esc(t.addSprite + ' ' + e) + '">' + esc(e) + '</button>';
      }).join('') + '</div></div>';
  }).join('');
  box.innerHTML = shown ? html : '<div class="sprite-empty">' + esc(t.spriteNoResults) + '</div>';
}

/* ---------------- render all ---------------- */
function render() {
  const t = UI[lang];
  document.documentElement.lang = lang;

  $$('[data-t]').forEach(el => {
    const key = el.dataset.t;
    if (t[key] != null) el.textContent = t[key];
  });
  $$('[data-tt]').forEach(el => {
    const key = el.dataset.tt;
    if (t[key] != null) {
      el.title = t[key];
      el.setAttribute('aria-label', t[key]);
    }
  });
  $$('.lang-switch button').forEach(b => {
    const on = b.dataset.lang === lang;
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', String(on));
  });

  $('#searchBlocks').placeholder = t.search;
  const spSearch = $('#spriteSearch');
  if (spSearch) {
    spSearch.placeholder = t.spriteSearch;
    spSearch.setAttribute('aria-label', t.spriteSearch);
  }
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
  renderRepChoices();
  renderSpriteChoices();
  applyStageBg();
  codeTitle();

  const hint = $('#stageHint');
  if (hint) hint.textContent = hasTopNode('when_tap') ? t.stageHint : t.stageHintRun;

  updateHUD();
  updateStatus();
  applyCollapsed();
  applyCodeZoom();
  applyStageZoom();
  updateResetButton();
  updateHistoryButtons();
  updateProjectName();
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
    if (!node) continue;
    if (node.id === id) return { node: node, arr: list, index: i, parent: parent || null, parentSlot: parentSlot || null };
    /* Los reporteros también tienen casillas con inputs: hay que poder
       encontrarlos para que applyBlockValue() escriba en el nodo correcto. */
    if (node.reps) {
      const r = findNode(id, node.reps, node, 'reps');
      if (r) return r;
    }
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
  if (ancestor.reps && ancestor.reps.some(n => nodeContains(n, id))) return true;
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

/* Clona el nodo y todo su subárbol con ids nuevos: dos bloques nunca
   pueden compartir id, porque el drag y el resaltado buscan por id. */
function cloneNodeTree(node) {
  const copy = {};
  Object.keys(node).forEach(k => {
    if (k !== 'id' && k !== 'body' && k !== 'elseBody' && k !== 'reps') copy[k] = node[k];
  });
  copy.id = uid('b');
  if (Array.isArray(node.reps)) {
    copy.reps = node.reps.map(r => (r ? cloneNodeTree(r) : null));
  }
  if (Array.isArray(node.body)) copy.body = node.body.map(cloneNodeTree);
  if (Array.isArray(node.elseBody)) copy.elseBody = node.elseBody.map(cloneNodeTree);
  return copy;
}

function duplicateNode(id) {
  const info = findNode(id);
  if (!info) return;
  info.arr.splice(info.index + 1, 0, cloneNodeTree(info.node));
  renderCode();
  saveProject();
  toast(UI[lang].duplicated);
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
  /* getBoundingClientRect devuelve píxeles visuales (ya escalados por zoom),
     pero `top` se expresa en las unidades locales del contenedor. */
  line.style.top = (top / (codeZoom || 1)) + 'px';
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

/* ---------------- arrastrar desde la paleta ---------------- */
function paletteDropContainer(e, def) {
  const el = document.elementFromPoint(e.clientX, e.clientY);
  if (!el) return null;
  const slot = el.closest('.c-slot');
  /* Sólo sirven los slots del área de código: los de la paleta son vistas previas. */
  if (slot && slot.closest('#codeList')) {
    return (def && def.hat) ? null : slot;
  }
  if (el.closest('#codeList') || el.closest('.scratch-workspace')) return $('#codeList');
  return null;
}

function startPaletteDrag(e, item) {
  if (paletteDrag || blockDrag || isRunning) return;
  if (e.button !== undefined && e.button !== 0) return;
  const defId = item.dataset.add;
  const sb = item.querySelector('.stack-item');
  if (!defId || !sb) return;
  const rect = sb.getBoundingClientRect();
  paletteDrag = {
    defId: defId,
    item: item,
    pointerId: e.pointerId,
    startX: e.clientX,
    startY: e.clientY,
    offsetX: e.clientX - rect.left,
    offsetY: e.clientY - rect.top,
    moved: false,
    ghost: null,
    target: null
  };
  try { item.setPointerCapture(e.pointerId); } catch (err) { }
}

function movePaletteDrag(e) {
  if (!paletteDrag || e.pointerId !== paletteDrag.pointerId) return;
  const d = paletteDrag;
  if (!d.moved && Math.abs(e.clientX - d.startX) < 5 && Math.abs(e.clientY - d.startY) < 5) return;
  if (!d.moved) {
    d.moved = true;
    const sb = d.item.querySelector('.stack-item');
    if (sb) {
      const r = sb.getBoundingClientRect();
      const ghost = sb.cloneNode(true);
      ghost.classList.add('drag-ghost');
      ghost.style.width = r.width + 'px';
      document.body.appendChild(ghost);
      d.ghost = ghost;
    }
    d.item.classList.add('is-dragging');
    document.body.classList.add('is-dragging');
  }
  e.preventDefault();
  if (d.ghost) {
    d.ghost.style.left = (e.clientX - d.offsetX) + 'px';
    d.ghost.style.top = (e.clientY - d.offsetY) + 'px';
  }
  const margin = 90;
  if (e.clientY < margin) window.scrollBy(0, -10);
  else if (e.clientY > window.innerHeight - margin) window.scrollBy(0, 10);

  const container = paletteDropContainer(e, BYID[d.defId]);
  d.target = container ? calcDropTarget(container, null, e.clientY) : null;
  drawDropLine(d.target);
}

function endPaletteDrag(e, cancelled) {
  if (!paletteDrag) return;
  if (e && e.pointerId !== undefined && e.pointerId !== paletteDrag.pointerId) return;
  const d = paletteDrag;
  paletteDrag = null;
  clearDrop();
  document.body.classList.remove('is-dragging');
  d.item.classList.remove('is-dragging');
  if (d.ghost && d.ghost.parentNode) d.ghost.parentNode.removeChild(d.ghost);
  try { d.item.releasePointerCapture(d.pointerId); } catch (err) { }
  if (!d.moved) return;
  /* pointerup genera un click en el item: lo ignoramos para no agregar de más. */
  lastPaletteDragAt = Date.now();
  if (!cancelled && d.target) insertNewBlock(d.defId, d.target);
}

function insertNewBlock(type, target) {
  const def = BYID[type];
  const s = selectedSprite();
  if (!def || def.legacy || !s) return;
  const node = makeNode(type);
  if (!node) return;
  let arr;
  if (target.container.id === 'codeList') {
    arr = s.code;
  } else {
    const ownerInfo = findNode(target.container.dataset.owner);
    if (!ownerInfo || def.hat) return;
    const slot = target.container.dataset.slot;
    if (slot === 'elseBody') {
      if (!ownerInfo.node.elseBody) ownerInfo.node.elseBody = [];
      arr = ownerInfo.node.elseBody;
    } else {
      if (!ownerInfo.node.body) ownerInfo.node.body = [];
      arr = ownerInfo.node.body;
    }
  }
  arr.splice(clamp(target.index, 0, arr.length), 0, node);
  renderCode();
  saveProject();
  toast(UI[lang].blockDropped);
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

/* ---------------- expressions ----------------
   Parser aritmético recursivo, sin eval ni Function(): compatible con un CSP
   estricto. Resuelve lo mismo que el evaluador viejo: + - * / % (), decimales,
   menos unario y ** (potencia, que Function() aceptaba por accidente).
   Las variables y aleatorio(a,b) ya vienen sustituidas por números. */
function calcExpr(src) {
  let i = 0;
  const ws = () => { while (i < src.length && /\s/.test(src[i])) i++; };
  const finite = v => { if (!isFinite(v)) throw new Error('no finito'); return v; };

  function primary() {
    ws();
    if (src[i] === '+') { i++; return primary(); }
    if (src[i] === '-') { i++; return finite(-primary()); }
    if (src[i] === '(') {
      i++;
      const v = sum();
      ws();
      if (src[i] !== ')') throw new Error('falta )');
      i++;
      return v;
    }
    const from = i;
    while (i < src.length && /[0-9.]/.test(src[i])) i++;
    if (from === i) throw new Error('falta número');
    return finite(Number(src.slice(from, i)));
  }
  function power() {
    const v = primary();
    ws();
    if (src[i] === '*' && src[i + 1] === '*') { i += 2; return finite(Math.pow(v, power())); }
    return v;
  }
  function product() {
    let v = power();
    for (;;) {
      ws();
      const op = src[i];
      if (op !== '*' && op !== '/' && op !== '%') return v;
      i++;
      const r = power();
      v = finite(op === '*' ? v * r : op === '/' ? v / r : v % r);
    }
  }
  function sum() {
    let v = product();
    for (;;) {
      ws();
      const op = src[i];
      if (op !== '+' && op !== '-') return v;
      i++;
      const r = product();
      v = finite(op === '+' ? v + r : v - r);
    }
  }
  const value = sum();
  ws();
  if (i !== src.length) throw new Error('sobra texto');
  return value;
}

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
    const r = calcExpr(s);
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

/* ---------------- reporteros: valor de un nodo ----------------
   node.val sigue siendo el texto de las casillas ("x,y" en bloques de dos
   huecos). node.reps[i] guarda el reportero que reemplaza a esa casilla; si
   no hay reportero se usa el texto. Así el formato guardado no cambia y los
   proyectos viejos se abren igual. */
function nodeVal(node, sprite, depth) {
  const d = depth || 0;
  const def = BYID[node.type];
  if (!def) return '';
  const raw = String(node.val !== undefined ? node.val : (def.def !== undefined ? def.def : ''));
  if (!node.reps || !node.reps.length) return raw;
  const label = def.n[lang] || def.n.es || '';
  const slots = label.match(/\{(?:v|x|y)\}/g) || [];
  if (!slots.length) return raw;
  const parts = raw.split(',');
  const defs = String(def.def !== undefined ? def.def : '').split(',');
  const out = [];
  for (let i = 0; i < slots.length; i++) {
    const rep = node.reps[i];
    if (rep && BYID[rep.type] && BYID[rep.type].rep) {
      out.push(String(evalReporter(rep, sprite, d + 1)));
    } else {
      out.push(parts[i] !== undefined ? parts[i] : (defs[i] !== undefined ? defs[i] : '0'));
    }
  }
  return out.join(',');
}

/* Evalúa un reportero. Los anidados ya vienen resueltos por nodeVal(); el
   tope de profundidad corta ciclos o datos manipulados. */
function evalReporter(node, sprite, depth) {
  const d = depth || 0;
  if (!node || d > 12) return 0;
  const def = BYID[node.type];
  if (!def || !def.rep) return 0;
  const v = nodeVal(node, sprite, d);
  const parts = v.split(',');
  const a = num(parts[0], 0);
  const b = num(parts[1], 0);
  switch (node.type) {
    case 'rep_score': return score;
    case 'rep_timer': {
      const secs = Math.max(0, (Date.now() - timerStart) / 1000);
      return Math.round(secs * 10) / 10;
    }
    case 'rep_x': return sprite ? sprite.x : 0;
    case 'rep_y': return sprite ? sprite.y : 0;
    case 'rep_var': {
      const key = String(v).trim();
      if (key === 'score') return score;
      return (key in variables) ? variables[key] : 0;
    }
    case 'rep_random': {
      const lo = Math.floor(Math.min(a, b));
      const hi = Math.floor(Math.max(a, b));
      return Math.floor(Math.random() * (hi - lo + 1)) + lo;
    }
    case 'rep_add': return a + b;
    case 'rep_sub': return a - b;
    case 'rep_mul': return a * b;
    case 'rep_div': return b === 0 ? 0 : a / b;
    case 'rep_gt': return a > b ? 1 : 0;
    default: return 0;
  }
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

/* ---------------- audio / stage bg ----------------
   Sonidos y melodías se sintetizan con WebAudio: no hay archivos. El volumen
   del proyecto (0-100) se aplica en un nodo maestro, así un cambio se escucha
   al instante incluso en una melodía que ya está sonando. */
let masterGain = null;

function volumeGain() {
  return clamp(num(volume, 100), 0, 100) / 100 * 0.22;
}

function audioEngine() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!audioCtx) audioCtx = new AC();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (!masterGain) {
      masterGain = audioCtx.createGain();
      masterGain.gain.value = volumeGain();
      masterGain.connect(audioCtx.destination);
    }
    return audioCtx;
  } catch (e) { return null; }
}

function applyVolume() {
  if (!masterGain) return;
  try { masterGain.gain.value = volumeGain(); } catch (e) { }
}

function track(node) {
  liveNodes.add(node);
  try { node.onended = () => liveNodes.delete(node); } catch (e) { }
}

/* Un paso de una receta: [frecuencia, duración, forma, barrido] o
   ['noise', duración, corte del filtro]. Devuelve lo que dura, para poder
   encadenar los pasos. */
function playStep(step, at, scale) {
  const ctx = audioEngine();
  if (!ctx) return 0;
  const dur = Math.max(0.02, num(step[1], 0.12));
  const freq = step[0] === 'noise' ? -1 : num(step[0], 0);
  if (freq === 0) return dur; /* silencio: no hace falta gastar nodos */
  const gain = ctx.createGain();
  const peak = Math.max(0.0001, (scale === undefined ? 1 : scale));
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(peak, at + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  gain.connect(masterGain);
  if (freq < 0) {
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = num(step[2], 1200);
    src.connect(lp);
    lp.connect(gain);
    src.start(at);
    src.stop(at + dur);
    track(src);
    return dur;
  }
  const o = ctx.createOscillator();
  o.type = step[2] || 'sine';
  o.frequency.setValueAtTime(freq, at);
  if (step[3]) o.frequency.linearRampToValueAtTime(num(step[3], freq), at + dur);
  o.connect(gain);
  o.start(at);
  o.stop(at + dur + 0.02);
  track(o);
  return dur;
}

function beep(freq, dur, type, sweep) {
  const ctx = audioEngine();
  if (!ctx) return;
  playStep([freq, dur, type, sweep], ctx.currentTime);
}

function playSoundById(id) {
  const def = SOUNDMAP[id];
  if (!def) return false;
  const ctx = audioEngine();
  if (!ctx) return false;
  let at = ctx.currentTime;
  def.steps.forEach(step => { at += playStep(step, at); });
  return true;
}

/* Melodía en bucle: programa una pasada y se vuelve a llamar cuando termina.
   Cambiar de melodía o detener los sonidos corta el bucle. */
function playMelodyById(id) {
  const def = MELODYMAP[id];
  if (!def) return false;
  stopMusic();
  const ctx = audioEngine();
  if (!ctx) return false;
  musicId = id;
  const pass = () => {
    if (musicId !== id) return;
    const c = audioEngine();
    if (!c) return;
    let at = c.currentTime + 0.02;
    let total = 0;
    def.steps.forEach(step => { total += playStep(step, at + total, 0.75); });
    musicTimer = setTimeout(pass, Math.max(80, total * 1000));
  };
  pass();
  return true;
}

function stopMusic() {
  musicId = '';
  if (musicTimer) { clearTimeout(musicTimer); musicTimer = null; }
}

function stopAllSounds() {
  stopMusic();
  liveNodes.forEach(n => { try { n.stop(0); } catch (e) { } });
  liveNodes.clear();
}

function setVolume(v) {
  volume = clamp(Math.round(num(v, volume)), 0, 100);
  applyVolume();
  return volume;
}

function changeVolume(delta) {
  return setVolume(volume + num(delta, 0));
}

function changeBg() {
  /* Si hay un fondo propio, el primer cambio vuelve a los gradientes. */
  if (stageBgImg) {
    stageBgImg = '';
    stageBg = 1 % BG.length;
  } else {
    stageBg = (stageBg + 1) % BG.length;
  }
  applyStageBg();
  if (!runActive) scheduleSave();
}

/* ---------------- engine ---------------- */
/* ---------------- colisiones ----------------
   El escenario mide 480x360 unidades y cada personaje se aproxima con un
   círculo de radio fijo escalado por su tamaño. No es pixel-perfect como
   Scratch, pero alcanza para rebotar y detectar choques sin medir el DOM en
   cada paso de la ejecución (que sería caro y frágil). */
const SPRITE_RADIUS = 26;
const STAGE_W = 240;
const STAGE_H = 180;

function spriteRadius(s) {
  const size = Math.max(10, Math.min(300, Number(s.size) || 100));
  return SPRITE_RADIUS * (size / 100);
}

function touchingEdge(s) {
  if (!s) return false;
  const r = spriteRadius(s);
  return s.x <= -STAGE_W + r || s.x >= STAGE_W - r ||
    s.y <= -STAGE_H + r || s.y >= STAGE_H - r;
}

function touchingOther(s) {
  if (!s || !s.visible) return false;
  const r = spriteRadius(s);
  for (let i = 0; i < sprites.length; i++) {
    const o = sprites[i];
    if (o === s || !o.visible) continue;
    const dx = o.x - s.x;
    const dy = o.y - s.y;
    const rr = r + spriteRadius(o);
    if (dx * dx + dy * dy <= rr * rr) return true;
  }
  return false;
}

/* Devuelve true si había que rebotar. `move` calcula x con el seno y la y con
   el coseno: rebotar en una pared vertical invierte el seno (dir → -dir) y en
   una horizontal invierte el coseno (dir → 180 - dir). */
function bounceSprite(s) {
  if (!s) return false;
  const r = spriteRadius(s);
  let hitX = false;
  let hitY = false;
  if (s.x <= -STAGE_W + r) { s.x = -STAGE_W + r; hitX = true; }
  else if (s.x >= STAGE_W - r) { s.x = STAGE_W - r; hitX = true; }
  if (s.y <= -STAGE_H + r) { s.y = -STAGE_H + r; hitY = true; }
  else if (s.y >= STAGE_H - r) { s.y = STAGE_H - r; hitY = true; }
  if (!hitX && !hitY) return false;
  if (hitX && hitY) s.dir = normDir(s.dir + 180);
  else if (hitX) s.dir = normDir(-s.dir);
  else s.dir = normDir(180 - s.dir);
  return true;
}

function checkNodeCondition(node, sprite) {
  if (node.type === 'if_tilt') return Math.abs(window.lastTilt || 0) > 15;
  if (node.type === 'if_score') return score > num(nodeVal(node, sprite), 5);
  if (node.type === 'if_edge') return touchingEdge(sprite);
  if (node.type === 'if_touch') return touchingOther(sprite);
  return evalCond(nodeVal(node, sprite));
}

async function execBlock(node, sprite) {
  /* Con reporteros la casilla deja de ser texto fijo: nodeVal() sustituye
     cada hueco por el valor calculado en el momento de ejecutar. */
  const v = nodeVal(node, sprite);
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
    case 'go_xy': {
      /* node.val guarda "x,y"; una casilla vacía o inválida vale 0. */
      const xy = String(v == null ? '' : v).split(',');
      sprite.x = clamp(num(xy[0], 0), -240, 240);
      sprite.y = clamp(num(xy[1], 0), -180, 180);
      updateSpriteEl(sprite);
      await sleep(180);
      return;
    }
    case 'bounce':
      bounceSprite(sprite);
      updateSpriteEl(sprite);
      await sleep(180);
      return;
    case 'timer_reset':
      timerStart = Date.now();
      await sleep(120);
      return;
    case 'go_random':
      sprite.x = Math.round((Math.random() * 2 - 1) * 210);
      sprite.y = Math.round((Math.random() * 2 - 1) * 150);
      updateSpriteEl(sprite);
      await sleep(180);
      return;
    case 'wait':
      await sleep(Math.max(0, num(v, 1)) * 1000);
      return;
    case 'meow':
      playSoundById('meow');
      await sleep(380);
      return;
    case 'pop':
      playSoundById('pop');
      await sleep(200);
      return;
    case 'play_sound':
      /* El sonido no bloquea el guion, igual que en Scratch: para esperarlo
         se pone «esperar» debajo. El nombre es un id del catálogo. */
      playSoundById(String(v).trim());
      await sleep(120);
      return;
    case 'play_music':
      playMelodyById(String(v).trim());
      await sleep(120);
      return;
    case 'stop_sounds':
      stopAllSounds();
      await sleep(80);
      return;
    case 'set_volume':
      setVolume(v);
      await sleep(80);
      return;
    case 'change_volume':
      changeVolume(v);
      await sleep(80);
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
      renderProps();
      await sleep(120);
      return;
    case 'show':
      sprite.visible = true;
      updateSpriteEl(sprite);
      renderTray();
      renderProps();
      await sleep(120);
      return;
    case 'change_bg':
      changeBg();
      await sleep(180);
      return;
    case 'next_costume':
      setCostume(sprite, sprite.costumeIndex + 1);
      await sleep(150);
      return;
    case 'switch_costume': {
      const idx = findCostumeIndex(sprite, v);
      if (idx >= 0) setCostume(sprite, idx);
      await sleep(150);
      return;
    }
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
      const name = await askText(UI[lang].varName, '', UI[lang].varNameHint);
      if (!isRunning) return; /* Detener mientras el diálogo está abierto. */
      const clean = typeof name === 'string' ? name.trim() : '';
      /* El mismo criterio que el formulario de variables del editor. */
      if (/^[A-Za-z_][A-Za-z0-9_]{0,15}$/.test(clean) &&
        clean !== '__proto__' && clean !== 'constructor' && clean !== 'prototype' &&
        clean !== 'score' && !(clean in variables)) variables[clean] = 0;
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
    case 'send_msg': {
      store.set('scrachmo_msg', JSON.stringify({ t: Date.now() }));
      /* El evento storage no llega a la propia pestaña: reenviar el
         mensaje adentro del proyecto, con tope para cortar cadenas. */
      const now = Date.now();
      if (now - lastMsgAt > 250) {
        lastMsgAt = now;
        setTimeout(() => fireEvent('when_msg'), 0);
      }
      toast(UI[lang].msgSent);
      await sleep(150);
      return;
    }
    default:
      await sleep(30);
  }
}

/* Un guion empieza en un bloque sombrero y termina antes del siguiente.
   Los bloques sueltos (proyectos viejos sin sombrero) se tratan como
   guion de bandera verde para no romper la compatibilidad. */
function collectScripts() {
  const out = [];
  sprites.forEach(sprite => {
    let cur = null;
    (sprite.code || []).forEach(node => {
      const def = BYID[node.type];
      if (def && def.hat) {
        if (cur && cur.nodes.length) out.push(cur);
        cur = { sprite: sprite, hat: node, event: node.type, nodes: [] };
      } else {
        if (!cur) cur = { sprite: sprite, hat: null, event: 'when_flag', nodes: [] };
        cur.nodes.push(node);
      }
    });
    if (cur && cur.nodes.length) out.push(cur);
  });
  return out;
}

function scriptsFor(event, test) {
  return collectScripts().filter(sc => sc.event === event && (!test || test(sc)));
}

function projectUsesMotion() {
  const walk = nodes => (nodes || []).some(n =>
    n.type === 'when_shake' || n.type === 'if_tilt' ||
    walk(n.body) || walk(n.elseBody));
  return sprites.some(s => walk(s.code));
}

function normKeyName(k) {
  const s = String(k).trim().toLowerCase();
  const map = {
    espacio: ' ', space: ' ', enter: 'enter',
    arriba: 'arrowup', abajo: 'arrowdown',
    izquierda: 'arrowleft', derecha: 'arrowright'
  };
  return map[s] || s;
}

/* ---------------- estado de diseño vs ejecución ---------------- */
function snapshotRuntime() {
  return {
    stageBg: stageBg,
    stageBgImg: stageBgImg,
    sprites: sprites.map(s => ({
      id: s.id, x: s.x, y: s.y, dir: s.dir,
      size: s.size, visible: s.visible, rot: s.rot,
      costumeIndex: s.costumeIndex
    }))
  };
}

function restoreRuntime(snap) {
  if (!snap) return;
  snap.sprites.forEach(st => {
    const s = getSprite(st.id);
    if (!s) return;
    s.x = st.x; s.y = st.y; s.dir = st.dir; s.size = st.size;
    s.visible = st.visible; s.rot = st.rot;
    if (typeof st.costumeIndex === 'number' && s.costumes && s.costumes.length) {
      s.costumeIndex = clamp(Math.floor(st.costumeIndex), 0, s.costumes.length - 1);
      syncCostume(s);
    }
  });
  stageBg = snap.stageBg;
  stageBgImg = validBackdrop(snap.stageBgImg);
  renderSprites();
  renderTray();
  renderProps();
  applyStageBg();
}

function clearSayBubbles() {
  sayTexts.clear();
  sayTimers.forEach(t => clearTimeout(t));
  sayTimers.clear();
  const layer = $('#spritesLayer');
  if (layer) layer.querySelectorAll('.sprite-bubble').forEach(b => {
    b.textContent = '';
    b.classList.remove('show');
  });
}

/* ---------------- posición final y «Volver al inicio» ----------------
   Al terminar (o al detener) los sprites se quedan donde llegaron y ese
   estado pasa a ser el de diseño: se guarda y es el punto de partida de
   la próxima corrida. La instantánea del arranque se conserva para que
   sea el usuario quien decida cuándo volver al inicio. */
function updateResetButton() {
  const b = $('#resetStartBtn');
  if (b) b.hidden = !runtimeSnapshot || runActive;
}

function resetToStart() {
  const snap = runtimeSnapshot;
  if (!snap || runActive) return;
  restoreRuntime(snap);
  runtimeSnapshot = null;
  updateResetButton();
  saveProject();
  toast(UI[lang].startRestored);
}

function beginRun() {
  if (runActive) return;
  runActive = true;
  runtimeSnapshot = snapshotRuntime();
  updateResetButton();
}

function finishRun() {
  if (!runActive) return;
  runActive = false;
  isRunning = false;
  runThreads.forEach(t => { t.cancelled = true; });
  /* No limpiar firedScoreHats acá: el puntaje se conserva entre ejecuciones
     y vaciarlo haría que el sombrero de puntaje se dispare cada 300 ms. */
  clearSayBubbles();
  clearGlows();
  updateStatus();
  updateHUD();
  updateResetButton();
  persistProject();
}

function runScripts(list) {
  if (!list || !list.length) return;
  beginRun();
  list.forEach(startThread);
}

function fireEvent(event, test) {
  const list = scriptsFor(event, test);
  if (!list.length) return false;
  runScripts(list);
  return true;
}

async function startThread(sc) {
  const ctx = { id: ++threadSeq, cancelled: false, lastCond: false };
  runThreads.add(ctx);
  isRunning = true;
  updateStatus();
  try {
    await execStack(sc.nodes, sc.sprite, ctx);
  } catch (err) {
    console.error(err);
  } finally {
    runThreads.delete(ctx);
    if (!runThreads.size) finishRun();
  }
}

/* ---------------- resaltado (con conteo por hilo) ---------------- */
function glowOn(id) {
  const head = document.querySelector('#codeList .sb[data-id="' + id + '"]');
  if (!head) return;
  glowCounts.set(id, (glowCounts.get(id) || 0) + 1);
  head.classList.add('running');
}

function glowOff(id) {
  const n = (glowCounts.get(id) || 0) - 1;
  if (n > 0) { glowCounts.set(id, n); return; }
  glowCounts.delete(id);
  const head = document.querySelector('#codeList .sb[data-id="' + id + '"]');
  if (head) head.classList.remove('running');
}

function clearGlows() {
  glowCounts.clear();
  $$('#codeList .sb.running').forEach(el => el.classList.remove('running'));
}

/* ---------------- ejecución ---------------- */
async function execNode(node, sprite, ctx) {
  const def = BYID[node.type];
  if (!def || def.hat) return;
  const alive = () => isRunning && !(ctx && ctx.cancelled);

  glowOn(node.id);
  try {
    if (node.type === 'repeat') {
      const times = Math.max(0, Math.min(2000, Math.floor(num(nodeVal(node, sprite), 4))));
      for (let i = 0; i < times && alive(); i++) await execStack(node.body || [], sprite, ctx);
      return;
    }
    if (node.type === 'forever') {
      while (alive()) {
        const body = node.body || [];
        if (body.length) await execStack(body, sprite, ctx);
        else await sleep(120);
        await sleep(16);
      }
      return;
    }
    if (node.type === 'if_tilt' || node.type === 'if_score' || node.type === 'if_cond' || node.type === 'if_else') {
      const ok = checkNodeCondition(node, sprite);
      if (ctx) ctx.lastCond = ok;
      if (ok) await execStack(node.body || [], sprite, ctx);
      else if (node.elseBody) await execStack(node.elseBody, sprite, ctx);
      return;
    }
    if (node.type === 'sino') {
      if (ctx && !ctx.lastCond) await execStack(node.body || [], sprite, ctx);
      return;
    }
    await execBlock(node, sprite);
  } finally {
    glowOff(node.id);
  }
}

async function execStack(nodes, sprite, ctx) {
  if (!Array.isArray(nodes)) return;
  for (const node of nodes) {
    if (ctx && ctx.cancelled) return;
    if (!isRunning) return;
    await execNode(node, sprite, ctx);
  }
}

function runAll() {
  /* La bandera verde corta los guiones anteriores pero no devuelve los
     sprites a cero: arranca desde donde quedaron y beginRun() toma esa
     posición como nuevo «inicio» para el botón Volver al inicio. */
  stopCode();
  runScripts(scriptsFor('when_flag'));
}

function stopCode() {
  const wasRunning = runActive;
  runThreads.forEach(t => { t.cancelled = true; });
  finishRun();
  runThreads.clear();
  /* Detener es también silencio: si no, una música en bucle seguiría sonando
     para siempre porque nadie más la corta. */
  stopAllSounds();
  /* Un «crear variable» puede haber abierto un diálogo en medio de un guion:
     al detener, lo cerramos para que el hilo no quede esperando para siempre. */
  if (wasRunning && askResolver) closeAsk(null);
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
  saveProject();
  toast(multiOn ? t.multiOnMsg : t.multiOffMsg);
}

async function shareProject() {
  const t = UI[lang];
  const input = $('#shareLink');
  const copyBtn = $('#copyLink');
  /* Abrimos el modal ya mismo: gzip corre en un stream y no queremos
     que el toque parezca ignorado. */
  input.value = t.generatingLink;
  if (copyBtn) copyBtn.disabled = true;
  $('#shareModal').hidden = false;
  updateModalLock();

  let code = '';
  try { code = await encodeSharePayload(serializeProject()); }
  catch (e) {
    toast(t.badFile);
    if (copyBtn) copyBtn.disabled = false;
    return;
  }
  const base = (location.origin && location.origin !== 'null')
    ? location.origin + location.pathname
    : location.href.split('?')[0];
  const link = base + '?p=' + code;
  input.value = link;
  if (copyBtn) copyBtn.disabled = false;
  if (link.length > 8000) toast(t.shareTooLong);
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

async function exportProject() {
  /* Cancelar ahora cancela de verdad: antes prompt() devolvía null y el
     archivo se exportaba igual con el nombre por defecto. */
  const name = (await askText(UI[lang].projName, 'Mi Juego')) || '';
  if (!name.trim()) return;
  const clean = name.trim();
  const project = serializeProject();
  project.name = clean;
  project.savedAt = new Date().toISOString();
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = (clean.replace(/[^a-z0-9_\-áéíóúñü ]/gi, '').trim() || 'proyecto') + '.scmo';
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
        if (payloadTooBig(reader.result)) { toast(UI[lang].projectTooBig); return; }
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

async function clearProject() {
  if (!(await askConfirm(UI[lang].confirmClear))) return;
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
  runAll();
}

function exitGame() {
  stopCode();
  document.body.classList.remove('game-mode');
  window.scrollTo(0, gameScrollY || 0);
}

/* ---------------- events ---------------- */
function ensureMotionPermission() {
  if (motionRequested || !projectUsesMotion()) return;
  const DME = window.DeviceMotionEvent;
  if (!DME || typeof DME.requestPermission !== 'function') {
    motionRequested = true;
    return;
  }
  motionRequested = true;
  try {
    Promise.resolve(DME.requestPermission()).then(res => {
      if (res !== 'granted') toast(UI[lang].motionDenied);
    }).catch(() => { });
  } catch (e) { }
}

function bindEvents() {
  bindAskModal();
  bindRepPicker();
  bindProjects();
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
    fireEvent('when_tap');
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
  $('#spriteSearch').addEventListener('input', e => {
    spriteSearchTerm = e.target.value;
    renderSpriteChoices();
  });
  $('#importSpriteBtn').addEventListener('click', () => pickCostumeFiles(true));

  $('#costumeStrip').addEventListener('click', e => {
    const del = e.target.closest('[data-del-costume]');
    if (del) { deleteCostume(Number(del.dataset.delCostume)); return; }
    if (e.target.closest('[data-add-costume]')) { pickCostumeFiles(false); return; }
    const thumb = e.target.closest('[data-costume]');
    if (thumb) {
      setCostume(selectedSprite(), Number(thumb.dataset.costume));
      saveProject();
    }
  });
  $('#addCostumeBtn').addEventListener('click', () => pickCostumeFiles(false));

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

  const applyBlockValue = e => {
    const input = e.target.closest('[data-input]');
    if (!input) return;
    const info = findNode(input.dataset.input);
    if (!info) return;
    if (input.dataset.xy !== undefined) {
      /* Bloque de varios campos: node.val es "a,b". Se actualiza sólo el
         índice editado para no pisar la otra casilla ni los reporteros. */
      const parts = String(info.node.val === undefined ? '' : info.node.val).split(',');
      parts[Number(input.dataset.xy)] = input.value;
      info.node.val = parts.join(',');
    } else {
      info.node.val = input.value;
    }
    scheduleSave();
  };
  $('#codeList').addEventListener('input', applyBlockValue);
  /* Los <select> de «cambiar disfraz a» también disparan change. */
  $('#codeList').addEventListener('change', e => { applyBlockValue(e); saveProject(); });
  $('#codeList').addEventListener('click', e => {
    const fx = e.target.closest('.rep-fx');
    if (fx) { openRepPicker(fx.dataset.repHost, Number(fx.dataset.repSlot)); return; }
    const rdel = e.target.closest('.rep-del');
    if (rdel) { removeReporter(rdel.dataset.repHost, Number(rdel.dataset.repSlot)); return; }
    const dup = e.target.closest('.sb-dup');
    if (dup) { duplicateNode(dup.dataset.dup); return; }
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
    if (paletteDrag) movePaletteDrag(e);
  }, { passive: false });
  window.addEventListener('pointerup', e => {
    if (blockDrag) endBlockDrag(e, false);
    if (spriteDrag) endSpriteDrag(e, false);
    if (paletteDrag) endPaletteDrag(e, false);
  });
  window.addEventListener('pointercancel', e => {
    if (blockDrag) endBlockDrag(e, true);
    if (spriteDrag) endSpriteDrag(e, true);
    if (paletteDrag) endPaletteDrag(e, true);
  });

  /* ---- herramientas: zooms, deshacer/rehacer, fondo propio, reinicio ---- */
  $('#zoomOutBtn').addEventListener('click', () => changeZoom(-ZOOM_STEP));
  $('#zoomInBtn').addEventListener('click', () => changeZoom(ZOOM_STEP));
  $('#zoomVal').addEventListener('click', resetZoom);
  $('#stageZoomOutBtn').addEventListener('click', () => changeStageZoom(-ZOOM_STEP));
  $('#stageZoomInBtn').addEventListener('click', () => changeStageZoom(ZOOM_STEP));
  $('#stageZoomVal').addEventListener('click', resetStageZoom);
  $('#resetStartBtn').addEventListener('click', resetToStart);
  $('#undoBtn').addEventListener('click', undo);
  $('#redoBtn').addEventListener('click', redo);
  $('#bgCustomBtn').addEventListener('click', pickBackdropFile);
  $('#bgClearBtn').addEventListener('click', clearBackdrop);

  /* ---- arrastrar desde la paleta ---- */
  $('#palette').addEventListener('pointerdown', e => {
    const item = e.target.closest('[data-add]');
    if (!item) return;
    /* En táctil se agarra sólo por la empuñadura para no bloquear el scroll;
       con mouse se puede agarrar desde cualquier parte del bloque. */
    if (e.pointerType === 'touch' && !e.target.closest('.p-grip')) return;
    startPaletteDrag(e, item);
  });
  $('#palette').addEventListener('click', e => {
    /* pointerup tras un arrastre genera un click: lo descartamos. */
    if (Date.now() - lastPaletteDragAt < 400) return;
    if (e.target.closest('.p-grip')) return;
    const item = e.target.closest('[data-add]');
    if (!item) return;
    addBlock(item.dataset.add);
  });
  $('#palette').addEventListener('keydown', e => {
    if (e.target.closest('.p-grip')) return;
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
    saveUI();
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
      saveUI();
    });
  });

  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (blockDrag) { endBlockDrag(null, true); return; }
      if (spriteDrag) { endSpriteDrag(null, true); return; }
      if (paletteDrag) { endPaletteDrag(null, true); return; }
      if (!$('#spriteModal').hidden) { closeSpriteModal(); return; }
      if (!$('#shareModal').hidden) { closeShare(); return; }
      if (document.body.classList.contains('game-mode')) exitGame();
      return;
    }
    /* Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z y Ctrl/Cmd+Y. Dentro de un input
       dejamos que el navegador deshaga el texto, no el proyecto. */
    if ((e.ctrlKey || e.metaKey) && !e.altKey) {
      const k = e.key.toLowerCase();
      if (k === 'z' || k === 'y') {
        if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
        e.preventDefault();
        if (k === 'y' || e.shiftKey) redo(); else undo();
        return;
      }
    }
    if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    const key = e.key === ' ' ? ' ' : e.key.toLowerCase();
    const list = scriptsFor('when_key', sc => normKeyName(sc.hat.val || 'espacio') === key);
    if (!list.length) return;
    e.preventDefault();
    runScripts(list);
  });

  window.addEventListener('devicemotion', e => {
    const acc = e.accelerationIncludingGravity;
    if (!acc) return;
    window.lastTilt = acc.x || 0;
    const force = Math.sqrt(
      Math.pow(acc.x || 0, 2) + Math.pow(acc.y || 0, 2) + Math.pow(acc.z || 0, 2)
    );
    const now = Date.now();
    if (force > 25 && now - lastShakeAt > 900) {
      lastShakeAt = now;
      fireEvent('when_shake');
    }
  });

  window.addEventListener('storage', e => {
    if (e.key === 'scrachmo_msg' && multiOn) fireEvent('when_msg');
  });

  /* iOS 13+ exige pedir permiso dentro de un gesto del usuario y con HTTPS. */
  document.addEventListener('pointerdown', ensureMotionPermission);

  setInterval(() => {
    const scripts = scriptsFor('when_score');
    if (!scripts.length) { firedScoreHats.clear(); return; }
    const live = new Set();
    scripts.forEach(sc => {
      const target = num(sc.hat.val, 10);
      /* El umbral forma parte de la clave: editarlo debe permitir
         volver a disparar el sombrero. */
      const key = (sc.hat.id || sc.sprite.id) + ':' + target;
      live.add(key);
      if (score >= target) {
        if (!firedScoreHats.has(key)) { firedScoreHats.add(key); runScripts([sc]); }
      } else {
        firedScoreHats.delete(key);
      }
    });
    firedScoreHats.forEach(k => { if (!live.has(k)) firedScoreHats.delete(k); });
  }, 300);
}

/* ---------------- start ---------------- */
const pendingShare = loadProject();
initProjects();
bindEvents();
render();
/* La primera instantánea es la línea base del historial. Si venimos de un
   link compartido, hydrateShared() la reemplaza al aplicar el proyecto. */
resetHistory();
if (pendingShare) hydrateShared(pendingShare);
