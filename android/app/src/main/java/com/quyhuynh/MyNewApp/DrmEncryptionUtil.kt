package com.quyhuynh.MyNewApp

import android.util.Base64
import java.nio.ByteBuffer
import java.security.SecureRandom
import javax.crypto.Cipher
import javax.crypto.SecretKey
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.PBEKeySpec
import javax.crypto.spec.SecretKeySpec

class DrmEncryptionUtil {

    companion object {
        private const val ALGORITHM = "AES/GCM/NoPadding"
        private const val GCM_TAG_LENGTH = 128
        private const val IV_LENGTH = 12
        private const val SALT_LENGTH = 16
        private const val ITERATION_COUNT = 10000
        private const val KEY_LENGTH = 256
    }

    fun encryptContent(content: ByteArray, contentKey: String): ByteArray {
        val salt = generateRandomBytes(SALT_LENGTH)
        val iv = generateRandomBytes(IV_LENGTH)
        val key = deriveKey(contentKey, salt)
        val cipher = Cipher.getInstance(ALGORITHM)
        cipher.init(Cipher.ENCRYPT_MODE, key, GCMParameterSpec(GCM_TAG_LENGTH, iv))
        val encrypted = cipher.doFinal(content)

        val buffer = ByteBuffer.allocate(SALT_LENGTH + IV_LENGTH + encrypted.size)
        buffer.put(salt)
        buffer.put(iv)
        buffer.put(encrypted)

        return buffer.array()
    }

    fun decryptContent(encryptedContent: ByteArray, contentKey: String): ByteArray {
        val buffer = ByteBuffer.wrap(encryptedContent)

        val salt = ByteArray(SALT_LENGTH)
        buffer.get(salt)

        val iv = ByteArray(IV_LENGTH)
        buffer.get(iv)

        val encrypted = ByteArray(buffer.remaining())
        buffer.get(encrypted)

        val key = deriveKey(contentKey, salt)
        val cipher = Cipher.getInstance(ALGORITHM)
        cipher.init(Cipher.DECRYPT_MODE, key, GCMParameterSpec(GCM_TAG_LENGTH, iv))
        return cipher.doFinal(encrypted)
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
