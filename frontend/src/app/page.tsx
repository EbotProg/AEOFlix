'use client'
import React, { useEffect, useState } from "react";
import FileUploader from "../components/FileUploader";
import VideoPlayer from "../components/VideoPlayer";
import TestOfflineVideo from "@/components/TestOfflineVideo";
import DisplayVideos from "@/components/DisplayVideos";
import { retrieveVideoFromChunks } from "@/utils/indexedDB";
import { off } from "process";

const HomePage = () => {
    const [videoId, setVideoId] = useState<string>(""); // Stores the uploaded video's ID
    const [videoUrl, setVideoUrl] = useState<string>(""); // Stores the video URL for playback
    const [isOnline, setIsOnline] = useState<boolean>(false); // State to check if the app is online
    const [isOffline, setIsOffline] = useState<boolean>(false); // State to check if the app is offline

    // Handles the success callback after a file is uploaded
    const handleUploadSuccess = (id: string) => {
        console.log('this is id',id)
        // const id = uploadedFilePath.split("/").pop() || ""; // Extract video ID from the file path
        const vidId = id;
        setVideoId(vidId); // Save the video ID for playback
    };

    const getVid = async (id: string) => {
            const retrievedBlob = await retrieveVideoFromChunks(id);
                if (retrievedBlob) {
                    const videoBlobUrl = URL.createObjectURL(retrievedBlob);
                    setVideoUrl(videoBlobUrl); // Update the video URL for playback
                }
        }
        
    const setOnlineId = (id: string) => {
        setIsOnline(true);
        setIsOffline(false);
setVideoId(id);

    }

    const setOfflineId = (id: string) => {

setIsOffline(true);
setIsOnline(false);
getVid(id)
    }


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
            {/* {videoId ? (
                <div style={{ marginTop: "20px" }}>
                    <VideoPlayer videoId={videoId} />
                </div>
            ) : (
                <p style={{ marginTop: "20px" }}>No video selected for playback yet.</p>
            )} */}

            <hr />
            <DisplayVideos setOfflineId={setOfflineId} setOnlineId={setOnlineId} />
            <div>
               { isOnline && (
                <div style={{ marginTop: "20px" }}>
                {/* <VideoPlayer videoId={videoId} /> */}
                <VideoPlayer 
        videoId={videoId}
        apiBaseUrl="http://localhost:4000/api" 
      />
            </div>
               )}
               { isOffline && videoUrl && (
                <div style={{ marginTop: "20px" }}> 
                <video
                        controls
                        style={{
                            width: "100%",
                            maxWidth: "600px",
                            border: "1px solid #ccc",
                            borderRadius: "8px",
                        }}
                    >
                        <source src={videoUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                </div>
               )}
            </div>
        </main>
    );
};

export default HomePage;
