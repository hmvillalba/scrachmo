/* Genera las páginas de prueba en un directorio temporal del sistema.
   No escribe nada dentro del repo: los HTML, los DOM y los perfiles de
   Chrome quedan en os.tmpdir(), así el working tree sigue limpio. */
const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const { pathToFileURL } = require('url');

const SRC = path.resolve(__dirname, '..');
const HARNESS = [
  'harness.js', 'harness2.js', 'harness3.js', 'harness4.js',
  'harness5.js', 'harness6.js', 'harness7.js', 'harness8.js',
  'harness9.js', 'harness10.js', 'harness11.js', 'harness12.js', 'harness13.js', 'harness14.js',
  'harness15.js', 'harness16.js', 'harness17.js'
];

function build() {
  /* En CI conviene un directorio fijo dentro del workspace para poder subir
     los artefactos; en local, uno nuevo por corrida en el temporal. */
  const fixed = process.env.SCRACHMO_TMP;
  let T;
  if (fixed) {
    T = path.resolve(fixed);
    fs.mkdirSync(T, { recursive: true });
  } else {
    T = fs.mkdtempSync(path.join(os.tmpdir(), 'scrachmo-smoke-'));
  }
  for (const f of ['data.js', 'engine.js']) {
    fs.copyFileSync(path.join(SRC, f), path.join(T, f));
  }
  for (const f of HARNESS) {
    fs.copyFileSync(path.join(__dirname, f), path.join(T, f));
  }

  const early = '<script>window.__ERRORS__=[];' +
    'window.addEventListener("error",function(e){window.__ERRORS__.push(String(e.message));});' +
    'window.addEventListener("unhandledrejection",function(e){window.__ERRORS__.push("rejection: "+String(e.reason));});' +
    '<\/script>\n';

  const html = fs.readFileSync(path.join(SRC, 'index.html'), 'utf8');
  const dataTag = '<script src="data.js"></script>';
  const engineTag = '<script src="engine.js"></script>';
  if (html.indexOf(dataTag) < 0 || html.indexOf(engineTag) < 0) {
    throw new Error('No se encontraron los tags de data.js / engine.js en index.html');
  }
  const base = html.replace(dataTag, early + dataTag);

  const targets = [];
  for (const harness of HARNESS) {
    const page = harness.replace(/\.js$/, '.html');
    const out = base.replace(engineTag, engineTag + '\n<script src="' + harness + '"></script>');
    fs.writeFileSync(path.join(T, page), out);
    targets.push([page.replace(/\.html$/, ''), pathToFileURL(path.join(T, page)).href]);
  }

  /* Link compartido real: mismo formato g1.<gzip base64url> que genera la app. */
  const PNG1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==';
  const payload = {
    version: '2.0',
    sprites: [{
      id: 'sl', name: 'ProyectoLink', emoji: '', x: 0, y: 0, dir: 90, size: 100,
      visible: true, rot: 'all',
      costumes: [
        { id: 'c1', kind: 'emoji', src: '🐱', name: 'Gato' },
        { id: 'c2', kind: 'img', src: PNG1, name: 'Foto' }
      ],
      costumeIndex: 1,
      code: [{ id: 'bxy', type: 'go_xy', val: '88,-42' }]
    }],
    variables: {}, hidden: [], stageBg: 3, showScore: true,
    score: 77, multiOn: false, selected: 'sl'
  };
  const gz = zlib.gzipSync(Buffer.from(JSON.stringify(payload), 'utf8'));
  const code = 'g1.' + gz.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const link = targets.find(t => t[0] === 'harness4')[1] + '?p=' + code;
  fs.writeFileSync(path.join(T, 'link.txt'), link);
  targets.push(['link', link]);

  return { T: T, targets: targets, link: link };
}

module.exports = { build: build };

if (require.main === module) {
  const r = build();
  console.log('Directorio de trabajo: ' + r.T);
  r.targets.forEach(t => console.log('  ' + t[0] + ' -> ' + t[1]));
}
