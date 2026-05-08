import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Upload } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function DataImport() {
  const [newCustomer, setNewCustomer] = useState({
    companyName: "",
    contactName: "",
    phone: "",
    email: "",
    address: "",
  });

  const [productInput, setProductInput] = useState("");
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);

  const createCustomerMutation = trpc.customers.create.useMutation();
  const createProductMutation = trpc.products.create.useMutation();

  const handleAddCustomer = async () => {
    if (!newCustomer.companyName || !newCustomer.email) {
      toast.error("請填寫公司名稱與郵箱");
      return;
    }

    try {
      await createCustomerMutation.mutateAsync({
        companyName: newCustomer.companyName,
        contactName: newCustomer.contactName,
        phone: newCustomer.phone,
        email: newCustomer.email,
        address: newCustomer.address,
      });

      toast.success("客戶新增成功");
      setNewCustomer({ companyName: "", contactName: "", phone: "", email: "", address: "" });
      setIsCustomerDialogOpen(false);
    } catch (error) {
      toast.error("客戶新增失敗");
    }
  };

  const handleBulkAddProducts = async () => {
    const lines = productInput.trim().split("\n").filter(line => line.trim());
    if (lines.length === 0) {
      toast.error("請輸入產品資訊");
      return;
    }

    let successCount = 0;
    for (const line of lines) {
      const parts = line.split("|").map(p => p.trim());
      if (parts.length < 2) continue;

      try {
        await createProductMutation.mutateAsync({
          name: parts[0],
          unitPrice: parts[1],
          description: parts[2] || "",
        });
        successCount++;
      } catch (error) {
        console.error("產品新增失敗:", error);
      }
    }

    toast.success(`成功新增 ${successCount} 個產品`);
    setProductInput("");
    setIsProductDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 客戶快速新增 */}
        <Card className="border-border/50 hover:border-border/80 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              快速新增客戶
            </CardTitle>
            <CardDescription>一鍵新增單個客戶資訊</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">新增客戶</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>新增客戶</DialogTitle>
                  <DialogDescription>輸入客戶基本資訊</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="company">公司名稱 *</Label>
                    <Input
                      id="company"
                      placeholder="例：ABC 設計公司"
                      value={newCustomer.companyName}
                      onChange={(e) => setNewCustomer({ ...newCustomer, companyName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact">聯絡人</Label>
                    <Input
                      id="contact"
                      placeholder="例：王小明"
                      value={newCustomer.contactName}
                      onChange={(e) => setNewCustomer({ ...newCustomer, contactName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">電話</Label>
                    <Input
                      id="phone"
                      placeholder="例：0912-345-678"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">郵箱 *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="例：contact@example.com"
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">地址</Label>
                    <Input
                      id="address"
                      placeholder="例：台北市信義區"
                      value={newCustomer.address}
                      onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleAddCustomer} className="w-full" disabled={createCustomerMutation.isPending}>
                    {createCustomerMutation.isPending ? "新增中..." : "確認新增"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* 產品批量導入 */}
        <Card className="border-border/50 hover:border-border/80 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              批量新增產品
            </CardTitle>
            <CardDescription>一次新增多個產品</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">新增產品</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>批量新增產品</DialogTitle>
                  <DialogDescription>
                    每行一個產品，格式：產品名稱 | 單價 | 描述（可選）
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Textarea
                    placeholder={`例：\n音樂製作 | 15000 | 原創音樂製作\nPodcast 錄製 | 5000 | 專業錄音棚錄製\nMV 製作 | 8000 | 4K 靜態 MV`}
                    value={productInput}
                    onChange={(e) => setProductInput(e.target.value)}
                    className="min-h-[200px]"
                  />
                  <Button onClick={handleBulkAddProducts} className="w-full" disabled={createProductMutation.isPending}>
                    {createProductMutation.isPending ? "新增中..." : "確認新增"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      {/* 使用說明 */}
      <Card className="border-border/50 bg-background/50">
        <CardHeader>
          <CardTitle className="text-base">使用說明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div>
            <p className="font-semibold text-foreground mb-1">客戶新增：</p>
            <p>點擊「新增客戶」按鈕，填寫客戶基本資訊即可快速新增單個客戶。</p>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">產品批量新增：</p>
            <p>點擊「新增產品」按鈕，按照格式輸入產品資訊，每行一個產品。格式為：產品名稱 | 單價 | 描述（可選）</p>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">範例：</p>
            <p className="font-mono text-xs bg-muted p-2 rounded">
              音樂製作 | 15000 | 原創音樂製作<br />
              Podcast 錄製 | 5000 | 專業錄音棚<br />
              MV 製作 | 8000 | 4K 靜態 MV
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
