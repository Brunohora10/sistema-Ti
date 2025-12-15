// ========================================
// USUÁRIOS - PÁGINA DEDICADA
// ========================================

const API_URL = window.location.origin;
let currentUser = null;

// Verificar autenticação
const token = localStorage.getItem('token');
if (!token) {
  window.location.href = '/login.html';
}

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

// Inicializar
document.addEventListener('DOMContentLoaded', async () => {
  await loadUserData();
  await loadUsers();
  setupCreateUserForm();
  
  // Aplicar máscara nos campos de telefone
  const phoneInputs = ['phone', 'editPhone'];
  phoneInputs.forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener('input', function() {
        applyPhoneMask(this);
      });
    }
  });
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
      
      console.log('Usuário carregado:', currentUser);
      console.log('Role do usuário:', currentUser.role);
      
      // Atualizar UI
      document.getElementById('userName').textContent = currentUser.name;
      document.getElementById('userRole').textContent = getRoleText(currentUser.role);
      
      // TEMPORÁRIO: Verificação de permissão desabilitada para debug
      // TODO: Reativar após confirmar que role está correta
      /*
      if (currentUser.role !== 'DESENVOLVEDOR') {
        console.log('Acesso negado - Role:', currentUser.role);
        alert('Acesso negado. Apenas desenvolvedores podem gerenciar usuários.');
        window.location.href = '/dashboard.html';
        return;
      }
      */
      
      console.log('✅ Página de usuários acessível (verificação temporariamente desabilitada)');
    } else {
      throw new Error('Não autorizado');
    }
  } catch (error) {
    console.error('Erro ao carregar usuário:', error);
    localStorage.clear();
    window.location.href = '/login.html';
  }
}

// Carregar lista de usuários
async function loadUsers() {
  try {
    const response = await fetch(`${API_URL}/api/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();
    const container = document.getElementById('usersList');

    if (data.success && data.users.length > 0) {
      const html = `
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
              <tr style="background: #f8f9fa; border-bottom: 2px solid #dee2e6;">
              <th style="padding: 12px; text-align: left;">Nome</th>
              <th style="padding: 12px; text-align: left;">Email</th>
              <th style="padding: 12px; text-align: left;">Contato</th>
              <th style="padding: 12px; text-align: center;">Função</th>
              <th style="padding: 12px; text-align: center;">Status</th>
              <th style="padding: 12px; text-align: center;">Ações</th>
            </tr>
          </thead>
          <tbody>
            ${data.users.map(user => `
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px; font-weight: 500;">${user.name}</td>
                <td style="padding: 12px; color: #6c757d;">${user.email || '—'}</td>
                <td style="padding: 12px; color: #6c757d;">${user.phone || '—'}</td>
                <td style="padding: 12px; text-align: center;">
                  <span style="padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; background: ${getRoleBadgeColor(user.role)}; color: white;">
                    ${user.role}
                  </span>
                </td>
                <td style="padding: 12px; text-align: center;">
                  <span style="padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; background: ${user.active ? '#5cb85c' : '#d9534f'}; color: white;">
                    ${user.active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td style="padding: 12px; text-align: center;">
                  <button onclick="openEditUser(${user.id})" class="btn btn-sm btn-secondary" style="font-size: 12px; margin-right:6px;">✏️ Editar</button>
                  <button onclick="toggleUserStatus(${user.id}, ${user.active})" 
                          class="btn btn-sm ${user.active ? 'btn-danger' : 'btn-success'}"
                          style="font-size: 12px;">
                    ${user.active ? '🚫 Desativar' : '✅ Ativar'}
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
      container.innerHTML = html;
    } else {
      container.innerHTML = '<p style="color: #6c757d; text-align: center; padding: 20px;">Nenhum usuário cadastrado</p>';
    }
  } catch (error) {
    console.error('Erro ao carregar usuários:', error);
    document.getElementById('usersList').innerHTML = '<p style="color: #dc3545;">Erro ao carregar usuários</p>';
  }
}

// Configurar formulário de criação
function setupCreateUserForm() {
  const form = document.getElementById('createUserForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Criando...';

    try {
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const phone = document.getElementById('phone').value.trim();
      const password = document.getElementById('password').value;
      const role = document.getElementById('role').value;

      if (!name || !password || !role) {
        alert('❌ Preencha nome de usuário, senha e função');
        submitBtn.disabled = false;
        submitBtn.textContent = '✅ Criar Usuário';
        return;
      }

      const body = {
        name: name,
        email: email || '',
        phone: phone || '',
        role: role,
        password: password,
      };

      const response = await fetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ Usuário criado com sucesso!');
        form.reset();
        await loadUsers();
      } else {
        alert('❌ Erro: ' + (data.message || 'Não foi possível criar o usuário'));
      }
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      alert('❌ Erro ao conectar com o servidor');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '✅ Criar Usuário';
    }
  });
}

// Abrir modal de edição e carregar dados do usuário
async function openEditUser(userId) {
  try {
    const modal = document.getElementById('editUserModal');
    const form = document.getElementById('editUserForm');
    const closeBtn = document.getElementById('closeEditModalBtn');
    const cancelBtn = document.getElementById('cancelEditBtn');

    // Buscar detalhes do usuário
    const resp = await fetch(`${API_URL}/api/users/${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await resp.json();
    if (!resp.ok || !data.success) throw new Error(data.message || 'Falha ao carregar usuário');

    const u = data.user;
    document.getElementById('editUserId').value = u.id;
    document.getElementById('editName').value = u.name || '';
    document.getElementById('editEmail').value = u.email || '';
    document.getElementById('editPhone').value = u.phone || '';
    document.getElementById('editRole').value = (u.role || '').toUpperCase();
    document.getElementById('editActive').checked = !!u.active;
    const newPassInput = document.getElementById('editNewPassword');
    const confirmInput = document.getElementById('editConfirmPassword');
    if (newPassInput) newPassInput.value = '';
    if (confirmInput) confirmInput.value = '';

    modal.style.display = 'flex';

    const closeModal = () => { modal.style.display = 'none'; };
    closeBtn.onclick = closeModal;
    cancelBtn.onclick = closeModal;

    form.onsubmit = async (e) => {
      e.preventDefault();
      const id = document.getElementById('editUserId').value;
      const body = {
        name: document.getElementById('editName').value.trim(),
        email: (document.getElementById('editEmail').value || '').trim(),
        phone: (document.getElementById('editPhone').value || '').trim(),
        role: document.getElementById('editRole').value,
        active: document.getElementById('editActive').checked
      };
      const newPassword = (document.getElementById('editNewPassword')?.value || '').trim();
      const confirmPassword = (document.getElementById('editConfirmPassword')?.value || '').trim();

      if (newPassword) {
        if (newPassword.length < 6) {
          alert('❌ A nova senha deve ter no mínimo 6 caracteres');
          return;
        }
        if (newPassword !== confirmPassword) {
          alert('❌ A confirmação de senha não confere');
          return;
        }
      }

      const saveBtn = form.querySelector('button[type="submit"]');
      saveBtn.disabled = true; saveBtn.textContent = 'Salvando...';
      try {
        const r = await fetch(`${API_URL}/api/users/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(body)
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.message || 'Erro ao salvar');
        // Se houver nova senha, chamar endpoint dedicado
        if (newPassword) {
          const rp = await fetch(`${API_URL}/api/users/${id}/reset-password`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ newPassword })
          });
          const rd = await rp.json();
          if (!rp.ok) throw new Error(rd.message || 'Erro ao redefinir senha');
        }
        closeModal();
        await loadUsers();
        alert('✅ Usuário atualizado com sucesso!');
      } catch (err) {
        console.error('Erro ao salvar usuário:', err);
        alert('❌ ' + err.message);
      } finally {
        saveBtn.disabled = false; saveBtn.textContent = 'Salvar';
      }
    };
  } catch (error) {
    console.error('Erro ao abrir edição:', error);
    alert('❌ Não foi possível carregar o usuário');
  }
}

// Ativar/desativar usuário
async function toggleUserStatus(userId, currentStatus) {
  const action = currentStatus ? 'desativar' : 'ativar';
  if (!confirm(`Deseja realmente ${action} este usuário?`)) return;

  try {
    const response = await fetch(`${API_URL}/api/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ active: !currentStatus })
    });

    if (response.ok) {
      alert(`✅ Usuário ${action === 'ativar' ? 'ativado' : 'desativado'} com sucesso!`);
      await loadUsers();
    } else {
      alert('❌ Erro ao atualizar status do usuário');
    }
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    alert('❌ Erro ao conectar com o servidor');
  }
}

// Função auxiliar para cor do badge da role
function getRoleBadgeColor(role) {
  const colors = {
    'DESENVOLVEDOR': '#d9534f',
    'COORDENADOR': '#f0ad4e',
    'AUXILIAR': '#5bc0de'
  };
  return colors[role] || '#6c757d';
}

console.log('✅ Página de usuários carregada');
