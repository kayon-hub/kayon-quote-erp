import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, FileText, Users, Package } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: quotes } = trpc.quotes.list.useQuery();
  const { data: products } = trpc.products.list.useQuery();
  const { data: customers } = trpc.customers.list.useQuery();

  const stats = [
    {
      label: "報價單",
      value: quotes?.length || 0,
      icon: FileText,
      color: "text-blue-600",
      href: "/quotes",
    },
    {
      label: "產品",
      value: products?.length || 0,
      icon: Package,
      color: "text-amber-600",
      href: "/products",
    },
    {
      label: "客戶",
      value: customers?.length || 0,
      icon: Users,
      color: "text-green-600",
      href: "/customers",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* 歡迎區 */}
        <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                歡迎回來，{user?.name}
              </h1>
              <p className="mt-2 text-muted-foreground">
                KAYON STUDIO 報價 ERP 系統
              </p>
            </div>
            <Link href="/quotes/new">
              <Button className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="h-5 w-5" />
                新建報價單
              </Button>
            </Link>
          </div>
        </div>

        {/* 統計卡片 */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link key={stat.label} href={stat.href}>
                <Card className="cursor-pointer transition-shadow hover:shadow-md">
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {stat.label}
                        </p>
                        <p className="mt-2 text-3xl font-bold text-foreground">
                          {stat.value}
                        </p>
                      </div>
                      <Icon className={`h-10 w-10 ${stat.color}`} />
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* 快速操作 */}
        <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
          <h2 className="mb-6 text-2xl font-semibold text-foreground">
            快速操作
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/quotes/new">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="mr-2 h-4 w-4" />
                新建報價單
              </Button>
            </Link>
            <Link href="/products">
              <Button variant="outline" className="w-full justify-start">
                <Package className="mr-2 h-4 w-4" />
                管理產品
              </Button>
            </Link>
            <Link href="/customers">
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                管理客戶
              </Button>
            </Link>
            <Link href="/quotes">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                查看報價單
              </Button>
            </Link>
          </div>
        </div>

        {/* 最近報價單 */}
        {quotes && quotes.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
            <h2 className="mb-6 text-2xl font-semibold text-foreground">
              最近報價單
            </h2>
            <div className="space-y-3">
              {quotes.slice(0, 5).map((quote) => (
                <Link key={quote.id} href={`/quotes/${quote.id}`}>
                  <div className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted">
                    <div>
                      <p className="font-medium text-foreground">
                        {quote.quoteNumber}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {quote.customer?.companyName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        ${parseFloat(quote.totalAmount.toString()).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(quote.createdAt).toLocaleDateString("zh-TW")}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
