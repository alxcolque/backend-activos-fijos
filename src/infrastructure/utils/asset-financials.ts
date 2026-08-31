/**
 * asset-financials.ts
 * Financial calculation and depreciation utilities for fixed assets.
 * Strictly synchronized with Bolivia's institutional time zone (America/La_Paz).
 */

export const ASSET_YEAR = 360;
const SYSTEM_TIMEZONE = process.env.TZ || 'America/La_Paz';

export interface DateParts {
  year: number;
  month: number; // 0-indexed (0 = January, 11 = December)
  day: number;
}

export interface FinancialCalculationResult {
  dep: number;     // Annual depreciation percentage (%)
  depac: number;   // Accumulated depreciation in local currency (Bs.)
  balance: number; // Net book value / remaining balance in local currency (Bs.)
}

/**
 * Strictly extracts year, month (0-11), and day using the America/La_Paz time zone.
 * 
 * Commercial 360-day Calendar Rules:
 * - If `isAcquisitionDate` is true: converts the day to the 1st of the same month (e.g., 31/08/2023 -> 01/08/2023).
 * - If `isAcquisitionDate` is false: applies the 360-day rule for calculation cut-off dates (day 31 equals day 1 of next month).
 *
 * @param date - Date object or ISO string (YYYY-MM-DD).
 * @param isAcquisitionDate - Flag indicating whether the date is an asset acquisition date.
 * @returns DateParts object with year, month, and day.
 */
function extractDateParts(
  date: Date | string,
  isAcquisitionDate: boolean = false,
): DateParts {
  if (!date) {
    throw new Error('[Financial Error] A valid date is required to extract date components.');
  }

  let year: number;
  let month: number;
  let day: number;

  // 1. String inputs (e.g., 'YYYY-MM-DD' from DB or client input)
  if (typeof date === 'string') {
    const match = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      year = parseInt(match[1], 10);
      month = parseInt(match[2], 10) - 1;
      day = parseInt(match[3], 10);
    } else {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        throw new Error(`[Financial Error] Invalid date format: ${date}`);
      }
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: SYSTEM_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(parsedDate).split('-');
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      day = parseInt(parts[2], 10);
    }
  } else {
    // 2. Date object or ISO Timestamp
    const parsedDate = date;
    if (isNaN(parsedDate.getTime())) {
      throw new Error(`[Financial Error] Invalid date format: ${date}`);
    }

    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: SYSTEM_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(parsedDate).split('-');

    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10) - 1;
    day = parseInt(parts[2], 10);
  }

  if (isAcquisitionDate) {
    // Condición 1: Si el día de la fecha es menor o igual a 30 -> cambiar el día a 1 del mismo mes.
    // Condición 2: Si el día del mes es 31 -> pasa a 1 del siguiente mes.
    if (day <= 30) {
      day = 1;
    } else if (day === 31) {
      day = 1;
      month += 1;
      if (month > 11) {
        month = 0;
        year += 1;
      }
    }
  } else {
    // Regla comercial 360 días para fecha de corte/cálculo: si el día es 31 pasa a 1 del siguiente mes
    if (day === 31) {
      day = 1;
      month += 1;
      if (month > 11) {
        month = 0;
        year += 1;
      }
    }
  }

  return { year, month, day };
}

/**
 * Calculates elapsed days between two dates using the 30/360 commercial convention (360 days/year, 30 days/month).
 * 
 * @param startDate - Acquisition date of the asset.
 * @param endDate - Calculation / cut-off date (defaults to current date).
 * @returns Number of elapsed commercial days (>= 0).
 */
export function days360(
  startDate: Date | string | null | undefined,
  endDate: Date | string | null | undefined = new Date(),
): number {
  if (!startDate) {
    return 0;
  }

  const startParts = extractDateParts(startDate, true);
  const endParts = extractDateParts(endDate || new Date(), false);

  const totalDays =
    (endParts.year - startParts.year) * ASSET_YEAR +
    (endParts.month - startParts.month) * 30 +
    (endParts.day - startParts.day);

  return Math.max(0, totalDays);
}

/** Backward compatibility alias for Spanish callers */
export const dias360 = days360;

/**
 * Calculates depreciation rate (%), accumulated depreciation (Bs.), and net book value / balance (Bs.) for a fixed asset.
 * Todo se obtiene estrictamente de los valores pasados de la BD sin asumir valores por defecto.
 * 
 * @param purchaseValueInput - Initial purchase/acquisition value of the asset from DB.
 * @param purchaseDateInput - Date when the asset was purchased from DB.
 * @param usefulLifeInput - Useful life of the asset in years from DB category.
 * @param currentDateInput - Evaluation date (defaults to current date if cut-off date is requested).
 * @returns Object containing annual depreciation percentage (`dep`), accumulated depreciation (`depac`), and net balance (`balance`).
 */
export function calculateFinancials(
  purchaseValueInput: number | null | undefined,
  purchaseDateInput: Date | string | null | undefined,
  usefulLifeInput: number | null | undefined,
  currentDateInput?: Date | string | null,
): FinancialCalculationResult {
  const purchaseValue = Number(purchaseValueInput || 0);
  const usefulLifeYears = Number(usefulLifeInput || 0);

  // Manejo de errores: Si el valor de compra es inválido o negativo
  if (isNaN(purchaseValue) || purchaseValue < 0) {
    console.error(`[Financial Error] Valor de compra inválido: ${purchaseValueInput}`);
  }

  // Manejo de errores: Si la vida útil de la BD es <= 0 o inválida, NO se asume ningún valor por defecto (como 5 años)
  if (isNaN(usefulLifeYears) || usefulLifeYears <= 0) {
    console.error(`[Financial Error] Vida útil no válida o ausente en la base de datos (${usefulLifeInput}). Imposible depreciar sin vida útil configurada.`);
    return {
      dep: 0,
      depac: 0,
      balance: Math.max(0, isNaN(purchaseValue) ? 0 : purchaseValue),
    };
  }

  const dailyDepreciationRate = 100 / (usefulLifeYears * ASSET_YEAR);
  const annualDepreciationRate = 100 / usefulLifeYears;

  let elapsedDays = 0;
  if (purchaseDateInput) {
    try {
      elapsedDays = days360(purchaseDateInput, currentDateInput);
    } catch (err: any) {
      console.error(`[Financial Error] Error al procesar fecha de compra: ${purchaseDateInput}`, err?.message);
      elapsedDays = 0;
    }
  }

  const elapsedYears = elapsedDays / ASSET_YEAR;

  let accumulatedDepreciation = 0;
  if (purchaseValue > 0) {
    if (elapsedYears >= usefulLifeYears) {
      // Retener valor residual mínimo de 1 Bs. al estar totalmente depreciado
      accumulatedDepreciation = Math.max(0, purchaseValue - 1);
    } else {
      accumulatedDepreciation = Math.min(
        Math.max(0, purchaseValue - 1),
        ((dailyDepreciationRate * purchaseValue) / 100) * elapsedDays,
      );
    }
  }

  const netBookValue = Math.max(0, purchaseValue - accumulatedDepreciation);

  return {
    dep: Number(annualDepreciationRate.toFixed(2)),
    depac: Number(accumulatedDepreciation.toFixed(2)),
    balance: Number(netBookValue.toFixed(2)),
  };
}
