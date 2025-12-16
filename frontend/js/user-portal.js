// ========================================
// PORTAL DO USUÁRIO - ABRIR CHAMADO
// ========================================

const API_URL = window.location.origin;

// Elementos do DOM
const form = document.getElementById('newTicketForm');
const submitBtn = document.getElementById('submitBtn');
const btnText = document.getElementById('btnText');
const btnLoading = document.getElementById('btnLoading');
const alertContainer = document.getElementById('alertContainer');
const ticketFormCard = document.getElementById('ticketForm');
const successMessageCard = document.getElementById('successMessage');
const ticketNumberSpan = document.getElementById('ticketNumber');

// Event Listener do formulário
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  await createTicket();
});

// Função para criar chamado
async function createTicket() {
  try {
    // Desabilitar botão e mostrar loading
    submitBtn.disabled = true;
    btnText.classList.add('hidden');
    btnLoading.classList.remove('hidden');
    
    // Limpar alertas anteriores
    alertContainer.innerHTML = '';

    // Preparar FormData (para suportar upload de arquivo)
    const formData = new FormData(form);

    // Fazer requisição
    const response = await fetch(`${API_URL}/api/tickets`, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Sucesso! Mostrar mensagem
      ticketNumberSpan.textContent = data.ticket.ticket_number;
      ticketFormCard.classList.add('hidden');
      successMessageCard.classList.remove('hidden');
      
      // Scroll para o topo
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Carregar lista de técnicos com contato
      try {
        const techResp = await fetch(`${API_URL}/api/users/technicians`);
        const techData = await techResp.json();
        const techList = document.getElementById('techList');
        const techListContent = document.getElementById('techListContent');
        if (techResp.ok && techData.success) {
          if (techData.technicians.length === 0) {
            techListContent.innerHTML = '<span style="color:#6c757d">Nenhum técnico disponível no momento.</span>';
          } else {
            techListContent.innerHTML = techData.technicians.map(t => `
              <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #eee;">
                <div>
                  <div style="font-weight:600;">${t.name}</div>
                  <div style="font-size:12px; color:#6c757d;">${t.role}</div>
                </div>
                <div style="text-align:right;">
                  <div style="color:#6c757d;">${t.phone ? `<a href="tel:${t.phone}" style="text-decoration:none;">${t.phone}</a>` : '—'}</div>
                  <div style="font-size:12px;">${t.email ? `<a href="mailto:${t.email}">${t.email}</a>` : ''}</div>
                </div>
              </div>
            `).join('');
          }
          techList.style.display = 'block';
        } else {
          techList.style.display = 'none';
        }
      } catch (e) {
        console.warn('Não foi possível carregar os técnicos:', e);
      }
      
    } else {
      // Erro
      showAlert('danger', data.message || 'Erro ao criar chamado. Tente novamente.');
      
      // Re-habilitar botão
      submitBtn.disabled = false;
      btnText.classList.remove('hidden');
      btnLoading.classList.add('hidden');
    }

  } catch (error) {
    console.error('Erro:', error);
    showAlert('danger', 'Erro ao conectar com o servidor. Verifique sua conexão e tente novamente.');
    
    // Re-habilitar botão
    submitBtn.disabled = false;
    btnText.classList.remove('hidden');
    btnLoading.classList.add('hidden');
  }
}

// Função para mostrar alertas
function showAlert(type, message) {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type}`;
  alertDiv.innerHTML = `
    <span>${type === 'success' ? '✅' : '❌'}</span>
    <span>${message}</span>
  `;
  
  alertContainer.innerHTML = '';
  alertContainer.appendChild(alertDiv);
  
  // Scroll para o alerta
  alertDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  
  // Remover após 5 segundos se for sucesso
  if (type === 'success') {
    setTimeout(() => {
      alertDiv.remove();
    }, 5000);
  }
}

// Validação em tempo real
document.getElementById('requester_email').addEventListener('blur', function() {
  const email = this.value;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (email && !emailRegex.test(email)) {
    this.style.borderColor = 'var(--danger)';
    showAlert('warning', 'Por favor, insira um email válido.');
  } else {
    this.style.borderColor = '';
    const warnings = alertContainer.querySelectorAll('.alert-warning');
    warnings.forEach(w => w.remove());
  }
});

// Validação de tamanho do arquivo
document.getElementById('attachment').addEventListener('change', function() {
  const file = this.files[0];
  
  if (file) {
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (file.size > maxSize) {
      this.value = '';
      showAlert('danger', 'O arquivo é muito grande. Tamanho máximo: 5MB');
    }
  }
});

// Máscara de telefone
function applyPhoneMask(input) {
  let value = input.value.replace(/\D/g, '').substring(0, 11);
  
  if (value.length === 0) {
    input.value = '';
    return;
  }
  
  if (value.length <= 10) {
    // Telefone fixo: (XX) XXXX-XXXX
    value = value.replace(/^(\d{2})(\d{0,4})(\d{0,4}).*/, function(match, p1, p2, p3) {
      let result = `(${p1}`;
      if (p2) result += `) ${p2}`;
      if (p3) result += `-${p3}`;
      return result;
    });
  } else {
    // Celular: (XX) XXXXX-XXXX
    value = value.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3');
  }
  
  input.value = value.trim();
}

const phoneInput = document.getElementById('requester_phone');
if (phoneInput) {
  phoneInput.addEventListener('input', function() {
    applyPhoneMask(this);
  });
  phoneInput.addEventListener('blur', function() {
    const digits = this.value.replace(/\D/g, '');
    if (digits.length > 0 && digits.length < 10) {
      this.setCustomValidity('Telefone deve ter pelo menos 10 dígitos');
    } else {
      this.setCustomValidity('');
    }
  });
}

// Informações sobre prioridade - REMOVIDO
// document.getElementById('priority').addEventListener('change', function() {
//   const priority = this.value;
//   const descriptions = {
//     'baixa': '🟢 Tempo de resposta: até 24 horas',
//     'media': '🟡 Tempo de resposta: até 8 horas',
//     'alta': '🟠 Tempo de resposta: até 4 horas',
//     'urgente': '🔴 Tempo de resposta: até 2 horas'
//   };
//   
//   // Criar ou atualizar descrição
//   let desc = this.parentElement.querySelector('.priority-desc');
//   if (!desc) {
//     desc = document.createElement('small');
//     desc.className = 'priority-desc';
//     desc.style.cssText = 'display: block; margin-top: 5px; font-weight: 600;';
//     this.parentElement.appendChild(desc);
//   }
//   
//   if (priority && descriptions[priority]) {
//     desc.textContent = descriptions[priority];
//     desc.style.color = priority === 'urgente' ? 'var(--danger)' : 
//                        priority === 'alta' ? 'var(--warning)' : 
//                        'var(--success)';
//   } else {
//     desc.textContent = '';
//   }
// });

console.log('✅ Portal do Usuário carregado');
