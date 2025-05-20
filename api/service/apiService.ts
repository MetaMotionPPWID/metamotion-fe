import { api } from "../apiInstance";
import type { Sample, Sensor, Prediction, Batch } from "./types";
import { enqueueForRetry } from "./sampleBatching";

export const postSensor = async (sensor: Sensor) => {
  const { data } = await api.post("/sensors/", sensor);
  return data;
};

const postSamples = async (mac: string, samples: Sample[]) => {
  const { data } = await api.post(
    `/sensors/${encodeURIComponent(mac)}/samples`,
    {
      samples,
    },
  );
  return data;
};

export const postSampleBatch = async (batch: Batch) => {
  try {
    await postSamples(batch.mac, batch.samples);
  } catch (error) {
    console.log("Batch send failed, added to retry queue", error);
    enqueueForRetry(batch);
  }
};

export const getSensors = async (): Promise<Sensor[]> => {
  const { data } = await api.get<{ sensors: Sensor[] }>("/sensors/");
  return data.sensors;
};

export const getSamples = async (mac: string): Promise<Sample[]> => {
  const { data } = await api.get<{ samples: Sample[] }>(
    `/sensors/${encodeURIComponent(mac)}/samples`,
  );
  return data.samples;
};

export const getPredictions = async (
  mac: string,
  startTime: string,
  endTime: string,
): Promise<Prediction[]> => {
  const { data } = await api.post<{ predictions: Prediction[] }>(
    `/sensors/${encodeURIComponent(mac)}/samples/prediction`,
    {
      start_time: startTime,
      end_time: endTime,
    },
  );
  return data.predictions;
};
