import { useState } from "react";
import type { LiteratureReference } from "../types";

interface Props {
  reference: LiteratureReference;
  children: React.ReactNode;
}

export default function PaperTooltip({ reference, children }: Props) {
  const [show, setShow] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className="fixed z-[100] w-80 rounded-xl bg-[#1a1230] border border-party-accent/30 p-4 shadow-2xl shadow-black/60"
          style={{
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          {/* Title */}
          <p className="text-sm font-semibold text-white mb-1">
            {reference.title}
          </p>

          {/* Authors & Year */}
          <p className="text-xs text-party-muted mb-2">
            {reference.authors_full || reference.authors}
            {reference.year && ` (${reference.year})`}
          </p>

          {/* Journal */}
          {reference.journal && (
            <p className="text-xs text-green-400 mb-2">
              {reference.journal}
              {reference.citation_count != null && ` · ${reference.citation_count} citations`}
            </p>
          )}

          {/* Stance */}
          <div className="mb-2 rounded bg-party-accent/10 px-2 py-1">
            <p className="text-[10px] uppercase text-party-accent/60 mb-0.5">Stance</p>
            <p className="text-xs text-party-text">{reference.stance}</p>
          </div>

          {/* TL;DR */}
          {reference.tldr && (
            <div className="mb-2">
              <p className="text-[10px] uppercase text-party-gold/60 mb-0.5">TL;DR</p>
              <p className="text-xs text-party-muted leading-relaxed">{reference.tldr}</p>
            </div>
          )}

          {/* Abstract */}
          {reference.abstract ? (
            <div className="mb-2">
              <p className="text-[10px] uppercase text-party-accent/60 mb-0.5">Abstract</p>
              <p className="text-xs text-party-muted leading-relaxed line-clamp-4">
                {reference.abstract}
              </p>
            </div>
          ) : (
            <div className="mb-2">
              <p className="text-[10px] uppercase text-party-accent/60 mb-0.5">Summary</p>
              <p className="text-xs text-party-muted leading-relaxed">
                {reference.summary}
              </p>
            </div>
          )}

          {/* Key Argument */}
          <div className="mb-2">
            <p className="text-[10px] uppercase text-party-warm/60 mb-0.5">Key Argument</p>
            <p className="text-xs text-party-muted leading-relaxed">{reference.key_argument}</p>
          </div>

          {/* Link */}
          {reference.url && (
            <a
              href={reference.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-xs text-party-accent hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              View on Semantic Scholar →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
