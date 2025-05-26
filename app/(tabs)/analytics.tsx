import { StyleSheet } from "react-native";

import { AnalyticsChart } from "@/components/analytics";
import {
  IconSymbol,
  ParallaxScrollView,
  ThemedText,
  ThemedView,
} from "@/components/ui";

export const mockPredictions = [
  // 26 May 2025 UTC
  { id: 1, timestamp: Date.UTC(2025, 4, 26, 8, 3) / 1000, label: "walking" },
  { id: 2, timestamp: Date.UTC(2025, 4, 26, 8, 47) / 1000, label: "sitting" },
  { id: 3, timestamp: Date.UTC(2025, 4, 26, 9, 2) / 1000, label: "running" },
  { id: 4, timestamp: Date.UTC(2025, 4, 26, 9, 30) / 1000, label: "walking" },
  { id: 5, timestamp: Date.UTC(2025, 4, 26, 10, 15) / 1000, label: "sitting" },
  { id: 6, timestamp: Date.UTC(2025, 4, 26, 10, 56) / 1000, label: "running" },
];

export default function AnalyticsScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#D0D0D0", dark: "#DDA05D" }}
      headerImage={
        <IconSymbol
          size={310}
          color="#2A2A2A"
          name="analytics"
          style={styles.headerImage}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Analytics</ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle"></ThemedText>
        <ThemedText type="default">Browse analytics data</ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <AnalyticsChart predictions={mockPredictions} />
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  headerImage: {
    color: "#808080",
    bottom: -90,
    left: -35,
    position: "absolute",
  },
});
