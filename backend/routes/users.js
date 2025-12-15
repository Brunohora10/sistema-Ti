const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { runQuery, getOne, getAll } = require('../config/database');
const { onlyDeveloper } = require('../middleware/roleMiddleware');

// GET /api/users - Listar todos os usuários (apenas desenvolvedor)
router.get('/', onlyDeveloper, async (req, res) => {
  try {
    const users = await getAll(`
      SELECT id, name, email, phone, role, active, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      users
    });

  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar usuários'
    });
  }
});

// GET /api/users/technicians - Listar técnicos ativos (todos autenticados podem ver)
router.get('/technicians', async (req, res) => {
  try {
    const technicians = await getAll(`
      SELECT id, name, email, phone, role
      FROM users
      WHERE active = 1
      ORDER BY name ASC
    `);

    res.json({
      success: true,
      technicians
    });

  } catch (error) {
    console.error('Erro ao listar técnicos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar técnicos'
    });
  }
});

// GET /api/users/:id - Obter detalhes de um usuário (apenas desenvolvedor)
router.get('/:id', onlyDeveloper, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await getOne(`
      SELECT id, name, email, phone, role, active, created_at, updated_at
      FROM users
      WHERE id = ?
    `, [id]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Buscar estatísticas do usuário
    const stats = await getOne(`
      SELECT 
        COUNT(*) as total_tickets,
        SUM(CASE WHEN status = 'resolvido' THEN 1 ELSE 0 END) as resolved_tickets,
        SUM(CASE WHEN status = 'em_andamento' THEN 1 ELSE 0 END) as in_progress_tickets
      FROM tickets
      WHERE assigned_to = ?
    `, [id]);

    res.json({
      success: true,
      user: {
        ...user,
        stats
      }
    });

  } catch (error) {
    console.error('Erro ao obter usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter usuário'
    });
  }
});

// POST /api/users - Criar novo usuário (apenas desenvolvedor)
router.post('/', onlyDeveloper, async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    // Validação (email é opcional)
    if (!name || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Nome, senha e função são obrigatórios'
      });
    }

    // Validar role
    const validRoles = ['DESENVOLVEDOR', 'COORDENADOR', 'AUXILIAR'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role inválida. Use: DESENVOLVEDOR, COORDENADOR ou AUXILIAR'
      });
    }

    // Validar senha
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'A senha deve ter no mínimo 6 caracteres'
      });
    }

    // Verificar se nome já existe (nome é único para login)
    const existingName = await getOne(
      'SELECT id FROM users WHERE LOWER(name) = ?',
      [name.toLowerCase()]
    );

    if (existingName) {
      return res.status(409).json({
        success: false,
        message: 'Este nome de usuário já está cadastrado'
      });
    }

    // Verificar se email já existe (se fornecido)
    if (email) {
      const existingEmail = await getOne(
        'SELECT id FROM users WHERE email = ?',
        [email.toLowerCase()]
      );

      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: 'Este email já está cadastrado'
        });
      }
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Preparar email/phone (null se vazio)
    const userEmail = email && email.trim() !== '' ? email.toLowerCase() : null;
    const userPhone = phone && phone.trim() !== '' ? phone.trim() : null;

    // Inserir usuário
    const result = await runQuery(`
      INSERT INTO users (name, email, phone, password, role)
      VALUES (?, ?, ?, ?, ?)
    `, [name, userEmail, userPhone, hashedPassword, role]);

    console.log(`✅ Usuário criado: ${name} (${role})`);

    // Buscar usuário criado
    const newUser = await getOne(
      'SELECT id, name, email, phone, role, active, created_at FROM users WHERE id = ?',
      [result.id]
    );

    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
      user: newUser
    });

    console.log(`✅ Novo usuário criado: ${name} (${role}) por ${req.user.name}`);

  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar usuário'
    });
  }
});

// PUT /api/users/:id - Atualizar usuário (apenas desenvolvedor)
router.put('/:id', onlyDeveloper, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role, active } = req.body;

    // Verificar se usuário existe
    const user = await getOne('SELECT * FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Não permitir desativar o próprio usuário
    if (id == req.user.id && active === 0) {
      return res.status(400).json({
        success: false,
        message: 'Você não pode desativar sua própria conta'
      });
    }

    const updates = [];
    const params = [];

    if (name) {
      updates.push('name = ?');
      params.push(name);
    }

    if (email !== undefined) {
      const emailNormalized = email && email.trim() !== '' ? email.toLowerCase() : null;
      if (emailNormalized) {
        // Verificar se email já existe em outro usuário
        const existingUser = await getOne(
          'SELECT id FROM users WHERE email = ? AND id != ?',
          [emailNormalized, id]
        );
        if (existingUser) {
          return res.status(409).json({
            success: false,
            message: 'Este email já está cadastrado'
          });
        }
      }
      updates.push('email = ?');
      params.push(emailNormalized);
    }

    if (phone !== undefined) {
      const phoneNormalized = phone && phone.trim() !== '' ? phone.trim() : null;
      updates.push('phone = ?');
      params.push(phoneNormalized);
    }

    if (role) {
      const roleUpper = role.toUpperCase();
      const validRoles = ['DESENVOLVEDOR', 'COORDENADOR', 'AUXILIAR'];
      if (!validRoles.includes(roleUpper)) {
        return res.status(400).json({
          success: false,
          message: 'Role inválida. Use: DESENVOLVEDOR, COORDENADOR ou AUXILIAR'
        });
      }
      updates.push('role = ?');
      params.push(roleUpper);
    }

    if (active !== undefined) {
      updates.push('active = ?');
      params.push(active ? 1 : 0);
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);

      await runQuery(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
    }

    // Buscar usuário atualizado
    const updatedUser = await getOne(
      'SELECT id, name, email, phone, role, active, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Usuário atualizado com sucesso',
      user: updatedUser
    });

    console.log(`✅ Usuário atualizado: ${updatedUser.name} por ${req.user.name}`);

  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar usuário'
    });
  }
});

// PUT /api/users/:id/reset-password - Resetar senha (apenas desenvolvedor)
router.put('/:id/reset-password', onlyDeveloper, async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Nova senha é obrigatória'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'A senha deve ter no mínimo 6 caracteres'
      });
    }

    // Verificar se usuário existe
    const user = await getOne('SELECT * FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar senha
    await runQuery(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, id]
    );

    res.json({
      success: true,
      message: 'Senha resetada com sucesso'
    });

    console.log(`🔐 Senha resetada para: ${user.name} por ${req.user.name}`);

  } catch (error) {
    console.error('Erro ao resetar senha:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao resetar senha'
    });
  }
});

// DELETE /api/users/:id - Deletar usuário (apenas desenvolvedor)
router.delete('/:id', onlyDeveloper, async (req, res) => {
  try {
    const { id } = req.params;

    // Não permitir deletar o próprio usuário
    if (id == req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Você não pode deletar sua própria conta'
      });
    }

    // Verificar se usuário existe
    const user = await getOne('SELECT * FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Verificar se usuário tem chamados atribuídos
    const assignedTickets = await getOne(
      'SELECT COUNT(*) as count FROM tickets WHERE assigned_to = ? AND status NOT IN ("resolvido", "fechado")',
      [id]
    );

    if (assignedTickets.count > 0) {
      return res.status(400).json({
        success: false,
        message: `Este usuário tem ${assignedTickets.count} chamado(s) ativo(s). Reatribua ou resolva os chamados antes de deletar.`
      });
    }

    // Deletar usuário
    await runQuery('DELETE FROM users WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Usuário deletado com sucesso'
    });

    console.log(`🗑️  Usuário deletado: ${user.name} por ${req.user.name}`);

  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar usuário'
    });
  }
});

module.exports = router;
