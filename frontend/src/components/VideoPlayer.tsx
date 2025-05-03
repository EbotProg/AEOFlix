// import React, { useEffect, useState } from "react";
// import Video from 'next-video';
// import getStarted from '/videos/get-started.mp4';

// interface VideoPlayerProps {
//     videoId: string; // ID of the video to retrieve
// }

// const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoId }) => {
//     // const [videoUrl, setVideoUrl] = useState<string>("");

//     // useEffect(() => {
//     //     const fetchVideoUrl = async () => {
//     //         const response = await fetch(`http://localhost:4000/api/videos/${videoId}`);
//     //         const result = await response.json();
//     //         if (response.ok) {
//     //             setVideoUrl(result.videoUrl);
//     //         } else {
//     //             alert(`Error: ${result.error}`);
//     //         }
//     //     };

//     //     fetchVideoUrl();
//     // }, [videoId]);

//     return (
//         <div>
//             {videoId ? (
//                 <video controls style={{ width: "100%", maxHeight: "500px" }}>
//                     <source src={`http://localhost:4000/api/videos/${videoId}`} type="video/mp4" />
//                     Your browser does not support the video tag.
//                 </video>
//  //<iframe style={{ width: "100%", maxHeight: "500px" }} src={`http://localhost:4000/api/videos/${videoId}`} allowFullScreen />
// // <Video style={{ width: "100%", maxHeight: "500px" }} src={`http://localhost:4000/api/videos/${videoId}`} /> 
//             ) : (
//                 <p>Loading video...</p>
//             )}
//         </div>
//     );
// };

// export default VideoPlayer;

import { useEffect, useRef, useState } from 'react';

interface VideoPlayerProps {
  videoId: string;
  apiBaseUrl: string;
  // Add optional props for controlling caching behavior
  enableClientCache?: boolean;
  preloadSegments?: boolean;
}

const VideoPlayer = ({ 
  videoId, 
  apiBaseUrl, 
  enableClientCache = true,
  preloadSegments = false
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Track seek positions to enhance caching behavior
  const [seekHistory, setSeekHistory] = useState<Set<number>>(new Set());
  const memoryCache = useRef<Map<string, Blob>>(new Map());
  
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handleError = () => {
      setError('Failed to load video. Please try again.');
      setIsLoading(false);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
      setError(null);
    };
    
    // Add tracking for seeking behavior to improve caching
    const handleSeeking = () => {
      if (!videoElement) return;
      
      // Round to nearest 5 seconds for more practical caching
      const currentTime = Math.floor(videoElement.currentTime / 5) * 5;
      
      // Add to seek history
      if (!seekHistory.has(currentTime)) {
        const newSeekHistory = new Set(seekHistory);
        newSeekHistory.add(currentTime);
        setSeekHistory(newSeekHistory);
        
        // If preloading is enabled, we could preload the next segment
        if (preloadSegments) {
          preloadSegment(currentTime + 30); // Preload 30 seconds ahead
        }
      }
    };

    // Add event listeners
    videoElement.addEventListener('canplay', handleCanPlay);
    videoElement.addEventListener('error', handleError);
    videoElement.addEventListener('loadstart', handleLoadStart);
    videoElement.addEventListener('seeking', handleSeeking);

    // Clean up
    return () => {
      videoElement.removeEventListener('canplay', handleCanPlay);
      videoElement.removeEventListener('error', handleError);
      videoElement.removeEventListener('loadstart', handleLoadStart);
      videoElement.removeEventListener('seeking', handleSeeking);
    };
  }, [videoId, seekHistory, preloadSegments]);
  
  // Function to preload video segments
  const preloadSegment = async (timeInSeconds: number) => {
    if (!enableClientCache || timeInSeconds < 0) return;
  
    try {
      const estimatedBytesPerSecond = 500_000; // Adjust based on actual bitrate
      const chunkSizeBytes = 5 * 1024 * 1024; // 90MB
      const startByte = Math.floor(timeInSeconds * estimatedBytesPerSecond);
      const endByte = startByte + chunkSizeBytes - 1;
  
      const cacheKey = `${videoId}-${startByte}-${endByte}`;
  
      if (memoryCache.current.has(cacheKey)) {
        console.log(`Segment already in memory cache: ${cacheKey}`);
        return;
      }
  
      console.log(`Preloading 90MB segment: ${startByte}-${endByte} bytes`);
  
      const response = await fetch(`${apiBaseUrl}/videos/${videoId}/stream`, {
        headers: {
          Range: `bytes=${startByte}-${endByte}`
        }
      });
  
      if (!response.ok) return;
  
      const blob = await response.blob();
      memoryCache.current.set(cacheKey, blob);
  
      if (memoryCache.current.size > 20) {
        const keysList = Array.from(memoryCache.current.keys());
        if (keysList.length > 0) {
          const oldestKey = keysList[0];
          memoryCache.current.delete(oldestKey);
        }
      }
  
      console.log(`Cached segment: ${cacheKey}, size: ${blob.size} bytes`);
    } catch (err) {
      console.error('Error preloading segment:', err);
    }
  };
  

  return (
    <div className="video-container">
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Loading video...</p>
        </div>
      )}
      
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => videoRef.current?.load()}>
            Retry
          </button>
        </div>
      )}
      
      <video 
        ref={videoRef}
        controls
        width="100%"
        height="auto"
        preload="auto"
        src={`${apiBaseUrl}/videos/${videoId}`}
        onTimeUpdate={() => {
          // Optional: track playback for analytics or improved caching
          const currentTime = videoRef.current?.currentTime || 0;
          const roundedTime = Math.floor(currentTime / 30) * 30; // Round to 30-second intervals
          
          // Preload next segment if we're approaching the end of current segment
          if (preloadSegments && 
              currentTime % 30 > 25 && // If we're in the last 5 seconds of a 30-second segment
              !seekHistory.has(roundedTime + 30)) { // And we haven't preloaded the next segment
            preloadSegment(roundedTime + 30);
          }
        }}
      />
      
      <style jsx>{`
        .video-container {
          position: relative;
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
        }
        
        .loading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background-color: rgba(0, 0, 0, 0.6);
          color: white;
          z-index: 2;
        }
        
        .spinner {
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top: 4px solid white;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin-bottom: 10px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .error-message {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background-color: rgba(0, 0, 0, 0.8);
          color: white;
          z-index: 3;
        }
        
        .error-message button {
          margin-top: 10px;
          padding: 8px 16px;
          background-color: #e50914;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default VideoPlayer;

// Example usage in a page component:
/*
import VideoPlayer from '../components/VideoPlayer';

export default function VideoPage() {
  return (
    <div>
      <h1>My Video</h1>
      <VideoPlayer 
        videoId="your-video-id-here" 
        apiBaseUrl="http://localhost:3001/api" 
      />
    </div>
  );
}
*/