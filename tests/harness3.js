window.addEventListener('load', function () {
  const out = [];
  const check = (name, cond) => out.push((cond ? 'PASS ' : 'FAIL ') + name);
  const errs = window.__ERRORS__ || [];
  const done = () => {
    const pre = document.createElement('pre');
    pre.id = 'TESTRESULT';
    pre.textContent = 'BEGIN\n' + out.join('\n') + '\nEND';
    document.body.appendChild(pre);
  };

  (async () => {
    try {
      check('sin_errores_arranque', errs.length === 0);
      check('paleta_51', PALETTE_BLOCKS.length === 51);
      check('badge_al_dia', document.getElementById('blocksCount').textContent === String(PALETTE_BLOCKS.length));
      check('bloques_nuevos', !!BYID.next_costume && !!BYID.switch_costume && BYID.switch_costume.costume === 1);
      check('textos_4_idiomas', ['es', 'en', 'pt', 'fr'].every(k =>
        UI[k].costumesTitle && UI[k].costumeAdd && UI[k].shareTooLong && UI[k].importSprite && UI[k].costumeBadType));
      check('ui_disfraces_en_dom', !!document.getElementById('costumeStrip') && !!document.getElementById('importSpriteBtn'));
      check('shareDesc_actualizado', UI.es.shareDesc.indexOf('disfraces') > -1);

      /* Imagen real y pequeña generada con canvas. */
      const cv = document.createElement('canvas');
      cv.width = 2; cv.height = 2;
      cv.getContext('2d').fillRect(0, 0, 2, 2);
      const IMG = cv.toDataURL('image/png');

      /* --- migración de proyectos viejos --- */
      const migrated = normalizeSprites([{ id: 's1', emoji: '🐶', code: [] }]);
      check('migra_emoji', migrated[0].costumes.length === 1 && migrated[0].costumes[0].kind === 'emoji' && migrated[0].emoji === '🐶' && migrated[0].img === '');
      check('migra_indice', migrated[0].costumeIndex === 0);

      /* --- seguridad de los datos que llegan por link --- */
      const bad = normalizeCostumes([
        { kind: 'img', src: 'data:image/svg+xml;base64,PHN2Zz4=' },
        { kind: 'img', src: 'https://example.com/x.png' },
        { kind: 'img', src: 'javascript:alert(1)' },
        { kind: 'img', src: IMG }
      ], '🐱');
      check('rechaza_svg_guardado_y_urls', bad.length === 1 && bad[0].src === IMG);
      /* El SVG sí entra por el selector, pero se rasteriza al importarlo: en
         los datos guardados nunca puede aparecer un data:image/svg+xml. */
      check('isAllowedImage_svg_si', isAllowedImage({ name: 'x.svg', type: 'image/svg+xml' }) === true);
      check('isAllowedImage_svgz_no', isAllowedImage({ name: 'x.svgz', type: 'image/svg+xml' }) === false);
      check('isAllowedImage_png_si', isAllowedImage({ name: 'x.png', type: 'image/png' }) === true);

      /* --- proyecto con 3 disfraces --- */
      const N = (type, val) => makeNode(type, val);
      const s = createSpriteData('🐱', 'Gato', [N('when_flag'), N('move', 10), N('next_costume'), N('switch_costume', 2)]);
      s.costumes = [
        makeCostume('emoji', '🐱', 'Gato'),
        makeCostume('img', IMG, 'Foto'),
        makeCostume('emoji', '🚀', 'Cohete')
      ];
      s.costumeIndex = 0;
      syncCostume(s);
      sprites = [s];
      selectedSpriteId = s.id;
      render();

      check('tira_3_miniaturas', document.querySelectorAll('#costumeStrip .costume-thumb').length === 3);
      check('tira_boton_agregar', !!document.querySelector('#costumeStrip [data-add-costume]'));
      check('contador', document.getElementById('costumeCount').textContent === '3/12');
      check('imagen_en_miniatura', !!document.querySelector('#costumeStrip img.costume-img'));
      check('select_en_bloque', document.querySelectorAll('#codeList select.sb-select').length === 1);
      check('select_3_opciones', document.querySelector('#codeList select.sb-select').options.length === 3);
      check('preview_paleta_nombre', (() => {
        const all = Array.from(document.querySelectorAll('#palette .sb-value')).map(e => e.textContent);
        return all.indexOf('Gato') > -1;
      })());

      check('find_por_nombre', findCostumeIndex(s, 'Foto') === 1);
      check('find_por_indice', findCostumeIndex(s, '3') === 2);

      /* --- selección desde la UI --- */
      document.querySelector('#costumeStrip [data-costume="1"]').click();
      check('click_cambia_disfraz', s.costumeIndex === 1 && s.img === IMG && s.emoji === '');
      check('imagen_en_escenario', !!document.querySelector('#spritesLayer .sprite-emoji img.costume-img'));
      check('imagen_en_bandeja', !!document.querySelector('#spriteTray .tile-emoji img.costume-img'));
      check('avatar_imagen', !!document.querySelector('#propAvatar img.costume-img'));

      const sel = document.querySelector('#codeList select.sb-select');
      sel.value = 'Cohete';
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      check('select_guarda_nombre', s.code.find(n => n.type === 'switch_costume').val === 'Cohete');
      check('opciones_valen_nombres', Array.from(sel.options).every(o => /\D/.test(o.value)));

      /* --- serialización y round-trip --- */
      const payload = serializeProject();
      check('serializa_costumes', payload.sprites[0].costumes.length === 3 && payload.sprites[0].costumeIndex === 1);
      check('aplica_payload', applyPayload(payload) === true);
      const s2 = sprites[0];
      check('restaura_costumes', s2.costumes.length === 3 && s2.costumeIndex === 1 && s2.img === IMG);
      check('restaura_imagen_valida', IMG_DATA_RE.test(s2.costumes[1].src));
      render();

      /* --- el disfraz forma parte del estado de diseño --- */
      const snap = snapshotRuntime();
      setCostume(s2, 2);
      check('set_costume_avanza', s2.costumeIndex === 2 && s2.emoji === '🚀');
      restoreRuntime(snap);
      check('restore_vuelve_disfraz', s2.costumeIndex === 1 && s2.img === IMG);

      /* --- ejecución de los dos bloques nuevos --- */
      setCostume(s2, 0);
      await execBlock(makeNode('next_costume'), s2);
      check('bloque_siguiente', s2.costumeIndex === 1);
      await execBlock(makeNode('switch_costume', 'Cohete'), s2);
      check('bloque_cambiar_por_nombre', s2.costumeIndex === 2);
      await execBlock(makeNode('switch_costume', 1), s2);
      check('bloque_cambiar_por_indice', s2.costumeIndex === 0);

      beginRun();
      setCostume(s2, 2);
      stopCode();
      /* Comportamiento nuevo: el estado final queda y pasa a ser diseño.
         Sólo «Volver al inicio» restaura la instantánea del arranque. */
      check('stop_conserva_disfraz', s2.costumeIndex === 2 && s2.emoji === '🚀');
      const guardadoFinal = JSON.parse(localStorage.getItem('scrachmo_v8'));
      check('stop_guarda_estado_final', !!guardadoFinal && guardadoFinal.sprites[0].costumeIndex === 2);
      resetToStart();
      check('reset_vuelve_disfraz', s2.costumeIndex === 0 && s2.emoji === '🐱');
      check('reset_guarda_diseno', serializeProject().sprites[0].costumeIndex === 0);

      /* --- links comprimidos y compatibilidad --- */
      const sharePayload = serializeProject();
      const code = await encodeSharePayload(sharePayload);
      check('link_prefijo_gzip', code.slice(0, 3) === 'g1.');
      const back = await decodeShareAsync(code);
      check('link_roundtrip', !!back && back.sprites[0].costumes.length === 3 && back.sprites[0].costumes[1].src === IMG);

      const fat = JSON.parse(JSON.stringify(sharePayload));
      fat.sprites[0].code = [];
      for (let i = 0; i < 40; i++) fat.sprites[0].code.push({ id: 'b' + i, type: 'say', val: 'Hola Hola Hola Hola Hola Hola Hola Hola' });
      const gz = await encodeSharePayload(fat);
      const pl = 'j1.' + bytesToB64Url(new TextEncoder().encode(JSON.stringify(fat)));
      check('gzip_reduce_link', gz.length < pl.length);

      const plain = 'j1.' + bytesToB64Url(new TextEncoder().encode(JSON.stringify(sharePayload)));
      const plainBack = await decodeShareAsync(plain);
      check('link_sin_comprimir', !!plainBack && plainBack.sprites[0].costumes.length === 3);

      const oldCode = btoa(unescape(encodeURIComponent(JSON.stringify(sharePayload))));
      const oldBack = await decodeShareAsync(oldCode);
      check('link_viejo_compatible', !!oldBack && oldBack.sprites.length === 1 && decodeShare(oldCode) !== null);

      sharePayload.score = 123;
      const code2 = await encodeSharePayload(sharePayload);
      score = 0;
      await hydrateShared(code2);
      check('hydrate_aplica_proyecto', score === 123 && sprites[0].costumes.length === 3);

      await shareProject();
      const link = document.getElementById('shareLink').value;
      check('share_modal_y_link', !document.getElementById('shareModal').hidden && link.indexOf('?p=g1.') > -1);
      check('share_boton_habilitado', document.getElementById('copyLink').disabled === false);
      closeShare();

      /* El nombre sobrevive a borrar un disfraz anterior; el índice viejo sigue leyéndose. */
      const tmp = createSpriteData('🐱', 'Tmp', []);
      tmp.costumes = [
        makeCostume('emoji', '🐱', 'A'),
        makeCostume('emoji', '🚀', 'B'),
        makeCostume('emoji', '🐶', 'C')
      ];
      tmp.costumeIndex = 0;
      syncCostume(tmp);
      check('indice_viejo_compatible', findCostumeIndex(tmp, '3') === 2);
      const blk = makeNode('switch_costume', 'C');
      const antes = tmp.costumes[findCostumeIndex(tmp, blk.val)].src;
      tmp.costumes.splice(0, 1);
      const despues = tmp.costumes[findCostumeIndex(tmp, blk.val)].src;
      check('nombre_estable_tras_borrar', antes === despues && despues === '🐶');
      check('nombre_inexistente_no_apunta_otro', findCostumeIndex(tmp, 'ZZ') === -1);

      check('sin_errores_finales', errs.length === 0);
    } catch (err) {
      out.push('ERROR ' + err.message + ' @ ' + (err.stack || '').split('\n')[1]);
    }
    done();
  })();
});
