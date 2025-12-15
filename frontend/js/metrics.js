// ========================================
// MÉTRICAS - PÁGINA DEDICADA
// ========================================

const API_URL = window.location.origin;
let currentUser = null;

// Verificar autenticação
const token = localStorage.getItem('token');
if (!token) {
  window.location.href = '/login.html';
}

// Inicializar
document.addEventListener('DOMContentLoaded', async () => {
  await loadUserData();
  await loadMetrics();
});

// Carregar dados do usuário
async function loadUserData() {
  try {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const data = await response.json();
      currentUser = data.user;
      
      // Atualizar UI
      document.getElementById('userName').textContent = currentUser.name;
      document.getElementById('userRole').textContent = getRoleText(currentUser.role);
      
      // Mostrar/ocultar menus baseado na role
      const usersNav = document.getElementById('usersNav');
      
      if (currentUser.role === 'AUXILIAR') {
        // Auxiliar não deveria estar aqui, mas se estiver, redireciona
        window.location.href = '/dashboard.html';
      } else if (currentUser.role === 'COORDENADOR') {
        if (usersNav) usersNav.style.display = 'none';
      }
      // DESENVOLVEDOR vê tudo
    } else {
      throw new Error('Não autorizado');
    }
  } catch (error) {
    console.error('Erro ao carregar usuário:', error);
    localStorage.clear();
    window.location.href = '/login.html';
  }
}

// Carregar métricas
async function loadMetrics() {
  try {
    // Buscar métricas do overview
    const response = await fetch(`${API_URL}/api/metrics/overview`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const data = await response.json();
      const metrics = data.metrics;

      // Atualizar cards principais
      document.getElementById('totalTickets').textContent = metrics.total || 0;
      document.getElementById('openTickets').textContent = metrics.byStatus?.aberto || 0;
      document.getElementById('inProgressTickets').textContent = metrics.byStatus?.em_andamento || 0;
      document.getElementById('resolvedTickets').textContent = metrics.byStatus?.resolvido || 0;

      // Estatísticas por categoria
      renderCategoryStats(metrics.byCategory);

      // Tempo médio de resolução
      const avgTime = metrics.avgResolutionTime || 0;
      document.getElementById('avgResolutionTime').innerHTML = `
        <div style="font-size: 36px; font-weight: bold; color: var(--primary);">
          ${avgTime.toFixed(1)}h
        </div>
        <div style="font-size: 14px; color: #6c757d; margin-top: 5px;">
          Tempo médio para resolver um chamado
        </div>
      `;

      // Estatísticas por técnico
      renderTechnicianStats(metrics.byTechnician);
    } else {
      showError('Erro ao carregar métricas');
    }
  } catch (error) {
    console.error('Erro ao carregar métricas:', error);
    showError('Erro ao conectar com o servidor');
  }
}

// Renderizar estatísticas por categoria
function renderCategoryStats(categories) {
  const container = document.getElementById('categoryStats');
  
  if (!categories || categories.length === 0) {
    container.innerHTML = '<p style="color: #6c757d;">Nenhum chamado registrado</p>';
    return;
  }

  const html = categories.map(cat => `
    <div style="display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #eee;">
      <span style="font-weight: 500;">${cat.category}</span>
      <span style="color: var(--primary); font-weight: bold;">${cat.count}</span>
    </div>
  `).join('');

  container.innerHTML = html;
}

// Renderizar estatísticas por técnico
function renderTechnicianStats(technicians) {
  const container = document.getElementById('technicianStats');
  
  if (!technicians || technicians.length === 0) {
    container.innerHTML = '<p style="color: #6c757d;">Nenhum técnico com chamados</p>';
    return;
  }

  const html = technicians.map(tech => `
    <div style="padding: 15px; border: 1px solid #eee; border-radius: 8px; margin-bottom: 10px;">
      <div style="font-weight: bold; margin-bottom: 8px;">${tech.name}</div>
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; font-size: 14px;">
        <div>
          <div style="color: #6c757d;">Total</div>
          <div style="font-weight: bold; color: var(--primary);">${tech.total}</div>
        </div>
        <div>
          <div style="color: #6c757d;">Abertos</div>
          <div style="font-weight: bold; color: #f0ad4e;">${tech.open}</div>
        </div>
        <div>
          <div style="color: #6c757d;">Em Andamento</div>
          <div style="font-weight: bold; color: #5bc0de;">${tech.in_progress}</div>
        </div>
        <div>
          <div style="color: #6c757d;">Resolvidos</div>
          <div style="font-weight: bold; color: #5cb85c;">${tech.resolved}</div>
        </div>
      </div>
    </div>
  `).join('');

  container.innerHTML = html;
}

// Mostrar erro
function showError(message) {
  const containers = ['categoryStats', 'avgResolutionTime', 'technicianStats'];
  containers.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = `<p style="color: #dc3545;">${message}</p>`;
  });
}

console.log('✅ Página de métricas carregada');
