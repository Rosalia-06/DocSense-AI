import axiosClient from "./axiosClient";

export const getChatHistory = (documentId) =>
  axiosClient.get(`/documents/${documentId}/history`).then((res) => res.data);

export const clearChatHistory = (documentId) =>
  axiosClient.delete(`/documents/${documentId}/history`).then((res) => res.data);

export const getSummary = (documentId) =>
  axiosClient.post(`/documents/${documentId}/summary`).then((res) => res.data);

export const askStream = async (documentId, question, { onToken, onDone, onError }) => {
  const token = localStorage.getItem("docsense_token");
  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/documents/${documentId}/ask/stream`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question }),
      }
    );

    if (!res.ok) {
      const err = new Error("stream_failed");
      err.status = res.status;
      throw err;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      fullText += chunk;
      onToken(fullText);
    }
    onDone(fullText);
  } catch (err) {
    onError(err);
  }
};