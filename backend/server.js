require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

// Importar rotas
const authRoutes = require('./routes/auth');
const ticketRoutes = require('./routes/tickets');
const userRoutes = require('./routes/users');
const metricsRoutes = require('./routes/metrics');
const templateRoutes = require('./routes/templates');

// Importar middleware
const { authenticateToken } = require('./middleware/authMiddleware');

// Importar backup service
const { startBackupSchedule } = require('./utils/backupService');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../frontend/public')));
app.use('/css', express.static(path.join(__dirname, '../frontend/css')));
app.use('/js', express.static(path.join(__dirname, '../frontend/js')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Tornar io disponível para as rotas
app.set('io', io);

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/metrics', authenticateToken, metricsRoutes);
app.use('/api/templates', authenticateToken, templateRoutes);

// Rota raiz - redireciona para o portal do usuário
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

// Socket.io - Conexões em tempo real
io.on('connection', (socket) => {
  console.log('✅ Novo cliente conectado:', socket.id);

  // Entrar em sala específica (por usuário/técnico)
  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`👤 Usuário ${userId} entrou na sala`);
  });

  // Sair da sala
  socket.on('leave', (userId) => {
    socket.leave(`user_${userId}`);
    console.log(`👋 Usuário ${userId} saiu da sala`);
  });

  socket.on('disconnect', () => {
    console.log('❌ Cliente desconectado:', socket.id);
  });
});

// Middleware de erro
app.use((err, req, res, next) => {
  console.error('❌ Erro:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Rota 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada'
  });
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log('🚀 ========================================');
  console.log(`🎫 Sistema de Chamados TI`);
  console.log(`🌐 Servidor rodando em: http://localhost:${PORT}`);
  console.log(`📧 Email configurado: ${process.env.EMAIL_USER}`);
  console.log(`🗄️  Banco de dados: ${process.env.DB_PATH}`);
  console.log('🚀 ========================================');

  // Iniciar agendamento de backups
  startBackupSchedule();
});

// Exportar io para uso em outros módulos
module.exports = { io };
