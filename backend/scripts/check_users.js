const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../database/tickets.db');
const db = new sqlite3.Database(dbPath);

db.all("SELECT id, name, email, role, active FROM users", (err, rows) => {
  if (err) {
    console.error('Erro:', err.message);
  } else {
    console.log('\n📋 Usuários no banco:\n');
    console.table(rows);
  }
  db.close();
});
