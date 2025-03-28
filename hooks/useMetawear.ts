import { useEffect, useState } from "react";
import { NativeModules, NativeEventEmitter } from "react-native";
import { Device } from "react-native-ble-plx";

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

type DataPoint = {
  x: number;
  y: number;
  z: number;
  timestamp: number;
};

type UseMetaWearResult = {
  connectedDevice: Device | null;
  connectToDevice: (device: Device) => Promise<void>;
  disconnectDevice: (deviceId: string) => Promise<void>;
  dataPoints: DataPoint[];
};

const MAX_DATA_POINTS = 50;

export const useMetawear = (): UseMetaWearResult => {
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);

  useEffect(() => {
    const subscription = sensorEventEmitter.addListener(
      "SENSOR_DATA",
      (dataString: string) => {
        const parsedData = parseAcceleratorData(dataString);

        setDataPoints((prevData) => {
          const newData = [...prevData, parsedData];
          if (newData.length > MAX_DATA_POINTS) {
            return newData.slice(newData.length - MAX_DATA_POINTS);
          }
          return newData;
        });
      },
    );

    return () => {
      subscription.remove();
    };
  }, []);

  const connectToDevice = async (device: Device): Promise<void> => {
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
        console.error("Connection error:", error);
      }
    }
  };

  return {
    connectedDevice,
    connectToDevice,
    disconnectDevice,
    dataPoints,
  };
};
