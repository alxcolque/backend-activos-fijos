#!/bin/sh

# Script de restauración de respaldo de MySQL
if [ -z "$1" ]; then
  echo "Uso: ./scripts/restore.sh <archivo_respaldo.sql>"
  exit 1
fi

BACKUP_FILE=$1

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "Error: El archivo ${BACKUP_FILE} no existe."
  exit 1
fi

echo "Restaurando base de datos desde ${BACKUP_FILE}..."

docker exec -i mysql_activos mysql -u root -ppassword activos_fijos < ${BACKUP_FILE}

if [ $? -eq 0 ]; then
  echo "Restauración completada exitosamente."
else
  echo "Error durante la restauración."
  exit 1
fi
