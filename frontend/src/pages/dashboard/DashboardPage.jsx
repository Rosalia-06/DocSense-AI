import { useEffect, useState } from "react";
import { listDocuments, uploadDocument, deleteDocument } from "../../api/documents";
import UploadDropzone from "../../components/documents/UploadDropzone";
import DocumentCard from "../../components/documents/DocumentCard";

export default function DashboardPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const fetchDocuments = () => {
    setLoading(true);
    listDocuments()
      .then(setDocuments)
      .catch(() => setError("Couldn't load your documents. Refresh to try again."))
      .finally(() => setLoading(false));
  };

  useEffect(fetchDocuments, []);

  const handleUpload = async (file) => {
    setError("");
    setUploading(true);
    try {
      const newDoc = await uploadDocument(file);
      setDocuments((prev) => [newDoc, ...prev]);
    } catch (err) {
      const status = err.response?.status;
      if (status === 429) setError("Too many uploads. Slow down and try again shortly.");
      else if (status === 413) setError("File is too large. Max size is 20MB.");
      else if (status === 400) setError(err.response?.data?.detail || "That file type isn't supported.");
      else setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (documentId) => {
    const prev = documents;
    setDocuments((d) => d.filter((doc) => doc.id !== documentId));
    try {
      await deleteDocument(documentId);
    } catch {
      setDocuments(prev);
      setError("Couldn't delete that document. Please try again.");
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      <h1 className="font-display text-2xl font-semibold text-text">Documents</h1>
      <p className="mt-1 text-sm text-text-muted">
        Upload a document, then open it to ask questions grounded in its content.
      </p>

      <div className="mt-6">
        <UploadDropzone onFileSelected={handleUpload} uploading={uploading} />
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-error/30 bg-error/10 px-3.5 py-2.5 text-sm text-error">
          {error}
        </div>
      )}

      <div className="mt-8">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          </div>
        ) : documents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-ink-border py-16 text-center">
            <p className="text-sm text-text-muted">No documents yet.</p>
            <p className="mt-1 text-xs text-text-faint">Upload your first file above to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => (
              <DocumentCard key={doc.id} document={doc} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}