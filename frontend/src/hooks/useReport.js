import { useState } from "react";
import { uploadReport } from "../utils/api";

export const useReport = () => {
  const [language, setLanguage] = useState("English");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState(null);

  const handleUpload = async (file) => {
    setFileName(file.name);
    setResult(null);
    setError(null);
    setLoading(true);
    try {
      const data = await uploadReport(file, language);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
    setFileName(null);
  };

  return { language, setLanguage, loading, result, error, fileName, handleUpload, reset };
};
