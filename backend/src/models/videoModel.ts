import mongoose, { Document } from "mongoose";

export interface IVideo extends Document {
    title: string;
    filePath: string;
    encryptionKey: string;
    uploadedAt?: Date;
}

const videoSchema = new mongoose.Schema({
    title: { type: String, required: true },
    filePath: { type: String, required: true },
    encryptionKey: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
});

const Video = mongoose.model<IVideo>("Video", videoSchema);

export default Video;
