import React, { useState } from "react";
import { Dimensions } from "react-native";
import { StackedBarChart } from "react-native-chart-kit";

import { Prediction } from "@/api/service";
import { fetchAllPredictions } from "@/db/predictionsService";

const SAMPLE_MINUTES = 0.3; // 18 seconds
const LEGEND = ["Walking", "Sitting", "Running"] as const;
const BAR_COLORS = ["#4F8EF7", "#FDB913", "#E81010"];
const MAX_HOURS = 4;
const FETCH_INTERVAL_MS = 90 * 1000;

export const AnalyticsChart = () => {
  const [results, setResults] = useState<Prediction[]>([]);

  setTimeout(
    async () => setResults(await fetchAllPredictions()),
    FETCH_INTERVAL_MS,
  );

  // Aggregate minutes per hour per activity
  const mins: Record<
    string,
    { walking: number; sitting: number; running: number }
  > = {};

  results.forEach(({ timestamp, labels }) => {
    const ms = Date.parse(timestamp);
    if (isNaN(ms)) {
      return;
    }

    const d = new Date(ms);
    d.setUTCMinutes(0, 0, 0); // floor to hour
    const key = d.toISOString().slice(0, 13); // YYYY‑MM‑DDTHH

    if (!mins[key]) {
      mins[key] = { walking: 0, sitting: 0, running: 0 };
    }

    labels.forEach((l) => {
      if (l in mins[key]) {
        mins[key][l as keyof (typeof mins)[typeof key]] += SAMPLE_MINUTES;
      }
    });
  });

  const allHourKeys = Object.keys(mins).sort();
  const hourKeys = allHourKeys.slice(-MAX_HOURS);

  const labels = hourKeys.map((k) => {
    const d = new Date(k + ":00:00Z");
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  });

  const data = hourKeys.map((k) => {
    const { walking, sitting, running } = mins[k];
    return [walking, sitting, running];
  });

  const width = Dimensions.get("window").width - 60;
  return (
    <StackedBarChart
      data={{
        labels,
        legend: LEGEND as unknown as string[],
        data,
        barColors: BAR_COLORS,
      }}
      width={width}
      height={240}
      withHorizontalLabels={false}
      hideLegend={true}
      chartConfig={{
        backgroundGradientFrom: "#ffffff",
        backgroundGradientTo: "#ffffff",
        decimalPlaces: 0,
        color: (o = 1) => `rgba(0,0,0,${o})`,
        labelColor: (o = 1) => `rgba(0,0,0,${o})`,
      }}
    />
  );
};
