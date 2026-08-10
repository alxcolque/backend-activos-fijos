/**
 * asset-financials.ts
 * Utilidades de cálculo financiero para activos fijos.
 * Archivo compartido entre repositorios Prisma y MySQL — sin dependencias externas.
 */

export const ASSET_YEAR = 360;

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

  const isISOInicio = typeof fechaInicio === 'string' && (fechaInicio.includes('T') || fechaInicio.includes('Z'));
  const diaInicio = Math.min(isISOInicio ? inicio.getUTCDate() : inicio.getDate(), 30);
  const mesInicio = isISOInicio ? inicio.getUTCMonth() : inicio.getMonth();
  const anioInicio = isISOInicio ? inicio.getUTCFullYear() : inicio.getFullYear();

  const isISOFin = typeof fechaFin === 'string' && (fechaFin.includes('T') || fechaFin.includes('Z'));
  const diaFin = Math.min(isISOFin ? fin.getUTCDate() : fin.getDate(), 30);
  const mesFin = isISOFin ? fin.getUTCMonth() : fin.getMonth();
  const anioFin = isISOFin ? fin.getUTCFullYear() : fin.getFullYear();

  const resultado =
    (anioFin - anioInicio) * 360 +
    (mesFin - mesInicio) * 30 +
    (diaFin - diaInicio);

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
