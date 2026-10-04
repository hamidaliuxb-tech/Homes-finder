import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
export const API = BACKEND_URL ? `${BACKEND_URL.replace(/\/$/, '')}/api` : "/api";

export const api = axios.create({
  baseURL: API,
  withCredentials: true,
  timeout: 10000,
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
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const cleanUrl = url.startsWith("/") ? url : `/${url}`;
  return BACKEND_URL ? `${BACKEND_URL.replace(/\/$/, '')}${cleanUrl}` : cleanUrl;
};

export const formatAED = (price) => {
  if (price === null || price === undefined || price === "") return "Price on request";
  const n = Number(price);
  if (isNaN(n) || n === 0) return "Price on request";
  return `AED ${n.toLocaleString("en-US")}`;
};
