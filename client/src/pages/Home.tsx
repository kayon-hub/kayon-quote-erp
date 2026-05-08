import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, CheckCircle, Zap, Shield, BarChart3 } from "lucide-react";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        {/* 導航 */}
        <nav className="border-b border-border bg-card">
          <div className="container flex items-center justify-between py-4">
            <h1 className="text-2xl font-bold text-primary">KAYON STUDIO</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                歡迎，{user?.name}
              </span>
              <Link href="/dashboard">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  進入系統
                </Button>
              </Link>
            </div>
          </div>
        </nav>

        {/* 主內容 */}
        <div className="container py-12">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-foreground">
              KAYON STUDIO 報價 ERP 系統
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              專業、優雅、高效的報價單管理解決方案
            </p>
            <Link href="/dashboard">
              <Button className="mt-8 bg-primary text-primary-foreground hover:bg-primary/90">
                開始使用 <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 導航 */}
      <nav className="border-b border-border bg-card">
        <div className="container flex items-center justify-between py-4">
          <h1 className="text-2xl font-bold text-primary">KAYON STUDIO</h1>
          <a href={getLoginUrl()}>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              登入
            </Button>
          </a>
        </div>
      </nav>

      {/* 英雄區 */}
      <section className="container py-20">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-5xl font-bold text-foreground">
              專業報價，輕鬆管理
            </h2>
            <p className="mt-6 text-xl text-muted-foreground">
              KAYON STUDIO 報價 ERP 系統為您提供優雅、高效的報價單管理解決方案。一鍵生成專業 PDF，直接分享至 LINE，讓客戶溝通更順暢。
            </p>
            <div className="mt-8 flex gap-4">
              <a href={getLoginUrl()}>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  立即開始 <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
              <Button variant="outline">了解更多</Button>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-accent" />
                <span className="text-foreground">自動化報價單生成</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-accent" />
                <span className="text-foreground">專業 PDF 匯出</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-accent" />
                <span className="text-foreground">LINE 一鍵分享</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-accent" />
                <span className="text-foreground">客戶與產品管理</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-accent" />
                <span className="text-foreground">雲端安全儲存</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 功能介紹 */}
      <section className="border-t border-border bg-muted/30 py-20">
        <div className="container">
          <h3 className="text-center text-3xl font-bold text-foreground">
            核心功能
          </h3>
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                icon: Zap,
                title: "快速建立",
                description: "選擇客戶和產品，系統自動計算金額，幾秒鐘即可生成專業報價單",
              },
              {
                icon: BarChart3,
                title: "完整管理",
                description: "集中管理產品、客戶、報價單，搜尋、篩選、追蹤所有報價記錄",
              },
              {
                icon: Shield,
                title: "安全可靠",
                description: "雲端安全儲存，生成永久連結，隨時隨地分享給客戶",
              },
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="p-6">
                  <Icon className="h-12 w-12 text-secondary" />
                  <h4 className="mt-4 text-xl font-semibold text-foreground">
                    {feature.title}
                  </h4>
                  <p className="mt-2 text-muted-foreground">
                    {feature.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA 區 */}
      <section className="container py-20">
        <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-12 text-center">
          <h3 className="text-3xl font-bold text-foreground">
            準備好提升您的報價流程了嗎？
          </h3>
          <p className="mt-4 text-lg text-muted-foreground">
            加入 KAYON STUDIO，體驗優雅、高效的報價管理
          </p>
          <a href={getLoginUrl()}>
            <Button className="mt-8 bg-primary text-primary-foreground hover:bg-primary/90">
              立即開始 <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </a>
        </div>
      </section>

      {/* 頁腳 */}
      <footer className="border-t border-border bg-card py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>&copy; 2026 KAYON STUDIO. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
