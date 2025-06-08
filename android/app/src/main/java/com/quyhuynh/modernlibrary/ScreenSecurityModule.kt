package com.quyhuynh.modernlibrary

import android.app.Activity
import android.view.WindowManager
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class ScreenSecurityModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "ScreenSecurity"

    @ReactMethod
    fun enableSecure() {
        currentActivity?.window?.setFlags(
            WindowManager.LayoutParams.FLAG_SECURE,
            WindowManager.LayoutParams.FLAG_SECURE
        )
    }

    @ReactMethod
    fun disableSecure() {
        currentActivity?.window?.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
    }
}
