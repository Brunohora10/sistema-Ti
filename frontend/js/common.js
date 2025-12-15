// ========================================
// FUNÇÕES COMPARTILHADAS - COMUM A TODAS PÁGINAS
// ========================================

// Função auxiliar para texto da role
function getRoleText(role) {
  const roles = {
    'DESENVOLVEDOR': 'DESENVOLVEDOR',
    'COORDENADOR': 'COORDENADOR',
    'AUXILIAR': 'AUXILIAR'
  };
  return roles[role] || role;
}

// Função de logout
function logout() {
  if (confirm('Deseja realmente sair do sistema?')) {
    localStorage.clear();
    window.location.href = '/login.html';
  }
}

// Configurar visibilidade dos menus baseado na role
function setupMenuVisibility(userRole) {
  const metricsNav = document.getElementById('metricsNav');
  const usersNav = document.getElementById('usersNav');
  
  if (userRole === 'AUXILIAR') {
    // Auxiliar só vê chamados
    if (metricsNav) metricsNav.style.display = 'none';
    if (usersNav) usersNav.style.display = 'none';
  } else if (userRole === 'COORDENADOR') {
    // Coordenador vê chamados e métricas, mas não usuários
    if (usersNav) usersNav.style.display = 'none';
  }
  // DESENVOLVEDOR vê tudo - não precisa ocultar nada
}

// Função para mostrar alertas
function showAlert(type, message, containerId = 'alertContainer') {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type}`;
  alertDiv.style.cssText = `
    padding: 15px;
    margin-bottom: 20px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 10px;
    background: ${type === 'success' ? '#d4edda' : type === 'danger' ? '#f8d7da' : '#fff3cd'};
    color: ${type === 'success' ? '#155724' : type === 'danger' ? '#721c24' : '#856404'};
    border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'danger' ? '#f5c6cb' : '#ffeeba'};
  `;
  alertDiv.innerHTML = `
    <span>${type === 'success' ? '✅' : type === 'danger' ? '❌' : '⚠️'}</span>
    <span>${message}</span>
  `;
  
  container.innerHTML = '';
  container.appendChild(alertDiv);
  
  // Remover após 5 segundos
  setTimeout(() => {
    alertDiv.remove();
  }, 5000);
}

// Formatar data para exibição
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// Obter cor do badge de prioridade
function getPriorityBadge(priority) {
  const badges = {
    'urgente': { emoji: '🔴', color: '#dc3545', text: 'Urgente' },
    'alta': { emoji: '🟠', color: '#fd7e14', text: 'Alta' },
    'media': { emoji: '🟡', color: '#ffc107', text: 'Média' },
    'baixa': { emoji: '🟢', color: '#28a745', text: 'Baixa' }
  };
  return badges[priority] || { emoji: '⚪', color: '#6c757d', text: priority };
}

// Obter cor do badge de status
function getStatusBadge(status) {
  const badges = {
    'aberto': { emoji: '⏳', color: '#ffc107', text: 'Aberto' },
    'em_andamento': { emoji: '🔧', color: '#007bff', text: 'Em Andamento' },
    'resolvido': { emoji: '✅', color: '#28a745', text: 'Resolvido' },
    'fechado': { emoji: '🔒', color: '#6c757d', text: 'Fechado' }
  };
  return badges[status] || { emoji: '❓', color: '#6c757d', text: status };
}

console.log('✅ Funções compartilhadas carregadas');
