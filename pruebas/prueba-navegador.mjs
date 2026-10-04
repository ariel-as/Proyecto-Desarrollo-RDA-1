/**
 * Prueba de humo en navegador real (Playwright).
 * Ejecutar con:  node pruebas/prueba-navegador.mjs
 * Requiere el proyecto servido en http://localhost:5500
 *
 * Si Playwright está instalado fuera del proyecto, indicar su ruta:
 *   set PW_MODULO=C:\ruta\node_modules\playwright\index.js
 *   node pruebas/prueba-navegador.mjs
 */
import { pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const rutaModulo = process.env.PW_MODULO || 'playwright';
const modulo = await import(rutaModulo === 'playwright' ? 'playwright' : pathToFileURL(rutaModulo).href);
const { chromium } = modulo.default ?? modulo;

const BASE = process.env.BASE || 'http://localhost:5511';
let fallos = 0;

/* Servidor local: la prueba es autocontenida. */
const servidor = spawn(process.execPath, [join(aqui, 'servidor.mjs'), '5511'], {
  stdio: 'ignore',
  detached: false
});
const apagarServidor = () => servidor.kill();
process.on('exit', apagarServidor);
await new Promise((r) => setTimeout(r, 800));

function comprobar(descripcion, condicion, extra = '') {
  console.log(`${condicion ? 'OK  ' : 'FALLA'} ${descripcion}${extra ? ' -> ' + extra : ''}`);
  if (!condicion) fallos += 1;
}

/* El panel pinta sus datos de forma asíncrona (Fetch de los JSON e IndexedDB).
   Una espera fija no garantiza que el DOM esté listo: en un runner lento la
   lectura llegaba antes de tiempo y la comprobación fallaba sin motivo. Estas
   utilidades esperan al estado esperado y, si no llega, la comprobación que las
   sigue sigue mostrando el valor real leído para poder diagnosticar. */
const ESPERA_DOM = 20000;

async function esperarEnElDom(condicion, argumento) {
  return pagina
    .waitForFunction(condicion, argumento, { timeout: ESPERA_DOM })
    .then(() => true)
    .catch(() => false);
}

/** Espera a que un elemento muestre exactamente un texto. */
const esperarTexto = (selector, valor) =>
  esperarEnElDom(
    ([sel, esperado]) => document.querySelector(sel)?.textContent.trim() === esperado,
    [selector, valor]
  );

/** Espera a que un conjunto de elementos tenga una cantidad concreta de hijos. */
const esperarCantidad = (selector, cantidad) =>
  esperarEnElDom(([sel, n]) => document.querySelectorAll(sel).length === n, [selector, cantidad]);

/** Espera a que algún elemento del conjunto contenga un texto. */
const esperarTextoEn = (selector, texto) =>
  esperarEnElDom(
    ([sel, t]) => [...document.querySelectorAll(sel)].some((n) => n.textContent.includes(t)),
    [selector, texto]
  );

/** Espera a que un elemento se muestre en pantalla. */
const esperarVisible = (selector) =>
  pagina.locator(selector).first().waitFor({ state: 'visible', timeout: ESPERA_DOM }).then(() => true).catch(() => false);

/** Espera a que el contador del encabezado muestre un valor y lo devuelve. */
async function contadorCarrito(valor) {
  await esperarTexto('[data-contador-carrito]', valor);
  return pagina.locator('[data-contador-carrito]').first().innerText();
}

/* El panel lateral y el modal animan su visibilidad (260 ms). Se espera a que
   termine la transición antes de preguntar por isVisible/isHidden. */
const TRANSICION = 400;
const esperar = () => pagina.waitForTimeout(TRANSICION);
const abrirPanel = async (selector = 'header [data-abrir-carrito]') => {
  await pagina.click(selector);
  await esperar();
};

const navegador = await chromium.launch();
const contexto = await navegador.newContext({ viewport: { width: 1280, height: 900 } });
const pagina = await contexto.newPage();

const errores = [];
pagina.on('pageerror', (e) => errores.push(String(e)));
pagina.on('console', (m) => {
  if (m.type() === 'error') errores.push(`consola: ${m.text()}`);
});

/* ---------- 1. Inicio ---------- */
await pagina.goto(`${BASE}/index.html`, { waitUntil: 'networkidle' });
// Se fuerza la carga de las imágenes diferidas antes de verificarlas.
await pagina.evaluate(async () => {
  document.querySelectorAll('img[loading="lazy"]').forEach((i) => i.setAttribute('loading', 'eager'));
  await Promise.all(
    [...document.images].map((i) =>
      i.complete ? null : new Promise((r) => { i.onload = r; i.onerror = r; })
    )
  );
});
const rotas = await pagina.evaluate(() =>
  [...document.images]
    .filter((i) => !i.complete || i.naturalWidth === 0)
    .map((i) => i.getAttribute('src'))
);
comprobar(
  'El h1 del inicio es correcto',
  (await pagina.locator('h1').innerText()).toLowerCase().includes('entrena')
);
comprobar('Se pintan 3 planes', (await pagina.locator('[data-planes] article').count()) === 3);
comprobar('Se pintan 5 productos de la tienda', (await pagina.locator('[data-catalogo] article').count()) === 5);
comprobar('Se pintan 2 clases', (await pagina.locator('[data-clases] article').count()) === 2);
comprobar('Se pintan 3 entrenadores', (await pagina.locator('[data-entrenadores] article').count()) === 3);
comprobar('La sección de clases ya no usa ninguna tabla', (await pagina.locator('section#clases table').count()) === 0);
comprobar('Las tarjetas de clase muestran los 5 horarios', (await pagina.locator('[data-clases] .pf-clase-horario').count()) === 5);
comprobar('Se pintan 6 servicios', (await pagina.locator('[data-servicios] article').count()) === 6);
comprobar('Se pintan 3 niveles de rutina', (await pagina.locator('[data-niveles] li').count()) === 3);
comprobar('Se muestran 3 horarios del gimnasio', (await pagina.locator('[data-gimnasio-horarios] li').count()) === 3);
comprobar('No hay imágenes rotas', rotas.length === 0, rotas.join(', '));

/* Navegación de una sola página: los enlaces del encabezado son anchors. */
await pagina.click('header a[href="#tienda"]');
await pagina.waitForTimeout(600);
comprobar('El enlace de la nav lleva a #tienda', pagina.url().endsWith('#tienda'));
comprobar('La sección #tienda existe en el documento', (await pagina.locator('section#tienda').count()) === 1);
comprobar('Todas las secciones de la página están presentes', (await pagina.locator('section#inicio, section#planes, section#tienda, section#clases, section#rutinas, section#contacto').count()) === 6);

/* Navegación activa: el enlace de la sección visible se marca solo. */
await pagina.goto(`${BASE}/index.html`, { waitUntil: 'networkidle' });
await pagina.waitForTimeout(300);
comprobar('El enlace Inicio aparece activo al cargar', await pagina.locator('header a.pf-enlace[href="#inicio"]').evaluate((a) => a.classList.contains('pf-enlace-activo')));
await pagina.locator('header a.pf-enlace[href="#clases"]').click();
await pagina.waitForTimeout(1000);
comprobar('Al navegar a Clases su enlace queda activo', (await pagina.locator('header a.pf-enlace[href="#clases"]').getAttribute('aria-current')) === 'location');
comprobar('Solo un enlace del menú queda activo', (await pagina.locator('header a.pf-enlace-activo').count()) === 1);
comprobar('La sección #nutricion existe y está enlazada',
  (await pagina.locator('section#nutricion').count()) === 1 &&
  (await pagina.locator('header a.pf-enlace[href="#nutricion"]').count()) === 1);

/* ---------- 2. Productos por categorías (sección #tienda) ---------- */
await pagina.goto(`${BASE}/index.html#tienda`, { waitUntil: 'networkidle' });
comprobar('El catálogo trae 5 productos del JSON', (await pagina.locator('[data-catalogo] article').count()) === 5);
comprobar('La tienda ya no depende de filtros', (await pagina.locator('#filtro-categoria, [data-filtrar], [data-limpiar-filtros], #busqueda-productos').count()) === 0);
const seccionesTienda = pagina.locator('[data-catalogo] > section.pf-tienda-categoria');
comprobar('La tienda agrupa los productos en 2 categorías', (await seccionesTienda.count()) === 2);
comprobar('La primera categoría es Suplementos con 3 productos', (await seccionesTienda.nth(0).locator('article').count()) === 3);
comprobar('La segunda categoría es Ropa con 2 productos', (await seccionesTienda.nth(1).locator('article').count()) === 2);
comprobar('Los títulos de categoría usan h3', (await pagina.locator('[data-catalogo] h3.pf-tienda-titulo').count()) === 2);

/* ---------- 3. Carrito lateral (drawer, sin sesión) ---------- */
await pagina.locator('[data-catalogo] article button[data-accion="agregar"]').nth(0).click();
await pagina.locator('[data-catalogo] article button[data-accion="agregar"]').nth(1).click();
await pagina.waitForTimeout(200);
comprobar('El contador del carrito muestra 2', (await contadorCarrito('2')));
comprobar('Agregar al carrito no exige sesión', pagina.url().includes('index.html'));
comprobar('El panel lateral está inyectado', (await pagina.locator('[data-panel-carrito]').count()) === 1);
comprobar('El panel lateral arranca cerrado', await pagina.locator('[data-panel-carrito]').isHidden());

await abrirPanel();
comprobar('El botón del encabezado abre el panel', await pagina.locator('[data-panel-carrito]').isVisible());
comprobar('La capa oscura se muestra con el panel', await pagina.locator('[data-capa-carrito]').isVisible());
comprobar('El botón informa el panel desplegado', (await pagina.getAttribute('header [data-abrir-carrito]', 'aria-expanded')) === 'true');
comprobar('El panel lista 2 productos', (await pagina.locator('[data-panel-lineas] li').count()) === 2);
comprobar('El subtotal del panel es $70.00', (await pagina.locator('[data-panel-subtotal]').innerText()) === '$70.00');
comprobar('El total del panel es $70.00', (await pagina.locator('[data-panel-total]').innerText()) === '$70.00');
comprobar('El panel ofrece finalizar compra', await pagina.locator('[data-panel-finalizar]').isVisible());
comprobar('El panel ofrece continuar comprando', await pagina.locator('[data-panel-continuar]').isVisible());
comprobar(
  'El panel es un diálogo modal accesible',
  (await pagina.getAttribute('[data-panel-carrito]', 'aria-modal')) === 'true' &&
    (await pagina.getAttribute('[data-panel-carrito]', 'role')) === 'dialog'
);

await pagina.click('[data-panel-lineas] li:first-child [data-sumar]');
await pagina.waitForTimeout(200);
comprobar('El botón + sube la cantidad en el panel', (await pagina.locator('[data-panel-subtotal]').innerText()) === '$115.00');
await pagina.click('[data-panel-lineas] li:first-child [data-restar]');
await pagina.waitForTimeout(200);
comprobar('El botón − baja la cantidad en el panel', (await pagina.locator('[data-panel-subtotal]').innerText()) === '$70.00');

await pagina.keyboard.press('Escape');
await esperar();
comprobar('Escape cierra el panel lateral', await pagina.locator('[data-panel-carrito]').isHidden());

await abrirPanel();
await pagina.click('[data-capa-carrito]', { position: { x: 10, y: 400 } });
await esperar();
comprobar('La capa oscura también cierra el panel', await pagina.locator('[data-panel-carrito]').isHidden());

await abrirPanel();
await pagina.click('[data-panel-lineas] li:first-child [data-quitar]');
await pagina.waitForTimeout(200);
comprobar('Quitar un producto lo elimina del panel', (await pagina.locator('[data-panel-lineas] li').count()) === 1);
await pagina.click('[data-panel-vaciar]');
await pagina.waitForTimeout(200);
comprobar('Vaciar el panel deja el carrito vacío', (await pagina.locator('[data-panel-lineas] li').count()) === 0);
comprobar('El panel avisa que el carrito está vacío', await pagina.locator('[data-panel-vacio-state]').isVisible());
comprobar('El contador del encabezado vuelve a 0', (await contadorCarrito('0')));

await pagina.click('[data-panel-finalizar]');
await pagina.waitForTimeout(200);
comprobar('Finalizar con carrito vacío muestra un aviso', (await pagina.locator('[data-aviso]').innerText()).includes('Agrega productos'));

/* "Continuar comprando" cierra el panel y permite seguir comprando. */
await pagina.click('[data-panel-continuar]');
await esperar();
comprobar('Continuar comprando cierra el panel', await pagina.locator('[data-panel-carrito]').isHidden());

/* El carrito se conserva al recargar y el panel sigue disponible en otra página. */
await pagina.locator('[data-catalogo] article button[data-accion="agregar"]').nth(0).click();
await pagina.waitForTimeout(200);
await pagina.goto(`${BASE}/index.html`, { waitUntil: 'networkidle' });
comprobar('El carrito sobrevive al cambio de página', (await contadorCarrito('1')));
await abrirPanel();
comprobar('El panel se puede abrir desde el inicio', await pagina.locator('[data-panel-carrito]').isVisible());
await pagina.click('[data-panel-vaciar]');
await esperar();
comprobar('El carrito queda limpio para el flujo de planes', (await contadorCarrito('0')));

/* ---------- 4. Flujo de plan: al carrito y login al finalizar ---------- */
// El panel quedó abierto tras vaciar: se cierra antes de operar con los planes.
await pagina.keyboard.press('Escape');
await esperar();
comprobar('El carrito arranca vacío para el flujo de plan', (await contadorCarrito('0')));

await pagina.click('article[data-plan="1"] button[data-accion="elegir-plan"]');
await esperar();
comprobar('Elegir plan no exige sesión', pagina.url().includes('index.html'));
comprobar('Elegir plan abre el panel lateral', await pagina.locator('[data-panel-carrito]').isVisible());
comprobar('El panel lista el plan mensual', (await pagina.locator('[data-panel-lineas] li:first-child').innerText()).includes('Plan mensual'));
comprobar('El total del plan individual es $35.00', (await pagina.locator('[data-panel-total]').innerText()) === '$35.00');

await pagina.click('[data-panel-finalizar]');
await esperar();
comprobar('Sin sesión, finalizar abre el modal de acceso', await pagina.locator('[data-modal-acceso]').isVisible());
comprobar('El plan se conserva mientras se inicia sesión', (await pagina.locator('[data-panel-lineas] li').count()) === 1);

await pagina.fill('#acceso-correo', 'cliente@planetafitness.ec');
await pagina.fill('#acceso-contrasena', 'cliente123');
await pagina.click('[data-formulario-acceso] button[type="submit"]');
await pagina.waitForURL(/checkout\.html/, { timeout: 20000 });
comprobar('Tras iniciar sesión el plan llega al checkout', pagina.url().includes('checkout.html'));
await esperarCantidad('[data-checkout-resumen] li', 1);
comprobar('El checkout lista 1 línea', (await pagina.locator('[data-checkout-resumen] li').count()) === 1);
comprobar('El checkout suma $35.00', (await pagina.locator('[data-checkout-total]').innerText()) === '$35.00');

await pagina.fill('#nombre', 'Ana Pérez');
await pagina.fill('#telefono', '0991234567');
await pagina.click('#formulario-checkout button[type="submit"]');
await esperarVisible('[data-checkout-confirmacion]');
comprobar('El plan se confirma', await pagina.locator('[data-checkout-confirmacion]').isVisible());
comprobar(
  'El plan comprado queda como suscripción del cliente',
  await pagina.evaluate(() => Boolean(localStorage.getItem('suscripcion-cli-001')))
);
comprobar('El carrito se vacía tras confirmar el plan', (await contadorCarrito('0')));

// El pedido del plan se limpia para no confundir el siguiente flujo de compra.
await pagina.evaluate(
  () =>
    new Promise((resolve) => {
      localStorage.removeItem('pedidos');
      const r = indexedDB.open('PlanetaFitnessDB');
      r.onsuccess = () => {
        const t = r.result.transaction('pedidos', 'readwrite');
        t.objectStore('pedidos').clear();
        t.oncomplete = () => resolve(true);
        t.onerror = () => resolve(false);
      };
      r.onerror = () => resolve(false);
    })
);

/* ---------- 5. Validación de formularios ---------- */
await pagina.goto(`${BASE}/cliente/nutricion.html`, { waitUntil: 'networkidle' });
await pagina.fill('#cedula', '123');
await pagina.fill('#nombre', 'Ana Pérez');
await pagina.fill('#telefono', '0991234567');
await pagina.fill('#correo', 'ana@correo.com');
await pagina.selectOption('#motivo', 'Evaluación');
await pagina.fill('#fecha', '2020-01-01');
await pagina.click('#formulario-nutricion button[type="submit"]');
await pagina.waitForTimeout(300);
comprobar('La cédula inválida se marca con aria-invalid', (await pagina.getAttribute('#cedula', 'aria-invalid')) === 'true');
comprobar('La fecha pasada se marca con aria-invalid', (await pagina.getAttribute('#fecha', 'aria-invalid')) === 'true');
comprobar('Existe un mensaje de error visible', await pagina.locator('#err-cedula').isVisible());

await pagina.fill('#cedula', '1712345678');
const manana = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
await pagina.fill('#fecha', manana);
await pagina.fill('#hora', '10:00');
await pagina.click('#formulario-nutricion button[type="submit"]');
await pagina.waitForTimeout(500);
comprobar('La cita válida se registra', (await pagina.locator('#mensaje-nutricion').innerText()).includes('Cita solicitada'));
comprobar(
  'La cita queda en localStorage',
  await pagina.evaluate(() => JSON.parse(localStorage.getItem('citasNutricion') || '[]').length === 1)
);

/* ---------- 6. Registro local y inicio de sesión ---------- */
await pagina.goto(`${BASE}/cliente/login.html`, { waitUntil: 'networkidle' });
await pagina.fill('#nombre-registro', 'Luis registered');
await pagina.fill('#cedula-registro', '1712345679');
await pagina.fill('#telefono-registro', '0991112223');
await pagina.fill('#correo-registro', 'luis.registro@correo.com');
await pagina.selectOption('#nivel', 'Intermedio');
await pagina.fill('#contrasena-registro', 'clave1234');
await pagina.fill('#confirmar', 'clave1234');
await pagina.click('#formulario-registro button[type="submit"]');
await pagina.waitForTimeout(400);
comprobar(
  'El registro local confirma el alta',
  (await pagina.locator('#mensaje-registro').innerText()).includes('Registro creado')
);

await pagina.fill('#correo', 'luis.registro@correo.com');
await pagina.fill('#contrasena', 'clave1234');
await pagina.click('#formulario-login button[type="submit"]');
await pagina.waitForTimeout(1200);
comprobar('La cuenta recién registrada puede iniciar sesión', pagina.url().includes('index.html'));
comprobar(
  'La sesión guarda el nombre del nuevo cliente',
  await pagina.evaluate(() => JSON.parse(sessionStorage.getItem('usuario') || 'null')?.nombre === 'Luis registered')
);
comprobar(
  'La contraseña se guarda como huella y no en texto plano',
  await pagina.evaluate(() =>
    [localStorage, sessionStorage].every(
      (almacen) => !JSON.stringify(almacen).includes('clave1234')
    )
  )
);

/* ---------- 6 bis. Flujo de compra: carrito, modal de acceso y checkout ---------- */
await pagina.goto(`${BASE}/index.html#tienda`, { waitUntil: 'networkidle' });
await pagina.locator('[data-catalogo] article button[data-accion="agregar"]').nth(0).click();
await pagina.locator('[data-catalogo] article button[data-accion="agregar"]').nth(1).click();
await pagina.waitForTimeout(200);

// El checkout exige sesión: primero se cierra la sesión activa.
await pagina.evaluate(() => sessionStorage.clear());
await pagina.reload({ waitUntil: 'networkidle' });
await abrirPanel();
comprobar('El carrito conserva los productos sin sesión', (await pagina.locator('[data-panel-lineas] li').count()) === 2);
await pagina.click('[data-panel-finalizar]');
await esperar();
comprobar('Sin sesión se abre el modal de acceso', await pagina.locator('[data-modal-acceso]').isVisible());
comprobar('El modal explica que el carrito se conserva', (await pagina.locator('[data-modal-acceso]').innerText()).includes('Tu carrito se conserva'));
comprobar('El modal bloquea la página con aria-modal', (await pagina.getAttribute('[data-modal-acceso]', 'aria-modal')) === 'true');
comprobar(
  'El carrito sigue intacto mientras se inicia sesión',
  (await pagina.locator('[data-panel-lineas] li').count()) === 2
);

await pagina.fill('#acceso-correo', 'cliente@planetafitness.ec');
await pagina.fill('#acceso-contrasena', 'claveincorrecta');
await pagina.click('[data-formulario-acceso] button[type="submit"]');
await pagina.waitForTimeout(400);
comprobar('El modal avisa si la contraseña falla', (await pagina.locator('[data-mensaje-acceso]').innerText()).length > 0);

await pagina.fill('#acceso-contrasena', 'cliente123');
await pagina.click('[data-formulario-acceso] button[type="submit"]');
await pagina.waitForURL(/checkout\.html/, { timeout: 20000 });
comprobar('Tras iniciar sesión el flujo llega al checkout', pagina.url().includes('checkout.html'));
await esperarCantidad('[data-checkout-resumen] li', 2);
comprobar('El checkout conserva los 2 productos', (await pagina.locator('[data-checkout-resumen] li').count()) === 2);
comprobar('El checkout muestra el total de $70.00', (await pagina.locator('[data-checkout-total]').innerText()) === '$70.00');
comprobar('El checkout autocompleta el correo de la sesión', (await pagina.inputValue('#correo')) === 'cliente@planetafitness.ec');

await pagina.click('#formulario-checkout button[type="submit"]');
await pagina.waitForTimeout(500);
comprobar('El checkout pide el teléfono faltante', (await pagina.getAttribute('#telefono', 'aria-invalid')) === 'true');
comprobar('El checkout no confirma con datos incompletos', await pagina.locator('[data-checkout-confirmacion]').isHidden());

await pagina.fill('#nombre', 'Ana Pérez');
await pagina.fill('#telefono', '0991234567');
await pagina.click('#formulario-checkout button[type="submit"]');
await esperarVisible('[data-checkout-confirmacion]');
comprobar('El pedido se confirma', await pagina.locator('[data-checkout-confirmacion]').isVisible());
comprobar('La confirmación indica el punto de retiro', (await pagina.locator('[data-checkout-confirmacion]').innerText()).includes('Avenida San Rio de Janeiro y Panamá'));
await esperarCantidad('[data-confirmacion-resumen] li', 4);
comprobar('La confirmación muestra el código del pedido', (await pagina.locator('[data-confirmacion-resumen] li').count()) === 4);
comprobar(
  'El pedido quedó guardado en localStorage',
  await pagina.evaluate(() => JSON.parse(localStorage.getItem('pedidos') || '[]').length === 1)
);
comprobar('El carrito se vacía tras confirmar', (await contadorCarrito('0')));
comprobar(
  'El pedido también quedó en IndexedDB',
  await pagina.evaluate(
    () =>
      new Promise((resolve) => {
        const r = indexedDB.open('PlanetaFitnessDB');
        r.onsuccess = () => {
          const t = r.result.transaction('pedidos', 'readonly');
          const p = t.objectStore('pedidos').count();
          p.onsuccess = () => resolve(p.result === 1);
          p.onerror = () => resolve(false);
        };
        r.onerror = () => resolve(false);
      })
  )
);

await pagina.goto(`${BASE}/cliente/checkout.html`, { waitUntil: 'networkidle' });
await esperarVisible('[data-checkout-vacio]');
comprobar('El checkout con carrito vacío ofrece la tienda', await pagina.locator('[data-checkout-vacio]').isVisible());

// El checkout no debe abrirse sin sesión aunque se escriba la URL.
await pagina.evaluate(() => sessionStorage.clear());
await pagina.goto(`${BASE}/cliente/checkout.html`, { waitUntil: 'networkidle' });
await pagina.waitForTimeout(600);
comprobar('El checkout sin sesión devuelve al login', pagina.url().includes('login.html'));

/* ---------- 7. Cookies y aviso ---------- */
comprobar('Existe la cookie de última actualización', await pagina.evaluate(() => document.cookie.includes('ultimaActualizacion')));
await pagina.goto(`${BASE}/index.html`, { waitUntil: 'networkidle' });
await pagina.click('[data-aceptar-cookies]');
await pagina.waitForTimeout(200);
comprobar('El aviso de cookies se puede cerrar', await pagina.evaluate(() => document.cookie.includes('pf_aviso_cookies=aceptado')));
await pagina.reload({ waitUntil: 'networkidle' });
comprobar('La preferencia de cookies se recuerda', await pagina.locator('[data-aviso-cookies]').isHidden());

/* ---------- 7. IndexedDB ---------- */
comprobar(
  'IndexedDB guardó el catálogo',
  await pagina.evaluate(
    () =>
      new Promise((resolve) => {
        const r = indexedDB.open('PlanetaFitnessDB');
        r.onsuccess = () => {
          const db = r.result;
          const t = db.transaction('productos', 'readonly');
          const p = t.objectStore('productos').count();
          p.onsuccess = () => resolve(p.result === 5);
          p.onerror = () => resolve(false);
        };
        r.onerror = () => resolve(false);
      })
  )
);

/* ---------- 8. Panel administrativo ---------- */
await pagina.goto(`${BASE}/admin/index.html`, { waitUntil: 'networkidle' });
comprobar('El dashboard redirige al login sin sesión', pagina.url().includes('login.html'));

await pagina.fill('#correo', 'cliente@planetafitness.ec');
await pagina.fill('#contrasena', 'cliente123');
await pagina.click('#formulario-login-admin button[type="submit"]');
await pagina.waitForTimeout(400);
comprobar('Una cuenta de cliente no entra al dashboard', pagina.url().includes('login.html') && (await pagina.locator('#mensaje-login-admin').innerText()).includes('cliente'));

await pagina.fill('#correo', 'admin@planetafitness.ec');
await pagina.fill('#contrasena', 'admin123');
await pagina.click('#formulario-login-admin button[type="submit"]');
await pagina.waitForURL(/admin\/index\.html/, { timeout: 20000 });
comprobar('El administrador entra al dashboard', pagina.url().includes('index.html'));
// El resumen del dashboard se puebla de forma asíncrona con los cuatro JSON y
// con IndexedDB: se espera a que los indicadores dejen su valor de arranque.
await esperarTexto('[data-total-productos]', '5');
comprobar(
  'El total de productos es 5',
  (await pagina.locator('[data-total-productos]').innerText()) === '5',
  await pagina.locator('[data-total-productos]').innerText()
);
await esperarCantidad('[data-tabla-citas] tbody tr', 1);
comprobar('Las citas registradas se listan', (await pagina.locator('[data-tabla-citas] tbody tr').count()) === 1);

await pagina.goto(`${BASE}/admin/productos.html`, { waitUntil: 'networkidle' });
await esperarCantidad('[data-tabla-productos] tr', 5);
comprobar('La tabla de productos lista 5 filas', (await pagina.locator('[data-tabla-productos] tr').count()) === 5);
await pagina.click('[data-tabla-productos] tr:first-child [data-editar]');
await pagina.fill('#precio', '48');
await pagina.click('#formulario-producto button[type="submit"]');
await esperarTextoEn('[data-tabla-productos] tr:first-child', '48.00');
comprobar('El producto editado muestra el precio nuevo', (await pagina.locator('[data-tabla-productos] tr:first-child').innerText()).includes('48.00'));

await pagina.goto(`${BASE}/index.html#tienda`, { waitUntil: 'networkidle' });
await esperarTextoEn('[data-catalogo]', '$48.00');
comprobar('El sitio público ve el cambio del administrador', (await pagina.locator('[data-catalogo]').innerText()).includes('$48.00'));

/* ---------- 8 bis. Alta de un producto desde el panel ---------- */
await pagina.goto(`${BASE}/admin/productos.html`, { waitUntil: 'networkidle' });
await pagina.click('[data-nuevo-producto]');
await pagina.fill('#nombre', 'Cinturon de levante');
await pagina.fill('#categoria', 'Accesorios');
await pagina.fill('#precio', '35');
await pagina.fill('#descripcion', 'Cinturon de cuero para pesos muertos usado en el area de pesas.');
await pagina.click('#formulario-producto button[type="submit"]');
await esperarCantidad('[data-tabla-productos] tr', 6);
comprobar('El producto nuevo aparece en la tabla', (await pagina.locator('[data-tabla-productos] tr').count()) === 6);
comprobar(
  'El producto nuevo usa una imagen que existe',
  await pagina.evaluate(async () => {
    const productos = await new Promise((resolver) => {
      const r = indexedDB.open('PlanetaFitnessDB');
      r.onsuccess = () => {
        const t = r.result.transaction('productos', 'readonly');
        const p = t.objectStore('productos').getAll();
        p.onsuccess = () => resolver(p.result);
        p.onerror = () => resolver([]);
      };
      r.onerror = () => resolver([]);
    });
    const nuevo = productos.find((p) => p.nombre === 'Cinturon de levante');
    if (!nuevo) return false;
    const respuesta = await fetch(new URL(nuevo.imagen, new URL('/', location.href)).href);
    return respuesta.ok;
  })
);

/* ---------- 9. Accesibilidad básica ---------- */
await pagina.goto(`${BASE}/index.html`, { waitUntil: 'networkidle' });
comprobar('Solo hay un h1', (await pagina.locator('h1').count()) === 1);
comprobar('Las imágenes informativas tienen alt', (await pagina.locator('img:not([alt])').count()) === 0);
comprobar('El enlace de salto existe', (await pagina.locator('.pf-saltar').count()) === 1);

// Navegación por teclado: el enlace de salto recibe el foco y se muestra.
await pagina.keyboard.press('Tab');
await pagina.waitForTimeout(400); // el enlace se desliza con una transición CSS
const focoVisible = await pagina.evaluate(() => {
  const activo = document.activeElement;
  return activo.classList.contains('pf-saltar') && activo.getBoundingClientRect().top >= 0;
});
comprobar('El enlace de salto recibe el foco y se hace visible', focoVisible);

/* ---------- 10. Responsive ---------- */
await pagina.setViewportSize({ width: 1280, height: 900 });
await pagina.goto(`${BASE}/index.html`, { waitUntil: 'networkidle' });
comprobar('En escritorio el menú principal está visible', await pagina.locator('[data-menu]').isVisible());
comprobar('En escritorio se oculta el botón de menú', await pagina.locator('[data-menu-boton]').isHidden());
await pagina.evaluate(() => window.scrollTo(0, 1200));
await pagina.waitForTimeout(400);
comprobar('El encabezado sigue fijo al hacer scroll', Math.abs(await pagina.locator('.pf-encabezado').evaluate((h) => h.getBoundingClientRect().top)) <= 1);
comprobar('El encabezado reacciona al hacer scroll', (await pagina.getAttribute('.pf-encabezado', 'data-fijo')) === 'true');

await pagina.setViewportSize({ width: 360, height: 720 });
await pagina.goto(`${BASE}/index.html`, { waitUntil: 'networkidle' });
comprobar('En móvil el menú arranca plegado', await pagina.locator('[data-menu]').isHidden());
await pagina.click('[data-menu-boton]');
comprobar('El botón despliega el menú en móvil', await pagina.locator('[data-menu]').isVisible());
comprobar('El botón informa el estado desplegado', (await pagina.getAttribute('[data-menu-boton]', 'aria-expanded')) === 'true');
const cajaMenu = await pagina.locator('[data-menu]').boundingBox();
const altoVista = await pagina.evaluate(() => window.innerHeight);
comprobar('El menú móvil es un panel flotante', (await pagina.locator('[data-menu]').evaluate((m) => getComputedStyle(m).position)) === 'absolute');
comprobar('El menú móvil es compacto y no ocupa toda la pantalla', cajaMenu.height < altoVista - 40 && cajaMenu.width < 360);
comprobar('Abrir el menú no empuja ni bloquea el contenido', !(await pagina.evaluate(() => document.body.classList.contains('pf-bloquea-scroll'))));
await pagina.click('[data-menu-boton]');
comprobar('El botón vuelve a plegar el menú', await pagina.locator('[data-menu]').isHidden());

// El overlay móvil también se cierra con Escape y al elegir una sección.
await pagina.click('[data-menu-boton]');
comprobar('El menú se reabre para probar el cierre', await pagina.locator('[data-menu]').isVisible());
await pagina.keyboard.press('Escape');
await pagina.waitForTimeout(200);
comprobar('Escape cierra el menú móvil', await pagina.locator('[data-menu]').isHidden());
await pagina.click('[data-menu-boton]');
await pagina.click('[data-menu] a[href="#planes"]');
await pagina.waitForTimeout(600);
comprobar('Elegir una sección cierra el menú móvil', await pagina.locator('[data-menu]').isHidden());
comprobar('Sin desbordamiento horizontal en móvil', await pagina.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));

await pagina.setViewportSize({ width: 768, height: 900 });
await pagina.goto(`${BASE}/index.html#tienda`, { waitUntil: 'networkidle' });
comprobar('Sin desbordamiento horizontal en tablet', await pagina.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));

const ignorables = errores.filter((e) => !e.includes('favicon'));
comprobar('Sin errores de JavaScript en la consola', ignorables.length === 0, ignorables.join(' | '));

await navegador.close();
apagarServidor();
console.log(fallos === 0 ? '\nTodas las comprobaciones pasaron' : `\n${fallos} comprobaciones fallaron`);
process.exit(fallos === 0 ? 0 : 1);