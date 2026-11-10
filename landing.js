/* Presentación de ScrachMo: textos, enlace directo compartible y compatibilidad
   con los links ?p= viejos. Sin dependencias y sin scripts inline (CSP).

   IMPORTANTE: este archivo se carga en el <head>. Si la URL trae ?p=, salta a
   la app ANTES de que se dibuje la landing: los proyectos compartidos cuando la
   raíz era el editor tienen que seguir abriendo igual. */
(function () {
  'use strict';

  /* Mantener sincronizado con APP_VERSION de data.js: tests/check-parity.js
     falla si este número queda viejo. */
  const VERSION = 'v11';

  if (/[?&]p=/.test(location.search)) {
    location.replace('app.html' + location.search + location.hash);
    return;
  }

  const TEXT = {
    es: {
      'doc.title': 'ScrachMo — Programá con bloques desde el celular',
      'doc.desc': 'Entorno de programación por bloques inspirado en Scratch, pensado para el celular. Sin cuenta, sin instalar, en 4 idiomas y funciona sin internet.',
      'brand.tag': 'ESTUDIO MÓVIL',
      'nav.features': 'Qué podés hacer', 'nav.how': 'Cómo empezar',
      'nav.support': 'Apoyar', 'nav.launch': 'Abrir la app',
      'hero.eyebrow': 'Sin cuenta · Sin instalar · Funciona sin internet',
      'hero.title': 'Programá con bloques desde el celular',
      'hero.lead': 'Un entorno visual inspirado en Scratch, hecho para pantallas verticales. Armá personajes, encastrá bloques y jugá lo que creaste en el mismo lugar.',
      'hero.cta': 'Abrir ScrachMo', 'hero.share': 'Copiar enlace directo',
      'hero.hint': 'Enlace directo a la app:',
      'hero.note': '¿Ya la viste? Guardá ese enlace o instalá la app: las dos formas entran directo al editor.',
      'mock.title': 'mi primer juego', 'mock.play': 'EN JUEGO',
      'mock.flag': 'al presionar 🏳️', 'mock.move': 'mover 10 pasos',
      'mock.say': 'decir ¡Hola! 2 s', 'mock.forever': 'por siempre',
      'mock.sound': 'tocar sonido «pop»',
      'stat.blocks': 'bloques para armar', 'stat.sprites': 'personajes y objetos',
      'stat.langs': 'idiomas de interfaz', 'stat.offline': 'usable sin internet',
      'feat.kicker': 'Todo lo necesario',
      'feat.title': 'Chico en la pantalla, grande en posibilidades',
      'feat.sub': 'Lo que normalmente necesita una computadora, acá se resuelve con el pulgar. Y sin crear ninguna cuenta.',
      'f1.title': 'Bloques que se encastran',
      'f1.text': 'Movimiento, sensores, sonidos, variables, condicionales, clones y reporteros. Arrastrá, soltá y probá al instante.',
      'f2.title': 'Personajes con disfraces',
      'f2.text': '321 figuras en 16 grupos, imágenes propias, SVG y hasta 12 disfraces por personaje.',
      'f3.title': 'Pensada para el celular',
      'f3.text': 'Interfaz vertical, controles táctiles, modo juego a pantalla completa y zoom del escenario y del código.',
      'f4.title': 'Compartir con un link',
      'f4.text': 'Tu proyecto viaja comprimido en la URL. Se la pasás a quien quieras y abre igual, sin servidor ni registros.',
      'f5.title': 'Se instala y funciona offline',
      'f5.text': 'Es una PWA: agregala a la pantalla de inicio y seguí programando sin conexión. Guardá varios proyectos en el navegador.',
      'f6.title': 'Puente a Scratch',
      'f6.text': 'Exportá a .sb3 para seguir en Scratch. Lo que no tiene equivalente se avisa y queda comentado en el proyecto.',
      'how.kicker': 'En tres pasos', 'how.title': 'De la idea al juego sin escalones',
      'how.sub': 'No hay instalación, ni compilación, ni cuenta. Entrá y ya estás programando.',
      's1.title': 'Elegí un personaje',
      's1.text': 'Emojis, animales, vehículos, flechas o tu propia imagen. Ponelo donde quieras tocando el escenario.',
      's2.title': 'Encastrá los bloques',
      's2.text': 'Arrastrá desde la paleta: «al presionar la bandera», «mover», «por siempre», «si toca…». Cada guion corre en su propio hilo.',
      's3.title': 'Jugá y compartí',
      's3.text': 'Tocá Ejecutar, probá en pantalla completa y generá un link para mostrarlo.',
      's3.link': 'Abrir el editor →',
      'sup.kicker': 'Hecho con cariño',
      'sup.title': 'Un proyecto personal, libre y sin condiciones',
      'sup.quote': '«Si te gusta ScrachMo, queda a tu criterio una mención o una donación para el autor.»',
      'sup.extra': 'Y si no, también está perfecto: usala, enseñala, modificala y compartila. Es software libre (MIT), sin cuentas, sin publicidad y sin rastreadores. Lo que más ayuda es que alguien la use para crear algo.',
      'sup.coffee': 'Invitame un cafecito', 'sup.kofi': 'Apoyar en Ko-fi',
      'sup.github': 'Ver código en GitHub',
      'foot.app': 'Ir directo a la app', 'foot.mit': 'Licencia MIT',
      'foot.made': 'Hecho con cariño por Hugo Martín Villalba',
      'foot.note': 'Inspirado en Scratch · Pensado para el móvil',
      'share.title': 'ScrachMo', 'share.text': 'Programá con bloques desde el celular',
      'toast.copied': 'Enlace copiado', 'toast.fail': 'Copiá este enlace:'
    },
    en: {
      'doc.title': 'ScrachMo — Block coding from your phone',
      'doc.desc': 'A Scratch-inspired visual coding environment built for phones. No account, no install, 4 languages, works offline.',
      'brand.tag': 'MOBILE STUDIO',
      'nav.features': 'Features', 'nav.how': 'Get started',
      'nav.support': 'Support', 'nav.launch': 'Open the app',
      'hero.eyebrow': 'No account · No install · Works offline',
      'hero.title': 'Build with blocks, right from your phone',
      'hero.lead': 'A visual coding environment inspired by Scratch, designed for portrait screens. Pick characters, snap blocks together and play what you made in the same place.',
      'hero.cta': 'Open ScrachMo', 'hero.share': 'Copy direct link',
      'hero.hint': 'Direct link to the app:',
      'hero.note': 'Been here before? Bookmark that link or install the app — both take you straight to the editor.',
      'mock.title': 'my first game', 'mock.play': 'PLAYING',
      'mock.flag': 'when 🏳️ clicked', 'mock.move': 'move 10 steps',
      'mock.say': 'say Hi! for 2 s', 'mock.forever': 'forever',
      'mock.sound': 'play sound «pop»',
      'stat.blocks': 'blocks to build with', 'stat.sprites': 'characters and objects',
      'stat.langs': 'interface languages', 'stat.offline': 'usable offline',
      'feat.kicker': 'Everything you need',
      'feat.title': 'Small screen, big possibilities',
      'feat.sub': 'What usually needs a computer, here works with your thumb. And you never have to sign up.',
      'f1.title': 'Blocks that snap together',
      'f1.text': 'Motion, sensors, sounds, variables, conditionals, clones and reporters. Drag, drop and try it instantly.',
      'f2.title': 'Characters with costumes',
      'f2.text': '321 figures in 16 groups, your own images, SVG and up to 12 costumes per character.',
      'f3.title': 'Made for phones',
      'f3.text': 'Portrait layout, touch controls, full-screen play mode and zoom for both the stage and the code.',
      'f4.title': 'Share with a link',
      'f4.text': 'Your project travels compressed inside the URL. Send it to anyone and it opens the same way: no server, no sign-up.',
      'f5.title': 'Installable and offline',
      'f5.text': 'It is a PWA: add it to your home screen and keep coding offline. Store several projects in your browser.',
      'f6.title': 'A bridge to Scratch',
      'f6.text': 'Export to .sb3 to continue in Scratch. Anything without an equivalent is reported and left as a comment.',
      'how.kicker': 'Three steps', 'how.title': 'From idea to game, with no setup',
      'how.sub': 'Nothing to install, nothing to compile, no account. Just open it and start coding.',
      's1.title': 'Pick a character',
      's1.text': 'Emoji, animals, vehicles, arrows or your own image. Tap the stage to place it wherever you want.',
      's2.title': 'Snap the blocks',
      's2.text': 'Drag from the palette: «when flag clicked», «move», «forever», «if touching…». Every script gets its own thread.',
      's3.title': 'Play and share',
      's3.text': 'Hit Run, try full screen and generate a link to show it off.',
      's3.link': 'Open the editor →',
      'sup.kicker': 'Made with care',
      'sup.title': 'A personal project, free and with no strings attached',
      'sup.quote': '«If you like ScrachMo, a mention or a donation to the author is entirely up to you.»',
      'sup.extra': 'And if not, that is perfectly fine too: use it, teach it, change it and share it. It is free software (MIT), with no accounts, no ads and no trackers. What helps most is someone using it to make something.',
      'sup.coffee': 'Buy me a coffee', 'sup.kofi': 'Support on Ko-fi',
      'sup.github': 'See the code on GitHub',
      'foot.app': 'Go straight to the app', 'foot.mit': 'MIT license',
      'foot.made': 'Made with care by Hugo Martín Villalba',
      'foot.note': 'Inspired by Scratch · Built for mobile',
      'share.title': 'ScrachMo', 'share.text': 'Build with blocks, right from your phone',
      'toast.copied': 'Link copied', 'toast.fail': 'Copy this link:'
    },
    pt: {
      'doc.title': 'ScrachMo — Programe com blocos no celular',
      'doc.desc': 'Ambiente de programação visual inspirado no Scratch, feito para o celular. Sem conta, sem instalação, 4 idiomas e funciona offline.',
      'brand.tag': 'ESTÚDIO MÓVEL',
      'nav.features': 'O que dá para fazer', 'nav.how': 'Como começar',
      'nav.support': 'Apoiar', 'nav.launch': 'Abrir o app',
      'hero.eyebrow': 'Sem conta · Sem instalar · Funciona offline',
      'hero.title': 'Programe com blocos direto do celular',
      'hero.lead': 'Um ambiente visual inspirado no Scratch, feito para telas verticais. Escolha personagens, encaixe blocos e jogue o que criou no mesmo lugar.',
      'hero.cta': 'Abrir o ScrachMo', 'hero.share': 'Copiar link direto',
      'hero.hint': 'Link direto para o app:',
      'hero.note': 'Já conhece? Salve esse link ou instale o app: os dois levam direto ao editor.',
      'mock.title': 'meu primeiro jogo', 'mock.play': 'JOGANDO',
      'mock.flag': 'ao clicar em 🏳️', 'mock.move': 'mover 10 passos',
      'mock.say': 'dizer Oi! por 2 s', 'mock.forever': 'para sempre',
      'mock.sound': 'tocar som «pop»',
      'stat.blocks': 'blocos para montar', 'stat.sprites': 'personagens e objetos',
      'stat.langs': 'idiomas da interface', 'stat.offline': 'utilizável offline',
      'feat.kicker': 'Tudo o que você precisa',
      'feat.title': 'Tela pequena, possibilidades enormes',
      'feat.sub': 'O que normalmente precisa de um computador, aqui se resolve com o polegar. E sem criar nenhuma conta.',
      'f1.title': 'Blocos que se encaixam',
      'f1.text': 'Movimento, sensores, sons, variáveis, condicionais, clones e repórteres. Arraste, solte e teste na hora.',
      'f2.title': 'Personagens com fantasias',
      'f2.text': '321 figuras em 16 grupos, suas próprias imagens, SVG e até 12 fantasias por personagem.',
      'f3.title': 'Feito para o celular',
      'f3.text': 'Interface vertical, controles de toque, modo jogo em tela cheia e zoom no cenário e no código.',
      'f4.title': 'Compartilhe com um link',
      'f4.text': 'Seu projeto viaja comprimido na URL. Passe para quem quiser e abre igual: sem servidor, sem cadastro.',
      'f5.title': 'Instalável e funciona offline',
      'f5.text': 'É um PWA: adicione à tela inicial e continue programando sem internet. Guarde vários projetos no navegador.',
      'f6.title': 'Ponte para o Scratch',
      'f6.text': 'Exporte para .sb3 e continue no Scratch. O que não tem equivalente é avisado e fica comentado no projeto.',
      'how.kicker': 'Em três passos', 'how.title': 'Da ideia ao jogo, sem etapas',
      'how.sub': 'Nada de instalar, compilar ou criar conta. É entrar e já programar.',
      's1.title': 'Escolha um personagem',
      's1.text': 'Emojis, animais, veículos, flechas ou sua própria imagem. Toque no cenário para posicioná-lo.',
      's2.title': 'Encaixe os blocos',
      's2.text': 'Arraste da paleta: «ao clicar na bandeira», «mover», «para sempre», «se tocar…». Cada script roda em sua própria thread.',
      's3.title': 'Jogue e compartilhe',
      's3.text': 'Toque em Executar, teste em tela cheia e gere um link para mostrar.',
      's3.link': 'Abrir o editor →',
      'sup.kicker': 'Feito com carinho',
      'sup.title': 'Um projeto pessoal, livre e sem condições',
      'sup.quote': '«Se você gosta do ScrachMo, fica a seu critério uma menção ou uma doação para o autor.»',
      'sup.extra': 'E se não quiser, também está ótimo: use, ensine, modifique e compartilhe. É software livre (MIT), sem contas, sem anúncios e sem rastreadores. O que mais ajuda é alguém usar para criar algo.',
      'sup.coffee': 'Me pague um cafezinho', 'sup.kofi': 'Apoiar no Ko-fi',
      'sup.github': 'Ver o código no GitHub',
      'foot.app': 'Ir direto para o app', 'foot.mit': 'Licença MIT',
      'foot.made': 'Feito com carinho por Hugo Martín Villalba',
      'foot.note': 'Inspirado no Scratch · Feito para o celular',
      'share.title': 'ScrachMo', 'share.text': 'Programe com blocos direto do celular',
      'toast.copied': 'Link copiado', 'toast.fail': 'Copie este link:'
    },
    fr: {
      'doc.title': 'ScrachMo — Programmez par blocs sur votre téléphone',
      'doc.desc': 'Un environnement de programmation visuelle inspiré de Scratch, conçu pour le mobile. Sans compte, sans installation, 4 langues et fonctionne hors ligne.',
      'brand.tag': 'STUDIO MOBILE',
      'nav.features': 'Fonctionnalités', 'nav.how': 'Commencer',
      'nav.support': 'Soutenir', 'nav.launch': 'Ouvrir l’appli',
      'hero.eyebrow': 'Sans compte · Sans installation · Fonctionne hors ligne',
      'hero.title': 'Programmez avec des blocs depuis votre téléphone',
      'hero.lead': 'Un environnement visuel inspiré de Scratch, pensé pour les écrans verticaux. Choisissez des personnages, emboîtez les blocs et jouez votre création au même endroit.',
      'hero.cta': 'Ouvrir ScrachMo', 'hero.share': 'Copier le lien direct',
      'hero.hint': 'Lien direct vers l’appli :',
      'hero.note': 'Déjà venue ? Enregistrez ce lien ou installez l’appli : les deux ouvrent directement l’éditeur.',
      'mock.title': 'mon premier jeu', 'mock.play': 'EN JEU',
      'mock.flag': 'quand 🏳️ est cliqué', 'mock.move': 'avancer de 10 pas',
      'mock.say': 'dire Bonjour ! pendant 2 s', 'mock.forever': 'répéter indéfiniment',
      'mock.sound': 'jouer le son « pop »',
      'stat.blocks': 'blocs à assembler', 'stat.sprites': 'personnages et objets',
      'stat.langs': 'langues d’interface', 'stat.offline': 'utilisable hors ligne',
      'feat.kicker': 'Tout ce qu’il faut',
      'feat.title': 'Petit écran, grandes possibilités',
      'feat.sub': 'Ce qui demande d’habitude un ordinateur se fait ici du bout du pouce. Et sans créer aucun compte.',
      'f1.title': 'Des blocs qui s’emboîtent',
      'f1.text': 'Mouvement, capteurs, sons, variables, conditions, clones et rapporteurs. Glissez, déposez et testez aussitôt.',
      'f2.title': 'Personnages et costumes',
      'f2.text': '321 figures en 16 groupes, vos propres images, SVG et jusqu’à 12 costumes par personnage.',
      'f3.title': 'Pensée pour le mobile',
      'f3.text': 'Interface verticale, commandes tactiles, mode jeu plein écran et zoom sur la scène comme sur le code.',
      'f4.title': 'Partager avec un lien',
      'f4.text': 'Votre projet voyage compressé dans l’URL. Envoyez-la à qui vous voulez : elle s’ouvre pareil, sans serveur ni inscription.',
      'f5.title': 'Installable et hors ligne',
      'f5.text': 'C’est une PWA : ajoutez-la à l’écran d’accueil et continuez sans connexion. Stockez plusieurs projets dans le navigateur.',
      'f6.title': 'Un pont vers Scratch',
      'f6.text': 'Exportez en .sb3 pour continuer dans Scratch. Ce qui n’a pas d’équivalent est signalé et laissé en commentaire.',
      'how.kicker': 'En trois étapes', 'how.title': 'De l’idée au jeu, sans obstacle',
      'how.sub': 'Rien à installer, rien à compiler, aucun compte. Ouvrez et vous programmez déjà.',
      's1.title': 'Choisissez un personnage',
      's1.text': 'Emojis, animaux, véhicules, flèches ou votre propre image. Touchez la scène pour le placer.',
      's2.title': 'Emboîtez les blocs',
      's2.text': 'Glissez depuis la palette : « quand le drapeau est cliqué », « avancer », « répéter indéfiniment », « si touche… ». Chaque script a son propre fil.',
      's3.title': 'Jouez et partagez',
      's3.text': 'Lancez Exécuter, essayez en plein écran et générez un lien à montrer.',
      's3.link': 'Ouvrir l’éditeur →',
      'sup.kicker': 'Fait avec soin',
      'sup.title': 'Un projet personnel, libre et sans conditions',
      'sup.quote': '« Si ScrachMo vous plaît, une mention ou un don à l’auteur reste à votre discrétion. »',
      'sup.extra': 'Et sinon, c’est très bien aussi : utilisez-le, enseignez-le, modifiez-le et partagez-le. C’est un logiciel libre (MIT), sans comptes, sans publicité ni traqueurs. Ce qui aide le plus, c’est que quelqu’un s’en serve pour créer.',
      'sup.coffee': 'Offrez-moi un café', 'sup.kofi': 'Soutenir sur Ko-fi',
      'sup.github': 'Voir le code sur GitHub',
      'foot.app': 'Aller directement à l’appli', 'foot.mit': 'Licence MIT',
      'foot.made': 'Fait avec soin par Hugo Martín Villalba',
      'foot.note': 'Inspiré de Scratch · Pensé pour le mobile',
      'share.title': 'ScrachMo', 'share.text': 'Programmez avec des blocs depuis votre téléphone',
      'toast.copied': 'Lien copié', 'toast.fail': 'Copiez ce lien :'
    }
  };

  const IDS = ['es', 'en', 'pt', 'fr'];
  let actual = 'es';

  function elegir() {
    let guardado = null;
    try { guardado = localStorage.getItem('scrachmo_landing_lang'); } catch (e) { }
    if (IDS.indexOf(guardado) > -1) return guardado;
    const n = String(navigator.language || 'es').toLowerCase().slice(0, 2);
    return IDS.indexOf(n) > -1 ? n : 'es';
  }

  function aplicar(l) {
    const t = TEXT[l] || TEXT.es;
    actual = IDS.indexOf(l) > -1 ? l : 'es';
    document.documentElement.lang = actual;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const v = t[el.getAttribute('data-i18n')];
      if (typeof v === 'string') el.textContent = v;
    });
    if (t['doc.title']) document.title = t['doc.title'];
    const desc = document.querySelector('meta[name="description"]');
    if (desc && t['doc.desc']) desc.setAttribute('content', t['doc.desc']);
    const sel = document.getElementById('langSel');
    if (sel) sel.value = actual;
  }

  function appHref() { return new URL('app.html', location.href).href; }

  let toastTimer = null;
  function avisar(msg) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('on'), 2800);
  }

  async function compartir() {
    const t = TEXT[actual];
    const link = appHref();
    try {
      if (navigator.share) {
        await navigator.share({ title: t['share.title'], text: t['share.text'], url: link });
        return;
      }
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(link);
      } else {
        const tmp = document.createElement('textarea');
        tmp.value = link;
        tmp.setAttribute('readonly', '');
        tmp.style.cssText = 'position:fixed;top:-1000px;opacity:0';
        document.body.appendChild(tmp);
        tmp.select();
        const ok = document.execCommand('copy');
        tmp.remove();
        if (!ok) throw new Error('copy');
      }
      avisar(t['toast.copied']);
    } catch (e) {
      if (e && e.name === 'AbortError') return; /* canceló el panel de compartir */
      avisar(t['toast.fail'] + ' ' + link.replace(/^https?:\/\//, ''));
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    aplicar(elegir());

    const sel = document.getElementById('langSel');
    if (sel) sel.addEventListener('change', function () {
      aplicar(sel.value);
      try { localStorage.setItem('scrachmo_landing_lang', actual); } catch (e) { }
    });

    const url = document.getElementById('appUrl');
    if (url) url.textContent = appHref().replace(/^https?:\/\//, '').replace(/\/$/, '');

    const version = document.getElementById('version');
    if (version) version.textContent = 'ScrachMo ' + VERSION;

    const btn = document.getElementById('shareApp');
    if (btn) btn.addEventListener('click', compartir);
  });
})();
