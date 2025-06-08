package com.quyhuynh.modernlibrary

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

class SimpleMathModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "SimpleMathModule" // Tên module dùng trong JS
    }

    @ReactMethod
    fun add(a: Int, b: Int, promise: Promise) {
        val result = a * b
        promise.resolve(result)
    }
}