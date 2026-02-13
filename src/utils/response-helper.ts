import type { Response } from "express";

/**
 * Standard API Response Helper
 *
 * Ensures all API responses follow a consistent shape:
 *   Success: { success: true, message: "...", data: { ... } }
 *   Error:   { success: false, message: "...", details?: { ... } }
 */

// ============================================================================
// Success Responses
// ============================================================================

/**
 * Send a successful response
 * @param res     Express Response
 * @param status  HTTP status code (200, 201, etc.)
 * @param message Human-readable success message
 * @param data    Response payload
 */
export function sendSuccess<T>(
  res: Response,
  status: number,
  message: string,
  data?: T
): void {
  res.status(status).json({
    success: true,
    message,
    data: data ?? null,
  });
}

// ============================================================================
// Error Responses
// ============================================================================

/**
 * Send an error response
 * @param res     Express Response
 * @param status  HTTP status code (400, 401, 404, 500, etc.)
 * @param message Human-readable error message
 * @param details Optional extra error context (validation errors, missing IDs, etc.)
 */
export function sendError(
  res: Response,
  status: number,
  message: string,
  details?: Record<string, unknown>
): void {
  const body: Record<string, unknown> = {
    success: false,
    message,
  };

  if (details) {
    body.details = details;
  }

  res.status(status).json(body);
}
