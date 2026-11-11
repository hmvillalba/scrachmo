
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
/* Versión que se muestra en «Acerca de». sw.js arma el nombre de la caché
   con esta misma cadena más una huella de los tres archivos de la app;
   tests/check-parity.js verifica que no se desincronicen y
   tests/bump-sw.js los actualiza juntos. */
const APP_VERSION = 'v11';
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
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
    exportSb3: 'A Scratch', exportSb3Sub: 'Archivo .sb3',
    sb3Done: 'Listo: se descargó el .sb3',
    sb3Dropped: 'bloques sin equivalente (quedan anotados en un comentario)',
    sb3WorldSize: 'Scratch mide siempre 480 × 360: lo que quede afuera no se va a ver',
    sb3Comment: 'ScrachMo: esto no tiene equivalente en Scratch',
    sb3Fail: 'No se pudo armar el .sb3',
    import: 'Importar', importSub: 'Abrir un .scmo',
    multi: 'Mensajes', multiSub: 'Sólo en este navegador', multiOn: 'Mensajes activados', multiOff: 'Mensajes desactivados',
    multiOnMsg: 'Mensajes activados', multiOffMsg: 'Mensajes desactivados',
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
    exportSb3: 'To Scratch', exportSb3Sub: '.sb3 file',
    sb3Done: 'Done: the .sb3 was downloaded',
    sb3Dropped: 'blocks with no equivalent (noted in a comment)',
    sb3WorldSize: 'Scratch is always 480 × 360: anything outside will be off-stage',
    sb3Comment: 'ScrachMo: this has no equivalent in Scratch',
    sb3Fail: 'Could not build the .sb3',
    import: 'Import', importSub: 'Open a .scmo',
    multi: 'Messages', multiSub: 'This browser only', multiOn: 'Messages on', multiOff: 'Messages off',
    multiOnMsg: 'Messages on', multiOffMsg: 'Messages off',
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
    exportSb3: 'Para o Scratch', exportSb3Sub: 'Arquivo .sb3',
    sb3Done: 'Pronto: o .sb3 foi baixado',
    sb3Dropped: 'blocos sem equivalente (anotados num comentário)',
    sb3WorldSize: 'O Scratch sempre mede 480 × 360: o que ficar fora não vai aparecer',
    sb3Comment: 'ScrachMo: isto não tem equivalente no Scratch',
    sb3Fail: 'Não foi possível montar o .sb3',
    import: 'Importar', importSub: 'Abrir um .scmo',
    multi: 'Mensagens', multiSub: 'Só neste navegador', multiOn: 'Mensagens ativadas', multiOff: 'Mensagens desativadas',
    multiOnMsg: 'Mensagens ativadas', multiOffMsg: 'Mensagens desativadas',
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
    exportSb3: 'Vers Scratch', exportSb3Sub: 'Fichier .sb3',
    sb3Done: 'C’est fait : le .sb3 a été téléchargé',
    sb3Dropped: 'blocs sans équivalent (notés dans un commentaire)',
    sb3WorldSize: 'Scratch mesure toujours 480 × 360 : ce qui dépasse ne sera pas visible',
    sb3Comment: 'ScrachMo : ceci n’a pas d’équivalent dans Scratch',
    sb3Fail: 'Impossible de construire le .sb3',
    import: 'Importer', importSub: 'Ouvrir un .scmo',
    multi: 'Messages', multiSub: 'Dans ce navigateur seulement', multiOn: 'Messages activés', multiOff: 'Messages désactivés',
    multiOnMsg: 'Messages activés', multiOffMsg: 'Messages désactivés',
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
  { id: 'multi', color: '#FF6680', tint: '#FFEEF1', icon: 'message', name: L('Mensajes', 'Messages', 'Mensagens', 'Messages') }
];
const CATMAP = Object.fromEntries(CATS.map(c => [c.id, c]));

/* ---------------- sonidos y melodías ----------------
   Todo se sintetiza con WebAudio en el momento de reproducir: no hay archivos
   de audio, así la app sigue abriendo con doble clic (file://) y la PWA no
   tiene que cachear nada extra. Cada paso es
   [frecuencia, duración, forma de onda, barrido opcional]; la frecuencia 0 es
   un silencio y 'noise' genera ruido filtrado (golpes, explosión, aplauso).
   El id es lo que se guarda en el bloque; el nombre es lo que se muestra, así
   que cambiar de idioma no rompe los proyectos. */
const SOUND_LIB = [
  { id: 'beep', name: L('Pitido', 'Beep', 'Bip', 'Bip'), steps: [[880, .12, 'square']] },
  { id: 'meow', name: L('Miau', 'Meow', 'Miau', 'Miaou'), steps: [[560, .3, 'sine', 760]] },
  { id: 'pop', name: L('Pop', 'Pop', 'Pop', 'Pop'), steps: [[1180, .07, 'triangle']] },
  { id: 'coin', name: L('Moneda', 'Coin', 'Moeda', 'Pièce'), steps: [[988, .08, 'square'], [1319, .22, 'square']] },
  { id: 'jump', name: L('Salto', 'Jump', 'Pulo', 'Saut'), steps: [[330, .18, 'sine', 900]] },
  { id: 'boom', name: L('Explosión', 'Explosion', 'Explosão', 'Explosion'), steps: [['noise', .45, 700]] },
  { id: 'clap', name: L('Aplauso', 'Clap', 'Palmas', 'Applaudissement'), steps: [['noise', .06, 1900], ['noise', .06, 1500], ['noise', .09, 1100]] },
  { id: 'bell', name: L('Campana', 'Bell', 'Sino', 'Cloche'), steps: [[1318, .5, 'sine'], [1046, .6, 'sine']] }
];

/* Teclas del bloque «al presionar»: el id es el valor de `e.key` en
   minúsculas —la barra espaciadora es un espacio—, que es con lo que compara
   el motor. Las letras y los números se agregan abajo. */
const KEY_LIB = [
  { id: ' ', name: L('Espacio', 'Space', 'Espaço', 'Espace') },
  { id: 'enter', name: L('Enter', 'Enter', 'Enter', 'Entrée') },
  { id: 'arrowup', name: L('↑ Arriba', '↑ Up', '↑ Cima', '↑ Haut') },
  { id: 'arrowdown', name: L('↓ Abajo', '↓ Down', '↓ Baixo', '↓ Bas') },
  { id: 'arrowleft', name: L('← Izquierda', '← Left', '← Esquerda', '← Gauche') },
  { id: 'arrowright', name: L('→ Derecha', '→ Right', '→ Direita', '→ Droite') }
];
'abcdefghijklmnopqrstuvwxyz'.split('').concat('0123456789'.split('')).forEach(ch => {
  const up = ch.toUpperCase();
  KEY_LIB.push({ id: ch, name: { es: up, en: up, pt: up, fr: up } });
});

const MELODY_LIB = [
  {
    id: 'happy', name: L('Alegre', 'Happy', 'Alegre', 'Joyeuse'),
    steps: [[523, .16], [659, .16], [784, .16], [1046, .24], [784, .16], [1046, .4], [0, .16]]
  },
  {
    id: 'sad', name: L('Triste', 'Sad', 'Triste', 'Triste'),
    steps: [[440, .3], [415, .3], [392, .3], [349, .5], [0, .2]]
  },
  {
    id: 'game', name: L('De juego', 'Game', 'De jogo', 'De jeu'),
    steps: [[659, .1], [784, .1], [988, .1], [1319, .16], [988, .1], [1319, .24], [0, .12]]
  }
];

const SOUNDMAP = Object.fromEntries(SOUND_LIB.map(s => [s.id, s]));
const MELODYMAP = Object.fromEntries(MELODY_LIB.map(m => [m.id, m]));

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
  /* Dos huecos en la etiqueta ({x} e {y}) pero un solo val escalar con
     formato "x,y". Así no cambia el formato de los proyectos ni de los
     links compartidos: makeNode, normalizeNodes y cloneNodeTree siguen igual. */
  {
    id: 'go_xy', cat: 'motion', icon: 'target', def: '0,0', w: 58, num: 1,
    n: L('Ir a x: {x} y: {y}', 'Go to x: {x} y: {y}', 'Ir para x: {x} y: {y}', 'Aller à x : {x} y : {y}'),
    d: L('Salta directo a esa coordenada. x va de -240 a 240 e y de -180 a 180.', 'Jumps straight to that coordinate. x goes from -240 to 240 and y from -180 to 180.', 'Vai direto para essa coordenada. x vai de -240 a 240 e y de -180 a 180.', 'Va directement à cette coordonnée. x va de -240 à 240 et y de -180 à 180.')
  },
  {
    id: 'bounce', cat: 'motion', icon: 'bounce',
    n: L('Rebotar si toca el borde', 'Bounce if on edge', 'Rebater se tocar a borda', 'Rebondir au bord'),
    d: L('Da media vuelta y vuelve al escenario cuando llega al borde.', 'Turns around and comes back when it hits the edge.', 'Dá meia-volta e volta ao cenário quando chega à borda.', 'Fait demi-tour et revient dans la scène au bord.')
  },
  {
    id: 'go_random', cat: 'motion', icon: 'shuffle',
    n: L('Ir a un lugar al azar', 'Go somewhere random', 'Ir a um lugar aleatório', 'Aller au hasard'),
    d: L('Teletransporta el personaje a un punto al azar.', 'Teleports the character to a random spot.', 'Teletransporta o personagem para um ponto aleatório.', 'Téléporte le personnage à un endroit aléatoire.')
  },
  {
    id: 'say', cat: 'looks', icon: 'speech', def: 'Hola!', w: 132, zoom: 1,
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
    id: 'next_costume', cat: 'looks', icon: 'shuffle',
    n: L('Siguiente disfraz', 'Next costume', 'Próximo traje', 'Costume suivant'),
    d: L('Pasa al disfraz siguiente. Con «repetir» y «mover» simula una animación.', 'Switches to the next costume. Combine with repeat and move to animate.', 'Vai para o próximo traje. Com repetir e mover simula uma animação.', 'Passe au costume suivant. Avec répéter et avancer, simule une animation.')
  },
  {
    id: 'switch_costume', cat: 'looks', icon: 'palette', def: 1, w: 116, costume: 1,
    n: L('Cambiar disfraz a {v}', 'Switch costume to {v}', 'Mudar traje para {v}', 'Changer de costume : {v}'),
    d: L('Muestra el disfraz que elijas.', 'Shows the costume you pick.', 'Mostra o traje escolhido.', 'Affiche le costume choisi.')
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
    id: 'play_sound', cat: 'sound', icon: 'volume', def: 'beep', w: 104, pick: 'sounds',
    n: L('Reproducir sonido {v}', 'Play sound {v}', 'Tocar som {v}', 'Jouer le son {v}'),
    d: L('Reproduce el sonido que elijas. No espera a que termine: para eso usá «esperar».', 'Plays the sound you pick. It does not wait for it to finish: use «wait» for that.', 'Toca o som escolhido. Não espera terminar: para isso use «esperar».', 'Joue le son choisi. N’attend pas la fin : utilise « attendre » pour ça.')
  },
  {
    id: 'play_music', cat: 'sound', icon: 'music', def: 'happy', w: 104, pick: 'melodies',
    n: L('Tocar música {v}', 'Play music {v}', 'Tocar música {v}', 'Jouer la musique {v}'),
    d: L('Empieza una melodía en bucle hasta que la detengas o pongas otra.', 'Starts a melody looping until you stop it or play another one.', 'Começa uma melodia em loop até você parar ou tocar outra.', 'Démarre une mélodie en boucle jusqu’à l’arrêt ou une autre mélodie.')
  },
  {
    id: 'stop_sounds', cat: 'sound', icon: 'volume-x',
    n: L('Detener los sonidos', 'Stop all sounds', 'Parar os sons', 'Arrêter les sons'),
    d: L('Corta lo que esté sonando, incluida la música.', 'Stops everything that is playing, music included.', 'Corta o que estiver tocando, inclusive a música.', 'Coupe tout ce qui joue, musique comprise.')
  },
  {
    id: 'set_volume', cat: 'sound', icon: 'volume', def: 100, w: 44, num: 1,
    n: L('Fijar volumen en {v} %', 'Set volume to {v} %', 'Definir volume em {v} %', 'Mettre le volume à {v} %'),
    d: L('Deja el volumen en ese porcentaje (0 a 100). Se guarda con el proyecto.', 'Sets the volume to that percentage (0 to 100). It is saved with the project.', 'Deixa o volume nessa porcentagem (0 a 100). Fica salvo com o projeto.', 'Met le volume à ce pourcentage (0 à 100). Il est enregistré avec le projet.')
  },
  {
    id: 'change_volume', cat: 'sound', icon: 'volume', def: -10, w: 44, num: 1,
    n: L('Cambiar volumen en {v}', 'Change volume by {v}', 'Mudar volume em {v}', 'Changer le volume de {v}'),
    d: L('Sube o baja el volumen esa cantidad. Con números negativos baja.', 'Raises or lowers the volume by that amount. Negative numbers lower it.', 'Aumenta ou abaixa o volume nessa quantidade. Com números negativos abaixa.', 'Monte ou baisse le volume de ce montant. Les nombres négatifs le baissent.')
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
    id: 'when_key', cat: 'event', icon: 'keyboard', def: ' ', w: 104, hat: 1, pick: 'keys',
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
    id: 'if_edge', cat: 'control', icon: 'flag', c: 1,
    n: L('Si toca el borde', 'If on the edge', 'Se toca a borda', 'Si touche le bord'),
    d: L('Envuelve bloques que se ejecutan si el personaje llegó al borde del escenario.', 'Wraps blocks that run when the character reaches the stage edge.', 'Envolve blocos que rodam quando o personagem chega à borda do cenário.', 'Entoure des blocs exécutés quand le personnage atteint le bord de la scène.')
  },
  {
    id: 'if_touch', cat: 'control', icon: 'pointer', c: 1,
    n: L('Si toca a otro personaje', 'If touching another sprite', 'Se toca outro personagem', 'Si touche un autre personnage'),
    d: L('Envuelve bloques que se ejecutan si se cruza con otro personaje visible.', 'Wraps blocks that run when it overlaps another visible sprite.', 'Envolve blocos que rodam quando cruza com outro personagem visível.', 'Entoure des blocs exécutés quand il croise un autre personnage visible.')
  },
  {
    id: 'if_touch_sprite', cat: 'control', icon: 'pointer', def: 'self', w: 104, pick: 'sprites', c: 1,
    n: L('Si toca a {v}', 'If touching {v}', 'Se toca {v}', 'Si touche {v}'),
    d: L('Envuelve bloques que se ejecutan si se cruza con ese personaje o con cualquiera de sus clones. Con «mí mismo» se comporta como «si toca a otro personaje».', 'Wraps blocks that run when it overlaps that sprite or any of its clones. With «myself» it behaves like «if touching another sprite».', 'Envolve blocos que rodam quando cruza com esse personagem ou qualquer clone dele. Com «eu mesmo» funciona como «se toca outro personagem».', 'Entoure des blocs exécutés quand il croise ce personnage ou l’un de ses clones. Avec « moi-même », se comporte comme « si touche un autre personnage ».')
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
  /* Clones. El clon es una copia viva del personaje con su propia posición,
     tamaño, dirección y disfraz, pero comparte los guiones y las variables.
     Vive sólo mientras dura la ejecución: no se guarda en el proyecto. */
  {
    id: 'when_clone', cat: 'control', icon: 'copy', hat: 1,
    n: L('Al comenzar como clon', 'When I start as a clone', 'Ao começar como clone', 'Quand je démarre en clone'),
    d: L('Arranca en cada clon, justo en el momento en que se crea.', 'Starts in every clone, the moment it is created.', 'Começa em cada clone, no momento em que é criado.', 'Démarre dans chaque clone, dès sa création.')
  },
  {
    id: 'create_clone', cat: 'control', icon: 'copy', def: 'self', w: 104, pick: 'sprites',
    n: L('Crear clon de {v}', 'Create clone of {v}', 'Criar clone de {v}', 'Créer un clone de {v}'),
    d: L('Hace una copia del personaje, con su posición, tamaño y disfraz de ese momento. La copia corre el guion de «al comenzar como clon».', 'Makes a copy of the sprite with its position, size and costume at that moment. The copy runs the «when I start as a clone» script.', 'Faz uma cópia do personagem, com sua posição, tamanho e fantasia daquele momento. A cópia roda o guião de «ao começar como clone».', 'Fait une copie du personnage avec sa position, sa taille et son costume du moment. La copie exécute le script « quand je démarre en clone ».')
  },
  {
    id: 'delete_clone', cat: 'control', icon: 'trash',
    n: L('Borrar este clon', 'Delete this clone', 'Apagar este clone', 'Supprimer ce clone'),
    d: L('Hace desaparecer al clon que lo ejecuta. En el personaje original no hace nada.', 'Removes the clone that runs it. On the original sprite it does nothing.', 'Faz desaparecer o clone que o executa. No personagem original não faz nada.', 'Fait disparaître le clone qui l’exécute. Sur le personnage d’origine, ne fait rien.')
  },
  {
    id: 'delete_touched_clone', cat: 'control', icon: 'trash', def: 'self', w: 104, pick: 'sprites',
    n: L('Borrar el clon de {v} que toco', 'Delete the clone of {v} I touch', 'Apagar o clone de {v} que toco', 'Supprimer le clone de {v} que je touche'),
    d: L('Hace desaparecer el clon de ese personaje que está tocando el que lo ejecuta. Sirve para que un disparo destruya lo que impacta. Si toca al original, no hace nada.', 'Removes the clone of that sprite that the runner is touching. Use it so a shot destroys what it hits. If it touches the original, it does nothing.', 'Faz desaparecer o clone desse personagem que está tocando quem o executa. Serve para um tiro destruir o que atinge. Se tocar no original, não faz nada.', 'Fait disparaître le clone de ce personnage que touche celui qui l’exécute. Sert à ce qu’un tir détruise ce qu’il frappe. S’il touche l’original, ne fait rien.')
  },
  {
    id: 'when_shake', cat: 'sensor', icon: 'phone', hat: 1,
    n: L('Al agitar', 'On shake', 'Ao agitar', 'En secouant'),
    d: L('Se activa si agitás el teléfono.', 'Triggers when you shake the phone.', 'Ativa quando você agita o celular.', 'Se déclenche quand tu secoues le téléphone.')
  },
  {
    id: 'timer_reset', cat: 'sensor', icon: 'rotate-ccw',
    n: L('Reiniciar cronómetro', 'Reset timer', 'Reiniciar cronômetro', 'Réinitialiser le chrono'),
    d: L('Vuelve el cronómetro a cero. Después lo leés con el reportero «Cronómetro».', 'Sets the timer back to zero. Read it with the "Timer" reporter.', 'Volta o cronômetro a zero. Depois leia com o repórter «Cronômetro».', 'Remet le chrono à zéro. Lisez-le avec le rapporteur « Chronomètre ».')
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
    d: L('Se activa con un mensaje de este navegador. No llega de otros dispositivos.', 'Triggers on a message from this same browser, not from another device.', 'Ativa com uma mensagem deste navegador, não de outro aparelho.', 'Se déclenche avec un message de ce navigateur, pas d’un autre appareil.')
  },
  {
    id: 'send_msg', cat: 'multi', icon: 'send',
    n: L('Enviar mensaje', 'Send message', 'Enviar mensagem', 'Envoyer un message'),
    d: L('Avisa a los guiones del proyecto y a otras pestañas del mismo navegador. No usa la red.', 'Notifies this project’s scripts and other tabs of the same browser. No network involved.', 'Avisa os scripts do projeto e outras abas do mesmo navegador. Sem rede.', 'Prévient les scripts du projet et les autres onglets du même navigateur. Sans réseau.')
  },
  /* ---------------- reporteros ----------------
     Un reportero NO es un enunciado: devuelve un valor y vive dentro de la
     casilla de otro bloque (node.reps[i]). No aparecen en la paleta normal,
     sino en el selector que abre el botón ƒ de cada casilla. Tienen rep: 1,
     pueden tener huecos propios y por eso se pueden anidar. */
  {
    id: 'rep_score', cat: 'ops', icon: 'trophy', rep: 1,
    n: L('Puntos', 'Score', 'Pontos', 'Score'),
    d: L('Devuelve el puntaje actual.', 'Returns the current score.', 'Devolve a pontuação atual.', 'Renvoie le score actuel.')
  },
  {
    id: 'rep_timer', cat: 'ops', icon: 'clock', rep: 1,
    n: L('Cronómetro', 'Timer', 'Cronômetro', 'Chronomètre'),
    d: L('Devuelve los segundos desde que abriste el proyecto o desde el último reinicio.', 'Returns the seconds since you opened the project or since the last reset.', 'Devolve os segundos desde que abriu o projeto ou desde o último reinicio.', 'Renvoie les secondes depuis l’ouverture du projet ou la dernière remise à zéro.')
  },
  {
    id: 'rep_x', cat: 'ops', icon: 'target', rep: 1,
    n: L('Posición x', 'X position', 'Posição x', 'Position x'),
    d: L('Devuelve la coordenada x del personaje.', 'Returns the character’s x coordinate.', 'Devolve a coordenada x do personagem.', 'Renvoie la coordonnée x du personnage.')
  },
  {
    id: 'rep_y', cat: 'ops', icon: 'target', rep: 1,
    n: L('Posición y', 'Y position', 'Posição y', 'Position y'),
    d: L('Devuelve la coordenada y del personaje.', 'Returns the character’s y coordinate.', 'Devolve a coordenada y do personagem.', 'Renvoie la coordonnée y du personnage.')
  },
  {
    id: 'rep_var', cat: 'ops', icon: 'box', rep: 1, repName: 1, def: 'vidas', w: 76,
    n: L('Variable {v}', 'Variable {v}', 'Variável {v}', 'Variable {v}'),
    d: L('Devuelve el valor de la variable que escribas.', 'Returns the value of the variable you type.', 'Devolve o valor da variável que você escrever.', 'Renvoie la valeur de la variable indiquée.')
  },
  {
    id: 'rep_random', cat: 'ops', icon: 'dice', rep: 1, def: '1,10', w: 52,
    n: L('Al azar {x} a {y}', 'Random {x} to {y}', 'Aleatório {x} a {y}', 'Aléatoire {x} à {y}'),
    d: L('Devuelve un número entero entre los dos valores.', 'Returns a whole number between the two values.', 'Devolve um número inteiro entre os dois valores.', 'Renvoie un entier entre les deux valeurs.')
  },
  {
    id: 'rep_add', cat: 'ops', icon: 'plus', rep: 1, def: '1,1', w: 46,
    n: L('{x} + {y}', '{x} + {y}', '{x} + {y}', '{x} + {y}'),
    d: L('Suma los dos valores.', 'Adds the two values.', 'Soma os dois valores.', 'Additionne les deux valeurs.')
  },
  {
    id: 'rep_sub', cat: 'ops', icon: 'minus', rep: 1, def: '1,1', w: 46,
    n: L('{x} − {y}', '{x} − {y}', '{x} − {y}', '{x} − {y}'),
    d: L('Resta los dos valores.', 'Subtracts the two values.', 'Subtrai os dois valores.', 'Soustrait les deux valeurs.')
  },
  {
    id: 'rep_mul', cat: 'ops', icon: 'close', rep: 1, def: '1,1', w: 46,
    n: L('{x} × {y}', '{x} × {y}', '{x} × {y}', '{x} × {y}'),
    d: L('Multiplica los dos valores.', 'Multiplies the two values.', 'Multiplica os dois valores.', 'Multiplie les deux valeurs.')
  },
  {
    id: 'rep_div', cat: 'ops', icon: 'calculator', rep: 1, def: '1,1', w: 46,
    n: L('{x} ÷ {y}', '{x} ÷ {y}', '{x} ÷ {y}', '{x} ÷ {y}'),
    d: L('Divide los dos valores (dividir por cero da 0).', 'Divides the two values (dividing by zero gives 0).', 'Divide os dois valores (dividir por zero dá 0).', 'Divise les deux valeurs (diviser par zéro donne 0).')
  },
  {
    id: 'rep_gt', cat: 'ops', icon: 'branch', rep: 1, def: '1,0', w: 46,
    n: L('{x} > {y}', '{x} > {y}', '{x} > {y}', '{x} > {y}'),
    d: L('Devuelve verdadero si el primero es mayor; sirve para «Si {v} entonces».', 'Returns true if the first is greater; for «If {v} then».', 'Devolve verdadeiro se o primeiro for maior; para «Se {v} então».', 'Renvoie vrai si le premier est plus grand ; pour « Si {v} alors ».')
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
/* La paleta sigue mostrando los 40 enunciados de siempre: los reporteros
   se eligen desde el botón ƒ y nunca se agregan como bloque suelto. */
const PALETTE_BLOCKS = BLOCKS.filter(b => !b.legacy && !b.rep);
const REPORTER_BLOCKS = BLOCKS.filter(b => b.rep);

/* Casillas que aceptan un reportero. Se excluyen los sombreros (el sombrero
   de puntaje se sondea cada 300 ms), el selector de disfraces, «al azar»
   (su texto es un par "a,b") y los bloques nombre=valor. */
const REPORTER_HOSTS = [
  'move', 'turn', 'point_dir', 'go_xy', 'say', 'size', 'wait',
  'repeat', 'if_score', 'if_cond', 'if_else', 'vibrate',
  'score_add', 'score_set', 'op_calc'
];
BLOCKS.forEach(b => { if (REPORTER_HOSTS.indexOf(b.id) >= 0) b.repOk = 1; });

/* ---------------- textos extra (v2.1 + disfraces) ---------------- */
const UI_EXTRA = {
  es: {
    exportLibrary: 'Exportar biblioteca',
    libraryExported: 'Biblioteca exportada: {n} proyectos',
    undoDelete: 'Deshacer borrado',
    projectRestored: 'Proyecto restaurado',
    noFlagScripts: 'Ningún personaje tiene «al presionar bandera»: agregá ese sombrero para que Ejecutar arranque',
    padTitle: 'Controles',
    padUp: 'Arriba',
    padDown: 'Abajo',
    padLeft: 'Izquierda',
    padRight: 'Derecha',
    padFire: 'Acción',
    padHint: 'Este proyecto usa teclas: tocá Jugar para tener los controles en pantalla.',
    padTilt: 'Inclinar',
    padTiltTip: 'Mové el teléfono en vez de las flechas',
    padTiltOn: 'Inclinación activada: mové el teléfono',
    padTiltOff: 'Inclinación desactivada',
    exTitle: 'Ejemplos y guía',
    exIntro: 'Abrí un ejemplo y mirá cómo está armado. Se copia a un proyecto nuevo: lo que estabas haciendo queda intacto.',
    exGuide: 'Guía rápida',
    ex1: 'Saluda',
    ex1d: 'Un personaje que habla y camina con las flechas.',
    ex2: 'Atrapa la fruta',
    ex2d: 'Clones que caen, marcador y una cesta que movés con las flechas.',
    ex3: 'Esquiva los cometas',
    ex3d: 'Los cometas caen solos. Si te tocan, perdés los puntos.',
    exCat: 'Gato',
    exBasket: 'Cesta',
    exFruit: 'Fruta',
    exShip: 'Nave',
    exComet: 'Cometa',
    ex1Line1: '¡Hola! Soy tu personaje.',
    ex1Line2: 'Movéme con las flechas del teclado.',
    ex3Hit: '¡Auch! Perdiste los puntos.',
    exOpened: 'Ejemplo abierto: {n}',
    exStep1: 'Elegí un personaje en la lista y armá su guion arrastrando bloques.',
    exStep2: 'Todo guion empieza con un sombrero: «al iniciar» es el que dispara Ejecutar.',
    exStep3: 'Los bloques con forma de C envuelven a otros: repetir, por siempre, si…',
    exStep4: 'El botón ƒ de una casilla mete un reportero: un bloque que devuelve un valor.',
    exStep5: 'Guardá el proyecto o compartí el link para abrirlo en otro lado.',
    bubbleZoom: 'Tamaño del diálogo (%)',
    spriteSearch: 'Buscar personaje…',
    spriteNoResults: 'No encontramos personajes con ese nombre.',
    motionDenied: 'Activá el movimiento en los permisos del navegador',
    costumesTitle: 'Disfraces',
    costumesHint: 'Subí PNG, JPG, WebP o SVG para darle varios disfraces. Usá «siguiente disfraz» para animarlo.',
    costumeAdd: 'Agregar disfraces',
    costumeDelete: 'Borrar disfraz',
    confirmDeleteCostume: '¿Borrar este disfraz?',
    cantDeleteCostume: 'Tiene que quedar al menos un disfraz',
    costumeLimit: 'Máximo 12 disfraces por personaje',
    costumeBadType: 'Solo PNG, JPG, WebP, GIF o SVG',
    costumeTooBig: 'Esa imagen pesa demasiado, probá con una más chica',
    costumeEmpty: 'No se pudo leer esa imagen',
    costumeAdded: 'Disfraces agregados',
    costumeDefault: 'Disfraz',
    costumeMissing: 'Ese disfraz ya no existe',
    soundMissing: 'Ese sonido ya no existe',
    keyMissing: 'Esa tecla no sirve',
    spriteMissing: 'Ese personaje ya no existe',
    cloneSelf: 'mí mismo',
    importSprite: 'Importar mis imágenes…',
    shareDesc: 'Copiá este link y mandalo por WhatsApp. El proyecto entero, con sus disfraces, viaja adentro del link.',
    shareTooLong: 'El link quedó muy largo: algunos chats lo cortan. Probá con menos imágenes.',
    storageFull: 'No queda espacio en el dispositivo: borrá disfraces o exportá el proyecto.',
    generatingLink: 'Generando link…',
    sharedLoaded: 'Proyecto compartido cargado',
    zoomOut: 'Achicar bloques',
    zoomIn: 'Agrandar bloques',
    zoomReset: 'Volver al tamaño normal',
    undo: 'Deshacer',
    redo: 'Rehacer',
    undoNone: 'Nada para deshacer',
    duplicated: 'Bloque duplicado',
    duplicateBlock: 'Duplicar bloque',
    blockDropped: 'Bloque colocado',
    paletteHint: 'Tocá para agregar al final, o arrastrá desde el ícono para soltarlo donde quieras.',
    bgCustom: 'Usar mi imagen de fondo',
    bgClear: 'Quitar mi fondo',
    bgAdded: 'Fondo cambiado',
    bgRemoved: 'Fondo quitado',
    bgBadType: 'Elegí un PNG, JPG, WebP o SVG para el fondo',
    bgTooBig: 'Esa imagen pesa demasiado para el fondo',
    stageZoom: 'Escenario',
    stageZoomOut: 'Alejar la vista del escenario',
    stageZoomIn: 'Acercar la vista del escenario',
    stageZoomReset: 'Volver al zoom normal',
    stageResizeY: 'Arrastrá para cambiar el alto del escenario',
    stageResizeX: 'Arrastrá para cambiar el ancho del escenario',
    stageResizeXY: 'Arrastrá para cambiar el ancho y el alto',
    stageSizeReset: 'Volver al tamaño original del escenario',
    stageSizeResetDone: 'El escenario volvió a su tamaño original',
    codeResize: 'Arrastrá para cambiar el alto del área de código',
    backToStart: 'Volver al inicio',
    startRestored: 'Personajes en su posición inicial',
    confirmTitle: 'Confirmar',
    accept: 'Aceptar',
    projectTooBig: 'El proyecto es demasiado grande: se recortaron bloques para poder abrirlo.',
    repPickerTitle: 'Elegí un reportero',
    repPickerDesc: 'Un reportero devuelve un valor que se usa dentro del bloque. Tocá ƒ para ponerlo y × para volver al texto.',
    repInsert: 'Poner un reportero en esta casilla',
    repRemove: 'Quitar el reportero',
    projectsTitle: 'Mis proyectos',
    projectsDesc: 'Cada proyecto se guarda aparte en este dispositivo. Tocá uno para abrirlo.',
    newProject: 'Nuevo proyecto',
    currentProject: 'Proyecto actual',
    projectName: 'Nombre del proyecto',
    projectNameHint: 'Letras, números y espacios',
    renameProject: 'Cambiar el nombre',
    duplicateProject: 'Duplicar',
    deleteProject: 'Borrar',
    openProject: 'Abrir',
    closeLabel: 'Cerrar',
    untitledProject: 'Mi proyecto',
    projectOpened: 'Proyecto abierto',
    projectCreated: 'Proyecto nuevo',
    projectDeleted: 'Proyecto borrado',
    projectRenamed: 'Nombre cambiado',
    projectDuplicated: 'Proyecto duplicado',
    onlyOneProject: 'Tiene que quedar al menos un proyecto',
    projectLimit: 'Llegaste al máximo de 24 proyectos: borrá alguno',
    projectsEmpty: 'Todavía no hay proyectos',
    aboutBtn: 'Acerca de ScrachMo',
    aboutTitle: 'Acerca de ScrachMo',
    aboutSub: 'Programación visual para el celular',
    aboutAuthor: 'Autor',
    aboutLicense: 'Licencia',
    aboutSite: 'Sitio web',
    aboutDesc: 'Entorno de programación por bloques inspirado en Scratch, pensado para pantallas verticales. Sin frameworks, sin dependencias y sin instalar nada.',
    aboutThanks: 'Si te gusta ScrachMo, queda a tu criterio una mención o una donación para el autor.',
    aboutCoffee: 'Invitame un cafecito',
    aboutKofi: 'Apoyar en Ko-fi',
    rotateHint: 'Girá el teléfono para verlo más grande',
    rotateHintClose: 'Ocultar el aviso', aboutVersion: 'Versión', updateMsg: 'Hay una versión nueva de ScrachMo', updateReload: 'Recargar', updateClose: 'Ahora no'
  },
  en: {
    exportLibrary: 'Export library',
    libraryExported: 'Library exported: {n} projects',
    undoDelete: 'Undo delete',
    projectRestored: 'Project restored',
    noFlagScripts: 'No character has “when green flag clicked”: add that hat so Run starts',
    padTitle: 'Controls',
    padUp: 'Up',
    padDown: 'Down',
    padLeft: 'Left',
    padRight: 'Right',
    padFire: 'Action',
    padHint: 'This project uses keys: tap Play to get on-screen controls.',
    padTilt: 'Tilt',
    padTiltTip: 'Move the phone instead of the arrows',
    padTiltOn: 'Tilt on: move the phone',
    padTiltOff: 'Tilt off',
    exTitle: 'Examples and guide',
    exIntro: 'Open an example and see how it is built. It is copied into a new project: whatever you were doing stays untouched.',
    exGuide: 'Quick guide',
    ex1: 'Say hello',
    ex1d: 'A character that talks and walks with the arrow keys.',
    ex2: 'Catch the fruit',
    ex2d: 'Clones fall, a score counts, and you move the basket with the arrow keys.',
    ex3: 'Dodge the comets',
    ex3d: 'Comets fall on their own. If they hit you, you lose your points.',
    exCat: 'Cat',
    exBasket: 'Basket',
    exFruit: 'Fruit',
    exShip: 'Ship',
    exComet: 'Comet',
    ex1Line1: 'Hi! I am your character.',
    ex1Line2: 'Move me with the arrow keys.',
    ex3Hit: 'Ouch! You lost your points.',
    exOpened: 'Example opened: {n}',
    exStep1: 'Pick a character from the list and build its script by dragging blocks.',
    exStep2: 'Every script starts with a hat: “on start” is the one Run triggers.',
    exStep3: 'C-shaped blocks wrap others: repeat, forever, if…',
    exStep4: 'The ƒ button in a slot inserts a reporter: a block that returns a value.',
    exStep5: 'Save the project or share the link to open it somewhere else.',
    bubbleZoom: 'Bubble size (%)',
    spriteSearch: 'Search characters…',
    spriteNoResults: 'No characters match that search.',
    motionDenied: 'Enable motion access in your browser settings',
    costumesTitle: 'Costumes',
    costumesHint: 'Upload PNG, JPG, WebP or SVG to give it several costumes. Use "next costume" to animate it.',
    costumeAdd: 'Add costumes',
    costumeDelete: 'Delete costume',
    confirmDeleteCostume: 'Delete this costume?',
    cantDeleteCostume: 'A sprite needs at least one costume',
    costumeLimit: 'Up to 12 costumes per sprite',
    costumeBadType: 'PNG, JPG, WebP, GIF or SVG only',
    costumeTooBig: 'That image is too big, try a smaller one',
    costumeEmpty: 'Could not read that image',
    costumeAdded: 'Costumes added',
    costumeDefault: 'Costume',
    costumeMissing: 'That costume no longer exists',
    soundMissing: 'That sound no longer exists',
    keyMissing: 'That key does not work',
    spriteMissing: 'That sprite no longer exists',
    cloneSelf: 'myself',
    importSprite: 'Import my images…',
    shareDesc: 'Copy this link and send it on WhatsApp. The whole project, costumes included, travels inside the link.',
    shareTooLong: 'This link is very long: some chat apps may cut it. Try fewer images.',
    storageFull: 'Device storage is full: delete costumes or export the project.',
    generatingLink: 'Generating link…',
    sharedLoaded: 'Shared project loaded',
    zoomOut: 'Shrink blocks',
    zoomIn: 'Enlarge blocks',
    zoomReset: 'Back to normal size',
    undo: 'Undo',
    redo: 'Redo',
    undoNone: 'Nothing to undo',
    duplicated: 'Block duplicated',
    duplicateBlock: 'Duplicate block',
    blockDropped: 'Block placed',
    paletteHint: 'Tap to add at the end, or drag from the grip to drop it anywhere.',
    bgCustom: 'Use my own backdrop',
    bgClear: 'Remove my backdrop',
    bgAdded: 'Backdrop changed',
    bgRemoved: 'Backdrop removed',
    bgBadType: 'Pick a PNG, JPG, WebP or SVG for the backdrop',
    bgTooBig: 'That image is too big for a backdrop',
    stageZoom: 'Stage',
    stageZoomOut: 'Zoom out of the stage view',
    stageZoomIn: 'Zoom into the stage view',
    stageZoomReset: 'Back to normal zoom',
    stageResizeY: 'Drag to change the stage height',
    stageResizeX: 'Drag to change the stage width',
    stageResizeXY: 'Drag to change the stage width and height',
    stageSizeReset: 'Back to the original stage size',
    stageSizeResetDone: 'The stage is back to its original size',
    codeResize: 'Drag to change the code area height',
    backToStart: 'Back to start',
    startRestored: 'Sprites back at their start position',
    confirmTitle: 'Confirm',
    accept: 'OK',
    projectTooBig: 'This project is too big: some blocks were trimmed so it could open.',
    repPickerTitle: 'Pick a reporter',
    repPickerDesc: 'A reporter returns a value used inside the block. Tap ƒ to add one and × to go back to text.',
    repInsert: 'Put a reporter in this slot',
    repRemove: 'Remove the reporter',
    projectsTitle: 'My projects',
    projectsDesc: 'Each project is saved separately on this device. Tap one to open it.',
    newProject: 'New project',
    currentProject: 'Current project',
    projectName: 'Project name',
    projectNameHint: 'Letters, numbers and spaces',
    renameProject: 'Rename',
    duplicateProject: 'Duplicate',
    deleteProject: 'Delete',
    openProject: 'Open',
    closeLabel: 'Close',
    untitledProject: 'My project',
    projectOpened: 'Project opened',
    projectCreated: 'New project',
    projectDeleted: 'Project deleted',
    projectRenamed: 'Name changed',
    projectDuplicated: 'Project duplicated',
    onlyOneProject: 'At least one project has to stay',
    projectLimit: 'You reached the 24-project limit: delete one first',
    projectsEmpty: 'No projects yet',
    aboutBtn: 'About ScrachMo',
    aboutTitle: 'About ScrachMo',
    aboutSub: 'Visual programming for your phone',
    aboutAuthor: 'Author',
    aboutLicense: 'License',
    aboutSite: 'Website',
    aboutDesc: 'Block-based programming environment inspired by Scratch, built for vertical screens. No frameworks, no dependencies, nothing to install.',
    aboutThanks: 'If you enjoy ScrachMo, a mention or a donation to the author is entirely up to you.',
    aboutCoffee: 'Buy me a coffee',
    aboutKofi: 'Support on Ko-fi',
    rotateHint: 'Turn your phone to see it bigger',
    rotateHintClose: 'Hide this notice', aboutVersion: 'Version', updateMsg: 'A new version of ScrachMo is ready', updateReload: 'Reload', updateClose: 'Not now'
  },
  pt: {
    exportLibrary: 'Exportar biblioteca',
    libraryExported: 'Biblioteca exportada: {n} projetos',
    undoDelete: 'Desfazer exclusão',
    projectRestored: 'Projeto restaurado',
    noFlagScripts: 'Nenhum personagem tem “ao clicar na bandeira”: adicione esse chapéu para que Executar inicie',
    padTitle: 'Controles',
    padUp: 'Cima',
    padDown: 'Baixo',
    padLeft: 'Esquerda',
    padRight: 'Direita',
    padFire: 'Ação',
    padHint: 'Este projeto usa teclas: toque Jogar para ter os controles na tela.',
    padTilt: 'Inclinar',
    padTiltTip: 'Mova o celular em vez das setas',
    padTiltOn: 'Inclinação ativada: mova o celular',
    padTiltOff: 'Inclinação desativada',
    exTitle: 'Exemplos e guia',
    exIntro: 'Abra um exemplo e veja como ele é montado. Ele é copiado para um projeto novo: o que você estava fazendo fica intacto.',
    exGuide: 'Guia rápido',
    ex1: 'Cumprimenta',
    ex1d: 'Um personagem que fala e anda com as setas.',
    ex2: 'Pegue a fruta',
    ex2d: 'Clones caem, o placar conta e você move a cesta com as setas.',
    ex3: 'Desvie dos cometas',
    ex3d: 'Os cometas caem sozinhos. Se acertarem você, perde os pontos.',
    exCat: 'Gato',
    exBasket: 'Cesta',
    exFruit: 'Fruta',
    exShip: 'Nave',
    exComet: 'Cometa',
    ex1Line1: 'Olá! Sou seu personagem.',
    ex1Line2: 'Mova-me com as setas do teclado.',
    ex3Hit: 'Ai! Você perdeu os pontos.',
    exOpened: 'Exemplo aberto: {n}',
    exStep1: 'Escolha um personagem na lista e monte o guião arrastando blocos.',
    exStep2: 'Todo guião começa com um chapéu: “ao iniciar” é o que dispara Executar.',
    exStep3: 'Blocos em forma de C envolvem outros: repetir, para sempre, se…',
    exStep4: 'O botão ƒ de uma caixa insere um repórter: um bloco que devolve um valor.',
    exStep5: 'Salve o projeto ou compartilhe o link para abrir em outro lugar.',
    bubbleZoom: 'Tamanho do balão (%)',
    spriteSearch: 'Buscar personagem…',
    spriteNoResults: 'Nenhum personagem com esse nome.',
    motionDenied: 'Ative o movimento nas permissões do navegador',
    costumesTitle: 'Trajes',
    costumesHint: 'Envie PNG, JPG, WebP ou SVG para dar vários trajes. Use «próximo traje» para animar.',
    costumeAdd: 'Adicionar trajes',
    costumeDelete: 'Excluir traje',
    confirmDeleteCostume: 'Excluir este traje?',
    cantDeleteCostume: 'Precisa ficar pelo menos um traje',
    costumeLimit: 'Máximo de 12 trajes por personagem',
    costumeBadType: 'Apenas PNG, JPG, WebP, GIF ou SVG',
    costumeTooBig: 'Essa imagem é grande demais, tente uma menor',
    costumeEmpty: 'Não foi possível ler essa imagem',
    costumeAdded: 'Trajes adicionados',
    costumeDefault: 'Traje',
    costumeMissing: 'Esse traje não existe mais',
    soundMissing: 'Esse som não existe mais',
    keyMissing: 'Essa tecla não serve',
    spriteMissing: 'Esse personagem não existe mais',
    cloneSelf: 'eu mesmo',
    importSprite: 'Importar minhas imagens…',
    shareDesc: 'Copie este link e envie no WhatsApp. O projeto inteiro, com os trajes, vai dentro do link.',
    shareTooLong: 'O link ficou muito longo: alguns apps podem cortá-lo. Tente menos imagens.',
    storageFull: 'Sem espaço no dispositivo: exclua trajes ou exporte o projeto.',
    generatingLink: 'Gerando link…',
    sharedLoaded: 'Projeto compartilhado carregado',
    zoomOut: 'Diminuir blocos',
    zoomIn: 'Aumentar blocos',
    zoomReset: 'Voltar ao tamanho normal',
    undo: 'Desfazer',
    redo: 'Refazer',
    undoNone: 'Nada para desfazer',
    duplicated: 'Bloco duplicado',
    duplicateBlock: 'Duplicar bloco',
    blockDropped: 'Bloco colocado',
    paletteHint: 'Toque para adicionar no fim, ou arraste pela alça para soltar onde quiser.',
    bgCustom: 'Usar minha imagem de fundo',
    bgClear: 'Remover meu fundo',
    bgAdded: 'Fundo alterado',
    bgRemoved: 'Fundo removido',
    bgBadType: 'Escolha um PNG, JPG, WebP ou SVG para o fundo',
    bgTooBig: 'Essa imagem é grande demais para o fundo',
    stageZoom: 'Cenário',
    stageZoomOut: 'Afastar a visão do cenário',
    stageZoomIn: 'Aproximar a visão do cenário',
    stageZoomReset: 'Voltar ao zoom normal',
    stageResizeY: 'Arraste para mudar a altura do cenário',
    stageResizeX: 'Arraste para mudar a largura do cenário',
    stageResizeXY: 'Arraste para mudar a largura e a altura',
    stageSizeReset: 'Voltar ao tamanho original do cenário',
    stageSizeResetDone: 'O cenário voltou ao tamanho original',
    codeResize: 'Arraste para mudar a altura da área de código',
    backToStart: 'Voltar ao início',
    startRestored: 'Personagens na posição inicial',
    confirmTitle: 'Confirmar',
    accept: 'Aceitar',
    projectTooBig: 'O projeto é grande demais: alguns blocos foram cortados para abrir.',
    repPickerTitle: 'Escolha um repórter',
    repPickerDesc: 'Um repórter devolve um valor usado dentro do bloco. Toque em ƒ para colocá-lo e em × para voltar ao texto.',
    repInsert: 'Colocar um repórter nesta casela',
    repRemove: 'Remover o repórter',
    projectsTitle: 'Meus projetos',
    projectsDesc: 'Cada projeto é salvo separado neste dispositivo. Toque em um para abrir.',
    newProject: 'Novo projeto',
    currentProject: 'Projeto atual',
    projectName: 'Nome do projeto',
    projectNameHint: 'Letras, números e espaços',
    renameProject: 'Renomear',
    duplicateProject: 'Duplicar',
    deleteProject: 'Excluir',
    openProject: 'Abrir',
    closeLabel: 'Fechar',
    untitledProject: 'Meu projeto',
    projectOpened: 'Projeto aberto',
    projectCreated: 'Projeto novo',
    projectDeleted: 'Projeto excluído',
    projectRenamed: 'Nome alterado',
    projectDuplicated: 'Projeto duplicado',
    onlyOneProject: 'Precisa ficar pelo menos um projeto',
    projectLimit: 'Você chegou ao máximo de 24 projetos: exclua algum',
    projectsEmpty: 'Ainda não há projetos',
    aboutBtn: 'Sobre o ScrachMo',
    aboutTitle: 'Sobre o ScrachMo',
    aboutSub: 'Programação visual para o celular',
    aboutAuthor: 'Autor',
    aboutLicense: 'Licença',
    aboutSite: 'Site',
    aboutDesc: 'Ambiente de programação por blocos inspirado no Scratch, feito para telas verticais. Sem frameworks, sem dependências e sem instalar nada.',
    aboutThanks: 'Se você gosta do ScrachMo, fica a seu critério uma menção ou uma doação para o autor.',
    aboutCoffee: 'Me paga um cafezinho',
    aboutKofi: 'Apoiar no Ko-fi',
    rotateHint: 'Gire o celular para ver maior',
    rotateHintClose: 'Ocultar o aviso', aboutVersion: 'Versão', updateMsg: 'Há uma nova versão do ScrachMo', updateReload: 'Recarregar', updateClose: 'Agora não'
  },
  fr: {
    exportLibrary: 'Exporter la bibliothèque',
    libraryExported: 'Bibliothèque exportée : {n} projets',
    undoDelete: 'Annuler la suppression',
    projectRestored: 'Projet restauré',
    noFlagScripts: 'Aucun personnage n’a « quand le drapeau est cliqué » : ajoutez ce chapeau pour que Exécuter démarre',
    padTitle: 'Commandes',
    padUp: 'Haut',
    padDown: 'Bas',
    padLeft: 'Gauche',
    padRight: 'Droite',
    padFire: 'Action',
    padHint: 'Ce projet utilise des touches : touchez Jouer pour avoir les commandes à l’écran.',
    padTilt: 'Incliner',
    padTiltTip: 'Bougez le téléphone au lieu des flèches',
    padTiltOn: 'Inclinaison activée : bougez le téléphone',
    padTiltOff: 'Inclinaison désactivée',
    exTitle: 'Exemples et guide',
    exIntro: 'Ouvrez un exemple et voyez comment il est construit. Il est copié dans un nouveau projet : votre travail reste intact.',
    exGuide: 'Guide rapide',
    ex1: 'Dis bonjour',
    ex1d: 'Un personnage qui parle et avance avec les flèches.',
    ex2: 'Attrape le fruit',
    ex2d: 'Des clones tombent, un score compte, et vous déplacez le panier avec les flèches.',
    ex3: 'Évite les comètes',
    ex3d: 'Les comètes tombent seules. Si elles vous touchent, vous perdez vos points.',
    exCat: 'Chat',
    exBasket: 'Panier',
    exFruit: 'Fruit',
    exShip: 'Vaisseau',
    exComet: 'Comète',
    ex1Line1: 'Salut ! Je suis ton personnage.',
    ex1Line2: 'Déplace-moi avec les flèches du clavier.',
    ex3Hit: 'Aïe ! Tu as perdu tes points.',
    exOpened: 'Exemple ouvert : {n}',
    exStep1: 'Choisissez un personnage dans la liste et construisez son script en glissant des blocs.',
    exStep2: 'Tout script commence par un chapeau : « au démarrage » est celui que Lancer déclenche.',
    exStep3: 'Les blocs en forme de C en entourent d’autres : répéter, toujours, si…',
    exStep4: 'Le bouton ƒ d’une case insère un rapporteur : un bloc qui renvoie une valeur.',
    exStep5: 'Enregistrez le projet ou partagez le lien pour l’ouvrir ailleurs.',
    bubbleZoom: 'Taille de la bulle (%)',
    spriteSearch: 'Chercher un personnage…',
    spriteNoResults: 'Aucun personnage pour cette recherche.',
    motionDenied: 'Activez le mouvement dans les permissions du navigateur',
    costumesTitle: 'Costumes',
    costumesHint: 'Ajoutez des PNG, JPG, WebP ou SVG pour plusieurs costumes. Utilisez « costume suivant » pour animer.',
    costumeAdd: 'Ajouter des costumes',
    costumeDelete: 'Supprimer le costume',
    confirmDeleteCostume: 'Supprimer ce costume ?',
    cantDeleteCostume: 'Il faut au moins un costume',
    costumeLimit: 'Jusqu’à 12 costumes par personnage',
    costumeBadType: 'PNG, JPG, WebP, GIF ou SVG seulement',
    costumeTooBig: 'Cette image est trop lourde, essayez plus petit',
    costumeEmpty: 'Impossible de lire cette image',
    costumeAdded: 'Costumes ajoutés',
    costumeDefault: 'Costume',
    costumeMissing: 'Ce costume n’existe plus',
    soundMissing: 'Ce son n’existe plus',
    keyMissing: 'Cette touche ne marche pas',
    spriteMissing: 'Ce personnage n’existe plus',
    cloneSelf: 'moi-même',
    importSprite: 'Importer mes images…',
    shareDesc: 'Copiez ce lien et envoyez-le sur WhatsApp. Tout le projet, costumes compris, voyage dans le lien.',
    shareTooLong: 'Le lien est très long : certaines applis le coupent. Essayez avec moins d’images.',
    storageFull: 'Stockage plein : supprimez des costumes ou exportez le projet.',
    generatingLink: 'Génération du lien…',
    sharedLoaded: 'Projet partagé chargé',
    zoomOut: 'Réduire les blocs',
    zoomIn: 'Agrandir les blocs',
    zoomReset: 'Revenir à la taille normale',
    undo: 'Annuler',
    redo: 'Rétablir',
    undoNone: 'Rien à annuler',
    duplicated: 'Bloc dupliqué',
    duplicateBlock: 'Dupliquer le bloc',
    blockDropped: 'Bloc placé',
    paletteHint: 'Touchez pour ajouter à la fin, ou glissez par la poignée pour déposer où vous voulez.',
    bgCustom: 'Utiliser mon image de fond',
    bgClear: 'Retirer mon fond',
    bgAdded: 'Fond changé',
    bgRemoved: 'Fond retiré',
    bgBadType: 'Choisissez un PNG, JPG, WebP ou SVG pour le fond',
    bgTooBig: 'Cette image est trop lourde pour un fond',
    stageZoom: 'Scène',
    stageZoomOut: 'Éloigner la vue de la scène',
    stageZoomIn: 'Rapprocher la vue de la scène',
    stageZoomReset: 'Revenir au zoom normal',
    stageResizeY: 'Glissez pour changer la hauteur de la scène',
    stageResizeX: 'Glissez pour changer la largeur de la scène',
    stageResizeXY: 'Glissez pour changer la largeur et la hauteur',
    stageSizeReset: 'Revenir à la taille originale de la scène',
    stageSizeResetDone: 'La scène a retrouvé sa taille originale',
    codeResize: 'Faites glisser pour changer la hauteur du code',
    backToStart: 'Revenir au départ',
    startRestored: 'Personnages à leur position de départ',
    confirmTitle: 'Confirmer',
    accept: 'Valider',
    projectTooBig: 'Ce projet est trop grand : des blocs ont été coupés pour pouvoir l’ouvrir.',
    repPickerTitle: 'Choisir un rapporteur',
    repPickerDesc: 'Un rapporteur renvoie une valeur utilisée dans le bloc. Touchez ƒ pour l’ajouter et × pour revenir au texte.',
    repInsert: 'Mettre un rapporteur dans cette case',
    repRemove: 'Retirer le rapporteur',
    projectsTitle: 'Mes projets',
    projectsDesc: 'Chaque projet est enregistré séparément sur cet appareil. Touchez-en un pour l’ouvrir.',
    newProject: 'Nouveau projet',
    currentProject: 'Projet actuel',
    projectName: 'Nom du projet',
    projectNameHint: 'Lettres, chiffres et espaces',
    renameProject: 'Renommer',
    duplicateProject: 'Dupliquer',
    deleteProject: 'Supprimer',
    openProject: 'Ouvrir',
    closeLabel: 'Fermer',
    untitledProject: 'Mon projet',
    projectOpened: 'Projet ouvert',
    projectCreated: 'Nouveau projet',
    projectDeleted: 'Projet supprimé',
    projectRenamed: 'Nom modifié',
    projectDuplicated: 'Projet dupliqué',
    onlyOneProject: 'Il doit rester au moins un projet',
    projectLimit: 'Limite de 24 projets atteinte : supprimez-en un',
    projectsEmpty: 'Aucun projet pour le moment',
    aboutBtn: 'À propos de ScrachMo',
    aboutTitle: 'À propos de ScrachMo',
    aboutSub: 'Programmation visuelle pour le téléphone',
    aboutAuthor: 'Auteur',
    aboutLicense: 'Licence',
    aboutSite: 'Site web',
    aboutDesc: 'Environnement de programmation par blocs inspiré de Scratch, pensé pour les écrans verticaux. Sans frameworks, sans dépendances et sans rien installer.',
    aboutThanks: "Si ScrachMo vous plaît, une mention ou un don à l'auteur reste à votre discrétion.",
    aboutCoffee: 'Offrez-moi un café',
    aboutKofi: 'Soutenir sur Ko-fi',
    rotateHint: 'Tournez le téléphone pour agrandir',
    rotateHintClose: 'Masquer ce message', aboutVersion: 'Version', updateMsg: 'Une nouvelle version de ScrachMo est prête', updateReload: 'Recharger', updateClose: 'Plus tard'
  }
};
Object.keys(UI_EXTRA).forEach(k => Object.assign(UI[k], UI_EXTRA[k]));

/* ---------------- catálogo de personajes ----------------
   Cada item es 'emoji|palabras clave'. La búsqueda usa fold(),
   así que ignora tildes y mayúsculas en los 4 idiomas. */
const SPRITE_GROUPS = [
  {
    name: L('Animales', 'Animals', 'Animais', 'Animaux'),
    items: [
      '🐱|gato cat gato chat', '🐶|perro dog cao chien', '🐭|raton mouse rato souris',
      '🐹|hamster hamster', '🐰|conejo rabbit coelho lapin', '🦊|zorro fox raposa renard',
      '🐻|oso bear urso ours', '🐼|panda panda', '🐨|koala koala', '🐯|tigre tiger tigre',
      '🦁|leon lion leao lion', '🐮|vaca cow vaca vache', '🐷|cerdo pig porco cochon',
      '🐸|rana frog sapo grenouille', '🐵|mono monkey macaco singe', '🐔|gallina chicken galinha poule',
      '🐧|pinguino penguin pinguim pingouin', '🐦|pajaro bird passaro oiseau ave',
      '🦆|pato duck pato canard', '🦅|aguila eagle aguia aigle ave', '🦉|buho owl coruja hibou',
      '🦇|murcielago bat morcego', '🐺|lobo wolf lobo loup', '🐴|caballo horse cavalo cheval',
      '🦄|unicornio unicorn unicornio licorne', '🐝|abeja bee abelha abeille',
      '🦋|mariposa butterfly borboleta papillon', '🐙|pulpo octopus polvo pieuvre',
      '🦀|cangrejo crab caranguejo crabe', '🐠|pez fish peixe poisson',
      '🐬|delfin dolphin golfinho dauphin', '🐳|ballena whale baleia baleine',
      '🦖|dinosaurio dinosaur dinossauro dinosaure', '🐲|dragon dragon dragao',
      '🐢|tortuga turtle tartaruga tortue', '🐍|serpiente snake serpente serpent',
      '🦎|lagarto lizard lagarto lezard', '🐊|cocodrilo crocodile crocodilo',
      '🦈|tiburon shark tubarao requin', '🐋|cachalote whale baleia baleine',
      '🦑|calamar squid lula calmar', '🦐|camaron shrimp camarao crevette',
      '🦞|langosta lobster lagosta homard', '🦦|nutria otter lontra loutre'
    ]
  },
  {
    name: L('Espacio', 'Space', 'Espaço', 'Espace'),
    items: [
      '🚀|cohete rocket foguete fusee', '🛸|ovni ufo disco soucoupe',
      '🛰️|satelite satellite satelite', '🌕|luna llena moon lua', '🌙|luna moon lua lune',
      '⭐|estrella star estrela etoile', '🌟|estrella star brillo', '✨|brillo sparkle magia',
      '☄️|cometa comet cometa comete', '🌍|tierra earth planeta terra', '🪐|planeta planet saturno',
      '👽|alien extraterrestre alienigena', '🤖|robot robot robo', '🌞|sol sun sol soleil',
      '🔭|telescopio telescope telescopio', '🌌|galaxia galaxy galaxia', '🌠|estrella fugaz shooting star',
      '🌎|planeta tierra planet earth', '💫|destello sparkle etoile filante',
      '👾|marciano invasor alien monster', '🌑|luna nueva new moon lua nova',
      '🌓|cuarto creciente quarter moon', '🌗|cuarto menguante last quarter',
      '🌚|luna oscura dark moon', '🌜|luna noche night moon'
    ]
  },
  {
    name: L('Vehículos', 'Vehicles', 'Veículos', 'Véhicules'),
    items: [
      '🚗|auto coche car carro voiture', '🚕|taxi taxi', '🚙|camioneta suv jeep',
      '🚌|autobus bus onibus', '🏎️|auto carrera race car formula', '🚓|policia police',
      '🚑|ambulancia ambulance', '🚒|bomberos fire truck', '🚚|camion truck caminhao camion',
      '🚲|bicicleta bici bike bicicleta velo', '🏍️|moto motocicleta motorcycle',
      '✈️|avion aviao plane avion', '🚁|helicoptero helicopter helicoptere',
      '⛵|velero barco boat voilier', '🚤|lancha speedboat barco', '🚂|tren train trem',
      '🛵|scooter motoneta', '🚜|tractor tractor trator',
      '🚘|auto carro coche voiture', '🚖|taxi remis cab', '🚍|autobus colectivo bus',
      '🚐|van combi furgoneta', '🚛|camion trailer camion', '🚝|monorriel monorail trem',
      '🚢|barco buque ship navio', '🛶|canoa kayak canoe', '🛴|patineta scooter trottinette',
      '🚦|semaforo traffic light feu', '🚧|barrera obra barrier'
    ]
  },
  {
    name: L('Edad Media', 'Middle Ages', 'Idade Média', 'Moyen Âge'),
    items: [
      '🏹|arco flecha bow arc', '🪓|hacha axe hache', '⚒️|martillo yunque hammer forge',
      '🗿|estatua moai statue', '⚱️|urna vasija urn', '🏺|jarron vasija amphora',
      '🤺|esgrima espada fencer epee', '🏇|jinete caballo rider jockey',
      '💂|guardia soldado guard garde',
      '🗝️|llave antigua old key cle', '⚜️|flor de lis fleur lys'
    ]
  },
  {
    name: L('Terror', 'Horror', 'Terror', 'Horreur'),
    items: [
      '☠️|calavera huesos skull skull crossbones', '🕷️|arana spider araignee',
      '🕸️|telarana telaraña web toile', '⚰️|ataud coffin cercueil',
      '🕯️|vela candela candle bougie',
      '🧿|amuleto ojo turco amulet', '👁️|ojo eye oeil',
      '🩸|sangre blood sang', '🦴|hueso bone os'
    ]
  },
  {
    name: L('Juegos y deportes', 'Games and sports', 'Jogos e esportes', 'Jeux et sports'),
    items: [
      '⚽|pelota futbol soccer ball ballon', '🏀|basquet basketball basket', '🎾|tenis tennis',
      '🏈|futbol americano football', '🎱|billar pool', '🎈|globo balloon ballon',
      '🎁|regalo gift cadeau', '🎮|joystick consola videogame', '🎲|dado dice',
      '🧩|rompecabezas puzzle', '🎯|diana dardo target', '🪁|cometa kite papalote',
      '🛡️|escudo shield', '⚔️|espadas sword', '🏆|trofeo trophy', '🎪|circo circus',
      '🏐|voley volleyball volei', '🏉|rugby rugby', '🥊|boxeo boxing boxe',
      '🥋|karate judo artes marciales', '🏓|pingpong ping pong', '🏸|badminton badminton',
      '🥅|arco red goal but', '🎳|bolos bowling', '🏂|snowboard tabla snowboard',
      '🏄|surf surfear surf'
    ]
  },
  {
    name: L('Flechas y señales', 'Arrows and signs', 'Setas e sinais', 'Flèches et signes'),
    items: [
      '➡️|derecha right droite', '⬅️|izquierda left gauche', '⬆️|arriba up haut',
      '⬇️|abajo down bas', '↗️|diagonal arriba derecha', '↘️|diagonal abajo derecha',
      '↙️|diagonal abajo izquierda', '↖️|diagonal arriba izquierda',
      '↩️|volver atras back retour', '↪️|seguir adelante forward',
      '🔃|girar rotar rotate', '🔄|recargar repetir refresh',
      '🔁|repetir loop boucle', '⏫|subir arriba up', '⏬|bajar abajo down',
      '⏩|adelante rapido fast', '⏪|atras retroceder rewind', '🔀|mezclar shuffle'
    ]
  },
  {
    name: L('Formas y colores', 'Shapes and colors', 'Formas e cores', 'Formes et couleurs'),
    items: [
      '🔴|rojo circulo red rouge', '🟠|naranja orange', '🟡|amarillo yellow jaune',
      '🟢|verde green vert', '🔵|azul blue bleu', '🟣|violeta purple violet',
      '🟤|marron brown brun', '⚫|negro black noir', '⚪|blanco white blanc',
      '🟥|cuadrado rojo square rouge', '🟧|cuadrado naranja square orange',
      '🟨|cuadrado amarillo square yellow', '🟩|cuadrado verde square green',
      '🟦|cuadrado azul square blue', '🟪|cuadrado violeta square purple',
      '🟫|cuadrado marron square brown', '⬛|cuadrado negro black square',
      '⬜|cuadrado blanco white square', '🔺|triangulo triangle', '🔻|triangulo abajo triangle down',
      '🔶|rombo diamond losange', '🔷|rombo azul diamond blue'
    ]
  },
  {
    name: L('Frutas', 'Fruits', 'Frutas', 'Fruits'),
    items: [
      '🍊|naranja mandarina orange', '🍋|limon lemon citron', '🍒|cereza cherry cerise',
      '🍑|durazno melocoton peach peche', '🍍|anana pina pineapple ananas',
      '🥝|kiwi kiwi', '🥭|mango mango', '🌰|castana chestnut chataigne',
      '🍐|pera pear poire', '🍏|manzana verde green apple pomme verte',
      '🥥|coco coconut noix', '🍈|melon melon', '🍅|tomate tomato tomate',
      '🥜|mani cacahuete peanut arachide'
    ]
  },
  {
    name: L('Verduras', 'Vegetables', 'Legumes', 'Légumes'),
    items: [
      '🥕|zanahoria carrot carotte', '🥦|brocoli broccoli', '🥔|papa patata potato pomme de terre',
      '🍆|berenjena eggplant aubergine', '🧄|ajo garlic ail', '🧅|cebolla onion oignon',
      '🥬|lechuga lettuce laitue', '🥒|pepino cucumber concombre',
      '🌶️|aji picante chili piment', '🍠|batata camote sweet potato'
    ]
  },
  {
    name: L('Comida', 'Food', 'Comida', 'Nourriture'),
    items: [
      '🍎|manzana apple maca pomme', '🍌|banana platano banane', '🍇|uvas grapes',
      '🍓|frutilla fresa strawberry morango fraise', '🍕|pizza pizza', '🍔|hamburguesa burger',
      '🍩|dona donut rosquilla', '🍪|galleta cookie biscuit', '🍉|sandia melancia watermelon pasteque',
      '🥑|palta aguacate avocado abacate', '🌽|maiz choclo corn milho', '🍄|hongo seta mushroom',
      '🧁|cupcake magdalena pastel', '🍦|helado ice cream glace',
      '🍟|papas fritas fries frites', '🌭|pancho hotdog hot dog', '🌮|taco taco',
      '🌯|burrito burrito', '🍜|ramen fideos noodles', '🍣|sushi sushi',
      '🍤|camaron frito shrimp crevette', '🍰|torta cake gateau', '🍫|chocolate chocolate',
      '🍬|caramelo candy bonbon', '🍭|chupetin lollipop sucette', '🍿|pochoclo popcorn pop corn'
    ]
  },
  {
    name: L('Naturaleza', 'Nature', 'Natureza', 'Nature'),
    items: [
      '🌳|arbol tree arvore arbre', '🌲|pino pine', '🌵|cactus cacto',
      '🌻|girasol sunflower girassol', '🌸|flor flower fleur', '🍀|trebol clover trevo',
      '🌈|arcoiris rainbow', '☀️|sol sun soleil', '🌊|ola wave vague',
      '🔥|fuego fire feu', '❄️|nieve snow neige', '🍁|hoja leaf',
      '🌴|palmera palm palmeira', '🌋|volcan volcano',
      '🌧️|lluvia rain pluie', '⛈️|tormenta storm orage', '🌩️|rayo lightning eclair',
      '🌨️|nevando snowing neige', '🌪️|tornado tornado', '🌫️|niebla fog brouillard',
      '☔|paraguas umbrella parapluie', '💧|gota gota water goutte',
      '🌡️|termometro thermometer', '🌤️|sol con nubes partly sunny'
    ]
  },
  {
    name: L('Fantasía', 'Fantasy', 'Fantasia', 'Fantaisie'),
    items: [
      '🧙|mago wizard magicien', '🧚|hada fairy fee', '🧛|vampiro vampire',
      '🦸|superheroe heroe superhero', '🧝|elfo elf', '👻|fantasma ghost fantome',
      '💀|calavera skull caveira', '🎃|calabaza halloween pumpkin', '🦹|villano villain',
      '🧟|zombie zombi', '👑|corona crown couronne', '💎|diamante diamond',
      '🔮|bola cristal crystal ball', '🗡️|espada sword epee', '🏰|castillo castle chateau',
      '🐉|dragon dragon dragao'
    ]
  },
  {
    name: L('Objetos', 'Objects', 'Objetos', 'Objets'),
    items: [
      '🔑|llave key cle', '💡|lampara bombilla light lampe', '📦|caja box boite',
      '🔔|campana bell', '⏰|reloj despertador alarm clock', '📱|celular telefono phone',
      '💻|computadora laptop ordinateur', '🎵|musica nota music note', '📚|libros books livre',
      '✏️|lapiz pencil', '🚪|puerta door', '🧭|brujula compass',
      '⚙️|engranaje gear', '💰|dinero bolsa money argent',
      '🧸|osito peluche teddy ours', '🪀|yoyo yoyo', '🎀|mono lazo bow noeud',
      '🎉|festejo party fete', '🎊|confeti confetti', '🖼️|cuadro marco picture',
      '🔍|lupa lente magnifier loupe', '🧲|iman magnet aimant', '🔋|pila bateria battery',
      '💾|disco disk disquette', '📡|antena antenna'
    ]
  },
  {
    name: L('Herramientas', 'Tools', 'Ferramentas', 'Outils'),
    items: [
      '🔨|martillo hammer marteau', '🔪|cuchillo knife couteau', '⛏️|pico pico pickaxe pioche',
      '🔧|llave inglesa wrench cle', '🔩|tornillo tornillo screw vis',
      '🛠️|herramientas tools outils', '🧰|caja herramientas toolbox boite',
      '🏗️|grua crane grue', '🔦|linterna flashlight lampe torche',
      '🧯|extinguidor extinguisher', '⚓|ancla anchor ancre', '🕳️|agujero hueco hole trou'
    ]
  },
  {
    name: L('Música', 'Music', 'Música', 'Musique'),
    items: [
      '🎸|guitarra guitar guitare', '🥁|bateria bateria drum tambour', '🎹|piano piano',
      '🎺|trompeta trumpet trompette', '🎻|violin violin violon', '🎤|microfono microphone',
      '🎧|auriculares headphones casque', '🎼|partitura score partition',
      '🪕|banjo banjo', '🎷|saxofon saxophone'
    ]
  }
];
const SPRITE_CHOICES = SPRITE_GROUPS.reduce((out, g) => out.concat(g.items.map(it => it.split('|')[0])), []);
