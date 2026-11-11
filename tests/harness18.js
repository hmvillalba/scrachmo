/* Tanda 13: el escenario deja de ser fijo y se agranda arrastrando sus asas.
   Lo que se mide acá es lo que el usuario pidió: que crezca HACIA ABAJO (y
   hacia la derecha), que lo que ya estaba puesto no se mueva ni un píxel, que
   los bordes y los choques sigan al tamaño nuevo, que se guarde en el proyecto
   y que se pueda volver al tamaño de fábrica (480x360). */
window.addEventListener('load', function () {
  const out = [];
  const check = (name, cond) => out.push((cond ? 'PASS ' : 'FAIL ') + name);
  const $ = s => document.querySelector(s);
  const errs = window.__ERRORS__ || [];
  const css = (el, prop) => getComputedStyle(el)[prop];
  const box = () => $('#stage').getBoundingClientRect();
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

      const stage = $('#stage');
      const gripY = $('#gripY');
      const gripX = $('#gripX');
      const gripC = $('#gripCorner');
      const resetBtn = $('#stageSizeReset');

      /* ============ 1. las piezas ============ */
      check('asas_existen', !!gripY && !!gripX && !!gripC);
      check('asa_debajo_es_vertical', !!gripY && css(gripY, 'cursor') === 'ns-resize');
      check('asa_derecha_es_horizontal', !!gripX && css(gripX, 'cursor') === 'ew-resize');
      check('esquina_es_diagonal', !!gripC && css(gripC, 'cursor') === 'nwse-resize');
      check('boton_reset_existe', !!resetBtn);
      check('reset_traducido', !!resetBtn && resetBtn.title === UI[lang].stageSizeReset &&
        resetBtn.getAttribute('aria-label') === UI[lang].stageSizeReset);
      const CLAVES = ['stageResizeY', 'stageResizeX', 'stageResizeXY', 'stageSizeReset',
        'stageSizeResetDone', 'sb3WorldSize'];
      check('claves_en_4_idiomas', ['es', 'en', 'pt', 'fr'].every(l =>
        CLAVES.every(k => typeof UI[l][k] === 'string' && UI[l][k].length > 0)));
      check('frases_distintas_por_idioma', ['en', 'pt', 'fr'].every(l =>
        UI[l].stageSizeReset !== UI.es.stageSizeReset && UI[l].stageResizeY !== UI.es.stageResizeY));

      /* ============ 2. el mundo de fábrica ============ */
      resetWorldSize();
      check('mundo_de_fabrica', worldW === 480 && worldH === 360);
      check('vars_css', document.body.style.getPropertyValue('--stage-w') === '480' &&
        document.body.style.getPropertyValue('--stage-h') === '360');
      const b0 = box();
      check('caja_4_3', Math.abs(b0.width / b0.height - 4 / 3) < 0.02);
      check('reset_oculto', resetBtn.hidden === true);
      check('bordes_de_fabrica', worldLeft() === -240 && worldRight() === 240 &&
        worldTop() === 180 && worldBottom() === -180);
      /* Con el tamaño de fábrica las fórmulas nuevas tienen que dar exactamente
         lo mismo que las viejas (50 + x/4.8 y 50 - y/3.6), si no los proyectos
         ya guardados se correrían. */
      check('posiciones_de_fabrica',
        posLeft({ x: 0 }) === 50 && posLeft({ x: 240 }) === 100 && posLeft({ x: -240 }) === 0 &&
        posTop({ y: 0 }) === 50 && posTop({ y: 180 }) === 0 && posTop({ y: -180 }) === 100);

      /* ============ 3. agrandar hacia abajo ============ */
      const s = sprites[0];
      s.x = 0; s.y = 0;
      render();
      const off0 = $('.sprite-wrap').getBoundingClientRect().top - box().top;
      const emoji0 = $('.sprite-emoji').getBoundingClientRect().width;
      resizeWorldBy(0, 360);
      const b1 = box();
      check('alto_al_doble', worldH === 720);
      check('borde_de_abajo_nuevo', worldBottom() === -540);
      check('caja_mas_alta', Math.abs(b1.height - b0.height * 2) < 2);
      check('caja_conserva_la_proporcion', Math.abs(b1.width / b1.height - 480 / 720) < 0.02);
      /* Lo importante: el personaje que estaba en el centro sigue a la misma
         distancia del borde de arriba. El espacio nuevo aparece ABAJO. */
      const off1 = $('.sprite-wrap').getBoundingClientRect().top - box().top;
      check('lo_que_estaba_no_se_mueve', Math.abs(off0 - off1) < 1.5);
      /* El mundo crece pero el personaje no: no es un zoom. */
      check('el_personaje_no_crece', Math.abs($('.sprite-emoji').getBoundingClientRect().width - emoji0) < 1);
      check('reset_visible', resetBtn.hidden === false);

      /* ============ 4. los bordes siguen al tamaño ============ */
      s.x = 0; s.y = -530;   // el borde nuevo está en -540
      check('toca_el_borde_nuevo', touchingEdge(s) === true);
      s.y = -180;
      check('ya_no_toca_el_borde', touchingEdge(s) === false);
      /* Rebotar contra el fondo nuevo lo devuelve adentro. El freno lo pone
         el radio del DIBUJO (edgeRadius), no el de los choques entre
         personajes: con 26 u la mitad del emoji quedaba cortada. */
      s.y = -1000;
      s.dir = 180;
      bounceSprite(s);
      check('rebota_en_el_fondo_nuevo', s.y > worldBottom() && s.y <= worldBottom() + edgeRadius(s) + 0.01);
      s.x = 0; s.y = 0;

      /* ============ 5. agrandar a la derecha ============ */
      resizeWorldBy(480, 0);
      check('ancho_al_doble', worldW === 960 && worldRight() === 720);
      const b2 = box();
      check('caja_mas_ancha', Math.abs(b2.width / b2.height - 960 / 720) < 0.02);
      s.x = worldRight();
      check('se_puede_ir_a_la_derecha_nueva', posLeft(s) === 100 && posLeft({ x: 700 }) > 97);
      s.x = 0;

      /* ============ 6. topes ============ */
      resizeWorldBy(99999, 99999);
      check('tope_maximo', worldW === WORLD_MAX_W && worldH === WORLD_MAX_H);
      resizeWorldBy(-99999, -99999);
      check('tope_minimo', worldW === WORLD_MIN_W && worldH === WORLD_MIN_H);

      /* ============ 7. se guarda en el proyecto ============ */
      resizeWorldBy(480, 360);
      const pl = serializeProject();
      check('serializa', pl.worldW === 960 && pl.worldH === 720);
      const copia = JSON.parse(JSON.stringify(pl));
      applyPayload(copia);
      check('se_restaura', worldW === 960 && worldH === 720);
      check('vars_css_tras_cargar', document.body.style.getPropertyValue('--stage-w') === '960');
      /* Un proyecto viejo no trae el campo: tiene que caer en el de fábrica. */
      const viejo = JSON.parse(JSON.stringify(pl));
      delete viejo.worldW;
      delete viejo.worldH;
      applyPayload(viejo);
      check('payload_sin_tamano_usa_el_de_fabrica', worldW === 480 && worldH === 360);
      /* Y un tamaño absurdo se recorta en vez de romper el escenario. */
      const roto = JSON.parse(JSON.stringify(pl));
      roto.worldW = 99999;
      roto.worldH = -5;
      applyPayload(roto);
      check('tamano_absurdo_se_recorta', worldW === WORLD_MAX_W && worldH === WORLD_MIN_H);

      /* ============ 8. volver al tamaño original ============ */
      resizeWorldBy(480, 360);
      sprites[0].x = 700;
      sprites[0].y = -500;
      resetWorldSize();
      check('vuelve_al_original', worldW === 480 && worldH === 360);
      check('recorta_lo_que_quedaba_afuera',
        Math.abs(sprites[0].x - (worldRight() - edgeRadius(sprites[0]))) < 0.001 &&
        Math.abs(sprites[0].y - (worldBottom() + edgeRadius(sprites[0]))) < 0.001);
      check('reset_oculto_otra_vez', resetBtn.hidden === true);
      check('caja_de_vuelta', Math.abs(box().width - b0.width) < 1);

      /* ============ 9. el asa arrastra de verdad ============ */
      const antes = worldH;
      const altoCaja = box().height;
      const ev = (type, el, x, y) => el.dispatchEvent(new PointerEvent(type, {
        clientX: x, clientY: y, pointerId: 7, bubbles: true, cancelable: true, pointerType: 'touch'
      }));
      ev('pointerdown', gripY, 100, 100);
      ev('pointermove', window, 100, 160);
      const tras = worldH;
      ev('pointerup', window, 100, 160);
      check('el_asa_de_abajo_agranda', tras > antes + 40);
      check('el_asa_no_cambia_el_ancho', worldW === 480);
      /* 60 px de arrastre tienen que valer ~60 px de mundo, no el doble. */
      const esperado = 60 * (antes / altoCaja);
      check('el_asa_sigue_al_dedo', Math.abs((tras - antes) - esperado) < esperado * 0.25);

      resetWorldSize();
      const antesX = worldW;
      ev('pointerdown', gripX, 100, 100);
      ev('pointermove', window, 160, 100);
      ev('pointerup', window, 160, 100);
      check('el_asa_derecha_ensancha', worldW > antesX + 40 && worldH === 360);

      /* ============ 10. teclado ============ */
      resetWorldSize();
      const antesK = worldH;
      keyStageResize({ key: 'ArrowDown', shiftKey: false, preventDefault() { } }, 'y');
      check('teclado_agranda', worldH === antesK + 60);
      keyStageResize({ key: 'ArrowUp', shiftKey: false, preventDefault() { } }, 'y');
      check('teclado_achica', worldH === antesK);
      keyStageResize({ key: 'ArrowDown', shiftKey: false, preventDefault() { } }, 'y');
      keyStageResize({ key: 'ArrowUp', shiftKey: false, preventDefault() { } }, 'y');
      resetWorldSize();

      /* ============ 11. el asa no es parte del juego ============ */
      /* El guion va PLANO: el sombrero y las pilas siguientes como hermanos,
         que es como los lee collectScripts(). */
      sprites[0].code = [makeNode('when_tap'), makeNode('score_add', 1)];
      score = 0;
      gripY.click();
      await new Promise(r => setTimeout(r, 150));
      check('el_asa_no_dispara_el_toque', score === 0);
      stage.click();
      await new Promise(r => setTimeout(r, 350));
      check('el_escenario_si_dispara_el_toque', score === 1);
      sprites[0].code = [];
      score = 0;

      /* ============ 12. modo juego ============ */
      resizeWorldBy(0, 360);
      document.body.classList.add('game-mode');
      const rj = box();
      check('juego_respeta_el_tamano', Math.abs(rj.width / rj.height - worldW / worldH) < 0.02);
      check('juego_entra_en_la_pantalla',
        rj.width <= window.innerWidth + 1 && rj.height <= window.innerHeight + 1);
      document.body.classList.remove('game-mode');
      resetWorldSize();

      check('sin_errores_final', errs.length === 0);
    } catch (err) {
      out.push('ERROR ' + err.message + ' @ ' + (err.stack || '').split('\n')[1]);
    }
    clearTimeout(watchdog);
    done();
  })();
});
