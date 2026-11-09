/* Tanda 1: parser aritmético sin eval, diálogos propios y topes al importar.
   Corre sobre el DOM real, igual que las otras suites. */
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

  (async () => {
    try {
      check('sin_errores_arranque', errs.length === 0);

      /* ============ 1. parser aritmético sin eval ============ */
      check('calc_existe', typeof calcExpr === 'function');
      check('calc_precedencia', calcExpr('2+3*4') === 14);
      check('calc_parentesis', calcExpr('(2+3)*4') === 20);
      check('calc_menos_unario', calcExpr('-5+2') === -3);
      check('calc_doble_negativo', calcExpr('--5') === 5);
      check('calc_decimal', calcExpr('10/4') === 2.5);
      check('calc_modulo', calcExpr('10%3') === 1);
      check('calc_potencia', calcExpr('2**3') === 8);
      check('calc_espacios', calcExpr('  1 +  2 ') === 3);
      check('calc_falta_numero', (() => { try { calcExpr('1+'); return false; } catch (e) { return true; } })());
      check('calc_sobra_texto', (() => { try { calcExpr('1 2'); return false; } catch (e) { return true; } })());
      check('calc_falta_parentesis', (() => { try { calcExpr('(1+2'); return false; } catch (e) { return true; } })());

      check('eval_simple', evalExpr('2+3*4') === 14);
      check('eval_parentesis', evalExpr('(2+3)*4') === 20);
      check('eval_decimal', evalExpr('7/2') === 3.5);
      check('eval_potencia', evalExpr('2**3') === 8);
      check('eval_vacio', evalExpr('') === null);
      check('eval_div_cero', evalExpr('1/0') === null);
      check('eval_mod_cero', evalExpr('1%0') === null);
      check('eval_sintaxis', evalExpr('1+') === null);
      check('eval_sobra_texto', evalExpr('1 2') === null);
      check('eval_punto_suelto', evalExpr('..') === null);
      check('eval_parentesis_vacio', evalExpr('()') === null);
      score = 7;
      check('eval_score', evalExpr('score*2') === 14);
      variables.vidas = 3;
      check('eval_variable', evalExpr('vidas+4') === 7);
      variables.texto = 'hola';
      check('eval_variable_texto', evalExpr('texto+1') === null);
      delete variables.texto;
      check('eval_desconocida', evalExpr('nose+1') === 1);
      check('eval_aleatorio', evalExpr('aleatorio(5,5)') === 5);
      check('eval_random', evalExpr('random(2,2)') === 2);
      check('eval_cond_true', evalCond('score > 5') === true);
      check('eval_cond_false', evalCond('score < 5') === false);

      /* ============ 2. diálogos propios ============ */
      check('modal_existe', !!$('#askModal') && $('#askModal').hidden === true);
      check('modal_botones_traducidos',
        $('#askOk').querySelector('span').textContent === UI[lang].accept &&
        $('#askCancel').querySelector('span').textContent === UI[lang].cancel);
      check('claves_dialogo_4_idiomas', ['es', 'en', 'pt', 'fr'].every(l =>
        ['confirmTitle', 'accept', 'projectTooBig'].every(k =>
          typeof UI[l][k] === 'string' && UI[l][k].length > 0)));

      let p = askConfirm('¿Seguro?');
      check('modal_abre', $('#askModal').hidden === false);
      check('modal_titulo', $('#askTitle').textContent === UI[lang].confirmTitle);
      check('modal_mensaje', $('#askMessage').textContent === '¿Seguro?');
      check('modal_sin_input', $('#askInput').hidden === true);
      check('modal_bloquea_scroll', document.body.classList.contains('modal-open'));
      $('#askCancel').click();
      check('modal_cancelar', (await p) === false);
      check('modal_cierra', $('#askModal').hidden === true && !document.body.classList.contains('modal-open'));

      p = askConfirm('x');
      $('#askOk').click();
      check('modal_aceptar', (await p) === true);

      p = askConfirm('escape');
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      check('modal_escape', (await p) === false);
      check('modal_escape_cierra', $('#askModal').hidden === true);

      p = askText('Nombre', 'Mi Juego');
      check('modal_input_visible', $('#askInput').hidden === false);
      check('modal_input_defecto', $('#askInput').value === 'Mi Juego');
      check('modal_input_titulo', $('#askTitle').textContent === 'Nombre');
      $('#askInput').value = 'Prueba';
      $('#askOk').click();
      check('modal_input_valor', (await p) === 'Prueba');

      p = askText('Nombre', 'Mi Juego');
      $('#askCancel').click();
      check('modal_input_cancel', (await p) === null);

      p = askText('Nombre', 'x');
      $('#askInput').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      check('modal_input_enter', (await p) === 'x');

      /* Cambiar de idioma vuelve a traducir los botones del diálogo. */
      const oldLang = lang;
      lang = 'en'; render();
      check('modal_traduce_botones', $('#askOk').querySelector('span').textContent === UI.en.accept);
      lang = oldLang; render();

      /* El borrado de disfraz usa el diálogo propio, no confirm() nativo. */
      let nativeUsed = false;
      const oldConfirm = window.confirm;
      window.confirm = () => { nativeUsed = true; return true; };
      const sp = sprites[0];
      sp.costumes = [makeCostume('emoji', '🐱', 'A'), makeCostume('emoji', '🚀', 'B')];
      sp.costumeIndex = 0;
      syncCostume(sp);
      selectedSpriteId = sp.id;
      render();
      const realAsk = askConfirm;
      askConfirm = async () => true;
      await deleteCostume(0);
      askConfirm = realAsk;
      window.confirm = oldConfirm;
      check('borrado_sin_confirm_nativo', nativeUsed === false);
      check('borrado_con_dialogo', sp.costumes.length === 1);

      /* ============ 3. topes al importar ============ */
      const depthOf = (list, d) => {
        let m = d;
        (list || []).forEach(n => {
          if (n.body && n.body.length) m = Math.max(m, depthOf(n.body, d + 1));
          if (n.elseBody && n.elseBody.length) m = Math.max(m, depthOf(n.elseBody, d + 1));
        });
        return m;
      };
      const deep = { type: 'repeat', val: 1, body: [] };
      let cur = deep;
      for (let i = 0; i < 60; i++) {
        const n = { type: 'repeat', val: 1, body: [] };
        cur.body.push(n);
        cur = n;
      }
      check('importa_profundo', applyPayload({
        version: '2.0', sprites: [{ id: 'd', name: 'D', code: [deep] }]
      }) === true);
      check('tope_profundidad', depthOf(sprites[0].code, 1) <= MAX_CODE_DEPTH);
      check('aviso_recorte_profundidad', importTruncated === true);

      const many = [];
      for (let i = 0; i < 2600; i++) many.push({ type: 'move', val: 1 });
      check('importa_muchos', applyPayload({
        version: '2.0', sprites: [{ id: 'm', name: 'M', code: many }]
      }) === true);
      check('tope_nodos', sprites[0].code.length === MAX_CODE_NODES);
      check('aviso_recorte_nodos', importTruncated === true);

      check('proyecto_normal_sin_recorte', applyPayload({
        version: '2.0', sprites: [{ id: 'n', name: 'N', code: [{ type: 'when_flag' }, { type: 'move', val: 10 }] }]
      }) === true && importTruncated === false && sprites[0].code.length === 2);

      check('tope_payload_funcion',
        payloadTooBig('x'.repeat(MAX_PAYLOAD_CHARS + 1)) === true && payloadTooBig('{}') === false);
      check('link_gigante_rechazado',
        (await decodeShareAsync('j1.' + 'A'.repeat(MAX_PAYLOAD_CHARS + 1))) === null);
      check('link_vacio_rechazado', (await decodeShareAsync('')) === null);

      check('sin_errores_final', errs.length === 0);
    } catch (err) {
      out.push('ERROR ' + err.message + ' @ ' + (err.stack || '').split('\n')[1]);
    }
    clearTimeout(watchdog);
    done();
  })();
});
