// Abrir modal de templates
function openTemplatesModal(e) {
  if (e) e.preventDefault();
  document.getElementById('templatesModal').style.display = 'flex';
  document.getElementById('templatesForm').style.display = 'none';
  document.getElementById('templatesList').style.display = 'none';
  document.getElementById('templatesLoading').style.display = 'block';
  loadTemplates();
}

// Fechar modal de templates
function closeTemplatesModal() {
  document.getElementById('templatesModal').style.display = 'none';
  cancelTemplateForm();
}

// Mostrar formulário de novo template
function showNewTemplateForm() {
  document.getElementById('templateId').value = '';
  document.getElementById('templateTitle').value = '';
  document.getElementById('templateCategory').value = '';
  document.getElementById('templateContent').value = '';
  document.getElementById('templatesForm').style.display = 'block';
}

// Cancelar formulário
function cancelTemplateForm() {
  document.getElementById('templatesForm').style.display = 'none';
  document.getElementById('templateId').value = '';
  document.getElementById('templateTitle').value = '';
  document.getElementById('templateCategory').value = '';
  document.getElementById('templateContent').value = '';
}

// Carregar templates
async function loadTemplates() {
  try {
    const token = localStorage.getItem('token');
    console.log('🔍 Token presente:', !!token);
    
    const response = await fetch('/api/templates', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Response status:', response.status);
    console.log('📊 Response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro HTTP:', response.status, errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Dados recebidos:', data);
    
    const templates = data.templates || [];

    // Agrupar por categoria
    const grouped = {};
    templates.forEach(t => {
      if (!grouped[t.category]) grouped[t.category] = [];
      grouped[t.category].push(t);
    });

    // Renderizar templates
    let html = '';
    if (templates.length === 0) {
      html = '<div style="text-align: center; padding: 60px 30px; color: #999;"><p style="font-size: 1.2rem;">Nenhuma resposta criada.</p><p>Clique em "Nova Resposta" para começar! ➕</p></div>';
    } else {
      Object.entries(grouped).forEach(([category, items]) => {
        html += `<div style="margin-bottom: 30px;">`;
        html += `<h4 style="color: #667eea; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #667eea; font-size: 1.1rem;">📂 ${category.replace('_', ' ').toUpperCase()}</h4>`;
        items.forEach(template => {
          html += `
            <div style="background: white; border-left: 5px solid #667eea; padding: 18px; margin-bottom: 12px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); transition: all 0.3s ease;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div style="flex: 1;">
                  <h5 style="margin: 0 0 10px 0; color: #333; font-size: 1rem;">${template.title}</h5>
                  <p style="margin: 0 0 12px 0; color: #666; font-size: 0.9rem; white-space: pre-wrap; line-height: 1.5;">${escapeHtml(template.content)}</p>
                  <small style="color: #999; font-size: 0.85rem;">Criado em: ${new Date(template.created_at).toLocaleDateString('pt-BR')}</small>
                </div>
                <div style="margin-left: 15px; display: flex; gap: 8px;">
                  <button class="btn btn-sm btn-secondary" onclick="useTemplate(${template.id}, '${escapeHtml(template.content)}')" title="Usar resposta" style="padding: 8px 12px; font-size: 1.1rem; cursor: pointer;">📋</button>
                  <button class="btn btn-sm btn-warning" onclick="editTemplate(${template.id})" title="Editar" style="padding: 8px 12px; font-size: 1.1rem; cursor: pointer;">✏️</button>
                  <button class="btn btn-sm btn-danger" onclick="deleteTemplate(${template.id})" title="Deletar resposta" style="padding: 8px 12px; font-size: 1.1rem; cursor: pointer;">🗑️</button>
                </div>
              </div>
            </div>
          `;
        });
        html += `</div>`;
      });
    }

    document.getElementById('templatesLoading').style.display = 'none';
    document.getElementById('templatesList').innerHTML = html;
    document.getElementById('templatesList').style.display = 'block';

  } catch (error) {
    console.error('❌ Erro ao carregar templates:', error.message);
    document.getElementById('templatesLoading').style.display = 'none';
    document.getElementById('templatesList').innerHTML = `<div style="text-align: center; padding: 40px; color: #d63031;"><p style="font-size: 1.1rem;">❌ Erro ao carregar respostas</p><p style="color: #999; font-size: 0.9rem;">${error.message}</p></div>`;
    document.getElementById('templatesList').style.display = 'block';
  }
}

// Editar template
async function editTemplate(templateId) {
  try {
    const response = await fetch(`/api/templates/${templateId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) throw new Error('Erro ao carregar template');

    const data = await response.json();
    const template = data.template;

    document.getElementById('templateId').value = template.id;
    document.getElementById('templateTitle').value = template.title;
    document.getElementById('templateCategory').value = template.category;
    document.getElementById('templateContent').value = template.content;
    document.getElementById('templatesForm').style.display = 'block';

  } catch (error) {
    alert('Erro ao carregar template: ' + error.message);
  }
}

// Salvar template
async function saveTemplate() {
  const templateId = document.getElementById('templateId').value;
  const title = document.getElementById('templateTitle').value.trim();
  const category = document.getElementById('templateCategory').value.trim();
  const content = document.getElementById('templateContent').value.trim();

  if (!title || !category || !content) {
    alert('Preencha todos os campos');
    return;
  }

  try {
    const method = templateId ? 'PUT' : 'POST';
    const url = templateId ? `/api/templates/${templateId}` : '/api/templates';

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ title, category, content })
    });

    if (!response.ok) throw new Error('Erro ao salvar template');

    alert(templateId ? 'Resposta atualizada!' : 'Resposta criada!');
    cancelTemplateForm();
    loadTemplates();

  } catch (error) {
    alert('Erro ao salvar template: ' + error.message);
  }
}

// Deletar template
async function deleteTemplate(templateId) {
  if (!confirm('Tem certeza que deseja deletar esta resposta?')) return;

  try {
    const response = await fetch(`/api/templates/${templateId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) throw new Error('Erro ao deletar template');

    alert('Resposta deletada!');
    loadTemplates();

  } catch (error) {
    alert('Erro ao deletar template: ' + error.message);
  }
}

// Usar template (inserir no comentário)
function useTemplate(templateId, content) {
  // Se houver modal de detalhes aberto, insere no comentário
  const commentInput = document.querySelector('textarea[placeholder*="comentário"]');
  if (commentInput) {
    commentInput.value += '\n' + content;
    commentInput.focus();
    closeTemplatesModal();
    return;
  }

  // Caso contrário, copia para clipboard
  navigator.clipboard.writeText(content).then(() => {
    alert('✅ Template copiado para a área de transferência!');
  });
}

// Escapar HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
