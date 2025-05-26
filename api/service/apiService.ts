import { api } from "../apiInstance";
import type { PostSamplesRequest, PostSamplesResponse } from "./types";

export const postSamples = async (
  request: PostSamplesRequest,
): Promise<PostSamplesResponse> => {
  const response = await api.post(`/sensors/`, {
    request,
  });

  return response.data;
};
