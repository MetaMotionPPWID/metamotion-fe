import { useState, useEffect, ReactNode, createContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setAuthToken } from "./auth";

type Props = {
  children: ReactNode;
};

export type AuthContextType = {
  accessToken: string | null;
  setTokens: (accessToken: string) => void;
  clearTokens: () => void;
  isLoading: boolean;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export const AuthProvider = ({ children }: Props) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("access_token");
        if (storedToken) {
          setAccessToken(storedToken);
          setAuthToken(storedToken);
        }
      } catch (error) {
        console.error("Failed to load access token:", error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadToken();
  }, []);

  const setTokens = async (accessToken: string) => {
    try {
      await AsyncStorage.setItem("access_token", accessToken);
      setAccessToken(accessToken);
      setAuthToken(accessToken);
    } catch (error) {
      console.error("Failed to save access token:", error);
    }
  };

  const clearTokens = async () => {
    try {
      await AsyncStorage.removeItem("access_token");
      setAccessToken(null);
      setAuthToken(null);
    } catch (error) {
      console.error("Failed to clear access token:", error);
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
