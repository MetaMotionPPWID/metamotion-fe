import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Device } from "react-native-ble-plx";

import { IconSymbol } from "@/components/ui/IconSymbol";
import { ThemedText } from "@/components/ui/ThemedText";
import { UseMetaWearResult } from "@/hooks/types";

type Props = {
  metaWearState: UseMetaWearResult;
};

export const ConnectedSensors = ({ metaWearState }: Props) => {
  const [selectedDevice, setSelectedDevice] = useState<Partial<Device>>();

  const connectedDevice = metaWearState.connectedDevice;
  const disconnectDevice = metaWearState.disconnectDevice;

  const handleSensorPress = async (device: Partial<Device>) => {
    setSelectedDevice(device);
    if (device.id) {
      await disconnectDevice(device.id);
      setSelectedDevice(undefined);
    }
  };

  return (
    connectedDevice?.id && (
      <>
        <FlatList
          data={
            connectedDevice && connectedDevice.id && connectedDevice.name
              ? [{ id: connectedDevice.id, name: connectedDevice.name }]
              : [{ id: "0", name: "No connections..." }]
          }
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
    )
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
    color: "black",
  },
});
