/**
 * identidad.js - Configuración de color de Tailwind para el área cliente.
 *
 * Este archivo se carga justo después de https://cdn.tailwindcss.com y antes de
 * que se analyse el documento, de modo que las clases de marca (bg-pf-negro,
 * text-pf-amarillo, border-pf-rojo...) queden disponibles en todas las páginas
 * públicas junto con las clases estándar de Tailwind.
 *
 * Es un script clásico (no módulo) porque debe ejecutarse de forma síncrona.
 */
tailwind.config = {
  theme: {
    extend: {
      colors: {
        pf: {
          negro: '#0A0A0A',
          grafito: '#151515',
          carbon: '#1F1F1F',
          linea: '#2E2E2E',
          amarillo: '#FFD000',
          rojo: '#E21B23',
          blanco: '#FFFFFF',
          gris: '#A0A0A0'
        }
      }
    }
  }
};