import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, Download, Share2 } from "lucide-react";
import { toast } from "sonner";

interface PDFPreviewProps {
  quoteId: number;
  quoteNumber: string;
  pdfUrl?: string;
  onShare?: () => void;
}

export default function PDFPreview({ quoteId, quoteNumber, pdfUrl, onShare }: PDFPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    if (!pdfUrl) {
      toast.error("PDF 尚未生成");
      return;
    }
    try {
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = `${quoteNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("PDF 已下載");
    } catch (error) {
      toast.error("下載失敗");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Eye className="w-4 h-4" />
          預覽 PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>報價單預覽 - {quoteNumber}</DialogTitle>
          <DialogDescription>在分享前預覽報價單內容</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* PDF 預覽區域 */}
          {pdfUrl ? (
            <div className="border border-border rounded-lg overflow-hidden bg-muted">
              <iframe
                src={pdfUrl}
                className="w-full h-96"
                title={`Preview of ${quoteNumber}`}
              />
            </div>
          ) : (
            <div className="border border-border rounded-lg p-8 text-center bg-muted">
              <p className="text-muted-foreground">PDF 尚未生成，請先生成報價單 PDF</p>
            </div>
          )}

          {/* 操作按鈕 */}
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={handleDownload}
              disabled={!pdfUrl || isLoading}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              下載 PDF
            </Button>
            {onShare && (
              <Button
                onClick={onShare}
                disabled={!pdfUrl || isLoading}
                className="gap-2"
              >
                <Share2 className="w-4 h-4" />
                分享 LINE
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
