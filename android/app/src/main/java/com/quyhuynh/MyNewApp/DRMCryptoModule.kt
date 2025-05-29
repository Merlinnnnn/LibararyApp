package com.quyhuynh.MyNewApp

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import javax.crypto.Cipher
import javax.crypto.SecretKey
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.PBEKeySpec
import javax.crypto.spec.SecretKeySpec
import android.util.Base64
import java.nio.ByteBuffer
import java.security.SecureRandom

class DRMCryptoModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    companion object {
        private const val ALGORITHM = "AES/GCM/NoPadding"
        private const val GCM_TAG_LENGTH = 128
        private const val IV_LENGTH = 12
        private const val SALT_LENGTH = 16
        private const val ITERATION_COUNT = 10000
        private const val KEY_LENGTH = 256
    }

    override fun getName(): String {
        return "DRMCrypto"
    }

    private fun generateRandomBytes(length: Int): ByteArray {
        val bytes = ByteArray(length)
        SecureRandom().nextBytes(bytes)
        return bytes
    }

    private fun deriveKey(contentKey: String, salt: ByteArray): SecretKey {
        val factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
        val spec = PBEKeySpec(contentKey.toCharArray(), salt, ITERATION_COUNT, KEY_LENGTH)
        val tmp = factory.generateSecret(spec)
        return SecretKeySpec(tmp.encoded, "AES")
    }

    @ReactMethod
    fun encryptContent(content: String, contentKey: String, promise: Promise) {
        try {
            val contentBytes = Base64.decode(content, Base64.DEFAULT)
            val salt = generateRandomBytes(SALT_LENGTH)
            val iv = generateRandomBytes(IV_LENGTH)
            
            val key = deriveKey(contentKey, salt)
            val cipher = Cipher.getInstance(ALGORITHM)
            val spec = GCMParameterSpec(GCM_TAG_LENGTH, iv)
            cipher.init(Cipher.ENCRYPT_MODE, key, spec)
            
            val encrypted = cipher.doFinal(contentBytes)
            
            val buffer = ByteBuffer.allocate(SALT_LENGTH + IV_LENGTH + encrypted.size)
            buffer.put(salt)
            buffer.put(iv)
            buffer.put(encrypted)
            
            val result = Base64.encodeToString(buffer.array(), Base64.DEFAULT)
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("ENCRYPTION_ERROR", e.message)
        }
    }

    @ReactMethod
    fun decryptContent(encryptedContent: String, contentKey: String, promise: Promise) {
        try {
            val encryptedBytes = Base64.decode(encryptedContent, Base64.DEFAULT)
            val buffer = ByteBuffer.wrap(encryptedBytes)
            
            val salt = ByteArray(SALT_LENGTH)
            buffer.get(salt)
            
            val iv = ByteArray(IV_LENGTH)
            buffer.get(iv)
            
            val encrypted = ByteArray(buffer.remaining())
            buffer.get(encrypted)
            
            val key = deriveKey(contentKey, salt)
            val cipher = Cipher.getInstance(ALGORITHM)
            val spec = GCMParameterSpec(GCM_TAG_LENGTH, iv)
            cipher.init(Cipher.DECRYPT_MODE, key, spec)
            
            val decrypted = cipher.doFinal(encrypted)
            val result = Base64.encodeToString(decrypted, Base64.DEFAULT)
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("DECRYPTION_ERROR", e.message)
        }
    }
} 