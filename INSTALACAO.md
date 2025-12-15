# 🚀 Guia de Instalação - Sistema de Chamados TI

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** (versão 14 ou superior)
  - Download: https://nodejs.org/
  - Verificar instalação: `node --version`

- **NPM** (vem com Node.js)
  - Verificar instalação: `npm --version`

- **Conta Gmail** (para envio de emails)

## 🔧 Passo a Passo da Instalação

### 1️⃣ Instalar Dependências

Abra o terminal na pasta do projeto e execute:

```bash
npm install
```

Aguarde a instalação de todos os pacotes necessários (pode levar alguns minutos).

### 2️⃣ Configurar Email

Para que o sistema envie emails automáticos, você precisa configurar uma conta Gmail:

#### A) Gerar Senha de App no Gmail

1. Acesse: https://myaccount.google.com/security
2. Ative a **"Verificação em duas etapas"** (se ainda não estiver ativa)
3. Após ativar, volte para: https://myaccount.google.com/security
4. Procure por **"Senhas de app"** (App passwords)
5. Selecione:
   - App: **Email**
   - Dispositivo: **Outro** (digite "Sistema TI")
6. Clique em **Gerar**
7. **COPIE** a senha gerada (16 caracteres)

#### B) Configurar o arquivo .env

Abra o arquivo `.env` na raiz do projeto e edite:

```env
# Configurações de Email
EMAIL_USER=seu_email@gmail.com          # ← Seu email do Gmail
EMAIL_PASS=xxxx xxxx xxxx xxxx          # ← Cole a senha de app aqui
EMAIL_FROM=Sistema TI <seu_email@gmail.com>
```

**Exemplo:**
```env
EMAIL_USER=ti.empresa@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop
EMAIL_FROM=Sistema TI <ti.empresa@gmail.com>
```

### 3️⃣ Inicializar o Banco de Dados

Execute o comando para criar o banco de dados e o usuário padrão:

```bash
npm run init-db
```

Você verá uma mensagem como:

```
✅ Banco de dados inicializado com sucesso!

👤 Usuário desenvolvedor criado:
   Email: dev@ti.com
   Senha: Dev@123456
```

### 4️⃣ Iniciar o Servidor

Agora inicie o servidor:

```bash
npm start
```

Você verá:

```
🚀 ========================================
🎫 Sistema de Chamados TI
🌐 Servidor rodando em: http://localhost:3000
📧 Email configurado: seu_email@gmail.com
🗄️  Banco de dados: ./database/tickets.db
🚀 ========================================
```

## 🌐 Acessando o Sistema

Com o servidor rodando, abra seu navegador:

### Portal do Usuário (Abrir Chamados)
```
http://localhost:3000
```

### Login da Equipe de TI
```
http://localhost:3000/login.html
```

**Credenciais padrão:**
- Email: `dev@ti.com`
- Senha: `Dev@123456`

⚠️ **IMPORTANTE:** Altere essa senha após o primeiro login!

## 👥 Criando Novos Usuários

Após fazer login como desenvolvedor:

1. Acesse o menu **"Usuários"** no dashboard
2. Clique em **"Novo Usuário"**
3. Preencha os dados:
   - Nome
   - Email
   - Senha
   - Função (Desenvolvedor, Coordenador ou Auxiliar)
4. Clique em **"Criar Usuário"**

## 🎯 Testando o Sistema

### Teste 1: Criar um Chamado

1. Acesse: http://localhost:3000
2. Preencha o formulário
3. Clique em "Enviar Chamado"
4. Você receberá um número de chamado (ex: #TI123456)
5. Verifique seu email (deve receber confirmação)

### Teste 2: Gerenciar Chamado

1. Acesse: http://localhost:3000/login.html
2. Faça login com dev@ti.com
3. Veja o chamado na lista
4. Clique para abrir os detalhes
5. Atribua a um técnico
6. Mude o status
7. Adicione comentários

### Teste 3: Verificar Emails

- O solicitante deve receber email de confirmação
- Os técnicos devem receber notificação de novo chamado
- Ao atribuir, o técnico recebe email
- Ao mudar status, o solicitante recebe email

## 🔧 Comandos Úteis

```bash
# Iniciar servidor (produção)
npm start

# Iniciar servidor (desenvolvimento com auto-reload)
npm run dev

# Reinicializar banco de dados
npm run init-db
```

## ❌ Problemas Comuns

### Erro: "Cannot find module"
**Solução:** Execute `npm install` novamente

### Erro: "EADDRINUSE" (porta em uso)
**Solução:** 
- Feche outros servidores na porta 3000
- Ou mude a porta no arquivo `.env`: `PORT=3001`

### Emails não estão sendo enviados
**Soluções:**
1. Verifique se a senha de app está correta no `.env`
2. Verifique se a verificação em 2 etapas está ativa no Gmail
3. Verifique os logs do servidor para erros

### Não consigo fazer login
**Soluções:**
1. Verifique se executou `npm run init-db`
2. Use as credenciais: dev@ti.com / Dev@123456
3. Limpe o cache do navegador (Ctrl+Shift+Del)

## 📱 Acessando de Outros Dispositivos

Para acessar o sistema de outros computadores na mesma rede:

1. Descubra seu IP local:
   - Windows: `ipconfig` (procure por IPv4)
   - Mac/Linux: `ifconfig` ou `ip addr`

2. No arquivo `.env`, altere:
   ```env
   APP_URL=http://SEU_IP:3000
   ```

3. Acesse de outros dispositivos:
   ```
   http://SEU_IP:3000
   ```

## 🔒 Segurança

### Para Produção (uso real):

1. **Mude o JWT_SECRET** no `.env`:
   ```env
   JWT_SECRET=uma_chave_muito_segura_e_aleatoria_aqui
   ```

2. **Altere a senha padrão** do desenvolvedor

3. **Use HTTPS** (certificado SSL)

4. **Configure firewall** adequadamente

## 📞 Suporte

Se tiver problemas:

1. Verifique os logs do servidor no terminal
2. Verifique o console do navegador (F12)
3. Consulte o arquivo README.md
4. Abra um chamado no próprio sistema! 😄

---

## ✅ Checklist de Instalação

- [ ] Node.js instalado
- [ ] Dependências instaladas (`npm install`)
- [ ] Email configurado no `.env`
- [ ] Banco de dados inicializado (`npm run init-db`)
- [ ] Servidor iniciado (`npm start`)
- [ ] Acesso ao portal funcionando (http://localhost:3000)
- [ ] Login funcionando (dev@ti.com)
- [ ] Teste de criação de chamado realizado
- [ ] Emails sendo recebidos

**Parabéns! Seu sistema está pronto para uso! 🎉**
