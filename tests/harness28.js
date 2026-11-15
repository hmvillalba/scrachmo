/* Tanda 39: variables locales por personaje (P2.12, fase 5).
   Comprueba los textos de ámbito en cuatro idiomas, la resolución con caída
   a la global, el aislamiento entre personajes, la persistencia (incluidos
   los proyectos viejos sin `vars`), el panel con su selector y el .sb3 con
   las locales declaradas en el target que corresponde. */
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
  const eraRunning = isRunning;
  const claves = ['varScope', 'varScopeGlobal', 'varScopeLocal', 'varLocalTag'];
  const spritesAlInicio = sprites;
  const variablesAlInicio = variables;

  (async () => {
    try {
      check('sin_errores_arranque', errs.length === 0);

      /* ============ 1. catálogo y textos ============ */
      check('la_paleta_sigue_en_65', PALETTE_BLOCKS.length === 65);
      check('los_reporteros_siguen_en_13', REPORTER_BLOCKS.length === 13);
      check('badge_al_dia', document.getElementById('blocksCount').textContent === '65');
      check('cuatro_claves_nuevas', LANGS.every(l =>
        claves.every(k => typeof UI[l][k] === 'string' && UI[l][k].length > 0)));
      check('claves_de_ambito_con_traducciones_propias', ['varScope', 'varScopeGlobal', 'varScopeLocal']
        .every(k => new Set(LANGS.map(l => UI[l][k])).size === 4));
      check('sin_bloques_nuevos_en_esta_fase', !BYID.create_local_var && !BYID.local_var);
      check('categoria_vars_sigue_igual', PALETTE_BLOCKS.filter(b => b.cat === 'vars').length === 12);

      /* ============ 2. helpers de ámbito ============ */
      check('normalizeVars_rechaza_objetos_raros',
        Object.keys(normalizeVars(null)).length === 0 &&
        Object.keys(normalizeVars([])).length === 0 &&
        Object.keys(normalizeVars('hola')).length === 0);
      check('normalizeVars_filtra_nombres', (() => {
        const v = normalizeVars({ bueno: 1, 'con-espacio': 2, score: 3,
          __proto__: 4, constructor: 5, prototype: 6, DemasiadoLargoNombre: 7 });
        return Object.keys(v).join(',') === 'bueno';
      })());
      check('normalizeVars_conserva_numeros_y_texto', (() => {
        const v = normalizeVars({ n: 4.5, s: 'hola' });
        return v.n === 4.5 && v.s === 'hola';
      })());
      check('normalizeVars_recorta_texto_largo',
        normalizeVars({ s: 'x'.repeat(300) }).s.length === 120);

      const g = { global: 10 };
      variables = g;
      const sa = { id: 'sa', vars: { vidas: 3 } };
      const sb = { id: 'sb', vars: { vidas: 9 } };
      const sc = { id: 'sc', vars: {} };
      check('varStore_cae_a_la_global', varStore('global', sa) === variables);
      check('varStore_devuelve_la_local', varStore('vidas', sa) === sa.vars);
      check('varHas_local', varHas('vidas', sa) && !varHas('vidas', sc));
      check('varHas_global', varHas('global', sa));
      check('varGet_prefiere_la_local', varGet('vidas', sa) === 3 && varGet('vidas', sb) === 9);
      check('varGet_cae_a_la_global', varGet('global', sa) === 10);
      check('varGet_desconocida_da_cero', varGet('nose', sa) === 0);
      check('varGet_score_sigue_especial', varGet('score', sa) === score);
      check('varPairs_incluye_ambos_ambitos',
        varPairs(sa).length === 2 && varPairs(sa).some(([k, v]) => k === 'global' && v === 10) &&
        varPairs(sa).some(([k, v]) => k === 'vidas' && v === 3));
      check('varsSignature_cambia_con_el_personaje',
        varsSignature(sa) !== varsSignature(sb) &&
        varsSignature(sa) === varsSignature({ id: 'sa', vars: { vidas: 99 } }));

      /* ============ 3. estado y persistencia ============ */
      const nacido = createSpriteData('🐱', 'Nuevo', []);
      check('createSpriteData_trae_vars', !!nacido.vars &&
        typeof nacido.vars === 'object' && Object.keys(nacido.vars).length === 0);
      check('normalizeSprites_lee_vars', (() => {
        const l = normalizeSprites([{ id: 'x', name: 'X', code: [], vars: { k: 2 } }]);
        return l.length === 1 && l[0].vars.k === 2;
      })());
      check('normalizeSprites_proyecto_viejo_sin_vars', (() => {
        const l = normalizeSprites([{ id: 'x', name: 'X', code: [] }]);
        return l.length === 1 && Object.keys(l[0].vars).length === 0;
      })());
      check('normalizeSprites_limpia_vars', (() => {
        const l = normalizeSprites([{ id: 'x', name: 'X', code: [], vars: { ok: 1, 'mal-name': 2 } }]);
        return Object.keys(l[0].vars).join(',') === 'ok';
      })());

      const a1 = createSpriteData('🐱', 'A', []); a1.vars = { vidas: 3 };
      const b1 = createSpriteData('🐶', 'B', []); b1.vars = { vidas: 9 };
      sprites = [a1, b1];
      selectedSpriteId = a1.id;
      variables = { global: 10 };
      check('serializeProject_guarda_vars', (() => {
        const p = serializeProject();
        return p.sprites.length === 2 && p.sprites[0].vars.vidas === 3 &&
          p.sprites[1].vars.vidas === 9 && p.variables.global === 10;
      })());
      check('round_trip_del_proyecto', (() => {
        const p = serializeProject();
        const ok = applyPayload(p);
        return ok && sprites.length === 2 && sprites[0].vars.vidas === 3 &&
          sprites[1].vars.vidas === 9 && variables.global === 10;
      })());
      check('proyecto_viejo_sin_vars_no_rompe', (() => {
        const ok = applyPayload({ sprites: [{ id: 'z', name: 'Z', code: [] }], variables: { g: 1 } });
        return ok && Object.keys(sprites[0].vars).length === 0 && variables.g === 1;
      })());

      /* ============ 4. resolución al evaluar ============ */
      const A = createSpriteData('🐱', 'A', []); A.vars = { vidas: 3 };
      const B = createSpriteData('🐶', 'B', []); B.vars = { vidas: 9 };
      const C = createSpriteData('🦊', 'C', []);
      sprites = [A, B, C];
      selectedSpriteId = A.id;
      variables = { global: 10, vidas: 100 };
      check('evalExpr_ve_la_local', evalExpr('vidas + 1', A) === 4);
      check('evalExpr_respeta_otro_personaje', evalExpr('vidas + 1', B) === 10);
      check('evalExpr_cae_a_la_global', evalExpr('vidas + 1', C) === 101);
      check('evalExpr_sin_sprite_usa_globales', evalExpr('vidas + 1') === 101);
      check('evalExpr_ve_la_global_normal', evalExpr('global * 2', A) === 20);
      check('evalExpr_score_sigue_vigente', evalExpr('score + 1', A) === score + 1);
      check('resolveValue_ve_la_local', resolveValue('vidas', A) === 3);
      check('resolveValue_cae_a_la_global', resolveValue('vidas', C) === 100);
      check('condSide_ve_la_local', condSide('vidas', A) === 3);
      check('evalCond_compara_con_la_local', evalCond('vidas > 2', A) === true &&
        evalCond('vidas > 5', A) === false);
      check('evalCond_compara_con_la_global', evalCond('vidas > 50', C) === true);
      check('rep_var_lee_la_local', evalReporter(N('rep_var', 'vidas'), A) === 3);
      check('rep_var_lee_otro_personaje', evalReporter(N('rep_var', 'vidas'), B) === 9);
      check('rep_var_cae_a_la_global', evalReporter(N('rep_var', 'vidas'), C) === 100);
      check('rep_var_score_sigue_vigente', evalReporter(N('rep_var', 'score'), A) === score);

      /* ============ 5. escritura real desde los bloques ============ */
      applyVar(N('set_var', 'vidas=7'), A);
      check('set_var_escribe_la_local', A.vars.vidas === 7 && variables.vidas === 100);
      applyVar(N('add_var', 'vidas=2'), A);
      check('add_var_suma_la_local', A.vars.vidas === 9);
      applyVar(N('sub_var', 'vidas=4'), A);
      check('sub_var_resta_la_local', A.vars.vidas === 5);
      applyVar(N('set_var', 'vidas=50'), C);
      check('set_var_sin_local_escribe_la_global', variables.vidas === 50 && !C.vars.vidas);
      A.vars.declarada = 0;
      applyVar(N('set_var', 'declarada=42'), A);
      check('set_var_escribe_una_local_declarada',
        A.vars.declarada === 42 && !('declarada' in variables));
      applyVar(N('set_var', 'nueva=8'), A);
      check('nombre_nuevo_nace_global', variables.nueva === 8 && !A.vars.nueva);
      applyVar(N('set_var', 'otra=vidas'), A);
      check('set_var_resuelve_el_valor_en_el_ambito',
        variables.otra === 5 && A.vars.vidas === 5);
      const clavesAntes = Object.keys(A.vars).length + Object.keys(variables).length;
      applyVar(N('set_var', 'sin_igual'), A);
      check('set_var_sin_igual_no_hace_nada',
        Object.keys(A.vars).length + Object.keys(variables).length === clavesAntes);
      check('ejecucion_real_de_un_guion', (() => {
        const s = createSpriteData('🐱', 'Run', []);
        s.vars = { k: 1 };
        execBlock(N('add_var', 'k=4'), s);
        return s.vars.k === 5;
      })());

      /* ============ 6. panel ============ */
      renderVars();
      const lista = document.getElementById('varsList');
      check('panel_cuenta_globales_y_locales', document.getElementById('varsCount').textContent ===
        String(Object.keys(variables).length + Object.keys(A.vars).length));
      check('panel_dibuja_un_chip_por_local',
        lista.querySelectorAll('.var-scope').length === Object.keys(A.vars).length);
      check('panel_marca_el_ambito', lista.querySelectorAll('[data-scope="local"]').length > 0 &&
        lista.querySelectorAll('[data-scope="global"]').length > 0);
      check('panel_local_sin_ojo', (() => {
        const loc = lista.querySelector('.var-card[data-scope="local"]');
        return !!loc && !loc.querySelector('[data-eye]');
      })());
      check('panel_global_con_ojo', (() => {
        const glo = lista.querySelector('.var-card[data-scope="global"]');
        return !!glo && !!glo.querySelector('[data-eye]');
      })());
      check('formulario_tiene_selector_de_ambito',
        varFormHTML(UI.es).indexOf('id="newVarScope"') >= 0);
      check('selector_con_dos_opciones', (() => {
        const h = varFormHTML(UI.es);
        return h.indexOf('value="global"') >= 0 && h.indexOf('value="local"') >= 0 &&
          h.indexOf(UI.es.varScopeGlobal) >= 0 && h.indexOf(UI.es.varScopeLocal) >= 0;
      })());
      check('selector_traducido_en_cuatro_idiomas', LANGS.every(l => {
        const h = varFormHTML(UI[l]);
        return h.indexOf(UI[l].varScopeGlobal) >= 0 && h.indexOf(UI[l].varScopeLocal) >= 0;
      }));

      varFormOpen = true;
      renderVars();
      const inp = document.getElementById('newVarName');
      const sel = document.getElementById('newVarScope');
      check('formulario_abierto_en_el_dom', !!inp && !!sel);
      inp.value = 'localNueva';
      sel.value = 'local';
      createVariable();
      check('crear_variable_local', A.vars.localNueva === 0 && !('localNueva' in variables));
      check('cerrar_formulario_al_crear', varFormOpen === false);
      stepVariable('localNueva', 3, true);
      check('paso_en_variable_local', A.vars.localNueva === 3);
      deleteVariable('localNueva', true);
      check('borrar_variable_local', !('localNueva' in A.vars));
      varFormOpen = true;
      renderVars();
      document.getElementById('newVarName').value = 'globalNueva';
      document.getElementById('newVarScope').value = 'global';
      createVariable();
      check('crear_variable_global', variables.globalNueva === 0 && !A.vars.globalNueva);
      deleteVariable('globalNueva', false);
      check('borrar_variable_global', !('globalNueva' in variables));
      check('mismo_nombre_en_ambos_ambitos', (() => {
        varFormOpen = true; renderVars();
        document.getElementById('newVarName').value = 'vidas';
        document.getElementById('newVarScope').value = 'local';
        createVariable();
        /* «vidas» ya existe como local: el formulario debe rechazarla, no
           pisar el valor que tenía. */
        return A.vars.vidas === 5 && varFormOpen === true;
      })());
      closeVarForm();

      /* ============ 7. exportador .sb3 ============ */
      variables = { global: 10, vidas: 100 };
      const ea = createSpriteData('🐱', 'A', [N('when_flag'), N('set_var', 'vidas=4')]);
      ea.vars = { vidas: 3 };
      const eb = createSpriteData('🐶', 'B', [N('when_flag'), N('set_var', 'vidas=8')]);
      eb.vars = { vidas: 9 };
      sprites = [ea, eb];
      selectedSpriteId = ea.id;
      const built = await sb3Build();
      const stage = built.project.targets[0];
      const ta = built.project.targets.find(t => t.name === 'A');
      const tb = built.project.targets.find(t => t.name === 'B');
      const nombres = o => Object.keys(o || {}).map(k => o[k][0]);
      const idDe = (o, name) => Object.keys(o || {}).find(k => o[k][0] === name);
      check('sb3_stage_es_el_primero', stage.isStage === true);
      check('sb3_stage_declara_la_global', nombres(stage.variables).indexOf('global') >= 0);
      check('sb3_stage_no_declara_las_locales', nombres(stage.variables).filter(n => n === 'vidas').length === 1);
      check('sb3_target_A_declara_su_local', nombres(ta.variables).indexOf('vidas') >= 0 &&
        ta.variables[idDe(ta.variables, 'vidas')][1] === 3);
      check('sb3_target_B_declara_su_local', nombres(tb.variables).indexOf('vidas') >= 0 &&
        tb.variables[idDe(tb.variables, 'vidas')][1] === 9);
      check('sb3_ids_de_locales_distintos',
        idDe(ta.variables, 'vidas') !== idDe(tb.variables, 'vidas'));
      check('sb3_id_global_distinto_de_los_locales',
        idDe(stage.variables, 'vidas') !== idDe(ta.variables, 'vidas'));
      check('sb3_bloque_de_A_apunta_a_su_id', Object.keys(ta.blocks).some(k => {
        const f = ta.blocks[k].fields && ta.blocks[k].fields.VARIABLE;
        return f && f[0] === 'vidas' && f[1] === idDe(ta.variables, 'vidas');
      }));
      check('sb3_bloque_de_B_apunta_a_su_id', Object.keys(tb.blocks).some(k => {
        const f = tb.blocks[k].fields && tb.blocks[k].fields.VARIABLE;
        return f && f[0] === 'vidas' && f[1] === idDe(tb.variables, 'vidas');
      }));
      check('sb3_todos_los_ids_de_variable_declarados', built.project.targets.every(t => {
        const propios = Object.keys(t.variables || {}).concat(Object.keys(stage.variables || {}));
        return Object.keys(t.blocks || {}).every(k => {
          const f = t.blocks[k].fields && t.blocks[k].fields.VARIABLE;
          return !f || propios.indexOf(f[1]) >= 0;
        });
      }));
      check('sb3_sin_extensiones_espurias',
        Array.isArray(built.project.extensions) && built.project.extensions.length === 0);

      /* ============ 8. limpieza ============ */
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
