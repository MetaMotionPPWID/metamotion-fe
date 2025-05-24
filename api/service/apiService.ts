import { api } from "../apiInstance";
import type { PostSamplesRequest } from "./types";

export const postSamples = async (
  request: PostSamplesRequest,
): Promise<void> => {
  await api.post(`/sensors`, {
    request,
  });
};

// export const postSensor = async (sensor: Sensor) => {
//   const { data } = await api.post("/sensors/", sensor);
//   return data;
// };
//
// export const getSensors = async (): Promise<Sensor[]> => {
//   const { data } = await api.get<{ sensors: Sensor[] }>("/sensors/");
//   return data.sensors;
// };
//
// export const getSamples = async (mac: string): Promise<Sample[]> => {
//   const { data } = await api.get<{ samples: Sample[] }>(
//     `/sensors/${encodeURIComponent(mac)}/samples`,
//   );
//   return data.samples;
// };
//
// export const getPredictions = async (
//   mac: string,
//   startTime: string,
//   endTime: string,
// ): Promise<Prediction[]> => {
//   const { data } = await api.post<{ predictions: Prediction[] }>(
//     `/sensors/${encodeURIComponent(mac)}/samples/prediction`,
//     {
//       start_time: startTime,
//       end_time: endTime,
//     },
//   );
//   return data.predictions;
// };
