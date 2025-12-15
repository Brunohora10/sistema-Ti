const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '../../backups');
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../database/tickets.db');
const BACKUP_DAYS_RETENTION = parseInt(process.env.BACKUP_DAYS_RETENTION || '7', 10);

// Criar diretório de backups se não existir
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log('📁 Diretório de backups criado');
}

// Executar backup
function performBackup() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      console.log('⚠️  Banco de dados não encontrado para backup');
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const time = new Date().toLocaleTimeString('pt-BR', { hour12: false }).replace(/:/g, '-');
    const backupFilename = `backup_${timestamp}_${time}${path.extname(DB_PATH) || '.db'}`;
    const backupPath = path.join(BACKUP_DIR, backupFilename);

    // Copiar arquivo do banco
    fs.copyFileSync(DB_PATH, backupPath);

    console.log(`✅ Backup realizado: ${backupFilename}`);

    // Limpar backups antigos
    cleanOldBackups();

  } catch (error) {
    console.error('❌ Erro ao fazer backup:', error.message);
  }
}

// Limpar backups antigos (manter últimos N dias)
function cleanOldBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const now = Date.now();
    const maxAge = BACKUP_DAYS_RETENTION * 24 * 60 * 60 * 1000;

    files.forEach(file => {
      const filepath = path.join(BACKUP_DIR, file);
      const stat = fs.statSync(filepath);
      const age = now - stat.mtime.getTime();

      if (age > maxAge) {
        fs.unlinkSync(filepath);
        console.log(`🗑️  Backup antigo removido: ${file}`);
      }
    });

  } catch (error) {
    console.error('❌ Erro ao limpar backups:', error.message);
  }
}

// Agendar backup diário às 2 da manhã
function startBackupSchedule() {
  // Executar backup uma vez ao iniciar
  console.log('🔄 Iniciando agendamento de backups...');
  performBackup();

  // Executar todos os dias às 2:00 AM
  cron.schedule('0 2 * * *', () => {
    console.log('📊 Executando backup agendado...');
    performBackup();
  });

  console.log('✅ Backup agendado para 02:00 todos os dias');
  console.log(`📁 Local dos backups: ${BACKUP_DIR}`);
  console.log(`🔐 Retenção: ${BACKUP_DAYS_RETENTION} dias`);
}

module.exports = {
  startBackupSchedule,
  performBackup,
  BACKUP_DIR
};
