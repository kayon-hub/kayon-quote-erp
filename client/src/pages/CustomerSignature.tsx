import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';
import { toast } from 'sonner';

export default function CustomerSignature() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const quoteId = parseInt(searchParams.get('quoteId') || '0');
  const customerId = parseInt(searchParams.get('customerId') || '0');

  const [step, setStep] = useState<'otp' | 'signature' | 'complete'>('otp');
  const [otp, setOtp] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [signatureId, setSignatureId] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const initiateSignature = trpc.signatures.initiate.useMutation();
  const verifyOTPMutation = trpc.signatures.verifyOTP.useMutation();
  const uploadSignatureMutation = trpc.signatures.uploadSignatureImage.useMutation();

  // 初始化簽名流程
  useEffect(() => {
    const initiate = async () => {
      try {
        setIsLoading(true);
        const result = await initiateSignature.mutateAsync({
          quoteId,
          customerId,
          ipAddress: await getClientIP(),
          userAgent: navigator.userAgent,
        });
        if (result.success) {
          toast.success('驗證碼已發送至您的郵箱');
        }
      } catch (error) {
        toast.error('初始化簽名流程失敗');
      } finally {
        setIsLoading(false);
      }
    };

    if (quoteId && customerId) {
      initiate();
    }
  }, [quoteId, customerId]);

  // 獲取客戶 IP
  const getClientIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  };

  // 驗證 OTP
  const handleVerifyOTP = async () => {
    if (!otpInput || otpInput.length !== 6) {
      toast.error('請輸入 6 位驗證碼');
      return;
    }

    try {
      setIsLoading(true);
      const result = await verifyOTPMutation.mutateAsync({
        quoteId,
        otp: otpInput,
      });
      if (result.success) {
        setSignatureId(result.signatureId);
        setStep('signature');
        toast.success('驗證成功，請簽名');
        // 初始化 Canvas
        initializeCanvas();
      }
    } catch (error) {
      toast.error('驗證碼錯誤或已過期');
    } finally {
      setIsLoading(false);
    }
  };

  // 初始化 Canvas
  const initializeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  // 繪製簽名
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  // 清除簽名
  const handleClearSignature = () => {
    initializeCanvas();
  };

  // 提交簽名
  const handleSubmitSignature = async () => {
    if (!signatureId) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      setIsLoading(true);
      const imageData = canvas.toDataURL('image/png').split(',')[1];
      const result = await uploadSignatureMutation.mutateAsync({
        signatureId,
        imageData,
      });
      if (result.success) {
        setStep('complete');
        toast.success('簽名已提交，報價單已確認');
      }
    } catch (error) {
      toast.error('簽名提交失敗');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* 標題 */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">報價單確認</h1>
          <p className="text-slate-600">請完成驗證與簽名以確認報價單</p>
        </div>

        {/* OTP 驗證步驟 */}
        {step === 'otp' && (
          <Card className="p-8 shadow-lg">
            <div className="space-y-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mx-auto">
                <AlertCircle className="w-6 h-6 text-blue-600" />
              </div>

              <div className="text-center">
                <h2 className="text-xl font-semibold text-slate-900 mb-2">驗證您的身份</h2>
                <p className="text-slate-600">我們已發送 6 位驗證碼至您的郵箱</p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">驗證碼</label>
                <Input
                  type="text"
                  placeholder="輸入 6 位驗證碼"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.slice(0, 6))}
                  maxLength={6}
                  className="text-center text-2xl tracking-widest font-mono"
                  disabled={isLoading}
                />
              </div>

              <Button
                onClick={handleVerifyOTP}
                disabled={isLoading || otpInput.length !== 6}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    驗證中...
                  </>
                ) : (
                  '驗證'
                )}
              </Button>

              <p className="text-center text-sm text-slate-500">
                未收到驗證碼？<button className="text-blue-600 hover:underline">重新發送</button>
              </p>
            </div>
          </Card>
        )}

        {/* 簽名步驟 */}
        {step === 'signature' && (
          <Card className="p-8 shadow-lg">
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-slate-900 mb-2">請在下方簽名</h2>
                <p className="text-slate-600">簽名代表您同意此報價單的所有條款</p>
              </div>

              <div className="border-2 border-slate-300 rounded-lg overflow-hidden bg-white">
                <canvas
                  ref={canvasRef}
                  width={500}
                  height={200}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  className="w-full cursor-crosshair"
                />
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={handleClearSignature}
                  className="flex-1"
                  disabled={isLoading}
                >
                  清除
                </Button>
                <Button
                  onClick={handleSubmitSignature}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      提交中...
                    </>
                  ) : (
                    '提交簽名'
                  )}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* 完成步驟 */}
        {step === 'complete' && (
          <Card className="p-8 shadow-lg">
            <div className="space-y-6 text-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">簽名完成</h2>
                <p className="text-slate-600">
                  感謝您的確認！我們已將簽名版報價單發送至您的郵箱。
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-slate-700">
                  <span className="font-semibold">下一步：</span> 請按照報價單上的付款方式進行匯款，我們將在收到款項後立即開始製作。
                </p>
              </div>

              <Button
                onClick={() => window.close()}
                className="w-full bg-slate-900 hover:bg-slate-800"
              >
                關閉
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
