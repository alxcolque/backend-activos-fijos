/**
 * asset-financials.ts
 * Utilidades de cálculo financiero para activos fijos.
 * Archivo compartido entre repositorios Prisma y MySQL — sin dependencias externas.
 */

export const ASSET_YEAR = 360;

/**
 * Extrae los componentes de fecha (año, mes 0-11, día 1-30) de manera consistente
 * independientemente de si el valor es string YYYY-MM-DD, ISO string o Date.
 */
function extractDateParts(fecha: Date | string): { anio: number; mes: number; dia: number } {
  if (typeof fecha === 'string') {
    const match = fecha.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return {
        anio: parseInt(match[1], 10),
        mes: parseInt(match[2], 10) - 1,
        dia: Math.min(parseInt(match[3], 10), 30),
      };
    }
    const d = new Date(fecha);
    return {
      anio: d.getUTCFullYear(),
      mes: d.getUTCMonth(),
      dia: Math.min(d.getUTCDate(), 30),
    };
  }

  // Si es un objeto Date:
  // Si la hora UTC es 00:00:00 (fecha de base de datos en UTC), usar partes UTC.
  // Si tiene hora local diferente (como new Date() creado dinámicamente en zona horaria local), usar partes locales.
  if (fecha.getUTCHours() === 0 && fecha.getUTCMinutes() === 0 && fecha.getUTCSeconds() === 0) {
    return {
      anio: fecha.getUTCFullYear(),
      mes: fecha.getUTCMonth(),
      dia: Math.min(fecha.getUTCDate(), 30),
    };
  } else {
    return {
      anio: fecha.getFullYear(),
      mes: fecha.getMonth(),
      dia: Math.min(fecha.getDate(), 30),
    };
  }
}

/**
 * Calcula días entre dos fechas usando el método días-360
 * (cada mes = 30 días, cada año = 360 días).
 */
export function dias360(fechaInicio: Date | string, fechaFin: Date | string = new Date()): number {
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);

  if (isNaN(inicio.getTime()) || isNaN(fin.getTime()) || fin <= inicio) {
    return 0;
  }

  const inicioParts = extractDateParts(fechaInicio);
  const finParts = extractDateParts(fechaFin);

  const resultado =
    (finParts.anio - inicioParts.anio) * 360 +
    (finParts.mes - inicioParts.mes) * 30 +
    (finParts.dia - inicioParts.dia);

  return Math.max(0, resultado);
}

/**
 * Calcula depreciación, depreciación acumulada y balance de un activo.
 */
export function calculateFinancials(
  purchaseValueNum: number | null | undefined,
  purchaseDateVal: Date | string | null | undefined,
  usefulLifeVal: number | null | undefined,
  currentDateVal: Date | string | null | undefined = new Date(),
) {
  const purchaseValue = purchaseValueNum ? Number(purchaseValueNum) : 0;
  const avu = usefulLifeVal && Number(usefulLifeVal) > 0 ? Number(usefulLifeVal) : 5;

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
