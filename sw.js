/* Service worker de ScrachMo.
   Objetivo: que la APP abra sin internet y se pueda instalar en el celular.

   Hay dos páginas: index.html es la landing y app.html es el editor. La PWA
   instalada entra directo al editor (manifest.start_url = ./app.html), así que
   el shell que se sirve offline para la app es app.html. La landing también
   queda en caché para que la raíz funcione sin red.

   Los links viejos compartidos apuntaban a la raíz con ?p=. La landing los
   redirige con landing.js, pero sin conexión es más rápido servir app.html
   directamente desde acá: el editor lee ?p= igual que antes.

   Las NAVEGACIONES van red primero y caché como respaldo: así una versión
   nueva se ve al recargar y no a la segunda vuelta. Los archivos (JS, CSS,
   iconos) siguen saliendo de la caché, que es lo que hace que abra rápido.

   NO EDITAR VERSION A MANO: corré `node tests/bump-sw.js`. El nombre de la
   caché lleva la versión visible y una huella de todos los archivos que la
   caché sirve; tests/check-parity.js falla si la huella está desactualizada.
   En Vercel, vercel.json evita que la CDN cachee este archivo. */

const VERSION = 'scrachmo-v11-c8bc47c7';

/* Todo lo que se pide en install tiene que existir: si un solo archivo falta,
   addAll() rechaza y el service worker no se instala. */
const ASSETS = [
  './',
  'index.html',
  'app.html',
  'landing.js',
  'boot.js',
  'data.js',
  'engine.js',
  'manifest.webmanifest',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png'
];

function shellPara(url) {
  /* ?p= en la raíz = proyecto compartido con la URL vieja: abrir el editor.
     Cualquier otra navegación que no sea app.html cae en la landing. */
  const comparte = url.searchParams.has('p');
  const esApp = comparte || /\/app\.html$/.test(url.pathname);
  return {
    nombre: esApp ? 'app.html' : 'index.html',
    /* No se puede guardar como app.html la respuesta de /?p=: en la red eso
       devuelve la LANDING y guardarla ahí rompería la PWA. */
    refrescar: comparte ? /\/app\.html$/.test(url.pathname) : true
  };
}

/* Si la red no contesta, se usa el shell guardado en vez de dejar la pantalla
   en blanco. Cuatro segundos es más que cualquier 3G decente y menos que la
   paciencia de quien abre la app en el colectivo. */
const NAV_TIMEOUT_MS = 4000;

function conLimite(promesa, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    promesa.then(
      v => { clearTimeout(t); resolve(v); },
      e => { clearTimeout(t); reject(e); }
    );
  });
}

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
  const shell = shellPara(url);

  event.respondWith((async () => {
    const cache = await caches.open(VERSION);

    /* Navegación: RED PRIMERO y la caché como respaldo.
       Al revés (caché primero) una versión nueva sólo se veía a la segunda
       recarga, o nunca si el service worker anterior seguía mandando: el
       síntoma es «recargo y me sigue apareciendo la página vieja». Sin
       conexión, o si la red tarda más de NAV_TIMEOUT_MS, sale el shell
       guardado, que es lo que hace que la app abra igual. */
    if (req.mode === 'navigate') {
      const guardada = await cache.match(shell.nombre, { ignoreSearch: true });

      /* Sin red conocida no tiene sentido esperar: el shell sale al instante. */
      if (self.navigator && self.navigator.onLine === false) {
        if (guardada) return guardada;
      }

      try {
        const red = await conLimite(fetch(req), NAV_TIMEOUT_MS);
        if (red && red.ok) {
          if (shell.refrescar) cache.put(shell.nombre, red.clone());
          return red;
        }
        if (guardada) return guardada;
        return red;
      } catch (err) {
        if (guardada) return guardada;
        throw err;
      }
    }

    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;

    try {
      const res = await fetch(req);
      if (res && res.ok && res.type === 'basic') cache.put(req, res.clone());
      return res;
    } catch (err) {
      const pagina = await cache.match(shell.nombre, { ignoreSearch: true });
      if (pagina && req.mode === 'navigate') return pagina;
      throw err;
    }
  })());
});
