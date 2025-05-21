import { DataPoint } from "@/hooks/utils/types";

export const parseAcceleratorData = (dataString: string) => {
  try {
    // Match patterns like "x: -0.060791016, y: 6.1035156E-4, z: -0.98516846"
    const xMatch = dataString.match(/x:\s*([-\d.E-]+)/);
    const yMatch = dataString.match(/y:\s*([-\d.E-]+)/);
    const zMatch = dataString.match(/z:\s*([-\d.E-]+)/);

    return {
      x: xMatch ? parseFloat(xMatch[1]) : 0,
      y: yMatch ? parseFloat(yMatch[1]) : 0,
      z: zMatch ? parseFloat(zMatch[1]) : 0,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error("Error parsing accelerometer data:", error);
    return { x: 0, y: 0, z: 0, timestamp: Date.now() };
  }
};

export const parseGyroscopeData = (dataString: string): DataPoint => {
  try {
    const xMatch = dataString.match(/x:\s*([-\d.E-]+)/);
    const yMatch = dataString.match(/y:\s*([-\d.E-]+)/);
    const zMatch = dataString.match(/z:\s*([-\d.E-]+)/);
    return {
      x: xMatch ? parseFloat(xMatch[1]) : 0,
      y: yMatch ? parseFloat(yMatch[1]) : 0,
      z: zMatch ? parseFloat(zMatch[1]) : 0,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error("Error parsing gyroscope data:", error);
    return { x: 0, y: 0, z: 0, timestamp: Date.now() };
  }
};
