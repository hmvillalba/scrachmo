/* Tanda 38: lápiz (P2.12, fase 4).
   Comprueba el catálogo en cuatro idiomas, la capa de canvas dentro del
   mundo, la conversión de colores, el estado POR PERSONAJE, el trazo real
   al mover / ir a x:y:, los sellos, el borrado, que el dibujo es efímero y
   NO se guarda, y que cambiar el tamaño del mundo reescala sin perderlo. */
window.addEventListener('load', function () {
  const out = [];
  const check = (name, cond) => out.push((cond ? 'PASS ' : 'FAIL ') + name);
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
  }, 90000);
  const LANGS = ['es', 'en', 'pt', 'fr'];
  const N = (type, val) => makeNode(type, val);
  const huecos = def => (def.n.es.match(/\{(?:v|x|y)\}/g) || []).join('');
  const tinta = () => {
    try {
      const c = document.getElementById('penLayer');
      const ctx = c.getContext('2d');
      const d = ctx.getImageData(0, 0, c.width, c.height).data;
      let n = 0;
      for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++;
      return n;
    } catch (e) { return -1; }
  };
  const eraRunning = isRunning;

  (async () => {
    try {
      check('sin_errores_arranque', errs.length === 0);

      /* ============ 1. catálogo ============ */
      const PB = PALETTE_BLOCKS.filter(b => b.cat === 'pen');
      check('seis_bloques_de_lapiz', PB.length === 6);
      check('ids_en_orden', PB.map(b => b.id).join(',') ===
        'pen_down,pen_up,pen_color,pen_size,pen_clear,pen_stamp');
      check('categoria_pen_en_CATS', CATS.some(c => c.id === 'pen'));
      check('color_de_la_categoria', (CATS.find(c => c.id === 'pen') || {}).color === '#0FBD8C');
      check('textos_en_cuatro_idiomas', PB.every(b =>
        LANGS.every(l => typeof b.n[l] === 'string' && b.n[l].length > 0)));
      check('cuatro_idiomas_en_la_categoria', LANGS.every(l =>
        typeof (CATS.find(c => c.id === 'pen') || {}).name[l] === 'string'));
      check('color_y_grosor_tienen_un_hueco',
        huecos(BYID.pen_color) === '{v}' && huecos(BYID.pen_size) === '{v}');
      check('los_otros_no_tienen_huecos', ['pen_down', 'pen_up', 'pen_clear', 'pen_stamp']
        .every(id => huecos(BYID[id]) === ''));
      check('un_hueco_en_cuatro_idiomas', ['pen_color', 'pen_size'].every(id =>
        LANGS.every(l => (BYID[id].n[l].match(/\{(?:v|x|y)\}/g) || []).join('') === '{v}')));
      check('valores_de_fabrica', BYID.pen_color.def === '#4C97FF' && BYID.pen_size.def === 2);
      check('grosor_es_numerico', BYID.pen_size.num === 1);
      check('ninguno_es_reportero', PB.every(b => !b.rep));
      check('ninguno_es_heredado', PB.every(b => !b.legacy));
      check('badge_al_dia', document.getElementById('blocksCount').textContent ===
        String(PALETTE_BLOCKS.length));

      /* ============ 2. la capa en el escenario ============ */
      const cv = document.getElementById('penLayer');
      check('canvas_existe', !!cv && cv.tagName === 'CANVAS');
      check('canvas_dentro_de_stageWorld', !!cv && cv.parentElement &&
        cv.parentElement.id === 'stageWorld');
      check('canvas_debajo_de_los_personajes', !!cv && cv.nextElementSibling &&
        cv.nextElementSibling.id === 'spritesLayer');
      check('canvas_encima_del_fondo', !!cv && cv.previousElementSibling &&
        cv.previousElementSibling.id === 'stageBg');
      check('canvas_no_captura_toques', !!cv && getComputedStyle(cv).pointerEvents === 'none');
      check('canvas_oculto_para_lectores', !!cv && cv.getAttribute('aria-hidden') === 'true');
      check('canvas_tiene_z_index', !!cv && Number(getComputedStyle(cv).zIndex) === 2);

      /* ============ 3. colores ============ */
      check('color_hex_6', penColor('#FF0000') === '#ff0000');
      check('color_hex_3', penColor('#0f0') === '#00ff00');
      check('color_invalido_cae_al_defecto', penColor('rojo') === PEN_COLOR_DEFAULT);
      check('color_vacio_cae_al_defecto', penColor('') === PEN_COLOR_DEFAULT);
      check('color_null_cae_al_defecto', penColor(null) === PEN_COLOR_DEFAULT);

      /* ============ 4. estado por personaje ============ */
      const a = createSpriteData('🐱', 'A', []);
      const b = createSpriteData('🐶', 'B', []);
      sprites = [a, b];
      selectedSpriteId = a.id;
      penReset();
      check('estado_inicial_apagado', penState(a).down === false);
      check('color_inicial', penState(a).color === PEN_COLOR_DEFAULT);
      check('grosor_inicial', penState(a).size === PEN_SIZE_DEFAULT);
      penState(a).down = true;
      check('estado_independiente_por_personaje', penState(b).down === false);
      check('mismo_id_devuelve_el_mismo_estado', penState(a) === penState(a));

      /* ============ 5. ejecución real ============ */
      a.x = 0; a.y = 0; a.dir = 90;
      penReset();
      await execBlock(N('pen_down'), a);
      check('bajar_lapiz', penState(a).down === true);
      await execBlock(N('move', 40), a);
      check('un_trazo_al_mover', penStrokes.length === 1);
      const t = penStrokes[0];
      check('el_trazo_es_una_linea', !!t && t.k === 'line');
      check('parte_de_la_posicion_anterior', !!t && t.x1 === 0 && t.y1 === 0);
      check('termina_en_la_posicion_nueva', !!t &&
        Math.abs(t.x2 - a.x) < 0.001 && Math.abs(t.y2 - a.y) < 0.001);
      check('trazo_con_color_de_fabrica', !!t && t.color === PEN_COLOR_DEFAULT);
      check('el_canvas_tiene_tinta', tinta() > 0);
      await execBlock(N('pen_up'), a);
      check('subir_lapiz', penState(a).down === false);
      await execBlock(N('move', 10), a);
      check('con_lapiz_arriba_no_dibuja', penStrokes.length === 1);
      await execBlock(N('pen_color', '#FF0000'), a);
      check('fijar_color', penState(a).color === '#ff0000');
      await execBlock(N('pen_size', 7), a);
      check('fijar_grosor', penState(a).size === 7);
      await execBlock(N('pen_size', 999), a);
      check('grosor_con_tope', penState(a).size === 40);
      await execBlock(N('pen_size', -5), a);
      check('grosor_con_minimo', penState(a).size === 1);
      await execBlock(N('pen_size', 7), a);
      await execBlock(N('pen_down'), a);
      await execBlock(N('go_xy', '-50,30'), a);
      check('ir_a_xy_tambien_dibuja', penStrokes.length === 2);
      check('el_trazo_usa_color_y_grosor_nuevos',
        penStrokes[1].color === '#ff0000' && penStrokes[1].size === 7);
      await execBlock(N('pen_stamp'), a);
      check('sellar_agrega_un_sello', penStrokes.length === 3 && penStrokes[2].k === 'stamp');
      check('el_sello_guarda_la_cara', typeof penStrokes[2].face === 'string' &&
        penStrokes[2].face.length > 0);
      check('el_sello_guarda_la_posicion', penStrokes[2].x === a.x && penStrokes[2].y === a.y);
      await execBlock(N('pen_clear'), a);
      check('borrar_vacia_los_trazos', penStrokes.length === 0);
      check('borrar_limpia_el_canvas', tinta() === 0);

      /* ============ 6. efímero: se borra al ejecutar, no se guarda ============ */
      await execBlock(N('pen_down'), a);
      await execBlock(N('move', 10), a);
      check('hay_trazo_antes_de_ejecutar', penStrokes.length > 0);
      beginRun();
      check('ejecutar_borra_el_dibujo', penStrokes.length === 0);
      check('ejecutar_sube_todos_los_lapices', penState(a).down === false);
      runActive = false;
      runtimeSnapshot = null;
      const payload = serializeProject();
      check('el_proyecto_no_guarda_trazos', !('penStrokes' in payload));
      check('el_proyecto_no_guarda_estados', !('penStates' in payload));

      /* ============ 7. el mundo cambia y el dibujo sobrevive ============ */
      penReset();
      await execBlock(N('pen_down'), a);
      await execBlock(N('go_xy', '0,0'), a);
      const antes = penStrokes.length;
      const w0 = worldW, h0 = worldH;
      worldW = 960; worldH = 720;
      applyWorldSize();
      check('cambiar_el_mundo_no_borra_los_trazos', penStrokes.length === antes);
      check('el_canvas_se_redimensiona', cv.width > 0 && cv.height > 0);
      worldW = w0; worldH = h0;
      applyWorldSize();
      check('volver_al_mundo_original_no_borra', penStrokes.length === antes);

      /* ============ 8. tope de trazos ============ */
      penReset();
      for (let i = 0; i < PEN_MAX + 5; i++) {
        penAdd({ k: 'line', x1: 0, y1: 0, x2: 1, y2: 1, color: '#000000', size: 1 });
      }
      check('tope_de_trazos', penStrokes.length === PEN_MAX);

      penReset();
      resetProjectData(true);
      isRunning = eraRunning;
      check('sin_errores_final', errs.length === 0);
    } catch (err) {
      out.push('ERROR ' + err.message + ' @ ' + (err.stack || '').split('\n')[1]);
    }
    clearTimeout(watchdog);
    done();
  })();
});
