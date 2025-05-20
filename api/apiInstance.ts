import axios from "axios";

export const baseApiUrl = "http://192.168.8.147:8000";

export const api = axios.create({
  baseURL: baseApiUrl,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10_000,
});
