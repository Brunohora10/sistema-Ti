# ⚡ Início Rápido - Sistema de Chamados TI

## 🚀 3 Passos para Começar

### 1️⃣ Instalar
```bash
npm install
```

### 2️⃣ Configurar Email (arquivo .env)
```env
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=sua_senha_de_app_do_gmail
```

> 💡 **Como gerar senha de app:** https://myaccount.google.com/apppasswords

### 3️⃣ Iniciar
```bash
npm run init-db
npm start
```

## 🌐 Acessar

- **Portal Usuário:** http://localhost:3000
- **Login TI:** http://localhost:3000/login.html

**Credenciais padrão:**
- Email: `dev@ti.com`
- Senha: `Dev@123456`

---

## 📚 Documentação Completa

Para instruções detalhadas, veja:
- [INSTALACAO.md](INSTALACAO.md) - Guia completo de instalação
- [README.md](README.md) - Documentação do projeto

## 🎯 Estrutura do Sistema

```
📁 Sistema de Chamados TI
├── 🌐 Portal do Usuário (público)
│   └── Abrir chamados de suporte
│
├── 🔐 Dashboard TI (autenticado)
│   ├── 👨‍💻 DESENVOLVEDOR (admin total)
│   │   ├── Ver todos os chamados
│   │   ├── Gerenciar chamados
│   │   ├── Ver estatísticas
│   │   └── Gerenciar usuários ✨
│   │
│   ├── 👔 COORDENADOR (supervisor)
│   │   ├── Ver todos os chamados
│   │   ├── Gerenciar chamados
│   │   └── Ver estatísticas
│   │
│   └── 🔧 AUXILIAR (operador)
│       ├── Ver seus chamados
│       └── Atualizar seus chamados
│
└── 📧 Sistema de Emails Automáticos
    ├── Confirmação de chamado
    ├── Notificação para técnicos
    ├── Atribuição de chamado
    └── Atualizações de status
```

## ✨ Funcionalidades Principais

### Para Usuários
- ✅ Abrir chamados facilmente
- ✅ Receber confirmação por email
- ✅ Acompanhar status
- ✅ Anexar arquivos

### Para Técnicos
- ✅ Dashboard em tempo real
- ✅ Filtros e busca avançada
- ✅ Atribuição de chamados
- ✅ Comentários (públicos e internos)
- ✅ Histórico completo
- ✅ Notificações instantâneas

### Para Gestores
- ✅ Métricas e estatísticas
- ✅ Relatórios por período
- ✅ Performance da equipe
- ✅ Tempo médio de resolução
- ✅ SLA por prioridade

## 🎨 Categorias de Chamados

- 🖥️ Hardware
- 💻 Software
- 🌐 Rede / Internet
- 📧 Email
- 📞 Telefonia
- 🔐 Acesso / Senha
- ⚙️ Instalação / Configuração
- 📦 Outro

## 🚦 Prioridades

- 🟢 **Baixa** - Pode esperar (até 24h)
- 🟡 **Média** - Importante (até 8h)
- 🟠 **Alta** - Urgente (até 4h)
- 🔴 **Urgente** - Sistema parado (até 2h)

## 📊 Status dos Chamados

- 🆕 **Aberto** - Aguardando atendimento
- ⏳ **Em Andamento** - Sendo resolvido
- ✅ **Resolvido** - Problema solucionado
- 🔒 **Fechado** - Finalizado

## 🔧 Comandos Úteis

```bash
# Instalar dependências
npm install

# Inicializar banco de dados
npm run init-db

# Iniciar servidor (produção)
npm start

# Iniciar servidor (desenvolvimento)
npm run dev
```

## 📱 Tecnologias Utilizadas

### Backend
- Node.js + Express
- SQLite (banco de dados)
- Socket.io (tempo real)
- JWT (autenticação)
- Nodemailer (emails)
- Bcrypt (criptografia)

### Frontend
- HTML5 + CSS3
- JavaScript (Vanilla)
- Socket.io Client
- Design Responsivo

## 🎯 Casos de Uso

### Exemplo 1: Usuário com Problema
1. Acessa http://localhost:3000
2. Preenche formulário descrevendo o problema
3. Recebe número do chamado por email
4. Aguarda atendimento

### Exemplo 2: Técnico Atendendo
1. Faz login no sistema
2. Vê novo chamado na lista
3. Atribui para si mesmo
4. Muda status para "Em Andamento"
5. Adiciona comentários
6. Resolve o problema
7. Muda status para "Resolvido"

### Exemplo 3: Coordenador Monitorando
1. Faz login no sistema
2. Acessa Dashboard
3. Visualiza estatísticas
4. Verifica performance da equipe
5. Reatribui chamados se necessário
6. Gera relatórios

## ❓ FAQ Rápido

**P: Como adicionar novos técnicos?**
R: Login como desenvolvedor → Menu Usuários → Novo Usuário

**P: Como alterar minha senha?**
R: Dashboard → Perfil → Alterar Senha

**P: Emails não estão sendo enviados?**
R: Verifique configuração no .env e senha de app do Gmail

**P: Como acessar de outros computadores?**
R: Use seu IP local (ex: http://192.168.1.100:3000)

**P: Posso usar outro email que não seja Gmail?**
R: Sim! Configure SMTP no .env (host, port, user, pass)

## 🆘 Precisa de Ajuda?

1. Consulte [INSTALACAO.md](INSTALACAO.md) para guia detalhado
2. Veja [README.md](README.md) para documentação completa
3. Verifique [TODO.md](TODO.md) para funcionalidades planejadas
4. Abra um chamado no próprio sistema! 😄

## 🎉 Pronto!

Seu sistema de chamados está funcionando!

**Próximos passos:**
1. ✅ Teste criando um chamado
2. ✅ Faça login e gerencie o chamado
3. ✅ Adicione novos técnicos
4. ✅ Configure email para produção
5. ✅ Personalize conforme necessário

---

**Desenvolvido com ❤️ para facilitar o trabalho da equipe de TI**
