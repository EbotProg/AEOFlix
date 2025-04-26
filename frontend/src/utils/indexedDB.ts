// export const openDB = async (): Promise<IDBDatabase> => {
//     return new Promise((resolve, reject) => {
//         const request = indexedDB.open("VideoStorageDB", 1);

//         request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
//             const db = (event.target as IDBOpenDBRequest).result;
//             if (!db.objectStoreNames.contains("videos")) {
//                 db.createObjectStore("videos", { keyPath: "id" });
//             }
//         };

//         request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);
//         request.onerror = (event) => reject((event.target as IDBOpenDBRequest).error);
//     });
// };

// export const storeVideo = async (id: string, videoBlob: Blob) => {
//     const db = await openDB();
//     const transaction = db.transaction("videos", "readwrite");
//     const store = transaction.objectStore("videos");
//     store.put({ id, video: videoBlob });
// };

// export const retrieveVideo = async (id: string): Promise<Blob | null> => {
//     const db = await openDB();
//     const transaction = db.transaction("videos", "readonly");
//     const store = transaction.objectStore("videos");

//     return new Promise((resolve, reject) => {
//         const request = store.get(id);

//         request.onsuccess = () => {
//             if (request.result) {
//                 resolve(request.result.video);
//             } else {
//                 resolve(null);
//             }
//         };

//         request.onerror = () => reject(request.error);
//     });
// };




export const openDB = async (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const indDB: IDBFactory = 
                        window.indexedDB 
                        // ||
                        // (window as any).mozIndexedDB 
                        // || // Use type assertion for non-standard props
                        // (window as any).webkitIndexedDB || 
                        // (window as any).msIndexedDB ||
                        // (window as any).shimIndexedDB; // Fallback for polyfills
        if (!indDB) {
            console.error("Your browser doesn't support IndexedDB.");
            return;
        }
        const request = indDB.open("VideoStorageDB", 1);

        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains("videos")) {
                db.createObjectStore("videos", { keyPath: "id" });
            }
            if (!db.objectStoreNames.contains("videoChunks")) {
                db.createObjectStore("videoChunks", { keyPath: "chunkId" });
            }
        };

        request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);
        request.onerror = (event) => reject((event.target as IDBOpenDBRequest).error);
    });
};

// Function to store video as chunks
export const storeVideoAsChunks = async (id: string, videoBlob: Blob) => {
    const db = await openDB();
    const transaction = db.transaction(["videos", "videoChunks"], "readwrite");

    const storeChunks = transaction.objectStore("videoChunks");

    // Chunking the video Blob
    const CHUNK_SIZE = 90 * 1024 * 1024; // 50 MB chunks
    const totalChunks = Math.ceil(videoBlob.size / CHUNK_SIZE);

    for (let i = 0; i < totalChunks; i++) {
        const chunkBlob = videoBlob.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        const chunkId = `${id}-chunk-${i}`;
        storeChunks.put({ chunkId, data: chunkBlob });
    }
};

// Function to retrieve and reconstruct video from chunks
export const retrieveVideoFromChunks = async (id: string): Promise<Blob | null> => {
    const db = await openDB();
    const transaction = db.transaction("videoChunks", "readonly");
    const storeChunks = transaction.objectStore("videoChunks");

    return new Promise((resolve, reject) => {
        const chunks: Blob[] = [];
        const cursorRequest = storeChunks.openCursor();

        cursorRequest.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
            if (cursor) {
                const record = cursor.value;
                if (record.chunkId.startsWith(id)) {
                    chunks.push(record.data);
                }
                cursor.continue();
            } else {
                if (chunks.length > 0) {
                    // Combine all chunks into a single Blob
                    resolve(new Blob(chunks));
                } else {
                    resolve(null);
                }
            }
        };

        cursorRequest.onerror = () => reject(cursorRequest.error);
    });
};

// Example usage:
// To store a video
// await storeVideoAsChunks("video1", videoBlob);

// To retrieve the video
// const videoBlob = await retrieveVideoFromChunks("video1");
