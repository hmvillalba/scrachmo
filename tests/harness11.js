/* Tanda 5: sensores y colisiones. Comprueba el catálogo, la geometría
   (borde y choque entre personajes), el rebote, el cronómetro y que todo
   sobreviva a guardar y abrir un proyecto. */
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

  const make = (name, x, y, extra) => {
    const s = createSpriteData('🐱', name, []);
    s.x = x; s.y = y; s.dir = 90; s.visible = true;
    if (extra) Object.keys(extra).forEach(k => { s[k] = extra[k]; });
    return s;
  };

  (async () => {
    try {
      check('sin_errores_arranque', errs.length === 0);

      /* ============ 1. catálogo ============ */
      check('paleta_51', PALETTE_BLOCKS.length === 51);
      check('bloques_nuevos', ['bounce', 'if_edge', 'if_touch', 'timer_reset']
        .every(id => !!BYID[id] && PALETTE_BLOCKS.some(b => b.id === id)));
      check('reportero_cronometro', !!BYID.rep_timer && BYID.rep_timer.rep === 1);
      check('reporteros_11', REPORTER_BLOCKS.length === 11);
      check('condicionales_con_cuerpo',
        BYID.if_edge.c === 1 && BYID.if_touch.c === 1 && !BYID.bounce.c);
      check('categorias', BYID.bounce.cat === 'motion' &&
        BYID.if_edge.cat === 'control' && BYID.timer_reset.cat === 'sensor');
      check('textos_4_idiomas', ['bounce', 'if_edge', 'if_touch', 'timer_reset', 'rep_timer']
        .every(id => ['es', 'en', 'pt', 'fr'].every(l =>
          typeof BYID[id].n[l] === 'string' && BYID[id].n[l].length &&
          typeof BYID[id].d[l] === 'string' && BYID[id].d[l].length)));
      check('sin_huecos_de_mas', (BYID.bounce.n.es.match(/\{[vxy]\}/g) || []).length === 0 &&
        (BYID.if_edge.n.es.match(/\{[vxy]\}/g) || []).length === 0);

      /* ============ 2. radio del personaje ============ */
      check('radio_base', spriteRadius({ size: 100 }) === 26);
      check('radio_doble', spriteRadius({ size: 200 }) === 52);
      /* size 0 o vacío cae al 100%, igual que en spriteTransform(). */
      check('radio_size_invalido', spriteRadius({ size: 0 }) === 26);
      check('radio_minimo', Math.abs(spriteRadius({ size: 10 }) - 2.6) < 0.001);
      check('radio_tope', spriteRadius({ size: 999 }) === 78);

      /* ============ 3. tocar el borde ============ */
      check('centro_no_toca', touchingEdge(make('A', 0, 0)) === false);
      check('borde_derecho', touchingEdge(make('A', 240, 0)) === true);
      check('borde_izquierdo', touchingEdge(make('A', -240, 0)) === true);
      check('borde_arriba', touchingEdge(make('A', 0, 180)) === true);
      check('borde_abajo', touchingEdge(make('A', 0, -180)) === true);
      check('justo_afuera_del_radio', touchingEdge(make('A', 213, 0)) === false);
      check('justo_dentro_del_radio', touchingEdge(make('A', 215, 0)) === true);
      check('grande_toca_antes', touchingEdge(make('A', 190, 0, { size: 200 })) === true);
      check('chico_toca_despues', touchingEdge(make('A', 190, 0, { size: 50 })) === false);

      /* ============ 4. tocar a otro personaje ============ */
      const a = make('A', 0, 0);
      const b = make('B', 20, 0);
      sprites = [a, b];
      selectedSpriteId = a.id;
      check('choque_cerca', touchingOther(a) === true);
      b.x = 200;
      check('choque_lejos', touchingOther(a) === false);
      b.x = 40;
      check('choque_en_el_limite', touchingOther(a) === true);
      b.x = 60;
      check('choque_fuera_del_limite', touchingOther(a) === false);
      b.x = 10;
      b.visible = false;
      check('invisible_no_choca', touchingOther(a) === false);
      b.visible = true;
      const solo = make('S', 0, 0);
      sprites = [solo];
      check('solo_no_choca_consigo', touchingOther(solo) === false);
      check('invisible_no_choca_nada', touchingOther(make('I', 0, 0, { visible: false })) === false);

      /* ============ 5. rebote ============ */
      const der = make('D', 240, 0);
      der.dir = 90;
      check('rebote_derecha_mueve', bounceSprite(der) === true);
      check('rebote_derecha_dentro', der.x === 214);
      check('rebote_derecha_dir', der.dir === -90);

      const arr = make('U', 0, 180);
      arr.dir = 0;
      bounceSprite(arr);
      check('rebote_arriba_dentro', arr.y === 154);
      /* normDir(180) devuelve -180: media vuelta es la misma dirección. */
      check('rebote_arriba_dir', Math.abs(Math.abs(arr.dir) - 180) < 0.001);

      const centro = make('C', 0, 0);
      centro.dir = 90;
      check('rebote_sin_borde', bounceSprite(centro) === false);
      check('rebote_sin_borde_no_mueve', centro.dir === 90 && centro.x === 0);

      const esquina = make('E', 240, 180);
      esquina.dir = 90;
      bounceSprite(esquina);
      check('rebote_esquina_dentro', esquina.x === 214 && esquina.y === 154);
      check('rebote_esquina_dir', esquina.dir === -90);

      /* ============ 6. condiciones ============ */
      sprites = [make('A', 240, 0), make('B', 20, 0)];
      selectedSpriteId = sprites[0].id;
      check('cond_borde_si', checkNodeCondition(makeNode('if_edge'), sprites[0]) === true);
      sprites[0].x = 0;
      check('cond_borde_no', checkNodeCondition(makeNode('if_edge'), sprites[0]) === false);
      check('cond_choque_si', checkNodeCondition(makeNode('if_touch'), sprites[0]) === true);
      sprites[1].x = 200;
      check('cond_choque_no', checkNodeCondition(makeNode('if_touch'), sprites[0]) === false);

      /* ============ 7. ejecución real ============ */
      const mov = make('M', 240, 0);
      mov.dir = 90;
      sprites = [mov];
      selectedSpriteId = mov.id;
      render();
      await execBlock(makeNode('bounce'), mov);
      check('exec_bounce', mov.dir === -90 && mov.x === 214);

      timerStart = Date.now() - 2500;
      check('cronometro_valor', Math.abs(evalReporter(makeNode('rep_timer'), mov) - 2.5) < 0.4);
      await execBlock(makeNode('timer_reset'), mov);
      check('cronometro_reinicia', evalReporter(makeNode('rep_timer'), mov) < 0.5);

      /* El cronómetro no se reinicia al dar Ejecutar. */
      const antes = timerStart;
      timerStart = Date.now() - 1500;
      fireEvent('when_flag');
      check('cronometro_sigue_en_ejecucion', timerStart !== antes &&
        Math.abs(evalReporter(makeNode('rep_timer'), mov) - 1.5) < 0.5);
      stopCode();

      /* ============ 7b. los C-block con condición ejecutan su cuerpo ============
         Estuvieron rotos en silencio desde que se agregaron: execNode() no los
         despachaba como condicionales, así que su body se ignoraba y «si toca
         el borde» / «si toca a otro personaje» no hacían nada al ejecutarse.
         Las comprobaciones de arriba pasaban igual porque sólo miran
         checkNodeCondition(), no la ejecución. */
      const condS = make('Cond', 240, 0);
      const lejos = make('Lejos', 0, 0);
      condS.code = [
        makeNode('when_flag'),
        (() => { const n = makeNode('if_edge'); n.body = [makeNode('score_add', 1)]; return n; })(),
        (() => { const n = makeNode('if_touch'); n.body = [makeNode('score_add', 10)]; return n; })()
      ];
      sprites = [condS, lejos];
      selectedSpriteId = condS.id;
      render();

      score = 0;
      fireEvent('when_flag');
      await new Promise(r => setTimeout(r, 400));
      stopCode();
      check('if_edge_ejecuta_el_cuerpo', score === 1);

      condS.x = 0; condS.y = 0; lejos.x = 20; lejos.y = 0;
      score = 0;
      fireEvent('when_flag');
      await new Promise(r => setTimeout(r, 400));
      stopCode();
      check('if_touch_ejecuta_el_cuerpo', score === 10);

      condS.x = 0; condS.y = 0; lejos.x = 200; lejos.y = 0;
      score = 0;
      fireEvent('when_flag');
      await new Promise(r => setTimeout(r, 400));
      stopCode();
      check('condiciones_no_ejecutan_de_mas', score === 0);

      /* ============ 8. guardar y volver a abrir ============ */
      const payload = {
        version: '2.0',
        sprites: [{
          id: 's1', name: 'Guion', x: 0, y: 0, dir: 90, size: 100, visible: true, rot: 'all',
          costumes: [{ id: 'c1', kind: 'emoji', src: '🐱', name: 'Gato' }],
          costumeIndex: 0,
          code: [
            { id: 'h1', type: 'when_flag' },
            { id: 'e1', type: 'if_edge', body: [{ id: 'b1', type: 'bounce' }] },
            { id: 't1', type: 'timer_reset' },
            { id: 's1b', type: 'say', val: '', reps: [{ id: 'r1', type: 'rep_timer' }] }
          ]
        }],
        variables: {}, score: 0, selected: 's1'
      };
      check('apply_payload', applyPayload(payload) === true);
      const code = sprites[0].code;
      check('serializa_condicional', code[1].type === 'if_edge' && code[1].body[0].type === 'bounce');
      check('serializa_reportero', code[3].reps[0].type === 'rep_timer');
      const round = applyPayload(JSON.parse(JSON.stringify(serializeProject())));
      check('ida_y_vuelta', round === true && sprites[0].code[1].type === 'if_edge' &&
        sprites[0].code[3].reps[0].type === 'rep_timer');

      /* El reportero se ofrece en el selector ƒ de una casilla. */
      const host = sprites[0].code[3];
      openRepPicker(host.id, 0);
      check('picker_ofrece_cronometro',
        Array.from($('#repChoices').children).some(el => el.dataset.repPick === 'rep_timer'));
      closeRepPicker();

      check('sin_errores_final', errs.length === 0);
    } catch (err) {
      out.push('ERROR ' + err.message + ' @ ' + (err.stack || '').split('\n')[1]);
    }
    clearTimeout(watchdog);
    done();
  })();
});
