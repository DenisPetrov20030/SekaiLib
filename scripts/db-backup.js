const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const backupsDir = path.join(__dirname, '..', 'backups');
if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir);

const dataOnly = process.argv.includes('--data-only');
const full = process.argv.includes('--full');

// Default: data-only (schema is managed by EF migrations)
const useDataOnly = dataOnly || !full;

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const suffix = useDataOnly ? '' : '-full';
const filename = `backup${suffix}-${timestamp}.sql`;
const filepath = path.join(backupsDir, filename);

console.log(`Creating ${useDataOnly ? 'data-only' : 'full'} backup: ${filename}`);

const flags = useDataOnly ? '--data-only' : '--no-owner --no-privileges';

execSync(
  `docker compose exec -T db pg_dump -U user ${flags} sekailib_db`,
  { stdio: ['ignore', fs.openSync(filepath, 'w'), 'inherit'] }
);

const size = (fs.statSync(filepath).size / 1024).toFixed(1);
console.log(`Done: backups/${filename} (${size} KB)`);
