package com.anonymous.metamotionfe

import android.util.Log
import android.bluetooth.BluetoothManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.IBinder
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.mbientlab.metawear.MetaWearBoard
import com.mbientlab.metawear.android.BtleService
import com.mbientlab.metawear.data.Acceleration
import com.mbientlab.metawear.data.AngularVelocity
import com.mbientlab.metawear.module.Accelerometer
import com.mbientlab.metawear.module.GyroBmi160
import android.content.ServiceConnection

@ReactModule(name = "MetaWearModule")
class MetaWearModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), ServiceConnection {

    private var serviceBinder: BtleService.LocalBinder? = null
    private var board: MetaWearBoard? = null
    private val eventEmitter: DeviceEventManagerModule.RCTDeviceEventEmitter? =
        reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)

    private var accX = 0.0
    private var accY = 0.0
    private var accZ = 0.0

    private var gyroX = 0.0
    private var gyroY = 0.0
    private var gyroZ = 0.0

    override fun getName() = "MetaWearModule"

    init {
        // Bindujemy usługę MetaWear BtleService
        reactContext.bindService(
            Intent(reactContext, BtleService::class.java),
            this, Context.BIND_AUTO_CREATE
        )
    }

    override fun onServiceConnected(name: ComponentName?, service: IBinder?) {
        serviceBinder = service as? BtleService.LocalBinder
        Log.i("MetaWearModule", "✅ BtleService connected.")
    }

    override fun onServiceDisconnected(name: ComponentName?) {
        serviceBinder = null
        Log.w("MetaWearModule", "⚠️ BtleService disconnected.")
    }

    @ReactMethod
    fun connectToDevice(macAddress: String, promise: Promise) {
        val bluetoothManager = reactContext.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
        val btDevice = bluetoothManager.adapter.getRemoteDevice(macAddress)

        val boardInstance = serviceBinder?.getMetaWearBoard(btDevice)
        if (boardInstance == null) {
            promise.reject("SERVICE_ERROR", "Bluetooth service not bound or board not found")
            return
        }

        board = boardInstance
        boardInstance.connectAsync().continueWith { task ->
            if (task.isFaulted) {
                promise.reject("CONN_ERROR", task.error)
            } else {
                if (boardInstance.isConnected) {
                    Log.i("MetaWear", "✅ Device connected")
                    setupSensors()
                    promise.resolve("Connected to MetaWear device: $macAddress")
                } else {
                    promise.reject("NOT_CONNECTED", "Board is not connected after connectAsync()")
                }
            }
        }
    }

    @ReactMethod
    fun disconnectFromDevice(macAddress: String, promise: Promise) {
        val bluetoothManager = reactContext.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
        val btDevice = bluetoothManager.adapter.getRemoteDevice(macAddress)

        val boardInstance = serviceBinder?.getMetaWearBoard(btDevice)
        if (boardInstance == null) {
            promise.reject("SERVICE_ERROR", "Bluetooth service not bound or board not found")
            return
        }

        boardInstance.disconnectAsync().continueWith {
            board = null
            promise.resolve("Disconnected from MetaWear device: $macAddress")
        }
    }

    private fun setupSensors() {
        board?.let { board ->
            board.getModule(Accelerometer::class.java)?.let { accelerometer ->
                accelerometer.acceleration().addRouteAsync { source ->
                    source.stream { data, _ ->
                        val acc = data.value(Acceleration::class.java)
                        accX = acc.x().toDouble()
                        accY = acc.y().toDouble()
                        accZ = acc.z().toDouble()

                        val accelArray = Arguments.createArray().apply {
                            pushDouble(accX)
                            pushDouble(accY)
                            pushDouble(accZ)
                        }

                        val gyroArray = Arguments.createArray().apply {
                            pushDouble(gyroX)
                            pushDouble(gyroY)
                            pushDouble(gyroZ)
                        }

                        val payload = Arguments.createMap().apply {
                            putArray("accelerometer", accelArray)
                            putArray("gyroscope", gyroArray)
                            putDouble("timestamp", System.currentTimeMillis().toDouble() / 1000.0)
                        }

                        eventEmitter?.emit("SENSOR_DATA", payload)
                    }
                }.continueWith {
                    accelerometer.acceleration().start()
                    accelerometer.start()
                }
            }

            board.getModule(GyroBmi160::class.java)?.let { gyro ->
                gyro.configure()
                    .odr(GyroBmi160.OutputDataRate.ODR_100_HZ)
                    .range(GyroBmi160.Range.FSR_250)
                    .commit()

                gyro.angularVelocity().addRouteAsync { source ->
                    source.stream { data, _ ->
                        val g = data.value(AngularVelocity::class.java)
                        gyroX = g.x().toDouble()
                        gyroY = g.y().toDouble()
                        gyroZ = g.z().toDouble()
                    }
                }.continueWith {
                    gyro.angularVelocity().start()
                    gyro.start()
                }
            }
        }
    }

//    @ReactMethod
//    fun getSensorData(promise: Promise) {
//        val dataList = sensorDataBuffer.toList()
//        promise.resolve(Arguments.fromList(dataList))
//        sensorDataBuffer.clear()
//    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Wymagane przez React Native (do DeviceEventEmitter)
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Wymagane przez React Native (do DeviceEventEmitter)
    }

    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        board?.disconnectAsync()
        reactContext.unbindService(this)
    }
}