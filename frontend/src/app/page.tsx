'use client'
import React, { useState } from "react";
import FileUploader from "../components/FileUploader";
import VideoPlayer from "../components/VideoPlayer";
import TestOfflineVideo from "@/components/TestOfflineVideo";

const HomePage = () => {
    const [videoId, setVideoId] = useState<string>(""); // Stores the uploaded video's ID

    // Handles the success callback after a file is uploaded
    const handleUploadSuccess = (id: string) => {
        console.log('this is id',id)
        // const id = uploadedFilePath.split("/").pop() || ""; // Extract video ID from the file path
        const vidId = id;
        setVideoId(vidId); // Save the video ID for playback
    };

    return (
        <main style={{ padding: "20px" }}>

<main style={{ padding: "20px" }}>
            <h1>Offline Video Storage Demo</h1>
            <TestOfflineVideo />
        </main>

            <h1>Welcome to Secure Video Storage</h1>
            <p>Upload a video and play it securely right here!</p>
            
            {/* File Uploader Section */}
            <FileUploader onUploadSuccess={handleUploadSuccess} />

            {/* Video Player Section */}
            {videoId ? (
                <div style={{ marginTop: "20px" }}>
                    <VideoPlayer videoId={videoId} />
                </div>
            ) : (
                <p style={{ marginTop: "20px" }}>No video selected for playback yet.</p>
            )}
        </main>
    );
};

export default HomePage;
