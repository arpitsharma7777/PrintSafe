import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../lib/apiClient";
import type { Job, ApiResponse } from "../../../types";

interface RawJob {
  id: string;
  session_id: string;
  original_filename: string;
  storage_key: string;
  mime_type: string;
  file_size_bytes: string | number;
  status: string;
  page_count?: number;
  created_at: string;
  updated_at?: string;
}

/**
 * Normalizes raw backend job data to match the frontend Job schema.
 */
const normalizeJob = (rawJob: RawJob): Job => {
  return {
    id: rawJob.id,
    session_id: rawJob.session_id,
    file_name: rawJob.original_filename,
    storage_key: rawJob.storage_key,
    file_size: Number(rawJob.file_size_bytes),
    page_count: typeof rawJob.page_count === "number" ? rawJob.page_count : 1,
    status: rawJob.status as Job["status"], // Cast status to match expected frontend JobStatus type
    created_at: rawJob.created_at,
    updated_at: rawJob.updated_at || rawJob.created_at,
  };
};

/**
 * Query hook to fetch active print jobs.
 */
export const useJobs = () => {
  return useQuery<Job[]>({
    queryKey: ["jobs"],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<{ jobs: RawJob[] }>>("/jobs");
      return response.data.data.jobs.map(normalizeJob);
    },
  });
};

/**
 * Mutation hook to mark a job as printed (completed).
 */
export const usePrintJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (jobId: string) => {
      const response = await apiClient.patch<ApiResponse<{ job: RawJob }>>(`/jobs/${jobId}/print`);
      return normalizeJob(response.data.data.job);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
};

/**
 * Mutation hook to delete/erase a job and its file.
 */
export const useDeleteJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (jobId: string) => {
      const response = await apiClient.patch<ApiResponse<{ job: RawJob }>>(`/jobs/${jobId}/delete`);
      return normalizeJob(response.data.data.job);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
};
