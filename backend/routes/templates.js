const express = require('express');
const router = express.Router();
const { db, runQuery } = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

// GET: Listar todos os templates
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('📋 GET /api/templates - Usuário:', req.user?.id);
    
    const { category } = req.query;
    
    let query = 'SELECT * FROM response_templates WHERE 1=1';
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY category, title';

    db.all(query, params, (err, templates) => {
      if (err) {
        console.error('❌ Erro DB ao buscar templates:', err.message);
        return res.status(500).json({
          success: false,
          message: 'Erro ao buscar templates',
          error: err.message
        });
      }

      console.log('✅ Templates encontrados:', templates?.length || 0);
      res.json({
        success: true,
        templates: templates || [],
        count: (templates || []).length
      });
    });
  } catch (error) {
    console.error('❌ Erro no servidor GET /templates:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro no servidor',
      error: error.message
    });
  }
});

// GET: Obter template por ID
router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM response_templates WHERE id = ?', [id], (err, template) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar template',
        error: err.message
      });
    }

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template não encontrado'
      });
    }

    res.json({
      success: true,
      template
    });
  });
});

// POST: Criar novo template (COORDENADOR ou DESENVOLVEDOR)
router.post('/', authenticateToken, authorizeRole(['COORDENADOR', 'DESENVOLVEDOR']), (req, res) => {
  const { title, category, content } = req.body;
  const userId = req.user.id;

  if (!title || !category || !content) {
    return res.status(400).json({
      success: false,
      message: 'Título, categoria e conteúdo são obrigatórios'
    });
  }

  const query = `
    INSERT INTO response_templates (title, category, content, created_by)
    VALUES (?, ?, ?, ?)
  `;

  db.run(query, [title, category, content, userId], function(err) {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar template',
        error: err.message
      });
    }

    res.status(201).json({
      success: true,
      message: 'Template criado com sucesso',
      id: this.lastID
    });
  });
});

// PUT: Atualizar template
router.put('/:id', authenticateToken, authorizeRole(['COORDENADOR', 'DESENVOLVEDOR']), (req, res) => {
  const { id } = req.params;
  const { title, category, content } = req.body;

  if (!title || !category || !content) {
    return res.status(400).json({
      success: false,
      message: 'Título, categoria e conteúdo são obrigatórios'
    });
  }

  const query = `
    UPDATE response_templates
    SET title = ?, category = ?, content = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  db.run(query, [title, category, content, id], function(err) {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar template',
        error: err.message
      });
    }

    if (this.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Template não encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Template atualizado com sucesso'
    });
  });
});

// DELETE: Deletar template
router.delete('/:id', authenticateToken, authorizeRole(['COORDENADOR', 'DESENVOLVEDOR']), (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM response_templates WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao deletar template',
        error: err.message
      });
    }

    if (this.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Template não encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Template deletado com sucesso'
    });
  });
});

module.exports = router;
