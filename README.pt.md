# ScrachMo

[English](README.en.md) · [Español](README.md) · **Português** · [Français](README.fr.md)

> Programe com blocos estilo Scratch, direto do celular.

**ScrachMo** é um ambiente de programação visual inspirado no [Scratch](https://scratch.mit.edu), redesenhado do zero para telas verticais: os painéis se empilham um embaixo do outro, os blocos são grandes e pensados para o polegar, e tudo roda no navegador sem instalar nada.

Sem frameworks, sem dependências, sem build: arquivos estáticos que funcionam em qualquer navegador moderno, no computador ou no celular.

**Versão publicada**: [https://scrachmo.vercel.app](https://scrachmo.vercel.app), servida pela Vercel sobre HTTPS. A raiz é a **landing** (apresentação do projeto em 4 idiomas) e o editor fica em **[https://scrachmo.vercel.app/app.html](https://scrachmo.vercel.app/app.html)**, que é o link direto e compartilhável para entrar sem passar pela apresentação. O PWA instalado também abre no editor. O repositório está pronto para essa publicação: `vercel.json` e os demais arquivos estáticos são servidos como estão, sem compilação.

## Recursos

### Blocos como no Scratch

- 53 blocos em 9 categorias com as cores clássicas do Scratch: movimento, aparência, som, eventos, controle, sensores, operadores, variáveis e **mensagens locais**.
- Blocos chapéu (bandeira verde, toque, tecla, agitar o celular, receber mensagem, pontuação) e blocos C: `Repetir {v} vezes`, `Para sempre` e condicionais com `se... senão`.
- Aninhamento de verdade: solte um bloco **em cima** de um `Repetir`, `Para sempre` ou `se` e ele fica dentro —também na barra «senão»—, ou mire no encaixe se preferir. Com travas que impedem aninhar um bloco dentro de si mesmo ou colocar um chapéu dentro.
- **Vários scripts por personagem**: cada chapéu inicia um script independente e só rodam os que correspondem ao evento ocorrido. Um mesmo personagem pode reagir à bandeira, a uma tecla e a um toque ao mesmo tempo.
- Encaixes tipo quebra-cabeça na parte de cima dos blocos e destaque visível do bloco em execução.
- **`Ir para x: {x} y: {y}`**: dois campos numéricos num mesmo bloco para teletransportar o personagem para uma coordenada exata. O mundo mede 480 × 360 unidades de fábrica, mas o centro fica a **85 unidades da borda** para que o desenho nunca seja cortado: com o tamanho e a rotação de fábrica, x vai de -155 a 155 e y de -95 a 95. Esses limites são recalculados com o tamanho do personagem e com o tamanho do palco, e os campos os mostram. É a forma de fixar a posição de partida de um script mesmo que o estado final da execução anterior tenha ficado salvo como estado de projeto.
- **Repórteres: 11 blocos que devolvem um valor**. Os encaixes de movimento, aparência, controle, operadores, variáveis e pontuação têm um botão **ƒ** para colocar um valor calculado em vez de um número fixo: `pontos`, `posição x`, `posição y`, `variável {v}`, `cronômetro`, `aleatório {x} a {y}`, `{x} + {y}`, `{x} − {y}`, `{x} × {y}`, `{x} ÷ {y}` e `{x} > {y}`. Podem ser **aninhados** —`Mover ((posição x) + 10)`, `se (pontos > 10) então`, `Repetir (aleatório 2 a 5)`— e o **×** do chip volta ao texto livre sem perder o que você tinha escrito. Não são enunciados: não aparecem na paleta nem podem ser adicionados soltos, vivem dentro do encaixe de outro bloco.

### Editor confortável em tela pequena

- **Arraste da paleta**: toque num bloco para adicioná-lo no final, ou arraste-o pela alça e solte exatamente onde quiser (na pilha principal ou dentro de um `Repetir` / `se... senão`). No toque, pega-se pela alça para não bloquear a rolagem; com mouse, de qualquer parte do bloco. O toque e o teclado continuam funcionando igual.
- **Duplicar**: cada bloco tem um botão que o copia junto com toda a sua subárvore, regerando os ids para não quebrar o arraste nem o destaque.
- **Desfazer / Refazer**: botões e atalhos `Ctrl/Cmd+Z`, `Ctrl/Cmd+Shift+Z` e `Ctrl/Cmd+Y`. O histórico guarda até 60 instantâneos e não interfere no desfazer de texto dentro de um campo.
- **Dois zooms independentes, e os dois aumentam o conteúdo e não a janela**: o da **área de código** (70 % a 160 % com `− / +`, tocando a porcentagem você volta a 100 %) escala os blocos dentro de um painel cuja altura você escolhe arrastando a alça de baixo (ou com as setas, com a alça em foco); o do **palco** (mesma escala, na linha de baixo) aproxima a câmera, então crescem os personagens, o fundo e os balões enquanto a janela do palco mede sempre o mesmo. Os dois são lembrados entre sessões, não viajam no projeto e a linha de inserção se corrige sozinha ao arrastar com zoom.
- Layout mobile-first: painéis verticais empilháveis e recolhíveis, respeitando as *safe areas* em telas com notch.
- **Em tela larga (a partir de 900 px) fica em duas colunas**: o palco e os personagens à esquerda, o código com a paleta de blocos à direita, e variáveis e projeto embaixo. No celular continua empilhando igual, na mesma ordem de sempre (Palco → Personagens → Código → Variáveis → Projeto → Blocos): as colunas se «dissolvem» com `display:contents` e a ordem é decidida pelo `order`. O modo jogo fica de fora: ali se vê só o campo, com a proporção do jogo e não a da tela. Num celular deitado, margens e palco diminuem para caber mais.
- Interação 100% por toque (pointer events): toque para adicionar, arraste pelo ícone para reordenar ou aninhar. Também há reordenação pelo teclado.

### Palco e personagens

- Vários personagens, cada um com o seu próprio programa: criar, apagar e alternar entre eles.
- **Catálogo de 321 personagens** organizado em 16 grupos (animais, espaço, veículos, idade média, terror, jogos e esportes, setas e sinais, formas e cores, frutas, legumes, comida, natureza, fantasia, objetos, ferramentas e música), com busca que ignora acentos e maiúsculas e aceita palavras em espanhol, inglês, português e francês. Só entram emojis que todos os sistemas desenham: nada de quadradinhos vazios.
- Movimento, direção, tamanho, rotação, visibilidade e balões de fala. A direção aceita **voltas completas**: escreva 270 ou 359 e o personagem gira de verdade (o valor é guardado como −90 ou −1, que é o mesmo ângulo). Os balões são lidos na horizontal, com largura conforme o texto e quebra de linha quando a mensagem é longa.
- **O balão pode ser aumentado ou diminuído pelo próprio bloco**: *Dizer* leva um campo `%` (50 a 250) ao lado da mensagem. O tamanho é guardado em `node.zoom`, não dentro do texto, então uma mensagem com vírgulas continua inteira e os projetos antigos, sem esse campo, aparecem a 100 %. O zoom escala o balão completo —letra, largura máxima, preenchimento e cantos— e também no modo jogo.
- **Zoom do palco**: com `− / 130 % / +` a câmera aproxima ou afasta: crescem os personagens, o fundo e os balões, mas **a janela do palco mede sempre o mesmo** (antes o zoom esticava a cena e a página inteira mudava de tamanho). As posições continuam sendo porcentagens do mundo, então arrastar um personagem e os blocos de movimento não saem de calibragem, e o arraste divide pelo zoom para que o personagem siga a ponta do dedo. Também vale no modo jogo.
- **Palco do tamanho que você precisar**: o mundo mede 480 × 360 unidades de fábrica, mas cresce arrastando as alças da borda —a de baixo muda a altura, a da direita a largura e a esquina as duas, até 1440 × 1080—. Cresce **para a direita e para baixo**, então o que já estava colocado não se move nem um pixel e o espaço novo fica livre para mais personagens ou para um campo mais longo. As bordas, os rebotes, as colisões e o recorte dos campos `x`/`y` seguem o tamanho novo, o tamanho viaja no projeto e nos links, e **Voltar ao tamanho original** (aparece ao lado do zoom quando o palco já não é o de fábrica) devolve tudo a 480 × 360 recortando o que ficava fora. Com teclado, as setas sobre a alça aumentam de 60 em 60 unidades.
- **Modo jogo com o campo em 4:3**: o botão *Executar* deixa só o palco, centralizado e tão grande quanto caiba, com faixas da cor de fundo. A proporção é sempre a do mundo —480 × 360 unidades de fábrica, ou seja 4:3, ou a que você escolheu se aumentou o palco— e não estica: se esticasse, 100 passos para cima pareceriam maiores que 100 para a direita e o que se vê não bateria com as colisões, que são calculadas em unidades. Num celular em pé aparece embaixo um aviso discreto —«Gire o celular para ver maior»— que pode ser fechado e não volta até o próximo jogo.
- **Fundo próprio do palco**: envie a sua própria imagem (PNG, JPG, WebP, GIF, BMP ou SVG) pelo ícone do cartão *Palco*. Ela é redesenhada a 1280 px no máximo, comprimida para WebP/PNG e mostrada com `cover`. O botão **Remover meu fundo** volta aos 6 gradientes; usar `mudar fundo` também sai do fundo próprio. Viaja no salvamento e nos links compartilhados, e as URLs externas são recusadas por segurança.
- Variáveis com passos configuráveis (+ / −) e opção de mostrá-las no palco.

### Clones

- **`Criar clone de [mim mesmo / um personagem]`** faz uma cópia viva do personagem com a posição, a direção, o tamanho, a visibilidade e o traje daquele momento. O clone compartilha os scripts e as variáveis com o original, mas se move, gira, muda de tamanho e de traje por conta própria.
- **`Ao começar como clone`** é o chapéu que roda em cada cópia assim que ela nasce. Um clone **não** roda a bandeira verde nem os outros chapéus: se rodasse, cada cópia repetiria tudo o que o original faz.
- **`Apagar este clone`** faz desaparecer a cópia que o executa, e o script dela é cortado nesse mesmo bloco. No personagem original não faz nada, como no Scratch.
- **`Se toca [um personagem]`** é a versão dirigida de `Se toca outro personagem`: só é verdadeiro com esse personagem **ou com qualquer um dos clones dele**, então serve para um tiro saber se acertou uma pedra e não outra coisa. Com «mim mesmo» se comporta como `Se toca outro personagem`.
- **`Apagar o clone de [um personagem] que eu toco`** faz desaparecer justo a cópia que o que o executa está tocando, não todas: um tiro destrói o que atinge e desaparece, sem limpar a tela. Se estiver tocando o original não faz nada, porque um original não se apaga.
- Os clones **colidem** entre si e com os originais, e falam com o seu próprio balão.
- **Não são salvos**: existem só enquanto a execução dura. Parar apaga todos; deixar o script terminar os deixa na tela, como estado final. O limite é de **300 clones**, o mesmo do Scratch, para não travar o celular.
- São exportados para `.sb3` com os seus três blocos nativos, então um jogo de clones funciona igual no Scratch.

### Trajes e imagens próprias

- **Importe as suas próprias imagens** (PNG, JPG, WebP, GIF, BMP ou SVG) pelo botão *Importar minhas imagens…* do catálogo, ou por *Adicionar trajes* nas propriedades de um personagem. Você pode escolher várias de uma vez e também criar um personagem novo feito inteiramente dos seus desenhos ou fotos.
- **Até 12 trajes por personagem**, com uma tira de miniaturas para vê-los, escolher o ativo e apagar os que não quiser (sempre sobra pelo menos um).
- Cada imagem é **redesenhada num canvas**, ajustada a 256 px no máximo e recodificada para WebP (ou PNG se o navegador não suportar WebP). O arquivo original nunca é guardado: **um SVG é aceito, mas é convertido em bitmap na importação**, então no projeto e nos links nunca fica um `data:image/svg+xml` (um SVG pode levar script dentro). Por ser vetorial, o SVG sim cresce até os 256 px em vez de ficar no tamanho em que você o desenhou, e a proporção sai do `width`/`height` ou, se não estiverem, do `viewBox`. As URLs externas e os `.svgz` são recusados (vêm comprimidos e o navegador não os abre como imagem), e há limite de peso por imagem.
- Os dois blocos novos de **Aparência** permitem animar como no Scratch: `Próximo traje` e `Mudar traje para {v}` (um seletor com os nomes dos seus trajes). Combinados com `Repetir`, `Mover` e `Esperar` simulam caminhada, bater de asas, giros etc.
- O bloco `Mudar traje para` guarda o **nome**, não a posição: apagar ou reordenar trajes não aponta o bloco para outro. Projetos antigos com valores numéricos continuam sendo lidos.
- Os emojis do catálogo continuam funcionando como mais um traje: os projetos salvos antes desta versão são migrados automaticamente.

### Sons e música

- **7 blocos de som**: os dois de sempre (`Miau` e `Pop`) mais **`Tocar som {v}`** com 8 sons para escolher, **`Tocar música {v}`** com 3 melodias em loop, **`Parar os sons`**, **`Definir volume em {v} %`** e **`Mudar volume em {v}`**.
- **Não há arquivos de áudio**: tudo é sintetizado com WebAudio no momento de tocar (osciladores com envelope e ruído filtrado para golpes e explosões). Assim o app continua abrindo com duplo clique (`file://`), o PWA não precisa guardar nada extra e não há direitos autorais no meio.
- Os sons são **bip, miau, pop, moeda, pulo, explosão, aplauso e sino**; as melodias, **alegre, triste e de jogo**. O bloco guarda o **id** do som, não o nome: mudar de idioma não quebra os projetos.
- **O volume é do projeto** (0 a 100, começa em 100) e é salvo com ele, então um jogo pode vir com a música mais baixa. É aplicado num nó mestre, por isso um `Definir volume` é ouvido na hora mesmo numa melodia que já está tocando.
- A música **se repete até você pará-la** ou colocar outra. `Parar os sons` corta tudo o que estiver tocando, música incluída, e **Parar também a corta**: se não, continuaria tocando para sempre porque ninguém mais a desligaria.
- `Tocar som` **não espera o som terminar** (igual ao Scratch): para encadear, coloque `Esperar` embaixo.

### Execução

- Executar / Parar, com destaque do bloco que roda a cada momento. Vários scripts podem rodar em paralelo sem perder o destaque nem misturar as suas condições.
- **A bandeira inicia o projeto inteiro, não só o personagem em edição**: o personagem selecionado não ter blocos não impede nada, porque os scripts são percorridos em todos os personagens. O que importa é o **chapéu**: um script só começa com *Executar* se começa com **Ao iniciar** (ou se os blocos estão soltos, que contam como bandeira). Se o projeto tem blocos mas nenhum pendurado nesse chapéu —por exemplo, tudo está em «Ao pressionar uma tecla»— o app avisa em vez de ficar mudo.
- Eventos: bandeira verde, toque no palco, **Ao pressionar {v}** (um menu com espaço, Enter, as quatro setas, as 26 letras e os 10 números), agitar o dispositivo, pontuação e mensagens. O chapéu de pontuação dispara uma única vez por limite, não volta a disparar em loop.
- **Os personagens ficam onde terminaram**: ao parar ou ao terminar os scripts eles não voltam mais a zero. A posição, o traje, o tamanho, a visibilidade e o fundo que o programa deixou passam a ser o estado de projeto: são salvos e são o ponto de partida da próxima execução. Se quiser desfazer esse percurso, toque em **Voltar ao início** (aparece embaixo do palco depois da primeira execução) e o instantâneo tirado na largada é restaurado. Durante a execução não há salvamento automático; a pontuação sim é mantida entre execuções.
- Laços com limite de segurança: um `Repetir` ou `Para sempre` descontrolado não trava o navegador.
- No iOS 13+ a permissão de movimento é pedida no primeiro toque, como o sistema exige.

### Jogar no celular: controle na tela

- **O problema**: *Ao pressionar uma tecla* dispara com um `keydown` de verdade. Num celular não há teclado, então um jogo de setas era **injogável** por mais que o projeto estivesse bem montado. Tocar a tela funcionava (*Ao tocar*), mas não substitui as setas.
- **A solução**: no **modo jogo** aparece um **controle de toque** sobre o palco. Ele aciona **os mesmos scripts** que a tecla física, então o projeto não muda e continua funcionando igual com teclado.
- **Mostra só o que o projeto usa**: os chapéus *Ao pressionar* de todos os personagens são lidos. Se há setas, aparece o direcional; se além disso há espaço ou letras, aparecem como botões redondos à direita (o espaço se chama *Ação*). Se o projeto não usa teclas, não aparece nada.
- **As setas que não são usadas ficam invisíveis mas na sua célula**, assim o direcional não se desmonta quando o jogo só tem esquerda e direita.
- **Manter apertado repete** a cada 110 ms, igual ao auto-repeat do teclado: o personagem anda direto em vez de dar um passo por toque. Ao soltar, para.
- **Não dispara «ao tocar» de passagem**: o toque do controle para ali, então um jogo com as duas coisas não faz as duas ao mesmo tempo.
- No editor, se o projeto usa teclas e o aparelho não tem teclado (ponteiro grosso), a dica do palco diz que se joga a partir de **Executar**.
- É um `role="group"` com etiqueta traduzida e cada botão tem o seu `aria-label`; pode ser usado com teclado e respeita o *notch* (`env(safe-area-inset-bottom)`).

### Inclinar o celular em vez de procurar a seta

O controle resolve o polegar, mas para mover um personagem em quatro direções **inclinar o aparelho** é mais confortável do que acertar um botão. O acelerômetro funciona como **detector de eventos**: inclinar dispara a mesma tecla que o teclado e que o controle, então nenhum projeto muda.

- **É opcional e desliga**: no modo jogo aparece uma pílula **Inclinar** acima do controle, desligada por padrão. É lembrada entre sessões (`scrachmo_tilt`) e com o modo desligado o sensor não dispara nada. Só é oferecida se o projeto usa setas e se o aparelho tem sensor: num computador não aparece.
- **O zero é a postura de largada, não o celular reto**: ninguém joga com o aparelho na vertical. A primeira leitura depois de ativar o modo (e no começo de cada partida) é tomada como referência, então o jogo começa parado esteja você como estiver segurando.
- **Zona morta com memória**: para ligar um eixo é preciso passar dos 13° a partir dessa referência, e para desligar, cair abaixo de 7,5°. Sem essa faixa, o pulso ligaria e desligaria a tecla sem parar.
- **O sensor não gira com a tela**: as coordenadas do acelerômetro são do aparelho, então o eixo «direita» é rotacionado à mão conforme `screen.orientation.angle` (0°, 90°, 180°, 270°). Sem isso, na horizontal as setas saem cruzadas.
- **Só dispara teclas que o projeto usa** e **repete enquanto continua inclinado**, igual ao controle. Enquanto isso, a seta correspondente do direcional acende: assim se vê se o sensor está lendo.
- **Direita/esquerda** é inclinar a borda direita ou a esquerda para baixo; **cima/baixo** é afastar ou aproximar a tela. Ao parar o jogo ou sair do modo jogo, o sensor é cortado (`stopTiltRepeat()`), porque se não o personagem continuaria andando sozinho.
- No iPhone a permissão de movimento é pedida **dentro de um gesto real**: tocar a pílula conta como gesto, e se for negada, o aviso diz.

### Mensagens locais (antes «Multijogador»)

- O nome antigo **mentia**: a categoria se chamava «Multijogador» e os blocos falavam de «outros jogadores pela rede local». Agora se chama **Mensagens** e diz o que faz.
- `Enviar mensagem` escreve uma marca no `localStorage`; `Ao receber mensagem` escuta o evento `storage`. **Não há rede, nem servidor, nem outros dispositivos**: chega aos scripts do mesmo projeto e a outras abas do mesmo navegador e da mesma origem. O botão *Mensagens* das ferramentas liga ou desliga só a recepção de outras abas; o aviso dentro do projeto sempre chega (o evento `storage` não dispara na aba que escreve).
- Para jogar entre dois celulares seria preciso um backend com WebSockets ou um serviço de tempo real. O ScrachMo não tem backend por projeto: é o que permite abrir com duplo clique e ser publicado como site estático na Vercel.

### Sensores e colisões

- **`Rebater se tocar a borda`**: se o personagem está tocando uma borda, dá meia-volta e continua. A direção é corrigida conforme o lado: contra uma parede vertical inverte-se o componente horizontal (`direção → −direção`) e contra o chão ou o teto o vertical (`direção → 180 − direção`), então o personagem sai no ângulo espelhado e não fica preso na borda.
- **`Se toca a borda`** e **`Se toca outro personagem`**: condições para envolver o que quiser, com o mesmo `se` / `senão` de sempre. As duas executam o conteúdo que envolvem. A segunda ignora os personagens ocultos e a si mesma, então um traje invisível não bloqueia nem dispara colisões.
- **`Reiniciar cronômetro`** e o repórter **`cronômetro`**: devolve os segundos (com uma casa decimal) desde que você abriu o projeto ou desde o último reinício. Serve para «sobreviva 30 segundos», contagens regressivas com `se (cronômetro > 10) então` e para medir tempos dentro de um jogo.
- As colisões **entre personagens** usam um círculo por personagem: cada um é aproximado por um círculo de raio 26 unidades a 100 % de tamanho (o palco mede 480 × 360 de fábrica, e se você o aumentar as bordas acompanham). Não é uma colisão pixel a pixel: com um personagem muito comprido ou muito fino o toque parece um pouco generoso ou um pouco tardio. **A borda do palco usa outro raio**: o do *desenho* (85 unidades de fábrica, porque com rotação livre o emoji girado precisa de mais espaço), assim o centro nunca chega à borda e o personagem não aparece cortado pelo `overflow:hidden`. `Se toca a borda` e `Rebater se tocar a borda` usam esse raio visual, e os campos `x`/`y` seguem os mesmos limites. O desenho é reduzido o justo quando a caixa é pequena ou o mundo é grande (`--sprite-cap`), em vez de medir a margem em pixels: medir em pixels recortava coordenadas normais como `x: 120 y: -75`.
- Tudo isso roda também no **modo jogo**, e o cronômetro não reinicia ao apertar *Executar*: se quiser que volte a zero, coloque `Reiniciar cronômetro` no começo do script.

### Projetos

- **Vários projetos com nome**: o cartão *Projeto* tem **Meus projetos**, com a lista de tudo o que está salvo no dispositivo. De lá você pode **criar**, **abrir**, **renomear**, **duplicar** e **apagar** (até 24), e o botão mostra sempre o nome do projeto aberto. Abrir outro já não sobrescreve o anterior: cada um é salvo à parte e o que estava aberto é copiado antes de trocar. Não é possível apagar o último.
- **Backup da biblioteca inteira**: **Exportar biblioteca** baixa um `.json` com o formato, a versão, o projeto ativo e **todos** os projetos com os seus dados completos (o ativo é serializado no momento, não é tirado de uma cópia antiga). Serve para guardar antes de limpar o navegador ou para levar o trabalho a outro dispositivo.
- **Apagar pode ser desfeito**: ao confirmar uma exclusão, o projeto (nome, posição na lista e o seu JSON) fica na memória durante a sessão e aparece **Desfazer exclusão** no modal. O botão se esconde quando já não há nada a restaurar.
- Salvamento automático no dispositivo (localStorage), incluindo pontuação, estado da opção de mensagens locais, todos os trajes e o fundo próprio. As preferências da interface (painéis recolhidos, zoom dos blocos e zoom do palco) são salvas à parte em `scrachmo_ui`, aceitando o formato antigo. Se o espaço do dispositivo encher, o app avisa em vez de falhar em silêncio.
- **Compartilhar**: gera um link com o projeto dentro (`?p=...`) para mandar aos amigos; ao abri-lo, o projeto carrega sozinho. O JSON é **comprimido com gzip** (`g1.`) e codificado em base64url, então os trajes viajam num link bem mais curto. Se o navegador não tem `CompressionStream`, cai para JSON sem compressão (`j1.`), e os links antigos em base64 puro continuam abrindo igual.
- Se o link passar de 8000 caracteres, o app avisa que alguns chats podem cortá-lo e que é melhor usar menos imagens ou exportar o `.scmo`.
- Interface em espanhol, inglês, português e francês.

### Exemplos e guia

- **Exemplos** está no cartão de ferramentas e abre três projetos de amostra com os blocos já montados: **Cumprimente** (balão de fala com tamanho próprio e andar com as setas), **Pegue a fruta** (clones que caem, placar e uma cesta que se move sem virar) e **Desvie dos cometas** (clones, colisão contra um personagem específico, pontos que sobem sozinhos e reiniciam ao receber um golpe).
- Abrir um exemplo **cria um projeto novo**: o que você estava montando é copiado e continua na lista. O exemplo fica como mais um projeto, então pode ser mexido, quebrado e aberto de novo.
- Abaixo dos cartões há um **guia rápido** de cinco passos: escolher personagem, montar o script, começar por um chapéu, colocar repórteres com o botão `ƒ` e salvar ou compartilhar.
- Os exemplos não são JSON copiado: são montados com os mesmos construtores que o app usa (`makeNode()`/`createSpriteData()`), então se o formato dos nós mudar os exemplos acompanham sozinhos. Entre outras coisas ensinam o padrão `Ir para x: (posição x) + 18` para andar sem girar, que um clone de um personagem escondido **nasce escondido** (é preciso mostrá-lo) e que «apagar este clone» corta a linha no próximo ponto de espera.

### Exportar para o Scratch (`.sb3`)

- **Para o Scratch (.sb3)** está no cartão de ferramentas e baixa um arquivo que **o Scratch 3 abre como está** (`Arquivo → Carregar do seu computador`). Não é um «salvar como»: o ScrachMo monta o ZIP à mão —`project.json` mais um arquivo por traje e por som, cada um nomeado com o seu **MD5**— com o seu próprio escritor de ZIP, o seu MD5 e o seu CRC32, sem bibliotecas e sem conexão.
- **Personagens**: cada um viaja como sprite com o seu traje (o emoji é desenhado num PNG de 128 px; as imagens próprias são reescaladas para 480 px), a sua posição, direção, tamanho, estilo de rotação e visibilidade. O fundo do palco —o gradiente ou a imagem que você enviou— vai como traje do *Stage*.
- **Scripts**: o grafo de blocos completo é reconstruído (`next`, `parent`, `SUBSTACK`, `SUBSTACK2`, chapéus e menus). As variáveis do projeto ficam declaradas no *Stage* e a mensagem é declarada para que os blocos de enviar/receber a encontrem.
- **Sons e melodias**: não se copiam arquivos, são **sintetizados para WAV** (22050 Hz, mono, 16 bits) com a mesma receita de passos que o motor usa, então soam igual que aqui. O ruído usa um gerador pseudoaleatório com semente fixa: duas exportações do mesmo projeto dão arquivos idênticos.
- **O que é traduzido e o que não é**:

| ScrachMo | No Scratch |
| --- | --- |
| `Mover`, `Girar`, `Ir para x: y:`, `Apontar em direção`, `Rebater se tocar a borda` | `motion_*` (o rebote usa o bloco próprio do Scratch) |
| `Dizer`, `Pensar`, `Mostrar`, `Esconder`, `Tamanho`, `Próximo traje`, `Mudar traje para` | `looks_*` com os nomes dos seus trajes |
| `Tocar som`, `Parar os sons`, `volume` | `sound_*` com os sons gerados |
| `Ao iniciar`, `Ao tocar`, `Ao pressionar tecla`, `Ao receber` | `event_*` |
| `Esperar`, `Repetir`, `Para sempre`, `se`, `se/senão`, `Se toca a borda`, `Se toca` | `control_*` e `sensing_touchingobject` |
| `Criar clone de`, `Ao começar como clone`, `Apagar este clone` | `control_create_clone_of`, `control_start_as_clone`, `control_delete_this_clone` |
| `pontos` e as variáveis | variáveis globais do *Stage* |
| Mensagens locais, agitar, inclinação, vibrar, criar/mostrar variáveis, amigos, `senão` solto, `apagar o clone que toco` | **sem equivalente** |

- **O que fica de fora é avisado, não se perde em silêncio**: ao terminar, o app diz quantos blocos não conseguiu traduzir, e cada personagem afetado leva um **comentário colado ao seu primeiro bloco** dentro do Scratch com a lista. Assim o projeto abre, roda e se vê onde precisa ser completado à mão.
- **Duas diferenças a ter em conta**: uma melodia toca **uma vez** no Scratch (não em loop, porque um laço dentro do script o travaria) e o rebote fica com o bloco nativo do Scratch, que usa a caixa do traje e não o círculo que o ScrachMo usa. O caminho inverso (abrir um `.sb3` no ScrachMo) não está implementado.

### Sobre e apoio ao projeto

- O botão **ⓘ** da barra superior abre **Sobre o ScrachMo**: autor, licença MIT, o link para o endereço oficial **scrachmo.vercel.app** e uma descrição curta do que é o app. A linha *Site* aponta para a URL pública da Vercel, não para o domínio da hospedagem anterior.
- Ali estão os dois links de apoio —**Me pague um cafezinho** e **Apoiar no Ko-fi**— e a frase que diz sem rodeios: se você gosta do ScrachMo, uma menção ou uma doação fica a seu critério. Nada disso condiciona o uso: o app é MIT e funciona inteiro sem pagar nada.
- **Mostra a versão instalada**: a linha *Versão* e o rodapé saem de `APP_VERSION` em `data.js`, a mesma string que nomeia o cache do service worker. Serve para saber que cópia se está vendo ao relatar um problema.
- **Tudo traduzido nos quatro idiomas**, incluindo essa frase e os botões de apoio. Fecha com *OK*, com `Escape` ou tocando fora do cartão, e enquanto está aberto a página de trás não se move.
- Não toca no projeto nem no salvamento: é informativo, pode ser aberto a qualquer momento sem perder nada.

### Instalar no celular (PWA)

- Pode ser **instalado como app**: tem `manifest.webmanifest` com nome, ícones (192, 512 e um *maskable* para Android) e cor de tema, então o Chrome/Android oferece «Instalar aplicativo» e no iPhone se adiciona à tela de início com o ícone próprio. Aberto assim não mostra a barra do navegador e **entra direto no editor** (`start_url: ./app.html`), não na landing.
- **Funciona sem internet**: um service worker (`sw.js`) guarda as duas páginas e os seus scripts (`index.html`, `app.html`, `landing.js`, `boot.js`, `data.js`, `engine.js`), o manifest e os ícones na primeira vez que você abre. Depois abre a partir do cache e se atualiza sozinho quando há rede.
- **Recarregar basta para ver a versão nova**: as **navegações** vão *rede primeiro* e o cache fica como reserva (se não há conexão, ou se o servidor demora mais de 4 s, sai a cópia guardada). Antes era o contrário e uma versão recém-publicada só aparecia no segundo recarregamento —ou nunca, se o service worker anterior continuasse no comando—. Os arquivos (`data.js`, `engine.js`, ícones) continuam saindo do cache, então abrir continua instantâneo.
- **Aviso de versão nova, traduzido**: quando um service worker novo assume o controle de uma aba que já estava aberta, aparece embaixo uma barra com **Recarregar** e **Agora não**. Não é um modal, não bloqueia nada e pode ficar para depois; na primeira instalação não aparece porque não há uma versão anterior para substituir. Escuta `controllerchange` e `updatefound`.
- Os **links compartilhados `?p=` também abrem offline**: se a URL vai para `app.html` o editor é servido; se vai para a raiz com `?p=` (os links antigos, de antes de existir a landing), o editor também é servido diretamente, sem depender do redirecionamento de `landing.js`. E o cache não é atualizado com essa resposta: na rede a raiz devolve a landing e guardá-la como `app.html` quebraria o PWA.
- Tudo isso é **opcional e não quebra o duplo clique**: aberto como arquivo (`file://`) não há service worker e o app funciona exatamente igual, sem cache. O registro está protegido com `location.protocol !== 'file:'` em `boot.js`.

### Segurança e robustez

- **Sem `eval` nem `Function()`**: as contas dos blocos de operadores, de variáveis e das condições passam por um parser aritmético próprio (`calcExpr()`). Aceita `+ - * / % **`, parênteses, decimais, menos unário, `score`, variáveis e `aleatorio(a,b)`; qualquer outro texto (incluído código JavaScript) não é executado e devolve `null`. Assim o app funciona com um CSP estrito.
- **Diálogos próprios e traduzidos**: as confirmações e os pedidos de texto usam o modal do app (`#askModal`), com **OK / Cancelar**, `Escape`, `Enter` e bloqueio da rolagem. Já não se usam `prompt()`, `confirm()` nem `alert()`, que cortavam a interface e não podiam ser traduzidos. Se você apertar **Parar** com um diálogo aberto, ele se fecha e o script é cancelado.
- **Limites na importação**: um projeto `.scmo` ou um link `?p=` não pode passar de 8 MB de texto, 40 níveis de aninhamento nem 2000 blocos. Se algo for cortado, o app avisa em vez de travar.
- **O limite é aplicado *enquanto* descomprime**: os links `g1.` viajam em gzip. `inflateLimited()` lê o stream em partes com `DecompressionStream` e corta assim que passa de `MAX_INFLATE_BYTES` (8 M de caracteres × 4 bytes, por UTF-8), cancelando o reader. Uma «gzip bomb» já não pode inflar dezenas de megabytes antes de ser recusada.
- **CSP declarada na Vercel**: `script-src 'self'` sem `'unsafe-inline'`, `default-src 'self'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'none'` e `worker-src 'self'`. Não há `<script>` inline nem manipuladores `onclick`/`oninput` em nenhuma página; as travas estáticas falham se alguém voltar a colocar um, porque nos arneses `file://` não há cabeçalhos e o erro só apareceria em produção.
- **Modais acessíveis pelo teclado**: os seis diálogos compartilham `updateModalLock()`. Ao abrir, guarda-se o controle que tinha o foco, foca-se o primeiro do modal, o resto da página fica `inert` e `Tab` / `Shift+Tab` ficam presos dentro (`trapModalKey()`); ao fechar, tira-se o `inert` e o foco volta para onde estava. Antes o `Tab` escapava para a interface de trás.
- **A fronteira das imagens continua fechada**: o SVG é aceito como entrada e é rasterizado, mas `IMG_DATA_RE` só admite `webp/png/jpeg/gif` nos dados salvos, então um vetor com script nunca chega ao projeto.

## A landing e o link direto

`https://scrachmo.vercel.app` mostra a **landing**: apresentação moderna em espanhol, inglês, português e francês (o idioma se escolhe em cima e é lembrado pelo navegador), com hero, maquete do editor, recursos, guia de três passos e a seção de apoio.

- **O idioma se escolhe à mão, não só pelo sistema**: o seletor `ES / EN / PT / FR` da barra superior muda a página inteira na hora. Sem escolha prévia usa-se o idioma do sistema; assim que você escolhe um, ele é salvo em `scrachmo_landing_lang` **e** em `scrachmo_lang`, que é a chave que o editor lê. Assim o idioma viaja da landing para o app nos dois sentidos: se você já tinha escolhido português dentro do editor, a landing abre em português.
- **A lista suspensa precisa de cores próprias**: o `<select>` é do tema escuro, mas o menu que se abre é desenhado pelo sistema com **o fundo dele**. Sem `color-scheme:dark` no `<select>` e um `background`/`color` explícitos nos seus `<option>`, as opções herdavam o texto claro e ficavam **letras brancas sobre fundo branco**. Como o popup não sai numa captura, a verificação é sobre os estilos calculados e sobre o CSS da landing.
- **Dois links, dois destinos**: *Abrir o ScrachMo* / *Abrir o app* vão para `app.html`. *Copiar link direto* usa o painel nativo de compartilhar quando existe (`navigator.share`) e, se não, copia a URL para a área de transferência, com um aviso visível. Esse link é o que pode ser guardado ou mandado a quem já viu a landing.
- **Tudo o que é necessário, sem contas**: Cafecito, Ko-fi, o repositório no GitHub, a licença MIT, o autor e a frase «Se você gosta do ScrachMo… uma menção ou uma doação fica a seu critério». Nenhum link condiciona o uso do app.
- **Os links antigos continuam abrindo**: os projetos compartilhados antes da mudança apontavam para a raiz com `?p=…`. O `landing.js` os redireciona para `app.html` antes de desenhar a apresentação, e o service worker serve o editor diretamente se além disso não há conexão.
- **O PWA entra direto no editor**: `start_url` e `id` do manifest apontam para `./app.html`. Instalar o ScrachMo não mostra a landing de novo.
- `index.html` e `landing.js` são puramente de apresentação: não carregam `data.js` nem `engine.js`, não tocam no projeto salvo e não registram o service worker.

## Como usar

É um app 100% estático: não há backend nem passos de instalação.

```bash
# Opção 1: qualquer servidor estático
python -m http.server 8000        # → http://localhost:8000
php -S localhost:8000             # idem com PHP

# Opção 2: XAMPP
# deixe o projeto em htdocs/ e entre em http://localhost/scrachMo
```

Você também pode abrir **`app.html`** direto com duplo clique (o editor) ou `index.html` (a landing). Para testar do celular, sirva na sua máquina e entre pelo navegador do telefone no IP local (mesmo WiFi), ou use a versão publicada em **<https://scrachmo.vercel.app>**.

**Publicar na Vercel**: o endereço oficial é `https://scrachmo.vercel.app` e o editor é `https://scrachmo.vercel.app/app.html`. No painel da Vercel importa-se o repositório e não é preciso configurar nada: o projeto é estático, não há *build command* nem *output directory* (serve-se a raiz), e cada push em `main` publica sozinho. O `vercel.json` tem dois trabalhos: (1) **`sw.js`, `index.html`, `app.html`, `landing.js` e `boot.js` não são guardados no cache da CDN** (`Cache-Control: public, max-age=0, must-revalidate`), porque se o service worker ficasse em cache o app instalado não saberia de uma versão nova; e (2) declara uma **Content-Security-Policy** com `script-src 'self'`, mais `X-Content-Type-Options` e `Referrer-Policy`. Por isso não há scripts nem manipuladores inline em nenhuma das duas páginas: o registro do service worker vive em `boot.js` e o `onclick` do campo de compartilhar foi ligado a partir do `engine.js`. `style-src` admite `'unsafe-inline'` (as duas páginas levam o CSS embutido) e `img-src` admite `data:` e `blob:` (trajes e SVG).

> **Alternativa opcional**: `.github/workflows/pages.yml` publica o mesmo app no GitHub Pages se for habilitado *Settings → Pages → Source: GitHub Actions*. Não é a publicação oficial: se o Pages não estiver habilitado, esse workflow termina em verde com um aviso e `deploy = skipped`. Isso é esperado e não afeta a Vercel.

Atenção: para instalar e para o modo offline é preciso `https` (ou `localhost`); por isso não funciona abrindo o arquivo.

### O fluxo básico

1. Escolha um personagem (ou crie um pelo catálogo, buscando por nome) e adicione blocos: toque na paleta para somá-los ao final, ou **arraste-os pela alça** e solte onde quiser. Se quiser usar os seus próprios desenhos, toque em **Importar minhas imagens…** e escolha um ou vários arquivos: é criado um personagem com essas imagens como trajes.
2. Arraste cada bloco pelo ícone para reordená-lo dentro da pilha ou aninhá-lo dentro de um bloco C. Com o botão de **duplicar** você copia um bloco completo (com o conteúdo), e se errar, **Desfazer / Refazer** (ou `Ctrl/Cmd+Z` e `Ctrl/Cmd+Shift+Z`) salva você. Se os blocos ficarem pequenos, use o **zoom** da barra de ferramentas; se faltar espaço, arraste a alça de baixo da área de código (ou focalize-a e use as setas). Quer que um campo use um valor calculado em vez de um número fixo? Toque no **ƒ** ao lado do campo e escolha um repórter (posição, pontuação, uma conta, aleatório…); o **×** do chip devolve você ao texto que tinha escrito.
3. Para ter dois scripts no mesmo personagem, adicione um segundo bloco chapéu: tudo o que vier depois pertence a esse chapéu. Para animar, adicione vários trajes em **Propriedades → Trajes** e monte um `Repetir` com `Mover` + `Próximo traje` + `Esperar`.
4. Toque em **Executar** e olhe o palco. Você pode mudar o fundo com a sua própria imagem pelo ícone do cartão *Palco*, e ajustar o tamanho da cena e dos personagens com o zoom da linha de baixo. **Parar** corta tudo e os personagens ficam onde chegaram; se quiser que voltem à posição de antes da execução, toque em **Voltar ao início**.

## Estrutura do projeto

| Arquivo | O que contém |
| --- | --- |
| `index.html` | **Landing** de apresentação: estilos, hero, maquete do editor, recursos, guia, apoio e rodapé. Não carrega o motor. |
| `landing.js` | Textos da landing em 4 idiomas, seletor de idioma, versão, link direto compartilhável e redirecionamento dos `?p=` antigos. |
| `app.html` | **O editor**: toda a interface, layout, estilos, ícones SVG e painéis. É a URL direta e o `start_url` do PWA. |
| `boot.js` | Registro do service worker fora do HTML (a CSP exige), protegido para `file://`. |
| `engine.js` | O motor: render dos blocos, drag & drop por toque, execução, personagens, variáveis, eventos, modais acessíveis e projeto. |
| `data.js` | Catálogo de blocos (53 enunciados + 11 repórteres), categorias, versão visível e textos da interface (4 idiomas). |
| `manifest.webmanifest` | Ficha de instalação: nome, cores, `display: standalone`, `start_url: ./app.html` e ícones. |
| `sw.js` | Service worker: guarda a landing e o app para abrirem sem internet, e serve `app.html` aos links `?p=`. O nome do cache leva a versão e uma impressão digital dos seis arquivos do runtime. |
| `vercel.json` | Cabeçalhos da publicação: CSP estrita, `nosniff`, `Referrer-Policy` e os arquivos sem cache de CDN. |
| `icons/` | Ícone do app em SVG e PNG (192, 512, *maskable* e *apple-touch*). |
| `README.md` e as suas traduções | A documentação: o espanhol no `README.md` e as versões em `README.en.md`, `README.pt.md` e `README.fr.md`, cada uma com a barra de idiomas no topo. As traduções não repetem a seção de verificação: ligam à do espanhol. |
| `tests/` | Suíte de testes de fumaça sobre o DOM real, verificações estáticas, PWA e o gerador de páginas de teste. |
| `.github/workflows/test.yml` | CI: sintaxe, paridade de textos, trava de versão, PWA e a suíte no Chrome headless em cada push e pull request. |
| `.github/workflows/pages.yml` | Publicação **opcional** no GitHub Pages. A publicação oficial é a Vercel. |

O que abre no navegador são as duas páginas, os seus scripts, o manifest, o service worker e os ícones; `vercel.json`, `tests/` e os workflows são configuração e ferramentas de desenvolvimento, e não são carregados ao usar o ScrachMo. Os arneses de teste são montados a partir de **`app.html`**, não da landing.

Quer adicionar um bloco novo? É uma entrada em `data.js` e a sua lógica em `engine.js`.

## Verificação

O projeto tem **1187 verificações por idioma, 4748 no total**: cada cenário roda **quatro vezes —espanhol, inglês, português e francês— no Chrome headless**, e as quatro têm que dar 0 falhas. Além disso há **143 verificações de PWA** que não precisam de navegador. Juntas cobrem o catálogo de blocos e os quatro idiomas, o motor e os seus eventos, trajes e importação de imagens, o editor e as suas ferramentas, o palco e o seu tamanho —incluindo a margem visual que mantém o desenho inteiro dentro do palco—, clones, sensores e colisões, sons e a sua síntese de verdade, a exportação `.sb3`, a landing e o controle na tela com a inclinação.

```bash
node --check data.js && node --check engine.js && node --check sw.js && \
node --check landing.js && node --check boot.js
node tests/check-parity.js       # paridade de textos + verificações estáticas
node tests/pwa-check.js          # manifest, ícones e rotas servidas
node tests/pwa-sw.js             # lógica do service worker
node tests/run.js minha-corrida  # 25 cenários × 4 idiomas no Chrome headless
```

`tests/build.js` monta as páginas de teste e o link compartilhado; `tests/run.js` abre o Chrome com um perfil isolado por suíte e por idioma, e conta `PASS` / `FAIL` / `ERROR`. No GitHub Actions, `.github/workflows/test.yml` repete o mesmo em cada push e pull request.

O registro completo —o que cada suíte verifica, por que quatro idiomas e `--lang`, as armadilhas encontradas pelo caminho, as notas de ambiente do CI e as regras de versão e cache— fica no README em espanhol, que é a fonte de verdade para tudo o que muda a cada versão:

→ **[Verificação (espanhol)](README.md#verificación)**

## Verificação manual no iPhone (WebKit)

A suíte automática roda no **Chrome headless**. O WebKit —o motor do Safari e de *todos* os navegadores do iOS, porque a Apple não deixa usar outro— não está coberto: montá-lo no CI exige Playwright com WebKit ou um runner de macOS, e há coisas que de qualquer forma só se podem julgar com o dedo (o sensor, o áudio, o notch). Enquanto isso não existir, esta é a lista que se roda **à mão antes de cada versão**, com um iPhone real e Safari. São uns dez minutos.

| # | O que testar | Como | O que tem que acontecer |
|---|---|---|---|
| 1 | Instalação | Abrir `https://scrachmo.vercel.app/app.html` no Safari → Compartilhar → *Adicionar à Tela de Início* | Abre no **editor**, sem a barra do Safari, com o ícone certo |
| 2 | Sem conexão | Modo avião → abrir pelo ícone | Carrega igual (service worker). Criar um personagem, fechar e reabrir: continua lá |
| 3 | Áudio | Projeto com `Tocar som` → **Executar** | Toca. Se o primeiro som se perder, é o desbloqueio do WebAudio por gesto |
| 4 | Permissão de movimento | **Executar** → tocar em **Inclinar** | O iOS pergunta *Permitir Movimento e Orientação*. Com *Permitir*, inclinar move o personagem |
| 5 | Permissão negada | Repetir escolhendo *Não permitir* | Aparece o aviso, o jogo **continua funcionando com o controle** e nada quebra |
| 6 | Inclinação na horizontal | Girar o celular e inclinar para a direita | O personagem vai para a **direita**. Se for ao contrário, o bug está em `tiltBasis()` |
| 7 | Controle | Tocar e **manter** uma seta | Anda direto; ao soltar, para. O toque **não** dispara «ao tocar» de passagem |
| 8 | Notch e barra inferior | Modo jogo na vertical e na horizontal | O controle e **Sair** não ficam embaixo do notch nem da barra de gestos (`env(safe-area-inset-*)`) |
| 9 | Aviso de girar | **Executar** com o celular na vertical | Aparece; o ✕ fecha e não volta até a próxima partida |
| 10 | Imagens | Enviar um PNG grande e um SVG | São reduzidos a 256 px; o SVG entra **convertido em bitmap**, não é guardado como vetor |
| 11 | `createImageBitmap` | O mesmo traje grande | O Safari não tem essa API: `loadBitmap()` cai para `<img>` e a imagem aparece igual |
| 12 | Idioma compartilhado | Mudar para francês na landing → abrir o editor | O editor abre em **francês** (as duas chaves do `localStorage`) |
| 13 | Exportar para o Scratch | Exportar `.sb3` → enviar para `scratch.mit.edu` | Os trajes carregam: o nome de cada arquivo é o seu MD5 |
| 14 | Navegação privada | Abrir numa aba privada | Funciona; se o iOS bloquear o salvamento, avisa e não quebra o app |

Se algo falhar, anote **modelo, versão do iOS e se aconteceu no Safari ou no app instalado**: os três mudam o comportamento do WebKit, e sem eles o relato não serve.

## Limitações conhecidas

Melhor honesto do que vendedor:

- **A exportação para `.sb3` é de ida, e não é completa**: o ScrachMo abre os seus próprios formatos (`.scmo` e `?p=`, que são JSON dele) mas **não pode importar um `.sb3`**. E do lado da exportação há blocos sem equivalente no Scratch (mensagens locais, agitar, inclinação, vibrar, criar/mostrar variáveis, amigos e o `senão` solto): não são inventados, ficam de fora e são avisados num comentário dentro do projeto. E se você aumentou o palco, o aviso também diz: o do Scratch mede sempre 480 × 360, então o que ficar fora do retângulo original não vai aparecer. Além disso uma melodia toca **uma vez** no Scratch em vez de ficar em loop, e o rebote usa a caixa do traje do Scratch e não o círculo do ScrachMo, então um personagem muito comprido pode rebater um pouco antes ou depois.
- **As colisões não são pixel a pixel**: cada personagem é um círculo de raio 26 a 100 % de tamanho, escalado pelo seu tamanho. É rápido e estável, mas um personagem muito comprido colide antes ou depois do que o desenho sugere, e não há detecção de cor nem de «tocando o ponteiro».
- **O cronômetro vive na sessão**: conta desde que você abriu o projeto (ou desde o último `Reiniciar cronômetro`), não é salvo no `.scmo`, não reinicia com *Executar* e não para com *Parar*. Se o jogo precisa de um tempo, reinicie no começo do script.
- **Não é possível importar sons nem gravar com o microfone**: o catálogo é fechado (8 sons e 3 melodias sintetizadas) e não há editor de áudio. Adicionar sons próprios implicaria arquivos ou gravação, com o seu custo no peso do projeto e no cache do PWA.
- **O áudio precisa de um toque**: os navegadores móveis não deixam tocar nada até a pessoa interagir com a página. O ScrachMo retoma o contexto de áudio cada vez que algo vai tocar, então um script lançado com *Executar* toca sempre (esse toque já conta); o que pode ficar em silêncio é uma música que comece sozinha ao abrir um link `?p=`, sem nada ter sido tocado ainda.
- As contas dos blocos **já não aceitam JavaScript arbitrário**: só números, `+ - * / % **`, parênteses, `score`, variáveis e `aleatorio(a,b)`. Foi o preço de tirar o `Function()`; em troca o app funciona com CSP estrita.
- Não há editor de trajes: as imagens são importadas como estão (reduzidas a 256 px), mas não podem ser desenhadas, recortadas, renomeadas nem reordenadas pelo app. Um GIF animado fica com o seu primeiro quadro.
- Os campos aceitam números fixos ou um repórter (`ƒ`); o texto livre de um campo de movimento não resolve variáveis nem contas. Em `Ir para x: y:` os valores que deixariam o desenho fora são recortados na **borda segura** (a borda do mundo menos o raio visual), assim o personagem nunca aparece cortado; os campos mostram esses mesmos limites. Se quiser voltar à posição anterior a uma execução, use **Voltar ao início**.
- Os repórteres são numéricos: `{x} > {y}` devolve `1` ou `0` (basta para `se`, mas não há booleanos nem textos de primeira classe) e uma variável com texto conta como `0` dentro de uma conta. O aninhamento é cortado em 12 níveis ao executar e em 10 ao desenhar, para que um projeto manipulado não trave o app.
- Os links `?p=` continuam levando o projeto inteiro dentro da URL. Com muitos trajes grandes podem ficar longos demais para o WhatsApp ou para o navegador; nesse caso é melhor exportar o `.scmo`. Publicá-lo na Vercel não muda isso: seriam precisos links curtos com um backend de armazenamento.
- **A instalação e o modo offline precisam de `https` ou `localhost`**: são requisitos do navegador para os service workers, não uma decisão do app. Aberto com duplo clique (`file://`) o ScrachMo funciona igual, mas sem ícone instalável e sem cache.
- **O cache do PWA é invalidado a cada versão, e agora o CI exige isso**: o nome do cache em `sw.js` é `scrachmo-<APP_VERSION>-<impressão>`, onde a impressão são os primeiros 8 caracteres do SHA-256 de `index.html + app.html + landing.js + boot.js + data.js + engine.js` (com finais de linha normalizados para dar igual no Windows e no Linux). `tests/check-parity.js` recalcula essa impressão e **falha se algum desses seis arquivos mudou sem atualizar o `sw.js`**; também falha se `APP_VERSION` do `data.js`, a versão do `landing.js` e a do `sw.js` não coincidirem. Para publicar roda-se `node tests/bump-sw.js` (ou `node tests/bump-sw.js v12`), que sobe as três versões e recalcula a impressão. Sem isso, o service worker serve esses arquivos do cache sem revalidar e o app instalado fica velho indefinidamente. `tests/pwa-sw.js` lê a versão do próprio `sw.js`, assim ela não fica presa a um número. Na Vercel, além disso, o `vercel.json` impede que a CDN guarde o `sw.js`.
- Um projeto aberto a partir de um link `?p=` ou de um `.scmo` é carregado **no projeto atual**, então substitui o que estava lá. Se quiser conservá-lo, crie um novo antes de abrir.
- O nome do projeto vive na biblioteca do dispositivo: não viaja dentro do `.scmo` nem do link `?p=`. Também não há pastas nem ordem manual: a lista é ordenada pela última alteração.
- **As mensagens não são multijogador**: usam `localStorage` e chegam aos personagens do mesmo navegador (e a outras abas da mesma origem), nunca a outros dispositivos. Ver *Mensagens locais* acima.
- Há zoom da área de blocos e do palco, e layout de duas colunas a partir de 900 px, mas a disposição larga não pode ser forçada à mão num celular: sai sozinha conforme a largura da tela.

## Licença

[MIT](LICENSE). Use, quebre e melhore livremente.
