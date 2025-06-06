package com.quyhuynh.MyNewApp

import com.facebook.react.bridge.*
import android.util.Base64
import java.nio.ByteBuffer
import java.security.SecureRandom
import javax.crypto.Cipher
import javax.crypto.SecretKey
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.PBEKeySpec
import javax.crypto.spec.SecretKeySpec
import java.io.File

class DrmBridgeModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val ALGORITHM = "AES/GCM/NoPadding"
        private const val GCM_TAG_LENGTH = 128
        private const val IV_LENGTH = 12
        private const val SALT_LENGTH = 16
        private const val ITERATION_COUNT = 10000
        private const val KEY_LENGTH = 256
    }

    override fun getName(): String = "DRMCrypto"

    @ReactMethod
    fun getHello(promise: Promise) {
        try {
            promise.resolve("Hello from DRMCrypto Native Module!")
        } catch (e: Exception) {
            promise.reject("HELLO_ERROR", e.message)
        }
    }

    @ReactMethod
    fun encryptContent(content: String, contentKey: String, promise: Promise) {
        try {
            val contentBytes = content.toByteArray(Charsets.UTF_8)
            val salt = generateRandomBytes(SALT_LENGTH)
            val iv = generateRandomBytes(IV_LENGTH)
            val key = deriveKey(contentKey, salt)
            val cipher = Cipher.getInstance(ALGORITHM)
            cipher.init(Cipher.ENCRYPT_MODE, key, GCMParameterSpec(GCM_TAG_LENGTH, iv))
            val encrypted = cipher.doFinal(contentBytes)

            val buffer = ByteBuffer.allocate(SALT_LENGTH + IV_LENGTH + encrypted.size)
            buffer.put(salt)
            buffer.put(iv)
            buffer.put(encrypted)

            val result = Base64.encodeToString(buffer.array(), Base64.NO_WRAP)
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("ENCRYPT_ERROR", e.message)
        }
    }
    @ReactMethod
    fun decryptContent(encryptedContent: String, contentKey: String, fileType: String, promise: Promise) {
    try {
        val encryptedBytes = Base64.decode(encryptedContent, Base64.NO_WRAP)
        val buffer = ByteBuffer.wrap(encryptedBytes)

        val salt = ByteArray(SALT_LENGTH)
        buffer.get(salt)

        val iv = ByteArray(IV_LENGTH)
        buffer.get(iv)

        val encrypted = ByteArray(buffer.remaining())
        buffer.get(encrypted)

        val key = deriveKey(contentKey, salt)
        val cipher = Cipher.getInstance(ALGORITHM)
        cipher.init(Cipher.DECRYPT_MODE, key, GCMParameterSpec(GCM_TAG_LENGTH, iv))
        val decrypted = cipher.doFinal(encrypted)

        // ✅ Save to cache file
        val fileName = "decrypted_${System.currentTimeMillis()}."+fileType
        val file = File(reactApplicationContext.cacheDir, fileName)
        file.writeBytes(decrypted)

        // ✅ Return file path
        promise.resolve(file.absolutePath)
    } catch (e: Exception) {
        promise.reject("DECRYPT_ERROR", e.message)
    }
}



    private fun deriveKey(password: String, salt: ByteArray): SecretKey {
        val factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
        val spec = PBEKeySpec(password.toCharArray(), salt, ITERATION_COUNT, KEY_LENGTH)
        val secret = factory.generateSecret(spec)
        return SecretKeySpec(secret.encoded, "AES")
    }

    private fun generateRandomBytes(length: Int): ByteArray {
        val random = SecureRandom()
        return ByteArray(length).also { random.nextBytes(it) }
    }
}
