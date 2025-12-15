const jwt = require('jsonwebtoken');
const { getOne } = require('../config/database');

// Middleware para verificar token JWT
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticação não fornecido'
      });
    }

    // Verificar token
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({
          success: false,
          message: 'Token inválido ou expirado'
        });
      }

      // Buscar usuário no banco
      const user = await getOne(
        'SELECT id, name, email, role, active FROM users WHERE id = ?',
        [decoded.userId]
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      if (!user.active) {
        return res.status(403).json({
          success: false,
          message: 'Usuário inativo'
        });
      }

      // Adicionar usuário ao request
      req.user = user;
      next();
    });
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar autenticação'
    });
  }
};

// Middleware para verificar role/permissões
const authorizeRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Permissão negada. Acesso exclusivo para: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

module.exports = { authenticateToken, authorizeRole };
