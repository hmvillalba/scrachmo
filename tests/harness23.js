/* Tanda 28: mando en pantalla para jugar desde el celular.

   El problema: «al presionar» se dispara con un keydown de verdad y un
   teléfono no tiene teclado, así que un juego de flechas era injugable. El
   mando toca los MISMOS guiones que la tecla física, repite mientras se
   mantiene apretado y no debe disparar «al tocar» de paso. */
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

  const make = (name, code) => createSpriteData('🐱', name, code || []);
  const ptr = (el, type, id) => el.dispatchEvent(new PointerEvent(type, {
    bubbles: true, cancelable: true, pointerId: id || 1, pointerType: 'touch', isPrimary: true
  }));
  const boton = key => document.querySelector('#pad [data-key="' + key + '"]');

  (async () => {
    try {
      check('sin_errores_arranque', errs.length === 0);

      /* ============ 1. el proyecto no usa teclas ============ */
      const quieto = make('Quieto', [makeNode('when_flag'), makeNode('move', 10)]);
      sprites = [quieto];
      selectedSpriteId = quieto.id;
      render();
      check('sin_teclas_no_hay_teclas', projectKeys().length === 0);
      enterGame();
      await sleep(60);
      check('sin_teclas_el_mando_no_aparece', $('#pad').hidden === true);
      exitGame();

      /* ============ 2. flechas: se arma sólo lo que se usa ============ */
      const nave = make('Nave', [
        makeNode('when_flag'),
        makeNode('go_xy', '0,0'),
        makeNode('when_key', 'arrowright'),
        makeNode('move', 10),
        makeNode('when_key', 'arrowleft'),
        makeNode('move', 10),
        makeNode('when_key', ' '),
        makeNode('score_add', 1)
      ]);
      sprites = [nave];
      selectedSpriteId = nave.id;
      render();
      check('detecta_las_tres_teclas', projectKeys().join(',') === 'arrowright,arrowleft, ');
      check('no_repite_teclas', projectKeys().length === new Set(projectKeys()).size);

      enterGame();
      await sleep(60);
      const pad = $('#pad');
      check('en_modo_juego_aparece_el_mando', pad.hidden === false);
      check('el_mando_es_un_grupo_accesible',
        pad.getAttribute('role') === 'group' &&
        pad.getAttribute('aria-label') === UI[lang].padTitle);
      check('el_d_pad_se_ve_con_flechas', $('#padDir').hidden === false);
      check('la_flecha_usada_esta_activa', boton('arrowright') &&
        !boton('arrowright').classList.contains('is-off'));
      /* Las que no usa quedan en su celda pero invisibles: si se sacaran, el
         D-pad se desarmaría con sólo izquierda y derecha. */
      check('la_flecha_sin_uso_queda_oculta', boton('arrowup') &&
        boton('arrowup').classList.contains('is-off'));
      check('el_boton_de_accion_lleva_su_nombre', (() => {
        const b = $('#padActs [data-key]');
        return !!b && b.textContent === UI[lang].padFire &&
          b.getAttribute('aria-label') === UI[lang].padFire;
      })());

      /* ============ 3. el botón mueve al personaje de verdad ============ */
      const x0 = nave.x;
      ptr(boton('arrowright'), 'pointerdown');
      await sleep(60);
      ptr(boton('arrowright'), 'pointerup');
      await sleep(120);
      check('el_boton_mueve_al_personaje', nave.x !== x0);
      const trasUnToque = nave.x;

      /* ============ 4. mantener apretado repite ============ */
      ptr(boton('arrowright'), 'pointerdown');
      await sleep(400);
      ptr(boton('arrowright'), 'pointerup');
      await sleep(120);
      check('mantener_apretado_repite', nave.x - trasUnToque > 10);
      const trasSoltar = nave.x;
      await sleep(300);
      check('al_soltar_deja_de_repetir', nave.x === trasSoltar);

      /* ============ 5. el mando no dispara «al tocar» ============ */
      const taps = make('Tap', [makeNode('when_tap'), makeNode('score_add', 5)]);
      sprites = [nave, taps];
      selectedSpriteId = nave.id;
      render();
      buildPad();
      const puntos = score;
      ptr(boton('arrowright'), 'pointerdown');
      await sleep(80);
      ptr(boton('arrowright'), 'pointerup');
      await sleep(120);
      check('el_mando_no_dispara_al_tocar', score === puntos);

      /* ============ 6. el teclado físico sigue funcionando igual ============ */
      const antesTecla = nave.x;
      window.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'ArrowRight', bubbles: true, cancelable: true
      }));
      await sleep(150);
      check('la_tecla_fisica_sigue_andando', nave.x !== antesTecla);
      check('el_mando_y_la_tecla_usan_la_misma_funcion',
        typeof fireKey === 'function' && fireKey('arrowleft') === 1);

      /* ============ 7. salir del modo juego esconde el mando ============ */
      exitGame();
      await sleep(60);
      check('al_salir_se_esconde_el_mando', $('#pad').hidden === true);

      /* ============ 8. la pista del escenario es la que corresponde ============ */
      const t = UI[lang];
      const pista = stageHintText(t);
      check('la_pista_sale_de_las_tres_conocidas',
        [t.padHint, t.stageHint, t.stageHintRun].indexOf(pista) > -1);

      check('sin_errores_final', errs.length === 0);
    } catch (err) {
      out.push('ERROR ' + err.message + ' @ ' + (err.stack || '').split('\n')[1]);
    }
    clearTimeout(watchdog);
    done();
  })();
});
