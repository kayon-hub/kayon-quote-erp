import { PDFDocument, PDFPage, rgb, degrees } from 'pdf-lib';
import { Quote, Customer, QuoteItem, CompanyInfo, FixedTerm } from '../../drizzle/schema';
import fetch from 'node-fetch';
import type { Response } from 'node-fetch';
import fontkit from '@pdf-lib/fontkit';

interface PDFGeneratorInput {
  quote: Quote;
  customer: Customer;
  items: QuoteItem[];
  companyInfo: CompanyInfo | undefined;
  fixedTerms: FixedTerm[];
  logoUrl?: string;
  signatureUrl?: string;
}

/**
 * 從 URL 取得圖片並轉換為 Base64
 */
async function fetchImageAsBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const buffer = await response.buffer();
    return buffer.toString('base64');
  } catch (error) {
    console.warn(`Failed to fetch image from ${url}:`, error);
    return '';
  }
}

/**
 * 生成 PDF 報價單
 * 依照 KAYON STUDIO 既有範本格式排版，含 LOGO 與電子簽名
 */
export async function generateQuotePDF(input: PDFGeneratorInput): Promise<Buffer> {
  const { quote, customer, items, companyInfo, fixedTerms, logoUrl, signatureUrl } = input;

  // 建立 PDF 文件
  const pdfDoc = await PDFDocument.create();
  
  // 註冊 fontkit 以支援中文字體
  pdfDoc.registerFontkit(fontkit);
  
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
  const gold = rgb(0.85, 0.73, 0.35); // KAYON 金色

  let yPosition = height - 40;

  // ========== 頁首：LOGO 與標題 ==========
  if (logoUrl) {
    try {
      const logoBase64 = await fetchImageAsBase64(logoUrl);
      if (logoBase64) {
        const logoImage = await pdfDoc.embedPng(Buffer.from(logoBase64, 'base64'));
        const logoDims = logoImage.scale(0.15);
        page.drawImage(logoImage, {
          x: 40,
          y: yPosition - 60,
          width: logoDims.width,
          height: logoDims.height,
        });
      }
    } catch (error) {
      console.warn('Failed to embed logo:', error);
    }
  }

  // 標題
  page.drawText('KAYON STUDIO ｜ 報價單', {
    x: 150,
    y: yPosition - 20,
    size: titleFontSize,
    color: darkGray,
  });

  page.drawText('(Quotation)', {
    x: 150,
    y: yPosition - 40,
    size: 12,
    color: gold,
  });

  yPosition -= 80;

  // ========== 客戶資訊區 ==========
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

  // ========== 報價資訊區 ==========
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

  // ========== 項目表格 ==========
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

  // ========== 總金額 ==========
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
    color: gold,
  });

  yPosition -= 30;

  // ========== 固定條款 ==========
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
    yPosition -= 25;
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
    yPosition -= 25;
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
    yPosition -= 25;
  }

  yPosition -= 10;

  // ========== 匯款資訊 ==========
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

  yPosition -= 30;

  // ========== 簽名區 ==========
  page.drawText('簽名 (Signature)', {
    x: 40,
    y: yPosition,
    size: fontSize,
    color: darkGray,
  });

  yPosition -= 25;

  // 嵌入電子簽名
  if (signatureUrl) {
    try {
      const signatureBase64 = await fetchImageAsBase64(signatureUrl);
      if (signatureBase64) {
        const signatureImage = await pdfDoc.embedPng(Buffer.from(signatureBase64, 'base64'));
        const signatureDims = signatureImage.scale(0.25);
        page.drawImage(signatureImage, {
          x: 40,
          y: yPosition - signatureDims.height - 10,
          width: signatureDims.width,
          height: signatureDims.height,
        });
        yPosition -= signatureDims.height + 20;
      }
    } catch (error) {
      console.warn('Failed to embed signature:', error);
      page.drawText('_________________________', {
        x: 40,
        y: yPosition,
        size: smallFontSize,
        color: black,
      });
      yPosition -= 20;
    }
  } else {
    page.drawText('_________________________', {
      x: 40,
      y: yPosition,
      size: smallFontSize,
      color: black,
    });
    yPosition -= 20;
  }

  page.drawText('KAYON STUDIO', {
    x: 40,
    y: yPosition,
    size: smallFontSize,
    color: darkGray,
  });

  // 轉換為 Buffer
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
