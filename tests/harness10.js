/* Tanda 3: varios proyectos con nombre. Comprueba la migración del proyecto
   que ya existía, crear, abrir, renombrar, duplicar, borrar, el límite y que
   abrir uno no pise el otro. */
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

  const cleanSlots = () => {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i));
    keys.filter(k => k && k.indexOf('scrachmo_proj_') === 0)
      .forEach(k => localStorage.removeItem(k));
  };

  (async () => {
    try {
      check('sin_errores_arranque', errs.length === 0);

      /* ============ 1. migración del proyecto que ya estaba ============ */
      cleanSlots();
      store.del('scrachmo_projects');
      store.del('scrachmo_active');
      store.set('scrachmo_v8', JSON.stringify({
        version: '2.0',
        sprites: [{ id: 'viejo', name: 'Viejo', code: [] }],
        variables: { vidas: 3 },
        score: 5
      }));
      loadProject();          // el payload pasa a memoria como en un arranque real
      initProjects();

      check('migra_uno_solo', projects.length === 1);
      check('migra_activo', activeProjectId === projects[0].id);
      check('migra_nombre', projects[0].name === UI[lang].untitledProject);
      check('migra_indice', JSON.parse(store.get('scrachmo_projects')).length === 1);
      /* La copia en el slot se crea recién al cambiar de proyecto; al migrar
         alcanza con que el payload quede en la clave de siempre. */
      check('migra_payload_en_v8', (store.get('scrachmo_v8') || '').indexOf('Viejo') > -1);
      check('migra_contenido_vivo', sprites[0].name === 'Viejo');

      /* ============ 2. proyecto nuevo ============ */
      const firstId = activeProjectId;
      sprites[0].name = 'Primero';
      persistProject();
      newProject();

      check('nuevo_cambia_activo', activeProjectId !== firstId);
      check('nuevo_indice_dos', projects.length === 2);
      check('nuevo_nombre_por_defecto',
        (projects.find(p => p.id === activeProjectId) || {}).name.indexOf(UI[lang].untitledProject) === 0);
      check('nuevo_empieza_limpio', sprites.length === 1 && sprites[0].name !== 'Primero');
      check('anterior_quedo_respaldado',
        (store.get(projectKey(firstId)) || '').indexOf('Primero') > -1);
      check('v8_no_tiene_el_anterior',
        (store.get('scrachmo_v8') || '').indexOf('Primero') < 0);
      check('nombre_en_el_boton', $('#projName').textContent ===
        (projects.find(p => p.id === activeProjectId) || {}).name);

      /* ============ 3. abrir el anterior (lo importante: no se pierde) ============ */
      openProject(firstId);
      check('abre_activo', activeProjectId === firstId);
      check('abre_contenido', sprites[0].name === 'Primero');
      check('abre_pasa_a_v8', (store.get('scrachmo_v8') || '').indexOf('Primero') > -1);
      check('abre_libera_slot', !store.get(projectKey(firstId)));
      check('abre_cierra_modal', $('#projModal').hidden === true);
      /* resetHistory deja una sola entrada: la línea base del proyecto abierto. */
      check('abre_historial_limpio', undoStack.length === 1 && redoStack.length === 0);

      /* ============ 4. renombrar ============ */
      const realAskText = askText;
      askText = async () => '  Mi Juego  ';
      await renameProject(firstId);
      askText = realAskText;

      check('renombra_recorta_espacios',
        (projects.find(p => p.id === firstId) || {}).name === 'Mi Juego');
      check('renombra_pinta_boton', $('#projName').textContent === 'Mi Juego');
      check('renombra_guarda_indice',
        store.get('scrachmo_projects').indexOf('Mi Juego') > -1);

      /* Cancelar no cambia nada. */
      askText = async () => null;
      await renameProject(firstId);
      askText = realAskText;
      check('renombrar_cancelado',
        (projects.find(p => p.id === firstId) || {}).name === 'Mi Juego');

      /* ============ 5. duplicar ============ */
      duplicateProject(firstId);
      check('duplica_indice_tres', projects.length === 3);
      const copy = projects.find(p => p.id !== firstId && p.name === 'Mi Juego (2)');
      check('duplica_nombre', !!copy);
      check('duplica_payload', !!copy && (store.get(projectKey(copy.id)) || '').indexOf('Primero') > -1);
      check('duplicar_no_cambia_activo', activeProjectId === firstId);

      /* ============ 6. borrar ============ */
      const realAskConfirm = askConfirm;
      askConfirm = async () => false;
      const before = projects.length;
      await deleteProject(copy.id);
      check('borrar_cancelado', projects.length === before);

      askConfirm = async () => true;
      await deleteProject(copy.id);
      askConfirm = realAskConfirm;
      check('borra_uno', projects.length === before - 1);
      check('borra_slot', !store.get(projectKey(copy.id)));

      /* Borrar el proyecto activo salta al otro y lo carga. */
      const otro = projects.find(p => p.id !== activeProjectId);
      await (async () => {
        askConfirm = async () => true;
        await deleteProject(activeProjectId);
        askConfirm = realAskConfirm;
      })();
      check('borrar_activo_salta', activeProjectId === otro.id && projects.length === 1);
      check('borrar_activo_carga', sprites.length === 1);

      /* Nunca puede quedar cero proyectos. */
      askConfirm = async () => true;
      await deleteProject(activeProjectId);
      askConfirm = realAskConfirm;
      check('no_borra_el_ultimo', projects.length === 1);

      /* ============ 7. límite de 24 ============ */
      const savedProjects = projects.slice();
      const savedActive = activeProjectId;
      while (projects.length < MAX_PROJECTS) {
        projects.push({ id: 'relleno' + projects.length, name: 'Relleno', updatedAt: 0 });
      }
      const lleno = projects.length;
      newProject();
      check('limite_24', projects.length === lleno);
      projects = savedProjects;
      activeProjectId = savedActive;
      writeProjects();

      /* ============ 8. lista y modal ============ */
      openProjects();
      check('modal_abierto', $('#projModal').hidden === false);
      check('lista_pinta', $('#projList').querySelectorAll('.proj-item').length === projects.length);
      check('marca_el_activo', !!$('#projList .proj-item.active'));
      check('tres_acciones',
        $('#projList .proj-item.active .proj-acts').children.length === 3);
      check('bloquea_scroll', document.body.classList.contains('modal-open'));
      closeProjects();
      check('modal_cerrado', $('#projModal').hidden === true);
      check('suelta_scroll', !document.body.classList.contains('modal-open'));

      /* ============ 9. los textos en los 4 idiomas ============ */
      check('claves_4_idiomas', ['es', 'en', 'pt', 'fr'].every(l =>
        ['projectsTitle', 'projectsDesc', 'newProject', 'currentProject', 'projectName',
          'renameProject', 'duplicateProject', 'deleteProject', 'openProject', 'closeLabel',
          'untitledProject', 'projectOpened', 'projectCreated', 'projectDeleted',
          'projectRenamed', 'projectDuplicated', 'onlyOneProject', 'projectLimit', 'projectsEmpty']
          .every(k => typeof UI[l][k] === 'string' && UI[l][k].length > 0)));

      /* ============ 10. el índice sobrevive a una recarga ============ */
      const nombreAntes = projects[0].name;
      projects = [];
      activeProjectId = '';
      initProjects();
      check('relee_indice', projects.length === 1 && projects[0].name === nombreAntes);
      check('relee_activo', activeProjectId === projects[0].id);
      check('relee_contenido', (store.get('scrachmo_v8') || '').length > 20);

      check('sin_errores_final', errs.length === 0);
    } catch (err) {
      out.push('ERROR ' + err.message + ' @ ' + (err.stack || '').split('\n')[1]);
    }
    clearTimeout(watchdog);
    done();
  })();
});
