/* Tanda 17: rotación libre y choques dirigidos.
   Dos cosas que el usuario reportó juntas:
   1) El campo de dirección recortaba a ±180, así que escribir 270 no giraba
      nada (se quedaba en 180). Ahora normaliza.
   2) Faltaban «si toca a [personaje]» y «borrar el clon de [personaje] que
      toco», que son los que hacen falta para que un disparo destruya sólo
      lo que impacta. */
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

  const make = (name, x, y) => {
    const s = createSpriteData('🐱', name, []);
    s.x = x; s.y = y; s.dir = 90; s.visible = true;
    return s;
  };
  const setDir = (input, value) => {
    input.value = String(value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  };

  (async () => {
    try {
      check('sin_errores_arranque', errs.length === 0);

      /* ============ 1. catálogo de los dos bloques ============ */
      check('existen_los_dos', !!BYID.if_touch_sprite && !!BYID.delete_touched_clone);
      check('estan_en_la_paleta',
        PALETTE_BLOCKS.some(b => b.id === 'if_touch_sprite') &&
        PALETTE_BLOCKS.some(b => b.id === 'delete_touched_clone'));
      check('condicional_con_cuerpo', BYID.if_touch_sprite.c === 1);
      check('selector_de_personajes',
        BYID.if_touch_sprite.pick === 'sprites' && BYID.delete_touched_clone.pick === 'sprites');
      check('textos_4_idiomas',
        ['if_touch_sprite', 'delete_touched_clone'].every(id => ['es', 'en', 'pt', 'fr']
          .every(l => typeof BYID[id].n[l] === 'string' && BYID[id].n[l].length > 3)));
      check('el_condicional_tiene_hueco',
        (BYID.if_touch_sprite.n.es.match(/\{[vxy]\}/g) || []).length === 1);
      check('el_borrar_tiene_hueco',
        (BYID.delete_touched_clone.n.es.match(/\{[vxy]\}/g) || []).length === 1);
      check('en_cond_types', !!COND_TYPES.if_touch_sprite);

      /* ============ 2. rotación completa ============ */
      check('norm_270', normDir(270) === -90);
      check('norm_250', normDir(250) === -110);
      check('norm_370', normDir(370) === 10);
      check('norm_menos_450', normDir(-450) === -90);

      const gir = make('Gira', 0, 0);
      sprites = [gir];
      selectedSpriteId = gir.id;
      render();

      const pd = $('#propDir');
      check('campo_existe', !!pd);
      check('campo_admite_vuelta_completa',
        Number(pd.getAttribute('min')) <= -360 && Number(pd.getAttribute('max')) >= 360);

      setDir(pd, 270);
      check('escribir_270_gira', gir.dir === -90);
      check('escribir_270_dibuja', spriteTransform(gir).indexOf('rotate(-180deg)') > -1);

      setDir(pd, 250);
      check('escribir_250_gira', gir.dir === -110);

      setDir(pd, -30);
      check('escribir_negativo', gir.dir === -30);

      setDir(pd, 359);
      check('escribir_359', gir.dir === -1);

      /* El valor guardado queda normalizado al salir del campo. */
      setDir(pd, 270);
      pd.dispatchEvent(new Event('change', { bubbles: true }));
      check('al_salir_normaliza', gir.dir === -90 && Number(pd.value) === -90);

      /* Girar en ejecución sigue dando la vuelta completa. */
      const vueltas = make('Vueltas', 0, 0);
      sprites = [vueltas];
      selectedSpriteId = vueltas.id;
      vueltas.dir = 0;
      await execBlock(makeNode('turn', 180), vueltas);
      check('girar_media_vuelta', Math.abs(Math.abs(vueltas.dir) - 180) < 0.01);
      await execBlock(makeNode('turn', 90), vueltas);
      check('girar_pasa_de_180', Math.abs(vueltas.dir + 90) < 0.01);

      /* ============ 3. choque contra un personaje concreto ============ */
      const a = make('Nave', 0, 0);
      const b = make('Roca', 20, 0);
      const c = make('Lejos', 200, 0);
      sprites = [a, b, c];
      selectedSpriteId = a.id;
      render();
      clones.length = 0;

      check('toca_al_que_esta_cerca', touchingSprite(a, b.id) === true);
      check('no_toca_al_que_esta_lejos', touchingSprite(a, c.id) === false);
      check('no_se_toca_a_si_mismo', touchingSprite(a, a.id) === false);

      /* Un clon del personaje también cuenta. */
      const cl = spawnClone(b);
      cl.x = 0; cl.y = 0; cl.visible = true;
      check('el_clon_del_personaje_cuenta', touchingSprite(a, b.id) === true);
      check('el_clon_no_cuenta_para_otro', touchingSprite(a, c.id) === false);

      /* ============ 4. borrar el clon que toco ============ */
      const antesOriginal = sprites.length;
      await execBlock(makeNode('delete_touched_clone', b.id), a);
      check('borra_el_clon_tocado', clones.length === 0);
      check('no_borra_el_original', sprites.length === antesOriginal && sprites.indexOf(b) > -1);

      /* Sin nada tocando no borra nada. */
      const cl2 = spawnClone(b);
      cl2.x = 200; cl2.y = 0; cl2.visible = true;
      await execBlock(makeNode('delete_touched_clone', b.id), a);
      check('no_borra_de_lejos', clones.length === 1);

      /* ============ 5. «si toca a» en ejecución ============ */
      const n2 = make('Nave2', 0, 0);
      const r2 = make('Roca2', 20, 0);
      n2.code = [
        makeNode('when_flag'),
        (() => { const n = makeNode('if_touch_sprite', r2.id); n.body = [makeNode('score_add', 1)]; return n; })()
      ];
      sprites = [n2, r2];
      selectedSpriteId = n2.id;
      clones.length = 0;
      render();

      score = 0;
      fireEvent('when_flag');
      await new Promise(r => setTimeout(r, 400));
      stopCode();
      check('si_toca_a_ese_si_ejecuta', score === 1);

      r2.x = 220; r2.y = 0;
      score = 0;
      fireEvent('when_flag');
      await new Promise(r => setTimeout(r, 400));
      stopCode();
      check('si_toca_a_otro_no_ejecuta', score === 0);

      /* ============ 6. sobrevive a guardar y abrir ============ */
      const payload = {
        version: '2.0',
        sprites: [{
          id: 's1', name: 'Guion', x: 0, y: 0, dir: 90, size: 100, visible: true, rot: 'all',
          costumes: [{ id: 'c1', kind: 'emoji', src: '🐱', name: 'Gato' }],
          costumeIndex: 0,
          code: [
            { id: 'h1', type: 'when_flag' },
            { id: 't1', type: 'if_touch_sprite', val: 's2', body: [{ id: 'd1', type: 'delete_touched_clone', val: 's2' }] }
          ]
        }, {
          id: 's2', name: 'Otra', x: 40, y: 0, dir: 90, size: 100, visible: true, rot: 'all',
          costumes: [{ id: 'c2', kind: 'emoji', src: '☄️', name: 'Roca' }],
          costumeIndex: 0, code: []
        }],
        variables: {}, score: 0, selected: 's1'
      };
      check('apply_payload', applyPayload(payload) === true);
      const code = sprites[0].code;
      check('serializa_el_condicional',
        code[1].type === 'if_touch_sprite' && code[1].val === 's2' && code[1].body[0].type === 'delete_touched_clone');
      const round = applyPayload(JSON.parse(JSON.stringify(serializeProject())));
      check('ida_y_vuelta', round === true && sprites[0].code[1].type === 'if_touch_sprite' &&
        sprites[0].code[1].body[0].val === 's2');

      check('sin_errores_final', errs.length === 0);
    } catch (err) {
      out.push('ERROR ' + err.message + ' @ ' + (err.stack || '').split('\n')[1]);
    }
    clearTimeout(watchdog);
    done();
  })();
});
