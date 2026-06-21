import React from "react";
import { useUiStore } from "../../../store/uiStore";
import type { Job } from "../../../types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { FileText, Calendar, HardDrive, Printer, Trash2 } from "lucide-react";

interface PdfPreviewDialogProps {
  jobs: Job[];
  onPrint: (jobId: string) => void;
  onDelete: (jobId: string) => void;
  isActionLoading: boolean;
}

export const PdfPreviewDialog: React.FC<PdfPreviewDialogProps> = ({
  jobs,
  onPrint,
  onDelete,
  isActionLoading,
}) => {
  const activePreviewJobId = useUiStore((state) => state.activePreviewJobId);
  const setActivePreviewJobId = useUiStore((state) => state.setActivePreviewJobId);

  const job = jobs.find((j) => j.id === activePreviewJobId);

  if (!job) return null;

  const fileSizeKb = (job.file_size / 1024).toFixed(1);
  const fileDate = new Date(job.created_at).toLocaleString();

  const handlePrintClick = () => {
    onPrint(job.id);
    setActivePreviewJobId(null);
  };

  const handleDeleteClick = () => {
    onDelete(job.id);
    setActivePreviewJobId(null);
  };

  return (
    <Dialog open={!!activePreviewJobId} onOpenChange={(open: boolean) => !open && setActivePreviewJobId(null)}>
      <DialogContent className="max-w-2xl sm:rounded-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <FileText className="h-5 w-5 text-blue-600" />
            Document Preview
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2 py-4">
          {/* Mock Document Canvas Visual */}
          <div className="flex flex-col items-center justify-center border border-dashed rounded-xl bg-slate-50 dark:bg-slate-900/50 p-6 min-h-[300px] select-none">
            <div className="relative w-[180px] h-[240px] bg-white dark:bg-slate-950 border shadow-md rounded-md p-4 flex flex-col justify-between overflow-hidden">
              {/* Mock Header lines */}
              <div className="space-y-1">
                <div className="h-2 w-1/3 bg-slate-200 dark:bg-slate-800 rounded"></div>
                <div className="h-2 w-2/3 bg-slate-100 dark:bg-slate-900 rounded"></div>
              </div>
              
              {/* Mock Document content graphic */}
              <div className="flex-1 flex flex-col justify-center space-y-2 py-4">
                <div className="h-1 w-full bg-slate-100 dark:bg-slate-900 rounded"></div>
                <div className="h-1 w-full bg-slate-100 dark:bg-slate-900 rounded"></div>
                <div className="h-1 w-4/5 bg-slate-100 dark:bg-slate-900 rounded"></div>
                <div className="h-1 w-full bg-slate-100 dark:bg-slate-900 rounded"></div>
                <div className="h-1 w-2/3 bg-slate-100 dark:bg-slate-900 rounded"></div>
              </div>

              {/* Mock Footer with page tag */}
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
                <span className="truncate max-w-[100px]">{job.file_name}</span>
                <span>Page 1 of {job.page_count}</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-4">Safe Sandbox PDF Metadata Preview</p>
          </div>

          {/* Metadata details */}
          <div className="flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">File Name</h3>
                <p className="text-base font-bold break-all">{job.file_name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">File Size</h4>
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    <HardDrive className="h-3.5 w-3.5 text-slate-400" />
                    {fileSizeKb} KB
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Total Pages</h4>
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-slate-400" />
                    {job.page_count} sheets
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Submitted At</h3>
                <p className="text-sm font-medium flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  {fileDate}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Status</h3>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                  job.status === "PENDING"
                    ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30"
                    : job.status === "PRINTED"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30"
                    : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30"
                }`}>
                  {job.status}
                </span>
              </div>
            </div>

            {/* Quick Actions inside preview */}
            <div className="flex gap-2">
              {job.status === "PENDING" && (
                <>
                  <Button
                    onClick={handlePrintClick}
                    disabled={isActionLoading}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDeleteClick}
                    disabled={isActionLoading}
                    className="border-rose-200 dark:border-rose-900/30 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="ghost" onClick={() => setActivePreviewJobId(null)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
