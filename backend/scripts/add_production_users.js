const bcrypt = require('bcryptjs');
const { runQuery, getOne } = require('../config/database');

async function addProductionUsers() {
  try {
    console.log('🔄 Adicionando usuários de produção...\n');

    const users = [
      { name: 'bruno', password: '123456', role: 'DESENVOLVEDOR' },
      { name: 'tiago', password: '123456', role: 'COORDENADOR' },
      { name: 'junior', password: '123456', role: 'AUXILIAR' }
    ];

    for (const user of users) {
      // Verificar se já existe
      const existing = await getOne(
        'SELECT id FROM users WHERE LOWER(name) = ?',
        [user.name.toLowerCase()]
      );

      if (existing) {
        console.log(`⏭️  Usuário '${user.name}' já existe, pulando...`);
        continue;
      }

      // Hash da senha
      const hashedPassword = await bcrypt.hash(user.password, 10);

      // Inserir usuário
      await runQuery(
        'INSERT INTO users (name, email, phone, password, role, active) VALUES (?, ?, ?, ?, ?, ?)',
        [user.name, null, null, hashedPassword, user.role, 1]
      );

      console.log(`✅ Usuário '${user.name}' criado com sucesso (${user.role})`);
    }

    console.log('\n✅ Processo concluído!');
    console.log('\n📋 Credenciais para login:');
    console.log('━'.repeat(50));
    users.forEach(u => {
      console.log(`👤 Usuário: ${u.name} | Senha: ${u.password} | Role: ${u.role}`);
    });
    console.log('━'.repeat(50));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

addProductionUsers();
