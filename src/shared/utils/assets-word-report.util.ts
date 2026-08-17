import fs from 'fs';
import path from 'path';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableCell,
  TableRow,
  ImageRun,
  WidthType,
  AlignmentType,
  BorderStyle,
  PageOrientation,
  ShadingType,
  VerticalAlign,
  Footer,
} from 'docx';

export interface GenerateAssetsWordReportOptions {
  pageSize?: 'carta' | 'a4' | 'oficio';
  orientation?: 'vertical' | 'horizontal';
}

export async function generateAssetsWordReport(
  assets: any[],
  options: GenerateAssetsWordReportOptions = {},
): Promise<Buffer> {
  const pageSize = options.pageSize || 'carta';
  const orientation = options.orientation || 'horizontal';

  // Margen Estrecho: 0.5 pulgada = 720 dxa/twips
  const margin = 720;

  // Dimensiones base por tamaño de hoja (1 pulgada = 1440 dxa)
  let pageDimensions = {
    width: 12240, // Carta (8.5 in)
    height: 15840, // Carta (11.0 in)
  };

  if (pageSize === 'a4') {
    pageDimensions = { width: 11906, height: 16838 }; // A4 (210 x 297 mm)
  } else if (pageSize === 'oficio') {
    pageDimensions = { width: 12240, height: 20160 }; // Oficio / Legal (8.5 x 14 in)
  }

  const isLandscape = orientation === 'horizontal';
  const width = isLandscape ? pageDimensions.height : pageDimensions.width;
  const height = isLandscape ? pageDimensions.width : pageDimensions.height;

  // Cargar Logo de COMIBOL (public/logo.png)
  const logoPath = path.join(process.cwd(), 'public', 'logo.png');
  let logoRun: ImageRun | null = null;
  if (fs.existsSync(logoPath)) {
    const logoBuffer = fs.readFileSync(logoPath);
    logoRun = new ImageRun({
      data: logoBuffer,
      transformation: {
        width: 100,
        height: 100,
      },
      type: 'png',
    });
  }

  // Formatear Fecha de Impresión (ej: 9/6/2026, 12:28:49 p.m.)
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-BO', { day: 'numeric', month: 'numeric', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const printDateFormatted = `${dateStr}, ${timeStr}`;

  // Encabezado según diseño PDF oficial
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      bottom: { style: BorderStyle.SINGLE, size: 12, color: '000000' },
      left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 20, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              logoRun
                ? new Paragraph({ alignment: AlignmentType.LEFT, children: [logoRun] })
                : new Paragraph({ text: '' }),
            ],
          }),
          new TableCell({
            width: { size: 80, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'CORPORACIÓN MINERA DE BOLIVIA',
                    bold: true,
                    size: 30, // 15pt
                    font: 'Arial',
                    color: '000000',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 60 },
                children: [
                  new TextRun({
                    text: 'DIRECCIÓN DE PROYECTOS Y GEOLOGÍA',
                    bold: true,
                    size: 24, // 12pt
                    font: 'Arial',
                    color: '000000',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // Título del Reporte
  const reportTitleParagraph = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 280, after: 140 },
    children: [
      new TextRun({
        text: 'REPORTE DE INVENTARIO ACTIVOS FIJOS',
        bold: true,
        size: 26, // 13pt
        font: 'Arial',
        color: '000000',
      }),
    ],
  });

  // Fecha de Impresión
  const printDateParagraph = new Paragraph({
    alignment: AlignmentType.RIGHT,
    spacing: { before: 0, after: 200 },
    children: [
      new TextRun({
        text: `Fecha de Impresion: ${printDateFormatted}`,
        size: 18, // 9pt
        font: 'Arial',
        color: '334155',
      }),
    ],
  });

  // Filas de la Tabla de Activos Fijos
  const tableRows: TableRow[] = [];

  // Encabezado de la Tabla
  tableRows.push(
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          width: { size: 5, type: WidthType.PERCENTAGE },
          shading: { fill: '1E3A8A', type: ShadingType.CLEAR, color: 'auto' },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Nº', bold: true, color: 'FFFFFF', size: 17, font: 'Arial' })] })],
        }),
        new TableCell({
          width: { size: 14, type: WidthType.PERCENTAGE },
          shading: { fill: '1E3A8A', type: ShadingType.CLEAR, color: 'auto' },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Código', bold: true, color: 'FFFFFF', size: 17, font: 'Arial' })] })],
        }),
        new TableCell({
          width: { size: 26, type: WidthType.PERCENTAGE },
          shading: { fill: '1E3A8A', type: ShadingType.CLEAR, color: 'auto' },
          children: [new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: 'Activo Fijo', bold: true, color: 'FFFFFF', size: 17, font: 'Arial' })] })],
        }),
        new TableCell({
          width: { size: 16, type: WidthType.PERCENTAGE },
          shading: { fill: '1E3A8A', type: ShadingType.CLEAR, color: 'auto' },
          children: [new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: 'Categoría', bold: true, color: 'FFFFFF', size: 17, font: 'Arial' })] })],
        }),
        new TableCell({
          width: { size: 16, type: WidthType.PERCENTAGE },
          shading: { fill: '1E3A8A', type: ShadingType.CLEAR, color: 'auto' },
          children: [new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: 'Ubicación', bold: true, color: 'FFFFFF', size: 17, font: 'Arial' })] })],
        }),
        new TableCell({
          width: { size: 11, type: WidthType.PERCENTAGE },
          shading: { fill: '1E3A8A', type: ShadingType.CLEAR, color: 'auto' },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Estado', bold: true, color: 'FFFFFF', size: 17, font: 'Arial' })] })],
        }),
        new TableCell({
          width: { size: 6, type: WidthType.PERCENTAGE },
          shading: { fill: '1E3A8A', type: ShadingType.CLEAR, color: 'auto' },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Cant.', bold: true, color: 'FFFFFF', size: 17, font: 'Arial' })] })],
        }),
        new TableCell({
          width: { size: 6, type: WidthType.PERCENTAGE },
          shading: { fill: '1E3A8A', type: ShadingType.CLEAR, color: 'auto' },
          children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Valor (Bs)', bold: true, color: 'FFFFFF', size: 17, font: 'Arial' })] })],
        }),
      ],
    })
  );

  // Filas de datos
  if (assets.length === 0) {
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 8,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: 'No se encontraron activos fijos según los criterios seleccionados.', italics: true, size: 18, font: 'Arial' })],
              }),
            ],
          }),
        ],
      })
    );
  } else {
    assets.forEach((item, index) => {
      const isEven = index % 2 === 0;
      const fillBg = isEven ? 'FFFFFF' : 'F8FAFC';

      const categoryName = item.category?.name || 'Sin categoría';
      const locationName = item.location?.name || 'Sin ubicación';
      const statusName = item.status?.name || '—';

      const valFormatted = item.purchaseValue != null
        ? Number(item.purchaseValue).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : '0,00';

      tableRows.push(
        new TableRow({
          children: [
            new TableCell({
              width: { size: 5, type: WidthType.PERCENTAGE },
              shading: { fill: fillBg, type: ShadingType.CLEAR, color: 'auto' },
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${index + 1}`, size: 17, font: 'Arial' })] })],
            }),
            new TableCell({
              width: { size: 14, type: WidthType.PERCENTAGE },
              shading: { fill: fillBg, type: ShadingType.CLEAR, color: 'auto' },
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.code || 'S/C', bold: true, size: 17, font: 'Arial' })] })],
            }),
            new TableCell({
              width: { size: 26, type: WidthType.PERCENTAGE },
              shading: { fill: fillBg, type: ShadingType.CLEAR, color: 'auto' },
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new TextRun({ text: item.name || 'Activo Fijo', bold: true, size: 17, font: 'Arial' }),
                    ...(item.brand || item.model ? [new TextRun({ text: ` (${[item.brand, item.model].filter(Boolean).join(' - ')})`, size: 15, font: 'Arial', color: '475569' })] : []),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 16, type: WidthType.PERCENTAGE },
              shading: { fill: fillBg, type: ShadingType.CLEAR, color: 'auto' },
              children: [new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: categoryName, size: 17, font: 'Arial' })] })],
            }),
            new TableCell({
              width: { size: 16, type: WidthType.PERCENTAGE },
              shading: { fill: fillBg, type: ShadingType.CLEAR, color: 'auto' },
              children: [new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: locationName, size: 17, font: 'Arial' })] })],
            }),
            new TableCell({
              width: { size: 11, type: WidthType.PERCENTAGE },
              shading: { fill: fillBg, type: ShadingType.CLEAR, color: 'auto' },
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: statusName, size: 17, font: 'Arial' })] })],
            }),
            new TableCell({
              width: { size: 6, type: WidthType.PERCENTAGE },
              shading: { fill: fillBg, type: ShadingType.CLEAR, color: 'auto' },
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${item.quantity || 1}`, bold: true, size: 17, font: 'Arial' })] })],
            }),
            new TableCell({
              width: { size: 6, type: WidthType.PERCENTAGE },
              shading: { fill: fillBg, type: ShadingType.CLEAR, color: 'auto' },
              children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: valFormatted, size: 17, font: 'Arial' })] })],
            }),
          ],
        })
      );
    });
  }

  const assetsTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: '94A3B8' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: '94A3B8' },
      left: { style: BorderStyle.SINGLE, size: 4, color: '94A3B8' },
      right: { style: BorderStyle.SINGLE, size: 4, color: '94A3B8' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
    },
    rows: tableRows,
  });

  // Pie de Página Institucional según PDF
  const footerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 12, color: '000000' },
      bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 80 },
                children: [
                  new TextRun({
                    text: 'Av. Sargento Flores s/n / teléf. 52 43699 Fax 5245466, zona San José – Oruro,',
                    size: 16, // 8pt
                    font: 'Arial',
                    color: '334155',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'WEB: http://www.comibol.gob.bo *E-mail: comibol@comibol.gob.bo',
                    size: 16,
                    font: 'Arial',
                    color: '334155',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width,
              height,
              orientation: isLandscape ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT,
            },
            margin: {
              top: margin,
              right: margin,
              bottom: margin,
              left: margin,
            },
          },
        },
        footers: {
          default: new Footer({
            children: [footerTable],
          }),
        },
        children: [headerTable, reportTitleParagraph, printDateParagraph, assetsTable],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
