const ExcelJS = require('exceljs');
import fs from 'fs';
import path from 'path';
import { env } from '../../infrastructure/config/env';

export const generateAssetsExcelReport = async (
  assets: any[],
  options?: { calculationDate?: string | Date | null },
): Promise<Buffer> => {
  const timeZone = env.TZ || process.env.TZ || 'America/La_Paz';
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'COMIBOL';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Activos Fijos', {
    pageSetup: { paperSize: 9, orientation: 'landscape' }, // A4 Landscape
  });

  // Ajustar altura de filas iniciales (1 - 6) para un diseño amplio y ordenado
  worksheet.getRow(1).height = 24; // CORPORACIÓN MINERA DE BOLIVIA
  worksheet.getRow(2).height = 20; // DIRECCIÓN DE PROYECTOS Y GEOLOGÍA
  worksheet.getRow(3).height = 22; // REPORTE DE INVENTARIO DE ACTIVOS FIJOS
  worksheet.getRow(4).height = 18; // Fecha de Generación / Cálculo
  worksheet.getRow(5).height = 14; // Fila separadora vacía
  worksheet.getRow(6).height = 32; // Encabezados de la tabla

  // 1. Cargar e Insertar Logo Oficial COMIBOL exactamente en A1 (col: 0, row: 0)
  const logoPaths = [
    path.join(process.cwd(), 'public', 'logo.png'),
    path.join(__dirname, '..', '..', '..', 'public', 'logo.png'),
  ];

  let logoPath: string | null = null;
  for (const p of logoPaths) {
    if (fs.existsSync(p)) {
      logoPath = p;
      break;
    }
  }

  if (logoPath) {
    const logoBuffer = fs.readFileSync(logoPath);
    const imageId = workbook.addImage({
      buffer: logoBuffer as any,
      extension: 'png',
    });

    worksheet.addImage(imageId, {
      tl: { col: 0, row: 0 }, // Posicionado exactamente en la celda A1
      ext: { width: 60, height: 60 },
      editAs: 'oneCell',
    });
  }

  // 2. Encabezados de Texto del Documento (columna C para alineación perfecta con el logo)
  worksheet.getCell('C1').value = 'CORPORACIÓN MINERA DE BOLIVIA';
  worksheet.getCell('C1').font = { name: 'Arial', size: 16, bold: true, color: { argb: '000000' } };
  worksheet.getCell('C1').alignment = { vertical: 'middle', horizontal: 'left' };

  worksheet.getCell('C2').value = 'DIRECCIÓN DE PROYECTOS Y GEOLOGÍA';
  worksheet.getCell('C2').font = { name: 'Arial', size: 13, bold: true, color: { argb: '334155' } };
  worksheet.getCell('C2').alignment = { vertical: 'middle', horizontal: 'left' };

  worksheet.getCell('C3').value = 'REPORTE DE INVENTARIO DE ACTIVOS FIJOS';
  worksheet.getCell('C3').font = { name: 'Arial', size: 13, bold: true, color: { argb: '1E3A8A' } };
  worksheet.getCell('C3').alignment = { vertical: 'middle', horizontal: 'left' };

  const now = new Date();
  const dateStr = now.toLocaleDateString('es-BO', { timeZone });
  const timeStr = now.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', timeZone });
  let calcLabel = `Fecha de Generación: ${dateStr}, ${timeStr}`;

  if (options?.calculationDate) {
    let datePart = '';
    if (typeof options.calculationDate === 'string') {
      datePart = options.calculationDate.split('T')[0];
    } else if (options.calculationDate instanceof Date) {
      const d = options.calculationDate;
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      datePart = `${y}-${m}-${day}`;
    } else {
      datePart = String(options.calculationDate).split('T')[0];
    }
    const parts = datePart.split('-');
    const formattedCalcDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : datePart;
    calcLabel = `Calculado al: ${formattedCalcDate}`;
  }

  worksheet.getCell('C4').value = calcLabel;
  worksheet.getCell('C4').font = { name: 'Arial', size: 9, italic: true, color: { argb: '64748B' } };
  worksheet.getCell('C4').alignment = { vertical: 'middle', horizontal: 'left' };

  // 3. Encabezados de la Tabla (Fila 6)
  const headers = [
    'N°',
    'Código',
    'Nombre del Activo',
    'Categoría',
    'Estado Técnico',
    'Ubicación Física',
    'Cantidad',
    'Salidas',
    'Disponibles',
    'Unidad',
    'Fecha Adquisición',
    'Valor Compra (Bs.)',
    'Depreciación (%)',
    'Dep. Acumulada (Bs.)',
    'Saldo / Valor Neto (Bs.)',
    'Marca',
    'Modelo',
    'N° Serie',
    'Observaciones',
  ];

  const headerRow = worksheet.getRow(6);
  headers.forEach((text, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = text;
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1E3A8A' }, // Azul Marino Institucional COMIBOL
    };
    cell.alignment = {
      vertical: 'distributed',
      horizontal: ['N°', 'Cantidad', 'Salidas', 'Disponibles', 'Unidad', 'Fecha Adquisición', 'Depreciación (%)'].includes(text)
        ? 'center'
        : ['Valor Compra (Bs.)', 'Dep. Acumulada (Bs.)', 'Saldo / Valor Neto (Bs.)'].includes(text)
          ? 'right'
          : 'left',
      wrapText: true,
    };
    cell.border = {
      top: { style: 'medium', color: { argb: '1E3A8A' } },
      bottom: { style: 'medium', color: { argb: '1E3A8A' } },
      left: { style: 'thin', color: { argb: '3B82F6' } },
      right: { style: 'thin', color: { argb: '3B82F6' } },
    };
  });

  // 4. Filas de Datos
  let totalValue = 0;
  let totalDepac = 0;
  let totalBalance = 0;

  let currentRowIdx = 7;

  if (Array.isArray(assets)) {
    assets.forEach((item, index) => {
      const row = worksheet.getRow(currentRowIdx);
      row.height = 22; // Altura confortable por fila

      const purchaseValue = Number(item.purchaseValue || 0);
      const depac = Number(item.depac || 0);
      const balance = Number(item.balance || 0);

      totalValue += purchaseValue;
      totalDepac += depac;
      totalBalance += balance;

      let formattedDate = '—';
      if (item.purchaseDate) {
        if (typeof item.purchaseDate === 'string') {
          formattedDate = item.purchaseDate.split('T')[0];
        } else if (item.purchaseDate instanceof Date) {
          formattedDate = item.purchaseDate.toISOString().split('T')[0];
        } else {
          formattedDate = String(item.purchaseDate);
        }
      }

      const rowValues = [
        index + 1,
        item.code || '',
        item.name || '',
        item.category?.name || 'Sin Categoría',
        item.status?.name || 'Sin Estado',
        item.location?.name || 'Sin Ubicación',
        item.quantity || 1,
        item.quantityOut || 0,
        Math.max(0, (item.quantity || 1) - (item.quantityOut || 0)),
        item.unit || 'PZA',
        formattedDate,
        purchaseValue,
        item.dep != null ? `${item.dep}%` : '—',
        depac,
        balance,
        item.brand || '',
        item.model || '',
        item.serialNumber || '',
        item.observations || item.description || '',
      ];

      const isEven = index % 2 === 0;
      const bgHex = isEven ? 'FFFFFF' : 'F8FAFC';

      rowValues.forEach((val, cIdx) => {
        const cell = row.getCell(cIdx + 1);
        cell.value = val;
        cell.font = { name: 'Arial', size: 9, color: { argb: '1E293B' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: bgHex },
        };
        cell.border = {
          bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
          left: { style: 'thin', color: { argb: 'F1F5F9' } },
          right: { style: 'thin', color: { argb: 'F1F5F9' } },
        };

        // Alineaciones y formato numérico
        if (cIdx === 0 || cIdx === 6 || cIdx === 7 || cIdx === 8 || cIdx === 9 || cIdx === 10 || cIdx === 12) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else if (cIdx === 11 || cIdx === 13 || cIdx === 14) {
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          cell.numFmt = '#,##0.00';
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        }
      });

      currentRowIdx++;
    });
  }

  // 5. Fila de Totales Generales
  const totalRow = worksheet.getRow(currentRowIdx);
  totalRow.height = 26;

  for (let c = 1; c <= headers.length; c++) {
    const cell = totalRow.getCell(c);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'E2E8F0' },
    };
    cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: '0F172A' } };
    cell.border = {
      top: { style: 'medium', color: { argb: '94A3B8' } },
      bottom: { style: 'double', color: { argb: '64748B' } },
    };
  }

  totalRow.getCell(2).value = 'TOTALES GENERALES';
  totalRow.getCell(12).value = totalValue;
  totalRow.getCell(12).numFmt = '#,##0.00';
  totalRow.getCell(12).alignment = { vertical: 'middle', horizontal: 'right' };

  totalRow.getCell(14).value = totalDepac;
  totalRow.getCell(14).numFmt = '#,##0.00';
  totalRow.getCell(14).alignment = { vertical: 'middle', horizontal: 'right' };

  totalRow.getCell(15).value = totalBalance;
  totalRow.getCell(15).numFmt = '#,##0.00';
  totalRow.getCell(15).alignment = { vertical: 'middle', horizontal: 'right' };

  // 6. Anchos de Columna
  worksheet.columns = [
    { width: 7 },  // N° (Columna A)
    { width: 15 }, // Código (Columna B)
    { width: 34 }, // Nombre del Activo (Columna C)
    { width: 22 }, // Categoría
    { width: 16 }, // Estado Técnico
    { width: 24 }, // Ubicación Física
    { width: 11 }, // Cantidad
    { width: 9 },  // Salidas
    { width: 11 }, // Disponibles
    { width: 9 },  // Unidad
    { width: 15 }, // Fecha Adquisición
    { width: 18 }, // Valor Compra
    { width: 20 }, // Depreciación (%)
    { width: 20 }, // Dep. Acumulada
    { width: 20 }, // Saldo
    { width: 15 }, // Marca
    { width: 15 }, // Modelo
    { width: 16 }, // N° Serie
    { width: 30 }, // Observaciones
  ];

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer as any);
};
