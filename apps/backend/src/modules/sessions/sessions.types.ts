export type SessionStatus = 'planned' | 'in_progress' | 'completed' | 'canceled';
export type SessionVisibility = 'private' | 'public';

export interface Session {
  id: string;
  owner_id: string;
  plan_id?: string | null;
  title: string;
  planned_at: string;
  status: SessionStatus;
  visibility: SessionVisibility;
  notes?: string | null;
  recurrence_rule?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  calories?: number | null;
  points?: number | null;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateSessionDTO {
  plan_id?: string | null;
  title: string;
  planned_at: string;
  visibility?: SessionVisibility;
  notes?: string | null;
  recurrence_rule?: string | null;
}

export interface UpdateSessionDTO {
  plan_id?: string | null;
  title?: string;
  planned_at?: string;
  status?: SessionStatus;
  visibility?: SessionVisibility;
  notes?: string | null;
  recurrence_rule?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  calories?: number | null;
  points?: number | null;
  deleted_at?: string | null;
}

export interface SessionQuery {
  status?: SessionStatus;
  plan_id?: string;
  planned_from?: string;
  planned_to?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

