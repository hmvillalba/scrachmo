window.addEventListener('load', function () {
  const out = [];
  const check = (name, cond) => out.push((cond ? 'PASS ' : 'FAIL ') + name);
  try {
    check('catalogo_grupos', SPRITE_GROUPS.length >= 8);
    check('catalogo_items', SPRITE_CHOICES.length >= 100);
    check('paleta_51', PALETTE_BLOCKS.length === 51);
    check('badge_al_dia', document.getElementById('blocksCount').textContent === String(PALETTE_BLOCKS.length));
    check('modal_grupos', document.querySelectorAll('#spriteChoices .sprite-group').length === SPRITE_GROUPS.length);
    check('modal_items', document.querySelectorAll('#spriteChoices .sprite-choice').length >= 100);
    spriteSearchTerm = 'cohete';
    renderSpriteChoices();
    check('busqueda_filtra', document.querySelectorAll('#spriteChoices .sprite-choice').length === 1);
    spriteSearchTerm = '';
    renderSpriteChoices();

    const mk = (type, val) => makeNode(type, val);
    sprites = [
      createSpriteData('🐱', 'A', [
        mk('when_flag'), mk('move', 10),
        mk('when_key', 'a'), mk('say', 'tecla'),
        mk('when_tap'), mk('hide')
      ]),
      createSpriteData('🚀', 'B', [mk('when_flag'), mk('turn', 15)])
    ];
    selectedSpriteId = sprites[0].id;
    check('guiones_flag', scriptsFor('when_flag').length === 2);
    check('guiones_tecla', scriptsFor('when_key').length === 1);
    check('guion_toque', scriptsFor('when_tap').length === 1);
    check('flag_aislado', scriptsFor('when_flag').every(sc => sc.nodes.every(n => n.type !== 'say' && n.type !== 'hide')));
    check('tecla_a', scriptsFor('when_key', sc => normKeyName(sc.hat.val) === 'a').length === 1);
    check('tecla_b', scriptsFor('when_key', sc => normKeyName(sc.hat.val) === 'b').length === 0);
    check('norm_espacio', normKeyName('espacio') === ' ');

    score = 7; multiOn = true;
    const payload = serializeProject();
    check('persiste_score', payload.score === 7);
    check('persiste_multi', payload.multiOn === true);
    score = 0; multiOn = false;
    check('applyPayload', applyPayload(payload) === true);
    check('restaura_score', score === 7);
    check('restaura_multi', multiOn === true);

    sprites[0].x = 100;
    const snap = snapshotRuntime();
    sprites[0].x = -50;
    restoreRuntime(snap);
    check('snapshot_restaura', sprites[0].x === 100);

    const probe = document.createElement('div');
    probe.className = 'sb running';
    probe.style.setProperty('--c', '#4C97FF');
    document.body.appendChild(probe);
    const cs = getComputedStyle(probe);
    check('css_running', cs.boxShadow !== 'none' && cs.boxShadow.indexOf('rgb') > -1);
    check('css_notch', getComputedStyle(probe, '::before').content !== 'none');
    probe.remove();

    sprites[0].code.push(mk('when_shake'));
    check('usa_movimiento', projectUsesMotion() === true);
    sprites[0].code.pop();

    fireEvent('when_flag');
    check('hilos_por_guion', runThreads.size === 2);
    check('run_activo', runActive === true);
    check('resaltado_activo', document.querySelectorAll('#codeList .sb.running').length >= 0);
    stopCode();
    check('stop_baja_estado', runActive === false && isRunning === false);
    /* Comportamiento nuevo: el sprite se queda donde llegó; el usuario
       decide con el botón «Volver al inicio». */
    check('stop_conserva_x', sprites[0].x === 110);
    check('boton_volver_visible', document.getElementById('resetStartBtn').hidden === false);
    resetToStart();
    check('volver_al_inicio', sprites[0].x === 100 &&
      document.getElementById('resetStartBtn').hidden === true);
  } catch (err) {
    out.push('ERROR ' + err.message + ' @ ' + (err.stack || '').split('\n')[1]);
  }
  const pre = document.createElement('pre');
  pre.id = 'TESTRESULT';
  pre.textContent = 'BEGIN\n' + out.join('\n') + '\nEND';
  document.body.appendChild(pre);
});
