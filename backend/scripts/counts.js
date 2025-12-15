const { db } = require('../config/database');

function get(sql){
  return new Promise((resolve,reject)=> db.get(sql,[],(e,r)=> e?reject(e):resolve(r)));
}

(async()=>{
  try{
    const t = await get('SELECT COUNT(*) as c FROM tickets');
    const c = await get('SELECT COUNT(*) as c FROM comments');
    const h = await get('SELECT COUNT(*) as c FROM status_history');
    const u = await get('SELECT COUNT(*) as c FROM users');
    console.log({ tickets: t.c, comments: c.c, history: h.c, users: u.c });
  }catch(e){
    console.error(e.message);
  }finally{
    db.close();
  }
})();
