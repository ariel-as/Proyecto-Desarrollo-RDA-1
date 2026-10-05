/**
 * Prueba rapida del repositorio: Fetch + aplicacion de cambios del administrador.
 * Ejecutar con:  node pruebas/prueba-repo.mjs
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const memoria = new Map();

globalThis.localStorage = {
  getItem: (k) => (memoria.has(k) ? memoria.get(k) : null),
  setItem: (k, v) => memoria.set(k, String(v)),
  removeItem: (k) => memoria.delete(k)
};
globalThis.sessionStorage = globalThis.localStorage;
globalThis.document = { baseURI: `http://localhost:5500/${readFileSync(join(raiz, 'data', 'productos.json'), 'utf8').length ? '' : ''}` };

// IndexedDB simulado: falla a propósito para comprobar que no rompe la carga.
globalThis.indexedDB = {
  open: () => {
    throw new Error('IndexedDB no disponible en la prueba');
  }
};

// Fetch simulado: devuelve el contenido real del JSON del proyecto.
globalThis.fetch = async (url) => {
  const nombre = url.split('/').pop();
  try {
    const datos = JSON.parse(readFileSync(join(raiz, 'data', nombre), 'utf8'));
    return { ok: true, status: 200, json: async () => datos };
  } catch {
    return { ok: false, status: 404, json: async () => [] };
  }
};

globalThis.document.cookie = '';
globalThis.window = { location: { protocol: 'http:' } };

const { obtenerProductos, obtenerPlanes, escribirCambios, leerCambios } = await import('../js/repo.js');

let fallos = 0;
function comprobar(descripcion, condicion) {
  console.log(`${condicion ? 'OK  ' : 'FALLA'} ${descripcion}`);
  if (!condicion) fallos += 1;
}

const base = await obtenerProductos();
comprobar('El JSON entrega 10 productos', base.datos.length === 10);
comprobar('El origen inicial es fetch', base.origen === 'fetch');

// El administrador actualiza el precio de la creatina, elimina la barra
// proteica y agrega un producto nuevo.
escribirCambios('productos', {
  agregados: [{ id: 99, nombre: 'Producto de prueba', categoria: 'Prueba', precio: 10, descripcion: 'Agregado desde el dashboard.', imagen: 'assets/img/productos/generico.svg', destacado: false }],
  actualizados: { 2: { precio: 30 } },
  eliminados: [4]
});

const modificado = await obtenerProductos();
comprobar('El cambio del admin no crea duplicados', modificado.datos.length === 10);
comprobar('Se eliminó el producto 4', !modificado.datos.some((p) => p.id === 4));
comprobar('Se actualizó el precio de la whey protein', modificado.datos.find((p) => p.id === 2).precio === 30);
comprobar('Se agregó el producto nuevo', modificado.datos.some((p) => p.id === 99));

// El resto del catálogo sigue igual.
const planes = await obtenerPlanes();
comprobar('Los planes son 3', planes.datos.length === 3);
comprobar('El plan individual cuesta 35', planes.datos[0].precio === 35);
comprobar('El plan de 2 personas cuesta 60', planes.datos[1].precio === 60);
comprobar('El plan de 3 personas cuesta 85', planes.datos[2].precio === 85);

leerCambios('productos');
console.log(fallos === 0 ? '\nTodas las comprobaciones pasaron' : `\n${fallos} comprobaciones fallaron`);
process.exit(fallos === 0 ? 0 : 1);