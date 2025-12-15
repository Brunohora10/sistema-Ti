// ========================================
// PORTAL DE ACOMPANHAMENTO DE CHAMADOS
// ========================================

const API_URL = window.location.origin;

const form = document.getElementById('searchForm');
const resultContainer = document.getElementById('resultContainer');
const ticketInput = document.getElementById('ticketNumber');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  await searchTicket();
});

// Máscara: força prefixo TI e aceita apenas dígitos no sufixo
function applyTicketMask(value) {
  const cleaned = value.toUpperCase().replace(/\s+/g, '').replace(/[^A-Z0-9#]/g, '');
  // Remove prefixos errados e mantém apenas dígitos após TI
  const digits = cleaned.replace(/^#?TI/, '').replace(/[^0-9]/g, '');
  return `#TI${digits}`;
}

if (ticketInput) {
  ticketInput.addEventListener('input', (e) => {
    const start = e.target.selectionStart;
    const end = e.target.selectionEnd;
    const masked = applyTicketMask(e.target.value);
    e.target.value = masked;
    // Reposicionar cursor no final
    try {
      e.target.setSelectionRange(masked.length, masked.length);
    } catch {}
  });
  // Ao focar, garantir prefixo
  ticketInput.addEventListener('focus', (e) => {
    if (!e.target.value) e.target.value = '#TI';
  });
}

async function searchTicket() {
  const ticketNumber = document.getElementById('ticketNumber').value.trim();

  // Validação: exigir formato #TI + números (permite com ou sem #)
  if (!ticketNumber) {
    showError('Informe o número do chamado');
    return;
  }

  const normalized = applyTicketMask(ticketNumber);
  const regex = /^#?TI\d+$/;
  if (!regex.test(normalized)) {
    showError('Formato inválido. Use algo como #TI123456');
    return;
  }

  try {
    resultContainer.innerHTML = '<div class="ticket-result"><p style="text-align:center; color:#6c757d;">🔍 Buscando...</p></div>';

    const params = new URLSearchParams();
    // extrair apenas dígitos do ticket
    const onlyDigits = normalized.replace(/[^0-9]/g, '');
    params.append('ticket_number', onlyDigits);

    const response = await fetch(`${API_URL}/api/tickets/track?${params}`);
    const data = await response.json();

    if (response.ok && data.success) {
      if (data.tickets && data.tickets.length > 0) {
        renderTickets(data.tickets);
      } else {
        showError('Nenhum chamado encontrado');
      }
    } else {
      showError(data.message || 'Erro ao buscar chamado');
    }
  } catch (error) {
    console.error('Erro:', error);
    showError('Erro ao conectar com o servidor');
  }
}

function renderTickets(tickets) {
  resultContainer.innerHTML = tickets.map(ticket => `
    <div class="ticket-result" style="margin-bottom: 20px;">
      <div class="ticket-header">
        <div class="ticket-number">${ticket.ticket_number}</div>
        <span class="badge badge-${ticket.status.replace('_', '-')}">${getStatusText(ticket.status)}</span>
      </div>

      <div class="status-timeline">
        <div class="timeline-step ${ticket.status === 'aberto' ? 'active' : 'completed'}">
          <div class="timeline-dot">📝</div>
          <div class="timeline-label">Aberto</div>
        </div>
        <div class="timeline-step ${ticket.status === 'em_andamento' ? 'active' : ticket.status === 'resolvido' || ticket.status === 'fechado' ? 'completed' : ''}">
          <div class="timeline-dot">⚙️</div>
          <div class="timeline-label">Em Andamento</div>
        </div>
        <div class="timeline-step ${ticket.status === 'resolvido' ? 'active' : ticket.status === 'fechado' ? 'completed' : ''}">
          <div class="timeline-dot">✅</div>
          <div class="timeline-label">Resolvido</div>
        </div>
        <div class="timeline-step ${ticket.status === 'fechado' ? 'active' : ''}">
          <div class="timeline-dot">🔒</div>
          <div class="timeline-label">Fechado</div>
        </div>
      </div>

      <div class="ticket-info-grid">
        <div class="info-item">
          <div class="info-label">Categoria</div>
          <div class="info-value">${ticket.category}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Prioridade</div>
          <div class="info-value">
            <span class="badge badge-${ticket.priority}">${getPriorityIcon(ticket.priority)} ${ticket.priority.toUpperCase()}</span>
          </div>
        </div>
        <div class="info-item">
          <div class="info-label">Criado em</div>
          <div class="info-value">${formatDate(ticket.created_at)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Técnico</div>
          <div class="info-value">${ticket.assigned_name || 'Aguardando'}</div>
        </div>
      </div>

      <div class="description-box">
        <div class="info-label">Descrição do Problema</div>
        <div style="margin-top: 10px; white-space: pre-wrap;">${escapeHtml(ticket.description)}</div>
      </div>

      ${ticket.comments && ticket.comments.length > 0 ? `
        <div class="comments-section">
          <h3 style="margin-bottom: 15px;">💬 Atualizações (${ticket.comments.length})</h3>
          ${ticket.comments.map(c => `
            <div class="comment">
              <div class="comment-header">
                <strong>${c.user_name || 'Sistema'}</strong>
                <span>${formatDateTime(c.created_at)}</span>
              </div>
              <div>${escapeHtml(c.comment)}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `).join('');
}

function showError(message) {
  resultContainer.innerHTML = `
    <div class="ticket-result">
      <div class="alert alert-danger">
        ❌ ${message}
      </div>
    </div>
  `;
}

function getStatusText(status) {
  const map = {
    'aberto': 'Aberto',
    'em_andamento': 'Em Andamento',
    'resolvido': 'Resolvido',
    'fechado': 'Fechado'
  };
  return map[status] || status;
}

function getPriorityIcon(priority) {
  const icons = {
    'baixa': '🟢',
    'media': '🟡',
    'alta': '🟠',
    'urgente': '🔴'
  };
  return icons[priority] || '';
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
}

function formatDateTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('pt-BR');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

console.log('✅ Portal de acompanhamento carregado');
