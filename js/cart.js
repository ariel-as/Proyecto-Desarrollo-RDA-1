/**
 * cart.js - Controlador del carrito de compras.
 *
 * El carrito es un arreglo de objetos { id, nombre, precio, imagen, cantidad }.
 * Se mantiene en localStorage para que sobreviva a la recarga de la página.
 */

import { CLAVES, leerLocal, escribirLocal } from './storage.js';

/** Cantidad máxima por producto para no cargar el formulario en exceso. */
export const CANTIDAD_MAXIMA = 20;

/** Devuelve el carrito actual (o uno vacío si todavía no existe). */
export function obtenerCarrito() {
  const carrito = leerLocal(CLAVES.carrito, []);
  return Array.isArray(carrito) ? carrito : [];
}

/** Guarda el carrito completo en localStorage. */
export function guardarCarrito(carrito) {
  return escribirLocal(CLAVES.carrito, carrito);
}

/** Vacía por completo el carrito. */
export function vaciarCarrito() {
  guardarCarrito([]);
  return [];
}

/** Cantidad total de productos en el carrito. */
export function contarArticulos(carrito = obtenerCarrito()) {
  return carrito.reduce((total, item) => total + item.cantidad, 0);
}

/**
 * Agrega un producto al carrito. Si ya existe, suma la cantidad
 * respetando la cantidad máxima permitida.
 * El identificador se compara sin coerción para que el carrito admita
 * tanto los ids numéricos de los productos como los de los planes
 * ("plan-1"), que de otro modo colisionarían entre sí.
 */
export function agregarProducto(producto, cantidad = 1) {
  const carrito = obtenerCarrito();
  const existente = carrito.find((item) => item.id === producto.id);

  if (existente) {
    existente.cantidad = Math.min(CANTIDAD_MAXIMA, existente.cantidad + cantidad);
  } else {
    carrito.push({
      id: producto.id,
      nombre: producto.nombre,
      precio: Number(producto.precio),
      imagen: producto.imagen || '',
      tipo: producto.tipo || 'producto',
      cantidad: Math.min(CANTIDAD_MAXIMA, Math.max(1, cantidad))
    });
  }

  guardarCarrito(carrito);
  return carrito;
}

/** Elimina por completo un producto del carrito. */
export function eliminarProducto(id) {
  const carrito = obtenerCarrito().filter((item) => String(item.id) !== String(id));
  guardarCarrito(carrito);
  return carrito;
}

/** Cambia la cantidad de un producto. Si la cantidad llega a 0, se elimina. */
export function cambiarCantidad(id, cantidad) {
  const carrito = obtenerCarrito();
  const item = carrito.find((linea) => String(linea.id) === String(id));
  if (!item) return carrito;

  const nuevaCantidad = Math.min(CANTIDAD_MAXIMA, Math.max(0, Number(cantidad) || 0));

  if (nuevaCantidad === 0) {
    return eliminarProducto(id);
  }

  item.cantidad = nuevaCantidad;
  guardarCarrito(carrito);
  return carrito;
}

/** Calcula el subtotal de una línea del carrito. */
export function calcularSubtotal(producto, cantidad) {
  return Number(producto.precio) * Number(cantidad);
}

/** Calcula el subtotal de todo el carrito. */
export function calcularSubtotalTotal(carrito = obtenerCarrito()) {
  return carrito.reduce(
    (total, item) => total + calcularSubtotal(item, item.cantidad),
    0
  );
}

/**
 * Calcula el total del carrito.
 * El proyecto no implementa pago real ni envío, por lo que el total
 * coincide con el subtotal. La función existe para separar el cálculo
 * y poder ampliarlo más adelante.
 */
export function calcularTotal(carrito = obtenerCarrito()) {
  return calcularSubtotalTotal(carrito);
}

/** Formatea un número como precio en dólares: 45 -> "$45.00" */
export function formatearPrecio(valor) {
  return `$${Number(valor || 0).toFixed(2)}`;
}

/** Avisa a otras partes de la aplicación que el carrito cambió. */
function notificarCambio(carrito) {
  window.dispatchEvent(
    new CustomEvent('carrito:actualizado', {
      detail: { articulos: contarArticulos(carrito) }
    })
  );
}

/** Envuelve las operaciones que modifican el carrito para emitir el evento. */
export const carrito = {
  agregar(producto, cantidad) {
    const resultado = agregarProducto(producto, cantidad);
    notificarCambio(resultado);
    return resultado;
  },
  eliminar(id) {
    const resultado = eliminarProducto(id);
    notificarCambio(resultado);
    return resultado;
  },
  cambiar(id, cantidad) {
    const resultado = cambiarCantidad(id, cantidad);
    notificarCambio(resultado);
    return resultado;
  },
  vaciar() {
    const resultado = vaciarCarrito();
    notificarCambio(resultado);
    return resultado;
  },
  obtener: obtenerCarrito,
  contar: contarArticulos,
  subtotal: calcularSubtotalTotal,
  total: calcularTotal
};