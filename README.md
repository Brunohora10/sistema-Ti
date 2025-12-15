# 🎫 Sistema de Chamados TI

Sistema completo de Help Desk para gerenciamento de chamados de TI com dashboard em tempo real, métricas e sistema de permissões.

## 🚀 Funcionalidades

### Portal do Usuário
- ✅ Abertura de chamados via formulário web
- ✅ Acompanhamento de status
- ✅ Notificações por email

### Dashboard TI (3 Níveis de Acesso)

**DESENVOLVEDOR** (Admin Total)
- Ver todos os chamados
- Gerenciar chamados
- Ver estatísticas completas
- Cadastrar/Editar/Excluir usuários técnicos

**COORDENADOR** (Supervisor)
- Ver todos os chamados
- Gerenciar chamados
- Ver estatísticas completas

**AUXILIAR** (Operador)
- Ver chamados atribuídos
- Atualizar seus chamados

### Recursos
- 📊 Dashboard com métricas em tempo real
- 📧 Notificações por email automáticas
- 🔔 Notificações em tempo real (WebSocket)
- 📈 Gráficos e relatórios
- 🔐 Sistema de autenticação seguro
- 👥 Gerenciamento de usuários
- 📎 Suporte a anexos

## 📋 Pré-requisitos

- Node.js (versão 14 ou superior)
- NPM ou Yarn
- Conta Gmail (para envio de emails)

## 🔧 Instalação

### 1. Clone ou baixe o projeto

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure o arquivo .env
Edite o arquivo `.env` e configure:
- `EMAIL_USER`: Seu email do Gmail
- `EMAIL_PASS`: Senha de app do Gmail (veja instruções abaixo)
- `JWT_SECRET`: Mude para uma chave secreta forte

### 4. Configure Email do Gmail

Para enviar emails, você precisa gerar uma "Senha de App" no Gmail:

1. Acesse: https://myaccount.google.com/security
2. Ative a "Verificação em duas etapas"
3. Vá em "Senhas de app"
4. Gere uma senha para "Email"
5. Cole essa senha no `.env` em `EMAIL_PASS`

### 5. Inicialize o banco de dados
```bash
npm run init-db
```

Isso criará:
- Banco de dados SQLite
- Tabelas necessárias
- Usuário desenvolvedor padrão:
  - **Email:** dev@ti.com
  - **Senha:** Dev@123456

### 6. Inicie o servidor
```bash
npm start
```

Ou para desenvolvimento com auto-reload:
```bash
npm run dev
```

## 🌐 Acessando o Sistema

Após iniciar o servidor:

- **Portal do Usuário:** http://localhost:3000
- **Login TI:** http://localhost:3000/login.html
- **Dashboard:** http://localhost:3000/dashboard.html (após login)

## 👤 Usuário Padrão

**Desenvolvedor (Admin)**
- Email: dev@ti.com
- Senha: Dev@123456

⚠️ **IMPORTANTE:** Altere essa senha após o primeiro login!

## 📁 Estrutura do Projeto

```
sistema-ti-chamado/
├── backend/           # Servidor Node.js
├── frontend/          # Interface web
├── database/          # Banco SQLite
├── uploads/           # Arquivos anexados
└── .env              # Configurações
```

## 🔒 Segurança

- Senhas criptografadas com bcrypt
- Autenticação JWT
- Validação de dados
- Proteção contra SQL Injection
- Middleware de permissões

## 📧 Sistema de Emails

O sistema envia emails automaticamente para:
- Novo chamado criado
- Chamado atribuído a técnico
- Status atualizado
- Comentários adicionados

## 🆘 Suporte

Para problemas ou dúvidas, abra um chamado no próprio sistema! 😄

## 📝 Licença

MIT License - Livre para uso e modificação

---

Desenvolvido com ❤️ para facilitar o trabalho da equipe de TI
