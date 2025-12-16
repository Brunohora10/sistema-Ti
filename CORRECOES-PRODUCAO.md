# Correções de Produção

## Problema 1: Auxiliar não recebe emails de chamados

### Causa
O usuário `junior` (auxiliar) provavelmente não tem email cadastrado no sistema.

### Solução

1. **Acesse o painel de Usuários** em https://sistema-ti-6zor.onrender.com/users.html

2. **Edite o usuário junior** e adicione um email válido

3. **Verifique a configuração de email** no Render.com:
   - Acesse: https://dashboard.render.com/
   - Vá em: `Sistema-Ti` → `Environment` → `Environment Variables`
   - Certifique-se que as seguintes variáveis estão configuradas:

```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua-senha-de-aplicativo
EMAIL_FROM="Sistema de Chamados TI <seu-email@gmail.com>"
APP_URL=https://sistema-ti-6zor.onrender.com
```

4. **Como gerar senha de aplicativo do Gmail**:
   - Acesse: https://myaccount.google.com/apppasswords
   - Selecione "Email" e "Computador Windows"
   - Copie a senha de 16 dígitos gerada
   - Cole em `EMAIL_PASS` no Render

5. **Após configurar, faça um redeploy**:
   - No Render, clique em `Manual Deploy` → `Deploy latest commit`

### Teste
Após configurar, crie um novo chamado e verifique se todos os técnicos (incluindo auxiliares) recebem o email.

---

## Problema 2: TV não atualiza em tempo real

### Causa
O Socket.io já está configurado corretamente no código, mas pode haver problema de CORS ou configuração do servidor.

### Verificação

O código está correto:
- ✅ Socket.io client library carregado em tv.html
- ✅ Função connectSocket() sendo chamada
- ✅ Eventos 'new_ticket' e 'ticket_updated' configurados
- ✅ Server.js emitindo eventos Socket.io

### Teste

1. **Abra a TV em uma janela**: https://sistema-ti-6zor.onrender.com/tv.html

2. **Abra o Console do navegador** (F12) e procure por:
   - "Socket.io conectado" ✅
   - "Novo chamado recebido via Socket.io" quando criar um chamado

3. **Crie um novo chamado** em outra janela e veja se:
   - O console da TV mostra a mensagem
   - A TV atualiza automaticamente (overlay "Novo Chamado!")
   - A lista é atualizada

### Se não funcionar

1. **Verifique se há erro no console do navegador**

2. **Teste se o servidor está emitindo eventos**:
   - Crie um chamado
   - Verifique os logs do Render (botão "Logs" no dashboard)
   - Procure por: "✅ Novo chamado criado: #..."

3. **Verifique configuração CORS** no render.yaml:
```yaml
services:
  - type: web
    name: sistema-ti
    env: node
    buildCommand: npm install
    startCommand: node backend/server.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: CORS_ORIGIN
        value: https://sistema-ti-6zor.onrender.com
```

---

## Checklist de Verificação

### Email
- [ ] Usuário junior tem email cadastrado
- [ ] Variáveis EMAIL_* configuradas no Render
- [ ] Senha de aplicativo do Gmail gerada
- [ ] Redeploy realizado após configurar
- [ ] Teste: criar chamado e verificar recebimento

### Socket.io
- [ ] TV abre sem erro (F12 console limpo)
- [ ] Console mostra "Socket.io conectado"
- [ ] Criar chamado mostra "Novo chamado recebido" no console da TV
- [ ] TV atualiza automaticamente sem refresh manual
- [ ] Overlay "Novo Chamado!" aparece por 5 segundos

---

## Comandos úteis

### Verificar logs no Render
```
Acesse: https://dashboard.render.com/
Clique em: Sistema-Ti → Logs
Filtro: "socket" ou "email"
```

### Teste local
```powershell
# Testar envio de email localmente
node -e "require('./backend/config/email').verify(console.log)"

# Verificar usuários com email
node -e "const db=require('./backend/config/database');db.getAll('SELECT name,email,role FROM users WHERE active=1').then(console.log)"
```

---

## Próximos Passos

1. **Configure as variáveis de email no Render**
2. **Adicione email ao usuário junior**
3. **Faça um teste completo**:
   - Login como desenvolvedor
   - Abra TV em outra janela/aba
   - Crie um novo chamado
   - Verifique:
     - [ ] Email recebido por todos os técnicos
     - [ ] TV atualizou automaticamente
     - [ ] Overlay apareceu
4. **Se tudo funcionar, está pronto para uso! 🎉**
