/* Paridad de textos y comprobaciones estáticas del motor.
   Uso: node tests/check-parity.js  (desde cualquier directorio) */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const SRC = path.resolve(__dirname, '..');

const ctx = { console: console };
vm.createContext(ctx);
vm.runInContext(
  fs.readFileSync(path.join(SRC, 'data.js'), 'utf8') +
  '\n;this.UIX = UI; this.EX = UI_EXTRA; this.PB = PALETTE_BLOCKS; this.ALLB = BLOCKS; this.BY = BYID; this.AV = APP_VERSION;', ctx);

const langs = ['es', 'en', 'pt', 'fr'];
let ok = true;

const base = Object.keys(ctx.UIX.es).sort();
for (const l of langs) {
  const keys = Object.keys(ctx.UIX[l]).sort();
  const missing = base.filter(k => typeof ctx.UIX[l][k] !== 'string' || !ctx.UIX[l][k].length);
  const extra = keys.filter(k => base.indexOf(k) < 0);
  if (missing.length || extra.length) {
    ok = false;
    console.log('FAIL paridad', l, { missing: missing, extra: extra });
  }
}
const exBase = Object.keys(ctx.EX.es).sort();
for (const l of langs) {
  const keys = Object.keys(ctx.EX[l]).sort();
  const missing = exBase.filter(k => typeof ctx.EX[l][k] !== 'string' || !ctx.EX[l][k].length);
  const extra = keys.filter(k => exBase.indexOf(k) < 0);
  if (missing.length || extra.length) {
    ok = false;
    console.log('FAIL paridad UI_EXTRA', l, { missing: missing, extra: extra });
  }
}

/* index.html es la LANDING y no carga el motor: todas las guardas de la
   interfaz, el CSS y los ids del editor se tienen que leer de app.html. */
const html = fs.readFileSync(path.join(SRC, 'app.html'), 'utf8');
const landingHtml = fs.readFileSync(path.join(SRC, 'index.html'), 'utf8');
const landingJs = fs.readFileSync(path.join(SRC, 'landing.js'), 'utf8');
const bootJs = fs.readFileSync(path.join(SRC, 'boot.js'), 'utf8');
const grab = re => Array.from(new Set(Array.from(html.matchAll(re), m => m[1])));
const tKeys = grab(/data-t="([^"]+)"/g);
const ttKeys = grab(/data-tt="([^"]+)"/g);
const badT = tKeys.filter(k => typeof ctx.UIX.es[k] !== 'string');
const badTT = ttKeys.filter(k => typeof ctx.UIX.es[k] !== 'string');
if (badT.length || badTT.length) { ok = false; console.log('FAIL textos html', { badT: badT, badTT: badTT }); }
for (const l of langs) {
  const bad = tKeys.concat(ttKeys).filter(k => typeof ctx.UIX[l][k] !== 'string');
  if (bad.length) { ok = false; console.log('FAIL textos html', l, bad); }
}

/* Estático: el motor no debe usar eval/Function ni diálogos nativos.
   Se quitan los comentarios para no confundir la documentación con código. */
const engine = fs.readFileSync(path.join(SRC, 'engine.js'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\/\/[^\n]*/g, '');
const nativeCalls = engine.match(/\b(?:window\.)?(?:prompt|confirm|alert)\s*\(/g) || [];
if (nativeCalls.length) { ok = false; console.log('FAIL diálogos nativos', nativeCalls); }
if (/\b(?:new\s+)?Function\s*\(/.test(engine)) { ok = false; console.log('FAIL eval/Function() en el motor'); }
if (!/function\s+calcExpr\s*\(/.test(engine)) { ok = false; console.log('FAIL falta el parser calcExpr()'); }
if (!/function\s+askUser\s*\(/.test(engine)) { ok = false; console.log('FAIL falta el diálogo askUser()'); }
if (!/const\s+MAX_CODE_DEPTH\s*=/.test(engine)) { ok = false; console.log('FAIL falta el tope de anidado'); }
if (!/function\s+nodeVal\s*\(/.test(engine)) { ok = false; console.log('FAIL falta nodeVal() para los reporteros'); }
if (!/function\s+evalReporter\s*\(/.test(engine)) { ok = false; console.log('FAIL falta evalReporter()'); }
if (!/function\s+bindRepPicker\s*\(/.test(engine)) { ok = false; console.log('FAIL falta el selector de reporteros'); }
/* Sensores: si alguien borra la geometría o el cronómetro, el arnés 11 lo
   detecta en el navegador, pero esto avisa antes y sin Chrome. */
if (!/function\s+spriteRadius\s*\(/.test(engine)) { ok = false; console.log('FAIL falta spriteRadius() de los sensores'); }
if (!/function\s+touchingEdge\s*\(/.test(engine)) { ok = false; console.log('FAIL falta touchingEdge()'); }
if (!/function\s+touchingOther\s*\(/.test(engine)) { ok = false; console.log('FAIL falta touchingOther()'); }
if (!/function\s+bounceSprite\s*\(/.test(engine)) { ok = false; console.log('FAIL falta bounceSprite()'); }
if (!/timerStart\s*=\s*Date\.now\(\)/.test(engine)) { ok = false; console.log('FAIL falta el cronómetro'); }
/* Audio: la síntesis y, sobre todo, que Detener corte la música. Si alguien
   quita ese stopAllSounds(), una melodía en bucle quedaría sonando para
   siempre y ninguna prueba de navegador lo notaría. */
if (!/function\s+playSoundById\s*\(/.test(engine)) { ok = false; console.log('FAIL falta playSoundById()'); }
if (!/function\s+playMelodyById\s*\(/.test(engine)) { ok = false; console.log('FAIL falta playMelodyById()'); }
if (!/function\s+stopAllSounds\s*\(/.test(engine)) { ok = false; console.log('FAIL falta stopAllSounds()'); }
if (!/function\s+volumeGain\s*\(/.test(engine)) { ok = false; console.log('FAIL falta volumeGain()'); }
if (!/function\s+stopCode\s*\([\s\S]{0,500}?stopAllSounds\(\)/.test(engine)) {
  ok = false; console.log('FAIL stopCode() no corta los sonidos');
}

/* Importación de imágenes: el SVG se acepta como entrada pero se rasteriza.
   Si alguien mete `svg` en IMG_DATA_RE para «no tener que convertir», los
   datos guardados pasarían a admitir SVG —que puede llevar script— y ninguna
   otra prueba se enteraría. */
if (!/const\s+IMG_DATA_RE\s*=\s*\/\^data:image\\\/\(webp\|png\|jpeg\|gif\);base64,/.test(engine)) {
  ok = false; console.log('FAIL IMG_DATA_RE debe admitir sólo webp/png/jpeg/gif');
}
if (!/const\s+VECTOR_TYPE\s*=\s*'image\/svg\+xml'/.test(engine)) { ok = false; console.log('FAIL falta VECTOR_TYPE'); }
['isSvgFile', 'svgBox', 'decodeImage', 'encodeImage', 'isAllowedImage'].forEach(fn => {
  if (!new RegExp('function\\s+' + fn + '\\s*\\(').test(engine)) {
    ok = false; console.log('FAIL falta ' + fn + '() de la importación de imágenes');
  }
});
if (!/ACCEPT_IMAGE\.join\(/.test(engine)) { ok = false; console.log('FAIL los <input file> no usan ACCEPT_IMAGE'); }

/* Anidar soltando encima: si alguien vuelve a resolver el destino con un
   `closest('.c-slot')` pelado, soltar sobre el «por siempre» deja el bloque
   afuera otra vez y sólo entra apuntando al hueco de 26 px. */
if (!/function\s+dropSlotAt\s*\(/.test(engine)) { ok = false; console.log('FAIL falta dropSlotAt()'); }
if (!/function\s+dropSlotAt\s*\([\s\S]{0,600}?c-head/.test(engine)) {
  ok = false; console.log('FAIL dropSlotAt() ya no mira la cabecera del bloque en C');
}
['moveBlockDrag', 'paletteDropContainer'].forEach(fn => {
  if (!new RegExp('function\\s+' + fn + '\\s*\\([\\s\\S]{0,900}?dropSlotAt\\(').test(engine)) {
    ok = false; console.log('FAIL ' + fn + '() no usa dropSlotAt()');
  }
});
/* Teclado: el bloque guarda el valor de `e.key`, así que la lista de teclas
   tiene que existir y el desplegable tiene que salir del catálogo. */
if (!/const\s+KEY_LIB\s*=/.test(fs.readFileSync(path.join(SRC, 'data.js'), 'utf8'))) {
  ok = false; console.log('FAIL falta KEY_LIB en data.js');
}
if (!/kind\s*===\s*'keys'\s*\?\s*KEY_LIB/.test(engine)) {
  ok = false; console.log('FAIL pickList() no devuelve KEY_LIB');
}
if (!/function\s+pickMatch\s*\(/.test(engine)) { ok = false; console.log('FAIL falta pickMatch()'); }

/* Condicionales: TODO C-block con condición tiene que estar en COND_TYPES.
   Si falta uno, execNode() lo manda a execBlock(), que no conoce su body, y
   el contenido se ignora en silencio. Así estuvieron «si toca el borde» y
   «si toca a otro personaje» desde que se agregaron: el bloque se veía, se
   arrastraba y no hacía nada. */
{
  const dataSrc = fs.readFileSync(path.join(SRC, 'data.js'), 'utf8');
  const cBlocks = [...dataSrc.matchAll(/id: '([a-z0-9_]+)', cat: '[a-z]+',[^\n]*?\bc: 1\b/g)].map(m => m[1]);
  const condMatch = /const COND_TYPES = \{([\s\S]*?)\};/.exec(engine);
  const condIds = condMatch ? [...condMatch[1].matchAll(/([a-z0-9_]+)\s*:\s*1/g)].map(m => m[1]) : [];
  /* repeat/forever no llevan condición; «sino» es la rama negativa. */
  const propios = ['repeat', 'forever', 'sino'];
  const faltan = cBlocks.filter(id => propios.indexOf(id) < 0 && condIds.indexOf(id) < 0);
  if (!condIds.length) { ok = false; console.log('FAIL falta COND_TYPES en engine.js'); }
  if (faltan.length) {
    ok = false; console.log('FAIL C-blocks con condición fuera de COND_TYPES: ' + faltan.join(', '));
  }
  if (!/if \(COND_TYPES\[node\.type\]\)/.test(engine)) {
    ok = false; console.log('FAIL execNode() no despacha con COND_TYPES');
  }
  if (/\|\|\s*node\.type === 'if_edge'/.test(engine)) {
    ok = false; console.log('FAIL volvió la lista literal de condicionales en execNode()');
  }
}

/* Alto del área de código: el asa y la variable que lo mueve. */
if (!/id="codeGrip"/.test(html)) { ok = false; console.log('FAIL falta el asa #codeGrip'); }
['startCodeResize', 'moveCodeResize', 'endCodeResize', 'keyCodeResize',
  'applyCodeHeight', 'setCodeHeight', 'loadCodeHeight', 'resetCodeHeight', 'codeMaxH'].forEach(fn => {
    if (!new RegExp('function\\s+' + fn + '\\s*\\(').test(engine)) {
      ok = false; console.log('FAIL falta ' + fn + '() del alto del código');
    }
  });

/* Exportación a .sb3: las piezas que no pueden faltar. El ZIP, el MD5 y el
   CRC32 son propios (no hay librerías), así que si alguien los borra el botón
   queda muerto sin que ninguna otra prueba se entere. */
['exportSb3', 'sb3Build', 'sb3SpriteBlocks', 'zipStore', 'md5hex', 'crc32', 'wavFromSteps', 'backdropPng', 'emojiPng']
  .forEach(fn => {
    if (!new RegExp('function\\s+' + fn + '\\s*\\(').test(engine)) {
      ok = false; console.log('FAIL falta ' + fn + '() del exportador .sb3');
    }
  });
if (!/const\s+SB3_NO_EQUIV\s*=/.test(engine)) { ok = false; console.log('FAIL falta la lista SB3_NO_EQUIV'); }
/* Una melodía en bucle dentro de Scratch colgaría el guion: tiene que salir
   como «tocar sonido hasta que termine». */
if (!/case\s+'play_music'[\s\S]{0,400}?sound_playuntildone/.test(engine)) {
  ok = false; console.log('FAIL la música no se exporta como sound_playuntildone');
}
if (!/id="sb3Btn"/.test(html)) { ok = false; console.log('FAIL falta el botón #sb3Btn'); }
if (!/sb3Btn[\s\S]{0,120}exportSb3/.test(engine)) {
  ok = false; console.log('FAIL el botón .sb3 no está enganchado a exportSb3');
}

/* Ids de bloque únicos: un id repetido no rompe nada, pero `BYID` se queda
   con el último y la paleta muestra el bloque dos veces. Pasó con `rebotar`. */
const idsBloque = ctx.ALLB.map(b => b.id);
const idsRepetidos = idsBloque.filter((v, i, a) => a.indexOf(v) !== i);
if (idsRepetidos.length) {
  ok = false; console.log('FAIL ids de bloque repetidos: ' + idsRepetidos.join(', '));
}
/* Y la paleta no puede tener dos entradas con el mismo id. */
const palIds = ctx.PB.map(b => b.id);
const palRepetidos = palIds.filter((v, i, a) => a.indexOf(v) !== i);
if (palRepetidos.length) {
  ok = false; console.log('FAIL la paleta repite bloques: ' + palRepetidos.join(', '));
}

/* Layout ancho: dos columnas por CSS sin tocar el orden del celular. Si
   alguien borra el `display:contents` o los `order`, en el celular las
   tarjetas se desordenan (Variables y Proyecto antes que el código). */
const CARDS_ORDEN = ['stageCard', 'spritesCard', 'codeCard', 'varsCard', 'toolsCard', 'blocksCard'];
if (!/id="colLeft"/.test(html) || !/id="colRight"/.test(html)) {
  ok = false; console.log('FAIL faltan las dos columnas del layout ancho');
}
if (!/\.col\{display:contents\}/.test(html)) {
  ok = false; console.log('FAIL las columnas no se disuelven en el celular');
}
CARDS_ORDEN.forEach((id, i) => {
  if (!new RegExp('#' + id + '\\{order:' + (i + 1) + '\\}').test(html)) {
    ok = false; console.log('FAIL falta el order de ' + id + ' (esperado ' + (i + 1) + ')');
  }
});
if (!/@media\(min-width:900px\)/.test(html) || !/body:not\(\.game-mode\) main/.test(html)) {
  ok = false; console.log('FAIL el layout ancho falta o no excluye el modo juego');
}

/* Los bloques se apilan con z-index desde 6000 (assignZ()): si el área de
   código no aísla su contexto, se dibujan por encima de cualquier modal. */
if (!/\.scratch-workspace\{[^}]*isolation:isolate/.test(html)) {
  ok = false; console.log('FAIL el área de código no aísla su contexto de apilamiento');
}

/* Modal «Acerca de»: el botón, el modal y las piezas que lo abren y cierran. */
if (!/id="aboutBtn"/.test(html) || !/id="aboutModal"/.test(html)) {
  ok = false; console.log('FAIL faltan el botón o el modal «Acerca de»');
}
['openAbout', 'closeAbout', 'bindAbout'].forEach(fn => {
  if (!new RegExp('function\\s+' + fn + '\\s*\\(').test(engine)) {
    ok = false; console.log('FAIL falta ' + fn + '() del modal «Acerca de»');
  }
});
if (!/^\s*bindAbout\(\);/m.test(engine)) { ok = false; console.log('FAIL bindAbout() no se llama'); }
/* Todos los diálogos tienen que estar en la lista que bloquea el scroll y
   atrapa el foco: si uno queda afuera, se abre pero la página de atrás sigue
   recibiendo Tab y se mueve. */
const listaModales = /const MODAL_IDS = \[([^\]]+)\]/.exec(engine);
if (!listaModales || ['shareModal', 'spriteModal', 'askModal', 'repPicker',
  'projModal', 'exModal', 'aboutModal'].some(id => listaModales[1].indexOf("'" + id + "'") < 0)) {
  ok = false; console.log('FAIL MODAL_IDS no cubre los siete modales (incluidos «Ejemplos» y «Acerca de»)');
}

/* Modo juego: el campo tiene que conservar la proporción del mundo (480x360 de
   fábrica, pero el usuario puede agrandarlo). Si se estira, 100 pasos
   verticales se ven más grandes que 100 horizontales aunque los choques se
   sigan calculando en unidades. */
if (!/body\.game-mode \.stage\{[^}]*aspect-ratio:var\(--stage-w,480\) \/ var\(--stage-h,360\)/.test(html)) {
  ok = false; console.log('FAIL el campo del modo juego no fija la proporción del mundo');
}
if (!/body\.game-mode \.stage\{[^}]*width:min\(100vw, calc\(100dvh \* var\(--stage-w,480\) \/ var\(--stage-h,360\)\)\)/.test(html)) {
  ok = false; console.log('FAIL el campo del modo juego no se limita a la pantalla');
}
/* La ventana del escenario NO puede escalar con el zoom: eso era el error.
   El zoom va sobre `.stage-world`, que es el contenido. */
if (!/\.stage-world\{[^}]*transform:scale\(var\(--stage-zoom,1\)\)/.test(html)) {
  ok = false; console.log('FAIL el zoom del escenario no se aplica al mundo (`.stage-world`)');
}
if (/\.stage\{[^}]*height:calc\([^}]*var\(--stage-zoom/.test(html)) {
  ok = false; console.log('FAIL el alto del escenario sigue dependiendo del zoom');
}
if (!/\.scratch-workspace\{[^}]*height:var\(--code-h,\s*clamp/.test(html)) {
  ok = false; console.log('FAIL el área de código no tiene alto fijo: el zoom estiraría la tarjeta');
}
if (!/id="stageWorld"/.test(html) || !/id="stageBg"/.test(html)) {
  ok = false; console.log('FAIL faltan la capa del mundo o la del fondo');
}
/* Tamaño del mundo: asas, botón de volver y los bordes atados a worldW/worldH. */
['gripY', 'gripX', 'gripCorner', 'stageSizeReset'].forEach(id => {
  if (!new RegExp('id="' + id + '"').test(html)) {
    ok = false; console.log('FAIL falta #' + id);
  }
});
['applyWorldSize', 'startStageResize', 'moveStageResize', 'endStageResize',
  'resizeWorldBy', 'resetWorldSize', 'keyStageResize', 'clampToWorld',
  'worldLeft', 'worldRight', 'worldTop', 'worldBottom'].forEach(fn => {
    if (!new RegExp('function\\s+' + fn + '\\s*\\(').test(engine)) {
      ok = false; console.log('FAIL falta ' + fn + '()');
    }
  });
if (!/const\s+WORLD_W0 = 480/.test(engine) || !/const\s+WORLD_H0 = 360/.test(engine)) {
  ok = false; console.log('FAIL el mundo de fábrica ya no es 480x360');
}
/* Los bordes no pueden volver a estar clavados en ±240/±180: si alguien los
   escribe a mano, agrandar el escenario deja de servir para los choques. */
if (/function\s+touchingEdge[\s\S]{0,220}?240/.test(engine) ||
  /function\s+touchingEdge[\s\S]{0,220}?180/.test(engine)) {
  ok = false; console.log('FAIL touchingEdge() volvió a usar los bordes fijos');
}
if (!/worldW: worldW/.test(engine) || !/worldH: worldH/.test(engine)) {
  ok = false; console.log('FAIL el tamaño del mundo no se guarda en el proyecto');
}
if (!/id="rotateHint"/.test(html) || !/id="rotateClose"/.test(html)) {
  ok = false; console.log('FAIL faltan el aviso de girar o su botón de cerrar');
}
if (!/body\.game-mode\.game-portrait \.rotate-hint/.test(html)) {
  ok = false; console.log('FAIL el aviso de girar no está atado al modo juego en vertical');
}
['syncGameOrientation', 'bindGameOrientation'].forEach(fn => {
  if (!new RegExp('function\\s+' + fn + '\\s*\\(').test(engine)) {
    ok = false; console.log('FAIL falta ' + fn + '()');
  }
});
if (!/^\s*bindGameOrientation\(\);/m.test(engine)) { ok = false; console.log('FAIL bindGameOrientation() no se llama'); }
if (!/classList\.toggle\('game-portrait'/.test(engine)) {
  ok = false; console.log('FAIL nada pone ni saca la clase game-portrait');
}
/* `[^}]*` para quedarse dentro del cuerpo de cada función: con una ventana de
   N caracteres, la llamada de `exitGame()` satisfacía la guarda de `enterGame()`
   aunque éste no sincronizara nada. */
if (!/function\s+enterGame\s*\([^)]*\)\s*\{[^}]*syncGameOrientation\(\)/.test(engine) ||
  !/function\s+exitGame\s*\([^)]*\)\s*\{[^}]*syncGameOrientation\(\)/.test(engine)) {
  ok = false; console.log('FAIL entrar o salir del juego no sincroniza la orientación');
}

/* Clones: tres bloques, un sombrero y un ciclo de vida que vive sólo en
   ejecución. Si falta cualquiera de las dos mitades (el catálogo o el runtime),
   el bloque aparece en la paleta pero no hace nada. */
if (!ctx.BY.when_clone || ctx.BY.when_clone.hat !== 1) {
  ok = false; console.log('FAIL falta el sombrero «al comenzar como clon»');
}
if (!ctx.BY.create_clone || ctx.BY.create_clone.pick !== 'sprites') {
  ok = false; console.log('FAIL «crear clon de» no tiene el menú de personajes');
}
if (!ctx.BY.delete_clone) { ok = false; console.log('FAIL falta «borrar este clon»'); }
['spawnClone', 'deleteClone', 'clearClones', 'layerIndex', 'makeClone'].forEach(fn => {
  if (!new RegExp('function\\s+' + fn + '\\s*\\(').test(engine)) {
    ok = false; console.log('FAIL falta ' + fn + '()');
  }
});
if (!/const\s+MAX_CLONES\s*=\s*\d+/.test(engine)) { ok = false; console.log('FAIL falta el tope de clones'); }
/* Los clones no están en `sprites`: si el dibujo y las colisiones no los
   suman aparte, se crean pero no se ven ni chocan. */
if (!/sprites\.concat\(clones\)/.test(engine)) {
  ok = false; console.log('FAIL el dibujo o las colisiones no incluyen los clones');
}
if (!/function\s+stopCode\s*\([^)]*\)\s*\{[\s\S]{0,900}?clearClones\(\)/.test(engine)) {
  ok = false; console.log('FAIL Detener no borra los clones');
}
if (!/sc\.event === 'when_clone'/.test(engine)) {
  ok = false; console.log('FAIL los clones no filtran su sombrero');
}
/* Exportación: los tres opcodes existen en Scratch, así que no pueden quedar
   en la lista de «sin equivalente». */
['control_start_as_clone', 'control_create_clone_of', 'control_delete_this_clone'].forEach(op => {
  if (engine.indexOf(op) < 0) { ok = false; console.log('FAIL la exportación no emite ' + op); }
});
if (/SB3_NO_EQUIV\s*=\s*\{[\s\S]{0,600}?create_clone/.test(engine)) {
  ok = false; console.log('FAIL los clones quedaron marcados como sin equivalente');
}

/* Un `case` repetido dentro del mismo switch es JavaScript válido y no avisa
   de nada: el segundo queda muerto y el bloque sigue haciendo lo viejo. Pasó
   al agregar `rebotar` encima de una versión anterior que quedó olvidada. */
const fnStarts = [];
const fnRe = /(?:async\s+)?function\s+([A-Za-z0-9_$]+)\s*\(/g;
let fm;
while ((fm = fnRe.exec(engine))) fnStarts.push({ name: fm[1], at: fm.index });
fnStarts.forEach((f, i) => {
  const chunk = engine.slice(f.at, i + 1 < fnStarts.length ? fnStarts[i + 1].at : engine.length);
  const labels = (chunk.match(/case\s+'[a-z0-9_]+'/g) || []).map(c => c.replace(/[^a-z0-9_]/g, ''));
  const dups = labels.filter((v, idx, arr) => arr.indexOf(v) !== idx);
  if (dups.length) { ok = false; console.log('FAIL case duplicado en ' + f.name + '(): ' + dups.join(', ')); }
});

/* Workflows: un valor sin comillas que contenga «: » rompe el YAML entero y
   GitHub corre el archivo con el nombre del path, sin ejecutar ni un paso.
   Pasó una vez con «name: PWA: …» y no avisó en ningún lado. */
const wfDir = path.join(SRC, '.github', 'workflows');
let wfCount = 0;
if (fs.existsSync(wfDir)) {
  for (const f of fs.readdirSync(wfDir).filter(n => /\.ya?ml$/.test(n))) {
    wfCount++;
    const src = fs.readFileSync(path.join(wfDir, f), 'utf8');
    if (!/^jobs:/m.test(src)) { ok = false; console.log('FAIL workflow ' + f + ': falta jobs:'); }
    src.split(/\r?\n/).forEach((line, i) => {
      const m = /^\s*(?:-\s*)?name:\s*(.+)$/.exec(line);
      if (!m) return;
      const value = m[1].trim();
      if (/^['"]/.test(value)) return;
      if (/: /.test(value)) {
        ok = false;
        console.log('FAIL workflow ' + f + ':' + (i + 1) + ' → «' + value + '» tiene «: » sin comillas');
      }
    });
  }
}

/* ---------------- versión de la PWA y aviso de actualización ----------------
   Sin esta guarda, cambiar cualquiera de los seis archivos del runtime sin
   tocar sw.js deja a los celulares con la copia vieja para siempre: el service
   worker los sirve desde la caché y el navegador no reinstala si sw.js no
   cambió. El nombre de la caché lleva la huella, así que olvidarse es un
   error de CI y no un problema que aparece tres semanas después. */
{
  const { buildHash } = require('./bump-sw');
  const swSrc = fs.readFileSync(path.join(SRC, 'sw.js'), 'utf8');
  const m = /const VERSION = 'scrachmo-(v\d+)-([0-9a-f]{8})'/.exec(swSrc);
  if (!m) {
    ok = false;
    console.log('FAIL sw.js: VERSION no tiene versión + huella (corré node tests/bump-sw.js)');
  } else {
    if (m[1] !== ctx.AV) {
      ok = false;
      console.log('FAIL APP_VERSION (data.js)=' + ctx.AV + ' pero sw.js dice ' + m[1]);
    }
    const esperada = buildHash();
    if (m[2] !== esperada) {
      ok = false;
      console.log('FAIL cambió la landing/app/motor sin actualizar sw.js: ' +
        'corré node tests/bump-sw.js (huella esperada ' + esperada + ')');
    }
  }
  if (!/const APP_VERSION = 'v\d+'/.test(fs.readFileSync(path.join(SRC, 'data.js'), 'utf8'))) {
    ok = false; console.log('FAIL falta APP_VERSION en data.js');
  }
  /* El aviso de versión nueva: piezas del motor, del HTML y su enganche. */
  ['bindPwaUpdates', 'showPwaUpdate'].forEach(fn => {
    if (!new RegExp('function\\s+' + fn + '\\s*\\(').test(engine)) {
      ok = false; console.log('FAIL falta ' + fn + '() del aviso de actualización');
    }
  });
  if (!/^\s*bindPwaUpdates\(\);/m.test(engine)) {
    ok = false; console.log('FAIL bindPwaUpdates() no se llama');
  }
  if (!/controllerchange/.test(engine) || !/updatefound/.test(engine)) {
    ok = false; console.log('FAIL el aviso no escucha controllerchange/updatefound');
  }
  ['updateBar', 'updateReload', 'updateClose', 'aboutVersionValue', 'footerVersion'].forEach(id => {
    if (!new RegExp('id="' + id + '"').test(html)) {
      ok = false; console.log('FAIL falta #' + id + ' en app.html');
    }
  });
  ['aboutVersion', 'updateMsg', 'updateReload', 'updateClose'].forEach(k => {
    if (typeof ctx.EX.es[k] !== 'string') {
      ok = false; console.log('FAIL falta la clave UI_EXTRA.' + k);
    }
  });
  if (!/aboutVersionValue/.test(engine)) {
    ok = false; console.log('FAIL render() no muestra la versión en «Acerca de»');
  }
}

/* ---------------- arquitectura landing + editor ----------------
   La raíz es la presentación y app.html es la app. Si se vuelve a poner el
   editor en index.html, la landing desaparece y los links directos dejan de
   tener sentido; si se rompe el redirect, todos los proyectos compartidos
   antes de la mudanza dejan de abrir. */
{
  const versionLanding = /const VERSION = '(v\d+)';/.exec(landingJs);
  if (!versionLanding || versionLanding[1] !== ctx.AV) {
    ok = false;
    console.log('FAIL landing.js VERSION=' + (versionLanding ? versionLanding[1] : '?') +
      ' pero data.js APP_VERSION=' + ctx.AV);
  }
  if (/<script src="data\.js"/.test(landingHtml) || /<script src="engine\.js"/.test(landingHtml)) {
    ok = false; console.log('FAIL la landing no debería cargar el motor');
  }
  if (!/<script src="landing\.js"><\/script>/.test(landingHtml)) {
    ok = false; console.log('FAIL la landing no carga landing.js');
  }
  if (!/app\.html/.test(landingHtml) || !/id="shareApp"/.test(landingHtml) ||
      !/id="appUrl"/.test(landingHtml)) {
    ok = false; console.log('FAIL la landing no ofrece el enlace directo y compartible a app.html');
  }
  ['cafecito.app/hmvillalba', 'ko-fi.com/hugomartinvillalba',
    'github.com/hmvillalba/scrachmo'].forEach(url => {
    if (landingHtml.indexOf(url) < 0) {
      ok = false; console.log('FAIL la landing no enlaza ' + url);
    }
  });
  if (!/location\.replace\(\s*'app\.html'/.test(landingJs) || !/[?&]p=/.test(landingJs)) {
    ok = false; console.log('FAIL landing.js no redirige los links ?p= viejos al editor');
  }
  /* Paridad de los textos de la landing: cada clave del HTML tiene que estar
     en el diccionario de los cuatro idiomas. */
  const clavesLanding = Array.from(new Set(
    Array.from(landingHtml.matchAll(/data-i18n="([^"]+)"/g), m => m[1])));
  ['es', 'en', 'pt', 'fr'].forEach(l => {
    /* El bloque `fr` es el último y cierra sin coma: la coma es opcional. */
    const bloque = (new RegExp('\\n\\s*' + l + ':\\s*\\{([\\s\\S]*?)\\n\\s*\\},?')
      .exec(landingJs) || [])[1] || '';
    const faltan = clavesLanding.filter(k => bloque.indexOf("'" + k + "'") < 0);
    if (faltan.length) {
      ok = false;
      console.log('FAIL landing: faltan claves en ' + l + ': ' + faltan.join(', '));
    }
  });
  const manifest = (() => {
    try { return JSON.parse(fs.readFileSync(path.join(SRC, 'manifest.webmanifest'), 'utf8')); }
    catch (e) { return {}; }
  })();
  if (String(manifest.start_url || '').indexOf('app.html') < 0) {
    ok = false; console.log('FAIL la PWA instalada arranca en la landing (start_url)');
  }
  if (!/<script src="boot\.js"><\/script>/.test(html) ||
      !/serviceWorker\.register\(\s*'sw\.js'\s*\)/.test(bootJs)) {
    ok = false; console.log('FAIL el registro del service worker no está en boot.js');
  }
}

/* ---------------- P1.5 / P1.6 / P1.7: seguridad y accesibilidad ---------------- */
{
  /* Tope DURANTE la descompresión: un gzip bomb no puede esperar al
     arrayBuffer() completo para ser rechazado. */
  ['MAX_INFLATE_BYTES', 'inflateLimited'].forEach(s => {
    if (engine.indexOf(s) < 0) { ok = false; console.log('FAIL falta ' + s + ' del tope gzip'); }
  });
  if (!/function\s+inflateLimited\s*\([\s\S]{0,900}?reader\.cancel\(/.test(engine)) {
    ok = false; console.log('FAIL inflateLimited() no cancela el stream al pasarse del tope');
  }
  if (!/decodeShareAsync[\s\S]{0,900}?inflateLimited\(/.test(engine)) {
    ok = false; console.log('FAIL decodeShareAsync() no usa inflateLimited()');
  }
  /* CSP: ningún script inline en las dos páginas. En los arneses file:// no
     hay cabeceras, así que un descuido aquí sólo se rompe en Vercel. */
  [['app.html', html], ['index.html', landingHtml]].forEach(([f, txt]) => {
    const inline = txt.match(/<script(?![^>]*\bsrc=)[^>]*>/gi) || [];
    if (inline.length) { ok = false; console.log('FAIL ' + f + ' tiene scripts inline (los bloquea la CSP)'); }
    if (/\son(?:click|change|input|load|submit|error)\s*=/i.test(txt)) {
      ok = false; console.log('FAIL ' + f + ' tiene manejadores inline (los bloquea la CSP)');
    }
  });
  /* Trampa de foco: el modal retiene Tab y el fondo queda inerte. */
  ['openModals', 'trapModalKey', 'updateModalLock'].forEach(fn => {
    if (!new RegExp('function\\s+' + fn + '\\s*\\(').test(engine)) {
      ok = false; console.log('FAIL falta ' + fn + '() de la trampa de foco');
    }
  });
  if (!/setAttribute\(\s*'inert'/.test(engine) || !/removeAttribute\(\s*'inert'/.test(engine)) {
    ok = false; console.log('FAIL los modales no ponen/quitan inert al fondo');
  }
  if (!/modalFocusFrom/.test(engine)) {
    ok = false; console.log('FAIL no se restaura el foco al cerrar un modal');
  }
}

/* ---------------- diálogo con tamaño, arranque y biblioteca ---------------- */
{
  /* El tamaño del globo va en node.zoom, NO en node.val: si fuera un segundo
     hueco, un mensaje con comas se partiría en dos campos. */
  if (!ctx.BY.say || ctx.BY.say.zoom !== 1) {
    ok = false; console.log('FAIL el bloque «decir» no declara su campo de tamaño');
  }
  ['sayZooms', '--bz', 'node.zoom'].forEach(s => {
    if (engine.indexOf(s) < 0) { ok = false; console.log('FAIL falta ' + s + ' en el zoom del globo'); }
  });
  if (!/if\s*\(def\.zoom\s*&&\s*!opts\.preview\)/.test(engine)) {
    ok = false; console.log('FAIL el campo de tamaño no se dibuja dentro del bloque');
  }
  if (!/data-zoom/.test(engine) || !/\[data-input\],\[data-zoom\]/.test(engine)) {
    ok = false; console.log('FAIL el campo de tamaño no está enganchado al editar');
  }
  /* La bandera recorre todos los personajes: si el seleccionado no tiene
     bloques no puede bloquear el arranque, y si no hay sombrero de bandera
     hay que avisarlo en vez de no hacer nada. */
  if (!/noFlagScripts/.test(engine)) {
    ok = false; console.log('FAIL runAll() no avisa cuando falta el sombrero de bandera');
  }
  if (!/function\s+runAll\s*\([\s\S]{0,700}?scriptsFor\('when_flag'\)/.test(engine)) {
    ok = false; console.log('FAIL runAll() no recorre los guiones de bandera de todo el proyecto');
  }
  /* Respaldo de la biblioteca y deshacer borrado. */
  ['libraryPayload', 'exportLibrary', 'undoDeleteProject'].forEach(fn => {
    if (!new RegExp('function\\s+' + fn + '\\s*\\(').test(engine)) {
      ok = false; console.log('FAIL falta ' + fn + '() de la biblioteca');
    }
  });
  if (!/let\s+lastDeleted\s*=\s*null/.test(engine)) {
    ok = false; console.log('FAIL no se guarda el último proyecto borrado');
  }
  ['projExport', 'projUndo'].forEach(id => {
    if (!new RegExp('id="' + id + '"').test(html)) {
      ok = false; console.log('FAIL falta #' + id + ' en el modal de proyectos');
    }
  });
}

/* ---------------- ejemplos y guía (P1.9) ----------------
   Los ejemplos se arman con los constructores del motor, no con JSON copiado:
   si alguien los pasa a literales, se desincronizan al primer cambio de nodo. */
{
  ['exHola', 'exFruta', 'exCometas'].forEach(fn => {
    if (!new RegExp('function\\s+' + fn + '\\s*\\(').test(engine)) {
      ok = false; console.log('FAIL falta el ejemplo ' + fn + '()');
    }
  });
  if (!/const EXAMPLES = \[[\s\S]{0,600}?exHola[\s\S]{0,200}?exFruta[\s\S]{0,200}?exCometas/.test(engine)) {
    ok = false; console.log('FAIL EXAMPLES no lista los tres ejemplos');
  }
  /* Abrir un ejemplo tiene que crear un proyecto nuevo, nunca pisar el actual. */
  if (!/function\s+openExample\s*\([\s\S]{0,900}?stashActiveProject\(\)[\s\S]{0,600}?projects\.unshift\(/.test(engine)) {
    ok = false; console.log('FAIL openExample() no respalda el proyecto actual ni crea uno nuevo');
  }
  /* Un clon de un personaje escondido nace escondido: el guion del clon tiene
     que mostrar el personaje, o el ejemplo no se ve. */
  if (!/when_clone'\),\s*\n?\s*makeNode\('show'\)/.test(engine.replace(/\r/g, ''))) {
    ok = false; console.log('FAIL los clones de los ejemplos no se muestran al nacer');
  }
  ['examplesBtn', 'exModal', 'exClose', 'exList'].forEach(id => {
    if (!new RegExp('id="' + id + '"').test(html)) {
      ok = false; console.log('FAIL falta #' + id + ' en el editor');
    }
  });
  /* Las claves de la guía tienen que existir en los cuatro idiomas. */
  for (let i = 1; i <= 5; i++) {
    const faltan = langs.filter(l => typeof ctx.EX[l]['exStep' + i] !== 'string' ||
      !ctx.EX[l]['exStep' + i].length);
    if (faltan.length) {
      ok = false; console.log('FAIL exStep' + i + ' falta en ' + faltan.join(', '));
    }
  }
}

/* ---------------- despliegue: Vercel ---------------- */
{
  const vpath = path.join(SRC, 'vercel.json');
  if (!fs.existsSync(vpath)) {
    ok = false; console.log('FAIL falta vercel.json');
  } else {
    try {
      const v = JSON.parse(fs.readFileSync(vpath, 'utf8'));
      const reglas = Array.isArray(v.headers) ? v.headers : [];
      ['sw.js', 'index.html', 'app.html'].forEach(f => {
        const regla = reglas.find(h => String(h.source || '').replace(/^\//, '') === f);
        if (!regla || !(regla.headers || []).some(h =>
          /max-age=0|no-cache/.test(String(h.value || '')))) {
          ok = false; console.log('FAIL vercel.json deja que la CDN cachee /' + f);
        }
      });
      const todas = reglas.reduce((a, h) => a.concat(h.headers || []), []);
      const csp = String((todas.find(h =>
        /content-security-policy/i.test(String(h.key || ''))) || {}).value || '');
      if (!/script-src\s+'self'(?:\s|;)/.test(csp) || /script-src[^;]*unsafe-inline/.test(csp)) {
        ok = false; console.log('FAIL la CSP no aplica script-src \'self\' estricto');
      }
    } catch (e) {
      ok = false; console.log('FAIL vercel.json no es JSON válido: ' + e.message);
    }
  }
  const ign = fs.existsSync(path.join(SRC, '.gitignore')) ?
    fs.readFileSync(path.join(SRC, '.gitignore'), 'utf8') : '';
  if (!/^\.vercel\/$/m.test(ign)) {
    ok = false; console.log('FAIL .gitignore no ignora .vercel/');
  }
  /* El modal «Acerca de» seguía enlazando el sitio viejo en Netlify. Se exige
     la URL pública en el enlace Y en el texto visible: cambiar sólo el href
     deja el dominio viejo a la vista, que es lo que reportó el usuario. */
  ['index.html', 'app.html', 'landing.js', 'boot.js', 'data.js', 'engine.js',
    'README.md', 'manifest.webmanifest'].forEach(f => {
    const txt = fs.readFileSync(path.join(SRC, f), 'utf8');
    if (/netlify/i.test(txt)) {
      ok = false; console.log('FAIL ' + f + ' todavía menciona Netlify');
    }
  });
  const filaSitio = /<a href="([^"]+)"[^>]*>([^<]*)<\/a>/.exec(
    (html.split('data-t="aboutSite"')[1] || '').slice(0, 400));
  if (!filaSitio || filaSitio[1] !== 'https://scrachmo.vercel.app' ||
      filaSitio[2].trim() !== 'scrachmo.vercel.app') {
    ok = false; console.log('FAIL «Acerca de» no enlaza la URL pública de Vercel');
  }
}

/* ---------------- honestidad de los mensajes ----------------
   La categoría se llamó «Multijugador» y prometía «otros jugadores por la red
   local», cuando en realidad sólo escribe en localStorage. Si vuelve a colarse
   alguna de esas frases, la interfaz vuelve a mentir. */
{
  const dataRaw = fs.readFileSync(path.join(SRC, 'data.js'), 'utf8');
  const mentiras = ['Multijugador', 'Multiplayer', 'Multijogador', 'Multijoueur',
    'Jugar entre varios', 'Play together', 'Jogar em grupo', 'Jouer à plusieurs',
    'red local', 'otro jugador', 'otros jugadores', 'other players',
    'outros jogadores', 'autres joueurs'];
  const presentes = mentiras.filter(p => dataRaw.indexOf(p) > -1);
  if (presentes.length) {
    ok = false;
    console.log('FAIL data.js sigue prometiendo multijugador: ' + presentes.join(', '));
  }
}

console.log((ok ? 'OK' : 'FALLO') + ' | claves UI=' + base.length +
  ' | UI_EXTRA=' + exBase.length + ' | data-t=' + tKeys.length +
  ' | data-tt=' + ttKeys.length + ' | bloques=' + ctx.PB.length +
  ' | workflows=' + wfCount + ' | version=' + ctx.AV +
  ' | sin eval/Function=' + (!/\b(?:new\s+)?Function\s*\(/.test(engine)) +
  ' | sin prompt/confirm=' + (nativeCalls.length === 0));
process.exit(ok ? 0 : 1);
