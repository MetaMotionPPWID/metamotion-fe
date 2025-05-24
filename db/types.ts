export type SampleRow = {
  id: number;
  mac: string;
  timestamp: string;
  label: string;
  watch_on_hand: string;
  accelX: number;
  accelY: number;
  accelZ: number;
  gyroX: number;
  gyroY: number;
  gyroZ: number;
};

export type PredictionRow = {
  id: number;
  timestamp: number;
  label: string;
};

export type DataSample = {
  x: number;
  y: number;
  z: number;
};
