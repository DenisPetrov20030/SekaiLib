const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const backupsDir = path.join(__dirname, '..', 'backups');

const arg = process.argv[2];

if (!arg) {
  if (!fs.existsSync(backupsDir)) {
    console.error('No backups directory found.');
    process.exit(1);
  }

  const files = fs.readdirSync(backupsDir)
    .filter(f => f.endsWith('.sql'))
    .sort()
    .reverse();

  if (files.length === 0) {
    console.error('No backup files found in backups/');
    process.exit(1);
  }

  console.log('Available backups:');
  files.forEach((f, i) => console.log(`  ${i === 0 ? '[latest] ' : '         '}${f}`));
  console.log('\nUsage: npm run db:restore -- <filename>');
  console.log(`       npm run db:restore -- ${files[0]}`);
  process.exit(0);
}

const filepath = path.isAbsolute(arg)
  ? arg
  : fs.existsSync(arg)
    ? path.resolve(arg)
    : path.join(backupsDir, arg);

if (!fs.existsSync(filepath)) {
  console.error(`File not found: ${filepath}`);
  process.exit(1);
}

// Detect data-only dumps by reading the first 4KB of the file
const header = fs.readFileSync(filepath, { encoding: 'utf8', flag: 'r' }).slice(0, 4096);
const isDataOnly = !header.includes('CREATE TABLE');

console.log(`Restoring from: ${path.basename(filepath)}`);
console.log(`Mode: ${isDataOnly ? 'data-only' : 'full dump'}`);

if (isDataOnly) {
  // Schema stays intact — just wipe all data in Docker via TRUNCATE CASCADE
  console.log('Truncating all tables...');
  execSync(
    `docker compose exec -T db psql -U user sekailib_db -c ` +
    `"DO $$ DECLARE r RECORD; BEGIN FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') ` +
    `LOOP EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE'; END LOOP; END $$;"`,
    { stdio: 'inherit' }
  );
} else {
  // Full dump — drop everything and let the dump recreate the schema
  console.log('Dropping and recreating schema...');
  execSync(
    `docker compose exec -T db psql -U user sekailib_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"`,
    { stdio: 'inherit' }
  );
}

console.log('Applying backup...');

// PG17 psql runs in restricted mode when reading a -f script, which blocks \copy.
// Prepend \unrestrict to unlock it before sending to the container.
const os = require('os');
const tmpLocal = path.join(os.tmpdir(), 'restore_unrestricted.sql');
const fileContent = fs.readFileSync(filepath);
fs.writeFileSync(tmpLocal, Buffer.concat([Buffer.from('\\unrestrict\n'), fileContent]));

const containerId = execSync('docker compose ps -q db', { encoding: 'utf8' }).trim();
execSync(`docker cp "${tmpLocal}" ${containerId}:/tmp/restore.sql`);
fs.unlinkSync(tmpLocal);

try {
  execSync(
    `docker compose exec -T db psql -U user -d sekailib_db -f /tmp/restore.sql`,
    { stdio: 'inherit' }
  );
} finally {
  execSync(`docker compose exec -T db rm -f /tmp/restore.sql`);
}

console.log(`\nRestore complete: ${path.basename(filepath)}`);
