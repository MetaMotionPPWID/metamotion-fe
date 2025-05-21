import { useEffect, useState } from "react";
import { NativeEventEmitter, NativeModules } from "react-native";
import { Device } from "react-native-ble-plx";

import {
  Sample,
  addSampleToBuffer,
  flushBatches,
  postSensor,
} from "@/api/service";
import {
  DataPoint,
  PartialSample,
  UseMetaWearResult,
  parseAcceleratorData,
  parseGyroscopeData,
} from "@/hooks/utils";

const { MetaWearModule } = NativeModules;
const sensorEventEmitter = new NativeEventEmitter(MetaWearModule);

const MAX_DATA_POINTS = 50;
const MERGE_WINDOW_MS = 20;
const FLUSH_TIMEOUT_MS = 200;

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
      (dataString: string) => {
        const parsedData = parseAcceleratorData(dataString);
        if (connectedDevice?.id) {
          addCombinedSample(connectedDevice.id, "accel", parsedData);
        }
        setAccelerometerData((prevData) => {
          const newData = [...prevData, parsedData];
          if (newData.length > MAX_DATA_POINTS) {
            return newData.slice(newData.length - MAX_DATA_POINTS);
          }
          return newData;
        });
      },
    );
    const gyroSub = sensorEventEmitter.addListener(
      "GYRO_DATA",
      (dataString: string) => {
        const parsed = parseGyroscopeData(dataString);
        if (connectedDevice?.id) {
          addCombinedSample(connectedDevice.id, "gyro", parsed);
        }
        setGyroscopeData((prev) => {
          const buf = [...prev, parsed];
          return buf.length > MAX_DATA_POINTS
            ? buf.slice(buf.length - MAX_DATA_POINTS)
            : buf;
        });
      },
    );
    return () => {
      subscription.remove();
      gyroSub.remove();
    };
  }, [connectedDevice]);

  const connectToDevice = async (device: Device): Promise<void> => {
    // On Android, device.id is typically the MAC
    // On iOS, device.id is typically the CBPeripheral.identifier (UUID)
    if (device.id) {
      try {
        await MetaWearModule.connectToDevice(device.id);
        setConnectedDevice(device);
        await postSensor({
          mac: device.id,
          name: device.name ?? "Unknown",
          samples: [],
        });
      } catch (error) {
        console.error("Connection error:", error);
      }
    }
  };

  const disconnectDevice = async (deviceId: string): Promise<void> => {
    if (deviceId) {
      try {
        await flushBatches();
        await MetaWearModule.disconnectFromDevice(deviceId);
        setConnectedDevice(null);
      } catch (error) {
        console.error("Disconnection error:", error);
      }
    }
  };

  const pendingSamples: Record<string, Record<number, PartialSample>> = {};
  const addCombinedSample = (
    mac: string,
    kind: "accel" | "gyro",
    dp: { x: number; y: number; z: number; timestamp: number },
  ) => {
    const bucketTs = Math.round(dp.timestamp / MERGE_WINDOW_MS);

    if (!pendingSamples[mac]) {
      pendingSamples[mac] = {};
    }
    const entry = pendingSamples[mac][bucketTs] ?? {
      timestamp: new Date(dp.timestamp).toISOString(),
    };

    if (kind === "accel") entry.acceleration = [dp.x, dp.y, dp.z];
    else entry.gyroscope = [dp.x, dp.y, dp.z];
    pendingSamples[mac][bucketTs] = entry;
    if (entry.acceleration && entry.gyroscope) {
      const completeSample: Sample = {
        timestamp: entry.timestamp,
        label: currentLabel,
        watch_on_hand: currentHand,
        acceleration: entry.acceleration,
        gyroscope: entry.gyroscope,
      };
      addSampleToBuffer(mac, completeSample);
      delete pendingSamples[mac][bucketTs];
    } else {
      setTimeout(() => {
        const left = pendingSamples[mac]?.[bucketTs];
        if (left) {
          const partialSample: Sample = {
            timestamp: left.timestamp,
            label: currentLabel,
            watch_on_hand: currentHand,
            acceleration: left.acceleration ?? [],
            gyroscope: left.gyroscope ?? [],
          };
          addSampleToBuffer(mac, partialSample);
          delete pendingSamples[mac][bucketTs];
        }
      }, FLUSH_TIMEOUT_MS);
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
