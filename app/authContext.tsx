import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setAuthToken } from "@/api_service/api_service";


interface AuthContextType {
  accessToken: string | null;
  setTokens: (accessToken: string) => void;
  clearTokens: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load the token from AsyncStorage when the app starts
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

    loadToken();
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

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

