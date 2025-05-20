export type Sample = {
  timestamp: string;
  label: string;
  watch_on_hand: "left" | "right";
  acceleration: number[];
  gyroscope: number[];
};

export type Sensor = {
  mac: string;
  name: string;
  samples: Sample[];
};

export type Batch = {
  mac: string;
  samples: Sample[];
};

export type Prediction = {
  timestamp: string;
  predicted_activity: string;
};
