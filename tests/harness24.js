/* Tanda 34: mensajes con nombre (P2.12, fase 1).
   Antes había UN solo aviso anónimo: cualquier «enviar» despertaba a todos
   los sombreros «al recibir». Acá se comprueba el catálogo, la lista de
   nombres, la compatibilidad con proyectos viejos, el desplegable real del
   editor, el modal de nombre nuevo, el despacho por nombre (incluidas las
   otras pestañas) y una corrida de verdad que sólo toca el guion correcto. */
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

  (async () => {
    try {
      check('sin_errores_arranque', errs.length === 0);

      /* ============ 1. catálogo y textos ============ */
      const sombrero = BYID.when_msg;
      const envio = BYID.send_msg;
      check('sombrero_desplegable', sombrero.pick === 'messages' && sombrero.hat === 1);
      check('envio_desplegable', envio.pick === 'messages');
      check('nombre_de_fabrica', MSG_DEFAULT === 'mensaje' &&
        sombrero.def === MSG_DEFAULT && envio.def === MSG_DEFAULT);
      check('centinela_reservado', MSG_NEW === '__new__' && cleanMsgName(MSG_NEW) === '');
      check('etiquetas_con_casilla_en_cuatro_idiomas',
        ['es', 'en', 'pt', 'fr'].every(l => /\{v\}/.test(sombrero.n[l]) && /\{v\}/.test(envio.n[l])));
      check('claves_nuevas_en_cuatro_idiomas', ['es', 'en', 'pt', 'fr'].every(l =>
        UI[l].msgNew && UI[l].msgNameTitle && UI[l].msgNameHint && UI[l].msgBadName));
      check('opcion_nueva_traducida',
        new Set(['es', 'en', 'pt', 'fr'].map(l => UI[l].msgNew)).size === 4);
      check('solo_dos_bloques_de_mensaje',
        PALETTE_BLOCKS.filter(b => b.pick === 'messages').length === 2);

      /* ============ 2. nombres y compatibilidad ============ */
      check('proyecto_viejo_sin_val', msgName(undefined) === MSG_DEFAULT && msgName('') === MSG_DEFAULT);
      check('nombre_se_normaliza', msgName('  nivel2  ') === 'nivel2');
      check('espacios_se_aplanan', cleanMsgName('  fin   del   juego  ') === 'fin del juego');
      check('tope_de_24', cleanMsgName('x'.repeat(40)).length === 24);
      check('nombre_vacio_no_se_guarda', cleanMsgName('   ') === '');
      check('claves_prohibidas', cleanMsgName('__proto__') === '' && cleanMsgName('constructor') === '');

      /* ============ 3. proyecto con varios nombres ============ */
      const N = (type, val) => makeNode(type, val);
      const a = createSpriteData('🐱', 'A', [
        N('when_msg', 'nivel2'), N('score_add', 1),
        N('when_msg', 'perdiste'), N('score_add', 5)
      ]);
      const b = createSpriteData('🦊', 'B', [
        N('when_msg', 'nivel2'), N('score_add', 2),
        N('when_msg', 'ganaste'), N('score_add', 3),
        N('send_msg', 'perdiste'), N('send_msg', 'nivel2')
      ]);
      const viejo = createSpriteData('🐶', 'Viejo', [
        N('when_msg'), N('score_add', 7)
      ]);
      delete viejo.code[0].val; /* como quedó guardado un proyecto viejo */
      sprites = [a, b, viejo];
      selectedSpriteId = a.id;
      renderCode();

      check('dos_sombreros_nivel2', msgScripts('nivel2').length === 2);
      check('un_sombrero_perdiste', msgScripts('perdiste').length === 1);
      check('un_sombrero_ganaste', msgScripts('ganaste').length === 1);
      check('sombrero_viejo_escucha_fabrica', msgScripts(MSG_DEFAULT).length === 1);
      check('nombre_desconocido_no_despierta', msgScripts('otro').length === 0);
      check('filtro_es_por_sombrero', msgScripts('nivel2').every(sc => msgName(sc.hat.val) === 'nivel2'));
      check('la_bandera_no_arranca_mensajes', scriptsFor('when_flag').length === 0);

      /* ============ 4. desplegable real ============ */
      const lista = pickList('messages');
      const ids = lista.map(x => x.id);
      check('lista_con_los_nombres_usados', ['nivel2', 'perdiste', 'ganaste'].every(n => ids.indexOf(n) > -1));
      check('lista_con_fabrica_y_crear', ids.indexOf(MSG_DEFAULT) > -1 && ids.indexOf(MSG_NEW) > -1);
      check('lista_sin_repetidos', new Set(ids).size === ids.length);
      check('crear_esta_traducido',
        (lista.find(x => x.id === MSG_NEW) || { name: {} }).name[lang] === UI[lang].msgNew);
      check('etiquetas_de_nombre', pickLabel('messages', 'nivel2') === 'nivel2' &&
        pickLabel('messages', 'fantasma') === 'fantasma');
      check('coincidencia_normalizada', pickMatch('messages', 'nivel2', '  nivel2  '));

      const sels = Array.from(document.querySelectorAll('#codeList .sb-select'));
      check('desplegables_en_el_editor', sels.length === 2);
      const opts = sels[0] ? Array.from(sels[0].options).map(o => o.value) : [];
      check('opciones_reales', ['mensaje', 'nivel2', 'perdiste', 'ganaste', MSG_NEW]
        .every(n => opts.indexOf(n) > -1));
      check('seleccion_actual', !!sels[0] && msgName(sels[0].value) === 'nivel2');

      sels[0].value = 'perdiste';
      sels[0].dispatchEvent(new Event('change', { bubbles: true }));
      check('cambiar_nombre_guarda', a.code[0].val === 'perdiste');

      /* El centinela abre el modal; jamás se escribe en el bloque. */
      sels[0].value = MSG_NEW;
      sels[0].dispatchEvent(new Event('input', { bubbles: true }));
      check('centinela_no_se_guarda_en_input', a.code[0].val === 'perdiste');
      sels[0].dispatchEvent(new Event('change', { bubbles: true }));
      check('crear_abre_el_modal', document.getElementById('askModal').hidden === false);
      check('modal_pide_el_nombre', document.getElementById('askInput').hidden === false &&
        document.getElementById('askInput').maxLength === 24);
      document.getElementById('askInput').value = 'empate';
      document.getElementById('askOk').click();
      await tick(40);
      check('nombre_nuevo_queda_en_el_bloque', a.code[0].val === 'empate');
      check('nombre_nuevo_entra_en_la_lista', pickList('messages').some(x => x.id === 'empate'));
      check('modal_se_cierra', document.getElementById('askModal').hidden === true);

      /* Cancelar conserva el nombre anterior. */
      const sels2 = Array.from(document.querySelectorAll('#codeList .sb-select'));
      sels2[0].value = MSG_NEW;
      sels2[0].dispatchEvent(new Event('change', { bubbles: true }));
      document.getElementById('askCancel').click();
      await tick(40);
      check('cancelar_conserva_el_nombre', a.code[0].val === 'empate');

      /* ============ 5. despacho por nombre (sin correr hilos) ============ */
      const origRun = window.runScripts;
      const corridas = [];
      window.runScripts = list => { corridas.push(list); };
      broadcastMsg('nivel2');
      await tick(40);
      check('envio_despacio_solo_su_nombre', corridas.length === 1 &&
        corridas[0].length === 1 && msgName(corridas[0][0].hat.val) === 'nivel2');
      broadcastMsg('nivel2');
      await tick(40);
      check('rebote_del_mismo_nombre_se_corta', corridas.length === 1);
      broadcastMsg('perdiste');
      await tick(40);
      check('otro_nombre_no_hereda_el_rebote', corridas.length === 2 &&
        corridas[1].length === 1 && msgName(corridas[1][0].hat.val) === 'perdiste');
      const guardado = JSON.parse(localStorage.getItem('scrachmo_msg'));
      check('el_nombre_viaja_a_otras_pestanas', guardado && guardado.name === 'perdiste');
      await tick(300);
      broadcastMsg('nivel2');
      await tick(40);
      check('el_rebote_se_libera_con_el_tiempo', corridas.length === 3);

      /* Otra pestaña: el evento storage trae el nombre y respeta el botón. */
      const multiViejo = multiOn;
      const antesApagado = corridas.length;
      multiOn = false;
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'scrachmo_msg', newValue: JSON.stringify({ t: Date.now(), name: 'empate' })
      }));
      check('mensajes_apagados_no_reciben', corridas.length === antesApagado);
      multiOn = true;
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'scrachmo_msg', newValue: JSON.stringify({ t: Date.now(), name: 'ganaste' })
      }));
      check('otra_pestana_despacio_por_nombre', corridas.length === antesApagado + 1 &&
        msgName(corridas[corridas.length - 1][0].hat.val) === 'ganaste');
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'scrachmo_msg', newValue: JSON.stringify({ t: Date.now() })
      }));
      check('pestana_vieja_cae_en_fabrica', corridas.length === antesApagado + 2 &&
        msgName(corridas[corridas.length - 1][0].hat.val) === MSG_DEFAULT);
      multiOn = multiViejo;
      window.runScripts = origRun;

      /* ============ 6. corrida de verdad ============ */
      sprites = [
        createSpriteData('🐱', 'Correcto', [N('when_msg', 'fin'), N('score_set', 42)]),
        createSpriteData('🦊', 'Otro', [N('when_msg', 'perdiste'), N('score_set', 99)]),
        createSpriteData('🐶', 'Viejo', [N('when_msg'), N('score_set', 7)])
      ];
      sprites[2].code[0].val = undefined;
      selectedSpriteId = sprites[0].id;
      score = 0;
      lastMsgAt.fin = 0;
      await execBlock(N('send_msg', 'fin'), sprites[0]);
      await tick(500);
      check('ejecucion_real_solo_el_nombre_correcto', score === 42);
      check('sin_errores_final', errs.length === 0);
    } catch (err) {
      out.push('ERROR ' + err.message + ' @ ' + (err.stack || '').split('\n')[1]);
    }
    clearTimeout(watchdog);
    done();
  })();
});
