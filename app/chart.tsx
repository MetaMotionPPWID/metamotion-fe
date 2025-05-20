import {
  getSensors,
  getSamples,
  getPredictions,
  Sample,
  Prediction,
} from "../api";
import { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  View,
  ActivityIndicator,
  TextInput,
  Button,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { BarChart } from "react-native-gifted-charts";

export default function Chart() {
  const [sensors, setSensors] = useState<{ mac: string; name: string }[]>([]);
  const [selectedMac, setSelectedMac] = useState<string | null>(null);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterQuery, setFilterQuery] = useState<string>("");

  const [startTime, setStartTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);

  useEffect(() => {
    getSensors()
      .then((data) => {
        const devices = data.map(({ mac, name }) => ({ mac, name }));
        setSensors(devices);
        setError(null);
      })
      .catch((err) => {
        console.error("Error getting device list:", err);
        if (err?.message === "Network Error") {
          setError("No internet connection.");
        } else if (err?.code === "ECONNABORTED") {
          setError("Server response timed out.");
        } else if (err?.response?.status === 403) {
          setError("No authorization. Please log in again.");
        } else if (err?.response?.status === 500) {
          setError("Server error. Please try again later.");
        } else {
          setError("Failed to retrieve device list.");
        }
      });
  }, []);

  useEffect(() => {
    setSamples([]);
    setPredictions([]);
    setDataError(null);
  }, [selectedMac]);

  const loadSensorData = async (mac: string) => {
    setLoading(true);
    setDataError(null);
    setSamples([]);
    setPredictions([]);

    try {
      const fetchedSamples = await getSamples(mac);
      setSamples(fetchedSamples);

      if (!startTime || !endTime) {
        setDataError("Please provide both start and end time (ISO format).");
        return;
      }

      try {
        const preds = await getPredictions(mac, startTime, endTime);
        setPredictions(preds);
      } catch (predErr) {
        console.error("Prediction error:", predErr);
        setPredictions([]);
        setDataError("Failed to retrieve prediction.");
      }
    } catch (err) {
      console.error("Sample error (refresh):", err);
      setSamples([]);
      setPredictions([]);

      if (err?.message === "Network Error") {
        setDataError("No internet connection.");
      } else if (err?.code === "ECONNABORTED") {
        setDataError("Server response timed out.");
      } else if (err?.response?.status === 403) {
        setDataError("No authorization. Please log in again.");
      } else if (err?.response?.status === 500) {
        setDataError("Server error. Please try again later.");
      } else {
        setDataError("Failed to download data for the selected device.");
      }
    } finally {
      setLoading(false);
    }
  };

  const renderChart = (label: string, data: number[]) => (
    <View style={{ marginVertical: 12 }}>
      <Text>{label}</Text>
      <BarChart data={data.map((v) => ({ value: v }))} barWidth={8} />
    </View>
  );

  const accX = samples.map((s) => s.acceleration[0]);
  const accY = samples.map((s) => s.acceleration[1]);
  const accZ = samples.map((s) => s.acceleration[2]);

  const gyrX = samples.map((s) => s.gyroscope[0]);
  const gyrY = samples.map((s) => s.gyroscope[1]);
  const gyrZ = samples.map((s) => s.gyroscope[2]);

  const filteredSensors = sensors
    .filter(
      (sensor) =>
        sensor.mac.toLowerCase().includes(filterQuery.toLowerCase()) ||
        sensor.name.toLowerCase().includes(filterQuery.toLowerCase()),
    )
    .sort((a, b) => {
      const nameCompare = a.name.localeCompare(b.name);
      return nameCompare !== 0 ? nameCompare : a.mac.localeCompare(b.mac);
    });

  const activityColor = (label: string): string => {
    switch (label) {
      case "walking":
        return "green";
      case "running":
        return "blue";
      case "idle":
        return "gray";
      default:
        return "black";
    }
  };

  return (
    <ScrollView style={{ padding: 16 }}>
      <Text style={{ fontSize: 16, marginBottom: 8 }}>Select device:</Text>

      {error ? (
        <Text style={{ color: "red", marginBottom: 16 }}>{error}</Text>
      ) : (
        <>
          <TextInput
            placeholder="Filter by name or MAC..."
            value={filterQuery}
            onChangeText={setFilterQuery}
            style={{
              borderWidth: 1,
              borderColor: "#ccc",
              padding: 8,
              borderRadius: 4,
              marginBottom: 8,
            }}
          />

          {filteredSensors.length === 0 ? (
            <Text style={{ fontStyle: "italic", color: "#888" }}>
              No devices matching your criteria.
            </Text>
          ) : (
            <Picker
              selectedValue={selectedMac}
              onValueChange={(itemValue) => setSelectedMac(itemValue)}
              style={{ height: 50, marginBottom: 8 }}
            >
              <Picker.Item label="-- choose --" value={null} />
              {filteredSensors.map((sensor) => (
                <Picker.Item
                  key={sensor.mac}
                  label={`${sensor.name} (${sensor.mac})`}
                  value={sensor.mac}
                />
              ))}
            </Picker>
          )}

          <TextInput
            placeholder="Start time (ISO) e.g. 2025-05-20T00:00:00Z"
            value={startTime ?? ""}
            onChangeText={setStartTime}
            style={{
              borderWidth: 1,
              borderColor: "#ccc",
              padding: 8,
              borderRadius: 4,
              marginBottom: 8,
            }}
          />

          <TextInput
            placeholder="End time (ISO) e.g. 2025-05-20T00:05:00Z"
            value={endTime ?? ""}
            onChangeText={setEndTime}
            style={{
              borderWidth: 1,
              borderColor: "#ccc",
              padding: 8,
              borderRadius: 4,
              marginBottom: 8,
            }}
          />

          {selectedMac && (
            <View style={{ marginBottom: 16 }}>
              <Button
                title="Refresh data"
                onPress={() => loadSensorData(selectedMac)}
                disabled={loading}
              />
            </View>
          )}
        </>
      )}

      {loading && <ActivityIndicator size="large" style={{ marginTop: 20 }} />}

      {!loading && selectedMac && (
        <>
          {dataError && (
            <Text style={{ color: "red", marginBottom: 8 }}>{dataError}</Text>
          )}

          {samples.length === 0 && !dataError && (
            <Text style={{ fontStyle: "italic", color: "#999" }}>
              No samples for the selected device.
            </Text>
          )}

          {samples.length > 0 && (
            <View>
              {renderChart("Accelerometer X", accX)}
              {renderChart("Accelerometer Y", accY)}
              {renderChart("Accelerometer Z", accZ)}
              {renderChart("Gyroscope X", gyrX)}
              {renderChart("Gyroscope Y", gyrY)}
              {renderChart("Gyroscope Z", gyrZ)}

              <View style={{ marginVertical: 12 }}>
                <Text style={{ fontWeight: "bold", marginBottom: 4 }}>
                  Predictions:
                </Text>
                {predictions.length === 0 ? (
                  <Text style={{ fontStyle: "italic" }}>
                    No prediction for the selected period.
                  </Text>
                ) : (
                  predictions.map((p, index) => (
                    <Text
                      key={index}
                      style={{ color: activityColor(p.predicted_activity) }}
                    >
                      {new Date(p.timestamp).toLocaleString()}:{" "}
                      {p.predicted_activity}
                    </Text>
                  ))
                )}
              </View>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}
