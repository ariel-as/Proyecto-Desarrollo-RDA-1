/**
 * auth.js - Controlador de sesión y acceso por roles.
 *
 * La sesión se guarda en sessionStorage (se pierde al cerrar la pestaña).
 * Las contraseñas de la colección de prueba viven únicamente en el archivo
 * JSON local y en memoria: nunca se escriben en localStorage ni en cookies.
 * Las cuentas creadas desde el formulario de registro guardan solo una
 * huella de la contraseña (hash), nunca el texto plano.
 */

import {
  CLAVES,
  leerSesion,
  escribirSesion,
  borrarSesion,
  leerLocal,
  escribirLocal,
  hashContrasena
} from './storage.js';
import { obtenerGimnasio } from './repo.js';

/** Roles válidos del proyecto. */
export const ROLES = { cliente: 'cliente', admin: 'admin' };

/** Usuarios de prueba caches en memoria durante la sesión de la página. */
let usuarios = null;

/** Cuentas creadas por la persona visitante desde el formulario de registro. */
function registrosLocales() {
  return leerLocal(CLAVES.registrosClientes, []).map((registro) => ({
    ...registro,
    id: registro.correo,
    rol: ROLES.cliente
  }));
}

/** Carga la colección de usuarios de data/gimnasio.json junto a los registros locales. */
async function cargarUsuarios() {
  if (usuarios) return usuarios;
  try {
    const datos = await obtenerGimnasio();
    usuarios = [...(datos.usuariosPrueba || []), ...registrosLocales()];
  } catch (error) {
    console.error('No se pudieron cargar los usuarios de prueba:', error);
    usuarios = registrosLocales();
  }
  return usuarios;
}

/** Indica si ya existe una cuenta creada en este navegador con ese correo. */
export function existeRegistroLocal(correo) {
  const objetivo = String(correo).trim().toLowerCase();
  return registrosLocales().some((registro) => registro.correo.toLowerCase() === objetivo);
}

/**
 * Guarda una cuenta de cliente creada desde el formulario de registro y la
 * añade a la lista en memoria, para que pueda iniciar sesión sin recargar.
 * La contraseña nunca se guarda en claro: solo su huella.
 */
export async function registrarCliente(datos) {
  const { contrasena, ...resto } = datos;
  const registros = leerLocal(CLAVES.registrosClientes, []);
  const cuenta = {
    ...resto,
    contrasenaHash: await hashContrasena(contrasena),
    creado: new Date().toISOString()
  };
  escribirLocal(CLAVES.registrosClientes, [...registros, cuenta]);
  if (usuarios) usuarios = [...usuarios, { ...cuenta, id: cuenta.correo, rol: ROLES.cliente }];
  return cuenta;
}

/** Usuario de la sesión actual o null. */
export function usuarioActual() {
  return leerSesion(CLAVES.sesionUsuario, null);
}

/** Indica si hay una sesión iniciada. */
export function haySesion() {
  return usuarioActual() !== null;
}

/** Indica si la sesión actual tiene un rol específico. */
export function tieneRol(rol) {
  const usuario = usuarioActual();
  return Boolean(usuario) && usuario.rol === rol;
}

/**
 * Inicia sesión verificando el correo y la contraseña.
 * Las cuentas de prueba del JSON se comparan en claro (viven en el archivo);
 * las cuentas creadas en el navegador se comparan con su huella.
 * @returns {Promise<{ok: boolean, usuario?: object, mensaje: string}>}
 */
export async function iniciarSesion(correo, contrasena, rolEsperado = ROLES.cliente) {
  const lista = await cargarUsuarios();
  const objetivo = String(correo).trim().toLowerCase();
  const candidatos = lista.filter((usuario) => usuario.correo.toLowerCase() === objetivo);

  let encontrado = null;

  for (const usuario of candidatos) {
    if (usuario.contrasenaHash) {
      if ((await hashContrasena(contrasena)) === usuario.contrasenaHash) {
        encontrado = usuario;
        break;
      }
    } else if (usuario.contrasena === contrasena) {
      encontrado = usuario;
      break;
    }
  }

  if (!encontrado) {
    return { ok: false, mensaje: 'El correo o la contraseña no coinciden.' };
  }

  if (encontrado.rol !== rolEsperado) {
    return {
      ok: false,
      mensaje:
        encontrado.rol === ROLES.admin
          ? 'Esta cuenta es de administrador. Ingresa desde el acceso administrativo.'
          : 'Esta cuenta es de cliente. Ingresa desde el inicio de sesión de clientes.'
    };
  }

  // Nunca se guarda la contraseña: solo los datos públicos de la sesión.
  const sesion = {
    id: encontrado.id,
    nombre: encontrado.nombre,
    correo: encontrado.correo,
    rol: encontrado.rol,
    nivel: encontrado.nivel,
    inicio: new Date().toISOString()
  };

  escribirSesion(CLAVES.sesionUsuario, sesion);
  return { ok: true, usuario: sesion, mensaje: `Sesión iniciada. Bienvenido, ${sesion.nombre}.` };
}

/** Cierra la sesión actual eliminando los datos de sessionStorage. */
export function cerrarSesion() {
  borrarSesion(CLAVES.sesionUsuario);
  borrarSesion(CLAVES.sesionPendiente);
  return true;
}

/**
 * Guarda el paso pendiente cuando el usuario intenta contratar un plan
 * sin tener sesión. Al iniciar sesión, el flujo continúa.
 */
export function guardarPendencia(clave, datos) {
  escribirSesion(CLAVES.sesionPendiente, { clave, datos, momento: Date.now() });
}

/**
 * Indica si hay un paso pendiente guardado, sin consumirlo.
 * Se usa en el login para decidir a qué página continuar.
 */
export function tienePendencia(clave) {
  const pendiente = leerSesion(CLAVES.sesionPendiente, null);
  return Boolean(pendiente) && (!clave || pendiente.clave === clave);
}

/** El usuario indicado tiene sesión de administrador activa. */
export function esAdministrador() {
  return tieneRol(ROLES.admin);
}