import axios from "axios";
import { getToken, setToken } from "./tokenManager";

const api = axios.create({
  baseURL: import.meta.env.MODE === "development" ? "http://localhost:5000" : "/api",
  withCredentials: true,
});

const REFRESH_ENDPOINT = "/auth/refresh-token";
const SESSION_EXPIRED_EVENT = "auth:session-expired";

let isRefreshing = false;
let pendingRequests: Array<(token: string | null) => void> = [];

const notifyPendingRequests = (token: string | null) => {
  pendingRequests.forEach((callback) => callback(token));
  pendingRequests = [];
};

const handleSessionExpired = () => {
  setToken(null);
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));

  if (window.location.pathname !== "/signin") {
    window.location.replace("/signin");
  }
};

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const code = error?.response?.data?.code;
    const originalRequest = error?.config as typeof error.config & { _retry?: boolean };

    if (status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    const hasBearerToken = Boolean(originalRequest.headers?.Authorization);
    if (!hasBearerToken) {
      return Promise.reject(error);
    }

    const isAccessTokenExpired = code === "TOKEN_EXPIRED";
    if (!isAccessTokenExpired && !originalRequest.url?.includes(REFRESH_ENDPOINT)) {
      return Promise.reject(error);
    }

    if (originalRequest.url?.includes(REFRESH_ENDPOINT)) {
      handleSessionExpired();
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      handleSessionExpired();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingRequests.push((newToken) => {
          if (!newToken) {
            reject(error);
            return;
          }

          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          resolve(api(originalRequest));
        });
      });
    }

    const failedAuthHeader = originalRequest.headers?.Authorization;
    const latestToken = getToken();
    if (latestToken && failedAuthHeader && failedAuthHeader !== `Bearer ${latestToken}`) {
      originalRequest.headers.Authorization = `Bearer ${latestToken}`;
      return api(originalRequest);
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshResponse = await axios.post<{
        message: string;
        data: { newToken: string };
      }>(
        REFRESH_ENDPOINT,
        {},
        {
          baseURL: api.defaults.baseURL,
          withCredentials: true,
        },
      );

      const { newToken } = refreshResponse.data.data;

      setToken(newToken);
      notifyPendingRequests(newToken);

      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      notifyPendingRequests(null);
      handleSessionExpired();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;