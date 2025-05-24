import { db } from "./init";
import { SampleRow } from "./types";

import type { Sample } from "@/api/service";

export const fetchUpTo = (id: number): Promise<SampleRow[]> =>
  new Promise((resolve) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          `SELECT *
         FROM samples
         WHERE id <= ?
         ORDER BY id`,
          [id],
          (_, { rows }) => {
            const result: SampleRow[] = [];
            for (let i = 0; i < rows.length; i++) {
              result.push(rows.item(i));
            }
            resolve(result);
          },
        );
      },
      (err) =>
        console.error(
          `[${new Date().toISOString()}] Failed to fetch samples from database. Pivot position: ${id}. ${err}`,
        ),
    );
  });

export const deleteUpTo = (id: number): void => {
  db.transaction(
    (tx) => tx.executeSql(`DELETE FROM samples WHERE id <= ?`, [id]),
    (err) =>
      console.error(
        `[${new Date().toISOString()}] Failed to delete samples from database. Pivot position: ${id}. ${err}`,
      ),
  );
};

export const storeSample = (mac: string, sample: Sample): void => {
  const [ax, ay, az] = sample.acceleration;
  const [gx, gy, gz] = sample.gyroscope;

  db.transaction(
    (tx) => {
      void tx.executeSql(
        `INSERT INTO samples
         (mac, timestamp, label, watch_on_hand, accelX, accelY, accelZ, gyroX, gyroY, gyroZ)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          mac,
          sample.timestamp,
          sample.label,
          sample.watch_on_hand,
          ax,
          ay,
          az,
          gx,
          gy,
          gz,
        ],
      );
    },
    (err) =>
      console.error(
        `[${new Date().toISOString()}] Failed to insert sample into database. ${err}`,
      ),
  );
};

export const getCurrentMaxId = (): Promise<number | null> =>
  new Promise((resolve) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          `SELECT id FROM samples ORDER BY id DESC LIMIT 1`,
          [],
          (_, { rows }) => resolve(rows.length ? rows.item(0).id : null),
        );
      },
      (err) =>
        console.error(
          `[${new Date().toISOString()}] Failed to retrieve current largest sample ID. ${err}`,
        ),
    );
  });
