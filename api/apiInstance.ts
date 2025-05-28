import axios from "axios";

export const baseApiUrl = "https://big-szyc.fly.dev";

export const api = axios.create({
  baseURL: baseApiUrl,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30_000,
});
