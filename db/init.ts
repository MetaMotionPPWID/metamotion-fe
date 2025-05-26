import SQLite from "react-native-sqlite-storage";

export const db = SQLite.openDatabase(
  { name: "samples.sqlite", location: "default" },
  () =>
    console.info(`[${new Date().toISOString()}] First connection to DB ready.`),
  (err) =>
    console.error(
      `[${new Date().toISOString()}] Failed to establish first DB connection. ${err}`,
    ),
);
void db.executeSql("PRAGMA journal_mode = WAL;");

export const dbInsert = SQLite.openDatabase(
  {
    name: "samples.sqlite",
    location: "default",
  },
  () =>
    console.info(
      `[${new Date().toISOString()}] Second connection to DB ready.`,
    ),
  (err) =>
    console.error(
      `[${new Date().toISOString()}] Failed to establish second DB connection. ${err}`,
    ),
);
void dbInsert.executeSql("PRAGMA journal_mode = WAL;");

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

db.transaction(
  (tx) => {
    void tx.executeSql(
      `CREATE TABLE IF NOT EXISTS predictions (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         timestamp INTEGER,
         label TEXT
       )`,
    );
  },
  (err) =>
    console.error(
      `[${new Date().toISOString()}] Failed to initialize Predictions database. ${err}`,
    ),
  () =>
    console.info(
      `[${new Date().toISOString()}] Predictions database initialized.`,
    ),
);
