require('dotenv').config();
const { db } = require('../config/database');

const args = process.argv.slice(2);
const action = args[0];

function getArgValue(flag){
  const idx = args.indexOf(flag);
  if (idx !== -1 && args[idx+1]) return args[idx+1];
  const pref = `${flag}=`;
  const found = args.find(a => a.startsWith(pref));
  return found ? found.substring(pref.length) : undefined;
}

const name = getArgValue('--name');
const id = getArgValue('--id');

const run = (sql, params=[]) => new Promise((resolve, reject) => {
  db.run(sql, params, function(err){
    if (err) return reject(err);
    resolve(this.changes || 0);
  });
});

const get = (sql, params=[]) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => {
    if (err) return reject(err);
    resolve(row);
  });
});

(async () => {
  try {
    if (action === 'list') {
      db.all('SELECT id, name, email, role, active FROM users ORDER BY id', [], (err, rows) => {
        if (err) throw err;
        console.table(rows);
        db.close();
      });
      return;
    }

    if (!['delete', 'deactivate'].includes(action)) {
      console.log('Uso: node backend/scripts/manage_users.js <list|delete|deactivate> [--name <nome>] [--id <id>]');
      db.close();
      return;
    }

    let user;
    if (id) user = await get('SELECT * FROM users WHERE id = ?', [id]);
    else if (name) user = await get('SELECT * FROM users WHERE name = ?', [name]);

    if (!user) throw new Error('Usuário não encontrado');

    if (action === 'delete') {
      const changes = await run('DELETE FROM users WHERE id = ?', [user.id]);
      console.log(`🗑️  Usuário removido: id=${user.id}, name=${user.name}, changes=${changes}`);
    } else if (action === 'deactivate') {
      const changes = await run('UPDATE users SET active = 0 WHERE id = ?', [user.id]);
      console.log(`🚫 Usuário desativado: id=${user.id}, name=${user.name}, changes=${changes}`);
    }
  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exitCode = 1;
  } finally {
    // close shortly after to flush console.table
    setTimeout(() => db.close(), 100);
  }
})();
