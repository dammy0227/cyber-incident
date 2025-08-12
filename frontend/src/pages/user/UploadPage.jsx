import React, { useState } from "react";
import useUser from "../../content/useUser";
import { uploadFile } from "../../api/userApi";
import FileUploader from "../../components/FileUploader";

const UploadPage = () => {
  const { email } = useUser();
  const [loading, setLoading] = useState(false);

  // This ref or function will be passed to FileUploader to clear the input after upload
  const [clearFileInput, setClearFileInput] = useState(false);

  const handleUpload = async (file) => {
    if (!email) {
      alert("⚠️ You must be logged in to upload files.");
      return;
    }

    setLoading(true);
    try {
      const res = await uploadFile(email, file);

      alert(res.data.message);

      if (res.data.restricted) {
        // If restricted, stop here
        return;
      }

      // Clear the file input after successful upload
      setClearFileInput(true);

    } catch (error) {
      console.error("Upload error:", error);

      if (error.response && error.response.status === 403) {
        alert("⚠️ Suspicious file upload, blocked: " + (error.response.data.message || ""));
      } else {
        alert("❌ Upload failed.");
      }

      // Clear file input even on failure, if you want
      setClearFileInput(true);
    } finally {
      setLoading(false);
    }
  };

  // Reset clearFileInput after it triggers (to allow next clear)
  const onFileInputCleared = () => setClearFileInput(false);

  return (
    <div className="upload-page">
      <h2>📤 Upload File</h2>
      <FileUploader
        onUpload={handleUpload}
        disabled={!email || loading}
        clearInput={clearFileInput}
        onClear={onFileInputCleared}
      />
      {loading && <p>Uploading file, please wait...</p>}
    </div>
  );
};

export default UploadPage;
