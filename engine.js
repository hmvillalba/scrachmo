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
/* Tamaño del mundo, en unidades. Es del proyecto y manda sobre todo lo demás:
   la proporción del escenario, dónde están los bordes y hasta dónde llega un
   personaje. De fábrica mide 480x360, igual que Scratch. Se puede agrandar
   arrastrando las asas del escenario y volver atrás con «tamaño original». */
const WORLD_W0 = 480;
const WORLD_H0 = 360;
const WORLD_MIN_W = 480;
const WORLD_MIN_H = 360;
const WORLD_MAX_W = 1440;
const WORLD_MAX_H = 1080;
let worldW = WORLD_W0;
let worldH = WORLD_H0;
/* Clones: copias vivas de un personaje que existen SÓLO mientras dura la
   ejecución. No están en `sprites` (eso es el estado de diseño y es lo que se
   guarda) y no se serializan nunca. Cada clon es «parecido a un personaje»:
   tiene id propio, posición, tamaño, dirección y disfraz propios, y comparte
   el código y las variables con su original. */
let clones = [];
let cloneSeq = 0;
const MAX_CLONES = 300;
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
/* Tamaño de cada globo abierto, en porcentaje. Va aparte del texto para que
   el bloque «decir» siga guardando el mensaje tal cual en node.val. */
const sayZooms = new Map();

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
/* Estado del acelerómetro como control. Vive acá arriba, con el resto del
   estado, porque `stopCode()` tiene que poder cortarlo desde cualquier lado. */
let tiltOn = false;
let tiltBase = null;
let tiltState = { roll: 0, pitch: 0 };
let tiltTimer = null;
let spriteSearchTerm = '';

/* disfraces: límites pensados para no reventar el guardado local (5 MB)
   ni los links compartidos. Un dataURL de ~300 KB por disfraz como tope. */
const MAX_COSTUMES = 12;
const MAX_IMG_CHARS = 400000;
const COSTUME_MAX_PX = 256;
const IMG_DATA_RE = /^data:image\/(webp|png|jpeg|gif);base64,[A-Za-z0-9+/=]+$/;
const COSTUME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/bmp'];
/* El SVG se acepta como entrada, pero nunca se guarda: se rasteriza a
   WebP/PNG como cualquier otra imagen. IMG_DATA_RE sigue sin admitir
   data:image/svg+xml, que podría llevar script adentro. */
const VECTOR_TYPE = 'image/svg+xml';
const ACCEPT_IMAGE = COSTUME_TYPES.concat([VECTOR_TYPE]);
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
/* Tope de BYTES al descomprimir. UTF-8 puede usar hasta 4 bytes por carácter,
   así que el límite de caracteres se traduce a este techo sin rechazar por
   error un proyecto legítimo con muchos acentos o emojis. */
const MAX_INFLATE_BYTES = MAX_PAYLOAD_CHARS * 4;
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

/* Bordes del mundo, en unidades. El mundo crece hacia la DERECHA y hacia
   ABAJO: el borde izquierdo se queda en x=-240 y el de arriba en y=180, así
   agrandar el escenario no mueve ni un píxel a lo que ya estaba puesto. */
function worldLeft() { return -WORLD_W0 / 2; }
function worldRight() { return worldW - WORLD_W0 / 2; }
function worldTop() { return WORLD_H0 / 2; }
function worldBottom() { return -(worldH - WORLD_H0 / 2); }

/* Las posiciones se guardan en unidades y se dibujan en porcentaje del mundo.
   Con el tamaño de fábrica esto da exactamente 50 + x/4.8 y 50 - y/3.6. */
function posLeft(s) { return (s.x - worldLeft()) / worldW * 100; }
function posTop(s) { return (worldTop() - s.y) / worldH * 100; }

/* Deja un personaje adentro del mundo. Se usa al cargar y al achicar. */
function clampToWorld(s) {
  if (!s) return s;
  s.x = clamp(num(s.x, 0), worldLeft(), worldRight());
  s.y = clamp(num(s.y, 0), worldBottom(), worldTop());
  return s;
}

/* Lleva el tamaño del mundo al CSS (la caja del escenario sale de ahí) y
   muestra u oculta el botón de volver al tamaño original. */
function applyWorldSize() {
  /* Se redondea sólo al dibujar: `worldW`/`worldH` guardan decimales para que
     un arrastre lento no se quede clavado (con el redondeo en cada paso, los
     movimientos de menos de media unidad se perdían). */
  document.body.style.setProperty('--stage-w', String(Math.round(worldW)));
  document.body.style.setProperty('--stage-h', String(Math.round(worldH)));
  const btn = $('#stageSizeReset');
  if (btn) btn.hidden = (Math.round(worldW) === WORLD_W0 && Math.round(worldH) === WORLD_H0);
  /* Las casillas de x/y siguen los bordes del mundo, si no el navegador marca
     como inválido un valor que el motor acepta perfectamente. */
  const px = $('#propX');
  const py = $('#propY');
  if (px) px.max = String(Math.round(worldRight()));
  if (py) py.min = String(Math.round(worldBottom()));
}

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

/* Descomprime POR PARTES y corta en cuanto se pasa del tope. Hacer
   `new Response(stream).arrayBuffer()` y recién después medir el resultado deja
   la puerta abierta a una bomba gzip: 20 KB comprimidos pueden expandirse a
   cientos de MB, y el navegador los materializa enteros antes de devolver el
   control. Acá se cancela el reader, así el descompresor deja de producir. */
async function inflateLimited(bytes, limit) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  const reader = stream.getReader();
  const parts = [];
  let total = 0;
  for (;;) {
    const step = await reader.read();
    if (step.done) break;
    total += step.value.length;
    if (total > limit) {
      try { await reader.cancel(); } catch (e) { }
      return null;
    }
    parts.push(step.value);
  }
  const out = new Uint8Array(total);
  let off = 0;
  parts.forEach(p => { out.set(p, off); off += p.length; });
  return out;
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
      bytes = await inflateLimited(bytes, MAX_INFLATE_BYTES);
      if (!bytes) return null;
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
  /* El tamaño del globo viaja en el proyecto. Sin este campo, exportar y
     volver a importar (link o .scmo) devolvería todos los diálogos al 100 %. */
  if (def.zoom) node.zoom = clamp(Math.round(num(raw.zoom, 100)), 50, 250);
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
        x: clamp(num(raw.x, 0), worldLeft(), worldRight()),
        y: clamp(num(raw.y, 0), worldBottom(), worldTop()),
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
  /* Los clones pertenecen al proyecto que se estaba ejecutando: si se carga
     otro (o se deshace), sus guiones apuntarían a personajes que ya no están. */
  clearClones();
  /* Tampoco arrastra la música del proyecto anterior. */
  stopAllSounds();
  score = clamp(num(payload.score, 0), -1000000, 1000000);
  multiOn = !!payload.multiOn;
  volume = clamp(Math.round(num(payload.volume, 100)), 0, 100);
  applyVolume();

  if (payload && Array.isArray(payload.sprites)) {
    /* El tamaño del mundo se lee ANTES de normalizar: los personajes se
       recortan contra los bordes nuevos, no contra los de fábrica. */
    worldW = clamp(Math.round(num(payload.worldW, WORLD_W0)), WORLD_MIN_W, WORLD_MAX_W);
    worldH = clamp(Math.round(num(payload.worldH, WORLD_H0)), WORLD_MIN_H, WORLD_MAX_H);
    applyWorldSize();
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

  worldW = WORLD_W0;
  worldH = WORLD_H0;
  applyWorldSize();
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
  worldW = WORLD_W0;
  worldH = WORLD_H0;
  applyWorldSize();
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
  clearClones();
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
    worldW: worldW,
    worldH: worldH,
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
  /* «Deshacer borrado» sólo aparece si hay algo que restaurar. */
  const undoBtn = $('#projUndo');
  if (undoBtn) undoBtn.hidden = !lastDeleted;
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

/* Último proyecto borrado en esta sesión: permite deshacer sin haber escrito
   una papelera en disco. Se guarda también su JSON, que es lo único que no se
   puede reconstruir después. */
let lastDeleted = null;

/* Respaldo de TODA la biblioteca en un solo archivo. El proyecto activo se
   serializa en el momento (vive en scrachmo_v8 y su slot puede estar viejo);
   los demás salen de su slot. */
function libraryPayload() {
  const activo = serializeProject();
  return {
    format: 'scrachmo-library',
    version: APP_VERSION,
    exportedAt: new Date().toISOString(),
    active: activeProjectId,
    projects: projects.map(p => {
      let data = null;
      if (p.id === activeProjectId) data = activo;
      else {
        try { data = JSON.parse(store.get(projectKey(p.id)) || 'null'); } catch (e) { data = null; }
      }
      return { id: p.id, name: p.name, updatedAt: p.updatedAt, data: data };
    })
  };
}

function exportLibrary() {
  const t = UI[lang];
  const data = libraryPayload();
  try {
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scrachmo-biblioteca-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    /* Revocar enseguida puede cortar la descarga en Safari: se espera. */
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    toast(t.libraryExported.replace('{n}', String(data.projects.length)));
  } catch (e) {
    toast(t.badFile);
  }
}

function undoDeleteProject() {
  const t = UI[lang];
  const d = lastDeleted;
  if (!d) return;
  if (projects.length >= MAX_PROJECTS) { toast(t.projectLimit); return; }
  const at = clamp(d.index, 0, projects.length);
  projects.splice(at, 0, { id: d.id, name: d.name, updatedAt: d.updatedAt });
  /* El JSON se repone sólo si se había podido leer al borrar. */
  if (d.raw) store.set(projectKey(d.id), d.raw);
  lastDeleted = null;
  writeProjects();
  renderProjects();
  toast(t.projectRestored);
}

async function deleteProject(id) {
  const t = UI[lang];
  if (projects.length <= 1) { toast(t.onlyOneProject); return; }
  const p = projects.find(x => x.id === id);
  if (!p) return;
  const sure = await askConfirm(t.deleteProject + ': «' + p.name + '»?');
  if (!sure) return;

  /* Se copia ANTES de tocar nada: si el borrado era el activo, su contenido
     vive en scrachmo_v8 y está a punto de ser reemplazado por el siguiente. */
  if (id === activeProjectId) persistProject();
  lastDeleted = {
    id: id,
    name: p.name,
    updatedAt: p.updatedAt,
    index: projects.findIndex(x => x.id === id),
    raw: store.get(id === activeProjectId ? 'scrachmo_v8' : projectKey(id))
  };

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
  const exp = $('#projExport');
  if (exp) exp.addEventListener('click', exportLibrary);
  const undo = $('#projUndo');
  if (undo) undo.addEventListener('click', undoDeleteProject);

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

/* ---------------- ejemplos y guía ----------------
   Tres proyectos de muestra que se abren como COPIA: nunca tocan el proyecto
   que la persona estaba armando. Se arman con makeNode()/createSpriteData(),
   los mismos constructores que usa la app, así que no hay JSON duplicado que
   se desincronice cuando cambia el formato de los nodos. */

/* El zoom del globo vive en node.zoom y no en val, así que no puede ir por
   makeNode: se asigna después. */
function exSay(text, zoom) {
  const n = makeNode('say', text);
  if (n) n.zoom = clamp(Math.round(num(zoom, 100)), 50, 250);
  return n;
}

/* Caminar sólo en horizontal: «ir a x: (posición x) + delta, y: fija». Es el
   patrón que evita que el personaje se dé vuelta mientras camina, y de paso
   muestra cómo se anida un reportero dentro de otro. */
function exStepX(delta, y) {
  const suma = makeNode('rep_add', '0,' + delta);
  suma.reps = [makeNode('rep_x'), null];
  const ir = makeNode('go_xy', '0,' + y);
  ir.reps = [suma, null];
  return ir;
}

/* Clon que aparece en un punto al azar de la parte de arriba. */
function exDrop(y) {
  const ir = makeNode('go_xy', '0,' + y);
  ir.reps = [makeNode('rep_random', '-190,190'), null];
  return ir;
}

function exHola(t) {
  const gato = createSpriteData('🐱', t.exCat, [
    makeNode('when_flag'),
    exSay(t.ex1Line1, 130),
    makeNode('wait', 1),
    exSay(t.ex1Line2, 100),
    makeNode('when_key', 'arrowright'),
    makeNode('point_dir', 90),
    makeNode('move', 14),
    makeNode('when_key', 'arrowleft'),
    makeNode('point_dir', -90),
    makeNode('move', 14)
  ]);
  gato.y = -40;
  return { sprites: [gato], selected: gato.id };
}

function exFruta(t) {
  const cesta = createSpriteData('🧺', t.exBasket, [
    makeNode('when_flag'),
    makeNode('go_xy', '0,-140'),
    makeNode('when_key', 'arrowleft'),
    exStepX(-18, -140),
    makeNode('when_key', 'arrowright'),
    exStepX(18, -140)
  ]);
  cesta.y = -140;

  /* El clon se borra al tocar la cesta: «borrar este clon» corta el hilo en
     el siguiente punto de espera, así que no sigue cayendo. */
  const toca = makeNode('if_touch_sprite', cesta.id);
  toca.body = [makeNode('score_add', 1), makeNode('delete_clone')];

  const caer = makeNode('repeat', 30);
  caer.body = [makeNode('move', 12), toca];

  const lluvia = makeNode('forever');
  lluvia.body = [makeNode('create_clone', 'self'), makeNode('wait', 1)];

  const fruta = createSpriteData('🍎', t.exFruit, [
    makeNode('when_flag'),
    makeNode('hide'),
    lluvia,
    makeNode('when_clone'),
    /* Un clon de un personaje escondido nace escondido: hay que mostrarlo. */
    makeNode('show'),
    exDrop(170),
    makeNode('point_dir', 180),
    caer,
    makeNode('delete_clone')
  ]);
  return { sprites: [cesta, fruta], selected: cesta.id, showScore: true };
}

function exCometas(t) {
  const lluvia = makeNode('forever');
  lluvia.body = [makeNode('create_clone', 'self'), makeNode('wait', 1.4)];

  const caer = makeNode('repeat', 34);
  caer.body = [makeNode('move', 10)];

  const cometa = createSpriteData('☄️', t.exComet, [
    makeNode('when_flag'),
    makeNode('hide'),
    lluvia,
    makeNode('when_clone'),
    makeNode('show'),
    exDrop(175),
    makeNode('point_dir', 180),
    caer,
    makeNode('delete_clone')
  ]);

  const golpe = makeNode('if_touch_sprite', cometa.id);
  golpe.body = [exSay(t.ex3Hit, 120), makeNode('score_reset'), makeNode('vibrate', 200)];

  const vigilar = makeNode('forever');
  vigilar.body = [makeNode('wait', 0.5), golpe];

  const nave = createSpriteData('🚀', t.exShip, [
    makeNode('when_flag'),
    makeNode('go_xy', '0,-140'),
    makeNode('score_reset'),
    vigilar,
    makeNode('when_key', 'arrowleft'),
    exStepX(-18, -140),
    makeNode('when_key', 'arrowright'),
    exStepX(18, -140)
  ]);
  nave.y = -140;

  /* Los puntos suben solos mientras sobrevivís: así se nota el reinicio. */
  const puntos = makeNode('forever');
  puntos.body = [makeNode('wait', 1), makeNode('score_add', 1)];
  nave.code.push(makeNode('when_flag'), puntos);

  return { sprites: [nave, cometa], selected: nave.id, showScore: true };
}

const EXAMPLES = [
  { id: 'hola', emoji: '🐱', nameKey: 'ex1', descKey: 'ex1d', build: exHola },
  { id: 'fruta', emoji: '🍎', nameKey: 'ex2', descKey: 'ex2d', build: exFruta },
  { id: 'cometas', emoji: '☄️', nameKey: 'ex3', descKey: 'ex3d', build: exCometas }
];

const EXAMPLE_GUIDE_STEPS = 5;

/* Proyecto completo a partir de un ejemplo. Se devuelve un objeto con la
   misma forma que serializeProject(), que es lo que come applyPayload(). */
function examplePayload(ex) {
  const t = UI[lang];
  const built = ex.build(t);
  return {
    version: '2.0',
    sprites: built.sprites,
    variables: {},
    hidden: {},
    worldW: WORLD_W0,
    worldH: WORLD_H0,
    stageBg: built.stageBg || 0,
    stageBgImg: '',
    showScore: !!built.showScore,
    score: 0,
    multiOn: false,
    volume: 100,
    selected: built.selected
  };
}

function renderExamples() {
  const box = $('#exList');
  if (!box) return;
  const t = UI[lang];
  const frag = document.createDocumentFragment();

  const cards = document.createElement('div');
  cards.className = 'ex-cards';
  EXAMPLES.forEach(ex => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'ex-card';
    card.dataset.example = ex.id;

    const face = document.createElement('span');
    face.className = 'ex-face';
    face.setAttribute('aria-hidden', 'true');
    face.textContent = ex.emoji;

    const txt = document.createElement('span');
    txt.className = 'ex-txt';
    const name = document.createElement('b');
    name.textContent = t[ex.nameKey];
    const desc = document.createElement('small');
    desc.textContent = t[ex.descKey];
    txt.appendChild(name);
    txt.appendChild(desc);

    card.appendChild(face);
    card.appendChild(txt);
    cards.appendChild(card);
  });
  frag.appendChild(cards);

  const titulo = document.createElement('p');
  titulo.className = 'ex-guide-title';
  titulo.textContent = t.exGuide;
  frag.appendChild(titulo);

  const lista = document.createElement('ol');
  lista.className = 'ex-guide';
  for (let i = 1; i <= EXAMPLE_GUIDE_STEPS; i++) {
    const li = document.createElement('li');
    li.textContent = t['exStep' + i];
    lista.appendChild(li);
  }
  frag.appendChild(lista);

  box.replaceChildren(frag);
}

function openExamples() {
  const modal = $('#exModal');
  if (!modal) return;
  renderExamples();
  modal.hidden = false;
  updateModalLock();
}

function closeExamples() {
  const modal = $('#exModal');
  if (!modal || modal.hidden) return;
  modal.hidden = true;
  updateModalLock();
}

/* Abrir un ejemplo crea un proyecto NUEVO: el que estaba abierto se respalda
   en su slot y queda intacto en la lista. */
function openExample(id) {
  const t = UI[lang];
  const ex = EXAMPLES.find(e => e.id === id);
  if (!ex) return;
  if (projects.length >= MAX_PROJECTS) { toast(t.projectLimit); return; }
  if (!persistProject()) return;
  if (!stashActiveProject()) return;

  const payload = examplePayload(ex);
  const pid = uid('p');
  stopCode();
  if (!applyPayload(payload)) { toast(t.badFile); return; }
  projects.unshift({ id: pid, name: t[ex.nameKey], updatedAt: Date.now() });
  activeProjectId = pid;
  writeProjects();
  varFormOpen = false;
  resetHistory();
  render();
  persistProject();
  updateProjectName();
  closeExamples();
  toast(t.exOpened.replace('{n}', t[ex.nameKey]));
}

function bindExamples() {
  const btn = $('#examplesBtn');
  if (btn) btn.addEventListener('click', openExamples);
  const close = $('#exClose');
  if (close) close.addEventListener('click', closeExamples);

  const modal = $('#exModal');
  if (!modal) return;
  modal.addEventListener('click', e => {
    if (e.target === modal) { closeExamples(); return; }
    const card = e.target.closest('[data-example]');
    if (card) openExample(card.dataset.example);
  });
  document.addEventListener('keydown', e => {
    if (!modal.hidden && e.key === 'Escape') { e.preventDefault(); closeExamples(); }
  });
}

/* ---------------- acerca de ----------------
   Mismos datos que el resto de los proyectos del autor, traducidos a los
   cuatro idiomas. Es informativo: no toca el proyecto ni el guardado. */
function openAbout() {
  const modal = $('#aboutModal');
  if (!modal) return;
  modal.hidden = false;
  updateModalLock();
}

function closeAbout() {
  const modal = $('#aboutModal');
  if (!modal || modal.hidden) return;
  modal.hidden = true;
  updateModalLock();
}

function bindAbout() {
  const open = $('#aboutBtn');
  if (open) open.addEventListener('click', openAbout);
  const close = $('#aboutClose');
  if (close) close.addEventListener('click', closeAbout);

  const modal = $('#aboutModal');
  if (!modal) return;
  /* Tocar el fondo cierra; tocar la tarjeta o los enlaces, no. */
  modal.addEventListener('click', e => {
    if (e.target === modal) closeAbout();
  });
  document.addEventListener('keydown', e => {
    if (!modal.hidden && e.key === 'Escape') { e.preventDefault(); closeAbout(); }
  });
}

/* ---------------- actualizaciones de la PWA ----------------
   sw.js llama a skipWaiting() al instalarse, así que una versión nueva toma
   el control de las pestañas que ya estaban abiertas. Sin aviso, la persona
   sigue usando HTML/JS viejos con una caché nueva y no se entera de nada.
   En la PRIMERA instalación no hay controller previo: ahí no se avisa, porque
   no hay una versión anterior que reemplazar. */
let pwaUpdateShown = false;

function showPwaUpdate() {
  const bar = $('#updateBar');
  if (!bar || pwaUpdateShown) return;
  pwaUpdateShown = true;
  bar.hidden = false;
}

function bindPwaUpdates() {
  const bar = $('#updateBar');
  if (!bar) return;

  /* Estos dos se enganchan siempre, incluso con file://: son del DOM, no del
     service worker, y la prueba de «Acerca de» los ejercita sin servidor. */
  const reload = $('#updateReload');
  if (reload) reload.addEventListener('click', () => location.reload());
  const close = $('#updateClose');
  if (close) close.addEventListener('click', () => { bar.hidden = true; });

  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  const habiaController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (habiaController) showPwaUpdate();
  });
  /* updatefound vive en la registration, no en el container. ready resuelve
     cuando haya una activa, incluso si el registro ocurre después de acá. */
  navigator.serviceWorker.ready.then(reg => {
    reg.addEventListener('updatefound', () => {
      const nuevo = reg.installing;
      if (!nuevo || !habiaController) return;
      nuevo.addEventListener('statechange', () => {
        if (nuevo.state === 'installed' && navigator.serviceWorker.controller) showPwaUpdate();
      });
    });
  }).catch(() => { /* sin service worker la app funciona igual */ });
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

/* ---------------- accesibilidad de los modales ----------------
   Sin trampa de foco, Tab se escapa del diálogo hacia la interfaz de atrás y
   quien usa teclado no tiene forma de cerrarlo. Se centraliza acá: los seis
   modales ya llaman updateModalLock() al abrir y al cerrar. además de retener
   Tab se marca el fondo como «inert» y se devuelve el foco al control que
   abrió el diálogo. */
const MODAL_IDS = ['shareModal', 'spriteModal', 'askModal', 'repPicker', 'projModal', 'exModal', 'aboutModal'];
const FOCUSABLE_SEL = 'a[href],button:not([disabled]),input:not([disabled]),' +
  'select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
let modalFocusFrom = null;
let modalTrapBound = false;

function openModals() {
  return MODAL_IDS.map(id => $('#' + id)).filter(m => m && !m.hidden);
}

function modalFocusables(modal) {
  return Array.prototype.filter.call(modal.querySelectorAll(FOCUSABLE_SEL), el =>
    !el.hidden && el.getAttribute('aria-hidden') !== 'true' &&
    (el.offsetWidth > 0 || el.offsetHeight > 0));
}

function trapModalKey(e) {
  if (e.key !== 'Tab') return;
  const abiertos = openModals();
  const modal = abiertos[abiertos.length - 1];
  if (!modal) return;
  const items = modalFocusables(modal);
  if (!items.length) { e.preventDefault(); return; }
  const primero = items[0];
  const ultimo = items[items.length - 1];
  const activo = document.activeElement;
  if (e.shiftKey && (activo === primero || !modal.contains(activo))) {
    e.preventDefault();
    ultimo.focus();
  } else if (!e.shiftKey && (activo === ultimo || !modal.contains(activo))) {
    e.preventDefault();
    primero.focus();
  }
}

function updateModalLock() {
  const abiertos = openModals();
  const anyOpen = abiertos.length > 0;
  const estabaAbierto = document.body.classList.contains('modal-open');
  if (anyOpen && !estabaAbierto) modalFocusFrom = document.activeElement;
  document.body.classList.toggle('modal-open', anyOpen);

  /* «inert» saca al resto de la página del orden de tabulación y de los
     eventos. Los .modal son hermanos del contenedor .app, así que se excluyen:
     marcar ese contenedor dejaría mudos también a los diálogos. */
  Array.prototype.forEach.call(document.body.children, hijo => {
    if (hijo.classList && hijo.classList.contains('modal')) return;
    if (anyOpen) hijo.setAttribute('inert', '');
    else hijo.removeAttribute('inert');
  });

  if (anyOpen) {
    const modal = abiertos[abiertos.length - 1];
    if (!modal.contains(document.activeElement)) {
      const items = modalFocusables(modal);
      try {
        if (items.length) items[0].focus();
        else { modal.setAttribute('tabindex', '-1'); modal.focus(); }
      } catch (e) { }
    }
    if (!modalTrapBound) {
      document.addEventListener('keydown', trapModalKey, true);
      modalTrapBound = true;
    }
  } else {
    if (modalTrapBound) {
      document.removeEventListener('keydown', trapModalKey, true);
      modalTrapBound = false;
    }
    const volver = modalFocusFrom;
    modalFocusFrom = null;
    if (volver && volver.isConnected && typeof volver.focus === 'function') {
      try { volver.focus(); } catch (e) { }
    }
  }
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
  /* El fondo va en su propia capa DENTRO del mundo (`.stage-bg`), no en
     `.stage`: así el zoom lo agranda junto con los personajes. Si quedara en
     la ventana, al acercarse los personajes crecerían sobre un fondo quieto. */
  const stage = $('#stageBg') || $('#stage');
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
  layer.innerHTML = sprites.concat(clones).map((s, i) => spriteHTML(s, i)).join('');
  applyStageBg();
}

/* ---------------- clones ----------------
   Un clon se dibuja igual que un personaje y ejecuta el mismo código, pero su
   estado es propio. Se crea y se borra en tiempo de ejecución, nunca se guarda. */
function isClone(s) { return !!(s && s.isClone); }

/* Índice dentro de la capa: sirve para el z-index, que en los clones no puede
   salir de `spriteIndex()` porque no están en `sprites`. */
function layerIndex(id) {
  const i = sprites.findIndex(s => s.id === id);
  if (i > -1) return i;
  const j = clones.findIndex(c => c.id === id);
  return j > -1 ? sprites.length + j : 0;
}

function makeClone(src) {
  const c = {
    id: 'cl' + (++cloneSeq),
    srcId: src.id,
    isClone: true,
    dead: false,
    name: src.name,
    costumes: src.costumes || [],
    costumeIndex: src.costumeIndex || 0,
    x: src.x, y: src.y, dir: src.dir, size: src.size,
    visible: src.visible, rot: src.rot,
    code: src.code
  };
  /* El disfraz se recalcula: si el original usa una imagen, el clon necesita
     su propio `img` y no el que tenía el original al copiarse. */
  syncCostume(c);
  return c;
}

function spawnClone(src) {
  if (!src || clones.length >= MAX_CLONES) return null;
  const c = makeClone(src);
  clones.push(c);
  const layer = $('#spritesLayer');
  if (layer) layer.insertAdjacentHTML('beforeend', spriteHTML(c, layer.children.length));
  scriptsFor('when_clone', sc => sc.sprite === c).forEach(startThread);
  return c;
}

function deleteClone(c) {
  if (!isClone(c) || c.dead) return;
  c.dead = true;
  const i = clones.indexOf(c);
  if (i > -1) clones.splice(i, 1);
  const el = findSpriteEl(c.id);
  if (el) el.remove();
  sayTexts.delete(c.id);
  clearTimeout(sayTimers.get(c.id));
  sayTimers.delete(c.id);
}

function clearClones() {
  clones.slice().forEach(deleteClone);
  clones = [];
  cloneSeq = 0;
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
  el.style.zIndex = s.id === selectedSpriteId ? '60' : String(layerIndex(s.id) + 1);

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
  /* El zoom se aplica por CSS con --bz, así no hay estilos inline que peleen
     con el modo juego ni con la animación de entrada del globo. */
  bub.style.setProperty('--bz', String(clamp(num(sayZooms.get(s.id), 100), 50, 250) / 100));
  bub.classList.toggle('show', !!text);
}

function saySprite(s, text, zoom) {
  sayTexts.set(s.id, text);
  sayZooms.set(s.id, clamp(num(zoom, 100), 50, 250));
  updateBubbleEl(s);
  clearTimeout(sayTimers.get(s.id));
  const timer = setTimeout(() => {
    sayTexts.delete(s.id);
    sayZooms.delete(s.id);
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

function isSvgFile(file) {
  const type = String(file.type || '').toLowerCase();
  if (type) return type === VECTOR_TYPE;
  return /\.svg$/.test(String(file.name || '').toLowerCase());
}

function isAllowedImage(file) {
  const name = String(file.name || '').toLowerCase();
  /* .svgz viene comprimido en gzip: el navegador no lo abre como imagen. */
  if (/\.svgz$/.test(name)) return false;
  const type = String(file.type || '').toLowerCase();
  if (type) return ACCEPT_IMAGE.indexOf(type) >= 0;
  return /\.(png|jpe?g|webp|gif|bmp|svg)$/.test(name);
}

/* Un SVG no trae píxeles: hay que deducir su proporción para rasterizarlo.
   Mandan el width/height del propio <svg>; si faltan, el viewBox. */
function svgBox(text) {
  const tag = /<svg\b[^>]*>/i.exec(String(text || '').slice(0, 4000));
  const attrs = tag ? tag[0] : '';
  const attr = name => {
    const re = new RegExp('(?:^|[\\s<])' + name + '\\s*=\\s*["\']([^"\']*)["\']', 'i');
    const m = re.exec(attrs);
    return m ? m[1] : '';
  };
  const num = v => {
    const m = /^\s*(-?[\d.]+)\s*([a-z%]*)/i.exec(String(v || ''));
    if (!m) return 0;
    const n = parseFloat(m[1]);
    if (!(n > 0)) return 0;
    /* Un 100% no dice nada del tamaño real: mejor caer al viewBox. */
    return m[2] === '%' ? 0 : n;
  };
  let w = num(attr('width'));
  let h = num(attr('height'));
  if (!w || !h) {
    const p = attr('viewBox').trim().split(/[\s,]+/).map(parseFloat);
    if (p.length === 4 && p[2] > 0 && p[3] > 0) { w = w || p[2]; h = h || p[3]; }
  }
  if (!w || !h) { w = 1; h = 1; }
  return { w: w, h: h };
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

function loadImgUrl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('imagen ilegible'));
    img.src = url;
  });
}

function loadBitmapViaImg(file) {
  const url = URL.createObjectURL(file);
  return loadImgUrl(url).then(
    img => { URL.revokeObjectURL(url); return img; },
    err => { URL.revokeObjectURL(url); throw err; }
  );
}

/* Devuelve algo dibujable más su tamaño lógico. Un SVG pasa por <img>, donde
   el navegador lo dibuja en modo seguro (sin scripts ni recursos externos), y
   se mide con su propio width/height/viewBox. */
async function decodeImage(file) {
  if (isSvgFile(file)) {
    const box = svgBox(await file.text());
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImgUrl(url);
      return { src: img, w: box.w, h: box.h, vector: true, release: () => URL.revokeObjectURL(url) };
    } catch (e) {
      URL.revokeObjectURL(url);
      throw e;
    }
  }
  const bmp = await loadBitmap(file);
  return {
    src: bmp, w: bmp.width, h: bmp.height, vector: false,
    release: () => { if (typeof bmp.close === 'function') bmp.close(); }
  };
}

/* Re-encode a WebP y ajusta el tamaño. Nunca se guarda el archivo original:
   así controlamos el peso y un SVG jamás llega al proyecto como SVG. */
async function encodeImage(file, maxPx, maxChars, qBase, qStep) {
  const img = await decodeImage(file);
  try {
    const max = Math.max(img.w, img.h) || 1;
    /* Un vector se puede agrandar —para eso es vectorial—; un mapa de bits no,
       porque sólo ganaríamos peso. */
    const scale = img.vector ? maxPx / max : Math.min(1, maxPx / max);
    let w = Math.max(1, Math.round(img.w * scale));
    let h = Math.max(1, Math.round(img.h * scale));
    for (let attempt = 0; attempt < 3; attempt++) {
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img.src, 0, 0, w, h);
      let out = canvas.toDataURL('image/webp', qBase - attempt * qStep);
      if (!/^data:image\/webp;base64,/.test(out)) out = canvas.toDataURL('image/png');
      if (out.length <= maxChars && IMG_DATA_RE.test(out)) return out;
      w = Math.max(1, Math.round(w * 0.7));
      h = Math.max(1, Math.round(h * 0.7));
    }
    return null;
  } finally {
    img.release();
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
  input.accept = ACCEPT_IMAGE.join(',');
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
  input.accept = ACCEPT_IMAGE.join(',');
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
        if (pickMatch(def.pick, item.id, cur)) { opt.selected = true; found = true; }
        sel.appendChild(opt);
      });
      /* Un id que ya no existe (proyecto viejo o editado a mano) no rompe el
         bloque: se muestra como opción suelta y el guion no hace nada. */
      if (!found) {
        const opt = document.createElement('option');
        opt.value = cur;
        opt.textContent = def.pick === 'sprites' ? UI[lang].spriteMissing
          : (def.pick === 'keys' ? UI[lang].keyMissing : UI[lang].soundMissing);
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
  /* El globo de diálogo se puede agrandar o achicar. El tamaño vive en
     node.zoom y NO dentro de node.val: si fuera un segundo hueco, un mensaje
     con comas («Hola, mundo») se partiría en dos campos, porque los bloques
     de varios huecos guardan "a,b". */
  if (def.zoom && !opts.preview) {
    const zoom = clamp(Math.round(num(node.zoom, 100)), 50, 250);
    const zin = document.createElement('input');
    zin.className = 'sb-input sb-zoom';
    zin.type = 'number';
    zin.min = '50';
    zin.max = '250';
    zin.step = '10';
    zin.value = String(zoom);
    zin.dataset.zoom = node.id;
    zin.title = tr.bubbleZoom;
    zin.setAttribute('aria-label', tr.bubbleZoom);
    content.appendChild(zin);
    const unit = document.createElement('span');
    unit.className = 'sb-zoom-unit';
    unit.textContent = '%';
    content.appendChild(unit);
  }
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
   El zoom es una cámara: la ventana del escenario mide siempre lo mismo y lo
   que se agranda es el mundo (`.stage-world`), con su fondo y sus personajes.
   Antes la variable CSS escalaba el alto de la escena y el tamaño de cada
   emoji por separado: la caja crecía, la página saltaba y las posiciones
   quedaban estiradas. Las posiciones siguen siendo porcentuales del mundo, así
   que arrastrar y los bloques de movimiento no cambian. */
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
  hint.textContent = stageHintText(t);
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
  /* Los personajes son dinámicos: la lista sale del proyecto, no del catálogo.
     El nombre de cada uno se repite en los 4 idiomas porque lo que se traduce
     es «mí mismo», no el nombre que eligió el usuario. */
  if (kind === 'sprites') {
    const self = { id: 'self', name: {} };
    ['es', 'en', 'pt', 'fr'].forEach(l => { self.name[l] = UI[l].cloneSelf; });
    return [self].concat(sprites.map(s => {
      const name = {};
      ['es', 'en', 'pt', 'fr'].forEach(l => { name[l] = s.name; });
      return { id: s.id, name: name };
    }));
  }
  return kind === 'melodies' ? MELODY_LIB : (kind === 'keys' ? KEY_LIB : SOUND_LIB);
}

/* Un proyecto viejo guarda el nombre escrito a mano («espacio», «arriba»):
   se compara por su forma normalizada para que el desplegable muestre la
   tecla que de verdad escucha el guion. */
function pickMatch(kind, id, cur) {
  if (kind === 'keys') return normKeyName(id) === normKeyName(cur);
  return id === cur;
}

function pickLabel(kind, id) {
  const item = pickList(kind).find(x => pickMatch(kind, x.id, id));
  if (item) return item.name[lang] || item.name.es;
  if (kind === 'keys') return UI[lang].keyMissing || String(id);
  return (kind === 'sprites' ? UI[lang].spriteMissing : UI[lang].soundMissing) || String(id);
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
  /* La versión no se traduce: es la misma cadena que nombra la caché de la
     PWA, así quien reporte un problema puede decir qué copia está viendo. */
  const aboutVer = $('#aboutVersionValue');
  if (aboutVer) aboutVer.textContent = APP_VERSION;
  const footerVer = $('#footerVersion');
  if (footerVer) footerVer.textContent = 'ScrachMo ' + APP_VERSION;
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
  if (hint) hint.textContent = stageHintText(t);

  updateHUD();
  updateStatus();
  applyCollapsed();
  applyCodeZoom();
  applyStageZoom();
  updateResetButton();
  updateHistoryButtons();
  updateProjectName();
  renderExamples();
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

/* Dónde va a caer un bloque. Si el puntero está sobre el hueco, ahí; y si está
   sobre un bloque en C —la cabecera, el pie o la barra «si no»—, en el hueco de
   adentro. Sin esto había que apuntar al hueco de 26 px: soltar sobre el
   «por siempre» dejaba el bloque afuera, que es justo lo que uno hace. */
function dropSlotAt(el) {
  if (!el || !el.closest) return null;
  const overElse = el.closest('.c-else');
  if (overElse || el.closest('.c-head') || el.closest('.c-foot')) {
    const item = el.closest('.stack-item.c-item');
    if (item) {
      const want = overElse ? 'elseBody' : 'body';
      const slot = item.querySelector(':scope > .c-slot[data-slot="' + want + '"]');
      if (slot) return slot;
    }
  }
  return el.closest('.c-slot');
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
    const slot = dropSlotAt(el);
    /* Los huecos de la paleta son vistas previas: no cuentan como destino. */
    if (slot && slot.closest('#codeList')) container = slot;
    else if (el.closest('#codeList') || el.closest('.scratch-workspace')) container = $('#codeList');
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
  const slot = dropSlotAt(el);
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
    /* Cuántas unidades del mundo vale un píxel de pantalla. El zoom cuenta:
       el mundo se dibuja escalado adentro de la caja. */
    perX: worldW / (rect.width * (stageZoom || 1)),
    perY: worldH / (rect.height * (stageZoom || 1)),
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
  /* Un píxel de pantalla vale `perX` unidades. Se calcula al empezar porque el
     zoom agranda el mundo dentro de la caja: sin dividir por él, con zoom 150%
     el personaje se escapaba de la punta del dedo. */
  const dx = (e.clientX - spriteDrag.startX) * spriteDrag.perX;
  const dy = (e.clientY - spriteDrag.startY) * spriteDrag.perY;
  if (Math.abs(e.clientX - spriteDrag.startX) > 3 || Math.abs(e.clientY - spriteDrag.startY) > 3) spriteDrag.moved = true;
  s.x = clamp(spriteDrag.x + dx, worldLeft(), worldRight());
  s.y = clamp(spriteDrag.y - dy, worldBottom(), worldTop());
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

/* ---------------- tamaño del mundo (asas del escenario) ----------------
   El asa de abajo cambia el alto, la de la derecha el ancho y la esquina las
   dos. El mundo crece hacia la derecha y hacia abajo, así que lo que ya estaba
   puesto no se mueve ni un píxel. */
let stageResize = null;

function startStageResize(e, mode) {
  if (document.body.classList.contains('game-mode')) return;
  e.preventDefault();
  stageResize = {
    mode: mode,
    pointerId: e.pointerId,
    lastX: e.clientX,
    lastY: e.clientY,
    el: e.currentTarget
  };
  try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { }
  e.currentTarget.classList.add('dragging');
}

function moveStageResize(e) {
  if (!stageResize || e.pointerId !== stageResize.pointerId) return;
  e.preventDefault();
  const d = stageResize;
  const rect = $('#stage').getBoundingClientRect();
  /* La escala se recalcula en cada movimiento con la caja ACTUAL: al agrandar,
     la caja también cambia, y con una escala fija el asa se escapaba del dedo
     (a los pocos píxeles crecía el doble de lo que pedía el gesto). */
  if (d.mode !== 'y' && rect.width > 0) {
    worldW = clamp(worldW + (e.clientX - d.lastX) * (worldW / rect.width), WORLD_MIN_W, WORLD_MAX_W);
  }
  if (d.mode !== 'x' && rect.height > 0) {
    worldH = clamp(worldH + (e.clientY - d.lastY) * (worldH / rect.height), WORLD_MIN_H, WORLD_MAX_H);
  }
  d.lastX = e.clientX;
  d.lastY = e.clientY;
  applyWorldSize();
  sprites.concat(clones).forEach(clampToWorld);
  renderSprites();
}

function endStageResize(e) {
  if (!stageResize) return;
  const d = stageResize;
  stageResize = null;
  d.el.classList.remove('dragging');
  try { d.el.releasePointerCapture(d.pointerId); } catch (err) { }
  saveProject();
}

/* Teclado: el asa enfoca y las flechas agrandan de a 60 unidades. Sin esto,
   agrandar el escenario era imposible sin ratón. */
function keyStageResize(e, mode) {
  const paso = e.shiftKey ? 240 : 60;
  let dw = 0;
  let dh = 0;
  if (e.key === 'ArrowDown' && mode !== 'x') dh = paso;
  else if (e.key === 'ArrowUp' && mode !== 'x') dh = -paso;
  else if (e.key === 'ArrowRight' && mode !== 'y') dw = paso;
  else if (e.key === 'ArrowLeft' && mode !== 'y') dw = -paso;
  else return;
  e.preventDefault();
  resizeWorldBy(dw, dh);
}

function resizeWorldBy(dw, dh) {
  const w0 = worldW;
  const h0 = worldH;
  worldW = clamp(worldW + dw, WORLD_MIN_W, WORLD_MAX_W);
  worldH = clamp(worldH + dh, WORLD_MIN_H, WORLD_MAX_H);
  if (worldW === w0 && worldH === h0) return;
  applyWorldSize();
  sprites.concat(clones).forEach(clampToWorld);
  renderSprites();
  saveProject();
}

/* Vuelve al tamaño de fábrica (480x360). Los personajes que habían quedado en
   el espacio nuevo se recortan al borde: si no, quedarían fuera de la vista
   pero seguirían contando para los choques y para «tocar el borde». */
function resetWorldSize() {
  if (worldW === WORLD_W0 && worldH === WORLD_H0) return;
  worldW = WORLD_W0;
  worldH = WORLD_H0;
  applyWorldSize();
  sprites.concat(clones).forEach(clampToWorld);
  renderSprites();
  renderProps();
  saveProject();
  toast(UI[lang].stageSizeResetDone);
}

/* ---------------- alto del área de código ----------------
   Es una preferencia del dispositivo, no del proyecto: va a localStorage y
   nunca al guardado, así que el mismo proyecto se ve distinto en el celular
   y en la compu sin ensuciar el archivo. Con 0 se usa el alto de fábrica. */
const CODE_H_KEY = 'scrachmo_code_h';
const CODE_H_MIN = 140;
let codeH = 0;
let codeResize = null;

function codeMaxH() {
  /* La página scrollea, así que el tope no hace falta para que entre: es sólo
     para que el panel no se vuelva una columna infinita. En una ventana chica
     igual deja crecer al doble del alto de fábrica. */
  return Math.min(1400, Math.max(320, window.innerHeight - 120));
}

function applyCodeHeight() {
  /* Se recorta al tope de la ventana actual sin perder el valor guardado: al
     volver a agrandar la ventana, el alto elegido reaparece. */
  if (codeH > 0) document.body.style.setProperty('--code-h', Math.round(clamp(codeH, CODE_H_MIN, codeMaxH())) + 'px');
  else document.body.style.removeProperty('--code-h');
}

function setCodeHeight(px) {
  codeH = clamp(Math.round(px), CODE_H_MIN, codeMaxH());
  applyCodeHeight();
  try { localStorage.setItem(CODE_H_KEY, String(codeH)); } catch (e) { }
}

function loadCodeHeight() {
  try {
    const v = parseInt(localStorage.getItem(CODE_H_KEY), 10);
    if (v > 0) { codeH = clamp(v, CODE_H_MIN, codeMaxH()); applyCodeHeight(); }
  } catch (e) { }
}

function resetCodeHeight() {
  if (!codeH) return;
  codeH = 0;
  applyCodeHeight();
  try { localStorage.removeItem(CODE_H_KEY); } catch (e) { }
}

function startCodeResize(e) {
  if (e.button !== undefined && e.button !== 0) return;
  e.preventDefault();
  const box = $('.scratch-workspace');
  codeResize = {
    pointerId: e.pointerId,
    startY: e.clientY,
    startH: box ? box.getBoundingClientRect().height : codeH,
    el: e.currentTarget
  };
  try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { }
  e.currentTarget.classList.add('dragging');
}

function moveCodeResize(e) {
  if (!codeResize || e.pointerId !== codeResize.pointerId) return;
  e.preventDefault();
  setCodeHeight(codeResize.startH + (e.clientY - codeResize.startY));
}

function endCodeResize(e) {
  if (!codeResize) return;
  const d = codeResize;
  codeResize = null;
  d.el.classList.remove('dragging');
  try { d.el.releasePointerCapture(d.pointerId); } catch (err) { }
}

/* Teclado: el asa enfoca y las flechas cambian el alto de a 40 px. */
function keyCodeResize(e) {
  const paso = e.shiftKey ? 120 : 40;
  const box = $('.scratch-workspace');
  const actual = box ? box.getBoundingClientRect().height : 0;
  if (e.key === 'ArrowDown') setCodeHeight((codeH || actual) + paso);
  else if (e.key === 'ArrowUp') setCodeHeight((codeH || actual) - paso);
  else if (e.key === 'Home' || e.key === 'Escape') resetCodeHeight();
  else return;
  e.preventDefault();
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
   El mundo mide 480x360 unidades de fábrica (se puede agrandar) y cada
   personaje se aproxima con un círculo de radio fijo escalado por su tamaño.
   No es pixel-perfect como Scratch, pero alcanza para rebotar y detectar
   choques sin medir el DOM en cada paso de la ejecución (que sería caro y
   frágil). */
const SPRITE_RADIUS = 26;

function spriteRadius(s) {
  const size = Math.max(10, Math.min(300, Number(s.size) || 100));
  return SPRITE_RADIUS * (size / 100);
}

function touchingEdge(s) {
  if (!s) return false;
  const r = spriteRadius(s);
  return s.x <= worldLeft() + r || s.x >= worldRight() - r ||
    s.y <= worldBottom() + r || s.y >= worldTop() - r;
}

function touchingOther(s) {
  if (!s || !s.visible) return false;
  const r = spriteRadius(s);
  const all = sprites.concat(clones);
  for (let i = 0; i < all.length; i++) {
    const o = all[i];
    if (o === s || !o.visible || o.dead) continue;
    const dx = o.x - s.x;
    const dy = o.y - s.y;
    const rr = r + spriteRadius(o);
    if (dx * dx + dy * dy <= rr * rr) return true;
  }
  return false;
}

/* Choque contra UN personaje concreto: cuenta el original (o.id) y sus clones
   (o.srcId). Devuelve el clon tocado o null, así «si toca a» y «borrar el clon
   que toco» comparten la misma geometría y no se pueden desincronizar. */
function touchedCloneOf(s, key) {
  if (!s) return null;
  const k = String(key == null ? '' : key);
  if (!k || k === 'self') return null;
  const r = spriteRadius(s);
  for (let i = 0; i < clones.length; i++) {
    const o = clones[i];
    if (!o || o === s || o.dead || !o.visible) continue;
    if (o.srcId !== k && o.id !== k) continue;
    const dx = o.x - s.x;
    const dy = o.y - s.y;
    const rr = r + spriteRadius(o);
    if (dx * dx + dy * dy <= rr * rr) return o;
  }
  return null;
}

function touchingSprite(s, key) {
  if (!s || !s.visible) return false;
  const k = String(key == null ? '' : key);
  /* «mí mismo» en un condicional no tiene sentido (un personaje no se toca a
     sí mismo), así que se lee como «cualquier otro», igual que if_touch. */
  if (!k || k === 'self') return touchingOther(s);
  const r = spriteRadius(s);
  const all = sprites.concat(clones);
  for (let i = 0; i < all.length; i++) {
    const o = all[i];
    if (!o || o === s || !o.visible || o.dead) continue;
    if (o.id !== k && o.srcId !== k) continue;
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
  if (s.x <= worldLeft() + r) { s.x = worldLeft() + r; hitX = true; }
  else if (s.x >= worldRight() - r) { s.x = worldRight() - r; hitX = true; }
  if (s.y <= worldBottom() + r) { s.y = worldBottom() + r; hitY = true; }
  else if (s.y >= worldTop() - r) { s.y = worldTop() - r; hitY = true; }
  if (!hitX && !hitY) return false;
  if (hitX && hitY) s.dir = normDir(s.dir + 180);
  else if (hitX) s.dir = normDir(-s.dir);
  else s.dir = normDir(180 - s.dir);
  return true;
}

/* Bloques en C que se resuelven con una condición. Esta lista y execNode()
   tienen que coincidir SIEMPRE: un C-block que no esté acá cae en execBlock(),
   que no conoce su body, y su contenido se ignora en silencio. Así estuvieron
   «si toca el borde» y «si toca a otro personaje» desde que se agregaron. */
const COND_TYPES = {
  if_tilt: 1, if_score: 1, if_edge: 1, if_touch: 1, if_touch_sprite: 1, if_cond: 1, if_else: 1
};

function checkNodeCondition(node, sprite) {
  if (node.type === 'if_tilt') return Math.abs(window.lastTilt || 0) > 15;
  if (node.type === 'if_score') return score > num(nodeVal(node, sprite), 5);
  if (node.type === 'if_edge') return touchingEdge(sprite);
  if (node.type === 'if_touch') return touchingOther(sprite);
  if (node.type === 'if_touch_sprite') return touchingSprite(sprite, nodeVal(node, sprite));
  return evalCond(nodeVal(node, sprite));
}

async function execBlock(node, sprite) {
  /* Con reporteros la casilla deja de ser texto fijo: nodeVal() sustituye
     cada hueco por el valor calculado en el momento de ejecutar. */
  const v = nodeVal(node, sprite);
  switch (node.type) {
    case 'when_flag': case 'when_tap': case 'when_key': case 'when_score':
    case 'when_shake': case 'when_msg': case 'when_clone':
      return;
    case 'create_clone': {
      /* `self` clona al que ejecuta (que puede ser otro clon); si apunta a un
         personaje, se clona ese. Un id que ya no existe no hace nada, igual
         que en Scratch, en vez de clonar al azar. */
      const key = String(v == null ? 'self' : v);
      const src = (key === 'self' || key === '') ? sprite : getSprite(key);
      if (src) spawnClone(src);
      await sleep(20);
      return;
    }
    case 'delete_clone':
      deleteClone(sprite);
      return;
    case 'delete_touched_clone': {
      /* Un disparo borra justo lo que impacta, no todos los clones del
         personaje: borrar la tanda entera vaciaba la pantalla de golpe. */
      const hit = touchedCloneOf(sprite, v);
      if (hit) deleteClone(hit);
      await sleep(20);
      return;
    }
    case 'move': {
      const steps = num(v, 10);
      const rad = sprite.dir * Math.PI / 180;
      sprite.x = clamp(sprite.x + steps * Math.sin(rad), worldLeft(), worldRight());
      sprite.y = clamp(sprite.y + steps * Math.cos(rad), worldBottom(), worldTop());
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
      sprite.x = clamp(num(xy[0], 0), worldLeft(), worldRight());
      sprite.y = clamp(num(xy[1], 0), worldBottom(), worldTop());
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
      saySprite(sprite, String(v == null ? '' : v), node.zoom);
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
      /* No hay red: el aviso viaja por localStorage a otras pestañas del mismo
         origen. El evento storage no llega a la propia pestaña, así que acá se
         reenvía dentro del proyecto, con tope para cortar cadenas. */
      store.set('scrachmo_msg', JSON.stringify({ t: Date.now() }));
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
  const add = sprite => {
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
  };
  sprites.forEach(add);
  clones.forEach(add);
  /* El sombrero «al comenzar como clon» es sólo para los clones, y un clon no
     arranca con la bandera ni con los demás sombreros: si no, cada clon haría
     además todo lo que hace el original. */
  return out.filter(sc => isClone(sc.sprite) ? sc.event === 'when_clone' : sc.event !== 'when_clone');
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
  if (map[s]) return map[s];
  /* La barra espaciadora se guarda como ' ' y `trim()` la deja vacía; un
     valor vacío también vale espacio, que es el defecto de siempre. */
  return s || ' ';
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
  sayZooms.clear();
  sayTimers.forEach(t => clearTimeout(t));
  sayTimers.clear();
  const layer = $('#spritesLayer');
  if (layer) layer.querySelectorAll('.sprite-bubble').forEach(b => {
    b.textContent = '';
    b.style.removeProperty('--bz');
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
  clearClones();
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
  const alive = () => isRunning && !(ctx && ctx.cancelled) && !(sprite && sprite.dead);

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
    if (COND_TYPES[node.type]) {
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
    /* Un clon borrado con «borrar este clon» tiene que parar en seco: si no,
       seguiría moviéndose invisible hasta terminar el guion. */
    if (sprite && sprite.dead) return;
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
  const lista = scriptsFor('when_flag');
  /* La bandera recorre TODOS los personajes, no sólo el que está en edición:
     que el seleccionado no tenga bloques no impide arrancar. Si hay bloques
     pero ninguno cuelga de «al presionar bandera» (por ejemplo, todo está
     bajo «al presionar una tecla»), el botón parecía no hacer nada: este
     aviso dice exactamente qué falta. */
  if (!lista.length) {
    if (collectScripts().length) toast(UI[lang].noFlagScripts);
    return;
  }
  runScripts(lista);
}

function stopCode() {
  const wasRunning = runActive;
  runThreads.forEach(t => { t.cancelled = true; });
  finishRun();
  runThreads.clear();
  /* Detener es también silencio: si no, una música en bucle seguiría sonando
     para siempre porque nadie más la corta. */
  stopAllSounds();
  /* Detener borra los clones, como en Scratch. Terminar una corrida, en
     cambio, los deja: el estado final es el que queda en pantalla. */
  clearClones();
  /* Un «crear variable» puede haber abierto un diálogo en medio de un guion:
     al detener, lo cerramos para que el hilo no quede esperando para siempre. */
  if (wasRunning && askResolver) closeAsk(null);
  /* La inclinación repite mientras el teléfono siga inclinado: si no se corta
     acá, el personaje seguiría caminando con el juego detenido. */
  stopTiltRepeat();
  tiltPaint([]);
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

/* ================= exportación a Scratch 3 (.sb3) =================
   Un .sb3 es un ZIP con project.json y un archivo por recurso, nombrado con
   el MD5 de su contenido. Se arma todo acá adentro, sin librerías: MD5, ZIP
   sin comprimir, disfraces en PNG y sonidos en WAV sintetizados con las
   mismas recetas del motor.

   Lo que no tiene equivalente en Scratch (mensajes locales, puntaje, agitar el
   celu, vibrar, inclinación) se deja afuera y queda anotado en un comentario
   dentro del proyecto exportado, para que se vea al abrirlo en Scratch y no
   se pierda en un aviso que desaparece. */

/* ---------- MD5 (para nombrar los recursos, como exige Scratch) ---------- */
function md5hex(bytes) {
  const buf = Array.from(bytes);
  const bitLen = buf.length * 8;
  buf.push(0x80);
  while (buf.length % 64 !== 56) buf.push(0);
  const lo = bitLen >>> 0;
  const hi = Math.floor(bitLen / 4294967296) >>> 0;
  for (let i = 0; i < 4; i++) buf.push((lo >>> (8 * i)) & 255);
  for (let i = 0; i < 4; i++) buf.push((hi >>> (8 * i)) & 255);

  const K = [];
  for (let i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) >>> 0;
  const S = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];

  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
  for (let off = 0; off < buf.length; off += 64) {
    const M = [];
    for (let i = 0; i < 16; i++) {
      M[i] = (buf[off + i * 4] | (buf[off + i * 4 + 1] << 8) |
        (buf[off + i * 4 + 2] << 16) | (buf[off + i * 4 + 3] << 24)) >>> 0;
    }
    let A = a0, B = b0, C = c0, D = d0;
    for (let i = 0; i < 64; i++) {
      let F, g;
      if (i < 16) { F = (B & C) | (~B & D); g = i; }
      else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
      else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; }
      else { F = C ^ (B | ~D); g = (7 * i) % 16; }
      F = (F + A + K[i] + M[g]) >>> 0;
      A = D; D = C; C = B;
      const sh = S[(i >> 4) * 4 + (i % 4)];
      B = (B + (((F << sh) | (F >>> (32 - sh))) >>> 0)) >>> 0;
    }
    a0 = (a0 + A) >>> 0; b0 = (b0 + B) >>> 0; c0 = (c0 + C) >>> 0; d0 = (d0 + D) >>> 0;
  }
  const hx = n => {
    let s = '';
    for (let i = 0; i < 4; i++) s += ((n >>> (8 * i)) & 255).toString(16).padStart(2, '0');
    return s;
  };
  return hx(a0) + hx(b0) + hx(c0) + hx(d0);
}

/* ---------- CRC32 + ZIP sin comprimir ---------- */
let crcTable = null;
function crc32(bytes) {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      crcTable[n] = c >>> 0;
    }
  }
  let c = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) c = crcTable[(c ^ bytes[i]) & 255] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function concatBytes(list) {
  let total = 0;
  list.forEach(b => { total += b.length; });
  const out = new Uint8Array(total);
  let at = 0;
  list.forEach(b => { out.set(b, at); at += b.length; });
  return out;
}

/* ZIP con método 0 (guardado): no comprime, pero es lo que necesita Scratch
   y evita depender de CompressionStream. */
function zipStore(files) {
  const enc = new TextEncoder();
  const parts = [];
  const central = [];
  let offset = 0;
  files.forEach(f => {
    const name = enc.encode(f.name);
    const crc = crc32(f.bytes);
    const size = f.bytes.length;
    const local = new Uint8Array(30 + name.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0, true);
    lv.setUint16(8, 0, true);
    lv.setUint16(10, 0, true);
    lv.setUint16(12, 0x21, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true);
    lv.setUint32(22, size, true);
    lv.setUint16(26, name.length, true);
    lv.setUint16(28, 0, true);
    local.set(name, 30);
    parts.push(local, f.bytes);

    const cen = new Uint8Array(46 + name.length);
    const cv = new DataView(cen.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0x21, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, name.length, true);
    cv.setUint32(42, offset, true);
    cen.set(name, 46);
    central.push(cen);
    offset += local.length + size;
  });
  const cdSize = central.reduce((a, c) => a + c.length, 0);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, cdSize, true);
  ev.setUint32(16, offset, true);
  return concatBytes(parts.concat(central, [eocd]));
}

/* ---------- recursos ---------- */
function dataUrlBytes(url) {
  const s = String(url || '');
  const comma = s.indexOf(',');
  if (comma < 0) return null;
  const meta = s.slice(0, comma);
  const body = s.slice(comma + 1);
  if (/;base64$/i.test(meta)) {
    const bin = atob(body);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  return new TextEncoder().encode(decodeURIComponent(body));
}

function loadImageUrl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('imagen ilegible'));
    img.src = url;
  });
}

function canvasToPng(canvas) {
  /* toBlob no resuelve bajo tiempo virtual en las pruebas: toDataURL sí. */
  const bytes = dataUrlBytes(canvas.toDataURL('image/png'));
  return bytes || new Uint8Array(0);
}

function emojiPng(ch, px) {
  const size = px || 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const g = canvas.getContext('2d');
  g.clearRect(0, 0, size, size);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = Math.round(size * 0.78) + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
  g.fillText(String(ch || '🐱'), size / 2, size / 2 + size * 0.04);
  return canvasToPng(canvas);
}

async function imagePng(url, maxPx) {
  const img = await loadImageUrl(url);
  const max = Math.max(img.width || 1, img.height || 1);
  const scale = Math.min(1, (maxPx || 480) / max);
  const w = Math.max(1, Math.round((img.width || 1) * scale));
  const h = Math.max(1, Math.round((img.height || 1) * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext('2d');
  g.clearRect(0, 0, w, h);
  g.drawImage(img, 0, 0, w, h);
  return { bytes: canvasToPng(canvas), width: w, height: h };
}

function backdropPng(colors) {
  const canvas = document.createElement('canvas');
  canvas.width = 480;
  canvas.height = 360;
  const g = canvas.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 360);
  grad.addColorStop(0, colors[0]);
  grad.addColorStop(1, colors[1]);
  g.fillStyle = grad;
  g.fillRect(0, 0, 480, 360);
  return canvasToPng(canvas);
}

/* Ruido determinista: el mismo proyecto debe dar siempre el mismo archivo
   (mismo MD5), si no cada exportación sería distinta. */
function noiseAt(i) {
  let t = (i * 1664525 + 1013904223) >>> 0;
  t ^= t >>> 15;
  t = Math.imul(t, 2246822507) >>> 0;
  t ^= t >>> 13;
  return (t / 4294967296) * 2 - 1;
}

/* WAV 16 bits mono a 22050 Hz con las mismas recetas que suenan en la app. */
function wavFromSteps(steps, rate) {
  const hz = rate || 22050;
  const samples = [];
  let noiseSeed = 0;
  (steps || []).forEach(step => {
    const dur = Math.max(0.02, num(step[1], 0.12));
    const n = Math.max(1, Math.round(dur * hz));
    const isNoise = step[0] === 'noise';
    const base = isNoise ? 0 : num(step[0], 0);
    const sweep = num(step[3], base);
    const type = step[2] || 'sine';
    for (let i = 0; i < n; i++) {
      const t = i / hz;
      const attack = Math.min(1, t / 0.012);
      const decay = Math.max(0, 1 - t / dur);
      let v = 0;
      if (base > 0) {
        const f = base + (sweep - base) * (t / dur);
        const ph = 2 * Math.PI * f * t;
        if (type === 'square') v = Math.sin(ph) >= 0 ? 1 : -1;
        else if (type === 'triangle') v = 2 * Math.abs(2 * ((f * t) % 1) - 1) - 1;
        else v = Math.sin(ph);
      } else if (isNoise) {
        v = noiseAt(noiseSeed++) * 0.8;
      }
      samples.push(Math.max(-1, Math.min(1, v * attack * decay * 0.34)));
    }
  });
  const dataLen = samples.length * 2;
  const out = new Uint8Array(44 + dataLen);
  const dv = new DataView(out.buffer);
  const ascii = (at, s) => { for (let i = 0; i < s.length; i++) out[at + i] = s.charCodeAt(i); };
  ascii(0, 'RIFF');
  dv.setUint32(4, 36 + dataLen, true);
  ascii(8, 'WAVE');
  ascii(12, 'fmt ');
  dv.setUint32(16, 16, true);
  dv.setUint16(20, 1, true);
  dv.setUint16(22, 1, true);
  dv.setUint32(24, hz, true);
  dv.setUint32(28, hz * 2, true);
  dv.setUint16(32, 2, true);
  dv.setUint16(34, 16, true);
  ascii(36, 'data');
  dv.setUint32(40, dataLen, true);
  samples.forEach((s, i) => {
    dv.setInt16(44 + i * 2, Math.round(s * 32767), true);
  });
  return out;
}

/* ---------- bloques ---------- */
const SB3_HATS = {
  when_flag: 'event_whenflagclicked',
  when_tap: 'event_whenstageclicked',
  when_clone: 'control_start_as_clone'
};

/* Bloques sin equivalente en Scratch. Se listan para poder avisar. */
const SB3_NO_EQUIV = {
  when_shake: 'agitar el celular',
  when_score: 'sombrero de puntaje',
  if_tilt: 'inclinación',
  vibrate: 'vibrar',
  create_var: 'crear variable',
  show_vars: 'mostrar variables',
  show2: 'mostrar amigo',
  hide2: 'esconder amigo',
  move2: 'mover amigo',
  sino: 'sino suelto',
  op_calc: 'calcular',
  /* Scratch no puede borrar clones de otro personaje: sólo el propio. */
  delete_touched_clone: 'borrar el clon que toco'
};

function sb3KeyName(val) {
  const k = normKeyName(val || 'espacio');
  if (k === ' ') return 'space';
  if (k === 'arrowup') return 'up arrow';
  if (k === 'arrowdown') return 'down arrow';
  if (k === 'arrowleft') return 'left arrow';
  if (k === 'arrowright') return 'right arrow';
  if (k === 'enter') return 'enter';
  return k;
}

function sb3SlotCount(def) {
  return ((def.n[lang] || def.n.es).match(/\{[vxy]\}/g) || []).length;
}

/* Convierte el código de UN personaje. Devuelve el mapa de bloques, los
   comentarios, los recursos usados y la lista de lo que quedó afuera. */
function sb3SpriteBlocks(sprite, index) {
  const blocks = {};
  const dropped = [];
  const usedSounds = new Set();
  const usedVars = new Set();
  let seq = 0;
  let scriptY = 0;

  const newId = () => 'b' + index + '_' + (++seq);

  function mk(opcode, parentId, extra) {
    const id = newId();
    const b = {
      opcode: opcode, next: null, parent: parentId || null,
      inputs: {}, fields: {}, shadow: false, topLevel: false
    };
    if (extra) {
      if (extra.inputs) Object.assign(b.inputs, extra.inputs);
      if (extra.fields) Object.assign(b.fields, extra.fields);
      if (extra.shadow) b.shadow = true;
    }
    blocks[id] = b;
    return id;
  }

  function topLevel(id) {
    blocks[id].topLevel = true;
    blocks[id].parent = null;
    blocks[id].x = 48;
    blocks[id].y = 48 + scriptY * 180;
    scriptY++;
  }

  function note(node) {
    const def = BYID[node.type];
    const label = def ? (def.n[lang] || def.n.es).replace(/\{[vxy]\}/g, '').trim() : node.type;
    dropped.push(label + ' (' + node.type + ')');
  }

  function varBlock(name, parentId) {
    usedVars.add(name);
    return mk('data_variable', parentId, { fields: { VARIABLE: [name, sb3VarId(name)] } });
  }

  function slotIn(node, i, shadowType, hostId) {
    const def = BYID[node.type] || { n: { es: '' }, def: '' };
    const count = Math.max(sb3SlotCount(def), i + 1);
    const vals = blockValues(node, def, count);
    const raw = vals[i] !== undefined ? vals[i] : '';
    const shadow = [shadowType || 10, String(raw)];
    const rep = node.reps && node.reps[i];
    if (!rep) return [1, shadow];
    const rid = reporterIn(rep, hostId);
    return rid ? [3, rid, shadow] : [1, shadow];
  }

  function binop(opcode, rep, hostId, a, b) {
    const id = mk(opcode, hostId);
    blocks[id].inputs[a] = slotIn(rep, 0, 4, id);
    blocks[id].inputs[b] = slotIn(rep, 1, 4, id);
    return id;
  }

  function reporterIn(rep, hostId) {
    switch (rep.type) {
      case 'rep_x': return mk('motion_xposition', hostId);
      case 'rep_y': return mk('motion_yposition', hostId);
      case 'rep_timer': return mk('sensing_timer', hostId);
      case 'rep_score': return varBlock('puntaje', hostId);
      case 'rep_var': {
        const name = String(rep.val === undefined ? '' : rep.val).trim();
        return varBlock(name || 'variable', hostId);
      }
      case 'rep_random': {
        const id = mk('operator_random', hostId);
        blocks[id].inputs.FROM = slotIn(rep, 0, 4, id);
        blocks[id].inputs.TO = slotIn(rep, 1, 4, id);
        return id;
      }
      case 'rep_add': return binop('operator_add', rep, hostId, 'NUM1', 'NUM2');
      case 'rep_sub': return binop('operator_subtract', rep, hostId, 'NUM1', 'NUM2');
      case 'rep_mul': return binop('operator_multiply', rep, hostId, 'NUM1', 'NUM2');
      case 'rep_div': return binop('operator_divide', rep, hostId, 'NUM1', 'NUM2');
      case 'rep_gt': return binop('operator_gt', rep, hostId, 'OPERAND1', 'OPERAND2');
      default: return null;
    }
  }

  function menu(opcode, field, value, hostId) {
    const id = newId();
    const fields = {};
    fields[field] = [value, null];
    blocks[id] = {
      opcode: opcode, next: null, parent: hostId || null, inputs: {},
      fields: fields, shadow: true, topLevel: false
    };
    return [1, id];
  }

  function soundNameFor(id) {
    const s = SOUNDMAP[id];
    return s ? (s.name[lang] || s.name.es) : '';
  }

  function melodyNameFor(id) {
    const m = MELODYMAP[id];
    return m ? (m.name[lang] || m.name.es) : '';
  }

  /* Condición de «si»: reportero si lo hay, o una comparación escrita a mano
     (lo que acepta evalCond). Si no se entiende, no se inventa nada. */
  function conditionIn(node, hostId) {
    const rep = node.reps && node.reps[0];
    if (rep) {
      const rid = reporterIn(rep, hostId);
      if (rid) return [2, rid];
    }
    const text = String(node.val === undefined ? '' : node.val).trim();
    const m = /^(.+?)\s*(>=|<=|>|<|=)\s*(.+)$/.exec(text);
    if (!m) return null;
    const opcode = (m[2] === '>') ? 'operator_gt' : (m[2] === '<') ? 'operator_lt' : 'operator_equals';
    const id = mk(opcode, hostId);
    const operand = v => {
      const n = Number(v);
      return Number.isFinite(n) ? [1, [4, String(n)]] : [1, [10, String(v)]];
    };
    blocks[id].inputs.OPERAND1 = operand(m[1]);
    blocks[id].inputs.OPERAND2 = operand(m[3]);
    return [2, id];
  }

  function touching(target, hostId) {
    const id = mk('sensing_touchingobject', hostId);
    blocks[id].inputs.TOUCHINGOBJECTMENU =
      menu('sensing_touchingobjectmenu', 'TOUCHINGOBJECTMENU', target, id);
    return id;
  }

  function statement(node, parentId) {
    const t = node.type;
    const id = (opcode, inputs) => {
      const bid = mk(opcode, parentId);
      if (inputs) Object.keys(inputs).forEach(k => { blocks[bid].inputs[k] = inputs[k](bid); });
      return bid;
    };
    switch (t) {
      case 'move': return id('motion_movesteps', { STEPS: b => slotIn(node, 0, 4, b) });
      case 'turn': return id('motion_turnright', { DEGREES: b => slotIn(node, 0, 4, b) });
      case 'point_dir': return id('motion_pointindirection', { DIRECTION: b => slotIn(node, 0, 8, b) });
      case 'go_xy': return id('motion_gotoxy', {
        X: b => slotIn(node, 0, 4, b),
        Y: b => slotIn(node, 1, 4, b)
      });
      case 'bounce': return mk('motion_ifonedgebounce', parentId);
      case 'go_random': return id('motion_gotoxy', {
        X: b => {
          const r = mk('operator_random', b);
          blocks[r].inputs.FROM = [1, [4, '-210']];
          blocks[r].inputs.TO = [1, [4, '210']];
          return [3, r, [4, '0']];
        },
        Y: b => {
          const r = mk('operator_random', b);
          blocks[r].inputs.FROM = [1, [4, '-150']];
          blocks[r].inputs.TO = [1, [4, '150']];
          return [3, r, [4, '0']];
        }
      });
      case 'say': return id('looks_say', { MESSAGE: b => slotIn(node, 0, 10, b) });
      case 'size': return id('looks_setsizeto', { SIZE: b => slotIn(node, 0, 4, b) });
      case 'hide': return mk('looks_hide', parentId);
      case 'show': return mk('looks_show', parentId);
      case 'change_bg': return mk('looks_nextbackdrop', parentId);
      case 'next_costume': return mk('looks_nextcostume', parentId);
      case 'switch_costume': {
        const list = sprite.costumes || [];
        const idx = findCostumeIndex(sprite, node.val);
        const name = (list[idx] && list[idx].name) || 'disfraz1';
        return id('looks_switchcostumeto', {
          COSTUME: b => menu('looks_costume', 'COSTUME', name, b)
        });
      }
      case 'meow':
      case 'pop': {
        const name = soundNameFor(t);
        usedSounds.add(t);
        return id('sound_play', { SOUND_MENU: b => menu('sound_sounds_menu', 'SOUND_MENU', name, b) });
      }
      case 'play_sound': {
        const key = String(node.val === undefined ? '' : node.val).trim();
        const name = soundNameFor(key);
        if (!name) return null;
        usedSounds.add(key);
        return id('sound_play', { SOUND_MENU: b => menu('sound_sounds_menu', 'SOUND_MENU', name, b) });
      }
      case 'play_music': {
        const key = String(node.val === undefined ? '' : node.val).trim();
        const name = melodyNameFor(key);
        if (!name) return null;
        usedSounds.add('melody:' + key);
        /* Scratch no repite un sonido solo: suena una vez. */
        return id('sound_playuntildone', { SOUND_MENU: b => menu('sound_sounds_menu', 'SOUND_MENU', name, b) });
      }
      case 'stop_sounds': return mk('sound_stopallsounds', parentId);
      case 'set_volume': return id('sound_setvolumeto', { VOLUME: b => slotIn(node, 0, 4, b) });
      case 'change_volume': return id('sound_changevolumeby', { VOLUME: b => slotIn(node, 0, 4, b) });
      case 'wait': return id('control_wait', { DURATION: b => slotIn(node, 0, 5, b) });
      case 'repeat': {
        const bid = mk('control_repeat', parentId);
        blocks[bid].inputs.TIMES = slotIn(node, 0, 6, bid);
        const sub = buildStack(node.body || [], bid);
        if (sub) blocks[bid].inputs.SUBSTACK = [2, sub];
        return bid;
      }
      case 'forever': {
        const bid = mk('control_forever', parentId);
        const sub = buildStack(node.body || [], bid);
        if (sub) blocks[bid].inputs.SUBSTACK = [2, sub];
        return bid;
      }
      case 'if_edge': {
        const bid = mk('control_if', parentId);
        blocks[bid].inputs.CONDITION = [2, touching('_edge_', bid)];
        const sub = buildStack(node.body || [], bid);
        if (sub) blocks[bid].inputs.SUBSTACK = [2, sub];
        return bid;
      }
      case 'if_touch': {
        const others = sprites.filter(s => s !== sprite);
        if (!others.length) return null;
        const bid = mk('control_if', parentId);
        blocks[bid].inputs.CONDITION = [2, touching(others[0].name, bid)];
        const sub = buildStack(node.body || [], bid);
        if (sub) blocks[bid].inputs.SUBSTACK = [2, sub];
        return bid;
      }
      case 'if_touch_sprite': {
        /* Scratch sí tiene «¿tocando [personaje]?», así que se exporta tal cual.
           Con «mí mismo» cae al primero de los otros, igual que en ejecución. */
        const key = String(nodeVal(node, sprite) || '');
        const target = (key && key !== 'self')
          ? sprites.find(s => s.id === key)
          : sprites.filter(s => s !== sprite)[0];
        if (!target) return null;
        const bid = mk('control_if', parentId);
        blocks[bid].inputs.CONDITION = [2, touching(target.name, bid)];
        const sub = buildStack(node.body || [], bid);
        if (sub) blocks[bid].inputs.SUBSTACK = [2, sub];
        return bid;
      }
      case 'if_score': {
        const bid = mk('control_if', parentId);
        const gt = mk('operator_gt', bid);
        blocks[gt].inputs.OPERAND1 = [3, varBlock('puntaje', gt), [10, '']];
        blocks[gt].inputs.OPERAND2 = slotIn(node, 0, 4, gt);
        blocks[bid].inputs.CONDITION = [2, gt];
        const sub = buildStack(node.body || [], bid);
        if (sub) blocks[bid].inputs.SUBSTACK = [2, sub];
        return bid;
      }
      case 'if_cond': {
        const bid = mk('control_if', parentId);
        const cond = conditionIn(node, bid);
        if (!cond) return null;
        blocks[bid].inputs.CONDITION = cond;
        const sub = buildStack(node.body || [], bid);
        if (sub) blocks[bid].inputs.SUBSTACK = [2, sub];
        return bid;
      }
      case 'if_else': {
        const bid = mk('control_if_else', parentId);
        const cond = conditionIn(node, bid);
        if (!cond) return null;
        blocks[bid].inputs.CONDITION = cond;
        const sub = buildStack(node.body || [], bid);
        if (sub) blocks[bid].inputs.SUBSTACK = [2, sub];
        const sub2 = buildStack(node.elseBody || [], bid);
        if (sub2) blocks[bid].inputs.SUBSTACK2 = [2, sub2];
        return bid;
      }
      case 'timer_reset': return mk('sensing_resettimer', parentId);
      case 'score_add': {
        const bid = mk('data_changevariableby', parentId);
        blocks[bid].fields.VARIABLE = ['puntaje', sb3VarId('puntaje')];
        blocks[bid].inputs.VALUE = slotIn(node, 0, 4, bid);
        usedVars.add('puntaje');
        return bid;
      }
      case 'score_set': {
        const bid = mk('data_setvariableto', parentId);
        blocks[bid].fields.VARIABLE = ['puntaje', sb3VarId('puntaje')];
        blocks[bid].inputs.VALUE = slotIn(node, 0, 4, bid);
        usedVars.add('puntaje');
        return bid;
      }
      case 'score_reset': {
        const bid = mk('data_setvariableto', parentId);
        blocks[bid].fields.VARIABLE = ['puntaje', sb3VarId('puntaje')];
        blocks[bid].inputs.VALUE = [1, [4, '0']];
        usedVars.add('puntaje');
        return bid;
      }
      case 'set_var':
      case 'add_var':
      case 'sub_var': {
        const txt = String(node.val === undefined ? '' : node.val);
        const eq = txt.indexOf('=');
        if (eq < 0) return null;
        const name = txt.slice(0, eq).trim();
        if (!name) return null;
        const raw = txt.slice(eq + 1).trim();
        usedVars.add(name);
        if (t === 'set_var') {
          const bid = mk('data_setvariableto', parentId);
          blocks[bid].fields.VARIABLE = [name, sb3VarId(name)];
          blocks[bid].inputs.VALUE = [1, [10, raw]];
          return bid;
        }
        const bid = mk('data_changevariableby', parentId);
        blocks[bid].fields.VARIABLE = [name, sb3VarId(name)];
        const amount = num(raw, 0);
        blocks[bid].inputs.VALUE = [1, [4, String(t === 'sub_var' ? -amount : amount)]];
        return bid;
      }
      case 'op_random': {
        const parts = String(node.val === undefined ? '1,10' : node.val).split(',');
        usedVars.add('res');
        const bid = mk('data_setvariableto', parentId);
        blocks[bid].fields.VARIABLE = ['res', sb3VarId('res')];
        const r = mk('operator_random', bid);
        blocks[r].inputs.FROM = [1, [4, String(Math.floor(num(parts[0], 1)))]];
        blocks[r].inputs.TO = [1, [4, String(Math.floor(num(parts[1], 10)))]];
        blocks[bid].inputs.VALUE = [3, r, [4, '0']];
        return bid;
      }
      case 'send_msg': {
        const bid = mk('event_broadcast', parentId);
        blocks[bid].inputs.BROADCAST_INPUT = [1, [11, 'mensaje', SB3_MSG_ID]];
        return bid;
      }
      /* Clones: los tres opcodes existen en Scratch, así que se exportan tal
         cual. El menú lleva `_myself_` o el NOMBRE del personaje, no su id. */
      case 'create_clone': {
        const key = String(node.val == null ? 'self' : node.val).trim();
        const other = key === 'self' || key === '' ? null : sprites.find(s => s.id === key);
        const target = other ? other.name : '_myself_';
        return id('control_create_clone_of', {
          CLONE_OPTION: b => menu('control_create_clone_of_menu', 'CLONE_OPTION', target, b)
        });
      }
      case 'delete_clone': return mk('control_delete_this_clone', parentId);
      default: return null;
    }
  }

  function hatBlock(node) {
    if (node.type === 'when_flag') return mk('event_whenflagclicked', null);
    if (node.type === 'when_tap') return mk('event_whenstageclicked', null);
    if (node.type === 'when_clone') return mk('control_start_as_clone', null);
    if (node.type === 'when_key') {
      const bid = mk('event_whenkeypressed', null);
      blocks[bid].fields.KEY_OPTION = [sb3KeyName(node.val), null];
      return bid;
    }
    if (node.type === 'when_msg') {
      const bid = mk('event_whenbroadcastreceived', null);
      blocks[bid].fields.BROADCAST_OPTION = ['mensaje', SB3_MSG_ID];
      return bid;
    }
    return null;
  }

  function buildStack(nodes, parentId) {
    let first = null;
    let prev = null;
    (nodes || []).forEach(node => {
      const id = statement(node, prev || parentId);
      if (!id) { note(node); return; }
      if (prev) {
        blocks[prev].next = id;
        blocks[id].parent = prev;
      } else {
        first = id;
      }
      prev = id;
    });
    return first;
  }

  /* Recorremos el código como lo hace el motor: un sombrero abre un guion y
     lo que sigue le pertenece hasta el próximo sombrero. */
  let prev = null;
  let seenHat = false;
  (sprite.code || []).forEach(node => {
    const def = BYID[node.type];
    if (def && def.hat) {
      seenHat = true;
      prev = hatBlock(node);
      if (prev) topLevel(prev);
      else note(node);
      return;
    }
    const id = statement(node, prev);
    if (!id) { note(node); return; }
    if (prev) {
      blocks[prev].next = id;
      blocks[id].parent = prev;
    } else if (!seenHat) {
      /* Bloques sueltos al principio: el motor los corre con la bandera. */
      const hat = mk('event_whenflagclicked', null);
      topLevel(hat);
      blocks[hat].next = id;
      blocks[id].parent = hat;
    } else {
      /* Quedaron sueltos porque su sombrero no tiene equivalente: flotan. */
      topLevel(id);
    }
    prev = id;
  });

  return { blocks: blocks, dropped: dropped, usedSounds: usedSounds, usedVars: usedVars };
}

/* Ids de variables y del mensaje: estables dentro de un mismo export. */
const SB3_MSG_ID = 'bc_mensaje';
let sb3VarIds = null;
function sb3VarId(name) {
  if (!sb3VarIds) sb3VarIds = new Map();
  if (!sb3VarIds.has(name)) sb3VarIds.set(name, 'var_' + (sb3VarIds.size + 1));
  return sb3VarIds.get(name);
}

/* Arma project.json + los archivos del ZIP. Devuelve también la lista de lo
   que quedó afuera, para poder avisarlo. */
async function sb3Build() {
  sb3VarIds = null;
  const files = [];
  const seen = new Set();
  const dropped = [];
  const allVars = new Map();
  const soundsNeeded = new Set();
  let assets = 0;

  function addAsset(bytes, ext) {
    const md5 = md5hex(bytes);
    const name = md5 + '.' + ext;
    if (!seen.has(name)) { seen.add(name); files.push({ name: name, bytes: bytes }); assets++; }
    return { assetId: md5, md5ext: name, dataFormat: ext };
  }

  /* Fondo del escenario: el degradado propio o la imagen que subió la persona. */
  let backdrop;
  if (stageBgImg) {
    try {
      const png = await imagePng(stageBgImg, 960);
      backdrop = Object.assign({ name: 'fondo', rotationCenterX: 240, rotationCenterY: 180 }, addAsset(png.bytes, 'png'));
    } catch (e) { backdrop = null; }
  }
  if (!backdrop) {
    const pair = BG[clamp(Math.floor(num(stageBg, 0)), 0, BG.length - 1)] || BG[0];
    backdrop = Object.assign({ name: 'fondo', rotationCenterX: 240, rotationCenterY: 180 },
      addAsset(backdropPng(pair), 'png'));
  }

  const targets = [];
  const stageVars = {};

  /* Primero los personajes: así se sabe qué variables y sonidos hacen falta. */
  const spriteTargets = [];
  for (let i = 0; i < sprites.length; i++) {
    const s = sprites[i];
    const built = sb3SpriteBlocks(s, i);
    built.dropped.forEach(d => { if (dropped.indexOf(d) < 0) dropped.push(d); });
    built.usedVars.forEach(v => allVars.set(v, true));
    built.usedSounds.forEach(k => soundsNeeded.add(k));

    const costumes = [];
    const list = (s.costumes && s.costumes.length) ? s.costumes : [{ kind: 'emoji', src: '🐱', name: 'disfraz1' }];
    for (let j = 0; j < list.length; j++) {
      const c = list[j];
      const cname = String(c.name || ('disfraz' + (j + 1)));
      let png = null;
      if (c.kind === 'img' && c.src) {
        try { png = await imagePng(c.src, 480); } catch (e) { png = null; }
      }
      if (!png) {
        const bytes = emojiPng(c.kind === 'emoji' ? c.src : '🐱', 128);
        png = { bytes: bytes, width: 128, height: 128 };
      }
      costumes.push(Object.assign({
        name: cname,
        rotationCenterX: Math.round(png.width / 2),
        rotationCenterY: Math.round(png.height / 2)
      }, addAsset(png.bytes, 'png')));
    }

    const sounds = [];
    built.usedSounds.forEach(key => {
      const isMelody = key.indexOf('melody:') === 0;
      const id = isMelody ? key.slice(7) : key;
      const def = isMelody ? MELODYMAP[id] : SOUNDMAP[id];
      if (!def) return;
      const wav = wavFromSteps(def.steps);
      const nm = def.name[lang] || def.name.es;
      if (sounds.some(x => x.name === nm)) return;
      sounds.push(Object.assign({
        name: nm, rate: 22050, sampleCount: Math.round((wav.length - 44) / 2)
      }, addAsset(wav, 'wav')));
    });

    spriteTargets.push({
      isStage: false,
      name: String(s.name || ('Personaje' + (i + 1))),
      variables: {},
      lists: {},
      broadcasts: {},
      blocks: built.blocks,
      comments: {},
      currentCostume: clamp(Math.floor(num(s.costumeIndex, 0)), 0, costumes.length - 1),
      costumes: costumes,
      sounds: sounds,
      volume: clamp(Math.round(num(volume, 100)), 0, 100),
      layerOrder: i + 1,
      visible: s.visible !== false,
      x: Math.round(num(s.x, 0) * 10) / 10,
      y: Math.round(num(s.y, 0) * 10) / 10,
      size: clamp(Math.round(num(s.size, 100)), 5, 500),
      direction: Math.round(num(s.dir, 90) * 10) / 10,
      draggable: false,
      rotationStyle: normRot(s.rot) === 'leftright' ? 'left-right'
        : (normRot(s.rot) === 'none' ? "don't rotate" : 'all around'),
      _dropped: built.dropped
    });
  }

  /* Variables del proyecto (las que ya existen) más las que usan los bloques. */
  Object.keys(variables || {}).forEach(k => allVars.set(k, true));
  allVars.forEach((_, name) => {
    stageVars[sb3VarId(name)] = [name, Number(variables && variables[name]) || 0];
  });

  /* Comentario con lo que no se pudo traducir, colgado del primer bloque de
     cada personaje: así se ve en Scratch sin abrir nada más. */
  spriteTargets.forEach(t => {
    if (!t._dropped.length) { delete t._dropped; return; }
    const first = Object.keys(t.blocks).find(id => t.blocks[id].topLevel);
    if (first) {
      const cid = 'c_' + first;
      t.comments[cid] = {
        blockId: first, x: 60, y: 60, width: 320, height: 160, minimized: false,
        text: (UI[lang].sb3Comment || 'Sin equivalente en Scratch') + ':\n' + t._dropped.join('\n')
      };
    }
    dropped.push.apply(dropped, t._dropped.filter(d => dropped.indexOf(d) < 0));
    delete t._dropped;
  });

  const stage = {
    isStage: true,
    name: 'Stage',
    variables: stageVars,
    lists: {},
    broadcasts: { [SB3_MSG_ID]: 'mensaje' },
    blocks: {},
    comments: {},
    currentCostume: 0,
    costumes: [backdrop],
    sounds: [],
    volume: 100,
    layerOrder: 0,
    tempo: 60,
    videoTransparency: 50,
    videoState: 'off',
    textToSpeechLanguage: null
  };

  const project = {
    targets: [stage].concat(spriteTargets),
    monitors: [],
    extensions: [],
    meta: { semver: '3.0.0', vm: '0.2.0', agent: 'ScrachMo' }
  };

  const json = new TextEncoder().encode(JSON.stringify(project));
  files.unshift({ name: 'project.json', bytes: json });
  return { files: files, project: project, dropped: dropped, assets: assets };
}

async function exportSb3() {
  const t = UI[lang];
  const btn = $('#sb3Btn');
  if (btn) btn.disabled = true;
  try {
    const built = await sb3Build();
    const zip = zipStore(built.files);
    const name = (activeProject() && activeProject().name) || t.untitledProject || 'proyecto';
    const clean = String(name).replace(/[^a-z0-9_\-áéíóúñü ]/gi, '').trim() || 'proyecto';
    const blob = new Blob([zip], { type: 'application/zip' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = clean + '.sb3';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    /* Dos avisos posibles: bloques que no existen en Scratch y un escenario
       más grande que el de Scratch, que siempre mide 480x360. */
    const avisos = [];
    if (built.dropped.length) avisos.push(built.dropped.length + ' ' + t.sb3Dropped);
    if (Math.round(worldW) !== WORLD_W0 || Math.round(worldH) !== WORLD_H0) avisos.push(t.sb3WorldSize);
    toast(avisos.length ? t.sb3Done + ' · ' + avisos.join(' · ') : t.sb3Done);
  } catch (e) {
    toast(t.sb3Fail || t.badFile);
  } finally {
    if (btn) btn.disabled = false;
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

/* ---------------- modo juego: aviso de girar ----------------
   El campo del juego es 4:3 y en modo juego se dibuja centrado, con franjas
   alrededor. En un teléfono parado eso deja el escenario como una franja
   horizontal, así que ahí —y sólo ahí— se ofrece girar el aparato. No se usa
   `screen.orientation.lock()`: no funciona en iOS y exige pantalla completa. */
const mqPortrait = (typeof window.matchMedia === 'function')
  ? window.matchMedia('(orientation: portrait)')
  : null;

function syncGameOrientation() {
  const portrait = !!mqPortrait && mqPortrait.matches;
  document.body.classList.toggle('game-portrait', portrait && document.body.classList.contains('game-mode'));
}

function bindGameOrientation() {
  const hint = $('#rotateHint');
  const close = $('#rotateClose');
  if (hint && close) close.addEventListener('click', () => hint.classList.add('is-off'));
  if (!mqPortrait) return;
  if (mqPortrait.addEventListener) mqPortrait.addEventListener('change', syncGameOrientation);
  else if (mqPortrait.addListener) mqPortrait.addListener(syncGameOrientation);
}

function enterGame() {
  gameScrollY = window.scrollY || 0;
  document.body.classList.add('game-mode');
  const hint = $('#rotateHint');
  if (hint) hint.classList.remove('is-off');
  syncGameOrientation();
  window.scrollTo(0, 0);
  /* Cada partida recalibra: la postura con la que sostenés el teléfono al
     empezar es el cero de la inclinación. */
  tiltReset();
  buildPad();
  runAll();
}

function exitGame() {
  stopCode();
  document.body.classList.remove('game-mode');
  const pad = $('#pad');
  if (pad) pad.hidden = true;
  tiltReset();
  syncGameOrientation();
  window.scrollTo(0, gameScrollY || 0);
}

/* ---------------- mando en pantalla ----------------
   «Al presionar» se dispara con un keydown de verdad, y un teléfono no tiene
   teclado: cualquier juego de flechas era injugable ahí. Este mando toca los
   MISMOS guiones que la tecla física, así que el proyecto no cambia y sigue
   funcionando igual con teclado. Mantener apretado repite, como el
   auto-repeat del sistema operativo. */

const PAD_REPEAT_MS = 110;
const PAD_DIRS = ['arrowup', 'arrowleft', 'arrowright', 'arrowdown'];

/* Teclas que usa el proyecto, sin repetir y en orden de aparición. */
function projectKeys() {
  const out = [];
  const walk = nodes => (nodes || []).forEach(n => {
    if (!n) return;
    if (n.type === 'when_key') {
      const k = normKeyName(n.val || 'espacio');
      if (out.indexOf(k) < 0) out.push(k);
    }
    if (n.body) walk(n.body);
    if (n.elseBody) walk(n.elseBody);
  });
  sprites.forEach(s => walk(s.code));
  return out;
}

/* Dispara los guiones de una tecla. Devuelve cuántos arrancaron. */
function fireKey(key) {
  const list = scriptsFor('when_key', sc => normKeyName(sc.hat.val || 'espacio') === key);
  if (!list.length) return 0;
  runScripts(list);
  return list.length;
}

function keyLabel(k) {
  const t = UI[lang];
  if (k === ' ') return t.padFire;
  if (k === 'enter') return '⏎';
  if (k === 'arrowup') return t.padUp;
  if (k === 'arrowdown') return t.padDown;
  if (k === 'arrowleft') return t.padLeft;
  if (k === 'arrowright') return t.padRight;
  return String(k).toUpperCase();
}

/* Arma el mando con lo que el proyecto pide: si no hay flechas, el D-pad no
   se muestra; si no hay acciones, no queda un botón de más. */
function buildPad() {
  const pad = $('#pad');
  if (!pad) return;
  const t = UI[lang];
  const keys = projectKeys();
  const dirs = keys.filter(k => PAD_DIRS.indexOf(k) > -1);
  const otros = keys.filter(k => PAD_DIRS.indexOf(k) < 0);

  const padDir = $('#padDir');
  if (padDir) {
    padDir.hidden = !dirs.length;
    Array.prototype.forEach.call(padDir.querySelectorAll('[data-key]'), b => {
      b.classList.toggle('is-off', dirs.indexOf(b.dataset.key) < 0);
    });
  }

  const acts = $('#padActs');
  if (acts) {
    acts.textContent = '';
    otros.forEach(k => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pad-btn';
      b.dataset.key = k;
      b.textContent = keyLabel(k);
      b.title = keyLabel(k);
      b.setAttribute('aria-label', keyLabel(k));
      acts.appendChild(b);
    });
    acts.hidden = !otros.length;
  }

  /* El interruptor de inclinación sólo tiene sentido si hay flechas que
     disparar y si el aparato tiene sensor: en una computadora no aparece. */
  const tiltBtn = $('#tiltBtn');
  if (tiltBtn) {
    const sirve = dirs.length > 0 && canTilt();
    tiltBtn.hidden = !sirve || !document.body.classList.contains('game-mode');
    tiltBtn.classList.toggle('is-on', tiltOn);
    tiltBtn.setAttribute('aria-pressed', tiltOn ? 'true' : 'false');
    tiltBtn.title = t.padTiltTip;
    tiltBtn.setAttribute('aria-label', t.padTiltTip);
  }

  pad.setAttribute('aria-label', t.padTitle);
  pad.hidden = !keys.length || !document.body.classList.contains('game-mode');
}

function padPress(btn) {
  const key = btn.dataset.key;
  if (!key) return;
  btn.classList.add('is-down');
  fireKey(key);
  /* Mientras se mantiene apretado, se repite: así el personaje camina de
     corrido en vez de dar un paso por toque. */
  let timer = setInterval(() => fireKey(key), PAD_REPEAT_MS);
  const stop = () => {
    if (timer) clearInterval(timer);
    timer = null;
    btn.classList.remove('is-down');
    btn.removeEventListener('pointerup', stop);
    btn.removeEventListener('pointercancel', stop);
    btn.removeEventListener('lostpointercapture', stop);
  };
  btn.addEventListener('pointerup', stop);
  btn.addEventListener('pointercancel', stop);
  btn.addEventListener('lostpointercapture', stop);
}

function bindPad() {
  const pad = $('#pad');
  if (!pad) return;
  pad.addEventListener('pointerdown', e => {
    const btn = e.target.closest('.pad-btn');
    if (!btn) return;
    /* El toque no puede llegar al escenario: además de la tecla se dispararía
       «al tocar» y el personaje haría las dos cosas a la vez. */
    e.preventDefault();
    e.stopPropagation();
    try { btn.setPointerCapture(e.pointerId); } catch (err) { }
    padPress(btn);
  });
  pad.addEventListener('contextmenu', e => e.preventDefault());

  /* Interruptor de inclinación: apagado por defecto, porque hay juegos en los
     que el sensor molesta más de lo que ayuda. */
  const tiltBtn = $('#tiltBtn');
  if (tiltBtn) {
    tiltBtn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      setTilt(!tiltOn);
    });
    tiltBtn.addEventListener('contextmenu', e => e.preventDefault());
  }
}

/* La pista del escenario avisa por dónde se juega en cada aparato. */
const mqCoarse = (typeof window.matchMedia === 'function')
  ? window.matchMedia('(pointer: coarse)')
  : null;

function stageHintText(t) {
  /* En un teléfono no hay teclado: si el proyecto usa teclas, el camino es
     Jugar, que es donde aparece el mando. */
  if (projectKeys().length && mqCoarse && mqCoarse.matches) return t.padHint;
  return hasTopNode('when_tap') ? t.stageHint : t.stageHintRun;
}

/* ---------------- inclinación como control ----------------
   «Al presionar» espera una tecla. El mando resuelve el pulgar, pero para
   mover un personaje inclinar el teléfono es más cómodo que buscar el botón:
   acá el acelerómetro se usa como DETECTOR DE EVENTOS y dispara las mismas
   teclas, así que ningún proyecto cambia y el teclado sigue funcionando.

   Dos cosas hacen que esto no sea un temblor:
   - El cero no es «teléfono derecho» sino la postura que tenías al activarlo
     (`tiltBase`): nadie juega con el aparato vertical.
   - Entre el umbral de encendido y el de apagado hay una zona muerta; sin ella
     el pulso encendería y apagaría la tecla sin parar. */

const TILT_ON = 0.22;   /* seno del ángulo: unos 13° desde la postura de reposo */
const TILT_OFF = 0.13;  /* unos 7,5°: por debajo de esto el eje está centrado */

/* Eje «derecha de la pantalla» en coordenadas del aparato. El acelerómetro NO
   gira con la pantalla: si no se rota a mano, en horizontal las flechas salen
   cruzadas. */
function tiltBasis(angle) {
  const a = ((Math.round(Number(angle) || 0) % 360) + 360) % 360;
  if (a === 90) return [0, -1];
  if (a === 180) return [-1, 0];
  if (a === 270) return [0, 1];
  return [1, 0];
}

function screenAngle() {
  const o = window.screen && window.screen.orientation;
  if (o && typeof o.angle === 'number') return o.angle;
  if (typeof window.orientation === 'number') return window.orientation;
  return 0;
}

/* Inclinación normalizada por la gravedad: 0 es la postura de reposo y ±1 el
   aparato acostado. `roll` positivo = borde derecho abajo; `pitch` positivo =
   la pantalla mira hacia arriba (lo alejás de vos). */
function tiltRead(acc, angle) {
  const x = Number(acc && acc.x) || 0;
  const y = Number(acc && acc.y) || 0;
  const z = Number(acc && acc.z) || 0;
  const g = Math.sqrt(x * x + y * y + z * z) || 1;
  const b = tiltBasis(angle);
  /* La gravedad apunta hacia arriba del mundo, así que con el borde derecho
     abajo el producto da negativo: se invierte para que «a la derecha» quede
     positivo. */
  return { roll: -(x * b[0] + y * b[1]) / g, pitch: z / g };
}

/* Zona muerta con memoria: dentro de la banda el eje conserva su estado. */
function tiltAxis(delta, prev) {
  if (delta > TILT_ON) return 1;
  if (delta < -TILT_ON) return -1;
  if (Math.abs(delta) < TILT_OFF) return 0;
  return prev || 0;
}

/* Qué tecla pide cada eje, y sólo si el proyecto la usa. */
function tiltKeys(roll, pitch, keys) {
  const usa = k => keys.indexOf(k) > -1;
  const out = [];
  if (roll > 0 && usa('arrowright')) out.push('arrowright');
  if (roll < 0 && usa('arrowleft')) out.push('arrowleft');
  if (pitch > 0 && usa('arrowup')) out.push('arrowup');
  if (pitch < 0 && usa('arrowdown')) out.push('arrowdown');
  return out;
}

function stopTiltRepeat() {
  if (tiltTimer) clearInterval(tiltTimer);
  tiltTimer = null;
}

/* El mando muestra qué tecla está disparando la inclinación: sin eso no se
   sabe si el sensor está leyendo o si el modo quedó apagado. */
function tiltPaint(keys) {
  const pad = $('#pad');
  if (!pad) return;
  Array.prototype.forEach.call(pad.querySelectorAll('.pad-btn[data-key]'), b => {
    b.classList.toggle('is-down', keys.indexOf(b.dataset.key) > -1);
  });
}

function tiltReset() {
  tiltBase = null;
  tiltState = { roll: 0, pitch: 0 };
  stopTiltRepeat();
  tiltPaint([]);
}

function tiltFireNow() {
  const keys = tiltKeys(tiltState.roll, tiltState.pitch, projectKeys());
  tiltPaint(keys);
  if (!keys.length) { stopTiltRepeat(); return; }
  keys.forEach(k => fireKey(k));
  /* Igual que el mando: mantener la inclinación repite. */
  if (!tiltTimer) tiltTimer = setInterval(() => {
    const again = tiltKeys(tiltState.roll, tiltState.pitch, projectKeys());
    if (!again.length) { stopTiltRepeat(); return; }
    again.forEach(k => fireKey(k));
  }, PAD_REPEAT_MS);
}

function tiltStep(acc) {
  if (!tiltOn || !document.body.classList.contains('game-mode')) return;
  const r = tiltRead(acc, screenAngle());
  if (!tiltBase) { tiltBase = r; return; }
  const roll = tiltAxis(r.roll - tiltBase.roll, tiltState.roll);
  const pitch = tiltAxis(r.pitch - tiltBase.pitch, tiltState.pitch);
  if (roll === tiltState.roll && pitch === tiltState.pitch) return;
  tiltState = { roll, pitch };
  tiltFireNow();
}

/* En una computadora no hay sensor que leer: mejor no ofrecer el interruptor. */
function canTilt() {
  if (typeof window.DeviceMotionEvent !== 'function') return false;
  return (mqCoarse && mqCoarse.matches) || (navigator.maxTouchPoints || 0) > 0;
}

function setTilt(on) {
  tiltOn = !!on;
  store.set('scrachmo_tilt', tiltOn ? '1' : '0');
  tiltReset();
  if (tiltOn) ensureMotionPermission(true);
  const btn = $('#tiltBtn');
  if (btn) {
    btn.classList.toggle('is-on', tiltOn);
    btn.setAttribute('aria-pressed', tiltOn ? 'true' : 'false');
  }
  const t = UI[lang];
  toast(tiltOn ? t.padTiltOn : t.padTiltOff);
  return tiltOn;
}

function loadTilt() {
  tiltOn = store.get('scrachmo_tilt') === '1';
  const btn = $('#tiltBtn');
  if (btn) btn.setAttribute('aria-pressed', tiltOn ? 'true' : 'false');
}

/* ---------------- events ---------------- */
function ensureMotionPermission(force) {
  if (motionRequested || (!force && !projectUsesMotion())) return;
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
  bindExamples();
  bindAbout();
  bindPwaUpdates();
  bindGameOrientation();
  loadTilt();
  bindPad();
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
    /* Las asas de tamaño no son parte del juego: tocarlas no dispara el
       «al tocar el escenario». */
    if (e.target.closest('.stage-grip')) return;
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
  px.addEventListener('input', () => { const s = selectedSprite(); if (s && px.value !== '') { s.x = clamp(num(px.value, s.x), worldLeft(), worldRight()); updateSpriteEl(s); scheduleSave(); } });
  py.addEventListener('input', () => { const s = selectedSprite(); if (s && py.value !== '') { s.y = clamp(num(py.value, s.y), worldBottom(), worldTop()); updateSpriteEl(s); scheduleSave(); } });
  /* La dirección se normaliza a −180…180, no se recorta: escribir 270 tiene
     que girar el personaje (queda como −90), no quedarse en 180. */
  pd.addEventListener('input', () => { const s = selectedSprite(); if (s && pd.value !== '') { s.dir = normDir(num(pd.value, s.dir)); updateSpriteEl(s); scheduleSave(); } });
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
    const input = e.target.closest('[data-input],[data-zoom]');
    if (!input) return;
    /* El campo de tamaño del globo no toca node.val: sólo node.zoom. */
    if (input.dataset.zoom !== undefined) {
      const zinfo = findNode(input.dataset.zoom);
      if (!zinfo) return;
      zinfo.node.zoom = clamp(Math.round(num(input.value, 100)), 50, 250);
      if (e.type === 'change') input.value = String(zinfo.node.zoom);
      scheduleSave();
      return;
    }
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
    if (stageResize) moveStageResize(e);
    if (codeResize) moveCodeResize(e);
  }, { passive: false });
  window.addEventListener('pointerup', e => {
    if (blockDrag) endBlockDrag(e, false);
    if (spriteDrag) endSpriteDrag(e, false);
    if (paletteDrag) endPaletteDrag(e, false);
    if (stageResize) endStageResize(e);
    if (codeResize) endCodeResize(e);
  });
  window.addEventListener('pointercancel', e => {
    if (blockDrag) endBlockDrag(e, true);
    if (spriteDrag) endSpriteDrag(e, true);
    if (paletteDrag) endPaletteDrag(e, true);
    if (stageResize) endStageResize(e);
    if (codeResize) endCodeResize(e);
  });

  /* ---- herramientas: zooms, deshacer/rehacer, fondo propio, reinicio ---- */
  $('#zoomOutBtn').addEventListener('click', () => changeZoom(-ZOOM_STEP));
  $('#zoomInBtn').addEventListener('click', () => changeZoom(ZOOM_STEP));
  $('#zoomVal').addEventListener('click', resetZoom);
  $('#stageZoomOutBtn').addEventListener('click', () => changeStageZoom(-ZOOM_STEP));
  $('#stageZoomInBtn').addEventListener('click', () => changeStageZoom(ZOOM_STEP));
  $('#stageZoomVal').addEventListener('click', resetStageZoom);
  /* Tamaño del mundo: asas en el borde del escenario y botón de volver. */
  const sizeResetBtn = $('#stageSizeReset');
  if (sizeResetBtn) sizeResetBtn.addEventListener('click', resetWorldSize);
  [['#gripY', 'y'], ['#gripX', 'x'], ['#gripCorner', 'xy']].forEach(pair => {
    const el = $(pair[0]);
    if (!el) return;
    el.addEventListener('pointerdown', e => startStageResize(e, pair[1]));
    el.addEventListener('keydown', e => keyStageResize(e, pair[1]));
  });
  $('#resetStartBtn').addEventListener('click', resetToStart);
  /* Alto del área de código: asa abajo, teclado y doble clic para volver. */
  const codeGrip = $('#codeGrip');
  if (codeGrip) {
    codeGrip.addEventListener('pointerdown', startCodeResize);
    codeGrip.addEventListener('keydown', keyCodeResize);
    codeGrip.addEventListener('dblclick', resetCodeHeight);
  }
  window.addEventListener('resize', () => { if (codeH > 0) applyCodeHeight(); });
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
  const sb3Btn = $('#sb3Btn');
  if (sb3Btn) sb3Btn.addEventListener('click', exportSb3);
  $('#importBtn').addEventListener('click', importProject);
  $('#multiBtn').addEventListener('click', toggleMulti);
  $('#clearBtn').addEventListener('click', clearProject);

  $('#closeShare').addEventListener('click', closeShare);
  $('#copyLink').addEventListener('click', copyShare);
  /* Antes era onclick="this.select()" en el HTML. La CSP usa script-src
     'self' y los manejadores inline quedan bloqueados: se engancha acá. */
  $('#shareLink').addEventListener('click', e => e.target.select());
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
    if (!fireKey(key)) return;
    e.preventDefault();
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
    tiltStep(acc);
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
/* El tamaño del mundo manda en el CSS del escenario: se publica antes del
   primer render para que la caja no aparezca con el tamaño de fábrica y salte. */
applyWorldSize();
/* El alto del área de código es una preferencia del dispositivo. Se aplica
   antes del primer render para que la tarjeta no salte de tamaño. */
loadCodeHeight();
render();
/* La primera instantánea es la línea base del historial. Si venimos de un
   link compartido, hydrateShared() la reemplaza al aplicar el proyecto. */
resetHistory();
if (pendingShare) hydrateShared(pendingShare);
