/* Tanda 6: sonidos y música. Comprueba el catálogo, los bloques nuevos, el
   volumen del proyecto y la síntesis real. Para no depender del audio del
   sistema, la parte de síntesis corre contra un AudioContext falso que anota
   osciladores, ganancias y fuentes de ruido: así se puede afirmar qué nota
   suena, cuántas y con qué ganancia. */
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

  const make = (name, extra) => {
    const s = createSpriteData('🐱', name, []);
    s.x = 0; s.y = 0; s.dir = 90; s.visible = true;
    if (extra) Object.keys(extra).forEach(k => { s[k] = extra[k]; });
    return s;
  };

  /* ---------------- AudioContext falso ---------------- */
  const RealAC = window.AudioContext || window.webkitAudioContext;
  const made = { osc: [], gains: [], sources: [], filters: [] };
  function FakeParam(v) { this.value = v; this.calls = []; }
  FakeParam.prototype.setValueAtTime = function (v, t) { this.calls.push(['set', v, t]); this.value = v; return this; };
  FakeParam.prototype.exponentialRampToValueAtTime = function (v, t) { this.calls.push(['exp', v, t]); this.value = v; return this; };
  FakeParam.prototype.linearRampToValueAtTime = function (v, t) { this.calls.push(['lin', v, t]); this.value = v; return this; };
  function FakeAC() {
    this.currentTime = 0;
    this.state = 'running';
    this.sampleRate = 48000;
    this.destination = { kind: 'destination' };
  }
  FakeAC.prototype.resume = function () { this.state = 'running'; return Promise.resolve(); };
  FakeAC.prototype.createGain = function () {
    const g = { kind: 'gain', gain: new FakeParam(1), connect() { } };
    made.gains.push(g);
    return g;
  };
  FakeAC.prototype.createOscillator = function () {
    const o = {
      kind: 'osc', type: 'sine', frequency: new FakeParam(440), onended: null,
      connect() { }, start(t) { this.started = t; }, stop(t) { this.stopped = t; }
    };
    made.osc.push(o);
    return o;
  };
  FakeAC.prototype.createBuffer = function (ch, len) {
    const data = new Float32Array(len);
    return { length: len, getChannelData: () => data };
  };
  FakeAC.prototype.createBufferSource = function () {
    const s = {
      kind: 'src', buffer: null, onended: null,
      connect() { }, start(t) { this.started = t; }, stop(t) { this.stopped = t; }
    };
    made.sources.push(s);
    return s;
  };
  FakeAC.prototype.createBiquadFilter = function () {
    const f = { kind: 'filter', type: 'lowpass', frequency: new FakeParam(1000), connect() { } };
    made.filters.push(f);
    return f;
  };
  const resetMade = () => { made.osc.length = 0; made.gains.length = 0; made.sources.length = 0; made.filters.length = 0; };

  (async () => {
    try {
      check('sin_errores_arranque', errs.length === 0);

      /* ============ 1. catálogo ============ */
      check('bloques_nuevos', ['play_sound', 'play_music', 'stop_sounds', 'set_volume', 'change_volume']
        .every(id => !!BYID[id] && PALETTE_BLOCKS.some(b => b.id === id)));
      check('categoria_sound_7', PALETTE_BLOCKS.filter(b => b.cat === 'sound').length === 7);
      check('sonidos_8', SOUND_LIB.length === 8);
      check('melodias_3', MELODY_LIB.length === 3);
      check('ids_unicos', new Set(SOUND_LIB.map(s => s.id)).size === SOUND_LIB.length &&
        new Set(MELODY_LIB.map(m => m.id)).size === MELODY_LIB.length);
      check('recetas_validas', SOUND_LIB.concat(MELODY_LIB).every(x =>
        Array.isArray(x.steps) && x.steps.length > 0 &&
        x.steps.every(st => Array.isArray(st) && st.length >= 2 && Number(st[1]) > 0)));
      check('textos_4_idiomas', ['play_sound', 'play_music', 'stop_sounds', 'set_volume', 'change_volume']
        .every(id => ['es', 'en', 'pt', 'fr'].every(l =>
          typeof BYID[id].n[l] === 'string' && BYID[id].n[l].length &&
          typeof BYID[id].d[l] === 'string' && BYID[id].d[l].length)));
      check('nombres_sonidos_4_idiomas', SOUND_LIB.concat(MELODY_LIB).every(x =>
        ['es', 'en', 'pt', 'fr'].every(l => typeof x.name[l] === 'string' && x.name[l].length)));
      check('sin_reporteros_en_sonido', ['play_sound', 'play_music', 'stop_sounds', 'set_volume', 'change_volume']
        .every(id => !BYID[id].repOk && !BYID[id].rep));
      check('pick_declarado', BYID.play_sound.pick === 'sounds' && BYID.play_music.pick === 'melodies');
      check('defecto_valido', !!SOUNDMAP[BYID.play_sound.def] && !!MELODYMAP[BYID.play_music.def]);

      /* El nombre accesible muestra el nombre del sonido, no su id. */
      const prevLang = lang;
      lang = 'es';
      check('plain_name_sonido', blockPlainName(BYID.play_sound).indexOf('Pitido') > -1 &&
        blockPlainName(BYID.play_sound).indexOf('beep') === -1);
      check('plain_name_musica', blockPlainName(BYID.play_music).indexOf('Alegre') > -1);
      lang = 'en';
      check('plain_name_idioma', blockPlainName(BYID.play_sound).indexOf('Beep') > -1);
      lang = prevLang;

      /* ============ 2. volumen del proyecto ============ */
      check('volumen_inicial', volume === 100);
      check('volumen_fija', setVolume(50) === 50 && volume === 50);
      check('volumen_tope_alto', setVolume(150) === 100);
      check('volumen_tope_bajo', setVolume(-20) === 0);
      check('volumen_redondea', setVolume(33.6) === 34);
      check('volumen_texto_invalido', setVolume('nada') === 34);
      check('volumen_cambia', changeVolume(-14) === 20 && volume === 20);
      check('volumen_cambia_a_texto', changeVolume('x') === 20);
      setVolume(50);
      check('ganancia_a_la_mitad', Math.abs(volumeGain() - 0.11) < 1e-9);
      setVolume(0);
      check('ganancia_en_cero', volumeGain() === 0);
      setVolume(100);
      check('ganancia_completa', Math.abs(volumeGain() - 0.22) < 1e-9);

      /* ============ 3. síntesis (con AudioContext falso) ============ */
      window.AudioContext = FakeAC;
      audioCtx = null;
      masterGain = null;
      resetMade();

      check('sonido_valido', playSoundById('beep') === true);
      check('sonido_crea_oscilador', made.osc.length === 1 && made.osc[0].frequency.value === 880);
      check('sonido_empieza_y_termina', made.osc[0].started === 0 && made.osc[0].stopped > 0);
      check('sonido_ganancia_maestra', made.gains.length >= 2 &&
        made.gains.some(g => Math.abs(g.gain.value - 0.22) < 1e-9));

      resetMade();
      check('moneda_dos_notas', playSoundById('coin') === true && made.osc.length === 2);
      check('moneda_notas', Math.round(made.osc[0].frequency.value) === 988 &&
        Math.round(made.osc[1].frequency.value) === 1319);

      resetMade();
      check('explosion_es_ruido', playSoundById('boom') === true &&
        made.sources.length === 1 && made.osc.length === 0);
      check('explosion_filtrada', made.filters.length === 1 && made.filters[0].frequency.value === 700);

      resetMade();
      check('sonido_desconocido', playSoundById('no_existe') === false && made.osc.length === 0);

      /* Melodía en bucle */
      resetMade();
      check('melodia_arranca', playMelodyById('happy') === true && musicId === 'happy' && !!musicTimer);
      check('melodia_notas', made.osc.length === 6);
      check('melodia_enlaza', made.osc[1].started > made.osc[0].started);
      stopMusic();
      check('melodia_detiene', musicId === '' && musicTimer === null);
      resetMade();
      check('melodia_desconocida', playMelodyById('no_existe') === false && made.osc.length === 0);

      /* Cambiar de melodía corta la anterior */
      playMelodyById('happy');
      playMelodyById('sad');
      check('cambia_de_melodia', musicId === 'sad');
      stopMusic();

      /* Volumen en caliente sobre el nodo maestro */
      setVolume(100);
      playSoundById('beep');
      setVolume(25);
      check('volumen_en_caliente', Math.abs(masterGain.gain.value - 0.055) < 1e-9);
      setVolume(100);

      /* Detener los sonidos corta lo que esté sonando */
      playMelodyById('happy');
      resetMade();
      playSoundById('bell');
      stopAllSounds();
      check('detener_todo_corta_musica', musicId === '' && musicTimer === null);
      check('detener_todo_corta_notas', made.osc.length === 2 && made.osc.every(o => o.stopped === 0));

      /* ============ 4. ejecución de los bloques ============ */
      const sp = make('S');
      sprites = [sp];
      selectedSpriteId = sp.id;
      render();

      setVolume(100);
      await execBlock(makeNode('set_volume', 40), sp);
      check('exec_set_volume', volume === 40);
      await execBlock(makeNode('change_volume', -15), sp);
      check('exec_change_volume', volume === 25);
      await execBlock(makeNode('set_volume', 500), sp);
      check('exec_volume_recorta', volume === 100);

      resetMade();
      await execBlock(makeNode('play_sound', 'coin'), sp);
      check('exec_play_sound', made.osc.length === 2);
      await execBlock(makeNode('play_sound', 'no_existe'), sp);
      check('exec_play_sound_raro_no_rompe', errs.length === 0);

      await execBlock(makeNode('play_music', 'game'), sp);
      check('exec_play_music', musicId === 'game');
      await execBlock(makeNode('stop_sounds'), sp);
      check('exec_stop_sounds', musicId === '' && musicTimer === null);

      /* Detener también corta la música: nadie más la apagaría. */
      playMelodyById('happy');
      stopCode();
      check('detener_corta_musica', musicId === '' && musicTimer === null);

      /* ============ 5. editor ============ */
      sprites = [make('E', { code: [makeNode('play_sound'), makeNode('play_music')] })];
      selectedSpriteId = sprites[0].id;
      render();
      const sels = Array.from(document.querySelectorAll('#codeList select.sb-select'));
      check('editor_dos_selects', sels.length === 2);
      check('editor_opciones_sonidos', sels[0] && sels[0].options.length === SOUND_LIB.length);
      check('editor_opciones_melodias', sels[1] && sels[1].options.length === MELODY_LIB.length);
      check('editor_valor_inicial', sels[0] && sels[0].value === 'beep' && sels[1].value === 'happy');
      sels[0].value = 'coin';
      sels[0].dispatchEvent(new Event('change', { bubbles: true }));
      check('editor_guarda_id', sprites[0].code[0].val === 'coin');
      sels[1].value = 'sad';
      sels[1].dispatchEvent(new Event('change', { bubbles: true }));
      check('editor_guarda_melodia', sprites[0].code[1].val === 'sad');

      /* Un id que ya no existe no rompe el select. */
      sprites[0].code[0].val = 'fantasma';
      render();
      const ghost = document.querySelector('#codeList select.sb-select');
      check('editor_id_desconocido', ghost && ghost.options.length === SOUND_LIB.length + 1 &&
        ghost.value === 'fantasma');

      /* La paleta dibuja los cinco bloques con su nombre. */
      currentFilter = 'sound';
      renderPalette(UI[lang]);
      check('paleta_dibuja_sonido', document.querySelectorAll('#palette .p-block').length === 7);
      check('paleta_nombre_sonido',
        $('#palette').textContent.indexOf('Reproducir sonido') > -1);
      currentFilter = 'all';
      renderPalette(UI[lang]);

      /* ============ 6. guardar y volver a abrir ============ */
      setVolume(70);
      check('serializa_volumen', serializeProject().volume === 70);

      const payload = {
        version: '2.0',
        sprites: [{
          id: 's1', name: 'Audio', x: 0, y: 0, dir: 90, size: 100, visible: true, rot: 'all',
          costumes: [{ id: 'c1', kind: 'emoji', src: '🐱', name: 'Gato' }],
          costumeIndex: 0,
          code: [
            { id: 'h1', type: 'when_flag' },
            { id: 'a1', type: 'play_sound', val: 'clap' },
            { id: 'a2', type: 'play_music', val: 'sad' },
            { id: 'a3', type: 'set_volume', val: '35' }
          ]
        }],
        variables: {}, score: 0, volume: 35, selected: 's1'
      };
      check('apply_volumen', applyPayload(payload) === true && volume === 35);
      const code = sprites[0].code;
      check('serializa_sonidos', code[1].val === 'clap' && code[2].val === 'sad');
      const round = applyPayload(JSON.parse(JSON.stringify(serializeProject())));
      check('ida_y_vuelta', round === true && sprites[0].code[1].val === 'clap' &&
        sprites[0].code[2].val === 'sad' && volume === 35);

      /* Abrir otro proyecto corta la música del anterior. */
      playMelodyById('happy');
      applyPayload(payload);
      check('abrir_corta_musica', musicId === '' && musicTimer === null);

      /* Un proyecto viejo sin «volume» arranca al 100. */
      const viejo = JSON.parse(JSON.stringify(payload));
      delete viejo.volume;
      applyPayload(viejo);
      check('proyecto_viejo_volumen_100', volume === 100);

      /* ============ 7. limpieza ============ */
      stopAllSounds();
      audioCtx = null;
      masterGain = null;
      liveNodes.clear();
      window.AudioContext = RealAC;
      check('sin_errores_final', errs.length === 0);
    } catch (err) {
      out.push('ERROR ' + err.message + ' @ ' + (err.stack || '').split('\n')[1]);
    }
    stopMusic();
    clearTimeout(watchdog);
    done();
  })();
});
