import React, { useState } from "react";
import "./components.css";

const FileUploader = ({ onUpload, disabled }) => {
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
      <input type="file" onChange={handleChange} disabled={disabled} />
      <button onClick={handleSubmit} disabled={disabled}>
        Upload
      </button>
      {disabled && <p style={{ color: "red" }}>Please log in to upload files.</p>}
    </div>
  );
};

export default FileUploader;
