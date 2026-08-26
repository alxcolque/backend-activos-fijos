/**
 * asset-financials.ts
 * Utilidades de cálculo financiero y depreciación para activos fijos.
 * Estrictamente sincronizado con la zona horaria institucional de Bolivia (America/La_Paz).
 */

export const ASSET_YEAR = 360;
const SYSTEM_TIMEZONE = process.env.TZ || 'America/La_Paz';

/**
 * Extrae año, mes (0-11) y día (1-30/31) de manera estricta respetando la zona horaria America/La_Paz.
 * Criterio 360 días comerciales: El día 31 de cualquier mes equivale al día 1 del mes siguiente
 * para efectos del cálculo de depreciación acumulada.
 */
function extractDateParts(fecha: Date | string): { anio: number; mes: number; dia: number } {
  if (!fecha) {
    throw new Error('[Financial Error] Se requiere una fecha válida para extraer componentes de fecha.');
  }

  let anio: number;
  let mes: number;
  let dia: number;

  // 1. Si la fecha viene en formato 'YYYY-MM-DD' de base de datos o input
  if (typeof fecha === 'string') {
    const match = fecha.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      anio = parseInt(match[1], 10);
      mes = parseInt(match[2], 10) - 1;
      dia = parseInt(match[3], 10);
    } else {
      const d = new Date(fecha);
      if (isNaN(d.getTime())) {
        throw new Error(`[Financial Error] Formato de fecha no válido: ${fecha}`);
      }
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: SYSTEM_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(d).split('-');
      anio = parseInt(parts[0], 10);
      mes = parseInt(parts[1], 10) - 1;
      dia = parseInt(parts[2], 10);
    }
  } else {
    // 2. Si es objeto Date o ISO Timestamp, convertir según la zona horaria del sistema (America/La_Paz)
    const d = fecha;
    if (isNaN(d.getTime())) {
      throw new Error(`[Financial Error] Formato de fecha no válido: ${fecha}`);
    }

    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: SYSTEM_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d).split('-');

    anio = parseInt(parts[0], 10);
    mes = parseInt(parts[1], 10) - 1;
    dia = parseInt(parts[2], 10);
  }

  // Regla comercial de 360 días: El día 31 de cualquier mes no añade un día extra comercial,
  // sino que equivale exactamente al día 1 del mes siguiente (30 días comerciales completados).
  if (dia === 31) {
    dia = 1;
    mes += 1;
    if (mes > 11) {
      mes = 0;
      anio += 1;
    }
  }

  return { anio, mes, dia };
}

/**
 * Calcula días transcurridos entre dos fechas usando el método financiero Días-360 (360 días por año / 30 por mes).
 */
export function dias360(
  fechaInicio: Date | string | null | undefined,
  fechaFin: Date | string | null | undefined = new Date(),
): number {
  if (!fechaInicio) {
    return 0;
  }

  const inicioParts = extractDateParts(fechaInicio);
  const finParts = extractDateParts(fechaFin || new Date());

  const resultado =
    (finParts.anio - inicioParts.anio) * 360 +
    (finParts.mes - inicioParts.mes) * 30 +
    (finParts.dia - inicioParts.dia);

  return Math.max(0, resultado);
}

/**
 * Calcula depreciación (%), depreciación acumulada (Bs.) y saldo/valor neto (Bs.) de un activo.
 */
export function calculateFinancials(
  purchaseValueNum: number | null | undefined, //valor de adquisición del activo
  purchaseDateVal: Date | string | null | undefined, //fecha de adquisición del activo
  usefulLifeVal: number | null | undefined, //vida útil del activo
  currentDateVal?: Date | string | null, //fecha actual
): { dep: number; depac: number; balance: number } {
  const purchaseValue = Number(purchaseValueNum || 0);
  if (isNaN(purchaseValue) || purchaseValue < 0) {
    console.error(`[Financial Error] El valor de compra (purchaseValue) no es válido: ${purchaseValueNum}`);
  }

  const avu = Number(usefulLifeVal || 0) > 0 ? Number(usefulLifeVal) : 5;
  if (!usefulLifeVal || usefulLifeVal <= 0) {
    console.warn(`[Financial Warning] Vida útil inválida o ausente (${usefulLifeVal}), aplicando valor estándar de 5 años`);
  }

  const dpd = 100 / (avu * ASSET_YEAR);
  const dep = (100 / (ASSET_YEAR * avu)) * ASSET_YEAR;
  const ndu = purchaseDateVal ? dias360(purchaseDateVal, currentDateVal || new Date()) : 0;
  const au = ndu / ASSET_YEAR;

  let depac = 0;
  if (purchaseValue > 0) {
    if (au >= avu) {
      depac = purchaseValue - 1;
    } else {
      depac = Math.min(purchaseValue - 1, ((dpd * purchaseValue) / 100) * ndu);
    }
  }

  const balance = Math.max(0, purchaseValue - depac);

  return {
    dep: Number(dep.toFixed(2)),
    depac: Number(depac.toFixed(2)),
    balance: Number(balance.toFixed(2)),
  };
}
