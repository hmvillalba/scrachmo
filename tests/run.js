/* Corre toda la suite en Chrome headless y cuenta PASS / FAIL / ERROR.
   Uso: node tests/run.js [etiqueta] [solo-este-harness]
   La ruta de Chrome se puede forzar con la variable CHROME_PATH. */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { build } = require('./build');

const tag = process.argv[2] || 'run';
const only = process.argv[3] || '';

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
  /* En Linux suele estar en el PATH; dejar que spawnSync lo resuelva. */
  return 'google-chrome';
}

const CHROME = findChrome();
const { T, targets } = build();
const selected = targets.filter(t => !only || t[0] === only);

let totalPass = 0, totalFail = 0, totalErr = 0;
for (const [name, url] of selected) {
  const profile = path.join(T, tag + '-' + name);
  const args = [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run',
    '--disable-dev-shm-usage', '--disable-extensions', '--disable-background-networking',
    '--user-data-dir=' + profile,
    '--virtual-time-budget=25000', '--dump-dom', url
  ];
  const r = spawnSync(CHROME, args, { encoding: 'utf8', maxBuffer: 40 * 1024 * 1024, timeout: 180000 });
  const dom = r.stdout || '';
  fs.writeFileSync(path.join(T, 'dom-' + tag + '-' + name + '.html'), dom);
  fs.writeFileSync(path.join(T, 'err-' + tag + '-' + name + '.log'),
    (r.stderr || '') + '\nstatus=' + r.status + '\nerror=' + (r.error ? String(r.error) : ''));
  const m = dom.match(/<pre id="TESTRESULT">([\s\S]*?)<\/pre>/);
  const body = m ? m[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&') : '';
  const pass = (body.match(/PASS /g) || []).length;
  const fail = (body.match(/FAIL /g) || []).length;
  const err = (body.match(/ERROR /g) || []).length;
  totalPass += pass; totalFail += fail; totalErr += err;
  console.log(name.padEnd(9) + ' PASS=' + String(pass).padStart(3) +
    ' FAIL=' + String(fail).padStart(2) + ' ERROR=' + String(err).padStart(2) +
    (m ? '' : '  << SIN RESULTADO >>'));
  if (fail || err || !m) {
    body.split('\n').filter(l => /^(FAIL|ERROR)/.test(l)).slice(0, 25).forEach(l => console.log('   ' + l));
    if (!m) console.log('   ' + fs.readFileSync(path.join(T, 'err-' + tag + '-' + name + '.log'), 'utf8').slice(-400));
  }
}
console.log('TOTAL ' + tag + ' PASS=' + totalPass + ' FAIL=' + totalFail + ' ERROR=' + totalErr);
console.log('Artefactos en ' + T);
process.exit(totalFail + totalErr === 0 && selected.length ? 0 : 1);
