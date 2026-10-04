/**
 * validation.js - Validaciones de los formularios del proyecto.
 *
 * Estrategia en dos capas (sección 23 y 24 de la especificación):
 *   1. Validación nativa de HTML5 (required, type, minlength, pattern, checkValidity).
 *   2. Reglas de negocio que HTML5 no resuelve, escritas con Expresiones
 *      Regulares y aplicadas con setCustomValidity().
 *
 * Cada mensaje de error:
 *   - explica qué está mal y cómo corregirlo,
 *   - se vincula al campo con aria-describedby,
 *   - marca el campo con aria-invalid="true",
 *   - no depende únicamente del color (usa el símbolo de advertencia).
 */

/** Expresiones regulares usadas en el proyecto. */
export const REGEX = {
  cedula: /^\d{10}$/,
  telefono: /^09\d{8}$/,
  nombre: /^[A-Za-zÁÉÍÓÚÑáéíóúñ\s'-]{2,60}$/,
  contrasena: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%*_.-]{8,32}$/,
  codigoPlan: /^PF-\d{4}$/
};

/* =========================================================
   Mensajes y estado visual de los campos
   ========================================================= */

/** Devuelve (o crea) el elemento que muestra el error de un campo. */
function elementoError(campo) {
  const id = `err-${campo.id}`;
  let elemento = document.getElementById(id);

  if (!elemento) {
    elemento = document.createElement('p');
    elemento.id = id;
    elemento.className = 'pf-error';
    elemento.setAttribute('role', 'alert');
    // Se inserta justo después del campo para que quede cerca visualmente.
    campo.insertAdjacentElement('afterend', elemento);
  }

  return elemento;
}

/** Marca el campo como inválido y muestra un mensaje explicativo. */
export function mostrarError(campo, mensaje) {
  const error = elementoError(campo);
  error.textContent = mensaje;
  error.hidden = false;
  campo.setAttribute('aria-invalid', 'true');
  campo.setCustomValidity(mensaje);
}

/** Limpia el estado de error del campo. */
export function limpiarError(campo) {
  const error = elementoError(campo);

  if (error) {
    error.textContent = '';
    error.hidden = true;
  }

  campo.removeAttribute('aria-invalid');
  campo.setCustomValidity('');
}

/** Mensaje genérico de un campo según el estado de validación nativa. */
function mensajeNativo(campo) {
  const valor = campo.value.trim();

  if (campo.validity.valueMissing) return 'Este campo es obligatorio.';
  if (campo.validity.typeMismatch && campo.type === 'email')
    return 'Escribe un correo válido, por ejemplo: nombre@correo.com';
  if (campo.validity.tooShort)
    return `Escribe al menos ${campo.minLength} caracteres para continuar.`;
  if (campo.validity.patternMismatch)
    return campo.dataset.mensajePatron || 'El valor no tiene el formato esperado.';

  if (campo.type === 'email' && valor && !campo.validity.valid) {
    return 'Revisa el correo: le falta el @ o el dominio.';
  }

  return 'Revisa este campo antes de continuar.';
}

/* =========================================================
   Reglas de negocio con Expresiones Regulares
   ========================================================= */

/** Valida la cédula ecuatoriana: 10 dígitos numéricos. */
export function validarCedula(campo) {
  if (campo.value.trim() === '') return true;
  if (!REGEX.cedula.test(campo.value.trim())) {
    mostrarError(campo, 'La cédula debe tener 10 dígitos, sin letras ni guiones. Ejemplo: 1712345678.');
    return false;
  }
  limpiarError(campo);
  return true;
}

/** Valida el celular ecuatoriano: 09 seguido de 8 dígitos. */
export function validarTelefono(campo) {
  if (campo.value.trim() === '') return true;
  if (!REGEX.telefono.test(campo.value.trim())) {
    mostrarError(campo, 'El teléfono debe tener 10 dígitos y empezar por 09. Ejemplo: 0991234567.');
    return false;
  }
  limpiarError(campo);
  return true;
}

/** Valida el nombre completo. */
export function validarNombre(campo) {
  if (campo.value.trim() === '') return true;
  if (!REGEX.nombre.test(campo.value.trim())) {
    mostrarError(campo, 'Escribe un nombre de entre 2 y 60 letras. No uses números ni símbolos.');
    return false;
  }
  limpiarError(campo);
  return true;
}

/** Valida la contraseña: mínimo 8 caracteres, con letras y números. */
export function validarContrasena(campo) {
  if (campo.value === '') return true;
  if (!REGEX.contrasena.test(campo.value)) {
    mostrarError(
      campo,
      'La contraseña necesita al menos 8 caracteres, con letras y números.'
    );
    return false;
  }
  limpiarError(campo);
  return true;
}

/**
 * Compara dos campos (por ejemplo contraseña y su confirmación).
 * Es una regla de negocio que HTML5 no puede resolver por sí sola.
 */
export function validarCoincidencia(campo, campoOriginal, etiqueta = 'Las contraseñas') {
  if (campo.value === '') return true;
  if (campo.value !== campoOriginal.value) {
    mostrarError(campo, `${etiqueta} no coinciden. Vuelve a escribirlas igual.`);
    return false;
  }
  limpiarError(campo);
  return true;
}

/** Regla de negocio: no se pueden agendar citas en fechas pasadas. */
export function validarFechaFutura(campo) {
  if (campo.value === '') return true;
  const elegida = new Date(`${campo.value}T00:00:00`);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  if (elegida < hoy) {
    mostrarError(campo, 'Elige una fecha de hoy o posterior. No se aceptan fechas pasadas.');
    return false;
  }
  limpiarError(campo);
  return true;
}

/* =========================================================
   Formulario completo
   ========================================================= */

/**
 * Registra la validación de un formulario completo.
 *
 * @param {HTMLFormElement} formulario
 * @param {object} opciones - { reglas: {idCampo: función}, alEnviar: función async }
 * @returns {object} API con { validar, invalidarTodo }
 */
export function construirValidador(formulario, opciones = {}) {
  const reglas = opciones.reglas || {};

  /** Aplica la validación nativa y las reglas de un campo suelto. */
  function validarCampo(campo) {
    if (!campo.willValidate && campo.type !== 'submit') return true;

    // El error del intento anterior se descarta antes de volver a comprobar:
    // checkValidity() también tiene en cuenta setCustomValidity(), así que sin
    // este paso un campo marcado nunca podría recuperarse.
    campo.setCustomValidity('');

    if (!campo.checkValidity()) {
      mostrarError(campo, mensajeNativo(campo));
      return false;
    }

    const regla = reglas[campo.id];
    if (regla && !regla(campo)) return false;

    limpiarError(campo);
    return true;
  }

  /** Valida todos los campos del formulario. */
  function validarTodo() {
    const campos = [...formulario.querySelectorAll('input, select, textarea')];
    const resultados = campos.map(validarCampo);
    return resultados.every(Boolean);
  }

  // Mensaje de error al salir del campo, no mientras se escribe.
  formulario.addEventListener(
    'blur',
    (evento) => {
      if (evento.target.matches('input, select, textarea')) validarCampo(evento.target);
    },
    true
  );

  formulario.addEventListener('input', (evento) => {
    if (evento.target.getAttribute('aria-invalid') === 'true') validarCampo(evento.target);
  });

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    if (!validarTodo()) {
      const primero = formulario.querySelector('[aria-invalid="true"]');
      if (primero) primero.focus();
      return;
    }
    if (typeof opciones.alEnviar === 'function') await opciones.alEnviar(formulario);
  });

  return { validarCampo, validarTodo };
}

/* =========================================================
   Mensajes dinámicos accesibles
   ========================================================= */

/**
 * Escribe un mensaje en una región aria-live.
 * @param {HTMLElement|null} region
 * @param {string} mensaje
 * @param {'info'|'exito'|'error'} tipo
 */
export function mostrarMensaje(region, mensaje, tipo = 'info') {
  if (!region) return;

  region.textContent = mensaje;
  region.dataset.tipo = tipo;
  region.hidden = false;
  region.classList.add('pf-aparece');

  window.clearTimeout(region.dataset.timer);
  region.dataset.timer = window.setTimeout(() => {
    region.classList.remove('pf-aparece');
  }, 600);
}