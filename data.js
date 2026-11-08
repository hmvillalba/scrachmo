
'use strict';

/* ---------------- helpers ---------------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const icon = (name, cls = '') => '<svg class="ic ' + cls + '" aria-hidden="true"><use href="#i-' + name + '"></use></svg>';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const num = (v, d) => { const n = parseFloat(v); return Number.isFinite(n) ? n : d; };
const L = (es, en, pt, fr) => ({ es, en, pt, fr });
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { } }
};

/* ---------------- texts ---------------- */
const UI = {
  es: {
    tagline: 'Programa, juega y comparte',
    stage: 'Escenario', ready: 'Listo', running: 'Ejecutando…',
    stageHint: 'Tocá el escenario para probar',
    stageHintRun: 'Usá Ejecutar para arrancar',
    score: 'PUNTOS', run: 'Ejecutar', stop: 'Detener', game: 'Modo juego', exit: 'Salir',
    code: 'Tu código', codeHint: 'Se ejecuta de arriba a abajo',
    emptyTitle: 'Todavía no hay bloques',
    emptyDesc: 'Tocá un bloque de la paleta y va a aparecer acá.',
    blocks: 'Bloques', blocksHint: 'Tocá o mantené apretado un bloque',
    search: 'Buscar bloque…', all: 'Todos', noResults: 'No encontramos bloques con ese nombre.',
    tools: 'Proyecto', toolsHint: 'Guardá, compartí o abrí tus proyectos',
    save: 'Guardar', saveSub: 'En este dispositivo',
    share: 'Compartir', shareSub: 'Link para amigos',
    export: 'Exportar', exportSub: 'Archivo .scmo',
    import: 'Importar', importSub: 'Abrir un .scmo',
    multi: 'Multijugador', multiSub: 'Jugar entre varios', multiOn: 'Activado', multiOff: 'Jugar entre varios',
    multiOnMsg: 'Multijugador activado', multiOffMsg: 'Multijugador desactivado',
    clear: 'Borrar todo', clearSub: 'Empezar de nuevo',
    shareTitle: 'Compartir proyecto',
    shareDesc: 'Copiá este link y mandalo por WhatsApp. Quien lo abra va a ver tu código.',
    copy: 'Copiar link', close: 'Cerrar',
    copied: 'Link copiado', saved: 'Proyecto guardado', cleared: 'Proyecto borrado',
    added: 'Bloque agregado', deleted: 'Bloque eliminado',
    badFile: 'Ese archivo no es válido', varName: 'Nombre de la variable', projName: 'Nombre del proyecto',
    confirmClear: '¿Borrar todo y empezar de nuevo?',
    noVars: 'Todavía no hay variables', msgSent: 'Mensaje enviado',
    deleteBlock: 'Eliminar bloque', blocksCount: 'bloques', moreBlocks: 'Agregar bloques',
    varsTitle: 'Variables', varsHint: 'Valores que guarda tu programa',
    varsEmpty: 'Todavía no hay variables', varsEmptyDesc: 'Creá una para guardar vidas, puntos o nombres.',
    newVar: 'Nueva variable', create: 'Crear', cancel: 'Cancelar',
    varNamePlaceholder: 'Nombre', varNameHint: 'Letras, números y _ (sin espacios)',
    varBadName: 'Usá letras, números o _', varExists: 'Ese nombre ya existe',
    varReserved: 'Ese nombre está reservado',
    varCreated: 'Variable creada', varDeleted: 'Variable borrada', deleteVar: 'Borrar variable',
    showOnStage: 'Mostrar en el escenario', hideOnStage: 'Ocultar del escenario',
    minusOne: 'Restar 1', plusOne: 'Sumar 1',
    dragBlock: 'Arrastrar para reordenar', reordered: 'Orden actualizado',
    reorderHint: 'Arrastrá los puntitos para cambiar el orden',
    spritesTitle: 'Personajes', spritesHint: 'Elegí un personaje para editarlo',
    chooseSprite: 'Elegí un personaje',
    chooseSpriteDesc: 'Tocá uno para agregarlo. Después podés cambiarle el nombre.',
    spriteName: 'Nombre', spriteDirection: 'Dirección', spriteSize: 'Tamaño %', spriteVisible: 'Visible', spriteHidden: 'Oculto',
    spriteRotation: 'Rotación', rotAll: 'Gira', rotLeftRight: 'Voltea', rotNone: 'Fijo',
    addSprite: 'Agregar personaje', spriteDefault: 'Personaje',
    deleteSprite: 'Borrar personaje', confirmDeleteSprite: '¿Borrar este personaje y sus bloques?',
    cantDeleteSprite: 'Tiene que quedar al menos un personaje',
    spriteAdded: 'Personaje agregado', spriteDeleted: 'Personaje borrado',
    blockHint: 'Arrastrá un bloque a "repetir", "por siempre" o "si" y queda adentro',
    elseWord: 'sino',
    codeEmpty: 'Este personaje no tiene bloques',
    codeEmptyDesc: 'Tocá un bloque de la paleta de abajo.',
    footer: 'Inspirado en Scratch · Pensado para el móvil'
  },
  en: {
    tagline: 'Code, play and share',
    stage: 'Stage', ready: 'Ready', running: 'Running…',
    stageHint: 'Tap the stage to test',
    stageHintRun: 'Press Run to start',
    score: 'SCORE', run: 'Run', stop: 'Stop', game: 'Game mode', exit: 'Exit',
    code: 'Your code', codeHint: 'Runs from top to bottom',
    emptyTitle: 'No blocks yet',
    emptyDesc: 'Tap a block from the palette and it will appear here.',
    blocks: 'Blocks', blocksHint: 'Tap a block or hold to drag it',
    search: 'Search blocks…', all: 'All', noResults: 'No blocks match that search.',
    tools: 'Project', toolsHint: 'Save, share or open your projects',
    save: 'Save', saveSub: 'On this device',
    share: 'Share', shareSub: 'Link for friends',
    export: 'Export', exportSub: '.scmo file',
    import: 'Import', importSub: 'Open a .scmo',
    multi: 'Multiplayer', multiSub: 'Play together', multiOn: 'On', multiOff: 'Play together',
    multiOnMsg: 'Multiplayer on', multiOffMsg: 'Multiplayer off',
    clear: 'Clear all', clearSub: 'Start over',
    shareTitle: 'Share project',
    shareDesc: 'Copy this link and send it on WhatsApp. Anyone who opens it will see your code.',
    copy: 'Copy link', close: 'Close',
    copied: 'Link copied', saved: 'Project saved', cleared: 'Project cleared',
    added: 'Block added', deleted: 'Block removed',
    badFile: 'That file is not valid', varName: 'Variable name', projName: 'Project name',
    confirmClear: 'Delete everything and start over?',
    noVars: 'No variables yet', msgSent: 'Message sent',
    deleteBlock: 'Delete block', blocksCount: 'blocks', moreBlocks: 'Add blocks',
    varsTitle: 'Variables', varsHint: 'Values your program keeps',
    varsEmpty: 'No variables yet', varsEmptyDesc: 'Create one to store lives, points or names.',
    newVar: 'New variable', create: 'Create', cancel: 'Cancel',
    varNamePlaceholder: 'Name', varNameHint: 'Letters, numbers and _ (no spaces)',
    varBadName: 'Use letters, numbers or _', varExists: 'That name already exists',
    varReserved: 'That name is reserved',
    varCreated: 'Variable created', varDeleted: 'Variable deleted', deleteVar: 'Delete variable',
    showOnStage: 'Show on stage', hideOnStage: 'Hide from stage',
    minusOne: 'Subtract 1', plusOne: 'Add 1',
    dragBlock: 'Drag to reorder', reordered: 'Order updated',
    reorderHint: 'Drag the dots to change the order',
    spritesTitle: 'Sprites', spritesHint: 'Pick a sprite to edit it',
    chooseSprite: 'Choose a sprite',
    chooseSpriteDesc: 'Tap one to add it. You can rename it later.',
    spriteName: 'Name', spriteDirection: 'Direction', spriteSize: 'Size %', spriteVisible: 'Visible', spriteHidden: 'Hidden',
    spriteRotation: 'Rotation', rotAll: 'All around', rotLeftRight: 'Left-right', rotNone: "Don't rotate",
    addSprite: 'Add sprite', spriteDefault: 'Sprite',
    deleteSprite: 'Delete sprite', confirmDeleteSprite: 'Delete this sprite and its blocks?',
    cantDeleteSprite: 'At least one sprite must remain',
    spriteAdded: 'Sprite added', spriteDeleted: 'Sprite deleted',
    blockHint: 'Drag a block into "repeat", "forever" or "if" and it snaps inside',
    elseWord: 'else',
    codeEmpty: 'This sprite has no blocks',
    codeEmptyDesc: 'Tap a block from the palette below.',
    footer: 'Inspired by Scratch · Made for mobile'
  },
  pt: {
    tagline: 'Programa, joga e compartilha',
    stage: 'Palco', ready: 'Pronto', running: 'Rodando…',
    stageHint: 'Toque no palco para testar',
    stageHintRun: 'Toque em Executar para começar',
    score: 'PONTOS', run: 'Executar', stop: 'Parar', game: 'Modo jogo', exit: 'Sair',
    code: 'Seu código', codeHint: 'Roda de cima para baixo',
    emptyTitle: 'Ainda não há blocos',
    emptyDesc: 'Toque em um bloco da paleta e ele aparece aqui.',
    blocks: 'Blocos', blocksHint: 'Toque ou segure um bloco',
    search: 'Buscar bloco…', all: 'Todos', noResults: 'Nenhum bloco com esse nome.',
    tools: 'Projeto', toolsHint: 'Salve, compartilhe ou abra seus projetos',
    save: 'Salvar', saveSub: 'Neste aparelho',
    share: 'Compartilhar', shareSub: 'Link para amigos',
    export: 'Exportar', exportSub: 'Arquivo .scmo',
    import: 'Importar', importSub: 'Abrir um .scmo',
    multi: 'Multijogador', multiSub: 'Jogar em grupo', multiOn: 'Ativo', multiOff: 'Jogar em grupo',
    multiOnMsg: 'Multijogador ativado', multiOffMsg: 'Multijogador desativado',
    clear: 'Apagar tudo', clearSub: 'Começar de novo',
    shareTitle: 'Compartilhar projeto',
    shareDesc: 'Copie o link e envie no WhatsApp. Quem abrir vai ver seu código.',
    copy: 'Copiar link', close: 'Fechar',
    copied: 'Link copiado', saved: 'Projeto salvo', cleared: 'Projeto apagado',
    added: 'Bloco adicionado', deleted: 'Bloco removido',
    badFile: 'Esse arquivo não é válido', varName: 'Nome da variável', projName: 'Nome do projeto',
    confirmClear: 'Apagar tudo e começar de novo?',
    noVars: 'Nenhuma variável ainda', msgSent: 'Mensagem enviada',
    deleteBlock: 'Remover bloco', blocksCount: 'blocos', moreBlocks: 'Adicionar blocos',
    varsTitle: 'Variáveis', varsHint: 'Valores que o programa guarda',
    varsEmpty: 'Ainda não há variáveis', varsEmptyDesc: 'Crie uma para guardar vidas, pontos ou nomes.',
    newVar: 'Nova variável', create: 'Criar', cancel: 'Cancelar',
    varNamePlaceholder: 'Nome', varNameHint: 'Letras, números e _ (sem espaços)',
    varBadName: 'Use letras, números ou _', varExists: 'Esse nome já existe',
    varReserved: 'Esse nome é reservado',
    varCreated: 'Variável criada', varDeleted: 'Variável apagada', deleteVar: 'Apagar variável',
    showOnStage: 'Mostrar no palco', hideOnStage: 'Ocultar do palco',
    minusOne: 'Subtrair 1', plusOne: 'Somar 1',
    dragBlock: 'Arrastar para reordenar', reordered: 'Ordem atualizada',
    reorderHint: 'Arraste os pontinhos para mudar a ordem',
    spritesTitle: 'Personagens', spritesHint: 'Escolha um personagem para editar',
    chooseSprite: 'Escolha um personagem',
    chooseSpriteDesc: 'Toque em um para adicionar. Depois pode mudar o nome.',
    spriteName: 'Nome', spriteDirection: 'Direção', spriteSize: 'Tamanho %', spriteVisible: 'Visível', spriteHidden: 'Oculto',
    spriteRotation: 'Rotação', rotAll: 'Gira', rotLeftRight: 'Vira', rotNone: 'Fixo',
    addSprite: 'Adicionar personagem', spriteDefault: 'Personagem',
    deleteSprite: 'Apagar personagem', confirmDeleteSprite: 'Apagar este personagem e seus blocos?',
    cantDeleteSprite: 'Tem que ficar pelo menos um personagem',
    spriteAdded: 'Personagem adicionado', spriteDeleted: 'Personagem apagado',
    blockHint: 'Arraste um bloco para "repetir", "para sempre" ou "se" e ele entra dentro',
    elseWord: 'senão',
    codeEmpty: 'Este personagem não tem blocos',
    codeEmptyDesc: 'Toque em um bloco da paleta abaixo.',
    footer: 'Inspirado no Scratch · Feito para o celular'
  },
  fr: {
    tagline: 'Programme, joue et partage',
    stage: 'Scène', ready: 'Prêt', running: 'En cours…',
    stageHint: 'Touche la scène pour tester',
    stageHintRun: 'Appuie sur Lancer pour démarrer',
    score: 'SCORE', run: 'Lancer', stop: 'Arrêter', game: 'Mode jeu', exit: 'Quitter',
    code: 'Ton code', codeHint: 'S’exécute de haut en bas',
    emptyTitle: 'Pas encore de blocs',
    emptyDesc: 'Touche un bloc de la palette, il apparaîtra ici.',
    blocks: 'Blocs', blocksHint: 'Touche ou maintiens un bloc',
    search: 'Chercher un bloc…', all: 'Tous', noResults: 'Aucun bloc pour cette recherche.',
    tools: 'Projet', toolsHint: 'Enregistre, partage ou ouvre tes projets',
    save: 'Enregistrer', saveSub: 'Sur cet appareil',
    share: 'Partager', shareSub: 'Lien pour les amis',
    export: 'Exporter', exportSub: 'Fichier .scmo',
    import: 'Importer', importSub: 'Ouvrir un .scmo',
    multi: 'Multijoueur', multiSub: 'Jouer à plusieurs', multiOn: 'Actif', multiOff: 'Jouer à plusieurs',
    multiOnMsg: 'Multijoueur activé', multiOffMsg: 'Multijoueur désactivé',
    clear: 'Tout effacer', clearSub: 'Recommencer',
    shareTitle: 'Partager le projet',
    shareDesc: 'Copie ce lien et envoie-le sur WhatsApp. Celui qui l’ouvre verra ton code.',
    copy: 'Copier le lien', close: 'Fermer',
    copied: 'Lien copié', saved: 'Projet enregistré', cleared: 'Projet effacé',
    added: 'Bloc ajouté', deleted: 'Bloc retiré',
    badFile: 'Ce fichier n’est pas valide', varName: 'Nom de la variable', projName: 'Nom du projet',
    confirmClear: 'Tout supprimer et recommencer ?',
    noVars: 'Pas encore de variables', msgSent: 'Message envoyé',
    deleteBlock: 'Supprimer le bloc', blocksCount: 'blocs', moreBlocks: 'Ajouter des blocs',
    varsTitle: 'Variables', varsHint: 'Valeurs gardées par ton programme',
    varsEmpty: 'Pas encore de variables', varsEmptyDesc: 'Crée-en une pour garder vies, points ou noms.',
    newVar: 'Nouvelle variable', create: 'Créer', cancel: 'Annuler',
    varNamePlaceholder: 'Nom', varNameHint: 'Lettres, chiffres et _ (sans espaces)',
    varBadName: 'Utilise des lettres, chiffres ou _', varExists: 'Ce nom existe déjà',
    varReserved: 'Ce nom est réservé',
    varCreated: 'Variable créée', varDeleted: 'Variable supprimée', deleteVar: 'Supprimer la variable',
    showOnStage: 'Montrer sur la scène', hideOnStage: 'Cacher de la scène',
    minusOne: 'Retirer 1', plusOne: 'Ajouter 1',
    dragBlock: 'Glisser pour réordonner', reordered: 'Ordre mis à jour',
    reorderHint: 'Glisse les points pour changer l’ordre',
    spritesTitle: 'Personnages', spritesHint: 'Choisis un personnage à modifier',
    chooseSprite: 'Choisis un personnage',
    chooseSpriteDesc: 'Touche-en un pour l’ajouter. Tu pourras le renommer.',
    spriteName: 'Nom', spriteDirection: 'Direction', spriteSize: 'Taille %', spriteVisible: 'Visible', spriteHidden: 'Caché',
    spriteRotation: 'Rotation', rotAll: 'Tourne', rotLeftRight: 'Miroir', rotNone: 'Fixe',
    addSprite: 'Ajouter un personnage', spriteDefault: 'Personnage',
    deleteSprite: 'Supprimer le personnage', confirmDeleteSprite: 'Supprimer ce personnage et ses blocs ?',
    cantDeleteSprite: 'Il doit rester au moins un personnage',
    spriteAdded: 'Personnage ajouté', spriteDeleted: 'Personnage supprimé',
    blockHint: 'Glisse un bloc dans « répéter », « toujours » ou « si » : il se place dedans',
    elseWord: 'sinon',
    codeEmpty: 'Ce personnage n’a pas de blocs',
    codeEmptyDesc: 'Touche un bloc de la palette ci-dessous.',
    footer: 'Inspiré de Scratch · Pensé pour le mobile'
  }
};

/* ---------------- categories ---------------- */
const CATS = [
  { id: 'motion', color: '#4C97FF', tint: '#EAF3FF', icon: 'arrow-right', name: L('Movimiento', 'Motion', 'Movimento', 'Mouvement') },
  { id: 'looks', color: '#9966FF', tint: '#F2EDFF', icon: 'palette', name: L('Apariencia', 'Looks', 'Aparência', 'Apparence') },
  { id: 'sound', color: '#CF63CF', tint: '#FBEEFB', icon: 'volume', name: L('Sonido', 'Sound', 'Som', 'Son') },
  { id: 'event', color: '#E0A800', tint: '#FFF8DB', icon: 'flag', name: L('Eventos', 'Events', 'Eventos', 'Événements') },
  { id: 'control', color: '#FFAB19', tint: '#FFF4E3', icon: 'branch', name: L('Control', 'Control', 'Controle', 'Contrôle') },
  { id: 'sensor', color: '#5CB1D6', tint: '#EDF9FD', icon: 'vibrate', name: L('Sensores', 'Sensing', 'Sensores', 'Capteurs') },
  { id: 'ops', color: '#59C059', tint: '#EDFAED', icon: 'calculator', name: L('Operadores', 'Operators', 'Operadores', 'Opérateurs') },
  { id: 'vars', color: '#FF8C1A', tint: '#FFF1E3', icon: 'box', name: L('Variables', 'Variables', 'Variáveis', 'Variables') },
  { id: 'multi', color: '#FF6680', tint: '#FFEEF1', icon: 'users', name: L('Multijugador', 'Multiplayer', 'Multijogador', 'Multijoueur') }
];
const CATMAP = Object.fromEntries(CATS.map(c => [c.id, c]));

/* ---------------- blocks ---------------- */
const BLOCKS = [
  {
    id: 'move', cat: 'motion', icon: 'arrow-right', def: 10, w: 58, num: 1,
    n: L('Mover {v} pasos', 'Move {v} steps', 'Mover {v} passos', 'Avancer de {v}'),
    d: L('Avanza el personaje hacia donde mira.', 'Moves the character forward.', 'Avança o personagem para onde ele olha.', 'Déplace le personnage vers l’avant.')
  },
  {
    id: 'turn', cat: 'motion', icon: 'rotate', def: 15, w: 58, num: 1,
    n: L('Girar {v}°', 'Turn {v}°', 'Girar {v}°', 'Tourner de {v}°'),
    d: L('Gira el personaje esa cantidad de grados.', 'Rotates the character by that many degrees.', 'Gira o personagem nessa quantidade de graus.', 'Fait tourner le personnage de ce nombre de degrés.')
  },
  {
    id: 'point_dir', cat: 'motion', icon: 'target', def: 90, w: 58, num: 1,
    n: L('Apuntar en dirección {v}', 'Point in direction {v}', 'Apontar na direção {v}', 'Pointer en direction {v}'),
    d: L('Deja el personaje mirando hacia ese ángulo (0 = arriba, 90 = derecha).', 'Points the character in that angle (0 = up, 90 = right).', 'Deixa o personagem olhando nesse ângulo (0 = cima, 90 = direita).', 'Oriente le personnage vers cet angle (0 = haut, 90 = droite).')
  },
  {
    id: 'go_random', cat: 'motion', icon: 'shuffle',
    n: L('Ir a un lugar al azar', 'Go somewhere random', 'Ir a um lugar aleatório', 'Aller au hasard'),
    d: L('Teletransporta el personaje a un punto al azar.', 'Teleports the character to a random spot.', 'Teletransporta o personagem para um ponto aleatório.', 'Téléporte le personnage à un endroit aléatoire.')
  },
  {
    id: 'bounce', cat: 'motion', icon: 'bounce',
    n: L('Rebotar', 'Bounce', 'Quicar', 'Rebondir'),
    d: L('Invierte el movimiento al chocar con el borde.', 'Reverses direction when hitting the edge.', 'Inverte o movimento ao bater na borda.', 'Inverse le mouvement au bord.')
  },
  {
    id: 'say', cat: 'looks', icon: 'speech', def: 'Hola!', w: 96,
    n: L('Decir {v}', 'Say {v}', 'Dizer {v}', 'Dire {v}'),
    d: L('Muestra un globo de diálogo.', 'Shows a speech bubble.', 'Mostra um balão de fala.', 'Affiche une bulle de dialogue.')
  },
  {
    id: 'size', cat: 'looks', icon: 'resize', def: 10, w: 58, num: 1,
    n: L('Tamaño {v}%', 'Size {v}%', 'Tamanho {v}%', 'Taille {v}%'),
    d: L('Agranda o achica el personaje.', 'Makes the character bigger or smaller.', 'Aumenta ou diminui o personagem.', 'Agrandit ou réduit le personnage.')
  },
  {
    id: 'hide', cat: 'looks', icon: 'eye-off',
    n: L('Esconder', 'Hide', 'Esconder', 'Cacher'),
    d: L('Oculta el personaje del escenario.', 'Hides the character.', 'Esconde o personagem.', 'Cache le personnage.')
  },
  {
    id: 'show', cat: 'looks', icon: 'eye',
    n: L('Mostrar', 'Show', 'Mostrar', 'Montrer'),
    d: L('Vuelve a mostrar el personaje.', 'Shows the character again.', 'Mostra o personagem de novo.', 'Réaffiche le personnage.')
  },
  {
    id: 'change_bg', cat: 'looks', icon: 'palette',
    n: L('Cambiar fondo', 'Change background', 'Mudar fundo', 'Changer le fond'),
    d: L('Cambia el color del escenario.', 'Changes the stage color.', 'Muda a cor do palco.', 'Change la couleur de la scène.')
  },
  {
    id: 'meow', cat: 'sound', icon: 'volume',
    n: L('Miau', 'Meow', 'Miau', 'Miaou'),
    d: L('Reproduce el sonido de un miau.', 'Plays a meow sound.', 'Toca o som de um miau.', 'Joue un miaou.')
  },
  {
    id: 'pop', cat: 'sound', icon: 'volume',
    n: L('Pop', 'Pop', 'Pop', 'Pop'),
    d: L('Reproduce un sonido corto.', 'Plays a short pop sound.', 'Toca um som curto.', 'Joue un petit son.')
  },
  {
    id: 'when_flag', cat: 'event', icon: 'flag', hat: 1,
    n: L('Al iniciar', 'On start', 'Ao iniciar', 'Au démarrage'),
    d: L('Arranca el programa cuando tocás Ejecutar.', 'Starts when you press Run.', 'Começa quando você toca Executar.', 'Démarre quand tu appuies sur Lancer.')
  },
  {
    id: 'when_tap', cat: 'event', icon: 'pointer', hat: 1,
    n: L('Al tocar', 'On tap', 'Ao tocar', 'Au toucher'),
    d: L('Se activa cuando tocás el escenario.', 'Triggers when you tap the stage.', 'Ativa quando você toca o palco.', 'Se déclenche quand tu touches la scène.')
  },
  {
    id: 'when_key', cat: 'event', icon: 'keyboard', def: 'espacio', w: 88, hat: 1,
    n: L('Al presionar {v}', 'When {v} pressed', 'Ao pressionar {v}', 'Touche {v} pressée'),
    d: L('Se activa al presionar una tecla.', 'Triggers when you press a key.', 'Ativa quando você aperta uma tecla.', 'Se déclenche quand tu appuies sur une touche.')
  },
  {
    id: 'when_score', cat: 'event', icon: 'trophy', def: 10, w: 58, num: 1, hat: 1,
    n: L('Al llegar a {v}', 'When score is {v}', 'Ao chegar a {v}', 'Score à {v}'),
    d: L('Se activa cuando el puntaje llega a ese número.', 'Triggers when the score reaches that number.', 'Ativa quando os pontos chegam a esse número.', 'Se déclenche quand le score atteint ce nombre.')
  },
  {
    id: 'repeat', cat: 'control', icon: 'repeat', def: 4, w: 50, num: 1, c: 1,
    n: L('Repetir {v} veces', 'Repeat {v} times', 'Repetir {v} vezes', 'Répéter {v} fois'),
    d: L('Envuelve y repite los bloques de adentro.', 'Wraps and repeats the blocks inside.', 'Envolve e repete os blocos de dentro.', 'Entoure et répète les blocs à l’intérieur.')
  },
  {
    id: 'forever', cat: 'control', icon: 'infinity', c: 1,
    n: L('Por siempre', 'Forever', 'Para sempre', 'Toujours'),
    d: L('Envuelve los bloques y los repite sin parar.', 'Wraps blocks and repeats them forever.', 'Envolve os blocos e repete sem parar.', 'Entoure les blocs et les répète sans fin.')
  },
  {
    id: 'wait', cat: 'control', icon: 'clock', def: 1, w: 50, num: 1,
    n: L('Esperar {v} seg', 'Wait {v} sec', 'Esperar {v} seg', 'Attendre {v} s'),
    d: L('Hace una pausa antes del siguiente bloque.', 'Pauses before the next block.', 'Faz uma pausa antes do próximo bloco.', 'Fait une pause avant le bloc suivant.')
  },
  {
    id: 'if_tilt', cat: 'control', icon: 'tilt', c: 1,
    n: L('Si está inclinado', 'If tilted', 'Se inclinado', 'Si incliné'),
    d: L('Envuelve bloques que se ejecutan si inclinás el teléfono.', 'Wraps blocks that run if the phone is tilted.', 'Envolve blocos que rodam se você inclinar o celular.', 'Entoure des blocs exécutés si le téléphone est incliné.')
  },
  {
    id: 'if_score', cat: 'control', icon: 'target', def: 5, w: 46, num: 1, c: 1,
    n: L('Si puntos > {v}', 'If score > {v}', 'Se pontos > {v}', 'Si score > {v}'),
    d: L('Envuelve bloques que se ejecutan si el puntaje es mayor.', 'Wraps blocks that run if the score is higher.', 'Envolve blocos que rodam se os pontos forem maiores.', 'Entoure des blocs exécutés si le score est plus grand.')
  },
  {
    id: 'if_cond', cat: 'control', icon: 'branch', def: 'score > 5', w: 104, c: 1, bool: 1,
    n: L('Si {v} entonces', 'If {v} then', 'Se {v} então', 'Si {v} alors'),
    d: L('Envuelve bloques que se ejecutan si la condición es verdadera.', 'Wraps blocks that run when the condition is true.', 'Envolve blocos que rodam se a condição for verdadeira.', 'Entoure des blocs exécutés si la condition est vraie.')
  },
  {
    id: 'if_else', cat: 'control', icon: 'branch', def: 'score > 5', w: 104, c: 1, else: 1, bool: 1,
    n: L('Si {v} entonces', 'If {v} then', 'Se {v} então', 'Si {v} alors'),
    d: L('Hace una cosa u otra según la condición, con dos espacios.', 'Does one thing or another, with two slots.', 'Faz uma coisa ou outra, com dois espaços.', 'Fait une chose ou une autre, avec deux espaces.')
  },
  {
    id: 'sino', cat: 'control', icon: 'branch', c: 1, legacy: 1,
    n: L('Sino', 'Else', 'Senão', 'Sinon'),
    d: L('Hace algo si la condición anterior falló.', 'Runs when the previous condition failed.', 'Roda se a condição anterior falhou.', 'S’exécute si la condition précédente est fausse.')
  },
  {
    id: 'when_shake', cat: 'sensor', icon: 'phone', hat: 1,
    n: L('Al agitar', 'On shake', 'Ao agitar', 'En secouant'),
    d: L('Se activa si agitás el teléfono.', 'Triggers when you shake the phone.', 'Ativa quando você agita o celular.', 'Se déclenche quand tu secoues le téléphone.')
  },
  {
    id: 'vibrate', cat: 'sensor', icon: 'vibrate', def: 200, w: 62, num: 1,
    n: L('Vibrar {v} ms', 'Vibrate {v} ms', 'Vibrar {v} ms', 'Vibrer {v} ms'),
    d: L('Hace vibrar el teléfono.', 'Makes the phone vibrate.', 'Faz o celular vibrar.', 'Fait vibrer le téléphone.')
  },
  {
    id: 'op_random', cat: 'ops', icon: 'dice', def: '1,10', w: 66,
    n: L('Al azar {v}', 'Random {v}', 'Aleatório {v}', 'Aléatoire {v}'),
    d: L('Saca un número al azar entre dos (1,10).', 'Picks a random number between two (1,10).', 'Sorteia um número entre dois (1,10).', 'Tire un nombre entre deux (1,10).')
  },
  {
    id: 'op_calc', cat: 'ops', icon: 'calculator', def: '1+1', w: 66,
    n: L('Calcular {v}', 'Calculate {v}', 'Calcular {v}', 'Calculer {v}'),
    d: L('Resuelve una cuenta (ej: 2+2) y la guarda en res.', 'Solves a math expression and saves it in res.', 'Resolve uma conta e guarda em res.', 'Calcule une opération et la range dans res.')
  },
  {
    id: 'score_add', cat: 'vars', icon: 'plus', def: 1, w: 46, num: 1,
    n: L('Sumar {v} al marcador', 'Add {v} to score', 'Somar {v} ao placar', 'Ajouter {v} au score'),
    d: L('Agrega puntos al marcador.', 'Adds points to the score.', 'Adiciona pontos ao placar.', 'Ajoute des points au score.')
  },
  {
    id: 'score_set', cat: 'vars', icon: 'target', def: 10, w: 46, num: 1,
    n: L('Poner puntos en {v}', 'Set score to {v}', 'Definir pontos {v}', 'Score = {v}'),
    d: L('Deja el marcador en ese número.', 'Sets the score to that number.', 'Deixa o placar nesse número.', 'Met le score à ce nombre.')
  },
  {
    id: 'score_reset', cat: 'vars', icon: 'rotate-ccw',
    n: L('Reiniciar puntos', 'Reset score', 'Zerar pontos', 'Remettre à zéro'),
    d: L('Vuelve el marcador a cero.', 'Sets the score back to zero.', 'Volta o placar para zero.', 'Remet le score à zéro.')
  },
  {
    id: 'create_var', cat: 'vars', icon: 'box',
    n: L('Crear variable', 'Create variable', 'Criar variável', 'Créer une variable'),
    d: L('Crea una variable nueva con un nombre.', 'Creates a new variable with a name.', 'Cria uma variável nova com um nome.', 'Crée une nouvelle variable avec un nom.')
  },
  {
    id: 'set_var', cat: 'vars', icon: 'edit', def: 'nombre=0', w: 98,
    n: L('Poner {v}', 'Set {v}', 'Pôr {v}', 'Mettre {v}'),
    d: L('Guarda un valor en una variable (nombre=valor).', 'Stores a value in a variable (name=value).', 'Guarda um valor numa variável (nome=valor).', 'Stocke une valeur (nom=valeur).')
  },
  {
    id: 'add_var', cat: 'vars', icon: 'plus', def: 'nombre=1', w: 98,
    n: L('Sumar a {v}', 'Add to {v}', 'Somar a {v}', 'Ajouter à {v}'),
    d: L('Suma una cantidad a una variable (nombre=valor).', 'Adds an amount to a variable (name=value).', 'Soma um valor a uma variável (nome=valor).', 'Ajoute une valeur (nom=valeur).')
  },
  {
    id: 'sub_var', cat: 'vars', icon: 'minus', def: 'nombre=1', w: 98,
    n: L('Restar a {v}', 'Subtract {v}', 'Subtrair de {v}', 'Soustraire à {v}'),
    d: L('Resta una cantidad a una variable (nombre=valor).', 'Subtracts from a variable (name=value).', 'Subtrai de uma variável (nome=valor).', 'Retire une valeur (nom=valeur).')
  },
  {
    id: 'show_vars', cat: 'vars', icon: 'list',
    n: L('Mostrar variables', 'Show variables', 'Mostrar variáveis', 'Montrer les variables'),
    d: L('Muestra todas las variables y sus valores.', 'Lists all variables and their values.', 'Mostra todas as variáveis e valores.', 'Affiche toutes les variables.')
  },
  {
    id: 'when_msg', cat: 'multi', icon: 'message', hat: 1,
    n: L('Al recibir mensaje', 'On message', 'Ao receber mensagem', 'À la réception'),
    d: L('Se activa al recibir un mensaje de otro jugador.', 'Triggers when another player sends a message.', 'Ativa ao receber mensagem de outro jogador.', 'Se déclenche à la réception d’un message.')
  },
  {
    id: 'send_msg', cat: 'multi', icon: 'send',
    n: L('Enviar mensaje', 'Send message', 'Enviar mensagem', 'Envoyer un message'),
    d: L('Avisa a los otros jugadores por la red local.', 'Sends a message to other players.', 'Avisa os outros jogadores.', 'Préviens les autres joueurs.')
  },
  {
    id: 'show2', cat: 'multi', icon: 'eye', legacy: 1,
    n: L('Mostrar amigo', 'Show friend', 'Mostrar amigo', 'Montrer l’ami'),
    d: L('Muestra al segundo personaje (🐶).', 'Shows the second character (🐶).', 'Mostra o segundo personagem (🐶).', 'Montre le deuxième personnage (🐶).')
  },
  {
    id: 'hide2', cat: 'multi', icon: 'eye-off', legacy: 1,
    n: L('Esconder amigo', 'Hide friend', 'Esconder amigo', 'Cacher l’ami'),
    d: L('Oculta al segundo personaje.', 'Hides the second character.', 'Esconde o segundo personagem.', 'Cache le deuxième personnage.')
  },
  {
    id: 'move2', cat: 'multi', icon: 'arrow-right', def: 10, w: 58, num: 1, legacy: 1,
    n: L('Mover amigo {v}', 'Move friend {v}', 'Mover amigo {v}', 'Déplacer l’ami {v}'),
    d: L('Mueve al segundo personaje.', 'Moves the second character.', 'Move o segundo personagem.', 'Déplace le deuxième personnage.')
  }
];
const BYID = Object.fromEntries(BLOCKS.map(b => [b.id, b]));
const PALETTE_BLOCKS = BLOCKS.filter(b => !b.legacy);
