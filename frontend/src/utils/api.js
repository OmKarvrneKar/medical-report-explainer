import api from "../api/axios";

export const uploadReport = async (file, language) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("language", language);

  const response = await api.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const fetchHistory = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const response = await api.get(`/history?skip=${skip}&limit=${limit}`);
  return response.data;
};

export const fetchReportById = async (id) => {
  const response = await api.get(`/report/${id}`);
  return response.data;
};

export const deleteReport = async (id) => {
  const response = await api.delete(`/report/${id}`);
  return response.data;
};

export const exportReportPdf = async (reportId) => {
  const response = await api.get(`/export/${reportId}`, {
    responseType: "blob",   // important — tells axios to treat response as binary
  });
  return response.data;
};
