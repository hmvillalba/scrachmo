# ScrachMo

> Programa con bloques estilo Scratch, directo desde el celular.

**ScrachMo** es un entorno de programación visual inspirado en [Scratch](https://scratch.mit.edu), rediseñado desde cero para pantallas verticales: los paneles se apilan uno abajo del otro, los bloques son grandes y pensados para el pulgar, y todo corre en el navegador sin instalar nada.

Sin frameworks, sin dependencias, sin build: tres archivos que andan en cualquier navegador moderno, en la compu o en el teléfono.

## Características

### Bloques como en Scratch

- 51 bloques en 9 categorías con los colores clásicos de Scratch: movimiento, apariencia, sonido, eventos, control, sensores, operadores, variables y multijugador.
- Bloques sombrero (bandera verde, toque, tecla, agitar el celu, recibir mensaje, puntaje) y bloques C: `repetir`, `por siempre` y condicionales con `si... si no`.
- Anidado real: arrastrá bloques adentro de un bloque C para envolverlos, con guardas que evitan anidar un bloque dentro de sí mismo.
- **Varios guiones por sprite**: cada sombrero inicia un guion independiente y sólo se ejecutan los que corresponden al evento ocurrido. Un mismo sprite puede reaccionar a la bandera, a una tecla y a un toque a la vez.
- Muescas tipo puzzle en la parte superior de los bloques y resaltado visible del bloque en ejecución.
- **`ir a x: {x} y: {y}`**: dos casillas numéricas en un mismo bloque para teletransportar el personaje a una coordenada exacta (x de -240 a 240, e y de -180 a 180). Es la forma de fijar la posición de partida de un guion aunque el estado final de la corrida anterior haya quedado guardado como estado de diseño.
- **Reporteros: 11 bloques que devuelven un valor**. Las casillas de movimiento, apariencia, control, operadores, variables y puntaje tienen un botón **ƒ** para poner un valor calculado en vez de un número fijo: `puntos`, `posición x`, `posición y`, `variable {v}`, `cronómetro`, `al azar {x} a {y}`, `{x} + {y}`, `{x} − {y}`, `{x} × {y}`, `{x} ÷ {y}` y `{x} > {y}`. Se pueden **anidar** —`mover ((posición x) + 10)`, `si (puntos > 10) entonces`, `repetir (al azar 2 a 5)`— y la **×** del chip vuelve al texto libre sin perder lo que habías escrito. No son enunciados: no aparecen en la paleta ni se agregan sueltos, viven dentro de la casilla de otro bloque.

### Editor cómodo en pantalla chica

- **Arrastrá desde la paleta**: tocá un bloque para agregarlo al final, o arrastralo desde su empuñadura y soltalo exactamente donde querés (en la pila principal o dentro de un `repetir` / `si... si no`). En táctil se agarra por la empuñadura para no bloquear el scroll; con mouse, desde cualquier parte del bloque. El tap y el teclado siguen funcionando igual.
- **Duplicar**: cada bloque tiene un botón que lo copia junto con todo su subárbol, regenerando los ids para no romper el arrastre ni el resaltado.
- **Deshacer / Rehacer**: botones y atajos `Ctrl/Cmd+Z`, `Ctrl/Cmd+Shift+Z` y `Ctrl/Cmd+Y`. El historial guarda hasta 60 instantáneas y no interfiere con el deshacer de texto dentro de un input.
- **Dos zooms independientes, y los dos agrandan el contenido y no la ventana**: el del **área de código** (70 % a 160 % con `− / +`, tocando el porcentaje volvés a 100 %) escala los bloques dentro de un panel de alto fijo; el del **escenario** (misma escala, en la fila de abajo) acerca la cámara, así que crecen los personajes, el fondo y los globos mientras la ventana del escenario mide siempre lo mismo. Los dos se recuerdan entre sesiones, no viajan en el proyecto y la línea de inserción se corrige sola al arrastrar con zoom.
- Layout mobile-first: paneles verticales apilables y colapsables, con respeto de los *safe areas* en pantallas con notch.
- **En pantalla ancha (desde 900 px) se pone en dos columnas**: el escenario y los personajes a la izquierda, el código con la paleta de bloques a la derecha, y variables y proyecto debajo. En el celular se sigue apilando igual, en el mismo orden de siempre (Escenario → Personajes → Código → Variables → Proyecto → Bloques): las columnas se «disuelven» con `display:contents` y el orden lo decide `order`. El modo juego queda afuera: ahí se ve sólo la cancha, con la proporción del juego y no la de la pantalla. En un celular acostado se achican márgenes y escenario para que entre más.
- Interacción 100% táctil (pointer events): tocá para agregar, arrastrá por el ícono para reordenar o anidar. También hay reordenado por teclado.

### Escenario y sprites

- Múltiples sprites, cada uno con su propio programa: crear, eliminar y alternar entre ellos.
- **Catálogo de 143 personajes** organizado en 8 grupos (animales, espacio, vehículos, juegos y deportes, comida, naturaleza, fantasía y objetos), con buscador que ignora tildes y mayúsculas y acepta palabras en español, inglés, portugués y francés.
- Movimiento, dirección, tamaño, rotación, visibilidad y burbujas de diálogo. Los globos se leen en horizontal, con ancho según el texto y envoltura cuando el mensaje es largo.
- **Zoom del escenario**: con `− / 130 % / +` la cámara se acerca o se aleja: crecen los personajes, el fondo y los globos, pero **la ventana del escenario mide siempre lo mismo** (antes el zoom estiraba la escena y la página entera saltaba de tamaño). Las posiciones siguen siendo porcentuales del mundo, así que arrastrar un sprite y los bloques de movimiento no se descalibran, y el arrastre divide por el zoom para que el personaje siga la punta del dedo. También se aplica en modo juego.
- **Escenario del tamaño que necesites**: el mundo mide 480 × 360 unidades de fábrica, pero se agranda arrastrando las asas del borde —la de abajo cambia el alto, la de la derecha el ancho y la esquina las dos, hasta 1440 × 1080—. Crece **hacia la derecha y hacia abajo**, así que lo que ya estaba puesto no se mueve ni un píxel y el espacio nuevo queda libre para más personajes o para una cancha más larga. Los bordes, los rebotes, los choques y el recorte de las casillas `x`/`y` siguen al tamaño nuevo, el tamaño viaja en el proyecto y en los links, y **Volver al tamaño original** (aparece al lado del zoom cuando el escenario ya no es el de fábrica) devuelve todo a 480 × 360 recortando lo que quedaba afuera. Con teclado, las flechas sobre el asa agrandan de a 60 unidades.
- **Modo juego con la cancha en 4:3**: el botón *Jugar* deja sólo el escenario, centrado y tan grande como entre, con franjas del color de fondo. La proporción es siempre la del mundo —480 × 360 unidades de fábrica, o sea 4:3, y la que hayas elegido si agrandaste el escenario— y no se estira: si se estirara, 100 pasos hacia arriba se verían más grandes que 100 a la derecha y lo que se ve no coincidiría con los choques, que se calculan en unidades. En un teléfono parado aparece abajo un aviso discreto —«Girá el teléfono para verlo más grande»— que se puede cerrar y no vuelve hasta el próximo juego.
- **Fondo propio del escenario**: subí tu propia imagen (PNG, JPG, WebP, GIF, BMP o SVG) desde el ícono de la tarjeta *Escenario*. Se redibuja a 1280 px como máximo, se comprime a WebP/PNG y se muestra con `cover`. El botón **Quitar mi fondo** vuelve a los 6 gradientes; usar `cambiar fondo` también sale del fondo propio. Viaja en el guardado y en los links compartidos, y se rechazan las URLs externas por seguridad.
- Variables con pasos configurables (+ / −) y opción de mostrarlas en el escenario.

### Clones

- **`crear clon de [mí mismo / un personaje]`** hace una copia viva del personaje con su posición, dirección, tamaño, visibilidad y disfraz de ese momento. El clon comparte los guiones y las variables con su original, pero se mueve, gira, cambia de tamaño y de disfraz por su cuenta.
- **`al comenzar como clon`** es el sombrero que corre en cada copia justo al nacer. Un clon **no** corre la bandera verde ni los demás sombreros: si los corriera, cada copia repetiría todo lo que hace el original.
- **`borrar este clon`** hace desaparecer a la copia que lo ejecuta, y su guion se corta en ese mismo bloque. En el personaje original no hace nada, igual que en Scratch.
- Los clones **chocan** entre sí y con los originales, y hablan con su propio globo.
- **No se guardan**: existen sólo mientras dura la ejecución. Detener los borra todos; dejar que el guion termine los deja en pantalla, como estado final. El tope es de **300 clones**, el mismo de Scratch, para que no se pueda colgar el celular.
- Se exportan a `.sb3` con sus tres bloques nativos, así que un juego de clones funciona igual en Scratch.

### Disfraces e imágenes propias

- **Importá tus propias imágenes** (PNG, JPG, WebP, GIF, BMP o SVG) desde el botón *Importar mis imágenes…* del catálogo, o desde *Agregar disfraces* en las propiedades de un personaje. Podés elegir varias a la vez y también crear un personaje nuevo hecho enteramente de tus dibujos o fotos.
- **Hasta 12 disfraces por personaje**, con una tira de miniaturas para verlos, elegir el activo y borrar los que no quieras (siempre queda al menos uno).
- Cada imagen se **redibuja en un canvas**, se ajusta a 256 px como máximo y se re-codifica a WebP (o PNG si el navegador no soporta WebP). Nunca se guarda el archivo original: **un SVG se acepta, pero se convierte en mapa de bits al importarlo**, así que en el proyecto y en los links nunca queda un `data:image/svg+xml` (un SVG puede llevar script adentro). Como es vectorial, el SVG sí se agranda hasta los 256 px en vez de quedarse del tamaño en que lo dibujaste, y su proporción sale del `width`/`height` o, si no están, del `viewBox`. Se rechazan las URLs externas y los `.svgz` (vienen comprimidos y el navegador no los abre como imagen), y hay tope de peso por imagen.
- Los dos bloques nuevos de **Apariencia** permiten animar como en Scratch: `siguiente disfraz` y `cambiar disfraz a {v}` (un selector con los nombres de tus disfraces). Combinados con `repetir`, `mover` y `esperar` simulan caminata, aleteo, giros, etc.
- El bloque `cambiar disfraz a` guarda el **nombre**, no la posición: borrar o reordenar disfraces no repunta el bloque a otro. Los proyectos viejos con valores numéricos se siguen leyendo.
- Los emojis del catálogo siguen funcionando como un disfraz más: los proyectos guardados antes de esta versión se migran automáticamente.

### Sonidos y música

- **7 bloques de sonido**: los dos de siempre (`Miau` y `Pop`) más **`reproducir sonido {v}`** con 8 sonidos para elegir, **`tocar música {v}`** con 3 melodías en bucle, **`detener los sonidos`**, **`fijar volumen en {v} %`** y **`cambiar volumen en {v}`**.
- **No hay archivos de audio**: todo se sintetiza con WebAudio en el momento de reproducir (osciladores con envolvente y ruido filtrado para golpes y explosiones). Así la app sigue abriendo con doble clic (`file://`), la PWA no tiene que cachear nada extra y no hay derechos de autor de por medio.
- Los sonidos son **pitido, miau, pop, moneda, salto, explosión, aplauso y campana**; las melodías, **alegre, triste y de juego**. El bloque guarda el **id** del sonido, no el nombre: cambiar de idioma no rompe los proyectos.
- **El volumen es del proyecto** (0 a 100, arranca en 100) y se guarda con él, así un juego puede venir con la música más baja. Se aplica en un nodo maestro, por lo que un `fijar volumen` se escucha al instante incluso en una melodía que ya está sonando.
- La música **se repite hasta que la detengas** o pongas otra. `detener los sonidos` corta todo lo que esté sonando, música incluida, y **Detener también la corta**: si no, seguiría sonando para siempre porque nadie más la apagaría.
- `reproducir sonido` **no espera a que el sonido termine** (igual que en Scratch): para encadenarlos, poné `esperar` debajo.

### Ejecución

- Ejecutar / Detener, con resaltado del bloque que corre en cada momento. Varios guiones pueden correr en paralelo sin perder el resaltado ni mezclar sus condiciones.
- Eventos: bandera verde, toque en el escenario, teclado, agitar el dispositivo, puntaje y mensajes. El sombrero de puntaje se dispara una sola vez por umbral, no se reengancha en bucle.
- **Los personajes se quedan donde terminaron**: al detener o al terminar los guiones ya no vuelven a cero. La posición, el disfraz, el tamaño, la visibilidad y el fondo que dejó el programa pasan a ser el estado de diseño: se guardan y son el punto de partida de la próxima ejecución. Si querés deshacer ese recorrido, tocá **Volver al inicio** (aparece debajo del escenario tras la primera corrida) y se restaura la instantánea tomada al arrancar. Durante la ejecución no se autoguardan cambios; el puntaje sí se conserva entre ejecuciones.
- Bucles con tope de seguridad: un `repetir` o `por siempre` descontrolado no cuelga el navegador.
- En iOS 13+ se pide el permiso de movimiento desde el primer toque, como exige el sistema.

### Sensores y colisiones

- **`rebotar`**: si el personaje está tocando un borde, da media vuelta y sigue. La dirección se corrige según el lado: contra una pared vertical se invierte el componente horizontal (`dirección → −dirección`) y contra el piso o el techo el vertical (`dirección → 180 − dirección`), así que el personaje sale en el ángulo espejado y no se queda pegado al borde.
- **`si toca el borde`** y **`si toca a otro personaje`**: condiciones para envolver lo que quieras, con el mismo `si` / `si no` de siempre. La segunda ignora a los personajes ocultos y a sí mismo, así que un disfraz invisible no bloquea ni dispara choques.
- **`reiniciar cronómetro`** y el reportero **`cronómetro`**: devuelve los segundos (con un decimal) desde que abriste el proyecto o desde el último reinicio. Sirve para «sobreviví 30 segundos», cuentas atrás con `si (cronómetro > 10) entonces` y para medir tiempos dentro de un juego.
- Los choques usan la geometría del escenario, pero **con un círculo por personaje**: cada uno se aproxima a un círculo de radio 26 unidades al 100 % de tamaño (el escenario mide 480 × 360 de fábrica, y si lo agrandás los bordes acompañan) y los bordes se miden contra ese círculo, así que el choque ocurre cuando el cuerpo del personaje llega al límite y no cuando el recuadro del dibujo lo toca. No es una colisión pixel a pixel: con un personaje muy alargado o muy flaco el roce se siente un poco generoso o un poco tarde.
- Todo esto se ejecuta también en **modo juego**, y el cronómetro no se reinicia al apretar *Ejecutar*: si querés que vuelva a cero, poné `reiniciar cronómetro` al principio del guion.

### Proyectos

- **Varios proyectos con nombre**: la tarjeta *Proyecto* tiene **Mis proyectos**, con la lista de todo lo guardado en el dispositivo. Desde ahí podés **crear**, **abrir**, **renombrar**, **duplicar** y **borrar** (hasta 24), y el botón muestra siempre el nombre del proyecto abierto. Abrir otro ya no pisa el anterior: cada uno se guarda aparte y el que estaba abierto se respalda antes de cambiar. No se puede borrar el último.
- Guardado automático en el dispositivo (localStorage), incluyendo puntaje, estado de la opción multijugador, todos los disfraces y el fondo propio. Las preferencias de la interfaz (paneles colapsados, zoom de bloques y zoom del escenario) se guardan aparte en `scrachmo_ui`, aceptando el formato viejo. Si se llena el espacio del dispositivo, la app avisa en vez de fallar en silencio.
- **Compartir**: genera un link con el proyecto adentro (`?p=...`) para mandar a amigos; al abrirlo, el proyecto se carga solo. El JSON se **comprime con gzip** (`g1.`) y se codifica en base64url, así que los disfraces viajan en un link bastante más corto. Si el navegador no tiene `CompressionStream`, cae a JSON sin comprimir (`j1.`), y los links viejos en base64 plano se siguen abriendo igual.
- Si el link supera los 8000 caracteres, la app avisa que algunos chats pueden cortarlo y conviene usar menos imágenes o exportar el `.scmo`.
- Interfaz en español, inglés, portugués y francés.

### Exportar a Scratch (`.sb3`)

- **Exportar a Scratch (.sb3)** está en la tarjeta de herramientas y baja un archivo que **Scratch 3 abre tal cual** (`Archivo → Cargar desde tu computadora`). No es un «guardar como»: ScrachMo arma el ZIP a mano —`project.json` más un archivo por disfraz y por sonido, cada uno nombrado con su **MD5**— con su propio escritor de ZIP, su MD5 y su CRC32, sin librerías ni conexión.
- **Personajes**: cada uno viaja como sprite con su disfraz (el emoji se dibuja a PNG de 128 px; las imágenes propias se reescalan a 480 px), su posición, dirección, tamaño, estilo de rotación y visibilidad. El fondo del escenario —el degradado o la imagen que subiste— va como disfraz del *Stage*.
- **Guiones**: se reconstruye el grafo de bloques completo (`next`, `parent`, `SUBSTACK`, `SUBSTACK2`, sombreros y menús desplegables). Las variables del proyecto quedan declaradas en el *Stage* y el mensaje se declara para que los bloques de enviar/recibir lo encuentren.
- **Sonidos y melodías**: no se copian archivos, se **sintetizan a WAV** (22050 Hz, mono, 16 bits) con la misma receta de pasos que usa el motor, así que suenan igual que acá. El ruido usa un generador pseudoaleatorio con semilla fija: dos exportaciones del mismo proyecto dan archivos idénticos.
- **Qué se traduce y qué no**:

| ScrachMo | En Scratch |
| --- | --- |
| `mover`, `girar`, `ir a x: y:`, `apuntar en dirección`, `rebotar` | `motion_*` (el rebote usa el bloque propio de Scratch) |
| `decir`, `pensar`, `mostrar`, `esconder`, `tamaño`, `siguiente disfraz`, `cambiar disfraz a` | `looks_*` con los nombres de tus disfraces |
| `reproducir sonido`, `detener los sonidos`, `volumen` | `sound_*` con los sonidos generados |
| `al presionar bandera`, `al tocar personaje`, `al presionar tecla`, `al recibir` | `event_*` |
| `esperar`, `repetir`, `por siempre`, `si`, `si/sino`, `si toca el borde`, `si toca a` | `control_*` y `sensing_touchingobject` |
| `crear clon de`, `al comenzar como clon`, `borrar este clon` | `control_create_clone_of`, `control_start_as_clone`, `control_delete_this_clone` |
| `puntaje` y las variables | variables globales del *Stage* |
| Multijugador, agitado, inclinación, vibrar, crear/mostrar variables, amigos, `sino` suelto | **sin equivalente** |

- **Lo que queda afuera se avisa, no se pierde en silencio**: al terminar, la app dice cuántos bloques no pudo traducir, y cada personaje afectado lleva un **comentario pegado a su primer bloque** dentro de Scratch con la lista. Así el proyecto abre, corre y se ve dónde hay que completarlo a mano.
- **Dos diferencias a tener en cuenta**: una melodía suena **una vez** en Scratch (no en bucle, porque un bucle dentro del guion lo colgaría) y el rebote queda con el bloque nativo de Scratch, que usa la caja del disfraz y no el círculo que usa ScrachMo. El camino inverso (abrir un `.sb3` en ScrachMo) no está implementado.

### Acerca de y apoyo al proyecto

- El botón **ⓘ** de la barra superior abre **Acerca de ScrachMo**: autor, licencia MIT, sitio web y una descripción corta de qué es la app.
- Ahí están los dos enlaces de apoyo —**Invitame un cafecito** y **Apoyar en Ko-fi**— y la frase que lo dice sin vueltas: si te gusta ScrachMo, una mención o una donación queda a tu criterio. Nada de eso condiciona el uso: la app es MIT y funciona entera sin pagar nada.
- **Todo traducido a los cuatro idiomas**, incluida esa frase y los botones de apoyo. Cierra con *Aceptar*, con `Escape` o tocando fuera de la tarjeta, y mientras está abierto la página de atrás no se mueve.
- No toca el proyecto ni el guardado: es informativo, se puede abrir en cualquier momento sin perder nada.

### Instalarla en el celular (PWA)

- Se puede **instalar como app**: tiene `manifest.webmanifest` con nombre, íconos (192, 512 y un *maskable* para Android) y color de tema, así que Chrome/Android ofrece «Instalar aplicación» y en iPhone se agrega a la pantalla de inicio con el ícono propio. Abierta así no muestra la barra del navegador.
- **Funciona sin internet**: un service worker (`sw.js`) guarda la app completa (`index.html`, `data.js`, `engine.js`, el manifest y los íconos) la primera vez que la abrís. Después arranca desde la caché y se actualiza sola cuando hay red.
- Los **links compartidos `?p=` también abren offline**: la navegación siempre devuelve el shell guardado y el proyecto viaja en la URL, así que un link sigue funcionando aunque el celular no tenga datos.
- Todo esto es **opcional y no rompe el doble clic**: abierta como archivo (`file://`) no hay service worker y la app funciona exactamente igual, sin caché. El registro está protegido con `location.protocol !== 'file:'`.

### Seguridad y robustez

- **Sin `eval` ni `Function()`**: las cuentas de los bloques de operadores, de variables y de las condiciones pasan por un parser aritmético propio (`calcExpr()`). Acepta `+ - * / % **`, paréntesis, decimales, menos unario, `score`, variables y `aleatorio(a,b)`; cualquier otro texto (incluido código JavaScript) no se ejecuta y devuelve `null`. Así la app funciona con un CSP estricto.
- **Diálogos propios y traducidos**: las confirmaciones y los pedidos de texto usan el modal de la app (`#askModal`), con **Aceptar / Cancelar**, `Escape`, `Enter` y bloqueo del scroll. Ya no se usan `prompt()`, `confirm()` ni `alert()`, que cortaban la interfaz y no se podían traducir. Si apretás **Detener** con un diálogo abierto, se cierra y el guion se cancela.
- **Topes al importar**: un proyecto `.scmo` o un link `?p=` no puede pasar de 8 MB de texto, 40 niveles de anidado ni 2000 bloques. Si algo se recorta, la app lo avisa en vez de colgarse.

## Cómo usarlo

Es una app 100% estática: no hay backend ni pasos de instalación.

```bash
# Opción 1: cualquier servidor estático
python -m http.server 8000        # → http://localhost:8000
php -S localhost:8000             # ídem con PHP

# Opción 2: XAMPP
# dejá el proyecto en htdocs/ y entrá a http://localhost/scrachMo
```

También podés abrir `index.html` directo con doble clic. Para probarlo desde el celular, servilo en tu compu y entrá desde el navegador del teléfono a la IP local (mismo WiFi), o publicalo en GitHub Pages.

**Publicarlo en GitHub Pages**: el repo trae `.github/workflows/pages.yml`, que en cada push a `main` copia a `_site/` sólo lo que la app necesita y lo publica. Sólo hay que habilitarlo una vez: **Settings → Pages → Source: GitHub Actions**. La URL queda como `https://<usuario>.github.io/scrachmo/`, y desde ahí el navegador del celular ya ofrece instalarla. Ojo: para instalar y para el modo offline hace falta `https` (o `localhost`); por eso no funciona abriendo el archivo.

### El flujo básico

1. Elegí un sprite (o creá uno desde el catálogo, buscando por nombre) y agregá bloques: tocá la paleta para sumarlos al final, o **arrastralos desde la empuñadura** y soltalos donde quieras. Si querés usar tus propios dibujos, tocá **Importar mis imágenes…** y elegí uno o varios archivos: se crea un personaje con esas imágenes como disfraces.
2. Arrastrá cada bloque por su ícono para reordenarlo dentro de la pila o anidarlo dentro de un bloque C. Con el botón de **duplicar** copiás un bloque completo (con su contenido), y si te equivocás, **Deshacer / Rehacer** (o `Ctrl/Cmd+Z` y `Ctrl/Cmd+Shift+Z`) te salva. Si los bloques te quedan chicos, usá el **zoom** de la barra de herramientas. ¿Querés que una casilla use un valor calculado en vez de un número fijo? Tocá la **ƒ** al lado de la casilla y elegí un reportero (posición, puntaje, una cuenta, al azar…); la **×** del chip te devuelve al texto que habías escrito.
3. Para tener dos guiones en el mismo sprite, agregá un segundo bloque sombrero: todo lo que venga después le pertenece a ese sombrero. Para animar, agregá varios disfraces en **Propiedades → Disfraces** y armá un `repetir` con `mover` + `siguiente disfraz` + `esperar`.
4. Tocá **Ejecutar** y mirá el escenario. Podés cambiar el fondo con tu propia imagen desde el ícono de la tarjeta *Escenario*, y ajustar el tamaño de la escena y de los personajes con el zoom de la fila de abajo. **Detener** corta todo y los sprites se quedan donde llegaron; si querés que vuelvan a la posición previa a la corrida, tocá **Volver al inicio**.

## Estructura del proyecto

| Archivo | Qué contiene |
| --- | --- |
| `index.html` | Toda la interfaz: layout, estilos, íconos SVG y paneles. |
| `engine.js` | El motor: render de bloques, drag & drop táctil, ejecución, sprites, variables y eventos. |
| `data.js` | Catálogo de bloques (51 enunciados + 11 reporteros), categorías y textos de la interfaz (4 idiomas). |
| `manifest.webmanifest` | Ficha de instalación: nombre, colores, `display: standalone` e íconos. |
| `sw.js` | Service worker: guarda la app para que abra sin internet y sirve el shell a los links `?p=`. |
| `icons/` | Ícono de la app en SVG y PNG (192, 512, *maskable* y *apple-touch*). |
| `tests/` | Suite de pruebas de humo sobre el DOM real, comprobaciones estáticas, PWA y el generador de páginas de prueba. |
| `.github/workflows/test.yml` | CI: sintaxis, paridad de textos, PWA y suite en Chrome headless en cada push y pull request. |
| `.github/workflows/pages.yml` | Publicación en GitHub Pages en cada push a `main`. |

La app que se abre en el navegador son esos tres archivos más el manifest, el service worker y los íconos; `tests/` y los workflows son herramientas de desarrollo y no se cargan al usar ScrachMo.

¿Querés agregar un bloque nuevo? Es una entrada en `data.js` y su lógica en `engine.js`.

## Verificación

Los cambios se validan con pruebas de humo sobre el DOM real en Chrome headless. La suite vive **dentro del repo** (`tests/`) y corre también en CI. Son **911 comprobaciones por idioma, 1822 en total**: cada escenario se corre **dos veces, en español y en inglés**, y las dos tienen que dar 0 fallos:

| Suite | Comprobaciones | Qué cubre |
| --- | ---: | --- |
| Estructura | 30 | Catálogo de 143 personajes, 51 bloques y badge, textos en 4 idiomas, IDs del DOM, muescas, resaltado y conservación de la posición final. |
| Motor y eventos | 25 | Buscador, guiones por sombrero, despacho de teclado/toque/bandera, aislamiento de hilos, no guardar durante la ejecución, persistencia de puntaje y multijugador, sombrero de puntaje sin re-disparos. |
| Disfraces y links | 53 | Migración de proyectos viejos, rechazo de SVG **en los datos guardados** y de URLs externas, tira de miniaturas, selector por nombre, serialización, ejecución de los dos bloques nuevos, estado final del disfraz y «Volver al inicio», gzip/base64url, links viejos y fallback. |
| Importación real | 37 | `File` → canvas → WebP, filtro de tipos (un SVG entra, un `.svgz` y un tipo falso no), SVG rasterizado a mapa de bits, agrandado del vector y proporción sacada del `width`/`height` o del `viewBox`, nombres únicos, nuevo personaje desde imágenes, borrado, límite de 12, aviso de espacio lleno. |
| Editor y herramientas | 78 | Zoom de bloques (y que el zoom no estire la tarjeta), deshacer/rehacer y atajos, duplicar subárboles, arrastrar desde la paleta, fondo propio e importación real de fondo, incluido un fondo SVG que se guarda ya rasterizado. |
| Escenario, globo y posición final | 52 | Zoom del escenario (la caja no cambia, el personaje sí; topes, persistencia, independencia y modo juego), globo horizontal y envoltura de texto largo, corrida natural y `Detener` conservando la posición, guardado del estado final, botón «Volver al inicio», siguiente corrida partiendo del estado final. |
| Bloque `ir a x: y:` | 64 | Catálogo y 4 idiomas, dos casillas en la paleta y en el editor, edición conjunta del par `"x,y"`, serialización y link compartido, `normalizeNodes` / clonar / duplicar / deshacer / rehacer, ejecución exacta con decimales, recorte al borde, campos vacíos y valores inválidos, y un guion real de principio a fin. |
| Parser, diálogos y topes | 65 | Aritmética sin `eval` (precedencia, paréntesis, potencia, decimales, errores de sintaxis), `evalExpr()` con `score`, variables y `aleatorio()`, condiciones, modal propio en modo confirmación y texto con traducciones en 4 idiomas, cancelación por `Escape`, flujos reales de borrado sin diálogos nativos, y recorte de proyectos con 40 niveles / 2000 nodos / 8 MB. |
| Reporteros | 71 | Catálogo de 11 y 4 idiomas, `node.reps` sin cambiar `node.val`, rechazo de reporteros sueltos o dentro de sombreros, tope de una casilla por hueco, anidado, serialización, clonado y deshacer, evaluación de los 11, ejecución real de `mover`, `ir a x: y:`, `repetir`, `si` y `decir`, y el selector `ƒ` con chip, borrado, texto conservado y casilla de nombre sin anidado. |
| Link al arrancar | 12 | Una página abierta con `?p=g1.…` carga proyecto, disfraces, puntaje, fondo y el bloque `ir a x: y:` con sus dos casillas, y renderiza la imagen en el escenario. |
| Proyectos con nombre | 47 | Migración del proyecto que ya existía, crear, abrir (y que el anterior quede intacto), renombrar con cancelación, duplicar, borrar cancelado y confirmado, salto al borrar el activo, no poder quedarse sin proyectos, límite de 24, la lista y el modal, los textos en 4 idiomas y la relectura del índice al arrancar. |
| Sensores y colisiones | 53 | Catálogo de los 4 bloques y el reportero en 4 idiomas, radio por tamaño y sus casos raros, detección de los 4 bordes, choque entre círculos que ignora al propio personaje y a los ocultos, rebote con la dirección correcta en cada pared (arriba, abajo, izquierda, derecha y esquina), cronómetro que avanza, se reinicia y no lo reinicia *Ejecutar*, `nodeVal()` y el selector `ƒ` ofreciendo el cronómetro, y un guion real con `por siempre` + `si toca el borde` + `rebotar`. |
| Sonidos y música | 68 | Catálogo de los 5 bloques, los 8 sonidos y las 3 melodías en 4 idiomas, nombre accesible con el nombre del sonido y no su id, volumen (topes, redondeo, texto inválido y ganancia maestra), y la síntesis de verdad contra un `AudioContext` falso: qué nota suena, cuántas, en qué orden, el ruido filtrado de la explosión, la melodía en bucle que se corta al cambiar de melodía, `detener los sonidos` cortando notas y música, *Detener* cortando la música, los `<select>` del editor guardando el id, un id inexistente que no rompe el bloque, la paleta con los 7 bloques y el volumen que viaja en el guardado (y un proyecto viejo sin volumen que arranca al 100). |
| Layout horizontal | 21 | En el ancho de las pruebas (800 px) las columnas se disuelven, las seis tarjetas quedan en una sola columna, mismo ancho y mismo borde izquierdo, en el orden de siempre con su `order` 1 a 6, sin desborde horizontal; el modo juego oculta código, bloques y personajes y deja el escenario entrando justo (la ventana de las pruebas, 800 × 600, ya es 4:3) y al salir vuelve el editor en orden; y un `resize` a mitad de uso no rompe nada. La disposición ancha (≥ 900 px) se revisó en capturas reales y su CSS está cubierto por las comprobaciones estáticas. |
| Modo juego 4:3 | 30 | El campo mide 4:3 de verdad, cabe en la pantalla, la aprovecha al máximo y queda centrado en los dos ejes; moviendo un personaje de verdad, 100 unidades a la derecha y 100 hacia arriba miden los mismos píxeles (con el escenario estirado daban 83 px contra 224 px en un teléfono parado); el aviso de girar existe, está traducido, no es un `.modal`, sólo sale en modo juego con la pantalla en vertical, se puede cerrar sin tocar el juego, vuelve al entrar de nuevo y se reescribe al cambiar de idioma; y las 2 claves están en los 4 idiomas con frases distintas. |
| Tamaño del escenario | 50 | Las tres asas existen y tienen el cursor que corresponde, el botón de volver está traducido y el mundo arranca en 480 × 360; con ese tamaño las fórmulas nuevas dan exactamente lo mismo que las viejas (si no, los proyectos guardados se correrían); agrandar el alto duplica la caja y deja al personaje a la misma distancia del borde de arriba, con el espacio nuevo abajo; los bordes, el rebote y el recorte de `x`/`y` siguen al tamaño nuevo; agrandar el ancho también; los topes de 1440 × 1080 y 480 × 360; que el tamaño se guarde, se restaure, que un proyecto viejo sin el campo caiga en el de fábrica y que un valor absurdo se recorte; volver al original recortando lo que quedaba afuera; el asa arrastrada con eventos de puntero de verdad (y que 60 px de gesto no se vuelvan 120), sin tocar el otro eje; el teclado; que tocar el asa **no** dispare «al tocar el escenario» pero el escenario sí; y que el modo juego respete el tamaño y entre en la pantalla. |
| Exportación `.sb3` | 73 | Vectores conocidos de MD5 y CRC32, el ZIP propio se vuelve a leer (nombres, contenido y CRC de cada entrada), cabecera y largo del WAV, el ruido determinista y la misma exportación dos veces dando bytes idénticos, firma y ancho del PNG, el `project.json` completo: *Stage* primero, `semver`, `monitors`, posición/dirección/tamaño/rotación/volumen del personaje, variables y mensaje declarados, el grafo de bloques sin referencias rotas (incluidos `SUBSTACK` y `SUBSTACK2`), los opcodes esperados de cada bloque, los menús desplegables, la tecla traducida, el MD5 de cada archivo coincidiendo con su nombre, `sampleCount` cuadrando con los bytes, los ids de variable y de mensaje existiendo, ningún archivo huérfano, el comentario con la lista de lo que no se pudo traducir, y un proyecto vacío que no rompe nada. |
| Clones | 44 | Los tres bloques en el catálogo y en los 4 idiomas, el sombrero marcado y el menú de personajes; que crear un clon copie posición y tamaño, tenga id propio, se dibuje y no se agregue al proyecto; que el sombrero de clon corra sólo en las copias y que una copia **no** corra la bandera (se comprueba con el puntaje, que subiría dos veces); borrar este clon y que en el original no haga nada; el tope de 300; que los clones choquen entre sí y con los originales; que no se guarden en el proyecto; que Detener los borre y terminar no; clonar a otro personaje y que un id inexistente no clone nada; el selector con «mí mismo» y el aviso de personaje borrado; y la exportación a .sb3 con los tres opcodes, el menú sombra y `_myself_` frente al nombre del personaje. |
| Acerca de | 38 | El botón de la barra con su ícono y su etiqueta traducida, el modal que arranca cerrado y abre al tocarlo, el bloqueo del scroll, el autor, la licencia MIT enlazada, el sitio, la descripción, la frase de mención o donación, los dos enlaces de apoyo con su `target`/`rel` y sus textos traducidos, que no toque el proyecto, los cuatro caminos de cierre (Aceptar, `Escape`, el fondo, y que tocar la tarjeta **no** cierre), las 10 claves en los 4 idiomas con las frases realmente distintas, el cambio de idioma en vivo, y que el modal quede **por encima** de los bloques: se mete un `z-index` 6000 dentro del área de código y el modal tiene que seguir ganando. |

Aparte de la suite de navegador hay **90 comprobaciones de PWA** que no necesitan Chrome:

| Chequeo | Comprobaciones | Qué cubre |
| --- | ---: | --- |
| `tests/pwa-check.js` | 70 | Manifest válido y con los campos que pide la instalación, cada ícono declarado existe y mide lo que dice (se lee el ancho/alto del PNG), enganche en el HTML (manifest, favicon, `apple-touch-icon`, `theme-color`), registro del service worker protegido para `file://`, y las 10 rutas críticas servidas por HTTP con su content-type (así se detectan rutas absolutas que darían 404 en Pages). |
| `tests/pwa-sw.js` | 20 | La lógica real de `sw.js` ejecutada contra dobles de `caches`/`fetch`: `install` guarda los 10 archivos, `activate` borra la caché vieja y toma el control, la navegación con `?p=` sale del shell cacheado, los assets salen de la caché, y no se interceptan otros orígenes ni los `POST`. |

Para correrlo en tu máquina:

```bash
node --check data.js && node --check engine.js && node --check sw.js
node tests/check-parity.js       # paridad de textos + comprobaciones estáticas
node tests/pwa-check.js          # manifest, íconos y rutas servidas
node tests/pwa-sw.js             # lógica del service worker
node tests/run.js mi-corrida     # 19 escenarios × 2 idiomas en Chrome headless
```

`tests/build.js` arma las páginas de prueba y el link compartido; `tests/run.js` lanza Chrome con un perfil aislado por suite y por idioma, y cuenta `PASS` / `FAIL` / `ERROR`. En GitHub Actions, `.github/workflows/test.yml` repite lo mismo en cada push y pull request.

**Por qué dos idiomas y por qué `--lang`**: el idioma inicial de la app sale de `navigator.language`. Sin fijarlo, Chrome usa el del sistema —español en una máquina, inglés en el runner de Linux— y una prueba que comparaba texto escrito a mano pasaba en un lado y fallaba en el otro. Ya pasó una vez. Ahora `tests/run.js` lanza Chrome con `--lang` explícito (`es-419` y `en-US`) y **verifica en el DOM que el idioma se haya aplicado de verdad**: si el `<html lang>` no coincide con el pedido, cuenta un error y lo dice, para que dos corridas idénticas nunca se confundan con dos idiomas. Se puede acotar con `SCRACHMO_LANGS=es node tests/run.js`.

Además: los 4 idiomas tienen las mismas 200 claves de texto (91 de `UI_EXTRA`) y los 51 bloques activos más 11 reporteros; los 76 `data-t` y 17 `data-tt` del HTML tienen traducción en los 4 idiomas; las comprobaciones estáticas aseguran que el motor no contenga `eval`/`Function()` ni `prompt()`/`confirm()`/`alert()`, que estén `calcExpr()`, `askUser()`, `nodeVal()`, `evalReporter()`, el selector `bindRepPicker()`, la geometría de los sensores (`spriteRadius()`, `touchingEdge()`, `touchingOther()`, `bounceSprite()`, el cronómetro), las piezas del exportador (`exportSb3()`, `sb3Build()`, `zipStore()`, `md5hex()`, `crc32()`, `wavFromSteps()`), el modal `openAbout()`/`closeAbout()`/`bindAbout()` con su botón, el campo del modo juego con la proporción del mundo, `syncGameOrientation()`/`bindGameOrientation()` y su aviso de girar, que el zoom del escenario se aplique a `.stage-world` y **no** al alto de la ventana, que el área de código tenga alto fijo, las asas del escenario con `startStageResize()`/`moveStageResize()`/`endStageResize()`/`resetWorldSize()` y los bordes del mundo (`worldLeft()`, `worldRight()`, `worldTop()`, `worldBottom()`) en vez de los ±240/±180 clavados, el ciclo de vida de los clones (`spawnClone()`, `deleteClone()`, `clearClones()`, el tope `MAX_CLONES` y los tres opcodes de exportación), y el tope `MAX_CODE_DEPTH`; que el área de código **aísle su contexto de apilamiento** (`isolation:isolate`), porque sus bloques usan `z-index` desde 6000 y sin eso se dibujaban encima de cualquier modal; y que los workflows no tengan un `name:` con `: ` sin comillas (eso rompe el YAML entero y GitHub corre el archivo sin ejecutar nada); no hubo errores no capturados ni rechazos de promesas en ninguna corrida. La burbuja, la barra de zoom, el bloque `ir a x: y:` (dos casillas, en el editor y en la paleta), el diálogo propio, la casilla con reportero, el ícono de la app, el modal de proyectos, los cuatro bloques de sensores con el cronómetro en el selector `ƒ`, los bloques de sonido con sus selectores de sonido y melodía, los tres bloques de clones con su menú de personajes, el modal *Acerca de*, el zoom del escenario (la ventana quieta con el personaje al 150 %), las asas de tamaño con el escenario agrandado hacia abajo, el área de código con los bloques al 160 % dentro del mismo panel y el modo juego en vertical y apaisado (con el aviso de girar) también se revisaron en capturas reales, a 500 px y en pantalla ancha.

Nota de entorno: Microsoft Edge no sirvió para esto (su binario GUI no devuelve DOM ni capturas por línea de comando); se usó Chrome con `--headless=new --dump-dom`. En el decodificador de imágenes de Chrome headless se detectó un cuelgue intermitente de `createImageBitmap`, por lo que el motor ahora cae a `<img>` si tarda más de 3 segundos.

**Lo que sí cambia entre una máquina y el runner**, para que nadie se sorprenda si algo falla sólo en CI: la **versión de Chrome** (el workflow imprime la suya en el paso *Localizar Chrome*), el **sistema operativo** (Linux en CI, Windows o macOS en casa) y las **fuentes**, sobre todo las de emoji: CI instala `fonts-noto-color-emoji` y `fonts-dejavu-core`, Windows usa Segoe UI Emoji. Eso hace que el mismo emoji se dibuje distinto, así que ninguna prueba compara los **bytes** de un PNG: se comprueban la firma, el tamaño y que el archivo exista. Los WAV se sintetizan con semilla fija y salen idénticos byte a byte **dentro de un mismo navegador** (que es lo que exige la prueba de determinismo), pero tampoco se compara su hash entre máquinas: `Math.sin` no está obligado a dar el mismo bit en versiones distintas de V8. El idioma, que era la diferencia que más dolía, ya está fijado.

## Limitaciones conocidas

Mejor honesto que vendedor:

- **La exportación a `.sb3` es de ida, y no es completa**: ScrachMo abre sus propios formatos (`.scmo` y `?p=`, que son JSON suyo) pero **no puede importar un `.sb3`**. Y del lado de la exportación hay bloques sin equivalente en Scratch (multijugador, agitado, inclinación, vibrar, crear/mostrar variables, los amigos y el `sino` suelto): no se inventan, se dejan afuera y se avisan en un comentario dentro del proyecto. Y si agrandaste el escenario, el aviso también lo dice: el de Scratch mide siempre 480 × 360, así que lo que quede afuera del recuadro original no se va a ver. Además una melodía suena **una vez** en Scratch en lugar de quedar en bucle, y el rebote usa la caja del disfraz de Scratch y no el círculo de ScrachMo, así que un personaje muy alargado puede rebotar un poco antes o después.
- **Los choques no son pixel a pixel**: cada personaje es un círculo de radio 26 al 100 % de tamaño, escalado por su tamaño. Es rápido y estable, pero un personaje muy alargado choca antes o después de lo que sugiere el dibujo, y no hay detección de color ni de «tocando el puntero».
- **El cronómetro vive en la sesión**: cuenta desde que abriste el proyecto (o desde el último `reiniciar cronómetro`), no se guarda en el `.scmo`, no se reinicia con *Ejecutar* y no se detiene con *Detener*. Si el juego necesita un tiempo, reinicialo al principio del guion.
- **No se pueden importar sonidos ni grabar con el micrófono**: el catálogo es cerrado (8 sonidos y 3 melodías sintetizadas) y no hay editor de audio. Agregar sonidos propios implicaría archivos o grabación, con su costo en el peso del proyecto y en la caché de la PWA.
- **El audio necesita un toque**: los navegadores móviles no dejan sonar nada hasta que la persona interactúa con la página. ScrachMo reanuda el contexto de audio cada vez que va a sonar algo, así que un guion lanzado con *Ejecutar* suena siempre (ese toque ya cuenta); lo que puede quedar en silencio es una música que arranque sola al abrir un link `?p=`, sin haber tocado nada todavía.
- Las cuentas de los bloques **ya no aceptan JavaScript arbitrario**: sólo números, `+ - * / % **`, paréntesis, `score`, variables y `aleatorio(a,b)`. Fue el precio de sacar `Function()`; a cambio la app funciona con CSP estricto.
- No hay editor de disfraces: las imágenes se importan tal cual (reducidas a 256 px), pero no se pueden dibujar, recortar, renombrar ni reordenar desde la app. Un GIF animado se queda con su primer fotograma.
- Las casillas aceptan números fijos o un reportero (`ƒ`); el texto libre de una casilla de movimiento no resuelve variables ni cuentas. En `ir a x: y:` los valores fuera del escenario se recortan al borde. Si querés volver a la posición previa a una corrida, usá **Volver al inicio**.
- Los reporteros son numéricos: `{x} > {y}` devuelve `1` o `0` (alcanza para `si`, pero no hay booleanos ni textos de primera clase) y una variable con texto cuenta como `0` dentro de una cuenta. La anidación se corta a los 12 niveles al ejecutar y a los 10 al dibujar, para que un proyecto manipulado no cuelgue la app.
- Los links `?p=` siguen llevando todo el proyecto adentro de la URL. Con muchos disfraces grandes pueden volverse demasiado largos para WhatsApp o para el navegador; en ese caso conviene exportar el `.scmo`. Publicarlo en un hosting estático no cambia esto: haría falta un backend con almacenamiento para tener links cortos.
- **La instalación y el modo offline necesitan `https` o `localhost`**: son requisitos del navegador para los service workers, no una decisión de la app. Abierta con doble clic (`file://`) ScrachMo funciona igual, pero sin ícono instalable ni caché.
- La caché de la PWA se invalida a mano: `sw.js` lleva una `VERSION` (`scrachmo-v2`) y, al cambiarla, `activate` borra la anterior. **Hay que subirla en cada release que toque `index.html`, `data.js` o `engine.js`**: el service worker sirve esos archivos desde la caché sin revalidar, y si el archivo `sw.js` no cambia el navegador ni siquiera reinstala, así que el celular se queda con la copia vieja por tiempo indefinido. La prueba `tests/pwa-sw.js` lee la versión del propio `sw.js`, así no queda clavada en un número.
- Un proyecto abierto desde un link `?p=` o desde un `.scmo` se carga **en el proyecto actual**, así que reemplaza lo que había ahí. Si querés conservarlo, creá uno nuevo antes de abrirlo.
- El nombre del proyecto vive en la biblioteca del dispositivo: no viaja dentro del `.scmo` ni del link `?p=`. Tampoco hay carpetas ni orden manual: la lista se ordena por último cambio.
- El "multijugador" usa `localStorage`: los mensajes llegan a los sprites del mismo navegador (y a otras pestañas del mismo origen), pero no a otros dispositivos. Para eso haría falta un servicio externo.
- Hay zoom del área de bloques y del escenario, y layout de dos columnas desde 900 px, pero la disposición ancha no se puede forzar a mano en un celular: sale sola según el ancho de la pantalla.

## Licencia

[MIT](LICENSE). Usalo, rompelo y mejoralo libremente.
