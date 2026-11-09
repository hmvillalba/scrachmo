/* Tanda 12: clones. Comprueba el catálogo (3 bloques y su traducción), que
   crear un clon copie el estado y lo dibuje, que el sombrero «al comenzar como
   clon» corra SÓLO en los clones (y que un clon no corra la bandera), borrar,
   el tope, las colisiones, que no se guarden en el proyecto, que Detener los
   borre, el selector de personajes y la exportación a .sb3. */
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
  }, 90000);

  const mk = (type, val) => makeNode(type, val);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const wraps = () => document.querySelectorAll('.sprite-wrap').length;
  const uno = code => {
    const s = createSpriteData('🐱', 'Gato', code);
    sprites = [s];
    selectedSpriteId = s.id;
    return s;
  };

  (async () => {
    try {
      check('sin_errores_arranque', errs.length === 0);

      /* ============ 1. el catálogo ============ */
      const IDS = ['when_clone', 'create_clone', 'delete_clone'];
      check('los_tres_bloques_existen', IDS.every(id => !!BYID[id]));
      check('estan_en_la_paleta', IDS.every(id => PALETTE_BLOCKS.some(b => b.id === id)));
      check('sombrero_marcado', BYID.when_clone.hat === 1);
      check('menu_de_personajes', BYID.create_clone.pick === 'sprites' && BYID.create_clone.def === 'self');
      check('textos_en_4_idiomas', IDS.every(id => ['es', 'en', 'pt', 'fr']
        .every(l => typeof BYID[id].n[l] === 'string' && BYID[id].n[l].length > 0 &&
          typeof BYID[id].d[l] === 'string' && BYID[id].d[l].length > 0)));
      check('frases_distintas_por_idioma', IDS.every(id =>
        BYID[id].n.en !== BYID[id].n.es && BYID[id].n.pt !== BYID[id].n.es));
      check('claves_nuevas_en_4_idiomas', ['cloneSelf', 'spriteMissing'].every(k =>
        ['es', 'en', 'pt', 'fr'].every(l => typeof UI[l][k] === 'string' && UI[l][k].length > 0)));

      /* ============ 2. crear un clon ============ */
      const src = uno([mk('when_flag'), mk('create_clone', 'self')]);
      src.x = 30; src.y = -20; src.size = 80; src.dir = 90;
      render();
      runAll();
      await wait(350);
      check('crea_un_clon', clones.length === 1);
      const c = clones[0];
      check('copia_la_posicion_y_el_tamano', !!c && c.x === 30 && c.y === -20 && c.size === 80);
      check('tiene_id_propio', !!c && c.id !== src.id && c.srcId === src.id);
      check('se_dibuja_en_el_escenario', wraps() === 2);
      check('no_se_agrega_al_proyecto', sprites.length === 1);
      check('terminar_no_borra_los_clones', runActive === false && clones.length === 1);

      /* ============ 3. el sombrero de clon ============ */
      const s2 = uno([
        mk('when_flag'), mk('create_clone', 'self'),
        mk('when_clone'), mk('move', 40)
      ]);
      s2.x = 0; s2.y = 0;
      render();
      runAll();
      await wait(400);
      check('el_clon_corre_su_guion', clones.length === 1 && clones[0].x === 40);
      check('el_original_no_corre_el_guion_de_clon', s2.x === 0);

      /* El clon no arranca con la bandera: si lo hiciera, el puntaje subiría
         dos veces (una por el original y otra por el clon). */
      score = 0;
      uno([mk('when_flag'), mk('score_add', 10), mk('create_clone', 'self')]);
      render();
      runAll();
      await wait(350);
      check('el_clon_no_corre_la_bandera', score === 10 && clones.length === 1);

      /* ============ 4. borrar ============ */
      uno([
        mk('when_flag'), mk('create_clone', 'self'),
        mk('when_clone'), mk('delete_clone')
      ]);
      render();
      runAll();
      await wait(400);
      check('borrar_este_clon', clones.length === 0);
      check('borrar_este_clon_limpia_el_dom', wraps() === 1);

      uno([mk('when_flag'), mk('delete_clone')]);
      render();
      runAll();
      await wait(250);
      check('borrar_en_el_original_no_hace_nada', sprites.length === 1 && clones.length === 0);

      /* ============ 5. tope ============ */
      uno([]);
      render();
      for (let i = 0; i < MAX_CLONES + 5; i++) spawnClone(sprites[0]);
      check('tope_de_clones', clones.length === MAX_CLONES);
      clearClones();
      check('limpiar_los_borra_todos', clones.length === 0 && wraps() === 1);

      /* ============ 6. colisiones ============ */
      const base = uno([]);
      render();
      const cc = spawnClone(base);
      base.x = 0; base.y = 0; cc.x = 0; cc.y = 0;
      check('el_clon_choca_con_el_original', touchingOther(cc) === true);
      base.x = 200; base.y = 150;
      check('de_lejos_no_choca', touchingOther(cc) === false);
      clearClones();

      /* ============ 7. no se guardan ============ */
      uno([mk('when_flag'), mk('create_clone', 'self')]);
      render();
      runAll();
      await wait(350);
      const guardado = JSON.stringify(serializeProject());
      check('los_clones_no_se_guardan', clones.length === 1 && guardado.indexOf(clones[0].id) < 0);
      check('el_guardado_tiene_un_personaje', (serializeProject().sprites || []).length === 1);

      stopCode();
      check('detener_borra_los_clones', clones.length === 0);
      check('detener_limpia_el_dom', wraps() === 1);

      /* ============ 8. clonar a otro personaje ============ */
      const a = createSpriteData('🐱', 'Uno', []);
      const b = createSpriteData('🐶', 'Dos', []);
      a.code = [mk('when_flag'), mk('create_clone', b.id)];
      sprites = [a, b];
      selectedSpriteId = a.id;
      render();
      runAll();
      await wait(350);
      check('clona_a_otro_personaje', clones.length === 1 && clones[0].srcId === b.id);
      check('el_clon_usa_el_disfraz_del_otro', clones.length === 1 && clones[0].emoji === b.emoji);
      stopCode();

      a.code = [mk('when_flag'), mk('create_clone', 'no-existe')];
      sprites = [a, b];
      selectedSpriteId = a.id;
      render();
      runAll();
      await wait(300);
      check('un_id_inexistente_no_clona', clones.length === 0);
      stopCode();

      /* ============ 9. el selector de personajes ============ */
      const lista = pickList('sprites');
      check('el_selector_empieza_por_mi_mismo', lista[0].id === 'self');
      check('el_selector_lista_los_personajes', lista.some(x => x.id === a.id && x.name.es === 'Uno'));
      check('la_etiqueta_mi_mismo', pickLabel('sprites', 'self') === UI[lang].cloneSelf);
      check('la_paleta_dice_mi_mismo', blockPlainName(BYID.create_clone).indexOf(UI[lang].cloneSelf) > -1);
      check('un_personaje_borrado_se_avisa', pickLabel('sprites', 'fantasma') === UI[lang].spriteMissing);

      /* ============ 10. exportación a .sb3 ============ */
      check('no_van_a_sin_equivalente', !SB3_NO_EQUIV.when_clone &&
        !SB3_NO_EQUIV.create_clone && !SB3_NO_EQUIV.delete_clone);

      const e1 = createSpriteData('🐱', 'Uno', [
        mk('when_flag'), mk('create_clone', 'self'),
        mk('when_clone'), mk('delete_clone')
      ]);
      sprites = [e1];
      selectedSpriteId = e1.id;
      const built = await sb3Build();
      const t1 = built.project.targets[1];
      const ops1 = Object.keys(t1.blocks).map(id => t1.blocks[id].opcode);
      check('exporta_al_comenzar_como_clon', ops1.indexOf('control_start_as_clone') > -1);
      check('exporta_crear_clon', ops1.indexOf('control_create_clone_of') > -1);
      check('exporta_borrar_clon', ops1.indexOf('control_delete_this_clone') > -1);
      const menu1 = Object.keys(t1.blocks).map(id => t1.blocks[id])
        .find(x => x.opcode === 'control_create_clone_of_menu');
      check('el_menu_dice_myself', !!menu1 && menu1.fields.CLONE_OPTION[0] === '_myself_');
      check('el_menu_es_sombra', !!menu1 && menu1.shadow === true);

      const e2 = createSpriteData('🐱', 'Uno', []);
      const e3 = createSpriteData('🐶', 'Dos', []);
      e2.code = [mk('when_flag'), mk('create_clone', e3.id)];
      sprites = [e2, e3];
      selectedSpriteId = e2.id;
      const built2 = await sb3Build();
      const t2 = built2.project.targets[1];
      const menu2 = Object.keys(t2.blocks).map(id => t2.blocks[id])
        .find(x => x.opcode === 'control_create_clone_of_menu');
      check('el_menu_lleva_el_nombre', !!menu2 && menu2.fields.CLONE_OPTION[0] === 'Dos');

      check('sin_errores_final', errs.length === 0);
    } catch (err) {
      out.push('ERROR ' + err.message + ' @ ' + (err.stack || '').split('\n')[1]);
    }
    clearTimeout(watchdog);
    done();
  })();
});
