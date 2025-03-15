package com.anonymous.metamotionfe

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.NativeModule
import com.facebook.react.uimanager.ViewManager

import com.anonymous.metamotionfe.MetaWearModule

class MetaWearPackage : ReactPackage {
    override fun createViewManagers(reactContext: ReactApplicationContext) =
        emptyList<ViewManager<*, *>>()

    override fun createNativeModules(reactContext: ReactApplicationContext) =
        listOf(MetaWearModule(reactContext))
}
