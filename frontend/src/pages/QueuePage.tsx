import React from "react";
import { useJobs, usePrintJob, useDeleteJob } from "../features/queue/api/jobs";
import { useQueueSocket } from "../features/queue/hooks/useQueueSocket";
import { QueueStats } from "../features/queue/components/QueueStats";
import { JobTable } from "../features/queue/components/JobTable";
import { PdfPreviewDialog } from "../features/queue/components/PdfPreviewDialog";
import { useSocket } from "../sockets/SocketProvider";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const QueuePage: React.FC = () => {
  // 1. Mount socket subscription invalidator hook
  useQueueSocket();

  // 2. Fetch jobs query
  const { data: jobs = [], isLoading, isError, error, refetch } = useJobs();

  // 3. Mount actions mutations
  const printMutation = usePrintJob();
  const deleteMutation = useDeleteJob();

  // 4. Retrieve connection status
  const { status } = useSocket();

  const handlePrint = (jobId: string) => {
    printMutation.mutate(jobId);
  };

  const handleDelete = (jobId: string) => {
    deleteMutation.mutate(jobId);
  };

  const isActionLoading = printMutation.isPending || deleteMutation.isPending;

  const statusMap = {
    connected: {
      text: "Connected",
      color: "bg-emerald-50 text-emerald-950 border-emerald-600 dark:text-emerald-400 dark:border-emerald-900/30 dark:bg-emerald-950/20",
      dot: "bg-emerald-500",
    },
    reconnecting: {
      text: "Reconnecting...",
      color: "bg-amber-50 text-amber-950 border-amber-600 animate-pulse dark:text-amber-400 dark:border-amber-900/30 dark:bg-amber-950/20",
      dot: "bg-amber-500 animate-ping",
    },
    disconnected: {
      text: "Offline",
      color: "bg-rose-50 text-rose-950 border-rose-600 dark:text-rose-400 dark:border-rose-900/30 dark:bg-rose-950/20",
      dot: "bg-rose-500",
    },
  };

  const connection = statusMap[status] || statusMap.disconnected;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Header bar */}
      <header className="border-b bg-white dark:bg-slate-900 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold tracking-tight">PrintSafe Queue</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Operator Control Dashboard</p>
        </div>
        
        {/* ConnectionIndicator */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${connection.color}`}>
            <span className={`h-2 w-2 rounded-full ${connection.dot}`} />
            {connection.text}
          </div>
          {status === "disconnected" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.location.reload()}
              className="h-7 text-xs px-2 border-slate-200 dark:border-slate-800"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}
        </div>
      </header>

      {/* Main content grid */}
      <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
        {isLoading ? (
          <div className="space-y-6 animate-pulse">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-white dark:bg-slate-900 border rounded-xl" />
              ))}
            </div>
            <div className="h-64 bg-white dark:bg-slate-900 border rounded-xl w-full" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center border border-dashed rounded-xl bg-white dark:bg-slate-900/50 p-12 text-center max-w-md mx-auto select-none mt-12">
            <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
            <h3 className="text-base font-bold">Failed to load print queue</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6">
              {error instanceof Error ? error.message : "Ensure database connections are healthy and active."}
            </p>
            <Button onClick={() => refetch()} className="font-semibold">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry Sync
            </Button>
          </div>
        ) : (
          <>
            {/* Queue Stats Banner */}
            <QueueStats jobs={jobs} />

            {/* Print Queue Table */}
            <JobTable
              jobs={jobs}
              onPrint={handlePrint}
              onDelete={handleDelete}
              isActionLoading={isActionLoading}
            />

            {/* Centered Modal Overlay for PDF Mock previews */}
            <PdfPreviewDialog
              jobs={jobs}
              onPrint={handlePrint}
              onDelete={handleDelete}
              isActionLoading={isActionLoading}
            />
          </>
        )}
      </main>
    </div>
  );
};
