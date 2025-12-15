require('dotenv').config();
const bcrypt = require('bcryptjs');
const { db, runQuery } = require('./database');

async function initDatabase() {
  console.log('🔧 Inicializando banco de dados...\n');

  try {
    // Criar tabela de usuários (técnicos)
    await runQuery(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        phone TEXT,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('DESENVOLVEDOR', 'COORDENADOR', 'AUXILIAR')),
        active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabela "users" criada');

    // Criar tabela de chamados
    await runQuery(`
      CREATE TABLE IF NOT EXISTS tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticket_number TEXT UNIQUE NOT NULL,
        requester_name TEXT NOT NULL,
        requester_email TEXT NOT NULL,
        requester_phone TEXT,
        department TEXT NOT NULL,
        category TEXT NOT NULL,
        priority TEXT NOT NULL CHECK(priority IN ('baixa', 'media', 'alta', 'urgente')),
        subject TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT DEFAULT 'aberto' CHECK(status IN ('aberto', 'em_andamento', 'resolvido', 'fechado')),
        assigned_to INTEGER,
        attachment TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        resolved_at DATETIME,
        FOREIGN KEY (assigned_to) REFERENCES users(id)
      )
    `);
    console.log('✅ Tabela "tickets" criada');

    // Criar tabela de comentários
    await runQuery(`
      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticket_id INTEGER NOT NULL,
        user_id INTEGER,
        comment TEXT NOT NULL,
        is_internal INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    console.log('✅ Tabela "comments" criada');

    // Criar tabela de histórico de status
    await runQuery(`
      CREATE TABLE IF NOT EXISTS status_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticket_id INTEGER NOT NULL,
        user_id INTEGER,
        old_status TEXT,
        new_status TEXT NOT NULL,
        comment TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    console.log('✅ Tabela "status_history" criada');

    // Criar índices para melhor performance
    await runQuery('CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status)');
    await runQuery('CREATE INDEX IF NOT EXISTS idx_tickets_assigned ON tickets(assigned_to)');
    await runQuery('CREATE INDEX IF NOT EXISTS idx_tickets_created ON tickets(created_at)');
    await runQuery('CREATE INDEX IF NOT EXISTS idx_comments_ticket ON comments(ticket_id)');
    console.log('✅ Índices criados');

    // Criar tabela de templates de resposta
    await runQuery(`
      CREATE TABLE IF NOT EXISTS response_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        content TEXT NOT NULL,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);
    console.log('✅ Tabela "response_templates" criada');

    // Inserir modelos padrão se não houver nenhum
    const existingTemplates = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(1) as count FROM response_templates', [], (err, row) => {
        if (err) reject(err);
        else resolve(row?.count || 0);
      });
    });

    if (existingTemplates === 0) {
      await runQuery(
        'INSERT INTO response_templates (title, category, content) VALUES (?, ?, ?)',
        ['Problema Resolvido', 'resolvido', 'Identificamos o problema e realizamos a correção. Qualquer dúvida, estamos à disposição.']
      );
      await runQuery(
        'INSERT INTO response_templates (title, category, content) VALUES (?, ?, ?)',
        ['Aguardando Usuário', 'aguardando', 'Estamos aguardando seu retorno para prosseguir com o atendimento. Por favor, responda esta mensagem.']
      );
      await runQuery(
        'INSERT INTO response_templates (title, category, content) VALUES (?, ?, ?)',
        ['Escalação de Chamado', 'escalacao', 'Encaminhamos seu chamado para a equipe responsável. Assim que houver atualização, você será notificado.']
      );
      await runQuery(
        'INSERT INTO response_templates (title, category, content) VALUES (?, ?, ?)',
        ['Informativo', 'informativo', 'Registramos sua solicitação e iniciamos o atendimento. Acompanhe por este canal as próximas atualizações.']
      );
      console.log('✅ Templates padrão inseridos');
    }

    // Verificar se já existe usuário desenvolvedor
    const existingDev = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE role = ?', ['DESENVOLVEDOR'], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!existingDev) {
      // Criar usuário desenvolvedor padrão
      const hashedPassword = await bcrypt.hash('Dev@123456', 10);
      await runQuery(`
        INSERT INTO users (name, email, password, role)
        VALUES (?, ?, ?, ?)
      `, ['Desenvolvedor', 'dev@ti.com', hashedPassword, 'DESENVOLVEDOR']);
      
      console.log('\n👤 Usuário desenvolvedor criado:');
      console.log('   Email: dev@ti.com');
      console.log('   Senha: Dev@123456');
      console.log('   ⚠️  IMPORTANTE: Altere essa senha após o primeiro login!\n');
    } else {
      console.log('\n👤 Usuário desenvolvedor já existe\n');
    }

    console.log('✅ Banco de dados inicializado com sucesso!\n');
    console.log('🚀 Você pode iniciar o servidor com: npm start\n');

  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error.message);
  } finally {
    db.close();
  }
}

// Executar inicialização
initDatabase();
