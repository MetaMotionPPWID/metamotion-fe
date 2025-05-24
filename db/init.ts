import SQLite from "react-native-sqlite-storage";

export const db = SQLite.openDatabase(
  { name: "samples.sqlite", location: "default" },
  () => console.info(`[${new Date().toISOString()}] Samples database created.`),
  (err) =>
    console.error(
      `[${new Date().toISOString()}] Failed to create Samples database. ${err}`,
    ),
);

db.transaction(
  (tx) => {
    void tx.executeSql(
      `CREATE TABLE IF NOT EXISTS samples (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         mac TEXT,
         timestamp INTEGER,
         label TEXT,
         watch_on_hand TEXT,
         accelX REAL, accelY REAL, accelZ REAL,
         gyroX REAL, gyroY REAL, gyroZ REAL
       )`,
    );
  },
  (err) =>
    console.error(
      `[${new Date().toISOString()}] Failed to initialize Samples database. ${err}`,
    ),
  () =>
    console.info(`[${new Date().toISOString()}] Samples database initialized.`),
);
