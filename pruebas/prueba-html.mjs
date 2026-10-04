/**
 * Comprobaciones de HTML5 y uso del HTML semántico.
 *
 * No usa dependencias: analiza el marcado de las páginas del proyecto y
 * comprueba los criterios estructurales de HTML5 que exige el proyecto:
 * doctype, metadatos, jerarquía de encabezados, regiones (landmarks),
 * unicidad de identificadores, texto alternativo, etiquetas de formulario
 * y ausencia de manejadores en línea.
 *
 * Ejecutar con:  node pruebas/prueba-html.mjs
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

/** Devuelve todas las páginas HTML del proyecto, ignorando carpetas ocultas. */
function paginasHtml() {
  const encontradas = [];
  const recorrer = (carpeta) => {
    for (const entrada of readdirSync(carpeta, { withFileTypes: true })) {
      if (entrada.name.startsWith('.') || entrada.name === 'node_modules') continue;
      const ruta = join(carpeta, entrada.name);
      if (entrada.isDirectory()) recorrer(ruta);
      else if (entrada.name.endsWith('.html')) encontradas.push(ruta);
    }
  };
  recorrer(raiz);
  return encontradas.sort();
}

/** Etiquetas de un tipo, con su marcado completo. */
function etiquetas(codigo, tipo) {
  return codigo.match(new RegExp(`<${tipo}\\b[^>]*>`, 'gi')) || [];
}

/** Valor de un atributo dentro de una etiqueta. */
function atributo(etiqueta, nombre) {
  const m = new RegExp(`\\b${nombre}\\s*=\\s*"([^"]*)"`, 'i').exec(etiqueta);
  if (m) return m[1];
  const simple = new RegExp(`\\b${nombre}\\s*=\\s*([^\\s>]+)`, 'i').exec(etiqueta);
  return simple ? simple[1] : null;
}

/** Ids declarados en la página. */
function ids(codigo) {
  return etiquetas(codigo, '[a-zA-Z][\\w-]*')
    .map((t) => atributo(t, 'id'))
    .filter(Boolean);
}

const paginas = paginasHtml();
comprobar('Se encontraron páginas HTML que analizar', paginas.length > 0, `${paginas.length} páginas`);

for (const ruta of paginas) {
  const codigo = readFileSync(ruta, 'utf8');
  const pagina = relative(raiz, ruta).replace(/\\/g, '/');

  /* --- Documento y metadatos --- */
  comprobar(`${pagina}: empieza con el doctype HTML5`, /^\s*<!DOCTYPE html>/i.test(codigo));
  comprobar(`${pagina}: <html> declara lang="es"`, /<html[^>]*\slang\s*=\s*"es"/i.test(codigo));
  comprobar(`${pagina}: declara meta charset`, /<meta[^>]*charset\s*=\s*["']?utf-8/i.test(codigo));

  const viewport = etiquetas(codigo, 'meta').find((t) =>
    /name\s*=\s*"viewport"/i.test(t)
  );
  comprobar(`${pagina}: declara meta viewport`, Boolean(viewport), viewport || 'ausente');
  if (viewport) {
    const contenido = atributo(viewport, 'content') || '';
    comprobar(`${pagina}: viewport usa width=device-width`, /width\s*=\s*device-width/i.test(contenido), contenido);
    // WCAG 2.2 - 1.4.4: la página no debe impedir el zoom.
    comprobar(
      `${pagina}: el viewport no bloquea el zoom`,
      !/user-scalable\s*=\s*no/i.test(contenido) && !/maximum-scale\s*=\s*1(\.0)?\b/i.test(contenido),
      contenido
    );
  }

  const titulo = /<title>([\s\S]*?)<\/title>/i.exec(codigo);
  comprobar(`${pagina}: tiene <title> con contenido`, Boolean(titulo && titulo[1].trim()), titulo?.[1]?.trim() || 'ausente');

  /* --- Jerarquía de encabezados --- */
  const niveles = [...codigo.matchAll(/<h([1-6])\b/gi)].map((m) => Number(m[1]));
  const h1 = niveles.filter((n) => n === 1).length;
  comprobar(`${pagina}: tiene exactamente un <h1>`, h1 === 1, `encontrados: ${h1}`);

  const saltos = [];
  for (let i = 1; i < niveles.length; i += 1) {
    if (niveles[i] - niveles[i - 1] > 1) saltos.push(`h${niveles[i - 1]}→h${niveles[i]}`);
  }
  comprobar(`${pagina}: la jerarquía de encabezados no salta niveles`, saltos.length === 0, saltos.join(', ') || 'sin saltos');

  /* --- Regiones (landmarks) --- */
  const cuenta = (tipo) => (codigo.match(new RegExp(`<${tipo}\\b`, 'gi')) || []).length;
  comprobar(`${pagina}: tiene exactamente un <main>`, cuenta('main') === 1, `${cuenta('main')}`);
  comprobar(`${pagina}: tiene al menos un <header>`, cuenta('header') >= 1);
  comprobar(`${pagina}: tiene al menos un <footer>`, cuenta('footer') >= 1);
  comprobar(`${pagina}: tiene al menos un <nav>`, cuenta('nav') >= 1);

  /* --- Identificadores únicos --- */
  const listaIds = ids(codigo);
  const repetidos = [...new Set(listaIds.filter((id, i) => listaIds.indexOf(id) !== i))];
  comprobar(`${pagina}: no hay identificadores duplicados`, repetidos.length === 0, repetidos.join(', ') || `${listaIds.length} ids`);

  /* --- Imágenes --- */
  const imagenes = etiquetas(codigo, 'img');
  const sinAlt = imagenes.filter((t) => atributo(t, 'alt') === null);
  comprobar(`${pagina}: todas las <img> tienen atributo alt`, sinAlt.length === 0, `${imagenes.length} imágenes`);

  // WCAG 2.2 - 1.1.1: una imagen decorativa se marca con alt="" y se oculta a
  // las tecnologías de apoyo. Mezclar decorativas e informativas es válido.
  const decorativas = imagenes.filter((t) => atributo(t, 'alt') === '');
  const informativas = imagenes.filter((t) => (atributo(t, 'alt') || '').trim().length > 0);

  // Un alt con texto no puede venir oculta a la vez: la información se pierde.
  const contradictorias = informativas.filter((t) => atributo(t, 'aria-hidden') === 'true');
  comprobar(
    `${pagina}: ninguna <img> con alt de texto está aria-hidden`,
    contradictorias.length === 0,
    contradictorias.map((t) => (atributo(t, 'alt') || '').slice(0, 30)).join(' | ') || `${informativas.length} informativas, ${decorativas.length} decorativas`
  );

  // Un alt que solo repite el nombre del archivo no describe nada.
  const altArchivo = imagenes.filter((t) => {
    const alt = (atributo(t, 'alt') || '').trim();
    const src = (atributo(t, 'src') || '').split('/').pop() || '';
    return alt.length > 0 && alt.toLowerCase() === src.toLowerCase();
  });
  comprobar(
    `${pagina}: ningún alt se limita al nombre del archivo`,
    altArchivo.length === 0,
    altArchivo.map((t) => atributo(t, 'alt')).join(' | ')
  );

  // Una imagen decorativa no puede ser el único contenido de un enlace o botón:
  // el control se quedaría sin nombre accesible.
  const imgComoNombre = codigo.match(/<(a|button)\b[^>]*>\s*<img\b[^>]*alt\s*=\s*""[^>]*>\s*<\/\1>/gi) || [];
  comprobar(
    `${pagina}: ningún enlace o botón depende de una imagen decorativa`,
    imgComoNombre.length === 0,
    imgComoNombre.map((t) => t.slice(0, 60)).join(' | ')
  );

  /* --- Controles de formulario etiquetados --- */
  const controles = [...etiquetas(codigo, 'input'), ...etiquetas(codigo, 'select'), ...etiquetas(codigo, 'textarea')]
    .filter((t) => !/type\s*=\s*["']?(hidden|submit|button|reset)/i.test(t));
  const sinEtiqueta = [];
  for (const control of controles) {
    const id = atributo(control, 'id');
    const nombre = atributo(control, 'name');
    const aria = atributo(control, 'aria-label') || atributo(control, 'aria-labelledby');
    const tieneLabelFor = id && new RegExp(`<label[^>]*for\\s*=\\s*"${id}"`, 'i').test(codigo);
    if (!aria && !tieneLabelFor) sinEtiqueta.push(`#${id || nombre || '?'} (${control.slice(0, 60)})`);
  }
  comprobar(`${pagina}: todos los controles tienen etiqueta asociada`, sinEtiqueta.length === 0, sinEtiqueta.join(' | ') || `${controles.length} controles`);

  /* --- Botones con type explícito --- */
  const botones = etiquetas(codigo, 'button');
  const sinType = botones.filter((t) => atributo(t, 'type') === null);
  comprobar(
    `${pagina}: todos los <button> declaran type`,
    sinType.length === 0,
    sinType.map((t) => (atributo(t, 'class') || t).slice(0, 50)).join(' | ') || `${botones.length} botones`
  );

  /* --- Sin manejadores en línea --- */
  const enLinea = etiquetas(codigo, '[a-zA-Z][\\w-]*').filter((t) => /\son[a-z]+\s*=/i.test(t));
  comprobar(`${pagina}: no hay manejadores on* en línea`, enLinea.length === 0, enLinea.map((t) => t.slice(0, 50)).join(' | '));

  /* --- Enlace de salto --- */
  const salto = /<a[^>]*class\s*=\s*"[^"]*pf-saltar[^"]*"[^>]*href\s*=\s*"#([^"]+)"/i.exec(codigo);
  if (salto) {
    comprobar(`${pagina}: el enlace de salto apunta a un id existente`, listaIds.includes(salto[1]), `#${salto[1]}`);
  }
}

console.log(fallos === 0 ? '\nTodas las comprobaciones pasaron' : `\n${fallos} comprobaciones fallaron`);
process.exit(fallos === 0 ? 0 : 1);