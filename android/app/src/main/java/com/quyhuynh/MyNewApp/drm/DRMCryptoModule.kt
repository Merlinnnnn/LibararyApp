package com.quyhuynh.MyNewApp.drm

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.Arguments
import java.security.SecureRandom
import javax.crypto.Cipher
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec
import java.nio.ByteBuffer
import java.security.MessageDigest
import java.util.Base64

class DRMCryptoModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private val SALT_LENGTH = 16
    private val IV_LENGTH = 12
    private val GCM_TAG_LENGTH = 128
    private val ALGORITHM = "AES/GCM/NoPadding"
    private val KEY_ALGORITHM = "AES"
    private val PBKDF2_ITERATIONS = 10000
    private val KEY_LENGTH = 256

    override fun getName(): String {
        return "DRMCrypto"
    }

    private fun generateRandomBytes(length: Int): ByteArray {
        val random = SecureRandom()
        val bytes = ByteArray(length)
        random.nextBytes(bytes)
        return bytes
    }

    private fun deriveKey(contentKey: String, salt: ByteArray): SecretKey {
        val keySpec = javax.crypto.spec.PBEKeySpec(
            contentKey.toCharArray(),
            salt,
            PBKDF2_ITERATIONS,
            KEY_LENGTH
        )
        val factory = javax.crypto.SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
        val key = factory.generateSecret(keySpec)
        return SecretKeySpec(key.encoded, KEY_ALGORITHM)
    }

    @ReactMethod
    fun encryptContent(content: ByteArray, contentKey: String, promise: Promise) {
        try {
            val salt = generateRandomBytes(SALT_LENGTH)
            val iv = generateRandomBytes(IV_LENGTH)
            
            val key = deriveKey(contentKey, salt)
            val cipher = Cipher.getInstance(ALGORITHM)
            val spec = GCMParameterSpec(GCM_TAG_LENGTH, iv)
            cipher.init(Cipher.ENCRYPT_MODE, key, spec)
            
            val encrypted = cipher.doFinal(content)
            
            val buffer = ByteBuffer.allocate(SALT_LENGTH + IV_LENGTH + encrypted.size)
            buffer.put(salt)
            buffer.put(iv)
            buffer.put(encrypted)
            
            val result = buffer.array()
            val base64Result = Base64.getEncoder().encodeToString(result)
            promise.resolve(base64Result)
        } catch (e: Exception) {
            promise.reject("ENCRYPTION_ERROR", "Error encrypting content: ${e.message}")
        }
    }

    @ReactMethod
    fun decryptContent(encryptedContent: String, contentKey: String, promise: Promise) {
        try {
            val decodedContent = Base64.getDecoder().decode(encryptedContent)
            val buffer = ByteBuffer.wrap(decodedContent)
            
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
            val base64Result = Base64.getEncoder().encodeToString(decrypted)
            promise.resolve(base64Result)
        } catch (e: Exception) {
            promise.reject("DECRYPTION_ERROR", "Error decrypting content: ${e.message}")
        }
    }
} 