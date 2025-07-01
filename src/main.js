import './style.css';

const form = document.getElementById('form-vuelos');
const chatHistorial = document.getElementById('chat-historial'); // Referencia directa al div del chat
const userInput = form.querySelector('textarea, input[type=text]');

// Función para escapar HTML y prevenir XSS
function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/[&<>"']/g, function (c) {
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c];
  });
}

// Función para renderizar una burbuja de chat
function renderChatBubble(content, sender = 'ia', isHtml = false) {
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('flex', 'mb-3', 'message-bubble'); // 'mb-3' para espacio, 'message-bubble' para posible estilo global

  const bubble = document.createElement('div');
  bubble.classList.add('max-w-[80%]', 'px-4', 'py-2', 'rounded-lg', 'shadow', 'whitespace-pre-line');

  if (sender === 'user') {
    messageDiv.classList.add('justify-end');
    bubble.classList.add('bg-blue-600', 'text-white');
  } else {
    messageDiv.classList.add('justify-start');
    bubble.classList.add('bg-gray-100', 'text-gray-800');
  }

  if (isHtml) {
    bubble.innerHTML = content;
  } else {
    bubble.textContent = content;
  }

  messageDiv.appendChild(bubble);
  return messageDiv;
}

// Función para añadir mensaje al chat y hacer scroll
function addMessageToChat(element) {
  console.log('addMessageToChat: chatHistorial element:', chatHistorial);
  if (element && typeof element.outerHTML === 'string') {
    console.log('addMessageToChat: Elemento HTML a añadir:', element.outerHTML);
  } else {
    console.log('addMessageToChat: Elemento a añadir (no es un elemento HTML estándar o es nulo):', element);
  }
  chatHistorial.appendChild(element);
  chatHistorial.scrollTop = chatHistorial.scrollHeight; // Auto-scroll
}

// Funciones de extracción y renderizado de resultados (modificadas para no incluir botón "Nueva Búsqueda")
function extraerTablaMarkdown(json) {
  if (Array.isArray(json) && json.length > 0) return extraerTablaMarkdown(json[0]);
  for (const key of ['output', 'respuesta', 'message', 'result']) {
    if (json[key] && typeof json[key] === 'string' && json[key].includes('|')) {
      return json[key];
    }
  }
  for (const v of Object.values(json)) {
    if (typeof v === 'string' && v.includes('|')) return v;
  }
  return null;
}

function extraerTextoPlano(json) {
  if (Array.isArray(json) && json.length > 0) return extraerTextoPlano(json[0]);
  for (const v of Object.values(json)) {
    if (typeof v === 'string' && !v.includes('|') && v.trim().length > 0) return v;
  }
  return null;
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

function renderResultTable(md) {
  const tableHtml = markdownTableToHtml(md);
  return `<div class="rounded-lg shadow border bg-white p-4">${tableHtml}</div>`;
}

function renderResultPlainText(texto) {
  return `<div class="rounded-lg shadow border bg-white p-4 text-gray-800 whitespace-pre-line text-left">${texto}</div>`;
}

function renderResultJson(json) {
  return `
    <div class="rounded-lg shadow border bg-white p-4">
      <div class="text-center text-gray-500 mb-2">Respuesta recibida (JSON):</div>
      <pre class='text-xs bg-gray-100 p-2 mt-2 rounded text-left'>${escapeHtml(JSON.stringify(json, null, 2))}</pre>
    </div>`;
}

function renderAnyResultForChat(json) {
  console.log("renderAnyResultForChat recibió:", JSON.stringify(json, null, 2)); // Log para ver la entrada completa

  const tabla = extraerTablaMarkdown(json);
  if (tabla) {
    console.log("renderAnyResultForChat: Detectada tabla. Contenido:", tabla);
    return renderResultTable(tabla);
  }

  const texto = extraerTextoPlano(json);
  if (texto) {
    console.log("renderAnyResultForChat: Detectado texto plano. Contenido:", texto);
    return renderResultPlainText(texto);
  }

  console.log("renderAnyResultForChat: No se detectó tabla ni texto plano. Renderizando como JSON crudo.");
  return renderResultJson(json);
}


form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const userMsgText = userInput.value.trim();
  if (!userMsgText) return;

  // 1. Mostrar mensaje del usuario en el chat
  addMessageToChat(renderChatBubble(userMsgText, 'user'));
  userInput.value = ''; // Limpiar input

  // 2. Mostrar spinner/mensaje de "Pensando..." de la IA
  const thinkingBubble = renderChatBubble('Pensando...', 'ia');
  thinkingBubble.id = 'thinking-bubble'; // ID para poder quitarlo/reemplazarlo
  addMessageToChat(thinkingBubble);

  try {
    const res = await fetch('https://jestefan.app.n8n.cloud/webhook/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: userMsgText })
    });
    const jsonResponse = await res.json();
    console.log('Respuesta de n8n (fetch):', JSON.stringify(jsonResponse, null, 2)); // LOG RESPUESTA CRUDA

    // 3. Eliminar spinner y mostrar respuesta de la IA
    document.getElementById('thinking-bubble')?.remove();
    const aiResponseHtml = renderAnyResultForChat(jsonResponse);
    addMessageToChat(renderChatBubble(aiResponseHtml, 'ia', true));

  } catch (err) {
    document.getElementById('thinking-bubble')?.remove();
    const errorHtml = `<span class='text-red-600'>Error: ${escapeHtml(err.message)}</span>`;
    addMessageToChat(renderChatBubble(errorHtml, 'ia', true));
  }
});

// Mensaje inicial de bienvenida (opcional)
addMessageToChat(renderChatBubble('Hola! ¿En qué puedo ayudarte hoy con tu búsqueda de vuelos?', 'ia'));
