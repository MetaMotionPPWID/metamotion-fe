import { api } from "@/api/apiInstance";

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
};

export const postLogin = async (username: string, password: string) => {
  const response = await api.post("/auth/login", {
    login: username,
    password: password,
  });

  if (response.status === 200) {
    const { access_token } = response.data;
    return access_token;
  }
};

export const postRegister = async (username: string, password: string) => {
  await api.post("/auth/register", {
    login: username,
    password: password,
  });
};
