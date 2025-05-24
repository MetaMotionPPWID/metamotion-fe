import Foundation
import MetaWear
import MetaWearCpp
import React

@objc(MetaWearModule)
class MetaWearModule: RCTEventEmitter {
  
  private var device: MetaWear?
  private var isScanning: Bool = false
  private var latestAccel: MblMwCartesianFloat?
  private var latestGyro:  MblMwCartesianFloat?
  
  @objc override static func moduleName() -> String! {
    return "MetaWearModule"
  }
  
  @objc override static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  override func supportedEvents() -> [String]! {
    return ["SENSOR_DATA"]
  }
  
  override func startObserving() {
    super.startObserving()
  }
  
  override func stopObserving() {
    super.stopObserving()
  }
  
  @objc override func addListener(_ eventName: String) {
    super.addListener(eventName)
  }
  
  @objc override func removeListeners(_ count: Double) {
    super.removeListeners(count)
  }
  
  /// Connects to a device by UUID.
  @objc(connectToDevice:resolver:rejecter:)
  func connectToDevice(
    identifier: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let uuid = UUID(uuidString: identifier) else {
      reject("INVALID_ID", "Invalid device identifier (expected UUID)", nil)
      return
    }
    
    isScanning = true
    MetaWearScanner.shared.startScan(allowDuplicates: false) { [weak self] found in
      guard let self = self else { return }
      if !self.isScanning { return }
      
      if found.peripheral.identifier == uuid {
        self.isScanning = false
        MetaWearScanner.shared.stopScan()
        self.device = found
        
        found.connectAndSetup().continueWith { t in
          
          // Set LED to blue pulse.
          var pattern = MblMwLedPattern()
          mbl_mw_led_load_preset_pattern(&pattern, MBL_MW_LED_PRESET_PULSE)
          mbl_mw_led_stop_and_clear(found.board)
          mbl_mw_led_write_pattern(found.board, &pattern, MBL_MW_LED_COLOR_BLUE)
          mbl_mw_led_play(found.board)
          
          self.setupAccelerometer(board: found.board)
          self.setupGyroscope(board: found.board)
        }
        
        resolve("Connected to device: \(identifier)")
      }
    }
  }
  
  private static let sensorDataHandler: @convention(c) (UnsafeMutableRawPointer?, UnsafePointer<MblMwData>?) -> Void = { (context, obj) in
    guard let context = context, let dataPointer = obj else { return }
    let instance = Unmanaged<MetaWearModule>.fromOpaque(context).takeUnretainedValue()
    let acceleration: MblMwCartesianFloat = dataPointer.pointee.valueAs()
    instance.latestAccel = acceleration
    instance.publishCombined()
  }
  
  /// Sets up accelerometer and starts streaming data.
  private func setupAccelerometer(board: OpaquePointer) {
    mbl_mw_acc_bosch_set_range(board, MBL_MW_ACC_BOSCH_RANGE_2G)
    mbl_mw_acc_set_odr(board, 25)
    mbl_mw_acc_bosch_write_acceleration_config(board)
    
    if let signal = mbl_mw_acc_bosch_get_acceleration_data_signal(board) {
      mbl_mw_datasignal_subscribe(signal,
                                  Unmanaged.passUnretained(self).toOpaque(),
                                  MetaWearModule.sensorDataHandler)
    }
    
    mbl_mw_acc_enable_acceleration_sampling(board)
    mbl_mw_acc_start(board)
  }
  
  private static let sensorGyroDataHandler: @convention(c) (UnsafeMutableRawPointer?, UnsafePointer<MblMwData>?) -> Void = { (context, obj) in
    guard let context = context, let dataPointer = obj else { return }
    let instance = Unmanaged<MetaWearModule>.fromOpaque(context).takeUnretainedValue()
    let rotation: MblMwCartesianFloat = dataPointer.pointee.valueAs()
    instance.latestGyro = rotation
    instance.publishCombined()
  }
  
  /// Sets up gyroscope and starts streaming data.
  private func setupGyroscope(board: OpaquePointer) {
    mbl_mw_gyro_bmi160_set_odr(board, MBL_MW_GYRO_BOSCH_ODR_25Hz)
    mbl_mw_gyro_bmi160_set_range(board, MBL_MW_GYRO_BOSCH_RANGE_500dps)
    mbl_mw_gyro_bmi160_write_config(board)
    
    if let signal = mbl_mw_gyro_bmi160_get_rotation_data_signal(board) {
      mbl_mw_datasignal_subscribe(signal,
                                  Unmanaged.passUnretained(self).toOpaque(),
                                  MetaWearModule.sensorGyroDataHandler
      )
    }
    mbl_mw_gyro_bmi160_enable_rotation_sampling(board)
    mbl_mw_gyro_bmi160_start(board)
  }

  /// Publishes combined accelerometer and gyroscope data.
  private func publishCombined() {
      guard let a = latestAccel, let g = latestGyro else { return }
      let payload: [String: Any] = [
          "timestamp": Date().timeIntervalSince1970,
          "accelerometer": [Double(a.x), Double(a.y), Double(a.z)],
          "gyroscope":  [Double(g.x), Double(g.y), Double(g.z)]
      ]
      DispatchQueue.main.async {
          self.sendEvent(withName: "SENSOR_DATA", body: payload)
      }
  }
  
  /// Disconnects from the connected device.
  @objc(disconnectFromDevice:resolver:rejecter:)
  func disconnectFromDevice(
    identifier: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let dev = device, dev.peripheral.identifier.uuidString == identifier else {
      reject("INVALID_ID", "No connected device matches \(identifier)", nil)
      return
    }
    
    // Set LED to static red.
    var pattern = MblMwLedPattern()
    mbl_mw_led_load_preset_pattern(&pattern, MBL_MW_LED_PRESET_SOLID)
    mbl_mw_led_stop_and_clear(dev.board)
    mbl_mw_led_write_pattern(dev.board, &pattern, MBL_MW_LED_COLOR_RED)
    mbl_mw_led_play(dev.board)
    
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5 ) {
      dev.cancelConnection()
      self.device = nil
      resolve("Disconnected from device: \(identifier)")
    }
  }
  
  override func invalidate() {
    if isScanning {
      MetaWearScanner.shared.stopScan()
      isScanning = false
    }
    
    if let dev = device {
      dev.cancelConnection()
      device = nil
    }
  }
}
