# Informe de Auditoría Técnica — Accesibilidad WCAG 2.2 AA, UX y Diseño Responsive

- **Proyecto:** PLANETA FITNESS — Ecommerce Web
- **Asignatura:** Desarrollo de Plataformas (RDA 1)
- **Alcance de archivos auditados:**
  - `index.html` (Página de inicio y vitrina principal del sitio)
  - `assets/css/styles.css` (Hoja de estilos propia, referenciada en la solicitud como `syles.css`)
  - Módulos JavaScript del cliente: `js/app.js`, `js/view.js`, `js/carrito-panel.js`, `js/validation.js`, `js/cart.js`, `js/storage.js`, `js/repo.js` y `assets/js/identidad.js` (arquitectura modular que cumple las funciones de `script.js`)
- **Marco normativo y técnico:**
  - Pautas de Accesibilidad para el Contenido Web (WCAG 2.2 Nivel AA)
  - Heurísticas de Usabilidad y Experiencia de Usuario (UX) para interfaces web y móviles
  - Responsive Web Design y principios *Mobile-First* (evaluado a 320px, 390px, 768px y escritorio >= 1024px)
- **Tipo de auditoría:** No destructiva. No se modificó ningún archivo del repositorio ni se instalaron dependencias externas.
- **Entorno de verificación:** Node.js v24.21.0 sobre Windows.

---

## 1. Resumen Ejecutivo

La presente auditoría evalúa la calidad técnica, accesibilidad web, experiencia de uso y adaptabilidad responsive de la solución web **Planeta Fitness**. Tras las correcciones previas documentadas en `RESULTADOS_CORRECCIONES.md`, el proyecto exhibe una base técnica sólida: un único `<h1>` por página, enlaces de salto al contenido principal, marcado alternativo accesible para navegación sin JavaScript (`<noscript>`), control estricto del foco en diálogos modales, y una suite de pruebas automatizadas locales que valida con éxito la integridad lógica, rutas y referencias ARIA.

La evaluación sobre los archivos `index.html`, `assets/css/styles.css` y la arquitectura JavaScript (`js/app.js` y módulos dependientes) arrojó un nivel de conformidad elevado, pero permitió identificar **hallazgos concretos y demostrables en el código** que impactan directamente el cumplimiento de las WCAG 2.2 AA en dispositivos móviles y tecnologías de asistencia.

### Balance de Hallazgos

| Nivel de Severidad | Cantidad | Resumen del Impacto |
|---|:---:|---|
| **Crítico** | **0** | No se encontraron fallos de sintaxis, cuelgues de ejecución (*crashes*), pérdida de datos ni bloqueos insalvables de navegación. |
| **Alto** | **1** | Pérdida de nombre accesible en el botón del menú móvil en anchos < 375px (320px) debido a regla CSS `display: none` sin `aria-label` de respaldo (WCAG 2.2 SC 4.1.2 Nivel A). |
| **Medio** | **4** | Objetivos táctiles inferiores a 24x24px en enlaces del pie (WCAG 2.2 SC 2.5.8); botón `.pf-quitar` con baja separación y bajo contraste en hover; contraste insuficiente (< 3:1) en bordes de campos de formulario (WCAG 2.2 SC 1.4.11); y redundancia/aplanamiento de jerarquía `h3` en tarjetas de catálogo dinámico (WCAG 2.2 SC 1.3.1). |
| **Bajo** | **4** | Referencia inicial `aria-controls="panel-carrito"` apunta a un nodo ausente antes de la inyección por JS; riesgo de cuerpo oculto por `pf-posicion-pendiente` si un recurso externo se demora; omisión de `aria-label` estático en botón de carrito para < 450px; y dependencia de CDN dinámico de Tailwind para utilidades sin respaldo local offline. |

---

## 2. Clasificación de Hallazgos

### 2.1 Hallazgos Críticos (0)
*No se evidenciaron bloqueos críticos en la inspección estática ni en la ejecución de scripts.*

### 2.2 Hallazgos Altos (1)
- **[H-01] Nombre accesible ausente en el botón de menú móvil en 320px** (WCAG 2.2 SC 4.1.2: Nombre, función, valor — Nivel A).

### 2.3 Hallazgos Medios (4)
- **[M-01] Objetivos táctiles inferiores al mínimo de 24x24px y espaciado estrecho en enlaces del pie** (WCAG 2.2 SC 2.5.8: Tamaño del objetivo táctil mínimo — Nivel AA).
- **[M-02] Botón «Eliminar del carrito» (`.pf-quitar`) con altura táctil reducida, proximidad de riesgo y bajo contraste cromático en `:hover`** (WCAG 2.2 SC 2.5.8 y SC 1.4.3).
- **[M-03] Contraste visual insuficiente en el borde de los controles de formulario (`input`, `textarea`)** (WCAG 2.2 SC 1.4.11: Contraste de elementos no textuales — Nivel AA).
- **[M-04] Jerarquía de encabezados aplanada en componentes dinámicos de catálogo generados por `view.js`** (WCAG 2.2 SC 1.3.1: Información y relaciones — Nivel A).

### 2.4 Hallazgos Bajos (4)
- **[B-01] Atributo `aria-controls="panel-carrito"` referencia un ID no presente en el árbol DOM estático inicial** (WCAG 2.2 SC 1.3.1 y Robustez).
- **[B-02] Bloqueo visual preventivo (`visibility: hidden`) acoplado exclusivamente al evento `load`** (UX y Resiliencia Frontend).
- **[B-03] Botón del carrito sin texto descriptivo inicial antes de la ejecución de JS en viewports < 450px** (WCAG 2.2 SC 4.1.2).
- **[B-04] Compilación en cliente de Tailwind CSS mediante script de desarrollo (*Play CDN*) sin paquete compilado offline** (Rendimiento y Resiliencia).

---

## 3. Evidencia Concreta de Cada Hallazgo

### 3.1 Hallazgo Alto

#### [H-01] Pérdida de nombre accesible en el botón de menú móvil a 320px
- **Severidad:** Alta
- **Criterio violado:** WCAG 2.2 SC 4.1.2 (*Name, Role, Value* — Nivel A)
- **Archivos afectados:**
  - [`index.html`](file:///c:/Users/chang/OneDrive/Imágenes/Escritorio/Desarrollo de Plataformas/PROYECTO_RDA_1/index.html#L79-L85) (Líneas 79 a 85)
  - [`assets/css/styles.css`](file:///c:/Users/chang/OneDrive/Imágenes/Escritorio/Desarrollo de Plataformas/PROYECTO_RDA_1/assets/css/styles.css#L205-L217) (Líneas 205 a 217)
- **Evidencia en código:**
  En `index.html`:
  ```html
  <button
    type="button"
    class="pf-boton pf-boton-secundario pf-menu-boton"
    data-menu-boton
    aria-expanded="false"
    aria-controls="menu-principal">
    <span aria-hidden="true">&#9776;</span> <span class="pf-menu-boton-texto">Menú</span>
  </button>
  ```
  En `assets/css/styles.css`:
  ```css
  /* Línea 205 */
  .pf-carrito-texto,
  .pf-menu-boton-texto {
    display: none;
  }

  /* Línea 213 */
  @media (min-width: 375px) {
    .pf-menu-boton-texto {
      display: inline;
    }
  }
  ```
- **Demostración técnica del fallo:**
  1. En viewports menores a 375px (como la resolución obligatoria de 320px), la clase `.pf-menu-boton-texto` recibe `display: none;`.
  2. El icono de barras `&#9776;` posee explícitamente `aria-hidden="true"`, por lo que es descartado por el árbol de accesibilidad.
  3. De acuerdo con el estándar de cómputo de nombres accesibles del W3C (*Accessible Name and Description Computation 1.2, Paso 2A*), los nodos con `display: none` son ignorados y no transfieren su texto accesible a los padres.
  4. Como la etiqueta `<button>` no posee un atributo `aria-label="Menú principal"`, su nombre accesible computado en 320px es **vacío (`""`)**. Los lectores de pantalla (TalkBack en Android o VoiceOver en iOS) anuncian únicamente *"Botón"* sin ninguna indicación de su función.

---

### 3.2 Hallazgos Medios

#### [M-01] Objetivos táctiles inferiores a 24x24px y espaciado estrecho en enlaces del pie
- **Severidad:** Media
- **Criterio violado:** WCAG 2.2 SC 2.5.8 (*Target Size (Minimum)* — Nivel AA) y Heurística UX de usabilidad táctil.
- **Archivo afectado:** [`index.html`](file:///c:/Users/chang/OneDrive/Imágenes/Escritorio/Desarrollo de Plataformas/PROYECTO_RDA_1/index.html#L350-L366) (Líneas 350 a 366).
- **Evidencia en código:**
  ```html
  <nav aria-label="Secciones del sitio">
    <h2 class="text-base font-bold text-white">Secciones</h2>
    <ul class="mt-2 space-y-1 text-sm">
      <li><a href="#planes" class="underline hover:text-pf-amarillo">Planes</a></li>
      <li><a href="#tienda" class="underline hover:text-pf-amarillo">Tienda</a></li>
      <li><a href="#clases" class="underline hover:text-pf-amarillo">Clases</a></li>
      <li><a href="#rutinas" class="underline hover:text-pf-amarillo">Rutinas</a></li>
      <li><a href="cliente/nutricion.html" class="underline hover:text-pf-amarillo">Nutrición</a></li>
      <li><a href="#contacto" class="underline hover:text-pf-amarillo">Contacto</a></li>
    </ul>
  </nav>
  ```
- **Demostración técnica del fallo:**
  1. En Tailwind CSS, `text-sm` fija un `font-size: 0.875rem` con un `line-height: 1.25rem` (20 píxeles).
  2. Los enlaces `<a>` son elementos en línea que no declaran relleno vertical (*padding*), por lo que el alto del área interactiva es de **20px**, por debajo del umbral mínimo de **24px** requerido por el criterio 2.5.8 de WCAG 2.2.
  3. La separación entre elementos la aporta `space-y-1` (`margin-top: 0.25rem = 4px`). La distancia entre centros geométricos de enlaces contiguos es de 24px (20px de altura + 4px de margen). Si se traza un círculo de 24px centrado en un enlace, este colisiona directamente con el círculo del enlace adyacente.
  4. En pantallas móviles de 320px y 390px, el usuario corre alto riesgo de activar el enlace equivocado al tocar con el dedo.

#### [M-02] Botón «Eliminar del carrito» con área táctil insuficiente y bajo contraste en `:hover`
- **Severidad:** Media
- **Criterio violado:** WCAG 2.2 SC 2.5.8 (*Target Size Minimum*) y WCAG 2.2 SC 1.4.3 (*Contrast (Minimum)* — Nivel AA).
- **Archivos afectados:**
  - [`assets/css/styles.css`](file:///c:/Users/chang/OneDrive/Imágenes/Escritorio/Desarrollo de Plataformas/PROYECTO_RDA_1/assets/css/styles.css#L1000-L1015) (Líneas 1000 a 1015)
  - [`js/carrito-panel.js`](file:///c:/Users/chang/OneDrive/Imágenes/Escritorio/Desarrollo de Plataformas/PROYECTO_RDA_1/js/carrito-panel.js#L228-L230) (Líneas 228 a 230)
- **Evidencia en código:**
  En `styles.css`:
  ```css
  .pf-quitar {
    align-self: flex-start;
    background: none;
    border: none;
    padding: 0;
    color: var(--pf-gris);
    font-size: 0.8rem;
    font-weight: 600;
    text-decoration: underline;
    cursor: pointer;
  }

  .pf-quitar:hover {
    color: var(--pf-rojo);
  }
  ```
  En `carrito-panel.js`:
  ```javascript
  <div class="pf-linea-precios">${controlCantidad(item)}
    <span class="pf-precio">${formatearPrecio(item.precio * item.cantidad)}</span>
  </div>
  <button type="button" class="pf-quitar" data-quitar="${escapar(item.id)}">
    Eliminar del carrito
  </button>
  ```
- **Demostración técnica del fallo:**
  1. Al tener `padding: 0;` y tamaño de fuente `0.8rem` (12.8px), su altura física es de apenas ~16px, incumpliendo los 24px mínimos para controles táctiles en el panel lateral móvil.
  2. Su contenedor `.pf-linea-detalle` tiene `gap: 0.35rem;` (5.6px) respecto a los controles de cantidad `[+]` y `[-]`, provocando errores frecuentes de pulsación accidental.
  3. En estado `:hover`, el color cambia a `--pf-rojo` (`#e21b23`). El cálculo matemático de contraste de `#e21b23` sobre el fondo del drawer `#151515` (Grafito) arroja un ratio de **3.54:1**, inferior al mínimo de **4.5:1** exigido para texto normal de 12.8px.

#### [M-03] Contraste visual insuficiente en el contorno de los campos de formulario
- **Severidad:** Media
- **Criterio violado:** WCAG 2.2 SC 1.4.11 (*Non-text Contrast* — Nivel AA).
- **Archivos afectados:**
  - [`assets/css/styles.css`](file:///c:/Users/chang/OneDrive/Imágenes/Escritorio/Desarrollo de Plataformas/PROYECTO_RDA_1/assets/css/styles.css#L720-L726) (Líneas 720 a 726)
  - [`index.html`](file:///c:/Users/chang/OneDrive/Imágenes/Escritorio/Desarrollo de Plataformas/PROYECTO_RDA_1/index.html#L298-L327) (Líneas 298, 307, 316, 327)
- **Evidencia en código:**
  En `styles.css`:
  ```css
  input,
  select,
  textarea {
    background-color: var(--pf-grafito); /* #151515 */
    color: var(--pf-blanco);             /* #ffffff */
    border: 1px solid var(--pf-linea);   /* #2e2e2e */
  }
  ```
  En `index.html`:
  ```html
  <input class="mt-1 w-full rounded-lg border border-pf-linea p-2" type="text" id="nombre" ...>
  ```
- **Demostración técnica del fallo:**
  1. El formulario de contacto se ubica sobre el fondo general `--pf-negro` (`#0a0a0a`).
  2. El interior del campo es `--pf-grafito` (`#151515`). El ratio entre `#151515` y `#0a0a0a` es de solo **1.08:1**, por lo que el cuerpo del campo no contrasta visualmente con la página.
  3. La única pista visual que delimita el campo es el borde `--pf-linea` (`#2e2e2e`).
  4. El ratio de contraste entre `#2e2e2e` y `#0a0a0a` es de **1.46:1**, y frente al interior `#151515` es de **1.34:1**.
  5. WCAG 2.2 SC 1.4.11 exige un ratio de contraste de al menos **3.0:1** contra el fondo adyacente para los bordes que identifican controles de formulario activos. Los usuarios con visión reducida o pantallas con brillo atenuado no pueden distinguir los campos del formulario.

#### [M-04] Jerarquía de encabezados aplanada en componentes dinámicos de catálogo generados por `view.js`
- **Severidad:** Media
- **Criterio violado:** WCAG 2.2 SC 1.3.1 (*Info and Relationships* — Nivel A).
- **Archivos afectados:**
  - [`js/view.js`](file:///c:/Users/chang/OneDrive/Imágenes/Escritorio/Desarrollo de Plataformas/PROYECTO_RDA_1/js/view.js#L55-L89) (Líneas 55 y 89)
  - [`index.html`](file:///c:/Users/chang/OneDrive/Imágenes/Escritorio/Desarrollo de Plataformas/PROYECTO_RDA_1/index.html#L189-L233) (Líneas 189, 211, 228)
- **Evidencia en código:**
  En `view.js`:
  ```javascript
  /* Línea 89 - Título de Categoría */
  <h3 id="categoria-${slug}" class="pf-tienda-titulo">${escapar(categoria)}</h3>
  ...
  /* Línea 55 - Nombre del Producto dentro de la misma categoría */
  <h3 class="text-lg font-bold text-white">${escapar(producto.nombre)}</h3>
  ```
- **Demostración técnica del fallo:**
  1. En la sección `#tienda`, el título principal es `<h2 id="titulo-tienda">Tienda</h2>`.
  2. La función `seccionCategoriaTienda()` asigna un `<h3>` al título de la categoría (ej. "Suplementos").
  3. Dentro de esa misma sección, cada tarjeta de producto generada por `tarjetaProducto()` declara también un `<h3>` para el nombre del producto (ej. "Creatina Creapure 300g").
  4. Estructuralmente, los productos se presentan como hermanos del título de su propia categoría en vez de depender jerárquicamente de él.
  5. Este mismo patrón se repite en `#clases`: la subsección `<h3>Entrenadores</h3>` contiene tarjetas de entrenador generadas con `<h3>`, y en `#rutinas` el bloque `<h3>Servicios</h3>` contiene tarjetas de servicio generadas con `<h3>`.

---

### 3.3 Hallazgos Bajos

#### [B-01] Referencia estática `aria-controls="panel-carrito"` apunta a un ID no presente en el HTML inicial
- **Severidad:** Baja
- **Archivo afectado:** [`index.html`](file:///c:/Users/chang/OneDrive/Imágenes/Escritorio/Desarrollo de Plataformas/PROYECTO_RDA_1/index.html#L72) (Línea 72) frente a [`js/carrito-panel.js`](file:///c:/Users/chang/OneDrive/Imágenes/Escritorio/Desarrollo de Plataformas/PROYECTO_RDA_1/js/carrito-panel.js#L46) (Línea 46).
- **Problema:** El botón estático declara `aria-controls="panel-carrito"`, pero el elemento `<aside id="panel-carrito">` no existe en el DOM inicial: se inyecta por código JavaScript en `iniciarPanelCarrito()`. En validadores automáticos estáticos o antes de que el script cargue, la referencia ARIA queda rota temporalmente.

#### [B-02] Bloqueo preventivo `visibility: hidden` acoplado al evento `load`
- **Severidad:** Baja
- **Archivos afectados:** [`index.html`](file:///c:/Users/chang/OneDrive/Imágenes/Escritorio/Desarrollo de Plataformas/PROYECTO_RDA_1/index.html#L19-L26) (Líneas 19 a 26) y [`assets/css/styles.css`](file:///c:/Users/chang/OneDrive/Imágenes/Escritorio/Desarrollo de Plataformas/PROYECTO_RDA_1/assets/css/styles.css#L391-L393) (Líneas 391 a 393).
- **Problema:** Cuando el usuario accede con un ancla (ej. `index.html#tienda`), el script en `<head>` añade la clase `pf-posicion-pendiente`, que oculta el `<body>` con `visibility: hidden`. El desbloqueo de respaldo espera a `addEventListener('load', ...)`. Si una imagen de gran tamaño o un recurso externo CDN sufre latencia alta o se congela, el cuerpo del documento permanece invisible para el usuario.

#### [B-03] Botón del carrito sin nombre accesible en marcado HTML estático (< 450px)
- **Severidad:** Baja
- **Archivos afectados:** [`index.html`](file:///c:/Users/chang/OneDrive/Imágenes/Escritorio/Desarrollo de Plataformas/PROYECTO_RDA_1/index.html#L67-L76) y [`assets/css/styles.css`](file:///c:/Users/chang/OneDrive/Imágenes/Escritorio/Desarrollo de Plataformas/PROYECTO_RDA_1/assets/css/styles.css#L205).
- **Problema:** En anchos menores a 450px, `.pf-carrito-texto` tiene `display: none;`. Aunque `actualizarContadorCarrito()` en `view.js` asigna dinámicamente un `aria-label`, en el HTML estático inicial el botón no posee `aria-label`. Si la inicialización del script se retrasa, el nombre accesible del botón se reduce al carácter del contador "0".

#### [B-04] Compilación en cliente de Tailwind CSS mediante CDN de prueba
- **Severidad:** Baja
- **Archivo afectado:** [`index.html`](file:///c:/Users/chang/OneDrive/Imágenes/Escritorio/Desarrollo de Plataformas/PROYECTO_RDA_1/index.html#L28) (Línea 28).
- **Problema:** `<script src="https://cdn.tailwindcss.com"></script>` corresponde al script de pruebas JIT de Tailwind, no apto para entornos de producción según la documentación oficial del framework. No dispone de fallback local si falla la red externa.

---

## 4. Recomendación de Corrección para Cada Hallazgo

### Para [H-01] — Nombre accesible en el botón de menú móvil
Añadir el atributo `aria-label="Abrir menú de navegación"` de manera estática al botón en `index.html`:
```html
<button
  type="button"
  class="pf-boton pf-boton-secundario pf-menu-boton"
  data-menu-boton
  aria-label="Abrir menú de navegación"
  aria-expanded="false"
  aria-controls="menu-principal">
  <span aria-hidden="true">&#9776;</span> <span class="pf-menu-boton-texto">Menú</span>
</button>
```
En `js/app.js`, actualizar dinámicamente el `aria-label` según el estado del menú:
```javascript
const abrir = () => {
  boton.setAttribute('aria-expanded', 'true');
  boton.setAttribute('aria-label', 'Cerrar menú de navegación');
  menu.classList.add('pf-menu-abierto');
};

const cerrar = ({ devolverFoco = false } = {}) => {
  boton.setAttribute('aria-expanded', 'false');
  boton.setAttribute('aria-label', 'Abrir menú de navegación');
  menu.classList.remove('pf-menu-abierto');
  if (devolverFoco) boton.focus();
};
```

---

### Para [M-01] — Objetivos táctiles en enlaces del pie de página
En `index.html`, reemplazar `space-y-1` por `space-y-3` o añadir clases de relleno táctil `py-1 inline-block`:
```html
<nav aria-label="Secciones del sitio">
  <h2 class="text-base font-bold text-white">Secciones</h2>
  <ul class="mt-2 space-y-2 text-sm">
    <li><a href="#planes" class="inline-block py-1 underline hover:text-pf-amarillo">Planes</a></li>
    <li><a href="#tienda" class="inline-block py-1 underline hover:text-pf-amarillo">Tienda</a></li>
    <li><a href="#clases" class="inline-block py-1 underline hover:text-pf-amarillo">Clases</a></li>
    <li><a href="#rutinas" class="inline-block py-1 underline hover:text-pf-amarillo">Rutinas</a></li>
    <li><a href="cliente/nutricion.html" class="inline-block py-1 underline hover:text-pf-amarillo">Nutrición</a></li>
    <li><a href="#contacto" class="inline-block py-1 underline hover:text-pf-amarillo">Contacto</a></li>
  </ul>
</nav>
```

---

### Para [M-02] — Botón «Eliminar del carrito» en el drawer
En `assets/css/styles.css`, dotar a `.pf-quitar` de altura mínima accesible (al menos 24px) y corregir el contraste cromático de su estado `:hover`:
```css
.pf-quitar {
  align-self: flex-start;
  background: none;
  border: none;
  padding: 0.35rem 0;
  min-height: 24px;
  color: var(--pf-gris);
  font-size: 0.8rem;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
}

.pf-quitar:hover {
  /* #ff6b72 ofrece un ratio de contraste de 5.75:1 sobre #151515 */
  color: #ff6b72;
}
```

---

### Para [M-03] — Contraste en bordes de campos de formulario
En `assets/css/styles.css`, definir una variable o valor específico para bordes de entrada con ratio superior a 3.0:1 frente a `#151515` y `#0a0a0a`:
```css
:root {
  --pf-borde-control: #5c5c5c; /* Ratio 3.19:1 frente a #151515 y 3.47:1 frente a #0a0a0a */
}

input,
select,
textarea {
  background-color: var(--pf-grafito);
  color: var(--pf-blanco);
  border: 1px solid var(--pf-borde-control);
}
```

---

### Para [M-04] — Jerarquía de encabezados en catálogo dinámico
En `js/view.js`, asignar nivel `<h4>` a los títulos subordinados dentro de categorías, entrenadores y servicios:
1. En `tarjetaProducto(producto)`:
   ```javascript
   <h4 class="text-lg font-bold text-white">${escapar(producto.nombre)}</h4>
   ```
2. En `tarjetaEntrenador(entrenador)`:
   ```javascript
   <h4 class="text-lg font-bold text-white">${escapar(entrenador.nombre)}</h4>
   ```
3. En `tarjetaServicio(servicio)`:
   ```javascript
   <h4 class="text-lg font-bold text-white">${escapar(servicio.nombre)}</h4>
   ```

---

### Para [B-01] y [B-03] — Inicialización de atributos del carrito
Declarar `aria-label="Carrito de compras, vacío"` en el botón de `index.html` e inyectar el contenedor `#panel-carrito` en el marcado HTML estático con el atributo `hidden` para que la referencia `aria-controls` sea válida desde el primer instante:
```html
<button
  type="button"
  class="pf-boton pf-boton-primario pf-carrito"
  data-abrir-carrito
  aria-label="Carrito de compras, vacío"
  aria-expanded="false"
  aria-controls="panel-carrito">
  <span aria-hidden="true">&#128722;</span>
  <span class="pf-carrito-texto">Carrito</span>
  <span class="pf-carrito-contador" data-contador-carrito>0</span>
</button>
```

---

### Para [B-02] — Temporizador incondicional de desbloqueo visual
En `index.html` (script en `<head>`), incorporar un temporizador de escape directo sin esperar al evento `load`:
```html
<script>
  if (location.hash) {
    document.documentElement.classList.add('pf-posicion-pendiente');
    /* Temporizador directo de rescate: nunca dejar la pantalla en blanco más de 800ms */
    setTimeout(function () {
      document.documentElement.classList.remove('pf-posicion-pendiente');
    }, 800);
    addEventListener('load', function () {
      document.documentElement.classList.remove('pf-posicion-pendiente');
    });
  }
</script>
```

---

## 5. Pruebas que Deberían Repetirse Después de Corregir

Una vez implementadas las recomendaciones, debe ejecutarse la siguiente batería de pruebas de regresión y verificación técnica:

### 5.1 Pruebas Automatizadas con Node.js
Ejecutar desde el directorio raíz del proyecto:
1. **Validación estricta de sintaxis en todos los archivos JS:**
   ```powershell
   Get-ChildItem -Recurse -Filter "*.js" | ForEach-Object { node --check $_.FullName }
   ```
2. **Suite de accesibilidad estática y referencias ARIA:**
   ```powershell
   node pruebas/prueba-accesibilidad.mjs
   ```
3. **Suite de validación de marcado HTML y doctype:**
   ```powershell
   node pruebas/prueba-html.mjs
   ```
4. **Suite de integridad de enlaces internos y externos:**
   ```powershell
   node pruebas/prueba-enlaces.mjs
   ```
5. **Suite de lógica de negocio del carrito y validaciones:**
   ```powershell
   node pruebas/prueba-logica.mjs
   ```
6. **Suite del repositorio de datos e IndexedDB:**
   ```powershell
   node pruebas/prueba-repo.mjs
   ```

### 5.2 Pruebas de Accesibilidad Manual y Tecnologías de Asistencia
1. **Lector de Pantalla (NVDA en Windows / VoiceOver en iOS/macOS):**
   - Reducir el ancho de ventana a **320px**.
   - Navegar con tabulador al botón de menú: comprobar que anuncia *"Abrir menú de navegación, botón contraído"* y nunca *"Botón"* sin nombre.
   - Activar el menú: comprobar que anuncia *"Cerrar menú de navegación, botón expandido"*.
   - Verificar que al pulsar `Escape`, el menú se cierra y el foco regresa al botón desencadenante.
2. **Navegación secuencial por teclado (`Tab`, `Shift + Tab`):**
   - Abrir el drawer del carrito pulsando `Enter` en el botón del carrito.
   - Presionar `Tab` repetidamente: verificar que el foco se mantiene ciclando dentro del panel y no salta a los elementos tapados del fondo.
   - Probar que el botón `.pf-quitar` recibe foco con contorno `:focus-visible` nítido y que su texto se lee correctamente.
3. **Inspección de Contraste con analizador cromático (CCA / DevTools):**
   - Medir el contraste del borde de los campos de texto en reposo frente al fondo de la sección `#contacto`: certificar que cumple `>= 3.0:1`.
   - Medir el contraste de `.pf-quitar:hover` sobre `#151515`: certificar que cumple `>= 4.5:1`.

### 5.3 Pruebas de Reflujo y Comportamiento Responsive
Comprobar en el emulador de dispositivos de las herramientas de desarrollador:
1. **320px (Móvil ultra-compacto / iPhone SE 1ra gen):**
   - Verificar que no exista desplazamiento horizontal (`window.scrollX === 0`).
   - Comprobar que el título `h1` ("EVOLUCIONA.") no se corte en el margen derecho.
   - Comprobar que los enlaces del pie de página dispongan de área táctil de separación cómoda sin solapamientos.
2. **390px (Móvil estándar moderno / iPhone 13/14/15):**
   - Verificar que el rótulo "Menú" aparezca junto al icono en el encabezado.
   - Comprobar que las tarjetas de planes, clases y catálogo ocupen el ancho completo sin desbordar los márgenes de 16px (`px-4`).
3. **768px (Tableta vertical / iPad Mini):**
   - Comprobar el salto a 2 columnas en planes, clases y en el formulario de contacto (información a la izquierda, campos a la derecha).
   - Comprobar que el menú desplegable continúe funcionando como panel flotante bajo el encabezado.
4. **1024px y 1280px (Escritorio):**
   - Comprobar que el botón de hamburguesa desaparezca por completo (`display: none;`).
   - Comprobar que la navegación principal se despliegue en línea (`flex-direction: row;`).
   - Comprobar que las tarjetas de catálogo se distribuyan en 3 columnas (`grid-template-columns: repeat(3, 1fr)`).

---

## 6. Matriz de Cumplimiento de Criterios Auditados

A continuación se detalla el veredicto técnico para cada uno de los aspectos analizados en los archivos `index.html`, `assets/css/styles.css` y la arquitectura modular `js/app.js`:

| Criterio / Aspecto | Estado | Justificación y Evidencia en Código |
|---|:---:|---|
| **Estructura semántica** | **CUMPLE** | Empleo riguroso de etiquetas semánticas (`header`, `nav`, `main`, `section`, `article`, `figure`, `figcaption`, `address`, `footer`). Enlace de salto inicial `.pf-saltar` en línea 33 dirigido a `#contenido`. Marcado `<noscript>` en línea 126 con información esencial y tarifas. |
| **Jerarquía de encabezados** | **CUMPLE CON OBSERVACIONES** | Estructura principal perfecta con un único `<h1>` en línea 98 (`#titulo-hero`) y secciones mayores organizadas con `<h2>`. Presenta observación media [M-04] por aplanamiento en `view.js` donde los títulos de productos usan `<h3>` dentro de secciones de categoría que ya son `<h3>`. |
| **Nombres accesibles** | **CUMPLE CON OBSERVACIONES** | Prácticamente la totalidad de botones, enlaces, campos e imágenes informativas poseen nombre accesible calculado. Presenta hallazgo alto [H-01] en el botón de menú móvil en 320px al ocultarse el texto por CSS sin respaldo de `aria-label`. |
| **Textos alternativos** | **CUMPLE** | El 100% de las imágenes tiene atributo `alt`. La imagen decorativa de fondo en el hero (`assets/img/gimnasio/hero-gimnasio.jpg`) incluye `alt=""` y `aria-hidden="true"`. Las imágenes de catálogo, clases y nutrición poseen descripciones informativas concisas. |
| **Contraste de color (Texto)** | **CUMPLE** | Excelente desempeño cromático en textos: `--pf-amarillo` sobre negro ofrece **13.46:1** (supera umbral AAA de 7:1); texto blanco sobre negro **19.80:1**; botón primario **13.46:1**; neutral-300 **13.36:1**; neutral-400 **7.85:1**; texto de error `#ff8b91` **8.13:1**. |
| **Contraste no textual (Bordes)** | **NO CUMPLE** | Hallazgo [M-03]: el borde de los controles de formulario (`#2e2e2e`) sobre el fondo `#0a0a0a` ofrece un ratio de solo **1.46:1**, por debajo del umbral de **3.0:1** exigido por WCAG 2.2 SC 1.4.11. |
| **Navegación con teclado** | **CUMPLE** | Todos los controles interactivos son alcanzables mediante teclado. No existen trampas de foco involuntarias. Orden secuencial lógico y enlaces internos que gestionan el desplazamiento sin desorientar al usuario. |
| **Foco visible** | **CUMPLE** | Indicador global `:focus-visible` definido con contorno contrastado de 3px (`outline: 3px solid var(--pf-amarillo); outline-offset: 3px`). Variante `.pf-foco-claro:focus-visible` para elementos sobre fondo amarillo. Cumple WCAG 2.2 SC 2.4.7 y SC 2.4.11. |
| **Uso de botones y enlaces** | **CUMPLE** | Distinción clara y consistente: `<a>` para saltos de página y anclas; `<button>` para apertura de paneles, modales, operaciones de carrito y envíos de formulario. Todos los botones declaran atributo `type`. |
| **Implementación ARIA** | **CUMPLE** | Sincronización dinámica de `aria-expanded`, `aria-controls`, `aria-live="polite"`, `role="status"` y `role="alert"`. Vinculación programática aditiva de mensajes de error con `aria-describedby` en `validation.js`. |
| **Objetivos táctiles** | **CUMPLE CON OBSERVACIONES** | Botones principales (`.pf-boton`) superan los 44px de altura (`min-height: 2.75rem`). Controles de cantidad miden 36x36px. Presenta hallazgos [M-01] en enlaces del pie (20px de altura con 4px de separación) y [M-02] en botón `.pf-quitar`. |
| **Navegación móvil** | **CUMPLE** | Menú flotante colapsable con control de teclado, cierre con `Escape`, cierre al hacer clic en enlaces de sección, cierre por clic externo y confinamiento de foco en el panel. |
| **Overflow horizontal** | **CUMPLE** | Ausencia total de scroll horizontal gracias a `overflow-x: clip` en `html` y `body`. Comportamiento flexible verificado a 320px, 390px, 768px y resoluciones de escritorio. |
| **Tratamiento de imágenes** | **CUMPLE** | Declaración global `img { max-width: 100%; height: auto; }`. Dimensiones intrínsecas explícitas (`width` y `height`) en todas las imágenes para evitar CLS. Carga diferida (`loading="lazy"`) en imágenes fuera de la primera pantalla. |
| **Estabilidad JavaScript** | **CUMPLE** | 100% de archivos JS superan `node --check`. No se producen excepciones de tipo `null pointer` gracias a comprobaciones defensivas sistemáticas (`select()` con guardas y encadenamiento opcional `?.`). |
