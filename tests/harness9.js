/* Tanda 2: reporteros. Comprueba el modelo (node.reps sin tocar node.val),
   la evaluación, la ejecución y el selector ƒ sobre el DOM real. */
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

  const payload = code => ({
    version: '2.0',
    sprites: [{ id: 'r', name: 'Rep', code: code }],
    variables: { vidas: 7 },
    score: 12
  });
  (async () => {
    try {
      check('sin_errores_arranque', errs.length === 0);

      /* ============ 1. catálogo ============ */
      check('reporteros_13', REPORTER_BLOCKS.length === 13);
      check('paleta_57', PALETTE_BLOCKS.length === 57);
      check('paleta_sin_reporteros', PALETTE_BLOCKS.every(b => !b.rep));
      check('byid_reportero', !!BYID.rep_add && BYID.rep_add.rep === 1);
      check('anfitriones', ['move', 'go_xy', 'say', 'repeat', 'if_cond', 'if_score', 'op_calc', 'score_add']
        .every(id => BYID[id] && BYID[id].repOk === 1));
      check('no_anfitriones', ['when_flag', 'when_score', 'switch_costume', 'set_var', 'create_var', 'op_random']
        .every(id => BYID[id] && !BYID[id].repOk));
      check('reporteros_4_idiomas', REPORTER_BLOCKS.every(def =>
        ['es', 'en', 'pt', 'fr'].every(l =>
          typeof def.n[l] === 'string' && def.n[l].length &&
          typeof def.d[l] === 'string' && def.d[l].length)));
      check('claves_picker', ['es', 'en', 'pt', 'fr'].every(l =>
        ['repPickerTitle', 'repPickerDesc', 'repInsert', 'repRemove']
          .every(k => typeof UI[l][k] === 'string' && UI[l][k].length > 0)));

      /* ============ 2. modelo ============ */
      const made = makeNode('rep_add');
      check('make_reportero', !!made && made.val === '1,1' && !made.body && !made.elseBody);
      check('rechaza_rep_suelto', normalizeNodes([{ type: 'rep_add' }]).length === 0);

      const nested = {
        version: '2.0', sprites: [{
          id: 'a', name: 'A', code: [
            { type: 'when_flag' },
            { type: 'move', val: 10, reps: [{ type: 'rep_add', val: '2,3', reps: [{ type: 'rep_x' }] }] }
          ]
        }]
      };
      check('importa_reps', applyPayload(nested) === true);
      check('reps_anidados',
        sprites[0].code[1].reps[0].type === 'rep_add' &&
        sprites[0].code[1].reps[0].reps[0].type === 'rep_x');
      check('reps_ids_unicos', sprites[0].code[1].id !== sprites[0].code[1].reps[0].id);

      check('sombrero_ignora_reps', applyPayload({
        version: '2.0', sprites: [{ id: 'b', name: 'B', code: [{ type: 'when_flag', reps: [{ type: 'rep_x' }] }] }]
      }) === true && !sprites[0].code[0].reps);

      check('reps_de_mas', applyPayload({
        version: '2.0', sprites: [{
          id: 'c', name: 'C', code: [{
            type: 'go_xy', val: '0,0',
            reps: [{ type: 'rep_x' }, { type: 'rep_y' }, { type: 'rep_score' }]
          }]
        }]
      }) === true && sprites[0].code[0].reps.length === 2);

      const orig = makeNode('move', '1');
      orig.reps = [makeNode('rep_add')];
      const copy = cloneNodeTree(orig);
      check('clone_reps', !!copy.reps && copy.reps[0].type === 'rep_add' &&
        copy.reps[0].id !== orig.reps[0].id);
      check('count_reps', countNodes([orig]) === 2);

      applyPayload(nested);
      const snap = JSON.parse(JSON.stringify(serializeProject()));
      check('serializa_reps', snap.sprites[0].code[1].reps[0].type === 'rep_add');
      check('round_trip_reps', applyPayload(snap) === true &&
        sprites[0].code[1].reps[0].reps[0].type === 'rep_x');
      check('proyecto_viejo_sin_reps', applyPayload([{ id: 'when_flag' }, { id: 'move', val: 20 }]) === true &&
        sprites[0].code[1].val === 20 && !sprites[0].code[1].reps);
      /* «variable {v}» guarda un nombre: no admite un valor adentro. */
      check('repvar_ignora_reps', applyPayload({
        version: '2.0', sprites: [{
          id: 'v', name: 'V', code: [{
            type: 'say', val: '', reps: [{ type: 'rep_var', val: 'vidas', reps: [{ type: 'rep_x' }] }]
          }]
        }]
      }) === true && !sprites[0].code[0].reps[0].reps);

      /* ============ 3. valores ============ */
      applyPayload(payload([{ type: 'when_flag' }, { type: 'move', val: 10 }]));
      const sp = sprites[0];
      sp.x = 40; sp.y = -20; sp.dir = 90;
      score = 12;
      variables.vidas = 7;

      check('nodeval_texto', nodeVal(makeNode('move', '10'), sp) === '10');
      const withRep = makeNode('move', '10');
      withRep.reps = [makeNode('rep_x')];
      check('nodeval_reemplaza', nodeVal(withRep, sp) === '40');
      const gxy = makeNode('go_xy', '10,20');
      gxy.reps = [makeNode('rep_x')];
      check('nodeval_dos_campos', nodeVal(gxy, sp) === '40,20');
      gxy.reps = [null, makeNode('rep_y')];
      check('nodeval_dos_campos_y', nodeVal(gxy, sp) === '10,-20');
      check('nodeval_sin_rep', nodeVal(makeNode('go_xy', '10,20'), sp) === '10,20');

      const er = (type, val, reps) => {
        const n = makeNode(type, val);
        if (reps) n.reps = reps;
        return evalReporter(n, sp, 0);
      };
      check('rep_score', er('rep_score') === 12);
      check('rep_x', er('rep_x') === 40);
      check('rep_y', er('rep_y') === -20);
      check('rep_add', er('rep_add', '2,3') === 5);
      check('rep_sub', er('rep_sub', '2,3') === -1);
      check('rep_mul', er('rep_mul', '2,3') === 6);
      check('rep_div', Math.abs(er('rep_div', '2,3') - 2 / 3) < 1e-9);
      check('rep_div_cero', er('rep_div', '1,0') === 0);
      check('rep_random', er('rep_random', '5,5') === 5);
      check('rep_gt', er('rep_gt', '1,0') === 1 && er('rep_gt', '0,1') === 0);
      check('rep_var', er('rep_var', 'vidas') === 7);
      check('rep_var_score', er('rep_var', 'score') === 12);
      check('rep_var_desconocida', er('rep_var', 'nope') === 0);
      const addNested = makeNode('rep_add');
      addNested.reps = [makeNode('rep_x'), makeNode('rep_y')];
      check('rep_anidado', evalReporter(addNested, sp, 0) === 20);

      /* ============ 4. ejecución ============ */
      const mv = makeNode('move', '0');
      mv.reps = [makeNode('rep_add')];
      mv.reps[0].val = '2,3';
      sp.x = 0; sp.y = 0; sp.dir = 90;
      await execBlock(mv, sp);
      check('exec_move_rep', Math.abs(sp.x - 5) < 1e-6 && Math.abs(sp.y) < 1e-6);

      const go = makeNode('go_xy', '0,0');
      go.reps = [makeNode('rep_add'), makeNode('rep_sub')];
      go.reps[0].val = '10,5';
      go.reps[1].val = '0,20';
      await execBlock(go, sp);
      check('exec_go_xy_rep', sp.x === 15 && sp.y === -20);

      const cond = makeNode('if_cond', '0');
      cond.reps = [makeNode('rep_gt')];
      cond.reps[0].val = '1,0';
      check('cond_rep_true', checkNodeCondition(cond, sp) === true);
      cond.reps[0].val = '0,1';
      check('cond_rep_false', checkNodeCondition(cond, sp) === false);

      const condScore = makeNode('if_score', '0');
      condScore.reps = [makeNode('rep_add')];
      condScore.reps[0].val = '1,5';
      check('if_score_rep', checkNodeCondition(condScore, sp) === true);
      condScore.reps[0].val = '20,0';
      check('if_score_rep_false', checkNodeCondition(condScore, sp) === false);

      variables.n = 0;
      const loop = makeNode('repeat', '0');
      loop.reps = [makeNode('rep_add')];
      loop.reps[0].val = '1,1';
      loop.body = [makeNode('add_var', 'n=1')];
      isRunning = true;
      await execNode(loop, sp, { cancelled: false, lastCond: false });
      isRunning = false;
      check('repeat_rep', variables.n === 2);

      const sayNode = makeNode('say', '');
      sayNode.reps = [makeNode('rep_var')];
      sayNode.reps[0].val = 'vidas';
      await execBlock(sayNode, sp);
      check('say_rep', sayTexts.get(sp.id) === '7');

      /* ============ 5. editor: ƒ, chip y borrado ============ */
      applyPayload(payload([{ type: 'when_flag' }, { type: 'move', val: 15 }]));
      render();
      const code = sprites[0].code;
      const fx = $('#codeList .rep-fx');
      check('fx_visible', !!fx && fx.dataset.repHost === code[1].id && fx.dataset.repSlot === '0');
      check('paleta_sin_fx', !$('#palette .rep-fx'));

      fx.click();
      check('picker_abre', $('#repPicker').hidden === false);
      check('picker_10_opciones', $('#repChoices').children.length === REPORTER_BLOCKS.length);
      check('picker_bloquea_scroll', document.body.classList.contains('modal-open'));
      $('#repChoices [data-rep-pick="rep_add"]').click();
      check('picker_cierra', $('#repPicker').hidden === true &&
        !document.body.classList.contains('modal-open'));
      check('rep_agregado', !!code[1].reps && code[1].reps[0].type === 'rep_add');
      check('chip_visible', !!$('#codeList .rep-chip'));
      check('code_no_crece', code.length === 2);

      const rin = $('#codeList .rep-chip input[data-input]');
      check('chip_con_casillas', !!rin && rin.dataset.input === code[1].reps[0].id);
      rin.value = '4';
      rin.dispatchEvent(new Event('input', { bubbles: true }));
      check('edita_reportero', String(code[1].reps[0].val).split(',')[0] === '4');

      $('#codeList .rep-del').click();
      check('rep_quitado', !code[1].reps);
      check('texto_conservado', $('#codeList input[data-input]').value === '15');

      setReporter(code[1].id, 0, 'rep_score');
      const chipName = $('#codeList .rep-name');
      check('chip_nombre', !!chipName && chipName.textContent === blockPlainName(BYID.rep_score));
      removeReporter(code[1].id, 0);

      setReporter(code[1].id, 0, 'rep_var');
      check('repvar_sin_fx', $('#codeList .rep-chip') !== null &&
        $('#codeList .rep-chip .rep-fx') === null);
      removeReporter(code[1].id, 0);

      openRepPicker(code[1].id, 0);
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      check('picker_escape', $('#repPicker').hidden === true &&
        !document.body.classList.contains('modal-open'));

      const gxy2 = makeNode('go_xy', '0,0');
      gxy2.reps = [makeNode('rep_x')];
      code[1] = gxy2;
      renderCode();
      const yin = $('#codeList input[data-xy="1"]');
      yin.value = '55';
      yin.dispatchEvent(new Event('input', { bubbles: true }));
      check('edita_otra_casilla', gxy2.val === '0,55');

      resetHistory();
      setReporter(gxy2.id, 1, 'rep_y');
      check('rep_en_otra_casilla', !!gxy2.reps[1] && gxy2.reps[1].type === 'rep_y');
      undo();
      check('undo_reportero', !!sprites[0].code[1].reps &&
        sprites[0].code[1].reps.length === 1 &&
        sprites[0].code[1].reps[0].type === 'rep_x');

      const oldLang = lang;
      lang = 'en';
      render();
      openRepPicker(sprites[0].code[1].id, 0);
      check('picker_traduce', $('#repPickerTitle').textContent === UI.en.repPickerTitle &&
        $('#repChoices').children.length === REPORTER_BLOCKS.length);
      closeRepPicker();
      lang = oldLang;
      render();

      check('badge_al_dia', $('#blocksCount').textContent === String(PALETTE_BLOCKS.length));
      check('sin_errores_final', errs.length === 0);
    } catch (err) {
      out.push('ERROR ' + err.message + ' @ ' + (err.stack || '').split('\n')[1]);
    }
    clearTimeout(watchdog);
    done();
  })();
});
