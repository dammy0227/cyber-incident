// src/pages/user/UploadPage.jsx
import React from "react";
import useUser from "../../content/useUser";
import { uploadFile } from "../../api/userApi";
import FileUploader from "../../components/FileUploader";

const UploadPage = () => {
  const { email } = useUser();

  const handleUpload = async (file) => {
    if (!email) {
      alert("⚠️ You must be logged in to upload files.");
      return;
    }

    try {
      const res = await uploadFile(email, file);

      if (res.data.restricted) {
        alert(res.data.message);
        return;
      }

      alert("✅ File upload successful.");
    } catch (error) {
      console.error("Upload error:", error);
      alert("❌ Upload failed.");
    }
  };

  return (
    <div className="upload-page">
      <h2>📤 Upload File</h2>
      <FileUploader onUpload={handleUpload} />
    </div>
  );
};

export default UploadPage;
