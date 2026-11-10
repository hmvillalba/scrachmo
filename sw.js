/* Service worker de ScrachMo.
   Objetivo: que la app abra sin internet y se pueda instalar en el celular.
   La app es estática, así que alcanza con guardar los pocos archivos que usa.
   Si algo falla, la app sigue funcionando desde la red: nunca es requisito.

   NO EDITAR VERSION A MANO: corré `node tests/bump-sw.js`. El nombre de la
   caché lleva la versión visible y una huella de index.html + data.js +
   engine.js; tests/check-parity.js falla si la huella está desactualizada.
   En Vercel, vercel.json evita que la CDN cachee este archivo. */

const VERSION = 'scrachmo-v10-7c473aa5';

/* Todo lo que se pide en install tiene que existir: si un solo archivo falta,
   addAll() rechaza y el service worker no se instala. */
const ASSETS = [
  './',
  'index.html',
  'data.js',
  'engine.js',
  'manifest.webmanifest',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(VERSION)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  /* Lo que no es de este origen (links compartidos a otros sitios, por ejemplo)
     se deja pasar tal cual. */
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(VERSION);

    /* Navegación: siempre el index guardado, aunque la URL traiga ?p=<link>.
       Es lo que hace que un proyecto compartido abra igual estando offline. */
    if (req.mode === 'navigate') {
      const shell = await cache.match('index.html', { ignoreSearch: true });
      if (shell) {
        fetch(req).then(res => {
          if (res && res.ok) cache.put('index.html', res.clone());
        }).catch(() => {});
        return shell;
      }
    }

    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;

    try {
      const res = await fetch(req);
      if (res && res.ok && res.type === 'basic') cache.put(req, res.clone());
      return res;
    } catch (err) {
      const shell = await cache.match('index.html', { ignoreSearch: true });
      if (shell && req.mode === 'navigate') return shell;
      throw err;
    }
  })());
});
