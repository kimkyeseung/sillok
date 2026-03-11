/**
 * Sillok 공유 타입 패키지
 * DB 스키마 기반 타입은 supabase gen types로 자동 생성 후 여기서 re-export
 */

// 노드 타입
export type NodeType = 'ARTIFACT' | 'MEDIA' | 'EVENT';

// 인물 관계 타입
export type RelationType =
  | 'FAMILY'
  | 'TEACHER'
  | 'ALLY'
  | 'RIVAL'
  | 'LORD_VASSAL'
  | 'INFLUENCE';

// 양방향 관계 타입 (FAMILY, ALLY, RIVAL)
export const BIDIRECTIONAL_RELATIONS: RelationType[] = [
  'FAMILY',
  'ALLY',
  'RIVAL',
];

// 유저 역할
export type UserRole = 'USER' | 'ADMIN';

// 좋아요 대상 타입
export type LikeTargetType = 'thread' | 'reply' | 'node_comment';

// 팔로우 대상 타입
export type FollowTargetType = 'person' | 'node';

// 신고 대상 타입
export type ReportTargetType = 'thread' | 'reply' | 'node_comment' | 'person';

// API 응답 타입
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// Cursor 기반 페이지네이션 응답
export interface PaginatedResponse<T> {
  items: T[];
  has_next: boolean;
  next_cursor: string | null;
}
