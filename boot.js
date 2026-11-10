/* Registro del service worker, fuera del HTML.
   Está en un archivo aparte porque la Content-Security-Policy de Vercel usa
   script-src 'self': un <script> inline sería rechazado. Sólo tiene sentido
   servido por http(s); abierto con doble clic (file://) no hay service worker
   y la app funciona exactamente igual, sin caché. */
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js').catch(function () { /* opcional */ });
  });
}
