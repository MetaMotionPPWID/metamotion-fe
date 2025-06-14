import React, { useCallback, useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LineChart } from "react-native-chart-kit";

import { fetchLatestAccelerometerSamples } from "@/db/samplesService";

export const AccelerometerGraph = () => {
  const [visibleAxes, setVisibleAxes] = useState({ x: true, y: true, z: true });

  const [dataPoints, setDataPoints] = useState<
    { x: number; y: number; z: number }[]
  >([]);

  setTimeout(
    async () => setDataPoints(await fetchLatestAccelerometerSamples()),
    500,
  );

  const latestData =
    dataPoints.length > 0
      ? dataPoints[dataPoints.length - 1]
      : { x: 0, y: 0, z: 0 };

  const toggleAxis = useCallback((axis: "x" | "y" | "z") => {
    setVisibleAxes((prev) => ({
      ...prev,
      [axis]: !prev[axis],
    }));
  }, []);

  const chartData = {
    labels:
      dataPoints.length > 0
        ? Array(Math.min(6, dataPoints.length))
            .fill("")
            .map(
              (_, i) =>
                `${Math.round((dataPoints.length - 1 - i * (dataPoints.length / 6)) * 10) / 10}s`,
            )
        : ["0s"],
    datasets: [
      ...(visibleAxes.x
        ? [
            {
              data: dataPoints.map((p) => p.x),
              color: () => "rgba(255, 0, 0, 0.8)",
              strokeWidth: 2,
            },
          ]
        : []),
      ...(visibleAxes.y
        ? [
            {
              data: dataPoints.map((p) => p.y),
              color: () => "rgba(0, 255, 0, 0.8)",
              strokeWidth: 2,
            },
          ]
        : []),
      ...(visibleAxes.z
        ? [
            {
              data: dataPoints.map((p) => p.z),
              color: () => "rgba(0, 0, 255, 0.8)",
              strokeWidth: 2,
            },
          ]
        : []),
    ],
    legend: [
      ...(visibleAxes.x ? ["X"] : []),
      ...(visibleAxes.y ? ["Y"] : []),
      ...(visibleAxes.z ? ["Z"] : []),
    ],
  };

  const width = Dimensions.get("window").width - 95;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Accelerometer Data</Text>

      {dataPoints.length === 0 ? (
        <View style={styles.placeholderChart}>
          <Text style={styles.placeholderText}>Waiting for data...</Text>
        </View>
      ) : (
        <LineChart
          data={chartData}
          width={width}
          height={220}
          chartConfig={{
            backgroundColor: "#f5f5f5",
            backgroundGradientFrom: "#f5f5f5",
            backgroundGradientTo: "#f5f5f5",
            decimalPlaces: 2,
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: "3",
            },
          }}
          bezier
          style={styles.chart}
          withDots={false}
          withInnerLines={false}
          withOuterLines={true}
          fromZero={false}
          yAxisInterval={0.2}
        />
      )}

      <View style={styles.axisControls}>
        <TouchableOpacity
          style={[
            styles.axisButton,
            visibleAxes.x ? styles.axisButtonActive : null,
            styles.xAxisButton,
          ]}
          onPress={() => toggleAxis("x")}
        >
          <Text
            style={[
              styles.axisButtonText,
              visibleAxes.x ? styles.axisButtonTextActive : null,
            ]}
          >
            X
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.axisButton,
            visibleAxes.y ? styles.axisButtonActive : null,
            styles.yAxisButton,
          ]}
          onPress={() => toggleAxis("y")}
        >
          <Text
            style={[
              styles.axisButtonText,
              visibleAxes.y ? styles.axisButtonTextActive : null,
            ]}
          >
            Y
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.axisButton,
            visibleAxes.z ? styles.axisButtonActive : null,
            styles.zAxisButton,
          ]}
          onPress={() => toggleAxis("z")}
        >
          <Text
            style={[
              styles.axisButtonText,
              visibleAxes.z ? styles.axisButtonTextActive : null,
            ]}
          >
            Z
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.currentValues}>
        <Text style={styles.valuesTitle}>Current Values:</Text>
        <View style={styles.valuesRow}>
          <Text style={[styles.axisLabel, styles.xAxisLabel]}>
            X: {latestData.x.toFixed(4)}
          </Text>
          <Text style={[styles.axisLabel, styles.yAxisLabel]}>
            Y: {latestData.y.toFixed(4)}
          </Text>
          <Text style={[styles.axisLabel, styles.zAxisLabel]}>
            Z: {latestData.z.toFixed(4)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "white",
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  placeholderChart: {
    height: 220,
    backgroundColor: "#f5f5f5",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "#666",
    fontSize: 16,
  },
  axisControls: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
  },
  axisButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginHorizontal: 8,
    backgroundColor: "#eee",
  },
  axisButtonActive: {
    backgroundColor: "#333",
  },
  xAxisButton: {
    borderColor: "red",
    borderWidth: 1,
  },
  yAxisButton: {
    borderColor: "green",
    borderWidth: 1,
  },
  zAxisButton: {
    borderColor: "blue",
    borderWidth: 1,
  },
  axisButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  axisButtonTextActive: {
    color: "white",
  },
  currentValues: {
    marginTop: 16,
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
  },
  valuesTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  valuesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  axisLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  xAxisLabel: {
    color: "red",
  },
  yAxisLabel: {
    color: "green",
  },
  zAxisLabel: {
    color: "blue",
  },
});
