"use client";

import { useEffect, useRef, useState } from "react";

interface InlineEditableFieldProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  as?: "input" | "textarea";
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  /** Show the character counter once the draft exceeds this length (defaults to maxLength). */
  counterThreshold?: number;
  /** Typography classes applied to both the static text and the input, so entering edit mode causes no layout jump. */
  className?: string;
  ariaLabel?: string;
  /** Custom read-only rendering (e.g. a link icon + hostname for URL fields). Falls back to plain text. */
  renderValue?: (value: string) => React.ReactNode;
}

export function InlineEditableField({
  value,
  onSave,
  as = "input",
  placeholder,
  required = false,
  maxLength,
  counterThreshold,
  className = "",
  ariaLabel,
  renderValue,
}: InlineEditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [displayValue, setDisplayValue] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [requiredHint, setRequiredHint] = useState(false);
  const [saved, setSaved] = useState(false);
  const savedTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Deliberately keyed only on `value` (not `editing`): syncing on the editing→false
  // transition itself would race the optimistic commit(), which flips `editing` off
  // before the parent's async save resolves and its new `value` prop arrives — that
  // ordering briefly re-synced this field back to the stale pre-edit value.
  useEffect(() => {
    setDisplayValue(value);
    setDraft(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    return () => {
      if (savedTimeout.current) clearTimeout(savedTimeout.current);
      if (hintTimeout.current) clearTimeout(hintTimeout.current);
    };
  }, []);

  function startEditing() {
    setDraft(displayValue);
    setError(null);
    setEditing(true);
  }

  async function commit() {
    const trimmed = draft.trim();

    if (required && trimmed.length === 0) {
      setDraft(displayValue);
      setEditing(false);
      setRequiredHint(true);
      if (hintTimeout.current) clearTimeout(hintTimeout.current);
      hintTimeout.current = setTimeout(() => setRequiredHint(false), 2500);
      return;
    }

    setEditing(false);

    if (trimmed === displayValue.trim()) return;

    const previous = displayValue;
    setDisplayValue(trimmed);
    setError(null);

    try {
      await onSave(trimmed);
      setSaved(true);
      if (savedTimeout.current) clearTimeout(savedTimeout.current);
      savedTimeout.current = setTimeout(() => setSaved(false), 2000);
    } catch {
      setDisplayValue(previous);
      setError("Couldn't save — try again");
    }
  }

  const showCounter =
    as === "textarea" &&
    typeof maxLength === "number" &&
    draft.length > (counterThreshold ?? maxLength);

  if (!editing) {
    return (
      <span className="inline-flex flex-col gap-1">
        <span
          role="button"
          tabIndex={0}
          aria-label={ariaLabel}
          onClick={startEditing}
          onFocus={startEditing}
          className={`inline-block cursor-text border-b border-dotted border-transparent transition-colors hover:border-mist focus:outline-none ${className} ${
            !displayValue ? "text-fog" : ""
          }`}
        >
          {displayValue ? (renderValue ? renderValue(displayValue) : displayValue) : placeholder}
        </span>
        {saved && (
          <span className="font-mono text-[11px] uppercase tracking-[0.22px] text-iris">
            Saved
          </span>
        )}
        {requiredHint && <span className="text-xs text-signal">Required</span>}
        {error && <span className="text-xs text-signal">{error}</span>}
      </span>
    );
  }

  return (
    <span className="inline-flex w-full flex-col gap-1">
      {as === "textarea" ? (
        <textarea
          autoFocus
          value={draft}
          maxLength={maxLength}
          placeholder={placeholder}
          aria-label={ariaLabel}
          rows={3}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
          className={`w-full resize-none rounded-card border border-iris px-3 py-2 outline-none ${className}`}
        />
      ) : (
        <input
          autoFocus
          value={draft}
          maxLength={maxLength}
          placeholder={placeholder}
          aria-label={ariaLabel}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
          className={`w-full rounded-card border border-iris px-3 py-2 outline-none ${className}`}
        />
      )}
      {showCounter && (
        <span className="text-xs text-fog">
          {draft.length}/{maxLength}
        </span>
      )}
    </span>
  );
}
