import { useState } from "react";

export default function CitationChip({ citation, index }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="mr-1.5 mt-1.5 inline-flex items-center gap-1 rounded-md border border-gold/30 bg-gold-soft px-2 py-1 font-mono text-[11px] font-medium text-gold transition hover:border-gold/60"
      >
        [{index + 1}] {citation.document_name}
      </button>
      {open && (
        <div className="mt-2 rounded-lg border border-ink-border bg-ink-panelAlt p-3 text-xs">
          <div className="mb-1.5 flex items-center justify-between text-text-faint">
            <span className="font-medium text-text-muted">{citation.document_name}</span>
            <span className="font-mono">chunk {citation.chunk_index}</span>
          </div>
          <p className="leading-relaxed text-text-muted">{citation.snippet}</p>
        </div>
      )}
    </div>
  );
}