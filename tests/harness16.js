/* Tanda 11: modo juego con el campo en 4:3 y aviso de girar.
   El mundo del juego mide 480x360 unidades (4:3) y las posiciones son
   porcentajes puros del escenario: si el escenario no mide 4:3 se estira, y
   entonces 100 pasos hacia arriba se ven más grandes que 100 a la derecha
   aunque los choques se sigan calculando en unidades. Eso es lo que se mide
   acá, moviendo un personaje de verdad. El aviso de girar se prueba forzando
   la clase `game-portrait`, porque la ventana de las pruebas es apaisada. */
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

      const stage = $('#stage');
      const hint = $('#rotateHint');
      const close = $('#rotateClose');
      const css = (el, prop) => getComputedStyle(el)[prop];

      /* ============ 1. las piezas ============ */
      check('campo_existe', !!stage);
      check('aviso_existe', !!hint && !!close);
      check('aviso_traducido', !!hint && hint.textContent.indexOf(UI[lang].rotateHint) > -1);
      check('aviso_cerrado_por_defecto', !!hint && css(hint, 'display') === 'none');
      /* No es un `.modal`: no bloquea el scroll ni secuestra el foco. */
      check('no_es_un_modal', !!hint && !hint.classList.contains('modal'));
      check('boton_cerrar_traducido', !!close &&
        close.title === UI[lang].rotateHintClose &&
        close.getAttribute('aria-label') === UI[lang].rotateHintClose);

      /* ============ 2. el campo al entrar al juego ============ */
      enterGame();
      check('entra_en_modo_juego', document.body.classList.contains('game-mode'));

      const r = stage.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      check('campo_cabe_en_la_pantalla', r.width <= vw + 1 && r.height <= vh + 1);
      check('campo_proporcion_4_3', Math.abs(r.width / r.height - 4 / 3) < 0.02);
      /* El rectángulo 4:3 más grande que entra: al menos un lado toca el borde. */
      check('campo_aprovecha_lo_maximo',
        Math.abs(r.width - vw) <= 1.5 || Math.abs(r.height - vh) <= 1.5);
      check('campo_centrado_horizontal', Math.abs((r.left + r.width / 2) - vw / 2) <= 1.5);
      check('campo_centrado_vertical', Math.abs((r.top + r.height / 2) - vh / 2) <= 1.5);

      /* ============ 3. lo que se ve coincide con lo que se toca ============ */
      const s = sprites[0];
      const x0 = s.x;
      const y0 = s.y;
      const size0 = s.size;
      const rot0 = s.rot;
      /* El borde seguro depende del tamaño del DIBUJO: con el gato de fábrica
         (size 100 y rotación libre) y:100 ya queda afuera y el motor lo recorta
         a 95. Para medir 100 unidades limpias se achica el personaje sólo
         durante la medición; el centro y la escala del escenario no cambian. */
      s.size = 50;
      s.rot = 'none';
      const punto = () => $('.sprite-wrap').getBoundingClientRect();
      s.x = 0; s.y = 0;
      render();
      const a = punto();
      s.x = 100; s.y = 0;
      render();
      const b = punto();
      s.x = 0; s.y = 100;
      render();
      const c = punto();
      const dx = b.left - a.left;
      const dy = a.top - c.top;
      check('100_derecha_igual_que_100_arriba', Math.abs(dx - dy) <= 1.5);
      check('pixeles_por_unidad_coherentes',
        Math.abs(dx - r.width / 4.8) <= 1.5 && Math.abs(dy - r.height / 3.6) <= 1.5);
      s.x = x0; s.y = y0;
      s.size = size0; s.rot = rot0;
      render();

      /* ============ 4. el aviso, sólo en vertical ============ */
      check('aviso_oculto_en_apaisado',
        !document.body.classList.contains('game-portrait') && css(hint, 'display') === 'none');

      document.body.classList.add('game-portrait');
      check('aviso_visible_en_vertical', css(hint, 'display') === 'flex');
      check('aviso_fijo_abajo', css(hint, 'position') === 'fixed');
      check('aviso_no_bloquea_el_scroll', !document.body.classList.contains('modal-open'));

      close.click();
      check('se_puede_cerrar', css(hint, 'display') === 'none');
      check('el_cierre_no_toca_el_juego', document.body.classList.contains('game-mode'));

      /* ============ 5. entrar y salir ============ */
      exitGame();
      check('sale_del_modo_juego', !document.body.classList.contains('game-mode'));
      check('sale_del_vertical', !document.body.classList.contains('game-portrait'));
      enterGame();
      check('el_aviso_vuelve_al_entrar', !hint.classList.contains('is-off'));
      check('orientacion_segun_la_ventana',
        document.body.classList.contains('game-portrait') ===
        window.matchMedia('(orientation: portrait)').matches);
      exitGame();

      /* ============ 6. los textos en los 4 idiomas ============ */
      const CLAVES = ['rotateHint', 'rotateHintClose'];
      check('claves_en_4_idiomas', ['es', 'en', 'pt', 'fr'].every(l =>
        CLAVES.every(k => typeof UI[l][k] === 'string' && UI[l][k].length > 0)));
      check('frases_distintas_por_idioma', ['en', 'pt', 'fr'].every(l =>
        UI[l].rotateHint !== UI.es.rotateHint));

      const idiomaAntes = lang;
      lang = 'en';
      render();
      check('cambia_de_idioma_en_vivo', hint.textContent.indexOf(UI.en.rotateHint) > -1);
      lang = idiomaAntes;
      render();
      check('vuelve_al_idioma', hint.textContent.indexOf(UI[lang].rotateHint) > -1);

      check('sin_errores_final', errs.length === 0);
    } catch (err) {
      out.push('ERROR ' + err.message + ' @ ' + (err.stack || '').split('\n')[1]);
    }
    clearTimeout(watchdog);
    done();
  })();
});
