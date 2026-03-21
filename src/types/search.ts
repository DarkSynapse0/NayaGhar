export type ApiResponse<T> = {
  data: T;
  pagination?: {
    cursor: string | null;
    hasMore: boolean;
  };
  error: null | {
    code: string;
    message: string;
  };
};
