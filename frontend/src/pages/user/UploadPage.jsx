import React, { useState } from "react";
import useUser from "../../content/useUser";
import { uploadFile } from "../../api/userApi";
import FileUploader from "../../components/FileUploader";

const UploadPage = () => {
  const { email } = useUser();
  const [loading, setLoading] = useState(false);

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

      // Optionally: reset uploader or additional success logic

    } catch (error) {
      console.error("Upload error:", error);
      alert("❌ Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-page">
      <h2>📤 Upload File</h2>
      <FileUploader onUpload={handleUpload} disabled={!email || loading} />
      {loading && <p>Uploading file, please wait...</p>}
    </div>
  );
};

export default UploadPage;
