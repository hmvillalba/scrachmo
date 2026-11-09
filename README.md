# ScrachMo

> Programa con bloques estilo Scratch, directo desde el celular.

**ScrachMo** es un entorno de programación visual inspirado en [Scratch](https://scratch.mit.edu), rediseñado desde cero para pantallas verticales: los paneles se apilan uno abajo del otro, los bloques son grandes y pensados para el pulgar, y todo corre en el navegador sin instalar nada.

Sin frameworks, sin dependencias, sin build: tres archivos que andan en cualquier navegador moderno, en la compu o en el teléfono.

## Características

### Bloques como en Scratch

- 40 bloques en 9 categorías con los colores clásicos de Scratch: movimiento, apariencia, sonido, eventos, control, sensores, operadores, variables y multijugador.
- Bloques sombrero (bandera verde, toque, tecla, agitar el celu, recibir mensaje, puntaje) y bloques C: `repetir`, `por siempre` y condicionales con `si... si no`.
- Anidado real: arrastrá bloques adentro de un bloque C para envolverlos, con guardas que evitan anidar un bloque dentro de sí mismo.
- **Varios guiones por sprite**: cada sombrero inicia un guion independiente y sólo se ejecutan los que corresponden al evento ocurrido. Un mismo sprite puede reaccionar a la bandera, a una tecla y a un toque a la vez.
- Muescas tipo puzzle en la parte superior de los bloques y resaltado visible del bloque en ejecución.
- **`ir a x: {x} y: {y}`**: dos casillas numéricas en un mismo bloque para teletransportar el personaje a una coordenada exacta (x de -240 a 240, e y de -180 a 180). Es la forma de fijar la posición de partida de un guion aunque el estado final de la corrida anterior haya quedado guardado como estado de diseño.
- **Reporteros: 10 bloques que devuelven un valor**. Las casillas de movimiento, apariencia, control, operadores, variables y puntaje tienen un botón **ƒ** para poner un valor calculado en vez de un número fijo: `puntos`, `posición x`, `posición y`, `variable {v}`, `al azar {x} a {y}`, `{x} + {y}`, `{x} − {y}`, `{x} × {y}`, `{x} ÷ {y}` y `{x} > {y}`. Se pueden **anidar** —`mover ((posición x) + 10)`, `si (puntos > 10) entonces`, `repetir (al azar 2 a 5)`— y la **×** del chip vuelve al texto libre sin perder lo que habías escrito. No son enunciados: no aparecen en la paleta ni se agregan sueltos, viven dentro de la casilla de otro bloque.

### Editor cómodo en pantalla chica

- **Arrastrá desde la paleta**: tocá un bloque para agregarlo al final, o arrastralo desde su empuñadura y soltalo exactamente donde querés (en la pila principal o dentro de un `repetir` / `si... si no`). En táctil se agarra por la empuñadura para no bloquear el scroll; con mouse, desde cualquier parte del bloque. El tap y el teclado siguen funcionando igual.
- **Duplicar**: cada bloque tiene un botón que lo copia junto con todo su subárbol, regenerando los ids para no romper el arrastre ni el resaltado.
- **Deshacer / Rehacer**: botones y atajos `Ctrl/Cmd+Z`, `Ctrl/Cmd+Shift+Z` y `Ctrl/Cmd+Y`. El historial guarda hasta 60 instantáneas y no interfiere con el deshacer de texto dentro de un input.
- **Dos zooms independientes**: el del **área de código** (70 % a 160 % con `− / +`, tocando el porcentaje volvés a 100 %) y el del **escenario y los personajes** (misma escala, en la fila que está debajo del escenario). El primero agranda los bloques; el segundo agranda la escena, los sprites y los globos. Los dos se recuerdan entre sesiones, no viajan en el proyecto y la línea de inserción se corrige sola al arrastrar con zoom.
- Layout mobile-first: paneles verticales apilables y colapsables, con respeto de los *safe areas* en pantallas con notch.
- Interacción 100% táctil (pointer events): tocá para agregar, arrastrá por el ícono para reordenar o anidar. También hay reordenado por teclado.

### Escenario y sprites

- Múltiples sprites, cada uno con su propio programa: crear, eliminar y alternar entre ellos.
- **Catálogo de 143 personajes** organizado en 8 grupos (animales, espacio, vehículos, juegos y deportes, comida, naturaleza, fantasía y objetos), con buscador que ignora tildes y mayúsculas y acepta palabras en español, inglés, portugués y francés.
- Movimiento, dirección, tamaño, rotación, visibilidad y burbujas de diálogo. Los globos se leen en horizontal, con ancho según el texto y envoltura cuando el mensaje es largo.
- **Zoom del escenario**: con `− / 130 % / +` cambiás el alto de la escena y el tamaño de personajes, globos y aro de selección. Las posiciones siguen siendo porcentuales, así que arrastrar un sprite y los bloques de movimiento no se descalibran. También se aplica en modo juego.
- **Fondo propio del escenario**: subí tu propia imagen (PNG, JPG, WebP, GIF o BMP) desde el ícono de la tarjeta *Escenario*. Se redibuja a 1280 px como máximo, se comprime a WebP/PNG y se muestra con `cover`. El botón **Quitar mi fondo** vuelve a los 6 gradientes; usar `cambiar fondo` también sale del fondo propio. Viaja en el guardado y en los links compartidos, y se rechazan SVG y URLs externas por seguridad.
- Variables con pasos configurables (+ / −) y opción de mostrarlas en el escenario.

### Disfraces e imágenes propias

- **Importá tus propias imágenes** (PNG, JPG, WebP, GIF o BMP) desde el botón *Importar mis imágenes…* del catálogo, o desde *Agregar disfraces* en las propiedades de un personaje. Podés elegir varias a la vez y también crear un personaje nuevo hecho enteramente de tus dibujos o fotos.
- **Hasta 12 disfraces por personaje**, con una tira de miniaturas para verlos, elegir el activo y borrar los que no quieras (siempre queda al menos uno).
- Cada imagen se **redibuja en un canvas**, se achica a 256 px como máximo y se re-codifica a WebP (o PNG si el navegador no soporta WebP). Nunca se guarda el archivo original. Se rechazan SVG y URLs externas por seguridad, y hay tope de peso por imagen.
- Los dos bloques nuevos de **Apariencia** permiten animar como en Scratch: `siguiente disfraz` y `cambiar disfraz a {v}` (un selector con los nombres de tus disfraces). Combinados con `repetir`, `mover` y `esperar` simulan caminata, aleteo, giros, etc.
- El bloque `cambiar disfraz a` guarda el **nombre**, no la posición: borrar o reordenar disfraces no repunta el bloque a otro. Los proyectos viejos con valores numéricos se siguen leyendo.
- Los emojis del catálogo siguen funcionando como un disfraz más: los proyectos guardados antes de esta versión se migran automáticamente.

### Ejecución

- Ejecutar / Detener, con resaltado del bloque que corre en cada momento. Varios guiones pueden correr en paralelo sin perder el resaltado ni mezclar sus condiciones.
- Eventos: bandera verde, toque en el escenario, teclado, agitar el dispositivo, puntaje y mensajes. El sombrero de puntaje se dispara una sola vez por umbral, no se reengancha en bucle.
- **Los personajes se quedan donde terminaron**: al detener o al terminar los guiones ya no vuelven a cero. La posición, el disfraz, el tamaño, la visibilidad y el fondo que dejó el programa pasan a ser el estado de diseño: se guardan y son el punto de partida de la próxima ejecución. Si querés deshacer ese recorrido, tocá **Volver al inicio** (aparece debajo del escenario tras la primera corrida) y se restaura la instantánea tomada al arrancar. Durante la ejecución no se autoguardan cambios; el puntaje sí se conserva entre ejecuciones.
- Bucles con tope de seguridad: un `repetir` o `por siempre` descontrolado no cuelga el navegador.
- En iOS 13+ se pide el permiso de movimiento desde el primer toque, como exige el sistema.

### Proyectos

- Guardado automático en el dispositivo (localStorage), incluyendo puntaje, estado de la opción multijugador, todos los disfraces y el fondo propio. Las preferencias de la interfaz (paneles colapsados, zoom de bloques y zoom del escenario) se guardan aparte en `scrachmo_ui`, aceptando el formato viejo. Si se llena el espacio del dispositivo, la app avisa en vez de fallar en silencio.
- **Compartir**: genera un link con el proyecto adentro (`?p=...`) para mandar a amigos; al abrirlo, el proyecto se carga solo. El JSON se **comprime con gzip** (`g1.`) y se codifica en base64url, así que los disfraces viajan en un link bastante más corto. Si el navegador no tiene `CompressionStream`, cae a JSON sin comprimir (`j1.`), y los links viejos en base64 plano se siguen abriendo igual.
- Si el link supera los 8000 caracteres, la app avisa que algunos chats pueden cortarlo y conviene usar menos imágenes o exportar el `.scmo`.
- Interfaz en español, inglés, portugués y francés.

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
| `data.js` | Catálogo de bloques (40 enunciados + 10 reporteros), categorías y textos de la interfaz (4 idiomas). |
| `tests/` | Suite de pruebas de humo sobre el DOM real, comprobaciones estáticas y el generador de páginas de prueba. |
| `.github/workflows/test.yml` | CI: sintaxis, paridad de textos y suite en Chrome headless en cada push y pull request. |

La app que se abre en el navegador sigue siendo esos tres archivos; `tests/` y el workflow son herramientas de desarrollo y no se cargan al usar ScrachMo.

¿Querés agregar un bloque nuevo? Es una entrada en `data.js` y su lógica en `engine.js`.

## Verificación

Los cambios se validan con pruebas de humo sobre el DOM real en Chrome headless. La suite ahora vive **dentro del repo** (`tests/`) y corre también en CI. **472 comprobaciones, 0 fallos**, repetidas en corridas independientes e idénticas para descartar resultados intermitentes:

| Suite | Comprobaciones | Qué cubre |
| --- | ---: | --- |
| Estructura | 30 | Catálogo de 143 personajes, 40 bloques y badge, textos en 4 idiomas, IDs del DOM, muescas, resaltado y conservación de la posición final. |
| Motor y eventos | 25 | Buscador, guiones por sombrero, despacho de teclado/toque/bandera, aislamiento de hilos, no guardar durante la ejecución, persistencia de puntaje y multijugador, sombrero de puntaje sin re-disparos. |
| Disfraces y links | 52 | Migración de proyectos viejos, rechazo de SVG/URLs, tira de miniaturas, selector por nombre, serialización, ejecución de los dos bloques nuevos, estado final del disfraz y «Volver al inicio», gzip/base64url, links viejos y fallback. |
| Importación real | 27 | `File` → canvas → WebP, filtro de tipos, nombres únicos, nuevo personaje desde imágenes, borrado, límite de 12, aviso de espacio lleno. |
| Editor y herramientas | 74 | Zoom de bloques, deshacer/rehacer y atajos, duplicar subárboles, arrastrar desde la paleta, fondo propio e importación real de fondo. |
| Escenario, globo y posición final | 52 | Zoom del escenario (alto, personaje, topes, persistencia, independencia y modo juego), globo horizontal y envoltura de texto largo, corrida natural y `Detener` conservando la posición, guardado del estado final, botón «Volver al inicio», siguiente corrida partiendo del estado final. |
| Bloque `ir a x: y:` | 64 | Catálogo y 4 idiomas, dos casillas en la paleta y en el editor, edición conjunta del par `"x,y"`, serialización y link compartido, `normalizeNodes` / clonar / duplicar / deshacer / rehacer, ejecución exacta con decimales, recorte al borde, campos vacíos y valores inválidos, y un guion real de principio a fin. |
| Parser, diálogos y topes | 65 | Aritmética sin `eval` (precedencia, paréntesis, potencia, decimales, errores de sintaxis), `evalExpr()` con `score`, variables y `aleatorio()`, condiciones, modal propio en modo confirmación y texto con traducciones en 4 idiomas, cancelación por `Escape`, flujos reales de borrado sin diálogos nativos, y recorte de proyectos con 40 niveles / 2000 nodos / 8 MB. |
| Reporteros | 71 | Catálogo de 10 y 4 idiomas, `node.reps` sin cambiar `node.val`, rechazo de reporteros sueltos o dentro de sombreros, tope de una casilla por hueco, anidado, serialización, clonado y deshacer, evaluación de los 10, ejecución real de `mover`, `ir a x: y:`, `repetir`, `si` y `decir`, y el selector `ƒ` con chip, borrado, texto conservado y casilla de nombre sin anidado. |
| Link al arrancar | 12 | Una página abierta con `?p=g1.…` carga proyecto, disfraces, puntaje, fondo y el bloque `ir a x: y:` con sus dos casillas, y renderiza la imagen en el escenario. |

Para correrlo en tu máquina:

```bash
node --check data.js && node --check engine.js
node tests/check-parity.js       # paridad de textos + comprobaciones estáticas
node tests/run.js mi-corrida    # 10 escenarios en Chrome headless
```

`tests/build.js` arma las páginas de prueba y el link compartido; `tests/run.js` lanza Chrome con un perfil aislado por suite y cuenta `PASS` / `FAIL` / `ERROR`. En GitHub Actions, `.github/workflows/test.yml` repite lo mismo en cada push y pull request.

Además: los 4 idiomas tienen las mismas 153 claves de texto (51 de `UI_EXTRA`) y los 40 bloques activos más 10 reporteros; los 60 `data-t` y 11 `data-tt` del HTML tienen traducción en los 4 idiomas; las comprobaciones estáticas aseguran que el motor no contenga `eval`/`Function()` ni `prompt()`/`confirm()`/`alert()` y que estén `calcExpr()`, `askUser()`, `nodeVal()`, `evalReporter()`, el selector `bindRepPicker()` y el tope `MAX_CODE_DEPTH`; no hubo errores no capturados ni rechazos de promesas en ninguna corrida. La burbuja, la barra de zoom, el bloque `ir a x: y:` (dos casillas, en el editor y en la paleta), el diálogo propio y la casilla con reportero también se revisaron en capturas reales a 500 px de ancho.

Nota de entorno: Microsoft Edge no sirvió para esto (su binario GUI no devuelve DOM ni capturas por línea de comando); se usó Chrome con `--headless=new --dump-dom`. En el decodificador de imágenes de Chrome headless se detectó un cuelgue intermitente de `createImageBitmap`, por lo que el motor ahora cae a `<img>` si tarda más de 3 segundos.

## Limitaciones conocidas

Mejor honesto que vendedor:

- **Exportación a Scratch (`.sb3`) — pendiente, no implementada**: los formatos de ScrachMo (`.scmo` y `?p=`) son JSON propio y no se abren en Scratch 3. Exportar de verdad no es un «guardar como»: hay que generar un ZIP con `project.json`, nombrar los recursos por su MD5, convertir emojis e imágenes a disfraces `svg`/`bitmap` y mapear los 40 bloques a opcodes de Scratch (varios, como los de multijugador, el puntaje o el agitado del celu, no tienen equivalente). Queda anotado en la lista de pendientes, con ese costo a la vista.
- Las cuentas de los bloques **ya no aceptan JavaScript arbitrario**: sólo números, `+ - * / % **`, paréntesis, `score`, variables y `aleatorio(a,b)`. Fue el precio de sacar `Function()`; a cambio la app funciona con CSP estricto.
- No hay editor de disfraces: las imágenes se importan tal cual (reducidas a 256 px), pero no se pueden dibujar, recortar, renombrar ni reordenar desde la app. Un GIF animado se queda con su primer fotograma.
- Las casillas aceptan números fijos o un reportero (`ƒ`); el texto libre de una casilla de movimiento no resuelve variables ni cuentas. En `ir a x: y:` los valores fuera del escenario se recortan al borde. Si querés volver a la posición previa a una corrida, usá **Volver al inicio**.
- Los reporteros son numéricos: `{x} > {y}` devuelve `1` o `0` (alcanza para `si`, pero no hay booleanos ni textos de primera clase) y una variable con texto cuenta como `0` dentro de una cuenta. La anidación se corta a los 12 niveles al ejecutar y a los 10 al dibujar, para que un proyecto manipulado no cuelgue la app.
- Los links `?p=` siguen llevando todo el proyecto adentro de la URL. Con muchos disfraces grandes pueden volverse demasiado largos para WhatsApp o para el navegador; en ese caso conviene exportar el `.scmo`. Publicarlo en un hosting estático no cambia esto: haría falta un backend con almacenamiento para tener links cortos.
- Un solo proyecto por dispositivo: el autoguardado pisa siempre el mismo slot; no hay lista de proyectos con nombre.
- El "multijugador" usa `localStorage`: los mensajes llegan a los sprites del mismo navegador (y a otras pestañas del mismo origen), pero no a otros dispositivos. Para eso haría falta un servicio externo.
- Hay zoom del área de bloques y del escenario, pero todavía no hay layout específico para pantalla horizontal.

## Licencia

[MIT](LICENSE). Usalo, rompelo y mejoralo libremente.
