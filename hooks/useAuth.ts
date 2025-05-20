import { useContext } from "react";
import { AuthContext, AuthContextType } from "@/api/auth";

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("Failed to authenticate. Please try again.");
  }

  return context;
};
