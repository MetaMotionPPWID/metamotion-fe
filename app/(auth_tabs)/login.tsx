import React, { useState } from "react";
import { StyleSheet, TextInput, Button, Alert } from "react-native";
import { ThemedView, ThemedText } from "@/components/ui";
import { useRouter } from "expo-router";
import { useAuth } from "@/hooks";
import { postLogin } from "@/api/auth";

export default function LoginScreen() {
  const router = useRouter();
  const { setTokens } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    try {
      const accessToken = await postLogin(username, password);
      setTokens(accessToken);

      Alert.alert("Login Successful", "Welcome!");
      router.replace("(tabs)");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || "An error occurred during login.";
      Alert.alert("Error", errorMessage);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Login
      </ThemedText>
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Login" onPress={handleLogin} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    marginBottom: 20,
  },
  input: {
    width: "100%",
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
  },
});
