/* Comprobaciones de la PWA sin navegador: manifest, iconos, enganche en el
   HTML y contenido del service worker. Es determinista y corre en CI.
   Uso: node tests/pwa-check.js */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SRC = path.resolve(__dirname, '..');
const problems = [];
const notes = [];
let checks = 0;

function ok(cond, msg) {
  checks++;
  if (!cond) problems.push(msg);
  return cond;
}

function read(file) {
  const p = path.join(SRC, file);
  if (!fs.existsSync(p)) { problems.push('falta el archivo ' + file); return ''; }
  return fs.readFileSync(p, 'utf8');
}

/* ---------- manifest ---------- */
let manifest = null;
try {
  manifest = JSON.parse(read('manifest.webmanifest'));
} catch (e) {
  problems.push('manifest.webmanifest no es JSON válido: ' + e.message);
}

if (manifest) {
  ['name', 'short_name', 'start_url', 'display', 'theme_color', 'background_color', 'icons']
    .forEach(k => ok(manifest[k] !== undefined && manifest[k] !== '', 'manifest sin "' + k + '"'));
  ok(manifest.display === 'standalone' || manifest.display === 'fullscreen' ||
    manifest.display === 'minimal-ui', 'manifest: display no es instalable (' + manifest.display + ')');
  ok(String(manifest.start_url).indexOf('http') !== 0, 'start_url debería ser relativa');
  /* La raíz es la LANDING: si la PWA arrancara en "./", instalar ScrachMo
     abriría la presentación en vez del editor. Tiene que entrar directo. */
  ok(String(manifest.start_url).indexOf('app.html') >= 0,
    'manifest: start_url tiene que abrir app.html (la raíz es la landing)');
  ok(String(manifest.id || '').indexOf('app.html') >= 0,
    'manifest: id tendría que identificar al editor, no a la landing');
  ok(manifest.lang === 'es', 'manifest: lang debería ser "es"');
  ok(Array.isArray(manifest.icons) && manifest.icons.length >= 2, 'manifest: hacen falta al menos 2 iconos');

  const icons = Array.isArray(manifest.icons) ? manifest.icons : [];
  const pngs = icons.filter(i => /image\/png/.test(i.type || ''));
  ok(pngs.some(i => i.sizes === '192x192'), 'manifest: falta el icono PNG 192x192');
  ok(pngs.some(i => i.sizes === '512x512'), 'manifest: falta el icono PNG 512x512');
  ok(icons.some(i => /maskable/.test(i.purpose || '')), 'manifest: falta un icono maskable (Android lo recorta)');

  /* Cada icono declarado tiene que existir y, si es PNG, medir lo que dice. */
  icons.forEach(ic => {
    const rel = String(ic.src || '');
    if (!rel) { problems.push('manifest: icono sin src'); return; }
    const p = path.join(SRC, rel);
    if (!fs.existsSync(p)) { problems.push('manifest: el icono ' + rel + ' no existe'); return; }
    if (/image\/png/.test(ic.type || '')) {
      const b = fs.readFileSync(p);
      const png = b.slice(0, 8).toString('hex') === '89504e470d0a1a0a';
      if (!ok(png, rel + ' no es un PNG válido')) return;
      const w = b.readUInt32BE(16), h = b.readUInt32BE(20);
      const declared = /^(\d+)x(\d+)$/.exec(ic.sizes || '');
      if (declared) {
        ok(Number(declared[1]) === w && Number(declared[2]) === h,
          rel + ' mide ' + w + 'x' + h + ' y el manifest dice ' + ic.sizes);
      }
      notes.push(rel + ' ' + w + 'x' + h);
    }
  });
}

/* ---------- enganche en app.html ----------
   index.html es la landing (no carga el motor). Todo lo que hace instalable la
   PWA tiene que estar en el editor. */
const html = read('app.html');
const landing = read('index.html');
const boot = read('boot.js');
const landingJs = read('landing.js');
ok(/<link[^>]+rel="manifest"[^>]+href="manifest\.webmanifest"/.test(html), 'app.html no enlaza el manifest');
ok(/<link[^>]+rel="apple-touch-icon"[^>]+href="icons\/apple-touch-icon\.png"/.test(html), 'app.html sin apple-touch-icon');
ok(/<link[^>]+rel="icon"[^>]+href="icons\/icon\.svg"/.test(html), 'app.html sin favicon');
ok(/<meta[^>]+name="theme-color"/.test(html), 'app.html sin theme-color');
ok(/<meta[^>]+name="apple-mobile-web-app-capable"/.test(html), 'app.html sin apple-mobile-web-app-capable');
ok(/navigator\.serviceWorker\.register\(\s*'sw\.js'\s*\)/.test(boot), 'boot.js no registra sw.js');
ok(/<script src="boot\.js"><\/script>/.test(html), 'app.html no carga boot.js');
ok(/location\.protocol\s*!==\s*'file:'/.test(boot),
  'el registro del service worker no está protegido para file:// (rompería el doble clic)');
ok(/<script src="data\.js"><\/script>\s*<script src="engine\.js"><\/script>/.test(html),
  'data.js y engine.js tienen que cargarse seguidos y en ese orden');
ok(/<script src="engine\.js"><\/script>[\s\S]{0,200}?<script src="boot\.js"><\/script>/.test(html),
  'boot.js tiene que cargarse después de engine.js');

/* ---------- CSP: nada de scripts inline ----------
   vercel.json declara script-src 'self'. Un <script> sin src o un onclick=
   en el HTML quedaría bloqueado en producción y la app se rompería en silencio
   (en los arneses file:// no hay cabeceras, así que sólo se ve en Vercel). */
['app.html', 'index.html'].forEach(f => {
  const txt = f === 'app.html' ? html : landing;
  const inline = (txt.match(/<script(?![^>]*\bsrc=)[^>]*>/gi) || []);
  ok(inline.length === 0, f + ' tiene ' + inline.length + ' <script> inline (la CSP los bloquea)');
  ok(!/\son(?:click|change|input|load|submit|error|focus|blur)\s*=/i.test(txt),
    f + ' tiene manejadores inline (onclick, oninput…), prohibidos por la CSP');
});
ok(/content-security-policy/i.test(read('vercel.json')), 'vercel.json no declara CSP');

/* ---------- la landing y el enlace directo ---------- */
ok(/<script src="landing\.js"><\/script>/.test(landing), 'index.html no carga landing.js');
ok(/href="app\.html"/.test(landing), 'la landing no enlaza la app');
ok(/id="shareApp"/.test(landing) && /id="appUrl"/.test(landing),
  'la landing no ofrece copiar/compartir el enlace directo');
ok(/app\.html/.test(landingJs) && /[?&]p=/.test(landingJs),
  'landing.js no redirige los links ?p= viejos al editor');

/* ---------- service worker ---------- */
const sw = read('sw.js');
try {
  new vm.Script(sw, { filename: 'sw.js' });
} catch (e) {
  problems.push('sw.js no compila: ' + e.message);
}

const ver = /const VERSION = '([^']+)'/.exec(sw);
ok(!!ver && ver[1].length > 3, 'sw.js sin VERSION');
ok(/^scrachmo-v\d+-[0-9a-f]{8}$/.test(ver ? ver[1] : ''),
  'sw.js: VERSION no lleva la versión y la huella de los archivos (corré node tests/bump-sw.js)');

const assetsBlock = /const ASSETS = \[([\s\S]*?)\];/.exec(sw);
if (ok(!!assetsBlock, 'sw.js sin la lista ASSETS')) {
  const assets = (assetsBlock[1].match(/'([^']+)'/g) || []).map(s => s.slice(1, -1));
  ok(assets.length >= 6, 'ASSETS tiene muy pocos archivos (' + assets.length + ')');
  ['index.html', 'app.html', 'landing.js', 'boot.js', 'data.js', 'engine.js',
    'manifest.webmanifest']
    .forEach(f => ok(assets.indexOf(f) >= 0, 'ASSETS no incluye ' + f));
  ok(assets.some(a => /^icons\/.*\.png$/.test(a)), 'ASSETS no incluye ningún icono PNG');
  assets.forEach(a => {
    if (a === './') return;
    ok(fs.existsSync(path.join(SRC, a)), 'ASSETS pide ' + a + ', que no existe (addAll fallaría)');
  });
  notes.push('ASSETS ' + assets.length);
}

ok(/addEventListener\('install'/.test(sw) && /addEventListener\('activate'/.test(sw) &&
  /addEventListener\('fetch'/.test(sw), 'sw.js no maneja install/activate/fetch');
ok(/ignoreSearch:\s*true/.test(sw), 'sw.js no ignora la query: los links ?p= no abrirían offline');
ok(/mode === 'navigate'/.test(sw), 'sw.js no contempla la navegación (shell offline)');
ok(/caches\.keys\(\)/.test(sw), 'sw.js no limpia cachés viejas al activarse');

/* ---------- despliegue en Vercel ----------
   Si la CDN cachea sw.js, el navegador nunca ve una versión nueva y la app
   instalada se queda vieja para siempre. Vercel no lo adivina: hay que
   pedirlo en vercel.json. */
let vc = null;
try {
  vc = JSON.parse(read('vercel.json'));
} catch (e) {
  problems.push('vercel.json no es JSON válido: ' + e.message);
}
if (vc) {
  const reglas = Array.isArray(vc.headers) ? vc.headers : [];
  ok(reglas.length > 0, 'vercel.json no declara headers');
  ['sw.js', 'index.html', 'app.html'].forEach(f => {
    const regla = reglas.find(h => String(h.source || '').replace(/^\//, '') === f);
    ok(!!regla, 'vercel.json no tiene una regla para /' + f);
    ok(!!regla && (regla.headers || []).some(h =>
      /max-age=0|no-cache/.test(String(h.value || ''))),
      'vercel.json deja que la CDN cachee /' + f);
  });
  /* CSP global: tiene que existir y NO permitir scripts inline. Si se afloja
     script-src, volver a meter un <script> en el HTML pasa desapercibido. */
  const todas = reglas.flatMap(h => h.headers || []);
  const csp = String((todas.find(h => /content-security-policy/i.test(h.key || '')) || {}).value || '');
  ok(!!csp, 'vercel.json no declara Content-Security-Policy');
  ok(/default-src\s+'self'/.test(csp), 'la CSP no tiene default-src \'self\'');
  ok(/script-src\s+'self'(?:\s|;)/.test(csp) && !/script-src[^;]*unsafe-inline/.test(csp),
    'la CSP permite scripts inline (script-src no es estrictamente \'self\')');
  ok(/worker-src\s+'self'/.test(csp), 'la CSP no permite el service worker (worker-src)');
  ok(/img-src[^;]*blob:/.test(csp) && /img-src[^;]*data:/.test(csp),
    'la CSP bloquea las imágenes data:/blob: de disfraces y SVG');
}

/* ---------- resumen ---------- */
function finish() {
  if (problems.length) {
    problems.forEach(p => console.log('FAIL ' + p));
    console.log('PWA FAIL=' + problems.length);
    process.exit(1);
  }
  console.log('OK | PWA ' + checks + ' comprobaciones | manifest, iconos, enganche, service worker y ' +
    notes.join(' + '));
}

/* ---------- servido real por HTTP ---------- */
/* Vercel sirve la raíz, pero GitHub Pages sirve desde una subcarpeta y con
   MIME propios. Acá se levanta un servidor igual y se piden las rutas
   críticas con rutas relativas: si alguna quedara absoluta (/data.js), en un
   subdirectorio daría 404. */
const http = require('http');
const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  const name = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
  const file = name === '/' ? 'index.html' : name.replace(/^\/+/, '');
  const p = path.join(SRC, file);
  if (!p.startsWith(SRC) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) {
    res.writeHead(404); return res.end('no encontrado');
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});

(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port;
  const routes = [
    ['/', /text\/html/],
    ['/?p=g1.abc', /text\/html/],
    ['/app.html', /text\/html/],
    ['/app.html?p=g1.abc', /text\/html/],
    ['/landing.js', /javascript/],
    ['/boot.js', /javascript/],
    ['/data.js', /javascript/],
    ['/engine.js', /javascript/],
    ['/manifest.webmanifest', /application\/manifest\+json/],
    ['/sw.js', /javascript/],
    ['/icons/icon-192.png', /image\/png/],
    ['/icons/icon-512.png', /image\/png/],
    ['/icons/apple-touch-icon.png', /image\/png/],
    ['/icons/icon.svg', /image\/svg\+xml/]
  ];
  for (const [route, mime] of routes) {
    try {
      const res = await fetch(base + route);
      ok(res.status === 200, 'HTTP ' + route + ' devolvió ' + res.status);
      const ct = res.headers.get('content-type') || '';
      ok(mime.test(ct), 'HTTP ' + route + ' con content-type "' + ct + '"');
    } catch (e) {
      problems.push('HTTP ' + route + ' falló: ' + e.message);
    }
  }
  server.close();
  notes.push(routes.length + ' rutas HTTP');
  finish();
})();
