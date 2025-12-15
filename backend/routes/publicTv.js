const express = require('express');
const router = express.Router();
const { getAll, getOne } = require('../config/database');

// Snapshot público para TV (sem dados sensíveis)
router.get('/tv', async (req, res) => {
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
    res.status(500).json({ success: false, message: 'Erro ao carregar dados públicos', error: err.message });
  }
});

module.exports = router;
