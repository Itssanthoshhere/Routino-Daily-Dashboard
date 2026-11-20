import { decryptPayload, isEncryptedPayload, verifyPassphrase } from "@/lib/crypto";

/** A new device can prove the existing PIN with authenticated AES-GCM decryption. */
export async function verifyNoteVaultPin(
  pin: string,
  verifier: { hash: string; salt: string } | null,
  contents: readonly string[],
): Promise<boolean> {
  if (!pin) return false;
  if (verifier) return verifyPassphrase(pin, verifier.salt, verifier.hash);
  for (const content of contents) {
    if (!isEncryptedPayload(content)) continue;
    try {
      await decryptPayload(content, pin);
      return true;
    } catch {
      // A corrupt or differently keyed note must not hide another recoverable note.
    }
  }
  return false;
}
