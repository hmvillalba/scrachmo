window.addEventListener('load', function () {
  const out = [];
  const check = (name, cond) => out.push((cond ? 'PASS ' : 'FAIL ') + name);
  const $ = s => document.querySelector(s);
  const errs = window.__ERRORS__ || [];
  const done = () => {
    const pre = document.createElement('pre');
    pre.id = 'TESTRESULT';
    pre.textContent = 'BEGIN\n' + out.join('\n') + '\nEND';
    document.body.appendChild(pre);
  };

  (async () => {
    try {
      /* ============ 1. estructura y textos ============ */
      check('sin_errores_arranque', errs.length === 0);
      check('dom_nuevo', ['stageZoomOutBtn', 'stageZoomInBtn', 'stageZoomVal', 'resetStartBtn']
        .every(id => !!document.getElementById(id)) && !!$('.stage-bottom'));
      const nuevas = ['stageZoom', 'stageZoomOut', 'stageZoomIn', 'stageZoomReset',
        'backToStart', 'startRestored'];
      check('textos_4_idiomas', ['es', 'en', 'pt', 'fr'].every(l =>
        nuevas.every(k => typeof UI[l][k] === 'string' && UI[l][k].length > 0)));
      check('data_tt_nuevos', ['stageZoomOutBtn', 'stageZoomInBtn', 'stageZoomVal', 'resetStartBtn']
        .every(id => {
          const el = document.getElementById(id);
          const v = UI[lang][el.dataset.tt];
          return v && el.title === v && el.getAttribute('aria-label') === v;
        }));
      check('data_t_nuevos', UI[lang].stageZoom === $('.stage-zoom-label').textContent &&
        UI[lang].backToStart === $('#resetStartBtn span').textContent);
      check('iconos_zoom', ['i-minus', 'i-plus', 'i-rotate-ccw']
        .every(id => !!document.getElementById(id)));
      check('boton_inicio_oculto', $('#resetStartBtn').hidden === true &&
        getComputedStyle($('#resetStartBtn')).display === 'none');
      check('fila_dentro_del_card', (() => {
        const a = $('.stage-bottom').getBoundingClientRect();
        const b = $('#stageCard').getBoundingClientRect();
        return a.left >= b.left - 1 && a.right <= b.right + 1;
      })());
      check('sin_overflow_horizontal', document.documentElement.scrollWidth <= window.innerWidth + 1);

      /* ============ 2. zoom del escenario y los personajes ============ */
      resetZoom(); resetStageZoom(); applyCodeZoom(); applyStageZoom(); render();
      const stage = $('#stage');
      const box0 = stage.getBoundingClientRect();
      const h0 = box0.height;
      const em0 = $('.sprite-emoji').getBoundingClientRect();
      check('zoom_esc_inicial', stageZoom === 1 && $('#stageZoomVal').textContent === '100%' &&
        stage.style.getPropertyValue('--stage-zoom') === '1');
      check('alto_base_valido', h0 > 150 && h0 < 320);
      $('#stageZoomInBtn').click();
      const box1 = stage.getBoundingClientRect();
      const em1 = $('.sprite-emoji').getBoundingClientRect();
      check('zoom_esc_mas', stageZoom === 1.1 && $('#stageZoomVal').textContent === '110%' &&
        stage.style.getPropertyValue('--stage-zoom') === '1.1');
      /* El error que arreglamos: el zoom agrandaba la VENTANA. Ahora la caja
         mide exactamente lo mismo y lo que crece es el contenido, que se
         dibuja escalado (`.stage-world`). */
      check('la_caja_no_cambia', Math.abs(box1.width - box0.width) < 1 && Math.abs(box1.height - box0.height) < 1);
      check('personaje_crece', Math.abs(em1.width / em0.width - 1.1) < 0.02);
      check('posiciones_siguen_porcentuales', posLeft(sprites[0]) === 50 && posTop(sprites[0]) === 50);
      $('#stageZoomOutBtn').click();
      check('zoom_esc_menos', stageZoom === 1 && $('#stageZoomVal').textContent === '100%');
      for (let i = 0; i < 20; i++) changeStageZoom(ZOOM_STEP);
      check('zoom_esc_tope', stageZoom === ZOOM_MAX && $('#stageZoomInBtn').disabled === true);
      for (let i = 0; i < 20; i++) changeStageZoom(-ZOOM_STEP);
      check('zoom_esc_piso', stageZoom === ZOOM_MIN && $('#stageZoomOutBtn').disabled === true);
      $('#stageZoomVal').click();
      check('zoom_esc_reset', stageZoom === 1 && $('#stageZoomVal').textContent === '100%');
      changeStageZoom(ZOOM_STEP);
      check('zoom_esc_se_guarda', JSON.parse(store.get('scrachmo_ui')).stageZoom === 1.1);
      store.set('scrachmo_ui', JSON.stringify({ collapsed: {}, codeZoom: 1.2, stageZoom: 1.3 }));
      loadProject();
      check('zoom_esc_se_restaura', stageZoom === 1.3 && codeZoom === 1.2);
      store.set('scrachmo_ui', JSON.stringify({ collapsed: {}, codeZoom: 1, stageZoom: 99 }));
      loadProject();
      check('zoom_esc_clamp', stageZoom === ZOOM_MAX);
      store.set('scrachmo_ui', JSON.stringify({ blocksCard: true, palette: false }));
      loadProject();
      check('zoom_esc_ui_vieja', stageZoom === 1 && codeZoom === 1 && collapsed.blocksCard === true);
      changeZoom(ZOOM_STEP);
      check('zooms_independientes', stageZoom === 1 && codeZoom === 1.1);
      resetZoom();
      changeStageZoom(ZOOM_STEP); changeStageZoom(ZOOM_STEP);
      const fg0 = parseFloat(getComputedStyle($('.sprite-emoji')).fontSize);
      document.body.classList.add('game-mode');
      const fg1 = parseFloat(getComputedStyle($('.sprite-emoji')).fontSize);
      check('game_mode_respeta_zoom', fg1 > fg0 && getComputedStyle($('.stage-bottom')).display === 'none');
      document.body.classList.remove('game-mode');
      resetStageZoom(); applyStageZoom();
      /* loadProject() reemplazó `sprites`: hay que redibujar la capa antes
         de buscar el globo, si no queda apuntando al sprite viejo. */
      render();

      /* ============ 3. globo de diálogo legible ============ */
      const s = sprites[0];
      saySprite(s, '¡Hola!');
      const bub = $('.sprite-bubble');
      /* La animación de entrada escala el globo: si se mide mientras corre, el
         resultado depende de la velocidad de cada equipo. Se apaga y se mide. */
      bub.style.animation = 'none';
      const br = bub.getBoundingClientRect();
      check('burbuja_visible', bub.classList.contains('show') && getComputedStyle(bub).display === 'block');
      check('burbuja_texto', bub.textContent === '¡Hola!');
      check('burbuja_ancho_legible', br.width >= 44 && br.width <= 160);
      check('burbuja_no_vertical', br.width > br.height * 1.4);
      check('burbuja_una_linea', br.height < 34);
      /* Centrado sobre el personaje. La tolerancia es de 4 px a propósito: el
         centrado es exacto, pero el redondeo de subpíxel cambia entre
         plataformas (en el runner Linux daba algo más de 2 px). Un globo
         realmente corrido se desvía decenas de píxeles, no cuatro. */
      const wrapBox = $('.sprite-wrap').getBoundingClientRect();
      const offCenter = Math.abs((br.left + br.width / 2) - (wrapBox.left + wrapBox.width / 2));
      if (offCenter >= 4) console.log('INFO desvío del globo: ' + offCenter.toFixed(2) + ' px');
      check('burbuja_centrada', offCenter < 4);
      saySprite(s, 'Hola hola hola hola hola hola hola hola hola');
      const br2 = bub.getBoundingClientRect();
      check('burbuja_larga_envuelve', br2.width > 100 && br2.width <= 152 && br2.height > br.height);
      check('burbuja_larga_sigue_horizontal', br2.width > br2.height);
      clearSayBubbles();
      check('burbuja_se_limpia', getComputedStyle(bub).display === 'none' && bub.textContent === '');

      /* ============ 4. posición final y «Volver al inicio» ============ */
      sprites = [createSpriteData('🐱', 'Prueba', [makeNode('when_flag'), makeNode('move', 50)])];
      selectedSpriteId = sprites[0].id;
      sprites[0].x = 0; sprites[0].y = 0; sprites[0].dir = 90;
      runtimeSnapshot = null;
      render();
      check('inicio_sin_boton', $('#resetStartBtn').hidden === true && sprites[0].x === 0);
      const hist0 = undoStack.length;
      fireEvent('when_flag');
      check('corrida_arranca', runActive === true && sprites[0].x === 50);
      check('boton_oculto_mientras_corre', $('#resetStartBtn').hidden === true);
      await sleep(450);
      check('corrida_termina_sola', runActive === false && runThreads.size === 0);
      check('fin_conserva_posicion', sprites[0].x === 50);
      check('fin_no_vuelve_a_cero', sprites[0].x !== 0);
      check('fin_guarda_estado', (() => {
        const p = JSON.parse(localStorage.getItem('scrachmo_v8'));
        return !!p && p.sprites[0].x === 50;
      })());
      check('fin_no_ensucia_historial', undoStack.length === hist0);
      check('fin_muestra_boton', $('#resetStartBtn').hidden === false);
      $('#resetStartBtn').click();
      check('reset_vuelve_al_inicio', sprites[0].x === 0);
      check('reset_oculta_boton', $('#resetStartBtn').hidden === true && runtimeSnapshot === null);
      check('reset_guarda_estado', (() => {
        const p = JSON.parse(localStorage.getItem('scrachmo_v8'));
        return !!p && p.sprites[0].x === 0;
      })());

      fireEvent('when_flag');
      stopCode();
      check('stop_conserva_posicion', sprites[0].x === 50 && runActive === false);
      check('stop_muestra_boton', $('#resetStartBtn').hidden === false);
      resetToStart();

      /* El estado final pasa a ser el de diseño: la corrida siguiente
         parte de donde quedó, no de un cero mágico. */
      sprites[0].x = 30;
      render();
      fireEvent('when_flag');
      await sleep(450);
      check('siguiente_corrida_parte_del_estado', sprites[0].x === 80);
      resetToStart();
      check('reset_vuelve_a_30', sprites[0].x === 30);

      changeStageZoom(ZOOM_STEP); changeStageZoom(ZOOM_STEP); changeStageZoom(ZOOM_STEP);
      sprites[0].x = 0; render();
      fireEvent('when_flag');
      await sleep(450);
      check('zoom_no_altera_movimiento', sprites[0].x === 50);
      resetToStart();
      resetStageZoom(); applyStageZoom();

      check('sin_errores_final', errs.length === 0);
    } catch (err) {
      out.push('ERROR ' + err.message + ' @ ' + (err.stack || '').split('\n')[1]);
    }
    done();
  })();
});
