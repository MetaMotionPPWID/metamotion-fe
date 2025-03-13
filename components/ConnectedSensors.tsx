import React, { useState } from "react";
import {
  StyleSheet,
  FlatList,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { Device } from "react-native-ble-plx";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";

const MOCK_SENSORS: Partial<Device>[] = [
  { id: "1", name: "Mock Sensor 1" },
  { id: "2", name: "Mock Sensor 2" },
  { id: "3", name: "Mock Sensor 3" },
];

export const ConnectedSensors = () => {
  const [selectedDevice, setSelectedDevice] = useState<Partial<Device>>();

  const handleSensorPress = (device: Partial<Device>) => {
    setSelectedDevice(device);
  };

  return (
    <>
      <FlatList
        data={MOCK_SENSORS}
        keyExtractor={(item) => item.id!}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.sensorItemContainer}
            activeOpacity={0.6}
            onPress={() => handleSensorPress(item)}
          >
            <View style={styles.sensorItem}>
              <IconSymbol size={20} color="#676652" name="wifi.square.fill" />
              <ThemedText type="defaultSemiBold" style={styles.sensorText}>
                {item.name ? item.name : "Unnamed sensor"}
              </ThemedText>
            </View>
            {selectedDevice?.id === item.id && (
              <ActivityIndicator size="small" color="#303030" />
            )}
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.sensorListContainer}
      />
    </>
  );
};

const styles = StyleSheet.create({
  sensorListContainer: {
    marginTop: 4,
  },
  sensorItemContainer: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 6,
    backgroundColor: "#E1E6E4",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sensorItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  sensorText: {
    marginLeft: 8,
  },
});
