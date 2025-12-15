const express = require('express');
const router = express.Router();
const { getOne, getAll } = require('../config/database');
const { developerOrCoordinator } = require('../middleware/roleMiddleware');
const { authenticateToken } = require('../middleware/authMiddleware');

// Todas as rotas de métricas são acessíveis apenas por desenvolvedor e coordenador

// GET /api/metrics/tv - Painel TV (autenticado)
router.get('/tv', authenticateToken, async (req, res) => {
  try {
    const counts = {
      total: (await getOne('SELECT COUNT(*) as c FROM tickets')).c,
      aberto: (await getOne("SELECT COUNT(*) as c FROM tickets WHERE status='aberto'"))?.c || 0,
      em_andamento: (await getOne("SELECT COUNT(*) as c FROM tickets WHERE status='em_andamento'"))?.c || 0,
      resolvido: (await getOne("SELECT COUNT(*) as c FROM tickets WHERE status='resolvido'"))?.c || 0,
      fechado: (await getOne("SELECT COUNT(*) as c FROM tickets WHERE status='fechado'"))?.c || 0,
    };

    const byPriority = await getAll(`
      SELECT priority, COUNT(1) as count
      FROM tickets
      GROUP BY priority
    `);

    const byCategory = await getAll(`
      SELECT category, COUNT(1) as count
      FROM tickets
      GROUP BY category
      ORDER BY count DESC
      LIMIT 8
    `);

    const recent = await getAll(`
      SELECT id, ticket_number, subject, priority, status, created_at
      FROM tickets
      ORDER BY created_at DESC
      LIMIT 12
    `);

    const inProgress = await getAll(`
      SELECT t.id, t.ticket_number, t.subject, t.priority, t.status, t.created_at, t.department, u.name as assigned_name
      FROM tickets t
      LEFT JOIN users u ON u.id = t.assigned_to
      WHERE t.status = 'em_andamento'
      ORDER BY t.updated_at DESC, t.created_at DESC
      LIMIT 12
    `);

    const queue = await getAll(`
      SELECT t.id, t.ticket_number, t.subject, t.priority, t.status, t.created_at, t.department, u.name as assigned_name
      FROM tickets t
      LEFT JOIN users u ON u.id = t.assigned_to
      WHERE t.status = 'aberto'
      ORDER BY t.created_at ASC
      LIMIT 20
    `);

    res.json({ success: true, counts, byPriority, byCategory, recent, inProgress, queue });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro ao carregar dados TV', error: err.message });
  }
});

// GET /api/metrics/overview - Visão geral das métricas
router.get('/overview', developerOrCoordinator, async (req, res) => {
  try {
    // Total de chamados
    const totalTickets = await getOne('SELECT COUNT(*) as count FROM tickets');

    // Chamados por status
    const byStatus = await getAll(`
      SELECT status, COUNT(*) as count
      FROM tickets
      GROUP BY status
    `);

    // Chamados por prioridade
    const byPriority = await getAll(`
      SELECT priority, COUNT(*) as count
      FROM tickets
      GROUP BY priority
    `);

    // Chamados por categoria
    const byCategory = await getAll(`
      SELECT category, COUNT(*) as count
      FROM tickets
      GROUP BY category
      ORDER BY count DESC
    `);

    // Chamados abertos hoje
    const todayTickets = await getOne(`
      SELECT COUNT(*) as count
      FROM tickets
      WHERE DATE(created_at) = DATE('now')
    `);

    // Chamados resolvidos hoje
    const todayResolved = await getOne(`
      SELECT COUNT(*) as count
      FROM tickets
      WHERE DATE(resolved_at) = DATE('now')
    `);

    // Tempo médio de resolução (em horas)
    const avgResolutionTime = await getOne(`
      SELECT 
        AVG((julianday(resolved_at) - julianday(created_at)) * 24) as avg_hours
      FROM tickets
      WHERE resolved_at IS NOT NULL
    `);

    // Chamados por técnico
    const byTechnician = await getAll(`
      SELECT 
        u.id,
        u.name,
        COUNT(t.id) as total,
        SUM(CASE WHEN t.status = 'resolvido' THEN 1 ELSE 0 END) as resolved,
        SUM(CASE WHEN t.status = 'em_andamento' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN t.status = 'aberto' THEN 1 ELSE 0 END) as open
      FROM users u
      LEFT JOIN tickets t ON u.id = t.assigned_to
      WHERE u.active = 1
      GROUP BY u.id, u.name
      ORDER BY total DESC
    `);

    res.json({
      success: true,
      metrics: {
        total: totalTickets.count,
        byStatus: byStatus.reduce((acc, item) => {
          acc[item.status] = item.count;
          return acc;
        }, {}),
        byPriority: byPriority.reduce((acc, item) => {
          acc[item.priority] = item.count;
          return acc;
        }, {}),
        byCategory,
        today: {
          created: todayTickets.count,
          resolved: todayResolved.count
        },
        avgResolutionTime: avgResolutionTime.avg_hours ? 
          Math.round(avgResolutionTime.avg_hours * 10) / 10 : 0,
        byTechnician
      }
    });

  } catch (error) {
    console.error('Erro ao obter métricas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter métricas'
    });
  }
});

// GET /api/metrics/timeline - Chamados ao longo do tempo
router.get('/timeline', developerOrCoordinator, async (req, res) => {
  try {
    const { period = '7' } = req.query; // dias

    const timeline = await getAll(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'resolvido' THEN 1 ELSE 0 END) as resolved
      FROM tickets
      WHERE created_at >= DATE('now', '-${parseInt(period)} days')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    res.json({
      success: true,
      timeline
    });

  } catch (error) {
    console.error('Erro ao obter timeline:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter timeline'
    });
  }
});

// GET /api/metrics/technician/:id - Métricas de um técnico específico
router.get('/technician/:id', developerOrCoordinator, async (req, res) => {
  try {
    const { id } = req.params;
    const { period = '30' } = req.query; // dias

    // Informações do técnico
    const technician = await getOne(
      'SELECT id, name, email, role FROM users WHERE id = ?',
      [id]
    );

    if (!technician) {
      return res.status(404).json({
        success: false,
        message: 'Técnico não encontrado'
      });
    }

    // Total de chamados
    const total = await getOne(`
      SELECT COUNT(*) as count
      FROM tickets
      WHERE assigned_to = ?
    `, [id]);

    // Chamados por status
    const byStatus = await getAll(`
      SELECT status, COUNT(*) as count
      FROM tickets
      WHERE assigned_to = ?
      GROUP BY status
    `, [id]);

    // Chamados no período
    const inPeriod = await getOne(`
      SELECT COUNT(*) as count
      FROM tickets
      WHERE assigned_to = ?
      AND created_at >= DATE('now', '-${parseInt(period)} days')
    `, [id]);

    // Resolvidos no período
    const resolvedInPeriod = await getOne(`
      SELECT COUNT(*) as count
      FROM tickets
      WHERE assigned_to = ?
      AND resolved_at >= DATE('now', '-${parseInt(period)} days')
    `, [id]);

    // Tempo médio de resolução
    const avgTime = await getOne(`
      SELECT 
        AVG((julianday(resolved_at) - julianday(created_at)) * 24) as avg_hours
      FROM tickets
      WHERE assigned_to = ?
      AND resolved_at IS NOT NULL
    `, [id]);

    // Chamados por prioridade
    const byPriority = await getAll(`
      SELECT priority, COUNT(*) as count
      FROM tickets
      WHERE assigned_to = ?
      GROUP BY priority
    `, [id]);

    // Últimos chamados
    const recentTickets = await getAll(`
      SELECT 
        id, ticket_number, subject, status, priority, created_at, resolved_at
      FROM tickets
      WHERE assigned_to = ?
      ORDER BY created_at DESC
      LIMIT 10
    `, [id]);

    res.json({
      success: true,
      technician,
      metrics: {
        total: total.count,
        byStatus: byStatus.reduce((acc, item) => {
          acc[item.status] = item.count;
          return acc;
        }, {}),
        period: {
          days: parseInt(period),
          created: inPeriod.count,
          resolved: resolvedInPeriod.count
        },
        avgResolutionTime: avgTime.avg_hours ? 
          Math.round(avgTime.avg_hours * 10) / 10 : 0,
        byPriority: byPriority.reduce((acc, item) => {
          acc[item.priority] = item.count;
          return acc;
        }, {}),
        recentTickets
      }
    });

  } catch (error) {
    console.error('Erro ao obter métricas do técnico:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter métricas do técnico'
    });
  }
});

// GET /api/metrics/performance - Métricas de performance
router.get('/performance', developerOrCoordinator, async (req, res) => {
  try {
    // Taxa de resolução
    const resolutionRate = await getOne(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status IN ('resolvido', 'fechado') THEN 1 ELSE 0 END) as resolved
      FROM tickets
    `);

    const rate = resolutionRate.total > 0 ? 
      Math.round((resolutionRate.resolved / resolutionRate.total) * 100) : 0;

    // Chamados por tempo de resposta
    const responseTime = await getAll(`
      SELECT 
        CASE 
          WHEN (julianday(updated_at) - julianday(created_at)) * 24 <= 2 THEN '0-2h'
          WHEN (julianday(updated_at) - julianday(created_at)) * 24 <= 4 THEN '2-4h'
          WHEN (julianday(updated_at) - julianday(created_at)) * 24 <= 8 THEN '4-8h'
          WHEN (julianday(updated_at) - julianday(created_at)) * 24 <= 24 THEN '8-24h'
          ELSE '24h+'
        END as time_range,
        COUNT(*) as count
      FROM tickets
      WHERE status != 'aberto'
      GROUP BY time_range
    `);

    // SLA por prioridade (% dentro do prazo)
    const sla = await getAll(`
      SELECT 
        priority,
        COUNT(*) as total,
        SUM(CASE 
          WHEN priority = 'urgente' AND (julianday(resolved_at) - julianday(created_at)) * 24 <= 2 THEN 1
          WHEN priority = 'alta' AND (julianday(resolved_at) - julianday(created_at)) * 24 <= 4 THEN 1
          WHEN priority = 'media' AND (julianday(resolved_at) - julianday(created_at)) * 24 <= 8 THEN 1
          WHEN priority = 'baixa' AND (julianday(resolved_at) - julianday(created_at)) * 24 <= 24 THEN 1
          ELSE 0
        END) as within_sla
      FROM tickets
      WHERE resolved_at IS NOT NULL
      GROUP BY priority
    `);

    const slaByPriority = sla.reduce((acc, item) => {
      acc[item.priority] = item.total > 0 ? 
        Math.round((item.within_sla / item.total) * 100) : 0;
      return acc;
    }, {});

    res.json({
      success: true,
      performance: {
        resolutionRate: rate,
        responseTime,
        sla: slaByPriority
      }
    });

  } catch (error) {
    console.error('Erro ao obter métricas de performance:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter métricas de performance'
    });
  }
});

// GET /api/metrics/export - Exportar dados para relatório
router.get('/export', developerOrCoordinator, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let query = `
      SELECT 
        t.ticket_number,
        t.requester_name,
        t.requester_email,
        t.department,
        t.category,
        t.priority,
        t.subject,
        t.status,
        u.name as assigned_to,
        t.created_at,
        t.resolved_at,
        ROUND((julianday(COALESCE(t.resolved_at, 'now')) - julianday(t.created_at)) * 24, 2) as hours_to_resolve
      FROM tickets t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE 1=1
    `;

    const params = [];

    if (start_date) {
      query += ' AND DATE(t.created_at) >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND DATE(t.created_at) <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY t.created_at DESC';

    const tickets = await getAll(query, params);

    res.json({
      success: true,
      tickets,
      count: tickets.length,
      period: {
        start: start_date || 'início',
        end: end_date || 'hoje'
      }
    });

  } catch (error) {
    console.error('Erro ao exportar dados:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao exportar dados'
    });
  }
});

// GET /api/metrics/history - Histórico completo com filtros avançados para relatórios
router.get('/history', developerOrCoordinator, async (req, res) => {
  try {
    const { 
      start_date, 
      end_date, 
      status, 
      priority, 
      category, 
      technician, 
      department,
      limit = 1000 
    } = req.query;

    let query = `
      SELECT 
        t.id,
        t.ticket_number,
        t.requester_name,
        t.requester_email,
        t.requester_phone,
        t.department,
        t.category,
        t.priority,
        t.subject,
        t.description,
        t.status,
        u.name as assigned_to_name,
        t.created_at,
        t.updated_at,
        t.resolved_at,
        t.closed_at,
        ROUND((julianday(COALESCE(t.resolved_at, CASE WHEN t.status='resolvido' OR t.status='fechado' THEN 'now' ELSE NULL END)) - julianday(t.created_at)) * 24, 2) as hours_to_resolve
      FROM tickets t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE 1=1
    `;

    const params = [];

    if (start_date) {
      query += ' AND DATE(t.created_at) >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND DATE(t.created_at) <= ?';
      params.push(end_date);
    }

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

    if (technician) {
      query += ' AND t.assigned_to = ?';
      params.push(technician);
    }

    if (department) {
      query += ' AND t.department LIKE ?';
      params.push(`%${department}%`);
    }

    query += ' ORDER BY t.created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const tickets = await getAll(query, params);

    // Estatísticas do período filtrado
    let statsQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status='aberto' THEN 1 ELSE 0 END) as abertos,
        SUM(CASE WHEN status='em_andamento' THEN 1 ELSE 0 END) as em_andamento,
        SUM(CASE WHEN status='resolvido' THEN 1 ELSE 0 END) as resolvidos,
        SUM(CASE WHEN status='fechado' THEN 1 ELSE 0 END) as fechados,
        AVG(CASE WHEN resolved_at IS NOT NULL 
          THEN (julianday(resolved_at) - julianday(created_at)) * 24 
          ELSE NULL END) as avg_resolution_hours
      FROM tickets t
      WHERE 1=1
    `;

    const statsParams = [];
    if (start_date) {
      statsQuery += ' AND DATE(t.created_at) >= ?';
      statsParams.push(start_date);
    }
    if (end_date) {
      statsQuery += ' AND DATE(t.created_at) <= ?';
      statsParams.push(end_date);
    }
    if (status) {
      statsQuery += ' AND t.status = ?';
      statsParams.push(status);
    }
    if (priority) {
      statsQuery += ' AND t.priority = ?';
      statsParams.push(priority);
    }
    if (category) {
      statsQuery += ' AND t.category = ?';
      statsParams.push(category);
    }
    if (technician) {
      statsQuery += ' AND t.assigned_to = ?';
      statsParams.push(technician);
    }
    if (department) {
      statsQuery += ' AND t.department LIKE ?';
      statsParams.push(`%${department}%`);
    }

    const stats = await getOne(statsQuery, statsParams);

    res.json({
      success: true,
      tickets,
      stats: {
        total: stats.total || 0,
        abertos: stats.abertos || 0,
        em_andamento: stats.em_andamento || 0,
        resolvidos: stats.resolvidos || 0,
        fechados: stats.fechados || 0,
        avg_resolution_hours: stats.avg_resolution_hours ? Math.round(stats.avg_resolution_hours * 10) / 10 : 0
      },
      filters: {
        start_date: start_date || null,
        end_date: end_date || null,
        status: status || null,
        priority: priority || null,
        category: category || null,
        technician: technician || null,
        department: department || null
      }
    });

  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar histórico'
    });
  }
});

module.exports = router;
