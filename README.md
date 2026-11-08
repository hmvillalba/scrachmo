# ScrachMo

> Programa con bloques estilo Scratch, directo desde el celular.

**ScrachMo** es un entorno de programación visual inspirado en [Scratch](https://scratch.mit.edu), rediseñado desde cero para pantallas verticales: los paneles se apilan uno abajo del otro, los bloques son grandes y pensados para el pulgar, y todo corre en el navegador sin instalar nada.

Sin frameworks, sin dependencias, sin build: tres archivos que andan en cualquier navegador moderno, en la compu o en el teléfono.

## Características

### Bloques como en Scratch

- 37 bloques en 9 categorías con los colores clásicos de Scratch: movimiento, apariencia, sonido, eventos, control, sensores, operadores, variables y multijugador.
- Bloques sombrero (bandera verde, toque, tecla, agitar el celu, recibir mensaje, puntaje) y bloques C: `repetir`, `por siempre` y condicionales con `si... si no`.
- Anidado real: arrastrá bloques adentro de un bloque C para envolverlos, con guardas que evitan anidar un bloque dentro de sí mismo.

### Pensado para el pulgar

- Layout mobile-first: paneles verticales apilables y colapsables, con respeto de los *safe areas* en pantallas con notch.
- Interacción 100% táctil (pointer events): tocá para agregar, arrastrá por el ícono para reordenar o anidar. También hay reordenado por teclado.

### Escenario y sprites

- Múltiples sprites, cada uno con su propio programa: crear, eliminar y alternar entre ellos.
- Movimiento, dirección, tamaño, rotación, visibilidad y burbujas de diálogo.
- Variables con pasos configurables (+ / −) y opción de mostrarlas en el escenario.

### Ejecución

- Ejecutar / Detener, con resaltado del bloque que corre en cada momento.
- Eventos: bandera verde, toque en el escenario, teclado, agitar el dispositivo, puntaje y mensajes.
- Bucles con tope de seguridad: un `repetir` o `por siempre` descontrolado no cuelga el navegador.

### Proyectos

- Guardado automático en el dispositivo (localStorage).
- **Compartir**: genera un link con el proyecto adentro (`?p=...`) para mandar a amigos; al abrirlo, el proyecto se carga solo.
- Interfaz en español, inglés, portugués y francés.

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

1. Elegí un sprite y tocá bloques de la paleta: se agregan al final de su programa.
2. Arrastrá cada bloque por su ícono para reordenarlo dentro de la pila o anidarlo dentro de un bloque C.
3. Tocá **Ejecutar** y mirá el escenario. **Detener** corta todo.

## Estructura del proyecto

| Archivo | Qué contiene |
| --- | --- |
| `index.html` | Toda la interfaz: layout, estilos, íconos SVG y paneles. |
| `engine.js` | El motor: render de bloques, drag & drop táctil, ejecución, sprites, variables y eventos. |
| `data.js` | Catálogo de bloques, categorías y textos de la interfaz (4 idiomas). |

¿Querés agregar un bloque nuevo? Es una entrada en `data.js` y su lógica en `engine.js`.

## Limitaciones conocidas

Mejor honesto que vendedor:

- La paleta agrega bloques por toque; todavía no se pueden arrastrar bloques desde la paleta al área de scripts.
- No hay duplicar bloque: para otro igual, tocá de nuevo el bloque en la paleta.
- Los bloques son rectángulos redondeados con sangría; las muescas tipo pieza de puzzle del Scratch original están en el radar.
- El "multijugador" usa `localStorage`: los mensajes viajan entre sprites del mismo navegador, no entre dispositivos.

## Licencia

[MIT](LICENSE). Usalo, rompelo y mejoralo libremente.
