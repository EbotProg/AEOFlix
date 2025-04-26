import React from "react";

interface FileUploaderProps {
    onUploadSuccess: (id: string) => void; // Callback for successful upload
}

const FileUploader: React.FC<FileUploaderProps> = ({ onUploadSuccess }) => {
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            alert("Please select a file.");
            return;
        }

        const formData = new FormData();
        formData.append("video", file);

        const response = await fetch("http://localhost:4000/api/videos/upload", {
            method: "POST",
            body: formData,
        });

        const result = await response.json();
        if (response.ok) {
            console.log('hello result', result)
            onUploadSuccess(result.video._id); // Pass the file path to the parent component
            alert("File uploaded successfully!");
        } else {
            alert(`Error: ${result.error}`);
        }
    };

    return (
        <div>
            <h2>Upload a Video</h2>
            <input type="file" onChange={handleFileUpload} />
        </div>
    );
};

export default FileUploader;
