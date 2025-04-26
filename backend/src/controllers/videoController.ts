import { Request, Response } from 'express';
import { downloadVideoWithYtDlp } from '../services/videoService';
import path from "path";
import fs from "fs";
import Video from "../models/videoModel";
import crypto from "crypto";
import { encryptVideo, decryptVideo } from "../utils/encryptionUtils";
import ffmpeg from "fluent-ffmpeg";

export const downloadVideoController = async (req:Request, res:Response): Promise<any> => {
    try {
        const videoUrl = req.body.url;
        const filePath = await downloadVideoWithYtDlp(videoUrl);
        res.status(200).send({ message: 'Video downloaded and compressed successfully!', filePath });
    } catch (err:any) {
        res.status(500).send({ error: err.message });
    }
};


export const uploadVideo = async (req: Request, res: Response): Promise<any> => {
    try {
        const file = req.file;
        const providedThumbnail = req.body.thumbnail; // Check if thumbnail is provided
        if (!file) {
            return res.status(400).json({ error: "No file uploaded." });
        }

        const uploadDir = path.join(__dirname, "../../uploads");
        const encryptedFilePath = path.join(uploadDir, `${Date.now()}_${file.originalname}.enc`);
        const encryptionKey = crypto.randomBytes(32).toString("hex"); // Generate a random encryption key

        // Encrypt the video file
        await encryptVideo(file.path, encryptedFilePath, encryptionKey);

        // Handle Thumbnail Creation
        let thumbnailPath = ""; // Path for the thumbnail
        if (providedThumbnail) {
            // Save the provided thumbnail
            const thumbnailDir = path.join(__dirname, "../../uploads/thumbnails");
            if (!fs.existsSync(thumbnailDir)) {
                fs.mkdirSync(thumbnailDir, { recursive: true });
            }
            thumbnailPath = path.join(thumbnailDir, `${Date.now()}_thumbnail.jpg`);
            fs.writeFileSync(thumbnailPath, Buffer.from(providedThumbnail, "base64")); // Assume thumbnail is sent as Base64
        } else {
            // Generate a thumbnail if none is provided
            thumbnailPath = await generateThumbnail(file.path);
        }

        // Save video metadata to MongoDB
        const newVideo = new Video({
            title: file.originalname,
            filePath: encryptedFilePath,
            encryptionKey,
            thumbnailPath, // Include thumbnail path in metadata
        });
        await newVideo.save();

        // Delete the original unencrypted file
        fs.unlinkSync(file.path);

        res.status(200).json({
            message: "Video uploaded, encrypted, and thumbnail created successfully!",
            video: newVideo,
        });
    } catch (error) {
        console.error("Error uploading video:", error);
        res.status(500).json({ error: "Failed to upload video." });
    }
};

// Function to generate a thumbnail from the video
const generateThumbnail = (videoPath: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const thumbnailDir = path.join(__dirname, "../../uploads/thumbnails");
        if (!fs.existsSync(thumbnailDir)) {
            fs.mkdirSync(thumbnailDir, { recursive: true });
        }

        const thumbnailPath = path.join(thumbnailDir, `${Date.now()}_thumbnail.jpg`);

        ffmpeg(videoPath)
            .screenshots({
                count: 1, // Generate 1 thumbnail
                filename: path.basename(thumbnailPath),
                folder: thumbnailDir,
                size: "320x240", // Resize thumbnail (optional)
            })
            .on("end", () => {
                resolve(thumbnailPath);
            })
            .on("error", (err) => {
                reject(new Error(`Failed to generate thumbnail: ${err.message}`));
            });
    });
};

// Fetch all video metadata
export const getVideos = async (req: Request, res: Response): Promise<any> => {
    try {
        const videos = await Video.find(); // Retrieve all videos
        res.status(200).json(videos);
    } catch (error) {
        console.error("Error fetching videos:", error);
        res.status(500).json({ error: "Failed to fetch videos." });
    }
};

// Serve decrypted video (decrypt dynamically for playback)
export const serveVideoOneGo = async (req: Request, res: Response): Promise<any> => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) {
            return res.status(404).json({ error: "Video not found." });
        }

        const tempFilePath = path.join(__dirname, "../../uploads/temp.mp4");

        // Decrypt the video file
        await decryptVideo(video.filePath, tempFilePath, video.encryptionKey);

        // Stream the decrypted file
        res.sendFile(tempFilePath, {}, (err) => {
            if (err) {
                console.error("Error streaming video:", err);
                //res.status(500).json({ error: "Failed to serve video." });
            }

            // Clean up temporary decrypted file after serving
            fs.unlinkSync(tempFilePath);
        });
    } catch (error) {
        console.error("Error serving video:", error);
        res.status(500).json({ error: "Failed to serve video." });
    }
};

export const serveVideo = async (req: Request, res: Response): Promise<any> => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) {
            return res.status(404).json({ error: "Video not found." });
        }

        const tempFilePath = path.join(__dirname, "../../uploads/temp.mp4");

        // Decrypt the video to a temporary file
        await decryptVideo(video.filePath, tempFilePath, video.encryptionKey);

        const videoStats = fs.statSync(tempFilePath); // Get decrypted video stats

        // Handle Range Request for streaming
        const range = req.headers.range;
        if (!range) {
            // If no range header, send the entire file
            res.writeHead(200, {
                "Content-Length": videoStats.size,
                "Content-Type": "video/mp4",
            });
            fs.createReadStream(tempFilePath)
                .on("close", () => {
                    // Clean up the temporary file once the stream is done
                    fs.unlinkSync(tempFilePath);
                })
                .pipe(res);
            return;
        }

        // Parse Range header (e.g., "bytes=0-")
        const [startStr, endStr] = range.replace(/bytes=/, "").split("-");
        const start = parseInt(startStr, 10);
        const end = endStr ? parseInt(endStr, 10) : videoStats.size - 1; // Default to end of file
        const chunkSize = end - start + 1;

        // Create HTTP response for partial content
        res.writeHead(206, {
            "Content-Range": `bytes ${start}-${end}/${videoStats.size}`,
            "Accept-Ranges": "bytes",
            "Content-Length": chunkSize,
            "Content-Type": "video/mp4",
        });

        // Stream the requested chunk
        fs.createReadStream(tempFilePath, { start, end })
            .on("close", () => {
                // Clean up the temporary file once the stream is done
                fs.unlinkSync(tempFilePath);
            })
            .pipe(res);
    } catch (error) {
        console.error("Error serving video:", error);
        res.status(500).json({ error: "Failed to serve video." });
    }
};

