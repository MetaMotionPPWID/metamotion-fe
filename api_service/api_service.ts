import axios from "axios";
import { baseApiUrl } from "@/api_service/api_base";

export interface Sample {
  timestamp: string;
  label: string;
  watch_on_hand: "left" | "right";
  acceleration: number[];
  gyroscope: number[];
}

export interface Sensor {
  mac: string;
  name: string;
  samples: Sample[];
}

interface Batch {
  mac: string;
  samples: Sample[];
}

const FLUSH_INTERVAL_MS = 1 * 60 * 1000; // 1 minute
const RETRY_QUEUE_LIMIT = 4;
let accessToken: string | null = null;
const sampleBuffer: Record<string, Sample[]> = {};
const retryQueue: Batch[] = [];
let isFlushing = false;

const api = axios.create({
  baseURL: baseApiUrl,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10_000,
});

export const setAuthToken = (token: string | null) => {
  accessToken = token;
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
};

export const createSensor = async (payload: Sensor) => {
  const { data } = await api.post("/sensors/", payload);
  return data;
};

export const postSamples = async (mac: string, samples: Sample[]) => {
  const { data } = await api.post(
    `/sensors/${encodeURIComponent(mac)}/samples`,
    {
      samples,
    }
  );
  return data;
};

export const addSampleToBuffer = (mac: string, sample: Sample) => {
  if (!sampleBuffer[mac]) {
    sampleBuffer[mac] = [];
  }
  sampleBuffer[mac].push(sample);
};

export const flushBatches = async () => {
  console.log(
    `[api_service] flushBatches triggered at ${new Date().toISOString()}`
  );
  if (isFlushing) {
    return;
  }
  isFlushing = true;
  try {
    while (retryQueue.length) {
      const batch = retryQueue.shift()!;
      await sendBatch(batch);
    }

    for (const mac of Object.keys(sampleBuffer)) {
      const samples = sampleBuffer[mac];
      if (!samples?.length) continue;
      const batch: Batch = { mac, samples: [...samples] };
      sampleBuffer[mac] = [];
      await sendBatch(batch);
    }
  } finally {
    console.log("[api_service] flushBatches: Finished flush.");
    isFlushing = false;
  }
};

const enqueueForRetry = (batch: Batch) => {
  if (retryQueue.length >= RETRY_QUEUE_LIMIT) {
    retryQueue.shift();
  }
  retryQueue.push(batch);
};

const sendBatch = async (batch: Batch) => {
  try {
    await postSamples(batch.mac, batch.samples);
  } catch (error) {
    console.log("Batch send failed, added to retry queue", error);
    enqueueForRetry(batch);
  }
};

export const fetchData = async (): Promise<Sensor[]> => {
  const { data } = await api.get<{ sensors: Sensor[] }>("/sensors/");
  return data.sensors;
};

export const getSamples = async (mac: string): Promise<Sample[]> => {
  const { data } = await api.get<{ samples: Sample[] }>(`/sensors/${encodeURIComponent(mac)}/samples`);
  return data.samples;
};

export interface Prediction {
  timestamp: string;
  predicted_activity: string;
}

export const getPredictions = async (
  mac: string,
  startTime: string,
  endTime: string
): Promise<Prediction[]> => {
  const { data } = await api.post<{ predictions: Prediction[] }>(
    `/sensors/${encodeURIComponent(mac)}/samples/prediction`,
    {
      start_time: startTime,
      end_time: endTime,
    }
  );
  return data.predictions;
};

flushBatches().catch(console.error);

setInterval(() => {
  console.log(`[api_service] scheduled flush at ${new Date().toISOString()}`);
  flushBatches().catch(console.error);
}, FLUSH_INTERVAL_MS);
