import { useEffect, useState } from "react";
import { NativeEventEmitter, NativeModules } from "react-native";
import { Device } from "react-native-ble-plx";

import { DataPoint, SensorDataStream, UseMetaWearResult } from "./types";

import type { Sample } from "@/api/service";
import { storeSample } from "@/db/samplesService";

const { MetaWearModule } = NativeModules;
const sensorEventEmitter = new NativeEventEmitter(MetaWearModule);

export const useMetaWear = (
  currentLabel: string,
  currentHand: string,
): UseMetaWearResult => {
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [accelerometerData, setAccelerometerData] = useState<DataPoint[]>([]);
  const [gyroscopeData, setGyroscopeData] = useState<DataPoint[]>([]);

  useEffect(() => {
    const subscription = sensorEventEmitter.addListener(
      "SENSOR_DATA",
      (dataString: SensorDataStream) => {
        const sample: Sample = {
          timestamp: dataString.timestamp,
          label: currentLabel,
          watch_on_hand: currentHand,
          acceleration: dataString.accelerometer,
          gyroscope: dataString.gyroscope,
        };

        storeSample(connectedDevice!.id, sample);
      },
    );
    return () => {
      subscription.remove();
    };
  }, [connectedDevice]);

  const connectToDevice = async (device: Device): Promise<void> => {
    // On Android, device.id is typically the MAC
    // On iOS, device.id is typically the CBPeripheral.identifier (UUID)
    if (device.id) {
      try {
        await MetaWearModule.connectToDevice(device.id);
        setConnectedDevice(device);
      } catch (error) {
        console.error("Connection error:", error);
      }
    }
  };

  const disconnectDevice = async (deviceId: string): Promise<void> => {
    if (deviceId) {
      try {
        await MetaWearModule.disconnectFromDevice(deviceId);
        setConnectedDevice(null);
      } catch (error) {
        console.error("Disconnection error:", error);
      }
    }
  };

  return {
    connectedDevice,
    connectToDevice,
    disconnectDevice,
    accelerometerData,
    gyroscopeData,
  };
};
