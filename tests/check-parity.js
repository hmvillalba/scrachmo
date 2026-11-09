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
  '\n;this.UIX = UI; this.EX = UI_EXTRA; this.PB = PALETTE_BLOCKS;', ctx);

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
