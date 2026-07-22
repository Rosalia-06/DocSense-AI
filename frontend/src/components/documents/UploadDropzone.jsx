import { useRef, useState } from "react";

const ACCEPTED = [".pdf", ".png", ".jpg", ".jpeg", ".pptx"];
const MAX_SIZE = 20 * 1024 * 1024;

export default function UploadDropzone({ onFileSelected, uploading }) {
  const [dragActive, setDragActive] = useState(false);
  const [localError, setLocalError] = useState("");
  const inputRef = useRef(null);

  const validate = (file) => {
    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (!ACCEPTED.includes(ext)) {
      setLocalError("Unsupported file type. Use PDF, PNG, JPG, JPEG, or PPTX.");
      return false;
    }
    if (file.size > MAX_SIZE) {
      setLocalError("File is too large. Max size is 20MB.");
      return false;
    }
    setLocalError("");
    return true;
  };

  const handleFile = (file) => {
    if (validate(file)) onFileSelected(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
          dragActive
            ? "border-gold bg-gold-soft/40"
            : "border-ink-border bg-ink-panel hover:border-ink-border/80 hover:bg-ink-panelAlt/40"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        {uploading ? (
          <>
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gold border-t-transparent" />
            <p className="mt-3 text-sm text-text-muted">Uploading document…</p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-text">
              Drop a file here, or click to browse
            </p>
            <p className="mt-1 text-xs text-text-faint">
              PDF, PNG, JPG, JPEG, PPTX — up to 20MB
            </p>
          </>
        )}
      </div>
      {localError && (
        <p className="mt-2 text-sm text-error">{localError}</p>
      )}
    </div>
  );
}