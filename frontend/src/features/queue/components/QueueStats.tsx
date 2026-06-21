import React from "react";
import type { Job } from "../../../types";
import { Card, CardContent } from "../../../components/ui/card";
import { Printer, FileText, CheckCircle, Users } from "lucide-react";

interface QueueStatsProps {
  jobs: Job[];
}

export const QueueStats: React.FC<QueueStatsProps> = ({ jobs }) => {
  const pendingJobs = jobs.filter((job) => job.status === "PENDING");
  const completedJobs = jobs.filter((job) => job.status === "PRINTED");

  const readyToPrint = pendingJobs.length;
  const completed = completedJobs.length;

  const estimatedSheets = pendingJobs.reduce((acc, job) => acc + (job.page_count || 0), 0);

  const activeSessions = new Set(
    jobs.filter((job) => job.status === "PENDING" || job.status === "PRINTED")
        .map((job) => job.session_id)
  ).size;

  const stats = [
    {
      title: "Ready to Print",
      value: readyToPrint,
      icon: Printer,
      color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30",
    },
    {
      title: "Estimated Sheets",
      value: estimatedSheets,
      icon: FileText,
      color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30",
    },
    {
      title: "Completed Prints",
      value: completed,
      icon: CheckCircle,
      color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30",
    },
    {
      title: "Active Sessions",
      value: activeSessions,
      icon: Users,
      color: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="border shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {stat.title}
                </p>
                <p className="text-3xl font-bold tracking-tight">
                  {stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <Icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
