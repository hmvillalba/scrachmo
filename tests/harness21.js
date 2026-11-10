/* Tanda 23: arranque con un personaje sin bloques seleccionado y zoom del
   globo de diálogo.

   El caso que reportó el usuario: el personaje seleccionado no tiene bloques y
   otro sí. «Ejecutar» tiene que arrancar igual, porque la bandera recorre todos
   los guiones del proyecto y no sólo el del personaje en edición. Además se
   comprueba el aviso cuando hay bloques pero ninguno cuelga de un sombrero de
   bandera, y el campo de tamaño del bloque «decir». */
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

  (async () => {
    try {
      check('sin_errores_arranque', errs.length === 0);

      /* ============ 1. el personaje seleccionado no tiene bloques ============ */
      const vacio = make('Vacio');
      const moved = make('Mueve', [makeNode('when_flag'), makeNode('move', 20)]);
      sprites = [vacio, moved];
      selectedSpriteId = vacio.id;
      render();
      check('seleccionado_sin_bloques', selectedSprite().id === vacio.id &&
        (selectedSprite().code || []).length === 0);
      check('el_otro_tiene_bandera', moved.code[0].type === 'when_flag');

      const x0 = moved.x;
      runAll();
      await sleep(700);
      check('arranca_aunque_el_seleccionado_no_tenga_bloques', moved.x !== x0);
      check('el_personaje_vacio_sigue_sin_bloques', (vacio.code || []).length === 0);
      check('play_queda_habilitado', $('#playBtn').disabled === false);

      /* ============ 2. bloques sueltos: cuentan como bandera ============ */
      const suelto = make('Suelto', [makeNode('move', 15)]);
      sprites = [vacio, suelto];
      selectedSpriteId = vacio.id;
      render();
      const sx = suelto.x;
      runAll();
      await sleep(700);
      check('los_bloques_sueltos_arrancan_con_la_bandera', suelto.x !== sx);

      /* ============ 3. sólo un sombrero de tecla: la bandera no lo corre ============ */
      const tecla = make('Tecla', [makeNode('when_key'), makeNode('move', 15)]);
      tecla.code[0].val = 'a';
      sprites = [vacio, tecla];
      selectedSpriteId = vacio.id;
      render();
      const tx = tecla.x;
      runAll();
      await sleep(500);
      check('un_guion_de_tecla_no_arranca_con_la_bandera', tecla.x === tx);
      /* El aviso evita que parezca que la app está rota. */
      const toastEl = $('#toast');
      check('avisa_que_falta_la_bandera', !!toastEl &&
        toastEl.textContent === UI[lang].noFlagScripts &&
        toastEl.classList.contains('show'));
      check('no_queda_corriendo', runActive === false && $('#playBtn').disabled === false);

      /* ============ 4. zoom del globo de diálogo ============ */
      const gato = make('Gato', []);
      const saludo = makeNode('say', 'Hola, mundo');
      saludo.zoom = 180;
      /* El «esperar» mantiene vivo el guion mientras se mira el globo: al
         terminar la corrida los globos se limpian a propósito. */
      gato.code = [makeNode('when_flag'), saludo, makeNode('wait', 2)];
      sprites = [vacio, gato];
      /* El editor dibuja sólo los bloques del personaje seleccionado. */
      selectedSpriteId = gato.id;
      render();
      check('el_bloque_decir_tiene_campo_de_zoom', (() => {
        const input = document.querySelector('[data-zoom="' + saludo.id + '"]');
        return !!input && input.value === '180';
      })());
      selectedSpriteId = vacio.id;
      render();
      runAll();
      await sleep(600);
      const bub = findSpriteEl(gato.id).querySelector('.sprite-bubble');
      check('el_texto_con_coma_llega_entero', sayTexts.get(gato.id) === 'Hola, mundo');
      check('el_globo_toma_el_zoom', !!bub &&
        bub.style.getPropertyValue('--bz') === '1.8' && bub.classList.contains('show'));

      /* Un «decir» viejo, sin campo zoom, tiene que quedar al 100 %. */
      const viejo = makeNode('say', 'Chau');
      delete viejo.zoom;
      gato.code = [makeNode('when_flag'), viejo, makeNode('wait', 2)];
      render();
      runAll();
      await sleep(600);
      const bub2 = findSpriteEl(gato.id).querySelector('.sprite-bubble');
      check('sin_zoom_queda_al_100', !!bub2 &&
        (bub2.style.getPropertyValue('--bz') === '1' ||
          bub2.style.getPropertyValue('--bz') === ''));

      /* El zoom sobrevive a exportar/importar (link o .scmo). */
      const plana = normalizeNodes([{ id: 'b1', type: 'say', val: 'Hola', zoom: 220 }], null, 0);
      check('el_zoom_sobrevive_a_normalizar', !!plana[0] && plana[0].zoom === 220);
      const fuera = normalizeNodes([{ id: 'b2', type: 'say', val: 'Hola', zoom: 9999 }], null, 0);
      check('el_zoom_se_recorta', !!fuera[0] && fuera[0].zoom === 250);
      const basura = normalizeNodes([{ id: 'b3', type: 'say', val: 'Hola', zoom: 'x' }], null, 0);
      check('zoom_invalido_vuelve_a_100', !!basura[0] && basura[0].zoom === 100);

      /* Duplicar un bloque tiene que llevarse el zoom (cloneNodeTree copia
         todas las claves menos id/body/elseBody/reps). */
      const dup = cloneNodeTree(saludo);
      check('el_zoom_viaja_en_la_copia', dup.zoom === 180 && dup.id !== saludo.id);

      /* ============ 5. respaldo de la biblioteca y deshacer borrado ============ */
      const lib = libraryPayload();
      check('respaldo_con_formato_y_version', lib.format === 'scrachmo-library' &&
        lib.version === APP_VERSION);
      check('respaldo_incluye_todos_los_proyectos', lib.projects.length === projects.length &&
        lib.projects.every(p => p.data && Array.isArray(p.data.sprites)));
      check('respaldo_marca_el_activo', lib.active === activeProjectId);
      check('respaldo_es_json', (() => {
        try { return JSON.parse(JSON.stringify(lib)).format === 'scrachmo-library'; }
        catch (e) { return false; }
      })());

      /* Para poder borrar hace falta más de un proyecto. */
      const copia = { id: uid('p'), name: 'Copia', updatedAt: Date.now() };
      projects.push(copia);
      store.set(projectKey(copia.id), JSON.stringify(serializeProject()));
      writeProjects();
      const antes = projects.length;
      check('hay_dos_proyectos_para_probar', antes >= 2);

      const borrando = deleteProject(copia.id);
      $('#askOk').click();
      await borrando;
      check('borrado_confirmado', projects.length === antes - 1 &&
        !projects.some(p => p.id === copia.id));
      check('queda_pendiente_de_deshacer', $('#projUndo').hidden === false);

      undoDeleteProject();
      check('deshacer_restaura_el_proyecto', projects.length === antes &&
        projects.some(p => p.id === copia.id));
      check('deshacer_repone_el_json', !!store.get(projectKey(copia.id)));
      check('el_boton_se_oculta_sin_pendientes', $('#projUndo').hidden === true);

      check('sin_errores_final', errs.length === 0);
    } catch (err) {
      out.push('ERROR ' + err.message + ' @ ' + (err.stack || '').split('\n')[1]);
    }
    clearTimeout(watchdog);
    done();
  })();
});
