const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } = require('docx');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const GeneratedFile = require('../models/GeneratedFile');
const logger = require('../utils/logger');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const sanitizeFilename = (filename, fallbackName, extension) => {
  const rawName = path.basename(filename || fallbackName);
  const normalized = rawName
    .replace(/[^\w.\- ]+/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_');

  return normalized.toLowerCase().endsWith(`.${extension}`)
    ? normalized
    : `${normalized}.${extension}`;
};

// ─── Excel Generation ────────────────────────────────────────────────────
const generateExcel = async ({ userId, filename, title, headers, data, sheetName = 'Sheet1' }) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ARIA AI Agent';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(sheetName, {
    pageSetup: { paperSize: 9, orientation: 'landscape' }
  });

  // Title row
  sheet.mergeCells('A1', `${String.fromCharCode(64 + (headers?.length || 5))}1`);
  const titleCell = sheet.getCell('A1');
  titleCell.value = title || 'AI Generated Report';
  titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6C63FF' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(1).height = 40;

  // Headers row
  if (headers && headers.length > 0) {
    const headerRow = sheet.getRow(2);
    headers.forEach((header, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = header;
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4A47A3' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
      };
      sheet.getColumn(i + 1).width = Math.max(15, header.length + 5);
    });
    headerRow.height = 25;
  }

  // Data rows
  if (data && data.length > 0) {
    data.forEach((rowData, rowIdx) => {
      const row = sheet.getRow(rowIdx + 3);
      const isEven = rowIdx % 2 === 0;
      const rowValues = Array.isArray(rowData) ? rowData : Object.values(rowData);
      
      rowValues.forEach((value, colIdx) => {
        const cell = row.getCell(colIdx + 1);
        cell.value = value;
        cell.fill = {
          type: 'pattern', pattern: 'solid',
          fgColor: { argb: isEven ? 'FFF8F8FF' : 'FFFFFFFF' }
        };
        cell.border = {
          bottom: { style: 'thin', color: { argb: 'FFEEEEEE' } },
          right: { style: 'thin', color: { argb: 'FFEEEEEE' } }
        };
        cell.alignment = { vertical: 'middle', wrapText: true };
      });
      row.height = 20;
    });
  }

  // Add auto-filter
  if (headers && headers.length > 0) {
    sheet.autoFilter = {
      from: { row: 2, column: 1 },
      to: { row: 2, column: headers.length }
    };
  }

  const safeFilename = sanitizeFilename(filename, `report_${uuidv4().slice(0, 8)}.xlsx`, 'xlsx');
  const filePath = path.join(UPLOAD_DIR, safeFilename);
  await workbook.xlsx.writeFile(filePath);

  const stats = fs.statSync(filePath);
  const record = await GeneratedFile.create({
    user: userId,
    filename: safeFilename,
    fileType: 'xlsx',
    filePath,
    fileSize: stats.size,
    metadata: { rows: data?.length || 0, sheets: 1 }
  });

  logger.info(`📊 Excel generated: ${safeFilename} (${stats.size} bytes)`);
  return { filePath, filename: safeFilename, fileId: record._id, size: stats.size };
};

// ─── PDF Generation ──────────────────────────────────────────────────────
const generatePDF = async ({ userId, filename, title, content, sections = [] }) => {
  const safeFilename = sanitizeFilename(filename, `document_${uuidv4().slice(0, 8)}.pdf`, 'pdf');
  const filePath = path.join(UPLOAD_DIR, safeFilename);

  return new Promise(async (resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 60, bottom: 60, left: 72, right: 72 },
      info: { Title: title || 'AI Generated Document', Author: 'ARIA AI Agent' }
    });

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // ── Header ──
    doc.rect(0, 0, doc.page.width, 80).fill('#6C63FF');
    doc.fillColor('white').fontSize(24).font('Helvetica-Bold')
      .text(title || 'AI Generated Document', 72, 25, { align: 'center' });
    
    doc.fillColor('#CCCCCC').fontSize(10).font('Helvetica')
      .text(`Generated by ARIA AI Agent • ${new Date().toLocaleDateString()}`, 72, 55, { align: 'center' });

    doc.moveDown(3);

    // ── Content ──
    doc.fillColor('#333333');

    if (sections.length > 0) {
      sections.forEach((section, idx) => {
        // Section heading
        if (section.title) {
          doc.fontSize(14).font('Helvetica-Bold').fillColor('#6C63FF')
            .text(section.title, { paragraphGap: 5 });
          doc.moveTo(72, doc.y).lineTo(doc.page.width - 72, doc.y)
            .strokeColor('#6C63FF').lineWidth(1).stroke();
          doc.moveDown(0.5);
        }

        // Section content
        if (section.content) {
          doc.fontSize(11).font('Helvetica').fillColor('#444444')
            .text(section.content, { paragraphGap: 4, lineGap: 3 });
        }

        // Table in section
        if (section.table) {
          doc.moveDown(0.5);
          const { headers: tHeaders, rows: tRows } = section.table;
          const colWidth = (doc.page.width - 144) / (tHeaders?.length || 1);

          // Table header
          doc.rect(72, doc.y, doc.page.width - 144, 20).fill('#4A47A3');
          tHeaders?.forEach((h, i) => {
            doc.fillColor('white').fontSize(9).font('Helvetica-Bold')
              .text(h, 72 + i * colWidth + 4, doc.y - 15, { width: colWidth - 8 });
          });
          doc.moveDown(0.3);

          // Table rows
          tRows?.forEach((row, ri) => {
            const rowY = doc.y;
            const bgColor = ri % 2 === 0 ? '#F8F8FF' : '#FFFFFF';
            doc.rect(72, rowY, doc.page.width - 144, 18).fill(bgColor);
            row.forEach((cell, ci) => {
              doc.fillColor('#333333').fontSize(9).font('Helvetica')
                .text(String(cell), 72 + ci * colWidth + 4, rowY + 4, { width: colWidth - 8 });
            });
            doc.y = rowY + 18;
          });
          doc.moveDown(0.5);
        }

        doc.moveDown(1);
      });
    } else if (content) {
      doc.fontSize(11).font('Helvetica').fillColor('#444444')
        .text(content, { paragraphGap: 6, lineGap: 4 });
    }

    // ── Footer ──
    const pageCount = doc.bufferedPageRange ? doc.bufferedPageRange().count : 1;
    doc.rect(0, doc.page.height - 40, doc.page.width, 40).fill('#1A1A2E');
    doc.fillColor('#AAAAAA').fontSize(8)
      .text('ARIA AI Desktop Agent — Confidential', 72, doc.page.height - 25);

    doc.end();

    stream.on('finish', async () => {
      const stats = fs.statSync(filePath);
      const record = await GeneratedFile.create({
        user: userId,
        filename: safeFilename,
        fileType: 'pdf',
        filePath,
        fileSize: stats.size,
        metadata: { wordCount: content?.split(' ').length || 0 }
      });
      logger.info(`📄 PDF generated: ${safeFilename}`);
      resolve({ filePath, filename: safeFilename, fileId: record._id, size: stats.size });
    });

    stream.on('error', reject);
  });
};

// ─── DOCX Generation ─────────────────────────────────────────────────────
const generateDOCX = async ({ userId, filename, title, content, sections = [] }) => {
  const children = [];

  // Title
  children.push(new Paragraph({
    text: title || 'AI Generated Document',
    heading: HeadingLevel.TITLE,
    alignment: AlignmentType.CENTER,
    spacing: { after: 300 }
  }));

  // Generated info
  children.push(new Paragraph({
    children: [
      new TextRun({
        text: `Generated by ARIA AI Agent on ${new Date().toLocaleDateString()}`,
        italics: true,
        color: '888888',
        size: 18
      })
    ],
    alignment: AlignmentType.CENTER,
    spacing: { after: 600 }
  }));

  // Sections
  if (sections.length > 0) {
    sections.forEach(section => {
      if (section.title) {
        children.push(new Paragraph({
          text: section.title,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 }
        }));
      }
      if (section.content) {
        children.push(new Paragraph({
          children: [new TextRun({ text: section.content, size: 22 })],
          spacing: { after: 200 }
        }));
      }
    });
  } else if (content) {
    const paragraphs = content.split('\n').filter(p => p.trim());
    paragraphs.forEach(para => {
      children.push(new Paragraph({
        children: [new TextRun({ text: para, size: 22 })],
        spacing: { after: 200 }
      }));
    });
  }

  const doc = new Document({
    creator: 'ARIA AI Agent',
    title: title || 'AI Generated Document',
    sections: [{ properties: {}, children }]
  });

  const safeFilename = sanitizeFilename(filename, `document_${uuidv4().slice(0, 8)}.docx`, 'docx');
  const filePath = path.join(UPLOAD_DIR, safeFilename);

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(filePath, buffer);

  const stats = fs.statSync(filePath);
  const record = await GeneratedFile.create({
    user: userId,
    filename: safeFilename,
    fileType: 'docx',
    filePath,
    fileSize: stats.size
  });

  logger.info(`📝 DOCX generated: ${safeFilename}`);
  return { filePath, filename: safeFilename, fileId: record._id, size: stats.size };
};

module.exports = { generateExcel, generatePDF, generateDOCX };
