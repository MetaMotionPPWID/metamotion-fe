import { useRouter } from "expo-router";
import { ReactNode, useEffect } from "react";

import { AuthProvider } from "@/api/auth";
import { useAuth } from "@/hooks";

type Props = {
  children: ReactNode;
};

const AuthGate = ({ children }: Props) => {
  const router = useRouter();
  const { accessToken, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !accessToken) {
      router.replace("/login");
    }
  }, [accessToken, isLoading, router]);

  if (isLoading) {
    return null;
  }

  return <>{children}</>;
};

export const AuthWrapper = ({ children }: Props) => {
  return (
    <AuthProvider>
      <AuthGate>{children}</AuthGate>
    </AuthProvider>
  );
};
