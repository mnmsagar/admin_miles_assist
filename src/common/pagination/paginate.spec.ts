import { buildPage, resolveOrderBy, dateRangeFilter } from './paginate';

describe('Pagination utils', () => {
  describe('buildPage', () => {
    it('should build valid paginated structure', () => {
      const items = [{ id: '1' }, { id: '2' }];
      const result = buildPage(items, 10, 1, 2);

      expect(result).toEqual({
        data: items,
        meta: {
          page: 1,
          limit: 2,
          total: 10,
          totalPages: 5,
        },
      });
    });

    it('should handle total 0 gracefully with totalPages: 1', () => {
      const result = buildPage([], 0, 1, 20);
      expect(result.meta.totalPages).toBe(1);
      expect(result.meta.total).toBe(0);
      expect(result.data).toEqual([]);
    });
  });

  describe('resolveOrderBy', () => {
    const allowed = ['name', 'createdAt'];

    it('should return allowed field when valid', () => {
      const result = resolveOrderBy('name', 'desc', allowed, 'createdAt');
      expect(result).toEqual({ name: 'desc' });
    });

    it('should return fallback field when sortBy is not allowed', () => {
      const result = resolveOrderBy('unknownCol', 'asc', allowed, 'createdAt');
      expect(result).toEqual({ createdAt: 'asc' });
    });

    it('should return fallback field when sortBy is undefined', () => {
      const result = resolveOrderBy(undefined, 'desc', allowed, 'createdAt');
      expect(result).toEqual({ createdAt: 'desc' });
    });
  });

  describe('dateRangeFilter', () => {
    it('should return undefined if no dates provided', () => {
      expect(dateRangeFilter(undefined, undefined)).toBeUndefined();
    });

    it('should return gte and lte when both dates provided', () => {
      const res = dateRangeFilter('2026-01-01', '2026-01-31');
      expect(res?.gte).toBeInstanceOf(Date);
      expect(res?.lte).toBeInstanceOf(Date);
    });
  });
});
