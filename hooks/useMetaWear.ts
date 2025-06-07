import { useEffect, useRef, useState } from "react";
import { NativeEventEmitter, NativeModules } from "react-native";
import { Device } from "react-native-ble-plx";

import { SensorDataStream, UseMetaWearResult } from "./types";
import { useBearStore } from "./useBearStore";

import type { Sample } from "@/api/service";
import { storeSample } from "@/db/samplesService";

const { MetaWearModule } = NativeModules;
const sensorEventEmitter = new NativeEventEmitter(MetaWearModule);

export const useMetaWear = (): UseMetaWearResult => {
  const currentHand = useBearStore((state) => state.currentHand);
  const currentLabel = useBearStore((state) => state.currentLabel);

  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);

  const currentHandRef = useRef(currentHand);
  const currentLabelRef = useRef(currentLabel);

  useEffect(() => {
    currentHandRef.current = currentHand;
  }, [currentHand]);

  useEffect(() => {
    currentLabelRef.current = currentLabel;
  }, [currentLabel]);

  useEffect(() => {
    if (!connectedDevice) return; // 🔐 nie zaczynaj nasłuchu dopóki nie ustawione

    const listener = (data: SensorDataStream) => {
        console.log("📦 Data received:", data);
      if (
        !Array.isArray(data.accelerometer) ||
        data.accelerometer.length !== 3 ||
        !Array.isArray(data.gyroscope) ||
        data.gyroscope.length !== 3
      ) {
        console.warn("Invalid data format:", data);
        return;
      }

      const sample: Sample = {
        timestamp: data.timestamp,
        label: currentLabelRef.current,
        watch_on_hand: currentHandRef.current,
        acceleration: data.accelerometer,
        gyroscope: data.gyroscope,
      };

      storeSample(connectedDevice.id, sample);
    };

    sensorEventEmitter.addListener("SENSOR_DATA", listener);

    return () => {
      sensorEventEmitter.removeListener("SENSOR_DATA", listener);
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
  };
};
