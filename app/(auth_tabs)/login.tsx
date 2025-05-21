import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from "react-native";

import { postLogin } from "@/api/auth";
import { ThemedText } from "@/components/ui";
import { useAuth, useColorScheme } from "@/hooks";

export default function LoginScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const { setTokens } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const isDark = scheme === "dark";

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Unable to login", "Please fill in all fields");
      return;
    }

    try {
      const accessToken = await postLogin(username, password);
      setTokens(accessToken);
      router.replace("/sensors");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || "An error occurred during login.";
      Alert.alert("An error occurred", errorMessage);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.select({ ios: -150, android: 0 })}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedText type="title" style={styles.title}>
            Welcome back
          </ThemedText>

          <TextInput
            style={[
              styles.input,
              {
                color: isDark ? "#fff" : "#000",
                backgroundColor: isDark ? "#1c1c1e" : "#f2f2f7",
                borderColor: isDark ? "#3a3a3c" : "#ccc",
              },
            ]}
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
          />

          <TextInput
            style={[
              styles.input,
              {
                color: isDark ? "#fff" : "#000",
                backgroundColor: isDark ? "#1c1c1e" : "#f2f2f7",
                borderColor: isDark ? "#3a3a3c" : "#ccc",
              },
            ]}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <ThemedText style={styles.buttonText}>Login</ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    marginBottom: 20,
  },
  input: {
    width: "100%",
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#505050",
    borderRadius: 10,
    fontSize: 17,
  },
  button: {
    width: "30%",
    marginTop: 2,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "#007AFF",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2, // Android shadow fallback
  },
  buttonText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#fff",
  },
});
