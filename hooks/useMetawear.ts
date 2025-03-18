import { useEffect, useState, useRef, useCallback } from 'react';
import { NativeModules, NativeEventEmitter } from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx';

const { MetaWearModule } = NativeModules;
const sensorEventEmitter = new NativeEventEmitter(MetaWearModule);


const parseAccData = (dataString: string) => {
  try {
    // Match patterns like "x: -0.060791016, y: 6.1035156E-4, z: -0.98516846"
    const xMatch = dataString.match(/x:\s*([-\d.E-]+)/);
    const yMatch = dataString.match(/y:\s*([-\d.E-]+)/);
    const zMatch = dataString.match(/z:\s*([-\d.E-]+)/);
    
    return {
      x: xMatch ? parseFloat(xMatch[1]) : 0,
      y: yMatch ? parseFloat(yMatch[1]) : 0,
      z: zMatch ? parseFloat(zMatch[1]) : 0,
      timestamp: Date.now() // Add timestamp for time-series data
    };
  } catch (error) {
    console.error('Error parsing accelerometer data:', error);
    return { x: 0, y: 0, z: 0, timestamp: Date.now() };
  }
};

export interface UseMetaWearResult {
  // BLE scanning
  devices: Device[];

  // MetaWear connection
  connectedDevice: Device | null;
  isConnecting: boolean;
  disconnectDevice: (deviceId: string) => Promise<void>;
  connectToDevice: (device: Device) => Promise<void>; 
  
  // Accelerometer
  sensorData: string[];
  dataPoints: Array<{x: number, y: number, z: number, timestamp: number}>;
  isMonitoring: boolean;

}
const MAX_DATA_POINTS = 50;

export const useMetawear = (): UseMetaWearResult => {
  // BLE scanning state
  const [devices, setDevices] = useState<Device[]>([]);
  
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [dataPoints, setDataPoints] = useState<Array<{x: number, y: number, z: number, timestamp: number}>>([]);
  
  const [sensorData, setSensorData] = useState<string[]>([]);
  const [isMonitoring, setIsMonitoring] = useState<boolean>(false);
  
 useEffect(() => {
  const subscription = sensorEventEmitter.addListener('SENSOR_DATA', (dataString: string) => {
    const parsedData = parseAccData(dataString);
    
    setDataPoints(prevData => {
      const newData = [...prevData, parsedData];
      if (newData.length > MAX_DATA_POINTS) {
        return newData.slice(newData.length - MAX_DATA_POINTS);
      }
      return newData;
    });
  });

  return () => {
    subscription.remove();
  };
}, []);

  const startAccelerator = () => {
    MetaWearModule.startAccelerometer();
  }

  const connectToDevice = async (device: Device): Promise<void> => {
    if(device.id){
      try {
        console.log("Connecting to device...");
        await MetaWearModule.connectToDevice(device.id);
        console.log("Connected to device");
        setConnectedDevice(device);
        console.log(device)
        
      } catch (error) {
        console.error("Connection error:", error);
      }
    }

  };
  const disconnectDevice = async (deviceId: string): Promise<void> => {
    if(deviceId){
      try {
        console.log("Disconnecting to device...");
        await MetaWearModule.disconnectFromDevice(deviceId);
        console.log("Disconnected from device");
        setConnectedDevice(null);
        console.log(deviceId)
        
      } catch (error) {
        console.error("Connection error:", error);
      }
    }

  };

  return {
    devices,
    
    connectedDevice,
    isConnecting,
    connectToDevice,
    disconnectDevice,
    dataPoints,
    sensorData,
    isMonitoring,
  };
};