# Guía de Despliegue y Ejecución con Docker
**Proyecto:** Backend Sistema de Gestión de Activos Fijos COMIBOL  
**Tecnologías:** Node.js 22 + Fastify + Prisma + MySQL 8 + Nginx + Docker  

---

## 🚀 1. Despliegue en Entorno de Desarrollo (Docker Compose)

### Paso 1: Configurar variables de entorno
```bash
cp .env.example .env
```

### Paso 2: Iniciar servicios con Docker Compose
```bash
docker compose up --build -d
```

### Paso 3: Ejecutar migraciones y datos semilla (Seed)
```bash
docker compose exec backend-activos npx prisma migrate dev
docker compose exec backend-activos npx prisma db seed
```

### Paso 4: Verificar funcionamiento
- **API Health Check:** `http://localhost:3000/api/v1/health`
- **Swagger Documentation:** `http://localhost:3000/docs`

---

## 🏭 2. Despliegue en Entorno de Producción

### Paso 1: Configurar variables de producción
```bash
cp .env.production.example .env.production
```
*Edite `.env.production` configurando passwords seguros, `JWT_SECRET` largo y `CORS_ORIGIN` del dominio oficial.*

### Paso 2: Iniciar stack de producción (Nginx + API + MySQL)
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### Paso 3: Aplicar migraciones automáticas en producción
```bash
docker compose -f docker-compose.prod.yml exec backend-activos npx prisma migrate deploy
```

---

## 💾 3. Respaldos y Restauración de Base de Datos

### Generar respaldo SQL:
```bash
npm run backup
# o directamente:
sh ./scripts/backup.sh
```
*Los respaldos se almacenarán en la carpeta `./backups/`.*

### Restaurar respaldo SQL:
```bash
sh ./scripts/restore.sh ./backups/backup_activos_fijos_2026-08-02.sql
```

---

## 🛠️ 4. Comandos Útiles

```bash
# Ver logs en vivo de los contenedores
npm run docker:logs

# Detener los contenedores
npm run docker:down

# Compilar proyecto TypeScript localmente
npm run build
```
