window.addEventListener('load', function () {
  const out = [];
  const check = (name, cond) => out.push((cond ? 'PASS ' : 'FAIL ') + name);
  const errs = window.__ERRORS__ || [];

  const done = () => {
    const pre = document.createElement('pre');
    pre.id = 'TESTRESULT';
    pre.textContent = 'BEGIN\n' + out.join('\n') + '\nEND';
    document.body.appendChild(pre);
  };

  try {
    check('sin_errores_arranque', errs.length === 0);

    /* --- catálogo: evento input real --- */
    const search = document.getElementById('spriteSearch');
    check('input_existe', !!search);
    search.value = 'gato';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    const gatoCount = document.querySelectorAll('#spriteChoices .sprite-choice').length;
    check('input_filtra', spriteSearchTerm === 'gato' && gatoCount > 0 && gatoCount < SPRITE_CHOICES.length);
    search.value = '';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    check('input_limpia', document.querySelectorAll('#spriteChoices .sprite-choice').length === SPRITE_CHOICES.length);
    check('grupos_visibles', document.querySelectorAll('#spriteChoices .sprite-group-title').length === SPRITE_GROUPS.length);

    /* --- modal y alta de personaje desde el catálogo --- */
    const addBtn = document.querySelector('#spriteTray [data-add-sprite]');
    check('boton_agregar', !!addBtn);
    search.value = 'xxx';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    addBtn.click();
    check('modal_abre_y_resetea', !document.getElementById('spriteModal').hidden && spriteSearchTerm === '');
    const before = sprites.length;
    const rocket = document.querySelector('#spriteChoices .sprite-choice[data-emoji="🚀"]');
    check('cohete_disponible', !!rocket);
    rocket.click();
    check('agrega_personaje', sprites.length === before + 1 && sprites[sprites.length - 1].emoji === '🚀');
    check('modal_cierra', document.getElementById('spriteModal').hidden === true);

    /* --- proyecto controlado con 4 sombreros --- */
    const N = (type, val) => makeNode(type, val);
    sprites = [createSpriteData('🐱', 'A', [
      N('when_flag'), N('move', 10),
      N('when_key', 'a'), N('say', 'tecla'),
      N('when_tap'), N('hide'),
      N('when_score', 10), N('say', 'puntos')
    ])];
    selectedSpriteId = sprites[0].id;
    score = 0;
    runActive = false;
    firedScoreHats.clear();
    render();
    stopCode();
    check('cuatro_guiones', collectScripts().length === 4);

    /* --- propiedades en vivo no pisan un campo enfocado --- */
    const px = document.getElementById('propX');
    px.focus();
    px.value = '999';
    sprites[0].x = 42;
    updatePropLive(sprites[0]);
    check('prop_live_respeta_foco', px.value === '999');
    px.blur();
    updatePropLive(sprites[0]);
    check('prop_live_sin_foco', px.value === '42');

    /* --- ejecución: no persistir cambios de fondo --- */
    let saves = 0;
    const origScheduleSave = window.scheduleSave;
    window.scheduleSave = function () { saves++; };
    const bg0 = stageBg;
    runActive = true;
    changeBg();
    check('runtime_no_guarda', saves === 0);
    runActive = false;
    changeBg();
    check('diseno_si_guarda', saves === 1);
    window.scheduleSave = origScheduleSave;
    stageBg = bg0;

    /* --- teclado real: solo el guion when_key --- */
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true }));
    check('tecla_arranca_un_hilo', runActive === true && runThreads.size === 1);
    stopCode();
    check('stop_limpia_hilos', runThreads.size === 0 && runActive === false);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', bubbles: true, cancelable: true }));
    check('tecla_ajena_no_arranca', runActive === false && runThreads.size === 0);

    /* --- toque real en el escenario --- */
    document.getElementById('stage').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    check('toque_arranca_un_hilo', runActive === true && runThreads.size === 1);
    stopCode();

    /* --- bandera verde reinicia en vez de duplicar hilos --- */
    runAll();
    runAll();
    check('bandera_reinicia', runActive === true && runThreads.size === 1);
    stopCode();

    /* --- multijugador se persiste --- */
    try {
      const was = multiOn;
      document.getElementById('multiBtn').click();
      const saved = JSON.parse(localStorage.getItem('scrachmo_v8'));
      check('multi_persiste', saved && saved.multiOn === multiOn && saved.multiOn !== was);
      multiOn = was;
    } catch (e) {
      check('multi_persiste', false);
    }

    /* --- sombrero de puntaje: un solo disparo, sin bucle de 300 ms --- */
    let scoreCalls = 0;
    const origRunScripts = window.runScripts;
    check('wrapper_disponible', typeof origRunScripts === 'function');
    window.runScripts = function (list) { scoreCalls++; return origRunScripts(list); };
    score = 20;
    firedScoreHats.clear();

    setTimeout(() => {
      try {
        check('score_dispara_una_sola_vez', scoreCalls === 1);
        check('score_hat_queda_registrado', firedScoreHats.size === 1);
        check('sin_errores_finales', errs.length === 0);
      } catch (e) {
        out.push('ERROR ' + e.message);
      }
      window.runScripts = origRunScripts;
      score = 0;
      stopCode();
      done();
    }, 1200);
  } catch (err) {
    out.push('ERROR ' + err.message + ' @ ' + (err.stack || '').split('\n')[1]);
    done();
  }
});
