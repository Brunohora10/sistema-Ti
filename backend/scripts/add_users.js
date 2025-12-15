/**
 * Script para adicionar usuários específicos
 * Cria: bruno, tiago, junior com senha 123456
 */

const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, '../../database/tickets.db');

function addUsers() {
  const db = new sqlite3.Database(dbPath);

  const usuarios = [
    { name: 'bruno', email: 'bruno@ti.com', password: '123456', role: 'DESENVOLVEDOR' },
    { name: 'tiago', email: 'tiago@ti.com', password: '123456', role: 'COORDENADOR' },
    { name: 'junior', email: 'junior@ti.com', password: '123456', role: 'AUXILIAR' }
  ];

  console.log('\n👥 Adicionando usuários...\n');

  db.serialize(() => {
    usuarios.forEach((user) => {
      const hashedPassword = bcrypt.hashSync(user.password, 10);
      
      db.run(
        `INSERT OR REPLACE INTO users (name, email, password, role, active, phone)
         VALUES (?, ?, ?, ?, 1, '(00) 00000-0000')`,
        [user.name, user.email, hashedPassword, user.role],
        (err) => {
          if (err) {
            console.log(`❌ Erro ao inserir ${user.name}:`, err.message);
          } else {
            console.log(`✅ ${user.name} (${user.role}) - Senha: 123456`);
          }
        }
      );
    });

    setTimeout(() => {
      console.log('\n✅ Concluído!\n');
      db.close();
    }, 500);
  });
}

addUsers();
