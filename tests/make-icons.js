/* Genera los PNG del icono a partir de icons/icon.svg usando Chrome headless.
   Uso: node tests/make-icons.js
   Se corre a mano cuando cambia el diseño; los PNG quedan commiteados. */
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const SRC = path.resolve(__dirname, '..');
const OUT = path.join(SRC, 'icons');
const svg = fs.readFileSync(path.join(OUT, 'icon.svg'), 'utf8');

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  ].filter(Boolean);
  for (const p of candidates) if (fs.existsSync(p)) return p;
  return 'google-chrome';
}

/* El icono maskable necesita el contenido dentro del 80% central para que
   Android pueda recortarlo en círculo sin comerse el dibujo. */
function page(size, scale) {
  const inner = scale === 1
    ? svg
    : svg.replace('<rect width="512" height="512" fill="url(#bg)"/>',
      '<rect width="512" height="512" fill="url(#bg)"/>' +
      '<g transform="translate(256 256) scale(' + scale + ') translate(-256 -256)">')
      .replace('</svg>', '</g></svg>');
  const sized = inner.replace('width="512" height="512"', 'width="' + size + '" height="' + size + '"');
  return '<!doctype html><html><head><meta charset="utf-8"><style>' +
    'html,body{margin:0;padding:0;background:#4338ca}svg{display:block}' +
    '</style></head><body>' + sized + '</body></html>';
}

const CHROME = findChrome();
const T = fs.mkdtempSync(path.join(os.tmpdir(), 'scrachmo-icons-'));
const jobs = [
  ['icon-512.png', 512, 1],
  ['icon-192.png', 192, 1],
  ['apple-touch-icon.png', 180, 1],
  ['icon-maskable-512.png', 512, 0.72]
];

let bad = 0;
for (const [file, size, scale] of jobs) {
  const html = path.join(T, file.replace(/\.png$/, '.html'));
  fs.writeFileSync(html, page(size, scale));
  const r = spawnSync(CHROME, [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run',
    '--hide-scrollbars', '--force-device-scale-factor=1',
    '--window-size=' + size + ',' + size,
    '--virtual-time-budget=4000',
    '--screenshot=' + path.join(OUT, file),
    'file:///' + html.replace(/\\/g, '/')
  ], { encoding: 'utf8', timeout: 120000 });
  const dest = path.join(OUT, file);
  const ok = fs.existsSync(dest) && fs.statSync(dest).size > 1000;
  console.log((ok ? 'OK  ' : 'FAIL') + ' ' + file + ' ' + size + 'x' + size +
    (r.stderr && !ok ? '  ' + String(r.stderr).slice(-200) : ''));
  if (!ok) bad++;
}
process.exit(bad ? 1 : 0);
