declare module "crypto-browserify" {
    import { Cipher, Decipher } from "crypto";

    /**
     * Creates a Cipher instance for encryption.
     * @param algorithm - The encryption algorithm (e.g., "aes-256-cbc").
     * @param key - The encryption key as a Buffer or string.
     * @param iv - The initialization vector (IV) as a Buffer or string.
     * @returns A Cipher instance.
     */
    export function createCipheriv(
        algorithm: string,
        key: Buffer | string,
        iv: Buffer | string
    ): Cipher;

    /**
     * Creates a Decipher instance for decryption.
     * @param algorithm - The decryption algorithm (e.g., "aes-256-cbc").
     * @param key - The decryption key as a Buffer or string.
     * @param iv - The initialization vector (IV) as a Buffer or string.
     * @returns A Decipher instance.
     */
    export function createDecipheriv(
        algorithm: string,
        key: Buffer | string,
        iv: Buffer | string
    ): Decipher;

    /**
     * Generates random bytes for encryption keys or initialization vectors.
     * @param size - The number of random bytes to generate.
     * @returns A Buffer containing random bytes.
     */
    export function randomBytes(size: number): Buffer;

    /**
     * Concatenates multiple Buffer objects into a single Buffer.
     * @param list - An array of Buffer objects.
     * @returns A single concatenated Buffer.
     */
    export function BufferConcat(list: Buffer[]): Buffer;
}
