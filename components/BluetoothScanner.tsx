import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  FlatList,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { BleManager, Device } from "react-native-ble-plx";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";

export const BluetoothScanner = () => {
  const [sensors, setSensors] = useState<Device[]>([]);
  const [searching, setSearching] = useState<boolean>(false);
  const [selectedDevice, setSelectedDevice] = useState<Device>();

  const bleManager = useRef(new BleManager()).current;

  useEffect(() => {
    setSearching(true);
    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error("Scan error:", error);
        setSearching(false);
        return;
      }

      if (device) {
        // Add device to the list if it's not already there.
        setSensors((prevSensors) => {
          if (!prevSensors.find((d) => d.id === device.id)) {
            return [...prevSensors, device];
          }
          return prevSensors;
        });
      }
    });

    // Stop searching after 10 seconds.
    const scanTimeout = setTimeout(() => {
      bleManager.stopDeviceScan();
      bleManager.destroy();
      setSearching(false);
    }, 10000);

    return () => {
      bleManager.stopDeviceScan();
      bleManager.destroy();
      clearTimeout(scanTimeout);
    };
  }, [bleManager]);

  // When a sensor is tapped, attempt to connect.
  const handleSensorPress = (device: Device) => {
    bleManager.stopDeviceScan();
    setSelectedDevice(device);

    device
      .connect()
      .then((dev) => dev.discoverAllServicesAndCharacteristics())
      .then((dev) => {
        console.log("Connected to sensor:", dev.name || dev.id);
        setSelectedDevice(undefined);
      })
      .catch((error) => {
        console.error("Connection error:", error);
        setSelectedDevice(undefined);
      });
  };

  return (
    <>
      <FlatList
        data={sensors}
        keyExtractor={(item) => item.id}
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
      {searching && (
        <View style={styles.searchContainer}>
          <ActivityIndicator size="small" color="#303030" />
          <ThemedText type="default" style={styles.searchText}>
            Searching...
          </ThemedText>
        </View>
      )}
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  searchText: {
    marginLeft: 10,
  },
});
