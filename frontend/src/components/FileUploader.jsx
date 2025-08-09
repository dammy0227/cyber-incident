import React, { useState } from "react";
import "./components.css";

const FileUploader = ({ onUpload }) => {
  const [file, setFile] = useState(null);

  const handleChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = () => {
    if (file && onUpload) {
      onUpload(file);
    }
  };

  return (
    <div className="file-uploader">
      <p>Select a file to upload</p>
      <input type="file" onChange={handleChange} />
      <button onClick={handleSubmit}>Upload</button>
    </div>
  );
};

export default FileUploader;
