/**
 * admin.js - Controlador del área administrativa (dashboard con Bootstrap).
 *
 * Permite gestionar la información que usa el sitio: productos, planes,
 * clases con sus horarios, entrenadores y las citas de nutrición.
 * Los cambios quedan en el navegador (localStorage + IndexedDB) y el área
 * cliente los toma en cuenta al cargar el catálogo.
 *
 * El acceso está protegido: solo entra quien tiene rol 'admin' en sessionStorage.
 */

import {
  obtenerProductos,
  obtenerPlanes,
  obtenerClases,
  obtenerEntrenadores,
  crearProducto,
  actualizarProducto,
  borrarProducto,
  actualizarPlan,
  actualizarClase,
  actualizarEntrenador,
  restablecerCatalogo
} from './repo.js';
import { CLAVES, leerLocal, leerActualizacion, formatearFecha } from './storage.js';
import { usuarioActual, cerrarSesion, iniciarSesion, esAdministrador } from './auth.js';
import { construirValidador, mostrarMensaje } from './validation.js';
import { escapar } from './view.js';

const select = (selector) => document.querySelector(selector);
const selectTodos = (selector) => [...document.querySelectorAll(selector)];

/**
 * Devuelve el <tbody> de la tabla indicada. El marcador puede estar en la
 * propia tabla (<table data-tabla-x>) o en el <tbody data-tabla-x>.
 */
function cuerpoDeTabla(selector) {
  const marcado = select(selector);
  if (!marcado) return null;
  return marcado.tagName === 'TBODY' ? marcado : select(`${selector} tbody`);
}

/** Días de la semana disponibles para los horarios. */
export const DIAS = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo'
];

/* =========================================================
   1. Protección del área administrativa
   ========================================================= */

/** Redirige al login administrativo si no hay sesión o el rol no es admin. */
function protegerAcceso() {
  const pagina = document.body.dataset.pagina;

  if (pagina === 'login') return true;

  if (!esAdministrador()) {
    window.location.replace(new URL('login.html', document.baseURI).href);
    return false;
  }

  return true;
}

/** Muestra los datos del administrador y el botón de salida. */
function pintarSesionAdmin() {
  const usuario = usuarioActual();
  selectTodos('[data-admin-nombre]').forEach((nodo) => {
    nodo.textContent = usuario ? usuario.nombre : '';
  });

  selectTodos('[data-cerrar-sesion]').forEach((boton) => {
    boton.addEventListener('click', () => {
      cerrarSesion();
      window.location.replace(new URL('login.html', document.baseURI).href);
    });
  });
}

/* =========================================================
   2. Login administrativo
   ========================================================= */

function iniciarLoginAdmin() {
  const formulario = select('#formulario-login-admin');
  const region = select('#mensaje-login-admin');
  if (!formulario) return;

  construirValidador(formulario, {
    alEnviar: async () => {
      const correo = formulario.querySelector('#correo').value;
      const contrasena = formulario.querySelector('#contrasena').value;
      const resultado = await iniciarSesion(correo, contrasena, 'admin');

      if (!resultado.ok) {
        mostrarMensaje(region, resultado.mensaje, 'error');
        return;
      }

      mostrarMensaje(region, resultado.mensaje, 'exito');
      window.setTimeout(() => {
        window.location.href = new URL('index.html', document.baseURI).href;
      }, 800);
    }
  });
}

/* =========================================================
   3. Resumen del dashboard
   ========================================================= */

/** Rellena los indicadores y las citas de la página principal del dashboard. */
async function iniciarResumen() {
  const [productos, planes, clases, entrenadores] = await Promise.all([
    obtenerProductos(),
    obtenerPlanes(),
    obtenerClases(),
    obtenerEntrenadores()
  ]);

  const indicadores = [
    ['[data-total-productos]', productos.datos.length],
    ['[data-total-planes]', planes.datos.length],
    ['[data-total-clases]', clases.datos.length],
    ['[data-total-entrenadores]', entrenadores.datos.length]
  ];

  indicadores.forEach(([selector, valor]) => {
    const nodo = select(selector);
    if (nodo) nodo.textContent = valor;
  });

  const marca = select('[data-ultima-actualizacion]');
  if (marca) marca.textContent = `Última actualización del catálogo: ${formatearFecha(leerActualizacion() || new Date().toISOString())}`;

  pintarCitas();
}

/** Tabla de citas de nutrición guardadas localmente. */
function pintarCitas() {
  const cuerpo = cuerpoDeTabla('[data-tabla-citas]');
  if (!cuerpo) return;

  const citas = leerLocal(CLAVES.citasNutricion, []);

  if (!citas.length) {
    cuerpo.innerHTML =
      '<tr><td colspan="5" class="text-center text-body-secondary">Todavía no hay citas registradas.</td></tr>';
    select('[data-total-citas]')?.replaceChildren(document.createTextNode('0'));
    return;
  }

  select('[data-total-citas]')?.replaceChildren(document.createTextNode(String(citas.length)));

  cuerpo.innerHTML = citas
    .map(
      (cita) => `
        <tr>
          <th scope="row">${escapar(cita.nombre)}</th>
          <td>${escapar(cita.correo || '-')}</td>
          <td>${escapar(cita.telefono || '-')}</td>
          <td>${escapar(cita.fecha)} ${escapar(cita.hora || '')}</td>
          <td><span class="badge text-bg-warning">${escapar(cita.estado)}</span></td>
        </tr>`
    )
    .join('');
}

/** Datos del último renderizado: los listeners leen siempre esta versión. */
const estadoAdmin = { productos: [], planes: [] };

/* =========================================================
   4. Gestión de productos
   ========================================================= */

async function pintarProductosAdmin() {
  const cuerpo = cuerpoDeTabla('[data-tabla-productos]');
  const region = select('#mensaje-productos');
  if (!cuerpo) return;

  const resultado = await obtenerProductos();
  estadoAdmin.productos = resultado.datos;

  if (!resultado.datos.length) {
    cuerpo.innerHTML =
      '<tr><td colspan="6" class="text-center text-body-secondary">No hay productos registrados.</td></tr>';
  } else {
    cuerpo.innerHTML = resultado.datos
      .map(
        (producto) => `
          <tr>
            <th scope="row" class="fw-semibold">${escapar(producto.nombre)}</th>
            <td>${escapar(producto.categoria)}</td>
            <td>$${Number(producto.precio).toFixed(2)}</td>
            <td class="text-body-secondary">${escapar(producto.descripcion)}</td>
            <td>${producto.destacado ? '<span class="badge text-bg-success">Sí</span>' : '<span class="badge text-bg-secondary">No</span>'}</td>
            <td class="text-nowrap">
              <button
                type="button"
                class="btn btn-outline-primary btn-sm"
                data-editar="${escapar(producto.id)}"
                aria-label="Editar ${escapar(producto.nombre)}">Editar</button>
              <button
                type="button"
                class="btn btn-outline-danger btn-sm"
                data-borrar="${escapar(producto.id)}"
                aria-label="Eliminar ${escapar(producto.nombre)}">Eliminar</button>
            </td>
          </tr>`
      )
      .join('');
  }

  // El formulario sirve para alta y para edición.
  const formulario = select('#formulario-producto');

  const botonNuevo = select('[data-nuevo-producto]');
  if (botonNuevo && !botonNuevo.dataset.escuchado) {
    botonNuevo.dataset.escuchado = 'true';
    botonNuevo.addEventListener('click', () => {
      formulario.reset();
      formulario.dataset.modo = 'crear';
      select('#titulo-producto').textContent = 'Agregar producto';
      formulario.querySelector('[data-guardar-producto]').textContent = 'Agregar al catálogo';
    });
  }

  const botonRestablecer = select('[data-restablecer-catalogo]');
  if (botonRestablecer && !botonRestablecer.dataset.escuchado) {
    botonRestablecer.dataset.escuchado = 'true';
    botonRestablecer.addEventListener('click', async () => {
      await restablecerCatalogo('productos');
      mostrarMensaje(region, 'El catálogo volvió a su estado original.', 'exito');
      pintarProductosAdmin();
    });
  }

  // El listener se registra una sola vez: vuelve a leer la tabla actual.
  if (!cuerpo.dataset.escuchado) {
    cuerpo.dataset.escuchado = 'true';
    cuerpo.addEventListener('click', async (evento) => {
      const botonEditar = evento.target.closest('[data-editar]');
      const botonBorrar = evento.target.closest('[data-borrar]');
      if (!botonEditar && !botonBorrar) return;

      const id = Number((botonEditar || botonBorrar).dataset.editar ?? (botonBorrar.dataset.borrar));
      const producto = estadoAdmin.productos.find((item) => item.id === id);
      if (!producto) return;

      if (botonEditar) {
        formulario.dataset.modo = 'editar';
        formulario.querySelector('#id-producto').value = producto.id;
        // El título vive fuera del formulario, se busca en todo el documento.
        select('#titulo-producto').textContent = `Editar ${producto.nombre}`;
        formulario.querySelector('[data-guardar-producto]').textContent = 'Guardar cambios';
        formulario.querySelector('#nombre').value = producto.nombre;
        formulario.querySelector('#categoria').value = producto.categoria;
        formulario.querySelector('#precio').value = producto.precio;
        formulario.querySelector('#descripcion').value = producto.descripcion;
        formulario.querySelector('#destacado').checked = Boolean(producto.destacado);
        formulario.querySelector('#nombre').focus();
        return;
      }

      const confirmado = window.confirm(
        `¿Eliminar "${producto.nombre}" del catálogo? Esta acción no se puede deshacer.`
      );
      if (!confirmado) return;

      await borrarProducto(producto.id);
      mostrarMensaje(region, `Producto "${producto.nombre}" eliminado.`, 'exito');
      pintarProductosAdmin();
    });
  }

  if (!formulario.dataset.valorado) {
    formulario.dataset.valorado = 'true';

    construirValidador(formulario, {
      alEnviar: async () => {
        const datos = Object.fromEntries(new FormData(formulario));
        const existente = datos.id ? estadoAdmin.productos.find((item) => item.id === Number(datos.id)) : null;
        const producto = {
          nombre: datos.nombre,
          categoria: datos.categoria,
          precio: Number(datos.precio),
          descripcion: datos.descripcion,
          // Al editar se conserva la ilustración original; los productos nuevos
          // usan la imagen genérica para que la tarjeta nunca quede rota.
          imagen: existente?.imagen || 'assets/img/productos/generico.svg',
          destacado: formulario.querySelector('#destacado').checked
        };

        if (formulario.dataset.modo === 'editar') {
          await actualizarProducto(Number(datos.id), producto);
          mostrarMensaje(region, `Producto "${producto.nombre}" actualizado.`, 'exito');
        } else {
          await crearProducto(producto);
          mostrarMensaje(region, `Producto "${producto.nombre}" agregado al catálogo.`, 'exito');
        }

        formulario.reset();
        formulario.dataset.modo = 'crear';
        pintarProductosAdmin();
      }
    });
  }
}

/* =========================================================
   5. Gestión de planes
   ========================================================= */

async function pintarPlanesAdmin() {
  const cuerpo = cuerpoDeTabla('[data-tabla-planes]');
  const region = select('#mensaje-planes');
  if (!cuerpo) return;

  const resultado = await obtenerPlanes();
  estadoAdmin.planes = resultado.datos;

  cuerpo.innerHTML = resultado.datos
    .map(
      (plan) => `
        <tr>
          <th scope="row" class="fw-semibold">${escapar(plan.nombre)}</th>
          <td>${plan.personas}</td>
          <td>$${Number(plan.precio).toFixed(2)}</td>
          <td class="text-body-secondary">${escapar(plan.descripcion)}</td>
          <td><button
              type="button"
              class="btn btn-outline-primary btn-sm"
              data-editar-plan="${escapar(plan.id)}"
              aria-label="Editar ${escapar(plan.nombre)}">Editar</button></td>
        </tr>`
    )
    .join('');

  const formulario = select('#formulario-plan');

  if (!cuerpo.dataset.escuchado) {
    cuerpo.dataset.escuchado = 'true';
    cuerpo.addEventListener('click', (evento) => {
      const boton = evento.target.closest('[data-editar-plan]');
      if (!boton) return;

      const plan = estadoAdmin.planes.find((item) => item.id === Number(boton.dataset.editarPlan));
      if (!plan) return;

      formulario.querySelector('#id-plan').value = plan.id;
      formulario.querySelector('#nombre-plan').value = plan.nombre;
      formulario.querySelector('#precio-plan').value = plan.precio;
      formulario.querySelector('#descripcion-plan').value = plan.descripcion;
      select('#titulo-editar-plan').textContent = `Editar ${plan.nombre}`;
      formulario.querySelector('#nombre-plan').focus();
    });
  }

  if (!formulario.dataset.valorado) {
    formulario.dataset.valorado = 'true';

    construirValidador(formulario, {
      alEnviar: async () => {
        const datos = Object.fromEntries(new FormData(formulario));
        await actualizarPlan(Number(datos.id), {
          nombre: datos.nombre,
          precio: Number(datos.precio),
          descripcion: datos.descripcion
        });
        mostrarMensaje(region, `Plan "${datos.nombre}" actualizado.`, 'exito');
        select('#titulo-editar-plan').textContent = 'Editar plan';
        pintarPlanesAdmin();
      }
    });
  }
}

/* =========================================================
   6. Gestión de clases y horarios
   ========================================================= */

async function pintarClasesAdmin() {
  const contenedor = select('[data-clases-admin]');
  const region = select('#mensaje-clases');
  if (!contenedor) return;

  const [clases, entrenadores] = await Promise.all([obtenerClases(), obtenerEntrenadores()]);

  contenedor.innerHTML = clases.datos
    .map(
      (clase) => `
        <div class="card h-100">
          <div class="card-body">
            <h3 class="card-title h5">${escapar(clase.nombre)}</h3>
            <p class="card-text">${escapar(clase.descripcion)}</p>
            <p class="card-text"><small class="text-body-secondary">Lugar: ${escapar(clase.lugar)}</small></p>

            <form class="formulario-clase" data-clase-id="${escapar(clase.id)}" data-horarios="${escapar(
            clase.horarios.map((horario) => horario.id).join(',')
          )}">
              <h4 class="h6">Horarios</h4>
              <ul class="list-group list-group-flush mb-3">
                ${clase.horarios
                  .map(
                    (horario, indice) => `
                      <li class="list-group-item d-flex flex-wrap gap-2 align-items-end">
                        <div>
                          <label class="form-label" for="dia-${escapar(clase.id)}-${indice}">Día</label>
                          <select
                            class="form-select"
                            id="dia-${escapar(clase.id)}-${indice}"
                            name="dia-${indice}"
                            data-campo="dia">
                            ${DIAS.map(
                              (dia) =>
                                `<option value="${dia}"${dia === horario.dia ? ' selected' : ''}>${dia}</option>`
                            ).join('')}
                          </select>
                        </div>
                        <div>
                          <label class="form-label" for="inicio-${escapar(clase.id)}-${indice}">Hora inicio</label>
                          <input
                            class="form-control"
                            type="time"
                            id="inicio-${escapar(clase.id)}-${indice}"
                            name="horaInicio-${indice}"
                            value="${escapar(horario.horaInicio || '')}"
                            data-campo="horaInicio"
                            required>
                        </div>
                        <div>
                          <label class="form-label" for="fin-${escapar(clase.id)}-${indice}">Hora fin</label>
                          <input
                            class="form-control"
                            type="time"
                            id="fin-${escapar(clase.id)}-${indice}"
                            name="horaFin-${indice}"
                            value="${escapar(horario.horaFin || '')}"
                            data-campo="horaFin">
                        </div>
                      </li>`
                  )
                  .join('')}
              </ul>

              <div class="mb-3">
                <label class="form-label" for="entrenador-${escapar(clase.id)}">Entrenador</label>
                <select class="form-select" id="entrenador-${escapar(clase.id)}" name="entrenadorId">
                  ${entrenadores.datos
                    .map(
                      (entrenador) =>
                        `<option value="${escapar(entrenador.id)}"${
                          entrenador.id === clase.entrenadorId ? ' selected' : ''
                        }>${escapar(entrenador.nombre)} — ${escapar(entrenador.especialidad)}</option>`
                    )
                    .join('')}
                </select>
              </div>

              <button type="submit" class="btn btn-primary">Guardar horarios</button>
            </form>
          </div>
        </div>`
    )
    .join('');

  if (!contenedor.dataset.escuchado) {
    contenedor.dataset.escuchado = 'true';
    contenedor.addEventListener('submit', async (evento) => {
      evento.preventDefault();
      const formulario = evento.target.closest('[data-clase-id]');
      if (!formulario) return;

      const id = Number(formulario.dataset.claseId);
      const idsHorario = (formulario.dataset.horarios || '').split(',').map(Number);

      // Cada horario se reconstruye con los valores del formulario.
      const horarios = idsHorario.map((idHorario, indice) => ({
        id: idHorario,
        dia: formulario.querySelector(`[name="dia-${indice}"]`)?.value,
        horaInicio: formulario.querySelector(`[name="horaInicio-${indice}"]`)?.value,
        horaFin: formulario.querySelector(`[name="horaFin-${indice}"]`)?.value || null
      }));

      // Una clase no puede terminar antes de empezar (p. ej. 19:00 → 08:00).
      const invertido = horarios.find((horario) => horario.horaFin && horario.horaFin <= horario.horaInicio);
      if (invertido) {
        mostrarMensaje(
          region,
          'La hora de fin debe ser posterior a la hora de inicio en todos los horarios.',
          'error'
        );
        return;
      }

      const entrenadorId = Number(formulario.querySelector('[name="entrenadorId"]').value);
      await actualizarClase(id, { horarios, entrenadorId });

      mostrarMensaje(region, 'Horarios actualizados correctamente.', 'exito');
      pintarClasesAdmin();
    });
  }
}

/* =========================================================
   7. Entrenadores
   ========================================================= */

async function pintarEntrenadoresAdmin() {
  const contenedor = select('[data-entrenadores-admin]');
  const region = select('#mensaje-entrenadores');
  if (!contenedor) return;

  const resultado = await obtenerEntrenadores();

  contenedor.innerHTML = resultado.datos
    .map(
      (entrenador) => `
        <div class="card h-100">
          <div class="card-body">
            <h3 class="card-title h5">${escapar(entrenador.nombre)}</h3>
            <p class="card-text">${escapar(entrenador.descripcion)}</p>
            <form data-entrenador-id="${escapar(entrenador.id)}">
              <div class="mb-2">
                <label class="form-label" for="especialidad-${escapar(entrenador.id)}">Especialidad</label>
                <input
                  class="form-control"
                  type="text"
                  id="especialidad-${escapar(entrenador.id)}"
                  name="especialidad"
                  value="${escapar(entrenador.especialidad)}"
                  required>
              </div>
              <div class="mb-2">
                <label class="form-label" for="descripcion-${escapar(entrenador.id)}">Descripción</label>
                <textarea
                  class="form-control"
                  id="descripcion-${escapar(entrenador.id)}"
                  name="descripcion"
                  rows="2"
                  required>${escapar(entrenador.descripcion)}</textarea>
              </div>
              <button type="submit" class="btn btn-primary btn-sm">Guardar</button>
            </form>
          </div>
        </div>`
    )
    .join('');

  if (!contenedor.dataset.escuchado) {
    contenedor.dataset.escuchado = 'true';
    contenedor.addEventListener('submit', async (evento) => {
      evento.preventDefault();
      const formulario = evento.target.closest('[data-entrenador-id]');
      if (!formulario) return;

      const datos = Object.fromEntries(new FormData(formulario));
      await actualizarEntrenador(Number(formulario.dataset.entrenadorId), {
        especialidad: datos.especialidad,
        descripcion: datos.descripcion
      });

      mostrarMensaje(region, `Información de ${datos.especialidad} actualizada.`, 'exito');
      pintarEntrenadoresAdmin();
    });
  }
}

/* =========================================================
   8. Enrutador del dashboard
   ========================================================= */

const PAGINAS_ADMIN = {
  login: iniciarLoginAdmin,
  index: iniciarResumen,
  productos: pintarProductosAdmin,
  planes: pintarPlanesAdmin,
  clases: pintarClasesAdmin,
  entrenadores: pintarEntrenadoresAdmin
};

document.addEventListener('DOMContentLoaded', () => {
  if (!protegerAcceso()) return;

  // Pie de página: el año actual se escribe desde JavaScript.
  selectTodos('[data-anio]').forEach((nodo) => {
    nodo.textContent = new Date().getFullYear();
  });

  if (document.body.dataset.pagina !== 'login') pintarSesionAdmin();

  const controlador = PAGINAS_ADMIN[document.body.dataset.pagina];
  if (controlador) {
    controlador();
  } else {
    console.warn(`No hay controlador administrativo para "${document.body.dataset.pagina}".`);
  }
});