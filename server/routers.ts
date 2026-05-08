import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { generateQuoteNumber } from "./utils/quoteNumberGenerator";
import { generateQuotePDF } from "./utils/pdfGenerator";
import { storagePut } from "./storage";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ========== 產品管理 ==========
  products: router({
    list: protectedProcedure.query(async () => {
      return db.getProducts();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getProductById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        unitPrice: z.string().regex(/^\d+(\.\d{1,2})?$/),
        category: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.createProduct({
          name: input.name,
          description: input.description || null,
          unitPrice: parseFloat(input.unitPrice),
          category: input.category || null,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        unitPrice: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
        category: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const updateData: any = {};
        if (data.name) updateData.name = data.name;
        if (data.description !== undefined) updateData.description = data.description || null;
        if (data.unitPrice) updateData.unitPrice = parseFloat(data.unitPrice);
        if (data.category !== undefined) updateData.category = data.category || null;
        return db.updateProduct(id, updateData);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return db.deleteProduct(input.id);
      }),
  }),

  // ========== 客戶管理 ==========
  customers: router({
    list: protectedProcedure.query(async () => {
      return db.getCustomers();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getCustomerById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        companyName: z.string().min(1),
        contactName: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        address: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.createCustomer(input);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        companyName: z.string().min(1).optional(),
        contactName: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        address: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return db.updateCustomer(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return db.deleteCustomer(input.id);
      }),
  }),

  // ========== 報價單管理 ==========
  quotes: router({
    list: protectedProcedure.query(async () => {
      const quotes = await db.getQuotes();
      // 補充客戶資訊
      const result = await Promise.all(
        quotes.map(async (quote) => {
          const customer = await db.getCustomerById(quote.customerId);
          return { ...quote, customer };
        })
      );
      return result;
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const quote = await db.getQuoteById(input.id);
        if (!quote) return null;
        const customer = await db.getCustomerById(quote.customerId);
        const items = await db.getQuoteItems(input.id);
        return { ...quote, customer, items };
      }),

    create: protectedProcedure
      .input(z.object({
        customerId: z.number(),
        items: z.array(z.object({
          productId: z.number(),
          quantity: z.number().min(1),
        })),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // 生成報價單號
        const quoteNumber = await generateQuoteNumber();
        
        // 計算總金額
        let totalAmount = 0;
        const itemsData = [];
        
        for (const item of input.items) {
          const product = await db.getProductById(item.productId);
          if (!product) throw new Error(`Product ${item.productId} not found`);
          
          const unitPrice = parseFloat(product.unitPrice.toString());
          const subtotal = unitPrice * item.quantity;
          totalAmount += subtotal;
          
          itemsData.push({
            productId: item.productId,
            productName: product.name,
            unitPrice: unitPrice,
            quantity: item.quantity,
            subtotal: subtotal,
          });
        }

        // 建立報價單
        const result = await db.createQuote({
          quoteNumber,
          customerId: input.customerId,
          totalAmount,
          notes: input.notes || null,
          status: 'draft',
        });

        // 取得新建立的報價單
        const newQuote = await db.getQuoteByNumber(quoteNumber);
        if (!newQuote) throw new Error('Failed to create quote');
        const quoteId = newQuote.id;

        // 建立報價單明細
        for (const item of itemsData) {
          await db.createQuoteItem({
            quoteId,
            ...item,
          });
        }

        return { id: quoteId, quoteNumber, totalAmount };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['draft', 'sent', 'confirmed', 'cancelled']).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return db.updateQuote(id, data);
      }),

    // 生成 PDF 並上傳雲端
    generatePDF: protectedProcedure
      .input(z.object({ quoteId: z.number() }))
      .mutation(async ({ input }) => {
        const quote = await db.getQuoteById(input.quoteId);
        if (!quote) throw new Error("Quote not found");

        const customer = await db.getCustomerById(quote.customerId);
        if (!customer) throw new Error("Customer not found");

        const items = await db.getQuoteItems(input.quoteId);
        const companyInfo = await db.getCompanyInfo();
        const fixedTerms = await db.getFixedTerms();

        // 生成 PDF
        const pdfBuffer = await generateQuotePDF({
          quote,
          customer,
          items,
          companyInfo,
          fixedTerms,
        });

        // 上傳至雲端
        const fileKey = `quotes/${quote.quoteNumber}.pdf`;
        const { url, key } = await storagePut(fileKey, pdfBuffer, 'application/pdf');

        // 更新報價單
        await db.updateQuote(input.quoteId, {
          pdfUrl: url,
          pdfKey: key,
        });

        return { url, pdfKey: key };
      }),

    // 取得報價單 PDF URL
    getPDFUrl: protectedProcedure
      .input(z.object({ quoteId: z.number() }))
      .query(async ({ input }) => {
        const quote = await db.getQuoteById(input.quoteId);
        if (!quote || !quote.pdfUrl) return null;
        return { url: quote.pdfUrl };
      }),
  }),

  // ========== 固定條款管理 ==========
  fixedTerms: router({
    list: protectedProcedure.query(async () => {
      return db.getFixedTerms();
    }),

    getByKey: protectedProcedure
      .input(z.object({ key: z.string() }))
      .query(async ({ input }) => {
        return db.getFixedTermByKey(input.key);
      }),

    upsert: protectedProcedure
      .input(z.object({
        key: z.string(),
        title: z.string(),
        content: z.string(),
      }))
      .mutation(async ({ input }) => {
        return db.upsertFixedTerm(input.key, input.title, input.content);
      }),
  }),

  // ========== 公司資訊管理 ==========
  companyInfo: router({
    get: protectedProcedure.query(async () => {
      return db.getCompanyInfo();
    }),

    upsert: protectedProcedure
      .input(z.object({
        companyName: z.string(),
        companyNameEn: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        address: z.string().optional(),
        bankName: z.string().optional(),
        bankCode: z.string().optional(),
        branchName: z.string().optional(),
        accountNumber: z.string().optional(),
        accountHolder: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.upsertCompanyInfo(input);
      }),
  }),

  // ========== 工作量管理 ==========
  workload: router({
    calculate: protectedProcedure.query(async () => {
      return db.calculateWorkload();
    }),

    getServiceTypes: protectedProcedure.query(async () => {
      return db.getServiceTypes();
    }),
  }),
});

export type AppRouter = typeof appRouter;
