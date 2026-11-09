window.addEventListener('load', function () {
  const out = [];
  const check = (name, cond) => out.push((cond ? 'PASS ' : 'FAIL ') + name);
  const errs = window.__ERRORS__ || [];
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const done = () => {
    const pre = document.createElement('pre');
    pre.id = 'TESTRESULT';
    pre.textContent = 'BEGIN\n' + out.join('\n') + '\nEND';
    document.body.appendChild(pre);
  };

  (async () => {
    try {
      /* =================== estructura, textos y DOM =================== */
      check('sin_errores_arranque', errs.length === 0);
      const extraKeys = Object.keys(UI_EXTRA.es);
      check('paridad_ui_extra', ['es', 'en', 'pt', 'fr'].every(l =>
        extraKeys.every(k => typeof UI_EXTRA[l][k] === 'string' && UI_EXTRA[l][k].length > 0)));
      const nuevas = ['zoomOut', 'zoomIn', 'zoomReset', 'undo', 'redo', 'undoNone',
        'duplicated', 'duplicateBlock', 'blockDropped', 'paletteHint',
        'bgCustom', 'bgClear', 'bgAdded', 'bgRemoved', 'bgBadType', 'bgTooBig'];
      check('textos_nuevos_4_idiomas', ['es', 'en', 'pt', 'fr'].every(l =>
        nuevas.every(k => typeof UI[l][k] === 'string' && UI[l][k].length > 0)));
      const ids = ['zoomOutBtn', 'zoomInBtn', 'zoomVal', 'undoBtn', 'redoBtn', 'bgCustomBtn', 'bgClearBtn'];
      check('dom_herramientas', ids.every(id => !!document.getElementById(id)));
      check('boton_quitar_oculto_inicial', $('#bgClearBtn').hidden === true &&
        getComputedStyle($('#bgClearBtn')).display === 'none');
      check('herramientas_dentro_del_card', (() => {
        const a = $('.code-tools').getBoundingClientRect();
        const b = $('#codeBody').getBoundingClientRect();
        return a.left >= b.left - 1 && a.right <= b.right + 1;
      })());
      check('sin_overflow_horizontal', document.documentElement.scrollWidth <= window.innerWidth + 1);
      let ttOk = $$('[data-tt]').length >= 7;
      $$('[data-tt]').forEach(el => {
        const v = UI[lang][el.dataset.tt];
        if (v == null || el.title !== v || el.getAttribute('aria-label') !== v) ttOk = false;
      });
      check('data_tt_resueltos', ttOk);
      let tOk = true;
      $$('[data-t]').forEach(el => { if (UI[lang][el.dataset.t] == null) tOk = false; });
      check('data_t_resueltos', tOk);
      check('ayuda_arrastre_en_bloques', !!$('#blocksCard .palette-hint') && !$('#blockHint .palette-hint'));
      check('grip_en_paleta', $$('.p-block').length > 0 && $$('.p-block .p-grip').length === $$('.p-block').length);
      check('grip_no_en_codigo', $$('#codeList .p-grip').length === 0);
      check('iconos_nuevos', ['i-copy', 'i-rotate-ccw', 'i-rotate', 'i-minus', 'i-plus', 'i-upload', 'i-close']
        .every(id => !!document.getElementById(id)));

      /* =================== zoom =================== */
      check('zoom_inicial', codeZoom === 1 && $('#zoomVal').textContent === '100%');
      $('#zoomInBtn').click();
      check('zoom_mas', codeZoom === 1.1 && $('#zoomVal').textContent === '110%' && $('#codeList').style.zoom === '1.1');
      $('#zoomOutBtn').click();
      check('zoom_menos', codeZoom === 1 && $('#zoomVal').textContent === '100%');
      for (let i = 0; i < 20; i++) changeZoom(ZOOM_STEP);
      check('zoom_tope', codeZoom === ZOOM_MAX && $('#zoomInBtn').disabled === true);
      for (let i = 0; i < 20; i++) changeZoom(-ZOOM_STEP);
      check('zoom_piso', codeZoom === ZOOM_MIN && $('#zoomOutBtn').disabled === true);
      $('#zoomVal').click();
      check('zoom_reset', codeZoom === 1 && $('#zoomVal').textContent === '100%');
      changeZoom(ZOOM_STEP);
      check('zoom_guardado', JSON.parse(store.get('scrachmo_ui')).codeZoom === 1.1);
      store.set('scrachmo_ui', JSON.stringify({ blocksCard: true, palette: false }));
      loadProject();
      check('zoom_ui_vieja', codeZoom === 1 && collapsed.blocksCard === true);
      store.set('scrachmo_ui', JSON.stringify({ collapsed: {}, codeZoom: 1.3 }));
      loadProject();
      check('zoom_restaura', codeZoom === 1.3);
      store.set('scrachmo_ui', JSON.stringify({ collapsed: {}, codeZoom: 99 }));
      loadProject();
      check('zoom_clamp', codeZoom === ZOOM_MAX);
      resetZoom();
      applyCodeZoom();

      /* =================== deshacer / rehacer =================== */
      resetHistory();
      const baseLen = sprites[0].code.length;
      check('historial_base', undoStack.length === 1 && redoStack.length === 0 && $('#undoBtn').disabled === true);
      addBlock('move');
      check('historial_tras_agregar', undoStack.length === 2 && $('#undoBtn').disabled === false && sprites[0].code.length === baseLen + 1);
      undo();
      check('undo_restaura', sprites[0].code.length === baseLen && redoStack.length === 1 && $('#redoBtn').disabled === false);
      const hLen = undoStack.length;
      redo();
      check('redo_reaplica', sprites[0].code.length === baseLen + 1 && redoStack.length === 0);
      check('restore_no_contamina', undoStack.length === hLen + 1);
      addBlock('turn'); addBlock('say'); addBlock('move');
      const n3 = sprites[0].code.length;
      undo(); undo();
      check('undo_multiple', sprites[0].code.length === n3 - 2 && redoStack.length === 2);
      redo(); redo();
      check('redo_multiple', sprites[0].code.length === n3 && redoStack.length === 0);
      addBlock('size');
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true, cancelable: true }));
      check('atajo_ctrl_z', sprites[0].code.length === n3);
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, shiftKey: true, bubbles: true, cancelable: true }));
      check('atajo_ctrl_shift_z', sprites[0].code.length === n3 + 1);
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'y', ctrlKey: true, bubbles: true, cancelable: true }));
      check('atajo_ctrl_y_sin_redo', sprites[0].code.length === n3 + 1);
      const nInput = sprites[0].code.length;
      $('#searchBlocks').dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true, cancelable: true }));
      check('atajo_ignora_input', sprites[0].code.length === nInput);
      resetHistory();
      undo();
      check('undo_vacio_aviso', $('#undoBtn').disabled === true);

      /* =================== duplicar =================== */
      const rep = makeNode('repeat');
      rep.body = [makeNode('move')];
      rep.val = '7';
      sprites[0].code.push(rep);
      renderCode(); saveProject();
      check('boton_dup_en_dom', $$('#codeList .sb-dup').length === $$('#codeList .stack-item').length);
      const beforeDup = sprites[0].code.length;
      duplicateNode(rep.id);
      const copy = sprites[0].code[beforeDup];
      check('duplicar_subarbol', !!copy && copy.type === 'repeat' && copy.val === '7' &&
        copy.body.length === 1 && copy.body[0].type === 'move');
      check('duplicar_ids_nuevos', !!copy && copy.id !== rep.id && copy.body[0].id !== rep.body[0].id);
      const allIds = [];
      const walk = n => { allIds.push(n.id); (n.body || []).forEach(walk); (n.elseBody || []).forEach(walk); };
      sprites[0].code.forEach(walk);
      check('ids_unicos_tras_duplicar', new Set(allIds).size === allIds.length);
      const beforeClick = sprites[0].code.length;
      const dupBtn = $('#codeList .sb-dup');
      dupBtn.click();
      check('click_boton_dup', sprites[0].code.length === beforeClick + 1);
      undo();
      check('undo_desduplica', sprites[0].code.length === beforeClick);
      redo();

      /* =================== arrastrar desde la paleta =================== */
      renderPalette(UI[lang]);
      const item = $$('#palette .p-block')[0];
      const dragType = item.dataset.add;
      const anchor = $$('#codeList > .stack-item')[0] || $('#codeList');
      anchor.scrollIntoView({ block: 'center', behavior: 'instant' });
      const ar = anchor.getBoundingClientRect();
      const px = Math.max(1, Math.min(window.innerWidth - 2, ar.left + 24));
      const py = Math.max(1, Math.min(window.innerHeight - 2, ar.top + 10));
      const hit = document.elementFromPoint(px, py);
      check('hit_zona_codigo', !!hit && !!hit.closest('#codeList'));
      const ir = item.getBoundingClientRect();
      const sx = ir.left + 10, sy = ir.top + 10;
      const beforeDrag = sprites[0].code.length;
      item.querySelector('.p-grip').dispatchEvent(new PointerEvent('pointerdown', {
        pointerId: 7, pointerType: 'touch', clientX: sx, clientY: sy, bubbles: true, cancelable: true
      }));
      check('drag_inicia_en_grip', !!paletteDrag);
      window.dispatchEvent(new PointerEvent('pointermove', {
        pointerId: 7, pointerType: 'touch', clientX: px, clientY: py, bubbles: true, cancelable: true
      }));
      check('drag_mueve_y_calcula', !!paletteDrag && paletteDrag.moved === true && !!paletteDrag.target && !!paletteDrag.ghost);
      window.dispatchEvent(new PointerEvent('pointerup', {
        pointerId: 7, pointerType: 'touch', clientX: px, clientY: py, bubbles: true, cancelable: true
      }));
      check('drag_inserta_bloque', paletteDrag === null && sprites[0].code.length === beforeDrag + 1);
      check('drag_tipo_correcto', sprites[0].code.some(n => n.type === dragType));
      check('drag_limpia_ghost', $$('.drag-ghost').length === 0 && $$('.drop-line').length === 0);
      item.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      check('click_tras_drag_suprimido', sprites[0].code.length === beforeDrag + 1);
      lastPaletteDragAt = 0;
      item.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      check('tap_agrega_al_final', sprites[0].code.length === beforeDrag + 2 &&
        sprites[0].code[sprites[0].code.length - 1].type === dragType);
      const beforeRoot = sprites[0].code.length;
      insertNewBlock('move', { container: $('#codeList'), index: 1, children: [] });
      check('inserta_en_raiz', sprites[0].code.length === beforeRoot + 1 && sprites[0].code[1].type === 'move');
      const slot = $('#codeList .c-slot');
      if (slot) {
        const owner = findNode(slot.dataset.owner).node;
        const beforeSlot = owner.body.length;
        insertNewBlock('turn', { container: slot, index: 0, children: [] });
        check('inserta_en_slot', owner.body.length === beforeSlot + 1);
        insertNewBlock('when_flag', { container: slot, index: 0, children: [] });
        check('sombrero_no_en_slot', owner.body.length === beforeSlot + 1);
      } else {
        check('inserta_en_slot', false);
        check('sombrero_no_en_slot', false);
      }
      check('escape_cancela_drag', (() => {
        const it2 = $$('#palette .p-block')[0];
        it2.dispatchEvent(new PointerEvent('pointerdown', {
          pointerId: 9, pointerType: 'mouse', clientX: 5, clientY: 5, bubbles: true, cancelable: true
        }));
        const started = !!paletteDrag;
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
        return started && paletteDrag === null;
      })());

      /* =================== fondo propio =================== */
      const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==';
      check('valida_png', validBackdrop(PNG) === PNG);
      check('rechaza_svg', validBackdrop('data:image/svg+xml;base64,PHN2Zz4=') === '');
      check('rechaza_url', validBackdrop('https://x.com/a.png') === '');
      check('rechaza_js', validBackdrop('javascript:alert(1)') === '');
      check('rechaza_largo', validBackdrop('data:image/png;base64,' + 'A'.repeat(900001)) === '');
      check('rechaza_no_string', validBackdrop(null) === '' && validBackdrop(42) === '');
      const pl = serializeProject();
      pl.stageBgImg = PNG;
      pl.stageBg = 3;
      check('apply_payload_fondo', applyPayload(pl) === true && stageBgImg === PNG && stageBg === 3);
      render();
      check('css_fondo', $('#stage').style.background.indexOf('url(') === 0 &&
        $('#stage').style.background.indexOf('center / cover') > -1);
      check('boton_quitar_visible', $('#bgClearBtn').hidden === false);
      check('serializa_fondo', serializeProject().stageBgImg === PNG);
      const shareCode = await encodeSharePayload(serializeProject());
      const shareBack = await decodeShareAsync(shareCode);
      check('fondo_en_link', !!shareBack && shareBack.stageBgImg === PNG);
      check('link_sigue_gzip', shareCode.slice(0, 3) === 'g1.');
      $('#bgClearBtn').click();
      check('quitar_fondo', stageBgImg === '' && $('#bgClearBtn').hidden === true &&
        getComputedStyle($('#bgClearBtn')).display === 'none' &&
        $('#stage').style.background.indexOf('url(') !== 0);
      const pl2 = serializeProject();
      pl2.stageBgImg = PNG; pl2.stageBg = 3;
      applyPayload(pl2); render();
      changeBg();
      check('change_bg_sale_de_fondo', stageBgImg === '' && stageBg === 1);
      stageBgImg = PNG; stageBg = 2;
      const snap = snapshotRuntime();
      stageBgImg = ''; stageBg = 5;
      restoreRuntime(snap);
      check('snapshot_restore_fondo', stageBgImg === PNG && stageBg === 2);
      stageBgImg = '';
      applyStageBg();

      /* --- importación real de un archivo de fondo --- */
      const cv2 = document.createElement('canvas');
      cv2.width = 8; cv2.height = 8;
      const g2 = cv2.getContext('2d');
      g2.fillStyle = '#123456'; g2.fillRect(0, 0, 8, 8);
      const bin = atob(cv2.toDataURL('image/png').split(',')[1]);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const file = new File([bytes], 'fondo.png', { type: 'image/png' });
      check('fondo_tipo_ok', isAllowedImage(file) === true);
      const badFile = new File([bytes], 'x.svg', { type: 'image/svg+xml' });
      await importBackdropFile(badFile);
      check('fondo_rechaza_svg', stageBgImg === '' && isAllowedImage(badFile) === false);
      let imported = false;
      try { await importBackdropFile(file); imported = (stageBgImg !== '' && validBackdrop(stageBgImg) === stageBgImg); } catch (e) { }
      check('fondo_importa_real', imported);
      check('fondo_importado_en_css', $('#stage').style.background.indexOf('url(') === 0);
      clearBackdrop();
      check('fondo_limpio_tras_importar', stageBgImg === '');

      check('sin_errores_final', errs.length === 0);
    } catch (err) {
      out.push('ERROR ' + err.message + ' @ ' + (err.stack || '').split('\n')[1]);
    }
    done();
  })();
});
