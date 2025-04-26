import crypto from "crypto";
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import path from "path";

const algorithm = "aes-256-cbc"; // Encryption algorithm
const iv = crypto.randomBytes(16); // Initialization vector

// Encrypt video file
export const encryptVideo = (inputPath: string, outputPath: string, key: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const cipher = crypto.createCipheriv(algorithm, Buffer.from(key, "hex"), iv);
        const input = fs.createReadStream(inputPath);
        const output = fs.createWriteStream(outputPath);

        // Write the IV at the beginning of the output file
        output.write(iv);

        input.pipe(cipher).pipe(output).on("finish", resolve).on("error", reject);
    });
};

// Decrypt video file
export const decryptVideo = (
    inputPath: string,
    outputPath: string,
    key: string
): Promise<void> => {
    return new Promise((resolve, reject) => {
        const iv = Buffer.alloc(16); // Create a buffer for the Initialization Vector (IV)

        // Step 1: Read the IV (first 16 bytes) from the encrypted file
        const ivStream = fs.createReadStream(inputPath, { start: 0, end: 15 });
        ivStream.on("data", (chunk) => {
            if (Buffer.isBuffer(chunk)) {
                chunk.copy(iv); // Copy the IV into the buffer
            } else {
                reject(new Error("Unexpected data type: IV must be a Buffer"));
            }
        });

        ivStream.on("end", () => {
            // Step 2: Proceed to decrypt the rest of the file
            const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key, "hex"), iv);
            const decryptedTempPath = inputPath.replace(".enc", "_decrypted.mp4"); // Temporary decrypted file

            const encryptedStream = fs.createReadStream(inputPath, { start: 16 }); // Skip the IV
            const decryptedStream = fs.createWriteStream(decryptedTempPath);

            encryptedStream
                .pipe(decipher)
                .pipe(decryptedStream)
                .on("finish", async () => {
                    try {
                        // Step 3: Re-encode the decrypted file using FFmpeg
                        await reEncodeVideo(decryptedTempPath, outputPath);
                        fs.unlinkSync(decryptedTempPath); // Clean up temporary decrypted file
                        resolve();
                    } catch (err:any) {
                        reject(new Error(`Failed to re-encode video: ${err.message}`));
                    }
                })
                .on("error", reject);
        });

        ivStream.on("error", reject);
    });
};

// Function to re-encode video using FFmpeg
const reEncodeVideo = (inputPath: string, outputPath: string): Promise<void> => {
    if (!fs.existsSync(inputPath)) {
        throw new Error(`Input file does not exist: ${inputPath}`);
    }

    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`Starting FFmpeg encoding: Input - ${inputPath}, Output - ${outputPath}`);
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .output(outputPath)
            .videoCodec("libx264") // Ensure H.264 encoding
            .audioCodec("aac") // Ensure AAC encoding
            .outputOptions("-movflags +faststart") // Optimize for web playback
            .on("start", (command) => console.log(`FFmpeg command: ${command}`)) // Logs FFmpeg command
            .on("progress", (progress) => console.log(`FFmpeg progress: ${JSON.stringify(progress)}`)) // Logs progress
            .on("end", () => {
                console.log(`FFmpeg encoding completed successfully: ${outputPath}`);
                resolve();
            })
            .on("error", (err) => {
                console.error(`FFmpeg error: ${err.message}`);
                reject(new Error(`FFmpeg error: ${err.message}`));
            })
            .run();
    });
};
