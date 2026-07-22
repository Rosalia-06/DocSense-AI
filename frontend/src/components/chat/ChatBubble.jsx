import CitationChip from "./CitationChip";

export default function ChatBubble({ role, content, citations, streaming }) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[75%] ${isUser ? "" : "w-full"}`}>
        <div
          className={`rounded-chat px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "bg-userMsg text-white"
              : "border border-ink-border bg-ink-panel text-text"
          }`}
        >
          {content}
          {streaming && (
            <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-gold align-middle" />
          )}
        </div>
        {citations?.length > 0 && (
          <div className="mt-2 flex flex-wrap">
            {citations.map((c, i) => (
              <CitationChip key={i} citation={c} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}