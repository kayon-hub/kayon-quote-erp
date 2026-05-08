import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, TrendingUp, FileText, Users, Target } from "lucide-react";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useMemo } from "react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const { data: quotes } = trpc.quotes.list.useQuery();

  const stats = useMemo(() => {
    if (!quotes) return { totalRevenue: 0, confirmedCount: 0, pendingCount: 0, completedCount: 0, progressPercent: 0 };

    const confirmed = quotes.filter(q => q.status === "confirmed");
    const totalRevenue = confirmed.reduce((sum, q) => sum + parseFloat(q.totalAmount.toString()), 0);
    const confirmedCount = confirmed.length;
    const pendingCount = quotes.filter(q => q.status === "sent").length;
    const completedCount = 0; // 暫時設為 0，因為系統中沒有 completed 狀態
    const progressPercent = quotes.length > 0 ? Math.round((completedCount / quotes.length) * 100) : 0;

    return { totalRevenue, confirmedCount, pendingCount, completedCount, progressPercent };
  }, [quotes]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/50">
      <div className="container mx-auto px-4 py-12">
        {/* 標題 */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-2">KAYON STUDIO 報價 ERP 系統</h1>
          <p className="text-lg text-muted-foreground">專業、優雅、高效的報價單管理解決方案</p>
        </div>

        {/* 業績儀表板 */}
        {isAuthenticated && (
          <div className="space-y-8">
            {/* 業績統計卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-border/50 hover:border-border/80 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    本月業績
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">NT${stats.totalRevenue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">已確認報價單金額</p>
                </CardContent>
              </Card>

              <Card className="border-border/50 hover:border-border/80 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    已確認
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{stats.confirmedCount}</div>
                  <p className="text-xs text-muted-foreground mt-1">確認中的案件</p>
                </CardContent>
              </Card>

              <Card className="border-border/50 hover:border-border/80 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    待審核
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{stats.pendingCount}</div>
                  <p className="text-xs text-muted-foreground mt-1">已發送的報價單</p>
                </CardContent>
              </Card>

              <Card className="border-border/50 hover:border-border/80 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    已完成
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">{stats.completedCount}</div>
                  <p className="text-xs text-muted-foreground mt-1">完成的案件</p>
                </CardContent>
              </Card>
            </div>

            {/* 進度條 */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>案件進度</CardTitle>
                <CardDescription>所有報價單的完成進度</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">完成率</span>
                      <span className="text-sm font-bold text-primary">{stats.progressPercent}%</span>
                    </div>
                    <Progress value={stats.progressPercent} className="h-2" />
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-foreground">{quotes?.length || 0}</p>
                      <p className="text-xs text-muted-foreground">總報價單</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">{stats.confirmedCount}</p>
                      <p className="text-xs text-muted-foreground">已確認</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-600">{stats.completedCount}</p>
                      <p className="text-xs text-muted-foreground">已完成</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 未登入提示 */}
        {!isAuthenticated && (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold mb-4">歡迎使用 KAYON STUDIO 報價 ERP 系統</h2>
            <p className="text-muted-foreground mb-6">請登入以開始管理您的報價單與客戶資訊</p>
            <Button size="lg" onClick={() => window.location.href = getLoginUrl()}>
              立即登入
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
