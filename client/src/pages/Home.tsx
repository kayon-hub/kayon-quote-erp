import { Button } from "@/components/ui/button";
import { Users, FileText } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/50">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-foreground mb-2">KAYON STUDIO 報價 ERP 系統</h1>
        <p className="text-lg text-muted-foreground mb-8">專業、優雅、高效的報價單管理解決方案</p>

        {/* 快速操作按鈕 */}
        <div className="flex gap-4 flex-wrap mb-12">
          <Button 
            size="lg" 
            variant="default" 
            onClick={() => window.location.href = '/customers'}
            className="gap-2"
          >
            <Users className="w-4 h-4" />
            客戶管理
          </Button>
          <Button 
            size="lg" 
            variant="default" 
            onClick={() => window.location.href = '/quotes/new'}
            className="gap-2"
          >
            <FileText className="w-4 h-4" />
            建立新報價單
          </Button>
        </div>

        <p className="text-muted-foreground">選擇上方按鈕開始使用系統。</p>
      </div>
    </div>
  );
}
