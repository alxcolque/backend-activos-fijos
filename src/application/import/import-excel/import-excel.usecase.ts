import * as XLSX from 'xlsx';
import {
  IImportRepository,
  ImportRow,
  ImportResult,
  ImportErrorItem,
} from '../../../domain/import/import.repository.interface';
import { logger } from '../../../infrastructure/logger/logger';
import { logAssetHistory } from '../../../shared/utils/audit.util';

export class ImportExcelUseCase {
  constructor(private importRepository: IImportRepository) {}

  async executeFromBuffer(fileBuffer: Buffer, userId?: string): Promise<ImportResult> {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json<any>(sheet);

    const formattedRows: ImportRow[] = rawRows.map((r) => ({
      code: String(r['código'] || r['code'] || '').trim(),
      name: String(r['nombre'] || r['name'] || '').trim(),
      category: r['categoría'] || r['category'] ? String(r['categoría'] || r['category']).trim() : undefined,
      status: r['estado'] || r['status'] ? String(r['estado'] || r['status']).trim() : undefined,
      location: r['ubicación'] || r['location'] ? String(r['ubicación'] || r['location']).trim() : undefined,
      brand: r['marca'] || r['brand'] ? String(r['marca'] || r['brand']).trim() : null,
      model: r['modelo'] || r['model'] ? String(r['modelo'] || r['model']).trim() : null,
      serialNumber: r['serie'] || r['serialNumber'] ? String(r['serie'] || r['serialNumber']).trim() : null,
      unit: r['unidad'] || r['unit'] ? String(r['unidad'] || r['unit']).trim() : 'PZA',
      quantity: r['cantidad'] || r['quantity'] ? Number(r['cantidad'] || r['quantity']) : 1,
      purchaseDate: r['fechaCompra'] || r['purchaseDate'] ? String(r['fechaCompra'] || r['purchaseDate']).trim() : null,
      purchaseValue: Number(r['valorCompra'] || r['purchaseValue'] || 0),
      usefulLife: Number(r['vidaÚtil'] || r['usefulLife'] || 1),
      observations: r['observaciones'] || r['observations'] ? String(r['observaciones'] || r['observations']).trim() : null,
    }));

    return this.executeRows(formattedRows, userId);
  }

  async executeRows(rows: ImportRow[], userId?: string): Promise<ImportResult> {
    const defaultCategoryId = await this.importRepository.findDefaultCategory();
    const defaultStatusId = await this.importRepository.findDefaultStatus();
    const defaultLocationId = await this.importRepository.findDefaultLocation();

    const seenCodes = new Set<string>();
    const seenSerials = new Set<string>();

    const validAssetsData: any[] = [];
    const errors: ImportErrorItem[] = [];

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const rowNum = index + 1;

      if (!row.code) {
        errors.push({ row: rowNum, message: 'El código del activo es obligatorio.' });
        continue;
      }

      if (!row.name) {
        errors.push({ row: rowNum, code: row.code, message: 'El nombre del activo es obligatorio.' });
        continue;
      }

      if (seenCodes.has(row.code)) {
        errors.push({ row: rowNum, code: row.code, message: 'El código está duplicado en el mismo lote de importación.' });
        continue;
      }

      const codeExists = await this.importRepository.existsCode(row.code);
      if (codeExists) {
        errors.push({ row: rowNum, code: row.code, message: 'El código ya existe en el sistema.' });
        continue;
      }

      if (row.serialNumber) {
        if (seenSerials.has(row.serialNumber)) {
          errors.push({ row: rowNum, code: row.code, message: 'El número de serie está duplicado en el lote.' });
          continue;
        }

        const serialExists = await this.importRepository.existsSerial(row.serialNumber);
        if (serialExists) {
          errors.push({ row: rowNum, code: row.code, message: 'El número de serie ya existe en el sistema.' });
          continue;
        }
      }

      // Resolve Category
      let categoryId = defaultCategoryId;
      if (row.category) {
        const found = await this.importRepository.findCategoryByName(row.category);
        if (found) {
          categoryId = found;
        } else {
          categoryId = await this.importRepository.createCategory(row.category);
        }
      }

      // Resolve Status
      let statusId = defaultStatusId;
      if (row.status) {
        const found = await this.importRepository.findStatusByName(row.status);
        if (found) {
          statusId = found;
        }
      }

      // Resolve Location
      let locationId = defaultLocationId;
      if (row.location) {
        const found = await this.importRepository.findLocationByName(row.location);
        if (found) {
          locationId = found;
        }
      }

      seenCodes.add(row.code);
      if (row.serialNumber) {
        seenSerials.add(row.serialNumber);
      }

      const purchaseDate = row.purchaseDate ? new Date(row.purchaseDate) : null;
      const purchaseYear = purchaseDate ? purchaseDate.getFullYear() : null;

      validAssetsData.push({
        code: row.code,
        qrCode: row.code,
        name: row.name,
        categoryId,
        statusId,
        locationId,
        brand: row.brand || null,
        model: row.model || null,
        serialNumber: row.serialNumber || null,
        unit: row.unit || 'PZA',
        quantity: row.quantity || 1,
        purchaseDate,
        purchaseYear,
        purchaseValue: row.purchaseValue,
        usefulLife: row.usefulLife,
        residualValue: 0,
        currentValue: row.purchaseValue,
        observations: row.observations || null,
      });
    }

    let createdAssets: any[] = [];
    if (validAssetsData.length > 0) {
      createdAssets = await this.importRepository.bulkCreateAssets(validAssetsData);

      for (const asset of createdAssets) {
        await logAssetHistory(asset.id, userId, 'IMPORT_EXCEL', 'Activo importado por lote Excel');
      }
    }

    logger.info(
      { imported: createdAssets.length, failed: errors.length },
      'Proceso de importación masiva Excel completado',
    );

    return {
      totalRows: rows.length,
      importedCount: createdAssets.length,
      failedCount: errors.length,
      errors,
    };
  }
}
