const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Caminho do banco de dados
const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database/tickets.db');

// Criar diretório do banco se não existir
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log('📁 Diretório do banco de dados criado');
}

// Criar conexão com o banco
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Erro ao conectar ao banco de dados:', err.message);
  } else {
    console.log('✅ Conectado ao banco de dados SQLite');
  }
});

// Ajustes de integridade e resiliência
db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');

// Função para executar queries com Promise
const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
};

// Função para buscar um registro
const getOne = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

// Função para buscar múltiplos registros
const getAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

module.exports = {
  db,
  runQuery,
  getOne,
  getAll
};
