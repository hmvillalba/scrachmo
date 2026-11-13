/* Tanda 36: procedimientos con nombre (P2.12, fase 3).
   Un sombrero «Definir» con cuerpo y un bloque «Llamar» que ejecuta ese
   cuerpo en el MISMO hilo. Acá se comprueba el catálogo en cuatro idiomas,
   el desplegable dinámico y su centinela, el sombrero dibujado con su hueco,
   la ejecución real (incluidos ciclos y el tope de profundidad), que la
   definición nunca arranca como guion y que el cuerpo sobrevive al guardado. */
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
  const tick = ms => new Promise(r => setTimeout(r, ms));
  const LANGS = ['es', 'en', 'pt', 'fr'];
  const N = (type, val) => makeNode(type, val);
  const huecos = def => (def.n.es.match(/\{(?:v|x|y)\}/g) || []).join('');
  const eraRunning = isRunning;

  (async () => {
    try {
      check('sin_errores_arranque', errs.length === 0);

      /* ============ 1. catálogo ============ */
      const PB = PALETTE_BLOCKS.filter(b => b.pick === 'procs');
      check('dos_bloques_de_procedimientos', PB.length === 2);
      check('definir_es_sombrero_con_cuerpo',
        BYID.def_proc.hat === 1 && BYID.def_proc.c === 1 && BYID.def_proc.pick === 'procs');
      check('llamar_es_enunciado_normal',
        !BYID.call_proc.hat && !BYID.call_proc.c && BYID.call_proc.pick === 'procs');
      check('ambos_en_la_categoria_multi', PB.every(b => b.cat === 'multi'));
      check('un_solo_hueco_en_cuatro_idiomas', PB.every(b =>
        LANGS.every(l => (b.n[l].match(/\{(?:v|x|y)\}/g) || []).join('') === huecos(b)) &&
        huecos(b) === '{v}'));
      check('mismo_nombre_de_fabrica', BYID.def_proc.def === PROC_DEFAULT &&
        BYID.call_proc.def === PROC_DEFAULT);
      check('nombre_de_fabrica', PROC_DEFAULT === 'hacer' && procName(undefined) === 'hacer');
      check('centinela_distinto_de_los_otros_dos',
        PROC_NEW !== MSG_NEW && PROC_NEW !== LIST_NEW &&
        cleanProcName(PROC_NEW) === '' && cleanMsgName(PROC_NEW) !== '' &&
        cleanListName(PROC_NEW) !== '');
      check('claves_nuevas_en_cuatro_idiomas', LANGS.every(l =>
        ['procNew', 'procNameTitle', 'procNameHint', 'procBadName'].every(k =>
          typeof UI[l][k] === 'string' && UI[l][k].length)));
      check('opcion_nueva_traducida', new Set(LANGS.map(l => UI[l].procNew)).size === 4);
      check('paleta_en_59', PALETTE_BLOCKS.length === 59 && REPORTER_BLOCKS.length === 13);
      check('badge_en_59', document.getElementById('blocksCount').textContent === '59');

      /* ============ 2. nombres ============ */
      check('nombre_se_normaliza', procName('  girar  ') === 'girar');
      check('nombre_vacio_cae_en_fabrica', procName('') === PROC_DEFAULT &&
        procName(null) === PROC_DEFAULT);
      check('espacios_se_aplanan', cleanProcName('  mi   rutina  ') === 'mi rutina');
      check('tope_de_24', cleanProcName('x'.repeat(40)).length === 24);
      check('nombre_vacio_no_se_guarda', cleanProcName('   ') === '');
      check('coma_rechazada', cleanProcName('a,b') === '');
      check('centinela_rechazado', cleanProcName(PROC_NEW) === '');
      check('claves_prohibidas', cleanProcName('__proto__') === '' &&
        cleanProcName('constructor') === '' && cleanProcName('prototype') === '');
      check('isProcNode_solo_los_dos', isProcNode(N('def_proc')) &&
        isProcNode(N('call_proc')) && !isProcNode(N('send_msg')));

      /* ============ 3. desplegable dinámico ============ */
      let def = N('def_proc', 'saludar');
      def.body = [N('score_set', 42)];
      const llamada = N('call_proc', 'saludar');
      const repetir = N('repeat', 2);
      repetir.body = [N('call_proc', 'en_cuerpo')];
      /* Un reps con un nombre es un estado que la UI no genera, pero el
         recorrido debe ser robusto si algún proyecto lo trae. */
      const raro = N('call_proc', 'en_reps');
      raro.reps = [N('call_proc', 'dentro_de_reps')];
      sprites = [createSpriteData('🐱', 'A', [def, N('when_flag'), llamada, repetir, raro])];
      selectedSpriteId = sprites[0].id;
      renderCode();
      const ids = pickList('procs').map(x => x.id);
      check('lista_con_fabrica_y_crear', ids.indexOf(PROC_DEFAULT) > -1 && ids.indexOf(PROC_NEW) > -1);
      check('nombre_de_la_definicion_entra', ids.indexOf('saludar') > -1);
      check('nombre_de_un_cblock_anidado_entra', ids.indexOf('en_cuerpo') > -1);
      check('nombre_de_un_reps_anidado_entra', ids.indexOf('dentro_de_reps') > -1);
      check('lista_sin_repetidos', new Set(ids).size === ids.length);
      check('lista_ordenada', ids.slice(0, -1).every((v, i, a) => i === 0 || a[i - 1] <= v));
      check('crear_esta_traducido',
        (pickList('procs').find(x => x.id === PROC_NEW) || { name: {} }).name[lang] === UI[lang].procNew);
      check('coincidencia_normalizada', pickMatch('procs', 'saludar', '  saludar  '));
      check('etiqueta_huerfana', pickLabel('procs', 'fantasma') === 'fantasma');
      check('la_definicion_se_encuentra_por_nombre', procDefNode(sprites[0], 'saludar') === def);
      check('definicion_inexistente_da_null', procDefNode(sprites[0], 'no_existe') === null);
      const otro = createSpriteData('🦊', 'B', [N('def_proc', 'solo_de_b')]);
      check('procedimientos_por_personaje', procDefNode(otro, 'solo_de_b') &&
        procDefNode(sprites[0], 'solo_de_b') === null);

      /* ============ 4. sombrero con cuerpo en el DOM ============ */
      const item = document.querySelector('#codeList .stack-item[data-id="' + def.id + '"]');
      check('definicion_dibuja_sombrero_con_cuerpo', !!item &&
        !!item.querySelector('.sb.hat.c-head') &&
        !!item.querySelector('.c-slot[data-slot="body"]'));
      check('el_cuerpo_se_dibuja', !!item &&
        item.querySelectorAll('.c-slot[data-slot="body"] .stack-item').length === 1);
      const sels = Array.from(document.querySelectorAll('#codeList .sb-select'));
      /* También hay llamadas dentro del repeat y del reps artificial: el
         total incluye esos select anidados. Acá se cuentan los de nivel
         superior (definición, llamada y la llamada con reps) y, por
         separado, se exige el del cuerpo del C-block. */
      const topIds = new Set(sprites[0].code.map(n => n.id));
      const topProcs = sprites[0].code.filter(n => isProcNode(n));
      check('un_select_por_bloque_de_nivel_superior',
        sels.filter(s => topIds.has(s.dataset.input)).length === topProcs.length &&
        topProcs.every(n => sels.filter(s => s.dataset.input === n.id).length === 1));
      check('el_cuerpo_del_cblock_dibuja_su_select',
        sels.some(s => s.dataset.input === repetir.body[0].id));
      const selDe = n => sels.find(s => s.dataset.input === n.id);
      check('la_definicion_tiene_select', !!selDe(def));
      check('la_llamada_tiene_select', !!selDe(llamada));
      check('opciones_reales', !!selDe(llamada) &&
        Array.from(selDe(llamada).options).some(o => o.value === PROC_NEW) &&
        Array.from(selDe(llamada).options).some(o => o.value === 'saludar'));
      check('seleccion_actual', !!selDe(llamada) && selDe(llamada).value === 'saludar');

      /* ============ 5. edición y centinela ============ */
      selDe(llamada).value = 'en_cuerpo';
      selDe(llamada).dispatchEvent(new Event('change', { bubbles: true }));
      check('cambiar_nombre_guarda', llamada.val === 'en_cuerpo');
      selDe(llamada).value = PROC_NEW;
      selDe(llamada).dispatchEvent(new Event('input', { bubbles: true }));
      check('centinela_no_se_guarda_en_input', llamada.val === 'en_cuerpo');
      selDe(llamada).dispatchEvent(new Event('change', { bubbles: true }));
      check('crear_abre_el_modal', document.getElementById('askModal').hidden === false);
      check('modal_pide_hasta_24', document.getElementById('askInput').maxLength === 24);
      document.getElementById('askInput').value = 'despedir';
      document.getElementById('askOk').click();
      await tick(50);
      check('nombre_nuevo_queda_en_el_bloque', llamada.val === 'despedir');
      check('nombre_nuevo_entra_en_la_lista', pickList('procs').some(x => x.id === 'despedir'));
      check('modal_se_cierra', document.getElementById('askModal').hidden === true);
      const sel2 = Array.from(document.querySelectorAll('#codeList .sb-select'))
        .find(s => s.dataset.input === llamada.id);
      sel2.value = PROC_NEW;
      sel2.dispatchEvent(new Event('change', { bubbles: true }));
      document.getElementById('askCancel').click();
      await tick(50);
      check('cancelar_conserva_el_nombre', llamada.val === 'despedir');
      llamada.val = 'saludar';

      /* ============ 6. la definición NO arranca sola ============ */
      check('ningun_guion_es_la_definicion',
        collectScripts().every(sc => sc.event !== 'def_proc'));
      check('la_definicion_no_cuenta_como_guion', collectScripts().length === 1 &&
        collectScripts()[0].event === 'when_flag');
      check('la_bandera_no_lleva_la_definicion',
        scriptsFor('when_flag').every(sc => sc.nodes.every(n => n.type !== 'def_proc')));
      const soloDef = N('def_proc', 'inerte');
      soloDef.body = [N('score_set', 99)];
      sprites = [createSpriteData('🐱', 'SoloDef', [soloDef])];
      selectedSpriteId = sprites[0].id;
      check('proyecto_solo_con_definicion_no_tiene_guiones', collectScripts().length === 0);

      /* ============ 7. ejecución real en el mismo hilo ============ */
      isRunning = true;
      def = N('def_proc', 'saludar');
      def.body = [N('score_set', 42)];
      const s0 = createSpriteData('🐱', 'A', [def]);
      sprites = [s0];
      selectedSpriteId = s0.id;
      score = 0;
      await execBlock(N('call_proc', 'saludar'), s0);
      check('llamar_ejecuta_el_cuerpo', score === 42);
      score = 0;
      await execBlock(N('call_proc', 'no_existe'), s0);
      check('llamar_sin_definicion_no_hace_nada', score === 0);
      score = 0;
      await execBlock(N('call_proc', 'saludar'), s0);
      await execBlock(N('call_proc', 'saludar'), s0);
      check('dos_llamadas_seguidas', score === 42);
      const ctx = { id: 990, cancelled: false, lastCond: false, calls: [] };
      score = 0;
      await execNode(N('call_proc', 'saludar'), s0, ctx);
      check('execNode_despacha_la_llamada', score === 42);
      check('la_pila_queda_equilibrada', ctx.calls.length === 0);
      const ctxMuerto = { id: 991, cancelled: true, lastCond: false, calls: [] };
      score = 0;
      await execStack([N('call_proc', 'saludar')], s0, ctxMuerto);
      check('hilo_cancelado_no_llama', score === 0);

      /* Llamadas anidadas: a -> b, en el mismo hilo. */
      const defB = N('def_proc', 'b');
      defB.body = [N('score_set', 10)];
      const defA = N('def_proc', 'a');
      defA.body = [N('call_proc', 'b'), N('score_add', 1)];
      sprites = [createSpriteData('🐱', 'Anidado', [defA, defB])];
      const sa = sprites[0];
      score = 0;
      await execBlock(N('call_proc', 'a'), sa);
      check('llamada_anidada', score === 11);

      /* Ciclo directo: sin el corte, esto colgaría la pestaña. */
      const ciclo = N('def_proc', 'ciclo');
      ciclo.body = [N('call_proc', 'ciclo'), N('score_add', 1)];
      sprites = [createSpriteData('🐱', 'Ciclo', [ciclo])];
      score = 0;
      await execBlock(N('call_proc', 'ciclo'), sprites[0]);
      check('ciclo_directo_se_corta', score === 1);

      /* Ciclo indirecto: a -> b -> a. */
      const ciB = N('def_proc', 'ib');
      ciB.body = [N('call_proc', 'ia'), N('score_add', 10)];
      const ciA = N('def_proc', 'ia');
      ciA.body = [N('call_proc', 'ib'), N('score_add', 1)];
      sprites = [createSpriteData('🐱', 'CicloIndirecto', [ciA, ciB])];
      score = 0;
      await execBlock(N('call_proc', 'ia'), sprites[0]);
      check('ciclo_indirecto_se_corta', score === 11);

      /* Tope de profundidad: 25 procedimientos distintos, corta en 20. */
      const cadena = [];
      for (let i = 0; i < 25; i++) {
        const d = N('def_proc', 'p' + i);
        d.body = i < 24 ? [N('call_proc', 'p' + (i + 1)), N('score_add', 1)] : [N('score_add', 1)];
        cadena.push(d);
      }
      sprites = [createSpriteData('🐱', 'Cadena', cadena)];
      score = 0;
      await execBlock(N('call_proc', 'p0'), sprites[0]);
      check('tope_de_profundidad_20', MAX_CALL_DEPTH === 20 && score === 20);
      check('sin_resaltado_colgado', document.querySelectorAll('#codeList .sb.running').length === 0);

      /* ============ 8. persistencia ============ */
      const guardar = N('def_proc', 'guardado');
      guardar.body = [N('score_set', 7), N('move', 10)];
      sprites = [createSpriteData('🐱', 'Guardar', [guardar])];
      selectedSpriteId = sprites[0].id;
      const payload = serializeProject();
      const texto = JSON.stringify(payload);
      check('el_guardado_incluye_definicion_y_cuerpo',
        texto.indexOf('def_proc') >= 0 && texto.indexOf('"body"') >= 0 &&
        texto.indexOf('guardado') >= 0);
      applyPayload(payload);
      const restaurada = sprites[0].code.find(n => n.type === 'def_proc');
      check('abrir_restaura_el_cuerpo', !!restaurada && restaurada.body &&
        restaurada.body.length === 2 && restaurada.body[0].type === 'score_set');
      check('abrir_restaura_el_nombre', !!restaurada && restaurada.val === 'guardado');
      const sinNombre = N('def_proc');
      sinNombre.val = undefined;
      sinNombre.body = [N('score_set', 7)];
      sprites = [createSpriteData('🐱', 'Viejo', [sinNombre])];
      check('proyecto_viejo_sin_nombre_cae_en_fabrica',
        procDefNode(sprites[0], PROC_DEFAULT) === sinNombre &&
        procDefNode(sprites[0], undefined) === sinNombre);
      score = 0;
      await execBlock(N('call_proc', PROC_DEFAULT), sprites[0]);
      check('llamada_de_fabrica_encuentra_definicion_vieja', score === 7);
      resetProjectData(true);
      check('borrar_todo_limpia_las_definiciones',
        sprites.every(s => (s.code || []).every(n => n.type !== 'def_proc')));

      isRunning = eraRunning;
      check('sin_errores_final', errs.length === 0);
    } catch (err) {
      out.push('ERROR ' + err.message + ' @ ' + (err.stack || '').split('\n')[1]);
    }
    clearTimeout(watchdog);
    done();
  })();
});
