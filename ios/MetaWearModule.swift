import Foundation
import MetaWear
import MetaWearCpp
import React  // Required to subclass RCTEventEmitter and use bridge types

@objc(MetaWearModule)
class MetaWearModule: RCTEventEmitter {
  
  private var device: MetaWear? // Currently connected MetaWear device
  private var isScanning: Bool = false

  // Expose module name to React Native (alternatively, override class var moduleName)
  @objc override static func moduleName() -> String! {
    return "MetaWearModule"
  }
  
  // Module does not require main thread initialization
  @objc override static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  // Supported event names for RCTEventEmitter
  override func supportedEvents() -> [String]! {
    return ["SENSOR_DATA"]
  }
  
  /// Connect to a MetaWear device by its identifier (UUID string on iOS).
  @objc(connectToDevice:resolver:rejecter:)
  func connectToDevice(identifier: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    // On iOS you cannot connect by MAC address directly
    // Expect a UUID string (CBPeripheral.identifier) for the device.
    guard let uuid = UUID(uuidString: identifier) else {
      reject("INVALID_ID", "Invalid device identifier (expected UUID string)", nil)
      return
    }
    // If device was previously saved, try to retrieve it
    MetaWearScanner.shared.retrieveSavedMetaWearsAsync().continueWith { task in
      if let devices = task.result, let saved = devices.first(where: { $0.peripheral.identifier == uuid }) {
        self.device = saved
        // Connect and initialize the MetaWear board
        saved.connectAndSetup().continueWith { t in
          if let error = t.error {
            reject("CONN_ERROR", "Connect failed: \(error.localizedDescription)", nil)
          } else {
            self.startAccelerometerStreaming()
            resolve("Connected to MetaWear device: \(identifier)")
          }
          return nil
        }
      } else {
        // Not saved – perform a scan to find the device by UUID
        self.isScanning = true
        MetaWearScanner.shared.startScan(allowDuplicates: false) { found in
          if !self.isScanning { return }  // ignore if already found/stopped
          if found.peripheral.identifier == uuid {
            // Stop scanning once the target device is found
            self.isScanning = false
            MetaWearScanner.shared.stopScan()
            self.device = found
            found.connectAndSetup().continueWith { t in
              if let error = t.error {
                reject("CONN_ERROR", "Connect failed: \(error.localizedDescription)", nil)
              } else {
                self.startAccelerometerStreaming()
                resolve("Connected to MetaWear device: \(identifier)")
              }
              return nil
            }
          }
        }
        // (Optional) You might implement a timeout for scanning if device is not found.
      }
      return nil
    }
  }
  
  /// Disconnect from the currently connected MetaWear device.
  @objc(disconnectFromDevice:resolver:rejecter:)
  func disconnectFromDevice(identifier: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    guard let device = self.device, device.peripheral.identifier.uuidString == identifier else {
      reject("INVALID_ID", "No connected device with identifier \(identifier)", nil)
      return
    }
    // Cancel connection (disconnect). This returns a Bolts Task we can use for async completion.
    device.cancelConnection().continueWith { t in
      if let error = t.error {
        reject("DISCONN_ERROR", "Disconnect failed: \(error.localizedDescription)", nil)
      } else {
        resolve("Disconnected from MetaWear device: \(identifier)")
      }
      return nil
    }
  }
  
  /// Internal: Set up accelerometer streaming and event emission.
  private func startAccelerometerStreaming() {
    guard let device = self.device else { return }
    // Get accelerometer data signal from the MetaWear C++ API
    if let signal = mbl_mw_acc_get_acceleration_data_signal(device.board) {
      // Subscribe to the accelerometer signal
      mbl_mw_datasignal_subscribe(signal, bridge(obj: self)) { (context, dataPtr) in
        // Parse the incoming data as acceleration
        let acceleration: MblMwCartesianFloat = dataPtr!.pointee.valueAs()
        let dataStr = String(format: "x: %.3f, y: %.3f, z: %.3f", acceleration.x, acceleration.y, acceleration.z)
        // Emit the accelerometer data to JavaScript
        self.sendEvent(withName: "SENSOR_DATA", body: dataStr)
      }
      // Configure and start the accelerometer (e.g., 50 Hz, ±4g range)
      mbl_mw_acc_set_odr(device.board, 50.0)              // 50 Hz sampling rate
      mbl_mw_acc_set_range(device.board, 4.0)             // ±4g range
      mbl_mw_acc_write_acceleration_config(device.board)  // Write config to the sensor
      mbl_mw_acc_enable_acceleration_sampling(device.board)
      mbl_mw_acc_start(device.board)
    }
  }
  
  // Required stubs for RCTEventEmitter (added to avoid warnings in React Native >0.65)
  @objc func addListener(_ eventName: String) {
    // No-op: Handled by base class
  }
  @objc func removeListeners(_ count: Double) {
    // No-op: Handled by base class
  }
  
  override func invalidate() {
    // Clean up on bridge invalidation (app shutdown or reload)
    if isScanning {
      MetaWearScanner.shared.stopScan()
      isScanning = false
    }
    if let device = self.device {
      device.cancelConnection()  // Disconnect if still connected
      self.device = nil
    }
  }
}
