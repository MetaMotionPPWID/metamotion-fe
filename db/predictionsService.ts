import { db } from "./init";

import type { Prediction } from "@/api/service";

export const fetchAllPredictions = async (): Promise<Prediction[]> =>
  new Promise((resolve) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          `SELECT timestamp, labels FROM predictions ORDER BY id`,
          [],
          (_, { rows }) => {
            const result: Prediction[] = [];
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
      for (const { timestamp, labels } of predictions) {
        void tx.executeSql(
          `INSERT INTO predictions (timestamp, labels) VALUES (?, ?)`,
          [timestamp, labels[0]],
        );
      }
    },
    (err) =>
      console.error(
        `[${new Date().toISOString()}] Failed to insert multiple predictions into database. ${err}`,
      ),
  );
};
