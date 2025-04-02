import Foundation
import MetaWear
import MetaWearCpp
import React

/**
 * A React Native module that manages MetaWear devices on iOS.
 * - Scans for and connects to a MetaWear device via its UUID (iOS does not allow MAC).
 * - Streams accelerometer data and sends it back to JS via the "SENSOR_DATA" event.
 * - Supports disconnecting and cleans up when the RN bridge invalidates.
 */
@objc(MetaWearModule)
class MetaWearModule: RCTEventEmitter {

  // MARK: - Internal Properties

  /// Reference to the currently connected MetaWear device, if any.
  private var device: MetaWear?

  /// Flag indicating whether a scan is in progress.
  private var isScanning: Bool = false

  // MARK: - React Native Module Setup

  /**
   * The JS name for this module in NativeModules.
   * E.g., `NativeModules.MetaWearModule`.
   */
  @objc override static func moduleName() -> String! {
    return "MetaWearModule"
  }

  /**
   * Indicates that we do NOT need to run on the main thread at initialization.
   */
  @objc override static func requiresMainQueueSetup() -> Bool {
    return false
  }

  /**
   * The set of event names this module can emit to JS.
   */
  override func supportedEvents() -> [String]! {
    return ["SENSOR_DATA"]
  }

  // MARK: - Static Accelerometer Callback

  /**
   * A C-compatible function pointer (via `@convention(c)`) for receiving
   * accelerometer readings. We pass `self` as an opaque pointer (`context`)
   * and recover it inside to call `sendEvent`.
   */
  private static let accelerometerCallback: @convention(c) (
    UnsafeMutableRawPointer?,
    UnsafePointer<MblMwData>?
  ) -> Void = { context, dataPtr in
    // 1. Safely unwrap the context and data.
    guard
      let context = context,
      let dataPtr = dataPtr
    else {
      return
    }

    // 2. Convert the context pointer back to 'MetaWearModule'.
    let moduleSelf = Unmanaged<MetaWearModule>.fromOpaque(context).takeUnretainedValue()

    // 3. Parse the data as MblMwCartesianFloat.
    let accel: MblMwCartesianFloat = dataPtr.pointee.valueAs()

    // 4. Format the data and send it as an event to JS.
    let dataStr = String(
      format: "x: %.3f, y: %.3f, z: %.3f",
      accel.x,
      accel.y,
      accel.z
    )
    moduleSelf.sendEvent(withName: "SENSOR_DATA", body: dataStr)
  }

  // MARK: - RN-Exposed Methods

  /**
   * Connect to a device by UUID. Since iOS doesn't allow connecting by MAC address,
   * we assume `device.id` from JS is the CBPeripheral UUID string.
   *
   * - parameter identifier: The string UUID to connect to.
   * - parameter resolve: JS promise resolve callback.
   * - parameter reject: JS promise reject callback.
   */
  @objc(connectToDevice:resolver:rejecter:)
  func connectToDevice(
    identifier: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    // Validate the UUID string.
    guard let uuid = UUID(uuidString: identifier) else {
      reject("INVALID_ID", "Invalid device identifier (expected UUID)", nil)
      return
    }

    // Always scan for the device, since the 4.x SDK no longer retrieves saved devices.
    isScanning = true
    MetaWearScanner.shared.startScan(allowDuplicates: false) { [weak self] found in
      guard let self = self else { return }
      if !self.isScanning { return }

      // If the found device's peripheral matches our target UUID, connect.
      if found.peripheral.identifier == uuid {
        self.isScanning = false
        MetaWearScanner.shared.stopScan()
        self.device = found

        Task {
          do {
            try await found.connectAndSetup()
            self.startAccelerometerStreaming()
            resolve("Connected to device: \(identifier)")
          } catch {
            reject("CONN_ERROR", "Connect failed: \(error.localizedDescription)", nil)
          }
        }
      }
    }
  }

  /**
   * Disconnect from the currently connected device.
   *
   * - parameter identifier: The UUID we expect is connected.
   * - parameter resolve: JS promise resolve callback.
   * - parameter reject: JS promise reject callback.
   */
  @objc(disconnectFromDevice:resolver:rejecter:)
  func disconnectFromDevice(
    identifier: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    // Ensure we have a connected device and it matches the requested identifier.
    guard
      let dev = device,
      dev.peripheral.identifier.uuidString == identifier
    else {
      reject("INVALID_ID", "No connected device matches \(identifier)", nil)
      return
    }

    // 4.x: cancelConnection() is synchronous with no return type (i.e., no error).
    dev.cancelConnection()
    resolve("Disconnected from device: \(identifier)")
  }

  // MARK: - Internal Accelerometer Logic

  /**
   * Subscribes to the board's accelerometer data and configures it.
   * Data is sent to JS via the static `accelerometerCallback`.
   */
  private func startAccelerometerStreaming() {
      guard let dev = device else {
          return
      }

      // 1) Check that the board actually reports an accelerometer module:
      let accType = mbl_mw_metawearboard_lookup_module(dev.board, MBL_MW_MODULE_ACCELEROMETER)
      guard accType != MBL_MW_MODULE_TYPE_NA else {
          // No accelerometer on this board. Don’t crash by calling get_acceleration_data_signal().
          NSLog("No accelerometer module on this board!")
          return
      }

      // 2) Now safely fetch the accelerometer signal:
      if let signal = mbl_mw_acc_get_acceleration_data_signal(dev.board) {
          // Convert self -> raw pointer
          let contextPtr = UnsafeMutableRawPointer(Unmanaged.passUnretained(self).toOpaque())
          mbl_mw_datasignal_subscribe(signal, contextPtr, MetaWearModule.accelerometerCallback)

          // 3) Configure
          mbl_mw_acc_set_odr(dev.board, 50.0)   // e.g. 50 Hz
          mbl_mw_acc_set_range(dev.board, 4.0)  // ±4g
          mbl_mw_acc_write_acceleration_config(dev.board)

          // 4) Start sampling
          mbl_mw_acc_enable_acceleration_sampling(dev.board)
          mbl_mw_acc_start(dev.board)
      }
  }


  // MARK: - RCTEventEmitter Housekeeping

  /// Called when JS adds a listener for an event (required override).
  override func addListener(_ eventName: String) {
    // No-op; base class handles counts.
  }

  /// Called when JS removes listeners (required override).
  override func removeListeners(_ count: Double) {
    // No-op; base class handles counts.
  }

  /**
   * Called when the RN bridge invalidates (e.g., app reload).
   * Stop scanning if in progress, and disconnect the board if connected.
   */
  override func invalidate() {
    if isScanning {
      MetaWearScanner.shared.stopScan()
      isScanning = false
    }
    if let dev = device {
      dev.cancelConnection() // no return
      device = nil
    }
  }
}
