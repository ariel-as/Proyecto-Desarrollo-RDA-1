# Auditoría Técnica No Destructiva — Proyecto PLANETA FITNESS

- **Proyecto:** PLANETA FITNESS — Ecommerce Web
- **Asignatura:** Desarrollo de Plataformas (RDA 1 / Reto 1)
- **Marco de Referencia:** Materiales teóricos Semanas 1 a 6, Requisitos del Proyecto y Buenas Prácticas (WCAG 2.2 AA, Mobile-First, ES6+, Web Storage, MVC)
- **Tipo de Auditoría:** No destructiva (inspección estática de código, verificación de sintaxis, ejecución de suites de pruebas locales y análisis de contraste WCAG). Ningún archivo fuente fue alterado ni se instalaron dependencias externas.
- **Fecha:** Octubre 2026

---

## 1. Resumen Ejecutivo

El proyecto **PLANETA FITNESS** presenta un nivel de madurez técnica, orden arquitectónico y calidad de implementación sobresaliente para el alcance de las Semanas 1 a 6. La aplicación implementa un ecommerce web para un gimnasio en Quito con dos áreas claramente delimitadas: un área pública para clientes (desarrollada con **Tailwind CSS**) y un área administrativa completa (desarrollada con **Bootstrap 5**), evitando colisiones de estilos entre ambos frameworks.

### Puntos Fuertes Identificados:
1. **Accesibilidad y Semántica:** Estructura semántica impecable (`header`, `nav`, `main`, `section`, `article`, `figure`, `footer`, `address`). Jerarquía estricta de encabezados con un único `h1` por página, enlaces de salto al contenido principal (`.pf-saltar`), nombres accesibles en todos los controles interactivos, textos alternativos descriptivos en imágenes informativas y atributos `aria-hidden="true"` en elementos decorativos.
2. **Contraste de Color:** Excelente desempeño en contraste cromático. La combinación de texto amarillo (`#ffd000`) sobre fondo negro (`#0a0a0a`) alcanza un ratio de **13.55:1** (superando con creces el umbral AAA de 7.0:1), el texto blanco sobre grafito alcanza **18.1:1** y el botón primario ofrece **13.55:1**. Los mensajes del panel administrativo ajustan su contraste con la clase `.pf-admin` superando **8.8:1**.
3. **Control del Foco y Diálogos:** Tanto el panel lateral del carrito (*drawer*) como el modal de acceso implementan un confinamiento de foco estricto (`confinarFoco`), soporte para cierre con tecla `Escape`, retorno de foco al elemento desencadenante (`focoAnterior.focus()`) y bloqueo temporal del scroll corporal (`.pf-bloquea-scroll`).
4. **Arquitectura y Modularidad (MVC):** Clara separación de responsabilidades:
   - **Modelo:** `repo.js`, `indexeddb.js`, `storage.js` (acceso a JSON vía Fetch API, persistencia en IndexedDB y Web Storage, resolución de mutaciones administrativas).
   - **Vista:** `view.js` (generación de plantillas HTML sanitizadas con `escapar()`).
   - **Controlador:** `app.js`, `admin.js`, `cart.js`, `auth.js`, `validation.js` (coordinación de eventos, flujo de compra, enrutamiento por `data-pagina` y validación).
5. **Persistencia e Integridad:** Implementación multi-capa bien diferenciada entre `localStorage` (carrito, pedidos, citas, mensajes, mutaciones locales), `sessionStorage` (sesión activa y paso pendiente de compra), `cookies` (consentimiento y marca ISO de última actualización) e `IndexedDB` (`PlanetaFitnessDB` versión 2 con almacenes tipados).
6. **Seguridad Frontend:** Sanitización contextual rigurosa contra ataques XSS mediante `escapar()` en todas las inyecciones de plantillas, hashing de contraseñas de registro con SHA-256 (`crypto.subtle`) y aislamiento de sesión por rol.
7. **Pruebas y Sintaxis:** El 100% de los archivos JavaScript (16 archivos) pasaron la validación de sintaxis (`node --check`). Las 3 suites de pruebas automatizadas sin dependencias (`prueba-logica.mjs`, `prueba-repo.mjs` y `prueba-selectores.mjs`) pasaron con 71/71 comprobaciones exitosas.

### Balance Global de Hallazgos:
- **Hallazgos Críticos:** 0
- **Hallazgos Altos:** 1
- **Hallazgos Medios:** 3
- **Hallazgos Bajos:** 3

---

## 2. Clasificación de Hallazgos

| Nivel | Cantidad | Descripción General |
|---|:---:|---|
| **Crítico** | **0** | No existen errores de sintaxis, fallos catastróficos, bloqueos insalvables ni pérdida de datos. |
| **Alto** | **1** | Dependencia total de JavaScript para el renderizado del catálogo (falta de fallback progresivo o `<noscript>`). |
| **Medio** | **3** | Falta de asociación programática de errores mediante `aria-describedby` en `validation.js`, tarjetas de clases/entrenadores en admin sin contenedor de columna Bootstrap (`col-*`), y ausencia de confinamiento de foco en el menú móvil flotante. |
| **Bajo** | **3** | Dependencia de CDNs externos para Tailwind y Bootstrap sin copia local de respaldo offline, ausencia de validación cruzada de horario fin posterior a inicio en admin, y omisión del atributo `autocomplete` en inputs específicos de teléfono/cédula. |

---

## 3. Evidencia Concreta de Cada Hallazgo

### 3.1 Hallazgos Críticos (0)
*No se encontraron fallos críticos en la inspección.*

---

### 3.2 Hallazgos Altos (1)

#### [H-01] Falta de fallback accesible cuando JavaScript no está disponible (*Progressive Enhancement*)
- **Severidad:** Alta
- **Archivo afectado:** [index.html](file:///c:/Users/chang/OneDrive/Imágenes/Escritorio/Desarrollo de Plataformas/PROYECTO_RDA_1/index.html#L110-L186)
- **Elementos concretos:**
  - Contenedor de planes: `<div data-planes ...>` (Línea 110).
  - Contenedor de tienda: `<div data-catalogo ...>` (Línea 152).
  - Contenedor de clases: `<div data-clases ...>` (Línea 163).
  - Contenedor de entrenadores: `<div data-entrenadores ...>` (Línea 168).
  - Contenedor de rutinas: `<ul data-niveles ...>` (Línea 180).
  - Contenedor de servicios: `<div data-servicios ...>` (Línea 186).
- **Problema:** Todos los contenedores de datos esenciales del sitio inician completamente vacíos en el documento HTML estático y dependen de la ejecución de `app.js` y Fetch API para poblarse. Si el usuario navega con JavaScript deshabilitado, en un entorno de red restrictivo, o si ocurre un fallo previo de script, las secciones `#planes`, `#tienda`, `#clases` y `#rutinas` se muestran en blanco sin advertencia al usuario ni contenido básico alternativo. No existe etiqueta `<noscript>`.
- **Impacto:** Incumple el principio de Mejora Progresiva (*Progressive Enhancement*) enseñado en las Semanas 1 y 2, impidiendo que un usuario acceda a información básica como los precios de los planes, los horarios de clases o el contacto directo si falla la capa de script.

---

### 3.3 Hallazgos Medios (3)

#### [M-01] `mostrarError()` en `validation.js` no vincula dinámicamente el mensaje con `aria-describedby`
- **Severidad:** Media
- **Archivo afectado:** [js/validation.js](file:///c:/Users/chang/OneDrive/Imágenes/Escritorio/Desarrollo de Plataformas/PROYECTO_RDA_1/js/validation.js#L47-L53)
- **Función concreta:** `mostrarError(campo, mensaje)` (Líneas 47 a 53) y `limpiarError(campo)` (Líneas 56 a 66).
- **Problema:** La cabecera del módulo `validation.js` (Línea 11) documenta explícitamente: `"- se vincula al campo con aria-describedby"`. Sin embargo, en la implementación de `mostrarError()`:
  ```javascript
  export function mostrarError(campo, mensaje) {
    const error = elementoError(campo);
    error.textContent = mensaje;
    error.hidden = false;
    campo.setAttribute('aria-invalid', 'true');
    campo.setCustomValidity(mensaje);
  }
  ```
  El atributo `aria-describedby` del campo no es actualizado para incluir el id del elemento de error (`err-${campo.id}`). Aunque el elemento `<p>` tiene `role="alert"` (lo que dispara una lectura inmediata al insertarse), si el usuario vuelve a enfocar el campo mediante teclado (Tab), los lectores de pantalla solo leerán el texto de ayuda estático original (ej. `ayuda-nombre`), sin asociar de manera programática el texto de error actual al campo activo.
- **Impacto:** Afecta WCAG 2.2 criterio 1.3.1 (Información y Relaciones) y criterio 3.3.1 (Identificación de Errores) en navegación asistida secuencial por teclado.

#### [M-02] Tarjetas dinámicas de clases y entrenadores en el área administrativa sin contenedores de columna Bootstrap (`col-*`)
- **Severidad:** Media
- **Archivos afectados:**
  - [admin/clases.html](file:///c:/Users/chang/OneDrive/Imágenes/Escritorio/Desarrollo de Plataformas/PROYECTO_RDA_1/admin/clases.html#L62) (Línea 62: `<div data-clases-admin class="row g-4"></div>`).
  - [admin/entrenadores.html](file:///c:/Users/chang/OneDrive/Imágenes/Escritorio/Desarrollo de Plataformas/PROYECTO_RDA_1/admin/entrenadores.html#L62) (Línea 62: `<div data-entrenadores-admin class="row g-4"></div>`).
  - [js/admin.js](file:///c:/Users/chang/OneDrive/Imágenes/Escritorio/Desarrollo de Plataformas/PROYECTO_RDA_1/js/admin.js#L399) (Línea 399: `<div class="card h-100">`).
  - [js/admin.js](file:///c:/Users/chang/OneDrive/Imágenes/Escritorio/Desarrollo de Plataformas/PROYECTO_RDA_1/js/admin.js#L515) (Línea 515: `<div class="card h-100">`).
- **Problema:** En el sistema de cuadrícula Flexbox de Bootstrap 5, los descendientes directos de una clase `.row` deben ser columnas (`.col-*` o `.col`) o la fila debe definir clases de recuento de columnas (`.row-cols-*`). En `clases.html` y `entrenadores.html`, la función controladora inyecta elementos `<div class="card h-100">` directamente como hijos de `.row g-4`. Al no poseer clases de columna, las tarjetas carecen de las propiedades de dimensionamiento flex (`flex: 0 0 auto`, `width: X%`) y de los rellenos de canaleta horizontal (`--bs-gutter-x`), lo que puede ocasionar que las tarjetas se estiren de forma imprevista o colapsen según el contenido en dispositivos móviles y tabletas.
- **Impacto:** Ruptura del modelo de grilla de Bootstrap 5 en el panel administrativo; riesgo de visualización inconsistente en anchos de 768px y 390px.

#### [M-03] Menú móvil flotante sin confinamiento de foco ni advertencia de escape
- **Severidad:** Media
- **Archivos afectados:**
  - [js/app.js](file:///c:/Users/chang/OneDrive/Imágenes/Escritorio/Desarrollo de Plataformas/PROYECTO_RDA_1/js/app.js#L91-L135) (Función `iniciarMenuMovil`).
  - [assets/css/styles.css](file:///c:/Users/chang/OneDrive/Imágenes/Escritorio/Desarrollo de Plataformas/PROYECTO_RDA_1/assets/css/styles.css#L328-L345) (Clase `.pf-menu.pf-menu-abierto`).
- **Problema:** En vista móvil (< 1024px), el menú se despliega como un panel flotante superpuesto (`position: absolute; top: 100%`). El botón alternador gestiona adecuadamente `aria-expanded` y responde a `Escape`. Sin embargo, no se implementa una trampa de foco mientras está desplegado (a diferencia del panel lateral del carrito que sí cuenta con `confinarFoco`). Si el usuario navega con `Tab` hasta el último enlace del menú y presiona `Tab` nuevamente, el foco salta directamente al botón del carrito y a los elementos del hero que quedan visualmente cubiertos por el menú, desconcertando al usuario de teclado o de magnificación de pantalla.
- **Impacto:** WCAG 2.2 criterio 2.4.3 (Orden del Foco).

---

### 3.4 Hallazgos Bajos (3)

#### [B-01] Dependencia de CDNs para Tailwind CSS y Bootstrap sin respaldo local offline
- **Severidad:** Baja
- **Archivos afectados:**
  - [index.html](file:///c:/Users/chang/OneDrive/Imágenes/Escritorio/Desarrollo de Plataformas/PROYECTO_RDA_1/index.html#L9) (Línea 9: `https://cdn.tailwindcss.com`).
  - [cliente/checkout.html](file:///c:/Users/chang/OneDrive/Imágenes/Escritorio/Desarrollo de Plataformas/PROYECTO_RDA_1/cliente/checkout.html#L9), [cliente/login.html](file:///c:/Users/chang/OneDrive/Imágenes/Escritorio/Desarrollo de Plataformas/PROYECTO_RDA_1/cliente/login.html#L9), [cliente/nutricion.html](file:///c:/Users/chang/OneDrive/Imágenes/Escritorio/Desarrollo de Plataformas/PROYECTO_RDA_1/cliente/nutricion.html#L9).
  - [admin/index.html](file:///c:/Users/chang/OneDrive/Imágenes/Escritorio/Desarrollo de Plataformas/PROYECTO_RDA_1/admin/index.html#L9) (Línea 9: `https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/...`).
- **Problema:** La aplicación no incluye copias locales precompiladas de Tailwind ni de Bootstrap. Si el examinador o el usuario ejecuta el proyecto en un entorno completamente desconectado de Internet (offline) y sin caché previa en el navegador, la interfaz pierde casi la totalidad de su capa visual, mostrando únicamente los estilos básicos de `styles.css`.
- **Impacto:** Resiliencia offline y disponibilidad en entornos de evaluación locales sin salida a internet.

#### [B-02] Ausencia de validación de consistencia horaria (`horaFin > horaInicio`) en la gestión de clases del panel admin
- **Severidad:** Baja
- **Archivo afectado:** [js/admin.js](file:///c:/Users/chang/OneDrive/Imágenes/Escritorio/Desarrollo de Plataformas/PROYECTO_RDA_1/js/admin.js#L476-L498) (Líneas 476 a 498).
- **Problema:** Al editar los horarios de las clases en el panel administrativo, el formulario captura los valores de `horaInicio` y `horaFin` pero no realiza una comprobación de que la hora de término sea posterior a la de inicio antes de invocar a `actualizarClase()`. Un administrador podría registrar accidentalmente un horario con inicio `19:00` y fin `08:00`.
- **Impacto:** Integridad de datos en la capa de administración.

#### [B-03] Ausencia de atributos `autocomplete` específicos en inputs de teléfono y cédula
- **Severidad:** Baja
- **Archivos afectados:**
  - [index.html](file:///c:/Users/chang/OneDrive/Imágenes/Escritorio/Desarrollo de Plataformas/PROYECTO_RDA_1/index.html#L271) (`id="telefono"`).
  - [cliente/login.html](file:///c:/Users/chang/OneDrive/Imágenes/Escritorio/Desarrollo de Plataformas/PROYECTO_RDA_1/cliente/login.html#L144) (`id="cedula-registro"`), [Línea 152](file:///c:/Users/chang/OneDrive/Imágenes/Escritorio/Desarrollo de Plataformas/PROYECTO_RDA_1/cliente/login.html#L152) (`id="telefono-registro"`).
  - [cliente/nutricion.html](file:///c:/Users/chang/OneDrive/Imágenes/Escritorio/Desarrollo de Plataformas/PROYECTO_RDA_1/cliente/nutricion.html#L133) (`id="cedula"`), [Línea 143](file:///c:/Users/chang/OneDrive/Imágenes/Escritorio/Desarrollo de Plataformas/PROYECTO_RDA_1/cliente/nutricion.html#L143) (`id="telefono"`).
- **Problema:** Aunque los campos de nombre y correo poseen `autocomplete="name"` y `autocomplete="email"`, los campos de teléfono carecen de `autocomplete="tel"`, y los campos de cédula no especifican `autocomplete="off"` para evitar sugerencias erróneas del navegador.
- **Impacto:** Usabilidad y recomendación WCAG 2.2 criterio 1.3.5 (Identificación del Propósito de Entrada).

---

## 4. Recomendaciones de Corrección

### Para [H-01] (Fallback sin JavaScript):
Añadir dentro de `index.html` una sección `<noscript>` destacada antes o dentro del `main`:
```html
<noscript>
  <div class="pf-mensaje my-6 mx-auto max-w-6xl" role="alert">
    <strong>Aviso:</strong> Para interactuar con el catálogo completo, agregar productos al carrito y
    gestionar citas se requiere JavaScript. Puedes consultar nuestros planes directamente en recepción
    (Plan Individual $35, 2 personas $60, 3 personas $85) o escribirnos a planetafitness@gmail.com.
  </div>
</noscript>
```

### Para [M-01] (Asociación programática con `aria-describedby`):
En `js/validation.js`, modificar `mostrarError` y `limpiarError` para enlazar dinámicamente el id del mensaje:
```javascript
export function mostrarError(campo, mensaje) {
  const error = elementoError(campo);
  error.textContent = mensaje;
  error.hidden = false;
  campo.setAttribute('aria-invalid', 'true');
  campo.setCustomValidity(mensaje);

  const idError = `err-${campo.id}`;
  const descritos = (campo.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
  if (!descritos.includes(idError)) {
    descritos.push(idError);
    campo.setAttribute('aria-describedby', descritos.join(' '));
  }
}

export function limpiarError(campo) {
  const error = elementoError(campo);
  if (error) {
    error.textContent = '';
    error.hidden = true;
  }
  campo.removeAttribute('aria-invalid');
  campo.setCustomValidity('');

  const idError = `err-${campo.id}`;
  const descritos = (campo.getAttribute('aria-describedby') || '').split(/\s+/).filter((id) => id !== idError);
  if (descritos.length > 0) {
    campo.setAttribute('aria-describedby', descritos.join(' '));
  } else {
    campo.removeAttribute('aria-describedby');
  }
}
```

### Para [M-02] (Columnas Bootstrap en admin de clases y entrenadores):
En `js/admin.js`, envolver las tarjetas generadas en contenedores de columna responsivos:
1. En `pintarClasesAdmin`:
   ```javascript
   contenedor.innerHTML = clases.datos.map((clase) => `
     <div class="col-12 col-lg-6">
       <div class="card h-100">
         ...
       </div>
     </div>
   `).join('');
   ```
2. En `pintarEntrenadoresAdmin`:
   ```javascript
   contenedor.innerHTML = resultado.datos.map((entrenador) => `
     <div class="col-12 col-md-6 col-lg-4">
       <div class="card h-100">
         ...
       </div>
     </div>
   `).join('');
   ```
Alternativamente, agregar `class="row row-cols-1 row-cols-lg-2 g-4"` en `admin/clases.html` y `class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4"` en `admin/entrenadores.html`.

### Para [M-03] (Confinamiento de foco en menú móvil):
En `js/app.js` (`iniciarMenuMovil`), agregar un listener de teclado cuando el menú esté abierto para impedir que el tabulador escape a los elementos de fondo, o cerrar automáticamente el menú cuando se dispare el evento `focusout` fuera de `[data-menu]`.

### Para [B-01] (Respaldo offline de CSS):
Incluir una copia local minificada de Bootstrap (`bootstrap.min.css`) y Tailwind en `assets/css/` o un bundle local para permitir la visualización íntegra sin conexión externa a Internet.

### Para [B-02] (Validación horaria en admin):
En `js/admin.js`, antes de enviar la actualización de la clase, verificar que si existe `horaFin`, su valor sea estrictamente mayor a `horaInicio`:
```javascript
const inconsistente = horarios.some(h => h.horaFin && h.horaFin <= h.horaInicio);
if (inconsistente) {
  mostrarMensaje(region, 'La hora de fin debe ser posterior a la hora de inicio.', 'error');
  return;
}
```

### Para [B-03] (Atributos autocomplete):
Agregar `autocomplete="tel"` en los campos con `type="tel"`, y `autocomplete="off"` en los campos de cédula.

---

## 5. Pruebas que Deberían Repetirse Después de Corregir

1. **Prueba de Accesibilidad Asistida (Lector de Pantalla):**
   - Ejecutar navegación secuencial con NVDA o VoiceOver en los formularios (`#formulario-contacto`, `#formulario-checkout`, `#formulario-nutricion`, `#formulario-registro`).
   - Forzar errores intencionales y comprobar que el lector de pantalla anuncia tanto la invalidación como el texto del error al enfocar el campo (`aria-describedby` y `aria-invalid`).
2. **Prueba de Teclado en Menú Móvil:**
   - Reducir el viewport a < 1024px.
   - Abrir el menú con `Enter` o `Espacio`.
   - Presionar `Tab` repetidamente comprobando que el foco permanece dentro de los enlaces del menú y que al presionar `Escape` se cierra y devuelve el foco al botón disparador.
3. **Prueba de Cuadrícula en Dashboard:**
   - Cargar `admin/clases.html` y `admin/entrenadores.html` en anchos de 390px, 768px y 1200px.
   - Comprobar que las tarjetas de boxeo/bailoterapia y entrenadores adoptan 1, 2 o 3 columnas sin desbordamiento ni colapso de márgenes.
4. **Prueba Sin Conexión (Modo Avión / Offline):**
   - Simular desconexión de red en DevTools.
   - Recargar el sitio y comprobar la resiliencia de la interfaz y la presencia del mensaje informativo en `<noscript>`.
5. **Pruebas de Regresión de la Suite Automatizada:**
   - Ejecutar:
     ```bash
     node pruebas/prueba-logica.mjs
     node pruebas/prueba-repo.mjs
     node pruebas/prueba-selectores.mjs
     ```
   - Verificar que las 71 comprobaciones sigan reportando `OK`.

---

## 6. Matriz de Cobertura de las Semanas 1 a 6

| Semana | Tema / Requisito Evaluado | Estado | Observación / Evidencia |
|:---:|---|:---:|---|
| **1** | **Estructura semántica HTML5** (`header`, `nav`, `main`, `section`, `article`, `aside`, `footer`, `figure`) | **CUMPLE** | Un solo `main` por página, elementos semánticos estructurados en todas las vistas públicas y administrativas. |
| **1** | **Jerarquía de encabezados** (`h1`-`h4`) | **CUMPLE** | Exactamente un único `h1` en cada una de las 10 páginas HTML. Niveles subordinados `h2`, `h3` y `h4` consistentes sin saltos de nivel. |
| **1** | **Accesibilidad básica (WCAG 2.2 AA):** idioma, títulos, textos alternativos | **CUMPLE** | `lang="es"` en todos los documentos; títulos descriptivos; imágenes con `alt` relevante o `alt=""` decorativo. |
| **1** | **Enlace de salto al contenido** (*Skip link*) | **CUMPLE** | Presente y funcional en todas las páginas: `<a class="pf-saltar" href="#contenido">`. Foco visible definido. |
| **1** | **Arquitectura cliente-servidor y tipos de plataformas** | **CUMPLE** | SPA híbrida con navegación interna por anclas y páginas dedicadas complementarias. |
| **2** | **Formularios accesibles:** etiquetas `<label>`, `fieldset`, `legend` | **CUMPLE** | Todos los campos de entrada cuentan con `<label for="...">` asociado. `fieldset` y `legend` usados en nutrición. |
| **2** | **Validación nativa HTML5:** `required`, `pattern`, `type`, `minlength`, `checkValidity()` | **CUMPLE** | Uso exhaustivo de restricciones nativas en checkout, contacto, login, registro y nutrición. |
| **2** | **Validación personalizada y ARIA en formularios** | **HALLAZGO** | Implementada con regex y `setCustomValidity()`, pero `mostrarError` no añade el ID a `aria-describedby` (Hallazgo M-01). |
| **2** | **Contraste de color WCAG 2.2 AA:** mínimo 4.5:1 texto normal, 3:1 texto grande/UI | **CUMPLE** | Medición confirmada: Amarillo/Negro **13.55:1**, Blanco/Negro **19.7:1**, Blanco/Grafito **18.1:1**, Error `#ff8b91`/Grafito **7.75:1**, Admin `.pf-admin` **16.1:1**. Supera ampliamente el estándar. |
| **2** | **Foco visible y teclado:** `:focus-visible` de alto contraste | **CUMPLE** | `:focus-visible` definido con contorno de 3px amarillo (`#ffd000`), offset de 3px y adaptación oscura en fondos claros (`.pf-foco-claro`). |
| **3** | **CSS3 y Modelo de caja:** normalización, bordes, espaciados | **CUMPLE** | Reset coherente, `box-sizing: border-box`, variables CSS nativas (`:root`), transiciones estandarizadas. |
| **3** | **Flexbox y CSS Grid:** maquetación bidimensional y unidimensional | **CUMPLE** | Grid utilizado en el catálogo por categorías, planes y pie; Flexbox en encabezado, menús, botones y tarjetas. |
| **3** | **Media Queries y diseño responsivo:** adaptación móvil, tablet y escritorio | **CUMPLE** | Breakpoints en 360px, 420px, 480px, 640px, 768px, 1024px y 1280px. Sin desbordamiento horizontal (`overflow-x: clip`). |
| **3** | **Integración de Frameworks CSS:** Tailwind CSS (cliente) y Bootstrap 5 (admin) | **HALLAZGO** | Separación arquitectónica limpia sin colisión. Hallazgos menores en falta de soporte offline (B-01) y falta de clases `col-*` en dos vistas admin (M-02). |
| **3** | **Preferencia de movimiento reducido:** `prefers-reduced-motion` | **CUMPLE** | Regla explícita en `styles.css:1168` desactivando animaciones y transiciones (duración `0.01ms`). |
| **4** | **JavaScript moderno (ES6+):** módulos, funciones flecha, destructuring, template strings | **CUMPLE** | 100% código modular nativo (`type="module"`), sin variables globales obsoletas (`var`), uso estricto de `const`/`let`. |
| **4** | **Estructuras de datos y métodos funcionales:** `Map`, `Set`, `find`, `filter`, `reduce` | **CUMPLE** | Agrupación dinámica por categorías, cálculos matemáticos de carrito y normalización de conjuntos con `Set`. |
| **4** | **Programación asíncrona:** Promesas y `async/await` | **CUMPLE** | Utilizado en todas las operaciones de carga Fetch, transacciones IndexedDB y flujos de autenticación. |
| **4** | **Manejo de excepciones:** `try...catch` defensivo | **CUMPLE** | Implementado en todas las lecturas de `storage.js`, `repo.js` e `indexeddb.js`. Cero fallos no controlados. |
| **4** | **Seguridad contra XSS:** escape de entidades HTML en inyección de datos | **CUMPLE** | Función `escapar()` aplicada rigurosamente en cada propiedad dinámica antes de renderizar en el DOM. |
| **5** | **Manipulación del DOM y eventos:** delegación y desacoplamiento | **CUMPLE** | Event delegation en tablas, tarjetas y líneas del carrito. Despacho de eventos personalizados (`carrito:actualizado`). |
| **5** | **Consumo de datos con Fetch API:** lectura de archivos JSON locales | **CUMPLE** | Carga asíncrona de los 5 archivos JSON con validación de respuesta (`response.ok`) y formato de array. |
| **5** | **Manejo de estados de carga y error de red:** `aria-busy` y spinners | **CUMPLE** | Indicadores visuales de spinner y atributos `aria-busy="true"` dinámicos con anuncio en `aria-live`. |
| **5** | **Web Storage:** `localStorage` y `sessionStorage` | **CUMPLE** | Persistencia íntegra del carrito, citas, pedidos y mutaciones; sesiones temporales en `sessionStorage`. |
| **5** | **Cookies:** gestión de preferencias y expiración | **CUMPLE** | Cookie `pf_aviso_cookies` (180 días) y marca `ultimaActualizacion` (7 días) con directiva `SameSite=Lax`. |
| **5** | **IndexedDB:** base de datos estructurada en el navegador | **CUMPLE** | `PlanetaFitnessDB` (v2) con 6 almacenes de objetos, soporte transaccional `readonly`/`readwrite` y sincronización con Fetch. |
| **6** | **jQuery:** fundamentos y manipulación | **NO APLICA** | El proyecto utiliza JavaScript ES6+ moderno y DOM API nativo, prescindiendo intencionalmente de jQuery sin penalizar funcionalidad. |
| **6** | **Arquitectura MVC / separación de responsabilidades** | **CUMPLE** | Separación física y lógica entre Modelo (`repo.js`, `indexeddb.js`), Vista (`view.js`) y Controlador (`app.js`, `admin.js`, etc.). |
| **6** | **Formatos de intercambio alternativos:** CSV / XML | **NO APLICA** | El proyecto utiliza JSON como formato estándar estructurado de acuerdo con sus requerimientos. |
| **6** | **Almacenamiento local avanzado:** `sql.js` (SQLite en navegador) o Firebase | **NO APLICA** | El almacenamiento local avanzado se implementó mediante la API estándar nativa de `IndexedDB` recomendada para frontend puro sin backend. |
| **6** | **Seguridad y autenticación académica:** distinción con backend real | **CUMPLE** | El sistema declara explícitamente en UI y documentación que el login es una simulación académica sin backend remoto. |

---

## 7. Pruebas Realizadas, Resultados Obtenidos y Limitaciones

### 7.1 Pruebas Efectivamente Ejecutadas en el Entorno

1. **Comprobación Estática de Sintaxis JavaScript (`node --check`):**
   - **Comando:** Validación individual de todos los scripts bajo `js/`, `assets/js/` y `pruebas/`.
   - **Resultado:** **16/16 archivos válidos (100% OK).**
   - **Archivos evaluados:** `admin.js`, `app.js`, `auth.js`, `carrito-panel.js`, `cart.js`, `indexeddb.js`, `repo.js`, `storage.js`, `validation.js`, `view.js`, `identidad.js`, `prueba-logica.mjs`, `prueba-repo.mjs`, `prueba-selectores.mjs`, `prueba-navegador.mjs`, `servidor.mjs`.

2. **Suite de Lógica de Carrito y Validaciones (`node pruebas/prueba-logica.mjs`):**
   - **Resultado:** **22/22 comprobaciones exitosas (OK).**
   - **Aspectos validados:**
     - Cálculo de subtotal y total con múltiples productos.
     - Formato de moneda en dólares (`$45.00`).
     - Incremento de unidades y límite máximo (`CANTIDAD_MAXIMA = 20`).
     - Eliminación de línea al llegar a cantidad 0.
     - Persistencia del carrito en `localStorage`.
     - Regla de negocio de planes: un plan es suscripción mensual limitada a 1 unidad (`CANTIDAD_MAXIMA_PLAN = 1`).
     - Convivencia de productos físicos y planes de suscripción en el mismo pedido.
     - Validaciones regex de cédula ecuatoriana (10 dígitos exactos).
     - Validaciones regex de número celular (09 seguido de 8 dígitos).
     - Validación de contraseñas robustas (letras y números, longitud).

3. **Suite de Repositorio y Fallback (`node pruebas/prueba-repo.mjs`):**
   - **Resultado:** **10/10 comprobaciones exitosas (OK).**
   - **Aspectos validados:**
     - Lectura y parsing de `data/productos.json` (5 productos).
     - Origen inicial de datos identificado como `'fetch'`.
     - Fusión de mutaciones administrativas sobre datos base del JSON sin duplicados.
     - Eliminación lógica de productos, actualización de precios y alta de nuevos productos.
     - Integridad de los 3 planes y sus valores mensuales ($35, $60, $85).
     - Captura controlada de excepción cuando IndexedDB no está disponible en entorno Node puro.

4. **Suite de Selectores, Controladores e Imágenes (`node pruebas/prueba-selectores.mjs`):**
   - **Resultado:** **39/39 comprobaciones exitosas (OK).**
   - **Aspectos validados:**
     - Coincidencia exacta de `data-pagina` y controladores en las 10 páginas HTML.
     - Existencia física en el DOM de los selectores vinculados a los controladores (14 selectores en `index.html`, 10 en `checkout.html`, 5 en `nutricion.html`, 8 en `login.html`, etc.).
     - Presencia de las 7 anclas internas en `index.html` (`#inicio`, `#planes`, `#tienda`, `#clases`, `#rutinas`, `#nutricion`, `#contacto`).
     - Verificación de ausencia de enlaces rotos o legados.
     - Existencia física en disco de las 17 imágenes referenciadas en el catálogo y la estructura.

5. **Auditoría Matemática de Contraste Cromático (Fórmula WCAG 2.2 AA):**
   - **Resultado:** Todos los elementos inspeccionados cumplen holgadamente el criterio 1.4.3:
     - Amarillo `--pf-amarillo` (`#ffd000`) sobre Negro `--pf-negro` (`#0a0a0a`): **13.55:1** (Supera AA 4.5:1 y AAA 7.0:1).
     - Amarillo sobre Grafito `--pf-grafito` (`#151515`): **12.44:1** (Supera AAA).
     - Texto Blanco (`#ffffff`) sobre Negro (`#0a0a0a`): **19.7:1** (Supera AAA).
     - Texto Blanco sobre Grafito (`#151515`): **18.1:1** (Supera AAA).
     - Texto Gris `--pf-gris` (`#a0a0a0`) sobre Negro: **7.45:1** (Supera AAA).
     - Texto Gris sobre Grafito: **6.84:1** (Supera AA).
     - Texto de Error `#ff8b91` sobre Grafito: **7.75:1** (Supera AAA).
     - Botón primario (`.pf-boton-primario`): texto negro sobre fondo amarillo: **13.55:1** (Supera AAA).
     - Área Admin (`.pf-admin`): texto `--pf-carbon` sobre `.bg-light` (`#f8f9fa`): **16.1:1** (Supera AAA).
     - Mensajes Admin (`.pf-admin .pf-mensaje`): texto oscuro `#4a3b00` sobre `#fff8dc`: **9.6:1**; error `#8a1119` sobre `#fde8e9`: **8.85:1** (Superan AAA).

---

### 7.2 Limitaciones de la Auditoría

1. **Entorno de Navegador Automatizado (Playwright):**
   - El script `pruebas/prueba-navegador.mjs` no pudo ser ejecutado en esta sesión debido a que el paquete `playwright` no se encuentra instalado en el entorno local de Node.js del sistema (`require('playwright')` no disponible). Siguiendo las instrucciones de estricta no-destructividad, **no se instalaron dependencias**.
2. **Inspección Visual Táctil en Dispositivos Físicos:**
   - La respuesta táctil a 320px y 390px, el renderizado de fuentes específicas de sistemas operativos móviles (iOS Safari / Android Chrome) y el comportamiento dinámico del scroll inercial no pudieron ser probados en hardware móvil real. Estas validaciones se deducen a partir de las reglas CSS estáticas (`media queries`, `min-width`, `aspect-ratio`, `touch-action`, `overflow-x: clip`) y se documentan como pruebas pendientes recomendadas.
3. **Lectores de Pantalla Específicos:**
   - No se dispone de un emulador interactivo de NVDA o VoiceOver dentro del entorno de consola. La evaluación de accesibilidad se basó en el análisis estricto del árbol semántico, roles ARIA, cálculo de nombres accesibles y directivas WCAG 2.2 inspeccionadas en el código fuente.

---

## 8. Conclusión

El proyecto **PLANETA FITNESS** demuestra una implementación técnica rigurosa, limpia y profesional. Cumple plenamente con los objetivos de aprendizaje del **Reto 1 (Semanas 1 a 6)** de la asignatura *Desarrollo de Plataformas*. La separación entre el área cliente (Tailwind CSS) y el panel administrativo (Bootstrap 5) está muy bien ejecutada, los contrastes visuales son excelentes, el manejo del carrito como panel lateral es accesible y robusto, y la arquitectura modular en capas (MVC) sienta bases sólidas para la futura evolución hacia backend con Node.js y Express (Reto 2). 

Los hallazgos detectados son de carácter correctivo menor (principalmente el agregado de `<noscript>` para mejora progresiva, el ajuste fino de `aria-describedby` en los mensajes de error dinámicos y la inclusión de contenedores de columna en dos vistas del panel administrativo), ninguno de los cuales compromete la operatividad general del prototipo.
