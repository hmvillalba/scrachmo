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

      /* ============ 9. inclinación: el acelerómetro como flechas ============
         El acelerómetro NO gira con la pantalla, así que el eje «derecha» hay
         que rotarlo a mano. Con el aparato vertical la derecha es +x; girado
         90° pasa a ser -y. */
      check('el_eje_derecha_en_vertical', tiltBasis(0).join(',') === '1,0');
      check('el_eje_derecha_girado_90', tiltBasis(90).join(',') === '0,-1');
      check('el_eje_derecha_al_reves', tiltBasis(180).join(',') === '-1,0');
      check('el_eje_derecha_girado_270', tiltBasis(270).join(',') === '0,1');

      /* La gravedad reportada apunta hacia arriba del mundo. Con el teléfono
         derecho va por +y; con el borde derecho abajo gana -x, y por eso el
         roll se invierte para que «derecha» quede positivo. */
      const enReposo = tiltRead({ x: 0, y: 9.81, z: 0 }, 0);
      check('en_reposo_no_hay_inclinacion',
        Math.abs(enReposo.roll) < 1e-9 && Math.abs(enReposo.pitch) < 1e-9);
      check('el_borde_derecho_abajo_da_roll_positivo',
        tiltRead({ x: -4.9, y: 8.5, z: 0 }, 0).roll > 0.4);
      check('alejar_la_pantalla_sube_el_pitch',
        tiltRead({ x: 0, y: 9.22, z: 3.35 }, 0).pitch > 0.3);
      check('en_horizontal_la_derecha_cambia_de_eje',
        tiltRead({ x: 0, y: 4.9, z: 0 }, 90).roll > 0.4);

      /* Zona muerta: sin ella el pulso encendería y apagaría la tecla. */
      check('la_zona_muerta_conserva_el_estado', tiltAxis(0.16, 1) === 1);
      check('pasado_el_umbral_enciende', tiltAxis(0.3, 0) === 1);
      check('volver_al_centro_apaga', tiltAxis(0.05, 1) === 0);
      check('no_se_dispara_una_tecla_que_el_proyecto_no_usa',
        tiltKeys(0, 1, projectKeys()).length === 0);
      check('se_dispara_la_flecha_que_corresponde',
        tiltKeys(1, 0, projectKeys()).join(',') === 'arrowright' &&
        tiltKeys(-1, 0, projectKeys()).join(',') === 'arrowleft');

      /* Integración: el sensor mueve al personaje de verdad. */
      const enviarG = a => {
        const ev = new Event('devicemotion');
        Object.defineProperty(ev, 'accelerationIncludingGravity', { value: a });
        window.dispatchEvent(ev);
      };
      sprites = [nave];
      selectedSpriteId = nave.id;
      render();
      enterGame();
      await sleep(80);

      const antesApagado = nave.x;
      /* Dos lecturas DISTINTAS: la primera sólo calibraría, así que con una
         sola la prueba pasaría aunque el modo apagado no frenara nada. */
      enviarG({ x: -6, y: 7.8, z: 0 });
      await sleep(60);
      enviarG({ x: 6, y: 7.8, z: 0 });
      await sleep(180);
      check('con_el_modo_apagado_la_inclinacion_no_hace_nada', nave.x === antesApagado);

      setTilt(true);
      await sleep(20);
      check('el_modo_encendido_se_guarda', store.get('scrachmo_tilt') === '1');
      /* La primera lectura es el cero: la postura en la que estabas. */
      const antesCalibrar = nave.x;
      enviarG({ x: -6, y: 7.8, z: 0 });
      await sleep(180);
      check('la_primera_lectura_calibra_y_no_mueve', nave.x === antesCalibrar);

      const antesInclinar = nave.x;
      enviarG({ x: 6, y: 7.8, z: 0 });
      await sleep(220);
      check('inclinar_mueve_al_personaje', nave.x !== antesInclinar);
      check('la_flecha_del_mando_se_ilumina',
        boton('arrowleft') && boton('arrowleft').classList.contains('is-down'));

      setTilt(false);
      await sleep(20);
      check('el_modo_apagado_se_guarda', store.get('scrachmo_tilt') === '0');
      check('al_apagar_se_apaga_la_luz',
        boton('arrowleft') && !boton('arrowleft').classList.contains('is-down'));
      const antesDeApagar = nave.x;
      enviarG({ x: 6, y: 7.8, z: 0 });
      await sleep(60);
      enviarG({ x: -6, y: 7.8, z: 0 });
      await sleep(220);
      check('apagado_deja_de_mover', nave.x === antesDeApagar);

      /* El interruptor sólo aparece donde hay sensor: acá se simula un táctil. */
      Object.defineProperty(navigator, 'maxTouchPoints', { value: 5, configurable: true });
      setTilt(true);
      buildPad();
      check('en_un_tactil_aparece_el_interruptor', $('#tiltBtn').hidden === false);
      check('el_interruptor_avisa_que_esta_prendido',
        $('#tiltBtn').getAttribute('aria-pressed') === 'true' &&
        $('#tiltBtn').getAttribute('aria-label') === UI[lang].padTiltTip);
      setTilt(false);
      buildPad();
      check('el_interruptor_avisa_que_esta_apagado',
        $('#tiltBtn').getAttribute('aria-pressed') === 'false');
      exitGame();
      await sleep(60);

      check('sin_errores_final', errs.length === 0);
    } catch (err) {
      out.push('ERROR ' + err.message + ' @ ' + (err.stack || '').split('\n')[1]);
    }
    clearTimeout(watchdog);
    done();
  })();
});
