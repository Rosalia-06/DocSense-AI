import { useState } from "react";

export default function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        rows={1}
        placeholder="Ask a question about this document…"
        className="max-h-40 flex-1 resize-none rounded-xl border border-ink-border bg-ink-panel px-4 py-3 text-sm text-text placeholder:text-text-faint focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="rounded-xl bg-gold px-4 py-3 text-sm font-semibold text-ink-bg transition hover:bg-gold/90 disabled:opacity-40"
      >
        Send
      </button>
    </form>
  );
}