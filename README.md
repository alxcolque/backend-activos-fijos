# Backend — Sistema de Gestión de Activos Fijos COMIBOL

API REST basada en **Node.js**, **Fastify**, **TypeScript** y **Prisma ORM** (MySQL) con arquitectura modular.

## Requisitos Previos

- Node.js >= 20 LTS
- MySQL 8.0

## Inicio Rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env

# 3. Generar cliente de Prisma
npm run prisma:generate

# 4. Iniciar en modo desarrollo
npm run dev
```

## Documentación API

Una vez en ejecución, la documentación interactiva Swagger estará disponible en:
`http://localhost:3000/docs`

## Health Check

Endpoint de verificación de estado:
`GET http://localhost:3000/api/v1/health`
