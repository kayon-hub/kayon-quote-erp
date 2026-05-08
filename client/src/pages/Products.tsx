import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Products() {
  const { data: products, isLoading, refetch } = trpc.products.list.useQuery();
  const createProduct = trpc.products.create.useMutation();
  const updateProduct = trpc.products.update.useMutation();
  const deleteProduct = trpc.products.delete.useMutation();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    unitPrice: "",
    category: "",
  });

  const filteredProducts = products?.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateProduct.mutateAsync({
          id: editingId,
          ...formData,
        });
        toast.success("產品已更新");
      } else {
        await createProduct.mutateAsync(formData);
        toast.success("產品已新增");
      }
      setFormData({ name: "", description: "", unitPrice: "", category: "" });
      setEditingId(null);
      setShowForm(false);
      refetch();
    } catch (error) {
      toast.error("操作失敗");
    }
  };

  const handleEdit = (product: any) => {
    setFormData({
      name: product.name,
      description: product.description || "",
      unitPrice: product.unitPrice.toString(),
      category: product.category || "",
    });
    setEditingId(product.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("確定要刪除此產品嗎？")) {
      try {
        await deleteProduct.mutateAsync({ id });
        toast.success("產品已刪除");
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
          <h1 className="text-3xl font-bold text-foreground">產品管理</h1>
          <Button
            onClick={() => {
              setFormData({ name: "", description: "", unitPrice: "", category: "" });
              setEditingId(null);
              setShowForm(!showForm);
            }}
            className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-5 w-5" />
            新增產品
          </Button>
        </div>

        {/* 搜尋欄 */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="搜尋產品名稱或分類..."
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
                  產品名稱 *
                </label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="例：錄音服務"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground">
                  單價 (NTD) *
                </label>
                <Input
                  required
                  type="number"
                  step="0.01"
                  value={formData.unitPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, unitPrice: e.target.value })
                  }
                  placeholder="例：5000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground">
                  分類
                </label>
                <Input
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  placeholder="例：音樂製作"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground">
                  描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="產品詳細描述..."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  rows={4}
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

        {/* 產品列表 */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <p className="text-muted-foreground">載入中...</p>
          ) : filteredProducts.length === 0 ? (
            <p className="text-muted-foreground">尚無產品</p>
          ) : (
            filteredProducts.map((product) => (
              <Card key={product.id} className="p-6">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {product.name}
                    </h3>
                    {product.category && (
                      <p className="text-sm text-muted-foreground">
                        {product.category}
                      </p>
                    )}
                  </div>

                  <p className="text-2xl font-bold text-primary">
                    ${parseFloat(product.unitPrice.toString()).toLocaleString()}
                  </p>

                  {product.description && (
                    <p className="text-sm text-muted-foreground">
                      {product.description}
                    </p>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(product)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(product.id)}
                      className="flex-1 text-destructive"
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
