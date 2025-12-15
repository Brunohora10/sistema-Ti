const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { runQuery, getOne, getAll } = require('../config/database');
const { authenticateToken } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');
const emailService = require('../utils/emailService');

// Configurar upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|mkv|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido'));
    }
  }
});

// Função para gerar número único do chamado
function generateTicketNumber() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `TI${timestamp}${random}`;
}

// GET /api/tickets/track - Rastrear chamado (público - sem auth)
router.get('/track', async (req, res) => {
  try {
    const { ticket_number, email } = req.query;

    if (!ticket_number && !email) {
      return res.status(400).json({
        success: false,
        message: 'Informe o número do chamado ou email'
      });
    }

    let query = `
      SELECT t.*, u.name as assigned_name
      FROM tickets t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE 1=1
    `;
    const params = [];

    if (ticket_number) {
      query += ' AND t.ticket_number LIKE ?';
      params.push(`%${ticket_number}%`);
    }

    if (email) {
      query += ' AND LOWER(t.requester_email) = LOWER(?)';
      params.push(email);
    }

    query += ' ORDER BY t.created_at DESC LIMIT 10';

    const tickets = await getAll(query, params);

    // Para cada ticket, buscar comentários públicos
    for (const ticket of tickets) {
      const comments = await getAll(`
        SELECT c.*, u.name as user_name
        FROM comments c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.ticket_id = ? AND c.is_internal = 0
        ORDER BY c.created_at ASC
      `, [ticket.id]);
      ticket.comments = comments;
    }

    res.json({
      success: true,
      tickets
    });

  } catch (error) {
    console.error('Erro ao rastrear chamado:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar chamado'
    });
  }
});

// POST /api/tickets - Criar novo chamado (público)
router.post('/', upload.single('attachment'), async (req, res) => {
  try {
    const {
      requester_name,
      requester_email,
      requester_phone,
      department,
      category,
      priority,
      subject,
      description
    } = req.body;

    // Validação
    if (!requester_name || !requester_email || !requester_phone || !department || !category || !priority || !description) {
      return res.status(400).json({
        success: false,
        message: 'Todos os campos são obrigatórios'
      });
    }

    // Gerar subject automaticamente se não fornecido (primeiras palavras da descrição)
    const autoSubject = subject || description.substring(0, 80).trim() + (description.length > 80 ? '...' : '');

    // Gerar número do chamado
    const ticketNumber = generateTicketNumber();

    // Caminho do anexo (se houver)
    const attachment = req.file ? req.file.filename : null;

    // Inserir chamado
    const result = await runQuery(`
      INSERT INTO tickets (
        ticket_number, requester_name, requester_email, requester_phone, department,
        category, priority, subject, description, attachment, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'aberto')
    `, [
      ticketNumber,
      requester_name,
      requester_email.toLowerCase(),
      requester_phone.trim(),
      department,
      category,
      priority,
      autoSubject,
      description,
      attachment
    ]);

    // Buscar chamado criado
    const ticket = await getOne(
      'SELECT * FROM tickets WHERE id = ?',
      [result.id]
    );

    // Buscar todos os técnicos ativos para notificar
    const technicians = await getAll(
      'SELECT id, name, email FROM users WHERE active = 1'
    );

    // Enviar emails (não bloqueia a resposta)
    Promise.all([
      emailService.sendTicketConfirmationEmail(ticket),
      emailService.sendNewTicketEmail(ticket, technicians)
    ]).catch(err => console.error('Erro ao enviar emails:', err));

    // Emitir evento Socket.io para atualização em tempo real
    const io = req.app.get('io');
    io.emit('new_ticket', ticket);

    res.status(201).json({
      success: true,
      message: 'Chamado criado com sucesso',
      ticket: {
        id: ticket.id,
        ticket_number: ticket.ticket_number,
        status: ticket.status,
        created_at: ticket.created_at
      }
    });

    console.log(`✅ Novo chamado criado: #${ticketNumber} - ${subject}`);

  } catch (error) {
    console.error('Erro ao criar chamado:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar chamado'
    });
  }
});

// GET /api/tickets - Listar chamados (autenticado)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, priority, category, assigned_to, search } = req.query;
    const user = req.user;

    let query = `
      SELECT t.*, u.name as assigned_name
      FROM tickets t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE 1=1
    `;
    const params = [];

    // Auxiliar só vê chamados atribuídos a ele
    if (user.role === 'AUXILIAR') {
      query += ' AND t.assigned_to = ?';
      params.push(user.id);
    }

    // Filtros
    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }
    if (priority) {
      query += ' AND t.priority = ?';
      params.push(priority);
    }
    if (category) {
      query += ' AND t.category = ?';
      params.push(category);
    }
    if (assigned_to) {
      query += ' AND t.assigned_to = ?';
      params.push(assigned_to);
    }
    if (search) {
      query += ' AND (t.ticket_number LIKE ? OR t.subject LIKE ? OR t.requester_name LIKE ? OR t.requester_phone LIKE ? OR t.department LIKE ? OR t.requester_email LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY t.created_at DESC';

    const tickets = await getAll(query, params);

    res.json({
      success: true,
      tickets,
      count: tickets.length
    });

  } catch (error) {
    console.error('Erro ao listar chamados:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar chamados'
    });
  }
});

// GET /api/tickets/:id - Obter detalhes de um chamado
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // Buscar chamado
    const ticket = await getOne(`
      SELECT t.*, u.name as assigned_name, u.email as assigned_email
      FROM tickets t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.id = ?
    `, [id]);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Chamado não encontrado'
      });
    }

    // Auxiliar só pode ver seus próprios chamados
    if (user.role === 'AUXILIAR' && ticket.assigned_to !== user.id) {
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para ver este chamado'
      });
    }

    // Buscar comentários
    const comments = await getAll(`
      SELECT c.*, u.name as user_name
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.ticket_id = ?
      ORDER BY c.created_at ASC
    `, [id]);

    // Buscar histórico de status
    const history = await getAll(`
      SELECT h.*, u.name as user_name
      FROM status_history h
      LEFT JOIN users u ON h.user_id = u.id
      WHERE h.ticket_id = ?
      ORDER BY h.created_at DESC
    `, [id]);

    res.json({
      success: true,
      ticket,
      comments,
      history
    });

  } catch (error) {
    console.error('Erro ao obter chamado:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter chamado'
    });
  }
});

// PUT /api/tickets/:id - Atualizar chamado
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, assigned_to } = req.body;
    const user = req.user;

    // Buscar chamado atual
    const ticket = await getOne('SELECT * FROM tickets WHERE id = ?', [id]);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Chamado não encontrado'
      });
    }

    // Auxiliar só pode atualizar seus próprios chamados
    if (user.role === 'AUXILIAR' && ticket.assigned_to !== user.id) {
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para atualizar este chamado'
      });
    }

    const updates = [];
    const params = [];

    if (status && status !== ticket.status) {
      updates.push('status = ?');
      params.push(status);

      // Registrar mudança de status
      await runQuery(`
        INSERT INTO status_history (ticket_id, user_id, old_status, new_status)
        VALUES (?, ?, ?, ?)
      `, [id, user.id, ticket.status, status]);

      // Se resolvido, registrar data
      if (status === 'resolvido' || status === 'fechado') {
        updates.push('resolved_at = CURRENT_TIMESTAMP');
      }

      // Enviar email de atualização
      emailService.sendStatusUpdateEmail(ticket, ticket.status, status)
        .catch(err => console.error('Erro ao enviar email:', err));
    }

    if (priority && priority !== ticket.priority) {
      updates.push('priority = ?');
      params.push(priority);
    }

    if (assigned_to !== undefined) {
      updates.push('assigned_to = ?');
      params.push(assigned_to || null);

      // Se atribuído a alguém, enviar email
      if (assigned_to) {
        const technician = await getOne(
          'SELECT * FROM users WHERE id = ?',
          [assigned_to]
        );
        if (technician) {
          emailService.sendAssignedTicketEmail(ticket, technician)
            .catch(err => console.error('Erro ao enviar email:', err));
        }
      }
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);

      await runQuery(
        `UPDATE tickets SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
    }

    // Buscar chamado atualizado
    const updatedTicket = await getOne(`
      SELECT t.*, u.name as assigned_name
      FROM tickets t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.id = ?
    `, [id]);

    // Emitir evento Socket.io
    const io = req.app.get('io');
    io.emit('ticket_updated', updatedTicket);

    res.json({
      success: true,
      message: 'Chamado atualizado com sucesso',
      ticket: updatedTicket
    });

    console.log(`✅ Chamado atualizado: #${ticket.ticket_number} por ${user.name}`);

  } catch (error) {
    console.error('Erro ao atualizar chamado:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar chamado'
    });
  }
});

// POST /api/tickets/:id/comments - Adicionar comentário
router.post('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, is_internal } = req.body;
    const user = req.user;

    if (!comment) {
      return res.status(400).json({
        success: false,
        message: 'Comentário é obrigatório'
      });
    }

    // Buscar chamado
    const ticket = await getOne('SELECT * FROM tickets WHERE id = ?', [id]);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Chamado não encontrado'
      });
    }

    // Inserir comentário
    await runQuery(`
      INSERT INTO comments (ticket_id, user_id, comment, is_internal)
      VALUES (?, ?, ?, ?)
    `, [id, user.id, comment, is_internal ? 1 : 0]);

    // Se não for interno, enviar email para o solicitante
    if (!is_internal) {
      emailService.sendCommentEmail(ticket, comment, user.name)
        .catch(err => console.error('Erro ao enviar email:', err));
    }

    // Emitir evento Socket.io
    const io = req.app.get('io');
    io.emit('comment_added', { ticket_id: id, user_name: user.name });

    res.json({
      success: true,
      message: 'Comentário adicionado com sucesso'
    });

    console.log(`💬 Comentário adicionado ao chamado #${ticket.ticket_number} por ${user.name}`);

  } catch (error) {
    console.error('Erro ao adicionar comentário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao adicionar comentário'
    });
  }
});

// DELETE /api/tickets/:id - Deletar chamado (apenas desenvolvedor)
router.delete('/:id', authenticateToken, checkRole('desenvolvedor'), async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await getOne('SELECT * FROM tickets WHERE id = ?', [id]);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Chamado não encontrado'
      });
    }

    // Deletar anexo se existir
    if (ticket.attachment) {
      const filePath = path.join(__dirname, '../../uploads', ticket.attachment);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Deletar chamado (cascade deleta comentários e histórico)
    await runQuery('DELETE FROM tickets WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Chamado deletado com sucesso'
    });

    console.log(`🗑️  Chamado deletado: #${ticket.ticket_number}`);

  } catch (error) {
    console.error('Erro ao deletar chamado:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar chamado'
    });
  }
});

module.exports = router;
