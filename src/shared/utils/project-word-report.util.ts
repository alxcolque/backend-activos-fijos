import fs from 'fs';
import path from 'path';
import { env } from '../../infrastructure/config/env';
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
} from 'docx';

export interface GenerateWordReportOptions {
  pageSize?: 'carta' | 'a4' | 'oficio';
  orientation?: 'vertical' | 'horizontal';
}

export async function generateProjectWordReport(
  project: { name: string },
  assignments: any[],
  supplyAssignments: any[] = [],
  options: GenerateWordReportOptions = {},
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
        width: 110,
        height: 110,
      },
      type: 'png',
    });
  }

  // Formatear Fecha Actual en español
  const now = new Date();
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  const dateFormatted = `${now.getDate()} de ${months[now.getMonth()]} del ${now.getFullYear()}`;

  // Encabezado con Logo y Título según plantilla oficial
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
            width: { size: 25, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              logoRun
                ? new Paragraph({ alignment: AlignmentType.LEFT, children: [logoRun] })
                : new Paragraph({ text: '' }),
            ],
          }),
          new TableCell({
            width: { size: 75, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'CORPORACIÓN MINERA DE BOLIVIA',
                    bold: true,
                    underline: {},
                    size: 44, // 16pt
                    font: 'Arial',
                    color: '000000',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 100 },
                children: [
                  new TextRun({
                    text: project.name.toUpperCase(),
                    bold: true,
                    size: 34, // 13pt
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

  // Párrafo introductorio
  const introParagraph = new Paragraph({
    spacing: { before: 360, after: 200, line: 320 },
    children: [
      new TextRun({
        text: 'En la Ciudad de Oruro, en fecha ',
        size: 22, // 11pt
        font: 'Arial',
      }),
      new TextRun({
        text: dateFormatted,
        bold: true,
        size: 22,
        font: 'Arial',
      }),
      new TextRun({
        text: ' se realizó la verificación y registro de los bienes y suministros asignados al ',
        size: 22,
        font: 'Arial',
      }),
      new TextRun({
        text: project.name.toUpperCase(),
        bold: true,
        size: 22,
        font: 'Arial',
      }),
      new TextRun({
        text: ', de acuerdo con el siguiente detalle:',
        size: 22,
        font: 'Arial',
      }),
    ],
  });

  // ==========================================
  // 1. SUBTÍTULO Y TABLA DE ACTIVOS FIJOS
  // ==========================================
  const assetsSubtitle = new Paragraph({
    spacing: { before: 240, after: 120 },
    children: [
      new TextRun({
        text: 'DETALLE DE ACTIVOS',
        bold: true,
        size: 24, // 12pt
        font: 'Arial',
        color: '1E3A8A', // Azul Institucional
      }),
    ],
  });

  const assetRows: TableRow[] = [];

  // Encabezado Tabla Activos
  assetRows.push(
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          width: { size: 6, type: WidthType.PERCENTAGE },
          shading: { fill: '1E3A8A', type: ShadingType.CLEAR, color: 'auto' },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Nº', bold: true, color: 'FFFFFF', size: 18, font: 'Arial' })] })],
        }),
        new TableCell({
          width: { size: 16, type: WidthType.PERCENTAGE },
          shading: { fill: '1E3A8A', type: ShadingType.CLEAR, color: 'auto' },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Código', bold: true, color: 'FFFFFF', size: 18, font: 'Arial' })] })],
        }),
        new TableCell({
          width: { size: 28, type: WidthType.PERCENTAGE },
          shading: { fill: '1E3A8A', type: ShadingType.CLEAR, color: 'auto' },
          children: [new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: 'Activo Fijo', bold: true, color: 'FFFFFF', size: 18, font: 'Arial' })] })],
        }),
        new TableCell({
          width: { size: 18, type: WidthType.PERCENTAGE },
          shading: { fill: '1E3A8A', type: ShadingType.CLEAR, color: 'auto' },
          children: [new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: 'Categoría', bold: true, color: 'FFFFFF', size: 18, font: 'Arial' })] })],
        }),
        new TableCell({
          width: { size: 8, type: WidthType.PERCENTAGE },
          shading: { fill: '1E3A8A', type: ShadingType.CLEAR, color: 'auto' },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Cant.', bold: true, color: 'FFFFFF', size: 18, font: 'Arial' })] })],
        }),
        new TableCell({
          width: { size: 12, type: WidthType.PERCENTAGE },
          shading: { fill: '1E3A8A', type: ShadingType.CLEAR, color: 'auto' },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'F. Asignación', bold: true, color: 'FFFFFF', size: 18, font: 'Arial' })] })],
        }),
        new TableCell({
          width: { size: 12, type: WidthType.PERCENTAGE },
          shading: { fill: '1E3A8A', type: ShadingType.CLEAR, color: 'auto' },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Estado', bold: true, color: 'FFFFFF', size: 18, font: 'Arial' })] })],
        }),
      ],
    })
  );

  // Filas de Datos de Activos
  if (assignments.length === 0) {
    assetRows.push(
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 7,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: 'No se encontraron activos fijos asignados a este proyecto.', italics: true, size: 20, font: 'Arial' })],
              }),
            ],
          }),
        ],
      })
    );
  } else {
    assignments.forEach((item, index) => {
      const isEven = index % 2 === 0;
      const fillBg = isEven ? 'FFFFFF' : 'F8FAFC';
      const isReleased = !!item.releasedAt;

      const timeZone = env.TZ || process.env.TZ || 'America/La_Paz';
      const dateAssigned = item.assignedAt
        ? new Date(item.assignedAt).toLocaleDateString('es-BO', { timeZone })
        : '—';

      const statusText = isReleased ? 'Liberado' : 'Vigente';

      const obsText = (
        item.observations ||
        (item.asset as any)?.observations ||
        (item.asset as any)?.description ||
        ''
      ).trim();

      const assetCellParagraphs: Paragraph[] = [
        new Paragraph({
          alignment: AlignmentType.LEFT,
          children: [
            new TextRun({ text: item.asset?.name || 'Activo Fijo', bold: true, size: 18, font: 'Arial' }),
          ],
        }),
      ];

      if (obsText) {
        assetCellParagraphs.push(
          new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [
              new TextRun({
                text: `Obs: ${obsText}`,
                italics: true,
                size: 15,
                color: '64748B',
                font: 'Arial',
              }),
            ],
          })
        );
      }

      assetRows.push(
        new TableRow({
          children: [
            new TableCell({
              width: { size: 6, type: WidthType.PERCENTAGE },
              shading: { fill: fillBg, type: ShadingType.CLEAR, color: 'auto' },
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${index + 1}`, size: 18, font: 'Arial' })] })],
            }),
            new TableCell({
              width: { size: 16, type: WidthType.PERCENTAGE },
              shading: { fill: fillBg, type: ShadingType.CLEAR, color: 'auto' },
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.asset?.code || 'S/C', bold: true, size: 18, font: 'Arial' })] })],
            }),
            new TableCell({
              width: { size: 28, type: WidthType.PERCENTAGE },
              shading: { fill: fillBg, type: ShadingType.CLEAR, color: 'auto' },
              children: assetCellParagraphs,
            }),
            new TableCell({
              width: { size: 18, type: WidthType.PERCENTAGE },
              shading: { fill: fillBg, type: ShadingType.CLEAR, color: 'auto' },
              children: [new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: item.asset?.category?.name || 'Sin categoría', size: 18, font: 'Arial' })] })],
            }),
            new TableCell({
              width: { size: 8, type: WidthType.PERCENTAGE },
              shading: { fill: fillBg, type: ShadingType.CLEAR, color: 'auto' },
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${item.quantity || 1}`, bold: true, size: 18, font: 'Arial' })] })],
            }),
            new TableCell({
              width: { size: 12, type: WidthType.PERCENTAGE },
              shading: { fill: fillBg, type: ShadingType.CLEAR, color: 'auto' },
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: dateAssigned, size: 18, font: 'Arial' })] })],
            }),
            new TableCell({
              width: { size: 12, type: WidthType.PERCENTAGE },
              shading: { fill: fillBg, type: ShadingType.CLEAR, color: 'auto' },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: statusText,
                      bold: true,
                      color: isReleased ? '475569' : '166534',
                      size: 18,
                      font: 'Arial',
                    }),
                  ],
                }),
              ],
            }),
          ],
        })
      );
    });
  }

  const assetsTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
      left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
      right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
    },
    rows: assetRows,
  });

  // ==========================================
  // 2. SUBTÍTULO Y TABLA DE SUMINISTROS
  // ==========================================
  const suppliesSubtitle = new Paragraph({
    spacing: { before: 400, after: 120 },
    children: [
      new TextRun({
        text: 'DETALLE DE SUMINISTROS',
        bold: true,
        size: 24, // 12pt
        font: 'Arial',
        color: '065F46', // Verde Esmeralda Institucional
      }),
    ],
  });

  const supplyRows: TableRow[] = [];

  // Encabezado Tabla Suministros
  supplyRows.push(
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          width: { size: 6, type: WidthType.PERCENTAGE },
          shading: { fill: '065F46', type: ShadingType.CLEAR, color: 'auto' },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Nº', bold: true, color: 'FFFFFF', size: 18, font: 'Arial' })] })],
        }),
        new TableCell({
          width: { size: 28, type: WidthType.PERCENTAGE },
          shading: { fill: '065F46', type: ShadingType.CLEAR, color: 'auto' },
          children: [new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: 'Material / Suministro', bold: true, color: 'FFFFFF', size: 18, font: 'Arial' })] })],
        }),
        new TableCell({
          width: { size: 18, type: WidthType.PERCENTAGE },
          shading: { fill: '065F46', type: ShadingType.CLEAR, color: 'auto' },
          children: [new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: 'Categoría', bold: true, color: 'FFFFFF', size: 18, font: 'Arial' })] })],
        }),
        new TableCell({
          width: { size: 16, type: WidthType.PERCENTAGE },
          shading: { fill: '065F46', type: ShadingType.CLEAR, color: 'auto' },
          children: [new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: 'Ubicación', bold: true, color: 'FFFFFF', size: 18, font: 'Arial' })] })],
        }),
        new TableCell({
          width: { size: 10, type: WidthType.PERCENTAGE },
          shading: { fill: '065F46', type: ShadingType.CLEAR, color: 'auto' },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Cantidad', bold: true, color: 'FFFFFF', size: 18, font: 'Arial' })] })],
        }),
        new TableCell({
          width: { size: 11, type: WidthType.PERCENTAGE },
          shading: { fill: '065F46', type: ShadingType.CLEAR, color: 'auto' },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'F. Asignación', bold: true, color: 'FFFFFF', size: 18, font: 'Arial' })] })],
        }),
        new TableCell({
          width: { size: 11, type: WidthType.PERCENTAGE },
          shading: { fill: '065F46', type: ShadingType.CLEAR, color: 'auto' },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Estado', bold: true, color: 'FFFFFF', size: 18, font: 'Arial' })] })],
        }),
      ],
    })
  );

  // Filas de Datos de Suministros
  if (supplyAssignments.length === 0) {
    supplyRows.push(
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 7,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: 'No se encontraron suministros o materiales asignados a este proyecto.', italics: true, size: 20, font: 'Arial' })],
              }),
            ],
          }),
        ],
      })
    );
  } else {
    supplyAssignments.forEach((item, index) => {
      const isEven = index % 2 === 0;
      const fillBg = isEven ? 'FFFFFF' : 'F8FAFC';
      const isReleased = !!item.releasedAt;

      const timeZone = env.TZ || process.env.TZ || 'America/La_Paz';
      const dateAssigned = item.assignedAt
        ? new Date(item.assignedAt).toLocaleDateString('es-BO', { timeZone })
        : '—';

      const statusText = isReleased ? 'Liberado' : 'Vigente';

      const obsText = (
        item.observations ||
        (item.supply as any)?.observations ||
        ''
      ).trim();

      const supplyCellParagraphs: Paragraph[] = [
        new Paragraph({
          alignment: AlignmentType.LEFT,
          children: [
            new TextRun({ text: item.supply?.name || 'Suministro', bold: true, size: 18, font: 'Arial' }),
          ],
        }),
      ];

      if (obsText) {
        supplyCellParagraphs.push(
          new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [
              new TextRun({
                text: `Obs: ${obsText}`,
                italics: true,
                size: 15,
                color: '64748B',
                font: 'Arial',
              }),
            ],
          })
        );
      }

      const qtyText = `${item.quantity || 0} ${item.supply?.unit || 'PZA'}`;

      supplyRows.push(
        new TableRow({
          children: [
            new TableCell({
              width: { size: 6, type: WidthType.PERCENTAGE },
              shading: { fill: fillBg, type: ShadingType.CLEAR, color: 'auto' },
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${index + 1}`, size: 18, font: 'Arial' })] })],
            }),
            new TableCell({
              width: { size: 28, type: WidthType.PERCENTAGE },
              shading: { fill: fillBg, type: ShadingType.CLEAR, color: 'auto' },
              children: supplyCellParagraphs,
            }),
            new TableCell({
              width: { size: 18, type: WidthType.PERCENTAGE },
              shading: { fill: fillBg, type: ShadingType.CLEAR, color: 'auto' },
              children: [new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: item.supply?.category?.name || 'Sin categoría', size: 18, font: 'Arial' })] })],
            }),
            new TableCell({
              width: { size: 16, type: WidthType.PERCENTAGE },
              shading: { fill: fillBg, type: ShadingType.CLEAR, color: 'auto' },
              children: [new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: item.supply?.location?.name || 'Sin ubicación', size: 18, font: 'Arial' })] })],
            }),
            new TableCell({
              width: { size: 10, type: WidthType.PERCENTAGE },
              shading: { fill: fillBg, type: ShadingType.CLEAR, color: 'auto' },
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: qtyText, bold: true, size: 18, font: 'Arial' })] })],
            }),
            new TableCell({
              width: { size: 11, type: WidthType.PERCENTAGE },
              shading: { fill: fillBg, type: ShadingType.CLEAR, color: 'auto' },
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: dateAssigned, size: 18, font: 'Arial' })] })],
            }),
            new TableCell({
              width: { size: 11, type: WidthType.PERCENTAGE },
              shading: { fill: fillBg, type: ShadingType.CLEAR, color: 'auto' },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: statusText,
                      bold: true,
                      color: isReleased ? '475569' : '166534',
                      size: 18,
                      font: 'Arial',
                    }),
                  ],
                }),
              ],
            }),
          ],
        })
      );
    });
  }

  const suppliesTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
      left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
      right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
    },
    rows: supplyRows,
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
        children: [
          headerTable,
          introParagraph,
          assetsSubtitle,
          assetsTable,
          suppliesSubtitle,
          suppliesTable,
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
