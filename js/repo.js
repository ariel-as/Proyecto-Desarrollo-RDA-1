/**
 * repo.js - Modelo de datos del proyecto.
 *
 * Responsabilidades:
 *   1. Traer los archivos JSON locales con Fetch API.
 *   2. Validar la respuesta.
 *   3. Guardar una copia del catálogo en IndexedDB.
 *   4. Aplicar los cambios realizados desde el área administrativa.
 *   5. Devolver los datos ya listos para que la vista los pinte.
 *
 * Flujo con experiencia progresiva:
 *   Fetch -> ¿funciona? -> sí: se guarda en IndexedDB y se muestra
 *                      -> no: se lee IndexedDB y se muestra lo guardado
 */

import {
  guardarCatalogo,
  leerCatalogo,
  guardarRegistro,
  eliminarRegistro,
  vaciarAlmacen,
  ALMACENES
} from './indexeddb.js';
import { leerLocal, escribirLocal, registrarActualizacion, raizSitio } from './storage.js';

/** Prefijo de las claves donde se guardan los cambios del administrador. */
const PREFIJO_CAMBIOS = 'pf_catalogo_';

/**
 * Construye la URL de un archivo JSON del proyecto.
 * Se resuelve desde la raíz del sitio: las páginas están en index.html,
 * cliente/ y admin/, pero los datos siempre viven en /data.
 */
function rutaJSON(nombre) {
  return new URL(`data/${nombre}.json`, raizSitio()).href;
}

/* =========================================================
   Cambios aplicados desde el área administrativa
   ========================================================= */

/** Devuelve el objeto de cambios guardado para un catálogo. */
export function leerCambios(nombre) {
  return leerLocal(`${PREFIJO_CAMBIOS}${nombre}`, {
    agregados: [],
    actualizados: {},
    eliminados: []
  });
}

/** Guarda el objeto de cambios de un catálogo. */
export function escribirCambios(nombre, cambios) {
  return escribirLocal(`${PREFIJO_CAMBIOS}${nombre}`, cambios);
}

/**
 * Aplica los cambios administrativos sobre la lista de datos del JSON.
 * Mantiene los datos del archivo JSON como fuente base y encima pone
 * altas, modificaciones y eliminaciones hechas en el dashboard.
 */
function aplicarCambios(nombre, datos) {
  const cambios = leerCambios(nombre);
  const eliminados = new Set(cambios.eliminados || []);
  const resultado = datos
    .filter((registro) => !eliminados.has(registro.id))
    .map((registro) => ({ ...registro, ...(cambios.actualizados?.[registro.id] || {}) }));

  const existentes = new Set(resultado.map((registro) => registro.id));
  (cambios.agregados || []).forEach((registro) => {
    if (!existentes.has(registro.id)) resultado.push(registro);
  });

  return resultado;
}

/** Siguiente identificador libre para un catálogo. */
function siguienteId(datos) {
  return datos.reduce((maximo, registro) => Math.max(maximo, Number(registro.id) || 0), 0) + 1;
}

/* =========================================================
   Carga de datos
   ========================================================= */

/**
 * Descarga un JSON local con Fetch API.
 * Lanza un error si la respuesta no es correcta para que el flujo
 * pueda recurrir a IndexedDB.
 */
async function traerJSON(nombre) {
  const respuesta = await fetch(rutaJSON(nombre), { cache: 'no-cache' });

  if (!respuesta.ok) {
    throw new Error(`No se pudo cargar ${nombre}.json (estado ${respuesta.status}).`);
  }

  const datos = await respuesta.json();

  if (!Array.isArray(datos) || datos.length === 0) {
    throw new Error(`${nombre}.json no contiene una lista de registros válida.`);
  }

  return datos;
}

/**
 * Carga un catálogo aplicando el flujo de experiencia progresiva.
 * @returns {Promise<{datos: Array, origen: 'fetch'|'indexeddb', mensaje: string}>}
 */
export async function cargarCatalogo(nombre) {
  try {
    const datos = await traerJSON(nombre);
    const efectivos = aplicarCambios(nombre, datos);
    // La red funcionó: se guarda en IndexedDB la lista ya efectiva (archivo JSON
    // con los cambios del panel encima) para que sin conexión se vea lo mismo.
    await guardarCatalogo(nombre, efectivos).catch((error) =>
      console.warn('No se pudo guardar el catálogo en IndexedDB:', error)
    );
    registrarActualizacion();
    return {
      datos: efectivos,
      origen: 'fetch',
      mensaje: `Datos de ${nombre}.json cargados.`
    };
  } catch (error) {
    console.warn(`Fetch de ${nombre}.json falló:`, error);
    try {
      const guardados = await leerCatalogo(nombre);
      if (guardados.length === 0) throw new Error('IndexedDB no tiene copia del catálogo.');
      return {
        datos: aplicarCambios(nombre, guardados),
        origen: 'indexeddb',
        mensaje: `Sin conexión: se muestra el catálogo guardado de ${nombre}.`
      };
    } catch (errorIdb) {
      return {
        datos: [],
        origen: 'error',
        mensaje: `No se pudo cargar ${nombre}.json ni la copia local.`
      };
    }
  }
}

/** Lista de productos del catálogo. */
export function obtenerProductos() {
  return cargarCatalogo('productos');
}

/** Lista de planes del gimnasio. */
export function obtenerPlanes() {
  return cargarCatalogo('planes');
}

/** Lista de clases con sus horarios. */
export function obtenerClases() {
  return cargarCatalogo('clases');
}

/** Lista de los 3 entrenadores. */
export function obtenerEntrenadores() {
  return cargarCatalogo('entrenadores');
}

/** Datos fijos del gimnasio (identidad, servicios, niveles y usuarios de prueba). */
export async function obtenerGimnasio() {
  const respuesta = await fetch(rutaJSON('gimnasio'), { cache: 'no-cache' });
  if (!respuesta.ok) {
    throw new Error('No se pudo cargar gimnasio.json.');
  }
  return respuesta.json();
}

/* =========================================================
   Operaciones del área administrativa
   ========================================================= */

/** Resuelve el catálogo actual (JSON + cambios administrativos). */
async function catalogoActual(nombre) {
  const { datos } = await cargarCatalogo(nombre);
  return datos;
}

/** Crea un producto y lo guarda en IndexedDB y en los cambios locales. */
export async function crearProducto(producto) {
  const datos = await catalogoActual('productos');
  const nuevo = { ...producto, id: siguienteId(datos) };
  const cambios = leerCambios('productos');
  cambios.agregados = [...(cambios.agregados || []), nuevo];
  escribirCambios('productos', cambios);
  await guardarRegistro(ALMACENES.productos, nuevo).catch(() => {});
  return nuevo;
}

/** Actualiza un producto existente. */
export async function actualizarProducto(id, datosEditados) {
  const cambios = leerCambios('productos');
  const actualizados = { ...(cambios.actualizados || {}) };
  actualizados[id] = { ...(actualizados[id] || {}), ...datosEditados, id: Number(id) };
  cambios.actualizados = actualizados;
  // Si estaba en agregados, se actualiza también allí para no duplicarlo.
  if ((cambios.agregados || []).some((p) => p.id === Number(id))) {
    cambios.agregados = cambios.agregados.map((p) =>
      p.id === Number(id) ? { ...p, ...datosEditados, id: Number(id) } : p
    );
  }
  escribirCambios('productos', cambios);
  await guardarRegistro(ALMACENES.productos, { ...datosEditados, id: Number(id) }).catch(() => {});
  return actualizados[id];
}

/** Elimina un producto del catálogo. */
export async function borrarProducto(id) {
  const cambios = leerCambios('productos');
  cambios.eliminados = [...new Set([...(cambios.eliminados || []), Number(id)])];
  cambios.agregados = (cambios.agregados || []).filter((p) => p.id !== Number(id));
  escribirCambios('productos', cambios);
  await eliminarRegistro(ALMACENES.productos, Number(id)).catch(() => {});
}

/** Actualiza los datos de un plan (nombre, precio, descripción). */
export async function actualizarPlan(id, datosEditados) {
  const cambios = leerCambios('planes');
  const actualizados = { ...(cambios.actualizados || {}) };
  actualizados[id] = { ...(actualizados[id] || {}), ...datosEditados, id: Number(id) };
  cambios.actualizados = actualizados;
  escribirCambios('planes', cambios);
  return actualizados[id];
}

/** Actualiza una clase, incluidos sus horarios y su entrenador. */
export async function actualizarClase(id, datosEditados) {
  const cambios = leerCambios('clases');
  const actualizados = { ...(cambios.actualizados || {}) };
  actualizados[id] = { ...(actualizados[id] || {}), ...datosEditados, id: Number(id) };
  cambios.actualizados = actualizados;
  escribirCambios('clases', cambios);
  return actualizados[id];
}

/** Actualiza la información de un entrenador. */
export async function actualizarEntrenador(id, datosEditados) {
  const cambios = leerCambios('entrenadores');
  const actualizados = { ...(cambios.actualizados || {}) };
  actualizados[id] = { ...(actualizados[id] || {}), ...datosEditados, id: Number(id) };
  cambios.actualizados = actualizados;
  escribirCambios('entrenadores', cambios);
  return actualizados[id];
}

/** Descarta los cambios administrativos y vuelve al contenido de los JSON. */
export function restablecerCatalogo(nombre) {
  escribirCambios(nombre, { agregados: [], actualizados: {}, eliminados: [] });
  return vaciarAlmacen(ALMACENES[nombre] || nombre).catch(() => {});
}

/* =========================================================
   Citas de nutrición (flujo local)
   ========================================================= */

/** Genera un identificador único para una cita. */
export function generarIdCita() {
  return `cita-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

/** Identificador de un pedido confirmado en el checkout. */
export function generarIdPedido() {
  return `PF-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;
}