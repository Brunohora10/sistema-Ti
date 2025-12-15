const transporter = require('../config/email');

// Template base de email
const emailTemplate = (title, content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .ticket-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
    .priority-badge { display: inline-block; padding: 5px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; }
    .priority-baixa { background: #d4edda; color: #155724; }
    .priority-media { background: #fff3cd; color: #856404; }
    .priority-alta { background: #f8d7da; color: #721c24; }
    .priority-urgente { background: #dc3545; color: white; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎫 Sistema de Chamados TI</h1>
      <p>${title}</p>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>Este é um email automático do Sistema de Chamados TI</p>
      <p>Não responda este email</p>
    </div>
  </div>
</body>
</html>
`;

// Email: Novo chamado criado
const sendNewTicketEmail = async (ticket, technicians) => {
  const priorityClass = `priority-${ticket.priority}`;
  const priorityText = {
    'baixa': 'Baixa',
    'media': 'Média',
    'alta': 'Alta',
    'urgente': 'URGENTE'
  }[ticket.priority];

  const content = `
    <h2>Novo Chamado Recebido</h2>
    <div class="ticket-info">
      <p><strong>Número do Chamado:</strong> #${ticket.ticket_number}</p>
      <p><strong>Solicitante:</strong> ${ticket.requester_name}</p>
      <p><strong>Email:</strong> ${ticket.requester_email}</p>
      <p><strong>Departamento:</strong> ${ticket.department}</p>
      <p><strong>Categoria:</strong> ${ticket.category}</p>
      <p><strong>Prioridade:</strong> <span class="priority-badge ${priorityClass}">${priorityText}</span></p>
      <p><strong>Assunto:</strong> ${ticket.subject}</p>
      <p><strong>Descrição:</strong></p>
      <p style="background: white; padding: 15px; border-radius: 5px;">${ticket.description}</p>
    </div>
    <a href="${process.env.APP_URL}/dashboard.html" class="button">Ver Chamado no Dashboard</a>
    <p style="margin-top: 20px; color: #666;">
      Este chamado foi criado em ${new Date(ticket.created_at).toLocaleString('pt-BR')}
    </p>
  `;

  // Enviar para todos os técnicos
  const emailPromises = technicians.map(tech => {
    return transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: tech.email,
      subject: `[Novo Chamado] #${ticket.ticket_number} - ${ticket.subject}`,
      html: emailTemplate('Novo Chamado Criado', content)
    });
  });

  try {
    await Promise.all(emailPromises);
    console.log(`📧 Email de novo chamado enviado para ${technicians.length} técnico(s)`);
  } catch (error) {
    console.error('❌ Erro ao enviar email de novo chamado:', error.message);
  }
};

// Email: Confirmação para o solicitante
const sendTicketConfirmationEmail = async (ticket) => {
  const content = `
    <h2>Seu Chamado foi Recebido!</h2>
    <p>Olá <strong>${ticket.requester_name}</strong>,</p>
    <p>Recebemos seu chamado e nossa equipe de TI já foi notificada.</p>
    <div class="ticket-info">
      <p><strong>Número do Chamado:</strong> #${ticket.ticket_number}</p>
      <p><strong>Assunto:</strong> ${ticket.subject}</p>
      <p><strong>Status:</strong> Aberto</p>
      <p><strong>Data de Abertura:</strong> ${new Date(ticket.created_at).toLocaleString('pt-BR')}</p>
    </div>
    <p>Guarde o número do chamado para acompanhamento. Você receberá atualizações por email.</p>
    <p style="margin-top: 20px;">
      <strong>Tempo estimado de resposta:</strong><br>
      ${ticket.priority === 'urgente' ? '⚡ Até 2 horas' : 
        ticket.priority === 'alta' ? '🔴 Até 4 horas' :
        ticket.priority === 'media' ? '🟡 Até 8 horas' : '🟢 Até 24 horas'}
    </p>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: ticket.requester_email,
      subject: `Chamado #${ticket.ticket_number} Recebido - ${ticket.subject}`,
      html: emailTemplate('Chamado Recebido com Sucesso', content)
    });
    console.log(`📧 Email de confirmação enviado para ${ticket.requester_email}`);
  } catch (error) {
    console.error('❌ Erro ao enviar email de confirmação:', error.message);
  }
};

// Email: Chamado atribuído a técnico
const sendAssignedTicketEmail = async (ticket, technician) => {
  const content = `
    <h2>Chamado Atribuído a Você</h2>
    <p>Olá <strong>${technician.name}</strong>,</p>
    <p>Um chamado foi atribuído a você:</p>
    <div class="ticket-info">
      <p><strong>Número:</strong> #${ticket.ticket_number}</p>
      <p><strong>Solicitante:</strong> ${ticket.requester_name} (${ticket.requester_email})</p>
      <p><strong>Assunto:</strong> ${ticket.subject}</p>
      <p><strong>Prioridade:</strong> <span class="priority-badge priority-${ticket.priority}">${ticket.priority.toUpperCase()}</span></p>
      <p><strong>Descrição:</strong></p>
      <p style="background: white; padding: 15px; border-radius: 5px;">${ticket.description}</p>
    </div>
    <a href="${process.env.APP_URL}/dashboard.html" class="button">Abrir Dashboard</a>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: technician.email,
      subject: `[Atribuído] Chamado #${ticket.ticket_number} - ${ticket.subject}`,
      html: emailTemplate('Chamado Atribuído', content)
    });
    console.log(`📧 Email de atribuição enviado para ${technician.email}`);
  } catch (error) {
    console.error('❌ Erro ao enviar email de atribuição:', error.message);
  }
};

// Email: Status atualizado
const sendStatusUpdateEmail = async (ticket, oldStatus, newStatus) => {
  const statusText = {
    'aberto': 'Aberto',
    'em_andamento': 'Em Andamento',
    'resolvido': 'Resolvido',
    'fechado': 'Fechado'
  };

  const content = `
    <h2>Status do Chamado Atualizado</h2>
    <p>Olá <strong>${ticket.requester_name}</strong>,</p>
    <p>O status do seu chamado foi atualizado:</p>
    <div class="ticket-info">
      <p><strong>Número:</strong> #${ticket.ticket_number}</p>
      <p><strong>Assunto:</strong> ${ticket.subject}</p>
      <p><strong>Status Anterior:</strong> ${statusText[oldStatus]}</p>
      <p><strong>Novo Status:</strong> <strong style="color: #667eea;">${statusText[newStatus]}</strong></p>
      ${newStatus === 'resolvido' ? '<p style="color: #28a745; font-weight: bold;">✅ Seu problema foi resolvido!</p>' : ''}
    </div>
    ${newStatus === 'resolvido' ? 
      '<p>Se o problema foi resolvido satisfatoriamente, o chamado será fechado automaticamente. Caso contrário, entre em contato conosco.</p>' : 
      '<p>Nossa equipe continua trabalhando no seu chamado.</p>'}
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: ticket.requester_email,
      subject: `[Atualização] Chamado #${ticket.ticket_number} - ${statusText[newStatus]}`,
      html: emailTemplate('Status Atualizado', content)
    });
    console.log(`📧 Email de atualização enviado para ${ticket.requester_email}`);
  } catch (error) {
    console.error('❌ Erro ao enviar email de atualização:', error.message);
  }
};

// Email: Novo comentário
const sendCommentEmail = async (ticket, comment, commenterName) => {
  const content = `
    <h2>Novo Comentário no Chamado</h2>
    <p>Olá <strong>${ticket.requester_name}</strong>,</p>
    <p>Um novo comentário foi adicionado ao seu chamado:</p>
    <div class="ticket-info">
      <p><strong>Número:</strong> #${ticket.ticket_number}</p>
      <p><strong>Assunto:</strong> ${ticket.subject}</p>
      <p><strong>Comentário de:</strong> ${commenterName}</p>
      <p><strong>Mensagem:</strong></p>
      <p style="background: white; padding: 15px; border-radius: 5px;">${comment}</p>
    </div>
    <a href="${process.env.APP_URL}/dashboard.html" class="button">Ver Chamado</a>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: ticket.requester_email,
      subject: `[Comentário] Chamado #${ticket.ticket_number}`,
      html: emailTemplate('Novo Comentário', content)
    });
    console.log(`📧 Email de comentário enviado para ${ticket.requester_email}`);
  } catch (error) {
    console.error('❌ Erro ao enviar email de comentário:', error.message);
  }
};

// Email: Recuperação de senha
const sendPasswordResetEmail = async (email, name, resetLink) => {
  const content = `
    <h2>Recuperação de Senha</h2>
    <p>Olá <strong>${name}</strong>,</p>
    <p>Recebemos uma solicitação para redefinir sua senha.</p>
    <p>Clique no botão abaixo para criar uma nova senha:</p>
    <a href="${resetLink}" class="button">Redefinir Senha</a>
    <p style="color: #666; margin-top: 20px;">
      Este link é válido por 1 hora.<br>
      Se você não solicitou esta recuperação, ignore este email.
    </p>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: '[Sistema TI] Recuperação de Senha',
      html: emailTemplate('Recuperação de Senha', content)
    });
    console.log(`📧 Email de recuperação enviado para ${email}`);
  } catch (error) {
    console.error('❌ Erro ao enviar email de recuperação:', error.message);
    throw error;
  }
};

module.exports = {
  sendNewTicketEmail,
  sendTicketConfirmationEmail,
  sendAssignedTicketEmail,
  sendStatusUpdateEmail,
  sendCommentEmail,
  sendPasswordResetEmail
};
