import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Customers() {
  const { data: customers, isLoading, refetch } = trpc.customers.list.useQuery();
  const createCustomer = trpc.customers.create.useMutation();
  const updateCustomer = trpc.customers.update.useMutation();
  const deleteCustomer = trpc.customers.delete.useMutation();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    companyName: "",
    contactName: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });

  const filteredCustomers = customers?.filter(
    (c) =>
      c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contactName?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateCustomer.mutateAsync({
          id: editingId,
          ...formData,
        });
        toast.success("客戶已更新");
      } else {
        await createCustomer.mutateAsync(formData);
        toast.success("客戶已新增");
      }
      setFormData({
        companyName: "",
        contactName: "",
        phone: "",
        email: "",
        address: "",
        notes: "",
      });
      setEditingId(null);
      setShowForm(false);
      refetch();
    } catch (error) {
      toast.error("操作失敗");
    }
  };

  const handleEdit = (customer: any) => {
    setFormData({
      companyName: customer.companyName,
      contactName: customer.contactName || "",
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
      notes: customer.notes || "",
    });
    setEditingId(customer.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("確定要刪除此客戶嗎？")) {
      try {
        await deleteCustomer.mutateAsync({ id });
        toast.success("客戶已刪除");
        refetch();
      } catch (error) {
        toast.error("刪除失敗");
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 標題與操作 */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">客戶管理</h1>
          <Button
            onClick={() => {
              setFormData({
                companyName: "",
                contactName: "",
                phone: "",
                email: "",
                address: "",
                notes: "",
              });
              setEditingId(null);
              setShowForm(!showForm);
            }}
            className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-5 w-5" />
            新增客戶
          </Button>
        </div>

        {/* 搜尋欄 */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="搜尋客戶名稱或聯絡人..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* 新增/編輯表單 */}
        {showForm && (
          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground">
                  公司名稱 *
                </label>
                <Input
                  required
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData({ ...formData, companyName: e.target.value })
                  }
                  placeholder="例：ABC 公司"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground">
                  聯絡人
                </label>
                <Input
                  value={formData.contactName}
                  onChange={(e) =>
                    setFormData({ ...formData, contactName: e.target.value })
                  }
                  placeholder="例：王小明"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    電話
                  </label>
                  <Input
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="例：0912345678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="例：contact@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground">
                  地址
                </label>
                <Input
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="例：台北市中山區..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground">
                  備註
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="客戶相關備註..."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {editingId ? "更新" : "新增"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  取消
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* 客戶列表 */}
        <div className="space-y-3">
          {isLoading ? (
            <p className="text-muted-foreground">載入中...</p>
          ) : filteredCustomers.length === 0 ? (
            <p className="text-muted-foreground">尚無客戶</p>
          ) : (
            filteredCustomers.map((customer) => (
              <Card key={customer.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">
                      {customer.companyName}
                    </h3>
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {customer.contactName && (
                        <p>聯絡人：{customer.contactName}</p>
                      )}
                      {customer.phone && <p>電話：{customer.phone}</p>}
                      {customer.email && <p>Email：{customer.email}</p>}
                      {customer.address && <p>地址：{customer.address}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(customer)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(customer.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
