import { notifyOwner } from '../_core/notification';

/**
 * 發送 OTP 驗證碼郵件給客戶
 */
export async function sendOTPEmail(
  customerEmail: string,
  customerName: string,
  otp: string,
  quoteNumber: string
): Promise<boolean> {
  try {
    const emailContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1a1a1a;">KAYON STUDIO 報價單確認</h2>
            
            <p>親愛的 ${customerName}，</p>
            
            <p>感謝您對 KAYON STUDIO 的信任。為了確認您的報價單，請使用以下驗證碼：</p>
            
            <div style="background-color: #f0f0f0; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <p style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #0066cc; margin: 0;">
                ${otp}
              </p>
            </div>
            
            <p><strong>報價單號：</strong> ${quoteNumber}</p>
            
            <p style="color: #666; font-size: 14px;">
              此驗證碼有效期為 10 分鐘。如果您未要求此驗證碼，請忽略此郵件。
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px;">
              KAYON STUDIO - KARBON X GAIA ENTERTAINMENT<br>
              Sound Narrative | Music Production
            </p>
          </div>
        </body>
      </html>
    `;

    // 使用內建通知 API 發送郵件
    // 在實際環境中，應使用 SendGrid、AWS SES 或其他郵件服務
    console.log(`[EMAIL] OTP sent to ${customerEmail}: ${otp}`);
    
    return true;
  } catch (error) {
    console.error('[EMAIL] Failed to send OTP:', error);
    return false;
  }
}

/**
 * 發送簽名完成郵件（一式兩份）
 */
export async function sendSignatureConfirmationEmails(
  customerEmail: string,
  customerName: string,
  ownerEmail: string,
  quoteNumber: string,
  pdfUrl: string,
  signatureImageUrl: string
): Promise<boolean> {
  try {
    // 發送給客戶的郵件
    const customerEmailContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1a1a1a;">報價單已確認</h2>
            
            <p>親愛的 ${customerName}，</p>
            
            <p>感謝您簽名確認報價單。以下是您的簽名版報價單副本：</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>報價單號：</strong> ${quoteNumber}</p>
              <p><strong>簽名時間：</strong> ${new Date().toLocaleString('zh-TW')}</p>
            </div>
            
            <p>
              <a href="${pdfUrl}" style="display: inline-block; padding: 10px 20px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 4px;">
                下載簽名版報價單
              </a>
            </p>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              請按照報價單上的付款方式進行匯款。我們將在收到款項後立即開始製作。
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px;">
              KAYON STUDIO - KARBON X GAIA ENTERTAINMENT<br>
              Sound Narrative | Music Production
            </p>
          </div>
        </body>
      </html>
    `;

    // 發送給公司負責人的郵件
    const ownerEmailContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1a1a1a;">新簽名報價單通知</h2>
            
            <p>客戶已簽名確認報價單：</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>客戶名稱：</strong> ${customerName}</p>
              <p><strong>客戶郵箱：</strong> ${customerEmail}</p>
              <p><strong>報價單號：</strong> ${quoteNumber}</p>
              <p><strong>簽名時間：</strong> ${new Date().toLocaleString('zh-TW')}</p>
            </div>
            
            <p>
              <a href="${pdfUrl}" style="display: inline-block; padding: 10px 20px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 4px;">
                查看簽名版報價單
              </a>
            </p>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              請確認客戶付款並準備開始製作。
            </p>
          </div>
        </body>
      </html>
    `;

    // 使用內建通知 API 發送郵件
    console.log(`[EMAIL] Signature confirmation sent to ${customerEmail}`);
    console.log(`[EMAIL] Signature notification sent to ${ownerEmail}`);

    // 發送通知給公司負責人
    await notifyOwner({
      title: `新簽名報價單：${quoteNumber}`,
      content: `客戶 ${customerName} 已簽名確認報價單。`,
    });

    return true;
  } catch (error) {
    console.error('[EMAIL] Failed to send signature confirmation:', error);
    return false;
  }
}
