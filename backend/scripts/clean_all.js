/**
 * Script para LIMPAR COMPLETAMENTE o banco de dados
 * Use antes de subir para produção/GitHub
 * Remove TODOS os dados (tickets, usuários, templates, históricos)
 * Mantém apenas a estrutura e um usuário admin padrão
 */

const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../database/tickets.db');

function cleanDatabase() {
  console.log('\n🔥 LIMPEZA COMPLETA DO BANCO DE DADOS\n');
  console.log('⚠️  ATENÇÃO: Isso vai APAGAR TODOS OS DADOS!\n');

  const db = new sqlite3.Database(dbPath);

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Desabilitar foreign keys temporariamente
      db.run('PRAGMA foreign_keys = OFF', (err) => {
        if (err) {
          console.error('Erro ao desabilitar foreign keys:', err);
          db.close();
          reject(err);
          return;
        }

        console.log('🗑️  Removendo tickets e históricos...');
        
        // Limpar dados de forma segura
        db.run('DELETE FROM comments');
        db.run('DELETE FROM status_history');
        db.run('DELETE FROM tickets');

        console.log('🗑️  Removendo usuários...');
        db.run('DELETE FROM users');

        console.log('🗑️  Removendo templates de resposta...');
        db.run('DELETE FROM response_templates');

        // Resetar sequências (autoincrement)
        db.run("DELETE FROM sqlite_sequence");

        console.log('👤 Criando usuário admin padrão...');
        
        const hashedPassword = bcrypt.hashSync('admin123', 10);
        
        db.run(
          `INSERT INTO users (name, email, password, role, active, phone)
           VALUES (?, ?, ?, ?, ?, ?)`,
          ['Administrador', 'admin@sistema.com', hashedPassword, 'DESENVOLVEDOR', 1, '(00) 00000-0000'],
          (err) => {
            if (err) {
              console.error('❌ Erro ao criar admin:', err.message);
              db.close();
              reject(err);
              return;
            }

            console.log('✅ Usuário admin criado:');
            console.log('   Email: admin@sistema.com');
            console.log('   Senha: admin123');
            console.log('   Role: DESENVOLVEDOR\n');

            // Reabilitar foreign keys
            db.run('PRAGMA foreign_keys = ON');

            console.log('✅ Limpeza concluída com sucesso!');
            console.log('📦 Banco de dados pronto para GitHub/produção\n');
            
            db.close((closeErr) => {
              if (closeErr) {
                console.error('Erro ao fechar banco:', closeErr.message);
              }
              resolve();
            });
          }
        );
      });
    });
  });
}

// Executar se chamado diretamente
if (require.main === module) {
  if (!fs.existsSync(dbPath)) {
    console.error('❌ Banco de dados não encontrado!');
    console.log('💡 Execute primeiro: node backend/config/initDatabase.js\n');
    process.exit(1);
  }

  cleanDatabase()
    .then(() => {
      console.log('🎉 Processo finalizado!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro durante limpeza:', error);
      process.exit(1);
    });
}

module.exports = { cleanDatabase };
