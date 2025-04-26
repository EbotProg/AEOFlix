import React, { useEffect, useState } from "react";

interface VideoPlayerProps {
    videoId: string; // ID of the video to retrieve
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoId }) => {
    // const [videoUrl, setVideoUrl] = useState<string>("");

    // useEffect(() => {
    //     const fetchVideoUrl = async () => {
    //         const response = await fetch(`http://localhost:4000/api/videos/${videoId}`);
    //         const result = await response.json();
    //         if (response.ok) {
    //             setVideoUrl(result.videoUrl);
    //         } else {
    //             alert(`Error: ${result.error}`);
    //         }
    //     };

    //     fetchVideoUrl();
    // }, [videoId]);

    return (
        <div>
            {videoId ? (
                <video controls style={{ width: "100%", maxHeight: "500px" }}>
                    <source src={`http://localhost:4000/api/videos/${videoId}`} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            ) : (
                <p>Loading video...</p>
            )}
        </div>
    );
};

export default VideoPlayer;
