import React from "react";
import type { Job } from "../../../types";
import { JobRow } from "./JobRow";
import { Table, TableBody, TableHeader, TableHead, TableRow } from "../../../components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/card";
import { FileQuestion } from "lucide-react";

interface JobTableProps {
  jobs: Job[];
  onPrint: (jobId: string) => void;
  onDelete: (jobId: string) => void;
  isActionLoading: boolean;
}

export const JobTable: React.FC<JobTableProps> = ({
  jobs,
  onPrint,
  onDelete,
  isActionLoading,
}) => {
  // Sort jobs: PENDING first, then others, ordered by newest submission first
  const sortedJobs = [...jobs].sort((a, b) => {
    if (a.status === "PENDING" && b.status !== "PENDING") return -1;
    if (a.status !== "PENDING" && b.status === "PENDING") return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <Card className="border shadow-sm w-full">
      <CardHeader className="px-6 py-4 border-b">
        <CardTitle className="text-base font-semibold">Active Print Queue</CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        {sortedJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400 select-none">
            <FileQuestion className="h-10 w-10 text-slate-300 mb-3" />
            <p className="text-sm font-semibold">No jobs in queue</p>
            <p className="text-xs text-slate-400 max-w-[220px] mt-1">
              Documents submitted by customers will appear here in real-time.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-slate-900/10">
              <TableRow>
                <TableHead className="w-[260px] font-semibold">File Name</TableHead>
                <TableHead className="font-semibold">Size</TableHead>
                <TableHead className="text-center font-semibold">Pages</TableHead>
                <TableHead className="font-semibold">Submitted</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedJobs.map((job) => (
                <JobRow
                  key={job.id}
                  job={job}
                  onPrint={onPrint}
                  onDelete={onDelete}
                  isActionLoading={isActionLoading}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
