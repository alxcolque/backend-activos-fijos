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

function formatDateSpanish(dateInput?: Date | string | null): string {
  if (!dateInput) return '....................';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '....................';
  const months = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ];
  return `${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}`;
}

export async function generateActaEntregaWordReport(acquisition: any): Promise<Buffer> {
  const margin = 1440; // 1 pulgada

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

  const isAssetType = acquisition.type === 'ASSET';

  // Datos extraídos del registro
  const projectName = acquisition.project?.name || acquisition.checkoutUser?.project?.name || 'PROYECTO';
  const fechaSalida = formatDateSpanish(acquisition.departureDate || acquisition.createdAt);

  const checkoutName = acquisition.checkoutUser?.fullName || '...................................';
  const checkoutProfession = acquisition.checkoutUser?.profession || '...................................';
  const checkoutProjectName =
    acquisition.checkoutUser?.project?.name || acquisition.project?.name || '...................................';

  const userName = acquisition.user?.fullName || '...................................';
  const userProfession = acquisition.user?.profession || '...................................';

  // Texto de la 2da línea del encabezado
  const headerSecondLine = isAssetType ? 'DIRECCIÓN DE PROYECTOS Y GEOLOGÍA' : projectName.toUpperCase();

  // Encabezado con Logo y Título Institucional
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
                    size: 32, // 16pt
                    font: 'Arial',
                    color: '000000',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 80 },
                children: [
                  new TextRun({
                    text: headerSecondLine,
                    bold: true,
                    underline: {},
                    size: 28, // 14pt
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

  // Título Principal Centrado: "ACTA DE PRÉSTAMO" vs "ACTA DE ENTREGA"
  const documentTitle = isAssetType ? 'ACTA DE PRÉSTAMO' : 'ACTA DE ENTREGA';
  const titleParagraph = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 360, after: 240 },
    children: [
      new TextRun({
        text: documentTitle,
        bold: true,
        size: 28, // 14pt
        font: 'Arial',
      }),
    ],
  });

  // Párrafo Introductorio según Tipo (Arial 12pt = size 24)
  const bodyChildren: TextRun[] = isAssetType
    ? [
        new TextRun({ text: 'En la ciudad de Oruro, en fecha ', size: 24, font: 'Arial' }),
        new TextRun({ text: fechaSalida, bold: true, size: 24, font: 'Arial' }),
        new TextRun({
          text: ', se realizó el préstamo temporal de activos y/o materiales, bajo responsabilidad de ',
          size: 24,
          font: 'Arial',
        }),
        new TextRun({ text: checkoutName, bold: true, size: 24, font: 'Arial' }),
        new TextRun({ text: ', ', size: 24, font: 'Arial' }),
        new TextRun({ text: checkoutProfession, bold: true, size: 24, font: 'Arial' }),
        new TextRun({ text: ', a cargo de ', size: 24, font: 'Arial' }),
        new TextRun({ text: checkoutProjectName, bold: true, size: 24, font: 'Arial' }),
        new TextRun({
          text: ', quien se compromete a custodiar y devolver los bienes recibidos en las condiciones correspondientes, de acuerdo con el siguiente detalle:',
          size: 24,
          font: 'Arial',
        }),
      ]
    : [
        new TextRun({ text: 'En la ciudad de Oruro, en fecha ', size: 24, font: 'Arial' }),
        new TextRun({ text: fechaSalida, bold: true, size: 24, font: 'Arial' }),
        new TextRun({
          text: ', se realizó la entrega de activos y/o materiales de consumo a ',
          size: 24,
          font: 'Arial',
        }),
        new TextRun({ text: checkoutName, bold: true, size: 24, font: 'Arial' }),
        new TextRun({ text: ', ', size: 24, font: 'Arial' }),
        new TextRun({ text: checkoutProfession, bold: true, size: 24, font: 'Arial' }),
        new TextRun({ text: ', a cargo de ', size: 24, font: 'Arial' }),
        new TextRun({ text: checkoutProjectName, bold: true, size: 24, font: 'Arial' }),
        new TextRun({ text: ', de acuerdo con el siguiente detalle:', size: 24, font: 'Arial' }),
      ];

  const bodyParagraph = new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 120, after: 240, line: 360 },
    children: bodyChildren,
  });

  // ==========================================
  // TABLA DE DETALLE (N°, DETALLE, UNIDAD, CANTIDAD) - Arial 12pt (size 24)
  // ==========================================
  const tableRows: TableRow[] = [];

  // Encabezado Tabla
  tableRows.push(
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          width: { size: 10, type: WidthType.PERCENTAGE },
          verticalAlign: VerticalAlign.CENTER,
          shading: { fill: 'F1F5F9', type: ShadingType.CLEAR, color: 'auto' },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'N°', bold: true, size: 24, font: 'Arial' })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 55, type: WidthType.PERCENTAGE },
          verticalAlign: VerticalAlign.CENTER,
          shading: { fill: 'F1F5F9', type: ShadingType.CLEAR, color: 'auto' },
          children: [
            new Paragraph({
              alignment: AlignmentType.LEFT,
              children: [new TextRun({ text: 'DETALLE', bold: true, size: 24, font: 'Arial' })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 15, type: WidthType.PERCENTAGE },
          verticalAlign: VerticalAlign.CENTER,
          shading: { fill: 'F1F5F9', type: ShadingType.CLEAR, color: 'auto' },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'UNIDAD', bold: true, size: 24, font: 'Arial' })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 20, type: WidthType.PERCENTAGE },
          verticalAlign: VerticalAlign.CENTER,
          shading: { fill: 'F1F5F9', type: ShadingType.CLEAR, color: 'auto' },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'CANTIDAD', bold: true, size: 24, font: 'Arial' })],
            }),
          ],
        }),
      ],
    })
  );

  // Filas de la Tabla
  const details = acquisition.details || [];
  if (details.length === 0) {
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 4,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'Sin ítems registrados en el detalle.',
                    italics: true,
                    size: 24,
                    font: 'Arial',
                  }),
                ],
              }),
            ],
          }),
        ],
      })
    );
  } else {
    details.forEach((d: any, index: number) => {
      let detailName = 'Material / Activo';
      if (d.supply?.name) {
        detailName = d.supply.name;
      } else if (d.asset) {
        detailName = `[${d.asset.code}] - ${d.asset.name}`;
      }

      tableRows.push(
        new TableRow({
          children: [
            new TableCell({
              width: { size: 10, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: `${index + 1}`, size: 24, font: 'Arial' })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 55, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [new TextRun({ text: detailName, size: 24, font: 'Arial' })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 15, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: d.unit || 'PZA', size: 24, font: 'Arial' })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 20, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: `${d.quantity || 1}`, bold: true, size: 24, font: 'Arial' })],
                }),
              ],
            }),
          ],
        })
      );
    });
  }

  const itemsTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      left: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      right: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' },
    },
    rows: tableRows,
  });

  // Párrafo de Conformidad según Tipo en Arial 12pt (size 24)
  const conformityText = isAssetType
    ? 'Los activos asignados en calidad de préstamo deberán ser devueltos en su totalidad al Almacén de Activos de la Dirección de Proyectos y Geología (DPG), una vez concluidas las funciones, actividades o responsabilidades del/la responsable dentro de la DPG, o cuando así sea requerido por la institución.'
    : 'Todo activo o material entregado deberá ser utilizado de manera adecuada y responsable, de acuerdo con el fin para el cual fue asignado. La persona receptora asume la responsabilidad por el uso y custodia de los bienes entregados. En constancia de nuestra conformidad, firmamos al pie de la presente Acta de Entrega.';

  const conformityParagraph = new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 360, after: 480, line: 360 },
    children: [
      new TextRun({
        text: conformityText,
        size: 24, // 12pt
        font: 'Arial',
      }),
    ],
  });

  // Sección de Firmas (RECIBÍ CONFORME / ENTREGUÉ CONFORME) en Arial 12pt (size 24)
  const signaturesTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    },
    rows: [
      new TableRow({
        children: [
          // RECIBÍ CONFORME (Persona que Retira)
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.TOP,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 720 },
                children: [
                  new TextRun({
                    text: 'RECIBÍ CONFORME',
                    bold: true,
                    size: 24, // 12pt
                    font: 'Arial',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 80 },
                children: [
                  new TextRun({
                    text: checkoutName,
                    bold: true,
                    size: 24, // 12pt
                    font: 'Arial',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: checkoutProfession,
                    size: 24, // 12pt
                    font: 'Arial',
                  }),
                ],
              }),
            ],
          }),
          // ENTREGUÉ CONFORME (Persona que Entrega - user_id)
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.TOP,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 720 },
                children: [
                  new TextRun({
                    text: 'ENTREGUÉ CONFORME',
                    bold: true,
                    size: 24, // 12pt
                    font: 'Arial',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 80 },
                children: [
                  new TextRun({
                    text: userName,
                    bold: true,
                    size: 24, // 12pt
                    font: 'Arial',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: userProfession,
                    size: 24, // 12pt
                    font: 'Arial',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // Pie de Página Centrado en Arial 10pt (size 20)
  const footerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 8, color: '000000' },
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
                    size: 20, // 10pt
                    font: 'Arial',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'WEB: ',
                    size: 20, // 10pt
                    font: 'Arial',
                  }),
                  new TextRun({
                    text: 'http://www.comibol.gob.bo',
                    italics: true,
                    size: 20, // 10pt
                    font: 'Arial',
                  }),
                  new TextRun({
                    text: ' *E-mail: ',
                    size: 20, // 10pt
                    font: 'Arial',
                  }),
                  new TextRun({
                    text: 'comibol@comibol.gob.bo',
                    italics: true,
                    size: 20, // 10pt
                    font: 'Arial',
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
              width: 12240, // Carta (8.5 x 11 pulg)
              height: 15840,
              orientation: PageOrientation.PORTRAIT,
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
          titleParagraph,
          bodyParagraph,
          itemsTable,
          conformityParagraph,
          signaturesTable,
        ],
        footers: {
          default: new Footer({
            children: [footerTable],
          }),
        },
      },
    ],
  });

  return Packer.toBuffer(doc);
}

export async function generateActaDevolucionWordReport(
  acquisition: any,
  returnDetails: any[] = []
): Promise<Buffer> {
  const margin = 1440; // 1 pulgada

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

  const fechaHoy = formatDateSpanish(new Date());
  const checkoutName = acquisition.checkoutUser?.fullName || '...................................';
  const checkoutProfession = acquisition.checkoutUser?.profession || '...................................';
  const checkoutProjectName =
    acquisition.checkoutUser?.project?.name || acquisition.project?.name || '...................................';

  const userName = acquisition.user?.fullName || '...................................';
  const userProfession = acquisition.user?.profession || '...................................';

  // Encabezado
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
                    size: 32, // 16pt
                    font: 'Arial',
                    color: '000000',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 80 },
                children: [
                  new TextRun({
                    text: 'DIRECCIÓN DE PROYECTOS Y GEOLOGIA',
                    bold: true,
                    underline: {},
                    size: 28, // 14pt
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

  // Título: ACTA DE DEVOLUCIÓN
  const titleParagraph = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 360, after: 240 },
    children: [
      new TextRun({
        text: 'ACTA DE DEVOLUCIÓN',
        bold: true,
        size: 28, // 14pt
        font: 'Arial',
      }),
    ],
  });

  // Párrafo introductorio
  const bodyParagraph = new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 120, after: 240, line: 360 },
    children: [
      new TextRun({ text: 'En la ciudad de Oruro, en fecha ', size: 24, font: 'Arial' }),
      new TextRun({ text: fechaHoy, bold: true, size: 24, font: 'Arial' }),
      new TextRun({
        text: ', se realizó la devolución de activos, entregado en calidad de préstamo a ',
        size: 24,
        font: 'Arial',
      }),
      new TextRun({ text: checkoutName, bold: true, size: 24, font: 'Arial' }),
      new TextRun({ text: ', ', size: 24, font: 'Arial' }),
      new TextRun({ text: checkoutProfession, bold: true, size: 24, font: 'Arial' }),
      new TextRun({ text: ', a cargo de ', size: 24, font: 'Arial' }),
      new TextRun({ text: checkoutProjectName, bold: true, size: 24, font: 'Arial' }),
      new TextRun({ text: ', de acuerdo con el siguiente detalle:', size: 24, font: 'Arial' }),
    ],
  });

  // Tabla de ítems devueltos
  const tableRows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          width: { size: 10, type: WidthType.PERCENTAGE },
          verticalAlign: VerticalAlign.CENTER,
          shading: { fill: 'F1F5F9', type: ShadingType.CLEAR, color: 'auto' },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'N°', bold: true, size: 24, font: 'Arial' })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 55, type: WidthType.PERCENTAGE },
          verticalAlign: VerticalAlign.CENTER,
          shading: { fill: 'F1F5F9', type: ShadingType.CLEAR, color: 'auto' },
          children: [
            new Paragraph({
              alignment: AlignmentType.LEFT,
              children: [new TextRun({ text: 'DETALLE', bold: true, size: 24, font: 'Arial' })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 15, type: WidthType.PERCENTAGE },
          verticalAlign: VerticalAlign.CENTER,
          shading: { fill: 'F1F5F9', type: ShadingType.CLEAR, color: 'auto' },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'UNIDAD', bold: true, size: 24, font: 'Arial' })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 20, type: WidthType.PERCENTAGE },
          verticalAlign: VerticalAlign.CENTER,
          shading: { fill: 'F1F5F9', type: ShadingType.CLEAR, color: 'auto' },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'CANTIDAD', bold: true, size: 24, font: 'Arial' })],
            }),
          ],
        }),
      ],
    }),
  ];

  if (returnDetails.length === 0) {
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 4,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'Sin activos seleccionados para devolución.',
                    italics: true,
                    size: 24,
                    font: 'Arial',
                  }),
                ],
              }),
            ],
          }),
        ],
      })
    );
  } else {
    returnDetails.forEach((d: any, index: number) => {
      let detailName = 'Activo Fijo';
      if (d.asset) {
        detailName = `[${d.asset.code}] - ${d.asset.name}`;
      } else if (d.supply?.name) {
        detailName = d.supply.name;
      }

      tableRows.push(
        new TableRow({
          children: [
            new TableCell({
              width: { size: 10, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: `${index + 1}`, size: 24, font: 'Arial' })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 55, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [new TextRun({ text: detailName, size: 24, font: 'Arial' })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 15, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: d.unit || 'PZA', size: 24, font: 'Arial' })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 20, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: `${d.quantity || 1}`, bold: true, size: 24, font: 'Arial' })],
                }),
              ],
            }),
          ],
        })
      );
    });
  }

  const itemsTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      left: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      right: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' },
    },
    rows: tableRows,
  });

  // Párrafo de Conformidad de Devolución
  const conformityParagraph = new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 360, after: 480, line: 360 },
    children: [
      new TextRun({
        text: 'Se deja constancia de la devolución de los activos y/o herramientas detalladas en la presente acta, verificando su estado y condiciones al momento de la recepción',
        size: 24, // 12pt
        font: 'Arial',
      }),
    ],
  });

  // Sección de Firmas (ENTREGUÉ CONFORME / RECIBÍ CONFORME)
  const signaturesTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    },
    rows: [
      new TableRow({
        children: [
          // ENTREGUÉ CONFORME (Persona que Devuelve - checkoutUser)
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.TOP,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 720 },
                children: [
                  new TextRun({
                    text: 'ENTREGUÉ CONFORME',
                    bold: true,
                    size: 24, // 12pt
                    font: 'Arial',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 80 },
                children: [
                  new TextRun({
                    text: checkoutName,
                    bold: true,
                    size: 24, // 12pt
                    font: 'Arial',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: checkoutProfession,
                    size: 24, // 12pt
                    font: 'Arial',
                  }),
                ],
              }),
            ],
          }),
          // RECIBÍ CONFORME (Persona que Recibe en Almacén - user_id)
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.TOP,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 720 },
                children: [
                  new TextRun({
                    text: 'RECIBÍ CONFORME',
                    bold: true,
                    size: 24, // 12pt
                    font: 'Arial',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 80 },
                children: [
                  new TextRun({
                    text: userName,
                    bold: true,
                    size: 24, // 12pt
                    font: 'Arial',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: userProfession,
                    size: 24, // 12pt
                    font: 'Arial',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // Footer (Pie de Página)
  const footerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 8, color: '000000' },
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
                    size: 20, // 10pt
                    font: 'Arial',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'WEB: ',
                    size: 20, // 10pt
                    font: 'Arial',
                  }),
                  new TextRun({
                    text: 'http://www.comibol.gob.bo',
                    italics: true,
                    size: 20, // 10pt
                    font: 'Arial',
                  }),
                  new TextRun({
                    text: ' *E-mail: ',
                    size: 20, // 10pt
                    font: 'Arial',
                  }),
                  new TextRun({
                    text: 'comibol@comibol.gob.bo',
                    italics: true,
                    size: 20, // 10pt
                    font: 'Arial',
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
              width: 12240, // Carta
              height: 15840,
              orientation: PageOrientation.PORTRAIT,
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
          titleParagraph,
          bodyParagraph,
          itemsTable,
          conformityParagraph,
          signaturesTable,
        ],
        footers: {
          default: new Footer({
            children: [footerTable],
          }),
        },
      },
    ],
  });

  return Packer.toBuffer(doc);
}
