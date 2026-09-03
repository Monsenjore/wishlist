"use client";

import { useEffect, useState } from "react";

interface ShareButtonGroupProps {
  title: string;
  viewUrl: string;
}

export function ShareButtonGroup({ title, viewUrl }: ShareButtonGroupProps) {
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(viewUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable or permission denied — button stays as-is
    }
  }

  async function handleShare() {
    try {
      await navigator.share({ title, url: viewUrl });
    } catch {
      // user cancelled the share sheet, or it failed — nothing to do
    }
  }

  const mailtoHref = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(viewUrl)}`;

  const outlinedButtonClasses =
    "rounded-card border border-mist px-5 py-2.5 font-sans text-sm font-medium uppercase text-ink transition-colors hover:border-iris";

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={handleCopy}
        className="w-36 rounded-card bg-iris px-5 py-2.5 text-center font-sans text-sm font-medium uppercase text-white shadow-button transition-opacity hover:opacity-90"
      >
        {copied ? "Copied ✓" : "Copy link"}
      </button>
      <a href={mailtoHref} className={outlinedButtonClasses}>
        Email
      </a>
      {canShare && (
        <button type="button" onClick={handleShare} className={outlinedButtonClasses}>
          Share
        </button>
      )}
    </div>
  );
}
