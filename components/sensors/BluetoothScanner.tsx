import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { BleManager, Device } from "react-native-ble-plx";

import { IconSymbol } from "@/components/ui/IconSymbol";
import { ThemedText } from "@/components/ui/ThemedText";
import { UseMetaWearResult } from "@/hooks/types";
import { PermissionsAndroid, Platform } from "react-native";

type Props = {
  metaWearState: UseMetaWearResult;
};

export const BluetoothScanner = ({ metaWearState }: Props) => {
  const [sensors, setSensors] = useState<Device[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [selectedDevice, setSelectedDevice] = useState<Device>();

  const connectToDevice = metaWearState.connectToDevice;
  const bleManager = useRef(new BleManager()).current;

  useEffect(() => {
    let scanTimeout: NodeJS.Timeout;

    const requestPermissions = async () => {
      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.warn("❌ Location not accepted.");
        }
      }
    };

    const initScan = async () => {
      await requestPermissions();

      const subscription = bleManager.onStateChange((state) => {
        if (state === "PoweredOn") {
          subscription.remove();
          setIsSearching(true);

          bleManager.startDeviceScan(null, null, (error, device) => {
            if (error) {
              console.error("Scan error:", error);
              setIsSearching(false);
              return;
            }

            if (device) {
              setSensors((prevSensors) => {
                if (!prevSensors.find((d) => d.id === device.id)) {
                  return [...prevSensors, device];
                }
                return prevSensors;
              });
            }
          });

          scanTimeout = setTimeout(() => {
            bleManager.stopDeviceScan();
            bleManager.destroy();
            setIsSearching(false);
          }, 10000);
        }
      }, true);
    };

    initScan();

    return () => {
      bleManager.stopDeviceScan();
      bleManager.destroy();
      if (scanTimeout) {
        clearTimeout(scanTimeout);
      }
    };
  }, [bleManager]);

  const handleSensorPress = async (device: Device) => {
    setSelectedDevice(device);
    await connectToDevice(device);
    setSelectedDevice(undefined);
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
      {isSearching && (
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
    color: "black",
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
