"use client";

import { normalizeUsername } from "@/lib/helpers";

export default function MentionedText({
  text,
  currentUsername,
  className = "",
}: {
  text: string;
  currentUsername?: string;
  className?: string;
}) {
  const ownUsername = normalizeUsername(currentUsername || "");
  const parts = text.split(/(@[a-zA-Z0-9_.]{3,20})/g);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        const isMention = part.startsWith("@");
        const username = isMention ? normalizeUsername(part.slice(1)) : "";
        const isOwnMention = Boolean(ownUsername && username === ownUsername);

        if (!isMention) return <span key={`${part}-${index}`}>{part}</span>;

        return (
          <span
            key={`${part}-${index}`}
            className={
              isOwnMention
                ? "rounded-lg border border-blue-300/40 bg-blue-500/25 px-1.5 py-0.5 font-black text-blue-100 shadow-sm shadow-blue-500/20"
                : "font-black text-blue-300"
            }
          >
            {part}
          </span>
        );
      })}
    </span>
  );
}
