// ========================================
// DASHBOARD - GERENCIAMENTO DE CHAMADOS
// ========================================

const API_URL = window.location.origin;
let currentUser = null;
let allTickets = [];
let socket = null;
let searchTimeout = null;

// Verificar autenticação
const token = localStorage.getItem('token');
if (!token) {
  window.location.href = '/login.html';
}

// Inicializar
document.addEventListener('DOMContentLoaded', async () => {
  await loadUserData();
  await loadTickets();
  initializeSocket();
  
  // Solicitar permissão para notificações
  if ('Notification' in window && Notification.permission === 'default') {
    requestNotificationPermission();
  }
});

// Carregar dados do usuário
async function loadUserData() {
  try {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      currentUser = data.user;
      
      // Atualizar UI
      document.getElementById('userName').textContent = currentUser.name;
      document.getElementById('userRole').textContent = getRoleText(currentUser.role);
      
      // Mostrar/ocultar menus baseado na role
      const metricsNav = document.getElementById('metricsNav');
      const usersNav = document.getElementById('usersNav');
      
      if (currentUser.role === 'AUXILIAR') {
        if (metricsNav) metricsNav.style.display = 'none';
        if (usersNav) usersNav.style.display = 'none';
      } else if (currentUser.role === 'COORDENADOR') {
        if (usersNav) usersNav.style.display = 'none';
      }
      // DESENVOLVEDOR vê tudo - não precisa ocultar nada
      
    } else {
      logout();
    }
  } catch (error) {
    console.error('Erro ao carregar usuário:', error);
    logout();
  }
}

// Carregar chamados
async function loadTickets() {
  try {
    document.getElementById('loadingContainer').classList.remove('hidden');
    document.getElementById('ticketsTableContainer').classList.add('hidden');
    document.getElementById('emptyState').classList.add('hidden');

    // Obter filtros
    const status = document.getElementById('filterStatus').value;
    const priority = document.getElementById('filterPriority').value;
    const category = document.getElementById('filterCategory').value;
    const search = document.getElementById('filterSearch').value;

    // Construir query string
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (priority) params.append('priority', priority);
    if (category) params.append('category', category);
    if (search) params.append('search', search);

    const response = await fetch(`${API_URL}/api/tickets?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      allTickets = data.tickets;
      renderTickets(allTickets);
      updateStats(allTickets);
    } else {
      showAlert('danger', 'Erro ao carregar chamados');
    }

  } catch (error) {
    console.error('Erro ao carregar chamados:', error);
    showAlert('danger', 'Erro ao conectar com o servidor');
  } finally {
    document.getElementById('loadingContainer').classList.add('hidden');
  }
}

// Renderizar tabela de chamados
function renderTickets(tickets) {
  const tbody = document.getElementById('ticketsTableBody');
  const container = document.getElementById('ticketsTableContainer');
  const emptyState = document.getElementById('emptyState');
  const countSpan = document.getElementById('ticketCount');

  tbody.innerHTML = '';
  countSpan.textContent = `${tickets.length} chamado${tickets.length !== 1 ? 's' : ''}`;

  if (tickets.length === 0) {
    container.classList.add('hidden');
    emptyState.classList.remove('hidden');
    return;
  }

  container.classList.remove('hidden');
  emptyState.classList.add('hidden');

  tickets.forEach(ticket => {
    const tr = document.createElement('tr');
    tr.onclick = () => openTicketDetail(ticket.id);
    
    tr.innerHTML = `
      <td>
        <span class="ticket-number">#${ticket.ticket_number}</span>
      </td>
      <td>
        <div class="ticket-subject">${escapeHtml(ticket.subject)}</div>
      </td>
      <td>
        <div class="ticket-requester">${escapeHtml(ticket.requester_name)}</div>
      </td>
      <td>${escapeHtml(ticket.category)}</td>
      <td>
        <span class="badge badge-${ticket.priority}">
          ${getPriorityIcon(ticket.priority)} ${ticket.priority.toUpperCase()}
        </span>
      </td>
      <td>
        <span class="badge badge-${ticket.status.replace('_', '-')}">
          ${getStatusText(ticket.status)}
        </span>
      </td>
      <td>${ticket.assigned_name || '<em>Não atribuído</em>'}</td>
      <td>
        <div class="ticket-date">${formatDate(ticket.created_at)}</div>
      </td>
      <td>
        <div class="ticket-actions">
          <button class="action-btn" onclick="event.stopPropagation(); openTicketDetail(${ticket.id})" title="Ver detalhes">
            👁️
          </button>
        </div>
      </td>
    `;
    
    tbody.appendChild(tr);
  });
}

// Atualizar estatísticas
function updateStats(tickets) {
  const total = tickets.length;
  const open = tickets.filter(t => t.status === 'aberto').length;
  const inProgress = tickets.filter(t => t.status === 'em_andamento').length;
  const resolved = tickets.filter(t => t.status === 'resolvido' || t.status === 'fechado').length;

  document.getElementById('totalTickets').textContent = total;
  document.getElementById('openTickets').textContent = open;
  document.getElementById('inProgressTickets').textContent = inProgress;
  document.getElementById('resolvedTickets').textContent = resolved;
  document.getElementById('openTicketsBadge').textContent = open;
}

// Abrir detalhes do chamado
async function openTicketDetail(ticketId) {
  const modal = document.getElementById('ticketModal');
  const content = document.getElementById('ticketDetailContent');
  
  modal.classList.add('active');
  content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  try {
    const response = await fetch(`${API_URL}/api/tickets/${ticketId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      renderTicketDetail(data);
    } else {
      content.innerHTML = '<div class="alert alert-danger">Erro ao carregar chamado</div>';
    }
  } catch (error) {
    console.error('Erro:', error);
    content.innerHTML = '<div class="alert alert-danger">Erro ao conectar com o servidor</div>';
  }
}

// Renderizar detalhes do chamado
async function renderTicketDetail(data) {
  const { ticket, comments, history } = data;
  const content = document.getElementById('ticketDetailContent');

  // Carregar lista de técnicos para atribuição
  let techniciansOptions = '<option value="">Não atribuído</option>';
  try {
    const techResponse = await fetch(`${API_URL}/api/users/technicians`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (techResponse.ok) {
      const techData = await techResponse.json();
      techniciansOptions += techData.technicians.map(t => 
        `<option value="${t.id}" ${ticket.assigned_to === t.id ? 'selected' : ''}>${t.name}</option>`
      ).join('');
    }
  } catch (e) {
    console.error('Erro ao carregar técnicos:', e);
  }

  const canEdit = currentUser.role !== 'auxiliar' || ticket.assigned_to === currentUser.id;

  // Calcular SLA
  const sla = calculateSLA(ticket.priority, ticket.created_at);
  const slaClass = getSLABadgeClass(sla);

  // Buscar histórico do solicitante
  let solicitanteHistory = '';
  try {
    const histResponse = await fetch(`${API_URL}/api/tickets?search=${encodeURIComponent(ticket.requester_email)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (histResponse.ok) {
      const histData = await histResponse.json();
      const otherTickets = histData.tickets.filter(t => t.id !== ticket.id).slice(0, 5);
      if (otherTickets.length > 0) {
        solicitanteHistory = `
          <div style="margin-top: 20px; padding: 15px; background: var(--light); border-radius: 8px;">
            <h4 style="margin: 0 0 10px 0; font-size: 14px;">📋 Histórico deste Solicitante (${otherTickets.length})</h4>
            ${otherTickets.map(t => `
              <div style="padding: 5px 0; font-size: 12px; color: #6c757d;">
                • <a href="#" onclick="openTicket(${t.id}); return false;">#${t.ticket_number}</a> - 
                ${t.category} - 
                <span class="badge badge-${t.status.replace('_', '-')}" style="font-size: 10px;">${getStatusText(t.status)}</span>
              </div>
            `).join('')}
          </div>
        `;
      }
    }
  } catch (e) {
    console.error('Erro ao carregar histórico:', e);
  }

  content.innerHTML = `
    <div class="ticket-detail">
      <div class="ticket-detail-header">
        <div class="ticket-detail-number">#${ticket.ticket_number}</div>
        ${ticket.status !== 'resolvido' && ticket.status !== 'fechado' ? `
          <div style="margin-top: 10px;">
            <div style="font-size: 12px; margin-bottom: 5px;">SLA: ${sla.remaining > 0 ? Math.floor(sla.remaining / 60) + 'h ' + (sla.remaining % 60) + 'min restantes' : 'ATRASADO há ' + Math.abs(Math.floor(sla.remaining / 60)) + 'h'}</div>
            <div style="background: var(--light); height: 8px; border-radius: 4px; overflow: hidden;">
              <div style="background: ${sla.isOverdue ? '#dc3545' : sla.isNearDeadline ? '#ffc107' : '#28a745'}; height: 100%; width: ${Math.min(100, sla.percentage)}%; transition: width 0.3s;"></div>
            </div>
          </div>
        ` : ''}
      </div>
      
      <div class="ticket-detail-body">
        <div class="ticket-info-grid">
          <div class="ticket-info-item">
            <div class="ticket-info-label">Solicitante</div>
            <div class="ticket-info-value">${escapeHtml(ticket.requester_name)}</div>
          </div>
          <div class="ticket-info-item">
            <div class="ticket-info-label">Email</div>
            <div class="ticket-info-value">
              ${escapeHtml(ticket.requester_email)}
              ${ticket.requester_email ? `<a href="mailto:${ticket.requester_email}" style="margin-left: 10px;" title="Enviar email">📧</a>` : ''}
            </div>
          </div>
          ${ticket.requester_phone ? `
            <div class="ticket-info-item">
              <div class="ticket-info-label">Contato</div>
              <div class="ticket-info-value">
                <a href="tel:${ticket.requester_phone}" style="text-decoration: none; color: inherit;">${ticket.requester_phone}</a>
                <a href="https://wa.me/55${ticket.requester_phone.replace(/\D/g, '')}" target="_blank" class="btn btn-success btn-sm" style="margin-left: 10px; padding: 2px 8px; font-size: 11px; text-decoration: none;">📱 WhatsApp</a>
              </div>
            </div>
          ` : ''}
          <div class="ticket-info-item">
            <div class="ticket-info-label">Departamento</div>
            <div class="ticket-info-value">${escapeHtml(ticket.department)}</div>
          </div>
          <div class="ticket-info-item">
            <div class="ticket-info-label">Categoria</div>
            <div class="ticket-info-value">${escapeHtml(ticket.category)}</div>
          </div>
          <div class="ticket-info-item">
            <div class="ticket-info-label">Prioridade</div>
            <div class="ticket-info-value">
              <span class="badge badge-${ticket.priority}">
                ${getPriorityIcon(ticket.priority)} ${ticket.priority.toUpperCase()}
              </span>
            </div>
          </div>
          <div class="ticket-info-item">
            <div class="ticket-info-label">Status</div>
            <div class="ticket-info-value">
              <span class="badge badge-${ticket.status.replace('_', '-')}">
                ${getStatusText(ticket.status)}
              </span>
            </div>
          </div>
          <div class="ticket-info-item">
            <div class="ticket-info-label">Criado em</div>
            <div class="ticket-info-value">${formatDateTime(ticket.created_at)}</div>
          </div>
          <div class="ticket-info-item">
            <div class="ticket-info-label">Atribuído a</div>
            <div class="ticket-info-value">${ticket.assigned_name || '<em>Não atribuído</em>'}</div>
          </div>
        </div>

        <div style="margin-top: 25px;">
          <div class="ticket-info-label" style="margin-bottom: 10px;">Descrição</div>
          <div class="ticket-description">${escapeHtml(ticket.description).replace(/\n/g, '<br>')}</div>
        </div>

        ${ticket.attachment ? `
          <div style="margin-top: 20px;">
            <div class="ticket-info-label" style="margin-bottom: 10px;">Anexo</div>
            <a href="/uploads/${ticket.attachment}" target="_blank" class="btn btn-secondary btn-sm">
              📎 Ver Anexo
            </a>
          </div>
        ` : ''}

        ${solicitanteHistory}

        ${canEdit ? `
          <div style="margin-top: 30px; padding-top: 30px; border-top: 2px solid var(--light);">
            <h3 style="margin-bottom: 20px;">Gerenciar Chamado</h3>
            
            <div class="form-row">
              <div class="form-group">
                <label>Status</label>
                <select id="ticketStatus" class="form-control">
                  <option value="aberto" ${ticket.status === 'aberto' ? 'selected' : ''}>Aberto</option>
                  <option value="em_andamento" ${ticket.status === 'em_andamento' ? 'selected' : ''}>Em Andamento</option>
                  <option value="resolvido" ${ticket.status === 'resolvido' ? 'selected' : ''}>Resolvido</option>
                  <option value="fechado" ${ticket.status === 'fechado' ? 'selected' : ''}>Fechado</option>
                </select>
              </div>
              
              <div class="form-group">
                <label>Prioridade</label>
                <select id="ticketPriority" class="form-control">
                  <option value="baixa" ${ticket.priority === 'baixa' ? 'selected' : ''}>🟢 Baixa</option>
                  <option value="media" ${ticket.priority === 'media' ? 'selected' : ''}>🟡 Média</option>
                  <option value="alta" ${ticket.priority === 'alta' ? 'selected' : ''}>🟠 Alta</option>
                  <option value="urgente" ${ticket.priority === 'urgente' ? 'selected' : ''}>🔴 Urgente</option>
                </select>
              </div>
              
              <div class="form-group">
                <label>Atribuir a</label>
                <select id="ticketAssigned" class="form-control">
                  ${techniciansOptions}
                </select>
              </div>
            </div>
            
            <button class="btn btn-primary" onclick="updateTicket(${ticket.id})">
              💾 Salvar Alterações
            </button>
          </div>
        ` : ''}

        <div class="comments-section">
          <div class="comments-header">💬 Comentários (${comments.length})</div>
          
          <div id="commentsList">
            ${comments.length === 0 ? '<p style="color: #6c757d;">Nenhum comentário ainda.</p>' : 
              comments.map(c => `
                <div class="comment ${c.is_internal ? 'internal' : ''}">
                  <div class="comment-header">
                    <span class="comment-author">
                      ${c.user_name || 'Sistema'}
                      ${c.is_internal ? '<span class="badge badge-media" style="margin-left: 10px;">INTERNO</span>' : ''}
                    </span>
                    <span class="comment-date">${formatDateTime(c.created_at)}</span>
                  </div>
                  <div class="comment-text">${escapeHtml(c.comment).replace(/\n/g, '<br>')}</div>
                </div>
              `).join('')
            }
          </div>

          ${canEdit ? `
            <div class="comment-form">
              <div class="form-group">
                <label>Adicionar Comentário</label>
                <textarea id="newComment" class="form-control" rows="3" placeholder="Digite seu comentário..."></textarea>
              </div>
              <div class="form-group">
                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                  <input type="checkbox" id="isInternal">
                  <span>Comentário interno (não visível para o solicitante)</span>
                </label>
              </div>
              <button class="btn btn-success" onclick="addComment(${ticket.id})">
                💬 Adicionar Comentário
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

// Atualizar chamado
async function updateTicket(ticketId) {
  try {
    const status = document.getElementById('ticketStatus').value;
    const priority = document.getElementById('ticketPriority').value;
    const assigned_to = document.getElementById('ticketAssigned').value || null;

    const response = await fetch(`${API_URL}/api/tickets/${ticketId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status, priority, assigned_to })
    });

    const data = await response.json();

    if (response.ok) {
      showAlert('success', 'Chamado atualizado com sucesso!');
      await loadTickets();
      await openTicketDetail(ticketId); // Recarregar detalhes
    } else {
      showAlert('danger', data.message || 'Erro ao atualizar chamado');
    }
  } catch (error) {
    console.error('Erro:', error);
    showAlert('danger', 'Erro ao conectar com o servidor');
  }
}

// Adicionar comentário
async function addComment(ticketId) {
  try {
    const comment = document.getElementById('newComment').value.trim();
    const is_internal = document.getElementById('isInternal').checked;

    if (!comment) {
      alert('Por favor, digite um comentário');
      return;
    }

    const response = await fetch(`${API_URL}/api/tickets/${ticketId}/comments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ comment, is_internal })
    });

    const data = await response.json();

    if (response.ok) {
      showAlert('success', 'Comentário adicionado!');
      await openTicketDetail(ticketId); // Recarregar detalhes
    } else {
      showAlert('danger', data.message || 'Erro ao adicionar comentário');
    }
  } catch (error) {
    console.error('Erro:', error);
    showAlert('danger', 'Erro ao conectar com o servidor');
  }
}

// Fechar modal
function closeTicketModal() {
  document.getElementById('ticketModal').classList.remove('active');
}

// Inicializar Socket.io para atualizações em tempo real
function initializeSocket() {
  socket = io(API_URL);

  socket.on('connect', () => {
    console.log('✅ Conectado ao servidor em tempo real');
    if (currentUser) {
      socket.emit('join', currentUser.id);
    }
  });

  socket.on('new_ticket', (ticket) => {
    console.log('🆕 Novo chamado recebido:', ticket.ticket_number);
    showNotification('Novo Chamado', `#${ticket.ticket_number} - ${ticket.subject}`);
    showBrowserNotification('🆕 Novo Chamado', {
      body: `#${ticket.ticket_number} - ${ticket.subject}`,
      tag: ticket.ticket_number,
      url: '/dashboard.html'
    });
    playNotificationSound();
    loadTickets();
  });

  socket.on('ticket_updated', (ticket) => {
    console.log('🔄 Chamado atualizado:', ticket.ticket_number);
    loadTickets();
  });

  socket.on('comment_added', (data) => {
    console.log('💬 Novo comentário no chamado:', data.ticket_id);
  });
}

// Mostrar notificação
function showNotification(title, message) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body: message, icon: '/favicon.ico' });
  }
}

// Solicitar permissão para notificações
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission();
}

// Debounce para busca
function debounceSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    loadTickets();
  }, 500);
}

// Logout
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login.html';
}

// Funções auxiliares
function getRoleText(role) {
  const roles = {
    'desenvolvedor': 'Desenvolvedor',
    'coordenador': 'Coordenador',
    'auxiliar': 'Auxiliar'
  };
  return roles[role] || role;
}

function getStatusText(status) {
  const statuses = {
    'aberto': 'Aberto',
    'em_andamento': 'Em Andamento',
    'resolvido': 'Resolvido',
    'fechado': 'Fechado'
  };
  return statuses[status] || status;
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

function showAlert(type, message) {
  // Implementar sistema de alertas global se necessário
  console.log(`[${type.toUpperCase()}] ${message}`);
}

// Exportar chamados para CSV
function exportTicketsToCSV() {
  if (!allTickets || allTickets.length === 0) {
    alert('Nenhum chamado para exportar');
    return;
  }

  const exportData = allTickets.map(ticket => ({
    'Número': ticket.ticket_number,
    'Solicitante': ticket.requester_name,
    'Email': ticket.requester_email,
    'Telefone': ticket.requester_phone || '',
    'Departamento': ticket.department,
    'Categoria': ticket.category,
    'Prioridade': ticket.priority.toUpperCase(),
    'Status': getStatusText(ticket.status),
    'Técnico': ticket.assigned_name || 'Não atribuído',
    'Criado em': formatDateTime(ticket.created_at),
    'Atualizado em': formatDateTime(ticket.updated_at)
  }));

  const filename = `chamados_${new Date().toISOString().split('T')[0]}.csv`;
  exportToCSV(exportData, filename);
  
  showNotification('Exportado', 'Chamados exportados com sucesso!');
}

// Fechar modal ao clicar fora
document.getElementById('ticketModal').addEventListener('click', (e) => {
  if (e.target.id === 'ticketModal') {
    closeTicketModal();
  }
});

console.log('✅ Dashboard carregado');
