import { Picker } from "@react-native-picker/picker";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

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

type Period = {
  activity: string;
  start: string;
  end: string;
};

export const AnalyticsChart = () => {
  const [sensors, setSensors] = useState<SensorWithPredictions[]>([]);
  const [mac, setMac] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selected = sensors.find((s) => s.mac === mac);
  const preds = selected?.predictions || [];

  const filtered = useMemo(
    () =>
      sensors
        .filter(
          (s) =>
            s.name.toLowerCase().includes(filter.toLowerCase()) ||
            s.mac.includes(filter),
        )
        .sort(
          (a, b) => a.name.localeCompare(b.name) || a.mac.localeCompare(b.mac),
        ),
    [sensors, filter],
  );

  // Group consecutive predictions into periods
  const periods = useMemo(() => {
    if (!preds.length) {
      return [] as Period[];
    }

    const result: Period[] = [];
    let current = {
      activity: preds[0].predicted_activity,
      start: preds[0].timestamp,
      end: preds[0].timestamp,
    };

    for (let i = 1; i < preds.length; i++) {
      const p = preds[i];
      if (p.predicted_activity === current.activity) {
        current.end = p.timestamp;
      } else {
        result.push(current);
        current = {
          activity: p.predicted_activity,
          start: p.timestamp,
          end: p.timestamp,
        };
      }
    }

    result.push(current);
    return result;
  }, [preds]);

  const loadPredictions = useCallback(() => {
    if (!mac || !start || !end) {
      return setError("Select sensor & time range");
    }

    setError("");
    setLoading(true);

    getPredictions(mac, start, end)
      .then((preds) =>
        setSensors((prev) =>
          prev.map((s) => (s.mac === mac ? { ...s, predictions: preds } : s)),
        ),
      )
      .catch(() => setError("Could not load predictions"))
      .finally(() => setLoading(false));
  }, [mac, start, end]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TextInput
        placeholder="Filter devices"
        value={filter}
        onChangeText={setFilter}
        style={styles.input}
      />
      <Picker selectedValue={mac} onValueChange={setMac} style={styles.picker}>
        <Picker.Item label="-- choose --" value={null} />
        {filtered.map((s) => (
          <Picker.Item
            key={s.mac}
            label={`${s.name} (${s.mac})`}
            value={s.mac}
          />
        ))}
      </Picker>

      <TextInput
        placeholder="Start ISO"
        value={start}
        onChangeText={setStart}
        style={styles.input}
      />
      <TextInput
        placeholder="End ISO"
        value={end}
        onChangeText={setEnd}
        style={styles.input}
      />
      <Button title="Refresh" onPress={loadPredictions} disabled={loading} />

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : loading ? (
        <ActivityIndicator />
      ) : null}

      {!loading && !preds.length && (
        <Text style={styles.noData}>No prediction data.</Text>
      )}

      {!!periods.length && (
        <View style={styles.periods}>
          <Text style={styles.title}>Activity Periods:</Text>
          {periods.map((p, i) => (
            <Text key={i} style={{ color: activityColor(p.activity) }}>
              {new Date(p.start).toLocaleString()} -{" "}
              {new Date(p.end).toLocaleString()}: {p.activity}
            </Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 8, marginBottom: 8 },
  picker: { height: 50, marginBottom: 8 },
  error: { color: "red", marginVertical: 8 },
  noData: { fontStyle: "italic", color: "#888", marginVertical: 8 },
  periods: { marginTop: 16 },
  title: { fontWeight: "bold", marginBottom: 8 },
});
