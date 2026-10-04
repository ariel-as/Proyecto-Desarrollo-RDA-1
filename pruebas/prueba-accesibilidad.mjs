/**
 * Comprobaciones de accesibilidad WCAG 2.2 nivel AA sobre el marcado.
 *
 * Revisa lo que puede verificarse sin navegador: referencias ARIA válidas,
 * nombres accesibles en los controles, roles reconocidos, orden del foco y
 * señales globales de foco visible y de movimiento reducido.
 *
 * Los criterios que exigen el color computado y las medidas reales
 * (1.4.3 contraste, 1.4.10 reflujo, 1.4.4 zoom) se comprueban con el
 * navegador en pruebas/prueba-responsive.mjs.
 *
 * Ejecutar con:  node pruebas/prueba-accesibilidad.mjs
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');

let fallos = 0;
function comprobar(descripcion, condicion, extra = '') {
  console.log(`${condicion ? 'OK  ' : 'FALLA'} ${descripcion}${extra ? ' -> ' + extra : ''}`);
  if (!condicion) fallos += 1;
}

/** Roles ARIA definidos en la especificación (WAI-ARIA 1.2). */
const ROLES = new Set([
  'alert', 'alertdialog', 'application', 'article', 'banner', 'button', 'cell', 'checkbox',
  'columnheader', 'combobox', 'complementary', 'contentinfo', 'definition', 'dialog', 'directory',
  'document', 'feed', 'figure', 'form', 'grid', 'gridcell', 'group', 'heading', 'img', 'link',
  'list', 'listbox', 'listitem', 'log', 'main', 'marquee', 'math', 'menu', 'menubar', 'menuitem',
  'menuitemcheckbox', 'menuitemradio', 'navigation', 'none', 'note', 'option', 'presentation',
  'progressbar', 'radio', 'radiogroup', 'region', 'row', 'rowgroup', 'rowheader', 'scrollbar',
  'search', 'searchbox', 'separator', 'slider', 'spinbutton', 'status', 'switch', 'tab', 'table',
  'tablist', 'tabpanel', 'term', 'textbox', 'timer', 'toolbar', 'tooltip', 'tree', 'treegrid',
  'treeitem'
]);

/** Atributos ARIA cuyo valor es una lista de identificadores existentes. */
const REFERENCIAS = ['aria-describedby', 'aria-labelledby', 'aria-controls', 'aria-owns', 'aria-errormessage'];

/** Tipos de input que no necesitan nombre accesible propio. */
const INPUT_NO_INTERACTIVO = new Set(['hidden', 'submit', 'reset', 'button', 'image']);

const texto = (html) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

function archivos(extension) {
  const encontrados = [];
  const recorrer = (carpeta) => {
    for (const entrada of readdirSync(carpeta, { withFileTypes: true })) {
      if (entrada.name.startsWith('.') || entrada.name === 'node_modules') continue;
      const ruta = join(carpeta, entrada.name);
      if (entrada.isDirectory()) recorrer(ruta);
      else if (entrada.name.endsWith(extension)) encontrados.push(ruta);
    }
  };
  recorrer(raiz);
  return encontrados.sort();
}

/** Convierte el bloque de atributos de una etiqueta en un mapa. */
function atributos(bloque) {
  const mapa = {};
  for (const m of bloque.matchAll(/([a-zA-Z_:][-\w:.]*)(?:\s*=\s*"([^"]*)")?/g)) mapa[m[1].toLowerCase()] = m[2] ?? '';
  return mapa;
}

/** Ids declarados en el documento. */
function idsDelDocumento(codigo) {
  const set = new Set();
  for (const m of codigo.matchAll(/<[a-zA-Z][\w-]*\b([^>]*)>/g)) {
    const id = atributos(m[1]).id;
    if (id) set.add(id);
  }
  return set;
}

/**
 * Ids que el proyecto crea en tiempo de ejecución (el panel del carrito y el
 * modal de acceso se inyectan desde js/, y los mensajes de error se crean al
 * validar). Se leen del propio código para que la lista no quede desfasada.
 */
function idsInyectados() {
  const set = new Set();
  for (const ruta of archivos('.js')) {
    const codigo = readFileSync(ruta, 'utf8');
    for (const m of codigo.matchAll(/\bid\s*=\s*"([A-Za-z][\w-]*)"/g)) set.add(m[1]);
  }
  return set;
}

/**
 * Extrae los elementos con contenido, para poder calcular su nombre accesible
 * a partir del texto interior y no solo de los atributos.
 */
function elementosConContenido(codigo) {
  const encontrada = [];
  const patron = /<(button|a|select|textarea|label)\b([^>]*)>([\s\S]*?)<\/\1\s*>/gi;
  for (const m of codigo.matchAll(patron)) {
    encontrada.push({ tipo: m[1].toLowerCase(), atributos: atributos(m[2]), interior: m[3] });
  }
  return encontrada;
}

/** Elementos sin contenido: se leen solo por sus atributos. */
function elementosSinContenido(codigo, tipo) {
  return [...codigo.matchAll(new RegExp(`<${tipo}\\b([^>]*)>`, 'gi'))].map((m) => ({
    tipo,
    atributos: atributos(m[1]),
    interior: ''
  }));
}

const inyectados = idsInyectados();

for (const ruta of archivos('.html')) {
  const codigo = readFileSync(ruta, 'utf8');
  const pagina = relative(raiz, ruta).replace(/\\/g, '/');
  const existentes = idsDelDocumento(codigo);
  const conocidos = new Set([...existentes, ...inyectados]);

  /* --- Referencias ARIA válidas (WCAG 1.3.1 y 4.1.2) --- */
  const rotas = [];
  for (const m of codigo.matchAll(/<[a-zA-Z][\w-]*\b([^>]*)>/g)) {
    const at = atributos(m[1]);
    for (const nombre of REFERENCIAS) {
      const valor = at[nombre];
      if (valor === undefined) continue;
      if (!valor.trim()) {
        rotas.push(`${nombre} vacío`);
        continue;
      }
      for (const ref of valor.split(/\s+/).filter(Boolean)) {
        if (!conocidos.has(ref)) rotas.push(`${nombre}="${ref}"`);
      }
    }
  }
  comprobar(
    `${pagina}: las referencias ARIA apuntan a un id existente`,
    rotas.length === 0,
    rotas.join(' | ') || `${existentes.size} ids en la página`
  );

  /* --- Roles reconocidos --- */
  const rolesDesconocidos = [];
  for (const m of codigo.matchAll(/\brole\s*=\s*"([^"]*)"/gi)) {
    for (const rol of m[1].split(/\s+/).filter(Boolean)) {
      if (!ROLES.has(rol.toLowerCase())) rolesDesconocidos.push(rol);
    }
  }
  comprobar(`${pagina}: solo se usan roles ARIA válidos`, rolesDesconocidos.length === 0, rolesDesconocidos.join(', '));

  /* --- Orden del foco (WCAG 2.4.3): tabindex positivo lo rompe --- */
  const tabindexPositivo = [...codigo.matchAll(/\btabindex\s*=\s*"([^"]*)"/gi)]
    .map((m) => m[1])
    .filter((v) => Number(v) > 0);
  comprobar(`${pagina}: ningún elemento usa tabindex positivo`, tabindexPositivo.length === 0, tabindexPositivo.join(', '));

  /* --- Nombre accesible en cada control (WCAG 4.1.2, 3.3.2) --- */
  const controles = [
    ...elementosConContenido(codigo).filter((e) => ['button', 'a', 'select', 'textarea'].includes(e.tipo)),
    ...elementosSinContenido(codigo, 'input').filter((e) => !INPUT_NO_INTERACTIVO.has((e.atributos.type || '').toLowerCase()))
  ].filter((e) => e.tipo !== 'a' || e.atributos.href !== undefined);

  const sinNombre = controles.filter((e) => {
    const at = e.atributos;
    if ((at['aria-label'] || '').trim()) return false;
    if ((at['aria-labelledby'] || '').trim()) return false;
    if ((at.title || '').trim()) return false;
    if (at.id && new RegExp(`<label\\b[^>]*for\\s*=\\s*"${at.id}"[^>]*>[\\s\\S]*?</label>`, 'i').test(codigo)) return false;
    return texto(e.interior).length === 0;
  });
  comprobar(
    `${pagina}: todos los controles tienen nombre accesible`,
    sinNombre.length === 0,
    sinNombre.map((e) => `<${e.tipo}> ${JSON.stringify(texto(e.interior))} ${JSON.stringify(e.atributos.class || '')}`).join(' | ') ||
      `${controles.length} controles`
  );

  /* --- aria-hidden solo sobre contenido decorativo --- */
  const ocultosEnfocables = [...codigo.matchAll(/<(a|button|input|select|textarea)\b([^>]*aria-hidden\s*=\s*"true"[^>]*)>/gi)].map((m) => m[0]);
  comprobar(
    `${pagina}: aria-hidden="true" no se aplica a elementos enfocables`,
    ocultosEnfocables.length === 0,
    ocultosEnfocables.map((t) => t.slice(0, 60)).join(' | ')
  );
}

/* --- Señales globales de la hoja de estilos --- */
const css = readFileSync(join(raiz, 'assets', 'css', 'styles.css'), 'utf8');
comprobar('styles.css define un indicador de foco visible (:focus-visible)', /:focus-visible/.test(css));
comprobar('styles.css respeta prefers-reduced-motion', /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/.test(css));
comprobar('styles.css evita el desplazamiento horizontal de la página', /overflow-x:\s*(clip|hidden)/.test(css));

console.log(fallos === 0 ? '\nTodas las comprobaciones pasaron' : `\n${fallos} comprobaciones fallaron`);
process.exit(fallos === 0 ? 0 : 1);