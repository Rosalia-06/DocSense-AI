import axiosClient from "./axiosClient";

export const listAllUsers = () =>
  axiosClient.get("/admin/users").then((res) => res.data);

export const forceDeleteDocument = (documentId) =>
  axiosClient.delete(`/admin/documents/${documentId}`).then((res) => res.data);