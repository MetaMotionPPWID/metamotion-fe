import React from "react";
import { AuthProvider } from "./app/authContext";
import RootLayout from "./app/_layout";

export default function App() {
  return (
    <AuthProvider>
      <RootLayout />
    </AuthProvider>
  );
}
