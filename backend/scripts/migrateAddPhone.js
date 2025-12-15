// Adiciona colunas phone em users e requester_phone em tickets se não existirem
// Execução: node backend/scripts/migrateAddPhone.js

const { db } = require('../config/database');

async function migrate() {
  console.log('🔄 Migrando colunas phone...');
  try {
    await run('PRAGMA foreign_keys = OFF');
    await run('BEGIN TRANSACTION');

    // Adicionar phone em users
    await safeAlter("ALTER TABLE users ADD COLUMN phone TEXT");
    // Adicionar requester_phone em tickets
    await safeAlter("ALTER TABLE tickets ADD COLUMN requester_phone TEXT");

    await run('COMMIT');
    console.log('✅ Migração concluída.');
  } catch (err) {
    console.error('❌ Erro na migração:', err.message);
    await run('ROLLBACK');
  } finally {
    await run('PRAGMA foreign_keys = ON');
    db.close();
  }
}

async function safeAlter(sql) {
  try {
    await run(sql);
    console.log(`✔ ${sql}`);
  } catch (err) {
    if (err.message.includes('duplicate column') || err.message.includes('exists')) {
      console.log(`ℹ Já existe coluna para: ${sql}`);
    } else {
      throw err;
    }
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
