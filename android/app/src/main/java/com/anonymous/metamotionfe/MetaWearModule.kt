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
import com.mbientlab.metawear.module.Accelerometer
import java.util.concurrent.CopyOnWriteArrayList
import com.mbientlab.metawear.module.GyroBmi160
import com.mbientlab.metawear.module.GyroBmi160.OutputDataRate
import com.mbientlab.metawear.module.GyroBmi160.Range
import com.mbientlab.metawear.data.AngularVelocity

@ReactModule(name = "MetaWearModule")
class MetaWearModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), ServiceConnection {

    private var serviceBinder: BtleService.LocalBinder? = null
    private var board: MetaWearBoard? = null
    private val sensorDataBuffer = CopyOnWriteArrayList<String>()
    private val eventEmitter: DeviceEventManagerModule.RCTDeviceEventEmitter? =
        reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)

    init {
        // Bindujemy usługę MetaWear BtleService
        reactContext.bindService(
            Intent(reactContext, BtleService::class.java),
            this, Context.BIND_AUTO_CREATE
        )
    }

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
                setupSensors()
                promise.resolve("Connected to MetaWear device: $macAddress")
            }
            null
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

    private fun setupAccelerometer(board: MetaWearBoard) {
        board.getModule(Accelerometer::class.java)?.let { accelerometer ->
            accelerometer.acceleration().addRouteAsync { source ->
                source.stream { data, _ ->
                    data.value(Acceleration::class.java)?.let { accel ->
                        val accArray = Arguments.createArray().apply {
                            pushDouble(accel.x().toDouble())
                            pushDouble(accel.y().toDouble())
                            pushDouble(accel.z().toDouble())
                        }

                        val map = Arguments.createMap()
                        map.putArray("accelerometer", accArray)
                        map.putDouble("timestamp", System.currentTimeMillis().toDouble())

                        eventEmitter?.emit("SENSOR_DATA", map)
                    }
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
                    data.value(AngularVelocity::class.java)?.let { gyroData ->
                        val gyroArray = Arguments.createArray().apply {
                            pushDouble(gyroData.x().toDouble())
                            pushDouble(gyroData.y().toDouble())
                            pushDouble(gyroData.z().toDouble())
                        }

                        val map = Arguments.createMap()
                        map.putArray("gyroscope", gyroArray)
                        map.putDouble("timestamp", System.currentTimeMillis().toDouble())

                        eventEmitter?.emit("SENSOR_DATA", map)
                    }
                }
            }.continueWith {
                gyro.angularVelocity().start()
                gyro.start()
            }
        }
    }

    @ReactMethod
    fun getSensorData(promise: Promise) {
        val dataList = sensorDataBuffer.toList()
        promise.resolve(Arguments.fromList(dataList))
        sensorDataBuffer.clear()
    }

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