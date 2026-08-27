import PdfPrinter from 'pdfmake';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let printerInstance = null;

async function getPrinter() {
  if (printerInstance) return printerInstance;

  const vfsPath = path.join(__dirname, '../node_modules/pdfmake/build/vfs_fonts.js');
  const mod = await import(pathToFileURL(vfsPath).href);
  const vfs = mod.default?.pdfMake?.vfs || mod.pdfMake?.vfs;

  printerInstance = new PdfPrinter({
    Roboto: {
      normal: Buffer.from(vfs['Roboto-Regular.ttf'], 'base64'),
      bold: Buffer.from(vfs['Roboto-Medium.ttf'], 'base64'),
      italics: Buffer.from(vfs['Roboto-Italic.ttf'], 'base64'),
      bolditalics: Buffer.from(vfs['Roboto-MediumItalic.ttf'], 'base64'),
    },
  });

  return printerInstance;
}

export async function generatePdfReport(session, stats, responses) {
  const printer = await getPrinter();

  const docDefinition = {
    content: [
      { text: '음주성향 자가진단 교육 결과 보고서', style: 'header' },
      { text: `교육 회차: ${session?.name || ''}`, margin: [0, 8, 0, 4] },
      { text: `생성 일시: ${new Date().toLocaleString('ko-KR')}`, margin: [0, 0, 0, 12] },
      { text: `총 응답 완료 인원: ${stats.total}명`, margin: [0, 0, 0, 8] },
      { text: '요인별 평균 점수', style: 'subheader' },
      {
        ul: [
          `죄책감: ${stats.averages.guilt} (기준: 24점)`,
          `운전능력 과신: ${stats.averages.overconfidence} (기준: 15점)`,
          `잘못된 손익계산: ${stats.averages.miscalculation} (기준: 10점)`,
          `내부귀인: ${stats.averages.internal_attr} (기준: 13점)`,
          `외부귀인: ${stats.averages.external_attr} (기준: 13점)`,
          `자기통제력: ${stats.averages.self_control} (기준: 9점)`,
          `충동성: ${stats.averages.impulsiveness} (기준: 17점)`,
          `감각추구성향: ${stats.averages.sensation_seeking} (기준: 24점)`,
          `도덕성: ${stats.averages.morality} (기준: 19점)`,
        ],
      },
      { text: '응답자 결과 목록 (최대 50명)', style: 'subheader', margin: [0, 12, 0, 6] },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto', '*'],
          body: [
            ['시간', '성별', '연령대', '죄책감', '과신', '손익', '결과 유형'],
            ...responses.slice(0, 50).map((r) => {
              const results = r.result_json ? JSON.parse(r.result_json) : {};
              return [
                r.completed_at ? r.completed_at.slice(11, 19) : '',
                r.gender || '',
                r.age_group || '',
                String(results.guilt?.score ?? ''),
                String(results.overconfidence?.score ?? ''),
                String(results.miscalculation?.score ?? ''),
                r.result_type || '',
              ];
            }),
          ],
        },
        layout: 'lightHorizontalLines',
      },
    ],
    defaultStyle: { font: 'Roboto', fontSize: 9 },
    styles: {
      header: { fontSize: 14, bold: true },
      subheader: { fontSize: 11, bold: true, margin: [0, 10, 0, 4] },
    },
  };

  return new Promise((resolve, reject) => {
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const chunks = [];
    pdfDoc.on('data', (chunk) => chunks.push(chunk));
    pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
    pdfDoc.on('error', reject);
    pdfDoc.end();
  });
}
