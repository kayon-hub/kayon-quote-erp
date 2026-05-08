import { useParams, useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Share2, Edit, Trash2, ArrowLeft, Eye } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";
import PDFPreview from "@/components/PDFPreview";

export default function QuoteDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const quoteId = params?.id ? parseInt(params.id as string) : null;

  const { data: quote, isLoading } = trpc.quotes.getById.useQuery(
    { id: quoteId! },
    { enabled: !!quoteId }
  );

  const generatePDF = trpc.quotes.generatePDF.useMutation();
  const getPDFUrl = trpc.quotes.getPDFUrl.useQuery(
    { quoteId: quoteId! },
    { enabled: !!quoteId }
  );

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleGeneratePDF = async () => {
    if (!quoteId) return;
    try {
      setIsGeneratingPDF(true);
      await generatePDF.mutateAsync({ quoteId });
      toast.success("PDF 已生成");
      // 重新查詢 PDF URL
      await getPDFUrl.refetch();
    } catch (error) {
      toast.error("生成 PDF 失敗");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!getPDFUrl.data?.url) {
      toast.error("PDF 尚未生成");
      return;
    }
    try {
      const response = await fetch(getPDFUrl.data.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${quote?.quoteNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("PDF 已下載");
    } catch (error) {
      toast.error("下載失敗");
    }
  };

  const handleShareLine = async () => {
    if (!quote) return;
    try {
      const message = `KAYON STUDIO 報價單\n\n報價單號：${quote.quoteNumber}\n客戶：${quote.customer?.companyName}\n金額：$${parseFloat(quote.totalAmount.toString()).toLocaleString()} NTD\n\n${getPDFUrl.data?.url ? `查看報價單：${getPDFUrl.data.url}` : ""}`;

      // LINE 分享連結
      const lineShareUrl = `https://line.me/R/msg/text/?${encodeURIComponent(message)}`;
      window.open(lineShareUrl, '_blank');
      toast.success("已開啟 LINE 分享");
    } catch (error) {
      toast.error("分享失敗");
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">載入中...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!quote) {
    return (
      <DashboardLayout>
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">報價單不存在</p>
          <Button
            onClick={() => setLocation("/quotes")}
            className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            返回列表
          </Button>
        </div>
      </DashboardLayout>
    );
  }

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 標題與操作 */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation("/quotes")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-3xl font-bold text-foreground">
                {quote.quoteNumber}
              </h1>
              <span
                className={`rounded-full px-3 py-1 text-sm font-medium ${
                  statusColors[quote.status]
                }`}
              >
                {statusLabels[quote.status]}
              </span>
            </div>
            <p className="mt-2 text-muted-foreground">
              建立於 {new Date(quote.createdAt).toLocaleDateString("zh-TW")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!getPDFUrl.data?.url && (
              <Button
                onClick={handleGeneratePDF}
                disabled={isGeneratingPDF}
                className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Download className="h-4 w-4" />
                {isGeneratingPDF ? "生成中..." : "生成 PDF"}
              </Button>
            )}
            {getPDFUrl.data?.url && (
              <>
                <PDFPreview
                  quoteId={quote.id}
                  quoteNumber={quote.quoteNumber}
                  pdfUrl={getPDFUrl.data.url}
                  onShare={handleShareLine}
                />
                <Button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Download className="h-4 w-4" />
                  下載 PDF
                </Button>
                <Button
                  onClick={handleShareLine}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  分享
                </Button>
              </>
            )}
          </div>
        </div>

        {/* 客戶資訊 */}
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            客戶資訊
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">公司名稱</p>
              <p className="mt-1 text-foreground">{quote.customer?.companyName}</p>
            </div>
            {quote.customer?.contactName && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">聯絡人</p>
                <p className="mt-1 text-foreground">{quote.customer.contactName}</p>
              </div>
            )}
            {quote.customer?.phone && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">電話</p>
                <p className="mt-1 text-foreground">{quote.customer.phone}</p>
              </div>
            )}
            {quote.customer?.email && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="mt-1 text-foreground">{quote.customer.email}</p>
              </div>
            )}
          </div>
        </Card>

        {/* 項目明細 */}
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            項目明細
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                    項目
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">
                    單價
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">
                    數量
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">
                    小計
                  </th>
                </tr>
              </thead>
              <tbody>
                {quote.items?.map((item, index) => (
                  <tr key={index} className="border-b border-border">
                    <td className="px-4 py-3 text-foreground">
                      {item.productName}
                    </td>
                    <td className="px-4 py-3 text-right text-foreground">
                      ${parseFloat(item.unitPrice.toString()).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-foreground">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-foreground">
                      ${parseFloat(item.subtotal.toString()).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 總計 */}
          <div className="mt-6 flex justify-end">
            <div className="w-full max-w-xs space-y-2 border-t border-border pt-4">
              <div className="flex justify-between">
                <span className="text-foreground">小計：</span>
                <span className="font-semibold text-foreground">
                  ${parseFloat(quote.totalAmount.toString()).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="text-lg font-bold text-foreground">總金額：</span>
                <span className="text-2xl font-bold text-primary">
                  ${parseFloat(quote.totalAmount.toString()).toLocaleString()} NTD
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* 備註 */}
        {quote.notes && (
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold text-foreground">備註</h2>
            <p className="whitespace-pre-wrap text-foreground">{quote.notes}</p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
