import React from 'react';

export default function VideoPage({ params }: { params: { id: string } }) {
    return (
        <main>
            <h1>Video {params.id}</h1>
            <video controls>
                <source src={`http://localhost:4000/api/videos/${params.id}`} type="video/mp4" />
            </video>
        </main>
    );
}
