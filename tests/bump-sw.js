/* Mantiene juntas la versión visible (data.js) y la caché de la PWA (sw.js).

   El service worker sirve index.html, data.js y engine.js desde la caché sin
   revalidar. Si esos archivos cambian y sw.js queda igual, el navegador ni
   siquiera reinstala: la app instalada se queda vieja indefinidamente. Por eso
   el nombre de la caché lleva una huella de los tres archivos y
   tests/check-parity.js falla si la huella no coincide.

   Uso: node tests/bump-sw.js [vNN]
   Sin argumento sube un número; con argumento fija la versión (ej. v11).
   No hay que editar sw.js a mano. */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SRC = path.resolve(__dirname, '..');
/* sw.js no entra en la huella: si entrara, cambiar VERSION cambiaría la huella
   y habría que recalcularla infinitamente. Son los archivos que la caché sirve. */
const RUNTIME = ['index.html', 'data.js', 'engine.js'];

const read = f => fs.readFileSync(path.join(SRC, f), 'utf8');

/* Se normalizan los finales de línea: data.js es CRLF en Windows y LF en el
   checkout de CI, y la huella tiene que dar igual en las dos máquinas. */
function buildHash() {
  const h = crypto.createHash('sha256');
  RUNTIME.forEach(f => {
    const text = read(f).replace(/\r\n/g, '\n');
    h.update(f + '\0' + text.length + '\0' + text + '\0');
  });
  return h.digest('hex').slice(0, 8);
}

function currentVersion() {
  const m = /const APP_VERSION = '(v\d+)'/.exec(read('data.js'));
  return m ? m[1] : 'v0';
}

function bump(wanted) {
  const next = wanted || 'v' + (Number(currentVersion().slice(1)) + 1);
  if (!/^v\d+$/.test(next)) throw new Error('La versión tiene que ser vNN (ej. v11)');

  /* 1) Versión visible. Se reemplaza sólo el literal: así data.js conserva
        sus CRLF y el diff no toca las 1300 líneas del archivo. */
  const dataPath = path.join(SRC, 'data.js');
  const data = read('data.js');
  const versionRe = /const APP_VERSION = 'v\d+';/;
  if (!versionRe.test(data)) throw new Error('No encontré APP_VERSION en data.js');
  const data2 = data.replace(versionRe, "const APP_VERSION = '" + next + "';");
  fs.writeFileSync(dataPath, data2, 'utf8');

  /* 2) Nombre de la caché, ya con la huella del data.js definitivo. */
  const hash = buildHash();
  const cache = 'scrachmo-' + next + '-' + hash;
  const swPath = path.join(SRC, 'sw.js');
  const sw = read('sw.js');
  const versionSwRe = /const VERSION = '[^']+';/;
  if (!versionSwRe.test(sw)) throw new Error('No encontré VERSION en sw.js');
  const sw2 = sw.replace(versionSwRe, "const VERSION = '" + cache + "';");
  fs.writeFileSync(swPath, sw2, 'utf8');

  return { version: next, hash: hash, cache: cache };
}

module.exports = { buildHash: buildHash, currentVersion: currentVersion, bump: bump, RUNTIME: RUNTIME };

if (require.main === module) {
  const r = bump(process.argv[2]);
  console.log('OK | data.js APP_VERSION=' + r.version + ' | sw.js VERSION=' + r.cache);
  console.log('    Huella de ' + RUNTIME.join(' + ') + ': ' + r.hash);
}
