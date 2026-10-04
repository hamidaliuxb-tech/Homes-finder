import axios from "axios";

export const getBackendUrl = () => {
  if (typeof window !== "undefined") {
    // If running in browser on production domain or non-localhost
    if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      return ""; // Use same-origin relative /api
    }
  }
  return process.env.REACT_APP_BACKEND_URL || "";
};

const BACKEND_URL = getBackendUrl();
export const API = BACKEND_URL ? `${BACKEND_URL.replace(/\/$/, '')}/api` : "/api";

export const api = axios.create({
  baseURL: API,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("hf_token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {}
  return config;
});

export const fileUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("data:") || url.startsWith("blob:")) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      if (url.includes("/api/files/")) {
        return url.substring(url.indexOf("/api/files/"));
      }
    }
    return url;
  }
  const cleanUrl = url.startsWith("/") ? url : `/${url}`;
  const base = getBackendUrl();
  return base ? `${base.replace(/\/$/, "")}${cleanUrl}` : cleanUrl;
};

export const formatAED = (price) => {
  if (price === null || price === undefined || price === "") return "Price on request";
  const n = Number(price);
  if (isNaN(n) || n === 0) return "Price on request";
  return `AED ${n.toLocaleString("en-US")}`;
};
