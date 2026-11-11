/* Tanda 14: tres cosas que el usuario reportó como «no funciona».
   1. Soltar un bloque ENCIMA de «por siempre» / «repetir» / «si» lo dejaba
      afuera: sólo entraba apuntando al hueco de 26 px. Lo natural es soltarlo
      sobre el bloque, así que ahora el destino se resuelve desde el punto.
   2. «Al presionar {v}» era un campo de texto libre donde había que escribir
      el nombre de la tecla: ahora es un desplegable con las teclas reales.
   3. El área de código tenía alto fijo y no se podía agrandar: ahora tiene un
      asa abajo, como el escenario. */
window.addEventListener('load', function () {
  const out = [];
  const check = (name, cond) => out.push((cond ? 'PASS ' : 'FAIL ') + name);
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const errs = window.__ERRORS__ || [];
  const css = (el, prop) => getComputedStyle(el)[prop];
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

  const P = (t, extra) => new PointerEvent(t, Object.assign({
    pointerId: 77, pointerType: 'mouse', bubbles: true, cancelable: true
  }, extra || {}));
  const center = el => {
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
  };

  /* Deja un solo guion en el personaje 0 y lo dibuja. */
  function setCode(code) {
    const s = sprites[0];
    selectedSpriteId = s.id;
    s.code = code;
    renderCode();
    return s;
  }

  /* En la ventana de las pruebas (800x600) la tarjeta de código queda debajo
     del pliegue y elementFromPoint devuelve null: hay que traerla a la vista
     antes de soltar nada. Ojo con `html{scroll-behavior:smooth}`: con scroll
     animado la medición ocurre antes de que la página se mueva (en CI
     fallaba siempre y en local pasaba por casualidad), así que el salto se
     fuerza a instantáneo. */
  function scrollCode() {
    const ws = $('.scratch-workspace');
    const prev = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    const r = ws.getBoundingClientRect();
    window.scrollBy(0, Math.round(r.top - 80));
    document.documentElement.style.scrollBehavior = prev;
    return ws.getBoundingClientRect();
  }

  /* Arrastra un bloque de la paleta y lo suelta en (x,y). */
  function dropPalette(type, x, y) {
    const item = $('[data-add="' + type + '"]');
    if (!item) return null;
    const ir = item.getBoundingClientRect();
    const sx = Math.round(ir.left + 30);
    const sy = Math.round(ir.top + 10);
    item.dispatchEvent(P('pointerdown', { clientX: sx, clientY: sy }));
    window.dispatchEvent(P('pointermove', { clientX: x, clientY: y }));
    window.dispatchEvent(P('pointerup', { clientX: x, clientY: y }));
    return sprites[0];
  }

  /* Arrastra un bloque que ya está en el código hasta (x,y). */
  function dropExisting(id, x, y) {
    const grip = $('[data-grip="' + id + '"]');
    if (!grip) return false;
    const gr = grip.getBoundingClientRect();
    grip.dispatchEvent(P('pointerdown', { clientX: Math.round(gr.left + gr.width / 2), clientY: Math.round(gr.top + gr.height / 2) }));
    window.dispatchEvent(P('pointermove', { clientX: x, clientY: y }));
    window.dispatchEvent(P('pointerup', { clientX: x, clientY: y }));
    return true;
  }

  const bodyOf = n => (n && n.body ? n.body.map(x => x.type) : []);
  const elseOf = n => (n && n.elseBody ? n.elseBody.map(x => x.type) : []);

  (async () => {
    try {
      check('sin_errores_arranque', errs.length === 0);

      /* ================= 1. anidar soltando encima ================= */
      let s = setCode([makeNode('forever')]);
      const wr = scrollCode();
      check('codigo_a_la_vista', wr.top >= 0 && wr.bottom <= window.innerHeight);
      const head = $('#codeList .sb.c-head');
      check('hay_cabecera', !!head);
      const slotHead = dropSlotAt(head);
      check('cabecera_resuelve_al_hueco', !!slotHead && slotHead.dataset.slot === 'body' &&
        slotHead.dataset.owner === s.code[0].id);

      /* El caso que reportó el usuario: soltar SOBRE el bloque. */
      let c = center(head);
      dropPalette('move', c.x, c.y);
      check('soltar_sobre_por_siempre_anida', bodyOf(sprites[0].code[0]).indexOf('move') > -1);
      check('no_queda_afuera', sprites[0].code.length === 1);

      /* Sobre el hueco también (lo de antes, no se rompió). */
      s = setCode([makeNode('repeat')]);
      c = center($('#codeList .c-slot'));
      dropPalette('move', c.x, c.y);
      check('soltar_en_el_hueco_anida', bodyOf(sprites[0].code[0]).indexOf('move') > -1);

      /* «si» (if_cond) por la cabecera. */
      s = setCode([makeNode('if_cond', 'score > 5')]);
      c = center($('#codeList .sb.c-head'));
      dropPalette('move', c.x, c.y);
      check('soltar_sobre_el_si_anida', bodyOf(sprites[0].code[0]).indexOf('move') > -1);

      /* La barra «si no» manda al segundo hueco. */
      s = setCode([makeNode('if_else', 'score > 5')]);
      const bar = $('#codeList .c-else');
      check('hay_barra_si_no', !!bar);
      c = center(bar);
      dropPalette('move', c.x, c.y);
      check('soltar_sobre_si_no_va_al_else', elseOf(sprites[0].code[0]).indexOf('move') > -1);
      check('si_no_no_toca_el_body', bodyOf(sprites[0].code[0]).length === 0);

      /* Un bloque anidado dentro de otro: la cabecera INTERNA manda a su
         propio cuerpo, no al de afuera (era el riesgo de usar closest). */
      s = setCode([makeNode('forever')]);
      sprites[0].code[0].body = [makeNode('repeat')];
      renderCode();
      const inner = $$('#codeList .sb.c-head')[1];
      check('hay_cabecera_interna', !!inner);
      c = center(inner);
      dropPalette('move', c.x, c.y);
      check('cabecera_interna_anida_adentro', bodyOf(sprites[0].code[0].body[0]).indexOf('move') > -1);
      check('no_se_va_al_de_afuera', bodyOf(sprites[0].code[0]).length === 1);

      /* Arrastrar un bloque que YA está en el código sobre la cabecera. */
      s = setCode([makeNode('forever'), makeNode('move', 10)]);
      const moverId = sprites[0].code[1].id;
      c = center($('#codeList .sb.c-head'));
      dropExisting(moverId, c.x, c.y);
      check('mover_uno_existente_anida', bodyOf(sprites[0].code[0]).indexOf('move') > -1);
      check('mover_uno_existente_sale_de_la_raiz', sprites[0].code.length === 1);

      /* Un sombrero no puede entrar adentro. */
      s = setCode([makeNode('forever')]);
      c = center($('#codeList .sb.c-head'));
      dropPalette('when_tap', c.x, c.y);
      check('sombrero_no_entra', bodyOf(sprites[0].code[0]).length === 0 && sprites[0].code.length === 1);

      /* Un bloque no puede caer dentro de sí mismo. */
      s = setCode([makeNode('forever')]);
      sprites[0].code[0].body = [makeNode('repeat')];
      renderCode();
      const foreverId = sprites[0].code[0].id;
      const innerHead = $$('#codeList .sb.c-head')[1];
      c = center(innerHead);
      dropExisting(foreverId, c.x, c.y);
      check('no_cae_dentro_de_si_mismo', sprites[0].code.length === 1 &&
        sprites[0].code[0].id === foreverId && sprites[0].code[0].body.length === 1);

      /* ================= 2. teclas ================= */
      const def = BYID.when_key;
      check('when_key_es_desplegable', def.pick === 'keys');
      check('when_key_arranca_en_espacio', def.def === ' ');
      check('lib_teclas_espacio', KEY_LIB[0].id === ' ' && KEY_LIB[0].name.es === 'Espacio');
      check('lib_teclas_enter', KEY_LIB.some(k => k.id === 'enter'));
      check('lib_teclas_flechas', ['arrowup', 'arrowdown', 'arrowleft', 'arrowright']
        .every(k => KEY_LIB.some(x => x.id === k)));
      check('lib_teclas_letras', 'abcdefghijklmnopqrstuvwxyz'.split('').every(k => KEY_LIB.some(x => x.id === k)));
      check('lib_teclas_numeros', '0123456789'.split('').every(k => KEY_LIB.some(x => x.id === k)));
      check('lib_teclas_sin_repetidos', KEY_LIB.length === new Set(KEY_LIB.map(k => k.id)).size);
      check('lib_teclas_4_idiomas', ['es', 'en', 'pt', 'fr'].every(l =>
        KEY_LIB.every(k => typeof k.name[l] === 'string' && k.name[l].length > 0)));

      setCode([makeNode('when_key', ' ')]);
      const sel = $('#codeList select');
      check('el_bloque_dibuja_un_select', !!sel);
      check('select_con_todas_las_teclas', !!sel && sel.options.length === KEY_LIB.length);
      check('select_arranca_en_espacio', !!sel && sel.value === ' ' &&
        sel.options[sel.selectedIndex].textContent === KEY_LIB[0].name[lang]);

      /* Proyecto viejo: guardaba «espacio» escrito a mano. */
      setCode([makeNode('when_key', 'espacio')]);
      let selViejo = $('#codeList select');
      check('viejo_espacio_selecciona_espacio', !!selViejo && selViejo.value === ' ');
      setCode([makeNode('when_key', 'arriba')]);
      selViejo = $('#codeList select');
      check('viejo_arriba_selecciona_flecha', !!selViejo && selViejo.value === 'arrowup');

      /* Elegir Enter en el desplegable guarda el valor que escucha el motor. */
      setCode([makeNode('when_key', ' ')]);
      const sel2 = $('#codeList select');
      sel2.value = 'enter';
      sel2.dispatchEvent(new Event('change', { bubbles: true }));
      check('elegir_enter_guarda_enter', sprites[0].code[0].val === 'enter');

      /* Y de verdad dispara: se aprieta Enter. */
      setCode([makeNode('when_key', 'enter'), makeNode('score_add', 1)]);
      stopCode();
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
      check('enter_arranca_el_guion', runActive === true);
      stopCode();
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'q', bubbles: true, cancelable: true }));
      check('otra_tecla_no_arranca', runActive === false);

      /* La barra espaciadora, con el valor nuevo ' '. */
      setCode([makeNode('when_key', ' '), makeNode('score_add', 1)]);
      stopCode();
      window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));
      check('espacio_arranca', runActive === true);
      stopCode();

      /* Y con el valor viejo «espacio» sigue andando. */
      setCode([makeNode('when_key', 'espacio'), makeNode('score_add', 1)]);
      stopCode();
      window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));
      check('espacio_viejo_sigue_andando', runActive === true);
      stopCode();

      /* Una letra cualquiera. */
      setCode([makeNode('when_key', 'e'), makeNode('score_add', 1)]);
      stopCode();
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'E', bubbles: true, cancelable: true }));
      check('letra_mayuscula_cuenta', runActive === true);
      stopCode();

      /* La etiqueta sale del catálogo y sigue el idioma: «Enter» en español e
         inglés, «Entrée» en francés. Antes estaba escrito «Enter» a mano y en
         francés fallaba; el texto se deriva de KEY_LIB. */
      const tecla = id => {
        const k = KEY_LIB.find(x => x.id === id);
        return k ? k.name[lang] : null;
      };
      check('etiqueta_de_tecla', pickLabel('keys', 'enter') === tecla('enter') &&
        pickLabel('keys', 'espacio') === KEY_LIB[0].name[lang] &&
        pickLabel('keys', 'enter') !== UI[lang].keyMissing);
      check('paleta_muestra_la_tecla', blockPlainName(BYID.when_key).indexOf(KEY_LIB[0].name[lang]) > -1);

      /* ================= 3. alto del área de código ================= */
      const grip = $('#codeGrip');
      const ws = $('.scratch-workspace');
      check('asa_del_codigo_existe', !!grip);
      check('asa_vertical', !!grip && css(grip, 'cursor') === 'ns-resize');
      check('asa_traducida', !!grip && grip.title === UI[lang].codeResize &&
        grip.getAttribute('aria-label') === UI[lang].codeResize);
      check('clave_codeResize_en_4_idiomas', ['es', 'en', 'pt', 'fr'].every(l =>
        typeof UI[l].codeResize === 'string' && UI[l].codeResize.length > 0));

      resetCodeHeight();
      check('sin_alto_propio_no_hay_var', document.body.style.getPropertyValue('--code-h') === '');
      const altoFabrica = ws.getBoundingClientRect().height;
      check('alto_de_fabrica_en_rango', altoFabrica >= 200 && altoFabrica <= 360);

      /* El tope depende de la ventana (innerHeight - 220), así que el objetivo
         se calcula, no se escribe a mano. */
      const maxH = codeMaxH();
      const objetivo = Math.min(420, maxH - 20);
      setCodeHeight(objetivo);
      check('alto_aplicado', document.body.style.getPropertyValue('--code-h') === objetivo + 'px');
      check('alto_medido', Math.abs(ws.getBoundingClientRect().height - objetivo) < 2);
      check('alto_persistido', localStorage.getItem('scrachmo_code_h') === String(objetivo));

      setCodeHeight(10);
      check('alto_minimo', codeH === 140);
      setCodeHeight(99999);
      check('alto_maximo', codeH === maxH && codeH < 99999);

      /* Arrastre real: 100 px de gesto agrandan 100 px. */
      resetCodeHeight();
      const base = ws.getBoundingClientRect().height;
      const gr = grip.getBoundingClientRect();
      grip.dispatchEvent(P('pointerdown', { pointerId: 91, clientX: Math.round(gr.left + 20), clientY: Math.round(gr.top + 8) }));
      check('arrastre_inicia', !!codeResize);
      window.dispatchEvent(P('pointermove', { pointerId: 91, clientX: Math.round(gr.left + 20), clientY: Math.round(gr.top + 8) + 100 }));
      check('arrastre_sigue_al_dedo', Math.abs(ws.getBoundingClientRect().height - (base + 100)) < 3);
      window.dispatchEvent(P('pointerup', { pointerId: 91, clientX: Math.round(gr.left + 20), clientY: Math.round(gr.top + 8) + 100 }));
      check('arrastre_termina', codeResize === null);
      check('arrastre_guarda', Math.abs(Number(localStorage.getItem('scrachmo_code_h')) - (base + 100)) < 3);

      /* Teclado: flechas de 40 px, desde un alto con margen a los dos lados. */
      setCodeHeight(200);
      const antesTecla = ws.getBoundingClientRect().height;
      grip.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
      check('tecla_agranda', Math.abs(ws.getBoundingClientRect().height - (antesTecla + 40)) < 3);
      grip.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true }));
      check('tecla_achica', Math.abs(ws.getBoundingClientRect().height - antesTecla) < 3);

      /* Doble clic vuelve al de fábrica. */
      grip.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
      check('doble_clic_vuelve', document.body.style.getPropertyValue('--code-h') === '' &&
        localStorage.getItem('scrachmo_code_h') === null &&
        Math.abs(ws.getBoundingClientRect().height - altoFabrica) < 2);

      /* El zoom de bloques no estira la tarjeta, ni con un alto propio. */
      setCodeHeight(400);
      const altoZoom0 = ws.getBoundingClientRect().height;
      for (let i = 0; i < 3; i++) changeZoom(0.1);
      check('zoom_no_estira_con_alto_propio', Math.abs(ws.getBoundingClientRect().height - altoZoom0) < 2);
      resetZoom();
      resetCodeHeight();

      /* El alto del código no toca el tamaño del mundo. */
      check('no_toca_el_mundo', worldW === 480 && worldH === 360);

      check('sin_errores_final', (window.__ERRORS__ || []).length === 0);
    } catch (err) {
      out.push('ERROR ' + err.message + ' @ ' + (err.stack || '').split('\n')[1]);
    }
    clearTimeout(watchdog);
    done();
  })();
});
