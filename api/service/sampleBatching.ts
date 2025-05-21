import { postSampleBatch } from "./apiService";
import type { Batch, Sample } from "./types";

const FLUSH_INTERVAL_MS = 60 * 1000; // 1 minute
const RETRY_QUEUE_LIMIT = 4;

const sampleBuffer: Record<string, Sample[]> = {};
const retryQueue: Batch[] = [];

let isFlushing = false;

export const addSampleToBuffer = (mac: string, sample: Sample) => {
  if (!sampleBuffer[mac]) {
    sampleBuffer[mac] = [];
  }
  sampleBuffer[mac].push(sample);
};

export const enqueueForRetry = (batch: Batch) => {
  if (retryQueue.length >= RETRY_QUEUE_LIMIT) {
    retryQueue.shift();
  }
  retryQueue.push(batch);
};

export const flushBatches = async () => {
  console.log(`Flush triggered at ${new Date().toISOString()}`);
  if (isFlushing) {
    return;
  }
  isFlushing = true;
  try {
    while (retryQueue.length) {
      const batch = retryQueue.shift()!;
      await postSampleBatch(batch);
    }

    for (const mac of Object.keys(sampleBuffer)) {
      const samples = sampleBuffer[mac];
      if (!samples?.length) {
        continue;
      }
      const batch: Batch = { mac, samples: [...samples] };
      sampleBuffer[mac] = [];
      await postSampleBatch(batch);
    }
  } finally {
    console.log("Flush completed");
    isFlushing = false;
  }
};

setInterval(() => {
  console.log(`Scheduled flush at ${new Date().toISOString()}`);
  flushBatches().catch(console.error);
}, FLUSH_INTERVAL_MS);
