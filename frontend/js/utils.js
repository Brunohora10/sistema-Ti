// ========================================
// UTILITÁRIOS GLOBAIS
// ========================================

// Modo Escuro
function toggleDarkMode() {
  const body = document.body;
  const isDark = body.classList.toggle('dark-mode');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  
  const icon = document.getElementById('themeIcon');
  if (icon) {
    icon.textContent = isDark ? '☀️' : '🌙';
  }
}

// Aplicar tema salvo
function applyStoredTheme() {
  const theme = localStorage.getItem('theme');
  if (theme === 'dark') {
    document.body.classList.add('dark-mode');
    const icon = document.getElementById('themeIcon');
    if (icon) icon.textContent = '☀️';
  }
}

// Aplicar ao carregar a página
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyStoredTheme);
} else {
  applyStoredTheme();
}

// Notificações Push do Navegador
async function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return Notification.permission === 'granted';
}

function showBrowserNotification(title, options = {}) {
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [200, 100, 200],
      ...options
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
      if (options.url) {
        window.location.href = options.url;
      }
    };

    // Fechar automaticamente após 10 segundos
    setTimeout(() => notification.close(), 10000);
  }
}

// Exportar dados para CSV
function exportToCSV(data, filename) {
  if (!data || data.length === 0) {
    alert('Nenhum dado para exportar');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header] || '';
        // Escapar vírgulas e aspas
        return typeof value === 'string' && (value.includes(',') || value.includes('"'))
          ? `"${value.replace(/"/g, '""')}"`
          : value;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Formatar data/hora
function formatDateTime(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleString('pt-BR');
}

function formatDate(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
}

// Escapar HTML
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Calcular SLA
function calculateSLA(priority, createdAt) {
  const created = new Date(createdAt);
  const now = new Date();
  const elapsed = (now - created) / (1000 * 60); // minutos

  const slaMinutes = {
    'urgente': 120,   // 2 horas
    'alta': 240,      // 4 horas
    'media': 480,     // 8 horas
    'baixa': 1440     // 24 horas
  };

  const limit = slaMinutes[priority] || 480;
  const remaining = limit - elapsed;
  const percentage = Math.max(0, Math.min(100, (elapsed / limit) * 100));

  return {
    elapsed: Math.floor(elapsed),
    remaining: Math.floor(remaining),
    limit,
    percentage: Math.floor(percentage),
    isOverdue: remaining < 0,
    isNearDeadline: remaining > 0 && remaining < (limit * 0.25)
  };
}

// Verificar se está atrasado
function isTicketOverdue(ticket) {
  if (ticket.status === 'resolvido' || ticket.status === 'fechado') {
    return false;
  }
  const sla = calculateSLA(ticket.priority, ticket.created_at);
  return sla.isOverdue;
}

// Cor do badge de SLA
function getSLABadgeClass(sla) {
  if (sla.isOverdue) return 'badge-danger';
  if (sla.isNearDeadline) return 'badge-warning';
  return 'badge-success';
}

// Som de notificação
function playNotificationSound() {
  const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBiWE0fPTgjMGHm7A7+OZRQ8TWrHn7qZUEw5No+PxwmwhBiKAzfPWhjUHH2i98eGcShENVbHm7adVFApHoe');
  audio.volume = 0.3;
  audio.play().catch(() => {}); // Ignorar erro se bloqueado pelo browser
}

console.log('✅ Utilitários globais carregados');
