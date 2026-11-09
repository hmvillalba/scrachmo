/* Corre toda la suite en Chrome headless y cuenta PASS / FAIL / ERROR.
   Uso: node tests/run.js [etiqueta] [solo-este-harness]
   La ruta de Chrome se puede forzar con CHROME_PATH.
   El directorio de las páginas se puede fijar con SCRACHMO_TMP.

   Si Chrome no imprime el DOM se reintenta con el headless clásico: según la
   versión, `--headless=new` puede no estar soportado y entonces `--dump-dom`
   no devuelve nada (es lo que hacía fallar al runner sin dejar rastro). */
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
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

function decode(html) {
  return html.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

const CHROME = findChrome();
const { T, targets } = build();
const selected = targets.filter(t => !only || t[0] === only);

/* Los perfiles de Chrome van al temporal del sistema y no al directorio de
   artefactos: son cientos de archivos que no sirven para diagnosticar. */
const PROFILES = fs.mkdtempSync(path.join(os.tmpdir(), 'scrachmo-profile-'));

function launch(url, headless, profile) {
  const args = [
    headless, '--disable-gpu', '--no-sandbox', '--no-first-run',
    '--disable-dev-shm-usage', '--disable-extensions', '--disable-background-networking',
    '--user-data-dir=' + profile,
    '--virtual-time-budget=25000', '--dump-dom', url
  ];
  const r = spawnSync(CHROME, args, { encoding: 'utf8', maxBuffer: 40 * 1024 * 1024, timeout: 180000 });
  const dom = r.stdout || '';
  const m = dom.match(/<pre id="TESTRESULT">([\s\S]*?)<\/pre>/);
  return {
    dom: dom,
    body: m ? decode(m[1]) : '',
    found: !!m,
    headless: headless,
    status: r.status,
    error: r.error ? String(r.error) : '',
    stderr: r.stderr || ''
  };
}

let totalPass = 0, totalFail = 0, totalErr = 0;
for (const [name, url] of selected) {
  let r = launch(url, '--headless=new', path.join(PROFILES, tag + '-' + name));
  if (!r.found) {
    /* Reintento con el headless clásico, que sigue siendo el único válido en
       algunas versiones de Chrome empaquetadas en Linux. */
    r = launch(url, '--headless', path.join(PROFILES, tag + '-' + name + '-old'));
  }
  fs.writeFileSync(path.join(T, 'dom-' + tag + '-' + name + '.html'), r.dom);
  fs.writeFileSync(path.join(T, 'err-' + tag + '-' + name + '.log'),
    'chrome=' + CHROME + '\nflags=' + r.headless +
    '\nstatus=' + r.status + '\nerror=' + r.error +
    '\ndomBytes=' + r.dom.length + '\n--- stderr ---\n' + r.stderr.slice(-2000) + '\n');

  const pass = (r.body.match(/PASS /g) || []).length;
  const fail = (r.body.match(/FAIL /g) || []).length;
  const err = (r.body.match(/ERROR /g) || []).length;
  totalPass += pass; totalFail += fail; totalErr += err;
  console.log(name.padEnd(9) + ' PASS=' + String(pass).padStart(3) +
    ' FAIL=' + String(fail).padStart(2) + ' ERROR=' + String(err).padStart(2) +
    (r.found ? '' : '  << SIN RESULTADO >>'));
  if (fail || err || !r.found) {
    r.body.split('\n').filter(l => /^(FAIL|ERROR)/.test(l)).slice(0, 25).forEach(l => console.log('   ' + l));
    if (!r.found) {
      console.log('   chrome=' + CHROME + ' flags=' + r.headless +
        ' status=' + r.status + ' error=' + r.error + ' dom=' + r.dom.length + 'B');
      console.log('   ' + r.stderr.slice(-400).replace(/\n/g, ' | '));
    }
  }
}
console.log('TOTAL ' + tag + ' PASS=' + totalPass + ' FAIL=' + totalFail + ' ERROR=' + totalErr);
console.log('Artefactos en ' + T);
process.exit(totalFail + totalErr === 0 && selected.length ? 0 : 1);
