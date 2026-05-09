import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, ChevronRight, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface QuoteItemInput {
  productId: number;
  quantity: number;
}

interface CustomItem {
  id: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  cost?: number;
}

export default function CreateQuote() {
  const [, setLocation] = useLocation();
  const { data: customers } = trpc.customers.list.useQuery();
  const { data: products } = trpc.products.list.useQuery();
  const { data: fixedTerms } = trpc.fixedTerms.list.useQuery();
  const createQuote = trpc.quotes.create.useMutation();
  const createCustomQuoteItem = trpc.quotes.createCustomItem.useMutation();

  const [customerId, setCustomerId] = useState<number | null>(null);
  const [items, setItems] = useState<QuoteItemInput[]>([]);
  const [customItems, setCustomItems] = useState<CustomItem[]>([]);
  const [newItemProductId, setNewItemProductId] = useState<number | null>(null);
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [useCustomProduct, setUseCustomProduct] = useState(false);
  const [customProductName, setCustomProductName] = useState("");
  const [customProductPrice, setCustomProductPrice] = useState("");
  const [customProductQuantity, setCustomProductQuantity] = useState(1);
  const [customProductCost, setCustomProductCost] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 查詢工作量
  const { data: workload } = trpc.workload.calculate.useQuery();

  // 自動帶入固定備註
  useEffect(() => {
    if (fixedTerms && fixedTerms.length > 0 && !notes) {
      const defaultNotes = fixedTerms
        .map((term) => `${term.title}\n${term.content}`)
        .join("\n\n");
      setNotes(defaultNotes);
    }
  }, [fixedTerms]);

  const selectedCustomer = customers?.find((c) => c.id === customerId);

  const totalAmount = items.reduce((sum, item) => {
    const product = products?.find((p) => p.id === item.productId);
    if (!product) return sum;
    const unitPrice = parseFloat(product.unitPrice.toString());
    return sum + unitPrice * item.quantity;
  }, 0) + customItems.reduce((sum, item) => {
    return sum + item.unitPrice * item.quantity;
  }, 0);

  const handleAddItem = () => {
    if (!newItemProductId) {
      toast.error("請選擇產品");
      return;
    }
    if (items.some((item) => item.productId === newItemProductId)) {
      toast.error("此產品已添加，請修改數量");
      return;
    }
    setItems([...items, { productId: newItemProductId, quantity: newItemQuantity }]);
    setNewItemProductId(null);
    setNewItemQuantity(1);
  };

  const handleAddCustomItem = () => {
    if (!customProductName.trim()) {
      toast.error("請輸入產品名稱");
      return;
    }
    if (!customProductPrice || isNaN(parseFloat(customProductPrice))) {
      toast.error("請輸入有效的價格");
      return;
    }
    if (customProductQuantity < 1) {
      toast.error("數量必須至少為 1");
      return;
    }

    const newCustomItem: CustomItem = {
      id: `custom-${Date.now()}`,
      productName: customProductName,
      unitPrice: parseFloat(customProductPrice),
      quantity: customProductQuantity,
      cost: customProductCost ? parseFloat(customProductCost) : undefined,
    };

    setCustomItems([...customItems, newCustomItem]);
    setCustomProductName("");
    setCustomProductPrice("");
    setCustomProductQuantity(1);
    setCustomProductCost("");
    setUseCustomProduct(false);
    toast.success("自訂產品已添加");
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleRemoveCustomItem = (id: string) => {
    setCustomItems(customItems.filter((item) => item.id !== id));
  };

  const handleUpdateQuantity = (index: number, quantity: number) => {
    const newItems = [...items];
    newItems[index].quantity = Math.max(1, quantity);
    setItems(newItems);
  };

  const handleUpdateCustomQuantity = (id: string, quantity: number) => {
    const newCustomItems = customItems.map((item) =>
      item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item
    );
    setCustomItems(newCustomItems);
  };

  const handleUpdateCustomCost = (id: string, cost: string) => {
    const newCustomItems = customItems.map((item) =>
      item.id === id ? { ...item, cost: cost ? parseFloat(cost) : undefined } : item
    );
    setCustomItems(newCustomItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerId) {
      toast.error("請選擇客戶");
      return;
    }

    if (items.length === 0 && customItems.length === 0) {
      toast.error("請至少添加一個產品");
      return;
    }

    try {
      setIsSubmitting(true);

      // 建立報價單（只包含預設產品）
      const result = await createQuote.mutateAsync({
        customerId,
        items,
        notes: notes || undefined,
      });

      // 如果有自訂產品，逐個添加
      if (customItems.length > 0) {
        for (const customItem of customItems) {
          await createCustomQuoteItem.mutateAsync({
            quoteId: result.id,
            productName: customItem.productName,
            unitPrice: customItem.unitPrice,
            quantity: customItem.quantity,
            cost: customItem.cost || null,
          });
        }
      }

      toast.success("報價單已建立");
      setLocation(`/quotes/${result.id}`);
    } catch (error) {
      toast.error("建立失敗");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 標題 */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">新建報價單</h1>
          <p className="mt-2 text-muted-foreground">
            選擇客戶和產品，系統將自動計算金額
          </p>
        </div>

        {/* 工作量警告 */}
        {workload && workload.totalDays > 40 && (
          <div className={`rounded-lg border p-4 ${
            workload.totalDays > 60
              ? "border-destructive/50 bg-destructive/5"
              : "border-yellow-500/50 bg-yellow-500/5"
          }`}>
            <div className="flex items-start gap-3">
              <AlertCircle className={`h-5 w-5 flex-shrink-0 ${
                workload.totalDays > 60 ? "text-destructive" : "text-yellow-600"
              }`} />
              <div>
                <p className={`font-medium ${
                  workload.totalDays > 60 ? "text-destructive" : "text-yellow-700"
                }`}>
                  ⚠️ 工作量提醒
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  目前已累積 <strong>{workload.totalDays} 個工作天</strong>，
                  {workload.totalDays > 60
                    ? "已超過 60 天，建議暫停接新案件。"
                    : "已超過 40 天，請評估是否還能接新案件。"}
                </p>
                {workload.projects.length > 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    進行中的案件：{workload.projects.map(p => `${p.customerName}(${p.estimatedDays}天)`).join("、")}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 客戶選擇 */}
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            1. 選擇客戶
          </h2>
          <div>
            <label className="block text-sm font-medium text-foreground">
              客戶 *
            </label>
            <select
              required
              value={customerId || ""}
              onChange={(e) => setCustomerId(e.target.value ? parseInt(e.target.value) : null)}
              className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <option value="">-- 選擇客戶 --</option>
              {customers?.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.companyName}
                  {customer.contactName ? ` (${customer.contactName})` : ""}
                </option>
              ))}
            </select>
          </div>

          {selectedCustomer && (
            <div className="mt-4 rounded-lg bg-muted p-4">
              <p className="font-medium text-foreground">
                {selectedCustomer.companyName}
              </p>
              {selectedCustomer.contactName && (
                <p className="text-sm text-muted-foreground">
                  聯絡人：{selectedCustomer.contactName}
                </p>
              )}
              {selectedCustomer.phone && (
                <p className="text-sm text-muted-foreground">
                  電話：{selectedCustomer.phone}
                </p>
              )}
              {selectedCustomer.email && (
                <p className="text-sm text-muted-foreground">
                  Email：{selectedCustomer.email}
                </p>
              )}
            </div>
          )}
        </Card>

        {/* 產品選擇 */}
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            2. 添加產品
          </h2>

          <div className="space-y-4">
            {/* 預設產品選擇 */}
            {!useCustomProduct && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    產品 *
                  </label>
                  <select
                    value={newItemProductId || ""}
                    onChange={(e) =>
                      setNewItemProductId(e.target.value ? parseInt(e.target.value) : null)
                    }
                    className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  >
                    <option value="">-- 選擇產品 --</option>
                    {products?.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} (NT${parseFloat(product.unitPrice.toString()).toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground">
                    數量
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={newItemQuantity}
                    onChange={(e) => setNewItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="mt-2"
                  />
                </div>

                <div className="flex items-end gap-2">
                  <Button
                    type="button"
                    onClick={handleAddItem}
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    添加
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setUseCustomProduct(true)}
                    className="flex-1"
                  >
                    自訂產品
                  </Button>
                </div>
              </div>
            )}

            {/* 自訂產品輸入 */}
            {useCustomProduct && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    產品名稱 *
                  </label>
                  <Input
                    type="text"
                    value={customProductName}
                    onChange={(e) => setCustomProductName(e.target.value)}
                    placeholder="例：原創歌曲製作"
                    className="mt-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground">
                    單價 (NTD) *
                  </label>
                  <Input
                    type="number"
                    value={customProductPrice}
                    onChange={(e) => setCustomProductPrice(e.target.value)}
                    placeholder="0"
                    className="mt-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground">
                    數量
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={customProductQuantity}
                    onChange={(e) => setCustomProductQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="mt-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground">
                    成本 (NTD)
                  </label>
                  <Input
                    type="number"
                    value={customProductCost}
                    onChange={(e) => setCustomProductCost(e.target.value)}
                    placeholder="0"
                    className="mt-2"
                  />
                </div>

                <div className="flex items-end gap-2">
                  <Button
                    type="button"
                    onClick={handleAddCustomItem}
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    添加
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setUseCustomProduct(false)}
                    className="flex-1"
                  >
                    返回
                  </Button>
                </div>
              </div>
            )}

            {/* 固定條款提示 */}
            {fixedTerms && fixedTerms.length > 0 && (
              <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                <p>✓ 已自動帶入 {fixedTerms.length} 項固定條款</p>
              </div>
            )}

            {/* 已添加的產品列表 */}
            {(items.length > 0 || customItems.length > 0) && (
              <div className="mt-6 space-y-3">
                <h3 className="font-medium text-foreground">已添加的產品</h3>
                
                {/* 預設產品 */}
                {items.map((item, index) => {
                  const product = products?.find((p) => p.id === item.productId);
                  if (!product) return null;
                  const unitPrice = parseFloat(product.unitPrice.toString());
                  const subtotal = unitPrice * item.quantity;

                  return (
                    <div key={index} className="flex items-center justify-between rounded-lg border border-border p-4">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          NT${unitPrice.toLocaleString()} × {item.quantity} = NT${subtotal.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateQuantity(index, parseInt(e.target.value) || 1)
                          }
                          className="w-20"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveItem(index)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {/* 自訂產品 */}
                {customItems.map((item) => {
                  const subtotal = item.unitPrice * item.quantity;

                  return (
                    <div key={item.id} className="flex flex-col rounded-lg border border-border border-dashed bg-muted/30 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{item.productName}</p>
                          <p className="text-sm text-muted-foreground">
                            NT${item.unitPrice.toLocaleString()} × {item.quantity} = NT${subtotal.toLocaleString()}
                          </p>
                          {item.cost !== undefined && (
                            <p className="text-xs text-muted-foreground">
                              成本：NT${item.cost.toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateCustomQuantity(item.id, parseInt(e.target.value) || 1)
                            }
                            className="w-20"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveCustomItem(item.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3 flex items-end gap-2">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-muted-foreground">
                            成本 (NTD)
                          </label>
                          <Input
                            type="number"
                            value={item.cost || ""}
                            onChange={(e) => handleUpdateCustomCost(item.id, e.target.value)}
                            placeholder="0"
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* 備註 */}
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            3. 備註（選填）
          </h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="添加任何額外備註或特殊要求..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            rows={4}
          />
        </Card>

        {/* 總結 */}
        <Card className="border-2 border-primary/20 bg-primary/5 p-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-foreground">產品數量：</span>
              <span className="font-semibold text-foreground">{items.length + customItems.length} 項</span>
            </div>
            <div className="flex justify-between border-t border-border pt-3">
              <span className="text-lg font-semibold text-foreground">總金額：</span>
              <span className="text-2xl font-bold text-primary">
                NT${totalAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </Card>

        {/* 操作按鈕 */}
        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={isSubmitting || !customerId || (items.length === 0 && customItems.length === 0)}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <ChevronRight className="mr-2 h-4 w-4" />
            {isSubmitting ? "建立中..." : "建立報價單"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setLocation("/quotes")}
            className="flex-1"
          >
            取消
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}
