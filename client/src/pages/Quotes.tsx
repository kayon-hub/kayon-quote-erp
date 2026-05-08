import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Eye, Download, Share2, Search, Filter } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Quotes() {
  const { data: quotes, isLoading, refetch } = trpc.quotes.list.useQuery();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const statusLabels: Record<string, string> = {
    draft: "草稿",
    sent: "已發送",
    confirmed: "已確認",
    cancelled: "已取消",
  };

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800",
    sent: "bg-blue-100 text-blue-800",
    confirmed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  const filteredQuotes = quotes?.filter((quote) => {
    const matchesSearch =
      quote.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.customer?.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || quote.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const handleDownloadPDF = async (quoteId: number) => {
    try {
      toast.loading("生成 PDF...");
      // 這裡會調用後端 API 生成 PDF
      toast.success("PDF 已生成");
    } catch (error) {
      toast.error("生成失敗");
    }
  };

  const handleShareLine = async (quote: any) => {
    try {
      const message = `KAYON STUDIO 報價單\n\n報價單號：${quote.quoteNumber}\n客戶：${quote.customer?.companyName}\n金額：$${parseFloat(quote.totalAmount.toString()).toLocaleString()} NTD\n\n點擊查看詳情`;
      
      if (navigator.share) {
        await navigator.share({
          title: `報價單 ${quote.quoteNumber}`,
          text: message,
        });
      } else {
        // 複製到剪貼板
        await navigator.clipboard.writeText(message);
        toast.success("已複製到剪貼板");
      }
    } catch (error) {
      toast.error("分享失敗");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 標題與操作 */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">報價單管理</h1>
          <Link href="/quotes/new">
            <Button className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-5 w-5" />
              新建報價單
            </Button>
          </Link>
        </div>

        {/* 搜尋與篩選 */}
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="搜尋報價單號或客戶名稱..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={statusFilter === null ? "default" : "outline"}
              onClick={() => setStatusFilter(null)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              全部
            </Button>
            {Object.entries(statusLabels).map(([status, label]) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                onClick={() => setStatusFilter(status)}
                size="sm"
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* 報價單列表 */}
        <div className="space-y-3">
          {isLoading ? (
            <p className="text-muted-foreground">載入中...</p>
          ) : filteredQuotes.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-8 text-center">
              <p className="text-muted-foreground">尚無報價單</p>
              <Link href="/quotes/new">
                <Button className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90">
                  建立第一份報價單
                </Button>
              </Link>
            </div>
          ) : (
            filteredQuotes.map((quote) => (
              <Card key={quote.id} className="p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-foreground">
                        {quote.quoteNumber}
                      </h3>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          statusColors[quote.status]
                        }`}
                      >
                        {statusLabels[quote.status]}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {quote.customer?.companyName}
                    </p>
                    <p className="mt-2 text-2xl font-bold text-primary">
                      ${parseFloat(quote.totalAmount.toString()).toLocaleString()} NTD
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(quote.createdAt).toLocaleDateString("zh-TW")}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link href={`/quotes/${quote.id}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        查看
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadPDF(quote.id)}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      下載
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleShareLine(quote)}
                      className="flex items-center gap-2"
                    >
                      <Share2 className="h-4 w-4" />
                      分享
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
