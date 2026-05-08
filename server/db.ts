import { eq, desc, and, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, products, customers, quotes, quoteItems, fixedTerms, companyInfo } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ========== 產品管理 ==========
export async function getProducts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(eq(products.isActive, 1)).orderBy(desc(products.createdAt));
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createProduct(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(products).values(data);
  return result;
}

export async function updateProduct(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(products).set(data).where(eq(products.id, id));
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(products).set({ isActive: 0 }).where(eq(products.id, id));
}

// ========== 客戶管理 ==========
export async function getCustomers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(customers).orderBy(desc(customers.createdAt));
}

export async function getCustomerById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createCustomer(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(customers).values(data);
  return result;
}

export async function updateCustomer(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(customers).set(data).where(eq(customers.id, id));
}

export async function deleteCustomer(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(customers).where(eq(customers.id, id));
}

// ========== 報價單管理 ==========
export async function getQuotes() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(quotes).orderBy(desc(quotes.createdAt));
}

export async function getQuoteById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(quotes).where(eq(quotes.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getQuoteByNumber(quoteNumber: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(quotes).where(eq(quotes.quoteNumber, quoteNumber)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createQuote(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(quotes).values(data);
  return result;
}

export async function updateQuote(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(quotes).set(data).where(eq(quotes.id, id));
}

export async function getQuotesByCustomerId(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(quotes).where(eq(quotes.customerId, customerId)).orderBy(desc(quotes.createdAt));
}

// ========== 報價單明細 ==========
export async function getQuoteItems(quoteId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(quoteItems).where(eq(quoteItems.quoteId, quoteId));
}

export async function createQuoteItem(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(quoteItems).values(data);
}

export async function deleteQuoteItems(quoteId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(quoteItems).where(eq(quoteItems.quoteId, quoteId));
}

// ========== 固定條款 ==========
export async function getFixedTerms() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(fixedTerms);
}

export async function getFixedTermByKey(key: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(fixedTerms).where(eq(fixedTerms.key, key)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertFixedTerm(key: string, title: string, content: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(fixedTerms).values({ key, title, content }).onDuplicateKeyUpdate({
    set: { title, content },
  });
}

// ========== 公司資訊 ==========
export async function getCompanyInfo() {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(companyInfo).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertCompanyInfo(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getCompanyInfo();
  if (existing) {
    return db.update(companyInfo).set(data).where(eq(companyInfo.id, existing.id));
  } else {
    return db.insert(companyInfo).values(data);
  }
}
