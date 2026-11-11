# ScrachMo

**English** · [Español](README.md) · [Português](README.pt.md) · [Français](README.fr.md)

> Program with Scratch-style blocks, straight from your phone.

**ScrachMo** is a visual programming environment inspired by [Scratch](https://scratch.mit.edu), redesigned from scratch for vertical screens: panels stack one below the other, blocks are large and made for a thumb, and everything runs in the browser with nothing to install.

No frameworks, no dependencies, no build step: static files that work in any modern browser, on a computer or on a phone.

**Published version**: [https://scrachmo.vercel.app](https://scrachmo.vercel.app), served by Vercel over HTTPS. The root is the **landing page** (a presentation of the project in 4 languages) and the editor lives at **[https://scrachmo.vercel.app/app.html](https://scrachmo.vercel.app/app.html)**, which is the direct, shareable link to get in without going through the presentation. The installed PWA also starts in the editor. The repo is ready for that deployment: `vercel.json` and the rest of the static files are published as they are, with no compilation.

## Features

### Blocks like Scratch

- 53 blocks in 9 categories with Scratch's classic colours: motion, looks, sound, events, control, sensing, operators, variables and **local messages**.
- Hat blocks (green flag, tap, key, shake the phone, receive message, score) and C blocks: `Repeat {v} times`, `Forever` and conditionals with `if... else`.
- Real nesting: drop a block **on top of** a `Repeat`, `Forever` or `if` and it goes inside —also onto the "else" bar—, or aim at the slot if you prefer. With guards that stop you nesting a block inside itself or putting a hat block inside.
- **Several scripts per sprite**: each hat starts an independent script and only the ones that match the event that happened run. A single sprite can react to the flag, a key and a tap at the same time.
- Puzzle notches on the top of the blocks and visible highlighting of the block that is running.
- **`Go to x: {x} y: {y}`**: two numeric slots in one block to teleport the sprite to an exact coordinate. The world is 480 × 360 units out of the box, but the centre stays **85 units away from the edge** so the drawing is never cropped: with the factory size and rotation, x runs from -155 to 155 and y from -95 to 95. Those limits are recomputed from the sprite's size and the stage size, and the slots show them. It is the way to fix a script's starting position even when the final state of the previous run was saved as the design state.
- **Reporters: 11 blocks that return a value**. The slots for motion, looks, control, operators, variables and score have a **ƒ** button to put a calculated value instead of a fixed number: `score`, `x position`, `y position`, `variable {v}`, `timer`, `pick random {x} to {y}`, `{x} + {y}`, `{x} − {y}`, `{x} × {y}`, `{x} ÷ {y}` and `{x} > {y}`. They can be **nested** —`Move ((x position) + 10)`, `if (score > 10) then`, `Repeat (pick random 2 to 5)`— and the chip's **×** takes you back to free text without losing what you had written. They are not statements: they do not appear in the palette and cannot be added on their own, they live inside another block's slot.

### A comfortable editor on a small screen

- **Drag from the palette**: tap a block to add it at the end, or drag it from its grip and drop it exactly where you want it (in the main stack or inside a `Repeat` / `if... else`). On touch you grab it by the grip so scrolling is not blocked; with a mouse, from anywhere on the block. Tap and keyboard still work the same.
- **Duplicate**: every block has a button that copies it together with its whole subtree, regenerating the ids so dragging and highlighting do not break.
- **Undo / Redo**: buttons and the shortcuts `Ctrl/Cmd+Z`, `Ctrl/Cmd+Shift+Z` and `Ctrl/Cmd+Y`. The history keeps up to 60 snapshots and does not interfere with text undo inside an input.
- **Two independent zooms, and both enlarge the content rather than the window**: the **code area** zoom (70 % to 160 % with `− / +`, tapping the percentage takes you back to 100 %) scales the blocks inside a panel whose height you choose by dragging the handle at the bottom (or with the arrow keys, with the handle focused); the **stage** zoom (same scale, in the bottom row) moves the camera closer, so sprites, background and speech bubbles grow while the stage window always measures the same. Both are remembered between sessions, neither travels inside the project, and the insertion line corrects itself when you drag with zoom applied.
- Mobile-first layout: vertical panels that stack and collapse, respecting the *safe areas* on screens with a notch.
- **On a wide screen (from 900 px) it switches to two columns**: the stage and the sprites on the left, the code with the block palette on the right, and variables and project below. On a phone it still stacks the same way, in the usual order (Stage → Sprites → Code → Variables → Project → Blocks): the columns "dissolve" with `display:contents` and `order` decides the sequence. Game mode stays out of it: there you see only the field, with the game's aspect ratio and not the screen's. On a phone lying down, margins and stage shrink so more fits.
- 100% touch interaction (pointer events): tap to add, drag by the icon to reorder or nest. There is also keyboard reordering.

### Stage and sprites

- Multiple sprites, each with its own program: create, delete and switch between them.
- **Catalog of 321 characters** organised in 16 groups (animals, space, vehicles, middle ages, horror, games and sports, arrows and signs, shapes and colours, fruits, vegetables, food, nature, fantasy, objects, tools and music), with a search that ignores accents and case and accepts words in Spanish, English, Portuguese and French. Only emoji that every system draws get in: no empty squares.
- Motion, direction, size, rotation, visibility and speech bubbles. Direction accepts **full turns**: type 270 or 359 and the sprite really turns (the value is stored as −90 or −1, which is the same angle). Bubbles are read horizontally, with the width following the text and wrapping when the message is long.
- **The bubble can be enlarged or shrunk from the block itself**: *Say* carries a `%` field (50 to 250) next to the message. The size is stored in `node.zoom`, not inside the text, so a message with commas stays whole and old projects, with no such field, show at 100 %. The zoom scales the whole bubble —font, maximum width, padding and corners— and also in game mode.
- **Stage zoom**: with `− / 130 % / +` the camera moves closer or further away: sprites, background and bubbles grow, but **the stage window always measures the same** (before, zoom stretched the scene and the whole page jumped in size). Positions are still percentages of the world, so dragging a sprite and the motion blocks do not fall out of calibration, and the drag divides by the zoom so the sprite follows your fingertip. It also applies in game mode.
- **A stage as big as you need**: the world measures 480 × 360 units out of the box, but it grows by dragging the handles on the edge —the bottom one changes the height, the right one the width and the corner both, up to 1440 × 1080—. It grows **to the right and downwards**, so whatever was already placed does not move a single pixel and the new space stays free for more sprites or a longer field. Edges, bounces, collisions and the clamping of the `x`/`y` slots follow the new size, the size travels inside the project and in the links, and **Back to the original size** (it appears next to the zoom once the stage is no longer the factory one) puts everything back to 480 × 360, cropping whatever was left outside. With a keyboard, the arrow keys on the handle grow it in steps of 60 units.
- **Game mode with the field in 4:3**: the *Run* button leaves only the stage, centred and as large as it fits, with bands in the background colour. The aspect ratio is always the world's —480 × 360 units out of the box, that is 4:3, or the one you chose if you enlarged the stage— and it is never stretched: if it were, 100 steps upwards would look bigger than 100 to the right and what you see would not match the collisions, which are calculated in units. On an upright phone a discreet notice appears at the bottom —"Turn your phone to see it bigger"— which can be closed and does not come back until the next game.
- **The stage can have its own background**: upload your own image (PNG, JPG, WebP, GIF, BMP or SVG) from the *Stage* card's icon. It is redrawn at 1280 px maximum, compressed to WebP/PNG and shown with `cover`. The **Remove my background** button goes back to the 6 gradients; using `switch background` also leaves the custom background. It travels in the save and in shared links, and external URLs are rejected for security.
- Variables with configurable steps (+ / −) and the option to show them on the stage.

### Clones

- **`Create clone of [myself / a sprite]`** makes a live copy of the sprite with its position, direction, size, visibility and costume at that moment. The clone shares the scripts and the variables with its original, but it moves, turns, changes size and costume on its own.
- **`When I start as a clone`** is the hat that runs in each copy right when it is born. A clone does **not** run the green flag or the other hats: if it did, every copy would repeat everything the original does.
- **`Delete this clone`** makes the copy that runs it disappear, and its script is cut at that very block. In the original sprite it does nothing, as in Scratch.
- **`If touching [a sprite]`** is the targeted version of `If touching another sprite`: it is only true with that sprite **or with any of its clones**, so it is useful for a shot to know whether it hit a rock and not something else. With "myself" it behaves like `If touching another sprite`.
- **`Delete the clone of [a sprite] that I'm touching`** makes exactly the copy that the running sprite is touching disappear, not all of them: a shot destroys what it hits and disappears, without clearing the screen. If it is touching the original it does nothing, because an original is not deleted.
- Clones **collide** with each other and with the originals, and they speak with their own bubble.
- **They are not saved**: they exist only while the run lasts. Stop deletes them all; letting the script finish leaves them on screen, as the final state. The cap is **300 clones**, the same as Scratch, so the phone cannot be hung.
- They are exported to `.sb3` with their three native blocks, so a clone game works the same in Scratch.

### Costumes and your own images

- **Import your own images** (PNG, JPG, WebP, GIF, BMP or SVG) from the *Import my images…* button in the catalog, or from *Add costumes* in a sprite's properties. You can pick several at once and also create a new sprite made entirely of your own drawings or photos.
- **Up to 12 costumes per sprite**, with a strip of thumbnails to see them, pick the active one and delete the ones you do not want (there is always at least one left).
- Each image is **redrawn on a canvas**, fitted to 256 px maximum and re-encoded to WebP (or PNG if the browser does not support WebP). The original file is never stored: **an SVG is accepted, but it is turned into a bitmap when imported**, so a `data:image/svg+xml` never ends up in the project or in the links (an SVG can carry a script inside). Because it is vector, an SVG does grow up to 256 px instead of staying at the size you drew it, and its aspect ratio comes from `width`/`height` or, failing that, from the `viewBox`. External URLs and `.svgz` files are rejected (they come compressed and the browser will not open them as an image), and there is a weight cap per image.
- The two new **Looks** blocks let you animate as in Scratch: `Next costume` and `Switch costume to {v}` (a selector with the names of your costumes). Combined with `Repeat`, `Move` and `Wait` they simulate walking, flapping, turning, and so on.
- The `Switch costume to` block stores the **name**, not the position: deleting or reordering costumes does not point the block at another one. Old projects with numeric values are still read.
- The catalog's emoji keep working as one more costume: projects saved before this version are migrated automatically.

### Sounds and music

- **7 sound blocks**: the usual two (`Meow` and `Pop`) plus **`Play sound {v}`** with 8 sounds to choose from, **`Play music {v}`** with 3 looping melodies, **`Stop all sounds`**, **`Set volume to {v} %`** and **`Change volume by {v}`**.
- **There are no audio files**: everything is synthesised with WebAudio at playback time (oscillators with envelopes and filtered noise for hits and explosions). That way the app still opens with a double click (`file://`), the PWA has nothing extra to cache and there are no copyright issues.
- The sounds are **beep, meow, pop, coin, jump, explosion, applause and bell**; the melodies, **happy, sad and game**. The block stores the sound's **id**, not its name: changing language does not break the projects.
- **The volume belongs to the project** (0 to 100, starts at 100) and is saved with it, so a game can ship with the music turned down. It is applied on a master node, so a `Set volume` is heard instantly even in a melody that is already playing.
- Music **loops until you stop it** or play another one. `Stop all sounds` cuts everything that is playing, music included, and **Stop cuts it too**: otherwise it would play forever because nobody else would turn it off.
- `Play sound` **does not wait for the sound to finish** (as in Scratch): to chain them, put a `Wait` below.

### Running

- Run / Stop, with the running block highlighted at every moment. Several scripts can run in parallel without losing the highlight or mixing up their conditions.
- **The flag starts the whole project, not just the sprite being edited**: the selected sprite having no blocks gets in the way of nothing, because scripts are walked in every sprite. What does matter is the **hat**: a script only starts with *Run* if it begins with **On start** (or if the blocks are loose, which count as the flag). If the project has blocks but none hangs from that hat —for example, everything is under "When a key is pressed"— the app says so with a notice instead of staying silent.
- Events: green flag, tap on the stage, **When {v} pressed** (a dropdown with space, Enter, the four arrows, the 26 letters and the 10 digits), shake the device, score and messages. The score hat fires once per threshold, it does not re-trigger in a loop.
- **Sprites stay where they ended**: on stopping or finishing the scripts they no longer go back to zero. The position, costume, size, visibility and background the program left become the design state: they are saved and are the starting point of the next run. If you want to undo that journey, tap **Back to start** (it appears below the stage after the first run) and the snapshot taken at launch is restored. Nothing is auto-saved during a run; the score is kept between runs.
- Loops with a safety cap: a runaway `Repeat` or `Forever` does not hang the browser.
- On iOS 13+ the motion permission is requested on the first tap, as the system requires.

### Playing on a phone: on-screen gamepad

- **The problem**: *When a key is pressed* fires on a real `keydown`. A phone has no keyboard, so an arrow-key game was **unplayable** however well the project was built. Tapping the screen did work (*On tap*), but it does not replace the arrows.
- **The solution**: in **game mode** a **touch gamepad** appears over the stage. It triggers **the same scripts** as the physical key, so the project does not change and keeps working the same with a keyboard.
- **It only shows what the project uses**: the *When pressed* hats of every sprite are read. If there are arrows, the D-pad appears; if there are also space or letters, they appear as round buttons on the right (space is called *Action*). If the project uses no keys, nothing appears.
- **The arrows that are not used stay invisible but in their cell**, so the D-pad does not fall apart when the game only has left and right.
- **Holding repeats** every 110 ms, like the keyboard's auto-repeat: the sprite walks continuously instead of taking one step per tap. Releasing stops it.
- **It does not fire "on tap" on the way**: the gamepad's touch stops there, so a game with both does not do both at once.
- In the editor, if the project uses keys and the device has no keyboard (coarse pointer), the stage hint says you play from **Run**.
- It is a `role="group"` with a translated label and every button has its `aria-label`; it can be used with a keyboard and it respects the *notch* (`env(safe-area-inset-bottom)`).

### Tilting the phone instead of reaching for the arrow

The gamepad solves the thumb, but to move a sprite in four directions **tilting the device** is more comfortable than hitting a button. The accelerometer works as an **event detector**: tilting fires the same key as the keyboard and the gamepad, so no project changes.

- **It is optional and it can be turned off**: in game mode a **Tilt** pill appears above the gamepad, off by default. It is remembered between sessions (`scrachmo_tilt`) and with the mode off the sensor fires nothing. It is only offered if the project uses arrows and if the device has a sensor: on a computer it does not appear.
- **Zero is the starting posture, not the phone upright**: nobody plays with the device vertical. The first reading after turning the mode on (and at the start of every game) is taken as the reference, so the game starts still however you are holding it.
- **Dead zone with memory**: to turn an axis on you have to go past 13° from that reference, and to turn it off, drop below 7.5°. Without that band, your pulse would turn the key on and off without stopping.
- **The sensor does not rotate with the screen**: the accelerometer's coordinates belong to the device, so the "right" axis is rotated by hand according to `screen.orientation.angle` (0°, 90°, 180°, 270°). Without that, in landscape the arrows come out crossed.
- **It only fires keys the project uses** and **repeats while the tilt is held**, like the gamepad. While it does, the matching D-pad arrow lights up: that is how you see whether the sensor is reading.
- **Right/left** is tilting the right or the left edge down; **up/down** is moving the screen away or closer. When the game is stopped or you leave game mode, the sensor is cut (`stopTiltRepeat()`), because otherwise the sprite would keep walking on its own.
- On iPhone the motion permission is requested **inside a real gesture**: tapping the pill counts as one, and if it is denied, the notice says so.

### Local messages (formerly "Multiplayer")

- The old name **lied**: the category was called "Multiplayer" and the blocks talked about "other players on the local network". It is now called **Messages** and says what it does.
- `Send message` writes a mark in `localStorage`; `On message` listens for the `storage` event. **There is no network, no server, no other devices**: it reaches the scripts of the same project and other tabs of the same browser and the same origin. The *Messages* button in the tools turns only the reception from other tabs on or off; the notice inside the project always arrives (the `storage` event does not fire in the tab that writes).
- Playing between two phones would need a backend with WebSockets or a real-time service. ScrachMo has no backend by design: that is what lets it open with a double click and be published as a static site on Vercel.

### Sensing and collisions

- **`Bounce if on edge`**: if the sprite is touching an edge, it turns around and keeps going. The direction is corrected according to the side: against a vertical wall the horizontal component is inverted (`direction → −direction`) and against the floor or the ceiling the vertical one (`direction → 180 − direction`), so the sprite leaves at the mirrored angle and does not get stuck to the edge.
- **`If on the edge`** and **`If touching another sprite`**: conditions to wrap whatever you want, with the same `if` / `else` as always. Both run the content they wrap. The second one ignores hidden sprites and itself, so an invisible costume neither blocks nor triggers collisions.
- **`Reset timer`** and the **`timer`** reporter: it returns the seconds (with one decimal) since you opened the project or since the last reset. It is useful for "survive 30 seconds", countdowns with `if (timer > 10) then` and measuring times inside a game.
- Collisions **between sprites** use one circle per sprite: each one is approximated by a circle of radius 26 units at 100 % size (the stage measures 480 × 360 out of the box, and if you enlarge it its edges follow). It is not a pixel-perfect collision: with a very long or very thin sprite the contact feels a bit generous or a bit late. **The edge of the stage uses a different radius**: the radius of the *drawing* (85 units out of the box, because a freely rotating emoji needs more room), so the centre never reaches the edge and the sprite is not cut off by `overflow:hidden`. `If on the edge` and `Bounce` use that visual radius, and the `x`/`y` slots follow the same limits. The drawing is shrunk just enough when the box is small or the world is big (`--sprite-cap`), instead of measuring the margin in pixels: measuring it in pixels clipped ordinary coordinates such as `x: 120 y: -75`.
- All of this also runs in **game mode**, and the timer does not reset when you press *Run*: if you want it back at zero, put `Reset timer` at the start of the script.

### Projects

- **Several named projects**: the *Project* card has **My projects**, with the list of everything saved on the device. From there you can **create**, **open**, **rename**, **duplicate** and **delete** (up to 24), and the button always shows the name of the open project. Opening another one no longer overwrites the previous one: each is saved separately and the one that was open is backed up before switching. You cannot delete the last one.
- **Backup of the whole library**: **Export library** downloads a `.json` with the format, the version, the active project and **all** the projects with their full data (the active one is serialised at that moment, it is not taken from an old copy). It is useful to save before clearing the browser or to move your work to another device.
- **Deleting can be undone**: when you confirm a deletion, the project (name, position in the list and its JSON) stays in memory for the session and **Undo delete** appears in the modal. The button hides when there is nothing left to restore.
- Automatic saving on the device (localStorage), including score, the state of the local messages option, all costumes and the custom background. Interface preferences (collapsed panels, block zoom and stage zoom) are saved separately in `scrachmo_ui`, accepting the old format. If the device's storage fills up, the app says so instead of failing silently.
- **Share**: it generates a link with the project inside (`?p=...`) to send to friends; when they open it, the project loads by itself. The JSON is **compressed with gzip** (`g1.`) and encoded in base64url, so costumes travel in a much shorter link. If the browser has no `CompressionStream`, it falls back to uncompressed JSON (`j1.`), and old links in plain base64 still open the same.
- If the link goes over 8000 characters, the app warns that some chats may cut it and that it is better to use fewer images or export the `.scmo`.
- Interface in Spanish, English, Portuguese and French.

### Examples and guide

- **Examples** is in the tools card and opens three sample projects with their blocks already built: **Say hello** (a speech bubble with its own size and walking with the arrows), **Catch the fruit** (clones that fall, a score and a basket that moves without turning around) and **Dodge the comets** (clones, a collision with a specific sprite, points that go up on their own and reset when hit).
- Opening an example **creates a new project**: the one you were building is backed up and stays in the list. The example becomes one more project, so it can be touched, broken and opened again.
- Below the cards there is a **quick guide** in five steps: pick a sprite, build the script, start from a hat, put reporters in with the `ƒ` button and save or share.
- The examples are not copied JSON: they are built with the same constructors the app uses (`makeNode()`/`createSpriteData()`), so if the node format changes the examples follow along on their own. Among other things they teach the `Go to x: (x position) + 18` pattern for walking without turning, that a clone of a hidden sprite **is born hidden** (you have to show it) and that "delete this clone" cuts the thread at the next waiting point.

### Exporting to Scratch (`.sb3`)

- **To Scratch (.sb3)** is in the tools card and downloads a file that **Scratch 3 opens as is** (`File → Load from your computer`). It is not a "save as": ScrachMo builds the ZIP by hand —`project.json` plus one file per costume and per sound, each named after its **MD5**— with its own ZIP writer, its own MD5 and its own CRC32, with no libraries and no connection.
- **Sprites**: each one travels as a sprite with its costume (the emoji is drawn to a 128 px PNG; your own images are rescaled to 480 px), its position, direction, size, rotation style and visibility. The stage background —the gradient or the image you uploaded— goes as the *Stage*'s costume.
- **Scripts**: the full block graph is rebuilt (`next`, `parent`, `SUBSTACK`, `SUBSTACK2`, hats and dropdowns). The project variables are declared on the *Stage* and the message is declared so the send/receive blocks find it.
- **Sounds and melodies**: no files are copied, they are **synthesised to WAV** (22050 Hz, mono, 16-bit) with the same step recipe the engine uses, so they sound the same as here. The noise uses a pseudo-random generator with a fixed seed: two exports of the same project give identical files.
- **What gets translated and what does not**:

| ScrachMo | In Scratch |
| --- | --- |
| `Move`, `Turn`, `Go to x: y:`, `Point in direction`, `Bounce if on edge` | `motion_*` (the bounce uses Scratch's own block) |
| `Say`, `Think`, `Show`, `Hide`, `Size`, `Next costume`, `Switch costume to` | `looks_*` with the names of your costumes |
| `Play sound`, `Stop all sounds`, `volume` | `sound_*` with the generated sounds |
| `On start`, `On tap`, `When key pressed`, `On message` | `event_*` |
| `Wait`, `Repeat`, `Forever`, `if`, `if/else`, `If on the edge`, `If touching` | `control_*` and `sensing_touchingobject` |
| `Create clone of`, `When I start as a clone`, `Delete this clone` | `control_create_clone_of`, `control_start_as_clone`, `control_delete_this_clone` |
| `score` and the variables | global variables of the *Stage* |
| Local messages, shake, tilt, vibrate, create/show variables, friends, loose `else`, `delete the clone I'm touching` | **no equivalent** |

- **What is left out is reported, not lost silently**: at the end the app says how many blocks it could not translate, and each affected sprite carries a **comment attached to its first block** inside Scratch with the list. That way the project opens, runs and shows where it has to be completed by hand.
- **Two differences to keep in mind**: a melody plays **once** in Scratch (not looped, because a loop inside the script would hang it) and the bounce is left with Scratch's native block, which uses the costume's box and not the circle ScrachMo uses. The reverse path (opening an `.sb3` in ScrachMo) is not implemented.

### About and supporting the project

- The **ⓘ** button in the top bar opens **About ScrachMo**: author, MIT license, the link to the official address **scrachmo.vercel.app** and a short description of what the app is. The *Website* row points to Vercel's public URL, not to the previous hosting's domain.
- There are the two support links —**Buy me a coffee** and **Support on Ko-fi**— and the phrase that says it plainly: if you like ScrachMo, a mention or a donation is entirely up to you. None of that conditions the use: the app is MIT and works in full without paying anything.
- **It shows the installed version**: the *Version* row and the footer come from `APP_VERSION` in `data.js`, the same string that names the service worker's cache. It is how you know which copy you are looking at when you report a problem.
- **Everything translated into the four languages**, including that phrase and the support buttons. It closes with *OK*, with `Escape` or by tapping outside the card, and while it is open the page behind it does not move.
- It does not touch the project or the save: it is informational and can be opened at any time without losing anything.

### Installing it on a phone (PWA)

- It can be **installed as an app**: it has a `manifest.webmanifest` with name, icons (192, 512 and a *maskable* one for Android) and theme colour, so Chrome/Android offers "Install app" and on iPhone it is added to the home screen with its own icon. Opened that way it does not show the browser bar and **goes straight to the editor** (`start_url: ./app.html`), not to the landing.
- **It works without internet**: a service worker (`sw.js`) saves both pages and their scripts (`index.html`, `app.html`, `landing.js`, `boot.js`, `data.js`, `engine.js`), the manifest and the icons the first time you open it. After that it starts from the cache and updates itself when there is a connection.
- **Reloading is enough to see the new version**: **navigations** go *network first* and the cache is the fallback (if there is no connection, or if the server takes more than 4 s, the saved copy comes out). It used to be the other way round and a freshly published version was only visible on the second reload —or never, if the previous service worker was still in charge—. The files (`data.js`, `engine.js`, icons) still come from the cache, so opening stays instant.
- **New version notice, translated**: when a new service worker takes control of a tab that was already open, a bar appears at the bottom with **Reload** and **Not now**. It is not a modal, it blocks nothing and it can be left for later; on the first install it does not appear because there is no previous version to replace. It listens to `controllerchange` and `updatefound`.
- **Shared `?p=` links also open offline**: if the URL goes to `app.html` the editor is served; if it goes to the root with `?p=` (the old links, from before the landing existed), the editor is served directly too, without depending on `landing.js`'s redirect. And the cache is not refreshed with that response: on the network the root returns the landing, and saving it as `app.html` would break the PWA.
- All of this is **optional and does not break the double click**: opened as a file (`file://`) there is no service worker and the app works exactly the same, with no cache. The registration is guarded with `location.protocol !== 'file:'` in `boot.js`.

### Security and robustness

- **No `eval`, no `Function()`**: the arithmetic in the operators, variables and conditions goes through its own parser (`calcExpr()`). It accepts `+ - * / % **`, parentheses, decimals, unary minus, `score`, variables and `aleatorio(a,b)`; any other text (including JavaScript code) is not executed and returns `null`. That is how the app works under a strict CSP.
- **Its own translated dialogs**: confirmations and text prompts use the app's modal (`#askModal`), with **OK / Cancel**, `Escape`, `Enter` and scroll locking. `prompt()`, `confirm()` and `alert()` are no longer used: they cut the interface and could not be translated. If you press **Stop** with a dialog open, it closes and the script is cancelled.
- **Caps on import**: a `.scmo` project or a `?p=` link cannot exceed 8 MB of text, 40 levels of nesting or 2000 blocks. If something gets trimmed, the app says so instead of hanging.
- **The cap is applied *while* decompressing**: `g1.` links travel gzipped. `inflateLimited()` reads the stream in chunks with `DecompressionStream` and cuts as soon as it exceeds `MAX_INFLATE_BYTES` (8 M characters × 4 bytes, for UTF-8), cancelling the reader. A "gzip bomb" can no longer inflate tens of megabytes before being rejected.
- **CSP declared in Vercel**: `script-src 'self'` with no `'unsafe-inline'`, `default-src 'self'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'none'` and `worker-src 'self'`. There is no inline `<script>` and no `onclick`/`oninput` handlers in either page; the static guards fail if anyone puts one back, because in the `file://` harnesses there are no headers and the error would only be seen in production.
- **Modals accessible from the keyboard**: the six dialogs share `updateModalLock()`. On opening, the control that had focus is saved, the first one in the modal gets focus, the rest of the page becomes `inert` and `Tab` / `Shift+Tab` are trapped inside (`trapModalKey()`); on closing, `inert` is removed and focus goes back where it was. Before, `Tab` escaped to the interface behind.
- **The image boundary stays closed**: SVG is accepted as input and rasterised, but `IMG_DATA_RE` only allows `webp/png/jpeg/gif` in the saved data, so a vector with a script never reaches the project.

## The landing page and the direct link

`https://scrachmo.vercel.app` shows the **landing page**: a modern presentation in Spanish, English, Portuguese and French (the language is chosen at the top and remembered by the browser), with a hero, a mock-up of the editor, features, a three-step guide and the support section.

- **The language is chosen by hand, not only by the system**: the `ES / EN / PT / FR` selector in the top bar changes the whole page instantly. With no previous choice the system language is used; as soon as you pick one, it is saved in `scrachmo_landing_lang` **and** in `scrachmo_lang`, which is the key the editor reads. That way the language travels from the landing to the app in both directions: if you had already chosen Portuguese inside the editor, the landing opens in Portuguese.
- **The dropdown needs colours of its own**: the `<select>` is part of the dark theme, but the menu that opens is drawn by the system with **its** background. Without `color-scheme:dark` on the `<select>` and an explicit `background`/`color` on its `<option>`s, the options inherited the light text and ended up as **white letters on a white background**. Since the popup does not show up in a screenshot, the check is on the computed styles and on the landing's CSS.
- **Two links, two destinations**: *Open ScrachMo* / *Open the app* go to `app.html`. *Copy direct link* uses the native share panel when it exists (`navigator.share`) and otherwise copies the URL to the clipboard, with a visible notice. That link is the one you can save or send to someone who has already seen the landing.
- **Everything you need, no accounts**: Cafecito, Ko-fi, the GitHub repository, the MIT license, the author and the phrase "If you like ScrachMo… a mention or a donation is entirely up to you". No link conditions the use of the app.
- **Old links still open**: projects shared before the move pointed to the root with `?p=…`. `landing.js` redirects them to `app.html` before drawing the presentation, and the service worker serves the editor directly if there is also no connection.
- **The PWA goes straight to the editor**: `start_url` and the manifest's `id` point to `./app.html`. Installing ScrachMo does not show the landing again.
- `index.html` and `landing.js` are purely presentational: they do not load `data.js` or `engine.js`, they do not touch the saved project and they do not register the service worker.

## How to use it

It is a 100% static app: no backend and no install steps.

```bash
# Option 1: any static server
python -m http.server 8000        # → http://localhost:8000
php -S localhost:8000             # same with PHP

# Option 2: XAMPP
# put the project in htdocs/ and go to http://localhost/scrachMo
```

You can also open **`app.html`** directly with a double click (the editor) or `index.html` (the landing). To try it from your phone, serve it on your computer and open the local IP from the phone's browser (same WiFi), or use the published version at **<https://scrachmo.vercel.app>**.

**Publishing it on Vercel**: the official address is `https://scrachmo.vercel.app` and the editor is `https://scrachmo.vercel.app/app.html`. In the Vercel panel you import the repo and nothing needs configuring: the project is static, there is no *build command* and no *output directory* (the root is served), and every push to `main` publishes on its own. `vercel.json` has two jobs: (1) **`sw.js`, `index.html`, `app.html`, `landing.js` and `boot.js` are not cached by the CDN** (`Cache-Control: public, max-age=0, must-revalidate`), because if the service worker were cached the installed app would never find out about a new version; and (2) it declares a **Content-Security-Policy** with `script-src 'self'`, plus `X-Content-Type-Options` and `Referrer-Policy`. That is why there are no inline scripts or handlers in either page: the service worker registration lives in `boot.js` and the share field's `onclick` was hooked from `engine.js`. `style-src` allows `'unsafe-inline'` (both pages carry their CSS embedded) and `img-src` allows `data:` and `blob:` (costumes and SVG).

> **Optional alternative**: `.github/workflows/pages.yml` publishes the same app on GitHub Pages if *Settings → Pages → Source: GitHub Actions* is enabled. It is not the official deployment: if Pages is not enabled, that workflow finishes green with a notice and `deploy = skipped`. That is expected and does not affect Vercel.

Careful: installing and offline mode need `https` (or `localhost`); that is why it does not work by opening the file.

### The basic flow

1. Pick a sprite (or create one from the catalog, searching by name) and add blocks: tap the palette to add them at the end, or **drag them from the grip** and drop them wherever you want. If you want to use your own drawings, tap **Import my images…** and pick one or several files: a sprite is created with those images as costumes.
2. Drag each block by its icon to reorder it inside the stack or nest it inside a C block. With the **duplicate** button you copy a whole block (with its contents), and if you make a mistake, **Undo / Redo** (or `Ctrl/Cmd+Z` and `Ctrl/Cmd+Shift+Z`) saves you. If the blocks end up too small, use the toolbar **zoom**; if you run out of room, drag the handle at the bottom of the code area (or focus it and use the arrow keys). Want a slot to use a calculated value instead of a fixed number? Tap the **ƒ** next to the slot and pick a reporter (position, score, an operation, random…); the chip's **×** takes you back to the text you had written.
3. To have two scripts in the same sprite, add a second hat block: everything that comes after it belongs to that hat. To animate, add several costumes in **Properties → Costumes** and build a `Repeat` with `Move` + `Next costume` + `Wait`.
4. Tap **Run** and watch the stage. You can change the background with your own image from the *Stage* card's icon, and adjust the size of the scene and of the sprites with the zoom in the bottom row. **Stop** cuts everything and the sprites stay where they got to; if you want them back at the position from before the run, tap **Back to start**.

## Project structure

| File | What it contains |
| --- | --- |
| `index.html` | Presentation **landing page**: styles, hero, editor mock-up, features, guide, support and footer. It does not load the engine. |
| `landing.js` | Landing texts in 4 languages, language selector, version, shareable direct link and redirect for the old `?p=` links. |
| `app.html` | **The editor**: the whole interface, layout, styles, SVG icons and panels. It is the direct URL and the PWA's `start_url`. |
| `boot.js` | Service worker registration outside the HTML (the CSP requires it), guarded for `file://`. |
| `engine.js` | The engine: block rendering, touch drag & drop, execution, sprites, variables, events, accessible modals and project. |
| `data.js` | Block catalog (53 statements + 11 reporters), categories, visible version and interface texts (4 languages). |
| `manifest.webmanifest` | Install sheet: name, colours, `display: standalone`, `start_url: ./app.html` and icons. |
| `sw.js` | Service worker: saves the landing and the app so they open without internet, and serves `app.html` to `?p=` links. The cache name carries the version and a fingerprint of the six runtime files. |
| `vercel.json` | Deployment headers: strict CSP, `nosniff`, `Referrer-Policy` and the files without CDN cache. |
| `icons/` | The app icon in SVG and PNG (192, 512, *maskable* and *apple-touch*). |
| `README.md` and its translations | The documentation: Spanish in `README.md` and versions in `README.en.md`, `README.pt.md` and `README.fr.md`, each with the language bar at the top. The translations do not repeat the verification section: they link to the Spanish one. |
| `tests/` | Smoke test suite over the real DOM, static checks, PWA and the test page generator. |
| `.github/workflows/test.yml` | CI: syntax, text parity, version guard, PWA and the suite in headless Chrome on every push and pull request. |
| `.github/workflows/pages.yml` | **Optional** publishing on GitHub Pages. The official deployment is Vercel. |

What opens in the browser is the two pages, their scripts, the manifest, the service worker and the icons; `vercel.json`, `tests/` and the workflows are configuration and development tools, and they are not loaded when you use ScrachMo. The test harnesses are built from **`app.html`**, not from the landing.

Want to add a new block? It is an entry in `data.js` and its logic in `engine.js`.

## Verification

The project has **1187 automated checks per language, 4748 in total**: every scenario runs **four times —Spanish, English, Portuguese and French— in headless Chrome**, and all four have to give 0 failures. On top of that there are **143 PWA checks** that need no browser. Together they cover the block catalog and the four languages, the engine and its events, costumes and image import, the editor and its tools, the stage and the stage size —including the visual edge margin that keeps the drawing fully inside the stage—, clones, sensors and collisions, sounds and their real synthesis, the `.sb3` export, the landing page and the on-screen gamepad with tilt.

```bash
node --check data.js && node --check engine.js && node --check sw.js && \
node --check landing.js && node --check boot.js
node tests/check-parity.js       # text parity + static checks
node tests/pwa-check.js          # manifest, icons and served routes
node tests/pwa-sw.js             # service worker logic
node tests/run.js my-run         # 25 scenarios × 4 languages in headless Chrome
```

`tests/build.js` builds the test pages and the shared link; `tests/run.js` launches Chrome with an isolated profile per suite and per language, and counts `PASS` / `FAIL` / `ERROR`. On GitHub Actions, `.github/workflows/test.yml` repeats the same thing on every push and pull request.

The full log —what each suite checks, why four languages and `--lang`, the traps found along the way, the CI environment notes and the version/cache rules— is kept in the Spanish README, which is the source of truth for anything that changes with every release:

→ **[Verificación (español)](README.md#verificación)**

## Manual verification on iPhone (WebKit)

The automated suite runs in **headless Chrome**. WebKit —the engine of Safari and of *every* browser on iOS, because Apple does not allow another one— is not covered: setting it up in CI requires Playwright with WebKit or a macOS runner, and there are things that can only be judged with a finger anyway (the sensor, the audio, the notch). Until that exists, this is the list that is run **by hand before every release**, with a real iPhone and Safari. It takes about ten minutes.

| # | What to test | How | What has to happen |
|---|---|---|---|
| 1 | Installation | Open `https://scrachmo.vercel.app/app.html` in Safari → Share → *Add to Home Screen* | It starts in the **editor**, without Safari's bar, with the right icon |
| 2 | Offline | Airplane mode → open from the icon | It loads the same (service worker). Create a sprite, close and reopen: it is still there |
| 3 | Audio | Project with `Play sound` → **Run** | It sounds. If the first sound is lost, it is WebAudio's unlock by gesture |
| 4 | Motion permission | **Run** → tap **Tilt** | iOS asks *Allow Motion and Orientation*. With *Allow*, tilting moves the sprite |
| 5 | Permission denied | Repeat choosing *Don't allow* | The notice appears, the game **keeps working with the gamepad** and nothing breaks |
| 6 | Tilt in landscape | Turn the phone and tilt right | The sprite goes **right**. If it goes the other way, the bug is in `tiltBasis()` |
| 7 | Gamepad | Tap and **hold** an arrow | It walks continuously; releasing stops it. The touch does **not** also fire "on tap" |
| 8 | Notch and home bar | Game mode upright and in landscape | The gamepad and **Exit** do not sit under the notch or the gesture bar (`env(safe-area-inset-*)`) |
| 9 | Rotate notice | **Run** with the phone upright | It appears; the ✕ closes it and it does not come back until the next game |
| 10 | Images | Upload a large PNG and an SVG | They are reduced to 256 px; the SVG comes in **converted to a bitmap**, not stored as a vector |
| 11 | `createImageBitmap` | The same large costume | Safari lacks that API: `loadBitmap()` falls back to `<img>` and the image appears anyway |
| 12 | Shared language | Switch to French on the landing → open the editor | The editor opens in **French** (both `localStorage` keys) |
| 13 | Export to Scratch | Export `.sb3` → upload it to `scratch.mit.edu` | The costumes load: each file is named after its MD5 |
| 14 | Private browsing | Open in a private tab | It works; if iOS blocks saving, it says so and does not break the app |

If something fails, write down **model, iOS version and whether it happened in Safari or in the installed app**: all three change WebKit's behaviour, and without them the report is useless.

## Known limitations

Better honest than a sales pitch:

- **The `.sb3` export is one-way, and not complete**: ScrachMo opens its own formats (`.scmo` and `?p=`, which are its own JSON) but **cannot import an `.sb3`**. And on the export side there are blocks with no equivalent in Scratch (local messages, shake, tilt, vibrate, create/show variables, friends and the loose `else`): they are not invented, they are left out and reported in a comment inside the project. And if you enlarged the stage, the notice says so too: Scratch's always measures 480 × 360, so whatever falls outside the original frame will not be visible. A melody also plays **once** in Scratch instead of looping, and the bounce uses Scratch's costume box rather than ScrachMo's circle, so a very elongated sprite may bounce a little earlier or later.
- **Collisions are not pixel-perfect**: each sprite is a circle of radius 26 at 100 % size, scaled by its size. It is fast and stable, but a very elongated sprite collides earlier or later than the drawing suggests, and there is no colour or "touching the pointer" detection.
- **The timer lives in the session**: it counts from when you opened the project (or from the last `Reset timer`), it is not saved in the `.scmo`, it does not reset with *Run* and it does not stop with *Stop*. If the game needs a time, reset it at the start of the script.
- **Sounds cannot be imported and there is no microphone recording**: the catalog is closed (8 sounds and 3 synthesised melodies) and there is no audio editor. Adding your own sounds would mean files or recording, with its cost in project weight and in the PWA cache.
- **Audio needs a tap**: mobile browsers do not let anything sound until the person interacts with the page. ScrachMo resumes the audio context every time something is about to sound, so a script launched with *Run* always sounds (that tap already counts); what can end up silent is music that starts on its own when opening a `?p=` link, before anything has been touched.
- The block's arithmetic **no longer accepts arbitrary JavaScript**: only numbers, `+ - * / % **`, parentheses, `score`, variables and `aleatorio(a,b)`. That was the price of removing `Function()`; in exchange the app works under a strict CSP.
- There is no costume editor: images are imported as they are (reduced to 256 px), but they cannot be drawn, cropped, renamed or reordered from the app. An animated GIF keeps its first frame.
- Slots accept fixed numbers or a reporter (`ƒ`); free text in a motion slot does not resolve variables or operations. In `Go to x: y:` values that would leave the drawing outside are clamped to the **safe edge** (the world edge minus the visual radius), so the sprite never appears cut off; the slots show those same limits. If you want to go back to the position from before a run, use **Back to start**.
- Reporters are numeric: `{x} > {y}` returns `1` or `0` (enough for `if`, but there are no booleans or first-class text) and a variable holding text counts as `0` inside an operation. Nesting is cut at 12 levels when running and at 10 when drawing, so that a tampered project cannot hang the app.
- `?p=` links still carry the whole project inside the URL. With many large costumes they can become too long for WhatsApp or for the browser; in that case it is better to export the `.scmo`. Publishing it on Vercel does not change this: short links would need a backend with storage.
- **Installation and offline mode need `https` or `localhost`**: they are browser requirements for service workers, not a decision of the app. Opened with a double click (`file://`) ScrachMo works the same, but with no installable icon and no cache.
- **The PWA cache is invalidated with every release, and now CI requires it**: the cache name in `sw.js` is `scrachmo-<APP_VERSION>-<fingerprint>`, where the fingerprint is the first 8 characters of the SHA-256 of `index.html + app.html + landing.js + boot.js + data.js + engine.js` (with normalised line endings so it comes out the same on Windows and on Linux). `tests/check-parity.js` recalculates that fingerprint and **fails if any of those six files changed without updating `sw.js`**; it also fails if `APP_VERSION` in `data.js`, the version in `landing.js` and the one in `sw.js` do not match. To publish you run `node tests/bump-sw.js` (or `node tests/bump-sw.js v12`), which bumps all three versions and recalculates the fingerprint. Without this, the service worker serves those files from the cache without revalidating and the installed app stays old indefinitely. `tests/pwa-sw.js` reads the version from `sw.js` itself, so it does not get pinned to a number. On Vercel, `vercel.json` also stops the CDN from caching `sw.js`.
- A project opened from a `?p=` link or from a `.scmo` is loaded **into the current project**, so it replaces whatever was there. If you want to keep it, create a new one before opening it.
- The project's name lives in the device's library: it does not travel inside the `.scmo` or the `?p=` link. There are no folders or manual ordering either: the list is sorted by last change.
- **Messages are not multiplayer**: they use `localStorage` and reach the sprites of the same browser (and other tabs of the same origin), never other devices. See *Local messages* above.
- There is zoom for the block area and for the stage, and a two-column layout from 900 px, but the wide arrangement cannot be forced by hand on a phone: it comes out on its own according to the screen width.

## License

[MIT](LICENSE). Use it, break it and improve it freely.
