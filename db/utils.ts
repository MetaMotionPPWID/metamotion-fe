import { SampleRow } from "./types";

import type { PostSamplesRequest } from "@/api/service";

export const mapToFlushRequest = (
  mac: string,
  name: string,
  rows: SampleRow[],
): PostSamplesRequest => ({
  mac,
  name,
  samples: rows.map((r) => ({
    timestamp: new Date(Math.round(r.timestamp) * 1000).toISOString(),
    label: r.label,
    watch_on_hand: r.watch_on_hand,
    acceleration: [r.accelX, r.accelY, r.accelZ],
    gyroscope: [r.gyroX, r.gyroY, r.gyroZ],
  })),
});
