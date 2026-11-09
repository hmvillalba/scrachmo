/* Tanda 8: exportación a Scratch (.sb3). Comprueba las piezas por separado
   (MD5, CRC32, ZIP, WAV, PNG) y después el proyecto armado: que el grafo de
   bloques esté sano, que cada recurso declarado exista en el ZIP, que los
   opcodes sean los de Scratch y que lo que no tiene equivalente quede
   anotado en un comentario. */
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

  const enc = new TextEncoder();

  /* Lector de ZIP mínimo: EOCD → directorio central → entradas. */
  function readZip(bytes) {
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let eocd = -1;
    for (let i = bytes.length - 22; i >= 0 && i > bytes.length - 22 - 66000; i--) {
      if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) return null;
    const count = dv.getUint16(eocd + 10, true);
    const cdOff = dv.getUint32(eocd + 16, true);
    const dec = new TextDecoder();
    const files = [];
    let at = cdOff;
    for (let i = 0; i < count; i++) {
      if (dv.getUint32(at, true) !== 0x02014b50) return null;
      const crc = dv.getUint32(at + 16, true);
      const size = dv.getUint32(at + 24, true);
      const nameLen = dv.getUint16(at + 28, true);
      const extraLen = dv.getUint16(at + 30, true);
      const commentLen = dv.getUint16(at + 32, true);
      const localOff = dv.getUint32(at + 42, true);
      const name = dec.decode(bytes.subarray(at + 46, at + 46 + nameLen));
      const lNameLen = dv.getUint16(localOff + 26, true);
      const lExtraLen = dv.getUint16(localOff + 28, true);
      const dataStart = localOff + 30 + lNameLen + lExtraLen;
      files.push({ name: name, crc: crc, size: size, bytes: bytes.subarray(dataStart, dataStart + size) });
      at += 46 + nameLen + extraLen + commentLen;
    }
    return files;
  }

  const make = (name, code, extra) => {
    const s = createSpriteData('🐱', name, code || []);
    if (extra) Object.keys(extra).forEach(k => { s[k] = extra[k]; });
    return s;
  };

  function graphProblems(t) {
    const problems = [];
    Object.keys(t.blocks).forEach(id => {
      const b = t.blocks[id];
      if (!b.opcode) problems.push('sin opcode: ' + id);
      if (b.next && !t.blocks[b.next]) problems.push('next roto: ' + id);
      if (b.parent && !t.blocks[b.parent]) problems.push('parent roto: ' + id);
      if (b.topLevel && (typeof b.x !== 'number' || typeof b.y !== 'number')) {
        problems.push('topLevel sin x/y: ' + id);
      }
      Object.keys(b.inputs).forEach(k => {
        const inp = b.inputs[k];
        const ref = Array.isArray(inp) ? inp[1] : null;
        if (typeof ref === 'string' && !t.blocks[ref]) problems.push('input ' + k + ' roto: ' + id);
      });
    });
    return problems;
  }

  (async () => {
    try {
      check('sin_errores_arranque', errs.length === 0);

      /* ============ 1. MD5, CRC32 y ZIP ============ */
      check('md5_vacio', md5hex(enc.encode('')) === 'd41d8cd98f00b204e9800998ecf8427e');
      check('md5_abc', md5hex(enc.encode('abc')) === '900150983cd24fb0d6963f7d28e17f72');
      check('md5_frase', md5hex(enc.encode('The quick brown fox jumps over the lazy dog')) ===
        '9e107d9d372bb6826bd81d3542a419d6');
      check('crc32_vector', crc32(enc.encode('123456789')) === 0xCBF43926);

      const zip = zipStore([
        { name: 'a.txt', bytes: enc.encode('hola') },
        { name: 'b.bin', bytes: new Uint8Array([0, 1, 2, 255]) }
      ]);
      check('zip_firma', zip[0] === 0x50 && zip[1] === 0x4b && zip[2] === 3 && zip[3] === 4);
      const back = readZip(zip);
      check('zip_legible', !!back && back.length === 2);
      check('zip_nombres', !!back && back[0].name === 'a.txt' && back[1].name === 'b.bin');
      check('zip_contenido', !!back && new TextDecoder().decode(back[0].bytes) === 'hola' &&
        back[1].bytes.length === 4 && back[1].bytes[3] === 255);
      check('zip_crc', !!back && back[0].crc === crc32(enc.encode('hola')));

      /* ============ 2. WAV y PNG ============ */
      const wav = wavFromSteps(SOUND_LIB.find(s => s.id === 'beep').steps);
      const wv = new DataView(wav.buffer);
      check('wav_riff', String.fromCharCode(wav[0], wav[1], wav[2], wav[3]) === 'RIFF');
      check('wav_wave', String.fromCharCode(wav[8], wav[9], wav[10], wav[11]) === 'WAVE');
      check('wav_mono_22050', wv.getUint16(22, true) === 1 && wv.getUint32(24, true) === 22050);
      check('wav_largo_coherente', wv.getUint32(40, true) === wav.length - 44 &&
        wv.getUint32(40, true) % 2 === 0);
      const wav2 = wavFromSteps(SOUND_LIB.find(s => s.id === 'beep').steps);
      check('wav_determinista', md5hex(wav) === md5hex(wav2));
      const ruidoA = wavFromSteps(SOUND_LIB.find(s => s.id === 'boom').steps);
      const ruidoB = wavFromSteps(SOUND_LIB.find(s => s.id === 'boom').steps);
      check('ruido_determinista', md5hex(ruidoA) === md5hex(ruidoB));
      check('wav_silencio_no_vacio', wavFromSteps([[0, 0.2]]).length > 44);

      const png = emojiPng('🐱', 64);
      check('png_firma', png[0] === 0x89 && png[1] === 0x50 && png[2] === 0x4e && png[3] === 0x47);
      check('png_ancho', (png[16] << 24 | png[17] << 16 | png[18] << 8 | png[19]) === 64);

      /* ============ 3. proyecto de prueba ============ */
      const gato = make('Gato', [
        { id: 'h1', type: 'when_flag' },
        { id: 'm1', type: 'move', val: '10' },
        { id: 'r1', type: 'repeat', val: '3', body: [{ id: 'b1', type: 'bounce' }] },
        { id: 'i1', type: 'if_else', val: 'puntos > 5', body: [{ id: 's1', type: 'say', val: 'hola' }], elseBody: [{ id: 'h2', type: 'hide' }] },
        { id: 'e1', type: 'if_edge', body: [{ id: 'so1', type: 'play_sound', val: 'coin' }] },
        { id: 'v1', type: 'vibrate', val: '100' },
        { id: 'h3', type: 'when_key', val: 'espacio' },
        { id: 'x1', type: 'go_xy', val: '10,-20' },
        { id: 'sv1', type: 'set_var', val: 'contador=5' }
      ], { x: 20, y: -30, dir: 120, size: 80 });
      const perro = make('Perro', [
        { id: 'h4', type: 'when_flag' },
        { id: 'mu1', type: 'play_music', val: 'happy' },
        { id: 't1', type: 'if_touch', body: [{ id: 'sc1', type: 'score_add', val: '1' }] }
      ]);
      sprites = [gato, perro];
      selectedSpriteId = gato.id;
      variables = { contador: 0 };
      volume = 70;

      const built = await sb3Build();
      const project = built.project;
      check('tres_targets', project.targets.length === 3);
      check('stage_primero', project.targets[0].isStage === true);
      check('meta_semver', project.meta && project.meta.semver === '3.0.0');
      check('monitors_vacio', Array.isArray(project.monitors) && project.monitors.length === 0);

      const g = project.targets[1];
      const p = project.targets[2];
      check('posicion_y_direccion', g.x === 20 && g.y === -30 && g.direction === 120);
      check('tamano_y_rotacion', g.size === 80 && g.rotationStyle === 'all around');
      check('volumen_del_proyecto', g.volume === 70);
      check('variables_del_stage', !!project.targets[0].variables &&
        Object.keys(project.targets[0].variables).length >= 2);
      check('variable_contador', Object.values(project.targets[0].variables)
        .some(v => v[0] === 'contador'));
      check('variable_puntaje', Object.values(project.targets[0].variables)
        .some(v => v[0] === 'puntaje'));
      check('broadcast_declarado', Object.values(project.targets[0].broadcasts || {})
        .indexOf('mensaje') > -1);

      /* ============ 4. grafo de bloques sano ============ */
      const probs = graphProblems(g).concat(graphProblems(p)).concat(graphProblems(project.targets[0]));
      check('grafo_sano', probs.length === 0);
      if (probs.length) probs.slice(0, 6).forEach(x => out.push('INFO ' + x));

      const ops = t => Object.keys(t.blocks).map(id => t.blocks[id].opcode);
      const opsG = ops(g);
      check('op_bandera', opsG.indexOf('event_whenflagclicked') > -1);
      check('op_mover', opsG.indexOf('motion_movesteps') > -1);
      check('op_repetir', opsG.indexOf('control_repeat') > -1);
      check('op_rebotar', opsG.indexOf('motion_ifonedgebounce') > -1);
      check('op_si_sino', opsG.indexOf('control_if_else') > -1);
      check('op_comparacion', opsG.indexOf('operator_gt') > -1);
      check('op_toca_borde', opsG.indexOf('sensing_touchingobject') > -1);
      check('op_decir', opsG.indexOf('looks_say') > -1);
      check('op_esconder', opsG.indexOf('looks_hide') > -1);
      check('op_ir_a_xy', opsG.indexOf('motion_gotoxy') > -1);
      check('op_variable', opsG.indexOf('data_setvariableto') > -1);
      check('op_tecla', opsG.indexOf('event_whenkeypressed') > -1);

      /* El cuerpo del repetir cuelga como SUBSTACK y el si/sino tiene los dos. */
      const rep = Object.keys(g.blocks).map(id => g.blocks[id]).find(b => b.opcode === 'control_repeat');
      check('repetir_substack', !!rep && Array.isArray(rep.inputs.SUBSTACK) && rep.inputs.SUBSTACK[0] === 2);
      const ifelse = Object.keys(g.blocks).map(id => g.blocks[id]).find(b => b.opcode === 'control_if_else');
      check('si_sino_dos_ramas', !!ifelse && ifelse.inputs.SUBSTACK[0] === 2 && ifelse.inputs.SUBSTACK2[0] === 2);

      /* El menú de «toca el borde» es un shadow con el valor correcto. */
      const tocando = Object.keys(g.blocks).map(id => g.blocks[id]).find(b => b.opcode === 'sensing_touchingobject');
      const menuId = tocando && tocando.inputs.TOUCHINGOBJECTMENU[1];
      check('menu_toca_borde', !!menuId && g.blocks[menuId].fields.TOUCHINGOBJECTMENU[0] === '_edge_');

      /* La tecla se traduce al nombre de Scratch. */
      const tecla = Object.keys(g.blocks).map(id => g.blocks[id]).find(b => b.opcode === 'event_whenkeypressed');
      check('tecla_espacio', !!tecla && tecla.fields.KEY_OPTION[0] === 'space');

      /* Los bloques sueltos al final del código no se pierden. */
      check('bloques_sueltos', opsG.filter(o => o === 'motion_gotoxy').length >= 1);

      /* ============ 5. recursos ============ */
      const nombres = built.files.map(f => f.name);
      check('project_json_primero', nombres[0] === 'project.json');
      const declarados = [];
      project.targets.forEach(t => {
        (t.costumes || []).forEach(c => declarados.push(c.md5ext));
        (t.sounds || []).forEach(s => declarados.push(s.md5ext));
      });
      check('recursos_declarados_existen', declarados.length > 0 &&
        declarados.every(n => nombres.indexOf(n) > -1));
      check('recursos_sin_repetir', new Set(nombres).size === nombres.length);
      check('nombre_md5', declarados.every(n => /^[0-9a-f]{32}\.(png|wav)$/.test(n)));

      /* Lo que de verdad comprueba Scratch al abrir: el nombre del archivo es
         el MD5 de su contenido. Si no coincide, descarta el recurso y el
         disfraz o el sonido aparecen vacíos. */
      const bytesDe = {};
      built.files.forEach(f => { bytesDe[f.name] = f.bytes; });
      check('asset_md5_coincide', declarados.every(n =>
        !!bytesDe[n] && md5hex(bytesDe[n]) === n.split('.')[0]));
      check('sin_archivos_huerfanos', nombres.every(n => n === 'project.json' || declarados.indexOf(n) > -1));
      check('sampleCount_coincide', project.targets.every(t => (t.sounds || []).every(s =>
        !!bytesDe[s.md5ext] && s.sampleCount === (bytesDe[s.md5ext].length - 44) / 2)));

      /* Los ids de variable y de mensaje que usan los bloques tienen que estar
         declarados en el escenario, con el mismo id. */
      const idsVar = Object.keys(project.targets[0].variables || {});
      const idsMsg = Object.keys(project.targets[0].broadcasts || {});
      check('ids_de_variable_existen', project.targets.every(t =>
        Object.keys(t.blocks || {}).every(id => {
          const f = t.blocks[id] && t.blocks[id].fields && t.blocks[id].fields.VARIABLE;
          return !f || idsVar.indexOf(f[1]) > -1;
        })));
      check('ids_de_mensaje_existen', project.targets.every(t =>
        Object.keys(t.blocks || {}).every(id => {
          const f = t.blocks[id] && t.blocks[id].fields && t.blocks[id].fields.BROADCAST_OPTION;
          return !f || idsMsg.indexOf(f[1]) > -1;
        })));
      check('cada_costo_tiene_asset', project.targets.every(t =>
        (t.costumes || []).length > 0 && t.costumes.every(c => c.assetId && c.md5ext && c.dataFormat === 'png')));
      check('centro_de_rotacion', project.targets.every(t =>
        t.costumes.every(c => typeof c.rotationCenterX === 'number' && typeof c.rotationCenterY === 'number')));
      check('fondo_del_stage', project.targets[0].costumes.length === 1 &&
        project.targets[0].costumes[0].rotationCenterX === 240);

      /* Los sonidos usados viajan en el personaje que los usa. */
      check('sonido_en_el_personaje', (g.sounds || []).some(s => s.name === SOUNDMAP.coin.name[lang]));
      check('melodia_en_el_personaje', (p.sounds || []).some(s => s.name === MELODYMAP.happy.name[lang]));
      check('sonido_con_rate', (g.sounds || []).every(s => s.rate === 22050 && s.sampleCount > 0));
      check('musica_una_vez', ops(p).indexOf('sound_playuntildone') > -1);

      /* ============ 6. lo que no tiene equivalente ============ */
      check('avisa_lo_que_falta', built.dropped.some(d => d.indexOf('vibrate') > -1));
      check('comentario_con_la_lista', Object.keys(g.comments).length === 1 &&
        /vibrate/.test(Object.values(g.comments)[0].text));
      check('comentario_colgado', (() => {
        const c = Object.values(g.comments)[0];
        return !!c && !!g.blocks[c.blockId];
      })());

      /* ============ 7. el ZIP completo se puede leer ============ */
      const full = readZip(zipStore(built.files));
      check('zip_completo', !!full && full.length === built.files.length);
      const pj = full.find(f => f.name === 'project.json');
      check('project_json_parsea', !!pj && (() => {
        try { JSON.parse(new TextDecoder().decode(pj.bytes)); return true; } catch (e) { return false; }
      })());
      check('zip_crcs_ok', full.every(f => f.crc === crc32(f.bytes)));

      /* Un proyecto vacío no debe romper nada. */
      sprites = [make('Solo', [])];
      selectedSpriteId = sprites[0].id;
      variables = {};
      const vacio = await sb3Build();
      check('proyecto_vacio', vacio.project.targets.length === 2 &&
        vacio.project.targets[1].costumes.length >= 1 &&
        Object.keys(vacio.project.targets[1].blocks).length === 0);

      /* El botón existe y está enganchado. */
      check('boton_sb3', !!document.getElementById('sb3Btn') &&
        typeof exportSb3 === 'function');

      check('sin_errores_final', errs.length === 0);
    } catch (err) {
      out.push('ERROR ' + err.message + ' @ ' + (err.stack || '').split('\n')[1]);
    }
    clearTimeout(watchdog);
    done();
  })();
});
