export type Sample = {
  timestamp: string;
  label: string;
  watch_on_hand: string;
  acceleration: number[];
  gyroscope: number[];
};

export type PostSamplesRequest = {
  mac: string;
  name: string;
  samples: Sample[];
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

export type SensorWithPredictions = Sensor & {
  predictions: Prediction[];
};
