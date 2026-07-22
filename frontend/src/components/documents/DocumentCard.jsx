import { useNavigate } from "react-router-dom";
import { formatBytes, formatDate, fileIconType } from "../../lib/formatters";

const iconLabel = { pdf: "PDF", image: "IMG", pptx: "PPTX", file: "DOC" };

export default function DocumentCard({ document, onDelete }) {
  const navigate = useNavigate();

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm(`Delete "${document.filename}"? This can't be undone.`)) {
      onDelete(document.id);
    }
  };

  return (
    <div
      onClick={() => navigate(`/documents/${document.id}`)}
      className="group flex cursor-pointer flex-col justify-between rounded-xl border border-ink-border bg-ink-panel p-4 transition hover:border-gold/40 hover:bg-ink-panelAlt"
    >
      <div className="flex items-start justify-between">
        <span className="rounded-md bg-gold-soft px-2 py-1 font-mono text-[10px] font-medium tracking-wide text-gold">
          {iconLabel[fileIconType(document.filename)]}
        </span>
        <button
          onClick={handleDelete}
          className="text-xs font-medium text-text-faint opacity-0 transition hover:text-error group-hover:opacity-100"
        >
          Delete
        </button>
      </div>
      <p className="mt-4 truncate text-sm font-medium text-text" title={document.filename}>
        {document.filename}
      </p>
      <div className="mt-1 flex items-center gap-2 text-xs text-text-faint">
        <span>{formatBytes(document.file_size)}</span>
        <span>·</span>
        <span>{formatDate(document.uploaded_at)}</span>
      </div>
    </div>
  );
}