import React from "react";
import { useRouter } from "expo-router";
import { AuthProvider, useAuth } from "./authContext";

export default function AuthWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AuthGate>{children}</AuthGate>
    </AuthProvider>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { accessToken, isLoading } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  React.useEffect(() => {
    if (isMounted && !isLoading && !accessToken) {
      router.replace("login");
    }
  }, [isMounted, isLoading, accessToken, router]);

  if (!isMounted || isLoading) {
    return null;
  }

  return <>{children}</>;
}
