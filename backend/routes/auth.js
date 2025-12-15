const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getOne } = require('../config/database');
const { authenticateToken } = require('../middleware/authMiddleware');

// POST /api/auth/login - Login de técnicos
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validação
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nome de usuário e senha são obrigatórios'
      });
    }

    // Buscar usuário por nome OU email
    const user = await getOne(
      'SELECT * FROM users WHERE LOWER(name) = ? AND active = 1',
      [username.toLowerCase()]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário ou senha incorretos'
      });
    }

    // Verificar senha
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Usuário ou senha incorretos'
      });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Retornar dados do usuário (sem senha)
    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

    console.log(`✅ Login: ${user.name} (${user.role})`);

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao realizar login'
    });
  }
});

// GET /api/auth/me - Obter dados do usuário logado
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (error) {
    console.error('Erro ao obter dados do usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter dados do usuário'
    });
  }
});

// POST /api/auth/change-password - Alterar senha
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validação
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Senha atual e nova senha são obrigatórias'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'A nova senha deve ter no mínimo 6 caracteres'
      });
    }

    // Buscar usuário com senha
    const user = await getOne(
      'SELECT * FROM users WHERE id = ?',
      [req.user.id]
    );

    // Verificar senha atual
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Senha atual incorreta'
      });
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar senha
    const { runQuery } = require('../config/database');
    await runQuery(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, req.user.id]
    );

    res.json({
      success: true,
      message: 'Senha alterada com sucesso'
    });

    console.log(`🔐 Senha alterada: ${req.user.name}`);

  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao alterar senha'
    });
  }
});

// POST /api/auth/forgot-password - Solicitar recuperação de senha
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email é obrigatório'
      });
    }

    // Buscar usuário
    const user = await getOne(
      'SELECT * FROM users WHERE LOWER(email) = ? AND active = 1',
      [email.toLowerCase()]
    );

    // Sempre retornar sucesso (segurança)
    if (!user) {
      return res.json({
        success: true,
        message: 'Se o email existir, você receberá um link de recuperação'
      });
    }

    // Gerar token temporário (válido por 1 hora)
    const resetToken = jwt.sign(
      { userId: user.id, type: 'password-reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Enviar email
    const emailService = require('../utils/emailService');
    const resetLink = `${req.protocol}://${req.get('host')}/reset-password.html?token=${resetToken}`;
    
    await emailService.sendPasswordResetEmail(user.email, user.name, resetLink);

    res.json({
      success: true,
      message: 'Se o email existir, você receberá um link de recuperação'
    });

    console.log(`🔐 Recuperação de senha solicitada: ${user.email}`);

  } catch (error) {
    console.error('Erro ao solicitar recuperação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar solicitação'
    });
  }
});

// POST /api/auth/reset-password - Redefinir senha com token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token e nova senha são obrigatórios'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'A senha deve ter no mínimo 6 caracteres'
      });
    }

    // Verificar token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.type !== 'password-reset') {
        throw new Error('Token inválido');
      }
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido ou expirado'
      });
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar senha
    const { runQuery } = require('../config/database');
    await runQuery(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, decoded.userId]
    );

    res.json({
      success: true,
      message: 'Senha redefinida com sucesso'
    });

    console.log(`🔐 Senha redefinida via token: ID ${decoded.userId}`);

  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao redefinir senha'
    });
  }
});

module.exports = router;
