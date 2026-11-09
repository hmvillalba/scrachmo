/* Ejercita la lógica real de sw.js sin navegador: se ejecuta el archivo en un
   contexto con stubs de self, caches y fetch, y se disparan install, activate
   y fetch como lo haría Chrome. Así se comprueba el comportamiento (qué se
   guarda, qué se sirve offline y qué se deja pasar), no sólo la sintaxis.
   Uso: node tests/pwa-sw.js */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SRC = path.resolve(__dirname, '..');
const code = fs.readFileSync(path.join(SRC, 'sw.js'), 'utf8');
const ORIGIN = 'https://ejemplo.test';

const problems = [];
let checks = 0;
function ok(cond, msg) {
  checks++;
  if (!cond) problems.push(msg);
}

/* ---------- dobles de prueba ---------- */
function makeCache() {
  const store = new Map();
  const abs = u => new URL(typeof u === 'string' ? u : u.url, ORIGIN + '/').href;
  const keyOf = (req, opts) => {
    const href = abs(req);
    return opts && opts.ignoreSearch ? href.split('?')[0] : href;
  };
  return {
    store,
    addAll(urls) {
      urls.forEach(u => store.set(keyOf(u), { url: abs(u), ok: true, type: 'basic' }));
      return Promise.resolve();
    },
    put(req, res) { store.set(keyOf(req), res); return Promise.resolve(); },
    match(req, opts) { return Promise.resolve(store.get(keyOf(req, opts)) || undefined); },
    keys() { return Promise.resolve(Array.from(store.keys())); }
  };
}

const caches = (() => {
  const boxes = new Map();
  return {
    open(name) {
      if (!boxes.has(name)) boxes.set(name, makeCache());
      return Promise.resolve(boxes.get(name));
    },
    keys() { return Promise.resolve(Array.from(boxes.keys())); },
    delete(name) { return Promise.resolve(boxes.delete(name)); },
    has(name) { return Promise.resolve(boxes.has(name)); },
    _boxes: boxes
  };
})();

const listeners = {};
const self = {
  location: { origin: ORIGIN },
  addEventListener(type, fn) { (listeners[type] = listeners[type] || []).push(fn); },
  skipWaiting() { self._skipWaiting = true; return Promise.resolve(); },
  clients: { claim() { self._claimed = true; return Promise.resolve(); } }
};

const fetched = [];
function fakeFetch(input) {
  const url = typeof input === 'string' ? input : (input && input.url);
  fetched.push(url);
  return Promise.resolve({
    ok: true, status: 200, type: 'basic', url: url,
    clone() { return this; }
  });
}

const ctx = vm.createContext({
  self: self,
  caches: caches,
  fetch: fakeFetch,
  URL: URL,
  Promise: Promise,
  console: console
});

try {
  new vm.Script(code, { filename: 'sw.js' }).runInContext(ctx);
} catch (e) {
  console.log('FAIL sw.js no se pudo ejecutar: ' + e.message);
  process.exit(1);
}

const hasHandler = type => Array.isArray(listeners[type]) && listeners[type].length > 0;
ok(hasHandler('install'), 'sw.js no registra el handler install');
ok(hasHandler('activate'), 'sw.js no registra el handler activate');
ok(hasHandler('fetch'), 'sw.js no registra el handler fetch');

/* ---------- helpers para disparar eventos ---------- */
async function fire(type, extra) {
  const waits = [];
  const event = Object.assign({
    waitUntil(p) { waits.push(p); },
    respondWith(p) { event._response = p; }
  }, extra);
  (listeners[type] || []).forEach(fn => fn(event));
  await Promise.all(waits);
  return event;
}

function request(url, mode) {
  const u = new URL(url, ORIGIN + '/');
  return { url: u.href, method: 'GET', mode: mode || 'cors' };
}

(async () => {
  /* install: precarga la lista y toma el control sin esperar a que se cierren
     las pestañas viejas. */
  await fire('install', {});
  ok(self._skipWaiting === true, 'install no llama a skipWaiting()');
  const cache = await caches.open('scrachmo-v1');
  const saved = await cache.keys();
  ok(saved.length >= 8, 'install guardó muy pocos archivos (' + saved.length + ')');
  ['index.html', 'data.js', 'engine.js', 'manifest.webmanifest', 'icons/icon-512.png']
    .forEach(f => ok(saved.some(u => u.endsWith('/' + f)), 'install no guardó ' + f));

  /* activate: borra cachés viejas y toma el control de las pestañas. */
  const vieja = await caches.open('scrachmo-v0');
  await vieja.put('index.html', { ok: true });
  await fire('activate', {});
  ok(self._claimed === true, 'activate no llama a clients.claim()');
  ok((await caches.keys()).indexOf('scrachmo-v0') < 0, 'activate no borró la caché vieja');
  ok((await caches.keys()).indexOf('scrachmo-v1') >= 0, 'activate borró la caché actual');

  /* fetch de navegación con ?p=: tiene que salir el shell guardado. */
  const nav = await fire('fetch', { request: request('/?p=g1.abc', 'navigate') });
  ok(!!nav._response, 'el handler de fetch no llamó a respondWith en la navegación');
  let served = nav._response ? await nav._response : null;
  if (served) {
    ok(!!served.url && served.url.endsWith('/index.html'), 'navegación con ?p= no salió del shell cacheado (' + (served && served.url) + ')');
  } else {
    ok(false, 'la navegación no devolvió respuesta');
  }

  /* Un archivo de la app se sirve desde la caché. */
  const js = await fire('fetch', { request: request('/data.js') });
  served = js._response ? await js._response : null;
  ok(!!served && String(served.url).endsWith('/data.js'), 'data.js no se sirvió desde la caché');

  /* Otro origen: se deja pasar, no se cachea ni se intercepta. */
  const antes = fetched.length;
  const ajeno = await fire('fetch', { request: request('https://otro.example/x.js') });
  ok(ajeno._response === undefined, 'interceptó una petición de otro origen');
  ok(fetched.length === antes, 'pidió a la red una petición de otro origen');

  /* POST no se toca. */
  const post = await fire('fetch', { request: { url: ORIGIN + '/x', method: 'POST', mode: 'cors' } });
  ok(post._response === undefined, 'interceptó un POST');

  if (problems.length) {
    problems.forEach(p => console.log('FAIL ' + p));
    console.log('PWA-SW checks=' + checks + ' FAIL=' + problems.length);
    process.exit(1);
  }
  console.log('OK | PWA service worker: install (' + saved.length + ' archivos), activate, navegación ?p= offline, caché de assets y respeto por otros orígenes y POST');
})();
