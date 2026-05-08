import * as db from "../db";

/**
 * 生成報價單號
 * 格式: KS-YYYYMMDD-v{序號}
 * 例: KS-20260508-v1
 */
export async function generateQuoteNumber(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
  
  // 查詢今日已有的報價單數量
  const quotes = await db.getQuotes();
  const todayQuotes = quotes.filter(q => {
    const qDate = q.createdAt.toISOString().split('T')[0].replace(/-/g, '');
    return qDate === dateStr;
  });
  
  const nextVersion = todayQuotes.length + 1;
  return `KS-${dateStr}-v${nextVersion}`;
}
