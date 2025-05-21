import { useState } from "react";
import { StyleSheet } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";

import {
  AccelerometerGraph,
  BluetoothScanner,
  ConnectedSensors,
  GyroscopeGraph,
} from "@/components/sensors";
import {
  IconSymbol,
  ParallaxScrollView,
  ThemedText,
  ThemedView,
} from "@/components/ui";
import { useMetaWear } from "@/hooks";

export default function SensorsScreen() {
  const [handOpen, setHandOpen] = useState(false);
  const [handValue, setHandValue] = useState<"left" | "right">("left");
  const [handItems, setHandItems] = useState([
    { label: "Left", value: "left" },
    { label: "Right", value: "right" },
  ]);
  const [actionOpen, setActionOpen] = useState(false);
  const [actionValue, setActionValue] = useState<
    "sitting" | "walking" | "running"
  >("sitting");
  const [actionItems, setActionItems] = useState([
    { label: "Sitting", value: "sitting" },
    { label: "Walking", value: "walking" },
    { label: "Running", value: "running" },
  ]);

  const metaWearState = useMetaWear(actionValue, handValue);

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
      <ThemedView
        style={[styles.stepContainer, { zIndex: 10, overflow: "visible" }]}
      >
        <ThemedText type="subtitle">Watch on hand</ThemedText>
        <DropDownPicker
          open={handOpen}
          value={handValue}
          items={handItems}
          setOpen={setHandOpen}
          setValue={setHandValue}
          setItems={setHandItems}
          containerStyle={{ marginBottom: 16 }}
          listMode="MODAL"
        />

        <ThemedText type="subtitle">Activity label</ThemedText>
        <DropDownPicker
          open={actionOpen}
          value={actionValue}
          items={actionItems}
          setOpen={setActionOpen}
          setValue={setActionValue}
          setItems={setActionItems}
          containerStyle={{ marginBottom: 16 }}
          listMode="MODAL"
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
