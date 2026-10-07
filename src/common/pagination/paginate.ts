export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}

/**
 * Build the standard paginated payload used across all list endpoints.
 */
export function buildPage<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): Paginated<T> {
  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

/**
 * Resolve a safe `orderBy` object from client input, guarding against
 * sorting by arbitrary/invalid columns.
 */
export function resolveOrderBy(
  sortBy: string | undefined,
  sortOrder: 'asc' | 'desc',
  allowed: string[],
  fallback: string,
): Record<string, 'asc' | 'desc'> {
  const field = sortBy && allowed.includes(sortBy) ? sortBy : fallback;
  return { [field]: sortOrder };
}

/**
 * Build an inclusive Prisma date-range filter, or undefined if no bounds.
 */
export function dateRangeFilter(
  dateFrom?: string,
  dateTo?: string,
): { gte?: Date; lte?: Date } | undefined {
  if (!dateFrom && !dateTo) return undefined;
  const range: { gte?: Date; lte?: Date } = {};
  if (dateFrom) range.gte = new Date(dateFrom);
  if (dateTo) range.lte = new Date(dateTo);
  return range;
}
