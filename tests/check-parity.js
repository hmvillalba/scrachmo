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
  '\n;this.UIX = UI; this.EX = UI_EXTRA; this.PB = PALETTE_BLOCKS; this.ALLB = BLOCKS; this.BY = BYID;', ctx);

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

const html = fs.readFileSync(path.join(SRC, 'index.html'), 'utf8');
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
/* `anyOpen` es lo que bloquea el scroll: si el modal no está ahí, se abre
   pero la página de atrás se sigue moviendo. Se mira sólo esa declaración,
   porque `about` aparece también en las funciones de al lado. */
const anyOpenDecl = /const anyOpen[\s\S]{0,600}?;/.exec(engine);
if (!anyOpenDecl || !/about/.test(anyOpenDecl[0])) {
  ok = false; console.log('FAIL updateModalLock() no tiene en cuenta el modal «Acerca de»');
}

/* Modo juego: el campo tiene que conservar el 4:3 del mundo (480x360). Si se
   estira, 100 pasos verticales se ven más grandes que 100 horizontales aunque
   los choques se sigan calculando en unidades. */
if (!/body\.game-mode \.stage\{[^}]*aspect-ratio:4 \/ 3/.test(html)) {
  ok = false; console.log('FAIL el campo del modo juego no fija la proporción 4:3');
}
if (!/body\.game-mode \.stage\{[^}]*width:min\(100vw, calc\(100dvh \* 4 \/ 3\)\)/.test(html)) {
  ok = false; console.log('FAIL el campo del modo juego no se limita a la pantalla');
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

console.log((ok ? 'OK' : 'FALLO') + ' | claves UI=' + base.length +
  ' | UI_EXTRA=' + exBase.length + ' | data-t=' + tKeys.length +
  ' | data-tt=' + ttKeys.length + ' | bloques=' + ctx.PB.length +
  ' | workflows=' + wfCount +
  ' | sin eval/Function=' + (!/\b(?:new\s+)?Function\s*\(/.test(engine)) +
  ' | sin prompt/confirm=' + (nativeCalls.length === 0));
process.exit(ok ? 0 : 1);
