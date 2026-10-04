/**
 * storage.js - Capa de persistencia del navegador.
 *
 * Concentra el acceso a los tres mecanismos Web Storage del proyecto:
 *   - localStorage   -> carrito de compras y preferencias no sensibles.
 *   - sessionStorage -> estado temporal de la sesión y rol del usuario.
 *   - cookies        -> aviso de cookies y marca de última actualización.
 *
 * Ninguna función guarda contraseñas.
 */

/** Claves usadas por el proyecto, centralizadas para evitar errores de escritura. */
export const CLAVES = {
  carrito: 'carrito',
  preferencias: 'preferencias',
  cookieAviso: 'pf_aviso_cookies',
  ultimaActualizacion: 'ultimaActualizacion',
  sesionUsuario: 'usuario',
  sesionPendiente: 'sesionPendiente',
  citasNutricion: 'citasNutricion',
  catalogoLocal: 'catalogoLocal',
  registrosClientes: 'registrosClientes',
  pedidos: 'pedidos'
};

/**
 * Devuelve la URL raíz del sitio.
 * Las páginas viven en la raíz o dentro de /cliente/ y /admin/;
 * este helper permite construir rutas absolutas sin repetirlas a mano.
 */
export function raizSitio() {
  const url = new URL('.', document.baseURI);
  if (/(cliente|admin)\/$/.test(url.pathname)) {
    url.pathname = url.pathname.replace(/(cliente|admin)\/$/, '');
  }
  return url.href;
}

/* =========================================================
   localStorage
   ========================================================= */

/** Lee y deserializa una clave de localStorage. Devuelve null si no existe o está corrupta. */
export function leerLocal(clave, valorPorDefecto = null) {
  try {
    const crudo = localStorage.getItem(clave);
    if (crudo === null) return valorPorDefecto;
    return JSON.parse(crudo);
  } catch (error) {
    console.warn(`No se pudo leer "${clave}" de localStorage:`, error);
    return valorPorDefecto;
  }
}

/** Serializa y guarda un valor en localStorage. */
export function escribirLocal(clave, valor) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
    return true;
  } catch (error) {
    console.warn(`No se pudo escribir "${clave}" en localStorage:`, error);
    return false;
  }
}

/* =========================================================
   sessionStorage
   ========================================================= */

/** Lee y deserializa una clave de sessionStorage. */
export function leerSesion(clave, valorPorDefecto = null) {
  try {
    const crudo = sessionStorage.getItem(clave);
    if (crudo === null) return valorPorDefecto;
    return JSON.parse(crudo);
  } catch (error) {
    console.warn(`No se pudo leer "${clave}" de sessionStorage:`, error);
    return valorPorDefecto;
  }
}

/** Serializa y guarda un valor en sessionStorage (datos temporales de la sesión). */
export function escribirSesion(clave, valor) {
  try {
    sessionStorage.setItem(clave, JSON.stringify(valor));
    return true;
  } catch (error) {
    console.warn(`No se pudo escribir "${clave}" en sessionStorage:`, error);
    return false;
  }
}

/** Elimina una clave de sessionStorage. */
export function borrarSesion(clave) {
  try {
    sessionStorage.removeItem(clave);
  } catch (error) {
    console.warn(`No se pudo borrar "${clave}" de sessionStorage:`, error);
  }
}

/**
 * Convierte una contraseña en una huella que se puede guardar.
 * Usa SHA-256 (Web Crypto) cuando el navegador lo permite y un hash
 * simple FNV-1a como respaldo, para que el sitio también funcione
 * abierto directamente como archivo local.
 * En ningún caso se guarda la contraseña en texto plano.
 */
export async function hashContrasena(texto) {
  const valor = String(texto ?? '');

  if (globalThis.crypto?.subtle) {
    const datos = new TextEncoder().encode(valor);
    const resumen = await globalThis.crypto.subtle.digest('SHA-256', datos);
    return [...new Uint8Array(resumen)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  let acumulador = 2166136261;
  for (let i = 0; i < valor.length; i += 1) {
    acumulador ^= valor.charCodeAt(i);
    acumulador = Math.imul(acumulador, 16777619);
  }
  return `fnv1a${(acumulador >>> 0).toString(16)}`;
}

/* =========================================================
   Cookies
   ========================================================= */

/** Escribe una cookie con SameSite y duración en días. */
export function escribirCookie(nombre, valor, dias = 30) {
  const fecha = new Date();
  fecha.setTime(fecha.getTime() + dias * 24 * 60 * 60 * 1000);
  const segura = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${nombre}=${encodeURIComponent(
    valor
  )};expires=${fecha.toUTCString()};path=/;SameSite=Lax${segura}`;
}

/** Devuelve el valor de una cookie o null si no existe. */
export function leerCookie(nombre) {
  const objetivo = `${nombre}=`;
  const partes = document.cookie.split(';');
  for (const parte of partes) {
    const limpia = parte.trim();
    if (limpia.startsWith(objetivo)) {
      return decodeURIComponent(limpia.slice(objetivo.length));
    }
  }
  return null;
}

/* =========================================================
   Marca de última actualización (sección 21 de la especificación)
   ========================================================= */

/**
 * Registra la fecha actual de actualización del catálogo.
 * Se guarda en una cookie (mecanismo de preferencias) y se devuelve como ISO.
 */
export function registrarActualizacion() {
  const marca = new Date().toISOString();
  escribirCookie(CLAVES.ultimaActualizacion, marca, 7);
  return marca;
}

/** Recupera la marca de última actualización o null si todavía no existe. */
export function leerActualizacion() {
  return leerCookie(CLAVES.ultimaActualizacion);
}

/** Formatea una fecha ISO en un texto comprensible, por ejemplo "12 de mayo de 2026, 08:30". */
export function formatearFecha(iso) {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return 'sin registro';
  return fecha.toLocaleDateString('es-EC', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}