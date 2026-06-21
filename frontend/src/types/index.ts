export type JobStatus = "PENDING" | "PRINTED" | "DELETED";
export type SessionStatus = "ACTIVE" | "EXPIRED";

export interface Session {
  id: string;
  status: SessionStatus;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  session_id: string;
  file_name: string;
  storage_key: string;
  file_size: number;
  page_count: number;
  status: JobStatus;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
