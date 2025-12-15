require('dotenv').config();
const { db, getOne } = require('../config/database');

const run = (sql, params=[]) => new Promise((resolve,reject)=>{
  db.run(sql, params, function(err){ if(err) return reject(err); resolve(this.lastID || this.changes); });
});

(async()=>{
  try{
    const uidTiago = (await getOne("SELECT id FROM users WHERE name = ?", ['tiago']))?.id || null;
    const uidJunior = (await getOne("SELECT id FROM users WHERE name = ?", ['junior']))?.id || null;

    const now = Date.now();
    const rnd = () => Math.floor(1000+Math.random()*9000);
    const tn = () => `TITV${now}${rnd()}`;

    const rows = [
      { subject:'Impressora sem funcionar', category:'Hardware', priority:'media', status:'aberto', dept:'Escritório' },
      { subject:'Erro no ERP', category:'Software', priority:'alta', status:'aberto', dept:'Financeiro' },
      { subject:'Sem acesso à VPN', category:'Rede', priority:'urgente', status:'em_andamento', dept:'Diretoria', assigned_to: uidTiago },
      { subject:'Criar usuário no AD', category:'Acesso', priority:'baixa', status:'em_andamento', dept:'RH', assigned_to: uidJunior },
      { subject:'Outlook travando', category:'Email', priority:'media', status:'resolvido', dept:'Comercial' },
      { subject:'Lentidão geral', category:'Software', priority:'alta', status:'aberto', dept:'Operação' },
      { subject:'Cabeamento novo', category:'Rede', priority:'baixa', status:'fechado', dept:'Infra' },
      { subject:'Instalar Office', category:'Instalacao', priority:'media', status:'aberto', dept:'Compras' }
    ];

    let created=0;
    for (const r of rows){
      await run(`INSERT INTO tickets (
        ticket_number, requester_name, requester_email, requester_phone, department,
        category, priority, subject, description, status, assigned_to
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?)`, [
        tn(), 'Usuário TV', 'tv@example.com', null, r.dept,
        r.category, r.priority, r.subject, `${r.subject} - gerado para demonstração da TV`, r.status, r.assigned_to || null
      ]);
      created++;
    }

    console.log(`✅ Inseridos ${created} chamados de exemplo.`);
  }catch(e){
    console.error('❌ Erro ao semear:', e.message);
    process.exitCode = 1;
  }finally{ db.close(); }
})();
