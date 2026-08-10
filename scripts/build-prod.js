/**
 * build-prod.js
 * Script de compilación para producción (cPanel / Linux).
 *
 * Pasos:
 *  1. Reemplaza repository.factory.ts con la versión mysql2 (sin Prisma)
 *  2. Reemplaza prisma.service.ts con el stub de producción (sin @prisma/client)
 *  3. Compila TypeScript con tsconfig.prod.json (excluye repos Prisma)
 *  4. Restaura los archivos originales (solo en local; en servidor no importa)
 *
 * Uso: node scripts/build-prod.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DB_DIR = path.join(ROOT, 'src', 'infrastructure', 'database');

// --- repository.factory.ts ---
const FACTORY       = path.join(DB_DIR, 'repository.factory.ts');
const FACTORY_PROD  = path.join(DB_DIR, 'repository.factory.prod.ts');
const FACTORY_BAK   = FACTORY + '.dev.bak';

// --- prisma.service.ts ---
const PRISMA_SVC      = path.join(DB_DIR, 'prisma.service.ts');
const PRISMA_SVC_PROD = path.join(DB_DIR, 'prisma.service.prod.ts');
const PRISMA_SVC_BAK  = PRISMA_SVC + '.dev.bak';

function backup(src, bak) {
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, bak);
    console.log(`🔁 Backup: ${path.basename(src)} → ${path.basename(bak)}`);
  }
}

function restore(bak, dest) {
  if (fs.existsSync(bak)) {
    fs.copyFileSync(bak, dest);
    fs.unlinkSync(bak);
    console.log(`🔁 Restaurado: ${path.basename(dest)}`);
  }
}

// 1. Backup + reemplazo de archivos
backup(FACTORY, FACTORY_BAK);
fs.copyFileSync(FACTORY_PROD, FACTORY);
console.log('✅ repository.factory.ts → versión producción (mysql2)');

backup(PRISMA_SVC, PRISMA_SVC_BAK);
fs.copyFileSync(PRISMA_SVC_PROD, PRISMA_SVC);
console.log('✅ prisma.service.ts → stub de producción (sin @prisma/client)');

// 2. Compilar TypeScript con tsconfig.prod.json
try {
  console.log('\n🔨 Compilando TypeScript para producción...');
  execSync('npx tsc -p tsconfig.prod.json', { stdio: 'inherit', cwd: ROOT });
  console.log('✅ Compilación exitosa → dist/\n');
} catch (err) {
  console.error('\n❌ Error durante la compilación. Restaurando archivos originales...');
  restore(FACTORY_BAK, FACTORY);
  restore(PRISMA_SVC_BAK, PRISMA_SVC);
  process.exit(1);
}

// 3. Restaurar archivos originales (útil en entorno local)
restore(FACTORY_BAK, FACTORY);
restore(PRISMA_SVC_BAK, PRISMA_SVC);

console.log('🚀 Build de producción completado. Ejecutar: node dist/server.js');
