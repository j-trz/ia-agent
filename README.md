# App con IA - Buscador de Vuelos

## ¿Qué es?
Una aplicación web sencilla para buscar vuelos económicos usando IA (Gemini). Permite modificar los parámetros del viaje y muestra los resultados en una tabla visual.

## Estructura
- **/server**: Backend Node.js (Express) que consulta Gemini.
- **/index.html, /main.js, /style.css**: Frontend Vanilla JS + TailwindCSS.

## ¿Cómo usar?
1. Coloca tu clave de Gemini en `/server/.env`.
2. Instala dependencias en la raíz: `npm install`.
3. Instala dependencias en `/server` si lo deseas: `npm install`.
4. Inicia el backend: `node server/index.js`.
5. Inicia el frontend: `npm run dev` (en la raíz).
6. Abre el navegador en la URL que indique Vite (por defecto http://localhost:5173).

## Personalización
Puedes modificar los campos del formulario para cambiar origen, destino, fechas, etc. El resultado se muestra en una tabla bonita.

---

Este README se actualizará con instrucciones más detalladas tras la integración final.
