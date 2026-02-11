import type { Request } from "express";

/**
 * Pagination Utility
 *
 * Reusable helpers for paginating Mongoose queries.
 */

// ============================================================================
// Types
// ============================================================================

export interface PaginationParams {
  page: number;
  pageSize: number;
  skip: number;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// ============================================================================
// Helpers
// ============================================================================

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

/**
 * Parse pagination query params from the request.
 * Accepts `?page=1&pageSize=20` — clamps values to safe ranges.
 */
export function parsePaginationParams(req: Request): PaginationParams {
  const rawPage = Number(req.query.page);
  const rawPageSize = Number(req.query.pageSize);

  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : DEFAULT_PAGE;
  const pageSize =
    Number.isFinite(rawPageSize) && rawPageSize >= 1
      ? Math.min(Math.floor(rawPageSize), MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE;

  const skip = (page - 1) * pageSize;

  return { page, pageSize, skip };
}

/**
 * Build the pagination metadata object for a response.
 */
export function buildPaginationMeta(
  totalItems: number,
  page: number,
  pageSize: number
): PaginationMeta {
  const totalPages = Math.ceil(totalItems / pageSize);

  return {
    page,
    pageSize,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}
