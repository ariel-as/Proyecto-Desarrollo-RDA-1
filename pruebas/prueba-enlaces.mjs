/**
 * Seguridad de los enlaces externos y coherencia de las rutas internas.
 *
 * Revisa tres cosas:
 *   1. Que ningún destino sea peligroso (javascript:, data:) o mixto (http://).
 *   2. Que los enlaces a terceros que se abren en pestaña nueva incluyan
 *      rel="noopener", y que los embeds de YouTube lleven título, permisos y
 *      política de referencia.
 *   3. Que las rutas internas sean relativas y existan en disco, condición
 *      necesaria para que el sitio funcione al publicarse en un subdirectorio
 *      como el de GitHub Pages.
 *
 * Ejecutar con:  node pruebas/prueba-enlaces.mjs [carpeta]
 * Sin argumentos revisa el repositorio entero. Con una carpeta revisa esa
 * copia, por ejemplo el sitio ya preparado para publicar:
 *   node pruebas/prueba-enlaces.mjs _sitio
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve, relative, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(process.argv[2] || join(dirname(fileURLToPath(import.meta.url)), '..'));

let fallos = 0;
function comprobar(descripcion, condicion, extra = '') {
  console.log(`${condicion ? 'OK  ' : 'FALLA'} ${descripcion}${extra ? ' -> ' + extra : ''}`);
  if (!condicion) fallos += 1;
}

const ES_EXTERNO = /^(https?:)?\/\//i;
const ES_YOUTUBE = /^(https?:)?\/\/([a-z0-9-]+\.)*(youtube\.com|youtu\.be|youtube-nocookie\.com)\b/i;

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

function atributos(bloque) {
  const mapa = {};
  for (const m of bloque.matchAll(/([a-zA-Z_:][-\w:.]*)(?:\s*=\s*"([^"]*)")?/g)) mapa[m[1].toLowerCase()] = m[2] ?? '';
  return mapa;
}

/** Extrae todos los enlaces declarados en el marcado. */
function enlaces(codigo) {
  const encontrados = [];
  for (const m of codigo.matchAll(/<a\b([^>]*)>/gi)) {
    const at = atributos(m[1]);
    if (at.href !== undefined) encontrados.push({ tipo: 'a', ...at });
  }
  for (const m of codigo.matchAll(/<(?:img|script|link|iframe|source)\b([^>]*)>/gi)) {
    const at = atributos(m[1]);
    const destino = at.src ?? at.href ?? '';
    if (destino) encontrados.push({ tipo: m[0].slice(1).split(/\s/)[0].toLowerCase(), ...at, destino });
  }
  return encontrados;
}

const paginas = archivos('.html');
const externos = [];
const internos = [];
const youtube = [];
const iframes = [];

for (const ruta of paginas) {
  const codigo = readFileSync(ruta, 'utf8');
  const pagina = relative(raiz, ruta).replace(/\\/g, '/');
  const base = dirname(ruta);

  for (const e of enlaces(codigo)) {
    const destino = e.href ?? e.destino ?? '';
    const etiqueta = `${pagina} -> ${destino.slice(0, 60)}`;

    /* --- Destinos peligrosos --- */
    if (/^\s*javascript:/i.test(destino)) {
      comprobar(`${pagina}: sin enlaces javascript:`, false, etiqueta);
      continue;
    }
    if (/^\s*data:/i.test(destino)) {
      comprobar(`${pagina}: sin enlaces data: en la navegación`, false, etiqueta);
      continue;
    }

    /* --- Externos --- */
    if (ES_EXTERNO.test(destino)) {
      externos.push({ etiqueta, e, pagina });
      if (/^http:\/\//i.test(destino)) {
        comprobar(`${pagina}: todo destino externo usa https`, false, etiqueta);
      }
      if (ES_YOUTUBE.test(destino)) youtube.push({ etiqueta, e, pagina });
      continue;
    }

    /* --- Internos --- */
    if (!destino || destino.startsWith('#') || destino.startsWith('mailto:') || destino.startsWith('tel:')) continue;
    internos.push({ etiqueta, e, pagina, base, destino });
  }

  /* --- iframes: permisos y política de referencia --- */
  for (const m of codigo.matchAll(/<iframe\b([^>]*)>/gi)) {
    iframes.push({ pagina, at: atributos(m[1]) });
  }
}

comprobar('No hay destinos javascript: ni data:', !externos.some((x) => /^javascript:/i.test(x.etiqueta)));
comprobar(
  'Todos los destinos externos usan https',
  externos.every((x) => !/^http:\/\//i.test(x.etiqueta)),
  externos.map((x) => x.etiqueta).join(' | ') || 'sin enlaces externos'
);

/* --- target="_blank" con rel="noopener" (evita reverse tabnabbing) --- */
const enNuevaPestana = externos.filter((x) => (x.e.target || '').toLowerCase() === '_blank');
const sinNoopener = enNuevaPestana.filter((x) => !(x.e.rel || '').toLowerCase().includes('noopener'));
comprobar(
  'Los enlaces con target="_blank" declaran rel="noopener"',
  sinNoopener.length === 0,
  sinNoopener.map((x) => `${x.etiqueta} rel="${x.e.rel ?? ''}"`).join(' | ') || `${enNuevaPestana.length} enlaces externos en pestaña nueva`
);
comprobar(
  'Los enlaces con target="_blank" declaran rel="noreferrer"',
  enNuevaPestana.every((x) => (x.e.rel || '').toLowerCase().includes('noreferrer')),
  enNuevaPestana.filter((x) => !(x.e.rel || '').toLowerCase().includes('noreferrer')).map((x) => x.etiqueta).join(' | ') || 'correcto'
);

/* --- YouTube --- */
const youtubeInseguro = youtube.filter((x) => !/^https:\/\//i.test(x.etiqueta.split('-> ')[1] ?? ''));
comprobar(
  'Los enlaces de YouTube usan https',
  youtubeInseguro.length === 0,
  youtubeInseguro.map((x) => x.etiqueta).join(' | ') || (youtube.length ? youtube.map((x) => x.etiqueta).join(' | ') : 'el proyecto no enlaza a YouTube')
);

const iframesYoutube = iframes.filter((f) => ES_YOUTUBE.test(f.at.src ?? ''));
comprobar(
  'Los iframes de YouTube tienen título accesible',
  iframesYoutube.every((f) => (f.at.title ?? '').trim()),
  iframesYoutube.filter((f) => !(f.at.title ?? '').trim()).map((f) => `${f.pagina} src="${f.at.src}"`).join(' | ') || `${iframesYoutube.length} iframes de YouTube`
);
comprobar(
  'Los iframes de YouTube declaran allowfullscreen',
  iframesYoutube.every((f) => 'allowfullscreen' in f.at),
  iframesYoutube.filter((f) => !('allowfullscreen' in f.at)).map((f) => f.pagina).join(' | ') || 'correcto'
);
comprobar(
  'Los iframes de YouTube declaran referrerpolicy',
  iframesYoutube.every((f) => (f.at.referrerpolicy ?? '') !== ''),
  iframesYoutube.filter((f) => (f.at.referrerpolicy ?? '') === '').map((f) => f.pagina).join(' | ') || 'correcto'
);
comprobar(
  'Los embeds de YouTube usan el dominio youtube-nocookie.com',
  iframesYoutube.every((f) => /youtube-nocookie\.com/i.test(f.at.src ?? '')),
  iframesYoutube.filter((f) => !/youtube-nocookie\.com/i.test(f.at.src ?? '')).map((f) => f.at.src).join(' | ') || 'sin embeds'
);

/* --- Rutas internas relativas y existentes (GitHub Pages vive en un subdirectorio) --- */
const absolutas = internos.filter((x) => x.destino.startsWith('/'));
comprobar(
  'Las rutas internas son relativas (compatibles con GitHub Pages)',
  absolutas.length === 0,
  absolutas.map((x) => x.etiqueta).join(' | ') || `${internos.length} rutas internas`
);

const inexistentes = internos.filter((x) => {
  const limpio = x.destino.split('#')[0].split('?')[0];
  if (!limpio) return false;
  return !existsSync(join(x.base, normalize(limpio)));
});
comprobar(
  'Todas las rutas internas apuntan a un archivo del repositorio',
  inexistentes.length === 0,
  inexistentes.map((x) => x.etiqueta).join(' | ') || `${internos.length} rutas verificadas`
);

/* --- Recursos(img, script, css) presentes en disco --- */
const recursos = [];
for (const ruta of paginas) {
  const codigo = readFileSync(ruta, 'utf8');
  for (const m of codigo.matchAll(/<(?:img|script|link)\b([^>]*)>/gi)) {
    const at = atributos(m[1]);
    const destino = at.src ?? at.href ?? '';
    if (!destino || ES_EXTERNO.test(destino) || destino.startsWith('data:')) continue;
    recursos.push({
      etiqueta: `${relative(raiz, ruta).replace(/\\/g, '/')} -> ${destino}`,
      existe: existsSync(join(dirname(ruta), normalize(destino)))
    });
  }
}
const recursosAusentes = recursos.filter((r) => !r.existe);
comprobar(
  'Todas las imágenes y hojas de estilo locales existen en disco',
  recursosAusentes.length === 0,
  recursosAusentes.map((r) => r.etiqueta).join(' | ') || `${recursos.length} recursos`
);

console.log('\n--- Resumen ---');
console.log(`Enlaces externos revisados: ${externos.length}`);
for (const x of externos) console.log(`  ${x.etiqueta}`);
console.log(`Enlaces a YouTube: ${youtube.length}`);
console.log(`iframes: ${iframes.length} (de YouTube: ${iframesYoutube.length})`);
console.log(`Rutas internas: ${internos.length}`);
console.log(`Recursos locales: ${recursos.length}`);

console.log(fallos === 0 ? '\nTodas las comprobaciones pasaron' : `\n${fallos} comprobaciones fallaron`);
process.exit(fallos === 0 ? 0 : 1);