require('dotenv').config();
const path = require('path');
const { db } = require('../config/database');

console.log('🧹 Limpando dados de chamados...');

const run = (sql, params=[]) => new Promise((resolve, reject) => {
  db.run(sql, params, function(err){
    if (err) return reject(err);
    resolve(this.changes || 0);
  });
});

(async () => {
  try {
    // Desligar verificações de foreign keys durante limpeza
    await run('PRAGMA foreign_keys = OFF');

    const deletedComments = await run('DELETE FROM comments');
    const deletedHistory = await run('DELETE FROM status_history');
    const deletedTickets = await run('DELETE FROM tickets');

    // Reativar foreign keys
    await run('PRAGMA foreign_keys = ON');

    console.log(`✅ Limpeza concluída: tickets=${deletedTickets}, comments=${deletedComments}, history=${deletedHistory}`);

    // Opcional: limpar uploads (somente arquivos gerados pelo app)
    // Mantemos por segurança. Se quiser apagar, descomente abaixo.
    // const fs = require('fs');
    // const uploadsDir = path.join(__dirname, '../../uploads');
    // if (fs.existsSync(uploadsDir)) {
    //   for (const f of fs.readdirSync(uploadsDir)) {
    //     fs.unlinkSync(path.join(uploadsDir, f));
    //   }
    //   console.log('🗑️  Uploads limpos');
    // }

  } catch (err) {
    console.error('❌ Erro ao limpar dados:', err.message);
    process.exitCode = 1;
  } finally {
    db.close();
  }
})();
