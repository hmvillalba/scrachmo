/* Tanda 24: ejemplos y guía dentro de la app (P1.9).

   Los ejemplos se arman con makeNode()/createSpriteData(), así que lo que hay
   que probar no es el JSON sino que el proyecto resultante sea válido, que
   abrir uno NO pise el proyecto anterior y que los patrones que enseña
   (reportero dentro de «ir a», clon que se muestra al nacer, borrar el clon al
   tocar) funcionen de verdad. */
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

  const tipos = code => (code || []).map(n => n.type);
  const buscar = (code, tipo) => (code || []).find(n => n.type === tipo) || null;
  /* Buscador profundo: los nodos que importan están dentro de «repetir» y de
     «por siempre», así que un find() de primer nivel no los ve. */
  const todos = (code, tipo, acc) => {
    const out2 = acc || [];
    (code || []).forEach(n => {
      if (!n) return;
      if (n.type === tipo) out2.push(n);
      if (n.reps) n.reps.forEach(r => { if (r) todos([r], tipo, out2); });
      if (n.body) todos(n.body, tipo, out2);
      if (n.elseBody) todos(n.elseBody, tipo, out2);
    });
    return out2;
  };

  (async () => {
    try {
      check('sin_errores_arranque', errs.length === 0);

      /* ============ 1. catálogo de ejemplos ============ */
      check('hay_tres_ejemplos', EXAMPLES.length === 3);
      check('ids_unicos', new Set(EXAMPLES.map(e => e.id)).size === EXAMPLES.length);
      check('cada_ejemplo_tiene_nombre_traducido', EXAMPLES.every(e =>
        typeof UI[lang][e.nameKey] === 'string' && typeof UI[lang][e.descKey] === 'string'));
      check('cada_ejemplo_tiene_dibujo', EXAMPLES.every(e => !!e.emoji));
      /* Windows no tiene varios glifos recientes y quedan como cuadradito
         vacío: se detectan comparando el dibujo con el del carácter que no
         existe. Un ejemplo con un cuadradito se ve roto. */
      check('los_dibujos_de_los_ejemplos_se_ven', (() => {
        const c = document.createElement('canvas');
        c.width = 32; c.height = 32;
        const g = c.getContext('2d');
        g.font = '24px sans-serif';
        const dibujo = ch => {
          g.clearRect(0, 0, 32, 32);
          g.fillText(ch, 2, 26);
          return c.toDataURL();
        };
        const vacio = dibujo('\u{10FFFF}');
        return EXAMPLES.every(e => dibujo(e.emoji) !== vacio);
      })());

      /* ============ 2. el modal y la guía ============ */
      openExamples();
      check('el_modal_se_abre', $('#exModal').hidden === false);
      check('se_listan_las_tres_tarjetas',
        document.querySelectorAll('#exList [data-example]').length === 3);
      check('la_guia_tiene_cinco_pasos',
        document.querySelectorAll('#exList .ex-guide li').length === 5);
      check('la_guia_esta_traducida', (() => {
        const li = document.querySelector('#exList .ex-guide li');
        return !!li && li.textContent === UI[lang].exStep1;
      })());
      closeExamples();
      check('el_modal_se_cierra', $('#exModal').hidden === true);

      /* ============ 3. el proyecto anterior no se pierde ============ */
      const previo = activeProjectId;
      const previos = projects.length;
      openExample('hola');
      check('abrir_un_ejemplo_crea_un_proyecto', projects.length === previos + 1);
      check('el_proyecto_anterior_sigue_en_la_lista',
        projects.some(p => p.id === previo));
      check('el_ejemplo_pasa_a_ser_el_activo', activeProjectId !== previo &&
        !!activeProject());
      /* El proyecto activo vive en scrachmo_v8; su slot sólo se escribe al
         cambiar de proyecto. */
      check('el_ejemplo_se_guarda', !!store.get('scrachmo_v8'));
      check('el_modal_queda_cerrado', $('#exModal').hidden === true);
      check('el_nombre_del_proyecto_es_el_del_ejemplo',
        activeProject().name === UI[lang].ex1);

      /* ============ 4. ejemplo «Saluda»: globo con zoom y teclas ============ */
      check('saluda_tiene_un_personaje', sprites.length === 1);
      const gato = sprites[0];
      const saludo = buscar(gato.code, 'say');
      check('el_saludo_tiene_zoom', !!saludo && saludo.zoom === 130);
      check('el_saludo_dice_algo', !!saludo && saludo.val === UI[lang].ex1Line1);
      check('hay_guion_de_tecla_derecha', !!buscar(gato.code, 'when_key') &&
        gato.code.filter(n => n.type === 'when_key').length === 2);
      check('el_personaje_es_el_seleccionado', selectedSpriteId === gato.id);

      /* ============ 5. ejemplo «Atrapa la fruta» ============ */
      openExample('fruta');
      check('fruta_tiene_dos_personajes', sprites.length === 2);
      const cesta = sprites[0];
      const fruta = sprites[1];
      const clon = buscar(fruta.code, 'when_clone');
      check('la_fruta_define_el_clon', !!clon);
      /* Un clon de un personaje escondido nace escondido: sin «mostrar» no se
         vería nada y el ejemplo parecería roto. */
      const iClon = fruta.code.findIndex(n => n.type === 'when_clone');
      check('el_clon_se_muestra_al_nacer',
        !!fruta.code[iClon + 1] && fruta.code[iClon + 1].type === 'show');
      const toca = todos(fruta.code, 'if_touch_sprite')[0] || null;
      check('el_clon_compara_contra_la_cesta', !!toca && toca.val === cesta.id);
      check('al_tocar_suma_y_se_borra', !!toca &&
        tipos(toca.body).indexOf('score_add') === 0 &&
        tipos(toca.body).indexOf('delete_clone') > -1);
      check('el_marcador_se_muestra', showScore === true);

      /* «Ir a x: (posición x) + 18»: el reportero anidado se evalúa de verdad. */
      /* El último es el de la flecha derecha (+18): el primero es el de la
         izquierda (−18) y daría el signo cambiado. */
      const paso = todos(cesta.code, 'go_xy').filter(n => n.reps && n.reps[0]).pop() || null;
      check('la_cesta_camina_con_un_reportero', !!paso && !!paso.reps &&
        !!paso.reps[0] && paso.reps[0].type === 'rep_add' &&
        !!paso.reps[0].reps && !!paso.reps[0].reps[0] &&
        paso.reps[0].reps[0].type === 'rep_x');
      const esperado = String(cesta.x + 18) + ',' + String(cesta.y);
      check('el_reportero_da_la_posicion_mas_el_paso',
        !!paso && String(nodeVal(paso, cesta)) === esperado);

      /* ============ 6. ejemplo «Esquiva los cometas» corre de verdad ============ */
      openExample('cometas');
      check('cometas_tiene_dos_personajes', sprites.length === 2);
      const nave = sprites[0];
      const cometa = sprites[1];
      const golpe = todos(nave.code, 'if_touch_sprite')[0] || null;
      check('la_nave_vigila_los_cometas', !!golpe && golpe.val === cometa.id);
      check('el_golpe_reinicia_los_puntos', !!golpe &&
        tipos(golpe.body).indexOf('score_reset') > -1);

      runAll();
      await sleep(2600);
      check('los_cometas_caen_solos', clones.length >= 1);
      check('los_clones_se_ven', clones.length > 0 && clones.every(c => c.visible));
      check('el_marcador_sube', score > 0);
      check('los_clones_no_se_guardan', (() => {
        const p = serializeProject();
        return p.sprites.length === 2 &&
          JSON.stringify(p).indexOf('"isClone"') < 0;
      })());
      stopCode();
      check('parar_limpia_los_clones', clones.length === 0);

      check('sin_errores_final', errs.length === 0);
    } catch (err) {
      out.push('ERROR ' + err.message + ' @ ' + (err.stack || '').split('\n')[1]);
    }
    clearTimeout(watchdog);
    done();
  })();
});
