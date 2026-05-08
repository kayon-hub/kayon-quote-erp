import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

const COLORS = ["#1a1a1a", "#d4af37", "#2d5016", "#3b82f6", "#8b5cf6", "#ec4899"];

export default function SalesPerformance() {
  const { data: quotes, isLoading } = trpc.quotes.list.useQuery();
  const { data: users } = trpc.auth.me.useQuery();

  const performanceData = useMemo(() => {
    if (!quotes) return { bySalesPerson: [], bySignedBy: [], totalByStatus: { draft: 0, sent: 0, confirmed: 0, cancelled: 0 } };

    // 按業務員統計
    const bySalesPerson: Record<string, number> = {};
    const bySignedBy: Record<string, number> = {};
    let totalByStatus = { draft: 0, sent: 0, confirmed: 0, cancelled: 0 };

    quotes.forEach((quote) => {
      // 統計狀態
      totalByStatus[quote.status as keyof typeof totalByStatus]++;

      // 只統計已確認的報價單
      if (quote.status === "confirmed") {
        const amount = parseFloat(quote.totalAmount.toString());

        if (quote.salesPersonId) {
          bySalesPerson[`業務員 ${quote.salesPersonId}`] = (bySalesPerson[`業務員 ${quote.salesPersonId}`] || 0) + amount;
        }

        if (quote.signedByUserId) {
          bySignedBy[`簽名者 ${quote.signedByUserId}`] = (bySignedBy[`簽名者 ${quote.signedByUserId}`] || 0) + amount;
        }
      }
    });

    return {
      bySalesPerson: Object.entries(bySalesPerson).map(([name, value]) => ({ name, value })),
      bySignedBy: Object.entries(bySignedBy).map(([name, value]) => ({ name, value })),
      totalByStatus,
    };
  }, [quotes]);

  const statusData = useMemo(() => {
    if (!performanceData.totalByStatus) return [];
    return [
      { name: "草稿", value: performanceData.totalByStatus.draft },
      { name: "已發送", value: performanceData.totalByStatus.sent },
      { name: "已確認", value: performanceData.totalByStatus.confirmed },
      { name: "已取消", value: performanceData.totalByStatus.cancelled },
    ].filter(item => item.value > 0);
  }, [performanceData.totalByStatus]);

  const totalConfirmedAmount = useMemo(() => {
    return (performanceData.bySalesPerson || []).reduce((sum, item) => sum + item.value, 0);
  }, [performanceData.bySalesPerson]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 概覽卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">總報價單數</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{quotes?.length || 0}</div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">已確認</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{performanceData.totalByStatus.confirmed}</div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">已發送</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{performanceData.totalByStatus?.sent || 0}</div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">確認金額</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">NT${totalConfirmedAmount.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* 圖表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 業務員業績 */}
        {performanceData.bySalesPerson.length > 0 && (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>業務員業績統計</CardTitle>
              <CardDescription>已確認報價單金額</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceData.bySalesPerson}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `NT$${value.toLocaleString()}`} />
                  <Bar dataKey="value" fill="#1a1a1a" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* 簽名者業績 */}
        {performanceData.bySignedBy.length > 0 && (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>簽名者業績統計</CardTitle>
              <CardDescription>已確認報價單金額</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceData.bySignedBy}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `NT$${value.toLocaleString()}`} />
                  <Bar dataKey="value" fill="#d4af37" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* 報價單狀態分佈 */}
        {statusData.length > 0 && (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>報價單狀態分佈</CardTitle>
              <CardDescription>所有報價單的狀態比例</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 詳細列表 */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>業績詳細資訊</CardTitle>
          <CardDescription>所有已確認報價單的業績分配</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {quotes
              ?.filter((q) => q.status === "confirmed")
              .map((quote) => (
                <div key={quote.id} className="flex items-center justify-between p-4 border border-border/50 rounded-lg">
                  <div>
                    <p className="font-semibold">{quote.quoteNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      業務員: {quote.salesPersonId ? `ID ${quote.salesPersonId}` : "未指派"} | 簽名者: {quote.signedByUserId ? `ID ${quote.signedByUserId}` : "未簽名"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">NT${parseFloat(quote.totalAmount.toString()).toLocaleString()}</p>
                    <Badge variant="outline" className="mt-1">
                      {quote.status === "confirmed" ? "已確認" : quote.status}
                    </Badge>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
