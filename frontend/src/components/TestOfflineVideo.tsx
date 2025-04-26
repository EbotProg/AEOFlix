import React, { useEffect, useState } from "react";
import { storeVideoAsChunks, retrieveVideoFromChunks } from "../utils/indexedDB";

const TestOfflineVideo = () => {
    const [videoUrl, setVideoUrl] = useState<string>(""); // State to store the video URL for playback

    const handleAddVideoToIndexedDB = async () => {
        // const videoId = "sample-video"; // Unique ID for the video
        // const videoPath = "/sample.mp4"; // Path to the video in the public folder
        const videoId = "680ca9134e469cf84a48137e"; // Unique ID for the video
        const videoPath = "http://localhost:4000/api/videos/680ca9134e469cf84a48137e"; // Path to the video in the public folder

        try {
            // Fetch the video from the public folder
            const response = await fetch(videoPath);
            if (!response.ok) {
                throw new Error(`Failed to fetch video: ${response.statusText}`);
            }

            // Get the video as a Blob
            const videoBlob = await response.blob();

            // Store the video in IndexedDB
            await storeVideoAsChunks(videoId, videoBlob);

            // Retrieve the video immediately from IndexedDB
            const retrievedBlob = await retrieveVideoFromChunks(videoId);
            if (retrievedBlob) {
                const videoBlobUrl = URL.createObjectURL(retrievedBlob);
                setVideoUrl(videoBlobUrl); // Update the video URL for playback
            }

            alert("Video has been added and is ready for offline viewing!");
        } catch (error:any) {
            console.error("Error adding video to IndexedDB:", error);
            alert(`Error: ${error.message}`);
        }
    };
    const getVid = async () => {
        const retrievedBlob = await retrieveVideoFromChunks("680ca9134e469cf84a48137e");
            if (retrievedBlob) {
                const videoBlobUrl = URL.createObjectURL(retrievedBlob);
                setVideoUrl(videoBlobUrl); // Update the video URL for playback
            }
    }
    useEffect(()=> {
        getVid();
    })

    return (
        <div style={{ textAlign: "center", margin: "20px" }}>
            <h1>Test Offline Video</h1>
            <p>
                Click the button to add a video from the <strong>public</strong> folder to IndexedDB
                and watch it offline.
            </p>

            {/* Button to Add Video */}
            <button
                onClick={handleAddVideoToIndexedDB}
                style={{ padding: "10px", marginBottom: "20px", cursor: "pointer" }}
            >
                Add Video to IndexedDB
            </button>

            {/* Video Player Section */}
            {videoUrl ? (
                <div>
                    <h2>Video Player</h2>
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
            ) : (
                <p>No video selected for playback yet.</p>
            )}
        </div>
    );
};

export default TestOfflineVideo;
