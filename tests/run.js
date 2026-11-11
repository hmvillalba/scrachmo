/* Corre toda la suite en Chrome headless y cuenta PASS / FAIL / ERROR.
   Uso: node tests/run.js [etiqueta] [solo-este-harness]
   La ruta de Chrome se puede forzar con CHROME_PATH.
   El directorio de las páginas se puede fijar con SCRACHMO_TMP.
   Los idiomas se pueden fijar con SCRACHMO_LANGS (por defecto 'es,en').

   IMPORTANTE: la suite se corre una vez por idioma, con `--lang` explícito.
   Sin eso el idioma lo decidía el sistema —español en una máquina, inglés en
   el runner de CI— y una prueba que comparaba texto escrito a mano pasaba en
   un lado y fallaba en el otro. Ahora los dos entornos ven lo mismo.

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

/* Códigos de Chrome para cada idioma de la app. `--lang` es el que manda en
   navigator.language; LANG/LC_ALL acompañan para que la comparación de
   cadenas y los formatos no dependan del sistema. */
const TODOS = [
  { id: 'es', chrome: 'es-419', env: 'es_419.UTF-8' },
  { id: 'en', chrome: 'en-US', env: 'en_US.UTF-8' },
  { id: 'pt', chrome: 'pt-BR', env: 'pt_BR.UTF-8' },
  { id: 'fr', chrome: 'fr-FR', env: 'fr_FR.UTF-8' }
];

/* Los cuatro por defecto. Un idioma que no estuviera en el mapa no fallaba:
   se filtraba y la suite terminaba en verde sin haberlo probado nunca. Ahora
   un id desconocido o una lista que no deja ninguno es un error, no un OK. */
const pedidos = String(process.env.SCRACHMO_LANGS || 'es,en,pt,fr')
  .split(',').map(s => s.trim()).filter(Boolean);
const desconocidos = pedidos.filter(id => !TODOS.some(l => l.id === id));
const LANGS = TODOS.filter(l => pedidos.indexOf(l.id) > -1);

if (desconocidos.length) {
  console.error('Idioma desconocido en SCRACHMO_LANGS: ' + desconocidos.join(', ') +
    '\nDisponibles: ' + TODOS.map(l => l.id).join(', '));
  process.exit(2);
}
if (!LANGS.length) {
  console.error('SCRACHMO_LANGS no dejó ningún idioma: la suite no correría nada.');
  process.exit(2);
}

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

function launch(url, headless, profile, L) {
  const args = [
    headless, '--disable-gpu', '--no-sandbox', '--no-first-run',
    '--disable-dev-shm-usage', '--disable-extensions', '--disable-background-networking',
    '--lang=' + L.chrome,
    '--user-data-dir=' + profile,
    '--virtual-time-budget=25000', '--dump-dom', url
  ];
  const env = Object.assign({}, process.env, { LANG: L.env, LC_ALL: L.env, LANGUAGE: L.chrome });
  const r = spawnSync(CHROME, args, { encoding: 'utf8', maxBuffer: 40 * 1024 * 1024, timeout: 180000, env: env });
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

let grandPass = 0, grandFail = 0, grandErr = 0;

for (const L of LANGS) {
  console.log('--- idioma: ' + L.id + ' (' + L.chrome + ') ---');
  let langPass = 0, langFail = 0, langErr = 0;

  for (const [name, url] of selected) {
    const label = name + ' [' + L.id + ']';
    const base = tag + '-' + L.id + '-' + name;
    let r = launch(url, '--headless=new', path.join(PROFILES, base), L);
    if (!r.found) {
      /* Reintento con el headless clásico, que sigue siendo el único válido en
         algunas versiones de Chrome empaquetadas en Linux. */
      r = launch(url, '--headless', path.join(PROFILES, base + '-old'), L);
    }
    fs.writeFileSync(path.join(T, 'dom-' + base + '.html'), r.dom);
    fs.writeFileSync(path.join(T, 'err-' + base + '.log'),
      'chrome=' + CHROME + '\nflags=' + r.headless + '\nlang=' + L.chrome +
      '\nstatus=' + r.status + '\nerror=' + r.error +
      '\ndomBytes=' + r.dom.length + '\n--- stderr ---\n' + r.stderr.slice(-2000) + '\n');

    const pass = (r.body.match(/PASS /g) || []).length;
    const fail = (r.body.match(/FAIL /g) || []).length;
    const err = (r.body.match(/ERROR /g) || []).length;
    /* La app escribe <html lang="xx"> en render(). Si el idioma no cambió, el
       `--lang` no se aplicó (o Chrome no tiene ese locale) y estaríamos
       corriendo dos veces el mismo idioma creyendo que cubrimos dos. */
    const langDom = (r.dom.match(/<html[^>]*\blang="([^"]*)"/) || [])[1];
    const langOk = !langDom || langDom.indexOf(L.id) === 0;
    const extra = langOk ? err : err + 1;
    langPass += pass; langFail += fail; langErr += extra;
    console.log(label.padEnd(16) + ' PASS=' + String(pass).padStart(3) +
      ' FAIL=' + String(fail).padStart(2) + ' ERROR=' + String(extra).padStart(2) +
      (r.found ? '' : '  << SIN RESULTADO >>') +
      (langOk ? '' : '  << IDIOMA NO APLICADO: ' + langDom + ' >>'));
    if (fail || extra || !r.found) {
      const bad = r.body.split('\n').filter(l => /^(FAIL|ERROR)/.test(l)).slice(0, 25);
      bad.forEach(l => console.log('   ' + l));
      /* Línea sin sangría y con el harness y el idioma delante: es la que el
         CI convierte en anotación, así el detalle se lee sin bajar el log. */
      bad.forEach(l => console.log('FALLO ' + label + ' :: ' + l.replace(/^(FAIL|ERROR)\s*/, '')));
      if (!langOk) {
        console.log('FALLO ' + label + ' :: el DOM salió en «' + langDom +
          '» y se pidió «' + L.id + '» (¿Chrome sin ese locale?)');
      }
      if (!r.found) {
        console.log('   chrome=' + CHROME + ' flags=' + r.headless + ' lang=' + L.chrome +
          ' status=' + r.status + ' error=' + r.error + ' dom=' + r.dom.length + 'B');
        console.log('   ' + r.stderr.slice(-400).replace(/\n/g, ' | '));
      }
    }
  }

  console.log('SUBTOTAL ' + L.id + ' PASS=' + langPass + ' FAIL=' + langFail + ' ERROR=' + langErr);
  grandPass += langPass; grandFail += langFail; grandErr += langErr;
}

console.log('TOTAL ' + tag + ' PASS=' + grandPass + ' FAIL=' + grandFail + ' ERROR=' + grandErr +
  '  (' + LANGS.length + ' idioma' + (LANGS.length === 1 ? '' : 's') + ' x ' + selected.length + ' escenarios)');
console.log('Artefactos en ' + T);
process.exit(grandFail + grandErr === 0 && selected.length ? 0 : 1);
