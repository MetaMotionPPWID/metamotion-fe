import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@/hooks";
import { AuthProvider } from "@/api/auth";

type Props = {
  children: ReactNode;
};

export const AuthWrapper = ({ children }: Props) => {
  const { accessToken, isLoading } = useAuth();
  const router = useRouter();

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !isLoading && !accessToken) {
      router.replace("login");
    }
  }, [isMounted, isLoading, accessToken, router]);

  if (!isMounted || isLoading) {
    return null;
  }

  return <AuthProvider>{children}</AuthProvider>;
};
