export interface Pagination {
  limit: number;
  offset: number;
}

export function createPagination(page = 1, pageSize = 25): Pagination {
  const limit = Math.max(1, pageSize);
  const offset = Math.max(0, (page - 1) * limit);
  return { limit, offset };
}
