package com.anonymous.metamotionfe

import android.bluetooth.BluetoothManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
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

@ReactModule(name = "MetaWearModule")
class MetaWearModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), ServiceConnection {

    private var serviceBinder: BtleService.LocalBinder? = null
    private var board: MetaWearBoard? = null
    private val eventEmitter: DeviceEventManagerModule.RCTDeviceEventEmitter? =
        reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)

    private var latestAccel: Acceleration? = null
    private var latestGyro: AngularVelocity? = null

    override fun getName() = "MetaWearModule"

    override fun onServiceConnected(name: ComponentName?, service: IBinder?) {
        serviceBinder = service as? BtleService.LocalBinder
    }

    override fun onServiceDisconnected(name: ComponentName?) {
        serviceBinder = null
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
                    Log.i("MetaWear", "Device connected")
                    setupSensors()  // <-- tylko wtedy startuj stream
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
        board = boardInstance
        boardInstance.disconnectAsync().continueWith { task ->
            if (task.isFaulted) {
                promise.reject("DISCONN_ERROR", task.error)
            } else {
                promise.resolve("Disconnected from MetaWear device: $macAddress")
            }
            null
        }
    }

    private fun setupSensors() {
        board?.let { board ->
            setupAccelerometer(board)
            setupGyroscope(board)
        }
    }

    private fun maybeEmitSensorData() {
        if (latestAccel != null && latestGyro != null) {
            val accArray = Arguments.createArray().apply {
                pushDouble(latestAccel!!.x().toDouble())
                pushDouble(latestAccel!!.y().toDouble())
                pushDouble(latestAccel!!.z().toDouble())
            }

            val gyroArray = Arguments.createArray().apply {
                pushDouble(latestGyro!!.x().toDouble())
                pushDouble(latestGyro!!.y().toDouble())
                pushDouble(latestGyro!!.z().toDouble())
            }

            val map = Arguments.createMap()
            map.putDouble("timestamp", System.currentTimeMillis().toDouble() / 1000.0)
            map.putArray("accelerometer", accArray)
            map.putArray("gyroscope", gyroArray)

            eventEmitter?.emit("SENSOR_DATA", map)

            latestAccel = null
            latestGyro = null
        }
    }

    private fun setupAccelerometer(board: MetaWearBoard) {
        board.getModule(Accelerometer::class.java)?.let { accelerometer ->
            accelerometer.acceleration().addRouteAsync { source ->
                source.stream { data, _ ->
                    latestAccel = data.value(Acceleration::class.java)
                    maybeEmitSensorData()
                }
            }.continueWith {
                accelerometer.acceleration().start()
                accelerometer.start()
            }
        }
    }

    private fun setupGyroscope(board: MetaWearBoard) {
        board.getModule(GyroBmi160::class.java)?.let { gyro ->
            gyro.configure()
                .odr(GyroBmi160.OutputDataRate.ODR_100_HZ)
                .range(GyroBmi160.Range.FSR_250)
                .commit()

            gyro.angularVelocity().addRouteAsync { source ->
                source.stream { data, _ ->
                    latestGyro = data.value(AngularVelocity::class.java)
                    maybeEmitSensorData()
                }
            }.continueWith {
                gyro.angularVelocity().start()
                gyro.start()
            }
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}

    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        board?.disconnectAsync()
        reactContext.unbindService(this)
    }
}