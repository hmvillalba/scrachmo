/* Tanda 40: parámetros en los procedimientos (P2.12, fase 6).
   La definición declara hasta 3 nombres y la llamada entrega un valor por
   nombre. Durante la ejecución se ligan como marcos EFÍMEROS por personaje:
   el cuerpo los lee con las mismas rutas que una variable, sin guardarlos
   ni pisar s.vars. También se comprueba el .sb3 con PROCCODE, argumentids
   y argument_reporter_string_number. */
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
  const eraRunning = isRunning;
  const spritesAlInicio = sprites;
  const variablesAlInicio = variables;
  const claves = ['procParams', 'procParamsTitle', 'procParamsHint', 'procParamsBad'];

  (async () => {
    try {
      check('sin_errores_arranque', errs.length === 0);

      /* ============ 1. catálogo y textos ============ */
      check('la_paleta_sigue_en_65', PALETTE_BLOCKS.length === 65);
      check('los_reporteros_siguen_en_13', REPORTER_BLOCKS.length === 13);
      check('badge_al_dia', document.getElementById('blocksCount').textContent === '65');
      check('sin_bloques_nuevos', PALETTE_BLOCKS.filter(b => b.pick === 'procs').length === 2);
      check('constantes_de_parametros', PROC_MAX_PARAMS === 3 && PROC_ARG_DEFAULT === '1');
      check('cuatro_claves_en_cuatro_idiomas', LANGS.every(l =>
        claves.every(k => typeof UI[l][k] === 'string' && UI[l][k].length > 0)));
      check('traducciones_propias', ['procParams', 'procParamsTitle', 'procParamsBad']
        .every(k => new Set(LANGS.map(l => UI[l][k])).size === 4));
      check('los_textos_llegan_a_UI', LANGS.every(l => UI[l].procParams === UI_EXTRA[l].procParams));
      check('el_nombre_no_cambia', PROC_DEFAULT === 'hacer' && PROC_NEW === '__newproc__' &&
        procName(undefined) === 'hacer');

      /* ============ 2. validación de nombres y valores ============ */
      check('normalizeProcParams_filtra', (() => {
        const p = normalizeProcParams(['pasos', 'con-espacio', 'score', '__proto__',
          'constructor', 'prototype', 'DemasiadoLargoNombre', 7]);
        return p.join(',') === 'pasos';
      })());
      check('normalizeProcParams_tope_3',
        normalizeProcParams(['a', 'b', 'c', 'd']).join(',') === 'a,b,c');
      check('normalizeProcParams_sin_repetidos',
        normalizeProcParams(['a', 'a', 'b']).join(',') === 'a,b');
      check('normalizeProcParams_no_es_array',
        normalizeProcParams(null).length === 0 && normalizeProcParams('a').length === 0);
      check('procParams_de_nodo_viejo', procParams(N('def_proc', 'viejo')).length === 0);
      check('cleanProcParams_vacio_limpia', cleanProcParams('   ').length === 0);
      check('cleanProcParams_dos_nombres',
        cleanProcParams(' pasos , veces ').join(',') === 'pasos,veces');
      check('cleanProcParams_coma_final_invalida', cleanProcParams('pasos,') === null);
      check('cleanProcParams_cuatro_invalidos', cleanProcParams('a,b,c,d') === null);
      check('cleanProcParams_identificador_malo', cleanProcParams('a,1b') === null);
      check('cleanProcParams_duplicados_invalidos', cleanProcParams('a,a') === null);
      check('cleanProcParams_cancelacion', cleanProcParams(null) === null);
      check('procCode_con_placeholders', procCode('saltar', ['a', 'b']) === 'saltar %s %s');
      check('procCode_sin_parametros', procCode('saltar', []) === 'saltar');
      check('procArgs_rellena', (() => {
        const a = procArgs({ args: ['7'] }, 3);
        return a.join(',') === '7,1,1';
      })());
      check('procArgs_recorta', procArgs({ args: ['1', '2', '3', '4'] }, 2).join(',') === '1,2');
      check('procArgs_proyecto_viejo', procArgs(N('call_proc', 'x'), 2).join(',') === '1,1');
      check('normalizeProcArgs_recorta_texto',
        normalizeProcArgs(['x'.repeat(300)])[0].length === 120);
      check('normalizeProcArgs_conserva_numeros', normalizeProcArgs([4.5])[0] === '4.5');
      check('procArgId_estable', procArgId(0) === 'arg0' && procArgId(2) === 'arg2');

      /* ============ 3. normalización y persistencia ============ */
      const crudoDef = { id: 'pd1', type: 'def_proc', val: 'saltar', params: ['pasos', 'veces'] };
      const crudoCall = { id: 'pl1', type: 'call_proc', val: 'saltar', args: ['7', '3'] };
      const nDef = normalizeOneNode(crudoDef, new Set(), 0, false);
      const nCall = normalizeOneNode(crudoCall, new Set(), 0, false);
      check('normalizeOneNode_copia_params', !!nDef && nDef.params.join(',') === 'pasos,veces');
      check('normalizeOneNode_copia_args', !!nCall && nCall.args.join(',') === '7,3');
      check('normalizeOneNode_filtra_params_malos', (() => {
        const n = normalizeOneNode({ id: 'pd2', type: 'def_proc', val: 'x',
          params: ['score', 'ok', 'mal-nombre'] }, new Set(), 0, false);
        return n.params.join(',') === 'ok';
      })());
      const viejoDef = normalizeOneNode({ id: 'pv1', type: 'def_proc', val: 'viejo' }, new Set(), 0, false);
      const viejoCall = normalizeOneNode({ id: 'pv2', type: 'call_proc', val: 'viejo' }, new Set(), 0, false);
      check('proyecto_viejo_no_gana_campos',
        !Object.prototype.hasOwnProperty.call(viejoDef, 'params') &&
        !Object.prototype.hasOwnProperty.call(viejoCall, 'args'));

      const sPers = createSpriteData('🐱', 'P', [nDef, N('when_flag'), nCall]);
      sprites = [sPers];
      selectedSpriteId = sPers.id;
      const payload = serializeProject();
      const texto = JSON.stringify(payload);
      check('el_guardado_incluye_params_y_args',
        texto.indexOf('"params"') >= 0 && texto.indexOf('"args"') >= 0 &&
        texto.indexOf('pasos') >= 0 && texto.indexOf('veces') >= 0);
      check('el_nombre_no_se_parte', payload.sprites[0].code[0].val === 'saltar');
      applyPayload(payload);
      const rDef = sprites[0].code.find(n => n.type === 'def_proc');
      const rCall = sprites[0].code.find(n => n.type === 'call_proc');
      check('abrir_restaura_params', !!rDef && rDef.params.join(',') === 'pasos,veces');
      check('abrir_restaura_args', !!rCall && rCall.args.join(',') === '7,3');
      applyPayload({
        version: '2.0',
        sprites: [{ id: 'q', name: 'Q', code: [
          { id: 'qd', type: 'def_proc', val: 'x', params: ['score', 9, 'ok'] },
          { id: 'qc', type: 'call_proc', val: 'x', args: ['a', 'b', 'c', 'd'] }
        ] }],
        variables: {}, lists: {}
      });
      check('importar_filtra_params_y_args',
        sprites[0].code[0].params.join(',') === 'ok' &&
        sprites[0].code[1].args.length === 3);

      /* ============ 4. sincronización de las llamadas ============ */
      const sA = createSpriteData('🐱', 'A', [
        N('def_proc', 'rutina'), N('when_flag'),
        N('call_proc', 'rutina'), N('call_proc', 'otro')
      ]);
      const cAnidado = N('call_proc', 'rutina');
      const repetidor = N('repeat', 2);
      repetidor.body = [cAnidado];
      sA.code.push(repetidor);
      const sB = createSpriteData('🦊', 'B', [N('call_proc', 'rutina')]);
      sprites = [sA, sB];
      syncProcArgs('rutina', ['a', 'b']);
      check('sync_rellena_llamadas', procArgs(sA.code[2], 2).join(',') === '1,1');
      check('sync_llega_a_cuerpo_anidado', procArgs(cAnidado, 2).join(',') === '1,1');
      check('sync_llega_a_otro_personaje', procArgs(sB.code[0], 2).join(',') === '1,1');
      check('sync_no_toca_otros_nombres', !sA.code[3].args);
      sA.code[2].args = ['5', '6', '7'];
      syncProcArgs('rutina', ['a']);
      check('sync_recorta_y_conserva', sA.code[2].args.join(',') === '5');
      syncProcArgs('rutina', []);
      check('sync_sin_parametros_borra_args', !sA.code[2].args && !sB.code[0].args);

      /* ============ 5. dibujo en el DOM ============ */
      const def = N('def_proc', 'saltar');
      def.params = ['pasos', 'veces'];
      def.body = [N('score_set', 1)];
      const llamada = N('call_proc', 'saltar');
      llamada.args = ['7', '3'];
      const sDom = createSpriteData('🐱', 'DOM', [def, N('when_flag'), llamada]);
      sprites = [sDom];
      selectedSpriteId = sDom.id;
      renderCode();
      const itemDef = document.querySelector('#codeList .stack-item[data-id="' + def.id + '"]');
      const itemCall = document.querySelector('#codeList .stack-item[data-id="' + llamada.id + '"]');
      const btn = itemDef && itemDef.querySelector('.proc-params');
      const chips = itemDef ? itemDef.querySelectorAll('.proc-param') : [];
      const casillas = itemCall ? itemCall.querySelectorAll('.proc-arg') : [];
      check('definicion_dibuja_boton', !!btn && btn.dataset.procparams === def.id);
      check('boton_traducido', !!btn && btn.textContent === UI[lang].procParams);
      check('definicion_dibuja_chips', chips.length === 2 &&
        chips[0].textContent === 'pasos' && chips[1].textContent === 'veces');
      check('llamada_dibuja_una_casilla_por_parametro', casillas.length === 2);
      check('casillas_muestran_los_valores', casillas.length === 2 &&
        casillas[0].value === '7' && casillas[1].value === '3');
      check('casillas_no_son_select', casillas.length === 2 &&
        Array.from(casillas).every(c => c.tagName === 'INPUT' && !c.classList.contains('sb-select')));
      check('el_select_del_nombre_sigue_ahi', !!itemCall &&
        !!itemCall.querySelector('.sb-select[data-input="' + llamada.id + '"]'));
      casillas[0].value = '12';
      casillas[0].dispatchEvent(new Event('input', { bubbles: true }));
      check('editar_argumento_guarda', llamada.args[0] === '12');
      check('editar_argumento_no_toca_el_nombre', llamada.val === 'saltar' &&
        llamada.args[1] === '3');
      const preview = blockContent(def, BYID.def_proc, { preview: true });
      check('la_paleta_no_dibuja_controles', !preview.querySelector('.proc-params') &&
        !preview.querySelector('.proc-arg'));

      btn.click();
      await tick(50);
      check('el_boton_abre_el_modal', document.getElementById('askModal').hidden === false);
      check('el_modal_admite_tres_nombres', document.getElementById('askInput').maxLength === 64);
      document.getElementById('askInput').value = 'uno, dos, tres';
      document.getElementById('askOk').click();
      await tick(50);
      check('el_modal_guarda_los_nombres', def.params.join(',') === 'uno,dos,tres');
      check('el_modal_sincroniza_valores', llamada.args.length === 3 && llamada.args[0] === '12');
      check('el_modal_se_cierra', document.getElementById('askModal').hidden === true);
      const btn2 = document.querySelector('#codeList .proc-params[data-procparams="' + def.id + '"]');
      btn2.click();
      await tick(50);
      document.getElementById('askInput').value = '4mal, ok';
      document.getElementById('askOk').click();
      await tick(50);
      check('nombre_invalido_no_se_guarda', def.params.join(',') === 'uno,dos,tres');
      const btn3 = document.querySelector('#codeList .proc-params[data-procparams="' + def.id + '"]');
      btn3.click();
      await tick(50);
      document.getElementById('askCancel').click();
      await tick(50);
      check('cancelar_conserva_los_nombres', def.params.join(',') === 'uno,dos,tres');

      /* ============ 6. ejecución real ============ */
      isRunning = true;
      variables = { total: 0, vidas: 4 };
      procFrames = {};
      const defCalc = N('def_proc', 'calc');
      defCalc.params = ['pasos', 'veces'];
      defCalc.body = [N('set_var', 'total=pasos*veces')];
      const sExec = createSpriteData('🐱', 'E', [defCalc]);
      sExec.vars = {};
      sprites = [sExec];
      selectedSpriteId = sExec.id;
      const call1 = N('call_proc', 'calc');
      call1.args = ['7', '3'];
      await execBlock(call1, sExec);
      check('el_cuerpo_lee_los_parametros', variables.total === 21);
      check('los_parametros_no_se_guardan', !Object.prototype.hasOwnProperty.call(variables, 'pasos') &&
        !Object.prototype.hasOwnProperty.call(sExec.vars, 'pasos'));
      check('los_marcos_se_sacan_al_terminar',
        !procFrames[sExec.id] || procFrames[sExec.id].length === 0);
      const call2 = N('call_proc', 'calc');
      call2.args = ['2', '5'];
      await execBlock(call2, sExec);
      check('otra_llamada_trae_otros_valores', variables.total === 10);
      const call3 = N('call_proc', 'calc');
      await execBlock(call3, sExec);
      check('sin_argumentos_usan_el_valor_de_fabrica', variables.total === 1);
      const call4 = N('call_proc', 'calc');
      call4.args = ['vidas', '2'];
      await execBlock(call4, sExec);
      check('un_argumento_puede_ser_una_variable', variables.total === 8);
      const call5 = N('call_proc', 'calc');
      call5.args = ['2+3', '2'];
      await execBlock(call5, sExec);
      check('un_argumento_puede_ser_una_expresion', variables.total === 10);

      /* Un parámetro también se lee con el reportero ƒ y en condiciones. */
      const defRep = N('def_proc', 'mover');
      defRep.params = ['n'];
      const mv = N('move', '0');
      mv.reps = [N('rep_var', 'n')];
      const cond = N('if_cond', 'n>2');
      cond.body = [N('score_set', 5)];
      defRep.body = [mv, cond];
      const sRep = createSpriteData('🐱', 'R', [defRep]);
      sprites = [sRep];
      const x0 = sRep.x;
      await execBlock(Object.assign(N('call_proc', 'mover'), { args: ['4'] }), sRep);
      check('el_reportero_ve_el_parametro', Math.abs(sRep.x - x0 - 4) < 0.01);
      check('la_condicion_ve_el_parametro', score === 5);
      score = 0;
      await execBlock(Object.assign(N('call_proc', 'mover'), { args: ['1'] }), sRep);
      check('la_condicion_falsa_no_entra', score === 0);

      /* Escribir sobre un parámetro no crea una variable global. */
      const defSet = N('def_proc', 'tocar');
      defSet.params = ['n'];
      defSet.body = [N('add_var', 'n=1'), N('set_var', 'total=n')];
      const sSet = createSpriteData('🐱', 'S', [defSet]);
      sprites = [sSet];
      await execBlock(Object.assign(N('call_proc', 'tocar'), { args: ['9'] }), sSet);
      check('escribir_un_parametro_no_crea_global',
        variables.total === 10 && !Object.prototype.hasOwnProperty.call(variables, 'n'));

      /* Llamadas anidadas: el argumento se evalúa en el ámbito de quien llama. */
      const defDoble = N('def_proc', 'doble');
      defDoble.params = ['n'];
      defDoble.body = [N('set_var', 'total=n*2')];
      const defExterior = N('def_proc', 'exterior');
      defExterior.params = ['k'];
      defExterior.body = [Object.assign(N('call_proc', 'doble'), { args: ['k'] })];
      const sNest = createSpriteData('🐱', 'N', [defDoble, defExterior]);
      sprites = [sNest];
      await execBlock(Object.assign(N('call_proc', 'exterior'), { args: ['6'] }), sNest);
      check('argumento_del_procedimiento_exterior', variables.total === 12);
      check('marcos_anidados_se_sacan',
        !procFrames[sNest.id] || procFrames[sNest.id].length === 0);

      /* El tope de llamadas sigue vivo con parámetros. */
      const defCiclo = N('def_proc', 'ciclo');
      defCiclo.params = ['n'];
      defCiclo.body = [Object.assign(N('call_proc', 'ciclo'), { args: ['n'] }), N('score_add', 1)];
      const sCiclo = createSpriteData('🐱', 'C', [defCiclo]);
      sprites = [sCiclo];
      score = 0;
      await execBlock(Object.assign(N('call_proc', 'ciclo'), { args: ['1'] }), sCiclo);
      check('la_recursion_sigue_cortandose', score === 1);
      check('sin_marcos_colgados_tras_el_ciclo',
        !procFrames[sCiclo.id] || procFrames[sCiclo.id].length === 0);

      /* ============ 7. exportador .sb3 ============ */
      const defSb = N('def_proc', 'saltar');
      defSb.params = ['pasos', 'veces'];
      const pasoSb = N('move', 'pasos');
      defSb.body = [pasoSb];
      const callSb = N('call_proc', 'saltar');
      callSb.args = ['7', 'vidas'];
      const defVieja = N('def_proc', 'vieja');
      defVieja.body = [N('score_set', 1)];
      const callVieja = N('call_proc', 'vieja');
      variables = { vidas: 4 };
      const sSb = createSpriteData('🐱', 'SB3', [
        defSb, defVieja, N('when_flag'), callSb, callVieja
      ]);
      sprites = [sSb];
      selectedSpriteId = sSb.id;
      const built = await sb3Build();
      const bloques = {};
      built.project.targets.forEach(t => {
        Object.keys(t.blocks || {}).forEach(id => { bloques[id] = t.blocks[id]; });
      });
      const porOp = op => Object.keys(bloques).filter(id => bloques[id].opcode === op);
      const protos = porOp('procedures_prototype');
      const llamadas = porOp('procedures_call');
      const protoNuevo = protos.map(id => bloques[id])
        .find(b => b.mutation && b.mutation.proccode === 'saltar %s %s');
      const protoViejo = protos.map(id => bloques[id])
        .find(b => b.mutation && b.mutation.proccode === 'vieja');
      const llamadaNueva = llamadas.map(id => bloques[id])
        .find(b => b.fields && b.fields.PROCCODE && b.fields.PROCCODE[0] === 'saltar %s %s');
      const llamadaVieja = llamadas.map(id => bloques[id])
        .find(b => b.fields && b.fields.PROCCODE && b.fields.PROCCODE[0] === 'vieja');
      check('sb3_dos_definiciones_y_dos_llamadas', protos.length === 2 && llamadas.length === 2);
      check('sb3_proccode_con_placeholders', !!protoNuevo && !!llamadaNueva);
      check('sb3_argumentnames', !!protoNuevo &&
        protoNuevo.mutation.argumentnames === '["pasos","veces"]');
      check('sb3_argumentdefaults', !!protoNuevo &&
        protoNuevo.mutation.argumentdefaults === '["1","1"]');
      check('sb3_argumentids', !!protoNuevo &&
        protoNuevo.mutation.argumentids === '["arg0","arg1"]');
      check('sb3_llamada_lleva_la_misma_mutacion', !!llamadaNueva &&
        llamadaNueva.mutation.proccode === protoNuevo.mutation.proccode &&
        llamadaNueva.mutation.argumentids === '["arg0","arg1"]');
      const reps = porOp('argument_reporter_string_number').map(id => bloques[id]);
      check('sb3_el_prototipo_declara_los_argumentos', !!protoNuevo &&
        bloques[Object.keys(bloques).find(id => bloques[id] === protoNuevo)] &&
        Object.keys(protoNuevo.inputs).indexOf('arg0') >= 0 &&
        Object.keys(protoNuevo.inputs).indexOf('arg1') >= 0);
      check('sb3_reporteros_con_el_nombre_correcto', reps.length >= 3 &&
        ['pasos', 'veces'].every(nm => reps.some(b =>
          b.fields && b.fields.VALUE && b.fields.VALUE[0] === nm && b.shadow === true)));
      check('sb3_llamada_lleva_los_valores', !!llamadaNueva &&
        llamadaNueva.inputs.arg0 && llamadaNueva.inputs.arg0[1][1] === '7' &&
        !!llamadaNueva.inputs.arg1);
      check('sb3_argumento_variable_es_data_variable', (() => {
        if (!llamadaNueva || !llamadaNueva.inputs.arg1) return false;
        const ref = llamadaNueva.inputs.arg1[1];
        return typeof ref === 'string' && bloques[ref] &&
          bloques[ref].opcode === 'data_variable';
      })());
      const pasosBlock = porOp('motion_movesteps').map(id => bloques[id])
        .find(b => b.inputs && b.inputs.STEPS && b.inputs.STEPS[1]);
      check('sb3_el_cuerpo_usa_el_argumento', (() => {
        if (!pasosBlock) return false;
        const ref = pasosBlock.inputs.STEPS[1];
        return typeof ref === 'string' && bloques[ref] &&
          bloques[ref].opcode === 'argument_reporter_string_number';
      })());
      check('sb3_definicion_vieja_sin_argumentos', !!protoViejo && !!llamadaVieja &&
        protoViejo.mutation.argumentnames === '[]' &&
        protoViejo.mutation.argumentdefaults === '[]' &&
        Object.keys(protoViejo.inputs).length === 0);
      check('sb3_grafo_sin_referencias_rotas', built.project.targets.every(t =>
        Object.keys(t.blocks).every(id => {
          const b = t.blocks[id];
          if (b.next && !t.blocks[b.next]) return false;
          if (b.parent && !t.blocks[b.parent]) return false;
          return Object.keys(b.inputs).every(k => {
            const ref = b.inputs[k][1];
            return typeof ref !== 'string' || !!t.blocks[ref];
          });
        })));

      /* ============ 8. limpieza ============ */
      procFrames = {};
      sprites = spritesAlInicio;
      variables = variablesAlInicio;
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
