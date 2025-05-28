import React from "react";
import { StyleSheet, Text, View } from "react-native";

type LegendItem = {
  label: string;
  color: string;
};

const DEFAULT_ITEMS: LegendItem[] = [
  { label: "Walking", color: "#4F8EF7" },
  { label: "Sitting", color: "#FDB913" },
  { label: "Running", color: "#E81010" },
];

export const AnalyticsLegend = () => (
  <View style={styles.container}>
    {DEFAULT_ITEMS.map(({ label, color }) => (
      <View key={label} style={styles.item}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={styles.label}>{label}</Text>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 32,
    marginTop: 8,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 4,
  },
  label: {
    fontSize: 14,
  },
});
