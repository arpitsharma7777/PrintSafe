import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../lib/apiClient";
import type { Job, ApiResponse } from "../../../types";

/**
 * Query hook to fetch active print jobs.
 */
export const useJobs = () => {
  return useQuery<Job[]>({
    queryKey: ["jobs"],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<{ jobs: Job[] }>>("/jobs");
      return response.data.data.jobs;
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
      const response = await apiClient.patch<ApiResponse<{ job: Job }>>(`/jobs/${jobId}/print`);
      return response.data.data.job;
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
      const response = await apiClient.patch<ApiResponse<{ job: Job }>>(`/jobs/${jobId}/delete`);
      return response.data.data.job;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
};
