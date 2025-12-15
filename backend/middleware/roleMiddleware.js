// Middleware para verificar permissões baseadas em roles

// Verificar se usuário tem uma das roles permitidas
const checkRole = (...allowedRoles) => {
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
        message: 'Você não tem permissão para acessar este recurso',
        requiredRole: allowedRoles,
        userRole: req.user.role
      });
    }

    next();
  };
};

// Apenas desenvolvedor (admin total)
const onlyDeveloper = checkRole('DESENVOLVEDOR');

// Desenvolvedor ou Coordenador (podem ver métricas)
const developerOrCoordinator = checkRole('DESENVOLVEDOR', 'COORDENADOR');

// Qualquer técnico autenticado
const anyTechnician = checkRole('DESENVOLVEDOR', 'COORDENADOR', 'AUXILIAR');

module.exports = {
  checkRole,
  onlyDeveloper,
  developerOrCoordinator,
  anyTechnician
};
