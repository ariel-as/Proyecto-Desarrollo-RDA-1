/**
 * Comprueba que cada selector data-, id o clase usado por el controlador de una
 * página exista en esa página, y que las imágenes referenciadas estén en disco.
 *
 * Para cada página se toma el código de su función controladora más las
 * funciones a las que llama (cierre transitivo), de modo que no se exigen
 * selectores de otras páginas.
 *
 * Ejecutar con: node pruebas/prueba-selectores.mjs
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const PAGINAS = [
  { archivo: 'index.html', script: 'js/app.js', clave: 'inicio' },
  { archivo: 'cliente/checkout.html', script: 'js/app.js', clave: 'checkout' },
  { archivo: 'cliente/nutricion.html', script: 'js/app.js', clave: 'nutricion' },
  { archivo: 'cliente/login.html', script: 'js/app.js', clave: 'login' },
  { archivo: 'admin/index.html', script: 'js/admin.js', clave: 'index' },
  { archivo: 'admin/productos.html', script: 'js/admin.js', clave: 'productos' },
  { archivo: 'admin/planes.html', script: 'js/admin.js', clave: 'planes' },
  { archivo: 'admin/clases.html', script: 'js/admin.js', clave: 'clases' },
  { archivo: 'admin/entrenadores.html', script: 'js/admin.js', clave: 'entrenadores' }
];

/** Secciones que la página principal debe exponer como anchors. */
const SECCIONES_INDEX = ['inicio', 'planes', 'tienda', 'clases', 'rutinas', 'nutricion', 'contacto'];

/** Páginas de sección que ya no deben enlazarse desde el index. */
const RUTAS_LEGADAS = [
  'cliente/planes.html',
  'cliente/productos.html',
  'cliente/clases.html',
  'cliente/carrito.html'
];

/** Devuelve el cuerpo de la función declarada con `nombre`. */
function cuerpoDe(codigo, nombre) {
  const patronDeclaracion = new RegExp(`(?:async\\s+)?function\\s+${nombre}\\s*\\(`);
  const m = patronDeclaracion.exec(codigo) ?? new RegExp(`(?:const|let)\\s+${nombre}\\s*=\\s*(?:async\\s*)?\\(`).exec(codigo);
  if (!m) return '';
  let i = m.index + m[0].length - 1;
  let profundidad = 0;
  for (; i < codigo.length; i += 1) {
    const c = codigo[i];
    if (c === '(') profundidad += 1;
    else if (c === ')') {
      profundidad -= 1;
      if (profundidad === 0) break;
    }
  }
  let llaves = 0;
  let inicio = codigo.indexOf('{', i);
  if (inicio === -1) return '';
  for (let j = inicio; j < codigo.length; j += 1) {
    if (codigo[j] === '{') llaves += 1;
    else if (codigo[j] === '}') {
      llaves -= 1;
      if (llaves === 0) return codigo.slice(inicio, j + 1);
    }
  }
  return '';
}

/** Funciones declaradas en el script. */
const funcionesDe = (codigo) => [...codigo.matchAll(/(?:async\s+)?function\s+([A-Za-z0-9_$]+)\s*\(/g)].map((m) => m[1]);

const llamadasDe = (codigo) => [...codigo.matchAll(/\b([A-Za-z0-9_$]+)\s*\(/g)].map((m) => m[1]);

const selectoresDe = (codigo) => {
  const salida = new Set();
  for (const m of codigo.matchAll(/select(?:Todos)?\('\[data-([a-z0-9-]+)/g)) salida.add(`data-${m[1]}`);
  for (const m of codigo.matchAll(/select(?:Todos)?\('#([A-Za-z0-9_-]+)/g)) salida.add(`id:${m[1]}`);
  for (const m of codigo.matchAll(/select(?:Todos)?\('\.([A-Za-z0-9_-]+)/g)) salida.add(`.${m[1]}`);
  for (const m of codigo.matchAll(/getElementById\('([A-Za-z0-9_-]+)'\)/g)) salida.add(`id:${m[1]}`);
  for (const m of codigo.matchAll(/querySelector(?:All)?\('#([A-Za-z0-9_-]+)/g)) salida.add(`id:${m[1]}`);
  for (const m of codigo.matchAll(/querySelector(?:All)?\('\[data-([a-z0-9-]+)/g)) salida.add(`data-${m[1]}`);
  return salida;
};

const atributosDe = (html) => {
  const set = new Set();
  for (const m of html.matchAll(/\bdata-([a-z0-9-]+)/gi)) set.add(`data-${m[1]}`);
  for (const m of html.matchAll(/\bid="([^"]+)"/gi)) set.add(`id:${m[1]}`);
  for (const m of html.matchAll(/\bclass="([^"]+)"/gi)) m[1].split(/\s+/).forEach((c) => set.add(`.${c}`));
  return set;
};

let fallos = 0;
const comprobar = (desc, ok, extra = '') => {
  if (!ok) fallos += 1;
  console.log(`${ok ? 'OK  ' : 'FALLA'} ${desc}${extra ? ' -> ' + extra : ''}`);
};

const cache = new Map();
for (const { archivo, script, clave } of PAGINAS) {
  if (!cache.has(script)) cache.set(script, readFileSync(join(raiz, script), 'utf8'));
  const codigo = cache.get(script);

  const mapa = codigo.match(/(?:const\s+)?PAGINAS(?:_ADMIN)?\s*=\s*\{([\s\S]*?)\n\}/);
  const entrada = mapa?.[1]
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.startsWith(`${clave}:`));
  comprobar(`${archivo}: el script declara el controlador "${clave}"`, Boolean(entrada), entrada ?? 'no encontrado');
  if (!entrada) continue;

  const funciones = funcionesDe(codigo);
  const pendientes = [entrada.split(':')[1].trim().replace(/,$/, '')];
  const visitadas = new Set();
  let codigoRelevante = '';
  while (pendientes.length) {
    const nombre = pendientes.pop();
    if (!nombre || visitadas.has(nombre) || !funciones.includes(nombre)) continue;
    visitadas.add(nombre);
    const cuerpo = cuerpoDe(codigo, nombre);
    codigoRelevante += cuerpo;
    for (const llamada of llamadasDe(cuerpo)) {
      if (funciones.includes(llamada)) pendientes.push(llamada);
    }
  }
  // El arranque de la página siempre usa iniciarComunes().
  const comunes = nombre => (/iniciarComunes/.test(codigoRelevante) ? 'iniciarComunes' : nombre);

  const html = readFileSync(join(raiz, archivo), 'utf8');
  const disponibles = atributosDe(html);
  const pedidos = selectoresDe(codigoRelevante);
  const faltan = [...pedidos].filter((s) => !disponibles.has(s) && !comunes(s));

  comprobar(
    `${archivo}: existen los ${pedidos.size} selectores de su controlador (${visitadas.size} funciones)`,
    faltan.length === 0,
    faltan.join(', ')
  );

  const body = html.match(/<body[^>]*data-pagina="([^"]+)"/i)?.[1];
  if (body) comprobar(`${archivo}: data-pagina="${body}"`, body === clave, `esperado ${clave}`);
}

/* La página principal concentra todas las secciones y la navegación. */
const htmlIndex = readFileSync(join(raiz, 'index.html'), 'utf8');

for (const seccion of SECCIONES_INDEX) {
  const tieneId = new RegExp(`id="${seccion}"`).test(htmlIndex);
  const tieneEnlace = new RegExp(`href="#${seccion}"`).test(htmlIndex);
  comprobar(`index.html: sección #${seccion} presente y enlazada`, tieneId && tieneEnlace);
}

for (const ruta of RUTAS_LEGADAS) {
  comprobar(`index.html: ya no enlaza a la página legada ${ruta}`, !htmlIndex.includes(`"${ruta}"`));
}

/* Imágenes referenciadas por las páginas y los JSON. */
const existentes = new Set();
const recorrer = (dir) => {
  if (!existsSync(dir)) return;
  for (const entrada of readdirSync(dir, { withFileTypes: true })) {
    if (entrada.isDirectory()) recorrer(join(dir, entrada.name));
    else existentes.add(entrada.name.toLowerCase());
  }
};
recorrer(join(raiz, 'assets'));

const referenciadas = new Set();
for (const pagina of PAGINAS) {
  const html = readFileSync(join(raiz, pagina.archivo), 'utf8');
  for (const m of html.matchAll(/(?:src|href)="([^"]*\.(?:svg|png|jpe?g|webp))"/gi)) referenciadas.add(m[1].split('/').pop().toLowerCase());
}
for (const json of ['productos.json', 'planes.json', 'clases.json', 'entrenadores.json', 'gimnasio.json']) {
  const contenido = readFileSync(join(raiz, 'data', json), 'utf8');
  for (const m of contenido.matchAll(/"imagen":\s*"([^"]+)"/gi)) {
    referenciadas.add(m[1].split('/').pop().toLowerCase());
  }
}
const noEncontradas = [...referenciadas].filter((img) => !existentes.has(img));
comprobar(`Las ${referenciadas.size} imágenes referenciadas existen`, noEncontradas.length === 0, noEncontradas.join(', '));

console.log(fallos === 0 ? '\nTodas las comprobaciones pasaron' : `\n${fallos} comprobaciones fallaron`);
process.exit(fallos === 0 ? 0 : 1);