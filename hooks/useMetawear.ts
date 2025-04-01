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
  const [devices, setDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [dataPoints, setDataPoints] = useState<Array<{ x: number; y: number; z: number; timestamp: number }>>([]);
  const [sensorData, setSensorData] = useState<string[]>([]);
  const [isMonitoring, setIsMonitoring] = useState<boolean>(false);

  useEffect(() => {
    const sensorSubscription = sensorEventEmitter.addListener('SENSOR_DATA', (dataString: string) => {
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
      sensorSubscription.remove();
    };
  }, []);

  useEffect(() => {
    const connectionHandler = sensorEventEmitter.addListener('CONNECTION_EVENT', (event) => {
      if (event.connected) {
        console.log("Device connected:", event.deviceId);
      } else {
        console.log("Device disconnected:", event.deviceId);
        setConnectedDevice(null);
      }
    });

    const gracefulDisconnectHandler = sensorEventEmitter.addListener('GRACEFUL_DISCONNECT', (event) => {
      console.log("Gracefully disconnected from device:", event.deviceId);
      setConnectedDevice(null);
    });

    const serviceDiscoveryHandler = sensorEventEmitter.addListener('SERVICE_DISCOVERED', (event) => {
      console.log("Services discovered for device:", event.deviceId, event.services);
      // ...
    });

    const notificationHandler = sensorEventEmitter.addListener('NOTIFICATION', (event) => {
      console.log("Notification received:", event);
      // ...
    });

    const readRequestHandler = sensorEventEmitter.addListener('READ_REQUEST', (event) => {
      console.log("Read request data:", event);
      // ...
    });

    const writeRequestHandler = sensorEventEmitter.addListener('WRITE_REQUEST', (event) => {
      console.log("Write request data:", event);
      // ...
    });

    const errorHandler = sensorEventEmitter.addListener('ERROR_EVENT', (error) => {
      console.error("Error event:", error);
      // ...
    });

    const timeoutHandler = sensorEventEmitter.addListener('TIMEOUT_EVENT', (timeoutData) => {
      console.error("Timeout event:", timeoutData);
      // ...
    });

    return () => {
      connectionHandler.remove();
      gracefulDisconnectHandler.remove();
      serviceDiscoveryHandler.remove();
      notificationHandler.remove();
      readRequestHandler.remove();
      writeRequestHandler.remove();
      errorHandler.remove();
      timeoutHandler.remove();
    };
  }, []);

  const startAccelerometer = () => {
    MetaWearModule.startAccelerometer();
    setIsMonitoring(true);
  };

  const connectToDevice = async (device: Device): Promise<void> => {
    if (device.id) {
      try {
        console.log("Connecting to device...");
        setIsConnecting(true);
        await MetaWearModule.connectToDevice(device.id);
        console.log("Connected to device");
        setConnectedDevice(device);
        await discoverServices();
      } catch (error) {
        console.error("Connection error:", error);
      } finally {
        setIsConnecting(false);
      }
    }
  };

  const disconnectDevice = async (deviceId: string): Promise<void> => {
    if (deviceId) {
      try {
        console.log("Disconnecting from device...");
        await MetaWearModule.disconnectFromDevice(deviceId);
        console.log("Disconnected from device");
        setConnectedDevice(null);
      } catch (error) {
        console.error("Disconnection error:", error);
      }
    }
  };

  const discoverServices = async (): Promise<void> => {
    if (connectedDevice?.id) {
      try {
        console.log("Discovering services for device:", connectedDevice.id);
        await MetaWearModule.discoverServices(connectedDevice.id);
        console.log("Service discovery initiated");
      } catch (error) {
        console.error("Service discovery error:", error);
      }
    }
  };

  const readCharacteristic = async (serviceUUID: string, characteristicUUID: string): Promise<string | void> => {
    if (connectedDevice?.id) {
      try {
        console.log(`Reading characteristic ${characteristicUUID} from service ${serviceUUID}`);
        const result = await MetaWearModule.readCharacteristic(connectedDevice.id, serviceUUID, characteristicUUID);
        console.log("Read result:", result);
        return result;
      } catch (error) {
        console.error("Read error:", error);
      }
    }
  };

  const writeCharacteristic = async (serviceUUID: string, characteristicUUID: string, value: string): Promise<void> => {
    if (connectedDevice?.id) {
      try {
        console.log(`Writing value to characteristic ${characteristicUUID} on service ${serviceUUID}`);
        await MetaWearModule.writeCharacteristic(connectedDevice.id, serviceUUID, characteristicUUID, value);
        console.log("Write successful");
      } catch (error) {
        console.error("Write error:", error);
      }
    }
  };

  return {
    devices,
    
    connectedDevice,
    isConnecting,
    connectToDevice,
    disconnectDevice,
    sensorData,
    dataPoints,
    isMonitoring,
    discoverServices,
    readCharacteristic,
    writeCharacteristic,
  };
};