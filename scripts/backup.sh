#!/bin/sh

# Script de respaldo automatizado de MySQL para Activos Fijos COMIBOL
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_DIR="./backups"
FILE_NAME="backup_activos_fijos_${DATE}.sql"

mkdir -p ${BACKUP_DIR}

echo "Iniciando respaldo de base de datos..."

docker exec mysql_activos mysqldump -u root -ppassword activos_fijos > ${BACKUP_DIR}/${FILE_NAME}

if [ $? -eq 0 ]; then
  echo "Respaldo completado exitosamente: ${BACKUP_DIR}/${FILE_NAME}"
else
  echo "Error al generar el respaldo de la base de datos."
  exit 1
fi
