import React from "react";
import type { Job } from "../../../types";
import { useUiStore } from "../../../store/uiStore";
import { TableRow, TableCell } from "../../../components/ui/table";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Printer, Trash2, Eye, FileText } from "lucide-react";

interface JobRowProps {
  job: Job;
  onPrint: (jobId: string) => void;
  onDelete: (jobId: string) => void;
  isActionLoading: boolean;
}

export const JobRow: React.FC<JobRowProps> = ({
  job,
  onPrint,
  onDelete,
  isActionLoading,
}) => {
  const setActivePreviewJobId = useUiStore((state) => state.setActivePreviewJobId);

  const fileSizeKb = (job.file_size / 1024).toFixed(1);
  const timeFormatted = new Date(job.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30">PENDING</Badge>;
      case "PRINTED":
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30">PRINTED</Badge>;
      case "DELETED":
        return <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30">DELETED</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <TableRow className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
      <TableCell className="font-medium max-w-[200px] truncate">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-slate-400 shrink-0" />
          <span className="truncate" title={job.file_name}>
            {job.file_name}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-slate-500 dark:text-slate-400">
        {fileSizeKb} KB
      </TableCell>
      <TableCell className="text-center font-semibold">
        {job.page_count}
      </TableCell>
      <TableCell className="text-slate-500 dark:text-slate-400">
        {timeFormatted}
      </TableCell>
      <TableCell>{getStatusBadge(job.status)}</TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          {/* PdfPreviewButton */}
          <Button
            size="icon"
            variant="ghost"
            title="Preview Document"
            onClick={() => setActivePreviewJobId(job.id)}
            className="h-8 w-8 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            <Eye className="h-4 w-4" />
          </Button>

          {job.status === "PENDING" && (
            <>
              {/* PrintButton */}
              <Button
                size="icon"
                variant="ghost"
                title="Print Document"
                disabled={isActionLoading}
                onClick={() => onPrint(job.id)}
                className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:text-emerald-300 dark:hover:bg-emerald-950/20"
              >
                <Printer className="h-4 w-4" />
              </Button>

              {/* DeleteButton */}
              <Button
                size="icon"
                variant="ghost"
                title="Delete Document"
                disabled={isActionLoading}
                onClick={() => onDelete(job.id)}
                className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-rose-950/20"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};
