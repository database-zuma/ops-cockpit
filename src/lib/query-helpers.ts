/**
 * Query filter options for building WHERE clauses
 */
export interface QueryFilters {
  branch?: string;
  area?: string;
  store?: string;
  startDate?: string;
  endDate?: string;
  storeCategory?: string;
}

/**
 * Result of building a WHERE clause
 */
export interface WhereClauseResult {
  where: string;
  params: unknown[];
  paramIndex: number;
}

/**
 * Build a parameterized WHERE clause from filters
 * Supports: branch, area, store, startDate, endDate, storeCategory
 *
 * @param filters - Filter object with optional fields
 * @param tableAlias - Optional table alias (e.g., 's' for 's.branch')
 * @returns Object with where clause, params array, and next param index
 *
 * @example
 * const { where, params } = buildWhereClause(
 *   { branch: 'Bali', startDate: '2026-01-01' },
 *   's'
 * );
 * // where: "s.branch = $1 AND s.report_date >= $2"
 * // params: ['Bali', '2026-01-01']
 */
export function buildWhereClause(
  filters: QueryFilters,
  tableAlias?: string
): WhereClauseResult {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  const prefix = tableAlias ? `${tableAlias}.` : '';

  // Branch filter
  if (filters.branch) {
    conditions.push(`${prefix}branch = $${paramIndex}`);
    params.push(filters.branch);
    paramIndex++;
  }

  // Area filter
  if (filters.area) {
    conditions.push(`${prefix}area = $${paramIndex}`);
    params.push(filters.area);
    paramIndex++;
  }

  // Store filter
  if (filters.store) {
    conditions.push(`${prefix}store_name = $${paramIndex}`);
    params.push(filters.store);
    paramIndex++;
  }

  // Start date filter
  if (filters.startDate) {
    conditions.push(`${prefix}report_date >= $${paramIndex}`);
    params.push(filters.startDate);
    paramIndex++;
  }

  // End date filter
  if (filters.endDate) {
    conditions.push(`${prefix}report_date <= $${paramIndex}`);
    params.push(filters.endDate);
    paramIndex++;
  }

  // Store category filter
  if (filters.storeCategory) {
    conditions.push(`${prefix}store_category = $${paramIndex}`);
    params.push(filters.storeCategory);
    paramIndex++;
  }

  const where = conditions.length > 0 ? conditions.join(' AND ') : '';

  return {
    where,
    params,
    paramIndex,
  };
}

/**
 * Build a complete WHERE clause string with WHERE keyword if conditions exist
 *
 * @param filters - Filter object
 * @param tableAlias - Optional table alias
 * @returns Object with complete where clause (with WHERE keyword), params, and next param index
 *
 * @example
 * const { where, params } = buildWhereClauseWithKeyword({ branch: 'Bali' });
 * // where: "WHERE branch = $1"
 * // params: ['Bali']
 */
export function buildWhereClauseWithKeyword(
  filters: QueryFilters,
  tableAlias?: string
): WhereClauseResult {
  const result = buildWhereClause(filters, tableAlias);
  const where = result.where ? `WHERE ${result.where}` : '';

  return {
    where,
    params: result.params,
    paramIndex: result.paramIndex,
  };
}

/**
 * Build an ORDER BY clause for common sorting patterns
 *
 * @param sortBy - Field to sort by (e.g., 'report_date', 'store_name')
 * @param direction - Sort direction ('ASC' or 'DESC')
 * @param tableAlias - Optional table alias
 * @returns ORDER BY clause string
 *
 * @example
 * const orderBy = buildOrderBy('report_date', 'DESC', 's');
 * // "ORDER BY s.report_date DESC"
 */
export function buildOrderBy(
  sortBy: string,
  direction: 'ASC' | 'DESC' = 'ASC',
  tableAlias?: string
): string {
  const prefix = tableAlias ? `${tableAlias}.` : '';
  return `ORDER BY ${prefix}${sortBy} ${direction}`;
}

/**
 * Build a LIMIT clause
 *
 * @param limit - Number of rows to limit
 * @param offset - Optional offset
 * @returns LIMIT clause string
 *
 * @example
 * buildLimit(10, 20); // "LIMIT 10 OFFSET 20"
 */
export function buildLimit(limit: number, offset?: number): string {
  if (offset !== undefined && offset > 0) {
    return `LIMIT ${limit} OFFSET ${offset}`;
  }
  return `LIMIT ${limit}`;
}
