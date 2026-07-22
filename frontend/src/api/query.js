import axiosClient from "./axiosClient";

export const queryAllDocuments = (question) =>
  axiosClient.post("/documents/query", { question }).then((res) => res.data);