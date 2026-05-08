import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// 模擬認證使用者
function createAuthContext(): TrpcContext {
  const user = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("Products Router", () => {
  const ctx = createAuthContext();
  const caller = appRouter.createCaller(ctx);

  it("should list products", async () => {
    const products = await caller.products.list();
    expect(Array.isArray(products)).toBe(true);
  });

  it("should create a product", async () => {
    const result = await caller.products.create({
      name: "Test Product",
      description: "A test product",
      unitPrice: "1000.00",
      category: "Music Production",
    });
    expect(result).toBeDefined();
  });

  it("should handle invalid price format", async () => {
    try {
      await caller.products.create({
        name: "Invalid Product",
        description: "Invalid price",
        unitPrice: "invalid",
        category: "Test",
      });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.message).toContain("Invalid");
    }
  });
});

describe("Customers Router", () => {
  const ctx = createAuthContext();
  const caller = appRouter.createCaller(ctx);

  it("should list customers", async () => {
    const customers = await caller.customers.list();
    expect(Array.isArray(customers)).toBe(true);
  });

  it("should create a customer", async () => {
    const result = await caller.customers.create({
      companyName: "Test Company",
      contactName: "John Doe",
      phone: "0912345678",
      email: "john@example.com",
      address: "123 Main St",
    });
    expect(result).toBeDefined();
  });

  it("should require company name", async () => {
    try {
      await caller.customers.create({
        companyName: "",
        contactName: "John Doe",
      });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.message).toContain("Too small");
    }
  });
});

describe("Quotes Router", () => {
  const ctx = createAuthContext();
  const caller = appRouter.createCaller(ctx);

  it("should list quotes", async () => {
    const quotes = await caller.quotes.list();
    expect(Array.isArray(quotes)).toBe(true);
  });

  it("should handle invalid quote ID", async () => {
    const result = await caller.quotes.getById({ id: 99999 });
    expect(result).toBeNull();
  });
});

describe("Fixed Terms Router", () => {
  const ctx = createAuthContext();
  const caller = appRouter.createCaller(ctx);

  it("should list fixed terms", async () => {
    const terms = await caller.fixedTerms.list();
    expect(Array.isArray(terms)).toBe(true);
  });

  it("should upsert a fixed term", async () => {
    const result = await caller.fixedTerms.upsert({
      key: "productionProcess",
      title: "製作流程",
      content: "確認需求與音檔 → 簽約 → 訂金60% → 製作 → 詞曲確認及修改共兩次→ 錄音→ 母帶處理→尾款交付",
    });
    expect(result).toBeDefined();
  });
});

describe("Company Info Router", () => {
  const ctx = createAuthContext();
  const caller = appRouter.createCaller(ctx);

  it("should get company info", async () => {
    const info = await caller.companyInfo.get();
    // 可能為 undefined 或 object
    expect(info === undefined || typeof info === "object").toBe(true);
  });

  it("should upsert company info", async () => {
    const result = await caller.companyInfo.upsert({
      companyName: "KAYON STUDIO",
      companyNameEn: "KAYON STUDIO",
      phone: "0912345678",
      email: "contact@kayon.studio",
      address: "Taipei, Taiwan",
      bankName: "國泰世華銀行",
      bankCode: "013",
      branchName: "竹城分行",
      accountNumber: "2105-0630-7630",
      accountHolder: "洪曜騏",
    });
    expect(result).toBeDefined();
  });
});
