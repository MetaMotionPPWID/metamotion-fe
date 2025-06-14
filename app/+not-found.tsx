import { Link, Stack } from "expo-router";
import { StyleSheet } from "react-native";

import { ThemedText, ThemedView } from "@/components/ui";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <ThemedView style={styles.container}>
        <ThemedText type="title">Oops!</ThemedText>
        <Link href="/(tabs)/sensors" style={styles.link}>
          <ThemedText type="link">Go to home</ThemedText>
        </Link>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
