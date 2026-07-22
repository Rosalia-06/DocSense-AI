import { useState } from "react";
import { queryAllDocuments } from "../../api/query";
import MultiDocCitationChip from "../../components/search/MultiDocCitationChip";

export default function MultiDocSearchPage() {
  const [question, setQuestion] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    setError("");
    setLoading(true);
    const askedQuestion = trimmed;
    setQuestion("");

    try {
      const data = await queryAllDocuments(askedQuestion);
      setResults((prev) => [
        { question: askedQuestion, answer: data.answer, citations: data.citations },
        ...prev,
      ]);
    } catch (err) {
      if (err.response?.status === 429) setError("Too many searches. Slow down and try again shortly.");
      else setError("Something went wrong while searching. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <h1 className="font-display text-2xl font-semibold text-text">
        Search all documents
      </h1>
      <p className="mt-1 text-sm text-text-muted">
        Ask one question across everything you've uploaded — answers cite which
        document each fact came from.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex items-end gap-2">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          disabled={loading}
          rows={1}
          placeholder="e.g. What's our total contracted spend across all vendors?"
          className="max-h-40 flex-1 resize-none rounded-xl border border-ink-border bg-ink-panel px-4 py-3 text-sm text-text placeholder:text-text-faint focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="rounded-xl bg-gold px-4 py-3 text-sm font-semibold text-ink-bg transition hover:bg-gold/90 disabled:opacity-40"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-error">{error}</p>}

      {loading && (
        <div className="mt-6 flex items-center gap-2 text-sm text-text-muted">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          Searching across your documents…
        </div>
      )}

      <div className="mt-8 flex flex-col gap-6">
        {results.length === 0 && !loading ? (
          <div className="rounded-xl border border-dashed border-ink-border py-16 text-center">
            <p className="text-sm text-text-muted">No searches yet.</p>
            <p className="mt-1 text-xs text-text-faint">
              Ask something above to search across all your documents.
            </p>
          </div>
        ) : (
          results.map((r, i) => (
            <div key={i} className="rounded-xl border border-ink-border bg-ink-panel p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-text-faint">
                You asked
              </p>
              <p className="mt-1 text-sm font-medium text-text">{r.question}</p>

              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-text-faint">
                Answer
              </p>
              <p className="mt-1 text-sm leading-relaxed text-text">{r.answer}</p>

              {r.citations?.length > 0 && (
                <div className="mt-3 flex flex-wrap">
                  {r.citations.map((c, ci) => (
                    <MultiDocCitationChip key={ci} citation={c} index={ci} />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}