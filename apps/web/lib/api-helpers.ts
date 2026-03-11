import { NextResponse } from 'next/server';

/**
 * API 성공 응답 헬퍼
 * 형식: { success: true, data: T }
 */
export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * API 에러 응답 헬퍼
 * 형식: { success: false, error: { code, message, details? } }
 *
 * 에러 코드:
 * PERSON_NOT_FOUND, NODE_NOT_FOUND, THREAD_NOT_FOUND
 * UNAUTHORIZED, FORBIDDEN, ADMIN_REQUIRED
 * RATE_LIMIT_EXCEEDED, VALIDATION_ERROR
 * DUPLICATE_RELATION, ALREADY_REPORTED
 * FILE_TOO_LARGE, UNSUPPORTED_FILE_TYPE
 * BULK_UPLOAD_FAILED, SERVER_ERROR
 */
export function apiError(
  code: string,
  message: string,
  status: number,
  details?: unknown
) {
  return NextResponse.json(
    {
      success: false,
      error: { code, message, ...(details !== undefined && { details }) },
    },
    { status }
  );
}
