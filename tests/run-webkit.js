/* Corre un subconjunto acotado de la suite en WebKit, el motor de Safari.
   Uso: node tests/run-webkit.js [etiqueta] [solo-este-escenario]
   Idiomas: SCRACHMO_WEBKIT_LANG=es (por defecto), o una lista es,en,pt,fr.

   P2.10 parte B. `tests/run.js` corre los 28 escenarios en cuatro idiomas,
   pero siempre en Chrome: 5652 comprobaciones verdes no dicen nada de lo que
   pasa en un iPhone. Acá se corre UNA vez, en un idioma, con los escenarios
   que tocan las APIs donde WebKit se diferencia: CompressionStream /
   DecompressionStream, createImageBitmap, canvas y WebP, 100dvh,
   DeviceMotionEvent, localStorage y los desplegables del editor.

   Dos diferencias con el runner de Chrome, obligadas por el motor:

   1) WebKit no tiene `--dump-dom` ni `--virtual-time-budget`. Las páginas se
      sirven por HTTP local (igual que en producción, y sin las restricciones
      de `file://` para scripts y almacenamiento) y se espera a que el arnés
      cuelgue su `<pre id="TESTRESULT">`; se lee el texto del DOM vivo.
   2) No se acelera el tiempo: los `tick()` de los arneses corren en tiempo
      real. Por eso el conjunto es corto y no se repite por idioma.

   Playwright es una dependencia SÓLO de las pruebas: vive en tests/ y la
   raíz sigue sin package.json, porque la app no tiene build y Vercel sirve
   los archivos tal cual. Para instalarlo:

     cd tests && npm ci && npx playwright install --with-deps webkit
*/
const http = require('http');
const fs = require('fs');
const path = require('path');
const { build } = require('./build');

let webkit;
try {
  webkit = require('playwright').webkit;
} catch (e) {
  console.error('Falta Playwright. Instalalo con:' +
    '\n  cd tests && npm ci && npx playwright install --with-deps webkit');
  process.exit(2);
}

const tag = process.argv[2] || 'webkit';
const only = process.argv[3] || '';

/* Un solo idioma por defecto: lo que se busca acá es OTRO MOTOR, no repetir
   la matriz de traducciones. El id se valida igual que en run.js: un idioma
   desconocido corta con error en vez de correrse en silencio. */
const TODOS = [
  { id: 'es', locale: 'es-419' },
  { id: 'en', locale: 'en-US' },
  { id: 'pt', locale: 'pt-BR' },
  { id: 'fr', locale: 'fr-FR' }
];
const pedidos = String(process.env.SCRACHMO_WEBKIT_LANG || 'es')
  .split(',').map(s => s.trim()).filter(Boolean);
const desconocidos = pedidos.filter(id => !TODOS.some(l => l.id === id));
const LANGS = TODOS.filter(l => pedidos.indexOf(l.id) > -1);
if (desconocidos.length || !LANGS.length) {
  console.error('SCRACHMO_WEBKIT_LANG inválido: ' + (desconocidos.join(', ') || '(vacío)') +
    '\nDisponibles: ' + TODOS.map(l => l.id).join(', '));
  process.exit(2);
}

/* Los escenarios sensibles. Se mantienen en orden y con su motivo al lado:
   si alguien achica la lista para que dé verde, la guarda de check-parity.js
   exige que estos diez sigan estando. */
const WEBKIT_SET = [
  'harness4',   // createImageBitmap, canvas, WebP→PNG, File y filtro de tipos
  'link',       // ?p=g1.… → DecompressionStream y proyecto compartido
  'harness14',  // .sb3: canvas, MD5, CRC32, ZIP y WAV, más las 3 fases P2.12
  'harness15',  // CompressionStream, inflateLimited() y trampa de foco
  'harness16',  // 100dvh y medición real de la caja 4:3 en modo juego
  'harness23',  // DeviceMotionEvent y PointerEvent táctiles del mando
  'harness24',  // mensajes con nombre
  'harness25',  // listas con nombre
  'harness26',  // procedimientos con nombre
  'landing'     // localStorage, color-scheme del <select> y 100dvh
];

/* Los arneses se protegen con watchdogs de 30/60/90 s calibrados para el
   tiempo virtual de Chrome. En WebKit ese trabajo es REAL y, por ejemplo, la
   compresión de los 200 kB de harness15 puede pasar el minuto cuando el motor
   viene de exportar un .sb3. Se les da un techo común sin editar un arnés:
   la app no tiene ningún setTimeout de 30 s o más, así que el parche sólo
   alcanza a los watchdogs de las pruebas. */
const WATCHDOG_MS = 180000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.txt': 'text/plain; charset=utf-8'
};

/* Servidor mínimo para el directorio que arma build(). Sólo archivos planos:
   path.basename evita que un path con ../ se escape del directorio. */
function serve(T) {
  return new Promise(resolve => {
    const server = http.createServer((req, res) => {
      let name;
      try { name = path.basename(new URL(req.url, 'http://127.0.0.1').pathname); }
      catch (e) { name = ''; }
      const file = path.join(T, name || 'index.html');
      if (!name || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('no existe');
        return;
      }
      res.writeHead(200, {
        'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-store'
      });
      fs.createReadStream(file).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => {
      resolve({ server: server, base: 'http://127.0.0.1:' + server.address().port + '/' });
    });
  });
}

/* build() devuelve URLs file://. Acá se cambia el esquema, no el archivo: el
   link compartido conserva su ?p=g1.… completo. */
function toHttp(base, fileUrl) {
  const u = new URL(fileUrl);
  return base + path.basename(u.pathname) + u.search;
}

async function main() {
  const { T, targets } = build();
  const elegidos = targets.filter(t => WEBKIT_SET.indexOf(t[0]) > -1 &&
    (!only || t[0] === only));
  const faltan = WEBKIT_SET.filter(n => !targets.some(t => t[0] === n));
  if (faltan.length) {
    console.error('tests/build.js no genera estos escenarios: ' + faltan.join(', '));
    return 2;
  }
  if (!elegidos.length) {
    console.error('No hay escenarios para correr (¿only=' + only + ' inexistente?)');
    return 2;
  }

  const srv = await serve(T);
  const browser = await webkit.launch({ headless: true });
  let grandPass = 0, grandFail = 0, grandErr = 0;

  console.log('--- motor: WebKit (Playwright ' +
    require('playwright/package.json').version + ') ---');

  try {
    for (const L of LANGS) {
      console.log('--- idioma: ' + L.id + ' (' + L.locale + ') ---');
      let langPass = 0, langFail = 0, langErr = 0;

      for (const [name, fileUrl] of elegidos) {
        const label = name + ' [wk/' + L.id + ']';
        const base = 'webkit-' + L.id + '-' + name;
        const url = toHttp(srv.base, fileUrl);
        /* Un contexto por escenario: localStorage, service workers y caché no
           se filtran de una página a otra, igual que los perfiles de Chrome. */
        const context = await browser.newContext({
          locale: L.locale,
          viewport: { width: 800, height: 600 },
          deviceScaleFactor: 1,
          serviceWorkers: 'block'
        });
        await context.addInitScript((techo) => {
          const nativo = window.setTimeout;
          window.setTimeout = function (fn, ms) {
            const args = Array.prototype.slice.call(arguments, 2);
            return nativo.apply(window, [fn, typeof ms === 'number' && ms >= 30000 ? techo : ms].concat(args));
          };
        }, WATCHDOG_MS);
        const page = await context.newPage();
        const t0 = Date.now();
        const ruidos = [];
        page.on('pageerror', e => ruidos.push('pageerror: ' + e.message));
        page.on('console', m => {
          if (m.type() === 'error') ruidos.push('console: ' + m.text());
        });

        let body = '', found = false, langDom = '', gotoErr = '';
        try {
          await page.goto(url, { waitUntil: 'load', timeout: 60000 });
        } catch (e) {
          gotoErr = String(e.message || e);
        }
        try {
          /* `attached`, no `visible`: el runner de Chrome lee el DOM con
             --dump-dom, así que un <pre> tapado por el modo juego cuenta
             igual. Con el estado por defecto Playwright esperaría visibilidad
             y un arnés que terminó en game-mode parecería colgado. */
          await page.waitForSelector('#TESTRESULT',
            { state: 'attached', timeout: WATCHDOG_MS + 20000 });
          body = (await page.locator('#TESTRESULT').textContent()) || '';
          found = true;
          langDom = await page.evaluate(() => document.documentElement.lang || '');
        } catch (e) {
          gotoErr += (gotoErr ? ' | ' : '') + String(e.message || e);
        }

        let dom = '';
        try { dom = await page.content(); } catch (e) { /* ya se registró arriba */ }
        fs.writeFileSync(path.join(T, 'dom-' + base + '.html'), dom);
        fs.writeFileSync(path.join(T, 'err-' + base + '.log'),
          'motor=webkit\nurl=' + url + '\nlocale=' + L.locale +
          '\nresultado=' + found + '\ngoto=' + gotoErr +
          '\n--- consola ---\n' + ruidos.join('\n') + '\n');

        const pass = (body.match(/PASS /g) || []).length;
        const fail = (body.match(/FAIL /g) || []).length;
        const err = (body.match(/ERROR /g) || []).length;
        /* Un WATCHDOG no es un FAIL en los arneses, pero sí es una corrida que
           no terminó. Y si no apareció el <pre>, la corrida tampoco puede
           contarse como verde: en el runner de Chrome ese agujero existía. */
        const langOk = !langDom || langDom.indexOf(L.id) === 0;
        const extra = err + (/WATCHDOG:/.test(body) ? 1 : 0) +
          (langOk ? 0 : 1) + (found ? 0 : 1);
        langPass += pass; langFail += fail; langErr += extra;
        console.log(label.padEnd(22) + ' PASS=' + String(pass).padStart(3) +
          ' FAIL=' + String(fail).padStart(2) + ' ERROR=' + String(extra).padStart(2) +
          ' ' + ((Date.now() - t0) / 1000).toFixed(1) + 's' +
          (found ? '' : '  << SIN RESULTADO >>') +
          (langOk ? '' : '  << IDIOMA NO APLICADO: ' + langDom + ' >>'));

        if (fail || extra) {
          const mal = body.split('\n').filter(l => /^(FAIL|ERROR|WATCHDOG)/.test(l)).slice(0, 25);
          mal.forEach(l => console.log('   ' + l));
          mal.forEach(l => console.log('FALLO ' + label + ' :: ' +
            l.replace(/^(FAIL|ERROR)\s*/, '')));
          if (!found) console.log('FALLO ' + label + ' :: sin #TESTRESULT (' + gotoErr + ')');
          if (!langOk) console.log('FALLO ' + label + ' :: el DOM salió en «' + langDom +
            '» y se pidió «' + L.id + '»');
        }
        await context.close();
      }
      console.log('SUBTOTAL ' + L.id + ' PASS=' + langPass + ' FAIL=' + langFail +
        ' ERROR=' + langErr);
      grandPass += langPass; grandFail += langFail; grandErr += langErr;
    }
  } finally {
    await browser.close();
    srv.server.close();
  }

  console.log('TOTAL ' + tag + '-webkit PASS=' + grandPass + ' FAIL=' + grandFail +
    ' ERROR=' + grandErr + '  (' + LANGS.length + ' idioma' +
    (LANGS.length === 1 ? '' : 's') + ' x ' + elegidos.length +
    ' escenarios en WebKit)');
  console.log('Artefactos en ' + T);
  return grandFail + grandErr === 0 ? 0 : 1;
}

main().then(code => process.exit(code)).catch(e => {
  console.error('ERROR ' + (e.stack || e));
  process.exit(1);
});
