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

    private fun setupSensors() {
        board?.let { board ->
            setupAccelerometer(board)
        }
    }

    private fun setupAccelerometer(board: MetaWearBoard) {
        board.getModule(Accelerometer::class.java)?.let { accelerometer ->
            accelerometer.acceleration().addRouteAsync { source ->
                source.stream { data, _ ->
                    data.value(Acceleration::class.java)?.let { accel ->
                        val dataString = "ACC: ${accel.x()}, ${accel.y()}, ${accel.z()}"
                        sensorDataBuffer.add(dataString)
                        // Wysyłamy zdarzenie do JS – np. dla natychmiastowej aktualizacji UI
                        eventEmitter?.emit("SENSOR_DATA", dataString)
                    }
                }
            }.continueWith {
                accelerometer.acceleration().start()
                accelerometer.start()
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