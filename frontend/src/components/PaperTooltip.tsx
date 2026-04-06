import { useState } from "react";
import type { LiteratureReference } from "../types";

interface Props {
  reference: LiteratureReference;
  children: React.ReactNode;
}

export default function PaperTooltip({ reference, children }: Props) {
  const [show, setShow] = useState(false);

  const hasExtra = reference.abstract || reference.tldr || reference.journal;

  if (!hasExtra) {
    return <>{children}</>;
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className="absolute left-0 bottom-full mb-2 z-50 w-80 rounded-xl bg-party-card border border-party-accent/20 p-4 shadow-xl shadow-black/40">
          {/* Title */}
          <p className="text-sm font-semibold text-party-text mb-1">
            {reference.title}
          </p>

          {/* Authors & Year */}
          <p className="text-xs text-party-muted mb-2">
            {reference.authors_full || reference.authors}
            {reference.year && ` (${reference.year})`}
          </p>

          {/* Journal */}
          {reference.journal && (
            <p className="text-xs text-green-400/80 mb-2">
              {reference.journal}
              {reference.citation_count != null && ` · ${reference.citation_count} citations`}
            </p>
          )}

          {/* TL;DR */}
          {reference.tldr && (
            <div className="mb-2">
              <p className="text-xs font-medium text-party-gold mb-0.5">TL;DR</p>
              <p className="text-xs text-party-muted leading-relaxed">{reference.tldr}</p>
            </div>
          )}

          {/* Abstract */}
          {reference.abstract && (
            <div>
              <p className="text-xs font-medium text-party-accent mb-0.5">Abstract</p>
              <p className="text-xs text-party-muted leading-relaxed line-clamp-5">
                {reference.abstract}
              </p>
            </div>
          )}

          {/* Link */}
          {reference.url && (
            <a
              href={reference.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block text-xs text-party-accent hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              View on Semantic Scholar
            </a>
          )}
        </div>
      )}
    </div>
  );
}
