import { Request, Response } from 'express';
import { downloadVideoWithYtDlp } from '../services/videoService';

export const downloadVideoController = async (req:Request, res:Response) => {
    try {
        const videoUrl = req.body.url;
        const filePath = await downloadVideoWithYtDlp(videoUrl);
        res.status(200).send({ message: 'Video downloaded and compressed successfully!', filePath });
    } catch (err:any) {
        res.status(500).send({ error: err.message });
    }
};
