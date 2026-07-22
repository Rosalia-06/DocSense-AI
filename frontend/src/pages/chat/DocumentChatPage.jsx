import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { getDocument } from "../../api/documents";
import { getChatHistory, clearChatHistory, getSummary, askStream } from "../../api/chat";
import ChatBubble from "../../components/chat/ChatBubble";
import ChatInput from "../../components/chat/ChatInput";

export default function DocumentChatPage() {
  const { id } = useParams();
  const [document, setDocument] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [asking, setAsking] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    getDocument(id).then(setDocument).catch(() => {});
    getChatHistory(id)
      .then((history) => {
        const flat = history.flatMap((turn) => [
          { role: "user", content: turn.question },
          { role: "assistant", content: turn.answer, citations: turn.citations },
        ]);
        setMessages(flat);
      })
      .catch(() => setError("Couldn't load chat history."))
      .finally(() => setLoadingHistory(false));
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (question) => {
    setError("");
    setMessages((prev) => [
      ...prev,
      { role: "user", content: question },
      { role: "assistant", content: "", streaming: true },
    ]);
    setAsking(true);

    askStream(id, question, {
      onToken: (fullText) => {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: fullText,
            streaming: true,
          };
          return updated;
        });
      },
      onDone: (fullText) => {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: fullText };
          return updated;
        });
        setAsking(false);
      },
      onError: (err) => {
        setMessages((prev) => prev.slice(0, -1));
        if (err.status === 429) setError("Too many questions. Slow down and try again shortly.");
        else setError("Something went wrong while generating the answer.");
        setAsking(false);
      },
    });
  };

  const handleSummary = async () => {
    setError("");
    setSummarizing(true);
    try {
      const data = await getSummary(id);
      setMessages((prev) => [
        ...prev,
        { role: "user", content: "Summarize this document" },
        { role: "assistant", content: data.answer, citations: data.citations },
      ]);
    } catch (err) {
      if (err.response?.status === 429) setError("Too many requests. Slow down and try again shortly.");
      else setError("Couldn't generate a summary. Please try again.");
    } finally {
      setSummarizing(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm("Clear all chat history for this document?")) return;
    try {
      await clearChatHistory(id);
      setMessages([]);
    } catch {
      setError("Couldn't clear history. Please try again.");
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-ink-border px-8 py-4">
        <div>
          <h1 className="truncate font-display text-lg font-semibold text-text">
            {document?.filename || "Loading…"}
          </h1>
          <p className="text-xs text-text-faint">Ask questions grounded in this document</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSummary}
            disabled={summarizing}
            className="rounded-lg border border-ink-border px-3 py-1.5 text-xs font-medium text-text-muted transition hover:border-gold/40 hover:text-gold disabled:opacity-50"
          >
            {summarizing ? "Summarizing…" : "Summarize"}
          </button>
          <button
            onClick={handleClearHistory}
            className="rounded-lg border border-ink-border px-3 py-1.5 text-xs font-medium text-text-muted transition hover:border-error/40 hover:text-error"
          >
            Clear history
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        {loadingHistory ? (
          <div className="flex justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <div>
              <p className="text-sm text-text-muted">No messages yet.</p>
              <p className="mt-1 text-xs text-text-faint">Ask a question below to get started.</p>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-4">
            {messages.map((m, i) => (
              <ChatBubble key={i} {...m} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="border-t border-ink-border px-8 py-4">
        <div className="mx-auto max-w-3xl">
          {error && <p className="mb-2 text-sm text-error">{error}</p>}
          <ChatInput onSend={handleSend} disabled={asking} />
        </div>
      </div>
    </div>
  );
}