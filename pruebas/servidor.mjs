/**
 * Servidor estático mínimo para probar el proyecto en local.
 * Uso:  node pruebas/servidor.mjs [puerto]
 *
 * El proyecto usa módulos ES y Fetch API, por eso necesita HTTP
 * y no basta con abrir los archivos con doble clic.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUERTO = Number(process.argv[2] || 5500);

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

const servidor = createServer(async (peticion, respuesta) => {
  try {
    const url = decodeURIComponent(peticion.url.split('?')[0]);
    const relativa = normalize(url).replace(/^([/\\])+/, '');
    let archivo = join(RAIZ, relativa || 'index.html');

    // No se puede salir de la carpeta del proyecto.
    if (!archivo.startsWith(RAIZ)) {
      respuesta.writeHead(403).end('Acceso denegado');
      return;
    }

    let contenido;
    try {
      contenido = await readFile(archivo);
    } catch {
      if (!relativa.endsWith('/')) {
        archivo = join(archivo, 'index.html');
        contenido = await readFile(archivo);
      } else {
        throw new Error('no encontrado');
      }
    }

    respuesta.writeHead(200, { 'Content-Type': TIPOS[extname(archivo)] || 'application/octet-stream' });
    respuesta.end(contenido);
  } catch {
    respuesta.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    respuesta.end('404: no encontrado');
  }
});

servidor.listen(PUERTO, () => {
  console.log(`Planeta Fitness servido en http://localhost:${PUERTO}`);
});