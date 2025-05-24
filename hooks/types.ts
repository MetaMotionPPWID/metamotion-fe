import { Device } from "react-native-ble-plx";

export type SensorDataStream = {
  timestamp: string;
  accelerometer: number[];
  gyroscope: number[];
};

export type UseMetaWearResult = {
  connectedDevice: Device | null;
  connectToDevice: (device: Device) => Promise<void>;
  disconnectDevice: (deviceId: string) => Promise<void>;
};
