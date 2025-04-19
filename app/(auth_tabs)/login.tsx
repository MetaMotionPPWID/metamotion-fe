import React, { useState } from "react";
import { StyleSheet, TextInput, Button, Alert } from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useRouter } from "expo-router";
import axios from "axios";
import { baseApiUrl } from "@/api_service/api_base";
import { useAuth } from "../authContext";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { setTokens } = useAuth();

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    try {
      const response = await axios.post(baseApiUrl + "/auth/login", {
        login: username,
        password: password,
      });

      if (response.status === 200) {
        const { access_token, refresh_token } = response.data;
        setTokens(access_token, refresh_token);
        Alert.alert("Login Successful", "Welcome!");
        router.replace("(tabs)");
      }
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
