

const nodemailer = require('nodemailer');

// Configurar transporter do Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true para 465, false para outras portas
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verificação opcional (não bloqueia o servidor)
try {
  transporter.verify().then(() => {
    console.log('✅ Servidor de email pronto para enviar mensagens');
  }).catch((error) => {
    console.log('⚠️  Email desativado ou inválido:', error.message);
    console.log('📧 Configure EMAIL_USER/EMAIL_PASS no .env para habilitar notificações');
  });
} catch (error) {
  console.log('⚠️  Falha ao verificar email (ignorado):', error.message);
}

module.exports = transporter;
