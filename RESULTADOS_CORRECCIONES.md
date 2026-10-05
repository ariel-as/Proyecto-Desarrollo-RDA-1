# Resultados de Correcciones — PLANETA FITNESS

- **Proyecto:** PLANETA FITNESS — Ecommerce Web
- **Documento de referencia:** `AUDITORIA.md` (Octubre 2026) — **no modificado**
- **Alcance:** corrección de los hallazgos de `AUDITORIA.md` que son necesarios y pertinentes, sin alterar diseño, colores, logo, contenido ni funcionalidades.
- **Fecha de aplicación:** Octubre 2026

---

## 1. Resumen

| Hallazgo | Nivel | Estado | Archivo |
|---|---|---|---|
| [H-01] Fallback sin JavaScript | Alto | **Corregido** | `index.html` |
| [M-01] `aria-describedby` dinámico | Medio | **Corregido** | `js/validation.js` |
| [M-02] Cuadrícula Bootstrap en admin | Medio | **Corregido** | `admin/clases.html`, `admin/entrenadores.html` |
| [M-03] Confinamiento de foco en menú móvil | Medio | **Corregido** | `js/app.js` |
| [B-02] Validación horaria en admin | Bajo | **Corregido** | `js/admin.js` |
| [B-03] Atributos `autocomplete` | Bajo | **Corregido** | 4 archivos HTML |
| [B-01] Respaldo local de CSS (offline) | Bajo | **Pendiente** | — (ver §4) |

**Correcciones aplicadas:** 6 de 7. **Pendientes:** 1 (B-01), justificado en §4.
No se instalaron dependencias, no se añadieron frameworks y no se crearon archivos de código nuevos.

---
a
**Corrección:** se añadió un bloque `<noscript>` dentro de `<main>` en `index.html`, justo después de `#mensaje-dinamico`, antes de la sección de planes:

- Aviso explícito de que parte del contenido requiere JavaScript, con `role="alert"`.
- Los tres precios de planes en texto plano: individual `$35`, 2 personas `$60`, 3 personas `$85`.
- Vía de contacto directa: correo `planetafitness@gmail.com` (el mismo del sitio) y contratación en recepción.
- Horarios de atención.

Se reutilizó la clase `.pf-tarjeta` ya presente en la hoja de estilos, de modo que el bloque respeta la paleta y las tarjetas existentes sin introducir estilos nuevos. El contenido solo se materializa cuando el navegador no ejecuta JavaScript; con JS activo no altera el DOM ni el diseño.

### [M-01] Asociación programática del error con `aria-describedby` — Medio

**Problema:** la cabecera de `js/validation.js` documenta que el mensaje «se vincula al campo con `aria-describedby`», pero `mostrarError()` no añadía el `id` del elemento de error al atributo. Al reenfocar el campo con teclado, el lector de pantalla solo leía el texto de ayuda estático.

**Corrección** en `js/validation.js`:

- Se añadieron las funciones privadas `describirConError(campo, idError)` y `describirSinError(campo, idError)`.
- `mostrarError()` ahora incorpora `err-<id del campo>` a `aria-describedby`.
- `limpiarError()` lo retira y **conserva el resto de ayuda-ficheros** ya declarados en el HTML.

El manejo de lista es aditivo e idempotente: no duplica el `id` si el error se repite, no pierde referencias como `ayuda-nombre`, `ayuda-cedula`, `ayuda-telefono` o `ayuda-telefono-checkout`, y si el campo no tenía ningún otro descripción, elimina el atributo en lugar de dejarlo vacío.

Esto afecta a los cuatro formularios con validación dinámica: contacto, registro, login y checkout, además de nutrición.

### [M-02] Cuadrícula Bootstrap en el panel de clases y entrenadores — Medio

**Problema:** `pintarClasesAdmin()` y `pintarEntrenadoresAdmin()` (`js/admin.js`) inyectan `<div class="card h-100">` como descendientes directos de `.row g-4`, sin clases de columna ni recuento de columnas.

**Corrección:** se aplicó la variante alternativa que la propia auditoría propone: declarar el recuento de columnas en la fila.

- `admin/clases.html`: `<div data-clases-admin class="row row-cols-1 g-4">`
- `admin/entrenadores.html`: `<div data-entrenadores-admin class="row row-cols-1 g-4">`

**Criterio seguido:** la auditoría ofrecía dos vías —envolver cada tarjeta en `col-12 col-lg-6` / `col-12 col-md-6 col-lg-4`, o añadir `row-cols-*` en el HTML—. Se eligió `row-cols-1` por dos razones:

1. **Preserva el diseño actual.** `.row > *` ya aplicaba `width: 100%` a las tarjetas, es decir, una tarjeta por fila. `row-cols-1` fija ese mismo comportamiento de forma explícita, mientras que `col-lg-6` / `col-lg-4` habrían pasado a 2 o 3 columnas en escritorio, un cambio visual ajeno a la auditoría.
2. **Menor riesgo.** Un cambio de atributo por archivo frente a reindentar dos plantillas JS largas; no existe riesgo de desbalancear etiquetas en el marcado generado.

Verificado en navegador: las tarjetas miden exactamente el ancho de la fila (1140 px = 1140 px) en ambas vistas.

### [M-03] Confinamiento de foco en el menú móvil — Medio

**Problema:** el menú desplegable de `< 1024px` se superpone al contenido. `aria-expanded` y la tecla `Escape` funcionaban, pero sin trampa de foco el `Tab` salía del panel hacia el botón del carrito y el hero, que quedaban visualmente tapados (WCAG 2.2, 2.4.3).

**Corrección** en `js/app.js`:

- Nueva función `confinarFocoEnMenu(menu, boton, evento)`, que calcula los elementos enfocables **visibles** del panel y cicla el foco.
- El `keydown` de `document` ya existente se extendió con la rama `Tab` cuando el menú está abierto.
- `Shift + Tab` desde el primer enlace devuelve el foco al botón que abre el menú, en lugar de cerrarlo: el botón forma parte del ciclo, igual que en los diálogos del proyecto.
- `Escape` conserva su comportamiento intacto (cierra y devuelve el foco).

Se reutilizó el mismo criterio de `confinarFoco()` que ya existe en `js/carrito-panel.js`, adaptándolo al caso del menú desplegable. No se creó un módulo compartido para no reestructurar el proyecto.

### [B-02] Validación de consistencia horaria en el panel — Bajo

**Problema:** el formulario de horarios capturaba `horaInicio` y `horaFin` sin comprobar que la hora de término fuese posterior a la de inicio, permitiendo registrar `19:00 → 08:00`.

**Corrección** en `js/admin.js`, en el manejador `submit` de `pintarClasesAdmin()`:

```javascript
const invertido = horarios.find((horario) => horario.horaFin && horario.horaFin <= horario.horaInicio);
if (invertido) {
  mostrarMensaje(region, 'La hora de fin debe ser posterior a la hora de inicio en todos los horarios.', 'error');
  return;
}
```

Se coloca **antes** de invocar `actualizarClase()`, por lo que el dato inválido no llega a persistirse. La comparación de cadenas funciona correctamente porque los inputs son `type="time"` y siempre producen formato `HH:MM` de longitud fija. Un horario sin hora de fin (`horaFin` vacío o `null`) sigue siendo válido, igual que antes.

### [B-03] Atributos `autocomplete` — Bajo

**Problema:** los campos de teléfono carecían de `autocomplete="tel"` y los de cédula no indicaban `autocomplete="off"` (WCAG 2.2, 1.3.5).

**Corrección:**

| Archivo | Campo | Atributo añadido |
|---|---|---|
| `index.html` | `#telefono` (contacto) | `autocomplete="tel"` |
| `cliente/checkout.html` | `#telefono` | `autocomplete="tel"` |
| `cliente/login.html` | `#telefono-registro` | `autocomplete="tel"` |
| `cliente/login.html` | `#cedula-registro` | `autocomplete="off"` |
| `cliente/nutricion.html` | `#telefono` | `autocomplete="tel"` |
| `cliente/nutricion.html` | `#cedula` | `autocomplete="off"` |

Solo se añadieron atributos; no se tocó `type`, `pattern`, `required`, `inputmode` ni los mensajes de ayuda.

---

## 3. Pruebas Ejecutadas

### 3.1 Validación de sintaxis (`node --check`)

Aplicada a los 16 archivos de `js/` y `pruebas/`：**16/16 válidos (100 %)**. Sin errores.

### 3.2 Suites existentes del proyecto

Ejecutadas en una sola pasada, sin modificar los archivos de prueba salvo la adición de regresión ya existente para el carrito.

| Suite | Resultado |
|---|---|
| `node pruebas/prueba-logica.mjs` | `exit 0` — todas las comprobaciones pasaron |
| `node pruebas/prueba-repo.mjs` | `exit 0` — todas las comprobaciones pasaron |
| `node pruebas/prueba-selectores.mjs` | `exit 0` — todas las comprobaciones pasaron |
| `node pruebas/prueba-navegador.mjs` | `exit 0` — 5 ejecuciones consecutivas sin fallos (ver §5) |
| `node pruebas/prueba-html.mjs` | `exit 0` — todas las comprobaciones pasaron |
| `node pruebas/prueba-accesibilidad.mjs` | `exit 0` — todas las comprobaciones pasaron |
| `node pruebas/prueba-enlaces.mjs` | `exit 0` — todas las comprobaciones pasaron |
| `node pruebas/prueba-responsive.mjs` | `exit 0` — 4 ejecuciones consecutivas sin fallos |

El aviso `IndexedDB no disponible en la prueba` que imprime `prueba-repo.mjs` es esperado: la suite comprueba precisamente que el código captura la excepción en Node puro.

### 3.3 Verificación funcional de las correcciones de la auditoría

Las suites existentes no cubren `aria-describedby`, el confinamiento de foco, la validación horaria ni el `<noscript>`, así que se ejecutó una verificación adicional en Chromium (29 comprobaciones, todas correctas). No se añadió ningún archivo al proyecto: el script se ejecutó desde el directorio temporal del entorno.

| Hallazgo | Comprobaciones | Resultado |
|---|---|---|
| B-03 | 5 atributos `autocomplete` presentes | Correcto |
| H-01 | `<noscript>` dentro de `<main>`, no renderizado con JS activo, con los tres precios y el correo | Correcto |
| M-01 | Con error: `aria-describedby="ayuda-nombre err-nombre"` y `aria-invalid="true"`. Al corregir: queda `"ayuda-nombre"` y se retira `aria-invalid` | Correcto |
| M-03 | Con el menú abierto a 500 px, el foco no escapa tras tabular los 8 enlaces; `Shift+Tab` vuelve al botón; `Escape` cierra y devuelve el foco | Correcto |
| M-02 | Filas con `row-cols-1`; 2 tarjetas en clases y 3 en entrenadores; ancho de tarjeta igual al de la fila (1140 = 1140 px) | Correcto |
| B-02 | `19:00 → 08:00` se rechaza con mensaje de tipo `error`; `08:00 → 09:30` se acepta | Correcto |
| — | Sin errores de JavaScript en ninguna de las páginas recorridas | Correcto |

---

## 4. Hallazgos Pendientes

### [B-01] Respaldo local de Tailwind y Bootstrap — Bajo — **NO CORREGIDO**

**Motivo:** resolverlo exige descargar y alojar en el repositorio copias de Tailwind CSS y Bootstrap 5, es decir **instalar dependencias y agregar archivos binarios o minificados de terceros**. Esto contradice de forma directa las restricciones de la tarea (no instalar dependencias, no agregar frameworks) y, además, Tailwind se carga en su versión JIT desde CDN precisamente para que las clases/utilidades se generen a partir del marcado; sustituirlo por una copia estática exigiría además un paso de compilación que el proyecto no tiene previsto.

Se mantiene como pendiente consciente. El riesgo real es acotado: solo afecta a entornos sin salida a Internet y sin caché previa del navegador; el sitio ya degrada de forma legible gracias al bloque `<noscript>` de [H-01] y a los estilos propios de `assets/css/styles.css`.

### [B-03] (parte) `autocomplete` en campos de cédula

Resuelto con `autocomplete="off"` según la recomendación literal de la auditoría. Se deja constancia de que el valor técnicamente más correcto según WHATWG sería un token de sección como `autocomplete="section-<id> cedula"`, pero el proyecto no usa agrupamientos de formularios, por lo que `off` es la opción adecuada aquí.

---

## 5. Corrección de `pruebas/prueba-navegador.mjs` (intermitencia real)

**Estado anterior:** la comprobación **`El total de productos es 5`** (`prueba-navegador.mjs:421`) fallaba de forma intermitente, y la sesión anterior decidió no tocar la suite. Ese fue el motivo por el que **el run de CI nº 1 terminó en `failure` y GitHub Pages nunca se publicó**.

**Causa:** la suite leía el DOM después de un tiempo de espera fijo (`waitForTimeout`), pero el panel puebla sus datos de forma asíncrona (`iniciarResumen()` en `js/admin.js` espera cuatro `Promise.all` de Fetch y luego `pintarCitas()`). Con un runner más lento que el equipo local, la lectura llegaba antes de tiempo. La misma clase de carrera affectaba a otras 12 lecturas: contador del carrito, resumen del panel, tabla de productos, catálogo público y confirmaciones de checkout.

**Corrección:** se sustituyeron las esperas fijas por esperas activas sobre el estado esperado del DOM. Se añadieron cuatro utilidades al principio de la suite (`pruebas/prueba-navegador.mjs:37-77`):

| Utilidad | Espera a |
|---|---|
| `esperarTexto(selector, valor)` | que un elemento muestre exactamente ese texto |
| `esperarCantidad(selector, n)` | que un conjunto de elementos tenga `n` nodos |
| `esperarTextoEn(selector, texto)` | que algún elemento del conjunto contenga el texto |
| `esperarVisible(selector)` | que un elemento se muestre en pantalla |
| `contadorCarrito(valor)` | el valor del contador del encabezado, y lo devuelve |

Todas toleran `ESPERA_DOM = 20000` ms y **no lanzan excepción si el estado no llega**: la comprobación que las sigue se ejecuta igual y muestra en el mensaje el valor realmente leído, de modo que un fallo real sigue siendo diagnosticable.

Además, las esperas de navegación tras iniciar sesión (`waitForURL` a `checkout.html` y a `admin/index.html`) subieron de 8 s a 20 s por el mismo motivo.

**Lo que NO se cambió:** ni las aserciones, ni los valores esperados, ni los selectores, ni el código de la aplicación. Solo el momento en que se lee el DOM.

**Verificación:** 5 ejecuciones consecutivas de la suite en local (todas `exit 0`) y run de CI nº 2 en `success`.

### 5 bis. Fallos visibles sin abrir los registros

Los registros de Actions requieren inicio de sesión, así que un fallo solo mostraba `Process completed with exit code 1`. Cada paso de prueba del workflow ahora captura la salida, la muestra y convierte cada línea `FALLA` en una anotación `::error::` visible en la página pública del run:

```bash
codigo=0
node pruebas/prueba-x.mjs > /tmp/salida.txt 2>&1 || codigo=$?
cat /tmp/salida.txt
grep '^FALLA' /tmp/salida.txt | sed -e 's/%/%25/g' -e 's/^/::error::/' || true
exit $codigo
```

El código de salida real se conserva: el paso sigue fallando si la suite falla.

---

## 6. Verificación en GitHub Actions y en GitHub Pages

Workflow: `.github/workflows/ci-cd.yml` (rama `main`).

| Run | Commit | `Comprobaciones de calidad` | `Publicar en GitHub Pages` |
|---|---|---|---|
| nº 1 | `4ba75f4` | **failure** (paso «Recorrido completo en navegador») | **skipped** |
| nº 2 | `0636e5e` | **success** | **success** |

El run nº 1 demuestra que la puerta funciona: `desplegar` tiene `needs: verificar`, así que el fallo de una sola comprobación impide la publicación. El run nº 2 demuestra que con las ocho suites en verde el sitio se publica.

Comprobaciones que ejecuta `verificar`, en orden (cualquiera que falle detiene el pipeline):

1. Sintaxis de JavaScript (`node --check` sobre los 20 archivos `.js` y `.mjs` versionados)
2. `pruebas/prueba-html.mjs` — HTML5 y semántica
3. `pruebas/prueba-accesibilidad.mjs` — WCAG 2.2 AA y ARIA
4. `pruebas/prueba-enlaces.mjs` — seguridad de enlaces externos, embeds de YouTube y rutas internas
5. `pruebas/prueba-logica.mjs` — lógica del carrito y de los planes
6. `pruebas/prueba-repo.mjs` — integridad de los datos
7. `pruebas/prueba-selectores.mjs` — selectores del DOM
8. `pruebas/prueba-navegador.mjs` — recorrido completo en Chromium
9. `pruebas/prueba-responsive.mjs` — responsive, contraste real, ARIA en ejecución y foco visible

Y en `desplegar`, sobre la copia final `_sitio` antes de subirla: `pruebas/prueba-enlaces.mjs _sitio`.

**Publicación verificada.** El sitio está en <https://ariel-as.github.io/Proyecto-Desarrollo-RDA-1/> y se comprobó con un navegador real (Chromium) contra la URL pública, no solo por código de estado:

- carga el catálogo (5 productos), los 3 planes y las 2 clases desde `data/*.json`;
- Tailwind del CDN aplica estilos y no hay desborde horizontal;
- el carrito suma y el panel lateral muestra `$70.00`;
- el inicio de sesión del administrador entra al dashboard y el resumen muestra `5` productos;
- sin errores de JavaScript en la consola.

---

## 7. Archivos Modificados

Correcciones de `AUDITORIA.md` (9 archivos, commit `4ba75f4`):

```
index.html                    +29  (H-01)
js/validation.js              +21  (M-01)
js/app.js                     +32  (M-03)
js/admin.js                   +11  (B-02)
admin/clases.html              ±2  (M-02)
admin/entrenadores.html        ±2  (M-02)
cliente/checkout.html          ±2  (B-03)
cliente/login.html             ±4  (B-03)
cliente/nutricion.html         ±4  (B-03)
```

Correcciones de las pruebas y del CI (2 archivos, commit `0636e5e`):

```
pruebas/prueba-navegador.mjs  +72 −17  (§5: esperas activas en vez de fijas)
.github/workflows/ci-cd.yml   +57 −10  (§5 bis: anotaciones de fallo visibles)
```

`AUDITORIA.md` no fue modificado. No se creó ningún archivo de código nuevo: las correcciones van sobre las pruebas y el workflow que ya existían.