/* Tanda 9: modal «Acerca de», versión visible y aviso de actualización de la
   PWA. Comprueba que el botón de la barra superior abra el modal, que los
   datos del autor y los enlaces de apoyo estén, que cierre por los cuatro
   caminos y que los textos existan en los 4 idiomas. */
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
  }, 60000);

  const modal = $('#aboutModal');
  const btn = $('#aboutBtn');
  const esc = () => document.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

  (async () => {
    try {
      check('sin_errores_arranque', errs.length === 0);

      /* ============ 1. el botón y el modal ============ */
      check('boton_existe', !!btn);
      check('boton_en_la_barra', !!btn && !!btn.closest('.topbar'));
      check('boton_tiene_icono', !!btn && !!btn.querySelector('use[href="#i-info"]'));
      check('boton_traducido', !!btn && btn.title === UI[lang].aboutBtn &&
        btn.getAttribute('aria-label') === UI[lang].aboutBtn);
      check('modal_existe', !!modal);
      check('arranca_cerrado', !!modal && modal.hidden === true);
      check('sin_bloqueo_al_arrancar', !document.body.classList.contains('modal-open'));

      /* ============ 2. abrir ============ */
      btn.click();
      check('abre_al_tocar', modal.hidden === false);
      check('bloquea_el_scroll', document.body.classList.contains('modal-open'));

      /* ============ 3. el contenido ============ */
      const texto = modal.textContent;
      check('titulo_traducido', $('#aboutTitle').textContent === UI[lang].aboutTitle);
      check('subtitulo', texto.indexOf(UI[lang].aboutSub) > -1);
      check('autor', texto.indexOf('Hugo Martín Villalba') > -1);
      check('descripcion', texto.indexOf(UI[lang].aboutDesc) > -1);
      check('frase_de_mencion', texto.indexOf(UI[lang].aboutThanks) > -1);

      const links = Array.from(modal.querySelectorAll('.about-row a'));
      const licencia = links.find(a => a.getAttribute('href') === 'LICENSE');
      check('licencia_mit', !!licencia && licencia.textContent.trim() === 'MIT');
      /* La fila «Sitio web» tiene que apuntar a la URL pública de Vercel. No
         alcanza con el href: el texto visible también puede quedar viejo, y es
         justo lo que se ve en el modal. Ningún rastro del hosting anterior. */
      const sitio = links.find(a => a.getAttribute('href').indexOf('scrachmo.vercel.app') > -1);
      check('sitio_web', !!sitio &&
        sitio.getAttribute('href') === 'https://scrachmo.vercel.app' &&
        sitio.textContent.trim() === 'scrachmo.vercel.app' &&
        sitio.getAttribute('target') === '_blank' &&
        (sitio.getAttribute('rel') || '').indexOf('noopener') > -1 &&
        modal.textContent.toLowerCase().indexOf('netlify') === -1);

      /* ============ 4. los enlaces de apoyo ============ */
      const apoyos = Array.from(modal.querySelectorAll('.about-link'));
      check('dos_enlaces_de_apoyo', apoyos.length === 2);
      const cafe = apoyos.find(a => a.getAttribute('href').indexOf('cafecito.app') > -1);
      const kofi = apoyos.find(a => a.getAttribute('href').indexOf('ko-fi.com') > -1);
      check('enlace_cafecito', !!cafe && cafe.getAttribute('href') === 'https://cafecito.app/hmvillalba');
      check('enlace_kofi', !!kofi && kofi.getAttribute('href') === 'https://ko-fi.com/hugomartinvillalba');
      check('enlaces_en_pestana_nueva', apoyos.every(a =>
        a.getAttribute('target') === '_blank' &&
        (a.getAttribute('rel') || '').indexOf('noopener') > -1));
      check('enlaces_traducidos', !!cafe && !!kofi &&
        cafe.textContent.indexOf(UI[lang].aboutCoffee) > -1 &&
        kofi.textContent.indexOf(UI[lang].aboutKofi) > -1);
      check('iconos_de_apoyo', !!cafe && !!kofi &&
        !!cafe.querySelector('use[href="#i-cup"]') && !!kofi.querySelector('use[href="#i-heart"]'));

      /* ============ 5. no toca el proyecto ============ */
      const antes = JSON.stringify({ c: sprites[0].code, v: variables });
      openAbout();
      check('no_toca_el_proyecto', JSON.stringify({ c: sprites[0].code, v: variables }) === antes);

      /* Los bloques se apilan con z-index alto (assignZ() arranca en 6000) y
         sin aislar el contexto se dibujaban ENCIMA del modal. Se comprueba de
         verdad: se mete un z-index 6000 dentro del área de código y el modal
         tiene que seguir ganando. */
      const ws = $('.scratch-workspace');
      check('contexto_de_los_bloques_aislado', !!ws && getComputedStyle(ws).isolation === 'isolate');
      check('el_modal_gana_a_un_bloque_z6000', (() => {
        if (!ws) return false;
        const probe = document.createElement('div');
        probe.style.cssText = 'position:fixed;inset:0;z-index:6000';
        ws.appendChild(probe);
        const card = modal.querySelector('.modal-card');
        const r = card.getBoundingClientRect();
        const top = document.elementFromPoint(
          Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2));
        probe.remove();
        return !!top && (top === card || card.contains(top));
      })());

      /* ============ 6. los cuatro caminos de cierre ============ */
      const card = modal.querySelector('.modal-card');
      card.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      check('el_fondo_no_cierra_desde_la_tarjeta', modal.hidden === false);

      modal.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      check('cierra_con_el_fondo', modal.hidden === true);
      check('suelta_el_scroll', !document.body.classList.contains('modal-open'));

      openAbout();
      esc();
      check('cierra_con_escape', modal.hidden === true);

      openAbout();
      $('#aboutClose').click();
      check('cierra_con_aceptar', modal.hidden === true);
      check('aceptar_traducido', $('#aboutClose').textContent.trim() === UI[lang].accept);
      check('suelta_el_scroll_otra_vez', !document.body.classList.contains('modal-open'));

      /* ============ 7. los textos en los 4 idiomas ============ */
      const CLAVES = ['aboutBtn', 'aboutTitle', 'aboutSub', 'aboutAuthor', 'aboutLicense',
        'aboutSite', 'aboutDesc', 'aboutThanks', 'aboutCoffee', 'aboutKofi',
        'aboutVersion', 'updateMsg', 'updateReload', 'updateClose'];
      check('claves_en_4_idiomas', ['es', 'en', 'pt', 'fr'].every(l =>
        CLAVES.every(k => typeof UI[l][k] === 'string' && UI[l][k].length > 0)));
      /* Que estén no alcanza: las frases tienen que ser distintas en cada
         idioma. Sólo se exige a las de contenido: una etiqueta como «Autor»
         es la misma palabra en español y en portugués, y eso no es un error. */
      const FRASES = ['aboutTitle', 'aboutSub', 'aboutDesc', 'aboutThanks',
        'aboutCoffee', 'aboutKofi', 'updateMsg'];
      check('frases_distintas_por_idioma', FRASES.every(k =>
        UI.en[k] !== UI.es[k] && UI.pt[k] !== UI.es[k] && UI.fr[k] !== UI.es[k]));

      /* El modal abierto se reescribe solo al cambiar de idioma. */
      openAbout();
      const idiomaAntes = lang;
      lang = 'en';
      render();
      check('cambia_de_idioma_en_vivo', $('#aboutTitle').textContent === UI.en.aboutTitle &&
        modal.textContent.indexOf(UI.en.aboutThanks) > -1);
      lang = idiomaAntes;
      render();
      check('vuelve_al_idioma', $('#aboutTitle').textContent === UI[lang].aboutTitle);
      closeAbout();

      /* ============ 8. versión visible y aviso de versión nueva ============ */
      const bar = $('#updateBar');
      const valor = $('#aboutVersionValue');
      const etiqueta = modal.querySelector('[data-t="aboutVersion"]');
      const recargar = $('#updateReload');
      const cerrar = $('#updateClose');
      check('fila_de_version_existe', !!valor);
      check('version_visible_es_APP_VERSION', !!valor && valor.textContent === APP_VERSION &&
        $('#footerVersion').textContent === 'ScrachMo ' + APP_VERSION);
      check('etiqueta_version_traducida', !!etiqueta && etiqueta.textContent === UI[lang].aboutVersion);
      check('aviso_update_existe', !!bar && !!recargar && !!cerrar);
      check('aviso_update_arranca_oculto', !!bar && bar.hidden === true);
      check('aviso_update_traducido', !!bar &&
        $('#updateMsg').textContent === UI[lang].updateMsg &&
        recargar.textContent === UI[lang].updateReload &&
        cerrar.getAttribute('aria-label') === UI[lang].updateClose);
      check('aviso_update_se_puede_cerrar', (() => {
        if (!bar || !cerrar) return false;
        bar.hidden = false;
        cerrar.click();
        return bar.hidden === true;
      })());
      check('motor_engancha_las_actualizaciones', typeof bindPwaUpdates === 'function' &&
        typeof showPwaUpdate === 'function');
      check('claves_update_en_4_idiomas', ['es', 'en', 'pt', 'fr'].every(l =>
        ['aboutVersion', 'updateMsg', 'updateReload', 'updateClose'].every(k =>
          typeof UI[l][k] === 'string' && UI[l][k].length > 0)));

      /* ============ 9. trampa de foco y restauración (P1.7) ============ */
      const appRoot = document.querySelector('body > .app');
      const esInerte = el => !!el && (el.hasAttribute('inert') || !!el.closest('[inert]'));
      btn.focus();
      const origen = document.activeElement;
      btn.click();
      check('foco_entra_al_modal', modal.hidden === false &&
        modal.contains(document.activeElement));
      check('fondo_inerte_mientras_hay_modal', esInerte(appRoot));
      const controles = Array.from(modal.querySelectorAll(
        'a[href],button:not([disabled]),input:not([disabled])'))
        .filter(e => !e.hidden && (e.offsetWidth > 0 || e.offsetHeight > 0));
      check('el_modal_tiene_controles_enfocables', controles.length >= 2);
      const ultimo = controles[controles.length - 1];
      const primero = controles[0];
      ultimo.focus();
      document.dispatchEvent(new KeyboardEvent('keydown',
        { key: 'Tab', bubbles: true, cancelable: true }));
      check('tab_adelante_no_se_escapa', document.activeElement === primero);
      primero.focus();
      document.dispatchEvent(new KeyboardEvent('keydown',
        { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }));
      check('tab_atras_no_se_escapa', document.activeElement === ultimo);
      closeAbout();
      check('foco_vuelve_al_boton_que_abrio', document.activeElement === origen);
      check('fondo_recupera_interactividad', !esInerte(appRoot));

      /* ============ 10. tope DURANTE la descompresión (P1.5) ============ */
      check('motor_tiene_tope_de_inflado', typeof inflateLimited === 'function' &&
        typeof MAX_INFLATE_BYTES === 'number' && MAX_INFLATE_BYTES > 0);
      const gzipBytes = async texto => {
        const st = new Blob([texto]).stream().pipeThrough(new CompressionStream('gzip'));
        const rd = st.getReader();
        const partes = [];
        let total = 0;
        for (;;) {
          const paso = await rd.read();
          if (paso.done) break;
          partes.push(paso.value);
          total += paso.value.length;
        }
        const salida = new Uint8Array(total);
        let off = 0;
        partes.forEach(p => { salida.set(p, off); off += p.length; });
        return salida;
      };
      const bomba = await gzipBytes('A'.repeat(200000));
      check('gzip_bomba_se_corta_antes_de_inflar', await inflateLimited(bomba, 1024) === null);
      const pequeno = await gzipBytes('hola');
      const inflado = await inflateLimited(pequeno, 1024);
      check('gzip_legitimo_sigue_aceptandose', !!inflado &&
        new TextDecoder().decode(inflado) === 'hola');

      check('sin_errores_final', errs.length === 0);
    } catch (err) {
      out.push('ERROR ' + err.message + ' @ ' + (err.stack || '').split('\n')[1]);
    }
    clearTimeout(watchdog);
    done();
  })();
});
