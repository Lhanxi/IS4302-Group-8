import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import "./DoctorPage.css"; // Import CSS file

const DoctorPage = () => {
    const [file, setFile] = useState(null);

    const { getRootProps, getInputProps } = useDropzone({
        accept: "*",
        onDrop: (acceptedFiles) => {
            setFile(acceptedFiles[0]); // Store the selected file
        },
    });

    return (
        <div className="container">
            <div className="upload-box">
                <h2>Upload a File</h2>

                <div {...getRootProps()} className="dropzone">
                    <input {...getInputProps()} />
                    <p>Drag & drop a file here, or click to select</p>
                </div>

                {file && (
                    <p className="file-info">
                        Selected: {file.name}
                    </p>
                )}
            </div>
        </div>
    );
};

export default DoctorPage;
