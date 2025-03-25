//
//  MetaWearModule.swift
//  metamotionfe
//
//  Created by Julia Gościniak on 24/03/2025.
//

import Foundation
import React
import CoreBluetooth

@objc(MetaWearModule)
class MetaWearModule: NSObject, RCTBridgeModule, CBCentralManagerDelegate {

    private var centralManager: CBCentralManager!
    private var resolveBlock: RCTPromiseResolveBlock?
    private var rejectBlock: RCTPromiseRejectBlock?
    private var discoveredPeripherals: [CBPeripheral] = []

    @objc static func requiresMainQueueSetup() -> Bool {
        return true
    }

    static func moduleName() -> String! {
        return "MetaWearModule"
    }

    override init() {
        super.init()
        centralManager = CBCentralManager(delegate: self, queue: nil)
    }

    @objc func startScan(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        resolveBlock = resolve
        rejectBlock = reject
        discoveredPeripherals = [] // Reset list of discovered peripherals

        if centralManager.state == .poweredOn {
            centralManager.scanForPeripherals(withServices: nil, options: nil)
            // Stop scanning after 5 seconds (adjust as needed)
            DispatchQueue.main.asyncAfter(deadline: .now() + 5.0) {
                self.stopScan()
            }
        } else {
            reject("BLUETOOTH_ERROR", "Bluetooth is not enabled", nil)
        }
    }

    @objc func stopScan() {
        centralManager.stopScan()
        // Prepare the array of devices to return
        var devices: [[String: String]] = []
        for peripheral in discoveredPeripherals {
            devices.append(["id": peripheral.identifier.uuidString, "name": peripheral.name ?? "Unnamed Device"])
        }

        resolveBlock?(devices)
        resolveBlock = nil
        rejectBlock = nil
    }

    // CBCentralManagerDelegate Methods
    func centralManagerDidUpdateState(_ central: CBCentralManager) {
        if central.state == .poweredOn {
            print("Bluetooth is powered on")
        } else {
            print("Bluetooth is not powered on")
            rejectBlock?("BLUETOOTH_ERROR", "Bluetooth is not enabled", nil)
            resolveBlock = nil
            rejectBlock = nil
        }
    }

    func centralManager(_ central: CBCentralManager, didDiscover peripheral: CBPeripheral, advertisementData: [String : Any], rssi RSSI: NSNumber) {
        print("Discovered \(peripheral.name ?? "Unknown Device") at \(RSSI)")
        if !discoveredPeripherals.contains(peripheral) {
            discoveredPeripherals.append(peripheral)
        }
    }

    deinit {
        centralManager.delegate = nil // Avoid crashes when deallocating
    }
}
