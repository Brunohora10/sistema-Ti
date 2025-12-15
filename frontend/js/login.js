// ========================================
// LOGIN - AUTENTICAÇÃO DE TÉCNICOS
// ========================================

const API_URL = window.location.origin;

// Elementos do DOM
const loginForm = document.getElementById('loginForm');
const loginBtn = document.getElementById('loginBtn');
const btnText = document.getElementById('btnText');
const btnLoading = document.getElementById('btnLoading');
const alertContainer = document.getElementById('alertContainer');
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');

// Verificar se já está logado
if (localStorage.getItem('token')) {
  window.location.href = '/dashboard.html';
}

// Toggle mostrar/ocultar senha
togglePassword.addEventListener('click', () => {
  const type = passwordInput.type === 'password' ? 'text' : 'password';
  passwordInput.type = type;
  togglePassword.textContent = type === 'password' ? '👁️' : '🙈';
});

// Event Listener do formulário
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  await login();
});

// Função de login
async function login() {
  try {
    // Desabilitar botão e mostrar loading
    loginBtn.disabled = true;
    btnText.classList.add('hidden');
    btnLoading.classList.remove('hidden');
    
    // Limpar alertas anteriores
    alertContainer.innerHTML = '';

    // Obter dados do formulário
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    // Validação básica
    if (!username || !password) {
      showAlert('danger', 'Por favor, preencha nome de usuário e senha.');
      resetButton();
      return;
    }

    // Fazer requisição de login
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Login bem-sucedido!
      showAlert('success', `Bem-vindo, ${data.user.name}! Redirecionando...`);
      
      // Salvar token e dados do usuário
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Redirecionar para o dashboard após 1 segundo
      setTimeout(() => {
        window.location.href = '/dashboard.html';
      }, 1000);
      
    } else {
      // Erro no login
      showAlert('danger', data.message || 'Usuário ou senha incorretos.');
      resetButton();
    }

  } catch (error) {
    console.error('Erro no login:', error);
    showAlert('danger', 'Erro ao conectar com o servidor. Verifique sua conexão e tente novamente.');
    resetButton();
  }
}

// Função para resetar o botão
function resetButton() {
  loginBtn.disabled = false;
  btnText.classList.remove('hidden');
  btnLoading.classList.add('hidden');
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
  
  // Remover após 5 segundos
  setTimeout(() => {
    alertDiv.remove();
  }, 5000);
}

// Enter para submeter
document.getElementById('password').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    loginForm.dispatchEvent(new Event('submit'));
  }
});

// Focar no campo de email ao carregar
document.getElementById('username').focus();

console.log('✅ Página de login carregada');
