/** Shared API response shapes for route handlers. */

export type ApiErrorBody = {
  error: string;
  code?: string;
};

export type ApiSuccessBody<T> = {
  data: T;
};
