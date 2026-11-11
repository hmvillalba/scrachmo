# ScrachMo

[English](README.en.md) · [Español](README.md) · [Português](README.pt.md) · **Français**

> Programme avec des blocs façon Scratch, directement depuis ton téléphone.

**ScrachMo** est un environnement de programmation visuelle inspiré de [Scratch](https://scratch.mit.edu), repensé de zéro pour les écrans verticaux : les panneaux s'empilent l'un sous l'autre, les blocs sont grands et pensés pour le pouce, et tout tourne dans le navigateur sans rien installer.

Pas de framework, pas de dépendance, pas de build : des fichiers statiques qui fonctionnent dans n'importe quel navigateur moderne, sur ordinateur comme sur téléphone.

**Version publiée** : [https://scrachmo.vercel.app](https://scrachmo.vercel.app), servie par Vercel en HTTPS. La racine est la **landing** (présentation du projet en 4 langues) et l'éditeur vit sur **[https://scrachmo.vercel.app/app.html](https://scrachmo.vercel.app/app.html)**, qui est le lien direct et partageable pour entrer sans passer par la présentation. La PWA installée démarre aussi dans l'éditeur. Le dépôt est prêt pour ce déploiement : `vercel.json` et le reste des fichiers statiques sont publiés tels quels, sans compilation.

## Fonctionnalités

### Des blocs comme dans Scratch

- 53 blocs en 9 catégories avec les couleurs classiques de Scratch : mouvement, apparence, son, événements, contrôle, capteurs, opérateurs, variables et **messages locaux**.
- Blocs chapeau (drapeau vert, toucher, touche, secouer le téléphone, recevoir un message, score) et blocs C : `Répéter {v} fois`, `Toujours` et conditionnelles avec `si... sinon`.
- Imbrication réelle : lâche un bloc **au-dessus** d'un `Répéter`, `Toujours` ou `si` et il reste dedans — y compris sur la barre « sinon » —, ou vise l'emplacement si tu préfères. Avec des garde-fous qui empêchent d'imbriquer un bloc dans lui-même ou de mettre un chapeau à l'intérieur.
- **Plusieurs scripts par personnage** : chaque chapeau démarre un script indépendant et seuls ceux qui correspondent à l'événement survenu s'exécutent. Un même personnage peut réagir au drapeau, à une touche et à un toucher en même temps.
- Encoches de puzzle sur le haut des blocs et surbrillance visible du bloc en cours d'exécution.
- **`Aller à x : {x} y : {y}`** : deux champs numériques dans un même bloc pour téléporter le personnage à une coordonnée exacte (x de -240 à 240, et y de -180 à 180). C'est la façon de fixer la position de départ d'un script même si l'état final de l'exécution précédente a été enregistré comme état de conception.
- **Reporters : 11 blocs qui renvoient une valeur**. Les emplacements de mouvement, apparence, contrôle, opérateurs, variables et score ont un bouton **ƒ** pour mettre une valeur calculée au lieu d'un nombre fixe : `score`, `position x`, `position y`, `variable {v}`, `chrono`, `au hasard {x} à {y}`, `{x} + {y}`, `{x} − {y}`, `{x} × {y}`, `{x} ÷ {y}` et `{x} > {y}`. Ils peuvent être **imbriqués** —`Avancer de ((position x) + 10)`, `si (score > 10) alors`, `Répéter (au hasard 2 à 5)`— et le **×** du chip ramène au texte libre sans perdre ce que tu avais écrit. Ce ne sont pas des instructions : ils n'apparaissent pas dans la palette et ne s'ajoutent pas seuls, ils vivent dans l'emplacement d'un autre bloc.

### Un éditeur confortable sur petit écran

- **Glisse depuis la palette** : touche un bloc pour l'ajouter à la fin, ou fais-le glisser par sa poignée et lâche-le exactement où tu veux (dans la pile principale ou dans un `Répéter` / `si... sinon`). Au toucher, on l'attrape par la poignée pour ne pas bloquer le défilement ; à la souris, depuis n'importe quelle partie du bloc. Le tap et le clavier continuent de fonctionner pareil.
- **Dupliquer** : chaque bloc a un bouton qui le copie avec toute sa sous-arborescence, en régénérant les ids pour ne pas casser le glisser-déposer ni la surbrillance.
- **Annuler / Rétablir** : boutons et raccourcis `Ctrl/Cmd+Z`, `Ctrl/Cmd+Shift+Z` et `Ctrl/Cmd+Y`. L'historique garde jusqu'à 60 instantanés et n'interfère pas avec l'annulation de texte dans un champ.
- **Deux zooms indépendants, et les deux agrandissent le contenu et non la fenêtre** : celui de la **zone de code** (70 % à 160 % avec `− / +`, toucher le pourcentage ramène à 100 %) met à l'échelle les blocs dans un panneau dont tu choisis la hauteur en faisant glisser la poignée du bas (ou avec les flèches, poignée sélectionnée) ; celui de la **scène** (même échelle, dans la rangée du bas) rapproche la caméra : les personnages, le fond et les bulles grandissent pendant que la fenêtre de la scène mesure toujours la même chose. Les deux sont mémorisés entre les sessions, ne voyagent pas dans le projet et la ligne d'insertion se corrige toute seule quand on glisse avec le zoom.
- Mise en page mobile-first : panneaux verticaux empilables et repliables, dans le respect des *safe areas* sur les écrans avec encoche.
- **Sur écran large (à partir de 900 px) il passe en deux colonnes** : la scène et les personnages à gauche, le code avec la palette de blocs à droite, et variables et projet en dessous. Sur téléphone il continue de s'empiler pareil, dans l'ordre habituel (Scène → Personnages → Code → Variables → Projet → Blocs) : les colonnes « se dissolvent » avec `display:contents` et l'ordre est décidé par `order`. Le mode jeu reste à part : là on ne voit que le terrain, avec la proportion du jeu et non celle de l'écran. Sur un téléphone couché, marges et scène rétrécissent pour que plus de choses tiennent.
- Interaction 100 % tactile (pointer events) : touche pour ajouter, glisse par l'icône pour réordonner ou imbriquer. Il y a aussi un réordonnancement au clavier.

### Scène et personnages

- Plusieurs personnages, chacun avec son propre programme : créer, supprimer et basculer entre eux.
- **Catalogue de 321 personnages** organisé en 16 groupes (animaux, espace, véhicules, moyen âge, horreur, jeux et sports, flèches et panneaux, formes et couleurs, fruits, légumes, nourriture, nature, fantastique, objets, outils et musique), avec une recherche qui ignore les accents et les majuscules et accepte des mots en espagnol, anglais, portugais et français. Seuls entrent des emojis que tous les systèmes dessinent : pas de carrés vides.
- Mouvement, direction, taille, rotation, visibilité et bulles de dialogue. La direction accepte les **tours complets** : écris 270 ou 359 et le personnage tourne vraiment (la valeur est enregistrée comme −90 ou −1, ce qui est le même angle). Les bulles se lisent à l'horizontale, avec une largeur selon le texte et un retour à la ligne quand le message est long.
- **La bulle peut être agrandie ou réduite depuis le bloc lui-même** : *Dire* porte un champ `%` (50 à 250) à côté du message. La taille est enregistrée dans `node.zoom`, pas dans le texte, donc un message avec des virgules reste entier et les anciens projets, sans ce champ, s'affichent à 100 %. Le zoom met à l'échelle la bulle entière —police, largeur maximale, rembourrage et coins— et aussi en mode jeu.
- **Zoom de la scène** : avec `− / 130 % / +` la caméra se rapproche ou s'éloigne : les personnages, le fond et les bulles grandissent, mais **la fenêtre de la scène mesure toujours la même chose** (avant, le zoom étirait la scène et la page entière changeait de taille). Les positions restent des pourcentages du monde, donc glisser un personnage et les blocs de mouvement ne se décalent pas, et le glisser divise par le zoom pour que le personnage suive le bout du doigt. Cela s'applique aussi en mode jeu.
- **Une scène aussi grande que nécessaire** : le monde mesure 480 × 360 unités d'usine, mais il grandit en faisant glisser les poignées du bord —celle du bas change la hauteur, celle de droite la largeur et le coin les deux, jusqu'à 1440 × 1080—. Il grandit **vers la droite et vers le bas**, donc ce qui était déjà placé ne bouge pas d'un pixel et le nouvel espace reste libre pour plus de personnages ou pour un terrain plus long. Les bords, les rebonds, les collisions et le recadrage des champs `x`/`y` suivent la nouvelle taille, la taille voyage dans le projet et dans les liens, et **Revenir à la taille d'origine** (apparaît à côté du zoom quand la scène n'est plus celle d'usine) remet tout à 480 × 360 en recadrant ce qui restait dehors. Au clavier, les flèches sur la poignée agrandissent de 60 unités.
- **Mode jeu avec le terrain en 4:3** : le bouton *Lancer* ne laisse que la scène, centrée et aussi grande que possible, avec des bandes de la couleur de fond. La proportion est toujours celle du monde —480 × 360 unités d'usine, soit 4:3, ou celle que tu as choisie si tu as agrandi la scène— et elle n'est jamais étirée : si elle l'était, 100 pas vers le haut paraîtraient plus grands que 100 vers la droite et ce qu'on voit ne correspondrait plus aux collisions, qui se calculent en unités. Sur un téléphone à la verticale, un avis discret apparaît en bas —« Tournez le téléphone pour agrandir »— qu'on peut fermer et qui ne revient pas avant la partie suivante.
- **Fond propre à la scène** : importe ta propre image (PNG, JPG, WebP, GIF, BMP ou SVG) depuis l'icône de la carte *Scène*. Elle est redessinée à 1280 px maximum, compressée en WebP/PNG et affichée avec `cover`. Le bouton **Retirer mon fond** revient aux 6 dégradés ; utiliser `changer de fond` sort aussi du fond personnalisé. Il voyage dans la sauvegarde et dans les liens partagés, et les URL externes sont refusées pour des raisons de sécurité.
- Variables avec pas configurables (+ / −) et option pour les afficher sur la scène.

### Clones

- **`Créer un clone de [moi-même / un personnage]`** fait une copie vivante du personnage avec sa position, sa direction, sa taille, sa visibilité et son costume du moment. Le clone partage les scripts et les variables avec son original, mais il se déplace, tourne, change de taille et de costume tout seul.
- **`Quand je démarre en clone`** est le chapeau qui s'exécute dans chaque copie dès sa naissance. Un clone **ne** lance **pas** le drapeau vert ni les autres chapeaux : s'il le faisait, chaque copie répéterait tout ce que fait l'original.
- **`Supprimer ce clone`** fait disparaître la copie qui l'exécute, et son script est coupé à ce bloc même. Sur le personnage original il ne fait rien, comme dans Scratch.
- **`Si touche [un personnage]`** est la version ciblée de `Si touche un autre personnage` : ce n'est vrai qu'avec ce personnage **ou avec n'importe lequel de ses clones**, donc c'est utile pour qu'un tir sache s'il a touché un rocher et pas autre chose. Avec « moi-même », il se comporte comme `Si touche un autre personnage`.
- **`Supprimer le clone de [un personnage] que je touche`** fait disparaître exactement la copie que celui qui l'exécute est en train de toucher, pas toutes : un tir détruit ce qu'il touche et disparaît, sans vider l'écran. S'il touche l'original il ne fait rien, parce qu'un original ne se supprime pas.
- Les clones **entrent en collision** entre eux et avec les originaux, et parlent avec leur propre bulle.
- **Ils ne sont pas enregistrés** : ils existent seulement pendant l'exécution. Arrêter les supprime tous ; laisser le script se terminer les laisse à l'écran, comme état final. La limite est de **300 clones**, la même que Scratch, pour qu'on ne puisse pas bloquer le téléphone.
- Ils sont exportés en `.sb3` avec leurs trois blocs natifs, donc un jeu de clones fonctionne pareil dans Scratch.

### Costumes et images personnelles

- **Importe tes propres images** (PNG, JPG, WebP, GIF, BMP ou SVG) depuis le bouton *Importer mes images…* du catalogue, ou depuis *Ajouter des costumes* dans les propriétés d'un personnage. Tu peux en choisir plusieurs à la fois et aussi créer un nouveau personnage entièrement fait de tes dessins ou de tes photos.
- **Jusqu'à 12 costumes par personnage**, avec une bande de vignettes pour les voir, choisir l'actif et supprimer ceux que tu ne veux pas (il en reste toujours au moins un).
- Chaque image est **redessinée dans un canvas**, ajustée à 256 px maximum et ré-encodée en WebP (ou PNG si le navigateur ne prend pas WebP en charge). Le fichier d'origine n'est jamais enregistré : **un SVG est accepté, mais il est converti en bitmap à l'import**, donc un `data:image/svg+xml` ne se retrouve jamais dans le projet ni dans les liens (un SVG peut contenir un script). Comme il est vectoriel, le SVG lui grandit jusqu'à 256 px au lieu de rester à la taille où tu l'as dessiné, et sa proportion vient du `width`/`height` ou, à défaut, du `viewBox`. Les URL externes et les `.svgz` sont refusés (ils arrivent compressés et le navigateur ne les ouvre pas comme image), et il y a une limite de poids par image.
- Les deux nouveaux blocs d'**Apparence** permettent d'animer comme dans Scratch : `Costume suivant` et `Changer de costume : {v}` (un sélecteur avec les noms de tes costumes). Combinés à `Répéter`, `Avancer de` et `Attendre`, ils simulent la marche, le battement d'ailes, les rotations, etc.
- Le bloc `Changer de costume :` enregistre le **nom**, pas la position : supprimer ou réordonner des costumes ne fait pas pointer le bloc sur un autre. Les anciens projets avec des valeurs numériques restent lisibles.
- Les emojis du catalogue continuent de fonctionner comme un costume de plus : les projets enregistrés avant cette version sont migrés automatiquement.

### Sons et musique

- **7 blocs de son** : les deux habituels (`Miaou` et `Pop`) plus **`Jouer le son {v}`** avec 8 sons au choix, **`Jouer la musique {v}`** avec 3 mélodies en boucle, **`Arrêter les sons`**, **`Mettre le volume à {v} %`** et **`Changer le volume de {v}`**.
- **Il n'y a pas de fichiers audio** : tout est synthétisé avec WebAudio au moment de la lecture (oscillateurs avec enveloppe et bruit filtré pour les coups et les explosions). Ainsi l'app continue de s'ouvrir en double-clic (`file://`), la PWA n'a rien de plus à mettre en cache et il n'y a pas de droits d'auteur en jeu.
- Les sons sont **bip, miaou, pop, pièce, saut, explosion, applaudissement et cloche** ; les mélodies, **joyeuse, triste et de jeu**. Le bloc enregistre l'**id** du son, pas son nom : changer de langue ne casse pas les projets.
- **Le volume appartient au projet** (0 à 100, démarre à 100) et est enregistré avec lui, donc un jeu peut arriver avec la musique plus basse. Il s'applique sur un nœud maître, donc un `Mettre le volume` s'entend instantanément même dans une mélodie déjà en cours.
- La musique **se répète jusqu'à ce que tu l'arrêtes** ou que tu en mettes une autre. `Arrêter les sons` coupe tout ce qui joue, musique comprise, et **Arrêter la coupe aussi** : sinon elle jouerait pour toujours parce que personne d'autre ne l'éteindrait.
- `Jouer le son` **n'attend pas la fin du son** (comme dans Scratch) : pour les enchaîner, mets `Attendre` en dessous.

### Exécution

- Lancer / Arrêter, avec surbrillance du bloc qui s'exécute à chaque instant. Plusieurs scripts peuvent tourner en parallèle sans perdre la surbrillance ni mélanger leurs conditions.
- **Le drapeau démarre tout le projet, pas seulement le personnage en cours d'édition** : que le personnage sélectionné n'ait pas de blocs n'empêche rien, parce que les scripts sont parcourus dans tous les personnages. Ce qui compte, c'est le **chapeau** : un script ne démarre avec *Lancer* que s'il commence par **Au démarrage** (ou si les blocs sont détachés, ce qui compte comme drapeau). Si le projet a des blocs mais qu'aucun ne pend à ce chapeau —par exemple, tout est sous « Touche pressée »— l'app le dit avec un avis au lieu de rester muette.
- Événements : drapeau vert, toucher sur la scène, **Touche {v} pressée** (un menu avec espace, Entrée, les quatre flèches, les 26 lettres et les 10 chiffres), secouer l'appareil, score et messages. Le chapeau de score se déclenche une seule fois par seuil, il ne se ré-enclenche pas en boucle.
- **Les personnages restent là où ils ont terminé** : en arrêtant ou à la fin des scripts, ils ne reviennent plus à zéro. La position, le costume, la taille, la visibilité et le fond que le programme a laissés deviennent l'état de conception : ils sont enregistrés et sont le point de départ de l'exécution suivante. Si tu veux défaire ce parcours, touche **Revenir au départ** (apparaît sous la scène après la première exécution) et l'instantané pris au lancement est restauré. Pendant l'exécution, aucun enregistrement automatique ; le score, lui, est conservé entre les exécutions.
- Boucles avec plafond de sécurité : un `Répéter` ou `Toujours` incontrôlé ne bloque pas le navigateur.
- Sur iOS 13+, l'autorisation de mouvement est demandée dès le premier toucher, comme le système l'exige.

### Jouer sur téléphone : manette à l'écran

- **Le problème** : *Touche pressée* se déclenche sur un vrai `keydown`. Sur un téléphone il n'y a pas de clavier, donc un jeu de flèches était **injouable** même avec un projet bien construit. Toucher l'écran fonctionnait (*Au toucher*), mais cela ne remplace pas les flèches.
- **La solution** : en **mode jeu**, une **manette tactile** apparaît sur la scène. Elle déclenche **les mêmes scripts** que la touche physique, donc le projet ne change pas et continue de fonctionner pareil au clavier.
- **Elle n'affiche que ce que le projet utilise** : les chapeaux *Touche pressée* de tous les personnages sont lus. S'il y a des flèches, le pad directionnel apparaît ; s'il y a aussi espace ou des lettres, ils apparaissent en boutons ronds à droite (l'espace s'appelle *Action*). Si le projet n'utilise pas de touches, rien n'apparaît.
- **Les flèches inutilisées restent invisibles mais dans leur case**, donc le pad ne se démonte pas quand le jeu n'a que gauche et droite.
- **Maintenir appuyé répète** toutes les 110 ms, comme l'auto-repeat du clavier : le personnage marche d'un trait au lieu de faire un pas par toucher. En relâchant, ça s'arrête.
- **Ça ne déclenche pas « au toucher » au passage** : le toucher de la manette s'arrête là, donc un jeu qui a les deux ne fait pas les deux à la fois.
- Dans l'éditeur, si le projet utilise des touches et que l'appareil n'a pas de clavier (pointeur grossier), l'indice de la scène dit qu'on joue depuis **Lancer**.
- C'est un `role="group"` avec un libellé traduit et chaque bouton a son `aria-label` ; il s'utilise au clavier et respecte l'*encoche* (`env(safe-area-inset-bottom)`).

### Incliner le téléphone au lieu de chercher la flèche

La manette règle la question du pouce, mais pour déplacer un personnage dans quatre directions, **incliner l'appareil** est plus confortable que viser un bouton. L'accéléromètre sert de **détecteur d'événements** : incliner déclenche la même touche que le clavier et que la manette, donc aucun projet ne change.

- **C'est optionnel et ça se coupe** : en mode jeu, une pastille **Incliner** apparaît au-dessus de la manette, éteinte par défaut. Elle est mémorisée entre les sessions (`scrachmo_tilt`) et, mode éteint, le capteur ne déclenche rien. Elle n'est proposée que si le projet utilise des flèches et si l'appareil a un capteur : sur un ordinateur elle n'apparaît pas.
- **Le zéro, c'est la posture de départ, pas le téléphone droit** : personne ne joue avec l'appareil à la verticale. La première lecture après avoir activé le mode (et au début de chaque partie) sert de référence, donc le jeu démarre immobile quelle que soit la façon dont tu le tiens.
- **Zone morte avec mémoire** : pour allumer un axe il faut dépasser 13° par rapport à cette référence, et pour l'éteindre descendre sous 7,5°. Sans cette bande, le pouls allumerait et éteindrait la touche sans arrêt.
- **Le capteur ne tourne pas avec l'écran** : les coordonnées de l'accéléromètre sont celles de l'appareil, donc l'axe « droite » est tourné à la main selon `screen.orientation.angle` (0°, 90°, 180°, 270°). Sans ça, à l'horizontale les flèches sortent croisées.
- **Ça ne déclenche que des touches que le projet utilise** et **ça répète tant que l'inclinaison dure**, comme la manette. Pendant ce temps, la flèche correspondante du pad s'allume : c'est comme ça qu'on voit si le capteur lit.
- **Droite/gauche**, c'est incliner le bord droit ou le gauche vers le bas ; **haut/bas**, c'est éloigner ou rapprocher l'écran. En arrêtant le jeu ou en sortant du mode jeu, le capteur est coupé (`stopTiltRepeat()`), sinon le personnage continuerait de marcher tout seul.
- Sur iPhone, l'autorisation de mouvement est demandée **dans un vrai geste** : toucher la pastille compte comme geste, et si elle est refusée, l'avis le dit.

### Messages locaux (anciennement « Multijoueur »)

- L'ancien nom **mentait** : la catégorie s'appelait « Multijoueur » et les blocs parlaient d'« autres joueurs sur le réseau local ». Elle s'appelle maintenant **Messages** et dit ce qu'elle fait.
- `Envoyer un message` écrit une marque dans `localStorage` ; `À la réception` écoute l'événement `storage`. **Il n'y a ni réseau, ni serveur, ni autres appareils** : ça arrive aux scripts du même projet et aux autres onglets du même navigateur et de la même origine. Le bouton *Messages* des outils active ou désactive seulement la réception depuis d'autres onglets ; l'avis à l'intérieur du projet arrive toujours (l'événement `storage` ne se déclenche pas dans l'onglet qui écrit).
- Pour jouer entre deux téléphones, il faudrait un backend avec WebSockets ou un service temps réel. ScrachMo n'a pas de backend par choix : c'est ce qui lui permet de s'ouvrir en double-clic et d'être publié comme site statique sur Vercel.

### Capteurs et collisions

- **`Rebondir au bord`** : si le personnage touche un bord, il fait demi-tour et continue. La direction est corrigée selon le côté : contre un mur vertical, la composante horizontale est inversée (`direction → −direction`) et contre le sol ou le plafond la verticale (`direction → 180 − direction`), donc le personnage sort à l'angle en miroir et ne reste pas collé au bord.
- **`Si touche le bord`** et **`Si touche un autre personnage`** : des conditions pour envelopper ce que tu veux, avec le même `si` / `sinon` que d'habitude. Les deux exécutent le contenu qu'elles enveloppent. La seconde ignore les personnages cachés et elle-même, donc un costume invisible ne bloque ni ne déclenche de collision.
- **`Réinitialiser le chrono`** et le reporter **`chrono`** : il renvoie les secondes (avec une décimale) depuis l'ouverture du projet ou depuis la dernière réinitialisation. Utile pour « survis 30 secondes », les comptes à rebours avec `si (chrono > 10) alors` et pour mesurer des temps dans un jeu.
- Les collisions utilisent la géométrie de la scène, mais **avec un cercle par personnage** : chacun est approché par un cercle de rayon 26 unités à 100 % de taille (la scène mesure 480 × 360 d'usine, et si tu l'agrandis les bords suivent) et les bords sont mesurés contre ce cercle, donc la collision a lieu quand le corps du personnage atteint la limite et non quand le cadre du dessin la touche. Ce n'est pas une collision au pixel près : avec un personnage très allongé ou très fin, le contact semble un peu généreux ou un peu tardif.
- Tout cela tourne aussi en **mode jeu**, et le chrono ne se réinitialise pas quand on appuie sur *Lancer* : si tu veux qu'il revienne à zéro, mets `Réinitialiser le chrono` au début du script.

### Projets

- **Plusieurs projets nommés** : la carte *Projet* contient **Mes projets**, avec la liste de tout ce qui est enregistré sur l'appareil. De là tu peux **créer**, **ouvrir**, **renommer**, **dupliquer** et **supprimer** (jusqu'à 24), et le bouton affiche toujours le nom du projet ouvert. En ouvrir un autre n'écrase plus le précédent : chacun est enregistré à part et celui qui était ouvert est sauvegardé avant le changement. On ne peut pas supprimer le dernier.
- **Sauvegarde de toute la bibliothèque** : **Exporter la bibliothèque** télécharge un `.json` avec le format, la version, le projet actif et **tous** les projets avec leurs données complètes (l'actif est sérialisé au moment même, il n'est pas pris dans une vieille copie). Utile pour sauvegarder avant de nettoyer le navigateur ou pour déplacer le travail sur un autre appareil.
- **La suppression peut être annulée** : en confirmant une suppression, le projet (nom, position dans la liste et son JSON) reste en mémoire pour la session et **Annuler la suppression** apparaît dans la modale. Le bouton se cache quand il n'y a plus rien à restaurer.
- Enregistrement automatique sur l'appareil (localStorage), y compris le score, l'état de l'option de messages locaux, tous les costumes et le fond personnalisé. Les préférences de l'interface (panneaux repliés, zoom des blocs et zoom de la scène) sont enregistrées à part dans `scrachmo_ui`, en acceptant l'ancien format. Si l'espace de l'appareil se remplit, l'app le dit au lieu d'échouer en silence.
- **Partager** : génère un lien avec le projet à l'intérieur (`?p=...`) à envoyer aux amis ; en l'ouvrant, le projet se charge tout seul. Le JSON est **compressé en gzip** (`g1.`) et encodé en base64url, donc les costumes voyagent dans un lien bien plus court. Si le navigateur n'a pas `CompressionStream`, il retombe sur du JSON non compressé (`j1.`), et les anciens liens en base64 simple s'ouvrent toujours pareil.
- Si le lien dépasse 8000 caractères, l'app prévient que certaines messageries peuvent le couper et qu'il vaut mieux utiliser moins d'images ou exporter le `.scmo`.
- Interface en espagnol, anglais, portugais et français.

### Exemples et guide

- **Exemples** est dans la carte d'outils et ouvre trois projets d'exemple avec leurs blocs déjà construits : **Dis bonjour** (bulle de dialogue avec sa propre taille et marche avec les flèches), **Attrape le fruit** (des clones qui tombent, un score et un panier qui se déplace sans se retourner) et **Évite les comètes** (des clones, une collision avec un personnage précis, des points qui montent tout seuls et se réinitialisent quand on est touché).
- Ouvrir un exemple **crée un nouveau projet** : celui que tu étais en train de construire est sauvegardé et reste dans la liste. L'exemple devient un projet de plus, donc on peut le modifier, le casser et le rouvrir.
- Sous les cartes il y a un **guide rapide** en cinq étapes : choisir un personnage, construire le script, commencer par un chapeau, mettre des reporters avec le bouton `ƒ` et enregistrer ou partager.
- Les exemples ne sont pas du JSON copié : ils sont construits avec les mêmes constructeurs que l'app (`makeNode()`/`createSpriteData()`), donc si le format des nœuds change, les exemples suivent tout seuls. Entre autres choses, ils enseignent le motif `Aller à x : (position x) + 18` pour marcher sans tourner, qu'un clone d'un personnage caché **naît caché** (il faut le montrer) et que « supprimer ce clone » coupe le fil au point d'attente suivant.

### Exporter vers Scratch (`.sb3`)

- **Vers Scratch (.sb3)** est dans la carte d'outils et télécharge un fichier que **Scratch 3 ouvre tel quel** (`Fichier → Importer depuis votre ordinateur`). Ce n'est pas un « enregistrer sous » : ScrachMo construit le ZIP à la main —`project.json` plus un fichier par costume et par son, chacun nommé d'après son **MD5**— avec son propre écrivain de ZIP, son MD5 et son CRC32, sans bibliothèque et sans connexion.
- **Personnages** : chacun voyage comme sprite avec son costume (l'emoji est dessiné en PNG de 128 px ; tes images sont remises à l'échelle à 480 px), sa position, sa direction, sa taille, son style de rotation et sa visibilité. Le fond de la scène —le dégradé ou l'image que tu as importée— va comme costume de la *Stage*.
- **Scripts** : le graphe de blocs complet est reconstruit (`next`, `parent`, `SUBSTACK`, `SUBSTACK2`, chapeaux et menus). Les variables du projet sont déclarées sur la *Stage* et le message est déclaré pour que les blocs d'envoi/réception le trouvent.
- **Sons et mélodies** : aucun fichier n'est copié, ils sont **synthétisés en WAV** (22050 Hz, mono, 16 bits) avec la même recette de pas que le moteur utilise, donc ils sonnent comme ici. Le bruit utilise un générateur pseudo-aléatoire à graine fixe : deux exports du même projet donnent des fichiers identiques.
- **Ce qui est traduit et ce qui ne l'est pas** :

| ScrachMo | Dans Scratch |
| --- | --- |
| `Avancer de`, `Tourner de`, `Aller à x : y :`, `Pointer vers`, `Rebondir au bord` | `motion_*` (le rebond utilise le bloc propre à Scratch) |
| `Dire`, `Penser`, `Montrer`, `Cacher`, `Taille`, `Costume suivant`, `Changer de costume :` | `looks_*` avec les noms de tes costumes |
| `Jouer le son`, `Arrêter les sons`, `volume` | `sound_*` avec les sons générés |
| `Au démarrage`, `Au toucher`, `Touche pressée`, `À la réception` | `event_*` |
| `Attendre`, `Répéter`, `Toujours`, `si`, `si/sinon`, `Si touche le bord`, `Si touche` | `control_*` et `sensing_touchingobject` |
| `Créer un clone de`, `Quand je démarre en clone`, `Supprimer ce clone` | `control_create_clone_of`, `control_start_as_clone`, `control_delete_this_clone` |
| `score` et les variables | variables globales de la *Stage* |
| Messages locaux, secouer, inclinaison, vibrer, créer/montrer des variables, amis, `sinon` détaché, `supprimer le clone que je touche` | **sans équivalent** |

- **Ce qui reste dehors est signalé, pas perdu en silence** : à la fin, l'app dit combien de blocs elle n'a pas pu traduire, et chaque personnage concerné porte un **commentaire attaché à son premier bloc** dans Scratch avec la liste. Ainsi le projet s'ouvre, tourne et on voit où il faut le compléter à la main.
- **Deux différences à garder en tête** : une mélodie joue **une fois** dans Scratch (pas en boucle, parce qu'une boucle dans le script le bloquerait) et le rebond reste avec le bloc natif de Scratch, qui utilise la boîte du costume et non le cercle qu'utilise ScrachMo. Le chemin inverse (ouvrir un `.sb3` dans ScrachMo) n'est pas implémenté.

### À propos et soutien au projet

- Le bouton **ⓘ** de la barre du haut ouvre **À propos de ScrachMo** : auteur, licence MIT, le lien vers l'adresse officielle **scrachmo.vercel.app** et une courte description de ce qu'est l'app. La ligne *Site web* pointe vers l'URL publique de Vercel, pas vers le domaine de l'hébergement précédent.
- Là se trouvent les deux liens de soutien —**Offre-moi un café** et **Soutenir sur Ko-fi**— et la phrase qui le dit sans détour : si tu aimes ScrachMo, une mention ou un don reste à ton appréciation. Rien de tout cela ne conditionne l'usage : l'app est MIT et fonctionne entièrement sans rien payer.
- **Elle affiche la version installée** : la ligne *Version* et le pied de page viennent de `APP_VERSION` dans `data.js`, la même chaîne qui nomme le cache du service worker. C'est ce qui permet de savoir quelle copie on regarde quand on signale un problème.
- **Tout est traduit dans les quatre langues**, y compris cette phrase et les boutons de soutien. Elle se ferme avec *OK*, avec `Escape` ou en touchant en dehors de la carte, et tant qu'elle est ouverte la page derrière ne bouge pas.
- Elle ne touche ni au projet ni à la sauvegarde : elle est informative et peut s'ouvrir à tout moment sans rien perdre.

### L'installer sur téléphone (PWA)

- Elle peut être **installée comme app** : elle a un `manifest.webmanifest` avec nom, icônes (192, 512 et une *maskable* pour Android) et couleur de thème, donc Chrome/Android propose « Installer l'application » et sur iPhone elle s'ajoute à l'écran d'accueil avec sa propre icône. Ouverte ainsi, elle n'affiche pas la barre du navigateur et **va directement à l'éditeur** (`start_url: ./app.html`), pas à la landing.
- **Elle fonctionne sans internet** : un service worker (`sw.js`) enregistre les deux pages et leurs scripts (`index.html`, `app.html`, `landing.js`, `boot.js`, `data.js`, `engine.js`), le manifest et les icônes la première fois qu'on l'ouvre. Ensuite elle démarre depuis le cache et se met à jour toute seule quand il y a du réseau.
- **Recharger suffit pour voir la nouvelle version** : les **navigations** passent *réseau d'abord* et le cache sert de secours (s'il n'y a pas de connexion, ou si le serveur met plus de 4 s, la copie enregistrée sort). Avant c'était l'inverse et une version tout juste publiée n'apparaissait qu'au deuxième rechargement —ou jamais, si l'ancien service worker commandait encore—. Les fichiers (`data.js`, `engine.js`, icônes) sortent toujours du cache, donc l'ouverture reste instantanée.
- **Avis de nouvelle version, traduit** : quand un nouveau service worker prend le contrôle d'un onglet déjà ouvert, une barre apparaît en bas avec **Recharger** et **Plus tard**. Ce n'est pas une modale, elle ne bloque rien et on peut la laisser pour après ; à la première installation elle n'apparaît pas parce qu'il n'y a pas de version précédente à remplacer. Elle écoute `controllerchange` et `updatefound`.
- **Les liens partagés `?p=` s'ouvrent aussi hors ligne** : si l'URL va vers `app.html`, l'éditeur est servi ; si elle va vers la racine avec `?p=` (les anciens liens, d'avant la landing), l'éditeur est servi directement aussi, sans dépendre de la redirection de `landing.js`. Et le cache n'est pas rafraîchi avec cette réponse : sur le réseau la racine renvoie la landing, et l'enregistrer comme `app.html` casserait la PWA.
- Tout cela est **optionnel et ne casse pas le double-clic** : ouverte comme fichier (`file://`) il n'y a pas de service worker et l'app fonctionne exactement pareil, sans cache. L'enregistrement est protégé par `location.protocol !== 'file:'` dans `boot.js`.

### Sécurité et robustesse

- **Ni `eval` ni `Function()`** : les calculs des blocs d'opérateurs, de variables et des conditions passent par un parseur arithmétique maison (`calcExpr()`). Il accepte `+ - * / % **`, les parenthèses, les décimales, le moins unaire, `score`, les variables et `aleatorio(a,b)` ; tout autre texte (y compris du code JavaScript) n'est pas exécuté et renvoie `null`. C'est ce qui permet à l'app de fonctionner sous une CSP stricte.
- **Des dialogues maison et traduits** : les confirmations et les demandes de texte utilisent la modale de l'app (`#askModal`), avec **OK / Annuler**, `Escape`, `Entrée` et le verrouillage du défilement. On n'utilise plus `prompt()`, `confirm()` ni `alert()`, qui coupaient l'interface et ne pouvaient pas être traduits. Si tu appuies sur **Arrêter** avec un dialogue ouvert, il se ferme et le script est annulé.
- **Plafonds à l'import** : un projet `.scmo` ou un lien `?p=` ne peut pas dépasser 8 Mo de texte, 40 niveaux d'imbrication ni 2000 blocs. Si quelque chose est recadré, l'app le dit au lieu de se bloquer.
- **Le plafond s'applique *pendant* la décompression** : les liens `g1.` voyagent en gzip. `inflateLimited()` lit le flux par morceaux avec `DecompressionStream` et coupe dès que `MAX_INFLATE_BYTES` est dépassé (8 M de caractères × 4 octets, pour l'UTF-8), en annulant le reader. Une « gzip bomb » ne peut plus gonfler des dizaines de mégaoctets avant d'être refusée.
- **CSP déclarée dans Vercel** : `script-src 'self'` sans `'unsafe-inline'`, `default-src 'self'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'none'` et `worker-src 'self'`. Il n'y a ni `<script>` inline ni gestionnaires `onclick`/`oninput` dans aucune page ; les garde-fous statiques échouent si quelqu'un en remet un, parce que dans les harnais `file://` il n'y a pas d'en-têtes et l'erreur ne se verrait qu'en production.
- **Modales accessibles au clavier** : les six dialogues partagent `updateModalLock()`. À l'ouverture, on enregistre le contrôle qui avait le focus, on focalise le premier de la modale, le reste de la page devient `inert` et `Tab` / `Shift+Tab` restent piégés dedans (`trapModalKey()`) ; à la fermeture, on retire `inert` et le focus revient là où il était. Avant, `Tab` s'échappait vers l'interface derrière.
- **La frontière des images reste fermée** : le SVG est accepté en entrée et rastérisé, mais `IMG_DATA_RE` n'admet que `webp/png/jpeg/gif` dans les données enregistrées, donc un vecteur avec script n'arrive jamais au projet.

## La landing et le lien direct

`https://scrachmo.vercel.app` affiche la **landing** : une présentation moderne en espagnol, anglais, portugais et français (la langue se choisit en haut et le navigateur s'en souvient), avec hero, maquette de l'éditeur, fonctionnalités, guide en trois étapes et la section de soutien.

- **La langue se choisit à la main, pas seulement par le système** : le sélecteur `ES / EN / PT / FR` de la barre du haut change toute la page instantanément. Sans choix préalable, la langue du système est utilisée ; dès que tu en choisis une, elle est enregistrée dans `scrachmo_landing_lang` **et** dans `scrachmo_lang`, qui est la clé que lit l'éditeur. Ainsi la langue voyage de la landing à l'app dans les deux sens : si tu avais déjà choisi le portugais dans l'éditeur, la landing s'ouvre en portugais.
- **La liste déroulante a besoin de couleurs propres** : le `<select>` fait partie du thème sombre, mais le menu qui s'ouvre est dessiné par le système avec **son** fond. Sans `color-scheme:dark` sur le `<select>` et un `background`/`color` explicites sur ses `<option>`, les options héritaient du texte clair et devenaient **des lettres blanches sur fond blanc**. Comme le popup n'apparaît pas sur une capture, la vérification porte sur les styles calculés et sur le CSS de la landing.
- **Deux liens, deux destinations** : *Ouvrir ScrachMo* / *Ouvrir l'app* vont vers `app.html`. *Copier le lien direct* utilise le panneau natif de partage quand il existe (`navigator.share`) et sinon copie l'URL dans le presse-papiers, avec un avis visible. Ce lien est celui qu'on peut enregistrer ou envoyer à quelqu'un qui a déjà vu la landing.
- **Tout ce qu'il faut, sans compte** : Cafecito, Ko-fi, le dépôt GitHub, la licence MIT, l'auteur et la phrase « Si tu aimes ScrachMo… une mention ou un don reste à ton appréciation ». Aucun lien ne conditionne l'usage de l'app.
- **Les anciens liens s'ouvrent toujours** : les projets partagés avant le déménagement pointaient vers la racine avec `?p=…`. `landing.js` les redirige vers `app.html` avant de dessiner la présentation, et le service worker sert l'éditeur directement s'il n'y a en plus aucune connexion.
- **La PWA va directement à l'éditeur** : `start_url` et l'`id` du manifest pointent vers `./app.html`. Installer ScrachMo ne montre plus la landing.
- `index.html` et `landing.js` sont purement de la présentation : ils ne chargent ni `data.js` ni `engine.js`, ne touchent pas au projet enregistré et n'enregistrent pas le service worker.

## Comment l'utiliser

C'est une app 100 % statique : pas de backend ni d'étapes d'installation.

```bash
# Option 1 : n'importe quel serveur statique
python -m http.server 8000        # → http://localhost:8000
php -S localhost:8000             # idem avec PHP

# Option 2 : XAMPP
# place le projet dans htdocs/ et va sur http://localhost/scrachMo
```

Tu peux aussi ouvrir **`app.html`** directement en double-clic (l'éditeur) ou `index.html` (la landing). Pour l'essayer depuis le téléphone, sers-le sur ton ordinateur et ouvre l'IP locale depuis le navigateur du téléphone (même WiFi), ou utilise la version publiée sur **<https://scrachmo.vercel.app>**.

**Le publier sur Vercel** : l'adresse officielle est `https://scrachmo.vercel.app` et l'éditeur est `https://scrachmo.vercel.app/app.html`. Dans le panneau Vercel on importe le dépôt et rien n'est à configurer : le projet est statique, il n'y a ni *build command* ni *output directory* (la racine est servie), et chaque push sur `main` publie tout seul. `vercel.json` a deux rôles : (1) **`sw.js`, `index.html`, `app.html`, `landing.js` et `boot.js` ne sont pas mis en cache par le CDN** (`Cache-Control: public, max-age=0, must-revalidate`), parce que si le service worker restait en cache, l'app installée ne saurait jamais qu'une nouvelle version existe ; et (2) il déclare une **Content-Security-Policy** avec `script-src 'self'`, plus `X-Content-Type-Options` et `Referrer-Policy`. C'est pourquoi il n'y a ni scripts ni gestionnaires inline dans aucune des deux pages : l'enregistrement du service worker vit dans `boot.js` et le `onclick` du champ de partage a été branché depuis `engine.js`. `style-src` autorise `'unsafe-inline'` (les deux pages portent leur CSS embarqué) et `img-src` autorise `data:` et `blob:` (costumes et SVG).

> **Alternative optionnelle** : `.github/workflows/pages.yml` publie la même app sur GitHub Pages si on active *Settings → Pages → Source: GitHub Actions*. Ce n'est pas le déploiement officiel : si Pages n'est pas activé, ce workflow se termine au vert avec un avis et `deploy = skipped`. C'est normal et cela n'affecte pas Vercel.

Attention : pour l'installation et le mode hors ligne il faut `https` (ou `localhost`) ; c'est pourquoi ça ne fonctionne pas en ouvrant le fichier.

### Le flux de base

1. Choisis un personnage (ou crées-en un depuis le catalogue, en cherchant par nom) et ajoute des blocs : touche la palette pour les ajouter à la fin, ou **fais-les glisser par la poignée** et lâche-les où tu veux. Si tu veux utiliser tes propres dessins, touche **Importer mes images…** et choisis un ou plusieurs fichiers : un personnage est créé avec ces images comme costumes.
2. Fais glisser chaque bloc par son icône pour le réordonner dans la pile ou l'imbriquer dans un bloc C. Avec le bouton **dupliquer** tu copies un bloc complet (avec son contenu), et si tu te trompes, **Annuler / Rétablir** (ou `Ctrl/Cmd+Z` et `Ctrl/Cmd+Shift+Z`) te sauve. Si les blocs deviennent trop petits, utilise le **zoom** de la barre d'outils ; s'il te manque de la place, fais glisser la poignée du bas de la zone de code (ou sélectionne-la et utilise les flèches). Tu veux qu'un champ utilise une valeur calculée au lieu d'un nombre fixe ? Touche le **ƒ** à côté du champ et choisis un reporter (position, score, un calcul, au hasard…) ; le **×** du chip te ramène au texte que tu avais écrit.
3. Pour avoir deux scripts dans le même personnage, ajoute un second bloc chapeau : tout ce qui vient après appartient à ce chapeau. Pour animer, ajoute plusieurs costumes dans **Propriétés → Costumes** et construis un `Répéter` avec `Avancer de` + `Costume suivant` + `Attendre`.
4. Touche **Lancer** et regarde la scène. Tu peux changer le fond avec ta propre image depuis l'icône de la carte *Scène*, et ajuster la taille de la scène et des personnages avec le zoom de la rangée du bas. **Arrêter** coupe tout et les personnages restent là où ils sont arrivés ; si tu veux qu'ils reviennent à la position d'avant l'exécution, touche **Revenir au départ**.

## Structure du projet

| Fichier | Ce qu'il contient |
| --- | --- |
| `index.html` | **Landing** de présentation : styles, hero, maquette de l'éditeur, fonctionnalités, guide, soutien et pied de page. Ne charge pas le moteur. |
| `landing.js` | Textes de la landing en 4 langues, sélecteur de langue, version, lien direct partageable et redirection des anciens `?p=`. |
| `app.html` | **L'éditeur** : toute l'interface, la mise en page, les styles, les icônes SVG et les panneaux. C'est l'URL directe et le `start_url` de la PWA. |
| `boot.js` | Enregistrement du service worker hors du HTML (la CSP l'exige), protégé pour `file://`. |
| `engine.js` | Le moteur : rendu des blocs, glisser-déposer tactile, exécution, personnages, variables, événements, modales accessibles et projet. |
| `data.js` | Catalogue de blocs (53 instructions + 11 reporters), catégories, version visible et textes de l'interface (4 langues). |
| `manifest.webmanifest` | Fiche d'installation : nom, couleurs, `display: standalone`, `start_url: ./app.html` et icônes. |
| `sw.js` | Service worker : enregistre la landing et l'app pour qu'elles s'ouvrent sans internet, et sert `app.html` aux liens `?p=`. Le nom du cache porte la version et une empreinte des six fichiers du runtime. |
| `vercel.json` | En-têtes du déploiement : CSP stricte, `nosniff`, `Referrer-Policy` et les fichiers sans cache CDN. |
| `icons/` | L'icône de l'app en SVG et PNG (192, 512, *maskable* et *apple-touch*). |
| `README.md` et ses traductions | La documentation : l'espagnol dans `README.md` et les versions en `README.en.md`, `README.pt.md` et `README.fr.md`, chacune avec la barre de langues en haut. Les traductions ne répètent pas la section de vérification : elles renvoient à celle de l'espagnol. |
| `tests/` | Suite de tests de fumée sur le DOM réel, vérifications statiques, PWA et le générateur de pages de test. |
| `.github/workflows/test.yml` | CI : syntaxe, parité des textes, garde de version, PWA et la suite dans Chrome headless à chaque push et pull request. |
| `.github/workflows/pages.yml` | Publication **optionnelle** sur GitHub Pages. Le déploiement officiel est Vercel. |

Ce qui s'ouvre dans le navigateur, ce sont les deux pages, leurs scripts, le manifest, le service worker et les icônes ; `vercel.json`, `tests/` et les workflows sont de la configuration et des outils de développement, et ne se chargent pas quand on utilise ScrachMo. Les harnais de test sont construits à partir de **`app.html`**, pas de la landing.

Tu veux ajouter un nouveau bloc ? C'est une entrée dans `data.js` et sa logique dans `engine.js`.

## Vérification

Le projet compte **1171 vérifications par langue, 4684 au total** : chaque scénario tourne **quatre fois —espagnol, anglais, portugais et français— dans Chrome headless**, et les quatre doivent donner 0 échec. En plus, il y a **143 vérifications de PWA** qui n'ont pas besoin de navigateur. Ensemble, elles couvrent le catalogue de blocs et les quatre langues, le moteur et ses événements, les costumes et l'import d'images, l'éditeur et ses outils, la scène et sa taille, les clones, les capteurs et les collisions, les sons et leur vraie synthèse, l'export `.sb3`, la landing et la manette à l'écran avec l'inclinaison.

```bash
node --check data.js && node --check engine.js && node --check sw.js && \
node --check landing.js && node --check boot.js
node tests/check-parity.js       # parité des textes + vérifications statiques
node tests/pwa-check.js          # manifest, icônes et routes servies
node tests/pwa-sw.js             # logique du service worker
node tests/run.js ma-course      # 25 scénarios × 4 langues dans Chrome headless
```

`tests/build.js` construit les pages de test et le lien partagé ; `tests/run.js` lance Chrome avec un profil isolé par suite et par langue, et compte `PASS` / `FAIL` / `ERROR`. Sur GitHub Actions, `.github/workflows/test.yml` répète la même chose à chaque push et pull request.

Le journal complet —ce que chaque suite vérifie, pourquoi quatre langues et `--lang`, les pièges trouvés en chemin, les notes d'environnement de la CI et les règles de version et de cache— reste dans le README en espagnol, qui est la source de vérité pour tout ce qui change à chaque version :

→ **[Verificación (espagnol)](README.md#verificación)**

## Vérification manuelle sur iPhone (WebKit)

La suite automatique tourne dans **Chrome headless**. WebKit —le moteur de Safari et de *tous* les navigateurs d'iOS, parce qu'Apple n'en autorise pas d'autre— n'est pas couvert : le mettre en place dans la CI demande Playwright avec WebKit ou un runner macOS, et il y a des choses qui ne peuvent de toute façon se juger qu'avec le doigt (le capteur, l'audio, l'encoche). Tant que ça n'existe pas, voici la liste qu'on passe **à la main avant chaque version**, avec un iPhone réel et Safari. Cela prend une dizaine de minutes.

| # | Quoi tester | Comment | Ce qui doit se passer |
|---|---|---|---|
| 1 | Installation | Ouvrir `https://scrachmo.vercel.app/app.html` dans Safari → Partager → *Sur l'écran d'accueil* | Elle démarre dans l'**éditeur**, sans la barre de Safari, avec la bonne icône |
| 2 | Hors ligne | Mode avion → ouvrir depuis l'icône | Elle charge pareil (service worker). Créer un personnage, fermer et rouvrir : il est toujours là |
| 3 | Audio | Projet avec `Jouer le son` → **Lancer** | Ça sonne. Si le premier son se perd, c'est le déverrouillage de WebAudio par geste |
| 4 | Autorisation de mouvement | **Lancer** → toucher **Incliner** | iOS demande *Autoriser le mouvement et l'orientation*. Avec *Autoriser*, incliner déplace le personnage |
| 5 | Autorisation refusée | Recommencer en choisissant *Ne pas autoriser* | L'avis apparaît, le jeu **continue avec la manette** et rien ne casse |
| 6 | Inclinaison à l'horizontale | Tourner le téléphone et incliner à droite | Le personnage va à **droite**. S'il va à l'inverse, le bug est dans `tiltBasis()` |
| 7 | Manette | Toucher et **maintenir** une flèche | Il marche d'un trait ; en relâchant, ça s'arrête. Le toucher **ne** déclenche **pas** « au toucher » au passage |
| 8 | Encoche et barre du bas | Mode jeu à la verticale et à l'horizontale | La manette et **Sortir** ne passent pas sous l'encoche ni sous la barre de gestes (`env(safe-area-inset-*)`) |
| 9 | Avis de rotation | **Lancer** avec le téléphone à la verticale | Il apparaît ; le ✕ le ferme et il ne revient pas avant la partie suivante |
| 10 | Images | Importer un gros PNG et un SVG | Ils sont réduits à 256 px ; le SVG entre **converti en bitmap**, pas enregistré en vecteur |
| 11 | `createImageBitmap` | Le même gros costume | Safari n'a pas cette API : `loadBitmap()` retombe sur `<img>` et l'image apparaît quand même |
| 12 | Langue partagée | Passer au français sur la landing → ouvrir l'éditeur | L'éditeur s'ouvre en **français** (les deux clés du `localStorage`) |
| 13 | Export vers Scratch | Exporter le `.sb3` → l'importer sur `scratch.mit.edu` | Les costumes se chargent : chaque fichier est nommé d'après son MD5 |
| 14 | Navigation privée | Ouvrir dans un onglet privé | Ça fonctionne ; si iOS bloque l'enregistrement, l'app le dit et ne casse pas |

Si quelque chose échoue, note **modèle, version d'iOS et si c'est arrivé dans Safari ou dans l'app installée** : les trois changent le comportement de WebKit, et sans eux le rapport ne sert à rien.

## Limites connues

Mieux vaut être honnête que vendeur :

- **L'export `.sb3` est à sens unique, et il n'est pas complet** : ScrachMo ouvre ses propres formats (`.scmo` et `?p=`, qui sont son propre JSON) mais **ne peut pas importer un `.sb3`**. Et du côté de l'export, il y a des blocs sans équivalent dans Scratch (messages locaux, secouer, inclinaison, vibrer, créer/montrer des variables, amis et le `sinon` détaché) : ils ne sont pas inventés, ils restent dehors et sont signalés dans un commentaire à l'intérieur du projet. Et si tu as agrandi la scène, l'avis le dit aussi : celle de Scratch mesure toujours 480 × 360, donc ce qui sort du cadre d'origine ne sera pas visible. De plus, une mélodie joue **une fois** dans Scratch au lieu de boucler, et le rebond utilise la boîte du costume de Scratch et non le cercle de ScrachMo, donc un personnage très allongé peut rebondir un peu plus tôt ou plus tard.
- **Les collisions ne sont pas au pixel près** : chaque personnage est un cercle de rayon 26 à 100 % de taille, mis à l'échelle par sa taille. C'est rapide et stable, mais un personnage très allongé entre en collision plus tôt ou plus tard que le dessin ne le suggère, et il n'y a ni détection de couleur ni de « touche le pointeur ».
- **Le chrono vit dans la session** : il compte depuis l'ouverture du projet (ou depuis le dernier `Réinitialiser le chrono`), il n'est pas enregistré dans le `.scmo`, il ne se réinitialise pas avec *Lancer* et ne s'arrête pas avec *Arrêter*. Si le jeu a besoin d'un temps, réinitialise-le au début du script.
- **On ne peut pas importer de sons ni enregistrer avec le micro** : le catalogue est fermé (8 sons et 3 mélodies synthétisées) et il n'y a pas d'éditeur audio. Ajouter ses propres sons impliquerait des fichiers ou de l'enregistrement, avec son coût en poids du projet et en cache de la PWA.
- **L'audio a besoin d'un toucher** : les navigateurs mobiles ne laissent rien sonner tant que la personne n'a pas interagi avec la page. ScrachMo reprend le contexte audio chaque fois que quelque chose va sonner, donc un script lancé avec *Lancer* sonne toujours (ce toucher compte déjà) ; ce qui peut rester muet, c'est une musique qui démarre toute seule à l'ouverture d'un lien `?p=`, avant qu'on ait touché quoi que ce soit.
- Les calculs des blocs **n'acceptent plus de JavaScript arbitraire** : seulement des nombres, `+ - * / % **`, des parenthèses, `score`, des variables et `aleatorio(a,b)`. C'était le prix pour retirer `Function()` ; en échange l'app fonctionne sous une CSP stricte.
- Il n'y a pas d'éditeur de costumes : les images sont importées telles quelles (réduites à 256 px), mais on ne peut ni les dessiner, ni les recadrer, ni les renommer, ni les réordonner depuis l'app. Un GIF animé garde sa première image.
- Les champs acceptent des nombres fixes ou un reporter (`ƒ`) ; le texte libre d'un champ de mouvement ne résout ni variables ni calculs. Dans `Aller à x : y :`, les valeurs hors de la scène sont ramenées au bord. Si tu veux revenir à la position d'avant une exécution, utilise **Revenir au départ**.
- Les reporters sont numériques : `{x} > {y}` renvoie `1` ou `0` (suffisant pour `si`, mais il n'y a ni booléens ni textes de première classe) et une variable contenant du texte compte comme `0` dans un calcul. L'imbrication est coupée à 12 niveaux à l'exécution et à 10 au dessin, pour qu'un projet trafiqué ne bloque pas l'app.
- Les liens `?p=` continuent de porter tout le projet dans l'URL. Avec beaucoup de gros costumes, ils peuvent devenir trop longs pour WhatsApp ou pour le navigateur ; dans ce cas il vaut mieux exporter le `.scmo`. Le publier sur Vercel ne change rien : il faudrait un backend avec stockage pour avoir des liens courts.
- **L'installation et le mode hors ligne ont besoin de `https` ou `localhost`** : ce sont des exigences du navigateur pour les service workers, pas une décision de l'app. Ouverte en double-clic (`file://`), ScrachMo fonctionne pareil, mais sans icône installable et sans cache.
- **Le cache de la PWA est invalidé à chaque version, et maintenant la CI l'exige** : le nom du cache dans `sw.js` est `scrachmo-<APP_VERSION>-<empreinte>`, où l'empreinte est constituée des 8 premiers caractères du SHA-256 de `index.html + app.html + landing.js + boot.js + data.js + engine.js` (avec les fins de ligne normalisées pour que ce soit pareil sous Windows et sous Linux). `tests/check-parity.js` recalcule cette empreinte et **échoue si l'un de ces six fichiers a changé sans mettre à jour `sw.js`** ; il échoue aussi si `APP_VERSION` de `data.js`, la version de `landing.js` et celle de `sw.js` ne coïncident pas. Pour publier, on lance `node tests/bump-sw.js` (ou `node tests/bump-sw.js v12`), qui monte les trois versions et recalcule l'empreinte. Sans ça, le service worker sert ces fichiers depuis le cache sans revalider et l'app installée reste vieille indéfiniment. `tests/pwa-sw.js` lit la version du `sw.js` lui-même, donc elle n'est pas figée à un numéro. Sur Vercel, en plus, `vercel.json` empêche le CDN de mettre `sw.js` en cache.
- Un projet ouvert depuis un lien `?p=` ou depuis un `.scmo` est chargé **dans le projet courant**, donc il remplace ce qu'il y avait. Si tu veux le garder, crées-en un nouveau avant de l'ouvrir.
- Le nom du projet vit dans la bibliothèque de l'appareil : il ne voyage ni dans le `.scmo` ni dans le lien `?p=`. Il n'y a pas non plus de dossiers ni d'ordre manuel : la liste est triée par dernière modification.
- **Les messages ne sont pas du multijoueur** : ils utilisent `localStorage` et arrivent aux personnages du même navigateur (et aux autres onglets de la même origine), jamais à d'autres appareils. Voir *Messages locaux* plus haut.
- Il y a un zoom de la zone de blocs et de la scène, et une mise en page en deux colonnes à partir de 900 px, mais la disposition large ne peut pas être forcée à la main sur un téléphone : elle vient toute seule selon la largeur de l'écran.

## Licence

[MIT](LICENSE). Utilise-la, casse-la et améliore-la librement.
