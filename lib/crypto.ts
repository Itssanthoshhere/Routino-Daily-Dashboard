/**
 * Client-Side Zero-Knowledge Encryption for Notes
 * Uses standard Web Crypto API (AES-256-GCM + PBKDF2 with SHA-256).
 * No plaintext is ever transmitted to the server or database.
 */

const PBKDF2_ITERATIONS = 100000;
const AES_KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for AES-GCM
const SALT_LENGTH = 16; // 128 bits

// Base64 Helpers
function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Derives an AES-GCM CryptoKey from a user passphrase and salt using PBKDF2.
 */
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as unknown as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: AES_KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Checks if a string is an AES-256 encrypted payload.
 */
export function isEncryptedPayload(text?: string | null): boolean {
  if (!text) return false;
  return text.startsWith("aes256:");
}

/**
 * Encrypts arbitrary plaintext using a passphrase.
 * Returns a compact formatted string: "aes256:<saltBase64>:<ivBase64>:<ciphertextBase64>"
 */
export async function encryptPayload(plaintext: string, passphrase: string): Promise<string> {
  if (!passphrase) {
    throw new Error("Master passphrase is required for encryption");
  }

  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(passphrase, salt);

  const enc = new TextEncoder();
  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    enc.encode(plaintext)
  );

  const saltB64 = arrayBufferToBase64(salt);
  const ivB64 = arrayBufferToBase64(iv);
  const cipherB64 = arrayBufferToBase64(ciphertextBuffer);

  return `aes256:${saltB64}:${ivB64}:${cipherB64}`;
}

/**
 * Decrypts an encrypted payload formatted as "aes256:<saltBase64>:<ivBase64>:<ciphertextBase64>".
 * Throws an error if the passphrase is incorrect or if the ciphertext was tampered with.
 */
export async function decryptPayload(payload: string, passphrase: string): Promise<string> {
  if (!isEncryptedPayload(payload)) {
    return payload; // Already plain text
  }

  const parts = payload.split(":");
  if (parts.length !== 4) {
    throw new Error("Invalid encrypted payload format");
  }

  const [, saltB64, ivB64, cipherB64] = parts;
  const salt = new Uint8Array(base64ToArrayBuffer(saltB64));
  const iv = new Uint8Array(base64ToArrayBuffer(ivB64));
  const ciphertext = base64ToArrayBuffer(cipherB64);

  const key = await deriveKey(passphrase, salt);

  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv,
      },
      key,
      ciphertext
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch {
    throw new Error("Incorrect master passphrase or corrupted payload");
  }
}

/**
 * Generates a verification hash to confirm the passphrase without storing the raw passphrase.
 */
export async function createPassphraseVerification(passphrase: string): Promise<{ hash: string; salt: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt as unknown as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );

  return {
    hash: arrayBufferToBase64(bits),
    salt: arrayBufferToBase64(salt),
  };
}

/**
 * Verifies if an entered passphrase matches the stored verification hash.
 */
export async function verifyPassphrase(passphrase: string, saltB64: string, expectedHashB64: string): Promise<boolean> {
  try {
    const salt = new Uint8Array(base64ToArrayBuffer(saltB64));
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      enc.encode(passphrase),
      "PBKDF2",
      false,
      ["deriveBits"]
    );

    const bits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: salt as unknown as BufferSource,
        iterations: PBKDF2_ITERATIONS,
        hash: "SHA-256",
      },
      keyMaterial,
      256
    );

    const actualHashB64 = arrayBufferToBase64(bits);
    return actualHashB64 === expectedHashB64;
  } catch {
    return false;
  }
}
