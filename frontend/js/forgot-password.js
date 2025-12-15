const API_URL = window.location.origin;
const form = document.getElementById('forgotForm');
const submitBtn = document.getElementById('submitBtn');
const btnText = document.getElementById('btnText');
const btnLoading = document.getElementById('btnLoading');
const alertContainer = document.getElementById('alertContainer');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  submitBtn.disabled = true;
  btnText.classList.add('hidden');
  btnLoading.classList.remove('hidden');
  alertContainer.innerHTML = '';

  try {
    const email = document.getElementById('email').value;

    const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await response.json();

    if (response.ok) {
      showAlert('success', '✅ Email enviado! Verifique sua caixa de entrada.');
      form.reset();
    } else {
      showAlert('danger', data.message || 'Erro ao enviar email');
    }
  } catch (error) {
    console.error('Erro:', error);
    showAlert('danger', 'Erro ao conectar com o servidor');
  } finally {
    submitBtn.disabled = false;
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
