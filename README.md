# Planeta Fitness — Ecommerce web

Proyecto académico de la asignatura **Desarrollo en Plataformas** (RDA 1). Consiste en un sitio
web tipo ecommerce para **Planeta Fitness**, un gimnasio ubicado en Quito, Ecuador.

El sitio tiene dos áreas separadas:

- **Área pública / cliente** (Tailwind CSS): una **página única** (`index.html`) con secciones
  internas (`#inicio`, `#planes`, `#tienda`, `#clases`, `#rutinas`, `#nutricion`, `#contacto`), más
  las páginas independientes de nutrición, login y checkout. El carrito es un **panel lateral**
  disponible en todo el sitio.
- **Área administrativa** (Bootstrap 5): dashboard para gestionar productos, planes, clases,
  entrenadores y las citas de nutrición.

No hay backend ni base de datos remota: toda la información del catálogo vive en archivos JSON
locales y en el almacenamiento del navegador.

---

## Descripción

Planeta Fitness es un gimnasio con dos pisos, clases de boxeo y bailoterapia, rutinas personalizadas
según nivel y una sección de nutrición con cita previa.

El sitio resuelve dos necesidades:

1. Que el cliente se informe y contrate planes, consulte horarios, agende una cita de nutrición y
   compre productos del gimnasio (suplementos y ropa deportiva) con un carrito que no se pierde al
   recargar la página.
2. Que el administrador mantenga esa información sin editar código: agregar, editar o eliminar
   productos, actualizar los planes, cambiar los horarios de las clases y asociar entrenadores.

Los datos reales del gimnasio se respetan tal como fueron proporcionados: tres planes
($35, $60 y $85), boxeo lunes/jueves/viernes de 07:00 a 09:00, bailoterapia martes y jueves de
18:30 a 20:30, lunes a viernes de 06:00 a 21:00, sábado de 09:00 a 12:00 y domingo cerrado. La asesoría
nutricional **no tiene precio publicado**: el sitio indica que requiere cita y que el precio se
consulta en el gimnasio.

---

## Tecnologías

- **HTML5 semántico** (`header`, `nav`, `main`, `section`, `article`, `aside`, `footer`, `figure`).
- **CSS3** con enfoque mobile-first, Flexbox, Grid y Media Queries.
- **Tailwind CSS** para el área cliente (CDN).
- **Bootstrap 5** para el dashboard administrativo (CDN).
- **JavaScript ES6+** con módulos nativos (`import` / `export`), clases, funciones flecha,
  promesas y `async/await`.
- **JSON** local como fuente de datos.
- **Fetch API** para leer los JSON.
- **localStorage**, **sessionStorage**, **IndexedDB** y **cookies** para persistencia.
- **Expresiones regulares** y validación nativa HTML5 en los formularios.
- **ARIA** (`aria-live`, `aria-busy`, `aria-invalid`, `aria-describedby`, `aria-label`).

Tailwind y Bootstrap no se mezclan dentro de la misma interfaz:

```text
Cliente       → Tailwind CSS
Administrador → Bootstrap
```

---

## Estructura

```text
PROYECTO_RDA_1/
│
├── index.html                Página principal (entrada al ecommerce)
├── README.md
│
├── assets/
│   ├── css/
│   │   └── styles.css        Componentes propios, encabezado, tarjetas de clases y tienda, panel y foco visible
│   ├── icons/
│   │   └── favicon.svg
│   ├── js/
│   │   └── identidad.js      Paleta de marca de Tailwind (bg-pf-*, text-pf-*)
│   └── img/
│       ├── logo/             Logo del gimnasio
│       ├── productos/        Fotos del catálogo (JPG)
│       ├── gimnasio/         Hero, pesas, cardio y nutrición (JPG)
│       ├── clases/           Boxeo y bailoterapia (JPG)
│       └── entrenadores/     Los 3 entrenadores (JPG)
│
├── data/
│   ├── productos.json        Productos del ecommerce
│   ├── planes.json           Los 3 planes
│   ├── clases.json           Clases con días y horas
│   ├── entrenadores.json     Los 3 entrenadores
│   └── gimnasio.json         Identidad, horarios, servicios, niveles y usuarios de prueba
│
├── js/
│   ├── app.js                Controlador de las páginas del cliente
│   ├── repo.js               Modelo: Fetch + IndexedDB + cambios del admin
│   ├── view.js               Vista: tarjetas y helpers de presentación
│   ├── cart.js               Carrito y cálculos
│   ├── carrito-panel.js      Panel lateral del carrito y modal de acceso
│   ├── auth.js               Sesión y roles
│   ├── validation.js         Validación HTML5 + JavaScript + regex
│   ├── storage.js            localStorage, sessionStorage, cookies
│   ├── indexeddb.js          Base de datos local (PlanetaFitnessDB)
│   └── admin.js              Controlador del dashboard
│
├── cliente/
│   ├── checkout.html         Datos del cliente, resumen y confirmación del pedido
│   ├── nutricion.html
│   └── login.html
│
├── admin/
│   ├── login.html
│   ├── index.html            Dashboard
│   ├── productos.html
│   ├── planes.html
│   ├── clases.html
│   └── entrenadores.html
│
└── pruebas/
    ├── servidor.mjs             Servidor estático que usa la prueba de navegador
    ├── prueba-logica.mjs        Carrito y validaciones
    ├── prueba-repo.mjs          Fetch, cambios del admin y respaldo en IndexedDB
    ├── prueba-selectores.mjs    Selectores de cada página e imágenes existentes
    └── prueba-navegador.mjs     Recorrido completo en Chromium (Playwright)
```

### Separación de responsabilidades (modelo / vista / controlador)

| Capa | Archivo | Qué hace |
|---|---|---|
| Modelo | `repo.js`, `indexeddb.js`, `storage.js` | Trae los JSON, guarda el catálogo, registra pedidos y aplica los cambios del administrador |
| Vista | `view.js`, `carrito-panel.js` | Construye el HTML de las tarjetas, los mensajes y el panel lateral del carrito |
| Controlador | `app.js`, `cart.js`, `auth.js`, `validation.js`, `admin.js` | Escucha eventos, coordina y actualiza la vista |

---

## Funcionamiento

### Cliente

- **Encabezado y navegación:** el encabezado es **fijo** (`position: sticky`) y de altura **cómoda
  pero moderada**: crece con el ancho de pantalla (logo, enlaces y botones con más aire), gana una
  sombra sutil al hacer scroll y marca con amarillo la sección visible (navegación activa con
  `IntersectionObserver`). Los enlaces son anclas de la misma página: `#inicio`, `#planes`,
  `#tienda`, `#clases`, `#rutinas`, `#nutricion` y `#contacto`. En móvil el menú es un **panel
  flotante** bajo el encabezado (no ocupa la pantalla ni empuja el contenido) que se cierra con
  Escape, al elegir una sección, con el botón o al hacer clic fuera.
- **Página única:** `index.html` reúne el hero, los planes, la tienda, las clases, las rutinas,
  la nutrición y el contacto. La página de nutrición (`cliente/nutricion.html`) sigue disponible
  para solicitar la cita.
- **Planes:** los 3 planes con sus beneficios. El botón «Elegir plan» agrega el plan al carrito
  (id `plan-<id>`, tipo `plan`) y abre el panel lateral, **sin exigir sesión**.
- **Clases:** una tarjeta por actividad con su foto, descripción, todos sus horarios agrupados
  (día y hora), el lugar y el entrenador. En móvil se ve una por fila y en escritorio dos por fila.
- **Tienda:** el catálogo se organiza en **secciones por categoría** (Suplementos, Ropa) generadas
  desde el propio JSON; cada sección tiene su título y su cuadrícula, y cada tarjeta permite
  agregar al carrito. No hay buscador ni filtros.
- **Carrito:** el carrito es un **panel lateral** disponible en todo el sitio, con control de
  cantidad, eliminar línea, vaciar, subtotal y total. **Agregar al carrito no exige sesión.** Se
  guarda en `localStorage`, por lo que sobrevive a la recarga y al cambio de página.
- **Finalizar compra:** exige sesión. Sin sesión se abre un **modal de acceso**
  dentro de la propia página; **el carrito no se vacía nunca** mientras la persona se autentica.
  Con sesión se llega a `cliente/checkout.html`.
- **Checkout:** datos del cliente (autocompletados desde la sesión), resumen del pedido y
  confirmación con código de pedido y punto de retiro. El pedido queda en `localStorage` y en
  IndexedDB, y solo entonces se vacía el carrito. Un plan comprado se registra además como
  suscripción del cliente. Sin sesión, la URL del checkout devuelve al login.
- **Nutrición:** información del servicio (sin precio) y formulario de cita.
- **Login y registro:** login de clientes contra la colección local de `data/gimnasio.json`, con
  registro opcional que queda guardado en el navegador.

### Administrador

1. Entra en `admin/login.html` con la cuenta de administrador.
2. El dashboard muestra totales del catálogo, accesos rápidos y las citas de nutrición registradas.
3. En **Productos** puede agregar, editar y eliminar productos, además de restablecer el catálogo.
4. En **Planes** edita nombre, precio y descripción de los planes existentes.
5. En **Clases** cambia día, hora de inicio, hora de fin y entrenador de cada horario.
6. En **Entrenadores** actualiza especialidad y descripción de los 3 entrenadores.

Cada página del dashboard verifica la sesión: sin rol `admin` en `sessionStorage` redirige al login
administrativo.

### Catálogo y flujo de compra

```text
productos.json → Fetch → repo.js → productos[] → view.js → tarjetas → agregar
    ↓                                                                    ↓
IndexedDB                                            localStorage ← cart.js
                                                                         ↓
                                            panel lateral (carrito-panel.js)
                                                                         ↓
                                              finalizar compra → ¿hay sesión?
                                                        │                │
                                                  No ─┘                └─ Sí
                                          modal de acceso          cliente/checkout.html
                                             (carrito intacto)      → confirmar pedido
                                                                        → localStorage + IndexedDB
```

La compra **no** incluye pago en línea ni servidor: el sitio registra el pedido y la persona lo
retira en el gimnasio (Avenida San Rio de Janeiro y Panamá, Quito).

### Login

```text
Inicio → Iniciar sesión → ¿Tipo de usuario?
                            ├── Cliente      → páginas del cliente
                            └── Administrador→ admin/login.html
```

- Cliente: `cliente@planetafitness.ec` / `cliente123`
- Administrador: `admin@planetafitness.ec` / `admin123`

El login es académico: no es autenticación real de producción.

---

## Persistencia

| Mecanismo | Uso |
|---|---|
| `localStorage` | Carrito de compras, cambios del administrador, citas de nutrición, **pedidos confirmados**, registros de clientes y mensajes de contacto |
| `sessionStorage` | Sesión del usuario (nombre, correo, rol, nivel) y paso pendiente del checkout |
| `IndexedDB` | Catálogo (`productos`, `planes`, `clases`, `entrenadores`) y registros (`citas`, `pedidos`), como copia local del sitio |
| Cookies | Preferencia del aviso de cookies y marca de última actualización del catálogo |

La base local es `PlanetaFitnessDB` en su **versión 2**, que añadió el almacén `pedidos` para el
checkout.

### Experiencia progresiva

```text
Fetch a data/productos.json
   ↓ ¿funciona?
  Sí                      No
  ↓                       ↓
Guardar en IndexedDB   Leer IndexedDB
  ↓                       ↓
Mostrar catálogo       Mostrar catálogo guardado
```

Si el archivo JSON no está disponible, el sitio muestra la copia guardada en IndexedDB e informa el
cambio de origen en la región `aria-live`.

### Última actualización

Tras cada carga correcta del catálogo se registra la fecha con el objeto `Date`:

```javascript
const fecha = new Date();
const marca = fecha.toISOString(); // se guarda en la cookie ultimaActualizacion
```

El pie de página muestra «Catálogo actualizado: …» con la fecha en formato legible.

---

## Accesibilidad

- **HTML semántico:** un solo `<main>` por página, un solo `<h1>`, jerarquía ordenada de encabezados
  y `<article>` para cada producto, plan, clase o entrenador.
- **ARIA solo cuando hace falta:** `aria-live="polite"` para mensajes dinámicos, `aria-busy` en los
  contenedores que cargan datos, `aria-invalid` y `aria-describedby` en los campos con error.
- **Teclado:** todo se opera con Tab, Shift+Tab, Enter y Espacio. El menú móvil y el carrito son
  botones accesibles. El panel lateral y el modal de acceso son diálogos (`role="dialog"` con
  `aria-modal="true"`) que confinan el foco con Tab, se cierran con Escape o con la capa oscura y
  devuelven el foco al botón que los abrió.
- **Foco visible:** `:focus-visible` con contorno de 3 px y `outline-offset`.
- **Contraste:** texto oscuro sobre fondos claros o blanco sobre fondos oscuros, por encima de 4.5:1
  para texto normal.
- **Textos alternativos:** todas las imágenes informativas tienen `alt` descriptivo; las decorativas
  usan `alt=""`.
- **Errores sin depender del color:** cada mensaje de error incluye el símbolo de advertencia ⚠ y
  explica qué está mal y cómo corregirlo.
- **Zoom:** el sitio no genera desplazamiento horizontal al aumentar el zoom.
- **Movimiento reducido:** `@media (prefers-reduced-motion: reduce)` desactiva animaciones.

### Formularios

Cada campo tiene su `<label>`, los mensajes de ayuda están cerca del campo y vinculados con
`aria-describedby`, y los errores se crean con `role="alert"`. La validación se hace en dos capas:

1. **HTML5 nativo:** `required`, `type`, `minlength`, `pattern`, `inputmode` y `checkValidity()`.
2. **JavaScript:** reglas de negocio con expresiones regulares y `setCustomValidity()`
   (cédula de 10 dígitos, celular que empieza por 09, contraseña con letras y números,
   comparación de contraseñas y fechas no pasadas).

---

## Responsive

Diseño **mobile-first** con unidades relativas (`rem`, `%`, `vw`):

- **Móvil (por defecto):** una columna, menú plegado, tarjetas apiladas y botones grandes.
- **Tablet (`min-width: 768px`):** dos columnas en planes y catálogo.
- **Escritorio (`min-width: 1024px`):** tres columnas, navegación en línea, menú centrado y pie en
  cuatro columnas. Entre 1024 y 1279 px el carrito se muestra solo con el icono para que la
  navegación no se comprima.
- **Escritorio amplio (`min-width: 1280px`):** el encabezado gana altura, el logo crece y vuelve el
  texto del botón del carrito.
- El catálogo de productos usa **Grid**; las cabeceras, botones y el carrito usan **Flexbox**.
- El panel lateral ocupa `min(26rem, 100%)` y pasa a ancho completo por debajo de 480 px.
- Las imágenes son flexibles (`max-width: 100%; height: auto`); las clases y el catálogo usan
  cuadrícula de una columna en móvil y dos (clases) o tres (tienda) en escritorio, sin desplazar
  la página en horizontal.

---

## Imágenes

Las 14 fotografías del catálogo se descargaron de [Unsplash](https://unsplash.com) y se guardan
**localmente** en `assets/img/` (no hay hotlinking). Se usan bajo la
[licencia de Unsplash](https://unsplash.com/license). Identificador de origen de cada una:

| Archivo | Foto original |
|---|---|
| `gimnasio/hero-gimnasio.jpg` | `https://images.unsplash.com/photo-1534438327276-14e5300c3a48` |
| `gimnasio/pesas.jpg` | `https://images.unsplash.com/photo-1583454110551-21f2fa2afe61` |
| `gimnasio/cardio.jpg` | `https://images.unsplash.com/photo-1571902943202-507ec2618e8f` |
| `gimnasio/nutricion.jpg` | `https://images.unsplash.com/photo-1490645935967-10de6ba17061` |
| `clases/boxeo.jpg` | `https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e` |
| `clases/bailoterapia.jpg` | `https://images.unsplash.com/photo-1544367567-0f2fcb009e0b` |
| `productos/proteina.jpg` | `https://images.unsplash.com/photo-1505576399279-565b52d4ac71` |
| `productos/creatina.jpg` | `https://images.unsplash.com/photo-1593095948071-474c5cc2989d` |
| `productos/barras-energeticas.jpg` | `https://images.unsplash.com/photo-1606312619070-d48b4c652a52` |
| `productos/camisetas-deportivas.jpg` | `https://images.unsplash.com/photo-1521572163474-6864f9cf17ab` |
| `productos/shorts-deportivas.jpg` | `https://images.unsplash.com/photo-1591195853828-11db59a44f6b` |
| `entrenadores/entrenador-1.jpg` | `https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b` |
| `entrenadores/entrenador-2.jpg` | `https://images.unsplash.com/photo-1518611012118-696072aa579a` |
| `entrenadores/entrenador-3.jpg` | `https://images.unsplash.com/photo-1534258936925-c58bed479fcb` |

Los logotipos (`assets/img/logo/`), el favicon y `assets/img/productos/generico.svg` son recursos
propios del proyecto.

---

## Cómo ejecutar el proyecto

El proyecto usa módulos ES (`type="module"`), por lo que **no funciona** abriendo el archivo con
`file://`. Hay que servirlo por HTTP.

### Opción 1: Live Server (VS Code)

1. Abrir la carpeta del proyecto en Visual Studio Code.
2. Instalar la extensión **Live Server**.
3. Clic derecho en `index.html` → **Open with Live Server**.

### Opción 2: desde la terminal

```bash
# Con Python
python -m http.server 5500

# Con Node.js
npx serve .
```

Luego abrir `http://localhost:5500` (o el puerto que indique el servidor).

---

## Publicación en Neocities

1. Crear una cuenta en <https://neocities.org>.
2. Crear un sitio nuevo (por ejemplo `planeta-fitness`).
3. Subir el contenido respetando las carpetas: `index.html` en la raíz, y las carpetas `assets`,
   `data`, `js`, `cliente` y `admin` completas.
4. Verificar que `data/` se haya subido: el catálogo se carga con Fetch y necesita esa carpeta.
5. Comprobar la web en la URL pública del sitio.

---

## Pruebas realizadas

Las pruebas son archivos de Node sin dependencias: se ejecutan desde la raíz del proyecto.

```bash
node pruebas/prueba-logica.mjs      # 16 comprobaciones: carrito y validaciones
node pruebas/prueba-repo.mjs        # 10 comprobaciones: Fetch, merging y respaldo
node pruebas/prueba-selectores.mjs  # 39 comprobaciones: selectores, anclas e imágenes
node pruebas/prueba-navegador.mjs   # 124 comprobaciones: flujo real con Playwright
```

`prueba-navegador.mjs` levanta su propio servidor estático (`pruebas/servidor.mjs`) y necesita
Playwright, que es una dependencia de las pruebas y no del sitio. Si quieres instalarlo aquí:

```bash
npm install playwright && npx playwright install chromium
node pruebas/prueba-navegador.mjs
```

Si prefieres no instalar nada dentro de la carpeta del proyecto, usa una instalación externa
y apunta `PW_MODULO` a ella:

```bash
set PW_MODULO=C:\ruta\node_modules\playwright\index.js
node pruebas/prueba-navegador.mjs
```

### Cobertura funcional

- [x] Página única con anclas: 3 planes, 5 productos, 2 clases, 3 entrenadores, 5 sesiones de
      horario, 6 servicios, 3 niveles y 3 horarios de atención.
- [x] Catálogo de 5 productos agrupado en secciones por categoría (Suplementos, Ropa), generadas
      desde el JSON, sin buscador ni filtros.
- [x] Carrito lateral: agregar desde la tienda y desde los planes, cambiar cantidad, eliminar,
      vaciar y recargar la página.
- [x] Panel lateral del carrito en todas las páginas del cliente: se abre, se cierra con Escape,
      con la capa oscura y con «Continuar comprando»; el foco queda confinado dentro del diálogo.
- [x] Agregar al carrito **no exige sesión** y el carrito sobrevive al cambio de página.
- [x] «Finalizar compra» sin sesión abre el modal de acceso sin vaciar el carrito.
- [x] Checkout: resumen, autocompletado desde la sesión, validación del teléfono, confirmación con
      código de pedido, punto de retiro y carrito vaciado. Sin sesión devuelve al login.
- [x] El pedido confirmado queda en `localStorage` y en el almacén `pedidos` de IndexedDB.
- [x] Validaciones de contacto, login, registro y cita de nutrición (HTML5 + JavaScript),
      incluida la recuperación del campo después de corregirlo.
- [x] Login de cliente y de administrador, con redirección según el rol.
- [x] Flujo de plan: «Elegir plan» lo agrega al carrito, pide login al finalizar y registra la
      suscripción al confirmar el pedido.
- [x] Registro local de un cliente nuevo y posterior inicio de sesión con esa cuenta.
- [x] Alta, edición y baja de productos desde el dashboard, con imagen genérica para los nuevos.
- [x] El cambio hecho en el dashboard se refleja en el catálogo público.
- [x] Cita de nutrición visible en el dashboard.
- [x] Aviso de cookies y marca de última actualización.
- [x] Copia del catálogo efectivo guardada en IndexedDB.
- [x] Encabezado fijo (`sticky`) con sombra al bajar y **navegación activa** que marca la sección
      visible (`.pf-enlace-activo` + `aria-current="location"`).
- [x] Menú responsive: en línea en escritorio y como **panel flotante** en móvil (sin empujar el
      contenido), que se cierra con Escape, al elegir una sección, con el botón o al hacer clic fuera.
- [x] Encabezado de altura cómoda que crece en escritorio (logo, enlaces y botones con más aire)
      sin volver al encabezado gigante ni romper la navegación.
- [x] Clases como tarjetas por actividad: foto, descripción, horarios agrupados con día y hora,
      lugar y entrenador, en una columna en móvil y dos en escritorio.
- [x] Navegación de una sola página por anclas (`#inicio`, `#planes`, `#tienda`, `#clases`,
      `#rutinas`, `#nutricion`, `#contacto`).
- [x] Sin desbordamiento horizontal en 320, 375, 390, 430, 768, 1024 y 1440 px.
- [x] Enlace de salto al contenido, textos alternativos y un solo `h1` por página.
- [x] Sin errores de JavaScript en la consola durante todo el recorrido.

### Revisión manual

- [x] Recorrido completo con teclado desde el inicio hasta el carrito.
- [x] Contraste, foco visible y mensajes con `aria-live`.
- [x] Revisión responsive con zoom aumentado.

---

## Entrega

- Proyecto comprimido en `.zip` con la estructura completa.
- `README.md` incluido.
- Prueba local con un servidor HTTP.
- Publicación en Neocities.