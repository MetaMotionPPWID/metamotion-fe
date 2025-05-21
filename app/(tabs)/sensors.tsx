import { useState } from "react";
import { StyleSheet } from "react-native";

import {
  AccelerometerGraph,
  BluetoothScanner,
  ConnectedSensors,
  GyroscopeGraph,
} from "@/components/sensors";
import {
  IconSymbol,
  ParallaxScrollView,
  ThemedPicker,
  ThemedText,
  ThemedView,
} from "@/components/ui";
import { useMetaWear } from "@/hooks";

export default function SensorsScreen() {
  const [currentHand, setCurrentHand] = useState("left");
  const [currentLabel, setCurrentLabel] = useState("sitting");

  const metaWearState = useMetaWear(currentLabel, currentHand);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#DDA05D", dark: "#DDA05D" }}
      headerImage={
        <IconSymbol
          size={310}
          color="#2A2A2A"
          name="sensor.tag.radiowaves.forward"
          style={styles.headerImage}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Sensors</ThemedText>
      </ThemedView>
      <ThemedView style={{ zIndex: 10, overflow: "visible" }}>
        <ThemedPicker
          label="Watch on hand"
          value={currentHand}
          onChange={setCurrentHand}
          options={[
            { label: "Left", value: "left" },
            { label: "Right", value: "right" },
          ]}
        />
        <ThemedPicker
          label="Activity label"
          value={currentLabel}
          onChange={setCurrentLabel}
          options={[
            { label: "Sitting", value: "sitting" },
            { label: "Walking", value: "walking" },
            { label: "Running", value: "running" },
          ]}
        />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Connected sensors</ThemedText>
        <ThemedText type="default">Tap a sensor to disconnect.</ThemedText>
        <ConnectedSensors metaWearState={metaWearState} />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Available sensors</ThemedText>
        <ThemedText type="default">
          Tap a sensor to establish a connection.
        </ThemedText>
        <BluetoothScanner metaWearState={metaWearState} />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <AccelerometerGraph metaWearState={metaWearState} />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <GyroscopeGraph metaWearState={metaWearState} />
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
