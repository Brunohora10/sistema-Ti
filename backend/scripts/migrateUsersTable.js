// Migra a tabela users para permitir email opcional e roles em maiúsculo
// Uso: node backend/scripts/migrateUsersTable.js

const { db } = require('../config/database');

async function migrate() {
  console.log('🔄 Migrando tabela users...');
  try {
    await run(`PRAGMA foreign_keys = OFF`);
    await run('BEGIN TRANSACTION');

    await run(`
      CREATE TABLE IF NOT EXISTS users_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        email TEXT UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('DESENVOLVEDOR','COORDENADOR','AUXILIAR')),
        active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await run(`
      INSERT INTO users_new (id, name, email, password, role, active, created_at, updated_at)
      SELECT 
        id,
        name,
        NULLIF(email, ''),
        password,
        UPPER(role),
        active,
        created_at,
        updated_at
      FROM users
    `);

    await run('DROP TABLE users');
    await run('ALTER TABLE users_new RENAME TO users');
    await run('COMMIT');
    await run(`PRAGMA foreign_keys = ON`);
    console.log('✅ Migração concluída com sucesso.');
  } catch (err) {
    console.error('❌ Erro na migração:', err.message);
    await run('ROLLBACK');
  } finally {
    db.close();
  }
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

migrate();
