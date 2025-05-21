import { Device } from "react-native-ble-plx";

export type DataPoint = {
  x: number;
  y: number;
  z: number;
  timestamp: number;
};

export type PartialSample = {
  timestamp: string;
  acceleration?: number[];
  gyroscope?: number[];
};

export type UseMetaWearResult = {
  connectedDevice: Device | null;
  connectToDevice: (device: Device) => Promise<void>;
  disconnectDevice: (deviceId: string) => Promise<void>;
  accelerometerData: DataPoint[];
  gyroscopeData: DataPoint[];
};
