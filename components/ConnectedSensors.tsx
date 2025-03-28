import React from "react";
import { StyleSheet, FlatList, TouchableOpacity, View } from "react-native";
import { Device } from "react-native-ble-plx";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useMetawear } from "@/hooks/useMetawear";

export const ConnectedSensors = () => {
  const metawearState = useMetawear();

  const connectedDevice = metawearState.connectedDevice;
  const disconnectDevice = metawearState.disconnectDevice;

  const handleSensorPress = (device: Partial<Device>) => {
    if (device.id) {
      disconnectDevice(device.id);
    }
  };

  return (
    connectedDevice && (
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
