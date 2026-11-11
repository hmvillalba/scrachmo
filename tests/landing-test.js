/* La landing en el navegador: idioma, selector y enlace directo a la app.

   Es la única página de prueba que NO carga el motor (data.js/engine.js), así
   que no puede usar UI[lang] ni makeNode(): todo se comprueba contra el DOM y
   contra localStorage. Ojo con el idioma: run.js verifica el <html lang> del
   DOM, así que la prueba tiene que devolver el selector a como estaba. */
window.addEventListener('load', function () {
  const out = [];
  const check = (name, cond) => out.push((cond ? 'PASS ' : 'FAIL ') + name);
  const $ = s => document.querySelector(s);
  const errs = window.__ERRORS__ || [];
  let finished = false;
  const done = () => {
    if (finished) return;
    finished = true;
    const pre = document.createElement('pre');
    pre.id = 'TESTRESULT';
    pre.textContent = 'BEGIN\n' + out.join('\n') + '\nEND';
    document.body.appendChild(pre);
  };
  const watchdog = setTimeout(() => {
    out.push('WATCHDOG: la cadena asíncrona no terminó');
    done();
  }, 30000);

  const leer = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const textos = () => Array.prototype.map.call(
    document.querySelectorAll('[data-i18n]'), el => el.textContent);

  (async () => {
    let original = 'es';
    try {
      check('sin_errores_arranque', errs.length === 0);

      /* ============ 1. no carga el motor ============ */
      check('la_landing_no_carga_el_motor',
        typeof window.makeNode === 'undefined' && typeof window.UI === 'undefined' &&
        typeof window.runAll === 'undefined');

      /* ============ 2. idioma inicial = idioma del sistema ============ */
      const pedido = String(navigator.language || 'es').toLowerCase().slice(0, 2);
      const esperado = ['es', 'en', 'pt', 'fr'].indexOf(pedido) > -1 ? pedido : 'es';
      check('arranca_en_el_idioma_del_sistema',
        document.documentElement.lang === esperado);
      original = document.documentElement.lang;

      /* ============ 3. el selector existe y está sincronizado ============ */
      const sel = $('#langSel');
      check('hay_selector_de_idioma', !!sel && sel.tagName === 'SELECT');
      check('el_selector_tiene_los_cuatro_idiomas', !!sel &&
        Array.prototype.map.call(sel.options, o => o.value).join(',') === 'es,en,pt,fr');
      check('el_selector_muestra_el_idioma_activo', !!sel && sel.value === esperado);
      check('el_selector_es_accesible', !!sel &&
        /idioma|language/i.test(sel.getAttribute('aria-label') || ''));

      /* ============ 4. los textos están traducidos ============ */
      const i18n = textos();
      check('hay_textos_traducidos', i18n.length >= 40);
      check('ningun_texto_quedo_vacio', i18n.every(t => String(t || '').trim().length > 0));

      /* ============ 5. cambiar de idioma traduce y se recuerda ============ */
      const antes = i18n.slice();
      const otro = esperado === 'fr' ? 'pt' : 'fr';
      sel.value = otro;
      sel.dispatchEvent(new Event('change', { bubbles: true }));

      const despues = textos();
      check('el_html_cambia_de_idioma', document.documentElement.lang === otro);
      check('los_textos_cambian', antes.length === despues.length &&
        despues.some((t, i) => t !== antes[i]));
      check('se_guarda_la_preferencia_de_la_landing',
        leer('scrachmo_landing_lang') === otro);
      /* Lo importante: la app abre en el idioma elegido acá, no en el del
         sistema. Antes cada página guardaba en su propia clave y no se hablaban. */
      check('el_idioma_viaja_al_editor', leer('scrachmo_lang') === otro);

      /* ============ 6. volver al idioma original (run.js mira el <html lang>) ============ */
      sel.value = original;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      check('se_puede_volver_al_idioma_anterior', document.documentElement.lang === original);
      check('la_preferencia_vuelve_atras', leer('scrachmo_lang') === original);

      /* ============ 7. enlace directo y enlaces de apoyo ============ */
      const cta = $('a.btn-primary');
      check('el_boton_principal_abre_la_app', !!cta && /app\.html$/.test(cta.href));
      const url = $('#appUrl');
      check('se_ve_el_enlace_directo', !!url && /app\.html$/.test(url.textContent) &&
        !/^https?:/.test(url.textContent));
      const compartir = $('#shareApp');
      check('hay_boton_para_compartir_el_enlace',
        !!compartir && compartir.tagName === 'BUTTON');
      check('estan_los_enlaces_de_apoyo', (() => {
        const hrefs = Array.prototype.map.call(document.querySelectorAll('a[href]'),
          a => a.getAttribute('href') || '').join(' ');
        return /cafecito\.app/.test(hrefs) && /ko-fi\.com/.test(hrefs) &&
          /github\.com/.test(hrefs);
      })());
      const ver = $('#version');
      check('se_ve_la_version', !!ver && /^ScrachMo v\d+$/.test(ver.textContent.trim()));

      check('sin_errores_final', errs.length === 0);
    } catch (err) {
      out.push('ERROR ' + err.message + ' @ ' + (err.stack || '').split('\n')[1]);
    }
    /* Pase lo que pase, el DOM tiene que quedar en el idioma pedido. */
    try {
      const s = $('#langSel');
      if (s && s.value !== original) {
        s.value = original;
        s.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } catch (e) { }
    clearTimeout(watchdog);
    done();
  })();
});
