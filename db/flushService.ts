import { AppState } from "react-native";

// Ensure DB is initialized
import "./init";
import { deleteUpTo, fetchUpTo, getCurrentMaxId } from "./samplesService";
import { SampleRow } from "./types";
import { mapToFlushRequest } from "./utils";

import { postSamples } from "@/api/service";
import { storePredictions } from "@/db/predictionsService";

const FLUSH_INTERVAL_MS = 30 * 1000;
const MAX_FAILED = 5;

let failedIds: number[] = [];

const updateFailedIds = async (id?: number) => {
  const currentLargestId = id ?? (await getCurrentMaxId());

  if (!currentLargestId) {
    console.warn(`[${new Date().toISOString()}] No samples found.`);
    return;
  }

  failedIds.push(currentLargestId);
  if (failedIds.length > MAX_FAILED) {
    const drop = failedIds.shift()!;
    console.info(
      `[${new Date().toISOString()}] Removing outdated batch. Pivot position: ${drop}.`,
    );
    deleteUpTo(drop);
  }
};

const flushSamples = async (): Promise<void> => {
  console.info(`[${new Date().toISOString()}] Flush started.`);

  // Retry failed pivots.
  if (failedIds.length > 0) {
    const pivot = failedIds[0];
    const batch: SampleRow[] = await fetchUpTo(pivot);

    try {
      const req = mapToFlushRequest(batch[0].mac, "MetaWear", batch);
      const predictions = await postSamples(req);
      storePredictions(predictions.results);

      console.info(
        `[${new Date().toISOString()}] Flush completed. Pivot position: ${pivot}. Predictions: ${predictions.results.length}.`,
      );

      deleteUpTo(pivot);
      failedIds.shift();
    } catch (err) {
      console.warn(
        `[${new Date().toISOString()}] Flush failed. Pivot position: ${pivot}. ${err}`,
      );

      // If retry fails, then assume network connection is down and skip main flush.
      await updateFailedIds();
      return;
    }
  }

  const currentLargestId = await getCurrentMaxId();

  if (!currentLargestId) {
    console.warn(`[${new Date().toISOString()}] No samples found.`);
    return;
  }

  // Fetch all samples.
  const newSamplesBatch = await new Promise<SampleRow[]>((resolve) => {
    fetchUpTo(currentLargestId).then((rows) =>
      resolve(rows.length ? rows : []),
    );
  });

  if (!newSamplesBatch.length) {
    console.warn(`[${new Date().toISOString()}] No samples found.`);
    return;
  }

  // Try to flush samples.
  try {
    const req = mapToFlushRequest(
      newSamplesBatch[0].mac,
      "MetaWear",
      newSamplesBatch,
    );
    const predictions = await postSamples(req);
    storePredictions(predictions.results);

    console.info(
      `[${new Date().toISOString()}] Flush completed. Predictions: ${predictions.results.length}.`,
    );

    deleteUpTo(currentLargestId);
    console.info(
      `[${new Date().toISOString()}] Flush completed. Pivot position: ${currentLargestId}.`,
    );
  } catch (err) {
    console.warn(
      `[${new Date().toISOString()}] Flush failed. Pivot position: ${currentLargestId}. ${err}`,
    );
    await updateFailedIds(currentLargestId);
  }
};

// Schedule periodic flush
setInterval(() => flushSamples(), FLUSH_INTERVAL_MS);

// Clear on app background/close
AppState.addEventListener("change", (state) => {
  if (state === "inactive" || state === "background") {
    console.info(`[${new Date().toISOString()}] Cleaning up samples.`);
    deleteUpTo(Number.MAX_SAFE_INTEGER);
    failedIds = [];
  }
});
