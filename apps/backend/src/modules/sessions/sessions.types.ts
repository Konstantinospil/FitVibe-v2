export type SessionStatus = 'planned' | 'in_progress' | 'completed' | 'canceled';

export interface Session {
  id: string;
  user_id: string;
  plan_id?: string | null;
  name: string;
  date: string;
  status: SessionStatus;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateSessionDTO {
  plan_id?: string | null;
  name: string;
  date: string;
  notes?: string | null;
}

export interface UpdateSessionDTO {
  plan_id?: string | null;
  name?: string;
  date?: string;
  status?: SessionStatus;
  notes?: string | null;
}

export interface SessionQuery {
  status?: SessionStatus;
  plan_id?: string;
  date_from?: string;
  date_to?: string;
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
