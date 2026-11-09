/* Tanda 7: layout horizontal. El layout ancho (>= 900 px) no se puede medir
   desde acá porque la ventana de las pruebas mide 800 px, así que lo que se
   comprueba es lo que sí importa en este ancho: que el celular siga apilado
   en el orden de siempre, que las columnas se disuelvan y que el modo juego
   siga ocupando toda la pantalla. La disposición ancha se revisó en capturas
   reales y su CSS está cubierto por las comprobaciones estáticas. */
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

  const IDS = ['stageCard', 'spritesCard', 'codeCard', 'varsCard', 'toolsCard', 'blocksCard'];
  const box = id => document.getElementById(id).getBoundingClientRect();
  const css = (el, prop) => getComputedStyle(el).getPropertyValue(prop);

  (async () => {
    try {
      check('sin_errores_arranque', errs.length === 0);

      /* ============ 1. este ancho es el apilado ============ */
      check('ventana_de_pruebas_no_es_ancha', window.matchMedia('(min-width:900px)').matches === false);
      check('columnas_existen', !!$('#colLeft') && !!$('#colRight'));
      check('columnas_disvueltas', css($('#colLeft'), 'display') === 'contents' &&
        css($('#colRight'), 'display') === 'contents');
      check('main_apila_en_columna', css($('main'), 'flex-direction') === 'column');

      /* ============ 2. orden visual apilado ============ */
      const tops = IDS.map(id => box(id).top);
      const enOrden = tops.every((t, i) => i === 0 || t >= tops[i - 1]);
      check('orden_apilado', enOrden);
      const izquierdas = IDS.map(id => Math.round(box(id).left));
      check('una_sola_columna', new Set(izquierdas).size === 1);
      check('mismo_ancho', new Set(IDS.map(id => Math.round(box(id).width))).size === 1);

      /* `order` devuelve el orden de siempre, no el de las columnas. */
      const orders = IDS.map(id => css(document.getElementById(id), 'order'));
      check('order_de_movil', orders.join(',') === '1,2,3,4,5,6');

      /* ============ 3. sin desborde horizontal ============ */
      const doc = document.documentElement;
      check('sin_desborde_horizontal', doc.scrollWidth <= doc.clientWidth + 1);

      /* ============ 4. el escenario conserva su alto de celular ============ */
      const stageH = box('stageCard').height;
      check('escenario_razonable', stageH > 150 && stageH < 600);

      /* ============ 5. modo juego: pantalla completa ============ */
      document.body.classList.add('game-mode');
      render();
      check('juego_oculta_codigo', css($('#codeCard'), 'display') === 'none');
      check('juego_oculta_bloques', css($('#blocksCard'), 'display') === 'none');
      check('juego_oculta_personajes', css($('#spritesCard'), 'display') === 'none');
      check('juego_muestra_escenario', css($('#stageCard'), 'display') !== 'none');
      const juegoStage = box('stageCard').height;
      check('juego_escenario_completo', Math.abs(juegoStage - window.innerHeight) < 3);
      check('juego_sin_margenes', css($('main'), 'padding') === '0px' || css($('main'), 'padding') === '0px 0px 0px 0px');

      document.body.classList.remove('game-mode');
      render();
      check('vuelve_el_editor', css($('#codeCard'), 'display') !== 'none' &&
        css($('#blocksCard'), 'display') !== 'none');
      check('vuelve_el_orden', IDS.map(id => Math.round(box(id).top)).every((t, i, a) => i === 0 || t >= a[i - 1]));

      /* El cambio de tamaño a mitad de uso no debe romper nada: se dispara el
         evento resize y se comprueba que no hubo errores nuevos. */
      window.dispatchEvent(new Event('resize'));
      check('resize_sin_errores', errs.length === 0);

      check('sin_errores_final', errs.length === 0);
    } catch (err) {
      out.push('ERROR ' + err.message + ' @ ' + (err.stack || '').split('\n')[1]);
    }
    clearTimeout(watchdog);
    done();
  })();
});
