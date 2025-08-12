import React, { useState, useEffect, useRef } from "react";
import "./components.css";

const FileUploader = ({ onUpload, disabled, clearInput, onClear }) => {
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = () => {
    if (file && onUpload) {
      onUpload(file);
      setFile(null);
      // Clear native input value too
      if (fileInputRef.current) {
        fileInputRef.current.value = null;
      }
    }
  };

  // When clearInput becomes true, reset file input and local state
  useEffect(() => {
    if (clearInput) {
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = null;
      }
      if (onClear) onClear();
    }
  }, [clearInput, onClear]);

  return (
    <div className="file-uploader">
      <p>Select a file to upload</p>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleChange}
        disabled={disabled}
      />
      <button onClick={handleSubmit} disabled={disabled}>
        Upload
      </button>
      {disabled && <p style={{ color: "red" }}>Please log in to upload files.</p>}
    </div>
  );
};

export default FileUploader;
