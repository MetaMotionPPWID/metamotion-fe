import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import { ReactNode, createContext, useEffect, useState } from "react";
import { AppState } from "react-native";

import { setAuthToken } from "./auth";

type Props = { children: ReactNode };

export type AuthContextType = {
  accessToken: string | null;
  setTokens: (accessToken: string) => void;
  clearTokens: () => void;
  isLoading: boolean;
};

export const AuthContext = createContext<AuthContextType>({
  accessToken: null,
  setTokens: () => {},
  clearTokens: () => {},
  isLoading: true,
});

const MAX_TOKEN_AGE = 30 * 60 * 1000; // 30 min fallback

const isExpired = (token: string, storedAt: number): boolean => {
  const { exp } = jwtDecode<{ exp?: number }>(token); // exp is seconds

  if (exp) {
    return Date.now() >= exp * 1000;
  }

  return Date.now() - storedAt >= MAX_TOKEN_AGE;
};
/* -------------------------------- */

export const AuthProvider = ({ children }: Props) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearTokens = async () => {
    try {
      await AsyncStorage.multiRemove(["access_token", "token_stored_at"]);
      setAccessToken(null);
      setAuthToken(null);
    } catch (e) {
      console.error("Failed to clear access token:", e);
    }
  };

  const loadToken = async () => {
    try {
      const [tok, ts] = await AsyncStorage.multiGet([
        "access_token",
        "token_stored_at",
      ]);
      const token = tok[1];
      const storedAt = Number(ts[1] ?? 0);

      if (token && !isExpired(token, storedAt)) {
        setAccessToken(token);
        setAuthToken(token);
      } else {
        await clearTokens();
      }
    } catch (e) {
      console.error("Failed to load access token:", e);
      await clearTokens();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadToken();

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void loadToken();
      }
    });

    return () => sub.remove();
  }, []);

  const setTokens = async (token: string) => {
    try {
      await AsyncStorage.multiSet([
        ["access_token", token],
        ["token_stored_at", Date.now().toString()],
      ]);
      setAccessToken(token);
      setAuthToken(token);
    } catch (e) {
      console.error("Failed to save access token:", e);
    }
  };

  return (
    <AuthContext.Provider
      value={{ accessToken, setTokens, clearTokens, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};
