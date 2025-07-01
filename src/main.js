import './style.css';

const form = document.getElementById('form-vuelos');
const resultado = document.getElementById('resultado');
const chat = document.createElement('div');
chat.id = 'chat-historial';
chat.className = 'flex flex-col gap-4';
resultado.appendChild(chat);

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = form.querySelector('textarea, input[type=text]');
  const userMsg = input.value.trim();
  if (!userMsg) return;
  // Mostrar mensaje del usuario en el chat
  chat.innerHTML += renderChatBubble(userMsg, 'user');
  input.value = '';
  // Mostrar spinner de IA
  const spinnerId = 'spinner-' + Date.now();
  chat.innerHTML += `<div id="${spinnerId}" class="flex justify-start"><div class="bg-gray-100 text-gray-500 px-4 py-2 rounded-lg shadow animate-pulse">Pensando...</div></div>`;
  chat.scrollTop = chat.scrollHeight;
  try {
    const res = await fetch('https://jestefan.app.n8n.cloud/webhook/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: userMsg }) // Usar texto libre, no el prompt predefinido
    });
    const json = await res.json();
    // Eliminar spinner
    document.getElementById(spinnerId)?.remove();
    // Mostrar respuesta IA en el chat
    chat.innerHTML += renderChatBubble(renderAnyResult(json), 'ia', true);
    chat.scrollTop = chat.scrollHeight;
  } catch (err) {
    document.getElementById(spinnerId)?.remove();
    chat.innerHTML += renderChatBubble(`<span class='text-red-600'>Error: ${err.message}</span>`, 'ia', true);
    chat.scrollTop = chat.scrollHeight;
  }
});

function generarPrompt(data) {
  return `Eres un agente de viajes IA. Busca vuelos baratos de ${data.origen} a ${data.destino} saliendo el ${data.fechaSalida} y regresando el ${data.fechaRegreso}. Adultos: ${data.adultos}, Niños: ${data.ninos}, Bebés: ${data.bebes}. Devuelve solo una tabla Markdown con los resultados, sin texto adicional.`;
}

function extraerTablaMarkdown(json) {
  // Si es array, buscar en el primer elemento
  if (Array.isArray(json) && json.length > 0) return extraerTablaMarkdown(json[0]);
  // Busca la tabla en cualquier campo de texto relevante
  for (const key of ['output', 'respuesta', 'message', 'result']) {
    if (json[key] && typeof json[key] === 'string' && json[key].includes('|')) {
      return json[key];
    }
  }
  // Busca en el primer string del objeto
  for (const v of Object.values(json)) {
    if (typeof v === 'string' && v.includes('|')) return v;
  }
  return null;
}

function extraerTextoPlano(json) {
  // Si es array, buscar en el primer elemento
  if (Array.isArray(json) && json.length > 0) return extraerTextoPlano(json[0]);
  // Busca el primer string largo que no sea tabla
  for (const v of Object.values(json)) {
    if (typeof v === 'string' && !v.includes('|') && v.trim().length > 0) return v;
  }
  return null;
}

function renderResult(md) {
  const tableHtml = markdownTableToHtml(md);
  return `
    <div class="mb-4 flex justify-center">
      <button onclick="window.location.reload()" class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded transition flex items-center gap-2"><svg xmlns='http://www.w3.org/2000/svg' class='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M4 4v5h.582M20 20v-5h-.581M5.21 17.293A8.001 8.001 0 0112 4a8.001 8.001 0 016.79 13.293M19 15v6h-6' /></svg> Nueva búsqueda</button>
    </div>
    <div class="rounded-lg shadow border bg-white p-4">
      ${tableHtml}
    </div>
  `;
}

function renderPlainText(texto) {
  return `
    <div class="mb-4 flex justify-center">
      <button onclick="window.location.reload()" class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded transition flex items-center gap-2"><svg xmlns='http://www.w3.org/2000/svg' class='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M4 4v5h.582M20 20v-5h-.581M5.21 17.293A8.001 8.001 0 0112 4a8.001 8.001 0 016.79 13.293M19 15v6h-6' /></svg> Nueva búsqueda</button>
    </div>
    <div class="rounded-lg shadow border bg-white p-4 text-gray-800 whitespace-pre-line text-center">${texto}</div>
  `;
}

function renderJson(json) {
  return `
    <div class="mb-4 flex justify-center">
      <button onclick="window.location.reload()" class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded transition flex items-center gap-2"><svg xmlns='http://www.w3.org/2000/svg' class='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M4 4v5h.582M20 20v-5h-.581M5.21 17.293A8.001 8.001 0 0112 4a8.001 8.001 0 016.79 13.293M19 15v6h-6' /></svg> Nueva búsqueda</button>
    </div>
    <div class="rounded-lg shadow border bg-white p-4">
      <div class="text-center text-gray-500 mb-2">Respuesta recibida (JSON):</div>
      <pre class='text-xs bg-gray-100 p-2 mt-2 rounded text-left'>${JSON.stringify(json, null, 2)}</pre>
    </div>
  `;
}

function renderAnyResult(json) {
  // 1. Buscar tabla Markdown
  const tabla = extraerTablaMarkdown(json);
  if (tabla) return renderResult(tabla);
  // 2. Buscar texto plano relevante
  const texto = extraerTextoPlano(json);
  if (texto) return renderPlainText(texto);
  // 3. Mostrar JSON formateado si no hay nada más
  return renderJson(json);
}

function markdownTableToHtml(md) {
  const tableMatch = md.match(/((\|.+)+)/);
  if (!tableMatch) return '<div class="text-center text-gray-500">No se encontró tabla en la respuesta.</div>';
  const lines = tableMatch[0].split('\n').filter(Boolean);
  if (lines.length < 2) return '<div class="text-center text-gray-500">No se encontró tabla en la respuesta.</div>';
  const headers = lines[0].split('|').map(h => h.trim()).filter(Boolean);
  const rows = lines.slice(2).map(line => line.split('|').map(c => c.trim()).filter(Boolean));
  let html = '<div class="overflow-x-auto"><table class="min-w-full border text-sm text-center rounded-lg">';
  html += '<thead><tr>' + headers.map(h => `<th class="border-b p-2 bg-blue-600 text-white">${h}</th>`).join('') + '</tr></thead>';
  html += '<tbody>' + rows.map(row => '<tr>' + row.map(c => `<td class="border-b p-2">${c}</td>`).join('') + '</tr>').join('') + '</tbody>';
  html += '</table></div>';
  return html;
}

function renderChatBubble(content, sender = 'ia', isHtml = false) {
  const base = sender === 'user'
    ? 'justify-end'
    : 'justify-start';
  const color = sender === 'user'
    ? 'bg-blue-600 text-white'
    : 'bg-gray-100 text-gray-800';
  return `<div class="flex ${base}"><div class="max-w-[80%] px-4 py-2 rounded-lg shadow ${color} whitespace-pre-line mt-2">${isHtml ? content : escapeHtml(content)}</div></div>`;
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, function (c) {
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c];
  });
}
