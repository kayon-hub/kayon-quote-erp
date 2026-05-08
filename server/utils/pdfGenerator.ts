import { PDFDocument, PDFPage, rgb, degrees } from 'pdf-lib';
import { Quote, Customer, QuoteItem, CompanyInfo, FixedTerm } from '../../drizzle/schema';

interface PDFGeneratorInput {
  quote: Quote;
  customer: Customer;
  items: QuoteItem[];
  companyInfo: CompanyInfo | undefined;
  fixedTerms: FixedTerm[];
}

/**
 * 生成 PDF 報價單
 * 依照 KAYON STUDIO 既有範本格式排版
 */
export async function generateQuotePDF(input: PDFGeneratorInput): Promise<Buffer> {
  const { quote, customer, items, companyInfo, fixedTerms } = input;

  // 建立 PDF 文件
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 尺寸
  const { width, height } = page.getSize();

  // 設定字體
  const fontSize = 12;
  const smallFontSize = 10;
  const titleFontSize = 20;

  // 顏色定義
  const darkGray = rgb(0.2, 0.2, 0.2);
  const lightGray = rgb(0.9, 0.9, 0.9);
  const black = rgb(0, 0, 0);

  let yPosition = height - 40;

  // 標題
  page.drawText('KAYON STUDIO ｜ 報價單 (Quotation)', {
    x: 40,
    y: yPosition,
    size: titleFontSize,
    color: darkGray,
  });

  yPosition -= 40;

  // 客戶資訊區
  page.drawText('客戶資訊 (Customer Information)', {
    x: 40,
    y: yPosition,
    size: fontSize,
    color: darkGray,
  });

  yPosition -= 20;
  page.drawText(`公司名稱: ${customer.companyName}`, {
    x: 40,
    y: yPosition,
    size: smallFontSize,
    color: black,
  });

  yPosition -= 15;
  if (customer.contactName) {
    page.drawText(`聯絡人: ${customer.contactName}`, {
      x: 40,
      y: yPosition,
      size: smallFontSize,
      color: black,
    });
    yPosition -= 15;
  }

  if (customer.phone) {
    page.drawText(`電話: ${customer.phone}`, {
      x: 40,
      y: yPosition,
      size: smallFontSize,
      color: black,
    });
    yPosition -= 15;
  }

  if (customer.email) {
    page.drawText(`Email: ${customer.email}`, {
      x: 40,
      y: yPosition,
      size: smallFontSize,
      color: black,
    });
    yPosition -= 15;
  }

  if (customer.address) {
    page.drawText(`地址: ${customer.address}`, {
      x: 40,
      y: yPosition,
      size: smallFontSize,
      color: black,
    });
    yPosition -= 15;
  }

  yPosition -= 15;

  // 報價資訊區
  page.drawText('報價資訊 (Quotation Info)', {
    x: 350,
    y: yPosition + 20,
    size: fontSize,
    color: darkGray,
  });

  page.drawText(`報價單號: ${quote.quoteNumber}`, {
    x: 350,
    y: yPosition,
    size: smallFontSize,
    color: black,
  });

  yPosition -= 15;
  page.drawText(`報價日期: ${quote.createdAt.toLocaleDateString('zh-TW')}`, {
    x: 350,
    y: yPosition,
    size: smallFontSize,
    color: black,
  });

  yPosition -= 40;

  // 項目表格
  page.drawText('項目明細 (Items)', {
    x: 40,
    y: yPosition,
    size: fontSize,
    color: darkGray,
  });

  yPosition -= 25;

  // 表格標題
  const colWidths = [40, 200, 80, 80, 100];
  const headers = ['#', '項目', '單價 (NTD)', '數量', '小計 (NTD)'];
  let xPosition = 40;

  // 繪製表格標題背景
  page.drawRectangle({
    x: 40,
    y: yPosition - 15,
    width: 515,
    height: 20,
    color: lightGray,
  });

  // 繪製表格標題
  headers.forEach((header, idx) => {
    page.drawText(header, {
      x: xPosition,
      y: yPosition - 10,
      size: smallFontSize,
      color: darkGray,
    });
    xPosition += colWidths[idx];
  });

  yPosition -= 30;

  // 繪製表格行
  items.forEach((item, idx) => {
    const rowData = [
      (idx + 1).toString(),
      item.productName,
      `$${parseFloat(item.unitPrice.toString()).toFixed(2)}`,
      item.quantity.toString(),
      `$${parseFloat(item.subtotal.toString()).toFixed(2)}`,
    ];

    xPosition = 40;
    rowData.forEach((data, colIdx) => {
      page.drawText(data, {
        x: xPosition,
        y: yPosition,
        size: smallFontSize,
        color: black,
      });
      xPosition += colWidths[colIdx];
    });

    yPosition -= 20;
  });

  yPosition -= 10;

  // 總金額
  page.drawText('總金額 (Total Amount):', {
    x: 350,
    y: yPosition,
    size: fontSize,
    color: darkGray,
  });

  page.drawText(`$${parseFloat(quote.totalAmount.toString()).toFixed(2)} NTD`, {
    x: 450,
    y: yPosition,
    size: fontSize,
    color: darkGray,
  });

  yPosition -= 30;

  // 固定條款
  const fixedTermsMap = new Map(fixedTerms.map(t => [t.key, t]));

  // 製作流程
  const productionProcess = fixedTermsMap.get('productionProcess');
  if (productionProcess) {
    page.drawText(`製作流程 | ${productionProcess.content}`, {
      x: 40,
      y: yPosition,
      size: smallFontSize,
      color: black,
    });
    yPosition -= 30;
  }

  // 版權說明
  const copyright = fixedTermsMap.get('copyright');
  if (copyright) {
    page.drawText(`版權與使用說明 | ${copyright.content}`, {
      x: 40,
      y: yPosition,
      size: smallFontSize,
      color: black,
    });
    yPosition -= 30;
  }

  // 付款方式
  const paymentMethod = fixedTermsMap.get('paymentMethod');
  if (paymentMethod) {
    page.drawText(`付款方式 | ${paymentMethod.content}`, {
      x: 40,
      y: yPosition,
      size: smallFontSize,
      color: black,
    });
    yPosition -= 30;
  }

  yPosition -= 10;

  // 匯款資訊
  if (companyInfo) {
    page.drawText('匯款資訊 (Bank Transfer Information)', {
      x: 40,
      y: yPosition,
      size: fontSize,
      color: darkGray,
    });

    yPosition -= 20;
    page.drawText(`銀行: ${companyInfo.bankName} (${companyInfo.bankCode}) ${companyInfo.branchName}`, {
      x: 40,
      y: yPosition,
      size: smallFontSize,
      color: black,
    });

    yPosition -= 15;
    page.drawText(`帳號: ${companyInfo.accountNumber}`, {
      x: 40,
      y: yPosition,
      size: smallFontSize,
      color: black,
    });

    yPosition -= 15;
    page.drawText(`戶名: ${companyInfo.accountHolder}`, {
      x: 40,
      y: yPosition,
      size: smallFontSize,
      color: black,
    });
  }

  // 轉換為 Buffer
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
