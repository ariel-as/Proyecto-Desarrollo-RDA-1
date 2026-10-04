/**
 * indexeddb.js - Base de datos local del proyecto (PlanetaFitnessDB).
 *
 * Guarda el catálogo y los datos de la tienda en almacenes de objetos para que
 * el sitio pueda seguir mostrando el catálogo cuando el Fetch API falla o el
 * navegador está sin conexión (experiencia progresiva).
 *
 * Se utilizan transacciones 'readonly' y 'readwrite' según corresponda.
 */

export const NOMBRE_DB = 'PlanetaFitnessDB';
export const VERSION_DB = 2;

/** Almacenes de objetos de la base. */
export const ALMACENES = {
  productos: 'productos',
  planes: 'planes',
  clases: 'clases',
  entrenadores: 'entrenadores',
  citas: 'citas',
  pedidos: 'pedidos'
};

/** Traduce nombres de archivo a nombre de almacén. */
const ALMACEN_POR_ARCHIVO = {
  productos: ALMACENES.productos,
  planes: ALMACENES.planes,
  clases: ALMACENES.clases,
  entrenadores: ALMACENES.entrenadores
};

/** Promise de la conexión abierta: se reutiliza en todas las operaciones. */
let conexionPromise = null;

/**
 * Abre (o crea) la base de datos y devuelve la conexión.
 * Se envuelve en Promise porque IndexedDB solo ofrece eventos.
 */
export function abrirBase() {
  if (conexionPromise) return conexionPromise;

  conexionPromise = new Promise((resolve, reject) => {
    const solicitud = indexedDB.open(NOMBRE_DB, VERSION_DB);

    solicitud.onupgradeneeded = (evento) => {
      const db = evento.target.result;

      // 'productos' con clave 'id' coincide con el esquema del JSON del proyecto.
      if (!db.objectStoreNames.contains(ALMACENES.productos)) {
        db.createObjectStore(ALMACENES.productos, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(ALMACENES.planes)) {
        db.createObjectStore(ALMACENES.planes, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(ALMACENES.clases)) {
        db.createObjectStore(ALMACENES.clases, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(ALMACENES.entrenadores)) {
        db.createObjectStore(ALMACENES.entrenadores, { keyPath: 'id' });
      }
      // Las citas no tienen id propio: se genera la clave 'id' en cada alta.
      if (!db.objectStoreNames.contains(ALMACENES.citas)) {
        db.createObjectStore(ALMACENES.citas, { keyPath: 'id' });
      }
      // Pedidos confirmados en el checkout (versión 2 de la base).
      if (!db.objectStoreNames.contains(ALMACENES.pedidos)) {
        db.createObjectStore(ALMACENES.pedidos, { keyPath: 'id' });
      }
    };

    solicitud.onsuccess = () => {
      const db = solicitud.result;
      // Si otra pestaña cambia la estructura, se cierra la conexión.
      db.onversionchange = () => db.close();
      resolve(db);
    };

    solicitud.onerror = () => reject(solicitud.error);
    solicitud.onblocked = () => reject(new Error('IndexedDB está bloqueada por otra pestaña.'));
  })
    // Si la apertura falla (por ejemplo, en un contexto sin IndexedDB),
    // se descarta la promesa para permitir un reintento posterior.
    .catch((error) => {
      conexionPromise = null;
      throw error;
    });

  return conexionPromise;
}

/**
 * Extrae el valor de una petición de IndexedDB. Todas las operaciones de este
 * módulo devuelven un IDBRequest, así que al terminar la transacción se
 * entrega su resultado (la lista de getAll, la clave de put, etc.).
 */
function valorDe(peticion) {
  return peticion && typeof peticion === 'object' && 'result' in peticion ? peticion.result : peticion;
}

/** Ejecuta una operación dentro de una transacción y devuelve un Promise con el resultado. */
async function ejecutar(almacen, modo, operacion) {
  const db = await abrirBase();
  return new Promise((resolve, reject) => {
    const transaccion = db.transaction(almacen, modo);
    const store = transaccion.objectStore(almacen);
    let resultado;

    try {
      resultado = operacion(store);
    } catch (error) {
      reject(error);
      return;
    }

    transaccion.oncomplete = () => resolve(valorDe(resultado));
    transaccion.onerror = () => reject(transaccion.error);
    transaccion.onabort = () => reject(transaccion.error);
  });
}

/** Vacía por completo un almacén antes de guardar una versión nueva del catálogo. */
export function limpiarAlmacen(almacen) {
  return ejecutar(almacen, 'readwrite', (store) => store.clear());
}

/** Guarda un conjunto de registros (una carga completa del JSON). */
export async function guardarLote(almacen, registros) {
  await limpiarAlmacen(almacen);
  return ejecutar(almacen, 'readwrite', (store) => {
    registros.forEach((registro) => store.put(registro));
  });
}

/** Agrega o actualiza un solo registro. */
export function guardarRegistro(almacen, registro) {
  return ejecutar(almacen, 'readwrite', (store) => store.put(registro));
}

/** Elimina un registro por su clave. */
export function eliminarRegistro(almacen, clave) {
  return ejecutar(almacen, 'readwrite', (store) => store.delete(clave));
}

/** Vacía un almacén completo. */
export function vaciarAlmacen(almacen) {
  return ejecutar(almacen, 'readwrite', (store) => store.clear());
}

/** Lee todos los registros de un almacén. Operación de solo lectura. */
export function leerTodos(almacen) {
  return ejecutar(almacen, 'readonly', (store) => store.getAll());
}

/**
 * Atajo usado por el repositorio: guarda el contenido de un archivo JSON
 * (por ejemplo productos.json) en el almacén que le corresponde.
 */
export function guardarCatalogo(nombreArchivo, datos) {
  const almacen = ALMACEN_POR_ARCHIVO[nombreArchivo];
  if (!almacen) {
    return Promise.reject(new Error(`No existe almacén para "${nombreArchivo}".`));
  }
  return guardarLote(almacen, datos);
}

/** Atajo de lectura: devuelve el catálogo guardado de un archivo JSON. */
export function leerCatalogo(nombreArchivo) {
  const almacen = ALMACEN_POR_ARCHIVO[nombreArchivo];
  if (!almacen) {
    return Promise.reject(new Error(`No existe almacén para "${nombreArchivo}".`));
  }
  return leerTodos(almacen);
}