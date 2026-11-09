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
  const tick = (ms) => new Promise(r => setTimeout(r, ms || 20));

  /* toBlob() no resuelve bajo el tiempo virtual de Chrome headless:
     construimos el File sincrónicamente desde un PNG válido. */
  function makeFile(name, type, w, h) {
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const g = cv.getContext('2d');
    g.fillStyle = '#e11d48';
    g.fillRect(0, 0, w, h);
    const bin = atob(cv.toDataURL('image/png').split(',')[1]);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new File([bytes], name, { type: type });
  }

  /* createImageBitmap puede colgarse en headless: cada imagen consume el
     temporizador de respaldo de 3 s del motor. Dejamos margen holgado. */
  const watchdog = setTimeout(() => {
    out.push('WATCHDOG: cadena asíncrona no terminó');
    done();
  }, 60000);

  (async () => {
    try {
      check('sin_errores_arranque', errs.length === 0);

      /* --- Camino A: la página se abre con un link ?p=g1. --- */
      if (new URLSearchParams(location.search).has('p')) {
        let ready = false;
        for (let i = 0; i < 80 && !ready; i++) {
          ready = sprites.length === 1 && sprites[0].name === 'ProyectoLink';
          if (!ready) await tick(20);
        }
        check('link_carga_al_arrancar', ready);
        if (ready) {
          const s = sprites[0];
          check('link_trae_disfraces', s.costumes.length === 2 && s.costumeIndex === 1);
          check('link_imagen_valida', IMG_DATA_RE.test(s.costumes[1].src));
          check('link_trae_score', score === 77);
          check('link_trae_fondo', stageBg === 3);
          check('link_trae_bloque_xy', s.code.length === 1 && s.code[0].type === 'go_xy' &&
            s.code[0].val === '88,-42');
          check('link_dibuja_dos_campos', document.querySelectorAll('#codeList input[data-xy]').length === 2);
          check('link_renderiza_tira', document.querySelectorAll('#costumeStrip .costume-thumb').length === 2);
          check('link_imagen_en_escenario', !!document.querySelector('#spritesLayer img.costume-img'));
          check('link_guarda_en_local', (() => {
            saveProject();
            const raw = store.get('scrachmo_v8');
            return !!raw && raw.indexOf('ProyectoLink') > -1;
          })());
        }
        check('sin_errores_finales', errs.length === 0);
        clearTimeout(watchdog);
        done();
        return;
      }

      /* --- Camino B: importación real de archivos --- */
      let s = createSpriteData('🐱', 'Importador', []);
      sprites = [s];
      selectedSpriteId = s.id;
      render();

      const png = await makeFile('nave-espacial.png', 'image/png', 400, 300);
      const jpg = await makeFile('auto 2.jpg', 'image/jpeg', 40, 40);
      const svg = await makeFile('vector.svg', 'image/svg+xml', 20, 20);
      const falso = await makeFile('virus.png', 'text/html', 20, 20);

      check('archivo_es_file', png instanceof File && png.size > 0);
      check('filtro_svg', isAllowedImage(svg) === false);
      check('filtro_tipo_falso', isAllowedImage(falso) === false);
      check('filtro_jpg', isAllowedImage(jpg) === true);

      const src = await imageToCostume(png);
      check('rasteriza_a_datos', !!src && IMG_DATA_RE.test(src));
      check('reduce_a_256px', (() => {
        if (!src) return false;
        return src.length < MAX_IMG_CHARS && src.length < png.size * 4;
      })());

      await importCostumeFiles([png, jpg, svg, falso], false);
      check('importa_solo_validos', s.costumes.length === 3);
      check('nombres_desde_archivo', s.costumes[1].name === 'nave-espacial' && s.costumes[2].name === 'auto 2');
      check('selecciona_primer_nuevo', s.costumeIndex === 1);
      check('importa_y_renderiza', document.querySelectorAll('#costumeStrip .costume-thumb').length === 3);
      check('importa_imagen_en_escenario', !!document.querySelector('#spritesLayer img.costume-img'));
      check('importa_persiste', (() => {
        const raw = store.get('scrachmo_v8');
        return !!raw && raw.indexOf('nave-espacial') > -1;
      })());

      /* El disfraz importado sobrevive a un round-trip de guardado. */
      check('importa_roundtrip', (() => {
        const p = serializeProject();
        const ok = applyPayload(p) === true && sprites[0].costumes.length === 3 &&
          IMG_DATA_RE.test(sprites[0].costumes[1].src);
        s = sprites[0];
        return ok;
      })());
      render();

      /* Importar como personaje nuevo crea un sprite propio. */
      const antes = sprites.length;
      await importCostumeFiles([jpg], true);
      check('importa_personaje_nuevo', sprites.length === antes + 1);
      const nuevo = sprites[sprites.length - 1];
      check('nuevo_solo_imagen', nuevo.costumes.length === 1 && nuevo.costumes[0].kind === 'img' && nuevo.img !== '');
      check('nuevo_queda_seleccionado', selectedSpriteId === nuevo.id);
      check('nuevo_en_bandeja', document.querySelectorAll('#spriteTray .sprite-tile').length === sprites.length + 1);

      /* Importar dos veces el mismo archivo no crea nombres repetidos. */
      const ded = createSpriteData('🐱', 'Dedupe', []);
      ded.costumes = [makeCostume('emoji', '🐱', 'Base')];
      ded.costumeIndex = 0;
      syncCostume(ded);
      sprites.push(ded);
      selectedSpriteId = ded.id;
      render();
      await importCostumeFiles([png, png], false);
      check('nombres_unicos_al_importar', ded.costumes.length === 3 &&
        ded.costumes[1].name === 'nave-espacial' &&
        ded.costumes[2].name === 'nave-espacial 2');
      sprites.pop();
      selectedSpriteId = s.id;
      render();

      /* Borrado: se confirma con el diálogo propio (ya no con confirm()),
         se conserva el disfraz activo y nunca queda vacío. */
      selectedSpriteId = s.id;
      render();
      const realAsk = askConfirm;
      askConfirm = async () => true;
      const activoId = currentCostume(s).id;
      await deleteCostume(0);
      check('borra_un_disfraz', s.costumes.length === 2);
      check('borra_conserva_activo', currentCostume(s).id === activoId);
      for (let i = 0; i < 6; i++) await deleteCostume(0);
      askConfirm = realAsk;
      check('nunca_borra_el_ultimo', s.costumes.length === 1 && s.costumeIndex === 0);
      render();

      /* Límite de 12 disfraces. */
      s.costumes = [];
      for (let i = 0; i < MAX_COSTUMES; i++) s.costumes.push(makeCostume('emoji', '🐱', 'D' + i));
      s.costumeIndex = 11;
      syncCostume(s);
      render();
      check('limite_12_oculta_agregar', !document.querySelector('#costumeStrip [data-add-costume]'));
      check('limite_12_deshabilita_boton', document.getElementById('addCostumeBtn').disabled === true);
      await importCostumeFiles([png], false);
      check('limite_12_no_agrega', s.costumes.length === MAX_COSTUMES);

      /* Aviso de cupo lleno, una sola vez. */
      const setOriginal = store.set;
      let toasts = 0;
      const toastOriginal = window.toast;
      window.toast = function () { toasts++; };
      store.set = function () { return false; };
      storageWarned = false;
      saveProject(); saveProject();
      store.set = setOriginal;
      window.toast = toastOriginal;
      check('aviso_cupo_una_vez', toasts === 1 && storageWarned === true);

      check('sin_errores_finales', errs.length === 0);
      clearTimeout(watchdog);
    } catch (err) {
      out.push('ERROR ' + err.message + ' @ ' + (err.stack || '').split('\n')[1]);
      clearTimeout(watchdog);
    }
    done();
  })();
});
