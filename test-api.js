// Script de teste da API
const http = require('http');

console.log('🧪 Testando API do Sistema de Chamados TI\n');

// Teste 1: Login
console.log('📝 Teste 1: Login com usuário padrão');
const loginData = JSON.stringify({
  email: 'dev@ti.com',
  password: 'Dev@123456'
});

const loginOptions = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': loginData.length
  }
};

const loginReq = http.request(loginOptions, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    const response = JSON.parse(data);
    
    if (response.success) {
      console.log('✅ Login bem-sucedido!');
      console.log(`   Usuário: ${response.user.name}`);
      console.log(`   Role: ${response.user.role}`);
      console.log(`   Token: ${response.token.substring(0, 20)}...`);
      
      // Teste 2: Listar chamados
      console.log('\n📝 Teste 2: Listar chamados');
      testListTickets(response.token);
    } else {
      console.log('❌ Erro no login:', response.message);
    }
  });
});

loginReq.on('error', (error) => {
  console.error('❌ Erro na requisição:', error.message);
});

loginReq.write(loginData);
loginReq.end();

// Função para testar listagem de chamados
function testListTickets(token) {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/tickets',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log(`Status: ${res.statusCode}`);
      const response = JSON.parse(data);
      
      if (response.success) {
        console.log('✅ Listagem de chamados bem-sucedida!');
        console.log(`   Total de chamados: ${response.count}`);
        
        // Teste 3: Criar chamado
        console.log('\n📝 Teste 3: Criar novo chamado');
        testCreateTicket();
      } else {
        console.log('❌ Erro ao listar chamados:', response.message);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Erro na requisição:', error.message);
  });

  req.end();
}

// Função para testar criação de chamado
function testCreateTicket() {
  const ticketData = JSON.stringify({
    requester_name: 'Teste Usuário',
    requester_email: 'teste@empresa.com',
    department: 'Administrativo',
    category: 'Software',
    priority: 'media',
    subject: 'Teste de chamado via API',
    description: 'Este é um chamado de teste criado automaticamente para validar o sistema.'
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/tickets',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': ticketData.length
    }
  };

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log(`Status: ${res.statusCode}`);
      const response = JSON.parse(data);
      
      if (response.success) {
        console.log('✅ Chamado criado com sucesso!');
        console.log(`   Número: #${response.ticket.ticket_number}`);
        console.log(`   Status: ${response.ticket.status}`);
        
        console.log('\n🎉 Todos os testes passaram com sucesso!');
        console.log('\n📌 Próximos passos:');
        console.log('   1. Abra http://localhost:3000 no navegador');
        console.log('   2. Teste criar um chamado pelo formulário');
        console.log('   3. Acesse http://localhost:3000/login.html');
        console.log('   4. Faça login com: dev@ti.com / Dev@123456');
        console.log('   5. Veja o chamado no dashboard');
      } else {
        console.log('❌ Erro ao criar chamado:', response.message);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Erro na requisição:', error.message);
  });

  req.write(ticketData);
  req.end();
}
