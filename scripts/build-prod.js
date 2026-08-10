/**
 * build-prod.js
 * Script de compilación para producción (cPanel / Linux).
 * Reemplaza la factory de repositorios con la versión mysql2 (sin Prisma)
 * y compila TypeScript usando tsconfig.prod.json.
 *
 * Uso: node scripts/build-prod.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const FACTORY_PATH = path.join(ROOT, 'src', 'infrastructure', 'database', 'repository.factory.ts');
const FACTORY_PROD_PATH = path.join(ROOT, 'src', 'infrastructure', 'database', 'repository.factory.prod.ts');
const FACTORY_BACKUP_PATH = FACTORY_PATH + '.dev.bak';

// 1. Hacer backup de la factory de desarrollo
if (fs.existsSync(FACTORY_PATH)) {
  fs.copyFileSync(FACTORY_PATH, FACTORY_BACKUP_PATH);
  console.log('🔁 Backup de repository.factory.ts guardado como .dev.bak');
}

// 2. Reemplazar con la factory de producción (solo mysql2)
fs.copyFileSync(FACTORY_PROD_PATH, FACTORY_PATH);
console.log('✅ repository.factory.ts reemplazado con la versión de producción (mysql2)');

// 3. Compilar TypeScript con tsconfig.prod.json (excluye repositorios Prisma)
try {
  console.log('🔨 Compilando TypeScript para producción...');
  execSync('npx tsc -p tsconfig.prod.json', { stdio: 'inherit', cwd: ROOT });
  console.log('✅ Compilación exitosa → dist/');
} catch (err) {
  console.error('❌ Error durante la compilación');
  // Restaurar factory original antes de salir
  if (fs.existsSync(FACTORY_BACKUP_PATH)) {
    fs.copyFileSync(FACTORY_BACKUP_PATH, FACTORY_PATH);
    fs.unlinkSync(FACTORY_BACKUP_PATH);
    console.log('🔁 Factory de desarrollo restaurada');
  }
  process.exit(1);
}

// 4. Restaurar la factory de desarrollo (solo en entorno local)
if (fs.existsSync(FACTORY_BACKUP_PATH)) {
  fs.copyFileSync(FACTORY_BACKUP_PATH, FACTORY_PATH);
  fs.unlinkSync(FACTORY_BACKUP_PATH);
  console.log('🔁 Factory de desarrollo restaurada (entorno local)');
}

console.log('\n🚀 Build de producción completado. Ejecutar: node dist/server.js');
