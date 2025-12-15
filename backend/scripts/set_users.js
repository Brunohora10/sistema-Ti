require('dotenv').config();
const bcrypt = require('bcryptjs');
const { db } = require('../config/database');

const USERS = [
  { name: 'bruno', password: '123456', role: 'DESENVOLVEDOR' },
  { name: 'tiago', password: '123456', role: 'COORDENADOR' },
  { name: 'junior', password: '123456', role: 'AUXILIAR' },
];

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
    // Remover usuário de demonstração se existir
    const demo = await get('SELECT id FROM users WHERE name = ?', ['Desenvolvedor']);
    if (demo) {
      await run('DELETE FROM users WHERE id = ?', [demo.id]);
      console.log('🗑️  Usuário de demonstração removido');
    }

    for (const u of USERS) {
      const existing = await get('SELECT id FROM users WHERE name = ?', [u.name]);
      const hashed = await bcrypt.hash(u.password, 10);
      if (existing) {
        const ch = await run('UPDATE users SET password = ?, role = ?, active = 1 WHERE id = ?', [hashed, u.role, existing.id]);
        console.log(`🔁 Atualizado: ${u.name} (${u.role}) changes=${ch}`);
      } else {
        const ch = await run('INSERT INTO users (name, email, password, role, active) VALUES (?, ?, ?, ?, 1)', [u.name, null, hashed, u.role]);
        console.log(`✅ Criado: ${u.name} (${u.role})`);
      }
    }

    console.log('🎉 Usuários configurados com sucesso.');
  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exitCode = 1;
  } finally {
    db.close();
  }
})();
