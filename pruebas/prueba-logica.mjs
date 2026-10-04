/**
 * Prueba rapida de la logica de carrito y del repositorio.
 * Ejecutar con:  node pruebas/prueba-logica.mjs
 * No es un sustituto de las pruebas manuales en el navegador.
 */

const memoria = new Map();
globalThis.localStorage = {
  getItem: (k) => (memoria.has(k) ? memoria.get(k) : null),
  setItem: (k, v) => memoria.set(k, String(v)),
  removeItem: (k) => memoria.delete(k)
};
globalThis.sessionStorage = globalThis.localStorage;
globalThis.document = { baseURI: 'http://localhost:5500/index.html' };
globalThis.window = { dispatchEvent: () => {}, location: { protocol: 'http:' } };
globalThis.indexedDB = { open: () => { throw new Error('IndexedDB no disponible en la prueba'); } };

const { carrito, formatearPrecio } = await import('../js/cart.js');
const { REGEX } = await import('../js/validation.js');

let fallos = 0;
function comprobar(descripcion, condicion) {
  if (condicion) {
    console.log(`OK   ${descripcion}`);
  } else {
    console.log(`FALLA ${descripcion}`);
    fallos += 1;
  }
}

const proteina = { id: 1, nombre: 'Proteína', precio: 45, imagen: 'x.svg' };
const creatina = { id: 2, nombre: 'Creatina', precio: 25, imagen: 'y.svg' };

carrito.vaciar();
carrito.agregar(proteina, 2);
carrito.agregar(creatina, 1);
comprobar('Dos productos en el carrito', carrito.contar() === 3);
comprobar('Subtotal 2x45 + 1x25 = 115', carrito.subtotal() === 115);
comprobar('Total igual al subtotal', carrito.total() === 115);
comprobar('Formato de precio', formatearPrecio(45) === '$45.00');

carrito.agregar(proteina, 1);
comprobar('Agregar de nuevo suma cantidad', carrito.obtener()[0].cantidad === 3);

carrito.cambiar(1, 20);
carrito.cambiar(1, 50);
comprobar('Cantidad maxima 20', carrito.obtener()[0].cantidad === 20);

carrito.cambiar(1, 0);
comprobar('Cantidad 0 elimina la linea', carrito.obtener().length === 1);

carrito.eliminar(2);
comprobar('Eliminar deja el carrito vacio', carrito.contar() === 0);
comprobar(
  'El carrito sigue en localStorage',
  JSON.parse(localStorage.getItem('carrito')).length === 0
);

// Un plan es una suscripcion mensual: no se puede repetir en el mismo pedido.
const plan = { id: 'plan-1', nombre: 'Plan individual', precio: 35, tipo: 'plan' };

carrito.vaciar();
carrito.agregar(plan, 1);
carrito.agregar(plan, 1);
carrito.agregar(plan, 1);
comprobar('Un plan no se repite al elegirlo de nuevo', carrito.obtener()[0].cantidad === 1);
comprobar('El total del plan es su precio mensual', carrito.total() === 35);

carrito.cambiar('plan-1', 5);
comprobar('La cantidad de un plan se limita a 1', carrito.obtener()[0].cantidad === 1);
comprobar('El plan conserva su tipo', carrito.obtener()[0].tipo === 'plan');
comprobar('Un producto y un plan conviven', (carrito.agregar(proteina, 2), carrito.contar() === 3));
comprobar('El producto conserva su cantidad', carrito.subtotal() === 35 + 45 * 2);
carrito.vaciar();

comprobar('Cedula valida de 10 digitos', REGEX.cedula.test('1712345678'));
comprobar('Cedula invalida', !REGEX.cedula.test('17123456'));
comprobar('Celular 09 de 10 digitos', REGEX.telefono.test('0991234567'));
comprobar('Celular invalido', !REGEX.telefono.test('1991234567'));
comprobar('Contrasena con letras y numeros', REGEX.contrasena.test('cliente123'));
comprobar('Contrasena solo letras', !REGEX.contrasena.test('abcdefgh'));
comprobar('Contrasena corta', !REGEX.contrasena.test('abc12'));

console.log(fallos === 0 ? '\nTodas las comprobaciones pasaron' : `\n${fallos} comprobaciones fallaron`);
process.exit(fallos === 0 ? 0 : 1);