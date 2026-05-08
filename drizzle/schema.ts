import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  json,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * 產品/服務項目表
 * 儲存 KAYON STUDIO 提供的所有產品與服務
 */
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // 產品名稱
  description: text("description"), // 產品描述
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(), // 單價 (NTD)
  category: varchar("category", { length: 100 }), // 產品分類
  isActive: int("isActive").default(1).notNull(), // 是否啟用
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * 客戶資料表
 * 儲存常用客戶資訊
 */
export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  companyName: varchar("companyName", { length: 255 }).notNull(), // 公司名稱
  contactName: varchar("contactName", { length: 255 }), // 聯絡人名稱
  phone: varchar("phone", { length: 20 }), // 電話
  email: varchar("email", { length: 255 }), // Email
  address: text("address"), // 地址
  notes: text("notes"), // 備註
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

/**
 * 報價單表
 * 主要報價單記錄
 */
export const quotes = mysqlTable("quotes", {
  id: int("id").autoincrement().primaryKey(),
  quoteNumber: varchar("quoteNumber", { length: 50 }).notNull().unique(), // 報價單號 (KS-20260508-v1)
  customerId: int("customerId").notNull(), // 客戶 ID
  status: mysqlEnum("status", ["draft", "sent", "confirmed", "cancelled"]).default("draft").notNull(), // 狀態
  totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).notNull(), // 總金額
  notes: text("notes"), // 備註
  pdfUrl: varchar("pdfUrl", { length: 500 }), // PDF 雲端連結
  pdfKey: varchar("pdfKey", { length: 255 }), // PDF 儲存鑰匙
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = typeof quotes.$inferInsert;

/**
 * 報價單明細表
 * 儲存報價單中的各個產品項目
 */
export const quoteItems = mysqlTable("quoteItems", {
  id: int("id").autoincrement().primaryKey(),
  quoteId: int("quoteId").notNull(), // 報價單 ID
  productId: int("productId").notNull(), // 產品 ID
  productName: varchar("productName", { length: 255 }).notNull(), // 產品名稱（快照）
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(), // 單價
  quantity: int("quantity").notNull(), // 數量
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(), // 小計
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QuoteItem = typeof quoteItems.$inferSelect;
export type InsertQuoteItem = typeof quoteItems.$inferInsert;

/**
 * 固定條款表
 * 儲存報價單中自動帶入的固定文字（製作流程、版權說明、付款方式等）
 */
export const fixedTerms = mysqlTable("fixedTerms", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(), // 條款鑰匙 (e.g., "productionProcess", "copyright", "paymentMethod")
  title: varchar("title", { length: 255 }).notNull(), // 條款標題
  content: text("content").notNull(), // 條款內容
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FixedTerm = typeof fixedTerms.$inferSelect;
export type InsertFixedTerm = typeof fixedTerms.$inferInsert;

/**
 * 公司資訊表
 * 儲存 KAYON STUDIO 的公司資訊與匯款資訊
 */
export const companyInfo = mysqlTable("companyInfo", {
  id: int("id").autoincrement().primaryKey(),
  companyName: varchar("companyName", { length: 255 }).notNull(), // 公司名稱
  companyNameEn: varchar("companyNameEn", { length: 255 }), // 公司名稱（英文）
  phone: varchar("phone", { length: 20 }), // 電話
  email: varchar("email", { length: 255 }), // Email
  address: text("address"), // 地址
  bankName: varchar("bankName", { length: 255 }), // 銀行名稱
  bankCode: varchar("bankCode", { length: 10 }), // 銀行代碼
  branchName: varchar("branchName", { length: 255 }), // 分行名稱
  accountNumber: varchar("accountNumber", { length: 50 }), // 帳號
  accountHolder: varchar("accountHolder", { length: 255 }), // 戶名
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CompanyInfo = typeof companyInfo.$inferSelect;
export type InsertCompanyInfo = typeof companyInfo.$inferInsert;
