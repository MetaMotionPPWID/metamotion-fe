import { StyleSheet } from "react-native";

import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { BluetoothScanner } from "@/components/BluetoothScanner";
import { ConnectedSensors } from "@/components/ConnectedSensors";
import { useMetawear } from "@/hooks/useMetawear";
import AccelerometerGraph from "@/components/AccelerometerGraph";

export default function BluetoothScreen() {
  const metawearState = useMetawear();
  
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
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Connected sensors</ThemedText>
        <ThemedText type="default">Tap a sensor to disconnect.</ThemedText>
        <ConnectedSensors metawearState={metawearState}/>
      </ThemedView>
      !connectedDevice &&<ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Available sensors</ThemedText>
        <ThemedText type="default">
          Tap a sensor to establish a connection.
        </ThemedText>
        <BluetoothScanner metawearState={metawearState} />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <AccelerometerGraph metawearState={metawearState}/>
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
