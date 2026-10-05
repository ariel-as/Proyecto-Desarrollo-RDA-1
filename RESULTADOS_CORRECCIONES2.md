# Registro de Correcciones — Auditoría 2 (Accesibilidad WCAG 2.2 AA, UX y Responsive)

- **Proyecto:** PLANETA FITNESS — Ecommerce Web
- **Asignatura:** Desarrollo de Plataformas (RDA 1)
- **Auditoría de origen:** [`AUDITORIA2.md`](AUDITORIA2.md) (leída, **no modificada**)
- **Alcance de la corrección:** los hallazgos de `AUDITORIA2.md` queeran necesarios y pertinentes
- **Archivos modificados:** `index.html`, `assets/css/styles.css`, `js/app.js`, `js/view.js`
- **Archivos creados:** este `RESULTADOS_CORRECCIONES2.md`
- **Entorno:** Node.js v24.21.0 sobre Windows
- **Dependencias instaladas:** ninguna. **Frameworks añadidos:** ninguno. **Reestructuraciones:** ninguna.

---

## 1. Resumen Ejecutivo

Se corrigieron **5 de los 9 hallazgos** (1 alto, 4 medios, 1 bajo) y se verificó que **2 hallazgos bajos ya estaban resueltos** en el código vigente. Se dejaron **2 pendientes** de forma deliberada, con el motivo justificado en la sección 4.

No se tocó el diseño, la paleta de color, el logo, el contenido ni la funcionalidad existente. Los cambios se limitan a atributos ARIA, clases de utilidad, una variable de color y el nivel de encabezado de tres plantillas de tarjeta.

| Hallazgo | Severidad | Estado | Archivo tocado |
|---|:---:|:---:|---|
| H-01 Nombre accesible del botón de menú a 320px | Alta | **Corregido (parcialmente ya hecho)** | `js/app.js` |
| M-01 Objetivos táctiles de los enlaces del pie | Media | **Corregido** | `index.html` |
| M-02 Botón «Eliminar del carrito» | Media | **Corregido** | `assets/css/styles.css` |
| M-03 Contraste del borde de los campos | Media | **Corregido (con desviación del color propuesto)** | `assets/css/styles.css`, `index.html` |
| M-04 Jerarquía de encabezados en componentes dinámicos | Media | **Corregido** | `js/view.js` |
| B-01 `aria-controls` al panel inyectado por JS | Baja | **Pendiente (se explica el motivo)** | — |
| B-02 Bloqueo visual si se demora `load` | Baja | **Corregido** | `index.html` |
| B-03 Botón del carrito sin nombre accesible estático | Baja | **Ya corregido antes de esta pasada** | — |
| B-04 Tailwind Play CDN sin paquete compilado | Baja | **Pendiente (se explica el motivo)** | — |

---

## 2. Correcciones Realizadas

### [H-01] Nombre accesible del botón de menú móvil — `js/app.js`

**Estado previo real:** el `aria-label="Abrir menú de navegación"` **ya estaba** en el marcado
estático de `index.html` (línea 91 del archivo actual), por lo que el nombre accesible a 320px
ya no era vacío. Lo que faltaba era la segunda mitad de la recomendación de la auditoría:
sincronizar ese nombre con el estado real del menú. Con el código anterior, al abrir el menú el
botón seguía anunciando «Abrir menú de navegación» mientras `aria-expanded="true"` informaba de
que estaba desplegado, es decir, nombre y estado se contradecían.

**Cambio** (`js/app.js`, función `iniciarMenuMovil()`):

- `abrir()` añade `boton.setAttribute('aria-label', 'Cerrar menú de navegación')`.
- `cerrar()` restaura `boton.setAttribute('aria-label', 'Abrir menú de navegación')`.
- Se documenta en el comentario de la función **por qué** el atributo tiene que existir en el
  HTML: por debajo de 375 px `.pf-menu-boton-texto` recibe `display: none` y el icono ☰ va
  marcado como decorativo, de modo que sin el atributo el botón se anunciaría solo como «botón».

El rótulo accesible sigue conteniendo la palabra «menú» que se ve en pantalla a partir de 375 px,
por lo que se mantiene conforme a SC 2.5.3 (*Label in Name*).

---

### [M-01] Objetivos táctiles de los enlaces del pie — `index.html`

**Problema:** con `text-sm` (interlineado de 20 px) y `space-y-1` (4 px), cada enlace del pie
tenía un área interactiva de **20 px de alto** y 24 px de separación entre centros: por debajo
del mínimo de 24x24 px de WCAG 2.2 SC 2.5.8 y con riesgo de pulsar el enlace equivocado.

**Cambio:**

- Las dos listas del pie (`Secciones` y `Accesos`) pasan de `space-y-1` a `space-y-2`.
- Todos sus enlaces reciben `inline-block py-1`: el área interactiva sube a **28 px de alto**
  (20 px de texto + 8 px de relleno) y la separación entre centros queda en **36 px**, sin
  colisión entre círculos de 24 px.
- El enlace `mailto:` de la columna «Contacto», que es un enlace suelto y no forma parte de una
  lista, recibe el mismo `inline-block py-1` por el mismo motivo.

No se cambió ningún texto, destino ni color de los enlaces.

---

### [M-02] Botón «Eliminar del carrito» (`.pf-quitar`) — `assets/css/styles.css`

**Problema:** `padding: 0` con fuente de 0.8rem daba una altura de ~16 px (por debajo de los
24 px de SC 2.5.8), separado por solo 5.6 px de los controles de cantidad; además el `:hover`
pasaba a `--pf-rojo` (`#e21b23`), que sobre el fondo del panel `#151515` da **3.84:1**, por
debajo de los 4.5:1 que exige SC 1.4.3 para texto de 12.8 px.

**Cambio:**

- `.pf-quitar` pasa a `padding: 0.35rem 0` y `min-height: 24px`. El alto real resultante es de
  ~26.6 px y la zona muerta por encima sube de 5.6 px a ~11 px, sin mover el resto de la
  maqueta de la línea del carrito.
- `.pf-quitar:hover` usa la nueva variable `--pf-rojo-claro` (`#ff6b72`), **6.61:1** sobre
  `#151515`, en lugar de `--pf-rojo`. Se añadió `--pf-rojo-claro` a `:root` para no repetir el
  literal y dejar el motivo documentado junto a la paleta.

El estado de color en reposo (`--pf-gris`, 6.98:1) ya cumplía y no se tocó. El indicador de foco
`:focus-visible` global sigue aplicando sin cambios.

---

### [M-03] Contraste del borde de los campos de formulario — `assets/css/styles.css`, `index.html`

**Problema:** el borde `--pf-linea` (`#2e2e2e`) da **1.34:1** contra el interior del campo
(`#151515`) y **1.46:1** contra la superficie de la sección (`#0a0a0a`), muy por debajo del
3.0:1 de SC 1.4.11. El borde es la única pista que delimita el campo en reposo.

**Cambio:**

1. Se añade `--pf-borde-control: #6b6b6b` a `:root` y la regla
   `input, select, textarea` pasa a `border: 1px solid var(--pf-borde-control)`.
   Resultado medido: **3.43:1** frente a `#151515` y **3.72:1** frente a `#0a0a0a`.
2. En `index.html` se retira la utilidad `border-pf-linea` de los cuatro controles del formulario
   de contacto (los tres `input` y el `textarea`).

**Desviación deliberada respecto a la recomendación de la auditoría.** El informe propone
`#5c5c5c` y afirma que alcanza 3.19:1 sobre `#151515`. Recalculando la fórmula de luminancia
relativa de WCAG, **`#5c5c5c` solo llega a 2.73:1 sobre `#151515`**, es decir, seguiría sin
cumplir el 3.0:1. Se eligió `#6b6b6b` por ser el gris más claro que ya usa la paleta del
proyecto (`--pf-gris-oscuro`) y que sí supera el umbral con holgura en los dos fondos.

**Por qué hubo que tocar también el HTML.** La auditoría revisa únicamente la regla CSS, pero esa
corrección no se habría visto en el navegador: los campos de `index.html` llevan la utilidad
`border-pf-linea` de Tailwind, que tiene especificidad (0,1,0) frente a (0,0,1) de `input`, así
que el CDN de Tailwind seguía imponiendo `#2E2E2E`. Alternativas descartadas:

- Subir la especificidad de la regla base (`body:not(.pf-admin) input`, 0,1,1) haría que el
  estado de error `[aria-invalid="true"]` (0,1,0) dejara de aplicarse.
- Usar `!important` anularía también el indicador de error.
- Declarar la regla duplicando el nombre de la utilidad de Tailwind acoplaría la hoja de
  estilos a una clase externa y seguiría rompiendo el estado de error por orden de cascada.

Retirar la utilidad que compite es lo más simple y no altera ancho, radio ni relleno del campo.
Se dejó un comentario en la hoja de estilos advertir que los campos no deben volver a llevar
`border-pf-linea`.

**Efecto colateral comprobado:** el estado de error sigue funcionando (`#e21b23` da 3.84:1 como
borde, por encima de 3:1) y el área de administración, que usa Bootstrap sobre fondo claro, no
se ve afectada: sus campos llevan `.form-control` / `.form-select`, que ya ganaban por
especificidad antes y ahora.

---

### [M-04] Jerarquía de encabezados aplanada — `js/view.js`

**Problema:** los productos quedaban como `<h3>` hermanos del `<h3>` de su propia categoría, en
lugar de subordinados a él (WCAG 2.2 SC 1.3.1).

**Cambio:** el nombre pasa a `<h4>` en las tres plantillas que cuelgan de un `<h3>`:

| Plantilla | Padre en el DOM | Antes | Después |
|---|---|:---:|:---:|
| `tarjetaProducto()` | `<h3 class="pf-tienda-titulo">` de la categoría | `<h3>` | `<h4>` |
| `tarjetaEntrenador()` | `<h3 id="titulo-entrenadores">` | `<h3>` | `<h4>` |
| `tarjetaServicio()` | `<h3>Servicios</h3>` | `<h3>` | `<h4>` |

**Lo que deliberadamente NO se cambió:**

- `tarjetaPlan()` mantiene su `<h3>` y su `<h4>Incluye</h4>`: cuelga directamente del `<h2>`
  «Planes», así que su jerarquía ya era correcta y no aparece en la auditoría.
- `tarjetaClase()` mantiene su `<h3 class="pf-clase-nombre">`: las clases cuelgan directamente
  del `<h2>` «Clases», también fuera de la auditoría.

Resultado: `h2 → h3 → h4` sin saltos en ningún punto. `js/admin.js` solo importa `escapar` de
`view.js`, así que el cambio no afecta al panel de administración.

---

### [B-02] Bloqueo visual preventivo acoplado al evento `load` — `index.html`

**Problema:** al llegar con un ancla, el cuerpo se oculta con `pf-posicion-pendiente` y solo se
destapaba esperando `load` + 600 ms. Si una imagen pesada o el CDN de Tailwind se ralentizaban,
la página quedaba invisible.

**Cambio:** se añade un `setTimeout` de rescate incondicional de 800 ms que quita la clase
aunque `load` no se haya disparado. El respaldo sobre `load` se mantiene intacto, de modo que
en el caso normal (rápido) sigue mandando `js/app.js` al terminar de pintar los datos, y el
temporizador solo actúa cuando algo se atasca. Se amplió el comentario del bloque para explicar
que hay dos respaldos.

---

## 3. Hallazgos que Ya Estaban Resueltos

### [B-03] Botón del carrito sin nombre accesible en el marcado estático

El botón de `index.html` **ya declara** `aria-label="Carrito de compras, vacío"` en el HTML
estático, además de `actualizarContadorCarrito()` en `view.js` que lo reescribe con el número de
artículos. No había nada que corregir; se verificó que el valor inicial fuera coherente con el
que produce `actualizarContadorCarrito()` cuando el carrito está vacío, y ambos coinciden.

### Verificación del criterio [H-01] en el marcado estático

Como parte de [H-01] se comprobó que el `aria-label` del botón de menú efectivamente ya
existía en `index.html`. La auditoría lo daba por ausente; el código vigente no coincide con esa
evidencia. Es posible que el informe se haya generado sobre una copia anterior del archivo, ya
que los cambios sin confirmar del área de trabajo incluyen precisamente la incorporación de ese
atributo. Se documenta aquí para que conste.

---

## 4. Hallazgos Pendientes y Motivo

### [B-01] `aria-controls="panel-carrito"` apunta a un id que se inyecta por JavaScript

**Pendiente, con motivo.** La auditoría propone declarar `<aside id="panel-carrito">` en el HTML
estático de `index.html` con el atributo `hidden`.

No se aplicó porque el panel del carrito **no es un elemento exclusivo de `index.html`**:
`js/carrito-panel.js` lo inyecta una sola vez desde `iniciarPanelCarrito()` y lo reutilizan las
cuatro páginas del área cliente (`index.html`, `cliente/checkout.html`, `cliente/login.html` y
`cliente/nutricion.html`). Duplicar ese marcado en el HTML obligaría a mantener dos copias de una
plantilla de más de cien líneas —cabecera, estado vacío, lista, totales y modal de acceso— que
se desincronizarían en cuanto se tocara una, y la copia estática quedaría siempre vacía.

Riesgo de regresión adicional: `document.body.classList.add('pf-bloquea-scroll')`, el
confinamiento de foco y `pintarPanel()` asumen un único nodo `[data-panel-carrito]`.

Mitigación actual: la referencia solo queda colgando entre la descarga del HTML y el
`DOMContentLoaded`, unos milisegundos, y `inyectarEstructura()` ya es idempotente
(`if (document.querySelector('[data-panel-carrito]')) return;`). Además la suite del proyecto
`pruebas/prueba-accesibilidad.mjs` ya resuelve este caso: `idsInyectados()` lee los `id` que
crea el código en `js/` y los da por válidos, por lo que la comprobación de referencias ARIA
pasa. **Alternativa si se quiere cerrar el hallazgo sin tocar `index.html`:** quitar
`aria-controls="panel-carrito"` del marcado estático y asignarlo en `carrito-panel.js` después
de inyectar el panel. Es un cambio de una línea, pero se deja pendiente porque reduce la
mejora progresiva: sin JavaScript la referencia sería igualmente inútil, aunque no colgando.

### [B-04] Tailwind CSS compilado en el cliente con el Play CDN

**Pendiente, con motivo.** `<script src="https://cdn.tailwindcss.com"></script>` es el script de
desarrollo de Tailwind, no apto para producción según la documentación del framework.

No se aplicó porque resolverlo exige **compilar Tailwind** y adjuntar el CSS resultante al
proyecto, y eso requiere instalar la CLI de Tailwind como dependencia de desarrollo y una cola de
compilación. La instrucción de trabajo fue explícita: no instalar dependencias, no agregar
frameworks y no crear archivos innecesarios.

Además, el proyecto **depende por completo del CDN en las cuatro páginas del área cliente**: el
diseño (paleta de marca en `assets/js/identidad.js`, `max-w-6xl`, `px-4`, rejillas, utilidades
de texto) está construido sobre utilidades generadas en el navegador. Sin red, esas páginas
pierden su maquetación con o sin este hallazgo, así que la corrección no es un cambio aislado
sino una migración del pipeline de estilos que excede el alcance de una auditoría de
accesibilidad.

**Vía sugerida para una fase posterior:** añadir Tailwind como dependencia de desarrollo,
copiar `assets/js/identidad.js` a un archivo de configuración de Tailwind, compilar un
`assets/css/tailwind.css` e insertarlo en el `<head>` antes de `assets/css/styles.css`,
eliminando el `<script>` del CDN. Conviene hacerlo página por página y pasar después
`pruebas/prueba-responsive.mjs`, que es la que mide desbordes y contraste real.

---

## 5. Pruebas Ejecutadas

Se hizo **una sola pasada de validación** después de aplicar todos los cambios.

### 5.1 Sintaxis de todos los módulos

```powershell
Get-ChildItem -Recurse -Include "*.js","*.mjs" | ForEach-Object { node --check $_.FullName }
```

**Resultado:** `OK` en los 21 archivos (`js/`, `admin/`, `assets/js/` y `pruebas/`). Sin
excepciones de sintaxis.

### 5.2 Suites del proyecto

| Comando | Resultado | Contenido |
|---|:---:|---|
| `node pruebas/prueba-accesibilidad.mjs` | **exit 0** | Referencias ARIA, roles válidos, sin `tabindex` positivo, nombre accesible en los 35 controles de `index.html`, `aria-hidden` en elementos enfocables, foco visible, `prefers-reduced-motion`, sin desbordamiento horizontal |
| `node pruebas/prueba-html.mjs` | **exit 0** | 10 páginas: doctype, metadatos, un solo `<h1>`, jerarquía de encabezados sin saltos, regiones, ids únicos, `alt`, etiquetas de formulario, sin manejadores en línea |
| `node pruebas/prueba-enlaces.mjs` | **exit 0** | 150 rutas internas y 51 recursos locales verificados en disco, enlaces externos en `https` |
| `node pruebas/prueba-logica.mjs` | **exit 0** | 22 comprobaciones de carrito, planes y validadores |
| `node pruebas/prueba-repo.mjs` | **exit 0** | 11 comprobaciones del catálogo, planes y sincronización con el admin |
| `node pruebas/prueba-selectores.mjs` | **exit 0** | 31 comprobaciones: controlador de cada página, sus selectores, secciones enlazadas y las 22 imágenes |

Las seis suites terminan con «Todas las comprobaciones pasaron» y **0 líneas `FALLA`**.

> `prueba-repo.mjs` imprime avisos de «IndexedDB no disponible en la prueba» por el objeto
> `globalThis.indexedDB` inexistente en Node. Es un mensaje informativo preexistente de la
> propia prueba (el código degrada a `fetch` y lo indica) y no guarda relación con estos cambios.

### 5.3 Verificación de contraste

Se calculó la luminancia relativa con la fórmula de WCAG sobre los pares de color realmente
usados, para confirmar que las correcciones de [M-02] y [M-03] alcanzan los umbrales:

| Par | Antes | Después | Umbral |
|---|:---:|:---:|:---:|
| Borde de campo `#2e2e2e` vs interior `#151515` | 1.34:1 | — | 3:1 |
| Borde de campo `#2e2e2e` vs sección `#0a0a0a` | 1.46:1 | — | 3:1 |
| Borde de campo `#6b6b6b` vs interior `#151515` | — | **3.43:1** | 3:1 |
| Borde de campo `#6b6b6b` vs sección `#0a0a0a` | — | **3.72:1** | 3:1 |
| `#5c5c5c` (color propuesto en la auditoría) vs `#151515` | 2.73:1 | — | 3:1 — **no cumplía** |
| `.pf-quitar` reposo `#a0a0a0` vs `#151515` | 6.98:1 | 6.98:1 | 4.5:1 |
| `.pf-quitar:hover` `#e21b23` vs `#151515` | 3.84:1 | — | 4.5:1 |
| `.pf-quitar:hover` `#ff6b72` vs `#151515` | — | **6.61:1** | 4.5:1 |
| Borde de error `#e21b23` vs `#151515` | 3.84:1 | 3.84:1 | 3:1 |

### 5.4 Pruebas que no pudieron ejecutarse

`pruebas/prueba-navegador.mjs` y `pruebas/prueba-responsive.mjs` requieren **Playwright**, que no
está instalado en el proyecto (no existe `package.json` ni `node_modules`). Ambas fallan al
importar con `ERR_MODULE_NOT_FOUND: Cannot find package 'playwright'`. No se instaló, por la
restricción de no agregar dependencias.

Quedan por tanto **sin verificación automática** los puntos que solo se pueden medir con un
navegador real, y que son precisamente los afectados por estas correcciones:

- Alto y separación efectiva de los enlaces del pie y de `.pf-quitar` en 320 px y 390 px
  (los 28 px y 24 px calculados salen de la caja del modelo, no de una medición real).
- Contraste computado del borde de los campos con el color final de Tailwind.
- Repintado de la jerarquía `h2 → h3 → h4` en el árbol accesible una vez inyectado el catálogo.
- Anuncio del botón de menú con lector de pantalla a 320 px antes y después de abrirlo.

Las pruebas manuales que quedan pendientes son las de la sección 5.2 y 5.3 de `AUDITORIA2.md`
(lector de pantalla, navegación por teclado, medición de contraste con CCA o DevTools, y
reflujo a 320/390/768/1024/1280 px).

---

## 6. Verificación de No Regresión

- **Diseño y paleta:** solo se añaden dos variables CSS (`--pf-rojo-claro`, `--pf-borde-control`)
  que no cambian ningún color ya en uso. `--pf-linea` se mantiene intacta para las fronteras
  decorativas (tarjetas, separadores, encabezado).
- **Logo, contenido y textos:** sin cambios. Ninguna cadena de texto visible fue modificada.
- **Funcionalidad:** los seis suites cubren carrito, planes, clases, catálogo, validación de
  formularios, rutas y enlaces; todas pasan. No se modificó ninguna función de negocio.
- **Estructura del proyecto:** sin archivos nuevos salvo este documento, sin carpetas nuevas,
  sin dependencias, sin frameworks. `AUDITORIA.md` y `AUDITORIA2.md` no fueron tocados.

---

## 7. Resumen de Archivos Modificados

| Archivo | Cambio | Hallazgos |
|---|---|---|
| `index.html` | Temporizador de rescate de 800 ms en el script del `<head>` | B-02 |
| `index.html` | `inline-block py-1` en los enlaces del pie y `space-y-1` → `space-y-2` en las dos listas | M-01 |
| `index.html` | Retirada de `border-pf-linea` en los 4 controles del formulario de contacto | M-03 |
| `assets/css/styles.css` | Nuevas variables `--pf-rojo-claro` y `--pf-borde-control` en `:root` | M-02, M-03 |
| `assets/css/styles.css` | Borde de `input, select, textarea` con `--pf-borde-control` | M-03 |
| `assets/css/styles.css` | `.pf-quitar`: `padding: 0.35rem 0`, `min-height: 24px`, hover a `--pf-rojo-claro` | M-02 |
| `js/app.js` | `aria-label` del botón de menú sincronizado con `aria-expanded` en `iniciarMenuMovil()` | H-01 |
| `js/view.js` | `<h3>` → `<h4>` en `tarjetaProducto`, `tarjetaEntrenador` y `tarjetaServicio` | M-04 |