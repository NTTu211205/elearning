/** Lưu access token ở module-level để axios interceptor đọc mà không cần import store */
let _token: string | null = null;

export const setToken = (token: string | null) => {
  _token = token;
};

export const getToken = () => _token;
