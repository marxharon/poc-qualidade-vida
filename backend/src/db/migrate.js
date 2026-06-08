import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from './index.js';

async function main() {
  console.log('Aplicando migrações no banco de dados...');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('Migrações aplicadas com sucesso! As tabelas foram criadas.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Erro ao aplicar migrações:', err);
  process.exit(1);
});