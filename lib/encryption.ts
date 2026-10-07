import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LEN = 12; // 96-bit IV recommended for GCM

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET || "";
  if (!secret || secret.length < 16) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[encryption] ??  ENCRYPTION_SECRET is missing or too short. " +
        "Add a 32+ character random string to .env.local / Vercel environment settings."
      );
    }
  }
  return crypto.createHash("sha256").update(secret || "dev-insecure-key-change-me").digest();
}

/**
 * Encrypts a plaintext string with AES-256-GCM.
 * Returns a base64-encoded string: "<iv>:<authTag>:<ciphertext>"
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return "";
  const key = getKey();
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`;
}

/**
 * Decrypts a string that was encrypted with encrypt().
 * Returns the original plaintext, or "" on failure.
 */
export function decrypt(ciphertext: string): string {
  if (!ciphertext) return "";
  try {
    const parts = ciphertext.split(":");
    if (parts.length !== 3) return ciphertext; // Not encrypted (legacy plain value)
    const [ivB64, authTagB64, encB64] = parts;
    const key = getKey();
    const iv = Buffer.from(ivB64, "base64");
    const authTag = Buffer.from(authTagB64, "base64");
    const encryptedData = Buffer.from(encB64, "base64");
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
    return decrypted.toString("utf8");
  } catch {
    return "";
  }
}
