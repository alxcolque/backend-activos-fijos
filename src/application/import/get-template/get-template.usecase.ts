export class GetTemplateUseCase {
  execute() {
    return {
      columns: [
        { name: 'code', label: 'Código Patrimonial', required: true, example: 'AF-000100' },
        { name: 'name', label: 'Nombre del Activo', required: true, example: 'Compresora Industrial' },
        { name: 'category', label: 'Categoría', required: true, example: 'MAQUINARIA Y EQUIPO' },
        { name: 'status', label: 'Estado', required: true, example: 'BUENO' },
        { name: 'location', label: 'Ubicación', required: true, example: 'COMIBOL' },
        { name: 'brand', label: 'Marca', required: false, example: 'CATERPILLAR' },
        { name: 'model', label: 'Modelo', required: false, example: 'CAT-320' },
        { name: 'serialNumber', label: 'Número de Serie', required: false, example: 'SN-998877' },
        { name: 'unit', label: 'Unidad de Medida', required: false, example: 'PZA' },
        { name: 'quantity', label: 'Cantidad', required: false, example: 1 },
        { name: 'purchaseDate', label: 'Fecha de Compra', required: false, example: '2025-06-15' },
        { name: 'purchaseValue', label: 'Valor de Compra (Bs.)', required: true, example: 450000 },
        { name: 'usefulLife', label: 'Vida Útil (Años)', required: true, example: 10 },
        { name: 'observations', label: 'Observaciones', required: false, example: 'Carga inicial' },
      ],
    };
  }
}
