/* Tanda 35: listas con nombre (P2.12, fase 2).
   Antes sólo había variables: un nombre -> UN valor. Acá se comprueba que
   varias listas con nombre conviven, que el desplegable «Nueva lista…» crea
   otra sin pisar el valor del bloque, que pickAt deja un solo <select> por
   bloque, que los cuatro bloques y los dos reporteros funcionan de verdad,
   que el proyecto se guarda y se abre, y que la tarjeta del panel responde. */
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
  const slotsDe = def => (def.n.es.match(/\{(?:v|x|y)\}/g) || []).join('');

  (async () => {
    try {
      check('sin_errores_arranque', errs.length === 0);

      /* ============ 1. catálogo ============ */
      const LB = PALETTE_BLOCKS.filter(b => b.pick === 'lists');
      const LR = REPORTER_BLOCKS.filter(b => b.pick === 'lists');
      check('cuatro_bloques_de_lista', LB.length === 4);
      check('dos_reporteros_de_lista', LR.length === 2);
      check('bloques_en_la_categoria_variables', LB.every(b => b.cat === 'vars'));
      check('reporteros_en_la_categoria_operadores', LR.every(b => b.cat === 'ops' && b.rep === 1));
      check('pickAt_en_el_hueco_del_nombre',
        BYID.list_add.pickAt === 1 && BYID.list_del.pickAt === 1 &&
        BYID.list_replace.pickAt === 2 && BYID.list_clear.pickAt === undefined &&
        BYID.rep_list_item.pickAt === 1 && BYID.rep_list_len.pickAt === undefined);
      check('valores_de_fabrica',
        BYID.list_add.def === '1,lista' && BYID.list_replace.def === '1,1,lista' &&
        BYID.list_clear.def === 'lista' && BYID.rep_list_item.def === '1,lista');
      check('nombre_de_fabrica', LIST_DEFAULT === 'lista' && listName(undefined) === 'lista');
      check('centinela_distinto_al_de_mensajes', LIST_NEW !== MSG_NEW &&
        cleanListName(LIST_NEW) === '' && cleanMsgName(LIST_NEW) !== '');
      /* Si un idioma reordena los huecos, el MISMO node.val significaría otra
         cosa al cambiar de idioma: los datos no se pueden traducir. */
      check('orden_de_huecos_igual_en_cuatro_idiomas',
        LB.concat(LR).every(b => LANGS.every(l =>
          (b.n[l].match(/\{(?:v|x|y)\}/g) || []).join('') === slotsDe(b))));
      check('claves_nuevas_en_cuatro_idiomas', LANGS.every(l =>
        ['listNew', 'listNameTitle', 'listNameHint', 'listBadName', 'listsTitle',
          'listsHint', 'newList', 'listsEmpty', 'listsEmptyDesc', 'listCreated',
          'listDeleted', 'deleteList', 'listAddPlaceholder', 'listAddItem',
          'listDelItem', 'listFull', 'listItems'].every(k => typeof UI[l][k] === 'string' && UI[l][k].length)));
      check('opcion_nueva_traducida', new Set(LANGS.map(l => UI[l].listNew)).size === 4);
      check('tarjeta_en_el_editor', !!document.getElementById('listsCard') &&
        !!document.getElementById('listsList') && !!document.getElementById('newListBtn'));

      /* ============ 2. nombres y datos importados ============ */
      check('nombre_se_normaliza', listName('  inventario  ') === 'inventario');
      check('una_coma_no_parte_el_nombre', listName('inventario,2') === 'inventario');
      check('espacios_se_aplanan', cleanListName('  mi   lista  ') === 'mi lista');
      check('tope_de_24', cleanListName('x'.repeat(40)).length === 24);
      check('nombre_vacio_no_se_guarda', cleanListName('   ') === '');
      check('coma_rechazada', cleanListName('a,b') === '');
      check('centinela_rechazado', cleanListName(LIST_NEW) === '');
      check('claves_prohibidas', cleanListName('__proto__') === '' &&
        cleanListName('constructor') === '' && cleanListName('prototype') === '');
      const norm = normalizeLists({ ok: [1, 'dos'], texto: 'no es lista', 'a,b': [1], __proto__: [1] });
      check('normalize_descarta_basura', Object.keys(norm).length === 1 &&
        norm.ok.length === 2 && norm.ok[1] === 'dos');
      check('normalize_tope_200_items', normalizeLists({ grande: Array.from({ length: 300 }, (_, i) => i) }).grande.length === 200);
      const muchas = {};
      for (let i = 0; i < 30; i++) muchas['l' + i] = [];
      check('normalize_tope_24_listas', Object.keys(normalizeLists(muchas)).length === 24);

      /* ============ 3. lista dinámica de nombres ============ */
      lists = { inventario: ['espada', 3], equipo: [] };
      const add = N('list_add', '3,inventario');
      const rep = N('list_replace', '9,2,inventario');
      const clr = N('list_clear', 'inventario');
      const say = N('say', 'hola');
      say.reps = [N('rep_list_len', 'equipo')];
      const say2 = N('say', 'x');
      say2.reps = [N('rep_list_item', '1,desde_reportero')];
      sprites = [createSpriteData('🐱', 'A', [add, rep, clr, say, say2])];
      selectedSpriteId = sprites[0].id;
      renderCode();
      renderLists();

      const ids = pickList('lists').map(x => x.id);
      check('lista_con_fabrica_y_crear', ids.indexOf(LIST_DEFAULT) > -1 && ids.indexOf(LIST_NEW) > -1);
      check('lista_con_las_listas_creadas', ids.indexOf('inventario') > -1 && ids.indexOf('equipo') > -1);
      check('nombre_de_reportero_anidado_entra', ids.indexOf('desde_reportero') > -1);
      check('lista_sin_repetidos', new Set(ids).size === ids.length);
      check('lista_ordenada', ids.slice(0, -1).every((v, i, a) => i === 0 || a[i - 1] <= v));
      check('crear_esta_traducido',
        (pickList('lists').find(x => x.id === LIST_NEW) || { name: {} }).name[lang] === UI[lang].listNew);
      check('coincidencia_normalizada', pickMatch('lists', 'inventario', '  inventario  '));
      check('etiqueta_huerfana', pickLabel('lists', 'fantasma') === 'fantasma');

      /* ============ 4. desplegable real con pickAt ============ */
      const selDe = n => Array.from(document.querySelectorAll('#codeList .sb-select'))
        .filter(s => s.dataset.input === n.id);
      const inpDe = n => Array.from(document.querySelectorAll('#codeList input.sb-input'))
        .filter(s => s.dataset.input === n.id);
      check('anadir_un_select_y_un_input', selDe(add).length === 1 && inpDe(add).length === 1);
      check('reemplazar_un_select_y_dos_inputs', selDe(rep).length === 1 && inpDe(rep).length === 2);
      check('vaciar_solo_un_select', selDe(clr).length === 1 && inpDe(clr).length === 0);
      check('select_en_su_hueco', selDe(add)[0].dataset.xy === '1' && inpDe(add)[0].dataset.xy === '0');
      check('select_de_tres_huecos', selDe(rep)[0].dataset.xy === '2');
      check('el_hueco_del_select_no_admite_reportero', !selDe(add)[0].closest('.sb-slot'));
      check('opciones_reales', Array.from(selDe(add)[0].options).some(o => o.value === LIST_NEW) &&
        Array.from(selDe(add)[0].options).some(o => o.value === 'inventario'));
      check('seleccion_actual', selDe(add)[0].value === 'inventario');

      inpDe(add)[0].value = '7';
      inpDe(add)[0].dispatchEvent(new Event('input', { bubbles: true }));
      check('editar_valor_no_pisa_el_nombre', add.val === '7,inventario');
      selDe(add)[0].value = 'equipo';
      selDe(add)[0].dispatchEvent(new Event('change', { bubbles: true }));
      check('cambiar_nombre_no_pisa_el_valor', add.val === '7,equipo');
      selDe(add)[0].value = LIST_NEW;
      selDe(add)[0].dispatchEvent(new Event('input', { bubbles: true }));
      check('centinela_no_se_guarda_en_input', add.val === '7,equipo');
      selDe(add)[0].dispatchEvent(new Event('change', { bubbles: true }));
      check('crear_abre_el_modal', document.getElementById('askModal').hidden === false);
      check('modal_pide_hasta_24', document.getElementById('askInput').maxLength === 24);
      document.getElementById('askInput').value = 'mochila';
      document.getElementById('askOk').click();
      await tick(50);
      check('nombre_nuevo_queda_en_su_hueco', add.val === '7,mochila');
      check('nombre_nuevo_crea_la_lista', Array.isArray(lists.mochila));
      check('nombre_nuevo_entra_en_la_lista', pickList('lists').some(x => x.id === 'mochila'));
      const sel2 = selDe(add)[0];
      sel2.value = LIST_NEW;
      sel2.dispatchEvent(new Event('change', { bubbles: true }));
      document.getElementById('askCancel').click();
      await tick(50);
      check('cancelar_conserva_el_nombre', add.val === '7,mochila');

      /* ============ 5. ejecución de los cuatro bloques ============ */
      lists = { inventario: [] };
      const s0 = sprites[0];
      await execBlock(N('list_add', 'espada,inventario'), s0);
      await execBlock(N('list_add', '4,inventario'), s0);
      check('anadir_guarda_valores', lists.inventario.length === 2 &&
        lists.inventario[0] === 'espada' && lists.inventario[1] === 4);
      check('el_valor_numerico_es_numero', typeof lists.inventario[1] === 'number');
      await execBlock(N('list_replace', 'escudo,1,inventario'), s0);
      check('reemplazar_por_posicion', lists.inventario[0] === 'escudo');
      await execBlock(N('list_replace', 'nada,99,inventario'), s0);
      check('reemplazar_fuera_de_rango_no_hace_nada', lists.inventario.length === 2);
      await execBlock(N('list_del', '0,inventario'), s0);
      check('posicion_cero_no_borra', lists.inventario.length === 2);
      await execBlock(N('list_del', '1,inventario'), s0);
      check('borrar_por_posicion', lists.inventario.length === 1 && lists.inventario[0] === 4);
      check('reportero_de_largo', evalReporter(N('rep_list_len', 'inventario'), s0) === 1);
      check('reportero_de_elemento', evalReporter(N('rep_list_item', '1,inventario'), s0) === 4);
      check('reportero_fuera_de_rango_da_cero', evalReporter(N('rep_list_item', '9,inventario'), s0) === 0);
      check('reportero_de_lectura_no_crea_lista', evalReporter(N('rep_list_len', 'inexistente'), s0) === 0 &&
        !('inexistente' in lists));
      await execBlock(N('list_add', '5,otra'), s0);
      check('anadir_crea_la_lista_si_no_existe', Array.isArray(lists.otra) && lists.otra[0] === 5);
      await execBlock(N('list_clear', 'inventario'), s0);
      check('vaciar_deja_la_lista_en_cero', lists.inventario.length === 0 && 'inventario' in lists);
      score = 17;
      const conRep = N('list_add', '0,puntajes');
      conRep.reps = [N('rep_score')];
      await execBlock(conRep, s0);
      check('un_reportero_puede_ser_el_valor', lists.puntajes[0] === 17);
      lists.llena = Array.from({ length: 200 }, (_, i) => i);
      await execBlock(N('list_add', '201,llena'), s0);
      check('tope_de_200_al_anadir', lists.llena.length === 200);

      /* ============ 6. persistencia ============ */
      lists = { inventario: ['a', 'b'], equipo: [] };
      const payload = serializeProject();
      check('el_guardado_incluye_las_listas', !!payload.lists &&
        payload.lists.inventario.length === 2 && Array.isArray(payload.lists.equipo));
      lists = {};
      applyPayload(payload);
      check('abrir_restaura_las_listas', lists.inventario && lists.inventario[1] === 'b');
      const viejo = Object.assign({}, payload);
      delete viejo.lists;
      applyPayload(viejo);
      check('proyecto_viejo_sin_listas_no_rompe', Object.keys(lists).length === 0);
      lists = { temporal: [1] };
      resetProjectData(true);
      check('borrar_todo_limpia_las_listas', Object.keys(lists).length === 0);

      /* ============ 7. panel ============ */
      lists = {};
      renderLists();
      check('panel_vacio', /empty/.test(document.getElementById('listsList').innerHTML));
      document.getElementById('newListBtn').click();
      const form = document.getElementById('listForm');
      check('el_boton_abre_el_formulario', !!form && document.getElementById('newListBtn').hidden === true);
      document.getElementById('newListName').value = 'equipo';
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      check('crear_desde_el_panel', Array.isArray(lists.equipo));
      check('badge_cuenta_la_lista', document.getElementById('listsCount').textContent === '1');
      const inp = document.querySelector('#listsList [data-list-add="equipo"]');
      inp.value = 'rojo';
      document.querySelector('#listsList [data-list-add-btn="equipo"]').click();
      check('anadir_desde_el_panel', lists.equipo[0] === 'rojo');
      document.querySelector('#listsList [data-list-del-item="equipo"][data-idx="0"]').click();
      check('borrar_valor_desde_el_panel', lists.equipo.length === 0);
      document.querySelector('#listsList [data-del-list="equipo"]').click();
      check('borrar_lista_desde_el_panel', !('equipo' in lists));
      check('texto_de_la_tarjeta_traducido',
        document.querySelector('#listsCard [data-t="listsTitle"]').textContent === UI[lang].listsTitle);

      check('sin_errores_final', errs.length === 0);
    } catch (err) {
      out.push('ERROR ' + err.message + ' @ ' + (err.stack || '').split('\n')[1]);
    }
    clearTimeout(watchdog);
    done();
  })();
});
