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

export type Prediction = {
  timestamp: string;
  label: string[];
};

export type PostSamplesResponse = {
  results: Prediction[];
};
