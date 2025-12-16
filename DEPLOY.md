# 🚀 Deploy do Sistema TI no Render

## Passo a Passo para Colocar Online

### 1️⃣ Criar conta no Render
1. Acesse: https://render.com
2. Clique em "Get Started for Free"
3. Entre com GitHub (conectar sua conta)

### 2️⃣ Criar novo Web Service
1. No Dashboard do Render, clique em **"New +"**
2. Selecione **"Web Service"**
3. Conecte seu repositório: `Brunohora10/sistema-Ti`
4. Clique em **"Connect"**

### 3️⃣ Configurar o Serviço
Preencha os campos:

- **Name:** `sistema-ti-chamados` (ou o nome que preferir)
- **Region:** Qualquer (recomendo `Oregon` ou `Frankfurt`)
- **Branch:** `main`
- **Runtime:** Detectado automaticamente (Node)
- **Build Command:** `npm install`
- **Start Command:** `npm run start:prod`
- **Plan:** Selecione **"Free"**

### 4️⃣ Adicionar Disco Persistente (IMPORTANTE!)
⚠️ **Sem isso, o banco de dados será perdido a cada reinicialização!**

1. Na página de configuração, vá até **"Disks"**
2. Clique em **"Add Disk"**
3. Configure:
   - **Name:** `data`
   - **Mount Path:** `/opt/render/project/data`
   - **Size:** `1 GB` (gratuito)
4. Clique em **"Save"**

### 5️⃣ Configurar Variáveis de Ambiente
Na seção **"Environment Variables"**, adicione:

```
NODE_ENV=production
PORT=3000
JWT_SECRET=sua_chave_secreta_super_forte_aqui_mude_isso
DB_PATH=/opt/render/project/data/tickets.db
BACKUP_DIR=/opt/render/project/data/backups
BACKUP_DAYS_RETENTION=7
```

**📧 Configurar Email (OPCIONAL - mas recomendado):**
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=sua_senha_app_gmail
EMAIL_FROM=Sistema TI <seu_email@gmail.com>
```

**⚠️ Para Gmail:**
1. Ative "Verificação em 2 etapas"
2. Crie uma "Senha de app": https://myaccount.google.com/apppasswords
3. Use essa senha no `EMAIL_PASS`

### 6️⃣ Deploy!
1. Role até o final e clique em **"Create Web Service"**
2. Aguarde 3-5 minutos (o Render vai instalar tudo)
3. Quando aparecer **"Live"**, está no ar! 🎉

### 7️⃣ Acessar o Sistema
Seu sistema estará em:
```
https://sistema-ti-chamados.onrender.com
```
(O Render vai gerar uma URL única)

### 8️⃣ Criar Usuário Inicial
Após o deploy, crie seu primeiro usuário desenvolvedor:

1. Acesse o **Shell** do Render:
   - No Dashboard → Seu serviço → Aba **"Shell"**
2. Execute:
```bash
node backend/scripts/add_users.js
```

Ou crie manualmente via script Node no Shell.

---

## 📝 Observações Importantes

### ⚠️ Limitações do Plano Gratuito
- **Sleep após inatividade:** O serviço "dorme" após 15min sem acessos
- **Primeiro acesso:** Pode demorar ~30s para "acordar"
- **Disco:** 1GB gratuito (suficiente para centenas de chamados)
- **Uptime:** ~750h/mês no plano free

### 🔄 Atualizações Automáticas
Cada vez que você fizer `git push` no GitHub, o Render faz deploy automático!

### 📊 Monitoramento
No Dashboard do Render você pode:
- Ver logs em tempo real
- Reiniciar o serviço
- Ver métricas de uso
- Acessar o Shell (terminal)

### 🆙 Upgrade para Produção (Pago)
Se precisar de 100% uptime e performance:
- **Render Starter ($7/mês):** Sem sleep, mais recursos
- **Render Standard ($25/mês):** Alta performance
- Adicionar domínio customizado: `sistema.suaempresa.com`

---

## 🔗 Links Úteis
- Dashboard Render: https://dashboard.render.com
- Documentação: https://render.com/docs
- Status: https://status.render.com

## 🆘 Problemas Comuns

**Erro ao iniciar:**
- Verifique os logs no Dashboard
- Confirme que o disco está montado
- Verifique as variáveis de ambiente

**Banco de dados sumiu:**
- Confirme que o disco persistente está configurado
- Path correto: `/opt/render/project/data/tickets.db`

**Email não funciona:**
- Verifique credenciais do Gmail
- Use senha de app (não a senha normal)
- Emails são opcionais, sistema funciona sem

---

## ✅ Checklist Final
- [ ] Conta criada no Render
- [ ] Repositório conectado
- [ ] Disco persistente adicionado
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy concluído (status "Live")
- [ ] Sistema acessível via URL
- [ ] Usuário inicial criado
- [ ] Login funcionando

**Está pronto! 🎉**
