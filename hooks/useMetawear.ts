import { useEffect, useState, useRef } from "react";
import { NativeModules, NativeEventEmitter } from "react-native";
import { Device } from "react-native-ble-plx";
import {createSensor, addSampleToBuffer, flushBatches, Sample} from "@/api_service/api_service";

const { MetaWearModule } = NativeModules;
const sensorEventEmitter = new NativeEventEmitter(MetaWearModule);

const parseAcceleratorData = (dataString: string) => {
  try {
    // Match patterns like "x: -0.060791016, y: 6.1035156E-4, z: -0.98516846"
    const xMatch = dataString.match(/x:\s*([-\d.E-]+)/);
    const yMatch = dataString.match(/y:\s*([-\d.E-]+)/);
    const zMatch = dataString.match(/z:\s*([-\d.E-]+)/);

    return {
      x: xMatch ? parseFloat(xMatch[1]) : 0,
      y: yMatch ? parseFloat(yMatch[1]) : 0,
      z: zMatch ? parseFloat(zMatch[1]) : 0,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error("Error parsing accelerometer data:", error);
    return { x: 0, y: 0, z: 0, timestamp: Date.now() };
  }
};

const parseGyroscopeData = (dataString: string): DataPoint => {
  try {
    const xMatch = dataString.match(/x:\s*([-\d.E-]+)/);
    const yMatch = dataString.match(/y:\s*([-\d.E-]+)/);
    const zMatch = dataString.match(/z:\s*([-\d.E-]+)/);
    return {
      x: xMatch ? parseFloat(xMatch[1]) : 0,
      y: yMatch ? parseFloat(yMatch[1]) : 0,
      z: zMatch ? parseFloat(zMatch[1]) : 0,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error("Error parsing gyroscope data:", error);
    return { x: 0, y: 0, z: 0, timestamp: Date.now() };
  }
};

type DataPoint = {
  x: number;
  y: number;
  z: number;
  timestamp: number;
};

export type UseMetaWearResult = {
  connectedDevice: Device | null;
  connectToDevice: (device: Device) => Promise<void>;
  disconnectDevice: (deviceId: string) => Promise<void>;
  dataPoints: DataPoint[];
  gyroDataPoints: DataPoint[];
};

const MAX_DATA_POINTS = 50;

export const useMetawear = (
  currentLabel: string,
  currentHand: "left" | "right"
): UseMetaWearResult => {
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [gyroDataPoints, setGyroDataPoints] = useState<DataPoint[]>([]);
  const labelRef = useRef(currentLabel);
  const handRef = useRef(currentHand);

  useEffect(() => {
    labelRef.current = currentLabel;
  }, [currentLabel]);

  useEffect(() => {
    handRef.current = currentHand;
  }, [currentHand]);

  useEffect(() => {
    const subscription = sensorEventEmitter.addListener(
      "SENSOR_DATA",
      (dataString: string) => {
        const parsedData = parseAcceleratorData(dataString);
        if (connectedDevice?.id) {
          addCombinedSample(connectedDevice.id, "accel", parsedData);
        }
        setDataPoints((prevData) => {
          const newData = [...prevData, parsedData];
          if (newData.length > MAX_DATA_POINTS) {
            return newData.slice(newData.length - MAX_DATA_POINTS);
          }
          return newData;
        });
      }
    );
    const gyroSub = sensorEventEmitter.addListener(
      "GYRO_DATA",
      (dataString: string) => {
        const parsed = parseGyroscopeData(dataString);
        if (connectedDevice?.id) {
          addCombinedSample(connectedDevice.id, "gyro", parsed);
        }
        setGyroDataPoints((prev) => {
          const buf = [...prev, parsed];
          return buf.length > MAX_DATA_POINTS
            ? buf.slice(buf.length - MAX_DATA_POINTS)
            : buf;
        });
      }
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
        await createSensor({
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

  const MERGE_WINDOW_MS = 20;
  const FLUSH_TIMEOUT_MS = 200;

  type PartialSample = {
    timestamp: string;
    acceleration?: number[];
    gyroscope?: number[];
  };

  const pendingSamples: Record<string, Record<number, PartialSample>> = {};
  const addCombinedSample = (
    mac: string,
    kind: "accel" | "gyro",
    dp: { x: number; y: number; z: number; timestamp: number }
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
        label: labelRef.current,
        watch_on_hand: handRef.current,
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
            label: labelRef.current,
            watch_on_hand: handRef.current,
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
    dataPoints,
    gyroDataPoints,
  };
};
