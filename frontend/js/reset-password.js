const API_URL = window.location.origin;
const form = document.getElementById('resetForm');
const submitBtn = document.getElementById('submitBtn');
const btnText = document.getElementById('btnText');
const btnLoading = document.getElementById('btnLoading');
const alertContainer = document.getElementById('alertContainer');

// Extrair token da URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

if (!token) {
  showAlert('danger', 'Token inválido ou expirado');
  submitBtn.disabled = true;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (password !== confirmPassword) {
    showAlert('danger', 'As senhas não conferem');
    return;
  }

  submitBtn.disabled = true;
  btnText.classList.add('hidden');
  btnLoading.classList.remove('hidden');
  alertContainer.innerHTML = '';

  try {
    const response = await fetch(`${API_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword: password })
    });

    const data = await response.json();

    if (response.ok) {
      showAlert('success', '✅ Senha redefinida com sucesso!');
      form.reset();
      setTimeout(() => {
        window.location.href = '/login.html';
      }, 2000);
    } else {
      showAlert('danger', data.message || 'Erro ao redefinir senha');
      submitBtn.disabled = false;
    }
  } catch (error) {
    console.error('Erro:', error);
    showAlert('danger', 'Erro ao conectar com o servidor');
    submitBtn.disabled = false;
  } finally {
    btnText.classList.remove('hidden');
    btnLoading.classList.add('hidden');
  }
});

function showAlert(type, message) {
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.innerHTML = `<span>${message}</span>`;
  alertContainer.appendChild(alert);
}
