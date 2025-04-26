import crypto from "crypto-browserify";

const algorithm = "aes-256-cbc";
const key = crypto.randomBytes(32).toString("hex"); // Random encryption key
const iv = crypto.randomBytes(16); // Initialization vector

export const encryptBlob = async (blob: Blob): Promise<Blob> => {
    const data = await blob.arrayBuffer();
    const bufferData = Buffer.from(data); // Convert ArrayBuffer to Buffer

    const cipher = crypto.createCipheriv(algorithm, Buffer.from(key, "hex"), iv);
    const encrypted = Buffer.concat([cipher.update(bufferData), cipher.final()]);

    // Combine IV and encrypted data
    return new Blob([iv, encrypted]);
};

export const decryptBlob = async (blob: Blob): Promise<Blob> => {
    const buffer = await blob.arrayBuffer();
    const ivBuffer = Buffer.from(buffer.slice(0, 16)); // Extract IV (convert ArrayBuffer to Buffer)
    const encryptedDataBuffer = Buffer.from(buffer.slice(16)); // Extract encrypted content (convert ArrayBuffer to Buffer)

    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key, "hex"), ivBuffer);
    const decrypted = Buffer.concat([decipher.update(encryptedDataBuffer), decipher.final()]);

    return new Blob([decrypted]);
};
