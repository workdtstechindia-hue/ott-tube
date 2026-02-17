import axios from "axios";
import { tokenService } from "../services/tokenService";

const api = axios.create({
  baseURL: "https://ott-tube-backend.onrender.com/",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

api.interceptors.request.use(
  (config) => {
    const token = tokenService.getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.data instanceof FormData) {
      config.headers["Content-Type"] = "multipart/form-data";
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Something went wrong. Please try again.";

    if (status === 401 || status === 403) {
      tokenService.clearAll();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    window.dispatchEvent(
      new CustomEvent("api:error", {
        detail: { message, status },
      })
    );

    return Promise.reject({ ...error, friendlyMessage: message });
  }
);

export default api;
