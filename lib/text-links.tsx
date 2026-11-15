import React from "react";
import { ExternalLink } from "lucide-react";

/**
 * Renders text with clickable, stop-propagation links for any embedded URL
 * or an optional direct link. Prevents parent task/subtask checkbox toggle.
 */
export function renderLinkedText(text: string, directLink?: string): React.ReactNode {
  const urlRegex = /(https?:\/\/[^\s)]+)/g;
  const parts = text.split(urlRegex);

  if (parts.length > 1) {
    return (
      <span className="inline">
        {parts.map((part, i) => {
          if (part.match(/^https?:\/\//)) {
            const cleanUrl = part.replace(/[.,;)]+$/, "");
            return (
              <a
                key={i}
                href={cleanUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-0.5 text-forest underline hover:text-[#2c3d27] font-medium mx-1 break-all cursor-pointer"
                title={cleanUrl}
              >
                <span>{cleanUrl.length > 32 ? cleanUrl.slice(0, 29) + "..." : cleanUrl}</span>
                <ExternalLink size={9} className="shrink-0 inline ml-0.5" />
              </a>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </span>
    );
  }

  if (directLink) {
    return (
      <span className="inline-flex items-center flex-wrap gap-1">
        <span>{text}</span>
        <a
          href={directLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-0.5 text-forest underline hover:text-[#2c3d27] font-medium cursor-pointer"
          title={directLink}
        >
          <span>Open link</span>
          <ExternalLink size={9} className="shrink-0 inline ml-0.5" />
        </a>
      </span>
    );
  }

  return text;
}
