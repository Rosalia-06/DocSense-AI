import axiosClient from "./axiosClient";

export const listDocuments = () =>
  axiosClient.get("/documents/").then((res) => res.data);

export const getDocument = (documentId) =>
  axiosClient.get(`/documents/${documentId}`).then((res) => res.data);

export const uploadDocument = (file, onUploadProgress) => {
  const formData = new FormData();
  formData.append("file", file);
  return axiosClient
    .post("/documents/upload", formData, {
      onUploadProgress,
    })
    .then((res) => res.data);
};

export const deleteDocument = (documentId) =>
  axiosClient.delete(`/documents/${documentId}`).then((res) => res.data);