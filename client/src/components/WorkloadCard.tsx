import { AlertCircle, Calendar, Briefcase } from "lucide-react";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

export default function WorkloadCard() {
  const { data: workload, isLoading } = trpc.workload.calculate.useQuery();

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-24 rounded bg-muted"></div>
          <div className="h-8 w-16 rounded bg-muted"></div>
        </div>
      </Card>
    );
  }

  if (!workload) return null;

  const { totalDays, projects } = workload;
  const isOverloaded = totalDays > 60;
  const isWarning = totalDays > 40;

  return (
    <Card className={`p-6 ${isOverloaded ? "border-destructive/50 bg-destructive/5" : isWarning ? "border-yellow-500/50 bg-yellow-500/5" : ""}`}>
      <div className="space-y-4">
        {/* 標題與警告 */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">案件檔期管理</h3>
            <p className="text-sm text-muted-foreground">目前累積工作量統計</p>
          </div>
          {isOverloaded && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-1">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-xs font-medium text-destructive">工作量已滿</span>
            </div>
          )}
          {isWarning && !isOverloaded && (
            <div className="flex items-center gap-2 rounded-lg bg-yellow-500/10 px-3 py-1">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-xs font-medium text-yellow-600">接近滿載</span>
            </div>
          )}
        </div>

        {/* 工作天數統計 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-xs text-muted-foreground">累積工作天數</p>
            <p className={`text-3xl font-bold ${isOverloaded ? "text-destructive" : isWarning ? "text-yellow-600" : "text-primary"}`}>
              {totalDays}
            </p>
            <p className="text-xs text-muted-foreground">天</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-xs text-muted-foreground">進行中的案件</p>
            <p className="text-3xl font-bold text-secondary">{projects.length}</p>
            <p className="text-xs text-muted-foreground">件</p>
          </div>
        </div>

        {/* 案件清單 */}
        {projects.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">進行中的案件：</p>
            <div className="max-h-48 space-y-2 overflow-y-auto">
              {projects.map((project) => (
                <div key={project.id} className="rounded-lg border border-border bg-card/50 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{project.customerName}</p>
                      <p className="text-xs text-muted-foreground">{project.quoteNumber}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {project.services.map((service) => (
                          <span key={service} className="inline-block rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 whitespace-nowrap rounded-lg bg-secondary/10 px-2 py-1">
                      <Calendar className="h-3 w-3 text-secondary" />
                      <span className="text-xs font-medium text-secondary">{project.estimatedDays}天</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 提醒訊息 */}
        {isOverloaded && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
            <p className="text-xs font-medium text-destructive">
              ⚠️ 工作量已超過 60 天，建議暫停接新案件或調整交件日期
            </p>
          </div>
        )}
        {isWarning && !isOverloaded && (
          <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
            <p className="text-xs font-medium text-yellow-700">
              ⚠️ 工作量已超過 40 天，請評估是否還能接新案件
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
