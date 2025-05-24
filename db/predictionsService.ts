import { db } from "./init";
import type { PredictionRow } from "./types";

import type { Prediction } from "@/api/service";

export const fetchAllPredictions = async (): Promise<PredictionRow[]> =>
  new Promise((resolve) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          `SELECT * FROM predictions ORDER BY id`,
          [],
          (_, { rows }) => {
            const result: PredictionRow[] = [];
            for (let i = 0; i < rows.length; i++) {
              result.push(rows.item(i));
            }
            resolve(result);
          },
        );
      },
      (err) =>
        console.error(
          `[${new Date().toISOString()}] Failed to fetch predictions from database. ${err}`,
        ),
    );
  });

export const storePredictions = (predictions: Prediction[]): void => {
  if (!predictions.length) {
    return;
  }

  db.transaction(
    (tx) => {
      for (const { timestamp, label } of predictions) {
        void tx.executeSql(
          `INSERT INTO predictions (timestamp, label) VALUES (?, ?)`,
          [timestamp, label[0]],
        );
      }
    },
    (err) =>
      console.error(
        `[${new Date().toISOString()}] Failed to insert multiple predictions into database. ${err}`,
      ),
  );
};
