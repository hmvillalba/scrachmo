/* Suite dedicada al bloque «ir a x: y:»: catálogo, dos campos, formato
   "x,y", persistencia, editor y ejecución real. */
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

  (async () => {
    try {
      check('sin_errores_arranque', errs.length === 0);

      /* ============ 1. catálogo, idiomas y contadores ============ */
      const def = BYID.go_xy;
      check('bloque_en_byid', !!def && def.id === 'go_xy');
      check('bloque_activo', !!def && !def.legacy && PALETTE_BLOCKS.indexOf(def) > -1);
      check('bloque_en_movimiento', !!def && def.cat === 'motion' && def.num === 1);
      check('paleta_53', PALETTE_BLOCKS.length === 53);
      check('badge_al_dia', $('#blocksCount').textContent === String(PALETTE_BLOCKS.length));
      check('categoria_motion_6', PALETTE_BLOCKS.filter(b => b.cat === 'motion').length === 6);
      check('textos_4_idiomas', ['es', 'en', 'pt', 'fr'].every(l =>
        typeof def.n[l] === 'string' && def.n[l].length > 0 &&
        typeof def.d[l] === 'string' && def.d[l].length > 0));
      check('dos_huecos_4_idiomas', ['es', 'en', 'pt', 'fr'].every(l =>
        (def.n[l].match(/\{(?:v|x|y)\}/g) || []).length === 2));
      check('huecos_son_x_e_y', ['es', 'en', 'pt', 'fr'].every(l =>
        def.n[l].indexOf('{x}') > -1 && def.n[l].indexOf('{y}') > -1 &&
        def.n[l].indexOf('{v}') === -1));
      check('def_es_par', def.def === '0,0');

      /* ============ 2. paleta ============ */
      searchTerm = '';
      currentFilter = 'all';
      renderPalette(UI[lang]);
      const pblock = $('[data-add="go_xy"]');
      check('paleta_tiene_bloque', !!pblock);
      const pvals = pblock ? Array.from(pblock.querySelectorAll('.sb-value')) : [];
      check('preview_dos_valores', pvals.length === 2);
      check('preview_valores_cero', pvals.length === 2 &&
        pvals[0].textContent === '0' && pvals[1].textContent === '0');
      const plain = blockPlainName(def);
      check('nombre_plano_sin_huecos', plain.indexOf('{') === -1 && plain.indexOf('0') > -1);
      check('aria_paleta_sin_huecos', !!pblock &&
        pblock.getAttribute('aria-label').indexOf(plain) === 0 &&
        pblock.getAttribute('aria-label').indexOf('{') === -1);
      check('nombre_plano_bloque_simple', (() => {
        const m = blockPlainName(BYID.move);
        return m.indexOf('{') === -1 && m.indexOf(String(BYID.move.def)) > -1;
      })());
      searchTerm = (def.n[lang] || def.n.es).split('{')[0].trim();
      renderPalette(UI[lang]);
      check('buscador_encuentra_bloque', !!$('[data-add="go_xy"]'));
      searchTerm = '';
      renderPalette(UI[lang]);

      /* Tap real en la paleta: el guardián anti-arrastre se neutraliza. */
      sprites = [createSpriteData('🐱', 'XY', [])];
      selectedSpriteId = sprites[0].id;
      runtimeSnapshot = null;
      render();
      resetHistory();
      lastPaletteDragAt = -100000;
      $('[data-add="go_xy"]').click();
      check('tap_agrega_bloque', sprites[0].code.length === 1 &&
        sprites[0].code[0].type === 'go_xy');
      check('tap_val_por_defecto', !!sprites[0].code[0] && sprites[0].code[0].val === '0,0');

      /* ============ 3. editor de dos campos ============ */
      const node = sprites[0].code[0];
      const head = $('#codeList .stack-item[data-id="' + node.id + '"] .sb-content');
      const inputs = head ? Array.from(head.querySelectorAll('input[data-xy]')) : [];
      check('dos_inputs_en_bloque', inputs.length === 2);
      check('valores_iniciales', inputs.length === 2 &&
        inputs[0].value === '0' && inputs[1].value === '0');
      check('orden_data_xy', inputs.length === 2 &&
        inputs.map(i => i.dataset.xy).join(',') === '0,1');
      check('inputmode_decimal', inputs.length === 2 &&
        inputs.every(i => i.getAttribute('inputmode') === 'decimal'));
      check('aria_labels_distintos', inputs.length === 2 &&
        inputs[0].getAttribute('aria-label') !== inputs[1].getAttribute('aria-label') &&
        /x$/.test(inputs[0].getAttribute('aria-label')) &&
        /y$/.test(inputs[1].getAttribute('aria-label')));
      check('texto_etiqueta_visible', (() => {
        if (!head) return false;
        const texts = Array.from(head.childNodes)
          .filter(n => n.nodeType === 3).map(n => n.textContent);
        return texts.length === 2 && texts[0].indexOf('x') > -1 && texts[1].indexOf('y') > -1;
      })());
      check('sin_overflow_horizontal', document.documentElement.scrollWidth <= window.innerWidth + 1);

      inputs[0].value = '120';
      inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
      check('editar_x', node.val === '120,0');
      inputs[1].value = '-75';
      inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
      check('editar_y_conserva_x', node.val === '120,-75');
      inputs[1].dispatchEvent(new Event('change', { bubbles: true }));
      check('change_guarda_par', (store.get('scrachmo_v8') || '').indexOf('120,-75') > -1);
      check('val_sigue_escalar', typeof node.val === 'string');
      render();
      const head2 = $('#codeList .stack-item[data-id="' + node.id + '"] .sb-content');
      const inputs2 = head2 ? Array.from(head2.querySelectorAll('input[data-xy]')) : [];
      check('render_conserva_valores', inputs2.length === 2 &&
        inputs2[0].value === '120' && inputs2[1].value === '-75');

      check('serializa_par', serializeProject().sprites[0].code[0].val === '120,-75');
      check('applyPayload_conserva_par', applyPayload(serializeProject()) === true &&
        sprites[0].code[0].val === '120,-75');
      check('normalize_conserva_par',
        normalizeNodes([{ type: 'go_xy', val: '5,9' }])[0].val === '5,9');
      check('normalize_sin_val',
        normalizeNodes([{ type: 'go_xy' }])[0].val === '0,0');
      const corto = normalizeNodes([{ type: 'go_xy', val: '33' }])[0];
      check('normalize_val_corto', corto.val === '33');
      check('blockValues_val_corto', blockValues(corto, def, 2).join('|') === '33|0');
      const copia = cloneNodeTree(corto);
      check('clone_conserva_par', copia.val === corto.val);
      check('clone_id_distinto', copia.id !== corto.id);

      render();
      const vivo = sprites[0].code[0];
      resetHistory();
      duplicateNode(vivo.id);
      check('duplicar_conserva_par', sprites[0].code.length === 2 &&
        sprites[0].code.every(n => n.type === 'go_xy' && n.val === '120,-75'));
      check('duplicar_ids_distintos', sprites[0].code[0].id !== sprites[0].code[1].id);
      undo();
      check('undo_restaura_uno', sprites[0].code.length === 1 &&
        sprites[0].code[0].val === '120,-75');
      redo();
      check('redo_vuelve_a_dos', sprites[0].code.length === 2 &&
        sprites[0].code[1].val === '120,-75');

      /* ============ 4. ejecución y límites del escenario ============ */
      sprites = [createSpriteData('🐱', 'Uno', []), createSpriteData('🚀', 'Dos', [])];
      selectedSpriteId = sprites[0].id;
      runtimeSnapshot = null;
      sprites[0].x = 0; sprites[0].y = 0;
      sprites[1].x = 0; sprites[1].y = 0;
      render();
      const s0 = sprites[0], s1 = sprites[1];
      await execBlock(makeNode('go_xy', '120,-75'), s0);
      check('exec_coordenada_exacta', s0.x === 120 && s0.y === -75);
      check('exec_posLeft', Math.abs(posLeft(s0) - 75) < 0.001);
      check('exec_dom_left', (() => {
        const el = findSpriteEl(s0.id);
        return !!el && Math.abs(parseFloat(el.style.left) - 75) < 0.01;
      })());
      check('no_mueve_otro_sprite', s1.x === 0 && s1.y === 0);
      await execBlock(makeNode('go_xy', '12.5,-30.25'), s0);
      check('exec_decimales', s0.x === 12.5 && s0.y === -30.25);
      /* El límite ya no es el borde pelado: se deja el radio del DIBUJO para
         que el personaje no salga cortado por `overflow:hidden`. Se deriva de
         edgeRadius() porque depende del tamaño real de la caja. */
      await execBlock(makeNode('go_xy', '9999,0'), s0);
      check('clamp_x_pos', Math.abs(s0.x - (worldRight() - edgeRadius(s0))) < 0.001);
      await execBlock(makeNode('go_xy', '-9999,0'), s0);
      check('clamp_x_neg', Math.abs(s0.x - (worldLeft() + edgeRadius(s0))) < 0.001);
      await execBlock(makeNode('go_xy', '0,9999'), s0);
      check('clamp_y_pos', Math.abs(s0.y - (worldTop() - edgeRadius(s0))) < 0.001);
      await execBlock(makeNode('go_xy', '0,-9999'), s0);
      check('clamp_y_neg', Math.abs(s0.y - (worldBottom() + edgeRadius(s0))) < 0.001);
      check('limites_de_casillas_iguales_al_motor',
        Math.abs(Number($('#propX').max) - Math.round(worldRight() - edgeRadius(s0))) < 1 &&
        Math.abs(Number($('#propY').min) - Math.round(worldBottom() + edgeRadius(s0))) < 1);
      await execBlock(makeNode('go_xy', '45,'), s0);
      check('campo_vacio_y', s0.x === 45 && s0.y === 0);
      await execBlock(makeNode('go_xy', ',60'), s0);
      check('campo_vacio_x', s0.x === 0 && s0.y === 60);
      await execBlock(makeNode('go_xy', 'hola,mundo'), s0);
      check('texto_invalido', s0.x === 0 && s0.y === 0);
      await execBlock(makeNode('go_xy', 7), s0);
      check('valor_numerico_legacy', s0.x === 7 && s0.y === 0);
      const dir0 = s0.dir, size0 = s0.size;
      await execBlock(makeNode('go_xy', '30,40'), s0);
      check('no_cambia_dir', s0.dir === dir0);
      check('no_cambia_size', s0.size === size0);

      /* ============ 5. guion real de principio a fin ============ */
      sprites = [createSpriteData('🐱', 'Guion',
        [makeNode('when_flag'), makeNode('go_xy', '90,-40')])];
      selectedSpriteId = sprites[0].id;
      runtimeSnapshot = null;
      render();
      fireEvent('when_flag');
      await sleep(500);
      check('guion_real_posicion', sprites[0].x === 90 && sprites[0].y === -40);
      check('guion_real_termina', runActive === false && runThreads.size === 0);
      check('guion_real_guarda_estado', (() => {
        const p = JSON.parse(store.get('scrachmo_v8') || 'null');
        return !!p && p.sprites[0].x === 90 && p.sprites[0].y === -40;
      })());
      resetToStart();
      check('guion_real_reset', sprites[0].x === 0 && sprites[0].y === 0);
      check('sin_errores_final', errs.length === 0);
    } catch (err) {
      out.push('ERROR ' + err.message + ' @ ' + (err.stack || '').split('\n')[1]);
    }
    clearTimeout(watchdog);
    done();
  })();
});
