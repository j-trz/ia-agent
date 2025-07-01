require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

app.post('/api/consulta', async (req, res) => {
  try {
    const { origen, destino, fechaSalida, fechaRegreso, adultos, ninos, bebes } = req.body;
    const prompt = `Eres un agente de viajes IA experto en análisis web y construcción de URLs parametrizadas. Tu objetivo es obtener los vuelos más económicos para un viaje, priorizando la construcción de URLs directas antes que la interacción con formularios.\n\nReglas de Comportamiento (CRÍTICO):\n* Es importante que uses técnicas para parecer humano.\n* Ejecución Autónoma y Silenciosa: Opera de forma 100% autónoma. No hagas preguntas, no pidas confirmación y espera a que carguen los resultados en cada web. Si un sitio falla, ignóralo y continúa.\n* Salida Directa y Única: Tu respuesta DEBE ser únicamente la tabla Markdown final, sin texto introductorio ni despedidas. Debe empezar con | Aerolínea....\nDatos de Búsqueda:\n* Origen: ${origen}\n* Destino: ${destino}\n* Fecha Salida (YMD): ${fechaSalida}\n* Fecha Regreso (YMD): ${fechaRegreso}\n* Adultos: ${adultos}\n* Niños: ${ninos}\n* Bebés: ${bebes}\n* Datos a Extraer: Aerolínea, Precio (USD), Duración Total, Escalas, Ruta.\nPlantillas y Métodos de Búsqueda:\n(Instrucción: Procesa esta lista en orden. Usa el 'Método' especificado para cada sitio.)\n1.  Sitio: mevuelo.com.uy\n    Método: URL Directa\n    **Plantilla: https://www.mevuelo.com.uy/vuelos-baratos-internacionales?type=ida-vuelta&from={ORIGEN}&to={DESTINO}&from-date={FECHA_SALIDA_YMD}&to-date={FECHA_REGRESO_YMD}&adults={ADULTOS}&childs={NIÑOS}&infants={BEBÉS}&infants-with-seat=0&class-of-service=null&sorting=recomendado&view-type=sin-contenido&isMPC=no\n    *Formato fecha en url: YYYY-MM-DD\n    *Los resultados se mostraran dentro del siguiente selector: <div class=\"col-lg-12 col-xl-9\">\n    *Selector con detalles de vuelo: <div class=\"air-segments\">\n    *Selector con detalles de tarifa: <div class=\"holder-detail-prices\">\n\n2.  Sitio: jetmar.com.uy\n    *Método: URL Directa\n    *Plantilla: https://www.jetmar.com.uy/vuelos/shop/{ORIGEN}/{DESTINO}/{FECHA_SALIDA_YMD}/{FECHA_REGRESO_YMD}/economy/{ADULTOS}/{NIÑOS}/{BEBÉS}/false\n    *Formato fecha en url: YYYY-MM-DD\n    *Los resultados se mostraran dentro del siguiente selector: <div _ngcontent-c8 class=\"col px-2 px-lg-3\">\n    *Selector con detalles de vuelo: <div data-eventaction=\"detalle vuelo card - desk\" data-eventcategory=\"vuelo\">\n    *Selector con detalles de tarifa: <app-search-flight-price >\n\n3.  Sitio: toctocviajes.com\n    *Método: URL Directa\n    *Plantilla: https://www.toctocviajes.com/ttv/flights/round-trip/{ORIGEN}/{DESTINO}/{FECHA_SALIDA_YMD}/{FECHA_REGRESO_YMD}/false/{ADULTOS}/{NIÑOS}/{BEBÉS}/false/2/4/1///list\n    *Formato fecha en url: YYYY-MM-DD\n      *Los resultados se mostraran dentro del siguiente selector:<div id=\"resultadosLinealesAereos\">\n    *Selector con detalles de vuelo: <div class=\"t-legs-section\">\n    *Selector con detalles de tarifa: <div class=\"t-price-section\">\n\n4.  Sitio: hiperviajes.com.uy\n    *Método: URL Directa\n    *Plantilla: https://www.hiperviajes.com.uy/vuelos/listado/RoundTrip/{ORIGEN}/{DESTINO}/{FECHA_SALIDA_YMD},{FECHA_REGRESO_YMD}/{ADULTOS}/{NIÑOS}/{BEBÉS}/1/false\n    *Formato fecha en url: DD-MM-YYYY\n    *Los resultados se mostraran dentro del siguiente selector: <div class=\"tab-content tab-content-vuelos\">\n    *Selector con detalles de vuelo: <div class=\"flight-time\">\n    *Selector con detalles de tarifa: <div class=\"buy-now\">\n\n\nProtocolo de Ejecución:\n1.  Bucle de Búsqueda: Para CADA sitio en la lista \"Plantillas, Métodos, selectores, formatos de fecha.\":\n    c. Ejecución: Navega directamente a la URL construida o a la página de resultados del formulario.\n    d. Extracción: Espera a que la página cargue y extrae los \"Datos a Extraer\" de las 3 opciones más baratas. Almacena los resultados junto al nombre del sitio.\n2.  Análisis y Reporte Final:** Consolida todos los resultados exitosos, filtra las 5 mejores opciones globales y presenta la tabla como única salida. La tabla debe tener la columna del sitio ademas de los otros datos.\n3.  Una vez obtengas los resultados, calcula la diferencia de precio entre ellas en una columna a parte.\n4.  En caso de error no buscar en ningun otro lado y devolver los resultados que no dieron error.`;
    const result = await model.generateContent(prompt);
    res.json({ respuesta: result.response.text() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en puerto ${PORT}`);
});
