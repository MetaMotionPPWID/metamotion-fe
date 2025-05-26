import React from "react";
import { Dimensions } from "react-native";
import { StackedBarChart } from "react-native-chart-kit";

import { PredictionRow } from "@/db/types";

interface Props {
  predictions: PredictionRow[];
}

const PREDICTION_MINUTES = 5; // Each prediction counts as this many minutes
const LEGEND = ["Walking", "Sitting", "Running"] as const;
const BAR_COLORS = ["#4F8EF7", "#FDB913", "#D01630"];

export const ActivityScreenTimeChart = ({ predictions }: Props) => {
  // Aggregate minutes per hour per activity
  const buckets: Record<
    string,
    { walking: number; sitting: number; running: number }
  > = {};

  predictions.forEach(({ timestamp, label }) => {
    const date = new Date(timestamp * 1000); // convert sec → ms
    const hourKey = date.toISOString().slice(0, 13); // «YYYY‑MM‑DDTHH»

    if (!buckets[hourKey]) {
      buckets[hourKey] = { walking: 0, sitting: 0, running: 0 };
    }

    if (label in buckets[hourKey]) {
      buckets[hourKey][label as keyof (typeof buckets)[typeof hourKey]] +=
        PREDICTION_MINUTES;
    }
  });

  const hourKeys = Object.keys(buckets).sort();

  const labels = hourKeys.map((k) => {
    const d = new Date(k + ":00:00Z");
    return d.toLocaleTimeString([], { hour: "2-digit" });
  });

  const data = hourKeys.map((k) => {
    const { walking, sitting, running } = buckets[k];
    return [walking, sitting, running];
  });

  const chartWidth = Dimensions.get("window").width - 32;

  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    barPercentage: 0.6,
    color: (opacity = 1) => `rgba(0,0,0,${opacity})`,
    labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
  } as const;

  return (
    <StackedBarChart
      data={{
        labels,
        legend: LEGEND as unknown as string[],
        data,
        barColors: BAR_COLORS,
      }}
      width={chartWidth}
      height={240}
      yAxisSuffix="m"
      chartConfig={chartConfig}
      style={{ marginVertical: 8, borderRadius: 16, alignSelf: "center" }}
      hideLegend={false}
    />
  );
};
